/**
 * 🌉 [HEIMDALL] Tournament Validation Utilities
 * Server-side validation functions for tournament operations
 *
 * Phase 1: Server-Side Migration
 * Provides reusable validation logic for Cloud Functions
 */

import * as admin from 'firebase-admin';
import { TournamentStatus } from '../types/tournament';
import {
  isValidStateTransition as _isValidStateTransition,
  getValidNextStates as _getValidNextStates,
  VALID_STATE_TRANSITIONS as _VALID_STATE_TRANSITIONS,
} from './stateMachine';

const db = admin.firestore();

// ============================================================================
// Club Membership & Permission Validation
// ============================================================================

/**
 * Verify user is club member with specific role
 *
 * @param userId - User ID to check
 * @param clubId - Club ID to check membership
 * @param requiredRoles - Optional list of required roles (e.g., ['admin', 'owner', 'manager'])
 * @returns Validation result with role info
 */
export async function verifyClubMembership(
  userId: string,
  clubId: string,
  requiredRoles?: string[]
): Promise<{ isValid: boolean; role?: string; error?: string }> {
  try {
    // Use clubMembers flat collection (matches client data structure)
    const membershipId = `${clubId}_${userId}`;
    const membershipRef = db.doc(`clubMembers/${membershipId}`);
    const membershipDoc = await membershipRef.get();

    if (!membershipDoc.exists) {
      return {
        isValid: false,
        error: 'You are not a member of this club',
      };
    }

    const membershipData = membershipDoc.data();
    const role = membershipData?.role;

    // Check if member has required role
    if (requiredRoles && requiredRoles.length > 0) {
      if (!role || !requiredRoles.includes(role)) {
        return {
          isValid: false,
          role,
          error: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}. Your role: ${role || 'none'}`,
        };
      }
    }

    return {
      isValid: true,
      role,
    };
  } catch (error) {
    console.error('Error verifying club membership:', error);
    return {
      isValid: false,
      error: 'Failed to verify club membership',
    };
  }
}

/**
 * Verify club exists and is active
 *
 * @param clubId - Club ID to verify
 * @returns Validation result
 */
export async function verifyClubExists(
  clubId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const clubDoc = await db.collection('tennis_clubs').doc(clubId).get();

    if (!clubDoc.exists) {
      return {
        isValid: false,
        error: 'Club not found',
      };
    }

    const clubData = clubDoc.data();

    // Check if club is active (optional - depends on your data model)
    if (clubData?.status === 'inactive' || clubData?.status === 'suspended') {
      return {
        isValid: false,
        error: 'This club is no longer active',
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    console.error('Error verifying club exists:', error);
    return {
      isValid: false,
      error: 'Failed to verify club',
    };
  }
}

// ============================================================================
// Tournament Date Validation
// ============================================================================

/**
 * Validate tournament dates
 *
 * Rules:
 * - Start date must be in the future
 * - End date must be after start date
 * - Registration deadline must be before start date
 *
 * @param startDate - Tournament start date
 * @param endDate - Tournament end date
 * @param registrationDeadline - Registration deadline
 * @returns Validation result
 */
export function validateTournamentDates(
  startDate: Date,
  endDate: Date,
  registrationDeadline: Date
): { isValid: boolean; error?: string } {
  const now = new Date();

  // Start date must be in the future
  if (startDate <= now) {
    return {
      isValid: false,
      error: 'Tournament start date must be in the future',
    };
  }

  // End date must be after start date
  if (endDate <= startDate) {
    return {
      isValid: false,
      error: 'Tournament end date must be after start date',
    };
  }

  // Registration deadline must be before start date
  if (registrationDeadline >= startDate) {
    return {
      isValid: false,
      error: 'Registration deadline must be before tournament start date',
    };
  }

  // Registration deadline should be in the future (optional, but makes sense)
  if (registrationDeadline <= now) {
    return {
      isValid: false,
      error: 'Registration deadline must be in the future',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validate draw date (optional date for bracket generation)
 *
 * @param drawDate - Draw date
 * @param registrationDeadline - Registration deadline
 * @param startDate - Tournament start date
 * @returns Validation result
 */
export function validateDrawDate(
  drawDate: Date,
  registrationDeadline: Date,
  startDate: Date
): { isValid: boolean; error?: string } {
  // Draw date should be after registration deadline
  if (drawDate <= registrationDeadline) {
    return {
      isValid: false,
      error: 'Draw date must be after registration deadline',
    };
  }

  // Draw date should be before tournament start
  if (drawDate >= startDate) {
    return {
      isValid: false,
      error: 'Draw date must be before tournament start date',
    };
  }

  return {
    isValid: true,
  };
}

// ============================================================================
// Tournament Settings Validation
// ============================================================================

/**
 * Validate tournament participant settings
 *
 * @param minParticipants - Minimum participants
 * @param maxParticipants - Maximum participants
 * @returns Validation result
 */
export function validateParticipantSettings(
  minParticipants: number,
  maxParticipants: number
): { isValid: boolean; error?: string } {
  // Min must be at least 2
  if (minParticipants < 2) {
    return {
      isValid: false,
      error: 'Minimum participants must be at least 2',
    };
  }

  // Max must be greater than or equal to min
  if (maxParticipants < minParticipants) {
    return {
      isValid: false,
      error: 'Maximum participants cannot be less than minimum participants',
    };
  }

  // Reasonable upper limit (optional)
  if (maxParticipants > 256) {
    return {
      isValid: false,
      error: 'Maximum participants cannot exceed 256',
    };
  }

  return {
    isValid: true,
  };
}

// ============================================================================
// Tournament State Transition Validation
// ============================================================================

/**
 * Re-export state machine utilities from stateMachine.ts
 * Note: State machine logic has been moved to its own file for better separation of concerns
 */

export const VALID_STATE_TRANSITIONS = _VALID_STATE_TRANSITIONS;
export const isValidStateTransition = _isValidStateTransition;
export const getValidNextStates = _getValidNextStates;

// ============================================================================
// Tournament Business Logic Validation
// ============================================================================

/**
 * Validate tournament can start
 * (Used when transitioning to 'in_progress')
 *
 * @param participantCount - Number of registered participants
 * @param minParticipants - Minimum required participants
 * @returns Validation result
 */
export function validateCanStartTournament(
  participantCount: number,
  minParticipants: number
): { isValid: boolean; error?: string } {
  if (participantCount < minParticipants) {
    return {
      isValid: false,
      error: `Cannot start tournament with ${participantCount} participants. Minimum required: ${minParticipants}`,
    };
  }

  if (participantCount === 0) {
    return {
      isValid: false,
      error: 'Cannot start tournament with 0 participants',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validate tournament can accept registrations
 * (Used when user tries to register)
 *
 * @param status - Current tournament status
 * @param participantCount - Current number of participants
 * @param maxParticipants - Maximum allowed participants
 * @returns Validation result
 */
export function validateCanRegister(
  status: TournamentStatus,
  participantCount: number,
  maxParticipants: number
): { isValid: boolean; error?: string } {
  // Tournament must be in registration status
  if (status !== 'registration') {
    return {
      isValid: false,
      error: `Tournament is not accepting registrations (current status: ${status})`,
    };
  }

  // Check if tournament is full
  if (participantCount >= maxParticipants) {
    return {
      isValid: false,
      error: 'Tournament is full',
    };
  }

  return {
    isValid: true,
  };
}

// ============================================================================
// Bracket Calculation Utilities
// ============================================================================

/**
 * Calculate total rounds for single elimination tournament
 *
 * @param maxParticipants - Maximum number of participants
 * @returns Number of rounds (e.g., 8 participants = 3 rounds)
 */
export function calculateTotalRounds(maxParticipants: number): number {
  if (maxParticipants <= 1) {
    return 0;
  }
  return Math.ceil(Math.log2(maxParticipants));
}

/**
 * Calculate number of matches in a single elimination bracket
 *
 * @param participantCount - Number of participants
 * @returns Total number of matches
 */
export function calculateTotalMatches(participantCount: number): number {
  if (participantCount <= 1) {
    return 0;
  }
  // In single elimination, total matches = participants - 1
  return participantCount - 1;
}

/**
 * Check if participant count requires byes
 *
 * @param participantCount - Number of participants
 * @returns True if byes are needed (not a power of 2)
 */
export function requiresByes(participantCount: number): boolean {
  // Check if participant count is a power of 2
  return participantCount > 0 && (participantCount & (participantCount - 1)) !== 0;
}

/**
 * Calculate number of byes needed
 *
 * @param participantCount - Number of participants
 * @returns Number of byes needed
 */
export function calculateByesNeeded(participantCount: number): number {
  if (participantCount <= 0) {
    return 0;
  }

  // Find next power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(participantCount)));

  // Byes needed = next power of 2 - participant count
  return nextPowerOf2 - participantCount;
}
