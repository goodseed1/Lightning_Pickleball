/**
 * 🏆 Tournament Rankings Tab - Hall of Fame Display
 * Iron Man's Masterpiece UI Component for Tournament Rankings
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DataTable, Text, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { TournamentParticipant, BracketMatch, TournamentEventType } from '../../types/tournament';
import tournamentService from '../../services/tournamentService';

interface TournamentRankingsTabProps {
  participants: TournamentParticipant[];
  matches: BracketMatch[];
  currentUserId?: string;
  eventType?: TournamentEventType;
}

interface RankingData {
  participant: TournamentParticipant;
  rank: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setDifference: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  winRate: number;
}

const TournamentRankingsTab: React.FC<TournamentRankingsTabProps> = ({
  participants,
  matches,
  currentUserId,
  eventType,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // 🧮 Thor's ranking calculation with memoization for performance
  const rankings = useMemo((): RankingData[] => {
    console.log("🎨 [IRON MAN] Calculating rankings with Thor's engine...", {
      participantCount: participants.length,
      matchCount: matches.length,
      eventType,
    });

    return tournamentService.calculateRankingsSync(participants, matches, eventType);
  }, [participants, matches, eventType]);

  // 🎯 Helper functions for UI display
  const formatWinLoss = (wins: number, losses: number): string => {
    return `${wins}-${losses}`;
  };

  const formatDifference = (difference: number): string => {
    return difference >= 0 ? `+${difference}` : `${difference}`;
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#6B7280'; // Gray for 4th place and below
    }
  };

  const isCurrentUser = (playerId: string): boolean => {
    return currentUserId === playerId;
  };

  // 🎨 Tournament summary stats
  const tournamentStats = useMemo(() => {
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const totalMatches = matches.length;
    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return {
      completedMatches,
      totalMatches,
      progress: Math.round(progress),
      activeParticipants: rankings.filter(r => r.wins + r.losses > 0).length,
    };
  }, [matches, rankings]);

  if (rankings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name='trophy-outline' size={64} color={theme.colors.outline} />
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {t('tournamentRankings.noRankingsYet')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {t('tournamentRankings.rankingsWillAppear')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 🏆 Tournament Progress Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
            {t('tournamentRankings.tournamentProgress')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {tournamentStats.progress}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('tournamentRankings.complete')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {tournamentStats.completedMatches}/{tournamentStats.totalMatches}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('tournamentRankings.matches')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {tournamentStats.activeParticipants}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                {t('tournamentRankings.activePlayers')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 🎯 Rankings Table */}
      <Card style={styles.rankingsCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.tableHeader}>
            <Ionicons
              name='trophy'
              size={24}
              color={theme.colors.primary}
              style={styles.headerIcon}
            />
            <Text style={[styles.tableTitle, { color: theme.colors.onSurface }]}>
              {t('tournamentRankings.hallOfFame')}
            </Text>
          </View>

          <DataTable style={styles.dataTable}>
            {/* Table Header */}
            <DataTable.Header style={styles.tableHeaderRow}>
              <DataTable.Title
                style={styles.rankColumn}
                textStyle={[styles.headerText, { color: theme.colors.onSurface }]}
              >
                {t('tournamentRankings.rank')}
              </DataTable.Title>
              <DataTable.Title
                style={styles.playerColumn}
                textStyle={[styles.headerText, { color: theme.colors.onSurface }]}
              >
                {t('tournamentRankings.player')}
              </DataTable.Title>
              <DataTable.Title
                numeric
                style={styles.recordColumn}
                textStyle={[styles.headerText, { color: theme.colors.onSurface }]}
              >
                {t('tournamentRankings.winLoss')}
              </DataTable.Title>
              <DataTable.Title
                numeric
                style={styles.setsColumn}
                textStyle={[styles.headerText, { color: theme.colors.onSurface }]}
              >
                {t('tournamentRankings.sets')}
              </DataTable.Title>
              <DataTable.Title
                numeric
                style={styles.gamesColumn}
                textStyle={[styles.headerText, { color: theme.colors.onSurface }]}
              >
                {t('tournamentRankings.games')}
              </DataTable.Title>
            </DataTable.Header>

            {/* Table Rows */}
            {rankings.map(ranking => {
              const isUserRow = isCurrentUser(ranking.participant.playerId);
              const rankColor = getRankColor(ranking.rank);

              return (
                <DataTable.Row
                  key={ranking.participant.playerId}
                  style={[
                    styles.tableRow,
                    isUserRow && { backgroundColor: theme.colors.primaryContainer },
                    ranking.rank <= 3 && styles.topThreeRow,
                  ]}
                >
                  {/* Rank Column - 순위 숫자 + 아이콘 */}
                  <DataTable.Cell style={styles.rankColumn}>
                    <View style={styles.rankContent}>
                      <Text style={[styles.rankNumber, { color: rankColor }]}>{ranking.rank}</Text>
                      {ranking.rank <= 3 && (
                        <Ionicons
                          name={ranking.rank === 1 ? 'trophy' : 'medal'}
                          size={18}
                          color={rankColor}
                        />
                      )}
                    </View>
                  </DataTable.Cell>

                  {/* Player Column - 복식은 두 이름을 동등하게 표시 */}
                  <DataTable.Cell style={styles.playerColumn}>
                    {ranking.participant.playerName.includes('/') ? (
                      <View style={styles.doubleNamesContainer}>
                        <Text
                          style={[
                            styles.playerNamePart,
                            { color: theme.colors.onSurface, textAlign: 'right' },
                            isUserRow && {
                              color: theme.colors.onPrimaryContainer,
                              fontWeight: '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {ranking.participant.playerName.split('/')[0].trim()}
                        </Text>
                        <Text
                          style={[
                            styles.playerNameDivider,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          /
                        </Text>
                        <Text
                          style={[
                            styles.playerNamePart,
                            { color: theme.colors.onSurface, textAlign: 'left' },
                            isUserRow && {
                              color: theme.colors.onPrimaryContainer,
                              fontWeight: '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {ranking.participant.playerName.split('/')[1].trim()}
                        </Text>
                        {isUserRow && (
                          <Ionicons
                            name='person'
                            size={14}
                            color={theme.colors.onPrimaryContainer}
                            style={styles.userIndicator}
                          />
                        )}
                      </View>
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.playerName,
                            { color: theme.colors.onSurface },
                            isUserRow && {
                              color: theme.colors.onPrimaryContainer,
                              fontWeight: '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {ranking.participant.playerName}
                        </Text>
                        {isUserRow && (
                          <Ionicons
                            name='person'
                            size={16}
                            color={theme.colors.onPrimaryContainer}
                            style={styles.userIndicator}
                          />
                        )}
                      </>
                    )}
                  </DataTable.Cell>

                  {/* Win-Loss Record */}
                  <DataTable.Cell
                    numeric
                    style={styles.recordColumn}
                    textStyle={[
                      styles.cellText,
                      { color: theme.colors.onSurface },
                      isUserRow && { color: theme.colors.onPrimaryContainer },
                    ]}
                  >
                    {formatWinLoss(ranking.wins, ranking.losses)}
                  </DataTable.Cell>

                  {/* Set Difference */}
                  <DataTable.Cell
                    numeric
                    style={styles.setsColumn}
                    textStyle={[
                      styles.cellText,
                      {
                        color:
                          ranking.setDifference >= 0 ? theme.colors.primary : theme.colors.error,
                      },
                      isUserRow &&
                        ranking.setDifference >= 0 && {
                          color: theme.colors.onPrimaryContainer,
                        },
                    ]}
                  >
                    {formatDifference(ranking.setDifference)}
                  </DataTable.Cell>

                  {/* Game Difference */}
                  <DataTable.Cell
                    numeric
                    style={styles.gamesColumn}
                    textStyle={[
                      styles.cellText,
                      {
                        color:
                          ranking.gameDifference >= 0 ? theme.colors.primary : theme.colors.error,
                      },
                      isUserRow &&
                        ranking.gameDifference >= 0 && {
                          color: theme.colors.onPrimaryContainer,
                        },
                    ]}
                  >
                    {formatDifference(ranking.gameDifference)}
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>

          {/* 🏆 Legend for ranking criteria */}
          <View style={styles.legend}>
            <Text style={[styles.legendTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('tournamentRankings.rankingCriteria')}
            </Text>
            <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
              {t('tournamentRankings.criteriaDescription')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>['paperTheme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      minHeight: 300,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    statsCard: {
      marginBottom: 16,
      elevation: 2,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
    },
    statLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    rankingsCard: {
      elevation: 2,
    },
    cardContent: {
      paddingVertical: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    headerIcon: {
      marginRight: 8,
    },
    tableTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    dataTable: {
      backgroundColor: 'transparent',
    },
    tableHeaderRow: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    headerText: {
      fontSize: 14,
      fontWeight: '600',
    },
    tableRow: {
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outlineVariant,
      minHeight: 56,
    },
    topThreeRow: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    rankColumn: {
      flex: 0,
      width: 52,
      justifyContent: 'center',
      paddingLeft: 0,
    },
    rankContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rankNumber: {
      fontSize: 14,
      fontWeight: '700',
    },
    playerColumn: {
      flex: 3,
      justifyContent: 'center',
    },
    doubleNamesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    playerNamePart: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    playerNameDivider: {
      fontSize: 14,
      marginHorizontal: 2,
    },
    recordColumn: {
      flex: 1.2,
      justifyContent: 'center',
    },
    setsColumn: {
      flex: 1,
      justifyContent: 'center',
    },
    gamesColumn: {
      flex: 1,
      justifyContent: 'center',
    },
    playerName: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    userIndicator: {
      marginLeft: 8,
    },
    cellText: {
      fontSize: 14,
      fontWeight: '500',
    },
    legend: {
      marginTop: 16,
      paddingHorizontal: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    legendTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    legendText: {
      fontSize: 11,
      lineHeight: 16,
    },
  });

export default TournamentRankingsTab;
