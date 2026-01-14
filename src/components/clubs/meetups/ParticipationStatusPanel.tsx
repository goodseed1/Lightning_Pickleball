/**
 * Participation Status Panel Component
 * Visual panel showing court count, participant count, and dynamic status
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useTheme as useLTTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ParticipationStatusPanelProps {
  courtCount: number;
  participantCount: number;
  statusKey: 'courtsAvailable' | 'perfectMatch' | 'waitingCount';
  waitingCount?: number;
  statusColor: 'green' | 'blue' | 'orange' | 'red';
  language?: 'ko' | 'en';
}

const ParticipationStatusPanel: React.FC<ParticipationStatusPanelProps> = ({
  courtCount,
  participantCount,
  statusKey,
  waitingCount,
  statusColor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language = 'ko',
}) => {
  const { t } = useLanguage();

  // 🌐 [i18n] Generate status message based on key
  const getStatusMessage = (): string => {
    switch (statusKey) {
      case 'courtsAvailable':
        return t('participationStatus.courtsAvailable');
      case 'perfectMatch':
        return t('participationStatus.perfectMatch');
      case 'waitingCount':
        return t('participationStatus.waitingCount', { count: waitingCount || 0 });
      default:
        return '';
    }
  };
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green':
        return '#4CAF50';
      case 'blue':
        return '#2196F3';
      case 'orange':
        return '#FF9800';
      case 'red':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.content}>
        {/* Courts and Participants Row */}
        <View style={styles.statsRow}>
          {/* Court Count */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.courtIcon}>🏟️</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{courtCount}</Text>
              <Text style={styles.statLabel}>{t('participationStatus.courts')}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Participant Count */}
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <Text style={styles.participantIcon}>👥</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{participantCount}</Text>
              <Text style={styles.statLabel}>{t('participationStatus.players')}</Text>
            </View>
          </View>
        </View>

        {/* Status Message */}
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(statusColor) }]} />
            <Text style={[styles.statusMessage, { color: getStatusColor(statusColor) }]}>
              {getStatusMessage()}
            </Text>
          </View>
        </View>

        {/* Capacity Bar */}
        <View style={styles.capacityContainer}>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${Math.min((participantCount / (courtCount * 4)) * 100, 100)}%`,
                  backgroundColor: getStatusColor(statusColor),
                },
              ]}
            />
          </View>
          <Text style={styles.capacityText}>
            {t('participationStatus.capacity', {
              current: participantCount,
              max: courtCount * 4,
            })}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      borderRadius: 10,
      backgroundColor: colors.surface,
      marginHorizontal: 8,
      marginVertical: 4,
    },
    content: {
      padding: 10,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 6,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 4,
    },
    iconContainer: {
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    courtIcon: {
      fontSize: 22,
      lineHeight: 28,
    },
    participantIcon: {
      fontSize: 22,
      lineHeight: 28,
    },
    statContent: {
      alignItems: 'flex-start',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      lineHeight: 22,
    },
    statLabel: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    divider: {
      width: 1,
      height: 28,
      backgroundColor: colors.outlineVariant,
      marginHorizontal: 10,
    },
    statusContainer: {
      marginBottom: 6,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    statusMessage: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    capacityContainer: {
      alignItems: 'center',
    },
    capacityBar: {
      width: '100%',
      height: 6,
      backgroundColor: colors.outlineVariant,
      borderRadius: 3,
      marginBottom: 4,
    },
    capacityFill: {
      height: '100%',
      borderRadius: 3,
      minWidth: 3,
    },
    capacityText: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

export default ParticipationStatusPanel;
