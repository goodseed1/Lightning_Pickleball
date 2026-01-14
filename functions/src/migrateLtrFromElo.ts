/**
 * ⚡ [THOR] LPR Migration Cloud Function
 *
 * Migrates existing ELO data to the new LPR (Lightning Pickleball Rating) system.
 *
 * This function:
 * 1. Reads all users with existing ELO data
 * 2. Calculates LPR levels (1-10) from ELO scores
 * 3. Stores LPR data in user profiles for quick access
 *
 * LPR System (7-Tier):
 * - Bronze (LPR 1-2): ELO < 900
 * - Silver (LPR 3-4): ELO 900-1099
 * - Gold (LPR 5-6): ELO 1100-1299
 * - Platinum (LPR 7): ELO 1300-1449
 * - Diamond (LPR 8): ELO 1450-1599
 * - Master (LPR 9): ELO 1600-1799
 * - Legend (LPR 10): ELO 1800+
 *
 * This is a ONE-TIME migration function.
 * Run once, then can be removed from deployment.
 *
 * @author Thor (Phase 7)
 * @date 2025-12-28
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * LPR Level Thresholds (ELO-based)
 * Based on src/constants/ltr.ts
 */
const LPR_ELO_THRESHOLDS = [
  { ltr: 1, minElo: 0, maxElo: 799 },
  { ltr: 2, minElo: 800, maxElo: 899 },
  { ltr: 3, minElo: 900, maxElo: 999 },
  { ltr: 4, minElo: 1000, maxElo: 1099 },
  { ltr: 5, minElo: 1100, maxElo: 1199 },
  { ltr: 6, minElo: 1200, maxElo: 1299 },
  { ltr: 7, minElo: 1300, maxElo: 1449 },
  { ltr: 8, minElo: 1450, maxElo: 1599 },
  { ltr: 9, minElo: 1600, maxElo: 1799 },
  { ltr: 10, minElo: 1800, maxElo: Infinity },
];

/**
 * LPR Tier Information
 */
const LPR_TIERS = [
  { name: 'Bronze', levels: [1, 2], color: '#CD7F32' },
  { name: 'Silver', levels: [3, 4], color: '#C0C0C0' },
  { name: 'Gold', levels: [5, 6], color: '#FFD700' },
  { name: 'Platinum', levels: [7], color: '#E5E4E2' },
  { name: 'Diamond', levels: [8], color: '#B9F2FF' },
  { name: 'Master', levels: [9], color: '#9B59B6' },
  { name: 'Legend', levels: [10], color: '#FF6B35' },
];

interface LtrMigrationStats {
  totalUsers: number;
  usersWithElo: number;
  usersUpdated: number;
  ltrDistribution: Record<number, number>;
  tierDistribution: Record<string, number>;
  errors: number;
  errorMessages: string[];
}

interface GameTypeElo {
  elo: number;
  ltr: number;
}

interface LtrData {
  singles: GameTypeElo;
  doubles: GameTypeElo;
  mixed: GameTypeElo;
  highest: {
    elo: number;
    ltr: number;
    gameType: 'singles' | 'doubles' | 'mixed';
  };
  tier: string;
  tierColor: string;
  migratedAt: admin.firestore.Timestamp;
}

/**
 * Convert ELO to LPR level (1-10)
 */
function convertEloToLtr(elo: number): number {
  for (const threshold of LPR_ELO_THRESHOLDS) {
    if (elo >= threshold.minElo && elo <= threshold.maxElo) {
      return threshold.ltr;
    }
  }
  // Fallback: if ELO is somehow out of range
  if (elo < 0) return 1;
  if (elo > 1800) return 10;
  return 5; // Default to mid-level
}

/**
 * Get tier info from LPR level
 */
function getTierFromLtr(ltr: number): { name: string; color: string } {
  for (const tier of LPR_TIERS) {
    if (tier.levels.includes(ltr)) {
      return { name: tier.name, color: tier.color };
    }
  }
  return { name: 'Bronze', color: '#CD7F32' }; // Default
}

/**
 * Migrate LPR from ELO Cloud Function
 *
 * Security: Admin only (requires secret key)
 *
 * @param dryRun - If true, only simulate the migration without writing
 * @returns Migration statistics
 */
