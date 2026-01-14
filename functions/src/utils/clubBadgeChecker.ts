/**
 * 🏠 Club Badge Checker
 *
 * Awards badges based on club activities:
 * - Community Pioneer (클럽 가입: 1, 3개 + 이벤트 참석: 25회)
 * - Lightning Host (번개 매치/모임 주최: 5, 15, 50회)
 *
 * @author Kim (Badge System Phase)
 * @date 2025-12-30
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// ==================== BADGE DEFINITIONS ====================

export const CLUB_BADGES = {
  // === COMMUNITY PIONEER (커뮤니티 개척자) ===
  COMMUNITY_PIONEER_BRONZE: {
    id: 'community_pioneer_bronze',
    achievementId: 'community_pioneer',
    name: 'Community Pioneer (1 Club)',
    nameKo: '커뮤니티 개척자 (1개 클럽)',
    description: 'Join your first tennis club',
    descriptionKo: '첫 번째 테니스 클럽에 가입하세요',
    icon: '🏠',
    tier: 'bronze' as const,
    category: 'clubs',
    condition: { type: 'clubsJoined', value: 1 },
    points: 100,
  },
  COMMUNITY_PIONEER_SILVER: {
    id: 'community_pioneer_silver',
    achievementId: 'community_pioneer',
    name: 'Community Pioneer (3 Clubs)',
    nameKo: '커뮤니티 개척자 (3개 클럽)',
    description: 'Join 3 tennis clubs',
    descriptionKo: '3개의 테니스 클럽에 가입하세요',
    icon: '🏠',
    tier: 'silver' as const,
    category: 'clubs',
    condition: { type: 'clubsJoined', value: 3 },
    points: 250,
  },
  COMMUNITY_PIONEER_GOLD: {
    id: 'community_pioneer_gold',
    achievementId: 'community_pioneer',
    name: 'Community Pioneer (25 Events)',
    nameKo: '커뮤니티 개척자 (25회 참석)',
    description: 'Attend 25 club events',
    descriptionKo: '클럽 이벤트에 25번 참석하세요',
    icon: '🏠',
    tier: 'gold' as const,
    category: 'clubs',
    condition: { type: 'clubEventsAttended', value: 25 },
    points: 600,
  },

  // === LIGHTNING HOST (번개 호스트) ===
  LIGHTNING_HOST_SILVER: {
    id: 'lightning_host_silver',
    achievementId: 'lightning_host',
    name: 'Lightning Host (5)',
    nameKo: '번개 호스트 (5회)',
    description: 'Host 5 lightning matches or gatherings',
    descriptionKo: '번개 매치나 모임을 5번 주최하세요',
    icon: '⚡',
    tier: 'silver' as const,
    category: 'clubs',
    condition: { type: 'lightningMatchesHosted', value: 5 },
    points: 500,
  },
  LIGHTNING_HOST_GOLD: {
    id: 'lightning_host_gold',
    achievementId: 'lightning_host',
    name: 'Lightning Host (15)',
    nameKo: '번개 호스트 (15회)',
    description: 'Host 15 lightning matches or gatherings',
    descriptionKo: '번개 매치나 모임을 15번 주최하세요',
    icon: '⚡',
    tier: 'gold' as const,
    category: 'clubs',
    condition: { type: 'lightningMatchesHosted', value: 15 },
    points: 1000,
  },
  LIGHTNING_HOST_PLATINUM: {
    id: 'lightning_host_platinum',
    achievementId: 'lightning_host',
    name: 'Lightning Host (50)',
    nameKo: '번개 호스트 (50회)',
    description: 'Host 50 lightning matches or gatherings',
    descriptionKo: '번개 매치나 모임을 50번 주최하세요',
    icon: '⚡',
    tier: 'platinum' as const,
    category: 'clubs',
    condition: { type: 'lightningMatchesHosted', value: 50 },
    points: 2500,
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
  badge: (typeof CLUB_BADGES)[keyof typeof CLUB_BADGES],
  context?: {
    clubId?: string;
    clubName?: string;
  }
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
    ...(context?.clubId && { clubId: context.clubId }),
    ...(context?.clubName && { clubName: context.clubName }),
  };

  await badgeRef.set(badgeData);
  console.log(`🏅 [BADGE] Awarded badge "${badge.nameKo}" to user ${userId}`);

  return true;
}

// ==================== MAIN CHECK FUNCTIONS ====================

/**
 * Get club membership count for a user
 */
export async function getClubMembershipCount(userId: string): Promise<number> {
  try {
    // Get all club memberships where user is a member
    const membershipSnapshot = await db
      .collectionGroup('members')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    return membershipSnapshot.size;
  } catch (error) {
    console.error(`❌ [BADGE] Error getting club membership count:`, error);
    return 0;
  }
}

/**
 * Get club events attended count for a user
 */
