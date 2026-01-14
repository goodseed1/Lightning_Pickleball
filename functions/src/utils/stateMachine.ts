/**
 * 🌉 [HEIMDALL] Tournament State Machine
 * Manages valid tournament status transitions
 *
 * Phase 1: Server-Side Migration
 * Defines state transition rules and provides utilities for state management
 */

import { TournamentStatus } from '../types/tournament';

// ============================================================================
// State Transition Rules
// ============================================================================

/**
 * Valid State Transitions for Tournaments
 *
 * State Machine Definition:
 * - draft → registration | cancelled
 * - registration → bpaddle_generation | cancelled
 * - bpaddle_generation → in_progress | registration (allow going back) | cancelled
 * - in_progress → completed | cancelled
 * - completed → (terminal state, no transitions)
 * - cancelled → (terminal state, no transitions)
 *
 * Visual Representation:
 *
 *   draft
 *     ├─→ registration
 *     │     ├─→ bpaddle_generation
 *     │     │     ├─→ in_progress
 *     │     │     │     └─→ completed ✓
 *     │     │     ├─→ registration (rollback)
 *     │     │     └─→ cancelled ✗
 *     │     └─→ cancelled ✗
 *     └─→ cancelled ✗
 */
export const VALID_STATE_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  draft: ['registration', 'cancelled'],
  registration: ['bpaddle_generation', 'cancelled'],
  bpaddle_generation: ['in_progress', 'registration', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

// ============================================================================
// State Transition Validation
// ============================================================================

/**
 * Check if a state transition is valid
 *
 * @param currentStatus - Current tournament status
 * @param newStatus - New tournament status
 * @returns True if transition is valid, false otherwise
 *
 * @example
 * isValidStateTransition('draft', 'registration') // true
 * isValidStateTransition('completed', 'in_progress') // false
 */
export function isValidStateTransition(
  currentStatus: TournamentStatus,
  newStatus: TournamentStatus
): boolean {
  const validTransitions = VALID_STATE_TRANSITIONS[currentStatus];
  return validTransitions?.includes(newStatus) || false;
}

/**
 * Get list of valid next states from current state
 *
 * @param currentStatus - Current tournament status
 * @returns Array of valid next states
 *
 * @example
 * getValidNextStates('registration') // ['bpaddle_generation', 'cancelled']
 * getValidNextStates('completed') // []
 */
export function getValidNextStates(currentStatus: TournamentStatus): TournamentStatus[] {
  return VALID_STATE_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status is a terminal state (no further transitions possible)
 *
 * @param status - Tournament status to check
 * @returns True if terminal state, false otherwise
 *
 * @example
 * isTerminalState('completed') // true
 * isTerminalState('cancelled') // true
 * isTerminalState('in_progress') // false
 */
export function isTerminalState(status: TournamentStatus): boolean {
  const validTransitions = VALID_STATE_TRANSITIONS[status];
  return validTransitions.length === 0;
}

/**
 * Get user-friendly status description in Korean
 *
 * @param status - Tournament status
 * @returns Korean description
 */
export function getStatusDescription(status: TournamentStatus): string {
  const descriptions: Record<TournamentStatus, string> = {
    draft: '준비 중',
    registration: '참가 신청 중',
    bpaddle_generation: '대진표 생성 중',
    in_progress: '진행 중',
    completed: '완료됨',
    cancelled: '취소됨',
  };

  return descriptions[status] || '알 수 없음';
}

// ============================================================================
// Advanced State Transition Utilities
// ============================================================================

/**
 * Validate state transition with detailed error message
 *
 * @param currentStatus - Current tournament status
 * @param newStatus - New tournament status
 * @returns Validation result with error message if invalid
 *
 * @example
 * validateStateTransition('draft', 'registration')
 * // { isValid: true }
 *
 * validateStateTransition('completed', 'in_progress')
 * // { isValid: false, error: 'Cannot transition from completed (완료됨) to in_progress (진행 중)' }
 */
export function validateStateTransition(
  currentStatus: TournamentStatus,
  newStatus: TournamentStatus
): { isValid: boolean; error?: string } {
  // Check if same status (no-op, but valid)
  if (currentStatus === newStatus) {
    return {
      isValid: false,
      error: `Tournament is already in status: ${getStatusDescription(newStatus)}`,
    };
  }

  // Check if valid transition
  if (!isValidStateTransition(currentStatus, newStatus)) {
    const validNext = getValidNextStates(currentStatus);

    if (validNext.length === 0) {
      return {
        isValid: false,
        error: `Cannot transition from ${currentStatus} (${getStatusDescription(currentStatus)}) - terminal state`,
      };
    }

    const validNextDescriptions = validNext
      .map(s => `${s} (${getStatusDescription(s)})`)
      .join(', ');

    return {
      isValid: false,
      error: `Cannot transition from ${currentStatus} (${getStatusDescription(currentStatus)}) to ${newStatus} (${getStatusDescription(newStatus)}). Valid transitions: ${validNextDescriptions}`,
    };
  }

  return { isValid: true };
}

/**
 * Get transition path from one status to another
 * Returns array of statuses representing the path, or null if no path exists
 *
 * @param fromStatus - Starting status
 * @param toStatus - Target status
 * @returns Array of statuses in transition path, or null if impossible
 *
 * @example
 * getTransitionPath('draft', 'completed')
 * // ['draft', 'registration', 'bpaddle_generation', 'in_progress', 'completed']
 *
 * getTransitionPath('completed', 'draft')
 * // null (impossible)
 */
export function getTransitionPath(
  fromStatus: TournamentStatus,
  toStatus: TournamentStatus
): TournamentStatus[] | null {
  // BFS to find shortest path
  const queue: TournamentStatus[][] = [[fromStatus]];
  const visited = new Set<TournamentStatus>([fromStatus]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentStatus = path[path.length - 1];

    // Found target
    if (currentStatus === toStatus) {
      return path;
    }

    // Explore next states
    const nextStates = getValidNextStates(currentStatus);
    for (const nextState of nextStates) {
      if (!visited.has(nextState)) {
        visited.add(nextState);
        queue.push([...path, nextState]);
      }
    }
  }

  // No path found
  return null;
}

/**
 * Check if a status can eventually reach another status
 *
 * @param fromStatus - Starting status
 * @param toStatus - Target status
 * @returns True if target status is reachable from starting status
 *
 * @example
 * canReachStatus('draft', 'completed') // true
 * canReachStatus('completed', 'draft') // false
 */
export function canReachStatus(fromStatus: TournamentStatus, toStatus: TournamentStatus): boolean {
  return getTransitionPath(fromStatus, toStatus) !== null;
}
