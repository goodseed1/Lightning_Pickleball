/**
 * Cloud Functions for participant cancellation
 * Handles both host-initiated and self-initiated cancellations
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

export interface CancelParticipantRequest {
  applicationId: string;
  hostId: string;
  eventId: string;
  participantId: string;
  reason?: string;
}

export interface CancelMyParticipationRequest {
  applicationId: string;
  userId: string;
  eventId: string;
}

/**
 * Cloud Function for host to cancel an approved participant
 */
export const cancelParticipantByHost = functions.https.onCall(
  async (data: CancelParticipantRequest, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to cancel participants'
        );
      }

      const { applicationId, hostId, eventId, participantId, reason } = data;

      // Verify the caller is the event host
      if (context.auth.uid !== hostId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only the event host can cancel participants'
        );
      }

      // Start a batch write
      const batch = db.batch();

      // Get application document
      const applicationRef = db.collection('participation_applications').doc(applicationId);
      const applicationDoc = await applicationRef.get();

      if (!applicationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Application not found');
      }

      const applicationData = applicationDoc.data();
      if (!applicationData) {
        throw new functions.https.HttpsError('internal', 'Invalid application data');
      }

      // Verify this is an approved application
      if (applicationData.status !== 'approved') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Can only cancel approved participants'
        );
      }

      // Update application status to 'cancelled_by_host'
      batch.update(applicationRef, {
        status: 'cancelled_by_host',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: hostId,
        hostMessage: reason || 'Cancelled by host',
      });

      // Remove participant from event chat room
      const chatRoomsQuery = await db
        .collection('event_chat_rooms')
        .where('eventId', '==', eventId)
        .limit(1)
        .get();

      if (!chatRoomsQuery.empty) {
        const chatRoomDoc = chatRoomsQuery.docs[0];
        const chatRoomData = chatRoomDoc.data();

        const participants = chatRoomData.participants || [];
        const updatedParticipants = participants.filter((id: string) => id !== participantId);

        batch.update(chatRoomDoc.ref, {
          participants: updatedParticipants,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Get event details for notification
      const eventRef = db.collection('lightning_events').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Event not found');
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        throw new functions.https.HttpsError('internal', 'Invalid event data');
      }

      // Create notification for cancelled participant
      const notificationRef = db.collection('activity_notifications').doc();
      batch.set(notificationRef, {
        userId: participantId,
        type: 'participation_cancelled_by_host',
        title: '참여가 취소되었습니다',
        message: `\"${eventData.title}\" 모임 참여가 호스트에 의해 취소되었습니다.`,
        data: {
          eventId: eventId,
          applicationId: applicationId,
          eventTitle: eventData.title,
          reason: reason || '',
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Commit the batch
      await batch.commit();

      // Send push notification
      await sendCancellationNotification(participantId, eventData.title, 'host_cancelled', reason);

      // Log the cancellation
      functions.logger.info('Participant cancelled by host', {
        applicationId,
        eventId,
        participantId,
        hostId,
        reason,
      });

      return {
        success: true,
        message: 'Participant cancelled successfully',
        data: {
          applicationId,
          cancelledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      functions.logger.error('Error cancelling participant by host', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError('internal', 'Failed to cancel participant');
    }
  }
);

/**
 * Cloud Function for user to cancel their own approved participation
 */
export const cancelMyParticipation = functions.https.onCall(
  async (data: CancelMyParticipationRequest, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to cancel participation'
        );
      }

      const { applicationId, userId, eventId } = data;

      // Verify the caller is the participant
      if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Users can only cancel their own participation'
        );
      }

      // Start a batch write
      const batch = db.batch();

      // Get application document
      const applicationRef = db.collection('participation_applications').doc(applicationId);
      const applicationDoc = await applicationRef.get();

      if (!applicationDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Application not found');
      }

      const applicationData = applicationDoc.data();
      if (!applicationData) {
        throw new functions.https.HttpsError('internal', 'Invalid application data');
      }

      // Verify this is an approved application
      if (applicationData.status !== 'approved') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Can only cancel approved participation'
        );
      }

      // Verify this is the user's application
      if (applicationData.applicantId !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Can only cancel your own participation'
        );
      }

      // Update application status to 'cancelled_by_user'
      batch.update(applicationRef, {
        status: 'cancelled_by_user',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        userMessage: 'Cancelled by participant',
      });

      // Remove user from event chat room
      const chatRoomsQuery = await db
        .collection('event_chat_rooms')
        .where('eventId', '==', eventId)
        .limit(1)
        .get();

      if (!chatRoomsQuery.empty) {
        const chatRoomDoc = chatRoomsQuery.docs[0];
        const chatRoomData = chatRoomDoc.data();

        const participants = chatRoomData.participants || [];
        const updatedParticipants = participants.filter((id: string) => id !== userId);

        batch.update(chatRoomDoc.ref, {
          participants: updatedParticipants,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Get event details for notification to host
      const eventRef = db.collection('lightning_events').doc(eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Event not found');
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        throw new functions.https.HttpsError('internal', 'Invalid event data');
      }

      // Create notification for event host
      const notificationRef = db.collection('activity_notifications').doc();
      batch.set(notificationRef, {
        userId: eventData.hostId,
        type: 'participant_cancelled',
        title: '참가자가 참여를 취소했습니다',
        message: `${applicationData.applicantName}님이 \"${eventData.title}\" 모임 참여를 취소했습니다.`,
        data: {
          eventId: eventId,
          applicationId: applicationId,
          participantName: applicationData.applicantName,
          eventTitle: eventData.title,
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Commit the batch
      await batch.commit();

      // Send push notification to host
      await sendCancellationNotification(
        eventData.hostId,
        eventData.title,
        'participant_cancelled',
        applicationData.applicantName
      );

      // Log the cancellation
      functions.logger.info('Participation cancelled by user', {
        applicationId,
        eventId,
        userId,
        eventTitle: eventData.title,
      });

      return {
        success: true,
        message: 'Participation cancelled successfully',
        data: {
          applicationId,
          cancelledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      functions.logger.error('Error cancelling participation', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError('internal', 'Failed to cancel participation');
    }
  }
);

/**
 * Send push notification for cancellation events
 */
async function sendCancellationNotification(
  userId: string,
  eventTitle: string,
  type: 'host_cancelled' | 'participant_cancelled',
  extraInfo?: string
): Promise<void> {
  try {
    // Get user's FCM tokens
    const userTokensQuery = await db
      .collection('user_fcm_tokens')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (userTokensQuery.empty) {
      functions.logger.warn('No FCM tokens found for user', { userId });
      return;
    }

    const tokens = userTokensQuery.docs.map(doc => doc.data().token);

    let notificationTitle = '';
    let notificationBody = '';

    if (type === 'host_cancelled') {
      notificationTitle = '참여가 취소되었습니다 😔';
      notificationBody = `\"${eventTitle}\" 모임 참여가 호스트에 의해 취소되었습니다.`;
      if (extraInfo) {
        notificationBody += ` 사유: ${extraInfo}`;
      }
    } else if (type === 'participant_cancelled') {
      notificationTitle = '참가자 취소 알림 📢';
      notificationBody = `${extraInfo}님이 \"${eventTitle}\" 모임 참여를 취소했습니다.`;
    }

    // Prepare notification payload
    const notificationPayload: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        type: type,
        eventTitle: eventTitle,
        extraInfo: extraInfo || '',
        clickAction: 'OPEN_MY_ACTIVITY',
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#f44336',
          sound: 'default',
          channelId: 'lightning_tennis_events',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'CANCELLATION_NOTIFICATION',
          },
        },
      },
    };

    // Send notification
    const response = await messaging.sendMulticast(notificationPayload);

    functions.logger.info('Cancellation notification sent', {
      userId,
      eventTitle,
      type,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      });

      // Remove invalid tokens
      if (invalidTokens.length > 0) {
        const batch = db.batch();
        for (const token of invalidTokens) {
          const tokenQuery = await db
            .collection('user_fcm_tokens')
            .where('token', '==', token)
            .limit(1)
            .get();

          if (!tokenQuery.empty) {
            batch.update(tokenQuery.docs[0].ref, { isActive: false });
          }
        }
        await batch.commit();
      }
    }
  } catch (error) {
    functions.logger.error('Error sending cancellation notification', error);
  }
}

export default {
  cancelParticipantByHost,
  cancelMyParticipation,
};
