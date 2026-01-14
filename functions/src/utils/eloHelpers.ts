/**
 * 🧮 Common ELO Calculation Helpers
 *
 * Shared by both Club ELO and Global ELO systems
 *
 * These utility functions implement the standard ELO rating calculation
 * formulas used across all Lightning Tennis rating systems.
 */

/**
 * Calculates expected score (win probability) using ELO formula
 *
 * Standard ELO formula: 1 / (1 + 10^((Rb - Ra) / 400))
 *
 * @param playerRating - Player's current ELO rating
 * @param opponentRating - Opponent's current ELO rating
 * @returns Expected score between 0 and 1
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  const ratingDifference = opponentRating - playerRating;
  return 1 / (1 + Math.pow(10, ratingDifference / 400));
}

/**
 * Calculates new ELO rating after a match
 *
 * New Rating = Old Rating + K × (Actual Score - Expected Score)
 *
 * @param currentRating - Player's current ELO
 * @param opponentRating - Opponent's current ELO
 * @param actualScore - 1 for win, 0 for loss
 * @param kFactor - K-Factor (16, 24, or 32)
 * @returns Object with newRating, eloChange, expectedScore
 */
export function calculateNewElo(
  currentRating: number,
  opponentRating: number,
  actualScore: number,
  kFactor: number
): {
  newRating: number;
  eloChange: number;
  expectedScore: number;
} {
  const expectedScore = calculateExpectedScore(currentRating, opponentRating);
  const eloChange = Math.round(kFactor * (actualScore - expectedScore));
  const newRating = currentRating + eloChange;

  return {
    newRating,
    eloChange,
    expectedScore,
  };
}
