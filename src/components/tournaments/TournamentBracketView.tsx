/**
 * Tournament Bpaddle View Component
 * Displays tournament bpaddle with interactive match cards
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';

interface PickleballScore {
  player1Games: number[];
  player2Games: number[];
  player1Sets: number;
  player2Sets: number;
  isCompleted: boolean;
  winner?: 'player1' | 'player2';
  bye?: boolean;
  walkover?: boolean;
  retired?: boolean;
}

interface Player {
  playerId: string;
  playerName: string;
  seed: number;
}

interface Match {
  id: string;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  score: PickleballScore | null;
  status: string;
  nextMatchId?: string;
  type?: string; // 'final' | 'consolation' | 'semifinals' (for playoff labels)
}

interface Round {
  roundNumber: number;
  matches: Match[];
}

interface Bpaddle {
  rounds: Round[];
  champion: Player | null;
}

interface TournamentParticipant {
  id: string;
  name: string;
  seed: number;
}

interface TournamentBpaddleViewProps {
  bpaddle: Bpaddle;
  participants?: TournamentParticipant[];
  currentUserId?: string;
  isTournamentAdmin?: boolean;
  onMatchPress?: (match: Match) => void;
}

const TournamentBpaddleView: React.FC<TournamentBpaddleViewProps> = ({
  bpaddle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  participants = [],
  currentUserId,
  isTournamentAdmin = false,
  onMatchPress,
}) => {
  const { t } = useLanguage();
  const { paperTheme: theme } = useTheme();

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    // For small tournaments, use simple progressive naming
    if (totalRounds <= 3) {
      if (roundNumber === totalRounds) {
        return t('tournamentBpaddle.rounds.final');
      } else if (roundNumber === totalRounds - 1 && totalRounds > 2) {
        return t('tournamentBpaddle.rounds.semifinals');
      } else {
        return t('tournamentBpaddle.rounds.round', { number: roundNumber });
      }
    }

    // For larger tournaments, use traditional naming
    const roundsFromFinal = totalRounds - roundNumber;
    switch (roundsFromFinal) {
      case 0:
        return t('tournamentBpaddle.rounds.final');
      case 1:
        return t('tournamentBpaddle.rounds.semifinals');
      case 2:
        return t('tournamentBpaddle.rounds.quarterfinals');
      case 3:
        return t('tournamentBpaddle.rounds.roundOf16');
      case 4:
        return t('tournamentBpaddle.rounds.roundOf32');
      case 5:
        return t('tournamentBpaddle.rounds.roundOf64');
      default:
        return t('tournamentBpaddle.rounds.round', { number: roundNumber });
    }
  };

  const getMatchSpacing = (roundNumber: number) => {
    return Math.pow(2, roundNumber - 1) * 40;
  };

  const formatScore = (score: PickleballScore | null | unknown) => {
    if (!score) return '';

    // Handle different score formats
    if (typeof score === 'string') return score;
    if (typeof score === 'object' && score !== null) {
      // Type-safe property access with proper type guards
      const scoreObj = score as Record<string, unknown>;

      if (scoreObj.bye === true) return t('tournamentBpaddle.scoreStatus.bye');
      if (scoreObj.walkover === true) return t('tournamentBpaddle.scoreStatus.walkover');
      if (scoreObj.retired === true) return t('tournamentBpaddle.scoreStatus.retired');

      // Handle tournament score format with sets array
      if (scoreObj.sets && Array.isArray(scoreObj.sets) && scoreObj.sets.length > 0) {
        // Format: "6-4, 7-5" for multiple sets
        return scoreObj.sets
          .map((set: unknown) => {
            if (typeof set === 'string') return set;
            if (
              set &&
              typeof set === 'object' &&
              set !== null &&
              (set as { player1Games?: number; player2Games?: number }).player1Games !==
                undefined &&
              (set as { player1Games?: number; player2Games?: number }).player2Games !== undefined
            ) {
              return `${(set as { player1Games: number; player2Games: number }).player1Games}-${(set as { player1Games: number; player2Games: number }).player2Games}`;
            }
            return '';
          })
          .filter((s: string) => s)
          .join(', ');
      }

      // Handle finalScore field directly
      if (scoreObj.finalScore && typeof scoreObj.finalScore === 'string') {
        return scoreObj.finalScore;
      }
    }

    return '';
  };

  const isUserInMatch = (match: Match) => {
    if (!currentUserId) return false;
    return match.player1?.playerId === currentUserId || match.player2?.playerId === currentUserId;
  };

  const canSubmitScore = (match: Match) => {
    // Can submit if match is scheduled/in_progress and user is participant or admin
    const hasValidStatus = match.status === 'scheduled' || match.status === 'in_progress';
    const hasBothPlayers = match.player1 && match.player2;
    const hasPermission = isUserInMatch(match) || isTournamentAdmin;

    return hasValidStatus && hasBothPlayers && hasPermission;
  };

  const handleMatchPress = (match: Match) => {
    if (canSubmitScore(match)) {
      if (onMatchPress) {
        onMatchPress(match);
      }
    } else if (match.status === 'completed') {
      // Show match details
      const winnerName = match.winner?.playerName || 'Winner';
      const scoreText = formatScore(match.score);
      Alert.alert(
        t('match_result') || 'Match Result',
        `${winnerName} ${t('won') || 'won'} ${scoreText}`,
        [{ text: t('tournamentBpaddle.ok') || 'OK' }]
      );
    } else {
      // Show why score input is not available
      let message = '';
      if (!match.player1 || !match.player2) {
        message = t('tournamentBpaddle.match_not_ready') || 'Match participants not yet determined';
      } else if (match.status === 'completed') {
        message = t('tournamentBpaddle.match_completed') || 'This match has already been completed';
      } else if (!isUserInMatch(match) && !isTournamentAdmin) {
        message =
          t('tournamentBpaddle.no_permission') ||
          'You can only enter scores for your own matches or if you are the tournament admin';
      } else {
        message =
          t('tournamentBpaddle.cannot_enter_score') || 'Score entry not available for this match';
      }

      Alert.alert(t('tournamentBpaddle.info') || 'Info', message, [
        { text: t('tournamentBpaddle.ok') || 'OK' },
      ]);
    }
  };

  const renderPlayer = (
    player: Player | null,
    isWinner: boolean,
    isMatchCompleted: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    matchId?: string
  ) => {
    if (!player) {
      return (
        <View style={styles.playerSlot}>
          <Text style={[styles.playerName, { color: theme.colors.onSurfaceVariant }]}>
            {t('tournamentBpaddle.player.tbd')}
          </Text>
        </View>
      );
    }

    const isCurrentUser = player.playerId === currentUserId;
    const isLoser = isMatchCompleted && !isWinner;

    // Ensure player name is always a string
    const playerName = player.playerName
      ? String(player.playerName)
      : t('tournamentBpaddle.player.tbd');
    // Ensure seed is a number and not displayed if 0
    const seed =
      player.seed && typeof player.seed === 'number' && player.seed > 0 ? player.seed : null;

    return (
      <View
        style={[
          styles.playerSlot,
          isWinner && { backgroundColor: theme.colors.primaryContainer },
          isCurrentUser && !isWinner && { backgroundColor: theme.colors.secondaryContainer },
          isLoser && { opacity: 0.6 }, // Dim the loser
        ]}
      >
        {seed && (
          <Text
            style={[
              styles.seedNumber,
              { color: theme.colors.onSurfaceVariant },
              isLoser && { opacity: 0.7 },
            ]}
          >
            {String(seed)}
          </Text>
        )}

        <Text
          style={[
            styles.playerName,
            {
              color: '#FFFFFF', // Always white for visibility
              fontWeight: '700', // All players bold
            },
            isWinner && {
              fontWeight: '700',
              color: theme.colors.onPrimaryContainer,
            },
            isCurrentUser &&
              !isWinner && {
                fontWeight: '700',
                color: theme.colors.onSecondaryContainer,
              },
            isLoser && {
              fontWeight: '700', // Keep loser text bold
              color: '#FFFFFF', // White color, no dimming
              opacity: 0.7, // Slightly dimmed but still visible
            },
          ]}
          numberOfLines={1}
        >
          {playerName}
        </Text>

        {/* Winner trophy icon - more prominent for playoffs */}
        {isWinner && isMatchCompleted && (
          <Ionicons name='trophy' size={20} color='#FFD700' style={{ marginLeft: 8 }} />
        )}
      </View>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderMatch = (match: Match, _roundIndex: number) => {
    // Hide matches where both players are TBD/null
    if (!match.player1 && !match.player2) {
      return null;
    }

    const isCompleted = match.status === 'completed';
    const canSubmit = canSubmitScore(match);
    const hasScore = isCompleted && match.score;
    const scoreText = hasScore ? formatScore(match.score) : '';

    // Enhanced winner determination for display
    const getWinnerId = (match: Match): string | null => {
      // Check match.winner object first (converted from bpaddle format)
      if (match.winner?.playerId) {
        return match.winner.playerId;
      }
      // Then check for any _winner field in score or match data
      const matchData = match as Match & { _winner?: string; score?: { _winner?: string } };
      return matchData._winner || matchData.score?._winner || null;
    };

    const winnerId = getWinnerId(match);

    // Get match type label for playoffs (1,2위전 / 3,4위전)
    const getMatchTypeLabel = (type?: string) => {
      if (type === 'final') return t('tournamentBpaddle.matchType.final');
      if (type === 'consolation') return t('tournamentBpaddle.matchType.consolation');
      return null;
    };

    const matchTypeLabel = getMatchTypeLabel(match.type);

    return (
      <TouchableOpacity
        key={match.id}
        style={[
          styles.matchCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          canSubmit && {
            ...styles.activeMatch,
            borderColor: theme.colors.primary,
            borderWidth: 2,
            backgroundColor: theme.colors.primary + '08',
          },
          isCompleted && styles.completedMatch,
        ]}
        onPress={() => handleMatchPress(match)}
        activeOpacity={0.7}
      >
        {/* Player 1 */}
        {renderPlayer(match.player1, winnerId === match.player1?.playerId, isCompleted, match.id)}

        {/* Score Section - Enhanced to show score directly */}
        <View
          style={[
            styles.matchCenter,
            { backgroundColor: isCompleted ? theme.colors.surfaceVariant : theme.colors.outline },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Match Type Label (for playoffs: 1,2위전 / 3,4위전) */}
            {matchTypeLabel && (
              <View
                style={[styles.matchTypeLabel, { backgroundColor: theme.colors.tertiaryContainer }]}
              >
                <Text
                  style={[styles.matchTypeLabelText, { color: theme.colors.onTertiaryContainer }]}
                >
                  {matchTypeLabel}
                </Text>
              </View>
            )}

            {hasScore && scoreText ? (
              <Text
                style={[
                  styles.matchScoreText,
                  { color: theme.colors.onSurface, fontWeight: '600' },
                ]}
              >
                {scoreText}
              </Text>
            ) : canSubmit ? (
              <View style={styles.scoreInputIndicator}>
                <Ionicons name='create' size={16} color={theme.colors.primary} />
                <Text style={[styles.scoreInputText, { color: theme.colors.primary }]}>
                  {t('tournamentBpaddle.actions.tap')}
                </Text>
              </View>
            ) : (
              <View style={styles.matchVersus}>
                <Text style={[styles.versusText, { color: theme.colors.onSurfaceVariant }]}>
                  {t('tournamentBpaddle.match.versus')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Player 2 */}
        {renderPlayer(match.player2, winnerId === match.player2?.playerId, isCompleted, match.id)}

        {/* Live Indicator */}
        {match.status === 'in_progress' && (
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>{t('tournamentBpaddle.match.live')}</Text>
          </View>
        )}

        {/* 🎯 [KIM FIX] Removed duplicate winnerIndicator - trophy already shown next to winner's name (Line 278) */}
      </TouchableOpacity>
    );
  };

  const renderRound = (round: Round) => {
    const roundName = getRoundName(round.roundNumber, bpaddle.rounds.length);
    const matchSpacing = getMatchSpacing(round.roundNumber);

    // Check if this is the current active round
    const isCurrentRound = round.matches.some(
      match =>
        match.status === 'in_progress' ||
        (match.status === 'scheduled' &&
          match.player1 &&
          match.player2 &&
          match.player1.playerId !== 'TBD' &&
          match.player2.playerId !== 'TBD')
    );

    return (
      <View
        key={`round_${round.roundNumber}`}
        style={[styles.roundContainer, isCurrentRound && styles.currentRoundContainer]}
      >
        <View
          style={[
            styles.roundHeader,
            isCurrentRound && { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text
            style={[
              styles.roundTitle,
              { color: isCurrentRound ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
            ]}
          >
            {String(roundName)}
          </Text>
          {isCurrentRound && (
            <View style={styles.currentRoundBadge}>
              <Ionicons name='play-circle' size={16} color={theme.colors.primary} />
              <Text style={[styles.currentRoundText, { color: theme.colors.primary }]}>
                {t('tournamentBpaddle.round.active')}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.matchesContainer, { gap: matchSpacing }]}>
          {round.matches &&
            Array.isArray(round.matches) &&
            round.matches.map(match => renderMatch(match, round.roundNumber - 1))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <View style={styles.bpaddleWrapper}>
          <View style={styles.bpaddleContainer}>
            {/* Rounds and Matches */}
            {bpaddle.rounds.map(round => renderRound(round))}

            {/* Champion Display */}
            {bpaddle.champion && (
              <View style={styles.championContainer}>
                <Text style={[styles.championTitle, { color: theme.colors.onSurface }]}>
                  {t('tournamentBpaddle.champion.title')}
                </Text>
                <View
                  style={[
                    styles.championCard,
                    { backgroundColor: theme.colors.surfaceVariant, borderColor: '#FFD700' },
                  ]}
                >
                  <Ionicons name='trophy' size={24} color='#FFD700' />
                  <Text style={[styles.championName, { color: theme.colors.onSurface }]}>
                    {String(bpaddle.champion.playerName || t('tournamentBpaddle.champion.title'))}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  horizontalScrollContent: {
    alignItems: 'flex-start',
  },
  bpaddleWrapper: {
    position: 'relative', // Enable absolute positioning for SVG overlay
  },
  bpaddleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'flex-start',
  },
  roundContainer: {
    marginRight: 40,
    minWidth: 200,
    flex: 0,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  matchesContainer: {
    justifyContent: 'center',
    flexDirection: 'column',
  },
  matchCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 180,
  },
  activeMatch: {
    borderWidth: 2,
  },
  completedMatch: {
    opacity: 0.8,
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  seedNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
  },
  matchDivider: {
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  liveIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  championContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 40,
  },
  championTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  championCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
  },
  championName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  scoreInputIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  scoreInputText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // New styles for enhanced tournament bpaddle display
  matchCenter: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchScoreText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  matchVersus: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  versusText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  winnerTrophy: {
    marginLeft: 6,
  },
  // 🎯 [KIM FIX] Removed unused winnerIndicator style - trophy now only shown inline next to winner name
  // 🏆 Enhanced Panorama Tournament Bpaddle Styles
  currentRoundContainer: {
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 4,
  },
  roundHeader: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentRoundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  currentRoundText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchTypeLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchTypeLabelText: {
    fontSize: 9,
    fontWeight: '600',
  },
});

export default TournamentBpaddleView;
