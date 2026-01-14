/**
 * 🏛️ PROJECT OLYMPUS: Trophy Awarder
 *
 * Awards trophies to tournament winners and runners-up.
 * Stores trophies in user's Hall of Fame subcollection.
 *
 * Philosophy: Celebrate achievements and build competitive spirit
 */

import * as admin from 'firebase-admin';

export interface TournamentTrophy {
  id: string;
  rank: 'Winner' | 'Runner-up';
  position: number;
  name: string;
  tournamentName: string;
  clubName: string;
  clubId: string;
  leagueId: string;
  trophyType: 'tournament_winner' | 'tournament_runnerup';
  icon: {
    set: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons';
    name: string;
    color: string;
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
    season?: string;
  };
  awardedAt: FirebaseFirestore.Timestamp; // 🏛️ PROJECT OLYMPUS: Aligned with frontend Trophy type
  season: string;
  createdAt: FirebaseFirestore.Timestamp;
  // Index signature for Firestore compatibility
  [key: string]: unknown;
}

/**
 * Get current season identifier (e.g., "Spring 2025", "Summer 2025")
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
 * Get trophy icon configuration based on rank
 */
function getTrophyIcon(rank: 'Winner' | 'Runner-up'): {
  set: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons';
  name: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
} {
  if (rank === 'Winner') {
    return {
      set: 'MaterialCommunityIcons',
      name: 'trophy',
      color: '#FFD700', // Gold
      tier: 'gold',
    };
  } else {
    return {
      set: 'MaterialCommunityIcons',
      name: 'trophy-variant',
      color: '#C0C0C0', // Silver
      tier: 'silver',
    };
  }
}

/**
 * Award trophy to a tournament participant
 *
 * @param userId - User ID to award trophy to
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param clubId - Club ID
 * @param clubName - Club name
 * @param leagueId - League ID
 * @param rank - Tournament rank (Winner or Runner-up)
 * @param position - Final position (1 for winner, 2 for runner-up)
 * @param transaction - Optional Firestore transaction
 */
