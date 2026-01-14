/**
 * AppliedEventCard - Reusable component for displaying applied event cards
 * Used in the "My Activities" -> "Applied" tab
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 * Based on HostedEventCard but for applicants/participants
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Surface, ActivityIndicator } from 'react-native-paper';
import {
  onSnapshot,
  doc,
  DocumentSnapshot,
  collection,
  query,
  where,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import * as Localization from 'expo-localization';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { db } from '../../firebase/config';
import activityService from '../../services/activityService';
import weatherService from '../../services/weatherService';
import { useLanguage } from '../../contexts/LanguageContext';
import { convertEloToLtr } from '../../utils/lprUtils';
import { createFeedItem } from '../../services/feedService';

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

export interface AppliedEvent extends SimpleEvent {
  applicationStatus?:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'pending_partner_approval'
    | 'looking_for_partner'
    | 'closed'; // 🎯 [KIM FIX] Solo application closed when another team is approved
  applicationId?: string;
  chatUnreadCount?: { [userId: string]: number };
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
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
  currentParticipants?: number; // 🌤️ [KIM FIX] Current participant count
  matchResult?: {
    score: {
      finalScore: string;
      sets?: Array<{
        player1Games: number;
        player2Games: number;
        player1TiebreakPoints?: number;
        player2TiebreakPoints?: number;
      }>;
    };
    winnerId: string;
    hostResult: 'win' | 'loss';
    opponentResult: 'win' | 'loss';
  };
  // 🎯 [KIM FIX] Host team info (호스트팀)
  hostId?: string;
  hostName?: string;
  hostLtrLevel?: number; // 🎯 [KIM FIX] Host's actual NTRP level for display
  hostPartnerId?: string;
  hostPartnerName?: string;
  // 🎯 [KIM FIX] Challenger team info (도전팀)
  applicantId?: string;
  applicantName?: string;
  partnerId?: string; // 도전팀 파트너 ID
  partnerName?: string; // 도전팀 파트너 이름
  partnerStatus?: 'pending' | 'accepted' | 'rejected';
  partnerInvitationId?: string;
  // 🎯 [KIM FIX] Approved applications (for host team members to see opponent)
  approvedApplications?: Array<{
    applicantId: string;
    applicantName?: string;
    partnerId?: string;
    partnerName?: string;
    status?: string;
    type?: string; // 🎯 [KIM FIX v3] 'partner_invitation' = host partner, undefined = guest team
    invitedBy?: string; // 🎯 [ROOT CAUSE FIX] Team leader ID (invitedBy === applicantId for team leader)
  }>;
  // 🎯 [OPERATION SOLO] Solo lobby - Team proposal fields
  pendingProposalFrom?: string;
  pendingProposalFromName?: string;
  // 🎯 [KIM FIX] Game type for match type determination
  gameType?: string; // 'singles', 'doubles', etc.
  // 🆕 [3개월 규칙] Ranked match flag
  isRankedMatch?: boolean; // false = 친선경기 (기록에 반영 안됨)
}

interface AppliedEventCardProps {
  event: AppliedEvent;
  currentUserId?: string;
  onCancelApplication?: (applicationId: string, eventTitle: string) => void;
  onOpenChat?: (eventId: string, eventTitle: string) => void;
  onReinvitePartner?: (applicationId: string, eventId: string, eventTitle: string) => void;
  style?: object;
}

const AppliedEventCard: React.FC<AppliedEventCardProps> = ({
  event,
  currentUserId,
  onCancelApplication,
  onOpenChat,
  onReinvitePartner,
  style,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors, currentTheme);
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  // 🎯 [KIM FIX] Navigate to user profile when clicking on a player in solo lobby
  const handlePlayerPress = (userId: string, userName: string) => {
    console.log('🎯 [AppliedEventCard] Navigating to profile:', { userId, userName });
    navigation.navigate('UserProfile', { userId });
  };

  // 🔍 [DEBUG] Check team data
  console.log('🔍 [AppliedEventCard] Team data:', {
    eventId: event.id,
    eventTitle: event.title,
    currentUserId,
    // Host team
    hostId: event.hostId,
    hostName: event.hostName,
    hostPartnerId: event.hostPartnerId,
    hostPartnerName: event.hostPartnerName,
    // Challenger team
    applicantId: event.applicantId,
    applicantName: event.applicantName,
    partnerId: event.partnerId,
    partnerName: event.partnerName,
    partnerStatus: event.partnerStatus,
  });

  // 💬 Firestore에서 직접 chatUnreadCount 구독
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(0);

  // 🎯 [KIM FIX] userId -> displayName 매핑 (항상 최신 닉네임 표시용)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  // 🌤️ Weather state
  const [weather, setWeather] = useState<WeatherData | null>(event.lastWeather || null);
  // 🌤️ [KIM FIX] Local state for placeDetails from Firestore (for weather coordinates)
  const [localPlaceDetails, setLocalPlaceDetails] = useState<
    { coordinates?: { lat: number; lng: number } } | undefined
  >(event.placeDetails);

  // 🎯 [OPERATION SOLO] Solo Lobby - State for other solo applicants
  interface SoloApplicant {
    applicationId: string;
    applicantId: string;
    applicantName: string;
    skillLevel?: string; // 🎯 [KIM FIX] Add NTRP for display
    ltrLevel?: number; // 🎯 [KIM FIX v2] Numeric LPR for team validation (1-10)
    pendingProposalFrom?: string;
    pendingProposalFromName?: string;
  }
  const [soloApplicants, setSoloApplicants] = useState<SoloApplicant[]>([]);

  // 🎯 [KIM FIX v2] Current user's LPR for team validation
  const [myLtrLevel, setMyLtrLevel] = useState<number | undefined>(undefined);

  // 🎯 [OPERATION SOLO] Real-time state for pending proposal on current user's application
  const [myPendingProposal, setMyPendingProposal] = useState<{
    from: string;
    fromName: string;
    fromApplicationId: string; // 🎯 [KIM FIX] Proposer's application ID for merge
  } | null>(null);

  // 🎯 [KIM FIX] Loading state for accepting proposal
  const [isAcceptingProposal, setIsAcceptingProposal] = useState(false);

  // 🎯 [KIM FIX] Real-time approved participants for meetups
  interface ApprovedParticipant {
    id: string;
    applicantId: string;
    applicantName: string;
    status: string;
  }
  const [realtimeApprovedParticipants, setRealtimeApprovedParticipants] = useState<
    ApprovedParticipant[]
  >([]);

  // 🎯 [KIM FIX] Real-time host NTRP level (fetched from user document)
  const [liveHostNtrp, setLiveHostNtrp] = useState<number | null>(event.hostLtrLevel || null);
  // 🎯 [KIM FIX] Real-time host partner NTRP level for doubles combined LPR
  const [liveHostPartnerNtrp, setLiveHostPartnerNtrp] = useState<number | null>(null);
  // 🎯 [KIM FIX] Real-time MY TEAM LPR (applicant + partner) for doubles combined display
  const [liveApplicantNtrp, setLiveApplicantNtrp] = useState<number | null>(null);
  const [liveMyPartnerNtrp, setLiveMyPartnerNtrp] = useState<number | null>(null);
  // 🎯 [KIM FIX v2] Real-time GUEST TEAM LPR (for host viewing guest team)
  const [liveGuestApplicantLtr, setLiveGuestApplicantLtr] = useState<number | null>(null);
  const [liveGuestPartnerLtr, setLiveGuestPartnerLtr] = useState<number | null>(null);

  // 🎯 [KIM FIX v18] ALWAYS fetch host's live LPR from ELO
  // Don't trust event.hostLtrLevel - it may be stale/incorrect from event creation time
  useEffect(() => {
    // If no hostId, can't fetch
    if (!event.hostId) return;

    console.log('🔍 [AppliedEventCard] Fetching live host LPR for:', event.hostId);

    // Subscribe to host's user document for live LPR
    const unsubscribe = onSnapshot(
      doc(db, 'users', event.hostId),
      snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          let ltr: number | null = null;

          // 🎯 [KIM FIX v26] Use game-type-specific ELO (doubles for doubles, mixed for mixed, singles for singles)
          const eloKey = getEloKeyForGameType(event.gameType);
          const gameTypeElo = userData?.eloRatings?.[eloKey]?.current;

          if (gameTypeElo && gameTypeElo > 0) {
            ltr = convertEloToLtr(gameTypeElo);
            console.log(`🎾 [AppliedEventCard] Host ${eloKey} ELO ${gameTypeElo} → LPR ${ltr}`);
          } else if (userData?.profile?.ltrLevel) {
            // Fallback: Use profile.ltrLevel directly (already 1-10 scale from onboarding)
            const profileLtr = userData.profile.ltrLevel;
            if (typeof profileLtr === 'number') {
              ltr = profileLtr;
            } else if (typeof profileLtr === 'string') {
              ltr = parseInt(profileLtr, 10);
            }
            console.log(`📋 [AppliedEventCard] Host Profile LPR ${ltr} (no ELO)`);
          }

          if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            console.log('✅ [AppliedEventCard] Live host LPR fetched:', ltr);
            setLiveHostNtrp(ltr);
          } else {
            console.log('⚠️ [AppliedEventCard] No LPR found in userData!');
          }
        }
      },
      error => {
        console.error('❌ [AppliedEventCard] Error fetching host LPR:', error);
      }
    );

    return () => unsubscribe();
  }, [event.hostId, event.gameType]); // 🎯 [KIM FIX v26] Include gameType for correct ELO key

  // 🎯 [KIM FIX] Fetch host partner's LPR for doubles combined display
  useEffect(() => {
    // Only fetch if it's doubles and has a host partner
    const isDoubles = event.gameType?.toLowerCase().includes('doubles');
    if (!isDoubles || !event.hostPartnerId) return;

    console.log('🔍 [AppliedEventCard] Fetching host partner LPR for:', event.hostPartnerId);

    const unsubscribe = onSnapshot(
      doc(db, 'users', event.hostPartnerId),
      snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          let ltr: number | null = null;

          // 🎯 [KIM FIX v26] Use game-type-specific ELO (doubles for doubles, mixed for mixed)
          const eloKey = getEloKeyForGameType(event.gameType);
          const gameTypeElo = userData?.eloRatings?.[eloKey]?.current;

          if (gameTypeElo && gameTypeElo > 0) {
            ltr = convertEloToLtr(gameTypeElo);
            console.log(
              `🎾 [AppliedEventCard] Host Partner ${eloKey} ELO ${gameTypeElo} → LPR ${ltr}`
            );
          } else if (userData?.profile?.ltrLevel) {
            const profileLtr = userData.profile.ltrLevel;
            if (typeof profileLtr === 'number') {
              ltr = profileLtr;
            } else if (typeof profileLtr === 'string') {
              ltr = parseInt(profileLtr, 10);
            }
            console.log(`📋 [AppliedEventCard] Host Partner Profile LPR ${ltr}`);
          }

          if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            console.log('✅ [AppliedEventCard] Live host partner LPR fetched:', ltr);
            setLiveHostPartnerNtrp(ltr);
          }
        }
      },
      error => {
        console.error('❌ [AppliedEventCard] Error fetching host partner LPR:', error);
      }
    );

    return () => unsubscribe();
  }, [event.hostPartnerId, event.gameType]);

  // 🎯 [KIM FIX] Real-time MY TEAM LPR - Fetch applicant and my partner's LPR for combined display
  useEffect(() => {
    const isDoubles = event.gameType?.toLowerCase().includes('doubles');
    const hasTeamPartner = event.partnerName && event.partnerId;

    // Only fetch if doubles match with team partner
    if (!isDoubles || !hasTeamPartner) {
      setLiveApplicantNtrp(null);
      setLiveMyPartnerNtrp(null);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    // 🎯 [KIM FIX v26] Use game-type specific ELO for correct LPR calculation
    const eloKey = getEloKeyForGameType(event.gameType);

    // Fetch applicant (me) LPR
    if (event.applicantId) {
      const unsubscribeApplicant = onSnapshot(doc(db, 'users', event.applicantId), snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          let ltr: number | null = null;

          // 🎯 [KIM FIX v26] Use game-type specific ELO (mixed for 혼복, doubles for 복식)
          const gameTypeElo = userData?.eloRatings?.[eloKey]?.current;

          if (gameTypeElo && gameTypeElo > 0) {
            ltr = convertEloToLtr(gameTypeElo);
          } else if (userData?.profile?.ltrLevel) {
            const profileLtr = userData.profile.ltrLevel;
            ltr = typeof profileLtr === 'number' ? profileLtr : parseInt(profileLtr, 10);
          }

          if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            setLiveApplicantNtrp(ltr);
          }
        }
      });
      unsubscribes.push(unsubscribeApplicant);
    }

    // Fetch my partner's LPR
    if (event.partnerId) {
      const unsubscribePartner = onSnapshot(doc(db, 'users', event.partnerId), snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          let ltr: number | null = null;

          // 🎯 [KIM FIX v26] Use game-type specific ELO (mixed for 혼복, doubles for 복식)
          const gameTypeElo = userData?.eloRatings?.[eloKey]?.current;

          if (gameTypeElo && gameTypeElo > 0) {
            ltr = convertEloToLtr(gameTypeElo);
          } else if (userData?.profile?.ltrLevel) {
            const profileLtr = userData.profile.ltrLevel;
            ltr = typeof profileLtr === 'number' ? profileLtr : parseInt(profileLtr, 10);
          }

          if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            setLiveMyPartnerNtrp(ltr);
          }
        }
      });
      unsubscribes.push(unsubscribePartner);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [event.applicantId, event.partnerId, event.partnerName, event.gameType]);

  // 🎯 [KIM FIX v2] Real-time GUEST TEAM LPR - Fetch guest applicant and partner's LPR for host view
  useEffect(() => {
    const isDoubles = event.gameType?.toLowerCase().includes('doubles');

    // Only fetch if doubles match and we have approvedApplications (host viewing guest team)
    if (!isDoubles || !event.approvedApplications || event.approvedApplications.length === 0) {
      setLiveGuestApplicantLtr(null);
      setLiveGuestPartnerLtr(null);
      return;
    }

    // Find the guest team application (not partner_invitation, has both members)
    // 🎯 [KIM FIX] Only include team leader's document (invitedBy === applicantId)
    // This prevents duplicate display when both team members have applications
    // 🎯 [KIM FIX v28] Must have partnerId to correctly calculate team LPR
    const guestTeamApp = event.approvedApplications.find(
      app =>
        app.applicantName &&
        app.partnerName &&
        app.partnerId && // 🎯 [KIM FIX v28] Must have partnerId for LPR calculation!
        app.type !== 'partner_invitation' &&
        app.status === 'approved' &&
        // 🎯 [ROOT CAUSE FIX] Team leader's document has invitedBy === applicantId
        (!app.invitedBy || app.invitedBy === app.applicantId)
    );

    if (!guestTeamApp || !guestTeamApp.applicantId) {
      setLiveGuestApplicantLtr(null);
      setLiveGuestPartnerLtr(null);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    // Fetch guest applicant LPR
    const unsubscribeApplicant = onSnapshot(
      doc(db, 'users', guestTeamApp.applicantId),
      snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          let ltr: number | null = null;

          const eloKey = getEloKeyForGameType(event.gameType);
          const gameTypeElo = userData?.eloRatings?.[eloKey]?.current;

          if (gameTypeElo && gameTypeElo > 0) {
            ltr = convertEloToLtr(gameTypeElo);
          } else if (userData?.profile?.ltrLevel) {
            const profileLtr = userData.profile.ltrLevel;
            ltr = typeof profileLtr === 'number' ? profileLtr : parseInt(profileLtr, 10);
          }

          if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            setLiveGuestApplicantLtr(ltr);
          }
        }
      }
    );
    unsubscribes.push(unsubscribeApplicant);

    // Fetch guest partner LPR
    if (guestTeamApp.partnerId) {
      const unsubscribePartner = onSnapshot(doc(db, 'users', guestTeamApp.partnerId), snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          let ltr: number | null = null;

          const eloKey = getEloKeyForGameType(event.gameType);
          const gameTypeElo = userData?.eloRatings?.[eloKey]?.current;

          if (gameTypeElo && gameTypeElo > 0) {
            ltr = convertEloToLtr(gameTypeElo);
          } else if (userData?.profile?.ltrLevel) {
            const profileLtr = userData.profile.ltrLevel;
            ltr = typeof profileLtr === 'number' ? profileLtr : parseInt(profileLtr, 10);
          }

          if (ltr && !isNaN(ltr) && ltr >= 1 && ltr <= 10) {
            setLiveGuestPartnerLtr(ltr);
          }
        }
      });
      unsubscribes.push(unsubscribePartner);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [event.approvedApplications, event.gameType]);

  // 🎯 [KIM FIX] Real-time subscription for approved participants (meetups)
  useEffect(() => {
    if (!event.id || event.type?.toLowerCase() !== 'meetup') return;

    console.log('🔔 [AppliedEventCard] Setting up real-time listener for approved participants');

    const approvedQuery = query(
      collection(db, 'participation_applications'),
      where('eventId', '==', event.id),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(
      approvedQuery,
      snapshot => {
        const participants: ApprovedParticipant[] = [];
        snapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          participants.push({
            id: docSnapshot.id,
            applicantId: data.applicantId,
            applicantName: data.applicantName || 'Unknown',
            status: data.status,
          });
        });
        console.log(
          '✅ [AppliedEventCard] Real-time approved participants update:',
          participants.length
        );
        setRealtimeApprovedParticipants(participants);
      },
      error => {
        console.error('❌ [AppliedEventCard] Error in approved participants listener:', error);
      }
    );

    return () => {
      console.log('🧹 [AppliedEventCard] Cleaning up approved participants listener');
      unsubscribe();
    };
  }, [event.id, event.type]);

  useEffect(() => {
    if (!event.id || !currentUserId) return;

    console.log('🔔 [AppliedEventCard] Setting up Firestore listener for event:', event.id);

    const eventRef = doc(db, 'events', event.id);
    const unsubscribe = onSnapshot(
      eventRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const unreadCount = data?.chatUnreadCount?.[currentUserId] || 0;
          console.log('🔔 [AppliedEventCard] Unread count updated:', {
            eventId: event.id,
            userId: currentUserId,
            unreadCount,
          });
          setLocalUnreadCount(unreadCount);
        }
      },
      (error: Error) => {
        console.error('❌ [AppliedEventCard] Firestore listener error:', error);
      }
    );

    return () => {
      console.log('🧹 [AppliedEventCard] Cleaning up Firestore listener for event:', event.id);
      unsubscribe();
    };
  }, [event.id, currentUserId]);

  // 🎯 [KIM FIX] Fetch latest display names from users collection
  // This ensures we always show the current nickname, not cached data
  useEffect(() => {
    const fetchLatestUserNames = async () => {
      // Collect all unique user IDs that need name lookup
      const userIds = new Set<string>();

      // Host team
      if (event.hostId) userIds.add(event.hostId);
      if (event.hostPartnerId) userIds.add(event.hostPartnerId);

      // Challenger team from direct props
      if (event.applicantId) userIds.add(event.applicantId);
      if (event.partnerId) userIds.add(event.partnerId);

      // Also from approvedApplications
      if (event.approvedApplications && Array.isArray(event.approvedApplications)) {
        event.approvedApplications.forEach(app => {
          if (app.applicantId) userIds.add(app.applicantId);
          if (app.partnerId) userIds.add(app.partnerId);
        });
      }

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
        console.log('🎯 [AppliedEventCard] User name map loaded:', nameMap);
      } catch (error) {
        console.error('❌ [AppliedEventCard] Failed to fetch user names:', error);
      }
    };

    fetchLatestUserNames();
  }, [
    event.hostId,
    event.hostPartnerId,
    event.applicantId,
    event.partnerId,
    event.approvedApplications,
  ]);

  // 🌤️ [KIM FIX] Firestore listener for placeDetails (weather coordinates)
  useEffect(() => {
    if (!event.id) return;

    console.log('🌤️ [AppliedEventCard] Setting up placeDetails listener for event:', event.id);

    const lightningEventRef = doc(db, 'lightning_events', event.id);
    const unsubscribe = onSnapshot(
      lightningEventRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const placeDetails = data?.placeDetails;
          if (placeDetails) {
            console.log('🌤️ [AppliedEventCard] Firestore placeDetails found:', {
              hasCoordinates: !!placeDetails?.coordinates,
              coordinates: placeDetails?.coordinates,
            });
            setLocalPlaceDetails(placeDetails);
          }
        }
      },
      (error: Error) => {
        console.error('❌ [AppliedEventCard] PlaceDetails listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [event.id]);

  // 🎯 [OPERATION SOLO] Real-time listener for current user's application (incoming proposals)
  useEffect(() => {
    if (
      event.applicationStatus !== 'looking_for_partner' ||
      !event.applicationId ||
      !currentUserId
    ) {
      setMyPendingProposal(null);
      return;
    }

    console.log('🔔 [SOLO LOBBY] Setting up listener for my application:', event.applicationId);

    const myAppRef = doc(db, 'participation_applications', event.applicationId);
    const unsubscribe = onSnapshot(
      myAppRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (
            data.pendingProposalFrom &&
            data.pendingProposalFromName &&
            data.pendingProposalFromApplicationId
          ) {
            console.log('📩 [SOLO LOBBY] Received proposal from:', data.pendingProposalFromName);
            setMyPendingProposal({
              from: data.pendingProposalFrom,
              fromName: data.pendingProposalFromName,
              fromApplicationId: data.pendingProposalFromApplicationId,
            });
          } else {
            setMyPendingProposal(null);
          }
        }
      },
      error => {
        console.error('❌ [SOLO LOBBY] Error in my application listener:', error);
      }
    );

    return () => {
      console.log('🔕 [SOLO LOBBY] Cleaning up my application listener');
      unsubscribe();
    };
  }, [event.applicationStatus, event.applicationId, currentUserId]);

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
    const isMatchCompleted = !!(event.matchResult || event.status === 'completed');
    const isMeetup = event.type?.toLowerCase() === 'meetup';
    const eventTime = eventDateObj.getTime();
    const twoHoursAfterEvent = eventTime + 2 * 60 * 60 * 1000;
    const meetupExpired = isMeetup && Date.now() > twoHoursAfterEvent;

    // 날씨 표시 중단 조건: 매치 완료 OR meetup 시간 + 2시간 경과
    const shouldStopShowingWeather = isMatchCompleted || meetupExpired;

    const fetchWeather = async () => {
      // 🌤️ [KIM FIX] 날씨 표시 중단 조건이면 fetch 안 함
      if (shouldStopShowingWeather) {
        console.log('🌤️ [AppliedEventCard] Weather display stopped:', {
          isMatchCompleted,
          meetupExpired,
        });
        return false;
      }

      // 🌤️ [KIM FIX] Get coordinates from multiple possible locations (including local state from Firestore listener)
      console.log('🌤️ [AppliedEventCard] Checking coordinates for event:', event.id, {
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

      // 🌤️ [KIM FIX] Debug: Log actual coordinates value
      console.log('🌤️ [AppliedEventCard] Coordinates value:', JSON.stringify(coordinates));

      // 좌표가 없거나 lat/lng가 없으면 날씨 가져올 수 없음
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        console.log('🌤️ [AppliedEventCard] No valid coordinates available for weather');
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
          '🌤️ [AppliedEventCard] Invalid event.date format:',
          typeof event.date,
          event.date
        );
        return false;
      }

      console.log('🌤️ [AppliedEventCard] About to call weatherService with:', {
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
          console.log('🌤️ [AppliedEventCard] Weather fetched:', typedWeatherData.condition);
          return true;
        }
      } catch (error) {
        console.error('❌ [AppliedEventCard] Weather fetch error:', error);
      }
      return false;
    };

    // 🌤️ [KIM FIX] 날씨 표시 중단 조건이면 fetch하지 않고 interval도 설정하지 않음
    if (shouldStopShowingWeather) {
      console.log('🌤️ [AppliedEventCard] Weather display stopped, no fetch needed');
      return;
    }

    // Initial fetch
    fetchWeather();

    // 🔄 [KIM FIX] Set up 15-minute interval for weather updates (only for active events)
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const intervalId = setInterval(() => {
      console.log('🔄 [AppliedEventCard] Auto-refreshing weather (15-min interval)');
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
    localPlaceDetails, // 🌤️ [KIM FIX] Re-run when Firestore listener updates placeDetails
    event.date,
    event.matchResult,
    event.status,
    event.location,
    event.type,
  ]);

  // 🎯 [KIM FIX v2] Helper: Get game-type specific ELO key
  const getEloKeyForGameType = (gameType?: string): string => {
    if (!gameType) return 'singles';
    const gt = gameType.toLowerCase();
    if (gt.includes('mixed')) return 'mixed';
    if (gt.includes('doubles')) return 'doubles';
    return 'singles';
  };

  // 🎯 [KIM FIX v2] Fetch current user's LPR for team validation
  useEffect(() => {
    if (!currentUserId || event.applicationStatus !== 'looking_for_partner') {
      setMyLtrLevel(undefined);
      return;
    }

    const fetchMyLtr = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const eloKey = getEloKeyForGameType(event.gameType);
          const elo = userData.eloRatings?.[eloKey]?.current || 1200;
          const ltr = convertEloToLtr(elo);
          console.log(`🎯 [SOLO LOBBY] My LPR for ${eloKey}: ${ltr} (ELO: ${elo})`);
          setMyLtrLevel(ltr);
        }
      } catch (error) {
        console.warn('Failed to fetch my LPR:', error);
      }
    };

    fetchMyLtr();
  }, [currentUserId, event.applicationStatus, event.gameType]);

  // 🎯 [OPERATION SOLO] Real-time listener for other solo applicants
  useEffect(() => {
    if (event.applicationStatus !== 'looking_for_partner' || !event.id || !currentUserId) {
      setSoloApplicants([]);
      return;
    }

    console.log('🔔 [SOLO LOBBY] Setting up real-time listener for solo applicants');

    const soloQuery = query(
      collection(db, 'participation_applications'),
      where('eventId', '==', event.id),
      where('status', '==', 'looking_for_partner')
    );

    const unsubscribe = onSnapshot(
      soloQuery,
      async snapshot => {
        const applicantsData: {
          applicationId: string;
          applicantId: string;
          applicantName: string;
          skillLevel?: string;
          pendingProposalFrom?: string;
          pendingProposalFromName?: string;
        }[] = [];

        snapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          // Exclude current user's application
          if (data.applicantId !== currentUserId) {
            applicantsData.push({
              applicationId: docSnapshot.id,
              applicantId: data.applicantId,
              applicantName: data.applicantName || 'Unknown',
              // 🎯 [KIM FIX] Try multiple fields for LPR/NTRP
              skillLevel:
                data.applicantNtrp || data.applicantSkillLevel || data.skillLevel || data.ntrp,
              pendingProposalFrom: data.pendingProposalFrom,
              pendingProposalFromName: data.pendingProposalFromName,
            });
          }
        });

        // 🎯 [KIM FIX v2] Fetch game-type specific LPR from eloRatings
        const eloKey = event.gameType?.toLowerCase().includes('mixed')
          ? 'mixed'
          : event.gameType?.toLowerCase().includes('doubles')
            ? 'doubles'
            : 'singles';

        const applicantsWithLtr = await Promise.all(
          applicantsData.map(async applicant => {
            if (applicant.applicantId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', applicant.applicantId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  // 🎯 [KIM FIX v2] Get game-type specific ELO and convert to LPR
                  const elo = userData.eloRatings?.[eloKey]?.current || 1200;
                  const ltrLevel = convertEloToLtr(elo);

                  console.log(
                    `🎯 [SOLO LOBBY] Applicant ${applicant.applicantName}: ${eloKey} ELO=${elo}, LPR=${ltrLevel}`
                  );

                  return {
                    ...applicant,
                    skillLevel: `LPR ${ltrLevel}`,
                    ltrLevel, // 🎯 Numeric LPR for team validation
                  };
                }
              } catch (error) {
                console.warn('Failed to fetch LPR for applicant:', applicant.applicantId, error);
              }
            }
            return applicant;
          })
        );

        console.log(
          '🎯 [SOLO LOBBY] Real-time update - solo applicants:',
          applicantsWithLtr.length
        );
        setSoloApplicants(applicantsWithLtr);
      },
      error => {
        console.error('❌ [SOLO LOBBY] Error in solo applicants listener:', error);
      }
    );

    return () => {
      console.log('🔕 [SOLO LOBBY] Cleaning up solo applicants listener');
      unsubscribe();
    };
  }, [event.applicationStatus, event.id, currentUserId]);

  const formatDate = (date: Date) => {
    const locale = t('common.locale');
    return new Intl.DateTimeFormat(locale, {
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

    return location || t('appliedEventCard.locationTbd');
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
    const normalizedType = type?.toLowerCase() || '';

    const typeKey = `appliedEventCard.eventType.${normalizedType}`;
    const translatedType = t(typeKey);

    // If translation not found (returns the key), fallback to capitalized type or 'General'
    if (translatedType === typeKey) {
      return type
        ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
        : t('appliedEventCard.eventType.general');
    }

    return translatedType;
  };

  // 🎯 [KIM FIX v28] Get match type label with emoji (혼성복식, 남자복식 등)
  const getMatchTypeLabel = (gameType?: string): { emoji: string; label: string } | null => {
    if (!gameType) return null;

    const normalizedType = gameType.toLowerCase();
    const labels: { [key: string]: { emoji: string; labelKey: string } } = {
      mens_singles: { emoji: '🎾', labelKey: 'appliedEventCard.gameTypes.mensSingles' },
      womens_singles: { emoji: '🎾', labelKey: 'appliedEventCard.gameTypes.womensSingles' },
      mens_doubles: { emoji: '👥', labelKey: 'appliedEventCard.gameTypes.mensDoubles' },
      womens_doubles: { emoji: '👯', labelKey: 'appliedEventCard.gameTypes.womensDoubles' },
      mixed_doubles: { emoji: '👫', labelKey: 'appliedEventCard.gameTypes.mixedDoubles' },
    };

    const matchType = labels[normalizedType];
    if (!matchType) return null;

    return {
      emoji: matchType.emoji,
      label: t(matchType.labelKey),
    };
  };

  const getApplicationStatusLabel = (status: string): string => {
    switch (status) {
      case 'looking_for_partner':
        return t('appliedEventCard.status.lookingForPartner');
      case 'pending_partner_approval':
        return t('appliedEventCard.status.awaitingPartner');
      case 'pending':
        return t('appliedEventCard.status.pending');
      case 'approved':
        return t('appliedEventCard.status.approved');
      case 'rejected':
        return t('appliedEventCard.status.rejected');
      case 'closed':
        return t('appliedEventCard.status.closed');
      default:
        return '';
    }
  };

  // 🎯 [OPERATION SOLO] Team proposal functions
  const proposeTeam = async (targetApplicationId: string) => {
    if (!currentUserId || !event.applicationId) return;

    // Use applicantName from current user's application (this is a solo application, so we are the applicant)
    const myName = event.applicantName || 'Unknown';

    try {
      console.log('🎯 [SOLO LOBBY] Proposing team to:', targetApplicationId, 'from:', myName);
      const targetAppRef = doc(db, 'participation_applications', targetApplicationId);
      await updateDoc(targetAppRef, {
        pendingProposalFrom: currentUserId,
        pendingProposalFromName: myName,
        pendingProposalFromApplicationId: event.applicationId, // 🎯 [KIM FIX] Include proposer's applicationId
      });

      // Real-time listener will automatically update the UI
      console.log('✅ [SOLO LOBBY] Team proposal sent successfully');
    } catch (error) {
      console.error('❌ [OPERATION SOLO] Error proposing team:', error);
    }
  };

  const acceptProposal = async () => {
    if (!event.applicationId || !myPendingProposal) return;

    // Prevent double-tap
    if (isAcceptingProposal) return;
    setIsAcceptingProposal(true);

    try {
      console.log('🎯 [OPERATION SOLO] Accepting team proposal via Cloud Function');
      console.log('📋 [MERGE] proposerApplicationId:', myPendingProposal.fromApplicationId);
      console.log('📋 [MERGE] acceptorApplicationId:', event.applicationId);

      // 🎯 [KIM FIX] Call Cloud Function to merge solo applications into team
      const result = await activityService.mergeSoloToTeam(
        myPendingProposal.fromApplicationId, // Proposer's application
        event.applicationId // Acceptor's application (mine)
      );

      console.log('✅ [OPERATION SOLO] Team proposal accepted:', result);

      // 🎯 [KIM FIX v2] Create feed notification for the proposer
      // Note: myPendingProposal.from is the userId (not fromUserId)
      try {
        await createFeedItem({
          type: 'proposal_accepted',
          actorId: currentUserId,
          actorName: event.applicantName || 'Unknown',
          targetId: myPendingProposal.from, // 🎯 [KIM FIX] Use 'from' not 'fromUserId'
          targetName: myPendingProposal.fromName,
          eventId: event.eventId,
          visibleTo: [myPendingProposal.from], // Only visible to proposer
          metadata: {
            eventTitle: event.title,
            acceptorName: event.applicantName || 'Unknown',
          },
        });
        console.log(
          '✅ [KIM] Proposal accepted feed created for proposer:',
          myPendingProposal.from
        );
      } catch (feedError) {
        console.error('❌ [KIM] Error creating proposal accepted feed:', feedError);
      }

      Alert.alert(
        t('appliedEventCard.alerts.teamFormedTitle'),
        t('appliedEventCard.alerts.teamFormedMessage', { name: myPendingProposal.fromName })
      );
    } catch (error) {
      console.error('❌ [OPERATION SOLO] Error accepting proposal:', error);
      Alert.alert(
        t('appliedEventCard.alerts.error'),
        error instanceof Error ? error.message : t('appliedEventCard.alerts.teamFormFailed')
      );
    } finally {
      setIsAcceptingProposal(false);
    }
  };

  const rejectProposal = async () => {
    if (!event.applicationId || !myPendingProposal) return;

    try {
      console.log('🎯 [OPERATION SOLO] Rejecting team proposal');

      // 🎯 [KIM FIX v2] Create feed notification for the proposer BEFORE clearing proposal
      // Note: myPendingProposal.from is the userId (not fromUserId)
      try {
        await createFeedItem({
          type: 'proposal_rejected',
          actorId: currentUserId,
          actorName: event.applicantName || 'Unknown',
          targetId: myPendingProposal.from, // 🎯 [KIM FIX] Use 'from' not 'fromUserId'
          targetName: myPendingProposal.fromName,
          eventId: event.eventId,
          visibleTo: [myPendingProposal.from], // Only visible to proposer
          metadata: {
            eventTitle: event.title,
            rejectorName: event.applicantName || 'Unknown',
          },
        });
        console.log(
          '✅ [KIM] Proposal rejected feed created for proposer:',
          myPendingProposal.from
        );
      } catch (feedError) {
        console.error('❌ [KIM] Error creating proposal rejected feed:', feedError);
      }

      const appRef = doc(db, 'participation_applications', event.applicationId);
      await updateDoc(appRef, {
        pendingProposalFrom: null,
        pendingProposalFromName: null,
        pendingProposalFromApplicationId: null, // 🎯 [KIM FIX] Also clear applicationId
      });

      console.log('✅ [OPERATION SOLO] Team proposal rejected');
    } catch (error) {
      console.error('❌ [OPERATION SOLO] Error rejecting proposal:', error);
    }
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
        label: t('appliedEventCard.wind.noEffect'),
        color: '#4CAF50',
      };
    } else if (windSpeedMph <= 10) {
      return {
        label: t('appliedEventCard.wind.minorAdjustments'),
        color: '#8BC34A',
      };
    } else if (windSpeedMph <= 15) {
      return {
        label: t('appliedEventCard.wind.affectsServesLobs'),
        color: '#FF9800',
      };
    } else if (windSpeedMph <= 20) {
      return {
        label: t('appliedEventCard.wind.significantImpact'),
        color: '#F44336',
      };
    } else {
      return {
        label: t('appliedEventCard.wind.notRecommended'),
        color: '#9C27B0',
      };
    }
  };

  // 🌤️ Render compact weather widget
  const renderWeatherWidget = () => {
    if (!weather) return null;

    // 🌡️ Temperature: Use Fahrenheit for US/UK, Celsius for others
    const displayTemp = useImperialUnits ? `${weather.temperatureF}°F` : `${weather.temperature}°C`;

    // 💨 Wind Speed: Open-Meteo returns mph directly, convert to km/h for metric regions
    // weather.windSpeed is now in mph from Open-Meteo API
    const windSpeedMph = weather.windSpeed || 0;
    const displayWindSpeed =
      weather.windSpeed !== undefined
        ? useImperialUnits
          ? `${Math.round(windSpeedMph)} mph`
          : `${Math.round(windSpeedMph * 1.60934)} km/h`
        : null;

    // 🎾 Get pickleball wind condition (based on mph)
    const pickleballWindCondition =
      weather.windSpeed !== undefined ? getPickleballWindCondition(windSpeedMph) : null;

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
    const translateCondition = (condition: string): string => {
      const translationKey = `meetupDetail.weather.conditions.${condition}`;
      const translated = t(translationKey);
      return translated !== translationKey ? translated : condition;
    };
    const baseCondition = translateCondition(weather.condition);
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
    if (!event.matchResult || !event.matchResult.score?.finalScore) {
      return null;
    }

    const matchData = event.matchResult;

    // 🎯 [KIM FIX] Determine if current user is on host team or challenger team
    const isUserOnHostTeam =
      currentUserId === event.hostId || currentUserId === event.hostPartnerId;

    // If user is on host team, use hostResult; otherwise use opponentResult
    const isUserWinner = isUserOnHostTeam
      ? matchData.hostResult === 'win'
      : matchData.opponentResult === 'win';

    // 🎯 [KIM FIX] 단식은 "나의 승리/상대의 승리", 복식은 "우리팀의 승리/상대팀의 승리"
    const isDoubles = event.gameType?.toLowerCase().includes('doubles');
    const winnerTeamText = isUserWinner
      ? isDoubles
        ? t('appliedEventCard.matchResult.ourTeamWon')
        : t('appliedEventCard.matchResult.iWon')
      : isDoubles
        ? t('appliedEventCard.matchResult.opponentTeamWon')
        : t('appliedEventCard.matchResult.opponentWon');

    // 🎯 [KIM FIX] Build score with tiebreak from sets if available
    let displayScore = matchData.score.finalScore;
    if (matchData.score.sets && Array.isArray(matchData.score.sets)) {
      displayScore = matchData.score.sets
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

    const winBackgroundColor = currentTheme === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9';
    const lossBackgroundColor = currentTheme === 'dark' ? 'rgba(239, 83, 80, 0.15)' : '#FFEBEE';

    return (
      <View style={styles.matchResultSection}>
        <View
          style={[
            styles.matchResultCard,
            {
              backgroundColor: isUserWinner ? winBackgroundColor : lossBackgroundColor,
            },
          ]}
        >
          <Ionicons
            name={isUserWinner ? 'trophy' : 'medal'}
            size={20}
            color={isUserWinner ? '#4CAF50' : '#EF5350'}
          />
          <Text
            style={[
              styles.matchResultLabel,
              {
                color: isUserWinner ? '#4CAF50' : '#EF5350',
              },
            ]}
          >
            {winnerTeamText} {displayScore}
          </Text>
        </View>
      </View>
    );
  };

  // 🎯 [OPERATION SOLO] Render Solo Lobby Section
  const renderSoloLobby = () => {
    // 🎯 [KIM FIX] Show closed message when application is closed
    if (event.applicationStatus === 'closed') {
      return (
        <Surface style={styles.soloLobbySection} elevation={1}>
          <View style={styles.soloLobbyHeader}>
            <Ionicons name='close-circle-outline' size={20} color='#EF5350' />
            <Text style={styles.soloLobbyTitle}>{t('appliedEventCard.soloLobby.title')}</Text>
          </View>
          <View style={styles.closedMessageContainer}>
            <Text style={styles.closedMessageText}>
              {t('appliedEventCard.soloLobby.closedMessage')}
            </Text>
          </View>
        </Surface>
      );
    }

    if (event.applicationStatus !== 'looking_for_partner') return null;

    // Check if current user has received a proposal (using real-time state)
    const hasReceivedProposal = myPendingProposal !== null;

    return (
      <Surface style={styles.soloLobbySection} elevation={1}>
        <View style={styles.soloLobbyHeader}>
          <Ionicons name='people-outline' size={20} color={themeColors.colors.primary} />
          <Text style={styles.soloLobbyTitle}>{t('appliedEventCard.soloLobby.title')}</Text>
        </View>

        {/* Received Proposal Section */}
        {hasReceivedProposal && myPendingProposal && (
          <View style={styles.proposalReceivedContainer}>
            <View style={styles.proposalReceivedHeader}>
              <Ionicons name='mail' size={16} color='#FF9800' />
              <Text style={styles.proposalReceivedText}>
                {t('appliedEventCard.soloLobby.proposalReceived', {
                  name: myPendingProposal.fromName,
                })}
              </Text>
            </View>
            <View style={styles.proposalActions}>
              <TouchableOpacity
                style={[styles.proposalButton, styles.acceptButton]}
                onPress={acceptProposal}
                disabled={isAcceptingProposal}
              >
                {isAcceptingProposal ? (
                  <ActivityIndicator size={16} color='#FFFFFF' />
                ) : (
                  <Ionicons name='checkmark' size={16} color='#FFFFFF' />
                )}
                <Text style={styles.acceptButtonText}>
                  {isAcceptingProposal
                    ? t('appliedEventCard.soloLobby.processing')
                    : t('appliedEventCard.soloLobby.accept')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proposalButton, styles.declineButton]}
                onPress={rejectProposal}
                disabled={isAcceptingProposal}
              >
                <Ionicons name='close' size={16} color='#FFFFFF' />
                <Text style={styles.declineButtonText}>
                  {t('appliedEventCard.soloLobby.decline')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Other Solo Applicants List */}
        {soloApplicants.length === 0 ? (
          <View style={styles.noApplicantsContainer}>
            <Text style={styles.noApplicantsText}>
              {t('appliedEventCard.soloLobby.noApplicants')}
            </Text>
          </View>
        ) : (
          <View style={styles.applicantsList}>
            <Text style={styles.applicantsListHeader}>
              {t('appliedEventCard.soloLobby.otherApplicants', { count: soloApplicants.length })}
            </Text>
            {soloApplicants.map(applicant => {
              const hasSentProposal = applicant.pendingProposalFrom === currentUserId;

              return (
                <View key={applicant.applicationId} style={styles.applicantRow}>
                  {/* 🎯 [KIM FIX] Clickable player info to view profile */}
                  <TouchableOpacity
                    style={styles.applicantInfo}
                    onPress={() =>
                      handlePlayerPress(applicant.applicantId, applicant.applicantName)
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name='person-circle-outline'
                      size={24}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                    <Text style={styles.applicantName}>
                      {applicant.applicantName}
                      {applicant.skillLevel && (
                        <Text style={styles.applicantNtrpText}> ({applicant.skillLevel})</Text>
                      )}
                    </Text>
                    {/* 🎯 [KIM FIX] Visual hint that player is clickable */}
                    <Ionicons
                      name='chevron-forward'
                      size={16}
                      color={themeColors.colors.onSurfaceVariant}
                      style={{ marginLeft: 4, opacity: 0.6 }}
                    />
                  </TouchableOpacity>
                  {hasSentProposal ? (
                    <View style={styles.proposalSentBadge}>
                      <Ionicons name='time-outline' size={14} color='#FF9800' />
                      <Text style={styles.proposalSentText}>
                        {t('appliedEventCard.soloLobby.sent')}
                      </Text>
                    </View>
                  ) : applicant.pendingProposalFrom ? (
                    <View style={styles.proposalSentBadge}>
                      <Text style={styles.proposalSentText}>
                        {t('appliedEventCard.soloLobby.hasProposal')}
                      </Text>
                    </View>
                  ) : (
                    (() => {
                      // 🎯 [KIM FIX v3] LPR 범위 검증 - 내 팀 LPR이 호스트팀 LPR ± 2 범위 안에 있어야 팀 제안 가능
                      const hostTeamLtr =
                        liveHostNtrp && liveHostPartnerNtrp
                          ? liveHostNtrp + liveHostPartnerNtrp
                          : null;
                      const myTeamLtr =
                        myLtrLevel !== undefined && applicant.ltrLevel !== undefined
                          ? myLtrLevel + applicant.ltrLevel
                          : null;

                      // 범위 검증: hostTeamLtr ± 2
                      const isWithinRange =
                        hostTeamLtr === null ||
                        myTeamLtr === null ||
                        (myTeamLtr >= hostTeamLtr - 2 && myTeamLtr <= hostTeamLtr + 2);

                      if (!isWithinRange) {
                        // 🚫 LPR 범위 밖 - 비활성화된 버튼 표시
                        return (
                          <View style={[styles.proposeButton, styles.proposeButtonDisabled]}>
                            <Ionicons name='ban-outline' size={16} color='#999999' />
                            <Text style={styles.proposeButtonDisabledText}>
                              {t('appliedEventCard.soloLobby.ltrOutOfRange', {
                                defaultValue: 'LPR 범위 초과',
                              })}
                            </Text>
                          </View>
                        );
                      }

                      // ✅ LPR 범위 안 - 활성화된 버튼
                      return (
                        <TouchableOpacity
                          style={styles.proposeButton}
                          onPress={() => proposeTeam(applicant.applicationId)}
                        >
                          <Ionicons
                            name='add-circle-outline'
                            size={16}
                            color={currentTheme === 'dark' ? '#64B5F6' : '#2196F3'}
                          />
                          <Text style={styles.proposeButtonText}>
                            {t('appliedEventCard.soloLobby.proposeTeam')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Surface>
    );
  };

  const renderActionButtons = () => {
    const { applicationStatus, applicationId } = event;
    // 🎯 [KIM FIX v2] 취소 버튼 비활성화 조건:
    // - 경기 결과가 있으면 (matchResult) → 취소 불가
    // - 점수 입력이 안 된 매치는 날짜가 지나도 취소 가능!
    const isCancelDisabled = !!event.matchResult;

    return (
      <View style={styles.eventActions}>
        {/* Chat Button */}
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
            <Text style={styles.chatButtonText}>{t('appliedEventCard.actions.chat')}</Text>
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

        {/* Cancel Application Button (only if pending or approved) */}
        {applicationStatus && applicationStatus !== 'rejected' && applicationId && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.cancelButton,
              isCancelDisabled && styles.disabledButton,
            ]}
            onPress={() => onCancelApplication?.(applicationId, event.title)}
            disabled={isCancelDisabled}
          >
            <Ionicons
              name='close-circle-outline'
              size={16}
              color={isCancelDisabled ? '#999999' : currentTheme === 'dark' ? '#EF5350' : '#f44336'}
            />
            <Text style={[styles.cancelButtonText, isCancelDisabled && styles.disabledButtonText]}>
              {t('appliedEventCard.actions.cancel')}
            </Text>
          </TouchableOpacity>
        )}

        {/* 🎯 [OPERATION DUO - PHASE 2A] Re-invite Partner Button (only if partner rejected) */}
        {event.partnerStatus === 'rejected' && applicationId && onReinvitePartner && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reinviteButton]}
            onPress={() => onReinvitePartner(applicationId, event.id, event.title)}
          >
            <Ionicons
              name='person-add-outline'
              size={16}
              color={currentTheme === 'dark' ? '#64B5F6' : '#2196F3'}
            />
            <Text style={styles.reinviteButtonText}>
              {t('appliedEventCard.actions.inviteNewPartner')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
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
            {getMatchTypeLabel(event.gameType) && (
              <View style={[styles.eventBadge, styles.gameTypeBadge]}>
                <Text style={styles.badgeEmoji}>{getMatchTypeLabel(event.gameType)?.emoji}</Text>
                <Text style={[styles.badgeText, styles.gameTypeBadgeText]}>
                  {getMatchTypeLabel(event.gameType)?.label}
                </Text>
              </View>
            )}
          </View>
          {/* Right: Status badge */}
          <View style={styles.statusBadgeRight}>
            {(() => {
              // 🎯 [KIM FIX v3] Host partner shows "모집중" until GUEST TEAM is approved
              const isHostPartner = currentUserId === event.hostPartnerId;
              const hasApprovedGuestTeam =
                event.approvedApplications &&
                event.approvedApplications.some(
                  app => app.status === 'approved' && app.type !== 'partner_invitation'
                );
              const showRecruitingForHostPartner =
                isHostPartner && event.applicationStatus === 'approved' && !hasApprovedGuestTeam;

              if (event.status === 'completed' && event.matchResult) {
                return (
                  <View style={[styles.statusBadge, styles.statusCompleted]}>
                    <Text style={[styles.statusText, styles.statusCompletedText]}>
                      {t('appliedEventCard.status.completed')}
                    </Text>
                  </View>
                );
              }

              if (showRecruitingForHostPartner) {
                return (
                  <View style={[styles.statusBadge, styles.statusRecruiting]}>
                    <Text style={[styles.statusText, styles.statusRecruitingText]}>
                      {t('appliedEventCard.status.recruiting')}
                    </Text>
                  </View>
                );
              }

              if (event.applicationStatus) {
                const showPartnerName =
                  event.applicationStatus === 'pending_partner_approval' && event.partnerName;
                const statusLabel = showPartnerName
                  ? `${getApplicationStatusLabel(event.applicationStatus)}: ${event.partnerName}`
                  : getApplicationStatusLabel(event.applicationStatus);

                return (
                  <View
                    style={[
                      styles.statusBadge,
                      event.applicationStatus === 'pending_partner_approval' &&
                        styles.statusPartnerPending,
                      event.applicationStatus === 'pending' && styles.statusPending,
                      event.applicationStatus === 'approved' && styles.statusApproved,
                      event.applicationStatus === 'rejected' && styles.statusRejected,
                      event.applicationStatus === 'looking_for_partner' &&
                        styles.statusLookingForPartner,
                      event.applicationStatus === 'closed' && styles.statusClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        event.applicationStatus === 'pending_partner_approval' &&
                          styles.statusPartnerPendingText,
                        event.applicationStatus === 'pending' && styles.statusPendingText,
                        event.applicationStatus === 'approved' && styles.statusApprovedText,
                        event.applicationStatus === 'rejected' && styles.statusRejectedText,
                        event.applicationStatus === 'looking_for_partner' &&
                          styles.statusLookingForPartnerText,
                        event.applicationStatus === 'closed' && styles.statusClosedText,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                );
              }

              return null;
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
                <Text style={styles.friendlyBadgeText}>
                  {t('appliedEventCard.labels.friendly')}
                </Text>
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
            <Ionicons name='people-outline' size={16} color={themeColors.colors.onSurfaceVariant} />
            <Text style={styles.detailText}>
              {/* 🎯 [KIM FIX v29] Calculate actual participant count dynamically */}
              {(() => {
                const isDoubles = event.gameType?.toLowerCase().includes('doubles');
                let count = 1; // Host

                // Add host partner if doubles and accepted
                if (isDoubles && event.partnerStatus === 'accepted' && event.hostPartnerId) {
                  count += 1;
                }

                // Add approved applications
                const approvedApps = event.approvedApplications || [];

                // 🎯 [KIM FIX v29] Collect partnerIds to filter duplicate applications
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
                  // 🎯 [KIM FIX v29] Skip if this is a duplicate partner application
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
              })()}
              /{event.maxParticipants}명
            </Text>
          </View>
          {/* 🌤️ Weather Widget */}
          {renderWeatherWidget()}
          {/* 🎯 [KIM FIX] Team Information Display (복식 매치 - 우리팀/상대팀) */}
          {(() => {
            // 🎯 [KIM FIX] Check if user is actually on a team (not just by status)
            // A user is a solo applicant if:
            // 1. They have 'looking_for_partner' status, OR
            // 2. They have 'closed' status AND are not part of any team
            // Note: Host team partners may have various statuses but are still on the team
            const isOnHostTeamByRole =
              currentUserId === event.hostId || currentUserId === event.hostPartnerId;

            const isSoloApplicant =
              event.applicationStatus === 'looking_for_partner' ||
              (event.applicationStatus === 'closed' && !isOnHostTeamByRole && !event.partnerId);

            // 🎯 [KIM FIX] Solo applicants should STILL see host team info
            // Just skip the detailed team matching logic below

            // 🎯 [KIM FIX] 승인 여부에 따라 다르게 표시
            const isApproved = event.applicationStatus === 'approved';

            // 호스트 정보 (복식: hostName & hostPartnerName, 단식/모임: hostName만)
            const isDoubles = event.gameType?.toLowerCase().includes('doubles');
            const hostDisplay =
              isDoubles && event.hostPartnerName
                ? `${event.hostName} & ${event.hostPartnerName}`
                : event.hostName;

            // 호스트 정보가 없으면 표시 안함
            if (!hostDisplay) return null;

            // 🎯 [KIM FIX] Solo applicants: Show host team info with NTRP
            if (isSoloApplicant) {
              return (
                <View style={styles.teamsSection}>
                  <View style={styles.teamCard}>
                    <Text style={styles.teamCardLabel}>{t('appliedEventCard.teams.host')}</Text>
                    <View style={styles.teamCardContent}>
                      <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                      <Text style={styles.teamCardName}>
                        {hostDisplay}
                        {/* 🎯 [KIM FIX] For doubles: show combined LPR (host + partner), for singles: show host LPR */}
                        {(() => {
                          const isDoublesMatch = event.gameType?.toLowerCase().includes('doubles');
                          if (isDoublesMatch && liveHostNtrp && liveHostPartnerNtrp) {
                            // Doubles: show combined LPR with "복식팀" label
                            const combinedLtr = liveHostNtrp + liveHostPartnerNtrp;
                            return (
                              <Text style={styles.teamNtrpText}>
                                {` (${t('appliedEventCard.teams.doublesTeam')} LPR ${combinedLtr})`}
                              </Text>
                            );
                          } else if (liveHostNtrp) {
                            // Singles or doubles without partner LPR yet
                            return (
                              <Text style={styles.teamNtrpText}>
                                {` (${isDoublesMatch ? t('appliedEventCard.teams.doubles') : t('appliedEventCard.teams.singles')} LPR ${liveHostNtrp})`}
                              </Text>
                            );
                          }
                          return null;
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }

            // 🎯 승인 전: 호스트 정보 + 내 팀 정보 표시 (with NTRP)
            if (!isApproved) {
              // 🎯 [KIM FIX] 팀 신청인 경우 파트너 정보 표시
              const hasTeamPartner = event.partnerName && event.applicationStatus === 'pending';

              return (
                <View style={styles.teamsSection}>
                  {/* 호스트 정보 */}
                  <View style={styles.teamCard}>
                    <Text style={styles.teamCardLabel}>{t('appliedEventCard.teams.host')}</Text>
                    <View style={styles.teamCardContent}>
                      <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                      <Text style={styles.teamCardName}>
                        {hostDisplay}
                        {/* 🎯 [KIM FIX] For doubles: show combined LPR (host + partner), for singles: show host LPR */}
                        {(() => {
                          const isDoublesMatch = event.gameType?.toLowerCase().includes('doubles');
                          if (isDoublesMatch && liveHostNtrp && liveHostPartnerNtrp) {
                            // Doubles: show combined LPR with "복식팀" label
                            const combinedLtr = liveHostNtrp + liveHostPartnerNtrp;
                            return (
                              <Text style={styles.teamNtrpText}>
                                {` (${t('appliedEventCard.teams.doublesTeam')} LPR ${combinedLtr})`}
                              </Text>
                            );
                          } else if (liveHostNtrp) {
                            // Singles or doubles without partner LPR yet
                            return (
                              <Text style={styles.teamNtrpText}>
                                {` (${isDoublesMatch ? t('appliedEventCard.teams.doubles') : t('appliedEventCard.teams.singles')} LPR ${liveHostNtrp})`}
                              </Text>
                            );
                          }
                          return null;
                        })()}
                      </Text>
                    </View>
                  </View>

                  {/* 🎯 [KIM FIX] 팀 신청: 내 팀 정보 표시 */}
                  {hasTeamPartner && (
                    <View style={[styles.teamCard, styles.myTeamCard]}>
                      <Text style={[styles.teamCardLabel, { color: '#FFA500' }]}>
                        {t('appliedEventCard.teams.myTeamPending')}
                      </Text>
                      <View style={styles.teamCardContent}>
                        <Ionicons name='hourglass-outline' size={18} color='#FFA500' />
                        <Text style={styles.teamCardName}>
                          {event.applicantName || t('appliedEventCard.teams.me')} &{' '}
                          {event.partnerName}
                          {/* 🎯 [KIM FIX] Show combined LPR for my team (applicant + partner) */}
                          {(() => {
                            if (liveApplicantNtrp && liveMyPartnerNtrp) {
                              const combinedLtr = liveApplicantNtrp + liveMyPartnerNtrp;
                              return (
                                <Text style={styles.teamNtrpText}>
                                  {` (${t('appliedEventCard.teams.doublesTeam')} LPR ${combinedLtr})`}
                                </Text>
                              );
                            } else if (liveApplicantNtrp) {
                              return (
                                <Text style={styles.teamNtrpText}>
                                  {` (LPR ${liveApplicantNtrp})`}
                                </Text>
                              );
                            }
                            return null;
                          })()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            }

            // 🎯 승인 후: 호스트팀 + 게스트팀(참가자) 전체 표시
            const isMeetupEvent = event.type?.toLowerCase() === 'meetup';

            // 🎯 [KIM FIX] Meetup: 승인된 모든 참가자 목록 표시 (실시간 업데이트)
            if (isMeetupEvent) {
              // 🎯 [KIM FIX] Use real-time approved participants from Firestore subscription
              const approvedParticipantNames = realtimeApprovedParticipants.map(
                p => p.applicantName
              );

              return (
                <View style={styles.teamsSection}>
                  {/* 호스트 카드 */}
                  <View style={styles.teamCard}>
                    <Text style={styles.teamCardLabel}>{t('appliedEventCard.teams.host')}</Text>
                    <View style={styles.teamCardContent}>
                      <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                      <Text style={styles.teamCardName}>{hostDisplay}</Text>
                    </View>
                  </View>

                  {/* 승인된 참가자 목록 (있을 때만) - 실시간 업데이트 */}
                  {approvedParticipantNames.length > 0 && (
                    <View style={styles.teamCard}>
                      <Text style={styles.teamCardLabel}>
                        {t('appliedEventCard.teams.participants', {
                          count: approvedParticipantNames.length,
                        })}
                      </Text>
                      <View style={styles.participantsList}>
                        {approvedParticipantNames.map((name, index) => (
                          <View key={index} style={styles.teamCardContent}>
                            <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                            <Text style={styles.teamCardName}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            }

            // 🎯 Match (복식): 도전팀(게스트팀) 표시
            // 도전팀(게스트팀): applicantName & partnerName (from myApplication or approvedApplications)
            let challengerTeam: string | null = null;
            let challengerTeamLtr: number | null = null;

            // 🎯 [KIM FIX v27] Detect if current user is on HOST team
            // Host team members: host or host partner (they view challenger team from approvedApplications)
            // Challenger team members: applicant or their partner (they see their own team from props)
            const isHostTeamMember =
              currentUserId === event.hostId || currentUserId === event.hostPartnerId;

            // First try from direct props (for challenger team members ONLY)
            // 🎯 [KIM FIX v27] Only use this path for actual CHALLENGER team members
            // Host partners also have event.applicantName/partnerName (from their application),
            // but they should use approvedApplications to see the REAL challenger team
            if (!isHostTeamMember && event.applicantName && event.partnerName) {
              const applicantDisplayName =
                (event.applicantId && userNameMap[event.applicantId]) || event.applicantName;
              const partnerDisplayName =
                (event.partnerId && userNameMap[event.partnerId]) || event.partnerName;
              challengerTeam = `${applicantDisplayName} & ${partnerDisplayName}`;
              // 🎯 [KIM FIX] Get challenger team LPR from live state (my team)
              if (liveApplicantNtrp && liveMyPartnerNtrp) {
                challengerTeamLtr = liveApplicantNtrp + liveMyPartnerNtrp;
              }
            }
            // Then try from approvedApplications (for host team members OR if direct props not available)
            // 🎯 [KIM FIX] Only show guest team if application is APPROVED (status === 'approved')
            // 🎯 [ROOT CAUSE FIX] Only include team leader's document (invitedBy === applicantId)
            // 🎯 [KIM FIX v28] Must have partnerId for correct team display and LPR calculation
            else if (event.approvedApplications && event.approvedApplications.length > 0) {
              const guestTeamApp = event.approvedApplications.find(
                app =>
                  app.applicantName &&
                  app.partnerName &&
                  app.partnerId && // 🎯 [KIM FIX v28] Must have partnerId for LPR calculation!
                  app.type !== 'partner_invitation' &&
                  app.status === 'approved' && // 🎯 Must be approved!
                  // 🎯 [ROOT CAUSE FIX] Team leader's document has invitedBy === applicantId
                  (!app.invitedBy || app.invitedBy === app.applicantId)
              );
              if (guestTeamApp) {
                // 🎯 [KIM FIX] Use userNameMap for real-time name lookup
                const guestApplicantName =
                  (guestTeamApp.applicantId && userNameMap[guestTeamApp.applicantId]) ||
                  guestTeamApp.applicantName;
                const guestPartnerName =
                  (guestTeamApp.partnerId && userNameMap[guestTeamApp.partnerId]) ||
                  guestTeamApp.partnerName;
                challengerTeam = `${guestApplicantName} & ${guestPartnerName}`;
                // 🎯 [KIM FIX v2] Get challenger team LPR from live state (real-time from user documents)
                if (liveGuestApplicantLtr && liveGuestPartnerLtr) {
                  challengerTeamLtr = liveGuestApplicantLtr + liveGuestPartnerLtr;
                }
              }
            }

            // 🎯 [KIM FIX] Calculate host team LPR
            const hostTeamLtr =
              isDoubles && liveHostNtrp && liveHostPartnerNtrp
                ? liveHostNtrp + liveHostPartnerNtrp
                : liveHostNtrp;

            return (
              <View style={styles.teamsSection}>
                {/* 호스트팀 카드 */}
                <View style={styles.teamCard}>
                  <Text style={styles.teamCardLabel}>
                    {isDoubles
                      ? t('appliedEventCard.teams.hostTeam')
                      : t('appliedEventCard.teams.host')}
                  </Text>
                  <View style={styles.teamCardContent}>
                    <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                    <View style={styles.teamCardNameContainer}>
                      <Text style={styles.teamCardName}>{hostDisplay}</Text>
                      {/* 🎯 [2026-01-12] Show team LPR on separate line */}
                      {hostTeamLtr && (
                        <Text style={styles.teamLtrText}>
                          {isDoubles
                            ? `(${t('appliedEventCard.teams.doublesTeam')} LPR ${hostTeamLtr})`
                            : `(LPR ${hostTeamLtr})`}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* 게스트팀 카드 (복식이고 게스트팀이 있을 때만) */}
                {isDoubles && challengerTeam && (
                  <View style={styles.teamCard}>
                    <Text style={styles.teamCardLabel}>
                      {t('appliedEventCard.teams.guestTeam')}
                    </Text>
                    <View style={styles.teamCardContent}>
                      <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                      <View style={styles.teamCardNameContainer}>
                        <Text style={styles.teamCardName}>{challengerTeam}</Text>
                        {/* 🎯 [2026-01-12] Show challenger team LPR on separate line */}
                        {challengerTeamLtr && (
                          <Text style={styles.teamLtrText}>
                            {`(${t('appliedEventCard.teams.doublesTeam')} LPR ${challengerTeamLtr})`}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* 파트너 상태 배지 (게스트팀이 아직 없고, 파트너 대기 중일 때) */}
                {!challengerTeam && event.partnerStatus && (
                  <View style={styles.partnerStatusRow}>
                    {event.partnerStatus === 'accepted' && (
                      <View style={[styles.partnerStatusBadge, styles.partnerStatusAccepted]}>
                        <Ionicons name='checkmark-circle' size={12} color='#FFFFFF' />
                        <Text style={styles.partnerStatusText}>
                          {t('appliedEventCard.partnerStatus.accepted')}
                        </Text>
                      </View>
                    )}
                    {event.partnerStatus === 'rejected' && (
                      <View style={[styles.partnerStatusBadge, styles.partnerStatusRejected]}>
                        <Ionicons name='close-circle' size={12} color='#FFFFFF' />
                        <Text style={styles.partnerStatusText}>
                          {t('appliedEventCard.partnerStatus.declined')}
                        </Text>
                      </View>
                    )}
                    {event.partnerStatus === 'pending' && (
                      <View style={[styles.partnerStatusBadge, styles.partnerStatusPending]}>
                        <Ionicons name='time-outline' size={12} color='#FFFFFF' />
                        <Text style={styles.partnerStatusText}>
                          {t('appliedEventCard.partnerStatus.pending')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })()}
        </View>

        {/* Match Result Display */}
        {renderMatchResult()}

        {/* 🎯 [OPERATION SOLO] Solo Lobby Section */}
        {renderSoloLobby()}

        {/* Action Buttons */}
        {renderActionButtons()}
      </Card.Content>
    </Card>
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
    // 🎯 [KIM FIX v28] Game type badge (혼성복식 등)
    gameTypeBadge: {
      backgroundColor: colors.primary + '20', // 20% opacity
    },
    gameTypeBadgeText: {
      color: colors.primary,
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
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    // 🎯 [OPERATION DUO - PHASE 2A] Partner approval pending status
    statusPartnerPending: {
      backgroundColor: theme === 'dark' ? '#4A3A2A' : '#FFF3E0',
    },
    statusPending: {
      backgroundColor: theme === 'dark' ? '#4A3A2A' : '#FFF3E0',
    },
    statusApproved: {
      backgroundColor: theme === 'dark' ? '#2C4A2C' : '#E8F5E9',
    },
    statusRejected: {
      backgroundColor: theme === 'dark' ? '#4A2C2C' : '#FFEBEE',
    },
    // 🎯 [KIM FIX] Looking for partner status (solo lobby)
    statusLookingForPartner: {
      backgroundColor: theme === 'dark' ? '#2A3A4A' : '#E3F2FD',
    },
    // 🎯 [KIM FIX] Closed status (another team approved)
    statusClosed: {
      backgroundColor: theme === 'dark' ? '#3A3A3A' : '#EEEEEE',
    },
    // 🎯 [KIM FIX] Recruiting status (host partner waiting for guest team)
    statusRecruiting: {
      backgroundColor: theme === 'dark' ? '#2A3A4A' : '#E3F2FD',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statusPartnerPendingText: {
      color: theme === 'dark' ? '#FFB74D' : '#FF9800',
    },
    statusPendingText: {
      color: theme === 'dark' ? '#FFB74D' : '#FF9800',
    },
    statusApprovedText: {
      color: theme === 'dark' ? '#81C784' : '#4caf50',
    },
    statusRejectedText: {
      color: theme === 'dark' ? '#EF5350' : '#f44336',
    },
    // 🎯 [KIM FIX] Looking for partner text - improved visibility with white/blue
    statusLookingForPartnerText: {
      color: theme === 'dark' ? '#90CAF9' : '#1976D2',
    },
    // 🎯 [KIM FIX] Closed text - gray for disabled look
    statusClosedText: {
      color: theme === 'dark' ? '#BDBDBD' : '#757575',
    },
    // 🎯 [KIM FIX] Recruiting text - blue to match looking for partner
    statusRecruitingText: {
      color: theme === 'dark' ? '#90CAF9' : '#1976D2',
    },
    statusCompleted: {
      backgroundColor: theme === 'dark' ? '#2C4A2C' : '#E8F5E9',
    },
    statusCompletedText: {
      color: theme === 'dark' ? '#81C784' : '#4caf50',
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
    cancelButton: {
      backgroundColor: theme === 'dark' ? '#4A2C2C' : '#ffebee',
    },
    cancelButtonText: {
      color: theme === 'dark' ? '#EF5350' : '#f44336',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // 🎯 [OPERATION DUO - PHASE 2A] Re-invite Partner Button Styles
    reinviteButton: {
      backgroundColor: theme === 'dark' ? '#1E3A5F' : '#E3F2FD',
    },
    reinviteButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#2196F3',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    disabledButton: {
      opacity: 0.5,
      backgroundColor: theme === 'dark' ? '#2C2C2C' : '#CCCCCC',
    },
    disabledButtonText: {
      color: '#999999',
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
    // 🎯 [KIM FIX] Partner Status Badge Styles
    partnerStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 6,
    },
    partnerStatusPending: {
      backgroundColor: '#FFA726', // Orange for pending
    },
    partnerStatusAccepted: {
      backgroundColor: '#66BB6A', // Green for accepted
    },
    partnerStatusRejected: {
      backgroundColor: '#EF5350', // Red for rejected
    },
    partnerStatusText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 4,
    },
    partnerStatusRow: {
      flexDirection: 'row',
      marginTop: 8,
    },
    // 🎯 [KIM FIX] Teams Section Styles - Green border design (matches EventCard)
    teamsSection: {
      marginTop: 12,
      marginBottom: 8,
      gap: 8,
    },
    teamCard: {
      borderWidth: 1,
      borderColor: '#4CAF50',
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
      padding: 12,
    },
    // 🎯 [KIM FIX] 내 팀 카드 스타일 (승인 대기 - 주황색 테두리)
    myTeamCard: {
      borderColor: '#FFA500',
      backgroundColor: theme === 'dark' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(255, 165, 0, 0.05)',
    },
    teamCardLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4CAF50',
      marginBottom: 8,
    },
    teamCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    // 🎯 [2026-01-12] Container for team name + LPR text (vertical layout)
    teamCardNameContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    teamCardName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#1F2937',
    },
    // 🎯 [KIM FIX] Team LPR text style
    teamLtrText: {
      fontSize: 12,
      fontWeight: '400',
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    // 🎯 [KIM FIX] Meetup participants list
    participantsList: {
      gap: 6,
    },
    // 🎯 [OPERATION SOLO] Solo Lobby Styles
    soloLobbySection: {
      marginTop: 12,
      marginBottom: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F5F5',
    },
    soloLobbyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    soloLobbyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
    },
    proposalReceivedContainer: {
      backgroundColor: theme === 'dark' ? '#4A3A2A' : '#FFF3E0',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    proposalReceivedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    proposalReceivedText: {
      fontSize: 14,
      color: theme === 'dark' ? '#FFB74D' : '#F57C00',
      fontWeight: '500',
      flex: 1,
    },
    proposalActions: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
    },
    proposalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      gap: 4,
    },
    acceptButton: {
      backgroundColor: '#4CAF50',
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    declineButton: {
      backgroundColor: '#EF5350',
    },
    declineButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    noApplicantsContainer: {
      padding: 16,
      alignItems: 'center',
    },
    noApplicantsText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    applicantsList: {
      gap: 8,
    },
    applicantsListHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
    },
    applicantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    applicantInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    applicantName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurface,
    },
    // 🎯 [KIM FIX] NTRP display styles
    applicantNtrpText: {
      fontSize: 12,
      fontWeight: '400',
      color: theme === 'dark' ? '#90CAF9' : '#1976D2',
    },
    teamNtrpText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme === 'dark' ? '#90CAF9' : '#1976D2',
    },
    proposeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: theme === 'dark' ? '#1E3A5F' : '#E3F2FD',
      gap: 4,
    },
    proposeButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#2196F3',
      fontSize: 12,
      fontWeight: '600',
    },
    // 🎯 [KIM FIX v3] LPR 범위 밖일 때 비활성화 스타일
    proposeButtonDisabled: {
      backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5',
      opacity: 0.7,
    },
    proposeButtonDisabledText: {
      color: '#999999',
      fontSize: 12,
      fontWeight: '600',
    },
    proposalSentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? '#4A3A2A' : '#FFF3E0',
      gap: 4,
    },
    proposalSentText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFB74D' : '#F57C00',
    },
    // 🎯 [KIM FIX] Closed message styles for solo lobby
    closedMessageContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(239, 83, 80, 0.15)' : '#FFEBEE',
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#EF5350',
    },
    closedMessageText: {
      fontSize: 14,
      color: theme === 'dark' ? '#EF9A9A' : '#C62828',
      lineHeight: 20,
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
    // 🎾 Pickleball wind condition label
    windCondition: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

export default AppliedEventCard;
