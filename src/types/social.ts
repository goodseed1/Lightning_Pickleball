import { Timestamp } from 'firebase/firestore';

// Firebase Timestamp helper type
export type FirebaseTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number };

// Social Context Types
export interface Friend {
  userId: string;
  userInfo: {
    displayName: string;
    nickname: string;
    photoURL?: string;
    skillLevel?: string;
  };
  friendshipId: string;
  createdAt: FirebaseTimestamp;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderInfo: {
    displayName: string;
    nickname: string;
    photoURL?: string;
    skillLevel?: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: FirebaseTimestamp;
}

export interface PlayerRecommendation {
  userId: string;
  profile: {
    nickname: string;
    skillLevel: string;
    location: string;
    activityRegions: string[];
    preferredLanguage: string;
  };
  compatibility: {
    score: number;
    distance?: number;
    reasons: string[];
  };
}

export interface ActivityFeedItem {
  id: string;
  type: 'new_member' | 'new_event' | 'friend_activity' | 'club_update' | 'match_result';
  title: string;
  description: string;
  timestamp: FirebaseTimestamp;
  metadata?: Record<string, string | number | boolean>;
}

export interface FriendshipStatus {
  status: 'none' | 'friends' | 'request_sent' | 'request_received' | 'self' | 'error';
  requestId?: string;
  since?: FirebaseTimestamp;
}

// Search and Discovery Types
export interface PlayerSearchFilters {
  skillLevel?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in km
  };
  language?: string;
  availability?: string[];
  playingStyle?: string[];
}

export interface PlayerSearchResult {
  userId: string;
  profile: {
    displayName: string;
    nickname: string;
    photoURL?: string;
    skillLevel: string;
    location: string;
    preferredLanguage: string;
  };
  distance?: number;
  compatibility?: {
    score: number;
    reasons: string[];
  };
}

export interface RecommendationOptions {
  maxDistance?: number; // km
  skillLevelRange?: string[];
  includeLanguageMatch?: boolean;
  excludeUsers?: string[];
  limit?: number;
}

// Activity Creation Types
export interface FriendActivityData {
  type: 'match_invitation' | 'club_invitation' | 'event_invitation' | 'general_activity';
  title: string;
  description: string;
  metadata?: {
    matchId?: string;
    clubId?: string;
    eventId?: string;
    [key: string]: string | number | boolean | undefined;
  };
  targetFriends?: string[]; // Friend user IDs
}

// Error Types
export interface SocialError extends Error {
  code: string;
  context?: Record<string, string | number | boolean>;
}

// API Response Types
export interface SocialAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: SocialError;
  message?: string;
}
