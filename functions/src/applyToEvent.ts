/**
 * 🛡️ [CAPTAIN AMERICA] Apply to Event Cloud Function
 *
 * Creates a participation application and triggers host's real-time listener
 * by updating both application and event documents atomically.
 *
 * 🔄 [HEIMDALL] Uses Firebase Functions v2 API
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

export interface ApplyToEventRequest {
  eventId: string;
  applicantId: string;
  message?: string;
  applicantName?: string;
}

/**
 * Apply to Event Cloud Function
 *
 * Creates a participation application and triggers host's real-time listener
 * by updating both application and event documents atomically using Admin SDK.
 *
 * @param request - Contains eventId, applicantId, optional message and applicantName
 * @returns Success message with applicationId and eventId
 */
export const applyToEvent = onCall<ApplyToEventRequest>(async request => {
  const { data, auth } = request;

  // ✅ Authentication check
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to apply to event');
  }

  const { eventId, applicantId, message, applicantName } = data;
  const userId = auth.uid;

  // Verify the user is applying for themselves
  if (applicantId !== userId) {
    throw new HttpsError('permission-denied', 'You can only apply for yourself');
  }

  if (!eventId) {
    throw new HttpsError('invalid-argument', 'eventId is required');
  }

  try {
    logger.info('🛡️ [APPLY_TO_EVENT] Starting application process', {
      eventId,
      applicantId,
    });

    // Get event document to verify it exists
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }

    // Check if user already applied
    const existingApplicationsQuery = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .where('applicantId', '==', applicantId)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    if (!existingApplicationsQuery.empty) {
      throw new HttpsError('already-exists', 'You have already applied to this event');
    }

    // 🎯 [KIM FIX] Check autoApproval setting and current participants
    const eventData = eventDoc.data();
    const autoApproval = eventData?.autoApproval === true;
    const maxParticipants = eventData?.maxParticipants || 4;
    const currentParticipants = eventData?.currentParticipants || 1; // Host counts as 1

    // Check if event is full
    if (currentParticipants >= maxParticipants) {
      throw new HttpsError('failed-precondition', 'Event is already full');
    }

    // Determine initial status based on autoApproval setting
    const initialStatus = autoApproval ? 'approved' : 'pending';

    logger.info('🎯 [APPLY_TO_EVENT] Auto-approval check', {
      autoApproval,
      initialStatus,
      currentParticipants,
      maxParticipants,
    });

    // Get applicant name if not provided
    let finalApplicantName = applicantName;

    if (!finalApplicantName) {
      try {
        // Try users collection first
        const userDoc = await db.collection('users').doc(applicantId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          finalApplicantName =
            userData?.displayName ||
            userData?.nickname ||
            userData?.name ||
            userData?.firstName ||
            (userData?.email ? userData.email.split('@')[0] : null);
        }

        // Try profiles collection if not found
        if (!finalApplicantName) {
          const profileDoc = await db.collection('profiles').doc(applicantId).get();
          if (profileDoc.exists) {
            const profileData = profileDoc.data();
            finalApplicantName =
              profileData?.displayName ||
              profileData?.nickname ||
              profileData?.name ||
              profileData?.firstName ||
              (profileData?.email ? profileData.email.split('@')[0] : null);
          }
        }

        // Fallback to user ID substring
        if (!finalApplicantName) {
          finalApplicantName = `테니스유저${applicantId.substring(0, 4)}`;
        }
      } catch (error) {
        logger.warn('Error fetching user profile:', error);
        finalApplicantName = `테니스유저${applicantId.substring(0, 4)}`;
      }
    }

    // Use batch to create application and update event atomically
    const batch = db.batch();

    // Create application document with auto-approval status if enabled
    const applicationRef = db.collection('participation_applications').doc();
    const hostId = eventData?.hostId;
    const applicationData: Record<string, unknown> = {
      eventId,
      applicantId,
      applicantName: finalApplicantName,
      status: initialStatus, // 🎯 [KIM FIX] 'approved' if autoApproval, else 'pending'
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      message: message || '',
      // 🎯 [KIM FIX] Add hostId for badge count queries
      ...(hostId && { hostId }),
    };

    // 🎯 [KIM FIX] Add processedAt for auto-approved applications
    if (initialStatus === 'approved') {
      applicationData.processedAt = admin.firestore.FieldValue.serverTimestamp();
      applicationData.autoApproved = true;
    }

    batch.set(applicationRef, applicationData);

    // 🎯 [KIM FIX] Update event - increment currentParticipants if auto-approved
    if (initialStatus === 'approved') {
      batch.update(eventRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        currentParticipants: admin.firestore.FieldValue.increment(1),
      });
    } else {
      batch.update(eventRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    logger.info('✅ [APPLY_TO_EVENT] Application created and event updated', {
      applicationId: applicationRef.id,
      eventId,
      applicantId,
      applicantName: finalApplicantName,
      status: initialStatus,
      autoApproved: initialStatus === 'approved',
    });

    // Try to send notification (don't fail if this fails)
    try {
      const hostId = eventData?.hostId;

      if (hostId) {
        // 🌍 [i18n] Use translation keys instead of hardcoded Korean
        const notificationType =
          initialStatus === 'approved' ? 'application_auto_approved' : 'application_submitted';
        const notificationTitle =
          initialStatus === 'approved'
            ? 'notification.applicationAutoApprovedTitle'
            : 'notification.newApplicationTitle';
        const notificationMessage =
          initialStatus === 'approved'
            ? 'notification.applicationAutoApproved'
            : 'notification.applicationSubmitted';

        await db.collection('activity_notifications').add({
          userId: hostId,
          type: notificationType,
          eventId,
          applicantId,
          applicantName: finalApplicantName,
          title: notificationTitle,
          message: notificationMessage,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          // 🎯 [i18n] Include data for interpolation on client
          data: {
            applicantName: finalApplicantName,
            eventTitle: eventData?.title || '',
          },
        });
        logger.info('✅ [APPLY_TO_EVENT] Notification sent to host', {
          hostId,
          type: initialStatus,
        });
      }
    } catch (notifError) {
      logger.warn('[APPLY_TO_EVENT] Failed to send notification (non-critical):', notifError);
    }

    return {
      success: true,
      message:
        initialStatus === 'approved'
          ? 'Application auto-approved successfully'
          : 'Application submitted successfully',
      applicationId: applicationRef.id,
      eventId,
      status: initialStatus, // 🎯 [KIM FIX] Return status to client
      autoApproved: initialStatus === 'approved',
    };
  } catch (error: unknown) {
    logger.error('❌ [APPLY_TO_EVENT] Error applying to event:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Failed to apply to event', errorMessage);
  }
});
