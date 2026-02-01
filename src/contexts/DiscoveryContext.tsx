/**
 * DiscoveryContext - 탐색 데이터 사령부
 * Centralized discovery data management for players, clubs, and events
 * 탐색 화면의 모든 데이터와 필터 상태를 중앙에서 관리하는 Context
 */

/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useClub } from './ClubContext';
import { safeToDate } from '../utils/dateUtils';
import { safeSkillLevel } from '../utils/dataUtils';
import { cctvLog, CCTV_PHASES } from '../utils/cctvLogger';
import { formatDistance } from '../utils/unitUtils';
import coachLessonService from '../services/coachLessonService';
import { CoachLesson } from '../types/coachLesson';
import pickleballServiceService from '../services/pickleballServiceService';
import { PickleballService } from '../types/pickleballService';
import clubService from '../services/clubService';

// Type definitions
interface Player {
  id: string;
  name: string;
  avatar?: string;
  skillLevel:
    | number
    | { calculated?: number; selfAssessed?: string; confidence?: number }
    | { selfAssessed: string }; // Support both legacy number and new object structure
  distance: number | null;
  isOnline: boolean;
  bio: string;
  matchCount: number;
  winRate: number;
  location: {
    latitude: number;
    longitude: number;
  };
  profile?: {
    location?: {
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
    // 🎯 [KIM FIX] Gender for quick match eligibility check
    gender?: string;
  };
  preferredTimeSlots: string[];
  // 🎯 [KIM FIX v19] LPR values (1-10 scale) for all game types
  singlesLtr?: number;
  doublesLtr?: number;
  mixedLtr?: number;
  // 🎾 ELO-based LPR display (accurate, from actual matches)
  singlesElo?: number;
  // 🎯 [KIM FIX] createdAt for sorting (optional for players)
  createdAt?: Date | { toDate: () => Date };
}

interface Club {
  id: string;
  name: string;
  memberCount: number;
  distance: number | null;
  description: string;
  level: string;
  cityName?: string;
  fullAddress?: string;
  city?: string; // City only (for privacy-safe display)
  state?: string; // State only (for privacy-safe display)
  userStatus?: 'none' | 'admin' | 'manager' | 'member' | 'pending' | 'declined';
  logoUrl?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  createdBy?: string;
  creatorName?: string; // Host display name
  // 🎯 [KIM FIX] Club activity stats for Discovery cards
  eventCount?: number; // Events in last 30 days
  communicationLevel?: 'active' | 'normal' | 'quiet'; // Based on announcements
  memberJoined?: number; // New members in last 30 days
  memberLeft?: number; // Left members in last 30 days
  monthlyFee?: number; // Monthly fee amount
}

interface Event {
  id: string;
  title: string;
  clubName: string;
  hostName?: string; // 호스트 이름 (닉네임)
  date: Date;
  time: string;
  location: string;
  // 🎯 [KIM FIX] locationDetails with coordinates for distance filtering
  locationDetails?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    name?: string;
  };
  distance: number | null;
  participants: number;
  maxParticipants: number;
  skillLevel: string;
  type: 'match' | 'practice' | 'tournament' | 'meetup';
  description: string;
  eventTypeLabel?: string; // NEW: 'Public Match' | 'Club Event' for enhanced UI
  hostId?: string; // 🎯 작전명 카멜레온 버튼: 호스트 정보 추가
  hostPartnerName?: string; // 🎯 호스트의 파트너 이름
  hostPartnerId?: string; // 🎯 호스트의 파트너 ID
  gameType?: string; // 🎯 경기 유형 (singles/doubles)
  fullAt?: Date; // 🎯 마감 타임스탬프 (만석이 된 시점)
  // 🎯 [KIM FIX] 도전팀 정보 추가
  challengerName?: string; // 도전팀 대표 이름
  challengerPartnerName?: string; // 도전팀 파트너 이름
  challengerId?: string; // 도전팀 대표 ID
  challengerPartnerId?: string; // 도전팀 파트너 ID
  isRecruitmentComplete?: boolean; // 모집 완료 여부
  // 🎯 [FRIEND INVITE] Invite-only event flags
  isPublic?: boolean; // 공개 이벤트 여부
  isInviteOnly?: boolean; // 친구 초대 전용 여부
  // 🎯 [KIM FIX] NTRP info for EventCard display
  hostLtrLevel?: number; // Host's NTRP level
  minLtr?: number; // Minimum NTRP for application
  maxLtr?: number; // Maximum NTRP for application
  // 🎯 [KIM FIX] Status and match result for completed events
  status?: 'scheduled' | 'in_progress' | 'upcoming' | 'recruiting' | 'completed' | 'cancelled';
  matchResult?: {
    score?: {
      finalScore?: string;
      sets?: Array<{
        player1Games: number;
        player2Games: number;
        player1TiebreakPoints?: number;
        player2TiebreakPoints?: number;
      }>;
    };
    hostResult?: 'win' | 'loss';
    submittedAt?: Date | { toDate: () => Date };
  } | null;
  // 🎯 [KIM FIX] createdAt for sorting
  createdAt?: Date | { toDate: () => Date };
}

type FilterType = 'players' | 'clubs' | 'events' | 'coaches' | 'services';
type SkillFilter = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface DiscoveryContextType {
  // Raw data
  players: Player[];
  clubs: Club[];
  events: Event[];
  lessons: CoachLesson[];
  services: PickleballService[];

  // Filtered results
  filteredResults: (Player | Club | Event | CoachLesson | PickleballService)[];

  // Loading states
  isLoading: boolean;
  refreshing: boolean;

  // Filter states
  filterType: FilterType;
  searchQuery: string;
  skillFilter: SkillFilter;
  distanceFilter: number;

  // Filter setters
  setFilterType: (type: FilterType) => void;
  setSearchQuery: (query: string) => void;
  setSkillFilter: (filter: SkillFilter) => void;
  setDistanceFilter: (distance: number) => void;

  // Actions
  refreshData: () => Promise<void>;
  searchData: (query: string) => void;
}

const DiscoveryContext = createContext<DiscoveryContextType>({
  players: [],
  clubs: [],
  events: [],
  lessons: [],
  services: [],
  filteredResults: [],
  isLoading: true,
  refreshing: false,
  filterType: 'events',
  searchQuery: '',
  skillFilter: 'all',
  distanceFilter: 24,
  setFilterType: () => {},
  setSearchQuery: () => {},
  setSkillFilter: () => {},
  setDistanceFilter: () => {},
  refreshData: async () => {},
  searchData: () => {},
});

interface DiscoveryProviderProps {
  children: ReactNode;
}

export const DiscoveryProvider: React.FC<DiscoveryProviderProps> = ({ children }) => {
  const { currentUser: user } = useAuth();
  // 🎯 [KIM FIX] userMemberships도 가져와서 admin/manager 역할 구분
  const { userClubs, userMemberships } = useClub();

  // Loading states - maintained for compatibility
  const [isLoading] = useState(false); // Always false since data loads reactively
  const [refreshing] = useState(false); // Always false since data refreshes automatically

  // Raw data states
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [lessons, setLessons] = useState<CoachLesson[]>([]);
  const [services, setServices] = useState<PickleballService[]>([]);

  // 🎯 [KIM FIX] Track pending join requests for club status display
  const [pendingJoinRequests, setPendingJoinRequests] = useState<
    { clubId: string; status: string }[]
  >([]);

  // Filter states
  const [filterType, setFilterType] = useState<FilterType>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState(24); // Default 15 miles = ~24 km

  // 🎥 CCTV: DiscoveryContext initialization
  cctvLog('DiscoveryContext', CCTV_PHASES.INIT, 'DiscoveryProvider initialized', {
    hasUser: !!user,
    userId: user?.uid,
    hasUserClubs: !!userClubs,
    userClubCount: userClubs?.length || 0,
    initialFilterType: filterType,
    initialDistanceFilter: distanceFilter,
  });

  // Helper function to safely calculate distance between two points
  const calculateSafeDistance = (
    userLocation:
      | {
          latitude?: number;
          longitude?: number;
          lat?: number;
          lng?: number;
        }
      | null
      | undefined,
    targetLocation:
      | {
          latitude?: number;
          longitude?: number;
          lat?: number;
          lng?: number;
        }
      | null
      | undefined
  ): number | null => {
    if (!userLocation || !targetLocation) {
      return null;
    }

    // 💥 Universal coordinate normalization - the "translator" engine 💥
    const normalizedUser = {
      latitude: userLocation.latitude ?? userLocation.lat,
      longitude: userLocation.longitude ?? userLocation.lng,
    };

    const normalizedTarget = {
      latitude: targetLocation.latitude ?? targetLocation.lat,
      longitude: targetLocation.longitude ?? targetLocation.lng,
    };

    // Enhanced validation using normalized coordinates
    if (
      typeof normalizedUser.latitude !== 'number' ||
      typeof normalizedUser.longitude !== 'number' ||
      typeof normalizedTarget.latitude !== 'number' ||
      typeof normalizedTarget.longitude !== 'number' ||
      !isFinite(normalizedUser.latitude) ||
      !isFinite(normalizedUser.longitude) ||
      !isFinite(normalizedTarget.latitude) ||
      !isFinite(normalizedTarget.longitude)
    ) {
      return null;
    }

    // Simple Haversine formula for distance calculation using normalized coordinates
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((normalizedTarget.latitude - normalizedUser.latitude) * Math.PI) / 180;
    const dLon = ((normalizedTarget.longitude - normalizedUser.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((normalizedUser.latitude * Math.PI) / 180) *
        Math.cos((normalizedTarget.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const distanceMiles = distanceKm * 0.621371; // Convert km to miles

    return isFinite(distanceMiles) ? distanceMiles : null;
  };

  // 🔄 REACTIVE DATA SUBSCRIPTIONS - No more manual loading! 🔄

  // ✅ Reactive Players Subscription
  useEffect(() => {
    // 🎥 CCTV: Players subscription decision
    cctvLog(
      'DiscoveryContext',
      CCTV_PHASES.DISCOVERY_START,
      'Players subscription effect triggered',
      {
        hasUser: !!user?.uid,
        userId: user?.uid,
      }
    );

    if (!user?.uid) {
      cctvLog('DiscoveryContext', 'NO_USER', 'No user found - clearing players data');
      setPlayers([]);
      return;
    }

    cctvLog('DiscoveryContext', 'PLAYERS_QUERY_START', 'Starting players subscription query', {
      userId: user.uid,
    });

    const usersRef = collection(db, 'users');
    // 🎯 [KIM FIX] Removed strict isOnboardingComplete filter to include users with undefined value
    // Smart filtering: only show users with displayName (indicating profile setup)
    const playersQuery = query(usersRef, limit(100)); // Fetch more, filter client-side

    const unsubscribe = onSnapshot(
      playersQuery,
      snapshot => {
        // 🎥 CCTV: Players data arrival
        cctvLog('DiscoveryContext', CCTV_PHASES.DISCOVERY_DATA_LOADED, 'Players data received', {
          docsCount: snapshot.docs.length,
          isEmpty: snapshot.empty,
        });
        const playersList = snapshot.docs.map(doc => {
          const userData = doc.data();
          const stats = userData.stats || { wins: 0, losses: 0, matchesPlayed: 0 };
          // Calculate winRate from wins and matchesPlayed (not stored in Firestore)
          const matchCount = stats.matchesPlayed || stats.totalMatches || 0;
          const winRate = matchCount > 0 ? Math.round((stats.wins / matchCount) * 100) : 0;
          // Preserve the complete skillLevel object structure instead of flattening to number
          const skillLevel = userData.skillLevel || { selfAssessed: '3.0-3.5' };

          // 🛡️ 빈 객체 방어: lastActive 유효성 검증
          const rawLastActive = userData.lastActive;
          const lastActive =
            rawLastActive &&
            typeof rawLastActive === 'object' &&
            (Object.keys(rawLastActive).length > 0 ||
              rawLastActive._methodName ||
              rawLastActive.toDate)
              ? safeToDate(rawLastActive, 'DiscoveryContext.playersList')
              : null;
          const finalLastActive = lastActive || new Date(0);
          const isOnline = Date.now() - finalLastActive.getTime() < 30 * 60 * 1000;

          // Preserve complete profile.location including country and gender
          // 🔥 [KIM FIX] Include lat/lng fields for complete coordinate support
          const profile = userData.profile
            ? {
                location: {
                  address: userData.profile.location?.address,
                  city: userData.profile.location?.city,
                  state: userData.profile.location?.state,
                  country: userData.profile.location?.country,
                  latitude: userData.profile.location?.latitude,
                  longitude: userData.profile.location?.longitude,
                  lat: userData.profile.location?.lat,
                  lng: userData.profile.location?.lng,
                },
                // 🎯 [KIM FIX] Include gender for quick match eligibility check
                gender: userData.profile.gender || userData.gender,
              }
            : undefined;

          // 🎯 [KIM FIX v25] Calculate NTRP from ELO ratings - use eloRatings only (Single Source of Truth)
          const eloRatings = userData.eloRatings as
            | {
                singles?: { current?: number };
                doubles?: { current?: number };
                mixed?: { current?: number };
              }
            | undefined;
          const singlesElo = eloRatings?.singles?.current;
          const doublesElo = eloRatings?.doubles?.current;
          const mixedElo = eloRatings?.mixed?.current;

          // ELO to LPR conversion (1-10 scale)
          // 🎯 [KIM FIX v16] Use LPR scale (1-10) instead of NTRP (2.5-5.5)
          const eloToLtr = (elo: number): number => {
            if (elo < 1000) return 1;
            if (elo < 1100) return 2;
            if (elo < 1200) return 3;
            if (elo < 1300) return 4;
            if (elo < 1450) return 5;
            if (elo < 1600) return 6;
            if (elo < 1800) return 7;
            if (elo < 2100) return 8;
            if (elo < 2400) return 9;
            return 10;
          };

          const singlesLtr = singlesElo ? eloToLtr(singlesElo) : undefined;
          const doublesLtr = doublesElo ? eloToLtr(doublesElo) : undefined;
          const mixedLtr = mixedElo ? eloToLtr(mixedElo) : undefined;

          return {
            id: doc.id,
            name: userData.displayName || userData.profile?.name || 'Player',
            // 🎯 [KIM FIX] Check profile.photoURL FIRST (where images are stored for most users)
            avatar: userData.profile?.photoURL || userData.photoURL,
            skillLevel,
            distance: null, // Distance calculated in filteredResults with user location
            isOnline,
            bio: userData.bio || userData.profile?.bio || '',
            matchCount,
            winRate,
            // 🎯 [KIM FIX] Use profile.location as primary source (Single Source of Truth)
            location: userData.profile?.location ||
              userData.location || { latitude: 0, longitude: 0 },
            profile,
            preferredTimeSlots: userData.preferredTimeSlots || [],
            singlesLtr, // 🎯 [KIM FIX v19] Singles LPR (1-10 scale) for quick match display
            doublesLtr, // 🎯 [KIM FIX v19] Doubles LPR (1-10 scale) for live event card display
            mixedLtr, // 🎯 [KIM FIX v19] Mixed LPR (1-10 scale) for live event card display
            singlesElo, // 🎾 ELO-based LPR display (accurate, from actual matches)
          } as Player;
        });

        // 🎯 [KIM FIX] Smart filtering: only show users with displayName (profile setup completed)
        // This replaces the strict isOnboardingComplete === true filter
        const filteredPlayers = playersList.filter(
          player => player.name && player.name !== 'Player' && player.name.trim() !== ''
        );

        setPlayers(filteredPlayers);
      },
      error => {
        // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
        if (error?.code === 'permission-denied') {
          console.log('🔒 Players subscription ended (user signed out)');
        } else {
          console.error('❌ REACTIVE: Players subscription error:', error);
        }
        setPlayers([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // 🎯 [KIM FIX] Subscribe to user's pending join requests for club status display
  useEffect(() => {
    if (!user?.uid) {
      setPendingJoinRequests([]);
      return;
    }

    // 🔧 FIX: Use camelCase collection name to match Cloud Functions
    const joinRequestQuery = query(
      collection(db, 'clubJoinRequests'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      joinRequestQuery,
      snapshot => {
        const requests = snapshot.docs.map(doc => ({
          clubId: doc.data().clubId as string,
          status: doc.data().status as string,
        }));
        console.log('🎯 [DiscoveryContext] Join requests updated:', requests.length, 'requests');
        setPendingJoinRequests(requests);
      },
      error => {
        // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
        if (error?.code === 'permission-denied') {
          console.log('🔒 Join requests subscription ended (user signed out)');
        } else {
          console.error('❌ Join requests subscription error:', error);
        }
        setPendingJoinRequests([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // ✅ Reactive Events Subscription
  useEffect(() => {
    if (!user?.uid) {
      setEvents([]);
      return;
    }

    const eventsRef = collection(db, 'events');
    // 🎯 [OPERATION DUO] Exclude partner_pending matches from discovery
    const eventsQuery = query(
      eventsRef,
      where('status', 'in', ['scheduled', 'in_progress', 'upcoming', 'recruiting']), // 🎯 [KIM FIX] Exclude 'completed' - 완료된 매치는 탐색에서 즉시 제거
      orderBy('scheduledTime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      snapshot => {
        const eventsList = snapshot.docs.map(doc => {
          const data = doc.data();
          // 🛡️ 빈 객체 방어: scheduledTime 유효성 검증
          const rawScheduledTime = data.scheduledTime;
          const scheduledTime =
            rawScheduledTime &&
            typeof rawScheduledTime === 'object' &&
            (Object.keys(rawScheduledTime).length > 0 ||
              rawScheduledTime._methodName ||
              rawScheduledTime.toDate)
              ? safeToDate(rawScheduledTime, 'DiscoveryContext.eventsList')
              : null;
          const finalScheduledTime = scheduledTime || new Date();
          const baseParticipantCount = data.participants?.length || 0;
          const isPublicEvent = !data.clubId;
          const participantCount = isPublicEvent ? baseParticipantCount + 1 : baseParticipantCount;

          // 🎯 [KIM FIX] Get host name from participants array if not in top-level fields
          const hostName =
            data.hostNickname ||
            data.hostName ||
            (data.participants && Array.isArray(data.participants)
              ? data.participants.find(
                  (p: { userId?: string; name?: string }) => p.userId === data.hostId
                )?.name
              : undefined);

          return {
            id: doc.id,
            title: data.title || 'Untitled Event',
            clubName: data.clubName || 'Unknown Club',
            hostName: hostName || undefined, // 호스트 이름 (participants에서 조회)
            hostPartnerId: data.hostPartnerId || undefined, // 🎯 호스트의 파트너 ID
            hostPartnerName: data.hostPartnerName || undefined, // 🎯 호스트의 파트너 이름
            gameType: data.gameType || undefined, // 🎯 경기 유형
            date: finalScheduledTime,
            time: finalScheduledTime.toLocaleTimeString(),
            location: data.location || '',
            // 🎯 [KIM FIX] Include locationDetails with coordinates for distance filtering
            // Cloud Function events use locationDetails, activityService events use placeDetails
            locationDetails: data.locationDetails || data.placeDetails || undefined,
            distance: null, // Distance calculated in filteredResults with user location
            participants: participantCount,
            maxParticipants: data.maxParticipants || 10,
            skillLevel: (() => {
              // 🔍 SIMPLE TEST: Verify this code is running
              console.log('🔍 TEST: DiscoveryContext processing skillLevel for event:', data.title);

              // 🔍 ENHANCED DEBUG: Log ALL events to understand Firebase structure
              if (
                data.title &&
                (data.title.includes('번개13') ||
                  data.title.includes('번개') ||
                  data.title.includes('13'))
              ) {
                console.log('🔍 [SKILL LEVEL DEBUG] Target Event Data Analysis:', {
                  eventTitle: data.title,
                  eventId: doc.id,
                  originalSkillLevel: data.skillLevel,
                  skillLevelType: typeof data.skillLevel,
                  allFields: Object.keys(data),
                  // Check for alternative skill level fields
                  alternativeFields: {
                    minSkillLevel: data.minSkillLevel,
                    maxSkillLevel: data.maxSkillLevel,
                    requiredSkillLevel: data.requiredSkillLevel,
                    hostSkillLevel: data.hostSkillLevel,
                    preferencesSkillLevel: data.preferences?.skillLevel,
                    creatorSkillLevel: data.creatorSkillLevel,
                  },
                  isTargetEvent:
                    data.title &&
                    (data.title.includes('번개13') ||
                      data.title.includes('번개') ||
                      data.title.includes('13')),
                  completeFirebaseData: data,
                });
              }

              // Use ltrLevel as the primary skill level source since skillLevel is undefined
              return safeSkillLevel(data.ltrLevel || data.skillLevel, data);
            })(), // 🔄 Enhanced skill level extraction with comprehensive debugging
            type: data.type || 'match', // 🔄 원본 데이터 우선, 번개매치가 기본 (match로 통일)
            description: data.description || '',
            hostId: data.hostId || '', // 🎯 작전명 카멜레온 버튼: 호스트 ID 포함
            chatUnreadCount: data.chatUnreadCount || {},
            fullAt: data.fullAt ? safeToDate(data.fullAt, 'DiscoveryContext.fullAt') : undefined, // 🎯 마감 타임스탬프
            // 🎯 [KIM FIX] Include status and matchResult for completed events display
            status: data.status || 'scheduled',
            matchResult: data.matchResult || null,
            // 🎯 [FRIEND INVITE] Include invite-only flags
            isPublic: data.isPublic !== false, // default true if not specified
            isInviteOnly: data.isInviteOnly || false,
            // 🎯 [KIM FIX] Include NTRP info for EventCard display
            hostLtrLevel: data.hostLtrLevel || undefined,
            minLtr: data.minLtr || undefined,
            maxLtr: data.maxLtr || undefined,
            // 🎯 [KIM FIX] Include createdAt for sorting (최신 이벤트 먼저)
            createdAt: data.createdAt
              ? safeToDate(data.createdAt, 'DiscoveryContext.createdAt')
              : undefined,
          } as Event;
        });

        // Update participant counts with approved applications (async fire-and-forget)
        updateEventParticipantCounts(eventsList)
          .then(() => {
            setEvents(eventsList);
          })
          .catch(error => {
            // 🔇 [KIM FIX] 새 유저 온보딩 중 권한 에러는 조용히 처리
            // New users during onboarding don't have profile yet, so permission errors are expected
            const isPermissionError =
              error?.code === 'permission-denied' ||
              error?.message?.includes('Missing or insufficient permissions');
            if (isPermissionError) {
              console.log(
                '🔒 Participant count update skipped (user may be in onboarding or signed out)'
              );
            } else {
              console.warn('⚠️ Error updating event participant counts:', error);
            }
            setEvents(eventsList); // Still set events even if count update fails
          });
      },
      error => {
        // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
        if (error?.code === 'permission-denied') {
          console.log('🔒 Events subscription ended (user signed out)');
        } else {
          console.error('❌ REACTIVE: Events subscription error:', error);
        }
        setEvents([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // 🎯 [KIM FIX] Reactive Participation Applications Subscription for real-time participant count updates
  useEffect(() => {
    // Skip if no user or no events loaded yet
    if (!user?.uid) return;

    // Subscribe to approved applications for all visible events
    const applicationsRef = collection(db, 'participation_applications');
    const applicationsQuery = query(
      applicationsRef,
      where('status', '==', 'approved'),
      limit(200) // Limit to prevent excessive reads
    );

    const unsubscribeApps = onSnapshot(
      applicationsQuery,
      async snapshot => {
        console.log(
          `📊 [KIM FIX] Real-time applications update: ${snapshot.docs.length} approved applications`
        );

        // Group approved applications by eventId
        // 🎯 [KIM FIX] Filter out partner_invitation type (host partner) to prevent double counting
        const approvedByEvent: Record<
          string,
          Array<{
            eventId: string;
            applicantId: string;
            applicantName: string;
            partnerId?: string;
            partnerName?: string;
            type?: string;
          }>
        > = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const eventId = data.eventId;

          // 🎯 [KIM FIX] Skip partner_invitation type (host partner)
          if (data.type === 'partner_invitation') {
            return; // Skip host partner applications
          }

          if (!approvedByEvent[eventId]) {
            approvedByEvent[eventId] = [];
          }
          approvedByEvent[eventId].push({
            eventId,
            applicantId: data.applicantId,
            applicantName: data.applicantName || '참가자',
            partnerId: data.partnerId,
            partnerName: data.partnerName,
            type: data.type,
          });
        });

        // Update events with new participant counts
        setEvents(prevEvents => {
          if (prevEvents.length === 0) return prevEvents;

          let hasChanges = false;
          const updatedEvents = prevEvents.map(event => {
            const approvedApps = approvedByEvent[event.id] || [];
            const isPublicEvent = !event.clubName || event.clubName === 'Unknown Club';
            const isDoubles = event.gameType?.toLowerCase().includes('doubles');

            // Calculate new participant count
            let participantCount = 0;

            if (isPublicEvent) {
              // Host always counts as 1
              participantCount = 1;

              // If host has partner, add 1
              if (event.hostPartnerId) {
                participantCount += 1;
              }

              // Add approved challengers
              approvedApps.forEach(app => {
                if (app.applicantId !== event.hostPartnerId) {
                  participantCount += 1;
                  if (isDoubles && app.partnerId) {
                    participantCount += 1;
                  }
                }
              });
            } else {
              participantCount = approvedApps.length;
            }

            // Check if anything changed
            const newIsComplete = participantCount >= event.maxParticipants;
            if (
              event.participants !== participantCount ||
              event.isRecruitmentComplete !== newIsComplete
            ) {
              hasChanges = true;
              console.log(
                `📊 [KIM FIX] Event ${event.id} participant count updated: ${event.participants} → ${participantCount}`
              );
              return {
                ...event,
                participants: participantCount,
                isRecruitmentComplete: newIsComplete,
                // Also update challenger info
                ...(approvedApps.length > 0 && {
                  challengerName: approvedApps[0]?.applicantName,
                  challengerId: approvedApps[0]?.applicantId,
                  challengerPartnerName: approvedApps[0]?.partnerName,
                  challengerPartnerId: approvedApps[0]?.partnerId,
                }),
              };
            }

            return event;
          });

          return hasChanges ? updatedEvents : prevEvents;
        });
      },
      error => {
        // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
        if (error?.code === 'permission-denied') {
          console.log('🔒 Participation applications subscription ended (user signed out)');
        } else {
          console.error('❌ Error in participation applications subscription:', error);
        }
      }
    );

    return () => {
      unsubscribeApps();
    };
  }, [user?.uid]);

  // ✅ Reactive Clubs Subscription
  useEffect(() => {
    // 🎥 CCTV: Clubs subscription decision
    cctvLog(
      'DiscoveryContext',
      CCTV_PHASES.DISCOVERY_START,
      'Clubs subscription effect triggered',
      {
        hasUser: !!user?.uid,
        userId: user?.uid,
        hasUserClubs: !!userClubs,
        userClubsCount: userClubs?.length || 0,
      }
    );

    if (!user?.uid) {
      cctvLog('DiscoveryContext', 'NO_USER', 'No user found - clearing clubs data');
      setClubs([]);
      return;
    }

    cctvLog('DiscoveryContext', 'CLUBS_QUERY_START', 'Starting clubs subscription query', {
      userId: user.uid,
    });

    const clubsRef = collection(db, 'pickleball_clubs');
    const clubsQuery = query(clubsRef, where('status', '==', 'active'), limit(50));

    const unsubscribe = onSnapshot(
      clubsQuery,
      snapshot => {
        // 🎥 CCTV: Clubs data arrival
        cctvLog('DiscoveryContext', CCTV_PHASES.DISCOVERY_DATA_LOADED, 'Clubs data received', {
          docsCount: snapshot.docs.length,
          isEmpty: snapshot.empty,
        });
        const clubsList = snapshot.docs.map(doc => {
          const data = doc.data();

          // 🎯 [KIM FIX] Determine membership status including role (admin/manager) and pending join requests
          let membershipStatus: 'none' | 'admin' | 'manager' | 'member' | 'pending' | 'declined' =
            'none';

          // Check if user is a member and get their role
          const membership = userMemberships?.find(m => m.clubId === doc.id);
          if (membership) {
            // User is a member - check role
            if (membership.role === 'admin') {
              membershipStatus = 'admin';
            } else if (membership.role === 'manager') {
              membershipStatus = 'manager';
            } else {
              membershipStatus = 'member';
            }
          } else if (userClubs?.find(uc => uc.id === doc.id)) {
            // Fallback: user is in userClubs but no membership found (shouldn't happen normally)
            membershipStatus = 'member';
          } else {
            // Check for pending join requests
            const joinRequest = pendingJoinRequests.find(req => req.clubId === doc.id);
            if (joinRequest) {
              if (joinRequest.status === 'pending') {
                membershipStatus = 'pending';
              } else if (joinRequest.status === 'rejected') {
                membershipStatus = 'declined';
              }
            }
          }

          // 🌍 Enhanced location extraction with courtAddress fallback
          const extractLocationFromCourtAddress = (courtAddress: {
            coordinates?: { lat: number; lng: number };
          }) => {
            if (courtAddress?.coordinates) {
              return {
                latitude: courtAddress.coordinates.lat,
                longitude: courtAddress.coordinates.lng,
              };
            }
            return null;
          };

          const location = data.location ||
            extractLocationFromCourtAddress(data.profile?.courtAddress) || {
              latitude: 0,
              longitude: 0,
            };

          // Extract city from courtAddress for better display
          const extractCityFromAddress = (address: string) => {
            if (!address) return undefined;
            const parts = address.split(',');
            return parts[1]?.trim() || parts[0]?.trim();
          };

          const cityName =
            data.location?.cityName ||
            data.city ||
            extractCityFromAddress(data.profile?.courtAddress?.address);

          // Enhanced description resolution
          const description =
            data.profile?.description || data.profile?.bio || data.description || '';

          // 🛡️ 빈 객체 방어: createdAt 유효성 검증
          const rawCreatedAt = data.createdAt;
          const createdAt =
            rawCreatedAt &&
            typeof rawCreatedAt === 'object' &&
            (Object.keys(rawCreatedAt).length > 0 ||
              rawCreatedAt._methodName ||
              rawCreatedAt.toDate)
              ? safeToDate(rawCreatedAt, 'DiscoveryContext.clubsList')
              : null;
          const finalCreatedAt = createdAt || new Date();

          return {
            id: doc.id,
            name: data.profile?.name || data.name || 'Unnamed Club',
            // 🎯 [KIM FIX] statistics.totalMembers 체크 (실제 저장 위치)
            memberCount:
              data.statistics?.totalMembers || data.members?.length || data.memberCount || 0,
            distance: null, // Distance calculated in filteredResults with user location
            description: description, // Use enhanced description resolution
            level: data.skillLevel ?? 'all',
            cityName: cityName, // Use enhanced city name resolution
            fullAddress:
              data.location?.fullAddress || data.address || data.profile?.courtAddress?.address,
            city: data.location?.city || data.profile?.courtAddress?.city,
            state: data.location?.state || data.profile?.courtAddress?.state,
            // 🎯 [KIM FIX] profile.logo 체크 (실제 저장 위치)
            logoUrl: data.profile?.logo || data.logoUri || data.profile?.avatar || data.logoUrl,
            location: location, // Use enhanced location resolution
            createdAt: finalCreatedAt,
            createdBy: data.createdBy,
            creatorName: undefined, // Will be fetched from users collection
            userStatus: membershipStatus,
            // 🎯 [KIM FIX] isPublic 플래그 추가 (private 클럽 필터링용)
            isPublic: data.settings?.isPublic !== false,
          } as Club;
        });

        // 🎯 [KIM FIX] Fetch creator names, member counts, AND activity stats
        const fetchClubDetails = async () => {
          // Collect unique createdBy userIds
          const creatorIds = [...new Set(clubsList.map(club => club.createdBy).filter(Boolean))];
          const clubIds = clubsList.map(club => club.id);

          // 🎯 [KIM FIX] Fetch real-time member counts AND activity stats in parallel
          const [memberCounts, clubStats] = await Promise.all([
            clubService.getMultipleClubMemberCounts(clubIds),
            clubService.getMultipleClubStats(clubIds),
          ]) as [
            Record<string, number>,
            Record<string, { eventCount?: number; communicationLevel?: string; memberJoined?: number; memberLeft?: number; monthlyFee?: number }>
          ];
          console.log('📊 [DiscoveryContext] Real-time member counts:', memberCounts);
          console.log('📊 [DiscoveryContext] Club stats:', clubStats);

          if (creatorIds.length === 0) {
            // 🎯 [KIM FIX] Apply member counts, stats and filter private clubs
            const clubsWithDetails = clubsList.map(club => {
              const stats = clubStats[club.id] || {};
              return {
                ...club,
                memberCount: memberCounts[club.id] || 0,
                eventCount: stats.eventCount || 0,
                communicationLevel: (stats.communicationLevel || 'quiet') as 'active' | 'normal' | 'quiet',
                memberJoined: stats.memberJoined || 0,
                memberLeft: stats.memberLeft || 0,
                monthlyFee: stats.monthlyFee || 0,
              };
            });
            const filteredClubs = clubsWithDetails.filter(club => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const isPublic = (club as any).isPublic !== false;
              // admin, manager, member 모두 회원으로 간주
              const isMember = club.userStatus && ['admin', 'manager', 'member'].includes(club.userStatus);
              return isPublic || isMember;
            });
            setClubs(filteredClubs as Club[]);
            return;
          }

          // Fetch user profiles in parallel
          const creatorNameMap: Record<string, string> = {};
          await Promise.all(
            creatorIds.map(async userId => {
              try {
                const userDoc = await getDoc(doc(db, 'users', userId as string));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  creatorNameMap[userId as string] =
                    userData.displayName || userData.profile?.displayName || 'Unknown';
                }
              } catch (error) {
                console.warn(`Failed to fetch creator name for ${userId}:`, error);
              }
            })
          );

          // 🎯 [KIM FIX] Map creator names, member counts, AND activity stats back to clubs
          const clubsWithDetails = clubsList.map(club => {
            const stats = clubStats[club.id] || {};
            return {
              ...club,
              creatorName: club.createdBy ? creatorNameMap[club.createdBy] : undefined,
              memberCount: memberCounts[club.id] || 0,
              eventCount: stats.eventCount || 0,
              communicationLevel: (stats.communicationLevel || 'quiet') as 'active' | 'normal' | 'quiet',
              memberJoined: stats.memberJoined || 0,
              memberLeft: stats.memberLeft || 0,
              monthlyFee: stats.monthlyFee || 0,
            };
          });

          // 🎯 [KIM FIX] Private 클럽 필터링: 비회원은 private 클럽을 볼 수 없음
          // - isPublic이 true인 클럽은 모두 보임
          // - isPublic이 false(private)인 클럽은 회원만 볼 수 있음
          const filteredClubs = clubsWithDetails.filter(club => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isPublic = (club as any).isPublic !== false;
            // admin, manager, member 모두 회원으로 간주
            const isMember = club.userStatus && ['admin', 'manager', 'member'].includes(club.userStatus);
            return isPublic || isMember;
          });

          setClubs(filteredClubs as Club[]);
        };

        fetchClubDetails();
      },
      error => {
        // 🔇 로그아웃 시 permission-denied 에러는 예상된 동작이므로 조용히 처리
        if (error?.code === 'permission-denied') {
          console.log('🔒 Clubs subscription ended (user signed out)');
        } else {
          console.error('❌ Clubs subscription error:', error);
        }
        setClubs([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, userClubs, userMemberships, pendingJoinRequests]);

  // ✅ Reactive Coach Lessons Subscription
  useEffect(() => {
    if (!user?.uid) {
      setLessons([]);
      return;
    }

    cctvLog('DiscoveryContext', 'LESSONS_QUERY_START', 'Starting lessons subscription query', {
      userId: user.uid,
    });

    const unsubscribe = coachLessonService.listenToLessons(lessonsList => {
      cctvLog('DiscoveryContext', CCTV_PHASES.DISCOVERY_DATA_LOADED, 'Lessons data received', {
        docsCount: lessonsList.length,
      });
      setLessons(lessonsList);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // ✅ Reactive Pickleball Services Subscription
  useEffect(() => {
    if (!user?.uid) {
      setServices([]);
      return;
    }

    cctvLog('DiscoveryContext', 'SERVICES_QUERY_START', 'Starting services subscription query', {
      userId: user.uid,
    });

    const unsubscribe = pickleballServiceService.listenToServices(servicesList => {
      cctvLog('DiscoveryContext', CCTV_PHASES.DISCOVERY_DATA_LOADED, 'Services data received', {
        docsCount: servicesList.length,
      });
      setServices(servicesList);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // ✅ Helper function for event participant counts AND challenger team info (kept for async operations)
  const updateEventParticipantCounts = async (eventsList: Event[]) => {
    try {
      if (eventsList.length === 0) return;

      const eventIds = eventsList.map(event => event.id);

      // 🎯 [KIM FIX] Fetch approved applications with challenger info
      interface ApprovedApplication {
        eventId: string;
        applicantId: string;
        applicantName: string;
        partnerId?: string;
        partnerName?: string;
        type?: string; // 🎯 [KIM FIX] 'partner_invitation' = 호스트 파트너 (상대팀 아님!)
      }

      const approvedApplicationsByEvent: Record<string, ApprovedApplication[]> = {};

      // Single batch query for all events (first 10)
      const applicationsQuery = query(
        collection(db, 'participation_applications'),
        where('eventId', 'in', eventIds.slice(0, 10)),
        where('status', '==', 'approved')
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);

      applicationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const eventId = data.eventId;

        // 🎯 [KIM FIX] Skip partner_invitation type (host partner) to prevent double counting
        if (data.type === 'partner_invitation') {
          return;
        }

        if (!approvedApplicationsByEvent[eventId]) {
          approvedApplicationsByEvent[eventId] = [];
        }
        approvedApplicationsByEvent[eventId].push({
          eventId,
          applicantId: data.applicantId,
          applicantName: data.applicantName || '참가자',
          partnerId: data.partnerId,
          partnerName: data.partnerName,
          type: data.type,
        });
      });

      // If we have more than 10 events, query the remaining in batches
      if (eventIds.length > 10) {
        const remainingEventIds = eventIds.slice(10);
        const batchSize = 10;

        for (let i = 0; i < remainingEventIds.length; i += batchSize) {
          const batch = remainingEventIds.slice(i, i + batchSize);
          const batchQuery = query(
            collection(db, 'participation_applications'),
            where('eventId', 'in', batch),
            where('status', '==', 'approved')
          );

          const batchSnapshot = await getDocs(batchQuery);
          batchSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const eventId = data.eventId;

            // 🎯 [KIM FIX] Skip partner_invitation type (host partner)
            if (data.type === 'partner_invitation') {
              return;
            }

            if (!approvedApplicationsByEvent[eventId]) {
              approvedApplicationsByEvent[eventId] = [];
            }
            approvedApplicationsByEvent[eventId].push({
              eventId,
              applicantId: data.applicantId,
              applicantName: data.applicantName || '참가자',
              partnerId: data.partnerId,
              partnerName: data.partnerName,
              type: data.type,
            });
          });
        }
      }

      // Update participant counts AND challenger team info for all events
      eventsList.forEach(event => {
        const approvedApps = approvedApplicationsByEvent[event.id] || [];
        const isPublicEvent = !event.clubName || event.clubName === 'Unknown Club';
        const isDoubles = event.gameType?.toLowerCase().includes('doubles');

        // 🎯 [KIM FIX] Calculate participant count correctly
        // For doubles: host (1) + hostPartner (1) + challenger (1) + challengerPartner (1) = 4
        // For singles: host (1) + challenger (1) = 2
        let participantCount = 0;

        if (isPublicEvent) {
          // Host always counts as 1
          participantCount = 1;

          // If host has partner, add 1
          if (event.hostPartnerId) {
            participantCount += 1;
          }

          // Add approved challengers (each application = 1 or 2 depending on partner)
          approvedApps.forEach(app => {
            // Skip if this is the host's partner application
            if (app.applicantId !== event.hostPartnerId) {
              participantCount += 1; // Challenger
              if (isDoubles && app.partnerId) {
                participantCount += 1; // Challenger's partner
              }
            }
          });
        } else {
          // Club events - just count approved applications
          participantCount = approvedApps.length;
        }

        event.participants = participantCount;

        // 🎯 [KIM FIX] Set challenger team info (first approved non-host application)
        const challengerApp = approvedApps.find(app => app.applicantId !== event.hostPartnerId);
        if (challengerApp) {
          event.challengerName = challengerApp.applicantName;
          event.challengerId = challengerApp.applicantId;
          event.challengerPartnerName = challengerApp.partnerName;
          event.challengerPartnerId = challengerApp.partnerId;
        }

        // 🎯 [KIM FIX] Check if recruitment is complete
        event.isRecruitmentComplete = participantCount >= event.maxParticipants;
      });
    } catch (error) {
      // 🔇 [KIM FIX] 새 유저 온보딩 중 권한 에러는 조용히 처리
      const firebaseError = error as { code?: string; message?: string };
      const isPermissionError =
        firebaseError?.code === 'permission-denied' ||
        firebaseError?.message?.includes('Missing or insufficient permissions');
      if (isPermissionError) {
        console.log(
          '🔒 Participant count update skipped (user may be in onboarding or signed out)'
        );
      } else {
        console.warn('⚠️ Error updating event participant counts:', error);
      }
    }
  };

  // 🔄 REMOVED: loadEvents function - events now load reactively via subscription

  // 🔄 REACTIVE: No more manual refresh - data updates automatically via subscriptions
  const refreshData = async () => {
    // Data refreshes automatically through real-time subscriptions
    // This function maintained for compatibility but does nothing
  };

  // Search data
  const searchData = (query: string) => {
    setSearchQuery(query);
  };

  // 🚀 PURE REACTIVE PIPELINE: Complete data-driven distance calculation 🚀
  const filteredResults = useMemo(() => {
    // 💥 UNIFIED LOCATION ACCESS: Single source of truth from AuthContext 💥
    const userLocation = user?.profile?.location || user?.location;

    // 🏭 DISCOVERY FACTORY: CCTV LOGGING FOR DEBUGGING
    // // console.log('--- 🏭 DISCOVERY FACTORY: LOCATION CHECK ---');
    console.log('  - User Location:', userLocation);
    console.log('  - User Profile Location:', user?.profile?.location);
    console.log('  - User Root Location:', user?.location);
    console.log('  - Filter Type:', filterType);

    let results: (Player | Club | Event | CoachLesson | PickleballService)[] = [];

    // 🎯 [KIM FIX v3] 위치 없는 사용자는 모든 데이터 필터아웃 - 위치 기반 서비스 필수
    if (!userLocation) {
      console.log(
        '🚫 [DISCOVERY] No user location - returning empty results (location-based service)'
      );
      return [];
    }

    // 🔍 2. Pure Functional Data Processing Pipeline
    if (filterType === 'players') {
      results = players
        .map(player => {
          const playerLocation = player.profile?.location || player.location;
          const distance = userLocation
            ? calculateSafeDistance(userLocation, playerLocation)
            : null;

          // 🌍 [KIM FIX] Format distance based on user's country (km/mi)
          const userCountry = user?.profile?.location?.country;
          const formattedDistance =
            distance !== null ? formatDistance(distance, userCountry) : null;

          return {
            ...player,
            distance,
            formattedDistance,
          };
        })
        .filter(player => {
          // 🎯 [KIM UPDATE] 위치 없으면 모든 플레이어 표시 (전역)
          if (!userLocation) {
            console.log('  - No user location, showing all players globally');
            return true; // Show all players when user has no location
          }

          // Distance filtering with user's max travel distance (when user has location)
          if (player.distance === null) return false;
          const maxDistanceKm = (user?.maxTravelDistance || 25) * 1.60934; // Convert miles to km
          return player.distance <= maxDistanceKm;
        });
    } else if (filterType === 'clubs') {
      // 🏭 CCTV: Club Processing Pipeline
      // // console.log(`--- 🏭 DISCOVERY FACTORY: CLUB PROCESSING ---`);
      console.log(`  - Total Raw Clubs: ${clubs.length}`);

      results = clubs
        .map(club => {
          // 🎯 [KIM FIX] Check multiple location sources:
          // 1. profile.courtAddress.coordinates (new format from Club Settings)
          // 2. club.location (legacy format)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clubAny = club as any;
          const courtCoords = clubAny.profile?.courtAddress?.coordinates;
          const clubLocation = courtCoords
            ? { lat: courtCoords.lat, lng: courtCoords.lng }
            : club.location;
          const distance = userLocation ? calculateSafeDistance(userLocation, clubLocation) : null;

          // 🏭 CCTV: Sample club processing details
          if (club.name.includes('토요타') || (Array.isArray(clubs) && clubs.indexOf(club) === 0)) {
            console.log(`  - Processing '${club.name}':`);
            console.log(`    • Club location:`, clubLocation);
            console.log(`    • Court coords:`, courtCoords);
            console.log(`    • Calculated distance:`, distance);
          }

          return {
            ...club,
            distance,
          };
        })
        .filter(club => {
          // If no user location, skip distance filtering but apply other filters
          if (!userLocation) {
            console.log(`  - No user location, showing club without distance filter`);
            // Still apply search filter even without location
          } else {
            // Distance filtering only when user location exists
            if (club.distance === null) {
              console.log(`  - Club '${club.name}' has null distance, excluding`);
              return false;
            }
            const maxDistanceKm = (user?.maxTravelDistance || 25) * 1.60934;
            const passesDistanceFilter = club.distance <= maxDistanceKm;

            if (!passesDistanceFilter) {
              console.log(
                `  - Club '${club.name}' too far: ${club.distance}km > ${maxDistanceKm}km`
              );
              return false;
            }
          }

          // Search query filtering
          if (searchQuery.trim()) {
            const queryLower = searchQuery.toLowerCase();
            const matchesSearch =
              club.name.toLowerCase().includes(queryLower) ||
              club.description.toLowerCase().includes(queryLower) ||
              (club.cityName && club.cityName.toLowerCase().includes(queryLower));

            if (!matchesSearch) {
              return false;
            }
          }

          return true;
        });

      // 🏭 CCTV: Final Output Summary
      // // console.log(`--- 🏭 DISCOVERY FACTORY: CLUB OUTPUT ---`);
      console.log(`  - Clubs After Processing: ${results.length}`);
      if (results.length > 0 && results[0] && 'name' in results[0]) {
        console.log(`  - Sample Output (First Club):`, {
          name: results[0].name,
          distance: results[0].distance,
          location: results[0].location,
        });
      }
    } else if (filterType === 'events') {
      results = events
        .map(event => {
          // 🎯 [KIM FIX] Use locationDetails (with coordinates) first, fallback to location (for legacy events)
          // locationDetails can have: { latitude, longitude } OR { coordinates: { lat, lng } }
          const rawLocationDetails = event.locationDetails;
          let eventLocation:
            | { latitude?: number; longitude?: number; lat?: number; lng?: number }
            | string
            | null = null;

          if (rawLocationDetails && typeof rawLocationDetails === 'object') {
            // Check if coordinates are nested under 'coordinates' key (placeDetails format)
            const coords = (rawLocationDetails as { coordinates?: { lat?: number; lng?: number } })
              .coordinates;
            if (coords && (coords.lat !== undefined || coords.lng !== undefined)) {
              eventLocation = { lat: coords.lat, lng: coords.lng };
            } else {
              // Direct coordinates (locationDetails format)
              eventLocation = rawLocationDetails as { latitude?: number; longitude?: number };
            }
          } else {
            eventLocation = event.location; // Fallback to string location
          }

          const distance =
            typeof eventLocation === 'object' && eventLocation !== null
              ? calculateSafeDistance(userLocation, eventLocation)
              : null;

          let enrichedClubName = '';
          let eventTypeLabel = 'Public Match'; // Default for public events

          // Check if event has a clubId to join with club data
          if (event.id && clubs.length > 0) {
            // Try to find club by matching logic - events might store clubId differently
            // First, check if any event properties suggest a club association
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const eventData = event as any; // Access raw event data for club ID extraction
            /* eslint-enable @typescript-eslint/no-explicit-any */
            const possibleClubId = eventData.clubId || eventData.club_id || eventData.organizerId;

            if (possibleClubId) {
              const associatedClub = clubs.find(
                club =>
                  club.id === possibleClubId ||
                  club.name === event.clubName || // Fallback: match by existing name
                  (club.name &&
                    event.clubName &&
                    club.name.toLowerCase().includes(event.clubName.toLowerCase()) &&
                    event.clubName !== 'Unknown Club')
              );

              if (associatedClub) {
                enrichedClubName = associatedClub.name;
                eventTypeLabel = 'Club Event';
              }
            }
          }

          // Handle events without valid club association
          if (!enrichedClubName) {
            if (event.clubName && event.clubName !== 'Unknown Club') {
              // Keep existing valid club name
              enrichedClubName = event.clubName;
              eventTypeLabel = 'Club Event';
            } else {
              // Apply public match/meetup label based on event type
              const isPublicMeetup = event.type === 'meetup';
              enrichedClubName = isPublicMeetup ? 'Practice & Social' : 'Public Match';
              eventTypeLabel = isPublicMeetup ? 'Practice & Social' : 'Public Match';
            }
          }

          // 🎯 [KIM FIX] Get host's LIVE NTRP from players array (Firestore current data)
          // This fixes the issue where hostLtrLevel shows stale data from event creation time
          let liveHostNtrp = event.hostLtrLevel; // Default to stored value
          if (event.hostId) {
            const hostPlayer = players.find(p => p.id === event.hostId);
            if (hostPlayer) {
              // Select LPR based on gameType
              const gameType = event.gameType?.toLowerCase() || 'singles';
              if (gameType.includes('mixed')) {
                liveHostNtrp = hostPlayer.mixedLtr || hostPlayer.singlesLtr || liveHostNtrp;
              } else if (gameType.includes('doubles')) {
                liveHostNtrp = hostPlayer.doublesLtr || hostPlayer.singlesLtr || liveHostNtrp;
              } else {
                liveHostNtrp = hostPlayer.singlesLtr || liveHostNtrp;
              }
            }
          }

          return {
            ...event,
            clubName: enrichedClubName,
            eventTypeLabel,
            distance,
            hostLtrLevel: liveHostNtrp, // 🎯 Use live NTRP from Firestore
          };
        })
        .filter(event => {
          // 🎯 [KIM FIX] Hide non-public events from discovery
          // isPublic: false = hidden from discovery (but may still have friend invitations)
          if (event.isPublic === false) {
            console.log(`🔒 Event '${event.title}' hidden: not public`);
            return false;
          }

          // 🎯 [KIM FIX] 시작 후 2시간이 지난 번개모임만 숨김 (기록경기 제외)
          // 번개모임 = type: 'meetup' 또는 eventTypeLabel: 'Practice & Social'
          const isMeetup = event.type === 'meetup' || event.eventTypeLabel === 'Practice & Social';
          if (isMeetup) {
            const eventStartTime = event.date?.getTime?.() || 0;
            const now = Date.now();
            const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2시간 (밀리초)
            if (eventStartTime > 0 && now > eventStartTime + TWO_HOURS_MS) {
              const hoursSinceStart = (now - eventStartTime) / (1000 * 60 * 60);
              console.log(
                `⏰ Meetup '${event.title}' hidden: started ${hoursSinceStart.toFixed(1)} hours ago`
              );
              return false;
            }
          }

          // 🎯 [FULL AT] 마감 후 24시간 지난 이벤트 숨김
          if (event.fullAt) {
            const fullAtTime = event.fullAt.getTime();
            const now = Date.now();
            const hoursSinceFull = (now - fullAtTime) / (1000 * 60 * 60);

            if (hoursSinceFull >= 24) {
              console.log(
                `🔒 Event '${event.title}' hidden: full for ${hoursSinceFull.toFixed(1)} hours`
              );
              return false;
            }
          }

          // 🎯 [KIM FIX] 완료된 이벤트는 탐색에서 즉시 제거 (Activity 탭에서만 표시)
          if (event.status === 'completed' || event.matchResult) {
            console.log(
              `🏆 Completed event '${event.title}' hidden from discovery (status: ${event.status})`
            );
            return false;
          }

          // 🎯 [KIM UPDATE] 사용자 위치 없으면 모든 이벤트 표시 (전역)
          if (!userLocation) {
            console.log('  - No user location, showing all events globally');
            return true; // Show all events when user has no location
          }

          // 🎯 [KIM FIX] 위치 정보 없는 이벤트는 제외 (데이터 정합성) - only when user has location
          if (event.distance === null) {
            console.log(`🗺️ Event '${event.title}' has no location data, excluding`);
            return false; // 위치 정보 없으면 제외
          }
          const maxDistanceKm = (user?.maxTravelDistance || 25) * 1.60934;
          const withinDistance = event.distance <= maxDistanceKm;
          if (!withinDistance) {
            console.log(
              `📏 Event '${event.title}' filtered out: ${event.distance}km > ${maxDistanceKm}km`
            );
          }
          return withinDistance;
        });
    } else if (filterType === 'coaches') {
      // 📚 Coach Lessons Processing Pipeline
      console.log(`--- 🏭 DISCOVERY FACTORY: COACH LESSONS PROCESSING ---`);
      console.log(`  - Total Raw Lessons: ${lessons.length}`);

      results = lessons
        .filter(lesson => {
          // 🎯 [KIM FIX v2] 좌표가 없는 레슨은 필터아웃 (필수 요구사항)
          if (!lesson.coordinates) {
            console.log(`  - Lesson '${lesson.title}' filtered out: NO COORDINATES`);
            return false;
          }
          return true;
        })
        .map(lesson => {
          // Calculate distance using coordinates
          const lessonLocation = lesson.coordinates;
          const distance =
            userLocation && lessonLocation
              ? calculateSafeDistance(userLocation, lessonLocation)
              : null;

          return {
            ...lesson,
            distance,
          };
        })
        .filter(lesson => {
          // 거리 필터링 적용
          if (lesson.distance !== null && userLocation) {
            const maxDistanceKm = (user?.maxTravelDistance || 25) * 1.60934;
            const passesDistanceFilter = lesson.distance <= maxDistanceKm;

            if (!passesDistanceFilter) {
              console.log(
                `  - Lesson '${lesson.title}' too far: ${lesson.distance}km > ${maxDistanceKm}km`
              );
              return false;
            }
          }

          return true;
        }) as (Player | Club | Event | CoachLesson | PickleballService)[];

      console.log(`  - Lessons After Processing: ${results.length}`);
    } else if (filterType === 'services') {
      // 🛠️ Pickleball Services Processing Pipeline
      console.log(`--- 🏭 DISCOVERY FACTORY: PICKLEBALL SERVICES PROCESSING ---`);
      console.log(`  - Total Raw Services: ${services.length}`);

      results = services
        .filter(service => {
          // 🎯 [KIM FIX v2] 좌표가 없는 서비스는 필터아웃 (필수 요구사항)
          if (!service.coordinates) {
            console.log(`  - Service '${service.title}' filtered out: NO COORDINATES`);
            return false;
          }
          return true;
        })
        .map(service => {
          // Calculate distance using coordinates
          const serviceLocation = service.coordinates;
          const distance =
            userLocation && serviceLocation
              ? calculateSafeDistance(userLocation, serviceLocation)
              : null;

          return {
            ...service,
            distance,
          };
        })
        .filter(service => {
          // 거리 필터링 적용
          if (service.distance !== null && userLocation) {
            const maxDistanceKm = (user?.maxTravelDistance || 25) * 1.60934;
            const passesDistanceFilter = service.distance <= maxDistanceKm;

            if (!passesDistanceFilter) {
              console.log(
                `  - Service '${service.title}' too far: ${service.distance}km > ${maxDistanceKm}km`
              );
              return false;
            }
          }

          return true;
        }) as (Player | Club | Event | CoachLesson | PickleballService)[];

      console.log(`  - Services After Processing: ${results.length}`);
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      results = results.filter(item => {
        if ('name' in item) {
          // Player or Club
          return (
            item.name.toLowerCase().includes(searchTerm) ||
            ('bio' in item && item.bio.toLowerCase().includes(searchTerm)) ||
            ('description' in item && item.description.toLowerCase().includes(searchTerm))
          );
        } else if ('title' in item) {
          // Event or Lesson
          const hasClubName = 'clubName' in item;
          const hasAuthorName = 'authorName' in item;

          if (hasClubName) {
            // Event
            return (
              item.title.toLowerCase().includes(searchTerm) ||
              (item as Event).clubName.toLowerCase().includes(searchTerm) ||
              item.location.toLowerCase().includes(searchTerm) ||
              (item.description && item.description.toLowerCase().includes(searchTerm))
            );
          } else if (hasAuthorName) {
            // Lesson or Service (both have authorName)
            const itemWithAuthor = item as CoachLesson | PickleballService;
            const hasLocation = 'location' in itemWithAuthor && itemWithAuthor.location;
            return (
              item.title.toLowerCase().includes(searchTerm) ||
              itemWithAuthor.authorName.toLowerCase().includes(searchTerm) ||
              (hasLocation &&
                typeof itemWithAuthor.location === 'string' &&
                itemWithAuthor.location.toLowerCase().includes(searchTerm)) ||
              (item.description && item.description.toLowerCase().includes(searchTerm))
            );
          }
        }
        return false;
      });
    }

    // Apply skill filter (for players and events)
    // 🎯 [KIM FIX] Updated to use NTRP-based filtering
    // NTRP Ranges: Beginner(1.0-2.5), Intermediate(2.5-3.5), Advanced(3.5-4.5), Expert(4.5+)
    if (skillFilter !== 'all') {
      results = results.filter(item => {
        // For events with skill level string
        if ('skillLevel' in item && typeof item.skillLevel === 'string') {
          return item.skillLevel === skillFilter;
        }

        // 🎯 [KIM FIX v19] Get LPR value from player data
        let ntrpValue: number | undefined;

        // Priority 1: singlesLtr (most reliable - 1-10 scale)
        if ('singlesLtr' in item && typeof item.singlesLtr === 'number') {
          ntrpValue = item.singlesLtr;
        }
        // Priority 2: skillLevel object with calculated value
        else if (
          'skillLevel' in item &&
          typeof item.skillLevel === 'object' &&
          item.skillLevel !== null
        ) {
          const sl = item.skillLevel as {
            calculated?: number;
            selfAssessed?: string;
            confidence?: number;
          };
          if (sl.calculated && sl.confidence && sl.confidence > 0.7) {
            ntrpValue = sl.calculated;
          } else if (sl.selfAssessed) {
            // Parse selfAssessed range (e.g., "3.0-3.5" -> 3.0)
            ntrpValue = parseFloat(sl.selfAssessed.split('-')[0]);
          }
        }

        // If no NTRP value found, exclude from filtered results
        if (!ntrpValue) {
          return false;
        }

        // 🎯 [KIM FIX] NTRP-based skill level mapping
        switch (skillFilter) {
          case 'beginner':
            return ntrpValue < 2.5; // 1.0 - 2.5
          case 'intermediate':
            return ntrpValue >= 2.5 && ntrpValue < 3.5; // 2.5 - 3.5
          case 'advanced':
            return ntrpValue >= 3.5 && ntrpValue < 4.5; // 3.5 - 4.5
          case 'expert':
            return ntrpValue >= 4.5; // 4.5+
          default:
            return true;
        }
      });
    }

    // Apply distance filter with LENIENT policy for Discovery screen visibility
    results = results.filter(item => {
      // 🎯 [KIM FIX] 코치 레슨과 서비스는 좌표 없어도 표시 (이미 필터링 완료)
      const isCoachOrService = 'authorId' in item && 'authorName' in item;
      if (isCoachOrService) {
        // 코치 레슨/서비스는 거리 필터 이미 적용됨 - 좌표 없는 경우도 통과
        if ('distance' in item && typeof item.distance === 'number' && isFinite(item.distance)) {
          return item.distance <= distanceFilter;
        }
        return true; // 좌표 없는 레슨/서비스도 표시
      }

      if ('distance' in item && typeof item.distance === 'number' && isFinite(item.distance)) {
        const passed = item.distance <= distanceFilter;
        if (!passed) {
          const itemName = 'title' in item ? item.title : 'name' in item ? item.name : 'Unknown';
          console.log(
            `📏 Final filter: ${itemName} excluded - distance ${item.distance} > ${distanceFilter}`
          );
        }
        return passed;
      }
      // 🎯 [KIM FIX] 거리 정보 없는 아이템은 제외 (데이터 정합성) - 코치 레슨 제외
      const itemName = 'title' in item ? item.title : 'name' in item ? item.name : 'Unknown';
      console.log(`🗺️ Final filter: ${itemName} has no distance data, excluding`);
      return false; // 거리 정보 없으면 제외
    });

    // 🎯 [KIM FIX v2] 탭별 정렬 기준 분리
    // - events: 날짜순 (최신 먼저) - scheduledTime 기준
    // - players, clubs, coaches(lessons), services: 거리순 (가까운 순)
    if (filterType === 'events') {
      results = results.sort((a, b) => {
        const aTime =
          'scheduledTime' in a && a.scheduledTime ? new Date(a.scheduledTime as string | number | Date).getTime() : 0;
        const bTime =
          'scheduledTime' in b && b.scheduledTime ? new Date(b.scheduledTime as string | number | Date).getTime() : 0;
        return bTime - aTime; // 내림차순 (최신 것 먼저)
      });
    } else {
      results = results.sort((a, b) => {
        const aDistance = 'distance' in a && typeof a.distance === 'number' ? a.distance : Infinity;
        const bDistance = 'distance' in b && typeof b.distance === 'number' ? b.distance : Infinity;
        return aDistance - bDistance; // 오름차순 (가까운 것 먼저)
      });
    }

    return results;
  }, [
    // 📊 Raw data arrays
    players,
    clubs,
    events,
    lessons,
    services,
    // 🎯 Filter states
    filterType,
    searchQuery,
    skillFilter,
    distanceFilter,
    // 🌍 UNIFIED User location for distance calculation - AuthContext single source of truth
    user?.profile?.location,
    user?.location, // Added fallback location path
    user?.maxTravelDistance,
  ]);

  // 🔄 REACTIVE: No manual data loading - all data loads automatically via subscriptions

  // Update distance filter based on user preference
  useEffect(() => {
    if (user?.maxTravelDistance) {
      // Convert miles to km for internal calculations
      setDistanceFilter(user.maxTravelDistance * 1.60934);
    }
  }, [user?.maxTravelDistance]);

  const value: DiscoveryContextType = {
    players,
    clubs,
    events,
    lessons,
    services,
    filteredResults,
    isLoading,
    refreshing,
    filterType,
    searchQuery,
    skillFilter,
    distanceFilter,
    setFilterType,
    setSearchQuery,
    setSkillFilter,
    setDistanceFilter,
    refreshData,
    searchData,
  };

  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
};

// Custom hook for using DiscoveryContext
export const useDiscovery = (): DiscoveryContextType => {
  const context = useContext(DiscoveryContext);
  if (context === undefined) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
};

export default DiscoveryContext;