export async function awardTournamentTrophy(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  clubId: string,
  clubName: string,
  leagueId: string,
  rank: 'Winner' | 'Runner-up',
  position: number,
  transaction?: FirebaseFirestore.Transaction,
  currentBestFinish?: number
): Promise<string> {
  const db = admin.firestore();

  console.log(`🏆 [TROPHY AWARDER] Awarding ${rank} trophy to user ${userId}:`, {
    tournamentId,
    tournamentName,
    clubName,
    position,
  });

  const season = getCurrentSeason();
  const icon = getTrophyIcon(rank);
  const trophyType = rank === 'Winner' ? 'tournament_winner' : 'tournament_runnerup';

  const trophyData: TournamentTrophy = {
    id: `${tournamentId}_${userId}_${trophyType}`,
    rank,
    position,
    name: `${tournamentName} - ${rank}`,
    tournamentName,
    clubName,
    clubId,
    leagueId,
    trophyType,
    icon: {
      ...icon,
      season,
    },
    awardedAt: admin.firestore.Timestamp.now(), // 🏛️ PROJECT OLYMPUS: Aligned with frontend Trophy type
    season,
    createdAt: admin.firestore.Timestamp.now(),
  };

  const trophyRef = db.doc(`users/${userId}/trophies/${trophyData.id}`);

  // 🆕 [KIM] Tournament stats update - Award trophy AND update ranking stats
  // 🔄 Phase 3: Update BOTH data structures for consistency

  // 1. Flat collection (legacy/cache structure)
  const flatMembershipId = `${clubId}_${userId}`;
  const flatMembershipRef = db.doc(`clubMembers/${flatMembershipId}`);

  // 2. Nested subcollection (primary data source for userService/clubService)
  const nestedMembershipRef = db.doc(`users/${userId}/clubMemberships/${clubId}`);

  // Prepare stats update based on rank - using NEW clear field names
  const statsUpdate: Record<string, FirebaseFirestore.FieldValue | number> = {};

  // Update specific stats based on rank
  if (rank === 'Winner') {
    // 🏆 Tournament placement statistics
    statsUpdate['clubStats.tournamentStats.championships'] =
      admin.firestore.FieldValue.increment(1);

    // 🎯 bestFinish: Set to 1 (Winner is the best possible finish)
    // Note: Lower number = better finish (1 is best, 2 is second, etc.)
    statsUpdate['clubStats.tournamentStats.bestFinish'] = 1;

    // 📊 Legacy field compatibility (will be migrated later)
    statsUpdate['clubStats.tournamentStats.wins'] = admin.firestore.FieldValue.increment(1);

    console.log(`🏆 [TROPHY AWARDER] Updating Winner stats: championships++, bestFinish=1`);
  } else if (rank === 'Runner-up') {
    // 🥈 Tournament placement statistics
    statsUpdate['clubStats.tournamentStats.runnerUps'] = admin.firestore.FieldValue.increment(1);

    // 🎯 bestFinish: Only update if current bestFinish is worse than 2 (or null)
    // This will be handled below after checking current value

    console.log(`🥈 [TROPHY AWARDER] Updating Runner-up stats: runnerUps++`);
  }
  // TODO: Add semi-finalist handling (position 3/4) in future

  try {
    if (transaction) {
      // 🆕 Use pre-read currentBestFinish from parameter (passed from caller)
      const bestFinish = currentBestFinish !== undefined ? currentBestFinish : 999;

      // 🎯 bestFinish logic for Runner-up: Only update if current bestFinish is worse than 2
      if (rank === 'Runner-up' && position < bestFinish) {
        statsUpdate['clubStats.tournamentStats.bestFinish'] = position;
      }

      // Award trophy and update stats atomically
      // ✅ All writes happen here - no reads in transaction!
      transaction.set(trophyRef, trophyData);

      // 🔄 Update BOTH data structures
      transaction.set(nestedMembershipRef, statsUpdate, { merge: true }); // Primary source
      transaction.set(flatMembershipRef, statsUpdate, { merge: true }); // Legacy/cache

      console.log(
        `✅ [TROPHY AWARDER] Trophy AND stats updated (transaction) for user ${userId}: ${rank}`
      );
      console.log(`   📍 Updated nested: users/${userId}/clubMemberships/${clubId}`);
      console.log(`   📍 Updated flat: clubMembers/${flatMembershipId}`);
    } else {
      // Outside transaction - read current bestFinish first from nested collection
      const membershipDoc = await nestedMembershipRef.get();
      const bestFinish = membershipDoc.data()?.clubStats?.tournamentStats?.bestFinish || 999;

      // 🎯 bestFinish logic for Runner-up: Only update if current bestFinish is worse than 2
      if (rank === 'Runner-up' && position < bestFinish) {
        statsUpdate['clubStats.tournamentStats.bestFinish'] = position;
      }

      // Award trophy and update stats
      await trophyRef.set(trophyData);

      // 🔄 Update BOTH data structures
      await nestedMembershipRef.set(statsUpdate, { merge: true }); // Primary source
      await flatMembershipRef.set(statsUpdate, { merge: true }); // Legacy/cache

      console.log(`✅ [TROPHY AWARDER] Trophy AND stats updated for user ${userId}: ${rank}`);
      console.log(`   📍 Updated nested: users/${userId}/clubMemberships/${clubId}`);
      console.log(`   📍 Updated flat: clubMembers/${flatMembershipId}`);
    }

    return trophyData.id;
  } catch (error) {
    console.error(
      `❌ [TROPHY AWARDER] Failed to award trophy/update stats for user ${userId}:`,
      error
    );
    throw error;
  }
}

/**
 * Award trophies to tournament rankings
 *
 * @param rankings - Array of tournament rankings with userId and rank
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param clubId - Club ID
 * @param clubName - Club name
 * @param leagueId - League ID
 * @returns Array of trophy IDs awarded
 */
export async function awardTournamentTrophies(
  rankings: Array<{
    userId: string;
    rank: number;
    playerName: string;
  }>,
  tournamentId: string,
  tournamentName: string,
  clubId: string,
  clubName: string,
  leagueId: string
): Promise<
  Array<{
    userId: string;
    trophyId: string;
    rank: 'Winner' | 'Runner-up';
  }>
> {
  console.log(`🏆 [TROPHY AWARDER] Awarding trophies for tournament ${tournamentId}:`, {
    tournamentName,
    participantCount: rankings.length,
  });

  const awardedTrophies: Array<{
    userId: string;
    trophyId: string;
    rank: 'Winner' | 'Runner-up';
  }> = [];

  try {
    // Award Winner trophy (rank 1)
    const winner = rankings.find(r => r.rank === 1);
    if (winner) {
      const trophyId = await awardTournamentTrophy(
        winner.userId,
        tournamentId,
        tournamentName,
        clubId,
        clubName,
        leagueId,
        'Winner',
        1
      );
      awardedTrophies.push({
        userId: winner.userId,
        trophyId,
        rank: 'Winner',
      });
    }

    // Award Runner-up trophy (rank 2)
    const runnerUp = rankings.find(r => r.rank === 2);
    if (runnerUp) {
      const trophyId = await awardTournamentTrophy(
        runnerUp.userId,
        tournamentId,
        tournamentName,
        clubId,
        clubName,
        leagueId,
        'Runner-up',
        2
      );
      awardedTrophies.push({
        userId: runnerUp.userId,
        trophyId,
        rank: 'Runner-up',
      });
    }

    console.log(
      `✅ [TROPHY AWARDER] Awarded ${awardedTrophies.length} trophies for tournament ${tournamentId}`
    );

    return awardedTrophies;
  } catch (error) {
    console.error(
      `❌ [TROPHY AWARDER] Failed to award trophies for tournament ${tournamentId}:`,
      error
    );
    throw error;
  }
}

