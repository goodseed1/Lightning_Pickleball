/**
 * 🎾 모임 알림 수동 전송 스크립트
 *
 * 오늘 예정된 모임에 대해 클럽 회원들에게 푸시 알림 + 피드 카드를 전송합니다.
 *
 * 사용법: node scripts/send-meetup-notification.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * 모임 시간을 포맷팅 (예: "오후 7:30")
 */
function formatMeetupTime(timestamp) {
  const date = timestamp.toDate();
  const options = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  };
  return date.toLocaleString('ko-KR', options);
}

/**
 * 클럽 이름 가져오기
 */
async function getClubName(clubId) {
  const clubDoc = await db.collection('tennis_clubs').doc(clubId).get();
  if (clubDoc.exists) {
    const data = clubDoc.data();
    return data?.profile?.clubName || data?.name || '클럽';
  }
  return '클럽';
}

/**
 * 클럽 멤버들의 User ID 목록 가져오기
 */
async function getClubMemberIds(clubId) {
  const membersSnapshot = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('status', '==', 'active')
    .get();

  if (membersSnapshot.empty) {
    return [];
  }

  return membersSnapshot.docs.map(doc => doc.data().userId).filter(Boolean);
}

/**
 * 클럽 멤버들의 FCM 토큰 가져오기
 */
async function getClubMemberTokens(clubId) {
  const membersSnapshot = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('status', '==', 'active')
    .get();

  if (membersSnapshot.empty) {
    console.log(`  ⚠️ 활성 멤버 없음: ${clubId}`);
    return [];
  }

  const memberIds = membersSnapshot.docs.map(doc => doc.data().userId).filter(Boolean);
  console.log(`  👥 활성 멤버 ${memberIds.length}명`);

  if (memberIds.length === 0) {
    return [];
  }

  const allTokens = [];

  // Firestore 'in' 쿼리는 최대 30개까지만 지원
  for (let i = 0; i < memberIds.length; i += 30) {
    const batch = memberIds.slice(i, i + 30);
    const tokensSnapshot = await db
      .collection('user_fcm_tokens')
      .where('userId', 'in', batch)
      .where('isActive', '==', true)
      .get();

    tokensSnapshot.docs.forEach(doc => {
      const token = doc.data().token;
      if (token) {
        allTokens.push(token);
      }
    });
  }

  console.log(`  📱 FCM 토큰 ${allTokens.length}개`);
  return allTokens;
}

/**
 * 푸시 알림 전송
 */
async function sendMeetupNotification(
  tokens,
  clubId,
  clubName,
  meetupId,
  meetupTime,
  locationName
) {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const locationText = locationName ? ` @ ${locationName}` : '';

  const notificationPayload = {
    tokens: tokens,
    notification: {
      title: `🎾 오늘 모임이 있습니다!`,
      body: `${clubName} - ${meetupTime}${locationText}`,
    },
    data: {
      type: 'meetup_reminder',
      clubId: clubId,
      meetupId: meetupId,
      clickAction: 'OPEN_CLUB_ACTIVITY',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          category: 'MEETUP_REMINDER',
        },
      },
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'meetup_notifications',
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(notificationPayload);
    console.log(`  ✅ 푸시 알림: 성공 ${response.successCount}, 실패 ${response.failureCount}`);

    // 실패한 토큰 정리
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        const batch = db.batch();
        for (const token of invalidTokens) {
          const tokenQuery = await db
            .collection('user_fcm_tokens')
            .where('token', '==', token)
            .limit(1)
            .get();

          if (!tokenQuery.empty) {
            batch.update(tokenQuery.docs[0].ref, { isActive: false });
          }
        }
        await batch.commit();
        console.log(`  🧹 무효 토큰 ${invalidTokens.length}개 정리`);
      }
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('  ❌ 푸시 알림 전송 실패:', error);
    return { successCount: 0, failureCount: tokens.length };
  }
}

/**
 * 피드 아이템 생성
 */
