/**
 * 🏅 Match Badge Checker
 *
 * Awards badges based on match results:
 * - First Victory (첫 승리)
 * - Victory Milestones (10, 25, 50, 100 wins)
 * - Winning Streak (3, 5, 10, 20 consecutive wins)
 * - Match Milestones (10, 50, 100 matches played)
 * - Giant Slayer (upset wins against higher ELO)
 * - Bagel Master (6-0 wins)
 * - Perfectionist (straight-set wins)
 * - Social Player (5+ different opponents)
 * - League Champion (first league win)
 *
 * @author Kim (Badge System Phase)
 * @date 2025-12-22
 * @updated 2025-12-30 - Added first_victory, victory_milestones, giant_slayer, bagel_master, perfectionist
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// ==================== BADGE DEFINITIONS ====================

export const MATCH_BADGES = {
  // === FIRST VICTORY (첫 승리) ===
  FIRST_VICTORY: {
    id: 'first_victory_bronze',
    achievementId: 'first_victory',
    name: 'First Victory',
    nameKo: '첫 승리의 감격',
    description: 'Win your first match',
    descriptionKo: '첫 경기에서 승리하세요',
    icon: '🏆',
    tier: 'bronze' as const,
    category: 'matches',
    condition: { type: 'wins', value: 1 },
    points: 100,
  },

  // === VICTORY MILESTONES (승리 이정표) ===
  VICTORY_MILESTONE_10: {
    id: 'victory_milestones_bronze',
    achievementId: 'victory_milestones',
    name: 'Victory Milestone (10)',
    nameKo: '승리 이정표 (10승)',
    description: 'Win 10 matches',
    descriptionKo: '10경기에서 승리하세요',
    icon: '🎾',
    tier: 'bronze' as const,
    category: 'matches',
    condition: { type: 'wins', value: 10 },
    points: 250,
  },
  VICTORY_MILESTONE_25: {
    id: 'victory_milestones_silver',
    achievementId: 'victory_milestones',
    name: 'Victory Milestone (25)',
    nameKo: '승리 이정표 (25승)',
    description: 'Win 25 matches',
    descriptionKo: '25경기에서 승리하세요',
    icon: '🎾',
    tier: 'silver' as const,
    category: 'matches',
    condition: { type: 'wins', value: 25 },
    points: 500,
  },
  VICTORY_MILESTONE_50: {
    id: 'victory_milestones_gold',
    achievementId: 'victory_milestones',
    name: 'Victory Milestone (50)',
    nameKo: '승리 이정표 (50승)',
    description: 'Win 50 matches',
    descriptionKo: '50경기에서 승리하세요',
    icon: '🏅',
    tier: 'gold' as const,
    category: 'matches',
    condition: { type: 'wins', value: 50 },
    points: 1000,
  },
  VICTORY_MILESTONE_100: {
    id: 'victory_milestones_platinum',
    achievementId: 'victory_milestones',
    name: 'Victory Milestone (100)',
    nameKo: '승리 이정표 (100승)',
    description: 'Win 100 matches',
    descriptionKo: '100경기에서 승리하세요',
    icon: '👑',
    tier: 'platinum' as const,
    category: 'matches',
    condition: { type: 'wins', value: 100 },
    points: 2000,
  },

  // === GIANT SLAYER (거인 사냥꾼) ===
  GIANT_SLAYER_BRONZE: {
    id: 'giant_slayer_bronze',
    achievementId: 'giant_slayer',
    name: 'Giant Slayer (3)',
    nameKo: '거인 사냥꾼 (3회)',
    description: 'Defeat 3 opponents with higher ELO',
    descriptionKo: '자신보다 높은 ELO의 상대를 3번 물리치세요',
    icon: '⚔️',
    tier: 'bronze' as const,
    category: 'special',
    condition: { type: 'upsetWins', value: 3 },
    points: 300,
  },
  GIANT_SLAYER_SILVER: {
    id: 'giant_slayer_silver',
    achievementId: 'giant_slayer',
    name: 'Giant Slayer (10)',
    nameKo: '거인 사냥꾼 (10회)',
    description: 'Defeat 10 opponents with higher ELO',
    descriptionKo: '자신보다 높은 ELO의 상대를 10번 물리치세요',
    icon: '🛡️',
    tier: 'silver' as const,
    category: 'special',
    condition: { type: 'upsetWins', value: 10 },
    points: 750,
  },
  GIANT_SLAYER_GOLD: {
    id: 'giant_slayer_gold',
    achievementId: 'giant_slayer',
    name: 'Giant Slayer (25)',
    nameKo: '거인 사냥꾼 (25회)',
    description: 'Defeat 25 opponents with higher ELO',
    descriptionKo: '자신보다 높은 ELO의 상대를 25번 물리치세요',
    icon: '👑',
    tier: 'gold' as const,
    category: 'special',
    condition: { type: 'upsetWins', value: 25 },
    points: 1500,
  },

  // === BAGEL MASTER (베이글 마스터) ===
  BAGEL_MASTER_BRONZE: {
    id: 'bagel_master_bronze',
    achievementId: 'bagel_master',
    name: 'Bagel Master (1)',
    nameKo: '베이글 마스터 (1회)',
    description: 'Win a set 6-0',
    descriptionKo: '6-0으로 세트를 이기세요',
    icon: '🥯',
    tier: 'bronze' as const,
    category: 'special',
    condition: { type: 'bagelWins', value: 1 },
    points: 200,
  },
  BAGEL_MASTER_SILVER: {
    id: 'bagel_master_silver',
    achievementId: 'bagel_master',
    name: 'Bagel Master (5)',
    nameKo: '베이글 마스터 (5회)',
    description: 'Win 5 sets 6-0',
    descriptionKo: '6-0으로 세트를 5번 이기세요',
    icon: '🥯',
    tier: 'silver' as const,
    category: 'special',
    condition: { type: 'bagelWins', value: 5 },
    points: 500,
  },
  BAGEL_MASTER_GOLD: {
    id: 'bagel_master_gold',
    achievementId: 'bagel_master',
    name: 'Bagel Master (15)',
    nameKo: '베이글 마스터 (15회)',
    description: 'Win 15 sets 6-0',
    descriptionKo: '6-0으로 세트를 15번 이기세요',
    icon: '👑',
    tier: 'gold' as const,
    category: 'special',
    condition: { type: 'bagelWins', value: 15 },
    points: 1200,
  },

  // === PERFECTIONIST (완벽주의자) ===
  PERFECTIONIST_PLATINUM: {
    id: 'perfectionist_platinum',
    achievementId: 'perfectionist',
    name: 'Perfectionist',
    nameKo: '완벽주의자',
    description: 'Win 10 matches without losing a set',
    descriptionKo: '세트를 잃지 않고 10경기에서 승리하세요',
    icon: '💎',
    tier: 'platinum' as const,
    category: 'special',
    condition: { type: 'perfectMatches', value: 10 },
    points: 2000,
  },

  // === WINNING STREAK (연승 행진) ===
  WINNING_STREAK_3: {
    id: 'winning_streak_bronze',
    achievementId: 'winning_streak',
    name: 'Hot Streak',
    nameKo: '연승 행진',
    description: 'Win 3 matches in a row',
    descriptionKo: '3연승을 달성하세요',
    icon: '🔥',
    tier: 'bronze' as const,
    category: 'streaks',
    condition: { type: 'winStreak', value: 3 },
    points: 200,
  },
  WINNING_STREAK_5: {
    id: 'winning_streak_silver',
    achievementId: 'winning_streak',
    name: 'On Fire',
    nameKo: '불타는 연승',
    description: 'Win 5 matches in a row',
    descriptionKo: '5연승을 달성하세요',
    icon: '🔥',
    tier: 'silver' as const,
    category: 'streaks',
    condition: { type: 'winStreak', value: 5 },
    points: 400,
  },
  WINNING_STREAK_10: {
    id: 'winning_streak_gold',
    achievementId: 'winning_streak',
    name: 'Unstoppable',
    nameKo: '무적 행진',
    description: 'Win 10 matches in a row',
    descriptionKo: '10연승을 달성하세요',
    icon: '🔥',
    tier: 'gold' as const,
    category: 'streaks',
    condition: { type: 'winStreak', value: 10 },
    points: 1000,
  },
  WINNING_STREAK_20: {
    id: 'winning_streak_platinum',
    achievementId: 'winning_streak',
    name: 'Legendary Streak',
    nameKo: '전설의 연승',
    description: 'Win 20 matches in a row',
    descriptionKo: '20연승을 달성하세요',
    icon: '⚡',
    tier: 'platinum' as const,
    category: 'streaks',
    condition: { type: 'winStreak', value: 20 },
    points: 2500,
  },

  // Match Milestone Badges
  MATCH_MILESTONE_10: {
    id: 'match_milestone_10',
    name: 'Getting Started',
    nameKo: '시작이 반이다',
    description: 'Play 10 matches',
    descriptionKo: '10경기를 플레이하세요',
    icon: '🎾',
    tier: 'bronze' as const,
    category: 'matches',
    condition: { type: 'matchesPlayed', value: 10 },
  },
  MATCH_MILESTONE_50: {
    id: 'match_milestone_50',
    name: 'Dedicated Player',
    nameKo: '열정적인 플레이어',
    description: 'Play 50 matches',
    descriptionKo: '50경기를 플레이하세요',
    icon: '🎾',
    tier: 'silver' as const,
    category: 'matches',
    condition: { type: 'matchesPlayed', value: 50 },
  },
  MATCH_MILESTONE_100: {
    id: 'match_milestone_100',
    name: 'Century Club',
    nameKo: '백전노장',
    description: 'Play 100 matches',
    descriptionKo: '100경기를 플레이하세요',
    icon: '🎾',
    tier: 'gold' as const,
    category: 'matches',
    condition: { type: 'matchesPlayed', value: 100 },
  },

  // Social Player Badge
  SOCIAL_PLAYER: {
    id: 'social_player',
    name: 'Social Player',
    nameKo: '소셜 플레이어',
    description: 'Play with 5 different opponents',
    descriptionKo: '5명의 다른 상대와 경기하세요',
    icon: '🤝',
    tier: 'bronze' as const,
    category: 'social',
    condition: { type: 'uniqueOpponents', value: 5 },
  },

  // League Champion Badge
  LEAGUE_CHAMPION: {
    id: 'league_champion',
    name: 'League Champion',
    nameKo: '리그 챔피언',
    description: 'Win your first league',
    descriptionKo: '첫 리그에서 우승하세요',
    icon: '👑',
    tier: 'gold' as const,
    category: 'leagues',
    condition: { type: 'leagueWins', value: 1 },
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
  badge: (typeof MATCH_BADGES)[keyof typeof MATCH_BADGES],
  context?: {
    eventId?: string;
    leagueId?: string;
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
    name: badge.name,
    nameKo: badge.nameKo,
    description: badge.description,
    descriptionKo: badge.descriptionKo,
    icon: badge.icon,
    tier: badge.tier,
    category: badge.category,
    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(context?.eventId && { eventId: context.eventId }),
    ...(context?.leagueId && { leagueId: context.leagueId }),
    ...(context?.clubId && { clubId: context.clubId }),
    ...(context?.clubName && { clubName: context.clubName }),
  };

  await badgeRef.set(badgeData);
  console.log(`🏅 [BADGE] Awarded badge "${badge.nameKo}" to user ${userId}`);

  return true;
}

// ==================== MAIN CHECK FUNCTIONS ====================

/**
 * Check and award winning streak badges
 * Called after each match result is submitted
 */
