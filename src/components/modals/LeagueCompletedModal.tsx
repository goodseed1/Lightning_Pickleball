import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';

interface LeagueCompletedModalProps {
  visible: boolean;
  onClose: () => void;
  winner: {
    playerId: string;
    playerName: string;
    finalPoints: number;
    finalRecord: string; // "10W-2D-1L"
  };
  runnerUp?: {
    playerId: string;
    playerName: string;
    finalPoints: number;
    finalRecord: string;
  };
  leagueName: string;
  onViewFeed?: () => void;
}

export const LeagueCompletedModal: React.FC<LeagueCompletedModalProps> = ({
  visible,
  onClose,
  winner,
  runnerUp,
  leagueName,
  onViewFeed,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType='slide' transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Header with Trophy */}
          <View style={styles.header}>
            <Ionicons name='trophy' size={80} color='#FFD700' />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('modals.leagueCompleted.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {leagueName}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          {/* Winner Section */}
          <View style={styles.winnerSection}>
            <View style={styles.winnerHeader}>
              <Ionicons name='trophy' size={24} color='#FFD700' />
              <Text style={styles.winnerLabel}>{t('modals.leagueCompleted.winner')}</Text>
            </View>
            <View style={[styles.playerCard, styles.winnerCard]}>
              <Text style={styles.playerName}>{winner.playerName}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>{winner.finalRecord}</Text>
                <Text style={styles.pointsText}>
                  {winner.finalPoints}
                  {t('modals.leagueCompleted.points')}
                </Text>
              </View>
            </View>
          </View>

          {/* Runner-up Section (if exists) */}
          {runnerUp && (
            <View style={styles.runnerUpSection}>
              <View style={styles.runnerUpHeader}>
                <Ionicons name='medal' size={24} color='#C0C0C0' />
                <Text style={styles.runnerUpLabel}>{t('modals.leagueCompleted.runnerUp')}</Text>
              </View>
              <View style={[styles.playerCard, styles.runnerUpCard]}>
                <Text style={styles.playerName}>{runnerUp.playerName}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>{runnerUp.finalRecord}</Text>
                  <Text style={styles.pointsText}>
                    {runnerUp.finalPoints}
                    {t('modals.leagueCompleted.points')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onViewFeed && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  if (onViewFeed) {
                    onViewFeed();
                  }
                  onClose();
                }}
              >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                  {t('modals.leagueCompleted.viewFeed')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.outline }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.colors.onSurface }]}>
                {t('modals.leagueCompleted.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  winnerSection: {
    marginBottom: 16,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  winnerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
  },
  winnerCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  runnerUpSection: {
    marginBottom: 16,
  },
  runnerUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  runnerUpLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C0C0C0',
  },
  runnerUpCard: {
    backgroundColor: '#F5F5F5',
    borderColor: '#C0C0C0',
    borderWidth: 2,
  },
  playerCard: {
    padding: 16,
    borderRadius: 12,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    elevation: 2,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
