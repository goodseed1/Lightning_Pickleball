/**
 * Appeal Card Component
 * Apple Guideline 1.2 Compliance
 *
 * 밴 이의 제기 카드 - Admin Dashboard용
 * - 이의 제기 내용 표시
 * - 승인 (Unban) / 거절 버튼
 *
 * @author Kim
 * @date 2025-01-17
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { BanAppeal } from '../../services/appealService';

interface AppealCardProps {
  appeal: BanAppeal;
  onApprove: (appealId: string, userId: string, adminNotes?: string) => Promise<void>;
  onReject: (appealId: string, adminNotes?: string) => Promise<void>;
}

const AppealCard: React.FC<AppealCardProps> = ({ appeal, onApprove, onReject }) => {
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const styles = createStyles(themeColors.colors);
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Format date
  const formatDate = (date: unknown): string => {
    if (!date) return '';
    try {
      // Firestore Timestamp
      if (typeof date === 'object' && 'toDate' in (date as object)) {
        return (date as { toDate: () => Date }).toDate().toLocaleDateString();
      }
      return new Date(date as string | number | Date).toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Get status badge color
  const getStatusColor = () => {
    switch (appeal.status) {
      case 'pending':
        return '#FFC107';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Get status label
  const getStatusLabel = () => {
    switch (appeal.status) {
      case 'pending':
        return t('appeal.status.pending', 'Pending');
      case 'approved':
        return t('appeal.status.approved', 'Approved');
      case 'rejected':
        return t('appeal.status.rejected', 'Rejected');
      default:
        return appeal.status;
    }
  };

  // Handle approve
  const handleApprove = async () => {
    Alert.alert(
      t('appeal.approveTitle', 'Approve Appeal & Unban'),
      t('appeal.approveConfirm', 'This will unban the user and restore their account. Continue?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('appeal.approve', 'Approve & Unban'),
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await onApprove(appeal.id, appeal.userId, adminNotes || undefined);
              setShowActions(false);
              setAdminNotes('');
              Alert.alert(
                t('common.success', 'Success'),
                t('appeal.approvedMessage', 'User has been unbanned successfully.')
              );
            } catch {
              Alert.alert(
                t('common.error', 'Error'),
                t('appeal.approveFailed', 'Failed to approve appeal.')
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle reject
  const handleReject = async () => {
    Alert.alert(
      t('appeal.rejectTitle', 'Reject Appeal'),
      t(
        'appeal.rejectConfirm',
        'This will reject the appeal. The user will remain banned. Continue?'
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('appeal.reject', 'Reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onReject(appeal.id, adminNotes || undefined);
              setShowActions(false);
              setAdminNotes('');
              Alert.alert(
                t('common.success', 'Success'),
                t('appeal.rejectedMessage', 'Appeal has been rejected.')
              );
            } catch {
              Alert.alert(
                t('common.error', 'Error'),
                t('appeal.rejectFailed', 'Failed to reject appeal.')
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusLabel()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{appeal.userName}</Text>
            <Text style={styles.userEmail}>{appeal.userEmail}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{formatDate(appeal.createdAt)}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={themeColors.colors.onSurfaceVariant as string}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Appeal Text */}
          <View style={styles.appealSection}>
            <Text style={styles.sectionLabel}>{t('appeal.appealText', 'Appeal Message')}:</Text>
            <Text style={styles.appealText}>{appeal.appealText}</Text>
          </View>

          {/* Review Info (if already reviewed) */}
          {appeal.reviewedBy && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>
                {t('appeal.reviewedBy', 'Reviewed by')}: {appeal.reviewedBy}
              </Text>
              {appeal.reviewedAt && (
                <Text style={styles.reviewDate}>
                  {t('appeal.reviewedAt', 'on')} {formatDate(appeal.reviewedAt)}
                </Text>
              )}
              {appeal.adminNotes && (
                <Text style={styles.adminNotes}>
                  {t('appeal.adminNotes', 'Notes')}: {appeal.adminNotes}
                </Text>
              )}
            </View>
          )}

          {/* Actions (only for pending) */}
          {appeal.status === 'pending' && (
            <>
              {!showActions ? (
                <TouchableOpacity style={styles.reviewButton} onPress={() => setShowActions(true)}>
                  <Ionicons name='checkmark-circle-outline' size={20} color='#FFFFFF' />
                  <Text style={styles.reviewButtonText}>
                    {t('appeal.reviewAction', 'Review Appeal')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionsContainer}>
                  {/* Admin Notes Input */}
                  <TextInput
                    style={styles.notesInput}
                    placeholder={t('appeal.notesPlaceholder', 'Add admin notes (optional)...')}
                    placeholderTextColor='#999'
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    multiline
                    numberOfLines={2}
                  />

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => {
                        setShowActions(false);
                        setAdminNotes('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={handleReject}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size='small' color='#FFFFFF' />
                      ) : (
                        <>
                          <Ionicons name='close-circle' size={18} color='#FFFFFF' />
                          <Text style={styles.rejectButtonText}>
                            {t('appeal.reject', 'Reject')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={handleApprove}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size='small' color='#FFFFFF' />
                      ) : (
                        <>
                          <Ionicons name='checkmark-circle' size={18} color='#FFFFFF' />
                          <Text style={styles.approveButtonText}>
                            {t('appeal.approveUnban', 'Unban')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: Record<string, string | object>) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface as string,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.outline as string,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginRight: 12,
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface as string,
    },
    userEmail: {
      fontSize: 12,
      color: colors.onSurfaceVariant as string,
      marginTop: 2,
    },
    dateText: {
      fontSize: 12,
      color: colors.onSurfaceVariant as string,
      marginBottom: 4,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline as string,
    },
    appealSection: {
      marginTop: 12,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant as string,
      marginBottom: 4,
    },
    appealText: {
      fontSize: 14,
      color: colors.onSurface as string,
      lineHeight: 20,
      backgroundColor: colors.surfaceVariant as string,
      padding: 12,
      borderRadius: 8,
    },
    reviewSection: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceVariant as string,
      borderRadius: 8,
    },
    reviewLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant as string,
    },
    reviewDate: {
      fontSize: 11,
      color: colors.onSurfaceVariant as string,
      marginTop: 2,
    },
    adminNotes: {
      fontSize: 12,
      color: colors.onSurface as string,
      marginTop: 8,
      fontStyle: 'italic',
    },
    reviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1976D2',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    reviewButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    actionsContainer: {
      marginTop: 16,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.outline as string,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.onSurface as string,
      backgroundColor: colors.surfaceVariant as string,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: colors.surfaceVariant as string,
      borderWidth: 1,
      borderColor: colors.outline as string,
    },
    cancelButtonText: {
      color: colors.onSurface as string,
      fontSize: 13,
      fontWeight: '500',
    },
    rejectButton: {
      backgroundColor: '#F44336',
    },
    rejectButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 4,
    },
    approveButton: {
      backgroundColor: '#4CAF50',
    },
    approveButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

export default AppealCard;
