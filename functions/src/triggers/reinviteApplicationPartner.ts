/**
 * 🎯 [OPERATION DUO - PHASE 2A] Reinvite Application Partner
 *
 * Callable Cloud Function to reinvite a different partner for a team application.
 * - Cancel old invitation (mark as 'cancelled')
 * - Create new invitation for new partner
 * - Update application with new partner info
 * - Transaction ensures atomic updates
 *
 * @author Kim
 * @date 2025-11-30
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

interface ReinviteApplicationPartnerRequest {
  applicationId: string;
  oldInvitationId: string | null; // Optional: null for first-time invites
  newPartnerId: string;
  newPartnerName: string;
}

/**
 * 🎯 [OPERATION DUO - PHASE 2A] reinviteApplicationPartner Cloud Function
 *
 * Allows applicant to reinvite a different partner for their team application
 */
export const reinviteApplicationPartner = onCall<ReinviteApplicationPartnerRequest>(
  async request => {
    // 1. Auth Check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in.');
    }

    const auth = request.auth;
    const { applicationId, oldInvitationId, newPartnerId, newPartnerName } = request.data;

    logger.info('🔄 [REINVITE_APPLICATION_PARTNER] Reinvitation request received', {
      applicationId,
      oldInvitationId,
      newPartnerId,
      applicantId: auth.uid,
    });

    // 2. Transaction: Cancel old invitation + Create new invitation + Update application
    try {
      const result = await db.runTransaction(async transaction => {
        // ✅ PHASE 1: ALL READS FIRST (Firestore transaction requirement)

        // A. Get Application Document
        const applicationRef = db.collection('participation_applications').doc(applicationId);
        const applicationDoc = await transaction.get(applicationRef);

        if (!applicationDoc.exists) {
          throw new HttpsError('not-found', 'Application not found');
        }

        const applicationData = applicationDoc.data();
        if (!applicationData) {
          throw new HttpsError('internal', 'Invalid application data');
        }

        // B. Security: Verify the requester is the applicant
        if (applicationData.applicantId !== auth.uid) {
          logger.warn('🚫 [REINVITE_APPLICATION_PARTNER] Unauthorized attempt', {
            applicantId: applicationData.applicantId,
            requesterId: auth.uid,
          });
          throw new HttpsError('permission-denied', 'Only the applicant can reinvite partners');
        }

        // C. Check application status (must be 'pending_partner_approval' or has rejected partner)
        if (
          applicationData.status !== 'pending_partner_approval' &&
          applicationData.partnerStatus !== 'rejected'
        ) {
          logger.warn('⚠️ [REINVITE_APPLICATION_PARTNER] Invalid application status', {
            currentStatus: applicationData.status,
            partnerStatus: applicationData.partnerStatus,
          });
          throw new HttpsError(
            'failed-precondition',
            `Cannot reinvite partner when application status is ${applicationData.status} and partner status is ${applicationData.partnerStatus}`
          );
        }

        // D. Get Event Document (for invitation details)
        const eventRef = db.collection('events').doc(applicationData.eventId);
        const eventDoc = await transaction.get(eventRef);

        if (!eventDoc.exists) {
          throw new HttpsError('not-found', 'Event not found');
        }

        const eventData = eventDoc.data();
        if (!eventData) {
          throw new HttpsError('internal', 'Invalid event data');
        }

        // E. Get Applicant's Display Name (READ before WRITE!)
        const applicantRef = db.collection('users').doc(auth.uid);
        const applicantDoc = await transaction.get(applicantRef);
        const applicantDisplayName = applicantDoc.exists
          ? applicantDoc.data()?.displayName || applicationData.applicantName || 'Unknown'
          : applicationData.applicantName || 'Unknown';

        logger.info('📋 [REINVITE_APPLICATION_PARTNER] Applicant info fetched', {
          applicantId: auth.uid,
          applicantDisplayName,
        });

        // F. Get Old Invitation Document (READ before WRITE!) - OPTIONAL
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

          // Verify old invitation belongs to this application
          if (oldInviteData.applicationId !== applicationId) {
            throw new HttpsError(
              'invalid-argument',
              'Invitation does not belong to this application'
            );
          }

          // Verify old invitation is rejected or pending
          if (oldInviteData.status !== 'rejected' && oldInviteData.status !== 'pending') {
            logger.warn(
              '⚠️ [REINVITE_APPLICATION_PARTNER] Cannot reinvite when status is not rejected/pending',
              {
                currentStatus: oldInviteData.status,
              }
            );
            throw new HttpsError(
              'failed-precondition',
              'Can only reinvite after previous invitation was rejected or is still pending'
            );
          }

          logger.info(
            '📋 [REINVITE_APPLICATION_PARTNER] Old invitation validated (will be cancelled)',
            {
              oldInvitationId,
              oldStatus: oldInviteData.status,
            }
          );
        } else {
          // First-time invitation scenario: No previous invitation to cancel
          logger.info(
            '🆕 [REINVITE_APPLICATION_PARTNER] First-time invitation (no previous invitation to cancel)'
          );
        }

        // ✅ PHASE 2: ALL WRITES AFTER ALL READS

        // G. Cancel old invitation (mark as 'cancelled') - CONDITIONAL
        if (oldInvitationId && oldInviteRef) {
          transaction.update(oldInviteRef, {
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelReason: 'Applicant reinvited different partner',
          });

          logger.info('📝 [REINVITE_APPLICATION_PARTNER] Old invitation cancelled', {
            oldInvitationId,
          });
        }

        // H. Create new invitation
        const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const newInviteRef = db.collection('partner_invitations').doc();
        transaction.set(newInviteRef, {
          eventId: applicationData.eventId,
          inviterId: auth.uid,
          inviterName: applicantDisplayName,
          invitedUserId: newPartnerId,
          invitedUserName: newPartnerName,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt, // 🚨 [REQUIREMENT #4] 24-hour expiry
          eventTitle: eventData.title || 'Doubles Match',
          gameType: eventData.gameType || 'doubles',
          // Link to application
          applicationType: 'team_application',
          applicationId,
        });

        logger.info('✅ [REINVITE_APPLICATION_PARTNER] New invitation created', {
          newInvitationId: newInviteRef.id,
          newPartnerId,
        });

        // I. Update application with new partner info
        transaction.update(applicationRef, {
          partnerId: newPartnerId,
          partnerName: newPartnerName,
          partnerStatus: 'pending', // Reset to pending
          partnerInvitationId: newInviteRef.id,
          status: 'pending_partner_approval', // Keep hidden from host
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('📝 [REINVITE_APPLICATION_PARTNER] Application updated with new partner', {
          applicationId,
          newPartnerId,
        });

        return {
          applicationId,
          oldInvitationId,
          newInvitationId: newInviteRef.id,
          newPartnerId,
        };
      });

      logger.info('✅ [REINVITE_APPLICATION_PARTNER] Transaction completed successfully', {
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

      logger.error('❌ [REINVITE_APPLICATION_PARTNER] Transaction failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new HttpsError('internal', 'Failed to reinvite partner');
    }
  }
);
