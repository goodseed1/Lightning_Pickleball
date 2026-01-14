/**
 * Feed System Type Definitions
 * Lightning Pickleball Social Feed Feature
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

// ============ MAIN FEED ITEM INTERFACE ============

export interface FeedItem {
  id: string; // Firestore document ID
  userId: string; // User who performed the action
  activityType: FeedActivityType; // Type of activity
  timestamp: FirebaseTimestamp; // When the activity occurred
  visibility: FeedVisibility; // Who can see this activity

  // Activity-specific data
  data: FeedItemData;

  // Engagement metrics
  engagement: FeedEngagement;

  // Metadata
  metadata: FeedMetadata;

  // Technical fields
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  isDeleted: boolean; // Soft delete flag

  // 🤖 IRON MAN: Display names for team invite activities
  actorName?: string; // Display name of the actor (who performed the action)
  targetName?: string; // Display name of the target (who the action was performed on)
  clubId?: string; // Club ID for club-specific activities
  isActive?: boolean; // Activity is active and should be shown
}

// ============ FEED ACTIVITY TYPES ============

export type FeedActivityType =
  | 'match_completed' // 경기 완료
  | 'match_victory' // 경기 승리
  | 'friend_added' // 친구 추가
  | 'achievement_unlocked' // 업적 달성
  | 'club_joined' // 클럽 가입
  | 'event_created' // 이벤트 생성
  | 'event_joined' // 이벤트 참여
  | 'skill_improved' // 실력 향상
  | 'streak_milestone' // 연승 기록
  | 'tournament_participation' // 토너먼트 참가
  | 'elo_milestone' // ELO 랭킹 마일스톤
  | 'profile_updated' // 프로필 업데이트
  | 'photo_shared' // 사진 공유
  | 'club_team_invite_pending' // 🔨 THOR: 클럽 토너먼트 팀 초대 (보류중)
  | 'club_team_invite_accepted' // 🔨 THOR: 클럽 토너먼트 팀 초대 수락
  | 'club_team_invite_rejected' // 🔨 THOR: 클럽 토너먼트 팀 초대 거절
  | 'club_team_invite_expired'; // 🔨 THOR: 클럽 토너먼트 팀 초대 만료

export type FeedVisibility = 'public' | 'friends' | 'private';

// ============ FEED DATA STRUCTURES ============

export type FeedItemData =
  | MatchCompletedData
  | MatchVictoryData
  | FriendAddedData
  | AchievementData
  | ClubJoinedData
  | EventCreatedData
  | EventJoinedData
  | SkillImprovedData
  | StreakMilestoneData
  | TournamentParticipationData
  | EloMilestoneData
  | ProfileUpdatedData
  | PhotoSharedData;

// Match-related data
export interface MatchCompletedData {
  matchId: string;
  opponent: PlayerSummary;
  result: MatchResult;
  score?: string;
  eloChange?: number;
  skillLevel: string;
  courtLocation: string;
  matchType: 'singles' | 'doubles';
  duration?: number; // in minutes
  isRanked: boolean;
}

export interface MatchVictoryData extends MatchCompletedData {
  victoryType: 'regular' | 'upset' | 'dominant'; // Type of victory
  streakCount?: number; // If part of a winning streak
}

// Social-related data
export interface FriendAddedData {
  friendId: string;
  friendNickname: string;
  friendProfileImage?: string;
  connectionType: 'mutual_friends' | 'match_opponent' | 'club_member' | 'discovery';
  mutualFriends?: number;
  skillCompatibility?: number; // 0-100 skill match percentage
}

export interface ClubJoinedData {
  clubId: string;
  clubName: string;
  clubLogo?: string;
  memberCount: number;
  clubType: string;
  joinedAs: 'member' | 'manager' | 'admin';
}

// Event-related data
export interface EventCreatedData {
  eventId: string;
  eventTitle: string;
  eventType: 'match' | 'meetup' | 'tournament' | 'practice';
  eventDate: FirebaseTimestamp;
  location: string;
  maxParticipants?: number;
  skillLevelRequired?: string;
  description?: string;
}

export interface EventJoinedData {
  eventId: string;
  eventTitle: string;
  eventType: 'match' | 'meetup' | 'tournament' | 'practice';
  eventDate: FirebaseTimestamp;
  location: string;
  hostName: string;
  hostId: string;
  participantCount: number;
}

// Achievement and progress data
export interface AchievementData {
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  achievementIcon: string;
  tier: AchievementTier;
  category: AchievementCategory;
  pointsAwarded?: number;
  rarity?: number; // Percentage of users who have this achievement
}

export interface SkillImprovedData {
  previousSkillLevel: string;
  newSkillLevel: string;
  skillCategory: 'ntrp_rating' | 'elo_rating' | 'forehand' | 'backhand' | 'serve' | 'volley';
  improvementAmount: number;
  progressDescription: string;
  timeToImprove?: number; // Days taken to improve
}

export interface StreakMilestoneData {
  streakType: 'win' | 'play' | 'social'; // Type of streak
  streakCount: number;
  milestoneLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  previousBest?: number;
  startDate: FirebaseTimestamp;
}

export interface EloMilestoneData {
  currentElo: number;
  previousElo: number;
  milestoneType: 'tier_promotion' | 'round_number' | 'percentile';
  newTier?: string;
  percentileRank?: number;
}

export interface TournamentParticipationData {
  tournamentId: string;
  tournamentName: string;
  participationType: 'player' | 'organizer' | 'volunteer';
  tournamentDate: FirebaseTimestamp;
  location: string;
  participantCount: number;
  skillDivision?: string;
}

export interface ProfileUpdatedData {
  updatedFields: string[];
  updateType: 'photo' | 'info' | 'skills' | 'preferences';
  significantChange: boolean; // Major update vs minor edit
}

export interface PhotoSharedData {
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  location?: string;
  taggedUsers?: PlayerSummary[];
  matchId?: string; // If photo is from a specific match
  eventId?: string; // If photo is from an event
  photoType: 'match' | 'training' | 'social' | 'achievement' | 'general';
}

// ============ SUPPORTING INTERFACES ============

export interface PlayerSummary {
  userId: string;
  nickname: string;
  profileImage?: string;
  skillLevel?: string;
  eloRating?: number;
}

export interface FeedEngagement {
  likes: string[]; // Array of user IDs who liked
  comments: FeedComment[]; // Array of comments
  likeCount: number; // Denormalized like count
  commentCount: number; // Denormalized comment count
  shares?: number; // Share count (future feature)
  lastEngagementAt?: FirebaseTimestamp;
}

export interface FeedComment {
  id: string;
  userId: string;
  userNickname: string;
  userProfileImage?: string;
  content: string;
  timestamp: FirebaseTimestamp;
  likes?: string[]; // Users who liked this comment
  likeCount?: number;
  isDeleted: boolean;
  parentCommentId?: string; // For nested replies
}

export interface FeedMetadata {
  location?: string; // Location where activity occurred
  relatedUsers?: string[]; // Other users involved (opponents, friends, etc.)
  tags?: string[]; // Hashtags or categories
  media?: MediaAttachment[]; // Photos/videos
  priority?: FeedPriority; // Algorithm priority for feed ranking
  originalLanguage?: 'ko' | 'en'; // Language of original content
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: FirebaseTimestamp;
  dimensions?: {
    width: number;
    height: number;
  };
  size?: number; // File size in bytes
}

// ============ ENUMS AND CONSTANTS ============

export type MatchResult = 'win' | 'loss' | 'draw';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AchievementCategory =
  | 'competitive' // Match wins, streaks
  | 'social' // Friends, events
  | 'skill' // Improvements, ratings
  | 'participation' // Events, activities
  | 'milestone' // Time-based achievements
  | 'special'; // Rare/seasonal achievements

export type FeedPriority = 'high' | 'medium' | 'low';

// ============ FEED QUERY INTERFACES ============

export interface FeedQuery {
  userId?: string; // For user-specific feeds
  activityTypes?: FeedActivityType[]; // Filter by activity types
  visibility?: FeedVisibility[];
  startAfter?: FirebaseTimestamp;
  limit?: number;
  includeRelatedUsers?: string[]; // Include activities from specific users
  excludeUsers?: string[]; // Exclude activities from specific users
  location?: string; // Location-based filtering
  tags?: string[]; // Tag-based filtering
}

export interface FeedStats {
  totalItems: number;
  itemsByType: Record<FeedActivityType, number>;
  engagementRate: number; // Average engagement per post
  mostActiveUsers: string[]; // Most active users in feed
  trendingTags: string[]; // Trending hashtags/topics
  lastUpdated: FirebaseTimestamp;
}

// ============ FEED CREATION HELPERS ============

export interface CreateFeedItemRequest {
  userId: string;
  activityType: FeedActivityType;
  data: FeedItemData;
  visibility?: FeedVisibility;
  metadata?: Partial<FeedMetadata>;
  priority?: FeedPriority;
}

// ============ FEED UI INTERFACES ============

export interface FeedItemDisplayData {
  id: string;
  user: PlayerSummary;
  activityType: FeedActivityType;
  activityText: string; // Formatted activity description
  timestamp: Date;
  timeAgo: string; // "2 hours ago", "yesterday"
  data: FeedItemData;
  engagement: FeedEngagement;
  canLike: boolean;
  canComment: boolean;
  canShare: boolean;
  isLiked: boolean; // Whether current user liked
  displayPriority: number; // For feed ordering
}

export interface FeedFilterOptions {
  activityTypes: FeedActivityType[];
  timeRange: 'today' | 'week' | 'month' | 'all';
  users: 'all' | 'friends' | 'following';
  location?: string;
  tags?: string[];
}

// ============ CONSTANTS ============

export const FEED_ACTIVITY_LABELS = {
  ko: {
    match_completed: '경기를 완료했습니다',
    match_victory: '경기에서 승리했습니다',
    friend_added: '새로운 친구를 추가했습니다',
    achievement_unlocked: '새로운 업적을 달성했습니다',
    club_joined: '클럽에 가입했습니다',
    event_created: '새로운 이벤트를 만들었습니다',
    event_joined: '이벤트에 참여했습니다',
    skill_improved: '실력이 향상되었습니다',
    streak_milestone: '연속 기록을 달성했습니다',
    tournament_participation: '토너먼트에 참가했습니다',
    elo_milestone: 'ELO 랭킹 마일스톤을 달성했습니다',
    profile_updated: '프로필을 업데이트했습니다',
    photo_shared: '새로운 사진을 공유했습니다',
    club_team_invite_pending: '님을 토너먼트 파트너로 초대했습니다',
    club_team_invite_accepted: '님의 팀 초대를 수락했습니다',
    club_team_invite_rejected: '님의 팀 초대를 거절했습니다',
    club_team_invite_expired: '님과의 팀 초대가 만료되었습니다',
  },
  en: {
    match_completed: 'completed a match',
    match_victory: 'won a match',
    friend_added: 'added a new friend',
    achievement_unlocked: 'unlocked an achievement',
    club_joined: 'joined a club',
    event_created: 'created a new event',
    event_joined: 'joined an event',
    skill_improved: 'improved their skills',
    streak_milestone: 'reached a streak milestone',
    tournament_participation: 'participated in a tournament',
    elo_milestone: 'reached an ELO milestone',
    profile_updated: 'updated their profile',
    photo_shared: 'shared a new photo',
    club_team_invite_pending: 'invited as tournament partner',
    club_team_invite_accepted: 'accepted team invitation from',
    club_team_invite_rejected: 'declined team invitation from',
    club_team_invite_expired: 'team invitation expired with',
  },
} as const;

export const FEED_PRIORITIES: Record<FeedActivityType, FeedPriority> = {
  match_victory: 'high',
  achievement_unlocked: 'high',
  streak_milestone: 'high',
  tournament_participation: 'high',
  club_team_invite_pending: 'high', // 🔨 THOR: Team invites are high priority (action required)
  club_team_invite_accepted: 'high', // 🔨 THOR: Acceptance is important news
  match_completed: 'medium',
  friend_added: 'medium',
  club_joined: 'medium',
  event_created: 'medium',
  skill_improved: 'medium',
  elo_milestone: 'medium',
  club_team_invite_rejected: 'medium', // 🔨 THOR: Rejection is medium priority
  event_joined: 'low',
  profile_updated: 'low',
  photo_shared: 'low',
  club_team_invite_expired: 'low', // 🔨 THOR: Expiration is low priority (already too late)
};

// ============ FEED TRIGGER EVENTS ============

export const FEED_TRIGGER_EVENTS = {
  // Match-related triggers
  MATCH_COMPLETED: 'onMatchComplete',
  MATCH_VICTORY: 'onMatchWin',
  STREAK_MILESTONE: 'onStreakReached',
  ELO_MILESTONE: 'onEloMilestone',

  // Social-related triggers
  FRIEND_ADDED: 'onFriendshipCreated',
  CLUB_JOINED: 'onClubMembershipCreated',
  EVENT_CREATED: 'onEventCreated',
  EVENT_JOINED: 'onEventJoined',

  // Achievement-related triggers
  ACHIEVEMENT_UNLOCKED: 'onAchievementUnlocked',
  SKILL_IMPROVED: 'onSkillLevelChanged',
  PROFILE_UPDATED: 'onProfileUpdated',

  // Media-related triggers
  PHOTO_SHARED: 'onPhotoUploaded',
} as const;
