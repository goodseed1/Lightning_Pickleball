/**
 * FeedScreen - 소셜 피드 화면
 * Lightning Pickleball 앱의 메인 소셜 허브
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Chip } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import AIAssistantIcon from '../components/ai/AIAssistantIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../contexts/ActivityContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import {
  getFeedItems,
  listenToFeed,
  deleteFeedItem,
  hideFeedItem,
  getHiddenFeedIds,
  FeedItem,
} from '../services/feedService';
import FeedCard from '../components/feed/FeedCard';
import { NotificationBanner } from '../components/common/NotificationBanner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const FeedScreen = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { unreadTeamInvites, pendingHostedApplicationsCount, pendingFriendInvitationsCount } =
    useActivities();
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Create styles with useMemo for optimization and proper theme access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = useMemo(() => createStyles(themeColors.colors as any), [themeColors.colors]);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 🚧 [KIM] 피드 필터 임시 비활성화
  // const [selectedFilter, setSelectedFilter] = useState('all');
  // 🎯 [KIM FIX] useRef로 변경하여 stale closure 문제 해결
  const unsubscribeRef = useRef<(() => void) | null>(null);
  // 🙈 [KIM] 숨긴 피드 ID 목록 (Firestore 영구 저장)
  const [hiddenFeedIds, setHiddenFeedIds] = useState<string[]>([]);

  // 🎯 [KIM FIX] 왼쪽 스와이프로 탐색 화면 이동
  const SWIPE_THRESHOLD = Dimensions.get('window').width * 0.25; // 화면 너비의 25%
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // 수평 스와이프만 감지 (왼쪽으로 밀기)
          const { dx, dy } = gestureState;
          return Math.abs(dx) > Math.abs(dy) && dx < -20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx } = gestureState;
          // 왼쪽으로 충분히 스와이프했을 때 탐색 화면으로 이동
          if (dx < -SWIPE_THRESHOLD) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate('Discover');
          }
        },
      }),
    [navigation, SWIPE_THRESHOLD]
  );

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      // 🎯 [KIM FIX] 필터 변경 시 기존 리스너 정리 후 새로 설정
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (currentUser?.uid) {
        loadHiddenFeedIds(); // 🙈 숨긴 피드 ID 먼저 로드
        loadFeedData();
        setupRealtimeListener();
      }

      return () => {
        // 🎯 [KIM FIX] ref를 사용하여 stale closure 방지
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.uid]) // 🚧 [KIM] 필터 비활성화로 selectedFilter 제거
  );

  /**
   * 🙈 숨긴 피드 ID 목록 로드
   */
  const loadHiddenFeedIds = async () => {
    if (!currentUser?.uid) return;
    try {
      const ids = await getHiddenFeedIds(currentUser.uid);
      setHiddenFeedIds(ids);
    } catch (error) {
      console.error('Error loading hidden feed IDs:', error);
    }
  };

  /**
   * 피드 데이터 로드
   */
  const loadFeedData = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 🎯 [KIM FIX] 스마트 필터 - 카테고리별 타입 배열로 필터링
      // 🚧 [KIM] 필터 비활성화 - 전체 피드 표시
      const filterOptions = {
        limit: 50,
        types: undefined, // 필터 없음 - 전체 표시
      };

      const items = await getFeedItems(currentUser.uid, filterOptions);

      // 🔔 Private feed types that don't require actorName (user-specific notifications)
      const privateFeedTypes = [
        'club_join_request_rejected',
        'club_member_removed',
        'club_deleted',
        'application_approved', // 🎯 [KIM FIX] 팀 신청 승인 알림
        'application_rejected', // 🎯 [KIM FIX] 팀 신청 거절 알림
        'application_auto_rejected', // 🎯 [KIM FIX] 다른 팀 승인으로 자동 마감 알림
        'guest_team_approved', // 🎯 [KIM FIX] 호스트 파트너에게 게스트 팀 승인 알림
        'admin_feedback_received', // 📬 [KIM] 관리자에게 사용자 피드백 알림
        'feedback_response_received', // 📬 [KIM] 사용자에게 관리자 답변 알림
      ];

      // 유효한 피드 아이템만 필터링 + 숨긴 피드 제외
      const validItems = items.filter(item => {
        if (!item || !item.id || !item.type) return false;
        if (!(item.timestamp || item.createdAt)) return false;
        if (hiddenFeedIds.includes(item.id)) return false; // 🙈 숨긴 피드 제외

        // 🔔 Private feed types는 actorName 없어도 허용
        if (privateFeedTypes.includes(item.type)) return true;

        // 그 외 피드는 actorName 필수
        return !!item.actorName;
      });
      setFeedItems(validItems);

      console.log(
        `📰 Loaded ${validItems.length} valid feed items (${items.length - validItems.length} invalid items filtered out)`
      );
    } catch (error) {
      console.error('Error loading feed:', error);
      Alert.alert(t('common.error'), t('feed.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 실시간 피드 리스너 설정
   */
  const setupRealtimeListener = () => {
    if (!currentUser?.uid) return;

    try {
      // 🎯 [KIM FIX] 스마트 필터 - 카테고리별 타입 배열로 필터링
      // 🚧 [KIM] 필터 비활성화 - 전체 피드 표시
      const filterOptions = {
        limit: 50,
        types: undefined, // 필터 없음 - 전체 표시
      };

      // 🔔 Private feed types that don't require actorName (user-specific notifications)
      const privateFeedTypes = [
        'club_join_request_rejected',
        'club_member_removed',
        'club_deleted',
        'application_approved', // 🎯 [KIM FIX] 팀 신청 승인 알림
        'application_rejected', // 🎯 [KIM FIX] 팀 신청 거절 알림
        'application_auto_rejected', // 🎯 [KIM FIX] 다른 팀 승인으로 자동 마감 알림
        'guest_team_approved', // 🎯 [KIM FIX] 호스트 파트너에게 게스트 팀 승인 알림
        'admin_feedback_received', // 📬 [KIM] 관리자에게 사용자 피드백 알림
        'feedback_response_received', // 📬 [KIM] 사용자에게 관리자 답변 알림
      ];

      const unsubscribeFunc = listenToFeed(
        currentUser.uid,
        updatedItems => {
          console.log(
            `📡 Real-time feed update: ${updatedItems.length} items received` // 🚧 [KIM] 필터 로그 제거
          );

          // 유효한 피드 아이템만 필터링 + 숨긴 피드 제외
          const validItems = updatedItems.filter(item => {
            if (!item || !item.id || !item.type) return false;
            if (!(item.timestamp || item.createdAt)) return false;
            if (hiddenFeedIds.includes(item.id)) return false; // 🙈 숨긴 피드 제외

            // 🔔 Private feed types는 actorName 없어도 허용
            if (privateFeedTypes.includes(item.type)) return true;

            // 그 외 피드는 actorName 필수
            return !!item.actorName;
          });
          console.log(
            `📡 Using ${validItems.length} valid items (${updatedItems.length - validItems.length} invalid filtered out)`
          );

          setFeedItems(validItems);
          setLoading(false);
        },
        filterOptions
      );

      // 🎯 [KIM FIX] ref에 저장하여 cleanup 시 최신 참조 사용
      unsubscribeRef.current = unsubscribeFunc;
    } catch (error) {
      console.error('Error setting up feed listener:', error);
    }
  };

  /**
   * 새로고침
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedData();
    setRefreshing(false);
  };

  /**
   * 사용자 프로필 클릭 핸들러
   */
  const handleUserPress = (userId: string, userName: string) => {
    if (userId === currentUser?.uid) {
      // 🎯 [KIM FIX] 본인인 경우 내 프로필 화면으로 이동
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('MyProfile');
    } else {
      // 다른 사용자인 경우 프로필 화면으로 이동
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('UserProfile', {
        userId: userId,
        nickname: userName,
      });
    }
  };

  /**
   * 클럽 클릭 핸들러
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClubPress = (clubId: string, clubName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('ClubDetail', { clubId: clubId });
  };

  /**
   * 피드 아이템 삭제 핸들러
   */
  const handleDeleteFeed = (feedItemId: string) => {
    Alert.alert(t('feed.actions.deleteConfirmTitle'), t('feed.actions.deleteConfirmMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            if (!currentUser?.uid) {
              console.error('No current user found');
              return;
            }
            await deleteFeedItem(feedItemId, currentUser.uid);
            // 로컬 상태에서 제거
            setFeedItems(prev => prev.filter(item => item.id !== feedItemId));
          } catch (error) {
            console.error('Error deleting feed:', error);
            Alert.alert(t('common.error'), t('feed.errors.deleteFailed'));
          }
        },
      },
    ]);
  };

  /**
   * 🙈 피드 숨기기 핸들러 (Firestore 영구 저장)
   */
  const handleHideFeed = (feedId: string) => {
    Alert.alert(t('feed.actions.hideTitle'), t('feed.actions.hideMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('feed.actions.hide'),
        onPress: async () => {
          try {
            if (!currentUser?.uid) {
              console.error('No current user found');
              return;
            }

            // Firestore에 저장
            await hideFeedItem(currentUser.uid, feedId);

            // 로컬 상태 업데이트
            setHiddenFeedIds(prev => [...prev, feedId]);
            setFeedItems(prev => prev.filter(item => item.id !== feedId));
          } catch (error) {
            console.error('Error hiding feed:', error);
            Alert.alert(t('common.error'), t('feed.errors.hideFailed'));
          }
        },
      },
    ]);
  };

  /**
   * 📬 [KIM] 피드 아이템 클릭 핸들러 - 네비게이션 처리
   */
  const handleFeedPress = (item: FeedItem) => {
    // 피드 메타데이터의 navigationTarget에 따라 네비게이션
    const navigationTarget = item.metadata?.navigationTarget;

    if (navigationTarget === 'AdminDashboard') {
      // 관리자 피드백 → Admin Dashboard > User Feedback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('AdminDashboard', {
        screen: (item.metadata?.navigationParams as { screen?: string })?.screen || 'UserFeedback',
        feedbackId: item.metadata?.feedbackId,
      });
    } else if (navigationTarget === 'AiChatbot' || navigationTarget === 'ChatScreen') {
      // 사용자 피드백 답변 → AI 챗봇
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('ChatScreen', {
        feedbackId: item.metadata?.feedbackId,
        showResponse: (item.metadata?.navigationParams as { showResponse?: boolean })?.showResponse,
      });
    } else {
      // 기본 네비게이션: 피드 타입별 처리
      switch (item.type) {
        case 'admin_feedback_received':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate('AdminDashboard', {
            screen: 'UserFeedback',
            feedbackId: item.metadata?.feedbackId,
          });
          break;
        case 'feedback_response_received':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (navigation as any).navigate('ChatScreen', {
            feedbackId: item.metadata?.feedbackId,
          });
          break;
        default:
          // 기타 피드 타입은 네비게이션 없음 (현재)
          console.log(`📰 Feed pressed: ${item.type}`, item.metadata);
          break;
      }
    }
  };

  /**
   * 🎯 [KIM FIX] 스마트 필터 - 카테고리별 타입 매핑 (필터링용)
   * 🚧 [KIM] 피드 콘텐츠가 다양해질 때까지 임시 비활성화
   */
  // const categoryToTypes: Record<string, string[]> = {
  //   notifications: [
  //     'application_approved',
  //     'application_rejected',
  //     'application_auto_rejected',
  //     'guest_team_approved',
  //     'club_join_request_rejected',
  //     'club_member_removed',
  //     'club_deleted',
  //   ],
  //   partner_invites: ['partner_invitation', 'team_invitation'],
  //   club_activity: ['club_event', 'new_member', 'club_announcement', 'club_notification'],
  //   match_results: ['match_result'],
  //   achievements: ['league_winner', 'tournament_winner'],
  // };

  /**
   * 🎯 [KIM FIX] 선택된 필터에 해당하는 타입 배열 반환
   * 🚧 [KIM] 피드 콘텐츠가 다양해질 때까지 임시 비활성화
   */
  // const getFilterTypes = useCallback((filter: string): string[] | undefined => {
  //   if (filter === 'all') return undefined;
  //   return categoryToTypes[filter];
  // }, []);

  /**
   * 🎯 [KIM FIX] 스마트 필터 - 피드 타입을 카테고리로 그룹화
   * 🚧 [KIM] 피드 콘텐츠가 다양해질 때까지 임시 비활성화
   */
  // const feedTypeToCategory: Record<string, string> = {
  //   // 알림 카테고리
  //   application_approved: 'notifications',
  //   application_rejected: 'notifications',
  //   application_auto_rejected: 'notifications',
  //   guest_team_approved: 'notifications',
  //   club_join_request_rejected: 'notifications',
  //   club_member_removed: 'notifications',
  //   club_deleted: 'notifications',
  //   // 파트너 초대 카테고리
  //   partner_invitation: 'partner_invites',
  //   team_invitation: 'partner_invites',
  //   // 클럽 활동 카테고리
  //   club_event: 'club_activity',
  //   new_member: 'club_activity',
  //   club_announcement: 'club_activity',
  //   club_notification: 'club_activity',
  //   // 경기 결과 카테고리
  //   match_result: 'match_results',
  //   // 리그/토너먼트 카테고리
  //   league_winner: 'achievements',
  //   tournament_winner: 'achievements',
  // };

  /**
   * 🎯 [KIM FIX] 스마트 필터 - 실제 피드에 있는 카테고리만 추출
   * 🚧 [KIM] 피드 콘텐츠가 다양해질 때까지 임시 비활성화
   */
  // const availableCategories = useMemo(() => {
  //   const categories = new Set<string>();
  //   feedItems.forEach(item => {
  //     const category = feedTypeToCategory[item.type];
  //     if (category) {
  //       categories.add(category);
  //     }
  //   });
  //   return categories;
  // }, [feedItems]);

  /**
   * 🎯 [KIM FIX] 스마트 필터 - 카테고리 정의
   * 🚧 [KIM] 피드 콘텐츠가 다양해질 때까지 임시 비활성화
   */
  // const allFilterCategories = [
  //   { key: 'all', label: t('feed.filters.all'), types: [] as string[] },
  //   {
  //     key: 'notifications',
  //     label: t('feed.filters.notifications'),
  //     types: [
  //       'application_approved',
  //       'application_rejected',
  //       'application_auto_rejected',
  //       'guest_team_approved',
  //       'club_join_request_rejected',
  //       'club_member_removed',
  //       'club_deleted',
  //     ],
  //   },
  //   {
  //     key: 'partner_invites',
  //     label: t('feed.filters.partnerInvites'),
  //     types: ['partner_invitation', 'team_invitation'],
  //   },
  //   {
  //     key: 'club_activity',
  //     label: t('feed.filters.clubActivity'),
  //     types: ['club_event', 'new_member', 'club_announcement', 'club_notification'],
  //   },
  //   {
  //     key: 'match_results',
  //     label: t('feed.filters.matchResults'),
  //     types: ['match_result'],
  //   },
  //   {
  //     key: 'achievements',
  //     label: t('feed.filters.achievements'),
  //     types: ['league_winner', 'tournament_winner'],
  //   },
  // ];

  /**
   * 필터 칩 렌더링 - 🎯 스마트 필터: 실제 데이터가 있는 필터만 표시
   * 🚧 [KIM] 피드 콘텐츠가 다양해질 때까지 임시 비활성화
   */
  // const renderFilterChips = () => {
  //   // 🎯 [KIM FIX] "전체" + 실제 피드에 있는 카테고리만 표시
  //   const visibleFilters = allFilterCategories.filter(
  //     filter => filter.key === 'all' || availableCategories.has(filter.key)
  //   );

  //   // 필터가 "전체"만 있으면 필터 UI 자체를 숨김
  //   if (visibleFilters.length <= 1) {
  //     return null;
  //   }

  //   return (
  //     <View style={styles.filterContainer}>
  //       <FlatList
  //         horizontal
  //         data={visibleFilters}
  //         keyExtractor={item => item.key}
  //         showsHorizontalScrollIndicator={false}
  //         contentContainerStyle={styles.filterContent}
  //         renderItem={({ item }: { item: { key: string; label: string; types: string[] } }) => (
  //           <TouchableOpacity
  //             style={[styles.filterChip, selectedFilter === item.key && styles.activeFilterChip]}
  //             onPress={() => setSelectedFilter(item.key)}
  //           >
  //             <Text
  //               style={[styles.filterText, selectedFilter === item.key && styles.activeFilterText]}
  //             >
  //               {item.label}
  //             </Text>
  //           </TouchableOpacity>
  //         )}
  //       />
  //     </View>
  //   );
  // };

  /**
   * 피드 아이템 렌더링
   */
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    // 방어적 코딩: item이 유효하지 않으면 null 반환
    if (!item || !item.id) {
      console.warn('FeedScreen: Invalid feed item:', item);
      return null;
    }

    return (
      <FeedCard
        item={item}
        currentUserId={currentUser?.uid}
        onUserPress={handleUserPress}
        onClubPress={handleClubPress}
        onDelete={handleDeleteFeed}
        onHide={handleHideFeed}
        onPress={() => handleFeedPress(item)}
      />
    );
  };

  /**
   * 빈 상태 렌더링 - 신규 사용자 온보딩 가이드
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {/* 🎯 [KIM FIX] 클럽 홈과 유사한 Empty State 카드 */}
      <View style={styles.emptyGuideCard}>
        <Text style={styles.emptyIcon}>🎾</Text>
        <Text style={styles.emptyTitle}>{t('feed.empty.title')}</Text>
        <Text style={styles.emptyDescription}>{t('feed.empty.description')}</Text>

        {/* 가이드 아이템들 */}
        <View style={styles.emptyGuideItems}>
          <TouchableOpacity
            style={styles.emptyGuideItem}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => (navigation as any).navigate('Discover')}
            activeOpacity={0.7}
          >
            <Ionicons name='search-outline' size={20} color={themeColors.colors.primary} />
            <Text style={styles.emptyGuideItemText}>{t('feed.empty.guides.findEvents')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emptyGuideItem}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => (navigation as any).navigate('MyClubs')}
            activeOpacity={0.7}
          >
            <Ionicons name='people-outline' size={20} color={themeColors.colors.primary} />
            <Text style={styles.emptyGuideItemText}>{t('feed.empty.guides.joinClub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emptyGuideItem}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => (navigation as any).navigate('Discover', { initialTab: 'players' })}
            activeOpacity={0.7}
          >
            <Ionicons name='person-add-outline' size={20} color={themeColors.colors.primary} />
            <Text style={styles.emptyGuideItemText}>{t('feed.empty.guides.findPlayers')}</Text>
          </TouchableOpacity>
        </View>

        {/* AI 도우미 섹션 */}
        <View style={styles.emptyDivider} />
        <Text style={styles.emptyHelperText}>{t('feed.empty.aiHelper.question')}</Text>
        <TouchableOpacity
          style={styles.aiHelperButton}
          onPress={() => navigation.navigate('ChatScreen' as never)}
          activeOpacity={0.8}
        >
          <AIAssistantIcon size='small' color='#FFFFFF' />
          <Text style={styles.aiHelperButtonText}>{t('feed.empty.aiHelper.buttonText')}</Text>
        </TouchableOpacity>
        <Text style={styles.aiHelperSubtext}>{t('feed.empty.aiHelper.subtext')}</Text>
      </View>
    </View>
  );

  /**
   * 로딩 상태 렌더링
   */
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>🏠 {t('feed.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('feed.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} {...panResponder.panHandlers}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🏠 {t('feed.title')}</Text>
        <Text style={styles.subtitle}>{t('feed.subtitle')}</Text>
      </View>

      {/* 🎯 [KIM] 필터 칩들 - 피드 내용이 다양해질 때까지 임시 비활성화 */}
      {/* {renderFilterChips()} */}

      {/* 🦾 IRON MAN: Team Invitation Notification Banner */}
      {unreadTeamInvites.length > 0 && (
        <NotificationBanner
          message={t('feed.notifications.teamInvites', { count: unreadTeamInvites.length })}
          destination={{
            screen: 'MyClubs',
            params: {},
          }}
          icon='people'
          variant='info'
        />
      )}

      {/* 🎯 [KIM FIX] Pending Applications Notification Banner for Hosts */}
      {pendingHostedApplicationsCount > 0 && (
        <NotificationBanner
          message={t('feed.notifications.pendingApplications', {
            count: pendingHostedApplicationsCount,
          })}
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

      {/* 🎾 [KIM FIX] Match Invitation Notification Banner */}
      {pendingFriendInvitationsCount > 0 && (
        <NotificationBanner
          message={t('feed.notifications.matchInvites', {
            count: pendingFriendInvitationsCount,
          })}
          destination={{
            screen: 'MyProfile',
            params: {
              initialTab: 'activity',
              initialActivityTab: 'applied',
            },
          }}
          icon='checkmark-circle'
          variant='success'
        />
      )}

      {/* 피드 목록 */}
      <FlatList
        data={feedItems || []}
        renderItem={renderFeedItem}
        keyExtractor={(item, index) => item?.id || `feed-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: Record<string, string | undefined>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background as string,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    subtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    filterContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    filterContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.outline,
      marginRight: 8,
    },
    activeFilterChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    activeFilterText: {
      color: colors.onPrimary,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    listContainer: {
      paddingTop: 8,
      paddingBottom: 100, // 탭바 높이 + 여유 공간
      flexGrow: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 80,
    },
    emptyIcon: {
      fontSize: 60,
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    // 🎯 [KIM FIX] 신규 사용자 온보딩 가이드 스타일
    emptyGuideCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.outline,
      padding: 24,
      width: '100%',
      alignItems: 'center',
    },
    emptyGuideItems: {
      width: '100%',
      gap: 8,
    },
    emptyGuideItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 14,
      gap: 12,
    },
    emptyGuideItemText: {
      fontSize: 15,
      color: colors.onSurface,
      fontWeight: '500',
    },
    emptyDivider: {
      width: '100%',
      height: 1,
      backgroundColor: colors.outline,
      marginVertical: 20,
    },
    emptyHelperText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
      textAlign: 'center',
    },
    aiHelperButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 24,
      gap: 8,
      width: '100%',
    },
    aiHelperButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    aiHelperSubtext: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default FeedScreen;
