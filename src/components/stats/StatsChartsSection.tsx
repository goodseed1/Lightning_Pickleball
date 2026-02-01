/**
 * 📊 [VISION] Stats Charts Section Component
 *
 * Unified container for WinRateChart and EloChart with:
 * - 800ms entrance animation
 * - Responsive side-by-side or stacked layout
 * - Conditional rendering based on scope
 *
 * Layout Strategy:
 * - Public scope: WinRate chart only (no ELO for public matches)
 * - Club scope: Both WinRate + ELO charts side-by-side (or stacked on small screens)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import WinRateChart from '../charts/WinRateChart';
import EloChart from '../charts/EloChart';
import TournamentWinRateChart from '../charts/TournamentWinRateChart';
import { ClubFilterValue } from './ClubFilterSelector';

const screenWidth = Dimensions.get('window').width;
const CHART_ANIMATION_DURATION = 800;

interface StatsChartsSectionProps {
  stats: {
    wins: number;
    losses: number;
    totalMatches: number;
    winRate: number;
  };
  userId: string;
  currentLanguage: string; // Any supported language, charts will fallback to 'en' if needed
  scope: 'public' | 'club';
  showEloChart?: boolean; // Optional override for ELO chart visibility
  clubFilter?: ClubFilterValue; // Club filter: 'all' | 'league' | 'tournament'
  selectedClubId?: string | null; // 🎯 [KIM FIX] Selected club ID for filtering ELO chart
}

const StatsChartsSection: React.FC<StatsChartsSectionProps> = ({
  stats,
  userId,
  currentLanguage,
  scope,
  showEloChart = scope === 'club', // Default: show ELO only for club scope
  clubFilter = 'all', // Default: show all matches
  selectedClubId = null, // 🎯 [KIM FIX] Selected club ID for filtering
}) => {
  // 🎬 800ms entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current; // Slide up 20px

  useEffect(() => {
    // Reset animations when scope changes
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    // Trigger entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: CHART_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: CHART_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scope, fadeAnim, slideAnim]);

  // 📐 Determine layout based on screen width
  // Use side-by-side for tablets/wide screens, stacked for phones
  const isSideBySide = screenWidth >= 768 && showEloChart;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={isSideBySide ? styles.sideBySideContainer : styles.stackedContainer}>
        {/* 🥧 Win Rate Chart - Always shown */}
        <View style={isSideBySide ? styles.chartHalf : styles.chartFull}>
          <WinRateChart stats={stats} />
        </View>

        {/* 📈 ELO Chart or 🏆 Tournament Win Rate Chart - Only for club scope */}
        {showEloChart && (
          <View style={isSideBySide ? styles.chartHalf : styles.chartFull}>
            {clubFilter === 'tournament' ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <TournamentWinRateChart userId={userId} selectedClubId={selectedClubId as any} />
            ) : (
              // 🎯 [KIM FIX] Pass selectedClubId to EloChart for club-specific ELO history
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <EloChart userId={userId} scope={scope} selectedClubId={selectedClubId as any} />
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12, // Space between charts
  },
  stackedContainer: {
    flexDirection: 'column',
    gap: 0, // No gap - WinRateChart and EloChart have their own margins
  },
  chartHalf: {
    flex: 1,
    maxWidth: '48%', // Leave some space for gap
  },
  chartFull: {
    width: '100%',
  },
});

export default StatsChartsSection;
