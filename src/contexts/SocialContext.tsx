/**
 * Social Context for Lightning Pickleball
 * Provides social network state and methods throughout the app
 */

/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socialService from '../services/socialService';
import { useAuth } from './AuthContext';
import i18n from '../i18n';
import {
  Friend,
  FriendRequest,
  PlayerRecommendation,
  ActivityFeedItem,
  FriendshipStatus,
  PlayerSearchFilters,
  PlayerSearchResult,
  RecommendationOptions,
  FriendActivityData,
} from '../types/social';

interface SocialContextType {
  // State
  friends: Friend[];
  friendRequests: FriendRequest[];
  playerRecommendations: PlayerRecommendation[];
  activityFeed: ActivityFeedItem[];
  loading: boolean;
  error: string | null;

  // Friend System
  sendFriendRequest: (userId: string, message?: string) => Promise<string>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  getFriendshipStatus: (userId: string) => Promise<FriendshipStatus>;

  // Player Discovery
  getPlayerRecommendations: (options?: RecommendationOptions) => Promise<PlayerRecommendation[]>;
  searchPlayers: (filters?: PlayerSearchFilters) => Promise<PlayerSearchResult[]>;

  // Activity Feed
  refreshActivityFeed: () => Promise<void>;
  createFriendActivity: (activityData: FriendActivityData) => Promise<void>;

