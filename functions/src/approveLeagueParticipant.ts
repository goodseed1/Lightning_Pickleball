/**
 * 🌉 [HEIMDALL] Approve/Reject League Participant Cloud Function
 * Phase 5.14: Server-Side Migration - League Participant Management
 *
 * Handles approval and rejection of pending league participant applications
 * Uses Admin SDK to bypass Security Rules and ensure atomic operations
 *
 * @author Kim (Phase 5.14)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface ApproveLeagueParticipantRequest {
  participantId: string;
  note?: string;
}

interface RejectLeagueParticipantRequest {
  participantId: string;
  note?: string;
}

interface ParticipantResponse {
  success: boolean;
  message: string;
  data?: {
    participantId: string;
    status: string;
  };
}

/**
 * Approve League Participant Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Must be club admin
 * - Application must be pending
 * - Cannot approve after application deadline
 *
 * Operations:
 * 1. Validate participant exists and is pending
 * 2. Validate league exists and check deadline
 * 3. Validate admin permissions
 * 4. Update participant status to 'confirmed'
 * 5. Add participant to league.participants array
 * 6. Add player to league.standings array
 *
 * @param request - Contains participantId and optional note
 * @returns Success status with participant info
 */
export const approveLeagueParticipant = onCall<
  ApproveLeagueParticipantRequest,
  Promise<ParticipantResponse>
