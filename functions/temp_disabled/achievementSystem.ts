/**
 * Achievement System Cloud Function
 * Checks user activities and awards badges for milestones
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getAllAchievements, Achievement } from './constants/achievements';

const db = admin.firestore();

// Import achievements from constants
const ACHIEVEMENTS: Achievement[] = getAllAchievements();

// Interface for unlocked achievement data from Firestore
interface UnlockedAchievement {
  id: string;
  achievementId: string;
  userId: string;
  unlockedAt: admin.firestore.Timestamp;
  points: number;
  category: string;
  tier: string;
  progress: number;
}

// Helper function to check if achievement condition is met
function checkAchievementCondition(
  achievement: Achievement,
  userData: Record<string, unknown>
): boolean {
  const { type, value } = achievement.condition;

  switch (type) {
    case 'wins':
      return userData.wins >= value;
    case 'tournamentWins':
      return userData.tournamentWins >= value;
    case 'tournamentFinals':
      return userData.tournamentFinals >= value;
    case 'clubsJoined':
      return userData.memberships?.length >= value;
    case 'matchesPlayed':
      return userData.matchesPlayed >= value;
    case 'clubEventsAttended':
      return userData.clubEventsAttended >= value;
    case 'eventsOrganized':
      return userData.eventsOrganized >= value;
    case 'friendsCount':
      return userData.friends?.length >= value;
    case 'currentWinStreak':
      return userData.currentWinStreak >= value;
    case 'joinDate':
      return userData.createdAt && new Date(userData.createdAt).getTime() <= value;
    case 'winRate': {
      const winRate =
        (userData.wins as number) / ((userData.wins as number) + (userData.losses as number));
      return winRate >= value;
    }
    case 'upsetWins':
      return userData.upsetWins >= value;
    case 'bagelWins':
      return userData.bagelWins >= value;
    case 'perfectMatches':
      return userData.perfectMatches >= value;
    default:
      return false;
  }
}

// Helper function to award achievement
async function awardAchievement(userId: string, achievement: Achievement): Promise<void> {
  const achievementRef = db.collection('user_achievements').doc();
  const achievementData: UnlockedAchievement = {
    id: achievementRef.id,
    achievementId: achievement.id,
    userId,
    unlockedAt: admin.firestore.Timestamp.now(),
    points: achievement.points,
    category: achievement.category,
    tier: achievement.tier,
    progress: 100,
  };

  await achievementRef.set(achievementData as Record<string, unknown>);

  // Update user's total achievement points
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    achievementPoints: admin.firestore.FieldValue.increment(achievement.points),
  });

  console.log(`🏆 Achievement unlocked for user ${userId}: ${achievement.name}`);

  // Send push notification about achievement
  try {
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (userData && userData.fcmToken) {
      const message = {
        token: userData.fcmToken as string,
        notification: {
          title: userData.preferredLanguage === 'ko' ? '업적 달성!' : 'Achievement Unlocked!',
          body: userData.preferredLanguage === 'ko' ? achievement.nameKo : achievement.name,
        },
        data: {
          type: 'achievement',
          achievementId: achievement.id,
          points: achievement.points.toString(),
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'achievements',
            sound: 'default',
            priority: 'high' as const,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`📱 Achievement notification sent to user ${userId}`);
    }
  } catch (notificationError) {
    console.warn('Failed to send achievement notification:', notificationError);
  }
}

/**
 * Main achievement checking function - triggered when user stats are updated
 */
export const checkAchievements = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const userId = context.params.userId;
      const beforeData = change.before.data();
      const afterData = change.after.data();

      // Skip if no meaningful changes
      if (!afterData || JSON.stringify(beforeData) === JSON.stringify(afterData)) {
        return;
      }

      console.log(`🔍 Checking achievements for user: ${userId}`);

      // Get already unlocked achievements
      const unlockedSnapshot = await db
        .collection('user_achievements')
        .where('userId', '==', userId)
        .get();

      const unlockedAchievementIds = new Set(
        unlockedSnapshot.docs.map(doc => doc.data().achievementId)
      );

      // Check each achievement
      const newAchievements: Achievement[] = [];

      for (const achievement of ACHIEVEMENTS) {
        // Skip if already unlocked
        if (unlockedAchievementIds.has(achievement.id)) {
          continue;
        }

        // Skip hidden achievements unless condition is met
        if (achievement.hidden && !checkAchievementCondition(achievement, afterData)) {
          continue;
        }

        // Check if condition is met
        if (checkAchievementCondition(achievement, afterData)) {
          newAchievements.push(achievement);
        }
      }

      // Award new achievements
      for (const achievement of newAchievements) {
        await awardAchievement(userId, achievement);
      }

      if (newAchievements.length > 0) {
        console.log(`🎉 Awarded ${newAchievements.length} new achievements to user ${userId}`);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  });

/**
 * Get all available achievements
 */
export const getAchievements = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    return {
      achievements: ACHIEVEMENTS.filter(a => !a.hidden),
      total: ACHIEVEMENTS.length,
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get achievements');
  }
});

/**
 * Get user's achievement progress
 */
export const getUserAchievementProgress = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    // Get unlocked achievements
    const unlockedSnapshot = await db
      .collection('user_achievements')
      .where('userId', '==', userId)
      .get();

    const unlockedAchievements = unlockedSnapshot.docs.map(doc => doc.data());

    // Get user data for progress calculation
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};

    // Calculate progress for each achievement
    const achievementProgress = ACHIEVEMENTS.map(achievement => {
      const unlocked = unlockedAchievements.find(ua => ua.achievementId === achievement.id);

      if (unlocked) {
        return {
          ...achievement,
          unlocked: true,
          unlockedAt: unlocked.unlockedAt,
          progress: 100,
        };
      }

      // Calculate progress percentage
      let progress = 0;
      const { type, value } = achievement.condition;

      switch (type) {
        case 'wins':
          progress = Math.min(100, ((Number(userData.wins) || 0) / value) * 100);
          break;
        case 'matchesPlayed':
          progress = Math.min(100, ((Number(userData.matchesPlayed) || 0) / value) * 100);
          break;
        case 'friendsCount':
          progress = Math.min(100, ((Number(userData.friends?.length) || 0) / value) * 100);
          break;
        // Add more cases as needed
        default:
          progress = checkAchievementCondition(achievement, userData) ? 100 : 0;
      }

      return {
        ...achievement,
        unlocked: false,
        progress: Math.round(progress),
      };
    });

    return {
      achievements: achievementProgress,
      totalPoints: unlockedAchievements.reduce((sum, ua) => sum + (Number(ua.points) || 0), 0),
      unlockedCount: unlockedAchievements.length,
      totalCount: ACHIEVEMENTS.length,
    };
  } catch (error) {
    console.error('Error getting user achievement progress:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get achievement progress');
  }
});
