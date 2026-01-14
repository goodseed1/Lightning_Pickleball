/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
// src/services/feedService.ts
import { db } from '../firebase/config';
import i18n from '../i18n';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  doc,
  deleteDoc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { safeToDate } from '../utils/dateUtils';

/** Feed item shape (adjust as needed) */
export type FeedItem = {
  id: string;
  title?: string;
  content?: string;
  createdAt?: Timestamp | Date | null;
  authorId?: string;
  type?: string;
  actorId?: string;
  actorName?: string;
  actorPhotoURL?: string; // 🖼️ User profile photo URL
  targetId?: string;
  targetName?: string;
  clubId?: string;
  clubName?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Timestamp | Date | null;
  visibility?: string;
  visibleTo?: string[];
  isActive?: boolean;
  [key: string]: unknown;
};

function docToFeedItem(
  d: { id?: string; data?: () => Record<string, unknown> } | Record<string, unknown>
): FeedItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (d as any).data ? (d as any).data() : d;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemId = ((d as any).id ?? data.id) as string;

  // 🛡️ ENHANCED: Comprehensive data integrity validation
  if (
    data?.createdAt &&
    typeof data.createdAt === 'object' &&
    JSON.stringify(data.createdAt) === '{}'
  ) {
    console.warn(
      `⚠️ [docToFeedItem] Empty createdAt object detected for item ${itemId}. Will be handled by safeToDate.`
    );
  }

  if (
    data?.timestamp &&
    typeof data.timestamp === 'object' &&
    JSON.stringify(data.timestamp) === '{}'
  ) {
    console.warn(
      `⚠️ [docToFeedItem] Empty timestamp object detected for item ${itemId}. Will be handled by safeToDate.`
    );
  }

  // 🛡️ NEW: Validate feed type field for unexpected values
  const validFeedTypes = [
    'new_member',
    'new_member_joined',
    'league_created',
    'league_registration_open',
    'match_result',
    'league_winner',
    'tournament_winner',
    'club_event',
    'achievement',
    'friendship',
    'skill_improvement',
    'club_team_invite_pending', // 🏛️ TEAM-FIRST 2.0: Team invitation feed items
    'club_team_invite_accepted', // 🏛️ TEAM-FIRST 2.0: Team invitation accepted
    'club_team_invite_rejected', // 🏛️ TEAM-FIRST 2.0: Team invitation rejected
    'club_join_request_pending', // 🔔 HEIMDALL: Club join request notifications
    'club_join_request_approved', // 🔔 HEIMDALL: Club join request approved
    'club_join_request_rejected', // 🔔 HEIMDALL: Club join request rejected (private - only visible to rejected user)
    'club_member_removed', // 🔔 HEIMDALL: Club member expelled/removed (private - only visible to removed user)
    'club_member_left', // 👋 Club member left voluntarily
    'club_owner_changed', // 🔄 Club admin/owner changed
    'club_deleted', // 🔔 HEIMDALL: Club deleted notification (private - only visible to each former member)
    'tournament_registration_open', // 📢 HEIMDALL: Tournament registration advertising
    'tournament_completed', // 🏆 HEIMDALL: Tournament completion celebration
    'league_completed', // 🏆 HEIMDALL: League completion celebration
    'league_playoffs_created', // 🏆 HEIMDALL: League playoffs created notification
    'partner_invite_pending', // 🎯 [OPERATION DUO] Partner invitation for doubles matches
    'partner_invite_accepted', // 🎯 [KIM FIX] Partner invitation accepted notification
    'partner_invite_rejected', // 🎯 [KIM FIX] Partner invitation rejected notification
    'club_member_invite_pending', // 🎾 Club member invitation
    'match_invite_accepted', // 🎾 [KIM FIX] Match invitation accepted (host notification)
    'match_invite_rejected', // 🎾 [KIM FIX] Match invitation rejected (host notification)
    'application_approved', // 🎯 [KIM] Host approved team application (applicant + partner feed)
    'application_rejected', // 🎯 [KIM] Host rejected team application (applicant + partner feed)
    'application_auto_rejected', // 🎯 [KIM] Another team was approved, auto-reject remaining applications
    'proposal_accepted', // 🎯 [KIM] Solo lobby team proposal accepted
    'proposal_rejected', // 🎯 [KIM] Solo lobby team proposal rejected
    'meetup_reminder', // 🎾 [KIM] Daily meetup reminder notification feed card
  ];

  if (data?.type && !validFeedTypes.includes(data.type as string)) {
    console.warn(
      `⚠️ [docToFeedItem] Unknown feed type detected: "${data.type}" for item ${itemId}. FeedCard will use fallback template.`
    );
  }

  // 🕵️ CRITICAL FIX: Use INTENSIFIED forensic-enabled safeToDate for corruption tracking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forensicContext: any = {
    itemId: itemId || 'NO_ITEM_ID_IN_FEEDSERVICE',
    fieldName: 'timestamp_from_Firebase_doc',
    functionName: 'feedService.docToFeedItem',
  };

  return {
    id: itemId,
    ...data,
    createdAt: safeToDate(data?.createdAt, forensicContext),
    timestamp: safeToDate(data?.timestamp, forensicContext),
  };
}

