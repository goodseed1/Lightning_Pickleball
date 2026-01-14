const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkProfileLocation() {
  console.log('🔍 profile.location vs location 필드 분석\n');
  console.log('='.repeat(80));

  const usersSnapshot = await db.collection('users').get();
  console.log('\n📋 총 사용자 수: ' + usersSnapshot.size + '명\n');

  let bothFields = 0;
  let onlyLocation = 0;
  let onlyProfileLocation = 0;
  let neither = 0;

  const issues = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || data.name || '(없음)';

    const hasLocation = data.location && data.location.latitude && data.location.longitude;
    const hasProfileLocation =
      data.profile?.location?.latitude && data.profile?.location?.longitude;

    if (hasLocation && hasProfileLocation) {
      bothFields++;
    } else if (hasLocation && !hasProfileLocation) {
      onlyLocation++;
      issues.push({ name, issue: 'location만 있음 (profile.location 없음)' });
    } else if (!hasLocation && hasProfileLocation) {
      onlyProfileLocation++;
      issues.push({ name, issue: 'profile.location만 있음' });
    } else {
      neither++;
      issues.push({ name, issue: '둘 다 없음' });
    }
  });

  console.log('📊 필드 분석 결과:');
  console.log('   ✅ 둘 다 있음: ' + bothFields + '명');
  console.log('   ⚠️ location만 있음: ' + onlyLocation + '명');
  console.log('   ⚠️ profile.location만 있음: ' + onlyProfileLocation + '명');
  console.log('   ❌ 둘 다 없음: ' + neither + '명');

  if (issues.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️ 문제 사용자 목록 (처음 10명):');
    issues.slice(0, 10).forEach((issue, idx) => {
      console.log('   ' + (idx + 1) + '. ' + issue.name + ' - ' + issue.issue);
    });
  }

  // DiscoveryContext에서 사용하는 필드 확인
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 DiscoveryContext 로직 확인:');
  console.log('   앱 코드: player.profile?.location || player.location');
  console.log('   => profile.location 우선, location fallback');

  if (onlyLocation > 0) {
    console.log('\n⚠️ 문제 발견!');
    console.log('   ' + onlyLocation + '명의 사용자가 location만 있고 profile.location이 없음');
    console.log('   => 이 사용자들은 앱에서 거리 계산이 안될 수 있음!');
  }

  process.exit(0);
}

checkProfileLocation().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