export const migrateLtrFromElo = onCall<{ secretKey?: string; dryRun?: boolean }>(async request => {
  const { data, auth } = request;

  // ============================================================================
  // Step 1: Security Check (Admin only)
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  // Simple secret key check
  const MIGRATION_SECRET = 'migrate-ltr-2025-thunder'; // Change this in production!
  if (data.secretKey !== MIGRATION_SECRET) {
    throw new HttpsError('permission-denied', 'Invalid secret key');
  }

  const dryRun = data.dryRun ?? false;

  logger.info(`⚡ [LPR MIGRATION] Starting LPR migration... ${dryRun ? '(DRY RUN)' : ''}`, {
    triggeredBy: auth.uid,
    dryRun,
  });

  const stats: LtrMigrationStats = {
    totalUsers: 0,
    usersWithElo: 0,
    usersUpdated: 0,
    ltrDistribution: {},
    tierDistribution: {},
    errors: 0,
    errorMessages: [],
  };

  // Initialize LPR distribution counters
  for (let i = 1; i <= 10; i++) {
    stats.ltrDistribution[i] = 0;
  }
  for (const tier of LPR_TIERS) {
    stats.tierDistribution[tier.name] = 0;
  }

  try {
    // ==========================================================================
    // Step 2: Get all users
    // ==========================================================================
    const usersSnapshot = await db.collection('users').get();
    stats.totalUsers = usersSnapshot.size;

    logger.info(`📊 [LPR MIGRATION] Found ${stats.totalUsers} users to check`);

    // ==========================================================================
    // Step 3: Process each user in batches
    // ==========================================================================
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Check if user has skillLevel with ELO data
        const skillLevel = userData.skillLevel;

        if (!skillLevel) {
          logger.debug(`⏭️ [LPR MIGRATION] User ${userId} has no skillLevel, skipping`);
          continue;
        }

        // Check for ELO data (from global rankings)
        const singlesElo = skillLevel.singlesElo || skillLevel.elo || 1000;
        const doublesElo = skillLevel.doublesElo || skillLevel.elo || 1000;
        const mixedElo = skillLevel.mixedElo || skillLevel.elo || 1000;

        // If all default, skip
        if (singlesElo === 1000 && doublesElo === 1000 && mixedElo === 1000 && !skillLevel.elo) {
          logger.debug(`⏭️ [LPR MIGRATION] User ${userId} has no ELO history, skipping`);
          continue;
        }

        stats.usersWithElo++;

        // Calculate LPR for each game type
        const singlesLtr = convertEloToLtr(singlesElo);
        const doublesLtr = convertEloToLtr(doublesElo);
        const mixedLtr = convertEloToLtr(mixedElo);

        // Find highest
        let highestElo = singlesElo;
        let highestLtr = singlesLtr;
        let highestGameType: 'singles' | 'doubles' | 'mixed' = 'singles';

        if (doublesElo > highestElo) {
          highestElo = doublesElo;
          highestLtr = doublesLtr;
          highestGameType = 'doubles';
        }
        if (mixedElo > highestElo) {
          highestElo = mixedElo;
          highestLtr = mixedLtr;
          highestGameType = 'mixed';
        }

        const tierInfo = getTierFromLtr(highestLtr);

        // Prepare LPR data
        const ltrData: LtrData = {
          singles: { elo: singlesElo, ltr: singlesLtr },
          doubles: { elo: doublesElo, ltr: doublesLtr },
          mixed: { elo: mixedElo, ltr: mixedLtr },
          highest: {
            elo: highestElo,
            ltr: highestLtr,
            gameType: highestGameType,
          },
          tier: tierInfo.name,
          tierColor: tierInfo.color,
          migratedAt: admin.firestore.Timestamp.now(),
        };

        // Update statistics
        stats.ltrDistribution[highestLtr]++;
        stats.tierDistribution[tierInfo.name]++;

        if (!dryRun) {
          // Add to batch
          const userRef = db.collection('users').doc(userId);
          batch.update(userRef, {
            'skillLevel.ltr': ltrData,
          });

          batchCount++;
          stats.usersUpdated++;

          // Commit batch if reaching limit
          if (batchCount >= batchSize) {
            await batch.commit();
            logger.info(`💾 [LPR MIGRATION] Committed batch of ${batchCount} users`);
            batch = db.batch();
            batchCount = 0;
          }
        } else {
          stats.usersUpdated++;
        }

        logger.debug(
          `✅ [LPR MIGRATION] User ${userId}: ELO ${highestElo} → LPR ${highestLtr} (${tierInfo.name})`
        );
      } catch (error) {
        stats.errors++;
        const errorMsg = `Failed to migrate user ${userId}: ${error instanceof Error ? error.message : String(error)}`;
        stats.errorMessages.push(errorMsg);
        logger.error(`❌ [LPR MIGRATION] ${errorMsg}`);
        // Continue with next user
      }
    }

    // Commit remaining batch
    if (!dryRun && batchCount > 0) {
      await batch.commit();
      logger.info(`💾 [LPR MIGRATION] Committed final batch of ${batchCount} users`);
    }

    // ==========================================================================
    // Step 4: Return Migration Stats
    // ==========================================================================
    logger.info(`⚡ [LPR MIGRATION] Migration completed ${dryRun ? '(DRY RUN)' : ''}`, {
      totalUsers: stats.totalUsers,
      usersWithElo: stats.usersWithElo,
      usersUpdated: stats.usersUpdated,
      errors: stats.errors,
    });

    return {
      success: true,
      message: dryRun ? 'Dry run completed - no changes made' : 'Migration completed successfully',
      stats,
    };
  } catch (error) {
    logger.error('❌ [LPR MIGRATION] Fatal error during migration:', error);
    throw new HttpsError(
      'internal',
      `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * Utility: Get LPR Level for a single user (for testing)
 */
export const getUserLtrLevel = onCall<{ userId: string }>(async request => {
  const { data, auth } = request;

  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  if (!data.userId) {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  try {
    const userDoc = await db.collection('users').doc(data.userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const skillLevel = userData?.skillLevel;

    if (!skillLevel) {
      return {
        userId: data.userId,
        hasData: false,
        message: 'User has no skillLevel data',
      };
    }

    // Check if LPR is already migrated
    if (skillLevel.ltr) {
      return {
        userId: data.userId,
        hasData: true,
        alreadyMigrated: true,
        ltr: skillLevel.ltr,
      };
    }

    // Calculate LPR from ELO
    const singlesElo = skillLevel.singlesElo || skillLevel.elo || 1000;
    const doublesElo = skillLevel.doublesElo || skillLevel.elo || 1000;
    const mixedElo = skillLevel.mixedElo || skillLevel.elo || 1000;

    const singlesLtr = convertEloToLtr(singlesElo);
    const doublesLtr = convertEloToLtr(doublesElo);
    const mixedLtr = convertEloToLtr(mixedElo);

    let highestElo = singlesElo;
    let highestLtr = singlesLtr;
    let highestGameType: 'singles' | 'doubles' | 'mixed' = 'singles';

    if (doublesElo > highestElo) {
      highestElo = doublesElo;
      highestLtr = doublesLtr;
      highestGameType = 'doubles';
    }
    if (mixedElo > highestElo) {
      highestElo = mixedElo;
      highestLtr = mixedLtr;
      highestGameType = 'mixed';
    }

    const tierInfo = getTierFromLtr(highestLtr);

    return {
      userId: data.userId,
      hasData: true,
      alreadyMigrated: false,
      calculated: {
        singles: { elo: singlesElo, ltr: singlesLtr },
        doubles: { elo: doublesElo, ltr: doublesLtr },
        mixed: { elo: mixedElo, ltr: mixedLtr },
        highest: {
          elo: highestElo,
          ltr: highestLtr,
          gameType: highestGameType,
        },
        tier: tierInfo.name,
        tierColor: tierInfo.color,
      },
    };
  } catch (error) {
    logger.error('❌ [LPR MIGRATION] Error getting user LPR level:', error);
    throw new HttpsError(
      'internal',
      `Failed to get LPR level: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