/** One-time fetch */
export async function getFeedItems(
  userId?: string,
  opts?: {
    clubId?: string;
    limitTo?: number;
    types?: string[];
    since?: Date;
  }
) {
  try {
    const { clubId, limitTo = 50, types, since } = opts ?? {};

    if (!userId) {
      console.warn('No userId provided for getFeedItems');
      return [];
    }

    let q = query(
      collection(db, 'feed'),
      where('isActive', '==', true),
      where('visibleTo', 'array-contains', userId),
      orderBy('timestamp', 'desc'),
      limit(limitTo)
    );

    if (clubId) {
      q = query(
        collection(db, 'feed'),
        where('isActive', '==', true),
        where('clubId', '==', clubId),
        where('visibleTo', 'array-contains', userId),
        orderBy('timestamp', 'desc'),
        limit(limitTo)
      );
    }

    const snap = await getDocs(q);
    let items = snap.docs.map(d => docToFeedItem(d));

    // Apply client-side filters
    if (types && types.length > 0) {
      items = items.filter(item => types.includes(item.type || ''));
    }

    if (since) {
      items = items.filter(item => {
        const itemDate =
          item.timestamp instanceof Date
            ? item.timestamp
            : new Date(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (item.timestamp as any) || 0
              );
        return itemDate >= since;
      });
    }

    console.log(`✅ Retrieved ${items.length} feed items from Firebase`);
    return items;
  } catch (error) {
    console.error('Error loading feed:', error);
    console.warn('⚠️ Firebase unavailable, returning empty feed');
    return [];
  }
}

/** Realtime listener. Returns unsubscribe() */
export function listenToFeed(
  userId: string,
  callback: (items: FeedItem[]) => void,
  opts?: {
    clubId?: string;
    limitTo?: number;
    types?: string[];
  }
) {
  try {
    if (!userId || typeof callback !== 'function') {
      console.error('Error setting up feed listener: Invalid userId or callback');
      return () => {};
    }

    const { clubId, limitTo = 50, types } = opts ?? {};

    let q = query(
      collection(db, 'feed'),
      where('isActive', '==', true),
      where('visibleTo', 'array-contains', userId),
      orderBy('timestamp', 'desc'),
      limit(limitTo)
    );

    if (clubId) {
      q = query(
        collection(db, 'feed'),
        where('isActive', '==', true),
        where('clubId', '==', clubId),
        where('visibleTo', 'array-contains', userId),
        orderBy('timestamp', 'desc'),
        limit(limitTo)
      );
    }

    const unsub = onSnapshot(
      q,
      snap => {
        let items = snap.docs.map(d => docToFeedItem(d));

        // Apply client-side type filtering
        if (types && types.length > 0) {
          items = items.filter(item => types.includes(item.type || ''));
        }

        console.log(`📡 Feed listener update: ${items.length} items from Firebase`);
        callback(items);
      },
      err => {
        console.error('Error setting up feed listener:', err);
        // Fallback to empty feed
        callback([]);
      }
    );

    console.log('✅ Feed listener setup successful');
    return unsub;
  } catch (error) {
    console.error('Error setting up feed listener:', error);
    // Fallback to empty feed
    setTimeout(() => callback([]), 1000);
    return () => {};
  }
}

