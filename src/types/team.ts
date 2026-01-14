/**
 * 🏛️ TEAM-FIRST ARCHITECTURE 2.0
 * The Mutual Consent Revolution
 *
 * A partnership is a MUTUAL AGREEMENT, not a designation.
 * This module defines the Team entity as a first-class citizen.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Team Status Lifecycle:
 * 1. 'pending' - Player A invited Player B, awaiting response
 * 2. 'confirmed' - Player B accepted, team is officially formed
 * 3. 'rejected' - Player B declined the invitation
 * 4. 'expired' - Invitation expired (48 hours with no response)
 */
export type TeamStatus = 'pending' | 'confirmed' | 'rejected' | 'expired';

/**
 * Team Member Info
 */
export interface TeamMember {
  userId: string;
  playerName: string;
  email?: string;
  photoURL?: string;
  skillLevel?: string;
}

/**
 * Team Entity - First-class citizen for doubles tournaments AND leagues
 *
 * A team represents a mutually-agreed partnership between two players
 * for a specific tournament or league. Both players must consent before
 * the team can register.
 */
export interface Team {
  id: string;

  // Event association (tournament OR league)
  tournamentId?: string;
  tournamentName?: string; // For display in notifications
  leagueId?: string;
  leagueName?: string; // For display in notifications

  // Common club context (added for easier club filtering)
  clubId?: string;

  // The two team members
  player1: TeamMember;
  player2: TeamMember;

  // Team status
  status: TeamStatus;

  // Invitation metadata
  invitedBy?: string; // userId who sent the invite (player1 or player2)
  invitedAt?: Timestamp;
  respondedAt?: Timestamp; // When player accepted/rejected
  expiresAt?: Timestamp; // Auto-expire after 48 hours

  // Optional team customization
  teamName?: string; // Custom team name (e.g., "Thunder Duo")

  // Audit trail
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Team Invite Request (used when creating a new team)
 */
export interface CreateTeamInviteRequest {
  tournamentId: string;
  tournamentName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
  customTeamName?: string;
}

/**
 * Team Registration Status
 * Used to track if a team has registered for the tournament
 */
export interface TeamRegistrationStatus {
  teamId: string;
  isRegistered: boolean;
  registeredAt?: Timestamp;
  registeredBy?: string; // userId who triggered registration
}

/**
 * Team Invitation Summary (for notification display)
 */
export interface TeamInvitationSummary {
  teamId: string;
  tournamentId: string;
  tournamentName: string;
  inviterName: string;
  inviteeName: string;
  status: TeamStatus;
  invitedAt: Timestamp;
  expiresAt: Timestamp;
  isExpired: boolean;
  hoursRemaining: number;
}

/**
 * User's Teams Overview
 */
export interface UserTeamsOverview {
  pendingInvitesReceived: Team[]; // Invites this user needs to respond to
  pendingInvitesSent: Team[]; // Invites this user sent to others
  confirmedTeams: Team[]; // Teams this user is part of
  expiredTeams: Team[]; // Expired invitations (for history)
}

/**
 * Helper function to generate team display name
 */
export const generateTeamDisplayName = (team: Team): string => {
  if (team.teamName) return team.teamName;
  return `${team.player1.playerName} / ${team.player2.playerName}`;
};

/**
 * Helper function to check if team invite is expired
 */
export const isTeamInviteExpired = (team: Team): boolean => {
  if (team.status !== 'pending' || !team.expiresAt) return false;
  const now = new Date();
  const expiresAt = team.expiresAt.toDate();
  return now > expiresAt;
};

/**
 * Helper function to calculate hours remaining for invite
 */
export const getInviteHoursRemaining = (team: Team): number => {
  if (team.status !== 'pending' || !team.expiresAt) return 0;
  const now = new Date();
  const expiresAt = team.expiresAt.toDate();
  const msRemaining = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));
};

/**
 * Helper function to check if user is part of a team
 */
export const isUserInTeam = (team: Team, userId: string): boolean => {
  return team.player1.userId === userId || team.player2.userId === userId;
};

/**
 * Helper function to get the other team member
 */
export const getTeamPartner = (team: Team, userId: string): TeamMember | null => {
  if (team.player1.userId === userId) return team.player2;
  if (team.player2.userId === userId) return team.player1;
  return null;
};

/**
 * Constants
 */
export const TEAM_INVITE_EXPIRATION_HOURS = 48;
export const TEAM_INVITE_EXPIRATION_MS = TEAM_INVITE_EXPIRATION_HOURS * 60 * 60 * 1000;

/**
 * 🦾 OPERATION: INFORMATION DESK
 * Structured response types for graceful error handling
 */

/**
 * Reasons why a team invitation might fail
 */
export type TeamInviteErrorReason =
  | 'INVITE_ALREADY_PENDING'
  | 'TEAM_ALREADY_CONFIRMED'
  | 'INVITEE_HAS_TEAM'
  | 'INVITER_HAS_TEAM';

/**
 * Successful team invitation result
 */
export interface TeamInviteSuccess {
  success: true;
  teamId: string;
}

/**
 * Failed team invitation result with user-friendly messages
 */
export interface TeamInviteFailure {
  success: false;
  reason: TeamInviteErrorReason;
  message: string; // Korean message for display
  messageEn: string; // English message for display
}

/**
 * Discriminated union for team invitation results
 * Enables graceful error handling without throwing exceptions
 */
export type TeamInviteResult = TeamInviteSuccess | TeamInviteFailure;
