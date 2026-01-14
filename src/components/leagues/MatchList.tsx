import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Button, Chip, Text, IconButton, Menu, Divider, MD3Theme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { LeagueMatch } from '../../types/league';

interface MatchListProps {
  matches: LeagueMatch[];
  onMatchPress: (match: LeagueMatch) => void;
  userRole?: string | null;
  onAdminAction?: {
    onCorrectResult: (match: LeagueMatch) => void;
    onReschedule: (match: LeagueMatch) => void;
    onWalkover: (match: LeagueMatch) => void;
  };
  matchMenuVisible?: string | null;
  setMatchMenuVisible?: (matchId: string | null) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  onMatchPress,
  userRole,
  onAdminAction,
  matchMenuVisible,
  setMatchMenuVisible,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const styles = createStyles(theme);

  // 🔓 운영진도 관리자 권한 부여 (클럽 삭제 제외)
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';

  // MatchList successfully receiving transformed data

  const canSubmitResult = (match: LeagueMatch): boolean => {
    if (!currentUser?.uid || match.status !== 'scheduled') return false;

    // Allow admin/manager to submit results for any match
    if (isAdminOrManager) return true;

    // Allow participants to submit their own results
    return match.player1Id === currentUser.uid || match.player2Id === currentUser.uid;
  };

  const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return t('leagues.match.status.scheduled');
      case 'in_progress':
        return t('leagues.match.status.inProgress');
      case 'completed':
        return t('leagues.match.status.completed');
      case 'pending_approval':
        return t('leagues.match.status.pendingApproval');
      case 'cancelled':
        return t('leagues.match.status.cancelled');
      case 'postponed':
        return t('leagues.match.status.postponed');
      case 'walkover':
        return t('leagues.match.status.walkover');
      default:
        return status;
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.surfaceVariant;
      case 'in_progress':
        return theme.colors.primaryContainer;
      case 'completed':
        return theme.colors.tertiaryContainer;
      case 'pending_approval':
        return theme.colors.secondaryContainer;
      case 'cancelled':
        return theme.colors.errorContainer;
      case 'postponed':
        return theme.colors.outline;
      case 'walkover':
        return theme.colors.outline;
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const renderMatchCard = (match: LeagueMatch, index: number) => {
    const isUserMatch =
      currentUser?.uid &&
      (match.player1Id === currentUser.uid || match.player2Id === currentUser.uid);

    // 🔍 Defensive coding: Handle missing player names
    const player1DisplayName = match.player1Name || match.player1Id || 'Player 1';
    const player2DisplayName = match.player2Name || match.player2Id || 'Player 2';

    // Match rendering with proper player names

    return (
      <Card key={match.id} style={styles.matchCard}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.playersContainer}>
              <Text style={styles.playerName} numberOfLines={2}>
                {player1DisplayName}
              </Text>
              <Text style={styles.vs}>vs</Text>
              <Text style={styles.playerName} numberOfLines={2}>
                {player2DisplayName}
              </Text>
            </View>

            <View style={styles.matchHeaderRight}>
              <Chip
                style={[styles.statusChip, { backgroundColor: getMatchStatusColor(match.status) }]}
                textStyle={styles.statusText}
              >
                {getMatchStatusText(match.status)}
              </Chip>

              {/* Admin menu for matches */}
              {isAdminOrManager && onAdminAction && setMatchMenuVisible && (
                <Menu
                  visible={matchMenuVisible === match.id}
                  onDismiss={() => setMatchMenuVisible(null)}
                  anchor={
                    <IconButton
                      icon='dots-vertical'
                      size={20}
                      onPress={() => setMatchMenuVisible(match.id)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      onAdminAction.onCorrectResult(match);
                      setMatchMenuVisible(null);
                    }}
                    title={t('leagues.match.correctResult')}
                    leadingIcon='pencil'
                  />
                  <Menu.Item
                    onPress={() => {
                      onAdminAction.onReschedule(match);
                      setMatchMenuVisible(null);
                    }}
                    title={t('leagues.match.reschedule')}
                    leadingIcon='calendar'
                  />
                  <Divider />
                  <Menu.Item
                    onPress={() => {
                      onAdminAction.onWalkover(match);
                      setMatchMenuVisible(null);
                    }}
                    title={t('leagues.match.walkover')}
                    leadingIcon='flag'
                  />
                </Menu>
              )}
            </View>
          </View>

          <View style={styles.matchInfo}>
            <View style={styles.infoRow}>
              <Ionicons name='receipt-outline' size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>
                {t('leagues.match.matchNumber', { number: match.matchNumber || index + 1 })}
              </Text>
            </View>

            {match.scheduledDate && (
              <View style={styles.infoRow}>
                <Ionicons name='calendar-outline' size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  {match.scheduledDate.toDate().toLocaleDateString('ko-KR')}
                </Text>
              </View>
            )}

            {match.court && (
              <View style={styles.infoRow}>
                <Ionicons name='location-outline' size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  {t('leagues.match.court')}: {match.court}
                </Text>
              </View>
            )}
          </View>

          {match.status === 'completed' && match.score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>{t('leagues.match.result')}:</Text>
              <Text style={styles.scoreText}>{match.score.finalScore}</Text>
              <Text style={styles.winnerText}>
                {t('leagues.match.winner')}:{' '}
                {match.winner === match.player1Id ? player1DisplayName : player2DisplayName}
              </Text>
            </View>
          )}

          {match.status === 'pending_approval' && match.score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>{t('leagues.match.submittedResult')}:</Text>
              <Text style={styles.scoreText}>{match.score.finalScore}</Text>
              <Text style={styles.winnerText}>
                {t('leagues.match.winner')}:{' '}
                {match.winner === match.player1Id ? player1DisplayName : player2DisplayName}
              </Text>
            </View>
          )}

          {(isUserMatch || isAdminOrManager) && canSubmitResult(match) && (
            <View style={styles.actionContainer}>
              <Button
                mode='contained'
                onPress={() => onMatchPress(match)}
                style={styles.submitButton}
                compact
                icon={isAdminOrManager && !isUserMatch ? 'shield-account' : undefined}
              >
                {isAdminOrManager && !isUserMatch
                  ? t('leagues.match.submitResultAdmin')
                  : t('leagues.match.submitResult')}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (matches.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <Ionicons name='trophy-outline' size={64} color={theme.colors.outline} />
          <Text style={styles.emptyTitle}>{t('leagues.match.noMatches')}</Text>
          <Text style={styles.emptyText}>{t('leagues.match.matchesWillAppear')}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {matches.map((match, index) => renderMatchCard(match, index))}
    </View>
  );
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    matchCard: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
    },
    matchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    playersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    playerName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1, // 🎯 [KIM FIX] Take equal space for both player names
      flexShrink: 1, // Allow shrinking when space is limited
    },
    vs: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginHorizontal: 8,
      flexShrink: 0, // 🎯 [KIM FIX] Keep "vs" fixed width
    },
    matchHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0, // 🎯 [KIM FIX] Prevent chip from shrinking
    },
    statusChip: {
      marginRight: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    matchInfo: {
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 8,
    },
    scoreContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    scoreLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    winnerText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    actionContainer: {
      alignItems: 'flex-end',
    },
    submitButton: {
      minWidth: 100,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
    },
    emptyContent: {
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

export default MatchList;
