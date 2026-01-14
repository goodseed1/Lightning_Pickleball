const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Duluth, GA 위치 정보
const DULUTH_LOCATION = {
  address: 'Duluth, GA, USA',
  city: 'Duluth',
  state: 'GA',
  country: 'USA',
  latitude: 34.0029,
  longitude: -84.1446,
};

async function addLocationToClubMembers() {
  console.log('📍 Lightning Tennis Club 회원들에게 위치 정보 추가\n');
  console.log('🎯 위치: Duluth, GA (34.0029, -84.1446)\n');
  console.log('='.repeat(80));

  const clubId = 'WsetxkWODywjt0BBcqrs'; // Lightning Tennis Club

  // 1. 클럽 멤버십 조회
  const membershipsQuery = await db.collection('clubMembers').where('clubId', '==', clubId).get();

  console.log(`\n📋 총 멤버십 수: ${membershipsQuery.size}명\n`);

  const memberUserIds = [];
  membershipsQuery.forEach(doc => {
    const data = doc.data();
    if (data.userId) {
      memberUserIds.push(data.userId);
    }
  });

  console.log(`📋 고유 사용자 ID: ${memberUserIds.length}명\n`);

  // 2. 각 사용자에게 위치 정보 추가
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const userId of memberUserIds) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.log(`⚠️ 사용자 ${userId} 문서 없음 - 건너뜀`);
        skippedCount++;
        continue;
      }

      const userData = userDoc.data();
      const userName = userData.displayName || userData.name || '(이름 없음)';

      // 이미 위치 정보가 있는지 확인
      const hasLocation =
        userData.location && userData.location.latitude && userData.location.longitude;

      if (hasLocation) {
        console.log(`✅ ${userName} - 이미 위치 있음 (${userData.location.city || 'city 없음'})`);
        skippedCount++;
        continue;
      }

      // 위치 정보 추가
      await userRef.update({
        location: DULUTH_LOCATION,
        'profile.location': DULUTH_LOCATION,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`📍 ${userName} - 위치 추가됨 (Duluth, GA)`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ 사용자 ${userId} 업데이트 실패:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 결과 요약:');
  console.log(`   ✅ 업데이트됨: ${updatedCount}명`);
  console.log(`   ⏭️ 건너뜀 (이미 있음): ${skippedCount}명`);
  console.log(`   ❌ 오류: ${errorCount}명`);
  console.log(`   📋 총: ${memberUserIds.length}명\n`);

  // 3. 검증
  console.log('='.repeat(80));
  console.log('\n🔍 검증 - 위치 정보 확인:\n');

  let withLocation = 0;
  let withoutLocation = 0;

  for (const userId of memberUserIds) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const userName = userData.displayName || userData.name || '(이름 없음)';
      const loc = userData.location;

      if (loc && loc.latitude && loc.longitude) {
        withLocation++;
        console.log(`   ✅ ${userName}: ${loc.city}, ${loc.state}`);
      } else {
        withoutLocation++;
        console.log(`   ❌ ${userName}: 위치 없음`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ 완료! 위치 있음: ${withLocation}명 / 위치 없음: ${withoutLocation}명\n`);

  process.exit(0);
}

addLocationToClubMembers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
