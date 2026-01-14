/**
 * 리그 순위 데이터 구조 분석 스크립트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugLeagueRankings() {
  console.log('🔍 리그 순위 데이터 구조 분석...\n');

  // 2026년 남자 단식 리그 찾기
  const leagueId = 'KUfpjNl3g3Yoa1N7G9KB'; // 스크린샷에서 본 리그
  const leagueDoc = await db.collection('leagues').doc(leagueId).get();

  if (!leagueDoc.exists) {
    console.log('리그를 찾을 수 없습니다');
    process.exit(1);
  }

  const data = leagueDoc.data();

  console.log('🏆 리그:', data.title);
  console.log('상태:', data.status);
  console.log('\n');

  // 모든 필드 확인
  console.log('📋 리그 문서의 모든 필드:');
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (Array.isArray(value)) {
      console.log(`\n[${key}] (배열, ${value.length}개):`);
      value.slice(0, 3).forEach((item, i) => {
        console.log(`  [${i}] ${JSON.stringify(item, null, 4)}`);
      });
    } else if (typeof value === 'object' && value !== null) {
      console.log(`\n[${key}] (객체):`);
      console.log(`  ${JSON.stringify(value, null, 4)}`);
    } else {
      console.log(`[${key}]: ${value}`);
    }
  });

  process.exit(0);
}

debugLeagueRankings().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
