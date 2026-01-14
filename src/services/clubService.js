/**
 * Club Management Service for Lightning Tennis
 * Handles all club-related operations including creation, membership, events, and chat
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../firebase/config';
import authService from './authService';
import offlineStorageService from './offlineStorageService';
import pushNotificationService from './pushNotificationService';

// 🏗️ CENTRALIZED COLLECTION REFERENCES - DRY Principle Applied
// Single source of truth for all Firestore collection references
const clubsCollectionRef = collection(db, 'tennis_clubs');

/**
 * Club Service Class
 * Manages all club-related database operations
 */
class ClubService {
  // 🚫 CLUB CREATION LIMIT: Maximum clubs a user can create
  static MAX_CLUBS_PER_USER = 3;

  // 🎾 CLUB MEMBERSHIP LIMIT: Maximum clubs a user can JOIN (be a member of)
  static MAX_CLUB_MEMBERSHIPS_PER_USER = 5;

  constructor() {
    console.log('🏟️ ClubService initialized');
    // Cache for user club memberships to speed up role checks
    this.membershipCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * 🚫 Check how many clubs the current user owns
   * Returns { count, maxAllowed, canCreate } for UI to show appropriate message
   */
  async getUserOwnedClubsCount() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return {
          count: 0,
          maxAllowed: ClubService.MAX_CLUBS_PER_USER,
          canCreate: false,
          error: 'NOT_AUTHENTICATED',
        };
      }

      const clubsRef = collection(db, 'clubs');
      const userClubsQuery = query(clubsRef, where('createdBy', '==', currentUser.uid));
      const userClubsSnapshot = await getDocs(userClubsQuery);
      const ownedClubsCount = userClubsSnapshot.size;

      console.log(
        `🏛️ [ClubLimit] User ${currentUser.uid} owns ${ownedClubsCount}/${ClubService.MAX_CLUBS_PER_USER} clubs`
      );

