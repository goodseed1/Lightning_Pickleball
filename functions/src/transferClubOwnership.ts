/**
 * 🔄 Transfer Club Ownership Cloud Function
 * Allows current club owner to transfer ownership to another admin/manager
 *
 * @author Kim (Claude Code)
 * @date 2024-12-24
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface TransferClubOwnershipRequest {
  clubId: string;
  newOwnerId: string;
}

export interface TransferClubOwnershipResponse {
  success: boolean;
  message: string;
  data?: {
    clubId: string;
    clubName: string;
    previousOwnerId: string;
    newOwnerId: string;
    newOwnerName: string;
  };
}

/**
 * 🔄 Transfer Club Ownership
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be current club owner
 * - New owner must be an active admin/manager in the club
 *
 * Actions:
 * - Update old owner's role to 'admin'
 * - Update new owner's role to 'owner'
 * - Update club's createdBy field
 * - Notify new owner and all members
 * - Create feed item
 */
export const transferClubOwnership = onCall<TransferClubOwnershipRequest>(async request => {
  // 1. Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to transfer ownership.');
  }

  const currentUserId = request.auth.uid;
  const { clubId, newOwnerId } = request.data;

  logger.info('🔄 [TransferOwnership] Starting transfer', {
    clubId,
    currentUserId,
    newOwnerId,
  });

  // 2. Validate input
  if (!clubId || !newOwnerId) {
    throw new HttpsError('invalid-argument', 'clubId and newOwnerId are required.');
  }

  if (currentUserId === newOwnerId) {
    throw new HttpsError('invalid-argument', 'Cannot transfer ownership to yourself.');
  }

  try {
    // 3. Run everything in a transaction
    const result = await db.runTransaction(async transaction => {
      // 3a. Verify current user is owner
      const currentOwnerQuery = await db
        .collection('clubMembers')
        .where('clubId', '==', clubId)
        .where('userId', '==', currentUserId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (currentOwnerQuery.empty) {
        throw new HttpsError('not-found', 'You are not a member of this club.');
      }

      const currentOwnerDoc = currentOwnerQuery.docs[0];
      const currentOwnerData = currentOwnerDoc.data();

      // 🔄 [KIM FIX] 현재 시스템에서 'admin'이 오너 역할을 겸함
      if (currentOwnerData.role !== 'admin') {
        throw new HttpsError(
          'permission-denied',
          'Only the club admin (owner) can transfer ownership.'
        );
      }

      // 3b. Verify new owner is an admin/manager in the club
      const newOwnerQuery = await db
        .collection('clubMembers')
        .where('clubId', '==', clubId)
        .where('userId', '==', newOwnerId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (newOwnerQuery.empty) {
        throw new HttpsError('not-found', 'Selected user is not an active member of this club.');
      }

      const newOwnerDoc = newOwnerQuery.docs[0];
      const newOwnerData = newOwnerDoc.data();

      // 🔄 [KIM FIX] 새 오너는 manager만 가능 (admin은 이미 현재 오너)
      if (newOwnerData.role !== 'manager') {
        throw new HttpsError(
          'failed-precondition',
          'Ownership can only be transferred to a manager.'
        );
      }

      // 3c. Get club info
      const clubRef = db.collection('tennis_clubs').doc(clubId);
      const clubDoc = await transaction.get(clubRef);

      if (!clubDoc.exists) {
        throw new HttpsError('not-found', 'Club not found.');
      }

      const clubData = clubDoc.data();
      const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';

      // 3d. Get new owner's name
      const newOwnerUserDoc = await db.collection('users').doc(newOwnerId).get();
      const newOwnerUserData = newOwnerUserDoc.data();
      const newOwnerName =
        newOwnerUserData?.displayName ||
        newOwnerUserData?.nickname ||
        newOwnerData.userName ||
        'Unknown User';

      // 3e. 🔄 [KIM FIX] 이전 오너를 manager로 강등
      transaction.update(currentOwnerDoc.ref, {
        role: 'manager',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3f. 🔄 [KIM FIX] 새 오너를 admin으로 승격
      transaction.update(newOwnerDoc.ref, {
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3g. Update club's createdBy field
      transaction.update(clubRef, {
        createdBy: newOwnerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('✅ [TransferOwnership] Transaction completed', {
        clubId,
        clubName,
        previousOwnerId: currentUserId,
        newOwnerId,
        newOwnerName,
      });

      return {
        clubId,
        clubName,
        previousOwnerId: currentUserId,
        newOwnerId,
        newOwnerName,
      };
    });

    // 4. POST-TRANSACTION: Send notifications
    try {
      logger.info('📮 [TransferOwnership] Sending notifications...');

      // 4a. Notify new owner - 🌍 [i18n] Use translation keys
      await db.collection('notifications').add({
        recipientId: result.newOwnerId,
        type: 'CLUB_OWNERSHIP_RECEIVED',
        clubId: result.clubId,
        title: 'notification.clubOwnershipReceivedTitle',
        message: 'notification.clubOwnershipReceived',
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'club_ownership_received',
          clubName: result.clubName,
          previousOwnerId: result.previousOwnerId,
        },
        // 🎯 [i18n] Include data for interpolation on client
        data: {
          clubName: result.clubName,
        },
      });

      // 4b. Notify all other club members
      const allMembersQuery = await db
        .collection('clubMembers')
        .where('clubId', '==', result.clubId)
        .where('status', '==', 'active')
        .get();

      // 🌍 [i18n] Use translation keys for member notifications
      const memberNotifications = allMembersQuery.docs
        .filter(
          doc =>
            doc.data().userId !== result.newOwnerId && doc.data().userId !== result.previousOwnerId
        )
        .map(doc =>
          db.collection('notifications').add({
            recipientId: doc.data().userId,
            type: 'CLUB_OWNER_CHANGED',
            clubId: result.clubId,
            title: 'notification.clubOwnerChangedTitle',
            message: 'notification.clubOwnerChanged',
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              notificationType: 'club_owner_changed',
              clubName: result.clubName,
              newOwnerName: result.newOwnerName,
            },
            // 🎯 [i18n] Include data for interpolation on client
            data: {
              clubName: result.clubName,
              newOwnerName: result.newOwnerName,
            },
          })
        );

      await Promise.all(memberNotifications);

      // 4c. Create feed item
      await db.collection('feed').add({
        type: 'club_owner_changed',
        actorId: result.newOwnerId,
        actorName: result.newOwnerName,
        clubId: result.clubId,
        clubName: result.clubName,
        content: 'feed.newClubOwnerWithClub',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        visibility: 'club_members',
        metadata: {
          previousOwnerId: result.previousOwnerId,
          newOwnerId: result.newOwnerId,
        },
      });

      logger.info('✅ [TransferOwnership] All notifications sent');
    } catch (notificationError) {
      // Don't fail the operation if notifications fail
      logger.error('⚠️ [TransferOwnership] Failed to send notifications:', notificationError);
    }

    return {
      success: true,
      message: `Ownership of '${result.clubName}' successfully transferred to '${result.newOwnerName}'.`,
      data: result,
    } as TransferClubOwnershipResponse;
  } catch (error) {
    logger.error('❌ [TransferOwnership] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      `Failed to transfer ownership: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});
