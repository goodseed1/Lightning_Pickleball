import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Chip, useTheme, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MatchResult {
  id: string;
  date: string;
  opponent: {
    name: string;
    skillLevel: number;
    profileImage?: string;
  };
  result: 'win' | 'loss';
  score: string;
  duration: number;
  location: string;
  skillLevelChange: number;
  matchRating: number;
}

interface MatchHistoryTimelineProps {
  matches: MatchResult[];
  currentSkillLevel: number;
}

export default function MatchHistoryTimeline({
  matches,
  currentSkillLevel,
}: MatchHistoryTimelineProps) {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  const getResultColor = (result: 'win' | 'loss') => {
    return result === 'win' ? theme.colors.primary : theme.colors.error;
  };

  const getResultIcon = (result: 'win' | 'loss') => {
    return result === 'win' ? 'trending-up' : 'trending-down';
  };

  const getSkillChangeColor = (change: number) => {
    if (change > 0) return theme.colors.primary;
    if (change < 0) return theme.colors.error;
    return theme.colors.onSurface;
  };

  const getSkillChangeText = (change: number) => {
    if (change > 0) return `+${change.toFixed(1)}`;
    if (change < 0) return change.toFixed(1);
    return '0';
  };

  const renderMatchItem = (match: MatchResult, index: number) => (
    <View key={match.id} style={styles.timelineItem}>
      {/* Timeline Line */}
      <View style={styles.timelineLineContainer}>
        {index !== 0 && <View style={styles.timelineLine} />}
        <View style={[styles.timelineDot, { backgroundColor: getResultColor(match.result) }]}>
          <Icon name={getResultIcon(match.result)} size={16} color='white' />
        </View>
        {index !== matches.length - 1 && <View style={styles.timelineLine} />}
      </View>

      {/* Match Details */}
      <Card style={[styles.matchCard, { flex: 1 }]}>
        <Card.Content>
          {/* Header */}
          <View style={styles.matchHeader}>
            <View style={styles.dateContainer}>
              <Paragraph style={styles.dateText}>{formatDate(match.date)}</Paragraph>
            </View>
            <Chip
              style={[styles.resultChip, { backgroundColor: getResultColor(match.result) }]}
              textStyle={{ color: 'white', fontWeight: 'bold' }}
            >
              {match.result === 'win' ? '승리' : '패배'}
            </Chip>
          </View>

          {/* Opponent Info */}
          <View style={styles.opponentSection}>
            <Avatar.Text
              size={40}
              label={match.opponent.name.charAt(0)}
              style={styles.opponentAvatar}
            />
            <View style={styles.opponentDetails}>
              <Title style={styles.opponentName}>vs {match.opponent.name}</Title>
              <Paragraph style={styles.opponentSkill}>
                실력 레벨: {match.opponent.skillLevel}
              </Paragraph>
            </View>
          </View>

          {/* Match Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Icon name='sports-pickleball' size={16} color={theme.colors.primary} />
              <Paragraph style={styles.statText}>{match.score}</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Icon name='schedule' size={16} color={theme.colors.primary} />
              <Paragraph style={styles.statText}>{formatDuration(match.duration)}</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Icon name='location-on' size={16} color={theme.colors.primary} />
              <Paragraph style={styles.statText}>{match.location}</Paragraph>
            </View>
          </View>

          {/* Performance Metrics */}
          <View style={styles.metricsSection}>
            <View style={styles.metricItem}>
              <Paragraph style={styles.metricLabel}>스킬 변화</Paragraph>
              <Paragraph
                style={[styles.metricValue, { color: getSkillChangeColor(match.skillLevelChange) }]}
              >
                {getSkillChangeText(match.skillLevelChange)}
              </Paragraph>
            </View>
            <View style={styles.metricItem}>
              <Paragraph style={styles.metricLabel}>매치 평점</Paragraph>
              <View style={styles.ratingContainer}>
                <Icon name='star' size={16} color='#FFD700' />
                <Paragraph style={styles.ratingText}>{match.matchRating.toFixed(1)}</Paragraph>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  if (matches.length === 0) {
    return (
      <Card style={styles.emptyContainer}>
        <Card.Content style={styles.emptyContent}>
          <Icon name='sports-pickleball' size={48} color={theme.colors.outline} />
          <Title style={[styles.emptyTitle, { color: theme.colors.outline }]}>
            매치 기록이 없습니다
          </Title>
          <Paragraph style={[styles.emptyText, { color: theme.colors.outline }]}>
            첫 번째 매치를 시작해보세요!
          </Paragraph>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>매치 히스토리</Title>
          <Paragraph style={styles.subtitle}>
            총 {matches.length}경기 • 현재 실력: {currentSkillLevel.toFixed(1)}
          </Paragraph>
        </View>

        <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
          {matches.map((match, index) => renderMatchItem(match, index))}
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  timeline: {
    maxHeight: 500,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLineContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  matchCard: {
    marginLeft: 8,
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  resultChip: {
    minWidth: 60,
  },
  opponentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  opponentAvatar: {
    marginRight: 12,
  },
  opponentDetails: {
    flex: 1,
  },
  opponentName: {
    fontSize: 16,
    marginBottom: 2,
  },
  opponentSkill: {
    fontSize: 12,
    opacity: 0.7,
  },
  statsSection: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
  },
  metricsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    margin: 16,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
