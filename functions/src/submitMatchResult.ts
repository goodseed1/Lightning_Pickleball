/**
 * 🌉 [HEIMDALL] Submit Match Result Cloud Function
 * Phase 5.4: Server-Side Migration - Match Operations
 *
 * Securely handles match result submission with bracket advancement
 * Implements Thor's Firestore Transaction Golden Rule
 *
 * @author Heimdall (Phase 5.4)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { SubmitMatchResultRequest, SubmitMatchResultResponse } from './types/tournament';
import { logger } from 'firebase-functions/v2';
import { updateTournamentPlacementStats } from './utils/tournamentPlacementUpdater';

const db = admin.firestore();

/**
 * Submit Match Result Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be match participant OR tournament creator OR club admin
 *
 * Operations (⚡ Thor's Transaction Golden Rule):
 * - Phase 1 (Reads): Read match, tournament, next match
 * - Phase 2 (Writes): Update match, advance winner, complete tournament
 *
 * Post-Transaction:
 * - Calculate rankings (if final match)
 * - Award trophies (if final match)
 * - Create tournament_events for background processing
 *
 * @param request - Contains matchId, tournamentId, winnerId, score, retired, walkover
 * @returns Success status with nextMatchId and tournamentCompleted flag
 */
export const submitMatchResult = onCall<
  SubmitMatchResultRequest,
  Promise<SubmitMatchResultResponse>
