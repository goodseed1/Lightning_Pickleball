/**
 * 🎯 [OPERATION SOLO LOBBY - PHASE 1] Apply as Solo Cloud Function
 *
 * Handles solo applications for doubles matches. Allows users to apply
 * individually without a partner and get matched with other solo applicants.
 *
 * 🚨 CRITICAL REQUIREMENTS:
 * 1. ✅ Create application with status: 'looking_for_partner'
 * 2. ✅ Duplicate application prevention
 * 3. ✅ Only allow solo applications for doubles matches
 * 4. ✅ Notify existing solo applicants of new partner candidate
 *
 * @author Kim
 * @date 2025-12-08
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

export interface ApplyAsSoloRequest {
  eventId: string;
  applicantId: string;
  applicantName?: string;
  message?: string;
}

/**
 * Get user's push token from Firestore
 * @param userId - User ID
 * @returns Push token or null
 */
async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      logger.warn(`⚠️ [APPLY_AS_SOLO] User not found: ${userId}`);
      return null;
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      logger.info(`⚠️ [APPLY_AS_SOLO] User ${userId} does not have a push token`);
      return null;
    }

    return pushToken;
  } catch (error: unknown) {
    logger.error(`❌ [APPLY_AS_SOLO] Failed to get push token for user ${userId}:`, error);
    return null;
  }
}

/**
 * Send push notification via Expo Push Notification Service
 * @param pushToken - Expo push token
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Additional data payload
 * @returns Success status
 */
