/**
 * 🏹 [HAWKEYE] State Machine Tests
 * Unit tests for tournament state transition logic
 */

import {
  isValidStateTransition,
  getValidNextStates,
  isTerminalState,
  getStatusDescription,
  validateStateTransition,
  getTransitionPath,
  canReachStatus,
} from '../stateMachine';
import { TournamentStatus } from '../../types/tournament';

describe('🌉 [Heimdall] Tournament State Machine', () => {
  // ========================================================================
  // isValidStateTransition Tests
  // ========================================================================

  describe('isValidStateTransition', () => {
    it('should allow valid transitions from draft', () => {
      expect(isValidStateTransition('draft', 'registration')).toBe(true);
      expect(isValidStateTransition('draft', 'cancelled')).toBe(true);
    });

    it('should reject invalid transitions from draft', () => {
      expect(isValidStateTransition('draft', 'in_progress')).toBe(false);
      expect(isValidStateTransition('draft', 'completed')).toBe(false);
      expect(isValidStateTransition('draft', 'bracket_generation')).toBe(false);
    });

    it('should allow valid transitions from registration', () => {
      expect(isValidStateTransition('registration', 'bracket_generation')).toBe(true);
      expect(isValidStateTransition('registration', 'cancelled')).toBe(true);
    });

    it('should allow rollback from bracket_generation to registration', () => {
      expect(isValidStateTransition('bracket_generation', 'registration')).toBe(true);
    });

    it('should allow valid transitions from in_progress', () => {
      expect(isValidStateTransition('in_progress', 'completed')).toBe(true);
      expect(isValidStateTransition('in_progress', 'cancelled')).toBe(true);
    });

    it('should not allow transitions from terminal states', () => {
      expect(isValidStateTransition('completed', 'in_progress')).toBe(false);
      expect(isValidStateTransition('completed', 'draft')).toBe(false);
      expect(isValidStateTransition('cancelled', 'draft')).toBe(false);
      expect(isValidStateTransition('cancelled', 'registration')).toBe(false);
    });
  });

  // ========================================================================
  // getValidNextStates Tests
  // ========================================================================

  describe('getValidNextStates', () => {
    it('should return valid next states for draft', () => {
      const nextStates = getValidNextStates('draft');
      expect(nextStates).toEqual(['registration', 'cancelled']);
    });

    it('should return valid next states for registration', () => {
      const nextStates = getValidNextStates('registration');
      expect(nextStates).toEqual(['bracket_generation', 'cancelled']);
    });

    it('should return empty array for terminal states', () => {
      expect(getValidNextStates('completed')).toEqual([]);
      expect(getValidNextStates('cancelled')).toEqual([]);
    });

    it('should include rollback option for bracket_generation', () => {
      const nextStates = getValidNextStates('bracket_generation');
      expect(nextStates).toContain('registration');
      expect(nextStates).toContain('in_progress');
      expect(nextStates).toContain('cancelled');
    });
  });

  // ========================================================================
  // isTerminalState Tests
  // ========================================================================

  describe('isTerminalState', () => {
    it('should identify completed as terminal', () => {
      expect(isTerminalState('completed')).toBe(true);
    });

    it('should identify cancelled as terminal', () => {
      expect(isTerminalState('cancelled')).toBe(true);
    });

    it('should identify non-terminal states correctly', () => {
      expect(isTerminalState('draft')).toBe(false);
      expect(isTerminalState('registration')).toBe(false);
      expect(isTerminalState('bracket_generation')).toBe(false);
      expect(isTerminalState('in_progress')).toBe(false);
    });
  });

  // ========================================================================
  // getStatusDescription Tests
  // ========================================================================

  describe('getStatusDescription', () => {
    it('should return Korean descriptions for all statuses', () => {
      expect(getStatusDescription('draft')).toBe('준비 중');
      expect(getStatusDescription('registration')).toBe('참가 신청 중');
      expect(getStatusDescription('bracket_generation')).toBe('대진표 생성 중');
      expect(getStatusDescription('in_progress')).toBe('진행 중');
      expect(getStatusDescription('completed')).toBe('완료됨');
      expect(getStatusDescription('cancelled')).toBe('취소됨');
    });
  });

  // ========================================================================
  // validateStateTransition Tests
  // ========================================================================

  describe('validateStateTransition', () => {
    it('should validate valid transitions', () => {
      const result = validateStateTransition('draft', 'registration');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject same status transition', () => {
      const result = validateStateTransition('draft', 'draft');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already in status');
    });

    it('should provide helpful error for invalid transitions', () => {
      const result = validateStateTransition('draft', 'in_progress');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot transition');
      expect(result.error).toContain('Valid transitions');
    });

    it('should indicate terminal state in error message', () => {
      const result = validateStateTransition('completed', 'draft');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('terminal state');
    });
  });

  // ========================================================================
  // getTransitionPath Tests
  // ========================================================================

  describe('getTransitionPath', () => {
    it('should find shortest path from draft to completed', () => {
      const path = getTransitionPath('draft', 'completed');
      expect(path).toEqual([
        'draft',
        'registration',
        'bracket_generation',
        'in_progress',
        'completed',
      ]);
    });

    it('should return null for impossible transitions', () => {
      expect(getTransitionPath('completed', 'draft')).toBeNull();
      expect(getTransitionPath('cancelled', 'in_progress')).toBeNull();
    });

    it('should find path including rollback', () => {
      const path = getTransitionPath('bracket_generation', 'bracket_generation');
      expect(path).not.toBeNull();
    });

    it('should handle same start and end status', () => {
      const path = getTransitionPath('draft', 'draft');
      expect(path).toEqual(['draft']);
    });
  });

  // ========================================================================
  // canReachStatus Tests
  // ========================================================================

  describe('canReachStatus', () => {
    it('should return true for reachable statuses', () => {
      expect(canReachStatus('draft', 'completed')).toBe(true);
      expect(canReachStatus('registration', 'completed')).toBe(true);
      expect(canReachStatus('draft', 'cancelled')).toBe(true);
    });

    it('should return false for unreachable statuses', () => {
      expect(canReachStatus('completed', 'draft')).toBe(false);
      expect(canReachStatus('cancelled', 'registration')).toBe(false);
      expect(canReachStatus('completed', 'in_progress')).toBe(false);
    });

    it('should return true for same status (already reached)', () => {
      expect(canReachStatus('draft', 'draft')).toBe(true);
      expect(canReachStatus('completed', 'completed')).toBe(true);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('State Machine Integration', () => {
    it('should maintain consistent state machine behavior', () => {
      // Test the complete lifecycle
      const lifecycle: TournamentStatus[] = [
        'draft',
        'registration',
        'bracket_generation',
        'in_progress',
        'completed',
      ];

      for (let i = 0; i < lifecycle.length - 1; i++) {
        const current = lifecycle[i];
        const next = lifecycle[i + 1];

        expect(isValidStateTransition(current, next)).toBe(true);
      }
    });

    it('should handle cancellation from any active state', () => {
      const activeStates: TournamentStatus[] = [
        'draft',
        'registration',
        'bracket_generation',
        'in_progress',
      ];

      activeStates.forEach(status => {
        expect(canReachStatus(status, 'cancelled')).toBe(true);
      });
    });

    it('should prevent any transitions from terminal states', () => {
      const terminalStates: TournamentStatus[] = ['completed', 'cancelled'];
      const allStates: TournamentStatus[] = [
        'draft',
        'registration',
        'bracket_generation',
        'in_progress',
        'completed',
        'cancelled',
      ];

      terminalStates.forEach(terminalState => {
        allStates.forEach(targetState => {
          if (terminalState !== targetState) {
            expect(isValidStateTransition(terminalState, targetState)).toBe(false);
          }
        });
      });
    });
  });
});
