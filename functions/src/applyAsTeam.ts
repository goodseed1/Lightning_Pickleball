/**
 * 🎯 [OPERATION DUO - PHASE 2A] Apply as Team Cloud Function
 *
 * Handles team applications for doubles matches with partner invitation workflow.
 *
 * 🚨 CRITICAL REQUIREMENTS (Phase 2A):
 * 1. ✅ Separate Cloud Function - doesn't modify applyToEvent
 * 2. ✅ Optional fields - backward compatibility
 * 3. ✅ Partner must accept BEFORE host can see/approve
 * 4. ✅ 24-hour invitation expiry check
 * 5. ✅ Duplicate application prevention
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

export interface ApplyAsTeamRequest {
  eventId: string;
  applicantId: string;
  partnerId: string; // Required for team application
  partnerName: string; // Required for team application
  message?: string;
  applicantName?: string;
}

/**
 * 🎯 [OPERATION DUO - PHASE 2A] Apply as Team Cloud Function
 *
 * Creates a team application with partner invitation workflow:
 * 1. Check for duplicate applications (Requirement #5)
 * 2. Create application with status: 'pending_partner_approval' (Requirement #3)
 * 3. Create partner invitation with 24-hour expiry (Requirement #4)
 * 4. Link invitation to application
 *
 * @param request - Contains eventId, applicantId, partnerId, partnerName, optional message
 * @returns Success message with applicationId and invitationId
 */
