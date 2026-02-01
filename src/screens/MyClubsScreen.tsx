import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect, StackActions } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import clubService from '../services/clubService';
import SafeText from '../components/common/SafeText';
import { useClubChatUnreadCount } from '../hooks/clubs/useClubChatUnreadCount';
import { useMeetupChatUnreadCount } from '../hooks/clubs/useMeetupChatUnreadCount';
import type { MyClubsStackParamList, RootStackParamList } from '../navigation/AppNavigator';

interface UserClub {
  id: string;
  clubId: string;
  clubName: string;
  role: 'admin' | 'manager' | 'member';
  status: 'pending' | 'active' | 'inactive';
  joinedAt: Date;
  memberCount?: number;
  clubDescription?: string;
  clubLocation?: string;
  clubLogo?: string;
  clubLogoUrl?: string;
  clubMaxMembers?: number;
  pendingApplications?: number;
}

type MyClubsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<MyClubsStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// 🎯 [SWIPE] Route params 타입 정의
type MyClubsRouteParams = {
  fromSwipe?: boolean;
};

const MyClubsScreenSimple = () => {
  const navigation = useNavigation<MyClubsNavigationProp>();
  const route = useRoute<RouteProp<{ MyClubsMain: MyClubsRouteParams }, 'MyClubsMain'>>();

  // 🎯 [SWIPE] 스와이프로 진입했는지 확인
  const fromSwipe = route.params?.fromSwipe ?? false;
  const { t } = useTranslation();

  const authCtx = useAuth();
  const currentUser = authCtx?.currentUser || null;

  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles = createStyles(themeColors.colors as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const [userClubs, setUserClubs] = useState<UserClub[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [smartTabApplied, setSmartTabApplied] = useState(false); // 🛡️ Track if smart tab logic already applied

  // 🔧 [KIM FIX] Loading timeout ref to prevent infinite loading state
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔴🟡 채팅 안읽은 메시지 (빨간색 배지) + 일반 알림 (노란색 배지)
  // Now using centralized hook for both - no duplicate subscriptions needed!
  const { clubUnreadCounts, clubNotificationCounts } = useClubChatUnreadCount(currentUser?.uid);

  // 🔴 [KIM FIX] 모임 채팅 안읽은 메시지 - 클럽별 집계
  // 클럽 채팅 + 모임 채팅을 합산하여 클럽 카드에 빨간 배지로 표시
  const { clubUnreadCounts: meetupClubUnreadCounts } = useMeetupChatUnreadCount(currentUser?.uid);

  const loadUserClubs = useCallback(async () => {
    if (!currentUser?.uid) {
      // Use mock data if not logged in
      const mockClubs: UserClub[] = [
        {
          id: 'mock-1',
          clubId: 'club-1',
          clubName: 'Atlanta Pickleball Club',
          clubDescription: 'Weekly pickleball matches and practice sessions',
          clubLocation: 'Atlanta, GA',
          role: 'admin',
          status: 'active',
          joinedAt: new Date('2024-01-15'),
          memberCount: 45,
          clubMaxMembers: 100,
          pendingApplications: 3,
        },
        {
          id: 'mock-2',
          clubId: 'club-2',
          clubName: 'Duluth Pickleball Group',
          clubDescription: 'Friendly pickleball community in Duluth',
          clubLocation: 'Duluth, GA',
          role: 'member',
          status: 'active',
          joinedAt: new Date('2024-02-01'),
          memberCount: 30,
          clubMaxMembers: 50,
          pendingApplications: 0,
        },
      ];
      setUserClubs(mockClubs);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading clubs for user:', currentUser.uid);

      // Load real data from Firebase
      const clubs = await clubService.getUserClubMemberships(currentUser.uid);
      console.log('Loaded clubs:', clubs.length);

      // Convert to our UserClub format
      const formattedClubs = clubs.map(club => ({
        id: club.id,
        clubId: club.clubId,
        clubName: club.clubName || t('common.unknownClub'),
        clubDescription: club.clubDescription,
        clubLocation: club.clubLocation || t('common.unknown'),
        clubLogo: club.clubLogo,
        clubLogoUrl: club.logoUrl || club.logoUri || club.clubLogo,
        role: club.role || 'member',
        status: club.status || 'active',
        joinedAt: club.joinedAt || new Date(),
        memberCount: club.memberCount || 0,
        clubMaxMembers: club.clubMaxMembers,
        pendingApplications: 0,
      }));

      setUserClubs(formattedClubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setUserClubs([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    // 🛡️ [FIXED] Only execute when:
    // 1. Loading is complete
    // 2. We have club data
    // 3. Smart tab logic hasn't been applied yet (prevent re-application on focus)
    if (!loading && userClubs && !smartTabApplied) {
      if (userClubs.length === 1) {
        // 🕰️ [Operation Timekeeper II] Single club: Replace current screen only
        console.log(
          '🎯 Smart Tab: Single club detected, replacing with direct route to:',
          userClubs[0].clubName,
          fromSwipe ? '(from swipe - going to home tab)' : ''
        );

        // Use StackActions.replace to substitute current screen with ClubDetail
        // This preserves the previous navigation history while avoiding phantom MyClubsList
        // 🎯 [SWIPE] 스와이프로 왔으면 홈 탭으로 이동
        navigation.dispatch(
          StackActions.replace('ClubDetail', {
            clubId: userClubs[0].clubId,
            userRole: userClubs[0].role,
            fallbackClub: {
              id: userClubs[0].clubId,
              name: userClubs[0].clubName,
              description: userClubs[0].clubDescription,
              location: userClubs[0].clubLocation,
            },
            ...(fromSwipe && { initialTab: 'overview' }),
          })
        );
        setSmartTabApplied(true); // Mark as applied
        return; // Exit early to prevent rendering list
      } else if (userClubs.length === 0) {
        // 2. No clubs: Stay on list screen to show empty state
        console.log('📭 Smart Tab: No clubs found, showing empty state');
        setSmartTabApplied(true); // Mark as applied
      } else {
        // 3. Multiple clubs: Show list as normal - DO NOT NAVIGATE!
        console.log('📋 Smart Tab: Multiple clubs found, showing list:', userClubs.length);
        setSmartTabApplied(true); // Mark as applied to prevent any navigation attempts
      }
    }
  }, [loading, userClubs, navigation, smartTabApplied, fromSwipe]);

  useEffect(() => {
    loadUserClubs();
  }, [loadUserClubs]);

  // 🔧 [KIM FIX] Loading timeout to prevent infinite loading state
  useEffect(() => {
    if (loading) {
      // Start timeout when loading begins
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('⏱️ [KIM FIX] Club list loading timeout reached (10s), forcing state update');
        setLoading(false);
      }, 10000); // 10 second timeout
    } else {
      // Clear timeout when loading completes
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);

  // 🏰 [Operation Direct Route] Add useFocusEffect for robustness
  // This ensures data is refreshed when the screen regains focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 MyClubsScreen focused - refreshing club data for robustness');

      // 🛡️ [FIXED] Reset smart tab flag to allow re-evaluation on focus
      setSmartTabApplied(false);

      // Clear cache and reload data when screen gains focus
      if (currentUser?.uid) {
        clubService.clearMembershipCache(currentUser.uid);
        console.log('🗑️ Cleared cache due to screen focus');
        loadUserClubs();
      }

      return () => {
        // Cleanup logic if needed when screen loses focus
        console.log('👋 MyClubsScreen lost focus');
      };
    }, [currentUser?.uid, loadUserClubs])
  );

  // Real-time listener for club membership changes
  useEffect(() => {
    if (!currentUser?.uid) return;

    let unsubscribe: (() => void) | null = null;

    try {
      // Listen for real-time changes to user's club memberships
      const membershipsQuery = query(
        collection(db, 'clubMembers'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'active')
      );

      unsubscribe = onSnapshot(
        membershipsQuery,
        snapshot => {
          console.log('🔄 실시간 클럽 멤버십 변경 감지:', snapshot.size, '개 클럽');

          // Clear cache before loading to ensure fresh data on real-time changes
          if (currentUser?.uid) {
            clubService.clearMembershipCache(currentUser.uid);
            console.log('🗑️ Cleared cache due to real-time membership changes');
          }

          // 변경이 감지되면 클럽 목록을 새로고침
          loadUserClubs();
        },
        error => {
          console.warn('⚠️ 실시간 클럽 멤버십 리스너 오류:', error);
        }
      );
    } catch (error) {
      console.warn('⚠️ 실시간 클럽 리스너 설정 실패:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid, loadUserClubs]);

  // 🟡 일반 알림 구독은 이제 useClubChatUnreadCount 훅에서 처리됨
  // (중복 Firestore 구독 제거 - clubNotificationCounts 사용)

  const handleClubPress = (club: UserClub) => {
    // 💥 CCTV #1: 어떤 서류를 보내는가? 💥
    console.log('--- 📤 SENDING PARAMS from MyClubsScreen ---', {
      clubId: club.clubId,
      userRole: club.role,
      clubName: club.clubName,
      navigationRoute: 'ClubDetail',
    });

    // 🕰️ [Operation Timekeeper II] Use standard navigate for multi-club scenario
    // This builds a proper navigation stack: [MyClubsList, ClubDetail]
    navigation.navigate('ClubDetail', {
      clubId: club.clubId,
      userRole: club.role,
    });
  };

  const handleCreateClub = () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('CreateClub');
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  const handleFindClubs = () => {
    // 🎯 [KIM FIX] Navigate to Discover tab with clubs filter
    // Nested navigation: MainTabs → Discover (Stack) → DiscoverMain (Screen)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('MainTabs', {
      screen: 'Discover',
      params: {
        screen: 'DiscoverMain',
        params: { initialFilter: 'clubs' },
      },
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  const onRefresh = async () => {
    setRefreshing(true);

    // Clear cache to ensure fresh data on manual refresh
    if (currentUser?.uid) {
      clubService.clearMembershipCache(currentUser.uid);
      console.log('🔄 Forced cache clear on manual refresh');
    }

    await loadUserClubs();
    setRefreshing(false);
  };

  // 🎯 [SWIPE] 스와이프 네비게이션 핸들러
  const handleSwipeRight = React.useCallback(() => {
    // 오른쪽 스와이프 → Discover 탭의 서비스 탭으로 이동 (Create 건너뛰기)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('Discover', {
      screen: 'DiscoverMain',
      params: { initialFilter: 'services' },
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [navigation]);

  const handleSwipeLeft = React.useCallback(() => {
    // 왼쪽 스와이프 → Profile 탭으로 이동
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (navigation as any).navigate('Profile');
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [navigation]);

  // 🎯 [SWIPE] 스와이프 제스처 설정 - DiscoverScreen과 동일한 민감도
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // 🎯 더 민감하게 (DiscoverScreen과 동일)
    .failOffsetY([-30, 30]) // 🎯 수직 스크롤과 충돌 방지 (DiscoverScreen과 동일)
    .onEnd(event => {
      'worklet';
      if (event.translationX > 50) {
        // 오른쪽 스와이프 → Discover (Create 건너뛰기)
        runOnJS(handleSwipeRight)();
      } else if (event.translationX < -50) {
        // 왼쪽 스와이프 → Profile
        runOnJS(handleSwipeLeft)();
      }
    });

  const getRoleColor = (role: string, status: string) => {
    if (status === 'pending') {
      return '#ff9800'; // Orange for pending status
    }
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'manager':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  const getRoleText = (role: string, status: string) => {
    if (status === 'pending') {
      return t('roles.pending');
    }
    switch (role) {
      case 'admin':
        return t('roles.admin');
      case 'manager':
        return t('roles.manager');
      case 'member':
        return t('roles.member');
      default:
        return t('roles.member');
    }
  };

  const renderClubItem = ({ item: club }: { item: UserClub }) => (
    <TouchableOpacity
      style={styles.clubCard}
      onPress={() => handleClubPress(club)}
      activeOpacity={0.7}
    >
      <View style={styles.clubCardContent}>
        <View style={styles.clubLogoContainer}>
          {club.clubLogoUrl && !club.clubLogoUrl.startsWith('file://') ? (
            <Avatar.Image
              size={56}
              source={{ uri: club.clubLogoUrl }}
              style={styles.clubLogoImage}
            />
          ) : (
            <View style={styles.clubLogoPlaceholder}>
              <MaterialCommunityIcons name='tennis' size={28} color='white' />
            </View>
          )}
        </View>

        <View style={styles.clubInfoContainer}>
          <View style={styles.clubHeader}>
            <SafeText style={styles.clubName} numberOfLines={1}>
              {club.clubName}
            </SafeText>
            <View style={styles.clubBadges}>
              <View
                style={[styles.roleChip, { backgroundColor: getRoleColor(club.role, club.status) }]}
              >
                <SafeText style={styles.roleText}>{getRoleText(club.role, club.status)}</SafeText>
              </View>

              {/* 🟡 노란색 배지 - 일반 알림 (클럽 알림) */}
              {clubNotificationCounts[club.clubId] > 0 && (
                <View style={styles.alertBadgeYellow}>
                  <SafeText style={styles.alertBadgeText}>
                    {clubNotificationCounts[club.clubId]}
                  </SafeText>
                </View>
              )}
              {/* 🔴 빨간색 배지 - 채팅 안읽은 메시지 (클럽 채팅 + 모임 채팅 합산) */}
              {(clubUnreadCounts[club.clubId] || 0) + (meetupClubUnreadCounts[club.clubId] || 0) >
                0 && (
                <View style={styles.alertBadgeRed}>
                  <SafeText style={styles.alertBadgeText}>
                    {(clubUnreadCounts[club.clubId] || 0) +
                      (meetupClubUnreadCounts[club.clubId] || 0)}
                  </SafeText>
                </View>
              )}
            </View>
          </View>

          {club.clubDescription ? (
            <SafeText style={styles.clubDescription} numberOfLines={2}>
              {club.clubDescription}
            </SafeText>
          ) : null}

          <View style={styles.clubMetaContainer}>
            <View style={styles.clubMetaRow}>
              <Ionicons
                name='location-outline'
                size={14}
                color={themeColors.colors.onSurfaceVariant}
              />
              <SafeText style={styles.clubMetaText}>{club.clubLocation || t('common.unknown')}</SafeText>
            </View>
            <View style={styles.clubMetaRow}>
              <Ionicons
                name='people-outline'
                size={14}
                color={themeColors.colors.onSurfaceVariant}
              />
              <SafeText style={styles.clubMetaText}>
                {`${club.memberCount || 0}/${club.clubMaxMembers || 100}`}
              </SafeText>
            </View>
          </View>
        </View>

        <Ionicons
          name='chevron-forward'
          size={20}
          color={themeColors.colors.onSurfaceVariant}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );

  // Show loading screen when: 1) Actually loading, or 2) Single club (navigating to ClubDetail)
  if (loading || userClubs?.length === 1) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          {/* 🎯 [KIM FIX] Include all edges for proper Android status bar handling */}
          <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.header}>
              <SafeText style={styles.title}>{t('myClubs.title')}</SafeText>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={themeColors.colors.primary} />
              <SafeText style={styles.loadingText}>
                {userClubs?.length === 1
                  ? t('myClubs.navigatingToClub')
                  : t('myClubs.loadingClubs')}
              </SafeText>
            </View>
          </SafeAreaView>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        {/* 🎯 [KIM FIX] Include all edges for proper Android status bar handling */}
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.header}>
            <SafeText style={styles.title}>{t('myClubs.title')}</SafeText>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={handleCreateClub}>
                <Ionicons name='add' size={24} color={themeColors.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {userClubs.length === 0 ? (
              <View style={styles.emptyState}>
                <SafeText style={styles.emptyIcon}>🎾</SafeText>
                <SafeText style={styles.emptyTitle}>{t('myClubs.noClubsYet')}</SafeText>
                <SafeText style={styles.emptyDescription}>{t('myClubs.findOrCreate')}</SafeText>

                <TouchableOpacity style={styles.findClubsButton} onPress={handleFindClubs}>
                  <SafeText style={styles.findClubsButtonText}>{t('myClubs.findClubs')}</SafeText>
                  <Ionicons name='search' size={20} color={themeColors.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.createClubButton} onPress={handleCreateClub}>
                  <SafeText style={styles.createClubButtonText}>{t('myClubs.createClub')}</SafeText>
                  <Ionicons name='add' size={20} color='#fff' />
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={userClubs}
                renderItem={renderClubItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.clubsList}
                scrollEnabled={false}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const createStyles = (colors: Record<string, string>) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.onSurface,
  },
  content: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.onSurface,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 30,
  },
  createClubButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createClubButtonText: {
    fontSize: 16,
    color: colors.onPrimary,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  clubsList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clubCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  clubCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  clubLogoContainer: {
    marginRight: 12,
  },
  clubLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clubLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  clubInfoContainer: {
    flex: 1,
  },
  clubHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  clubDescription: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
    lineHeight: 18,
  },
  clubMetaContainer: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  clubMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  clubMetaText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  clubBadges: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600' as const,
  },
  chevron: {
    marginLeft: 8,
  },
  findClubsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  findClubsButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  alertBadgeYellow: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFC107', // 노란색 - 일반 알림
  },
  alertBadgeRed: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f44336', // 빨간색 - 채팅 안읽은 메시지
  },
  alertBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600' as const,
  },
});

export default MyClubsScreenSimple;
