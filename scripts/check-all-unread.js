/**
 * 모든 unread 관련 데이터 확인 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkAllUnread(email) {
  console.log(`🔍 ${email} 유저의 모든 unread 데이터 확인 중...\n`);

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
  console.log('');

  // 2. users 문서의 모든 필드 중 unread/badge 관련
  console.log('='.repeat(70));
  console.log('📊 [1] users 문서 필드 (unread/badge/notification 관련):');
  console.log('='.repeat(70));

  const relevantFields = Object.entries(userData).filter(
    ([key]) =>
      key.toLowerCase().includes('unread') ||
      key.toLowerCase().includes('badge') ||
      key.toLowerCase().includes('notification') ||
      key.toLowerCase().includes('count')
  );

  if (relevantFields.length === 0) {
    console.log('  (해당 필드 없음)');
  } else {
    relevantFields.forEach(([key, value]) => {
      console.log(`  ${key}:`, JSON.stringify(value));
    });
  }

  // 3. 클럽 멤버십 확인 (clubs 컬렉션의 members에서)
  console.log('\n' + '='.repeat(70));
  console.log('📊 [2] 클럽 멤버십 (clubs/{clubId}/members):');
  console.log('='.repeat(70));

  const clubsSnapshot = await db.collection('clubs').get();

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();
    const memberSnapshot = await db
      .collection('clubs')
      .doc(clubDoc.id)
      .collection('members')
      .doc(userId)
      .get();

    if (memberSnapshot.exists) {
      const memberData = memberSnapshot.data();
      console.log(`\n  📍 ${clubData.name} (${clubDoc.id}):`);

      // unread 관련 필드만 출력
      const memberUnread = Object.entries(memberData).filter(
        ([key]) =>
          key.toLowerCase().includes('unread') ||
          key.toLowerCase().includes('badge') ||
          key.toLowerCase().includes('last')
      );

      if (memberUnread.length > 0) {
        memberUnread.forEach(([key, value]) => {
          console.log(`     ${key}:`, JSON.stringify(value));
        });
      } else {
        console.log('     (unread 관련 필드 없음)');
      }
    }
  }

  // 4. 클럽 채팅방 unread 확인
  console.log('\n' + '='.repeat(70));
  console.log('📊 [3] 클럽 채팅방 (clubs/{clubId}/chatRoom/messages):');
  console.log('='.repeat(70));

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();

    // chatRoom 확인
    const chatRoomDoc = await db
      .collection('clubs')
      .doc(clubDoc.id)
      .collection('chatRoom')
      .doc('main')
      .get();

    if (chatRoomDoc.exists) {
      const chatData = chatRoomDoc.data();
      console.log(`\n  📍 ${clubData.name} 채팅방:`);

      // unreadBy 또는 readBy 필드 확인
      if (chatData.unreadBy) {
        const userUnread = chatData.unreadBy[userId];
        console.log(`     unreadBy[${userId}]:`, userUnread);
      }
      if (chatData.lastReadBy) {
        const lastRead = chatData.lastReadBy[userId];
        console.log(`     lastReadBy[${userId}]:`, lastRead);
      }
    }
  }

  // 5. 클럽 알림 (clubNotifications 서브컬렉션)
  console.log('\n' + '='.repeat(70));
  console.log('📊 [4] 클럽 알림 (users/{userId}/clubNotifications):');
  console.log('='.repeat(70));

  const clubNotiSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('clubNotifications')
    .get();

  console.log(`\n  총 ${clubNotiSnapshot.size}개 알림:`);

  let unreadCount = 0;
  clubNotiSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.read) {
      unreadCount++;
      console.log(`     ❗ [UNREAD] ${doc.id}: ${data.message?.substring(0, 50)}...`);
    }
  });

  console.log(`\n  읽지 않은 알림: ${unreadCount}개`);

  // 6. AsyncStorage 관련 참고
  console.log('\n' + '='.repeat(70));
  console.log('💡 참고:');
  console.log('='.repeat(70));
  console.log('  앱에서 배지가 표시되는 경우 AsyncStorage에 캐시된 값일 수 있습니다.');
  console.log('  앱을 완전히 종료 후 다시 시작하거나, 로그아웃 후 재로그인 해보세요.');

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
checkAllUnread(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
