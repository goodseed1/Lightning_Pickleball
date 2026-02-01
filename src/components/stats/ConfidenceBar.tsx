/**
 * 🏆 [IRON MAN] Confidence Bar Component
 *
 * 시즌 경기 수 기반 랭킹 신뢰도를 5개 블록으로 시각화
 *
 * Features:
 * - 5개의 작은 블록으로 구성된 시각적 바
 * - 경기 수에 따라 블록이 채워짐 (채워진 블록: 녹색, 빈 블록: 회색)
 * - 5/5 달성 시 "공식 랭킹" 배지 표시
 * - 다크/라이트 테마 지원
 *
 * @example
 * ```tsx
 * <ConfidenceBar matchesPlayed={3} showLabel={true} />
 * <ConfidenceBar matchesPlayed={5} compact={true} />
 * ```
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getRankingConfidenceLevel } from '../../utils/rankingConfidenceUtils';

interface ConfidenceBarProps {
  matchesPlayed: number;
  showLabel?: boolean; // 레이블 표시 여부 (default: true)
  compact?: boolean; // 컴팩트 모드 (default: false)
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  matchesPlayed,
  showLabel = true,
  compact = false,
}) => {
  // 🎨 [DARK GLASS] Theme setup
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>, currentTheme, compact);
  const { t } = useLanguage();

  // Calculate confidence level
  const confidence = getRankingConfidenceLevel(matchesPlayed);

  // Colors
  const filledColor = '#4CAF50'; // Green for filled blocks
  const emptyColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';

  // Generate 5 blocks
  const blocks = Array.from({ length: 5 }, (_, index) => {
    const isFilled = index < confidence.level;
    return (
      <View
        key={index}
        style={[
          styles.block,
          {
            backgroundColor: isFilled ? filledColor : emptyColor,
          },
        ]}
      />
    );
  });

  return (
    <View style={styles.container}>
      {/* Title (if showLabel) */}
      {showLabel && !compact && (
        <PaperText variant='bodyMedium' style={styles.title}>
          {t('rankingConfidence.title')}
        </PaperText>
      )}

      {/* 5-Block Bar */}
      <View style={styles.barContainer}>{blocks}</View>

      {/* Status Label */}
      {showLabel && (
        <View style={styles.statusContainer}>
          {confidence.isOfficial ? (
            <View style={styles.officialBadge}>
              <PaperText variant='labelLarge' style={styles.officialText}>
                ✓ {t('rankingConfidence.official')}
              </PaperText>
            </View>
          ) : (
            <PaperText variant='bodySmall' style={styles.remainingText}>
              {t('rankingConfidence.remainingMatches', { count: confidence.remainingMatches })}
            </PaperText>
          )}
        </View>
      )}

      {/* Progress Percentage (compact mode only) */}
      {compact && (
        <PaperText variant='labelSmall' style={styles.percentageText}>
          {confidence.level}/5
        </PaperText>
      )}
    </View>
  );
};

// ==================== STYLES ====================

// 🎨 [DARK GLASS] Dynamic styles with theme support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: Record<string, any>, theme: 'light' | 'dark', compact: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: compact ? 4 : 8,
    },
    title: {
      marginBottom: 8,
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : colors.onSurfaceVariant,
      fontWeight: '500',
    },
    barContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: compact ? 4 : 8,
      marginVertical: compact ? 4 : 8,
    },
    block: {
      flex: 1,
      height: compact ? 8 : 12,
      borderRadius: compact ? 4 : 6,
      // 🎨 [DARK GLASS] Subtle shadow for filled blocks
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    statusContainer: {
      marginTop: 8,
      alignItems: 'center',
    },
    officialBadge: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    officialText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    remainingText: {
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : colors.onSurfaceVariant,
      textAlign: 'center',
    },
    percentageText: {
      marginTop: 4,
      textAlign: 'center',
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : colors.onSurfaceVariant,
    },
  });

export default ConfidenceBar;
