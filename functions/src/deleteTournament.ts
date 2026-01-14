/**
 * 🌉 [HEIMDALL] Delete Tournament Cloud Function
 * Phase 5.3: Server-Side Migration - Critical Security
 *
 * Securely deletes a tournament and all related data
 * Only allows deletion of non-completed tournaments to preserve history
 *
 * @author Heimdall (Phase 5.3)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { DeleteTournamentRequest, DeleteTournamentResponse } from './types/tournament';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Delete Tournament Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be tournament creator OR club admin
 * - Cannot delete completed tournaments (preserve history)
 *
 * Cascade Deletions:
 * - All tournament_matches documents
 * - All participants subcollection documents
 * - Tournament document itself
 * - Updates club stats (totalEvents -1)
 *
 * @param request - Contains tournamentId and optional reason
 * @returns Success status with deletion counts
 */
export const deleteTournament = onCall<DeleteTournamentRequest, Promise<DeleteTournamentResponse>>(
  async request => {
    const { data, auth } = request;
    const { tournamentId, reason } = data;

    // ============================================================================
    // Step 1: Authentication
    // ============================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to delete a tournament');
    }

    const userId = auth.uid;

    logger.info('🗑️ [DELETE_TOURNAMENT] Starting deletion', {
      tournamentId,
      userId,
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
      // Step 3: Authorization Check
      // ==========================================================================
      // Check if user is tournament creator
      const isTournamentCreator = tournamentData.createdBy === userId;

      // Check if user is club admin/manager (if tournament belongs to a club)
      // 🎯 [KIM FIX] manager 역할 추가 + clubMembers 컬렉션 경로 수정
      let isClubAdmin = false;
      if (tournamentData.clubId) {
        const clubId = tournamentData.clubId;
        // Use correct clubMembers collection pattern: clubMembers/{clubId}_{userId}
        const memberRef = db.collection('clubMembers').doc(`${clubId}_${userId}`);
        const memberSnap = await memberRef.get();

        if (memberSnap.exists) {
          const memberData = memberSnap.data();
          const memberRole = memberData?.role;
          // Allow admin, owner, AND manager to delete tournaments
          isClubAdmin = memberRole === 'admin' || memberRole === 'owner' || memberRole === 'manager';
        }
      }

      if (!isTournamentCreator && !isClubAdmin) {
        throw new HttpsError(
          'permission-denied',
          'Only the tournament creator, club admin, or manager can delete this tournament'
        );
      }

      // ==========================================================================
      // Step 4: Validate Tournament Status
      // ==========================================================================
      // Preserve completed tournaments for history
      if (tournamentData.status === 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'Cannot delete completed tournaments. Tournament history must be preserved.'
        );
      }

      // ==========================================================================
      // Step 5: Cascade Delete All Related Data
      // ==========================================================================
      const batch = db.batch();

      // 5.1: Delete all tournament_matches
      const matchesQuery = db
        .collection('tournament_matches')
        .where('tournamentId', '==', tournamentId);
      const matchesSnap = await matchesQuery.get();
      const deletedMatchesCount = matchesSnap.size;

      matchesSnap.forEach(matchDoc => {
        batch.delete(matchDoc.ref);
      });

      logger.info('🗑️ [DELETE_TOURNAMENT] Deleting matches', {
        tournamentId,
        count: deletedMatchesCount,
      });

      // 5.2: Delete all participants (subcollection)
      const participantsQuery = tournamentRef.collection('participants');
      const participantsSnap = await participantsQuery.get();
      const deletedParticipantsCount = participantsSnap.size;

      participantsSnap.forEach(participantDoc => {
        batch.delete(participantDoc.ref);
      });

      logger.info('🗑️ [DELETE_TOURNAMENT] Deleting participants', {
        tournamentId,
        count: deletedParticipantsCount,
      });

      // 5.3: Delete tournamentRegistrations (if exists)
      const registrationsQuery = db
        .collection('tournamentRegistrations')
        .where('tournamentId', '==', tournamentId);
      const registrationsSnap = await registrationsQuery.get();

      registrationsSnap.forEach(regDoc => {
        batch.delete(regDoc.ref);
      });

      logger.info('🗑️ [DELETE_TOURNAMENT] Deleting registrations', {
        tournamentId,
        count: registrationsSnap.size,
      });

      // 5.4: Delete tournament_events (if exists)
      const eventsQuery = db
        .collection('tournament_events')
        .where('tournamentId', '==', tournamentId);
      const eventsSnap = await eventsQuery.get();

      eventsSnap.forEach(eventDoc => {
        batch.delete(eventDoc.ref);
      });

      logger.info('🗑️ [DELETE_TOURNAMENT] Deleting events', {
        tournamentId,
        count: eventsSnap.size,
      });

      // 5.5: Delete the tournament document itself
      batch.delete(tournamentRef);

      // 5.6: Update club stats (decrease totalEvents count)
      if (tournamentData.clubId) {
        const clubRef = db.collection('tennis_clubs').doc(tournamentData.clubId);
        batch.update(clubRef, {
          'stats.totalEvents': admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('🗑️ [DELETE_TOURNAMENT] Updating club stats', {
          clubId: tournamentData.clubId,
        });
      }

      // ==========================================================================
      // Step 6: Commit All Deletions
      // ==========================================================================
      await batch.commit();

      logger.info('✅ [DELETE_TOURNAMENT] Successfully deleted tournament', {
        tournamentId,
        deletedMatchesCount,
        deletedParticipantsCount,
        userId,
        reason,
      });

      // TODO: Send notifications to participants (Phase 5.6)
      // - Notify all participants that tournament was deleted
      // - Include reason if provided

      return {
        success: true,
        message: `Tournament successfully deleted. ${deletedMatchesCount} matches and ${deletedParticipantsCount} participants removed.`,
        data: {
          deletedMatchesCount,
          deletedParticipantsCount,
        },
      };
    } catch (error) {
      // Re-throw HttpsError as is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Log unexpected errors
      logger.error('❌ [DELETE_TOURNAMENT] Unexpected error', {
        tournamentId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to delete tournament: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
