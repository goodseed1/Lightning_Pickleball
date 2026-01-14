/**
 * 🌉 [HEIMDALL] Generate Round-Robin Matches Cloud Function
 * Phase 5.12: Server-Side Migration - Match Generation
 *
 * Generates all round-robin matches for a league and updates league status to 'ongoing'
 * Uses Admin SDK to bypass Security Rules and ensure atomic operations
 *
 * @author Kim (Phase 5.12)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface GenerateRoundRobinMatchesRequest {
  leagueId: string;
}

interface GenerateRoundRobinMatchesResponse {
  success: boolean;
  message: string;
  data?: {
    matchCount: number;
    totalRounds: number;
  };
}

/**
 * Generate Round-Robin Matches Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - League must be in 'preparing' status
 * - At least 2 participants required
 *
 * Operations:
 * 1. Validate league exists and is in 'preparing' status
 * 2. Validate minimum 2 participants
 * 3. Fetch participant display names from users collection
 * 4. Generate all round-robin matches (every player vs every other player)
 * 5. Batch write matches to leagues/{leagueId}/matches subcollection
 * 6. Initialize standings for all participants
 * 7. Update league status to 'ongoing' with standings and round info
 *
 * @param request - Contains leagueId
 * @returns Success status with match count
 */
export const generateRoundRobinMatches = onCall<
  GenerateRoundRobinMatchesRequest,
  Promise<GenerateRoundRobinMatchesResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to generate matches');
  }

  logger.info('⚡ [GENERATE_ROUND_ROBIN] Starting', {
    leagueId,
    userId: auth.uid,
  });

  try {
    // ==========================================================================
    // Step 2: Get League Data
    // ==========================================================================
    const leagueRef = db.collection('leagues').doc(leagueId);
    const leagueSnap = await leagueRef.get();

    if (!leagueSnap.exists) {
      throw new HttpsError('not-found', 'League not found');
    }

    const league = leagueSnap.data();
    if (!league) {
      throw new HttpsError('internal', 'Invalid league data');
    }

    // ==========================================================================
    // Step 3: Validate League Status
    // ==========================================================================
    if (league.status !== 'preparing') {
      throw new HttpsError(
        'failed-precondition',
        `League must be in 'preparing' status. Current status: ${league.status}`
      );
    }

    // ==========================================================================
    // Step 4: Validate Participants
    // ==========================================================================
    const participants = league.participants || [];

    // Handle both string[] and object[] formats for backwards compatibility
    const participantIds: string[] = participants.map((p: string | { playerId: string }) =>
      typeof p === 'string' ? p : p.playerId
    );

    logger.info('📋 [GENERATE_ROUND_ROBIN] Found participants', {
      count: participantIds.length,
      participants: participantIds,
    });

    if (participantIds.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot generate matches: No participants found in league'
      );
    }

    if (participantIds.length < 2) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot generate matches: At least 2 participants required for round-robin'
      );
    }

    // ==========================================================================
    // Step 5: Fetch Participant Display Names
    // ==========================================================================
    const participantMap = new Map<string, string>();

    // Fetch user profiles in batches (Firestore 'in' query limit is 10)
    const batchSize = 10;
    for (let i = 0; i < participantIds.length; i += batchSize) {
      const batch = participantIds.slice(i, i + batchSize);
      const usersQuery = await db.collection('users').where('uid', 'in', batch).get();

      usersQuery.docs.forEach(doc => {
        const userData = doc.data();
        const displayName =
          userData.profile?.displayName ||
          userData.profile?.name ||
          userData.profile?.nickname ||
          userData.displayName ||
          userData.name ||
          userData.firstName ||
          `User ${userData.uid?.slice(-4)}`;

        participantMap.set(userData.uid, displayName);

        logger.info('🔍 [GENERATE_ROUND_ROBIN] User name mapped', {
          uid: userData.uid,
          displayName,
        });
      });
    }

    logger.info('🗺️ [GENERATE_ROUND_ROBIN] Participant name mapping complete', {
      count: participantMap.size,
    });

    // ==========================================================================
    // Step 6: Determine League Type (Singles vs Doubles)
    // ==========================================================================
    const eventType = league.eventType || 'mens_singles';
    const isDoubles =
      eventType === 'mens_doubles' ||
      eventType === 'womens_doubles' ||
      eventType === 'mixed_doubles';

    logger.info('📊 [GENERATE_ROUND_ROBIN] League type', {
      eventType,
      isDoubles,
      participantCount: participantIds.length,
    });

    // ==========================================================================
    // Step 7: Generate Round-Robin Matches
    // ==========================================================================
    const matches: Array<Record<string, unknown>> = [];
    let round = 1;

    if (isDoubles) {
      // ========================================================================
      // DOUBLES: Use team IDs from participants array
      // ========================================================================
      for (let i = 0; i < participantIds.length; i++) {
        for (let j = i + 1; j < participantIds.length; j++) {
          const team1Id = participantIds[i];
          const team2Id = participantIds[j];

          // Get team info from participants array
          const team1 = participants.find((p: { playerId?: string }) => p.playerId === team1Id);
          const team2 = participants.find((p: { playerId?: string }) => p.playerId === team2Id);

          if (!team1 || !team2) {
            logger.warn('⚠️ [GENERATE_ROUND_ROBIN] Team not found', {
              team1Id,
              team2Id,
            });
            continue;
          }

          const match = {
            leagueId,
            eventType,
            round,
            matchNumber: matches.length + 1,

            // Use team IDs as player IDs for compatibility
            player1Id: team1Id,
            player2Id: team2Id,
            player1Name: team1.playerName || 'Team 1',
            player2Name: team2.playerName || 'Team 2',

            // Doubles-specific: team info
            team1Id,
            team2Id,
            team1Name: team1.playerName,
            team2Name: team2.playerName,
            team1Player1Id: team1.player1Id,
            team1Player1Name: team1.player1Name,
            team1Player2Id: team1.player2Id,
            team1Player2Name: team1.player2Name,
            team2Player1Id: team2.player1Id,
            team2Player1Name: team2.player1Name,
            team2Player2Id: team2.player2Id,
            team2Player2Name: team2.player2Name,

            status: 'scheduled',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          matches.push(match);

          logger.info('🏓 [GENERATE_ROUND_ROBIN] Doubles match created', {
            matchNumber: match.matchNumber,
            team1: match.team1Name,
            team2: match.team2Name,
            round,
          });

          // Calculate round
          if (matches.length % Math.floor(participantIds.length / 2) === 0) {
            round++;
          }
        }
      }
    } else {
      // ========================================================================
      // SINGLES: Use individual player IDs
      // ========================================================================
      for (let i = 0; i < participantIds.length; i++) {
        for (let j = i + 1; j < participantIds.length; j++) {
          const player1Id = participantIds[i];
          const player2Id = participantIds[j];
          const player1Name = participantMap.get(player1Id) || `Player ${player1Id.slice(-4)}`;
          const player2Name = participantMap.get(player2Id) || `Player ${player2Id.slice(-4)}`;

          const match = {
            leagueId,
            eventType,
            round,
            matchNumber: matches.length + 1,
            player1Id,
            player2Id,
            player1Name,
            player2Name,
            status: 'scheduled',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          matches.push(match);

          logger.info('🏓 [GENERATE_ROUND_ROBIN] Singles match created', {
            matchNumber: match.matchNumber,
            player1: player1Name,
            player2: player2Name,
            round,
          });

          // Calculate round
          if (matches.length % Math.floor(participantIds.length / 2) === 0) {
            round++;
          }
        }
      }
    }

    const totalRounds = round - 1;

    logger.info('📊 [GENERATE_ROUND_ROBIN] Match generation complete', {
      totalMatches: matches.length,
      totalRounds,
    });

    // ==========================================================================
    // Step 7: Batch Write Matches to Subcollection
    // ==========================================================================
    const batch = db.batch();
    const matchesCollectionRef = leagueRef.collection('matches');

    for (const match of matches) {
      const matchRef = matchesCollectionRef.doc();
      const matchWithId = {
        ...match,
        id: matchRef.id,
      };
      batch.set(matchRef, matchWithId);
    }

    logger.info('💾 [GENERATE_ROUND_ROBIN] Batch writing matches', {
      count: matches.length,
      subcollection: `leagues/${leagueId}/matches`,
    });

    // ==========================================================================
    // Step 8: Initialize Standings
    // ==========================================================================
    const initialStandings = participantIds.map((playerId, index) => ({
      playerId,
      playerName: participantMap.get(playerId) || `Player ${index + 1}`,
      position: index + 1,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDifference: 0,
      setsWon: 0,
      setsLost: 0,
      setDifference: 0,
      streak: { type: 'none', count: 0 },
    }));

    logger.info('📊 [GENERATE_ROUND_ROBIN] Initialized standings', {
      count: initialStandings.length,
    });

    // ==========================================================================
    // Step 9: Update League Document
    // ==========================================================================
    batch.update(leagueRef, {
      status: 'ongoing',
      totalRounds,
      currentRound: 1,
      standings: initialStandings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Commit the entire batch
    await batch.commit();

    logger.info('✅ [GENERATE_ROUND_ROBIN] Success', {
      matchCount: matches.length,
      totalRounds,
    });

    return {
      success: true,
      message: `Successfully generated ${matches.length} round-robin matches`,
      data: {
        matchCount: matches.length,
        totalRounds,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [GENERATE_ROUND_ROBIN] Unexpected error', {
      leagueId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to generate matches: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
