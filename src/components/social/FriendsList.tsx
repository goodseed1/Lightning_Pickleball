/**
 * Friends List Component
 * Displays user's friends with management options
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../contexts/SocialContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface FriendsListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFriendPress?: (friendId: string, friendInfo: any) => void;
  showActions?: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({ onFriendPress, showActions = true }) => {
  const { friends, refreshFriends, removeFriend } = useSocial();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      await refreshFriends();
    } catch (_err) {
      console.error('Failed to load friends:', _err);
    }
  }, [refreshFriends]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFriends();
    } catch {
      Alert.alert(t('common.error'), t('errors.failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(t('social.removeFriend'), t('social.removeFriendConfirm', { name: friendName }), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(friendId);
            Alert.alert(t('common.success'), t('social.friendRemoved'));
          } catch {
            Alert.alert(t('common.error'), t('errors.failedToRemoveFriend'));
          }
        },
      },
    ]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderFriendItem = (friend: any, index: number) => {
    const userInfo = friend.userInfo || {};
    const displayName = userInfo.nickname || userInfo.displayName || t('common.unknownPlayer');
    const skillLevel = userInfo.skillLevel || 'intermediate';
    const photoURL = userInfo.photoURL;
    const friendsSince = friend.createdAt;

    return (
      <TouchableOpacity
        key={`${friend.userId}-${index}`}
        style={styles.friendItem}
        onPress={() => onFriendPress?.(friend.userId, userInfo)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name='person' size={24} color='#666' />
              </View>
            )}
            <View style={[styles.skillBadge, getSkillLevelColor(skillLevel)]}>
              <Text style={styles.skillText}>{getSkillLevelShort(skillLevel)}</Text>
            </View>
          </View>

          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{displayName}</Text>
            <Text style={styles.skillLevel}>{getSkillLevelName(skillLevel)}</Text>
            {friendsSince && (
              <Text style={styles.friendsSince}>
                {t('social.friendsSince')} {formatDate(friendsSince)}
              </Text>
            )}
          </View>
        </View>

        {showActions && (
          <View style={styles.friendActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                /* Navigate to chat */
              }}
            >
              <Ionicons name='chatbubble' size={20} color='#2196F3' />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemoveFriend(friend.userId, displayName)}
            >
              <Ionicons name='person-remove' size={20} color='#F44336' />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, unknown> = {
      beginner: { backgroundColor: '#4CAF50' },
      intermediate: { backgroundColor: '#FF9800' },
      advanced: { backgroundColor: '#2196F3' },
      expert: { backgroundColor: '#9C27B0' },
    };
    return colors[level] || colors.intermediate;
  };

  const getSkillLevelShort = (level: string) => {
    const shorts: Record<string, string> = {
      beginner: 'B',
      intermediate: 'I',
      advanced: 'A',
      expert: 'E',
    };
    return shorts[level] || 'I';
  };

  const getSkillLevelName = (level: string) => {
    return t(`profile.skillLevel.${level}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color='#F44336' />
        <Text style={styles.errorText}>{t('errors.failedToLoadFriends')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFriends}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.friendsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
        showsVerticalScrollIndicator={false}
      >
        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='people' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>{t('social.noFriendsYet')}</Text>
            <Text style={styles.emptyDescription}>{t('social.findPlayersToConnect')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {t('social.friends')} ({friends.length})
              </Text>
            </View>
            {friends.map((friend, index) => renderFriendItem(friend, index))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  skillText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendsSince: {
    fontSize: 12,
    color: '#999',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FriendsList;
