/**
 * 🌉 [HEIMDALL] Withdraw From Tournament Cloud Function
 * Phase 5.3: Server-Side Migration - Critical Security
 *
 * Securely handles participant withdrawal from tournaments
 * Supports both self-withdrawal and admin-initiated removal
 *
 * @author Heimdall (Phase 5.3)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  WithdrawFromTournamentRequest,
  WithdrawFromTournamentResponse,
  TournamentParticipant,
} from './types/tournament';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Withdraw From Tournament Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Can withdraw SELF (userId === auth.uid)
 * - OR must be tournament creator
 * - OR must be club admin
 *
 * Validations:
 * - Tournament must be in 'registration' or 'draft' status
 * - Participant must exist in tournament
 * - Cannot withdraw from in-progress or completed tournaments
 *
 * Operations:
 * - Removes participant from tournament.participants array
 * - Deletes tournamentRegistrations document
 * - Updates tournament participantCount
 * - Handles doubles partners (removes both if applicable)
 *
 * @param request - Contains tournamentId, userId to withdraw, and optional reason
 * @returns Success status with removed participant ID
 */
export const withdrawFromTournament = onCall<
  WithdrawFromTournamentRequest,
  Promise<WithdrawFromTournamentResponse>
>(async request => {
  const { data, auth } = request;
  const { tournamentId, userId, reason } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to withdraw from a tournament');
  }

  const callerId = auth.uid;

  logger.info('🚪 [WITHDRAW_TOURNAMENT] Starting withdrawal', {
    tournamentId,
    userId,
    callerId,
    reason,
  });

  try {
    // ==========================================================================
    // Step 2: Validate Tournament Exists & Get Data
    // ==========================================================================
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const tournamentSnap = await tournamentRef.get();

    if (!tournamentSnap.exists) {
      throw new HttpsError('not-found', 'Tournament not found');
    }

    const tournamentData = tournamentSnap.data();
    if (!tournamentData) {
      throw new HttpsError('internal', 'Invalid tournament data');
    }

    // ==========================================================================
    // Step 3: Validate Tournament Status
    // ==========================================================================
    // Can only withdraw during registration or draft phase
    const allowedStatuses = ['draft', 'registration'];
    if (!allowedStatuses.includes(tournamentData.status)) {
      throw new HttpsError(
        'failed-precondition',
        `Cannot withdraw from tournament in ${tournamentData.status} status. Withdrawals are only allowed during registration or draft phase.`
      );
    }

    // ==========================================================================
    // Step 4: Authorization Check
    // ==========================================================================
    const isSelfWithdrawal = userId === callerId;
    const isTournamentCreator = tournamentData.createdBy === callerId;

    // Check if caller is club admin (if tournament belongs to a club)
    let isClubAdmin = false;
    if (tournamentData.clubId) {
      const clubRef = db.collection('pickleball_clubs').doc(tournamentData.clubId);
      const clubSnap = await clubRef.get();

      if (clubSnap.exists) {
        const memberRef = clubRef.collection('members').doc(callerId);
        const memberSnap = await memberRef.get();

        if (memberSnap.exists) {
          const memberData = memberSnap.data();
          const memberRole = memberData?.role;
          // 🎯 [KIM FIX] 운영진(manager)도 권한 부여
          isClubAdmin =
            memberRole === 'admin' || memberRole === 'owner' || memberRole === 'manager';
        }
      }
    }

    if (!isSelfWithdrawal && !isTournamentCreator && !isClubAdmin) {
      throw new HttpsError(
        'permission-denied',
        'You can only withdraw yourself, or you must be tournament creator/club admin to remove others'
      );
    }

    // ==========================================================================
    // Step 5: Find Participant in Tournament Document
    // ==========================================================================
    const participants: TournamentParticipant[] = tournamentData.participants || [];
    const participantIndex = participants.findIndex(p => p.playerId === userId);

    if (participantIndex === -1) {
      throw new HttpsError('not-found', 'Participant not found in this tournament');
    }

    // Get participant data
    const participantData = participants[participantIndex];

    logger.info('🚪 [WITHDRAW_TOURNAMENT] Found participant', {
      participantIndex,
      userId,
      participantData,
    });

    // ==========================================================================
    // Step 6: Handle Doubles Partner (if applicable)
    // ==========================================================================
    let partnerId: string | undefined;
    let partnerIndex = -1;

    if (participantData.partnerId) {
      partnerId = participantData.partnerId;
      partnerIndex = participants.findIndex(p => p.playerId === partnerId);

      logger.info('🚪 [WITHDRAW_TOURNAMENT] Doubles detected, removing partner', {
        partnerId,
        partnerIndex,
      });
    }

    // ==========================================================================
    // Step 7: Remove Participants from Array
    // ==========================================================================
    // Filter out the participant and partner (if doubles)
    const updatedParticipants = participants.filter(p => {
      if (p.playerId === userId) return false; // Remove main participant
      if (partnerId && p.playerId === partnerId) return false; // Remove partner
      return true;
    });

    logger.info('🚪 [WITHDRAW_TOURNAMENT] Removing participants from array', {
      originalCount: participants.length,
      updatedCount: updatedParticipants.length,
      removedCount: participants.length - updatedParticipants.length,
    });

    // ==========================================================================
    // Step 8: Delete Registration Documents & Update Tournament
    // ==========================================================================
    const batch = db.batch();

    // 8.1: Delete tournamentRegistrations documents
    const registrationsQuery = db
      .collection('tournamentRegistrations')
      .where('tournamentId', '==', tournamentId)
      .where('userId', '==', userId);
    const registrationsSnap = await registrationsQuery.get();

    registrationsSnap.forEach(regDoc => {
      batch.delete(regDoc.ref);
    });

    // Also delete partner's registration (if doubles)
    if (partnerId) {
      const partnerRegQuery = db
        .collection('tournamentRegistrations')
        .where('tournamentId', '==', tournamentId)
        .where('userId', '==', partnerId);
      const partnerRegSnap = await partnerRegQuery.get();

      partnerRegSnap.forEach(regDoc => {
        batch.delete(regDoc.ref);
      });
    }

    // 8.2: Update tournament with new participants array and count
    const decrementCount = partnerId ? -2 : -1; // Decrement by 2 if doubles
    batch.update(tournamentRef, {
      participants: updatedParticipants,
      participantCount: admin.firestore.FieldValue.increment(decrementCount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ==========================================================================
    // Step 9: Commit All Changes
    // ==========================================================================
    await batch.commit();

    logger.info('✅ [WITHDRAW_TOURNAMENT] Successfully withdrew from tournament', {
      tournamentId,
      userId,
      partnerId,
      callerId,
      reason,
      removedCount: participants.length - updatedParticipants.length,
    });

    // TODO: Send notifications (Phase 5.6)
    // - Notify tournament creator of withdrawal
    // - If admin removed, notify the removed participant
    // - If doubles, notify partner

    return {
      success: true,
      message: partnerId
        ? `Successfully withdrew team from tournament (${userId} and partner ${partnerId})`
        : `Successfully withdrew from tournament`,
      data: {
        removedParticipantId: userId,
      },
    };
  } catch (error) {
    // Re-throw HttpsError as is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log unexpected errors
    logger.error('❌ [WITHDRAW_TOURNAMENT] Unexpected error', {
      tournamentId,
      userId,
      callerId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to withdraw from tournament: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
