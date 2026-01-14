/**
 * 🤝 [FRIENDSHIP] Send Friend Request - Firebase Functions v2
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
 * 친구 요청 보내기
 *
 * @param {Object} request - { data: { targetUserId: string }, auth: AuthData }
 * @returns {Promise<Object>} - { success: boolean, friendshipId?: string, message?: string }
 */
exports.sendFriendRequest = onCall(async request => {
  const { data, auth } = request;

  // 인증 확인
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to send friend requests.');
  }

  const currentUserId = auth.uid;
  const { targetUserId } = data;

  // 입력 검증
  if (!targetUserId || typeof targetUserId !== 'string') {
    throw new HttpsError('invalid-argument', 'targetUserId must be provided as a string.');
  }

  // 자기 자신에게 친구 요청 방지
  if (currentUserId === targetUserId) {
    throw new HttpsError('invalid-argument', 'Cannot send friend request to yourself.');
  }

  try {
    // Friendship ID 생성 (사전순 정렬)
    const friendshipId = [currentUserId, targetUserId].sort().join('_');
    const friendshipRef = db.collection('friendships').doc(friendshipId);

    // 기존 친구 관계 확인
    const existingFriendship = await friendshipRef.get();

    if (existingFriendship.exists) {
      const friendshipData = existingFriendship.data();

      switch (friendshipData.status) {
        case 'accepted':
          throw new HttpsError('already-exists', 'You are already friends with this user.');
        case 'pending':
          if (friendshipData.requesterId === currentUserId) {
            throw new HttpsError('already-exists', 'Friend request already sent to this user.');
          } else {
            // 🎉 AUTO-ACCEPT: 상대방이 이미 나에게 친구 요청을 보낸 상태
            // → 내가 요청을 보내려 하면 = 둘 다 친구가 되고 싶음 = 자동 수락!
            const now = admin.firestore.FieldValue.serverTimestamp();
            await friendshipRef.update({
              status: 'accepted',
              acceptedAt: now,
              updatedAt: now,
            });

            logger.log(`🎉 Friend request auto-accepted: ${currentUserId} <-> ${targetUserId}`);

            // 양쪽 사용자에게 푸시 알림 보내기
            try {
              const [currentUserDoc, targetUserDoc] = await Promise.all([
                db.collection('users').doc(currentUserId).get(),
                db.collection('users').doc(targetUserId).get(),
              ]);

              const currentUserName = currentUserDoc.data()?.profile?.nickname || 'Someone';
              const targetUserName = targetUserDoc.data()?.profile?.nickname || 'Someone';

              const notifications = [];

              // 🎯 [KIM FIX] Get user's preferred language for push notification i18n
              const targetUserData = targetUserDoc.data();
              const targetUserLang =
                targetUserData?.preferredLanguage || targetUserData?.language || 'en';

              const friendMessages = {
                ko: {
                  title: '친구가 되었습니다! 🎉',
                  body: `${currentUserName}님과 이제 친구입니다!`,
                },
                en: {
                  title: 'You are now friends! 🎉',
                  body: `You are now friends with ${currentUserName}!`,
                },
                ja: {
                  title: '友達になりました！🎉',
                  body: `${currentUserName}さんと友達になりました！`,
                },
                zh: { title: '你们现在是朋友了！🎉', body: `你和${currentUserName}现在是朋友了！` },
                de: {
                  title: 'Ihr seid jetzt Freunde! 🎉',
                  body: `Du bist jetzt mit ${currentUserName} befreundet!`,
                },
                fr: {
                  title: 'Vous êtes maintenant amis ! 🎉',
                  body: `Vous êtes maintenant ami(e) avec ${currentUserName} !`,
                },
                es: {
                  title: '¡Ahora son amigos! 🎉',
                  body: `¡Ahora eres amigo de ${currentUserName}!`,
                },
                it: { title: 'Ora siete amici! 🎉', body: `Ora sei amico di ${currentUserName}!` },
                pt: {
                  title: 'Agora vocês são amigos! 🎉',
                  body: `Agora você é amigo de ${currentUserName}!`,
                },
                ru: {
                  title: 'Теперь вы друзья! 🎉',
                  body: `Теперь вы друзья с ${currentUserName}!`,
                },
              };
              const friendMsg = friendMessages[targetUserLang] || friendMessages['en'];

              // 상대방(원래 요청자)에게 알림
              if (targetUserData?.fcmToken) {
                notifications.push(
                  admin.messaging().send({
                    token: targetUserData.fcmToken,
                    notification: {
                      title: friendMsg.title,
                      body: friendMsg.body,
                    },
                    data: {
                      type: 'friend_accepted',
                      friendId: currentUserId,
                      friendName: currentUserName,
                    },
                  })
                );
              }

              await Promise.allSettled(notifications);
            } catch (notificationError) {
              logger.warn('Failed to send auto-accept notifications:', notificationError);
            }

            return {
              success: true,
              friendshipId,
              autoAccepted: true,
              message: 'Friend request auto-accepted! You are now friends.',
            };
          }
        case 'blocked':
          throw new HttpsError('permission-denied', 'Cannot send friend request to this user.');
      }
    }

    // 대상 사용자 존재 확인
    const targetUserRef = db.collection('users').doc(targetUserId);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      throw new HttpsError('not-found', 'Target user not found.');
    }

    // 새로운 친구 요청 생성
    const now = admin.firestore.FieldValue.serverTimestamp();
    const friendshipData = {
      users: [currentUserId, targetUserId].sort(),
      status: 'pending',
      requesterId: currentUserId,
      createdAt: now,
      updatedAt: now,
    };

    await friendshipRef.set(friendshipData);

    logger.log(`✅ Friend request sent: ${currentUserId} -> ${targetUserId}`);

    // 대상 사용자에게 푸시 알림 보내기 (옵션)
    try {
      const currentUserDoc = await db.collection('users').doc(currentUserId).get();
      const currentUserData = currentUserDoc.data();
      const currentUserName = currentUserData?.profile?.nickname || 'Someone';

      // 🎯 [KIM FIX] Get user's preferred language for push notification i18n
      // FCM 토큰이 있다면 푸시 알림 전송
      const targetUserData = targetUserDoc.data();
      const targetUserLang = targetUserData?.preferredLanguage || targetUserData?.language || 'en';

      const requestMessages = {
        ko: { title: '새 친구 요청', body: `${currentUserName}님이 친구 요청을 보냈습니다.` },
        en: { title: 'New Friend Request', body: `${currentUserName} sent you a friend request.` },
        ja: {
          title: '新しい友達リクエスト',
          body: `${currentUserName}さんから友達リクエストが届きました。`,
        },
        zh: { title: '新的好友请求', body: `${currentUserName}向你发送了好友请求。` },
        de: {
          title: 'Neue Freundschaftsanfrage',
          body: `${currentUserName} hat dir eine Freundschaftsanfrage gesendet.`,
        },
        fr: {
          title: "Nouvelle demande d'ami",
          body: `${currentUserName} vous a envoyé une demande d'ami.`,
        },
        es: {
          title: 'Nueva solicitud de amistad',
          body: `${currentUserName} te ha enviado una solicitud de amistad.`,
        },
        it: {
          title: 'Nuova richiesta di amicizia',
          body: `${currentUserName} ti ha inviato una richiesta di amicizia.`,
        },
        pt: {
          title: 'Nova solicitação de amizade',
          body: `${currentUserName} enviou uma solicitação de amizade.`,
        },
        ru: {
          title: 'Новый запрос в друзья',
          body: `${currentUserName} отправил(а) вам запрос в друзья.`,
        },
      };
      const requestMsg = requestMessages[targetUserLang] || requestMessages['en'];

      if (targetUserData?.fcmToken) {
        const message = {
          token: targetUserData.fcmToken,
          notification: {
            title: requestMsg.title,
            body: requestMsg.body,
          },
          data: {
            type: 'friend_request',
            requesterId: currentUserId,
            requesterName: currentUserName,
          },
        };

        await admin.messaging().send(message);
        logger.log('📱 Push notification sent');
      }
    } catch (notificationError) {
      logger.warn('Failed to send push notification:', notificationError);
      // 푸시 알림 실패해도 친구 요청은 성공으로 처리
    }

    return {
      success: true,
      friendshipId,
      message: 'Friend request sent successfully.',
    };
  } catch (error) {
    logger.error('Error sending friend request:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to send friend request.');
  }
});
