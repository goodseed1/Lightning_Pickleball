/**
 * 🚀 Cloud Function: registerTeamForTournament
 * Server-side team registration for tournaments (Team-First 2.0)
 *
 * Phase 1: Server-Side Migration
 * Registers pre-existing team entities for doubles tournaments
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  RegisterTeamForTournamentRequest,
  RegisterForTournamentResponse,
  TournamentParticipantData,
} from './types/tournament';
import { validateCanRegister } from './utils/tournamentValidators';
import {
  sendRegistrationConfirmation,
  sendNewParticipantNotification,
} from './utils/tournamentNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ============================================================================
 * Cloud Function: registerTeamForTournament
 * ============================================================================
 *
 * Registers a pre-existing team for a doubles tournament
 *
 * Difference from registerForTournament:
 * - Uses existing team entity (teamId) instead of ad-hoc partner
 * - Team must already exist in the database
 * - Both team members are notified
 *
 * Security:
 * - Requires authentication
 * - Validates team membership (user must be on the team)
 * - Validates tournament status and capacity
 * - Prevents duplicate team registrations
 *
 * Atomicity:
 * - Uses Firestore transactions for atomic operations
 * - Ensures participant count accuracy
 *
 * Notifications:
 * - Sends confirmation to both team members
 * - Notifies tournament host
 *
 * @param data - RegisterTeamForTournamentRequest
 * @param context - Authenticated user context
 * @returns RegisterForTournamentResponse
 */
export const registerTeamForTournament = onCall<
  RegisterTeamForTournamentRequest,
  Promise<RegisterForTournamentResponse>
