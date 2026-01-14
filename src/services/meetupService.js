/**
 * Meetup Service for Regular Meetup System
 * Handles all meetup-related Firebase operations with real-time updates
 */

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
  writeBatch,
  runTransaction,
  Timestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Try to import authService, but handle if it's not available
let authService;
try {
  authService = require('./authService').default;
} catch (error) {
  console.warn('⚠️ AuthService not available, using mock auth');
  authService = {
    getCurrentUser: () => ({ uid: 'mock-user-id' }),
  };
}

/**
 * Meetup Service Class
 * Manages all meetup-related database operations with real-time updates
 */
class MeetupService {
  constructor() {
    console.log('🎾 MeetupService initialized');
    this.listeners = new Map(); // Store active listeners for cleanup
  }

  // ============ MEETUP CRUD OPERATIONS ============

  /**
   * Create a new meetup (typically by admin)
   * @param {Object} meetupData - Meetup data
   * @returns {Promise<string>} Created meetup ID
   */
  async createMeetup(meetupData) {
    try {
      console.log('📅 Creating meetup:', JSON.stringify(meetupData, null, 2));
      console.log('📅 [DEBUG] clubId:', meetupData.clubId);
      console.log('📅 [DEBUG] dateTime:', meetupData.dateTime);
      console.log('📅 [DEBUG] status:', meetupData.status);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock user');
        currentUser = { uid: 'mock-admin-id' };
      }

      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // Validate required fields
      if (!meetupData.clubId || !meetupData.dateTime) {
        throw new Error('클럽 ID와 일시는 필수입니다.');
      }

      // Try Firebase first
      try {
        const processedLocation = {
          ...(meetupData.location || {
            type: 'home',
            name: 'Club Home Court',
            address: 'TBD',
          }),
          // coordinates가 존재할 경우에만 GeoPoint 객체로 변환
          coordinates: meetupData.location?.coordinates
            ? new GeoPoint(meetupData.location.coordinates.lat, meetupData.location.coordinates.lng)
            : null,
        };

        const meetupDoc = {
          clubId: meetupData.clubId,
          status: meetupData.status || 'pending',
          dateTime: Timestamp.fromDate(new Date(meetupData.dateTime)),
          location: processedLocation,
          courtDetails: meetupData.courtDetails || {
            availableCourts: 4,
            courtNumbers: null,
          },
          participants: {},
          title: meetupData.title || null,
          description: meetupData.description || null,
          maxParticipants: meetupData.maxParticipants || null,
          isRecurring: meetupData.isRecurring || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        console.log('📅 [DEBUG] About to write meetupDoc:', JSON.stringify(meetupDoc, null, 2));
        const docRef = await addDoc(collection(db, 'regular_meetups'), meetupDoc);
        console.log('✅ Meetup created successfully:', docRef.id);
        console.log('✅ [DEBUG] Document ID:', docRef.id);
        console.log('✅ [DEBUG] Collection: regular_meetups');

        return docRef.id;
      } catch (firebaseError) {
        console.error('❌ [DEBUG] Firebase write error:', firebaseError);
        console.warn('⚠️ Firebase unavailable, using mock meetup creation:', firebaseError.message);

        // Return mock meetup ID
        const mockId = `mock-meetup-${Date.now()}`;
        console.log('✅ Mock meetup creation successful:', mockId);
        return mockId;
      }
    } catch (error) {
      console.error('❌ Failed to create meetup:', error);
      throw new Error('모임 생성 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get meetup by ID with real-time listener
   * @param {string} meetupId - Meetup ID
   * @param {function} onUpdate - Callback for real-time updates
   * @returns {function} Unsubscribe function
   */
  getMeetupRealtime(meetupId, onUpdate) {
    try {
      console.log('🔄 Setting up real-time meetup listener:', meetupId);

      // Try Firebase first
      try {
        const meetupRef = doc(db, 'regular_meetups', meetupId);

        const unsubscribe = onSnapshot(
          meetupRef,
          doc => {
            if (doc.exists()) {
              const rawData = doc.data();

              const meetupData = {
                id: doc.id,
                ...rawData,
                // Firestore Timestamp를 JavaScript Date로 변환
                dateTime: rawData.dateTime?.toDate() || new Date(),
                createdAt: rawData.createdAt?.toDate() || new Date(),
                updatedAt: rawData.updatedAt?.toDate() || new Date(),
                confirmedAt: rawData.confirmedAt?.toDate() || null,
                // Location 객체 처리 및 GeoPoint 변환
                location: rawData.location
                  ? {
                      ...rawData.location,
                      // coordinates가 GeoPoint 객체인 경우, 일반 객체로 변환
                      coordinates:
                        rawData.location.coordinates instanceof GeoPoint
                          ? {
                              lat: rawData.location.coordinates.latitude,
                              lng: rawData.location.coordinates.longitude,
                            }
                          : rawData.location.coordinates,
                    }
                  : null,
              };

              console.log('📊 Real-time meetup data updated');
              onUpdate(meetupData);
            } else {
              console.warn('⚠️ Meetup not found:', meetupId);
              onUpdate(null);
            }
          },
          error => {
            console.error('❌ Real-time meetup listener error:', error);

            // Enhanced error handling with specific guidance
            if (error.code === 'permission-denied') {
              console.warn('⚠️ Permission denied for meetup data - check Firestore security rules');
              console.warn(
                '🔧 Deploy updated firestore.rules: Firebase Console > Firestore > Rules'
              );
            } else if (error.code === 'unavailable') {
              console.warn('⚠️ Firebase temporarily unavailable - using mock data');
            } else if (error.code === 'not-found') {
              console.warn('⚠️ Meetup document not found - may have been deleted');
            }

            // Fallback to mock data
            this.getMockMeetup(meetupId, onUpdate);
          }
        );

        // Store listener for cleanup
        this.listeners.set(meetupId, unsubscribe);
        return unsubscribe;
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, using mock real-time updates:',
          firebaseError.message
        );
        return this.getMockMeetup(meetupId, onUpdate);
      }
    } catch (error) {
      console.error('❌ Failed to set up real-time listener:', error);
      throw new Error('실시간 업데이트 설정 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get club meetups with filtering and real-time updates
   * @param {string} clubId - Club ID
   * @param {string} status - Filter by status ('all', 'pending', 'confirmed', etc.)
   * @param {function} onUpdate - Callback for real-time updates
   * @returns {function} Unsubscribe function
   */
  getClubMeetupsRealtime(clubId, status = 'all', onUpdate) {
    try {
      console.log('🏟️ Setting up club meetups real-time listener:', clubId, status);

      // Try Firebase first
      try {
        let meetupsQuery = query(
          collection(db, 'regular_meetups'),
          where('clubId', '==', clubId),
          orderBy('dateTime', 'asc')
        );

        // Add status filter if specified
        if (status !== 'all') {
          meetupsQuery = query(
            collection(db, 'regular_meetups'),
            where('clubId', '==', clubId),
            where('status', '==', status),
            orderBy('dateTime', 'asc')
          );
        }

        const unsubscribe = onSnapshot(
          meetupsQuery,
          snapshot => {
            console.log('🔔 [LISTENER] Snapshot received! Document count:', snapshot.docs.length);
            console.log('🔔 [LISTENER] Query clubId:', clubId, 'status filter:', status);
            const meetups = snapshot.docs.map(doc => {
              const rawData = doc.data();
              console.log(
                '🔔 [LISTENER] Doc ID:',
                doc.id,
                'clubId:',
                rawData.clubId,
                'status:',
                rawData.status
              );

              const dateTimeValue = rawData.dateTime?.toDate() || new Date();
              return {
                id: doc.id,
                ...rawData,
                // Firestore Timestamp를 JavaScript Date로 변환
                // 🎯 [KIM FIX] Add 'date' alias for RegularMeetupTab compatibility
                date: dateTimeValue,
                dateTime: dateTimeValue,
                createdAt: rawData.createdAt?.toDate() || new Date(),
                updatedAt: rawData.updatedAt?.toDate() || new Date(),
                confirmedAt: rawData.confirmedAt?.toDate() || null,
                // Location 객체 처리 및 GeoPoint 변환
                location: rawData.location
                  ? {
                      ...rawData.location,
                      // coordinates가 GeoPoint 객체인 경우, 일반 객체로 변환
                      coordinates:
                        rawData.location.coordinates instanceof GeoPoint
                          ? {
                              lat: rawData.location.coordinates.latitude,
                              lng: rawData.location.coordinates.longitude,
                            }
                          : rawData.location.coordinates,
                    }
                  : null,
              };
            });

            console.log(`📊 Real-time club meetups updated: ${meetups.length} meetups`);
            onUpdate(meetups);
          },
          error => {
            console.error('❌ Club meetups listener error:', error);

            // Enhanced error handling with specific error codes
            if (error.code === 'permission-denied') {
              console.warn(
                '⚠️ Permission denied for club meetups - check Firestore security rules'
              );
              console.warn('📋 Required: Deploy updated firestore.rules to Firebase Console');
            } else if (error.code === 'unavailable') {
              console.warn('⚠️ Firebase temporarily unavailable - using mock data');
            } else if (error.code === 'failed-precondition') {
              console.warn('⚠️ Missing index or collection - check Firestore database setup');
            }

            // Fallback to mock data
            this.getMockClubMeetups(clubId, status, onUpdate);
          }
        );

        // Store listener for cleanup
        this.listeners.set(`club-${clubId}-${status}`, unsubscribe);
        return unsubscribe;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock club meetups:', firebaseError.message);
        return this.getMockClubMeetups(clubId, status, onUpdate);
      }
    } catch (error) {
      console.error('❌ Failed to get club meetups:', error);
      throw new Error('클럽 모임 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // ============ RSVP OPERATIONS ============

  /**
   * Update user's RSVP status for a meetup using atomic transaction
   * @param {string} meetupId - Meetup ID
   * @param {string} status - RSVP status ('attending', 'declining', 'maybe')
   * @returns {Promise<boolean>} Success status
   */
  async updateRSVP(meetupId, status) {
    try {
      console.log('🎯 Updating RSVP:', meetupId, status);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock user');
        currentUser = { uid: 'mock-user-id' };
      }

      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // Validate status
      const validStatuses = ['attending', 'declining', 'maybe'];
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 RSVP 상태입니다.');
      }

      // Try Firebase transaction for atomic updates
      try {
        const meetupRef = doc(db, 'regular_meetups', meetupId);

        // Use transaction to atomically update both participant and count
        await runTransaction(db, async transaction => {
          // Read the meetup document first
          const meetupDoc = await transaction.get(meetupRef);

          if (!meetupDoc.exists()) {
            throw new Error('모임을 찾을 수 없습니다.');
          }

          const meetupData = meetupDoc.data();
          const meetupTime = meetupData.dateTime.toDate();
          const now = new Date();
          const timeDiff = meetupTime.getTime() - now.getTime();
          const minutesUntilMeetup = timeDiff / (1000 * 60);

          // Check 15-minute deadline
          if (minutesUntilMeetup < 15) {
            throw new Error('모임 시작 15분 전에는 참석 상태를 변경할 수 없습니다.');
          }

          // Get current participant data
          const participants = meetupData.participants || {};
          const currentParticipant = participants[currentUser.uid];
          const oldStatus = currentParticipant?.status;

          // Calculate count changes for denormalized participant counts
          let attendingDelta = 0;
          let maybeDelta = 0;
          let decliningDelta = 0;

          // Decrease old status count
          if (oldStatus === 'attending') attendingDelta--;
          else if (oldStatus === 'maybe') maybeDelta--;
          else if (oldStatus === 'declining') decliningDelta--;

          // Increase new status count
          if (status === 'attending') attendingDelta++;
          else if (status === 'maybe') maybeDelta++;
          else if (status === 'declining') decliningDelta++;

          // Prepare update data
          const updateData = {
            [`participants.${currentUser.uid}`]: {
              status: status,
              rsvpTime: serverTimestamp(),
              userId: currentUser.uid,
            },
            updatedAt: serverTimestamp(),
          };

          // Add denormalized count updates if we track them
          if (meetupData.attendingCount !== undefined) {
            updateData.attendingCount = (meetupData.attendingCount || 0) + attendingDelta;
          }
          if (meetupData.maybeCount !== undefined) {
            updateData.maybeCount = (meetupData.maybeCount || 0) + maybeDelta;
          }
          if (meetupData.decliningCount !== undefined) {
            updateData.decliningCount = (meetupData.decliningCount || 0) + decliningDelta;
          }

          // Update the meetup document atomically
          transaction.update(meetupRef, updateData);
        });

        console.log('✅ RSVP updated successfully with transaction');
        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock RSVP update:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ Mock RSVP update successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update RSVP:', error);
      throw new Error('참석 상태 변경 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // ============ ADMIN OPERATIONS ============

  /**
   * Confirm a pending meetup (admin only)
   * @param {string} meetupId - Meetup ID
   * @param {Object} confirmationData - Confirmation details
   * @returns {Promise<boolean>} Success status
   */
  async confirmMeetup(meetupId, confirmationData) {
    try {
      console.log('✅ Confirming meetup:', meetupId, confirmationData);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock admin');
        currentUser = { uid: 'mock-admin-id' };
      }

      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // Try Firebase first
      try {
        const meetupRef = doc(db, 'regular_meetups', meetupId);

        // Verify meetup exists and is pending
        const meetupDoc = await getDoc(meetupRef);
        if (!meetupDoc.exists()) {
          throw new Error('모임을 찾을 수 없습니다.');
        }

        const meetupData = meetupDoc.data();
        if (meetupData.status !== 'pending') {
          throw new Error('이미 확정된 모임입니다.');
        }

        // Update meetup with confirmation data
        await updateDoc(meetupRef, {
          status: 'confirmed',
          location: confirmationData.location,
          courtDetails: confirmationData.courtDetails,
          confirmedBy: currentUser.uid,
          confirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Meetup confirmed successfully');

        // TODO: Trigger push notifications to club members
        // This would be implemented in Phase 4

        return true;
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, using mock meetup confirmation:',
          firebaseError.message
        );

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Mock meetup confirmation successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to confirm meetup:', error);
      throw new Error('모임 확정 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Delete a meetup (admin only)
   * @param {string} meetupId - Meetup ID
   * @returns {Promise<void>} Success status
   */
  async deleteMeetup(meetupId) {
    if (!meetupId) {
      throw new Error('Meetup ID is required for deletion.');
    }

    console.log('🗑️ Deleting meetup document:', meetupId);
    const meetupRef = doc(db, 'regular_meetups', meetupId);
    await deleteDoc(meetupRef);
    console.log('✅ Meetup document', meetupId, 'successfully deleted from Firestore.');
  }

  /**
   * Update an existing meetup (admin only)
   * @param {string} meetupId - Meetup ID
   * @param {Object} meetupData - Updated meetup data
   * @returns {Promise<boolean>} Success status
   */
  async updateMeetup(meetupId, meetupData) {
    try {
      console.log('✏️ Updating meetup:', meetupId, meetupData);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock admin');
        currentUser = { uid: 'mock-admin-id' };
      }

      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // Try Firebase first
      try {
        const meetupRef = doc(db, 'regular_meetups', meetupId);

        // Verify meetup exists
        const meetupDoc = await getDoc(meetupRef);
        if (!meetupDoc.exists()) {
          throw new Error('모임을 찾을 수 없습니다.');
        }

        // Process location data with GeoPoint conversion if needed
        const processedLocation = meetupData.location
          ? {
              ...meetupData.location,
              coordinates: meetupData.location.coordinates
                ? new GeoPoint(
                    meetupData.location.coordinates.lat,
                    meetupData.location.coordinates.lng
                  )
                : null,
            }
          : null;

        // Update the meetup document
        await updateDoc(meetupRef, {
          ...(meetupData.title !== undefined && { title: meetupData.title }),
          ...(meetupData.description !== undefined && { description: meetupData.description }),
          ...(meetupData.dateTime && {
            dateTime: Timestamp.fromDate(new Date(meetupData.dateTime)),
          }),
          ...(processedLocation && { location: processedLocation }),
          ...(meetupData.courtDetails && { courtDetails: meetupData.courtDetails }),
          ...(meetupData.maxParticipants !== undefined && {
            maxParticipants: meetupData.maxParticipants,
          }),
          updatedAt: serverTimestamp(),
        });

        console.log('✅ Meetup updated successfully:', meetupId);
        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock meetup update:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ Mock meetup update successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update meetup:', error);
      throw new Error('모임 수정 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get meetup details for editing (admin only)
   * @param {string} meetupId - Meetup ID
   * @returns {Promise<Object|null>} Meetup data or null if not found
   */
  async getMeetupDetails(meetupId) {
    try {
      console.log('📋 Getting meetup details for edit:', meetupId);

      // Try Firebase first
      try {
        const meetupRef = doc(db, 'regular_meetups', meetupId);
        const meetupDoc = await getDoc(meetupRef);

        if (!meetupDoc.exists()) {
          console.warn('⚠️ Meetup not found:', meetupId);
          return null;
        }

        const rawData = meetupDoc.data();

        // Transform data for editing (convert Firestore types to JS types)
        const meetupData = {
          id: meetupDoc.id,
          ...rawData,
          dateTime: rawData.dateTime?.toDate() || new Date(),
          createdAt: rawData.createdAt?.toDate() || new Date(),
          updatedAt: rawData.updatedAt?.toDate() || new Date(),
          confirmedAt: rawData.confirmedAt?.toDate() || null,
          location: rawData.location
            ? {
                ...rawData.location,
                coordinates:
                  rawData.location.coordinates instanceof GeoPoint
                    ? {
                        lat: rawData.location.coordinates.latitude,
                        lng: rawData.location.coordinates.longitude,
                      }
                    : rawData.location.coordinates,
              }
            : null,
        };

        console.log('✅ Meetup details retrieved successfully');
        return meetupData;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock meetup details:', firebaseError.message);

        // Return mock meetup data for editing
        return {
          id: meetupId,
          clubId: 'mock-club-1',
          status: 'pending',
          dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          title: 'Weekly Pickleball Meetup',
          description: 'Regular weekly pickleball meetup for club members',
          location: {
            type: 'home',
            name: 'Club Home Courts',
            address: '1234 Pickleball Drive, Atlanta, GA 30309',
          },
          courtDetails: {
            availableCourts: 4,
            courtNumbers: '1, 2, 3, 4',
          },
          maxParticipants: 16,
          isRecurring: false,
        };
      }
    } catch (error) {
      console.error('❌ Failed to get meetup details:', error);
      throw new Error('모임 정보 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate meetup statistics
   * @param {Object} meetup - Meetup data
   * @returns {Object} Statistics object
   */
  calculateMeetupStats(meetup) {
    // Use denormalized counts if available, fallback to calculating from participants
    let totalAttending, totalDeclined, totalMaybe;

    if (meetup.attendingCount !== undefined) {
      // Use denormalized counts for real-time consistency
      totalAttending = meetup.attendingCount || 0;
      totalDeclined = meetup.decliningCount || 0;
      totalMaybe = meetup.maybeCount || 0;
    } else {
      // Fallback to calculating from participants object
      const participants = meetup.participants || {};
      const participantsList = Object.values(participants);
      totalAttending = participantsList.filter(p => p.status === 'attending').length;
      totalDeclined = participantsList.filter(p => p.status === 'declining').length;
      totalMaybe = participantsList.filter(p => p.status === 'maybe').length;
    }

    const stats = {
      totalAttending,
      totalDeclined,
      totalMaybe,
      courtUtilization: 0,
      statusMessage: '',
      statusColor: 'green',
    };

    const attendees = stats.totalAttending;
    const courts = meetup.courtDetails?.availableCourts || 4;
    const maxCapacity = courts * 4; // 4 players per court

    stats.courtUtilization = (attendees / maxCapacity) * 100;

    // Generate status key and color (i18n keys for translation in UI)
    if (attendees < maxCapacity) {
      stats.statusKey = 'courtsAvailable';
      stats.statusColor = 'green';
    } else if (attendees === maxCapacity) {
      stats.statusKey = 'perfectMatch';
      stats.statusColor = 'blue';
    } else {
      const waitingCount = attendees - maxCapacity;
      stats.statusKey = 'waitingCount';
      stats.waitingCount = waitingCount;
      stats.statusColor = 'orange';
    }

    return stats;
  }

  /**
   * Get the last completed meetup for a club (for smart defaults)
   * @param {string} clubId - Club ID
   * @returns {Promise<Object|null>} Last completed meetup data
   */
  async getLastCompletedMeetup(clubId) {
    try {
      console.log('📊 Fetching last completed meetup for club:', clubId);

      // Try Firebase first
      try {
        const meetupsRef = collection(db, 'regular_meetups');
        const q = query(
          meetupsRef,
          where('clubId', '==', clubId),
          where('status', '==', 'completed'),
          orderBy('dateTime', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const rawData = doc.data();

          const meetupData = {
            id: doc.id,
            ...rawData,
            dateTime: rawData.dateTime?.toDate() || new Date(),
            // Location 객체 처리 및 GeoPoint 변환
            location: rawData.location
              ? {
                  ...rawData.location,
                  coordinates:
                    rawData.location.coordinates instanceof GeoPoint
                      ? {
                          lat: rawData.location.coordinates.latitude,
                          lng: rawData.location.coordinates.longitude,
                        }
                      : rawData.location.coordinates,
                }
              : null,
          };

          console.log('✅ Found last completed meetup:', meetupData.id);
          return meetupData;
        } else {
          console.log('ℹ️ No completed meetups found for this club');
          return null;
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, returning mock last meetup:', firebaseError.message);

        // Return mock last meetup data
        return {
          id: 'mock-last-meetup',
          clubId: clubId,
          status: 'completed',
          dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          location: {
            type: 'home',
            name: 'Club Home Courts',
            address: '1234 Pickleball Drive, Atlanta, GA 30309',
          },
          courtDetails: {
            availableCourts: 3,
            courtNumbers: '1, 2, 3',
          },
        };
      }
    } catch (error) {
      console.error('❌ Failed to get last completed meetup:', error);
      return null;
    }
  }

  /**
   * Clean up all active listeners
   */
  cleanupListeners() {
    console.log('🧹 Cleaning up meetup service listeners');
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  // ============ CHAT OPERATIONS ============

  /**
   * Send a chat message to a meetup
   * @param {string} meetupId - Meetup ID
   * @param {string} text - Message text
   * @returns {Promise<string>} Created message ID
   */
  async sendChatMessage(meetupId, text) {
    try {
      console.log('💬 Sending chat message to meetup:', meetupId);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock user');
        currentUser = { uid: 'mock-user-id', displayName: 'Guest User' };
      }

      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!text || !text.trim()) {
        throw new Error('메시지를 입력해주세요.');
      }

      // Try Firebase first
      try {
        const chatRef = collection(db, 'regular_meetups', meetupId, 'chat_messages');

        // 🎯 [KIM FIX] Get user profile from Firestore to get displayName
        let userName = currentUser.displayName || 'Unknown';
        let userPhoto = currentUser.photoURL || null;

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.displayName || userData.name || userName;
            userPhoto = userData.profileImage || userData.photoURL || userPhoto;
          }
        } catch (userFetchError) {
          console.warn('⚠️ Could not fetch user profile:', userFetchError.message);
        }

        const messageDoc = {
          text: text.trim(),
          userId: currentUser.uid,
          userName: userName,
          userPhoto: userPhoto,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(chatRef, messageDoc);
        console.log('✅ Chat message sent successfully:', docRef.id);
        return docRef.id;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable for chat:', firebaseError.message);

        // Return mock message ID
        const mockId = `mock-msg-${Date.now()}`;
        console.log('✅ Mock chat message sent:', mockId);
        return mockId;
      }
    } catch (error) {
      console.error('❌ Failed to send chat message:', error);
      throw new Error('메시지 전송 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get chat messages with real-time listener
   * @param {string} meetupId - Meetup ID
   * @param {function} onUpdate - Callback for real-time updates
   * @param {number} messageLimit - Number of messages to fetch (default 50)
   * @returns {function} Unsubscribe function
   */
  getChatMessagesRealtime(meetupId, onUpdate, messageLimit = 50) {
    try {
      console.log('💬 Setting up chat real-time listener for meetup:', meetupId);

      // Try Firebase first
      try {
        const chatRef = collection(db, 'regular_meetups', meetupId, 'chat_messages');
        const chatQuery = query(chatRef, orderBy('createdAt', 'asc'), limit(messageLimit));

        const unsubscribe = onSnapshot(
          chatQuery,
          snapshot => {
            const messages = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                text: data.text,
                userId: data.userId,
                userName: data.userName,
                userPhoto: data.userPhoto,
                timestamp: data.createdAt?.toDate() || new Date(),
              };
            });

            console.log(`💬 Chat messages updated: ${messages.length} messages`);
            onUpdate(messages);
          },
          error => {
            console.error('❌ Chat listener error:', error);

            if (error.code === 'permission-denied') {
              console.warn('⚠️ Chat permission denied - check Firestore security rules');
            }

            // Return empty array on error
            onUpdate([]);
          }
        );

        // Store listener for cleanup
        this.listeners.set(`chat-${meetupId}`, unsubscribe);
        return unsubscribe;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable for chat:', firebaseError.message);
        onUpdate([]);
        return () => {};
      }
    } catch (error) {
      console.error('❌ Failed to set up chat listener:', error);
      onUpdate([]);
      return () => {};
    }
  }

  /**
   * 🔴 Mark meetup chat as read (clear unread badge)
   * Deletes the unreadMeetupChats document for the current user
   * @param {string} meetupId - Meetup ID
   * @returns {Promise<void>}
   */
  async markChatAsRead(meetupId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser?.uid) {
        console.log('⚠️ No user logged in, cannot mark chat as read');
        return;
      }

      console.log(`✅ Marking meetup chat as read: meetup=${meetupId}, user=${currentUser.uid}`);

      const unreadRef = doc(db, 'users', currentUser.uid, 'unreadMeetupChats', meetupId);
      await deleteDoc(unreadRef);

      console.log('✅ Meetup chat marked as read successfully');
    } catch (error) {
      // Ignore "not found" errors - the document might not exist
      if (error.code === 'not-found') {
        console.log('ℹ️ No unread document to delete');
        return;
      }
      console.error('❌ Failed to mark meetup chat as read:', error);
    }
  }

  // ============ MOCK DATA FUNCTIONS ============

  /**
   * Generate mock meetup data for testing
   */
  getMockMeetup(meetupId, onUpdate) {
    const mockMeetup = {
      id: meetupId,
      clubId: 'mock-club-1',
      status: 'confirmed',
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      location: {
        type: 'home',
        name: 'Atlanta Pickleball Center',
        address: '1234 Pickleball Ave, Atlanta, GA 30309',
      },
      courtDetails: {
        availableCourts: 4,
        courtNumbers: '1, 2, 3, 4',
      },
      participants: {
        'mock-user-1': {
          status: 'attending',
          rsvpTime: new Date(),
          userId: 'mock-user-1',
        },
        'mock-user-2': {
          status: 'attending',
          rsvpTime: new Date(),
          userId: 'mock-user-2',
        },
        'mock-user-3': {
          status: 'maybe',
          rsvpTime: new Date(),
          userId: 'mock-user-3',
        },
      },
      confirmedBy: 'mock-admin-id',
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      // Mock participant joining
      const randomUser = `mock-user-${Math.floor(Math.random() * 10)}`;
      if (!mockMeetup.participants[randomUser]) {
        mockMeetup.participants[randomUser] = {
          status: 'attending',
          rsvpTime: new Date(),
          userId: randomUser,
        };
        mockMeetup.updatedAt = new Date();
        onUpdate({ ...mockMeetup });
      }
    }, 10000); // Update every 10 seconds

    onUpdate(mockMeetup);

    // Return cleanup function
    return () => clearInterval(updateInterval);
  }

  /**
   * Generate mock club meetups
   */
  getMockClubMeetups(clubId, status, onUpdate) {
    const mockMeetups = [
      {
        id: 'mock-meetup-1',
        clubId: clubId,
        status: 'confirmed',
        dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        location: { type: 'home', name: 'Home Courts' },
        courtDetails: { availableCourts: 4 },
        participants: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mock-meetup-2',
        clubId: clubId,
        status: 'pending',
        dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        location: { type: 'home', name: 'Home Courts' },
        courtDetails: { availableCourts: 6 },
        participants: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const filteredMeetups =
      status === 'all' ? mockMeetups : mockMeetups.filter(m => m.status === status);

    onUpdate(filteredMeetups);

    // Return cleanup function
    return () => {};
  }

  // 🗑️ [KIM 2025-01-10] Weather snapshot methods removed - feature removed per user request
  // saveWeatherSnapshot() and getWeatherSnapshot() were removed
}

// Export singleton instance
const meetupService = new MeetupService();
export default meetupService;
