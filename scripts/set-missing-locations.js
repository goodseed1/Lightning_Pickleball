/**
 * 🗺️ 위치정보 없는 사용자들에게 Duluth, GA 위치 설정
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Duluth, GA 위치 정보
const DULUTH_LOCATION = {
  latitude: 34.0029,
  longitude: -84.1446,
  city: 'Duluth',
  state: 'GA',
  country: 'US',
  formattedAddress: 'Duluth, GA, USA',
};

async function setMissingLocations() {
  console.log('🗺️ 위치정보 없는 사용자 검색 및 설정 시작...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const usersWithoutLocation = [];
  const usersWithLocation = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || data.name || '(이름 없음)';
    const location = data.location;

    // 위치 정보가 없거나 불완전한 경우
    const hasValidLocation =
      location &&
      (location.latitude !== undefined || location.lat !== undefined) &&
      (location.longitude !== undefined || location.lng !== undefined);

    if (!hasValidLocation) {
      usersWithoutLocation.push({
        id: doc.id,
        name,
        email: data.email || '(이메일 없음)',
        ref: doc.ref,
      });
    } else {
      usersWithLocation.push(name);
    }
  });

  console.log(`📊 총 ${snapshot.size}명 중:`);
  console.log(`   ✅ 위치 있음: ${usersWithLocation.length}명`);
  console.log(`   ❌ 위치 없음: ${usersWithoutLocation.length}명\n`);

  if (usersWithoutLocation.length === 0) {
    console.log('✅ 모든 사용자에게 위치 정보가 있습니다!');
    process.exit(0);
    return;
  }

  console.log('📋 위치 설정할 사용자 목록:');
  usersWithoutLocation.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.name} (${u.email})`);
  });

  console.log('\n⏳ Duluth, GA 위치 설정 중...');

  const batch = db.batch();
  usersWithoutLocation.forEach(user => {
    batch.update(user.ref, { location: DULUTH_LOCATION });
  });

  await batch.commit();

  console.log(`\n✅ ${usersWithoutLocation.length}명에게 Duluth, GA 위치 설정 완료!`);
  console.log(`   📍 위도: ${DULUTH_LOCATION.latitude}`);
  console.log(`   📍 경도: ${DULUTH_LOCATION.longitude}`);

  process.exit(0);
}

setMissingLocations().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