export async function checkWinningStreakBadges(
  userId: string,
  currentStreak: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(
    `🔥 [BADGE] Checking winning streak badges for user ${userId}, streak: ${currentStreak}`
  );

  // Check each streak milestone
  if (currentStreak >= 3) {
    if (await awardBadge(userId, MATCH_BADGES.WINNING_STREAK_3, { eventId })) {
      awardedBadges.push(MATCH_BADGES.WINNING_STREAK_3.id);
    }
  }

  if (currentStreak >= 5) {
    if (await awardBadge(userId, MATCH_BADGES.WINNING_STREAK_5, { eventId })) {
      awardedBadges.push(MATCH_BADGES.WINNING_STREAK_5.id);
    }
  }

  if (currentStreak >= 10) {
    if (await awardBadge(userId, MATCH_BADGES.WINNING_STREAK_10, { eventId })) {
      awardedBadges.push(MATCH_BADGES.WINNING_STREAK_10.id);
    }
  }

  if (currentStreak >= 20) {
    if (await awardBadge(userId, MATCH_BADGES.WINNING_STREAK_20, { eventId })) {
      awardedBadges.push(MATCH_BADGES.WINNING_STREAK_20.id);
    }
  }

  if (awardedBadges.length > 0) {
    console.log(`✅ [BADGE] Awarded ${awardedBadges.length} streak badge(s) to user ${userId}`);
  }

  return awardedBadges;
}

