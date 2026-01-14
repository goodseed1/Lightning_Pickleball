/**
 * 📊 [IRON MAN] Match Summary Card Component
 *
 * Displays match statistics in a 4-column grid:
 * - Total Matches
 * - Wins
 * - Losses
 * - Win Rate
 *
 * Extracted from MyProfileScreen match stats grid for reusability
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text as PaperText, useTheme } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';

interface MatchSummaryCardProps {
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  title?: string; // Optional custom title
}

const MatchSummaryCard: React.FC<MatchSummaryCardProps> = ({ stats, title }) => {
  const paperTheme = useTheme();
  const { t } = useLanguage();

  return (
    <Card style={styles.card}>
      <Card.Title title={title || t('matchSummaryCard.defaultTitle')} titleVariant='titleMedium' />
      <Card.Content>
        <View style={styles.statsGrid}>
          {/* Total Matches */}
          <View style={styles.statItem}>
            <PaperText
              variant='headlineMedium'
              style={[styles.statNumber, { color: paperTheme.colors.primary }]}
            >
              {stats.totalMatches}
            </PaperText>
            <PaperText variant='bodySmall' style={styles.statLabel}>
              {t('matchSummaryCard.totalMatches')}
            </PaperText>
          </View>

          {/* Wins */}
          <View style={styles.statItem}>
            <PaperText variant='headlineMedium' style={[styles.statNumber, { color: '#4caf50' }]}>
              {stats.wins}
            </PaperText>
            <PaperText variant='bodySmall' style={styles.statLabel}>
              {t('matchSummaryCard.wins')}
            </PaperText>
          </View>

          {/* Losses */}
          <View style={styles.statItem}>
            <PaperText variant='headlineMedium' style={[styles.statNumber, { color: '#f44336' }]}>
              {stats.losses}
            </PaperText>
            <PaperText variant='bodySmall' style={styles.statLabel}>
              {t('matchSummaryCard.losses')}
            </PaperText>
          </View>

          {/* Win Rate */}
          <View style={styles.statItem}>
            <PaperText
              variant='headlineMedium'
              style={[styles.statNumber, { color: paperTheme.colors.primary }]}
            >
              {stats.winRate.toFixed(1)}%
            </PaperText>
            <PaperText variant='bodySmall' style={styles.statLabel}>
              {t('matchSummaryCard.winRate')}
            </PaperText>
          </View>
        </View>
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    opacity: 0.7,
  },
});

export default MatchSummaryCard;
