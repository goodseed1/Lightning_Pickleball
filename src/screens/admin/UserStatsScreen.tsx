/**
 * 📊 User Statistics Screen
 * 사용자 통계 대시보드 - DAU, WAU, MAU, Total Users + 사용자 리스트
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Appbar,
  Card,
  Title,
  Text,
  ActivityIndicator,
  useTheme,
  Chip,
  Divider,
} from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import {
  listenForAppStats,
  getStatsHistory,
  AppStats,
  DailyStats,
  getAllUsersForAdmin,
  AdminUserData,
  calculateUserStatsManually,
} from '../../services/adminService';
import { convertEloToLtr } from '../../utils/unifiedRankingUtils';

const UserStatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [statsHistory, setStatsHistory] = useState<DailyStats[]>([]);
  const [userList, setUserList] = useState<AdminUserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Real-time subscription to app stats
  useEffect(() => {
    console.log('[UserStatsScreen] Setting up real-time stats subscription...');

    const unsubscribe = listenForAppStats(
      stats => {
        console.log('[UserStatsScreen] Received real-time stats:', stats);
        setAppStats(stats);
        setLoading(false);
      },
      error => {
        console.error('[UserStatsScreen] Error in stats subscription:', error);
        setLoading(false);
      }
    );

    // Load history for chart (one-time fetch)
    loadStatsHistory();

    return () => {
      console.log('[UserStatsScreen] Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  const loadStatsHistory = async () => {
    try {
      const history = await getStatsHistory(7);
      setStatsHistory(history);
    } catch (error) {
      console.error('[UserStatsScreen] Error loading stats history:', error);
    }
  };

  // 📊 Manual recalculation of stats
  const handleRecalculateStats = async () => {
    Alert.alert(
      t('admin.stats.recalculate.title', '통계 재계산'),
      t(
        'admin.stats.recalculate.message',
        'DAU/WAU/MAU 통계를 지금 바로 재계산합니다. 계속하시겠습니까?'
      ),
      [
        { text: t('common.cancel', '취소'), style: 'cancel' },
        {
          text: t('common.confirm', '확인'),
          onPress: async () => {
            setRecalculating(true);
            try {
              const result = await calculateUserStatsManually();
              Alert.alert(
                t('admin.stats.recalculate.success', '재계산 완료'),
                t(
                  'admin.stats.recalculate.successMessage',
                  `DAU: ${result.dau}, WAU: ${result.wau}, MAU: ${result.mau}`
                )
              );
              // Reload history after recalculation
              loadStatsHistory();
            } catch (error) {
              console.error('[UserStatsScreen] Error recalculating stats:', error);
              Alert.alert(
                t('admin.stats.recalculate.error', '오류'),
                t('admin.stats.recalculate.errorMessage', '통계 재계산 중 오류가 발생했습니다.')
              );
            } finally {
              setRecalculating(false);
            }
          },
        },
      ]
    );
  };

  // Load user list when toggled
  const loadUserList = useCallback(async () => {
    if (userList.length > 0) return; // Already loaded

    setLoadingUsers(true);
    try {
      const users = await getAllUsersForAdmin();
      setUserList(users);
    } catch (error) {
      console.error('[UserStatsScreen] Error loading user list:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [userList.length]);

  const handleToggleUserList = () => {
    if (!showUserList) {
      loadUserList();
    }
    setShowUserList(!showUserList);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString(t('common.locale'), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getRoleLabel = (role: 'admin' | 'manager' | 'member'): string => {
    switch (role) {
      case 'admin':
        return t('admin.stats.userList.roleAdmin');
      case 'manager':
        return t('admin.stats.userList.roleManager');
      default:
        return t('admin.stats.userList.roleMember');
    }
  };

  const getRoleColor = (role: 'admin' | 'manager' | 'member'): string => {
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'manager':
        return '#ff9800';
      default:
        return colors.primary;
    }
  };

  const renderKPICard = (title: string, value: number, icon: string, color: string) => (
    <Card
      style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
    >
      <Card.Content>
        <View style={styles.kpiHeader}>
          <Text style={[styles.kpiTitle, { color: colors.onSurfaceVariant }]}>{title}</Text>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <Title style={[styles.kpiValue, { color }]}>{value.toLocaleString()}</Title>
      </Card.Content>
    </Card>
  );

  const renderChart = () => {
    if (statsHistory.length === 0) {
      return (
        <Card
          style={[
            styles.chartCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            <Title>{t('admin.stats.dauTrend')}</Title>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
              {t('admin.stats.noData')}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const labels = statsHistory.map(stat => {
      const date = new Date(stat.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = statsHistory.map(stat => stat.dau);

    return (
      <Card
        style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
      >
        <Card.Content>
          <Title>{t('admin.stats.dauTrend')}</Title>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels,
                datasets: [
                  {
                    data,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 64}
              height={220}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => {
                  const isDark = colors.background === '#0A0A0A' || colors.background === '#121212';
                  return isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`;
                },
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#2196f3',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Navigate to user profile
  const handleUserPress = (userId: string) => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'UserProfile',
        params: { userId },
      })
    );
  };

  const renderUserItem = ({ item }: { item: AdminUserData }) => {
    const singlesLpr = item.eloRatings.singles ? convertEloToLtr(item.eloRatings.singles) : '-';
    const doublesLpr = item.eloRatings.doubles ? convertEloToLtr(item.eloRatings.doubles) : '-';
    const mixedLpr = item.eloRatings.mixed ? convertEloToLtr(item.eloRatings.mixed) : '-';

    return (
      <View
        style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
      >
        {/* Row 1: Nickname & Email */}
        <View style={styles.userRow}>
          <TouchableOpacity onPress={() => handleUserPress(item.uid)}>
            <Text
              style={[styles.userName, styles.userNameClickable, { color: colors.primary }]}
              numberOfLines={1}
            >
              {item.displayName}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Row 2: Join Date */}
        <View style={styles.userRow}>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {t('admin.stats.userList.joinDate')}:
          </Text>
          <Text style={[styles.value, { color: colors.onSurface }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {/* Row 3: LPR */}
        <View style={styles.userRow}>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>LPR:</Text>
          <View style={styles.lprGroup}>
            <Chip compact style={styles.lprChip} textStyle={styles.lprText}>
              단식: {singlesLpr}
            </Chip>
            <Chip compact style={styles.lprChip} textStyle={styles.lprText}>
              복식: {doublesLpr}
            </Chip>
            <Chip compact style={styles.lprChip} textStyle={styles.lprText}>
              혼복: {mixedLpr}
            </Chip>
          </View>
        </View>

        {/* Row 4: Clubs */}
        {item.clubs.length > 0 && (
          <View style={styles.userRow}>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              {t('admin.stats.userList.clubs')}:
            </Text>
            <View style={styles.clubsContainer}>
              {item.clubs.map((club, index) => (
                <Chip
                  key={`${club.clubId}-${index}`}
                  compact
                  style={[styles.clubChip, { borderColor: getRoleColor(club.role) }]}
                  textStyle={[styles.clubText, { color: colors.onSurface }]}
                >
                  {club.clubName} ({getRoleLabel(club.role)})
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Row 5: Events Created */}
        <View style={styles.userRow}>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {t('admin.stats.userList.eventsCreated')}:
          </Text>
          <Text style={[styles.value, { color: colors.primary }]}>{item.eventsCreated}</Text>
        </View>

        <Divider style={{ marginTop: 8 }} />
      </View>
    );
  };

  if (loading) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('admin.stats.title')} />
        </Appbar.Header>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('admin.stats.title')} />
        <Appbar.Action icon='refresh' onPress={handleRecalculateStats} disabled={recalculating} />
      </Appbar.Header>

      {recalculating && (
        <View style={styles.recalculatingBanner}>
          <ActivityIndicator size='small' color='#fff' />
          <Text style={styles.recalculatingText}>
            {t('admin.stats.recalculating', '통계 재계산 중...')}
          </Text>
        </View>
      )}

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 📊 KPI Grid - 2x2 Layout */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            {renderKPICard(t('admin.stats.totalUsers'), appStats?.totalUsers || 0, '👥', '#2196f3')}
            {renderKPICard(t('admin.stats.dau'), appStats?.dau || 0, '📊', '#4caf50')}
          </View>
          <View style={styles.kpiRow}>
            {renderKPICard(t('admin.stats.wau'), appStats?.wau || 0, '📈', '#ff9800')}
            {renderKPICard(t('admin.stats.mau'), appStats?.mau || 0, '📉', '#f44336')}
          </View>
        </View>

        {renderChart()}

        {appStats && (
          <Card
            style={[
              styles.infoCard,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Card.Content>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                {t('admin.stats.lastUpdated')}:{' '}
                {appStats.lastCalculatedAt.toLocaleString(t('common.locale'))}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* User List Toggle Button */}
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.primary }]}
          onPress={handleToggleUserList}
        >
          <Text style={styles.toggleButtonText}>
            {showUserList
              ? t('admin.stats.userList.hideUsers')
              : t('admin.stats.userList.showUsers')}
          </Text>
        </TouchableOpacity>

        {/* User List */}
        {showUserList && (
          <Card
            style={[
              styles.userListCard,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <Card.Content>
              <Title style={{ marginBottom: 12 }}>{t('admin.stats.userList.title')}</Title>

              {loadingUsers ? (
                <View style={styles.loadingUsersContainer}>
                  <ActivityIndicator size='small' color={colors.primary} />
                  <Text style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
                    {t('admin.stats.userList.loading')}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.userCount, { color: colors.onSurfaceVariant }]}>
                    {t('admin.stats.userList.totalCount', { count: userList.length })}
                  </Text>

                  {/* Legend */}
                  <View style={styles.legendContainer}>
                    <Text style={[styles.legendText, { color: colors.onSurfaceVariant }]}>
                      LPR: S={t('admin.stats.userList.singles')}, D=
                      {t('admin.stats.userList.doubles')}, M={t('admin.stats.userList.mixed')}
                    </Text>
                  </View>

                  <FlatList
                    data={userList}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.uid}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </>
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
  kpiGrid: {
    padding: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleButton: {
    margin: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userListCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  loadingUsersContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  userCount: {
    fontSize: 14,
    marginBottom: 8,
  },
  legendContainer: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  legendText: {
    fontSize: 12,
  },
  userCard: {
    paddingVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 100,
  },
  userNameClickable: {
    textDecorationLine: 'underline',
  },
  userEmail: {
    fontSize: 13,
    flex: 2,
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lprGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
  lprChip: {
    height: 28,
  },
  lprText: {
    fontSize: 12,
  },
  clubsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  clubChip: {
    height: 26,
    borderWidth: 1,
  },
  clubText: {
    fontSize: 11,
  },
  recalculatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: 8,
    gap: 8,
  },
  recalculatingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default UserStatsScreen;
