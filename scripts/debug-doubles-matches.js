/**
 * 복식 리그 매치 데이터 구조 분석 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugDoublesMatches() {
  console.log('🔍 복식 리그 매치 데이터 구조 분석...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db
    .collection('leagues')
    .where('clubId', '==', clubId)
    .where('eventType', '==', 'mens_doubles')
    .get();

  console.log(`📊 복식 리그 ${leaguesSnap.size}개 발견\n`);

  for (const leagueDoc of leaguesSnap.docs) {
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;

    console.log('='.repeat(60));
    console.log(`🏆 리그: ${leagueData.name || leagueData.title}`);
    console.log(`   ID: ${leagueId}`);

    // matches 서브컬렉션
    const matchesSnap = await db.collection('leagues').doc(leagueId).collection('matches').get();
    console.log(`\n📊 matches 서브컬렉션 (${matchesSnap.size}개):`);

    for (const matchDoc of matchesSnap.docs) {
      const matchData = matchDoc.data();
      console.log(`\n[${matchDoc.id}]`);
      console.log(`  type: ${matchData.type}`);
      console.log(`  isPlayoffMatch: ${matchData.isPlayoffMatch}`);
      console.log(`  player1Id: ${matchData.player1Id}`);
      console.log(`  player1Name: ${matchData.player1Name}`);
      console.log(`  player2Id: ${matchData.player2Id}`);
      console.log(`  player2Name: ${matchData.player2Name}`);
      console.log(`  winner: ${matchData.winner}`);
      console.log(`  status: ${matchData.status}`);
    }
  }

  process.exit(0);
}

debugDoublesMatches().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
