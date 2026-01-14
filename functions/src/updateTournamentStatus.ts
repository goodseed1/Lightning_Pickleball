/**
 * 🚀 Cloud Function: updateTournamentStatus
 * Server-side tournament status management with state machine validation
 *
 * Phase 1: Server-Side Migration
 * Safely manages tournament lifecycle with business logic validation
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  UpdateTournamentStatusRequest,
  UpdateTournamentStatusResponse,
  TournamentStatus,
} from './types/tournament';
import { validateStateTransition } from './utils/stateMachine';
import { validateCanStartTournament } from './utils/tournamentValidators';
import { sendTournamentStatusChangeNotification } from './utils/tournamentNotificationSender';
import { verifyClubMembership } from './utils/tournamentValidators';
import { updateTournamentPlacementStats } from './utils/tournamentPlacementUpdater';
import { calculateClubElo, ClubMatchResult } from './utils/clubEloCalculator';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ============================================================================
 * Cloud Function: updateTournamentStatus
 * ============================================================================
 *
 * Updates tournament status with validation and notifications
 *
 * Security:
 * - Requires authentication
 * - Only tournament host or club admins can update status
 * - Validates state transitions via state machine
 * - Enforces business rules (e.g., min participants before starting)
 *
 * Atomicity:
 * - Uses Firestore transactions for atomic updates
 * - Ensures status consistency
 *
 * Notifications:
 * - Sends status change notifications to all participants
 *
 * State Transitions:
 * - draft → registration | cancelled
 * - registration → bracket_generation | cancelled
 * - bracket_generation → in_progress | registration | cancelled
 * - in_progress → completed | cancelled
 * - completed → (terminal)
 * - cancelled → (terminal)
 *
 * @param data - UpdateTournamentStatusRequest
 * @param context - Authenticated user context
 * @returns UpdateTournamentStatusResponse
 */
export const updateTournamentStatus = onCall<
  UpdateTournamentStatusRequest,
  Promise<UpdateTournamentStatusResponse>
