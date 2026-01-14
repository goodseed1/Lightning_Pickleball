/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Searchbar, Title, Paragraph, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useDiscovery } from '../hooks/useDiscovery';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useActivities } from '../contexts/ActivityContext';
import activityService from '../services/activityService';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { getDistanceUnit } from '../utils/unitUtils';
import {
  RootStackParamList,
  DiscoverStackParamList,
  MainTabParamList,
} from '../navigation/AppNavigator';
import PlayerCard from '../components/cards/PlayerCard';
import EventCard from '../components/cards/EventCard';
import ClubCard from '../components/cards/ClubCard';
import LessonCard from '../components/cards/LessonCard';
import ServiceCard from '../components/cards/ServiceCard';
import UserSearchModal from '../components/modals/UserSearchModal';
import LessonFormModal from '../components/coach/LessonFormModal';
import ServiceFormModal from '../components/service/ServiceFormModal';
import { NotificationBanner } from '../components/common/NotificationBanner';
// 🎯 [KIM FIX v3] 위치 필수 모달
import { LocationValueModal } from '../components/modals/LocationValueModal';
import { CoachLesson } from '../types/coachLesson';
import { PickleballService } from '../types/pickleballService';
import coachLessonService from '../services/coachLessonService';
import pickleballServiceService from '../services/pickleballServiceService';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { convertEloToLtr } from '../utils/eloUtils'; // 🎯 [LPR FIX v4] Real-time ELO → LPR conversion
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';

type DiscoverScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DiscoverScreenRouteProp = RouteProp<DiscoverStackParamList, 'DiscoverMain'>;

