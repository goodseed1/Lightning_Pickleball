/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 2
 * Finalize Season Rankings
 *
 * Scheduled to run at the END of each season (Q1-Q4).
 * Processes the previous season's rankings and awards:
 * 1. Queries all "Official Rankers" (users with >= 5 matches in the season)
 * 2. Sorts by unified ELO rating
 * 3. Records final rank in each user's hallOfFame collection
 * 4. Awards season trophies (Phase 3)
 *
 * Schedule: Every quarter start at midnight (Eastern Time)
 * - January 1st, April 1st, July 1st, October 1st
 * This runs BEFORE recordSeasonStartGrades (which runs at 01:00)
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getPreviousSeasonId, getSeasonName } from '../utils/seasonUtils.js';
import { convertEloToNtrp } from '../utils/rankingUtils.js';
import { awardSeasonTrophies } from '../utils/seasonTrophyAwarder.js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Interface for Official Ranker data
 */
interface OfficialRanker {
  userId: string;
  eloRating: number;
  seasonMatchesPlayed: number;
  startingLtrGrade: string;
}

/**
 * Get season snapshot for a user (their starting LPR grade)
 */
async function getSeasonSnapshot(userId: string, seasonId: string): Promise<string | null> {
  try {
    const snapshotDoc = await db
      .collection('users')
      .doc(userId)
      .collection('seasonSnapshots')
      .doc(seasonId)
      .get();

    if (!snapshotDoc.exists) {
      return null;
    }

    const snapshotData = snapshotDoc.data();
    return snapshotData?.ltrGrade || null;
  } catch (error) {
    console.error(`❌ [SEASON FINAL] Error getting snapshot for ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user already has a season record in hallOfFame
 */
async function hasSeasonRecord(userId: string, seasonId: string): Promise<boolean> {
  try {
    const hallOfFameRef = db.collection('users').doc(userId).collection('hallOfFame');
    const q = hallOfFameRef
      .where('seasonId', '==', seasonId)
      .where('type', '==', 'SEASON_FINAL_RANK');

    const snapshot = await q.get();
    return !snapshot.empty;
  } catch (error) {
    console.error(`❌ [SEASON FINAL] Error checking season record for ${userId}:`, error);
    return false;
  }
}

/**
 * Record season final rank in user's hallOfFame
 */
async function recordSeasonFinalRank(
  userId: string,
  seasonId: string,
  seasonName: string,
  finalRank: number,
  totalPlayers: number,
  finalElo: number,
  startingLtrGrade: string
): Promise<void> {
  try {
    const ltrGrade = String(convertEloToNtrp(finalElo)); // LPR is integer (1-10)

    const seasonRecord = {
      type: 'SEASON_FINAL_RANK',
      seasonId,
      seasonName,
      finalRank,
      totalPlayers,
      finalElo,
      ltrGrade,
      startingLtrGrade,
      awardedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userId).collection('hallOfFame').add(seasonRecord);

    console.log(
      `🏆 [SEASON FINAL] Recorded rank #${finalRank}/${totalPlayers} for user ${userId} (${seasonName}, LPR ${ltrGrade})`
    );
  } catch (error) {
    console.error(`❌ [SEASON FINAL] Error recording season rank for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get official rankers for a season
 * Official Ranker = user with >= 5 matches played in the season
 */
async function getOfficialRankers(seasonId: string): Promise<OfficialRanker[]> {
  const rankers: OfficialRanker[] = [];

  try {
    // Query all users with seasonal stats >= 5 matches
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.where('stats.seasonMatchesPlayed', '>=', 5).get();

    console.log(`👥 [SEASON FINAL] Found ${usersSnapshot.size} potential official rankers`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      const eloRating = userData.stats?.unifiedEloRating || 1200;
      const seasonMatchesPlayed = userData.stats?.seasonMatchesPlayed || 0;

      // Double-check they have >= 5 matches
      if (seasonMatchesPlayed < 5) {
        continue;
      }

      // Get their starting LPR grade from season snapshot
      const startingGrade = await getSeasonSnapshot(userId, seasonId);
      if (!startingGrade) {
        console.warn(
          `⚠️ [SEASON FINAL] User ${userId} has no season snapshot for ${seasonId}, skipping`
        );
        continue;
      }

      rankers.push({
        userId,
        eloRating,
        seasonMatchesPlayed,
        startingLtrGrade: startingGrade,
      });
    }

    // Sort by ELO rating (highest first)
    rankers.sort((a, b) => b.eloRating - a.eloRating);

    console.log(`✅ [SEASON FINAL] ${rankers.length} official rankers qualified`);
    return rankers;
  } catch (error) {
    console.error('❌ [SEASON FINAL] Error getting official rankers:', error);
    throw error;
  }
}

/**
 * Main scheduled function
 * Runs at midnight on the first day of each quarter
 * Finalizes the PREVIOUS season's rankings
 */
export const finalizeSeasonRankings = onSchedule(
  {
    schedule: '0 0 1 1,4,7,10 *', // 00:00 on 1st of Jan, Apr, Jul, Oct
    timeZone: 'America/New_York',
    retryCount: 3,
  },
  async () => {
    console.log('🏛️ [SEASON FINAL] Starting season finalization...');

    const previousSeasonId = getPreviousSeasonId();
    const seasonName = getSeasonName(previousSeasonId);
    console.log(`📅 [SEASON FINAL] Finalizing season: ${previousSeasonId} (${seasonName})`);

    try {
      // 1. Get all official rankers (>= 5 matches) sorted by ELO
      const rankers = await getOfficialRankers(previousSeasonId);
      const totalPlayers = rankers.length;

      if (totalPlayers === 0) {
        console.log('⚠️ [SEASON FINAL] No official rankers found for this season');
        return;
      }

      let totalRecorded = 0;
      let totalSkipped = 0;

      // 2. Assign ranks and record in hallOfFame
      for (let i = 0; i < rankers.length; i++) {
        const ranker = rankers[i];
        const finalRank = i + 1; // 1-based ranking

        // Check if record already exists (avoid duplicates)
        const hasRecord = await hasSeasonRecord(ranker.userId, previousSeasonId);
        if (hasRecord) {
          console.log(
            `⏭️ [SEASON FINAL] Season record already exists for user ${ranker.userId}, skipping`
          );
          totalSkipped++;
          continue;
        }

        // Record the season final rank
        await recordSeasonFinalRank(
          ranker.userId,
          previousSeasonId,
          seasonName,
          finalRank,
          totalPlayers,
          ranker.eloRating,
          ranker.startingLtrGrade
        );

        totalRecorded++;
      }

      // 3. Award season trophies
      await awardSeasonTrophies(previousSeasonId, seasonName, rankers);

      console.log(`🎉 [SEASON FINAL] Completed!`);
      console.log(`   - Season: ${previousSeasonId} (${seasonName})`);
      console.log(`   - Official Rankers: ${totalPlayers}`);
      console.log(`   - Records created: ${totalRecorded}`);
      console.log(`   - Records skipped: ${totalSkipped}`);
    } catch (error) {
      console.error('❌ [SEASON FINAL] Error finalizing season rankings:', error);
      throw error;
    }
  }
);

/**
 * Manual execution function for testing or admin use
 * @param seasonId Optional season ID (defaults to previous season)
 * @returns Object with counts of recorded and skipped records
 */
export const finalizeSeasonRankingsManual = async (
  seasonId?: string
): Promise<{ recorded: number; skipped: number; totalRankers: number }> => {
  const targetSeasonId = seasonId || getPreviousSeasonId();
  const seasonName = getSeasonName(targetSeasonId);
  console.log(`🏛️ [SEASON FINAL MANUAL] Finalizing season: ${targetSeasonId} (${seasonName})`);

  const rankers = await getOfficialRankers(targetSeasonId);
  const totalPlayers = rankers.length;

  let totalRecorded = 0;
  let totalSkipped = 0;

  for (let i = 0; i < rankers.length; i++) {
    const ranker = rankers[i];
    const finalRank = i + 1;

    const hasRecord = await hasSeasonRecord(ranker.userId, targetSeasonId);
    if (hasRecord) {
      totalSkipped++;
      continue;
    }

    await recordSeasonFinalRank(
      ranker.userId,
      targetSeasonId,
      seasonName,
      finalRank,
      totalPlayers,
      ranker.eloRating,
      ranker.startingLtrGrade
    );

    totalRecorded++;
  }

  // Award season trophies
  await awardSeasonTrophies(targetSeasonId, seasonName, rankers);

  console.log(
    `✅ [SEASON FINAL MANUAL] Completed: ${totalRecorded} recorded, ${totalSkipped} skipped, ${totalPlayers} total rankers`
  );
  return { recorded: totalRecorded, skipped: totalSkipped, totalRankers: totalPlayers };
};
