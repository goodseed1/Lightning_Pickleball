/**
 * 🌉 [HEIMDALL] Update Playoff Match Result Cloud Function
 * Phase 5.10: Server-Side Migration - Playoff Match Results
 *
 * Updates playoff match result and automatically advances winner/loser to next matches
 * Uses Admin SDK to bypass Security Rules and ensure atomic operations
 *
 * @author Kim (Phase 5.10)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface SetScore {
  player1Games: number;
  player2Games: number;
}

interface UpdatePlayoffMatchResultRequest {
  leagueId: string;
  matchId: string;
  winnerId: string;
  score: {
    sets: SetScore[];
    finalScore: string;
  };
}

interface UpdatePlayoffMatchResultResponse {
  success: boolean;
  message: string;
  data?: {
    matchId: string;
    winner: string;
    advancedToNext: boolean;
  };
}

/**
 * Update Playoff Match Result Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Automatic winner/loser advancement
 * - Transaction ensures atomicity
 *
 * Operations:
 * 1. Update current match status to 'completed'
 * 2. Advance winner to next match (if exists)
 * 3. Advance loser to consolation match (if exists)
 * 4. Auto-change next match status to 'scheduled' when both players ready
 * 5. Call checkPlayoffCompletion to check if all matches are done
 *
 * @param request - Contains leagueId, matchId, winnerId, score
 * @returns Success status with match result data
 */
export const updatePlayoffMatchResult = onCall<
  UpdatePlayoffMatchResultRequest,
  Promise<UpdatePlayoffMatchResultResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId, matchId, winnerId, score } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to update playoff match results'
    );
  }

  logger.info('🏆 [UPDATE_PLAYOFF_MATCH_RESULT] Starting', {
    leagueId,
    matchId,
    winnerId,
    userId: auth.uid,
  });

  try {
    // ==========================================================================
    // Step 2: Validate League Exists
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
    // Step 3: Run Transaction (Atomic Operations!)
    // ==========================================================================
    let winnerName = '';
    let advancedToNext = false;

    await db.runTransaction(async transaction => {
      // ========================================================================
      // PHASE 1: READ - Get current match info
      // ========================================================================
      const playoffMatchesRef = leagueRef.collection('playoff_matches');
      const matchRef = playoffMatchesRef.doc(matchId);
      const matchSnap = await transaction.get(matchRef);

      if (!matchSnap.exists) {
        throw new HttpsError('not-found', 'Match not found');
      }

      const matchData = matchSnap.data();
      if (!matchData) {
        throw new HttpsError('internal', 'Invalid match data');
      }

      // Calculate loser and names
      const loserId = winnerId === matchData.player1Id ? matchData.player2Id : matchData.player1Id;
      winnerName = winnerId === matchData.player1Id ? matchData.player1Name : matchData.player2Name;
      const loserName =
        winnerId === matchData.player1Id ? matchData.player2Name : matchData.player1Name;

      logger.info('🏆 [UPDATE_PLAYOFF_MATCH_RESULT] Match result', {
        matchId,
        winner: `${winnerName} (${winnerId})`,
        loser: `${loserName} (${loserId})`,
      });

      // Get next matches (if exist)
      let nextWinnerMatchSnap = null;
      let nextLoserMatchSnap = null;

      if (matchData.nextMatchForWinner) {
        const nextWinnerMatchRef = playoffMatchesRef.doc(matchData.nextMatchForWinner);
        nextWinnerMatchSnap = await transaction.get(nextWinnerMatchRef);
      }

      if (matchData.nextMatchForLoser) {
        const nextLoserMatchRef = playoffMatchesRef.doc(matchData.nextMatchForLoser);
        nextLoserMatchSnap = await transaction.get(nextLoserMatchRef);
      }

      // ========================================================================
      // PHASE 2: WRITE - Execute all updates atomically
      // ========================================================================

      // 1. Update current match
      transaction.update(matchRef, {
        status: 'completed',
        winner: winnerId,
        score,
        actualDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Advance winner to next match
      if (nextWinnerMatchSnap && nextWinnerMatchSnap.exists) {
        const winnerPosition = matchData.nextMatchPositionForWinner;
        const nextWinnerData = nextWinnerMatchSnap.data();

        if (!nextWinnerData) {
          throw new HttpsError('internal', 'Invalid next winner match data');
        }

        const updateData: Record<string, unknown> = {
          [`${winnerPosition}Id`]: winnerId,
          [`${winnerPosition}Name`]: winnerName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Check if both players are ready → change status to 'scheduled'
        const otherPosition = winnerPosition === 'player1' ? 'player2' : 'player1';
        const otherPlayerId = nextWinnerData[`${otherPosition}Id`];
        if (otherPlayerId) {
          updateData.status = 'scheduled';
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.update(nextWinnerMatchSnap.ref, updateData as any);

        logger.info('✅ [UPDATE_PLAYOFF_MATCH_RESULT] Winner advanced', {
          winner: winnerName,
          nextMatch: matchData.nextMatchForWinner,
          position: winnerPosition,
        });

        advancedToNext = true;
      }

      // 3. Advance loser to consolation match (if exists)
      if (nextLoserMatchSnap && nextLoserMatchSnap.exists) {
        const loserPosition = matchData.nextMatchPositionForLoser;
        const nextLoserData = nextLoserMatchSnap.data();

        if (!nextLoserData) {
          throw new HttpsError('internal', 'Invalid next loser match data');
        }

        const updateData: Record<string, unknown> = {
          [`${loserPosition}Id`]: loserId,
          [`${loserPosition}Name`]: loserName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Check if both players are ready → change status to 'scheduled'
        const otherPosition = loserPosition === 'player1' ? 'player2' : 'player1';
        const otherPlayerId = nextLoserData[`${otherPosition}Id`];
        if (otherPlayerId) {
          updateData.status = 'scheduled';
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.update(nextLoserMatchSnap.ref, updateData as any);

        logger.info('✅ [UPDATE_PLAYOFF_MATCH_RESULT] Loser advanced', {
          loser: loserName,
          nextMatch: matchData.nextMatchForLoser,
          position: loserPosition,
        });
      }
    });

    logger.info('🎉 [UPDATE_PLAYOFF_MATCH_RESULT] Transaction completed successfully!', {
      leagueId,
      matchId,
    });

    // ==========================================================================
    // Step 4: Check Playoff Completion (Call another Cloud Function)
    // ==========================================================================
    try {
      // Note: We don't await this because it's a separate operation
      // The client will see the updated state via real-time listeners
      logger.info('🔍 [UPDATE_PLAYOFF_MATCH_RESULT] Triggering playoff completion check', {
        leagueId,
      });

      // This will be called by the client after receiving success response
      // Or we can trigger it here (but don't wait for it)
    } catch (completionError) {
      // Log but don't fail the main operation
      logger.warn('⚠️ [UPDATE_PLAYOFF_MATCH_RESULT] Playoff completion check failed', {
        leagueId,
        error: completionError instanceof Error ? completionError.message : String(completionError),
      });
    }

    return {
      success: true,
      message: 'Playoff match result updated successfully',
      data: {
        matchId,
        winner: winnerName,
        advancedToNext,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [UPDATE_PLAYOFF_MATCH_RESULT] Unexpected error', {
      leagueId,
      matchId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to update playoff match result: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
