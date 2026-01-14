/**
 * 🏆 Tournament Statistics Type Definitions
 *
 * Clear, unambiguous type definitions for tournament statistics
 * to prevent field name confusion and ensure data consistency.
 *
 * IMPORTANT: This replaces the confusing legacy field names:
 * - OLD: 'wins' (ambiguous - tournament wins or match wins?)
 * - NEW: 'championships' (clear - tournament 1st place finishes)
 * - OLD: 'participations' (ambiguous - tournaments or matches?)
 * - NEW: 'tournamentsPlayed' (clear - number of tournaments entered)
 */

/**
 * Tournament Statistics Interface
 *
 * Represents a user's tournament performance statistics within a club.
 * Stored in: users/{userId}/clubMemberships/{clubId}/clubStats/tournamentStats
 */
export interface TournamentStats {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏆 TOURNAMENT PLACEMENT STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Number of tournament championships (1st place finishes)
   * @example User won 5 different tournaments → championships: 5
   */
  championships: number;

  /**
   * Number of tournament runner-up finishes (2nd place)
   * @example User finished 2nd in 3 tournaments → runnerUps: 3
   */
  runnerUps: number;

  /**
   * Number of tournament semi-final appearances (3rd-4th place)
   * @example User reached semi-finals 7 times → semiFinals: 7
   */
  semiFinals: number;

  /**
   * Best tournament finish ever achieved
   * @example Best finish is champion → bestFinish: 1
   * @example Best finish is runner-up → bestFinish: 2
   * @example Never participated → bestFinish: null
   */
  bestFinish: number | null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎾 MATCH STATISTICS (within tournaments)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Total number of tournament matches WON
   * @example Won 31 matches across all tournaments → matchWins: 31
   */
  matchWins: number;

  /**
   * Total number of tournament matches LOST
   * @example Lost 6 matches across all tournaments → matchLosses: 6
   */
  matchLosses: number;

  /**
   * Total number of tournament matches played
   * Should always equal: matchWins + matchLosses
   * @example 31 wins + 6 losses = 37 total → totalMatches: 37
   */
  totalMatches: number;

  /**
   * Win rate percentage in tournament matches
   * Calculated as: (matchWins / totalMatches) * 100
   * @example 31 wins out of 37 matches → winRate: 83.8
   */
  winRate: number;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 TOURNAMENT PARTICIPATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Number of tournaments entered/participated in
   * @example Joined 12 different tournaments → tournamentsPlayed: 12
   */
  tournamentsPlayed: number;
}

/**
 * Legacy Tournament Stats Interface (for migration)
 *
 * DEPRECATED: This represents the OLD, confusing field names.
 * Use TournamentStats interface instead.
 */
export interface LegacyTournamentStats {
  /** @deprecated Use 'championships' instead */
  wins?: number;

  /** @deprecated Use 'matchWins' instead */
  tournamentWins?: number;

  /** @deprecated Use 'matchLosses' instead */
  tournamentLosses?: number;

  /** @deprecated Use 'tournamentsPlayed' instead */
  participations?: number;

  runnerUps?: number;
  semiFinals?: number;
  bestFinish?: number | null;
  totalMatches?: number;
}

/**
 * Field Mapping for Migration
 *
 * Maps legacy field names to new, unambiguous names
 */
export const TOURNAMENT_STATS_FIELD_MAP = {
  // Legacy → New
  wins: 'championships', // Tournament 1st place finishes
  tournamentWins: 'matchWins', // Match wins in tournaments
  tournamentLosses: 'matchLosses', // Match losses in tournaments
  participations: 'tournamentsPlayed', // Number of tournaments joined

  // Unchanged
  runnerUps: 'runnerUps',
  semiFinals: 'semiFinals',
  bestFinish: 'bestFinish',
  totalMatches: 'totalMatches',
  winRate: 'winRate',
} as const;

/**
 * Convert legacy stats to new format
 */
