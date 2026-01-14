/**
 * 클럽 배지 초기화 스크립트
 * 특정 유저의 클럽 알림 배지를 초기화합니다.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function resetClubBadge(email) {
  console.log(`🔍 ${email} 유저 검색 중...\n`);

  // 1. 유저 찾기
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();

  if (usersSnapshot.empty) {
    console.log('❌ 유저를 찾을 수 없습니다.');
    process.exit(1);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log('✅ 유저 찾음!');
  console.log('User ID:', userId);
  console.log('Display Name:', userData.displayName);
  console.log('');

  // 2. 현재 unread 데이터 확인
  console.log('='.repeat(60));
  console.log('📊 현재 unread 관련 데이터:');
  console.log('='.repeat(60));

  // users/{userId} 직접 필드
  console.log('\n[users 컬렉션 직접 필드]');
  console.log('  unreadClubNotifications:', userData.unreadClubNotifications || 0);
  console.log('  unreadClubMessages:', userData.unreadClubMessages || 0);
  console.log('  clubBadgeCount:', userData.clubBadgeCount || 0);

  // users/{userId}/unreadCounts 서브컬렉션
  console.log('\n[users/{userId}/unreadCounts 서브컬렉션]');
  const unreadCountsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('unreadCounts')
    .get();
  if (unreadCountsSnapshot.empty) {
    console.log('  (없음)');
  } else {
    unreadCountsSnapshot.forEach(doc => {
      console.log(`  ${doc.id}:`, JSON.stringify(doc.data()));
    });
  }

  // clubNotifications 서브컬렉션에서 unread 확인
  console.log('\n[users/{userId}/clubNotifications 서브컬렉션 - unread 항목]');
  const clubNotiSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('clubNotifications')
    .where('read', '==', false)
    .get();
  console.log(`  읽지 않은 알림: ${clubNotiSnapshot.size}개`);

  // 3. 초기화 작업
  console.log('\n' + '='.repeat(60));
  console.log('🔧 초기화 작업 시작...');
  console.log('='.repeat(60));

  const batch = db.batch();

  // users 문서의 배지 관련 필드 초기화
  batch.update(db.collection('users').doc(userId), {
    unreadClubNotifications: 0,
    unreadClubMessages: 0,
    clubBadgeCount: 0,
  });

  // clubNotifications를 모두 read로 마킹
  clubNotiSnapshot.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  // unreadCounts 서브컬렉션 초기화
  unreadCountsSnapshot.forEach(doc => {
    batch.update(doc.ref, { count: 0 });
  });

  await batch.commit();

  console.log('✅ 초기화 완료!');
  console.log('');
  console.log('📋 초기화된 항목:');
  console.log('  - unreadClubNotifications: 0');
  console.log('  - unreadClubMessages: 0');
  console.log('  - clubBadgeCount: 0');
  console.log(`  - ${clubNotiSnapshot.size}개 알림을 읽음 처리`);
  console.log(`  - ${unreadCountsSnapshot.size}개 unreadCounts 초기화`);
  console.log('');
  console.log('🎉 앱에서 클럽 화면을 새로고침하거나 다시 열어보세요!');

  process.exit(0);
}

const email = process.argv[2] || 'test9@g.com';
resetClubBadge(email).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
