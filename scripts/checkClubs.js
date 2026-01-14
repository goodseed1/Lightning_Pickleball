/**
 * 클럽 데이터 확인 스크립트
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function checkClubs() {
  console.log('🔍 클럽 데이터 확인 중...\n');

  // 1. clubs 컬렉션 확인
  const clubsSnapshot = await db.collection('clubs').get();
  console.log(`📊 clubs 컬렉션: ${clubsSnapshot.size}개\n`);

  if (clubsSnapshot.size > 0) {
    console.log('클럽 목록:');
    clubsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. ${data.name || data.clubName || 'Unknown'}`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     멤버 수: ${data.memberCount || data.members?.length || 0}`);
      console.log(`     생성일: ${data.createdAt?.toDate?.() || 'N/A'}`);
      console.log('');
    });
  }

  // 2. 이벤트 컬렉션 확인
  const eventsSnapshot = await db.collection('events').get();
  console.log(`📅 events 컬렉션: ${eventsSnapshot.size}개\n`);

  // 3. 경기 컬렉션 확인
  const matchesSnapshot = await db.collection('matches').get();
  console.log(`🏆 matches 컬렉션: ${matchesSnapshot.size}개\n`);

  // 4. 사용자 컬렉션 확인
  const usersSnapshot = await db.collection('users').get();
  console.log(`👥 users 컬렉션: ${usersSnapshot.size}개\n`);
}

checkClubs()
  .then(() => {
    console.log('✅ 확인 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 에러:', error);
    process.exit(1);
  });
