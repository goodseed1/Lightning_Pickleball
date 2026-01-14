/**
 * 🗑️ 회비 모크 데이터 삭제 스크립트 (롤백용)
 *
 * create-mock-dues-data.js로 생성한 모크 데이터를 삭제합니다.
 * isMockData: true 플래그가 있는 레코드만 삭제합니다.
 *
 * 사용법: node scripts/delete-mock-dues-data.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Lightning Tennis Club ID
const CLUB_ID = 'WsetxkWODywjt0BBcqrs';

async function deleteMockDuesData() {
  console.log('🗑️ 회비 모크 데이터 삭제 시작...\n');
  console.log('📋 Club ID:', CLUB_ID);
  console.log('='.repeat(60) + '\n');

  // 1. 모크 데이터 조회
  console.log('🔍 모크 데이터 조회 중...');
  const mockDataSnap = await db
    .collection('member_dues_records')
    .where('clubId', '==', CLUB_ID)
    .where('isMockData', '==', true)
    .get();

  if (mockDataSnap.size === 0) {
    console.log('   ✅ 삭제할 모크 데이터가 없습니다.');
    process.exit(0);
  }

  console.log(`   발견된 모크 데이터: ${mockDataSnap.size}건\n`);

  // 연도별 카운트
  const yearCount = { 2024: 0, 2025: 0, other: 0 };
  mockDataSnap.docs.forEach(doc => {
    const data = doc.data();
    const year = data.period?.year;
    if (year === 2024) yearCount[2024]++;
    else if (year === 2025) yearCount[2025]++;
    else yearCount.other++;
  });

  console.log('📊 연도별 분포:');
  console.log(`   📅 2024년: ${yearCount[2024]}건`);
  console.log(`   📅 2025년: ${yearCount[2025]}건`);
  if (yearCount.other > 0) {
    console.log(`   📅 기타: ${yearCount.other}건`);
  }

  // 2. 배치 삭제
  console.log('\n📤 삭제 진행 중...');

  const batchSize = 500;
  let totalDeleted = 0;
  const docs = mockDataSnap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + batchSize);

    chunk.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += chunk.length;
    console.log(`   진행: ${totalDeleted}/${docs.length}건 삭제`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 모크 데이터 삭제 완료!');
  console.log('='.repeat(60));
  console.log(`\n🗑️ 삭제된 레코드: ${totalDeleted}건`);
  console.log(`\n🎾 Annual Payment Report가 원래 상태로 돌아갔습니다.`);

  process.exit(0);
}

deleteMockDuesData().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