export const applyAsTeam = onCall<ApplyAsTeamRequest>(async request => {
  const { data, auth } = request;

  // ✅ Authentication check
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to apply to event');
  }

  const { eventId, applicantId, partnerId, partnerName, message, applicantName } = data;
  const userId = auth.uid;

  // Verify the user is applying for themselves
  if (applicantId !== userId) {
    throw new HttpsError('permission-denied', 'You can only apply for yourself');
  }

  // Validate required fields for team application
  if (!eventId) {
    throw new HttpsError('invalid-argument', 'eventId is required');
  }

  if (!partnerId) {
    throw new HttpsError('invalid-argument', 'partnerId is required for team application');
  }

  if (!partnerName) {
    throw new HttpsError('invalid-argument', 'partnerName is required for team application');
  }

  // Prevent self-invitation
  if (partnerId === applicantId) {
    throw new HttpsError('invalid-argument', 'Cannot invite yourself as a partner');
  }

  try {
    logger.info('🎯 [APPLY_AS_TEAM] Starting team application process', {
      eventId,
      applicantId,
      partnerId,
      partnerName,
    });

    // Get event document to verify it exists
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new HttpsError('internal', 'Invalid event data');
    }

    // Verify event is a doubles match
    const gameType = eventData.gameType?.toLowerCase() || '';
    if (!gameType.includes('doubles')) {
      throw new HttpsError(
        'invalid-argument',
        'Team applications are only allowed for doubles matches'
      );
    }

    // 🚨 [REQUIREMENT #5] Check for duplicate applications
    // Check if user already has an ACTIVE application (not declined/rejected)
    const existingApplicationsQuery = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .where('applicantId', '==', applicantId)
      .get();

    // Filter for truly active applications (not declined/rejected/cancelled)
    const activeApplications = existingApplicationsQuery.docs.filter(doc => {
      const data = doc.data();
      const status = data.status;

      // Allow re-application if previous was declined, rejected, or cancelled
      if (status === 'declined' || status === 'rejected' || status === 'cancelled') {
        return false;
      }

      // 🆕 [KIM] Also allow re-application if partnerStatus was cancelled or rejected
      if (data.partnerStatus === 'cancelled' || data.partnerStatus === 'rejected') {
        return false;
      }

      // Check for active team applications (partner pending or accepted)
      if (data.partnerStatus === 'pending' || data.partnerStatus === 'accepted') {
        return true;
      }

      // Check for pending/approved solo applications
      if (status === 'pending' || status === 'approved' || status === 'pending_partner_approval') {
        return true;
      }

      return false;
    });

    if (activeApplications.length > 0) {
      const existingApp = activeApplications[0].data();
      logger.warn('⚠️ [APPLY_AS_TEAM] Duplicate application detected', {
        eventId,
        applicantId,
        existingApplicationId: activeApplications[0].id,
        existingStatus: existingApp.status,
        existingPartnerStatus: existingApp.partnerStatus,
      });
      throw new HttpsError(
        'already-exists',
        'You already have an active team application for this event'
      );
    }

    // Get applicant name if not provided
    let finalApplicantName = applicantName;

    if (!finalApplicantName) {
      try {
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

        if (!finalApplicantName) {
          finalApplicantName = `테니스유저${applicantId.substring(0, 4)}`;
        }
      } catch (error) {
        logger.warn('⚠️ [APPLY_AS_TEAM] Error fetching user profile:', error);
        finalApplicantName = `테니스유저${applicantId.substring(0, 4)}`;
      }
    }

    // 🎯 [REQUIREMENT #4] Calculate 24-hour expiry time
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Use transaction to create application and invitation atomically
    const result = await db.runTransaction(async transaction => {
      // ✅ PHASE 1: ALL READS FIRST

      // Re-read event to ensure it still exists
      const eventSnapshot = await transaction.get(eventRef);
      if (!eventSnapshot.exists) {
        throw new HttpsError('not-found', 'Event not found');
      }

      // ✅ PHASE 2: ALL WRITES AFTER ALL READS

      // Create application document with status: 'pending_partner_approval'
      // 🚨 [REQUIREMENT #3] Application is HIDDEN from host until partner accepts
      const applicationRef = db.collection('participation_applications').doc();
      transaction.set(applicationRef, {
        eventId,
        applicantId,
        applicantName: finalApplicantName,
        status: 'pending_partner_approval', // 🚨 CRITICAL: Hidden from host
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        message: message || '',
        // 🎯 [REQUIREMENT #2] Optional partner fields (backward compatibility)
        partnerId,
        partnerName,
        teamId: `${applicantId.substring(0, 3)}_${partnerId.substring(0, 3)}`, // Simple team identifier
        partnerStatus: 'pending', // Partner invitation pending
        // 🎯 [KIM FIX] Add hostId for badge count queries
        ...(eventData.hostId && { hostId: eventData.hostId }),
      });

      logger.info('✅ [APPLY_AS_TEAM] Application created (pending partner approval)', {
        applicationId: applicationRef.id,
        status: 'pending_partner_approval',
      });

      // Create partner invitation with 24-hour expiry
      const invitationRef = db.collection('partner_invitations').doc();
      transaction.set(invitationRef, {
        eventId,
        eventTitle: eventData.title || 'Doubles Match',
        gameType: eventData.gameType || 'doubles',
        inviterId: applicantId,
        inviterName: finalApplicantName,
        invitedUserId: partnerId,
        invitedUserName: partnerName,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt, // 🚨 [REQUIREMENT #4] 24-hour expiry
        // 🎯 [KIM FIX] Include event details for invitation card display
        ...(eventData.scheduledTime && { eventDate: eventData.scheduledTime }),
        ...(eventData.date && { eventDate: eventData.date }), // Also check 'date' field
        ...(eventData.time && { eventTime: eventData.time }),
        ...(eventData.location && { eventLocation: eventData.location }),
        // 🎯 [HOST TEAM INFO] Host team information for invitation card
        ...(eventData.hostName && { hostName: eventData.hostName }),
        ...(eventData.hostPartnerName && { hostPartnerName: eventData.hostPartnerName }),
        // Link to application for easy lookup
        applicationType: 'team_application',
        applicationId: applicationRef.id,
      });

      logger.info('✅ [APPLY_AS_TEAM] Partner invitation created', {
        invitationId: invitationRef.id,
        expiresAt: expiresAt.toISOString(),
      });

      // Link invitation to application
      transaction.update(applicationRef, {
        partnerInvitationId: invitationRef.id,
      });

      logger.info('✅ [APPLY_AS_TEAM] Invitation linked to application', {
        applicationId: applicationRef.id,
        invitationId: invitationRef.id,
      });

      // Update event's updatedAt to trigger host's listener (for future notifications)
      // NOTE: Host won't see this application until partner accepts
      transaction.update(eventRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        applicationId: applicationRef.id,
        invitationId: invitationRef.id,
      };
    });

    logger.info('✅ [APPLY_AS_TEAM] Team application completed successfully', {
      applicationId: result.applicationId,
      invitationId: result.invitationId,
      partnerId,
      partnerName,
    });

    // Try to send notification to partner (don't fail if this fails)
    try {
      // 🌍 [i18n] Use translation key instead of hardcoded Korean
      await db.collection('activity_notifications').add({
        userId: partnerId,
        type: 'partner_invitation',
        eventId,
        applicantId,
        applicantName: finalApplicantName,
        title: 'notification.partnerInvitationTitle',
        message: 'notification.partnerInvitationReceived',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        invitationId: result.invitationId,
        // 🎯 [i18n] Include data for interpolation on client
        data: {
          inviterName: finalApplicantName,
          eventTitle: eventData.title || 'Doubles Match',
        },
      });
      logger.info('✅ [APPLY_AS_TEAM] Notification sent to partner', { partnerId });
    } catch (notifError) {
      logger.warn('[APPLY_AS_TEAM] Failed to send notification (non-critical):', notifError);
    }

    return {
      success: true,
      message: 'Team application submitted successfully. Waiting for partner to accept invitation.',
      applicationId: result.applicationId,
      invitationId: result.invitationId,
      eventId,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: unknown) {
    logger.error('❌ [APPLY_AS_TEAM] Error applying as team:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Failed to apply as team', errorMessage);
  }
});
