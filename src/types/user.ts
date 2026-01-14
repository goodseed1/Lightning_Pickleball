import { Timestamp } from 'firebase/firestore';

/**
 * ⚡ LPR (Lightning Pickleball Rating) System
 *
 * LPR은 번개 피클볼 커뮤니티의 독자적인 레이팅 시스템입니다.
 * - LPR 1-10: 직관적인 10단계 레벨 시스템
 * - ELO 알고리즘 기반으로 계산
 * - 공용 번개 매치 결과에 적용
 *
 * 📝 Migration Note:
 * - 기존 NTRP 필드는 하위 호환성을 위해 유지
 * - 새로운 ltr 필드가 LPR 1-10 레벨을 저장
 * - calculated 필드는 기존 NTRP 형식 (2.0-5.5)으로 유지 (레거시)
 */

/**
 * Unified skill level data structure
 * Single source of truth with self-assessed ranges and calculated values
 *
 * ⚡ LPR System Migration:
 * - ltr: 새로운 LPR 1-10 레벨 (primary)
 * - calculated: 기존 NTRP 형식 유지 (legacy, backward compatibility)
 */
export interface SkillLevel {
  // Self-assessed skill level range (e.g., "3.0-3.5" for legacy or "3" for LPR)
  selfAssessed: string;

  // ⚡ NEW: LPR level (1-10) - Lightning Pickleball Rating
  // This is the primary rating used in the new system
  ltr?: number;

  // System-calculated NTRP value based on unified ELO rating (legacy)
  // Kept for backward compatibility during transition
  calculated?: number;

  // Confidence level in the calculated value (0.0 to 1.0)
  confidence?: number;

  // When this skill level was last updated
  lastUpdated: string;

  // Source of the self-assessed value
  source?: 'onboarding' | 'manual' | 'migration' | 'ltr-migration';
}

/**
 * Legacy skill level data (for backward compatibility)
 */
export interface LegacySkillData {
  ltrLevel?: string | number;
  skillLevel?: string;
  profile?: {
    skillLevel?: string;
    ltrLevel?: string | number;
  };
}

/**
 * Unified statistics for all matches (public and club with weighting)
 */
export interface UnifiedStats {
  // Single source of truth for player skill
  unifiedEloRating: number;

  // Total match statistics
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  lastMatchDate?: string;

  // Context breakdown (for display purposes)
  publicMatches: number;
  clubMatches: number;

  // ⭐ Official Tiebreaker: Set/Game statistics (all matches combined)
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;

  // 🆕 Public match breakdown by matchType (단식/복식/혼합복식 완전 분리)
  publicStats: {
    singles: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      elo: number; // 독립적 ELO
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
    };
    doubles: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      elo: number; // 독립적 ELO
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
    };
    mixed_doubles: {
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      elo: number; // 독립적 ELO
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
    };
  };
}

/**
 * Club-specific statistics with independent ELO system
 */
export interface ClubStats {
  // Club-specific match tracking
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  joinedAt: string;
  lastMatchDate?: string;

  // ⭐ Official Tiebreaker: Set/Game statistics (club matches only)
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;

  // 🆕 Project Olympus: Club-specific ELO rating (독립적인 클럽별 ELO)
  clubEloRating?: number; // 기본값 1200, 각 클럽마다 독립적
  clubEloLastUpdated?: string; // ISO timestamp of last ELO update

  // Club-specific ranking (can be based on wins, participation, etc.)
  clubRanking?: number;

  // 🆕 Thor 2.0: Tournament Statistics (헌장 v1.4 - 분리된 랭킹)
  tournamentStats?: {
    participations: number; // 토너먼트 참가 횟수
    wins: number; // 우승 횟수
    runnerUps: number; // 준우승 횟수
    semiFinals: number; // 준결승 진출 횟수
    bestFinish: number; // 최고 성적 (1=우승, 2=준우승, etc.)
    totalMatches: number; // 토너먼트 총 경기 수
    tournamentWins: number; // 토너먼트 승수
    tournamentLosses: number; // 토너먼트 패수
    tournamentWinRate: number; // 토너먼트 승률
  };

  // 🆕 Thor 2.0: Club Ranking Points (클럽 내 순위 포인트)
  clubRankingPoints?: number;
  lastRankingUpdate?: string; // ISO timestamp
}