  // Utility
  refreshFriends: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

interface SocialProviderProps {
  children: React.ReactNode;
}

export const SocialProvider: React.FC<SocialProviderProps> = ({ children }) => {
  // State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [playerRecommendations, setPlayerRecommendations] = useState<PlayerRecommendation[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser, isAuthenticated } = useAuth();

  // ============ UTILITY FUNCTIONS ============

  /**
   * Refresh friends list
   */
  const refreshFriends = useCallback(async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;

      const friendsList = await socialService.getFriends();
      setFriends(friendsList);

      console.log(`✅ Refreshed friends list: ${friendsList.length} friends`);
    } catch (error: unknown) {
      console.error('❌ Failed to refresh friends:', error);
      setError(i18n.t('contexts.social.failedToRefreshFriends'));
    }
  }, [isAuthenticated]);

  // Real-time subscriptions
  useEffect(() => {
    let unsubscribeFriendRequests: (() => void) | null = null;
    let unsubscribeActivityFeed: (() => void) | null = null;

    if (isAuthenticated) {
      console.log('👥 Setting up social context subscriptions...');

      // Subscribe to friend requests
      unsubscribeFriendRequests = socialService.subscribeFriendRequests(requests => {
        setFriendRequests(requests);
        console.log(`👥 Received ${requests.length} friend requests`);
      });

      // Subscribe to activity feed
      unsubscribeActivityFeed = socialService.subscribeActivityFeed(feedItems => {
        setActivityFeed(feedItems);
        console.log(`📰 Received ${feedItems.length} activity feed items`);
      });

      // Load initial data
      void refreshFriends();
    } else {
      // Clear data when user is not authenticated
      setFriends([]);
      setFriendRequests([]);
      setActivityFeed([]);
      setPlayerRecommendations([]);
    }

    // Cleanup subscriptions
    return () => {
      if (unsubscribeFriendRequests) unsubscribeFriendRequests();
      if (unsubscribeActivityFeed) unsubscribeActivityFeed();
    };
  }, [currentUser, isAuthenticated, refreshFriends]);

  // ============ FRIEND SYSTEM ============

  /**
   * Send friend request
   */
  const sendFriendRequest = async (userId: string, message?: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const requestId = await socialService.sendFriendRequest(userId, message);

      console.log('✅ Friend request sent successfully');
      return requestId;
    } catch (error: unknown) {
      console.error('❌ Failed to send friend request:', error);
      setError(i18n.t('contexts.social.failedToSendFriendRequest'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Accept friend request
   */
  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await socialService.acceptFriendRequest(requestId);

      // Refresh friends list
      await refreshFriends();

      console.log('✅ Friend request accepted');
    } catch (error: unknown) {
      console.error('❌ Failed to accept friend request:', error);
      setError(i18n.t('contexts.social.failedToAcceptFriendRequest'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Decline friend request
   */
  const declineFriendRequest = async (requestId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await socialService.declineFriendRequest(requestId);

      console.log('✅ Friend request declined');
    } catch (error: unknown) {
      console.error('❌ Failed to decline friend request:', error);
      setError(i18n.t('contexts.social.failedToDeclineFriendRequest'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove friend
   */
  const removeFriend = async (userId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await socialService.removeFriend(userId);

      // Refresh friends list
      await refreshFriends();

      console.log('✅ Friend removed successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to remove friend:', error);
      setError(i18n.t('contexts.social.failedToRemoveFriend'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get friendship status with another user
   */
  const getFriendshipStatus = async (userId: string): Promise<FriendshipStatus> => {
    try {
      return await socialService.getFriendshipStatus(userId);
    } catch (error: unknown) {
      console.error('❌ Failed to get friendship status:', error);
      return { status: 'error' };
    }
  };

  // ============ PLAYER DISCOVERY ============

  /**
   * Get player recommendations
   */
  const getPlayerRecommendations = async (
    options: RecommendationOptions = {}
  ): Promise<PlayerRecommendation[]> => {
    try {
      setLoading(true);
      setError(null);

      const recommendations = await socialService.getPlayerRecommendations(options);
      setPlayerRecommendations(recommendations);

      console.log(`✅ Retrieved ${recommendations.length} player recommendations`);
      return recommendations;
    } catch (error: unknown) {
      console.error('❌ Failed to get player recommendations:', error);
      setError(i18n.t('contexts.social.failedToGetPlayerRecommendations'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search players
   */
  const searchPlayers = async (
    filters: PlayerSearchFilters = {}
  ): Promise<PlayerSearchResult[]> => {
    try {
      setLoading(true);
      setError(null);

      const players = await socialService.searchPlayers(filters);

      console.log(`✅ Found ${players.length} matching players`);
      return players;
    } catch (error: unknown) {
      console.error('❌ Failed to search players:', error);
      setError(i18n.t('contexts.social.failedToSearchPlayers'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ============ ACTIVITY FEED ============

  /**
   * Refresh activity feed
   */
  const refreshActivityFeed = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;

      const feedItems = await socialService.getActivityFeed(20);
      setActivityFeed(feedItems);

      console.log(`✅ Refreshed activity feed: ${feedItems.length} items`);
    } catch (error: unknown) {
      console.error('❌ Failed to refresh activity feed:', error);
      setError(i18n.t('contexts.social.failedToRefreshActivityFeed'));
    }
  };

  /**
   * Create activity for friends
   */
  const createFriendActivity = async (activityData: FriendActivityData): Promise<void> => {
    try {
      await socialService.createFriendActivity(activityData);
      console.log('✅ Friend activity created');
    } catch (error: unknown) {
      console.error('❌ Failed to create friend activity:', error);
      setError(i18n.t('contexts.social.failedToCreateFriendActivity'));
    }
  };

  /**
   * Refresh friend requests
   */
  const refreshFriendRequests = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;

      const requests = await socialService.getIncomingFriendRequests();
      setFriendRequests(requests);

      console.log(`✅ Refreshed friend requests: ${requests.length} requests`);
    } catch (error: unknown) {
      console.error('❌ Failed to refresh friend requests:', error);
      setError(i18n.t('contexts.social.failedToRefreshFriendRequests'));
    }
  };

  // Context value
  const value = {
    // State
    friends,
    friendRequests,
    playerRecommendations,
    activityFeed,
    loading,
    error,

    // Friend System
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendshipStatus,

    // Player Discovery
    getPlayerRecommendations,
    searchPlayers,

    // Activity Feed
    refreshActivityFeed,
    createFriendActivity,

    // Utility
    refreshFriends,
    refreshFriendRequests,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};

export default SocialContext;
