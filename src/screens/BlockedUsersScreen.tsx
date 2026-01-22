/**
 * Blocked Users Screen - Apple Guideline 1.2 Compliance
 *
 * 차단된 사용자 목록을 보여주고 관리하는 화면
 * - 차단된 사용자 목록 표시
 * - 차단 해제 기능
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image, // 🎯 [KIM FIX] For profile photo display
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { BlockedUser, subscribeToBlockedUsers, unblockUser } from '../services/blockService';

// 🎯 [KIM FIX] Navigation type for UserProfile
type RootStackParamList = {
  UserProfile: { userId: string };
};

const BlockedUsersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToBlockedUsers(currentUser.uid, users => {
      setBlockedUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleUnblock = async (blockedUserId: string, blockedUserName: string) => {
    if (!currentUser?.uid) return;

    Alert.alert(
      t('blockedUsers.unblockTitle', 'Unblock User'),
      t('blockedUsers.unblockConfirm', {
        defaultValue: 'Are you sure you want to unblock {{name}}?',
        name: blockedUserName,
      }),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('blockedUsers.unblock', 'Unblock'),
          style: 'destructive',
          onPress: async () => {
            try {
              setUnblocking(blockedUserId);
              await unblockUser(currentUser.uid, blockedUserId);
              // The subscription will automatically update the list
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert(
                t('common.error', 'Error'),
                t('blockedUsers.unblockError', 'Failed to unblock user. Please try again.')
              );
            } finally {
              setUnblocking(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: BlockedUser['blockedAt']) => {
    if (!timestamp) return '';
    const date = 'toDate' in timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // 🎯 [KIM FIX] Navigate to user profile
  const handleNavigateToProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, { backgroundColor: themeColors.colors.surface }]}>
      {/* 🎯 [KIM FIX] Touchable area for navigating to profile */}
      <TouchableOpacity style={styles.userInfo} onPress={() => handleNavigateToProfile(item.id)}>
        {/* 🎯 [KIM FIX] Show profile photo if available */}
        {item.blockedUserPhotoURL ? (
          <Image source={{ uri: item.blockedUserPhotoURL }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: themeColors.colors.primaryContainer }]}>
            <Ionicons name='person' size={24} color={themeColors.colors.primary} />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: themeColors.colors.onSurface }]}>
            {item.blockedUserName}
          </Text>
          <Text style={[styles.blockedDate, { color: themeColors.colors.onSurfaceVariant }]}>
            {t('blockedUsers.blockedOn', {
              defaultValue: 'Blocked on {{date}}',
              date: formatDate(item.blockedAt),
            })}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.unblockButton, { borderColor: themeColors.colors.error }]}
        onPress={() => handleUnblock(item.id, item.blockedUserName)}
        disabled={unblocking === item.id}
      >
        {unblocking === item.id ? (
          <ActivityIndicator size='small' color={themeColors.colors.error} />
        ) : (
          <Text style={[styles.unblockText, { color: themeColors.colors.error }]}>
            {t('blockedUsers.unblock', 'Unblock')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name='checkmark-circle-outline'
        size={64}
        color={themeColors.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyTitle, { color: themeColors.colors.onSurface }]}>
        {t('blockedUsers.noBlockedUsers', 'No Blocked Users')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.colors.onSurfaceVariant }]}>
        {t('blockedUsers.noBlockedUsersDesc', "You haven't blocked any users yet.")}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: themeColors.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title={t('blockedUsers.title', 'Blocked Users')}
          titleStyle={{ color: themeColors.colors.onSurface }}
        />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            blockedUsers.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
        <Ionicons
          name='information-circle-outline'
          size={20}
          color={themeColors.colors.onSurfaceVariant}
        />
        <Text style={[styles.infoText, { color: themeColors.colors.onSurfaceVariant }]}>
          {t(
            'blockedUsers.infoText',
            'Blocked users cannot see your profile, events, or send you messages. You will not see their content either.'
          )}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 🎯 [KIM FIX] Style for profile photo
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockedDate: {
    fontSize: 13,
    marginTop: 2,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default BlockedUsersScreen;
