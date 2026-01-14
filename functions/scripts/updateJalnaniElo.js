/**
 * 🎯 [KIM FIX] Update 잘난이 ELO to Expert level (1700)
 * Expert (NTRP 5.5) → ELO 1700
 */

const admin = require('firebase-admin');
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-tennis-react/lightning-tennis-simple/service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateJalnaniElo() {
  console.log('🔍 잘난이 사용자 검색 중...\n');

  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const nickname = data.profile?.nickname || data.displayName || data.nickname;
    const email = data.email;

    // 잘난이 찾기 (test11@g.com 또는 닉네임)
    if (nickname === '잘난이' || email === 'test11@g.com') {
      console.log('✅ 잘난이 사용자 발견!');
      console.log('   ID:', doc.id);
      console.log('   Email:', email);
      console.log('   Nickname:', nickname);
      console.log('\n📊 현재 데이터:');
      console.log('   eloRatings:', JSON.stringify(data.eloRatings, null, 2));
      console.log('   stats.publicStats:', JSON.stringify(data.stats?.publicStats, null, 2));
      console.log('   skillLevel:', JSON.stringify(data.skillLevel, null, 2));

      // Expert ELO = 1700
      const expertElo = 1700;

      // 업데이트 데이터
      const updateData = {
        // ELO ratings structure
        eloRatings: {
          singles: {
            current: expertElo,
            peak: expertElo,
            history: data.eloRatings?.singles?.history || [],
          },
          doubles: {
            current: expertElo,
            peak: expertElo,
            history: data.eloRatings?.doubles?.history || [],
          },
          mixed: {
            current: expertElo,
            peak: expertElo,
            history: data.eloRatings?.mixed?.history || [],
          },
        },
        // publicStats for backward compatibility
        'stats.publicStats.singles.elo': expertElo,
        'stats.publicStats.doubles.elo': expertElo,
        'stats.publicStats.mixed_doubles.elo': expertElo,
        // Update skillLevel to expert
        'skillLevel.selfAssessed': 'expert',
        'skillLevel.lastUpdated': new Date().toISOString(),
        'skillLevel.source': 'admin_fix',
      };

      console.log('\n🚀 업데이트 실행 중...');
      await db.collection('users').doc(doc.id).update(updateData);

      console.log('\n✅ 업데이트 완료!');
      console.log('   ELO: 1700 (Expert, NTRP 5.5)');
      console.log('   skillLevel.selfAssessed: expert');

      // 확인
      const updatedDoc = await db.collection('users').doc(doc.id).get();
      const updatedData = updatedDoc.data();
      console.log('\n📊 업데이트 후 데이터:');
      console.log('   eloRatings.singles.current:', updatedData.eloRatings?.singles?.current);
      console.log('   eloRatings.doubles.current:', updatedData.eloRatings?.doubles?.current);
      console.log('   eloRatings.mixed.current:', updatedData.eloRatings?.mixed?.current);
      console.log(
        '   stats.publicStats.singles.elo:',
        updatedData.stats?.publicStats?.singles?.elo
      );
      console.log('   skillLevel.selfAssessed:', updatedData.skillLevel?.selfAssessed);

      break;
    }
  }

  console.log('\n🎯 완료!');
  process.exit(0);
}

updateJalnaniElo();
