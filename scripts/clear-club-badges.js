/**
 * 🔔 클럽 배지 초기화 스크립트
 *
 * 클럽 채팅 삭제 후 남아있는 unread 배지를 초기화합니다.
 *
 * 사용법: node scripts/clear-club-badges.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const CLUB_ID = 'WsetxkWODywjt0BBcqrs';

async function clearUnreadBadges() {
  console.log('🔔 클럽 배지 초기화 시작...\n');
  console.log('📋 Club ID:', CLUB_ID);
  console.log('='.repeat(60) + '\n');

  // 1. clubMembers의 unreadCount 확인 및 초기화
  console.log('📋 1. clubMembers unreadCount 초기화...');
  const membersSnap = await db.collection('clubMembers').where('clubId', '==', CLUB_ID).get();

  let membersUpdated = 0;
  for (const doc of membersSnap.docs) {
    const data = doc.data();
    const hasUnread =
      data.unreadCount > 0 ||
      data.unreadMessages > 0 ||
      data.unreadNotifications > 0 ||
      data.unreadChatCount > 0;

    if (hasUnread) {
      const name = data.memberInfo?.displayName || data.userId?.substring(0, 8);
      console.log(`   - ${name}: unread=${data.unreadCount || data.unreadChatCount || 0}`);
      await doc.ref.update({
        unreadCount: 0,
        unreadMessages: 0,
        unreadNotifications: 0,
        unreadChatCount: 0,
        lastReadAt: admin.firestore.Timestamp.now(),
      });
      membersUpdated++;
    }
  }
  console.log(`   ✅ ${membersUpdated}명 초기화 완료\n`);

  // 2. userClubReadStatus 확인
  console.log('📋 2. userClubReadStatus 초기화...');
  const readStatusSnap = await db
    .collection('userClubReadStatus')
    .where('clubId', '==', CLUB_ID)
    .get();

  if (!readStatusSnap.empty) {
    console.log(`   레코드 수: ${readStatusSnap.size}개`);
    for (const doc of readStatusSnap.docs) {
      await doc.ref.update({
        lastReadAt: admin.firestore.Timestamp.now(),
        unreadCount: 0,
      });
    }
    console.log('   ✅ 모든 readStatus 업데이트 완료\n');
  } else {
    console.log('   (레코드 없음)\n');
  }

  // 3. club_notifications의 읽음 상태 업데이트
  console.log('📋 3. club_notifications 읽음 처리...');
  const notificationsSnap = await db
    .collection('club_notifications')
    .where('clubId', '==', CLUB_ID)
    .where('isRead', '==', false)
    .get();

  if (!notificationsSnap.empty) {
    console.log(`   읽지 않은 알림: ${notificationsSnap.size}개`);
    for (const doc of notificationsSnap.docs) {
      await doc.ref.update({ isRead: true });
    }
    console.log('   ✅ 모든 알림 읽음 처리 완료\n');
  } else {
    console.log('   (읽지 않은 알림 없음)\n');
  }

  // 4. clubChat 컬렉션 삭제 (배지 원인! - ClubDetailScreen에서 사용)
  console.log('📋 4. clubChat 삭제 (배지 5의 원인)...');

  // 먼저 clubId로 쿼리
  let chatMessagesSnap = await db.collection('clubChat').where('clubId', '==', CLUB_ID).get();

  console.log(`   clubId='${CLUB_ID}' 조건: ${chatMessagesSnap.size}개`);

  // 없으면 전체 clubChat 컬렉션 확인
  if (chatMessagesSnap.empty) {
    const allChatSnap = await db.collection('clubChat').limit(20).get();
    console.log(`   전체 clubChat 컬렉션: ${allChatSnap.size}개 (최대 20개)`);

    if (!allChatSnap.empty) {
      allChatSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ID: ${doc.id}, clubId: ${data.clubId}, isDeleted: ${data.isDeleted}`);
      });
    }
  }

  if (!chatMessagesSnap.empty) {
    console.log(`   채팅 메시지: ${chatMessagesSnap.size}개 발견`);
    const batchSize = 500;
    const docs = chatMessagesSnap.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    console.log(`   ✅ ${chatMessagesSnap.size}개 메시지 삭제 완료\n`);
  } else {
    console.log('   (해당 클럽 채팅 메시지 없음)\n');
  }

  // 5. tennis_clubs의 unread 관련 필드 초기화
  console.log('📋 5. tennis_clubs unread 필드 초기화...');
  await db.collection('tennis_clubs').doc(CLUB_ID).update({
    unreadCount: 0,
    lastReadAt: admin.firestore.Timestamp.now(),
  });
  console.log('   ✅ 완료\n');

  console.log('='.repeat(60));
  console.log('✅ 클럽 배지 초기화 완료!');
  console.log('='.repeat(60));
  console.log('\n🎾 앱을 다시 열어서 확인해보세요!');

  process.exit(0);
}

clearUnreadBadges().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
