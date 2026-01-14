/**
 * 복식 리그의 모든 서브컬렉션 확인 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugAllSubcollections() {
  console.log('🔍 복식 리그 서브컬렉션 분석...\n');

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

    // playoff_matches 서브컬렉션 확인
    const playoffMatchesSnap = await db
      .collection('leagues')
      .doc(leagueId)
      .collection('playoff_matches')
      .get();
    console.log(`\n🏅 playoff_matches 서브컬렉션 (${playoffMatchesSnap.size}개):`);

    for (const matchDoc of playoffMatchesSnap.docs) {
      const matchData = matchDoc.data();
      console.log(`\n[${matchDoc.id}]`);
      console.log(`  type: ${matchData.type}`);
      console.log(`  player1Id: ${matchData.player1Id}`);
      console.log(`  player1Name: ${matchData.player1Name}`);
      console.log(`  player2Id: ${matchData.player2Id}`);
      console.log(`  player2Name: ${matchData.player2Name}`);
      console.log(`  winner: ${matchData.winner}`);
      console.log(`  status: ${matchData.status}`);
    }

    // matches 서브컬렉션에서 isPlayoffMatch가 true인 것 확인
    const matchesSnap = await db.collection('leagues').doc(leagueId).collection('matches').get();
    const playoffMatches = matchesSnap.docs.filter(doc => doc.data().isPlayoffMatch === true);
    console.log(`\n🏸 matches 서브컬렉션에서 isPlayoffMatch=true (${playoffMatches.length}개):`);

    for (const matchDoc of playoffMatches) {
      const matchData = matchDoc.data();
      console.log(`\n[${matchDoc.id}]`);
      console.log(`  type: ${matchData.type}`);
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

debugAllSubcollections().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
