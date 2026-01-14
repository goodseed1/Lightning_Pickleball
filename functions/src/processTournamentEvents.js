/**
 * 🎯 HYBRID ARCHITECTURE Phase 2: Tournament Event Processor
 * 토너먼트 이벤트 백그라운드 처리기
 *
 * PURPOSE:
 * - Process tournament_events created by client (Phase 1-B)
 * - Handle heavy computations in background (ELO, stats, notifications)
 * - Offload work from client for better UX and scalability
 *
 * ARCHITECTURE:
 * Client → tournament_events collection → onCreate trigger → This function
 *
 * RESPONSIBILITIES:
 * ✅ Player statistics update (wins, losses, matchesPlayed)
 * ✅ Club ELO calculation and update
 * ✅ Match history tracking
 * ✅ Push notifications (future)
 * ✅ Global rankings update (future)
 */

const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { FieldValue } = require('firebase-admin/firestore');
const { addMatchToHistory } = require('./utils/matchHistoryManager');

// ============================================================================
// 📊 ELO Calculation Utilities (inline for simplicity)
// ============================================================================

/**
 * Get K-Factor based on matches played
 * - New players (0-30 matches): K=40 (volatile)
 * - Intermediate (31-100 matches): K=20 (stable)
 * - Experienced (100+ matches): K=10 (very stable)
 */
function getClubKFactor(matchesPlayed) {
  if (matchesPlayed < 30) return 40;
  if (matchesPlayed < 100) return 20;
  return 10;
}

/**
 * Get current club ELO from clubStats
 * Returns default 1200 if not set
 */
function getCurrentClubElo(clubStats) {
  return clubStats?.clubEloRating || 1200;
}

/**
 * Calculate new ELO rating using standard ELO formula
 * @param {number} playerElo - Current player ELO
 * @param {number} opponentElo - Opponent's ELO
 * @param {string} result - 'win' or 'loss'
 * @param {number} kFactor - K-factor for volatility
 * @returns {number} New ELO rating
 */
