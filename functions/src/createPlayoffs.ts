/**
 * 🌉 [HEIMDALL] Create Playoffs Cloud Function
 * Phase 5.13: Server-Side Migration - Playoff Creation
 *
 * Creates playoff bpaddle with tiebreaker rules and match generation
 * Uses Admin SDK to bypass Security Rules and ensure atomic operations
 *
 * @author Kim (Phase 5.13)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface CreatePlayoffsRequest {
  leagueId: string;
}

interface CreatePlayoffsResponse {
  success: boolean;
  message: string;
  data?: {
    playoffType: 'final' | 'semifinals';
    matchCount: number;
    qualifiedPlayers: string[];
  };
}

interface PlayerStanding {
  playerId: string;
  playerName: string;
  position?: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  gamesWon?: number;
  gamesLost?: number;
  gameDifference?: number;
  setsWon?: number;
  setsLost?: number;
  setDifference?: number;
  streak?: { type: string; count: number };
  // Doubles-specific fields
  teamId?: string;
  player1Id?: string;
  player1Name?: string;
  player2Id?: string;
  player2Name?: string;
}

interface LeagueMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  _winner?: string;
  status: string;
}

interface PlayoffMatch {
  id?: string;
  type: 'semifinals' | 'final' | 'consolation';
  isPlayoffMatch: true;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  status: 'scheduled' | 'pending';
  nextMatchForWinner?: string | null;
  nextMatchForLoser?: string | null;
  nextMatchPositionForWinner?: 'player1' | 'player2';
  nextMatchPositionForLoser?: 'player1' | 'player2';
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

/**
 * Create Playoffs Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - League must be in 'ongoing' status
 * - All regular season matches must be completed
 *
 * Operations:
 * 1. Validate league and match completion
 * 2. Apply tiebreaker rules to sort standings
 * 3. Select top 4 qualified players
 * 4. Generate playoff matches (semifinals + final + consolation)
 * 5. Update league status to 'playoffs'
 *
 * @param request - Contains leagueId
 * @returns Success status with playoff info
 */
