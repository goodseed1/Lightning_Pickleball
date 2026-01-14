/**
 * 🌉 [HEIMDALL] Generate Next Round Cloud Function
 * Phase 5.4: Server-Side Migration - Match Operations
 *
 * Manually generates the next round of a tournament
 * Used when automatic round generation didn't occur
 *
 * @author Heimdall (Phase 5.4)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  GenerateNextRoundRequest,
  GenerateNextRoundResponse,
  BracketMatch,
} from './types/tournament';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

// Extended match type with internal _winner field
interface MatchWithWinner extends BracketMatch {
  _winner?: string;
}

/**
 * Generate Next Round Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be tournament creator OR club admin
 *
 * Validations:
 * - Tournament must be in 'in_progress' status
 * - Current round must be fully completed
 * - Cannot generate round if already at final round
 *
 * Operations:
 * - Collect winners from current round
 * - Generate matchups for next round
 * - Create match documents
 * - Update tournament.currentRound
 *
 * @param request - Contains tournamentId
 * @returns Success status with round number and matches created
 */
export const generateNextRound = onCall<
  GenerateNextRoundRequest,
  Promise<GenerateNextRoundResponse>
>(async request => {
  const { data, auth } = request;
  const { tournamentId } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to generate next round');
  }

  const userId = auth.uid;

  logger.info('🎮 [GENERATE_NEXT_ROUND] Starting manual round generation', {
    tournamentId,
    userId,
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
    const isTournamentCreator = tournamentData.createdBy === userId;

    // Check if user is club admin (if tournament belongs to a club)
    let isClubAdmin = false;
    if (tournamentData.clubId) {
      const clubRef = db.collection('tennis_clubs').doc(tournamentData.clubId);
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
        'Only the tournament creator or club admin can generate next round'
      );
    }

    // ==========================================================================
    // Step 4: Validate Tournament Status
    // ==========================================================================
    if (tournamentData.status !== 'in_progress') {
      throw new HttpsError(
        'failed-precondition',
        'Tournament must be in progress to generate next round'
      );
    }

    // ==========================================================================
    // Step 5: Get All Matches and Analyze Current Round
    // ==========================================================================
    const matchesSnap = await tournamentRef.collection('matches').get();

    if (matchesSnap.empty) {
      throw new HttpsError('failed-precondition', 'No matches found in tournament');
    }

    const allMatches: MatchWithWinner[] = matchesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MatchWithWinner[];

    // Determine current round
    const currentRound = Math.max(...allMatches.map(m => m.roundNumber || 1));

    logger.info('🎮 [GENERATE_NEXT_ROUND] Current round analysis', {
      currentRound,
      totalMatches: allMatches.length,
      totalRounds: tournamentData.totalRounds,
    });

    // ==========================================================================
    // Step 6: Validate Current Round is Complete
    // ==========================================================================
    const roundMatches = allMatches.filter(m => m.roundNumber === currentRound);
    const completedMatches = roundMatches.filter(m => m.status === 'completed');

    if (completedMatches.length !== roundMatches.length) {
      throw new HttpsError(
        'failed-precondition',
        `Current round ${currentRound} is not yet complete. ${completedMatches.length}/${roundMatches.length} matches finished.`
      );
    }

    // ==========================================================================
    // Step 7: Check if Already at Final Round
    // ==========================================================================
    if (currentRound >= tournamentData.totalRounds) {
      throw new HttpsError(
        'failed-precondition',
        'Tournament is already complete. No next round to generate.'
      );
    }

    // ==========================================================================
    // Step 8: Collect Winners from Current Round
    // ==========================================================================
    const winners: Array<{
      playerId: string;
      playerName: string;
      seed?: number;
      fromMatchId: string;
    }> = [];

    for (const match of completedMatches) {
      const winnerId = match._winner;
      if (!winnerId) {
        throw new HttpsError('internal', `Match ${match.id} completed but no winner set`);
      }

      let winnerPlayer = null;
      const matchData = match;

      if (matchData.player1?.playerId === winnerId) {
        winnerPlayer = matchData.player1;
      } else if (matchData.player2?.playerId === winnerId) {
        winnerPlayer = matchData.player2;
      }

      if (!winnerPlayer) {
        throw new HttpsError(
          'internal',
          `Winner ${winnerId} not found in match ${match.id} players`
        );
      }

      winners.push({
        playerId: winnerPlayer.playerId,
        playerName: winnerPlayer.playerName,
        seed: winnerPlayer.seed,
        fromMatchId: match.id,
      });
    }

    logger.info('🏆 [GENERATE_NEXT_ROUND] Collected winners', {
      count: winners.length,
      winners: winners.map(w => w.playerName),
    });

    // ==========================================================================
    // Step 9: Generate Next Round Matchups
    // ==========================================================================
    const nextRoundNumber = currentRound + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextRoundMatches: any[] = []; // Use any to allow FieldValue for timestamps

    // Create matchups (pair winners sequentially)
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        const player1 = winners[i];
        const player2 = winners[i + 1];

        const matchData = {
          roundNumber: nextRoundNumber,
          round: getRoundName(nextRoundNumber, tournamentData.totalRounds),
          status: 'scheduled' as const,
          player1: {
            playerId: player1.playerId,
            playerName: player1.playerName,
            seed: player1.seed,
            status: 'filled' as const,
          },
          player2: {
            playerId: player2.playerId,
            playerName: player2.playerName,
            seed: player2.seed,
            status: 'filled' as const,
          },
          previousMatches: [player1.fromMatchId, player2.fromMatchId],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        nextRoundMatches.push(matchData);
      }
    }

    logger.info('🎯 [GENERATE_NEXT_ROUND] Generated matchups', {
      nextRoundNumber,
      matchesCount: nextRoundMatches.length,
    });

    // ==========================================================================
    // Step 10: Save Matches to Firebase (Batch Write)
    // ==========================================================================
    const batch = db.batch();

    // Add new matches
    nextRoundMatches.forEach(matchData => {
      const newMatchRef = tournamentRef.collection('matches').doc();
      batch.set(newMatchRef, matchData);
    });

    // Update tournament currentRound
    batch.update(tournamentRef, {
      currentRound: nextRoundNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    logger.info('✅ [GENERATE_NEXT_ROUND] Successfully generated round', {
      tournamentId,
      roundNumber: nextRoundNumber,
      matchesCreated: nextRoundMatches.length,
    });

    return {
      success: true,
      message: `Successfully generated Round ${nextRoundNumber} with ${nextRoundMatches.length} matches`,
      data: {
        roundNumber: nextRoundNumber,
        matchesCreated: nextRoundMatches.length,
      },
    };
  } catch (error) {
    // Re-throw HttpsError as is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log unexpected errors
    logger.error('❌ [GENERATE_NEXT_ROUND] Unexpected error', {
      tournamentId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to generate next round: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// ==============================================================================
// Helper Functions
// ==============================================================================

/**
 * Get round name based on round number and total rounds
 *
 * @param roundNumber - Current round number
 * @param totalRounds - Total rounds in tournament
 * @returns Round name (e.g., "Final", "Semi Finals", "Quarter Finals")
 */
function getRoundName(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) {
    return 'Final';
  }
  if (roundNumber === totalRounds - 1) {
    return 'Semi Finals';
  }
  if (roundNumber === totalRounds - 2) {
    return 'Quarter Finals';
  }
  return `Round ${roundNumber}`;
}
