import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
// Use centralized Firebase configuration
import { db, functions } from '../firebase/config';

let isFirebaseAvailable = false;

try {
  // Check if Firebase services are properly initialized
  if (db && functions) {
    isFirebaseAvailable = true;
    console.log('🔥 Firebase services loaded successfully from centralized config');
  } else {
    throw new Error('Firebase services not properly initialized');
  }
} catch (error) {
  console.warn('⚠️ Firebase not available, using mock mode:', error.message);
  isFirebaseAvailable = false;
}

/**
 * Firestore Database Service for Lightning Tennis
 * Handles all database operations for matches, clubs, users, etc.
 */
class FirestoreService {
  constructor() {
    console.log('🔥 FirestoreService initialized');
  }

  // ============ LIGHTNING MATCHES & MEETUPS ============

  /**
   * Get all lightning events from Firestore
   * @param {Object} options - Filter options
   * @param {'all' | 'upcoming' | 'completed'} options.status - Filter by event status
   * @returns {Promise<Array>} Array of all events
   */
  async getAllLightningEvents(options = {}) {
    try {
      // ✅ Firebase 연결 강제 시도 - Mock 데이터 사용 중단
      if (!isFirebaseAvailable || !db) {
        console.error('❌ Firebase not available - returning empty array instead of mock data');
        console.log('   1. Firebase 설정 파일 (.env 또는 firebase config)');
        console.log('   2. 인터넷 연결 상태');
        console.log('   3. Firebase 프로젝트 활성화 상태');
        return []; // Mock 데이터 대신 빈 배열 반환
      }

      const { status = 'upcoming' } = options; // Default to upcoming events only

      console.log(`📱 Getting ${status} lightning events from Firestore...`);
      const eventsRef = collection(db, 'events');

      let q;
      if (status === 'all') {
        // Get all events regardless of status
        q = query(eventsRef, orderBy('createdAt', 'desc'));
      } else {
        // Filter by specific status
        q = query(eventsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);

      const events = [];
      querySnapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`📊 Found ${events.length} ${status} events in Firestore`);
      return events;
    } catch (error) {
      console.error('❌ Error getting all lightning events:', error);
      console.error('🔧 Firebase 연결 오류 - 실제 연결을 위해 다음을 확인하세요:');
      console.error('   - Firebase 프로젝트 설정');
      console.error('   - Firestore 보안 규칙');
      console.error('   - 네트워크 연결 상태');
      return []; // Mock 데이터 대신 빈 배열 반환
    }
  }