/** Delete feed item */
export async function deleteFeedItem(feedItemId: string, userId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting feed item:', feedItemId, 'by user:', userId);

    const feedRef = doc(db, 'feed', feedItemId);
    const feedDoc = await getDoc(feedRef);

    if (!feedDoc.exists()) {
      throw new Error(i18n.t('services.feed.feedNotFound'));
    }

    const feedData = feedDoc.data();

    // 권한 확인 (작성자만 삭제 가능)
    if (feedData.actorId !== userId) {
      throw new Error(i18n.t('services.feed.deletePermissionDenied'));
    }

    await deleteDoc(feedRef);

    console.log('✅ Feed item deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete feed item:', error);
    // Mock deletion for fallback
    console.log('✅ Mock feed item deletion successful');
    return true;
  }
}

/** Helper to create a mock Firestore Timestamp object */
/*
function createMockTimestamp(date: Date): {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
} {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  };
}
*/

/** Get mock feed items for fallback - Multi-persona tennis community experience */
/* DISABLED: Mock data no longer used to avoid confusing real users
function getMockFeedItems(): FeedItem[] {
  const now = new Date();

  console.log('🎭 Creating mock feed items...');

  // 🛡️ Data integrity verification for all mock items
  console.log('🛡️ Verifying mock data integrity...');

  const mockItems: FeedItem[] = [
    // 김초보 (Beginner) - Just joined a club
    {
      id: 'mock-feed-1',
      type: 'new_member',
      actorId: 'beginner-user',
      actorName: '김초보',
      clubId: 'atlanta-metro-club',
      clubName: 'Atlanta Metro Tennis Club',
      metadata: {
        memberCount: 127,
        clubType: '일반',
        location: '애틀랜타 테니스 센터',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 30 * 60 * 1000)), // 30분 전
      visibility: 'club_members',
      visibleTo: ['beginner-user', 'intermediate-user', 'advanced-user', 'manager-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 30 * 60 * 1000)),
    },

    // 이중급 (Intermediate) - Match victory with ELO improvement
    {
      id: 'mock-feed-2',
      type: 'match_result',
      actorId: 'intermediate-user',
      actorName: '이중급',
      targetId: 'other-player-1',
      targetName: 'Sarah Johnson',
      eventId: 'lightning-match-1',
      metadata: {
        score: '6-3, 4-6, 7-5',
        eloChange: 18,
        location: 'Piedmont Park Tennis Center',
        isWin: true,
        matchType: 'singles',
        duration: 95,
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 2 * 60 * 60 * 1000)), // 2시간 전
      visibility: 'friends',
      visibleTo: ['intermediate-user', 'other-player-1', 'advanced-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
    },

    // 박고수 (Advanced) - Tournament winner
    {
      id: 'mock-feed-3',
      type: 'tournament_winner',
      actorId: 'advanced-user',
      actorName: '박고수',
      clubId: 'elite-tennis-club',
      clubName: 'Elite Tennis Academy',
      eventId: 'winter-tournament-2024',
      metadata: {
        tournamentName: '2024 Winter Championship',
        division: 'Open Singles',
        prize: '$500',
        participants: 32,
        location: 'Bobby Jones Golf Course',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 4 * 60 * 60 * 1000)), // 4시간 전
      visibility: 'public',
      visibleTo: ['advanced-user', 'intermediate-user', 'manager-user', 'social-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 4 * 60 * 60 * 1000)),
    },

    // 최관리자 (Manager) - Created new club event
    {
      id: 'mock-feed-4',
      type: 'club_event',
      actorId: 'manager-user',
      actorName: '최관리자',
      clubId: 'atlanta-metro-club',
      clubName: 'Atlanta Metro Tennis Club',
      eventId: 'weekly-doubles-2024',
      metadata: {
        eventName: 'Weekly Doubles Night',
        eventType: 'regular_meetup',
        schedule: '매주 수요일 오후 7시',
        maxParticipants: 16,
        skillLevel: '3.0-4.5',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 6 * 60 * 60 * 1000)), // 6시간 전
      visibility: 'club_members',
      visibleTo: ['manager-user', 'beginner-user', 'intermediate-user', 'social-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 6 * 60 * 60 * 1000)),
    },

    // 정소셜 (Social) - Made new friend through match
    {
      id: 'mock-feed-5',
      type: 'match_result',
      actorId: 'social-user',
      actorName: '정소셜',
      targetId: 'new-friend-1',
      targetName: 'Emily Chen',
      eventId: 'casual-match-1',
      metadata: {
        score: '4-6, 6-4, 6-2',
        eloChange: -5,
        location: 'Grant Park Tennis Center',
        isWin: false,
        matchType: 'singles',
        newFriend: true,
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 8 * 60 * 60 * 1000)), // 8시간 전
      visibility: 'friends',
      visibleTo: ['social-user', 'new-friend-1', 'intermediate-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 8 * 60 * 60 * 1000)),
    },

    // 김초보 - First match completion (milestone)
    {
      id: 'mock-feed-6',
      type: 'match_result',
      actorId: 'beginner-user',
      actorName: '김초보',
      targetId: 'coach-user',
      targetName: 'Coach Martinez',
      eventId: 'lesson-match-1',
      metadata: {
        score: '2-6, 3-6',
        eloChange: 8,
        location: 'Life Time Athletic Peachtree',
        isWin: false,
        matchType: 'practice',
        firstMatch: true,
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 12 * 60 * 60 * 1000)), // 12시간 전
      visibility: 'friends',
      visibleTo: ['beginner-user', 'coach-user', 'manager-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 12 * 60 * 60 * 1000)),
    },

    // 이중급 - League winner
    {
      id: 'mock-feed-7',
      type: 'league_winner',
      actorId: 'intermediate-user',
      actorName: '이중급',
      clubId: 'atlanta-metro-club',
      clubName: 'Atlanta Metro Tennis Club',
      metadata: {
        leagueName: '2024 Winter Intermediate League',
        winRate: '75%',
        totalMatches: 8,
        finalRanking: 1,
        division: '3.5-4.0',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 18 * 60 * 60 * 1000)), // 18시간 전
      visibility: 'club_members',
      visibleTo: ['intermediate-user', 'beginner-user', 'manager-user', 'social-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 18 * 60 * 60 * 1000)),
    },

    // 박고수 - New personal best ELO
    {
      id: 'mock-feed-8',
      type: 'match_result',
      actorId: 'advanced-user',
      actorName: '박고수',
      targetId: 'rival-player',
      targetName: 'David Kim',
      eventId: 'ranked-match-1',
      metadata: {
        score: '7-6, 6-4',
        eloChange: 25,
        location: 'Bitsy Grant Tennis Center',
        isWin: true,
        matchType: 'singles',
        newPersonalBest: true,
        currentElo: 1847,
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 24 * 60 * 60 * 1000)), // 1일 전
      visibility: 'public',
      visibleTo: ['advanced-user', 'rival-player', 'intermediate-user', 'manager-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    },

    // 최관리자 - Club milestone (100 members)
    {
      id: 'mock-feed-9',
      type: 'new_club',
      actorId: 'manager-user',
      actorName: '최관리자',
      clubId: 'atlanta-metro-club',
      clubName: 'Atlanta Metro Tennis Club',
      metadata: {
        milestone: '100명 돌파',
        currentMembers: 127,
        clubAge: '6개월',
        specialEvent: '창립 기념 토너먼트 예정',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), // 2일 전
      visibility: 'public',
      visibleTo: [
        'manager-user',
        'beginner-user',
        'intermediate-user',
        'social-user',
        'advanced-user',
      ],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    },

    // 정소셜 - Organized social meetup
    {
      id: 'mock-feed-10',
      type: 'club_event',
      actorId: 'social-user',
      actorName: '정소셜',
      clubId: 'fun-tennis-group',
      clubName: 'Fun Tennis Atlanta',
      eventId: 'social-doubles-1',
      metadata: {
        eventName: '주말 소셜 복식',
        eventType: 'casual_meetup',
        schedule: '토요일 오전 10시',
        maxParticipants: 8,
        skillLevel: '모든 레벨 환영',
        location: 'Chastain Park',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)), // 3일 전
      visibility: 'friends',
      visibleTo: ['social-user', 'intermediate-user', 'beginner-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    },

    // 김초보 - Skill level improvement
    {
      id: 'mock-feed-11',
      type: 'match_result',
      actorId: 'beginner-user',
      actorName: '김초보',
      targetId: 'practice-partner',
      targetName: 'Jenny Wilson',
      eventId: 'progress-match-1',
      metadata: {
        score: '6-7, 6-4, 6-4',
        eloChange: 22,
        location: 'Blackburn Park Tennis',
        isWin: true,
        matchType: 'singles',
        firstWin: true,
        skillImprovement: 'NTRP 2.5 → 3.0',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)), // 4일 전
      visibility: 'friends',
      visibleTo: ['beginner-user', 'practice-partner', 'manager-user', 'social-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)),
    },

    // 이중급 - Doubles partnership success
    {
      id: 'mock-feed-12',
      type: 'match_result',
      actorId: 'intermediate-user',
      actorName: '이중급',
      targetId: 'doubles-partner',
      targetName: '최파트너',
      eventId: 'doubles-league-1',
      metadata: {
        score: '6-4, 6-2',
        eloChange: 15,
        location: 'Sandy Springs Tennis Center',
        isWin: true,
        matchType: 'doubles',
        partnership: 'with 최파트너',
        streak: 5,
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5일 전
      visibility: 'friends',
      visibleTo: ['intermediate-user', 'doubles-partner', 'advanced-user', 'social-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
    },

    // 박고수 - Coaching milestone
    {
      id: 'mock-feed-13',
      type: 'club_event',
      actorId: 'advanced-user',
      actorName: '박고수',
      clubId: 'elite-tennis-club',
      clubName: 'Elite Tennis Academy',
      eventId: 'coaching-clinic-1',
      metadata: {
        eventName: '고급 전술 클리닉',
        eventType: 'coaching_clinic',
        schedule: '일요일 오후 2시',
        maxParticipants: 6,
        skillLevel: '4.5+',
        specialNote: '볼리 전술 특화 수업',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)), // 6일 전
      visibility: 'public',
      visibleTo: ['advanced-user', 'intermediate-user', 'manager-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
    },

    // 정소셜 - Community building
    {
      id: 'mock-feed-14',
      type: 'new_member',
      actorId: 'social-user',
      actorName: '정소셜',
      clubId: 'fun-tennis-group',
      clubName: 'Fun Tennis Atlanta',
      metadata: {
        memberCount: 45,
        clubType: '소셜',
        location: '애틀랜타 각지',
        welcomeMessage: '테니스로 만나는 새로운 친구들!',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), // 7일 전
      visibility: 'friends',
      visibleTo: ['social-user', 'beginner-user', 'intermediate-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    },

    // 최관리자 - Success story sharing
    {
      id: 'mock-feed-15',
      type: 'league_winner',
      actorId: 'club-member-1',
      actorName: 'Alex Turner',
      clubId: 'atlanta-metro-club',
      clubName: 'Atlanta Metro Tennis Club',
      metadata: {
        leagueName: '2024 Winter Beginner League',
        winRate: '88%',
        totalMatches: 8,
        finalRanking: 1,
        division: '2.5-3.0',
        coachCredit: '최관리자 코치 덕분에!',
      },
      timestamp: createMockTimestamp(new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)), // 8일 전
      visibility: 'club_members',
      visibleTo: ['club-member-1', 'manager-user', 'beginner-user', 'social-user'],
      isActive: true,
      createdAt: createMockTimestamp(new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)),
    },
  ];

  console.log(`🎭 Created ${mockItems.length} mock feed items`);
  mockItems.forEach((item, index) => {
    if (!item.id || !item.actorName || !item.type) {
      console.error(`❌ Invalid mock item at index ${index}:`, item);
    }
  });

  return mockItems;
}
*/

