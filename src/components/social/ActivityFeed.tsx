/**
 * Integrated Activity Feed Component
 * Shows friend activities and club updates in unified timeline
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../../contexts/SocialContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ActivityFeedProps {
  maxItems?: number;
  showHeader?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ maxItems = 20, showHeader = true }) => {
  const { activityFeed, refreshActivityFeed } = useSocial();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      await refreshActivityFeed();
    } catch (err) {
      console.error('Failed to load activity feed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [refreshActivityFeed]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshActivityFeed();
    } catch {
      Alert.alert(t('common.error'), t('errors.failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      new_member: 'person-add',
      new_event: 'calendar',
      friend_activity: 'people',
      club_update: 'megaphone',
      match_result: 'trophy',
    };
    return iconMap[type] || 'information-circle';
  };

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      new_member: '#4CAF50',
      new_event: '#2196F3',
      friend_activity: '#FF9800',
      club_update: '#9C27B0',
      match_result: '#F44336',
    };
    return colorMap[type] || '#666666';
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return t('time.justNow');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (diffMinutes < 60) return (t as any)('time.minutesAgo', { count: diffMinutes });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (diffHours < 24) return (t as any)('time.hoursAgo', { count: diffHours });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (diffDays < 7) return (t as any)('time.daysAgo', { count: diffDays });

    return date.toLocaleDateString();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActivityItem = (item: any, index: number) => {
    return (
      <TouchableOpacity
        key={`${item.id}-${index}`}
        style={styles.activityItem}
        onPress={() => handleActivityTap(item)}
      >
        <View style={styles.activityHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getActivityColor(item.type) }]}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Ionicons name={getActivityIcon(item.type) as any} size={18} color='white' />
          </View>

          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityDescription}>{item.description}</Text>
            <Text style={styles.activityTime}>{formatTimestamp(item.timestamp)}</Text>
          </View>

          <Ionicons name='chevron-forward' size={16} color='#666' />
        </View>
      </TouchableOpacity>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleActivityTap = (item: any) => {
    // Handle navigation based on activity type
    switch (item.type) {
      case 'new_member':
      case 'club_update':
        if (item.clubId) {
          // Navigate to club detail
          console.log('Navigate to club:', item.clubId);
        }
        break;
      case 'friend_activity':
        if (item.metadata?.friendId) {
          // Navigate to friend profile
          console.log('Navigate to friend:', item.metadata.friendId);
        }
        break;
      case 'match_result':
        if (item.metadata?.matchId) {
          // Navigate to match details
          console.log('Navigate to match:', item.metadata.matchId);
        }
        break;
    }
  };

  const displayFeed = activityFeed.slice(0, maxItems);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color='#F44336' />
        <Text style={styles.errorText}>{t('errors.failedToLoadFeed')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFeed}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('social.activityFeed')}</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Ionicons name='refresh' size={24} color={refreshing ? '#ccc' : '#2196F3'} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.feedContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayFeed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='newspaper' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>{t('social.noActivityYet')}</Text>
            <Text style={styles.emptyDescription}>{t('social.activityWillAppearHere')}</Text>
          </View>
        ) : (
          displayFeed.map((item, index) => renderActivityItem(item, index))
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  feedContainer: {
    flex: 1,
  },
  activityItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
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

export default ActivityFeed;
