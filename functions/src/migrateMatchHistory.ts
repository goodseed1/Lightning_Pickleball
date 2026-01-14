/**
 * 🔄 [HEIMDALL] Match History Migration Cloud Function
 *
 * Migrates existing match_history data to new separated collections:
 * - users/{userId}/match_history → split into:
 *   - users/{userId}/global_match_history (no clubId)
 *   - users/{userId}/club_match_history (has clubId)
 *
 * This is a ONE-TIME migration function.
 * Run once, then can be removed from deployment.
 *
 * @author Heimdall (Phase 5)
 * @date 2025-11-13
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface MigrationStats {
  totalUsers: number;
  totalMatches: number;
  globalMatches: number;
  clubMatches: number;
  errors: number;
  usersProcessed: string[];
  errorMessages: string[];
}

/**
 * Migrate Match History Cloud Function
 *
 * Security: Admin only (requires secret key)
 *
 * @returns Migration statistics
 */
export const migrateMatchHistory = onCall<{ secretKey?: string }>(async request => {
  const { data, auth } = request;

  // ============================================================================
  // Step 1: Security Check (Admin only)
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  // Simple secret key check (replace with your own secret)
  const MIGRATION_SECRET = 'migrate-match-history-2025'; // Change this!
  if (data.secretKey !== MIGRATION_SECRET) {
    throw new HttpsError('permission-denied', 'Invalid secret key');
  }

  logger.info('🔄 [MIGRATION] Starting match history migration...', {
    triggeredBy: auth.uid,
  });

  const stats: MigrationStats = {
    totalUsers: 0,
    totalMatches: 0,
    globalMatches: 0,
    clubMatches: 0,
    errors: 0,
    usersProcessed: [],
    errorMessages: [],
  };

  try {
    // ==========================================================================
    // Step 2: Get all users (who have match_history)
    // ==========================================================================
    const usersSnapshot = await db.collection('users').get();
    stats.totalUsers = usersSnapshot.size;

    logger.info(`📊 [MIGRATION] Found ${stats.totalUsers} users to check`);

    // ==========================================================================
    // Step 3: Process each user
    // ==========================================================================
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        await migrateUserMatchHistory(userId, stats);
      } catch (error) {
        stats.errors++;
        const errorMsg = `Failed to migrate user ${userId}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errorMessages.push(errorMsg);
        logger.error(`❌ [MIGRATION] ${errorMsg}`);
        // Continue with next user
      }
    }

    // ==========================================================================
    // Step 4: Return Migration Stats
    // ==========================================================================
    logger.info('✅ [MIGRATION] Migration completed', stats);

    return {
      success: true,
      message: 'Migration completed successfully',
      stats,
    };
  } catch (error) {
    logger.error('❌ [MIGRATION] Fatal error during migration:', error);
    throw new HttpsError(
      'internal',
      `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * Migrate match history for a single user
 */
async function migrateUserMatchHistory(userId: string, stats: MigrationStats): Promise<void> {
  logger.info(`👤 [MIGRATION] Processing user: ${userId}`);

  // Get user's match_history
  const matchHistoryRef = db.collection(`users/${userId}/match_history`);
  const matchesSnapshot = await matchHistoryRef.get();

  if (matchesSnapshot.empty) {
    logger.info(`⏭️ [MIGRATION] User ${userId} has no match history, skipping`);
    return;
  }

  logger.info(`📜 [MIGRATION] User ${userId} has ${matchesSnapshot.size} matches to migrate`);

  // Batch write for efficiency
  const batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH_SIZE = 500; // Firestore batch limit

  for (const matchDoc of matchesSnapshot.docs) {
    const matchData = matchDoc.data();
    const isClubMatch = !!matchData.clubId;

    // Determine target collection
    const targetCollection = isClubMatch ? 'club_match_history' : 'global_match_history';
    const targetRef = db.collection(`users/${userId}/${targetCollection}`).doc(matchDoc.id);

    // Copy to new collection
    batch.set(targetRef, matchData);

    // Update stats
    stats.totalMatches++;
    if (isClubMatch) {
      stats.clubMatches++;
    } else {
      stats.globalMatches++;
    }

    batchCount++;

    // Commit batch if reaching limit
    if (batchCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      logger.info(`💾 [MIGRATION] Committed batch of ${batchCount} matches for user ${userId}`);
      batchCount = 0;
    }
  }

  // Commit remaining matches
  if (batchCount > 0) {
    await batch.commit();
    logger.info(`💾 [MIGRATION] Committed final batch of ${batchCount} matches for user ${userId}`);
  }

  stats.usersProcessed.push(userId);

  logger.info(`✅ [MIGRATION] User ${userId} migration complete`, {
    totalMatches: matchesSnapshot.size,
    globalMatches: stats.globalMatches,
    clubMatches: stats.clubMatches,
  });
}
