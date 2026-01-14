/**
 * ⚡ THOR'S TROPHY CEREMONY ⚡
 * Callable Cloud Function: Award Tournament Trophies
 *
 * Explicitly awards trophies to tournament winners when called by the client.
 * This ensures trophies are awarded even in local development environments
 * where Firestore triggers may not be running.
 *
 * Type: Callable (client explicitly invokes this function)
 * Input: { tournamentId: string }
 * Action: Award trophies to champion and runner-up
 */

const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { awardTournamentTrophy } = require('./utils/trophyAwarder');
const { sendTrophyNotification } = require('./utils/notificationSender');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.awardTournamentTrophies = onCall(async request => {
  const { tournamentId } = request.data;

  // Validate input
  if (!tournamentId) {
    throw new Error('tournamentId is required');
  }

  console.log('🏆 [TROPHY CEREMONY] Starting trophy awarding for tournament:', tournamentId);

  try {
    const db = admin.firestore();
    const tournamentRef = db.doc(`tournaments/${tournamentId}`);

    // Use transaction to safely read tournament data and award trophies
    const result = await db.runTransaction(async transaction => {
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }

      const tournamentData = tournamentDoc.data();

      // Verify tournament is completed
      if (tournamentData.status !== 'completed') {
        throw new Error(
          `Tournament ${tournamentId} is not completed (status: ${tournamentData.status})`
        );
      }

      console.log('🎉 [TROPHY CEREMONY] Tournament verified:', {
        tournamentId,
        tournamentName: tournamentData.tournamentName || tournamentData.title,
        status: tournamentData.status,
        hasChampion: !!tournamentData.champion,
        hasRunnerUp: !!tournamentData.runnerUp,
        hasRankings: !!(tournamentData.rankings && tournamentData.rankings.length > 0),
      });

      // Get club data for trophy context
      let clubName = 'Pickleball Club';
      if (tournamentData.clubId) {
        try {
          const clubDoc = await transaction.get(db.doc(`pickleball_clubs/${tournamentData.clubId}`));
          if (clubDoc.exists) {
            const clubData = clubDoc.data();
            clubName = clubData.name || clubData.profile?.name || 'Pickleball Club';
          }
        } catch (error) {
          console.warn('⚠️ [TROPHY CEREMONY] Could not fetch club name:', error);
        }
      }

      const tournamentName = tournamentData.tournamentName || tournamentData.title || 'Unknown';

      let winnerPlayerIds = [];
      let runnerUpPlayerIds = [];

      // Strategy 1: Use rankings if available (most reliable)
      const rankings = tournamentData.rankings || [];

      // 🆕 STEP 3: Pre-read all membership documents for bestFinish comparison
      const membershipReads = {};

      if (rankings.length > 0) {
        const winner = rankings.find(r => r.rank === 1);
        const runnerUp = rankings.find(r => r.rank === 2);

        // Pre-read winner memberships
        if (winner && winner.playerId) {
          const winnerIds = winner.playerId.includes('_')
            ? winner.playerId.split('_')
            : [winner.playerId];

          for (const playerId of winnerIds) {
            const membershipId = `${tournamentData.clubId}_${playerId}`;
            const membershipRef = db.doc(`clubMembers/${membershipId}`);
            const membershipDoc = await transaction.get(membershipRef);
            const currentBestFinish =
              membershipDoc.data()?.clubStats?.tournamentStats?.bestFinishPosition || 999;
            membershipReads[playerId] = currentBestFinish;
            console.log(
              `📖 [TROPHY CEREMONY] Pre-read ${playerId} bestFinish: ${currentBestFinish}`
            );
          }
        }

        // Pre-read runner-up memberships
        if (runnerUp && runnerUp.playerId) {
          const runnerUpIds = runnerUp.playerId.includes('_')
            ? runnerUp.playerId.split('_')
            : [runnerUp.playerId];

          for (const playerId of runnerUpIds) {
            const membershipId = `${tournamentData.clubId}_${playerId}`;
            const membershipRef = db.doc(`clubMembers/${membershipId}`);
            const membershipDoc = await transaction.get(membershipRef);
            const currentBestFinish =
              membershipDoc.data()?.clubStats?.tournamentStats?.bestFinishPosition || 999;
            membershipReads[playerId] = currentBestFinish;
            console.log(
              `📖 [TROPHY CEREMONY] Pre-read ${playerId} bestFinish: ${currentBestFinish}`
            );
          }
        }
      } else {
        // Fallback: champion/runnerUp fields
        if (tournamentData.champion && tournamentData.champion.playerId) {
          const championIds = tournamentData.champion.playerId.includes('_')
            ? tournamentData.champion.playerId.split('_')
            : [tournamentData.champion.playerId];

          for (const playerId of championIds) {
            const membershipId = `${tournamentData.clubId}_${playerId}`;
            const membershipRef = db.doc(`clubMembers/${membershipId}`);
            const membershipDoc = await transaction.get(membershipRef);
            const currentBestFinish =
              membershipDoc.data()?.clubStats?.tournamentStats?.bestFinishPosition || 999;
            membershipReads[playerId] = currentBestFinish;
            console.log(
              `📖 [TROPHY CEREMONY] Pre-read ${playerId} bestFinish: ${currentBestFinish}`
            );
          }
        }

        if (tournamentData.runnerUp && tournamentData.runnerUp.playerId) {
          const runnerUpIds = tournamentData.runnerUp.playerId.includes('_')
            ? tournamentData.runnerUp.playerId.split('_')
            : [tournamentData.runnerUp.playerId];

          for (const playerId of runnerUpIds) {
            const membershipId = `${tournamentData.clubId}_${playerId}`;
            const membershipRef = db.doc(`clubMembers/${membershipId}`);
            const membershipDoc = await transaction.get(membershipRef);
            const currentBestFinish =
              membershipDoc.data()?.clubStats?.tournamentStats?.bestFinishPosition || 999;
            membershipReads[playerId] = currentBestFinish;
            console.log(
              `📖 [TROPHY CEREMONY] Pre-read ${playerId} bestFinish: ${currentBestFinish}`
            );
          }
        }
      }
      if (rankings.length > 0) {
        console.log('📊 [TROPHY CEREMONY] Using rankings data (preferred method)');

        const winner = rankings.find(r => r.rank === 1);
        const runnerUp = rankings.find(r => r.rank === 2);

        if (winner && winner.playerId) {
          const winnerId = winner.playerId;
          const isDoublesWinner = winnerId.includes('_');

          if (isDoublesWinner) {
            console.log('👥 [TROPHY CEREMONY] Doubles winner detected:', winnerId);
            winnerPlayerIds = winnerId.split('_');
          } else {
            winnerPlayerIds = [winnerId];
          }

          // Award winner trophies
          for (const playerId of winnerPlayerIds) {
            console.log(`🥇 [TROPHY CEREMONY] Awarding Winner trophy to: ${playerId}`);
            await awardTournamentTrophy(
              playerId,
              tournamentId,
              tournamentName,
              tournamentData.clubId,
              clubName,
              tournamentData.leagueId || tournamentData.clubId,
              'Winner',
              1,
              transaction,
              membershipReads[playerId]
            );
          }
        }

        if (runnerUp && runnerUp.playerId) {
          const runnerUpId = runnerUp.playerId;
          const isDoublesRunnerUp = runnerUpId.includes('_');

          if (isDoublesRunnerUp) {
            console.log('👥 [TROPHY CEREMONY] Doubles runner-up detected:', runnerUpId);
            runnerUpPlayerIds = runnerUpId.split('_');
          } else {
            runnerUpPlayerIds = [runnerUpId];
          }

          // Award runner-up trophies
          for (const playerId of runnerUpPlayerIds) {
            console.log(`🥈 [TROPHY CEREMONY] Awarding Runner-up trophy to: ${playerId}`);
            await awardTournamentTrophy(
              playerId,
              tournamentId,
              tournamentName,
              tournamentData.clubId,
              clubName,
              tournamentData.leagueId || tournamentData.clubId,
              'Runner-up',
              2,
              transaction,
              membershipReads[playerId]
            );
          }
        }
      } else {
        // Strategy 2: Fallback to champion/runnerUp fields
        console.log(
          '⚠️ [TROPHY CEREMONY] No rankings found, falling back to champion/runnerUp fields'
        );

        if (tournamentData.champion && tournamentData.champion.playerId) {
          const championId = tournamentData.champion.playerId;
          const isDoublesChampion = championId.includes('_');

          if (isDoublesChampion) {
            console.log('👥 [TROPHY CEREMONY] Doubles champion detected:', championId);
            winnerPlayerIds = championId.split('_');
          } else {
            winnerPlayerIds = [championId];
          }

          // Award winner trophies
          for (const playerId of winnerPlayerIds) {
            console.log(`🥇 [TROPHY CEREMONY] Awarding Winner trophy to: ${playerId}`);
            await awardTournamentTrophy(
              playerId,
              tournamentId,
              tournamentName,
              tournamentData.clubId,
              clubName,
              tournamentData.leagueId || tournamentData.clubId,
              'Winner',
              1,
              transaction,
              membershipReads[playerId]
            );
          }
        }

        if (tournamentData.runnerUp && tournamentData.runnerUp.playerId) {
          const runnerUpId = tournamentData.runnerUp.playerId;
          const isDoublesRunnerUp = runnerUpId.includes('_');

          if (isDoublesRunnerUp) {
            console.log('👥 [TROPHY CEREMONY] Doubles runner-up detected:', runnerUpId);
            runnerUpPlayerIds = runnerUpId.split('_');
          } else {
            runnerUpPlayerIds = [runnerUpId];
          }

          // Award runner-up trophies
          for (const playerId of runnerUpPlayerIds) {
            console.log(`🥈 [TROPHY CEREMONY] Awarding Runner-up trophy to: ${playerId}`);
            await awardTournamentTrophy(
              playerId,
              tournamentId,
              tournamentName,
              tournamentData.clubId,
              clubName,
              tournamentData.leagueId || tournamentData.clubId,
              'Runner-up',
              2,
              transaction,
              membershipReads[playerId]
            );
          }
        }
      }

      console.log('✅ [TROPHY CEREMONY] All trophies awarded successfully!');

      return {
        winnerPlayerIds,
        runnerUpPlayerIds,
        clubName,
        tournamentName,
        clubId: tournamentData.clubId,
      };
    });

    // Send push notifications AFTER transaction completes
    console.log('📲 [TROPHY CEREMONY] Sending push notifications...');

    const { winnerPlayerIds, runnerUpPlayerIds, clubName, tournamentName, clubId } = result;

    // Send winner notifications
    for (const playerId of winnerPlayerIds) {
      try {
        await sendTrophyNotification(playerId, {
          rank: 'Winner',
          tournamentName: tournamentName,
          tournamentId: tournamentId,
          clubName: clubName,
          clubId: clubId,
        });
        console.log(`✅ [TROPHY CEREMONY] Winner notification sent to ${playerId}`);
      } catch (error) {
        console.error(`❌ [TROPHY CEREMONY] Failed to send winner notification:`, error);
      }
    }

    // Send runner-up notifications
    for (const playerId of runnerUpPlayerIds) {
      try {
        await sendTrophyNotification(playerId, {
          rank: 'Runner-up',
          tournamentName: tournamentName,
          tournamentId: tournamentId,
          clubName: clubName,
          clubId: clubId,
        });
        console.log(`✅ [TROPHY CEREMONY] Runner-up notification sent to ${playerId}`);
      } catch (error) {
        console.error(`❌ [TROPHY CEREMONY] Failed to send runner-up notification:`, error);
      }
    }

    console.log('✅ [TROPHY CEREMONY] Trophy ceremony completed successfully!');

    return {
      success: true,
      message: 'Trophies awarded successfully',
      data: {
        tournamentId,
        winnerCount: winnerPlayerIds.length,
        runnerUpCount: runnerUpPlayerIds.length,
      },
    };
  } catch (error) {
    console.error('❌ [TROPHY CEREMONY] Failed to award trophies:', error);
    throw error;
  }
});
