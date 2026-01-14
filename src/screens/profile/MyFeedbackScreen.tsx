/**
 * My Feedback Screen
 * Displays user's submitted feedback and admin responses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToMyFeedback, UserFeedbackItem } from '../../services/feedbackService';

const MyFeedbackScreen: React.FC = () => {
  const { theme } = useTheme();
  const themeColors = getLightningTennisTheme(theme);
  const styles = createStyles(themeColors.colors);
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [feedbacks, setFeedbacks] = useState<UserFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Subscribe to user's feedback
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('[MyFeedbackScreen] Setting up feedback subscription for user:', user.uid);
    setLoading(true);

    const unsubscribe = subscribeToMyFeedback(user.uid, feedbackList => {
      console.log('[MyFeedbackScreen] Received', feedbackList.length, 'feedbacks');
      setFeedbacks(feedbackList);
      setLoading(false);
    });

    return () => {
      console.log('[MyFeedbackScreen] Cleaning up subscription');
      unsubscribe();
    };
  }, [user]);

  // Get type icon
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'feature':
        return '💡';
      case 'complaint':
        return '😤';
      case 'praise':
        return '🎉';
      default:
        return '📝';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new':
        return '#42A5F5'; // Blue
      case 'in_progress':
        return '#FFC107'; // Amber
      case 'resolved':
        return '#66BB6A'; // Green
      default:
        return '#9E9E9E';
    }
  };

  // Status translation
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'new':
        return t('myFeedback.status.new');
      case 'in_progress':
        return t('myFeedback.status.inProgress');
      case 'resolved':
        return t('myFeedback.status.resolved');
      default:
        return status;
    }
  };

  // Relative time formatting
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('myFeedback.time.justNow');
    } else if (diffMins < 60) {
      return t('myFeedback.time.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return t('myFeedback.time.hoursAgo', { count: diffHours });
    } else {
      return t('myFeedback.time.daysAgo', { count: diffDays });
    }
  };

  // Render feedback card
  const renderFeedbackCard = ({ item }: { item: UserFeedbackItem }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.feedbackCard}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.feedbackTitle} numberOfLines={isExpanded ? undefined : 1}>
                {item.title}
              </Text>
              <Text style={styles.feedbackDate}>{getRelativeTime(item.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {/* Description (visible when expanded) */}
        {isExpanded && (
          <View style={styles.cardBody}>
            <Text style={styles.feedbackDescription}>{item.description}</Text>

            {/* Admin Response Section */}
            {item.adminResponse ? (
              <View style={styles.responseSection}>
                <View style={styles.responseLabelContainer}>
                  <Ionicons name='chatbubble' size={16} color={themeColors.colors.primary} />
                  <Text style={styles.responseLabel}>{t('myFeedback.adminResponse')}</Text>
                </View>
                <Text style={styles.responseText}>{item.adminResponse}</Text>
                {item.respondedAt && (
                  <Text style={styles.responseTime}>
                    {t('myFeedback.respondedDate', {
                      date: item.respondedAt.toLocaleDateString(t('common.locale')),
                    })}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.noResponseSection}>
                <Ionicons
                  name='hourglass-outline'
                  size={20}
                  color={themeColors.colors.onSurfaceVariant}
                />
                <Text style={styles.noResponseText}>{t('myFeedback.noResponse')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Expand indicator */}
        <View style={styles.expandIndicator}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={themeColors.colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('myFeedback.title')} />
      </Appbar.Header>

      <View style={[styles.container, { backgroundColor: themeColors.colors.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={themeColors.colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : feedbacks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name='chatbubbles-outline'
              size={64}
              color={themeColors.colors.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>{t('myFeedback.empty.title')}</Text>
            <Text style={styles.emptySubtitle}>{t('myFeedback.empty.subtitle')}</Text>
          </View>
        ) : (
          <FlatList
            data={feedbacks}
            keyExtractor={item => item.id}
            renderItem={renderFeedbackCard}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </>
  );
};

const createStyles = (colors: Record<string, string | object>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    feedbackCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: 8,
    },
    typeIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    headerTextContainer: {
      flex: 1,
    },
    feedbackTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    feedbackDate: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    cardBody: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    feedbackDescription: {
      fontSize: 14,
      color: colors.onSurface,
      lineHeight: 20,
      marginBottom: 12,
    },
    responseSection: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      padding: 12,
      marginTop: 8,
    },
    responseLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    responseLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    responseText: {
      fontSize: 14,
      color: colors.onSurface,
      lineHeight: 20,
      marginBottom: 8,
    },
    responseTime: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    noResponseSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      marginTop: 8,
    },
    noResponseText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    expandIndicator: {
      alignItems: 'center',
      marginTop: 8,
    },
  });

export default MyFeedbackScreen;
