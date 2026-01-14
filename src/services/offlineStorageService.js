/**
 * Offline Storage Service for Lightning Pickleball
 * Handles offline data storage and synchronization when connection is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline Storage Service Class
 * Manages offline club data and sync queue
 */
class OfflineStorageService {
  constructor() {
    this.OFFLINE_CLUBS_KEY = '@offline_clubs';
    this.SYNC_QUEUE_KEY = '@sync_queue';
    console.log('💾 OfflineStorageService initialized');
  }

  /**
   * Store club data offline
   * @param {string} clubId - Offline club ID
   * @param {Object} clubData - Club data to store
   * @returns {Promise<boolean>} Success status
   */
  async storeOfflineClub(clubId, clubData) {
    try {
      console.log('💾 Storing offline club:', clubId);

      // Get existing offline clubs
      const existingClubs = await this.getOfflineClubs();

      // Add new club data
      const updatedClubs = {
        ...existingClubs,
        [clubId]: {
          ...clubData,
          id: clubId,
          storedAt: new Date().toISOString(),
          isOffline: true,
          needsSync: true,
        },
      };

      // Store updated clubs
      await AsyncStorage.setItem(this.OFFLINE_CLUBS_KEY, JSON.stringify(updatedClubs));

      // Add to sync queue
      await this.addToSyncQueue({
        type: 'CREATE_CLUB',
        clubId: clubId,
        data: clubData,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Offline club stored successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to store offline club:', error);
      return false;
    }
  }

  /**
   * Get all offline clubs
   * @returns {Promise<Object>} Object containing offline clubs
   */
  async getOfflineClubs() {
    try {
      const storedClubs = await AsyncStorage.getItem(this.OFFLINE_CLUBS_KEY);
      return storedClubs ? JSON.parse(storedClubs) : {};
    } catch (error) {
      console.error('❌ Failed to get offline clubs:', error);
      return {};
    }
  }

  /**
   * Get specific offline club
   * @param {string} clubId - Club ID to retrieve
   * @returns {Promise<Object|null>} Club data or null
   */
  async getOfflineClub(clubId) {
    try {
      const offlineClubs = await this.getOfflineClubs();
      return offlineClubs[clubId] || null;
    } catch (error) {
      console.error('❌ Failed to get offline club:', error);
      return null;
    }
  }

  /**
   * Add item to sync queue
   * @param {Object} syncItem - Item to sync when online
   * @returns {Promise<boolean>} Success status
   */
  async addToSyncQueue(syncItem) {
    try {
      const existingQueue = await this.getSyncQueue();
      const updatedQueue = [...existingQueue, syncItem];

      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log('📤 Added item to sync queue:', syncItem.type);
      return true;
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
      return false;
    }
  }

  /**
   * Get sync queue
   * @returns {Promise<Array>} Array of items waiting to sync
   */
  async getSyncQueue() {
    try {
      const storedQueue = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      return storedQueue ? JSON.parse(storedQueue) : [];
    } catch (error) {
      console.error('❌ Failed to get sync queue:', error);
      return [];
    }
  }

  /**
   * Process sync queue when online
   * @param {Object} services - Service instances for syncing
   * @returns {Promise<Object>} Sync results
   */
  async processSyncQueue(services = {}) {
    try {
      console.log('🔄 Processing sync queue...');

      const syncQueue = await this.getSyncQueue();
      const results = {
        success: [],
        failed: [],
        total: syncQueue.length,
      };

      if (syncQueue.length === 0) {
        console.log('✅ Sync queue is empty');
        return results;
      }

      for (const item of syncQueue) {
        try {
          await this.processSyncItem(item, services);
          results.success.push(item);
          console.log('✅ Synced:', item.type, item.clubId);
        } catch (error) {
          console.error('❌ Failed to sync item:', item, error);
          results.failed.push({ item, error: error.message });
        }
      }

      // Remove successfully synced items from queue
      const failedItems = results.failed.map(f => f.item);
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(failedItems));

      console.log(`🔄 Sync complete: ${results.success.length}/${results.total} successful`);
      return results;
    } catch (error) {
      console.error('❌ Failed to process sync queue:', error);
      return { success: [], failed: [], total: 0, error: error.message };
    }
  }

  /**
   * Process individual sync item
   * @param {Object} item - Sync item to process
   * @param {Object} services - Service instances
   * @returns {Promise<void>}
   */
  async processSyncItem(item, services) {
    const { clubService } = services;

    switch (item.type) {
      case 'CREATE_CLUB':
        if (clubService) {
          // Try to create club on Firebase
          const result = await clubService.createClub(item.data);

          // Update offline club with Firebase ID
          if (result) {
            await this.updateOfflineClubWithFirebaseId(item.clubId, result);
          }
        }
        break;

      default:
        console.warn('⚠️ Unknown sync item type:', item.type);
    }
  }

  /**
   * Update offline club with Firebase ID after successful sync
   * @param {string} offlineClubId - Offline club ID
   * @param {string} firebaseClubId - Firebase club ID
   * @returns {Promise<boolean>} Success status
   */
  async updateOfflineClubWithFirebaseId(offlineClubId, firebaseClubId) {
    try {
      const offlineClubs = await this.getOfflineClubs();

      if (offlineClubs[offlineClubId]) {
        offlineClubs[offlineClubId] = {
          ...offlineClubs[offlineClubId],
          firebaseId: firebaseClubId,
          needsSync: false,
          syncedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(this.OFFLINE_CLUBS_KEY, JSON.stringify(offlineClubs));
        console.log('✅ Updated offline club with Firebase ID');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to update offline club:', error);
      return false;
    }
  }

  /**
   * Check if network is available (simple check)
   * @returns {Promise<boolean>} Network availability
   */
  async isOnline() {
    try {
      // Simple fetch test to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all offline data (for testing or reset)
   * @returns {Promise<boolean>} Success status
   */
  async clearOfflineData() {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_CLUBS_KEY);
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
      console.log('🗑️ Cleared all offline data');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      return false;
    }
  }

  /**
   * Get offline storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const offlineClubs = await this.getOfflineClubs();
      const syncQueue = await this.getSyncQueue();

      const stats = {
        offlineClubsCount: Object.keys(offlineClubs).length,
        syncQueueCount: syncQueue.length,
        needsSyncCount: Object.values(offlineClubs).filter(club => club.needsSync).length,
        totalStorageItems: Object.keys(offlineClubs).length + syncQueue.length,
      };

      console.log('📊 Offline storage stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        offlineClubsCount: 0,
        syncQueueCount: 0,
        needsSyncCount: 0,
        totalStorageItems: 0,
      };
    }
  }
}

// Create singleton instance
const offlineStorageService = new OfflineStorageService();

export default offlineStorageService;
