/**
 * 🤝 [FRIENDSHIP] Accept Friend Request - Firebase Functions v2
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
 * 친구 요청 수락
 *
 * @param {Object} request - { data: { requesterId: string }, auth: AuthData }
 * @returns {Promise<Object>} - { success: boolean, friendshipId?: string, message?: string }
 */
exports.acceptFriendRequest = onCall(async request => {
  const { data, auth } = request;

  // 인증 확인
  if (!auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to accept friend requests.'
    );
  }

  const currentUserId = auth.uid;
  const { requesterId } = data;

  // 입력 검증
  if (!requesterId || typeof requesterId !== 'string') {
    throw new HttpsError('invalid-argument', 'requesterId must be provided as a string.');
  }

  // 자기 자신의 요청 수락 방지
  if (currentUserId === requesterId) {
    throw new HttpsError('invalid-argument', 'Cannot accept your own friend request.');
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
        `Cannot accept request with status: ${friendshipData.status}`
      );
    }

    // 요청 수신자 검증 (현재 사용자가 요청을 받은 사람이어야 함)
    if (friendshipData.requesterId === currentUserId) {
      throw new HttpsError('permission-denied', 'Cannot accept your own friend request.');
    }

    // 요청자가 맞는지 검증
    if (friendshipData.requesterId !== requesterId) {
      throw new HttpsError('invalid-argument', 'RequesterId does not match the actual requester.');
    }

    // 친구 요청 수락 - 상태를 accepted로 변경
    const now = admin.firestore.FieldValue.serverTimestamp();
    await friendshipRef.update({
      status: 'accepted',
      updatedAt: now,
      acceptedAt: now,
    });

    logger.log(`✅ Friend request accepted: ${requesterId} <-> ${currentUserId}`);

    // 🏅 [PROJECT OLYMPUS] Check and award Social Butterfly badges
    try {
      const { checkSocialButterflyBadges } = require('../utils/socialBadgeChecker');

      // Check for both users (both gained a friend)
      await checkSocialButterflyBadges(currentUserId);
      await checkSocialButterflyBadges(requesterId);

      logger.log('🏅 [BADGE] Social butterfly badges checked for both users');
    } catch (badgeError) {
      logger.warn('⚠️ [BADGE] Failed to check social butterfly badges:', badgeError);
      // Don't fail friend request acceptance if badge check fails
    }

    // 요청자에게 푸시 알림 보내기 (옵션)
    try {
      const currentUserDoc = await db.collection('users').doc(currentUserId).get();
      const requesterDoc = await db.collection('users').doc(requesterId).get();

      const currentUserData = currentUserDoc.data();
      const requesterData = requesterDoc.data();

      const currentUserName = currentUserData?.profile?.nickname || 'Someone';

      // 🎯 [KIM FIX] Get user's preferred language for push notification i18n
      const requesterLang = requesterData?.preferredLanguage || requesterData?.language || 'en';

      const acceptMessages = {
        ko: { title: '친구 요청 수락됨', body: `${currentUserName}님이 친구 요청을 수락했습니다!` },
        en: {
          title: 'Friend Request Accepted',
          body: `${currentUserName} accepted your friend request!`,
        },
        ja: {
          title: '友達リクエスト承認',
          body: `${currentUserName}さんが友達リクエストを承認しました！`,
        },
        zh: { title: '好友请求已接受', body: `${currentUserName}接受了你的好友请求！` },
        de: {
          title: 'Freundschaftsanfrage angenommen',
          body: `${currentUserName} hat deine Freundschaftsanfrage angenommen!`,
        },
        fr: {
          title: "Demande d'ami acceptée",
          body: `${currentUserName} a accepté votre demande d'ami !`,
        },
        es: {
          title: 'Solicitud de amistad aceptada',
          body: `¡${currentUserName} aceptó tu solicitud de amistad!`,
        },
        it: {
          title: 'Richiesta di amicizia accettata',
          body: `${currentUserName} ha accettato la tua richiesta di amicizia!`,
        },
        pt: {
          title: 'Solicitação de amizade aceita',
          body: `${currentUserName} aceitou sua solicitação de amizade!`,
        },
        ru: {
          title: 'Запрос в друзья принят',
          body: `${currentUserName} принял(а) ваш запрос в друзья!`,
        },
      };
      const acceptMsg = acceptMessages[requesterLang] || acceptMessages['en'];

      // FCM 토큰이 있다면 푸시 알림 전송
      if (requesterData?.fcmToken) {
        const message = {
          token: requesterData.fcmToken,
          notification: {
            title: acceptMsg.title,
            body: acceptMsg.body,
          },
          data: {
            type: 'friend_request_accepted',
            friendId: currentUserId,
            friendName: currentUserName,
          },
        };

        await admin.messaging().send(message);
        logger.log('📱 Acceptance notification sent to requester');
      }
    } catch (notificationError) {
      logger.warn('Failed to send acceptance notification:', notificationError);
      // 푸시 알림 실패해도 친구 요청 수락은 성공으로 처리
    }

    return {
      success: true,
      friendshipId,
      message: 'Friend request accepted successfully.',
    };
  } catch (error) {
    logger.error('Error accepting friend request:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to accept friend request.');
  }
});
