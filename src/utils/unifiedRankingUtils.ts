import { UnifiedStats, SkillLevel, ClubStats } from '../types/user';

/**
 * Unified Ranking System Utilities
 *
 * This replaces the dual ranking system with a single, weighted ELO approach.
 * All matches contribute to one unified ELO rating with context-based weighting.
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 * UI 표시: "LPR" (Lightning Pickleball Rating)
 * 코드/DB: "ntrp" (아래 모든 함수명, 특히 convertEloToLtr)
 * 이유: Firestore 필드명 변경 위험 방지
 */

/**
 * Calculate new ELO rating using standard ELO formula
 */
export function calculateNewELO(
  playerElo: number,
  opponentElo: number,
  result: 'win' | 'loss',
  kFactor: number
): number {
  // Expected score based on ELO difference
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

  // Actual score (1 for win, 0 for loss)
  const actualScore = result === 'win' ? 1 : 0;

  // New ELO calculation
  const newElo = Math.round(playerElo + kFactor * (actualScore - expectedScore));

  // Ensure ELO doesn't go below minimum threshold
  return Math.max(newElo, 800);
}

/**
 * Update unified statistics after a match
 */
export function updateUnifiedStats(
  currentStats: UnifiedStats,
  result: 'win' | 'loss',
  newEloRating: number,
  isClubMatch: boolean = false
): UnifiedStats {
  const isWin = result === 'win';
  const newWins = currentStats.wins + (isWin ? 1 : 0);
  const newLosses = currentStats.losses + (isWin ? 0 : 1);
  const newMatchesPlayed = currentStats.matchesPlayed + 1;

  // Update streak
  let newCurrentStreak: number;
  if (isWin) {
    newCurrentStreak = currentStats.currentStreak >= 0 ? currentStats.currentStreak + 1 : 1;
  } else {
    newCurrentStreak = currentStats.currentStreak <= 0 ? currentStats.currentStreak - 1 : -1;
  }

  return {
    ...currentStats,
    unifiedEloRating: newEloRating,
    matchesPlayed: newMatchesPlayed,
    wins: newWins,
    losses: newLosses,
    winRate: newMatchesPlayed > 0 ? newWins / newMatchesPlayed : 0,
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(currentStats.longestStreak, Math.abs(newCurrentStreak)),
    lastMatchDate: new Date().toISOString(),

    // Context tracking
    publicMatches: currentStats.publicMatches + (isClubMatch ? 0 : 1),
    clubMatches: currentStats.clubMatches + (isClubMatch ? 1 : 0),
  };
}

/**
 * Update club-specific statistics (non-ELO tracking only)
 */
export function updateClubStats(currentStats: ClubStats, result: 'win' | 'loss'): ClubStats {
  const isWin = result === 'win';
  const newWins = currentStats.wins + (isWin ? 1 : 0);
  const newLosses = currentStats.losses + (isWin ? 0 : 1);
  const newMatchesPlayed = currentStats.matchesPlayed + 1;

  // Update streak
  let newCurrentStreak: number;
  if (isWin) {
    newCurrentStreak = currentStats.currentStreak >= 0 ? currentStats.currentStreak + 1 : 1;
  } else {
    newCurrentStreak = currentStats.currentStreak <= 0 ? currentStats.currentStreak - 1 : -1;
  }

  return {
    ...currentStats,
    matchesPlayed: newMatchesPlayed,
    wins: newWins,
    losses: newLosses,
    winRate: newMatchesPlayed > 0 ? newWins / newMatchesPlayed : 0,
    currentStreak: newCurrentStreak,
    lastMatchDate: new Date().toISOString(),
  };
}

/**
 * Update skill level based on unified ELO rating
 */
export function updateSkillLevelFromUnified(
  currentSkillLevel: SkillLevel,
  unifiedStats: UnifiedStats
): SkillLevel {
  const newNtrp = convertEloToLtr(unifiedStats.unifiedEloRating);
  const confidence = calculateConfidence(unifiedStats.matchesPlayed);

  return {
    ...currentSkillLevel,
    calculated: newNtrp,
    confidence: confidence,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Convert ELO rating to LPR value (1-10 scale)
 * 🎯 [KIM FIX v16] Use proper LPR scale (1-10) instead of NTRP (2.5-5.5)
 * Import from constants/ltr.ts for single source of truth
 */
export function convertEloToLtr(elo: number): number {
  if (elo < 1000) return 1;
  if (elo < 1100) return 2;
  if (elo < 1200) return 3;
  if (elo < 1300) return 4;
  if (elo < 1450) return 5;
  if (elo < 1600) return 6;
  if (elo < 1800) return 7;
  if (elo < 2100) return 8;
  if (elo < 2400) return 9;
  return 10;
}

/**
 * Calculate confidence level based on number of matches played
 */
export function calculateConfidence(matchesPlayed: number): number {
  if (matchesPlayed === 0) return 0;
  if (matchesPlayed >= 20) return 1.0;

  // Linear progression from 0.1 (1 match) to 1.0 (20+ matches)
  return Math.min(0.1 + (matchesPlayed - 1) * 0.045, 1.0);
}

/**
 * Create initial unified statistics for new users
 */
export function createInitialUnifiedStats(): UnifiedStats {
  return {
    unifiedEloRating: 1200, // Standard starting ELO
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    publicMatches: 0,
    clubMatches: 0,
    // ⭐ Official Tiebreaker: Set/Game statistics
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
    // 🆕 Public match breakdown by matchType
    publicStats: {
      singles: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        elo: 1200,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      },
      doubles: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        elo: 1200,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      },
      mixed_doubles: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        elo: 1200,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      },
    },
  };
}

/**
 * Create initial club statistics (non-ELO)
 */
export function createInitialClubStats(): ClubStats {
  return {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    joinedAt: new Date().toISOString(),
    // ⭐ Official Tiebreaker: Set/Game statistics
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  };
}

/**
 * Validate ranking update data
 */
export function validateRankingUpdate(data: unknown): boolean {
  const typedData = data as Record<string, unknown>;
  return !!(
    typedData.userId &&
    typedData.context &&
    typedData.result &&
    typeof typedData.opponentElo === 'number' &&
    typedData.matchId
  );
}
