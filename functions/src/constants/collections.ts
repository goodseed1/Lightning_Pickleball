/**
 * 🏰 [Operation Unification II] - Cloud Functions Collection Constants
 *
 * This is a shared copy of the collection constants for Cloud Functions.
 * It ensures client and server use identical collection names.
 *
 * Note: This file should be kept in sync with src/constants/collections.ts
 */

export const COLLECTIONS = {
  // ===== CLUB MANAGEMENT =====
  TENNIS_CLUBS: 'tennis_clubs',
  CLUB_MEMBERS: 'clubMembers',
  CLUB_JOIN_REQUESTS: 'club_join_requests', // ← Ghost Hunter's Target: The ONE TRUE NAME
  CLUB_INVITATIONS: 'clubInvitations',
  CLUB_EVENTS: 'clubEvents',
  CLUB_SCHEDULES: 'clubSchedules',
  CLUB_CHATS: 'club_chats',
  CLUB_ACTIVITY_LOGS: 'clubActivityLogs', // Note: Different from client (no underscore)

  // ===== CLUB COMMUNICATION =====
  CLUB_POSTS: 'club_posts',
  CLUB_POST_COMMENTS: 'club_post_comments',
  CLUB_CHAT_ROOMS: 'club_chats',

  // ===== USER MANAGEMENT =====
  USERS: 'users',

  // ===== SOCIAL FEATURES =====
  FRIENDSHIPS: 'friendships',
  FRIEND_REQUESTS: 'friendRequests',

  // ===== EVENTS & ACTIVITIES =====
  EVENTS: 'events',
  LIGHTNING_MATCHES: 'lightning_matches',
  LIGHTNING_EVENTS: 'lightning_events',
  EVENT_PARTICIPATIONS: 'eventParticipations',
  PARTICIPATION_APPLICATIONS: 'participation_applications',
  EVENT_CHAT_ROOMS: 'event_chat_rooms',

  // ===== TOURNAMENTS & COMPETITIONS =====
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_REGISTRATIONS: 'tournamentRegistrations',
  TOURNAMENT_MATCHES: 'tournamentMatches',
  REGULAR_LEAGUES: 'regular_leagues',
  LEAGUE_MATCHES: 'league_matches',
  REGULAR_MEETUPS: 'regular_meetups',

  // ===== PLAYER STATISTICS =====
  MATCHES: 'matches',
  PLAYER_STATS: 'playerStats',
  HEAD_TO_HEAD_RECORDS: 'headToHeadRecords',

  // ===== COMMUNICATION & NOTIFICATIONS =====
  ACTIVITY_NOTIFICATIONS: 'activity_notifications',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  USER_FCM_TOKENS: 'user_fcm_tokens',

  // ===== CONTENT & DISCOVERY =====
  FEED_ITEMS: 'feed_items',
  ACTIVITY_FEED: 'activityFeed',
  SOCIAL_FEED: 'social_feed',
  FEED: 'feed',

  // ===== SYSTEM & LOGS =====
  SYSTEM_LOGS: 'systemLogs',
  FUNCTION_LOGS: 'functionLogs',

  // ===== SUBCOLLECTIONS =====
  SUBCOLLECTIONS: {
    MESSAGES: 'messages',
    ITEMS: 'items',
    NOTIFICATIONS: 'notifications',
    CLUB_MEMBERSHIPS: 'clubMemberships',
    MATCH_HISTORY: 'match_history',
    EXECUTIONS: 'executions',
  }
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
export type SubcollectionName = typeof COLLECTIONS.SUBCOLLECTIONS[keyof typeof COLLECTIONS.SUBCOLLECTIONS];