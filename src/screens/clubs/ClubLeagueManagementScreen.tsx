import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useClub } from '../../contexts/ClubContext';
import { useTheme } from '../../hooks/useTheme';
import leagueService from '../../services/leagueService';
import { League, LeagueStatus, LeagueMatch } from '../../types/league';
import CreateClubLeagueForm from '../../components/clubs/leagues/CreateClubLeagueForm';
import { modalStyles } from '../../styles/modalStyles';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ClubLeagueManagementScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ClubLeagueManagement'
>;
type ClubLeagueManagementScreenRouteProp = RouteProp<RootStackParamList, 'ClubLeagueManagement'>;

// Extend theme colors to include warning colors
declare module 'react-native-paper' {
  interface MD3Colors {
    warningContainer: string;
    warning: string;
    onWarningContainer: string;
  }
}

const ClubLeagueManagementScreen = () => {
  const navigation = useNavigation<ClubLeagueManagementScreenNavigationProp>();
  const route = useRoute<ClubLeagueManagementScreenRouteProp>();
  const { t } = useLanguage();
  useAuth(); // Required for authentication context
  const { currentClub } = useClub();
  const { paperTheme: theme } = useTheme();

  // Get clubId and autoCreate from route params or current club context
  const clubId = route.params?.clubId || currentClub?.id;
  const autoCreate = route.params?.autoCreate;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [matches, setMatches] = useState<{ [leagueId: string]: LeagueMatch[] }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const loadLeagues = useCallback(async () => {
    if (!clubId) return;
    try {
      const allLeagues = await leagueService.getClubLeagues(clubId);
      setLeagues(allLeagues);

      // 각 리그의 경기 정보도 로드하여 완료 가능 여부 확인
      const matchesData: { [leagueId: string]: LeagueMatch[] } = {};
      await Promise.all(
        allLeagues.map(async league => {
          if (league.status === 'ongoing') {
            try {
              const leagueMatches = await leagueService.getLeagueMatches(league.id);
              matchesData[league.id] = leagueMatches;
            } catch (error) {
              console.error(`Error loading matches for league ${league.id}:`, error);
              matchesData[league.id] = [];
            }
          }
        })
      );
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) {
      loadLeagues();
    }
  }, [clubId, loadLeagues]);

  // Auto-refresh when screen comes into focus (e.g., after deleting a league)
  useFocusEffect(
    useCallback(() => {
      if (clubId) {
        loadLeagues();
      }
    }, [clubId, loadLeagues])
  );

  // Auto-open create form if autoCreate parameter is true
  useEffect(() => {
    if (autoCreate) {
      setShowCreateForm(true);
    }
  }, [autoCreate]);

  const canConcludeLeague = (league: League): boolean => {
    // 진행 중인 리그만 종료 가능
    if (league.status !== 'ongoing') return false;

    // 해당 리그의 모든 경기가 완료되었는지 확인
    const leagueMatches = matches[league.id] || [];
    if (leagueMatches.length === 0) return false;

    // 모든 경기가 완료되었거나 승인 대기 중인 경우 우승자 선정 가능
    return leagueMatches.every(
      match => match.status === 'completed' || match.status === 'pending_approval'
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeagues();
  };

  const handleCreateLeagueSuccess = (leagueId: string) => {
    setShowCreateForm(false);
    loadLeagues();

    // Navigate to the new league details
    if (clubId) {
      navigation.navigate('LeagueDetail', { leagueId, clubId });
    }
  };

  const getLeagueStatusColor = (status: LeagueStatus) => {
    switch (status) {
      case 'preparing':
        return '#9e9e9e';
      case 'open':
        return '#ff9800';
      case 'ongoing':
        return '#4caf50';
      case 'playoffs':
        return '#ffc107';
      case 'completed':
        return '#2196f3';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getLeagueStatusText = (status: LeagueStatus) => {
    return t(`clubLeagueManagement.status.${status}`);
  };

  const renderLeagueCard = (league: League) => {
    const participantCount = league.participants.length;
    const maxParticipants = league.settings.maxParticipants;
    const champion = league.champion;

    return (
      <TouchableOpacity
        key={league.id}
        style={dynamicStyles.leagueCard}
        onPress={() => {
          if (clubId) {
            navigation.navigate('LeagueDetail', { leagueId: league.id, clubId });
          }
        }}
      >
        <View style={styles.leagueHeader}>
          <View style={styles.leagueTitleContainer}>
            <Text style={[styles.leagueTitle, { color: theme.colors.onSurface }]}>
              {league.name}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: getLeagueStatusColor(league.status) }]}
            >
              <Text style={styles.statusText}>{getLeagueStatusText(league.status)}</Text>
            </View>
          </View>

          <Ionicons name='chevron-forward' size={20} color={theme.colors.onSurfaceVariant} />
        </View>

        <View style={styles.leagueInfo}>
          <View style={styles.infoRow}>
            <Ionicons name='people-outline' size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              {t('clubLeagueManagement.participants', {
                count: participantCount,
                max: maxParticipants,
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name='calendar-outline' size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              {league.startDate.toDate().toLocaleDateString()} -{' '}
              {league.endDate.toDate().toLocaleDateString()}
            </Text>
          </View>

          {champion && (
            <View style={styles.infoRow}>
              <Ionicons name='trophy-outline' size={16} color='#ffc107' />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubLeagueManagement.champion', { name: champion.playerName })}
              </Text>
            </View>
          )}

          {league.currentRound && league.status === 'ongoing' ? (
            <View style={styles.infoRow}>
              <Ionicons name='flag-outline' size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubLeagueManagement.currentRound', {
                  current: league.currentRound,
                  total: league.totalRounds,
                })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 관리 버튼들 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
            ]}
            onPress={() => {
              if (clubId) {
                navigation.navigate('LeagueDetail', {
                  leagueId: league.id,
                  clubId,
                  initialTab: 'matches',
                });
              }
            }}
          >
            <Ionicons name='tennisball' size={16} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
              {t('clubLeagueManagement.manageMatches')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
            ]}
            onPress={() => {
              if (clubId) {
                navigation.navigate('LeagueDetail', { leagueId: league.id, clubId });
              }
            }}
          >
            <Ionicons name='settings-outline' size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.actionButtonText, { color: theme.colors.onSurfaceVariant }]}>
              {t('clubLeagueManagement.manageDetails')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 우승자 선정하기 버튼 */}
        {canConcludeLeague(league) && (
          <View style={styles.concludeButtonContainer}>
            <TouchableOpacity
              style={styles.concludeButton}
              onPress={() =>
                navigation.navigate('ConcludeLeague', {
                  leagueId: league.id,
                  leagueName: league.name,
                })
              }
            >
              <Ionicons name='trophy' size={20} color='#fff' />
              <Text style={styles.concludeButtonText}>
                {t('clubLeagueManagement.selectWinner')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {league.status === 'ongoing' && !canConcludeLeague(league) && (
          <View
            style={[
              styles.progressInfo,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { backgroundColor: (theme.colors as any).warningContainer },
            ]}
          >
            <Ionicons
              name='information-circle-outline'
              size={16}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              color={(theme.colors as any).warning}
            />
            <Text
              style={[
                styles.progressInfoText,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                { color: (theme.colors as any).onWarningContainer },
              ]}
            >
              {t('clubLeagueManagement.winnerSelectionInfo')}
            </Text>
          </View>
        )}

        {league.stats && (
          <View style={[styles.leagueStats, { borderTopColor: theme.colors.outline }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {league.stats.totalMatches}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubLeagueManagement.stats.totalMatches')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {league.stats.completedMatches}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubLeagueManagement.stats.completed')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {Math.round((league.stats.completedMatches / league.stats.totalMatches) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('clubLeagueManagement.stats.progress')}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const activeLeagues = leagues.filter(l =>
    ['preparing', 'open', 'ongoing', 'playoffs'].includes(l.status)
  );

  const completedLeagues = leagues.filter(l => ['completed', 'cancelled'].includes(l.status));

  const displayedLeagues = activeTab === 'active' ? activeLeagues : completedLeagues;

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    leagueCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {t('clubLeagueManagement.loadingLeagues')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('clubLeagueManagement.title')}
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateForm(true)}>
          <Ionicons name='add' size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'active' && { color: theme.colors.primary },
            ]}
          >
            {t('clubLeagueManagement.tabs.active')}
          </Text>
          {activeLeagues.length > 0 ? (
            <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.tabBadgeText, { color: theme.colors.onPrimary }]}>
                {activeLeagues.length}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'completed' && { color: theme.colors.primary },
            ]}
          >
            {t('clubLeagueManagement.tabs.completed')}
          </Text>
          {completedLeagues.length > 0 ? (
            <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.tabBadgeText, { color: theme.colors.onPrimary }]}>
                {completedLeagues.length}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* League List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {displayedLeagues.length > 0 ? (
          displayedLeagues.map(renderLeagueCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name='trophy-outline'
              size={64}
              color={theme.colors.outlineVariant}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {activeTab === 'active'
                ? t('clubLeagueManagement.empty.noActiveLeagues')
                : t('clubLeagueManagement.empty.noCompletedLeagues')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {activeTab === 'active' ? t('clubLeagueManagement.empty.createNewLeague') : ''}
            </Text>
            {activeTab === 'active' ? (
              <TouchableOpacity
                style={[
                  styles.emptyCreateButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
                ]}
                onPress={() => setShowCreateForm(true)}
              >
                <Ionicons name='add-circle-outline' size={20} color={theme.colors.primary} />
                <Text style={[styles.emptyCreateButtonText, { color: theme.colors.primary }]}>
                  {t('clubLeagueManagement.createLeague')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Create League Modal */}
      <Modal
        visible={showCreateForm}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowCreateForm(false)}
      >
        <SafeAreaView style={dynamicStyles.modalContainer}>
          <View style={[modalStyles.modalHeader, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              onPress={() => setShowCreateForm(false)}
              style={modalStyles.modalCloseButton}
            >
              <Ionicons name='close' size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {clubId && (
            <CreateClubLeagueForm
              clubId={clubId}
              onSuccess={handleCreateLeagueSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#1976d2',
  },
  tabBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  leagueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leagueTitleContainer: {
    flex: 1,
    gap: 8,
  },
  leagueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  leagueInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  leagueStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Modal styles (common styles imported from modalStyles)
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  concludeButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  concludeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  concludeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    gap: 8,
  },
  progressInfoText: {
    fontSize: 12,
    color: '#e65100',
    flex: 1,
  },
});

export default ClubLeagueManagementScreen;