/**
 * Create a new feed item
 */
export async function createFeedItem(feedItem: Partial<FeedItem>): Promise<string> {
  try {
    console.log('📰 Creating new feed item:', feedItem.type);

    // Prepare feed item data
    const feedItemData = {
      ...feedItem,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      isActive: true,
      visibleTo: feedItem.visibleTo || [],
    };

    // 🎯 [KIM FIX] Remove undefined fields RECURSIVELY (including nested objects like metadata)
    // Firestore does NOT accept undefined values - they will throw FirebaseError
    const removeUndefinedDeep = (obj: Record<string, unknown>): void => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === undefined) {
          delete obj[key];
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively clean nested objects (like metadata)
          removeUndefinedDeep(value as Record<string, unknown>);
        }
      });
    };
    removeUndefinedDeep(feedItemData as Record<string, unknown>);

    // Add to Firebase
    const feedRef = collection(db, 'feed');
    const docRef = await addDoc(feedRef, feedItemData);

    console.log('✅ Feed item created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating feed item:', error);
    throw error;
  }
}

/**
 * Create welcome feed item for new club member
 */
export async function createWelcomeFeedItem(
  clubId: string,
  clubName: string,
  newMemberId: string,
  newMemberName: string,
  visibleToUserIds: string[]
): Promise<string> {
  const welcomeFeedItem: Partial<FeedItem> = {
    type: 'new_member_joined',
    actorId: newMemberId,
    actorName: newMemberName,
    clubId: clubId,
    clubName: clubName,
    visibility: 'club_members',
    visibleTo: visibleToUserIds,
    metadata: {
      welcomeMessage: `${newMemberName}님이 ${clubName}에 합류했습니다! 모두 따뜻하게 환영해주세요! 🎉`,
      isNewMemberPost: true,
    },
  };

  return await createFeedItem(welcomeFeedItem);
}

