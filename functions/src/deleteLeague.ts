/**
 * 🌉 [HEIMDALL] Delete League Cloud Function
 * Phase 5.3: Server-Side Migration - Critical Security
 *
 * Securely deletes a league and all related data
 * Only allows deletion of non-completed leagues to preserve history
 *
 * @author Heimdall
 * @date 2025-11-15
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { DeleteLeagueRequest, DeleteLeagueResponse } from './types/league';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Delete League Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be league creator OR club admin
 * - Cannot delete completed leagues (preserve history)
 *
 * Cascade Deletions:
 * - All league_matches documents
 * - All league_participants documents
 * - League document itself
 * - Updates club stats (totalEvents -1)
 *
 * @param request - Contains leagueId and optional reason
 * @returns Success status with deletion counts
 */
export const deleteLeague = onCall<DeleteLeagueRequest, Promise<DeleteLeagueResponse>>(
  async request => {
    const { data, auth } = request;
    const { leagueId, reason } = data;

    // ============================================================================
    // Step 1: Authentication
    // ============================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to delete a league');
    }

    const userId = auth.uid;

    logger.info('🗑️ [DELETE_LEAGUE] Starting deletion', {
      leagueId,
      userId,
      reason,
    });

    try {
      // ==========================================================================
      // Step 2: Validate League Exists & Get Data
      // ==========================================================================
      const leagueRef = db.collection('leagues').doc(leagueId);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        throw new HttpsError('not-found', 'League not found');
      }

      const leagueData = leagueSnap.data();
      if (!leagueData) {
        throw new HttpsError('internal', 'Invalid league data');
      }

      // ==========================================================================
      // Step 3: Authorization Check
      // ==========================================================================
      // Check if user is league creator
      const isLeagueCreator = leagueData.createdBy === userId;

      // Check if user is club admin/manager (if league belongs to a club)
      // 🎯 [KIM FIX] manager 역할 추가 + clubMembers 컬렉션 경로 수정
      let isClubAdmin = false;
      if (leagueData.clubId) {
        const clubId = leagueData.clubId;
        // Use correct clubMembers collection pattern: clubMembers/{clubId}_{userId}
        const memberRef = db.collection('clubMembers').doc(`${clubId}_${userId}`);
        const memberSnap = await memberRef.get();

        if (memberSnap.exists) {
          const memberData = memberSnap.data();
          const memberRole = memberData?.role;
          // Allow admin, owner, AND manager to delete leagues
          isClubAdmin = memberRole === 'admin' || memberRole === 'owner' || memberRole === 'manager';
        }
      }

      if (!isLeagueCreator && !isClubAdmin) {
        throw new HttpsError(
          'permission-denied',
          'Only the league creator, club admin, or manager can delete this league'
        );
      }

      // ==========================================================================
      // Step 4: Validate League Status
      // ==========================================================================
      // Preserve completed leagues for history
      if (leagueData.status === 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'Cannot delete completed leagues. League history must be preserved.'
        );
      }

      // ==========================================================================
      // Step 5: Cascade Delete All Related Data
      // ==========================================================================
      const batch = db.batch();

      // 5.1: Delete all league matches from subcollection
      const matchesQuery = leagueRef.collection('matches');
      const matchesSnap = await matchesQuery.get();
      const deletedMatchesCount = matchesSnap.size;

      matchesSnap.forEach(matchDoc => {
        batch.delete(matchDoc.ref);
      });

      logger.info('🗑️ [DELETE_LEAGUE] Deleting matches from subcollection', {
        leagueId,
        count: deletedMatchesCount,
      });

      // 5.2: Delete all playoff matches from subcollection
      const playoffMatchesQuery = leagueRef.collection('playoff_matches');
      const playoffMatchesSnap = await playoffMatchesQuery.get();

      playoffMatchesSnap.forEach(matchDoc => {
        batch.delete(matchDoc.ref);
      });

      logger.info('🗑️ [DELETE_LEAGUE] Deleting playoff matches from subcollection', {
        leagueId,
        count: playoffMatchesSnap.size,
      });

      // 5.3: Delete all league_participants
      const participantsQuery = db
        .collection('league_participants')
        .where('leagueId', '==', leagueId);
      const participantsSnap = await participantsQuery.get();
      const deletedParticipantsCount = participantsSnap.size;

      participantsSnap.forEach(participantDoc => {
        batch.delete(participantDoc.ref);
      });

      logger.info('🗑️ [DELETE_LEAGUE] Deleting participants', {
        leagueId,
        count: deletedParticipantsCount,
      });

      // 5.4: Delete the league document itself
      batch.delete(leagueRef);

      // 5.5: Update club stats (decrease totalEvents count)
      if (leagueData.clubId) {
        const clubRef = db.collection('pickleball_clubs').doc(leagueData.clubId);
        batch.update(clubRef, {
          'stats.totalEvents': admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('🗑️ [DELETE_LEAGUE] Updating club stats', {
          clubId: leagueData.clubId,
        });
      }

      // ==========================================================================
      // Step 6: Commit All Deletions
      // ==========================================================================
      await batch.commit();

      logger.info('✅ [DELETE_LEAGUE] Successfully deleted league', {
        leagueId,
        deletedMatchesCount,
        deletedParticipantsCount,
        userId,
        reason,
      });

      return {
        success: true,
        message: `League successfully deleted. ${deletedMatchesCount} matches and ${deletedParticipantsCount} participants removed.`,
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
      logger.error('❌ [DELETE_LEAGUE] Unexpected error', {
        leagueId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to delete league: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
