/**
 * 📊 [THOR] Unified Statistics Type Definitions
 *
 * Central type definitions for the redesigned match statistics system.
 * Supports the new dual-scope architecture (public vs club) with sub-filtering.
 */

// Re-export existing types from user.ts
export type {
  AggregatedStats,
  ClubRankingData,
  ClubTournamentRankingData,
  UnifiedStats,
  ClubStats,
} from './user';

// ==================== MATCH STATISTICS ====================

/**
 * Basic match statistics structure
 * Used across public, club league, and club tournament scopes
 */
export interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

// ==================== UNIFIED STATS ====================

/**
 * Unified match statistics for the new MyProfileScreen design
 * Consolidates public and club stats with clear scope separation
 */
export interface UnifiedMatchStats {
  // Public scope stats (from userProfile.stats)
  publicStats: MatchStats;

  // Club scope stats (aggregated across all clubs)
  clubStats: {
    // All club matches combined (league + tournament)
    all: MatchStats;

    // League matches only
    league: MatchStats;

    // Tournament matches only
    tournament: MatchStats;
  };

  // Club-specific breakdowns (for rankings display)
  clubBreakdowns: {
    league: ClubLeagueBreakdown[];
    tournament: ClubTournamentBreakdown[];
  };

  // Global rankings (for public scope) - DEPRECATED, use publicRankings instead
  globalRankings: GlobalRankingData;

  // 🆕 [KIM] Public rankings by matchType
  publicRankings?: {
    all: GlobalRankingData; // Overall win rate based ranking
    singles: GlobalRankingData; // Singles ELO based ranking
    doubles: GlobalRankingData; // Doubles ELO based ranking
    mixed_doubles: GlobalRankingData; // Mixed doubles ELO based ranking
  };

  // Loading states
  loading: {
    publicStats: boolean;
    clubStats: boolean;
    rankings: boolean;
  };
}

// ==================== CLUB BREAKDOWNS ====================

/**
 * Club league statistics breakdown
 * One entry per club the user is a member of
 */
export interface ClubLeagueBreakdown {
  clubId: string;
  clubName: string;
  currentRank: number;
  totalPlayers: number;
  clubEloRating: number;
  isPrivate: boolean;
  stats: MatchStats;
}

/**
 * Club tournament statistics breakdown
 * One entry per club the user has participated in tournaments
 */
export interface ClubTournamentBreakdown {
  clubId: string;
  clubName: string;
  currentRank: number;
  totalPlayers: number;
  isPrivate: boolean;
  tournamentStats: {
    // Match statistics
    matchWins: number;
    matchLosses: number;
    totalMatches: number;
    winRate: number;

    // Tournament placements
    championships: number; // 1st place finishes
    runnerUps: number; // 2nd place finishes
    semiFinals: number; // 3rd-4th place finishes

    // Overall metrics
    tournamentsPlayed: number; // Number of tournaments entered
    bestFinish: number | null; // Best placement (1=winner, 2=runner-up, etc.)

    // Legacy field compatibility
    wins?: number; // Legacy: actually match wins
    participations?: number; // Legacy: actually total matches
  };
}

// ==================== RANKING DATA ====================

/**
 * Individual ranking period data with ELO
 * 🎯 [KIM v2] Added elo field for LTR display
 */
export interface RankingPeriodData {
  currentRank: number | null;
  totalPlayers: number;
  elo?: number; // 🆕 ELO value for this period/matchType
}

/**
 * Global ranking data (monthly, season, all-time)
 * For public scope rankings display
 * 🎯 [KIM v2] Updated to include ELO for LTR calculation
 */
export interface GlobalRankingData {
  monthly: RankingPeriodData;
  season: RankingPeriodData;
  alltime: RankingPeriodData;
}

// ==================== SCOPE & FILTER TYPES ====================

/**
 * Main scope selection
 * Public = all non-club matches
 * Club = all club matches (leagues + tournaments)
 */
export type MainScope = 'public' | 'club';

/**
 * Club filter selection (only applicable when mainScope === 'club')
 * League = club league matches only
 * Tournament = club tournament matches only
 * 🆕 [KIM] Removed 'all' option - users now see only league or tournament
 */
export type ClubFilter = 'league' | 'tournament';

/**
 * Display mode toggle
 * Simple = basic stats only
 * Detailed = full stats with charts and breakdowns
 */
export type DisplayMode = 'simple' | 'detailed';

// ==================== HELPER TYPES ====================

/**
 * Stats loading state for async data fetching
 */
export interface StatsLoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Combined state for the stats section
 */
export interface StatsState {
  // Data
  data: UnifiedMatchStats | null;

  // UI State
  mainScope: MainScope;
  clubFilter: ClubFilter;
  displayMode: DisplayMode;

  // Loading state
  loading: StatsLoadingState;
}
