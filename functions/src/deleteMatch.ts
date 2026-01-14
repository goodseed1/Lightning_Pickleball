/**
 * 🌉 [HEIMDALL] Delete Match Cloud Function
 * Phase 5.5: Server-Side Migration - Admin Tools
 *
 * Allows tournament admin to delete a match (error correction)
 * Used for fixing bpaddle errors or mistakes
 *
 * @author Heimdall (Phase 5.5)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { DeleteMatchRequest, DeleteMatchResponse } from './types/tournament';
import { logger } from 'firebase-functions/v2';
import { requireAuthFromRequest, requireDocument } from './utils/commonHelpers';

const db = admin.firestore();

/**
 * Delete Match Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be tournament creator OR club admin
 *
 * Validations:
 * - Match must NOT be completed (preserve history)
 * - Match must exist
 *
 * Operations:
 * - Delete match document
 * - Update any references to this match
 *
 * @param request - Contains matchId, tournamentId, and optional reason
 * @returns Success status
 */
export const deleteMatch = onCall<DeleteMatchRequest, Promise<DeleteMatchResponse>>(
  async request => {
    const { data } = request;
    const { matchId, tournamentId, reason } = data;

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    const userId = requireAuthFromRequest(request);

    logger.info('🗑️ [DELETE_MATCH] Starting match deletion', {
      matchId,
      tournamentId,
      userId,
      reason,
    });

    try {
      // ========================================================================
      // Step 2: Validate Tournament Exists & Get Data
      // ========================================================================
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentSnap = await requireDocument(tournamentRef, 'Tournament');
      const tournamentData = tournamentSnap.data()!;

      // ========================================================================
      // Step 3: Authorization Check
      // ========================================================================
      const isTournamentCreator = tournamentData.createdBy === userId;

      // Check if user is club admin (if tournament belongs to a club)
      let isClubAdmin = false;
      if (tournamentData.clubId) {
        const clubRef = db.collection('pickleball_clubs').doc(tournamentData.clubId);
        const clubSnap = await clubRef.get();

        if (clubSnap.exists) {
          const memberRef = clubRef.collection('members').doc(userId);
          const memberSnap = await memberRef.get();

          if (memberSnap.exists) {
            const memberData = memberSnap.data();
            const memberRole = memberData?.role;
            isClubAdmin = memberRole === 'admin' || memberRole === 'owner';
          }
        }
      }

      if (!isTournamentCreator && !isClubAdmin) {
        throw new HttpsError(
          'permission-denied',
          'Only the tournament creator or club admin can delete matches'
        );
      }

      // ========================================================================
      // Step 4: Validate Match Exists
      // ========================================================================
      const matchRef = tournamentRef.collection('matches').doc(matchId);
      const matchSnap = await requireDocument(matchRef, 'Match');
      const matchData = matchSnap.data()!;

      // ========================================================================
      // Step 5: Validate Match is Not Completed (preserve history)
      // ========================================================================
      if (matchData.status === 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'Cannot delete completed matches. Match history must be preserved.'
        );
      }

      // ========================================================================
      // Step 6: Delete Match
      // ========================================================================
      await matchRef.delete();

      logger.info('✅ [DELETE_MATCH] Successfully deleted match', {
        matchId,
        tournamentId,
        userId,
        reason,
      });

      // TODO: Update any matches that reference this match
      // - Update nextMatchId references
      // - Update previousMatches arrays
      // This is complex and may require additional logic

      return {
        success: true,
        message: `Match successfully deleted${reason ? `: ${reason}` : ''}`,
      };
    } catch (error) {
      // Re-throw HttpsError as is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Log unexpected errors
      logger.error('❌ [DELETE_MATCH] Unexpected error', {
        matchId,
        tournamentId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to delete match: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
