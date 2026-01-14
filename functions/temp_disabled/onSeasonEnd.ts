/**
 * Cloud Function to award seasonal trophies based on performance
 * Triggered at the end of each season to analyze player statistics
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Helper function to get current season
 */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) return `Spring ${year}`;
  if (month >= 6 && month <= 8) return `Summer ${year}`;
  if (month >= 9 && month <= 11) return `Fall ${year}`;
  return `Winter ${year}`;
}

/**
 * Awards seasonal trophies based on ELO performance, participation, and win rates
 * Triggered manually or via scheduled function at season end
 */
export const onSeasonEnd = functions.https.onCall(
  async (data: { seasonId?: string; forceRun?: boolean }, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { seasonId } = data;
      console.log(`🏆 Processing seasonal trophies for season: ${seasonId}`);

      // Get all users with their unified stats
      const usersSnapshot = await db.collection('users').where('stats.matchesPlayed', '>', 0).get();

      const seasonTrophies: Record<string, unknown>[] = [];
      const batch = db.batch();
      const currentSeason = getCurrentSeason();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const stats = userData.stats || {};

        // Skip users with insufficient activity
        if ((stats.matchesPlayed || 0) < 5) continue;

        const trophiesToAward = [];

        // 1. ELO Ranking Trophies (Top percentiles)
        const eloRating = stats.unifiedEloRating || 1200;
        if (eloRating >= 1800) {
          trophiesToAward.push({
            type: 'rank-up',
            name: 'Elite Player',
            description: 'Achieved Elite ELO ranking (1800+)',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'crown',
              color: '#E5E4E2',
              tier: 'platinum',
              season: currentSeason,
            },
            tier: 'platinum',
            points: 2000,
          });
        } else if (eloRating >= 1600) {
          trophiesToAward.push({
            type: 'rank-up',
            name: 'Advanced Player',
            description: 'Achieved Advanced ELO ranking (1600+)',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'medal',
              color: '#FFD700',
              tier: 'gold',
              season: currentSeason,
            },
            tier: 'gold',
            points: 1000,
          });
        } else if (eloRating >= 1400) {
          trophiesToAward.push({
            type: 'rank-up',
            name: 'Intermediate Player',
            description: 'Achieved Intermediate ELO ranking (1400+)',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'trophy-variant',
              color: '#C0C0C0',
              tier: 'silver',
              season: currentSeason,
            },
            tier: 'silver',
            points: 500,
          });
        }

        // 2. Win Rate Trophies
        const winRate = stats.winRate || 0;
        if (winRate >= 0.8 && stats.matchesPlayed >= 10) {
          trophiesToAward.push({
            type: 'win-rate',
            name: 'Domination Master',
            description: 'Maintained 80%+ win rate with 10+ matches',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'fire-circle',
              color: '#FF5722',
              tier: 'gold',
              season: currentSeason,
            },
            tier: 'gold',
            points: 1200,
          });
        } else if (winRate >= 0.7 && stats.matchesPlayed >= 15) {
          trophiesToAward.push({
            type: 'win-rate',
            name: 'Consistent Winner',
            description: 'Maintained 70%+ win rate with 15+ matches',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'target',
              color: '#4CAF50',
              tier: 'silver',
              season: currentSeason,
            },
            tier: 'silver',
            points: 600,
          });
        }

        // 3. Participation Trophies
        const matchesPlayed = stats.matchesPlayed || 0;
        if (matchesPlayed >= 50) {
          trophiesToAward.push({
            type: 'participation',
            name: 'Tennis Enthusiast',
            description: 'Played 50+ matches this season',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'tennis-ball',
              color: '#8BC34A',
              tier: 'gold',
              season: currentSeason,
            },
            tier: 'gold',
            points: 800,
          });
        } else if (matchesPlayed >= 25) {
          trophiesToAward.push({
            type: 'participation',
            name: 'Active Player',
            description: 'Played 25+ matches this season',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'tennis',
              color: '#FFC107',
              tier: 'silver',
              season: currentSeason,
            },
            tier: 'silver',
            points: 400,
          });
        } else if (matchesPlayed >= 10) {
          trophiesToAward.push({
            type: 'participation',
            name: 'Participant',
            description: 'Played 10+ matches this season',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'racquetball',
              color: '#CD7F32',
              tier: 'bronze',
              season: currentSeason,
            },
            tier: 'bronze',
            points: 200,
          });
        }

        // Award each trophy
        for (const trophy of trophiesToAward) {
          const trophyId = `season_${seasonId}_${trophy.type}_${userId}`;
          const trophyRef = db.collection('users').doc(userId).collection('trophies').doc(trophyId);

          const trophyData = {
            id: trophyId,
            ...trophy,
            seasonId: seasonId,
            awardedAt: admin.firestore.FieldValue.serverTimestamp(),
            context: 'global',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          batch.set(trophyRef, trophyData);
          seasonTrophies.push({ userId, trophy: trophyData });
        }

        // Update user season stats
        if (trophiesToAward.length > 0) {
          const userRef = db.collection('users').doc(userId);
          batch.update(userRef, {
            'stats.seasonalTrophies': admin.firestore.FieldValue.increment(trophiesToAward.length),
            'stats.lastSeasonTrophyAt': admin.firestore.FieldValue.serverTimestamp(),
            'stats.totalSeasonalPoints': admin.firestore.FieldValue.increment(
              trophiesToAward.reduce((sum, t) => sum + t.points, 0)
            ),
          });
        }
      }

      // Commit all trophy awards
      await batch.commit();

      // Create announcement feed items for notable achievements
      const platinumTrophies = seasonTrophies.filter(t => t.trophy.tier === 'platinum');
      for (const { userId, trophy } of platinumTrophies) {
        try {
          await db.collection('feed').add({
            type: 'seasonal_trophy_awarded',
            userId: userId,
            text: `🏆 ${trophy.name} 트로피가 수여되었습니다! ${currentSeason} 시즌의 뛰어난 성과를 축하합니다!`,
            content: {
              title: '시즌 트로피 수여',
              body: `${trophy.description}`,
            },
            metadata: {
              trophyType: trophy.type,
              trophyName: trophy.name,
              season: currentSeason,
              tier: trophy.tier,
              points: trophy.points,
            },
            visibility: 'public',
            likes: [],
            comments: [],
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (error) {
          console.error('Error creating feed item:', error);
        }
      }

      console.log(`✅ Seasonal trophies awarded successfully. Total: ${seasonTrophies.length}`);

      return {
        success: true,
        message: `Awarded ${seasonTrophies.length} seasonal trophies`,
        trophies: seasonTrophies.map(t => ({
          userId: t.userId,
          trophyType: t.trophy.type,
          tier: t.trophy.tier,
          points: t.trophy.points,
        })),
      };
    } catch (error) {
      console.error('❌ Error in onSeasonEnd:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process seasonal trophies');
    }
  }
);

/**
 * Scheduled function to automatically run at end of each season
 * Runs on the last day of each quarter
 */
export const scheduledSeasonEnd = functions.pubsub
  .schedule('0 23 31 3,6,9,12 *') // Last day of each quarter at 11 PM
  .timeZone('America/New_York')
  .onRun(async () => {
    try {
      const currentDate = new Date();
      const seasonId = `${currentDate.getFullYear()}_Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`;

      console.log(`🔄 Automatically processing seasonal trophies for ${seasonId}`);

      // Call the main function
      await onSeasonEnd.call(null, { seasonId, forceRun: true }, { auth: { uid: 'system' } });

      return null;
    } catch (error) {
      console.error('❌ Error in scheduled season end:', error);
      return null;
    }
  });
