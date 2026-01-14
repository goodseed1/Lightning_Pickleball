/**
 * 📲 THOR'S TELEGRAM 📲
 * Cloud Function: Team Invitation Push Notification Trigger
 *
 * Automatically sends a push notification when a new team invitation is created.
 * This ensures users are immediately notified even when the app is closed.
 *
 * Trigger: notifications/{notificationId} onCreate
 * Condition: type === 'CLUB_TEAM_INVITE'
 * Action: Send push notification via Expo Push Notification Service
 */

const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendPushOnTeamInvite = onDocumentCreated('notifications/{notificationId}', async event => {
  const notification = event.data.data();
  const notificationId = event.params.notificationId;

  console.log('📲 [TELEGRAM] New notification detected:', {
    notificationId,
    type: notification.type,
    recipientId: notification.recipientId,
  });

  // 💥 여기가 바로 '긴급 전보'의 핵심! 💥
  // 만약 이 알림이 '클럽 팀 초대'가 아니라면, 임무를 중단한다.
  if (notification.type !== 'CLUB_TEAM_INVITE') {
    console.log('ℹ️ [TELEGRAM] Not a team invitation. Aborting.');
    return null;
  }

  console.log('🎯 [TELEGRAM] Team invitation detected! Preparing push notification...');

  try {
    const db = admin.firestore();

    // 1. 피초대자의 프로필에서 '푸시 토큰(push token)'을 가져온다.
    const userRef = db.doc(`users/${notification.recipientId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error('❌ [TELEGRAM] User not found:', notification.recipientId);
      return null;
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(
        `⚠️ [TELEGRAM] User ${notification.recipientId} does not have a push token. Push notification skipped.`
      );
      return null;
    }

    console.log('✅ [TELEGRAM] Push token found. Preparing message...');

    // 2. 푸시 알림 메시지를 구성한다.
    // Expo Push Notification Service 포맷 사용
    const message = {
      to: pushToken,
      sound: 'default',
      title: '⚡ 새로운 파트너 초대!',
      body: notification.message || '새로운 토너먼트 팀 초대가 도착했습니다.',
      data: {
        // 사용자가 알림을 탭했을 때, 특정 화면으로 이동시키기 위한 데이터
        type: 'team_invite',
        notificationType: 'CLUB_TEAM_INVITE',
        clubId: notification.clubId || '',
        tournamentId: notification.tournamentId || '',
        teamId: notification.relatedTeamId || '',
        notificationId: notificationId,
      },
      priority: 'high',
      channelId: 'team-invitations', // Android notification channel
    };

    console.log('📤 [TELEGRAM] Sending push notification:', {
      recipient: notification.recipientId,
      title: message.title,
      hasToken: !!pushToken,
    });

    // 3. Expo Push Notification Service API를 사용하여 알림을 발송한다.
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ [TELEGRAM] Push notification errors:', result.errors);
      throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
    }

    console.log('✅ [TELEGRAM] Push notification sent successfully!', {
      recipient: notification.recipientId,
      ticketId: result.data?.id,
    });

    // 4. (Optional) 푸시 알림 전송 기록을 남긴다.
    await db.collection('push_notification_logs').add({
      notificationId: notificationId,
      recipientId: notification.recipientId,
      type: 'CLUB_TEAM_INVITE',
      clubId: notification.clubId,
      tournamentId: notification.tournamentId,
      teamId: notification.relatedTeamId,
      pushToken: pushToken,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expoTicketId: result.data?.id,
    });

    return { success: true, recipientId: notification.recipientId };
  } catch (error) {
    console.error('❌ [TELEGRAM] Failed to send push notification:', error);

    // 에러 기록
    try {
      await admin.firestore().collection('push_notification_logs').add({
        notificationId: notificationId,
        recipientId: notification.recipientId,
        type: 'CLUB_TEAM_INVITE',
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('❌ [TELEGRAM] Failed to log error:', logError);
    }

    // Don't throw error - we don't want to fail the entire notification creation
    // The user will still see the in-app notification
    return { success: false, error: error.message };
  }
});
