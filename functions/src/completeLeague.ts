/**
 * 🔒 Complete League Cloud Function
 *
 * Securely completes a league with server-side validation:
 * - Authorization check (creator or club admin)
 * - Business logic validation (status must be 'ongoing' or 'playoffs')
 * - Winner/Runner-up calculation from standings
 * - Atomic transaction (status + trophy + badge + feed)
 * - Push notification
 *
 * @author Captain America
 * @date 2025-11-16
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { CompleteLeagueRequest, CompleteLeagueResponse } from './types/league';

const db = admin.firestore();

/**
 * ============================================================================
 * Cloud Function: completeLeague
 * ============================================================================
 *
 * Completes a league with server-side validation and trophy/badge awarding
 *
 * Security:
 * - Requires authentication
 * - Only league creator or club admins can complete
 * - Validates business rules (status must be ongoing/playoffs)
 * - Automatically calculates winner/runner-up from standings
 *
 * Atomicity:
 * - Uses Firestore transactions for atomic updates
 * - Ensures status consistency
 *
 * Post-Processing:
 * - Trophy/Badge awarding handled by onLeagueCompleted trigger
 * - Feed creation handled by onLeagueCompleted trigger
 *
 * @param data - CompleteLeagueRequest
 * @param context - Authenticated user context
 * @returns CompleteLeagueResponse
 */
