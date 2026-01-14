/**
 * 🔔 [HEIMDALL] Club Join Request Trigger
 *
 * Automatically creates feed items and notifications when a user requests to join a club.
 * This ensures proper authorization using admin privileges (bypasses client security rules).
 *
 * Trigger: club_join_requests/{requestId} onCreate
 * Condition: status === 'pending'
 * Actions:
 *  - Query all club admins (owner, admin, manager)
 *  - Create notification for each admin
 *  - Create feed item visible to admins
 *  - Send push notifications to admins
 *
 * Why Cloud Function?
 *  - Client-side writes to notifications/feed collections blocked by security rules (correct)
 *  - Cloud Functions have admin privileges
 *  - Centralized logic, better security
 *  - Consistent with team invitation pattern
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendClubJoinRequestPushNotification } from '../utils/clubNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Get all admin users of a club (owner, admin, manager)
 * @param clubId - Club ID
 * @returns Array of admin user IDs
 */
async function getClubAdmins(clubId: string): Promise<string[]> {
  const db = admin.firestore();
  const adminRoles = ['owner', 'admin', 'manager'];
  const adminIds: string[] = [];

  try {
    console.log('🔍 [CLUB JOIN TRIGGER] Querying club admins for club:', clubId);

    // Query clubMembers collection for admins
    const membersRef = db.collection('clubMembers');
    const q = membersRef.where('clubId', '==', clubId).where('status', '==', 'active');

    const snapshot = await q.get();

    snapshot.forEach(doc => {
      const memberData = doc.data();
      if (adminRoles.includes(memberData.role)) {
        adminIds.push(memberData.userId);
      }
    });

    console.log(`✅ [CLUB JOIN TRIGGER] Found ${adminIds.length} admins:`, adminIds);
    return adminIds;
  } catch (error) {
    console.error('❌ [CLUB JOIN TRIGGER] Failed to get club admins:', error);
    return [];
  }
}

/**
 * Main trigger function for club join requests
 */
