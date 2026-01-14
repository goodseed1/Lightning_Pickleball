/**
 * 토너먼트 참가자 데이터 구조 분석 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugTournamentParticipants() {
  console.log('🔍 토너먼트 참가자 데이터 구조 분석...\n');

  // 25명 참가자가 있는 토너먼트 찾기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const tournamentsSnap = await db.collection('tournaments').where('clubId', '==', clubId).get();

  for (const doc of tournamentsSnap.docs) {
    const data = doc.data();

    if (data.participants && data.participants.length === 25) {
      console.log(`🏆 토너먼트 ID: ${doc.id}`);
      console.log(`   제목: ${data.title}`);
      console.log(`   상태: ${data.status}`);
      console.log(`\n📋 참가자 데이터 샘플 (처음 5명):\n`);

      data.participants.slice(0, 5).forEach((p, i) => {
        console.log(`[${i}] ${JSON.stringify(p, null, 2)}\n`);
      });

      // "테스트선수" 포함된 참가자 찾기
      console.log(`\n🔍 "테스트선수" 이름을 가진 참가자:\n`);
      data.participants.forEach((p, i) => {
        if (p.name && p.name.includes('테스트선수')) {
          console.log(`[${i}] name: "${p.name}", userId: ${p.userId || 'N/A'}`);
        }
      });

      break;
    }
  }

  process.exit(0);
}

debugTournamentParticipants().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