function calculateClubElo(playerElo, opponentElo, result, kFactor) {
  // Expected score (probability of winning)
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

  // Actual score (1 for win, 0 for loss)
  const actualScore = result === 'win' ? 1 : 0;

  // New ELO = Old ELO + K * (Actual - Expected)
  const newElo = playerElo + kFactor * (actualScore - expectedScore);

  // Round to nearest integer
  return Math.round(newElo);
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * 🔥 Main Event Handler: onCreate Trigger for tournament_events
 *
 * Triggered automatically when a new document is created in tournament_events collection
 * This is NON-BLOCKING from user perspective - runs in background
 */
exports.processTournamentEvent = onDocumentCreated('tournament_events/{eventId}', async event => {
  const db = admin.firestore();
  const eventData = event.data.data();
  const eventRef = event.data.ref;

  console.log('🔥 [EVENT PROCESSOR] Processing tournament event:', eventData.type);

  // Only process match_completed events
  if (eventData.type !== 'match_completed') {
    console.log('⏭️  [EVENT PROCESSOR] Skipping non-match event:', eventData.type);
    return;
  }

  // Extract event data
  const { tournamentId, matchId, clubId, result } = eventData;
  const { winnerId, loserId, score } = result;

  if (!tournamentId || !matchId || !clubId || !winnerId || !loserId) {
    console.error('❌ [EVENT PROCESSOR] Missing required fields in event:', eventData);
    await eventRef.update({
      processed: false,
      error: 'Missing required fields',
      processedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  try {
    // Run heavy computations in parallel for performance
    await Promise.all([
      // 1. Update player statistics (wins, losses, ELO)
      updatePlayerStatistics(db, tournamentId, matchId, clubId, winnerId, loserId, score),

      // 2. Send push notifications (future implementation)
      // sendMatchResultNotifications(winnerId, loserId, score),

      // 3. Update global rankings (future implementation)
      // updateGlobalRankings(db, tournamentId, clubId),
    ]);

    // ✅ Mark event as processed
    await eventRef.update({
      processed: true,
      processedAt: FieldValue.serverTimestamp(),
    });

    console.log('✅ [EVENT PROCESSOR] Tournament event processed successfully');
  } catch (error) {
    console.error('❌ [EVENT PROCESSOR] Error processing tournament event:', error);

    // Mark as failed with error details
    await eventRef.update({
      processed: false,
      error: error.message,
      errorStack: error.stack,
      retryCount: FieldValue.increment(1),
      lastAttemptAt: FieldValue.serverTimestamp(),
    });
  }
});

/**
 * 📊 Update Player Statistics
 *
 * Updates clubStats for both winner and loser:
 * - Wins/Losses counters
 * - Matches played
 * - Club ELO rating
 * - Tournament stats
 * - Match history
 *
 * Handles both singles and doubles matches
 */
async function updatePlayerStatistics(db, tournamentId, matchId, clubId, winnerId, loserId, score) {
  console.log('📊 [STATS] Updating player statistics...');

  // Fetch tournament and match info
  const tournamentDoc = await db.doc(`tournaments/${tournamentId}`).get();
  if (!tournamentDoc.exists) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }
  const tournament = tournamentDoc.data();

  const matchDoc = await db.doc(`tournaments/${tournamentId}/matches/${matchId}`).get();
  if (!matchDoc.exists) {
    throw new Error(`Match ${matchId} not found`);
  }
  const match = matchDoc.data();

  // 🎾 Determine if this is a doubles match (teamId contains underscore)
  const isDoublesMatch = winnerId.includes('_') && loserId.includes('_');

  if (isDoublesMatch) {
    await updateDoublesStatistics(
      db,
      tournamentId,
      matchId,
      clubId,
      winnerId,
      loserId,
      score,
      tournament,
      match
    );
  } else {
    await updateSinglesStatistics(
      db,
      tournamentId,
      matchId,
      clubId,
      winnerId,
      loserId,
      score,
      tournament,
      match
    );
  }

  console.log('✅ [STATS] Player statistics updated successfully');
}

/**
 * 🎾 Update Statistics for Singles Match
 */
async function updateSinglesStatistics(
  db,
  tournamentId,
  matchId,
  clubId,
  winnerId,
  loserId,
  score,
  tournament,
  match
) {
  // Prepare match history data BEFORE transaction
  let winnerMatchEntry, loserMatchEntry, newWinnerElo, newLoserElo;

  await db.runTransaction(async transaction => {
    // 🆕 Read ELOs BEFORE updating (critical for accurate calculation)
    const winnerData = await getPlayerElo(winnerId, clubId, transaction);
    const loserData = await getPlayerElo(loserId, clubId, transaction);

    // Calculate new ELOs
    const winnerKFactor = getClubKFactor(winnerData.matchesPlayed);
    const loserKFactor = getClubKFactor(loserData.matchesPlayed);

    newWinnerElo = calculateClubElo(winnerData.elo, loserData.elo, 'win', winnerKFactor);

    newLoserElo = calculateClubElo(loserData.elo, winnerData.elo, 'loss', loserKFactor);

    // Update winner's clubStats
    const membershipIdWinner = `${clubId}_${winnerId}`;
    const winnerMembershipRef = db.doc(`clubMembers/${membershipIdWinner}`);

    if (!winnerData.exists) {
      // 🆕 Create new membership document with initial stats
      const winnerPlayerName =
        match.player1?.playerId === winnerId
          ? match.player1?.playerName
          : match.player2?.playerId === winnerId
            ? match.player2?.playerName
            : 'Unknown';

      transaction.set(winnerMembershipRef, {
        clubId,
        userId: winnerId,
        playerName: winnerPlayerName,
        role: 'member',
        status: 'active',
        clubStats: {
          matchesPlayed: 1,
          wins: 1,
          losses: 0,
          clubEloRating: newWinnerElo,
          clubEloLastUpdated: new Date().toISOString(),
          lastMatchDate: FieldValue.serverTimestamp(),
          tournamentStats: {
            totalMatches: 1,
            tournamentWins: 1,
            tournamentLosses: 0,
          },
        },
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`✅ [STATS] Created new clubMember document for winner ${winnerId}`);
    } else {
      // Update existing membership document
      transaction.update(winnerMembershipRef, {
        'clubStats.lastMatchDate': FieldValue.serverTimestamp(),
        'clubStats.clubEloRating': newWinnerElo,
        'clubStats.clubEloLastUpdated': new Date().toISOString(),
        // 🏆 Increment tournament-specific statistics
        'clubStats.tournamentStats.totalMatches': FieldValue.increment(1),
        'clubStats.tournamentStats.tournamentWins': FieldValue.increment(1),
      });
    }

    // Update loser's clubStats
    const membershipIdLoser = `${clubId}_${loserId}`;
    const loserMembershipRef = db.doc(`clubMembers/${membershipIdLoser}`);

    if (!loserData.exists) {
      // 🆕 Create new membership document with initial stats
      const loserPlayerName =
        match.player1?.playerId === loserId
          ? match.player1?.playerName
          : match.player2?.playerId === loserId
            ? match.player2?.playerName
            : 'Unknown';

      transaction.set(loserMembershipRef, {
        clubId,
        userId: loserId,
        playerName: loserPlayerName,
        role: 'member',
        status: 'active',
        clubStats: {
          matchesPlayed: 1,
          wins: 0,
          losses: 1,
          clubEloRating: newLoserElo,
          clubEloLastUpdated: new Date().toISOString(),
          lastMatchDate: FieldValue.serverTimestamp(),
          tournamentStats: {
            totalMatches: 1,
            tournamentWins: 0,
            tournamentLosses: 1,
          },
        },
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`✅ [STATS] Created new clubMember document for loser ${loserId}`);
    } else {
      // Update existing membership document
      transaction.update(loserMembershipRef, {
        'clubStats.lastMatchDate': FieldValue.serverTimestamp(),
        'clubStats.clubEloRating': newLoserElo,
        'clubStats.clubEloLastUpdated': new Date().toISOString(),
        // 🏆 Increment tournament-specific statistics
        'clubStats.tournamentStats.totalMatches': FieldValue.increment(1),
        'clubStats.tournamentStats.tournamentLosses': FieldValue.increment(1),
      });
    }

    // 🏛️ Prepare match history entries (saved AFTER transaction)
    winnerMatchEntry = {
      matchId,
      tournamentId,
      tournamentName: tournament.name || 'Unknown Tournament',
      clubId,
      clubName: tournament.clubName || 'Unknown Club',
      opponent: {
        playerId: loserId,
        playerName:
          match.player2?.playerName ||
          (match.player1?.playerId === loserId ? match.player1?.playerName : 'Unknown'),
      },
      result: 'win',
      matchType: 'singles',
      score: score || '',
      date: FieldValue.serverTimestamp(),
      context: 'tournament',
      oldElo: winnerData.elo,
      newElo: newWinnerElo,
      eloChange: newWinnerElo - winnerData.elo,
    };

    loserMatchEntry = {
      matchId,
      tournamentId,
      tournamentName: tournament.name || 'Unknown Tournament',
      clubId,
      clubName: tournament.clubName || 'Unknown Club',
      opponent: {
        playerId: winnerId,
        playerName:
          match.player1?.playerName ||
          (match.player2?.playerId === winnerId ? match.player2?.playerName : 'Unknown'),
      },
      result: 'loss',
      matchType: 'singles',
      score: score || '',
      date: FieldValue.serverTimestamp(),
      context: 'tournament',
      oldElo: loserData.elo,
      newElo: newLoserElo,
      eloChange: newLoserElo - loserData.elo,
    };
  });

  // 🏛️ Add match to history AFTER transaction completes (no transaction parameter)
  try {
    await addMatchToHistory(winnerId, winnerMatchEntry);
    await addMatchToHistory(loserId, loserMatchEntry);
    console.log('✅ [STATS] Player statistics and match history updated successfully');
  } catch (error) {
    // Match history is non-critical, so we log the error but don't fail the whole operation
    console.error('❌ [MATCH HISTORY] Error adding match history (non-critical):', error);
  }
}

/**
 * 🎾 Update Statistics for Doubles Match
 */
async function updateDoublesStatistics(
  db,
  tournamentId,
  matchId,
  clubId,
  winnerId,
  loserId,
  score,
  tournament,
  match
) {
  // Prepare match history entries BEFORE transaction
  let matchHistoryEntries = [];

  await db.runTransaction(async transaction => {
    // Extract individual player IDs from teamIds
    const winningTeamIds = winnerId.split('_');
    const losingTeamIds = loserId.split('_');

    // 🆕 Read ELOs for all 4 players BEFORE updating
    const winningTeamData = await Promise.all(
      winningTeamIds.map(playerId => getPlayerElo(playerId, clubId, transaction))
    );
    const losingTeamData = await Promise.all(
      losingTeamIds.map(playerId => getPlayerElo(playerId, clubId, transaction))
    );

    // Calculate team average ELOs
    const winningTeamElo = Math.round(
      winningTeamData.reduce((sum, data) => sum + data.elo, 0) / winningTeamData.length
    );
    const losingTeamElo = Math.round(
      losingTeamData.reduce((sum, data) => sum + data.elo, 0) / losingTeamData.length
    );

    // Calculate new ELOs for winning team players (against opponent team average)
    const newWinningElos = winningTeamData.map(playerData => {
      const kFactor = getClubKFactor(playerData.matchesPlayed);
      return calculateClubElo(playerData.elo, losingTeamElo, 'win', kFactor);
    });

    // Calculate new ELOs for losing team players (against opponent team average)
    const newLosingElos = losingTeamData.map(playerData => {
      const kFactor = getClubKFactor(playerData.matchesPlayed);
      return calculateClubElo(playerData.elo, winningTeamElo, 'loss', kFactor);
    });

    // Update clubStats for BOTH players on winning team
    winningTeamIds.forEach((playerId, index) => {
      const membershipId = `${clubId}_${playerId}`;
      const membershipRef = db.doc(`clubMembers/${membershipId}`);

      if (!winningTeamData[index].exists) {
        // 🆕 Create new membership document with initial stats
        transaction.set(membershipRef, {
          clubId,
          userId: playerId,
          playerName: playerId, // Use playerId as fallback for doubles
          role: 'member',
          status: 'active',
          clubStats: {
            matchesPlayed: 1,
            wins: 1,
            losses: 0,
            clubEloRating: newWinningElos[index],
            clubEloLastUpdated: new Date().toISOString(),
            lastMatchDate: FieldValue.serverTimestamp(),
            tournamentStats: {
              totalMatches: 1,
              tournamentWins: 1,
              tournamentLosses: 0,
            },
          },
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ [STATS] Created new clubMember document for winning player ${playerId}`);
      } else {
        // Update existing membership document
        transaction.update(membershipRef, {
          'clubStats.lastMatchDate': FieldValue.serverTimestamp(),
          'clubStats.clubEloRating': newWinningElos[index],
          'clubStats.clubEloLastUpdated': new Date().toISOString(),
          // 🏆 Increment tournament-specific statistics
          'clubStats.tournamentStats.totalMatches': FieldValue.increment(1),
          'clubStats.tournamentStats.tournamentWins': FieldValue.increment(1),
        });
      }
    });

    // Update clubStats for BOTH players on losing team
    losingTeamIds.forEach((playerId, index) => {
      const membershipId = `${clubId}_${playerId}`;
      const membershipRef = db.doc(`clubMembers/${membershipId}`);

      if (!losingTeamData[index].exists) {
        // 🆕 Create new membership document with initial stats
        transaction.set(membershipRef, {
          clubId,
          userId: playerId,
          playerName: playerId, // Use playerId as fallback for doubles
          role: 'member',
          status: 'active',
          clubStats: {
            matchesPlayed: 1,
            wins: 0,
            losses: 1,
            clubEloRating: newLosingElos[index],
            clubEloLastUpdated: new Date().toISOString(),
            lastMatchDate: FieldValue.serverTimestamp(),
            tournamentStats: {
              totalMatches: 1,
              tournamentWins: 0,
              tournamentLosses: 1,
            },
          },
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ [STATS] Created new clubMember document for losing player ${playerId}`);
      } else {
        // Update existing membership document
        transaction.update(membershipRef, {
          'clubStats.lastMatchDate': FieldValue.serverTimestamp(),
          'clubStats.clubEloRating': newLosingElos[index],
          'clubStats.clubEloLastUpdated': new Date().toISOString(),
          // 🏆 Increment tournament-specific statistics
          'clubStats.tournamentStats.totalMatches': FieldValue.increment(1),
          'clubStats.tournamentStats.tournamentLosses': FieldValue.increment(1),
        });
      }
    });

    // 🏛️ Prepare match history entries for all 4 players (saved AFTER transaction)
    const allPlayerIds = [...winningTeamIds, ...losingTeamIds];
    const allPlayerData = [...winningTeamData, ...losingTeamData];
    const allNewElos = [...newWinningElos, ...newLosingElos];

    matchHistoryEntries = allPlayerIds.map((playerId, i) => ({
      playerId,
      matchEntry: {
        matchId,
        tournamentId,
        tournamentName: tournament.name || 'Unknown Tournament',
        clubId,
        clubName: tournament.clubName || 'Unknown Club',
        opponent: {
          playerId: i < winningTeamIds.length ? loserId : winnerId,
          playerName:
            i < winningTeamIds.length
              ? `${match.player2?.playerName || 'Unknown Team'}`
              : `${match.player1?.playerName || 'Unknown Team'}`,
          teamId: i < winningTeamIds.length ? loserId : winnerId,
        },
        result: i < winningTeamIds.length ? 'win' : 'loss',
        matchType: 'doubles',
        score: score || '',
        date: FieldValue.serverTimestamp(),
        context: 'tournament',
        oldElo: allPlayerData[i].elo,
        newElo: allNewElos[i],
        eloChange: allNewElos[i] - allPlayerData[i].elo,
      },
    }));
  });

  // 🏛️ Add match to history AFTER transaction completes (no transaction parameter)
  try {
    await Promise.all(
      matchHistoryEntries.map(({ playerId, matchEntry }) => addMatchToHistory(playerId, matchEntry))
    );
    console.log('✅ [STATS] Player statistics and match history updated successfully');
  } catch (error) {
    // Match history is non-critical, so we log the error but don't fail the whole operation
    console.error('❌ [MATCH HISTORY] Error adding match history (non-critical):', error);
  }
}

/**
 * 🎯 Get Player ELO from clubMembership
 *
 * Helper function to read player's current ELO rating
 * Returns default values for new members
 */
async function getPlayerElo(playerId, clubId, transaction) {
  try {
    const membershipId = `${clubId}_${playerId}`;
    const membershipRef = admin.firestore().doc(`clubMembers/${membershipId}`);
    const membershipDoc = await transaction.get(membershipRef);

    if (membershipDoc.exists) {
      const clubStats = membershipDoc.data().clubStats || {};
      const elo = getCurrentClubElo(clubStats);
      const matchesPlayed = clubStats.matchesPlayed || 0;
      return { elo, matchesPlayed, clubStats, exists: true, membershipDoc };
    }

    // New member - return defaults
    return { elo: 1200, matchesPlayed: 0, clubStats: {}, exists: false, membershipDoc: null };
  } catch (error) {
    console.error(`❌ [CLUB ELO] Error reading ELO for ${playerId}:`, error);
    return { elo: 1200, matchesPlayed: 0, clubStats: {}, exists: false, membershipDoc: null };
  }
}

/**
 * 🔔 Send Match Result Notifications (Future Implementation)
 *
 * Will send push notifications to:
 * - Winner and loser
 * - Tournament participants
 * - Club members (optional)
 */
async function sendMatchResultNotifications(winnerId, loserId, score) {
  // TODO: Implement FCM push notifications
  console.log('🔔 [NOTIFICATIONS] Push notifications not yet implemented');
}

/**
 * 🏆 Update Global Rankings (Future Implementation)
 *
 * Will recalculate tournament-wide rankings based on:
 * - Win/loss records
 * - Head-to-head results
 * - Tiebreaker rules
 */
async function updateGlobalRankings(db, tournamentId, clubId) {
  // TODO: Implement global rankings calculation
  console.log('🏆 [RANKINGS] Global rankings calculation not yet implemented');
}
