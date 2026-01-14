/**
 * 🎯 [OPERATION DUO] Phase 4.5+: Partner Re-invitation
 *
 * Callable Cloud Function to reinvite a different partner after rejection.
 * - Cancel old invitation (mark as 'cancelled')
 * - Create new invitation for new partner
 * - Transaction ensures atomic updates
 *
 * @author Kim
 * @date 2025-11-27
 */

// ✅ [v2] Firebase Functions v2 API
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface ReinvitePartnerRequest {
  eventId: string;
  oldInvitationId: string | null; // 🚀 [EMERGENCY FIX] Optional: null for first-time invites
  newPartnerId: string;
  newPartnerName: string;
}

/**
 * 🎯 [OPERATION DUO] reinvitePartner Cloud Function
 *
 * Allows host to reinvite a different partner after previous rejection
 */
export const reinvitePartner = onCall<ReinvitePartnerRequest>(async request => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const auth = request.auth;
  const { eventId, oldInvitationId, newPartnerId, newPartnerName } = request.data;

  logger.info('🔄 [REINVITE_PARTNER] Reinvitation request received', {
    eventId,
    oldInvitationId,
    newPartnerId,
    hostId: auth.uid,
  });

  // 2. Transaction: Cancel old invitation + Create new invitation
  try {
    const result = await db.runTransaction(async transaction => {
      // ✅ PHASE 1: ALL READS FIRST (Firestore transaction requirement)

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
        logger.warn('🚫 [REINVITE_PARTNER] Unauthorized attempt', {
          hostId: eventData.hostId,
          requesterId: auth.uid,
        });
        throw new HttpsError('permission-denied', 'Only the host can reinvite partners');
      }

      // C. Check event status
      if (eventData.status !== 'partner_pending') {
        logger.warn('⚠️ [REINVITE_PARTNER] Invalid event status', {
          currentStatus: eventData.status,
        });
        throw new HttpsError(
          'failed-precondition',
          `Cannot reinvite partner when event status is ${eventData.status}`
        );
      }

      // D. 🔥 [KIM FIX] Get Inviter's Display Name (READ before WRITE!)
      const inviterRef = db.collection('users').doc(auth.uid);
      const inviterDoc = await transaction.get(inviterRef);
      const inviterData = inviterDoc.exists ? inviterDoc.data() : null;
      const inviterDisplayName = inviterData
        ? inviterData?.fullName || inviterData?.name || inviterData?.displayName || 'Unknown'
        : 'Unknown';

      logger.info('📋 [REINVITE_PARTNER] Inviter info fetched', {
        inviterId: auth.uid,
        inviterDisplayName,
      });

      // E. Get Old Invitation Document (READ before WRITE!) - OPTIONAL
      // 🚀 [EMERGENCY FIX] oldInvitationId is optional (null for first-time invites)
      let oldInviteData: FirebaseFirestore.DocumentData | null = null;
      let oldInviteRef: FirebaseFirestore.DocumentReference | null = null;

      if (oldInvitationId) {
        // Re-invitation scenario: Validate and prepare to cancel old invitation
        oldInviteRef = db.collection('partner_invitations').doc(oldInvitationId);
        const oldInviteDoc = await transaction.get(oldInviteRef);

        if (!oldInviteDoc.exists) {
          throw new HttpsError('not-found', 'Previous invitation not found');
        }

        oldInviteData = oldInviteDoc.data() || null;
        if (!oldInviteData) {
          throw new HttpsError('internal', 'Invalid invitation data');
        }

        // E. Verify old invitation belongs to this event
        if (oldInviteData.eventId !== eventId) {
          throw new HttpsError('invalid-argument', 'Invitation does not belong to this event');
        }

        // F. Verify old invitation is rejected
        if (oldInviteData.status !== 'rejected') {
          logger.warn('⚠️ [REINVITE_PARTNER] Cannot reinvite when status is not rejected', {
            currentStatus: oldInviteData.status,
          });
          throw new HttpsError(
            'failed-precondition',
            'Can only reinvite after previous invitation was rejected'
          );
        }

        logger.info('📋 [REINVITE_PARTNER] Old invitation validated (will be cancelled)', {
          oldInvitationId,
          oldStatus: oldInviteData.status,
        });
      } else {
        // First-time invitation scenario: No previous invitation to cancel
        logger.info(
          '🆕 [REINVITE_PARTNER] First-time invitation (no previous invitation to cancel)'
        );
      }

      // ✅ PHASE 2: ALL WRITES AFTER ALL READS

      // G. Cancel old invitation (mark as 'cancelled') - CONDITIONAL
      if (oldInvitationId && oldInviteRef) {
        transaction.update(oldInviteRef, {
          status: 'cancelled',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelReason: 'Host reinvited different partner',
        });

        logger.info('📝 [REINVITE_PARTNER] Old invitation cancelled', {
          oldInvitationId,
        });
      }

      // H. Create new invitation
      const newInviteRef = db.collection('partner_invitations').doc();
      transaction.set(newInviteRef, {
        eventId,
        inviterId: auth.uid,
        inviterName: inviterDisplayName, // 🔥 [KIM FIX] Use fetched displayName instead of non-existent createdByName
        invitedUserId: newPartnerId,
        invitedUserName: newPartnerName, // 🔥 FIX: inviteeName → invitedUserName (match type definition)
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 🔥 FIX: Add 24-hour expiration
        eventTitle: eventData.title,
        eventDate: eventData.date,
        eventTime: eventData.time || '', // 🔥 FIX: Add eventTime field with fallback
        eventLocation: eventData.location,
        gameType: eventData.gameType,
      });

      logger.info('✅ [REINVITE_PARTNER] New invitation created', {
        newInvitationId: newInviteRef.id,
        newPartnerId,
      });

      // I. 🔥 [KIM FIX] Update event with new partner info + CRITICAL FIELDS
      transaction.update(eventRef, {
        partnerId: newPartnerId,
        partnerName: newPartnerName,
        hostPartnerId: newPartnerId, // 🔥 [KIM FIX] Update hostPartnerId for new partner
        hostPartnerName: newPartnerName, // 🔥 [KIM FIX] Update hostPartnerName for new partner
        partnerStatus: 'pending', // 🔥 [KIM FIX] CRITICAL: Set status to 'pending' for new invitation
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('📝 [REINVITE_PARTNER] Event updated with new partner', {
        eventId,
        newPartnerId,
      });

      return {
        eventId,
        oldInvitationId,
        newInvitationId: newInviteRef.id,
        newPartnerId,
      };
    });

    logger.info('✅ [REINVITE_PARTNER] Transaction completed successfully', {
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

    logger.error('❌ [REINVITE_PARTNER] Transaction failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError('internal', 'Failed to reinvite partner');
  }
});
