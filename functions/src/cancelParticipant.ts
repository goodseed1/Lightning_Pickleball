/**
 * Cloud Functions for participant cancellation
 * Handles both host-initiated and self-initiated cancellations
 * ✅ [v2] Migrated to Firebase Functions v2 API
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
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

interface EventParticipant {
  playerId?: string;
  userId?: string;
  playerName?: string;
}

/**
 * Cloud Function for host to cancel an approved participant
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 */
export const cancelParticipantByHost = onCall<CancelParticipantRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to cancel participants');
    }

    const { applicationId, hostId, eventId, participantId, reason } = request.data;

    // Verify the caller is the event host
    if (request.auth.uid !== hostId) {
      throw new HttpsError('permission-denied', 'Only the event host can cancel participants');
    }

    // Start a batch write
    const batch = db.batch();

    // Get application document
    const applicationRef = db.collection('participation_applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new HttpsError('not-found', 'Application not found');
    }

    const applicationData = applicationDoc.data();
    if (!applicationData) {
      throw new HttpsError('internal', 'Invalid application data');
    }

    // Verify this is an approved application
    if (applicationData.status !== 'approved') {
      throw new HttpsError('failed-precondition', 'Can only cancel approved participants');
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

    // Get event details for notification - Try multiple collections
    let eventRef = db.collection('leagues').doc(eventId);
    let eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      // Try tournaments collection
      eventRef = db.collection('tournaments').doc(eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      // Try lightning_events collection
      eventRef = db.collection('lightning_events').doc(eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      // Try events collection
      eventRef = db.collection('events').doc(eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found in any collection');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new HttpsError('internal', 'Invalid event data');
    }

    // Remove participant from event's participants array
    const currentParticipants: EventParticipant[] = eventData.participants || [];
    const participantToRemove = currentParticipants.find(
      (p: EventParticipant) => p.playerId === participantId || p.userId === participantId
    );

    if (participantToRemove) {
      logger.info('Removing participant from event by host', {
        eventId,
        participantId,
        participantToRemove,
      });

      batch.update(eventRef, {
        participants: admin.firestore.FieldValue.arrayRemove(participantToRemove),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      logger.warn('Participant not found in event participants array (host cancellation)', {
        eventId,
        participantId,
        currentParticipants,
      });
    }

    // 🎯 [KIM FIX] Use translation keys for i18n
    // Create notification for cancelled participant
    const notificationRef = db.collection('activity_notifications').doc();
    batch.set(notificationRef, {
      userId: participantId,
      type: 'participation_cancelled_by_host',
      title: 'notification.participationCancelledByHostTitle',
      message: 'notification.participationCancelledByHost',
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
    logger.info('Participant cancelled by host', {
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
    logger.error('Error cancelling participant by host', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to cancel participant');
  }
});

/**
 * Cloud Function for user to cancel their own approved participation
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 */
export const cancelMyParticipation = onCall<CancelMyParticipationRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to cancel participation');
    }

    const { applicationId, userId, eventId } = request.data;

    // Verify the caller is the participant
    if (request.auth.uid !== userId) {
      throw new HttpsError('permission-denied', 'Users can only cancel their own participation');
    }

    // Start a batch write
    const batch = db.batch();

    // Get application document
    const applicationRef = db.collection('participation_applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      throw new HttpsError('not-found', 'Application not found');
    }

    const applicationData = applicationDoc.data();
    if (!applicationData) {
      throw new HttpsError('internal', 'Invalid application data');
    }

    // Verify this is an approved application
    if (applicationData.status !== 'approved') {
      throw new HttpsError('failed-precondition', 'Can only cancel approved participation');
    }

    // Verify this is the user's application
    if (applicationData.applicantId !== userId) {
      throw new HttpsError('permission-denied', 'Can only cancel your own participation');
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

    // Get event details for notification to host - Try multiple collections
    let eventRef = db.collection('leagues').doc(eventId);
    let eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      // Try tournaments collection
      eventRef = db.collection('tournaments').doc(eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      // Try lightning_events collection
      eventRef = db.collection('lightning_events').doc(eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      // Try events collection
      eventRef = db.collection('events').doc(eventId);
      eventDoc = await eventRef.get();
    }

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found in any collection');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new HttpsError('internal', 'Invalid event data');
    }

    // Remove participant from event's participants array
    const currentParticipants: EventParticipant[] = eventData.participants || [];
    const participantToRemove = currentParticipants.find(
      (p: EventParticipant) => p.playerId === userId || p.userId === userId
    );

    if (participantToRemove) {
      logger.info('Removing participant from event (self-cancellation)', {
        eventId,
        userId,
        participantToRemove,
      });

      batch.update(eventRef, {
        participants: admin.firestore.FieldValue.arrayRemove(participantToRemove),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      logger.warn('Participant not found in event participants array (self-cancellation)', {
        eventId,
        userId,
        currentParticipants,
      });
    }

    // 🎯 [KIM FIX] Use translation keys for i18n
    // Create notification for event host
    const notificationRef = db.collection('activity_notifications').doc();
    batch.set(notificationRef, {
      userId: eventData.hostId,
      type: 'participant_cancelled',
      title: 'notification.participantCancelledTitle',
      message: 'notification.participantCancelled',
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
    logger.info('Participation cancelled by user', {
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
    logger.error('Error cancelling participation', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to cancel participation');
  }
});

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
      logger.warn('No FCM tokens found for user', { userId });
      return;
    }

    const tokens = userTokensQuery.docs.map(doc => doc.data().token);

    let notificationTitle = '';
    let notificationBody = '';

    // 🎯 [KIM FIX] Get user's preferred language for push notification i18n
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userLang = userData?.preferredLanguage || userData?.language || 'en';

    // 🌍 i18n Push Notification Messages
    const pushMessages: Record<
      string,
      {
        hostCancelled: { title: string; body: string };
        participantCancelled: { title: string; body: string };
      }
    > = {
      ko: {
        hostCancelled: {
          title: '참여가 취소되었습니다 😔',
          body: `"${eventTitle}" 모임 참여가 호스트에 의해 취소되었습니다.${extraInfo ? ` 사유: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: '참가자 취소 알림 📢',
          body: `${extraInfo}님이 "${eventTitle}" 모임 참여를 취소했습니다.`,
        },
      },
      en: {
        hostCancelled: {
          title: 'Participation Cancelled 😔',
          body: `Your participation in "${eventTitle}" has been cancelled by the host.${extraInfo ? ` Reason: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Participant Cancellation 📢',
          body: `${extraInfo} has cancelled their participation in "${eventTitle}".`,
        },
      },
      ja: {
        hostCancelled: {
          title: '参加がキャンセルされました 😔',
          body: `「${eventTitle}」への参加がホストによりキャンセルされました。${extraInfo ? ` 理由: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: '参加者キャンセル通知 📢',
          body: `${extraInfo}さんが「${eventTitle}」への参加をキャンセルしました。`,
        },
      },
      zh: {
        hostCancelled: {
          title: '参与已取消 😔',
          body: `您在"${eventTitle}"的参与已被主办方取消。${extraInfo ? ` 原因: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: '参与者取消通知 📢',
          body: `${extraInfo}已取消参加"${eventTitle}"。`,
        },
      },
      de: {
        hostCancelled: {
          title: 'Teilnahme abgesagt 😔',
          body: `Ihre Teilnahme an "${eventTitle}" wurde vom Gastgeber abgesagt.${extraInfo ? ` Grund: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Teilnehmer-Absage 📢',
          body: `${extraInfo} hat die Teilnahme an "${eventTitle}" abgesagt.`,
        },
      },
      fr: {
        hostCancelled: {
          title: 'Participation annulée 😔',
          body: `Votre participation à "${eventTitle}" a été annulée par l'hôte.${extraInfo ? ` Raison: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Annulation participant 📢',
          body: `${extraInfo} a annulé sa participation à "${eventTitle}".`,
        },
      },
      es: {
        hostCancelled: {
          title: 'Participación cancelada 😔',
          body: `Tu participación en "${eventTitle}" ha sido cancelada por el anfitrión.${extraInfo ? ` Motivo: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Cancelación de participante 📢',
          body: `${extraInfo} ha cancelado su participación en "${eventTitle}".`,
        },
      },
      it: {
        hostCancelled: {
          title: 'Partecipazione annullata 😔',
          body: `La tua partecipazione a "${eventTitle}" è stata annullata dall'host.${extraInfo ? ` Motivo: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Cancellazione partecipante 📢',
          body: `${extraInfo} ha annullato la partecipazione a "${eventTitle}".`,
        },
      },
      pt: {
        hostCancelled: {
          title: 'Participação cancelada 😔',
          body: `Sua participação em "${eventTitle}" foi cancelada pelo anfitrião.${extraInfo ? ` Motivo: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Cancelamento de participante 📢',
          body: `${extraInfo} cancelou a participação em "${eventTitle}".`,
        },
      },
      ru: {
        hostCancelled: {
          title: 'Участие отменено 😔',
          body: `Ваше участие в "${eventTitle}" было отменено организатором.${extraInfo ? ` Причина: ${extraInfo}` : ''}`,
        },
        participantCancelled: {
          title: 'Отмена участника 📢',
          body: `${extraInfo} отменил(а) участие в "${eventTitle}".`,
        },
      },
    };

    const msgs = pushMessages[userLang] || pushMessages['en'];
    if (type === 'host_cancelled') {
      notificationTitle = msgs.hostCancelled.title;
      notificationBody = msgs.hostCancelled.body;
    } else if (type === 'participant_cancelled') {
      notificationTitle = msgs.participantCancelled.title;
      notificationBody = msgs.participantCancelled.body;
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
    const response = await messaging.sendEachForMulticast(notificationPayload);

    logger.info('Cancellation notification sent', {
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
    logger.error('Error sending cancellation notification', error);
  }
}

export default {
  cancelParticipantByHost,
  cancelMyParticipation,
};
