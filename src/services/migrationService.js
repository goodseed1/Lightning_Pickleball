/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  createInitialUnifiedStats,
  updateSkillLevelFromUnified,
  convertEloToLtr,
  calculateConfidence,
} from '../utils/unifiedRankingUtils';

/**
 * Service for migrating users from legacy single ranking to dual ranking system
 * Handles data structure transformation and preservation of legacy data
 */
class MigrationService {
  constructor() {
    this.migrationBatchSize = 10; // Process users in batches to avoid timeouts
  }

  /**
   * Check if user needs migration to dual ranking system
   * @param {Object} userData - User document data
   * @returns {boolean} Whether user needs migration
   */
  needsMigration(userData) {
    // User needs migration if they don't have the new dual ranking structure
    if (!userData.globalStats || !userData.skillLevel?.selfAssessed) {
      return true;
    }

    // Also check if they have legacy data that suggests incomplete migration
    if (userData.stats && !userData.migrationDate) {
      return true;
    }

    return false;
  }

  /**
   * Extract legacy skill level information from user data
   * @param {Object} userData - User document data
   * @returns {string} Self-assessed skill level range
   */
  extractLegacySkillLevel(userData) {
    // Priority order for extracting skill level:
    // 1. profile.skillLevel (most reliable)
    // 2. ltrLevel converted to range
    // 3. Default fallback

    if (userData.profile?.skillLevel) {
      // Already in range format (e.g., "3.0-3.5")
      return userData.profile.skillLevel;
    }

    if (userData.ltrLevel) {
      // Convert single NTRP value to range
      const ntrp = parseFloat(userData.ltrLevel);

      if (ntrp <= 1.5) return '1.0-1.5';
      if (ntrp <= 2.0) return '1.5-2.0';
      if (ntrp <= 2.5) return '2.0-2.5';
      if (ntrp <= 3.0) return '2.5-3.0';
      if (ntrp <= 3.5) return '3.0-3.5';
      if (ntrp <= 4.0) return '3.5-4.0';
      if (ntrp <= 4.5) return '4.0-4.5';
      if (ntrp <= 5.0) return '4.5-5.0';
      if (ntrp <= 5.5) return '5.0-5.5';
      if (ntrp <= 6.0) return '5.5-6.0';
      if (ntrp <= 6.5) return '6.0-6.5';
      return '6.5-7.0';
    }

    if (userData.profile?.ltrLevel) {
      // Fallback to profile ntrp level
      const ntrp = parseFloat(userData.profile.ltrLevel);
      return this.convertNtrpToRange(ntrp);
    }

    // Default fallback for new users
    return '3.0-3.5';
  }

  /**
   * Convert single NTRP value to range format
   * @param {number} ntrp - Single NTRP value
   * @returns {string} NTRP range
   */
  convertNtrpToRange(ntrp) {
    if (ntrp <= 1.5) return '1.0-1.5';
    if (ntrp <= 2.0) return '1.5-2.0';
    if (ntrp <= 2.5) return '2.0-2.5';
    if (ntrp <= 3.0) return '2.5-3.0';
    if (ntrp <= 3.5) return '3.0-3.5';
    if (ntrp <= 4.0) return '3.5-4.0';
    if (ntrp <= 4.5) return '4.0-4.5';
    if (ntrp <= 5.0) return '4.5-5.0';
    if (ntrp <= 5.5) return '5.0-5.5';
    if (ntrp <= 6.0) return '5.5-6.0';
    if (ntrp <= 6.5) return '6.0-6.5';
    return '6.5-7.0';
  }

