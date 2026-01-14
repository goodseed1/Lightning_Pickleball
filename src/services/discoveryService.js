/**
 * Discovery Service for Lightning Tennis
 * Handles club discovery, player search, and recommendation systems
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';

/**
 * Discovery Service Class
 * Provides advanced discovery features for clubs and players
 */
class DiscoveryService {
  constructor() {
    console.log('🔍 DiscoveryService initialized');
  }

  // ============ CLUB DISCOVERY ============

  /**
   * Get featured clubs (popular clubs with good activity)
   * @param {number} limitCount - Number of clubs to return
   * @returns {Promise<Array>} Array of featured clubs
   */
  async getFeaturedClubs(limitCount = 10) {
    try {
      const clubsRef = collection(db, 'clubs');
      const q = query(
        clubsRef,
        where('status', '==', 'active'),
        where('settings.isPublic', '==', true),
        orderBy('stats.activeMembers', 'desc'),
        orderBy('stats.monthlyEvents', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const clubs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        featured: true,
      }));

      console.log(`✅ Found ${clubs.length} featured clubs`);
      return clubs;
    } catch (error) {
      console.error('❌ Failed to get featured clubs:', error);
      throw error;
    }
  }

  /**
   * Get clubs by location with detailed filtering
   * @param {Object} locationFilters - Location-based filters
   * @returns {Promise<Array>} Array of nearby clubs
   */
  async getClubsByLocation(locationFilters = {}) {
    try {
      const {
        region,
        maxDistance = 50, // km
        userLocation, // { lat, lng }
        zipCode,
      } = locationFilters;

      const clubsRef = collection(db, 'clubs');
      let q = query(
        clubsRef,
        where('status', '==', 'active'),
        where('settings.isPublic', '==', true),
        orderBy('stats.totalMembers', 'desc'),
        limit(50)
      );

      // Apply region filter
      if (region) {
        q = query(
          clubsRef,
          where('location.region', '==', region),
          where('status', '==', 'active'),
          where('settings.isPublic', '==', true),
          orderBy('stats.totalMembers', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      let clubs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Apply distance filtering if user location is provided
      if (userLocation && userLocation.lat && userLocation.lng) {
        clubs = clubs.filter(club => {
          if (!club.location?.coordinates) return true; // Include clubs without coordinates

          const distance = this.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            club.location.coordinates.lat,
            club.location.coordinates.lng
          );

          club.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
          return distance <= maxDistance;
        });

        // Sort by distance
        clubs.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }

      console.log(`✅ Found ${clubs.length} clubs by location`);
      return clubs;
    } catch (error) {
      console.error('❌ Failed to get clubs by location:', error);
      throw error;
    }
  }

  /**
   * Search clubs with advanced filters
   * @param {Object} filters - Search filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchClubsAdvanced(filters = {}, pagination = {}) {
    try {
      const {
        query: searchQuery,
        skillLevel,
        languages,
        tags,
        hasOpenSpots,
        memberCountRange, // { min, max }
        eventFrequency,
        sortBy = 'members', // 'members', 'activity', 'name', 'created'
        sortOrder = 'desc',
      } = filters;

      const { limit: limitCount = 20, lastDoc = null } = pagination;

      const clubsRef = collection(db, 'clubs');
      let q = query(
        clubsRef,
        where('status', '==', 'active'),
        where('settings.isPublic', '==', true)
      );

      // Apply skill level filter
      if (skillLevel && skillLevel !== 'mixed') {
        q = query(q, where('skillLevel', '==', skillLevel));
      }

      // Apply language filter
      if (languages && languages.length > 0) {
        q = query(q, where('languages', 'array-contains-any', languages));
      }

      // Apply sorting
      const sortField = this.getSortField(sortBy);
      q = query(q, orderBy(sortField, sortOrder), limit(limitCount));

      // Apply pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      let clubs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _doc: doc, // Keep reference for pagination
      }));

      // Apply additional filters that can't be done in Firestore query
      clubs = this.applyAdvancedFilters(clubs, {
        searchQuery,
        tags,
        hasOpenSpots,
        memberCountRange,
        eventFrequency,
      });

      const hasMore = snapshot.docs.length === limitCount;
      const lastDocument =
        snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      console.log(`✅ Found ${clubs.length} clubs with advanced search`);

      return {
        clubs,
        hasMore,
        lastDocument,
        totalShown: clubs.length,
      };
    } catch (error) {
      console.error('❌ Failed to search clubs:', error);
      throw error;
    }
  }

  /**
   * Get recommended clubs for user based on profile
   * @returns {Promise<Array>} Array of recommended clubs
   */
  async getRecommendedClubs() {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return [];

      // Get user profile
      const userProfile = await authService.getUserProfile();
      if (!userProfile?.profile) return [];

      const { skillLevel, preferredLanguage, playingStyle } = userProfile.profile;

      console.log('🎯 Getting club recommendations for user profile:', {
        skillLevel,
        preferredLanguage,
      });

      // Get clubs that match user's preferences
      const clubsRef = collection(db, 'clubs');
      let recommendations = [];

      // 1. Clubs with same skill level
      if (skillLevel) {
        const skillQuery = query(
          clubsRef,
          where('skillLevel', 'in', [skillLevel, 'mixed']),
          where('status', '==', 'active'),
          where('settings.isPublic', '==', true),
          orderBy('stats.activeMembers', 'desc'),
          limit(10)
        );

        const skillSnapshot = await getDocs(skillQuery);
        const skillClubs = skillSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          recommendationReason: `Perfect for ${skillLevel} players`,
          score: 100,
        }));
        recommendations.push(...skillClubs);
      }


      // 3. Clubs with same language
      if (preferredLanguage) {
        const langQuery = query(
          clubsRef,
          where('languages', 'array-contains', preferredLanguage),
          where('status', '==', 'active'),
          where('settings.isPublic', '==', true),
          orderBy('stats.activeMembers', 'desc'),
          limit(10)
        );

        const langSnapshot = await getDocs(langQuery);
        const langClubs = langSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          recommendationReason: `Speaks ${preferredLanguage}`,
          score: 85,
        }));
        recommendations.push(...langClubs);
      }

      // Remove duplicates and user's existing clubs
      const uniqueClubs = this.removeDuplicateClubs(recommendations);
      const filteredClubs = await this.filterUserExistingClubs(uniqueClubs);

      // Sort by score and take top 10
      const topRecommendations = filteredClubs.sort((a, b) => b.score - a.score).slice(0, 10);

      console.log(`✅ Generated ${topRecommendations.length} club recommendations`);
      return topRecommendations;
    } catch (error) {
      console.error('❌ Failed to get recommended clubs:', error);
      return [];
    }
  }

  /**
   * Get club categories/tags for filtering
   * @returns {Promise<Object>} Available categories and tags
   */
  async getClubCategories() {
    try {
      const clubsRef = collection(db, 'clubs');
      const q = query(
        clubsRef,
        where('status', '==', 'active'),
        where('settings.isPublic', '==', true)
      );

      const snapshot = await getDocs(q);
      const allTags = new Set();
      const skillLevels = new Set();
      const languages = new Set();
      const regions = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();

        // Collect tags
        if (data.tags) {
          data.tags.forEach(tag => allTags.add(tag));
        }

        // Collect skill levels
        if (data.skillLevel) {
          skillLevels.add(data.skillLevel);
        }

        // Collect languages
        if (data.languages) {
          data.languages.forEach(lang => languages.add(lang));
        }

        // Collect regions
        if (data.location?.region) {
          regions.add(data.location.region);
        }
      });

      const categories = {
        tags: Array.from(allTags).sort(),
        skillLevels: Array.from(skillLevels).sort(),
        languages: Array.from(languages).sort(),
        regions: Array.from(regions).sort(),
        popular: [
          'Korean',
          'Beginner Friendly',
          'Competitive',
          'Social',
          'Weekly Events',
          'Tournament',
          'Mixed Level',
          'Advanced',
        ],
      };

      console.log('✅ Retrieved club categories');
      return categories;
    } catch (error) {
      console.error('❌ Failed to get club categories:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
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
   * Get Firestore field name for sorting
   * @param {string} sortBy - Sort criteria
   * @returns {string} Firestore field path
   */
  getSortField(sortBy) {
    const sortFields = {
      members: 'stats.totalMembers',
      activity: 'stats.activeMembers',
      name: 'name',
      created: 'createdAt',
      events: 'stats.monthlyEvents',
    };

    return sortFields[sortBy] || 'stats.totalMembers';
  }

  /**
   * Apply filters that can't be done in Firestore query
   * @param {Array} clubs - Clubs to filter
   * @param {Object} filters - Additional filters
   * @returns {Array} Filtered clubs
   */
  applyAdvancedFilters(clubs, filters) {
    let filtered = clubs;

    // Text search filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        club =>
          club.name.toLowerCase().includes(query) ||
          club.description.toLowerCase().includes(query) ||
          (club.tags && club.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(
        club => club.tags && filters.tags.some(tag => club.tags.includes(tag))
      );
    }

    // Has open spots filter
    if (filters.hasOpenSpots) {
      filtered = filtered.filter(
        club => !club.settings?.maxMembers || club.stats.totalMembers < club.settings.maxMembers
      );
    }

    // Member count range filter
    if (filters.memberCountRange) {
      const { min, max } = filters.memberCountRange;
      filtered = filtered.filter(club => {
        const memberCount = club.stats?.totalMembers || 0;
        return (!min || memberCount >= min) && (!max || memberCount <= max);
      });
    }

    // Event frequency filter
    if (filters.eventFrequency) {
      const minEvents =
        filters.eventFrequency === 'high' ? 8 : filters.eventFrequency === 'medium' ? 4 : 1;
      filtered = filtered.filter(club => (club.stats?.monthlyEvents || 0) >= minEvents);
    }

    return filtered;
  }

  /**
   * Remove duplicate clubs from recommendations
   * @param {Array} clubs - Clubs array with potential duplicates
   * @returns {Array} Unique clubs
   */
  removeDuplicateClubs(clubs) {
    const seen = new Set();
    return clubs.filter(club => {
      if (seen.has(club.id)) {
        return false;
      }
      seen.add(club.id);
      return true;
    });
  }

  /**
   * Filter out clubs user is already a member of
   * @param {Array} clubs - Clubs to filter
   * @returns {Promise<Array>} Filtered clubs
   */
  async filterUserExistingClubs(clubs) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return clubs;

      const userProfile = await authService.getUserProfile();
      const userClubs = userProfile?.clubs?.memberships || [];

      return clubs.filter(club => !userClubs.includes(club.id));
    } catch (error) {
      console.warn('Could not filter user clubs:', error);
      return clubs; // Return all clubs if filtering fails
    }
  }

  /**
   * Get club join eligibility
   * @param {string} clubId - Club ID to check
   * @returns {Promise<Object>} Eligibility status
   */
  async checkClubJoinEligibility(clubId) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return { eligible: false, reason: 'Must be logged in' };
      }

      // Get club data
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (!clubDoc.exists()) {
        return { eligible: false, reason: 'Club not found' };
      }

      const club = clubDoc.data();

      // Check if club is active and public
      if (club.status !== 'active') {
        return { eligible: false, reason: 'Club is not active' };
      }

      if (!club.settings?.isPublic) {
        return { eligible: false, reason: 'Club is private' };
      }

      // Check member limit
      if (club.settings?.maxMembers && club.stats?.totalMembers >= club.settings.maxMembers) {
        return { eligible: false, reason: 'Club is full' };
      }

      // Check if user is already a member
      const userProfile = await authService.getUserProfile();
      if (userProfile?.clubs?.memberships?.includes(clubId)) {
        return { eligible: false, reason: 'Already a member' };
      }

      return {
        eligible: true,
        requiresApproval: club.settings?.joinRequiresApproval || false,
        message: club.settings?.joinRequiresApproval
          ? 'Membership requires approval from club admin'
          : 'You can join this club immediately',
      };
    } catch (error) {
      console.error('Failed to check club eligibility:', error);
      return { eligible: false, reason: 'Unable to check eligibility' };
    }
  }
}

// Create singleton instance
const discoveryService = new DiscoveryService();

export default discoveryService;
