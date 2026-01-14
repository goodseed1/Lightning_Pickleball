import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { Friend, FriendRequest, FriendSearchResult } from '../../types/friendship';
import friendshipService from '../../services/friendshipService';
import { convertEloToLtr } from '../../utils/ltrUtils';
// 🔧 [TS-FIX] Local type definition to avoid import errors
type RootStackParamList = {
  UserProfile: { userId: string };
  [key: string]: object | undefined;
};

type FriendsTabType = 'friends' | 'requests' | 'search';

interface FriendsScreenProps {
  currentUserId: string; // MyProfileScreen에서 전달받을 현재 사용자 ID
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ currentUserId }) => {
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  // 🔧 [TS-FIX] Cast colors to Record<string, string> to avoid type error
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles = createStyles(themeColors.colors as any as Record<string, string>);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🤝 [FRIENDSHIP] 사용자 프로필 보기
  const handleViewProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  // 탭 상태
  const [activeTab, setActiveTab] = useState<FriendsTabType>('friends');

  // 데이터 상태
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);

  // UI 상태
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // 실시간 구독
  useEffect(() => {
    if (!currentUserId) return;

    // 친구 목록 구독
    const unsubscribeFriends = friendshipService.subscribeToFriends(
      currentUserId,
      updatedFriends => {
        setFriends(updatedFriends);
      }
    );

    // 친구 요청 목록 구독
    const unsubscribeRequests = friendshipService.subscribeToFriendRequests(
      currentUserId,
      updatedRequests => {
        setFriendRequests(updatedRequests);
      }
    );

    // 클린업
    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [currentUserId]);

  // 사용자 검색
  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await friendshipService.searchUsers(term, currentUserId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert(t('friends.alerts.searchError.title'), t('friends.alerts.searchError.message'));
    } finally {
      setSearchLoading(false);
    }
  };

  // 친구 요청 보내기
  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      const result = await friendshipService.sendFriendRequest(targetUserId);

      if (result.autoAccepted) {
        // 🎉 자동 수락됨 - 상대방이 이미 친구 요청을 보낸 상태였음
        Alert.alert(
          t('friends.alerts.autoAccepted.title'),
          t('friends.alerts.autoAccepted.message')
        );
        // 검색 결과에서 친구로 업데이트
        setSearchResults(prev =>
          prev.map(user =>
            user.id === targetUserId ? { ...user, isFriend: true, hasPendingRequest: false } : user
          )
        );
      } else {
        Alert.alert(t('friends.alerts.requestSent.title'), t('friends.alerts.requestSent.message'));
        // 검색 결과 업데이트
        setSearchResults(prev =>
          prev.map(user => (user.id === targetUserId ? { ...user, hasPendingRequest: true } : user))
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('friends.alerts.requestSendError.message');
      Alert.alert(t('friends.alerts.requestSendError.title'), errorMessage);
    }
  };

  // 친구 요청 수락
  const handleAcceptRequest = async (requesterId: string) => {
    try {
      await friendshipService.acceptFriendRequest(requesterId);
      Alert.alert(
        t('friends.alerts.requestAccepted.title'),
        t('friends.alerts.requestAccepted.message')
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('friends.alerts.requestAcceptError.message');
      Alert.alert(t('friends.alerts.requestAcceptError.title'), errorMessage);
    }
  };

  // 친구 요청 거절
  const handleDeclineRequest = async (requesterId: string) => {
    Alert.alert(
      t('friends.alerts.declineConfirm.title'),
      t('friends.alerts.declineConfirm.message'),
      [
        { text: t('friends.actions.cancel'), style: 'cancel' },
        {
          text: t('friends.actions.decline'),
          onPress: async () => {
            try {
              await friendshipService.declineFriendRequest(requesterId);
            } catch (error: unknown) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : t('friends.alerts.requestDeclineError.message');
              Alert.alert(t('friends.alerts.requestDeclineError.title'), errorMessage);
            }
          },
        },
      ]
    );
  };

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    // 실시간 구독으로 자동 업데이트되므로 딜레이만 추가
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // 탭 렌더링
  const renderTabs = () => {
    const tabs = [
      {
        key: 'friends' as FriendsTabType,
        label: t('friends.tabs.myFriends'),
        icon: 'people-outline',
      },
      {
        key: 'requests' as FriendsTabType,
        label: t('friends.tabs.requests'),
        icon: 'mail-outline',
      },
      {
        key: 'search' as FriendsTabType,
        label: t('friends.tabs.findFriends'),
        icon: 'search-outline',
      },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={
                activeTab === tab.key
                  ? themeColors.colors.primary
                  : themeColors.colors.onSurfaceVariant
              }
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.key === 'requests' && friendRequests.length > 0
                ? `${tab.label}(${friendRequests.length})`
                : tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 친구 목록 렌더링
  const renderFriendsList = () => {
    if (friends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name='people-outline' size={60} color={themeColors.colors.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>{t('friends.emptyStates.noFriends.title')}</Text>
          <Text style={styles.emptyDescription}>
            {t('friends.emptyStates.noFriends.description')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {friends.map(friend => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendItem}
            onPress={() => handleViewProfile(friend.userId)}
          >
            <View style={styles.friendAvatar}>
              {friend.profileImage ? (
                <Image source={{ uri: friend.profileImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name='person' size={30} color={themeColors.colors.onSurfaceVariant} />
              )}
              {friend.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              {/* 🎾 LTR Display - Use ELO-based calculation for consistency */}
              {friend.singlesElo && (
                <Text style={styles.friendSkill}>LTR {convertEloToLtr(friend.singlesElo)}</Text>
              )}
              {/* 🎯 [KIM FIX] Privacy: Only show city, never expose street address */}
              {friend.location &&
                typeof friend.location === 'object' &&
                (friend.location as { city?: string }).city && (
                  <Text style={styles.friendLocation}>
                    📍 {(friend.location as { city?: string }).city}
                  </Text>
                )}
            </View>

            <TouchableOpacity style={styles.chatButton}>
              <Ionicons name='chatbubble-outline' size={20} color={themeColors.colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // 친구 요청 목록 렌더링
  const renderRequestsList = () => {
    if (friendRequests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name='mail-outline' size={60} color={themeColors.colors.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>{t('friends.emptyStates.noRequests.title')}</Text>
          <Text style={styles.emptyDescription}>
            {t('friends.emptyStates.noRequests.description')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {friendRequests.map(request => (
          <View key={request.id} style={styles.requestItem}>
            {/* 🤝 [FRIENDSHIP] 프로필 이미지 - 터치하면 프로필 보기 */}
            <TouchableOpacity
              style={styles.friendAvatar}
              onPress={() => handleViewProfile(request.requesterId)}
            >
              {request.requesterProfileImage ? (
                <Image source={{ uri: request.requesterProfileImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name='person' size={30} color={themeColors.colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>

            {/* 🤝 [FRIENDSHIP] 사용자 정보 - 터치하면 프로필 보기 */}
            <TouchableOpacity
              style={styles.friendInfo}
              onPress={() => handleViewProfile(request.requesterId)}
            >
              <Text style={styles.friendName}>{request.requesterName}</Text>
              {/* 🎾 LTR Display - Use ELO-based calculation for consistency */}
              {request.requesterSinglesElo && (
                <Text style={styles.friendSkill}>
                  LTR {convertEloToLtr(request.requesterSinglesElo)}
                </Text>
              )}
              <Text style={styles.requestTime}>
                {request.createdAt.toLocaleDateString(t('common.locale'))}
              </Text>
            </TouchableOpacity>

            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(request.requesterId)}
              >
                <Text style={styles.acceptButtonText}>{t('friends.actions.accept')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleDeclineRequest(request.requesterId)}
              >
                <Text style={styles.declineButtonText}>{t('friends.actions.decline')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // 친구 검색 렌더링
  const renderFriendSearch = () => {
    return (
      <View style={styles.content}>
        {/* 검색 입력 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name='search-outline' size={20} color={themeColors.colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('friends.search.placeholder')}
              value={searchTerm}
              onChangeText={handleSearch}
              autoCapitalize='none'
              returnKeyType='search'
            />
            {searchLoading && <ActivityIndicator size='small' color={themeColors.colors.primary} />}
          </View>
        </View>

        {/* 검색 결과 */}
        <ScrollView style={styles.searchResults}>
          {searchResults.length === 0 && searchTerm ? (
            <View style={styles.emptyState}>
              <Ionicons
                name='search-outline'
                size={60}
                color={themeColors.colors.onSurfaceVariant}
              />
              <Text style={styles.emptyTitle}>
                {t('friends.emptyStates.noSearchResults.title')}
              </Text>
              <Text style={styles.emptyDescription}>
                {t('friends.emptyStates.noSearchResults.description')}
              </Text>
            </View>
          ) : (
            searchResults.map(user => (
              <View key={user.id} style={styles.searchResultItem}>
                {/* 🤝 [FRIENDSHIP] 프로필 이미지 - 터치하면 프로필 보기 */}
                <TouchableOpacity
                  style={styles.friendAvatar}
                  onPress={() => handleViewProfile(user.id)}
                >
                  {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name='person' size={30} color={themeColors.colors.onSurfaceVariant} />
                  )}
                </TouchableOpacity>

                {/* 🤝 [FRIENDSHIP] 사용자 정보 - 터치하면 프로필 보기 */}
                <TouchableOpacity
                  style={styles.friendInfo}
                  onPress={() => handleViewProfile(user.id)}
                >
                  <Text style={styles.friendName}>{user.nickname}</Text>
                  {/* 🎾 LTR Display - Use ELO-based calculation for consistency */}
                  {user.singlesElo && (
                    <Text style={styles.friendSkill}>LTR {convertEloToLtr(user.singlesElo)}</Text>
                  )}
                  {/* 🎯 [KIM FIX] Privacy: Only show city, never expose street address */}
                  {user.location &&
                    typeof user.location === 'object' &&
                    (user.location as { city?: string }).city && (
                      <Text style={styles.friendLocation}>
                        📍 {(user.location as { city?: string }).city}
                      </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.searchActions}>
                  {user.isFriend ? (
                    <View style={styles.friendStatus}>
                      <Text style={styles.friendStatusText}>{t('friends.status.friend')}</Text>
                    </View>
                  ) : user.hasPendingRequest ? (
                    <View style={styles.pendingStatus}>
                      <Text style={styles.pendingStatusText}>{t('friends.status.pending')}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addFriendButton}
                      onPress={() => handleSendFriendRequest(user.id)}
                    >
                      <Text style={styles.addFriendButtonText}>
                        {t('friends.actions.addFriend')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  // 탭별 콘텐츠 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'friends':
        return renderFriendsList();
      case 'requests':
        return renderRequestsList();
      case 'search':
        return renderFriendSearch();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderTabs()}
      {renderContent()}
    </SafeAreaView>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    tab: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: 12,
      position: 'relative',
    },
    activeTab: {
      backgroundColor: colors.surfaceVariant,
    },
    tabText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 100,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 20,
      marginBottom: 10,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    requestItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    friendAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      position: 'relative',
    },
    avatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    friendSkill: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    friendLocation: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      opacity: 0.7,
    },
    requestTime: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      opacity: 0.7,
    },
    chatButton: {
      padding: 8,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    acceptButtonText: {
      color: colors.onSuccess || '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    declineButton: {
      backgroundColor: colors.error,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    declineButtonText: {
      color: colors.onError || '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    searchContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      marginLeft: 12,
    },
    searchResults: {
      flex: 1,
    },
    searchActions: {
      alignItems: 'flex-end',
    },
    addFriendButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addFriendButtonText: {
      color: colors.onPrimary || '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    friendStatus: {
      backgroundColor: colors.success,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    friendStatusText: {
      color: colors.onSuccess || '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    pendingStatus: {
      backgroundColor: colors.warning,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    pendingStatusText: {
      color: colors.onWarning || '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default FriendsScreen;
