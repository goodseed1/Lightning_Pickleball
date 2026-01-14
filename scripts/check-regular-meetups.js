/**
 * 🔍 regular_meetups 컬렉션 데이터 구조 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkRegularMeetups() {
  console.log('🔍 regular_meetups 컬렉션 확인...\n');

  const meetupsSnap = await db.collection('regular_meetups').get();

  console.log(`📊 총 ${meetupsSnap.size}개의 regular_meetups 발견\n`);

  for (const doc of meetupsSnap.docs) {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log(`📅 ID: ${doc.id}`);
    console.log(`   title: ${data.title}`);
    console.log(`   dateTime: ${data.dateTime?.toDate?.() || data.dateTime}`);
    console.log(`   status: ${data.status}`);
    console.log(`   isRecurring: ${data.isRecurring}`);

    // 한국어 포함 여부 확인
    const allText = JSON.stringify(data);
    const hasKorean = /[가-힣]/.test(allText);
    if (hasKorean) {
      console.log(`   ⚠️ 한국어 포함됨!`);
      console.log(`   Raw data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  // tennis_clubs의 모든 필드 확인
  console.log('\n\n🏟️ tennis_clubs 필드 확인...\n');
  const clubsSnap = await db.collection('tennis_clubs').get();

  for (const doc of clubsSnap.docs) {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log(`🏟️ Club: ${data.name}`);
    console.log(`   Fields: ${Object.keys(data).join(', ')}`);

    // 한국어 포함 필드 찾기
    for (const [key, value] of Object.entries(data)) {
      const valueStr = JSON.stringify(value);
      if (/[가-힣]/.test(valueStr)) {
        console.log(`   ⚠️ 한국어 필드: ${key} = ${valueStr.substring(0, 100)}...`);
      }
    }
  }

  process.exit(0);
}

checkRegularMeetups().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
