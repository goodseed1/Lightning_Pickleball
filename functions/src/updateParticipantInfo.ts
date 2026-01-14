/**
 * 🌉 [HEIMDALL] Update Participant Info Cloud Function
 * Phase 5.5: Server-Side Migration - Admin Tools
 *
 * Allows updating participant information (contact info, notes, etc.)
 * Can be updated by participant themselves or tournament admin
 *
 * @author Heimdall (Phase 5.5)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { UpdateParticipantInfoRequest, UpdateParticipantInfoResponse } from './types/tournament';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Update Participant Info Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Can update SELF (participantId === auth.uid)
 * - OR must be tournament creator
 * - OR must be club admin
 *
 * Validations:
 * - Tournament must exist
 * - Participant must exist
 * - Can only update specific fields (contactInfo, notes, emergencyContact)
 *
 * @param request - Contains tournamentId, participantId, and updates
 * @returns Success status
 */
export const updateParticipantInfo = onCall<
  UpdateParticipantInfoRequest,
  Promise<UpdateParticipantInfoResponse>
>(async request => {
  const { data, auth } = request;
  const { tournamentId, participantId, updates } = data;

  // ============================================================================
  // Step 1: Authentication
  // ============================================================================
  if (!auth || !auth.uid) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to update participant information'
    );
  }

  const userId = auth.uid;

  logger.info('✏️ [UPDATE_PARTICIPANT_INFO] Starting update', {
    tournamentId,
    participantId,
    userId,
    updates,
  });

  try {
    // ==========================================================================
    // Step 2: Validate Tournament Exists & Get Data
    // ==========================================================================
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    const tournamentSnap = await tournamentRef.get();

    if (!tournamentSnap.exists) {
      throw new HttpsError('not-found', 'Tournament not found');
    }

    const tournamentData = tournamentSnap.data();
    if (!tournamentData) {
      throw new HttpsError('internal', 'Invalid tournament data');
    }

    // ==========================================================================
    // Step 3: Find Participant
    // ==========================================================================
    const participantsQuery = tournamentRef
      .collection('participants')
      .where('playerId', '==', participantId);
    const participantsSnap = await participantsQuery.get();

    if (participantsSnap.empty) {
      throw new HttpsError('not-found', 'Participant not found in tournament');
    }

    const participantDoc = participantsSnap.docs[0];
    const participantData = participantDoc.data();

    // ==========================================================================
    // Step 4: Authorization Check
    // ==========================================================================
    const isSelf = participantData.playerId === userId;
    const isTournamentCreator = tournamentData.createdBy === userId;

    // Check if user is club admin (if tournament belongs to a club)
    let isClubAdmin = false;
    if (tournamentData.clubId) {
      const clubRef = db.collection('pickleball_clubs').doc(tournamentData.clubId);
      const clubSnap = await clubRef.get();

      if (clubSnap.exists) {
        const memberRef = clubRef.collection('members').doc(userId);
        const memberSnap = await memberRef.get();

        if (memberSnap.exists) {
          const memberData = memberSnap.data();
          const memberRole = memberData?.role;
          isClubAdmin = memberRole === 'admin' || memberRole === 'owner';
        }
      }
    }

    if (!isSelf && !isTournamentCreator && !isClubAdmin) {
      throw new HttpsError(
        'permission-denied',
        'You can only update your own information, or you must be tournament creator/club admin'
      );
    }

    // ==========================================================================
    // Step 5: Build Update Data (only allowed fields)
    // ==========================================================================
    const updateData: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (updates.contactInfo !== undefined) {
      updateData.contactInfo = updates.contactInfo;
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    if (updates.emergencyContact !== undefined) {
      updateData.emergencyContact = updates.emergencyContact;
    }

    // ==========================================================================
    // Step 6: Update Participant
    // ==========================================================================
    await participantDoc.ref.update(updateData);

    logger.info('✅ [UPDATE_PARTICIPANT_INFO] Successfully updated', {
      tournamentId,
      participantId,
      userId,
      fields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
    });

    return {
      success: true,
      message: 'Participant information updated successfully',
    };
  } catch (error) {
    // Re-throw HttpsError as is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Log unexpected errors
    logger.error('❌ [UPDATE_PARTICIPANT_INFO] Unexpected error', {
      tournamentId,
      participantId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      `Failed to update participant information: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
