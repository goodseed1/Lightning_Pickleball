/**
 * EventService
 * AI NLU 명령을 위한 동적 이벤트 검색 서비스
 */

import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import i18n from '../i18n';

// 검색 필터 타입
export interface SearchFilters {
  gameType?: 'singles' | 'doubles' | 'mixed';
  timeRange?: 'morning' | 'afternoon' | 'evening' | 'night';
  date?: 'today' | 'tomorrow' | 'weekend' | 'this_week';
  location?: 'nearby' | string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'open' | 'full' | 'completed';
}

// 검색 옵션
export interface SearchOptions {
  maxResults?: number;
  userLocation?: { latitude: number; longitude: number };
  sortBy?: 'startTime' | 'distance' | 'createdAt';
}

// 검색 결과 타입
export interface SearchResult {
  success: boolean;
  events: EventData[];
  totalCount: number;
  message: string;
  error?: string;
}

// 이벤트 데이터 타입
export interface EventData {
  id: string;
  title: string;
  gameType: string;
  startTime: Date;
  location: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  skillLevel: string;
  status: string;
}

/**
 * 시간대를 시간 범위로 변환
 */
function getTimeRange(timeRange: string): { start: number; end: number } {
  switch (timeRange) {
    case 'morning':
      return { start: 6, end: 12 };
    case 'afternoon':
      return { start: 12, end: 17 };
    case 'evening':
      return { start: 17, end: 21 };
    case 'night':
      return { start: 21, end: 24 };
    default:
      return { start: 0, end: 24 };
  }
}

/**
 * 날짜 필터를 Date 범위로 변환
 */
function getDateRange(dateFilter: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (dateFilter) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };
    case 'tomorrow':
      return {
        start: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() + 48 * 60 * 60 * 1000),
      };
    case 'weekend': {
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
      const saturday = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
      return {
        start: saturday,
        end: new Date(saturday.getTime() + 48 * 60 * 60 * 1000),
      };
    }
    case 'this_week':
      return {
        start: today,
        end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      };
    default:
      return { start: today, end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) };
  }
}

/**
 * 동적 이벤트 검색
 * @param filters - 검색 필터
 * @param options - 검색 옵션
 * @returns 검색 결과
 */
export async function searchEvents(
  filters: SearchFilters,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const { maxResults = 10 } = options;

  console.log('🔍 EventService: Searching events with filters:', filters);

  try {
    // 쿼리 제약 조건 배열
    const constraints: QueryConstraint[] = [];

    // 기본: 오픈 상태이고 미래 이벤트만
    constraints.push(where('status', '==', filters.status || 'open'));
    constraints.push(where('startTime', '>=', Timestamp.now()));

    // gameType 필터
    if (filters.gameType) {
      constraints.push(where('gameType', '==', filters.gameType));
    }

    // skillLevel 필터
    if (filters.skillLevel) {
      constraints.push(where('skillLevel', '==', filters.skillLevel));
    }

    // 정렬 및 제한
    constraints.push(orderBy('startTime', 'asc'));
    constraints.push(limit(maxResults));

    // Firestore 쿼리 실행
    const eventsRef = collection(db, 'lightning_events');
    const q = query(eventsRef, ...constraints);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: true,
        events: [],
        totalCount: 0,
        message: i18n.t('services.event.noEventsFound'),
      };
    }

    // 결과 변환
    let events: EventData[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || i18n.t('services.event.untitled'),
        gameType: data.gameType || 'singles',
        startTime: data.startTime && data.startTime.toDate ? data.startTime.toDate() : new Date(),
        location: data.location || data.courtName || i18n.t('services.event.locationTbd'),
        hostName: data.hostName || i18n.t('services.event.host'),
        currentPlayers: data.currentPlayers || (data.participants && data.participants.length) || 0,
        maxPlayers: data.maxPlayers || 4,
        skillLevel: data.skillLevel || 'all',
        status: data.status || 'open',
      };
    });

    // 날짜 필터 (클라이언트 사이드)
    if (filters.date) {
      const { start, end } = getDateRange(filters.date);
      events = events.filter(event => event.startTime >= start && event.startTime < end);
    }

    // 시간대 필터 (클라이언트 사이드)
    if (filters.timeRange) {
      const { start: startHour, end: endHour } = getTimeRange(filters.timeRange);
      events = events.filter(event => {
        const hour = event.startTime.getHours();
        return hour >= startHour && hour < endHour;
      });
    }

    console.log(`🔍 EventService: Found ${events.length} events`);

    return {
      success: true,
      events,
      totalCount: events.length,
      message: i18n.t('services.event.eventsFound', { count: events.length }),
    };
  } catch (error) {
    console.error('🔍 EventService Error:', error);
    return {
      success: false,
      events: [],
      totalCount: 0,
      message: i18n.t('services.event.searchError'),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * AI 메시지용 검색 결과 포맷팅
 */
export function formatSearchResultForAI(result: SearchResult, language = 'ko'): string {
  if (!result.success || result.events.length === 0) {
    return i18n.t('services.event.noMatchesFound');
  }

  const events = result.events.slice(0, 3); // 상위 3개만

  let message = i18n.t('services.event.matchesFoundMessage', { count: result.totalCount }) + '\n\n';
  events.forEach((event, i) => {
    const time = event.startTime.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    message += `${i + 1}. **${event.title}**\n`;
    message += `   📍 ${event.location} | ⏰ ${time}\n`;
    message +=
      i18n.t('services.event.playerCount', {
        current: event.currentPlayers,
        max: event.maxPlayers,
      }) + '\n\n';
  });
  return message;
}

// No default export on purpose to avoid `.default` issues.
export default undefined as unknown as never;
