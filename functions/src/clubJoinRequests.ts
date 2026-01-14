/**
 * 🏰 Operation Citadel: Secure Club Join Request Management
 * Cloud Functions for managing club join requests with atomic transactions
 * ✅ [v2] Migrated to Firebase Functions v2 API
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import {
  sendClubJoinApprovedPushNotification,
  sendClubJoinRejectedPushNotification,
} from './utils/clubNotificationSender';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// 🎾 CLUB MEMBERSHIP LIMIT: Maximum clubs a user can JOIN (be a member of)
const MAX_CLUB_MEMBERSHIPS_PER_USER = 5;

export interface ApproveJoinRequestData {
  requestId: string;
}

export interface RejectJoinRequestData {
  requestId: string;
  reason?: string;
}

export interface RemoveClubMemberData {
  clubId: string;
  userId: string;
  reason?: string;
}

/**
 * Cloud Function for approving club join requests
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 *
 * Features:
 * - 🏰 Atomic transactions for data consistency
 * - 🕵️ Enhanced debugging and logging
 * - 📊 Automatic club statistics updates
 * - 📝 Activity logging for audit trail
 */
export const approveJoinRequest = onCall<ApproveJoinRequestData>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      logger.error('🚫 [Operation Citadel] Unauthenticated request');
      throw new HttpsError('unauthenticated', 'You must be logged in to approve join requests.');
    }

    const { requestId } = request.data;
    const adminId = request.auth.uid;

    logger.info('🏰 [Operation Citadel] approveJoinRequest called', {
      requestId,
      adminId,
      timestamp: new Date().toISOString(),
    });

    if (!requestId) {
      logger.error('🚫 [Operation Citadel] Missing requestId');
      throw new HttpsError('invalid-argument', 'requestId is required.');
    }

    // 🏰 CITADEL CORE: Atomic transaction ensures all-or-nothing operation
    const result = await db.runTransaction(async transaction => {
      logger.info('🔄 [Operation Citadel] Starting atomic transaction for requestId:', requestId);

      // 🕵️ [Operation Interrogation] Enhanced debugging for document lookup
      logger.info(`🕵️ [Interrogation] Searching for document: clubJoinRequests/${requestId}`);
      logger.info(`🕵️ [Interrogation] Collection: clubJoinRequests, Document ID: ${requestId}`);
      logger.info(
        `🕵️ [Interrogation] Full path: ${db.collection('clubJoinRequests').doc(requestId).path}`
      );

      // 1. 🎯 Read from CORRECT collection: 'clubJoinRequests' (not subcollection)
      const requestRef = db.collection('clubJoinRequests').doc(requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists) {
        logger.error('❌ [Operation Interrogation] Join request not found - enhanced debugging:', {
          requestId,
          collection: 'clubJoinRequests',
          searchPath: requestRef.path,
          documentExists: requestDoc.exists,
          timestamp: new Date().toISOString(),
        });

        // 🕵️ [Operation Interrogation] Check if document exists in other collections
        logger.info('🕵️ [Interrogation] Checking for document in other potential collections...');

        try {
          // Check if it might be in old collection name
          const altRef = db.collection('clubJoinRequests').doc(requestId);
          const altDoc = await altRef.get();
          logger.info(`🕵️ [Interrogation] Check clubJoinRequests: ${altDoc.exists}`);
        } catch {
          logger.info('🕵️ [Interrogation] clubJoinRequests collection does not exist');
        }

        throw new HttpsError(
          'not-found',
          `Join request '${requestId}' not found. It may have been processed already or the ID is incorrect. ` +
            `Searched in: clubJoinRequests/${requestId}`
        );
      }

      const requestData = requestDoc.data();
      logger.info('✅ [Operation Citadel] Found join request data:', {
        requestId,
        clubId: requestData?.clubId,
        userId: requestData?.userId,
        status: requestData?.status,
        userEmail: requestData?.userEmail,
      });

      if (!requestData?.clubId || !requestData?.userId) {
        logger.error('❌ [Operation Citadel] Invalid request data structure', { requestData });
        throw new HttpsError('failed-precondition', 'Invalid join request data.');
      }

      const { clubId, userId: applicantId } = requestData;

      // 2. 🏰 CITADEL SECURITY: Verify club exists
      const clubRef = db.collection('pickleball_clubs').doc(clubId);
      const clubDoc = await transaction.get(clubRef);

      if (!clubDoc.exists) {
        logger.error('❌ [Operation Citadel] Club not found', { clubId });
        throw new HttpsError('not-found', 'Club not found.');
      }

      // 2.5 🎾 [MEMBERSHIP LIMIT] Check if applicant has reached maximum club memberships
      const applicantMembershipsQuery = await db
        .collection('clubMembers')
        .where('userId', '==', applicantId)
        .where('status', '==', 'active')
        .get();

      const currentMembershipCount = applicantMembershipsQuery.size;

      if (currentMembershipCount >= MAX_CLUB_MEMBERSHIPS_PER_USER) {
        logger.warn('🚫 [MembershipLimit] Applicant has reached max clubs', {
          applicantId,
          currentCount: currentMembershipCount,
          maxAllowed: MAX_CLUB_MEMBERSHIPS_PER_USER,
        });
        throw new HttpsError(
          'failed-precondition',
          `이 사용자는 이미 ${MAX_CLUB_MEMBERSHIPS_PER_USER}개의 클럽에 가입되어 있어 더 이상 가입할 수 없습니다. (현재 ${currentMembershipCount}개 가입)`
        );
      }

      logger.info('✅ [MembershipLimit] Applicant can join', {
        applicantId,
        currentCount: currentMembershipCount,
        maxAllowed: MAX_CLUB_MEMBERSHIPS_PER_USER,
      });

      // 3. 🏰 CITADEL OPERATIONS: All database operations in single atomic transaction
      logger.info('⚡ [Operation Citadel] Executing atomic operations...');

      // 3a. 🎯 [KIM FIX] Fetch user data to get gender for rankings
      const userRef = db.collection('users').doc(applicantId);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.exists ? userDoc.data() : null;
      const userGender = userData?.gender as 'male' | 'female' | undefined;

      logger.info('🎯 [Operation Citadel] User data fetched for membership:', {
        applicantId,
        hasUserDoc: userDoc.exists,
        gender: userGender || 'not set',
      });

      // 3b. Update join request status
      transaction.update(requestRef, {
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: adminId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3c. Create club membership record
      const membershipId = `${clubId}_${applicantId}`;
      const memberRef = db.collection('clubMembers').doc(membershipId);
      transaction.set(memberRef, {
        userId: applicantId,
        clubId: clubId,
        role: 'member',
        status: 'active',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: adminId,
        // 🎯 [KIM FIX] Include gender field for gender-specific rankings
        ...(userGender && { gender: userGender }),
        memberInfo: {
          joinedViaRequest: true,
          requestId: requestId,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3d. Update club statistics
      transaction.update(clubRef, {
        'statistics.activeMembers': admin.firestore.FieldValue.increment(1),
        'statistics.totalMembers': admin.firestore.FieldValue.increment(1),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3e. Create activity log entry
      const activityRef = db.collection('clubActivityLogs').doc();
      transaction.set(activityRef, {
        clubId: clubId,
        type: 'member_approved',
        performedBy: adminId,
        targetUserId: applicantId,
        metadata: {
          requestId: requestId,
          membershipId: membershipId,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        requestId,
        clubId,
        applicantId,
        membershipId,
        clubName: clubDoc.data()?.profile?.name || clubDoc.data()?.name || 'Unknown Club',
        applicantData: requestData,
        success: true,
      };
    });

    logger.info('✅ [Operation Citadel] Transaction completed successfully:', result);

    // 🏅 [PROJECT OLYMPUS] Check and award club badges
    try {
      logger.info('🏅 [BADGE] Checking club badges for new member...');
      const { checkAllClubBadges } = await import('./utils/clubBadgeChecker');

      const awardedBadges = await checkAllClubBadges(
        result.applicantId,
        result.clubId,
        result.clubName
      );

      if (awardedBadges.length > 0) {
        logger.info(
          `🏅 [BADGE] Awarded ${awardedBadges.length} club badge(s) to ${result.applicantId}:`,
          {
            badges: awardedBadges,
          }
        );
      }
    } catch (badgeError) {
      logger.warn('⚠️ [BADGE] Failed to check club badges:', badgeError);
      // Don't fail join approval if badge check fails
    }

    // 🎉 POST-TRANSACTION: Create welcome notifications and feed items
    try {
      logger.info('🎉 [Operation Citadel] Creating welcome notifications for approved member...');

      // 1. Create notification for applicant
      await db.collection('notifications').add({
        recipientId: result.applicantId,
        type: 'CLUB_JOIN_APPROVED',
        clubId: result.clubId,
        message: `'${result.clubName}' 클럽 가입이 승인되었습니다! 🎉`,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'club_join_approved',
          requestId: result.requestId,
          clubName: result.clubName,
          deepLink: `club/${result.clubId}`,
        },
      });

      logger.info('✅ [Operation Citadel] Notification created for applicant');

      // 2. Create welcome feed item visible to all club members
      // 🔔 Fetch user name and photo from users collection (more reliable than join request data)
      let applicantName = result.applicantData.userName || 'Unknown User';
      let applicantPhotoURL: string | undefined;
      try {
        const userDoc = await db.collection('users').doc(result.applicantId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          applicantName =
            userData?.displayName || userData?.nickname || userData?.name || applicantName;
          applicantPhotoURL =
            userData?.photoURL || userData?.profile?.photoURL || userData?.avatarUrl;
          logger.info('✅ [Operation Citadel] Fetched user data from users collection:', {
            applicantName,
            hasPhoto: !!applicantPhotoURL,
          });
        }
      } catch (userFetchError) {
        logger.warn('⚠️ [Operation Citadel] Could not fetch user data, using fallback:', {
          error: userFetchError,
        });
      }

      // 🔔 Fetch club members to populate visibleTo array
      const clubMembersSnap = await db
        .collection('clubMembers')
        .where('clubId', '==', result.clubId)
        .where('status', '==', 'active')
        .get();

      const memberIds = clubMembersSnap.docs.map(doc => doc.data().userId as string);

      // Also include the new member (just approved)
      if (!memberIds.includes(result.applicantId)) {
        memberIds.push(result.applicantId);
      }

      logger.info('🔔 [Operation Citadel] Creating feed item visible to members:', {
        memberCount: memberIds.length,
        applicantName,
      });

      await db.collection('feed').add({
        type: 'club_join_request_approved',
        actorId: result.applicantId,
        actorName: applicantName,
        ...(applicantPhotoURL && { actorPhotoURL: applicantPhotoURL }), // 🖼️ Include profile photo if available
        clubId: result.clubId,
        clubName: result.clubName,
        metadata: {
          requestId: result.requestId,
          membershipId: result.membershipId,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        visibility: 'club_members',
        visibleTo: memberIds, // 🔔 Add visibleTo array for feed query
        isActive: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('✅ [Operation Citadel] Welcome feed item created');

      // 3. Send push notification to applicant
      await sendClubJoinApprovedPushNotification(result.applicantId, result.clubName);

      logger.info('✅ [Operation Citadel] Push notification sent to applicant');
    } catch (error) {
      // Don't fail the entire operation if notification/feed creation fails
      logger.error('⚠️ [Operation Citadel] Failed to create welcome notifications:', error);
    }

    return {
      success: true,
      message: 'Join request approved successfully',
      data: {
        requestId: result.requestId,
        clubId: result.clubId,
        membershipId: result.membershipId,
      },
    };
  } catch (error) {
    logger.error('❌ [Operation Citadel] Error approving join request:', {
      requestId: request.data.requestId,
      adminId: request.auth?.uid,
      error: error instanceof Error ? error.message : String(error),
    });

    // Re-throw Firebase HTTP errors as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors as internal errors
    throw new HttpsError(
      'internal',
      `Failed to approve join request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Cloud Function for rejecting club join requests
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 *
 * Companion function to approveJoinRequest for complete join request management
 */
export const rejectJoinRequest = onCall<RejectJoinRequestData>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to reject join requests.');
    }

    const { requestId, reason } = request.data;
    const adminId = request.auth.uid;

    logger.info('🏰 [Operation Citadel] rejectJoinRequest called', {
      requestId,
      adminId,
      reason: reason || 'No reason provided',
    });

    if (!requestId) {
      throw new HttpsError('invalid-argument', 'requestId is required.');
    }

    const result = await db.runTransaction(async transaction => {
      // 🕵️ [Operation Interrogation] Enhanced debugging for reject function too
      logger.info(
        `🕵️ [Interrogation] REJECT - Searching for document: clubJoinRequests/${requestId}`
      );

      // Read from correct collection
      const requestRef = db.collection('clubJoinRequests').doc(requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists) {
        logger.error('❌ [Operation Interrogation] REJECT - Join request not found:', {
          requestId,
          collection: 'clubJoinRequests',
          searchPath: requestRef.path,
          timestamp: new Date().toISOString(),
        });

        throw new HttpsError(
          'not-found',
          `Join request '${requestId}' not found for rejection. It may have been processed already or the ID is incorrect. ` +
            `Searched in: clubJoinRequests/${requestId}`
        );
      }

      const requestData = requestDoc.data();

      if (!requestData?.clubId || !requestData?.userId) {
        throw new HttpsError('failed-precondition', 'Invalid join request data.');
      }

      const { clubId, userId: applicantId } = requestData;

      // Get club data for club name
      const clubRef = db.collection('pickleball_clubs').doc(clubId);
      const clubDoc = await transaction.get(clubRef);

      // Update request status
      transaction.update(requestRef, {
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: adminId,
        rejectionReason: reason || 'No reason provided',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create activity log
      const activityRef = db.collection('clubActivityLogs').doc();
      transaction.set(activityRef, {
        clubId: clubId,
        type: 'member_rejected',
        performedBy: adminId,
        targetUserId: applicantId,
        metadata: {
          requestId: requestId,
          reason: reason || 'No reason provided',
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        requestId,
        clubId,
        applicantId,
        clubName: clubDoc.exists
          ? clubDoc.data()?.profile?.name || clubDoc.data()?.name || 'Unknown Club'
          : 'Unknown Club',
        rejectionReason: reason || 'No reason provided',
        success: true,
      };
    });

    logger.info('✅ [Operation Citadel] Join request rejected successfully:', result);

    // 📮 POST-TRANSACTION: Create rejection notifications
    try {
      logger.info('📮 [Operation Citadel] Creating rejection notifications...');

      // 1. Create notification for applicant
      await db.collection('notifications').add({
        recipientId: result.applicantId,
        type: 'CLUB_JOIN_REJECTED',
        clubId: result.clubId,
        message: `'${result.clubName}' 클럽 가입 신청이 거절되었습니다`,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'club_join_rejected',
          requestId: result.requestId,
          clubName: result.clubName,
          reason: result.rejectionReason,
        },
      });

      logger.info('✅ [Operation Citadel] Rejection notification created for applicant');

      // 2. Send push notification to applicant
      await sendClubJoinRejectedPushNotification(
        result.applicantId,
        result.clubName,
        result.rejectionReason
      );

      logger.info('✅ [Operation Citadel] Push notification sent to applicant');

      // 3. 🎯 Create feed item for rejected applicant (visible only to them)
      await db.collection('feed').add({
        type: 'club_join_request_rejected',
        actorId: result.applicantId,
        actorName: '', // Will be filled by client if needed
        clubId: result.clubId,
        clubName: result.clubName,
        content: 'feed.clubJoinRejected',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        visibility: 'private',
        visibleTo: [result.applicantId], // 🔒 Only the rejected user can see this
        metadata: {
          requestId: result.requestId,
          reason: result.rejectionReason,
        },
      });

      logger.info('✅ [Operation Citadel] Rejection feed item created for applicant');
    } catch (error) {
      // Don't fail the entire operation if notification/push/feed creation fails
      logger.error('⚠️ [Operation Citadel] Failed to create rejection notifications:', error);
    }

    return {
      success: true,
      message: 'Join request rejected successfully',
      data: { requestId: result.requestId },
    };
  } catch (error) {
    logger.error('❌ [Operation Citadel] Error rejecting join request:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      `Failed to reject join request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Cloud Function for removing a club member
 * ✅ [v2] Migrated to onCall from firebase-functions/v2/https
 *
 * Allows club admins to remove members from the club
 */
export const removeClubMember = onCall<RemoveClubMemberData>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to remove members.');
    }

    const { clubId, userId, reason } = request.data;
    const adminId = request.auth.uid;

    logger.info('🏰 [Operation Citadel] removeClubMember called', {
      clubId,
      userId,
      adminId,
      reason: reason || 'No reason provided',
    });

    if (!clubId || !userId) {
      throw new HttpsError('invalid-argument', 'clubId and userId are required.');
    }

    const result = await db.runTransaction(async transaction => {
      // 1. Verify admin has permission
      const adminMembershipId = `${clubId}_${adminId}`;
      const adminRef = db.collection('clubMembers').doc(adminMembershipId);
      const adminDoc = await transaction.get(adminRef);

      if (!adminDoc.exists || adminDoc.data()?.status !== 'active') {
        throw new HttpsError('permission-denied', 'You are not a member of this club.');
      }

      const adminRole = adminDoc.data()?.role;
      if (!['owner', 'admin', 'manager'].includes(adminRole)) {
        throw new HttpsError('permission-denied', 'Only club admins can remove members.');
      }

      // 2. Find membership document
      const membershipId = `${clubId}_${userId}`;
      const memberRef = db.collection('clubMembers').doc(membershipId);
      const memberDoc = await transaction.get(memberRef);

      if (!memberDoc.exists || memberDoc.data()?.status !== 'active') {
        throw new HttpsError('not-found', 'Member not found in this club.');
      }

      // 3. Prevent self-removal
      if (userId === adminId) {
        throw new HttpsError('failed-precondition', 'You cannot remove yourself from the club.');
      }

      // 4. Prevent removing owner
      const memberRole = memberDoc.data()?.role;
      if (memberRole === 'owner') {
        throw new HttpsError('failed-precondition', 'Cannot remove the club owner.');
      }

      // 5. Get club data for club name
      const clubRef = db.collection('pickleball_clubs').doc(clubId);
      const clubDoc = await transaction.get(clubRef);

      if (!clubDoc.exists) {
        throw new HttpsError('not-found', 'Club not found.');
      }

      const clubName = clubDoc.data()?.profile?.name || clubDoc.data()?.name || 'Unknown Club';

      // 6. Update membership status to removed
      transaction.update(memberRef, {
        status: 'removed',
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
        removedBy: adminId,
        removalReason: reason || 'Removed by admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 7. Update club statistics
      transaction.update(clubRef, {
        'statistics.activeMembers': admin.firestore.FieldValue.increment(-1),
        'statistics.totalMembers': admin.firestore.FieldValue.increment(-1),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 8. Create activity log
      const activityRef = db.collection('clubActivityLogs').doc();
      transaction.set(activityRef, {
        clubId: clubId,
        type: 'member_removed',
        performedBy: adminId,
        targetUserId: userId,
        metadata: {
          membershipId: membershipId,
          reason: reason || 'Removed by admin',
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        clubId,
        userId,
        membershipId,
        clubName,
        success: true,
      };
    });

    logger.info('✅ [Operation Citadel] Member removed successfully:', result);

    // 📮 POST-TRANSACTION: Create expulsion notifications and feed items
    try {
      logger.info('📮 [Operation Citadel] Creating expulsion notifications...');

      // 1. Create notification for expelled member
      await db.collection('notifications').add({
        recipientId: result.userId,
        type: 'CLUB_MEMBER_REMOVED',
        clubId: result.clubId,
        message: `'${result.clubName}' 클럽에서 제명되었습니다`,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'club_member_removed',
          clubName: result.clubName,
          reason: request.data.reason || 'No reason provided',
        },
      });

      logger.info('✅ [Operation Citadel] Expulsion notification created for member');

      // 2. 🎯 Create feed item for expelled member (visible only to them)
      const removalReason = request.data.reason;
      const feedContent =
        removalReason && removalReason !== '관리자에 의한 제명'
          ? `'${result.clubName}' 클럽에서 제명되었습니다\n\n📝 사유: ${removalReason}`
          : `'${result.clubName}' 클럽에서 제명되었습니다`;

      await db.collection('feed').add({
        type: 'club_member_removed',
        actorId: result.userId,
        actorName: '', // Will be filled by client if needed
        clubId: result.clubId,
        clubName: result.clubName,
        content: feedContent,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        visibility: 'private',
        visibleTo: [result.userId], // 🔒 Only the expelled user can see this
        metadata: {
          reason: removalReason || 'No reason provided',
        },
      });

      logger.info('✅ [Operation Citadel] Expulsion feed item created for member');
    } catch (error) {
      // Don't fail the entire operation if notification/feed creation fails
      logger.error('⚠️ [Operation Citadel] Failed to create expulsion notifications:', error);
    }

    return {
      success: true,
      message: 'Member removed successfully',
      data: {
        clubId: result.clubId,
        userId: result.userId,
      },
    };
  } catch (error) {
    logger.error('❌ [Operation Citadel] Error removing member:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      `Failed to remove member: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

export default {
  approveJoinRequest,
  rejectJoinRequest,
  removeClubMember,
};
