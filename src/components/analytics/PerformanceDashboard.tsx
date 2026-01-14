import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PerformanceChart from './PerformanceChart';
import PerformanceAnalyticsService, {
  UserPerformanceData,
  PerformanceTrend,
  PerformanceInsight,
  MonthlyReport,
} from '../../services/PerformanceAnalyticsService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const screenWidth = Dimensions.get('window').width;

// Local ChartData interface to match PerformanceChart expectations
interface ChartData {
  labels?: string[];
  values?: number[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: string;
}

function StatCard({ title, value, subtitle, icon, trend, trendValue, color }: StatCardProps) {
  const theme = useTheme();

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return theme.colors.primary;
      case 'down':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  return (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <View style={styles.statHeader}>
          <Icon name={icon} size={24} color={color || theme.colors.primary} />
          {trend && (
            <View style={styles.trendContainer}>
              <Icon name={getTrendIcon()} size={16} color={getTrendColor()} />
              {trendValue && (
                <Paragraph style={[styles.trendText, { color: getTrendColor() }]}>
                  {trendValue > 0 ? '+' : ''}
                  {trendValue.toFixed(1)}
                </Paragraph>
              )}
            </View>
          )}
        </View>

        <Title style={[styles.statValue, { color: color || theme.colors.onSurface }]}>
          {value}
        </Title>

        <Paragraph style={styles.statTitle}>{title}</Paragraph>

        {subtitle && <Paragraph style={styles.statSubtitle}>{subtitle}</Paragraph>}
      </Card.Content>
    </Card>
  );
}

export default function PerformanceDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const [performanceData, setPerformanceData] = useState<UserPerformanceData | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [chartData, setChartData] = useState<
    Record<string, ChartData | Array<{ name: string; value: number }>>
  >({});

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      if (!user) return;

      // 병렬로 모든 데이터 로드
      const [performance, performanceTrends, performanceInsights, report] = await Promise.all([
        PerformanceAnalyticsService.generateUserPerformanceData(user.uid, selectedPeriod),
        PerformanceAnalyticsService.analyzePerformanceTrends(user.uid),
        PerformanceAnalyticsService.generatePerformanceInsights(user.uid),
        PerformanceAnalyticsService.generateMonthlyReport(user.uid),
      ]);

      setPerformanceData(performance);
      setTrends(performanceTrends);
      setInsights(performanceInsights);
      setMonthlyReport(report);

      // 차트 데이터 생성
      generateChartData(performance);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (performance: UserPerformanceData) => {
    // 스킬 레벨 진행도 차트
    const skillHistory = performance.skillLevelHistory || [];
    const skillChart = {
      labels: skillHistory
        .slice(-10)
        .map(item =>
          new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
        ),
      values: skillHistory.slice(-10).map(item => item.skillLevel),
    };

    // 승률 트렌드 차트 (시뮬레이션)
    const winRateChart = {
      labels: [
        t('performanceDashboard.weekLabels.week1'),
        t('performanceDashboard.weekLabels.week2'),
        t('performanceDashboard.weekLabels.week3'),
        t('performanceDashboard.weekLabels.week4'),
      ],
      values: [45, 52, 61, performance.winRate],
    };

    // 매치 빈도 차트
    const frequencyChart = {
      labels: [
        t('performanceDashboard.dayLabels.mon'),
        t('performanceDashboard.dayLabels.tue'),
        t('performanceDashboard.dayLabels.wed'),
        t('performanceDashboard.dayLabels.thu'),
        t('performanceDashboard.dayLabels.fri'),
        t('performanceDashboard.dayLabels.sat'),
        t('performanceDashboard.dayLabels.sun'),
      ],
      values: [0.5, 0.8, 0.3, 1.2, 0.9, 2.1, 1.8], // 시뮬레이션 데이터
    };

    // 시간대별 성과 파이 차트
    const timePerformance = Object.entries(performance.timeSlotPerformance || {}).map(
      ([slot, data]) => ({
        name: getTimeSlotName(slot),
        value: data.matches || 0,
      })
    );

    setChartData({
      skillProgress: skillChart,
      winRateTrend: winRateChart,
      matchFrequency: frequencyChart,
      timePerformance,
    });
  };

