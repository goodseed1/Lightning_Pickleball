/**
 * 🏛️ PROJECT OLYMPUS: Tournament Badge Checker
 *
 * Automatically checks badge conditions and awards badges when tournaments complete.
 * Integrates with matchHistoryManager and trophyAwarder for comprehensive badge calculation.
 *
 * Philosophy: Celebrate every achievement milestone with automatic badge rewards
 */

import * as admin from 'firebase-admin';
import { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_CATEGORIES } from '../constants/achievements';
import { getConsecutiveWins } from './matchHistoryManager';
import { getUserTrophies } from './trophyAwarder';

export interface TournamentBadge {
  id: string;
  achievementId: string;
  achievementKey: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: 'tournaments';
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
  tournamentId?: string;
  tournamentName?: string;
  clubId?: string;
  clubName?: string;
  // Index signature for Firestore compatibility
  [key: string]: unknown;
}

export interface TournamentStats {
  totalTournamentWins: number;
  totalTournamentsParticipated: number;
  totalRunnerUps: number;
  singlesTournamentWins: number;
  doublesTournamentWins: number;
  consecutiveTournamentWins: number;
  tournamentWinsInCurrentSeason: number;
  tournamentWinRate: number;
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
 * Calculate tournament statistics for badge checking
 *
 * @param userId - User ID to calculate stats for
 * @returns Tournament statistics object
 */
export async function calculateTournamentStats(userId: string): Promise<TournamentStats> {
  const db = admin.firestore();

  console.log(`📊 [BADGE CHECKER] Calculating tournament stats for user ${userId}`);

  // Get all trophies (winners and runner-ups)
  const trophies = await getUserTrophies(userId);

  // Get match history for consecutive wins (currently unused, reserved for future)
  // const tournamentMatches = await getTournamentMatchHistory(userId, 'tournament');

  // Calculate total wins (gold trophies)
  const winnerTrophies = trophies.filter(t => t.trophyType === 'tournament_winner');
  const totalTournamentWins = winnerTrophies.length;

  // Calculate runner-ups (silver trophies)
  const runnerUpTrophies = trophies.filter(t => t.trophyType === 'tournament_runnerup');
  const totalRunnerUps = runnerUpTrophies.length;

  // Calculate total tournaments participated (winners + runner-ups)
  const totalTournamentsParticipated = totalTournamentWins + totalRunnerUps;

  // Calculate singles vs doubles wins
  // Note: We'll need to query tournament documents to get eventType
  let singlesTournamentWins = 0;
  let doublesTournamentWins = 0;

  for (const trophy of winnerTrophies) {
    if (!trophy.id) continue;

    const tournamentId = trophy.id.split('_')[0]; // Extract tournamentId from trophy.id
    const tournamentDoc = await db.doc(`tournaments/${tournamentId}`).get();

    if (tournamentDoc.exists) {
      const tournamentData = tournamentDoc.data();
      const eventType = tournamentData?.eventType;

      if (eventType === 'singles') {
        singlesTournamentWins++;
      } else if (eventType === 'doubles') {
        doublesTournamentWins++;
      }
    }
  }

  // Calculate consecutive tournament wins from match history
  const consecutiveTournamentWins = await getConsecutiveWins(userId, 'tournament');

  // Calculate tournament wins in current season
  const currentSeason = getCurrentSeason();
  const tournamentWinsInCurrentSeason = winnerTrophies.filter(
    t => t.season === currentSeason
  ).length;

  // Calculate win rate
  const tournamentWinRate =
    totalTournamentsParticipated > 0
      ? (totalTournamentWins / totalTournamentsParticipated) * 100
      : 0;

  const stats: TournamentStats = {
    totalTournamentWins,
    totalTournamentsParticipated,
    totalRunnerUps,
    singlesTournamentWins,
    doublesTournamentWins,
    consecutiveTournamentWins,
    tournamentWinsInCurrentSeason,
    tournamentWinRate,
  };

  console.log(`✅ [BADGE CHECKER] Tournament stats calculated:`, stats);

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
  badgeData: TournamentBadge,
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
 * @param achievementKey - Achievement key (e.g., 'FIRST_TOURNAMENT_VICTORY')
 * @param tier - Tier to check (bronze, silver, gold, platinum)
 * @param stats - User's tournament statistics
 * @returns True if user qualifies for this badge tier
 */
function qualifiesForBadgeTier(
  achievementKey: string,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum',
  stats: TournamentStats
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
    case 'tournamentWins':
      return stats.totalTournamentWins >= condition.value;

    case 'tournamentsParticipated':
      return stats.totalTournamentsParticipated >= condition.value;

    case 'tournamentRunnerUps':
      return stats.totalRunnerUps >= condition.value;

    case 'consecutiveTournamentWins':
      return stats.consecutiveTournamentWins >= condition.value;

    case 'tournamentWinRate': {
      // Pickleball Prodigy: 100% win rate with minimum 5 tournaments
      const minTournaments =
        (condition as unknown as { minTournaments?: number }).minTournaments || 1;
      return (
        stats.tournamentWinRate >= condition.value &&
        stats.totalTournamentsParticipated >= minTournaments
      );
    }

    case 'tournamentWinsInSeason':
      return stats.tournamentWinsInCurrentSeason >= condition.value;

    case 'singlesTournamentWins':
      return stats.singlesTournamentWins >= condition.value;

    case 'doublesTournamentWins':
      return stats.doublesTournamentWins >= condition.value;

    default:
      console.warn(`⚠️ [BADGE CHECKER] Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Check and award all eligible tournament badges for a user
 *
 * @param userId - User ID to check badges for
 * @param tournamentId - Optional tournament ID for context
 * @param tournamentName - Optional tournament name for context
 * @param clubId - Optional club ID for context
 * @param clubName - Optional club name for context
 * @param transaction - Optional Firestore transaction
 * @returns Array of badge IDs that were awarded
 */
export async function checkAndAwardTournamentBadges(
  userId: string,
  tournamentId?: string,
  tournamentName?: string,
  clubId?: string,
  clubName?: string,
  transaction?: FirebaseFirestore.Transaction
): Promise<string[]> {
  console.log(`🔍 [BADGE CHECKER] Checking tournament badges for user ${userId}:`, {
    tournamentId,
    tournamentName,
  });

  // Calculate user's tournament statistics
  const stats = await calculateTournamentStats(userId);

  const awardedBadges: string[] = [];

  // Iterate through all tournament achievements
  const tournamentAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).filter(
    ([, definition]) => definition.category === ACHIEVEMENT_CATEGORIES.TOURNAMENTS
  );

  for (const [achievementKey, achievement] of tournamentAchievements) {
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
        const badgeData: TournamentBadge = {
          id: badgeId,
          achievementId: achievement.id,
          achievementKey: achievementKey,
          tier: tier,
          name: `${achievement.name} (${tier.toUpperCase()})`,
          nameKo: `${achievement.nameKo} (${tier.toUpperCase()})`,
          description: achievement.description,
          descriptionKo: achievement.descriptionKo,
          category: 'tournaments',
          icon: tierData.icon,
          points: tierData.points,
          unlockedAt: admin.firestore.Timestamp.now(),
          createdAt: admin.firestore.Timestamp.now(),
          // Context
          tournamentId: tournamentId,
          tournamentName: tournamentName,
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
export async function getUserBadges(userId: string): Promise<TournamentBadge[]> {
  const db = admin.firestore();

  console.log(`🏅 [BADGE CHECKER] Fetching badges for user ${userId}`);

  try {
    const badgesSnapshot = await db
      .collection(`users/${userId}/badges`)
      .orderBy('unlockedAt', 'desc')
      .get();

    const badges = badgesSnapshot.docs.map(doc => doc.data() as unknown as TournamentBadge);

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
