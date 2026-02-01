/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase/config';
import { getInitialEloFromNtrp } from '../utils/lprUtils';

/**
 * Firebase Authentication Service for Lightning Pickleball
 * Handles user authentication, social login, and user profile management
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;

    // Set up auth state listener
    this.setupAuthStateListener();
  }

  /**
   * Set up authentication state listener
   */
  setupAuthStateListener() {
    onAuthStateChanged(auth, async user => {
      this.currentUser = user;
      this.isInitialized = true;

      if (user) {
        console.log('✅ User authenticated:', user.uid);
        // Sync user data with Firestore
        await this.syncUserProfile(user);
      } else {
        console.log('❌ User not authenticated');
      }
    });
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user object or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Wait for auth initialization
   * @returns {Promise} Promise that resolves when auth is initialized
   */
  waitForInitialization() {
    return new Promise(resolve => {
      if (this.isInitialized) {
        resolve();
      } else {
        const unsubscribe = onAuthStateChanged(auth, () => {
          unsubscribe();
          resolve();
        });
      }
    });
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User credential
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email sign-in successful');
      return userCredential;
    } catch (error) {
      console.error('❌ Email sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Create account with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} profileData - Additional profile data
   * @returns {Promise<Object>} User credential
   */
  async createAccountWithEmail(email, password, profileData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (profileData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: profileData.displayName,
        });
      }

      // Create user profile in Firestore
      await this.createUserProfile(userCredential.user, profileData);

      console.log('✅ Account creation successful');
      return userCredential;
    } catch (error) {
      console.error('❌ Account creation failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   * @param {string} idToken - Google ID token from Google Sign-In
   * @returns {Promise<Object>} User credential
   */
  async signInWithGoogle(idToken) {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      console.log('✅ Google sign-in successful');
      return userCredential;
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Apple
   * @param {string} identityToken - Apple identity token
   * @param {string} nonce - Apple nonce
   * @returns {Promise<Object>} User credential
   */
  async signInWithApple(identityToken, nonce) {
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const userCredential = await signInWithCredential(auth, credential);

      console.log('✅ Apple sign-in successful');
      return userCredential;
    } catch (error) {
      console.error('❌ Apple sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   * 🔧 [PUSH TOKEN FIX] Clears pushToken before signing out to prevent
   * notifications being sent to wrong device when another user logs in
   * @returns {Promise} Sign out promise
   */
  async signOut() {
    try {
      // 🔧 [PUSH TOKEN FIX] Clear pushToken before signing out
      // This prevents the scenario where User A logs out, User B logs in on same device,
      // but User A's document still has the device's pushToken
      if (this.currentUser?.uid) {
        try {
          const userRef = doc(db, 'users', this.currentUser.uid);
          await updateDoc(userRef, {
            pushToken: null,
            pushTokenUpdatedAt: null,
          });
          console.log('🧹 PushToken cleared for user:', this.currentUser.uid);
        } catch (tokenError) {
          // Don't block sign-out if pushToken clearing fails
          console.warn('⚠️ Failed to clear pushToken (non-blocking):', tokenError);
        }
      }

      await signOut(auth);
      console.log('✅ Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      throw error;
    }
  }

  /**
   * Re-authenticate user with email/password
   * Required for sensitive operations like account deletion
   * @param {string} password - User's current password
   * @returns {Promise} Re-authentication promise
   */
  async reauthenticateWithPassword(password) {
    if (!this.currentUser) throw new Error('No authenticated user');
    if (!this.currentUser.email) throw new Error('User has no email');

    try {
      const credential = EmailAuthProvider.credential(this.currentUser.email, password);
      await reauthenticateWithCredential(this.currentUser, credential);
      console.log('✅ Re-authentication successful');
    } catch (error) {
      console.error('❌ Re-authentication failed:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        const err = new Error('Incorrect password. Please try again.');
        err.code = 'auth/wrong-password';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Get user's authentication provider
   * @returns {string} Provider ID (e.g., 'password', 'google.com', 'apple.com')
   */
  getAuthProvider() {
    if (!this.currentUser) return null;
    const providerData = this.currentUser.providerData;
    if (providerData && providerData.length > 0) {
      return providerData[0].providerId;
    }
    return 'password'; // Default to password if no provider data
  }

  /**
   * Delete all user-related data from Firestore
   * @param {string} userId - User ID to clean up
   * @returns {Promise} Cleanup promise
   */
  async cleanupUserData(userId) {
    const batch = writeBatch(db);
    let deletedCount = 0;

    try {
      // 1. Delete all club memberships
      console.log('🧹 Cleaning up club memberships...');
      const clubMembersQuery = query(collection(db, 'clubMembers'), where('userId', '==', userId));
      const clubMembersSnapshot = await getDocs(clubMembersQuery);
      clubMembersSnapshot.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
        deletedCount++;
      });
      console.log(`📋 Found ${clubMembersSnapshot.size} club memberships to delete`);

      // 2. Delete all friend relationships (where user is sender or receiver)
      console.log('🧹 Cleaning up friend relationships...');
      const friendsAsSenderQuery = query(
        collection(db, 'friendships'),
        where('senderId', '==', userId)
      );
      const friendsAsReceiverQuery = query(
        collection(db, 'friendships'),
        where('receiverId', '==', userId)
      );
      const [senderSnapshot, receiverSnapshot] = await Promise.all([
        getDocs(friendsAsSenderQuery),
        getDocs(friendsAsReceiverQuery),
      ]);
      senderSnapshot.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
        deletedCount++;
      });
      receiverSnapshot.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
        deletedCount++;
      });
      console.log(
        `📋 Found ${senderSnapshot.size + receiverSnapshot.size} friend relationships to delete`
      );

      // 3. Delete user document
      console.log('🧹 Deleting user document...');
      const userRef = doc(db, 'users', userId);
      batch.delete(userRef);
      deletedCount++;

      // Commit all deletions in a single batch
      await batch.commit();
      console.log(`✅ Successfully cleaned up ${deletedCount} documents for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to cleanup user data:', error);
      throw error;
    }
  }

  /**
   * Delete user account and all associated data
   * Uses Cloud Function with Admin SDK to bypass requires-recent-login restriction
   * @param {string} confirmNickname - User's nickname for confirmation
   * @returns {Promise} Account deletion promise
   */
  async deleteUserAccount(confirmNickname) {
    if (!this.currentUser) throw new Error('No authenticated user');

    const userId = this.currentUser.uid;

    try {
      console.log('🗑️ Starting account deletion for user:', userId);
      console.log('🔐 Using Cloud Function with Admin SDK for complete deletion');

      // Call Cloud Function to delete account (Admin SDK bypasses requires-recent-login)
      const deleteAccount = httpsCallable(functions, 'deleteUserAccount');
      const result = await deleteAccount({ confirmNickname });

      console.log('✅ Cloud Function response:', result.data);

      // Reset local state
      this.currentUser = null;

      // Sign out locally (Cloud Function already deleted the Auth account)
      await signOut(auth);

      console.log('✅ Account deletion completed successfully');
      return result.data;
    } catch (error) {
      // Use console.warn instead of console.error to avoid red error toast
      console.warn('⚠️ Account deletion issue:', error.code || error.message || error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise} Password reset promise
   */
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Create user profile in Firestore
   * @param {Object} user - Firebase user object
   * @param {Object} additionalData - Additional profile data
   * @param {Object} [additionalData.ntrpAssessment] - NTRP assessment data (optional)
   * @param {Object} additionalData.ntrpAssessment.result - Assessment result
   * @param {number} additionalData.ntrpAssessment.result.recommendedNtrp - Recommended NTRP level (1.0-7.0)
   * @param {string} additionalData.ntrpAssessment.result.confidence - Confidence level ('high', 'medium', 'low')
   * @param {Object} additionalData.ntrpAssessment.result.scoreBreakdown - Score breakdown by category
   * @param {string[]} [additionalData.ntrpAssessment.result.warnings] - Warning messages (optional)
   * @param {Array} additionalData.ntrpAssessment.answers - Array of answer objects
   * @returns {Promise} Profile creation promise
   */
  async createUserProfile(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        // 🎯 [KIM FIX] Explicitly set isOnboardingComplete to prevent undefined bug
        isOnboardingComplete: false,
        // Lightning Pickleball specific data
        profile: {
          nickname: additionalData.nickname || user.displayName || '',
          skillLevel: additionalData.skillLevel || 'beginner',
          gender: additionalData.gender || '',
          location: additionalData.location || '',
          zipCode: additionalData.zipCode || '',
          playingStyle: additionalData.playingStyle || [],
          maxTravelDistance: additionalData.maxTravelDistance || 20,
          notificationDistance:
            additionalData.notificationDistance || additionalData.maxTravelDistance || 10, // Unified with maxTravelDistance
          preferredLanguage: additionalData.preferredLanguage || 'en',
          communicationLanguages: additionalData.communicationLanguages || ['en'],
          // Legacy fields removed - onboarding completion now handled at root level
        },
        stats: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          currentStreak: 0,
          // NTRP-based initial ELO for each match type
          publicStats: {
            singles: {
              matchesPlayed: 0,
              wins: 0,
              losses: 0,
              setsWon: 0,
              setsLost: 0,
              gamesWon: 0,
              gamesLost: 0,
              elo: additionalData.skillLevel
                ? getInitialEloFromNtrp(additionalData.skillLevel)
                : 1200,
            },
            doubles: {
              matchesPlayed: 0,
              wins: 0,
              losses: 0,
              setsWon: 0,
              setsLost: 0,
              gamesWon: 0,
              gamesLost: 0,
              elo: additionalData.skillLevel
                ? getInitialEloFromNtrp(additionalData.skillLevel)
                : 1200,
            },
            mixed_doubles: {
              matchesPlayed: 0,
              wins: 0,
              losses: 0,
              setsWon: 0,
              setsLost: 0,
              gamesWon: 0,
              gamesLost: 0,
              elo: additionalData.skillLevel
                ? getInitialEloFromNtrp(additionalData.skillLevel)
                : 1200,
            },
          },
        },
        preferences: {
          language: additionalData.preferredLanguage || 'en',
          notifications: {
            personalMatches: additionalData.notifications?.personalMatches !== false,
            clubEvents: additionalData.notifications?.clubEvents !== false,
            friendRequests: additionalData.notifications?.friendRequests !== false,
            matchReminders: additionalData.notifications?.matchReminders !== false,
            notificationDistance:
              additionalData.notificationDistance || additionalData.maxTravelDistance || 10, // Unified with maxTravelDistance
          },
          privacy: {
            showEmail: additionalData.privacy?.showEmail || false,
            showLocation: additionalData.privacy?.showLocation !== false,
            showStats: additionalData.privacy?.showStats !== false,
          },
        },

        // Club-related data
        clubs: {
          memberships: [], // Array of club IDs user is a member of
          adminOf: [], // Array of club IDs user is admin of
          favoriteClubs: [], // Array of club IDs user favorites
        },

        // NTRP Assessment Data (optional - only if user completed questionnaire)
        ...(additionalData.ntrpAssessment && {
          ntrpAssessment: {
            completedAt: new Date().toISOString(),
            recommendedNtrp: additionalData.ntrpAssessment.result.recommendedNtrp,
            confidence: additionalData.ntrpAssessment.result.confidence,
            scoreBreakdown: additionalData.ntrpAssessment.result.scoreBreakdown,
            answers: additionalData.ntrpAssessment.answers, // Array of Answer objects
            warnings: additionalData.ntrpAssessment.result.warnings || [],
          },
        }),
        ...additionalData,
      };

      try {
        await setDoc(userRef, userData);
        console.log('✅ User profile created in Firestore');
      } catch (error) {
        console.error('❌ Failed to create user profile:', error);
        throw error;
      }
    }
  }

  /**
   * Sync user profile with Firestore
   * @param {Object} user - Firebase user object
   * @returns {Promise} Sync promise
   */
  async syncUserProfile(user) {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await this.createUserProfile(user);
      } else {
        console.error('❌ Failed to sync user profile:', error);
      }
    }
  }

  /**
   * Get user profile from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId = null) {
    const uid = userId || this.currentUser?.uid;
    if (!uid) throw new Error('No user ID provided');

    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Get multiple user profiles in batch (for tournament seeding)
   * @param {string[]} userIds - Array of user IDs to fetch
   * @returns {Promise<Object[]>} Array of user profile data
   */
  async getBatchUserProfiles(userIds) {
    if (!userIds || userIds.length === 0) return [];

    try {
      const profilePromises = userIds.map(async userId => {
        try {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            return {
              userId,
              profile: userDoc.data(),
              success: true,
            };
          } else {
            console.warn(`⚠️ User profile not found for ID: ${userId}`);
            return {
              userId,
              profile: null,
              success: false,
              error: 'Profile not found',
            };
          }
        } catch (error) {
          console.error(`❌ Failed to fetch profile for user ${userId}:`, error);
          return {
            userId,
            profile: null,
            success: false,
            error: error.message,
          };
        }
      });

      const results = await Promise.all(profilePromises);
      console.log(
        `✅ Batch fetched ${results.filter(r => r.success).length}/${userIds.length} user profiles`
      );

      return results;
    } catch (error) {
      console.error('❌ Failed to batch fetch user profiles:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} updateData - Data to update
   * @returns {Promise} Update promise
   */
  async updateUserProfile(updateData) {
    if (!this.currentUser) throw new Error('No authenticated user');

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ User profile updated');
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Complete user onboarding with comprehensive data
   * @param {Object} onboardingData - Complete onboarding data
   * @returns {Promise<Object>} Updated user profile
   */
  async completeOnboarding(onboardingData) {
    if (!this.currentUser) throw new Error('No authenticated user');

    try {
      // Transform and validate onboarding data
      const { transformOnboardingData, validateOnboardingData } =
        await import('../utils/onboardingUtils');

      const transformedData = transformOnboardingData(onboardingData);
      const validation = validateOnboardingData(transformedData);

      if (!validation.isValid) {
        throw new Error(`Onboarding validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Onboarding warnings:', validation.warnings);
      }

      // Prepare comprehensive profile update
      const profileUpdate = {
        profile: {
          // Language settings
          preferredLanguage: transformedData.preferredLanguage,
          communicationLanguages: transformedData.communicationLanguages,
          // Basic information
          nickname: transformedData.nickname,
          gender: transformedData.gender,
          zipCode: transformedData.zipCode,
          // Pickleball specific
          skillLevel: transformedData.skillLevel,
          playingStyle: transformedData.playingStyle,
          maxTravelDistance: transformedData.maxTravelDistance,
          notificationDistance: transformedData.notificationDistance,
          // Legacy onboarding fields removed - handled at root level
        },
        preferences: {
          language: transformedData.preferredLanguage,
          notifications: transformedData.notifications,
          privacy: transformedData.privacy,
        },
        // CONSTITUTIONAL AMENDMENT: Write to the TRUE KING field
        isOnboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update user profile in Firestore
      await this.updateUserProfile(profileUpdate);

      console.log('✅ Onboarding completed successfully');
      console.log('📊 Profile data saved:', {
        nickname: transformedData.nickname,
        skillLevel: transformedData.skillLevel,
        language: transformedData.preferredLanguage,
        regions: 0,
      });

      // Return updated profile
      return await this.getUserProfile();
    } catch (error) {
      console.error('❌ Failed to complete onboarding:', error);
      throw error;
    }
  }

  /**
   * Handle authentication errors with user-friendly messages
   * @param {Object} error - Firebase auth error
   * @returns {Error} Formatted error
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Invalid password',
      'auth/email-already-in-use': 'An account already exists with this email',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/popup-closed-by-user': 'Sign-in was cancelled',
      'auth/cancelled-popup-request': 'Sign-in was cancelled',
      'auth/popup-blocked': 'Pop-up was blocked by the browser',
    };

    const userFriendlyMessage = errorMessages[error.code] || error.message;
    return new Error(userFriendlyMessage);
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
