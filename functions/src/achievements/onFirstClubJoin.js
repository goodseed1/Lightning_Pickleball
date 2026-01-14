/**
 * Firebase Cloud Function: onFirstClubJoin
 * clubMembers 컬렉션에 새 문서 생성 시 '첫 클럽 가입' 배지 부여
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 첫 클럽 가입 배지 상수
 */
const FIRST_CLUB_JOIN_BADGE = {
  badgeId: 'first_club_join',
  name: {
    ko: '첫 클럽 가입',
    en: 'First Club Member',
  },
  description: {
    ko: '첫 번째 피클볼 클럽에 가입하셨습니다! 🏟️',
    en: 'You joined your first pickleball club! 🏟️',
  },
  iconUrl: '🏟️', // 실제로는 이미지 URL
  category: 'club',
  rarity: 'common',
  tier: 'bronze',
};

/**
 * 사용자에게 첫 클럽 가입 배지 부여 함수
 * @param {string} userId - 사용자 ID
 * @param {string} clubId - 클럽 ID
 * @param {string} membershipId - 멤버십 문서 ID
 */
async function awardFirstClubJoinBadge(userId, clubId, membershipId) {
  try {
    const achievementRef = db
      .collection('users')
      .doc(userId)
      .collection('achievements')
      .doc(FIRST_CLUB_JOIN_BADGE.badgeId);

    // 이미 배지를 가지고 있는지 확인
    const existingBadge = await achievementRef.get();

    if (existingBadge.exists) {
      console.log(`User ${userId} already has first club join badge`);
      return;
    }

    // 클럽 정보 가져오기
    let clubName = 'Unknown Club';
    try {
      const clubDoc = await db.collection('clubs').doc(clubId).get();
      if (clubDoc.exists) {
        clubName = clubDoc.data().name || clubName;
      }
    } catch (clubError) {
      console.error('Error fetching club info:', clubError);
    }

    // 배지 부여
    await achievementRef.set({
      badgeId: FIRST_CLUB_JOIN_BADGE.badgeId,
      earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: {
        type: 'club_join',
        referenceId: clubId,
        details: `First club: ${clubName}`,
      },
      tier: FIRST_CLUB_JOIN_BADGE.tier,
    });

    // 사용자의 배지 카운트 업데이트
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'stats.totalBadges': admin.firestore.FieldValue.increment(1),
      'achievements.firstClubJoin': true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ First club join badge awarded to user: ${userId} for club: ${clubName}`);

    // 실시간 알림 전송 (선택사항)
    try {
      await sendBadgeNotification(userId, FIRST_CLUB_JOIN_BADGE, clubName);
    } catch (notificationError) {
      console.error('Badge notification failed:', notificationError);
    }
  } catch (error) {
    console.error('Error awarding first club join badge:', error);
    throw error;
  }
}

/**
 * 배지 획득 알림 전송
 * @param {string} userId - 사용자 ID
 * @param {Object} badge - 배지 정보
 * @param {string} clubName - 클럽 이름
 */
async function sendBadgeNotification(userId, badge, clubName) {
  try {
    // 사용자의 FCM 토큰 가져오기
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.fcmToken) {
      const message = {
        token: userData.fcmToken,
        notification: {
          title: '🏟️ 새 배지 획득!',
          body: `"${badge.name.ko}" 배지를 획득하셨습니다! 클럽: ${clubName}`,
        },
        data: {
          type: 'badge_earned',
          badgeId: badge.badgeId,
          clubId: badge.source?.referenceId || '',
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
 * 사용자의 클럽 가입 기록 확인 (첫 가입인지 판단)
 * @param {string} userId - 사용자 ID
 * @param {string} currentMembershipId - 현재 멤버십 ID (제외)
 * @returns {boolean} 첫 가입 여부
 */
async function isFirstClubJoin(userId, currentMembershipId) {
  try {
    const clubMembersQuery = db
      .collection('clubMembers')
      .where('userId', '==', userId)
      .where('status', '==', 'active');

    const querySnapshot = await clubMembersQuery.get();

    // 현재 가입을 제외하고 다른 활성 멤버십이 있는지 확인
    const otherMemberships = querySnapshot.docs.filter(doc => doc.id !== currentMembershipId);

    const isFirstJoin = otherMemberships.length === 0;
    console.log(
      `User ${userId} first club join check: ${isFirstJoin} (other memberships: ${otherMemberships.length})`
    );

    return isFirstJoin;
  } catch (error) {
    console.error('Error checking first club join:', error);
    return false;
  }
}

/**
 * Cloud Function: clubMembers 문서 생성 시 트리거
 */
exports.onFirstClubJoin = functions.firestore
  .document('clubMembers/{membershipId}')
  .onCreate(async (snapshot, context) => {
    const membershipId = context.params.membershipId;
    const membershipData = snapshot.data();

    console.log(`🏟️ New club membership created: ${membershipId}`);

    try {
      const userId = membershipData.userId;
      const clubId = membershipData.clubId;
      const memberStatus = membershipData.status;

      // 필수 필드 확인
      if (!userId || !clubId) {
        console.log('Missing userId or clubId in membership data');
        return null;
      }

      // 활성 멤버십인지 확인 (pending 상태는 제외)
      if (memberStatus !== 'active') {
        console.log(`Membership status is ${memberStatus}, skipping badge award`);
        return null;
      }

      console.log(`Processing club join for user: ${userId}, club: ${clubId}`);

      // 첫 클럽 가입인지 확인
      const isFirst = await isFirstClubJoin(userId, membershipId);

      if (isFirst) {
        console.log(`🎉 First club join detected for user: ${userId}`);
        await awardFirstClubJoinBadge(userId, clubId, membershipId);
      } else {
        console.log(`User ${userId} has joined clubs before, not first join`);
      }

      return null;
    } catch (error) {
      console.error('Error in onFirstClubJoin function:', error);
      // 에러가 발생해도 함수 실패로 처리하지 않음 (배지는 부가 기능)
      return null;
    }
  });

/**
 * Cloud Function: clubMembers 문서 업데이트 시 트리거 (상태 변경 처리)
 */
exports.onClubMembershipStatusChange = functions.firestore
  .document('clubMembers/{membershipId}')
  .onUpdate(async (change, context) => {
    const membershipId = context.params.membershipId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    console.log(`🔄 Club membership status updated: ${membershipId}`);

    try {
      // pending에서 active로 상태 변경된 경우 처리
      if (beforeData.status === 'pending' && afterData.status === 'active') {
        const userId = afterData.userId;
        const clubId = afterData.clubId;

        console.log(`Membership approved for user: ${userId}, club: ${clubId}`);

        // 첫 클럽 가입인지 확인
        const isFirst = await isFirstClubJoin(userId, membershipId);

        if (isFirst) {
          console.log(`🎉 First club join detected after approval for user: ${userId}`);
          await awardFirstClubJoinBadge(userId, clubId, membershipId);
        }
      }

      return null;
    } catch (error) {
      console.error('Error in onClubMembershipStatusChange function:', error);
      return null;
    }
  });

module.exports = { awardFirstClubJoinBadge, FIRST_CLUB_JOIN_BADGE };
