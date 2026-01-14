/**
 * 🏆 [THOR] Rankings Card Component
 *
 * Universal rankings display supporting 3 types:
 * 1. Global rankings (monthly, season, all-time)
 * 2. Club league rankings (per club ELO rankings)
 * 3. Club tournament rankings (tournament stats per club)
 *
 * Uses discriminated union for type-safe rendering
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { convertEloToLtr } from '../../constants/ltr';

// ==================== TYPE DEFINITIONS ====================

// 🎯 [KIM v2] Added elo field for LTR display
interface RankingPeriodData {
  currentRank: number | null;
  totalPlayers: number;
  elo?: number;
}

interface GlobalRankingData {
  monthly: RankingPeriodData;
  season: RankingPeriodData;
  alltime: RankingPeriodData;
}

// 🎯 [KIM v3] Club League Period Data for 3-card layout
interface ClubLeaguePeriodData {
  currentRank: number | null;
  totalPlayers: number;
  elo: number;
}

interface ClubRankingData {
  clubId: string;
  clubName: string;
  clubEloRating: number;
  currentRank: number;
  totalPlayers: number;
  isPrivate: boolean;
  // 🎯 [KIM v3] Optional period-specific data for 3-card layout
  quarterly?: ClubLeaguePeriodData;
  yearly?: ClubLeaguePeriodData;
  alltime?: ClubLeaguePeriodData;
}

interface ClubTournamentRankingData {
  clubId: string;
  clubName: string;
  currentRank: number;
  totalPlayers: number;
  isPrivate: boolean;
  tournamentStats: {
    matchWins?: number;
    wins?: number; // Legacy field
    runnerUps: number;
    semiFinals: number;
    totalMatches?: number;
    participations?: number; // Legacy field
    bestFinish: number | null;
  };
}

type RankingsCardProps =
  | {
      type: 'global';
      data: GlobalRankingData;
      // 🆕 [KIM] Gender for "전체(남자)" or "전체(여자)" label
      gender?: 'male' | 'female';
    }
  | {
      type: 'club-league';
      data: ClubRankingData[];
      // 🎯 [KIM v3] Gender for filtering rankings (분기/금년/전체 all filtered by gender)
      gender?: 'male' | 'female';
    }
  | {
      type: 'club-tournament';
      data: ClubTournamentRankingData[];
    };

// ==================== HELPER FUNCTIONS ====================

/**
 * 📊 [KIM] Get current quarter name
 * Matches the quarter logic in rankingService.ts:
 * - Q1 (Jan-Mar): 1분기
 * - Q2 (Apr-Jun): 2분기
 * - Q3 (Jul-Sep): 3분기
 * - Q4 (Oct-Dec): 4분기
 */
const getCurrentQuarter = (): number => {
  return Math.floor(new Date().getMonth() / 3) + 1; // 1-4
};

// ==================== COMPONENT ====================

