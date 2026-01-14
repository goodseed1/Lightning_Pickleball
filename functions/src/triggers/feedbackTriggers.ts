/**
 * 🔔 Feedback Conversation Notification Triggers
 *
 * Bidirectional notification system for feedback conversations:
 * 1. onFeedbackResponse: Notifies user when admin replies
 * 2. onUserReplyToFeedback: Notifies admins when user replies
 *
 * Supports both legacy single response and new conversation thread model
 *
 * @author Kim (킴)
 * @date 2025-01-08 (updated for conversation threading)
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Trigger: When admin adds a response to user feedback (legacy or conversation)
 * Action: Send push + feed notification to the user who submitted the feedback
 */
export const onFeedbackResponse = onDocumentUpdated('user_feedback/{feedbackId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  // Detect admin response: either legacy adminResponse field or conversation update
  const isLegacyResponse = !before?.adminResponse && after?.adminResponse;
  const isConversationResponse =
    before?.lastMessageBy !== 'admin' && after?.lastMessageBy === 'admin';

  // Only trigger when admin responds
  if (!isLegacyResponse && !isConversationResponse) {
    logger.debug('📬 [FEEDBACK_RESPONSE] No new admin response detected, skipping');
    return;
  }

  // 🎯 [KIM FIX] Handle BOTH legacy and conversation responses
  // Previously only isLegacyResponse was processed, causing second+ admin replies to not trigger notifications
  const userId = after.userId;
  const userName = after.userName || 'User';
  const feedbackId = event.params.feedbackId;
  const feedbackTitle = after.title || after.userMessage?.substring(0, 30) + '...';

  // Get the response message from either legacy field or latest conversation message
  let adminResponseMessage: string;
  if (isConversationResponse && after.conversation?.length > 0) {
    // 🎯 Get the latest admin message from conversation array
    const latestMessage = after.conversation[after.conversation.length - 1];
    adminResponseMessage = latestMessage?.message || after.adminResponse || '';
  } else {
    adminResponseMessage = after.adminResponse || '';
  }

  // 🎯 Process both legacy and conversation responses (skip duplicate if both true)
  {
    logger.info('📬 [FEEDBACK_RESPONSE] New admin response detected', {
      feedbackId,
      userId,
      userName,
      feedbackTitle,
      responsePreview: adminResponseMessage?.substring(0, 50) + '...',
      isLegacyResponse,
      isConversationResponse,
    });

    try {
      const db = getFirestore();

      // 1️⃣ Get user's data for FCM token
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        logger.warn('📬 [FEEDBACK_RESPONSE] User document not found', { userId });
        return;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      // 🎯 [KIM FIX] Feed item creation removed - users get push notification + chatbot badge only
      // Home feed 피드 아이템은 불필요 (푸시 알림과 챗봇 배지로 충분)

      // 2️⃣ Send push notification if FCM token exists
      if (fcmToken) {
        const message = {
          token: fcmToken,
          notification: {
            title: '📬 피드백 답변 도착 / Feedback Response',
            body: `"${feedbackTitle}"에 대한 관리자 답변이 도착했습니다. / Admin responded to "${feedbackTitle}"`,
          },
          data: {
            type: 'feedback_response_received',
            feedbackId,
            title: feedbackTitle || '',
            navigationTarget: 'AiChatbot',
          },
          android: {
            priority: 'high' as const,
            notification: {
              channelId: 'default',
              sound: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        const messaging = getMessaging();
        await messaging.send(message);

        logger.info('🔔 [FEEDBACK_RESPONSE] Push notification sent to user', { userId });
      } else {
        logger.warn('📬 [FEEDBACK_RESPONSE] No FCM token found for user', { userId });
      }

      logger.info('✅ [FEEDBACK_RESPONSE] All notifications sent', {
        feedbackId,
        userId,
      });
    } catch (error) {
      logger.error('❌ [FEEDBACK_RESPONSE] Error sending notifications', {
        feedbackId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw error - allow the function to complete even if notification fails
    }
  }
});

/**
 * 💬 Trigger: When user replies to existing feedback conversation
 * Action: Send push + feed notification to all super admins
 */
export const onUserReplyToFeedback = onDocumentUpdated(
  'user_feedback/{feedbackId}',
  async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Only trigger when lastMessageBy changes to 'user' (user replied to conversation)
    if (before?.lastMessageBy === 'user' || after?.lastMessageBy !== 'user') {
      return; // Not a user reply, skip
    }

    // Additional check: conversation array must have grown
    const beforeConvLength = before?.conversation?.length || 0;
    const afterConvLength = after?.conversation?.length || 0;

    if (afterConvLength <= beforeConvLength) {
      return; // No new message added, skip
    }

    const feedbackId = event.params.feedbackId;
    const userId = after?.userId;
    const userName = after?.userName || 'User';
    const feedbackTitle = after?.title || after?.userMessage?.substring(0, 30) + '...';

    // Get the latest user message from conversation
    const latestMessage = after?.conversation?.[afterConvLength - 1];
    const userReplyPreview = latestMessage?.message?.substring(0, 100) || '';

    logger.info('💬 [USER_REPLY] User replied to feedback conversation', {
      feedbackId,
      userId,
      userName,
      feedbackTitle,
      replyPreview: userReplyPreview.substring(0, 50) + '...',
    });

    try {
      const db = getFirestore();

      // 1️⃣ Get super admins list from _internal/admins
      const adminDocRef = db.collection('_internal').doc('admins');
      const adminDoc = await adminDocRef.get();

      if (!adminDoc.exists) {
        logger.warn('💬 [USER_REPLY] No admin list found - skipping notifications');
        return;
      }

      const adminData = adminDoc.data();
      const superAdmins: string[] = adminData?.superAdmins || [];

      if (superAdmins.length === 0) {
        logger.warn('💬 [USER_REPLY] No super admins configured');
        return;
      }

      logger.info('💬 [USER_REPLY] Found super admins', { count: superAdmins.length });

      // 2️⃣ Get FCM tokens for all admins
      const adminUsers = await Promise.all(
        superAdmins.map(async uid => {
          const userDoc = await db.collection('users').doc(uid).get();
          return {
            uid,
            data: userDoc.exists ? userDoc.data() : null,
          };
        })
      );

      // 3️⃣ Create feed items for all admins
      const feedPromises = superAdmins.map(async adminUid => {
        const feedItem = {
          type: 'feedback_user_reply',
          actorId: userId,
          actorName: userName,
          targetId: adminUid,
          metadata: {
            feedbackId,
            feedbackTitle,
            replyPreview: userReplyPreview,
            // Navigation target: Admin Dashboard > User Feedback
            navigationTarget: 'AdminDashboard',
            navigationParams: {
              screen: 'UserFeedback',
              feedbackId,
            },
          },
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          isActive: true,
          visibility: 'private',
          visibleTo: [adminUid],
        };

        return db.collection('feed').add(feedItem);
      });

      await Promise.all(feedPromises);

      logger.info('📰 [USER_REPLY] Feed items created for admins', {
        count: superAdmins.length,
      });

      // 4️⃣ Send push notifications to all admins
      const pushPromises = adminUsers
        .filter(admin => admin.data?.fcmToken)
        .map(async adminUser => {
          const fcmToken = adminUser.data?.fcmToken;
          if (!fcmToken) return;

          const message = {
            token: fcmToken,
            notification: {
              title: '💬 피드백 답변 도착 / User Reply',
              body: `${userName}님이 "${feedbackTitle}"에 답변했습니다: "${userReplyPreview.substring(0, 50)}..."`,
            },
            data: {
              type: 'feedback_user_reply',
              feedbackId,
              navigationTarget: 'AdminDashboard',
              screen: 'UserFeedback',
            },
            android: {
              priority: 'high' as const,
              notification: {
                channelId: 'default',
                sound: 'default',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          };

          try {
            const messaging = getMessaging();
            await messaging.send(message);
            logger.info('🔔 [USER_REPLY] Push sent to admin', {
              adminUid: adminUser.uid,
            });
          } catch (pushError) {
            logger.warn('⚠️ [USER_REPLY] Push failed for admin', {
              adminUid: adminUser.uid,
              error: pushError instanceof Error ? pushError.message : String(pushError),
            });
          }
        });

      await Promise.all(pushPromises);

      logger.info('✅ [USER_REPLY] All admin notifications sent', {
        feedbackId,
        adminCount: superAdmins.length,
      });
    } catch (error) {
      logger.error('❌ [USER_REPLY] Error sending notifications', {
        feedbackId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
