/**
 * 🦋 Social Badge Checker
 *
 * Awards badges based on social activities:
 * - Social Butterfly (친구 수: 5, 15, 50명)
 *
 * @author Kim (Badge System Phase)
 * @date 2025-12-30
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// ==================== BADGE DEFINITIONS ====================

export const SOCIAL_BADGES = {
  // === SOCIAL BUTTERFLY (사교적인 나비) ===
  SOCIAL_BUTTERFLY_BRONZE: {
    id: 'social_butterfly_bronze',
    achievementId: 'social_butterfly',
    name: 'Social Butterfly (5)',
    nameKo: '사교적인 나비 (5명)',
    description: 'Make 5 friends in the tennis community',
    descriptionKo: '테니스 커뮤니티에서 5명의 친구를 만드세요',
    icon: '🦋',
    tier: 'bronze' as const,
    category: 'social',
    condition: { type: 'friendsCount', value: 5 },
    points: 150,
  },
  SOCIAL_BUTTERFLY_SILVER: {
    id: 'social_butterfly_silver',
    achievementId: 'social_butterfly',
    name: 'Social Butterfly (15)',
    nameKo: '사교적인 나비 (15명)',
    description: 'Make 15 friends in the tennis community',
    descriptionKo: '테니스 커뮤니티에서 15명의 친구를 만드세요',
    icon: '🦋',
    tier: 'silver' as const,
    category: 'social',
    condition: { type: 'friendsCount', value: 15 },
    points: 300,
  },
  SOCIAL_BUTTERFLY_GOLD: {
    id: 'social_butterfly_gold',
    achievementId: 'social_butterfly',
    name: 'Social Butterfly (50)',
    nameKo: '사교적인 나비 (50명)',
    description: 'Make 50 friends in the tennis community',
    descriptionKo: '테니스 커뮤니티에서 50명의 친구를 만드세요',
    icon: '🦋',
    tier: 'gold' as const,
    category: 'social',
    condition: { type: 'friendsCount', value: 50 },
    points: 750,
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if user already has a specific badge
 */
async function hasBadge(userId: string, badgeId: string): Promise<boolean> {
  const badgeRef = db.doc(`users/${userId}/badges/${badgeId}`);
  const badgeDoc = await badgeRef.get();
  return badgeDoc.exists;
}

/**
 * Award a badge to user
 */
async function awardBadge(
  userId: string,
  badge: (typeof SOCIAL_BADGES)[keyof typeof SOCIAL_BADGES]
): Promise<boolean> {
  const badgeRef = db.doc(`users/${userId}/badges/${badge.id}`);

  // Check if already has badge
  if (await hasBadge(userId, badge.id)) {
    console.log(`ℹ️ [BADGE] User ${userId} already has badge: ${badge.id}`);
    return false;
  }

  const badgeData = {
    id: badge.id,
    achievementId: badge.achievementId,
    name: badge.name,
    nameKo: badge.nameKo,
    description: badge.description,
    descriptionKo: badge.descriptionKo,
    icon: badge.icon,
    tier: badge.tier,
    category: badge.category,
    points: badge.points,
    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await badgeRef.set(badgeData);
  console.log(`🏅 [BADGE] Awarded badge "${badge.nameKo}" to user ${userId}`);

  return true;
}

// ==================== MAIN CHECK FUNCTIONS ====================

/**
 * Get friend count for a user
 */
export async function getFriendCount(userId: string): Promise<number> {
  try {
    const friendsSnapshot = await db
      .collection(`users/${userId}/friends`)
      .where('status', '==', 'accepted')
      .get();

    return friendsSnapshot.size;
  } catch (error) {
    console.error(`❌ [BADGE] Error getting friend count:`, error);
    return 0;
  }
}

/**
 * Check and award social butterfly badges
 * Called when a friend request is accepted
 */
export async function checkSocialButterflyBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(`🦋 [BADGE] Checking social butterfly badges for user ${userId}`);

  try {
    const friendCount = await getFriendCount(userId);
    console.log(`🦋 [BADGE] User ${userId} has ${friendCount} friends`);

    if (friendCount >= 5) {
      if (await awardBadge(userId, SOCIAL_BADGES.SOCIAL_BUTTERFLY_BRONZE)) {
        awardedBadges.push(SOCIAL_BADGES.SOCIAL_BUTTERFLY_BRONZE.id);
      }
    }

    if (friendCount >= 15) {
      if (await awardBadge(userId, SOCIAL_BADGES.SOCIAL_BUTTERFLY_SILVER)) {
        awardedBadges.push(SOCIAL_BADGES.SOCIAL_BUTTERFLY_SILVER.id);
      }
    }

    if (friendCount >= 50) {
      if (await awardBadge(userId, SOCIAL_BADGES.SOCIAL_BUTTERFLY_GOLD)) {
        awardedBadges.push(SOCIAL_BADGES.SOCIAL_BUTTERFLY_GOLD.id);
      }
    }

    if (awardedBadges.length > 0) {
      console.log(
        `✅ [BADGE] Awarded ${awardedBadges.length} social butterfly badge(s) to user ${userId}`
      );
    }
  } catch (error) {
    console.error(`❌ [BADGE] Error checking social butterfly badges:`, error);
  }

  return awardedBadges;
}

export default {
  SOCIAL_BADGES,
  getFriendCount,
  checkSocialButterflyBadges,
};