      return {
        count: ownedClubsCount,
        maxAllowed: ClubService.MAX_CLUBS_PER_USER,
        canCreate: ownedClubsCount < ClubService.MAX_CLUBS_PER_USER,
      };
    } catch (error) {
      console.error('❌ [ClubLimit] Error checking owned clubs:', error);
      // Allow creation if we can't check (fail open)
      return {
        count: 0,
        maxAllowed: ClubService.MAX_CLUBS_PER_USER,
        canCreate: true,
        error: 'CHECK_FAILED',
      };
    }
  }

  /**
   * 🎾 Check how many clubs the user is a member of (active memberships)
   * Returns { count, maxAllowed, canJoin } for UI to show appropriate message
   * @param {string} userId - Optional user ID, defaults to current user
   */
  async getUserClubMembershipsCount(userId = null) {
    try {
      const targetUserId = userId || auth.currentUser?.uid;
      if (!targetUserId) {
        return {
          count: 0,
          maxAllowed: ClubService.MAX_CLUB_MEMBERSHIPS_PER_USER,
          canJoin: false,
          error: 'NOT_AUTHENTICATED',
        };
      }

      // Query active memberships from clubMembers collection
      const membersRef = collection(db, 'clubMembers');
      const q = query(
        membersRef,
        where('userId', '==', targetUserId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const membershipCount = snapshot.size;

      console.log(
        `🎾 [MembershipLimit] User ${targetUserId} is member of ${membershipCount}/${ClubService.MAX_CLUB_MEMBERSHIPS_PER_USER} clubs`
      );

      return {
        count: membershipCount,
        maxAllowed: ClubService.MAX_CLUB_MEMBERSHIPS_PER_USER,
        canJoin: membershipCount < ClubService.MAX_CLUB_MEMBERSHIPS_PER_USER,
      };
    } catch (error) {
      console.error('❌ [MembershipLimit] Error checking club memberships:', error);
      // Allow joining if we can't check (fail open)
      return {
        count: 0,
        maxAllowed: ClubService.MAX_CLUB_MEMBERSHIPS_PER_USER,
        canJoin: true,
        error: 'CHECK_FAILED',
      };
    }
  }

  // ============ DEBUGGING & DIAGNOSTICS ============

  /**
   * Check if user has created any clubs (for debugging)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of clubs created by user
   */
  async checkUserCreatedClubs(userId) {
    try {
      console.log('🔍 Checking clubs created by user:', userId);

      const q = query(clubsCollectionRef, where('createdBy', '==', userId));

      const snapshot = await getDocs(q);
      console.log(`🔍 Found ${snapshot.size} clubs created by user`);

      const clubs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }));

      return clubs;
    } catch (error) {
      console.error('❌ Error checking user created clubs:', error);
      throw error;
    }
  }

  // ============ CACHE MANAGEMENT ============

  /**
   * Clear membership cache for a specific user
   * @param {string} userId - User ID
   */
  clearMembershipCache(userId) {
    const cacheKey = `memberships_${userId}`;
    this.membershipCache.delete(cacheKey);
    console.log('🗑️ Cleared membership cache for user:', userId);
  }

  // ============ CLUB MANAGEMENT ============

  /**
   * Create a new tennis club
   * @param {Object} clubData - Club information
   * @returns {Promise<string>} Created club ID
   */
  async createClub(clubData) {
    try {
      console.log('🎾 Creating club with data:', clubData);

      // Enhanced authentication flow with better error handling
      let currentUser;
      let authAttempts = 0;
      const maxAuthAttempts = 3;

      while (authAttempts < maxAuthAttempts) {
        try {
          authAttempts++;
          console.log(`🔐 Auth attempt ${authAttempts}/${maxAuthAttempts}`);

          currentUser = authService.getCurrentUser();

          if (!currentUser) {
            throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
          }

          // Test authentication by getting a fresh token
          if (currentUser.getIdToken) {
            console.log('🔄 Refreshing authentication token...');
            await currentUser.getIdToken(true); // Force refresh token
            console.log('✅ Authentication token refreshed successfully');
          }

          // If we get here, authentication succeeded
          break;
        } catch (authError) {
          console.warn(`⚠️ Auth attempt ${authAttempts} failed:`, authError);

          // Handle specific Firebase auth errors
          if (authError.code) {
            switch (authError.code) {
              case 'auth/user-token-expired':
              case 'auth/id-token-expired':
              case 'auth/invalid-user-token':
                if (authAttempts < maxAuthAttempts) {
                  console.log('🔄 Token expired, waiting before retry...');
                  await new Promise(resolve => setTimeout(resolve, 1000 * authAttempts));
                  continue;
                } else {
                  throw new Error('인증이 만료되었습니다. 앱을 다시 시작하고 로그인해주세요.');
                }

              case 'auth/network-request-failed':
                if (authAttempts < maxAuthAttempts) {
                  console.log('🌐 Network error, waiting before retry...');
                  await new Promise(resolve => setTimeout(resolve, 2000 * authAttempts));
                  continue;
                } else {
                  throw new Error('네트워크 연결을 확인하고 다시 시도해주세요.');
                }

              case 'auth/too-many-requests':
                throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');

              default:
                if (authError.message && authError.message.includes('securetoken.googleapis.com')) {
                  throw new Error('인증 서버에 일시적 문제가 있습니다. 잠시 후 다시 시도해주세요.');
                }
                throw new Error(`인증 오류: ${authError.message}`);
            }
          } else {
            // Non-Firebase auth error
            if (authAttempts >= maxAuthAttempts) {
              console.warn(
                '⚠️ Auth service unavailable after multiple attempts, using offline mode'
              );
              currentUser = { uid: clubData.createdBy || 'offline-user-id' };
              break;
            }
          }
        }
      }

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // 🚫 CLUB CREATION LIMIT CHECK: Maximum 3 clubs per user
      const MAX_CLUBS_PER_USER = 3;
      try {
        const clubsRef = collection(db, 'clubs');
        const userClubsQuery = query(clubsRef, where('createdBy', '==', currentUser.uid));
        const userClubsSnapshot = await getDocs(userClubsQuery);
        const ownedClubsCount = userClubsSnapshot.size;

        console.log(
          `🏛️ [ClubLimit] User ${currentUser.uid} currently owns ${ownedClubsCount}/${MAX_CLUBS_PER_USER} clubs`
        );

        if (ownedClubsCount >= MAX_CLUBS_PER_USER) {
          throw new Error(
            `한 사용자당 최대 ${MAX_CLUBS_PER_USER}개의 클럽만 생성할 수 있습니다. (현재 ${ownedClubsCount}개 소유)`
          );
        }
      } catch (limitCheckError) {
        // Re-throw if it's our limit error
        if (limitCheckError.message && limitCheckError.message.includes('최대')) {
          throw limitCheckError;
        }
        console.warn(
          '⚠️ [ClubLimit] Could not check club limit, proceeding with creation:',
          limitCheckError
        );
      }

      // Try Firebase operations
      try {
        // Enhanced location processing with place_id support
        let enhancedCourtAddress = clubData.courtAddress;
        let location = { latitude: 0, longitude: 0 };

        if (clubData.courtAddress) {
          console.log('📍 [ClubService] Processing courtAddress:', clubData.courtAddress);

          // If place_id is available, try to get enhanced place details
          if (clubData.courtAddress.placeId) {
            console.log(
              '🆔 [ClubService] Found place_id, fetching enhanced details:',
              clubData.courtAddress.placeId
            );

            try {
              // Import LocationService dynamically to avoid circular dependencies
              const LocationService = (await import('./LocationService')).default;
              const placeDetails = await LocationService.createLocationObjectFromPlaceId(
                clubData.courtAddress.placeId
              );

              if (placeDetails) {
                console.log('✅ [ClubService] Enhanced place details retrieved:', {
                  address: placeDetails.address,
                  city: placeDetails.city,
                  state: placeDetails.state,
                  types: placeDetails.types.slice(0, 3),
                });

                // Create enhanced courtAddress with place details
                enhancedCourtAddress = {
                  address: placeDetails.address,
                  formatted_address: placeDetails.formattedAddress,
                  placeId: placeDetails.placeId,
                  coordinates: {
                    lat: placeDetails.latitude,
                    lng: placeDetails.longitude,
                  },
                  city: placeDetails.city,
                  state: placeDetails.state,
                  country: placeDetails.country,
                  district: placeDetails.district,
                  types: placeDetails.types,
                };

                location = {
                  latitude: placeDetails.latitude,
                  longitude: placeDetails.longitude,
                };

                console.log(
                  '🎾 [ClubService] Enhanced courtAddress created:',
                  enhancedCourtAddress
                );
              } else {
                console.warn(
                  '⚠️ [ClubService] Place details lookup failed, using original courtAddress'
                );
              }
            } catch (placeError) {
              console.warn('⚠️ [ClubService] Place details lookup error:', placeError);
              // Continue with original courtAddress
            }
          }

          // Fallback to coordinates from original courtAddress if no place_id enhancement
          if (
            location.latitude === 0 &&
            location.longitude === 0 &&
            clubData.courtAddress.coordinates
          ) {
            location = {
              latitude: clubData.courtAddress.coordinates.lat,
              longitude: clubData.courtAddress.coordinates.lng,
            };
            console.log('📍 [ClubService] Using original coordinates:', location);
          }
        }

        console.log('🌍 [ClubService] Final location for Discovery:', location);
        console.log('🌍 [ClubService] Final courtAddress:', enhancedCourtAddress);

        // Prepare club document with simplified structure
        const clubDoc = {
          name: clubData.name, // 🎯 [KIM FIX] Root-level name for queries
          location, // Add root-level location for Discovery
          profile: {
            name: clubData.name,
            description: clubData.description,
            logo: clubData.logoUri || null,
            coverImage: null,
            location: clubData.region,
            establishedDate: serverTimestamp(),
            tags: [],
            contactInfo: null,
            socialLinks: null,
            facilities: clubData.facilities || [],
            rules: clubData.rules || [],
            courtAddress: enhancedCourtAddress || null,
          },
          settings: {
            isPublic: clubData.isPublic,
            visibility: clubData.isPublic ? 'public' : 'private', // Sync with isPublic on creation
            joinRequiresApproval: true,
            membershipFee: clubData.monthlyFee || 0,
            joinFee: clubData.joinFee || 0,
            yearlyFee: clubData.yearlyFee || 0,
            maxMembers: 100,
            meetings: clubData.meetings || [],
            // Default payment methods with QR code placeholders
            paymentMethods: ['Venmo', 'Zelle', 'KakaoPay'],
            paymentQRCodes: {}, // { Venmo: 'imageUrl', Zelle: 'imageUrl', ... }
            dueDate: 25, // Default due date: 25th of each month
            gracePeriod: 7, // Default grace period: 7 days
            lateFee: 5, // Default late fee: $5
          },
          statistics: {
            totalMembers: 1,
            activeMembers: 1,
            eventsHosted: 0,
            matchesPlayed: 0,
          },
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active',
        };

        // Create club and add creator as admin in a transaction
        const result = await runTransaction(db, async transaction => {
          // Create club document
          const newClubRef = doc(clubsCollectionRef);
          console.log('🆕 Creating club with ID:', newClubRef.id);
          transaction.set(newClubRef, clubDoc);

          // Add creator as club admin
          const membershipId = `${newClubRef.id}_${currentUser.uid}`;
          const memberRef = doc(db, 'clubMembers', membershipId);

          const memberDoc = {
            clubId: newClubRef.id,
            userId: currentUser.uid,
            role: 'admin',
            status: 'active',
            joinedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          console.log('👤 Creating membership for club creator:', {
            membershipId,
            clubId: newClubRef.id,
            userId: currentUser.uid,
            role: 'admin',
            status: 'active',
          });

          transaction.set(memberRef, memberDoc);

          console.log('📋 Transaction returning club ID:', newClubRef.id);
          return newClubRef.id;
        });

        // Clear membership cache for the creator since they're now a club member
        this.clearMembershipCache(currentUser.uid);

        console.log('✅ Club created successfully with Firebase:', result);
        console.log('📤 Returning club ID to caller:', result);
        return result; // This should be a string ID like 'iFFU5BRlXOD9MpuwL6eD'
      } catch (firebaseError) {
        console.error('❌ Firebase error in createClub:', firebaseError);
        throw firebaseError; // Throw explicit Firebase error instead of fallback
      }
    } catch (error) {
      console.error('❌ Failed to create club:', error);

      // Provide user-friendly error messages based on error type
      let userMessage = '클럽 생성 중 오류가 발생했습니다.';

      if (error.message.includes('인증')) {
        userMessage = error.message; // Use the specific auth error message
      } else if (error.message.includes('네트워크')) {
        userMessage = error.message; // Use the specific network error message
      } else if (error.message.includes('요청이 너무 많습니다')) {
        userMessage = error.message; // Use the rate limit error message
      } else if (error.message.includes('securetoken.googleapis.com')) {
        userMessage = '인증 서버 문제로 인해 클럽 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
      }

      throw new Error(userMessage);
    }
  }

  /**
   * Update existing tennis club
   * @param {string} clubId - Club ID to update
   * @param {Object} clubData - Updated club information
   * @returns {Promise<void>}
   */
  async updateClub(clubId, clubData) {
    try {
      console.log('🔄 Updating club:', clubId, 'with data:', clubData);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock user');
        currentUser = { uid: 'mock-user-id' };
      }

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Try Firebase, fallback to mock if unavailable
      try {
        const clubRef = doc(db, 'tennis_clubs', clubId);

        // Prepare updated club document
        const updateData = {
          'profile.name': clubData.name,
          'profile.description': clubData.description,
          'profile.logo': clubData.logoUri || null,
          'profile.location': clubData.region,
          'profile.facilities': clubData.facilities || [],
          'profile.rules': clubData.rules || [],
          'profile.courtAddress': clubData.courtAddress || null,
          'settings.isPublic': clubData.isPublic,
          'settings.visibility': clubData.isPublic ? 'public' : 'private', // Sync with isPublic
          'settings.membershipFee': clubData.monthlyFee || 0,
          'settings.joinFee': clubData.joinFee || 0,
          'settings.meetings': clubData.meetings || [],
          updatedAt: serverTimestamp(),
        };

        await updateDoc(clubRef, updateData);
        console.log('✅ Club updated successfully');

        return true;
      } catch (firebaseError) {
        // 🎯 [KIM FIX] Don't hide Firebase errors! Let them propagate for proper debugging
        console.error('❌ Firebase update failed:', firebaseError.code, firebaseError.message);

        // Check if it's a permission error
        if (firebaseError.code === 'permission-denied') {
          throw new Error('권한이 없습니다. 클럽 관리자만 설정을 수정할 수 있습니다.');
        }

        throw firebaseError;
      }
    } catch (error) {
      console.error('❌ Failed to update club:', error);
      throw new Error('클럽 수정 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get club by ID (supports offline clubs)
   * @param {string} clubId - Club ID
   * @returns {Promise<Object>} Club data
   */
  async getClub(clubId) {
    try {
      // Check if it's an offline club first
      if (clubId.startsWith('offline_club_')) {
        console.log('💾 Retrieving offline club:', clubId);
        const offlineClub = await offlineStorageService.getOfflineClub(clubId);

        if (offlineClub) {
          console.log('✅ Offline club retrieved:', offlineClub.profile?.name || 'Unknown');
          return {
            id: offlineClub.id,
            name: offlineClub.profile?.name || offlineClub.name,
            description: offlineClub.profile?.description || offlineClub.description,
            location: offlineClub.profile?.location || offlineClub.location,
            isOffline: true,
            needsSync: offlineClub.needsSync,
            ...offlineClub,
          };
        } else {
          throw new Error('오프라인 클럽을 찾을 수 없습니다.');
        }
      }

      // Try Firebase for regular clubs
      const clubRef = doc(db, 'tennis_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (!clubSnap.exists()) {
        // 🎯 [KIM FIX] Return null instead of throwing for deleted/missing clubs
        // This prevents console errors when memberships reference deleted clubs
        console.warn('⚠️ Club not found (may be deleted):', clubId);
        return null;
      }

      const clubData = { id: clubSnap.id, ...clubSnap.data() };
      console.log('✅ Club retrieved:', clubData.name);
      return clubData;
    } catch (error) {
      console.error('❌ Failed to get club:', error);
      // 🎯 [KIM FIX] Return null instead of throwing to handle gracefully
      return null;
    }
  }

  /**
   * Search public clubs with text query
   * @param {string} query - Search query
   * @param {number} limitCount - Results limit
   * @returns {Promise<Array>} Array of public clubs
   */
  async searchPublicClubs(searchTerm = '', limitCount = 50) {
    try {
      console.log('🔍 Searching public clubs with query:', searchTerm);

      // Try Firebase first
      try {
        let q = query(
          clubsCollectionRef,
          where('status', '==', 'active'),
          where('settings.isPublic', '==', true),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        let clubs = snapshot.docs.map(doc => {
          const data = doc.data();
          // Extract location from various possible fields
          // Prioritize courtAddress.city (best for display)
          const locationValue =
            data.profile?.courtAddress?.city || // Priority 1: City name
            data.profile?.courtAddress?.formatted_address || // Priority 2: Full address
            data.profile?.courtAddress?.address || // Priority 3: Short address
            data.profile?.location || // Priority 4: Legacy location string
            'Unknown Location';

          // Note: Do NOT use data.location as it's a coordinate object {latitude, longitude}

          // Keep the full address for GPS navigation
          const fullAddress =
            data.profile?.courtAddress?.address ||
            data.profile?.courtAddress?.formatted_address ||
            (typeof locationValue === 'string' ? locationValue : null) ||
            'Unknown Location';

          // Extract city name only (for display)
          // If we already have the city, use it directly
          const cityName =
            data.profile?.courtAddress?.city ||
            (typeof locationValue === 'string'
              ? this._extractCityName(locationValue)
              : 'Unknown Location');

          console.log('🔍 [ClubService] Full address:', fullAddress);
          console.log('🔍 [ClubService] City name:', cityName);

          // Try to get the most accurate creation date
          let createdAt = new Date(); // Default fallback

          if (data.createdAt) {
            createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            console.log('🔍 searchPublicClubs - Using data.createdAt:', createdAt);
          } else if (data.profile?.establishedDate) {
            createdAt = data.profile.establishedDate.toDate
              ? data.profile.establishedDate.toDate()
              : new Date(data.profile.establishedDate);
            console.log('🔍 searchPublicClubs - Using profile.establishedDate:', createdAt);
          } else if (data.establishedDate) {
            createdAt = data.establishedDate.toDate
              ? data.establishedDate.toDate()
              : new Date(data.establishedDate);
            console.log('🔍 searchPublicClubs - Using establishedDate:', createdAt);
          } else {
            // Try to extract timestamp from Firebase document ID (for auto-generated IDs)
            try {
              console.log(
                '🔍 searchPublicClubs - No date found, using document ID for ordering:',
                doc.id
              );
              const baseTime = new Date('2024-01-01').getTime();
              const idHash = doc.id.split('').reduce((a, b) => {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
              }, 0);
              createdAt = new Date(baseTime + (Math.abs(idHash) % 31536000000)); // Within a year
            } catch (error) {
              console.log('🔍 searchPublicClubs - Fallback to current date:', createdAt);
            }
          }

          return {
            id: doc.id,
            name: data.profile?.name || data.name || 'Unknown Club',
            description: data.profile?.description || data.description || '',
            location: cityName, // Use extracted city name instead of full location
            cityName: cityName, // Add city name for DiscoverScreen
            fullAddress: fullAddress, // Add the complete address for GPS navigation
            city: data.profile?.courtAddress?.city || '', // City for ClubCard tags
            state: data.profile?.courtAddress?.state || '', // State for ClubCard tags
            logoUrl: data.profile?.logo || data.logoUrl,
            memberCount: data.statistics?.totalMembers || 0,
            maxMembers: data.settings?.maxMembers || 100,
            isPublic: data.settings?.isPublic ?? true,
            tags: data.profile?.tags || data.tags || [],
            establishedDate:
              data.profile?.establishedDate?.toDate() || data.establishedDate?.toDate(),
            createdBy: data.createdBy,
            createdAt: createdAt, // Add proper creation date
          };
        });

        // Sort by creation date (newest first)
        clubs.sort((a, b) => {
          const aTime = a.createdAt?.getTime() || 0;
          const bTime = b.createdAt?.getTime() || 0;
          console.log('🔍 searchPublicClubs - Sorting clubs:', a.name, aTime, 'vs', b.name, bTime);
          return bTime - aTime; // Newest first
        });

        // Client-side filtering for text search (Firebase doesn't have full-text search)
        if (searchTerm.trim()) {
          const searchQuery = searchTerm.toLowerCase();
          clubs = clubs.filter(
            club =>
              club.name.toLowerCase().includes(searchQuery) ||
              club.location.toLowerCase().includes(searchQuery) ||
              club.description.toLowerCase().includes(searchQuery) ||
              club.tags.some(tag => tag.toLowerCase().includes(searchQuery))
          );
        }

        console.log('🔍 searchPublicClubs - Final club order:');
        clubs.forEach((club, index) => {
          console.log(
            `  ${index + 1}. ${club.name} (${club.createdAt?.toLocaleDateString() || 'No date'})`
          );
        });

        console.log(`✅ Found ${clubs.length} public clubs from Firebase`);
        return clubs;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock data:', firebaseError.message);

        // Return mock data for testing
        const mockClubs = [
          {
            id: 'mock-public-club-1',
            name: '서울 중앙 테니스 클럽',
            description: '서울 중심가에서 활동하는 다양한 레벨의 테니스 동호회입니다.',
            location: '서울시 강남구',
            fullAddress: '서울특별시 강남구 테헤란로 123',
            logoUrl: null,
            memberCount: 45,
            maxMembers: 60,
            isPublic: true,
            tags: ['테니스', '동호회', '강남'],
            establishedDate: new Date('2023-01-01'),
          },
          {
            id: 'mock-public-club-2',
            name: '부산 해운대 테니스 클럽',
            description: '해변에서 즐기는 테니스의 매력을 느껴보세요.',
            location: '부산시 해운대구',
            fullAddress: '부산광역시 해운대구 해운대해변로 264',
            logoUrl: null,
            memberCount: 28,
            maxMembers: 40,
            isPublic: true,
            tags: ['테니스', '해변', '부산'],
            establishedDate: new Date('2023-06-01'),
          },
          {
            id: 'mock-public-club-3',
            name: '대전 유성 테니스 클럽',
            description: '과학도시 대전에서 함께하는 테니스 커뮤니티입니다.',
            location: '대전시 유성구',
            fullAddress: '대전광역시 유성구 대학로 291',
            logoUrl: null,
            memberCount: 32,
            maxMembers: 50,
            isPublic: true,
            tags: ['테니스', '유성', '대전'],
            establishedDate: new Date('2023-03-15'),
          },
        ];

        // Apply client-side filtering for mock data too
        if (searchTerm.trim()) {
          const searchQuery = searchTerm.toLowerCase();
          return mockClubs.filter(
            club =>
              club.name.toLowerCase().includes(searchQuery) ||
              club.location.toLowerCase().includes(searchQuery) ||
              club.description.toLowerCase().includes(searchQuery) ||
              club.tags.some(tag => tag.toLowerCase().includes(searchQuery))
          );
        }

        return mockClubs;
      }
    } catch (error) {
      console.error('❌ Failed to search public clubs:', error);
      throw error;
    }
  }

  /**
   * Get user's status for a specific club
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID
   * @returns {Promise<string>} User status: 'none', 'member', 'pending', 'declined'
   */
  /**
   * Get user role in a specific club
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} User role ('admin', 'manager', 'member') or null
   */
  async getUserRoleInClub(clubId, userId) {
    try {
      console.log('🔍 Getting user role in club:', { clubId, userId });

      const membershipId = `${clubId}_${userId}`;
      const memberRef = doc(db, 'clubMembers', membershipId);

      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        if (memberData.status === 'active') {
          console.log('✅ User role found:', memberData.role);
          return memberData.role || 'member';
        }
      }

      console.log('❌ User is not an active member');
      return null;
    } catch (error) {
      console.error('❌ Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get user membership status in a specific club
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID
   * @returns {Promise<string>} Membership status ('member', 'pending', 'declined', 'none')
   */
  async getMembershipStatus(clubId, userId) {
    try {
      console.log('🔍 Getting membership status:', { clubId, userId });

      // First check if user is an active member
      const membershipId = `${clubId}_${userId}`;
      const memberRef = doc(db, 'clubMembers', membershipId);

      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        if (memberData.status === 'active') {
          console.log('✅ User is an active member');
          return 'member';
        }
      }

      // Check join requests for pending/declined status
      const requestsRef = collection(db, 'clubJoinRequests');
      const requestQuery = query(
        requestsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId)
      );

      const requestSnap = await getDocs(requestQuery);
      if (!requestSnap.empty) {
        // Get the most recent request
        let mostRecentRequest = null;
        let mostRecentTime = 0;

        requestSnap.docs.forEach(doc => {
          const data = doc.data();
          const timestamp = data.createdAt?.toMillis() || data.requestedAt?.toMillis() || 0;
          if (timestamp > mostRecentTime) {
            mostRecentTime = timestamp;
            mostRecentRequest = data;
          }
        });

        if (mostRecentRequest) {
          console.log('✅ Most recent request status:', mostRecentRequest.status);
          // 🎯 FIX: Firestore stores 'rejected' (not 'declined'), but we return 'declined' for UI state
          return mostRecentRequest.status === 'pending'
            ? 'pending'
            : mostRecentRequest.status === 'rejected'
              ? 'declined'
              : 'none';
        }
      }

      console.log('✅ User has no membership or requests');
      return 'none';
    } catch (error) {
      console.error('❌ Error getting membership status:', error);
      return 'none';
    }
  }

  async getUserClubStatus(clubId, userId) {
    try {
      // First check if user is an active member
      const membershipId = `${clubId}_${userId}`;
      const memberRef = doc(db, 'clubMembers', membershipId);

      try {
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const memberData = memberSnap.data();
          if (memberData.status === 'active') {
            return 'member';
          }
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable for membership check');
      }

      // Check join requests for pending/declined status
      const requestsRef = collection(db, 'clubJoinRequests');
      const requestQuery = query(
        requestsRef,
        where('clubId', '==', clubId),
        where('userId', '==', userId)
      );

      try {
        const requestSnap = await getDocs(requestQuery);
        if (!requestSnap.empty) {
          // Get the most recent request by checking timestamps
          let mostRecentRequest = null;
          let mostRecentTime = 0;

          requestSnap.docs.forEach(doc => {
            const data = doc.data();
            const timestamp = data.createdAt?.toMillis() || data.requestedAt?.toMillis() || 0;
            if (timestamp > mostRecentTime) {
              mostRecentTime = timestamp;
              mostRecentRequest = data;
            }
          });

          if (mostRecentRequest) {
            // If approved, user should already be in clubMembers as active
            // If still showing as approved here, something went wrong with the approval process
            if (mostRecentRequest.status === 'approved') {
              console.warn(
                '⚠️ Found approved request but no active membership. Data inconsistency detected.'
              );
              return 'member'; // Assume they are a member
            }
            // 🎯 FIX: Convert backend 'rejected' status to frontend 'declined' for consistency
            if (mostRecentRequest.status === 'rejected') {
              return 'declined';
            }
            return mostRecentRequest.status; // 'pending'
          }
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable for join request check');
      }

      return 'none';
    } catch (error) {
      console.error('❌ Failed to get user club status:', error);
      return 'none';
    }
  }

  /**
   * Request to join a club
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID
   * @param {string} message - Optional message from user
   * @returns {Promise<string>} Request ID
   */
  async requestToJoinClub(clubId, userId, message = '') {
    try {
      console.log('📝 Creating join request:', { clubId, userId, message });

      // Verify user authentication - strict validation
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable during join request');
        throw new Error('User must be authenticated');
      }

      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('User must be authenticated');
      }

      // 🎾 [MEMBERSHIP LIMIT] Check if user has reached maximum club memberships
      const membershipStatus = await this.getUserClubMembershipsCount(userId);
      if (!membershipStatus.canJoin) {
        console.log(
          `🚫 [MembershipLimit] User ${userId} has reached max clubs (${membershipStatus.count}/${membershipStatus.maxAllowed})`
        );
        throw new Error(
          `클럽은 최대 ${membershipStatus.maxAllowed}개까지만 가입할 수 있습니다. 현재 ${membershipStatus.count}개의 클럽에 가입되어 있습니다.`
        );
      }

      // Try Firebase creation
      try {
        const requestsRef = collection(db, 'clubJoinRequests');
        const requestDoc = {
          clubId,
          userId,
          status: 'pending',
          requestedAt: serverTimestamp(),
          message: message || '', // Optional message from user
        };

        const docRef = await addDoc(requestsRef, requestDoc);

        console.log('✅ Join request created successfully in Firebase:', docRef.id);
        return docRef.id;
      } catch (firebaseError) {
        console.error('❌ Firebase error during join request:', firebaseError.message);
        throw new Error('클럽 가입 신청에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ Failed to request to join club:', error);
      throw new Error('클럽 가입 신청 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get join requests for a club
   * @param {string} clubId - Club ID
   * @param {string} status - Request status filter ('pending', 'approved', 'declined')
   * @returns {Promise<Array>} Array of join requests with user details
   */
  async getClubJoinRequests(clubId, status = 'pending') {
    try {
      console.log('🔍 Getting join requests for club:', clubId, 'with status:', status);

      // Try Firebase first - look in club_join_requests collection
      try {
        const joinRequestsRef = collection(db, 'clubJoinRequests');
        const q = query(
          joinRequestsRef,
          where('clubId', '==', clubId),
          where('status', '==', status)
        );

        const querySnapshot = await getDocs(q);
        const requests = [];

        for (const docSnap of querySnapshot.docs) {
          const requestData = docSnap.data();

          // Get user information from users collection
          let userInfo = null;
          try {
            const userDoc = await getDoc(doc(db, 'users', requestData.userId));
            if (userDoc.exists()) {
              userInfo = userDoc.data();
            }
          } catch (userError) {
            console.error('Error fetching user data:', userError);
          }

          // Use actual user data with fallback to request data
          const userName =
            userInfo?.profile?.displayName ||
            userInfo?.displayName ||
            requestData.userName ||
            'Unknown User';

          requests.push({
            id: docSnap.id,
            clubId: requestData.clubId,
            userId: requestData.userId,
            userName: userName,
            profileImage:
              userInfo?.profile?.photoURL || userInfo?.photoURL || requestData.userAvatar,
            skillLevel: userInfo?.profile?.skillLevel || requestData.skillLevel || 'intermediate',
            status: requestData.status,
            requestedAt: requestData.createdAt?.toDate() || new Date(),
            message: requestData.message || '',
          });
        }

        // Sort by requestedAt in descending order (newest first)
        requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

        console.log(`✅ Found ${requests.length} join requests from Firebase`);
        return requests;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock data:', firebaseError.message);

        // Return mock data for testing
        if (status === 'pending') {
          return [
            {
              id: 'mock-request-1',
              clubId,
              userId: 'user-request-1',
              userName: '김신청자',
              profileImage: null,
              skillLevel: 3.5,
              status: 'pending',
              requestedAt: new Date(),
              message: '테니스를 좋아하는 직장인입니다. 함께 운동하고 싶어요!',
            },
            {
              id: 'mock-request-2',
              clubId,
              userId: 'user-request-2',
              userName: '이희망자',
              profileImage: null,
              skillLevel: 4.0,
              status: 'pending',
              requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
              message: '',
            },
          ];
        }

        return [];
      }
    } catch (error) {
      console.error('❌ Failed to get club join requests:', error);
      throw error;
    }
  }

  /**
   * Approve join request
   * @param {string} requestId - Join request ID
   * @returns {Promise} Approval promise
   */
  // 🏰 OPERATION CITADEL: Secure join request approval via Cloud Function
  async approveJoinRequest(requestId) {
    try {
      console.log('🏰 [Operation Citadel] Calling secure Cloud Function for request:', requestId);

      const func = httpsCallable(functions, 'approveJoinRequest');
      const result = await func({ requestId });

      console.log('✅ [Operation Citadel] Join request approved successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ [Operation Citadel] Error calling approveJoinRequest function:', error);

      // Extract meaningful error message
      const errorMessage =
        error.code === 'functions/not-found'
          ? 'Join request approval service is currently unavailable'
          : error.message || 'Failed to approve join request';

      throw new Error(errorMessage);
    }
  }

  /**
   * 🏰 OPERATION CITADEL: Secure join request rejection via Cloud Function
   * @param {string} requestId - Join request ID
   * @param {string} reason - Optional rejection reason
   * @returns {Promise} Rejection promise
   */
  async rejectJoinRequest(requestId, reason = null) {
    try {
      console.log(
        '🏰 [Operation Citadel] Calling secure Cloud Function to reject request:',
        requestId
      );

      const func = httpsCallable(functions, 'rejectJoinRequest');
      const result = await func({ requestId, reason });

      console.log('✅ [Operation Citadel] Join request rejected successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ [Operation Citadel] Error calling rejectJoinRequest function:', error);

      // Extract meaningful error message
      const errorMessage =
        error.code === 'functions/not-found'
          ? 'Join request rejection service is currently unavailable'
          : error.message || 'Failed to reject join request';

      throw new Error(errorMessage);
    }
  }

  // Legacy alias for backward compatibility
  async declineJoinRequest(requestId, reason = null) {
    console.warn(
      '⚠️ [Operation Citadel] declineJoinRequest is deprecated, use rejectJoinRequest instead'
    );
    return this.rejectJoinRequest(requestId, reason);
  }

  /**
   * Get detailed club information
   * @param {string} clubId - Club ID
   * @param {Object} options - Options for fetching
   * @param {boolean} options.includeMembers - Whether to include members (default: true)
   * @returns {Promise<Object>} Club details
   */
  async getClubDetails(clubId, options = { includeMembers: true }) {
    try {
      console.log('🔍 Getting club details for:', clubId, 'options:', options);

      // Log current user context for investigation
      const currentUser = await authService.getCurrentUser();
      console.log('🔍 Current user context:', {
        uid: currentUser?.uid,
        email: currentUser?.email,
        displayName: currentUser?.displayName,
      });

      // Try Firebase first
      try {
        const clubRef = doc(db, 'tennis_clubs', clubId);
        const clubDoc = await getDoc(clubRef);

        if (clubDoc.exists()) {
          const clubData = clubDoc.data();

          // 🕵️ BLACKBOX DATA PAYLOAD INVESTIGATION 🕵️
          console.log('Club ID:', clubDoc.id);
          console.log('Raw Firestore Document Data:');
          console.log(JSON.stringify(clubData, null, 2));
          console.log('--- END BLACKBOX INVESTIGATION ---');

          console.log('✅ Club details retrieved from Firebase:', clubData);

          // 🎯 [KIM FIX] Conditionally load members based on options (optimization)
          // When includeMembers is false, skip the N+1 query for members
          let members = [];
          if (options.includeMembers !== false) {
            try {
              members = await this.getClubMembers(clubId, 'active');
              console.log(`✅ Loaded ${members.length} club members`);
            } catch (memberError) {
              console.warn('⚠️ Failed to load club members:', memberError);
            }
          } else {
            console.log('⚡ Skipping member loading for performance (includeMembers: false)');
          }

          // Format the data for the UI
          return {
            id: clubDoc.id,
            name: clubData.profile?.name || clubData.name || '',
            description: clubData.profile?.description || clubData.description || '',
            logoUri: clubData.profile?.logo || clubData.logoUrl || '',
            logoUrl: clubData.profile?.logo || clubData.logoUrl || '',
            region: clubData.profile?.location || clubData.location || '',
            isPublic: clubData.settings?.isPublic ?? clubData.isPublic ?? true,
            maxMembers: clubData.settings?.maxMembers || clubData.maxMembers || 100,
            membershipFee: clubData.settings?.membershipFee || 0,
            // 🎯 [KIM FIX] Add monthlyFee and yearlyFee for CreateClubScreen compatibility
            monthlyFee: clubData.settings?.membershipFee || undefined,
            joinFee: clubData.settings?.joinFee || 0,
            yearlyFee: clubData.settings?.yearlyFee || undefined,
            facilities: clubData.profile?.facilities || [],
            rules: clubData.profile?.rules || [],
            courtAddress: clubData.profile?.courtAddress || null,
            homeCourtAddress: clubData.profile?.courtAddress || null, // Add homeCourtAddress alias
            meetings: clubData.settings?.meetings || [],
            tags: clubData.profile?.tags || clubData.tags || [],
            memberCount: clubData.statistics?.totalMembers || members.length || 1,
            members: members, // Include actual member data
            contactInfo: clubData.profile?.contactInfo || clubData.contactInfo || null,
            establishedDate: clubData.profile?.establishedDate || clubData.establishedDate,
            createdBy: clubData.createdBy,
            status: clubData.status || 'active',
          };
        } else {
          throw new Error('Club not found');
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock data:', firebaseError.message);

        // Return mock data for testing
        return {
          id: clubId,
          name: 'Mock Tennis Club',
          description: 'This is a mock tennis club for testing purposes.',
          logoUri: '',
          region: 'Seoul',
          isPublic: true,
          maxMembers: 100,
          membershipFee: 0,
          tags: ['tennis', 'sports'],
          contactInfo: null,
          establishedDate: new Date(),
          createdBy: 'mock-user',
          status: 'active',
          homeCourtAddress: {
            name: 'Club Home Courts',
            address: '1234 Tennis Drive, Atlanta, GA 30309',
            coordinates: { lat: 33.749, lng: -84.388 },
          },
        };
      }
    } catch (error) {
      console.error('❌ Failed to get club details:', error);
      throw error;
    }
  }

  /**
   * Update club information
   * @param {string} clubId - Club ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} Update promise
   */
  async updateClub(clubId, updateData) {
    try {
      console.log('📝 Updating club:', clubId, updateData);

      // Try to get current user
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, using mock update');
        currentUser = { uid: 'mock-user-id' };
      }

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Try Firebase update
      try {
        const clubRef = doc(db, 'tennis_clubs', clubId);

        // Prepare update document with proper structure
        const updateFields = {
          'profile.name': updateData.name,
          'profile.description': updateData.description,
          'profile.location': updateData.region,
          'settings.isPublic': updateData.isPublic,
          updatedAt: serverTimestamp(),
        };

        // Only update logo if provided
        if (updateData.logoUri !== undefined) {
          updateFields['profile.logo'] = updateData.logoUri;
        }

        // Only update other fields if provided
        if (updateData.maxMembers !== undefined) {
          updateFields['settings.maxMembers'] = updateData.maxMembers;
        }

        if (updateData.monthlyFee !== undefined) {
          updateFields['settings.membershipFee'] = updateData.monthlyFee;
        }

        if (updateData.joinFee !== undefined) {
          updateFields['settings.joinFee'] = updateData.joinFee;
        }

        // 🎯 [KIM FIX] Add missing yearlyFee field
        if (updateData.yearlyFee !== undefined) {
          updateFields['settings.yearlyFee'] = updateData.yearlyFee;
        }

        if (updateData.facilities !== undefined) {
          updateFields['profile.facilities'] = updateData.facilities;
        }

        if (updateData.rules !== undefined) {
          updateFields['profile.rules'] = updateData.rules;
        }

        if (updateData.tags !== undefined) {
          updateFields['profile.tags'] = updateData.tags;
        }

        // 🎯 [KIM FIX] Add missing meetings and courtAddress fields
        if (updateData.meetings !== undefined) {
          updateFields['settings.meetings'] = updateData.meetings;
        }

        if (updateData.courtAddress !== undefined) {
          updateFields['profile.courtAddress'] = updateData.courtAddress;
        }

        await updateDoc(clubRef, updateFields);

        console.log('✅ Club updated successfully in Firebase');
        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock update:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Mock club update successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update club:', error);
      throw new Error('클럽 정보 수정 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // ============ MEMBER MANAGEMENT ============

  /**
   * Invite member to club
   * @param {string} clubId - Club ID
   * @param {Object} inviteData - Invitation data
   * @returns {Promise<string>} Invitation ID
   */
  async inviteMember(clubId, inviteData) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      // Check permissions
      const canInvite = await this.checkClubPermission(clubId, 'manager');
      if (!canInvite) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Get club info
      const clubData = await this.getClub(clubId);

      const invitationsRef = collection(db, 'clubInvitations');
      const invitationDoc = {
        clubId,
        clubInfo: {
          name: clubData.name,
          logoUrl: clubData.logoUrl,
        },
        invitedEmail: inviteData.email,
        invitedBy: currentUser.uid,
        inviterInfo: {
          displayName: currentUser.displayName || 'Club Member',
          role: 'admin', // Get actual role from membership
        },
        status: 'pending',
        message: inviteData.message || '',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      const docRef = await addDoc(invitationsRef, invitationDoc);

      console.log('✅ Member invitation sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to invite member:', error);
      throw error;
    }
  }

  // ============ CLUB INVITATION SYSTEM (APP USER INVITE) ============

  /**
   * Create a club invitation for an existing app user
   * @param {string} clubId - Club ID
   * @param {string} inviteeUserId - User ID of the person being invited
   * @param {Object} inviterInfo - { id, name, photoURL }
   * @param {Object} clubInfo - { name, logoUrl }
   * @returns {Promise<string>} Invitation ID
   */
  async createClubInvitation(clubId, inviteeUserId, inviterInfo, clubInfo) {
    try {
      console.log('📨 [ClubInvitation] Creating invitation for user:', inviteeUserId);

      // 1. Check if user is already a member
      const membershipId = `${clubId}_${inviteeUserId}`;
      const memberRef = doc(db, 'clubMembers', membershipId);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists() && memberSnap.data().status === 'active') {
        throw new Error('이미 클럽 회원입니다.');
      }

      // 2. Check if there's already a pending invitation for this user
      const invitationsRef = collection(db, 'clubInvitations');
      const existingInviteQuery = query(
        invitationsRef,
        where('clubId', '==', clubId),
        where('inviteeUserId', '==', inviteeUserId),
        where('status', '==', 'pending')
      );
      const existingInvites = await getDocs(existingInviteQuery);

      if (!existingInvites.empty) {
        console.log('⚠️ [ClubInvitation] Pending invitation already exists');
        // Return existing invitation ID instead of creating a new one
        return existingInvites.docs[0].id;
      }

      // 3. Create the invitation document
      const invitationDoc = {
        clubId,
        clubName: clubInfo.name,
        clubLogoUrl: clubInfo.logoUrl || null,

        // Inviter info
        inviterId: inviterInfo.id,
        inviterName: inviterInfo.name,
        inviterPhotoURL: inviterInfo.photoURL || null,

        // Invitee info (app user)
        inviteeUserId,
        inviteeEmail: null, // Not using email for app user invites
        inviteePhone: null, // Not using phone for app user invites

        // Status
        status: 'pending',
        message: '',

        // Timestamps
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        respondedAt: null,
      };

      const docRef = await addDoc(invitationsRef, invitationDoc);
      console.log('✅ [ClubInvitation] Invitation created:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('❌ [ClubInvitation] Failed to create invitation:', error);
      throw error;
    }
  }

  /**
   * Accept a club invitation and automatically join the club
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<Object>} Result with clubId
   */
  async acceptClubInvitation(invitationId) {
    try {
      console.log('✅ [ClubInvitation] Accepting invitation:', invitationId);

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // 1. Get the invitation document
      const invitationRef = doc(db, 'clubInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);

      if (!invitationSnap.exists()) {
        throw new Error('초대를 찾을 수 없습니다.');
      }

      const invitation = invitationSnap.data();

      // 2. Validate the invitation
      if (invitation.inviteeUserId !== currentUser.uid) {
        throw new Error('본인에게 온 초대가 아닙니다.');
      }

      if (invitation.status !== 'pending') {
        throw new Error('이미 처리된 초대입니다.');
      }

      // Check expiration
      const expiresAt = invitation.expiresAt?.toDate
        ? invitation.expiresAt.toDate()
        : new Date(invitation.expiresAt);
      if (new Date() > expiresAt) {
        // Update status to expired
        await updateDoc(invitationRef, {
          status: 'expired',
          respondedAt: serverTimestamp(),
        });
        throw new Error('초대가 만료되었습니다.');
      }

      // 3. Join the club using existing joinClub method
      // The joinClub method will update the invitation status in the transaction
      await this.joinClub(invitation.clubId, invitationId);

      console.log('✅ [ClubInvitation] Successfully accepted invitation and joined club');

      return {
        success: true,
        clubId: invitation.clubId,
        clubName: invitation.clubName,
      };
    } catch (error) {
      console.error('❌ [ClubInvitation] Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Update metadata of a direct chat message (for invitation status updates)
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {Object} metadataUpdate - Partial metadata to update
   */
  async updateDirectChatMessageMetadata(conversationId, messageId, metadataUpdate) {
    try {
      console.log('📝 [ClubInvitation] Updating message metadata:', {
        conversationId,
        messageId,
        metadataUpdate,
      });

      const messageRef = doc(db, 'direct_messages', conversationId, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        console.warn('⚠️ [ClubInvitation] Message not found, skipping metadata update');
        return;
      }

      const currentData = messageSnap.data();
      const currentMetadata = currentData.metadata || {};

      await updateDoc(messageRef, {
        metadata: {
          ...currentMetadata,
          ...metadataUpdate,
        },
        updatedAt: serverTimestamp(),
      });

      console.log('✅ [ClubInvitation] Message metadata updated');
    } catch (error) {
      console.error('❌ [ClubInvitation] Failed to update message metadata:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get club members with enhanced details
   * @param {string} clubId - Club ID
   * @param {string} status - Member status filter ('active', 'pending', 'inactive')
   * @returns {Promise<Array>} Array of club members with user details
   */
  async getClubMembers(clubId, status = 'active') {
    try {
      console.log('🔍 Getting club members for:', clubId);

      // Try Firebase first
      try {
        const membersRef = collection(db, 'clubMembers');
        let q = query(membersRef, where('clubId', '==', clubId), where('status', '==', status));

        const querySnapshot = await getDocs(q);
        console.log(`🔍 Found ${querySnapshot.size} members`);

        // 🎯 [KIM FIX] Parallelize user info fetching to fix N+1 query problem
        // Instead of sequential queries (50 members = 50 queries taking 2-5 seconds),
        // fetch all user info in parallel (50 members = 1 parallel batch taking ~100ms)
        const memberDocs = querySnapshot.docs;
        const userIds = memberDocs.map(docSnap => docSnap.data().userId).filter(Boolean);

        // Fetch all user documents in parallel
        const userDocsPromises = userIds.map(userId =>
          getDoc(doc(db, 'users', userId)).catch(err => {
            console.warn(`⚠️ Failed to fetch user ${userId}:`, err.message);
            return null;
          })
        );
        const userDocsResults = await Promise.all(userDocsPromises);

        // Build a map for O(1) lookup
        const userInfoMap = new Map();
        userDocsResults.forEach((userDoc, index) => {
          if (userDoc && userDoc.exists()) {
            userInfoMap.set(userIds[index], userDoc.data());
          }
        });

        console.log(`⚡ Fetched ${userInfoMap.size} user profiles in parallel`);

        // Now build member list using the pre-fetched user info
        const members = memberDocs.map(docSnap => {
          const memberData = docSnap.data();
          const userInfo = userInfoMap.get(memberData.userId) || null;

          return {
            id: docSnap.id,
            userId: memberData.userId,
            userName:
              userInfo?.profile?.displayName ||
              userInfo?.displayName ||
              memberData.memberInfo?.displayName ||
              memberData.memberInfo?.nickname ||
              'Unknown User',
            profileImage:
              userInfo?.profile?.photoURL || userInfo?.photoURL || memberData.memberInfo?.photoURL,
            skillLevel: userInfo?.profile?.skillLevel || memberData.memberInfo?.skillLevel,
            // 🎯 [KIM FIX] Include gender for gender-based filtering in leagues/tournaments
            gender: userInfo?.profile?.gender || memberData.memberInfo?.gender,
            role: memberData.role || 'member',
            status: memberData.status || 'active',
            joinedAt: memberData.joinedAt?.toDate() || memberData.createdAt?.toDate() || new Date(),
            lastActive: memberData.clubActivity?.lastActiveAt?.toDate(),
            eventsAttended: memberData.clubActivity?.eventsAttended || 0,
            // 🎯 [KIM FIX] Include club stats for LTR display
            clubStats: memberData.clubStats,
          };
        });

        // Sort by role priority then by join date
        members.sort((a, b) => {
          const roleOrder = { owner: 1, admin: 2, member: 3 };
          const aRole = roleOrder[a.role] || 3;
          const bRole = roleOrder[b.role] || 3;

          if (aRole !== bRole) {
            return aRole - bRole;
          }

          return b.joinedAt.getTime() - a.joinedAt.getTime();
        });

        console.log(`✅ Loaded ${members.length} club members from Firebase`);
        return members;
      } catch (firebaseError) {
        console.error('❌ [clubService] Firebase error in getClubMembers:', firebaseError);
        // 🚨 Don't silently fall back to mock data - throw the error so caller can handle it
        throw firebaseError;
      }
    } catch (error) {
      console.error('❌ Failed to get club members:', error);
      throw error;
    }
  }

  /**
   * 🎯 [KIM FIX] Get club member count (efficient count-only query)
   * @param {string} clubId - Club ID
   * @param {string} status - Member status filter (default: 'active')
   * @returns {Promise<number>} Number of members
   */
  async getClubMemberCount(clubId, status = 'active') {
    try {
      const membersRef = collection(db, 'clubMembers');
      const q = query(membersRef, where('clubId', '==', clubId), where('status', '==', status));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Failed to get club member count:', error);
      return 0;
    }
  }

  /**
   * 🎯 [KIM FIX] Get member counts for multiple clubs (batch query for Discovery)
   * @param {string[]} clubIds - Array of club IDs
   * @returns {Promise<Object>} Object mapping clubId to member count
   */
  async getMultipleClubMemberCounts(clubIds) {
    try {
      const counts = {};

      // Process in batches of 10 (Firestore 'in' query limit)
      const batchSize = 10;
      for (let i = 0; i < clubIds.length; i += batchSize) {
        const batch = clubIds.slice(i, i + batchSize);

        const membersRef = collection(db, 'clubMembers');
        const q = query(membersRef, where('clubId', 'in', batch), where('status', '==', 'active'));

        const snapshot = await getDocs(q);

        // Initialize counts for all clubs in batch
        batch.forEach(clubId => {
          counts[clubId] = 0;
        });

        // Count members per club
        snapshot.docs.forEach(doc => {
          const clubId = doc.data().clubId;
          counts[clubId] = (counts[clubId] || 0) + 1;
        });
      }

      return counts;
    } catch (error) {
      console.error('❌ Failed to get multiple club member counts:', error);
      return {};
    }
  }

  /**
   * 🎯 [KIM FIX] Get club activity stats for Discovery cards
   * Returns: eventCount (30 days), communicationLevel, memberTrend, monthlyFee
   */
  async getMultipleClubStats(clubIds) {
    try {
      const stats = {};
      // 🎯 [KIM FIX] JavaScript Date를 Firestore Timestamp로 변환
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

      // 🎯 [KIM FIX v3] For upcoming events (meetups), use today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const todayTimestamp = Timestamp.fromDate(today);

      // Initialize stats for all clubs
      clubIds.forEach(clubId => {
        stats[clubId] = {
          eventCount: 0,
          communicationLevel: 'quiet', // 'active', 'normal', 'quiet'
          memberJoined: 0,
          memberLeft: 0,
          monthlyFee: 0,
        };
      });

      // Process in batches of 10 (Firestore 'in' query limit)
      const batchSize = 10;

      for (let i = 0; i < clubIds.length; i += batchSize) {
        const batch = clubIds.slice(i, i + batchSize);

        // 🎯 [KIM FIX v5] 각 컬렉션을 별도 try-catch로 분리 (하나가 실패해도 나머지 실행)
        // 모든 쿼리를 클라이언트 측 필터링으로 변경 (복합 인덱스 불필요)

        // 1.1 club_events (이벤트) - 클라이언트 측 필터링
        try {
          const eventsRef = collection(db, 'club_events');
          const eventsQuery = query(eventsRef, where('clubId', 'in', batch));
          const eventsSnapshot = await getDocs(eventsQuery);
          eventsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const clubId = data.clubId;
            // 클라이언트 측 필터링: createdAt >= 30일 전
            const eventCreatedAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            if (stats[clubId] && eventCreatedAt >= thirtyDaysAgo) {
              stats[clubId].eventCount++;
            }
          });
        } catch (e) {
          console.warn('⚠️ Failed to fetch club_events:', e.message);
        }

        // 1.2 🎯 [KIM FIX v6] regular_meetups (정기모임) - dateTime >= 30일 전 (리그/토너먼트와 동일 기준)
        try {
          const meetupsRef = collection(db, 'regular_meetups');
          const meetupsQuery = query(meetupsRef, where('clubId', 'in', batch));
          const meetupsSnapshot = await getDocs(meetupsQuery);
          meetupsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const clubId = data.clubId;
            // 클라이언트 측 필터링: dateTime >= 30일 전 AND status !== 'cancelled'
            const meetupDateTime = data.dateTime?.toDate?.() || new Date(data.dateTime);
            if (stats[clubId] && meetupDateTime >= thirtyDaysAgo && data.status !== 'cancelled') {
              stats[clubId].eventCount++;
            }
          });
        } catch (e) {
          console.warn('⚠️ Failed to fetch regular_meetups:', e.message);
        }

        // 1.3 leagues (리그) - 클라이언트 측 필터링
        try {
          const leaguesRef = collection(db, 'leagues');
          const leaguesQuery = query(leaguesRef, where('clubId', 'in', batch));
          const leaguesSnapshot = await getDocs(leaguesQuery);
          leaguesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const clubId = data.clubId;
            // 클라이언트 측 필터링: endDate >= 30일 전 AND status !== 'cancelled'
            const leagueEndDate = data.endDate?.toDate?.() || new Date(data.endDate);
            if (stats[clubId] && leagueEndDate >= thirtyDaysAgo && data.status !== 'cancelled') {
              stats[clubId].eventCount++;
            }
          });
        } catch (e) {
          console.warn('⚠️ Failed to fetch leagues:', e.message);
        }

        // 1.4 tournaments (토너먼트) - 클라이언트 측 필터링
        try {
          const tournamentsRef = collection(db, 'tournaments');
          const tournamentsQuery = query(tournamentsRef, where('clubId', 'in', batch));
          const tournamentsSnapshot = await getDocs(tournamentsQuery);
          tournamentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const clubId = data.clubId;
            // 클라이언트 측 필터링: endDate >= 30일 전 AND status !== 'cancelled'
            const tournamentEndDate = data.endDate?.toDate?.() || new Date(data.endDate);
            if (
              stats[clubId] &&
              tournamentEndDate >= thirtyDaysAgo &&
              data.status !== 'cancelled'
            ) {
              stats[clubId].eventCount++;
            }
          });
        } catch (e) {
          console.warn('⚠️ Failed to fetch tournaments:', e.message);
        }

        // 2. 🎯 [KIM FIX v3] 클럽 소통 레벨 계산 (공지사항 + 대화방)
        // 기준: 3개 이상 → 활발, 1개 이상 → 보통, 0개 → 조용
        // NOTE: 게시판 기능 삭제됨 (2024-12)
        try {
          const activityCounts = {};
          batch.forEach(clubId => {
            activityCounts[clubId] = 0;
          });

          // 2.1 🎯 [KIM FIX v3] 공지사항 카운트 (지난 7일)
          // 공지사항은 tennis_clubs/{clubId} 문서의 announcement 필드에 저장됨
          // clubAnnouncements 컬렉션이 아님!
          const sevenDaysAgoDate = sevenDaysAgo; // JavaScript Date 객체
          for (const clubId of batch) {
            try {
              const clubRef = doc(db, 'tennis_clubs', clubId);
              const clubDoc = await getDoc(clubRef);
              if (clubDoc.exists()) {
                const clubData = clubDoc.data();
                const announcement = clubData.announcement;
                if (announcement && announcement.createdAt) {
                  const announcementDate = announcement.createdAt.toDate
                    ? announcement.createdAt.toDate()
                    : new Date(announcement.createdAt);
                  if (announcementDate >= sevenDaysAgoDate) {
                    activityCounts[clubId]++;
                    console.log('📢 [ClubStats] Found recent announcement for club:', clubId);
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Failed to fetch announcement for club:', clubId, e.message);
            }
          }

          // 2.2 🎯 [KIM FIX v3] 대화방 메시지 카운트 (지난 7일)
          // 채팅 메시지는 'clubChat' 컬렉션에 flat structure로 저장됨 (clubId 필드 사용)
          // 복합 인덱스 문제 방지: clubId만 쿼리하고 날짜는 클라이언트에서 필터링
          const chatRef = collection(db, 'clubChat');
          const chatQuery = query(chatRef, where('clubId', 'in', batch));
          const chatSnapshot = await getDocs(chatQuery);
          console.log('💬 [ClubStats] Total chat messages found:', chatSnapshot.docs.length);
          chatSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const clubId = data.clubId;
            // timestamp 또는 createdAt 필드 사용 (호환성)
            const msgTime = data.timestamp || data.createdAt;
            if (msgTime && activityCounts[clubId] !== undefined) {
              const msgDate = msgTime.toDate ? msgTime.toDate() : new Date(msgTime);
              if (msgDate >= sevenDaysAgoDate) {
                activityCounts[clubId]++;
              }
            }
          });
          console.log('📊 [ClubStats] Final activity counts:', activityCounts);

          // 2.4 새 기준으로 소통 레벨 설정: 3개+ → 활발, 1개+ → 보통, 0개 → 조용
          Object.keys(activityCounts).forEach(clubId => {
            if (stats[clubId]) {
              const count = activityCounts[clubId];
              if (count >= 3) {
                stats[clubId].communicationLevel = 'active';
              } else if (count >= 1) {
                stats[clubId].communicationLevel = 'normal';
              }
              // 0개는 이미 'quiet'로 초기화됨
            }
          });
        } catch (e) {
          console.warn('⚠️ Failed to fetch communication activity:', e.message);
        }

        // 3. Fetch member changes (last 30 days)
        // 🎯 [KIM FIX] 복합 인덱스 문제 해결 - clubId만 쿼리하고 클라이언트에서 필터링
        try {
          const membersRef = collection(db, 'clubMembers');
          // Get all members for these clubs (simpler query, no composite index needed)
          const membersQuery = query(membersRef, where('clubId', 'in', batch));
          const membersSnapshot = await getDocs(membersQuery);

          membersSnapshot.docs.forEach(docSnapshot => {
            const data = docSnapshot.data();
            const clubId = data.clubId;

            if (!stats[clubId]) return;

            // Check if member joined in last 30 days
            if (data.status === 'active' && data.joinedAt) {
              const joinedDate = data.joinedAt.toDate
                ? data.joinedAt.toDate()
                : new Date(data.joinedAt);
              if (joinedDate >= thirtyDaysAgo) {
                stats[clubId].memberJoined++;
              }
            }

            // Check if member left in last 30 days
            if (data.status === 'left' && data.leftAt) {
              const leftDate = data.leftAt.toDate ? data.leftAt.toDate() : new Date(data.leftAt);
              if (leftDate >= thirtyDaysAgo) {
                stats[clubId].memberLeft++;
              }
            }
          });
        } catch (e) {
          console.warn('⚠️ Failed to fetch member changes:', e.message);
        }

        // 4. Fetch monthly fees from club settings
        try {
          for (const clubId of batch) {
            const clubRef = doc(db, 'tennis_clubs', clubId);
            const clubDoc = await getDoc(clubRef);
            if (clubDoc.exists()) {
              const data = clubDoc.data();
              // 🎯 [KIM FIX] 회비는 settings.membershipFee에 저장됨
              stats[clubId].monthlyFee =
                data.settings?.membershipFee || data.settings?.monthlyFee || 0;
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to fetch club fees:', e.message);
        }
      }

      console.log('📊 [clubService] Club stats fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get club stats:', error);
      return {};
    }
  }

  // 🔄 [KIM FIX] Removed duplicate updateMemberRole - use the one at line ~3850 with notification logic

  /**
   * Remove member from club
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} Remove promise
   */
  async removeMember(clubId, userId) {
    try {
      console.log('🗑️ Removing member:', { clubId, userId });

      // Try to get current user for permission check
      let currentUser;
      try {
        currentUser = authService.getCurrentUser();
      } catch (authError) {
        console.warn('⚠️ Auth service unavailable, proceeding with mock removal');
        currentUser = { uid: 'mock-admin-user' };
      }

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Try Firebase removal
      try {
        await runTransaction(db, async transaction => {
          const membershipId = `${clubId}_${userId}`;
          const memberRef = doc(db, 'clubMembers', membershipId);

          // Remove membership document
          transaction.delete(memberRef);

          // Update club stats
          const clubRef = doc(db, 'tennis_clubs', clubId);
          transaction.update(clubRef, {
            'statistics.totalMembers': increment(-1),
            'statistics.activeMembers': increment(-1),
            updatedAt: serverTimestamp(),
          });
        });

        console.log('✅ Member removed successfully from Firebase');
        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock removal:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Mock member removal successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to remove member:', error);
      throw new Error('멤버 제거 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Process club data into membership format
   * @private
   */
  _processClubData(memberDoc, memberData, clubData) {
    const memberCount = clubData.statistics?.totalMembers || clubData.memberCount || 0;

    // Extract location with fallback to courtAddress
    // Prioritize courtAddress.city (best for display)
    const locationValue =
      clubData.profile?.courtAddress?.city || // Priority 1: City name
      clubData.profile?.courtAddress?.formatted_address || // Priority 2: Full address
      clubData.profile?.courtAddress?.address || // Priority 3: Short address
      clubData.profile?.location || // Priority 4: Legacy location string
      'Unknown Location';

    // Note: Do NOT use clubData.location as it's a coordinate object {latitude, longitude}

    // Extract city name only for MyClubsScreen
    // If we already have the city, use it directly
    const cityName =
      clubData.profile?.courtAddress?.city ||
      (typeof locationValue === 'string'
        ? this._extractCityName(locationValue)
        : 'Unknown Location');

    return {
      id: memberDoc.id, // 멤버십 ID
      clubId: memberData.clubId,
      clubName: clubData.profile?.name || clubData.name || 'Unknown Club',
      clubDescription: clubData.profile?.description || clubData.description,
      clubLocation: cityName, // Use city name only for MyClubsScreen
      clubLogo: clubData.profile?.logo || clubData.logoUrl || null,
      role: memberData.role || 'member',
      status: memberData.status || 'active',
      joinedAt: memberData.joinedAt?.toDate() || memberData.createdAt?.toDate() || new Date(),
      memberCount: memberCount,
      // 클럽 추가 정보
      clubTags: clubData.profile?.tags || clubData.tags || [],
      clubContactInfo: clubData.profile?.contactInfo || clubData.contactInfo,
      clubIsPublic: clubData.settings?.isPublic ?? clubData.isPublic ?? true,
      clubMaxMembers: clubData.settings?.maxMembers || clubData.maxMembers,
      clubEstablishedDate:
        clubData.profile?.establishedDate?.toDate() || clubData.establishedDate?.toDate(),
    };
  }

  /**
   * Create fallback club data when club is not found
   * @private
   */
  _createFallbackClubData(memberDoc, memberData) {
    return {
      id: memberDoc.id,
      clubId: memberData.clubId,
      clubName: 'Unknown Club',
      clubDescription: 'Club information unavailable',
      clubLocation: 'Unknown',
      clubLogo: null,
      role: memberData.role || 'member',
      status: memberData.status || 'active',
      joinedAt: memberData.joinedAt?.toDate() || memberData.createdAt?.toDate() || new Date(),
      memberCount: 0,
      clubTags: [],
      clubContactInfo: null,
      clubIsPublic: true,
      clubMaxMembers: null,
      clubEstablishedDate: null,
    };
  }

  /**
   * Extract city name from full location string
   * @param {string} fullLocation - Full location string (address, city, etc.)
   * @returns {string} - City name only
   */
  _extractCityName(fullLocation) {
    console.log('🏙️ _extractCityName called with:', typeof fullLocation, fullLocation);

    if (!fullLocation || fullLocation === 'Unknown Location') {
      console.log('🏙️ Early return - invalid fullLocation:', fullLocation);
      return 'Unknown Location';
    }

    console.log('🏙️ Extracting city from:', fullLocation);

    // Detect if this is US or Korean address format
    const isUSAddress = this._detectUSAddress(fullLocation);
    const isKoreanAddress = this._detectKoreanAddress(fullLocation);

    console.log('🌍 Address format detected - US:', isUSAddress, 'Korean:', isKoreanAddress);

    // Try to extract city name from various formats:
    // "1234 Main St, Atlanta, GA 30309" -> "Atlanta"
    // "Atlanta, GA" -> "Atlanta"
    // "조지아주 둘루스 (Duluth, GA)" -> "둘루스"
    // "서울 강남구" -> "강남구"

    let cityName = fullLocation;

    if (isKoreanAddress) {
      return this._extractKoreanCityName(cityName);
    } else if (isUSAddress) {
      return this._extractUSCityName(cityName);
    } else {
      // Fallback: try both formats
      // Handle Korean format with parentheses first: "조지아주 둘루스 (Duluth, GA)"
      if (cityName && typeof cityName === 'string') {
        const koreanMatch = cityName.match(/(\S+)\s*\(/);
        if (koreanMatch) {
          console.log('🏙️ Korean parentheses match found:', koreanMatch[1]);
          return koreanMatch[1];
        }
      } else {
        console.warn('🚨 cityName is invalid for regex:', cityName);
        return 'Unknown Location';
      }

      // Try US format
      if (cityName && typeof cityName === 'string') {
        const usResult = this._extractUSCityName(cityName);
        if (usResult && usResult !== 'Unknown Location') {
          return usResult;
        }

        // Try Korean format
        const krResult = this._extractKoreanCityName(cityName);
        if (krResult && krResult !== 'Unknown Location') {
          return krResult;
        }
      }
    }

    // Handle simple formats: "Atlanta" or "둘루스"
    if (cityName && typeof cityName === 'string') {
      const simpleCity = cityName.split(' ')[0];
      const result = simpleCity.length > 0 ? simpleCity : 'Unknown Location';
      console.log('🏙️ Extracted city result:', result);
      return result;
    }

    console.warn('🚨 Final fallback: cityName is invalid:', cityName);
    return 'Unknown Location';
  }

  /**
   * Detect if address is in US format
   * @param {string} address - Address string
   * @returns {boolean} - True if US format detected
   */
  _detectUSAddress(address) {
    // Check for US state abbreviations (GA, CA, TX, NY, etc.)
    const usStateRegex = /\b[A-Z]{2}\b/;
    // Check for ZIP codes (5 digits or 5+4 format)
    const zipCodeRegex = /\b\d{5}(-\d{4})?\b/;
    // Check for typical US address indicators
    const usAddressWords =
      /\b(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Ct|Court|Pl|Place|USA)\b/i;

    return usStateRegex.test(address) || zipCodeRegex.test(address) || usAddressWords.test(address);
  }

  /**
   * Detect if address is in Korean format
   * @param {string} address - Address string
   * @returns {boolean} - True if Korean format detected
   */
  _detectKoreanAddress(address) {
    // Check for Korean characters
    const koreanRegex = /[가-힣]/;
    // Check for Korean administrative divisions
    const koreanRegions =
      /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/;
    // Check for Korean address endings
    const koreanAddressEndings = /(시|구|동|면|읍|리)$/;

    return (
      koreanRegex.test(address) || koreanRegions.test(address) || koreanAddressEndings.test(address)
    );
  }

  /**
   * Extract city name from US address format
   * @param {string} address - US format address
   * @returns {string} - Extracted city name
   */
  _extractUSCityName(address) {
    console.log('🇺🇸 Extracting US city from:', address);

    // Handle US address format: "6276 Memorial Dr, Stone Mountain, GA 30083, USA"
    const parts = address.split(',');
    console.log('🇺🇸 Address parts:', parts);

    if (parts.length >= 3) {
      // For "street, city, state zip, country" format
      const cityPart = parts[1].trim();
      console.log('🇺🇸 Checking city part (≥3):', cityPart);
      if (cityPart && !/^\d/.test(cityPart)) {
        console.log('🇺🇸 US address (≥3) result:', cityPart);
        return cityPart;
      }
    } else if (parts.length === 2) {
      // For "city, state" format
      const cityPart = parts[0].trim();
      console.log('🇺🇸 Checking city part (=2):', cityPart);
      if (cityPart && !/^\d/.test(cityPart)) {
        console.log('🇺🇸 US address (=2) result:', cityPart);
        return cityPart;
      }
    }

    return 'Unknown Location';
  }

  /**
   * Extract city name from Korean address format
   * @param {string} address - Korean format address
   * @returns {string} - Extracted city name
   */
  _extractKoreanCityName(address) {
    console.log('🇰🇷 Extracting Korean city from:', address);

    // Handle Korean format: "서울 강남구" -> "강남구"
    const koreanCityMatch = address.match(
      /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s+(.+)$/
    );
    if (koreanCityMatch) {
      console.log('🇰🇷 Korean city match found:', koreanCityMatch[2]);
      return koreanCityMatch[2];
    }

    // Handle simple Korean city names
    const koreanSimple = address.trim();
    if (koreanSimple && /[가-힣]/.test(koreanSimple)) {
      console.log('🇰🇷 Korean simple match:', koreanSimple);
      return koreanSimple;
    }

    return 'Unknown Location';
  }

  /**
   * Get all clubs that a user is a member of
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's club memberships
   */
  async getUserClubMemberships(userId) {
    try {
      console.log('🔍 Getting club memberships for user:', userId);

      // Validate user ID
      if (!userId) {
        console.error('❌ No userId provided to getUserClubMemberships');
        return [];
      }

      // Check cache first for faster performance
      const cacheKey = `memberships_${userId}`;
      const cachedData = this.membershipCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
        console.log('⚡ Using cached membership data:', cachedData.data.length, 'clubs');
        return cachedData.data;
      }

      // 단순한 쿼리로 시작 (orderBy 제거하여 인덱스 문제 방지)
      const membershipsQuery = query(collection(db, 'clubMembers'), where('userId', '==', userId));

      console.log('🔍 Executing clubMembers query for userId:', userId);
      console.log('🔍 Query details:', {
        collection: 'clubMembers',
        where: ['userId', '==', userId],
      });

      const querySnapshot = await getDocs(membershipsQuery);
      console.log(`🔍 Firebase query completed - found ${querySnapshot.size} membership records`);

      if (querySnapshot.size === 0) {
        console.log('ℹ️ No clubs joined yet for user:', userId);
        // This is a normal state for new users or users who haven't joined any clubs
      }

      // 1단계: active 멤버십만 사전 필터링 (MyClubsScreen에는 활성 멤버십만 표시)
      const validMemberships = querySnapshot.docs.filter(memberDoc => {
        const memberData = memberDoc.data();
        const isValid = memberData.status === 'active';
        if (!isValid) {
          console.log('⏭️ Skipping non-active membership:', memberData.status);
        }
        return isValid;
      });

      console.log(
        `🔍 Processing ${validMemberships.length} valid memberships out of ${querySnapshot.size} total`
      );

      // 2단계: 병렬로 모든 클럽 정보 가져오기 (성능 최적화)
      const clubPromises = validMemberships.map(async memberDoc => {
        const memberData = memberDoc.data();
        console.log('🔍 Processing membership:', memberDoc.id, memberData);

        const clubRef = doc(db, 'tennis_clubs', memberData.clubId);
        console.log('🔍 Getting club info for:', memberData.clubId);

        try {
          const clubDoc = await getDoc(clubRef);

          if (clubDoc.exists()) {
            const clubData = clubDoc.data();
            console.log('🔍 Found club data:', clubData);
            return this._processClubData(memberDoc, memberData, clubData);
          } else {
            console.log('⚠️ Club not found:', memberData.clubId);
            return this._createFallbackClubData(memberDoc, memberData);
          }
        } catch (clubError) {
          console.error('❌ Error getting club data for', memberData.clubId, clubError);
          return this._createFallbackClubData(memberDoc, memberData);
        }
      });

      // 3단계: 모든 Promise 완료 대기 (병렬 실행)
      const startTime = Date.now();
      const userClubs = await Promise.all(clubPromises);
      const endTime = Date.now();
      console.log(`⚡ Parallel processing completed in ${endTime - startTime}ms`);

      // 가입일 기준으로 정렬 (클라이언트에서)
      userClubs.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());

      // Cache the results for faster subsequent access
      this.membershipCache.set(cacheKey, {
        data: userClubs,
        timestamp: Date.now(),
      });

      console.log(`✅ Retrieved ${userClubs.length} club memberships for user ${userId}`);
      return userClubs;
    } catch (error) {
      // 🔇 [KIM FIX] 새 유저 온보딩 중 권한 에러는 조용히 처리
      const isPermissionError =
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions');
      if (isPermissionError) {
        console.log('🔒 Club memberships query skipped (user may be in onboarding or signed out)');
      } else {
        console.warn('⚠️ Error getting user club memberships:', error);
      }
      // 에러 발생시 빈 배열 반환하여 UI에서 empty state 표시
      return [];
    }
  }

  /**
   * Get all events that user has joined or created
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of events user is participating in
   */
  async getUserEvents(userId) {
    try {
      console.log('📅 [getUserEvents] Getting events for user:', userId);

      if (!userId) {
        console.error('❌ [getUserEvents] No userId provided');
        return [];
      }

      // Query events where user is a participant
      const participantsQuery = query(
        collectionGroup(db, 'participation_applications'),
        where('userId', '==', userId),
        where('status', '==', 'approved')
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      console.log(`📅 [getUserEvents] Found ${participantsSnapshot.size} approved participations`);

      if (participantsSnapshot.empty) {
        console.log('ℹ️ [getUserEvents] No events joined yet');
        return [];
      }

      // Extract unique event IDs
      const eventIds = new Set();
      participantsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.eventId) {
          eventIds.add(data.eventId);
        }
      });

      console.log(`📅 [getUserEvents] Found ${eventIds.size} unique events`);

      if (eventIds.size === 0) {
        return [];
      }

      // Fetch event details
      const events = [];
      for (const eventId of eventIds) {
        try {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            events.push({
              id: eventDoc.id,
              ...eventDoc.data(),
            });
          }
        } catch (error) {
          console.error(`❌ [getUserEvents] Error fetching event ${eventId}:`, error);
        }
      }

      console.log(`✅ [getUserEvents] Returning ${events.length} events`);
      return events;
    } catch (error) {
      console.error('❌ [getUserEvents] Error:', error);
      return [];
    }
  }

  /**
   * Join club (accept invitation or direct join)
   * @param {string} clubId - Club ID
   * @param {string} invitationId - Optional invitation ID
   * @returns {Promise} Join promise
   */
  async joinClub(clubId, invitationId = null, joinMessage = '') {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // Check if already a member
      const membershipId = `${clubId}_${currentUser.uid}`;
      const memberRef = doc(db, 'clubMembers', membershipId);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists() && memberSnap.data().status === 'active') {
        throw new Error('Already a member of this club');
      }

      // 🎾 [MEMBERSHIP LIMIT] Check if user has reached maximum club memberships
      const membershipStatus = await this.getUserClubMembershipsCount(currentUser.uid);
      if (!membershipStatus.canJoin) {
        console.log(
          `🚫 [MembershipLimit] User ${currentUser.uid} has reached max clubs (${membershipStatus.count}/${membershipStatus.maxAllowed})`
        );
        throw new Error(
          `클럽은 최대 ${membershipStatus.maxAllowed}개까지만 가입할 수 있습니다. 현재 ${membershipStatus.count}개의 클럽에 가입되어 있습니다.`
        );
      }

      // Get club data
      const clubData = await this.getClub(clubId);

      // Join club logic
      // 🎯 KEY FIX: If invitationId exists, user was invited by admin - skip approval requirement
      // The invitation itself IS the approval!
      if (clubData.settings.joinRequiresApproval && !invitationId) {
        // If approval required, create join request in club_join_requests collection
        const joinRequestsRef = collection(db, 'clubJoinRequests');
        const joinRequestDoc = {
          clubId,
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email || '신규 사용자',
          userEmail: currentUser.email,
          userAvatar: currentUser.photoURL || null,
          message: joinMessage || '',
          skillLevel: 'intermediate', // Get from user profile later
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const joinRequestResult = await addDoc(joinRequestsRef, joinRequestDoc);
        console.log('✅ Join request created in club_join_requests collection');
      } else {
        // If no approval required, directly create membership
        await runTransaction(db, async transaction => {
          const memberDoc = {
            clubId,
            userId: currentUser.uid,
            role: 'member',
            status: 'active',
            joinedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            memberInfo: {
              joinedViaRequest: false,
              directJoin: true,
            },
          };

          transaction.set(memberRef, memberDoc);

          // Update club stats
          const clubRef = doc(db, 'tennis_clubs', clubId);
          transaction.update(clubRef, {
            'statistics.totalMembers': increment(1),
            'statistics.activeMembers': increment(1),
            updatedAt: serverTimestamp(),
          });

          // Update invitation status if provided
          if (invitationId) {
            const invitationRef = doc(db, 'clubInvitations', invitationId);
            transaction.update(invitationRef, {
              status: 'accepted',
              respondedAt: serverTimestamp(),
            });
          }

          // Update user's club memberships
          const userRef = doc(db, 'users', currentUser.uid);
          transaction.update(userRef, {
            'clubs.memberships': arrayUnion(clubId),
            updatedAt: serverTimestamp(),
          });
        });
      }

      // Clear membership cache for this user
      this.clearMembershipCache(currentUser.uid);

      // Send push notification to club admins if approval is required
      if (clubData.settings.joinRequiresApproval) {
        try {
          const userDisplayName = currentUser.displayName || currentUser.email || '신규 사용자';

          await pushNotificationService.sendToClubAdmins(clubId, {
            title: `[${clubData.profile?.name || clubData.name}]에 새로운 가입 신청이 있습니다.`,
            body: `${userDisplayName}님이 가입을 신청했습니다.`,
            data: {
              type: 'club_application',
              clubId: clubId,
              applicantId: currentUser.uid,
              targetScreen: 'ClubDetail',
            },
          });

          console.log('✅ Push notification sent to club admins');
        } catch (notificationError) {
          console.warn('⚠️ Failed to send push notification:', notificationError);
          // Don't throw error - join should succeed even if notification fails
        }
      }

      console.log('✅ Successfully joined club');
      return { success: true, message: 'Join request completed successfully' };
    } catch (error) {
      console.error('❌ Failed to join club:', error);
      throw error;
    }
  }

  /**
   * Leave club
   * @param {string} clubId - Club ID
   * @returns {Promise} Leave promise
   */
  async leaveClub(clubId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      // 🚀 Call Cloud Function instead of complex client transaction
      const leaveClubCallable = httpsCallable(functions, 'leaveClub');

      const result = await leaveClubCallable({ clubId });

      console.log('✅ Cloud Function returned:', result.data);

      // Clear membership cache for this user
      this.clearMembershipCache(currentUser.uid);

      return result.data;
    } catch (error) {
      console.error(`❌ Error calling 'leaveClub' function:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Transfer club ownership to another admin/manager
   * @param {string} clubId - Club ID
   * @param {string} newOwnerId - User ID of new owner (must be admin/manager)
   * @returns {Promise<Object>} Transfer result
   */
  async transferClubOwnership(clubId, newOwnerId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      console.log('🔄 [TransferOwnership] Calling Cloud Function', {
        clubId,
        newOwnerId,
      });

      const transferOwnershipCallable = httpsCallable(functions, 'transferClubOwnership');
      const result = await transferOwnershipCallable({ clubId, newOwnerId });

      console.log('✅ [TransferOwnership] Success:', result.data);

      // Clear membership cache for both users
      this.clearMembershipCache(currentUser.uid);
      this.clearMembershipCache(newOwnerId);

      return result.data;
    } catch (error) {
      console.error(`❌ Error calling 'transferClubOwnership' function:`, error);
      throw error;
    }
  }

  /**
   * 🔍 Get eligible candidates for ownership transfer (admins/managers)
   * @param {string} clubId - Club ID
   * @returns {Promise<Array>} List of eligible candidates
   */
  async getOwnershipTransferCandidates(clubId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      // 🔄 [KIM FIX] manager만 후보로 반환 (admin은 현재 오너)
      const membersRef = collection(db, 'clubMembers');
      const q = query(
        membersRef,
        where('clubId', '==', clubId),
        where('role', '==', 'manager'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const candidates = [];

      for (const memberDoc of snapshot.docs) {
        const memberData = memberDoc.data();
        // Exclude current user
        if (memberData.userId === currentUser.uid) continue;

        // Get user details
        const userDocRef = doc(db, 'users', memberData.userId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};

        candidates.push({
          id: memberDoc.id,
          userId: memberData.userId,
          displayName:
            userData.displayName ||
            userData.profile?.displayName ||
            userData.nickname ||
            memberData.userName ||
            'Unknown',
          // 🔄 [KIM FIX] profile.photoURL이 가장 일반적인 위치
          userAvatar:
            userData.profile?.photoURL ||
            userData.profileImage ||
            userData.photoURL ||
            memberData.userAvatar ||
            null,
          role: memberData.role,
          joinedAt: memberData.joinedAt,
        });
      }

      // Sort by joinedAt (oldest first)
      candidates.sort((a, b) => {
        const aTime = a.joinedAt?.toDate?.() || new Date(a.joinedAt || 0);
        const bTime = b.joinedAt?.toDate?.() || new Date(b.joinedAt || 0);
        return aTime - bTime;
      });

      console.log(`🔍 [TransferOwnership] Found ${candidates.length} candidates`);
      return candidates;
    } catch (error) {
      console.error('❌ Error getting ownership transfer candidates:', error);
      throw error;
    }
  }

  // ============ DEBUG UTILITIES ============

  /**
   * Debug: Investigate membership document existence
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Object>} Debug information
   */
  async debugMembershipDocument(clubId, userId = null) {
    try {
      const currentUser = authService.getCurrentUser();
      const targetUserId = userId || currentUser?.uid;

      if (!targetUserId) throw new Error('User ID required');

      console.log(`🔍 DEBUG: Investigating membership for user ${targetUserId} in club ${clubId}`);

      const debugInfo = {
        clubId,
        userId: targetUserId,
        checks: {},
      };

      // Check 1: Direct document lookup with assumed ID format
      const assumedDocumentId = `${clubId}_${targetUserId}`;
      const assumedDocRef = doc(db, 'clubMembers', assumedDocumentId);
      try {
        const assumedDocSnap = await getDoc(assumedDocRef);
        debugInfo.checks.assumedIdFormat = {
          documentId: assumedDocumentId,
          exists: assumedDocSnap.exists(),
          data: assumedDocSnap.exists() ? assumedDocSnap.data() : null,
        };
      } catch (error) {
        debugInfo.checks.assumedIdFormat = { error: error.message };
      }

      // Check 2: Query-based lookup
      const membersQuery = query(
        collection(db, 'clubMembers'),
        where('userId', '==', targetUserId),
        where('clubId', '==', clubId)
      );

      try {
        const querySnapshot = await getDocs(membersQuery);
        debugInfo.checks.queryBased = {
          found: !querySnapshot.empty,
          count: querySnapshot.docs.length,
          documents: querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          })),
        };
      } catch (error) {
        debugInfo.checks.queryBased = { error: error.message };
      }

      // Check 3: All documents for this user across all clubs
      const userMembershipsQuery = query(
        collection(db, 'clubMembers'),
        where('userId', '==', targetUserId)
      );

      try {
        const userMembershipsSnapshot = await getDocs(userMembershipsQuery);
        debugInfo.checks.allUserMemberships = {
          count: userMembershipsSnapshot.docs.length,
          documents: userMembershipsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          })),
        };
      } catch (error) {
        debugInfo.checks.allUserMemberships = { error: error.message };
      }

      // Check 4: All documents for this club
      const clubMembershipsQuery = query(
        collection(db, 'clubMembers'),
        where('clubId', '==', clubId)
      );

      try {
        const clubMembershipsSnapshot = await getDocs(clubMembershipsQuery);
        debugInfo.checks.allClubMemberships = {
          count: clubMembershipsSnapshot.docs.length,
          documents: clubMembershipsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          })),
        };
      } catch (error) {
        debugInfo.checks.allClubMemberships = { error: error.message };
      }

      console.log('🔍 DEBUG RESULTS:', JSON.stringify(debugInfo, null, 2));
      return debugInfo;
    } catch (error) {
      console.error('❌ Failed to debug membership document:', error);
      throw error;
    }
  }

  // ============ EVENT MANAGEMENT ============

  /**
   * Create club event
   * @param {string} clubId - Club ID
   * @param {Object} eventData - Event information
   * @returns {Promise<string>} Created event ID
   */
  async createClubEvent(clubId, eventData) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      // Check permissions
      const canCreate = await this.checkClubPermission(clubId, 'manager');
      if (!canCreate) {
        throw new Error('Insufficient permissions to create events');
      }

      const eventsRef = collection(db, 'clubEvents');
      const eventDoc = {
        ...eventData,
        clubId,
        participants: {
          maxParticipants: eventData.maxParticipants || null,
          currentCount: 0,
          registeredIds: [],
          waitlistIds: [],
          attendedIds: [],
        },
        status: 'published',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(eventsRef, eventDoc);

      // Update club stats
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        'stats.totalEvents': increment(1),
        'stats.monthlyEvents': increment(1),
        updatedAt: serverTimestamp(),
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
   * @param {Object} filters - Event filters
   * @returns {Promise<Array>} Array of club events
   */
  async getClubEvents(clubId, filters = {}) {
    try {
      const eventsRef = collection(db, 'clubEvents');
      let q = query(
        eventsRef,
        where('clubId', '==', clubId),
        where('status', 'in', ['published', 'ongoing']),
        orderBy('schedule.startTime', 'asc'),
        limit(50)
      );

      // Apply date filter for upcoming events
      if (filters.upcoming) {
        q = query(q, where('schedule.startTime', '>', new Date()));
      }

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ Found ${events.length} club events`);
      return events;
    } catch (error) {
      console.error('❌ Failed to get club events:', error);
      throw error;
    }
  }

  /**
   * Join club event
   * @param {string} eventId - Event ID
   * @returns {Promise} Join promise
   */
  async joinEvent(eventId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      await runTransaction(db, async transaction => {
        const eventRef = doc(db, 'clubEvents', eventId);
        const eventDoc = await transaction.get(eventRef);

        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }

        const eventData = eventDoc.data();
        const registeredIds = eventData.participants.registeredIds || [];

        if (registeredIds.includes(currentUser.uid)) {
          throw new Error('Already registered for this event');
        }

        // Check if event is full
        const maxParticipants = eventData.participants.maxParticipants;
        if (maxParticipants && registeredIds.length >= maxParticipants) {
          throw new Error('Event is full');
        }

        // Add user to participants
        transaction.update(eventRef, {
          'participants.registeredIds': arrayUnion(currentUser.uid),
          'participants.currentCount': increment(1),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Successfully joined event');
    } catch (error) {
      console.error('❌ Failed to join event:', error);
      throw error;
    }
  }

  // ============ CHAT MANAGEMENT ============

  /**
   * Send message to club chat
   * @param {string} clubId - Club ID
   * @param {Object} messageData - Message data
   * @returns {Promise<string>} Message ID
   */
  async sendClubMessage(clubId, messageData) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      // Check if user is club member
      const isMember = await this.checkClubMembership(clubId);
      if (!isMember) {
        throw new Error('Must be a club member to send messages');
      }

      const chatRef = collection(db, 'clubChat');
      const messageDoc = {
        clubId,
        senderId: currentUser.uid,
        senderInfo: {
          displayName: currentUser.displayName || '',
          nickname: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
          role: 'member', // Get actual role from membership
        },
        content: {
          text: messageData.text || '',
          imageUrls: messageData.imageUrls || [],
          attachments: messageData.attachments || [],
        },
        type: messageData.type || 'message',
        relatedEventId: messageData.relatedEventId || null,
        replyTo: messageData.replyTo || null,
        isEdited: false,
        isDeleted: false,
        readBy: {
          [currentUser.uid]: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(chatRef, messageDoc);

      console.log('✅ Club message sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to send club message:', error);
      throw error;
    }
  }

  /**
   * Get club chat messages
   * @param {string} clubId - Club ID
   * @param {number} limitCount - Message limit
   * @returns {Promise<Array>} Array of messages
   */
  async getClubMessages(clubId, limitCount = 50) {
    try {
      const chatRef = collection(db, 'clubChat');
      const q = query(
        chatRef,
        where('clubId', '==', clubId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse(); // Reverse to get chronological order

      console.log(`✅ Retrieved ${messages.length} club messages`);
      return messages;
    } catch (error) {
      console.error('❌ Failed to get club messages:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check user's club membership
   * @param {string} clubId - Club ID
   * @returns {Promise<boolean>} Membership status
   */
  async checkClubMembership(clubId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return false;

      const membershipId = `${clubId}_${currentUser.uid}`;
      const memberRef = doc(db, 'clubMembers', membershipId);
      const memberSnap = await getDoc(memberRef);

      return memberSnap.exists() && memberSnap.data().status === 'active';
    } catch (error) {
      console.error('❌ Failed to check membership:', error);
      return false;
    }
  }

  /**
   * Check user's club permissions
   * @param {string} clubId - Club ID
   * @param {string} requiredRole - Required minimum role
   * @returns {Promise<boolean>} Permission status
   */
  async checkClubPermission(clubId, requiredRole = 'member') {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return false;

      const membershipId = `${clubId}_${currentUser.uid}`;
      const memberRef = doc(db, 'clubMembers', membershipId);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists() || memberSnap.data().status !== 'active') {
        return false;
      }

      const userRole = memberSnap.data().role;
      const roleHierarchy = { member: 1, manager: 2, admin: 3 };

      return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    } catch (error) {
      console.error('❌ Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Get user's clubs
   * @returns {Promise<Array>} Array of user's clubs
   */
  async getUserClubs() {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return [];

      const membersRef = collection(db, 'clubMembers');
      const q = query(
        membersRef,
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('joinedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const memberships = snapshot.docs.map(doc => doc.data());

      // Get club details for each membership
      const clubPromises = memberships.map(membership => this.getClub(membership.clubId));
      const clubs = await Promise.all(clubPromises);

      console.log(`✅ Found ${clubs.length} user clubs`);
      return clubs.map((club, index) => ({
        id: club.id,
        // Normalize name field - check both profile.name and name
        name: club.profile?.name || club.name || 'Unknown Club',
        // Normalize logo URL - check both profile.logo and logoUrl
        logoUrl: club.profile?.logo || club.logoUrl || null,
        // Add other normalized fields
        description: club.profile?.description || club.description || '',
        location: club.profile?.location || club.location || '',
        // User membership info
        userRole: memberships[index].role,
        joinedAt: memberships[index].joinedAt,
        // Keep original data for other fields that might be needed
        ...club,
      }));
    } catch (error) {
      console.error('❌ Failed to get user clubs:', error);
      throw error;
    }
  }

  // ============ REAL-TIME LISTENERS ============

  /**
   * Subscribe to club updates
   * @param {string} clubId - Club ID
   * @param {Function} callback - Update callback
   * @returns {Function} Unsubscribe function
   */
  subscribeToClub(clubId, callback) {
    const clubRef = doc(db, 'clubs', clubId);
    return onSnapshot(clubRef, doc => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  /**
   * Subscribe to club chat messages
   * @param {string} clubId - Club ID
   * @param {Function} callback - Message callback
   * @param {string} currentUserId - Current user ID
   * @param {Function} onNewMessage - Callback for new messages (for notifications)
   * @returns {Function} Unsubscribe function
   */
  subscribeToClubChat(clubId, callback, currentUserId, onNewMessage) {
    const chatRef = collection(db, 'clubChat');
    const q = query(
      chatRef,
      where('clubId', '==', clubId),
      // Removed isDeleted filter to avoid composite index requirement
      // Filter deleted messages on client-side instead
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    let isFirstLoad = true;

    return onSnapshot(q, snapshot => {
      // Filter out deleted messages on client-side
      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => !msg.isDeleted)
        .reverse();
      callback(messages);

      // Trigger notification for new messages (skip first load)
      if (!isFirstLoad && onNewMessage) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const message = { id: change.doc.id, ...change.doc.data() };

            // Only notify if message is from someone else and not deleted
            if (message.senderId !== currentUserId && !message.isDeleted) {
              onNewMessage({
                id: message.id,
                type: 'club',
                chatId: clubId,
                senderId: message.senderId,
                senderName: message.senderName,
                message: message.message,
                timestamp: message.createdAt?.toDate ? message.createdAt.toDate() : new Date(),
              });
            }
          }
        });
      }

      isFirstLoad = false;
    });
  }

  /**
   * Save a club chat message
   * @param {string} clubId - Club ID
   * @param {Object} messageData - Message data
   * @returns {Promise<void>}
   */
  async saveClubChatMessage(clubId, messageData) {
    try {
      const chatRef = collection(db, 'clubChat');
      await addDoc(chatRef, {
        ...messageData,
        clubId,
        isDeleted: false,
        readBy: [messageData.senderId], // Sender already read their own message
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(), // For compatibility
      });
      console.log('[clubService] Saved message with readBy:', [messageData.senderId]);
    } catch (error) {
      console.error('[clubService] Error saving club chat message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read by a user
   * @param {string[]} messageIds - Array of message IDs to mark as read
   * @param {string} userId - ID of user who read the messages
   */
  async markMessagesAsRead(messageIds, userId) {
    try {
      if (!messageIds || messageIds.length === 0) {
        console.log('[clubService] No messages to mark as read');
        return;
      }

      console.log(`[clubService] Marking ${messageIds.length} messages as read for user ${userId}`);

      const batch = writeBatch(db);

      messageIds.forEach(messageId => {
        const messageRef = doc(db, 'clubChat', messageId);
        batch.update(messageRef, {
          readBy: arrayUnion(userId), // Add userId to readBy array (no duplicates)
        });
      });

      await batch.commit();
      console.log('[clubService] Messages marked as read successfully');
    } catch (error) {
      console.error('[clubService] Error marking messages as read:', error);
      throw error;
    }
  }

  // ============ SCHEDULE MANAGEMENT ============

  /**
   * Create a new club schedule template
   * @param {string} clubId - Club ID
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<string>} Created schedule ID
   */
  async createClubSchedule(clubId, scheduleData) {
    try {
      console.log('📅 Creating club schedule:', clubId, scheduleData);

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

      const scheduleDoc = {
        clubId: clubId,
        title: scheduleData.title,
        location: scheduleData.location,
        dayOfWeek: scheduleData.dayOfWeek, // 0-6 (Sunday-Saturday)
        startTime: scheduleData.startTime, // "HH:MM" format
        endTime: scheduleData.endTime, // "HH:MM" format
        isActive: scheduleData.isActive || true,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      // Try Firebase first
      try {
        const schedulesRef = collection(db, 'clubSchedules');
        const docRef = await addDoc(schedulesRef, scheduleDoc);

        console.log('✅ Club schedule created successfully in Firebase:', docRef.id);
        return docRef.id;
      } catch (firebaseError) {
        console.warn(
          '⚠️ Firebase unavailable, using mock schedule creation:',
          firebaseError.message
        );

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockScheduleId = `mock-schedule-${Date.now()}`;
        console.log('✅ Mock club schedule creation successful:', mockScheduleId);
        return mockScheduleId;
      }
    } catch (error) {
      console.error('❌ Failed to create club schedule:', error);
      throw new Error('정기 모임 생성 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Get all club schedule templates
   * @param {string} clubId - Club ID
   * @returns {Promise<Array>} Array of club schedules
   */
  async getClubSchedules(clubId) {
    try {
      console.log('📅 Getting club schedules for:', clubId);

      // Try Firebase first
      try {
        const schedulesRef = collection(db, 'clubSchedules');
        const q = query(
          schedulesRef,
          where('clubId', '==', clubId),
          where('isActive', '==', true),
          orderBy('dayOfWeek', 'asc'),
          orderBy('startTime', 'asc')
        );

        const snapshot = await getDocs(q);
        const schedules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }));

        console.log(`✅ Found ${schedules.length} club schedules`);
        return schedules;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, returning mock schedules:', firebaseError.message);

        // Return mock data for development
        const mockSchedules = [
          {
            id: 'mock-schedule-1',
            clubId: clubId,
            title: '주말 단식 연습',
            location: '중앙공원 테니스장',
            dayOfWeek: 6, // 토요일
            startTime: '09:00',
            endTime: '11:00',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdBy: 'mock-user-id',
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: 'mock-schedule-2',
            clubId: clubId,
            title: '평일 저녁 복식',
            location: '시립 테니스장',
            dayOfWeek: 3, // 수요일
            startTime: '19:00',
            endTime: '21:00',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdBy: 'mock-user-id',
            updatedAt: new Date('2024-01-01'),
          },
        ];

        console.log(`✅ Returning ${mockSchedules.length} mock schedules`);
        return mockSchedules;
      }
    } catch (error) {
      console.error('❌ Failed to get club schedules:', error);
      throw new Error('정기 모임 목록을 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  /**
   * Delete a club schedule template
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise} Delete promise
   */
  async deleteClubSchedule(scheduleId) {
    try {
      console.log('🗑️ Deleting club schedule:', scheduleId);

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

      // Try Firebase first
      try {
        const scheduleRef = doc(db, 'clubSchedules', scheduleId);

        // Soft delete by setting isActive to false
        await updateDoc(scheduleRef, {
          isActive: false,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser.uid,
        });

        console.log('✅ Club schedule deleted successfully in Firebase');
        return true;
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using mock deletion:', firebaseError.message);

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('✅ Mock club schedule deletion successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to delete club schedule:', error);
      throw new Error('정기 모임 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  }

  // ============ OFFLINE SYNC MANAGEMENT ============

  /**
   * Sync offline clubs to Firebase when online
   * @returns {Promise<Object>} Sync results
   */
  async syncOfflineClubs() {
    try {
      console.log('🔄 Starting offline clubs sync...');

      // Check if we're online
      const isOnline = await offlineStorageService.isOnline();
      if (!isOnline) {
        console.log('⚠️ No internet connection, skipping sync');
        return { success: [], failed: [], total: 0, error: 'No internet connection' };
      }

      // Get storage stats before sync
      const statsBefore = await offlineStorageService.getStorageStats();
      console.log('📊 Pre-sync stats:', statsBefore);

      // Process sync queue with clubService instance
      const syncResults = await offlineStorageService.processSyncQueue({
        clubService: this,
      });

      // Get storage stats after sync
      const statsAfter = await offlineStorageService.getStorageStats();
      console.log('📊 Post-sync stats:', statsAfter);

      console.log('✅ Offline sync completed:', syncResults);
      return syncResults;
    } catch (error) {
      console.error('❌ Failed to sync offline clubs:', error);
      return { success: [], failed: [], total: 0, error: error.message };
    }
  }

  /**
   * Get offline storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getOfflineStats() {
    return await offlineStorageService.getStorageStats();
  }

  /**
   * Clear offline data (for testing or reset)
   * @returns {Promise<boolean>} Success status
   */
  async clearOfflineData() {
    return await offlineStorageService.clearOfflineData();
  }

  // ============ AUTOMATIC EVENT CREATION (Cloud Function Logic) ============

  /*
   * 📋 CLOUD FUNCTION DESIGN FOR AUTOMATIC EVENT CREATION
   *
   * 이 섹션은 Firebase Cloud Functions에서 구현될 자동 이벤트 생성 로직의 설계를 설명합니다.
   * 실제 구현이 아닌 개념적 설계이며, 주석으로 작성되었습니다.
   *
   * === 예약된 Cloud Function 설정 ===
   *
   * 1. 스케줄 설정: 매주 월요일 새벽 2시에 실행
   *    - exports.createWeeklyEvents = functions.pubsub.schedule('0 2 * * 1')
   *    - 시간대: Asia/Seoul
   *
   * 2. 주요 실행 로직:
   *
   * async function createWeeklyEvents() {
   *   try {
   *     console.log('🔄 Starting weekly event creation...');
   *
   *     // Step 1: 모든 활성 clubSchedules 조회
   *     const schedulesSnapshot = await admin.firestore()
   *       .collection('clubSchedules')
   *       .where('isActive', '==', true)
   *       .get();
   *
   *     const schedules = schedulesSnapshot.docs.map(doc => ({
   *       id: doc.id,
   *       ...doc.data()
   *     }));
   *
   *     console.log(`📅 Found ${schedules.length} active schedules`);
   *
   *     // Step 2: 각 스케줄에 대해 이번 주 이벤트 생성
   *     for (const schedule of schedules) {
   *       await createEventForSchedule(schedule);
   *     }
   *
   *     console.log('✅ Weekly event creation completed');
   *
   *   } catch (error) {
   *     console.error('❌ Weekly event creation failed:', error);
   *     throw error;
   *   }
   * }
   *
   * async function createEventForSchedule(schedule) {
   *   // Step 2.1: 이번 주 해당 요일 날짜 계산
   *   const today = new Date();
   *   const currentWeekStart = getStartOfWeek(today); // 이번 주 일요일
   *   const eventDate = new Date(currentWeekStart);
   *   eventDate.setDate(currentWeekStart.getDate() + schedule.dayOfWeek);
   *
   *   // Step 2.2: 이미 해당 날짜에 이벤트가 있는지 중복 확인
   *   const existingEventsSnapshot = await admin.firestore()
   *     .collection('events')
   *     .where('clubId', '==', schedule.clubId)
   *     .where('type', '==', 'clubMeetup')
   *     .where('scheduleId', '==', schedule.id)
   *     .where('eventDate', '==', admin.firestore.Timestamp.fromDate(eventDate))
   *     .get();
   *
   *   if (!existingEventsSnapshot.empty) {
   *     console.log(`⏭️ Event already exists for ${schedule.title} on ${eventDate.toDateString()}`);
   *     return;
   *   }
   *
   *   // Step 2.3: 시작/종료 시간 설정
   *   const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
   *   const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
   *
   *   const startDateTime = new Date(eventDate);
   *   startDateTime.setHours(startHours, startMinutes, 0, 0);
   *
   *   const endDateTime = new Date(eventDate);
   *   endDateTime.setHours(endHours, endMinutes, 0, 0);
   *
   *   // Step 2.4: 클럽 멤버 조회 (자동 참석자 등록용)
   *   const membersSnapshot = await admin.firestore()
   *     .collection('clubMembers')
   *     .where('clubId', '==', schedule.clubId)
   *     .where('status', '==', 'active')
   *     .get();
   *
   *   const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);
   *
   *   // Step 2.5: 이벤트 문서 생성
   *   const eventData = {
   *     title: schedule.title,
   *     description: `정기 모임: ${schedule.title}`,
   *     clubId: schedule.clubId,
   *     scheduleId: schedule.id, // 어떤 스케줄로부터 생성되었는지 추적
   *     type: 'clubMeetup',
   *     location: schedule.location,
   *     eventDate: admin.firestore.Timestamp.fromDate(eventDate),
   *     startTime: admin.firestore.Timestamp.fromDate(startDateTime),
   *     endTime: admin.firestore.Timestamp.fromDate(endDateTime),
   *     maxParticipants: null, // 클럽 정기 모임은 제한 없음
   *     participants: memberIds, // 클럽 회원은 자동 승인됨 (청사진 참조)
   *     waitingList: [],
   *     status: 'active',
   *     isAutoGenerated: true, // 자동 생성 이벤트임을 표시
   *     createdAt: admin.firestore.FieldValue.serverTimestamp(),
   *     createdBy: 'system', // 시스템에 의해 자동 생성
   *     updatedAt: admin.firestore.FieldValue.serverTimestamp()
   *   };
   *
   *   // Step 2.6: 이벤트 저장
   *   await admin.firestore().collection('events').add(eventData);
   *
   *   console.log(`✅ Created event: ${schedule.title} for ${eventDate.toDateString()}`);
   *
   *   // Step 2.7: 클럽 멤버들에게 푸시 알림 발송 (선택사항)
   *   // await sendNotificationToClubMembers(schedule.clubId, eventData);
   * }
   *
   * function getStartOfWeek(date) {
   *   const result = new Date(date);
   *   const day = result.getDay();
   *   const diff = result.getDate() - day;
   *   return new Date(result.setDate(diff));
   * }
   *
   * === 추가 고려사항 ===
   *
   * 1. 오류 처리:
   *    - 개별 스케줄 처리 실패 시 전체 처리를 중단하지 않음
   *    - 실패한 스케줄은 로그에 기록하고 다음 스케줄 처리 계속
   *
   * 2. 성능 최적화:
   *    - 배치 쓰기 사용으로 Firestore 쓰기 횟수 최적화
   *    - 병렬 처리로 처리 시간 단축
   *
   * 3. 모니터링:
   *    - Cloud Logging을 통한 실행 로그 수집
   *    - 실패 시 관리자에게 알림 발송
   *    - 생성된 이벤트 수 등 메트릭 수집
   *
   * 4. 테스트:
   *    - 단위 테스트로 개별 함수 검증
   *    - 통합 테스트로 전체 플로우 검증
   *    - 스테이징 환경에서 주간 실행 테스트
   *
   * 이 Cloud Function은 clubSchedules 컬렉션의 데이터를 바탕으로
   * 매주 자동으로 events 컬렉션에 새 이벤트를 생성하여
   * 클럽 정기 모임의 연속성을 보장합니다.
   */

  /**
   * Get clubs where user is admin
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of clubs where user is admin
   */
  async getAdminClubs(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('🔍 Getting admin clubs for user:', userId);

      // Query club memberships where user is admin
      const membershipsRef = collection(db, 'clubMembers');
      const q = query(
        membershipsRef,
        where('userId', '==', userId),
        where('role', '==', 'admin'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const adminClubs = [];

      for (const memberDoc of querySnapshot.docs) {
        const memberData = memberDoc.data();
        const clubId = memberData.clubId;

        // Get club details
        try {
          const clubDoc = await getDoc(doc(db, 'tennis_clubs', clubId));
          if (clubDoc.exists()) {
            const clubData = clubDoc.data();
            adminClubs.push({
              id: clubDoc.id,
              name: clubData.profile?.name || 'Unknown Club',
              ...clubData,
            });
          }
        } catch (clubError) {
          console.warn('⚠️ Failed to get club details for:', clubId, clubError);
        }
      }

      console.log('✅ Found admin clubs:', adminClubs.length);
      return adminClubs;
    } catch (error) {
      console.error('❌ Failed to get admin clubs:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Send welcome announcement to all club members when new member joins
   * @param {string} clubId - Club ID
   * @param {Object} newMemberData - New member user data
   * @param {Object} clubData - Club data
   * @returns {Promise<void>}
   */
  async sendClubWelcomeAnnouncement(clubId, newMemberData, clubData) {
    try {
      console.log('📢 Sending welcome announcement for new member in club:', clubId);

      // Get all active club members except the new member
      const membersRef = collection(db, 'clubMembers');
      const q = query(membersRef, where('clubId', '==', clubId), where('status', '==', 'active'));

      const membersSnapshot = await getDocs(q);
      const memberTokens = [];

      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();

        // Skip the new member
        if (memberData.userId === newMemberData.uid) continue;

        // Get member's FCM token
        try {
          const userRef = doc(db, 'users', memberData.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          if (userData?.fcmToken) {
            memberTokens.push({
              token: userData.fcmToken,
              userId: memberData.userId,
            });
          }
        } catch (userError) {
          console.warn('⚠️ Failed to get user data for member:', memberData.userId, userError);
        }
      }

      if (memberTokens.length > 0) {
        const newMemberName =
          newMemberData?.profile?.displayName || newMemberData?.profile?.name || '새 멤버';
        const clubName = clubData?.profile?.name || '클럽';

        const announcementData = {
          title: `${clubName} 새 멤버 🎉`,
          body: `${newMemberName}님이 클럽에 합류했습니다! 함께 환영해주세요.`,
          data: {
            type: 'club_new_member',
            clubId: clubId,
            clubName: clubName,
            newMemberId: newMemberData.uid,
            newMemberName: newMemberName,
          },
        };

        // Send notification to all club members
        const notificationPromises = memberTokens.map(({ token }) =>
          pushNotificationService
            .sendNotification(
              token,
              announcementData.title,
              announcementData.body,
              announcementData.data
            )
            .catch(error => {
              console.warn('⚠️ Failed to send welcome announcement to token:', token, error);
              return null; // Don't fail the entire process
            })
        );

        await Promise.allSettled(notificationPromises);
        console.log(`✅ Welcome announcement sent to ${memberTokens.length} club members`);
      } else {
        console.log('ℹ️ No club members with FCM tokens found for welcome announcement');
      }
    } catch (error) {
      console.error('❌ Failed to send club welcome announcement:', error);
      // Don't throw error - this is a nice-to-have feature
    }
  }

  /**
   * Delete a club and all its related data permanently
   * Only the original creator can delete the club
   * @param {string} clubId - Club ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteClub(clubId) {
    try {
      console.log('🔐 [AUTH CHECK] deleteClub called', { clubId });
      console.log('🗑️ Initiating club deletion for:', clubId);

      if (!clubId) {
        throw new Error('Club ID is required');
      }

      // Get current user
      const currentUser = authService.getCurrentUser();
      console.log('🔐 [AUTH CHECK] authService.getCurrentUser():', {
        exists: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
      });

      if (!currentUser) {
        throw new Error('Authentication required');
      }

      // Get ID token to verify it exists
      try {
        const idToken = await currentUser.getIdToken();
        console.log('🔐 [AUTH CHECK] ID Token obtained:', {
          tokenLength: idToken?.length || 0,
          tokenPreview: idToken?.substring(0, 20) + '...',
        });
      } catch (tokenError) {
        console.error('❌ [AUTH CHECK] Failed to get ID token:', tokenError);
      }

      // Check Firebase Auth directly
      console.log('🔐 [AUTH CHECK] Firebase auth.currentUser:', {
        exists: !!auth.currentUser,
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      });

      // Call the secure Cloud Function
      const deleteClubFunction = httpsCallable(functions, 'deleteClub');

      console.log('🚀 Calling deleteClub Cloud Function...');
      console.log('🔐 [AUTH CHECK] Functions instance:', {
        appName: functions.app.name,
        region: 'us-central1',
      });

      const result = await deleteClubFunction({ clubId });

      console.log('✅ Club deletion completed:', result.data);

      // Clear membership cache for the current user to ensure immediate UI update
      this.clearMembershipCache(currentUser.uid);
      console.log('🗑️ Cleared membership cache after club deletion');

      return {
        success: true,
        message: result.data.message,
        deletedDocuments: result.data.deletedDocuments,
        clubName: result.data.clubName,
      };
    } catch (error) {
      console.error('❌ Failed to delete club:', error);

      // Handle different error types
      if (error.code) {
        switch (error.code) {
          case 'functions/unauthenticated':
            throw new Error('로그인이 필요합니다.');
          case 'functions/permission-denied':
            throw new Error('클럽을 삭제할 권한이 없습니다. 클럽 생성자만 삭제할 수 있습니다.');
          case 'functions/not-found':
            throw new Error('클럽을 찾을 수 없습니다.');
          case 'functions/invalid-argument':
            throw new Error('잘못된 요청입니다.');
          case 'functions/internal':
          default:
            throw new Error('클럽 삭제 중 서버 오류가 발생했습니다.');
        }
      } else {
        throw new Error('클럽 삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  }

  // ============ MEMBER MANAGEMENT FUNCTIONS ============

  /**
   * Subscribe to pending join requests for a club in real-time
   * @param {string} clubId - Club ID
   * @param {Function} callback - Callback function that receives requests array
   * @returns {Function} Unsubscribe function
   */
  subscribeToJoinRequests(clubId, callback) {
    try {
      console.log(`📋 Subscribing to join requests for club: ${clubId}`);

      const q = query(
        collection(db, 'clubJoinRequests'),
        where('clubId', '==', clubId),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );

      return onSnapshot(
        q,
        async snapshot => {
          try {
            console.log(`📥 Received ${snapshot.docs.length} pending join requests`);

            // Enrich each request with user profile data
            const enrichedRequests = await Promise.all(
              snapshot.docs.map(async doc => {
                const requestData = doc.data();
                let enrichedRequest = {
                  id: doc.id,
                  ...requestData,
                  requestedAt: requestData.requestedAt?.toDate(),
                };

                // Fetch user profile data for enrichment
                if (requestData.userId) {
                  try {
                    const userProfile = await authService.getUserProfile(requestData.userId);

                    // 🎯 [KIM FIX] Extract ELO and convert to NTRP for accurate LTR display
                    const eloRatings = userProfile.eloRatings;
                    const stats = userProfile.stats;
                    const singlesElo =
                      eloRatings?.singles?.current || stats?.publicStats?.singles?.elo;
                    const doublesElo =
                      eloRatings?.doubles?.current || stats?.publicStats?.doubles?.elo;
                    const mixedElo =
                      eloRatings?.mixed?.current || stats?.publicStats?.mixed_doubles?.elo;

                    // 🎯 [KIM FIX v19] ELO to LTR conversion (1-10 scale)
                    const eloToLtr = elo => {
                      if (elo < 1000) return 1;
                      if (elo < 1100) return 2;
                      if (elo < 1200) return 3;
                      if (elo < 1300) return 4;
                      if (elo < 1450) return 5;
                      if (elo < 1600) return 6;
                      if (elo < 1800) return 7;
                      if (elo < 2100) return 8;
                      if (elo < 2400) return 9;
                      return 10;
                    };

                    const singlesLtr = singlesElo ? eloToLtr(singlesElo) : undefined;
                    const doublesLtr = doublesElo ? eloToLtr(doublesElo) : undefined;
                    const mixedLtr = mixedElo ? eloToLtr(mixedElo) : undefined;

                    // Merge profile data into request
                    enrichedRequest = {
                      ...enrichedRequest,
                      displayName:
                        userProfile.profile?.displayName ||
                        userProfile.displayName ||
                        enrichedRequest.displayName ||
                        'Unknown User',
                      profile: {
                        nickname:
                          userProfile.profile?.displayName ||
                          userProfile.displayName ||
                          'Unknown User',
                        photoURL: userProfile.profile?.photoURL || userProfile.photoURL,
                        skillLevel: userProfile.profile?.skillLevel,
                        bio: userProfile.profile?.bio,
                        location: userProfile.profile?.location,
                        preferredLanguage: userProfile.profile?.preferredLanguage,
                        gender: userProfile.profile?.gender,
                        joinedAt: userProfile.profile?.joinedAt,
                      },
                      // 🎯 [KIM FIX v19] Include calculated LTR values (1-10 scale)
                      singlesLtr,
                      doublesLtr,
                      mixedLtr,
                      // Keep original fields for compatibility
                      userId: requestData.userId,
                      clubId: requestData.clubId,
                      status: requestData.status,
                      message: requestData.message,
                    };

                    console.log(`✅ Enriched request for user ${requestData.userId}:`, {
                      displayName: enrichedRequest.displayName,
                      hasProfile: !!enrichedRequest.profile,
                      skillLevel: enrichedRequest.profile?.skillLevel,
                      singlesLtr,
                      doublesLtr,
                      mixedLtr,
                    });
                  } catch (profileError) {
                    console.warn(
                      `⚠️ Could not fetch profile for user ${requestData.userId}:`,
                      profileError
                    );
                    // Keep basic request data if profile fetch fails
                  }
                }

                return enrichedRequest;
              })
            );

            console.log(`🎯 Enriched ${enrichedRequests.length} join requests with profile data`);
            callback(enrichedRequests);
          } catch (enrichmentError) {
            console.error('❌ Error enriching join requests:', enrichmentError);
            // Fallback to basic request data
            const basicRequests = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              requestedAt: doc.data().requestedAt?.toDate(),
            }));
            callback(basicRequests);
          }
        },
        error => {
          console.error('Error subscribing to join requests:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up join requests subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Subscribe to all club members in real-time
   * @param {string} clubId - Club ID
   * @param {Function} callback - Callback function that receives members array
   * @returns {Function} Unsubscribe function
   */
  subscribeToClubMembers(clubId, callback) {
    try {
      console.log(`👥 Subscribing to members for club: ${clubId}`);

      const q = query(
        collection(db, 'clubMembers'),
        where('clubId', '==', clubId),
        where('status', '==', 'active'),
        orderBy('joinedAt', 'desc')
      );

      return onSnapshot(
        q,
        async snapshot => {
          const memberPromises = snapshot.docs.map(async docSnapshot => {
            const memberData = docSnapshot.data();

            // Fetch user profile data
            const userDoc = await getDoc(doc(db, 'users', memberData.userId));
            const userData = userDoc.exists() ? userDoc.data() : {};

            // 🎯 [KIM FIX v2] displayName is at root level, not profile level
            const memberDisplayName =
              userData.displayName || userData.profile?.displayName || userData.name || 'Unknown';

            return {
              id: docSnapshot.id,
              ...memberData,
              userName: memberDisplayName,
              displayName: memberDisplayName, // UI compatibility
              userEmail: userData.email || '',
              // 🎯 [KIM FIX] Use correct photoURL field (consistent with other services)
              userAvatar:
                userData.profileImage || userData.profile?.photoURL || userData.photoURL || '',
              joinedAt: memberData.joinedAt?.toDate(),
            };
          });

          const members = await Promise.all(memberPromises);
          console.log(`📥 Received ${members.length} active members`);
          callback(members);
        },
        error => {
          console.error('Error subscribing to club members:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error setting up members subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Update a member's role in the club using membershipId directly
   * @param {string} membershipId - clubMembers 컬렉션의 문서 ID (e.g., `${clubId}_${userId}`)
   * @param {string} newRole - 새로운 역할 ('member', 'manager', 'admin')
   * @returns {Promise<void>}
   */
  async updateMemberRole(membershipId, newRole) {
    try {
      console.log(`🔄 Updating role for membership ${membershipId} to ${newRole}`);

      // Validate role
      const validRoles = ['member', 'manager', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role. Must be: member, manager, or admin');
      }

      // Direct reference to membership document
      const memberRef = doc(db, 'clubMembers', membershipId);

      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists() || memberSnap.data().status !== 'active') {
        throw new Error('회원을 찾을 수 없습니다 (Membership document not found)');
      }

      const memberData = memberSnap.data();
      const oldRole = memberData.role;
      const userId = memberData.userId;
      const clubId = memberData.clubId;

      // Update role
      await updateDoc(memberRef, {
        role: newRole,
        roleUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Successfully updated role to ${newRole} for membership ${membershipId}`);

      // 🔔 운영진 승진 알림 (member → manager) - 전체 클럽 회원에게 알림
      if (oldRole === 'member' && newRole === 'manager') {
        try {
          // Get club name for notification
          const clubDoc = await getDoc(doc(db, 'tennis_clubs', clubId));
          const clubData = clubDoc.data();
          const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';

          // Get promoted user's name from users collection
          const promotedUserDoc = await getDoc(doc(db, 'users', userId));
          const promotedUserData = promotedUserDoc.data();
          const promotedUserName =
            promotedUserData?.displayName ||
            promotedUserData?.profile?.displayName ||
            promotedUserData?.nickname ||
            memberData.userName ||
            memberData.displayName ||
            'Unknown';

          // Get all club members
          const membersQuery = query(
            collection(db, 'clubMembers'),
            where('clubId', '==', clubId),
            where('status', '==', 'active')
          );
          const membersSnapshot = await getDocs(membersQuery);

          // Send notification to all members
          const notificationPromises = membersSnapshot.docs.map(async memberDoc => {
            const member = memberDoc.data();
            const isPromotedUser = member.userId === userId;

            await addDoc(collection(db, 'notifications'), {
              recipientId: member.userId,
              type: 'CLUB_ROLE_PROMOTED',
              clubId: clubId,
              // 🌐 [i18n] Use translation key for multi-language support
              message: isPromotedUser
                ? 'notification.rolePromotedSelf'
                : 'notification.rolePromotedOther',
              status: 'unread',
              createdAt: serverTimestamp(),
              metadata: {
                notificationType: 'club_role_promoted',
                clubName: clubName,
                promotedUserName: promotedUserName,
                promotedUserId: userId,
                oldRole: oldRole,
                newRole: newRole,
              },
            });
          });

          await Promise.all(notificationPromises);

          console.log(
            `📮 [RoleUpdate] Promotion notification sent to ${membersSnapshot.docs.length} club members`
          );
        } catch (notificationError) {
          // Don't fail the role update if notification fails
          console.error('⚠️ Failed to send promotion notification:', notificationError);
        }
      }

      // 🔔 운영진 해제 알림 (manager → member)
      if (oldRole === 'manager' && newRole === 'member') {
        try {
          // Get club name for notification
          const clubDoc = await getDoc(doc(db, 'tennis_clubs', clubId));
          const clubData = clubDoc.data();
          const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';

          // Create notification for demoted user
          await addDoc(collection(db, 'notifications'), {
            recipientId: userId,
            type: 'CLUB_ROLE_DEMOTED',
            clubId: clubId,
            // 🌐 [i18n] Use translation key for multi-language support
            message: 'notification.roleDemoted',
            status: 'unread',
            createdAt: serverTimestamp(),
            metadata: {
              notificationType: 'club_role_demoted',
              clubName: clubName,
              oldRole: oldRole,
              newRole: newRole,
            },
          });

          console.log(`📮 [RoleUpdate] Demotion notification sent to user ${userId}`);
        } catch (notificationError) {
          // Don't fail the role update if notification fails
          console.error('⚠️ Failed to send demotion notification:', notificationError);
        }
      }

      // Clear cache
      this.membershipCache.delete(userId);

      return { success: true };
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove a member from the club (admin action)
   * 🏰 [OPERATION CITADEL] Uses Cloud Function for secure server-side removal
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID to remove
   * @param {string} reason - Reason for removal
   * @returns {Promise<Object>}
   */
  async removeMember(clubId, userId, reason = '관리자에 의한 제명') {
    try {
      console.log(`🚫 [CITADEL] Calling removeClubMember Cloud Function`, {
        clubId,
        userId,
        reason,
      });

      const removeClubMemberFunction = httpsCallable(functions, 'removeClubMember');

      const result = await removeClubMemberFunction({
        clubId,
        userId,
        reason,
      });

      console.log('✅ [CITADEL] Successfully removed member via Cloud Function:', result.data);

      // Clear cache
      this.membershipCache.delete(userId);

      return result.data;
    } catch (error) {
      console.error('❌ [CITADEL] Error removing member via Cloud Function:', error);
      throw error;
    }
  }

  /**
   * Get club role statistics
   * @param {string} clubId - Club ID
   * @returns {Promise<Object>} Role distribution statistics
   */
  async getClubRoleStats(clubId) {
    try {
      console.log(`📊 Getting role statistics for club: ${clubId}`);

      const q = query(
        collection(db, 'clubMembers'),
        where('clubId', '==', clubId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);

      const roleStats = {
        total: 0,
        admin: 0,
        manager: 0,
        member: 0,
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        roleStats.total++;
        roleStats[data.role || 'member']++;
      });

      console.log('📊 Role stats:', roleStats);
      return roleStats;
    } catch (error) {
      console.error('Error getting role stats:', error);
      throw error;
    }
  }

  /**
   * Approve a join request
   * @param {string} clubId
   * @param {string} requestId
   * @returns {Promise<void>}
   */
  // 🏰 OPERATION CITADEL: This function signature (clubId, requestId) is now deprecated
  // All calls should use the single-parameter version approveJoinRequest(requestId)
  async approveJoinRequest_deprecated(clubId, requestId) {
    console.warn(
      '⚠️ [Operation Citadel] Using deprecated approveJoinRequest(clubId, requestId) signature'
    );
    console.warn('⚠️ Please update to use approveJoinRequest(requestId) instead');

    // Forward to the new secure implementation
    return this.approveJoinRequest(requestId);
  }

  // 🏰 OPERATION CITADEL: This legacy function signature has been replaced
  // All calls should use the secure Cloud Function version: rejectJoinRequest(requestId, reason)
  // The old (clubId, requestId, reason) signature used wrong subcollection paths

  /**
   * Get club payment methods
   * @param {string} clubId - Club ID
   * @returns {Promise<Object>} Payment methods configuration
   */
  async getClubPaymentMethods(clubId) {
    try {
      console.log('💳 Getting payment methods for club:', clubId);

      const clubRef = doc(db, 'tennis_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (!clubSnap.exists()) {
        throw new Error('Club not found');
      }

      const clubData = clubSnap.data();
      return clubData.paymentMethods || {};
    } catch (error) {
      console.error('Error getting club payment methods:', error);
      throw error;
    }
  }

  /**
   * Update club payment methods
   * @param {string} clubId - Club ID
   * @param {Object} paymentMethods - Payment methods configuration
   * @returns {Promise<void>}
   */
  async updateClubPaymentMethods(clubId, paymentMethods) {
    try {
      console.log('💳 Updating payment methods for club:', clubId);

      const clubRef = doc(db, 'tennis_clubs', clubId);
      await updateDoc(clubRef, {
        paymentMethods,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Payment methods updated successfully');
    } catch (error) {
      console.error('Error updating payment methods:', error);
      throw error;
    }
  }

  // ============ CLUB VISIBILITY MANAGEMENT ============

  /**
   * Update club visibility setting
   * @param {string} clubId - Club ID
   * @param {string} visibility - 'public', 'membersOnly', or 'private'
   * @returns {Promise<void>}
   */
  async updateClubVisibility(clubId, visibility) {
    try {
      console.log('🔒 Updating club visibility for club:', clubId, 'to', visibility);

      // Validate visibility value
      if (!['public', 'membersOnly', 'private'].includes(visibility)) {
        throw new Error(
          'Invalid visibility setting. Must be "public", "membersOnly", or "private"'
        );
      }

      // Check if current user has admin permissions
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      // 🎯 [KIM FIX] manager도 visibility 설정 변경 가능하도록 수정
      const isAdmin = await this.checkClubPermission(clubId, 'admin');
      const isManager = await this.checkClubPermission(clubId, 'manager');
      if (!isAdmin && !isManager) {
        throw new Error('Only club administrators or managers can modify visibility settings');
      }

      const clubRef = doc(db, 'tennis_clubs', clubId);
      await updateDoc(clubRef, {
        'settings.visibility': visibility,
        'settings.isPublic': visibility !== 'private', // Sync isPublic for Discovery queries
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Club visibility updated successfully');
    } catch (error) {
      console.error('Error updating club visibility:', error);
      throw error;
    }
  }

  /**
   * Get club visibility setting
   * @param {string} clubId - Club ID
   * @returns {Promise<string>} Club visibility setting ('public', 'membersOnly', or 'private')
   */
  async getClubVisibility(clubId) {
    try {
      const clubRef = doc(db, 'tennis_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (!clubSnap.exists()) {
        throw new Error('Club not found');
      }

      const clubData = clubSnap.data();
      return clubData.settings?.visibility || 'public'; // Default to public
    } catch (error) {
      console.error('Error getting club visibility:', error);
      throw error;
    }
  }

  /**
   * Check if user can view club rankings
   * Note: Club rankings are ALWAYS private (members only), regardless of visibility setting
   * @param {string} clubId - Club ID
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user can view rankings
   */
  async canViewClubRankings(clubId, userId) {
    try {
      // Rankings are always members-only, regardless of club visibility setting
      const membership = await this.getUserClubMembership(userId, clubId);
      return membership && membership.status === 'active';
    } catch (error) {
      console.error('Error checking ranking view permissions:', error);
      return false; // Default to restricted access on error
    }
  }

  /**
   * Get multiple clubs' visibility settings
   * @param {string[]} clubIds - Array of club IDs
   * @returns {Promise<Object>} Object mapping clubId to visibility setting
   */
  async getMultipleClubVisibility(clubIds) {
    try {
      const results = {};

      // Process clubs in batches to avoid overwhelming Firestore
      const batchSize = 10;
      for (let i = 0; i < clubIds.length; i += batchSize) {
        const batch = clubIds.slice(i, i + batchSize);
        const promises = batch.map(async clubId => {
          try {
            const visibility = await this.getClubVisibility(clubId);
            return { clubId, visibility };
          } catch (error) {
            console.warn(`Failed to get visibility for club ${clubId}:`, error);
            return { clubId, visibility: 'public' }; // Default fallback
          }
        });

        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ clubId, visibility }) => {
          results[clubId] = visibility;
        });
      }

      return results;
    } catch (error) {
      console.error('Error getting multiple club visibility:', error);
      throw error;
    }
  }

  /**
   * Get the number of active admin users in a club
   * @param {string} clubId - Club ID
   * @returns {Promise<number>} Number of active admin users
   */
  async getClubAdminCount(clubId) {
    try {
      console.log(`🔍 Getting admin count for club: ${clubId}`);

      const q = query(
        collection(db, 'clubMembers'),
        where('clubId', '==', clubId),
        where('role', '==', 'admin'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const adminCount = snapshot.size;

      console.log(`✅ Found ${adminCount} active admin(s) in club ${clubId}`);
      return adminCount;
    } catch (error) {
      console.error('❌ Error getting admin count:', error);
      return 0; // Return 0 as fallback to be safe
    }
  }

  // ============ CLUB ANNOUNCEMENT MANAGEMENT ============

  /**
   * Subscribe to club announcement in real-time
   * @param {string} clubId - Club ID
   * @param {function} onUpdate - Callback function for updates
   * @returns {function} Unsubscribe function
   */
  getClubAnnouncementStream(clubId, onUpdate) {
    console.log('📢 Setting up club announcement stream for club:', clubId);

    const clubRef = doc(db, 'tennis_clubs', clubId);

    return onSnapshot(
      clubRef,
      doc => {
        if (doc.exists()) {
          const clubData = doc.data();
          const announcement = clubData.announcement || null;
          console.log('📢 Club announcement updated:', announcement ? 'exists' : 'none');
          onUpdate(announcement);
        } else {
          console.log('❌ Club document not found');
          onUpdate(null);
        }
      },
      error => {
        console.error('❌ Error in club announcement stream:', error);
        onUpdate(null);
      }
    );
  }

  /**
   * Set (create or update) club announcement
   * @param {string} clubId - Club ID
   * @param {Object} announcementData - Announcement data
   * @returns {Promise}
   */
  async setClubAnnouncement(clubId, announcementData) {
    try {
      console.log('📢 Setting club announcement for club:', clubId);

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const clubRef = doc(db, 'tennis_clubs', clubId);

      const announcement = {
        ...announcementData,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || 'Unknown',
        updatedAt: serverTimestamp(),
        createdAt: announcementData.createdAt || serverTimestamp(),
      };

      await updateDoc(clubRef, {
        announcement: announcement,
      });

      console.log('✅ Club announcement saved successfully');
    } catch (error) {
      console.error('❌ Error setting club announcement:', error);
      throw error;
    }
  }

  /**
   * Delete club announcement
   * @param {string} clubId - Club ID
   * @returns {Promise}
   */
  async deleteClubAnnouncement(clubId) {
    try {
      console.log('📢 Deleting club announcement for club:', clubId);

      const clubRef = doc(db, 'tennis_clubs', clubId);

      // Use FieldValue.delete() to remove the field entirely
      await updateDoc(clubRef, {
        announcement: null, // This will effectively remove the announcement
      });

      console.log('✅ Club announcement deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting club announcement:', error);
      throw error;
    }
  }

  /**
   * ⚡ THOR: Get club league rankings
   * Get user's league rankings across all clubs they're a member of
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of club league rankings
   */
  // 🆕 [KIM] Added gender parameter for gender-filtered rankings
  async getClubLeagueRankings(userId, gender = null) {
    try {
      // 1. Get all club memberships for this user
      // 🔧 FIX: Read from clubMembers root collection (matches Cloud Functions write path)
      const clubMembersRef = collection(db, 'clubMembers');
      const clubMembersQuery = query(clubMembersRef, where('userId', '==', userId));
      const membershipsSnapshot = await getDocs(clubMembersQuery);

      const rankings = [];

      // 2. For each club, calculate ranking
      for (const membershipDoc of membershipsSnapshot.docs) {
        const membershipData = membershipDoc.data();
        const clubId = membershipData.clubId || membershipDoc.id.split('_')[0]; // 🔧 FIX: Extract clubId from compound document ID

        // Get all members of this club and sort by club ELO
        // 🔧 FIX: Query clubMembers flat collection (matches Phase 5 migration)
        const clubMembersRef = collection(db, 'clubMembers');
        const clubMembersQuery = query(clubMembersRef, where('clubId', '==', clubId));
        const clubMembersSnapshot = await getDocs(clubMembersQuery);

        // Sort by club ELO rating (with optional gender filter)
        // 🆕 [KIM] Added gender filter to show only same-gender members
        // 🎯 [KIM FIX v2] Always include current user to ensure proper rank calculation
        const sortedMembers = clubMembersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              userId: data.userId, // From flat collection data
              clubElo: data.clubStats?.clubEloRating || 1200,
              gender: data.gender || data.profile?.gender, // Include gender for filtering
            };
          })
          .filter(member => {
            if (!gender) return true; // No filter if gender not specified
            if (member.userId === userId) return true; // 🎯 Always include current user
            return member.gender === gender;
          })
          .sort((a, b) => b.clubElo - a.clubElo);

        // Find user's rank
        const userIndex = sortedMembers.findIndex(m => m.userId === userId);
        const currentRank = userIndex >= 0 ? userIndex + 1 : 0;

        // Get club name from club document if not in membership
        let clubName = membershipData.clubName;
        if (!clubName) {
          try {
            const clubDoc = await getDoc(doc(db, 'tennis_clubs', clubId));
            if (clubDoc.exists()) {
              const clubData = clubDoc.data();
              clubName = clubData.profile?.name || clubData.name || 'Unknown Club';
            } else {
              clubName = 'Unknown Club';
            }
          } catch (error) {
            console.error('Error fetching club name:', error);
            clubName = 'Unknown Club';
          }
        }

        // 🎯 [KIM FIX] Include league match stats (wins, losses, matchesPlayed)
        // submitLeagueMatchResult Cloud Function writes these to clubStats
        const clubStats = membershipData.clubStats || {};
        const matchesPlayed = clubStats.matchesPlayed || 0;
        const wins = clubStats.wins || 0;
        const losses = clubStats.losses || 0;
        const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;

        rankings.push({
          clubId,
          clubName,
          currentRank,
          totalPlayers: sortedMembers.length,
          clubEloRating: clubStats.clubEloRating || 1200,
          isPrivate: false,
          // 🎯 [KIM FIX] Add match stats for StatsTabContent display
          matches: matchesPlayed,
          wins,
          losses,
          winRate,
        });
      }

      return rankings;
    } catch (error) {
      console.error('Error getting club league rankings:', error);
      throw error;
    }
  }

  /**
   * ⚡ THOR: Get club tournament rankings
   * Get user's tournament rankings across all clubs they're a member of
   * Ranking is based ONLY on tournament wins
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of club tournament rankings
   */
  // 🆕 [KIM] Added gender parameter for gender-filtered rankings
  async getClubTournamentRankings(userId, gender = null) {
    try {
      console.log('🏆 [getClubTournamentRankings] Starting for userId:', userId);

      // 1. Get all club memberships for this user
      // 🔧 FIX: Read from clubMembers root collection (matches Cloud Functions write path)
      const clubMembersRef = collection(db, 'clubMembers');
      const clubMembersQuery = query(clubMembersRef, where('userId', '==', userId));
      const membershipsSnapshot = await getDocs(clubMembersQuery);

      console.log(
        '🏆 [getClubTournamentRankings] Found memberships:',
        membershipsSnapshot.docs.length
      );

      const rankings = [];

      // 2. For each club, calculate tournament ranking
      for (const membershipDoc of membershipsSnapshot.docs) {
        const membershipData = membershipDoc.data();
        const clubId = membershipData.clubId || membershipDoc.id.split('_')[0]; // 🔧 FIX: Extract clubId from compound document ID

        // 🔍 Extract tournament stats - handle both old and new structure
        const clubStats = membershipData.clubStats || {};
        const tournamentStats = clubStats.tournamentStats || {};

        // Map fields for backward compatibility
        const userTournamentStats = {
          // Legacy fields (ambiguous names)
          wins: tournamentStats.wins || 0, // ⚠️ Legacy: currently contains match wins, not championships
          runnerUps: tournamentStats.runnerUps || 0,
          semiFinals: tournamentStats.semiFinals || 0,
          bestFinish: tournamentStats.bestFinish,
          participations: tournamentStats.participations || 0, // ⚠️ Legacy: currently contains total matches, not tournaments

          // Match statistics
          tournamentWins: tournamentStats.tournamentWins || clubStats.tournamentWins || 0,
          tournamentLosses: tournamentStats.tournamentLosses || clubStats.tournamentLosses || 0,
          totalMatches: tournamentStats.totalMatches || clubStats.totalMatches || 0,
        };

        // Get club name from club document
        let clubName = membershipData.clubName;
        if (!clubName) {
          try {
            const clubDoc = await getDoc(doc(db, 'tennis_clubs', clubId));
            if (clubDoc.exists()) {
              const clubData = clubDoc.data();
              // Try multiple possible locations for club name
              clubName = clubData.profile?.name || clubData.name || 'Unknown Club';
              console.log('🏆 [Club Name Fetch] clubId:', clubId, '| name:', clubName);
            } else {
              clubName = 'Unknown Club';
            }
          } catch (error) {
            console.error('Error fetching club name:', error);
            clubName = 'Unknown Club';
          }
        }

        console.log('🏆 [getClubTournamentRankings] Processing club:', {
          clubId,
          clubName,
          userTournamentStats,
          rawClubStats: clubStats,
        });

        // Get club document to find all members
        const clubDoc = await getDoc(doc(db, 'tennis_clubs', clubId));
        let memberIds = [];

        if (clubDoc.exists()) {
          const clubData = clubDoc.data();
          // Try multiple possible member fields
          memberIds = clubData.members || clubData.memberIds || clubData.memberList || [];

          console.log('🏆 [getClubTournamentRankings] Club data:', {
            hasMembers: !!clubData.members,
            hasMemberIds: !!clubData.memberIds,
            hasMemberList: !!clubData.memberList,
            memberCount: memberIds.length,
            clubDataKeys: Object.keys(clubData),
          });
        }

        console.log('🏆 [getClubTournamentRankings] Club member IDs:', memberIds);

        // 🔧 ROOT CAUSE FIX: If no member list found in club document, query clubMemberships collection
        if (memberIds.length === 0) {
          console.log(
            '🏆 [getClubTournamentRankings] No members found in club document, querying all users with clubMemberships...'
          );

          try {
            // 🔧 FIX: Query clubMembers flat collection (matches Phase 5 migration)
            const clubMembersRef = collection(db, 'clubMembers');
            const allMembershipsQuery = query(clubMembersRef, where('clubId', '==', clubId));
            const membershipsSnapshot = await getDocs(allMembershipsQuery);

            // Extract user IDs from flat collection data
            memberIds = membershipsSnapshot.docs.map(docSnap => docSnap.data().userId);

            console.log(
              `🏆 [getClubTournamentRankings] Found ${memberIds.length} members via clubMembers query:`,
              memberIds
            );
          } catch (error) {
            console.error('❌ [getClubTournamentRankings] Error querying clubMemberships:', error);
            // Fallback: at least include current user
            memberIds = [userId];
          }

          // If still no members found, at least include current user
          if (memberIds.length === 0) {
            memberIds = [userId];
            console.log(
              '🏆 [getClubTournamentRankings] Still no members found, using current user only'
            );
          }
        }

        // Get tournament stats for all members
        const memberStatsPromises = memberIds.map(async memberId => {
          try {
            // 🔧 FIX: Read from clubMembers root collection
            const membershipId = `${clubId}_${memberId}`;
            const membershipRef = doc(db, 'clubMembers', membershipId);
            const membershipSnap = await getDoc(membershipRef);

            if (membershipSnap.exists()) {
              const data = membershipSnap.data();
              const stats = data.clubStats || {};
              const tStats = stats.tournamentStats || {};

              return {
                userId: memberId,
                wins: tStats.tournamentWins || 0, // ✅ Fix: Use correct field name
                totalMatches: tStats.totalMatches || 0, // For filtering participants
                // 🆕 [KIM] Include gender for filtering
                gender: data.gender || data.profile?.gender,
              };
            }
            return { userId: memberId, wins: 0, gender: null };
          } catch (error) {
            console.error('Error fetching member stats:', error);
            return { userId: memberId, wins: 0, gender: null };
          }
        });

        const memberStats = await Promise.all(memberStatsPromises);

        console.log('🏆 [getClubTournamentRankings] All member stats:', memberStats);

        // Sort ONLY by tournament wins (우승 횟수)
        // 🆕 [KIM] Added gender filter to show only same-gender members
        const sortedMembers = memberStats
          .filter(m => m.totalMatches > 0 || m.userId === userId) // ✅ Include tournament participants or current user
          .filter(m => {
            if (!gender) return true; // No filter if gender not specified
            return m.gender === gender;
          })
          .sort((a, b) => b.wins - a.wins);

        console.log('🏆 [getClubTournamentRankings] Sorted members:', sortedMembers);

        // Find user's rank
        const userIndex = sortedMembers.findIndex(m => m.userId === userId);
        const currentRank = userIndex >= 0 ? userIndex + 1 : sortedMembers.length + 1;

        console.log('🏆 [getClubTournamentRankings] User rank:', { userIndex, currentRank });

        // Use wins from either new or legacy structure
        const finalWins = userTournamentStats.wins || userTournamentStats.tournamentWins || 0;

        rankings.push({
          clubId,
          clubName,
          currentRank,
          totalPlayers: sortedMembers.length,
          tournamentStats: {
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 🎾 Match Statistics (within tournaments)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            matchWins: userTournamentStats.tournamentWins, // Clear name for match wins
            matchLosses: userTournamentStats.tournamentLosses, // Clear name for match losses
            totalMatches: userTournamentStats.totalMatches, // Total tournament matches played

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 🏆 Tournament Placement Statistics
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            championships: finalWins, // ⚠️ Legacy: currently match wins until migration
            runnerUps: userTournamentStats.runnerUps, // 2nd place finishes
            semiFinals: userTournamentStats.semiFinals, // 3rd-4th place finishes
            bestFinish: this.formatBestFinish(userTournamentStats.bestFinish), // Best placement
            tournamentsPlayed:
              userTournamentStats.participations || userTournamentStats.totalMatches || 0, // ⚠️ Legacy: currently total matches until migration

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 📦 Legacy Compatibility (for backward compatibility)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            wins: finalWins, // Legacy: ambiguous name (actually match wins)
            participations:
              userTournamentStats.participations || userTournamentStats.totalMatches || 0, // Legacy: ambiguous name (actually total matches)
            tournamentWins: userTournamentStats.tournamentWins, // Legacy: kept for compatibility
            tournamentLosses: userTournamentStats.tournamentLosses, // Legacy: kept for compatibility
          },
          isPrivate: false,
        });
      }

      console.log('🏆 [getClubTournamentRankings] Final rankings:', rankings);
      return rankings;
    } catch (error) {
      console.error('❌ Error getting club tournament rankings:', error);
      throw error;
    }
  }

  /**
   * Format best finish value for display
   * @param {number} bestFinish - Best finish position (1=Winner, 2=Runner-up, etc.)
   * @returns {string} Formatted best finish
   */
  formatBestFinish(bestFinish) {
    if (!bestFinish) return '';

    const finishMap = {
      1: 'Winner',
      2: 'Runner-up',
      3: 'Semi-finalist',
      4: 'Quarter-finalist',
    };

    return finishMap[bestFinish] || `Round of ${bestFinish}`;
  }

  /**
   * Get club announcement (one-time fetch)
   * @param {string} clubId - Club ID
   * @returns {Promise<Object|null>} Announcement data or null
   */
  async getClubAnnouncement(clubId) {
    try {
      console.log('📢 Fetching club announcement for club:', clubId);

      const clubRef = doc(db, 'tennis_clubs', clubId);
      const clubDoc = await getDoc(clubRef);

      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        const announcement = clubData.announcement || null;
        console.log('📢 Club announcement fetched:', announcement ? 'exists' : 'none');
        return announcement;
      } else {
        console.log('❌ Club document not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching club announcement:', error);
      throw error;
    }
  }

  // ========================================
  // Direct Chat Functions
  // ========================================

  /**
   * Generate conversation ID from two user IDs (sorted)
   */
  getConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Save a direct chat message
   */
  async saveDirectChatMessage(conversationId, messageData) {
    try {
      console.log('[clubService] Saving direct chat message:', conversationId);

      const chatRef = collection(db, 'directChat');
      const messageDoc = await addDoc(chatRef, {
        ...messageData,
        conversationId,
        isDeleted: false,
        readBy: [messageData.senderId], // Sender already read
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });

      // Update conversation metadata
      await this.updateConversationMetadata(
        conversationId,
        messageData.senderId,
        messageData.senderName,
        messageData.senderPhotoURL,
        messageData.receiverId,
        messageData.receiverName,
        messageData.receiverPhotoURL,
        messageData.message,
        serverTimestamp()
      );

      console.log('[clubService] Direct chat message saved:', messageDoc.id);
    } catch (error) {
      console.error('[clubService] Error saving direct chat message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to direct chat messages
   * @param {string} conversationId - Conversation ID
   * @param {Function} callback - Message callback
   * @param {string} currentUserId - Current user ID
   * @param {Function} onNewMessage - Callback for new messages (for notifications)
   * @returns {Function} Unsubscribe function
   */
  subscribeToDirectChat(conversationId, callback, currentUserId, onNewMessage) {
    try {
      console.log('🔔 [subscribeToDirectChat] Setting up subscription');
      console.log('   - conversationId:', conversationId);
      console.log('   - currentUserId:', currentUserId);
      console.log('   - onNewMessage callback:', typeof onNewMessage);

      const chatRef = collection(db, 'directChat');
      const q = query(
        chatRef,
        where('conversationId', '==', conversationId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      let isFirstLoad = true;

      return onSnapshot(
        q,
        snapshot => {
          console.log('🔔 [subscribeToDirectChat] Snapshot received');
          console.log('   - isFirstLoad:', isFirstLoad);
          console.log('   - doc count:', snapshot.docs.length);
          console.log('   - changes count:', snapshot.docChanges().length);

          const messages = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
            }))
            .reverse(); // Oldest first

          console.log(`[clubService] Direct chat messages loaded: ${messages.length}`);
          callback(messages);

          // Trigger notification for new messages (skip first load)
          if (!isFirstLoad && onNewMessage) {
            console.log('🔔 [subscribeToDirectChat] Checking for new messages to notify');

            snapshot.docChanges().forEach(change => {
              console.log('   - Change type:', change.type);

              if (change.type === 'added') {
                const message = { id: change.doc.id, ...change.doc.data() };

                console.log('   - New message detected!');
                console.log('     senderId:', message.senderId);
                console.log('     currentUserId:', currentUserId);
                console.log('     senderName:', message.senderName);
                console.log('     message:', message.message);

                // Only notify if message is from someone else
                if (message.senderId !== currentUserId) {
                  console.log('✅ [subscribeToDirectChat] Calling onNewMessage callback!');

                  onNewMessage({
                    id: message.id,
                    type: 'direct',
                    chatId: conversationId,
                    senderId: message.senderId,
                    senderName: message.senderName,
                    message: message.message,
                    timestamp: message.createdAt?.toDate ? message.createdAt.toDate() : new Date(),
                  });
                } else {
                  console.log(
                    '❌ [subscribeToDirectChat] Message from self - skipping notification'
                  );
                }
              }
            });
          } else {
            if (isFirstLoad) {
              console.log('❌ [subscribeToDirectChat] First load - skipping notifications');
            }
            if (!onNewMessage) {
              console.log('❌ [subscribeToDirectChat] No onNewMessage callback provided!');
            }
          }

          isFirstLoad = false;
        },
        error => {
          // 🔇 Silently ignore permission errors during logout - this is expected behavior
          if (
            error.code === 'permission-denied' ||
            error.message?.includes('Missing or insufficient permissions')
          ) {
            console.log(
              '[clubService] Direct chat subscription ended (user logged out or permissions changed)'
            );
            return;
          }
          console.error('[clubService] Error in direct chat subscription:', error);
        }
      );
    } catch (error) {
      // 🔇 Silently ignore permission errors during logout
      if (
        error.code === 'permission-denied' ||
        error.message?.includes('Missing or insufficient permissions')
      ) {
        console.log('[clubService] Direct chat subscription setup skipped (no permissions)');
        return () => {}; // Return empty unsubscribe function
      }
      console.error('[clubService] Error subscribing to direct chat:', error);
      throw error;
    }
  }

  /**
   * Mark direct messages as read
   */
  async markDirectMessagesAsRead(messageIds, userId, conversationId) {
    try {
      if (!messageIds || messageIds.length === 0) {
        console.log('[clubService] No direct messages to mark as read');
        return;
      }

      console.log(
        `[clubService] Marking ${messageIds.length} direct messages as read for user ${userId}`
      );

      const batch = writeBatch(db);

      // Mark messages as read
      messageIds.forEach(messageId => {
        const messageRef = doc(db, 'directChat', messageId);
        batch.update(messageRef, {
          readBy: arrayUnion(userId),
        });
      });

      // Decrement unreadCount in conversation metadata (with safety check to prevent negative)
      if (conversationId && messageIds.length > 0) {
        const conversationRef = doc(db, 'conversations', conversationId);

        // First, get current unreadCount to ensure we don't go negative
        const conversationSnap = await getDoc(conversationRef);

        if (conversationSnap.exists()) {
          const currentUnreadCount = conversationSnap.data().unreadCount?.[userId] || 0;
          const newUnreadCount = Math.max(0, currentUnreadCount - messageIds.length); // ✅ SAFE! Never negative

          batch.update(conversationRef, {
            [`unreadCount.${userId}`]: newUnreadCount,
          });
        }
      }

      await batch.commit();
      console.log('[clubService] Direct messages marked as read successfully');
    } catch (error) {
      console.error('[clubService] Error marking direct messages as read:', error);
      throw error;
    }
  }

  /**
   * Reset negative unreadCount values to 0 (cleanup function)
   */
  async resetNegativeUnreadCounts(conversationId, userId) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const unreadCount = conversationSnap.data().unreadCount?.[userId];

        if (unreadCount !== undefined && unreadCount < 0) {
          console.log(
            `[clubService] Resetting negative unreadCount (${unreadCount}) to 0 for user ${userId}`
          );
          await updateDoc(conversationRef, {
            [`unreadCount.${userId}`]: 0,
          });
        }
      }
    } catch (error) {
      console.error('[clubService] Error resetting negative unreadCount:', error);
    }
  }

  /**
   * Subscribe to user's conversations
   */
  subscribeToMyConversations(userId, callback) {
    try {
      console.log('[clubService] Subscribing to conversations for user:', userId);

      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      return onSnapshot(
        q,
        async snapshot => {
          const conversations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Reset any negative unreadCounts (cleanup)
          for (const conv of conversations) {
            if (conv.unreadCount?.[userId] < 0) {
              await this.resetNegativeUnreadCounts(conv.id, userId);
            }
          }

          console.log(`[clubService] Conversations loaded: ${conversations.length}`);
          callback(conversations);
        },
        error => {
          // 🔇 Silently ignore permission-denied errors during logout
          // This is expected behavior when Firebase auth state changes before subscription cleanup
          if (error.code === 'permission-denied') {
            console.log('[clubService] Conversations subscription ended (user signed out)');
            return;
          }
          console.error('[clubService] Error in conversations subscription:', error);
        }
      );
    } catch (error) {
      console.error('[clubService] Error subscribing to conversations:', error);
      throw error;
    }
  }

  /**
   * Update conversation metadata
   */
  async updateConversationMetadata(
    conversationId,
    senderId,
    senderName,
    senderPhotoURL,
    receiverId,
    receiverName,
    receiverPhotoURL,
    lastMessage,
    timestamp
  ) {
    try {
      console.log('[clubService] Updating conversation metadata:', conversationId);

      const conversationRef = doc(db, 'conversations', conversationId);

      // Get current conversation data to properly update unreadCount
      const conversationSnap = await getDoc(conversationRef);
      const existingData = conversationSnap.exists() ? conversationSnap.data() : {};

      // Initialize unreadCount if it doesn't exist, or update existing values safely
      const currentUnreadCount = existingData.unreadCount || {};
      const newUnreadCount = {
        [senderId]: currentUnreadCount[senderId] || 0, // Keep sender's count (or init to 0)
        [receiverId]: (currentUnreadCount[receiverId] || 0) + 1, // Increment receiver's count
      };

      await setDoc(
        conversationRef,
        {
          participants: [senderId, receiverId],
          participantNames: {
            [senderId]: senderName,
            [receiverId]: receiverName,
          },
          ...(senderPhotoURL && {
            participantPhotos: {
              [senderId]: senderPhotoURL,
              ...(receiverPhotoURL && { [receiverId]: receiverPhotoURL }),
            },
          }),
          lastMessage: lastMessage,
          lastMessageTime: timestamp,
          lastMessageSenderId: senderId,
          unreadCount: newUnreadCount, // ✅ SAFE! Always correct values
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[clubService] Conversation metadata updated');
    } catch (error) {
      console.error('[clubService] Error updating conversation metadata:', error);
      throw error;
    }
  }

  /**
   * Search users by display name
   */
  async searchUsers(searchQuery) {
    try {
      console.log('[clubService] Searching users:', searchQuery);

      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      const usersRef = collection(db, 'users');
      const originalQuery = searchQuery.trim();

      // 🎯 [KIM FIX v18] Case-insensitive search: try multiple variations
      // 1. Original query (as typed)
      // 2. Lowercase version
      // 3. First letter capitalized version
      const lowerQuery = originalQuery.toLowerCase();
      const capitalizedQuery =
        originalQuery.charAt(0).toUpperCase() + originalQuery.slice(1).toLowerCase();

      const searchVariations = [originalQuery];
      if (lowerQuery !== originalQuery) searchVariations.push(lowerQuery);
      if (capitalizedQuery !== originalQuery && capitalizedQuery !== lowerQuery) {
        searchVariations.push(capitalizedQuery);
      }

      const allResults = [];
      const seenUids = new Set();

      // Execute search for each variation
      for (const variation of searchVariations) {
        const q = query(
          usersRef,
          where('displayName', '>=', variation),
          where('displayName', '<=', variation + '\uf8ff'),
          limit(20)
        );

        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          if (!seenUids.has(doc.id)) {
            seenUids.add(doc.id);
            allResults.push({
              uid: doc.id,
              ...doc.data(),
            });
          }
        });
      }

      console.log(
        `[clubService] Found ${allResults.length} users (searched variations: ${searchVariations.join(', ')})`
      );
      return allResults;
    } catch (error) {
      console.error('[clubService] Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get suggested club members for empty conversation list
   */
  async getSuggestedMembers(userId, maxResults = 10) {
    try {
      console.log('[clubService] Getting suggested members for user:', userId);

      // Get user's clubs
      const membershipRef = collection(db, 'clubMembers');
      const membershipQuery = query(membershipRef, where('userId', '==', userId));
      const membershipSnapshot = await getDocs(membershipQuery);
      const clubIds = membershipSnapshot.docs.map(doc => doc.data().clubId);

      if (clubIds.length === 0) {
        return [];
      }

      // Get other members from same clubs
      const membersQuery = query(
        membershipRef,
        where('clubId', 'in', clubIds.slice(0, 10)), // Firestore 'in' limit
        where('userId', '!=', userId),
        limit(maxResults)
      );

      const membersSnapshot = await getDocs(membersQuery);
      const memberUserIds = [...new Set(membersSnapshot.docs.map(doc => doc.data().userId))];

      // Get user details
      const usersRef = collection(db, 'users');
      const users = [];

      for (const uid of memberUserIds.slice(0, maxResults)) {
        const userDoc = await getDoc(doc(usersRef, uid));
        if (userDoc.exists()) {
          users.push({
            uid: userDoc.id,
            ...userDoc.data(),
          });
        }
      }

      console.log(`[clubService] Found ${users.length} suggested members`);
      return users;
    } catch (error) {
      console.error('[clubService] Error getting suggested members:', error);
      throw error;
    }
  }

  // ========================================
  // 🏆 Hall of Fame Functions (명예의 전당)
  // ========================================

  /**
   * 🏆 Get all trophies from club members
   * Fetches trophies from all club members and filters by clubId
   * @param {string} clubId - Club ID to fetch trophies for
   * @returns {Promise<Array<{trophy: Object, userId: string, userName: string}>>}
   */
  async getClubTrophies(clubId) {
    try {
      console.log('🏆 [getClubTrophies] Fetching trophies for club:', clubId);

      // 1. Get all club members from flat clubMembers collection
      const clubMembersRef = collection(db, 'clubMembers');
      const membersQuery = query(clubMembersRef, where('clubId', '==', clubId));
      const membersSnapshot = await getDocs(membersQuery);

      if (membersSnapshot.empty) {
        console.log('🏆 [getClubTrophies] No members found for club');
        return [];
      }

      const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);
      console.log(`🏆 [getClubTrophies] Found ${memberIds.length} members`);

      // 🚀 [PERFORMANCE FIX] Fetch all user data and trophies in PARALLEL instead of sequential
      const memberDataPromises = memberIds.map(async userId => {
        try {
          // Fetch user doc and trophies in parallel for each user
          const [userDoc, trophiesSnapshot] = await Promise.all([
            getDoc(doc(db, 'users', userId)),
            getDocs(
              query(collection(db, `users/${userId}/trophies`), where('clubId', '==', clubId))
            ),
          ]);

          const userName = userDoc.exists()
            ? userDoc.data().displayName || userDoc.data().profile?.displayName || 'Unknown'
            : 'Unknown';

          return trophiesSnapshot.docs.map(trophyDoc => ({
            trophy: {
              id: trophyDoc.id,
              ...trophyDoc.data(),
            },
            userId,
            userName,
          }));
        } catch (error) {
          console.error(`🏆 [getClubTrophies] Error fetching trophies for user ${userId}:`, error);
          return []; // Return empty array on error
        }
      });

      // Execute all member fetches in parallel
      const trophyArrays = await Promise.all(memberDataPromises);
      const allTrophies = trophyArrays.flat();

      // 3. Sort by awardedAt (newest first)
      allTrophies.sort((a, b) => {
        const dateA = a.trophy.awardedAt?.toDate?.() || new Date(a.trophy.awardedAt) || new Date(0);
        const dateB = b.trophy.awardedAt?.toDate?.() || new Date(b.trophy.awardedAt) || new Date(0);
        return dateB - dateA;
      });

      console.log(`🏆 [getClubTrophies] Total trophies found: ${allTrophies.length}`);
      return allTrophies;
    } catch (error) {
      console.error('❌ [getClubTrophies] Error:', error);
      throw error;
    }
  }

  /**
   * 📊 Get club members ranked by unified ELO
   * Combines league and tournament ELO for unified ranking
   * @param {string} clubId - Club ID to fetch rankings for
   * @returns {Promise<Array<{userId: string, userName: string, photoURL: string, eloRating: number, rank: number, wins: number, losses: number}>>}
   */
  async getClubEloRankings(clubId) {
    try {
      console.log('📊 [getClubEloRankings] Fetching rankings for club:', clubId);

      // 1. Get all club members with their stats
      const clubMembersRef = collection(db, 'clubMembers');
      const membersQuery = query(clubMembersRef, where('clubId', '==', clubId));
      const membersSnapshot = await getDocs(membersQuery);

      if (membersSnapshot.empty) {
        console.log('📊 [getClubEloRankings] No members found for club');
        return [];
      }

      // 🚀 [PERFORMANCE FIX] Fetch all user profiles in PARALLEL instead of sequential
      const memberDataPromises = membersSnapshot.docs.map(async memberDoc => {
        const memberData = memberDoc.data();
        const userId = memberData.userId;

        try {
          // Get user profile for display info
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          const userName = userData.displayName || userData.profile?.displayName || 'Unknown';
          const photoURL = userData.photoURL || userData.profile?.photoURL || null;

          // Extract ELO rating from clubStats
          const clubStats = memberData.clubStats || {};
          const clubEloRating = clubStats.clubEloRating || 1200;

          // Extract win/loss stats
          const matchesPlayed = clubStats.matchesPlayed || 0;
          const wins = clubStats.wins || 0;
          const losses = clubStats.losses || 0;

          return {
            userId,
            userName,
            photoURL,
            eloRating: clubEloRating,
            matchesPlayed,
            wins,
            losses,
          };
        } catch (error) {
          console.error(`📊 [getClubEloRankings] Error fetching user ${userId}:`, error);
          // Return member with default values on error
          const clubStats = memberData.clubStats || {};
          return {
            userId,
            userName: 'Unknown',
            photoURL: null,
            eloRating: clubStats.clubEloRating || 1200,
            matchesPlayed: clubStats.matchesPlayed || 0,
            wins: clubStats.wins || 0,
            losses: clubStats.losses || 0,
          };
        }
      });

      // Execute all member fetches in parallel
      const memberRankings = await Promise.all(memberDataPromises);

      // 3. Sort by ELO rating (highest first)
      memberRankings.sort((a, b) => b.eloRating - a.eloRating);

      // 4. Add rank
      memberRankings.forEach((member, index) => {
        member.rank = index + 1;
      });

      console.log(
        `📊 [getClubEloRankings] Rankings generated for ${memberRankings.length} members`
      );
      return memberRankings;
    } catch (error) {
      console.error('❌ [getClubEloRankings] Error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const clubService = new ClubService();

export default clubService;
