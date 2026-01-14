/**
 * 🔴 빨간 배지 초기화 - Meetup Chat Unread
 * 데이터 소스: users/{userId}/unreadMeetupChats
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function resetMeetupBadges(email) {
  console.log(`🔴 ${email} 유저의 Meetup 빨간 배지 초기화 중...\n`);

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

  // 2. unreadMeetupChats 서브컬렉션 확인
  console.log('\n' + '='.repeat(70));
  console.log('📊 users/{userId}/unreadMeetupChats 확인:');
  console.log('='.repeat(70));

  const unreadSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('unreadMeetupChats')
    .get();

  console.log(`\n총 ${unreadSnapshot.size}개 문서:`);

  let totalCount = 0;
  unreadSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  📍 Meetup ${doc.id}:`);
    console.log(`     count: ${data.count}`);
    console.log(`     clubId: ${data.clubId}`);
    totalCount += data.count || 0;
  });

  console.log(`\n🔢 총 unread 카운트: ${totalCount}`);

  // 3. 삭제
  if (unreadSnapshot.size > 0) {
    console.log('\n🔧 삭제 중...');

    const batch = db.batch();
    unreadSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`\n✅ ${unreadSnapshot.size}개 문서 삭제 완료!`);
  } else {
    console.log('\n✅ 삭제할 문서가 없습니다.');
  }

  console.log('\n🎉 앱을 재시작하면 빨간 배지가 사라집니다!');

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
resetMeetupBadges(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
