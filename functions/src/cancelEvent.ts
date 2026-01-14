/**
 * Cloud Function for event cancellation by host
 * Cancels the entire event and notifies all participants
 * ✅ [v2] Migrated to Firebase Functions v2 API
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { getEventCancelledNotification } from './utils/notificationSender';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

export interface CancelEventRequest {
  eventId: string;
  hostId: string;
  reason?: string;
}

interface EventParticipant {
  playerId?: string;
  userId?: string;
  playerName?: string;
}

/**
 * Cloud Function for host to cancel an entire event
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 */
export const cancelEvent = onCall<CancelEventRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to cancel events');
    }

    const { eventId, hostId, reason } = request.data;

    // Verify the caller is the event host
    if (request.auth.uid !== hostId) {
      throw new HttpsError('permission-denied', 'Only the event host can cancel the event');
    }

    // Get event details - Try multiple collections
    let eventRef = db.collection('leagues').doc(eventId);
    let eventDoc = await eventRef.get();
    let collectionType = 'leagues';

    if (!eventDoc.exists) {
      // Try tournaments collection
      eventRef = db.collection('tournaments').doc(eventId);
      eventDoc = await eventRef.get();
      collectionType = 'tournaments';
    }

    if (!eventDoc.exists) {
      // Try lightning_events collection
      eventRef = db.collection('lightning_events').doc(eventId);
      eventDoc = await eventRef.get();
      collectionType = 'lightning_events';
    }

    if (!eventDoc.exists) {
      // Try events collection
      eventRef = db.collection('events').doc(eventId);
      eventDoc = await eventRef.get();
      collectionType = 'events';
    }

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found in any collection');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new HttpsError('internal', 'Invalid event data');
    }

    // Verify this is the host
    if (eventData.hostId !== hostId) {
      throw new HttpsError('permission-denied', 'Only the event host can cancel the event');
    }

    // Verify event is not already cancelled
    if (eventData.status === 'cancelled') {
      throw new HttpsError('failed-precondition', 'Event is already cancelled');
    }

    // Start a batch write
    const batch = db.batch();

    // Update event status to 'cancelled'
    batch.update(eventRef, {
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledBy: hostId,
      cancellationReason: reason || 'Cancelled by host',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Get all participants
    const participants: EventParticipant[] = eventData.participants || [];
    const participantIds = participants
      .map(p => p.playerId || p.userId)
      .filter((id): id is string => id !== undefined);

    // 🎾 [KIM v2] Collect ALL users to notify (comprehensive list)
    const allUsersToNotify = new Set<string>();

    // 1. Add existing participants
    participantIds.forEach(id => allUsersToNotify.add(id));

    // 2. Add host's partner if exists
    if (eventData.partnerId) {
      allUsersToNotify.add(eventData.partnerId);
      logger.info('Adding host partner to notification list', { partnerId: eventData.partnerId });
    }

    // 🎯 [KIM FIX] Get ALL applications for this event (any status) and DELETE them
    const applicationsQuery = await db
      .collection('participation_applications')
      .where('eventId', '==', eventId)
      .get();

    // 3. Add all applicants and their partners from applications
    applicationsQuery.docs.forEach(doc => {
      const appData = doc.data();
      // Add applicant
      if (appData.applicantId) {
        allUsersToNotify.add(appData.applicantId);
      }
      // Add partner if exists and accepted
      if (appData.partnerId && appData.partnerStatus === 'accepted') {
        allUsersToNotify.add(appData.partnerId);
      }
    });

    logger.info('🎾 [CANCEL_EVENT] Users to notify', {
      eventId,
      totalUsersToNotify: allUsersToNotify.size,
      userIds: Array.from(allUsersToNotify),
    });

    logger.info('Deleting participation applications', {
      eventId,
      applicationCount: applicationsQuery.size,
    });

    // DELETE all applications (complete removal, no ghost cards)
    applicationsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 🎯 [KIM FIX] Get ALL partner invitations for this event and DELETE them
    const partnerInvitationsQuery = await db
      .collection('partner_invitations')
      .where('eventId', '==', eventId)
      .get();

    logger.info('Deleting partner invitations', {
      eventId,
      invitationCount: partnerInvitationsQuery.size,
    });

    // DELETE all partner invitations (complete removal)
    partnerInvitationsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 🎾 [KIM v2] Get ALL friend invitations for SINGLES matches and add to notify list
    const friendInvitationsQuery = await db
      .collection('friend_invitations')
      .where('eventId', '==', eventId)
      .get();

    // 4. Add invited friends from singles matches
    friendInvitationsQuery.docs.forEach(doc => {
      const inviteData = doc.data();
      // Add invited user
      if (inviteData.invitedUserId) {
        allUsersToNotify.add(inviteData.invitedUserId);
      }
      // Add inviter if different from host
      if (inviteData.inviterId && inviteData.inviterId !== hostId) {
        allUsersToNotify.add(inviteData.inviterId);
      }
    });

    logger.info('🎾 [CANCEL_EVENT] Friend invitations found (singles)', {
      eventId,
      friendInvitationCount: friendInvitationsQuery.size,
    });

    // DELETE all friend invitations (complete removal)
    friendInvitationsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Deactivate event chat room
    const chatRoomsQuery = await db
      .collection('event_chat_rooms')
      .where('eventId', '==', eventId)
      .limit(1)
      .get();

    if (!chatRoomsQuery.empty) {
      const chatRoomDoc = chatRoomsQuery.docs[0];
      batch.update(chatRoomDoc.ref, {
        isActive: false,
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 🎾 [KIM v2] Remove host from notification list (host doesn't need to be notified)
    allUsersToNotify.delete(hostId);

    // Convert to array for iteration
    const usersToNotifyArray = Array.from(allUsersToNotify);

    // Create notifications for ALL affected users (not just participants)
    // 🎯 [KIM FIX] Use translation keys for i18n
    usersToNotifyArray.forEach(userId => {
      const notificationRef = db.collection('activity_notifications').doc();
      batch.set(notificationRef, {
        userId: userId,
        type: 'event_cancelled_by_host',
        title: 'notification.eventCancelledTitle',
        message: 'notification.eventCancelled',
        data: {
          eventId: eventId,
          eventTitle: eventData.title,
          reason: reason || '',
          collectionType: collectionType,
        },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 🎾 [KIM v2] Create FEED item for home feed notification card
      const feedRef = db.collection('feed').doc();
      batch.set(feedRef, {
        type: 'event_cancelled_by_host',
        actorId: hostId,
        actorName: eventData.hostName || 'Host',
        targetId: userId,
        eventId: eventId,
        eventTitle: eventData.title,
        metadata: {
          eventType: eventData.gameType || eventData.type || 'match',
          eventTitle: eventData.title,
          cancellationReason: reason || '',
        },
        visibility: 'private',
        visibleTo: [userId],
        isActive: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    logger.info('🎾 [CANCEL_EVENT] Created notifications and feed items', {
      eventId,
      notificationCount: usersToNotifyArray.length,
    });

    // Commit the batch
    await batch.commit();

    // 🎾 [KIM v2] Send push notifications to ALL affected users
    await sendEventCancellationNotifications(usersToNotifyArray, eventData.title, reason);

    // Log the cancellation
    logger.info('🎾 [CANCEL_EVENT] Event cancelled by host', {
      eventId,
      hostId,
      eventTitle: eventData.title,
      totalNotified: usersToNotifyArray.length,
      reason,
      collectionType,
    });

    return {
      success: true,
      message: 'Event cancelled successfully',
      data: {
        eventId,
        cancelledAt: new Date().toISOString(),
        notifiedUsers: usersToNotifyArray.length,
      },
    };
  } catch (error) {
    logger.error('Error cancelling event', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to cancel event');
  }
});

/**
 * Send push notifications to all participants about event cancellation
 * 🌍 i18n: Sends notifications in each user's preferred language
 */
async function sendEventCancellationNotifications(
  participantIds: string[],
  eventTitle: string,
  reason?: string
): Promise<void> {
  try {
    if (participantIds.length === 0) {
      logger.info('No participants to notify for event cancellation');
      return;
    }

    // Get all user data and FCM tokens for participants
    const userTokensMap = new Map<string, { tokens: string[]; language: string }>();

    for (const participantId of participantIds) {
      // Get user's language preference
      const userDoc = await db.collection('users').doc(participantId).get();
      const userData = userDoc.data();
      const userLang =
        userData?.preferredLanguage ||
        userData?.language ||
        userData?.preferences?.language ||
        'ko';

      // Get user's FCM tokens
      const userTokensQuery = await db
        .collection('user_fcm_tokens')
        .where('userId', '==', participantId)
        .where('isActive', '==', true)
        .get();

      if (!userTokensQuery.empty) {
        const tokens = userTokensQuery.docs.map(doc => doc.data().token);
        userTokensMap.set(participantId, { tokens, language: userLang });
      }
    }

    if (userTokensMap.size === 0) {
      logger.warn('No FCM tokens found for any participants', {
        participantCount: participantIds.length,
      });
      return;
    }

    // Group users by language for efficient batch sending
    const languageGroups = new Map<string, string[]>();
    for (const data of userTokensMap.values()) {
      if (!languageGroups.has(data.language)) {
        languageGroups.set(data.language, []);
      }
      languageGroups.get(data.language)?.push(...data.tokens);
    }

    // Send notifications per language group
    let totalSuccess = 0;
    let totalFailure = 0;

    for (const [lang, tokens] of languageGroups.entries()) {
      const notification = getEventCancelledNotification(
        lang as 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru',
        eventTitle,
        reason
      );

      const notificationPayload: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: 'event_cancelled_by_host',
          eventTitle: eventTitle,
          reason: reason || '',
          clickAction: 'OPEN_MY_ACTIVITY',
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#f44336',
            sound: 'default',
            channelId: 'lightning_pickleball_events',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              category: 'EVENT_CANCELLATION_NOTIFICATION',
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(notificationPayload);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      logger.info(`Event cancellation notifications sent (${lang})`, {
        language: lang,
        tokenCount: tokens.length,
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
    }

    logger.info('Event cancellation notifications sent (all languages)', {
      eventTitle,
      participantCount: participantIds.length,
      languageGroups: languageGroups.size,
      totalSuccess,
      totalFailure,
    });
  } catch (error) {
    logger.error('Error sending event cancellation notifications', error);
  }
}

export default {
  cancelEvent,
};
