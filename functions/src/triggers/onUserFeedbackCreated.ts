/**
 * 🔔 User Feedback Created Trigger
 *
 * Sends push + feed notifications to all admins when a user submits feedback
 * - Creates feed items for all super admins
 * - Sends push notifications to all super admins
 * - Navigation target: Admin Dashboard > User Feedback
 *
 * @author Kim (킴)
 * @date 2025-01-08
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface UserFeedbackData {
  userId: string;
  userName: string;
  userEmail?: string;
  title?: string;
  userMessage: string;
  detectedIssue?: {
    priority: 'high' | 'medium' | 'low';
    category: 'bug' | 'ux' | 'confusion';
    keywords: string[];
    context: string;
  };
  status: 'new' | 'reviewing' | 'resolved';
  timestamp: admin.firestore.Timestamp;
}

/**
 * Triggered when a new user_feedback document is created
 * Sends notifications to all super admins
 */
export const onUserFeedbackCreated = onDocumentCreated(
  'user_feedback/{feedbackId}',
  async event => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('📬 [FEEDBACK_CREATED] No data in snapshot');
      return;
    }

    const feedbackData = snapshot.data() as UserFeedbackData;
    const feedbackId = event.params.feedbackId;

    logger.info('📬 [FEEDBACK_CREATED] New user feedback received', {
      feedbackId,
      userId: feedbackData.userId,
      userName: feedbackData.userName,
      priority: feedbackData.detectedIssue?.priority || 'normal',
    });

    try {
      // 1️⃣ Get super admins list from _internal/admins
      const adminDocRef = db.collection('_internal').doc('admins');
      const adminDoc = await adminDocRef.get();

      if (!adminDoc.exists) {
        logger.warn('📬 [FEEDBACK_CREATED] No admin list found - skipping notifications');
        return;
      }

      const adminData = adminDoc.data();
      const superAdmins: string[] = adminData?.superAdmins || [];

      if (superAdmins.length === 0) {
        logger.warn('📬 [FEEDBACK_CREATED] No super admins configured');
        return;
      }

      logger.info('📬 [FEEDBACK_CREATED] Found super admins', {
        count: superAdmins.length,
      });

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

      // Priority emoji for notifications
      const priorityEmoji =
        feedbackData.detectedIssue?.priority === 'high'
          ? '🚨'
          : feedbackData.detectedIssue?.priority === 'medium'
            ? '⚠️'
            : '📬';

      // Feedback title for display
      const feedbackTitle =
        feedbackData.title || feedbackData.userMessage?.substring(0, 30) + '...' || 'User Feedback';

      // 3️⃣ Create feed items for all admins
      const feedPromises = superAdmins.map(async adminUid => {
        const feedItem = {
          type: 'admin_feedback_received',
          actorId: feedbackData.userId,
          actorName: feedbackData.userName || 'User',
          targetId: adminUid,
          metadata: {
            feedbackId,
            feedbackTitle,
            priority: feedbackData.detectedIssue?.priority || 'normal',
            category: feedbackData.detectedIssue?.category || 'general',
            userEmail: feedbackData.userEmail || '',
            // Navigation target: Admin Dashboard > User Feedback
            navigationTarget: 'AdminDashboard',
            navigationParams: {
              screen: 'UserFeedback',
              feedbackId,
            },
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          visibility: 'private',
          visibleTo: [adminUid], // Only visible to this admin
        };

        return db.collection('feed').add(feedItem);
      });

      await Promise.all(feedPromises);

      logger.info('📰 [FEEDBACK_CREATED] Feed items created for admins', {
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
              title: `${priorityEmoji} 새 사용자 피드백 / New User Feedback`,
              body: `${feedbackData.userName}님이 피드백을 보냈습니다: "${feedbackTitle}"`,
            },
            data: {
              type: 'admin_feedback_received',
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
            await admin.messaging().send(message);
            logger.info('🔔 [FEEDBACK_CREATED] Push sent to admin', {
              adminUid: adminUser.uid,
            });
          } catch (pushError) {
            logger.warn('⚠️ [FEEDBACK_CREATED] Push failed for admin', {
              adminUid: adminUser.uid,
              error: pushError instanceof Error ? pushError.message : String(pushError),
            });
          }
        });

      await Promise.all(pushPromises);

      logger.info('✅ [FEEDBACK_CREATED] All admin notifications sent', {
        feedbackId,
        adminCount: superAdmins.length,
      });
    } catch (error) {
      logger.error('❌ [FEEDBACK_CREATED] Error sending notifications', {
        feedbackId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