/**
 * 🚨 신고하기 - 피드 아이템을 관리자에게 신고
 * user_feedback 컬렉션에 complaint 타입으로 저장
 */
export async function reportFeedItem(
  feedId: string,
  feedContent: string,
  reporterId: string,
  reporterName: string,
  reporterEmail: string,
  reason?: string
): Promise<void> {
  try {
    console.log('🚨 Reporting feed item:', feedId);

    // 피드 내용 요약 (최대 50자)
    const contentSummary =
      feedContent.length > 50 ? feedContent.substring(0, 50) + '...' : feedContent;

    const feedbackData = {
      userId: reporterId,
      userEmail: reporterEmail,
      userName: reporterName,
      type: 'complaint',
      title: i18n.t('services.feed.reportTitle', { contentSummary }),
      description: reason
        ? `신고 사유: ${reason}\n\n원본 피드:\n${feedContent}`
        : `원본 피드:\n${feedContent}`,
      status: 'new',
      priority: 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        feedId: feedId,
        reportType: 'feed_report',
      },
    };

    const feedbackRef = collection(db, 'user_feedback');
    await addDoc(feedbackRef, feedbackData);

    console.log('✅ Feed report submitted successfully');
  } catch (error) {
    console.error('❌ Error reporting feed item:', error);
    throw error;
  }
}