const RankingsCard: React.FC<RankingsCardProps> = props => {
  // 🎨 [DARK GLASS] Theme setup
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors, currentTheme);
  const { t } = useLanguage();

  // ==================== GLOBAL RANKINGS ====================

  if (props.type === 'global') {
    const { data, gender } = props;
    const currentQuarter = getCurrentQuarter();

    // 🆕 [KIM] Gender-specific "전체" label: "전체(남자)" or "전체(여자)"
    const getAlltimeLabel = () => {
      if (gender === 'male') {
        return t('rankingsCard.alltimeRankMale');
      } else if (gender === 'female') {
        return t('rankingsCard.alltimeRankFemale');
      }
      return t('rankingsCard.alltimeRank');
    };

    // 🎯 [KIM v2] Helper to render a single ranking card with ELO & LTR
    const renderRankingCard = (periodData: RankingPeriodData, label: string, key: string) => {
      const rank = periodData.currentRank;
      const total = periodData.totalPlayers;
      const elo = periodData.elo || 1200;
      const ltr = convertEloToLtr(elo);

      return (
        <View key={key} style={styles.globalCard}>
          {/* Label at top */}
          <PaperText variant='bodySmall' style={styles.globalLabel}>
            {label}
          </PaperText>

          {/* Rank: #47/48 */}
          <View style={styles.rankRow}>
            <PaperText variant='headlineMedium' style={styles.rankNumber}>
              #{rank || '-'}
            </PaperText>
            <PaperText variant='bodyMedium' style={styles.rankTotal}>
              /{total > 0 ? total : '-'}
            </PaperText>
          </View>

          {/* LTR */}
          <PaperText variant='bodySmall' style={styles.ltrText}>
            LTR {ltr}
          </PaperText>

          {/* ELO */}
          <PaperText variant='bodySmall' style={styles.eloText}>
            ELO {elo}
          </PaperText>
        </View>
      );
    };

    return (
      <View>
        <View style={styles.globalGrid}>
          {renderRankingCard(data.monthly, t('rankingsCard.monthlyRank'), 'monthly')}
          {renderRankingCard(
            data.season,
            t('rankingsCard.seasonRank', { quarter: currentQuarter }),
            'season'
          )}
          {renderRankingCard(data.alltime, getAlltimeLabel(), 'alltime')}
        </View>
      </View>
    );
  }

  // ==================== CLUB LEAGUE RANKINGS ====================

  if (props.type === 'club-league') {
    const { data, gender } = props;
    const currentQuarter = getCurrentQuarter();

    // 🎯 [KIM v3] Gender-specific "전체" label for club league
    const getClubAlltimeLabel = () => {
      if (gender === 'male') {
        return t('rankingsCard.alltimeRankMale');
      } else if (gender === 'female') {
        return t('rankingsCard.alltimeRankFemale');
      }
      return t('rankingsCard.alltimeRank');
    };

    // 🎯 [KIM v3] Helper to render a single club league ranking card
    const renderClubLeagueCard = (
      periodData: ClubLeaguePeriodData | undefined,
      fallbackElo: number,
      fallbackRank: number,
      fallbackTotal: number,
      label: string,
      key: string
    ) => {
      const elo = periodData?.elo ?? fallbackElo;
      const rank = periodData?.currentRank ?? fallbackRank;
      const total = periodData?.totalPlayers ?? fallbackTotal;
      const ltr = convertEloToLtr(elo);
      const hasValidRank = rank !== null && rank > 0;

      return (
        <View key={key} style={styles.globalCard}>
          {/* Label at top */}
          <PaperText variant='bodySmall' style={styles.globalLabel}>
            {label}
          </PaperText>

          {/* Rank: #3/12 */}
          <View style={styles.rankRow}>
            <PaperText variant='headlineMedium' style={styles.rankNumber}>
              {hasValidRank ? `#${rank}` : '-'}
            </PaperText>
            <PaperText variant='bodyMedium' style={styles.rankTotal}>
              /{total > 0 ? total : '-'}
            </PaperText>
          </View>

          {/* LTR */}
          <PaperText variant='bodySmall' style={styles.ltrText}>
            LTR {ltr}
          </PaperText>

          {/* ELO */}
          <PaperText variant='bodySmall' style={styles.eloText}>
            ELO {elo}
          </PaperText>
        </View>
      );
    };

    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <PaperText
            variant='bodyMedium'
            style={{ textAlign: 'center', color: themeColors.colors.onSurfaceVariant }}
          >
            {t('rankingsCard.noClubMemberships')}
          </PaperText>
        </View>
      );
    }

    return (
      <View style={styles.clubList}>
        {data.map(club => {
          return (
            <View key={club.clubId} style={styles.clubCard}>
              {/* Club Name Header */}
              <View style={styles.clubHeader}>
                <PaperText variant='titleSmall' style={styles.clubName}>
                  {club.clubName}
                </PaperText>
                {club.isPrivate && (
                  <PaperText variant='bodySmall' style={{ color: themeColors.colors.secondary }}>
                    🔒 {t('rankingsCard.private')}
                  </PaperText>
                )}
              </View>

              {!club.isPrivate && (
                <View style={styles.globalGrid}>
                  {renderClubLeagueCard(
                    club.quarterly,
                    club.clubEloRating,
                    club.currentRank,
                    club.totalPlayers,
                    t('rankingsCard.quarterlyRank', { quarter: currentQuarter }),
                    'quarterly'
                  )}
                  {renderClubLeagueCard(
                    club.yearly,
                    club.clubEloRating,
                    club.currentRank,
                    club.totalPlayers,
                    t('rankingsCard.yearlyRank'),
                    'yearly'
                  )}
                  {renderClubLeagueCard(
                    club.alltime,
                    club.clubEloRating,
                    club.currentRank,
                    club.totalPlayers,
                    getClubAlltimeLabel(),
                    'alltime'
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  // ==================== CLUB TOURNAMENT RANKINGS ====================

  if (props.type === 'club-tournament') {
    const { data } = props;

    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <PaperText
            variant='bodyMedium'
            style={{ textAlign: 'center', color: themeColors.colors.onSurfaceVariant }}
          >
            {t('rankingsCard.noTournamentParticipation')}
          </PaperText>
        </View>
      );
    }

    return (
      <View style={styles.clubList}>
        {data.map(club => (
          <View key={club.clubId} style={styles.clubCard}>
            <View style={styles.clubHeader}>
              <PaperText variant='titleSmall' style={styles.clubName}>
                {club.clubName}
              </PaperText>
              {club.isPrivate && (
                <PaperText variant='bodySmall' style={{ color: themeColors.colors.secondary }}>
                  🔒 {t('rankingsCard.private')}
                </PaperText>
              )}
            </View>

            {!club.isPrivate && (
              <>
                {/* Rank Display */}
                <View style={styles.tournamentRankSection}>
                  <PaperText
                    variant='headlineLarge'
                    style={{ color: themeColors.colors.primary, fontWeight: '700' }}
                  >
                    #{club.currentRank}
                  </PaperText>
                  <PaperText
                    variant='bodySmall'
                    style={{ color: themeColors.colors.onSurfaceVariant }}
                  >
                    / {club.totalPlayers} {t('rankingsCard.players')}
                  </PaperText>
                </View>

                {/* 🎨 [KIM FIX] Detailed Tournament Stats - Card style with larger text */}
                <View style={styles.tournamentGrid}>
                  <View style={styles.tournamentStatCard}>
                    <PaperText variant='labelLarge' style={styles.tournamentLabel}>
                      🏆 {t('rankingsCard.matchWins')}
                    </PaperText>
                    <PaperText variant='headlineMedium' style={styles.tournamentValue}>
                      {club.tournamentStats.matchWins || club.tournamentStats.wins || 0}
                    </PaperText>
                  </View>

                  <View style={styles.tournamentStatCard}>
                    <PaperText variant='labelLarge' style={styles.tournamentLabel}>
                      🥈 {t('rankingsCard.runnerUp')}
                    </PaperText>
                    <PaperText variant='headlineMedium' style={styles.tournamentValue}>
                      {club.tournamentStats.runnerUps || 0}
                    </PaperText>
                  </View>

                  <View style={styles.tournamentStatCard}>
                    <PaperText variant='labelLarge' style={styles.tournamentLabel}>
                      🥉 {t('rankingsCard.semiFinal')}
                    </PaperText>
                    <PaperText variant='headlineMedium' style={styles.tournamentValue}>
                      {club.tournamentStats.semiFinals || 0}
                    </PaperText>
                  </View>

                  <View style={styles.tournamentStatCard}>
                    <PaperText variant='labelLarge' style={styles.tournamentLabel}>
                      📊 {t('rankingsCard.totalMatches')}
                    </PaperText>
                    <PaperText variant='headlineMedium' style={styles.tournamentValue}>
                      {club.tournamentStats.totalMatches ||
                        club.tournamentStats.participations ||
                        0}
                    </PaperText>
                  </View>

                  <View style={styles.tournamentStatCardWide}>
                    <PaperText variant='labelLarge' style={styles.tournamentLabel}>
                      ⭐ {t('rankingsCard.bestFinish')}
                    </PaperText>
                    <PaperText variant='headlineMedium' style={styles.tournamentValueHighlight}>
                      {club.tournamentStats.bestFinish || t('rankingsCard.notAvailable')}
                    </PaperText>
                  </View>
                </View>
              </>
            )}
          </View>
        ))}
      </View>
    );
  }

  return null;
};

// ==================== STYLES ====================

// 🎨 [DARK GLASS] Dynamic styles with theme support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: Record<string, any>, theme: 'light' | 'dark') =>
  StyleSheet.create({
    // Global Rankings - 🎨 [DARK GLASS] Each rank as individual card
    globalGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      gap: 8,
    },
    globalCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 8,
      // Subtle shadow for card effect
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    rankNumber: {
      color: colors.primary,
      fontWeight: '700',
    },
    globalLabel: {
      marginBottom: 8,
      // 🎨 [DARK GLASS] Better visibility in dark mode
      color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : colors.onSurfaceVariant,
      fontWeight: '500',
      // 🎯 [KIM FIX] Center align for all languages (fixes Russian text alignment)
      textAlign: 'center',
    },
    // 🎯 [KIM v2] New styles for enhanced ranking display
    rankRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    rankTotal: {
      color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant,
      fontWeight: '500',
    },
    ltrText: {
      marginTop: 8,
      color: theme === 'dark' ? '#4FC3F7' : colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    eloText: {
      marginTop: 4,
      color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : colors.onSurfaceVariant,
      fontSize: 11,
      textAlign: 'center',
    },
    globalSubLabel: {
      marginTop: 2,
      // 🎨 [DARK GLASS] Better visibility in dark mode
      color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant,
      // 🎯 [KIM FIX] Center align for all languages
      textAlign: 'center',
    },

    // Club List (League & Tournament)
    clubList: {
      gap: 12,
    },
    clubCard: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    clubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    clubName: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    clubTotalPlayers: {
      fontWeight: '600',
      color: colors.onSurface,
    },

    // 🎯 [KIM FIX] Club League - New Layout with Prominent ELO
    clubLeagueContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
    },
    clubEloSection: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    clubEloLabel: {
      color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant,
      marginBottom: 4,
    },
    clubEloValue: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 36,
      lineHeight: 44,
    },
    clubLtrBadge: {
      marginTop: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? 'rgba(79, 195, 247, 0.2)' : 'rgba(33, 150, 243, 0.15)',
    },
    clubLtrText: {
      color: theme === 'dark' ? '#4FC3F7' : colors.primary,
      fontWeight: '600',
    },
    clubRankSection: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    clubRankRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    clubRankValue: {
      fontWeight: '700',
    },
    clubRankTotal: {
      color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant,
      fontWeight: '500',
    },
    clubRankLabel: {
      color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant,
      marginTop: 4,
    },

    // Legacy Club League Stats (kept for compatibility)
    clubStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 8,
    },
    clubStat: {
      alignItems: 'center',
    },

    // Tournament Rankings
    tournamentRankSection: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    tournamentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    // 🎨 [KIM FIX] Card style for tournament stats - improved visibility
    tournamentStatCard: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    },
    tournamentStatCardWide: {
      flex: 2,
      minWidth: '95%',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    },
    tournamentItem: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      paddingVertical: 8,
    },
    tournamentLabel: {
      color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant,
      marginBottom: 8,
      fontSize: 14,
    },
    tournamentValue: {
      fontWeight: '700',
      color: colors.onSurface,
      fontSize: 28,
    },
    tournamentValueHighlight: {
      fontWeight: '700',
      color: colors.primary,
      fontSize: 28,
    },

    // Empty State
    emptyState: {
      paddingVertical: 40,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
  });

export default RankingsCard;
export type { GlobalRankingData, ClubRankingData, ClubTournamentRankingData, ClubLeaguePeriodData };
