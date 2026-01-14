/**
 * 🏛️ TEAM SERVICE - The Mutual Consent Revolution
 *
 * This service manages team formation for doubles tournaments.
 * Core Principle: A partnership is a MUTUAL AGREEMENT, not a designation.
 *
 * Key Operations:
 * - Send team invitations
 * - Accept/reject invitations
 * - Query user's teams
 * - Validate team eligibility
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Team,
  TeamMember,
  CreateTeamInviteRequest,
  UserTeamsOverview,
  TeamInviteResult,
  isTeamInviteExpired,
  TEAM_INVITE_EXPIRATION_MS,
} from '../types/team';
import authService from './authService';
import { createFeedItem } from './feedService';
import { getSkillLevelSmart } from '../utils/skillLevelHelpers';
import i18n from '../i18n';

/**
 * Local interface for user profile from authService.getUserProfile()
 * This avoids modifying type files and prevents merge conflicts
 */
interface UserProfile {
  displayName?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  [key: string]: unknown;
}

class TeamService {
  /**
   * 🦾 Send team invitation
   * Player A invites Player B to form a team for a specific tournament
   *
   * 🦾 OPERATION: INFORMATION DESK
   * Returns structured result instead of throwing errors for business rule violations
   */
  async createTeamInvite(request: CreateTeamInviteRequest): Promise<TeamInviteResult> {
    try {
      console.log('🦾 [TEAM SERVICE] Creating team invite:', request);

      // Validation 1: Check if users already have a team for this tournament
      const existingTeam = await this.findExistingTeam(
        request.inviterId,
        request.inviteeId,
        request.tournamentId
      );

      if (existingTeam) {
        if (existingTeam.status === 'pending') {
          console.log('[TEAM SERVICE] Blocked: Team invitation already pending');
          return {
            success: false,
            reason: 'INVITE_ALREADY_PENDING',
            message: i18n.t('services.team.inviteAlreadyPending'),
            messageEn: 'A team invitation is already pending with this partner.',
          };
        }
        if (existingTeam.status === 'confirmed') {
          console.log('[TEAM SERVICE] Blocked: Team already confirmed');
          return {
            success: false,
            reason: 'TEAM_ALREADY_CONFIRMED',
            message: i18n.t('services.team.teamAlreadyConfirmed'),
            messageEn: 'You already have a confirmed team with this partner.',
          };
        }
      }

      // Validation 2: Check if invitee already has a confirmed team for this tournament
      const inviteeTeam = await this.getUserConfirmedTeamForTournament(
        request.inviteeId,
        request.tournamentId
      );
      if (inviteeTeam) {
        console.log('[TEAM SERVICE] Blocked: Invitee already has a confirmed team');
        return {
          success: false,
          reason: 'INVITEE_HAS_TEAM',
          message: i18n.t('services.team.playerHasTeam'),
          messageEn: 'This player already has a confirmed team for this tournament.',
        };
      }

      // Validation 3: Check if inviter already has a confirmed team for this tournament
      const inviterTeam = await this.getUserConfirmedTeamForTournament(
        request.inviterId,
        request.tournamentId
      );
      if (inviterTeam) {
        console.log('[TEAM SERVICE] Blocked: Inviter already has a confirmed team');
        return {
          success: false,
          reason: 'INVITER_HAS_TEAM',
          message: i18n.t('services.team.inviterAlreadyHasTeam'),
          messageEn: 'You already have a confirmed team for this tournament.',
        };
      }

      // Get full user profiles for team members
      const inviterProfile = (await authService.getUserProfile(
        request.inviterId
      )) as UserProfile | null;
      const inviteeProfile = (await authService.getUserProfile(
        request.inviteeId
      )) as UserProfile | null;

      // Create team members (with smart fallback for skillLevel)
      const player1: TeamMember = {
        userId: request.inviterId,
        playerName: inviterProfile?.displayName || inviterProfile?.name || request.inviterName,
        email: inviterProfile?.email,
        photoURL: inviterProfile?.photoURL,
        ...(getSkillLevelSmart(inviterProfile) && {
          skillLevel: getSkillLevelSmart(inviterProfile),
        }),
      };

      const player2: TeamMember = {
        userId: request.inviteeId,
        playerName: inviteeProfile?.displayName || inviteeProfile?.name || request.inviteeName,
        email: inviteeProfile?.email,
        photoURL: inviteeProfile?.photoURL,
        ...(getSkillLevelSmart(inviteeProfile) && {
          skillLevel: getSkillLevelSmart(inviteeProfile),
        }),
      };

      // Calculate expiration (48 hours from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TEAM_INVITE_EXPIRATION_MS);

      // 🔨 Thor's Nameplate Forge - Generate team name if not provided
      const teamName = request.customTeamName || `${request.inviterName} & ${request.inviteeName}`;

      console.log('🔨 [THOR] Forging team nameplate:', {
        customName: request.customTeamName,
        generatedName: teamName,
        inviter: request.inviterName,
        invitee: request.inviteeName,
      });

      // Create team document
      const teamData: Omit<Team, 'id'> = {
        tournamentId: request.tournamentId,
        tournamentName: request.tournamentName,
        player1,
        player2,
        status: 'pending',
        invitedBy: request.inviterId,
        invitedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        teamName,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const teamsRef = collection(db, 'teams');
      const docRef = await addDoc(teamsRef, teamData);

      console.log('✅ [TEAM SERVICE] Team invite created:', docRef.id);

      // 🔨 THOR'S HERALD will handle notifications and feed items via Cloud Function
      // See: functions/src/triggers/onTeamInviteCreated.js
      // This ensures proper authorization using admin privileges

      return {
        success: true,
        teamId: docRef.id,
      };
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error creating team invite:', error);
      throw error;
    }
  }

  /**
   * ✅ Accept team invitation
   * Player B accepts Player A's invitation, forming an official team
   */
  async acceptTeamInvite(teamId: string, userId: string): Promise<void> {
    try {
      console.log('✅ [TEAM SERVICE] Accepting team invite:', { teamId, userId });

      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Validation 1: Check if user is the invitee
      if (team.player2.userId !== userId) {
        throw new Error('Only the invited player can accept this invitation');
      }

      // Validation 2: Check if invite is pending
      if (team.status !== 'pending') {
        throw new Error(`Cannot accept invitation with status: ${team.status}`);
      }

      // Validation 3: Check if invite is expired
      if (isTeamInviteExpired(team)) {
        // Auto-expire the team
        await this.expireTeam(teamId);
        throw new Error('This invitation has expired');
      }

      // Validation 4: Check if user already has a confirmed team (tournament only)
      // Note: League teams don't have this restriction
      if (team.tournamentId) {
        const existingTeam = await this.getUserConfirmedTeamForTournament(
          userId,
          team.tournamentId
        );
        if (existingTeam && existingTeam.id !== teamId) {
          throw new Error('You already have a confirmed team for this tournament');
        }
      }

      // Update team status to confirmed
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        status: 'confirmed',
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ [TEAM SERVICE] Team confirmed:', teamId);

      // 🔨 THOR'S HERALD: Feed item creation moved to Cloud Function (onTeamStatusChanged.js)
      // This prevents Firestore permissions errors by using admin privileges
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error accepting team invite:', error);
      throw error;
    }
  }

  /**
   * ❌ Reject team invitation
   * Player B declines Player A's invitation
   */
  async rejectTeamInvite(teamId: string, userId: string): Promise<void> {
    try {
      console.log('❌ [TEAM SERVICE] Rejecting team invite:', { teamId, userId });

      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Validation: Check if user is the invitee
      if (team.player2.userId !== userId) {
        throw new Error('Only the invited player can reject this invitation');
      }

      // Validation: Check if invite is pending
      if (team.status !== 'pending') {
        throw new Error(`Cannot reject invitation with status: ${team.status}`);
      }

      // Update team status to rejected
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ [TEAM SERVICE] Team rejected:', teamId);

      // 🔨 THOR'S HERALD: Feed item creation moved to Cloud Function (onTeamStatusChanged.js)
      // This prevents Firestore permissions errors by using admin privileges
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error rejecting team invite:', error);
      throw error;
    }
  }

  /**
   * 🚫 Cancel team invitation
   * Player A (inviter) cancels their own pending invitation
   */
  async cancelTeamInvite(teamId: string, userId: string): Promise<void> {
    try {
      console.log('🚫 [TEAM SERVICE] Canceling team invite:', { teamId, userId });

      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Validation: Check if user is the inviter
      if (team.invitedBy !== userId) {
        throw new Error('Only the inviter can cancel this invitation');
      }

      // Validation: Check if invite is pending
      if (team.status !== 'pending') {
        throw new Error(`Cannot cancel invitation with status: ${team.status}`);
      }

      // Update team status to rejected (treated as canceled)
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ [TEAM SERVICE] Team invite canceled:', teamId);
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error canceling team invite:', error);
      throw error;
    }
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);

      if (!teamDoc.exists()) {
        return null;
      }

      return {
        id: teamDoc.id,
        ...teamDoc.data(),
      } as Team;
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error getting team:', error);
      throw error;
    }
  }

  /**
   * Find existing team between two players for a tournament
   */
  async findExistingTeam(
    player1Id: string,
    player2Id: string,
    tournamentId: string
  ): Promise<Team | null> {
    try {
      const teamsRef = collection(db, 'teams');

      // Query teams where player1 or player2 matches both users
      const q = query(
        teamsRef,
        where('tournamentId', '==', tournamentId),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const team = { id: doc.id, ...doc.data() } as Team;

        const hasPlayer1 = team.player1.userId === player1Id || team.player2.userId === player1Id;
        const hasPlayer2 = team.player1.userId === player2Id || team.player2.userId === player2Id;

        if (hasPlayer1 && hasPlayer2) {
          return team;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error finding existing team:', error);
      throw error;
    }
  }

  /**
   * Get user's confirmed team for a specific tournament
   */
  async getUserConfirmedTeamForTournament(
    userId: string,
    tournamentId: string
  ): Promise<Team | null> {
    try {
      const teams = await this.getUserTeamsForTournament(userId, tournamentId);
      return teams.find(t => t.status === 'confirmed') || null;
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error getting user confirmed team:', error);
      throw error;
    }
  }

  /**
   * Get all teams for a user in a specific tournament
   */
  async getUserTeamsForTournament(userId: string, tournamentId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');

      // Query teams where user is either player1 or player2
      const q1 = query(
        teamsRef,
        where('tournamentId', '==', tournamentId),
        where('player1.userId', '==', userId)
      );

      const q2 = query(
        teamsRef,
        where('tournamentId', '==', tournamentId),
        where('player2.userId', '==', userId)
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const teams: Team[] = [];
      const teamIds = new Set<string>();

      // Combine results from both queries (dedup by teamId)
      [...snapshot1.docs, ...snapshot2.docs].forEach(doc => {
        if (!teamIds.has(doc.id)) {
          teamIds.add(doc.id);
          teams.push({ id: doc.id, ...doc.data() } as Team);
        }
      });

      return teams;
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error getting user teams:', error);
      throw error;
    }
  }

  /**
   * Get user's teams overview (all statuses)
   */
  async getUserTeamsOverview(userId: string): Promise<UserTeamsOverview> {
    try {
      const teamsRef = collection(db, 'teams');

      // Query teams where user is either player1 or player2
      const q1 = query(
        teamsRef,
        where('player1.userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const q2 = query(
        teamsRef,
        where('player2.userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const allTeams: Team[] = [];
      const teamIds = new Set<string>();

      // Combine results (dedup)
      [...snapshot1.docs, ...snapshot2.docs].forEach(doc => {
        if (!teamIds.has(doc.id)) {
          teamIds.add(doc.id);
          allTeams.push({ id: doc.id, ...doc.data() } as Team);
        }
      });

      // Categorize teams
      const pendingInvitesReceived = allTeams.filter(
        t => t.status === 'pending' && t.player2.userId === userId && !isTeamInviteExpired(t)
      );

      const pendingInvitesSent = allTeams.filter(
        t => t.status === 'pending' && t.invitedBy === userId && !isTeamInviteExpired(t)
      );

      const confirmedTeams = allTeams.filter(t => t.status === 'confirmed');

      const expiredTeams = allTeams.filter(
        t => t.status === 'expired' || (t.status === 'pending' && isTeamInviteExpired(t))
      );

      // Auto-expire any pending teams that are expired
      const expiredPendingTeams = allTeams.filter(
        t => t.status === 'pending' && isTeamInviteExpired(t)
      );
      if (expiredPendingTeams.length > 0) {
        Promise.all(expiredPendingTeams.map(t => this.expireTeam(t.id))).catch(console.error);
      }

      return {
        pendingInvitesReceived,
        pendingInvitesSent,
        confirmedTeams,
        expiredTeams,
      };
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error getting user teams overview:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's pending team invites (real-time)
   */
  subscribeToUserPendingInvites(userId: string, callback: (invites: Team[]) => void): () => void {
    const teamsRef = collection(db, 'teams');

    // Subscribe to invites where user is player2 (invitee)
    const q = query(
      teamsRef,
      where('player2.userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot) => {
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];

      // Filter out expired invites
      const activeInvites = invites.filter(t => !isTeamInviteExpired(t));

      callback(activeInvites);
    });
  }

  /**
   * Get confirmed teams for a tournament
   */
  async getConfirmedTeamsForTournament(tournamentId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(
        teamsRef,
        where('tournamentId', '==', tournamentId),
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error getting confirmed teams:', error);
      throw error;
    }
  }

  /**
   * Expire a team (auto-expiration for pending invites)
   */
  private async expireTeam(teamId: string): Promise<void> {
    try {
      // Fetch team data before expiring
      const team = await this.getTeam(teamId);

      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        status: 'expired',
        updatedAt: serverTimestamp(),
      });
      console.log('⏰ [TEAM SERVICE] Team expired:', teamId);

      // 🔨 THOR'S CLUB MAILBOX - TEAM EXPIRED 🔨
      // Note: Only create feed for tournament teams (leagues handle expiration differently)
      if (team && team.tournamentId) {
        try {
          const tournamentService = (await import('./tournamentService')).default;
          const tournament = await tournamentService.getTournament(team.tournamentId);

          if (tournament) {
            console.log('🔨 [THOR] Creating club feed item for team expiration...');

            await createFeedItem({
              type: 'club_team_invite_expired',
              actorId: team.player1.userId,
              actorName: team.player1.playerName,
              targetId: team.player2.userId,
              targetName: team.player2.playerName,
              clubId: tournament.clubId,
              clubName: tournament.tournamentName,
              eventId: team.tournamentId,
              metadata: {
                tournamentName: team.tournamentName,
                teamId: teamId,
                teamName: team.teamName,
                inviteStatus: 'expired',
                expirationReason: '48-hour window exceeded',
              },
              visibility: 'club_members',
              visibleTo: [team.player1.userId, team.player2.userId],
            });

            console.log('✅ [THOR] Club feed item created for team expiration');
          }
        } catch (error) {
          console.error('❌ [THOR] Failed to create club feed item for expiration:', error);
          // Continue execution - feed item is not critical
        }
      }
    } catch (error) {
      console.error('❌ [TEAM SERVICE] Error expiring team:', error);
    }
  }
}

export default new TeamService();
