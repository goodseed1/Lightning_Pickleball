/**
 * 모든 배지 초기화 스크립트
 * - clubChat 컬렉션의 unread 메시지
 * - notifications 컬렉션의 unread 알림
 * - clubMembers 컬렉션에서 유저의 클럽 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function resetAllBadges(email) {
  console.log(`🔍 ${email} 유저의 모든 배지 초기화 중...\n`);

  // 1. 유저 찾기
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (usersSnapshot.empty) {
    console.log('❌ 유저를 찾을 수 없습니다.');
    process.exit(1);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log('✅ 유저:', userData.displayName, `(${userId})`);

  // 2. clubMembers에서 유저의 클럽 확인
  console.log('\n' + '='.repeat(70));
  console.log('📊 [1] clubMembers 컬렉션 확인:');
  console.log('='.repeat(70));

  const membershipSnapshot = await db
    .collection('clubMembers')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const clubIds = membershipSnapshot.docs.map(doc => doc.data().clubId);
  console.log(`\n가입한 클럽: ${clubIds.length}개`);
  clubIds.forEach(id => console.log(`  - ${id}`));

  // 3. clubChat에서 unread 메시지 확인 및 초기화
  console.log('\n' + '='.repeat(70));
  console.log('📊 [2] clubChat 컬렉션 (빨간 배지):');
  console.log('='.repeat(70));

  const batch = db.batch();
  let chatUpdates = 0;

  for (const clubId of clubIds) {
    const chatSnapshot = await db
      .collection('clubChat')
      .where('clubId', '==', clubId)
      .where('isDeleted', '==', false)
      .get();

    let unreadCount = 0;
    chatSnapshot.forEach(doc => {
      const data = doc.data();
      const isUnread =
        data.type === 'text' &&
        data.senderId !== userId &&
        (!data.readBy || !data.readBy.includes(userId));

      if (isUnread) {
        unreadCount++;
        // readBy에 userId 추가
        batch.update(doc.ref, {
          readBy: admin.firestore.FieldValue.arrayUnion(userId),
        });
        chatUpdates++;
      }
    });

    if (unreadCount > 0) {
      console.log(`  📍 Club ${clubId}: ${unreadCount}개 unread 채팅`);
    }
  }

  // 4. notifications에서 unread 알림 확인 및 초기화
  console.log('\n' + '='.repeat(70));
  console.log('📊 [3] notifications 컬렉션 (노란 배지):');
  console.log('='.repeat(70));

  let notifUpdates = 0;

  for (const clubId of clubIds) {
    const notifSnapshot = await db
      .collection('notifications')
      .where('clubId', '==', clubId)
      .where('recipientId', '==', userId)
      .where('status', '==', 'unread')
      .get();

    if (!notifSnapshot.empty) {
      console.log(`  📍 Club ${clubId}: ${notifSnapshot.size}개 unread 알림`);

      notifSnapshot.forEach(doc => {
        batch.update(doc.ref, { status: 'read' });
        notifUpdates++;
      });
    }
  }

  // 5. 전체 notifications 확인 (clubId 없는 것도)
  console.log('\n' + '='.repeat(70));
  console.log('📊 [4] 전체 notifications (유저에게 온 모든 알림):');
  console.log('='.repeat(70));

  const allNotifSnapshot = await db
    .collection('notifications')
    .where('recipientId', '==', userId)
    .where('status', '==', 'unread')
    .get();

  console.log(`  총 unread 알림: ${allNotifSnapshot.size}개`);

  allNotifSnapshot.forEach(doc => {
    const data = doc.data();
    if (!clubIds.includes(data.clubId)) {
      // 위에서 처리 안된 알림
      batch.update(doc.ref, { status: 'read' });
      notifUpdates++;
      console.log(`  📍 추가 알림: ${doc.id} (clubId: ${data.clubId})`);
    }
  });

  // 6. 배치 커밋
  if (chatUpdates > 0 || notifUpdates > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 초기화 작업...');
    console.log('='.repeat(70));

    await batch.commit();
    console.log(`\n✅ 완료!`);
    console.log(`  - 채팅 메시지 ${chatUpdates}개 읽음 처리`);
    console.log(`  - 알림 ${notifUpdates}개 읽음 처리`);
  } else {
    console.log('\n✅ Firestore에는 unread 항목이 없습니다.');
  }

  console.log('\n' + '='.repeat(70));
  console.log('💡 다음 단계:');
  console.log('='.repeat(70));
  console.log('  1. 앱을 완전히 종료 (백그라운드에서도 제거)');
  console.log('  2. 앱 다시 시작');
  console.log('  3. 그래도 안 되면 로그아웃 → 재로그인');

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
resetAllBadges(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
