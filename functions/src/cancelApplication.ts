/**
 * 🛡️ [CAPTAIN AMERICA] Cancel Application Cloud Function
 *
 * Cancels a participation application and triggers host's real-time listener
 * by updating both application and event documents atomically.
 *
 * 🔄 [HEIMDALL] Uses Firebase Functions v2 API
 * 🎾 [KIM] v2: Both applicant AND partner can cancel team applications
 */

// ✅ [v2] Updated imports
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface CancelApplicationRequest {
  applicationId: string;
}

/**
 * Cancel Application Cloud Function
 *
 * Cancels a participation application and triggers host's real-time listener
 * by updating both application and event documents atomically using Admin SDK.
 *
 * 🎾 [KIM] v2: Both applicant AND partner (if accepted) can cancel the application
 * - Applicant cancels → Partner gets notified
 * - Partner cancels → Applicant gets notified
 *
 * @param request - Contains applicationId
 * @param context - Authentication context
 * @returns Success message with applicationId and eventId
 */
export const cancelApplication = onCall<CancelApplicationRequest>(async request => {
  const { data, auth } = request;

  // ✅ Authentication check
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to cancel application');
  }

  const { applicationId } = data;
  const userId = auth.uid;

  if (!applicationId) {
    throw new HttpsError('invalid-argument', 'applicationId is required');
  }

  try {
    logger.info('🛡️ [CANCEL_APPLICATION] Starting cancellation', {
      applicationId,
      userId,
    });

    // Get application document
    const applicationRef = db.collection('participation_applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new HttpsError('not-found', 'Application not found');
    }

    const applicationData = applicationDoc.data();
    const applicantId = applicationData?.applicantId;
    const partnerId = applicationData?.partnerId;
    const partnerStatus = applicationData?.partnerStatus;

    // 🎾 [KIM] v2: Allow both applicant AND accepted partner to cancel
    const isApplicant = applicantId === userId;
    const isAcceptedPartner = partnerId === userId && partnerStatus === 'accepted';

    if (!isApplicant && !isAcceptedPartner) {
      throw new HttpsError(
        'permission-denied',
        'You can only cancel your own application or team application you are part of'
      );
    }

    // Determine who to notify (the OTHER team member)
    const cancelledByApplicant = isApplicant;
    const notifyUserId = cancelledByApplicant ? partnerId : applicantId;
    const cancellerName = cancelledByApplicant
      ? applicationData?.applicantName || 'Your partner'
      : applicationData?.partnerName || 'Your partner';

    logger.info('🎾 [CANCEL_APPLICATION] Cancel request details', {
      cancelledByApplicant,
      cancellerUserId: userId,
      cancellerName,
      notifyUserId,
    });

    const eventId = applicationData?.eventId;

    if (!eventId) {
      throw new HttpsError('failed-precondition', 'Event ID not found in application');
    }

    // Use batch to update both application and event atomically
    const batch = db.batch();

    // Update application status
    // 🆕 [KIM] Also update partnerStatus to prevent duplicate check issues in applyAsTeam
    batch.update(applicationRef, {
      status: 'cancelled',
      partnerStatus: 'cancelled', // Clear partner status so user can re-apply
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update event's updatedAt to trigger host's listener
    const eventRef = db.collection('events').doc(eventId);
    batch.update(eventRef, {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🆕 [KIM] Delete partner invitation if exists
    // Query for partner invitations linked to this application
    const partnerInvitationsQuery = db
      .collection('partner_invitations')
      .where('applicationId', '==', applicationId)
      .where('status', '==', 'pending');

    const partnerInvitationsSnapshot = await partnerInvitationsQuery.get();

    if (!partnerInvitationsSnapshot.empty) {
      partnerInvitationsSnapshot.docs.forEach(doc => {
        logger.info('🗑️ [CANCEL_APPLICATION] Deleting partner invitation', {
          invitationId: doc.id,
          invitedUserId: doc.data().invitedUserId,
        });
        batch.delete(doc.ref);
      });
    }

    await batch.commit();

    logger.info('✅ [CANCEL_APPLICATION] Application cancelled and event updated', {
      applicationId,
      eventId,
      userId,
      partnerInvitationsDeleted: partnerInvitationsSnapshot.size,
    });

    // 🎾 [KIM] v2: Notify the OTHER team member (if team application with accepted partner)
    if (notifyUserId && partnerStatus === 'accepted') {
      try {
        // Get event title for notification
        const eventDoc = await eventRef.get();
        const eventData = eventDoc.data();
        const eventTitle = eventData?.title || eventData?.name || 'Pickleball Match';

        logger.info('🔔 [CANCEL_APPLICATION] Notifying team member', {
          notifyUserId,
          cancellerName,
          eventTitle,
        });

        // Create feed item for the other team member
        await db.collection('feed').add({
          type: 'team_application_cancelled_by_partner',
          actorId: userId,
          actorName: cancellerName,
          targetId: notifyUserId,
          eventId: eventId,
          eventTitle: eventTitle,
          metadata: {
            eventType: eventData?.gameType || 'doubles',
            eventTitle: eventTitle,
            applicationId: applicationId,
            cancellationReason: 'team_member_cancelled',
          },
          visibility: 'private',
          visibleTo: [notifyUserId],
          isActive: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('✅ [CANCEL_APPLICATION] Team member notification sent', { notifyUserId });
      } catch (notifError) {
        // Don't fail the cancellation if notification fails
        logger.warn(
          '⚠️ [CANCEL_APPLICATION] Failed to notify team member (non-critical):',
          notifError
        );
      }
    }

    // 🎾 [KIM FIX] Notify the HOST that an application was cancelled
    try {
      const eventDoc = await eventRef.get();
      const eventData = eventDoc.data();
      const hostId = eventData?.hostId;
      const eventTitle = eventData?.title || eventData?.name || 'Pickleball Match';

      // Only notify host if the canceller is not the host themselves
      if (hostId && hostId !== userId) {
        const cancellerDisplayName =
          applicationData?.applicantName || applicationData?.partnerName || 'A participant';

        logger.info('🔔 [CANCEL_APPLICATION] Notifying host about cancellation', {
          hostId,
          cancellerDisplayName,
          eventTitle,
        });

        // Create feed item for the host
        await db.collection('feed').add({
          type: 'application_cancelled',
          actorId: userId,
          actorName: cancellerDisplayName,
          targetId: hostId,
          eventId: eventId,
          eventTitle: eventTitle,
          metadata: {
            eventType: eventData?.gameType || 'match',
            eventTitle: eventTitle,
            applicationId: applicationId,
            applicantName: applicationData?.applicantName,
            partnerName: applicationData?.partnerName,
          },
          visibility: 'private',
          visibleTo: [hostId],
          isActive: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('✅ [CANCEL_APPLICATION] Host notification sent', { hostId });
      }
    } catch (hostNotifError) {
      // Don't fail the cancellation if host notification fails
      logger.warn('⚠️ [CANCEL_APPLICATION] Failed to notify host (non-critical):', hostNotifError);
    }

    return {
      success: true,
      message: 'Application cancelled successfully',
      applicationId,
      eventId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ [CANCEL_APPLICATION] Error cancelling application', {
      error: errorMessage,
      applicationId,
      userId,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to cancel application', errorMessage);
  }
});