  /**
   * Extract legacy statistics and convert to global stats format
   * @param {Object} userData - User document data
   * @returns {Object} GlobalStats object
   */
  extractLegacyStats(userData) {
    const legacyStats = userData.stats || {};

    // Handle different legacy field names
    const eloRating = legacyStats.eloRating || legacyStats.eloPoints || 1200;
    const wins = legacyStats.wins || 0;
    const losses = legacyStats.losses || 0;
    const totalMatches = legacyStats.totalMatches || legacyStats.matchesPlayed || wins + losses;
    const winRate =
      legacyStats.winRate || (totalMatches > 0 ? Number((wins / totalMatches).toFixed(3)) : 0);

    return {
      eloRating: Math.max(1000, eloRating), // Ensure minimum ELO
      matchesPlayed: totalMatches,
      wins,
      losses,
      winRate,
      currentStreak: legacyStats.currentStreak || 0,
      longestStreak: legacyStats.longestStreak || legacyStats.bestStreak || 0,
      lastMatchDate: userData.lastActive || new Date().toISOString(),
    };
  }

  /**
   * Migrate a single user to dual ranking system
   * @param {string} userId - User ID
   * @param {Object} userData - Current user data
   * @returns {Promise<Object>} Migration result
   */
  async migrateSingleUser(userId, userData) {
    try {
      console.log(`🔄 Migrating user ${userId} to dual ranking system`);

      // Extract legacy data
      const selfAssessed = this.extractLegacySkillLevel(userData);
      const globalStats = this.extractLegacyStats(userData);

      // Create skill level with calculated global NTRP
      const skillLevel = updateSkillLevelFromGlobal(
        {
          selfAssessed,
          lastUpdated: new Date().toISOString(),
          source: 'migration',
        },
        globalStats
      );

      // Prepare update data
      const updateData = {
        // New dual ranking structure
        globalStats,
        skillLevel,

        // Migration metadata
        migrationDate: serverTimestamp(),
        migrationVersion: '1.0',
        migrationSource: 'automatic',

        // Keep legacy data for backward compatibility during transition
        legacyData: {
          preservedStats: userData.stats,
          preservedLtrLevel: userData.ltrLevel,
          preservedProfile: userData.profile,
        },

        // Update timestamp
        updatedAt: serverTimestamp(),
      };

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updateData);

      const migrationResult = {
        userId,
        success: true,
        selfAssessed,
        calculatedGlobal: skillLevel.calculatedGlobal,
        confidence: skillLevel.globalConfidence,
        eloRating: globalStats.eloRating,
        totalMatches: globalStats.matchesPlayed,
        legacyPreserved: true,
      };

      console.log(`✅ Successfully migrated user ${userId}:`, migrationResult);
      return migrationResult;
    } catch (error) {
      console.error(`❌ Failed to migrate user ${userId}:`, error);
      return {
        userId,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all users that need migration
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} Array of users needing migration
   */
  async getUsersNeedingMigration(limit = 100) {
    try {
      console.log('🔍 Finding users that need migration...');

      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const usersNeedingMigration = [];

      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (this.needsMigration(userData)) {
          usersNeedingMigration.push({
            id: doc.id,
            data: userData,
          });
        }
      });

      console.log(`📊 Found ${usersNeedingMigration.length} users needing migration`);
      return usersNeedingMigration.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to find users needing migration:', error);
      throw error;
    }
  }

  /**
   * Perform batch migration of multiple users
   * @param {number} batchSize - Number of users to migrate in each batch
   * @returns {Promise<Object>} Batch migration results
   */
  async performBatchMigration(batchSize = this.migrationBatchSize) {
    try {
      console.log('🚀 Starting batch migration to dual ranking system...');

      const usersToMigrate = await this.getUsersNeedingMigration(batchSize);

      if (usersToMigrate.length === 0) {
        console.log('✅ No users need migration');
        return {
          totalUsers: 0,
          successful: 0,
          failed: 0,
          results: [],
        };
      }

      console.log(`📦 Migrating batch of ${usersToMigrate.length} users...`);

      const migrationPromises = usersToMigrate.map(user =>
        this.migrateSingleUser(user.id, user.data)
      );

      const results = await Promise.allSettled(migrationPromises);

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      const batchResult = {
        totalUsers: usersToMigrate.length,
        successful,
        failed,
        results: results.map(r =>
          r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
        ),
      };

      console.log('📊 Batch migration completed:', batchResult);
      return batchResult;
    } catch (error) {
      console.error('❌ Batch migration failed:', error);
      throw error;
    }
  }

  /**
   * Verify user migration was successful
   * @param {string} userId - User ID to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyUserMigration(userId) {
    try {
      console.log(`🔍 Verifying migration for user ${userId}...`);

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      const verification = {
        userId,
        hasMigrationDate: !!userData.migrationDate,
        hasGlobalStats: !!userData.globalStats,
        hasSkillLevel: !!userData.skillLevel?.selfAssessed,
        hasLegacyPreservation: !!userData.legacyData,
        isFullyMigrated: false,
      };

      // Check if fully migrated
      verification.isFullyMigrated =
        verification.hasMigrationDate && verification.hasGlobalStats && verification.hasSkillLevel;

      // Additional validation
      if (verification.hasGlobalStats) {
        const stats = userData.globalStats;
        verification.validEloRange = stats.eloRating >= 1000 && stats.eloRating <= 3000;
        verification.validMatchCount =
          typeof stats.matchesPlayed === 'number' && stats.matchesPlayed >= 0;
        verification.validWinRate =
          typeof stats.winRate === 'number' && stats.winRate >= 0 && stats.winRate <= 1;
      }

      console.log('✅ Migration verification completed:', verification);
      return verification;
    } catch (error) {
      console.error(`❌ Failed to verify migration for user ${userId}:`, error);
      return {
        userId,
        error: error.message,
        isFullyMigrated: false,
      };
    }
  }

  /**
   * Get migration statistics for the entire system
   * @returns {Promise<Object>} System-wide migration statistics
   */
  async getMigrationStatistics() {
    try {
      console.log('📊 Gathering migration statistics...');

      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      let totalUsers = 0;
      let migratedUsers = 0;
      let needsMigration = 0;
      let hasLegacyData = 0;

      snapshot.docs.forEach(doc => {
        totalUsers++;
        const userData = doc.data();

        if (userData.migrationDate) {
          migratedUsers++;
        }

        if (this.needsMigration(userData)) {
          needsMigration++;
        }

        if (userData.stats || userData.ltrLevel) {
          hasLegacyData++;
        }
      });

      const statistics = {
        totalUsers,
        migratedUsers,
        needsMigration,
        hasLegacyData,
        migrationProgress: totalUsers > 0 ? Math.round((migratedUsers / totalUsers) * 100) : 0,
        readyForMigration: needsMigration,
      };

      console.log('📈 Migration statistics:', statistics);
      return statistics;
    } catch (error) {
      console.error('❌ Failed to gather migration statistics:', error);
      throw error;
    }
  }

  /**
   * Rollback migration for a user (emergency function)
   * @param {string} userId - User ID to rollback
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackUserMigration(userId) {
    try {
      console.log(`⏪ Rolling back migration for user ${userId}...`);

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      if (!userData.legacyData) {
        throw new Error('No legacy data found to rollback to');
      }

      // Restore legacy data and remove new structure
      const rollbackData = {
        // Restore legacy fields
        ...(userData.legacyData.preservedStats && { stats: userData.legacyData.preservedStats }),
        ...(userData.legacyData.preservedLtrLevel && {
          ltrLevel: userData.legacyData.preservedLtrLevel,
        }),
        ...(userData.legacyData.preservedProfile && {
          profile: userData.legacyData.preservedProfile,
        }),

        // Remove new structure (set to null to delete fields)
        globalStats: null,
        skillLevel: null,
        migrationDate: null,
        migrationVersion: null,
        migrationSource: null,
        legacyData: null,

        // Update timestamp
        updatedAt: serverTimestamp(),
        rollbackDate: serverTimestamp(),
      };

      await updateDoc(userRef, rollbackData);

      console.log(`✅ Successfully rolled back migration for user ${userId}`);
      return {
        userId,
        success: true,
        rolledBack: true,
      };
    } catch (error) {
      console.error(`❌ Failed to rollback migration for user ${userId}:`, error);
      return {
        userId,
        success: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const migrationService = new MigrationService();

export default migrationService;
