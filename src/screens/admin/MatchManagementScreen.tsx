/**
 * 🏆 Match Management Screen
 * 경기 관리 - 토너먼트, 리그, 이벤트 경기 각각 별도 관리
 *
 * 🎯 [KIM FIX] Refactored to query correct collections:
 * - Events: `events` collection
 * - Tournaments: `tournaments/{id}/matches` subcollection
 * - Leagues: `leagues/{id}/matches` subcollection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, TouchableOpacity } from 'react-native';
import {
  Appbar,
  Card,
  Text,
  ActivityIndicator,
  useTheme,
  Chip,
  Searchbar,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Match type for unified display
interface MatchItem {
  id: string;
  player1Name: string;
  player2Name: string;
  player1Id?: string;
  player2Id?: string;
  score?: string;
  winnerId?: string;
  matchType: 'singles' | 'doubles';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'pending';
  createdAt?: Date;
  completedAt?: Date;
  contextName?: string; // Tournament/League/Event name
  contextId?: string; // Parent ID
}

type TabType = 'events' | 'tournaments' | 'leagues';

const MatchManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats for each tab
  const [stats, setStats] = useState({
    events: { total: 0, completed: 0, inProgress: 0 },
    tournaments: { total: 0, completed: 0, inProgress: 0 },
    leagues: { total: 0, completed: 0, inProgress: 0 },
  });

  // Load data based on active tab
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        await loadEvents();
      } else if (activeTab === 'tournaments') {
        await loadTournamentMatches();
      } else if (activeTab === 'leagues') {
        await loadLeagueMatches();
      }
    } catch (error) {
      console.error('[MatchManagement] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(
        match =>
          match.player1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.player2Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.contextName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMatches(filtered);
    }
  }, [searchQuery, matches]);

  // Load Events from 'events' collection
  const loadEvents = async () => {
    const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(100));
    const eventsSnapshot = await getDocs(eventsQuery);

    const eventsData: MatchItem[] = eventsSnapshot.docs.map(doc => {
      const data = doc.data();

      // Determine status
      let status: MatchItem['status'] = 'scheduled';
      if (data.status === 'cancelled') {
        status = 'cancelled';
      } else if (data.status === 'completed') {
        status = 'completed';
      } else if (data.status === 'in_progress' || data.status === 'ongoing') {
        status = 'in_progress';
      } else if (data.status === 'partner_pending') {
        status = 'pending';
      }

      return {
        id: doc.id,
        player1Name: data.hostName || data.hostId || 'Host',
        player2Name: data.hostPartnerName || '-',
        player1Id: data.hostId,
        player2Id: data.hostPartnerId,
        score: '',
        winnerId: undefined,
        matchType: data.gameType?.includes('doubles') ? 'doubles' : 'singles',
        status,
        createdAt: data.createdAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        contextName: data.title || 'Event',
        contextId: doc.id,
      };
    });

    setMatches(eventsData);
    setFilteredMatches(eventsData);

    // Update stats
    const completed = eventsData.filter(m => m.status === 'completed').length;
    const inProgress = eventsData.filter(
      m => m.status === 'in_progress' || m.status === 'pending'
    ).length;
    setStats(prev => ({
      ...prev,
      events: { total: eventsData.length, completed, inProgress },
    }));
  };

  // Load Tournament Matches using collectionGroup
  const loadTournamentMatches = async () => {
    // Get all tournaments first
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const tournamentsSnapshot = await getDocs(tournamentsQuery);

    const allMatches: MatchItem[] = [];

    // For each tournament, get its matches
    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournamentData = tournamentDoc.data();
      const matchesQuery = query(
        collection(db, 'tournaments', tournamentDoc.id, 'matches'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      try {
        const matchesSnapshot = await getDocs(matchesQuery);

        matchesSnapshot.docs.forEach(matchDoc => {
          const data = matchDoc.data();

          let status: MatchItem['status'] = 'scheduled';
          if (data.status === 'completed') {
            status = 'completed';
          } else if (data.status === 'in_progress') {
            status = 'in_progress';
          } else if (data.status === 'pending') {
            status = 'pending';
          }

          allMatches.push({
            id: matchDoc.id,
            player1Name: data.player1?.playerName || 'TBD',
            player2Name: data.player2?.playerName || 'TBD',
            player1Id: data.player1?.playerId,
            player2Id: data.player2?.playerId,
            score: data.score || '',
            winnerId: data._winner,
            matchType: tournamentData.eventType?.includes('doubles') ? 'doubles' : 'singles',
            status,
            createdAt: data.createdAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            contextName: tournamentData.name || 'Tournament',
            contextId: tournamentDoc.id,
          });
        });
      } catch {
        // Skip tournaments without matches subcollection
      }
    }

    setMatches(allMatches);
    setFilteredMatches(allMatches);

    // Update stats
    const completed = allMatches.filter(m => m.status === 'completed').length;
    const inProgress = allMatches.filter(
      m => m.status === 'in_progress' || m.status === 'scheduled'
    ).length;
    setStats(prev => ({
      ...prev,
      tournaments: { total: allMatches.length, completed, inProgress },
    }));
  };

  // Load League Matches
  const loadLeagueMatches = async () => {
    // Get all leagues first
    const leaguesQuery = query(collection(db, 'leagues'), orderBy('createdAt', 'desc'), limit(50));
    const leaguesSnapshot = await getDocs(leaguesQuery);

    const allMatches: MatchItem[] = [];

    // For each league, get its matches
    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data();
      const matchesQuery = query(collection(db, 'leagues', leagueDoc.id, 'matches'), limit(50));

      try {
        const matchesSnapshot = await getDocs(matchesQuery);

        matchesSnapshot.docs.forEach(matchDoc => {
          const data = matchDoc.data();

          let status: MatchItem['status'] = 'scheduled';
          if (data.status === 'completed') {
            status = 'completed';
          } else if (data.status === 'in_progress') {
            status = 'in_progress';
          } else if (data.status === 'pending') {
            status = 'pending';
          }

          // Format score from sets
          let score = '';
          if (data.score?.sets && Array.isArray(data.score.sets)) {
            score = data.score.sets
              .map(
                (set: { player1Games?: number; player2Games?: number }) =>
                  `${set.player1Games || 0}-${set.player2Games || 0}`
              )
              .join(', ');
          } else if (data.score?.finalScore) {
            score = data.score.finalScore;
          }

          allMatches.push({
            id: matchDoc.id,
            player1Name: data.player1Name || 'TBD',
            player2Name: data.player2Name || 'TBD',
            player1Id: data.player1Id,
            player2Id: data.player2Id,
            score,
            winnerId: data._winner,
            matchType: leagueData.eventType?.includes('doubles') ? 'doubles' : 'singles',
            status,
            createdAt: data.createdAt?.toDate(),
            completedAt: data.actualDate?.toDate(),
            contextName: leagueData.name || 'League',
            contextId: leagueDoc.id,
          });
        });
      } catch {
        // Skip leagues without matches subcollection
      }
    }

    setMatches(allMatches);
    setFilteredMatches(allMatches);

    // Update stats
    const completed = allMatches.filter(m => m.status === 'completed').length;
    const inProgress = allMatches.filter(
      m => m.status === 'in_progress' || m.status === 'scheduled'
    ).length;
    setStats(prev => ({
      ...prev,
      leagues: { total: allMatches.length, completed, inProgress },
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: MatchItem['status']) => {
    switch (status) {
      case 'scheduled':
        return '#2196f3';
      case 'in_progress':
        return '#ff9800';
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      case 'pending':
        return '#9c27b0';
      default:
        return colors.primary;
    }
  };

  const getStatusLabel = (status: MatchItem['status']) => {
    switch (status) {
      case 'scheduled':
        return t('admin.matchManagement.scheduled', '예정');
      case 'in_progress':
        return t('admin.matchManagement.inProgress', '진행중');
      case 'completed':
        return t('admin.matchManagement.completed', '완료');
      case 'cancelled':
        return t('admin.matchManagement.cancelled', '취소됨');
      case 'pending':
        return t('admin.matchManagement.pending', '대기중');
      default:
        return status;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days < 1) {
      return t('admin.matchManagement.today', '오늘');
    } else if (days < 7) {
      return `${days}${t('admin.matchManagement.daysAgo', '일 전')}`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const currentStats = stats[activeTab];

  if (loading && !refreshing) {
    return (
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('admin.matchManagement.title', '경기 관리')} />
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
        <Appbar.Content title={t('admin.matchManagement.title', '경기 관리')} />
        <Appbar.Action icon='refresh' onPress={onRefresh} />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={value => setActiveTab(value as TabType)}
            buttons={[
              {
                value: 'events',
                label: `${t('admin.matchManagement.events', '이벤트')} (${stats.events.total})`,
                icon: '📅',
              },
              {
                value: 'tournaments',
                label: `${t('admin.matchManagement.tournaments', '토너먼트')} (${stats.tournaments.total})`,
                icon: '🏆',
              },
              {
                value: 'leagues',
                label: `${t('admin.matchManagement.leagues', '리그')} (${stats.leagues.total})`,
                icon: '🎾',
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Summary Card */}
        <Card
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>📊</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {currentStats.total}
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.matchManagement.total', '전체')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>🏆</Text>
                <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
                  {currentStats.completed}
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.matchManagement.completed', '완료')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={{ fontSize: 28 }}>🎾</Text>
                <Text style={[styles.summaryValue, { color: '#ff9800' }]}>
                  {currentStats.inProgress}
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {t('admin.matchManagement.inProgress', '진행중')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Search */}
        <Searchbar
          placeholder={t('admin.matchManagement.searchPlaceholder', '선수 이름으로 검색...')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        />

        {/* Match List */}
        <Card
          style={[
            styles.listCard,
            { backgroundColor: colors.surface, borderColor: colors.outline },
          ]}
        >
          <Card.Content>
            {filteredMatches.length === 0 ? (
              <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: 20 }}>
                {searchQuery
                  ? t('admin.matchManagement.noResults', '검색 결과가 없습니다')
                  : t('admin.matchManagement.noMatches', '등록된 경기가 없습니다')}
              </Text>
            ) : (
              filteredMatches.map((match, index) => (
                <View key={`${match.contextId}-${match.id}`}>
                  <TouchableOpacity
                    style={styles.matchItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      console.log('[MatchManagement] Match pressed:', match.id, match.contextId);
                    }}
                  >
                    <View style={styles.matchInfo}>
                      <View style={styles.matchHeader}>
                        <Chip
                          compact
                          style={[
                            styles.statusChip,
                            { backgroundColor: getStatusColor(match.status) },
                          ]}
                          textStyle={{ color: '#fff', fontSize: 10 }}
                        >
                          {getStatusLabel(match.status)}
                        </Chip>
                        {match.createdAt && (
                          <Text style={[styles.matchDate, { color: colors.onSurfaceVariant }]}>
                            {formatDate(match.createdAt)}
                          </Text>
                        )}
                      </View>

                      {/* Context Name (Tournament/League/Event title) */}
                      {match.contextName && (
                        <Text
                          style={[styles.contextName, { color: colors.primary }]}
                          numberOfLines={1}
                        >
                          {activeTab === 'events'
                            ? '📅'
                            : activeTab === 'tournaments'
                              ? '🏆'
                              : '🎾'}{' '}
                          {match.contextName}
                        </Text>
                      )}

                      <View style={styles.playersContainer}>
                        <Text
                          style={[
                            styles.playerName,
                            { color: colors.onSurface },
                            match.winnerId === match.player1Id && styles.winnerName,
                          ]}
                        >
                          {match.player1Name}
                          {match.winnerId === match.player1Id && ' 🏆'}
                        </Text>
                        <Text style={[styles.vsText, { color: colors.onSurfaceVariant }]}>vs</Text>
                        <Text
                          style={[
                            styles.playerName,
                            { color: colors.onSurface },
                            match.winnerId === match.player2Id && styles.winnerName,
                          ]}
                        >
                          {match.player2Name}
                          {match.winnerId === match.player2Id && ' 🏆'}
                        </Text>
                      </View>
                      {match.score && (
                        <Text style={[styles.scoreText, { color: colors.primary }]}>
                          {match.score}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {index < filteredMatches.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
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
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segmentedButtons: {
    borderRadius: 12,
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  listCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  matchItem: {
    paddingVertical: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusChip: {
    height: 20,
  },
  matchDate: {
    fontSize: 11,
  },
  contextName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  winnerName: {
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    marginVertical: 4,
  },
  bottomPadding: {
    height: 32,
  },
});

export default MatchManagementScreen;
