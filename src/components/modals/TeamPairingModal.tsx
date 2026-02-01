/**
 * 🦾 Iron Man's Masterpiece: Team Pairing Modal
 * Doubles tournament team composition interface with drag-and-drop
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';

interface Player {
  uid: string;
  displayName: string;
  photoURL?: string;
}

interface Team {
  id: string;
  player1: Player;
  player2: Player;
}

interface TeamPairingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (teams: Team[]) => void;
  players: Player[]; // List of selected players (must be even number)
}

const TeamPairingModal: React.FC<TeamPairingModalProps> = ({
  visible,
  onClose,
  onConfirm,
  players,
}) => {
  const { t } = useLanguage();
  const { paperTheme: theme } = useTheme();

  // 🔍 Debug: Log visibility changes
  console.log(
    '🔍 [TeamPairingModal] Rendering - visible:',
    visible,
    'players count:',
    players.length
  );

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Initialize teams when modal opens
  useEffect(() => {
    if (visible && players.length > 0) {
      initializeTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, players]);

  const initializeTeams = () => {
    // Auto-pair players in order
    const newTeams: Team[] = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        newTeams.push({
          id: `team-${i / 2 + 1}`,
          player1: players[i],
          player2: players[i + 1],
        });
      }
    }
    setTeams(newTeams);
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  // Find which team a player belongs to
  const findPlayerTeam = (playerUid: string): Team | undefined => {
    return teams.find(t => t.player1?.uid === playerUid || t.player2?.uid === playerUid);
  };

  // Check if two players are on the same team
  const areOnSameTeam = (player1Uid: string, player2Uid: string): boolean => {
    const team = findPlayerTeam(player1Uid);
    if (!team) return false;
    return team.player1?.uid === player2Uid || team.player2?.uid === player2Uid;
  };

  // Swap two players directly (fix for React state async issue)
  const swapPlayers = (sourcePlayer: Player, targetPlayer: Player) => {
    if (!sourcePlayer || !targetPlayer) return;

    // Prevent swapping within the same team
    if (areOnSameTeam(sourcePlayer.uid, targetPlayer.uid)) {
      setSelectedPlayer(null);
      return;
    }

    // Swap players
    setTeams(prevTeams =>
      prevTeams.map(t => {
        let newTeam = { ...t };

        // Replace source with target
        if (t.player1?.uid === sourcePlayer.uid) {
          newTeam = { ...newTeam, player1: targetPlayer };
        } else if (t.player2?.uid === sourcePlayer.uid) {
          newTeam = { ...newTeam, player2: targetPlayer };
        }

        // Replace target with source
        if (t.player1?.uid === targetPlayer.uid) {
          newTeam = { ...newTeam, player1: sourcePlayer };
        } else if (t.player2?.uid === targetPlayer.uid) {
          newTeam = { ...newTeam, player2: sourcePlayer };
        }

        return newTeam;
      })
    );

    // Reset selection
    setSelectedPlayer(null);
  };

  const handleConfirm = () => {
    // Validate all teams have 2 players
    const invalidTeams = teams.filter(t => !t.player1 || !t.player2);
    if (invalidTeams.length > 0) {
      Alert.alert(t('common.error'), t('teamPairing.validation.allTeamsMustHavePlayers'));
      return;
    }

    onConfirm(teams);
    onClose();
  };

  const renderTeamCard = (team: Team, index: number) => {
    // Check if player1 or player2 is on the same team as the selected player (and not the selected player itself)
    const isPlayer1SameTeamAsSelected =
      selectedPlayer &&
      selectedPlayer.uid !== team.player1?.uid &&
      areOnSameTeam(selectedPlayer.uid, team.player1?.uid);
    const isPlayer2SameTeamAsSelected =
      selectedPlayer &&
      selectedPlayer.uid !== team.player2?.uid &&
      areOnSameTeam(selectedPlayer.uid, team.player2?.uid);

    return (
      <View
        key={team.id}
        style={[
          styles.teamCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}
      >
        <View style={styles.teamHeader}>
          <Text style={[styles.teamTitle, { color: theme.colors.onSurface }]}>
            {t('teamPairing.teamLabel', { number: index + 1 })}
          </Text>
        </View>

        <View style={styles.teamPlayers}>
          {/* Player 1 */}
          <TouchableOpacity
            style={[
              styles.playerSlot,
              { backgroundColor: theme.colors.surfaceVariant },
              selectedPlayer?.uid === team.player1?.uid && styles.playerSlotHighlighted,
              isPlayer1SameTeamAsSelected && styles.playerSlotDisabled,
            ]}
            onPress={() => {
              // Prevent selecting teammate of already selected player
              if (isPlayer1SameTeamAsSelected) return;

              if (selectedPlayer) {
                // Swap the selected player with this player
                swapPlayers(selectedPlayer, team.player1);
              } else {
                handlePlayerSelect(team.player1);
              }
            }}
            disabled={isPlayer1SameTeamAsSelected ?? undefined}
          >
            <Ionicons
              name='person'
              size={24}
              color={
                isPlayer1SameTeamAsSelected ? theme.colors.outline : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.playerName,
                {
                  color: isPlayer1SameTeamAsSelected
                    ? theme.colors.outline
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {team.player1?.displayName || t('teamPairing.noPlayer')}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.teamDivider}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>+</Text>
          </View>

          {/* Player 2 */}
          <TouchableOpacity
            style={[
              styles.playerSlot,
              { backgroundColor: theme.colors.surfaceVariant },
              selectedPlayer?.uid === team.player2?.uid && styles.playerSlotHighlighted,
              isPlayer2SameTeamAsSelected && styles.playerSlotDisabled,
            ]}
            onPress={() => {
              // Prevent selecting teammate of already selected player
              if (isPlayer2SameTeamAsSelected) return;

              if (selectedPlayer) {
                // Swap the selected player with this player
                swapPlayers(selectedPlayer, team.player2);
              } else {
                handlePlayerSelect(team.player2);
              }
            }}
            disabled={isPlayer2SameTeamAsSelected ?? undefined}
          >
            <Ionicons
              name='person'
              size={24}
              color={
                isPlayer2SameTeamAsSelected ? theme.colors.outline : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.playerName,
                {
                  color: isPlayer2SameTeamAsSelected
                    ? theme.colors.outline
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {team.player2?.displayName || t('teamPairing.noPlayer')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <StatusBar style='dark' />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name='close' size={28} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {t('teamPairing.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Instructions */}
        <View style={[styles.instructions, { backgroundColor: theme.colors.primaryContainer }]}>
          <Ionicons name='information-circle' size={20} color={theme.colors.onPrimaryContainer} />
          <Text style={[styles.instructionsText, { color: theme.colors.onPrimaryContainer }]}>
            {selectedPlayer
              ? t('teamPairing.instructions.selected')
              : t('teamPairing.instructions.notSelected')}
          </Text>
        </View>

        {/* Teams List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.teamsList}>
            {teams.map((team, index) => renderTeamCard(team, index))}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View
          style={[
            styles.bottomActionBar,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.colors.outline }]}
            onPress={initializeTeams}
          >
            <Ionicons name='refresh' size={20} color={theme.colors.onSurface} />
            <Text style={[styles.resetButtonText, { color: theme.colors.onSurface }]}>
              {t('teamPairing.reset')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleConfirm}
          >
            <Ionicons name='checkmark' size={20} color='#fff' style={{ marginRight: 4 }} />
            <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  teamsList: {
    padding: 16,
    gap: 16,
  },
  teamCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  teamHeader: {
    marginBottom: 12,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  playerSlotHighlighted: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  playerSlotDisabled: {
    opacity: 0.4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  teamDivider: {
    paddingHorizontal: 4,
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeamPairingModal;