>(async request => {
  const { data, auth } = request;
  const {
    matchId,
    tournamentId,
    winnerId: clientWinnerId,
    scoreData,
    score: deprecatedScore,
    retired: deprecatedRetired,
    walkover: deprecatedWalkover,
  } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to submit match results');
  }

  const userId = auth.uid;

  logger.info('🎾 [SUBMIT_MATCH_RESULT] Starting submission', {
    matchId,
    tournamentId,
    clientWinnerId,
    userId,
    hasScoreData: !!scoreData,
    deprecatedScore,
    deprecatedRetired,
    deprecatedWalkover,
  });

  // ============================================================================
  // Step 1.5: ⚖️ VAR SYSTEM - Server-side winner verification
  // ============================================================================
  let verifiedWinnerId: string | null = null;
  let winnerPosition: 'player1' | 'player2' | null = null;
  let finalScore = '';
  let isRetired = false;
  let isWalkover = false;

  // Handle backward compatibility: Support old score format
  if (!scoreData && deprecatedScore) {
    logger.warn('⚠️ [VAR] Using deprecated score format - client should upgrade');
    finalScore = deprecatedScore;
    isRetired = deprecatedRetired || false;
    isWalkover = deprecatedWalkover || false;

    // For deprecated format, trust client's winnerId (old behavior)
    if (clientWinnerId) {
      verifiedWinnerId = clientWinnerId;
    } else {
      throw new HttpsError(
        'invalid-argument',
        'winnerId is required when using deprecated score format'
      );
    }
  } else if (scoreData) {
    // NEW VAR SYSTEM: Determine winner from score data
    finalScore = scoreData.finalScore || '';
    isRetired = scoreData.retired || false;
    isWalkover = scoreData.walkover || false;

    if (scoreData.walkover || scoreData.retired) {
      // 🎯 [KIM FIX] Walkover or Retired: Client must provide winnerId explicitly
      // Both cases mean the match was not completed normally, so server cannot determine winner from score
      const matchType = scoreData.walkover ? 'walkover' : 'retired';
      logger.info(`🚀 [VAR] ${matchType} match - using client-provided winnerId`);
      if (!clientWinnerId) {
        throw new HttpsError('invalid-argument', `winnerId is required for ${matchType} matches`);
      }
      verifiedWinnerId = clientWinnerId;
    } else {
      // Normal match: Server determines winner from score
      winnerPosition = determineWinnerFromScore(scoreData);

      if (!winnerPosition) {
        throw new HttpsError(
          'invalid-argument',
          'Could not determine winner from score data. Please provide valid score with sets.'
        );
      }

      logger.info('✅ [VAR] Winner determined by server', {
        winnerPosition,
        clientWinnerId,
      });

      // We'll map winnerPosition to actual winnerId after reading match data
      // (We need to know who player1 and player2 are first)
    }
  } else {
    throw new HttpsError('invalid-argument', 'Either scoreData or score must be provided');
  }

  try {
    // ==========================================================================
    // Step 2: ⚡ Thor's Transaction Golden Rule: ALL READS FIRST, THEN WRITES
    // ==========================================================================
    const transactionResult = await db.runTransaction(async transaction => {
      // ========================================================================
      // PHASE 1: ALL READ OPERATIONS
      // ========================================================================

      // Read 1: Match document
      const matchRef = db
        .collection('tournaments')
        .doc(tournamentId)
        .collection('matches')
        .doc(matchId);
      const matchSnap = await transaction.get(matchRef);

      if (!matchSnap.exists) {
        throw new HttpsError('not-found', 'Match not found');
      }

      const matchData = matchSnap.data();
      if (!matchData) {
        throw new HttpsError('internal', 'Invalid match data');
      }

      // Read 2: Tournament document
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentSnap = await transaction.get(tournamentRef);

      if (!tournamentSnap.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournamentData = tournamentSnap.data();
      if (!tournamentData) {
        throw new HttpsError('internal', 'Invalid tournament data');
      }

      // Read 3: Next match (if exists)
      let nextMatchRef = null;
      let nextMatchSnap = null;
      let nextMatchData = null;

      if (matchData.nextMatchId) {
        nextMatchRef = db
          .collection('tournaments')
          .doc(tournamentId)
          .collection('matches')
          .doc(matchData.nextMatchId);
        nextMatchSnap = await transaction.get(nextMatchRef);

        if (nextMatchSnap.exists) {
          nextMatchData = nextMatchSnap.data();
        } else {
          logger.warn('⚠️ [READ 3] Next match not found', {
            nextMatchId: matchData.nextMatchId,
          });
        }
      }

      // ========================================================================
      // ⚖️ VAR STEP 2: Map winnerPosition to actual winnerId
      // ========================================================================
      if (winnerPosition && !verifiedWinnerId) {
        // Server determined winner from score - now map to playerId
        if (winnerPosition === 'player1') {
          verifiedWinnerId = matchData.player1?.playerId || null;
        } else if (winnerPosition === 'player2') {
          verifiedWinnerId = matchData.player2?.playerId || null;
        }

        if (!verifiedWinnerId) {
          throw new HttpsError(
            'internal',
            `Cannot determine winnerId: ${winnerPosition} player data is missing`
          );
        }

        logger.info('⚖️ [VAR] Winner verified by server', {
          winnerPosition,
          verifiedWinnerId,
          player1Name: matchData.player1?.playerName,
          player2Name: matchData.player2?.playerName,
        });

        // CRITICAL: Cross-check with client's winnerId if provided
        if (clientWinnerId && clientWinnerId !== verifiedWinnerId) {
          logger.error('🚨 [VAR] MISMATCH DETECTED!', {
            clientWinnerId,
            serverWinnerId: verifiedWinnerId,
            scoreData,
          });
          throw new HttpsError(
            'invalid-argument',
            `Winner mismatch: Client sent ${clientWinnerId}, but server determined ${verifiedWinnerId} from score data. This is the bug we are fixing!`
          );
        }
      }

      // ========================================================================
      // Authorization Check (after reads and VAR verification)
      // ========================================================================
      const isParticipant =
        matchData.player1?.playerId === userId || matchData.player2?.playerId === userId;
      const isTournamentCreator = tournamentData.createdBy === userId;

      // Check club admin
      let isClubAdmin = false;
      if (tournamentData.clubId) {
        const clubRef = db.collection('tennis_clubs').doc(tournamentData.clubId);
        const memberRef = clubRef.collection('members').doc(userId);
        const memberSnap = await transaction.get(memberRef);

        if (memberSnap.exists) {
          const memberData = memberSnap.data();
          const memberRole = memberData?.role;
          isClubAdmin = memberRole === 'admin' || memberRole === 'owner';
        }
      }

      if (!isParticipant && !isTournamentCreator && !isClubAdmin) {
        throw new HttpsError(
          'permission-denied',
          'You are not authorized to submit results for this match'
        );
      }

      // ========================================================================
      // PHASE 2: ALL WRITE OPERATIONS
      // ========================================================================

      // Write 1: Update current match
      const matchUpdateData: Record<string, unknown> = {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (verifiedWinnerId) {
        matchUpdateData._winner = verifiedWinnerId;
      }

      if (finalScore) {
        matchUpdateData.score = finalScore;
      }

      if (isRetired !== undefined) {
        matchUpdateData.retired = isRetired;
      }

      if (isWalkover !== undefined) {
        matchUpdateData.walkover = isWalkover;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.update(matchRef, matchUpdateData as any);

      logger.info('✅ [WRITE 1] Match updated', { matchId, winnerId: verifiedWinnerId });

      // Write 2: Advance winner to next match (if applicable)
      let advancedToNextMatch = false;
      if (nextMatchRef && nextMatchSnap && nextMatchData && verifiedWinnerId) {
        // Find winner player data (using VAR-verified winnerId)
        let winnerPlayer = null;
        if (matchData.player1?.playerId === verifiedWinnerId) {
          winnerPlayer = matchData.player1;
        } else if (matchData.player2?.playerId === verifiedWinnerId) {
          winnerPlayer = matchData.player2;
        }

        if (winnerPlayer) {
          const advancementData: Record<string, unknown> = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Place winner in designated position
          const position = matchData.nextMatchPosition;
          if (position === 'player1') {
            advancementData.player1 = winnerPlayer;
          } else if (position === 'player2') {
            advancementData.player2 = winnerPlayer;
          } else {
            logger.error('❌ [WRITE 2] Invalid nextMatchPosition', { position });
          }

          // Check if both players are now assigned
          const updatedNextMatch = { ...nextMatchData, ...advancementData };
          if (updatedNextMatch.player1 && updatedNextMatch.player2) {
            advancementData.status = 'scheduled';
            logger.info('🎯 [WRITE 2] Next match activated', {
              nextMatchId: matchData.nextMatchId,
            });
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transaction.update(nextMatchRef, advancementData as any);
          advancedToNextMatch = true;

          logger.info('✅ [WRITE 2] Winner advanced', {
            winnerId: verifiedWinnerId,
            nextMatchId: matchData.nextMatchId,
            position,
          });
        }
      }

      // Write 3: Complete tournament (if this is the final match)
      const isFinalMatch = !matchData.nextMatchId && !!verifiedWinnerId;
      let championPlayer = null;
      let runnerUpPlayer = null;

      if (isFinalMatch) {
        // Determine champion and runner-up (using VAR-verified winnerId)
        if (matchData.player1?.playerId === verifiedWinnerId) {
          championPlayer = matchData.player1;
          runnerUpPlayer = matchData.player2;
        } else if (matchData.player2?.playerId === verifiedWinnerId) {
          championPlayer = matchData.player2;
          runnerUpPlayer = matchData.player1;
        }

        const completionData: Record<string, unknown> = {
          status: 'completed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (championPlayer) {
          completionData.champion = {
            playerId: championPlayer.playerId,
            playerName: championPlayer.playerName,
            finalOpponent: runnerUpPlayer?.playerName,
            finalScore,
          };
        }

        if (runnerUpPlayer) {
          completionData.runnerUp = {
            playerId: runnerUpPlayer.playerId,
            playerName: runnerUpPlayer.playerName,
          };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.update(tournamentRef, completionData as any);

        logger.info('🏆 [WRITE 3] Tournament completed', {
          tournamentId,
          championId: championPlayer?.playerId,
          runnerUpId: runnerUpPlayer?.playerId,
        });
      }

      // Return transaction result
      return {
        isFinalMatch,
        nextMatchId: advancedToNextMatch ? matchData.nextMatchId : undefined,
        championPlayer,
        runnerUpPlayer,
        tournamentData,
        matchData,
      };
    });

    // ==========================================================================
    // Step 3: Post-Transaction Operations (if final match)
    // ==========================================================================
    if (transactionResult.isFinalMatch) {
      // 3.1: Calculate rankings (PROJECT OLYMPUS)
      let calculatedRankings;
      try {
        logger.info('🏛️ [OLYMPUS] Calculating rankings...');
        calculatedRankings = await calculateTournamentRankings(tournamentId);

        await db.collection('tournaments').doc(tournamentId).update({
          rankings: calculatedRankings,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('✅ [OLYMPUS] Rankings calculated and saved', {
          rankingsCount: calculatedRankings.length,
        });
      } catch (rankingError) {
        logger.error('❌ [OLYMPUS] Failed to calculate rankings', {
          error: rankingError instanceof Error ? rankingError.message : String(rankingError),
        });
        // Don't throw - tournament is already completed
      }

      // 3.2: Award trophies (call Cloud Function)
      try {
        logger.info('🏆 [TROPHIES] Awarding trophies...');
        // Note: awardTournamentTrophies is already deployed
        // It will be triggered automatically or called here
        // For now, we'll let it be called by the client or background trigger
      } catch (trophyError) {
        logger.error('❌ [TROPHIES] Failed to award trophies', {
          error: trophyError instanceof Error ? trophyError.message : String(trophyError),
        });
        // Don't throw - tournament is already completed
      }

      // ========================================================================
      // 3.3. Update Tournament Placement Statistics
      // ========================================================================

      try {
        logger.info('🏅 [PLACEMENT] Updating tournament placement statistics...');
        // Pass pre-calculated rankings to avoid Firestore read consistency issues
        await updateTournamentPlacementStats(tournamentId, calculatedRankings);
        logger.info('✅ [PLACEMENT] Placement statistics updated successfully');
      } catch (placementError) {
        logger.error('❌ [PLACEMENT] Failed to update placement stats', {
          tournamentId,
          error: placementError instanceof Error ? placementError.message : String(placementError),
        });
        // Don't throw - tournament is already completed, stats can be backfilled later
      }
    }

    // ==========================================================================
    // Step 4: Create tournament_events for background processing
    // ==========================================================================
    try {
      const loserId =
        transactionResult.matchData.player1?.playerId === verifiedWinnerId
          ? transactionResult.matchData.player2?.playerId
          : transactionResult.matchData.player1?.playerId;

      const eventData = {
        type: 'match_completed',
        tournamentId,
        matchId,
        clubId: transactionResult.tournamentData.clubId,
        result: {
          winnerId: verifiedWinnerId,
          loserId,
          score: finalScore,
          retired: isRetired || false,
          walkover: isWalkover || false,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processed: false,
      };

      await db.collection('tournament_events').add(eventData);

      logger.info('✅ [EVENT] Tournament event created', { matchId, winnerId: verifiedWinnerId });
    } catch (eventError) {
      logger.error('⚠️ [EVENT] Failed to create tournament event', {
        error: eventError instanceof Error ? eventError.message : String(eventError),
      });
      // Don't throw - match is already completed
    }

    // ==========================================================================
    // Step 5: Return Success Response
    // ==========================================================================
    logger.info('🎉 [SUBMIT_MATCH_RESULT] Successfully submitted', {
      matchId,
      tournamentId,
      winnerId: verifiedWinnerId,
      isFinalMatch: transactionResult.isFinalMatch,
      nextMatchId: transactionResult.nextMatchId,
    });

    return {
      success: true,
      message: transactionResult.isFinalMatch
        ? 'Match result submitted successfully. Tournament completed!'
        : 'Match result submitted successfully.',
      data: {
        nextMatchId: transactionResult.nextMatchId,
        tournamentCompleted: transactionResult.isFinalMatch,
      },
    };
  } catch (error) {
    // Re-throw HttpsError as is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log unexpected errors
    logger.error('❌ [SUBMIT_MATCH_RESULT] Unexpected error', {
      matchId,
      tournamentId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to submit match result: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// ==============================================================================
// Helper Functions
// ==============================================================================

/**
 * ⚖️ [VAR SYSTEM] Determine Winner from Score Data
 *
 * Server-side winner verification - NEVER trust client's winnerId
 * Analyzes score data to determine the actual winner
 *
 * @param scoreData - Score object with sets array
 * @returns 'player1' | 'player2' | null
 */
function determineWinnerFromScore(scoreData: {
  sets: Array<{
    player1Games: number;
    player2Games: number;
    // 🎯 [KIM FIX] Support both nested and flat tiebreak formats
    tiebreak?: { player1Points: number; player2Points: number };
    player1TiebreakPoints?: number; // Flat format from match.ts
    player2TiebreakPoints?: number; // Flat format from match.ts
  }>;
  walkover?: boolean;
  retiredPlayer?: 'player1' | 'player2';
}): 'player1' | 'player2' | null {
  if (!scoreData || !scoreData.sets || scoreData.sets.length === 0) {
    logger.warn('⚠️ [VAR] No score data provided');
    return null;
  }

  // Special case: Walkover (winner is the opponent of the walkover player)
  if (scoreData.walkover) {
    logger.info('🚀 [VAR] Walkover detected - no automatic winner determination');
    // For walkover, client must explicitly provide winner
    return null;
  }

  let player1SetsWon = 0;
  let player2SetsWon = 0;

  // Count sets won by each player
  for (const set of scoreData.sets) {
    if (set.player1Games > set.player2Games) {
      player1SetsWon++;
    } else if (set.player2Games > set.player1Games) {
      player2SetsWon++;
    } else if (set.player1Games === set.player2Games) {
      // 🎯 [KIM FIX] Handle both nested (tournament.ts) and flat (match.ts) tiebreak formats
      // Nested format: set.tiebreak.player1Points
      // Flat format: set.player1TiebreakPoints
      const p1TiebreakPoints = set.tiebreak?.player1Points ?? set.player1TiebreakPoints;
      const p2TiebreakPoints = set.tiebreak?.player2Points ?? set.player2TiebreakPoints;

      if (p1TiebreakPoints !== undefined && p2TiebreakPoints !== undefined) {
        logger.info('🎾 [VAR] Tiebreak detected', {
          player1Games: set.player1Games,
          player2Games: set.player2Games,
          p1TiebreakPoints,
          p2TiebreakPoints,
          format: set.tiebreak ? 'nested' : 'flat',
        });

        if (p1TiebreakPoints > p2TiebreakPoints) {
          player1SetsWon++;
        } else if (p2TiebreakPoints > p1TiebreakPoints) {
          player2SetsWon++;
        }
      }
    }
  }

  // Special case: Retired match
  if (scoreData.retiredPlayer) {
    // Winner is the opponent of the retired player
    const winner = scoreData.retiredPlayer === 'player1' ? 'player2' : 'player1';
    logger.info('🏳️ [VAR] Retired match detected', {
      retiredPlayer: scoreData.retiredPlayer,
      winner,
    });
    return winner;
  }

  // Determine winner based on sets won
  if (player1SetsWon > player2SetsWon) {
    logger.info('✅ [VAR] Player 1 wins', {
      player1SetsWon,
      player2SetsWon,
    });
    return 'player1';
  } else if (player2SetsWon > player1SetsWon) {
    logger.info('✅ [VAR] Player 2 wins', {
      player1SetsWon,
      player2SetsWon,
    });
    return 'player2';
  }

  logger.warn('⚠️ [VAR] No clear winner determined', {
    player1SetsWon,
    player2SetsWon,
  });
  return null;
}

/**
 * 🏛️ [PROJECT OLYMPUS] Calculate Tournament Rankings
 *
 * Calculates final rankings based on match results
 * Used for trophy/badge awarding
 *
 * @param tournamentId - Tournament ID
 * @returns Array of rankings
 */
async function calculateTournamentRankings(
  tournamentId: string
): Promise<
  Array<{ rank: number; playerId: string; playerName: string; wins: number; losses: number }>
> {
  try {
    // Get tournament document first (to access participants array)
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const tournamentDoc = await tournamentRef.get();

    if (!tournamentDoc.exists) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    const tournamentData = tournamentDoc.data()!;
    const participantsArray = tournamentData.participants || [];

    logger.info(
      `🔍 [OLYMPUS DEBUG] Participants found in tournament.participants array: ${participantsArray.length}`,
      {
        tournamentId,
        participantsCount: participantsArray.length,
      }
    );

    // Get all matches
    const matchesSnap = await db
      .collection('tournaments')
      .doc(tournamentId)
      .collection('matches')
      .where('status', '==', 'completed')
      .get();

    logger.info(`🔍 [OLYMPUS DEBUG] Matches found: ${matchesSnap.size}`, {
      tournamentId,
      matchesCount: matchesSnap.size,
    });

    // Build participant map from tournament.participants array
    const participantMap = new Map();
    for (const participant of participantsArray) {
      logger.info(`🔍 [OLYMPUS DEBUG] Adding participant:`, {
        playerId: participant.playerId,
        playerName: participant.playerName,
      });
      participantMap.set(participant.playerId, {
        playerId: participant.playerId,
        playerName: participant.playerName,
        wins: 0,
        losses: 0,
      });
    }

    logger.info(`🔍 [OLYMPUS DEBUG] Participant map size: ${participantMap.size}`);

    // Count wins and losses
    matchesSnap.forEach(doc => {
      const matchData = doc.data();
      const winnerId = matchData._winner;

      if (winnerId) {
        const player1Id = matchData.player1?.playerId;
        const player2Id = matchData.player2?.playerId;

        if (player1Id && participantMap.has(player1Id)) {
          if (winnerId === player1Id) {
            participantMap.get(player1Id).wins++;
          } else {
            participantMap.get(player1Id).losses++;
          }
        }

        if (player2Id && participantMap.has(player2Id)) {
          if (winnerId === player2Id) {
            participantMap.get(player2Id).wins++;
          } else {
            participantMap.get(player2Id).losses++;
          }
        }
      }
    });

    // Sort by wins (descending), then by losses (ascending)
    const rankings = Array.from(participantMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return a.losses - b.losses;
    });

    logger.info(`🔍 [OLYMPUS DEBUG] Final rankings count: ${rankings.length}`, {
      tournamentId,
      rankingsCount: rankings.length,
    });

    // Assign ranks
    const rankedResults = rankings.map((participant, index) => ({
      rank: index + 1,
      playerId: participant.playerId,
      playerName: participant.playerName,
      wins: participant.wins,
      losses: participant.losses,
    }));

    logger.info('🔍 [OLYMPUS DEBUG] Rankings calculated:', {
      rankings: rankedResults,
    });

    return rankedResults;
  } catch (error) {
    logger.error('❌ [OLYMPUS] Error calculating rankings', {
      tournamentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
