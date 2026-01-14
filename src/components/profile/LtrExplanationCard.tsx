/**
 * ⚡ LPR Explanation Card
 *
 * "What is LPR?" - Lightning Pickleball Rating 시스템 설명 카드
 * 명예의 전당 섹션에 표시되어 사용자에게 LPR 시스템을 설명합니다.
 *
 * 7-Tier System:
 * - Bronze (LPR 1-2): 🔸 Spark
 * - Silver (LPR 3-4): ⚡ Flash
 * - Gold (LPR 5-6): 🌩️ Bolt
 * - Platinum (LPR 7): ⛈️ Thunder
 * - Diamond (LPR 8): 🌀 Storm
 * - Master (LPR 9): ⚡🔮 Ball Lightning
 * - Legend (LPR 10): ⚡👑 Lightning God
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { LPR_TIERS, LPR_LEVELS, getLocalizedText } from '../../constants/ltr';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LtrExplanationCardProps {
  defaultExpanded?: boolean;
}

const LtrExplanationCard: React.FC<LtrExplanationCardProps> = ({ defaultExpanded = false }) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const { t, currentLanguage } = useLanguage();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const styles = createStyles(themeColors.colors, currentTheme);

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name='flash' size={24} color='#FFD700' />
            <Text style={styles.headerTitle}>{t('ltrExplanation.title') || 'What is LPR?'}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={themeColors.colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Introduction */}
          <Text style={styles.description}>
            {t('ltrExplanation.description') ||
              'LPR (Lightning Pickleball Rating) is our unique 1-10 rating system based on the ELO algorithm. Your rating is calculated from match results within the app.'}
          </Text>

          {/* Tier System - 10 LPR Levels with exact ELO ranges */}
          <View style={styles.tierSection}>
            <Text style={styles.sectionTitle}>
              {t('ltrExplanation.tierSystem') || '7-Tier System'}
            </Text>

            {LPR_LEVELS.map(level => {
              // Find the tier for this level to get the color
              const tier = LPR_TIERS.find(t => t.levels.includes(level.value));
              const tierColor = tier?.color || '#CD7F32';

              // Format ELO range clearly
              const formatEloRange = () => {
                if (level.eloMax === Infinity || level.eloMax >= 9999) {
                  return `${level.eloMin}+`;
                }
                return `${level.eloMin}-${level.eloMax}`;
              };

              return (
                <View key={level.value} style={styles.tierRow}>
                  <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                    <Text style={styles.tierBadgeText}>{level.tier}</Text>
                  </View>
                  <View style={styles.tierInfo}>
                    <Text style={styles.tierLevels}>LPR {level.value}</Text>
                    <Text style={styles.tierTheme}>
                      {getLocalizedText(level.label, currentLanguage as 'ko' | 'en').split(
                        ' - '
                      )[1] || getLocalizedText(level.label, currentLanguage as 'ko' | 'en')}
                    </Text>
                  </View>
                  <Text style={styles.tierElo}>{formatEloRange()}</Text>
                </View>
              );
            })}
          </View>

          {/* Key Points */}
          <View style={styles.keyPoints}>
            <Text style={styles.sectionTitle}>{t('ltrExplanation.keyPoints') || 'Key Points'}</Text>

            <View style={styles.keyPoint}>
              <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
              <Text style={styles.keyPointText}>
                {t('ltrExplanation.point1') ||
                  'Onboarding cap at LPR 5 - Higher levels earned through matches'}
              </Text>
            </View>

            <View style={styles.keyPoint}>
              <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
              <Text style={styles.keyPointText}>
                {t('ltrExplanation.point2') ||
                  'ELO-based calculation for fair and accurate ratings'}
              </Text>
            </View>

            <View style={styles.keyPoint}>
              <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
              <Text style={styles.keyPointText}>
                {t('ltrExplanation.point3') ||
                  'Separate ratings for Singles, Doubles, and Mixed Doubles'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any, theme: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.onSurfaceVariant,
      marginBottom: 20,
    },
    tierSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 12,
    },
    tierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    tierBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 80,
      alignItems: 'center',
    },
    tierBadgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000',
    },
    tierInfo: {
      flex: 1,
      marginLeft: 12,
    },
    tierLevels: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    tierTheme: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    tierElo: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      minWidth: 70,
      textAlign: 'right',
    },
    keyPoints: {
      backgroundColor: theme === 'dark' ? 'rgba(255,215,0,0.1)' : 'rgba(255,215,0,0.15)',
      borderRadius: 12,
      padding: 16,
    },
    keyPoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 8,
    },
    keyPointText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      color: colors.onSurface,
    },
  });

export default LtrExplanationCard;
