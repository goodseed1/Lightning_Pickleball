/**
 * 🌉 [HEIMDALL] Add League Participant Cloud Function
 * Phase 5.8: Server-Side Migration - League Management
 *
 * Securely adds a participant to a league with atomic operations
 * Uses Admin SDK to bypass Security Rules
 *
 * @author Heimdall (Phase 5.8)
 * @date 2025-11-15
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AddLeagueParticipantRequest, AddLeagueParticipantResponse } from './types/league';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Add League Participant Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be club admin
 * - Cannot add to completed leagues
 * - Checks capacity limits
 * - Prevents duplicate participants
 *
 * Atomic Operations:
 * - Add to league_participants collection
 * - Update leagues.participants array
 * - Add to league_standings (if league is in progress)
 *
 * @param request - Contains leagueId, userId, and user details
 * @returns Success status with participant ID
 */
export const addLeagueParticipant = onCall<
  AddLeagueParticipantRequest,
  Promise<AddLeagueParticipantResponse>
>(async request => {
  const { data, auth } = request;
  const { leagueId, userId, userDisplayName, userEmail, userNtrpLevel, userProfileImage } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to add participants');
  }

  const adminUserId = auth.uid;

  logger.info('➕ [ADD_LEAGUE_PARTICIPANT] Starting', {
    leagueId,
    userId,
    adminUserId,
  });

  try {
    // ==========================================================================
    // Step 2: Validate League Exists & Get Data
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
    // Step 3: Authorization Check (Club Admin)
    // ==========================================================================
    const clubId = leagueData.clubId;
    const clubMemberRef = db.collection('clubMembers').doc(`${clubId}_${adminUserId}`);
    const clubMemberSnap = await clubMemberRef.get();

    if (!clubMemberSnap.exists) {
      throw new HttpsError('permission-denied', 'You are not a member of this club');
    }

    const clubMemberData = clubMemberSnap.data();
    // 🎯 [KIM FIX] 운영진(manager)도 참가자 추가 권한 부여
    const isAdminOrManager =
      clubMemberData?.role === 'admin' ||
      clubMemberData?.role === 'owner' ||
      clubMemberData?.role === 'manager';

    if (!isAdminOrManager) {
      throw new HttpsError(
        'permission-denied',
        'Only club admins or managers can add participants'
      );
    }

    // ==========================================================================
    // Step 4: Validate League Status
    // ==========================================================================
    if (leagueData.status === 'completed') {
      throw new HttpsError('failed-precondition', 'Cannot add participants to completed league');
    }

    // ==========================================================================
    // Step 5: Check Capacity
    // ==========================================================================
    const currentParticipants = leagueData.participants || [];
    const maxParticipants = leagueData.settings?.maxParticipants || 16;

    if (currentParticipants.length >= maxParticipants) {
      throw new HttpsError('failed-precondition', 'League is full');
    }

    // ==========================================================================
    // Step 6: Check Duplicate
    // ==========================================================================
    const existingParticipantQuery = await db
      .collection('league_participants')
      .where('leagueId', '==', leagueId)
      .where('userId', '==', userId)
      .get();

    if (!existingParticipantQuery.empty) {
      throw new HttpsError('already-exists', 'User is already a participant');
    }

    // ==========================================================================
    // Step 7: Batch Operations (Atomic!)
    // ==========================================================================
    const batch = db.batch();

    // 7.1: Add to league_participants
    const participantRef = db.collection('league_participants').doc();
    const participantData: Record<string, unknown> = {
      leagueId,
      userId,
      status: 'confirmed',
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      userDisplayName,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: adminUserId,
      processingNote: '관리자가 직접 추가',
    };

    // Add optional fields only if they exist
    if (userEmail) participantData.userEmail = userEmail;
    if (userNtrpLevel) participantData.userNtrpLevel = userNtrpLevel;
    if (userProfileImage) participantData.userProfileImage = userProfileImage;

    batch.set(participantRef, participantData);

    // 7.2: Update leagues.participants array
    const participantArrayItem: Record<string, unknown> = {
      playerId: userId,
      playerName: userDisplayName,
    };
    if (userNtrpLevel) participantArrayItem.ntrpLevel = userNtrpLevel;

    batch.update(leagueRef, {
      participants: admin.firestore.FieldValue.arrayUnion(participantArrayItem),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7.3: Add to standings if league is in progress
    if (leagueData.status === 'in_progress') {
      const standingRef = db.collection('league_standings').doc();
      batch.set(standingRef, {
        leagueId,
        playerId: userId,
        playerName: userDisplayName,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Commit all changes atomically
    await batch.commit();

    logger.info('✅ [ADD_LEAGUE_PARTICIPANT] Successfully added', {
      leagueId,
      userId,
      participantId: participantRef.id,
    });

    return {
      success: true,
      message: 'Participant added successfully',
      data: {
        participantId: participantRef.id,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [ADD_LEAGUE_PARTICIPANT] Unexpected error', {
      leagueId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to add participant: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