export const createPlayoffs = onCall<CreatePlayoffsRequest, Promise<CreatePlayoffsResponse>>(
  async request => {
    const { data, auth } = request;
    const { leagueId } = data;

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to create playoffs');
    }

    logger.info('⚡ [CREATE_PLAYOFFS] Starting', {
      leagueId,
      userId: auth.uid,
    });

    try {
      // ========================================================================
      // Step 2: Get League Data
      // ========================================================================
      const leagueRef = db.collection('leagues').doc(leagueId);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        throw new HttpsError('not-found', 'League not found');
      }

      const league = leagueSnap.data();
      if (!league) {
        throw new HttpsError('internal', 'Invalid league data');
      }

      // ========================================================================
      // Step 3: Validate League Status
      // ========================================================================
      if (league.status !== 'ongoing') {
        throw new HttpsError(
          'failed-precondition',
          `League must be in 'ongoing' status. Current status: ${league.status}`
        );
      }

      // ========================================================================
      // Step 4: Validate All Matches Completed
      // ========================================================================
      const matchesSnap = await leagueRef.collection('matches').get();
      const allMatches = matchesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LeagueMatch[];

      const completedMatches = allMatches.filter(m => m.status === 'completed');
      const totalMatches = allMatches.length;

      logger.info('📊 [CREATE_PLAYOFFS] Match completion check', {
        completed: completedMatches.length,
        total: totalMatches,
      });

      if (completedMatches.length !== totalMatches) {
        throw new HttpsError(
          'failed-precondition',
          `Not all matches are completed. Completed: ${completedMatches.length}/${totalMatches}`
        );
      }

      // ========================================================================
      // Step 5: Apply Tiebreaker Rules to Sort Standings
      // ========================================================================
      const standings = (league.standings || []) as PlayerStanding[];

      if (standings.length === 0) {
        throw new HttpsError('failed-precondition', 'No standings found');
      }

      logger.info('🏆 [CREATE_PLAYOFFS] Sorting standings with tiebreakers', {
        totalPlayers: standings.length,
      });

      const sortedStandings = [...standings].sort((playerA, playerB) => {
        // 1. Points comparison
        if (playerB.points !== playerA.points) {
          return playerB.points - playerA.points;
        }

        // 2. Head-to-head comparison
        const headToHeadResult = compareHeadToHead(playerA, playerB, allMatches);
        if (headToHeadResult !== 0) {
          return headToHeadResult;
        }

        // 3. Set ratio comparison
        const setRatioA = (playerA.setsWon || 0) / (playerA.setsLost || 0 || 1);
        const setRatioB = (playerB.setsWon || 0) / (playerB.setsLost || 0 || 1);
        if (setRatioB !== setRatioA) {
          return setRatioB - setRatioA;
        }

        // 4. Game ratio comparison
        const gameRatioA = (playerA.gamesWon || 0) / (playerA.gamesLost || 0 || 1);
        const gameRatioB = (playerB.gamesWon || 0) / (playerB.gamesLost || 0 || 1);
        if (gameRatioB !== gameRatioA) {
          return gameRatioB - gameRatioA;
        }

        // 5. All equal - maintain order
        return 0;
      });

      logger.info(
        '✅ [CREATE_PLAYOFFS] Final standings after tiebreakers',
        sortedStandings.slice(0, 4).map((p, i) => `${i + 1}. ${p.playerName} (${p.points}점)`)
      );

      // ========================================================================
      // Step 6: Select Top 4 Qualified Players
      // ========================================================================
      const qualifiedPlayers = sortedStandings.slice(0, Math.min(4, sortedStandings.length));

      if (qualifiedPlayers.length < 2) {
        throw new HttpsError('failed-precondition', 'At least 2 players required for playoffs');
      }

      logger.info('🎯 [CREATE_PLAYOFFS] Qualified players', {
        count: qualifiedPlayers.length,
        players: qualifiedPlayers.map(p => p.playerName),
      });

      // ========================================================================
      // Step 7: Generate Playoff Matches with Pre-generated IDs
      // ========================================================================
      const playoffMatchesRef = leagueRef.collection('playoff_matches');

      // Pre-generate Firestore document IDs for cross-referencing
      const semi1Ref = playoffMatchesRef.doc();
      const semi2Ref = playoffMatchesRef.doc();
      const finalRef = playoffMatchesRef.doc();
      const consolationRef = playoffMatchesRef.doc();

      const matchIds = {
        semi1: semi1Ref.id,
        semi2: semi2Ref.id,
        final: finalRef.id,
        consolation: consolationRef.id,
      };

      logger.info('🎯 [CREATE_PLAYOFFS] Pre-generated match IDs', matchIds);

      const { matches, playoffType } = generatePlayoffMatches(leagueId, qualifiedPlayers, matchIds);

      // Batch write playoff matches with pre-generated IDs
      const batch = db.batch();

      if (playoffType === 'final') {
        // Only final match (< 4 players)
        batch.set(finalRef, matches[0]);
        logger.info('🏓 [CREATE_PLAYOFFS] Final match created', {
          matchId: matches[0].id,
          player1: matches[0].player1Name,
          player2: matches[0].player2Name,
        });
      } else {
        // Full bpaddle (4 players)
        const matchRefs = [semi1Ref, semi2Ref, finalRef, consolationRef];
        matches.forEach((match, index) => {
          batch.set(matchRefs[index], match);
          logger.info('🏓 [CREATE_PLAYOFFS] Playoff match created', {
            type: match.type,
            matchId: match.id,
            player1: match.player1Name,
            player2: match.player2Name,
          });
        });
      }

      // ========================================================================
      // Step 8: Update League to Playoffs Status
      // ========================================================================
      const playoffInfo = {
        type: playoffType,
        qualifiedPlayers: qualifiedPlayers.map(p => p.playerId),
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        isComplete: false,
      };

      batch.update(leagueRef, {
        status: 'playoffs',
        regularSeasonComplete: true,
        playoff: playoffInfo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Commit the entire batch
      await batch.commit();

      logger.info('✅ [CREATE_PLAYOFFS] Success', {
        playoffType,
        matchCount: matches.length,
        qualifiedPlayers: qualifiedPlayers.map(p => p.playerName),
      });

      return {
        success: true,
        message: `Successfully created ${playoffType} playoffs with ${matches.length} matches`,
        data: {
          playoffType,
          matchCount: matches.length,
          qualifiedPlayers: qualifiedPlayers.map(p => p.playerId),
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('❌ [CREATE_PLAYOFFS] Unexpected error', {
        leagueId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to create playoffs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

/**
 * Compare head-to-head record between two players
 * Returns positive if playerB won more, negative if playerA won more
 */
function compareHeadToHead(
  playerA: PlayerStanding,
  playerB: PlayerStanding,
  allMatches: LeagueMatch[]
): number {
  let aWins = 0;
  let bWins = 0;

  for (const match of allMatches) {
    const isAvsB =
      (match.player1Id === playerA.playerId && match.player2Id === playerB.playerId) ||
      (match.player1Id === playerB.playerId && match.player2Id === playerA.playerId);

    if (!isAvsB || match.status !== 'completed') {
      continue;
    }

    const winner = match._winner;
    if (!winner) continue;

    if (winner === playerA.playerId) {
      aWins++;
    } else if (winner === playerB.playerId) {
      bWins++;
    }
  }

  return bWins - aWins;
}

/**
 * Generate playoff matches based on qualified players count
 * Supports both singles and doubles (teams)
 */
function generatePlayoffMatches(
  leagueId: string,
  qualifiedPlayers: PlayerStanding[],
  matchIds: { semi1: string; semi2: string; final: string; consolation: string }
): {
  matches: PlayoffMatch[];
  playoffType: 'final' | 'semifinals';
} {
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Check if this is a team (doubles) based on first player
  const isTeam = !!qualifiedPlayers[0]?.teamId;

  // Legacy mode: Only final if < 4 participants
  if (qualifiedPlayers.length < 4) {
    const player1 = qualifiedPlayers[0];
    const player2 = qualifiedPlayers[1];

    const finalMatch: PlayoffMatch = {
      id: matchIds.final,
      type: 'final',
      isPlayoffMatch: true,
      round: 1,
      player1Id: player1?.playerId || null,
      player2Id: player2?.playerId || null,
      player1Name: player1?.playerName || 'TBD',
      player2Name: player2?.playerName || 'TBD',
      status: 'scheduled',
      nextMatchForWinner: null,
      nextMatchForLoser: null,
      createdAt: now,
      updatedAt: now,
    };

    // Add team info if doubles
    if (isTeam) {
      Object.assign(finalMatch, {
        team1Id: player1?.teamId,
        team1Name: player1?.playerName,
        team1Player1Id: player1?.player1Id,
        team1Player1Name: player1?.player1Name,
        team1Player2Id: player1?.player2Id,
        team1Player2Name: player1?.player2Name,
        team2Id: player2?.teamId,
        team2Name: player2?.playerName,
        team2Player1Id: player2?.player1Id,
        team2Player1Name: player2?.player1Name,
        team2Player2Id: player2?.player2Id,
        team2Player2Name: player2?.player2Name,
      });
    }

    return {
      matches: [finalMatch],
      playoffType: 'final',
    };
  }

  // 4-participant bpaddle: Semifinals + Final + Consolation
  const p1 = qualifiedPlayers[0];
  const p2 = qualifiedPlayers[1];
  const p3 = qualifiedPlayers[2];
  const p4 = qualifiedPlayers[3];

  const semifinal1: PlayoffMatch = {
    id: matchIds.semi1,
    type: 'semifinals',
    isPlayoffMatch: true,
    round: 2,
    player1Id: p1.playerId,
    player2Id: p4.playerId,
    player1Name: p1.playerName,
    player2Name: p4.playerName,
    status: 'scheduled',
    nextMatchForWinner: matchIds.final,
    nextMatchForLoser: matchIds.consolation,
    nextMatchPositionForWinner: 'player1',
    nextMatchPositionForLoser: 'player1',
    createdAt: now,
    updatedAt: now,
  };

  const semifinal2: PlayoffMatch = {
    id: matchIds.semi2,
    type: 'semifinals',
    isPlayoffMatch: true,
    round: 2,
    player1Id: p2.playerId,
    player2Id: p3.playerId,
    player1Name: p2.playerName,
    player2Name: p3.playerName,
    status: 'scheduled',
    nextMatchForWinner: matchIds.final,
    nextMatchForLoser: matchIds.consolation,
    nextMatchPositionForWinner: 'player2',
    nextMatchPositionForLoser: 'player2',
    createdAt: now,
    updatedAt: now,
  };

  // Add team info if doubles
  if (isTeam) {
    Object.assign(semifinal1, {
      team1Id: p1.teamId,
      team1Name: p1.playerName,
      team1Player1Id: p1.player1Id,
      team1Player1Name: p1.player1Name,
      team1Player2Id: p1.player2Id,
      team1Player2Name: p1.player2Name,
      team2Id: p4.teamId,
      team2Name: p4.playerName,
      team2Player1Id: p4.player1Id,
      team2Player1Name: p4.player1Name,
      team2Player2Id: p4.player2Id,
      team2Player2Name: p4.player2Name,
    });

    Object.assign(semifinal2, {
      team1Id: p2.teamId,
      team1Name: p2.playerName,
      team1Player1Id: p2.player1Id,
      team1Player1Name: p2.player1Name,
      team1Player2Id: p2.player2Id,
      team1Player2Name: p2.player2Name,
      team2Id: p3.teamId,
      team2Name: p3.playerName,
      team2Player1Id: p3.player1Id,
      team2Player1Name: p3.player1Name,
      team2Player2Id: p3.player2Id,
      team2Player2Name: p3.player2Name,
    });
  }

  const final: PlayoffMatch = {
    id: matchIds.final,
    type: 'final',
    isPlayoffMatch: true,
    round: 1,
    player1Id: null,
    player2Id: null,
    player1Name: 'TBD',
    player2Name: 'TBD',
    status: 'pending',
    nextMatchForWinner: null,
    nextMatchForLoser: null,
    createdAt: now,
    updatedAt: now,
  };

  const consolation: PlayoffMatch = {
    id: matchIds.consolation,
    type: 'consolation',
    isPlayoffMatch: true,
    round: 1,
    player1Id: null,
    player2Id: null,
    player1Name: 'TBD',
    player2Name: 'TBD',
    status: 'pending',
    nextMatchForWinner: null,
    nextMatchForLoser: null,
    createdAt: now,
    updatedAt: now,
  };

  return {
    matches: [semifinal1, semifinal2, final, consolation],
    playoffType: 'semifinals',
  };
}
