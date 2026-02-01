/**
 * Content Reports Screen - Admin Dashboard
 * Apple Guideline 1.2 Compliance
 *
 * 콘텐츠 신고 & 밴 이의 제기 관리 화면
 * - 신고 목록 실시간 조회
 * - 밴 이의 제기 검토 및 Unban
 * - 필터링 (pending, reviewed, action_taken, dismissed)
 * - 신고 처리 (리뷰, 조치, 기각)
 *
 * @author Kim
 * @date 2025-01-17
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
import { useTranslation } from 'react-i18next';
import ReportCard from '../../components/admin/ReportCard';
import AppealCard from '../../components/admin/AppealCard';
import reportService, {
  ContentReport,
  ReportStatus,
  ActionTaken,
} from '../../services/reportService';
import appealService, { BanAppeal } from '../../services/appealService';
import { useAuth } from '../../contexts/AuthContext';

type FilterType = 'all' | 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
type MainTabType = 'reports' | 'appeals';

const ContentReportsScreen: React.FC = () => {
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Main tab state (Reports vs Appeals)
  const [mainTab, setMainTab] = useState<MainTabType>('reports');

  // Reports state
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Appeals state
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(true);

  // Subscribe to real-time report updates
  useEffect(() => {
    console.log('[ContentReportsScreen] Setting up reports subscription...');
    setLoading(true);

    const unsubscribe = reportService.subscribeToReports(
      reportsList => {
        console.log('[ContentReportsScreen] Received', reportsList.length, 'reports');
        setReports(reportsList);
        setLoading(false);
        setRefreshing(false);
      },
      undefined // No filters - get all reports
    );

    return () => {
      console.log('[ContentReportsScreen] Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  // Subscribe to real-time appeals updates
  useEffect(() => {
    console.log('[ContentReportsScreen] Setting up appeals subscription...');
    setAppealsLoading(true);

    const unsubscribe = appealService.subscribeToAppeals(appealsList => {
      console.log('[ContentReportsScreen] Received', appealsList.length, 'appeals');
      setAppeals(appealsList);
      setAppealsLoading(false);
    });

    return () => {
      console.log('[ContentReportsScreen] Cleaning up appeals subscription');
      unsubscribe();
    };
  }, []);

  // Filter reports based on active filter
  const filteredReports = reports.filter(report => {
    if (activeFilter === 'all') return true;
    return report.status === activeFilter;
  });

  // Calculate reports statistics
  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    action_taken: reports.filter(r => r.status === 'action_taken').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

  // Calculate appeals statistics
  const appealStats = {
    pending: appeals.filter(a => a.status === 'pending').length,
    approved: appeals.filter(a => a.status === 'approved').length,
    rejected: appeals.filter(a => a.status === 'rejected').length,
  };

  // Handle approve appeal (unban)
  const handleApproveAppeal = useCallback(
    async (appealId: string, userId: string, adminNotes?: string) => {
      if (!user) {
        Alert.alert(t('common.error'), t('report.authRequired', 'Please log in as admin.'));
        return;
      }
      await appealService.approveAppeal(appealId, userId, user.uid, adminNotes);
    },
    [user, t]
  );

  // Handle reject appeal
  const handleRejectAppeal = useCallback(
    async (appealId: string, adminNotes?: string) => {
      if (!user) {
        Alert.alert(t('common.error'), t('report.authRequired', 'Please log in as admin.'));
        return;
      }
      await appealService.rejectAppeal(appealId, user.uid, adminNotes);
    },
    [user, t]
  );

  // [Apple 1.2] Handle unban from report card
  const handleUnban = useCallback(
    async (reportId: string, userId: string) => {
      if (!user) {
        Alert.alert(t('common.error'), t('report.authRequired', 'Please log in as admin.'));
        return;
      }

      Alert.alert(
        t('report.unbanTitle', 'Unban User'),
        t('report.unbanConfirm', 'Are you sure you want to unban this user?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('report.unban', 'Unban'),
            style: 'default',
            onPress: async () => {
              try {
                // 1. Unban the user
                await appealService.unbanUser(userId, user.uid);

                // 2. Update report's actionTaken to 'user_unbanned' so button disappears
                await reportService.updateReportStatus(reportId, 'action_taken', {
                  actionTaken: 'user_unbanned',
                  adminNotes: `Unbanned by admin on ${new Date().toLocaleDateString()}`,
                  reviewedBy: user.uid,
                });

                Alert.alert(
                  t('common.success', 'Success'),
                  t('report.unbanSuccess', 'User has been unbanned successfully.')
                );
                console.log(
                  '[ContentReportsScreen] User unbanned:',
                  userId,
                  'from report:',
                  reportId
                );
              } catch (error) {
                console.error('[ContentReportsScreen] Error unbanning user:', error);
                Alert.alert(
                  t('common.error', 'Error'),
                  t('report.unbanFailed', 'Failed to unban user.')
                );
              }
            },
          },
        ]
      );
    },
    [user, t]
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback(
    async (
      reportId: string,
      newStatus: ReportStatus,
      options?: { adminNotes?: string; actionTaken?: ActionTaken }
    ) => {
      if (!user) {
        Alert.alert(t('common.error'), t('report.authRequired', 'Please log in as admin.'));
        return;
      }

      try {
        setUpdatingId(reportId);

        // [Apple 1.2] If action is content_removed, call Cloud Function to actually remove content
        if (options?.actionTaken === 'content_removed') {
          console.log('[ContentReportsScreen] Removing content via Cloud Function...');
          const result = await reportService.removeReportedContent(reportId, options.adminNotes);

          if (result.success) {
            Alert.alert(
              t('report.contentRemoved', 'Content Removed'),
              t(
                'report.contentRemovedMessage',
                'The reported content has been removed. {{count}} item(s) affected.',
                {
                  count: result.deletedItems || 0,
                }
              )
            );
          } else {
            Alert.alert(
              t('common.warning', 'Warning'),
              result.message ||
                t('report.contentRemovalPartial', 'Content removal completed with issues.')
            );
          }
        } else {
          // For other actions (warning, user_banned, or simple status updates)
          await reportService.updateReportStatus(reportId, newStatus, {
            ...options,
            reviewedBy: user.uid,
          });

          Alert.alert(
            t('report.statusUpdated', 'Status Updated'),
            t('report.statusUpdatedMessage', 'Report status has been updated.')
          );
        }

        console.log('[ContentReportsScreen] Status updated:', reportId, '->', newStatus);
      } catch (error) {
        console.error('[ContentReportsScreen] Error updating status:', error);
        Alert.alert(t('common.error'), t('report.statusUpdateFailed', 'Failed to update status.'));
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
        return t('report.filters.all', 'All');
      case 'pending':
        return t('report.filters.pending', 'Pending');
      case 'reviewed':
        return t('report.filters.reviewed', 'Reviewed');
      case 'action_taken':
        return t('report.filters.actionTaken', 'Action');
      case 'dismissed':
        return t('report.filters.dismissed', 'Dismissed');
      default:
        return filter;
    }
  };

  // Render header with main tabs and statistics
  const renderHeader = () => (
    <>
      {/* Main Tabs: Reports vs Appeals */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            mainTab === 'reports' && {
              backgroundColor: themeColors.colors.primary,
              borderColor: themeColors.colors.primary,
            },
          ]}
          onPress={() => setMainTab('reports')}
        >
          <Text
            style={[
              styles.mainTabText,
              mainTab === 'reports' && { color: '#FFFFFF', fontWeight: '700' },
            ]}
          >
            📋 {t('report.tabs.reports', 'Reports')} ({reports.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTab,
            mainTab === 'appeals' && {
              backgroundColor: themeColors.colors.primary,
              borderColor: themeColors.colors.primary,
            },
          ]}
          onPress={() => setMainTab('appeals')}
        >
          <Text
            style={[
              styles.mainTabText,
              mainTab === 'appeals' && { color: '#FFFFFF', fontWeight: '700' },
            ]}
          >
            🚫 {t('report.tabs.appeals', 'Ban Appeals')} ({appealStats.pending})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Content based on mainTab */}
      {mainTab === 'reports' ? (
        <>
          {/* Reports Statistics Summary */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#42A5F5' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>{t('report.filters.pending', 'Pending')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#FFC107' }]}>{stats.reviewed}</Text>
              <Text style={styles.statLabel}>{t('report.filters.reviewed', 'Reviewed')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#EF5350' }]}>{stats.action_taken}</Text>
              <Text style={styles.statLabel}>{t('report.filters.actionTaken', 'Action')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#66BB6A' }]}>{stats.dismissed}</Text>
              <Text style={styles.statLabel}>{t('report.filters.dismissed', 'Dismissed')}</Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {(['all', 'pending', 'reviewed', 'action_taken', 'dismissed'] as FilterType[]).map(
              filter => (
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
              )
            )}
          </View>
        </>
      ) : (
        <>
          {/* Appeals Statistics Summary */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#FFC107' }]}>{appealStats.pending}</Text>
              <Text style={styles.statLabel}>{t('appeal.status.pending', 'Pending')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{appealStats.approved}</Text>
              <Text style={styles.statLabel}>{t('appeal.status.approved', 'Approved')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: themeColors.colors.surfaceVariant }]}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{appealStats.rejected}</Text>
              <Text style={styles.statLabel}>{t('appeal.status.rejected', 'Rejected')}</Text>
            </View>
          </View>

          {/* Appeals Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {t(
                'appeal.infoText',
                'Review ban appeals from users. Approving will unban the user.'
              )}
            </Text>
          </View>
        </>
      )}
    </>
  );

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('report.adminTitle', 'Content Reports')} />
      </Appbar.Header>

      {mainTab === 'reports' ? (
        <FlatList
          style={[styles.container, { backgroundColor: themeColors.colors.background }]}
          data={filteredReports}
          keyExtractor={item => item.id || String(Math.random())}
          renderItem={({ item }) => (
            <ReportCard report={item} onStatusChange={handleStatusChange} onUnban={handleUnban} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={styles.loadingText}>{t('report.loading', 'Loading reports...')}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛡️</Text>
                <Text style={styles.emptyText}>{t('report.empty', 'No reports found')}</Text>
                <Text style={styles.emptySubtext}>
                  {t('report.emptySubtext', 'All clear! No content reports to review.')}
                </Text>
              </View>
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          style={[styles.container, { backgroundColor: themeColors.colors.background }]}
          data={appeals}
          keyExtractor={item => item.id || String(Math.random())}
          renderItem={({ item }) => (
            <AppealCard
              appeal={item}
              onApprove={handleApproveAppeal}
              onReject={handleRejectAppeal}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            appealsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color={themeColors.colors.primary} />
                <Text style={styles.loadingText}>{t('appeal.loading', 'Loading appeals...')}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>{t('appeal.empty', 'No appeals found')}</Text>
                <Text style={styles.emptySubtext}>
                  {t('appeal.emptySubtext', 'No pending ban appeals to review.')}
                </Text>
              </View>
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 16,
    },
    mainTabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
    },
    mainTab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    mainTabText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.onSurface,
    },
    infoContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    infoText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    statCard: {
      flex: 1,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    filterText: {
      fontSize: 11,
      color: colors.onSurface,
    },
    emptyContainer: {
      padding: 48,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
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

export default ContentReportsScreen;