/**
 * Check and award match milestone badges
 * Called after each match result is submitted
 */
export async function checkMatchMilestoneBadges(
  userId: string,
  totalMatches: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(
    `🎾 [BADGE] Checking match milestone badges for user ${userId}, matches: ${totalMatches}`
  );

  // Check each milestone
  if (totalMatches >= 10) {
    if (await awardBadge(userId, MATCH_BADGES.MATCH_MILESTONE_10, { eventId })) {
      awardedBadges.push(MATCH_BADGES.MATCH_MILESTONE_10.id);
    }
  }

  if (totalMatches >= 50) {
    if (await awardBadge(userId, MATCH_BADGES.MATCH_MILESTONE_50, { eventId })) {
      awardedBadges.push(MATCH_BADGES.MATCH_MILESTONE_50.id);
    }
  }

  if (totalMatches >= 100) {
    if (await awardBadge(userId, MATCH_BADGES.MATCH_MILESTONE_100, { eventId })) {
      awardedBadges.push(MATCH_BADGES.MATCH_MILESTONE_100.id);
    }
  }

  if (awardedBadges.length > 0) {
    console.log(`✅ [BADGE] Awarded ${awardedBadges.length} milestone badge(s) to user ${userId}`);
  }

  return awardedBadges;
}

/**
 * Check and award social player badge
 * Called after match to count unique opponents
 */
