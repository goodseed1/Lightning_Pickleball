/**
 * 🌟 Miscellaneous Badge Checker
 *
 * Awards special/hidden badges:
 * - Early Adopter (얼리 어답터 - 초기 가입자)
 *
 * @author Kim (Badge System Phase)
 * @date 2025-12-30
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// Early adopter cutoff date (Jan 1, 2025)
// Users who joined before this date get the early adopter badge
const EARLY_ADOPTER_CUTOFF = new Date('2025-01-01T00:00:00Z').getTime();

// ==================== BADGE DEFINITIONS ====================

export const MISC_BADGES = {
  // === EARLY ADOPTER (얼리 어답터) ===
  EARLY_ADOPTER_PLATINUM: {
    id: 'early_adopter_platinum',
    achievementId: 'early_adopter',
    name: 'Early Adopter',
    nameKo: '얼리 어답터',
    description: 'Joined Lightning Pickleball in its early days',
    descriptionKo: '번개 피클볼 초기에 가입하셨습니다',
    icon: '⚡',
    tier: 'platinum' as const,
    category: 'special',
    condition: { type: 'joinDate', value: EARLY_ADOPTER_CUTOFF },
    points: 1500,
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
  badge: (typeof MISC_BADGES)[keyof typeof MISC_BADGES]
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
 * Get user's join date
 */
export async function getUserJoinDate(userId: string): Promise<Date | null> {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data()!;
    const createdAt = userData.createdAt;

    if (createdAt && createdAt.toDate) {
      return createdAt.toDate();
    }

    // Fallback to timestamp if it's a number
    if (typeof createdAt === 'number') {
      return new Date(createdAt);
    }

    return null;
  } catch (error) {
    console.error(`❌ [BADGE] Error getting user join date:`, error);
    return null;
  }
}

/**
 * Check and award early adopter badge
 * Called when user account is created or on first login
 */
export async function checkEarlyAdopterBadge(userId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(`⚡ [BADGE] Checking early adopter badge for user ${userId}`);

  try {
    const joinDate = await getUserJoinDate(userId);

    if (!joinDate) {
      console.log(`ℹ️ [BADGE] Could not get join date for user ${userId}`);
      return awardedBadges;
    }

    const joinTimestamp = joinDate.getTime();
    console.log(`⚡ [BADGE] User ${userId} joined on ${joinDate.toISOString()}`);

    // Check if joined before cutoff date
    if (joinTimestamp < EARLY_ADOPTER_CUTOFF) {
      if (await awardBadge(userId, MISC_BADGES.EARLY_ADOPTER_PLATINUM)) {
        awardedBadges.push(MISC_BADGES.EARLY_ADOPTER_PLATINUM.id);
        console.log(`✅ [BADGE] Awarded early adopter badge to user ${userId}`);
      }
    } else {
      console.log(`ℹ️ [BADGE] User ${userId} joined after early adopter cutoff`);
    }
  } catch (error) {
    console.error(`❌ [BADGE] Error checking early adopter badge:`, error);
  }

  return awardedBadges;
}

/**
 * Batch check early adopter badges for all users
 * This can be run as a one-time migration
 */
export async function batchCheckEarlyAdopterBadges(): Promise<{
  total: number;
  awarded: number;
  errors: number;
}> {
  console.log(`⚡ [BADGE] Starting batch early adopter badge check...`);

  let total = 0;
  let awarded = 0;
  let errors = 0;

  try {
    const usersSnapshot = await db.collection('users').get();
    total = usersSnapshot.size;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const badges = await checkEarlyAdopterBadge(userDoc.id);
        if (badges.length > 0) {
          awarded++;
        }
      } catch (error) {
        console.error(`❌ [BADGE] Error checking user ${userDoc.id}:`, error);
        errors++;
      }
    }

    console.log(
      `✅ [BADGE] Batch check complete: ${total} users, ${awarded} badges awarded, ${errors} errors`
    );
  } catch (error) {
    console.error(`❌ [BADGE] Error in batch check:`, error);
  }

  return { total, awarded, errors };
}

export default {
  MISC_BADGES,
  EARLY_ADOPTER_CUTOFF,
  getUserJoinDate,
  checkEarlyAdopterBadge,
  batchCheckEarlyAdopterBadges,
};
