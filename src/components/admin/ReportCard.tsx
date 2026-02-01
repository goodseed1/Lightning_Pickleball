/**
 * ReportCard Component
 * Individual content report card for admin dashboard
 * Apple Guideline 1.2 Compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import {
  ContentReport,
  ReportStatus,
  ActionTaken,
  ReportReason,
  ReportTargetType,
} from '../../services/reportService';

export interface ReportCardProps {
  report: ContentReport;
  onStatusChange: (
    reportId: string,
    status: ReportStatus,
    options?: {
      adminNotes?: string;
      actionTaken?: ActionTaken;
    }
  ) => void;
  onUnban?: (reportId: string, userId: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange, onUnban }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const themeColors = getLightningPickleballTheme(theme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);

  const [expanded, setExpanded] = useState(false);
  const [showActionInput, setShowActionInput] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const [selectedAction, setSelectedAction] = useState<ActionTaken | null>(
    report.actionTaken || null
  );

  // [Apple 1.2] Check if target user is actually banned (real-time)
  const [isTargetBanned, setIsTargetBanned] = useState<boolean | null>(null);
  const [checkingBanStatus, setCheckingBanStatus] = useState(false);

  useEffect(() => {
    // Only check if report has user_banned action
    if (report.actionTaken === 'user_banned' && report.targetOwnerId) {
      const checkStatus = async () => {
        setCheckingBanStatus(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', report.targetOwnerId));
          if (userDoc.exists()) {
            setIsTargetBanned(userDoc.data().isBanned === true);
          }
        } catch (error) {
          console.error('[ReportCard] Error checking ban status:', error);
        } finally {
          setCheckingBanStatus(false);
        }
      };
      checkStatus();
    }
  }, [report.actionTaken, report.targetOwnerId]);

  // Reason icon mapping
  const getReasonIcon = (reason: ReportReason): string => {
    switch (reason) {
      case 'spam':
        return '📧';
      case 'harassment':
        return '😤';
      case 'inappropriate':
        return '⚠️';
      case 'hate_speech':
        return '📢';
      case 'violence':
        return '🔥';
      case 'other':
        return '📝';
      default:
        return '📋';
    }
  };

  // Target type icon mapping
  const getTargetTypeIcon = (targetType: ReportTargetType): string => {
    switch (targetType) {
      case 'user':
        return '👤';
      case 'club':
        return '🏢';
      case 'event':
        return '📅';
      case 'post':
        return '📄';
      case 'comment':
        return '💬';
      case 'chat':
        return '💭';
      default:
        return '📋';
    }
  };

  // Status badge color
  const getStatusColor = (status: ReportStatus): string => {
    switch (status) {
      case 'pending':
        return '#42A5F5'; // Blue
      case 'reviewed':
        return '#FFC107'; // Amber
      case 'action_taken':
        return '#EF5350'; // Red
      case 'dismissed':
        return '#66BB6A'; // Green
      default:
        return '#9E9E9E';
    }
  };

  // Relative time formatting
  const getRelativeTime = (date: Date | { toDate: () => Date }): string => {
    const actualDate = 'toDate' in date ? date.toDate() : date;
    const now = new Date();
    const diffMs = now.getTime() - actualDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('report.time.justNow', 'Just now');
    } else if (diffMins < 60) {
      return t('report.time.minutesAgo', '{{count}} min ago', { count: diffMins });
    } else if (diffHours < 24) {
      return t('report.time.hoursAgo', '{{count}} hr ago', { count: diffHours });
    } else {
      return t('report.time.daysAgo', '{{count}} days ago', { count: diffDays });
    }
  };

  // Status label
  const getStatusLabel = (status: ReportStatus): string => {
    switch (status) {
      case 'pending':
        return t('report.status.pending', 'Pending');
      case 'reviewed':
        return t('report.status.reviewed', 'Reviewed');
      case 'action_taken':
        return t('report.status.actionTaken', 'Action Taken');
      case 'dismissed':
        return t('report.status.dismissed', 'Dismissed');
      default:
        return status;
    }
  };

  // Reason label
  const getReasonLabel = (reason: ReportReason): string => {
    switch (reason) {
      case 'spam':
        return t('report.reasons.spam', 'Spam');
      case 'harassment':
        return t('report.reasons.harassment', 'Harassment');
      case 'inappropriate':
        return t('report.reasons.inappropriate', 'Inappropriate Content');
      case 'hate_speech':
        return t('report.reasons.hate_speech', 'Hate Speech');
      case 'violence':
        return t('report.reasons.violence', 'Violence');
      case 'other':
        return t('report.reasons.other', 'Other');
      default:
        return reason;
    }
  };

  // Target type label
  const getTargetTypeLabel = (targetType: ReportTargetType): string => {
    switch (targetType) {
      case 'user':
        return t('report.targetType.user', 'User');
      case 'club':
        return t('report.targetType.club', 'Club');
      case 'event':
        return t('report.targetType.event', 'Event');
      case 'post':
        return t('report.targetType.post', 'Post');
      case 'comment':
        return t('report.targetType.comment', 'Comment');
      case 'chat':
        return t('report.targetType.chat', 'Chat');
      default:
        return targetType;
    }
  };

  // Action label
  const getActionLabel = (action: ActionTaken): string => {
    switch (action) {
      case 'warning':
        return t('report.actions.warning', 'Warning Issued');
      case 'content_removed':
        return t('report.actions.contentRemoved', 'Content Removed');
      case 'user_banned':
        return t('report.actions.userBanned', 'User Banned');
      case 'user_unbanned':
        return t('report.actions.userUnbanned', 'User Unbanned');
      default:
        return action;
    }
  };

  // Format content snapshot based on target type
  const formatSnapshot = (
    targetType: ReportTargetType,
    snapshot: Record<string, unknown>
  ): React.ReactNode => {
    if (!snapshot || Object.keys(snapshot).length === 0) return null;

    switch (targetType) {
      case 'chat':
        return (
          <View style={styles.snapshotContent}>
            {!!snapshot.reportedUserName && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  👤 {t('report.snapshot.reportedUser', 'Reported User')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.reportedUserName)}</Text>
              </View>
            )}
            {!!snapshot.clubName && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  🏢 {t('report.snapshot.clubName', 'Club')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.clubName)}</Text>
              </View>
            )}
            {!!snapshot.otherUserName && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  👤 {t('report.snapshot.chatWith', 'Chat with')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.otherUserName)}</Text>
              </View>
            )}
            {snapshot.messageCount !== undefined && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  💬 {t('report.snapshot.messageCount', 'Messages')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.messageCount)}</Text>
              </View>
            )}
            {!!snapshot.conversationId && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  🔗 {t('report.snapshot.conversationId', 'Conversation ID')}:
                </Text>
                <Text style={styles.snapshotValue} numberOfLines={1}>
                  {String(snapshot.conversationId).substring(0, 20)}...
                </Text>
              </View>
            )}
          </View>
        );

      case 'user':
        return (
          <View style={styles.snapshotContent}>
            {!!snapshot.nickname && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  👤 {t('report.snapshot.nickname', 'Nickname')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.nickname)}</Text>
              </View>
            )}
            {!!snapshot.skillLevel && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  🏓 {t('report.snapshot.skillLevel', 'Skill Level')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.skillLevel)}</Text>
              </View>
            )}
            {!!snapshot.gender && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  📋 {t('report.snapshot.gender', 'Gender')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.gender)}</Text>
              </View>
            )}
          </View>
        );

      case 'event':
        return (
          <View style={styles.snapshotContent}>
            {!!snapshot.title && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  📅 {t('report.snapshot.eventTitle', 'Event')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.title)}</Text>
              </View>
            )}
            {!!snapshot.description && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  📝 {t('report.snapshot.description', 'Description')}:
                </Text>
                <Text style={styles.snapshotValue} numberOfLines={2}>
                  {String(snapshot.description)}
                </Text>
              </View>
            )}
          </View>
        );

      case 'club':
        return (
          <View style={styles.snapshotContent}>
            {!!snapshot.name && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  🏢 {t('report.snapshot.clubName', 'Club')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.name)}</Text>
              </View>
            )}
            {!!snapshot.description && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  📝 {t('report.snapshot.description', 'Description')}:
                </Text>
                <Text style={styles.snapshotValue} numberOfLines={2}>
                  {String(snapshot.description)}
                </Text>
              </View>
            )}
          </View>
        );

      case 'post':
      case 'comment':
        return (
          <View style={styles.snapshotContent}>
            {!!(snapshot.content || snapshot.text) && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  📄 {t('report.snapshot.content', 'Content')}:
                </Text>
                <Text style={styles.snapshotValue} numberOfLines={3}>
                  {String(snapshot.content || snapshot.text)}
                </Text>
              </View>
            )}
            {!!snapshot.authorName && (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>
                  👤 {t('report.snapshot.author', 'Author')}:
                </Text>
                <Text style={styles.snapshotValue}>{String(snapshot.authorName)}</Text>
              </View>
            )}
          </View>
        );

      default:
        return (
          <View style={styles.snapshotContent}>
            {Object.entries(snapshot).map(([key, value]) => (
              <View key={key} style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>{key}:</Text>
                <Text style={styles.snapshotValue} numberOfLines={1}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
              </View>
            ))}
          </View>
        );
    }
  };

  // Handle action submission
  const handleSubmitAction = (status: ReportStatus) => {
    onStatusChange(report.id!, status, {
      adminNotes: adminNotes.trim() || undefined,
      actionTaken: selectedAction || undefined,
    });
    setShowActionInput(false);
  };

  return (
    <View style={styles.darkGlassCard}>
      {/* Header: Target Type + Reporter Info */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.typeIcon}>
            {getTargetTypeIcon(report.targetType)} {getReasonIcon(report.reason)}
          </Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {getReasonLabel(report.reason)}
            </Text>
            <Text style={styles.subtitle}>
              {t('report.reportedBy', 'Reported by')}: {report.reporterName}
            </Text>
            <Text style={styles.subtitle}>
              {t('report.target', 'Target')}: {getTargetTypeLabel(report.targetType)} -{' '}
              {report.targetOwnerName}
            </Text>
            <Text style={styles.timeText}>{getRelativeTime(report.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(report.status)}</Text>
        </View>
      </View>

      {/* Description */}
      {report.description && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
            {report.description}
          </Text>
          {!expanded && report.description.length > 100 && (
            <Text style={styles.expandText}>{t('report.showMore', 'Show more')}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Content Snapshot Preview - Tappable to expand */}
      {report.targetSnapshot && (
        <TouchableOpacity
          style={styles.snapshotSection}
          onPress={() => setShowSnapshotModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.responseLabelContainer}>
            <Ionicons name='document-text-outline' size={16} color={themeColors.colors.primary} />
            <Text style={styles.responseLabel}>
              {t('report.contentSnapshot', 'Content Snapshot')}
            </Text>
            <Ionicons
              name='expand-outline'
              size={14}
              color={themeColors.colors.primary}
              style={{ marginLeft: 'auto' }}
            />
          </View>
          {formatSnapshot(report.targetType, report.targetSnapshot as Record<string, unknown>)}
          <Text style={styles.tapToExpandText}>
            {t('report.tapToExpand', 'Tap to view full details')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Admin Notes (if exists) */}
      {report.adminNotes && !showActionInput && (
        <View style={styles.notesSection}>
          <View style={styles.responseLabelContainer}>
            <Ionicons name='create-outline' size={16} color={themeColors.colors.primary} />
            <Text style={styles.responseLabel}>{t('report.adminNotes', 'Admin Notes')}</Text>
          </View>
          <Text style={styles.notesText}>{report.adminNotes}</Text>
        </View>
      )}

      {/* Action Taken Badge */}
      {report.actionTaken && (
        <View
          style={[
            styles.actionBadge,
            report.actionTaken === 'user_unbanned' && styles.actionBadgeUnbanned,
          ]}
        >
          <Ionicons
            name={report.actionTaken === 'user_unbanned' ? 'checkmark-circle' : 'shield-checkmark'}
            size={16}
            color={report.actionTaken === 'user_unbanned' ? '#4CAF50' : '#EF5350'}
          />
          <Text
            style={[
              styles.actionText,
              report.actionTaken === 'user_unbanned' && styles.actionTextUnbanned,
            ]}
          >
            {getActionLabel(report.actionTaken)}
          </Text>
        </View>
      )}

      {/* [Apple 1.2] Unban Button - Show only when user is ACTUALLY banned */}
      {report.status === 'action_taken' &&
        report.actionTaken === 'user_banned' &&
        onUnban &&
        (checkingBanStatus ? (
          <View style={styles.unbanButtonDisabled}>
            <ActivityIndicator size='small' color='#999' />
            <Text style={styles.unbanButtonTextDisabled}>
              {t('report.checkingStatus', 'Checking...')}
            </Text>
          </View>
        ) : isTargetBanned === true ? (
          <TouchableOpacity
            style={styles.unbanButton}
            onPress={() => onUnban(report.id!, report.targetOwnerId)}
          >
            <Ionicons name='person-add-outline' size={18} color='#4CAF50' />
            <Text style={styles.unbanButtonText}>{t('report.unbanUser', 'Unban User')}</Text>
          </TouchableOpacity>
        ) : isTargetBanned === false ? (
          <View style={styles.unbannedBadge}>
            <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
            <Text style={styles.unbannedBadgeText}>
              {t('report.userAlreadyUnbanned', 'User Already Unbanned')}
            </Text>
          </View>
        ) : null)}

      {/* Action Input Section */}
      {showActionInput && (
        <View style={styles.actionInputSection}>
          <Text style={styles.actionInputLabel}>{t('report.selectAction', 'Select Action')}</Text>

          {/* Action Type Selection */}
          <View style={styles.actionTypeButtons}>
            {(['warning', 'content_removed', 'user_banned'] as ActionTaken[]).map(action => (
              <TouchableOpacity
                key={action}
                style={[
                  styles.actionTypeButton,
                  selectedAction === action && { backgroundColor: themeColors.colors.primary },
                ]}
                onPress={() => setSelectedAction(action)}
              >
                <Text
                  style={[styles.actionTypeText, selectedAction === action && { color: '#FFFFFF' }]}
                >
                  {getActionLabel(action)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder={t('report.addNotes', 'Add admin notes...')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actionInputButtons}>
            <TouchableOpacity
              style={[styles.actionInputButton, styles.cancelButton]}
              onPress={() => {
                setShowActionInput(false);
                setSelectedAction(report.actionTaken || null);
                setAdminNotes(report.adminNotes || '');
              }}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionInputButton, styles.submitButton]}
              onPress={() => handleSubmitAction('action_taken')}
            >
              <Ionicons name='checkmark' size={16} color='#FFFFFF' />
              <Text style={styles.submitButtonText}>{t('report.takeAction', 'Take Action')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer: Action Buttons */}
      {report.status === 'pending' && !showActionInput && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.statusButton} onPress={() => setShowActionInput(true)}>
            <Ionicons name='shield-checkmark-outline' size={20} color='#EF5350' />
            <Text style={[styles.statusButtonText, { color: '#EF5350' }]}>
              {t('report.takeAction', 'Take Action')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleSubmitAction('reviewed')}
          >
            <Ionicons name='eye-outline' size={20} color={themeColors.colors.primary} />
            <Text style={[styles.statusButtonText, { color: themeColors.colors.primary }]}>
              {t('report.markReviewed', 'Mark Reviewed')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleSubmitAction('dismissed')}
          >
            <Ionicons name='close-circle-outline' size={20} color='#66BB6A' />
            <Text style={[styles.statusButtonText, { color: '#66BB6A' }]}>
              {t('report.dismiss', 'Dismiss')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Snapshot Detail Modal */}
      <Modal
        visible={showSnapshotModal}
        animationType='slide'
        transparent={true}
        onRequestClose={() => setShowSnapshotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('report.contentSnapshot', 'Content Snapshot')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowSnapshotModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name='close' size={24} color={themeColors.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              {/* Basic Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  {t('report.basicInfo', 'Basic Information')}
                </Text>
                {formatSnapshot(
                  report.targetType,
                  report.targetSnapshot as Record<string, unknown>
                )}
              </View>

              {/* Chat Messages (if available) */}
              {report.targetType === 'chat' &&
                !!((report.targetSnapshot as Record<string, unknown>)?.recentMessages ||
                  (report.targetSnapshot as Record<string, unknown>)?.reportedUserMessages) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      💬 {t('report.recentMessages', 'Recent Messages')}
                    </Text>
                    {(
                      ((report.targetSnapshot as Record<string, unknown>)?.recentMessages ||
                        (report.targetSnapshot as Record<string, unknown>)
                          ?.reportedUserMessages) as Array<{
                        text: string;
                        senderName: string;
                        senderId: string;
                        timestamp: unknown;
                      }>
                    )?.map((msg, index) => (
                      <View key={index} style={styles.chatMessageItem}>
                        <View style={styles.chatMessageHeader}>
                          <Text style={styles.chatSenderName}>{msg.senderName}</Text>
                          {msg.senderId === report.targetOwnerId && (
                            <View style={styles.reportedBadge}>
                              <Text style={styles.reportedBadgeText}>
                                {t('report.reportedUser', 'Reported')}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.chatMessageText}>{msg.text}</Text>
                      </View>
                    ))}
                  </View>
                )}

              {/* Raw Data (for debugging/transparency) */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>🔧 {t('report.rawData', 'Raw Data')}</Text>
                <Text style={styles.rawDataText}>
                  {JSON.stringify(report.targetSnapshot, null, 2)}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <TouchableOpacity
              style={styles.modalCloseFooter}
              onPress={() => setShowSnapshotModal(false)}
            >
              <Text style={styles.modalCloseFooterText}>{t('common.close', 'Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    // [DARK GLASS] Card Style
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
      fontSize: 20,
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
      marginBottom: 2,
    },
    timeText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 4,
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
    description: {
      fontSize: 14,
      color: colors.onSurface,
      lineHeight: 20,
      marginBottom: 8,
      backgroundColor: colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
    },
    expandText: {
      fontSize: 12,
      color: colors.primary,
      marginBottom: 8,
    },
    snapshotSection: {
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
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
    snapshotContent: {
      gap: 8,
    },
    snapshotRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    snapshotLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginRight: 6,
    },
    snapshotValue: {
      fontSize: 13,
      color: colors.onSurface,
      flex: 1,
      lineHeight: 18,
    },
    notesSection: {
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    notesText: {
      fontSize: 14,
      color: colors.onSurface,
      lineHeight: 20,
    },
    actionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      padding: 8,
      backgroundColor: '#EF535020',
      borderRadius: 8,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#EF5350',
    },
    // [Apple 1.2] Unbanned action badge style
    actionBadgeUnbanned: {
      backgroundColor: '#4CAF5020',
    },
    actionTextUnbanned: {
      color: '#4CAF50',
    },
    // [Apple 1.2] Unban button style
    unbanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#4CAF5015',
      borderWidth: 1,
      borderColor: '#4CAF50',
      borderRadius: 8,
    },
    unbanButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4CAF50',
    },
    unbanButtonDisabled: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 8,
    },
    unbanButtonTextDisabled: {
      fontSize: 14,
      fontWeight: '500',
      color: '#999',
    },
    unbannedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#4CAF5015',
      borderRadius: 8,
    },
    unbannedBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4CAF50',
    },
    actionInputSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
    },
    actionInputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
    },
    actionTypeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    actionTypeButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
    actionTypeText: {
      fontSize: 12,
      color: colors.onSurface,
    },
    notesInput: {
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
    actionInputButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    actionInputButton: {
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
      backgroundColor: '#EF5350',
    },
    submitButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: colors.outline,
      paddingTop: 12,
      marginTop: 12,
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
      fontSize: 11,
      fontWeight: '600',
    },
    // Tap to expand hint
    tapToExpandText: {
      fontSize: 11,
      color: colors.primary,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.onSurface,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalContent: {
      padding: 16,
      maxHeight: 500,
    },
    modalSection: {
      marginBottom: 20,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 12,
    },
    chatMessageItem: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    chatMessageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    chatSenderName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurface,
    },
    reportedBadge: {
      backgroundColor: '#EF535030',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    reportedBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#EF5350',
    },
    chatMessageText: {
      fontSize: 13,
      color: colors.onSurface,
      lineHeight: 18,
    },
    rawDataText: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: colors.onSurfaceVariant,
      backgroundColor: colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
    },
    modalCloseFooter: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalCloseFooterText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default ReportCard;
