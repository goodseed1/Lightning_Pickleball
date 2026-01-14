/**
 * 🎾 ELO/LTR 미설정 사용자들에게 기본값 설정
 * - ELO: 1150
 * - LTR: 3
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DEFAULT_ELO = 1150;
const DEFAULT_LTR = 3;

async function setDefaultElo() {
  console.log('🎾 ELO/LTR 미설정 사용자 검색 및 설정 시작...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const usersWithoutElo = [];
  const usersWithElo = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || data.name || '(이름 없음)';
    const eloRatings = data.eloRatings;

    // eloRatings가 없거나 모든 타입의 current가 없는 경우
    const hasValidElo =
      eloRatings &&
      (eloRatings.singles?.current || eloRatings.doubles?.current || eloRatings.mixed?.current);

    if (!hasValidElo) {
      usersWithoutElo.push({
        id: doc.id,
        name,
        email: data.email || '(이메일 없음)',
        ref: doc.ref,
      });
    } else {
      usersWithElo.push(name);
    }
  });

  console.log(`📊 총 ${snapshot.size}명 중:`);
  console.log(`   ✅ ELO 있음: ${usersWithElo.length}명`);
  console.log(`   ❌ ELO 없음: ${usersWithoutElo.length}명\n`);

  if (usersWithoutElo.length === 0) {
    console.log('✅ 모든 사용자에게 ELO 정보가 있습니다!');
    process.exit(0);
    return;
  }

  console.log('📋 ELO 설정할 사용자 목록:');
  usersWithoutElo.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.name} (${u.email})`);
  });

  console.log(`\n⏳ ELO ${DEFAULT_ELO}, LTR ${DEFAULT_LTR} 설정 중...`);

  const batch = db.batch();
  usersWithoutElo.forEach(user => {
    const eloRatings = {
      singles: {
        current: DEFAULT_ELO,
        elo: DEFAULT_ELO,
        matchCount: 0,
      },
      doubles: {
        current: DEFAULT_ELO,
        elo: DEFAULT_ELO,
        matchCount: 0,
      },
      mixed: {
        current: DEFAULT_ELO,
        elo: DEFAULT_ELO,
        matchCount: 0,
      },
    };

    batch.update(user.ref, {
      eloRatings,
      ltrLevel: DEFAULT_LTR,
      skillLevel: {
        selfAssessed: String(DEFAULT_LTR),
        ltr: DEFAULT_LTR,
        lastUpdated: new Date().toISOString(),
        source: 'default-migration',
      },
    });
  });

  await batch.commit();

  console.log(`\n✅ ${usersWithoutElo.length}명에게 기본 ELO/LTR 설정 완료!`);
  console.log(`   🎯 ELO: ${DEFAULT_ELO}`);
  console.log(`   🎯 LTR: ${DEFAULT_LTR}`);

  process.exit(0);
}

setDefaultElo().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