// 로컬 확장 타입 정의
interface ExtendedProfileWithSkillLevel {
  location: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
  } | null;
  gender?: 'male' | 'female';
  skillLevel?: number | { calculated?: number; selfAssessed?: string; confidence?: number };
}

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const route = useRoute<DiscoverScreenRouteProp>();
  const { currentLanguage, t } = useLanguage();
  const { currentUser, updateUserProfile } = useAuth();

  // Get user's country for distance unit formatting
  const userCountry = currentUser?.profile?.location?.country;
  const {
    getMyApplicationStatus,
    getMyPartnerStatus,
    myApplications,
    pendingHostedApplicationsCount,
  } = useActivities();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);

  // 🎯 [KIM UPDATE] 위치 권한 선택 - 위치 컨텍스트 및 모달 상태
  // isLocationEnabled: 권한 허용 여부 (true = 허용됨, false = 미허용)
  const { requestLocationPermission, isLocationEnabled } = useLocation();
  const [showLocationValueModal, setShowLocationValueModal] = React.useState(false);
  // 📍 [KIM FIX v5] 세션당 한 번만 모달 표시 - 중복 표시 방지
  const hasShownLocationModalThisSession = React.useRef(false);
  // 🎯 [KIM FIX v4] 탐색 화면 포커스될 때 권한 미허용이면 자동으로 LocationValueModal 표시
  useFocusEffect(
    React.useCallback(() => {
      // 📍 [KIM FIX v5] 세션당 한 번만 모달 표시
      // - 권한이 미허용일 때만
      // - 이 세션에서 아직 모달을 보여주지 않았을 때만
      if (!isLocationEnabled && !hasShownLocationModalThisSession.current) {
        hasShownLocationModalThisSession.current = true;
        setShowLocationValueModal(true);
      }
    }, [isLocationEnabled])
  );
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles = createStyles(themeColors.colors as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Track application submission to prevent duplicate clicks
  const [isApplying, setIsApplying] = React.useState(false);

  // 🎯 [KIM FIX] 스와이프로 탭 간 이동 - react-native-gesture-handler 사용
  const TAB_ORDER = ['events', 'players', 'clubs', 'coaches', 'services'] as const;
  const SWIPE_THRESHOLD = 50; // 스와이프 인식 거리 (픽셀) - 🎯 더 민감하게 조정

  // 🎯 [KIM FIX] Inline distance slider state
  const [showDistanceSlider, setShowDistanceSlider] = React.useState(false);
  const [localDistance, setLocalDistance] = React.useState(currentUser?.maxTravelDistance || 15);

  // Sync local distance when user data changes
  React.useEffect(() => {
    if (currentUser?.maxTravelDistance) {
      setLocalDistance(currentUser.maxTravelDistance);
    }
  }, [currentUser?.maxTravelDistance]);

  // 🎯 [KIM FIX] Save distance to user profile
  const handleSaveDistance = async (distance: number) => {
    try {
      await updateUserProfile({ maxTravelDistance: distance });
      setShowDistanceSlider(false);
      // Refresh data to apply new distance filter
      refreshData();
    } catch (error) {
      console.error('Error saving distance:', error);
      Alert.alert(t('discover.alerts.error'), t('discover.distance.saveFailed'));
    }
  };

  // 🎯 [OPERATION DUO - PHASE 2A] Partner selection modal state
  const [showPartnerModal, setShowPartnerModal] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<Record<string, unknown> | null>(null);
  // 🎯 [LPR FIX v4] Real-time host LPR for partner selection (current user's LPR, not event host)
  const [partnerModalHostLtr, setPartnerModalHostLtr] = React.useState<number | undefined>(
    undefined
  );
  // 🎯 [LPR FIX v6] Host team's combined LPR for display (e.g., 영철3 + 회장3 = 6)
  const [partnerModalHostTeamLtr, setPartnerModalHostTeamLtr] = React.useState<number | undefined>(
    undefined
  );

  // 🎯 Phase 4: Partner invitation count
  const [partnerInvitationCount, setPartnerInvitationCount] = React.useState(0);

  // 🎯 [COACH LESSONS] Lesson form modal state
  const [showLessonFormModal, setShowLessonFormModal] = React.useState(false);
  const [editingLesson, setEditingLesson] = React.useState<CoachLesson | undefined>(undefined);

  // 🛠️ [TENNIS SERVICES] Service form modal state
  const [showServiceFormModal, setShowServiceFormModal] = React.useState(false);
  const [editingService, setEditingService] = React.useState<PickleballService | undefined>(undefined);

  // ⚡ Quick Match: NTRP 추출 함수
  const getNumericNtrp = (skillLevel: unknown): number => {
    if (typeof skillLevel === 'number') return skillLevel;
    if (typeof skillLevel === 'object' && skillLevel !== null) {
      const sl = skillLevel as { selfAssessed?: string; calculated?: number };
      if (sl.selfAssessed) {
        return parseFloat(sl.selfAssessed.split('-')[0]);
      }
      if (sl.calculated) {
        return sl.calculated;
      }
    }
    return 5; // 기본값 (LPR 5 = Default)
  };

  // ⚡ Quick Match: 매치 신청 핸들러
  const handleQuickMatch = async (player: Record<string, unknown>) => {
    if (!currentUser?.uid) {
      Alert.alert(t('discover.alerts.loginRequired'), t('discover.alerts.loginRequiredQuickMatch'));
      return;
    }

    // 1. 성별 검증
    const hostGender = currentUser?.profile?.gender;
    const targetGender = (player.profile as { gender?: string })?.gender;

    if (hostGender !== targetGender) {
      Alert.alert(
        t('discover.alerts.quickMatch.cannotChallenge'),
        t('discover.alerts.quickMatch.sameGenderOnly')
      );
      return;
    }

    // 2. NTRP 검증
    const hostLtr =
      getNumericNtrp(currentUser?.skillLevel) ||
      getNumericNtrp((currentUser?.profile as ExtendedProfileWithSkillLevel)?.skillLevel);
    const targetNtrp = getNumericNtrp(player.skillLevel);

    if (targetNtrp > hostLtr + 1.0) {
      Alert.alert(
        t('discover.alerts.quickMatch.cannotChallenge'),
        t('discover.alerts.quickMatch.ntrpOutOfRange', { ntrp: targetNtrp })
      );
      return;
    }

    // 3. 확인 Alert
    Alert.alert(
      t('discover.alerts.quickMatch.title'),
      t('discover.alerts.quickMatch.challengeMessage', { name: player.name }),
      [
        { text: t('discover.alerts.quickMatch.cancel'), style: 'cancel' },
        {
          text: t('discover.alerts.quickMatch.challenge'),
          onPress: () => submitQuickMatch(player.id as string),
        },
      ]
    );
  };

  // ⚡ Quick Match: Cloud Function 호출
  const submitQuickMatch = async (targetUserId: string) => {
    try {
      const createQuickMatchFn = httpsCallable<
        { targetUserId: string },
        { success: boolean; isRankedMatch: boolean; cooldownWarning?: string }
      >(functions, 'createQuickMatch');
      const result = await createQuickMatchFn({ targetUserId });

      // 🆕 [3개월 규칙] 친선경기 여부에 따라 메시지 변경
      const { isRankedMatch } = result.data;

      const alertMessage = isRankedMatch
        ? t('discover.alerts.quickMatch.rankedMatch')
        : t('discover.alerts.quickMatch.friendlyMatch');

      Alert.alert(t('discover.alerts.quickMatch.success'), alertMessage);

      // 호스트한 모임으로 이동
      navigation.navigate('MainTabs', {
        screen: 'MyProfile' as keyof MainTabParamList,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Navigation params type mismatch between screens
        params: { initialTab: 'activity', initialActivityTab: 'hosted' } as any,
      });
    } catch (error: unknown) {
      console.error('Quick match error:', error);
      const errorMessage =
        error instanceof Error ? error.message : t('discover.alerts.quickMatch.error');
      Alert.alert(t('discover.alerts.error'), errorMessage);
    }
  };

  // 💥 All complex logic eliminated - using hooks only!
  const {
    filteredResults,
    isLoading,
    refreshing,
    filterType,
    searchQuery,
    skillFilter,
    distanceFilter,
    setFilterType,
    setSkillFilter,
    refreshData,
    searchData,
  } = useDiscovery();

  console.log(
    `📱 DISCOVER SCREEN RENDERED with isLoading: ${isLoading}, results: ${filteredResults.length}`
  );

  // 🎯 [KIM FIX] 탭 전환 핸들러 (JS 스레드에서 실행)
  const handleSwipeLeft = React.useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(filterType as (typeof TAB_ORDER)[number]);
    if (currentIndex < TAB_ORDER.length - 1) {
      setFilterType(TAB_ORDER[currentIndex + 1]);
    } else if (currentIndex === TAB_ORDER.length - 1) {
      // 마지막 탭(서비스)에서 왼쪽 스와이프 → MyClubs 탭으로 (Create 건너뛰기)
      // 🎯 [SWIPE] fromSwipe: true 전달하여 Smart Tab 리다이렉트 방지
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('MyClubs', {
        screen: 'MyClubsMain',
        params: { fromSwipe: true },
      });
    }
  }, [filterType, setFilterType, navigation]);

  const handleSwipeRight = React.useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(filterType as (typeof TAB_ORDER)[number]);
    if (currentIndex === 0) {
      // 첫 번째 탭(이벤트)에서 오른쪽 스와이프 → 피드 화면으로
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('Feed');
    } else if (currentIndex > 0) {
      setFilterType(TAB_ORDER[currentIndex - 1]);
    }
  }, [filterType, setFilterType, navigation]);

  // 🎯 [KIM FIX] Gesture Handler - 수평 스와이프 감지
  const panGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15]) // 🎯 수평으로 15px 이동 후 활성화 (더 민감하게)
        .failOffsetY([-30, 30]) // 🎯 수직으로 30px까지 허용 (스크롤과 충돌 방지)
        .onEnd(e => {
          'worklet';
          if (e.translationX > SWIPE_THRESHOLD) {
            // 오른쪽 스와이프 → 이전 탭 또는 피드 화면
            runOnJS(handleSwipeRight)();
          } else if (e.translationX < -SWIPE_THRESHOLD) {
            // 왼쪽 스와이프 → 다음 탭
            runOnJS(handleSwipeLeft)();
          }
        }),
    [handleSwipeLeft, handleSwipeRight]
  );

  // 🎯 [KIM FIX] ScrollView ref for scrolling to specific event
  const scrollViewRef = React.useRef<ScrollView>(null);
  // 🎯 [KIM FIX] Track event card positions for scrolling
  const eventPositionsRef = React.useRef<Map<string, number>>(new Map());

  // 🎯 [KIM FIX] Handle initial filter from navigation params
  // Use useFocusEffect to handle filter change when navigating to already-mounted tab
  useFocusEffect(
    React.useCallback(() => {
      const initialFilter = route.params?.initialFilter;
      if (initialFilter && initialFilter !== filterType) {
        console.log('🎯 Setting initial filter from route params:', initialFilter);
        setFilterType(initialFilter);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.initialFilter])
  );

  // 🎯 [KIM FIX] Handle scroll to specific event when navigating from partner invitation
  useFocusEffect(
    React.useCallback(() => {
      const scrollToEventId = route.params?.scrollToEventId;
      if (scrollToEventId && filterType === 'events') {
        console.log('🎯 [SCROLL] Attempting to scroll to event:', scrollToEventId);

        // Wait for layout to complete then scroll
        const scrollTimeout = setTimeout(() => {
          const eventPosition = eventPositionsRef.current.get(scrollToEventId);
          if (eventPosition !== undefined && scrollViewRef.current) {
            console.log('🎯 [SCROLL] Scrolling to position:', eventPosition);
            scrollViewRef.current.scrollTo({
              y: eventPosition,
              animated: true,
            });
          } else {
            console.log(
              '🎯 [SCROLL] Event position not found, events:',
              Array.from(eventPositionsRef.current.keys())
            );
          }
        }, 500); // Wait for render to complete

        return () => clearTimeout(scrollTimeout);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.scrollToEventId, filterType, filteredResults])
  );

  // 🎯 Phase 4: Fetch partner invitation count
  React.useEffect(() => {
    if (!currentUser?.uid) return;

    const invitationsRef = collection(db, 'partner_invitations');
    const q = query(
      invitationsRef,
      where('invitedUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      setPartnerInvitationCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Simplified event handlers
  const handleSearch = (query: string) => {
    searchData(query);
  };

  const onRefresh = async () => {
    await refreshData();
  };

  // Handle opening event chat
  const handleOpenChat = async (eventId: string, eventTitle: string) => {
    try {
      console.log('Opening chat for event:', eventId, eventTitle);

      // Check application status
      const applicationStatus = getMyApplicationStatus(eventId);

      // If application is still pending, show friendly message
      if (applicationStatus === 'pending') {
        Alert.alert(
          t('discover.alerts.chatAccessDenied'),
          t('discover.alerts.chatAccessDeniedMessage')
        );
        return;
      }

      // Only navigate if approved
      if (applicationStatus === 'approved') {
        navigation.navigate('EventChat', {
          eventId,
          eventTitle,
        });
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert(t('discover.alerts.error'), t('discover.alerts.chatError'));
    }
  };

  // 🎯 [OPERATION DUO - PHASE 2A] Handle partner selection from UserSearchModal
  const handlePartnerSelected = async (partners: Array<{ uid: string; displayName: string }>) => {
    if (partners.length === 0 || !selectedEventId || !currentUser?.uid) return;

    const partner = partners[0]; // Only one partner for doubles
    setIsApplying(true);

    try {
      console.log('🎯 [TEAM_APPLICATION] Submitting team application:', {
        eventId: selectedEventId,
        applicantId: currentUser.uid,
        partnerId: partner.uid,
        partnerName: partner.displayName,
      });

      // 🎯 [CRITICAL FIX] Use activityService.applyAsTeam (Cloud Function)
      // This ensures:
      // - Application is hidden from host until partner accepts (status: 'pending_partner_approval')
      // - Partner invitation is created with 24-hour expiry
      // - No duplicate applications (validation in Cloud Function)
      await activityService.applyAsTeam(
        selectedEventId,
        currentUser.uid,
        partner.uid,
        partner.displayName,
        currentUser.displayName || currentUser.email || '사용자'
      );

      Alert.alert(
        t('discover.alerts.teamApplication.submitted'),
        t('discover.alerts.teamApplication.submittedMessage', { name: partner.displayName })
      );

      // Reset state
      setSelectedEventId(null);
      setSelectedEvent(null);
      setShowPartnerModal(false);
      setPartnerModalHostLtr(undefined); // 🎯 [LPR FIX v4] Reset LPR state
      setPartnerModalHostTeamLtr(undefined); // 🎯 [LPR FIX v6] Reset team LPR state

      // 🎯 [KIM FIX] Navigate to MyProfile > Activity > Applied tab
      /* eslint-disable @typescript-eslint/no-explicit-any */
      navigation.navigate('MainTabs', {
        screen: 'MyProfile' as keyof MainTabParamList,
        params: {
          initialTab: 'activity',
          initialActivityTab: 'applied',
        } as any,
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (error) {
      console.error('❌ [TEAM_APPLICATION] Error submitting team application:', error);
      Alert.alert(
        t('discover.alerts.error'),
        t('discover.alerts.teamApplication.error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    } finally {
      setIsApplying(false);
    }
  };
  // 🎯 [OPERATION SOLO LOBBY] Handle solo application for doubles event
  const handleApplyAsSolo = async (event: Record<string, unknown>) => {
    if (!currentUser?.uid) {
      Alert.alert(t('discover.alerts.loginRequired'), t('discover.alerts.loginRequiredMessage'));
      return;
    }

    // Prevent duplicate submissions
    if (isApplying) {
      console.log('⏸️ Solo application already in progress, ignoring duplicate click');
      return;
    }

    setIsApplying(true);

    try {
      console.log('🎯 [SOLO LOBBY] Applying as solo to event:', event.id);

      const result = await activityService.applyAsSolo(
        event.id as string,
        currentUser.uid,
        currentUser.displayName || currentUser.email || undefined
      );

      console.log('✅ [SOLO LOBBY] Solo application successful:', result);

      // Show success message with notification count
      const message =
        result.notifiedCount > 0
          ? t('discover.alerts.soloApplication.messageWithNotification', {
              count: result.notifiedCount,
              plural: result.notifiedCount > 1 ? 's' : '',
            })
          : t('discover.alerts.soloApplication.message');

      Alert.alert(t('discover.alerts.soloApplication.title'), message);

      // 🎯 [KIM FIX] Navigate to MyProfile > Activity > Applied tab
      /* eslint-disable @typescript-eslint/no-explicit-any */
      navigation.navigate('MainTabs', {
        screen: 'MyProfile' as keyof MainTabParamList,
        params: {
          initialTab: 'activity',
          initialActivityTab: 'applied',
        } as any,
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (error) {
      console.error('❌ [SOLO LOBBY] Error applying as solo:', error);
      Alert.alert(
        t('discover.alerts.error'),
        t('discover.alerts.soloApplication.error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Handle event application
  const handleApplyToEvent = async (event: Record<string, unknown>, needsPartner = false) => {
    if (!currentUser?.uid) {
      Alert.alert(t('discover.alerts.loginRequired'), t('discover.alerts.loginRequiredMessage'));
      return;
    }

    // Prevent duplicate submissions
    if (isApplying) {
      console.log('⏸️ Application already in progress, ignoring duplicate click');
      return;
    }

    // 🎯 [OPERATION DUO - PHASE 2A] Handle doubles match - open partner selection modal
    if (needsPartner) {
      console.log('🎾 Doubles match detected, opening partner modal for event:', event.id);
      console.log('🔍 [DEBUG] Event data for partner exclusion:', {
        hostId: event.hostId,
        hostPartnerId: event.hostPartnerId,
        partnerStatus: event.partnerStatus,
        hostPartnerName: event.hostPartnerName,
      });

      // 🎯 [LPR FIX v4] Fetch CURRENT USER's real-time ELO for partner selection range
      // - 철수(지원자)가 파트너를 선택할 때, 철수의 LPR 기준으로 ±2 범위 적용
      // - event.hostLtrLevel은 이벤트 호스트의 값이므로 사용하면 안됨!
      const gameType = event.gameType as string | undefined;
      let currentUserLtr: number | undefined;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          let elo: number | undefined;

          // Get game-type-specific ELO
          const gt = gameType?.toLowerCase();
          if (gt === 'mixed_doubles' || gt?.includes('mixed')) {
            elo = userData?.eloRatings?.mixed?.current;
          } else if (gt?.includes('doubles')) {
            elo = userData?.eloRatings?.doubles?.current;
          } else {
            elo = userData?.eloRatings?.singles?.current;
          }

          if (elo !== undefined) {
            currentUserLtr = convertEloToLtr(elo);
            console.log('📊 [LPR FIX v4] Current user LPR from ELO:', {
              userId: currentUser.uid,
              gameType,
              elo,
              ltr: currentUserLtr,
            });
          }
        }
      } catch (error) {
        console.error('❌ [LPR FIX v4] Error fetching current user ELO:', error);
      }

      // Fallback to stored skillLevel if ELO lookup fails
      if (currentUserLtr === undefined) {
        currentUserLtr = getNumericNtrp(currentUser?.skillLevel);
        console.log('⚠️ [LPR FIX v4] Using stored skillLevel as fallback:', currentUserLtr);
      }

      // 🎯 [LPR FIX v6] Calculate host team's combined LPR for display
      // minLtr = maxLtr = average team LPR, so sum = minLtr + maxLtr = teamLtr
      const hostTeamLtr =
        event.minLtr && event.maxLtr
          ? (event.minLtr as number) + (event.maxLtr as number)
          : undefined;

      console.log('📊 [LPR FIX v6] Partner modal data:', {
        currentUserLtr,
        hostTeamLtr,
        eventMinLtr: event.minLtr,
        eventMaxLtr: event.maxLtr,
      });

      setSelectedEventId(event.id as string);
      setSelectedEvent(event); // Store event for clubId lookup
      setPartnerModalHostLtr(currentUserLtr); // 🎯 [LPR FIX v4] Set current user's LPR
      setPartnerModalHostTeamLtr(hostTeamLtr); // 🎯 [LPR FIX v6] Set host team's combined LPR
      setShowPartnerModal(true);
      return;
    }

    // Singles match - proceed with normal application
    setIsApplying(true);

    try {
      console.log('🎾 Applying to event:', event.id);
      const result = await activityService.applyToEvent(event.id as string, currentUser.uid);

      // 🎯 [KIM FIX] Show different message based on autoApproved status
      if (result.autoApproved) {
        Alert.alert(
          t('discover.alerts.autoApproved.title'),
          t('discover.alerts.autoApproved.message')
        );
      } else {
        Alert.alert(
          t('discover.alerts.teamApplication.submitted'),
          t('discover.alerts.singleApplicationSuccess')
        );
      }

      // 🎯 [KIM FIX] Navigate to MyProfile > Activity > Applied tab
      /* eslint-disable @typescript-eslint/no-explicit-any */
      navigation.navigate('MainTabs', {
        screen: 'MyProfile' as keyof MainTabParamList,
        params: {
          initialTab: 'activity',
          initialActivityTab: 'applied',
        } as any,
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (error) {
      console.error('❌ Error applying to event:', error);

      // 🎯 [KIM FIX] Handle specific error messages
      const errorMessage = (error as Error)?.message || '';

      if (errorMessage === 'EVENT_FULL') {
        Alert.alert(t('discover.alerts.cannotApply'), t('discover.alerts.eventFull'));
      } else {
        Alert.alert(t('discover.alerts.error'), t('discover.alerts.applicationError'));
      }
    } finally {
      setIsApplying(false);
    }
  };

  // 🛡️ Captain America: Handle application cancellation
  const handleCancelApplication = async (event: Record<string, unknown>) => {
    if (!currentUser?.uid) return;

    try {
      console.log('DiscoverScreen: Canceling application for event:', event.id);

      // Find the application
      const application = myApplications.find(app => app.eventId === event.id);
      if (!application) {
        console.warn('No application found to cancel');
        return;
      }

      // Call cancel function
      await activityService.cancelApplication(application.id);

      Alert.alert(t('discover.alerts.canceled'), t('discover.alerts.cancelSuccess'));
    } catch (error) {
      console.error('Error canceling application:', error);
      Alert.alert(t('discover.alerts.error'), t('discover.alerts.cancelFailed'));
    }
  };

  // 🎯 [KIM FIX] Get current user's NTRP and gender for quick match eligibility
  const currentUserNtrp =
    getNumericNtrp(currentUser?.skillLevel) ||
    getNumericNtrp((currentUser?.profile as ExtendedProfileWithSkillLevel)?.skillLevel);
  const currentUserGender = currentUser?.profile?.gender || currentUser?.gender;

  // Render functions for different item types
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renderPlayerCard = (player: Record<string, unknown>) => (
    <PlayerCard
      key={player.id as string}
      player={player as any}
      currentUserNtrp={currentUserNtrp}
      currentUserGender={currentUserGender}
      // 🎯 [KIM FIX] Disable quick match button for current user's own card
      isCurrentUser={player.id === currentUser?.uid}
      onPress={() => navigation.navigate('UserProfile', { userId: player.id as string })}
      onQuickMatch={() => handleQuickMatch(player)}
    />
  );

  const renderClubCard = (club: Record<string, unknown>) => (
    <ClubCard
      key={club.id as string}
      club={club as any}
      onPress={() => {
        // @ts-expect-error - Navigation type mismatch for ClubDetail route
        navigation.navigate('ClubDetail', { clubId: club.id as string });
      }}
    />
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // 🎯 [COACH LESSONS] Lesson card handlers
  const handleEditLesson = (lesson: CoachLesson) => {
    setEditingLesson(lesson);
    setShowLessonFormModal(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await coachLessonService.deleteLesson(lessonId);
      Alert.alert(t('discover.alerts.deleted'), t('discover.alerts.lessonDeleted'));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      Alert.alert(t('discover.alerts.error'), t('discover.alerts.deleteFailed'));
    }
  };

  const handleLessonFormSuccess = () => {
    setEditingLesson(undefined);
    Alert.alert(
      t('discover.alerts.success'),
      editingLesson ? t('discover.alerts.lessonUpdated') : t('discover.alerts.lessonCreated')
    );
  };

  const renderLessonCard = (lesson: CoachLesson) => (
    <LessonCard
      key={lesson.id}
      lesson={lesson}
      onEdit={handleEditLesson}
      onDelete={handleDeleteLesson}
    />
  );

  // 🛠️ [TENNIS SERVICES] Service card handlers
  const handleEditService = (service: PickleballService) => {
    setEditingService(service);
    setShowServiceFormModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await pickleballServiceService.deleteService(serviceId);
      Alert.alert(t('discover.alerts.deleted'), t('discover.alerts.serviceDeleted'));
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert(t('discover.alerts.error'), t('discover.alerts.deleteFailed'));
    }
  };

  const handleServiceFormSuccess = () => {
    setEditingService(undefined);
    Alert.alert(
      t('discover.alerts.success'),
      editingService ? t('discover.alerts.serviceUpdated') : t('discover.alerts.serviceCreated')
    );
  };

  const renderServiceCard = (service: PickleballService) => (
    <ServiceCard
      key={service.id}
      service={service}
      onEdit={handleEditService}
      onDelete={handleDeleteService}
    />
  );

  const renderEventCard = (event: Record<string, unknown>) => {
    const myStatus = getMyApplicationStatus(event.id as string);
    // 🎯 [KIM FIX] Get partner status for team applications
    const myPartnerStatus = getMyPartnerStatus(event.id as string);

    // 🔍 [DEBUG v2] Enhanced logging for jong partner debugging
    console.log('🔍 [DiscoverScreen] renderEventCard:', {
      eventId: event.id,
      eventTitle: event.title,
      myStatus,
      myPartnerStatus,
      currentUserId: currentUser?.uid,
      myApplicationsCount: myApplications.length,
      relevantApps: myApplications
        .filter(app => app.eventId === event.id)
        .map(app => ({
          id: app.id,
          status: app.status,
          applicantId: app.applicantId,
          partnerId: app.partnerId,
          isMyApp: app.applicantId === currentUser?.uid,
          amPartner: app.partnerId === currentUser?.uid,
        })),
    });

    return (
      /* eslint-disable @typescript-eslint/no-explicit-any */
      <EventCard
        key={event.id as string}
        event={{
          ...(event as any),
          // 🎯 [KIM FIX] Include partner status from application data
          partnerStatus: myPartnerStatus,
        }}
        applicationStatus={myStatus as any}
        /* eslint-enable @typescript-eslint/no-explicit-any */
        onPress={() => {
          // 🎯 [KIM FIX v2] 카드 클릭 시 본인 경기만 이동
          const isHost = event.hostId === currentUser?.uid;
          // 🎯 [KIM FIX v2] 실제 신청한 상태값만 체크 (undefined나 'not_applied'는 제외)
          const appliedStatuses = ['pending', 'approved', 'rejected', 'declined', 'confirmed'];
          const isApplicant = myStatus && appliedStatuses.includes(myStatus);

          console.log('🔍 [DiscoverScreen] Card pressed:', {
            eventId: event.id,
            isHost,
            myStatus,
            isApplicant,
          });

          if (isHost) {
            // 호스트 → "호스트한 모임" 탭으로 이동
            console.log('DiscoverScreen: Host card clicked - navigating to hosted events');
            /* eslint-disable @typescript-eslint/no-explicit-any */
            navigation.navigate('MainTabs', {
              screen: 'MyProfile' as keyof MainTabParamList,
              params: {
                initialTab: 'activity',
                initialActivityTab: 'hosted',
              } as any,
            });
            /* eslint-enable @typescript-eslint/no-explicit-any */
          } else if (isApplicant) {
            // 신청자 → "참여 신청한 모임" 탭으로 이동
            console.log('DiscoverScreen: Applicant card clicked - navigating to applied events');
            /* eslint-disable @typescript-eslint/no-explicit-any */
            navigation.navigate('MainTabs', {
              screen: 'MyProfile' as keyof MainTabParamList,
              params: {
                initialTab: 'activity',
                initialActivityTab: 'applied',
              } as any,
            });
            /* eslint-enable @typescript-eslint/no-explicit-any */
          } else {
            // 본인 경기 아님 → 아무 동작 없음 (카드 클릭 무시)
            console.log('DiscoverScreen: Not my event - no navigation');
          }
        }}
        onApply={(needsPartner: boolean) => handleApplyToEvent(event, needsPartner)}
        onApplySolo={() => handleApplyAsSolo(event)}
        onCancelApplication={() => handleCancelApplication(event)}
        onChat={() => handleOpenChat(event.id as string, event.title as string)}
        onPlayerPress={(playerId: string) => {
          console.log('Player pressed:', playerId);
          navigation.navigate('UserProfile', { userId: playerId });
        }}
      />
    );
  };

  const renderFilteredResults = () => {
    if (filteredResults.length === 0) {
      // 🎯 [KIM FIX v2] Tab-specific encouraging messages instead of location hints
      const getEmptyIcon = () => {
        switch (filterType) {
          case 'players':
            return 'people';
          case 'clubs':
            return 'business';
          case 'coaches':
            return 'school';
          case 'services':
            return 'construct';
          default:
            return 'flash';
        }
      };

      // Get the key for the current filter type (remove trailing 's' for singular form)
      const filterKey = filterType.replace(/s$/, '');
      const capitalizedKey = filterKey.charAt(0).toUpperCase() + filterKey.slice(1);

      return (
        <View style={styles.emptyContainer}>
          <Ionicons name={getEmptyIcon()} size={64} color={themeColors.colors.onSurface} />
          <Title style={styles.emptyTitle}>{t(`discover.emptyState.no${capitalizedKey}s`)}</Title>
          {/* 🎯 [KIM FIX v2] Encouraging messages based on filter type */}
          <Paragraph style={styles.emptyText}>
            {t(`discover.emptyState.encouragement.${filterType}`)}
          </Paragraph>
          <Paragraph style={styles.emptyTextSuggestion}>
            {t(`discover.emptyState.encouragement.${filterType}Subtext`)}
          </Paragraph>
        </View>
      );
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return filteredResults.map((item: any) => {
      if (filterType === 'players') return renderPlayerCard(item as Record<string, unknown>);
      if (filterType === 'clubs') return renderClubCard(item as Record<string, unknown>);
      if (filterType === 'events') {
        // 🎯 [KIM FIX] Wrap event card to track position for scrolling
        const eventId = item.id as string;
        return (
          <View
            key={`event-wrapper-${eventId}`}
            onLayout={e => {
              const { y } = e.nativeEvent.layout;
              eventPositionsRef.current.set(eventId, y);
            }}
          >
            {renderEventCard(item as Record<string, unknown>)}
          </View>
        );
      }
      if (filterType === 'coaches') return renderLessonCard(item as CoachLesson);
      if (filterType === 'services') return renderServiceCard(item as PickleballService);
      return null;
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Searchbar
              placeholder={t(`discover.search.${filterType}`)}
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchBar}
            />

            <View style={styles.filterContainer}>
              <View style={styles.tabsContainer}>
                <View style={styles.tabsContent}>
                  <TouchableOpacity
                    style={[styles.tab, filterType === 'events' && styles.activeTab]}
                    onPress={() => setFilterType('events')}
                  >
                    <Ionicons
                      name='flash-outline'
                      size={18}
                      color={
                        filterType === 'events'
                          ? themeColors.colors.primary
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    <Paragraph
                      style={[styles.tabText, filterType === 'events' && styles.activeTabText]}
                    >
                      {t('discover.tabs.events')}
                    </Paragraph>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, filterType === 'players' && styles.activeTab]}
                    onPress={() => setFilterType('players')}
                  >
                    <Ionicons
                      name='people-outline'
                      size={18}
                      color={
                        filterType === 'players'
                          ? themeColors.colors.primary
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    <Paragraph
                      style={[styles.tabText, filterType === 'players' && styles.activeTabText]}
                    >
                      {t('discover.tabs.players')}
                    </Paragraph>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, filterType === 'clubs' && styles.activeTab]}
                    onPress={() => setFilterType('clubs')}
                  >
                    <Ionicons
                      name='grid-outline'
                      size={18}
                      color={
                        filterType === 'clubs'
                          ? themeColors.colors.primary
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    <Paragraph
                      style={[styles.tabText, filterType === 'clubs' && styles.activeTabText]}
                    >
                      {t('discover.tabs.clubs')}
                    </Paragraph>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, filterType === 'coaches' && styles.activeTab]}
                    onPress={() => setFilterType('coaches')}
                  >
                    <Ionicons
                      name='school-outline'
                      size={18}
                      color={
                        filterType === 'coaches'
                          ? themeColors.colors.primary
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    <Paragraph
                      style={[styles.tabText, filterType === 'coaches' && styles.activeTabText]}
                    >
                      {t('discover.tabs.coaches')}
                    </Paragraph>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, filterType === 'services' && styles.activeTab]}
                    onPress={() => setFilterType('services')}
                  >
                    <Ionicons
                      name='construct-outline'
                      size={18}
                      color={
                        filterType === 'services'
                          ? themeColors.colors.primary
                          : themeColors.colors.onSurfaceVariant
                      }
                    />
                    <Paragraph
                      style={[styles.tabText, filterType === 'services' && styles.activeTabText]}
                    >
                      {t('discover.tabs.services')}
                    </Paragraph>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 플레이어 탭: 스킬 필터 칩 */}
              {filterType === 'players' && (
                <View style={styles.filterRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.skillFilters}
                    contentContainerStyle={styles.skillFiltersContent}
                  >
                    {['all', 'beginner', 'intermediate', 'advanced', 'expert'].map(skill => (
                      <Chip
                        key={skill}
                        selected={skillFilter === skill}
                        onPress={() =>
                          setSkillFilter(
                            skill as 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
                          )
                        }
                        style={styles.filterChip}
                        mode={skillFilter === skill ? 'flat' : 'outlined'}
                      >
                        {t(`discover.skillFilters.${skill}`)}
                      </Chip>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 거리 필터 UI - 모든 탭에서 표시 */}
              <View style={styles.distanceFilterSection}>
                <View style={styles.distanceInfoRow}>
                  <Text style={styles.distanceInfoText}>
                    {currentLanguage === 'ko'
                      ? `${currentUser?.maxTravelDistance || distanceFilter} ${getDistanceUnit(t, userCountry)} ${t(`discover.distance.${filterType}Within`)}`
                      : `${t(`discover.distance.${filterType}Within`)} ${currentUser?.maxTravelDistance || distanceFilter} ${getDistanceUnit(t, userCountry)}`}
                  </Text>
                  <TouchableOpacity
                    style={styles.distanceChangeButton}
                    onPress={() => {
                      if (showDistanceSlider) {
                        handleSaveDistance(localDistance);
                      } else {
                        setShowDistanceSlider(true);
                      }
                    }}
                  >
                    <Text style={styles.distanceChangeButtonText}>
                      {showDistanceSlider
                        ? t('discover.distance.applyButton')
                        : t('discover.distance.changeButton')}
                    </Text>
                    <Ionicons
                      name={showDistanceSlider ? 'checkmark' : 'chevron-down'}
                      size={16}
                      color={themeColors.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {showDistanceSlider && (
                  <View style={styles.distanceSliderContainer}>
                    <View style={styles.distanceSliderRow}>
                      <TouchableOpacity
                        style={styles.distanceButton}
                        onPress={() => setLocalDistance(prev => Math.max(1, prev - 5))}
                      >
                        <Ionicons name='remove' size={20} color={themeColors.colors.primary} />
                      </TouchableOpacity>

                      <View style={styles.distanceValueContainer}>
                        <Text style={styles.distanceValue}>{localDistance}</Text>
                        <Text style={styles.distanceUnit}>{getDistanceUnit(t, userCountry)}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.distanceButton}
                        onPress={() => setLocalDistance(prev => Math.min(100, prev + 5))}
                      >
                        <Ionicons name='add' size={20} color={themeColors.colors.primary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.distancePresets}>
                      {[5, 10, 15, 25, 50].map(preset => (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.distancePresetChip,
                            localDistance === preset && styles.distancePresetChipActive,
                          ]}
                          onPress={() => setLocalDistance(preset)}
                        >
                          <Text
                            style={[
                              styles.distancePresetText,
                              localDistance === preset && styles.distancePresetTextActive,
                            ]}
                          >
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 🎯 Phase 4: Partner Invitation Banner */}
          {partnerInvitationCount > 0 && (
            <TouchableOpacity
              style={styles.invitationBanner}
              onPress={() => {
                // 🎯 [KIM FIX] Navigate to MyProfile > Activity > Applied tab
                /* eslint-disable @typescript-eslint/no-explicit-any */
                navigation.navigate('MainTabs', {
                  screen: 'MyProfile' as keyof MainTabParamList,
                  params: {
                    initialTab: 'activity',
                    initialActivityTab: 'applied',
                  } as any,
                });
                /* eslint-enable @typescript-eslint/no-explicit-any */
              }}
            >
              <Ionicons name='mail' size={20} color='#FF9800' />
              <Text style={styles.invitationBannerText}>
                {partnerInvitationCount === 1
                  ? t('discover.partnerInvitation.bannerSingle')
                  : t('discover.partnerInvitation.banner', { count: partnerInvitationCount })}
              </Text>
              <Ionicons name='chevron-forward' size={20} color='#FF9800' />
            </TouchableOpacity>
          )}

          {/* 🎯 [KIM FIX] Pending Applications Notification Banner for Hosts */}
          {pendingHostedApplicationsCount > 0 && (
            <NotificationBanner
              message={
                pendingHostedApplicationsCount === 1
                  ? t('discover.pendingApplications.bannerSingle')
                  : t('discover.pendingApplications.banner', {
                      count: pendingHostedApplicationsCount,
                    })
              }
              destination={{
                screen: 'MyProfile',
                params: {
                  initialTab: 'activity',
                  initialActivityTab: 'hosted',
                },
              }}
              icon='person-add'
              variant='warning'
            />
          )}

          {/* 🎯 [KIM FIX v4] 권한 미허용이면 위치 필요 안내 표시 (GPS 실패와 구분) */}
          {!isLocationEnabled ? (
            <View style={styles.locationRequiredContainer}>
              <View style={styles.locationRequiredCard}>
                <Ionicons
                  name='location-outline'
                  size={64}
                  color={themeColors.colors.primary}
                  style={styles.locationRequiredIcon}
                />
                <Title
                  style={[styles.locationRequiredTitle, { color: themeColors.colors.onSurface }]}
                >
                  {t('discover.locationRequired.title')}
                </Title>
                <Paragraph
                  style={[
                    styles.locationRequiredDescription,
                    { color: themeColors.colors.onSurfaceVariant },
                  ]}
                >
                  {t('discover.locationRequired.description')}
                </Paragraph>
                <TouchableOpacity
                  style={[
                    styles.locationRequiredButton,
                    { backgroundColor: themeColors.colors.primary },
                  ]}
                  onPress={() => setShowLocationValueModal(true)}
                >
                  <Ionicons
                    name='settings-outline'
                    size={20}
                    color={themeColors.colors.onPrimary}
                  />
                  <Text
                    style={[
                      styles.locationRequiredButtonText,
                      { color: themeColors.colors.onPrimary },
                    ]}
                  >
                    {t('discover.locationRequired.setupButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size='large' color={themeColors.colors.primary} />
                </View>
              ) : (
                renderFilteredResults()
              )}
            </ScrollView>
          )}

          {/* 🎯 [COACH LESSONS] Floating Action Button for creating lessons */}
          {filterType === 'coaches' && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: themeColors.colors.primary }]}
              onPress={() => {
                setEditingLesson(undefined);
                setShowLessonFormModal(true);
              }}
            >
              <Ionicons name='add' size={28} color={themeColors.colors.onPrimary} />
            </TouchableOpacity>
          )}

          {/* 🛠️ [TENNIS SERVICES] Floating Action Button for creating services */}
          {filterType === 'services' && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: themeColors.colors.primary }]}
              onPress={() => {
                setEditingService(undefined);
                setShowServiceFormModal(true);
              }}
            >
              <Ionicons name='add' size={28} color={themeColors.colors.onPrimary} />
            </TouchableOpacity>
          )}

          {/* 🎯 [COACH LESSONS] Lesson Form Modal */}
          <LessonFormModal
            visible={showLessonFormModal}
            onClose={() => {
              setShowLessonFormModal(false);
              setEditingLesson(undefined);
            }}
            onSuccess={handleLessonFormSuccess}
            editLesson={editingLesson}
          />

          {/* 🛠️ [TENNIS SERVICES] Service Form Modal */}
          <ServiceFormModal
            visible={showServiceFormModal}
            onClose={() => {
              setShowServiceFormModal(false);
              setEditingService(undefined);
            }}
            onSuccess={handleServiceFormSuccess}
            editService={editingService}
          />

          {/* 🎯 [OPERATION DUO - PHASE 2A] UserSearchModal for partner selection */}
          <UserSearchModal
            visible={showPartnerModal}
            onClose={() => {
              setShowPartnerModal(false);
              setSelectedEventId(null);
              setSelectedEvent(null);
              setPartnerModalHostLtr(undefined); // 🎯 [LPR FIX v4] Reset LPR state
              setPartnerModalHostTeamLtr(undefined); // 🎯 [LPR FIX v6] Reset team LPR state
            }}
            onUserSelect={handlePartnerSelected}
            excludeUserIds={
              currentUser?.uid
                ? [
                    currentUser.uid,
                    ...(selectedEvent?.hostId ? [selectedEvent.hostId as string] : []),
                    // 🔥 [KIM FIX] Exclude accepted partner (partnerStatus === 'accepted' OR hostPartnerId exists for legacy events)
                    ...(selectedEvent?.hostPartnerId &&
                    (selectedEvent?.partnerStatus === 'accepted' ||
                      selectedEvent?.partnerStatus === undefined)
                      ? [selectedEvent.hostPartnerId as string]
                      : []),
                  ]
                : []
            }
            clubId={(selectedEvent?.clubId as string) || ''} // Use clubId for club events, empty for public
            genderFilter={
              // 🎯 [KIM FIX v30] Check 'womens' FIRST because 'womens' contains 'mens' substring
              selectedEvent?.gameType
                ? (selectedEvent.gameType as string).toLowerCase().startsWith('womens')
                  ? 'female'
                  : (selectedEvent.gameType as string).toLowerCase().startsWith('mens')
                    ? 'male'
                    : null
                : null
            }
            // 🎯 [KIM FIX] Pass game type and host NTRP for partner selection
            gameType={selectedEvent?.gameType as string | undefined}
            // 🎯 [LPR FIX v4] Use current user's real-time LPR, not event host's stored value
            hostLtr={partnerModalHostLtr}
            // 🎯 [LPR FIX v6] Pass host team's combined LPR for display
            hostTeamLtr={partnerModalHostTeamLtr}
            // 🎯 [PARTNER FIX] Enable single-select mode for team application partner
            isPartnerSelection={true}
          />

          {/* 🎯 [KIM UPDATE] 위치 권한 가치 설명 모달 */}
          <LocationValueModal
            visible={showLocationValueModal}
            onRequestPermission={async () => {
              setShowLocationValueModal(false);
              const granted = await requestLocationPermission();
              if (granted) {
                // 위치 권한 허용됨 - 데이터 새로고침
                refreshData();
              }
            }}
            onSkip={() => setShowLocationValueModal(false)}
          />
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    searchBar: {
      marginTop: 8,
      marginBottom: 16,
    },
    filterContainer: {
      gap: 8,
    },
    tabsContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    tabsContent: {
      flexDirection: 'row',
      paddingHorizontal: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: colors.primaryContainer,
    },
    tabText: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    activeTabText: {
      color: colors.primary,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    skillFilters: {
      flex: 1,
    },
    skillFiltersContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
    },
    filterChip: {
      marginRight: 4,
    },
    distanceFilterButton: {
      paddingHorizontal: 8,
    },
    // 🎯 [KIM FIX] Inline distance slider styles
    distanceFilterSection: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 0,
    },
    distanceInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    distanceInfoText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    distanceChangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: colors.primaryContainer,
    },
    distanceChangeButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary,
      marginRight: 4,
    },
    distanceSliderContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
    },
    distanceSliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    distanceButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    distanceValueContainer: {
      alignItems: 'center',
      marginHorizontal: 24,
    },
    distanceValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
    },
    distanceUnit: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    distancePresets: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 12,
    },
    distancePresetChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    distancePresetChipActive: {
      backgroundColor: colors.primaryContainer,
      borderColor: colors.primary,
    },
    distancePresetText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    distancePresetTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    // 🎯 [KIM FIX v3] 위치 필요 안내 스타일
    locationRequiredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    locationRequiredCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      maxWidth: 360,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    locationRequiredIcon: {
      marginBottom: 16,
    },
    locationRequiredTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },
    locationRequiredDescription: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    locationRequiredButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
      gap: 8,
    },
    locationRequiredButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyTitle: {
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
      color: colors.onSurface,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.onSurface,
      opacity: 0.7,
      paddingHorizontal: 32,
      marginBottom: 8,
    },
    // 🎯 [KIM FIX] Additional empty state text styles
    emptyTextPath: {
      textAlign: 'center',
      color: colors.primary,
      opacity: 0.9,
      paddingHorizontal: 32,
      fontSize: 13,
      marginBottom: 12,
    },
    emptyTextSuggestion: {
      textAlign: 'center',
      color: colors.onSurface,
      opacity: 0.6,
      paddingHorizontal: 32,
      fontSize: 13,
      fontStyle: 'italic',
    },
    // 🎯 [KIM FIX] Partner invitation banner styles
    invitationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#FF9800',
      gap: 12,
    },
    invitationBannerText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: colors.onSurface,
    },
    // 🎯 [COACH LESSONS] FAB styles - positioned above AI chat button
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 180,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });
