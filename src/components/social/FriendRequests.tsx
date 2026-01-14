/**
 * Friend Requests Component
 * Displays incoming and outgoing friend requests
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

interface FriendRequestsProps {
  showHeader?: boolean;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({ showHeader = true }) => {
  const { friendRequests, acceptFriendRequest, declineFriendRequest, refreshFriendRequests } =
    useSocial();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const loadRequests = useCallback(async () => {
    try {
      await refreshFriendRequests();
    } catch (_err) {
      console.error('Failed to load friend requests:', _err);
    }
  }, [refreshFriendRequests]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFriendRequests();
    } catch {
      Alert.alert(t('common.error'), t('errors.failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      await acceptFriendRequest(requestId);
      Alert.alert(
        t('common.success'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t as any)('social.friendRequestAccepted', { name: senderName })
      );
    } catch {
      Alert.alert(t('common.error'), t('errors.failedToAcceptRequest'));
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = (requestId: string, senderName: string) => {
    if (processingRequests.has(requestId)) return;

    Alert.alert(
      t('social.declineFriendRequest'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Translation function requires dynamic key with parameters
      (t as any)('social.declineRequestConfirm', { name: senderName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.decline'),
          style: 'destructive',
          onPress: async () => {
            setProcessingRequests(prev => new Set(prev).add(requestId));
            try {
              await declineFriendRequest(requestId);
            } catch {
              Alert.alert(t('common.error'), t('errors.failedToDeclineRequest'));
            } finally {
              setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return t('time.lessThanHour');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (diffHours < 24) return (t as any)('time.hoursAgo', { count: diffHours });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (diffDays < 7) return (t as any)('time.daysAgo', { count: diffDays });

    return date.toLocaleDateString();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderRequestItem = (request: any, index: number) => {
    const senderInfo = request.senderInfo || {};
    const displayName = senderInfo.nickname || senderInfo.displayName || t('common.unknownPlayer');
    const skillLevel = senderInfo.skillLevel || 'intermediate';
    const photoURL = senderInfo.photoURL;
    const message = request.message;
    const isProcessing = processingRequests.has(request.id);

    return (
      <View key={`${request.id}-${index}`} style={styles.requestItem}>
        <View style={styles.requestHeader}>
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name='person' size={24} color='#666' />
              </View>
            )}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <View style={[styles.skillBadge, getSkillLevelColor(skillLevel) as any]}>
              <Text style={styles.skillText}>{getSkillLevelShort(skillLevel)}</Text>
            </View>
          </View>

          <View style={styles.requestInfo}>
            <Text style={styles.senderName}>{displayName}</Text>
            <Text style={styles.skillLevel}>{getSkillLevelName(skillLevel)}</Text>
            <Text style={styles.requestTime}>{formatTimestamp(request.createdAt)}</Text>

            {message && message.trim() && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineRequest(request.id, displayName)}
            disabled={isProcessing}
          >
            <Ionicons name='close' size={20} color={isProcessing ? '#ccc' : '#F44336'} />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: isProcessing ? '#ccc' : '#F44336',
                },
              ]}
            >
              {t('common.decline')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(request.id, displayName)}
            disabled={isProcessing}
          >
            <Ionicons name='checkmark' size={20} color={isProcessing ? '#ccc' : 'white'} />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: isProcessing ? '#ccc' : 'white',
                },
              ]}
            >
              {t('common.accept')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('social.friendRequests')} ({friendRequests.length})
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.requestsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
        showsVerticalScrollIndicator={false}
      >
        {friendRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='person-add' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>{t('social.noFriendRequests')}</Text>
            <Text style={styles.emptyDescription}>{t('social.requestsWillAppearHere')}</Text>
          </View>
        ) : (
          friendRequests.map((request, index) => renderRequestItem(request, index))
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
  requestsList: {
    flex: 1,
  },
  requestItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  requestInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  messageContainer: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  declineButton: {
    backgroundColor: '#ffe6e6',
  },
  acceptButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
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

export default FriendRequests;
