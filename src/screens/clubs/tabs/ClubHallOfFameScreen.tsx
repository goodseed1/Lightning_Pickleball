/**
 * 🏆 Club Hall of Fame Screen
 *
 * Displays club-wide trophies and ELO rankings in separate tabs:
 * - Trophies tab: All club members' trophies (newest first)
 * - Rankings tab: Unified ELO rankings for all members
 *
 * @author Iron Man (UI) + Thor (Data)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Text as PaperText,
  useTheme as usePaperTheme,
  Avatar,
  SegmentedButtons,
} from 'react-native-paper';
import { Timestamp } from 'firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../../../hooks/useTheme';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getLightningPickleballTheme } from '../../../theme';
import clubService from '../../../services/clubService';

// ==================== TYPE DEFINITIONS ====================

interface ClubHallOfFameScreenProps {
  clubId: string;
  userRole: 'admin' | 'manager' | 'member' | null;
}

interface TrophyWithOwner {
  trophy: {
    id: string;
    type: string;
    rank?: string;
    tournamentName?: string;
    clubName?: string;
    awardedAt?: Timestamp | string;
  };
  userId: string;
  userName: string;
}

interface MemberRanking {
  userId: string;
  userName: string;
  photoURL: string | null;
  eloRating: number;
  rank: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

type TabValue = 'trophies' | 'rankings';

// ==================== COMPONENT ====================

const ClubHallOfFameScreen: React.FC<ClubHallOfFameScreenProps> = ({ clubId }) => {
  // Theme setup
  const { theme: currentTheme } = useTheme();
  const { t, language } = useLanguage();
  const paperTheme = usePaperTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);

  // State
  const [activeTab, setActiveTab] = useState<TabValue>('trophies');
  const [trophies, setTrophies] = useState<TrophyWithOwner[]>([]);
  const [rankings, setRankings] = useState<MemberRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      console.log('🏆 [ClubHallOfFame] Loading data for club:', clubId);

      // Fetch both trophies and rankings in parallel
      const [trophiesData, rankingsData] = await Promise.all([
        clubService.getClubTrophies(clubId),
        clubService.getClubEloRankings(clubId),
      ]);

      setTrophies(trophiesData);
      setRankings(rankingsData);

      console.log(
        `🏆 [ClubHallOfFame] Loaded ${trophiesData.length} trophies, ${rankingsData.length} rankings`
      );
    } catch (error) {
      console.error('❌ [ClubHallOfFame] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // 🏆 Extract tournament ID from trophy ID
  // Trophy ID format: {tournamentId}_{userId}_{trophyType}
  const extractTournamentId = (trophyId: string): string => {
    // Split by underscore and take the first part (tournament ID)
    const parts = trophyId.split('_');
    // Tournament ID might contain underscores, so we need to exclude userId and trophyType
    // Format: tournamentId_userId_tournament_winner OR tournamentId_userId_tournament_runnerup
    if (parts.length >= 4) {
      // Last two parts are trophyType (e.g., "tournament_winner")
      // Second to last before that is userId
      // Everything before that is tournamentId
      return parts.slice(0, -3).join('_') || parts[0];
    }
    return parts[0] || trophyId;
  };

  // 🏆 Group trophies by tournament ID (Winner + Runner-up in same card)
  // Supports both singles (1 person) and doubles (2 people = team)
  const groupedTrophies = useMemo(() => {
    const groups: Record<
      string,
      {
        tournamentId: string;
        tournamentName: string;
        awardedAt?: (typeof trophies)[0]['trophy']['awardedAt'];
        winners: TrophyWithOwner[]; // Array for doubles support
        runnersUp: TrophyWithOwner[]; // Array for doubles support
      }
    > = {};

    trophies.forEach(item => {
      // Use tournament ID extracted from trophy ID for grouping
      const tournamentId = extractTournamentId(item.trophy.id);
      const key = tournamentId;

      if (!groups[key]) {
        groups[key] = {
          tournamentId,
          tournamentName: item.trophy.tournamentName || t('common.unknownTournament'),
          awardedAt: item.trophy.awardedAt,
          winners: [],
          runnersUp: [],
        };
      }

      // Determine if this is winner or runner-up
      const isWinner =
        item.trophy.rank === 'Winner' ||
        item.trophy.type === 'tournament_winner' ||
        item.trophy.type === 'league_winner';

      if (isWinner) {
        groups[key].winners.push(item);
      } else {
        groups[key].runnersUp.push(item);
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.values(groups).sort((a, b) => {
      const dateA = a.awardedAt
        ? typeof a.awardedAt === 'string'
          ? new Date(a.awardedAt).getTime()
          : (a.awardedAt as Timestamp).toDate?.()?.getTime() || 0
        : 0;
      const dateB = b.awardedAt
        ? typeof b.awardedAt === 'string'
          ? new Date(b.awardedAt).getTime()
          : (b.awardedAt as Timestamp).toDate?.()?.getTime() || 0
        : 0;
      return dateB - dateA; // Newest first
    });
  }, [trophies]);

  // Check if tournament is doubles (복식) based on name
  const isDoubles = (tournamentName: string): boolean => {
    const lowerName = tournamentName.toLowerCase();
    return (
      lowerName.includes('복식') || lowerName.includes('doubles') || lowerName.includes('double')
    );
  };

  // Check if it's a tournament (토너먼트) vs league (리그)
  const isTournament = (tournamentName: string): boolean => {
    const lowerName = tournamentName.toLowerCase();
    return lowerName.includes('토너먼트') || lowerName.includes('tournament');
  };

  // 🏆 Get trophy icon configuration based on game type
  // - 리그 단식: MaterialCommunityIcons trophy
  // - 리그 복식: MaterialCommunityIcons trophy-variant
  // - 토너먼트 단식: MaterialCommunityIcons trophy-award
  // - 토너먼트 복식: FontAwesome5 trophy
  const getTrophyIcon = (
    tournamentName: string
  ): { library: 'mci' | 'fa5'; name: string; color: string } => {
    const doubles = isDoubles(tournamentName);
    const tournament = isTournament(tournamentName);

    if (tournament) {
      if (doubles) {
        // 토너먼트 복식: FontAwesome5 trophy
        return { library: 'fa5', name: 'trophy', color: '#FFD700' };
      }
      // 토너먼트 단식: trophy-award (MCIcons)
      return { library: 'mci', name: 'trophy-award', color: '#FFD700' };
    } else {
      if (doubles) {
        // 리그 복식: trophy-variant (MCIcons)
        return { library: 'mci', name: 'trophy-variant', color: '#FFD700' };
      }
      // 리그 단식: trophy (MCIcons)
      return { library: 'mci', name: 'trophy', color: '#FFD700' };
    }
  };

  // Helper to format team names
  // Singles (단식): Show only 1 person
  // Doubles (복식): Show max 2 people as team "Jong & 철수"
  const formatTeamName = (members: TrophyWithOwner[], tournamentName: string): string => {
    if (members.length === 0) return '';
    if (members.length === 1) return members[0].userName;

    // For doubles: show max 2 people (one team)
    if (isDoubles(tournamentName)) {
      // Limit to 2 people for doubles team
      const team = members.slice(0, 2);
      return team.map(m => m.userName).join(' & ');
    }

    // For singles, show only 1 person
    return members[0].userName;
  };

  // Language to locale mapping for date formatting
  const getLocale = (lang: string): string => {
    const localeMap: Record<string, string> = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      it: 'it-IT',
      pt: 'pt-BR',
      ru: 'ru-RU',
    };
    return localeMap[lang] || 'en-US';
  };

  // Format date helper
  const formatDate = (timestamp: Timestamp | string | undefined): string => {
    if (!timestamp) return '';
    const date =
      typeof timestamp === 'string'
        ? new Date(timestamp)
        : (timestamp as Timestamp).toDate?.()
          ? (timestamp as Timestamp).toDate()
          : new Date();
    return date.toLocaleDateString(getLocale(language), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Rank badge color
  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { backgroundColor: '#FFD700', color: '#000' }; // Gold
      case 2:
        return { backgroundColor: '#C0C0C0', color: '#000' }; // Silver
      case 3:
        return { backgroundColor: '#CD7F32', color: '#FFF' }; // Bronze
      default:
        return {
          backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          color: themeColors.colors.onSurface,
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: paperTheme.colors.background }]}>
        <ActivityIndicator size='large' color={themeColors.colors.primary} />
        <PaperText
          variant='bodyMedium'
          style={{ marginTop: 12, color: themeColors.colors.onSurface }}
        >
          {t('clubHallOfFame.loading')}
        </PaperText>
      </View>
    );
  }

  // Render Trophies Tab Content - Grouped by tournament (Winner + Runner-up)
  const renderTrophiesContent = () => (
    <>
      {groupedTrophies.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name='trophy-outline'
            size={48}
            color={themeColors.colors.onSurfaceVariant}
          />
          <PaperText
            variant='bodyMedium'
            style={{
              textAlign: 'center',
              color: themeColors.colors.onSurfaceVariant,
              marginTop: 12,
            }}
          >
            {t('clubHallOfFame.emptyTrophies')}
          </PaperText>
        </View>
      ) : (
        groupedTrophies.map((group, index) => (
          <View
            key={`trophy-group-${index}`}
            style={[
              styles.trophyCard,
              {
                backgroundColor:
                  currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                borderColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            {/* Trophy Icon - Different icon based on game type */}
            <View style={styles.trophyIconContainer}>
              {(() => {
                const iconConfig = getTrophyIcon(group.tournamentName);
                if (iconConfig.library === 'fa5') {
                  return (
                    <FontAwesome5 name={iconConfig.name} size={32} color={iconConfig.color} solid />
                  );
                }
                return (
                  <MaterialCommunityIcons
                    name={iconConfig.name}
                    size={36}
                    color={iconConfig.color}
                  />
                );
              })()}
            </View>

            {/* Tournament Info with Winner & Runner-up */}
            <View style={styles.trophyInfo}>
              <PaperText
                variant='titleMedium'
                style={{ fontWeight: 'bold', color: themeColors.colors.onSurface }}
              >
                {group.tournamentName}
              </PaperText>

              {/* Winners Row (supports singles & doubles) */}
              {group.winners.length > 0 && (
                <View style={styles.awardRow}>
                  <PaperText style={[styles.awardEmoji, { fontSize: 14 }]}>🥇</PaperText>
                  <PaperText variant='bodySmall' style={{ color: '#FFD700', fontWeight: '600' }}>
                    {t('clubScreen.winner')} - {formatTeamName(group.winners, group.tournamentName)}
                  </PaperText>
                </View>
              )}

              {/* Runners-up Row (supports singles & doubles) */}
              {group.runnersUp.length > 0 && (
                <View style={styles.awardRow}>
                  <PaperText style={[styles.awardEmoji, { fontSize: 14 }]}>🥈</PaperText>
                  <PaperText variant='bodySmall' style={{ color: '#C0C0C0', fontWeight: '600' }}>
                    {t('clubScreen.runnerUp')} -{' '}
                    {formatTeamName(group.runnersUp, group.tournamentName)}
                  </PaperText>
                </View>
              )}

              {/* Date */}
              <PaperText
                variant='bodySmall'
                style={{ color: themeColors.colors.onSurfaceVariant, marginTop: 6 }}
              >
                {formatDate(group.awardedAt)}
              </PaperText>
            </View>
          </View>
        ))
      )}
    </>
  );

  // Render Rankings Tab Content
  const renderRankingsContent = () => (
    <>
      {rankings.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name='account-group-outline'
            size={48}
            color={themeColors.colors.onSurfaceVariant}
          />
          <PaperText
            variant='bodyMedium'
            style={{
              textAlign: 'center',
              color: themeColors.colors.onSurfaceVariant,
              marginTop: 12,
            }}
          >
            {t('clubHallOfFame.emptyRankings')}
          </PaperText>
        </View>
      ) : (
        rankings.map(member => {
          const badgeStyle = getRankBadgeStyle(member.rank);

          return (
            <View
              key={member.userId}
              style={[
                styles.rankingCard,
                {
                  backgroundColor:
                    currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor:
                    currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              {/* Rank Badge */}
              <View style={[styles.rankBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <PaperText
                  variant='titleMedium'
                  style={{ fontWeight: 'bold', color: badgeStyle.color }}
                >
                  #{member.rank}
                </PaperText>
              </View>

              {/* Avatar */}
              {member.photoURL ? (
                <Image source={{ uri: member.photoURL }} style={styles.avatar} />
              ) : (
                <Avatar.Text size={40} label={member.userName.charAt(0)} style={styles.avatar} />
              )}

              {/* Member Info */}
              <View style={styles.memberInfo}>
                <PaperText
                  variant='titleMedium'
                  style={{ fontWeight: '600', color: themeColors.colors.onSurface }}
                >
                  {member.userName}
                </PaperText>
                <PaperText
                  variant='bodySmall'
                  style={{ color: themeColors.colors.onSurfaceVariant }}
                >
                  {t('common.winsLosses', { wins: member.wins, losses: member.losses })}
                </PaperText>
              </View>

              {/* ELO Score */}
              <View style={styles.eloContainer}>
                <PaperText
                  variant='headlineSmall'
                  style={{ fontWeight: 'bold', color: themeColors.colors.primary }}
                >
                  {member.eloRating}
                </PaperText>
                <PaperText
                  variant='bodySmall'
                  style={{ color: themeColors.colors.onSurfaceVariant }}
                >
                  ELO
                </PaperText>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* 🎯 Tab Selector */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={value => setActiveTab(value as TabValue)}
          buttons={[
            {
              value: 'trophies',
              label: t('clubHallOfFame.tabs.trophies'),
              icon: 'trophy',
            },
            {
              value: 'rankings',
              label: t('clubHallOfFame.tabs.rankings'),
              icon: 'chart-line',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.colors.primary}
          />
        }
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'trophies' ? renderTrophiesContent() : renderRankingsContent()}
      </ScrollView>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    // SegmentedButtons style
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  // Trophy Card
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  trophyIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trophyInfo: {
    flex: 1,
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  awardEmoji: {
    marginRight: 6,
  },
  // Ranking Card
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  eloContainer: {
    alignItems: 'flex-end',
  },
});

export default ClubHallOfFameScreen;
