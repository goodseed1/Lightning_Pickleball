/**
 * Tennis Score Utility Functions
 * Utilities for formatting and displaying tennis match scores
 */

import { MatchScore } from '../types/match';

/**
 * Format a match score for display
 * Converts MatchScore object to readable string format like "6-4, 6-2"
 */
export const formatMatchScore = (score: MatchScore): string => {
  if (!score || !score.sets || score.sets.length === 0) {
    return '';
  }

  return score.sets
    .map(set => {
      let setScore = `${set.player1Games}-${set.player2Games}`;

      // Add tiebreak points if they exist
      if (set.player1TiebreakPoints !== undefined && set.player2TiebreakPoints !== undefined) {
        setScore += ` (${set.player1TiebreakPoints}-${set.player2TiebreakPoints})`;
      }

      return setScore;
    })
    .join(', ');
};

/**
 * Get a compact score display for cards
 * Returns abbreviated format suitable for small spaces
 * 🎯 [KIM FIX] Include tiebreak scores in compact format
 */
export const formatCompactScore = (score: MatchScore): string => {
  if (!score || !score.sets || score.sets.length === 0) {
    return '';
  }

  return score.sets
    .map(set => {
      let setScore = `${set.player1Games}-${set.player2Games}`;

      // 🎯 [KIM FIX] Add tiebreak points in compact format (e.g., "6-6(2-10)")
      // Show both players' tiebreak points
      if (set.player1TiebreakPoints !== undefined && set.player2TiebreakPoints !== undefined) {
        setScore += `(${set.player1TiebreakPoints}-${set.player2TiebreakPoints})`;
      }

      return setScore;
    })
    .join(', ');
};

/**
 * Determine if a match score indicates a straight sets win
 */
export const isStraightSetsWin = (score: MatchScore): boolean => {
  if (!score || !score.sets || score.sets.length < 2) {
    return false;
  }

  const winner = score._winner;
  if (!winner) return false;

  return score.sets.every(set => {
    if (winner === 'player1') {
      return set.player1Games > set.player2Games;
    } else {
      return set.player2Games > set.player1Games;
    }
  });
};

/**
 * Get the number of sets won by each player
 */
export const getSetCounts = (score: MatchScore): { player1Sets: number; player2Sets: number } => {
  if (!score || !score.sets) {
    return { player1Sets: 0, player2Sets: 0 };
  }

  let player1Sets = 0;
  let player2Sets = 0;

  score.sets.forEach(set => {
    if (set.player1Games > set.player2Games) {
      player1Sets++;
    } else if (set.player2Games > set.player1Games) {
      player2Sets++;
    }
  });

  return { player1Sets, player2Sets };
};

/**
 * Validate if a match score is complete and valid
 */
export const isValidMatchScore = (score: MatchScore): boolean => {
  if (!score || !score.sets || score.sets.length === 0) {
    return false;
  }

  // Check if match is marked as complete
  if (!score.isComplete) {
    return false;
  }

  // Validate each set
  for (const set of score.sets) {
    if (set.player1Games < 0 || set.player2Games < 0) {
      return false;
    }

    // Basic tennis scoring validation
    const maxGames = Math.max(set.player1Games, set.player2Games);
    const minGames = Math.min(set.player1Games, set.player2Games);

    // Invalid if both players have more than 7 games
    if (maxGames > 7) {
      return false;
    }

    // Invalid if winner doesn't have at least 6 games or proper margin
    if (maxGames < 6) {
      return false;
    }

    // Check for valid margins (2-game lead or tiebreak)
    if (maxGames === 6 && minGames > 4) {
      return false;
    }

    if (maxGames === 7 && minGames !== 5 && minGames !== 6) {
      return false;
    }
  }

  return true;
};
