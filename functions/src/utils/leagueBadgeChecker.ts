/**
 * 🏛️ PROJECT OLYMPUS: League Badge Checker
 *
 * Automatically checks badge conditions and awards badges when leagues complete.
 * Integrates with matchHistoryManager and trophyAwarder for comprehensive badge calculation.
 *
 * Philosophy: Celebrate every achievement milestone with automatic badge rewards
 */

import * as admin from 'firebase-admin';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_CATEGORIES } from '../constants/achievements';
import { getConsecutiveWins } from './matchHistoryManager';
import { getUserTrophies } from './trophyAwarder';

export interface LeagueBadge {
  id: string;
  achievementId: string;
  achievementKey: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: 'leagues';
  icon: {
    set: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons';
    name: string;
    color: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  points: number;
  unlockedAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  // Context of when badge was earned
  leagueId?: string;
  leagueName?: string;
  clubId?: string;
  clubName?: string;
  // Index signature for Firestore compatibility
  [key: string]: unknown;
}

export interface LeagueStats {
  totalLeagueWins: number;
  totalLeaguesParticipated: number;
  totalRunnerUps: number;
  singlesLeagueWins: number;
  doublesLeagueWins: number;
  consecutiveLeagueWins: number;
  leagueWinsInCurrentSeason: number;
  leagueWinRate: number;
}

/**
 * Get current season identifier (e.g., "Spring 2025")
 */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  let season: string;
  if (month >= 3 && month <= 5) {
    season = 'Spring';
  } else if (month >= 6 && month <= 8) {
    season = 'Summer';
  } else if (month >= 9 && month <= 11) {
    season = 'Fall';
  } else {
    season = 'Winter';
  }

  return `${season} ${year}`;
}

/**
 * Calculate league statistics for badge checking
 *
 * @param userId - User ID to calculate stats for
 * @returns League statistics object
 */
export async function calculateLeagueStats(userId: string): Promise<LeagueStats> {
  const db = admin.firestore();

  console.log(`📊 [BADGE CHECKER] Calculating league stats for user ${userId}`);

  // Get all trophies (winners and runner-ups)
  const trophies = await getUserTrophies(userId);

  // Get match history for consecutive wins (currently unused, reserved for future)
  // const leagueMatches = await getLeagueMatchHistory(userId, 'league');

  // Calculate total wins (gold trophies)
  // Note: Trophy types use TournamentTrophy interface for compatibility
  const winnerTrophies = trophies.filter(t => {
    const trophyType = t.trophyType as unknown as string;
    return trophyType === 'league_winner';
  });
  const totalLeagueWins = winnerTrophies.length;

  // Calculate runner-ups (silver trophies)
  const runnerUpTrophies = trophies.filter(t => {
    const trophyType = t.trophyType as unknown as string;
    return trophyType === 'league_runnerup';
  });
  const totalRunnerUps = runnerUpTrophies.length;

  // Calculate total leagues participated (winners + runner-ups)
  const totalLeaguesParticipated = totalLeagueWins + totalRunnerUps;

  // Calculate singles vs doubles wins
  // Note: We'll need to query league documents to get eventType
  let singlesLeagueWins = 0;
  let doublesLeagueWins = 0;

  for (const trophy of winnerTrophies) {
    if (!trophy.id) continue;

    const leagueId = trophy.id.split('_')[0]; // Extract leagueId from trophy.id
    const leagueDoc = await db.doc(`leagues/${leagueId}`).get();

    if (leagueDoc.exists) {
      const leagueData = leagueDoc.data();
      const eventType = leagueData?.eventType;

      if (eventType === 'singles') {
        singlesLeagueWins++;
      } else if (eventType === 'doubles') {
        doublesLeagueWins++;
      }
    }
  }

  // Calculate consecutive league wins from match history
  // Note: Using 'tournament' type for compatibility until 'league' is added to matchHistoryManager
  const consecutiveLeagueWins = await getConsecutiveWins(userId, 'tournament');

  // Calculate league wins in current season
  const currentSeason = getCurrentSeason();
  const leagueWinsInCurrentSeason = winnerTrophies.filter(
    t => t.season === currentSeason
  ).length;

  // Calculate win rate
  const leagueWinRate =
    totalLeaguesParticipated > 0
      ? (totalLeagueWins / totalLeaguesParticipated) * 100
      : 0;

  const stats: LeagueStats = {
    totalLeagueWins,
    totalLeaguesParticipated,
    totalRunnerUps,
    singlesLeagueWins,
    doublesLeagueWins,
    consecutiveLeagueWins,
    leagueWinsInCurrentSeason,
    leagueWinRate,
  };

  console.log(`✅ [BADGE CHECKER] League stats calculated:`, stats);

  return stats;
}

