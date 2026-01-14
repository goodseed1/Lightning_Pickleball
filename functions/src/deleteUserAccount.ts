/**
 * 🗑️ Delete User Account
 * Cloud Function for complete account deletion using Admin SDK
 * Admin SDK bypasses the requires-recent-login restriction
 *
 * ✅ [v2.1] Added club owner protection:
 *   - If user owns clubs with other admins → Auto-transfer ownership
 *   - If user owns clubs without other admins → Block deletion
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * 🔄 Transfer club ownership to another admin/manager
 */
async function transferClubOwnership(
  clubId: string,
  oldOwnerId: string,
  newOwnerId: string,
  newOwnerName: string
): Promise<void> {
  const batch = db.batch();

  // 1. Update old owner's membership to 'admin' role
  const oldOwnerMembershipQuery = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('userId', '==', oldOwnerId)
    .limit(1)
    .get();

  if (!oldOwnerMembershipQuery.empty) {
    // Just delete, since user is leaving
    batch.delete(oldOwnerMembershipQuery.docs[0].ref);
  }

  // 2. 🔄 [KIM FIX] Update new owner's membership to 'admin' role (admin = owner)
  const newOwnerMembershipQuery = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('userId', '==', newOwnerId)
    .limit(1)
    .get();

  if (!newOwnerMembershipQuery.empty) {
    batch.update(newOwnerMembershipQuery.docs[0].ref, {
      role: 'admin', // 🔄 [KIM FIX] admin = owner
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 3. Update club document's createdBy field
  const clubRef = db.collection('tennis_clubs').doc(clubId);
  batch.update(clubRef, {
    createdBy: newOwnerId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // 🎯 [KIM FIX] Use translation keys for i18n
  // 4. Create notification for new owner
  await db.collection('notifications').add({
    recipientId: newOwnerId,
    type: 'CLUB_OWNERSHIP_TRANSFERRED',
    clubId: clubId,
    message: 'notification.clubOwnershipTransferred',
    status: 'unread',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      notificationType: 'club_ownership_transferred',
      previousOwnerId: oldOwnerId,
    },
  });

  logger.info('✅ [DeleteAccount] Club ownership transferred', {
    clubId,
    oldOwnerId,
    newOwnerId,
    newOwnerName,
  });
}

export interface DeleteUserAccountRequest {
  confirmNickname: string; // User must confirm by typing their nickname
}

export interface DeleteUserAccountResponse {
  success: boolean;
  message: string;
}

/**
 * 🗑️ Delete User Account
 * Callable Cloud Function to completely delete a user's account
 * Uses Admin SDK to bypass requires-recent-login restriction
 *
 * @param request - Contains confirmNickname for verification
 * @returns DeleteUserAccountResponse with success status
 */
export const deleteUserAccount = onCall<DeleteUserAccountRequest>(async request => {
  // 1. Verify authentication
  if (!request.auth) {
    logger.warn('🗑️ [DeleteAccount] Unauthenticated request');
    throw new HttpsError('unauthenticated', 'You must be logged in to delete your account.');
  }

  const userId = request.auth.uid;
  // 🔧 [KIM FIX] Trim confirmNickname to handle whitespace
  const confirmNickname = (request.data.confirmNickname || '').trim();

  logger.info('🗑️ [DeleteAccount] Starting account deletion', {
    userId,
    confirmNickname,
    timestamp: new Date().toISOString(),
  });

  try {
    // 2. Get user document to verify nickname
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      logger.warn('🗑️ [DeleteAccount] User document not found', { userId });
      throw new HttpsError('not-found', 'User profile not found.');
    }

    const userData = userDoc.data();
    // 🔧 [KIM FIX] Check profile.nickname first, then root-level nickname, then displayName
    // Firestore stores nickname in profile.nickname (see authService.createUserProfile)
    // 🔧 [KIM FIX] Trim whitespace to handle "이사 " vs "이사" mismatch
    const actualNickname = (
      userData?.profile?.nickname ||
      userData?.nickname ||
      userData?.displayName ||
      ''
    ).trim();

    logger.info('🗑️ [DeleteAccount] Nickname comparison debug', {
      userId,
      'profile.nickname': userData?.profile?.nickname,
      'root.nickname': userData?.nickname,
      displayName: userData?.displayName,
      actualNickname,
      confirmNickname,
    });

    // 3. Verify nickname confirmation (security check)
    if (confirmNickname !== actualNickname) {
      logger.warn('🗑️ [DeleteAccount] Nickname mismatch', {
        userId,
        expected: actualNickname,
        received: confirmNickname,
      });
      throw new HttpsError(
        'failed-precondition',
        'Nickname confirmation does not match. Account deletion cancelled.'
      );
    }

    logger.info('🗑️ [DeleteAccount] Nickname verified, proceeding with deletion', { userId });

    // 4. 🔒 CHECK CLUB OWNERSHIP - Option B + C
    logger.info('🏛️ [DeleteAccount] Checking club ownership...', { userId });

    // 🔄 [KIM FIX] admin = owner
    const ownedClubsQuery = await db
      .collection('clubMembers')
      .where('userId', '==', userId)
      .where('role', '==', 'admin')
      .where('status', '==', 'active')
      .get();

    const ownedClubs = ownedClubsQuery.docs;
    logger.info(`🏛️ [DeleteAccount] User owns ${ownedClubs.length} clubs`);

    if (ownedClubs.length > 0) {
      const clubsWithoutSuccessor: string[] = [];
      const clubsToTransfer: Array<{
        clubId: string;
        clubName: string;
        newOwnerId: string;
        newOwnerName: string;
      }> = [];

      for (const clubDoc of ownedClubs) {
        const clubId = clubDoc.data().clubId;

        // Get club name
        const clubSnapshot = await db.collection('tennis_clubs').doc(clubId).get();
        const clubData = clubSnapshot.data();
        const clubName = clubData?.profile?.name || clubData?.name || 'Unknown Club';

        // 🔄 [KIM FIX] manager만 후계자 후보 (admin = owner, 삭제하려는 본인)
        // 🔧 [KIM FIX] orderBy 제거 - composite index 없이 작동하도록 코드에서 정렬
        const otherAdminsQuery = await db
          .collection('clubMembers')
          .where('clubId', '==', clubId)
          .where('role', '==', 'manager')
          .where('status', '==', 'active')
          .get();

        if (otherAdminsQuery.empty) {
          // No other admins → Cannot transfer, need to block
          clubsWithoutSuccessor.push(clubName);
          logger.warn('⚠️ [DeleteAccount] Club has no successor', { clubId, clubName });
        } else {
          // Has other admins → Can transfer
          // 🔧 [KIM FIX] Sort in code: oldest joinedAt first
          const sortedManagers = otherAdminsQuery.docs.sort((a, b) => {
            const aJoinedAt = a.data().joinedAt?.toDate?.() || new Date(0);
            const bJoinedAt = b.data().joinedAt?.toDate?.() || new Date(0);
            return aJoinedAt.getTime() - bJoinedAt.getTime();
          });
          const newOwnerDoc = sortedManagers[0];
          const newOwnerData = newOwnerDoc.data();

          // Get new owner's name
          const newOwnerUserDoc = await db.collection('users').doc(newOwnerData.userId).get();
          const newOwnerUserData = newOwnerUserDoc.data();
          const newOwnerName =
            newOwnerUserData?.displayName ||
            newOwnerUserData?.nickname ||
            newOwnerData.userName ||
            'Unknown User';

          clubsToTransfer.push({
            clubId,
            clubName,
            newOwnerId: newOwnerData.userId,
            newOwnerName,
          });

          logger.info('✅ [DeleteAccount] Found successor for club', {
            clubId,
            clubName,
            newOwnerId: newOwnerData.userId,
            newOwnerName,
          });
        }
      }

      // Option B: Block if any club has no successor
      if (clubsWithoutSuccessor.length > 0) {
        const clubNames = clubsWithoutSuccessor.join(', ');
        logger.warn('❌ [DeleteAccount] Blocking deletion - clubs without successors', {
          clubs: clubsWithoutSuccessor,
        });
        throw new HttpsError(
          'failed-precondition',
          `다음 클럽의 관리자로 등록되어 있어 계정을 삭제할 수 없습니다: ${clubNames}. ` +
            '먼저 다른 관리자를 지정하거나 클럽을 삭제해주세요.'
        );
      }

      // Option C: Transfer ownership for all clubs
      for (const transfer of clubsToTransfer) {
        await transferClubOwnership(
          transfer.clubId,
          userId,
          transfer.newOwnerId,
          transfer.newOwnerName
        );

        // Notify all club members about ownership change
        const allMembersQuery = await db
          .collection('clubMembers')
          .where('clubId', '==', transfer.clubId)
          .where('status', '==', 'active')
          .get();

        // 🎯 [KIM FIX] Use translation keys for i18n
        const memberNotifications = allMembersQuery.docs
          .filter(doc => doc.data().userId !== transfer.newOwnerId) // Exclude new owner (already notified)
          .map(doc =>
            db.collection('notifications').add({
              recipientId: doc.data().userId,
              type: 'CLUB_OWNER_CHANGED',
              clubId: transfer.clubId,
              message: 'notification.clubOwnerChanged',
              status: 'unread',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                notificationType: 'club_owner_changed',
                clubName: transfer.clubName,
                newOwnerName: transfer.newOwnerName,
              },
            })
          );

        await Promise.all(memberNotifications);

        // Create feed item for club
        await db.collection('feed').add({
          type: 'club_owner_changed',
          actorId: transfer.newOwnerId,
          actorName: transfer.newOwnerName,
          clubId: transfer.clubId,
          clubName: transfer.clubName,
          content: 'feed.newClubOwner',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          visibility: 'club_members',
          metadata: {
            previousOwnerId: userId,
            newOwnerId: transfer.newOwnerId,
          },
        });
      }

      logger.info('✅ [DeleteAccount] All club ownerships transferred successfully');
    }

    // 5. Delete all user-related data from Firestore
    const batch = db.batch();
    let deletedCount = 0;

    // 5a. Delete club memberships (remaining ones - ownership already handled)
    logger.info('🧹 [DeleteAccount] Cleaning up club memberships...');
    const clubMembersSnapshot = await db
      .collection('clubMembers')
      .where('userId', '==', userId)
      .get();
    clubMembersSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    logger.info(`📋 [DeleteAccount] Found ${clubMembersSnapshot.size} club memberships to delete`);

    // 5b. Delete friend relationships
    logger.info('🧹 [DeleteAccount] Cleaning up friend relationships...');
    const [senderSnapshot, receiverSnapshot] = await Promise.all([
      db.collection('friendships').where('senderId', '==', userId).get(),
      db.collection('friendships').where('receiverId', '==', userId).get(),
    ]);
    senderSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    receiverSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    logger.info(
      `📋 [DeleteAccount] Found ${senderSnapshot.size + receiverSnapshot.size} friend relationships to delete`
    );

    // 5c. Delete nickname index entry
    logger.info('🧹 [DeleteAccount] Cleaning up nickname index...');
    const normalizedNickname = actualNickname.toLowerCase().trim().replace(/\s+/g, ' ');
    const nicknameIndexRef = db.collection('nickname_index').doc(normalizedNickname);
    const nicknameIndexDoc = await nicknameIndexRef.get();
    if (nicknameIndexDoc.exists && nicknameIndexDoc.data()?.uid === userId) {
      batch.delete(nicknameIndexRef);
      deletedCount++;
      logger.info('📋 [DeleteAccount] Nickname index entry will be deleted');
    }

    // 5d. Delete user document
    logger.info('🧹 [DeleteAccount] Deleting user document...');
    batch.delete(db.collection('users').doc(userId));
    deletedCount++;

    // Commit Firestore deletions
    await batch.commit();
    logger.info(`✅ [DeleteAccount] Firestore cleanup complete: ${deletedCount} documents deleted`);

    // 6. Delete Firebase Auth account using Admin SDK
    // This bypasses the requires-recent-login restriction!
    logger.info('🔥 [DeleteAccount] Deleting Firebase Auth account...');
    await auth.deleteUser(userId);
    logger.info('✅ [DeleteAccount] Firebase Auth account deleted');

    logger.info('🎉 [DeleteAccount] Account deletion completed successfully', {
      userId,
      documentsDeleted: deletedCount,
    });

    return {
      success: true,
      message: 'Account deleted successfully',
    } as DeleteUserAccountResponse;
  } catch (error) {
    logger.error('❌ [DeleteAccount] Error during account deletion', { error, userId });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to delete account. Please try again.');
  }
});
