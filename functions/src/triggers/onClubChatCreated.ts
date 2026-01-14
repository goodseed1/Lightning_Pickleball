/**
 * 🏟️ CLUB CHAT NOTIFICATION TRIGGER
 *
 * Automatically sends push notifications when a new club chat message is sent.
 *
 * Trigger: clubChat/{messageId} onCreate
 * Action:
 *   1. Get all club members from clubMembers collection (excluding sender)
 *   2. Check each member's notification settings
 *   3. Send push notification to enabled members
 *   4. Log notification results
 *
 * Created: 2025-01-08
 * Author: Kim (Architect)
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
 * Trigger: When a new club chat message is created
 */
export const onClubChatCreated = onDocumentCreated('clubChat/{messageId}', async event => {
  const messageData = event.data?.data();
  const { messageId } = event.params;

  // clubId is stored in the document, not in the path
  const clubId = messageData?.clubId as string;

  if (!messageData) {
    console.error('❌ [CLUB CHAT] No message data found');
    return null;
  }

  // Skip system messages
  if (messageData.type === 'system') {
    console.log('ℹ️ [CLUB CHAT] Skipping notification for system message');
    return null;
  }

  const senderId = messageData.senderId;
  const senderName = messageData.senderName || 'Someone';
  const messageText = messageData.message || '';
  const messagePreview =
    messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;

  console.log('🏟️ [CLUB CHAT] New message detected:', {
    clubId,
    messageId,
    senderId,
    senderName,
    messagePreview,
  });

  // Validate required fields
  if (!senderId) {
    console.error('❌ [CLUB CHAT] No senderId found in message');
    return null;
  }

  if (!clubId) {
    console.error('❌ [CLUB CHAT] No clubId found in message');
    return null;
  }

  try {
    // 🔧 [FIX] Query clubMembers collection directly (top-level collection, not subcollection)
    console.log('🔍 [CLUB CHAT] Querying clubMembers collection for clubId:', clubId);
    const membersSnapshot = await db
      .collection('clubMembers')
      .where('clubId', '==', clubId)
      .where('status', '==', 'active')
      .get();

    // Get member userIds, excluding sender
    const memberIds = membersSnapshot.docs
      .map(doc => doc.data().userId || doc.id)
      .filter((id: string) => id && id !== senderId);

    // Default club name (could be enhanced later to fetch from somewhere)
    const clubName = 'Club Chat';

    console.log('👥 [CLUB CHAT] Recipients found:', {
      clubId,
      clubName,
      totalMembers: membersSnapshot.docs.length,
      recipientCount: memberIds.length,
    });

    if (memberIds.length === 0) {
      console.log('ℹ️ [CLUB CHAT] No recipients to notify');
      return null;
    }

    // Send push notifications to each member
    const results: Array<{ userId: string; success: boolean; error?: string }> = [];

    for (const memberId of memberIds) {
      try {
        // Get user data to check notification settings
        const userRef = db.doc(`users/${memberId}`);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          results.push({ userId: memberId, success: false, error: 'User not found' });
          continue;
        }

        const userData = userSnap.data();
        const settings = userData?.notificationSettings || {};

        // Check if user has disabled club chat notifications
        // Check both old format (clubChatNotifications) and new format (chatCategoryEnabled)
        if (settings.clubChatNotifications === false || settings.chatCategoryEnabled === false) {
          console.log(`⚙️ [CLUB CHAT] User ${memberId} has disabled club chat notifications`);
          results.push({ userId: memberId, success: false, error: 'Notifications disabled' });
          continue;
        }

        // Get push token
        const pushToken = await getUserPushToken(memberId);

        if (!pushToken) {
          results.push({ userId: memberId, success: false, error: 'No push token' });
          continue;
        }

        // Send push notification
        const result = await sendExpoPushNotification(
          pushToken,
          `🏟️ ${clubName}`,
          `${senderName}: ${messagePreview}`,
          {
            type: 'club_chat',
            notificationType: 'CLUB_CHAT_MESSAGE',
            clubId,
            clubName,
            senderId,
            senderName,
          },
          'chat' // Use chat channel for Android
        );

        results.push({
          userId: memberId,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          console.log(`✅ [CLUB CHAT] Notification sent to ${memberId}`);
        }
      } catch (memberError) {
        console.error(`❌ [CLUB CHAT] Error notifying member ${memberId}:`, memberError);
        results.push({
          userId: memberId,
          success: false,
          error: memberError instanceof Error ? memberError.message : 'Unknown error',
        });
      }
    }

    // Log notification results
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('📊 [CLUB CHAT] Notification summary:', {
      clubId,
      messageId,
      total: results.length,
      successful: successCount,
      failed: failCount,
    });

    // Log to Firestore for analytics
    await db.collection('push_notification_logs').add({
      type: 'club_chat',
      clubId,
      clubName,
      messageId,
      senderId,
      senderName,
      recipientCount: memberIds.length,
      successCount,
      failCount,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      recipientCount: memberIds.length,
      successCount,
      failCount,
    };
  } catch (error) {
    console.error('❌ [CLUB CHAT] Error processing club chat message:', error);

    // Log error
    await db.collection('push_notification_logs').add({
      type: 'club_chat_error',
      clubId,
      messageId,
      senderId,
      error: error instanceof Error ? error.message : 'Unknown error',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: false, error: (error as Error).message };
  }
});
