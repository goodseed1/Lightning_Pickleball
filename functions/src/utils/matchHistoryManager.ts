/**
 * 🏛️ PROJECT OLYMPUS: Match History Manager
 *
 * Manages match history with FIFO (First-In-First-Out) limit of 100 matches.
 * Stores recent match results for Hall of Fame badge calculation.
 *
 * Philosophy: Keep the most recent 100 matches for performance and badge calculation accuracy
 */

import * as admin from 'firebase-admin';

const MAX_MATCH_HISTORY = 100;

/**
 * 🎯 [HEIMDALL] Get the correct match history collection path based on match type
 *
 * Global matches (no clubId) → global_match_history
 * Club matches (has clubId) → club_match_history
 *
 * @param userId - User ID
 * @param matchEntry - Match history entry to determine collection
 * @returns Firestore collection path
 */
function getMatchHistoryCollectionPath(userId: string, matchEntry: MatchHistoryEntry): string {
  const isClubMatch = !!matchEntry.clubId;
  const collectionName = isClubMatch ? 'club_match_history' : 'global_match_history';

  console.log(
    `🗂️ [MATCH HISTORY] Routing to ${collectionName} (clubId: ${matchEntry.clubId || 'none'})`
  );

  return `users/${userId}/${collectionName}`;
}

export interface MatchHistoryEntry {
  matchId: string;
  tournamentId?: string;
  tournamentName?: string;
  clubId?: string;
  clubName?: string;
  opponent: {
    playerId: string;
    playerName: string;
    teamId?: string; // For doubles matches
  };
  result: 'win' | 'loss';
  matchType: 'singles' | 'doubles';
  score: string;
  date: FirebaseFirestore.Timestamp;
  context: 'tournament' | 'club' | 'public';
  // ELO changes
  oldElo?: number;
  newElo?: number;
  eloChange?: number;
}

/**
 * Add match to user's match history with FIFO limit
 *
 * @param userId - User ID to add match history for
 * @param matchEntry - Match history entry data
 * @param transaction - Optional Firestore transaction
 */
