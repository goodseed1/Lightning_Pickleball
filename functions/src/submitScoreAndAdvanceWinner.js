/**
 * Cloud Function: Tournament Score Submission and Winner Advancement
 * 토너먼트 점수 제출 및 승자 진출 처리
 *
 * FIXED: Corrected Firestore path from 'leagues' to 'tournaments'
 * 🆕 PROJECT OLYMPUS: Club ELO calculation added
 */

const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const {
  calculateClubElo,
  getClubKFactor,
  getCurrentClubElo,
} = require('./utils/clubEloCalculator');
const { addMatchToHistory } = require('./utils/matchHistoryManager');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const submitScoreAndAdvanceWinner = onCall(
  {
    // 🔒 PRODUCTION: App Check enforcement enabled for security
    // Requires valid App Check token from physical device with DeviceCheck (iOS) or Play Integrity (Android)
    enforceAppCheck: true,
    // 🔓 REACT NATIVE FIX: Allow public invocation for manual token verification
    // Firebase Web SDK in React Native doesn't auto-attach auth to Cloud Run requests
    // We handle authentication manually inside the function (line 35-46)
    invoker: 'public',
  },
  async request => {
    const { tournamentId, matchId, result, idToken } = request.data;
    let auth = request.auth;

    // 🆕 Manual token verification for React Native compatibility
    if (!auth && idToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        auth = {
          uid: decodedToken.uid,
          token: decodedToken,
        };
        console.log('✅ Manual token verified:', auth.uid);
      } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        throw new HttpsError('unauthenticated', 'Invalid authentication token');
      }
    }

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!tournamentId || !matchId || !result) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      const db = admin.firestore();
      const completedMatchRef = admin
        .firestore()
        .doc(`tournaments/${tournamentId}/matches/${matchId}`);

      const completedMatchDoc = await completedMatchRef.get();

      if (!completedMatchDoc.exists) {
        console.error('❌ Match not found:', matchId);
        throw new HttpsError('not-found', `Match ${matchId} not found`);
      }

      const completedMatch = completedMatchDoc.data();

      // Verify the user can submit this score
      const isParticipant =
        completedMatch.player1?.playerId === auth.uid ||
        completedMatch.player2?.playerId === auth.uid;

      // Check if user is tournament admin
      const tournamentRef = admin.firestore().doc(`tournaments/${tournamentId}`);
      const tournamentDoc = await tournamentRef.get();

      if (!tournamentDoc.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournament = tournamentDoc.data();
      const isTournamentAdmin = tournament.createdBy === auth.uid;

      if (!isParticipant && !isTournamentAdmin) {
        throw new HttpsError(
          'permission-denied',
          'User is not authorized to submit score for this match'
        );
      }

      // Validate match is in correct status
      if (completedMatch.status !== 'scheduled' && completedMatch.status !== 'in_progress') {
        throw new HttpsError('failed-precondition', 'Match is not available for score entry');
      }

      // Run the update in a transaction to ensure consistency
      await db.runTransaction(async transaction => {
        // Update the completed match
        const matchUpdateData = {
          status: 'completed',
          _winner: result.winnerId,
          score: result.score,
          notes: result.notes || '',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        transaction.update(completedMatchRef, matchUpdateData);

        // If there's a next match, advance the winner
        // 🌉 [HEIMDALL] Phase 5.2: Use flat fields (nextMatchId, nextMatchPosition) from GPS Engine
        if (completedMatch.nextMatchId && result.winnerId) {
          const nextMatchRef = admin
            .firestore()
            .doc(`tournaments/${tournamentId}/matches/${completedMatch.nextMatchId}`);

          const nextMatchDoc = await transaction.get(nextMatchRef);

          if (nextMatchDoc.exists) {
            const nextMatch = nextMatchDoc.data();
            const advancementData = {};

            // Determine winner details
            let winnerDetails = null;
            if (result.winnerId === completedMatch.player1?.playerId) {
              winnerDetails = completedMatch.player1;
            } else if (result.winnerId === completedMatch.player2?.playerId) {
              winnerDetails = completedMatch.player2;
            }

            if (winnerDetails && completedMatch.nextMatchPosition) {
              if (completedMatch.nextMatchPosition === 'player1') {
                advancementData.player1 = winnerDetails;
              } else if (completedMatch.nextMatchPosition === 'player2') {
                advancementData.player2 = winnerDetails;
              }

              advancementData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
              transaction.update(nextMatchRef, advancementData);
            }
          }
        }

        // 🏛️ TEAM-AWARE: Update clubStats for all players (with admin privileges)
        const player1Id = completedMatch.player1?.playerId;
        const player2Id = completedMatch.player2?.playerId;
        const clubId = tournament.clubId;

        // 🆕 PROJECT OLYMPUS: Read player ELOs before updating (for ELO calculation)
        const playerElos = new Map();

        async function getPlayerElo(playerId, clubId, transaction) {
          try {
            const membershipId = `${clubId}_${playerId}`;
            const membershipRef = db.doc(`clubMembers/${membershipId}`);
            const membershipDoc = await transaction.get(membershipRef);

            if (membershipDoc.exists()) {
              const clubStats = membershipDoc.data().clubStats || {};
              const elo = getCurrentClubElo(clubStats);
              const matchesPlayed = clubStats.matchesPlayed || 0;
              return { elo, matchesPlayed, clubStats };
            }

            // New member - return defaults
            return { elo: 1200, matchesPlayed: 0, clubStats: {} };
          } catch (error) {
            console.error(`❌ [CLUB ELO] Error reading ELO for ${playerId}:`, error);
            return { elo: 1200, matchesPlayed: 0, clubStats: {} };
          }
        }

        if (player1Id && player2Id && clubId && result.winnerId) {
          // 🚀 PHASE 2: Extract retired/walkover flags from result.score
          const isRetired = result.score?.retired === true;
          const isWalkover = result.score?.walkover === true;

          console.log('🎾 [RETIRED/WALKOVER] Match completion type:', {
            isRetired,
            isWalkover,
            finalScore: result.score?.finalScore,
            normalCompletion: !isRetired && !isWalkover,
          });

          // 🎾 TEAM-AWARE: Check if this is a doubles match (teamId contains underscore)
          const isDoublesMatch = player1Id.includes('_') && player2Id.includes('_');

          if (isDoublesMatch) {
            // Extract individual player IDs from teamIds
            const team1PlayerIds = player1Id.split('_');
            const team2PlayerIds = player2Id.split('_');

            // Determine which team won
            const isTeam1Winner = player1Id === result.winnerId;
            const winningTeamIds = isTeam1Winner ? team1PlayerIds : team2PlayerIds;
            const losingTeamIds = isTeam1Winner ? team2PlayerIds : team1PlayerIds;

            // 🆕 PROJECT OLYMPUS: Read ELOs for all 4 players BEFORE updating
            const team1Player1Data = await getPlayerElo(team1PlayerIds[0], clubId, transaction);
            const team1Player2Data = await getPlayerElo(team1PlayerIds[1], clubId, transaction);
            const team2Player1Data = await getPlayerElo(team2PlayerIds[0], clubId, transaction);
            const team2Player2Data = await getPlayerElo(team2PlayerIds[1], clubId, transaction);

            // Calculate team average ELOs
            const team1AverageElo = Math.round((team1Player1Data.elo + team1Player2Data.elo) / 2);
            const team2AverageElo = Math.round((team2Player1Data.elo + team2Player2Data.elo) / 2);

            // Calculate new ELOs for winning team players (against opponent team average)
            const winningTeamData = isTeam1Winner
              ? [team1Player1Data, team1Player2Data]
              : [team2Player1Data, team2Player2Data];
            const losingTeamData = isTeam1Winner
              ? [team2Player1Data, team2Player2Data]
              : [team1Player1Data, team1Player2Data];
            const opponentTeamElo = isTeam1Winner ? team2AverageElo : team1AverageElo;

            // 🚀 PHASE 2: Calculate new ELOs (Skip for walkover)
            let newWinningElos, newLosingElos;

            if (isWalkover) {
              // Walkover: NO ELO change
              newWinningElos = winningTeamData.map(playerData => playerData.elo);
              newLosingElos = losingTeamData.map(playerData => playerData.elo);
              console.log('🚀 [WALKOVER - DOUBLES] No ELO change for all 4 players');
            } else {
              // Retired or Normal: Calculate ELO normally
              newWinningElos = winningTeamData.map(playerData => {
                const kFactor = getClubKFactor(playerData.matchesPlayed);
                return calculateClubElo(playerData.elo, opponentTeamElo, 'win', kFactor);
              });

              const winnerTeamElo = isTeam1Winner ? team1AverageElo : team2AverageElo;
              newLosingElos = losingTeamData.map(playerData => {
                const kFactor = getClubKFactor(playerData.matchesPlayed);
                return calculateClubElo(playerData.elo, winnerTeamElo, 'loss', kFactor);
              });

              console.log('🚀 [NORMAL/RETIRED - DOUBLES] ELO calculated for all 4 players');
            }

            // 🚀 PHASE 2: Update clubStats for BOTH players on winning team (Skip wins/matchesPlayed for walkover)
            winningTeamIds.forEach((playerId, index) => {
              const membershipId = `${clubId}_${playerId}`;
              const membershipRef = db.doc(`clubMembers/${membershipId}`);

              const winnerUpdate = {
                'clubStats.lastMatchDate': admin.firestore.FieldValue.serverTimestamp(),
                'clubStats.clubEloRating': newWinningElos[index],
                'clubStats.clubEloLastUpdated': new Date().toISOString(),
              };

              if (!isWalkover) {
                // Normal or Retired: Increase wins and matchesPlayed
                winnerUpdate['clubStats.wins'] = admin.firestore.FieldValue.increment(1);
                winnerUpdate['clubStats.matchesPlayed'] = admin.firestore.FieldValue.increment(1);
                winnerUpdate['clubStats.tournamentStats.totalMatches'] =
                  admin.firestore.FieldValue.increment(1);
                winnerUpdate['clubStats.tournamentStats.tournamentWins'] =
                  admin.firestore.FieldValue.increment(1);
              }

              transaction.update(membershipRef, winnerUpdate);
            });

            // 🚀 PHASE 2: Update clubStats for BOTH players on losing team (Skip losses/matchesPlayed for walkover)
            losingTeamIds.forEach((playerId, index) => {
              const membershipId = `${clubId}_${playerId}`;
              const membershipRef = db.doc(`clubMembers/${membershipId}`);

              const loserUpdate = {
                'clubStats.lastMatchDate': admin.firestore.FieldValue.serverTimestamp(),
                'clubStats.clubEloRating': newLosingElos[index],
                'clubStats.clubEloLastUpdated': new Date().toISOString(),
              };

              if (!isWalkover) {
                // Normal or Retired: Increase losses and matchesPlayed
                loserUpdate['clubStats.losses'] = admin.firestore.FieldValue.increment(1);
                loserUpdate['clubStats.matchesPlayed'] = admin.firestore.FieldValue.increment(1);
                loserUpdate['clubStats.tournamentStats.totalMatches'] =
                  admin.firestore.FieldValue.increment(1);
                loserUpdate['clubStats.tournamentStats.tournamentLosses'] =
                  admin.firestore.FieldValue.increment(1);
              }

              transaction.update(membershipRef, loserUpdate);
            });

            // 🏛️ PROJECT OLYMPUS: Add match to history for all 4 players
            const allPlayerIds = [...winningTeamIds, ...losingTeamIds];
            const allPlayerData = [
              ...(isTeam1Winner
                ? [team1Player1Data, team1Player2Data, team2Player1Data, team2Player2Data]
                : [team2Player1Data, team2Player2Data, team1Player1Data, team1Player2Data]),
            ];
            const allNewElos = [...newWinningElos, ...newLosingElos];

            // Create match entries for each player
            for (let i = 0; i < allPlayerIds.length; i++) {
              const playerId = allPlayerIds[i];
              const playerData = allPlayerData[i];
              const newElo = allNewElos[i];
              const isWinner = i < winningTeamIds.length;

              const matchEntry = {
                matchId,
                tournamentId,
                tournamentName: tournament.name || 'Unknown Tournament',
                clubId,
                clubName: tournament.clubName || 'Unknown Club',
                opponent: {
                  playerId: isWinner ? losingTeamIds.join('_') : winningTeamIds.join('_'),
                  playerName: isWinner
                    ? `${completedMatch.player2?.playerName || 'Unknown Team'}`
                    : `${completedMatch.player1?.playerName || 'Unknown Team'}`,
                  teamId: isWinner ? player2Id : player1Id,
                },
                result: isWinner ? 'win' : 'loss',
                matchType: 'doubles',
                score: result.score || '',
                date: admin.firestore.FieldValue.serverTimestamp(),
                context: 'tournament',
                oldElo: playerData.elo,
                newElo,
                eloChange: newElo - playerData.elo,
              };

              await addMatchToHistory(playerId, matchEntry, transaction);
            }
          } else {
            // 🎾 SINGLES: Update logic for individual players + Club ELO

            // 🆕 PROJECT OLYMPUS: Read ELOs BEFORE updating stats
            const winnerId = result.winnerId;
            const loserId = player1Id === result.winnerId ? player2Id : player1Id;

            const winnerData = await getPlayerElo(winnerId, clubId, transaction);
            const loserData = await getPlayerElo(loserId, clubId, transaction);

            // 🚀 PHASE 2: Calculate new ELOs (Skip for walkover, normal for retired)
            let newWinnerElo, newLoserElo;

            if (isWalkover) {
              // Walkover: NO ELO change
              newWinnerElo = winnerData.elo;
              newLoserElo = loserData.elo;
              console.log('🚀 [WALKOVER] No ELO change');
            } else {
              // Retired or Normal: Calculate ELO normally
              const winnerKFactor = getClubKFactor(winnerData.matchesPlayed);
              const loserKFactor = getClubKFactor(loserData.matchesPlayed);

              newWinnerElo = calculateClubElo(winnerData.elo, loserData.elo, 'win', winnerKFactor);

              newLoserElo = calculateClubElo(loserData.elo, winnerData.elo, 'loss', loserKFactor);

              console.log('🚀 [NORMAL/RETIRED] ELO calculated:', {
                isRetired,
                winnerChange: newWinnerElo - winnerData.elo,
                loserChange: newLoserElo - loserData.elo,
              });
            }

            const membershipIdWinner = `${clubId}_${winnerId}`;
            const winnerMembershipRef = db.doc(`clubMembers/${membershipIdWinner}`);

            // 🚀 PHASE 2: Update winner stats (Skip wins/matchesPlayed for walkover)
            const winnerUpdate = {
              'clubStats.lastMatchDate': admin.firestore.FieldValue.serverTimestamp(),
              'clubStats.clubEloRating': newWinnerElo,
              'clubStats.clubEloLastUpdated': new Date().toISOString(),
            };

            if (!isWalkover) {
              // Normal or Retired: Increase wins and matchesPlayed
              winnerUpdate['clubStats.wins'] = admin.firestore.FieldValue.increment(1);
              winnerUpdate['clubStats.matchesPlayed'] = admin.firestore.FieldValue.increment(1);
              winnerUpdate['clubStats.tournamentStats.totalMatches'] =
                admin.firestore.FieldValue.increment(1);
              winnerUpdate['clubStats.tournamentStats.tournamentWins'] =
                admin.firestore.FieldValue.increment(1);
            }

            transaction.update(winnerMembershipRef, winnerUpdate);

            // 🚀 PHASE 2: Update loser stats (Skip losses/matchesPlayed for walkover)
            const membershipIdLoser = `${clubId}_${loserId}`;
            const loserMembershipRef = db.doc(`clubMembers/${membershipIdLoser}`);

            const loserUpdate = {
              'clubStats.lastMatchDate': admin.firestore.FieldValue.serverTimestamp(),
              'clubStats.clubEloRating': newLoserElo,
              'clubStats.clubEloLastUpdated': new Date().toISOString(),
            };

            if (!isWalkover) {
              // Normal or Retired: Increase losses and matchesPlayed
              loserUpdate['clubStats.losses'] = admin.firestore.FieldValue.increment(1);
              loserUpdate['clubStats.matchesPlayed'] = admin.firestore.FieldValue.increment(1);
              loserUpdate['clubStats.tournamentStats.totalMatches'] =
                admin.firestore.FieldValue.increment(1);
              loserUpdate['clubStats.tournamentStats.tournamentLosses'] =
                admin.firestore.FieldValue.increment(1);
            }

            transaction.update(loserMembershipRef, loserUpdate);

            // 🏛️ PROJECT OLYMPUS: Add match to history for both players
            const winnerMatchEntry = {
              matchId,
              tournamentId,
              tournamentName: tournament.name || 'Unknown Tournament',
              clubId,
              clubName: tournament.clubName || 'Unknown Club',
              opponent: {
                playerId: loserId,
                playerName:
                  completedMatch.player2?.playerName ||
                  (completedMatch.player1?.playerId === loserId
                    ? completedMatch.player1?.playerName
                    : 'Unknown'),
              },
              result: 'win',
              matchType: 'singles',
              score: result.score || '',
              date: admin.firestore.FieldValue.serverTimestamp(),
              context: 'tournament',
              oldElo: winnerData.elo,
              newElo: newWinnerElo,
              eloChange: newWinnerElo - winnerData.elo,
            };

            const loserMatchEntry = {
              matchId,
              tournamentId,
              tournamentName: tournament.name || 'Unknown Tournament',
              clubId,
              clubName: tournament.clubName || 'Unknown Club',
              opponent: {
                playerId: winnerId,
                playerName:
                  completedMatch.player1?.playerName ||
                  (completedMatch.player2?.playerId === winnerId
                    ? completedMatch.player2?.playerName
                    : 'Unknown'),
              },
              result: 'loss',
              matchType: 'singles',
              score: result.score || '',
              date: admin.firestore.FieldValue.serverTimestamp(),
              context: 'tournament',
              oldElo: loserData.elo,
              newElo: newLoserElo,
              eloChange: newLoserElo - loserData.elo,
            };
          }
        }
      });

      return {
        success: true,
        message: 'Match result submitted, winner advanced, and clubStats updated successfully',
      };
    } catch (error) {
      console.error('❌ Error in submitScoreAndAdvanceWinner:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Tournament operation failed: ${error.message}`);
    }
  }
);

module.exports = { submitScoreAndAdvanceWinner };
