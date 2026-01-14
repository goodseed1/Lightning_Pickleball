/**
 * Firebase Cloud Function: onFirstWin
 * 이벤트에서 승리한 사용자의 winCount가 정확히 1일 때 '첫 승리' 배지 부여
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 첫 승리 배지 상수
 */
const FIRST_WIN_BADGE = {
  badgeId: 'first_victory',
  name: {
    ko: '첫 승리',
    en: 'First Victory',
  },
  description: {
    ko: '첫 번째 경기에서 승리하셨습니다! 🎾',
    en: 'You won your first match! 🎾',
  },
  iconUrl: '🏆', // 실제로는 이미지 URL
  category: 'match',
  rarity: 'common',
  tier: 'bronze',
};

/**
 * 사용자에게 배지 부여 함수
 * @param {string} userId - 사용자 ID
 * @param {string} eventId - 이벤트 ID (참조용)
 */
async function awardFirstWinBadge(userId, eventId) {
  try {
    const achievementRef = db
      .collection('users')
      .doc(userId)
      .collection('achievements')
      .doc(FIRST_WIN_BADGE.badgeId);

    // 이미 배지를 가지고 있는지 확인
    const existingBadge = await achievementRef.get();

    if (existingBadge.exists) {
      console.log(`User ${userId} already has first victory badge`);
      return;
    }

    // 배지 부여
    await achievementRef.set({
      badgeId: FIRST_WIN_BADGE.badgeId,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: {
        type: 'match_win',
        referenceId: eventId,
        details: 'First match victory',
      },
      tier: FIRST_WIN_BADGE.tier,
    });

    // 사용자의 배지 카운트 업데이트
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'stats.totalBadges': admin.firestore.FieldValue.increment(1),
      'achievements.firstVictory': true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ First victory badge awarded to user: ${userId}`);

    // 실시간 알림 전송 (선택사항)
    try {
      await sendBadgeNotification(userId, FIRST_WIN_BADGE);
    } catch (notificationError) {
      console.error('Badge notification failed:', notificationError);
    }
  } catch (error) {
    console.error('Error awarding first win badge:', error);
    throw error;
  }
}

/**
 * 배지 획득 알림 전송
 * @param {string} userId - 사용자 ID
 * @param {Object} badge - 배지 정보
 */
async function sendBadgeNotification(userId, badge) {
  try {
    // 사용자의 FCM 토큰 가져오기
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.fcmToken) {
      const message = {
        token: userData.fcmToken,
        notification: {
          title: '🏆 새 배지 획득!',
          body: `"${badge.name.ko}" 배지를 획득하셨습니다!`,
        },
        data: {
          type: 'badge_earned',
          badgeId: badge.badgeId,
          timestamp: Date.now().toString(),
        },
      };

      await admin.messaging().send(message);
      console.log(`Badge notification sent to user: ${userId}`);
    }
  } catch (error) {
    console.error('Error sending badge notification:', error);
  }
}

/**
 * Cloud Function: events 문서 업데이트 시 트리거
 */
exports.onFirstWin = functions.firestore
  .document('events/{eventId}')
  .onUpdate(async (change, context) => {
    const eventId = context.params.eventId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    console.log(`🎯 Event updated: ${eventId}`);

    try {
      // 이벤트 상태가 완료로 변경되었는지 확인
      if (beforeData.status !== 'completed' && afterData.status === 'completed') {
        console.log(`Event ${eventId} completed, checking for first wins`);

        // 승리자 확인
        const winnerId = afterData.winner || afterData.results?.winner;

        if (!winnerId) {
          console.log('No winner found in event');
          return null;
        }

        console.log(`Winner found: ${winnerId}`);

        // 승리한 사용자의 현재 승수 확인
        const userRef = db.collection('users').doc(winnerId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          console.log(`User document not found: ${winnerId}`);
          return null;
        }

        const userData = userDoc.data();
        const currentWinCount = userData.stats?.winCount || userData.stats?.wins || 0;

        console.log(`User ${winnerId} current win count: ${currentWinCount}`);

        // 승수가 정확히 1인 경우 (이번이 첫 승리)
        if (currentWinCount === 1) {
          console.log(`🎉 First victory detected for user: ${winnerId}`);
          await awardFirstWinBadge(winnerId, eventId);
        } else {
          console.log(`User ${winnerId} win count is ${currentWinCount}, not first victory`);
        }
      }

      return null;
    } catch (error) {
      console.error('Error in onFirstWin function:', error);
      // 에러가 발생해도 함수 실패로 처리하지 않음 (배지는 부가 기능)
      return null;
    }
  });

module.exports = { awardFirstWinBadge, FIRST_WIN_BADGE };
