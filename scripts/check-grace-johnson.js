/**
 * Grace Johnson 데이터 확인 스크립트
 * Rankings ELO vs Match Statistics ELO 불일치 조사
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUser() {
  console.log('🔍 Grace Johnson (test8@g.com) 데이터 조회 중...\n');

  // Find user by email
  const usersSnapshot = await db.collection('users').where('email', '==', 'test8@g.com').get();

  if (usersSnapshot.empty) {
    console.log('❌ User not found by email test8@g.com');
    process.exit(1);
  }

  usersSnapshot.forEach(doc => {
    console.log('='.repeat(60));
    console.log('User ID:', doc.id);
    console.log('='.repeat(60));
    const data = doc.data();

    console.log('\n📊 eloRatings (Rankings 섹션에서 사용):');
    console.log(JSON.stringify(data.eloRatings, null, 2));

    console.log('\n📊 stats:');
    console.log(JSON.stringify(data.stats, null, 2));

    console.log('\n📊 profile:');
    console.log(JSON.stringify(data.profile, null, 2));

    console.log('\n📊 displayName:', data.displayName);
    console.log('📊 gender:', data.gender || data.profile?.gender);

    // 평균 ELO 계산 (Rankings 로직)
    const singlesElo = data.eloRatings?.singles?.current || 1200;
    const doublesElo = data.eloRatings?.doubles?.current || 1200;
    const mixedElo = data.eloRatings?.mixed?.current || 1200;
    const avgElo = Math.round((singlesElo + doublesElo + mixedElo) / 3);

    console.log('\n' + '='.repeat(60));
    console.log('📊 ELO 분석:');
    console.log('='.repeat(60));
    console.log('  Singles ELO (eloRatings.singles.current):', singlesElo);
    console.log('  Doubles ELO (eloRatings.doubles.current):', doublesElo);
    console.log('  Mixed ELO (eloRatings.mixed.current):', mixedElo);
    console.log('  평균 ELO (Rankings에서 사용):', avgElo);

    console.log('\n' + '='.repeat(60));
    console.log('🔍 스크린샷과 비교:');
    console.log('='.repeat(60));
    console.log('  Rankings 섹션: ELO 1200 (LTR 4)');
    console.log('  Match Statistics:');
    console.log('    - Singles: ELO 1189 (LTR 3)');
    console.log('    - Doubles: ELO 1045 (LTR 2)');
    console.log('    - Mixed: ELO 1200 (LTR 4)');

    console.log('\n' + '='.repeat(60));
    console.log('📋 결론:');
    console.log('='.repeat(60));

    if (avgElo === 1200 && singlesElo !== 1200) {
      console.log('⚠️ Rankings는 fallback 1200을 사용하고 있음!');
      console.log('   실제 평균 ELO:', Math.round((singlesElo + doublesElo + mixedElo) / 3));
    } else {
      console.log('평균 ELO 계산값:', avgElo);
    }
  });

  process.exit(0);
}

checkUser().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
