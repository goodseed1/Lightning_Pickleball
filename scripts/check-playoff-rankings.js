/**
 * playoffRankings 필드 확인 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function check() {
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db
    .collection('leagues')
    .where('clubId', '==', clubId)
    .where('eventType', '==', 'mens_doubles')
    .get();

  for (const doc of leaguesSnap.docs) {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('리그:', data.name || data.title);

    // playoffRankings 확인
    if (data.playoffRankings && Array.isArray(data.playoffRankings)) {
      console.log('\n📊 playoffRankings 배열:');
      data.playoffRankings.forEach((r, i) => {
        console.log(`[${i}] playerId: ${r.playerId}, playerName: ${r.playerName}`);
      });
    } else {
      console.log('playoffRankings 없음');
    }

    // champion, runnerUp 확인
    if (data.champion) {
      console.log('\n🏆 champion:', JSON.stringify(data.champion));
    }
    if (data.runnerUp) {
      console.log('🥈 runnerUp:', JSON.stringify(data.runnerUp));
    }
  }

  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
