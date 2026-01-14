/**
 * Social Service for Lightning Pickleball
 * Handles friend requests, player discovery, and social interactions
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';
import { httpsCallable, HttpsCallable } from 'firebase/functions';
import { User } from 'firebase/auth';
import { db, functions } from '../firebase/config';
import authService from './authService';
import {
  Friend,
  FriendRequest,
  PlayerRecommendation,
  ActivityFeedItem,
  FriendshipStatus,
  PlayerSearchFilters,
  PlayerSearchResult,
  RecommendationOptions,
} from '../types/social';
import {
  validateFriendArray,
  validateFriendRequestArray,
  safeParseFriend,
  safeParseFriendRequest,
} from '../validators/socialValidators';

/**
 * Social Service Class
 * Manages friend relationships, player discovery, and social features
 */
class SocialService {
  private recommendPlayersFunction: HttpsCallable;
  private createActivityFeedItemFunction: HttpsCallable;

  constructor() {
    console.log('👥 SocialService initialized');

    // Initialize Cloud Functions
    this.recommendPlayersFunction = httpsCallable(functions, 'recommendPlayers');
    this.createActivityFeedItemFunction = httpsCallable(functions, 'createActivityFeedItem');
  }

  // ============ FRIEND SYSTEM ============

  /**
   * Send friend request
   * @param targetUserId - User to send request to
   * @param message - Optional message
   * @returns Friend request ID
   */
  async sendFriendRequest(targetUserId: string, message: string = ''): Promise<string> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      if (targetUserId === currentUser.uid) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if friendship already exists
      const existingFriendship = await this.getFriendshipStatus(targetUserId);
      if (existingFriendship.status !== 'none') {
        throw new Error(`Friendship already exists with status: ${existingFriendship.status}`);
      }

      // Get target user info
      const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
      if (!targetUserDoc.exists()) {
        throw new Error('Target user not found');
      }

      const targetUser = targetUserDoc.data();