export const onClubJoinRequestCreated = onDocumentCreated(
  'club_join_requests/{requestId}',
  async event => {
    const requestData = event.data?.data();
    const requestId = event.params.requestId;

    console.log('🔔 [CLUB JOIN TRIGGER] Join request created:', {
      requestId,
      clubId: requestData?.clubId,
      userId: requestData?.userId,
      userName: requestData?.userName,
      status: requestData?.status,
    });

    // 🎯 Only process pending join requests
    if (requestData?.status !== 'pending') {
      console.log(
        'ℹ️ [CLUB JOIN TRIGGER] Request status is not pending. Skipping notification creation.'
      );
      return null;
    }

    try {
      const db = admin.firestore();
      const {
        clubId,
        userId: applicantId,
        userName,
        displayName,
        userEmail: applicantEmail,
        requestMessage,
      } = requestData;

      if (!clubId || !applicantId) {
        console.warn('⚠️ [CLUB JOIN TRIGGER] Missing required fields, skipping');
        return null;
      }

      // 🎯 [KIM FIX] Get applicant name - fallback to user document if not in request data
      let applicantName = userName || displayName;
      if (!applicantName) {
        console.log(
          '🔍 [CLUB JOIN TRIGGER] No userName in request, fetching from user document...'
        );
        try {
          const userDoc = await db.doc(`users/${applicantId}`).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            applicantName =
              userData?.displayName ||
              userData?.profile?.nickname ||
              userData?.nickname ||
              '새 회원';
            console.log('✅ [CLUB JOIN TRIGGER] Fetched user name:', applicantName);
          } else {
            applicantName = '새 회원';
            console.log('⚠️ [CLUB JOIN TRIGGER] User document not found, using default name');
          }
        } catch (userError) {
          console.error('❌ [CLUB JOIN TRIGGER] Failed to fetch user name:', userError);
          applicantName = '새 회원';
        }
      }

      // 🔍 Fetch club data to get club name
      console.log('🔔 [CLUB JOIN TRIGGER] Fetching club data...');
      const clubRef = db.doc(`pickleball_clubs/${clubId}`);
      const clubSnap = await clubRef.get();

      if (!clubSnap.exists) {
        console.warn('⚠️ [CLUB JOIN TRIGGER] Club not found, skipping');
        return null;
      }

      const clubData = clubSnap.data();
      const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';
      console.log('🔔 [CLUB JOIN TRIGGER] Club found:', clubName);

      // 🔍 Get all club admins
      const adminIds = await getClubAdmins(clubId);

      if (adminIds.length === 0) {
        console.warn('⚠️ [CLUB JOIN TRIGGER] No admins found for club, skipping');
        return null;
      }

      // 💥 PHASE 1: Create NOTIFICATIONS for each admin 💥
      // 🌍 [i18n] Use translation keys instead of hardcoded Korean
      console.log('🔔 [CLUB JOIN TRIGGER] Creating notifications for admins...');
      const notificationPromises = adminIds.map(async adminId => {
        try {
          const notificationData = {
            recipientId: adminId,
            type: 'CLUB_JOIN_REQUEST',
            clubId: clubId,
            title: 'notification.clubJoinRequestTitle',
            message: 'notification.clubJoinRequest',
            relatedUserId: applicantId,
            applicantName: applicantName,
            applicantEmail: applicantEmail || null,
            requestMessage: requestMessage || null,
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              notificationType: 'club_join_request',
              actionRequired: true,
              requestId: requestId,
              deepLink: `club/${clubId}/join-requests`,
            },
            // 🎯 [i18n] Include data for interpolation on client
            data: {
              applicantName: applicantName,
              clubName: clubName,
            },
          };

          const notificationDoc = await db.collection('notifications').add(notificationData);
          console.log(
            `✅ [CLUB JOIN TRIGGER] Notification created for admin ${adminId}:`,
            notificationDoc.id
          );
        } catch (error) {
          console.error(
            `❌ [CLUB JOIN TRIGGER] Failed to create notification for admin ${adminId}:`,
            error
          );
        }
      });

      await Promise.all(notificationPromises);

      // 💥 PHASE 2: Create FEED ITEM visible to admins 💥
      try {
        console.log('🔔 [CLUB JOIN TRIGGER] Creating feed item...');
        const feedItemData = {
          type: 'club_join_request_pending',
          actorId: applicantId,
          actorName: applicantName,
          clubId: clubId,
          clubName: clubName,
          metadata: {
            requestId: requestId,
            applicantEmail: applicantEmail || null,
            requestMessage: requestMessage || null,
            status: 'pending',
          },
          visibility: 'club_admins',
          visibleTo: adminIds,
          isActive: true, // 🔥 Required by feedService query filters
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const feedDoc = await db.collection('feed').add(feedItemData);
        console.log('✅ [CLUB JOIN TRIGGER] Feed item created:', feedDoc.id);
      } catch (error) {
        console.error('❌ [CLUB JOIN TRIGGER] Failed to create feed item:', error);
        // Don't throw - feed item is not critical
      }

      // 💥 PHASE 3: Send PUSH NOTIFICATIONS to admins 💥
      console.log('🔔 [CLUB JOIN TRIGGER] Sending push notifications to admins...');
      const pushPromises = adminIds.map(async adminId => {
        try {
          await sendClubJoinRequestPushNotification(adminId, applicantName, clubName, requestId);
          console.log(`✅ [CLUB JOIN TRIGGER] Push notification sent to admin ${adminId}`);
        } catch (error) {
          console.error(`❌ [CLUB JOIN TRIGGER] Failed to send push to admin ${adminId}:`, error);
        }
      });

      await Promise.all(pushPromises);

      console.log('🎉 [CLUB JOIN TRIGGER] Join request notifications complete!', {
        requestId,
        applicant: applicantName,
        club: clubName,
        adminsNotified: adminIds.length,
      });

      return { success: true, requestId: requestId };
    } catch (error) {
      console.error('❌ [CLUB JOIN TRIGGER] Failed to process join request:', error);
      // Don't throw - we don't want to fail the request creation
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
);
