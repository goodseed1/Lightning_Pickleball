/**
 * Leave Club Cloud Function
 * ✅ [v2] Migrated to Firebase Functions v2 API
 * ✅ [v2.1] Added admin notifications when member leaves
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

export const leaveClub = onCall<{ clubId: string }>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const userId = request.auth.uid;
    const { clubId } = request.data;

    if (!clubId) {
      throw new HttpsError(
        'invalid-argument',
        'The function must be called with a "clubId" argument.'
      );
    }

    logger.info(`🚪 Processing leave request: User ${userId} leaving club ${clubId}`);

    const db = admin.firestore();

    // 💥 Use query-based approach instead of assumed document ID format
    logger.info('🔍 Searching for membership document using query...');

    // First, find the membership document using a query
    const membershipsRef = db.collection('clubMembers');
    const membershipQuery = membershipsRef
      .where('clubId', '==', clubId)
      .where('userId', '==', userId)
      .limit(1);

    const membershipSnapshot = await membershipQuery.get();

    if (membershipSnapshot.empty) {
      logger.error('❌ No membership document found for query');
      throw new HttpsError('not-found', 'Membership document not found');
    }

    const membershipDoc = membershipSnapshot.docs[0];
    const membershipRef = membershipDoc.ref;
    const membershipData = membershipDoc.data();

    logger.info('🔍 Found membership document:', {
      id: membershipDoc.id,
      clubId: membershipData.clubId,
      userId: membershipData.userId,
      role: membershipData.role,
      status: membershipData.status,
    });

    // Get user info for notification
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const userName = userData?.displayName || userData?.nickname || 'Unknown User';

    // Get club info for notification
    const clubDoc = await db.doc(`tennis_clubs/${clubId}`).get();
    const clubData = clubDoc.data();
    const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';

    // Define other document references
    const clubRef = db.doc(`tennis_clubs/${clubId}`);
    const userRef = db.doc(`users/${userId}`);

    // Execute all operations in a transaction for data consistency
    await db.runTransaction(async transaction => {
      // 1. Delete membership document completely
      transaction.delete(membershipRef);
      logger.info('🗑️ Membership document deleted');

      // 2. Update club statistics
      transaction.update(clubRef, {
        'stats.totalMembers': admin.firestore.FieldValue.increment(-1),
        'stats.activeMemberCount': admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info('📊 Club statistics updated');

      // 3. Update user's club memberships
      transaction.update(userRef, {
        'clubs.memberships': admin.firestore.FieldValue.arrayRemove(clubId),
        'clubs.adminOf': admin.firestore.FieldValue.arrayRemove(clubId), // Remove admin status if applicable
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info('👤 User profile updated');
    });

    logger.info(`✅ Successfully processed leave request for user ${userId} from club ${clubId}`);

    // 📮 POST-TRANSACTION: Notify club admins about member leaving
    try {
      logger.info('📮 [LeaveClub] Finding club admins to notify...');

      // 🔄 [KIM FIX] admin = owner, manager = 운영진
      const adminsQuery = db
        .collection('clubMembers')
        .where('clubId', '==', clubId)
        .where('role', 'in', ['admin', 'manager'])
        .where('status', '==', 'active');

      const adminsSnapshot = await adminsQuery.get();
      const adminIds: string[] = [];

      adminsSnapshot.forEach(doc => {
        const adminData = doc.data();
        if (adminData.userId && adminData.userId !== userId) {
          adminIds.push(adminData.userId);
        }
      });

      logger.info(`📮 [LeaveClub] Found ${adminIds.length} admins to notify`);

      if (adminIds.length > 0) {
        // Create notifications for each admin
        // 🌍 [i18n] Use translation keys instead of hardcoded Korean
        const notificationPromises = adminIds.map(async adminId => {
          // 1. Create notification
          await db.collection('notifications').add({
            recipientId: adminId,
            type: 'CLUB_MEMBER_LEFT',
            clubId: clubId,
            title: 'notification.memberLeftClubTitle',
            message: 'notification.memberLeftClub',
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              notificationType: 'club_member_left',
              clubName: clubName,
              memberName: userName,
              memberId: userId,
            },
            // 🎯 [i18n] Include data for interpolation on client
            data: {
              memberName: userName,
              clubName: clubName,
            },
          });
        });

        await Promise.all(notificationPromises);
        logger.info('✅ [LeaveClub] Admin notifications created');

        // 2. Create single feed item visible to all admins (for club activity feed)
        await db.collection('feed').add({
          type: 'club_member_left',
          actorId: userId,
          actorName: userName,
          clubId: clubId,
          clubName: clubName,
          content: 'feed.memberLeft',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          visibility: 'club_admins',
          visibleTo: adminIds, // 🔒 Only admins can see this
          metadata: {
            memberId: userId,
            memberName: userName,
          },
        });

        logger.info('✅ [LeaveClub] Club activity feed item created');
      }
    } catch (notificationError) {
      // Don't fail the entire operation if notifications fail
      logger.error('⚠️ [LeaveClub] Failed to send admin notifications:', notificationError);
    }

    return {
      success: true,
      message: `Successfully left club ${clubId}`,
      clubId,
      userId,
    };
  } catch (error) {
    logger.error('❌ Error in leaveClub function:', error);

    // Re-throw HttpsError as is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Convert other errors to internal error
    throw new HttpsError('internal', 'Failed to leave the club');
  }
});
