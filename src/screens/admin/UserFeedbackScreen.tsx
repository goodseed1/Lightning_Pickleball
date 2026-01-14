/**
 * 🚨 User Feedback Screen
 * 긴급 대응 센터 - 사용자 피드백 관리 상황판
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import FeedbackCard from '../../components/admin/FeedbackCard';
import {
  subscribeToAllFeedback,
  updateFeedbackStatus,
  addAdminResponse,
  UserFeedback,
} from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import pushNotificationService from '../../services/pushNotificationService';

type FilterType = 'all' | 'new' | 'in_progress' | 'resolved';

const UserFeedbackScreen: React.FC = () => {
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const styles = createStyles(themeColors.colors);
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatingId, setUpdatingId] = useState<string | null>(null); // Reserved for future loading indicator per card

  // Subscribe to real-time feedback updates
  useEffect(() => {
    console.log('[UserFeedbackScreen] Setting up feedback subscription...');
    setLoading(true);

    const unsubscribe = subscribeToAllFeedback(feedbackList => {
      console.log('[UserFeedbackScreen] Received', feedbackList.length, 'feedbacks');
      setFeedbacks(feedbackList);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      console.log('[UserFeedbackScreen] Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  // Filter feedbacks based on active filter
  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (activeFilter === 'all') return true;
    return feedback.status === activeFilter;
  });

  // Calculate statistics
  const stats = {
    new: feedbacks.filter(f => f.status === 'new').length,
    in_progress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  // Handle pull-to-refresh (real-time subscription handles updates automatically)
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Real-time subscription handles updates automatically
    // Just show refreshing indicator briefly
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Handle status change with Firestore update
  const handleStatusChange = useCallback(
    async (feedbackId: string, newStatus: string) => {
      try {
        setUpdatingId(feedbackId);
        await updateFeedbackStatus(feedbackId, newStatus as 'new' | 'in_progress' | 'resolved');
        console.log('[UserFeedbackScreen] Status updated:', feedbackId, '→', newStatus);

        // Show success feedback
        Alert.alert(t('userFeedback.statusUpdated'), t('userFeedback.statusUpdatedMessage'));
      } catch (error) {
        console.error('[UserFeedbackScreen] Error updating status:', error);
        Alert.alert(t('common.error'), t('userFeedback.statusUpdateFailed'));
      } finally {
        setUpdatingId(null);
      }
    },
    [t]
  );

  // Handle admin response submission
  const handleSubmitResponse = useCallback(
    async (feedbackId: string, response: string, userId: string) => {
      if (!user) {
        Alert.alert(t('common.error'), t('userFeedback.authRequired'));
        return;
      }

      try {
        setUpdatingId(feedbackId);
        await addAdminResponse(feedbackId, response, user.uid);
        console.log('[UserFeedbackScreen] Response added:', feedbackId);

        // Send push notification to user
        try {
          await pushNotificationService.sendToUser(userId, {
            title: t('userFeedback.pushNotificationTitle'),
            body: t('userFeedback.pushNotificationBody'),
            data: {
              type: 'feedback_response',
              targetScreen: 'ChatScreen',
            },
          });
          console.log('[UserFeedbackScreen] Push notification sent to user:', userId);
        } catch (notificationError) {
          console.error(
            '[UserFeedbackScreen] Failed to send push notification:',
            notificationError
          );
          // Don't fail the whole operation if notification fails
        }

        Alert.alert(t('userFeedback.responseSent'), t('userFeedback.responseSentMessage'));
      } catch (error) {
        console.error('[UserFeedbackScreen] Error adding response:', error);
        Alert.alert(t('common.error'), t('userFeedback.responseSubmitFailed'));
      } finally {
        setUpdatingId(null);
      }
    },
    [user, t]
  );

  // Filter tab labels
  const getFilterLabel = (filter: FilterType): string => {
    switch (filter) {
      case 'all':
        return t('userFeedback.filters.all');
      case 'new':
        return t('userFeedback.filters.new');
      case 'in_progress':
        return t('userFeedback.filters.inProgress');
      case 'resolved':
        return t('userFeedback.filters.resolved');
      default:
        return filter;
    }
  };

  // Render header with statistics
  const renderHeader = () => (
    <>
      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
          <Text style={styles.statNumber}>{stats.new}</Text>
          <Text style={styles.statLabel}>{t('userFeedback.filters.new')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
          <Text style={styles.statNumber}>{stats.in_progress}</Text>
          <Text style={styles.statLabel}>{t('userFeedback.filters.inProgress')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
          <Text style={styles.statNumber}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>{t('userFeedback.filters.resolved')}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'new', 'in_progress', 'resolved'] as FilterType[]).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && {
                backgroundColor: themeColors.colors.primary,
                borderColor: themeColors.colors.primary,
              },
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && { color: '#FFFFFF', fontWeight: '600' },
              ]}
            >
              {getFilterLabel(filter)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('userFeedback.title')} />
      </Appbar.Header>

      <FlatList
        style={[styles.container, { backgroundColor: themeColors.colors.background }]}
        data={filteredFeedbacks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FeedbackCard
            feedback={item}
            onStatusChange={newStatus => handleStatusChange(item.id, newStatus)}
            onSubmitResponse={(response, userId) => handleSubmitResponse(item.id, response, userId)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={themeColors.colors.primary} />
              <Text style={styles.loadingText}>{t('userFeedback.loading')}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('userFeedback.empty')}</Text>
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
      />
    </>
  );
};

const createStyles = (colors: Record<string, string | object>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    statCard: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    filterText: {
      fontSize: 12,
      color: colors.onSurface,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    loadingContainer: {
      padding: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
  });

export default UserFeedbackScreen;
