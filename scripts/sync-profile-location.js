const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function syncProfileLocation() {
  console.log('🔄 location → profile.location 동기화\n');
  console.log('='.repeat(80));

  const usersSnapshot = await db.collection('users').get();
  console.log('\n📋 총 사용자 수: ' + usersSnapshot.size + '명\n');

  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const name = data.displayName || data.name || '(없음)';

    const hasLocation = data.location && data.location.latitude && data.location.longitude;
    const hasProfileLocation =
      data.profile?.location?.latitude && data.profile?.location?.longitude;

    // location은 있는데 profile.location이 없는 경우
    if (hasLocation && !hasProfileLocation) {
      try {
        const locationData = {
          address: data.location.address || '',
          city: data.location.city || '',
          state: data.location.state || '',
          country: data.location.country || 'USA',
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        };

        // profile이 없으면 생성, 있으면 location만 추가
        const updateData = data.profile
          ? { 'profile.location': locationData }
          : { profile: { location: locationData } };

        await db.collection('users').doc(doc.id).update(updateData);
        console.log('✅ 동기화: ' + name + ' - ' + locationData.city + ', ' + locationData.state);
        syncedCount++;
      } catch (error) {
        console.error('❌ 오류 (' + name + '): ' + error.message);
        errorCount++;
      }
    } else if (hasProfileLocation) {
      skippedCount++;
    } else {
      console.log('⚠️ 위치 없음: ' + name);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 결과 요약:');
  console.log('   ✅ 동기화됨: ' + syncedCount + '명');
  console.log('   ⏭️ 건너뜀 (이미 있음): ' + skippedCount + '명');
  console.log('   ❌ 오류: ' + errorCount + '명');

  // 검증
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 검증:');

  const verifySnapshot = await db.collection('users').get();
  let bothCount = 0;
  let missingCount = 0;

  verifySnapshot.forEach(doc => {
    const data = doc.data();
    const hasProfileLoc = data.profile?.location?.latitude && data.profile?.location?.longitude;
    if (hasProfileLoc) {
      bothCount++;
    } else {
      missingCount++;
    }
  });

  console.log('   ✅ profile.location 있음: ' + bothCount + '명');
  console.log('   ❌ profile.location 없음: ' + missingCount + '명');

  console.log('\n✅ 완료! 이제 앱에서 ' + bothCount + '명이 보여야 합니다!\n');

  process.exit(0);
}

syncProfileLocation().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
