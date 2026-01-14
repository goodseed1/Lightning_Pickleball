const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function listUsersWithLocationDetailed() {
  console.log('📍 위치 정보가 있는 사용자 상세 목록\n');
  console.log('='.repeat(110));

  const usersSnapshot = await db.collection('users').get();

  const usersWithLocation = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();

    // location 필드가 있는지 확인
    if (data.location && typeof data.location === 'object') {
      const loc = data.location;
      usersWithLocation.push({
        name: data.displayName || data.name || '(이름 없음)',
        email: data.email || '(이메일 없음)',
        city: loc.city || '',
        state: loc.state || '',
        address: loc.address || '',
        latitude: loc.latitude || loc._latitude || null,
        longitude: loc.longitude || loc._longitude || null,
      });
    }
  });

  // 이름순 정렬
  usersWithLocation.sort((a, b) => a.name.localeCompare(b.name));

  // 실제 사용자만 필터 (테스트 계정 제외)
  const realUsers = usersWithLocation.filter(u => {
    const isTestPlayer = u.email.includes('testplayer');
    const isTestG = /^test\d+@g\.com$/.test(u.email);
    const isAutoGen = /\d{5}@gmail\.com$/.test(u.email);
    return !isTestPlayer && !isTestG && !isAutoGen;
  });

  const testUsers = usersWithLocation.filter(u => {
    const isTestPlayer = u.email.includes('testplayer');
    const isTestG = /^test\d+@g\.com$/.test(u.email);
    const isAutoGen = /\d{5}@gmail\.com$/.test(u.email);
    return isTestPlayer || isTestG || isAutoGen;
  });

  console.log('\n🌟 실제 사용자 (' + realUsers.length + '명)\n');
  console.log('-'.repeat(110));
  console.log(
    '#'.padEnd(4) +
      '이름'.padEnd(20) +
      '이메일'.padEnd(35) +
      '도시'.padEnd(20) +
      '주'.padEnd(8) +
      '좌표'
  );
  console.log('-'.repeat(110));

  realUsers.forEach((user, idx) => {
    const coords =
      user.latitude && user.longitude
        ? user.latitude.toFixed(2) + ', ' + user.longitude.toFixed(2)
        : '-';
    console.log(
      String(idx + 1).padEnd(4) +
        user.name.substring(0, 18).padEnd(20) +
        user.email.substring(0, 33).padEnd(35) +
        (user.city || '-').substring(0, 18).padEnd(20) +
        (user.state || '-').substring(0, 6).padEnd(8) +
        coords
    );
  });

  console.log('\n' + '='.repeat(110));
  console.log('\n🧪 테스트 사용자 (' + testUsers.length + '명) - 생략\n');

  // 도시별 통계
  const cityStats = {};
  usersWithLocation.forEach(u => {
    const city = u.city || '(미지정)';
    cityStats[city] = (cityStats[city] || 0) + 1;
  });

  console.log('📊 도시별 분포:');
  Object.entries(cityStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log('   ' + city + ': ' + count + '명');
    });

  console.log('\n총 위치 정보 보유: ' + usersWithLocation.length + '명');

  process.exit(0);
}

listUsersWithLocationDetailed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
