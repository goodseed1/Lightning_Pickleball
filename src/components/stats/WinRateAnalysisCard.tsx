/**
 * 📊 [IRON MAN] Win Rate Analysis Card Component
 *
 * Displays detailed win rate statistics:
 * - Overall Win Rate (matches)
 * - Set Win Rate
 * - Game Win Rate
 *
 * Data source: users/{userId}/stats/publicStats/{matchType}
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Text as PaperText, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLanguage } from '../../contexts/LanguageContext';

interface WinRateAnalysisCardProps {
  userId: string;
  matchType: 'singles' | 'doubles' | 'mixed_doubles';
}

interface DetailedStats {
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

const WinRateAnalysisCard: React.FC<WinRateAnalysisCardProps> = ({ userId, matchType }) => {
  const paperTheme = useTheme();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DetailedStats>({
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      try {
        setLoading(true);

        const statsDocRef = doc(db, 'users', userId, 'stats', 'publicStats');
        const statsSnapshot = await getDoc(statsDocRef);

        if (statsSnapshot.exists()) {
          const data = statsSnapshot.data();
          const typeData = data[matchType] || {};

          setStats({
            wins: typeData.wins || 0,
            losses: typeData.losses || 0,
            setsWon: typeData.setsWon || 0,
            setsLost: typeData.setsLost || 0,
            gamesWon: typeData.gamesWon || 0,
            gamesLost: typeData.gamesLost || 0,
          });
        }
      } catch (error) {
        console.error('❌ [WinRateAnalysisCard] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, [userId, matchType]);

  // Calculate win rates with safety checks
  const calculateWinRate = (won: number, lost: number): string => {
    const total = won + lost;
    if (total === 0) {
      return '0.0';
    }
    return ((won / total) * 100).toFixed(1);
  };

  const overallWinRate = calculateWinRate(stats.wins, stats.losses);
  const setWinRate = calculateWinRate(stats.setsWon, stats.setsLost);
  const gameWinRate = calculateWinRate(stats.gamesWon, stats.gamesLost);

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Title
          title={t('winRateAnalysis.title')}
          titleVariant='titleMedium'
          left={props => (
            <Ionicons {...props} name='analytics' size={24} color={paperTheme.colors.primary} />
          )}
        />
        <Card.Content>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={paperTheme.colors.primary} />
            <PaperText variant='bodySmall' style={{ marginTop: 12 }}>
              {t('winRateAnalysis.loadingStats')}
            </PaperText>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title={t('winRateAnalysis.title')}
        titleVariant='titleMedium'
        left={props => (
          <Ionicons {...props} name='analytics' size={24} color={paperTheme.colors.primary} />
        )}
      />
      <Card.Content>
        <View style={styles.statsContainer}>
          {/* Overall Win Rate */}
          <View style={styles.statRow}>
            <PaperText variant='bodyLarge' style={styles.statLabel}>
              {t('winRateAnalysis.overallWinRate')}
            </PaperText>
            <PaperText
              variant='headlineSmall'
              style={[styles.statValue, { color: paperTheme.colors.primary }]}
            >
              {overallWinRate}%
            </PaperText>
          </View>

          {/* Set Win Rate */}
          <View style={styles.statRow}>
            <PaperText variant='bodyLarge' style={styles.statLabel}>
              {t('winRateAnalysis.setWinRate')}
            </PaperText>
            <PaperText variant='headlineSmall' style={[styles.statValue, { color: '#4caf50' }]}>
              {setWinRate}%
            </PaperText>
          </View>

          {/* Game Win Rate */}
          <View style={styles.statRow}>
            <PaperText variant='bodyLarge' style={styles.statLabel}>
              {t('winRateAnalysis.gameWinRate')}
            </PaperText>
            <PaperText variant='headlineSmall' style={[styles.statValue, { color: '#ff9800' }]}>
              {gameWinRate}%
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
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statsContainer: {
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  statLabel: {
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
  },
});

export default WinRateAnalysisCard;