export async function checkSocialPlayerBadge(userId: string, eventId?: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  // Skip if already has badge
  if (await hasBadge(userId, MATCH_BADGES.SOCIAL_PLAYER.id)) {
    return awardedBadges;
  }

  console.log(`🤝 [BADGE] Checking social player badge for user ${userId}`);

  try {
    // Count unique opponents from completed events
    const eventsAsHost = await db
      .collection('events')
      .where('hostId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const eventsAsParticipant = await db
      .collection('participation_applications')
      .where('applicantId', '==', userId)
      .where('status', '==', 'approved')
      .get();

    const uniqueOpponents = new Set<string>();

    // Collect opponents from events where user was host
    for (const doc of eventsAsHost.docs) {
      const eventData = doc.data();
      // Get approved participants (opponents)
      const participantsSnap = await db
        .collection('participation_applications')
        .where('eventId', '==', doc.id)
        .where('status', '==', 'approved')
        .get();

      participantsSnap.docs.forEach(pDoc => {
        const pData = pDoc.data();
        if (pData.applicantId && pData.applicantId !== userId) {
          uniqueOpponents.add(pData.applicantId);
        }
        if (pData.partnerId && pData.partnerId !== userId) {
          uniqueOpponents.add(pData.partnerId);
        }
      });

      // Also check host partner
      if (eventData.hostPartnerId && eventData.hostPartnerId !== userId) {
        // Host partner is teammate, not opponent - skip
      }
    }

    // Collect opponents from events where user was participant
    for (const doc of eventsAsParticipant.docs) {
      const appData = doc.data();
      const eventId = appData.eventId;

      if (!eventId) continue;

      const eventDoc = await db.doc(`events/${eventId}`).get();
      if (!eventDoc.exists) continue;

      const eventData = eventDoc.data()!;

      // Add host as opponent
      if (eventData.hostId && eventData.hostId !== userId) {
        uniqueOpponents.add(eventData.hostId);
      }

      // Add host partner as opponent (for doubles)
      if (eventData.hostPartnerId && eventData.hostPartnerId !== userId) {
        uniqueOpponents.add(eventData.hostPartnerId);
      }
    }

    console.log(
      `🤝 [BADGE] User ${userId} has played with ${uniqueOpponents.size} unique opponents`
    );

    // Award badge if 5+ unique opponents
    if (uniqueOpponents.size >= 5) {
      if (await awardBadge(userId, MATCH_BADGES.SOCIAL_PLAYER, { eventId })) {
        awardedBadges.push(MATCH_BADGES.SOCIAL_PLAYER.id);
        console.log(`✅ [BADGE] Awarded social player badge to user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`❌ [BADGE] Error checking social player badge:`, error);
  }

  return awardedBadges;
}

/**
 * Check and award league champion badge
 * Called when league is completed
 */
export async function checkLeagueChampionBadge(
  userId: string,
  leagueId: string,
  clubId?: string,
  clubName?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(`👑 [BADGE] Checking league champion badge for user ${userId}`);

  // Award badge
  if (await awardBadge(userId, MATCH_BADGES.LEAGUE_CHAMPION, { leagueId, clubId, clubName })) {
    awardedBadges.push(MATCH_BADGES.LEAGUE_CHAMPION.id);
    console.log(`✅ [BADGE] Awarded league champion badge to user ${userId}`);
  }

  return awardedBadges;
}

// ==================== NEW BADGE CHECK FUNCTIONS ====================

/**
 * Check and award first victory badge
 * Called when user wins their first match
 */
export async function checkFirstVictoryBadge(
  userId: string,
  totalWins: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  if (totalWins >= 1) {
    if (await awardBadge(userId, MATCH_BADGES.FIRST_VICTORY, { eventId })) {
      awardedBadges.push(MATCH_BADGES.FIRST_VICTORY.id);
      console.log(`🏆 [BADGE] Awarded first victory badge to user ${userId}`);
    }
  }

  return awardedBadges;
}

/**
 * Check and award victory milestone badges
 * Called after each win to check total wins
 */
export async function checkVictoryMilestoneBadges(
  userId: string,
  totalWins: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(
    `🎾 [BADGE] Checking victory milestone badges for user ${userId}, wins: ${totalWins}`
  );

  if (totalWins >= 10) {
    if (await awardBadge(userId, MATCH_BADGES.VICTORY_MILESTONE_10, { eventId })) {
      awardedBadges.push(MATCH_BADGES.VICTORY_MILESTONE_10.id);
    }
  }

  if (totalWins >= 25) {
    if (await awardBadge(userId, MATCH_BADGES.VICTORY_MILESTONE_25, { eventId })) {
      awardedBadges.push(MATCH_BADGES.VICTORY_MILESTONE_25.id);
    }
  }

  if (totalWins >= 50) {
    if (await awardBadge(userId, MATCH_BADGES.VICTORY_MILESTONE_50, { eventId })) {
      awardedBadges.push(MATCH_BADGES.VICTORY_MILESTONE_50.id);
    }
  }

  if (totalWins >= 100) {
    if (await awardBadge(userId, MATCH_BADGES.VICTORY_MILESTONE_100, { eventId })) {
      awardedBadges.push(MATCH_BADGES.VICTORY_MILESTONE_100.id);
    }
  }

  if (awardedBadges.length > 0) {
    console.log(`✅ [BADGE] Awarded ${awardedBadges.length} victory milestone badge(s)`);
  }

  return awardedBadges;
}

/**
 * Check and award giant slayer badges
 * Called when user wins against a higher ELO opponent
 */
export async function checkGiantSlayerBadges(
  userId: string,
  upsetWins: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(
    `⚔️ [BADGE] Checking giant slayer badges for user ${userId}, upset wins: ${upsetWins}`
  );

  if (upsetWins >= 3) {
    if (await awardBadge(userId, MATCH_BADGES.GIANT_SLAYER_BRONZE, { eventId })) {
      awardedBadges.push(MATCH_BADGES.GIANT_SLAYER_BRONZE.id);
    }
  }

  if (upsetWins >= 10) {
    if (await awardBadge(userId, MATCH_BADGES.GIANT_SLAYER_SILVER, { eventId })) {
      awardedBadges.push(MATCH_BADGES.GIANT_SLAYER_SILVER.id);
    }
  }

  if (upsetWins >= 25) {
    if (await awardBadge(userId, MATCH_BADGES.GIANT_SLAYER_GOLD, { eventId })) {
      awardedBadges.push(MATCH_BADGES.GIANT_SLAYER_GOLD.id);
    }
  }

  if (awardedBadges.length > 0) {
    console.log(`✅ [BADGE] Awarded ${awardedBadges.length} giant slayer badge(s)`);
  }

  return awardedBadges;
}

/**
 * Check and award bagel master badges
 * Called when user wins a set 6-0
 */
export async function checkBagelMasterBadges(
  userId: string,
  bagelWins: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(
    `🥯 [BADGE] Checking bagel master badges for user ${userId}, bagel wins: ${bagelWins}`
  );

  if (bagelWins >= 1) {
    if (await awardBadge(userId, MATCH_BADGES.BAGEL_MASTER_BRONZE, { eventId })) {
      awardedBadges.push(MATCH_BADGES.BAGEL_MASTER_BRONZE.id);
    }
  }

  if (bagelWins >= 5) {
    if (await awardBadge(userId, MATCH_BADGES.BAGEL_MASTER_SILVER, { eventId })) {
      awardedBadges.push(MATCH_BADGES.BAGEL_MASTER_SILVER.id);
    }
  }

  if (bagelWins >= 15) {
    if (await awardBadge(userId, MATCH_BADGES.BAGEL_MASTER_GOLD, { eventId })) {
      awardedBadges.push(MATCH_BADGES.BAGEL_MASTER_GOLD.id);
    }
  }

  if (awardedBadges.length > 0) {
    console.log(`✅ [BADGE] Awarded ${awardedBadges.length} bagel master badge(s)`);
  }

  return awardedBadges;
}

/**
 * Check and award perfectionist badge
 * Called when user wins without losing a set
 */
export async function checkPerfectionistBadge(
  userId: string,
  perfectMatches: number,
  eventId?: string
): Promise<string[]> {
  const awardedBadges: string[] = [];

  console.log(
    `💎 [BADGE] Checking perfectionist badge for user ${userId}, perfect matches: ${perfectMatches}`
  );

  if (perfectMatches >= 10) {
    if (await awardBadge(userId, MATCH_BADGES.PERFECTIONIST_PLATINUM, { eventId })) {
      awardedBadges.push(MATCH_BADGES.PERFECTIONIST_PLATINUM.id);
      console.log(`✅ [BADGE] Awarded perfectionist badge to user ${userId}`);
    }
  }

  return awardedBadges;
}

/**
 * Main function to check all match-related badges after a match
 * Called from submitPublicMatchResult
 */
export async function checkAllMatchBadges(
  userId: string,
  isWinner: boolean,
  eventId: string,
  matchData?: {
    winnerElo?: number;
    loserElo?: number;
    score?: string;
    isPerfectMatch?: boolean;
  }
): Promise<string[]> {
  const allAwardedBadges: string[] = [];

  console.log(`🏅 [BADGE] Checking all match badges for user ${userId}, isWinner: ${isWinner}`);

  try {
    // Get user stats
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      console.error(`❌ [BADGE] User not found: ${userId}`);
      return allAwardedBadges;
    }

    const userData = userDoc.data()!;
    const stats = userData.stats || {};

    // 1. Check match milestone badges
    const totalMatches = (stats.matchesPlayed || 0) + 1; // +1 for current match
    const milestoneBadges = await checkMatchMilestoneBadges(userId, totalMatches, eventId);
    allAwardedBadges.push(...milestoneBadges);

    // 2. Check winning streak badges (only if winner)
    if (isWinner) {
      // Calculate current streak
      const currentStreak = (stats.currentStreak || 0) + 1;
      const streakBadges = await checkWinningStreakBadges(userId, currentStreak, eventId);
      allAwardedBadges.push(...streakBadges);

      // Update current streak in user stats
      await db.doc(`users/${userId}`).update({
        'stats.currentStreak': currentStreak,
      });

      // 3. Check first victory badge
      const totalWins = (stats.wins || 0) + 1;
      const firstVictoryBadges = await checkFirstVictoryBadge(userId, totalWins, eventId);
      allAwardedBadges.push(...firstVictoryBadges);

      // 4. Check victory milestone badges
      const victoryMilestoneBadges = await checkVictoryMilestoneBadges(userId, totalWins, eventId);
      allAwardedBadges.push(...victoryMilestoneBadges);

      // 5. Check giant slayer badges (if winner had lower ELO)
      if (matchData?.winnerElo && matchData?.loserElo && matchData.winnerElo < matchData.loserElo) {
        const upsetWins = (stats.upsetWins || 0) + 1;
        const giantSlayerBadges = await checkGiantSlayerBadges(userId, upsetWins, eventId);
        allAwardedBadges.push(...giantSlayerBadges);

        // Update upset wins count
        await db.doc(`users/${userId}`).update({
          'stats.upsetWins': upsetWins,
        });
      }

      // 6. Check bagel master badges (if score contains 6-0)
      if (matchData?.score && matchData.score.includes('6-0')) {
        const bagelWins = (stats.bagelWins || 0) + 1;
        const bagelBadges = await checkBagelMasterBadges(userId, bagelWins, eventId);
        allAwardedBadges.push(...bagelBadges);

        // Update bagel wins count
        await db.doc(`users/${userId}`).update({
          'stats.bagelWins': bagelWins,
        });
      }

      // 7. Check perfectionist badge (if won without losing a set)
      if (matchData?.isPerfectMatch) {
        const perfectMatches = (stats.perfectMatches || 0) + 1;
        const perfectionistBadges = await checkPerfectionistBadge(userId, perfectMatches, eventId);
        allAwardedBadges.push(...perfectionistBadges);

        // Update perfect matches count
        await db.doc(`users/${userId}`).update({
          'stats.perfectMatches': perfectMatches,
        });
      }
    } else {
      // Reset streak on loss
      await db.doc(`users/${userId}`).update({
        'stats.currentStreak': 0,
      });
    }

    // 8. Check social player badge (for both winners and losers)
    const socialBadges = await checkSocialPlayerBadge(userId, eventId);
    allAwardedBadges.push(...socialBadges);

    if (allAwardedBadges.length > 0) {
      console.log(`✅ [BADGE] Total badges awarded to user ${userId}: ${allAwardedBadges.length}`);
    }
  } catch (error) {
    console.error(`❌ [BADGE] Error checking badges:`, error);
  }

  return allAwardedBadges;
}

export default {
  MATCH_BADGES,
  checkWinningStreakBadges,
  checkMatchMilestoneBadges,
  checkSocialPlayerBadge,
  checkLeagueChampionBadge,
  checkFirstVictoryBadge,
  checkVictoryMilestoneBadges,
  checkGiantSlayerBadges,
  checkBagelMasterBadges,
  checkPerfectionistBadge,
  checkAllMatchBadges,
};
