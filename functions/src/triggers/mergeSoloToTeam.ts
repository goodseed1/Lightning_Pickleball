/**
 * 🎯 [OPERATION SOLO LOBBY - PHASE 4] Merge Solo to Team Cloud Function
 *
 * Handles merging two solo applicants into a team application. When one solo
 * applicant proposes to another and the other accepts, this function merges
 * them into a single team application ready for host approval.
 *
 * 🚨 CRITICAL REQUIREMENTS:
 * 1. ✅ Atomic transaction for both applications
 * 2. ✅ Proposer application becomes team application (status: 'pending')
 * 3. ✅ Acceptor application is marked as 'merged'
 * 4. ✅ Notify host of new team application via push
 * 5. ✅ Update event updatedAt for real-time listener
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

export interface MergeSoloToTeamRequest {
  proposerApplicationId: string; // Proposer's application ID
  acceptorApplicationId: string; // Acceptor's application ID
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
      logger.warn(`⚠️ [MERGE_SOLO] User not found: ${userId}`);
      return null;
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      logger.info(`⚠️ [MERGE_SOLO] User ${userId} does not have a push token`);
      return null;
    }

    return pushToken;
  } catch (error: unknown) {
    logger.error(`❌ [MERGE_SOLO] Failed to get push token for user ${userId}:`, error);
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
      logger.error('❌ [MERGE_SOLO] Push notification errors:', result.errors);
      return { success: false, error: result.errors[0]?.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ [MERGE_SOLO] Failed to send push notification:', error);
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
    logger.error('❌ [MERGE_SOLO] Failed to log push notification:', error);
  }
}

/**
 * 🎯 [OPERATION SOLO LOBBY - PHASE 4] Merge Solo to Team Cloud Function
 *
 * Merges two solo applications into a team application:
 * 1. Validate both applications exist and are solo applications
 * 2. Validate both are for the same event
 * 3. Update proposer application to team application (status: 'pending')
 * 4. Mark acceptor application as 'merged'
 * 5. Notify host of new team application
 *
 * @param request - Contains proposerApplicationId, acceptorApplicationId
 * @returns Success message with merged team application details
 */