export const completeLeague = onCall<CompleteLeagueRequest, Promise<CompleteLeagueResponse>>(
  async request => {
    const { data, auth } = request;
    const { leagueId } = data;

    // ========================================================================
    // Step 1: Authentication
    // ========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to complete a league');
    }

    const userId = auth.uid;

    logger.info('🏁 [COMPLETE_LEAGUE] Starting', { leagueId, userId });

    try {
      // ======================================================================
      // Step 2: Transaction (Atomic!)
      // ======================================================================
      const result = await db.runTransaction(async transaction => {
        // 2.1: Get league data
        const leagueRef = db.collection('leagues').doc(leagueId);
        const leagueDoc = await transaction.get(leagueRef);

        if (!leagueDoc.exists) {
          throw new HttpsError('not-found', 'League not found');
        }

        const leagueData = leagueDoc.data()!;

        // 2.2: Authorization check
        const isCreator = leagueData.createdBy === userId;

        // Check club admin
        const clubId = leagueData.clubId;
        const clubMemberRef = db.collection('clubMembers').doc(`${clubId}_${userId}`);
        const clubMemberDoc = await transaction.get(clubMemberRef);

        // 🎯 [KIM FIX] 운영진(manager)도 권한 부여
        const isClubAdminOrManager =
          clubMemberDoc.exists &&
          (clubMemberDoc.data()?.role === 'admin' ||
            clubMemberDoc.data()?.role === 'owner' ||
            clubMemberDoc.data()?.role === 'manager');

        if (!isCreator && !isClubAdminOrManager) {
          throw new HttpsError(
            'permission-denied',
            'Only league creator, club admin, or manager can complete the league'
          );
        }

        logger.info('✅ [COMPLETE_LEAGUE] Authorization passed', {
          isCreator,
          isClubAdminOrManager,
        });

        // 2.3: Business logic validation
        if (leagueData.status !== 'ongoing' && leagueData.status !== 'playoffs') {
          throw new HttpsError(
            'failed-precondition',
            `League must be ongoing or playoffs to complete. Current status: ${leagueData.status}`
          );
        }

        // 2.4: Calculate winner and runner-up
        let winner, runnerUp, thirdPlace, fourthPlace;
        let playoffUpdate = {};

        // Check if playoff exists
        if (leagueData.status === 'playoffs' && leagueData.playoff) {
          // Get playoff matches to determine ranking
          const playoffMatchesSnapshot = await db
            .collection('leagues')
            .doc(leagueId)
            .collection('playoff_matches')
            .get();

          const playoffMatches = playoffMatchesSnapshot.docs.map(doc => doc.data());

          // Find final and consolation matches
          const finalMatch = playoffMatches.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (m: any) => m.type === 'final'
          );
          const consolationMatch = playoffMatches.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (m: any) => m.type === 'consolation'
          );

          if (finalMatch?.status === 'completed' && finalMatch.winner) {
            // Determine winner and runner-up from final match
            const winnerId = finalMatch.winner;
            const runnerUpId =
              finalMatch.player1Id === winnerId ? finalMatch.player2Id : finalMatch.player1Id;

            winner = {
              playerId: winnerId,
              playerName:
                finalMatch.player1Id === winnerId ? finalMatch.player1Name : finalMatch.player2Name,
            };

            runnerUp = {
              playerId: runnerUpId,
              playerName:
                finalMatch.player1Id === runnerUpId
                  ? finalMatch.player1Name
                  : finalMatch.player2Name,
            };
          }

          if (consolationMatch?.status === 'completed' && consolationMatch.winner) {
            // Determine 3rd and 4th place from consolation match
            const thirdPlaceId = consolationMatch.winner;
            const fourthPlaceId =
              consolationMatch.player1Id === thirdPlaceId
                ? consolationMatch.player2Id
                : consolationMatch.player1Id;

            thirdPlace = {
              playerId: thirdPlaceId,
              playerName:
                consolationMatch.player1Id === thirdPlaceId
                  ? consolationMatch.player1Name
                  : consolationMatch.player2Name,
            };

            fourthPlace = {
              playerId: fourthPlaceId,
              playerName:
                consolationMatch.player1Id === fourthPlaceId
                  ? consolationMatch.player1Name
                  : consolationMatch.player2Name,
            };
          }

          // Update playoff object with rankings
          playoffUpdate = {
            'playoff.isComplete': true,
            'playoff.winner': winner?.playerId || null,
            'playoff.runnerUp': runnerUp?.playerId || null,
            'playoff.thirdPlace': thirdPlace?.playerId || null,
            'playoff.fourthPlace': fourthPlace?.playerId || null,
            'playoff.winnerName': winner?.playerName || null,
            'playoff.runnerUpName': runnerUp?.playerName || null,
            'playoff.thirdPlaceName': thirdPlace?.playerName || null,
            'playoff.fourthPlaceName': fourthPlace?.playerName || null,
          };

          logger.info('🏆 [COMPLETE_LEAGUE] Playoff rankings determined', {
            winner: winner?.playerName,
            runnerUp: runnerUp?.playerName,
            thirdPlace: thirdPlace?.playerName,
            fourthPlace: fourthPlace?.playerName,
          });
        } else {
          // Fallback to standings for non-playoff leagues
          const standings = leagueData.standings || [];

          if (standings.length === 0) {
            throw new HttpsError('failed-precondition', 'No standings data available');
          }

          // Sort by points (should already be sorted, but ensure it)
          const sortedStandings = [...standings].sort((a, b) => b.points - a.points);

          winner = sortedStandings[0];
          runnerUp = sortedStandings.length > 1 ? sortedStandings[1] : null;

          logger.info('🏆 [COMPLETE_LEAGUE] Winner determined from standings', {
            winner: winner.playerName,
            runnerUp: runnerUp?.playerName || 'N/A',
          });
        }

        // 2.5: Build champion/runnerUp objects

        const championData = {
          playerId: winner.playerId,
          playerName: winner.playerName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finalPoints: (winner as any).points || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finalRecord: (winner as any).won
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              `${(winner as any).won}W-${(winner as any).drawn || 0}D-${(winner as any).lost}L`
            : 'Playoff Winner',
        };

        const runnerUpData = runnerUp
          ? {
              playerId: runnerUp.playerId,
              playerName: runnerUp.playerName,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              finalPoints: (runnerUp as any).points || 0,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              finalRecord: (runnerUp as any).won
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  `${(runnerUp as any).won}W-${(runnerUp as any).drawn || 0}D-${(runnerUp as any).lost}L`
                : 'Playoff Runner-up',
            }
          : null;

        // 2.6: Update league document (atomic!)
        transaction.update(leagueRef, {
          status: 'completed',
          winnerId: winner.playerId,
          runnerUpId: runnerUp?.playerId || null,
          champion: championData,
          runnerUp: runnerUpData,
          ...playoffUpdate, // ✅ Include playoff rankings
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('✅ [COMPLETE_LEAGUE] League document updated');

        return {
          winner: championData,
          runnerUp: runnerUpData,
          leagueData,
        };
      });

      // ======================================================================
      // Step 3: Post-Transaction Operations
      // (Trophy, Badge, Feed are handled by onLeagueCompleted trigger)
      // ======================================================================

      logger.info('✅ [COMPLETE_LEAGUE] Completed successfully', {
        leagueId,
        winner: result.winner.playerName,
      });

      return {
        success: true,
        message: 'League completed successfully',
        data: {
          winner: result.winner,
          ...(result.runnerUp && { runnerUp: result.runnerUp }),
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('❌ [COMPLETE_LEAGUE] Unexpected error', {
        leagueId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to complete league: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