>(async request => {
  const { data, auth } = request;

  console.log('👥 [REGISTER TEAM] Starting team registration process');

  // ==========================================================================
  // 1. Authentication
  // ==========================================================================

  if (!auth || !auth.uid) {
    console.error('❌ [REGISTER TEAM] Unauthorized: No auth context');
    throw new HttpsError('unauthenticated', 'You must be logged in to register a team');
  }

  const userId = data.registeredBy || auth.uid;

  console.log(`👤 [REGISTER TEAM] User: ${userId}, Team: ${data.teamId}`);

  // ==========================================================================
  // 2. Team Validation & Registration (Transaction)
  // ==========================================================================

  try {
    const result = await db.runTransaction(async transaction => {
      // ======================================================================
      // 2.1 Validate Team Exists
      // ======================================================================

      const teamRef = db.doc(`teams/${data.teamId}`);
      const teamDoc = await transaction.get(teamRef);

      if (!teamDoc.exists) {
        throw new HttpsError('not-found', 'Team not found');
      }

      const teamData = teamDoc.data()!;

      console.log(`✅ [REGISTER TEAM] Team found: ${teamData.teamName}`);

      // ======================================================================
      // 2.2 Verify User is Team Member
      // ======================================================================

      const player1Id = teamData.player1.userId;
      const player2Id = teamData.player2.userId;

      if (userId !== player1Id && userId !== player2Id) {
        console.error(`❌ [REGISTER TEAM] User ${userId} is not a member of team ${data.teamId}`);
        throw new HttpsError(
          'permission-denied',
          'You must be a member of the team to register it for tournaments'
        );
      }

      console.log(`✅ [REGISTER TEAM] User verified as team member`);

      // ======================================================================
      // 2.3 Validate Tournament
      // ======================================================================

      const tournamentRef = db.doc(`tournaments/${data.tournamentId}`);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournamentData = tournamentDoc.data()!;

      console.log(`🏆 [REGISTER TEAM] Tournament: ${tournamentData.tournamentName}`);

      // Check if tournament is accepting registrations
      const registrationCheck = validateCanRegister(
        tournamentData.status,
        tournamentData.participantCount || 0,
        tournamentData.settings.maxParticipants
      );

      if (!registrationCheck.isValid) {
        console.error(`❌ [REGISTER TEAM] Registration check failed: ${registrationCheck.error}`);
        throw new HttpsError(
          'failed-precondition',
          registrationCheck.error || 'Tournament is not accepting registrations'
        );
      }

      // Validate tournament is doubles
      const eventType = tournamentData.eventType;
      if (eventType === 'mens_singles' || eventType === 'womens_singles') {
        throw new HttpsError('invalid-argument', 'Cannot register a team for singles tournaments');
      }

      // ======================================================================
      // 2.4 Check for Duplicate Registration
      // ======================================================================

      const participantsSnapshot = await transaction.get(
        db
          .collection(`tournaments/${data.tournamentId}/participants`)
          .where('teamId', '==', data.teamId)
      );

      if (!participantsSnapshot.empty) {
        console.error(`❌ [REGISTER TEAM] Team ${data.teamId} already registered`);
        throw new HttpsError(
          'already-exists',
          'This team is already registered for the tournament'
        );
      }

      // ======================================================================
      // 2.5 Gather Team Member Data
      // ======================================================================

      const player1Doc = await transaction.get(db.doc(`users/${player1Id}`));
      const player2Doc = await transaction.get(db.doc(`users/${player2Id}`));

      if (!player1Doc.exists || !player2Doc.exists) {
        throw new HttpsError('not-found', 'Team member profile not found');
      }

      const player1Data = player1Doc.data()!;
      const player2Data = player2Doc.data()!;

      const player1Profile = player1Data.profile || {};
      const player2Profile = player2Data.profile || {};

      const player1Name =
        player1Profile.displayName ||
        `${player1Profile.firstName || ''} ${player1Profile.lastName || ''}`.trim() ||
        player1Data.displayName ||
        'Player 1';

      const player2Name =
        player2Profile.displayName ||
        `${player2Profile.firstName || ''} ${player2Profile.lastName || ''}`.trim() ||
        player2Data.displayName ||
        'Player 2';

      // ======================================================================
      // 2.6 Create Participant Data (Team Format)
      // ======================================================================

      // Use combined playerId format: "player1Id_player2Id"
      const combinedPlayerId = `${player1Id}_${player2Id}`;

      const participantData: TournamentParticipantData = {
        // Player 1 (primary)
        playerId: combinedPlayerId,
        playerName: player1Name,
        playerGender: player1Profile.gender || 'prefer_not_to_say',
        skillLevel: player1Profile.skillLevel || 'beginner',
        profileImage: player1Data.photoURL || player1Data.profileImage || null,

        // Player 2 (partner)
        partnerId: player2Id,
        partnerName: player2Name,
        partnerGender: player2Profile.gender || 'prefer_not_to_say',
        partnerSkillLevel: player2Profile.skillLevel || 'beginner',
        partnerProfileImage: player2Data.photoURL || player2Data.profileImage || null,
        partnerConfirmed: true, // Already confirmed by team creation

        // Team reference
        teamId: data.teamId,
      };

      // ======================================================================
      // 2.7 Write Participant Document (Atomic)
      // ======================================================================

      const participantRef = db.collection(`tournaments/${data.tournamentId}/participants`).doc();
      const participantId = participantRef.id;

      const now = admin.firestore.FieldValue.serverTimestamp();

      const participantDoc = {
        participantId,
        ...participantData,
        registeredAt: now,
        registeredBy: userId,
        status: 'registered',
        seed: null,
        checkInStatus: null,
      };

      transaction.set(participantRef, participantDoc);

      // Update tournament participant count AND participants array
      // For doubles: add BOTH players to array so UI can detect registration
      // Array contains minimal info for UI checks + partner info for team pairing
      // Full details remain in subcollection
      transaction.update(tournamentRef, {
        participantCount: admin.firestore.FieldValue.increment(1),
        participants: admin.firestore.FieldValue.arrayUnion(
          {
            playerId: player1Id,
            playerName: player1Name,
            partnerId: player2Id,
            partnerName: player2Name,
          },
          {
            playerId: player2Id,
            playerName: player2Name,
            partnerId: player1Id,
            partnerName: player1Name,
          }
        ),
        updatedAt: now,
      });

      // Log activity
      const activityRef = db.collection('activities').doc();
      transaction.set(activityRef, {
        type: 'tournament_team_registration',
        userId,
        teamId: data.teamId,
        tournamentId: data.tournamentId,
        tournamentName: tournamentData.tournamentName,
        timestamp: now,
      });

      console.log(`✅ [REGISTER TEAM] Team registered: ${participantId}`);

      return {
        participantId,
        tournamentName: tournamentData.tournamentName,
        createdBy: tournamentData.createdBy,
        currentCount: (tournamentData.participantCount || 0) + 1,
        maxParticipants: tournamentData.settings.maxParticipants,
        teamName: teamData.teamName || `${player1Name} & ${player2Name}`,
        player1Id,
        player2Id,
      };
    });

    // ========================================================================
    // 3. Send Notifications (After Transaction)
    // ========================================================================

    const {
      participantId,
      tournamentName,
      createdBy,
      currentCount,
      maxParticipants,
      teamName,
      player1Id,
      player2Id,
    } = result;

    // Send confirmation to player 1
    sendRegistrationConfirmation(player1Id, data.tournamentId, tournamentName, true)
      .then(() => {
        console.log('✅ [REGISTER TEAM] Confirmation sent to player 1');
      })
      .catch(error => {
        console.error('❌ [REGISTER TEAM] Failed to send player 1 confirmation:', error);
      });

    // Send confirmation to player 2
    sendRegistrationConfirmation(player2Id, data.tournamentId, tournamentName, true)
      .then(() => {
        console.log('✅ [REGISTER TEAM] Confirmation sent to player 2');
      })
      .catch(error => {
        console.error('❌ [REGISTER TEAM] Failed to send player 2 confirmation:', error);
      });

    // Notify tournament host
    sendNewParticipantNotification(
      createdBy,
      data.tournamentId,
      tournamentName,
      teamName,
      currentCount,
      maxParticipants
    )
      .then(() => {
        console.log('✅ [REGISTER TEAM] Host notification sent');
      })
      .catch(error => {
        console.error('❌ [REGISTER TEAM] Failed to send host notification:', error);
      });

    // ========================================================================
    // 4. Return Success Response
    // ========================================================================

    const response: RegisterForTournamentResponse = {
      success: true,
      message: `Team "${teamName}" successfully registered for "${tournamentName}"`,
      data: {
        registrationId: participantId,
        participantId,
        registeredAt: new Date().toISOString(),
      },
    };

    console.log('🎉 [REGISTER TEAM] Team registration complete!');

    return response;
  } catch (error: unknown) {
    console.error('❌ [REGISTER TEAM] Failed to register team:', error);

    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed to register team for tournament: ${errorMessage}`);
  }
});