async function createMeetupFeedItem(
  clubId,
  clubName,
  meetupId,
  meetupTime,
  locationName,
  memberIds
) {
  try {
    if (memberIds.length === 0) {
      console.log('  ⚠️ 피드 표시할 멤버 없음');
      return;
    }

    const locationText = locationName ? ` @ ${locationName}` : '';

    const feedItemData = {
      type: 'meetup_reminder',
      actorId: clubId,
      actorName: clubName,
      clubId: clubId,
      clubName: clubName,
      eventId: meetupId,
      visibility: 'club_members',
      visibleTo: memberIds,
      isActive: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        meetupTime: meetupTime,
        locationName: locationName || null,
        feedTitle: `🎾 오늘 모임이 있습니다!`,
        feedBody: `${clubName} - ${meetupTime}${locationText}`,
      },
    };

    const feedRef = await db.collection('feed').add(feedItemData);
    console.log(`  📰 피드 카드 생성: ${feedRef.id}`);
  } catch (error) {
    console.error('  ❌ 피드 카드 생성 실패:', error);
  }
}

/**
 * 메인 함수: 오늘 모임 알림 전송
 */
async function sendTodayMeetupNotifications() {
  console.log('🎾 모임 알림 수동 전송 시작...\n');

  // 오늘 날짜 범위 계산 (EST/EDT)
  const now = new Date();
  const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  console.log(`📅 조회 기간: ${todayStart.toLocaleString()} ~ ${todayEnd.toLocaleString()}\n`);

  // 오늘 모임 조회
  const meetupsSnapshot = await db
    .collection('regular_meetups')
    .where('status', '==', 'confirmed')
    .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(todayStart))
    .where('dateTime', '<=', admin.firestore.Timestamp.fromDate(todayEnd))
    .get();

  if (meetupsSnapshot.empty) {
    console.log('⚠️ 오늘 예정된 모임이 없습니다.');
    return;
  }

  console.log(`🎯 오늘 모임 ${meetupsSnapshot.docs.length}개 발견!\n`);

  let totalNotifications = 0;
  let meetupsProcessed = 0;

  for (const meetupDoc of meetupsSnapshot.docs) {
    const meetupData = meetupDoc.data();
    const meetupTime = formatMeetupTime(meetupData.dateTime);
    const locationName = meetupData.location?.name;

    console.log(`\n📍 모임 처리 중: ${meetupDoc.id}`);
    console.log(`   시간: ${meetupTime}`);
    console.log(`   장소: ${locationName || '미정'}`);
    console.log(
      `   알림 전송 여부: ${meetupData.notificationSent ? '✅ 이미 전송됨' : '❌ 미전송'}`
    );

    // 이미 알림 전송된 경우에도 수동 요청이므로 다시 전송
    const clubId = meetupData.clubId;
    const clubName = await getClubName(clubId);
    console.log(`   클럽: ${clubName}`);

    // 멤버 ID 및 토큰 가져오기
    const memberIds = await getClubMemberIds(clubId);
    const tokens = await getClubMemberTokens(clubId);

    // 푸시 알림 전송 (토큰이 있는 경우)
    if (tokens.length > 0) {
      const result = await sendMeetupNotification(
        tokens,
        clubId,
        clubName,
        meetupDoc.id,
        meetupTime,
        locationName
      );
      totalNotifications += result.successCount;
    } else {
      console.log('  ⚠️ FCM 토큰이 없어 푸시 알림 건너뜀');
    }

    // 피드 카드는 토큰 유무와 관계없이 항상 생성
    await createMeetupFeedItem(clubId, clubName, meetupDoc.id, meetupTime, locationName, memberIds);

    // 알림 전송 완료 표시
    await meetupDoc.ref.update({
      notificationSent: true,
      notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    meetupsProcessed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 완료! ${meetupsProcessed}개 모임 처리, ${totalNotifications}개 알림 전송`);
  console.log('='.repeat(50));
}

// 실행
sendTodayMeetupNotifications()
  .then(() => {
    console.log('\n✅ 스크립트 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 에러:', error);
    process.exit(1);
  });