/**
 * Check if user already has a trophy for this tournament
 *
 * @param userId - User ID to check
 * @param tournamentId - Tournament ID
 * @param trophyType - Trophy type to check for
 * @returns True if trophy exists, false otherwise
 */
export async function hasTournamentTrophy(
  userId: string,
  tournamentId: string,
  trophyType: 'tournament_winner' | 'tournament_runnerup'
): Promise<boolean> {
  const db = admin.firestore();
  const trophyId = `${tournamentId}_${userId}_${trophyType}`;
  const trophyRef = db.doc(`users/${userId}/trophies/${trophyId}`);

  try {
    const trophyDoc = await trophyRef.get();
    return trophyDoc.exists;
  } catch (error) {
    console.error(`❌ [TROPHY AWARDER] Failed to check trophy existence:`, error);
    return false;
  }
}

/**
 * Get all trophies for a user
 *
 * @param userId - User ID to query
 * @returns Array of trophies
 */
export async function getUserTrophies(userId: string): Promise<TournamentTrophy[]> {
  const db = admin.firestore();

  console.log(`🏆 [TROPHY AWARDER] Fetching trophies for user ${userId}`);

  try {
    const trophiesSnapshot = await db
      .collection(`users/${userId}/trophies`)
      .orderBy('date', 'desc')
      .get();

    const trophies = trophiesSnapshot.docs.map(doc => doc.data() as unknown as TournamentTrophy);

    console.log(`✅ [TROPHY AWARDER] Retrieved ${trophies.length} trophies`);

    return trophies;
  } catch (error) {
    console.error(`❌ [TROPHY AWARDER] Failed to fetch trophies:`, error);
    return [];
  }
}

/**
 * Get trophy count by type for a user
 *
 * @param userId - User ID to query
 * @returns Object with trophy counts
 */
export async function getUserTrophyCount(userId: string): Promise<{
  totalTrophies: number;
  wins: number;
  runnerUps: number;
}> {
  const trophies = await getUserTrophies(userId);

  const wins = trophies.filter(t => t.trophyType === 'tournament_winner').length;
  const runnerUps = trophies.filter(t => t.trophyType === 'tournament_runnerup').length;

  console.log(`📊 [TROPHY STATS] User ${userId}:`, {
    totalTrophies: trophies.length,
    wins,
    runnerUps,
  });

  return {
    totalTrophies: trophies.length,
    wins,
    runnerUps,
  };
}

/**
 * Award trophy to a league participant
 *
 * @param userId - User ID to award trophy to
 * @param leagueId - League ID
 * @param leagueName - League name
 * @param clubId - Club ID
 * @param clubName - Club name
 * @param organizationId - Organization ID
 * @param rank - League rank (Winner or Runner-up)
 * @param position - Final position (1 for winner, 2 for runner-up)
 * @param transaction - Optional Firestore transaction
 */
