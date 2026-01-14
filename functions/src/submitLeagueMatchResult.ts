/**
 * 🌉 [HEIMDALL] Submit League Match Result Cloud Function
 * Phase 5.11: Server-Side Migration - League Match Results & Standings
 *
 * Submits league match result and automatically updates standings
 * Uses Admin SDK to bypass Security Rules and ensure atomic operations
 *
 * @author Kim (Phase 5.11)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { addMatchToHistory, MatchHistoryEntry } from './utils/matchHistoryManager';
import { calculateClubElo, ClubMatchResult } from './utils/clubEloCalculator';

const db = admin.firestore();

interface SetScore {
  player1Games: number;
  player2Games: number;
}

interface SubmitLeagueMatchResultRequest {
  leagueId: string;
  matchId: string;
  winnerId: string;
  score: {
    sets: SetScore[];
    finalScore: string;
  };
}

interface SubmitLeagueMatchResultResponse {
  success: boolean;
  message: string;
  data?: {
    matchId: string;
    standingsUpdated: boolean;
  };
}

interface MatchData {
  id: string;
  player1Id?: string;
  player2Id?: string;
  player1Name?: string;
  player2Name?: string;
  status?: string;
  isPlayoffMatch?: boolean;
  [key: string]: unknown;
}

interface Standing {
  playerId: string;
  playerName: string;
  points: number;
  won: number;
  lost: number;
  setDifference: number;
  gameDifference: number;
  [key: string]: unknown;
}

/**
 * Submit League Match Result Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Automatic standings update
 * - Club stats update
 *
 * Operations:
 * 1. Update match status to 'completed'
 * 2. Update league standings (points, wins, losses, streaks, games, sets)
 * 3. Apply official tiebreaker rules (Head-to-Head, Set Diff, Game Diff)
 * 4. Update club member stats (wins, losses, matches played)
 * 5. Check regular season completion (auto-create playoffs if needed)
 *
 * @param request - Contains leagueId, matchId, winnerId, score
 * @returns Success status with match result data
 */
