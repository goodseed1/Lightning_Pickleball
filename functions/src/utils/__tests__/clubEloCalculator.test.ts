/**
 * 🧪 Unit Tests for Club ELO Calculator
 *
 * Tests the corrected K-Factor policy implementation
 */

import { determineKFactor } from '../clubEloCalculator';
import { calculateExpectedScore, calculateNewElo } from '../eloHelpers';

// ============================================================================
// determineKFactor Tests
// ============================================================================

describe('determineKFactor', () => {
  describe('League matches', () => {
    test('returns 16 for new player in league match', () => {
      expect(determineKFactor(0, 'league')).toBe(16);
      expect(determineKFactor(5, 'league')).toBe(16);
      expect(determineKFactor(9, 'league')).toBe(16);
    });

    test('returns 16 for established player in league match', () => {
      expect(determineKFactor(10, 'league')).toBe(16);
      expect(determineKFactor(20, 'league')).toBe(16);
      expect(determineKFactor(50, 'league')).toBe(16);
    });
  });

  describe('Tournament matches', () => {
    test('returns 32 for new player in tournament (< 10 matches)', () => {
      expect(determineKFactor(0, 'tournament')).toBe(32);
      expect(determineKFactor(5, 'tournament')).toBe(32);
      expect(determineKFactor(9, 'tournament')).toBe(32);
    });

    test('returns 24 for established player in tournament (>= 10 matches)', () => {
      expect(determineKFactor(10, 'tournament')).toBe(24);
      expect(determineKFactor(20, 'tournament')).toBe(24);
      expect(determineKFactor(50, 'tournament')).toBe(24);
    });
  });

  describe('High Risk, High Return principle', () => {
    test('tournament K-Factor is higher than league K-Factor', () => {
      const leagueK = determineKFactor(15, 'league');
      const tournamentK = determineKFactor(15, 'tournament');

      expect(tournamentK).toBeGreaterThan(leagueK);
      expect(tournamentK).toBe(24);
      expect(leagueK).toBe(16);
    });
  });
});

// ============================================================================
// calculateExpectedScore Tests
// ============================================================================

describe('calculateExpectedScore', () => {
  test('returns 0.5 for equal ratings', () => {
    const result = calculateExpectedScore(1200, 1200);
    expect(result).toBeCloseTo(0.5, 2);
  });

  test('returns > 0.5 for higher rated player', () => {
    const result = calculateExpectedScore(1400, 1200);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeCloseTo(0.76, 2);
  });

  test('returns < 0.5 for lower rated player', () => {
    const result = calculateExpectedScore(1200, 1400);
    expect(result).toBeLessThan(0.5);
    expect(result).toBeCloseTo(0.24, 2);
  });

  test('expected score is symmetric', () => {
    const player1Expected = calculateExpectedScore(1200, 1400);
    const player2Expected = calculateExpectedScore(1400, 1200);

    expect(player1Expected + player2Expected).toBeCloseTo(1.0, 5);
  });

  test('higher rating difference = more extreme probability', () => {
    const small_diff = calculateExpectedScore(1200, 1250);
    const large_diff = calculateExpectedScore(1200, 1400);

    expect(small_diff).toBeGreaterThan(large_diff);
    expect(small_diff).toBeCloseTo(0.43, 2);
    expect(large_diff).toBeCloseTo(0.24, 2);
  });
});

// ============================================================================
// calculateNewElo Tests
// ============================================================================

