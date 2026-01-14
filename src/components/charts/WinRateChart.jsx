/**
 * 📊 [VISION] Win Rate Analysis Chart Component
 *
 * Displays win/loss statistics with pie chart visualization
 * Shows current win streak and recent match form
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Card, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';

const screenWidth = Dimensions.get('window').width;

const WinRateChart = ({ stats }) => {
  const { theme: currentTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const { t } = useLanguage();

  if (!stats || (stats.wins === 0 && stats.losses === 0)) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
            {t('winRateChart.title')}
          </Text>
          <Text style={[styles.emptyText, { color: paperTheme.colors.onSurfaceVariant }]}>
            {t('winRateChart.emptyState')}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const wins = stats.wins || 0;
  const losses = stats.losses || 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;

  const pieData = [
    {
      name: t('winRateChart.wins'),
      value: wins,
      color: '#4CAF50',
      legendFontColor: currentTheme === 'dark' ? '#FFF' : '#000',
      legendFontSize: 14,
    },
    {
      name: t('winRateChart.losses'),
      value: losses,
      color: '#F44336',
      legendFontColor: currentTheme === 'dark' ? '#FFF' : '#000',
      legendFontSize: 14,
    },
  ];

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
          {t('winRateChart.title')}
        </Text>

        {/* Win Rate Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
              {t('winRateChart.winRate')}
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.colors.primary }]}>
              {winRate}%
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: paperTheme.colors.onSurfaceVariant }]}>
              {t('winRateChart.record')}
            </Text>
            <Text style={[styles.summaryValue, { color: paperTheme.colors.onSurface }]}>
              {wins}W - {losses}L
            </Text>
          </View>
        </View>

        {/* Pie Chart */}
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            width={screenWidth - 80}
            height={180}
            chartConfig={chartConfig}
            accessor='value'
            backgroundColor='transparent'
            paddingLeft='15'
            absolute
            hasLegend={true}
          />
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <View style={styles.statRow}>
            <View style={[styles.statBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statBadgeLabel}>{t('winRateChart.winBadge')}</Text>
              <Text style={styles.statBadgeValue}>{wins}</Text>
            </View>

            <View style={[styles.statBadge, { backgroundColor: '#F44336' }]}>
              <Text style={styles.statBadgeLabel}>{t('winRateChart.lossBadge')}</Text>
              <Text style={styles.statBadgeValue}>{losses}</Text>
            </View>

            <View
              style={[
                styles.statBadge,
                {
                  backgroundColor:
                    winRate >= 50 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                },
              ]}
            >
              <Text
                style={[styles.statBadgeLabel, { color: winRate >= 50 ? '#4CAF50' : '#F44336' }]}
              >
                {winRate >= 50 ? '✓' : '✗'}
              </Text>
              <Text
                style={[styles.statBadgeValue, { color: winRate >= 50 ? '#4CAF50' : '#F44336' }]}
              >
                {winRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerText, { color: paperTheme.colors.onSurfaceVariant }]}>
          {t('winRateChart.totalMatches', { count: totalMatches })}
        </Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  additionalStats: {
    marginTop: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBadge: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  statBadgeLabel: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  statBadgeValue: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
});

export default WinRateChart;
