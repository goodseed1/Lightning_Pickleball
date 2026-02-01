/**
 * Player Stats Card Component
 * Displays detailed player statistics with ELO rating and achievements
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import eloRatingService from '../../services/eloRatingService';

interface PlayerStatsData {
  userId: string;
  profile: {
    nickname: string;
    skillLevel: string;
    photoURL?: string;
  };
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    eloRating: number;
    currentWinStreak: number;
    longestWinStreak: number;
    achievementPoints: number;
    totalAchievements: number;
    clubEventsAttended: number;
    tournamentWins: number;
    recentResults: string[]; // Last 10 match results: 'W', 'L', 'D'
  };
  achievements: Array<{
    id: string;
    name: string;
    icon: string;
    tier: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unlockedAt: any;
  }>;
}

interface PlayerStatsCardProps {
  playerData: PlayerStatsData;
  showComparison?: boolean;
  comparisonPlayer?: PlayerStatsData;
  onAchievementPress?: (achievementId: string) => void;
  onEloHistoryPress?: () => void;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({
  playerData,
  showComparison = false,
  comparisonPlayer,
  onAchievementPress,
  onEloHistoryPress,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'history'>(
    'overview'
  );

  const stats = playerData.stats;
  const winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;
  const eloTier = eloRatingService.getRatingTier(stats.eloRating || 1200) as { color: string; icon: string; name: string };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* ELO Rating Section */}
      <View style={styles.eloSection}>
        <View style={styles.eloHeader}>
          <Text style={styles.sectionTitle}>ELO Rating</Text>
          <TouchableOpacity onPress={onEloHistoryPress}>
            <Ionicons name='trending-up' size={20} color='#2196F3' />
          </TouchableOpacity>
        </View>

        <View style={styles.eloContainer}>
          <View style={styles.eloRating}>
            <Text style={styles.eloNumber}>{stats.eloRating || 1200}</Text>
            <View style={[styles.tierBadge, { backgroundColor: eloTier.color }]}>
              <Text style={styles.tierIcon}>{eloTier.icon}</Text>
              <Text style={styles.tierName}>{eloTier.name}</Text>
            </View>
          </View>

          {showComparison && comparisonPlayer && (
            <View style={styles.comparisonArrow}>
              <Ionicons name='arrow-forward' size={24} color='#666' />
              <Text style={styles.vsText}>VS</Text>
            </View>
          )}
        </View>
      </View>

      {/* Match Statistics */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalMatches}</Text>
          <Text style={styles.statLabel}>Total Matches</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.draws || 0}</Text>
          <Text style={styles.statLabel}>Draws</Text>
        </View>
      </View>

      {/* Win Rate and Streaks */}
      <View style={styles.performanceSection}>
        <View style={styles.performanceCard}>
          <Text style={styles.performanceValue}>{winRate.toFixed(1)}%</Text>
          <Text style={styles.performanceLabel}>Win Rate</Text>
          <View style={[styles.performanceBar, { width: `${Math.min(winRate, 100)}%` }]} />
        </View>

        <View style={styles.streakContainer}>
          <View style={styles.streakCard}>
            <Ionicons name='flame' size={24} color='#FF5722' />
            <Text style={styles.streakValue}>{stats.currentWinStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>

          <View style={styles.streakCard}>
            <Ionicons name='trophy' size={24} color='#FF9800' />
            <Text style={styles.streakValue}>{stats.longestWinStreak || 0}</Text>
            <Text style={styles.streakLabel}>Best Streak</Text>
          </View>
        </View>
      </View>

      {/* Recent Form */}
      <View style={styles.recentFormSection}>
        <Text style={styles.sectionTitle}>Recent Form</Text>
        <View style={styles.formContainer}>
          {(stats.recentResults || []).slice(-10).map((result, index) => (
            <View
              key={index}
              style={[
                styles.formBadge,
                {
                  backgroundColor:
                    result === 'W' ? '#4CAF50' : result === 'L' ? '#F44336' : '#FF9800',
                },
              ]}
            >
              <Text style={styles.formText}>{result}</Text>
            </View>
          ))}
          {(stats.recentResults || []).length === 0 && (
            <Text style={styles.noDataText}>No recent matches</Text>
          )}
        </View>
      </View>

      {/* Tournament and Club Stats */}
      <View style={styles.additionalStats}>
        <View style={styles.additionalStatCard}>
          <Ionicons name='ribbon' size={20} color='#9C27B0' />
          <Text style={styles.additionalStatValue}>{stats.tournamentWins || 0}</Text>
          <Text style={styles.additionalStatLabel}>Tournament Wins</Text>
        </View>

        <View style={styles.additionalStatCard}>
          <Ionicons name='people' size={20} color='#2196F3' />
          <Text style={styles.additionalStatValue}>{stats.clubEventsAttended || 0}</Text>
          <Text style={styles.additionalStatLabel}>Club Events</Text>
        </View>

        <View style={styles.additionalStatCard}>
          <Ionicons name='star' size={20} color='#FF9800' />
          <Text style={styles.additionalStatValue}>{stats.achievementPoints || 0}</Text>
          <Text style={styles.additionalStatLabel}>Achievement Points</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderAchievementsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.achievementSummary}>
        <Text style={styles.achievementCount}>
          {stats.totalAchievements || 0} Achievements Unlocked
        </Text>
        <Text style={styles.achievementPoints}>{stats.achievementPoints || 0} Total Points</Text>
      </View>

      <View style={styles.achievementsList}>
        {playerData.achievements && playerData.achievements.length > 0 ? (
          playerData.achievements.map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              style={styles.achievementCard}
              onPress={() => onAchievementPress?.(achievement.id)}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementTier}>{achievement.tier.toUpperCase()}</Text>
              </View>
              <View
                style={[
                  styles.achievementTierBadge,
                  { backgroundColor: getTierColor(achievement.tier) },
                ]}
              >
                <Text style={styles.achievementTierText}>{achievement.tier}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noAchievements}>
            <Ionicons name='trophy' size={48} color='#ccc' />
            <Text style={styles.noDataText}>No achievements yet</Text>
            <Text style={styles.noDataSubtext}>Play more matches to unlock achievements!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Match History</Text>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>
          Detailed match history and statistics will be available here
        </Text>
      </View>
    </ScrollView>
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '#E0E0E0';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.playerName}>{playerData.profile.nickname}</Text>
        <Text style={styles.skillLevel}>{playerData.profile.skillLevel}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
          onPress={() => setSelectedTab('achievements')}
        >
          <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
            Achievements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'achievements' && renderAchievementsTab()}
        {selectedTab === 'history' && renderHistoryTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContentContainer: {
    height: 400,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  eloSection: {
    marginBottom: 24,
  },
  eloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eloRating: {
    alignItems: 'center',
    padding: 20,
  },
  eloNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  tierName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonArrow: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  vsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statCard: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  performanceSection: {
    marginBottom: 24,
  },
  performanceCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  performanceBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginVertical: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
  },
  recentFormSection: {
    marginBottom: 24,
  },
  formContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  formText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 4,
  },
  additionalStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  achievementSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  achievementCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementPoints: {
    fontSize: 14,
    color: '#666',
  },
  achievementsList: {
    flex: 1,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementTier: {
    fontSize: 12,
    color: '#666',
  },
  achievementTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementTierText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  noAchievements: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  historySection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default PlayerStatsCard;