export async function addMatchToHistory(
  userId: string,
  matchEntry: MatchHistoryEntry,
  transaction?: FirebaseFirestore.Transaction
): Promise<void> {
  console.log(`📜 [MATCH HISTORY] Adding match for user ${userId}:`, {
    matchId: matchEntry.matchId,
    result: matchEntry.result,
    matchType: matchEntry.matchType,
    context: matchEntry.context,
  });

  try {
    if (transaction) {
      // Inside transaction - use transaction API
      await addMatchWithTransaction(userId, matchEntry, transaction);
    } else {
      // Outside transaction - use batch API
      await addMatchWithBatch(userId, matchEntry);
    }

    console.log(`✅ [MATCH HISTORY] Match added successfully for user ${userId}`);
  } catch (error) {
    console.error(`❌ [MATCH HISTORY] Failed to add match for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Add match using Firestore transaction (for use within existing transactions)
 */
async function addMatchWithTransaction(
  userId: string,
  matchEntry: MatchHistoryEntry,
  transaction: FirebaseFirestore.Transaction
): Promise<void> {
  const db = admin.firestore();
  const collectionPath = getMatchHistoryCollectionPath(userId, matchEntry);
  const historyRef = db.collection(collectionPath);

  // Get current history count
  const historySnapshot = await transaction.get(
    historyRef.orderBy('date', 'desc').limit(MAX_MATCH_HISTORY)
  );

  const currentCount = historySnapshot.size;

  console.log(`📊 [MATCH HISTORY] Current history count: ${currentCount}/${MAX_MATCH_HISTORY}`);

  // Add new match
  const newMatchRef = historyRef.doc();
  transaction.set(newMatchRef, {
    ...matchEntry,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // If history exceeds limit, delete oldest matches
  if (currentCount >= MAX_MATCH_HISTORY) {
    const excessCount = currentCount - MAX_MATCH_HISTORY + 1; // +1 for the new match
    const oldestMatches = historySnapshot.docs.slice(-excessCount);

    console.log(`🗑️ [MATCH HISTORY] Removing ${excessCount} oldest matches (FIFO)`);

    oldestMatches.forEach(doc => {
      transaction.delete(doc.ref);
    });
  }
}

/**
 * Add match using Firestore batch (for standalone operations)
 */
async function addMatchWithBatch(userId: string, matchEntry: MatchHistoryEntry): Promise<void> {
  const db = admin.firestore();
  const batch = db.batch();
  const collectionPath = getMatchHistoryCollectionPath(userId, matchEntry);
  const historyRef = db.collection(collectionPath);

  // Get current history count
  const historySnapshot = await historyRef.orderBy('date', 'desc').limit(MAX_MATCH_HISTORY).get();

  const currentCount = historySnapshot.size;

  console.log(`📊 [MATCH HISTORY] Current history count: ${currentCount}/${MAX_MATCH_HISTORY}`);

  // Add new match
  const newMatchRef = historyRef.doc();
  batch.set(newMatchRef, {
    ...matchEntry,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // If history exceeds limit, delete oldest matches
  if (currentCount >= MAX_MATCH_HISTORY) {
    const excessCount = currentCount - MAX_MATCH_HISTORY + 1; // +1 for the new match
    const oldestMatches = historySnapshot.docs.slice(-excessCount);

    console.log(`🗑️ [MATCH HISTORY] Removing ${excessCount} oldest matches (FIFO)`);

    oldestMatches.forEach(doc => {
      batch.delete(doc.ref);
    });
  }

  // Commit batch
  await batch.commit();
}

/**
 * Get user's match history
 *
 * @param userId - User ID to query
 * @param limit - Number of matches to retrieve (default: 100)
 * @returns Array of match history entries
 */
export async function getMatchHistory(
  userId: string,
  limit: number = MAX_MATCH_HISTORY
): Promise<MatchHistoryEntry[]> {
  const db = admin.firestore();

  console.log(`📜 [MATCH HISTORY] Fetching match history for user ${userId} (limit: ${limit})`);

  try {
    const historySnapshot = await db
      .collection(`users/${userId}/match_history`)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const matches = historySnapshot.docs.map(doc => doc.data() as unknown as MatchHistoryEntry);

    console.log(`✅ [MATCH HISTORY] Retrieved ${matches.length} matches`);

    return matches;
  } catch (error) {
    console.error(`❌ [MATCH HISTORY] Failed to fetch match history:`, error);
    return [];
  }
}

/**
 * Get tournament-specific match history for badge calculations
 *
 * @param userId - User ID to query
 * @param context - Match context (tournament, club, public)
 * @returns Array of tournament match entries
 */
export async function getTournamentMatchHistory(
  userId: string,
  context: 'tournament' | 'club' | 'public' = 'tournament'
): Promise<MatchHistoryEntry[]> {
  const db = admin.firestore();

  console.log(`🏆 [MATCH HISTORY] Fetching ${context} match history for user ${userId}`);

  try {
    const historySnapshot = await db
      .collection(`users/${userId}/match_history`)
      .where('context', '==', context)
      .orderBy('date', 'desc')
      .limit(MAX_MATCH_HISTORY)
      .get();

    const matches = historySnapshot.docs.map(doc => doc.data() as unknown as MatchHistoryEntry);

    console.log(`✅ [MATCH HISTORY] Retrieved ${matches.length} ${context} matches`);

    return matches;
  } catch (error) {
    console.error(`❌ [MATCH HISTORY] Failed to fetch ${context} match history:`, error);
    return [];
  }
}

/**
 * Calculate consecutive wins streak from match history
 *
 * @param userId - User ID to query
 * @param context - Optional context filter
 * @returns Number of consecutive wins
 */
export async function getConsecutiveWins(
  userId: string,
  context?: 'tournament' | 'club' | 'public'
): Promise<number> {
  const matches = context
    ? await getTournamentMatchHistory(userId, context)
    : await getMatchHistory(userId);

  let consecutiveWins = 0;

  for (const match of matches) {
    if (match.result === 'win') {
      consecutiveWins++;
    } else {
      break; // Streak broken
    }
  }

  console.log(`🔥 [MATCH HISTORY] User ${userId} has ${consecutiveWins} consecutive wins`);

  return consecutiveWins;
}

/**
 * Get tournament participation count
 *
 * @param userId - User ID to query
 * @returns Object with tournament statistics
 */
export async function getTournamentStats(userId: string): Promise<{
  totalTournaments: number;
  wins: number;
  losses: number;
  winRate: number;
  uniqueTournaments: Set<string>;
}> {
  const tournamentMatches = await getTournamentMatchHistory(userId, 'tournament');

  const wins = tournamentMatches.filter(m => m.result === 'win').length;
  const losses = tournamentMatches.filter(m => m.result === 'loss').length;
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  // Count unique tournaments
  const uniqueTournaments = new Set(
    tournamentMatches.filter(m => m.tournamentId).map(m => m.tournamentId!)
  );

  console.log(`📊 [TOURNAMENT STATS] User ${userId}:`, {
    totalTournaments: uniqueTournaments.size,
    wins,
    losses,
    winRate: winRate.toFixed(1) + '%',
  });

  return {
    totalTournaments: uniqueTournaments.size,
    wins,
    losses,
    winRate,
    uniqueTournaments,
  };
}

/**
 * Clear all match history for a user (use with caution!)
 *
 * @param userId - User ID to clear history for
 */
export async function clearMatchHistory(userId: string): Promise<void> {
  const db = admin.firestore();

  console.log(`🗑️ [MATCH HISTORY] Clearing all match history for user ${userId}`);

  try {
    const historyRef = db.collection(`users/${userId}/match_history`);
    const snapshot = await historyRef.get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ [MATCH HISTORY] Cleared ${snapshot.size} matches for user ${userId}`);
  } catch (error) {
    console.error(`❌ [MATCH HISTORY] Failed to clear match history:`, error);
    throw error;
  }
}
