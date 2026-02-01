import React, { useMemo } from 'react';
import { View, ActivityIndicator, ScrollView } from 'react-native';
import {
  Card,
  Text as PaperText,
  SegmentedButtons,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { MainScope, ClubFilter } from '../../types/stats';
import { useLanguage, SupportedLanguage as Language } from '../../contexts/LanguageContext';
import MatchSummaryCard from '../stats/MatchSummaryCard';
import StatsChartsSection from '../stats/StatsChartsSection';
import ClubFilterSelector from '../stats/ClubFilterSelector';
import ClubSelector, { ClubOption } from '../stats/ClubSelector';
import MatchTypeSelector, { MatchTypeValue } from '../stats/MatchTypeSelector';
import RankingsCard from '../stats/RankingsCard';
import EloTrendCard from '../stats/EloTrendCard';
import { useUnifiedMatchStats } from '../../hooks/useUnifiedMatchStats';

interface UserProfile {
  uid: string;
  eloRatings?: {
    singles?: { current?: number };
    doubles?: { current?: number };
    mixed?: { current?: number };
  };
  stats?: unknown;
}

interface StatsTabContentProps {
  userId: string;
  userProfile: UserProfile;
  currentLanguage: Language;
  // 🆕 [KIM] User gender for gender-specific rankings
  userGender?: 'male' | 'female';
}

const StatsTabContent: React.FC<StatsTabContentProps> = ({
  userId,
  userProfile,
  currentLanguage,
  userGender,
}) => {
  const paperTheme = usePaperTheme();
  const { t } = useLanguage();

  // 🔍 [KIM DEBUG] Log userProfile data to verify eloRatings availability
  React.useEffect(() => {
    console.log('🎾 [StatsTabContent] MOUNT DEBUG:', {
      userId,
      hasEloRatings: !!userProfile?.eloRatings,
      eloRatings: userProfile?.eloRatings,
      singlesElo: userProfile?.eloRatings?.singles?.current,
      doublesElo: userProfile?.eloRatings?.doubles?.current,
      mixedElo: userProfile?.eloRatings?.mixed?.current,
      hasStats: !!userProfile?.stats,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      publicStats: (userProfile?.stats as any)?.publicStats,
    });
  }, [userId, userProfile]);

  // 🆕 [THOR] New unified stats architecture
  const [mainScope, setMainScope] = React.useState<MainScope>('public');
  // 🆕 [KIM] Changed default from 'all' to 'league' (removed 'all' option)
  const [clubFilter, setClubFilter] = React.useState<ClubFilter>('league');
  const [matchTypeFilter, setMatchTypeFilter] = React.useState<MatchTypeValue>('all');
  // 🆕 [IRON MAN] Club selector for multi-club users
  const [selectedClubId, setSelectedClubId] = React.useState<string | null>(null);

  // 🆕 [THOR] Unified stats hook replaces scattered state management
  // 🆕 [KIM] Pass userGender for gender-specific rankings
  const {
    data: unifiedStats,
    loading: statsLoading,
    // error: statsError, // TODO: Handle errors in Day 4
    // refresh: refreshStats, // TODO: Implement refresh in Day 4
  } = useUnifiedMatchStats({ userId: userId || '', gender: userGender });

  // 🆕 [IRON MAN] Extract unique clubs from club breakdowns (league + tournament)
  const availableClubs = useMemo((): ClubOption[] => {
    if (!unifiedStats?.clubBreakdowns) return [];

    const clubMap = new Map<string, string>();

    // Collect from league breakdowns
    unifiedStats.clubBreakdowns.league?.forEach(club => {
      if (club.clubId && club.clubName) {
        clubMap.set(club.clubId, club.clubName);
      }
    });

    // Collect from tournament breakdowns
    unifiedStats.clubBreakdowns.tournament?.forEach(club => {
      if (club.clubId && club.clubName) {
        clubMap.set(club.clubId, club.clubName);
      }
    });

    return Array.from(clubMap.entries()).map(([clubId, clubName]) => ({
      clubId,
      clubName,
    }));
  }, [unifiedStats?.clubBreakdowns]);

  // 🆕 [IRON MAN] Auto-select first club when clubs are loaded and none selected
  React.useEffect(() => {
    if (availableClubs.length > 0 && selectedClubId === null) {
      setSelectedClubId(availableClubs[0].clubId);
    }
  }, [availableClubs, selectedClubId]);

  // 🆕 [THOR] Determine which stats to display based on mainScope and clubFilter
  let displayStats;
  // 🔄 [IRON MAN] Always show chart - EloChart for league, TournamentWinRateChart for tournament
  const showEloChart = mainScope === 'club';

  if (!unifiedStats) {
    displayStats = { totalMatches: 0, wins: 0, losses: 0, winRate: 0 };
  } else if (mainScope === 'public') {
    // 🆕 Public stats with match type filter
    const ps = unifiedStats.publicStats as unknown as {
      singles?: { matchesPlayed: number; wins: number; losses: number };
      doubles?: { matchesPlayed: number; wins: number; losses: number };
      mixed_doubles?: { matchesPlayed: number; wins: number; losses: number };
    };

    if (matchTypeFilter === 'all') {
      // 전체 합산
      const totalMatches =
        (ps?.singles?.matchesPlayed || 0) +
        (ps?.doubles?.matchesPlayed || 0) +
        (ps?.mixed_doubles?.matchesPlayed || 0);
      const wins =
        (ps?.singles?.wins || 0) + (ps?.doubles?.wins || 0) + (ps?.mixed_doubles?.wins || 0);
      const losses =
        (ps?.singles?.losses || 0) + (ps?.doubles?.losses || 0) + (ps?.mixed_doubles?.losses || 0);
      // 🎯 [KIM FIX] Calculate winRate - wins divided by total matches
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      displayStats = { totalMatches, wins, losses, winRate };
    } else {
      // 선택된 matchType만
      const typeStats = ps?.[matchTypeFilter];
      const totalMatches = typeStats?.matchesPlayed || 0;
      const wins = typeStats?.wins || 0;
      const losses = typeStats?.losses || 0;
      // 🎯 [KIM FIX] Calculate winRate
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      displayStats = { totalMatches, wins, losses, winRate };
    }
    // EloChart will show Global ELO when scope='public'
  } else {
    // mainScope === 'club'
    // 🎯 [KIM FIX] Filter stats by selectedClubId - show only selected club's match stats
    // 🆕 [KIM] Removed 'all' case - now only 'league' or 'tournament'
    if (clubFilter === 'league') {
      if (selectedClubId) {
        const club = unifiedStats.clubBreakdowns.league?.find(c => c.clubId === selectedClubId);
        displayStats = club?.stats || { totalMatches: 0, wins: 0, losses: 0, winRate: 0 };
      } else {
        displayStats = unifiedStats.clubStats.league;
      }
    } else {
      // tournament
      if (selectedClubId) {
        const club = unifiedStats.clubBreakdowns.tournament?.find(c => c.clubId === selectedClubId);
        const ts = club?.tournamentStats;
        displayStats = {
          totalMatches: ts?.totalMatches || 0,
          wins: ts?.matchWins || 0,
          losses: ts?.matchLosses || 0,
          winRate: ts?.winRate || 0,
        };
      } else {
        displayStats = unifiedStats.clubStats.tournament;
      }
    }
    // EloChart will show Club ELO when scope='club'
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: paperTheme.colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* 🆕 [THOR] Main Scope Selector (Public vs Club) */}
      <Card
        style={{
          marginHorizontal: 16,
          marginVertical: 8,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <Card.Content>
          <SegmentedButtons
            value={mainScope}
            onValueChange={value => setMainScope(value as MainScope)}
            buttons={[
              {
                value: 'public',
                label: t('statsTab.scope.public'),
                icon: 'earth',
              },
              {
                value: 'club',
                label: t('statsTab.scope.club'),
                icon: 'account-group',
              },
            ]}
            style={{ marginBottom: mainScope === 'club' ? 8 : 0 }}
          />
          {mainScope === 'club' && (
            <>
              <ClubSelector
                clubs={availableClubs}
                selectedClubId={selectedClubId}
                onSelectClub={setSelectedClubId}
              />
              <ClubFilterSelector
                value={clubFilter}
                onValueChange={value => setClubFilter(value)}
              />
            </>
          )}
          {mainScope === 'public' && (
            <MatchTypeSelector value={matchTypeFilter} onValueChange={setMatchTypeFilter} />
          )}
        </Card.Content>
      </Card>

      {/* 🆕 [KIM] Rankings Card - Moved above Match Summary */}
      <Card
        style={{
          marginHorizontal: 16,
          marginVertical: 8,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <Card.Title title={t('statsTab.rankings.title')} titleVariant='titleMedium' />
        <Card.Content>
          {statsLoading.rankings ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size='large' color={paperTheme.colors.primary} />
            </View>
          ) : mainScope === 'public' ? (
            <RankingsCard
              type='global'
              data={
                // 🆕 [KIM] Use matchType-specific rankings from publicRankings
                unifiedStats?.publicRankings?.[matchTypeFilter] || {
                  monthly: { currentRank: null, totalPlayers: 0 },
                  season: { currentRank: null, totalPlayers: 0 },
                  alltime: { currentRank: null, totalPlayers: 0 },
                }
              }
              // 🆕 [KIM] Pass gender for "전체(남자)" or "전체(여자)" label
              gender={userGender}
            />
          ) : clubFilter === 'league' ? (
            <RankingsCard
              type='club-league'
              // 🎯 [KIM FIX] Filter by selectedClubId - show only selected club's ranking
              data={(unifiedStats?.clubBreakdowns.league || []).filter(
                club => !selectedClubId || club.clubId === selectedClubId
              )}
              // 🎯 [KIM v3] Pass gender for filtering rankings (분기/금년/전체 all filtered by gender)
              gender={userGender}
            />
          ) : (
            <RankingsCard
              type='club-tournament'
              // 🎯 [KIM FIX] Filter by selectedClubId - show only selected club's ranking
              data={(unifiedStats?.clubBreakdowns.tournament || []).filter(
                club => !selectedClubId || club.clubId === selectedClubId
              )}
            />
          )}
        </Card.Content>
      </Card>

      {/* 🆕 [IRON MAN] Match Summary Card */}
      {statsLoading.publicStats || statsLoading.clubStats ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size='large' color={paperTheme.colors.primary} />
          <PaperText variant='bodySmall' style={{ marginTop: 12 }}>
            {t('statsTab.loading.stats')}
          </PaperText>
        </View>
      ) : (
        <MatchSummaryCard stats={displayStats} />
      )}

      {/* 🆕 [VISION] Charts Section with 800ms animation */}
      {!statsLoading.publicStats && !statsLoading.clubStats && userId && (
        <StatsChartsSection
          stats={displayStats}
          userId={userId}
          currentLanguage={currentLanguage}
          scope={mainScope}
          showEloChart={showEloChart}
          clubFilter={clubFilter}
          // 🎯 [KIM FIX] Pass selectedClubId for club-specific ELO/Tournament charts
          selectedClubId={mainScope === 'club' ? selectedClubId : null}
        />
      )}

      {/* 🆕 [IRON MAN] ELO Trend Chart - Only for public scope with specific match type */}
      {/* 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth) */}
      {mainScope === 'public' &&
        matchTypeFilter !== 'all' &&
        userId &&
        userProfile.eloRatings &&
        !statsLoading.publicStats && (
          <EloTrendCard
            userId={userId}
            matchType={matchTypeFilter as 'singles' | 'doubles' | 'mixed_doubles'}
            currentElo={(() => {
              // 🎯 [KIM FIX v25] eloRatings만 사용 (Single Source of Truth)
              const eloRatings = userProfile.eloRatings;
              const matchTypeKey = matchTypeFilter === 'mixed_doubles' ? 'mixed' : matchTypeFilter;
              const currentElo = eloRatings?.[matchTypeKey as keyof typeof eloRatings]?.current;

              if (currentElo && currentElo > 0) {
                console.log('🔍 [EloTrendCard] ELO from eloRatings:', matchTypeFilter, currentElo);
                return currentElo;
              }

              console.warn(
                '⚠️ [EloTrendCard] No ELO data found - this should not happen for onboarded users:',
                matchTypeFilter
              );
              return 1200;
            })()}
          />
        )}
    </ScrollView>
  );
};

export default StatsTabContent;
