import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Avatar,
  Chip,
  useTheme,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import LeaderboardService, {
  UserRanking,
  LeaderboardCategory,
} from '../../services/LeaderboardService';
import { useAuth } from '../../contexts/AuthContext';

interface RankingItemProps {
  ranking: UserRanking;
  isCurrentUser?: boolean;
  showDetails?: boolean;
}

function RankingItem({ ranking, isCurrentUser = false, showDetails = false }: RankingItemProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return { name: 'looks-one', color: '#FFD700' };
    if (rank === 2) return { name: 'looks-two', color: '#C0C0C0' };
    if (rank === 3) return { name: 'looks-3', color: '#CD7F32' };
    return { name: 'emoji-events', color: theme.colors.outline };
  };

  const getTierColor = (tier: string) => {
    const colors = {
      Master: '#FF6B35',
      Diamond: '#00BCD4',
      Platinum: '#9C27B0',
      Gold: '#FFD700',
      Silver: '#C0C0C0',
      Bronze: '#CD7F32',
    };
    return colors[tier as keyof typeof colors] || theme.colors.outline;
  };

  const getRankChange = () => {
    if (!ranking.previousRank || ranking.previousRank === ranking.rank) {
      return { icon: 'trending-flat', color: theme.colors.outline, text: '-' };
    }

    if (ranking.rank < ranking.previousRank) {
      const change = ranking.previousRank - ranking.rank;
      return { icon: 'trending-up', color: '#4CAF50', text: `+${change}` };
    } else {
      const change = ranking.rank - ranking.previousRank;
      return { icon: 'trending-down', color: '#F44336', text: `-${change}` };
    }
  };

  const rankIcon = getRankIcon(ranking.rank);
  const rankChange = getRankChange();

  return (
    <Card
      style={[
        styles.rankingCard,
        isCurrentUser && {
          borderWidth: 2,
          borderColor: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}10`,
        },
      ]}
    >
      <Card.Content style={styles.rankingContent}>
        {/* 왼쪽: 순위 및 아바타 */}
        <View style={styles.rankingLeft}>
          <View style={styles.rankSection}>
            <Icon name={rankIcon.name} size={24} color={rankIcon.color} />
            <Title style={[styles.rankNumber, { color: rankIcon.color }]}>{ranking.rank}</Title>
          </View>

          <Avatar.Image size={48} source={{ uri: ranking.profileImage }} style={styles.avatar} />
        </View>

        {/* 중간: 사용자 정보 */}
        <View style={styles.rankingMiddle}>
          <View style={styles.userInfo}>
            <Title style={styles.username}>
              {ranking.username}
              {isCurrentUser && <Icon name='person' size={16} color={theme.colors.primary} />}
            </Title>

            <View style={styles.tierContainer}>
              <Chip
                style={[styles.tierChip, { backgroundColor: getTierColor(ranking.tier) }]}
                textStyle={styles.tierText}
              >
                {ranking.tier}
              </Chip>

              {ranking.badges.length > 0 && <Icon name='military-tech' size={16} color='#FFD700' />}
            </View>
          </View>

          {showDetails && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>{t('leaderboard.screen.winRate')}</Paragraph>
                <Paragraph style={styles.statValue}>{ranking.stats.winRate.toFixed(1)}%</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>{t('leaderboard.screen.level')}</Paragraph>
                <Paragraph style={styles.statValue}>
                  {Math.round(ranking.stats.skillLevel)}
                </Paragraph>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>{t('leaderboard.screen.matches')}</Paragraph>
                <Paragraph style={styles.statValue}>{ranking.stats.totalMatches}</Paragraph>
              </View>
            </View>
          )}
        </View>

        {/* 오른쪽: 점수 및 변화 */}
        <View style={styles.rankingRight}>
          <Title style={styles.score}>{ranking.score}</Title>

          <View style={styles.changeContainer}>
            <Icon name={rankChange.icon} size={16} color={rankChange.color} />
            <Paragraph style={[styles.changeText, { color: rankChange.color }]}>
              {rankChange.text}
            </Paragraph>
          </View>

          {ranking.streak.current > 2 && (
            <View style={styles.streakContainer}>
              <Icon name='local-fire-department' size={14} color='#FF6B35' />
              <Paragraph style={styles.streakText}>{ranking.streak.current}</Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

export default function LeaderboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<LeaderboardCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory | null>(null);
  const [userRanking, setUserRanking] = useState<{
    global: UserRanking;
    categories: { [categoryId: string]: UserRanking };
  } | null>(null);

  const loadLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [categoriesData, userRankingData] = await Promise.all([
        LeaderboardService.getLeaderboardCategories(),
        user ? LeaderboardService.getUserRanking(user.uid) : null,
      ]);

      setCategories(categoriesData);
      setSelectedCategory(categoriesData[0] || null);
      setUserRanking(userRankingData);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboardData();
    setRefreshing(false);
  };

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContent}
    >
      {categories.map(category => (
        <TouchableOpacity key={category.id} onPress={() => setSelectedCategory(category)}>
          <Chip
            selected={selectedCategory?.id === category.id}
            style={[
              styles.categoryChip,
              selectedCategory?.id === category.id && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            textStyle={[
              selectedCategory?.id === category.id && {
                color: 'white',
              },
            ]}
            icon={category.icon}
          >
            {category.name}
          </Chip>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderUserRankingCard = () => {
    if (!userRanking || !selectedCategory) return null;

    const categoryUserRanking = userRanking.categories[selectedCategory.id] || userRanking.global;

    return (
      <Card style={styles.userRankingCard}>
        <Card.Content>
          <Title style={styles.userRankingTitle}>{t('leaderboard.screen.myRanking')}</Title>
          <RankingItem ranking={categoryUserRanking} isCurrentUser={true} showDetails={true} />

          {/* 추가 사용자 통계 */}
          <View style={styles.userStatsContainer}>
            <View style={styles.userStatItem}>
              <Icon name='emoji-events' size={20} color='#FFD700' />
              <Paragraph style={styles.userStatText}>
                {t('leaderboard.screen.badges', { count: categoryUserRanking.badges.length })}
              </Paragraph>
            </View>

            <View style={styles.userStatItem}>
              <Icon name='schedule' size={20} color={theme.colors.primary} />
              <Paragraph style={styles.userStatText}>
                {t('leaderboard.screen.daysAgo', {
                  days: Math.floor(
                    (Date.now() - new Date(categoryUserRanking.activity.lastActive).getTime()) /
                      (24 * 60 * 60 * 1000)
                  ),
                })}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderLeaderboard = () => {
    if (!selectedCategory) return null;

    const topThree = selectedCategory.rankings.slice(0, 3);
    const others = selectedCategory.rankings.slice(3, 50);

    return (
      <View style={styles.leaderboardContainer}>
        {/* 상위 3명 특별 표시 */}
        <Card style={styles.topThreeCard}>
          <Card.Content>
            <Title style={styles.topThreeTitle}>{t('leaderboard.screen.topThree')}</Title>
            <View style={styles.podium}>
              {topThree.map((ranking, index) => (
                <View key={ranking.userId} style={styles.podiumItem}>
                  <Avatar.Image
                    size={index === 0 ? 60 : 50}
                    source={{ uri: ranking.profileImage }}
                    style={[styles.podiumAvatar, index === 0 && styles.goldAvatar]}
                  />
                  <Title
                    style={[
                      styles.podiumRank,
                      index === 0 && { color: '#FFD700' },
                      index === 1 && { color: '#C0C0C0' },
                      index === 2 && { color: '#CD7F32' },
                    ]}
                  >
                    {index + 1}
                  </Title>
                  <Paragraph style={styles.podiumName}>{ranking.username}</Paragraph>
                  <Paragraph style={styles.podiumScore}>{ranking.score}</Paragraph>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 나머지 순위 */}
        <View style={styles.rankingsList}>
          <Title style={styles.rankingsTitle}>{t('leaderboard.screen.allRankings')}</Title>
          {others.map(ranking => (
            <RankingItem
              key={ranking.userId}
              ranking={ranking}
              isCurrentUser={user?.uid === ranking.userId}
              showDetails={false}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>{t('leaderboard.screen.loading')}</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderCategoryTabs()}

      {selectedCategory && (
        <Card style={styles.categoryInfoCard}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <Icon name={selectedCategory.icon} size={24} color={theme.colors.primary} />
              <Title style={styles.categoryTitle}>{selectedCategory.name}</Title>
            </View>
            <Paragraph style={styles.categoryDescription}>{selectedCategory.description}</Paragraph>
            <View style={styles.categoryMeta}>
              <Chip style={styles.timeframeChip}>
                {t(`leaderboard.screen.timeframe.${selectedCategory.timeframe}` as const)}
              </Chip>
              <Paragraph style={styles.updateTime}>{t('leaderboard.screen.recentUpdate')}</Paragraph>
            </View>
          </Card.Content>
        </Card>
      )}

      {renderUserRankingCard()}
      {renderLeaderboard()}

      {/* 하단 액션 버튼 */}
      <Card style={styles.actionCard}>
        <Card.Content style={styles.actionContent}>
          <Title>{t('leaderboard.screen.improveRanking')}</Title>
          <Paragraph style={styles.actionDescription}>
            {t('leaderboard.screen.improveDescription')}
          </Paragraph>
          <View style={styles.actionButtons}>
            <Button
              mode='contained'
              style={styles.actionButton}
              onPress={() => console.log('Find match')}
            >
              {t('leaderboard.screen.findMatch')}
            </Button>
            <Button
              mode='outlined'
              style={styles.actionButton}
              onPress={() => console.log('View achievements')}
            >
              {t('leaderboard.screen.viewAchievements')}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  categoryTabs: {
    maxHeight: 60,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  categoryInfoCard: {
    margin: 16,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    marginLeft: 8,
    flex: 1,
  },
  categoryDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeframeChip: {
    alignSelf: 'flex-start',
  },
  updateTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  userRankingCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  userRankingTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  userStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  userStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStatText: {
    marginLeft: 8,
    fontSize: 12,
  },
  leaderboardContainer: {
    margin: 16,
    marginTop: 0,
  },
  topThreeCard: {
    elevation: 2,
    marginBottom: 16,
  },
  topThreeTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    marginBottom: 8,
  },
  goldAvatar: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  podiumRank: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  podiumName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  rankingsList: {
    marginTop: 8,
  },
  rankingsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  rankingCard: {
    marginBottom: 8,
    elevation: 1,
  },
  rankingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  rankSection: {
    alignItems: 'center',
    width: 32,
    marginRight: 8,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatar: {
    marginRight: 8,
  },
  rankingMiddle: {
    flex: 1,
    marginRight: 12,
  },
  userInfo: {
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 4,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierChip: {
    height: 24,
    marginRight: 8,
  },
  tierText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rankingRight: {
    alignItems: 'flex-end',
    width: 60,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  actionCard: {
    margin: 16,
    elevation: 2,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionDescription: {
    textAlign: 'center',
    marginVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
