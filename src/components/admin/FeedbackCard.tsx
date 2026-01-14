/**
 * FeedbackCard Component
 * Individual feedback card with dark glass style for admin dashboard
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Conversation Message Interface
 */
interface ConversationMessage {
  sender: 'user' | 'admin';
  senderName: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

export interface FeedbackCardProps {
  feedback: {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    type: 'bug' | 'feature' | 'complaint' | 'praise' | 'other';
    title: string;
    description: string;
    status: 'new' | 'in_progress' | 'resolved';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Date;
    // Legacy single response (for backward compatibility)
    adminResponse?: string;
    respondedAt?: Date;
    // 💬 Conversation thread
    conversation?: ConversationMessage[];
    lastMessageAt?: Date;
    lastMessageBy?: 'user' | 'admin';
  };
  onStatusChange: (newStatus: string) => void;
  onSubmitResponse: (response: string, userId: string) => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onStatusChange,
  onSubmitResponse,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const themeColors = getLightningTennisTheme(theme);
  const styles = createStyles(themeColors.colors);
  const [expanded, setExpanded] = useState(false);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Type icon mapping
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

  // Priority badge color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#EF5350'; // Red
      case 'high':
        return '#FF9800'; // Orange
      case 'medium':
        return '#FFC107'; // Amber
      case 'low':
        return '#66BB6A'; // Green
      default:
        return '#9E9E9E';
    }
  };

  // Status badge color
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

  // Relative time formatting
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('feedbackCard.time.justNow');
    } else if (diffMins < 60) {
      return t('feedbackCard.time.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return t('feedbackCard.time.hoursAgo', { count: diffHours });
    } else {
      return t('feedbackCard.time.daysAgo', { count: diffDays });
    }
  };

  // Status translation
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'new':
        return t('feedbackCard.status.new');
      case 'in_progress':
        return t('feedbackCard.status.inProgress');
      case 'resolved':
        return t('feedbackCard.status.resolved');
      default:
        return status;
    }
  };

  // Priority translation
  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return t('feedbackCard.priority.critical');
      case 'high':
        return t('feedbackCard.priority.high');
      case 'medium':
        return t('feedbackCard.priority.medium');
      case 'low':
        return t('feedbackCard.priority.low');
      default:
        return priority;
    }
  };

  // Handle response submission
  const handleSubmitResponse = () => {
    if (responseText.trim()) {
      onSubmitResponse(responseText.trim(), feedback.userId);
      setResponseText('');
      setShowResponseInput(false);
    }
  };

  return (
    <View style={styles.darkGlassCard}>
      {/* Header: Type Icon + Title + Priority Badge */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.typeIcon}>{getTypeIcon(feedback.type)}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {feedback.title}
            </Text>
            <Text style={styles.subtitle}>
              {feedback.userName} • {getRelativeTime(feedback.createdAt)}
            </Text>
            <Text style={styles.userEmailInline} numberOfLines={1}>
              {feedback.userEmail}
            </Text>
          </View>
        </View>
        <View
          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(feedback.priority) }]}
        >
          <Text style={styles.priorityText}>{getPriorityLabel(feedback.priority)}</Text>
        </View>
      </View>

      {/* Description (Collapsible) */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
          {feedback.description || ''}
        </Text>
        {!expanded && (feedback.description?.length ?? 0) > 100 && (
          <Text style={styles.expandText}>{t('feedbackCard.actions.showMore')}</Text>
        )}
      </TouchableOpacity>

      {/* 💬 Conversation Thread Section */}
      {feedback.conversation && feedback.conversation.length > 0 && (
        <View style={styles.conversationSection}>
          <View style={styles.responseLabelContainer}>
            <Ionicons name='chatbubbles-outline' size={16} color={themeColors.colors.primary} />
            <Text style={styles.responseLabel}>{t('feedbackCard.conversation.label')}</Text>
            <Text style={styles.messageCount}>({feedback.conversation.length})</Text>
          </View>

          {/* Conversation Messages */}
          {feedback.conversation.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.sender === 'admin' ? styles.adminBubble : styles.userBubble,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text
                  style={[
                    styles.senderName,
                    { color: msg.sender === 'admin' ? themeColors.colors.primary : '#66BB6A' },
                  ]}
                >
                  {msg.sender === 'admin' ? '👨‍💼 Admin' : `👤 ${msg.senderName}`}
                </Text>
                <Text style={styles.messageTime}>
                  {msg.timestamp.toLocaleString(t('common.locale'), {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.messageText}>{msg.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Legacy Admin Response (for backward compatibility) */}
      {!feedback.conversation?.length && feedback.adminResponse && (
        <View style={styles.responseSection}>
          <View style={styles.responseLabelContainer}>
            <Ionicons name='chatbubble-outline' size={16} color={themeColors.colors.primary} />
            <Text style={styles.responseLabel}>{t('feedbackCard.response.label')}</Text>
          </View>
          <Text style={styles.responseText}>{feedback.adminResponse}</Text>
          {feedback.respondedAt && (
            <Text style={styles.responseTime}>
              {t('feedbackCard.response.respondedAt', {
                date: feedback.respondedAt.toLocaleDateString(t('common.locale')),
              })}
            </Text>
          )}
        </View>
      )}

      {/* Response Input Section - Always available for continuing conversation */}
      {showResponseInput && (
        <View style={styles.responseInputSection}>
          <TextInput
            style={styles.responseInput}
            placeholder={t('feedbackCard.response.placeholder')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            value={responseText}
            onChangeText={setResponseText}
            multiline
            numberOfLines={3}
          />
          <View style={styles.responseInputButtons}>
            <TouchableOpacity
              style={[styles.responseInputButton, styles.cancelButton]}
              onPress={() => {
                setShowResponseInput(false);
                setResponseText('');
              }}
            >
              <Text style={styles.cancelButtonText}>{t('feedbackCard.actions.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.responseInputButton, styles.submitButton]}
              onPress={handleSubmitResponse}
              disabled={!responseText.trim()}
            >
              <Ionicons name='send' size={16} color='#FFFFFF' />
              <Text style={styles.submitButtonText}>{t('feedbackCard.actions.send')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer: Status Dropdown */}
      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(feedback.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(feedback.status)}</Text>
          </View>
        </View>

        {/* Status Change Buttons */}
        <View style={styles.statusButtons}>
          {/* Reply button - always available for continuing conversation */}
          {!showResponseInput && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => setShowResponseInput(true)}
            >
              <Ionicons name='chatbubble-outline' size={20} color={themeColors.colors.primary} />
              <Text style={[styles.statusButtonText, { color: themeColors.colors.primary }]}>
                {feedback.conversation?.length
                  ? t('feedbackCard.actions.continue')
                  : t('feedbackCard.actions.reply')}
              </Text>
            </TouchableOpacity>
          )}
          {feedback.status === 'new' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => onStatusChange('in_progress')}
            >
              <Ionicons name='play-circle-outline' size={20} color={themeColors.colors.primary} />
              <Text style={[styles.statusButtonText, { color: themeColors.colors.primary }]}>
                {t('feedbackCard.actions.start')}
              </Text>
            </TouchableOpacity>
          )}
          {feedback.status !== 'resolved' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => onStatusChange('resolved')}
            >
              <Ionicons name='checkmark-circle-outline' size={20} color='#66BB6A' />
              <Text style={[styles.statusButtonText, { color: '#66BB6A' }]}>
                {t('feedbackCard.actions.resolve')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: Record<string, string | object>) =>
  StyleSheet.create({
    // 🎨 [DARK GLASS] Card Style
    darkGlassCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.outline,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
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
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    userEmailInline: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    description: {
      fontSize: 14,
      color: colors.onSurface,
      lineHeight: 20,
      marginBottom: 8,
    },
    expandText: {
      fontSize: 12,
      color: colors.primary,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.outline,
      paddingTop: 12,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
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
    statusButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
    },
    statusButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    responseSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
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
    responseInputSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
    },
    responseInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      padding: 12,
      fontSize: 14,
      color: colors.onSurface,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 8,
    },
    responseInputButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    responseInputButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    cancelButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    submitButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 💬 Conversation Thread Styles
    conversationSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
    },
    messageCount: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
    },
    messageBubble: {
      padding: 10,
      borderRadius: 8,
      marginTop: 8,
    },
    adminBubble: {
      backgroundColor: colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      marginRight: 16,
    },
    userBubble: {
      backgroundColor: colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: '#66BB6A',
      marginLeft: 16,
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    senderName: {
      fontSize: 11,
      fontWeight: '600',
    },
    messageTime: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
    },
    messageText: {
      fontSize: 13,
      color: colors.onSurface,
      lineHeight: 18,
    },
  });

export default FeedbackCard;
