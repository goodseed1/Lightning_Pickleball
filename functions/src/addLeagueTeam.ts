/**
 * 🌉 [HEIMDALL] Add League Team Cloud Function
 * Doubles Support: Admin can directly add a team to a league
 *
 * Based on tournament registerTeamForTournament logic
 * Uses Admin SDK to bypass Security Rules and ensure atomic operations
 *
 * @author Kim (Doubles Support)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface AddLeagueTeamRequest {
  leagueId: string;
  teamId?: string; // Optional - for existing teams
  player1Id?: string; // Optional - for direct addition
  player2Id?: string; // Optional - for direct addition
  player1Name?: string; // Optional - for direct addition
  player2Name?: string; // Optional - for direct addition
  teamName?: string; // Optional - for direct addition
}

interface AddLeagueTeamResponse {
  success: boolean;
  message: string;
  data?: {
    participantId: string;
    teamName: string;
  };
}

/**
 * Add League Team Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Must be club admin
 * - League must be doubles event
 * - Cannot add to completed leagues
 * - Supports TWO modes:
 *   1. teamId → Adds existing team from teams collection
 *   2. player1Id + player2Id → Direct addition (no teams collection entry)
 *
 * Atomic Operations:
 * - Add to league_participants collection (with team info)
 * - Update leagues.participants array (both players)
 * - Add to league.standings (team entry)
 *
 * @param request - Contains leagueId and EITHER teamId OR (player1Id + player2Id)
 * @returns Success status with participant ID
 */
