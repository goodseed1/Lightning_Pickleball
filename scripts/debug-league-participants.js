/**
 * 리그 참가자 데이터 구조 분석 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugLeagueParticipants() {
  console.log('🔍 리그 참가자 데이터 구조 분석...\n');

  // Lightning Pickleball Club 리그 찾기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  console.log(`📊 총 ${leaguesSnap.size}개의 리그 발견\n`);

  for (const doc of leaguesSnap.docs) {
    const data = doc.data();

    console.log('='.repeat(60));
    console.log(`🏆 리그 ID: ${doc.id}`);
    console.log(`   제목: ${data.title || data.name}`);
    console.log(`   상태: ${data.status}`);

    // participants 필드 확인
    if (data.participants && Array.isArray(data.participants)) {
      console.log(`\n📋 participants 배열 (${data.participants.length}명):`);
      data.participants.slice(0, 3).forEach((p, i) => {
        console.log(`\n[${i}] ${JSON.stringify(p, null, 2)}`);
      });
    }

    // players 필드 확인
    if (data.players && Array.isArray(data.players)) {
      console.log(`\n📋 players 배열 (${data.players.length}명):`);
      data.players.slice(0, 3).forEach((p, i) => {
        console.log(`\n[${i}] ${JSON.stringify(p, null, 2)}`);
      });
    }

    // rankings 필드 확인
    if (data.rankings && Array.isArray(data.rankings)) {
      console.log(`\n📊 rankings 배열 (${data.rankings.length}명):`);
      data.rankings.slice(0, 3).forEach((p, i) => {
        console.log(`\n[${i}] ${JSON.stringify(p, null, 2)}`);
      });
    }

    // playoffRankings 필드 확인
    if (data.playoffRankings && Array.isArray(data.playoffRankings)) {
      console.log(`\n🏅 playoffRankings 배열 (${data.playoffRankings.length}명):`);
      data.playoffRankings.slice(0, 5).forEach((p, i) => {
        console.log(`\n[${i}] ${JSON.stringify(p, null, 2)}`);
      });
    }

    // matches 서브컬렉션 확인
    const matchesSnap = await db
      .collection('leagues')
      .doc(doc.id)
      .collection('matches')
      .limit(2)
      .get();

    if (!matchesSnap.empty) {
      console.log(`\n🏸 matches 서브컬렉션 샘플:`);
      matchesSnap.docs.forEach((matchDoc, i) => {
        console.log(`\n[Match ${i}] ${JSON.stringify(matchDoc.data(), null, 2)}`);
      });
    }

    console.log('\n');
  }

  process.exit(0);
}

debugLeagueParticipants().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
