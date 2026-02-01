/**
 * 🌉 [HEIMDALL] Create League Team Cloud Function
 * Doubles Support: Create a confirmed team for league doubles
 *
 * Unlike tournaments (which require team invitation + acceptance),
 * league teams are auto-confirmed when created.
 *
 * Security:
 * - Uses Admin SDK to bypass Security Rules
 * - Only authenticated users can create teams
 * - User must be one of the team members (player1 or player2)
 *
 * @author Kim (Doubles Support - Code Quality Methodology Applied)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface CreateLeagueTeamRequest {
  player1Id: string;
  player2Id: string;
  leagueId: string; // Required for league context
}

interface CreateLeagueTeamResponse {
  success: boolean;
  teamId: string;
  teamName: string;
  message: string;
}

/**
 * Create League Team Cloud Function
 *
 * Creates a confirmed team for league doubles participation.
 * Unlike tournament teams (pending → confirmed after invitation acceptance),
 * league teams are auto-confirmed upon creation.
 *
 * Workflow:
 * 1. Validate authentication
 * 2. Verify caller is one of the team members
 * 3. Check if team already exists (same two players)
 * 4. If exists → return existing team
 * 5. If not → create new confirmed team
 *
 * @param request - Contains player1Id, player2Id, optional leagueId
 * @returns Team ID and team name
 */