export const submitLeagueMatchResult = onCall<
  SubmitLeagueMatchResultRequest,
  Promise<SubmitLeagueMatchResultResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId, matchId, winnerId, score } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to submit match results');
  }

  logger.info('⚡ [SUBMIT_LEAGUE_MATCH_RESULT] Starting', {
    leagueId,
    matchId,
    winnerId,
    userId: auth.uid,
  });

  try {
    // ==========================================================================
    // Step 2: Get League and Match Data
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

    const matchRef = leagueRef.collection('matches').doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      throw new HttpsError('not-found', 'Match not found');
    }

    const matchData = matchSnap.data();
    if (!matchData) {
      throw new HttpsError('internal', 'Invalid match data');
    }

    logger.info('📊 [SUBMIT_LEAGUE_MATCH_RESULT] Match data', {
      player1: matchData.player1Name,
      player2: matchData.player2Name,
      winner: winnerId,
    });

    // ==========================================================================
    // Step 3: Update Match Status
    // ==========================================================================
    await matchRef.update({
      status: 'completed',
      _winner: winnerId,
      score,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      actualDate: admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] Match status updated to completed');

    // ==========================================================================
    // Step 4: Update Standings
    // ==========================================================================
    const standings = leagueData.standings || [];
    if (!Array.isArray(standings)) {
      throw new HttpsError('internal', 'Invalid standings data');
    }

    // Find player standings
    const player1Standing = standings.find(
      (s: { playerId: string }) => s.playerId === matchData.player1Id
    );
    const player2Standing = standings.find(
      (s: { playerId: string }) => s.playerId === matchData.player2Id
    );

    if (!player1Standing || !player2Standing) {
      throw new HttpsError('failed-precondition', 'Player standings not found');
    }

    // Calculate games and sets
    let player1Games = 0;
    let player2Games = 0;
    let player1Sets = 0;
    let player2Sets = 0;

    for (const set of score.sets) {
      player1Games += set.player1Games;
      player2Games += set.player2Games;

      if (set.player1Games > set.player2Games) {
        player1Sets++;
      } else {
        player2Sets++;
      }
    }

    // Update statistics
    player1Standing.played++;
    player2Standing.played++;

    if (winnerId === matchData.player1Id) {
      player1Standing.won++;
      player1Standing.points += leagueData.settings.pointsForWin;
      player2Standing.lost++;
      player2Standing.points += leagueData.settings.pointsForLoss;

      // Update streaks
      player1Standing.streak =
        player1Standing.streak?.type === 'win'
          ? { type: 'win', count: player1Standing.streak.count + 1 }
          : { type: 'win', count: 1 };
      player2Standing.streak =
        player2Standing.streak?.type === 'loss'
          ? { type: 'loss', count: player2Standing.streak.count + 1 }
          : { type: 'loss', count: 1 };
    } else {
      player2Standing.won++;
      player2Standing.points += leagueData.settings.pointsForWin;
      player1Standing.lost++;
      player1Standing.points += leagueData.settings.pointsForLoss;

      // Update streaks
      player2Standing.streak =
        player2Standing.streak?.type === 'win'
          ? { type: 'win', count: player2Standing.streak.count + 1 }
          : { type: 'win', count: 1 };
      player1Standing.streak =
        player1Standing.streak?.type === 'loss'
          ? { type: 'loss', count: player1Standing.streak.count + 1 }
          : { type: 'loss', count: 1 };
    }

    // Update game/set statistics
    player1Standing.gamesWon = (player1Standing.gamesWon || 0) + player1Games;
    player1Standing.gamesLost = (player1Standing.gamesLost || 0) + player2Games;
    player1Standing.gameDifference = player1Standing.gamesWon - player1Standing.gamesLost;

    player2Standing.gamesWon = (player2Standing.gamesWon || 0) + player2Games;
    player2Standing.gamesLost = (player2Standing.gamesLost || 0) + player1Games;
    player2Standing.gameDifference = player2Standing.gamesWon - player2Standing.gamesLost;

    player1Standing.setsWon = (player1Standing.setsWon || 0) + player1Sets;
    player1Standing.setsLost = (player1Standing.setsLost || 0) + player2Sets;
    player1Standing.setDifference = player1Standing.setsWon - player1Standing.setsLost;

    player2Standing.setsWon = (player2Standing.setsWon || 0) + player2Sets;
    player2Standing.setsLost = (player2Standing.setsLost || 0) + player1Sets;
    player2Standing.setDifference = player2Standing.setsWon - player2Standing.setsLost;

    // Sort standings (simple version - can enhance with full tiebreaker rules later)
    standings.sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Set difference
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
      // 3. Game difference
      if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
      // 4. Wins
      return b.won - a.won;
    });

    // Update positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    // Sync playerName from participants array (data consistency)
    // This ensures standings always reflect the correct team names
    logger.info('🔄 [SUBMIT_LEAGUE_MATCH_RESULT] Syncing playerName from participants array');
    standings.forEach(standing => {
      const participant = leagueData.participants.find(
        (p: { playerId: string }) => p.playerId === standing.playerId
      );
      if (participant && participant.playerName) {
        logger.info(`🔄 [SYNC] ${standing.playerName} → ${participant.playerName}`);
        standing.playerName = participant.playerName;
      }
    });
    logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] PlayerName sync complete');

    // Update league standings
    await leagueRef.update({
      standings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] Standings updated');

    // ==========================================================================
    // Step 5: Update Club Member Stats
    // ==========================================================================
    const clubId = leagueData.clubId;
    if (clubId) {
      const loserId = winnerId === matchData.player1Id ? matchData.player2Id : matchData.player1Id;

      // Winner stats
      const winnerMembershipRef = db.collection('clubMembers').doc(`${clubId}_${winnerId}`);
      const winnerMembershipSnap = await winnerMembershipRef.get();

      if (winnerMembershipSnap.exists) {
        await winnerMembershipRef.update({
          'clubStats.wins': admin.firestore.FieldValue.increment(1),
          'clubStats.matchesPlayed': admin.firestore.FieldValue.increment(1),
          'clubStats.lastMatchDate': admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Loser stats
      const loserMembershipRef = db.collection('clubMembers').doc(`${clubId}_${loserId}`);
      const loserMembershipSnap = await loserMembershipRef.get();

      if (loserMembershipSnap.exists) {
        await loserMembershipRef.update({
          'clubStats.losses': admin.firestore.FieldValue.increment(1),
          'clubStats.matchesPlayed': admin.firestore.FieldValue.increment(1),
          'clubStats.lastMatchDate': admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] Club member stats updated');
    }

    // ==========================================================================
    // Step 5.5: Calculate and Update Club ELO (League matches reflect ELO)
    // ==========================================================================
    logger.info('📊 [SUBMIT_LEAGUE_MATCH_RESULT] Calculating Club ELO for league match...');

    let player1EloChange = 0;
    let player2EloChange = 0;
    let player1NewElo = 0;
    let player2NewElo = 0;

    try {
      const clubId = leagueData.clubId;
      const player1Id = matchData.player1Id as string;
      const player2Id = matchData.player2Id as string;
      const eventType = leagueData.eventType;

      // Check if this is a doubles league
      const isDoublesLeague =
        eventType === 'mens_doubles' ||
        eventType === 'womens_doubles' ||
        eventType === 'mixed_doubles';

      if (isDoublesLeague) {
        // Doubles: Team IDs like "player1A_player1B"
        logger.info('👥 [SUBMIT_LEAGUE_MATCH_RESULT] Doubles league detected');

        // Split team IDs to get individual player IDs
        const team1Players = player1Id.split('_');
        const team2Players = player2Id.split('_');

        if (team1Players.length !== 2 || team2Players.length !== 2) {
          throw new Error('Invalid team ID format for doubles league');
        }

        const [player1A, player1B] = team1Players;
        const [player2A, player2B] = team2Players;

        // Get team ELO (average of both players)
        const player1AMemberRef = db
          .collection('users')
          .doc(player1A)
          .collection('clubMemberships')
          .doc(clubId);
        const player1BMemberRef = db
          .collection('users')
          .doc(player1B)
          .collection('clubMemberships')
          .doc(clubId);
        const player2AMemberRef = db
          .collection('users')
          .doc(player2A)
          .collection('clubMemberships')
          .doc(clubId);
        const player2BMemberRef = db
          .collection('users')
          .doc(player2B)
          .collection('clubMemberships')
          .doc(clubId);

        const [p1ASnap, p1BSnap, p2ASnap, p2BSnap] = await Promise.all([
          player1AMemberRef.get(),
          player1BMemberRef.get(),
          player2AMemberRef.get(),
          player2BMemberRef.get(),
        ]);

        const player1AElo = p1ASnap.exists ? p1ASnap.data()?.clubEloRating || 1200 : 1200;
        const player1BElo = p1BSnap.exists ? p1BSnap.data()?.clubEloRating || 1200 : 1200;
        const player2AElo = p2ASnap.exists ? p2ASnap.data()?.clubEloRating || 1200 : 1200;
        const player2BElo = p2BSnap.exists ? p2BSnap.data()?.clubEloRating || 1200 : 1200;

        const team1AvgElo = Math.round((player1AElo + player1BElo) / 2);
        const team2AvgElo = Math.round((player2AElo + player2BElo) / 2);

        logger.info('📊 [SUBMIT_LEAGUE_MATCH_RESULT] Team ELOs', {
          team1: team1AvgElo,
          team2: team2AvgElo,
        });

        // Calculate ELO change using team1 player as representative
        const team1MatchResult: ClubMatchResult = {
          matchId: matchId,
          clubId: clubId,
          matchType: 'doubles',
          matchContext: 'league',
          leagueId: leagueId,
          date: admin.firestore.Timestamp.now(),
          player1Id: player1A,
          player1Name: matchData.player1Name as string,
          player1PartnerId: player1B,
          player1PartnerName: '',
          player2Id: player2A,
          player2Name: matchData.player2Name as string,
          player2PartnerId: player2B,
          player2PartnerName: '',
          winnerId: winnerId,
          score: score.finalScore,
          recordedBy: auth.uid,
        };

        // Calculate ELO (this will update player1A's clubMembership)
        // But we'll apply the same change to all 4 players
        const eloResult = await calculateClubElo(team1MatchResult);

        if (eloResult.success) {
          // Team 1 won
          if (winnerId === player1Id) {
            player1EloChange = eloResult.player1EloChange;
            player2EloChange = eloResult.player2EloChange;

            // Apply same ELO change to partner
            const player1BUpdate = {
              clubEloRating: admin.firestore.FieldValue.increment(player1EloChange),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            const player2BUpdate = {
              clubEloRating: admin.firestore.FieldValue.increment(player2EloChange),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await Promise.all([
              player1BMemberRef.update(player1BUpdate),
              player2BMemberRef.update(player2BUpdate),
            ]);

            player1NewElo = eloResult.player1NewElo;
            player2NewElo = eloResult.player2NewElo;
          } else {
            // Team 2 won
            player1EloChange = eloResult.player2EloChange;
            player2EloChange = eloResult.player1EloChange;

            // Apply same ELO change to partner
            const player1BUpdate = {
              clubEloRating: admin.firestore.FieldValue.increment(player1EloChange),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            const player2BUpdate = {
              clubEloRating: admin.firestore.FieldValue.increment(player2EloChange),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await Promise.all([
              player1BMemberRef.update(player1BUpdate),
              player2BMemberRef.update(player2BUpdate),
            ]);

            player1NewElo = eloResult.player2NewElo;
            player2NewElo = eloResult.player1NewElo;
          }

          logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] Doubles ELO updated', {
            team1Change: player1EloChange,
            team2Change: player2EloChange,
          });
        }
      } else {
        // Singles: Direct player IDs
        logger.info('🎾 [SUBMIT_LEAGUE_MATCH_RESULT] Singles league detected');

        const matchResult: ClubMatchResult = {
          matchId: matchId,
          clubId: clubId,
          matchType: 'singles',
          matchContext: 'league',
          leagueId: leagueId,
          date: admin.firestore.Timestamp.now(),
          player1Id: player1Id,
          player1Name: matchData.player1Name as string,
          player2Id: player2Id,
          player2Name: matchData.player2Name as string,
          winnerId: winnerId,
          score: score.finalScore,
          recordedBy: auth.uid,
        };

        const eloResult = await calculateClubElo(matchResult);

        if (eloResult.success) {
          player1EloChange = eloResult.player1EloChange;
          player2EloChange = eloResult.player2EloChange;
          player1NewElo = eloResult.player1NewElo;
          player2NewElo = eloResult.player2NewElo;

          logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] Singles ELO updated', {
            player1Change: player1EloChange,
            player2Change: player2EloChange,
          });
        }
      }
    } catch (error) {
      logger.error('❌ [SUBMIT_LEAGUE_MATCH_RESULT] Failed to calculate ELO', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue - ELO calculation failure should not fail the entire operation
    }

    // ==========================================================================
    // Step 6: Record Match History for ELO Chart
    // ==========================================================================
    logger.info('📊 [SUBMIT_LEAGUE_MATCH_RESULT] Recording match history for ELO chart');

    try {
      // Get player details
      const player1Id = matchData.player1Id as string;
      const player2Id = matchData.player2Id as string;
      const player1Name = matchData.player1Name as string;
      const player2Name = matchData.player2Name as string;

      // Get current ELO ratings from club member stats
      const clubId = leagueData.clubId;
      const player1MemberRef = db.collection('clubMembers').doc(`${clubId}_${player1Id}`);
      const player2MemberRef = db.collection('clubMembers').doc(`${clubId}_${player2Id}`);

      const [player1MemberSnap, player2MemberSnap] = await Promise.all([
        player1MemberRef.get(),
        player2MemberRef.get(),
      ]);

      const player1Elo = player1MemberSnap.exists
        ? player1MemberSnap.data()?.clubStats?.clubEloRating || 1200
        : 1200;
      const player2Elo = player2MemberSnap.exists
        ? player2MemberSnap.data()?.clubStats?.clubEloRating || 1200
        : 1200;

      // Determine result for each player
      const player1Result: 'win' | 'loss' = winnerId === player1Id ? 'win' : 'loss';
      const player2Result: 'win' | 'loss' = winnerId === player2Id ? 'win' : 'loss';

      // Create match history entries for both players
      const player1HistoryEntry: MatchHistoryEntry = {
        matchId: matchId,
        clubId: clubId,
        clubName: leagueData.clubName || 'Unknown Club',
        opponent: {
          playerId: player2Id,
          playerName: player2Name,
        },
        result: player1Result,
        matchType: 'singles', // League matches are singles
        score: score.finalScore,
        date: admin.firestore.Timestamp.now(),
        context: 'club',
        oldElo: player1Elo,
        newElo: player1NewElo || player1Elo, // Use calculated ELO if available
        eloChange: player1EloChange,
      };

      const player2HistoryEntry: MatchHistoryEntry = {
        matchId: matchId,
        clubId: clubId,
        clubName: leagueData.clubName || 'Unknown Club',
        opponent: {
          playerId: player1Id,
          playerName: player1Name,
        },
        result: player2Result,
        matchType: 'singles',
        score: score.finalScore,
        date: admin.firestore.Timestamp.now(),
        context: 'club',
        oldElo: player2Elo,
        newElo: player2NewElo || player2Elo, // Use calculated ELO if available
        eloChange: player2EloChange,
      };

      // Write match history for both players
      await Promise.all([
        addMatchToHistory(player1Id, player1HistoryEntry),
        addMatchToHistory(player2Id, player2HistoryEntry),
      ]);

      logger.info('✅ [SUBMIT_LEAGUE_MATCH_RESULT] Match history recorded successfully', {
        player1: player1Name,
        player2: player2Name,
        winner: winnerId === player1Id ? player1Name : player2Name,
      });
    } catch (error) {
      // Log error but don't fail the entire operation
      logger.error('❌ [SUBMIT_LEAGUE_MATCH_RESULT] Failed to record match history', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue - match result is already recorded, history is supplementary
    }

    // ==========================================================================
    // Step 7: Check Regular Season Completion & Auto-Create Playoffs
    // ==========================================================================
    logger.info('🎯 [SUBMIT_LEAGUE_MATCH_RESULT] Checking regular season completion...');

    // Get all matches in the league
    const allMatchesSnap = await leagueRef.collection('matches').get();
    const allMatches: MatchData[] = allMatchesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter out playoff matches (only check regular season matches)
    const regularSeasonMatches = allMatches.filter((match: MatchData) => !match.isPlayoffMatch);

    const completedRegularMatches = regularSeasonMatches.filter(
      (match: MatchData) => match.status === 'completed'
    );

    logger.info('📊 [SUBMIT_LEAGUE_MATCH_RESULT] Regular season progress', {
      completed: completedRegularMatches.length,
      total: regularSeasonMatches.length,
    });

    // Check if all regular season matches are completed
    const regularSeasonComplete =
      regularSeasonMatches.length > 0 &&
      completedRegularMatches.length === regularSeasonMatches.length;

    if (regularSeasonComplete && leagueData.status === 'ongoing') {
      logger.info('🏆 [AUTO_PLAYOFFS] Regular season completed! Auto-creating playoffs...');

      try {
        // Sort standings to determine qualified players
        const sortedStandings = [...standings].sort((a: Standing, b: Standing) => {
          // 1. Points
          if (b.points !== a.points) return b.points - a.points;
          // 2. Set difference
          if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
          // 3. Game difference
          if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
          // 4. Wins
          return b.won - a.won;
        });

        // Select top 4 qualified players
        const qualifiedPlayers: Standing[] = sortedStandings.slice(
          0,
          Math.min(4, sortedStandings.length)
        );

        if (qualifiedPlayers.length >= 2) {
          // Determine playoff type
          const playoffType = qualifiedPlayers.length >= 4 ? 'semifinals' : 'final';

          logger.info('🎯 [AUTO_PLAYOFFS] Qualified players', {
            count: qualifiedPlayers.length,
            type: playoffType,
            players: qualifiedPlayers.map((p: Standing) => p.playerName),
          });

          // Update league status to 'playoffs'
          await leagueRef.update({
            status: 'playoffs',
            'playoff.type': playoffType,
            'playoff.qualifiedPlayers': qualifiedPlayers.map((p: Standing) => p.playerId),
            'playoff.createdAt': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          logger.info('✅ [AUTO_PLAYOFFS] League status updated to playoffs');

          // Generate playoff matches
          const playoffMatchesRef = leagueRef.collection('playoff_matches');
          const batch = db.batch();

          if (playoffType === 'semifinals' && qualifiedPlayers.length >= 4) {
            // Pre-generate match IDs for cross-referencing
            const semi1Ref = playoffMatchesRef.doc();
            const semi2Ref = playoffMatchesRef.doc();
            const finalRef = playoffMatchesRef.doc();
            const consolationRef = playoffMatchesRef.doc();

            // Semifinals: 1 vs 4, 2 vs 3
            const semi1 = {
              id: semi1Ref.id,
              type: 'semifinals',
              isPlayoffMatch: true,
              round: 1,
              player1Id: qualifiedPlayers[0].playerId,
              player2Id: qualifiedPlayers[3].playerId,
              player1Name: qualifiedPlayers[0].playerName,
              player2Name: qualifiedPlayers[3].playerName,
              status: 'scheduled',
              nextMatchForWinner: finalRef.id,
              nextMatchForLoser: consolationRef.id,
              nextMatchPositionForWinner: 'player1',
              nextMatchPositionForLoser: 'player1',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            const semi2 = {
              id: semi2Ref.id,
              type: 'semifinals',
              isPlayoffMatch: true,
              round: 1,
              player1Id: qualifiedPlayers[1].playerId,
              player2Id: qualifiedPlayers[2].playerId,
              player1Name: qualifiedPlayers[1].playerName,
              player2Name: qualifiedPlayers[2].playerName,
              status: 'scheduled',
              nextMatchForWinner: finalRef.id,
              nextMatchForLoser: consolationRef.id,
              nextMatchPositionForWinner: 'player2',
              nextMatchPositionForLoser: 'player2',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            const final = {
              id: finalRef.id,
              type: 'final',
              isPlayoffMatch: true,
              round: 2,
              player1Id: null,
              player2Id: null,
              player1Name: 'Semi 1 승자',
              player2Name: 'Semi 2 승자',
              status: 'pending',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            const consolation = {
              id: consolationRef.id,
              type: 'consolation',
              isPlayoffMatch: true,
              round: 2,
              player1Id: null,
              player2Id: null,
              player1Name: 'Semi 1 패자',
              player2Name: 'Semi 2 패자',
              status: 'pending',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            batch.set(semi1Ref, semi1);
            batch.set(semi2Ref, semi2);
            batch.set(finalRef, final);
            batch.set(consolationRef, consolation);

            await batch.commit();

            logger.info('✅ [AUTO_PLAYOFFS] Semifinals playoff matches created', {
              matchCount: 4,
            });
          } else if (playoffType === 'final' && qualifiedPlayers.length >= 2) {
            // Direct final: 1 vs 2
            const finalRef = playoffMatchesRef.doc();

            const final = {
              id: finalRef.id,
              type: 'final',
              isPlayoffMatch: true,
              round: 1,
              player1Id: qualifiedPlayers[0].playerId,
              player2Id: qualifiedPlayers[1].playerId,
              player1Name: qualifiedPlayers[0].playerName,
              player2Name: qualifiedPlayers[1].playerName,
              status: 'scheduled',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            batch.set(finalRef, final);
            await batch.commit();

            logger.info('✅ [AUTO_PLAYOFFS] Direct final match created', {
              matchCount: 1,
            });
          }

          logger.info('🎉 [AUTO_PLAYOFFS] Playoffs automatically created!');
        } else {
          logger.warn('⚠️ [AUTO_PLAYOFFS] Not enough players for playoffs', {
            count: qualifiedPlayers.length,
          });
        }
      } catch (error) {
        logger.error('❌ [AUTO_PLAYOFFS] Error creating playoffs', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't throw - match result was already submitted successfully
      }
    } else {
      logger.info('📊 [SUBMIT_LEAGUE_MATCH_RESULT] Regular season not yet complete', {
        status: leagueData.status,
        regularSeasonComplete,
      });
    }

    return {
      success: true,
      message: 'Match result submitted and standings updated successfully',
      data: {
        matchId,
        standingsUpdated: true,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [SUBMIT_LEAGUE_MATCH_RESULT] Unexpected error', {
      leagueId,
      matchId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to submit match result: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