  const getTimeSlotName = (slot: string) => {
    switch (slot) {
      case 'morning':
        return t('performanceDashboard.timeSlots.morning');
      case 'afternoon':
        return t('performanceDashboard.timeSlots.afternoon');
      case 'evening':
        return t('performanceDashboard.timeSlots.evening');
      default:
        return slot;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['weekly', 'monthly', 'yearly'] as const).map(period => (
        <Chip
          key={period}
          selected={selectedPeriod === period}
          onPress={() => setSelectedPeriod(period)}
          style={[
            styles.periodChip,
            selectedPeriod === period && { backgroundColor: theme.colors.primary },
          ]}
          textStyle={[selectedPeriod === period && { color: 'white' }]}
        >
          {t(`performanceDashboard.periods.${period}`)}
        </Chip>
      ))}
    </View>
  );

  const renderStatsOverview = () => {
    if (!performanceData) return null;

    const winRateTrend = trends.find(trend => trend.metric === 'Win Rate');
    const qualityTrend = trends.find(trend => trend.metric === 'Match Quality');
    const frequencyTrend = trends.find(trend => trend.metric === 'Playing Frequency');

    return (
      <View style={styles.statsGrid}>
        <StatCard
          title={t('performanceDashboard.stats.winRate')}
          value={`${performanceData.winRate.toFixed(1)}%`}
          subtitle={t('performanceDashboard.stats.winsLosses', {
            wins: performanceData.wins,
            losses: performanceData.losses,
          })}
          icon='emoji-events'
          trend={winRateTrend?.trend}
          trendValue={winRateTrend?.change}
          color={theme.colors.primary}
        />

        <StatCard
          title={t('performanceDashboard.stats.matchQuality')}
          value={performanceData.averageMatchRating.toFixed(1)}
          subtitle={t('performanceDashboard.stats.averageSatisfaction')}
          icon='star'
          trend={qualityTrend?.trend}
          trendValue={qualityTrend?.change}
          color='#FFD700'
        />

        <StatCard
          title={t('performanceDashboard.stats.playingFrequency')}
          value={performanceData.playingFrequency.averagePerWeek.toFixed(1)}
          subtitle={t('performanceDashboard.stats.matchesPerWeek')}
          icon='schedule'
          trend={frequencyTrend?.trend}
          trendValue={frequencyTrend?.change}
          color='#FF6B35'
        />

        <StatCard
          title={t('performanceDashboard.stats.totalMatches')}
          value={performanceData.totalMatches}
          subtitle={t('performanceDashboard.stats.periodRecord', {
            period: t(`performanceDashboard.periods.${selectedPeriod}`),
          })}
          icon='sports-tennis'
          color='#00BCD4'
        />
      </View>
    );
  };

  const renderInsights = () => {
    if (!insights.length) return null;

    return (
      <Card style={styles.insightsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>{t('performanceDashboard.insights.title')}</Title>
          {insights.slice(0, 3).map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={styles.insightHeader}>
                <Icon
                  name={getInsightIcon(insight.type)}
                  size={20}
                  color={getInsightColor(insight.type)}
                />
                <Title style={styles.insightTitle}>{insight.title}</Title>
              </View>
              <Paragraph style={styles.insightDescription}>{insight.description}</Paragraph>
              {insight.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <Paragraph style={styles.recommendationLabel}>
                    {t('performanceDashboard.insights.recommendations')}
                  </Paragraph>
                  {insight.recommendations.slice(0, 2).map((rec: string, recIndex: number) => (
                    <Paragraph key={recIndex} style={styles.recommendation}>
                      • {rec}
                    </Paragraph>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return 'trending-up';
      case 'weakness':
        return 'trending-down';
      case 'opportunity':
        return 'lightbulb-outline';
      case 'threat':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return theme.colors.primary;
      case 'weakness':
        return theme.colors.error;
      case 'opportunity':
        return '#FF6B35';
      case 'threat':
        return '#FF5722';
      default:
        return theme.colors.outline;
    }
  };

  const renderMonthlyReport = () => {
    if (!monthlyReport) return null;

    return (
      <Card style={styles.reportCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>{t('performanceDashboard.monthlyReport.title')}</Title>

          <View style={styles.reportSection}>
            <Paragraph style={styles.reportLabel}>
              {t('performanceDashboard.monthlyReport.highlights')}
            </Paragraph>
            {monthlyReport.highlights.map((highlight: string, index: number) => (
              <View key={index} style={styles.reportItem}>
                <Icon name='star' size={16} color='#FFD700' />
                <Paragraph style={styles.reportText}>{highlight}</Paragraph>
              </View>
            ))}
          </View>

          <View style={styles.reportSection}>
            <Paragraph style={styles.reportLabel}>
              {t('performanceDashboard.monthlyReport.improvements')}
            </Paragraph>
            {monthlyReport.improvements.map((improvement: string, index: number) => (
              <View key={index} style={styles.reportItem}>
                <Icon name='trending-up' size={16} color={theme.colors.primary} />
                <Paragraph style={styles.reportText}>{improvement}</Paragraph>
              </View>
            ))}
          </View>

          <View style={styles.reportSection}>
            <Paragraph style={styles.reportLabel}>
              {t('performanceDashboard.monthlyReport.nextMonthGoals')}
            </Paragraph>
            {monthlyReport.nextMonthGoals.map((goal: string, index: number) => (
              <View key={index} style={styles.reportItem}>
                <Icon name='flag' size={16} color='#FF6B35' />
                <Paragraph style={styles.reportText}>{goal}</Paragraph>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>{t('performanceDashboard.loading')}</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {renderPeriodSelector()}
      {renderStatsOverview()}

      {/* 차트 섹션 */}
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      {chartData.skillProgress && (
        <PerformanceChart
          type='skill_progress'
          data={chartData.skillProgress as any}
          title={t('performanceDashboard.charts.skillProgress.title')}
          subtitle={t('performanceDashboard.charts.skillProgress.subtitle')}
        />
      )}

      {chartData.winRateTrend && (
        <PerformanceChart
          type='win_rate_trend'
          data={chartData.winRateTrend as any}
          title={t('performanceDashboard.charts.winRateTrend.title')}
          subtitle={t('performanceDashboard.charts.winRateTrend.subtitle')}
        />
      )}

      {chartData.matchFrequency && (
        <PerformanceChart
          type='match_frequency'
          data={chartData.matchFrequency as any}
          title={t('performanceDashboard.charts.matchFrequency.title')}
          subtitle={t('performanceDashboard.charts.matchFrequency.subtitle')}
        />
      )}

      {chartData.timePerformance && (
        <PerformanceChart
          type='time_performance'
          data={chartData.timePerformance as any}
          title={t('performanceDashboard.charts.timePerformance.title')}
          subtitle={t('performanceDashboard.charts.timePerformance.subtitle')}
        />
      )}
      {/* eslint-enable @typescript-eslint/no-explicit-any */}

      {renderInsights()}
      {renderMonthlyReport()}

      {/* 매치 히스토리는 별도 화면에서 표시 */}
      <Card style={styles.actionCard}>
        <Card.Content style={styles.actionContent}>
          <Title>{t('performanceDashboard.detailedAnalysis.title')}</Title>
          <Paragraph style={styles.actionDescription}>
            {t('performanceDashboard.detailedAnalysis.description')}
          </Paragraph>
          <Button
            mode='contained'
            onPress={() => {
              // 네비게이션으로 상세 분석 화면으로 이동
              console.log('Navigate to detailed analytics');
            }}
            style={styles.actionButton}
          >
            {t('performanceDashboard.detailedAnalysis.viewDetails')}
          </Button>
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  periodChip: {
    marginHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    margin: 8,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightsCard: {
    margin: 16,
    elevation: 2,
  },
  insightItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 2,
  },
  reportCard: {
    margin: 16,
    elevation: 2,
  },
  reportSection: {
    marginBottom: 20,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
    marginBottom: 16,
  },
  actionButton: {
    minWidth: 120,
  },
  bottomSpacing: {
    height: 20,
  },
});