async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'solo-lobby',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.errors) {
      logger.error('❌ [APPLY_AS_SOLO] Push notification errors:', result.errors);
      return { success: false, error: result.errors[0]?.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ [APPLY_AS_SOLO] Failed to send push notification:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Log push notification to Firestore
 * @param userId - User ID
 * @param type - Notification type
 * @param metadata - Additional metadata
 * @param status - Notification status
 */
async function logPushNotification(
  userId: string,
  type: string,
  metadata: Record<string, unknown>,
  status: 'sent' | 'failed'
): Promise<void> {
  try {
    await db.collection('push_notification_logs').add({
      userId,
      type,
      ...metadata,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error: unknown) {
    logger.error('❌ [APPLY_AS_SOLO] Failed to log push notification:', error);
  }
}

/**
 * 🎯 [OPERATION SOLO LOBBY - PHASE 1] Apply as Solo Cloud Function
 *
 * Creates a solo application for doubles matches:
 * 1. Check for duplicate applications
 * 2. Verify event is a doubles match
 * 3. Create application with status: 'looking_for_partner'
 * 4. Notify existing solo applicants of new partner candidate
 *
 * @param request - Contains eventId, applicantId, optional message
 * @returns Success message with applicationId
 */
export const applyAsSolo = onCall<ApplyAsSoloRequest>(async request => {
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

  // Validate required fields
  if (!eventId) {
    throw new HttpsError('invalid-argument', 'eventId is required');
  }

  try {
    logger.info('🎯 [APPLY_AS_SOLO] Starting solo application process', {
      eventId,
      applicantId,
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
        'Solo applications are only allowed for doubles matches'
      );
    }

    // 🚨 Check for duplicate applications
    // Check if user already has an ACTIVE application (not declined/rejected/cancelled)
    const existingApplicationsQuery = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .where('applicantId', '==', applicantId)
      .get();

    // 🎯 [KIM FIX] Track applications to auto-cancel when switching to solo
    const applicationsToCancel: FirebaseFirestore.DocumentReference[] = [];

    // Filter for truly active applications
    const activeApplications = existingApplicationsQuery.docs.filter(doc => {
      const data = doc.data();
      const status = data.status;

      // Allow re-application if previous was declined, rejected, or cancelled
      if (status === 'declined' || status === 'rejected' || status === 'cancelled') {
        return false;
      }

      // 🎯 [KIM FIX] If pending_partner_approval (team application waiting for partner),
      // mark it for auto-cancellation so user can switch to solo
      if (status === 'pending_partner_approval') {
        logger.info('🎯 [APPLY_AS_SOLO] Found pending team application, will auto-cancel', {
          applicationId: doc.id,
          status,
        });
        applicationsToCancel.push(doc.ref);
        return false; // Don't block - will be cancelled
      }

      // Check for active applications that truly block
      if (status === 'pending' || status === 'approved' || status === 'looking_for_partner') {
        return true;
      }

      return false;
    });

    if (activeApplications.length > 0) {
      const existingApp = activeApplications[0].data();
      logger.warn('⚠️ [APPLY_AS_SOLO] Duplicate application detected', {
        eventId,
        applicantId,
        existingApplicationId: activeApplications[0].id,
        existingStatus: existingApp.status,
      });

      // 🎯 [KIM FIX] Provide better error message based on status
      const existingStatus = existingApp.status;
      let errorMessage = 'You already have an active application for this event';

      if (existingStatus === 'approved') {
        errorMessage = '이미 승인된 신청이 있습니다';
      } else if (existingStatus === 'pending') {
        errorMessage =
          '이미 대기 중인 신청이 있습니다. 솔로로 전환하려면 기존 신청을 취소해주세요.';
      } else if (existingStatus === 'looking_for_partner') {
        errorMessage = '이미 파트너를 찾는 중입니다';
      }

      throw new HttpsError('already-exists', errorMessage);
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
          finalApplicantName = `피클볼유저${applicantId.substring(0, 4)}`;
        }
      } catch (error) {
        logger.warn('⚠️ [APPLY_AS_SOLO] Error fetching user profile:', error);
        finalApplicantName = `피클볼유저${applicantId.substring(0, 4)}`;
      }
    }

    // 🎯 Get existing solo applicants for notification
    const existingSoloApplicantsQuery = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .where('status', '==', 'looking_for_partner')
      .get();

    const existingSoloApplicants = existingSoloApplicantsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        applicantId: data.applicantId as string,
        applicantName: data.applicantName as string,
      };
    });

    // Use transaction to create application atomically
    const applicationId = await db.runTransaction(async transaction => {
      // ✅ PHASE 1: ALL READS FIRST
      const eventSnapshot = await transaction.get(eventRef);
      if (!eventSnapshot.exists) {
        throw new HttpsError('not-found', 'Event not found');
      }

      // ✅ PHASE 2: ALL WRITES AFTER ALL READS

      // 🎯 [KIM FIX] Cancel pending team applications before creating solo application
      if (applicationsToCancel.length > 0) {
        logger.info('🎯 [APPLY_AS_SOLO] Auto-cancelling pending team applications', {
          count: applicationsToCancel.length,
        });
        for (const appRef of applicationsToCancel) {
          transaction.update(appRef, {
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelReason: 'User switched to solo application',
          });
        }
      }

      // Create application document with status: 'looking_for_partner'
      const applicationRef = db.collection('participation_applications').doc();
      transaction.set(applicationRef, {
        eventId,
        applicantId,
        applicantName: finalApplicantName,
        status: 'looking_for_partner', // 🚨 CRITICAL: Solo application status
        applicationType: 'solo', // Distinguish from team applications
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        message: message || '',
        // 🎯 [KIM FIX] Add hostId for badge count queries
        ...(eventData.hostId && { hostId: eventData.hostId }),
      });

      logger.info('✅ [APPLY_AS_SOLO] Solo application created', {
        applicationId: applicationRef.id,
        status: 'looking_for_partner',
      });

      // Update event's updatedAt to trigger host's listener
      transaction.update(eventRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return applicationRef.id;
    });

    logger.info('✅ [APPLY_AS_SOLO] Solo application completed successfully', {
      applicationId,
      applicantId,
      applicantName: finalApplicantName,
    });

    // 💥 Notify existing solo applicants about new partner candidate
    if (existingSoloApplicants.length > 0) {
      logger.info('📣 [APPLY_AS_SOLO] Notifying existing solo applicants', {
        count: existingSoloApplicants.length,
      });

      // Send notifications in parallel (don't wait for all to complete)
      const notificationPromises = existingSoloApplicants.map(async soloApplicant => {
        try {
          const soloApplicantId = soloApplicant.applicantId as string;

          // Skip self
          if (soloApplicantId === applicantId) {
            return;
          }

          // Get push token
          const pushToken = await getUserPushToken(soloApplicantId);
          if (!pushToken) {
            logger.info(`⚠️ [APPLY_AS_SOLO] No push token for user ${soloApplicantId}`);
            return;
          }

          // Send push notification
          const result = await sendExpoPushNotification(
            pushToken,
            '🎾 새로운 파트너 후보!',
            `${finalApplicantName}님이 '${eventData.title || '번개매치'}'에서 파트너를 찾고 있어요.`,
            {
              type: 'new_solo_applicant',
              notificationType: 'NEW_SOLO_APPLICANT',
              eventId,
              eventTitle: eventData.title || '번개매치',
              applicantId,
              applicantName: finalApplicantName,
              applicationId,
            }
          );

          // Log notification
          await logPushNotification(
            soloApplicantId,
            'new_solo_applicant',
            { eventId, applicantId, applicationId },
            result.success ? 'sent' : 'failed'
          );

          if (result.success) {
            logger.info(`✅ [APPLY_AS_SOLO] Notification sent to ${soloApplicantId}`);
          }
        } catch (notifError) {
          logger.warn(
            `⚠️ [APPLY_AS_SOLO] Failed to send notification to ${soloApplicant.applicantId}:`,
            notifError
          );
        }
      });

      // Fire and forget notifications (don't block response)
      Promise.all(notificationPromises).catch(error => {
        logger.warn('⚠️ [APPLY_AS_SOLO] Some notifications failed (non-critical):', error);
      });
    }

    return {
      success: true,
      message: 'Solo application submitted successfully. Looking for partner...',
      applicationId,
      eventId,
      existingSoloApplicantsCount: existingSoloApplicants.length,
    };
  } catch (error: unknown) {
    logger.error('❌ [APPLY_AS_SOLO] Error applying as solo:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Failed to apply as solo', errorMessage);
  }
});