      // Create friend request
      const friendRequestsRef = collection(db, 'friendRequests');
      const requestData = {
        senderId: currentUser.uid,
        receiverId: targetUserId,
        senderInfo: {
          displayName: currentUser.displayName || 'Unknown Player',
          nickname: currentUser.displayName || 'Unknown Player',
          photoURL: currentUser.photoURL || '',
          skillLevel: 'intermediate', // Get from user profile
        },
        receiverInfo: {
          displayName: targetUser.displayName || 'Unknown Player',
          nickname: targetUser.displayName || 'Unknown Player',
          photoURL: targetUser.photoURL || '',
        },
        message,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      const docRef = await addDoc(friendRequestsRef, requestData);

      // Send notification to target user
      await this.createNotification(targetUserId, {
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${currentUser.displayName} sent you a friend request`,
        data: {
          requestId: docRef.id,
          senderId: currentUser.uid,
        },
      });

      console.log('✅ Friend request sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to send friend request:', error);
      throw error;
    }
  }

  /**
   * Accept friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise} Accept promise
   */
  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      await runTransaction(db, async transaction => {
        // Get friend request
        const requestRef = doc(db, 'friendRequests', requestId);
        const requestDoc = await transaction.get(requestRef);

        if (!requestDoc.exists()) {
          throw new Error('Friend request not found');
        }

        const requestData = requestDoc.data();

        // Verify current user is the receiver
        if (requestData.receiverId !== currentUser.uid) {
          throw new Error('Not authorized to accept this request');
        }

        if (requestData.status !== 'pending') {
          throw new Error(`Request already ${requestData.status}`);
        }

        // Create friendship document
        const friendshipId = `${requestData.senderId}_${requestData.receiverId}`;
        const friendshipRef = doc(db, 'friendships', friendshipId);
        const friendshipData = {
          user1Id: requestData.senderId,
          user2Id: requestData.receiverId,
          user1Info: requestData.senderInfo,
          user2Info: requestData.receiverInfo,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(friendshipRef, friendshipData);

        // Update friend request status
        transaction.update(requestRef, {
          status: 'accepted',
          respondedAt: serverTimestamp(),
        });

        // Add to both users' friends lists
        const user1Ref = doc(db, 'users', requestData.senderId);
        const user2Ref = doc(db, 'users', requestData.receiverId);

        transaction.update(user1Ref, {
          friends: arrayUnion(requestData.receiverId),
          updatedAt: serverTimestamp(),
        });

        transaction.update(user2Ref, {
          friends: arrayUnion(requestData.senderId),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Friend request accepted');
    } catch (error) {
      console.error('❌ Failed to accept friend request:', error);
      throw error;
    }
  }

  /**
   * Decline friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise} Decline promise
   */
  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = requestDoc.data();

      if (requestData.receiverId !== currentUser.uid) {
        throw new Error('Not authorized to decline this request');
      }

      await updateDoc(requestRef, {
        status: 'declined',
        respondedAt: serverTimestamp(),
      });

      console.log('✅ Friend request declined');
    } catch (error) {
      console.error('❌ Failed to decline friend request:', error);
      throw error;
    }
  }

  /**
   * Remove friend
   * @param {string} friendUserId - Friend's user ID
   * @returns {Promise} Remove promise
   */
  async removeFriend(friendUserId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      await runTransaction(db, async transaction => {
        // Find and delete friendship document
        const friendshipId1 = `${currentUser.uid}_${friendUserId}`;
        const friendshipId2 = `${friendUserId}_${currentUser.uid}`;

        const friendship1Ref = doc(db, 'friendships', friendshipId1);
        const friendship2Ref = doc(db, 'friendships', friendshipId2);

        const friendship1Doc = await transaction.get(friendship1Ref);
        const friendship2Doc = await transaction.get(friendship2Ref);

        if (friendship1Doc.exists()) {
          transaction.delete(friendship1Ref);
        } else if (friendship2Doc.exists()) {
          transaction.delete(friendship2Ref);
        } else {
          throw new Error('Friendship not found');
        }

        // Remove from both users' friends lists
        const user1Ref = doc(db, 'users', currentUser.uid);
        const user2Ref = doc(db, 'users', friendUserId);

        transaction.update(user1Ref, {
          friends: arrayRemove(friendUserId),
          updatedAt: serverTimestamp(),
        });

        transaction.update(user2Ref, {
          friends: arrayRemove(currentUser.uid),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Friend removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove friend:', error);
      throw error;
    }
  }

  // ============ FRIEND QUERIES ============

  /**
   * Get user's friends list
   * @returns {Promise<Array>} Array of friends
   */
  async getFriends(): Promise<Friend[]> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) return [];

      const friendshipsRef = collection(db, 'friendships');
      const q1 = query(
        friendshipsRef,
        where('user1Id', '==', currentUser.uid),
        where('status', '==', 'active')
      );
      const q2 = query(
        friendshipsRef,
        where('user2Id', '==', currentUser.uid),
        where('status', '==', 'active')
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const friends: Friend[] = [];

      // Process friendships where current user is user1
      snapshot1.docs.forEach(doc => {
        const data = doc.data();
        friends.push({
          userId: data.user2Id,
          userInfo: data.user2Info,
          friendshipId: doc.id,
          createdAt: data.createdAt,
        });
      });

      // Process friendships where current user is user2
      snapshot2.docs.forEach(doc => {
        const data = doc.data();
        friends.push({
          userId: data.user1Id,
          userInfo: data.user1Info,
          friendshipId: doc.id,
          createdAt: data.createdAt,
        });
      });

      console.log(`✅ Found ${friends.length} friends`);

      // Validate the friends array before returning
      try {
        const validatedFriends = validateFriendArray(friends);
        return validatedFriends;
      } catch (validationError) {
        console.warn('⚠️ Friend data validation failed:', validationError);
        // Filter out invalid friends and return valid ones
        const validFriends = friends.filter(friend => {
          const result = safeParseFriend(friend);
          return result.success;
        });
        console.log(
          `✅ Returning ${validFriends.length} valid friends (filtered from ${friends.length})`
        );
        return validFriends;
      }
    } catch (error) {
      console.error('❌ Failed to get friends:', error);
      throw error;
    }
  }

  /**
   * Get incoming friend requests
   * @returns {Promise<Array>} Array of friend requests
   */
  async getIncomingFriendRequests(): Promise<FriendRequest[]> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) return [];

      const requestsRef = collection(db, 'friendRequests');
      const q = query(
        requestsRef,
        where('receiverId', '==', currentUser.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FriendRequest[];

      console.log(`✅ Found ${requests.length} incoming friend requests`);

      // Validate the friend requests array before returning
      try {
        const validatedRequests = validateFriendRequestArray(requests);
        return validatedRequests;
      } catch (validationError) {
        console.warn('⚠️ Friend request data validation failed:', validationError);
        // Filter out invalid requests and return valid ones
        const validRequests = requests.filter(request => {
          const result = safeParseFriendRequest(request);
          return result.success;
        });
        console.log(
          `✅ Returning ${validRequests.length} valid requests (filtered from ${requests.length})`
        );
        return validRequests;
      }
    } catch (error) {
      console.error('❌ Failed to get friend requests:', error);
      throw error;
    }
  }

  /**
   * Get friendship status with another user
   * @param {string} userId - Other user's ID
   * @returns {Promise<Object>} Friendship status
   */
  async getFriendshipStatus(userId: string): Promise<FriendshipStatus> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) {
        return { status: 'none' };
      }

      if (userId === currentUser.uid) {
        return { status: 'self' };
      }

      // Check for existing friendship
      const friendshipId1 = `${currentUser.uid}_${userId}`;
      const friendshipId2 = `${userId}_${currentUser.uid}`;

      const [friendship1, friendship2] = await Promise.all([
        getDoc(doc(db, 'friendships', friendshipId1)),
        getDoc(doc(db, 'friendships', friendshipId2)),
      ]);

      if (friendship1.exists() || friendship2.exists()) {
        const friendshipData = friendship1.exists() ? friendship1.data() : friendship2.data();
        return {
          status: 'friends',
          since: friendshipData?.createdAt,
        };
      }

      // Check for pending friend requests
      const requestsRef = collection(db, 'friendRequests');
      const [outgoingQuery, incomingQuery] = await Promise.all([
        getDocs(
          query(
            requestsRef,
            where('senderId', '==', currentUser.uid),
            where('receiverId', '==', userId),
            where('status', '==', 'pending')
          )
        ),
        getDocs(
          query(
            requestsRef,
            where('senderId', '==', userId),
            where('receiverId', '==', currentUser.uid),
            where('status', '==', 'pending')
          )
        ),
      ]);

      if (!outgoingQuery.empty) {
        return {
          status: 'request_sent',
          requestId: outgoingQuery.docs[0].id,
        };
      }

      if (!incomingQuery.empty) {
        return {
          status: 'request_received',
          requestId: incomingQuery.docs[0].id,
        };
      }

      return { status: 'none' };
    } catch (error) {
      console.error('❌ Failed to get friendship status:', error);
      return { status: 'error' };
    }
  }

  // ============ PLAYER DISCOVERY ============

  /**
   * Get player recommendations using Cloud Function
   * @param {Object} options - Recommendation options
   * @returns {Promise<Array>} Array of recommended players
   */
  async getPlayerRecommendations(
    options: RecommendationOptions = {}
  ): Promise<PlayerRecommendation[]> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      console.log('🔍 Requesting player recommendations...');

      const result = await this.recommendPlayersFunction({
        maxDistance: options.maxDistance || 50,
        skillLevelRange: options.skillLevelRange,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;
      if (data.success) {
        console.log(`✅ Received ${data.recommendations.length} recommendations`);
        return data.recommendations;
      } else {
        throw new Error('Failed to get recommendations from server');
      }
    } catch (error) {
      console.error('❌ Failed to get player recommendations:', error);
      throw error;
    }
  }

  /**
   * Search players by criteria
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Array of matching players
   */
  async searchPlayers(filters: PlayerSearchFilters = {}): Promise<PlayerSearchResult[]> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      const usersRef = collection(db, 'users');
      // CONSTITUTIONAL AMENDMENT: Query the TRUE KING field (root-level)
      let q = query(usersRef, where('isOnboardingComplete', '==', true), limit(20));

      // Apply filters
      if (filters.skillLevel) {
        q = query(q, where('profile.skillLevel', '==', filters.skillLevel));
      }

      if (filters.language) {
        q = query(q, where('profile.preferredLanguage', '==', filters.language));
      }

      const snapshot = await getDocs(q);
      const players = snapshot.docs
        .filter(doc => doc.id !== currentUser.uid) // Exclude current user
        .map(doc => ({
          userId: doc.id,
          ...doc.data(),
        })) as PlayerSearchResult[];

      console.log(`✅ Found ${players.length} matching players`);
      return players;
    } catch (error) {
      console.error('❌ Failed to search players:', error);
      throw error;
    }
  }

  // ============ ACTIVITY FEED ============

  /**
   * Get user's activity feed
   * @param {number} limitCount - Number of items to fetch
   * @returns {Promise<Array>} Array of activity feed items
   */
  async getActivityFeed(limitCount: number = 20): Promise<ActivityFeedItem[]> {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) return [];

      const feedRef = collection(db, 'activityFeed', currentUser.uid, 'items');
      const q = query(feedRef, orderBy('timestamp', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      const feedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityFeedItem[];

      console.log(`✅ Retrieved ${feedItems.length} activity feed items`);
      return feedItems;
    } catch (error) {
      console.error('❌ Failed to get activity feed:', error);
      throw error;
    }
  }

  /**
   * Create activity feed item for friends
   * @param {Object} activityData - Activity data
   * @returns {Promise} Creation promise
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createFriendActivity(activityData: any) {
    try {
      const currentUser = authService.getCurrentUser() as User | null;
      if (!currentUser) throw new Error('User must be authenticated');

      // Get user's friends list
      const friends = await this.getFriends();
      const friendIds = friends.map(friend => friend.userId);

      if (friendIds.length === 0) {
        console.log('No friends to notify');
        return;
      }

      // Create activity feed items for all friends
      const result = await this.createActivityFeedItemFunction({
        type: activityData.type,
        targetUserIds: friendIds,
        title: activityData.title,
        description: activityData.description,
        metadata: activityData.metadata,
      });

      console.log(`✅ Created activity for ${friendIds.length} friends`);
      return result.data;
    } catch (error) {
      console.error('❌ Failed to create friend activity:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Create notification for user
   * @param {string} userId - Target user ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise} Notification creation promise
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createNotification(userId: string, notificationData: any) {
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      await addDoc(notificationsRef, {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
      });

      console.log('✅ Notification created');
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }

  /**
   * Subscribe to friend requests
   * @param {Function} callback - Callback for updates
   * @returns {Function} Unsubscribe function
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeFriendRequests(callback: (requests: any[]) => void) {
    const currentUser = authService.getCurrentUser() as User | null;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, snapshot => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(requests);
    });
  }

  /**
   * Subscribe to activity feed
   * @param {Function} callback - Callback for updates
   * @returns {Function} Unsubscribe function
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeActivityFeed(callback: (feedItems: any[]) => void) {
    const currentUser = authService.getCurrentUser() as User | null;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    const feedRef = collection(db, 'activityFeed', currentUser.uid, 'items');
    const q = query(feedRef, orderBy('timestamp', 'desc'), limit(50));

    return onSnapshot(q, snapshot => {
      const feedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(feedItems);
    });
  }
}

// Create singleton instance
const socialService = new SocialService();

export default socialService;
