/**
 * Club League Standings Component
 * Displays internal club league rankings with points, goal difference, and standings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface LeagueStanding {
  userId: string;
  playerInfo: {
    nickname: string;
    photoURL?: string;
    skillLevel?: string;
  };
  stats: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  form: string[]; // Last 5 results: 'W', 'D', 'L'
  rank: number;
  rankChange: number; // +1, 0, -1 from last update
}

interface ClubLeagueStandingsProps {
  clubId: string;
  leagueId?: string;
  season?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPlayerPress?: (userId: string, playerInfo: any) => void;
  showHeader?: boolean;
  maxPlayers?: number;
}

const ClubLeagueStandings: React.FC<ClubLeagueStandingsProps> = ({
  clubId,
  leagueId,
  season = 'current',
  onPlayerPress,
  showHeader = true,
  maxPlayers = 20,
}) => {
  const { t } = useLanguage();
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'points' | 'goalDiff' | 'goalsFor'>('points');

  const loadStandings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration - replace with actual API call
      const mockStandings = generateMockStandings();
      const sortedStandings = sortStandings(mockStandings, sortBy);

      setStandings(sortedStandings.slice(0, maxPlayers));
    } catch (error: Error | unknown) {
      console.error('Failed to load league standings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy, maxPlayers]);

  useEffect(() => {
    loadStandings();
  }, [clubId, leagueId, season, loadStandings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStandings();
    } catch {
      Alert.alert(t('common.error'), t('errors.failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  };

  const sortStandings = (standings: LeagueStanding[], sortKey: string): LeagueStanding[] => {
    return [...standings]
      .sort((a, b) => {
        switch (sortKey) {
          case 'points': {
            // Primary: Points (descending)
            if (b.stats.points !== a.stats.points) {
              return b.stats.points - a.stats.points;
            }
            // Secondary: Goal difference (descending)
            const goalDiffA = a.stats.goalsFor - a.stats.goalsAgainst;
            const goalDiffB = b.stats.goalsFor - b.stats.goalsAgainst;
            if (goalDiffB !== goalDiffA) {
              return goalDiffB - goalDiffA;
            }
            // Tertiary: Goals scored (descending)
            return b.stats.goalsFor - a.stats.goalsFor;
          }
          case 'goalDiff': {
            const diffA = a.stats.goalsFor - a.stats.goalsAgainst;
            const diffB = b.stats.goalsFor - b.stats.goalsAgainst;
            return diffB - diffA;
          }

          case 'goalsFor':
            return b.stats.goalsFor - a.stats.goalsFor;

          default:
            return 0;
        }
      })
      .map((standing, index) => ({
        ...standing,
        rank: index + 1,
      }));
  };

  const generateMockStandings = (): LeagueStanding[] => {
    const mockPlayers = [
      { nickname: 'Alex Chen', skillLevel: 'advanced' },
      { nickname: 'Maria Rodriguez', skillLevel: 'intermediate' },
      { nickname: 'David Kim', skillLevel: 'expert' },
      { nickname: 'Jennifer Park', skillLevel: 'advanced' },
      { nickname: 'Michael Johnson', skillLevel: 'intermediate' },
      { nickname: 'Sarah Wilson', skillLevel: 'advanced' },
      { nickname: 'James Lee', skillLevel: 'expert' },
      { nickname: 'Lisa Zhang', skillLevel: 'intermediate' },
      { nickname: 'Robert Brown', skillLevel: 'beginner' },
      { nickname: 'Emily Davis', skillLevel: 'advanced' },
    ];

    return mockPlayers.map((player, index) => {
      const matchesPlayed = Math.floor(Math.random() * 15) + 5;
      const wins = Math.floor(Math.random() * matchesPlayed);
      const losses = Math.floor(Math.random() * (matchesPlayed - wins));
      const draws = matchesPlayed - wins - losses;
      const goalsFor = Math.floor(Math.random() * 25) + wins * 2;
      const goalsAgainst = Math.floor(Math.random() * 20) + losses * 2;

      return {
        userId: `user_${index + 1}`,
        playerInfo: {
          nickname: player.nickname,
          skillLevel: player.skillLevel,
        },
        stats: {
          matchesPlayed,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          points: wins * 3 + draws,
        },
        form: generateRandomForm(),
        rank: index + 1,
        rankChange: Math.floor(Math.random() * 3) - 1, // -1, 0, or +1
      };
    });
  };

  const generateRandomForm = (): string[] => {
    const results = ['W', 'D', 'L'];
    return Array.from({ length: 5 }, () => results[Math.floor(Math.random() * results.length)]);
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return { icon: 'arrow-up', color: '#4CAF50' };
    if (change < 0) return { icon: 'arrow-down', color: '#F44336' };
    return { icon: 'remove', color: '#9E9E9E' };
  };

  const getFormResultColor = (result: string) => {
    switch (result) {
      case 'W':
        return '#4CAF50';
      case 'D':
        return '#FF9800';
      case 'L':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderStandingItem = (standing: LeagueStanding, index: number) => {
    const goalDiff = standing.stats.goalsFor - standing.stats.goalsAgainst;
    const rankChange = getRankChangeIcon(standing.rankChange);
    const winRate =
      standing.stats.matchesPlayed > 0
        ? Math.round((standing.stats.wins / standing.stats.matchesPlayed) * 100)
        : 0;

    return (
      <TouchableOpacity
        key={`${standing.userId}-${index}`}
        style={[
          styles.standingRow,
          index < 3 && styles.topThreeRow,
          index === 0 && styles.firstPlaceRow,
        ]}
        onPress={() => onPlayerPress?.(standing.userId, standing.playerInfo)}
      >
        {/* Rank and Change */}
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, index < 3 && styles.topThreeRank]}>{standing.rank}</Text>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Ionicons name={rankChange.icon as any} size={12} color={rankChange.color} />
        </View>

        {/* Player Info */}
        <View style={styles.playerContainer}>
          <Text style={styles.playerName} numberOfLines={1}>
            {standing.playerInfo.nickname}
          </Text>
          <Text style={styles.playerStats}>
            {t('clubLeagueStandings.matchesAndWinRate', {
              matches: standing.stats.matchesPlayed,
              winRate: winRate,
            })}
          </Text>
        </View>

        {/* Match Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{standing.stats.points}</Text>
            <Text style={styles.statLabel}>{t('clubLeagueStandings.points')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {goalDiff >= 0 ? '+' : ''}
              {goalDiff}
            </Text>
            <Text style={styles.statLabel}>{t('clubLeagueStandings.goalDifference')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {standing.stats.goalsFor}:{standing.stats.goalsAgainst}
            </Text>
            <Text style={styles.statLabel}>{t('clubLeagueStandings.goals')}</Text>
          </View>
        </View>

        {/* Recent Form */}
        <View style={styles.formContainer}>
          {standing.form.map((result, idx) => (
            <View
              key={idx}
              style={[styles.formBadge, { backgroundColor: getFormResultColor(result) }]}
            >
              <Text style={styles.formText}>{result}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle' size={48} color='#F44336' />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStandings}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('clubLeagueStandings.title')}</Text>

          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'points' && styles.activeSortButton]}
              onPress={() => setSortBy('points')}
            >
              <Text
                style={[styles.sortButtonText, sortBy === 'points' && styles.activeSortButtonText]}
              >
                {t('clubLeagueStandings.sortByPoints')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'goalDiff' && styles.activeSortButton]}
              onPress={() => setSortBy('goalDiff')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'goalDiff' && styles.activeSortButtonText,
                ]}
              >
                {t('clubLeagueStandings.sortByGoalDiff')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'goalsFor' && styles.activeSortButton]}
              onPress={() => setSortBy('goalsFor')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'goalsFor' && styles.activeSortButtonText,
                ]}
              >
                {t('clubLeagueStandings.sortByGoalsFor')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>{t('clubLeagueStandings.rank')}</Text>
        <Text style={styles.tableHeaderText}>{t('clubLeagueStandings.player')}</Text>
        <Text style={styles.tableHeaderText}>{t('clubLeagueStandings.points')}</Text>
        <Text style={styles.tableHeaderText}>{t('clubLeagueStandings.goalDifference')}</Text>
        <Text style={styles.tableHeaderText}>{t('clubLeagueStandings.recentForm')}</Text>
      </View>

      <ScrollView
        style={styles.standingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
        }
        showsVerticalScrollIndicator={false}
      >
        {standings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='trophy' size={64} color='#ccc' />
            <Text style={styles.emptyTitle}>{t('clubLeagueStandings.noData')}</Text>
            <Text style={styles.emptyDescription}>{t('clubLeagueStandings.noDataDescription')}</Text>
          </View>
        ) : (
          standings.map((standing, index) => renderStandingItem(standing, index))
        )}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.formBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.formText}>W</Text>
          </View>
          <Text style={styles.legendText}>{t('clubLeagueStandings.win')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.formBadge, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.formText}>D</Text>
          </View>
          <Text style={styles.legendText}>{t('clubLeagueStandings.draw')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.formBadge, { backgroundColor: '#F44336' }]}>
            <Text style={styles.formText}>L</Text>
          </View>
          <Text style={styles.legendText}>{t('clubLeagueStandings.loss')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
  },
  activeSortButton: {
    backgroundColor: '#2196F3',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: 'white',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  standingsList: {
    flex: 1,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topThreeRow: {
    backgroundColor: '#fafafa',
  },
  firstPlaceRow: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  topThreeRank: {
    color: '#FF9800',
    fontWeight: '700',
  },
  playerContainer: {
    flex: 2,
    paddingHorizontal: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  playerStats: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  formContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  formBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  formText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClubLeagueStandings;
