/**
 * 📈 [IRON MAN] ELO Trend Card Component
 *
 * Displays ELO rating changes over the past year using a line chart
 * with quarterly separator lines (Q1, Q2, Q3, Q4)
 *
 * Data source: public_elo_history collection
 * - Filter by userId and matchType
 * - Filter by timestamp >= 1 year ago
 * - Order by timestamp asc (oldest to newest)
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { Card, Text as PaperText, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';

interface EloTrendCardProps {
  userId: string;
  matchType: 'singles' | 'doubles' | 'mixed_doubles';
  currentElo: number;
}

interface EloHistoryEntry {
  userId: string;
  matchType: string;
  timestamp: Timestamp;
  newElo: number;
  eloChange: number;
}

// 🎯 [KIM FIX] Get month label from timestamp (e.g., "Jan", "Feb", "Mar")
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const getMonthLabel = (date: Date): string => {
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${month}'${year}`;
};

// 🎯 [KIM FIX] Check if month is quarter start (Jan, Apr, Jul, Oct)
const isQuarterStartMonth = (monthIndex: number): boolean => {
  return monthIndex === 0 || monthIndex === 3 || monthIndex === 6 || monthIndex === 9;
};

const EloTrendCard: React.FC<EloTrendCardProps> = ({ userId, matchType, currentElo }) => {
  const paperTheme = useTheme();
  const { t } = useLanguage();
  const [eloHistory, setEloHistory] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  // 🎯 [KIM FIX] ScrollView ref for auto-scroll to right
  const scrollViewRef = useRef<ScrollView>(null);

  // 🎯 [KIM FIX] Animated value for blinking scroll hint
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // 🎯 [KIM FIX] Start blinking animation
  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    blinkAnimation.start();

    return () => blinkAnimation.stop();
  }, [blinkAnim]);

  useEffect(() => {
    const fetchEloHistory = async () => {
      try {
        setLoading(true);

        // 🎯 [KIM FIX] Get data from 1 year ago to now
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const historyQuery = query(
          collection(db, 'public_elo_history'),
          where('userId', '==', userId),
          where('matchType', '==', matchType),
          where('timestamp', '>=', Timestamp.fromDate(oneYearAgo)),
          orderBy('timestamp', 'asc') // Oldest first
        );

        const snapshot = await getDocs(historyQuery);
        const entries = snapshot.docs.map(doc => doc.data() as EloHistoryEntry);

        // Extract ELO values and timestamps
        const eloValues = entries.map(entry => entry.newElo);
        const timestampValues = entries.map(entry => entry.timestamp.toDate());

        // If less than 2 data points, add current ELO
        if (eloValues.length === 0) {
          setEloHistory([currentElo]);
          setTimestamps([new Date()]);
        } else if (eloValues.length === 1) {
          setEloHistory([...eloValues, currentElo]);
          setTimestamps([...timestampValues, new Date()]);
        } else {
          setEloHistory(eloValues);
          setTimestamps(timestampValues);
        }
      } catch (error) {
        console.error('❌ [EloTrendCard] Error fetching ELO history:', error);
        // Fallback to current ELO only
        setEloHistory([currentElo]);
        setTimestamps([new Date()]);
      } finally {
        setLoading(false);
      }
    };

    fetchEloHistory();
  }, [userId, matchType, currentElo]);

  const screenWidth = Dimensions.get('window').width;

  // 🎯 [KIM FIX] Generate labels with month markers and track quarter start indices
  const { labels, quarterStartIndices } = useMemo(() => {
    if (timestamps.length === 0) return { labels: [], quarterStartIndices: new Set<number>() };

    const result: string[] = [];
    const quarterStarts = new Set<number>();
    let lastMonth = '';

    timestamps.forEach((ts, index) => {
      const currentMonth = getMonthLabel(ts);
      const monthIndex = ts.getMonth();

      // Show month label at first occurrence of each month
      if (currentMonth !== lastMonth) {
        // 🎯 [KIM FIX] Add ★ marker for quarter start months (Jan, Apr, Jul, Oct)
        if (isQuarterStartMonth(monthIndex)) {
          result.push(`★${currentMonth}`);
          quarterStarts.add(index);
        } else {
          result.push(currentMonth);
        }
        lastMonth = currentMonth;
      } else {
        result.push('');
      }
    });

    return { labels: result, quarterStartIndices: quarterStarts };
  }, [timestamps]);

  // 🎯 [KIM FIX] Calculate dynamic chart width for horizontal scrolling
  const MIN_POINT_WIDTH = 50; // Minimum pixels per data point
  const chartWidth = useMemo(() => {
    const baseWidth = screenWidth - 64;
    const dataPoints = eloHistory.length;
    const calculatedWidth = dataPoints * MIN_POINT_WIDTH;
    return Math.max(baseWidth, calculatedWidth);
  }, [eloHistory.length, screenWidth]);

  const isScrollable = chartWidth > screenWidth - 64;

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Title
          title={t('eloTrend.title')}
          titleVariant='titleMedium'
          left={props => (
            <Ionicons {...props} name='trending-up' size={24} color={paperTheme.colors.primary} />
          )}
        />
        <Card.Content>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={paperTheme.colors.primary} />
            <PaperText variant='bodySmall' style={{ marginTop: 12 }}>
              {t('eloTrend.loadingHistory')}
            </PaperText>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (eloHistory.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Title
          title={t('eloTrend.title')}
          titleVariant='titleMedium'
          left={props => (
            <Ionicons {...props} name='trending-up' size={24} color={paperTheme.colors.primary} />
          )}
        />
        <Card.Content>
          <PaperText variant='bodyMedium' style={{ textAlign: 'center', paddingVertical: 24 }}>
            {t('eloTrend.noMatchHistory')}
          </PaperText>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title={t('eloTrend.title')}
        titleVariant='titleMedium'
        left={props => (
          <Ionicons {...props} name='trending-up' size={24} color={paperTheme.colors.primary} />
        )}
        right={() => (
          <PaperText
            variant='bodySmall'
            style={{ marginRight: 16, color: paperTheme.colors.onSurfaceVariant }}
          >
            {t('eloTrend.lastYear')}
          </PaperText>
        )}
      />
      <Card.Content>
        {/* 🎯 [KIM FIX] Scrollable chart container for many data points */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={isScrollable}
          contentContainerStyle={styles.scrollContent}
          // 🎯 [KIM FIX] Auto-scroll to right end (latest data) on content size change
          onContentSizeChange={() => {
            if (isScrollable && scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: false });
            }
          }}
        >
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: labels,
                datasets: [
                  {
                    data: eloHistory,
                    color: () => 'rgba(33, 150, 243, 1)', // Blue
                    strokeWidth: 2,
                  },
                ],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: paperTheme.colors.surface,
                backgroundGradientFrom: paperTheme.colors.surface,
                backgroundGradientTo: paperTheme.colors.surface,
                decimalPlaces: 0,
                color: () => 'rgba(33, 150, 243, 1)',
                labelColor: () => paperTheme.colors.onSurfaceVariant,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: eloHistory.length > 20 ? '2' : '4', // Smaller dots for many data points
                  strokeWidth: '2',
                  stroke: '#2196F3',
                },
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              bezier
              style={styles.chart}
              fromZero={false}
              yAxisInterval={1}
              segments={4}
              withVerticalLines={true}
              withHorizontalLines={true}
              // 🎯 [KIM FIX] Custom dot rendering for quarter start highlights
              renderDotContent={({ x, y, index }) => {
                // Only render special dot for quarter start points
                if (quarterStartIndices.has(index)) {
                  return (
                    <View
                      key={`quarter-dot-${index}`}
                      style={{
                        position: 'absolute',
                        left: x - 6,
                        top: y - 6,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#FFD700', // Gold color
                        borderWidth: 2,
                        borderColor: '#FFA500', // Orange border
                      }}
                    />
                  );
                }
                return null;
              }}
            />
          </View>
        </ScrollView>

        {/* 🎯 [KIM FIX] Scroll hint for users - Yellow color with slow blinking animation */}
        {isScrollable && (
          <Animated.Text
            style={[
              styles.scrollHint,
              {
                color: '#FFD700', // Yellow/Gold color
                opacity: blinkAnim,
              },
            ]}
          >
            ← 좌우로 스크롤 →
          </Animated.Text>
        )}

        {/* Match count info */}
        <PaperText
          variant='bodySmall'
          style={[styles.matchCount, { color: paperTheme.colors.onSurfaceVariant }]}
        >
          {t('eloTrend.matchCount', { count: eloHistory.length })}
        </PaperText>

        <View style={styles.currentEloContainer}>
          <PaperText variant='bodyMedium' style={styles.currentEloLabel}>
            {t('eloTrend.currentElo')}
          </PaperText>
          <PaperText
            variant='headlineMedium'
            style={[styles.currentEloValue, { color: paperTheme.colors.primary }]}
          >
            {currentElo}
          </PaperText>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  scrollHint: {
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  matchCount: {
    textAlign: 'center',
    marginTop: 8,
  },
  currentEloContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  currentEloLabel: {
    flex: 1,
  },
  currentEloValue: {
    fontWeight: '700',
  },
});

export default EloTrendCard;
