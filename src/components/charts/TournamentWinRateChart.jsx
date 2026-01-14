/**
 * 🏆 [VISION] Tournament Win Rate Chart Component
 *
 * Displays user's win rate progression in tournament matches over time
 * Shows rolling win rate trend for last 30 tournament matches
 * Tournament matches don't affect ELO, so we track win rate instead
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, useTheme as usePaperTheme, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLightningTennisTheme } from '../../theme';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const screenWidth = Dimensions.get('window').width;

// 🎯 [KIM] Date-based X-axis labels (matching EloTrendCard.tsx format)
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

const getMonthLabel = date => {
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${month}'${year}`;
};

const isQuarterStartMonth = monthIndex => {
  return monthIndex === 0 || monthIndex === 3 || monthIndex === 6 || monthIndex === 9;
};

// 🎯 [KIM FIX] Added selectedClubId prop to sync with parent's club selection
const TournamentWinRateChart = ({ userId, selectedClubId = null }) => {
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clubList, setClubList] = useState([]); // User's clubs
  // 🎯 [KIM FIX] Use selectedClubId from parent if provided, otherwise use internal state
  const [internalSelectedClub, setInternalSelectedClub] = useState(null);
  const selectedClub = selectedClubId || internalSelectedClub;
  const { theme: currentTheme } = useTheme();
  const { t } = useLanguage();
  const paperTheme = usePaperTheme();
  const themeColors = getLightningTennisTheme(currentTheme);

  // 🎯 [KIM] ScrollView ref for auto-scroll to right (latest data)
  const scrollViewRef = useRef(null);

  // 🎯 [KIM] Animated value for blinking scroll hint
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // 🎯 [KIM] Start blinking animation for scroll hint
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

  // Load user's club memberships
  useEffect(() => {
    const loadClubs = async () => {
      if (!userId) return;

      try {
        console.log('🏟️ [TOURNAMENT WIN RATE] Loading clubs for user:', userId);
        const membershipsRef = collection(db, `users/${userId}/clubMemberships`);
        const snapshot = await getDocs(membershipsRef);

        const clubs = snapshot.docs.map(doc => ({
          clubId: doc.id,
          clubName: doc.data().clubName,
        }));

        setClubList(clubs);

        // Auto-select first club (only if no external selectedClubId)
        if (clubs.length > 0 && !selectedClubId && !internalSelectedClub) {
          setInternalSelectedClub(clubs[0].clubId);
        }

        console.log(`✅ [TOURNAMENT WIN RATE] Loaded ${clubs.length} clubs`);
      } catch (error) {
        console.error('❌ [TOURNAMENT WIN RATE] Failed to load clubs:', error);
        setClubList([]);
      }
    };

    loadClubs();
  }, [userId]);

  // Load tournament match history when club changes
  useEffect(() => {
    const loadTournamentHistory = async () => {
      if (!userId || !selectedClub) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(
          '🏆 [TOURNAMENT WIN RATE] Loading tournament history for user:',
          userId,
          'club:',
          selectedClub
        );

        // Read from club_match_history collection, filter by matchContext='tournament'
        const historyRef = collection(db, `users/${userId}/club_match_history`);
        // 🎯 [KIM FIX] Changed 'matchContext' to 'context' - matches Cloud Function field name
        const q = query(
          historyRef,
          where('clubId', '==', selectedClub),
          where('context', '==', 'tournament'),
          orderBy('date', 'desc'),
          limit(30)
        );

        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            matchId: doc.id,
            date: data.date?.toDate() || new Date(),
            result: data.result, // 'win' or 'loss'
            opponentName: data.opponentName || '',
            score: data.score || '',
          };
        });

        // Reverse to show oldest first for rolling calculation
        const sortedHistory = history.reverse();

        console.log(`✅ [TOURNAMENT WIN RATE] Loaded ${sortedHistory.length} tournament matches`);
        setMatchHistory(sortedHistory);
      } catch (error) {
        console.error('❌ [TOURNAMENT WIN RATE] Failed to load tournament history:', error);
        setMatchHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadTournamentHistory();
  }, [userId, selectedClub]);

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <Text style={[styles.loadingText, { color: paperTheme.colors.onSurface }]}>
            {t('tournamentWinRateChart.loading')}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  // Calculate rolling win rate for each match
  const calculateRollingWinRate = history => {
    const winRates = [];
    let cumulativeWins = 0;
    let cumulativeMatches = 0;

    history.forEach((match, index) => {
      cumulativeMatches++;
      if (match.result === 'win') {
        cumulativeWins++;
      }
      const winRate = (cumulativeWins / cumulativeMatches) * 100;
      winRates.push(winRate);
    });

    return winRates;
  };

  const winRateValues = calculateRollingWinRate(matchHistory);

  // Calculate statistics
  const totalMatches = matchHistory.length;
  const wins = matchHistory.filter(m => m.result === 'win').length;
  const losses = matchHistory.filter(m => m.result === 'loss').length;
  const currentWinRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;

  // 🎯 [KIM] Generate date-based labels with quarter markers (★)
  const generateDateLabels = () => {
    let lastMonth = '';
    return matchHistory.map(match => {
      const date = match.date;
      if (!date) return '';

      const currentMonth = getMonthLabel(date);
      const monthIndex = date.getMonth();

      if (currentMonth !== lastMonth) {
        lastMonth = currentMonth;
        // Add ★ marker for quarter start months (Jan, Apr, Jul, Oct)
        if (isQuarterStartMonth(monthIndex)) {
          return `★${currentMonth}`;
        }
        return currentMonth;
      }
      return '';
    });
  };

  // 🎯 [KIM] Dynamic chart width for horizontal scrolling
  const MIN_POINT_WIDTH = 50; // Minimum pixels per data point
  const baseWidth = screenWidth - 64;
  const calculatedWidth = matchHistory.length * MIN_POINT_WIDTH;
  const chartWidth = Math.max(baseWidth, calculatedWidth);
  const isScrollable = chartWidth > baseWidth;

  const data = {
    labels: generateDateLabels(),
    datasets: [
      {
        data: winRateValues.length > 0 ? winRateValues : [0], // Prevent empty dataset
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green color for win rate
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: themeColors.colors.surface,
    backgroundGradientFrom: themeColors.colors.surface,
    backgroundGradientTo: themeColors.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) =>
      currentTheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) =>
      currentTheme === 'dark'
        ? `rgba(255, 255, 255, ${opacity * 0.8})`
        : `rgba(0, 0, 0, ${opacity * 0.8})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: themeColors.colors.primary,
    },
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
          {t('tournamentWinRateChart.title')}
        </Text>

        {/* 🎯 [KIM FIX] Club Selector - hidden when selectedClubId is provided from parent */}
        {/* This prevents showing duplicate club selector when parent already has one */}
        {clubList.length > 1 && !selectedClubId && (
          <View style={styles.clubSelector}>
            <SegmentedButtons
              value={selectedClub}
              onValueChange={setInternalSelectedClub}
              buttons={clubList.map(club => ({
                value: club.clubId,
                label: club.clubName,
              }))}
              density='small'
            />
          </View>
        )}

        {/* Empty state or chart */}
        {!matchHistory || matchHistory.length === 0 ? (
          <Text style={[styles.emptyText, { color: paperTheme.colors.onSurfaceVariant }]}>
            {t('tournamentWinRateChart.emptyMessage')}
          </Text>
        ) : (
          <>
            {/* Statistics Summary */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                  {t('tournamentWinRateChart.stats.winRate')}
                </Text>
                <Text style={[styles.statValue, { color: themeColors.colors.primary }]}>
                  {currentWinRate}%
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                  {t('tournamentWinRateChart.stats.wins')}
                </Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{wins}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                  {t('tournamentWinRateChart.stats.losses')}
                </Text>
                <Text style={[styles.statValue, { color: '#F44336' }]}>{losses}</Text>
              </View>
            </View>

            {/* Chart */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={isScrollable}
              contentContainerStyle={styles.scrollContent}
              // 🎯 [KIM] Auto-scroll to right (latest data) on content size change
              onContentSizeChange={() => {
                if (isScrollable && scrollViewRef.current) {
                  scrollViewRef.current.scrollToEnd({ animated: false });
                }
              }}
            >
              <LineChart
                data={data}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
                yAxisSuffix='%'
                segments={5}
              />
            </ScrollView>

            {/* 🎯 [KIM] Scroll hint with blinking animation */}
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

            {/* Footer Info */}
            <Text style={[styles.footerText, { color: paperTheme.colors.onSurfaceVariant }]}>
              {t('tournamentWinRateChart.footer', { totalMatches, wins, losses })}
            </Text>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  // 🎯 [KIM] Scroll container style
  scrollContent: {
    flexGrow: 1,
  },
  // 🎯 [KIM] Blinking scroll hint style
  scrollHint: {
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
    fontSize: 12,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
    lineHeight: 20,
  },
  clubSelector: {
    marginBottom: 16,
  },
});

export default TournamentWinRateChart;
