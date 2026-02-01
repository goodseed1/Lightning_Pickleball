/**
 * 🏰 [Operation Unification II] - Single Source of Truth for Firestore Collection Names
 *
 * This file centralizes ALL Firestore collection names used across client and server.
 * It eliminates hardcoded strings and prevents collection name mismatches that cause
 * "document not found" errors between client and server code.
 *
 * Usage:
 * - Client: import { COLLECTIONS } from '../../constants/collections';
 * - Server: import { COLLECTIONS } from '../../../src/constants/collections';
 *
 * Before: collection(db, 'club_join_requests')
 * After:  collection(db, COLLECTIONS.CLUB_JOIN_REQUESTS)
 */

export const COLLECTIONS = {
  // ===== CLUB MANAGEMENT =====
  PICKLEBALL_CLUBS: 'pickleball_clubs',
  CLUB_MEMBERS: 'clubMembers',
  CLUB_JOIN_REQUESTS: 'club_join_requests', // ← Ghost Hunter's Target: The ONE TRUE NAME
  CLUB_INVITATIONS: 'clubInvitations',
  CLUB_EVENTS: 'clubEvents',
  CLUB_SCHEDULES: 'clubSchedules',
  CLUB_CHATS: 'club_chats',
  CLUB_ACTIVITY_LOGS: 'club_activity_logs',

  // ===== CLUB COMMUNICATION =====
  CLUB_POSTS: 'club_posts',
  CLUB_POST_COMMENTS: 'club_post_comments',
  CLUB_CHAT_ROOMS: 'club_chats', // Same as CLUB_CHATS but semantically different

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

  // ===== BUSINESS & PARTNERSHIPS =====
  BUSINESSES: 'businesses',
  PARTNERSHIPS: 'partnerships',
  BOOKINGS: 'bookings',

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

  // ===== FINANCIAL =====
  FEE_PAYMENTS: 'fee_payments',
  CLUB_DUES_SETTINGS: 'club_dues_settings',
  CLUB_DUES_STATUS: 'club_dues_status',
  CLUB_MEMBERSHIPS: 'club_memberships',

  // ===== COMMUNICATION & NOTIFICATIONS =====
  ACTIVITY_NOTIFICATIONS: 'activity_notifications',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  USER_FCM_TOKENS: 'user_fcm_tokens',

  // ===== CONTENT & DISCOVERY =====
  FEED_ITEMS: 'feed',
  ACTIVITY_FEED: 'activityFeed',
  SOCIAL_FEED: 'social_feed',
  FEED: 'feed',
  KNOWLEDGE_BASE: 'knowledge_base',

  // ===== COACH & LESSONS =====
  COACH_LESSONS: 'coach_lessons',

  // ===== PICKLEBALL SERVICES (중고거래, 패들 판매/대여 등) =====
  PICKLEBALL_SERVICES: 'pickleball_services',

  // ===== SYSTEM & LOGS =====
  SYSTEM_LOGS: 'systemLogs',
  FUNCTION_LOGS: 'functionLogs',

  // ===== SUBCOLLECTIONS (for reference) =====
  // These are used as subcollection paths
  SUBCOLLECTIONS: {
    MESSAGES: 'messages',
    ITEMS: 'items',
    NOTIFICATIONS: 'notifications',
    CLUB_MEMBERSHIPS: 'clubMemberships',
    MATCH_HISTORY: 'match_history',
    EXECUTIONS: 'executions',
  },
} as const;

// Type helper for TypeScript autocomplete and validation
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
export type SubcollectionName =
  (typeof COLLECTIONS.SUBCOLLECTIONS)[keyof typeof COLLECTIONS.SUBCOLLECTIONS];

/**
 * 🕵️ [Ghost Hunter's Note]
 * The infamous 'clubJoinRequests' vs 'club_join_requests' mismatch has been
 * resolved by establishing COLLECTIONS.CLUB_JOIN_REQUESTS as the single truth.
 *
 * All client and server code MUST use this constant to prevent phantom errors.
 */