export function migrateTournamentStats(legacy: LegacyTournamentStats): TournamentStats {
  return {
    // Tournament placements
    championships: legacy.wins || 0,
    runnerUps: legacy.runnerUps || 0,
    semiFinals: legacy.semiFinals || 0,
    bestFinish: legacy.bestFinish || null,

    // Match statistics
    matchWins: legacy.tournamentWins || 0,
    matchLosses: legacy.tournamentLosses || 0,
    totalMatches: legacy.totalMatches || 0,
    winRate: legacy.totalMatches ? ((legacy.tournamentWins || 0) / legacy.totalMatches) * 100 : 0,

    // Participation
    tournamentsPlayed: legacy.participations || 0,
  };
}

/**
 * Validate tournament stats data consistency
 */
export function validateTournamentStats(stats: TournamentStats): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Rule 1: matchWins + matchLosses should equal totalMatches
  const calculatedTotal = stats.matchWins + stats.matchLosses;
  if (calculatedTotal !== stats.totalMatches) {
    errors.push(
      `Total matches mismatch: ${stats.matchWins} wins + ${stats.matchLosses} losses = ${calculatedTotal}, but totalMatches is ${stats.totalMatches}`
    );
  }

  // Rule 2: championships + runnerUps + semiFinals should not exceed tournamentsPlayed
  const totalPlacements = stats.championships + stats.runnerUps + stats.semiFinals;
  if (totalPlacements > stats.tournamentsPlayed) {
    errors.push(
      `Placement count (${totalPlacements}) exceeds tournaments played (${stats.tournamentsPlayed})`
    );
  }

  // Rule 3: If championships > 0, bestFinish should be 1
  if (stats.championships > 0 && stats.bestFinish !== 1) {
    errors.push(
      `User has ${stats.championships} championships but bestFinish is ${stats.bestFinish} (should be 1)`
    );
  }

  // Rule 4: If runnerUps > 0 and no championships, bestFinish should be 2
  if (stats.championships === 0 && stats.runnerUps > 0 && stats.bestFinish !== 2) {
    errors.push(
      `User has ${stats.runnerUps} runner-up finishes but bestFinish is ${stats.bestFinish} (should be 2)`
    );
  }

  // Rule 5: Win rate should match calculated value
  const calculatedWinRate =
    stats.totalMatches > 0 ? (stats.matchWins / stats.totalMatches) * 100 : 0;
  if (Math.abs(calculatedWinRate - stats.winRate) > 0.1) {
    errors.push(
      `Win rate mismatch: stored ${stats.winRate}% but calculated ${calculatedWinRate.toFixed(1)}%`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create empty tournament stats (for new users)
 */
export function createEmptyTournamentStats(): TournamentStats {
  return {
    championships: 0,
    runnerUps: 0,
    semiFinals: 0,
    bestFinish: null,
    matchWins: 0,
    matchLosses: 0,
    totalMatches: 0,
    winRate: 0,
    tournamentsPlayed: 0,
  };
}

/**
 * Format best finish for display using i18n
 * @param bestFinish - Best finish position (null if none)
 * @param t - i18n translation function
 * @returns Formatted best finish string
 */
export function formatBestFinish(
  bestFinish: number | null,
  t?: (key: string, params?: Record<string, string | number>) => string
): string {
  if (bestFinish === null || bestFinish === undefined) {
    return t ? t('tournamentDetail.bestFinish.none') : 'None';
  }

  if (bestFinish === 1) {
    return t ? t('tournamentDetail.bestFinish.champion') : '🥇 Champion';
  }

  if (bestFinish === 2) {
    return t ? t('tournamentDetail.bestFinish.runnerUp') : '🥈 Runner-up';
  }

  if (bestFinish <= 4) {
    return t ? t('tournamentDetail.bestFinish.semiFinal') : '🥉 Semi-finalist';
  }

  return t
    ? t('tournamentDetail.bestFinish.nthPlace', { position: bestFinish })
    : `${bestFinish}th`;
}
