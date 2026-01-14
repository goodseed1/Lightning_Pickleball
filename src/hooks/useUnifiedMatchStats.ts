/**
 * 🔗 [THOR] useUnifiedMatchStats Hook
 *
 * Consolidated data fetching hook for the redesigned match statistics system.
 * Combines public stats, club stats, and rankings into a unified data structure.
 *
 * Replaces the scattered state management in MyProfileScreen with a clean,
 * centralized hook that handles all stats-related data fetching.
 */

import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import rankingService from '../services/rankingService';
import clubService from '../services/clubService';
import {
  UnifiedMatchStats,
  MatchStats,
  GlobalRankingData,
  ClubLeagueBreakdown,
  ClubTournamentBreakdown,
} from '../types/stats';
import { AggregatedStats } from '../types/user';

// ==================== HOOK INTERFACE ====================

interface UseUnifiedMatchStatsProps {
  userId: string;
  // 🆕 [KIM] Gender filter for gender-specific rankings (male users see male rankings only)
  gender?: 'male' | 'female';
}

interface UseUnifiedMatchStatsReturn {
  data: UnifiedMatchStats | null;
  loading: {
    publicStats: boolean;
    clubStats: boolean;
    rankings: boolean;
  };
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== HOOK IMPLEMENTATION ====================

export function useUnifiedMatchStats({
  userId,
  gender,
}: UseUnifiedMatchStatsProps): UseUnifiedMatchStatsReturn {
  // State
  const [data, setData] = useState<UnifiedMatchStats | null>(null);
  const [loading, setLoading] = useState({
    publicStats: true,
    clubStats: true,
    rankings: true,
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all stats data and combine into UnifiedMatchStats
   */
  const fetchStats = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading({ publicStats: true, clubStats: true, rankings: true });
      setError(null);

      // Fetch all data in parallel
      const results = await Promise.all([
        userService.getUserProfile(userId),
        userService.getAggregatedUserStats(userId),
        rankingService.getUserRanking(userId, 'monthly'),
        rankingService.getUserRanking(userId, 'season'),
        rankingService.getUserRanking(userId, 'alltime'),
        // 🆕 [KIM] Pass gender for gender-filtered club rankings
        clubService.getClubLeagueRankings(userId, gender),
        clubService.getClubTournamentRankings(userId, gender),
        // 🆕 [KIM] Win rate based ranking for "all" tab - with gender filter
        rankingService.getPublicRankingByWinRate(userId, 'alltime', gender),
        // 🆕 [KIM] ELO based rankings for specific matchTypes - with gender filter
        rankingService.getPublicRankingByMatchType(userId, 'singles', 'alltime', gender),
        rankingService.getPublicRankingByMatchType(userId, 'doubles', 'alltime', gender),
        rankingService.getPublicRankingByMatchType(userId, 'mixed_doubles', 'alltime', gender),
      ]);

      // Type assertion for service calls
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const userProfile = results[0] as any;
      const aggregatedStats = results[1] as AggregatedStats;
      const monthlyRanking = results[2] as any;
      const seasonRanking = results[3] as any;
      const alltimeRanking = results[4] as any;
      const clubLeagueRankings = results[5] as unknown[];
      const clubTournamentRankings = results[6] as unknown[];
      const allWinRateRanking = results[7] as any;
      const singlesRanking = results[8] as any;
      const doublesRanking = results[9] as any;
      const mixedDoublesRanking = results[10] as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // 🔍 DEBUG: Log raw data for debugging
      console.log('🔍 [useUnifiedMatchStats] Raw data loaded:', {
        userProfile: userProfile?.stats,
        aggregatedStats,
        monthlyRanking,
        seasonRanking,
        alltimeRanking,
        clubLeagueRankings: clubLeagueRankings?.length,
        clubTournamentRankings: clubTournamentRankings?.length,
      });

      // 1. Public stats (from aggregatedStats)
      // 🎯 [KIM FIX] Use matchType-specific publicStats from aggregatedStats
      // Structure: { singles: { matchesPlayed, wins, losses }, doubles: {...}, mixed_doubles: {...} }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const publicStats = (aggregatedStats as any).publicStats || {
        singles: { matchesPlayed: 0, wins: 0, losses: 0, elo: 1200 },
        doubles: { matchesPlayed: 0, wins: 0, losses: 0, elo: 1200 },
        mixed_doubles: { matchesPlayed: 0, wins: 0, losses: 0, elo: 1200 },
      };

      console.log('📊 [PUBLIC STATS] matchType breakdown:', publicStats);

      // 2. Club stats (from aggregatedStats)
      const clubStats = extractClubStats(aggregatedStats);

      console.log('🏢 [CLUB STATS]:', clubStats);

      // 3. Global rankings (combine 3 separate results)
      const globalRankings: GlobalRankingData = {
        monthly: {
          currentRank: monthlyRanking?.currentRank || null,
          totalPlayers: monthlyRanking?.totalPlayers || 0,
        },
        season: {
          currentRank: seasonRanking?.currentRank || null,
          totalPlayers: seasonRanking?.totalPlayers || 0,
        },
        alltime: {
          currentRank: alltimeRanking?.currentRank || null,
          totalPlayers: alltimeRanking?.totalPlayers || 0,
        },
      };

      // 4. Club breakdowns
      const clubBreakdowns = {
        league: transformClubLeagueRankings(clubLeagueRankings),
        tournament: transformClubTournamentRankings(clubTournamentRankings),
      };

      // 🆕 [KIM v2] 5. Public rankings by matchType with ELO
      // Extract ELO ratings from userProfile for LTR display
      const eloRatings = userProfile?.eloRatings || {};
      const singlesElo = eloRatings?.singles?.current || 1200;
      const doublesElo = eloRatings?.doubles?.current || 1200;
      const mixedElo = eloRatings?.mixed?.current || 1200;
      // For "all" tab, use average of all match types
      const allElo = Math.round((singlesElo + doublesElo + mixedElo) / 3);

      console.log('🎾 [ELO RATINGS] For rankings:', {
        singles: singlesElo,
        doubles: doublesElo,
        mixed: mixedElo,
        all: allElo,
      });

      const publicRankings = {
        all: {
          monthly: {
            currentRank: allWinRateRanking?.currentRank || null,
            totalPlayers: allWinRateRanking?.totalPlayers || 0,
            elo: allElo,
          },
          season: {
            currentRank: allWinRateRanking?.currentRank || null,
            totalPlayers: allWinRateRanking?.totalPlayers || 0,
            elo: allElo,
          },
          alltime: {
            currentRank: allWinRateRanking?.currentRank || null,
            totalPlayers: allWinRateRanking?.totalPlayers || 0,
            elo: allElo,
          },
        },
        singles: {
          monthly: {
            currentRank: singlesRanking?.currentRank || null,
            totalPlayers: singlesRanking?.totalPlayers || 0,
            elo: singlesElo,
          },
          season: {
            currentRank: singlesRanking?.currentRank || null,
            totalPlayers: singlesRanking?.totalPlayers || 0,
            elo: singlesElo,
          },
          alltime: {
            currentRank: singlesRanking?.currentRank || null,
            totalPlayers: singlesRanking?.totalPlayers || 0,
            elo: singlesElo,
          },
        },
        doubles: {
          monthly: {
            currentRank: doublesRanking?.currentRank || null,
            totalPlayers: doublesRanking?.totalPlayers || 0,
            elo: doublesElo,
          },
          season: {
            currentRank: doublesRanking?.currentRank || null,
            totalPlayers: doublesRanking?.totalPlayers || 0,
            elo: doublesElo,
          },
          alltime: {
            currentRank: doublesRanking?.currentRank || null,
            totalPlayers: doublesRanking?.totalPlayers || 0,
            elo: doublesElo,
          },
        },
        mixed_doubles: {
          monthly: {
            currentRank: mixedDoublesRanking?.currentRank || null,
            totalPlayers: mixedDoublesRanking?.totalPlayers || 0,
            elo: mixedElo,
          },
          season: {
            currentRank: mixedDoublesRanking?.currentRank || null,
            totalPlayers: mixedDoublesRanking?.totalPlayers || 0,
            elo: mixedElo,
          },
          alltime: {
            currentRank: mixedDoublesRanking?.currentRank || null,
            totalPlayers: mixedDoublesRanking?.totalPlayers || 0,
            elo: mixedElo,
          },
        },
      };

      // Combine into UnifiedMatchStats
      const unifiedStats: UnifiedMatchStats = {
        publicStats,
        clubStats,
        clubBreakdowns,
        globalRankings,
        publicRankings,
        loading: {
          publicStats: false,
          clubStats: false,
          rankings: false,
        },
      };

      setData(unifiedStats);
      setLoading({ publicStats: false, clubStats: false, rankings: false });
    } catch (err) {
      console.error('[useUnifiedMatchStats] Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setLoading({ publicStats: false, clubStats: false, rankings: false });
    }
  }, [userId, gender]);