export async function awardLeagueTrophy(
  userId: string,
  leagueId: string,
  leagueName: string,
  clubId: string,
  clubName: string,
  organizationId: string,
  rank: 'Winner' | 'Runner-up',
  position: number,
  transaction?: FirebaseFirestore.Transaction,
  currentBestFinish?: number
): Promise<string> {
  const db = admin.firestore();

  console.log(`🏆 [TROPHY AWARDER] Awarding ${rank} trophy to user ${userId}:`, {
    leagueId,
    leagueName,
    clubName,
    position,
  });

  const season = getCurrentSeason();
  const icon = getTrophyIcon(rank);
  const trophyType = rank === 'Winner' ? 'league_winner' : 'league_runnerup';

  const trophyData: TournamentTrophy = {
    id: `${leagueId}_${userId}_${trophyType}`,
    rank,
    position,
    name: `${leagueName} - ${rank}`,
    tournamentName: leagueName, // Keep field name for compatibility
    clubName,
    clubId,
    leagueId: organizationId,
    trophyType: trophyType as 'tournament_winner' | 'tournament_runnerup', // Type assertion for compatibility
    icon: {
      ...icon,
      season,
    },
    awardedAt: admin.firestore.Timestamp.now(),
    season,
    createdAt: admin.firestore.Timestamp.now(),
  };

  const trophyRef = db.doc(`users/${userId}/trophies/${trophyData.id}`);

  // 🆕 [KIM] League stats update - Award trophy AND update ranking stats
  // 🔄 Phase 3: Update BOTH data structures for consistency

  // 1. Flat collection (legacy/cache structure)
  const flatMembershipId = `${clubId}_${userId}`;
  const flatMembershipRef = db.doc(`clubMembers/${flatMembershipId}`);

  // 2. Nested subcollection (primary data source for userService/clubService)
  const nestedMembershipRef = db.doc(`users/${userId}/clubMemberships/${clubId}`);

  // Prepare stats update based on rank - using NEW clear field names
  const statsUpdate: Record<string, FirebaseFirestore.FieldValue | number> = {};

  // Update specific stats based on rank
  if (rank === 'Winner') {
    // 🏆 League placement statistics
    statsUpdate['clubStats.leagueStats.championships'] =
      admin.firestore.FieldValue.increment(1);

    // 🎯 bestFinish: Set to 1 (Winner is the best possible finish)
    // Note: Lower number = better finish (1 is best, 2 is second, etc.)
    statsUpdate['clubStats.leagueStats.bestFinish'] = 1;

    // 📊 Legacy field compatibility (will be migrated later)
    statsUpdate['clubStats.leagueStats.wins'] = admin.firestore.FieldValue.increment(1);

    console.log(`🏆 [TROPHY AWARDER] Updating Winner stats: championships++, bestFinish=1`);
  } else if (rank === 'Runner-up') {
    // 🥈 League placement statistics
    statsUpdate['clubStats.leagueStats.runnerUps'] = admin.firestore.FieldValue.increment(1);

    // 🎯 bestFinish: Only update if current bestFinish is worse than 2 (or null)
    // This will be handled below after checking current value

    console.log(`🥈 [TROPHY AWARDER] Updating Runner-up stats: runnerUps++`);
  }

  try {
    if (transaction) {
      // 🆕 Use pre-read currentBestFinish from parameter (passed from caller)
      const bestFinish = currentBestFinish !== undefined ? currentBestFinish : 999;

      // 🎯 bestFinish logic for Runner-up: Only update if current bestFinish is worse than 2
      if (rank === 'Runner-up' && position < bestFinish) {
        statsUpdate['clubStats.leagueStats.bestFinish'] = position;
      }

      // Award trophy and update stats atomically
      // ✅ All writes happen here - no reads in transaction!
      transaction.set(trophyRef, trophyData);

      // 🔄 Update BOTH data structures
      transaction.set(nestedMembershipRef, statsUpdate, { merge: true }); // Primary source
      transaction.set(flatMembershipRef, statsUpdate, { merge: true }); // Legacy/cache

      console.log(
        `✅ [TROPHY AWARDER] Trophy AND stats updated (transaction) for user ${userId}: ${rank}`
      );
      console.log(`   📍 Updated nested: users/${userId}/clubMemberships/${clubId}`);
      console.log(`   📍 Updated flat: clubMembers/${flatMembershipId}`);
    } else {
      // Outside transaction - read current bestFinish first from nested collection
      const membershipDoc = await nestedMembershipRef.get();
      const bestFinish = membershipDoc.data()?.clubStats?.leagueStats?.bestFinish || 999;

      // 🎯 bestFinish logic for Runner-up: Only update if current bestFinish is worse than 2
      if (rank === 'Runner-up' && position < bestFinish) {
        statsUpdate['clubStats.leagueStats.bestFinish'] = position;
      }

      // Award trophy and update stats
      await trophyRef.set(trophyData);

      // 🔄 Update BOTH data structures
      await nestedMembershipRef.set(statsUpdate, { merge: true }); // Primary source
      await flatMembershipRef.set(statsUpdate, { merge: true }); // Legacy/cache

      console.log(`✅ [TROPHY AWARDER] Trophy AND stats updated for user ${userId}: ${rank}`);
      console.log(`   📍 Updated nested: users/${userId}/clubMemberships/${clubId}`);
      console.log(`   📍 Updated flat: clubMembers/${flatMembershipId}`);
    }

    return trophyData.id;
  } catch (error) {
    console.error(
      `❌ [TROPHY AWARDER] Failed to award trophy/update stats for user ${userId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a trophy (admin function - use with caution!)
 *
 * @param userId - User ID
 * @param trophyId - Trophy ID to delete
 */
export async function deleteTrophy(userId: string, trophyId: string): Promise<void> {
  const db = admin.firestore();

  console.log(`🗑️ [TROPHY AWARDER] Deleting trophy ${trophyId} for user ${userId}`);

  try {
    await db.doc(`users/${userId}/trophies/${trophyId}`).delete();
    console.log(`✅ [TROPHY AWARDER] Trophy deleted successfully`);
  } catch (error) {
    console.error(`❌ [TROPHY AWARDER] Failed to delete trophy:`, error);
    throw error;
  }
}