/**
 * 🏛️ THOR'S UNIFIED HISTORY MUSEUM
 * Aggregated stats combining global + all club stats
 */
export interface AggregatedStats {
  // Overall totals (global + all clubs)
  totalWins: number;
  totalLosses: number;
  totalMatches: number;
  totalWinRate: number;

  // Public matches (non-club matches)
  publicWins: number;
  publicLosses: number;
  publicMatches: number;
  publicWinRate: number;

  // Legacy field names (kept for backward compatibility)
  globalWins?: number;
  globalLosses?: number;
  globalMatches?: number;
  globalWinRate?: number;

  // Club breakdown (all club matches combined)
  clubWins: number;
  clubLosses: number;
  clubMatches: number;
  clubWinRate: number;

  // League matches only (club league, excluding tournaments)
  leagueWins: number;
  leagueLosses: number;
  leagueMatches: number;
  leagueWinRate: number;

  // Tournament matches only
  tournamentMatchWins: number;
  tournamentMatchLosses: number;
  tournamentTotalMatches: number;
  tournamentWinRate: number;

  // Tournament placement statistics
  championships?: number;
  runnerUps?: number;
  semiFinals?: number;
  tournamentsPlayed?: number;
  bestFinish?: number | null;

  // Legacy field names (kept for backward compatibility)
  tournamentWins?: number;
  tournamentLosses?: number;
  tournamentMatches?: number;

  // ELO rating (from unified stats - weighted global + club)
  unifiedEloRating: number;

  // Streak (max across all contexts)
  currentStreak: number;
  longestStreak: number;

  // Detailed club breakdown by club
  clubStatsBreakdown: Array<{
    clubId: string;
    clubName: string;
    wins: number;
    losses: number;
    matches: number;
    winRate: number;
    clubEloRating?: number; // 🆕 PROJECT OLYMPUS: Club-specific ELO rating
  }>;
}

/**
 * Club membership information
 */
export interface ClubMembership {
  clubId: string;
  clubName: string;
  role: 'member' | 'admin' | 'owner';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  clubStats: ClubStats;
}

/**
 * Enhanced user profile with dual ranking system
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;

  // Enhanced skill level structure
  skillLevel: SkillLevel;

  // Unified statistics for all matches
  stats: UnifiedStats;

  // Club memberships (stored as sub-collection in Firestore)
  clubMemberships?: { [clubId: string]: ClubMembership };

  // Legacy fields (for backward compatibility during migration)
  ltrLevel?: string | number;
  profile?: {
    skillLevel?: string;
    ltrLevel?: string | number;
    [key: string]: unknown;
  };
  legacyStats?: {
    eloRating: number;
    matchesPlayed: number;
    wins: number;
    losses: number;
    [key: string]: unknown;
  };

  // Additional user data
  preferences?: {
    language: string;
    notifications: {
      matchReminders: boolean;
      friendRequests: boolean;
      clubEvents: boolean;
    };
  };

  createdAt: string;
  lastActive: string;
  [key: string]: unknown;
}

/**
 * Display options for LPR levels in unified ranking system
 */
export interface LtrDisplayOptions {
  primary: string; // Main display text
  secondary?: string; // Additional context
  source: 'calculated' | 'self-assessed' | 'legacy';
  confidence?: number; // For calculated values
  matchBreakdown?: {
    public: number;
    club: number;
  }; // Context about match sources
}

/**
 * Match context for applying appropriate weighting to unified ELO
 */
export interface MatchContext {
  type: 'public' | 'club';
  clubId?: string; // Required if type is 'club'
  clubName?: string;
  weight?: number; // K-Factor multiplier (auto-calculated)
}

/**
 * Ranking update data for post-match processing
 */
export interface RankingUpdateData {
  userId: string;
  context: MatchContext;
  result: 'win' | 'loss';
  opponentElo: number;
  matchId: string;
}

/**
 * Achievement Badge (milestone-based rewards)
 */
export interface Achievement {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: 'matches' | 'social' | 'clubs' | 'tournaments' | 'streaks' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: RewardIcon;
  points: number;
  unlockedAt: string;
  progress?: number; // 0-100 for partial completion
  hidden: boolean;
  condition: {
    type: string;
    value: number;
    field?: string;
  };
}