  /**
   * Refresh stats data
   */
  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract club stats from AggregatedStats
 */
function extractClubStats(aggregatedStats: AggregatedStats | null): {
  all: MatchStats;
  league: MatchStats;
  tournament: MatchStats;
} {
  if (!aggregatedStats) {
    const emptyStats: MatchStats = { totalMatches: 0, wins: 0, losses: 0, winRate: 0 };
    return {
      all: emptyStats,
      league: emptyStats,
      tournament: emptyStats,
    };
  }

  // All club stats (league + tournament combined)
  const all: MatchStats = {
    totalMatches: aggregatedStats.clubMatches || 0,
    wins: aggregatedStats.clubWins || 0,
    losses: aggregatedStats.clubLosses || 0,
    winRate: aggregatedStats.clubWinRate || 0,
  };

  // League stats only
  const league: MatchStats = {
    totalMatches: aggregatedStats.leagueMatches || 0,
    wins: aggregatedStats.leagueWins || 0,
    losses: aggregatedStats.leagueLosses || 0,
    winRate: aggregatedStats.leagueWinRate || 0,
  };

  // Tournament stats only
  const tournament: MatchStats = {
    totalMatches: aggregatedStats.tournamentTotalMatches || aggregatedStats.tournamentMatches || 0,
    wins: aggregatedStats.tournamentMatchWins || aggregatedStats.tournamentWins || 0,
    losses: aggregatedStats.tournamentMatchLosses || aggregatedStats.tournamentLosses || 0,
    winRate: aggregatedStats.tournamentWinRate || 0,
  };

  return {
    all,
    league,
    tournament,
  };
}

/**
 * Transform club league rankings data
 */
function transformClubLeagueRankings(rankings: unknown[]): ClubLeagueBreakdown[] {
  if (!rankings || !Array.isArray(rankings)) {
    return [];
  }

  return rankings.map((club: unknown) => {
    // Type guard for club object
    const clubData = club as {
      clubId?: string;
      clubName?: string;
      currentRank?: number;
      totalPlayers?: number;
      clubEloRating?: number;
      isPrivate?: boolean;
      matches?: number;
      wins?: number;
      losses?: number;
      winRate?: number;
    };

    return {
      clubId: clubData.clubId || '',
      clubName: clubData.clubName || 'Unknown Club',
      currentRank: clubData.currentRank || 0,
      totalPlayers: clubData.totalPlayers || 0,
      clubEloRating: clubData.clubEloRating || 1200,
      isPrivate: clubData.isPrivate || false,
      stats: {
        totalMatches: clubData.matches || 0,
        wins: clubData.wins || 0,
        losses: clubData.losses || 0,
        winRate: clubData.winRate || 0,
      },
    };
  });
}

/**
 * Transform club tournament rankings data
 */
function transformClubTournamentRankings(rankings: unknown[]): ClubTournamentBreakdown[] {
  if (!rankings || !Array.isArray(rankings)) {
    return [];
  }

  return rankings.map((club: unknown) => {
    // Type guard for club object
    const clubData = club as {
      clubId?: string;
      clubName?: string;
      currentRank?: number;
      totalPlayers?: number;
      isPrivate?: boolean;
      tournamentStats?: {
        matchWins?: number;
        matchLosses?: number;
        totalMatches?: number;
        championships?: number;
        runnerUps?: number;
        semiFinals?: number;
        tournamentsPlayed?: number;
        bestFinish?: number | null;
        wins?: number;
        losses?: number;
        participations?: number;
      };
    };

    const tournamentStats = clubData.tournamentStats || {};

    return {
      clubId: clubData.clubId || '',
      clubName: clubData.clubName || 'Unknown Club',
      currentRank: clubData.currentRank || 0,
      totalPlayers: clubData.totalPlayers || 0,
      isPrivate: clubData.isPrivate || false,
      tournamentStats: {
        // Match statistics
        matchWins: tournamentStats.matchWins || tournamentStats.wins || 0,
        matchLosses: tournamentStats.matchLosses || tournamentStats.losses || 0,
        totalMatches: tournamentStats.totalMatches || tournamentStats.participations || 0,
        winRate:
          (tournamentStats.totalMatches || 0) > 0
            ? ((tournamentStats.matchWins || 0) / (tournamentStats.totalMatches || 0)) * 100
            : 0,

        // Tournament placements
        championships: tournamentStats.championships || 0,
        runnerUps: tournamentStats.runnerUps || 0,
        semiFinals: tournamentStats.semiFinals || 0,

        // Overall metrics
        tournamentsPlayed: tournamentStats.tournamentsPlayed || 0,
        bestFinish: tournamentStats.bestFinish || null,

        // Legacy field compatibility
        wins: tournamentStats.wins || 0,
        participations: tournamentStats.participations || 0,
      },
    };
  });
}

export default useUnifiedMatchStats;
