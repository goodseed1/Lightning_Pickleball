/**
 * 📊 [VISION] ELO Rating Chart Component
 *
 * Displays user's ELO rating progression over time using Line Chart
 * Shows last 30 matches by default with visual indicators for wins/losses
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
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import userService from '../../services/userService';

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
const EloChart = ({ userId, scope = 'public', selectedClubId = null }) => {
  const [eloHistory, setEloHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  // 🔄 [IRON MAN] Removed internal eloType state - now controlled by parent's scope prop
  // Map parent scope to internal eloType: 'public' → 'global', 'club' → 'club'
  const eloType = scope === 'public' ? 'global' : 'club';
  const [clubList, setClubList] = useState([]); // User's clubs
  // 🎯 [KIM FIX] Use selectedClubId from parent if provided, otherwise use internal state
  const [internalSelectedClub, setInternalSelectedClub] = useState(null);
  const selectedClub = selectedClubId || internalSelectedClub;
  const { theme: currentTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const { t } = useLanguage();

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
        console.log('🏟️ [ELO CHART] Loading clubs for user:', userId);
        const memberships = await userService.getUserClubMemberships(userId);
        const clubs = memberships.map(m => ({
          clubId: m.clubId || m.id,
          clubName: m.clubName,
        }));

        setClubList(clubs);

        // Auto-select first club (only if no external selectedClubId)
        if (clubs.length > 0 && !selectedClubId && !internalSelectedClub) {
          setInternalSelectedClub(clubs[0].clubId);
        }

        console.log(`✅ [ELO CHART] Loaded ${clubs.length} clubs`);
      } catch (error) {
        console.error('❌ [ELO CHART] Failed to load clubs:', error);
        setClubList([]);
      }
    };

    loadClubs();
  }, [userId]);

  // Load ELO history when type or club changes
  useEffect(() => {
    const loadEloHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`📊 [ELO CHART] Loading ${eloType} ELO history for user:`, userId);

        let history;
        if (eloType === 'global') {
          // Global ELO: users/{userId}/global_match_history (Phase 2 - empty for now)
          history = await userService.getGlobalEloHistory(userId, 30);
        } else if (eloType === 'club' && selectedClub) {
          // Club ELO: users/{userId}/club_match_history
          history = await userService.getClubEloHistory(userId, selectedClub, 30);
        } else {
          history = [];
        }

        console.log(`✅ [ELO CHART] ${eloType} ELO history loaded:`, history.length, 'entries');
        setEloHistory(history);
      } catch (error) {
        console.error(`❌ [ELO CHART] Failed to load ${eloType} ELO history:`, error);
        setEloHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadEloHistory();
  }, [userId, eloType, selectedClub, scope]);

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <Text style={[styles.loadingText, { color: paperTheme.colors.onSurface }]}>
            {t('eloChart.loading')}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  // Empty state message
  const getEmptyMessage = () => {
    if (eloType === 'global') {
      return t('eloChart.emptyGlobal');
    } else {
      return t('eloChart.emptyClub');
    }
  };

  // Prepare data for chart
  const eloValues = eloHistory.map(entry => entry.newElo);
  const minElo = Math.min(...eloValues);
  const maxElo = Math.max(...eloValues);
  const eloRange = maxElo - minElo;

  // Add padding to Y-axis for better visualization
  const yAxisMin = Math.floor(minElo - eloRange * 0.1);
  const yAxisMax = Math.ceil(maxElo + eloRange * 0.1);

  // Calculate statistics
  const currentElo = eloValues[eloValues.length - 1];
  const startElo = eloValues[0];
  const totalChange = currentElo - startElo;
  const wins = eloHistory.filter(e => e.result === 'win').length;
  const losses = eloHistory.filter(e => e.result === 'loss').length;
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;

  // 🎯 [KIM] Generate date-based labels with quarter markers (★)
  const generateDateLabels = () => {
    let lastMonth = '';
    return eloHistory.map(entry => {
      const date = entry.date;
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
  const calculatedWidth = eloHistory.length * MIN_POINT_WIDTH;
  const chartWidth = Math.max(baseWidth, calculatedWidth);
  const isScrollable = chartWidth > baseWidth;

  const data = {
    labels: generateDateLabels(),
    datasets: [
      {
        data: eloValues,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue color for the line
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: themeColors.colors.surface,
    backgroundGradientFrom: themeColors.colors.surface,
    backgroundGradientTo: themeColors.colors.surface,
    decimalPlaces: 0,
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
          {t('eloChart.title')}
        </Text>

        {/* 🔄 [IRON MAN] ELO Type Selector removed - now controlled by parent's '공용'/'클럽' tabs */}

        {/* 🎯 [KIM FIX] Club Selector - hidden when selectedClubId is provided from parent */}
        {/* This prevents showing duplicate club selector when parent already has one */}
        {eloType === 'club' && clubList.length > 1 && !selectedClubId && (
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
        {!eloHistory || eloHistory.length === 0 ? (
          <Text style={[styles.emptyText, { color: paperTheme.colors.onSurfaceVariant }]}>
            {getEmptyMessage()}
          </Text>
        ) : (
          <>
            {/* Statistics Summary */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                  {t('eloChart.current')}
                </Text>
                <Text style={[styles.statValue, { color: themeColors.colors.primary }]}>
                  {currentElo}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                  {t('eloChart.change')}
                </Text>
                <Text
                  style={[styles.statValue, { color: totalChange >= 0 ? '#4CAF50' : '#F44336' }]}
                >
                  {totalChange >= 0 ? '+' : ''}
                  {totalChange}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
                  {t('eloChart.winRate')}
                </Text>
                <Text style={[styles.statValue, { color: paperTheme.colors.onSurface }]}>
                  {winRate}%
                </Text>
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
                fromZero={false}
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
              {t('eloChart.footer', { matches: eloHistory.length, wins, losses })}
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
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
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
  tabSelector: {
    marginTop: 8,
    marginBottom: 16,
  },
  clubSelector: {
    marginBottom: 16,
  },
});

export default EloChart;
