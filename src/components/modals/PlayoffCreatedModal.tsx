import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';

interface PlayoffCreatedModalProps {
  visible: boolean;
  onClose: () => void;
  qualifiedPlayers: Array<{ playerId: string; playerName: string }>;
  playoffType: 'final' | 'semifinals';
  leagueName: string;
  onViewMatches?: () => void;
}

export const PlayoffCreatedModal: React.FC<PlayoffCreatedModalProps> = ({
  visible,
  onClose,
  qualifiedPlayers,
  playoffType,
  leagueName,
  onViewMatches,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();

  const playoffTypeText =
    playoffType === 'final'
      ? t('modals.playoffCreated.final')
      : t('modals.playoffCreated.semifinals');

  return (
    <Modal visible={visible} animationType='slide' transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name='trophy' size={60} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('modals.playoffCreated.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {leagueName}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          {/* Playoff Type */}
          <View style={styles.playoffTypeContainer}>
            <Text style={[styles.playoffTypeLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('modals.playoffCreated.playoffType')}
            </Text>
            <Text style={[styles.playoffTypeValue, { color: theme.colors.primary }]}>
              {playoffTypeText}
            </Text>
          </View>

          {/* Qualified Players */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {t('modals.playoffCreated.qualifiedPlayers')}
          </Text>
          <ScrollView style={styles.playerList}>
            {qualifiedPlayers.map((player, index) => (
              <View
                key={player.playerId}
                style={[styles.playerCard, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <View style={styles.playerRank}>
                  <Text style={[styles.rankText, { color: theme.colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.playerName, { color: theme.colors.onSurface }]}>
                  {player.playerName}
                </Text>
                <Ionicons name='checkmark-circle' size={24} color={theme.colors.primary} />
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onViewMatches && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  onViewMatches();
                  onClose();
                }}
              >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                  {t('modals.playoffCreated.viewMatches')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.outline }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.colors.onSurface }]}>
                {t('modals.playoffCreated.close')}
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
    fontSize: 24,
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
  playoffTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  playoffTypeLabel: {
    fontSize: 14,
  },
  playoffTypeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  playerList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
