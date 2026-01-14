/**
 * 🌉 [HEIMDALL] Apply For League As Team Cloud Function
 * Server-Side Migration Phase 2: League Participation (Doubles) - AUTO-APPROVAL
 *
 * Securely handles league application submission for doubles leagues with automatic approval
 * Applications are instantly approved and added to participants/standings arrays
 * Uses Admin SDK to bypass Security Rules
 *
 * @author Kim (Server-Side Migration Phase 2)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface ApplyForLeagueAsTeamRequest {
  leagueId: string;
  teamId: string;
}

interface ApplyForLeagueAsTeamResponse {
  success: boolean;
  message: string;
  data: {
    participantId: string;
    teamName: string;
  };
}

/**
 * Apply For League As Team Cloud Function (Doubles)
 *
 * Workflow:
 * 1. Validate authentication
 * 2. Get team data and verify team exists
 * 3. Verify user is team member (player1 or player2)
 * 4. Check league exists and get data
 * 5. Validate IS doubles league (not singles)
 * 6. Check league status (must be 'open')
 * 7. Check application deadline
 * 8. Check for duplicate team application
 * 9. Get player data for both team members
 * 10. Create league_participants entry with status: 'confirmed' (auto-approved)
 * 11. Add team to league.participants array
 * 12. Add team to league.standings array
 *
 * @param request - Contains leagueId and teamId
 * @returns Success status with participant ID and team name
 */
