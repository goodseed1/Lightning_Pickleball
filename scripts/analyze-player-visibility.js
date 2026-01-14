const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function analyzePlayerVisibility() {
  console.log('🔍 플레이어 탐색 가시성 분석\n');
  console.log('='.repeat(80));

  // 현재 사용자 수
  const usersSnapshot = await db.collection('users').get();
  console.log('\n📋 총 사용자 수: ' + usersSnapshot.size + '명\n');

  // 위치 정보 분석
  let withValidLocation = 0;
  let withInvalidLocation = 0;
  let withoutDisplayName = 0;

  const locationStats = {};
  const users = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const loc = data.location;
    const name = data.displayName || data.name;

    users.push({
      id: doc.id,
      name: name || '(없음)',
      city: loc?.city || '(없음)',
      lat: loc?.latitude,
      lng: loc?.longitude,
    });

    // displayName 체크
    if (!name || name === 'Player' || name.trim() === '') {
      withoutDisplayName++;
      console.log('❌ 이름 없음: ' + doc.id);
      return;
    }

    // 위치 체크
    if (loc && loc.latitude && loc.longitude) {
      withValidLocation++;
      const city = loc.city || 'Unknown';
      locationStats[city] = (locationStats[city] || 0) + 1;
    } else {
      withInvalidLocation++;
      console.log('❌ 위치 없음: ' + name);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 분석 결과:');
  console.log('   ✅ 유효한 위치 + 이름: ' + withValidLocation + '명');
  console.log('   ❌ 위치 없음: ' + withInvalidLocation + '명');
  console.log('   ❌ 이름 없음: ' + withoutDisplayName + '명');

  console.log('\n📍 도시별 분포:');
  Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log('   ' + city + ': ' + count + '명');
    });

  // Flowery Branch 위치 (현재 로그인 사용자 위치로 추정)
  const floweryBranchCoords = { lat: 34.1851, lng: -83.9254 };

  // 50마일 필터링 테스트
  console.log('\n' + '='.repeat(80));
  console.log('\n📏 50마일 거리 필터 테스트 (Flowery Branch 기준):');

  const R = 3959; // 마일
  let withinRange = 0;
  let outOfRange = 0;

  users.forEach(user => {
    if (!user.lat || !user.lng) return;

    const dLat = ((user.lat - floweryBranchCoords.lat) * Math.PI) / 180;
    const dLon = ((user.lng - floweryBranchCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((floweryBranchCoords.lat * Math.PI) / 180) *
        Math.cos((user.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance <= 50) {
      withinRange++;
    } else {
      outOfRange++;
      console.log(
        '   ❌ 범위 밖: ' + user.name + ' (' + user.city + ') - ' + distance.toFixed(1) + 'mi'
      );
    }
  });

  console.log('\n   ✅ 50마일 이내: ' + withinRange + '명');
  console.log('   ❌ 50마일 초과: ' + outOfRange + '명');

  // 실제 앱에서 보이는 13명과 비교
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 예상 vs 실제:');
  console.log('   예상 (50mi 이내): ' + withinRange + '명');
  console.log('   실제 (스크린샷): 13명');
  console.log('   차이: ' + (withinRange - 13) + '명');

  if (withinRange > 13) {
    console.log('\n⚠️ 차이 원인 분석 필요:');
    console.log('   - 본인 제외? (-1명)');
    console.log('   - 이름 없는 사용자? (-' + withoutDisplayName + '명)');
    console.log('   - 예상: ' + (withinRange - 1 - withoutDisplayName) + '명');
  }

  process.exit(0);
}

analyzePlayerVisibility().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
