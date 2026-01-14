/**
 * 🔍 ELO 상태 확인 스크립트
 * 실제로 경기 기록이 있는 사용자들 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkEloStatus() {
  console.log('🔍 사용자 ELO 상태 확인...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const usersWithMatches = [];
  const usersWithoutMatches = [];
  const testUsers = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || data.name || '(이름 없음)';
    const email = data.email || '(이메일 없음)';

    // publicStats에서 경기 기록 확인
    const publicStats = data.publicStats;
    const hasPublicMatches =
      publicStats &&
      (publicStats.singles?.matchesPlayed > 0 ||
        publicStats.doubles?.matchesPlayed > 0 ||
        publicStats.mixed?.matchesPlayed > 0);

    // eloRatings 확인
    const eloRatings = data.eloRatings;
    const currentElo = {
      singles: eloRatings?.singles?.elo || 'N/A',
      doubles: eloRatings?.doubles?.elo || 'N/A',
      mixed: eloRatings?.mixed?.elo || 'N/A',
    };

    // 테스트 유저인지 확인 (이메일로)
    const isTestUser =
      email.includes('testplayer') || (email.includes('test') && email.includes('@'));

    const userInfo = {
      id: doc.id,
      name,
      email,
      currentElo,
      publicStats: publicStats
        ? {
            singles: publicStats.singles?.matchesPlayed || 0,
            doubles: publicStats.doubles?.matchesPlayed || 0,
            mixed: publicStats.mixed?.matchesPlayed || 0,
          }
        : null,
      hasPublicMatches,
    };

    if (isTestUser) {
      testUsers.push(userInfo);
    } else if (hasPublicMatches) {
      usersWithMatches.push(userInfo);
    } else {
      usersWithoutMatches.push(userInfo);
    }
  });

  console.log('='.repeat(60));
  console.log('📊 경기 기록이 있는 실제 사용자들 (롤백 필요 가능성)');
  console.log('='.repeat(60));
  usersWithMatches.forEach((u, i) => {
    console.log(`\n${i + 1}. ${u.name} (${u.email})`);
    console.log(
      `   ELO: S=${u.currentElo.singles}, D=${u.currentElo.doubles}, M=${u.currentElo.mixed}`
    );
    console.log(
      `   경기수: S=${u.publicStats?.singles || 0}, D=${u.publicStats?.doubles || 0}, M=${u.publicStats?.mixed || 0}`
    );
  });

  console.log('\n\n' + '='.repeat(60));
  console.log('🧪 테스트 사용자들 (롤백 불필요)');
  console.log('='.repeat(60));
  console.log(`총 ${testUsers.length}명`);

  console.log('\n\n' + '='.repeat(60));
  console.log('👤 경기 기록 없는 일반 사용자들');
  console.log('='.repeat(60));
  usersWithoutMatches.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name} (${u.email}) - ELO: S=${u.currentElo.singles}`);
  });

  console.log('\n\n📊 요약:');
  console.log(`   - 경기 기록 있는 사용자: ${usersWithMatches.length}명`);
  console.log(`   - 테스트 사용자: ${testUsers.length}명`);
  console.log(`   - 경기 기록 없는 일반 사용자: ${usersWithoutMatches.length}명`);

  process.exit(0);
}

checkEloStatus().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
