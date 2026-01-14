/**
 * 🎯 [SINGLES REINVITE] Reinvite Friend for Singles Match
 *
 * Callable Cloud Function to reinvite a different friend after rejection.
 * Unlike reinvitePartner (for doubles), this updates the event's friendInvitations array.
 *
 * @author Kim
 * @date 2026-01-01
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface ReinviteFriendRequest {
  eventId: string;
  newFriendId: string;
  newFriendName: string;
}

/**
 * 🎯 [SINGLES REINVITE] reinviteFriend Cloud Function
 *
 * Allows host to reinvite a different friend for singles match after previous rejections
 */
export const reinviteFriend = onCall<ReinviteFriendRequest>(async request => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const auth = request.auth;
  const { eventId, newFriendId, newFriendName } = request.data;

  logger.info('🔄 [REINVITE_FRIEND] Reinvitation request received', {
    eventId,
    newFriendId,
    hostId: auth.uid,
  });

  // 2. Validate input
  if (!eventId || !newFriendId || !newFriendName) {
    throw new HttpsError(
      'invalid-argument',
      'eventId, newFriendId, and newFriendName are required'
    );
  }

  // 3. Transaction: Update friendInvitations array
  try {
    const result = await db.runTransaction(async transaction => {
      // ✅ PHASE 1: ALL READS FIRST

      // A. Get Event Document
      const eventRef = db.collection('events').doc(eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new HttpsError('not-found', 'Event not found');
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        throw new HttpsError('internal', 'Invalid event data');
      }

      // B. Security: Verify the requester is the host
      if (eventData.hostId !== auth.uid) {
        logger.warn('🚫 [REINVITE_FRIEND] Unauthorized attempt', {
          hostId: eventData.hostId,
          requesterId: auth.uid,
        });
        throw new HttpsError('permission-denied', 'Only the host can reinvite friends');
      }

      // C. Verify this is a singles match
      const gameType = eventData.gameType?.toLowerCase() || '';
      if (!gameType.includes('singles')) {
        throw new HttpsError(
          'failed-precondition',
          'reinviteFriend is only for singles matches. Use reinvitePartner for doubles.'
        );
      }

      // D. Get current friendInvitations
      const currentInvitations =
        (eventData.friendInvitations as Array<{
          userId: string;
          userName?: string;
          status: 'pending' | 'accepted' | 'rejected';
          invitedAt: string;
        }>) || [];

      // E. Verify all current invitations are rejected (or none exist)
      const hasPendingOrAccepted = currentInvitations.some(
        inv => inv.status === 'pending' || inv.status === 'accepted'
      );

      if (hasPendingOrAccepted) {
        throw new HttpsError(
          'failed-precondition',
          'Cannot reinvite while there are pending or accepted invitations'
        );
      }

      // F. Check if new friend is already invited
      const alreadyInvited = currentInvitations.some(inv => inv.userId === newFriendId);
      if (alreadyInvited) {
        throw new HttpsError(
          'already-exists',
          'This friend has already been invited to this match'
        );
      }

      logger.info('📋 [REINVITE_FRIEND] Validation passed', {
        eventId,
        currentInvitationsCount: currentInvitations.length,
        allRejected: currentInvitations.every(inv => inv.status === 'rejected'),
      });

      // ✅ PHASE 2: ALL WRITES AFTER ALL READS

      // G. Add new invitation to friendInvitations array
      const newInvitation = {
        userId: newFriendId,
        userName: newFriendName,
        status: 'pending' as const,
        invitedAt: new Date().toISOString(),
      };

      const updatedInvitations = [...currentInvitations, newInvitation];

      // H. Update event document
      transaction.update(eventRef, {
        friendInvitations: updatedInvitations,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('✅ [REINVITE_FRIEND] Friend invitation added', {
        eventId,
        newFriendId,
        newFriendName,
        totalInvitations: updatedInvitations.length,
      });

      return {
        eventId,
        newFriendId,
        newFriendName,
        totalInvitations: updatedInvitations.length,
      };
    });

    logger.info('✅ [REINVITE_FRIEND] Transaction completed successfully', {
      result,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [REINVITE_FRIEND] Transaction failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError('internal', 'Failed to reinvite friend');
  }
});
