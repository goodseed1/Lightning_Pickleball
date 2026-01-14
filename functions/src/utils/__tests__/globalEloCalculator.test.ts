/**
 * Unit tests for Global ELO Calculator
 */

import { determineGlobalKFactor } from '../globalEloCalculator';

describe('globalEloCalculator', () => {
  describe('determineGlobalKFactor', () => {
    test('returns 32 for new player (< 10 matches)', () => {
      expect(determineGlobalKFactor(0)).toBe(32);
      expect(determineGlobalKFactor(1)).toBe(32);
      expect(determineGlobalKFactor(5)).toBe(32);
      expect(determineGlobalKFactor(9)).toBe(32);
    });

    test('returns 16 for established player (>= 10 matches)', () => {
      expect(determineGlobalKFactor(10)).toBe(16);
      expect(determineGlobalKFactor(20)).toBe(16);
      expect(determineGlobalKFactor(50)).toBe(16);
      expect(determineGlobalKFactor(100)).toBe(16);
    });
  });

  // Integration tests can be added later when public match system is implemented
});
