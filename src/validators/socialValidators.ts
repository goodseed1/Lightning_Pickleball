import { z } from 'zod';

// Firebase Timestamp validation
// Note: Using z.any() for toDate function as z.function().returns() is not supported in this Zod version
const FirebaseTimestampSchema = z.union([
  z.date(),
  z.object({
    seconds: z.number(),
    nanoseconds: z.number(),
  }),
  z.object({
    toDate: z.any(), // Firebase Timestamp toDate() method
    seconds: z.number(),
    nanoseconds: z.number(),
  }),
]);

// Friend validation schema
export const FriendSchema = z.object({
  userId: z.string(),
  userInfo: z.object({
    displayName: z.string(),
    nickname: z.string(),
    photoURL: z.string().optional(),
    skillLevel: z.string().optional(),
  }),
  friendshipId: z.string(),
  createdAt: FirebaseTimestampSchema,
});

// Friend Request validation schema
export const FriendRequestSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  senderInfo: z.object({
    displayName: z.string(),
    nickname: z.string(),
    photoURL: z.string().optional(),
    skillLevel: z.string().optional(),
  }),
  message: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'declined']),
  createdAt: FirebaseTimestampSchema,
});

// Player Recommendation validation schema
export const PlayerRecommendationSchema = z.object({
  userId: z.string(),
  profile: z.object({
    nickname: z.string(),
    skillLevel: z.string(),
    location: z.string(),
    activityRegions: z.array(z.string()),
    preferredLanguage: z.string(),
  }),
  compatibility: z.object({
    score: z.number().min(0).max(100),
    distance: z.number().optional(),
    reasons: z.array(z.string()),
  }),
});

// Activity Feed Item validation schema
export const ActivityFeedItemSchema = z.object({
  id: z.string(),
  type: z.enum(['new_member', 'new_event', 'friend_activity', 'club_update', 'match_result']),
  title: z.string(),
  description: z.string(),
  timestamp: FirebaseTimestampSchema,
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// Friendship Status validation schema
export const FriendshipStatusSchema = z.object({
  status: z.enum(['none', 'friends', 'request_sent', 'request_received', 'self', 'error']),
  requestId: z.string().optional(),
  since: FirebaseTimestampSchema.optional(),
});

// Player Search Filters validation schema
export const PlayerSearchFiltersSchema = z.object({
  skillLevel: z.string().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radius: z.number().min(0).max(1000), // max 1000km radius
    })
    .optional(),
  language: z.string().optional(),
  availability: z.array(z.string()).optional(),
  playingStyle: z.array(z.string()).optional(),
});

// Player Search Result validation schema
export const PlayerSearchResultSchema = z.object({
  userId: z.string(),
  profile: z.object({
    displayName: z.string(),
    nickname: z.string(),
    photoURL: z.string().optional(),
    skillLevel: z.string(),
    location: z.string(),
    preferredLanguage: z.string(),
  }),
  distance: z.number().optional(),
  compatibility: z
    .object({
      score: z.number().min(0).max(100),
      reasons: z.array(z.string()),
    })
    .optional(),
});

// Friend Activity Data validation schema
export const FriendActivityDataSchema = z.object({
  type: z.enum(['match_invitation', 'club_invitation', 'event_invitation', 'general_activity']),
  title: z.string(),
  description: z.string(),
  metadata: z
    .object({
      matchId: z.string().optional(),
      clubId: z.string().optional(),
      eventId: z.string().optional(),
    })
    .catchall(z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  targetFriends: z.array(z.string()).optional(),
});

// Validation helper functions
export const validateFriend = (data: unknown) => FriendSchema.parse(data);
export const validateFriendRequest = (data: unknown) => FriendRequestSchema.parse(data);
export const validatePlayerRecommendation = (data: unknown) =>
  PlayerRecommendationSchema.parse(data);
export const validateActivityFeedItem = (data: unknown) => ActivityFeedItemSchema.parse(data);
export const validateFriendshipStatus = (data: unknown) => FriendshipStatusSchema.parse(data);
export const validatePlayerSearchFilters = (data: unknown) => PlayerSearchFiltersSchema.parse(data);
export const validatePlayerSearchResult = (data: unknown) => PlayerSearchResultSchema.parse(data);
export const validateFriendActivityData = (data: unknown) => FriendActivityDataSchema.parse(data);

// Safe validation functions (returns null on validation error)
export const safeParseFriend = (data: unknown) => FriendSchema.safeParse(data);
export const safeParseFriendRequest = (data: unknown) => FriendRequestSchema.safeParse(data);
export const safeParsePlayerRecommendation = (data: unknown) =>
  PlayerRecommendationSchema.safeParse(data);
export const safeParseActivityFeedItem = (data: unknown) => ActivityFeedItemSchema.safeParse(data);
export const safeParseFriendshipStatus = (data: unknown) => FriendshipStatusSchema.safeParse(data);

// Array validation functions
export const validateFriendArray = (data: unknown) => z.array(FriendSchema).parse(data);
export const validateFriendRequestArray = (data: unknown) =>
  z.array(FriendRequestSchema).parse(data);
export const validatePlayerRecommendationArray = (data: unknown) =>
  z.array(PlayerRecommendationSchema).parse(data);
export const validateActivityFeedArray = (data: unknown) =>
  z.array(ActivityFeedItemSchema).parse(data);