export const applyForLeagueAsTeam = onCall<
  ApplyForLeagueAsTeamRequest,
  Promise<ApplyForLeagueAsTeamResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId, teamId } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to apply for a league');
  }

  const userId = auth.uid;

  logger.info('👥 [APPLY_FOR_LEAGUE_AS_TEAM] Starting team application', {
    leagueId,
    teamId,
    userId,
  });

  try {
    // ==========================================================================
    // Step 2: Get Team Data
    // ==========================================================================
    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await teamRef.get();

    if (!teamSnap.exists) {
      throw new HttpsError('not-found', 'Team not found');
    }

    const teamData = teamSnap.data();
    if (!teamData) {
      throw new HttpsError('internal', 'Invalid team data');
    }

    const player1Id = teamData.player1?.userId;
    const player2Id = teamData.player2?.userId;

    if (!player1Id || !player2Id) {
      throw new HttpsError('internal', 'Invalid team member data');
    }

    // ==========================================================================
    // Step 3: Verify User is Team Member
    // ==========================================================================
    if (userId !== player1Id && userId !== player2Id) {
      throw new HttpsError(
        'permission-denied',
        'You must be a member of the team to apply for the league'
      );
    }

    // ==========================================================================
    // Step 4: Validate League Exists & Get Data
    // ==========================================================================
    const leagueRef = db.collection('leagues').doc(leagueId);
    const leagueSnap = await leagueRef.get();

    if (!leagueSnap.exists) {
      throw new HttpsError('not-found', 'League not found');
    }

    const leagueData = leagueSnap.data();
    if (!leagueData) {
      throw new HttpsError('internal', 'Invalid league data');
    }

    // ==========================================================================
    // Step 5: Validate IS Doubles League
    // ==========================================================================
    const eventType = leagueData.eventType;
    if (eventType === 'mens_singles' || eventType === 'womens_singles') {
      throw new HttpsError('failed-precondition', 'Cannot register a team for singles leagues');
    }

    // ==========================================================================
    // Step 6: Check League Status
    // ==========================================================================
    if (leagueData.status !== 'open') {
      throw new HttpsError('failed-precondition', 'League is not open for registration');
    }

    // ==========================================================================
    // Step 7: Check Application Deadline
    // ==========================================================================
    const now = admin.firestore.Timestamp.now();
    const deadline = leagueData.applicationDeadline;

    if (now.toMillis() > deadline.toMillis()) {
      throw new HttpsError('failed-precondition', 'Application deadline has passed');
    }

    // ==========================================================================
    // Step 8: Check Duplicate Team Application
    // ==========================================================================
    const existingTeamQuery = await db
      .collection('league_participants')
      .where('leagueId', '==', leagueId)
      .where('teamId', '==', teamId)
      .get();

    if (!existingTeamQuery.empty) {
      throw new HttpsError('already-exists', 'This team has already applied for this league');
    }

    // ==========================================================================
    // Step 9: Get Player Data
    // ==========================================================================
    const player1Ref = db.collection('users').doc(player1Id);
    const player2Ref = db.collection('users').doc(player2Id);

    const [player1Snap, player2Snap] = await Promise.all([player1Ref.get(), player2Ref.get()]);

    if (!player1Snap.exists || !player2Snap.exists) {
      throw new HttpsError('not-found', 'Team member profile not found');
    }

    const player1Data = player1Snap.data();
    const player2Data = player2Snap.data();

    if (!player1Data || !player2Data) {
      throw new HttpsError('internal', 'Invalid player data');
    }

    // Extract player names and info
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

    const teamName = teamData.teamName || `${player1Name} & ${player2Name}`;

    // ==========================================================================
    // Step 10: Create Team League Application (Atomic Batch!)
    // ==========================================================================
    const batch = db.batch();

    // 10.1: Add to league_participants subcollection
    const participantRef = db.collection('league_participants').doc();
    const participantData: Record<string, unknown> = {
      leagueId,
      userId: player1Id, // Primary player
      status: 'confirmed', // Auto-approved (no manual approval required)
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: 'auto-approval-system',
      userDisplayName: player1Name,

      // Partner info (doubles)
      partnerId: player2Id,
      partnerName: player2Name,

      // Team reference
      teamId,
      teamName,
    };

    // Add optional fields for player1
    if (player1Data.email) participantData.userEmail = player1Data.email;
    if (player1Profile.ntrpLevel) participantData.userNtrpLevel = player1Profile.ntrpLevel;
    if (player1Data.photoURL || player1Data.profileImage) {
      participantData.userProfileImage = player1Data.photoURL || player1Data.profileImage;
    }

    // Add optional fields for player2 (partner)
    if (player2Data.email) participantData.partnerEmail = player2Data.email;
    if (player2Profile.ntrpLevel) participantData.partnerNtrpLevel = player2Profile.ntrpLevel;
    if (player2Data.photoURL || player2Data.profileImage) {
      participantData.partnerProfileImage = player2Data.photoURL || player2Data.profileImage;
    }

    batch.set(participantRef, participantData);

    // 10.2: Update leagues.participants array (CRITICAL FIX!)
    // Combined playerId for team matching
    const combinedPlayerId = `${player1Id}_${player2Id}`;

    const participantArrayItem = {
      playerId: combinedPlayerId,
      playerName: teamName,
      player1Id,
      player1Name,
      player2Id,
      player2Name,
      teamId,
    };

    logger.info('🔄 [APPLY_FOR_LEAGUE_AS_TEAM] Preparing batch operations', {
      leagueId,
      teamId,
      participantArrayItem,
      operation: 'arrayUnion to leagues.participants',
    });

    batch.update(leagueRef, {
      participants: admin.firestore.FieldValue.arrayUnion(participantArrayItem),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 10.3: Add to league.standings array (team entry with initial stats)
    const standings = leagueData.standings || [];
    const newStanding = {
      playerId: combinedPlayerId,
      playerName: teamName,
      player1Id,
      player1Name,
      player2Id,
      player2Name,
      teamId,
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

    batch.update(leagueRef, {
      standings,
    });

    logger.info('📊 [APPLY_FOR_LEAGUE_AS_TEAM] Added team to standings', {
      combinedPlayerId,
      teamName,
      position: standings.length,
    });

    logger.info('💾 [APPLY_FOR_LEAGUE_AS_TEAM] Committing batch operations...');

    // Commit all changes atomically
    await batch.commit();

    logger.info('✅ [APPLY_FOR_LEAGUE_AS_TEAM] Batch committed successfully!');

    logger.info('✅ [APPLY_FOR_LEAGUE_AS_TEAM] Team application auto-approved successfully', {
      leagueId,
      teamId,
      teamName,
      participantId: participantRef.id,
    });

    return {
      success: true,
      message: 'Team league application submitted successfully',
      data: {
        participantId: participantRef.id,
        teamName,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [APPLY_FOR_LEAGUE_AS_TEAM] Unexpected error', {
      leagueId,
      teamId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to apply for league: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