export const addLeagueTeam = onCall<AddLeagueTeamRequest, Promise<AddLeagueTeamResponse>>(
  async request => {
    const { data, auth } = request;
    const { leagueId, teamId, player1Id, player2Id, teamName } = data;
    // Note: player1Name and player2Name from UI are intentionally ignored
    // We always fetch player names from Firestore for data consistency

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to add teams');
    }

    const adminUserId = auth.uid;

    logger.info('➕ [ADD_LEAGUE_TEAM] Starting', {
      leagueId,
      teamId,
      player1Id,
      player2Id,
      adminUserId,
    });

    // Validate input: Either teamId OR (player1Id + player2Id)
    const hasTeamId = !!teamId;
    const hasPlayerIds = !!player1Id && !!player2Id;

    if (!hasTeamId && !hasPlayerIds) {
      throw new HttpsError(
        'invalid-argument',
        'Must provide either teamId OR (player1Id + player2Id)'
      );
    }

    if (hasTeamId && hasPlayerIds) {
      throw new HttpsError(
        'invalid-argument',
        'Provide EITHER teamId OR (player1Id + player2Id), not both'
      );
    }

    try {
      let player1Id_final: string;
      let player2Id_final: string;
      let player1Name_final: string;
      let player2Name_final: string;
      let teamName_final: string;
      let teamId_final: string | undefined;

      if (hasTeamId) {
        // ========================================================================
        // Branch A: teamId provided → Query teams collection (existing flow)
        // ========================================================================
        const teamRef = db.collection('teams').doc(teamId!);
        const teamSnap = await teamRef.get();

        if (!teamSnap.exists) {
          throw new HttpsError('not-found', 'Team not found');
        }

        const teamData = teamSnap.data()!;

        player1Id_final = teamData.player1.userId;
        player2Id_final = teamData.player2.userId;

        logger.info('✅ [ADD_LEAGUE_TEAM] Team found in teams collection', {
          teamName: teamData.teamName,
          player1Id: player1Id_final,
          player2Id: player2Id_final,
        });

        // Get player data from users collection
        const player1Snap = await db.collection('users').doc(player1Id_final).get();
        const player2Snap = await db.collection('users').doc(player2Id_final).get();

        if (!player1Snap.exists || !player2Snap.exists) {
          throw new HttpsError('not-found', 'Team member profile not found');
        }

        const player1Data = player1Snap.data()!;
        const player2Data = player2Snap.data()!;

        const player1Profile = player1Data.profile || {};
        const player2Profile = player2Data.profile || {};

        player1Name_final =
          player1Profile.displayName ||
          `${player1Profile.firstName || ''} ${player1Profile.lastName || ''}`.trim() ||
          player1Data.displayName ||
          'Player 1';

        player2Name_final =
          player2Profile.displayName ||
          `${player2Profile.firstName || ''} ${player2Profile.lastName || ''}`.trim() ||
          player2Data.displayName ||
          'Player 2';

        teamName_final = teamData.teamName || `${player1Name_final} & ${player2Name_final}`;
        teamId_final = teamId;
      } else {
        // ========================================================================
        // Branch B: player1Id + player2Id provided → Direct addition (new flow)
        // ========================================================================
        player1Id_final = player1Id!;
        player2Id_final = player2Id!;

        logger.info('➕ [ADD_LEAGUE_TEAM] Direct team addition (no teams collection entry)', {
          player1Id: player1Id_final,
          player2Id: player2Id_final,
        });

        // ALWAYS fetch from users collection for data consistency
        // Never trust UI-provided names as they may be empty or incorrect
        const player1Snap = await db.collection('users').doc(player1Id_final).get();
        const player2Snap = await db.collection('users').doc(player2Id_final).get();

        if (!player1Snap.exists || !player2Snap.exists) {
          throw new HttpsError('not-found', 'Team member profile not found');
        }

        const player1Data = player1Snap.data()!;
        const player2Data = player2Snap.data()!;

        const player1Profile = player1Data.profile || {};
        const player2Profile = player2Data.profile || {};

        player1Name_final =
          player1Profile.displayName ||
          `${player1Profile.firstName || ''} ${player1Profile.lastName || ''}`.trim() ||
          player1Data.displayName ||
          'Player 1';

        player2Name_final =
          player2Profile.displayName ||
          `${player2Profile.firstName || ''} ${player2Profile.lastName || ''}`.trim() ||
          player2Data.displayName ||
          'Player 2';

        teamName_final = teamName || `${player1Name_final} & ${player2Name_final}`;

        logger.info('✅ [ADD_LEAGUE_TEAM] Player names from Firestore', {
          player1Name: player1Name_final,
          player2Name: player2Name_final,
          teamName: teamName_final,
        });

        // teamId is optional for direct addition (no teams collection entry)
        teamId_final = undefined;
      }

      // ========================================================================
      // Step 3: Get League Data
      // ========================================================================
      const leagueRef = db.collection('leagues').doc(leagueId);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        throw new HttpsError('not-found', 'League not found');
      }

      const leagueData = leagueSnap.data();
      if (!leagueData) {
        throw new HttpsError('internal', 'Invalid league data');
      }

      // ========================================================================
      // Step 4: Validate League is Doubles
      // ========================================================================
      const eventType = leagueData.eventType;
      if (eventType === 'mens_singles' || eventType === 'womens_singles') {
        throw new HttpsError('invalid-argument', 'Cannot add a team to singles leagues');
      }

      logger.info('📊 [ADD_LEAGUE_TEAM] League event type validated', { eventType });

      // ========================================================================
      // Step 5: Authorization Check (Club Admin)
      // ========================================================================
      const clubId = leagueData.clubId;
      const clubMemberRef = db.collection('clubMembers').doc(`${clubId}_${adminUserId}`);
      const clubMemberSnap = await clubMemberRef.get();

      if (!clubMemberSnap.exists) {
        throw new HttpsError('permission-denied', 'You are not a member of this club');
      }

      const clubMemberData = clubMemberSnap.data();
      // 🎯 [KIM FIX] 운영진(manager)도 권한 부여
      const isAdminOrManager =
        clubMemberData?.role === 'admin' ||
        clubMemberData?.role === 'owner' ||
        clubMemberData?.role === 'manager';

      if (!isAdminOrManager) {
        throw new HttpsError('permission-denied', 'Only club admins or managers can add teams');
      }

      // ========================================================================
      // Step 6: Validate League Status
      // ========================================================================
      if (leagueData.status === 'completed') {
        throw new HttpsError('failed-precondition', 'Cannot add teams to completed league');
      }

      // ========================================================================
      // Step 7: Check for Duplicate Team
      // ========================================================================
      // Check by teamId if available, otherwise by player combination
      if (teamId_final) {
        const existingTeamQuery = await db
          .collection('league_participants')
          .where('leagueId', '==', leagueId)
          .where('teamId', '==', teamId_final)
          .get();

        if (!existingTeamQuery.empty) {
          throw new HttpsError('already-exists', 'This team is already in the league');
        }
      } else {
        // Check by player combination
        const existingPlayerQuery = await db
          .collection('league_participants')
          .where('leagueId', '==', leagueId)
          .where('userId', '==', player1Id_final)
          .where('partnerId', '==', player2Id_final)
          .get();

        if (!existingPlayerQuery.empty) {
          throw new HttpsError(
            'already-exists',
            'This player combination is already in the league'
          );
        }
      }

      // ========================================================================
      // Step 8: Get Player Data (for email/profile info)
      // ========================================================================
      const player1Snap = await db.collection('users').doc(player1Id_final).get();
      const player2Snap = await db.collection('users').doc(player2Id_final).get();

      if (!player1Snap.exists || !player2Snap.exists) {
        throw new HttpsError('not-found', 'Team member profile not found');
      }

      const player1Data = player1Snap.data()!;
      const player2Data = player2Snap.data()!;

      const player1Profile = player1Data.profile || {};
      const player2Profile = player2Data.profile || {};

      // ========================================================================
      // Step 9: Batch Operations (Atomic!)
      // ========================================================================
      const batch = db.batch();

      // 9.1: Add to league_participants
      const participantRef = db.collection('league_participants').doc();
      const participantData: Record<string, unknown> = {
        leagueId,
        userId: player1Id_final, // Primary player
        status: 'confirmed',
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        userDisplayName: player1Name_final,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: adminUserId,
        processingNote: '관리자가 직접 추가 (팀)',

        // Partner info (doubles)
        partnerId: player2Id_final,
        partnerName: player2Name_final,

        // Team reference (optional - may not exist in teams collection for direct additions)
        ...(teamId_final && { teamId: teamId_final }),
        teamName: teamName_final,

        // Player 1 optional fields (conditional)
        ...(player1Data.email && { userEmail: player1Data.email }),
        ...(player1Profile.ntrpLevel && { userNtrpLevel: player1Profile.ntrpLevel }),
        ...((player1Data.photoURL || player1Data.profileImage) && {
          userProfileImage: player1Data.photoURL || player1Data.profileImage,
        }),

        // Partner optional fields (conditional)
        ...(player2Data.email && { partnerEmail: player2Data.email }),
        ...(player2Profile.ntrpLevel && { partnerNtrpLevel: player2Profile.ntrpLevel }),
        ...((player2Data.photoURL || player2Data.profileImage) && {
          partnerProfileImage: player2Data.photoURL || player2Data.profileImage,
        }),
      };

      batch.set(participantRef, participantData);

      // 9.2: Update leagues.participants array (BOTH players)
      // Combined playerId for team matching
      const combinedPlayerId = `${player1Id_final}_${player2Id_final}`;

      const participantArrayItem = {
        playerId: combinedPlayerId,
        playerName: teamName_final,
        player1Id: player1Id_final,
        player1Name: player1Name_final,
        player2Id: player2Id_final,
        player2Name: player2Name_final,
        ...(teamId_final && { teamId: teamId_final }),
      };

      // 9.3: Add to league.standings (team entry)
      const standings = leagueData.standings || [];
      const newStanding = {
        playerId: combinedPlayerId,
        playerName: teamName_final,
        player1Id: player1Id_final,
        player1Name: player1Name_final,
        player2Id: player2Id_final,
        player2Name: player2Name_final,
        ...(teamId_final && { teamId: teamId_final }),
        position: standings.length + 1,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        setsWon: 0,
        setsLost: 0,
        setDifference: 0,
        streak: { type: 'none', count: 0 },
      };

      standings.push(newStanding);

      // 9.4: Update league document (participants + standings in ONE batch update)
      batch.update(leagueRef, {
        participants: admin.firestore.FieldValue.arrayUnion(participantArrayItem),
        standings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Commit all changes atomically
      await batch.commit();

      logger.info('✅ [ADD_LEAGUE_TEAM] Successfully added', {
        leagueId,
        teamId: teamId_final,
        teamName: teamName_final,
        participantId: participantRef.id,
        mode: hasTeamId ? 'existing-team' : 'direct-addition',
      });

      return {
        success: true,
        message: `Team "${teamName_final}" added successfully`,
        data: {
          participantId: participantRef.id,
          teamName: teamName_final,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('❌ [ADD_LEAGUE_TEAM] Unexpected error', {
        leagueId,
        teamId: teamId || 'direct-addition',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to add team: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
