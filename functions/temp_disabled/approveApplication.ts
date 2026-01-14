/**
 * Cloud Function for handling application approvals
 * Sends push notifications and manages participant data
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

export interface ApprovalRequest {
  applicationId: string;
  hostId: string;
  eventId: string;
  applicantId: string;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Internal function to handle application approval logic
 * Can be called from both onCall handlers and triggers
 */
export async function approveApplicationLogic(
  data: ApprovalRequest,
  authUid: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    applicationId: string;
    chatRoomId: string;
    approvedAt: string;
  };
}> {
  const { applicationId, hostId, eventId, applicantId } = data;

  // Verify the caller is the event host
  if (authUid !== hostId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the event host can approve applications'
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

  // Update application status
  batch.update(applicationRef, {
    status: 'approved',
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    processedBy: hostId,
  });

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

  // Create notification document
  const notificationRef = db.collection('activity_notifications').doc();
  batch.set(notificationRef, {
    userId: applicantId,
    type: 'application_approved',
    title: '참여가 승인되었습니다!',
    message: `"${eventData.title}" 모임 참여가 승인되었습니다!`,
    data: {
      eventId: eventId,
      applicationId: applicationId,
      eventTitle: eventData.title,
      eventLocation: eventData.location,
      scheduledTime: eventData.scheduledTime,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Get or create event chat room
  const chatRoomsQuery = await db
    .collection('event_chat_rooms')
    .where('eventId', '==', eventId)
    .limit(1)
    .get();

  let chatRoomId: string;

  if (chatRoomsQuery.empty) {
    // Create new chat room
    const newChatRoomRef = db.collection('event_chat_rooms').doc();
    chatRoomId = newChatRoomRef.id;

    batch.set(newChatRoomRef, {
      eventId: eventId,
      eventTitle: eventData.title,
      eventLocation: eventData.location,
      scheduledTime: eventData.scheduledTime,
      hostId: hostId,
      participants: [hostId, applicantId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Add to existing chat room
    const chatRoomDoc = chatRoomsQuery.docs[0];
    chatRoomId = chatRoomDoc.id;
    const chatRoomData = chatRoomDoc.data();

    const currentParticipants = chatRoomData.participants || [];
    if (!currentParticipants.includes(applicantId)) {
      batch.update(chatRoomDoc.ref, {
        participants: admin.firestore.FieldValue.arrayUnion(applicantId),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  // Commit all changes
  await batch.commit();

  // Send push notification (fire and forget)
  sendApprovalNotification(applicantId, eventData.title, eventData.location, chatRoomId).catch(
    error => {
      functions.logger.warn('Failed to send approval notification', error);
    }
  );

  return {
    success: true,
    message: 'Application approved successfully',
    data: {
      applicationId,
      chatRoomId,
      approvedAt: new Date().toISOString(),
    },
  };
}

/**
 * HTTP Cloud Function to approve a participation application
 */
export const approveApplication = functions.https.onCall(async (data: ApprovalRequest, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to approve applications'
      );
    }

    // Delegate to the shared logic function
    return await approveApplicationLogic(data, context.auth.uid);

    const { applicationId, hostId, eventId, applicantId } = data;

    // Verify the caller is the event host
    if (context.auth.uid !== hostId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the event host can approve applications'
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

    // Update application status
    batch.update(applicationRef, {
      status: 'approved',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: hostId,
    });

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

    // Create notification document
    const notificationRef = db.collection('activity_notifications').doc();
    batch.set(notificationRef, {
      userId: applicantId,
      type: 'application_approved',
      title: '참여가 승인되었습니다!',
      message: `"${eventData.title}" 모임 참여가 승인되었습니다!`,
      data: {
        eventId: eventId,
        applicationId: applicationId,
        eventTitle: eventData.title,
        eventLocation: eventData.location,
        scheduledTime: eventData.scheduledTime,
      },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Get or create event chat room
    const chatRoomsQuery = await db
      .collection('event_chat_rooms')
      .where('eventId', '==', eventId)
      .limit(1)
      .get();

    let chatRoomId: string;

    if (chatRoomsQuery.empty) {
      // Create new chat room
      const chatRoomRef = db.collection('event_chat_rooms').doc();
      chatRoomId = chatRoomRef.id;

      batch.set(chatRoomRef, {
        eventId: eventId,
        participants: [hostId, applicantId],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
      });
    } else {
      // Add participant to existing chat room
      const chatRoomDoc = chatRoomsQuery.docs[0];
      chatRoomId = chatRoomDoc.id;
      const chatRoomData = chatRoomDoc.data();

      const participants = chatRoomData.participants || [];
      if (!participants.includes(applicantId)) {
        participants.push(applicantId);

        batch.update(chatRoomDoc.ref, {
          participants: participants,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Commit the batch
    await batch.commit();

    // Send push notification
    await sendApprovalNotification(applicantId, eventData.title, eventData.location, chatRoomId);

    // Log the approval
    functions.logger.info('Application approved', {
      applicationId,
      eventId,
      applicantId,
      hostId,
      eventTitle: eventData.title,
    });

    return {
      success: true,
      message: 'Application approved successfully',
      data: {
        applicationId,
        chatRoomId,
        approvedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    functions.logger.error('Error approving application', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to approve application');
  }
});

/**
 * Send push notification to approved applicant
 */
export async function sendApprovalNotification(
  userId: string,
  eventTitle: string,
  eventLocation: string,
  chatRoomId: string
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

    // Prepare notification payload
    const notificationPayload: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: '참여가 승인되었습니다! 🎾',
        body: `"${eventTitle}" 모임 참여가 승인되었습니다. 이제 대화방에서 다른 참가자들과 소통할 수 있습니다.`,
      },
      data: {
        type: 'application_approved',
        eventTitle: eventTitle,
        eventLocation: eventLocation,
        chatRoomId: chatRoomId,
        clickAction: 'OPEN_EVENT_CHAT',
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#1976d2',
          sound: 'default',
          channelId: 'lightning_tennis_events',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'EVENT_APPROVAL',
          },
        },
      },
    };

    // Send notification
    const response = await messaging.sendMulticast(notificationPayload);

    functions.logger.info('Push notification sent', {
      userId,
      eventTitle,
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
    functions.logger.error('Error sending push notification', error);
  }
}

/**
 * HTTP Cloud Function to decline a participation application
 */
export const declineApplication = functions.https.onCall(
  async (data: { applicationId: string; hostId: string; reason?: string }, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to decline applications'
        );
      }

      const { applicationId, hostId, reason } = data;

      // Verify the caller is the event host
      if (context.auth.uid !== hostId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only the event host can decline applications'
        );
      }

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

      // Update application status
      await applicationRef.update({
        status: 'declined',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: hostId,
        hostMessage: reason || '',
      });

      // Get event details
      const eventRef = db.collection('lightning_events').doc(applicationData.eventId);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        const eventData = eventDoc.data();

        // Create notification
        await db.collection('activity_notifications').add({
          userId: applicationData.applicantId,
          type: 'application_declined',
          title: '참여 신청이 거절되었습니다',
          message: `"${eventData?.title}" 모임 참여 신청이 거절되었습니다.`,
          data: {
            eventId: applicationData.eventId,
            applicationId: applicationId,
            reason: reason || '',
            eventTitle: eventData?.title,
          },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      functions.logger.info('Application declined', {
        applicationId,
        hostId,
        reason,
      });

      return {
        success: true,
        message: 'Application declined successfully',
      };
    } catch (error) {
      functions.logger.error('Error declining application', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError('internal', 'Failed to decline application');
    }
  }
);

/**
 * Firestore trigger for new applications
 */
export const onApplicationCreated = functions.firestore
  .document('participation_applications/{applicationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const applicationData = snapshot.data();
      const applicationId = context.params.applicationId;

      // Get event details
      const eventRef = db.collection('lightning_events').doc(applicationData.eventId);
      const eventDoc = await eventRef.get();

      if (!eventDoc.exists) {
        functions.logger.error('Event not found for application', {
          applicationId,
          eventId: applicationData.eventId,
        });
        return;
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        functions.logger.error('Invalid event data', { applicationId });
        return;
      }

      // Create notification for event host
      await db.collection('activity_notifications').add({
        userId: eventData.hostId,
        type: 'application_submitted',
        title: '새로운 참여 신청',
        message: `${applicationData.applicantName}님이 "${eventData.title}" 모임에 참여 신청했습니다.`,
        data: {
          eventId: applicationData.eventId,
          applicationId: applicationId,
          applicantName: applicationData.applicantName,
          eventTitle: eventData.title,
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If auto-approval is enabled, automatically approve
      if (eventData.autoApproval) {
        // Auto-approval: Use the shared logic function safely
        functions.logger.info('Auto-approving application', {
          applicationId,
          hostId: eventData.hostId,
        });

        try {
          await approveApplicationLogic(
            {
              applicationId: applicationId,
              hostId: eventData.hostId,
              eventId: applicationData.eventId,
              applicantId: applicationData.applicantId,
            },
            eventData.hostId
          );

          functions.logger.info('Auto-approval successful', {
            applicationId,
            hostId: eventData.hostId,
          });
        } catch (error) {
          functions.logger.error('Auto-approval failed', {
            applicationId,
            hostId: eventData.hostId,
            error: error.message,
          });
        }
      }

      functions.logger.info('Application notification created', {
        applicationId,
        eventId: applicationData.eventId,
        autoApproval: eventData.autoApproval,
      });
    } catch (error) {
      functions.logger.error('Error processing new application', error);
    }
  });

export default {
  approveApplication,
  declineApplication,
  onApplicationCreated,
};