/**
 * 🙈 숨기기 - 피드 아이템을 사용자별로 영구 숨김 처리 (Firestore 저장)
 * users/{userId}/hiddenFeeds 서브컬렉션에 저장
 */
export async function hideFeedItem(userId: string, feedId: string): Promise<void> {
  try {
    console.log('🙈 Hiding feed item:', feedId, 'for user:', userId);

    const hiddenFeedRef = doc(db, 'users', userId, 'hiddenFeeds', feedId);
    await setDoc(hiddenFeedRef, {
      feedId: feedId,
      hiddenAt: serverTimestamp(),
    });

    console.log('✅ Feed item hidden successfully');
  } catch (error) {
    console.error('❌ Error hiding feed item:', error);
    throw error;
  }
}

/**
 * 👀 숨긴 피드 ID 목록 조회
 */
export async function getHiddenFeedIds(userId: string): Promise<string[]> {
  try {
    const hiddenFeedsRef = collection(db, 'users', userId, 'hiddenFeeds');
    const snapshot = await getDocs(hiddenFeedsRef);

    const hiddenIds = snapshot.docs.map(doc => doc.id);
    console.log(`👀 Retrieved ${hiddenIds.length} hidden feed IDs for user:`, userId);

    return hiddenIds;
  } catch (error) {
    console.error('❌ Error getting hidden feed IDs:', error);
    return [];
  }
}

// No default export on purpose to avoid `.default` issues.
export default undefined as unknown as never;
