import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput as RNTextInput,
  ImageBackground,
  Animated,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Text as PaperText,
  Button,
  Avatar,
  Surface,
  Snackbar,
  TextInput,
  Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TabView } from 'react-native-tab-view';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';

import { useAuth } from '../../contexts/AuthContext';
import { useClub } from '../../contexts/ClubContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTheme as useLTTheme } from '../../hooks/useTheme';
import { useMeetupChatUnreadCount } from '../../hooks/clubs/useMeetupChatUnreadCount';
import { getLightningTennisTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import clubService from '../../services/clubService';
import { Club, ClubMemberRole } from '../../types/club';

// Extended Club interface to handle dynamic data structures
interface ExtendedClub extends Club {
  statistics?: {
    totalMembers?: number;
    activeMembers?: number;
    totalEvents?: number;
    monthlyEvents?: number;
  };
  profile?: Club['profile'] & {
    courtAddress?: {
      address?: string;
      city?: string;
      state?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
      zipCode?: string;
      region?: string;
    };
  };
}

// Import new tab components
import ClubOverviewScreen from './tabs/ClubOverviewScreen';
import ClubMembersScreen from './tabs/ClubMembersScreen';
import ClubRegularMeetupsScreen from './tabs/ClubRegularMeetupsScreen';
import ClubLeaguesTournamentsScreen from './tabs/ClubLeaguesTournamentsScreen';
// ClubBoardScreen removed - Board feature now in Club Chat Room
import ClubPoliciesScreen from './tabs/ClubPoliciesScreen';
import ClubAdminScreen from './tabs/ClubAdminScreen';
import ClubSettingsScreen from './tabs/ClubSettingsScreen';
import ClubHallOfFameScreen from './tabs/ClubHallOfFameScreen';

// Import default images
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultClubImage = require('../../../assets/images/lightning-tennis-icon.png');

// Import custom tab bar component for Operation Voyager
import { ScrollableTabBar } from '../../components/clubs/ScrollableTabBar';

// Define ClubDetail params locally
interface ClubDetailParams {
  clubId: string;
  userRole?: string;
  initialTab?: string;
  initialSubTab?: string;
}

// Type-safe route and navigation props
type ClubDetailScreenRouteProp = RouteProp<{ ClubDetail: ClubDetailParams }, 'ClubDetail'>;
type ClubDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList & { ClubDetail: ClubDetailParams }
>;

export default function ClubDetailScreen() {
  const navigation = useNavigation<ClubDetailScreenNavigationProp>();
  const route = useRoute<ClubDetailScreenRouteProp>();

  // 💥 CCTV #2: 어떤 서류를 받았는가? 💥
  console.log('--- 📥 RECEIVED PARAMS in ClubDetailScreen ---', {
    allParams: route.params,
    clubId: route.params?.clubId,
    userRole: route.params?.userRole,
    initialTab: route.params?.initialTab,
  });

  const { clubId, initialTab, initialSubTab } = route.params;
  const { user, currentUser } = useAuth();
  const { setCurrentClubId } = useClub();

  // 💥 DEBUG: Check auth state
  console.log('🔍 [ClubDetailScreen] Auth state:', {
    user: !!user,
    currentUser: !!currentUser,
    userId: user?.uid || currentUser?.uid || 'none',
  });
  const { t } = useLanguage();
  const { t: translate } = useTranslation();
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles = createStyles(themeColors.colors as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Core state - only what the container needs
  const [clubDetail, setClubDetail] = useState<ExtendedClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [internalIndex, setInternalIndex] = useState(() => {
    // Set initial tab index immediately based on initialTab parameter
    console.log(`🎯 [ClubDetailScreen] Initializing tab index for initialTab: ${initialTab}`);
    if (initialTab === 'leagues') {
      console.log(`🎯 [ClubDetailScreen] Setting leagues tab (index 3) as initial`);
      return 3; // leagues is always at index 3 in baseRoutes
    }
    return 0; // default to first tab
  });
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'member' | null>(null);
  const [_isLoadingRole, setIsLoadingRole] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [membershipStatus, setMembershipStatus] = useState<
    'none' | 'member' | 'pending' | 'declined'
  >('none');

  // 🦾 IRON MAN: Club Team Invitation Badge State
  const [teamInvitationCount, setTeamInvitationCount] = useState(0);

  // 💬 Club Chat Unread Count State
  const [unreadCount, setUnreadCount] = useState(0);

  // 🎯 [KIM FIX] Join Request Count for Badge on Members Tab
  const [joinRequestCount, setJoinRequestCount] = useState(0);

  // 🔔 [IRON MAN] Club Notification Count for Badge on Overview (Home) Tab
  const [clubNotificationCount, setClubNotificationCount] = useState(0);

  // 🔴 [KIM FIX] Meetup chat unread count for red badge on Overview (Home) Tab
  const authUser = user || currentUser;
  const { clubUnreadCounts: meetupChatUnreadCounts } = useMeetupChatUnreadCount(authUser?.uid);

  // 🎯 [KIM FIX] Leagues/Tournaments sub-tab state for switching from Overview
  const [leaguesSubTab, setLeaguesSubTab] = useState<'leagues' | 'tournaments'>(
    (initialSubTab as 'leagues' | 'tournaments') || 'leagues'
  );
  // 🎯 [KIM FIX] Counter to force tab switch even when same tab is clicked multiple times
  const [leaguesTabSwitchCount, setLeaguesTabSwitchCount] = useState(0);

  // Actual member count from clubMembers collection
  const [actualMemberCount, setActualMemberCount] = useState<number | null>(null);

  // Join application modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const textInputRef = useRef<RNTextInput>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Snackbar feedback states
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarAction] = useState<{ label: string; onPress: () => void } | undefined>();

  // 🦾 IRON MAN: Pulse animation for pending join button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Dynamic routes based on user role and club visibility
  const routes = useMemo(() => {
    const isMember = userRole !== null;
    const visibility = clubDetail?.settings?.visibility || 'public';

    // Start with core routes that are always visible
    const dynamicRoutes: Array<{ key: string; title: string }> = [
      { key: 'overview', title: t('clubDetail.tabs.home') },
    ];

    // Admin tab: only for admin/manager (with icon - color applied via tabColors)
    if (userRole === 'admin' || userRole === 'manager') {
      dynamicRoutes.push({ key: 'admin', title: t('clubDetail.tabs.admin') });
    }

    // Members tab: visible if member OR visibility === 'public'
    if (isMember || visibility === 'public') {
      dynamicRoutes.push({ key: 'members', title: t('clubDetail.tabs.members') });
    }

    // Activities tab: always visible (all visibility settings)
    dynamicRoutes.push({ key: 'activities', title: t('clubDetail.tabs.activities') });

    // Leagues/Tournament tab: members only (regardless of visibility)
    if (isMember) {
      dynamicRoutes.push({ key: 'leagues', title: t('clubDetail.tabs.leagues') });
    }

    // Policy tab: always visible
    dynamicRoutes.push({ key: 'policy', title: t('clubDetail.tabs.policy') });

    // 🏆 Hall of Fame tab: members only (마지막 탭)
    if (isMember) {
      dynamicRoutes.push({ key: 'hallOfFame', title: t('clubDetail.tabs.hallOfFame') });
    }

    // Board tab removed - now in Club Chat Room

    return dynamicRoutes;
  }, [userRole, clubDetail?.settings?.visibility, t]);

  const index = internalIndex;

  // 🏗️ Force Bottom Tab Navigator to be visible
  // WORKAROUND: getParent() returns undefined, so we DON'T hide tab bar in first place
  // Instead, ensure Root Stack doesn't override tab bar settings
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 [ClubDetail] useFocusEffect - Screen focused');
      // Tab bar should be visible by default from MainTabs screenOptions
      // We just need to make sure ClubDetail doesn't hide it

      // Log for debugging
      const navState = navigation.getState();
      console.log('🔍 [ClubDetail] Navigation state:', JSON.stringify(navState, null, 2));

      // Cleanup
      return () => {
        console.log('🔍 [ClubDetail] Screen unfocused');
      };
    }, [navigation])
  );

  // Handle initialTab parameter
  useEffect(() => {
    console.log(`🎯 [ClubDetailScreen] InitialTab useEffect triggered:`, {
      initialTab,
      routesLength: routes.length,
      userRole,
      routes: routes.map(r => r.key),
    });

    if (initialTab) {
      // Base routes are always available, even before userRole loads
      const baseRoutes = [
        { key: 'overview', title: t('clubDetail.tabs.home') },
        { key: 'members', title: t('clubDetail.tabs.members') },
        { key: 'activities', title: t('clubDetail.tabs.activities') },
        { key: 'leagues', title: t('clubDetail.tabs.leagues') },
        { key: 'policy', title: t('clubDetail.tabs.policy') },
        // Removed 'board' - now in Club Chat Room
        // Removed 'chat' - now accessible via header button
      ];

      // Find index in base routes first
      let targetIndex = baseRoutes.findIndex(route => route.key === initialTab);

      // If userRole is admin/manager, adjust index for admin tab insertion
      if ((userRole === 'admin' || userRole === 'manager') && targetIndex >= 1) {
        targetIndex += 1; // Admin tab is inserted at position 1, so shift other tabs
      }

      if (targetIndex !== -1) {
        console.log(
          `🎯 [ClubDetailScreen] Setting initial tab: ${initialTab} (base index: ${baseRoutes.findIndex(r => r.key === initialTab)}, final index: ${targetIndex})`
        );
        console.log(
          `🔄 [ClubDetailScreen] Before setInternalIndex - current index: ${internalIndex}`
        );
        setInternalIndex(targetIndex);
        console.log(`🔄 [ClubDetailScreen] After setInternalIndex - target index: ${targetIndex}`);

        // Force a small delay to ensure state update
        setTimeout(() => {
          console.log(
            `🔄 [ClubDetailScreen] Delayed check - internalIndex should be: ${targetIndex}`
          );
        }, 100);
      } else {
        console.warn(
          `🚨 [ClubDetailScreen] Invalid initialTab: ${initialTab}. Available base tabs:`,
          baseRoutes.map(r => r.key)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, routes, userRole]);

  // Set current club context for meetup data synchronization
  useEffect(() => {
    if (clubId) {
      setCurrentClubId(clubId);
    }

    return () => {
      setCurrentClubId(null);
    };
  }, [clubId, setCurrentClubId]);

  // Admin tab now dynamically positioned via useMemo above - no separate useEffect needed

  // 🦾 IRON MAN: Subscribe to club-specific team invitations for badge count
  useEffect(() => {
    const authUser = user || currentUser;
    if (!clubId || !authUser?.uid) {
      console.log('🦾 [IRON MAN] Missing clubId or userId for team invitation subscription');
      return;
    }

    console.log('🦾 [IRON MAN] Subscribing to club team invitations...', {
      clubId,
      userId: authUser.uid,
    });

    const notificationsRef = collection(db, 'notifications');
    // 🎯 [KIM FIX] Simplified query to avoid composite index requirement
    // Use only 2 equality filters, then filter the rest client-side
    const q = query(
      notificationsRef,
      where('recipientId', '==', authUser.uid),
      where('type', '==', 'CLUB_TEAM_INVITE')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        // 🎯 Client-side filtering for clubId and status
        // 🦾 [IRON MAN FIX] Exclude notifications where current user is the sender
        // (초대를 보낸 사람에게는 배지를 표시하지 않음)
        const filteredDocs = snapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          const isForThisClub = data.clubId === clubId && data.status === 'unread';
          const isNotSender = data.senderId !== authUser.uid;
          return isForThisClub && isNotSender;
        });
        const count = filteredDocs.length;
        console.log('🦾 [IRON MAN] Team invitation count updated:', count, {
          totalDocs: snapshot.docs.length,
          filteredForClub: filteredDocs.length,
        });
        setTeamInvitationCount(count);

        // 🧹 [AUTO-CLEANUP] Check for orphan notifications in background
        // Don't block the badge count update
        const cleanupOrphanNotifications = async () => {
          for (const notifDoc of filteredDocs) {
            const data = notifDoc.data();
            const eventId = data.tournamentId || data.leagueId || data.eventId;

            // 🎯 [KIM FIX] Use eventType field from notification if available
            // Cloud Function sets eventType: 'tournament' or 'league'
            let eventType: string | null = null;
            if (data.tournamentId) {
              eventType = 'tournaments';
            } else if (data.leagueId) {
              eventType = 'leagues';
            } else if (data.eventType === 'tournament') {
              eventType = 'tournaments';
            } else if (data.eventType === 'league') {
              eventType = 'leagues';
            } else if (data.eventId) {
              eventType = 'club_events';
            }

            if (!eventId || !eventType) continue;

            try {
              const eventRef = doc(db, eventType, eventId);
              const eventSnap = await getDoc(eventRef);

              if (!eventSnap.exists()) {
                // Event deleted, cleanup this notification
                console.log('🧹 [ORPHAN] Found orphan notification for deleted event:', {
                  notificationId: notifDoc.id,
                  eventType,
                  eventId,
                });
                await deleteDoc(doc(db, 'notifications', notifDoc.id));
                console.log('✅ [CLEANUP] Deleted orphan notification:', notifDoc.id);
              }
            } catch (error) {
              console.error('❌ [CLEANUP] Error checking/deleting notification:', error);
            }
          }
        };

        // Run cleanup in background (don't await)
        cleanupOrphanNotifications();
      },
      error => {
        console.error('❌ [IRON MAN] Error fetching team invitations:', error);
      }
    );

    return () => {
      console.log('🦾 [IRON MAN] Unsubscribing from team invitations');
      unsubscribe();
    };
  }, [clubId, user?.uid, currentUser?.uid, user, currentUser]);

  // 💬 Subscribe to club chat unread messages count
  useEffect(() => {
    const authUser = user || currentUser;
    if (!clubId || !authUser?.uid) {
      console.log('💬 [ClubDetailScreen] Missing clubId or userId for chat subscription');
      return;
    }

    console.log('💬 [ClubDetailScreen] Setting up club chat unread count subscription');

    const chatQuery = query(
      collection(db, 'clubChat'),
      where('clubId', '==', clubId),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      chatQuery,
      snapshot => {
        const unread = snapshot.docs.filter(doc => {
          const data = doc.data();
          return (
            data.type === 'text' &&
            data.senderId !== authUser.uid &&
            (!data.readBy || !data.readBy.includes(authUser.uid))
          );
        }).length;

        console.log(`💬 [ClubDetailScreen] Unread messages: ${unread}`);
        setUnreadCount(unread);
      },
      error => {
        console.error('💬 [ClubDetailScreen] Error fetching unread count:', error);
      }
    );

    return () => {
      console.log('💬 [ClubDetailScreen] Cleaning up unread count subscription');
      unsubscribe();
    };
  }, [clubId, user?.uid, currentUser?.uid, user, currentUser]);

  // 🎯 [KIM FIX] Subscribe to join request count (for admin/manager)
  useEffect(() => {
    if (!clubId || (userRole !== 'admin' && userRole !== 'manager')) {
      setJoinRequestCount(0);
      return;
    }

    console.log('🎯 [ClubDetailScreen] Setting up join request count subscription');

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const unsubscribe = clubService.subscribeToJoinRequests(clubId, (requests: any[]) => {
      console.log(`🎯 [ClubDetailScreen] Join request count: ${requests.length}`);
      setJoinRequestCount(requests.length);
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return () => {
      console.log('🎯 [ClubDetailScreen] Cleaning up join request subscription');
      unsubscribe();
    };
  }, [clubId, userRole]);

  // Load club data
  useEffect(() => {
    if (!clubId) {
      setIsLoading(false);
      return;
    }

    const clubRef = doc(db, 'tennis_clubs', clubId);
    const unsubscribe = onSnapshot(
      clubRef,
      async snapshot => {
        if (snapshot.exists()) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const clubData = snapshot.data() as any;
          /* eslint-enable @typescript-eslint/no-explicit-any */

          // 💥 CCTV #3: Firebase 문서 구조 분석 💥
          console.log('--- 🔍 FIREBASE DOCUMENT STRUCTURE ---', {
            hasLocation: !!clubData.location,
            locationStructure: clubData.location,
            hasName: !!clubData.name,
            hasMemberCount: !!clubData.memberCount,
            documentKeys: Object.keys(clubData),
          });

          setClubDetail({ ...clubData, id: snapshot.id } as ExtendedClub);

          // Check user role if user is logged in
          const authUser = user || currentUser;
          if (authUser?.uid) {
            setIsLoadingRole(true);
            try {
              console.log('🔍 [ClubDetailScreen] Checking user role for:', authUser.uid);
              const role = await clubService.getUserRoleInClub(clubId, authUser.uid);
              setUserRole(role as ClubMemberRole | null);

              // Check membership status
              const status = await clubService.getMembershipStatus(clubId, authUser.uid);
              /* eslint-disable @typescript-eslint/no-explicit-any */
              setMembershipStatus(status as any);
              /* eslint-enable @typescript-eslint/no-explicit-any */
            } catch (error) {
              console.error('❌ [ClubDetailScreen] Error getting user role:', error);
              setUserRole(null);
              setMembershipStatus('none');
            } finally {
              setIsLoadingRole(false);
            }
          } else {
            console.log('❌ [ClubDetailScreen] No authenticated user found');
          }
        } else {
          console.warn('Club not found:', clubId);
          setClubDetail(null);
        }
        setIsLoading(false);
      },
      error => {
        console.error('Error loading club:', error);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [clubId, user?.uid, currentUser?.uid, user, currentUser]);

  // 🔄 Real-time membership status subscription
  useEffect(() => {
    const authUser = user || currentUser;
    if (!clubId || !authUser?.uid) return;

    const membershipId = `${clubId}_${authUser.uid}`;
    const memberRef = doc(db, 'clubMembers', membershipId);

    console.log('🔄 [ClubDetailScreen] Subscribing to membership status for:', membershipId);

    const unsubscribe = onSnapshot(
      memberRef,
      snapshot => {
        if (snapshot.exists()) {
          const memberData = snapshot.data();
          const newStatus = memberData.status === 'active' ? 'member' : 'none';
          setMembershipStatus(newStatus);

          // Also update userRole if it changed
          if (memberData.role) {
            setUserRole(memberData.role);
          }
        } else {
          // Don't overwrite 'pending' or 'declined' status when document doesn't exist
          // (user just applied and clubMembers document hasn't been created, or was rejected)
          setMembershipStatus(prevStatus =>
            prevStatus === 'pending' || prevStatus === 'declined' ? prevStatus : 'none'
          );
          setUserRole(null);
        }
      },
      error => {
        console.error('❌ [ClubDetailScreen] Error in membership subscription:', error);
      }
    );

    return () => {
      console.log('🔄 [ClubDetailScreen] Unsubscribing from membership status');
      unsubscribe();
    };
  }, [clubId, user?.uid, currentUser?.uid, user, currentUser]);

  // 🔢 Count actual members from clubMembers collection
  useEffect(() => {
    if (!clubId) return;

    const loadActualMemberCount = async () => {
      try {
        const membersQuery = query(
          collection(db, 'clubMembers'),
          where('clubId', '==', clubId),
          where('status', '==', 'active')
        );

        const snapshot = await getDocs(membersQuery);
        const count = snapshot.size;

        console.log(`📊 [ClubDetailScreen] Actual member count for club ${clubId}:`, count);
        setActualMemberCount(count);
      } catch (error) {
        console.error('❌ [ClubDetailScreen] Failed to count members:', error);
        setActualMemberCount(null);
      }
    };

    loadActualMemberCount();
  }, [clubId]);

  // 🔄 Real-time join request status subscription
  // 🎯 ROOT CAUSE FIX: Subscribe to club_join_requests to detect rejection
  useEffect(() => {
    const authUser = user || currentUser;
    if (!clubId || !authUser?.uid) return;

    // Query for user's join requests to this club
    // 🎯 FIX: Remove orderBy to avoid composite index requirement - sort client-side instead
    // 🔧 FIX: Use camelCase collection name to match Cloud Functions
    const joinRequestQuery = query(
      collection(db, 'clubJoinRequests'),
      where('userId', '==', authUser.uid),
      where('clubId', '==', clubId)
    );

    console.log('🔍 [JoinRequest] Setting up subscription for:', { clubId, userId: authUser.uid });

    const unsubscribe = onSnapshot(
      joinRequestQuery,
      snapshot => {
        console.log('🔍 [JoinRequest] onSnapshot triggered:', {
          empty: snapshot.empty,
          size: snapshot.size,
          docs: snapshot.docs.map(d => ({ id: d.id, status: d.data().status })),
        });

        if (!snapshot.empty) {
          // 🎯 FIX: Get the most recent request by sorting client-side
          interface JoinRequestData {
            status: string;
            createdAt?: { toMillis?: () => number; seconds?: number };
          }
          const allRequests = snapshot.docs.map(docSnap => ({
            ...(docSnap.data() as JoinRequestData),
            id: docSnap.id,
          }));

          // 🔥 ROOT CAUSE FIX: Filter out approved requests!
          // Approved requests mean the user is already a member,
          // so we should only consider pending/rejected for UI button state
          const activeRequests = allRequests.filter(
            req => req.status === 'pending' || req.status === 'rejected'
          );

          console.log(
            '🔍 [JoinRequest] Active requests (excluding approved):',
            activeRequests.length
          );

          if (activeRequests.length === 0) {
            console.log(
              '🔍 [JoinRequest] No active requests - user may be member or has no requests'
            );
            return;
          }

          // Sort by createdAt descending to get the latest request
          activeRequests.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds || 0) * 1000;
            const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds || 0) * 1000;
            return timeB - timeA;
          });

          const latestRequest = activeRequests[0];
          const status = latestRequest.status;

          console.log('🔍 [JoinRequest] Latest active request:', { id: latestRequest.id, status });

          if (status === 'pending') {
            console.log('🔍 [JoinRequest] Setting membershipStatus to pending');
            setMembershipStatus('pending');
          } else if (status === 'rejected') {
            // 🎯 KEY FIX: Detect rejection and update UI
            console.log('🔍 [JoinRequest] Setting membershipStatus to declined');
            setMembershipStatus('declined');
          }
        } else {
          console.log('🔍 [JoinRequest] No join requests found for this user/club');
        }
      },
      error => {
        console.error('❌ [ClubDetailScreen] Error in join request subscription:', error);
      }
    );

    return () => unsubscribe();
  }, [clubId, user?.uid, currentUser?.uid, user, currentUser]);

  // 🦾 IRON MAN: Pulse animation for pending join button
  useEffect(() => {
    if (membershipStatus === 'pending') {
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    } else {
      // Reset to full opacity when not pending
      pulseAnim.setValue(1);
    }
  }, [membershipStatus, pulseAnim]);

  // 🎯 [iOS 18 FIX] 자체 헤더 사용 - React Navigation 헤더 대신
  // React Navigation의 iOS 18 버튼 그룹 스타일 문제를 우회
  const showSettingsIcon =
    membershipStatus === 'member' || userRole === 'admin' || userRole === 'manager';

  // 커스텀 헤더 렌더링 함수
  const renderCustomHeader = () => (
    <View style={styles.customHeader}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.customHeaderButton}>
        <Ionicons name='arrow-back' size={24} color={currentTheme === 'dark' ? '#fff' : '#000'} />
      </TouchableOpacity>

      {/* Right Buttons */}
      {showSettingsIcon && (
        <View style={styles.customHeaderRight}>
          {/* Chat Button with Badge */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ClubChat', { clubId })}
              style={styles.customHeaderButton}
            >
              <Ionicons name='chatbubbles' size={24} color='#007AFF' />
            </TouchableOpacity>

            {unreadCount > 0 && (
              <Badge
                size={16}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#FF3B30',
                  color: '#FFFFFF',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MyClubSettings', {
                clubId,
                clubName: (clubDetail?.profile?.name || clubDetail?.name) ?? '',
              })
            }
            style={styles.customHeaderButton}
          >
            <Ionicons
              name='settings-outline'
              size={24}
              color={currentTheme === 'dark' ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // 🎯 [SWIPE] 스와이프 네비게이션 핸들러 - Discover/services로 이동
  const handleSwipeRight = React.useCallback(() => {
    // 오른쪽 스와이프 → Discover 탭의 서비스 탭으로 이동
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('Discover', {
      screen: 'DiscoverMain',
      params: { initialFilter: 'services' },
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [navigation]);

  // 🎯 [SWIPE] 왼쪽 스와이프 → Profile 탭으로 이동
  const handleSwipeLeft = React.useCallback(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('Profile');
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [navigation]);

  // 🎯 [SWIPE] 스와이프 제스처 설정 - 양방향 스와이프 지원
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // 🎯 더 민감하게 (DiscoverScreen과 동일)
    .failOffsetY([-30, 30]) // 🎯 수직 스크롤과 충돌 방지 (DiscoverScreen과 동일)
    .onEnd(event => {
      'worklet';
      if (event.translationX > 50) {
        // 오른쪽 스와이프 → Discover/services로 이동
        runOnJS(handleSwipeRight)();
      } else if (event.translationX < -50) {
        // 왼쪽 스와이프 → Profile로 이동
        runOnJS(handleSwipeLeft)();
      }
    });

  // Get header image properties with proper fallbacks
  const getHeaderImageProps = () => {
    const coverImage = clubDetail?.profile?.coverImage || clubDetail?.coverImageUrl;
    const logoImage = clubDetail?.profile?.logo;

    if (coverImage) {
      return { source: { uri: coverImage }, resizeMode: 'cover' as const };
    } else if (logoImage) {
      return { source: { uri: logoImage }, resizeMode: 'cover' as const };
    } else {
      // No cover image or logo - don't show default app logo
      return null;
    }
  };

  // Handle join club
  const handleJoinClub = async () => {
    const authUser = user || currentUser;
    if (!authUser?.uid || !clubDetail) return;

    setIsJoining(true);
    try {
      await clubService.requestToJoinClub(clubDetail.id, authUser.uid, joinMessage);
      setSnackbarMessage(t('findClub.joinSuccess'));
      setSnackbarVisible(true);
      setShowJoinModal(false);
      setJoinMessage('');
      setMembershipStatus('pending');
    } catch (error) {
      console.error('Error joining club:', error);
      setSnackbarMessage(t('alerts.joinError'));
      setSnackbarVisible(true);
    } finally {
      setIsJoining(false);
    }
  };

  // 🎯 [KIM FIX] Callback to switch to Leagues/Tournaments tab from Overview
  const handleSwitchToLeaguesTab = useCallback(
    (subTab: 'leagues' | 'tournaments') => {
      console.log(`🎯 [ClubDetailScreen] Switching to leagues tab with subTab: ${subTab}`);
      // Find the leagues tab index dynamically
      const leaguesIndex = routes.findIndex(r => r.key === 'leagues');
      if (leaguesIndex !== -1) {
        setLeaguesSubTab(subTab);
        // 🎯 [KIM FIX] Increment counter to force useEffect trigger even for same tab
        setLeaguesTabSwitchCount(prev => prev + 1);
        setInternalIndex(leaguesIndex);
      } else {
        console.warn('🚨 [ClubDetailScreen] Could not find leagues tab');
      }
    },
    [routes]
  );

  // 🎯 [KIM FIX] Callback to switch to Activities (Regular Meetups) tab from Overview
  const handleSwitchToActivitiesTab = useCallback(() => {
    console.log('🎯 [ClubDetailScreen] Switching to activities tab');
    const activitiesIndex = routes.findIndex(r => r.key === 'activities');
    if (activitiesIndex !== -1) {
      setInternalIndex(activitiesIndex);
    } else {
      console.warn('🚨 [ClubDetailScreen] Could not find activities tab');
    }
  }, [routes]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const renderScene = ({ route }: any) => {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    switch (route.key) {
      case 'overview':
        return (
          <ClubOverviewScreen
            clubId={clubId}
            clubProfile={clubDetail}
            userRole={userRole || ''}
            onSwitchToLeaguesTab={handleSwitchToLeaguesTab}
            onSwitchToActivitiesTab={handleSwitchToActivitiesTab}
            onNotificationCountChange={setClubNotificationCount}
          />
        );
      case 'members':
        return (
          <ClubMembersScreen
            clubId={clubId}
            userRole={userRole || ''}
            initialSubTab={
              initialSubTab === 'applications' ||
              initialSubTab === 'all_members' ||
              initialSubTab === 'roles'
                ? initialSubTab
                : undefined
            }
          />
        );
      case 'activities':
        return <ClubRegularMeetupsScreen clubId={clubId} userRole={userRole || ''} />;
      case 'leagues':
        return (
          <ClubLeaguesTournamentsScreen
            clubId={clubId}
            userRole={userRole || ''}
            initialSubTab={leaguesSubTab}
            tabSwitchCount={leaguesTabSwitchCount}
          />
        );
      case 'policy':
        return (
          <ClubPoliciesScreen
            clubId={clubId}
            clubName={clubDetail?.profile?.name || clubDetail?.name}
            userRole={userRole || ''}
          />
        );
      case 'hallOfFame':
        return <ClubHallOfFameScreen clubId={clubId} userRole={userRole} />;
      // case 'board' removed - Board feature now in Club Chat Room
      case 'admin':
        return (
          <ClubAdminScreen
            clubId={clubId}
            clubName={clubDetail?.profile?.name || clubDetail?.name}
            userRole={userRole || ''}
          />
        );
      case 'settings':
        return <ClubSettingsScreen clubId={clubId} userRole={userRole || ''} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={themeColors.colors.primary} />
        <PaperText variant='bodyMedium' style={styles.loadingText}>
          {t('clubDetailScreen.loading')}
        </PaperText>
      </View>
    );
  }

  if (!clubDetail) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={64} color='#ccc' />
        <PaperText variant='titleLarge' style={styles.errorTitle}>
          {t('clubDetailScreen.notFound')}
        </PaperText>
        <PaperText variant='bodyMedium' style={styles.errorText}>
          {t('clubDetailScreen.notFoundMessage')}
        </PaperText>
        <Button mode='contained' onPress={() => navigation.goBack()} style={styles.backButton}>
          {t('clubDetailScreen.goBack')}
        </Button>
      </View>
    );
  }

  // Conditionally use ImageBackground or View based on whether cover image exists
  const headerImageProps = getHeaderImageProps();
  const CoverComponent = headerImageProps ? ImageBackground : View;
  const coverProps = headerImageProps
    ? { ...headerImageProps, style: styles.coverImage }
    : { style: styles.coverImage };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
        {/* 🎯 [iOS 18 FIX] 자체 헤더 - React Navigation 헤더 대신 */}
        {renderCustomHeader()}
        {/* Club Cover Section - 🎯 [SWIPE] 헤더에서 오른쪽 스와이프 → Discover/services */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.coverContainer}>
            <CoverComponent {...coverProps}>
              <View style={styles.coverOverlay}>
                <View style={styles.clubInfo}>
                  <Surface style={styles.avatarContainer}>
                    <Avatar.Image
                      size={80}
                      source={
                        clubDetail?.profile?.logo || clubDetail?.logoUrl
                          ? { uri: clubDetail?.profile?.logo || clubDetail?.logoUrl }
                          : defaultClubImage
                      }
                    />
                  </Surface>
                  <View style={styles.clubTextInfo}>
                    <PaperText variant='headlineSmall' style={styles.clubName}>
                      {clubDetail?.profile?.name ||
                        clubDetail?.name ||
                        translate('common.unknownClub')}
                    </PaperText>
                    <PaperText variant='bodyMedium' style={styles.clubLocation}>
                      📍{' '}
                      {(() => {
                        const courtAddress = clubDetail?.profile?.courtAddress;
                        const address =
                          courtAddress?.address ||
                          clubDetail.location?.address ||
                          translate('common.unknown');
                        const city = courtAddress?.city;
                        const state = courtAddress?.state;

                        // Format: "5575 GC Crow Road, Flowery Branch, GA"
                        if (city && state) {
                          return `${address}, ${city}, ${state}`;
                        } else if (city) {
                          return `${address}, ${city}`;
                        }
                        return address;
                      })()}
                    </PaperText>
                    <PaperText variant='bodySmall' style={styles.clubMembers}>
                      👥{' '}
                      {t('club.clubMembers.memberCount', {
                        count:
                          actualMemberCount !== null
                            ? actualMemberCount
                            : Math.max(
                                0,
                                clubDetail.statistics?.totalMembers ||
                                  clubDetail.stats?.totalMembers ||
                                  0
                              ),
                      })}
                    </PaperText>
                  </View>
                </View>

                {/* Join button for non-members - overlay in header bottom right */}
                {(membershipStatus === 'none' ||
                  membershipStatus === 'pending' ||
                  membershipStatus === 'declined') &&
                  (user || currentUser) && (
                    <View style={styles.headerJoinButtonContainer}>
                      <Animated.View style={{ opacity: pulseAnim }}>
                        <Button
                          mode='contained'
                          onPress={
                            membershipStatus === 'pending'
                              ? undefined
                              : membershipStatus === 'declined'
                                ? () => {
                                    setMembershipStatus('none');
                                    setShowJoinModal(true);
                                  }
                                : () => setShowJoinModal(true)
                          }
                          style={styles.headerJoinButton}
                          contentStyle={styles.headerJoinButtonContent}
                          buttonColor={
                            membershipStatus === 'declined'
                              ? themeColors.colors.secondary
                              : themeColors.colors.primary
                          }
                          compact
                        >
                          {membershipStatus === 'pending'
                            ? t('clubDetailScreen.joinWaiting')
                            : membershipStatus === 'declined'
                              ? t('clubDetailScreen.reapply')
                              : t('clubDetailScreen.joinApply')}
                        </Button>
                      </Animated.View>
                    </View>
                  )}
              </View>
            </CoverComponent>
          </View>
        </GestureDetector>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TabView
            key={`${clubId}-${routes.length}`}
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={newIndex => {
              console.log(`🔄 [TabView] onIndexChange called: ${index} -> ${newIndex}`);
              setInternalIndex(newIndex);
            }}
            initialLayout={{ width: 400 }}
            keyboardDismissMode='none'
            swipeEnabled={!showJoinModal}
            lazy={true}
            renderTabBar={props => (
              <ScrollableTabBar
                navigationState={props.navigationState}
                onTabPress={route => {
                  const routeIndex = props.navigationState.routes.findIndex(
                    r => r.key === route.key
                  );
                  if (routeIndex !== -1) {
                    setInternalIndex(routeIndex);
                  }
                }}
                activeColor={themeColors.colors.primary}
                inactiveColor={themeColors.colors.onSurfaceVariant}
                backgroundColor={themeColors.colors.surface}
                indicatorColor={themeColors.colors.primary}
                badgeCounts={{
                  overview: clubNotificationCount,
                  leagues: teamInvitationCount,
                  members: joinRequestCount,
                }}
                // 🔴 [KIM FIX] Red badge for meetup chat unread messages on Activities (Meetups) tab
                redBadgeCounts={{
                  activities: meetupChatUnreadCounts[clubId] || 0,
                }}
                // 🎨 Highlight admin tab with orange color for better visibility
                tabColors={{
                  admin: '#FF6B35', // Tennis Orange - secondary brand color
                }}
                // 🎯 Add settings icon to admin tab
                tabIcons={{
                  admin: 'settings-outline',
                }}
              />
            )}
          />
        </View>

        {/* Join Application Modal */}
        {showJoinModal && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
            ]}
          >
            <SafeAreaView style={styles.modalContainer}>
              <Card style={styles.joinModalCard}>
                <Card.Content>
                  <PaperText variant='titleLarge' style={styles.joinModalTitle}>
                    {t('clubDetailScreen.joinModalTitle')}
                  </PaperText>
                  <PaperText variant='bodyMedium' style={styles.joinModalDescription}>
                    {t('clubDetailScreen.joinModalMessage', {
                      name:
                        clubDetail?.profile?.name ||
                        clubDetail?.name ||
                        t('clubDetailScreen.joinModalTitle'),
                    })}
                  </PaperText>
                  <TextInput
                    ref={textInputRef}
                    mode='outlined'
                    label={t('clubDetailScreen.joinMessageLabel')}
                    value={joinMessage}
                    onChangeText={setJoinMessage}
                    multiline
                    numberOfLines={4}
                    style={styles.joinMessageInput}
                    placeholder={t('clubDetailScreen.joinMessagePlaceholder')}
                  />
                </Card.Content>
                <Card.Actions style={styles.joinModalActions}>
                  <Button onPress={() => setShowJoinModal(false)} disabled={isJoining}>
                    {t('clubDetailScreen.cancel')}
                  </Button>
                  <Button
                    mode='contained'
                    onPress={handleJoinClub}
                    loading={isJoining}
                    disabled={isJoining}
                  >
                    {t('clubDetailScreen.submit')}
                  </Button>
                </Card.Actions>
              </Card>
            </SafeAreaView>
          </View>
        )}

        {/* Snackbar for feedback */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          action={snackbarAction}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    errorTitle: {
      marginTop: 16,
      textAlign: 'center',
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    errorText: {
      marginTop: 8,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
    },
    backButton: {
      marginTop: 24,
    },
    coverContainer: {
      height: 120, // 🎯 [KIM FIX] Increased from 110 to prevent avatar clipping (avatar 80px + padding 32px = 112px min)
      position: 'relative',
      backgroundColor: colors.surface,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center', // 🎯 [KIM FIX] Changed from 'space-between' to center content vertically
      padding: 16,
      paddingTop: 16,
    },
    clubInfo: {
      flexDirection: 'row',
      alignItems: 'center', // 🎯 [KIM FIX] Changed from 'flex-end' to center avatar and text vertically
    },
    avatarContainer: {
      borderRadius: 40,
      elevation: 4,
    },
    clubTextInfo: {
      flex: 1,
      marginLeft: 16,
      // 🎯 [KIM FIX] Removed marginBottom: 8 for proper vertical centering with avatar
    },
    clubName: {
      color: '#fff',
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    clubLocation: {
      color: '#fff',
      marginTop: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    clubMembers: {
      color: '#fff',
      marginTop: 2,
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    // 🎯 [iOS 18 FIX] 자체 헤더 스타일
    customHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingTop: Platform.OS === 'ios' ? 50 : (RNStatusBar.currentHeight || 24) + 8,
      paddingBottom: 8,
      backgroundColor: colors.surface,
      zIndex: 10,
    },
    customHeaderButton: {
      padding: 8,
      // 테두리 없는 깔끔한 버튼
    },
    customHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerButton: {
      padding: 8,
      marginHorizontal: 8,
      // 헤더가 이미 어둡게 처리되어 있으므로 버튼 배경 제거
    },
    headerJoinButtonContainer: {
      position: 'absolute',
      bottom: 12,
      right: 16,
      zIndex: 10,
    },
    headerJoinButton: {
      borderRadius: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    headerJoinButtonContent: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    tabContainer: {
      flex: 1,
      // TabView가 SafeAreaView 내부에서 올바르게 확장되도록 설정
      overflow: 'hidden',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    joinModalCard: {
      width: '100%',
      maxWidth: 400,
    },
    joinModalTitle: {
      textAlign: 'center',
      fontWeight: 'bold',
      marginBottom: 16,
    },
    joinModalDescription: {
      textAlign: 'center',
      marginBottom: 16,
      opacity: 0.8,
    },
    joinMessageInput: {
      marginBottom: 16,
    },
    joinModalActions: {
      justifyContent: 'flex-end',
    },
    snackbar: {
      marginBottom: 16,
    },
  });
