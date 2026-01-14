/**
 * HostedEventCard - Reusable component for displaying hosted event cards
 * Used in the "My Activities" -> "Hosted" tab
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from 'react-native-paper';
import {
  onSnapshot,
  doc,
  getDoc,
  DocumentSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import * as Localization from 'expo-localization';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLightningPickleballTheme } from '../../theme';
import { db } from '../../firebase/config';
import PublicMatchScoreModal from '../match/PublicMatchScoreModal';
import { participationApplicationService } from '../../services/participationApplicationService';
import weatherService from '../../services/weatherService';
import userService from '../../services/userService';
import { convertEloToLtr } from '../../utils/ltrUtils';

// Type definitions matching cards/EventCard interface
interface SimpleEvent {
  id: string;
  title: string;
  clubName: string;
  date: Date;
  time: string;
  location: string;
  distance: number | null;
  participants: number;
  maxParticipants: number;
  skillLevel: string;
  type: 'lightning' | 'practice' | 'tournament' | 'meetup' | 'match';
  description?: string;
}

export interface PendingApplication {
  id: string;
  applicantName: string;
  applicantId?: string;
  message?: string;
  appliedAt: Date;
  applicantNtrp?: number; // 🎯 [KIM FIX] Applicant's NTRP for display
}

export interface ApprovedApplication extends PendingApplication {
  applicantId: string;
  partnerId?: string;
  partnerName?: string; // 🎯 [KIM FIX] Partner name for doubles team display
  teamId?: string;
  // 🎯 [KIM FIX] LPR fields for team display
  applicantLtr?: number;
  partnerLtr?: number;
  teamLtr?: number;
}

export interface TeamApplicationGroup {
  teamId: string;
  members: Array<{
    id: string;
    applicantName: string;
    applicantId: string;
  }>;
  // 🔧 [FIX] Add direct applicant and partner names from document
  applicantName: string;
  partnerName: string;
  // 🎾 [LPR FIX] Add applicantId and partnerId for LPR lookup
  applicantId: string;
  partnerId?: string;
  // 🎾 [KIM FIX] Add LPR (NTRP) values for team display (deprecated - use userLtrMap instead)
  applicantNtrp?: number;
  partnerNtrp?: number;
  status: 'pending' | 'approved' | 'rejected';
  partnerStatus: 'pending' | 'accepted' | 'rejected';
}

// 🌤️ Weather data interface
interface WeatherData {
  temperature: number;
  temperatureF: number;
  condition: string;
  icon: string;
  chanceOfRain: number;
  humidity?: number;
  windSpeed?: number;
  lastUpdated: Date;
  source: string;
}

export interface HostedEvent extends SimpleEvent {
  pendingApplications?: PendingApplication[];
  approvedApplications?: ApprovedApplication[];
  chatUnreadCount?: { [userId: string]: number };
  gameType?: string;
  currentParticipants?: number; // 🌤️ [KIM FIX] Current participant count
  status?:
    | 'upcoming'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'partner_pending'
    | 'recruiting'
    | 'pending_acceptance'; // 🎯 Phase 4: Added partner_pending, recruiting
  matchResult?: {
    score: { finalScore: string };
    winnerId: string;
    hostResult: 'win' | 'loss';
    opponentResult: 'win' | 'loss';
  };
  hostId?: string;
  hostName?: string;
  hostPartnerId?: string;
  hostPartnerName?: string;
  // 🎯 [KIM FIX] LPR fields for host team display
  hostLtr?: number;
  hostPartnerLtr?: number;
  partnerAccepted?: boolean; // 🎯 Phase 4: Partner acceptance status
  partnerStatus?: 'pending' | 'accepted' | 'rejected'; // 🛡️ [CAPTAIN AMERICA] Partner status (pending/accepted/rejected)
  lastRejectedPartnerName?: string; // 🛡️ [CAPTAIN AMERICA] Name of rejected partner (legacy)
  lastRejectedPartnerId?: string; // 🛡️ [CAPTAIN AMERICA] ID of rejected partner (legacy)
  lastRejectedAt?: Date; // 🛡️ [CAPTAIN AMERICA] When partner was rejected (legacy)
  rejectedPartners?: Array<{
    // 🆕 [KIM] Array of all rejected partners
    partnerId: string;
    partnerName?: string;
    rejectedAt: Date;
  }>;
  applicantName?: string; // 🏆 Opponent name for match result display
  // 🌤️ Weather and location coordinates
  coordinates?: { lat: number; lng: number };
  placeDetails?: { coordinates?: { lat: number; lng: number } }; // 🌤️ [KIM FIX] Firestore uses placeDetails
  // 🆕 [KIM] Full location details from Cloud Function
  locationDetails?: {
    coordinates?: { lat: number; lng: number };
    city?: string;
    state?: string;
    country?: string;
  };
  lastWeather?: WeatherData; // 완료된 경기의 마지막 날씨 데이터
  // 🎯 [FRIEND INVITE] Friend invitation related fields
  isInviteOnly?: boolean; // 초대 전용 이벤트
  invitedFriends?: string[]; // 초대된 친구 ID 배열
  friendInvitations?: Array<{
    userId: string;
    userName?: string; // Will be fetched
    status: 'pending' | 'accepted' | 'rejected';
    invitedAt: string;
  }>;
  // 🆕 [3개월 규칙] Ranked match flag
  isRankedMatch?: boolean; // false = 친선경기 (기록에 반영 안됨)
}

interface HostedEventCardProps {
  event: HostedEvent;
  currentUserId?: string;
  onEditEvent?: (eventId: string) => void;
  onCancelEvent?: (eventId: string) => void;
  onOpenChat?: (eventId: string, eventTitle: string) => void;
  onApproveApplication?: (applicationId: string, applicantName: string) => void;
  onRejectApplication?: (applicationId: string, applicantName: string) => void;
  onReinvite?: (eventId: string, gameType?: string) => void; // 🛡️ [CAPTAIN AMERICA] Re-invite rejected partner
  onSetLocationTime?: (eventId: string, eventTitle: string) => void; // ⚡ 퀵 매치 장소/시간 설정
  onRefresh?: () => void;
  onPlayerPress?: (playerId: string) => void; // 🎯 [KIM FIX] Navigate to player profile
  style?: object;
}

const HostedEventCard: React.FC<HostedEventCardProps> = ({
  event,
  currentUserId,
  onEditEvent,
  onCancelEvent,
  onOpenChat,
  onApproveApplication,
  onRejectApplication,
  onReinvite, // 🛡️ [CAPTAIN AMERICA] Re-invite rejected partner
  onSetLocationTime,
  onRefresh,
  onPlayerPress, // 🎯 [KIM FIX] Navigate to player profile
  style,
}) => {
  const [processingApplications, setProcessingApplications] = useState(new Set<string>());
  const [scoreInputModalVisible, setScoreInputModalVisible] = useState(false);
  const { theme: currentTheme } = useTheme();
  const { t } = useLanguage();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors, currentTheme);

  // 🆕 Firestore에서 실시간으로 가져온 데이터를 로컬 state로 관리
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(0);
  const [localGameType, setLocalGameType] = useState<string | undefined>(event.gameType);
  const [localApprovedApplications, setLocalApprovedApplications] = useState<ApprovedApplication[]>(
    event.approvedApplications || []
  );
  const [localMatchResult, setLocalMatchResult] = useState<unknown>(event.matchResult);
  const [localHostName, setLocalHostName] = useState<string>(event.hostName || '');
  const [teamApplications, setTeamApplications] = useState<TeamApplicationGroup[]>([]);

  // 🌤️ Weather state
  const [weather, setWeather] = useState<WeatherData | null>(event.lastWeather || null);
  // 🌤️ [KIM FIX] Local state for placeDetails from Firestore (for weather coordinates)
  const [localPlaceDetails, setLocalPlaceDetails] = useState<
    { coordinates?: { lat: number; lng: number } } | undefined
  >(event.placeDetails);

  // 🎯 [FRIEND INVITE] Local state for friend invitations with fetched user names
  const [localFriendInvitations, setLocalFriendInvitations] = useState<
    Array<{
      userId: string;
      userName: string;
      status: 'pending' | 'accepted' | 'rejected';
      invitedAt: string;
    }>
  >([]);

  // 🎯 [KIM FIX] Applicant NTRP map for display (applicantId → ntrp)
  const [applicantNtrpMap, setApplicantNtrpMap] = useState<Record<string, number>>({});

  // 🎾 [LPR FIX] userId -> LPR 매핑 상태 (팀 신청 목록용)
  const [userLtrMap, setUserLtrMap] = useState<Record<string, number>>({});

  // 🎯 [KIM FIX] userId -> displayName 매핑 (항상 최신 닉네임 표시용)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  // 점수 입력 가능 조건 (로컬 state 사용)
  const canSubmitScore = useMemo(() => {
    // 🆕 [3개월 규칙] 친선경기면 점수 입력 불가
    if (event.isRankedMatch === false) {
      console.log('❌ [HostedEventCard] Score input blocked: Friendly match (3-month cooldown)');
      return false;
    }

    // 🔍 DEBUG: Check all conditions
    console.log('🎯 [HostedEventCard] canSubmitScore check:', {
      eventId: event.id,
      eventTitle: event.title,
      hasMatchResult: !!localMatchResult,
      gameType: localGameType,
      approvedApplicationsCount: localApprovedApplications?.length || 0,
      approvedApplications: localApprovedApplications,
    });

    // 이미 점수 제출됨 또는 Rally 경기 → 불가
    if (localMatchResult || localGameType === 'rally') {
      console.log('❌ [HostedEventCard] Score input blocked:', {
        reason: localMatchResult ? 'Already submitted' : 'Rally match',
      });
      return false;
    }

    const approved = localApprovedApplications || [];

    if (localGameType?.includes('singles')) {
      // 단식: 승인된 참가자 1명
      const result = approved.length === 1;
      console.log('✅ [HostedEventCard] Singles check:', {
        approved: approved.length,
        canSubmit: result,
      });
      return result;
    } else {
      // 🔧 [FIX] 복식: 승인된 참가자 2명 이상이면 점수 입력 가능
      // 이전 로직: teamId/partnerId 매칭 필요 (너무 엄격함)
      // 새 로직: 2명 이상 승인되면 OK
      const result = approved.length >= 2;
      console.log('✅ [HostedEventCard] Doubles check:', {
        approved: approved.length,
        canSubmit: result,
      });
      return result;
    }
  }, [
    event.isRankedMatch,
    localGameType,
    localApprovedApplications,
    localMatchResult,
    event.id,
    event.title,
  ]);

  useEffect(() => {
    if (!event.id) return;

    console.log('🔥 [HostedEventCard] Setting up ENHANCED Firestore listener for event:', event.id);

    const eventRef = doc(db, 'events', event.id);
    const unsubscribe = onSnapshot(
      eventRef,
      async (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // 🆕 Update ALL local states from Firestore
          const unreadCount = data?.chatUnreadCount?.[currentUserId || ''] || 0;
          const gameType = data?.gameType;
          const matchResult = data?.matchResult;
          const hostName = data?.hostName;
          const hostId = data?.hostId;

          setLocalUnreadCount(unreadCount);
          setLocalGameType(gameType);
          setLocalMatchResult(matchResult);

          // 🌤️ [KIM FIX] Update placeDetails from Firestore for weather coordinates
          const placeDetails = data?.placeDetails;
          const locationDetails = data?.locationDetails;
          console.log('🌤️ [HostedEventCard] Events document location data:', {
            eventId: event.id,
            hasPlaceDetails: !!placeDetails,
            hasLocationDetails: !!locationDetails,
            locationDetailsStructure: locationDetails ? JSON.stringify(locationDetails) : null,
          });
          if (placeDetails?.coordinates) {
            console.log('🌤️ [HostedEventCard] Using placeDetails for weather');
            setLocalPlaceDetails(placeDetails);
          } else if (locationDetails) {
            // 🌤️ [KIM FIX] Fallback to locationDetails if placeDetails not available
            // locationDetails might have coordinates directly or in nested structure
            const coords =
              locationDetails.coordinates ||
              (locationDetails.lat && locationDetails.lng
                ? { lat: locationDetails.lat, lng: locationDetails.lng }
                : null);
            if (coords) {
              console.log('🌤️ [HostedEventCard] Using locationDetails for weather:', coords);
              setLocalPlaceDetails({ coordinates: coords });
            } else {
              console.log(
                '⚠️ [HostedEventCard] locationDetails has no coordinates:',
                locationDetails
              );
            }
          }

          // 🎯 [FRIEND INVITE] Fetch friend invitations and their display names
          const friendInvitations = data?.friendInvitations as
            | Array<{ userId: string; status: string; invitedAt: string }>
            | undefined;
          if (friendInvitations && friendInvitations.length > 0) {
            console.log('🎯 [HostedEventCard] Friend invitations found:', friendInvitations.length);
            try {
              // Fetch display names for all invited friends
              const invitationsWithNames = await Promise.all(
                friendInvitations.map(async invitation => {
                  try {
                    const userDoc = await getDoc(doc(db, 'users', invitation.userId));
                    const userName = userDoc.exists()
                      ? userDoc.data()?.displayName || t('cards.hostedEvent.unknown')
                      : t('cards.hostedEvent.unknown');
                    return {
                      userId: invitation.userId,
                      userName,
                      status: invitation.status as 'pending' | 'accepted' | 'rejected',
                      invitedAt: invitation.invitedAt,
                    };
                  } catch {
                    return {
                      userId: invitation.userId,
                      userName: t('cards.hostedEvent.unknown'),
                      status: invitation.status as 'pending' | 'accepted' | 'rejected',
                      invitedAt: invitation.invitedAt,
                    };
                  }
                })
              );
              setLocalFriendInvitations(invitationsWithNames);
              console.log('✅ [HostedEventCard] Friend invitations loaded:', invitationsWithNames);
            } catch (error) {
              console.error('❌ [HostedEventCard] Error fetching friend names:', error);
              setLocalFriendInvitations([]);
            }
          } else {
            setLocalFriendInvitations([]);
          }

          // 🆕 Fetch hostName from users collection if missing (backward compatibility)
          if (!hostName && hostId) {
            console.log(
              '🔍 [HostedEventCard] hostName missing, fetching from users collection:',
              hostId
            );
            try {
              const userRef = doc(db, 'users', hostId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userName = userSnap.data()?.displayName || 'Unknown Host';
                setLocalHostName(userName);
                console.log('✅ [HostedEventCard] hostName fetched from users:', userName);
              } else {
                console.warn('⚠️ [HostedEventCard] Host user not found:', hostId);
                setLocalHostName('Unknown Host');
              }
            } catch (error) {
              console.error('❌ [HostedEventCard] Error fetching host user:', error);
              setLocalHostName('Unknown Host');
            }
          } else if (hostName) {
            setLocalHostName(hostName);
          }

          // 🆕 Fetch ALL applications from participation_applications collection
          // (both approved and pending, to get locationDetails for weather)
          try {
            const allAppsQuery = query(
              collection(db, 'participation_applications'),
              where('eventId', '==', event.id)
            );
            const allAppsSnapshot = await getDocs(allAppsQuery);

            // 🌤️ [KIM FIX] Extract locationDetails from ANY application for weather
            // All applications for the same event share the same locationDetails
            let foundLocationDetails = false;
            for (const appDoc of allAppsSnapshot.docs) {
              const appData = appDoc.data();
              const locationDetails = appData?.locationDetails as
                | { coordinates?: { lat: number; lng: number } }
                | undefined;
              if (locationDetails?.coordinates && !foundLocationDetails) {
                console.log('🌤️ [HostedEventCard] Found locationDetails from application:', {
                  applicationId: appDoc.id,
                  coordinates: locationDetails.coordinates,
                });
                setLocalPlaceDetails(locationDetails);
                foundLocationDetails = true;
              }
            }

            // Filter only approved applications for display
            const approvedApps = allAppsSnapshot.docs
              .filter(doc => doc.data().status === 'approved')
              .map(doc => ({
                id: doc.id,
                ...doc.data(),
                appliedAt: doc.data().appliedAt?.toDate() || new Date(),
              })) as ApprovedApplication[];

            setLocalApprovedApplications(approvedApps);

            console.log('🔥 [HostedEventCard] All data updated from Firestore:', {
              eventId: event.id,
              gameType,
              hostName: hostName || localHostName,
              approvedCount: approvedApps.length,
              totalApplications: allAppsSnapshot.docs.length,
              foundLocationDetails,
              matchResult: !!matchResult,
              unreadCount,
            });
          } catch (error) {
            console.error('❌ [HostedEventCard] Error fetching applications:', error);
          }
        }
      },
      (error: Error) => {
        console.error('❌ [HostedEventCard] Firestore listener error:', error);
      }
    );

    return () => {
      console.log('🧹 [HostedEventCard] Cleaning up Firestore listener for event:', event.id);
      unsubscribe();
    };
    // 🔧 [FIX] Removed localHostName from dependencies to break the dependency cycle
    // localHostName is SET inside this effect, so including it causes infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, currentUserId]);

  // 🌤️ [KIM FIX] Firestore listener for placeDetails from lightning_events collection
  // This is needed because placeDetails is stored in lightning_events, not events collection
  useEffect(() => {
    if (!event.id) return;

    console.log(
      '🌤️ [HostedEventCard] Setting up lightning_events placeDetails listener for event:',
      event.id
    );

    const lightningEventRef = doc(db, 'lightning_events', event.id);
    const unsubscribe = onSnapshot(
      lightningEventRef,
      (snapshot: DocumentSnapshot) => {
        console.log('🌤️ [HostedEventCard] Lightning events snapshot received:', {
          eventId: event.id,
          exists: snapshot.exists(),
        });
        if (snapshot.exists()) {
          const data = snapshot.data();
          const placeDetails = data?.placeDetails;
          console.log('🌤️ [HostedEventCard] Lightning events data:', {
            hasPlaceDetails: !!placeDetails,
            hasCoordinates: !!placeDetails?.coordinates,
            placeDetails: placeDetails,
          });
          if (placeDetails?.coordinates) {
            console.log('🌤️ [HostedEventCard] Lightning events placeDetails found:', {
              hasCoordinates: !!placeDetails?.coordinates,
              coordinates: placeDetails?.coordinates,
            });
            setLocalPlaceDetails(placeDetails);
          }
        } else {
          console.log('⚠️ [HostedEventCard] Lightning event document not found for:', event.id);
        }
      },
      (error: Error) => {
        console.error('❌ [HostedEventCard] Lightning events placeDetails listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [event.id]);

  // 🆕 Real-time listener for team applications (복식 이벤트만)
  // 🔧 [FIX] Use both localGameType and event.gameType as fallback, with toLowerCase()
  // 🔧 [FIX] Memoize to prevent unnecessary listener re-setup
  const isDoublesEvent = useMemo(() => {
    return (
      localGameType?.toLowerCase().includes('doubles') ||
      event.gameType?.toLowerCase().includes('doubles')
    );
  }, [localGameType, event.gameType]);

  // 🔧 [KIM FIX v22c] 매치 타입별 ELO 키 구분: singles, doubles, mixed
  // - singles: 단식
  // - doubles: mens_doubles, womens_doubles
  // - mixed: mixed_doubles
  const matchEloType = useMemo((): 'singles' | 'doubles' | 'mixed' => {
    const gameType = (localGameType || event.gameType || '').toLowerCase();
    if (gameType.includes('mixed')) return 'mixed';
    if (gameType.includes('doubles')) return 'doubles';
    return 'singles';
  }, [localGameType, event.gameType]);

  // 🎯 [OPERATION SOLO LOBBY] Count looking_for_partner applications
  const [lookingForPartnerCount, setLookingForPartnerCount] = useState<number>(0);

  // 🎯 [KIM FIX v18] Fetch LPR for pending applicants using ELO-based conversion
  useEffect(() => {
    const pendingApps = event.pendingApplications || [];
    if (pendingApps.length === 0) return;

    const fetchApplicantLtr = async () => {
      const ltrMap: Record<string, number> = {};

      for (const app of pendingApps) {
        if (!app.applicantId) continue;

        try {
          const userDoc = await getDoc(doc(db, 'users', app.applicantId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            let ltr: number | null = null;

            // 🎯 [KIM FIX v19] 매치 타입에 따라 적절한 ELO 선택
            // - doubles/mixed_doubles → doubles.elo
            // - singles → singles.elo
            const gameType = (localGameType || event.gameType || '').toLowerCase();
            const isDoublesMatch = gameType.includes('doubles');

            // 🔧 [KIM FIX v20] eloRatings 우선! (실시간 업데이트 데이터)
            // 🎯 [KIM FIX v25] Use eloRatings only (Single Source of Truth)
            let matchTypeElo: number | undefined;
            if (isDoublesMatch) {
              // 복식: doubles ELO 사용
              matchTypeElo =
                userData?.eloRatings?.doubles?.current || userData?.eloRatings?.doubles;
            } else {
              // 단식: singles ELO 사용
              matchTypeElo =
                userData?.eloRatings?.singles?.current || userData?.eloRatings?.singles;
            }

            // Fallback: unifiedEloRating
            const playerElo = matchTypeElo || userData?.stats?.unifiedEloRating;

            if (playerElo && playerElo > 0) {
              ltr = convertEloToLtr(playerElo);
              console.log(
                `🎾 [HostedEventCard] ${app.applicantId}: ${isDoublesMatch ? 'Doubles' : 'Singles'} ELO ${playerElo} → LPR ${ltr}`
              );
            } else if (userData?.profile?.ltrLevel) {
              // Fallback: Use profile.ltrLevel directly (already 1-10 scale from onboarding)
              const profileLtr = userData.profile.ltrLevel;
              if (typeof profileLtr === 'number') {
                ltr = profileLtr;
              } else if (typeof profileLtr === 'string') {
                ltr = parseInt(profileLtr, 10);
              }
              console.log(`📋 [HostedEventCard] ${app.applicantId}: Profile LPR ${ltr} (no ELO)`);
            }

            if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
              ltrMap[app.applicantId] = ltr;
            }
          }
        } catch (error) {
          console.error('❌ [HostedEventCard] Error fetching applicant LPR:', error);
        }
      }

      setApplicantNtrpMap(ltrMap);
    };

    fetchApplicantLtr();
  }, [event.pendingApplications, localGameType, event.gameType]);

  // 🌤️ Fetch weather data with 15-minute auto-refresh
  // 조건: 점수 입력 전까지 표시 (meetup은 모임시간 + 2시간까지)
  useEffect(() => {
    // 🌤️ [KIM FIX] Convert event.date to proper Date object for comparison
    let eventDateObj: Date;
    if (event.date instanceof Date) {
      eventDateObj = event.date;
    } else if (typeof event.date === 'string') {
      eventDateObj = new Date(event.date);
    } else if (event.date && typeof (event.date as { toDate?: () => Date }).toDate === 'function') {
      eventDateObj = (event.date as { toDate: () => Date }).toDate();
    } else {
      eventDateObj = new Date(); // fallback to now
    }

    // 🌤️ [KIM FIX] 날씨 표시 조건 확인
    const isMatchCompleted = !!(localMatchResult || event.status === 'completed');
    const isMeetup = event.type?.toLowerCase() === 'meetup';
    const eventTime = eventDateObj.getTime();
    const twoHoursAfterEvent = eventTime + 2 * 60 * 60 * 1000;
    const meetupExpired = isMeetup && Date.now() > twoHoursAfterEvent;

    // 날씨 표시 중단 조건: 매치 완료 OR meetup 시간 + 2시간 경과
    const shouldStopShowingWeather = isMatchCompleted || meetupExpired;

    const fetchWeather = async () => {
      // 🌤️ [KIM FIX] 날씨 표시 중단 조건이면 fetch 안 함
      if (shouldStopShowingWeather) {
        console.log('🌤️ [HostedEventCard] Weather display stopped:', {
          isMatchCompleted,
          meetupExpired,
        });
        return false;
      }

      // 🌤️ [KIM FIX] Get coordinates from multiple possible locations (including local state from Firestore listener)
      console.log('🌤️ [HostedEventCard] Checking coordinates for event:', event.id, {
        hasCoordinates: !!event.coordinates,
        hasPlaceDetails: !!event.placeDetails,
        hasLocalPlaceDetails: !!localPlaceDetails,
        hasPlaceDetailsCoords: !!event.placeDetails?.coordinates,
        hasLocalPlaceDetailsCoords: !!localPlaceDetails?.coordinates,
        hasLocationDetails: !!event.locationDetails,
        hasLocationDetailsCoords: !!event.locationDetails?.coordinates,
        localPlaceDetails: localPlaceDetails,
      });

      // 🌤️ [KIM FIX] Use localPlaceDetails from Firestore listener first (most reliable source)
      const coordinates =
        event.coordinates ||
        localPlaceDetails?.coordinates ||
        event.placeDetails?.coordinates ||
        event.locationDetails?.coordinates;

      // 좌표가 없으면 날씨 가져올 수 없음
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        console.log('🌤️ [HostedEventCard] No coordinates available for weather');
        return false;
      }

      // 🌤️ [KIM FIX] Convert event.date to proper Date object if needed
      let eventDateTime: Date;
      if (event.date instanceof Date) {
        eventDateTime = event.date;
      } else if (typeof event.date === 'string') {
        eventDateTime = new Date(event.date);
      } else if (
        event.date &&
        typeof (event.date as { toDate?: () => Date }).toDate === 'function'
      ) {
        // Firestore Timestamp
        eventDateTime = (event.date as { toDate: () => Date }).toDate();
      } else {
        console.log(
          '🌤️ [HostedEventCard] Invalid event.date format:',
          typeof event.date,
          event.date
        );
        return false;
      }

      console.log('🌤️ [HostedEventCard] About to call weatherService with:', {
        coordinates,
        address: event.location,
        eventDateTime: eventDateTime.toISOString(),
      });

      try {
        const weatherData = await weatherService.getWeatherForMeetup(
          { coordinates, address: event.location },
          eventDateTime
        );

        if (weatherData) {
          const typedWeatherData = weatherData as WeatherData;
          setWeather(typedWeatherData);
          console.log('🌤️ [HostedEventCard] Weather fetched:', typedWeatherData.condition);
          return true; // Return true to indicate successful update
        }
      } catch (error) {
        console.error('❌ [HostedEventCard] Weather fetch error:', error);
      }
      return false;
    };

    // 🌤️ [KIM FIX] 날씨 표시 중단 조건이면 fetch하지 않고 interval도 설정하지 않음
    if (shouldStopShowingWeather) {
      console.log('🌤️ [HostedEventCard] Weather display stopped, no fetch needed');
      return;
    }

    // Initial fetch
    fetchWeather();

    // 🔄 [KIM FIX] Set up 15-minute interval for weather updates (only for active events)
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const intervalId = setInterval(() => {
      console.log('🔄 [HostedEventCard] Auto-refreshing weather (15-min interval)');
      fetchWeather();
    }, FIFTEEN_MINUTES);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [
    event.id,
    event.coordinates,
    event.placeDetails?.coordinates,
    event.locationDetails?.coordinates,
    event.locationDetails,
    event.placeDetails,
    localPlaceDetails,
    event.date,
    localMatchResult,
    event.status,
    event.location,
    event.type,
  ]);

  useEffect(() => {
    if (!event.id || !isDoublesEvent) {
      console.log('⚠️ [HostedEventCard] Skipping team applications listener:', {
        eventId: event.id,
        localGameType,
        eventGameType: event.gameType,
        isDoublesEvent,
      });
      return;
    }

    console.log(
      '🔥 [HostedEventCard] Setting up team applications listener for doubles event:',
      event.id
    );

    // 🔧 [FIX] Query all pending applications, then filter client-side for teamId
    // The isTeamApplication field may not exist on older documents
    const q = query(
      collection(db, 'participation_applications'),
      where('eventId', '==', event.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        console.log('🔍 [HostedEventCard] Pending applications query result:', {
          eventId: event.id,
          docsCount: snapshot.docs.length,
          empty: snapshot.empty,
        });

        // 🔧 [FIX] Filter for applications with teamId (team applications)
        const applications: unknown[] = [];
        snapshot.forEach(doc => {
          const docData = doc.data();
          // Only include applications that have a teamId (meaning they're team applications)
          if (docData.teamId) {
            console.log('📄 [HostedEventCard] Team app doc:', {
              id: doc.id,
              isTeamApplication: docData.isTeamApplication,
              teamId: docData.teamId,
              status: docData.status,
              partnerStatus: docData.partnerStatus,
              applicantName: docData.applicantName,
            });
            applications.push({ id: doc.id, ...docData });
          }
        });

        console.log('🔍 [HostedEventCard] Filtered team applications count:', applications.length);

        // teamId로 그룹화
        const grouped = new Map<string, unknown[]>();
        applications.forEach((app: unknown) => {
          const typedApp = app as {
            teamId?: string;
            applicantId: string;
            applicantName: string;
            status: 'pending' | 'approved' | 'rejected';
            partnerStatus: 'pending' | 'accepted' | 'rejected';
          };
          if (typedApp.teamId) {
            if (!grouped.has(typedApp.teamId)) {
              grouped.set(typedApp.teamId, []);
            }
            grouped.get(typedApp.teamId)!.push(app);
          }
        });

        const result: TeamApplicationGroup[] = [];
        grouped.forEach((members, teamId) => {
          const firstMember = members[0] as {
            status?: string;
            partnerStatus?: string;
            applicantId: string;
            applicantName: string;
            partnerName?: string; // 🔧 [FIX] Extract partner name from document
            partnerId?: string; // 🎾 [LPR FIX] Extract partner ID for LPR lookup
            applicantNtrp?: number; // 🎾 [KIM FIX] LPR values
            partnerNtrp?: number;
          };
          // 🎾 [LPR FIX] Get partnerId from second member if exists, or from firstMember.partnerId
          const secondMember = members[1] as { applicantId?: string } | undefined;
          const partnerId = secondMember?.applicantId || firstMember.partnerId;

          result.push({
            teamId,
            members: members.map((m: unknown) => {
              const member = m as { id: string; applicantName: string; applicantId: string };
              return {
                id: member.id,
                applicantName: member.applicantName,
                applicantId: member.applicantId,
              };
            }),
            // 🔧 [FIX] Include both applicant and partner names directly
            applicantName: firstMember.applicantName || '',
            partnerName: firstMember.partnerName || '',
            // 🎾 [LPR FIX] Include applicantId and partnerId for LPR lookup
            applicantId: firstMember.applicantId,
            partnerId: partnerId,
            // 🎾 [KIM FIX] Include LPR (NTRP) values for team display
            applicantNtrp: firstMember.applicantNtrp,
            partnerNtrp: firstMember.partnerNtrp,
            status: (firstMember.status || 'pending') as 'pending' | 'approved' | 'rejected',
            partnerStatus: (firstMember.partnerStatus || 'pending') as
              | 'pending'
              | 'accepted'
              | 'rejected',
          });
        });

        setTeamApplications(result);
        console.log('✅ [HostedEventCard] Team applications updated:', result);
      },
      error => {
        console.error('❌ [HostedEventCard] Team applications listener error:', error);
      }
    );

    return () => {
      console.log(
        '🧹 [HostedEventCard] Cleaning up team applications listener for event:',
        event.id
      );
      unsubscribe();
    };
    // 🔧 [FIX] isDoublesEvent is memoized and depends on localGameType/event.gameType
    // The debug log uses them but shouldn't trigger re-setup of the listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, isDoublesEvent]);

  // 🎯 [OPERATION SOLO LOBBY] Real-time listener for looking_for_partner applications
  useEffect(() => {
    if (!event.id || !isDoublesEvent) {
      return;
    }

    console.log(
      '🔥 [HostedEventCard] Setting up looking_for_partner listener for event:',
      event.id
    );

    const q = query(
      collection(db, 'participation_applications'),
      where('eventId', '==', event.id),
      where('status', '==', 'looking_for_partner')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const count = snapshot.size;
        setLookingForPartnerCount(count);
        console.log('✅ [HostedEventCard] looking_for_partner count updated:', count);
      },
      error => {
        console.error('❌ [HostedEventCard] looking_for_partner listener error:', error);
      }
    );

    return () => {
      console.log(
        '🧹 [HostedEventCard] Cleaning up looking_for_partner listener for event:',
        event.id
      );
      unsubscribe();
    };
  }, [event.id, isDoublesEvent]);

  // 🎾 [LPR FIX] 팀 신청의 applicantId/partnerId로 users 컬렉션 LPR 조회
  useEffect(() => {
    const fetchUserLtrs = async () => {
      // 🔍 [DEBUG] 팀 데이터 구조 확인 (안전하게)
      console.log('🔍 [LPR DEBUG] teamApplications count:', teamApplications.length);

      // 🎾 [LPR FIX] team.applicantId와 team.partnerId를 직접 사용
      const userIds = new Set<string>();
      teamApplications.forEach((team, idx) => {
        console.log(
          `🔍 [LPR DEBUG] Team ${idx}: teamId=${team.teamId}, applicantId=${team.applicantId}, partnerId=${team.partnerId}`
        );
        if (team.applicantId) userIds.add(team.applicantId);
        if (team.partnerId) userIds.add(team.partnerId);
      });

      console.log('🔍 [LPR DEBUG] Collected userIds:', Array.from(userIds));

      if (userIds.size === 0) {
        console.log('⚠️ [LPR] No user IDs found, skipping LPR fetch');
        return;
      }

      // users 컬렉션에서 LPR 일괄 조회
      try {
        const profiles = await userService.getUserProfiles(Array.from(userIds));
        console.log('🔍 [LPR DEBUG] Fetched profiles count:', profiles?.length || 0);

        const ltrMap: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profiles.forEach((profile: any) => {
          // 🎯 [KIM FIX v25] 매치 타입별 ELO 사용 - eloRatings only (Single Source of Truth)
          let targetEloValue: number | undefined;

          // matchEloType에 따라 적절한 ELO 조회 (eloRatings only!)
          if (matchEloType === 'mixed') {
            // 혼합 복식: mixed ELO 사용
            targetEloValue = profile?.eloRatings?.mixed?.current || profile?.eloRatings?.mixed;
          } else if (matchEloType === 'doubles') {
            // 일반 복식: doubles ELO 사용
            targetEloValue = profile?.eloRatings?.doubles?.current || profile?.eloRatings?.doubles;
          } else {
            // 단식: singles ELO 사용
            targetEloValue = profile?.eloRatings?.singles?.current || profile?.eloRatings?.singles;
          }
          const unifiedElo = profile?.stats?.unifiedEloRating;
          console.log(
            `🔍 [ELO DEBUG] ${profile?.id} (${profile?.profile?.displayName || 'N/A'}): targetElo=${targetEloValue}, unifiedElo=${unifiedElo}, matchEloType=${matchEloType}`
          );

          // 🎾 [LPR FIX] ELO에서 LPR 계산 (매치 타입에 맞는 ELO 사용)
          const targetElo = targetEloValue || unifiedElo;

          let ltr: number | undefined;

          if (targetElo && targetElo > 0) {
            ltr = convertEloToLtr(targetElo);
            console.log(`🎾 [LPR FIX] ${profile?.id}: ELO ${targetElo} → LPR ${ltr}`);
          } else if (profile?.profile?.ltrLevel) {
            // Fallback: profile.ltrLevel 직접 사용 (온보딩에서 설정된 값)
            const profileLtr = profile.profile.ltrLevel;
            if (typeof profileLtr === 'number') {
              ltr = profileLtr;
            } else if (typeof profileLtr === 'string') {
              ltr = parseInt(profileLtr, 10);
            }
            console.log(`📋 [LPR FIX] ${profile?.id}: Profile LPR ${ltr} (no ELO, FALLBACK USED!)`);
          } else {
            console.log(
              `⚠️ [LPR WARN] ${profile?.id}: NO ELO AND NO ltrLevel! Cannot compute LPR.`
            );
          }

          if (profile?.id && ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            ltrMap[profile.id] = ltr;
          }
        });
        setUserLtrMap(ltrMap);
        console.log('🎾 [LPR] User LPR map loaded:', ltrMap);
      } catch (error) {
        console.error('❌ [LPR] Failed to load user LPRs:', error);
      }
    };

    if (teamApplications.length > 0) {
      fetchUserLtrs();
    }
    // 🔧 [KIM FIX v22c] matchEloType 추가 - 단식/복식/혼복에 따라 다른 ELO 사용
  }, [teamApplications, matchEloType]);

  // 🎯 [KIM FIX v2] Fetch LPRs for host, host partner, and approved guest team
  // This is separate from teamApplications useEffect because approved teams are not in teamApplications
  useEffect(() => {
    const fetchHostAndGuestLtrs = async () => {
      // Collect all user IDs that need LPR lookup
      const userIds = new Set<string>();

      // Add host ID
      if (event.hostId) userIds.add(event.hostId);

      // Add host partner ID
      if (event.hostPartnerId) userIds.add(event.hostPartnerId);

      // Add approved guest team members
      const approvedApps = localApprovedApplications || event.approvedApplications || [];
      approvedApps.forEach(app => {
        if (app.applicantId) userIds.add(app.applicantId);
        if (app.partnerId) userIds.add(app.partnerId);
      });

      if (userIds.size === 0) return;

      try {
        const ltrMap: Record<string, number> = { ...userLtrMap }; // Keep existing entries

        // Fetch all user documents in parallel
        const userPromises = Array.from(userIds).map(async userId => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Get game-type-specific ELO
            const gameTypeElo = userData?.eloRatings?.[matchEloType]?.current;
            let ltr: number | undefined;

            if (gameTypeElo && gameTypeElo > 0) {
              ltr = convertEloToLtr(gameTypeElo);
            } else if (userData?.profile?.ltrLevel) {
              const profileLtr = userData.profile.ltrLevel;
              ltr = typeof profileLtr === 'number' ? profileLtr : parseInt(profileLtr, 10);
            }

            if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
              ltrMap[userId] = ltr;
            }
          }
        });

        await Promise.all(userPromises);
        setUserLtrMap(ltrMap);
        console.log('🎾 [LPR v2] Host/Guest LPR map loaded:', ltrMap);
      } catch (error) {
        console.error('❌ [LPR v2] Failed to load host/guest LPRs:', error);
      }
    };

    // Fetch if we have host, partner, or approved applications
    const hasRelevantIds =
      event.hostId ||
      event.hostPartnerId ||
      (localApprovedApplications && localApprovedApplications.length > 0) ||
      (event.approvedApplications && event.approvedApplications.length > 0);

    if (hasRelevantIds) {
      fetchHostAndGuestLtrs();
    }

    // Note: userLtrMap is intentionally excluded to prevent infinite loops (we spread existing entries inside)
  }, [
    event.hostId,
    event.hostPartnerId,
    localApprovedApplications,
    event.approvedApplications,
    matchEloType,
  ]);

  // 🎯 [KIM FIX] Fetch latest display names from users collection
  // This ensures we always show the current nickname, not cached data from applications
  useEffect(() => {
    const fetchLatestUserNames = async () => {
      const approvedApps = localApprovedApplications || [];
      if (approvedApps.length === 0) return;

      // Collect all unique user IDs that need name lookup
      const userIds = new Set<string>();
      approvedApps.forEach(app => {
        if (app.applicantId) userIds.add(app.applicantId);
        if (app.partnerId) userIds.add(app.partnerId);
      });

      if (userIds.size === 0) return;

      try {
        const nameMap: Record<string, string> = {};

        // Fetch all user documents in parallel
        const userPromises = Array.from(userIds).map(async userId => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName =
              userData?.profile?.displayName ||
              userData?.profile?.nickname ||
              userData?.displayName ||
              userData?.nickname;
            if (displayName) {
              nameMap[userId] = displayName;
            }
          }
        });

        await Promise.all(userPromises);
        setUserNameMap(nameMap);
        console.log('🎯 [HostedEventCard] User name map loaded:', nameMap);
      } catch (error) {
        console.error('❌ [HostedEventCard] Failed to fetch user names:', error);
      }
    };

    fetchLatestUserNames();
  }, [localApprovedApplications]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(t('common.locale'), {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  /**
   * 🆕 [KIM] Format full location with city and state (exclude country)
   */
  const formatFullLocation = useCallback((): string => {
    const location = event.location;
    const details = event.locationDetails;

    // If we have city or state from locationDetails, append them
    if (details?.city || details?.state) {
      const parts = [location];
      if (details.city) parts.push(details.city);
      if (details.state) parts.push(details.state);
      // Note: country is intentionally excluded per user request
      return parts.join(', ');
    }

    return location || t('hostedEventCard.locationTbd');
  }, [event.location, event.locationDetails, t]);

  /**
   * 🗺️ [KIM] Open location in Maps app
   * iOS: Apple Maps, Android: Google Maps
   */
  const openLocationInMaps = useCallback((address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
      }
    });
  }, []);

  const getEventTypeEmoji = (type: string): string => {
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'lightning':
        return '⚡';
      case 'practice':
        return '👥';
      case 'tournament':
        return '🏆';
      case 'match':
        return '🎾';
      case 'meetup':
        return '👥';
      case 'casual':
        return '😊';
      case 'ranked':
        return '🏆';
      default:
        return '🎾';
    }
  };

  const getEventTypeLabel = (type: string): string => {
    const normalizedType = type?.toLowerCase() || 'general';

    // Try to get translation for the event type
    const translationKey = `hostedEventCard.eventTypes.${normalizedType}`;
    try {
      return t(translationKey);
    } catch {
      // Fallback: capitalize the type if no translation exists
      return type
        ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
        : t('hostedEventCard.eventTypes.general');
    }
  };

  const handleApproveApplication = async (applicationId: string, applicantName: string) => {
    if (!onApproveApplication) return;

    setProcessingApplications(prev => new Set(prev).add(applicationId));
    try {
      await onApproveApplication(applicationId, applicantName);
      Alert.alert(
        t('hostedEventCard.alerts.approveSuccess'),
        t('hostedEventCard.alerts.approveSuccessMessage')
      );
    } catch (error: unknown) {
      console.error('Error approving application:', error);
      Alert.alert(t('hostedEventCard.alerts.error'), t('hostedEventCard.alerts.errorApproving'));
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleRejectApplication = async (applicationId: string, applicantName: string) => {
    if (!onRejectApplication) return;

    setProcessingApplications(prev => new Set(prev).add(applicationId));
    try {
      await onRejectApplication(applicationId, applicantName);
      Alert.alert(
        t('hostedEventCard.alerts.rejectSuccess'),
        t('hostedEventCard.alerts.rejectSuccessMessage')
      );
    } catch (error: unknown) {
      console.error('Error rejecting application:', error);
      Alert.alert(t('hostedEventCard.alerts.error'), t('hostedEventCard.alerts.errorRejecting'));
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  // 🎯 [KIM FIX v2] eventId 파라미터 추가 - 같은 팀이 여러 이벤트에 신청할 수 있으므로
  const handleApproveTeam = async (teamId: string, eventId: string) => {
    try {
      await participationApplicationService.approveTeamApplication(teamId, eventId);
      // 🆕 [KIM FIX] Refresh to update UI immediately after team approval
      onRefresh?.();
      Alert.alert(
        t('hostedEventCard.alerts.teamApproveSuccess'),
        t('hostedEventCard.alerts.teamApproveSuccessMessage')
      );
    } catch (error: unknown) {
      console.error('Error approving team:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('hostedEventCard.alerts.teamRejectError');
      Alert.alert(t('hostedEventCard.alerts.error'), errorMessage);
    }
  };

  const handleRejectTeam = async (teamId: string) => {
    Alert.alert(
      t('hostedEventCard.alerts.teamRejectTitle'),
      t('hostedEventCard.alerts.teamRejectMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('hostedEventCard.buttons.reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              await participationApplicationService.rejectTeamApplication(teamId);
              // 🆕 [KIM FIX] Refresh to update UI immediately after team rejection
              onRefresh?.();
              Alert.alert(
                t('hostedEventCard.alerts.teamRejectComplete'),
                t('hostedEventCard.alerts.teamRejectCompleteMessage')
              );
            } catch (error: unknown) {
              console.error('Error rejecting team:', error);
              Alert.alert(
                t('hostedEventCard.alerts.error'),
                t('hostedEventCard.alerts.teamRejectError')
              );
            }
          },
        },
      ]
    );
  };

  // 🌤️ Detect if user is in imperial unit region (US, UK, etc.)
  const useImperialUnits = useMemo(() => {
    try {
      const locales = Localization.getLocales();
      const regionCode = locales?.[0]?.regionCode?.toUpperCase();
      // US, UK, and a few others use Fahrenheit and mph
      return regionCode === 'US' || regionCode === 'GB' || regionCode === 'UK';
    } catch {
      return false;
    }
  }, []);

  // 🎾 Get pickleball wind condition based on wind speed (mph)
  // Shows actual impact on pickleball play instead of status labels
  const getPickleballWindCondition = (windSpeedMph: number) => {
    if (windSpeedMph <= 5) {
      return {
        label: t('hostedEventCard.weather.windConditions.noEffect'),
        color: '#4CAF50', // Green
      };
    } else if (windSpeedMph <= 10) {
      return {
        label: t('hostedEventCard.weather.windConditions.minorAdjustments'),
        color: '#8BC34A', // Light Green
      };
    } else if (windSpeedMph <= 15) {
      return {
        label: t('hostedEventCard.weather.windConditions.affectsServesLobs'),
        color: '#FF9800', // Orange
      };
    } else if (windSpeedMph <= 20) {
      return {
        label: t('hostedEventCard.weather.windConditions.significantImpact'),
        color: '#F44336', // Red
      };
    } else {
      return {
        label: t('hostedEventCard.weather.windConditions.notRecommended'),
        color: '#9C27B0', // Purple
      };
    }
  };

  // 🌤️ [KIM FIX v2] Get translated weather condition using shared meetupDetail.weather.conditions
  const getWeatherConditionTranslation = (condition: string): string => {
    const translationKey = `meetupDetail.weather.conditions.${condition}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : condition;
  };

  // 🌤️ Render compact weather widget
  const renderWeatherWidget = () => {
    if (!weather) return null;

    // 🌡️ Temperature: Use Fahrenheit for US/UK, Celsius for others
    const displayTemp = useImperialUnits ? `${weather.temperatureF}°F` : `${weather.temperature}°C`;

    // 💨 Wind Speed: Use mph for US/UK, km/h for others
    // windSpeedMph is provided by Open-Meteo, windSpeed might be in different units
    const windSpeedInMph = weather.windSpeedMph ?? Math.round(weather.windSpeed * 0.621371);
    const displayWindSpeed =
      weather.windSpeed !== undefined
        ? useImperialUnits
          ? `${windSpeedInMph} mph`
          : `${Math.round(weather.windSpeed)} km/h`
        : null;

    // 🎾 Pickleball wind condition
    const pickleballWindCondition =
      weather.windSpeed !== undefined ? getPickleballWindCondition(windSpeedInMph) : null;

    // 🌧️❄️ [KIM FIX] High rain/snow chance should override weather icon and condition
    const rainChance = weather.chanceOfRain || 0;
    const isHighRainChance = rainChance >= 50;

    // ❄️ [KIM FIX] Check if condition is snow-related
    const conditionLower = weather.condition?.toLowerCase() || '';
    const isSnowCondition = conditionLower.includes('snow') || conditionLower.includes('sleet');

    // 🎨 Override icon based on precipitation type
    const getDisplayIcon = () => {
      if (isSnowCondition) return '❄️';
      if (isHighRainChance) return '🌧️';
      return weather.icon;
    };
    const displayIcon = getDisplayIcon();

    // 🌐 [KIM FIX v2] Translate weather condition using shared meetupDetail.weather.conditions
    const baseCondition = getWeatherConditionTranslation(weather.condition);
    const getDisplayCondition = () => {
      if (isSnowCondition) return t('meetupDetail.weather.conditions.Moderate Snow');
      if (isHighRainChance) return t('meetupDetail.weather.conditions.Moderate Rain');
      return baseCondition;
    };
    const displayCondition = getDisplayCondition();

    // 🌫️ [KIM FIX v2] Check if condition is fog-related
    const isFogCondition = conditionLower.includes('fog');

    // 🎾 [KIM FIX v2] Pickleball play condition based on fog/snow/rain first, then wind
    const getPickleballPlayCondition = () => {
      // 🚫 Fog, Thunderstorm, Heavy Rain/Snow = Unplayable
      if (
        conditionLower.includes('thunderstorm') ||
        conditionLower.includes('heavy rain') ||
        conditionLower.includes('heavy snow') ||
        conditionLower.includes('violent')
      ) {
        return { label: t('meetupDetail.weather.pickleball.unplayable'), color: '#F44336' };
      }
      // ⚠️ Fog, moderate rain/snow = Not recommended
      if (isFogCondition || conditionLower.includes('freezing')) {
        return { label: t('meetupDetail.weather.pickleball.notRecommended'), color: '#FF9800' };
      }
      // ❄️ Snow conditions are bad for pickleball
      if (isSnowCondition) {
        return { label: t('meetupDetail.weather.pickleball.unplayable'), color: '#F44336' };
      }
      if (rainChance >= 80) {
        return { label: t('meetupDetail.weather.pickleball.unplayable'), color: '#F44336' }; // 경기 불가
      } else if (rainChance >= 50) {
        return { label: t('meetupDetail.weather.pickleball.caution'), color: '#FF9800' }; // 주의 필요
      }
      // Return wind condition if weather is OK
      return pickleballWindCondition;
    };

    const pickleballPlayCondition = getPickleballPlayCondition();
    const isPrecipitationWarning = isHighRainChance || isSnowCondition;

    return (
      <View style={styles.weatherWidget}>
        <Text style={styles.weatherIcon}>{displayIcon}</Text>
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherTemp}>{displayTemp}</Text>
          <Text style={styles.weatherCondition}>{displayCondition}</Text>
        </View>
        {/* 💨 Wind Speed with Pickleball Condition - but show precipitation warning if needed */}
        {displayWindSpeed && (
          <View style={styles.windSpeed}>
            <Text style={styles.windIcon}>{isPrecipitationWarning ? displayIcon : '💨'}</Text>
            <Text style={styles.windSpeedText}>
              {isPrecipitationWarning ? `${rainChance}%` : displayWindSpeed}
            </Text>
            {pickleballPlayCondition && (
              <Text style={[styles.windCondition, { color: pickleballPlayCondition.color }]}>
                {pickleballPlayCondition.label}
              </Text>
            )}
          </View>
        )}
        {/* 🌧️ Rain Chance - only show if NOT already showing in wind section */}
        {!isPrecipitationWarning && rainChance > 30 && (
          <View style={styles.rainChance}>
            <Ionicons name='water' size={12} color='#2196F3' />
            <Text style={styles.rainChanceText}>{rainChance}%</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMatchResult = () => {
    if (!localMatchResult || typeof localMatchResult !== 'object') {
      return null;
    }

    const matchData = localMatchResult as HostedEvent['matchResult'];
    if (!matchData?.score?.finalScore) {
      return null;
    }

    const isHostWinner = matchData.hostResult === 'win';
    const winBackgroundColor = currentTheme === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9';
    const lossBackgroundColor = currentTheme === 'dark' ? 'rgba(239, 83, 80, 0.15)' : '#FFEBEE';

    // 🎯 [KIM FIX] 단식은 "나의 승리/상대의 승리", 복식은 "우리팀의 승리/상대팀의 승리"
    const isDoubles = event.gameType?.toLowerCase().includes('doubles');
    const winnerTeamText = isHostWinner
      ? isDoubles
        ? t('hostedEventCard.matchResult.ourTeamVictory')
        : t('hostedEventCard.matchResult.myVictory')
      : isDoubles
        ? t('hostedEventCard.matchResult.opponentTeamVictory')
        : t('hostedEventCard.matchResult.opponentVictory');

    // 🎯 [KIM FIX] Build score with tiebreak from sets if available
    let displayScore = matchData.score.finalScore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((matchData.score as any).sets && Array.isArray((matchData.score as any).sets)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      displayScore = (matchData.score as any).sets
        .map(
          (set: {
            player1Games: number;
            player2Games: number;
            player1TiebreakPoints?: number;
            player2TiebreakPoints?: number;
          }) => {
            let scoreStr = `${set.player1Games}-${set.player2Games}`;
            // Include tiebreak if exists
            if (
              set.player1TiebreakPoints !== undefined ||
              set.player2TiebreakPoints !== undefined
            ) {
              const tb1 = set.player1TiebreakPoints || 0;
              const tb2 = set.player2TiebreakPoints || 0;
              if (tb1 > 0 || tb2 > 0) {
                scoreStr += `(${tb1}-${tb2})`;
              }
            }
            return scoreStr;
          }
        )
        .join(', ');
    }

    return (
      <View style={styles.matchResultSection}>
        <View
          style={[
            styles.matchResultCard,
            {
              backgroundColor: isHostWinner ? winBackgroundColor : lossBackgroundColor,
            },
          ]}
        >
          <Ionicons
            name={isHostWinner ? 'trophy' : 'medal'}
            size={20}
            color={isHostWinner ? '#4CAF50' : '#EF5350'}
          />
          <Text
            style={[
              styles.matchResultLabel,
              {
                color: isHostWinner ? '#4CAF50' : '#EF5350',
              },
            ]}
          >
            {winnerTeamText} {displayScore}
          </Text>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    return (
      <View style={styles.eventActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => onOpenChat?.(event.id, event.title)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name='chatbubble-outline'
              size={16}
              color={currentTheme === 'dark' ? '#64B5F6' : '#1976d2'}
            />
            <Text style={styles.chatButtonText}>{t('hostedEventCard.buttons.chat')}</Text>
            {/* 💬 Unread Count Badge - Chat button 옆 */}
            {localUnreadCount > 0 && (
              <Badge
                size={18}
                style={{
                  marginLeft: 8,
                  backgroundColor: currentTheme === 'dark' ? '#EF5350' : '#f44336',
                  color: '#FFFFFF', // 🎯 White text for visibility
                }}
              >
                {localUnreadCount}
              </Badge>
            )}
          </View>
        </TouchableOpacity>

        {/* 🛡️ [CAPTAIN AMERICA] Re-invite Partner Button (Rejected Status Only) - DOUBLES */}
        {event.gameType?.toLowerCase().includes('doubles') &&
          event.partnerStatus === 'rejected' &&
          onReinvite && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reinviteButton]}
              onPress={() => onReinvite(event.id, event.gameType)}
            >
              <Ionicons
                name='person-add-outline'
                size={16}
                color={currentTheme === 'dark' ? '#66BB6A' : '#4caf50'}
              />
              <Text style={styles.reinviteButtonText}>
                {t('hostedEventCard.buttons.inviteNewPartner')}
              </Text>
            </TouchableOpacity>
          )}

        {/* 🎯 [KIM FIX] Re-invite Friend Button - SINGLES (all friends rejected) */}
        {event.gameType?.toLowerCase().includes('singles') &&
          localFriendInvitations.length > 0 &&
          localFriendInvitations.every(inv => inv.status === 'rejected') &&
          onReinvite && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reinviteButton]}
              onPress={() => onReinvite(event.id, event.gameType)}
            >
              <Ionicons
                name='person-add-outline'
                size={16}
                color={currentTheme === 'dark' ? '#66BB6A' : '#4caf50'}
              />
              <Text style={styles.reinviteButtonText}>
                {t('hostedEventCard.buttons.reinviteFriend')}
              </Text>
            </TouchableOpacity>
          )}

        {/* ⚡ Quick Match 장소/시간 설정 버튼 (Recruiting + TBD Location) */}
        {event.status === 'recruiting' && event.location === 'TBD' && onSetLocationTime && (
          <TouchableOpacity
            style={[styles.actionButton, styles.setLocationButton]}
            onPress={() => onSetLocationTime(event.id, event.title)}
          >
            <Ionicons
              name='location'
              size={16}
              color={currentTheme === 'dark' ? '#64B5F6' : '#2196F3'}
            />
            <Text style={styles.setLocationButtonText}>
              {t('hostedEventCard.buttons.setLocationTime')}
            </Text>
          </TouchableOpacity>
        )}

        {/* 점수 입력 버튼 (조건부 렌더링) */}
        {canSubmitScore && (
          <TouchableOpacity
            style={[styles.actionButton, styles.scoreButton]}
            onPress={() => {
              console.log('🏆 [HostedEventCard] Opening score modal with:', {
                hostName: localHostName,
                eventTitle: event.title,
                gameType: localGameType,
                approvedCount: localApprovedApplications?.length,
              });
              setScoreInputModalVisible(true);
            }}
          >
            <Ionicons
              name='trophy-outline'
              size={16}
              color={currentTheme === 'dark' ? '#66BB6A' : '#4caf50'}
            />
            <Text style={styles.scoreButtonText}>{t('hostedEventCard.buttons.submitScore')}</Text>
          </TouchableOpacity>
        )}

        {/* 🎯 [KIM FIX] 점수 제출된 경기는 수정/취소 버튼 비활성화 */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.editButton,
            event.matchResult && styles.disabledButton,
          ]}
          onPress={() => !event.matchResult && onEditEvent?.(event.id)}
          disabled={!!event.matchResult}
        >
          <Ionicons
            name='create-outline'
            size={16}
            color={event.matchResult ? '#888888' : currentTheme === 'dark' ? '#FFB74D' : '#ff9800'}
          />
          <Text style={[styles.editButtonText, event.matchResult && styles.disabledButtonText]}>
            {t('hostedEventCard.buttons.edit')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cancelButton,
            event.matchResult && styles.disabledButton,
          ]}
          onPress={() => !event.matchResult && onCancelEvent?.(event.id)}
          disabled={!!event.matchResult}
        >
          <Ionicons
            name='close-circle-outline'
            size={16}
            color={event.matchResult ? '#888888' : currentTheme === 'dark' ? '#EF5350' : '#f44336'}
          />
          <Text style={[styles.cancelButtonText, event.matchResult && styles.disabledButtonText]}>
            {t('hostedEventCard.buttons.cancel')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPendingApplications = () => {
    if (!event.pendingApplications || event.pendingApplications.length === 0) {
      return null;
    }

    // 🔧 [FIX] Filter out team applications (they're shown in renderTeamApplications)
    // Team applications have teamId OR partnerId - show them only in the blue "팀 신청 목록" card
    // 🎯 [KIM FIX] Also exclude applications with partnerId (team applications without teamId)
    const individualApplications = event.pendingApplications.filter(app => {
      const appWithTeam = app as PendingApplication & { teamId?: string; partnerId?: string };
      // Exclude if has teamId OR partnerId (both indicate team applications)
      return !appWithTeam.teamId && !appWithTeam.partnerId;
    });

    if (individualApplications.length === 0) {
      return null;
    }

    return (
      <View style={styles.pendingApplicationsSection}>
        <Text style={styles.pendingApplicationsTitle}>
          {t('hostedEventCard.sections.pendingApplications')} ({individualApplications.length})
        </Text>
        {individualApplications.map(application => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const appWithPartner = application as any;
          return (
            <View key={application.id} style={styles.applicationItem}>
              <View style={styles.applicantInfo}>
                {/* 🎯 [OPERATION DUO] Show team info if partnerId exists */}
                {appWithPartner.partnerId && appWithPartner.partnerName ? (
                  <>
                    <View style={styles.teamHeader}>
                      <Ionicons
                        name='people'
                        size={16}
                        color={currentTheme === 'dark' ? '#64B5F6' : '#2196F3'}
                      />
                      <Text style={styles.teamLabel}>
                        {t('hostedEventCard.teamStatus.teamApplication')}
                      </Text>
                    </View>
                    <View style={styles.applicantNameRow}>
                      <TouchableOpacity
                        onPress={() =>
                          application.applicantId && onPlayerPress?.(application.applicantId)
                        }
                        disabled={!onPlayerPress || !application.applicantId}
                      >
                        <Text
                          style={[
                            styles.applicantName,
                            onPlayerPress && application.applicantId && styles.clickableName,
                          ]}
                        >
                          {application.applicantName}
                        </Text>
                      </TouchableOpacity>
                      {application.applicantId && applicantNtrpMap[application.applicantId] && (
                        <Text style={styles.applicantNtrp}>
                          {` (${isDoublesEvent ? t('cards.hostedEvent.doubles') : t('cards.hostedEvent.singles')} ${applicantNtrpMap[application.applicantId]})`}
                        </Text>
                      )}
                      <Text style={styles.applicantName}> & </Text>
                      <TouchableOpacity
                        onPress={() =>
                          appWithPartner.partnerId && onPlayerPress?.(appWithPartner.partnerId)
                        }
                        disabled={!onPlayerPress || !appWithPartner.partnerId}
                      >
                        <Text
                          style={[
                            styles.applicantName,
                            onPlayerPress && appWithPartner.partnerId && styles.clickableName,
                          ]}
                        >
                          {appWithPartner.partnerName}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.applicantNameRow}>
                    <TouchableOpacity
                      onPress={() =>
                        application.applicantId && onPlayerPress?.(application.applicantId)
                      }
                      disabled={!onPlayerPress || !application.applicantId}
                    >
                      <Text
                        style={[
                          styles.applicantName,
                          onPlayerPress && application.applicantId && styles.clickableName,
                        ]}
                      >
                        {application.applicantName}
                      </Text>
                    </TouchableOpacity>
                    {application.applicantId && applicantNtrpMap[application.applicantId] && (
                      <Text style={styles.applicantNtrp}>
                        {` (${isDoublesEvent ? t('cards.hostedEvent.doubles') : t('cards.hostedEvent.singles')} ${applicantNtrpMap[application.applicantId]})`}
                      </Text>
                    )}
                  </View>
                )}
                {application.message && (
                  <Text style={styles.applicationMessage}>{application.message}</Text>
                )}
                <Text style={styles.applicationDate}>{formatDate(application.appliedAt)}</Text>
              </View>
              <View style={styles.applicationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() =>
                    handleApproveApplication(application.id, application.applicantName)
                  }
                  disabled={processingApplications.has(application.id)}
                >
                  {processingApplications.has(application.id) ? (
                    <ActivityIndicator
                      size='small'
                      color={currentTheme === 'dark' ? '#81C784' : '#4caf50'}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name='checkmark-circle-outline'
                        size={16}
                        color={currentTheme === 'dark' ? '#81C784' : '#4caf50'}
                      />
                      <Text style={styles.approveButtonText}>
                        {t('hostedEventCard.buttons.approve')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectApplication(application.id, application.applicantName)}
                  disabled={processingApplications.has(application.id)}
                >
                  {processingApplications.has(application.id) ? (
                    <ActivityIndicator
                      size='small'
                      color={currentTheme === 'dark' ? '#EF5350' : '#f44336'}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name='close-circle-outline'
                        size={16}
                        color={currentTheme === 'dark' ? '#EF5350' : '#f44336'}
                      />
                      <Text style={styles.rejectButtonText}>
                        {t('hostedEventCard.buttons.reject')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderApprovedApplications = () => {
    // 🎯 [KIM FIX] Use localApprovedApplications (real-time) instead of event.approvedApplications (prop)
    const approvedApps = localApprovedApplications || event.approvedApplications || [];
    if (approvedApps.length === 0) {
      return null;
    }

    // 🎯 [KIM FIX] Filter out host's partner from approved applications
    // Host's partner is already shown in "파트너: 철수" section
    // Also filter out partner_invitation type (host partner applications)
    // 🎯 [KIM FIX v3 - ROBUST FIX] For doubles team applications:
    // - Team leader's doc has partnerId set → show this one
    // - Partner's doc (if exists) has no partnerId, but their applicantId = leader's partnerId → skip
    // This prevents duplicate display (e.g., "진수 & 칠성" AND "칠성 & 진수")

    // First, collect all partnerIds from approved applications (these are team members who have a leader)
    const partnerIdsInTeams = new Set<string>();
    approvedApps.forEach(app => {
      if (app.partnerId) {
        partnerIdsInTeams.add(app.partnerId);
      }
    });

    const challengerApplications = approvedApps.filter(app => {
      // Filter out host's partner
      if (app.applicantId === event.hostPartnerId) {
        return false;
      }
      // Filter out partner_invitation type
      if ((app as ApprovedApplication & { type?: string }).type === 'partner_invitation') {
        return false;
      }
      // 🎯 [ROOT CAUSE FIX v3] Skip if this applicant is someone else's partner
      // If applicantId is in partnerIdsInTeams AND this app has no partnerId,
      // then this is a partner's converted solo application - skip it
      if (partnerIdsInTeams.has(app.applicantId) && !app.partnerId) {
        console.log('🔍 [HostedEventCard] Skipping duplicate partner application:', {
          applicantId: app.applicantId,
          reason: 'applicant is listed as partnerId in another team application',
        });
        return false;
      }
      // 🎯 [FALLBACK] Also check invitedBy for backwards compatibility
      const appWithInvitedBy = app as ApprovedApplication & { invitedBy?: string };
      if (appWithInvitedBy.invitedBy && appWithInvitedBy.invitedBy !== app.applicantId) {
        return false;
      }
      return true;
    });

    if (challengerApplications.length === 0) {
      return null;
    }

    // 🎯 [KIM FIX] For doubles matches, show as "게스트" with both members
    const isDoublesMatch = event.gameType?.toLowerCase().includes('doubles');

    // 🎯 [KIM FIX v2] No need for Map grouping anymore - we filtered at the source!
    // Each team now has exactly ONE document in challengerApplications (the team leader's)
    const uniqueApplications = challengerApplications.map(application => {
      // 🎯 [KIM FIX] Use userNameMap for latest names (falls back to cached name if not loaded)
      const latestApplicantName =
        (application.applicantId && userNameMap[application.applicantId]) ||
        application.applicantName;
      const latestPartnerName =
        (application.partnerId && userNameMap[application.partnerId]) || application.partnerName;

      const displayName =
        isDoublesMatch && latestPartnerName
          ? `${latestApplicantName} & ${latestPartnerName}`
          : latestApplicantName;

      // 🎯 [KIM FIX v2] Calculate team LPR using userLtrMap (same as renderTeamApplications)
      const applicantLtr = application.applicantId ? userLtrMap[application.applicantId] || 0 : 0;
      const partnerLtr = application.partnerId ? userLtrMap[application.partnerId] || 0 : 0;
      const displayTeamLtr =
        applicantLtr + partnerLtr > 0 ? Math.round(applicantLtr + partnerLtr) : undefined;

      return {
        ...application,
        displayName,
        displayDate: application.appliedAt,
        displayTeamLtr,
      };
    });

    return (
      <View style={styles.approvedApplicationsSection}>
        <Text style={styles.approvedApplicationsTitle}>
          {isDoublesMatch
            ? t('hostedEventCard.sections.guest')
            : `${t('hostedEventCard.sections.approvedParticipants')} (${uniqueApplications.length})`}
        </Text>
        {uniqueApplications.map(application => {
          return (
            <View key={application.teamId || application.id} style={styles.applicationItem}>
              <View style={styles.applicantInfo}>
                <View style={styles.approvedHeader}>
                  <Ionicons
                    name='checkmark-circle'
                    size={18}
                    color={currentTheme === 'dark' ? '#81C784' : '#4caf50'}
                  />
                  <Text style={styles.applicantName}>
                    {application.displayName}
                    {/* 🎯 [KIM FIX] Show team LPR for doubles */}
                    {isDoublesMatch && application.displayTeamLtr && (
                      <Text style={styles.teamLtrText}>
                        {` (${t('hostedEventCard.teams.doublesTeam')} LPR ${application.displayTeamLtr})`}
                      </Text>
                    )}
                  </Text>
                </View>
                {application.message && (
                  <Text style={styles.applicationMessage}>
                    {application.message === 'friend_invite_accepted' ||
                    application.message === 'Accepted friend invitation'
                      ? t('hostedEventCard.messages.friendInviteAccepted')
                      : application.message}
                  </Text>
                )}
                {/* 🎯 [KIM FIX] Hide date for doubles (only show for singles/meetups) */}
                {!isDoublesMatch && (
                  <Text style={styles.applicationDate}>{formatDate(application.displayDate)}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLookingForPartnerBadge = () => {
    if (!isDoublesEvent || lookingForPartnerCount === 0) {
      return null;
    }

    return (
      <View style={styles.lookingForPartnerSection}>
        <View style={styles.lookingForPartnerBadge}>
          <Ionicons
            name='person-outline'
            size={16}
            color={currentTheme === 'dark' ? '#FFB74D' : '#FF9800'}
          />
          <Text style={styles.lookingForPartnerText}>
            {t('hostedEventCard.lookingForPartner', { count: lookingForPartnerCount })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTeamApplications = () => {
    // 🔧 [FIX] Use isDoublesEvent instead of localGameType check
    console.log('🎯 [renderTeamApplications] Check:', {
      isDoublesEvent,
      teamApplicationsLength: teamApplications.length,
      teamApplications,
    });
    if (!isDoublesEvent || teamApplications.length === 0) {
      return null;
    }

    return (
      <View style={styles.teamApplicationsSection}>
        <Text style={styles.teamApplicationsTitle}>
          {t('hostedEventCard.sections.teamApplications')} ({teamApplications.length})
        </Text>
        {teamApplications.map(team => {
          // 🔧 [FIX] Use applicantName + partnerName directly from document
          const memberNames = team.partnerName
            ? `${team.applicantName} + ${team.partnerName}`
            : team.applicantName;
          const isPartnerPending = team.partnerStatus === 'pending';
          const isReadyForApproval = team.partnerStatus === 'accepted' && team.status === 'pending';
          const isApproved = team.status === 'approved';
          const isRejected = team.status === 'rejected';

          // 🎾 [LPR FIX] team.applicantNtrp/partnerNtrp 우선 사용, 없으면 userLtrMap에서 조회
          // 🎯 [KIM FIX] 팀 신청 문서에 저장된 LPR 값을 먼저 사용 (더 안정적)
          const applicantLtr = team.applicantNtrp || userLtrMap[team.applicantId] || 0;
          const partnerLtr =
            team.partnerNtrp || (team.partnerId ? userLtrMap[team.partnerId] || 0 : 0);
          // 🔧 [KIM FIX v23] LPR은 정수로 표시 (8.0 → 8)
          const teamLtr =
            applicantLtr + partnerLtr > 0 ? Math.round(applicantLtr + partnerLtr) : null;
          console.log(
            `🔍 [LPR RENDER] Team ${team.teamId}: applicantLtr=${applicantLtr}, partnerLtr=${partnerLtr}, total=${teamLtr}`
          );

          return (
            <View key={team.teamId} style={styles.teamCard}>
              <View style={styles.teamMembers}>
                <Text style={styles.teamMemberText}>
                  {memberNames}
                  {teamLtr && (
                    <Text style={{ color: '#4FC3F7', fontWeight: '600' }}> (LPR {teamLtr})</Text>
                  )}
                </Text>
                {isPartnerPending && (
                  <Badge
                    size={16}
                    style={{
                      backgroundColor: currentTheme === 'dark' ? '#FFB74D' : '#FF9800',
                      marginLeft: 8,
                    }}
                  >
                    {t('hostedEventCard.teamStatus.waitingForPartner')}
                  </Badge>
                )}
                {isReadyForApproval && (
                  <Badge
                    size={16}
                    style={{
                      backgroundColor: currentTheme === 'dark' ? '#64B5F6' : '#2196F3',
                      marginLeft: 8,
                    }}
                  >
                    {t('hostedEventCard.teamStatus.readyForApproval')}
                  </Badge>
                )}
                {isApproved && (
                  <Badge
                    size={16}
                    style={{
                      backgroundColor: currentTheme === 'dark' ? '#81C784' : '#4CAF50',
                      marginLeft: 8,
                    }}
                  >
                    {t('hostedEventCard.teamStatus.approved')}
                  </Badge>
                )}
                {isRejected && (
                  <Badge
                    size={16}
                    style={{
                      backgroundColor: currentTheme === 'dark' ? '#EF5350' : '#F44336',
                      marginLeft: 8,
                    }}
                  >
                    {t('hostedEventCard.teamStatus.rejected')}
                  </Badge>
                )}
              </View>

              {isReadyForApproval && (
                <View style={styles.teamActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveTeam(team.teamId, event.id)}
                  >
                    <Ionicons
                      name='checkmark-circle-outline'
                      size={16}
                      color={currentTheme === 'dark' ? '#81C784' : '#4caf50'}
                    />
                    <Text style={styles.approveButtonText}>
                      {t('hostedEventCard.buttons.approve')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectTeam(team.teamId)}
                  >
                    <Ionicons
                      name='close-circle-outline'
                      size={16}
                      color={currentTheme === 'dark' ? '#EF5350' : '#f44336'}
                    />
                    <Text style={styles.rejectButtonText}>
                      {t('hostedEventCard.buttons.reject')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // 🎯 [FRIEND INVITE] Render invited friends section with green cards
  const renderFriendInvitations = () => {
    if (localFriendInvitations.length === 0) {
      return null;
    }

    return (
      <View style={styles.friendInvitationsSection}>
        <Text style={styles.friendInvitationsTitle}>
          {t('hostedEventCard.sections.invitedFriends')} ({localFriendInvitations.length})
        </Text>
        {localFriendInvitations.map((invitation, index) => {
          const statusColor =
            invitation.status === 'accepted'
              ? '#4CAF50'
              : invitation.status === 'rejected'
                ? '#F44336'
                : '#FF9800';
          const statusLabel =
            invitation.status === 'accepted'
              ? t('hostedEventCard.invitationStatus.accepted')
              : invitation.status === 'rejected'
                ? t('hostedEventCard.invitationStatus.rejected')
                : t('hostedEventCard.invitationStatus.pending');
          const statusIcon =
            invitation.status === 'accepted'
              ? 'checkmark-circle'
              : invitation.status === 'rejected'
                ? 'close-circle'
                : 'time';

          return (
            <View key={`${invitation.userId}-${index}`} style={styles.friendInvitationCard}>
              <View style={styles.friendInvitationInfo}>
                <Ionicons
                  name='person'
                  size={18}
                  color={currentTheme === 'dark' ? '#81C784' : '#4CAF50'}
                />
                <Text style={styles.friendInvitationName}>{invitation.userName}</Text>
              </View>
              <View style={[styles.friendInvitationStatus, { backgroundColor: statusColor }]}>
                <Ionicons name={statusIcon} size={14} color='#FFF' />
                <Text style={styles.friendInvitationStatusText}>{statusLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // 🎯 Get match type label with emoji (남자 단식, 여자 복식 등)
  const getMatchTypeLabel = (gameType?: string): { emoji: string; label: string } | null => {
    if (!gameType) return null;

    const normalizedType = gameType.toLowerCase();
    const labels: { [key: string]: { emoji: string; labelKey: string } } = {
      mens_singles: { emoji: '🎾', labelKey: 'hostedEventCard.gameTypes.mensSingles' },
      womens_singles: { emoji: '🎾', labelKey: 'hostedEventCard.gameTypes.womensSingles' },
      mens_doubles: { emoji: '👥', labelKey: 'hostedEventCard.gameTypes.mensDoubles' },
      womens_doubles: { emoji: '👯', labelKey: 'hostedEventCard.gameTypes.womensDoubles' },
      mixed_doubles: { emoji: '👫', labelKey: 'hostedEventCard.gameTypes.mixedDoubles' },
    };

    const matchType = labels[normalizedType];
    if (!matchType) return null;

    return {
      emoji: matchType.emoji,
      label: t(matchType.labelKey),
    };
  };

  // 🔍 DEBUG: Log event props to diagnose re-invite button issue
  console.log('🔍 [HostedEventCard] Event props for re-invite button:', {
    eventId: event.id,
    eventTitle: event.title,
    gameType: event.gameType,
    partnerStatus: event.partnerStatus,
    lastRejectedPartnerName: event.lastRejectedPartnerName,
    hostPartnerName: event.hostPartnerName,
    partnerAccepted: event.partnerAccepted,
    shouldShowReinviteButton:
      event.gameType?.toLowerCase().includes('doubles') && event.partnerStatus === 'rejected',
  });

  return (
    <>
      <Card style={[styles.card, style]} mode='elevated'>
        <Card.Content>
          {/* 🎯 [2026-01-12] Badge Row: Event type (left) + Game type (center) + Status (right) */}
          <View style={styles.badgeRow}>
            {/* Left: Event type badge (매치, 번개 등) */}
            <View style={styles.eventBadge}>
              <Text style={styles.badgeEmoji}>{getEventTypeEmoji(event.type)}</Text>
              <Text style={styles.badgeText}>{getEventTypeLabel(event.type)}</Text>
            </View>
            {/* Center: Game type badge (혼성복식, 남자복식 등) */}
            <View style={styles.gameTypeBadgeCenter}>
              {(() => {
                const matchType = getMatchTypeLabel(event.gameType);
                if (matchType) {
                  return (
                    <View style={[styles.eventBadge, styles.gameTypeBadge]}>
                      <Text style={styles.badgeEmoji}>{matchType.emoji}</Text>
                      <Text style={[styles.badgeText, styles.gameTypeBadgeText]}>
                        {matchType.label}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </View>
            {/* Right: Status badge */}
            <View style={styles.statusBadgeRight}>
              {(() => {
                const status = event.status || 'upcoming';
                const isDoublesMatch = event.gameType?.toLowerCase().includes('doubles');
                const hasApprovedChallenger = event.approvedApplications?.some(
                  app => app.applicantId !== event.hostPartnerId
                );
                const isRecruitmentComplete = isDoublesMatch && hasApprovedChallenger;
                const displayStatus = isRecruitmentComplete ? 'recruitment_complete' : status;

                const statusConfig: { [key: string]: { label: string; color: string } } = {
                  upcoming: { label: t('hostedEventCard.status.inProgress'), color: '#2196F3' },
                  active: { label: t('hostedEventCard.status.inProgress'), color: '#2196F3' },
                  completed: { label: t('hostedEventCard.status.completed'), color: '#4CAF50' },
                  cancelled: { label: t('hostedEventCard.status.cancelled'), color: '#F44336' },
                  partner_pending: {
                    label: t('hostedEventCard.status.partnerPending'),
                    color: '#FF9800',
                  },
                  recruiting: {
                    label: t('hostedEventCard.status.recruiting'),
                    color: '#4CAF50',
                  },
                  recruitment_complete: {
                    label: t('hostedEventCard.status.full'),
                    color: '#2196F3',
                  },
                };

                const config = statusConfig[displayStatus] || statusConfig.upcoming;

                return (
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* Header: Club name + Title */}
          <View style={styles.header}>
            <Text style={styles.subtitle}>{event.clubName}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{event.title}</Text>
              {/* 🆕 [3개월 규칙] 친선경기 배지 */}
              {event.isRankedMatch === false && (
                <View style={styles.friendlyBadge}>
                  <Text style={styles.friendlyBadgeText}>{t('eventCard.labels.friendly')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons
                name='calendar-outline'
                size={16}
                color={themeColors.colors.onSurfaceVariant}
              />
              <Text style={styles.detailText}>
                {formatDate(event.date)} · {event.time}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => openLocationInMaps(formatFullLocation())}
              activeOpacity={0.7}
            >
              <Ionicons name='location-outline' size={16} color={themeColors.colors.primary} />
              <Text style={styles.locationLink}>{formatFullLocation()}</Text>
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <Ionicons
                name='people-outline'
                size={16}
                color={themeColors.colors.onSurfaceVariant}
              />
              <Text style={styles.detailText}>
                {t('hostedEventCard.participants', {
                  // 🎯 [KIM FIX v2] Calculate actual participant count
                  // Singles: host(1) + approved opponents
                  // Doubles: host(1) + partner(1 if accepted) + guest teams (2 per team)
                  current: (() => {
                    const isDoubles = event.gameType?.toLowerCase().includes('doubles');
                    let count = 1; // Host

                    // Add host partner if doubles and accepted
                    if (isDoubles && event.partnerStatus === 'accepted' && event.hostPartnerId) {
                      count += 1;
                    }

                    // Add approved applications
                    const approvedApps = localApprovedApplications || [];

                    // 🎯 [KIM FIX v3] Collect partnerIds to filter duplicate applications
                    const partnerIdsInTeams = new Set<string>();
                    approvedApps.forEach(app => {
                      if (app.partnerId) {
                        partnerIdsInTeams.add(app.partnerId);
                      }
                    });

                    // Filter out host partner applications AND duplicate partner applications
                    const guestApps = approvedApps.filter(app => {
                      if (app.applicantId === event.hostPartnerId) return false;
                      if (app.type === 'partner_invitation') return false;
                      // 🎯 [KIM FIX v3] Skip if this is a duplicate partner application
                      if (partnerIdsInTeams.has(app.applicantId) && !app.partnerId) return false;
                      return true;
                    });

                    if (isDoubles) {
                      // Each guest application = 2 people (applicant + partner)
                      count += guestApps.length * 2;
                    } else {
                      // Singles: each application = 1 person
                      count += guestApps.length;
                    }

                    return count;
                  })(),
                  max: event.maxParticipants,
                })}
              </Text>
            </View>
            {/* 🌤️ Weather Widget */}
            {renderWeatherWidget()}
            {/* 🎯 [KIM] Current Partner Pending Badge - Display partner who has pending invitation */}
            {event.gameType?.toLowerCase().includes('doubles') &&
              event.partnerStatus === 'pending' &&
              event.hostPartnerId &&
              event.hostPartnerName && (
                <View style={styles.detailRow}>
                  <Ionicons name='person-outline' size={16} color='#FF9800' />
                  <Text style={styles.detailText}>
                    {t('hostedEventCard.partner')}
                    {event.hostPartnerName}
                  </Text>
                  <View style={[styles.partnerPendingBadge, { backgroundColor: '#FF9800' }]}>
                    <Ionicons name='time-outline' size={12} color='#FFF' />
                    <Text style={[styles.partnerPendingText, { color: '#FFF' }]}>
                      {t('hostedEventCard.partnerStatus.pending')}
                    </Text>
                  </View>
                </View>
              )}
            {/* 💥 [KIM FIX] Partner Accepted Badge - Display partner who accepted invitation */}
            {/* 🎯 [2026-01-12] Move Accepted badge to separate line to prevent overflow */}
            {event.gameType?.toLowerCase().includes('doubles') &&
              event.partnerStatus === 'accepted' &&
              event.hostPartnerId &&
              event.hostPartnerName && (
                <View style={styles.partnerAcceptedContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name='person-outline' size={16} color='#4CAF50' />
                    <Text style={styles.detailText}>
                      {t('hostedEventCard.partner')}
                      {event.hostPartnerName}
                    </Text>
                  </View>
                  {/* 🎯 [2026-01-12] Accepted badge + LPR on separate line */}
                  <View style={styles.partnerStatusLine}>
                    <View style={[styles.partnerPendingBadge, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name='checkmark-circle-outline' size={12} color='#FFF' />
                      <Text style={[styles.partnerPendingText, { color: '#FFF' }]}>
                        {t('hostedEventCard.partnerStatus.accepted')}
                      </Text>
                    </View>
                    {/* 🎯 [KIM FIX] Show host team LPR */}
                    {(() => {
                      const hostLtr = event.hostId ? userLtrMap[event.hostId] || 0 : 0;
                      const partnerLtr = event.hostPartnerId
                        ? userLtrMap[event.hostPartnerId] || 0
                        : 0;
                      const hostTeamLtr = hostLtr + partnerLtr;
                      return hostTeamLtr > 0 ? (
                        <Text style={styles.teamLtrText}>
                          {`(${t('hostedEventCard.teams.doublesTeam')} LPR ${Math.round(hostTeamLtr)})`}
                        </Text>
                      ) : null;
                    })()}
                  </View>
                </View>
              )}
            {/* 🛡️ [CAPTAIN AMERICA] Partner Rejected Badge - Display all rejected partners from array */}
            {event.gameType?.toLowerCase().includes('doubles') &&
              event.partnerStatus === 'rejected' &&
              event.rejectedPartners &&
              event.rejectedPartners.length > 0 && (
                <>
                  {event.rejectedPartners.map((partner, index) => (
                    <View key={`${partner.partnerId}-${index}`} style={styles.detailRow}>
                      <Ionicons name='person-outline' size={16} color='#EF5350' />
                      <Text style={styles.detailText}>
                        {t('hostedEventCard.partner')}
                        {partner.partnerName || 'Unknown'}
                      </Text>
                      <View style={[styles.partnerPendingBadge, { backgroundColor: '#EF5350' }]}>
                        <Ionicons name='close-circle-outline' size={12} color='#FFF' />
                        <Text style={[styles.partnerPendingText, { color: '#FFF' }]}>
                          {t('hostedEventCard.partnerStatus.rejected')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            {/* 🛡️ [CAPTAIN AMERICA] Fallback for legacy lastRejectedPartnerName (if no array exists) */}
            {event.gameType?.toLowerCase().includes('doubles') &&
              event.partnerStatus === 'rejected' &&
              event.lastRejectedPartnerName &&
              (!event.rejectedPartners || event.rejectedPartners.length === 0) && (
                <View style={styles.detailRow}>
                  <Ionicons name='person-outline' size={16} color='#EF5350' />
                  <Text style={styles.detailText}>
                    {t('hostedEventCard.partner')}
                    {event.lastRejectedPartnerName}
                  </Text>
                  <View style={[styles.partnerPendingBadge, { backgroundColor: '#EF5350' }]}>
                    <Ionicons name='close-circle-outline' size={12} color='#FFF' />
                    <Text style={[styles.partnerPendingText, { color: '#FFF' }]}>
                      {t('hostedEventCard.partnerStatus.rejected')}
                    </Text>
                  </View>
                </View>
              )}
          </View>

          {/* Match Result Display */}
          {renderMatchResult()}

          {/* Action Buttons */}
          {renderActionButtons()}

          {/* Pending Applications - INSIDE THE CARD! */}
          {renderPendingApplications()}

          {/* 🎯 [OPERATION SOLO LOBBY] Looking for Partner Badge */}
          {renderLookingForPartnerBadge()}

          {/* Team Applications (Doubles only) */}
          {renderTeamApplications()}

          {/* Approved Applications */}
          {renderApprovedApplications()}

          {/* 🎯 [FRIEND INVITE] Invited Friends List */}
          {renderFriendInvitations()}
        </Card.Content>
      </Card>

      {/* Public Match Score Input Modal */}
      <PublicMatchScoreModal
        visible={scoreInputModalVisible}
        event={{
          id: event.id,
          hostId: event.hostId || '',
          hostName: localHostName || 'Unknown Host',
          hostPartnerId: event.hostPartnerId,
          hostPartnerName: event.hostPartnerName,
          partnerAccepted: event.partnerAccepted, // 🆕 [KIM FIX] Partner acceptance status
          partnerStatus: (event.partnerStatus === 'accepted' ? undefined : event.partnerStatus) as
            | string
            | undefined, // 🆕 [KIM FIX] Partner invitation status
          gameType: localGameType,
          scheduledTime: event.date,
          approvedApplications: localApprovedApplications?.map(app => ({
            applicantId: app.applicantId,
            applicantName: app.applicantName,
            partnerId: app.partnerId,
            partnerName: app.partnerName, // 🎯 [KIM FIX] 도전팀 파트너 이름 추가
          })),
        }}
        currentUserId={currentUserId!}
        onClose={() => setScoreInputModalVisible(false)}
        onSuccess={() => {
          // Refresh event data
          onRefresh?.();
        }}
      />
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any, theme: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      marginVertical: 8,
      backgroundColor: colors.surface,
    },
    // 🎯 [2026-01-12] Badge row: event type (left) + game type (center) + status (right)
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    gameTypeBadgeCenter: {
      flex: 1,
      alignItems: 'center',
    },
    statusBadgeRight: {
      alignItems: 'flex-end',
    },
    // 🎯 [KIM FIX] Game type badge styling
    gameTypeBadge: {
      backgroundColor: colors.primary + '20', // 20% opacity
    },
    gameTypeBadgeText: {
      color: colors.primary,
    },
    header: {
      flexDirection: 'column',
      marginBottom: 12,
    },
    eventBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeEmoji: {
      fontSize: 14,
      marginRight: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },
    headerContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    // 🆕 [3개월 규칙] 친선경기 배지 스타일
    friendlyBadge: {
      backgroundColor: '#FFE0B2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    friendlyBadgeText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: '#E65100',
    },
    subtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    detailsContainer: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginLeft: 8,
    },
    // 🗺️ [KIM] Clickable location link style
    locationLink: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 8,
      textDecorationLine: 'underline',
    },
    eventActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      marginTop: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      minWidth: 80,
      justifyContent: 'center',
    },
    chatButton: {
      backgroundColor: theme === 'dark' ? '#1A3A52' : '#e3f2fd',
    },
    chatButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#1976d2',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    editButton: {
      backgroundColor: theme === 'dark' ? '#4A3A2A' : '#fff3e0',
    },
    editButtonText: {
      color: theme === 'dark' ? '#FFB74D' : '#ff9800',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? '#4A2C2C' : '#ffebee',
    },
    cancelButtonText: {
      color: theme === 'dark' ? '#EF5350' : '#f44336',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // 🎯 [KIM FIX] 점수 제출 후 버튼 비활성화 스타일
    disabledButton: {
      backgroundColor: theme === 'dark' ? '#2A2A2A' : '#f5f5f5',
      borderColor: '#888888',
      opacity: 0.6,
    },
    disabledButtonText: {
      color: '#888888',
    },
    scoreButton: {
      backgroundColor: theme === 'dark' ? '#2A4A3A' : '#e8f5e9',
      borderColor: theme === 'dark' ? '#66BB6A' : '#4caf50',
    },
    scoreButtonText: {
      color: theme === 'dark' ? '#66BB6A' : '#4caf50',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    reinviteButton: {
      backgroundColor: theme === 'dark' ? '#2A4A3A' : '#e8f5e9',
      borderColor: theme === 'dark' ? '#66BB6A' : '#4caf50',
    },
    reinviteButtonText: {
      color: theme === 'dark' ? '#66BB6A' : '#4caf50',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    setLocationButton: {
      backgroundColor: theme === 'dark' ? '#1A3A52' : '#e3f2fd',
      borderColor: theme === 'dark' ? '#64B5F6' : '#2196F3',
    },
    setLocationButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#2196F3',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    pendingApplicationsSection: {
      backgroundColor: theme === 'dark' ? '#1E1E1E' : '#f9f9f9',
      padding: 16,
      marginTop: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    pendingApplicationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
    },
    approvedApplicationsSection: {
      backgroundColor: theme === 'dark' ? '#1A2820' : '#E8F5E9',
      padding: 16,
      marginTop: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#2E7D32' : '#81C784',
    },
    approvedApplicationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#81C784' : '#2E7D32',
      marginBottom: 12,
    },
    approvedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    applicationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    applicantInfo: {
      flex: 1,
      marginRight: 12,
    },
    applicantName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    // 🎯 [KIM FIX] Applicant name row with LPR
    applicantNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    clickableName: {
      color: '#4FC3F7', // Light blue to indicate clickable
      textDecorationLine: 'underline',
    },
    applicantNtrp: {
      fontSize: 14,
      fontWeight: '500',
      color: '#4FC3F7', // Light blue like host LPR
    },
    // 🎯 [KIM FIX] Team LPR text style
    teamLtrText: {
      fontSize: 12,
      fontWeight: '400',
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    applicationMessage: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    applicationDate: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    applicationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    approveButton: {
      backgroundColor: theme === 'dark' ? '#2C4A2C' : '#e8f5e8',
    },
    approveButtonText: {
      color: theme === 'dark' ? '#81C784' : '#4caf50',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    rejectButton: {
      backgroundColor: theme === 'dark' ? '#4A2C2C' : '#ffebee',
    },
    rejectButtonText: {
      color: theme === 'dark' ? '#EF5350' : '#f44336',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    matchResultSection: {
      marginTop: 12,
      marginBottom: 12,
    },
    matchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 12,
    },
    matchResultLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    matchResultScore: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    // 🎯 [2026-01-12] statusBadgeContainer is no longer used - kept for backwards compatibility
    statusBadgeContainer: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    matchTypeEmoji: {
      fontSize: 12,
    },
    teamApplicationsSection: {
      backgroundColor: theme === 'dark' ? '#1E2A3A' : '#E3F2FD',
      padding: 16,
      marginTop: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#2196F3' : '#64B5F6',
    },
    teamApplicationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#64B5F6' : '#1976D2',
      marginBottom: 12,
    },
    teamCard: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    teamMembers: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    teamMemberText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.onSurface,
    },
    teamActions: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
    },
    // 🎯 [OPERATION DUO] Team Application Display Styles
    teamHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    teamLabel: {
      fontSize: 12,
      color: theme === 'dark' ? '#64B5F6' : '#2196F3',
      fontWeight: '600',
    },
    // 🎯 [2026-01-12] Container for partner accepted section (name + status on separate lines)
    partnerAcceptedContainer: {
      flexDirection: 'column',
      gap: 4,
    },
    // 🎯 [2026-01-12] Status line for accepted badge + LPR
    partnerStatusLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 24, // Align with text after icon
      gap: 8,
    },
    // 🎯 Phase 4: Partner Pending Badge Styles
    partnerPendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF3E0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    partnerPendingText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FF9800',
    },
    // 🎯 [OPERATION SOLO LOBBY] Looking for Partner Badge Styles
    lookingForPartnerSection: {
      marginTop: 16,
      marginBottom: 8,
    },
    lookingForPartnerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#4A3A2A' : '#FFF3E0',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#FFB74D' : '#FF9800',
      gap: 8,
    },
    lookingForPartnerText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFB74D' : '#FF9800',
    },
    // 🎯 [FRIEND INVITE] Friend invitations section styles
    friendInvitationsSection: {
      backgroundColor: theme === 'dark' ? '#1A3A2A' : '#E8F5E9',
      padding: 16,
      marginTop: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#4CAF50' : '#81C784',
    },
    friendInvitationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#81C784' : '#2E7D32',
      marginBottom: 12,
    },
    friendInvitationCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#2A4A3A' : '#C8E6C9',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      marginBottom: 8,
    },
    friendInvitationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    friendInvitationName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#1B5E20',
    },
    friendInvitationStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      gap: 4,
    },
    friendInvitationStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 🌤️ Weather Widget Styles
    weatherWidget: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 8,
      gap: 8,
    },
    weatherIcon: {
      fontSize: 20,
    },
    weatherInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    weatherTemp: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#64B5F6' : '#1976D2',
    },
    weatherCondition: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    rainChance: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    rainChanceText: {
      fontSize: 11,
      color: '#2196F3',
      fontWeight: '500',
    },
    windSpeed: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    windIcon: {
      fontSize: 12,
    },
    windSpeedText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    windCondition: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

export default HostedEventCard;