export const createLeagueTeam = onCall<CreateLeagueTeamRequest, Promise<CreateLeagueTeamResponse>>(
  async request => {
    const { data, auth } = request;
    const { player1Id, player2Id, leagueId } = data;

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to create a team');
    }

    const callerId = auth.uid;

    // Verify caller is one of the team members
    if (callerId !== player1Id && callerId !== player2Id) {
      throw new HttpsError(
        'permission-denied',
        'You must be one of the team members to create a team'
      );
    }

    logger.info('👥 [CREATE_LEAGUE_TEAM] Starting', {
      player1Id,
      player2Id,
      leagueId: leagueId || 'N/A',
      callerId,
    });

    try {
      // ========================================================================
      // Step 2a: Check if team already registered for this league
      // ========================================================================
      // 🔧 [FIX] Prevent duplicate teams: A invites B → Team1, B invites A → Team2
      // Check if same player combination already exists in this league
      const existingParticipantsQuery = await db
        .collection('league_participants')
        .where('leagueId', '==', leagueId)
        .get();

      for (const participantDoc of existingParticipantsQuery.docs) {
        const existing = participantDoc.data();
        const existingPlayer1 = existing.userId || existing.player1Id;
        const existingPlayer2 = existing.partnerId || existing.player2Id;

        // Skip singles participants
        if (!existingPlayer2) continue;

        // Check if same player combination (order-independent)
        const sameTeam1 = existingPlayer1 === player1Id && existingPlayer2 === player2Id;
        const sameTeam2 = existingPlayer1 === player2Id && existingPlayer2 === player1Id;

        if (sameTeam1 || sameTeam2) {
          logger.warn('⚠️ [CREATE_LEAGUE_TEAM] Team already registered for this league!', {
            existingTeamId: existing.teamId,
            leagueId,
            players: [player1Id, player2Id],
          });
          throw new HttpsError(
            'already-exists',
            'A team with these players is already registered for this league'
          );
        }
      }

      // ========================================================================
      // Step 2b: Check if PENDING team already exists (only reuse pending teams!)
      // ========================================================================
      // ⚠️ IMPORTANT: Only check for 'pending' teams!
      // - pending: Reuse (partner hasn't responded yet)
      // - confirmed: Create NEW team (send new invitation)
      // - rejected: Create NEW team (previous invitation was rejected)
      const teamsRef = db.collection('teams');
      const existingTeamsSnap = await teamsRef
        .where('status', '==', 'pending') // ✅ Only pending teams!
        .where('leagueId', '==', leagueId) // ✅ Same league only!
        .get();

      logger.info('🔍 [CREATE_LEAGUE_TEAM] Checking for existing pending teams', {
        foundCount: existingTeamsSnap.size,
        leagueId,
      });

      // Check each PENDING team to see if it has both players
      for (const teamDoc of existingTeamsSnap.docs) {
        const team = teamDoc.data();
        const hasPlayer1 = team.player1?.userId === player1Id || team.player2?.userId === player1Id;
        const hasPlayer2 = team.player1?.userId === player2Id || team.player2?.userId === player2Id;

        if (hasPlayer1 && hasPlayer2) {
          logger.info('✅ [CREATE_LEAGUE_TEAM] Found existing pending team (reusing)', {
            teamId: teamDoc.id,
            teamName: team.teamName,
            status: team.status,
          });

          // Reuse pending team (invitation still waiting for response)
          return {
            success: true,
            teamId: teamDoc.id,
            teamName: team.teamName,
            message: 'Team invitation already sent. Waiting for partner response.',
          };
        }
      }

      logger.info('ℹ️ [CREATE_LEAGUE_TEAM] No existing pending team found. Creating new team.');

      // ========================================================================
      // Step 3: Get player data
      // ========================================================================
      const player1Doc = await db.collection('users').doc(player1Id).get();
      const player2Doc = await db.collection('users').doc(player2Id).get();

      if (!player1Doc.exists || !player2Doc.exists) {
        throw new HttpsError('not-found', 'One or both players not found');
      }

      const player1Data = player1Doc.data();
      const player2Data = player2Doc.data();

      if (!player1Data || !player2Data) {
        throw new HttpsError('internal', 'Invalid player data');
      }

      // Extract player names
      const player1Profile = player1Data.profile || {};
      const player2Profile = player2Data.profile || {};

      const player1Name =
        player1Profile.displayName ||
        `${player1Profile.firstName || ''} ${player1Profile.lastName || ''}`.trim() ||
        player1Data.displayName ||
        'Player 1';

      const player2Name =
        player2Profile.displayName ||
        `${player2Profile.firstName || ''} ${player2Profile.lastName || ''}`.trim() ||
        player2Data.displayName ||
        'Player 2';

      const teamName = `${player1Name} & ${player2Name}`;

      logger.info('👥 [CREATE_LEAGUE_TEAM] Creating new team', {
        teamName,
        player1Name,
        player2Name,
      });

      // ========================================================================
      // Step 4: Fetch league data for club context
      // ========================================================================
      const leagueRef = db.collection('leagues').doc(leagueId);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        throw new HttpsError('not-found', 'League not found');
      }

      const leagueData = leagueSnap.data()!;

      logger.info('✅ [CREATE_LEAGUE_TEAM] League found', {
        leagueId,
        leagueName: leagueData.name || leagueData.leagueName || leagueData.title,
        clubId: leagueData.clubId,
      });

      // ========================================================================
      // Step 5: Create new pending team (like tournaments)
      // ========================================================================
      const newTeam = {
        teamName,
        player1: {
          userId: player1Id,
          playerName: player1Name, // ✅ Changed from displayName to match onTeamInviteCreated.js
          photoURL: player1Data.photoURL || player1Data.profileImage || '',
        },
        player2: {
          userId: player2Id,
          playerName: player2Name, // ✅ Changed from displayName to match onTeamInviteCreated.js
          photoURL: player2Data.photoURL || player2Data.profileImage || '',
        },
        status: 'pending', // Wait for partner consent!
        leagueId: leagueId, // For Firestore Trigger
        leagueName: leagueData.name || leagueData.leagueName || leagueData.title,
        clubId: leagueData.clubId, // For direct access
        expiresAt: admin.firestore.Timestamp.fromMillis(
          Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        ),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const teamRef = await db.collection('teams').add(newTeam);

      logger.info('✅ [CREATE_LEAGUE_TEAM] Team created successfully', {
        teamId: teamRef.id,
        teamName,
      });

      return {
        success: true,
        teamId: teamRef.id,
        teamName,
        message: 'Team invitation sent successfully. Waiting for partner consent.',
      };
    } catch (error) {
      logger.error('❌ [CREATE_LEAGUE_TEAM] Error:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to create team: ${(error as Error).message}`);
    }
  }
);
