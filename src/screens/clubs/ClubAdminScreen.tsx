import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Chip, Surface, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useLanguage } from '../../contexts/LanguageContext';
import { useLocation } from '../../contexts/LocationContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import clubService from '../../services/clubService';
import duesService from '../../services/duesService';
import { formatPriceByCountry } from '../../utils/currencyUtils';

type ClubAdminScreenRouteProp = RouteProp<RootStackParamList, 'ClubAdmin'>;

interface ClubStats {
  totalMembers: number;
  newMembersThisMonth: number;
  activeMembers: number;
  pendingApplications: number;
  overduePayments: number;
  monthlyRevenue: number;
  participationRate: number;
  // 🎯 [KIM FIX] 탐색/클럽 카드와 동일한 통계 추가
  eventCount: number;
  communicationLevel: 'active' | 'normal' | 'quiet';
  memberJoined: number;
  memberLeft: number;
  monthlyFee: number;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
  comingSoon?: boolean;
}

const ClubAdminScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ClubAdminScreenRouteProp>();
  const { t } = useLanguage();
  const { location } = useLocation();
  const { theme } = useTheme();
  const themeColors = getLightningPickleballTheme(theme);
  const { clubId, clubName, userRole } = route.params;

  // Create styles with dynamic theme colors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = useMemo(() => createStyles(themeColors.colors as any), [themeColors.colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [clubStats, setClubStats] = useState<ClubStats>({
    totalMembers: 0,
    newMembersThisMonth: 0,
    activeMembers: 0,
    pendingApplications: 0,
    overduePayments: 0,
    monthlyRevenue: 0,
    participationRate: 0,
    // 🎯 [KIM FIX] 탐색/클럽 카드와 동일한 통계 초기값
    eventCount: 0,
    communicationLevel: 'quiet',
    memberJoined: 0,
    memberLeft: 0,
    monthlyFee: 0,
  });

  const quickActions: QuickAction[] = [
    {
      id: 'member_invitation',
      title: t('clubAdmin.memberInvitation'),
      subtitle: t('clubAdmin.memberInvitationSubtitle'),
      icon: 'person-add-outline',
      color: '#4caf50',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPress: () => (navigation as any).navigate('ClubMemberInvitation', { clubId, clubName }),
    },
    // 🎯 [KIM FIX] 클럽 설정을 클럽 앨범보다 앞으로 이동
    {
      id: 'club_settings',
      title: t('clubAdmin.clubSettings'),
      subtitle: t('clubAdmin.clubSettingsSubtitle'),
      icon: 'settings-outline',
      color: '#795548',
      // 🎯 [KIM FIX] Simplified params - isEditMode is detected by !!clubId in CreateClubScreen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPress: () => (navigation as any).navigate('CreateClub', { clubId }),
    },
    {
      id: 'club_visibility',
      title: t('clubAdmin.clubVisibility'),
      subtitle: t('clubAdmin.clubVisibilitySubtitle'),
      icon: 'shield-checkmark-outline',
      color: '#3f51b5',
      onPress: () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigation as any).navigate('RankingPrivacySettings', {
          clubId,
          clubName,
          currentVisibility: 'public',
        }),
    },
    {
      id: 'club_album',
      title: t('clubAdmin.clubAlbum'),
      subtitle: t('clubAdmin.clubAlbumSubtitle'),
      icon: 'images-outline',
      color: '#607d8b',
      onPress: () => {},
      disabled: true,
      comingSoon: true,
    },
  ];

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch real data from Firestore
      // 🎯 [KIM FIX] 탐색/클럽 카드와 동일한 통계도 함께 로드
      const [members, pendingApprovals, unpaidRecords, clubActivityStats] = await Promise.all([
        clubService.getClubMembers(clubId, 'active'),
        duesService.getPendingApprovalRequests(clubId),
        duesService.getUnpaidDuesRecords(clubId),
        clubService.getMultipleClubStats([clubId]),
      ]);

      // Extract activity stats for this club
      const activityStats = clubActivityStats[clubId] || {
        eventCount: 0,
        communicationLevel: 'quiet',
        memberJoined: 0,
        memberLeft: 0,
        monthlyFee: 0,
      };

      // Calculate statistics
      const totalMembers = members.length;

      // 🎯 [KIM FIX] 30일 기준 날짜 (한 번만 계산)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Calculate new members this month (30일 기준)
      const newMembersThisMonth = members.filter(
        m => m.joinedAt && m.joinedAt >= thirtyDaysAgo
      ).length;

      // Active members (members with recent activity in last 30 days)
      const activeMembers =
        members.filter(m => m.lastActive && m.lastActive >= thirtyDaysAgo).length || totalMembers;

      // Pending applications (payment approval requests)
      const pendingApplicationsCount = pendingApprovals.length;

      // Overdue payments (unpaid + overdue status)
      const overduePaymentsCount = unpaidRecords.filter(
        r => r.status === 'overdue' || r.status === 'unpaid'
      ).length;

      // Calculate monthly revenue (sum of paid dues this month)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const allRecords = await duesService.getAllMembersPaymentHistory(clubId, {
        year: currentYear,
        month: currentMonth,
        status: 'paid',
      });

      const monthlyRevenue = allRecords.reduce(
        (sum, record) => sum + (record.paidAmount || record.amount || 0),
        0
      );

      // Participation rate (active members / total members)
      const participationRate = totalMembers > 0 ? activeMembers / totalMembers : 0;

      setClubStats({
        totalMembers,
        newMembersThisMonth,
        activeMembers,
        pendingApplications: pendingApplicationsCount,
        overduePayments: overduePaymentsCount,
        monthlyRevenue,
        participationRate,
        // 🎯 [KIM FIX] 탐색/클럽 카드와 동일한 통계
        eventCount: activityStats.eventCount,
        communicationLevel: activityStats.communicationLevel as 'active' | 'normal' | 'quiet',
        memberJoined: activityStats.memberJoined,
        memberLeft: activityStats.memberLeft,
        monthlyFee: activityStats.monthlyFee,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set to 0 on error to prevent screen from breaking
      setClubStats({
        totalMembers: 0,
        newMembersThisMonth: 0,
        activeMembers: 0,
        pendingApplications: 0,
        overduePayments: 0,
        monthlyRevenue: 0,
        participationRate: 0,
        eventCount: 0,
        communicationLevel: 'quiet',
        memberJoined: 0,
        memberLeft: 0,
        monthlyFee: 0,
      });
      Alert.alert(t('clubAdmin.dataLoadFailed'), t('clubAdmin.dataLoadFailedMessage'), [
        { text: t('common.ok') },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // 🌍 국가별 화폐로 가격 포맷팅
  const formatCurrency = (amount: number): string => {
    return formatPriceByCountry(amount, location?.country);
  };

  const handleDeleteClub = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDeleteClub = async () => {
    if (deleteConfirmText !== clubName) {
      Alert.alert(t('common.error'), t('clubAdmin.clubNameMismatch'));
      return;
    }

    try {
      setIsDeleting(true);
      await clubService.deleteClub(clubId);

      setShowDeleteModal(false);

      // Navigate to MyClubs screen after successful deletion
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            params: {
              screen: 'MyClubs',
              params: {
                screen: 'MyClubsList',
              },
            },
          },
        ],
      });

      navigation.dispatch(resetAction);

      // Show simple success feedback AFTER navigation dispatch
      Alert.alert(t('common.success'), t('clubAdmin.clubDeleted'));
    } catch (error: unknown) {
      Alert.alert(
        t('common.error'),
        (error instanceof Error ? error.message : null) || t('clubAdmin.deleteError')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeleteConfirmModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType='fade'
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Ionicons name='warning' size={40} color='#ef4444' />
            <Text style={styles.modalTitle}>{t('clubAdmin.deleteClub')}</Text>
          </View>

          <Text style={styles.modalDescription}>{t('clubAdmin.deleteConfirmMessage')}</Text>

          <Text style={styles.modalInputLabel}>{t('clubAdmin.deleteConfirmLabel')}</Text>

          <Text style={styles.clubNameHighlight}>{clubName}</Text>

          <TextInput
            style={styles.modalInput}
            value={deleteConfirmText}
            onChangeText={setDeleteConfirmText}
            placeholder={t('clubAdmin.enterClubName')}
            placeholderTextColor={themeColors.colors.onSurfaceVariant}
            autoCapitalize='none'
            autoCorrect={false}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalDeleteButton,
                deleteConfirmText !== clubName && styles.modalDeleteButtonDisabled,
              ]}
              onPress={confirmDeleteClub}
              disabled={deleteConfirmText !== clubName || isDeleting}
            >
              <Text style={styles.modalDeleteButtonText}>
                {isDeleting ? t('clubAdmin.deleting') : t('clubAdmin.deletePermanently')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 🎯 [KIM FIX] 클럽소통 레벨 텍스트 변환
  const getCommunicationLabel = (): string => {
    switch (clubStats.communicationLevel) {
      case 'active':
        return t('clubAdmin.chatActive');
      case 'normal':
        return t('clubAdmin.chatNormal');
      default:
        return t('clubAdmin.chatQuiet');
    }
  };

  // 🌍 회비 포맷팅 (국가별 화폐)
  const formatFee = (): string => {
    if (!clubStats.monthlyFee || clubStats.monthlyFee === 0) {
      return t('clubAdmin.free');
    }
    return `${formatPriceByCountry(clubStats.monthlyFee, location?.country)}/${t('clubAdmin.perMonth')}`;
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text style={styles.cardTitle}>{t('clubAdmin.clubOverview')}</Text>

        {/* 🆕 [KIM] Show loading indicator while data is being fetched */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={themeColors.colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{clubStats.totalMembers}</Text>
                <Text style={styles.statLabel}>{t('clubAdmin.totalMembers')}</Text>
                {clubStats.newMembersThisMonth > 0 && (
                  <Chip compact style={styles.growthChip} textStyle={styles.growthChipText}>
                    +{clubStats.newMembersThisMonth} {t('clubAdmin.thisMonth')}
                  </Chip>
                )}
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{clubStats.activeMembers}</Text>
                <Text style={styles.statLabel}>{t('clubAdmin.activeMembers')}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {Math.round(clubStats.participationRate * 100)}%
                </Text>
                <Text style={styles.statLabel}>{t('clubAdmin.participation')}</Text>
                <ProgressBar
                  progress={clubStats.participationRate}
                  color={themeColors.colors.primary}
                  style={styles.participationBar}
                />
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatCurrency(clubStats.monthlyRevenue)}</Text>
                <Text style={styles.statLabel}>{t('clubAdmin.monthlyRevenue')}</Text>
              </View>
            </View>

            {/* 🎯 [KIM FIX] 탐색/클럽 카드와 동일한 활동 통계 추가 */}
            <View style={styles.activityStatsGrid}>
              <View style={styles.activityStatsRow}>
                <View style={styles.activityStatItem}>
                  <Text style={styles.activityStatText}>
                    🏆 {t('clubAdmin.events')}: {clubStats.eventCount}
                    {t('clubAdmin.eventsPerMonth')}
                  </Text>
                </View>
                <View style={styles.activityStatItem}>
                  <Text style={styles.activityStatText}>
                    💬 {t('clubAdmin.chat')}: {getCommunicationLabel()}
                  </Text>
                </View>
              </View>
              <View style={styles.activityStatsRow}>
                <View style={styles.activityStatItem}>
                  <Text style={styles.activityStatText}>
                    📈 {t('clubAdmin.members')}: +{clubStats.memberJoined}/-{clubStats.memberLeft}
                  </Text>
                </View>
                <View style={styles.activityStatItem}>
                  <Text style={styles.activityStatText}>
                    💰 {t('clubAdmin.fee')}: {formatFee()}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  const renderQuickActionsCard = () => (
    <Card style={styles.quickActionsCard}>
      <Card.Content>
        <Text style={styles.cardTitle}>{t('clubAdmin.quickActions')}</Text>

        <View style={styles.quickActionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionItem, action.disabled && styles.quickActionItemDisabled]}
              onPress={action.onPress}
              disabled={action.disabled}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={action.disabled ? '#9ca3af' : action.color}
                />
                {action.badge && action.badge > 0 ? (
                  <View style={[styles.badge, { backgroundColor: action.color }]}>
                    <Text style={styles.badgeText}>
                      {action.badge > 99 ? '99+' : String(action.badge)}
                    </Text>
                  </View>
                ) : null}
                {action.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>{t('clubAdmin.comingSoon')}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.quickActionTitle,
                  action.disabled && styles.quickActionTitleDisabled,
                ]}
              >
                {action.title}
              </Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderAlertCard = () => {
    // 🎯 [KIM FIX] 로딩 스켈레톤 제거 - 알림이 없으면 아무것도 표시하지 않음
    const hasAlerts = clubStats.pendingApplications > 0 || clubStats.overduePayments > 0;

    if (isLoading || !hasAlerts) return null;

    return (
      <Card style={styles.alertCard}>
        <Card.Content>
          <View style={styles.alertHeader}>
            <Ionicons name='warning-outline' size={20} color={themeColors.colors.warning} />
            <Text style={styles.alertTitle}>{t('clubAdmin.attentionRequired')}</Text>
          </View>

          {clubStats.pendingApplications > 0 && (
            <TouchableOpacity
              style={styles.alertItem}
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate('MainTabs', {
                  screen: 'MyClubs',
                  params: {
                    screen: 'ClubDetail',
                    params: { clubId, initialTab: 'members', initialSubTab: 'applications' },
                  },
                })
              }
            >
              <Text style={styles.alertText}>
                {clubStats.pendingApplications} {t('clubAdmin.pendingApplications')}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={themeColors.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}

          {clubStats.overduePayments > 0 && (
            <TouchableOpacity
              style={styles.alertItem}
              onPress={() =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigation as any).navigate('ClubDuesManagement', {
                  clubId,
                  clubName,
                  initialTab: 2,
                })
              }
            >
              <Text style={styles.alertText}>
                {clubStats.overduePayments} {t('clubAdmin.overduePayments')}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={themeColors.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </Card.Content>
      </Card>
    );
  };

  // 🔒 Only show Danger Zone to admin (not manager)
  const renderDangerZone = () => {
    if (userRole !== 'admin') {
      return null;
    }

    return (
      <Card style={[styles.dangerCard]}>
        <Card.Content>
          <Text style={styles.dangerTitle}>{t('clubAdmin.dangerZone')}</Text>
          <Text style={styles.dangerDescription}>{t('clubAdmin.dangerDescription')}</Text>

          <Button
            mode='contained'
            buttonColor='#dc3545'
            textColor='white'
            style={styles.deleteButton}
            onPress={handleDeleteClub}
            icon='delete-outline'
          >
            {t('clubAdmin.deleteClubPermanently')}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='chevron-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('clubAdmin.title')}</Text>
          <Text style={styles.headerSubtitle}>{clubName}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name='refresh-outline' size={24} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {renderAlertCard()}
        {renderStatsCard()}
        {renderQuickActionsCard()}
        {renderDangerZone()}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      {renderDeleteConfirmModal()}
    </SafeAreaView>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      elevation: 2,
      backgroundColor: colors.surface,
    },
    backButton: {
      padding: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    refreshButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 16,
    },
    // 🆕 [KIM] Loading indicator styles (dark mode compatible)
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.onSurface, // 🎨 Changed to onSurface for better visibility in dark mode
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      alignItems: 'center',
      marginBottom: 16,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'center',
    },
    growthChip: {
      marginTop: 4,
      backgroundColor: colors.surfaceVariant,
    },
    growthChipText: {
      fontSize: 10,
      color: colors.success,
    },
    participationBar: {
      width: 60,
      height: 4,
      marginTop: 4,
    },
    alertCard: {
      marginBottom: 16,
      backgroundColor: colors.warningContainer,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onWarningContainer,
      marginLeft: 8,
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    alertText: {
      fontSize: 14,
      color: colors.onSurface,
      flex: 1,
    },
    quickActionsCard: {
      marginBottom: 16,
      backgroundColor: colors.surface,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionItem: {
      width: '48%',
      alignItems: 'center',
      marginBottom: 20,
      padding: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    quickActionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 4,
    },
    quickActionSubtitle: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 14,
    },
    quickActionItemDisabled: {
      opacity: 0.6,
    },
    quickActionTitleDisabled: {
      color: colors.onSurfaceVariant,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: -6,
      right: -10,
      backgroundColor: '#f59e0b',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    comingSoonText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: 'bold',
    },
    dangerCard: {
      margin: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.errorContainer,
      backgroundColor: colors.errorContainer,
    },
    dangerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onErrorContainer,
      marginBottom: 8,
    },
    dangerDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 20,
    },
    deleteButton: {
      marginTop: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ef4444',
      marginTop: 12,
    },
    modalDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    modalInputLabel: {
      fontSize: 14,
      color: colors.onSurface,
      marginBottom: 8,
    },
    clubNameHighlight: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 12,
      textAlign: 'center',
      padding: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.onSurface,
      backgroundColor: colors.surfaceVariant,
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      alignItems: 'center',
    },
    modalCancelButtonText: {
      fontSize: 16,
      color: colors.onSurface,
      fontWeight: '600',
    },
    modalDeleteButton: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      backgroundColor: '#ef4444',
      alignItems: 'center',
    },
    modalDeleteButtonDisabled: {
      backgroundColor: '#9ca3af',
      opacity: 0.6,
    },
    modalDeleteButtonText: {
      fontSize: 16,
      color: '#ffffff',
      fontWeight: '600',
    },
    // 🎯 [KIM FIX] Activity Stats Grid Styles (탐색/클럽 카드와 동일)
    activityStatsGrid: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    activityStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    activityStatItem: {
      flex: 1,
    },
    activityStatText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
  });

export default ClubAdminScreen;
