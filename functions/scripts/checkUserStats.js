/**
 * 회장 사용자의 경기 통계 데이터 구조 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUserStats() {
  console.log('🔍 회장 사용자 경기 통계 구조 확인...\n');

  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const nickname = data.profile?.nickname || data.displayName;

    if (nickname === '회장') {
      console.log('=== 회장 사용자 데이터 ===');
      console.log('ID:', doc.id);
      console.log('\n📊 stats (root level):');
      console.log(JSON.stringify(data.stats, null, 2));
      console.log('\n📊 publicStats:');
      console.log(JSON.stringify(data.publicStats, null, 2));
      console.log('\n📊 profile.stats:');
      console.log(JSON.stringify(data.profile?.stats, null, 2));
      console.log('\n📊 matchHistory:');
      console.log(JSON.stringify(data.matchHistory, null, 2));

      // 모든 루트 필드 확인
      console.log('\n📊 모든 루트 레벨 키:');
      console.log(Object.keys(data).join(', '));

      break;
    }
  }

  process.exit(0);
}

checkUserStats();