>(async request => {
  const { data, auth } = request;
  const { participantId, note } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to approve participants');
  }

  const adminUserId = auth.uid;

  logger.info('✅ [APPROVE_PARTICIPANT] Starting', {
    participantId,
    adminUserId,
  });

  try {
    // ==========================================================================
    // Step 2: Get Participant Data
    // ==========================================================================
    const participantRef = db.collection('league_participants').doc(participantId);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      throw new HttpsError('not-found', 'Participant application not found');
    }

    const participant = participantSnap.data();
    if (!participant) {
      throw new HttpsError('internal', 'Invalid participant data');
    }

    // Check if already processed
    if (participant.status !== 'applied') {
      throw new HttpsError(
        'failed-precondition',
        `Participant already processed with status: ${participant.status}`
      );
    }

    // ==========================================================================
    // Step 3: Get League Data
    // ==========================================================================
    const leagueRef = db.collection('leagues').doc(participant.leagueId);
    const leagueSnap = await leagueRef.get();

    if (!leagueSnap.exists) {
      throw new HttpsError('not-found', 'League not found');
    }

    const league = leagueSnap.data();
    if (!league) {
      throw new HttpsError('internal', 'Invalid league data');
    }

    // ==========================================================================
    // Step 4: Check Application Deadline
    // ==========================================================================
    const now = admin.firestore.Timestamp.now();
    const deadline = league.applicationDeadline;

    if (deadline && now.seconds > deadline.seconds) {
      throw new HttpsError('failed-precondition', 'Cannot approve after application deadline');
    }

    // ==========================================================================
    // Step 5: Authorization Check (Club Admin)
    // ==========================================================================
    const clubId = league.clubId;
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
      throw new HttpsError(
        'permission-denied',
        'Only club admins or managers can approve participants'
      );
    }

    // ==========================================================================
    // Step 6: Batch Operations (Atomic!)
    // ==========================================================================
    const batch = db.batch();

    // 6.1: Update participant status
    batch.update(participantRef, {
      status: 'confirmed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: adminUserId,
      processingNote: note || '승인',
    });

    // 6.2: Add to league.participants array
    // Check if this is a team (doubles) or individual (singles)
    const isTeam = !!participant.teamId;

    if (isTeam) {
      // Doubles: Add team entry with combined playerId
      const combinedPlayerId = `${participant.userId}_${participant.partnerId}`;
      const participantArrayItem = {
        playerId: combinedPlayerId,
        playerName: participant.teamName || participant.userDisplayName,
        player1Id: participant.userId,
        player1Name: participant.userDisplayName,
        player2Id: participant.partnerId,
        player2Name: participant.partnerName,
        teamId: participant.teamId,
      };

      batch.update(leagueRef, {
        participants: admin.firestore.FieldValue.arrayUnion(participantArrayItem),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6.3: Add to league.standings array (team entry)
      const standings = league.standings || [];
      const newStanding = {
        playerId: combinedPlayerId,
        playerName: participant.teamName || participant.userDisplayName,
        player1Id: participant.userId,
        player1Name: participant.userDisplayName,
        player2Id: participant.partnerId,
        player2Name: participant.partnerName,
        teamId: participant.teamId,
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
    } else {
      // Singles: Add individual player
      const participantArrayItem = {
        playerId: participant.userId,
        playerName: participant.userDisplayName,
        ...(participant.userNtrpLevel && { ntrpLevel: participant.userNtrpLevel }),
      };

      batch.update(leagueRef, {
        participants: admin.firestore.FieldValue.arrayUnion(participantArrayItem),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6.3: Add to league.standings array (individual entry)
      const standings = league.standings || [];
      const newStanding = {
        playerId: participant.userId,
        playerName: participant.userDisplayName,
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
    }

    // Commit all changes atomically
    await batch.commit();

    logger.info('✅ [APPROVE_PARTICIPANT] Successfully approved', {
      participantId,
      userId: participant.userId,
      leagueId: participant.leagueId,
    });

    return {
      success: true,
      message: 'Participant approved successfully',
      data: {
        participantId,
        status: 'confirmed',
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [APPROVE_PARTICIPANT] Unexpected error', {
      participantId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to approve participant: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * Reject League Participant Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - Must be club admin
 * - Application must be pending
 * - Cannot reject after application deadline
 *
 * Operations:
 * 1. Validate participant exists and is pending
 * 2. Validate league exists and check deadline
 * 3. Validate admin permissions
 * 4. Update participant status to 'rejected'
 *
 * @param request - Contains participantId and optional note
 * @returns Success status with participant info
 */
export const rejectLeagueParticipant = onCall<
  RejectLeagueParticipantRequest,
  Promise<ParticipantResponse>
>(async request => {
  const { data, auth } = request;
  const { participantId, note } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to reject participants');
  }

  const adminUserId = auth.uid;

  logger.info('❌ [REJECT_PARTICIPANT] Starting', {
    participantId,
    adminUserId,
  });

  try {
    // ==========================================================================
    // Step 2: Get Participant Data
    // ==========================================================================
    const participantRef = db.collection('league_participants').doc(participantId);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      throw new HttpsError('not-found', 'Participant application not found');
    }

    const participant = participantSnap.data();
    if (!participant) {
      throw new HttpsError('internal', 'Invalid participant data');
    }

    // Check if already processed
    if (participant.status !== 'applied') {
      throw new HttpsError(
        'failed-precondition',
        `Participant already processed with status: ${participant.status}`
      );
    }

    // ==========================================================================
    // Step 3: Get League Data
    // ==========================================================================
    const leagueRef = db.collection('leagues').doc(participant.leagueId);
    const leagueSnap = await leagueRef.get();

    if (!leagueSnap.exists) {
      throw new HttpsError('not-found', 'League not found');
    }

    const league = leagueSnap.data();
    if (!league) {
      throw new HttpsError('internal', 'Invalid league data');
    }

    // ==========================================================================
    // Step 4: Check Application Deadline
    // ==========================================================================
    const now = admin.firestore.Timestamp.now();
    const deadline = league.applicationDeadline;

    if (deadline && now.seconds > deadline.seconds) {
      throw new HttpsError('failed-precondition', 'Cannot reject after application deadline');
    }

    // ==========================================================================
    // Step 5: Authorization Check (Club Admin)
    // ==========================================================================
    const clubId = league.clubId;
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
      throw new HttpsError(
        'permission-denied',
        'Only club admins or managers can reject participants'
      );
    }

    // ==========================================================================
    // Step 6: Update Participant Status
    // ==========================================================================
    await participantRef.update({
      status: 'rejected',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: adminUserId,
      processingNote: note || '거부',
    });

    logger.info('✅ [REJECT_PARTICIPANT] Successfully rejected', {
      participantId,
      userId: participant.userId,
      leagueId: participant.leagueId,
    });

    return {
      success: true,
      message: 'Participant rejected successfully',
      data: {
        participantId,
        status: 'rejected',
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [REJECT_PARTICIPANT] Unexpected error', {
      participantId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to reject participant: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
