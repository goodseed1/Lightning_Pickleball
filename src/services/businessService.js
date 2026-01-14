/**
 * Business Service for Lightning Pickleball
 * Handles local pickleball business partnerships, coach profiles, and shop integrations
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
  startAfter,
  serverTimestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';

/**
 * Business Service Class
 * Manages pickleball business partnerships and services
 */
class BusinessService {
  constructor() {
    console.log('🏪 BusinessService initialized');
  }

  // ============ BUSINESS REGISTRATION ============

  /**
   * Register a new pickleball business
   * @param {Object} businessData - Business registration data
   * @returns {Promise<string>} Business ID
   */
  async registerBusiness(businessData) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      const businessDoc = {
        // Business Info
        name: businessData.name,
        description: businessData.description,
        type: businessData.type, // 'coach', 'pro_shop', 'academy', 'court_rental'

        // Contact Information
        contactInfo: {
          email: businessData.email,
          phone: businessData.phone,
          website: businessData.website || '',
          address: businessData.address,
          coordinates: businessData.coordinates
            ? new GeoPoint(businessData.coordinates.lat, businessData.coordinates.lng)
            : null,
        },

        // Owner Information
        owner: {
          userId: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
        },

        // Business Details
        services: businessData.services || [], // Array of service objects
        specialties: businessData.specialties || [], // e.g., ['beginners', 'advanced', 'juniors']
        pricing: businessData.pricing || {}, // Service pricing structure
        availability: businessData.availability || {}, // Operating hours and schedule

        // Partnership Settings
        partnership: {
          isActive: false, // Requires admin approval
          clubDiscounts: [], // Array of club partnership objects
          generalDiscount: businessData.generalDiscount || 0,
          specialOffers: [],
        },

        // Media
        images: businessData.images || [],
        logo: businessData.logo || '',
        certifications: businessData.certifications || [],

        // Status and Verification
        status: 'pending', // 'pending', 'approved', 'rejected', 'suspended'
        verified: false,
        verificationDocuments: businessData.verificationDocuments || [],

        // Statistics
        stats: {
          totalBookings: 0,
          averageRating: 0,
          totalReviews: 0,
          partnerClubs: 0,
          monthlyViews: 0,
        },

        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const businessesRef = collection(db, 'businesses');
      const docRef = await addDoc(businessesRef, businessDoc);

      // Send notification to admin for approval
      await this.sendBusinessRegistrationNotification(docRef.id, businessData);

      console.log('✅ Business registered successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to register business:', error);
      throw error;
    }
  }

  /**
   * Update business profile
   * @param {string} businessId - Business ID
   * @param {Object} updates - Updated business data
   * @returns {Promise<void>}
   */
  async updateBusinessProfile(businessId, updates) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      // Verify ownership
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }

      const business = businessDoc.data();
      if (business.owner.userId !== currentUser.uid) {
        throw new Error('Not authorized to update this business');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'businesses', businessId), updateData);
      console.log('✅ Business profile updated');
    } catch (error) {
      console.error('❌ Failed to update business profile:', error);
      throw error;
    }
  }

  // ============ BUSINESS DISCOVERY ============

  /**
   * Search businesses by location and type
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Array of businesses
   */
  async searchBusinesses(filters = {}) {
    try {
      const {
        type,
        location,
        radius = 50, // km
        specialties,
        minRating = 0,
        priceRange,
        sortBy = 'rating',
      } = filters;

      const businessesRef = collection(db, 'businesses');
      let q = query(
        businessesRef,
        where('status', '==', 'approved'),
        orderBy('stats.averageRating', 'desc'),
        limit(50)
      );

      // Apply type filter
      if (type) {
        q = query(
          businessesRef,
          where('type', '==', type),
          where('status', '==', 'approved'),
          orderBy('stats.averageRating', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      let businesses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Apply additional filters
      businesses = this.applyBusinessFilters(businesses, {
        location,
        radius,
        specialties,
        minRating,
        priceRange,
      });

      // Sort results
      businesses = this.sortBusinesses(businesses, sortBy);

      console.log(`✅ Found ${businesses.length} businesses`);
      return businesses;
    } catch (error) {
      console.error('❌ Failed to search businesses:', error);
      throw error;
    }
  }

  /**
   * Get businesses near a specific location
   * @param {Object} location - Location coordinates
   * @param {number} radius - Search radius in km
   * @param {string} type - Business type filter
   * @returns {Promise<Array>} Nearby businesses
   */
  async getNearbyBusinesses(location, radius = 25, type = null) {
    try {
      const businesses = await this.searchBusinesses({
        type,
        location,
        radius,
        sortBy: 'distance',
      });

      return businesses;
    } catch (error) {
      console.error('❌ Failed to get nearby businesses:', error);
      throw error;
    }
  }

  // ============ CLUB PARTNERSHIPS ============

  /**
   * Create club partnership offer
   * @param {string} businessId - Business ID
   * @param {string} clubId - Club ID
   * @param {Object} partnershipDetails - Partnership terms
   * @returns {Promise<string>} Partnership request ID
   */
  async createClubPartnership(businessId, clubId, partnershipDetails) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      const partnershipData = {
        businessId,
        clubId,
        businessOwnerId: currentUser.uid,

        // Partnership Terms
        discount: partnershipDetails.discount || 10, // Percentage
        services: partnershipDetails.services || [], // Included services
        terms: partnershipDetails.terms || '',
        validUntil: partnershipDetails.validUntil,

        // Offer Details
        title: partnershipDetails.title,
        description: partnershipDetails.description,
        specialOffers: partnershipDetails.specialOffers || [],

        // Status
        status: 'pending', // 'pending', 'accepted', 'rejected', 'expired'
        proposedAt: serverTimestamp(),
        respondedAt: null,

        // Usage Tracking
        usage: {
          totalClaims: 0,
          membersClaimed: [],
          monthlyUsage: {},
        },
      };

      const partnershipsRef = collection(db, 'partnerships');
      const docRef = await addDoc(partnershipsRef, partnershipData);

      // Notify club admin
      await this.notifyClubAboutPartnership(clubId, businessId, docRef.id);

      console.log('✅ Partnership proposal created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to create partnership:', error);
      throw error;
    }
  }

  /**
   * Get club partnerships
   * @param {string} clubId - Club ID
   * @param {string} status - Partnership status filter
   * @returns {Promise<Array>} Club partnerships
   */
  async getClubPartnerships(clubId, status = 'accepted') {
    try {
      const partnershipsRef = collection(db, 'partnerships');
      const q = query(
        partnershipsRef,
        where('clubId', '==', clubId),
        where('status', '==', status),
        orderBy('proposedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const partnerships = [];

      for (const doc of snapshot.docs) {
        const partnership = { id: doc.id, ...doc.data() };

        // Get business details
        const businessDoc = await getDoc(doc(db, 'businesses', partnership.businessId));
        if (businessDoc.exists()) {
          partnership.business = { id: businessDoc.id, ...businessDoc.data() };
        }

        partnerships.push(partnership);
      }

      console.log(`✅ Found ${partnerships.length} partnerships for club ${clubId}`);
      return partnerships;
    } catch (error) {
      console.error('❌ Failed to get club partnerships:', error);
      throw error;
    }
  }

  // ============ SERVICE BOOKINGS ============

  /**
   * Book a service from a partner business
   * @param {string} businessId - Business ID
   * @param {Object} bookingDetails - Booking information
   * @returns {Promise<string>} Booking ID
   */
  async bookService(businessId, bookingDetails) {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('User must be authenticated');

      const bookingData = {
        businessId,
        userId: currentUser.uid,

        // Service Details
        serviceType: bookingDetails.serviceType,
        serviceName: bookingDetails.serviceName,
        duration: bookingDetails.duration,

        // Scheduling
        requestedDate: bookingDetails.requestedDate,
        requestedTime: bookingDetails.requestedTime,
        confirmedDateTime: null,

        // Pricing
        basePrice: bookingDetails.basePrice,
        discount: bookingDetails.discount || 0,
        finalPrice: bookingDetails.basePrice * (1 - (bookingDetails.discount || 0) / 100),

        // Partnership Information
        partnershipId: bookingDetails.partnershipId || null,
        clubId: bookingDetails.clubId || null,

        // Contact
        customerNotes: bookingDetails.customerNotes || '',
        businessNotes: '',

        // Status Tracking
        status: 'pending', // 'pending', 'confirmed', 'completed', 'cancelled'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const bookingsRef = collection(db, 'bookings');
      const docRef = await addDoc(bookingsRef, bookingData);

      // Notify business owner
      await this.notifyBusinessAboutBooking(businessId, docRef.id);

      // Update partnership usage if applicable
      if (bookingDetails.partnershipId) {
        await this.updatePartnershipUsage(bookingDetails.partnershipId, currentUser.uid);
      }

      console.log('✅ Service booked successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to book service:', error);
      throw error;
    }
  }

  /**
   * Get user bookings
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} User bookings
   */
  async getUserBookings(userId = null) {
    try {
      const currentUser = authService.getCurrentUser();
      const targetUserId = userId || currentUser?.uid;

      if (!targetUserId) throw new Error('User ID required');

      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('userId', '==', targetUserId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const bookings = [];

      for (const doc of snapshot.docs) {
        const booking = { id: doc.id, ...doc.data() };

        // Get business details
        const businessDoc = await getDoc(doc(db, 'businesses', booking.businessId));
        if (businessDoc.exists()) {
          booking.business = { id: businessDoc.id, ...businessDoc.data() };
        }

        bookings.push(booking);
      }

      console.log(`✅ Found ${bookings.length} bookings for user ${targetUserId}`);
      return bookings;
    } catch (error) {
      console.error('❌ Failed to get user bookings:', error);
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

  degToRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Apply additional filters to business search results
   * @param {Array} businesses - Businesses to filter
   * @param {Object} filters - Additional filters
   * @returns {Array} Filtered businesses
   */
  applyBusinessFilters(businesses, filters) {
    let filtered = businesses;

    // Location and radius filter
    if (filters.location && filters.location.lat && filters.location.lng) {
      filtered = filtered.filter(business => {
        if (!business.contactInfo?.coordinates) return true;

        const distance = this.calculateDistance(
          filters.location.lat,
          filters.location.lng,
          business.contactInfo.coordinates._lat || business.contactInfo.coordinates.latitude,
          business.contactInfo.coordinates._long || business.contactInfo.coordinates.longitude
        );

        business.distance = Math.round(distance * 10) / 10;
        return distance <= filters.radius;
      });
    }

    // Specialties filter
    if (filters.specialties && filters.specialties.length > 0) {
      filtered = filtered.filter(
        business =>
          business.specialties &&
          filters.specialties.some(specialty => business.specialties.includes(specialty))
      );
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(
        business => (business.stats?.averageRating || 0) >= filters.minRating
      );
    }

    return filtered;
  }

  /**
   * Sort businesses by specified criteria
   * @param {Array} businesses - Businesses to sort
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Sorted businesses
   */
  sortBusinesses(businesses, sortBy) {
    switch (sortBy) {
      case 'distance':
        return businesses.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      case 'rating':
        return businesses.sort(
          (a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0)
        );
      case 'name':
        return businesses.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return businesses.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      default:
        return businesses;
    }
  }

  /**
   * Send business registration notification to admin
   * @param {string} businessId - Business ID
   * @param {Object} businessData - Business data
   */
  async sendBusinessRegistrationNotification(businessId, businessData) {
    try {
      const notificationRef = collection(db, 'admin_notifications');
      await addDoc(notificationRef, {
        type: 'business_registration',
        businessId,
        businessName: businessData.name,
        businessType: businessData.type,
        ownerEmail: businessData.email,
        status: 'unread',
        priority: 'medium',
        createdAt: serverTimestamp(),
      });

      console.log('📧 Business registration notification sent');
    } catch (error) {
      console.error('Failed to send registration notification:', error);
    }
  }

  /**
   * Notify club about partnership proposal
   * @param {string} clubId - Club ID
   * @param {string} businessId - Business ID
   * @param {string} partnershipId - Partnership ID
   */
  async notifyClubAboutPartnership(clubId, businessId, partnershipId) {
    try {
      // Get club admins
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (!clubDoc.exists()) return;

      const club = clubDoc.data();
      const adminIds = club.adminIds || [];

      // Create notifications for each admin
      const batch = [];
      adminIds.forEach(adminId => {
        const notificationRef = collection(db, 'users', adminId, 'notifications');
        batch.push(
          addDoc(notificationRef, {
            type: 'partnership_proposal',
            title: 'New Partnership Proposal',
            message: 'A local business wants to partner with your club',
            data: {
              clubId,
              businessId,
              partnershipId,
            },
            read: false,
            createdAt: serverTimestamp(),
          })
        );
      });

      await Promise.all(batch);
      console.log('📧 Club partnership notifications sent');
    } catch (error) {
      console.error('Failed to notify club about partnership:', error);
    }
  }

  /**
   * Notify business about new booking
   * @param {string} businessId - Business ID
   * @param {string} bookingId - Booking ID
   */
  async notifyBusinessAboutBooking(businessId, bookingId) {
    try {
      const businessDoc = await getDoc(doc(db, 'businesses', businessId));
      if (!businessDoc.exists()) return;

      const business = businessDoc.data();
      const ownerId = business.owner.userId;

      const notificationRef = collection(db, 'users', ownerId, 'notifications');
      await addDoc(notificationRef, {
        type: 'new_booking',
        title: 'New Service Booking',
        message: 'Someone has booked your service',
        data: {
          businessId,
          bookingId,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      console.log('📧 Business booking notification sent');
    } catch (error) {
      console.error('Failed to notify business about booking:', error);
    }
  }

  /**
   * Update partnership usage statistics
   * @param {string} partnershipId - Partnership ID
   * @param {string} userId - User ID who used the partnership
   */
  async updatePartnershipUsage(partnershipId, userId) {
    try {
      const partnershipRef = doc(db, 'partnerships', partnershipId);
      const partnershipDoc = await getDoc(partnershipRef);

      if (!partnershipDoc.exists()) return;

      const partnership = partnershipDoc.data();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const updates = {
        'usage.totalClaims': (partnership.usage?.totalClaims || 0) + 1,
        [`usage.monthlyUsage.${currentMonth}`]:
          (partnership.usage?.monthlyUsage?.[currentMonth] || 0) + 1,
        updatedAt: serverTimestamp(),
      };

      // Add user to claimed list if not already there
      const membersClaimed = partnership.usage?.membersClaimed || [];
      if (!membersClaimed.includes(userId)) {
        updates['usage.membersClaimed'] = [...membersClaimed, userId];
      }

      await updateDoc(partnershipRef, updates);
      console.log('📊 Partnership usage updated');
    } catch (error) {
      console.error('Failed to update partnership usage:', error);
    }
  }
}

// Create singleton instance
const businessService = new BusinessService();

export default businessService;
