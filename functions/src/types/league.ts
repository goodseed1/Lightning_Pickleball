/**
 * League Types for Cloud Functions
 * Shared type definitions for league-related Cloud Functions
 */

/**
 * Delete League Request
 */
export interface DeleteLeagueRequest {
  leagueId: string;
  reason?: string;
}

/**
 * Delete League Response
 */
export interface DeleteLeagueResponse {
  success: boolean;
  message: string;
  data: {
    deletedMatchesCount: number;
    deletedParticipantsCount: number;
  };
}

/**
 * Add League Participant Request
 */
export interface AddLeagueParticipantRequest {
  leagueId: string;
  userId: string;
  userDisplayName: string;
  userEmail?: string;
  userLtrLevel?: number;
  userNtrpLevel?: number; // Legacy field for backward compatibility
  userProfileImage?: string;
}

/**
 * Add League Participant Response
 */
export interface AddLeagueParticipantResponse {
  success: boolean;
  message: string;
  data?: {
    participantId: string;
  };
}

/**
 * Complete League Request
 */
export interface CompleteLeagueRequest {
  leagueId: string;
}

/**
 * Complete League Response
 */
export interface CompleteLeagueResponse {
  success: boolean;
  message: string;
  data: {
    winner: {
      playerId: string;
      playerName: string;
      finalPoints: number;
      finalRecord: string;
    };
    runnerUp?: {
      playerId: string;
      playerName: string;
      finalPoints: number;
      finalRecord: string;
    };
  };
}
