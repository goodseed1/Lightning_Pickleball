/**
 * 🤝 [FRIENDSHIP] Decline Friend Request - Firebase Functions v2
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Firebase Admin이 초기화되어 있지 않으면 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 친구 요청 거절
 *
 * @param {Object} request - { data: { requesterId: string, shouldBlock?: boolean }, auth: AuthData }
 * @returns {Promise<Object>} - { success: boolean, action: string, message?: string }
 */
exports.declineFriendRequest = onCall(async request => {
  const { data, auth } = request;

  // 인증 확인
  if (!auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to decline friend requests.'
    );
  }

  const currentUserId = auth.uid;
  const { requesterId, shouldBlock = false } = data;

  // 입력 검증
  if (!requesterId || typeof requesterId !== 'string') {
    throw new HttpsError('invalid-argument', 'requesterId must be provided as a string.');
  }

  // 자기 자신의 요청 거절 방지
  if (currentUserId === requesterId) {
    throw new HttpsError('invalid-argument', 'Cannot decline your own friend request.');
  }

  try {
    // Friendship ID 생성 (사전순 정렬)
    const friendshipId = [currentUserId, requesterId].sort().join('_');
    const friendshipRef = db.collection('friendships').doc(friendshipId);

    // 기존 친구 요청 확인
    const friendshipDoc = await friendshipRef.get();

    if (!friendshipDoc.exists) {
      throw new HttpsError('not-found', 'Friend request not found.');
    }

    const friendshipData = friendshipDoc.data();

    // 요청 상태 검증
    if (friendshipData.status !== 'pending') {
      throw new HttpsError(
        'failed-precondition',
        `Cannot decline request with status: ${friendshipData.status}`
      );
    }

    // 요청 수신자 검증 (현재 사용자가 요청을 받은 사람이어야 함)
    if (friendshipData.requesterId === currentUserId) {
      throw new HttpsError('permission-denied', 'Cannot decline your own friend request.');
    }

    // 요청자가 맞는지 검증
    if (friendshipData.requesterId !== requesterId) {
      throw new HttpsError('invalid-argument', 'RequesterId does not match the actual requester.');
    }

    let action;
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (shouldBlock) {
      // 차단: status를 'blocked'로 변경
      await friendshipRef.update({
        status: 'blocked',
        updatedAt: now,
        declinedAt: now,
        blockedBy: currentUserId,
      });
      action = 'blocked';
      logger.log(`🚫 User blocked: ${currentUserId} blocked ${requesterId}`);
    } else {
      // 단순 거절: 문서 삭제
      await friendshipRef.delete();
      action = 'declined';
      logger.log(`❌ Friend request declined and deleted: ${requesterId} -> ${currentUserId}`);
    }

    // 요청자에게 알림은 보내지 않음 (거절/차단 시에는 알리지 않는 것이 일반적)

    return {
      success: true,
      action,
      message: shouldBlock ? 'User blocked successfully.' : 'Friend request declined successfully.',
    };
  } catch (error) {
    logger.error('Error declining friend request:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to decline friend request.');
  }
});
