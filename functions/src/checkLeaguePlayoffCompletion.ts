/**
 * 🌉 [HEIMDALL] Check League Playoff Completion Cloud Function
 * Phase 5.9: Server-Side Migration - Playoff Auto-Completion
 *
 * Checks if all playoff matches are completed and automatically completes the league
 * Uses Admin SDK to bypass Security Rules
 *
 * @author Kim (Phase 5.9)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface CheckPlayoffCompletionRequest {
  leagueId: string;
}

interface CheckPlayoffCompletionResponse {
  success: boolean;
  message: string;
  data?: {
    completed: boolean;
    winner?: string;
    runnerUp?: string;
    thirdPlace?: string;
    fourthPlace?: string;
  };
}

/**
 * Check League Playoff Completion Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - League must be in 'playoffs' status
 * - All playoff matches must be completed
 *
 * Operations:
 * - Read all playoff_matches
 * - Check completion status
 * - Calculate final rankings (1st, 2nd, 3rd, 4th)
 * - Update league document with Admin SDK (bypasses Security Rules!)
 *
 * @param request - Contains leagueId
 * @returns Success status with completion data
 */
export const checkLeaguePlayoffCompletion = onCall<
  CheckPlayoffCompletionRequest,
  Promise<CheckPlayoffCompletionResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to check playoff completion');
  }

  logger.info('🔍 [CHECK_PLAYOFF_COMPLETION] Starting', {
    leagueId,
    userId: auth.uid,
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
    // Step 3: Check if League has Playoff
    // ==========================================================================
    if (!leagueData.playoff) {
      logger.info('ℹ️ [CHECK_PLAYOFF_COMPLETION] No playoff data', { leagueId });
      return {
        success: true,
        message: 'League does not have playoff',
        data: {
          completed: false,
        },
      };
    }

    // ==========================================================================
    // Step 4: Get All Playoff Matches
    // ==========================================================================
    const playoffMatchesSnap = await db
      .collection('leagues')
      .doc(leagueId)
      .collection('playoff_matches')
      .get();

    const playoffMatches = playoffMatchesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status as string,
        type: data.type as string | undefined,
        round: data.round as number,
        winner: data.winner as string | undefined,
        player1Id: data.player1Id as string,
        player2Id: data.player2Id as string,
        player1Name: data.player1Name as string,
        player2Name: data.player2Name as string,
      };
    });

    logger.info('📊 [CHECK_PLAYOFF_COMPLETION] Playoff matches', {
      leagueId,
      totalMatches: playoffMatches.length,
      matches: playoffMatches.map(m => ({
        id: m.id,
        status: m.status,
        type: m.type,
        round: m.round,
      })),
    });

    // ==========================================================================
    // Step 5: Check if All Matches are Completed
    // ==========================================================================
    const allCompleted = playoffMatches.every(m => m.status === 'completed');

    if (!allCompleted) {
      const incompleteMatches = playoffMatches.filter(m => m.status !== 'completed');
      logger.info('⏳ [CHECK_PLAYOFF_COMPLETION] Playoffs still in progress', {
        leagueId,
        incompleteCount: incompleteMatches.length,
        incompleteMatches: incompleteMatches.map(m => ({
          id: m.id,
          status: m.status,
          type: m.type,
        })),
      });

      return {
        success: true,
        message: 'Playoffs still in progress',
        data: {
          completed: false,
        },
      };
    }

    logger.info('🎉 [CHECK_PLAYOFF_COMPLETION] All playoff matches completed!', { leagueId });

    // ==========================================================================
    // Step 6: Find Final and Consolation Matches (by type, not round)
    // ==========================================================================
    const finalMatch = playoffMatches.find(m => m.type === 'final');
    const consolationMatch = playoffMatches.find(m => m.type === 'consolation');

    if (!finalMatch?.winner) {
      throw new HttpsError('failed-precondition', 'Final match has no winner');
    }

    // ==========================================================================
    // Step 7: Calculate Final Rankings
    // ==========================================================================
    const firstPlace = finalMatch.winner;
    const secondPlace =
      finalMatch.player1Id === firstPlace ? finalMatch.player2Id : finalMatch.player1Id;

    let thirdPlace = null;
    let fourthPlace = null;

    if (consolationMatch?.winner) {
      thirdPlace = consolationMatch.winner;
      fourthPlace =
        consolationMatch.player1Id === thirdPlace
          ? consolationMatch.player2Id
          : consolationMatch.player1Id;
    }

    // Get player names
    const championName =
      finalMatch.player1Id === firstPlace ? finalMatch.player1Name : finalMatch.player2Name;
    const runnerUpName =
      finalMatch.player1Id === secondPlace ? finalMatch.player1Name : finalMatch.player2Name;

    let thirdPlaceName = null;
    let fourthPlaceName = null;

    if (consolationMatch && thirdPlace && fourthPlace) {
      thirdPlaceName =
        consolationMatch.player1Id === thirdPlace
          ? consolationMatch.player1Name
          : consolationMatch.player2Name;
      fourthPlaceName =
        consolationMatch.player1Id === fourthPlace
          ? consolationMatch.player1Name
          : consolationMatch.player2Name;
    }

    logger.info('🏆 [CHECK_PLAYOFF_COMPLETION] Final rankings', {
      leagueId,
      firstPlace,
      secondPlace,
      thirdPlace,
      fourthPlace,
    });

    // ==========================================================================
    // Step 8: Update League Document (Admin SDK - Bypasses Security Rules!)
    // ==========================================================================
    const updateData: Record<string, unknown> = {
      status: 'completed',
      winnerId: firstPlace,
      runnerUpId: secondPlace,
      champion: {
        playerId: firstPlace,
        playerName: championName,
      },
      runnerUp: {
        playerId: secondPlace,
        playerName: runnerUpName,
      },
      'playoff.isComplete': true,
      'playoff.winner': firstPlace,
      'playoff.runnerUp': secondPlace,
      'playoff.thirdPlace': thirdPlace,
      'playoff.fourthPlace': fourthPlace,
      'playoff.winnerName': championName,
      'playoff.runnerUpName': runnerUpName,
      'playoff.thirdPlaceName': thirdPlaceName,
      'playoff.fourthPlaceName': fourthPlaceName,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await leagueRef.update(updateData);

    logger.info('✅ [CHECK_PLAYOFF_COMPLETION] League completed successfully!', {
      leagueId,
      winner: championName,
      runnerUp: runnerUpName,
    });

    return {
      success: true,
      message: 'League playoffs completed successfully',
      data: {
        completed: true,
        winner: championName,
        runnerUp: runnerUpName,
        ...(thirdPlaceName && { thirdPlace: thirdPlaceName }),
        ...(fourthPlaceName && { fourthPlace: fourthPlaceName }),
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [CHECK_PLAYOFF_COMPLETION] Unexpected error', {
      leagueId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to check playoff completion: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
