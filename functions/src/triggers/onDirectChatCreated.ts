/**
 * 💬 DIRECT CHAT NOTIFICATION TRIGGERS
 *
 * Automatically sends push notifications when a new direct message is sent.
 *
 * Trigger: directChat/{messageId} onCreate
 * Action:
 *   1. Get receiver's push token
 *   2. Send push notification to receiver
 *   3. Log notification result
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
 * Trigger: When a new direct chat message is created
 */
export const onDirectChatCreated = onDocumentCreated('directChat/{messageId}', async event => {
  const messageData = event.data?.data();
  const { messageId } = event.params;

  if (!messageData) {
    console.error('❌ [DIRECT CHAT] No message data found');
    return null;
  }

  // Skip system messages
  if (messageData.type === 'system') {
    console.log('ℹ️ [DIRECT CHAT] Skipping notification for system message');
    return null;
  }

  const senderId = messageData.senderId;
  const senderName = messageData.senderName || 'Someone';
  const receiverId = messageData.receiverId;
  const receiverName = messageData.receiverName || 'User';
  const messageText = messageData.message || '';
  const conversationId = messageData.conversationId;
  const messagePreview =
    messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;

  console.log('💬 [DIRECT CHAT] New message detected:', {
    messageId,
    conversationId,
    senderId,
    senderName,
    receiverId,
    receiverName,
    messagePreview,
  });

  // Validate required fields
  if (!receiverId) {
    console.error('❌ [DIRECT CHAT] No receiverId found in message');
    return null;
  }

  try {
    // 1. Get receiver's push token
    const pushToken = await getUserPushToken(receiverId);

    if (!pushToken) {
      console.log(`⚠️ [DIRECT CHAT] User ${receiverId} does not have a push token. Skipping.`);

      // Log skipped notification
      await db.collection('push_notification_logs').add({
        type: 'direct_chat',
        messageId,
        conversationId,
        senderId,
        senderName,
        receiverId,
        receiverName,
        status: 'skipped',
        reason: 'No push token',
        skippedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: false, error: 'No push token' };
    }

    // 2. Check if user has disabled direct chat notifications
    const userRef = db.doc(`users/${receiverId}`);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const userData = userSnap.data();
      const settings = userData?.notificationSettings || {};

      // 🔔 [FIX] Check both category toggle AND specific setting
      if (settings.chatCategoryEnabled === false || settings.directChatNotifications === false) {
        console.log(`⚙️ [DIRECT CHAT] User ${receiverId} has disabled direct chat notifications`);

        await db.collection('push_notification_logs').add({
          type: 'direct_chat',
          messageId,
          conversationId,
          senderId,
          receiverId,
          status: 'skipped',
          reason: 'Notifications disabled by user',
          skippedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: false, error: 'Notifications disabled' };
      }
    }

    console.log('✅ [DIRECT CHAT] Push token found. Sending notification...');

    // 3. Send push notification
    const result = await sendExpoPushNotification(pushToken, `💬 ${senderName}`, messagePreview, {
      type: 'direct_chat',
      notificationType: 'DIRECT_CHAT_MESSAGE',
      conversationId,
      senderId,
      senderName,
      otherUserId: senderId,
      otherUserName: senderName,
    });

    // 4. Log notification result
    // 🔧 [KIM FIX] Firestore는 undefined 값을 저장할 수 없음 - null 또는 조건부 추가
    await db.collection('push_notification_logs').add({
      type: 'direct_chat',
      messageId,
      conversationId,
      senderId,
      senderName,
      receiverId,
      receiverName,
      pushToken,
      status: result.success ? 'sent' : 'failed',
      error: result.error || null,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(result.ticketId && { expoTicketId: result.ticketId }),
    });

    if (result.success) {
      console.log('✅ [DIRECT CHAT] Push notification sent successfully!', {
        recipient: receiverId,
        ticketId: result.ticketId,
      });
    } else {
      console.error('❌ [DIRECT CHAT] Push notification failed:', result.error);
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('❌ [DIRECT CHAT] Error processing direct chat message:', error);

    // Log error
    await db.collection('push_notification_logs').add({
      type: 'direct_chat_error',
      messageId,
      conversationId,
      senderId,
      receiverId,
      error: error instanceof Error ? error.message : 'Unknown error',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: false, error: (error as Error).message };
  }
});
