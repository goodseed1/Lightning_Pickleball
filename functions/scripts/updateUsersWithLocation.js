/**
 * 🗺️ 위치 정보 없는 사용자 일괄 업데이트 스크립트
 *
 * 목적: 위치 정보가 없는 테스트 사용자들에게 Duluth, GA 30096 위치를 설정
 *
 * 실행 방법:
 * cd functions
 * node scripts/updateUsersWithLocation.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Duluth, GA 30096 위치 정보
const DULUTH_LOCATION = {
  latitude: 34.0028,
  longitude: -84.1447,
  address: 'Duluth, GA 30096',
  city: 'Duluth',
  state: 'GA',
  country: 'US',
};

async function updateUsersWithLocation() {
  console.log('🗺️ 위치 정보 없는 사용자 검색 시작...\n');

  try {
    // 모든 사용자 조회
    const usersSnapshot = await db.collection('users').get();

    let totalUsers = 0;
    let usersWithoutLocation = [];
    let updatedCount = 0;
    let errorCount = 0;

    usersSnapshot.forEach(doc => {
      totalUsers++;
      const userData = doc.data();

      // 위치 정보 확인 (profile.location 또는 location)
      const profileLocation = userData.profile?.location;
      const rootLocation = userData.location;

      const hasValidLocation =
        (profileLocation && profileLocation.latitude && profileLocation.longitude) ||
        (rootLocation && rootLocation.latitude && rootLocation.longitude);

      if (!hasValidLocation) {
        usersWithoutLocation.push({
          id: doc.id,
          displayName: userData.displayName || userData.profile?.nickname || 'Unknown',
          email: userData.email || 'No email',
        });
      }
    });

    console.log(`📊 전체 사용자: ${totalUsers}명`);
    console.log(`❌ 위치 정보 없는 사용자: ${usersWithoutLocation.length}명\n`);

    if (usersWithoutLocation.length === 0) {
      console.log('✅ 모든 사용자에게 위치 정보가 있습니다!');
      process.exit(0);
    }

    console.log('위치 정보 없는 사용자 목록:');
    usersWithoutLocation.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.displayName} (${user.email}) - ID: ${user.id}`);
    });

    console.log('\n🔄 위치 정보 업데이트 시작...\n');

    // 위치 정보 업데이트
    for (const user of usersWithoutLocation) {
      try {
        await db
          .collection('users')
          .doc(user.id)
          .update({
            'profile.location': DULUTH_LOCATION,
            location: {
              latitude: DULUTH_LOCATION.latitude,
              longitude: DULUTH_LOCATION.longitude,
            },
          });

        console.log(`  ✅ ${user.displayName} 위치 업데이트 완료`);
        updatedCount++;
      } catch (error) {
        console.error(`  ❌ ${user.displayName} 업데이트 실패:`, error.message);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('📊 업데이트 결과:');
    console.log(`  ✅ 성공: ${updatedCount}명`);
    console.log(`  ❌ 실패: ${errorCount}명`);
    console.log(
      `  📍 설정된 위치: ${DULUTH_LOCATION.city}, ${DULUTH_LOCATION.state} ${DULUTH_LOCATION.address.split(' ').pop()}`
    );
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }

  process.exit(0);
}

// 실행
updateUsersWithLocation();
