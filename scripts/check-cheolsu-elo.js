const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkCheolsuElo() {
  console.log('🔍 철수(test2@g.com) 사용자 데이터 전체 조회...\n');

  // displayName으로 사용자 찾기
  const usersSnapshot = await db
    .collection('users')
    .where('profile.displayName', '==', '철수')
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.log('❌ 철수 사용자를 찾을 수 없습니다.');
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 사용자 ID:', userDoc.id);
  console.log('📋 이름:', userData.profile?.displayName);
  console.log('📋 이메일:', userData.profile?.email);
  console.log('');

  console.log('🎾 [ELO 데이터 - 모든 경로]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // stats.publicStats.singles.elo (HostedEventCard에서 사용)
  const publicSinglesElo = userData.stats?.publicStats?.singles?.elo;
  console.log(
    '📊 stats.publicStats.singles.elo:',
    publicSinglesElo !== undefined ? publicSinglesElo : '❌ NOT SET'
  );

  // stats.unifiedEloRating (fallback)
  const unifiedElo = userData.stats?.unifiedEloRating;
  console.log('📊 stats.unifiedEloRating:', unifiedElo !== undefined ? unifiedElo : '❌ NOT SET');

  // profile.ltrLevel (온보딩에서 설정)
  const ltrLevel = userData.profile?.ltrLevel;
  console.log('📊 profile.ltrLevel:', ltrLevel !== undefined ? ltrLevel : '❌ NOT SET');

  // profile.skillLevel (또 다른 경로)
  const skillLevel = userData.profile?.skillLevel;
  console.log('📊 profile.skillLevel:', skillLevel !== undefined ? skillLevel : '❌ NOT SET');

  // skillLevel (루트 레벨)
  const rootSkillLevel = userData.skillLevel;
  console.log(
    '📊 skillLevel (root):',
    rootSkillLevel ? JSON.stringify(rootSkillLevel) : '❌ NOT SET'
  );

  console.log('');
  console.log('🔍 [전체 stats 객체]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(JSON.stringify(userData.stats, null, 2));

  // 🔍 eloRatings 컬렉션도 확인
  console.log('');
  console.log('🔍 [eloRatings 컬렉션 확인]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const eloRatingsDoc = await db.collection('eloRatings').doc(userDoc.id).get();
  if (eloRatingsDoc.exists) {
    console.log(JSON.stringify(eloRatingsDoc.data(), null, 2));
  } else {
    console.log('❌ eloRatings 문서가 없습니다.');
  }
}

checkCheolsuElo()
  .then(() => {
    console.log('\n✅ 조회 완료!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
