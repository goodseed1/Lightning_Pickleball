/**
 * Unit tests for ELO Calculation Helpers
 */

import { calculateExpectedScore, calculateNewElo } from '../eloHelpers';

describe('eloHelpers', () => {
  describe('calculateExpectedScore', () => {
    test('returns 0.5 for equal ratings', () => {
      expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5);
      expect(calculateExpectedScore(1500, 1500)).toBeCloseTo(0.5);
    });

    test('returns higher probability for higher-rated player', () => {
      // Player rated 1300 vs 1200 opponent should have >50% win probability
      const expectedScore = calculateExpectedScore(1300, 1200);
      expect(expectedScore).toBeGreaterThan(0.5);
      expect(expectedScore).toBeLessThan(1.0);
    });

    test('returns lower probability for lower-rated player', () => {
      // Player rated 1200 vs 1300 opponent should have <50% win probability
      const expectedScore = calculateExpectedScore(1200, 1300);
      expect(expectedScore).toBeLessThan(0.5);
      expect(expectedScore).toBeGreaterThan(0.0);
    });

    test('calculates correct expected score for large rating difference', () => {
      // Player rated 1000 vs 1400 opponent (400 point difference)
      // Expected score should be very low (close to 0.1)
      const expectedScore = calculateExpectedScore(1000, 1400);
      expect(expectedScore).toBeCloseTo(0.091, 2);
    });
  });

  describe('calculateNewElo', () => {
    test('increases rating when winning against equal opponent', () => {
      const result = calculateNewElo(1200, 1200, 1, 16);
      expect(result.newRating).toBeGreaterThan(1200);
      expect(result.eloChange).toBeGreaterThan(0);
      expect(result.expectedScore).toBeCloseTo(0.5);
    });

    test('decreases rating when losing against equal opponent', () => {
      const result = calculateNewElo(1200, 1200, 0, 16);
      expect(result.newRating).toBeLessThan(1200);
      expect(result.eloChange).toBeLessThan(0);
      expect(result.expectedScore).toBeCloseTo(0.5);
    });

    test('small change when high-rated player beats low-rated player (expected result)', () => {
      const result = calculateNewElo(1400, 1200, 1, 16);
      // High-rated player expected to win, so small gain
      expect(result.eloChange).toBeGreaterThan(0);
      expect(result.eloChange).toBeLessThan(10);
    });

    test('large change when low-rated player beats high-rated player (upset)', () => {
      const result = calculateNewElo(1200, 1400, 1, 16);
      // Upset win, large gain
      expect(result.eloChange).toBeGreaterThan(10);
    });

    test('uses correct K-Factor multiplier', () => {
      const k16 = calculateNewElo(1200, 1200, 1, 16);
      const k32 = calculateNewElo(1200, 1200, 1, 32);
      // K=32 should give exactly double the change of K=16
      expect(k32.eloChange).toBe(k16.eloChange * 2);
    });

    test('rounds ELO change to nearest integer', () => {
      const result = calculateNewElo(1200, 1200, 1, 16);
      expect(Number.isInteger(result.eloChange)).toBe(true);
    });
  });
});