export const mergeSoloToTeam = onCall<MergeSoloToTeamRequest>(async request => {
  const { data, auth } = request;

  // ✅ Authentication check
  if (!auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to merge solo applications'
    );
  }

  const { proposerApplicationId, acceptorApplicationId } = data;
  const userId = auth.uid;

  // Validate required fields
  if (!proposerApplicationId) {
    throw new HttpsError('invalid-argument', 'proposerApplicationId is required');
  }

  if (!acceptorApplicationId) {
    throw new HttpsError('invalid-argument', 'acceptorApplicationId is required');
  }

  // Prevent self-merge
  if (proposerApplicationId === acceptorApplicationId) {
    throw new HttpsError('invalid-argument', 'Cannot merge the same application');
  }

  try {
    logger.info('🎯 [MERGE_SOLO] Starting solo to team merge process', {
      proposerApplicationId,
      acceptorApplicationId,
      userId,
    });

    // Use transaction to merge applications atomically
    const result = await db.runTransaction(async transaction => {
      // ✅ PHASE 1: ALL READS FIRST

      // A. Get proposer application
      const proposerRef = db.collection('participation_applications').doc(proposerApplicationId);
      const proposerDoc = await transaction.get(proposerRef);

      if (!proposerDoc.exists) {
        throw new HttpsError('not-found', 'Proposer application not found');
      }

      const proposerData = proposerDoc.data();
      if (!proposerData) {
        throw new HttpsError('internal', 'Invalid proposer application data');
      }

      // B. Get acceptor application
      const acceptorRef = db.collection('participation_applications').doc(acceptorApplicationId);
      const acceptorDoc = await transaction.get(acceptorRef);

      if (!acceptorDoc.exists) {
        throw new HttpsError('not-found', 'Acceptor application not found');
      }

      const acceptorData = acceptorDoc.data();
      if (!acceptorData) {
        throw new HttpsError('internal', 'Invalid acceptor application data');
      }

      // C. Validate both are solo applications
      if (
        proposerData.status !== 'looking_for_partner' ||
        proposerData.applicationType !== 'solo'
      ) {
        throw new HttpsError('invalid-argument', 'Proposer application is not a solo application');
      }

      if (
        acceptorData.status !== 'looking_for_partner' ||
        acceptorData.applicationType !== 'solo'
      ) {
        throw new HttpsError('invalid-argument', 'Acceptor application is not a solo application');
      }

      // D. Validate both are for the same event
      if (proposerData.eventId !== acceptorData.eventId) {
        throw new HttpsError('invalid-argument', 'Applications are for different events');
      }

      const eventId = proposerData.eventId as string;

      // E. Security check: Verify the requester is the acceptor
      if (acceptorData.applicantId !== userId) {
        logger.warn('🚫 [MERGE_SOLO] Unauthorized merge attempt', {
          acceptorId: acceptorData.applicantId,
          requesterId: userId,
        });
        throw new HttpsError('permission-denied', 'You must be the acceptor to merge applications');
      }

      // F. Get event document for push notification
      const eventRef = db.collection('events').doc(eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new HttpsError('not-found', 'Event not found');
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        throw new HttpsError('internal', 'Invalid event data');
      }

      // ✅ PHASE 2: ALL WRITES AFTER ALL READS

      // G. Update proposer application to team application (status: 'pending')
      transaction.update(proposerRef, {
        status: 'pending', // 🚨 Now visible to host for approval
        applicationType: 'team', // Changed from 'solo' to 'team'
        partnerId: acceptorData.applicantId,
        partnerName: acceptorData.applicantName,
        partnerStatus: 'accepted', // Partner has accepted
        teamId: `${proposerData.applicantId.substring(0, 3)}_${acceptorData.applicantId.substring(0, 3)}`,
        mergedAt: admin.firestore.FieldValue.serverTimestamp(),
        mergedFromApplicationId: acceptorApplicationId, // Reference to merged application
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('✅ [MERGE_SOLO] Proposer application updated to team', {
        applicationId: proposerApplicationId,
        proposerId: proposerData.applicantId,
        partnerId: acceptorData.applicantId,
      });

      // H. Mark acceptor application as 'merged'
      transaction.update(acceptorRef, {
        status: 'merged', // 🚨 No longer visible in solo lobby
        mergedIntoApplicationId: proposerApplicationId, // Reference to team application
        mergedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('✅ [MERGE_SOLO] Acceptor application marked as merged', {
        applicationId: acceptorApplicationId,
        acceptorId: acceptorData.applicantId,
      });

      // I. Update event's updatedAt to trigger host's real-time listener
      transaction.update(eventRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('📝 [MERGE_SOLO] Event updated for host real-time refresh', {
        eventId,
      });

      return {
        eventId,
        eventData,
        proposerData,
        acceptorData,
        hostId: eventData.hostId as string,
      };
    });

    logger.info('✅ [MERGE_SOLO] Transaction completed successfully', {
      proposerApplicationId,
      acceptorApplicationId,
      eventId: result.eventId,
    });

    // 💥 Send push notification to host (after transaction completes)
    try {
      const hostPushToken = await getUserPushToken(result.hostId);

      if (hostPushToken) {
        const notificationResult = await sendExpoPushNotification(
          hostPushToken,
          '🎾 새로운 팀 신청!',
          `${result.proposerData.applicantName}님과 ${result.acceptorData.applicantName}님이 팀으로 '${result.eventData.title || '번개매치'}'에 신청했어요.`,
          {
            type: 'new_team_application',
            notificationType: 'NEW_TEAM_APPLICATION',
            eventId: result.eventId,
            eventTitle: result.eventData.title || '번개매치',
            proposerId: result.proposerData.applicantId,
            proposerName: result.proposerData.applicantName,
            acceptorId: result.acceptorData.applicantId,
            acceptorName: result.acceptorData.applicantName,
            applicationId: proposerApplicationId,
          }
        );

        // Log notification
        await logPushNotification(
          result.hostId,
          'new_team_application',
          {
            eventId: result.eventId,
            proposerId: result.proposerData.applicantId,
            acceptorId: result.acceptorData.applicantId,
            applicationId: proposerApplicationId,
          },
          notificationResult.success ? 'sent' : 'failed'
        );

        if (notificationResult.success) {
          logger.info('✅ [MERGE_SOLO] Push notification sent to host', {
            hostId: result.hostId,
          });
        } else {
          logger.warn('⚠️ [MERGE_SOLO] Failed to send push notification to host', {
            error: notificationResult.error,
          });
        }
      } else {
        logger.info('⚠️ [MERGE_SOLO] Host does not have a push token', {
          hostId: result.hostId,
        });
      }
    } catch (notificationError) {
      // Log but don't fail the response - notification is not critical
      logger.warn('⚠️ [MERGE_SOLO] Failed to send push notification (non-critical):', {
        error:
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError),
      });
    }

    // 🎯 Try to create activity notification for host (non-critical)
    try {
      await db.collection('activity_notifications').add({
        userId: result.hostId,
        type: 'new_team_application',
        eventId: result.eventId,
        applicantId: result.proposerData.applicantId,
        applicantName: result.proposerData.applicantName,
        partnerId: result.acceptorData.applicantId,
        partnerName: result.acceptorData.applicantName,
        message: `${result.proposerData.applicantName}님과 ${result.acceptorData.applicantName}님이 팀으로 신청했습니다`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        applicationId: proposerApplicationId,
      });
      logger.info('✅ [MERGE_SOLO] Activity notification created for host');
    } catch (notifError) {
      logger.warn(
        '[MERGE_SOLO] Failed to create activity notification (non-critical):',
        notifError
      );
    }

    return {
      success: true,
      message:
        'Solo applications merged into team application successfully. Waiting for host approval.',
      teamApplicationId: proposerApplicationId,
      eventId: result.eventId,
      proposer: {
        id: result.proposerData.applicantId,
        name: result.proposerData.applicantName,
      },
      acceptor: {
        id: result.acceptorData.applicantId,
        name: result.acceptorData.applicantName,
      },
    };
  } catch (error: unknown) {
    logger.error('❌ [MERGE_SOLO] Error merging solo applications:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Failed to merge solo applications', errorMessage);
  }
});
