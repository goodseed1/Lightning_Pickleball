/**
 * 💬 MEETUP CHAT NOTIFICATION TRIGGERS
 *
 * Automatically sends push notifications and updates unread badges
 * when a new chat message is posted in a meetup chat.
 *
 * Trigger: regular_meetups/{meetupId}/chat_messages/{messageId} onCreate
 * Action:
 *   1. Get all club members (excluding sender)
 *   2. Update each member's unreadMeetupChats collection
 *   3. Send push notification to each member
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getUserPushToken, sendExpoPushNotification } from '../utils/clubNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Trigger: When a new chat message is created in a meetup
 */
export const onMeetupChatMessageCreated = onDocumentCreated(
  'regular_meetups/{meetupId}/chat_messages/{messageId}',
  async event => {
    const messageData = event.data?.data();
    const { meetupId, messageId } = event.params;

    if (!messageData) {
      console.error('❌ [MEETUP CHAT] No message data found');
      return null;
    }

    const senderId = messageData.userId;
    const senderName = messageData.userName || 'Someone';
    const messageText = messageData.text || '';
    const messagePreview =
      messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;

    console.log('💬 [MEETUP CHAT] New message detected:', {
      meetupId,
      messageId,
      senderId,
      senderName,
    });

    try {
      // 1. Get meetup to find clubId
      const meetupRef = db.doc(`regular_meetups/${meetupId}`);
      const meetupSnap = await meetupRef.get();

      if (!meetupSnap.exists) {
        console.error(`❌ [MEETUP CHAT] Meetup not found: ${meetupId}`);
        return null;
      }

      const meetupData = meetupSnap.data();
      const clubId = meetupData?.clubId;
      const meetupTitle = meetupData?.title || 'Meetup';

      if (!clubId) {
        console.error(`❌ [MEETUP CHAT] No clubId found for meetup: ${meetupId}`);
        return null;
      }

      console.log(`✅ [MEETUP CHAT] Found clubId: ${clubId}`);

      // 2. Get all club members
      const membersQuery = await db
        .collection('clubMembers')
        .where('clubId', '==', clubId)
        .where('status', '==', 'active')
        .get();

      const memberIds = membersQuery.docs
        .map(doc => doc.data().userId as string)
        .filter(id => id !== senderId); // Exclude sender

      console.log(`📊 [MEETUP CHAT] Found ${memberIds.length} club members (excluding sender)`);

      if (memberIds.length === 0) {
        console.log('ℹ️ [MEETUP CHAT] No other members to notify');
        return null;
      }

      // 3. Get club name for notification
      // 🔧 [FIX] Club collection is 'tennis_clubs', not 'clubs'
      const clubRef = db.doc(`tennis_clubs/${clubId}`);
      const clubSnap = await clubRef.get();
      const clubName = clubSnap.exists ? clubSnap.data()?.name || 'Club' : 'Club';

      // 4. Batch update unreadMeetupChats for all members & send push notifications
      const batch = db.batch();
      const pushResults: Array<{ userId: string; success: boolean; error?: string }> = [];

      // Process in batches of 500 (Firestore batch limit)
      const BATCH_SIZE = 500;

      for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
        const batchMembers = memberIds.slice(i, i + BATCH_SIZE);

        for (const memberId of batchMembers) {
          // 4a. Update unread count in user's unreadMeetupChats subcollection
          const unreadRef = db.doc(`users/${memberId}/unreadMeetupChats/${meetupId}`);
          const unreadSnap = await unreadRef.get();
          const currentCount = unreadSnap.exists ? unreadSnap.data()?.count || 0 : 0;

          batch.set(
            unreadRef,
            {
              meetupId,
              clubId,
              count: currentCount + 1,
              lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
              lastSenderName: senderName,
              lastMessagePreview: messagePreview,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // 4b. Send push notification
          try {
            // 🔔 [FIX] Check notification settings first
            const userRef = db.doc(`users/${memberId}`);
            const userSnap = await userRef.get();
            const userData = userSnap.exists ? userSnap.data() : null;
            const settings = userData?.notificationSettings || {};

            // Check if user has disabled chat notifications
            if (
              settings.chatCategoryEnabled === false ||
              settings.meetupChatNotifications === false
            ) {
              pushResults.push({
                userId: memberId,
                success: false,
                error: 'Notifications disabled',
              });
              continue;
            }

            const pushToken = await getUserPushToken(memberId);

            if (pushToken) {
              const result = await sendExpoPushNotification(
                pushToken,
                `🏟️ ${clubName} 모임 채팅`,
                `${senderName}: ${messagePreview}`,
                {
                  type: 'meetup_chat',
                  notificationType: 'MEETUP_CHAT_MESSAGE',
                  meetupId,
                  clubId,
                  meetupTitle,
                  senderName,
                }
              );

              pushResults.push({
                userId: memberId,
                success: result.success,
                error: result.error,
              });
            } else {
              pushResults.push({
                userId: memberId,
                success: false,
                error: 'No push token',
              });
            }
          } catch (pushError) {
            const errorMessage = pushError instanceof Error ? pushError.message : 'Unknown error';
            pushResults.push({
              userId: memberId,
              success: false,
              error: errorMessage,
            });
          }
        }
      }

      // Commit the batch
      await batch.commit();

      // Log results
      const successCount = pushResults.filter(r => r.success).length;
      const failCount = pushResults.filter(r => !r.success).length;

      console.log(`✅ [MEETUP CHAT] Notification process complete:`, {
        totalMembers: memberIds.length,
        pushSent: successCount,
        pushFailed: failCount,
      });

      // Log to push_notification_logs
      await db.collection('push_notification_logs').add({
        type: 'meetup_chat',
        meetupId,
        clubId,
        messageId,
        senderId,
        senderName,
        recipientCount: memberIds.length,
        pushSentCount: successCount,
        pushFailedCount: failCount,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        membersNotified: memberIds.length,
        pushSent: successCount,
        pushFailed: failCount,
      };
    } catch (error) {
      console.error('❌ [MEETUP CHAT] Error processing chat message:', error);

      // Log error
      await db.collection('push_notification_logs').add({
        type: 'meetup_chat_error',
        meetupId,
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: false, error: (error as Error).message };
    }
  }
);

// Note: markMeetupChatAsRead is handled client-side by directly deleting
// the unreadMeetupChats document in meetupService.js. No Cloud Function needed.
