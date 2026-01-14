/**
 * 🏛️ PROJECT OLYMPUS - Ranking Utilities
 * Shared utility functions for ELO and LPR conversions
 *
 * @updated 2025-12-30 - NTRP → LPR migration
 */

/**
 * Convert ELO rating to LPR value (1-10 integer scale)
 * Same logic as src/utils/unifiedRankingUtils.ts for consistency
 */
export function convertEloToLtr(elo: number): number {
  if (elo < 1000) return 1; // Bronze
  if (elo < 1100) return 2; // Silver
  if (elo < 1200) return 3; // Gold I
  if (elo < 1300) return 4; // Gold II
  if (elo < 1400) return 5; // Platinum I
  if (elo < 1500) return 6; // Platinum II
  if (elo < 1600) return 7; // Diamond
  if (elo < 1700) return 8; // Master I
  if (elo < 1800) return 9; // Master II
  return 10; // Legend
}

/**
 * @deprecated Use convertEloToLtr instead
 * Legacy function for backward compatibility
 */
export function convertEloToNtrp(elo: number): number {
  return convertEloToLtr(elo);
}