export async function getClubEventsAttendedCount(userId: string): Promise<number> {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return 0;

    const userData = userDoc.data()!;
    return userData.stats?.clubEventsAttended || 0;
  } catch (error) {
    console.error(`❌ [BADGE] Error getting club events attended count:`, error);
    return 0;
  }
}

/**
 * Get lightning matches hosted count for a user
 */
export async function getLightningMatchesHostedCount(userId: string): Promise<number> {
  try {
    // Count events where user is the host
    const eventsSnapshot = await db
      .collection('events')
      .where('hostId', '==', userId)
      .where('status', 'in', ['completed', 'in_progress'])
      .get();

    return eventsSnapshot.size;
  } catch (error) {
    console.error(`❌ [BADGE] Error getting lightning matches hosted count:`, error);
    return 0;
  }
}

/**
 * Check and award community pioneer badges
 * Called when user joins a club or attends an event
 */
export async function checkCommunityPioneerBadges(
  userId: string,
  clubId?: string,
  clubName?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(`🏠 [BADGE] Checking community pioneer badges for user ${userId}`);

  try {
    const clubCount = await getClubMembershipCount(userId);
    const eventsAttended = await getClubEventsAttendedCount(userId);

    console.log(
      `🏠 [BADGE] User ${userId} has ${clubCount} clubs and ${eventsAttended} events attended`
    );

    // Check club joining badges
    if (clubCount >= 1) {
      if (await awardBadge(userId, CLUB_BADGES.COMMUNITY_PIONEER_BRONZE, { clubId, clubName })) {
        awardedBadges.push(CLUB_BADGES.COMMUNITY_PIONEER_BRONZE.id);
      }
    }

    if (clubCount >= 3) {
      if (await awardBadge(userId, CLUB_BADGES.COMMUNITY_PIONEER_SILVER, { clubId, clubName })) {
        awardedBadges.push(CLUB_BADGES.COMMUNITY_PIONEER_SILVER.id);
      }
    }

    // Check events attended badge
    if (eventsAttended >= 25) {
      if (await awardBadge(userId, CLUB_BADGES.COMMUNITY_PIONEER_GOLD, { clubId, clubName })) {
        awardedBadges.push(CLUB_BADGES.COMMUNITY_PIONEER_GOLD.id);
      }
    }

    if (awardedBadges.length > 0) {
      console.log(
        `✅ [BADGE] Awarded ${awardedBadges.length} community pioneer badge(s) to user ${userId}`
      );
    }
  } catch (error) {
    console.error(`❌ [BADGE] Error checking community pioneer badges:`, error);
  }

  return awardedBadges;
}

/**
 * Check and award lightning host badges
 * Called when user hosts a lightning match or gathering
 */
export async function checkLightningHostBadges(
  userId: string,
  clubId?: string,
  clubName?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(`⚡ [BADGE] Checking lightning host badges for user ${userId}`);

  try {
    const lightningMatchesHosted = await getLightningMatchesHostedCount(userId);

    console.log(`⚡ [BADGE] User ${userId} has hosted ${lightningMatchesHosted} lightning matches`);

    if (lightningMatchesHosted >= 5) {
      if (await awardBadge(userId, CLUB_BADGES.LIGHTNING_HOST_SILVER, { clubId, clubName })) {
        awardedBadges.push(CLUB_BADGES.LIGHTNING_HOST_SILVER.id);
      }
    }

    if (lightningMatchesHosted >= 15) {
      if (await awardBadge(userId, CLUB_BADGES.LIGHTNING_HOST_GOLD, { clubId, clubName })) {
        awardedBadges.push(CLUB_BADGES.LIGHTNING_HOST_GOLD.id);
      }
    }

    if (lightningMatchesHosted >= 50) {
      if (await awardBadge(userId, CLUB_BADGES.LIGHTNING_HOST_PLATINUM, { clubId, clubName })) {
        awardedBadges.push(CLUB_BADGES.LIGHTNING_HOST_PLATINUM.id);
      }
    }

    if (awardedBadges.length > 0) {
      console.log(
        `✅ [BADGE] Awarded ${awardedBadges.length} lightning host badge(s) to user ${userId}`
      );
    }
  } catch (error) {
    console.error(`❌ [BADGE] Error checking lightning host badges:`, error);
  }

  return awardedBadges;
}

/**
 * Check all club-related badges
 */
export async function checkAllClubBadges(
  userId: string,
  clubId?: string,
  clubName?: string
): Promise<string[]> {
  const allAwardedBadges: string[] = [];

  const pioneerBadges = await checkCommunityPioneerBadges(userId, clubId, clubName);
  allAwardedBadges.push(...pioneerBadges);

  const hostBadges = await checkLightningHostBadges(userId, clubId, clubName);
  allAwardedBadges.push(...hostBadges);

  return allAwardedBadges;
}

export default {
  CLUB_BADGES,
  getClubMembershipCount,
  getClubEventsAttendedCount,
  getLightningMatchesHostedCount,
  checkCommunityPioneerBadges,
  checkLightningHostBadges,
  checkAllClubBadges,
};
