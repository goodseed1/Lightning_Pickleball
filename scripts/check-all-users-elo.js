/**
 * 🔍 전체 사용자 ELO/LTR 상태 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAllUsersElo() {
  console.log('🔍 전체 사용자 ELO/LTR 상태 확인...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  console.log(`📊 총 ${snapshot.size}명의 사용자\n`);
  console.log('='.repeat(80));

  snapshot.forEach(doc => {
    const data = doc.data();
    const name = data.displayName || data.name || '(이름 없음)';
    const email = data.email || '(이메일 없음)';

    console.log(`\n👤 ${name} (${email})`);
    console.log(`   ID: ${doc.id}`);

    // eloRatings 확인
    if (data.eloRatings) {
      console.log(`   📊 eloRatings:`);
      console.log(`      singles: ${JSON.stringify(data.eloRatings.singles || 'N/A')}`);
      console.log(`      doubles: ${JSON.stringify(data.eloRatings.doubles || 'N/A')}`);
      console.log(`      mixed: ${JSON.stringify(data.eloRatings.mixed || 'N/A')}`);
    } else {
      console.log(`   📊 eloRatings: ❌ 없음`);
    }

    // ltrLevel 확인
    console.log(`   🎯 ltrLevel: ${data.ltrLevel !== undefined ? data.ltrLevel : '❌ 없음'}`);

    // skillLevel 확인
    if (data.skillLevel) {
      console.log(
        `   🏆 skillLevel: ltr=${data.skillLevel.ltr}, selfAssessed=${data.skillLevel.selfAssessed}`
      );
    } else {
      console.log(`   🏆 skillLevel: ❌ 없음`);
    }

    // publicStats 확인
    if (data.publicStats) {
      const ps = data.publicStats;
      console.log(`   📈 publicStats:`);
      if (ps.singles) {
        console.log(
          `      singles: ${ps.singles.matchesPlayed || 0}경기, ELO=${ps.singles.elo || 'N/A'}`
        );
      }
      if (ps.doubles) {
        console.log(
          `      doubles: ${ps.doubles.matchesPlayed || 0}경기, ELO=${ps.doubles.elo || 'N/A'}`
        );
      }
      if (ps.mixed) {
        console.log(
          `      mixed: ${ps.mixed.matchesPlayed || 0}경기, ELO=${ps.mixed.elo || 'N/A'}`
        );
      }
    } else {
      console.log(`   📈 publicStats: ❌ 없음`);
    }
  });

  process.exit(0);
}

checkAllUsersElo().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