/**
 * Season and trophy data
 */
export interface SeasonData {
  seasonId: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

/**
 * Dynamic icon configuration for rewards
 */
export interface RewardIcon {
  set: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons';
  name: string;
  color: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  season?: string; // e.g., "Spring 2025", "Winter 2024"
  clubTheme?: {
    clubId: string;
    customColor?: string;
    decoration?: string; // Additional visual elements
  };
}

/**
 * Tournament Trophy (medals for winners/runners-up)
 */
export interface TournamentTrophy {
  id: string;
  rank: 'Winner' | 'Runner-up';
  position: number;
  name: string;
  tournamentName: string;
  clubName: string;
  clubId: string;
  leagueId: string;
  trophyType: 'tournament_winner' | 'tournament_runnerup' | 'league_winner';
  icon: RewardIcon;
  date: Timestamp; // Firestore Timestamp
  season: string;
  createdAt: Timestamp;
}

/**
 * Season/Performance Trophy (ELO-based awards)
 *
 * 🏛️ PROJECT OLYMPUS: Updated to support Firebase Cloud Functions trophy system
 */
export interface Trophy {
  id: string;
  type:
    | 'rank-up'
    | 'win-rate'
    | 'participation'
    | 'tournament_winner'
    | 'tournament_runnerup'
    | 'league_winner';
  seasonId?: string; // Optional for backwards compatibility
  awardedAt: Date | { toDate: () => Date }; // 🏛️ Firestore Timestamp from backend
  context?: 'global' | 'club'; // Optional for backwards compatibility
  clubId?: string;
  description?: string; // Optional for backwards compatibility
  icon?: RewardIcon; // Optional for backwards compatibility
  // Tournament-specific fields (for backwards compatibility)
  rank?: 'Winner' | 'Runner-up';
  position?: number;
  tournamentName?: string;
  clubName?: string;
  leagueId?: string;
  // 🏛️ PROJECT OLYMPUS: New fields from Cloud Function
  trophyType?: 'tournament_winner' | 'tournament_runnerup';
  name?: string; // Trophy display name (e.g., "Tournament Name - Winner")
  season?: string; // Season identifier (e.g., "Spring 2025")
  createdAt?: Date | { toDate: () => Date }; // Firestore Timestamp
}

/**
 * Club League Ranking Data
 * User's ranking within a specific club's league ladder
 */
export interface ClubRankingData {
  clubId: string;
  clubName: string;
  currentRank: number;
  totalPlayers: number;
  clubEloRating: number;
  isPrivate?: boolean;
}

/**
 * Club Tournament Ranking Data
 * User's tournament performance ranking within a specific club
 * Ranking is based ONLY on tournament wins
 */
export interface ClubTournamentRankingData {
  clubId: string;
  clubName: string;
  currentRank: number;
  totalPlayers: number;
  tournamentStats: {
    wins: number;
    runnerUps: number;
    semiFinals: number;
    bestFinish: string;
    participations: number;
  };
  isPrivate: boolean;
}

/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 2
 * Season Record - Historical record of player's final ranking at season end
 * Stored in hallOfFame collection for each season
 *
 * ⚡ LPR System: ltrGrade is now a number (1-10)
 */
export interface SeasonRecord {
  type: 'SEASON_FINAL_RANK';
  seasonId: string; // e.g., '2025-Q1'
  seasonName: string; // e.g., '2025 Spring'
  finalRank: number; // Player's final rank in that season
  totalPlayers: number; // Total number of official rankers (>= 5 matches)
  finalElo: number; // Player's ELO at season end
  ltrGrade: number; // ⚡ LPR level at season end (1-10)
  startingLtrGrade: number; // ⚡ LPR level at season start (for grade group tracking)
  awardedAt: Date; // When this record was created
}

/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 2
 * Season Snapshot - Player's LPR grade recorded at season start
 * Used to determine which grade group they compete in for that season
 *
 * ⚡ LPR System: ltrGrade is now a number (1-10)
 */
export interface SeasonSnapshot {
  seasonId: string; // e.g., '2025-Q1'
  ltrGrade: number; // ⚡ LPR level at season start (1-10)
  eloRating: number; // ELO rating at season start
  recordedAt: Date; // Timestamp when snapshot was taken
}