/**
 * Check if user already has a specific badge
 *
 * @param userId - User ID to check
 * @param badgeId - Badge ID to check for
 * @returns True if badge exists, false otherwise
 */
export async function hasBadge(userId: string, badgeId: string): Promise<boolean> {
  const db = admin.firestore();
  const badgeRef = db.doc(`users/${userId}/badges/${badgeId}`);

  try {
    const badgeDoc = await badgeRef.get();
    return badgeDoc.exists;
  } catch (error) {
    console.error(`❌ [BADGE CHECKER] Failed to check badge existence:`, error);
    return false;
  }
}

/**
 * Award a badge to a user
 *
 * @param userId - User ID to award badge to
 * @param badgeData - Badge data to save
 * @param transaction - Optional Firestore transaction
 * @returns Badge ID
 */
export async function awardBadge(
  userId: string,
  badgeData: LeagueBadge,
  transaction?: FirebaseFirestore.Transaction
): Promise<string> {
  const db = admin.firestore();
  const badgeRef = db.doc(`users/${userId}/badges/${badgeData.id}`);

  console.log(`🏅 [BADGE CHECKER] Awarding badge to user ${userId}:`, {
    badgeId: badgeData.id,
    name: badgeData.name,
    tier: badgeData.tier,
  });

  try {
    if (transaction) {
      // Inside transaction
      transaction.set(badgeRef, badgeData);
      console.log(
        `✅ [BADGE CHECKER] Badge awarded (transaction) to user ${userId}: ${badgeData.name}`
      );
    } else {
      // Outside transaction
      await badgeRef.set(badgeData);
      console.log(`✅ [BADGE CHECKER] Badge awarded to user ${userId}: ${badgeData.name}`);
    }

    return badgeData.id;
  } catch (error) {
    console.error(`❌ [BADGE CHECKER] Failed to award badge to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if user qualifies for a specific badge tier
 *
 * @param achievementKey - Achievement key (e.g., 'FIRST_LEAGUE_VICTORY')
 * @param tier - Tier to check (bronze, silver, gold, platinum)
 * @param stats - User's league statistics
 * @returns True if user qualifies for this badge tier
 */
function qualifiesForBadgeTier(
  achievementKey: string,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum',
  stats: LeagueStats
): boolean {
  const achievement =
    ACHIEVEMENT_DEFINITIONS[achievementKey as keyof typeof ACHIEVEMENT_DEFINITIONS];
  if (!achievement || !achievement.tiers[tier as keyof typeof achievement.tiers]) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tierData = achievement.tiers[tier as keyof typeof achievement.tiers] as any;
  const condition = tierData.condition;

  switch (condition.type) {
    case 'leagueWins':
      return stats.totalLeagueWins >= condition.value;

    case 'leaguesParticipated':
      return stats.totalLeaguesParticipated >= condition.value;

    case 'leagueRunnerUps':
      return stats.totalRunnerUps >= condition.value;

    case 'consecutiveLeagueWins':
      return stats.consecutiveLeagueWins >= condition.value;

    case 'leagueWinRate': {
      // Pickleball Prodigy: 100% win rate with minimum 5 leagues
      const minLeagues =
        (condition as unknown as { minLeagues?: number }).minLeagues || 1;
      return (
        stats.leagueWinRate >= condition.value &&
        stats.totalLeaguesParticipated >= minLeagues
      );
    }

    case 'leagueWinsInSeason':
      return stats.leagueWinsInCurrentSeason >= condition.value;

    case 'singlesLeagueWins':
      return stats.singlesLeagueWins >= condition.value;

    case 'doublesLeagueWins':
      return stats.doublesLeagueWins >= condition.value;

    default:
      console.warn(`⚠️ [BADGE CHECKER] Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Check and award all eligible league badges for a user
 *
 * @param userId - User ID to check badges for
 * @param leagueId - Optional league ID for context
 * @param leagueName - Optional league name for context
 * @param clubId - Optional club ID for context
 * @param clubName - Optional club name for context
 * @param transaction - Optional Firestore transaction
 * @returns Array of badge IDs that were awarded
 */
export async function checkAndAwardLeagueBadges(
  userId: string,
  leagueId?: string,
  leagueName?: string,
  clubId?: string,
  clubName?: string,
  transaction?: FirebaseFirestore.Transaction
): Promise<string[]> {
  console.log(`🔍 [BADGE CHECKER] Checking league badges for user ${userId}:`, {
    leagueId,
    leagueName,
  });

  // Calculate user's league statistics
  const stats = await calculateLeagueStats(userId);

  const awardedBadges: string[] = [];

  // Iterate through all league achievements
  // Note: Using TOURNAMENTS category for Phase 1 (leagues and tournaments share similar achievements)
  const leagueAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).filter(
    ([, definition]) => definition.category === ACHIEVEMENT_CATEGORIES.TOURNAMENTS
  );

  for (const [achievementKey, achievement] of leagueAchievements) {
    // Check each tier of the achievement
    const tiers = Object.keys(achievement.tiers) as ('bronze' | 'silver' | 'gold' | 'platinum')[];

    for (const tier of tiers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tierData = achievement.tiers[tier as keyof typeof achievement.tiers] as any;
      if (!tierData) continue;

      // Generate badge ID
      const badgeId = `${achievement.id}_${tier}`;

      // Check if user already has this badge
      const alreadyHasBadge = await hasBadge(userId, badgeId);
      if (alreadyHasBadge) {
        console.log(`ℹ️ [BADGE CHECKER] User already has badge: ${badgeId}`);
        continue;
      }

      // Check if user qualifies for this badge tier
      const qualifies = qualifiesForBadgeTier(achievementKey, tier, stats);

      if (qualifies) {
        console.log(`🎯 [BADGE CHECKER] User qualifies for badge: ${badgeId}`);

        // Create badge data
        const badgeData: LeagueBadge = {
          id: badgeId,
          achievementId: achievement.id,
          achievementKey: achievementKey,
          tier: tier,
          name: `${achievement.name} (${tier.toUpperCase()})`,
          nameKo: `${achievement.nameKo} (${tier.toUpperCase()})`,
          description: achievement.description,
          descriptionKo: achievement.descriptionKo,
          category: 'leagues',
          icon: tierData.icon,
          points: tierData.points,
          unlockedAt: admin.firestore.Timestamp.now(),
          createdAt: admin.firestore.Timestamp.now(),
          // Context
          leagueId: leagueId,
          leagueName: leagueName,
          clubId: clubId,
          clubName: clubName,
        };

        // Award the badge
        await awardBadge(userId, badgeData, transaction);
        awardedBadges.push(badgeId);
      }
    }
  }

  console.log(
    `✅ [BADGE CHECKER] Awarded ${awardedBadges.length} badges to user ${userId}:`,
    awardedBadges
  );

  return awardedBadges;
}

/**
 * Get all badges for a user
 *
 * @param userId - User ID to query
 * @returns Array of badges
 */
export async function getUserBadges(userId: string): Promise<LeagueBadge[]> {
  const db = admin.firestore();

  console.log(`🏅 [BADGE CHECKER] Fetching badges for user ${userId}`);

  try {
    const badgesSnapshot = await db
      .collection(`users/${userId}/badges`)
      .orderBy('unlockedAt', 'desc')
      .get();

    const badges = badgesSnapshot.docs.map(doc => doc.data() as unknown as LeagueBadge);

    console.log(`✅ [BADGE CHECKER] Retrieved ${badges.length} badges`);

    return badges;
  } catch (error) {
    console.error(`❌ [BADGE CHECKER] Failed to fetch badges:`, error);
    return [];
  }
}

/**
 * Get badge count by tier for a user
 *
 * @param userId - User ID to query
 * @returns Object with badge counts
 */
export async function getUserBadgeCount(userId: string): Promise<{
  totalBadges: number;
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}> {
  const badges = await getUserBadges(userId);

  const bronze = badges.filter(b => b.tier === 'bronze').length;
  const silver = badges.filter(b => b.tier === 'silver').length;
  const gold = badges.filter(b => b.tier === 'gold').length;
  const platinum = badges.filter(b => b.tier === 'platinum').length;

  console.log(`📊 [BADGE STATS] User ${userId}:`, {
    totalBadges: badges.length,
    bronze,
    silver,
    gold,
    platinum,
  });

  return {
    totalBadges: badges.length,
    bronze,
    silver,
    gold,
    platinum,
  };
}

/**
 * Delete a badge (admin function - use with caution!)
 *
 * @param userId - User ID
 * @param badgeId - Badge ID to delete
 */
export async function deleteBadge(userId: string, badgeId: string): Promise<void> {
  const db = admin.firestore();

  console.log(`🗑️ [BADGE CHECKER] Deleting badge ${badgeId} for user ${userId}`);

  try {
    await db.doc(`users/${userId}/badges/${badgeId}`).delete();
    console.log(`✅ [BADGE CHECKER] Badge deleted successfully`);
  } catch (error) {
    console.error(`❌ [BADGE CHECKER] Failed to delete badge:`, error);
    throw error;
  }
}