describe('calculateNewElo', () => {
  describe('Upset victories (lower rated wins)', () => {
    test('calculates correct ELO change for upset victory in tournament', () => {
      // Lower rated player (1200) defeats higher rated player (1400)
      // K-Factor = 24 (tournament, established player)
      const result = calculateNewElo(1200, 1400, 1, 24);

      expect(result.expectedScore).toBeCloseTo(0.24, 2);
      expect(result.eloChange).toBeCloseTo(18, 0); // 24 * (1 - 0.24) ≈ 18
      expect(result.newRating).toBe(1218);
    });

    test('higher K-Factor amplifies upset victory', () => {
      // Same scenario with K=32 (new player)
      const resultK32 = calculateNewElo(1200, 1400, 1, 32);
      const resultK24 = calculateNewElo(1200, 1400, 1, 24);

      expect(resultK32.eloChange).toBeGreaterThan(resultK24.eloChange);
      expect(resultK32.eloChange).toBeCloseTo(24, 0); // 32 * (1 - 0.24) ≈ 24
      expect(resultK24.eloChange).toBeCloseTo(18, 0);
    });
  });

  describe('Expected wins (higher rated wins)', () => {
    test('calculates correct ELO change for expected win', () => {
      // Higher rated player (1400) defeats lower rated player (1200)
      // K-Factor = 24
      const result = calculateNewElo(1400, 1200, 1, 24);

      expect(result.expectedScore).toBeCloseTo(0.76, 2);
      expect(result.eloChange).toBeCloseTo(6, 0); // 24 * (1 - 0.76) ≈ 6
      expect(result.newRating).toBe(1406);
    });

    test('expected win yields smaller gain than upset win', () => {
      const expectedWin = calculateNewElo(1400, 1200, 1, 24);
      const upsetWin = calculateNewElo(1200, 1400, 1, 24);

      expect(expectedWin.eloChange).toBeLessThan(upsetWin.eloChange);
    });
  });

  describe('Losses', () => {
    test('subtracts points for expected loss', () => {
      // Lower rated player (1200) loses to higher rated player (1400)
      const result = calculateNewElo(1200, 1400, 0, 24);

      expect(result.eloChange).toBeLessThan(0);
      expect(result.eloChange).toBeCloseTo(-6, 0); // 24 * (0 - 0.24) ≈ -6
      expect(result.newRating).toBe(1194);
    });

    test('subtracts more points for upset loss', () => {
      // Higher rated player (1400) loses to lower rated player (1200)
      const result = calculateNewElo(1400, 1200, 0, 24);

      expect(result.eloChange).toBeLessThan(0);
      expect(result.eloChange).toBeCloseTo(-18, 0); // 24 * (0 - 0.76) ≈ -18
      expect(result.newRating).toBe(1382);
    });
  });

  describe('Zero-sum property', () => {
    test('winner gains equal opponent loss (same K-Factor)', () => {
      const winnerResult = calculateNewElo(1200, 1400, 1, 24);
      const loserResult = calculateNewElo(1400, 1200, 0, 24);

      expect(winnerResult.eloChange).toBe(-loserResult.eloChange);
    });
  });

  describe('K-Factor impact', () => {
    test('higher K-Factor causes larger rating changes', () => {
      const k16 = calculateNewElo(1200, 1400, 1, 16);
      const k24 = calculateNewElo(1200, 1400, 1, 24);
      const k32 = calculateNewElo(1200, 1400, 1, 32);

      expect(k16.eloChange).toBeLessThan(k24.eloChange);
      expect(k24.eloChange).toBeLessThan(k32.eloChange);

      expect(k16.eloChange).toBeCloseTo(12, 0); // 16 * 0.76
      expect(k24.eloChange).toBeCloseTo(18, 0); // 24 * 0.76
      expect(k32.eloChange).toBeCloseTo(24, 0); // 32 * 0.76
    });
  });

  describe('Edge cases', () => {
    test('equal ratings with win', () => {
      const result = calculateNewElo(1200, 1200, 1, 24);

      expect(result.expectedScore).toBeCloseTo(0.5, 2);
      expect(result.eloChange).toBeCloseTo(12, 0); // 24 * (1 - 0.5)
      expect(result.newRating).toBe(1212);
    });

    test('equal ratings with loss', () => {
      const result = calculateNewElo(1200, 1200, 0, 24);

      expect(result.expectedScore).toBeCloseTo(0.5, 2);
      expect(result.eloChange).toBeCloseTo(-12, 0); // 24 * (0 - 0.5)
      expect(result.newRating).toBe(1188);
    });

    test('large rating difference', () => {
      const result = calculateNewElo(1000, 1600, 1, 24);

      expect(result.expectedScore).toBeLessThan(0.1);
      expect(result.eloChange).toBeGreaterThan(20); // Huge upset!
    });
  });
});

// ============================================================================
// Integration Scenarios
// ============================================================================

describe('Integration scenarios', () => {
  describe('Tournament final (established players)', () => {
    test('calculates tournament final correctly', () => {
      const player1Elo = 1450;
      const player2Elo = 1650;
      const k = 24; // Tournament, established

      const winner = calculateNewElo(player1Elo, player2Elo, 1, k);
      const loser = calculateNewElo(player2Elo, player1Elo, 0, k);

      // Player 1 wins upset
      expect(winner.eloChange).toBeCloseTo(18, 0);
      expect(loser.eloChange).toBeCloseTo(-18, 0);

      expect(winner.newRating).toBe(1468);
      expect(loser.newRating).toBe(1632);
    });
  });

  describe('League match (regular season)', () => {
    test('calculates league match correctly', () => {
      const player1Elo = 1450;
      const player2Elo = 1650;
      const k = 16; // League

      const winner = calculateNewElo(player1Elo, player2Elo, 1, k);
      const loser = calculateNewElo(player2Elo, player1Elo, 0, k);

      // Same upset, but lower K-Factor
      expect(winner.eloChange).toBeCloseTo(12, 0);
      expect(loser.eloChange).toBeCloseTo(-12, 0);

      expect(winner.newRating).toBe(1462);
      expect(loser.newRating).toBe(1638);
    });
  });

  describe('New player first tournament', () => {
    test('new player with high K-Factor', () => {
      const newPlayerElo = 1200; // Default
      const veteranElo = 1500;
      const k = 32; // New player, tournament

      const upset = calculateNewElo(newPlayerElo, veteranElo, 1, k);

      // Huge gain for upset victory
      expect(upset.eloChange).toBeGreaterThan(20);
      expect(upset.eloChange).toBeCloseTo(27, 0); // 32 * (1 - 0.15)
    });
  });
});
