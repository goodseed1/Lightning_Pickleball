/**
 * 복식 리그 데이터 구조 분석 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugDoublesLeague() {
  console.log('🔍 복식 리그 데이터 구조 분석...\n');

  // 2026년 남자 복식 리그 찾기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db
    .collection('leagues')
    .where('clubId', '==', clubId)
    .where('eventType', '==', 'mens_doubles')
    .get();

  console.log(`📊 복식 리그 ${leaguesSnap.size}개 발견\n`);

  for (const doc of leaguesSnap.docs) {
    const data = doc.data();

    console.log('='.repeat(60));
    console.log(`🏆 리그 ID: ${doc.id}`);
    console.log(`   제목: ${data.name || data.title}`);
    console.log(`   상태: ${data.status}`);
    console.log(`   이벤트 타입: ${data.eventType}`);

    // standings 필드 확인
    if (data.standings && Array.isArray(data.standings)) {
      console.log(`\n📊 standings 배열 (${data.standings.length}개):`);
      data.standings.forEach((s, i) => {
        console.log(`\n[${i}] ${JSON.stringify(s, null, 2)}`);
      });
    }

    // playoff 필드 확인
    if (data.playoff) {
      console.log(`\n🏅 playoff 객체:`);
      console.log(JSON.stringify(data.playoff, null, 2));
    }

    // champion, runnerUp 확인
    if (data.champion) {
      console.log(`\n🏆 champion:`);
      console.log(JSON.stringify(data.champion, null, 2));
    }
    if (data.runnerUp) {
      console.log(`\n🥈 runnerUp:`);
      console.log(JSON.stringify(data.runnerUp, null, 2));
    }

    console.log('\n');
  }

  process.exit(0);
}

debugDoublesLeague().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
