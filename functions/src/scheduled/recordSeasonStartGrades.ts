/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 2
 * Record Season Start Grades
 *
 * Scheduled to run at the start of each season (Q1-Q4).
 * Records each active user's LPR grade as a snapshot for the new season.
 * This snapshot determines which grade group they compete in for the entire season.
 *
 * Schedule: Every quarter start at 01:00 AM (Eastern Time)
 * - January 1st, April 1st, July 1st, October 1st
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getCurrentSeasonId } from '../utils/seasonUtils.js';
import { convertEloToNtrp } from '../utils/rankingUtils.js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Check if season snapshot already exists for a user
 */
async function hasSeasonSnapshot(userId: string, seasonId: string): Promise<boolean> {
  try {
    const snapshotDoc = await db
      .collection('users')
      .doc(userId)
      .collection('seasonSnapshots')
      .doc(seasonId)
      .get();

    return snapshotDoc.exists;
  } catch (error) {
    console.error(`❌ [SEASON START] Error checking snapshot for ${userId}:`, error);
    return false;
  }
}

/**
 * Record season start grade snapshot for a user
 */
async function recordUserSnapshot(
  userId: string,
  seasonId: string,
  eloRating: number
): Promise<void> {
  try {
    const ltrGrade = String(convertEloToNtrp(eloRating)); // LPR is integer (1-10)

    const snapshot = {
      seasonId,
      ltrGrade,
      eloRating,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection('users')
      .doc(userId)
      .collection('seasonSnapshots')
      .doc(seasonId)
      .set(snapshot);

    console.log(
      `✅ [SEASON START] Recorded snapshot for user ${userId}: ${seasonId}, LPR ${ltrGrade}, ELO ${eloRating}`
    );
  } catch (error) {
    console.error(`❌ [SEASON START] Error recording snapshot for ${userId}:`, error);
    throw error;
  }
}

/**
 * Main scheduled function
 * Runs at the start of each quarter (January, April, July, October)
 * Records LPR grade snapshots for all active users
 */
export const recordSeasonStartGrades = onSchedule(
  {
    schedule: '0 1 1 1,4,7,10 *', // 01:00 on 1st of Jan, Apr, Jul, Oct
    timeZone: 'America/New_York',
    retryCount: 3,
  },
  async () => {
    console.log('🏛️ [SEASON START] Starting season grade snapshot recording...');

    const seasonId = getCurrentSeasonId();
    console.log(`📅 [SEASON START] Current season: ${seasonId}`);

    try {
      // Query all users with stats (active players)
      const usersRef = db.collection('users');
      const usersSnapshot = await usersRef.where('stats.matchesPlayed', '>', 0).get();

      let totalRecorded = 0;
      let totalSkipped = 0;

      console.log(`👥 [SEASON START] Found ${usersSnapshot.size} users with match history`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Check if snapshot already exists (avoid duplicates)
        const hasSnapshot = await hasSeasonSnapshot(userId, seasonId);
        if (hasSnapshot) {
          console.log(`⏭️ [SEASON START] Snapshot already exists for user ${userId}, skipping`);
          totalSkipped++;
          continue;
        }

        // Get user's current unified ELO rating
        const eloRating = userData.stats?.unifiedEloRating || 1200;

        // Record the snapshot
        await recordUserSnapshot(userId, seasonId, eloRating);
        totalRecorded++;
      }

      console.log(`🎉 [SEASON START] Completed!`);
      console.log(`   - Season: ${seasonId}`);
      console.log(`   - Snapshots recorded: ${totalRecorded}`);
      console.log(`   - Users skipped: ${totalSkipped}`);
    } catch (error) {
      console.error('❌ [SEASON START] Error recording season start grades:', error);
      throw error;
    }
  }
);

/**
 * Manual execution function for testing or admin use
 * @param seasonId Optional season ID (defaults to current season)
 * @returns Object with counts of recorded and skipped snapshots
 */
export const recordSeasonStartGradesManual = async (
  seasonId?: string
): Promise<{ recorded: number; skipped: number }> => {
  const targetSeasonId = seasonId || getCurrentSeasonId();
  console.log(`🏛️ [SEASON START MANUAL] Recording snapshots for season: ${targetSeasonId}`);

  let totalRecorded = 0;
  let totalSkipped = 0;

  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.where('stats.matchesPlayed', '>', 0).get();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();

    const hasSnapshot = await hasSeasonSnapshot(userId, targetSeasonId);
    if (hasSnapshot) {
      totalSkipped++;
      continue;
    }

    const eloRating = userData.stats?.unifiedEloRating || 1200;
    await recordUserSnapshot(userId, targetSeasonId, eloRating);
    totalRecorded++;
  }

  console.log(
    `✅ [SEASON START MANUAL] Completed: ${totalRecorded} recorded, ${totalSkipped} skipped`
  );
  return { recorded: totalRecorded, skipped: totalSkipped };
};