  /**
   * Get events hosted by specific user
   * @param {string} userId - User ID
   * @param {Object} options - Filter options
   * @param {'all' | 'upcoming' | 'completed'} options.status - Filter by event status
   * @returns {Promise<Array>} Array of hosted events
   */
  async getHostedEvents(userId, options = {}) {
    try {
      // ✅ Firebase 연결 강제 시도 - Mock 데이터 사용 중단
      if (!isFirebaseAvailable || !db) {
        console.error('❌ Firebase not available for hosted events - returning empty array');
        console.log('   1. Firebase 설정 파일 (.env 또는 firebase config)');
        console.log('   2. 인터넷 연결 상태');
        console.log('   3. Firebase 프로젝트 활성화 상태');
        return []; // Mock 데이터 대신 빈 배열 반환
      }

      const { status = 'upcoming' } = options; // Default to upcoming events only

      console.log(`📱 Getting ${status} hosted events for user: ${userId}`);
      const eventsRef = collection(db, 'events');

      let q;
      if (status === 'all') {
        // Get all hosted events regardless of status
        q = query(eventsRef, where('hostId', '==', userId), orderBy('createdAt', 'desc'));
      } else {
        // Filter by specific status
        q = query(
          eventsRef,
          where('hostId', '==', userId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);

      const events = [];
      querySnapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`📊 Found ${events.length} ${status} hosted events for user ${userId}`);
      return events;
    } catch (error) {
      console.error('❌ Error getting hosted events:', error);
      console.error('🔧 Firebase 연결 오류 - 실제 연결을 위해 다음을 확인하세요:');
      console.error('   - Firebase 프로젝트 설정');
      console.error('   - Firestore 보안 규칙');
      console.error('   - 네트워크 연결 상태');
      return []; // Mock 데이터 대신 빈 배열 반환
    }
  }

  /**
   * Get events where user has applied (is in participants array)
   * @param {string} userId - User ID
   * @param {Object} options - Filter options
   * @param {'all' | 'upcoming' | 'completed'} options.status - Filter by event status
   * @returns {Promise<Array>} Array of applied events
   */
  async getAppliedEvents(userId, options = {}) {
    try {
      // ✅ Firebase 연결 강제 시도 - Mock 데이터 사용 중단
      if (!isFirebaseAvailable || !db) {
        console.error('❌ Firebase not available for applied events - returning empty array');
        console.log('   1. Firebase 설정 파일 (.env 또는 firebase config)');
        console.log('   2. 인터넷 연결 상태');
        console.log('   3. Firebase 프로젝트 활성화 상태');
        return []; // Mock 데이터 대신 빈 배열 반환
      }

      const { status = 'upcoming' } = options; // Default to upcoming events only

      console.log(`📱 Getting ${status} applied events for user: ${userId}`);
      const eventsRef = collection(db, 'events');

      // Try multiple field names for participants
      const possibleFields = ['participants', 'participantIds', 'attendees'];
      let events = [];

      for (const fieldName of possibleFields) {
        try {
          console.log(`🔍 Trying to query with field: ${fieldName} and status: ${status}`);

          let q;
          if (status === 'all') {
            // Get all applied events regardless of status
            q = query(
              eventsRef,
              where(fieldName, 'array-contains', userId),
              orderBy('createdAt', 'desc')
            );
          } else {
            // Filter by specific status
            q = query(
              eventsRef,
              where(fieldName, 'array-contains', userId),
              where('status', '==', status),
              orderBy('createdAt', 'desc')
            );
          }

          const querySnapshot = await getDocs(q);

          querySnapshot.forEach(doc => {
            events.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          if (events.length > 0) {
            console.log(
              `✅ Found ${events.length} ${status} applied events using field: ${fieldName}`
            );
            break; // Found events, stop trying other fields
          }
        } catch (fieldError) {
          console.log(`⚠️ Field ${fieldName} query failed:`, fieldError.message);
          continue; // Try next field
        }
      }

      console.log(`📊 Total ${status} applied events found for user ${userId}: ${events.length}`);
      return events;
    } catch (error) {
      console.error('❌ Error getting applied events:', error);
      console.error('🔧 Firebase 연결 오류 - 실제 연결을 위해 다음을 확인하세요:');
      console.error('   - Firebase 프로젝트 설정');
      console.error('   - Firestore 보안 규칙');
      console.error('   - 네트워크 연결 상태');
      return []; // Mock 데이터 대신 빈 배열 반환
    }
  }

  /**
   * Create a new lightning match or meetup (using Cloud Function)
   * @param {Object} eventData - Event data
   * @param {'match' | 'meetup'} type - Type of event (match for ranked, meetup for casual)
   * @returns {Promise<Object>} Created event result
   */
  async createLightningEvent(eventData, type) {
    try {
      // Validate type
      if (!['match', 'meetup'].includes(type)) {
        throw new Error('Invalid event type. Must be "match" or "meetup"');
      }

      // Use Cloud Function for enhanced processing
      if (functions) {
        const createEventFunction = httpsCallable(functions, 'createLightningEvent');
        const result = await createEventFunction({ eventData, type });
        console.log(`✅ Lightning ${type} created via Cloud Function:`, result.data.eventId);
        return result.data;
      }

      // Fallback to direct Firestore write if functions not available
      const matchesRef = collection(db, 'lightning_matches');
      const docRef = await addDoc(matchesRef, {
        ...eventData,
        type, // Add the type field
        isRanked: type === 'match', // Ranked only for matches
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        participantCount: 1, // Host is first participant
      });

      console.log(`✅ Lightning ${type} created (fallback):`, docRef.id);
      return {
        success: true,
        eventId: docRef.id,
        type,
        isRanked: type === 'match',
      };
    } catch (error) {
      console.error(`❌ Failed to create lightning ${type}:`, error);
      throw error;
    }
  }

  /**
   * Create a new lightning match (legacy - for backward compatibility)
   * @deprecated Use createLightningEvent instead
   * @param {Object} matchData - Match data
   * @returns {Promise<string>} Created match ID
   */
  async createLightningMatch(matchData) {
    console.warn('⚠️ createLightningMatch is deprecated. Use createLightningEvent instead.');
    return this.createLightningEvent(matchData, 'match');
  }

  /**
   * Get nearby lightning events (matches and/or meetups)
   * @param {Object} location - User location {lat, lng}
   * @param {number} radiusMiles - Search radius in miles
   * @param {Object} options - Filter options
   * @param {'all' | 'match' | 'meetup'} options.type - Filter by event type
   * @returns {Promise<Array>} Array of nearby events
   */
  async getNearbyLightningEvents(location, radiusMiles = 20, options = {}) {
    try {
      const { type = 'all' } = options;
      const matchesRef = collection(db, 'lightning_matches');

      // Build query based on type filter
      let q;
      if (type === 'all') {
        q = query(
          matchesRef,
          where('status', '==', 'active'),
          where('scheduledTime', '>', new Date()),
          orderBy('scheduledTime', 'asc'),
          limit(50)
        );
      } else {
        q = query(
          matchesRef,
          where('status', '==', 'active'),
          where('type', '==', type),
          where('scheduledTime', '>', new Date()),
          orderBy('scheduledTime', 'asc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const events = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        // Calculate distance using Haversine formula
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          data.location.lat,
          data.location.lng
        );

        if (distance <= radiusMiles) {
          events.push({
            id: doc.id,
            ...data,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          });
        }
      });

      console.log(`✅ Found ${events.length} nearby ${type === 'all' ? 'events' : type + 's'}`);
      return events;
    } catch (error) {
      console.error('❌ Failed to get nearby events:', error);
      throw error;
    }
  }

  /**
   * Get nearby lightning matches (legacy - for backward compatibility)
   * @deprecated Use getNearbyLightningEvents instead
   * @param {Object} location - User location {lat, lng}
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Promise<Array>} Array of nearby matches
   */
  async getNearbyLightningMatches(location, radiusMiles = 20) {
    console.warn(
      '⚠️ getNearbyLightningMatches is deprecated. Use getNearbyLightningEvents instead.'
    );
    return this.getNearbyLightningEvents(location, radiusMiles, { type: 'match' });
  }

  /**
   * Join a lightning match
   * @param {string} matchId - Match ID to join
   * @param {string} userId - User ID joining
   * @returns {Promise} Join operation promise
   */
  async joinLightningMatch(matchId, userId) {
    try {
      const matchRef = doc(db, 'lightning_matches', matchId);

      await runTransaction(db, async transaction => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error('Match not found');
        }

        const matchData = matchDoc.data();
        const currentParticipants = matchData.participantIds || [];

        if (currentParticipants.includes(userId)) {
          throw new Error('Already joined this match');
        }

        if (currentParticipants.length >= matchData.maxParticipants) {
          throw new Error('Match is full');
        }

        transaction.update(matchRef, {
          participantIds: arrayUnion(userId),
          participantCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Successfully joined match');
    } catch (error) {
      console.error('❌ Failed to join match:', error);
      throw error;
    }
  }

  /**
   * Leave a lightning match
   * @param {string} matchId - Match ID to leave
   * @param {string} userId - User ID leaving
   * @returns {Promise} Leave operation promise
   */
  async leaveLightningMatch(matchId, userId) {
    try {
      const matchRef = doc(db, 'lightning_matches', matchId);

      await updateDoc(matchRef, {
        participantIds: arrayRemove(userId),
        participantCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Successfully left match');
    } catch (error) {
      console.error('❌ Failed to leave match:', error);
      throw error;
    }
  }

  // ============ TENNIS CLUBS ============

  /**
   * Create a new tennis club
   * @param {Object} clubData - Club data
   * @returns {Promise<string>} Created club ID
   */
  async createTennisClub(clubData) {
    try {
      const clubsRef = collection(db, 'tennis_clubs');
      const docRef = await addDoc(clubsRef, {
        ...clubData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberCount: 1, // Creator is first member
      });

      console.log('✅ Tennis club created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to create tennis club:', error);
      throw error;
    }
  }

  /**
   * Get clubs near location
   * @param {Object} location - User location {lat, lng}
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Promise<Array>} Array of nearby clubs
   */
  async getNearbyClubs(location, radiusMiles = 30) {
    try {
      const clubsRef = collection(db, 'tennis_clubs');
      const q = query(clubsRef, where('isPublic', '==', true), orderBy('memberCount', 'desc'));

      const snapshot = await getDocs(q);
      const clubs = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const distance = this.calculateDistance(
          location.lat,
          location.lng,
          data.location.lat,
          data.location.lng
        );

        if (distance <= radiusMiles) {
          clubs.push({
            id: doc.id,
            ...data,
            distance: Math.round(distance * 10) / 10,
          });
        }
      });

      console.log(`✅ Found ${clubs.length} nearby clubs`);
      return clubs;
    } catch (error) {
      console.error('❌ Failed to get nearby clubs:', error);
      throw error;
    }
  }

  /**
   * Join a tennis club
   * @param {string} clubId - Club ID to join
   * @param {string} userId - User ID joining
   * @returns {Promise} Join operation promise
   */
  async joinTennisClub(clubId, userId) {
    try {
      const clubRef = doc(db, 'tennis_clubs', clubId);

      await runTransaction(db, async transaction => {
        const clubDoc = await transaction.get(clubRef);

        if (!clubDoc.exists()) {
          throw new Error('Club not found');
        }

        const clubData = clubDoc.data();
        const currentMembers = clubData.memberIds || [];

        if (currentMembers.includes(userId)) {
          throw new Error('Already a member of this club');
        }

        transaction.update(clubRef, {
          memberIds: arrayUnion(userId),
          memberCount: increment(1),
          updatedAt: serverTimestamp(),
        });

        // Add to user's clubs
        const userRef = doc(db, 'users', userId);
        transaction.update(userRef, {
          'clubs.memberships': arrayUnion(clubId),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Successfully joined club');
    } catch (error) {
      console.error('❌ Failed to join club:', error);
      throw error;
    }
  }

  // ============ CLUB EVENTS ============

  /**
   * Create a club event
   * @param {Object} eventData - Event data
   * @returns {Promise<string>} Created event ID
   */
  async createClubEvent(eventData) {
    try {
      const eventsRef = collection(db, 'club_events');
      const docRef = await addDoc(eventsRef, {
        ...eventData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attendeeCount: 0,
      });

      console.log('✅ Club event created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to create club event:', error);
      throw error;
    }
  }

  /**
   * Get club events
   * @param {string} clubId - Club ID
   * @returns {Promise<Array>} Array of club events
   */
  async getClubEvents(clubId) {
    try {
      const eventsRef = collection(db, 'club_events');
      const q = query(
        eventsRef,
        where('clubId', '==', clubId),
        where('dateTime', '>', new Date()),
        orderBy('dateTime', 'asc')
      );

      const snapshot = await getDocs(q);
      const events = [];

      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`✅ Found ${events.length} club events`);
      return events;
    } catch (error) {
      console.error('❌ Failed to get club events:', error);
      throw error;
    }
  }

  // ============ REAL-TIME LISTENERS ============

  /**
   * Listen to lightning matches updates
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeLightningMatches(callback) {
    const matchesRef = collection(db, 'lightning_matches');
    const q = query(
      matchesRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, snapshot => {
      const matches = [];
      snapshot.forEach(doc => {
        matches.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(matches);
    });
  }

  /**
   * Listen to user's club events
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeUserClubEvents(userId, callback) {
    // This is a complex query that would need to be optimized
    // For now, we'll get user clubs first, then listen to their events
    const eventsRef = collection(db, 'club_events');
    const q = query(
      eventsRef,
      where('dateTime', '>', new Date()),
      orderBy('dateTime', 'asc'),
      limit(50)
    );

    return onSnapshot(q, snapshot => {
      const events = [];
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(events);
    });
  }

  // ============ USER STATISTICS ============

  /**
   * Update user match statistics
   * @param {string} userId - User ID
   * @param {boolean} won - Whether user won the match
   * @returns {Promise} Update promise
   */
  async updateUserStats(userId, won) {
    try {
      const userRef = doc(db, 'users', userId);

      await runTransaction(db, async transaction => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentStats = userData.stats || {};

        const newStats = {
          matchesPlayed: (currentStats.matchesPlayed || 0) + 1,
          wins: won ? (currentStats.wins || 0) + 1 : currentStats.wins || 0,
          losses: won ? currentStats.losses || 0 : (currentStats.losses || 0) + 1,
        };

        newStats.winRate =
          newStats.matchesPlayed > 0
            ? Math.round((newStats.wins / newStats.matchesPlayed) * 100) / 100
            : 0;

        transaction.update(userRef, {
          stats: newStats,
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ User stats updated');
    } catch (error) {
      console.error('❌ Failed to update user stats:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} Distance in miles
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) *
        Math.cos(this.degToRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  degToRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Batch update multiple documents
   * @param {Array} updates - Array of update operations
   * @returns {Promise} Batch update promise
   */
  async batchUpdate(updates) {
    try {
      const batch = writeBatch(db);

      updates.forEach(update => {
        const docRef = doc(db, update.collection, update.id);
        batch.update(docRef, update.data);
      });

      await batch.commit();
      console.log('✅ Batch update completed');
    } catch (error) {
      console.error('❌ Batch update failed:', error);
      throw error;
    }
  }

  /**
   * Delete document
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @returns {Promise} Delete promise
   */
  async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      console.log(`✅ Document deleted from ${collectionName}`);
    } catch (error) {
      console.error(`❌ Failed to delete document from ${collectionName}:`, error);
      throw error;
    }
  }

  // ==========================================
  // ✅ MOCK DATA METHODS 완전 제거됨
  // 모든 Mock 데이터 메서드가 제거되었습니다.
  // Firebase 연결 실패 시 빈 배열([])을 반환합니다.
  // ==========================================
}

// Create singleton instance
const firestoreService = new FirestoreService();

export default firestoreService;