>(async request => {
  const { data, auth } = request;

  console.log('🔄 [UPDATE STATUS] Starting status update process');

  // ==========================================================================
  // 1. Authentication
  // ==========================================================================

  if (!auth || !auth.uid) {
    console.error('❌ [UPDATE STATUS] Unauthorized: No auth context');
    throw new HttpsError('unauthenticated', 'You must be logged in to update tournament status');
  }

  const userId = auth.uid;

  console.log(`👤 [UPDATE STATUS] User: ${userId}`);
  console.log(`🎯 [UPDATE STATUS] Tournament: ${data.tournamentId}`);
  console.log(`📊 [UPDATE STATUS] New Status: ${data.newStatus}`);

  // ==========================================================================
  // 2. Tournament Validation & Status Update (Transaction)
  // ==========================================================================

  try {
    const result = await db.runTransaction(async transaction => {
      const tournamentRef = db.doc(`tournaments/${data.tournamentId}`);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournamentData = tournamentDoc.data()!;
      const currentStatus = tournamentData.status as TournamentStatus;

      console.log(`🏆 [UPDATE STATUS] Tournament: ${tournamentData.tournamentName}`);
      console.log(`📍 [UPDATE STATUS] Current Status: ${currentStatus}`);

      // ======================================================================
      // 3. Authorization Check
      // ======================================================================

      const isHost = tournamentData.createdBy === userId;
      let isClubAdmin = false;

      if (!isHost) {
        // Check if user is club admin
        const membershipCheck = await verifyClubMembership(userId, tournamentData.clubId, [
          'admin',
          'owner',
          'manager',
        ]);

        isClubAdmin = membershipCheck.isValid;
      }

      if (!isHost && !isClubAdmin) {
        console.error(`❌ [UPDATE STATUS] User ${userId} is not authorized`);
        throw new HttpsError(
          'permission-denied',
          'Only tournament host or club admins can update tournament status'
        );
      }

      console.log(`✅ [UPDATE STATUS] User authorized: ${isHost ? 'Host' : 'Club Admin'}`);

      // ======================================================================
      // 4. State Transition Validation
      // ======================================================================

      const transitionValidation = validateStateTransition(currentStatus, data.newStatus);

      if (!transitionValidation.isValid) {
        console.error(`❌ [UPDATE STATUS] Invalid transition: ${transitionValidation.error}`);
        throw new HttpsError(
          'failed-precondition',
          transitionValidation.error || 'Invalid status transition'
        );
      }

      console.log(`✅ [UPDATE STATUS] State transition validated`);

      // ======================================================================
      // 5. Business Logic Validation
      // ======================================================================

      // Validate starting tournament (transitioning to 'in_progress')
      if (data.newStatus === 'in_progress') {
        const startValidation = validateCanStartTournament(
          tournamentData.participantCount || 0,
          tournamentData.settings.minParticipants
        );

        if (!startValidation.isValid) {
          console.error(`❌ [UPDATE STATUS] Cannot start: ${startValidation.error}`);
          throw new HttpsError(
            'failed-precondition',
            startValidation.error || 'Tournament cannot be started'
          );
        }

        console.log(`✅ [UPDATE STATUS] Start validation passed`);
      }

      // ======================================================================
      // 6. Gather Participant IDs for Notifications
      // ======================================================================

      const participantsSnapshot = await transaction.get(
        db.collection(`tournaments/${data.tournamentId}/participants`)
      );

      const participantIds: string[] = [];

      participantsSnapshot.forEach(doc => {
        const participantData = doc.data();

        // Extract individual player IDs (handle both singles and doubles)
        const playerId = participantData.playerId;

        if (playerId.includes('_')) {
          // Doubles: split "player1Id_player2Id"
          const [player1, player2] = playerId.split('_');
          participantIds.push(player1, player2);
        } else {
          // Singles
          participantIds.push(playerId);
        }

        // Also add partner if present (redundant for doubles, but safe)
        if (participantData.partnerId && !participantIds.includes(participantData.partnerId)) {
          participantIds.push(participantData.partnerId);
        }
      });

      // Remove duplicates
      const uniqueParticipantIds = Array.from(new Set(participantIds));

      console.log(`📢 [UPDATE STATUS] Will notify ${uniqueParticipantIds.length} participants`);

      // ======================================================================
      // 7. Update Tournament Status (Atomic)
      // ======================================================================

      const now = admin.firestore.FieldValue.serverTimestamp();

      const updateData: Record<string, unknown> = {
        status: data.newStatus,
        updatedAt: now,
      };

      // Add cancellation reason if provided
      if (data.newStatus === 'cancelled' && data.reason) {
        updateData.cancellationReason = data.reason;
        updateData.cancelledAt = now;
        updateData.cancelledBy = userId;
      }

      // Add completion timestamp if completed
      if (data.newStatus === 'completed') {
        updateData.completedAt = now;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.update(tournamentRef, updateData as any);

      // Log activity
      const activityRef = db.collection('activities').doc();
      transaction.set(activityRef, {
        type: 'tournament_status_changed',
        userId,
        tournamentId: data.tournamentId,
        tournamentName: tournamentData.tournamentName,
        previousStatus: currentStatus,
        newStatus: data.newStatus,
        reason: data.reason || null,
        timestamp: now,
      });

      console.log(`✅ [UPDATE STATUS] Status updated: ${currentStatus} → ${data.newStatus}`);

      return {
        tournamentName: tournamentData.tournamentName,
        previousStatus: currentStatus,
        participantIds: uniqueParticipantIds,
        isCompleting: data.newStatus === 'completed', // 🌉 [HEIMDALL] Flag for post-transaction processing
      };
    });

    // ========================================================================
    // 8. Send Notifications (After Transaction)
    // ========================================================================

    const { tournamentName, previousStatus, participantIds, isCompleting } = result;

    // Send status change notifications to all participants
    sendTournamentStatusChangeNotification(
      data.tournamentId,
      tournamentName,
      data.newStatus,
      participantIds
    )
      .then(() => {
        console.log('✅ [UPDATE STATUS] Status change notifications sent');
      })
      .catch(error => {
        console.error('❌ [UPDATE STATUS] Failed to send notifications:', error);
      });

    // ========================================================================
    // 8.5. Update Tournament Placement Statistics (After Transaction)
    // ========================================================================

    if (isCompleting) {
      console.log('🌉 [HEIMDALL] Tournament completing, updating placement stats...');

      updateTournamentPlacementStats(data.tournamentId)
        .then(() => {
          console.log('✅ [HEIMDALL] Placement stats updated successfully');
        })
        .catch(error => {
          console.error('❌ [HEIMDALL] Failed to update placement stats:', error);
          // Don't throw - tournament is already completed
        });

      // ======================================================================
      // 8.6. Calculate Club ELO for Tournament Matches (After Transaction)
      // ======================================================================

      console.log('🌉 [HEIMDALL] Calculating Club ELO for tournament matches...');

      (async () => {
        try {
          const tournamentDoc = await db.collection('tournaments').doc(data.tournamentId).get();

          if (!tournamentDoc.exists) {
            console.error('❌ [HEIMDALL] Tournament not found for ELO calculation');
            return;
          }

          const tournamentData = tournamentDoc.data()!;
          const clubId = tournamentData.clubId;

          // Get all completed matches from tournament
          const matchesSnapshot = await db
            .collection('matches')
            .where('tournamentId', '==', data.tournamentId)
            .where('status', '==', 'completed')
            .get();

          console.log(`🌉 [HEIMDALL] Found ${matchesSnapshot.size} completed matches`);

          // Process each match
          const eloPromises = matchesSnapshot.docs.map(async matchDoc => {
            const matchData = matchDoc.data();

            // Skip if already processed (check if match history exists)
            const historyExists = await db
              .collection('users')
              .doc(matchData.player1.playerId)
              .collection('club_match_history')
              .doc(matchDoc.id)
              .get();

            if (historyExists.exists) {
              console.log(`⏭️ [HEIMDALL] Match ${matchDoc.id} already processed, skipping`);
              return;
            }

            const matchResult: ClubMatchResult = {
              matchId: matchDoc.id,
              clubId: clubId,
              matchType: matchData.matchType,
              matchContext: 'tournament',
              tournamentId: data.tournamentId,
              date: matchData.date,
              player1Id: matchData.player1.playerId,
              player1Name: matchData.player1.playerName,
              player2Id: matchData.player2.playerId,
              player2Name: matchData.player2.playerName,
              winnerId:
                matchData.winner === 'player1'
                  ? matchData.player1.playerId
                  : matchData.player2.playerId,
              score: matchData.score,
              recordedBy: matchData.recordedBy || 'system',
            };

            try {
              const result = await calculateClubElo(matchResult);

              if (result.success) {
                console.log(
                  `✅ [HEIMDALL] ELO updated for match ${matchDoc.id}:`,
                  `${matchResult.player1Name}: ${result.player1EloChange > 0 ? '+' : ''}${result.player1EloChange}`,
                  `${matchResult.player2Name}: ${result.player2EloChange > 0 ? '+' : ''}${result.player2EloChange}`
                );
              } else {
                console.error(
                  `❌ [HEIMDALL] Failed to calculate ELO for match ${matchDoc.id}: ${result.error}`
                );
              }
            } catch (error) {
              console.error(
                `❌ [HEIMDALL] Failed to calculate ELO for match ${matchDoc.id}:`,
                error
              );
              // Continue with other matches even if one fails
            }
          });

          await Promise.all(eloPromises);
          console.log('✅ [HEIMDALL] All tournament match ELOs calculated');
        } catch (error) {
          console.error('❌ [HEIMDALL] Failed to process tournament ELO calculations:', error);
          // Don't throw - tournament is already completed
        }
      })();
    }

    // ========================================================================
    // 9. Return Success Response
    // ========================================================================

    const response: UpdateTournamentStatusResponse = {
      success: true,
      message: `Tournament status updated from ${previousStatus} to ${data.newStatus}`,
      data: {
        tournamentId: data.tournamentId,
        previousStatus,
        newStatus: data.newStatus,
        updatedAt: new Date().toISOString(),
      },
    };

    console.log('🎉 [UPDATE STATUS] Status update complete!');

    return response;
  } catch (error: unknown) {
    console.error('❌ [UPDATE STATUS] Failed to update status:', error);

    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed to update tournament status: ${errorMessage}`);
  }
});
