/**
 * ⚡ [THOR] Tournament Placement Statistics Updater
 *
 * Updates user tournament placement stats (championships, runner-ups, semi-finals)
 * when a tournament is completed.
 *
 * Root Cause Fix: Addresses missing tournament placement statistics in clubStats
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

const db = admin.firestore();

/**
 * Participant placement information from tournament rankings
 */
interface ParticipantPlacement {
  playerId: string;
  playerName: string;
  rank: number; // 1, 2, 3, 4, 5, ...
  wins: number;
  losses: number;
}

/**
 * Updates tournament placement statistics for all participants
 * when a tournament is completed.
 *
 * Updates the following fields in clubMembers/{clubId}_{userId}/clubStats/tournamentStats:
 * - championships (1st place)
 * - runnerUps (2nd place)
 * - semiFinals (3rd-4th place)
 * - bestFinish (best placement ever)
 * - tournamentsPlayed (total tournaments)
 *
 * @param tournamentId - Tournament document ID
 * @returns Promise<void>
 */
export async function updateTournamentPlacementStats(
  tournamentId: string,
  preCalculatedRankings?: ParticipantPlacement[]
): Promise<void> {
  try {
    logger.info('⚡ [THOR] Updating tournament placement stats', {
      tournamentId,
      hasPreCalculatedRankings: !!preCalculatedRankings,
    });

    // 1. Get tournament document (only if rankings not provided)
    let clubId: string;
    let rankings: ParticipantPlacement[];

    if (preCalculatedRankings && preCalculatedRankings.length > 0) {
      // Use pre-calculated rankings (avoids Firestore read consistency issues)
      rankings = preCalculatedRankings;

      // Still need clubId from tournament document
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentDoc = await tournamentRef.get();

      if (!tournamentDoc.exists) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }

      const tournamentData = tournamentDoc.data()!;
      clubId = tournamentData.clubId;
    } else {
      // Fallback: read from tournament document
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentDoc = await tournamentRef.get();

      if (!tournamentDoc.exists) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }

      const tournamentData = tournamentDoc.data()!;
      clubId = tournamentData.clubId;
      rankings = tournamentData.rankings || [];
    }

    if (!clubId) {
      throw new Error(`Tournament ${tournamentId} has no clubId`);
    }

    if (rankings.length === 0) {
      logger.warn('⚠️ [THOR] No rankings found, cannot update placement stats', {
        tournamentId,
      });
      return;
    }

    logger.info(`⚡ [THOR] Processing ${rankings.length} participants`, {
      tournamentId,
      clubId,
    });

    // 2. Batch update all participant stats
    const batch = db.batch();
    let updateCount = 0;

    for (const participant of rankings) {
      const { playerId, rank } = participant;

      // Extract actual player ID (handle doubles format: "player1Id_player2Id")
      const playerIds = playerId.includes('_') ? playerId.split('_') : [playerId];

      for (const actualPlayerId of playerIds) {
        try {
          // 🔧 FIX: Use clubMembers root collection (matches Cloud Functions write path)
          const membershipId = `${clubId}_${actualPlayerId}`;
          const membershipRef = db.collection('clubMembers').doc(membershipId);

          // Check if membership exists
          const membershipDoc = await membershipRef.get();
          if (!membershipDoc.exists) {
            logger.warn(`⚠️ [THOR] Membership not found, skipping`, {
              userId: actualPlayerId,
              clubId,
            });
            continue;
          }

          // Prepare stats update
          const statsUpdate: Record<string, unknown> = {
            'clubStats.tournamentStats.tournamentsPlayed': admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Update placement stats based on rank
          if (rank === 1) {
            // Champion (1st place)
            statsUpdate['clubStats.tournamentStats.championships'] =
              admin.firestore.FieldValue.increment(1);
            logger.info(`🥇 [THOR] Champion: ${actualPlayerId} (rank ${rank})`);
          } else if (rank === 2) {
            // Runner-up (2nd place)
            statsUpdate['clubStats.tournamentStats.runnerUps'] =
              admin.firestore.FieldValue.increment(1);
            logger.info(`🥈 [THOR] Runner-up: ${actualPlayerId} (rank ${rank})`);
          } else if (rank === 3 || rank === 4) {
            // Semi-finalists (3rd-4th place)
            statsUpdate['clubStats.tournamentStats.semiFinals'] =
              admin.firestore.FieldValue.increment(1);
            logger.info(`🥉 [THOR] Semi-finalist: ${actualPlayerId} (rank ${rank})`);
          }

          // Update bestFinish (lower number = better)
          const currentData = membershipDoc.data();
          const currentBestFinish = currentData?.clubStats?.tournamentStats?.bestFinish;

          if (!currentBestFinish || rank < currentBestFinish) {
            statsUpdate['clubStats.tournamentStats.bestFinish'] = rank;
            logger.info(`🏆 [THOR] New best finish: ${actualPlayerId} (${rank})`);
          }

          // Add to batch
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          batch.update(membershipRef, statsUpdate as any);
          updateCount++;
        } catch (error) {
          logger.error(`❌ [THOR] Error updating stats for player ${actualPlayerId}`, {
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue with other players
        }
      }
    }

    // 3. Commit batch
    if (updateCount > 0) {
      await batch.commit();
      logger.info(`✅ [THOR] Successfully updated placement stats for ${updateCount} players`, {
        tournamentId,
        clubId,
      });
    } else {
      logger.warn('⚠️ [THOR] No stats were updated', { tournamentId });
    }
  } catch (error) {
    logger.error('❌ [THOR] Failed to update tournament placement stats', {
      tournamentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - we don't want to fail the tournament completion
    // Stats can be backfilled later if needed
  }
}
