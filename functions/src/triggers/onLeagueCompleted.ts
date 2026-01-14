/**
 * ⚡ THOR'S HERALD OF VICTORY ⚡
 * Cloud Function: League Completion Trigger
 *
 * Automatically updates club's recentWinners when a league is completed.
 * This ensures league champions are immediately displayed on the club home screen.
 *
 * Trigger: leagues/{leagueId} onUpdate
 * Condition: status changes to 'completed' AND champion exists
 * Action: Update clubs/{clubId}.recentWinners array
 */

import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { awardLeagueTrophy } from '../utils/trophyAwarder';
import { checkAndAwardLeagueBadges } from '../utils/leagueBadgeChecker';
import { checkLeagueChampionBadge } from '../utils/matchBadgeChecker';
import { sendTrophyNotification, sendBadgeNotification } from '../utils/notificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const onLeagueCompleted = onDocumentUpdated('leagues/{leagueId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const leagueId = event.params.leagueId;

  if (!before || !after) {
    console.error('❌ [HERALD] Event data is undefined');
    return { success: false, reason: 'Event data is undefined' };
  }

  console.log('🏆 [HERALD] League update detected:', {
    leagueId,
    leagueName: after.name || after.leagueName || after.title,
    beforeStatus: before?.status,
    afterStatus: after?.status,
    hasChampion: !!after.champion,
    hasClubId: !!after.clubId,
  });

  // 🎯 Check if league just completed with a champion
  if (
    before?.status !== 'completed' &&
    after?.status === 'completed' &&
    after.champion &&
    after.clubId
  ) {
    console.log('🎉 [HERALD] VICTORY DETECTED! Proclaiming champion...');

    try {
      const db = admin.firestore();
      const clubRef = db.doc(`pickleball_clubs/${after.clubId}`);

      // 🏆 Prepare winner data
      const winnerData = {
        leagueId: leagueId,
        leagueName: after.name || after.leagueName || after.title,
        eventType: after.eventType || 'Unknown',
        championId: after.champion.playerId,
        championName: after.champion.playerName,
        completedAt: after.completedAt || admin.firestore.Timestamp.now(),
        ...(after.champion.finalScore && { finalScore: after.champion.finalScore }),
      };

      console.log('📣 [HERALD] Champion data prepared:', winnerData);

      // 🔄 Update club's recentWinners array
      // Use transaction to safely read current winners and update
      const transactionResult = await db.runTransaction(async transaction => {
        const clubDoc = await transaction.get(clubRef);

        if (!clubDoc.exists) {
          console.error('❌ [HERALD] Club not found:', after.clubId);
          throw new Error(`Club ${after.clubId} not found`);
        }

        const clubData = clubDoc.data()!;
        let recentWinners = clubData.recentWinners || [];

        // Add new winner to the beginning of the array
        recentWinners.unshift(winnerData);

        // Keep only the latest 5 winners (FIFO)
        if (recentWinners.length > 5) {
          recentWinners = recentWinners.slice(0, 5);
        }

        console.log('🎯 [HERALD] Updating club with winners:', {
          clubId: after.clubId,
          totalWinners: recentWinners.length,
          latestChampion: winnerData.championName,
        });

        // Update club document
        transaction.update(clubRef, {
          recentWinners: recentWinners,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 🏛️ PROJECT OLYMPUS: Award trophies to winner and runner-up
        console.log('🏆 [OLYMPUS] Awarding trophies to league participants...');

        // Get data from league
        const rankings = after.rankings || [];

        let winnerPlayerId = null;
        let runnerUpPlayerId = null;

        // ⚠️ ROOT CAUSE FIX: Prioritize champion/runnerUp over rankings
        // Champion/RunnerUp are calculated client-side from Final match and are more reliable
        // Rankings may have calculation issues or timing problems
        if (after.champion || after.runnerUp) {
          console.log(
            '✅ [OLYMPUS] Using champion/runnerUp fields (client-side Final match results)...'
          );

          if (after.champion && after.champion.playerId) {
            console.log(
              '🥇 [TROPHY] Awarding Winner trophy to champion:',
              after.champion.playerName
            );

            // 🎾 복식 리그 체크: playerId에 '_'가 포함되어 있으면 팀 ID
            const championId = after.champion.playerId;
            const isDoublesChampion = championId.includes('_');

            if (isDoublesChampion) {
              console.log('👥 [TROPHY] Doubles league detected - awarding to both players');
              // 팀 ID를 개인 ID로 분리
              const playerIds = championId.split('_');

              for (const playerId of playerIds) {
                console.log(`🥇 [TROPHY] Awarding Winner trophy to individual: ${playerId}`);
                await awardLeagueTrophy(
                  playerId,
                  leagueId,
                  after.name || after.leagueName || after.title || 'Unknown League',
                  after.clubId,
                  clubData.name || 'Unknown Club',
                  after.leagueId || after.clubId,
                  'Winner',
                  1,
                  transaction
                );
              }
              winnerPlayerId = playerIds[0]; // Store first player for notification
            } else {
              // 단식: 그대로 처리
              await awardLeagueTrophy(
                championId,
                leagueId,
                after.name || after.leagueName || after.title || 'Unknown League',
                after.clubId,
                clubData.name || 'Unknown Club',
                after.leagueId || after.clubId,
                'Winner',
                1,
                transaction
              );
              winnerPlayerId = championId;
            }
          }

          if (after.runnerUp && after.runnerUp.playerId) {
            console.log('🥈 [TROPHY] Awarding Runner-up trophy to:', after.runnerUp.playerName);

            // 🎾 복식 리그 체크: playerId에 '_'가 포함되어 있으면 팀 ID
            const runnerUpId = after.runnerUp.playerId;
            const isDoublesRunnerUp = runnerUpId.includes('_');

            if (isDoublesRunnerUp) {
              console.log('👥 [TROPHY] Doubles league detected - awarding to both players');
              // 팀 ID를 개인 ID로 분리
              const playerIds = runnerUpId.split('_');

              for (const playerId of playerIds) {
                console.log(`🥈 [TROPHY] Awarding Runner-up trophy to individual: ${playerId}`);
                await awardLeagueTrophy(
                  playerId,
                  leagueId,
                  after.name || after.leagueName || after.title || 'Unknown League',
                  after.clubId,
                  clubData.name || 'Unknown Club',
                  after.leagueId || after.clubId,
                  'Runner-up',
                  2,
                  transaction
                );
              }
              runnerUpPlayerId = playerIds[0]; // Store first player for notification
            } else {
              // 단식: 그대로 처리
              await awardLeagueTrophy(
                runnerUpId,
                leagueId,
                after.name || after.leagueName || after.title || 'Unknown League',
                after.clubId,
                clubData.name || 'Unknown Club',
                after.leagueId || after.clubId,
                'Runner-up',
                2,
                transaction
              );
              runnerUpPlayerId = runnerUpId;
            }
          }

          console.log('✅ [OLYMPUS] Trophies awarded successfully from champion/runnerUp data!');

          // 🏅 [PROJECT OLYMPUS] Award League Champion badge to winner
          if (winnerPlayerId) {
            // Handle doubles teams (ID contains '_')
            const winnerIds = winnerPlayerId.includes('_')
              ? winnerPlayerId.split('_')
              : [winnerPlayerId];

            for (const playerId of winnerIds) {
              try {
                const championBadges = await checkLeagueChampionBadge(
                  playerId,
                  leagueId,
                  after.clubId,
                  clubData.name || 'Unknown Club'
                );
                if (championBadges.length > 0) {
                  console.log(
                    `👑 [OLYMPUS] Awarded League Champion badge to ${playerId}:`,
                    championBadges
                  );
                }
              } catch (error) {
                console.error(
                  `❌ [OLYMPUS] Failed to award League Champion badge to ${playerId}:`,
                  error
                );
              }
            }
          }
        } else if (rankings.length > 0) {
          // 🔄 FALLBACK: Use rankings if champion/runnerUp are not available
          console.log('⚠️ [OLYMPUS] No champion/runnerUp found, falling back to rankings data...');

          // Award Winner trophy (rank 1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const winner = rankings.find((r: any) => r.rank === 1);
          if (winner && winner.playerId) {
            console.log('🥇 [TROPHY] Awarding Winner trophy to:', winner.playerName);

            // 🎾 Check for doubles team ID
            const winnerId = winner.playerId;
            const isDoublesWinner = winnerId.includes('_');

            if (isDoublesWinner) {
              console.log('👥 [TROPHY] Doubles league detected - awarding to both players');
              const playerIds = winnerId.split('_');

              for (const playerId of playerIds) {
                console.log(`🥇 [TROPHY] Awarding Winner trophy to individual: ${playerId}`);
                await awardLeagueTrophy(
                  playerId,
                  leagueId,
                  after.name || after.leagueName || after.title || 'Unknown League',
                  after.clubId,
                  clubData.name || 'Unknown Club',
                  after.leagueId || after.clubId,
                  'Winner',
                  1,
                  transaction
                );
              }
              winnerPlayerId = playerIds[0];
            } else {
              await awardLeagueTrophy(
                winnerId,
                leagueId,
                after.name || after.leagueName || after.title || 'Unknown League',
                after.clubId,
                clubData.name || 'Unknown Club',
                after.leagueId || after.clubId,
                'Winner',
                1,
                transaction
              );
              winnerPlayerId = winnerId;
            }
          }

          // Award Runner-up trophy (rank 2)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const runnerUp = rankings.find((r: any) => r.rank === 2);
          if (runnerUp && runnerUp.playerId) {
            console.log('🥈 [TROPHY] Awarding Runner-up trophy to:', runnerUp.playerName);

            // 🎾 Check for doubles team ID
            const runnerUpId = runnerUp.playerId;
            const isDoublesRunnerUp = runnerUpId.includes('_');

            if (isDoublesRunnerUp) {
              console.log('👥 [TROPHY] Doubles league detected - awarding to both players');
              const playerIds = runnerUpId.split('_');

              for (const playerId of playerIds) {
                console.log(`🥈 [TROPHY] Awarding Runner-up trophy to individual: ${playerId}`);
                await awardLeagueTrophy(
                  playerId,
                  leagueId,
                  after.name || after.leagueName || after.title || 'Unknown League',
                  after.clubId,
                  clubData.name || 'Unknown Club',
                  after.leagueId || after.clubId,
                  'Runner-up',
                  2,
                  transaction
                );
              }
              runnerUpPlayerId = playerIds[0];
            } else {
              await awardLeagueTrophy(
                runnerUpId,
                leagueId,
                after.name || after.leagueName || after.title || 'Unknown League',
                after.clubId,
                clubData.name || 'Unknown Club',
                after.leagueId || after.clubId,
                'Runner-up',
                2,
                transaction
              );
              runnerUpPlayerId = runnerUpId;
            }
          }

          console.log('✅ [OLYMPUS] Trophies awarded successfully from rankings data!');

          // 🏅 [PROJECT OLYMPUS] Award League Champion badge to winner (from rankings)
          if (winnerPlayerId) {
            // Handle doubles teams (ID contains '_')
            const winnerIds = winnerPlayerId.includes('_')
              ? winnerPlayerId.split('_')
              : [winnerPlayerId];

            for (const playerId of winnerIds) {
              try {
                const championBadges = await checkLeagueChampionBadge(
                  playerId,
                  leagueId,
                  after.clubId,
                  clubData.name || 'Unknown Club'
                );
                if (championBadges.length > 0) {
                  console.log(
                    `👑 [OLYMPUS] Awarded League Champion badge to ${playerId}:`,
                    championBadges
                  );
                }
              } catch (error) {
                console.error(
                  `❌ [OLYMPUS] Failed to award League Champion badge to ${playerId}:`,
                  error
                );
              }
            }
          }
        } else {
          console.log(
            '⚠️ [OLYMPUS] No champion, runnerUp, or rankings data found - skipping trophy awards'
          );
        }

        // 🏅 PROJECT OLYMPUS: Check and award badges to all participants
        console.log('🏅 [OLYMPUS] Checking league badges for all participants...');

        // Collect all unique player IDs from rankings
        const allPlayerIds = new Set();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rankings.forEach((r: any) => {
          if (r.playerId) {
            allPlayerIds.add(r.playerId);
          }
        });

        console.log(
          `📋 [OLYMPUS] Found ${allPlayerIds.size} unique participants to check badges for`
        );

        // Check and award badges for each participant
        for (const playerId of allPlayerIds) {
          try {
            const awardedBadges = await checkAndAwardLeagueBadges(
              playerId as string,
              leagueId,
              after.name || after.leagueName || after.title || 'Unknown League',
              after.clubId,
              clubData.name || 'Unknown Club',
              transaction
            );

            if (awardedBadges.length > 0) {
              console.log(
                `🎖️ [OLYMPUS] Awarded ${awardedBadges.length} badge(s) to player ${playerId}:`,
                awardedBadges
              );
            }
          } catch (error) {
            console.error(`❌ [OLYMPUS] Failed to check badges for player ${playerId}:`, error);
            // Continue to next player even if badge check fails
          }
        }

        console.log('✅ [OLYMPUS] Badge checking completed for all participants!');

        // Store awarded badges for notification (outside transaction)
        // We'll collect badge data during the loop above

        // Return player IDs and clubName for notification (to be sent outside transaction)
        return {
          winnerPlayerId,
          runnerUpPlayerId,
          allPlayerIds,
          clubName: clubData.name || 'Unknown Club',
        };
      });

      console.log('✅ [HERALD] Victory proclaimed! Club home screen updated with champion:', {
        champion: winnerData.championName,
        league: winnerData.leagueName,
        clubId: after.clubId,
      });

      // 📢 FEED SYSTEM: Create feed items for winner and runner-up
      console.log('📰 [FEED] Creating league completion feed items...');

      // Reuse existing variables from transactionResult
      const feedWinnerPlayerId = transactionResult?.winnerPlayerId;
      const feedRunnerUpPlayerId = transactionResult?.runnerUpPlayerId;
      const feedClubName = transactionResult?.clubName;
      const feedLeagueName = after.name || after.leagueName || after.title || 'Unknown League';

      // Get club members for visibleTo
      const membersSnapshot = await db
        .collection('clubMembers')
        .where('clubId', '==', after.clubId)
        .where('status', '==', 'active')
        .get();

      const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

      // Create feed item for Winner
      if (feedWinnerPlayerId && after.champion) {
        try {
          const winnerFeedRef = await db.collection('feed').add({
            type: 'league_completed',
            actorId: feedWinnerPlayerId,
            actorName: after.champion.playerName,
            clubId: after.clubId,
            clubName: feedClubName,
            eventId: leagueId,
            metadata: {
              leagueName: feedLeagueName,
              placement: 'winner', // Used to select correct template (winner vs runner_up)
              rank: 1,
            },
            visibility: 'club_members',
            visibleTo: memberIds,
            isActive: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`✅ [FEED] Winner feed item created: ${winnerFeedRef.id}`);
        } catch (error) {
          console.error('❌ [FEED] Failed to create winner feed item:', error);
        }
      }

      // Create feed item for Runner-up
      if (feedRunnerUpPlayerId && after.runnerUp) {
        try {
          const runnerUpFeedRef = await db.collection('feed').add({
            type: 'league_completed',
            actorId: feedRunnerUpPlayerId,
            actorName: after.runnerUp.playerName,
            clubId: after.clubId,
            clubName: feedClubName,
            eventId: leagueId,
            metadata: {
              leagueName: feedLeagueName,
              placement: 'runner_up', // Used to select correct template (winner vs runner_up)
              rank: 2,
            },
            visibility: 'club_members',
            visibleTo: memberIds,
            isActive: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`✅ [FEED] Runner-up feed item created: ${runnerUpFeedRef.id}`);
        } catch (error) {
          console.error('❌ [FEED] Failed to create runner-up feed item:', error);
        }
      }

      console.log('✅ [FEED] League completion feed items created successfully!');

      // 📲 PROJECT OLYMPUS: Send push notifications AFTER transaction completes
      console.log('📲 [OLYMPUS] Sending trophy and badge notifications...');

      const leagueName = after.name || after.leagueName || after.title || 'Unknown League';
      const { winnerPlayerId, runnerUpPlayerId, clubName } = transactionResult || {};

      // Send Winner trophy notification
      if (winnerPlayerId) {
        try {
          await sendTrophyNotification(winnerPlayerId, {
            rank: 'Winner',
            tournamentName: leagueName, // Use tournamentName field for compatibility
            tournamentId: leagueId, // Use tournamentId field for compatibility
            clubName: clubName,
            clubId: after.clubId,
          });
          console.log(`✅ [OLYMPUS] Winner trophy notification sent to ${winnerPlayerId}`);
        } catch (error) {
          console.error(`❌ [OLYMPUS] Failed to send winner trophy notification:`, error);
        }
      }

      // Send Runner-up trophy notification
      if (runnerUpPlayerId) {
        try {
          await sendTrophyNotification(runnerUpPlayerId, {
            rank: 'Runner-up',
            tournamentName: leagueName, // Use tournamentName field for compatibility
            tournamentId: leagueId, // Use tournamentId field for compatibility
            clubName: clubName,
            clubId: after.clubId,
          });
          console.log(`✅ [OLYMPUS] Runner-up trophy notification sent to ${runnerUpPlayerId}`);
        } catch (error) {
          console.error(`❌ [OLYMPUS] Failed to send runner-up trophy notification:`, error);
        }
      }

      // Send badge notifications to all participants who received new badges
      // Note: Badge notification logic is handled within checkAndAwardLeagueBadges
      // We need to modify that function to return awarded badges, then send notifications here
      // For now, we'll query newly awarded badges and send notifications

      const rankings = after.rankings || [];
      for (const ranking of rankings) {
        if (!ranking.playerId) continue;

        try {
          // Query badges awarded in this league (recent badges with matching leagueId)
          const db = admin.firestore();
          const recentBadgesSnapshot = await db
            .collection(`users/${ranking.playerId}/badges`)
            .where('leagueId', '==', leagueId)
            .get();

          for (const badgeDoc of recentBadgesSnapshot.docs) {
            const badgeData = badgeDoc.data();

            // Send badge notification
            try {
              await sendBadgeNotification(ranking.playerId, {
                name: badgeData.name,
                nameKo: badgeData.nameKo,
                tier: badgeData.tier,
                tournamentName: leagueName, // Use tournamentName field for compatibility
                tournamentId: leagueId, // Use tournamentId field for compatibility
                clubName: clubName,
                clubId: after.clubId,
              });
              console.log(
                `✅ [OLYMPUS] Badge notification sent to ${ranking.playerId}: ${badgeData.name}`
              );
            } catch (error) {
              console.error(`❌ [OLYMPUS] Failed to send badge notification:`, error);
            }
          }
        } catch (error) {
          console.error(
            `❌ [OLYMPUS] Failed to query badges for player ${ranking.playerId}:`,
            error
          );
        }
      }

      console.log('✅ [OLYMPUS] All trophy and badge notifications processed!');

      return { success: true, championName: winnerData.championName };
    } catch (error) {
      console.error('❌ [HERALD] Failed to proclaim victory:', error);
      throw error;
    }
  } else {
    console.log('ℹ️ [HERALD] No action needed. Conditions not met:', {
      statusChanged: before?.status !== 'completed' && after?.status === 'completed',
      hasChampion: !!after.champion,
      hasClubId: !!after.clubId,
    });
    return { success: false, reason: 'Conditions not met' };
  }
});
