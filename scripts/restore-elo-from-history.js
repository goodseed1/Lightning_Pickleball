/**
 * 🔄 ELO 복구 스크립트 v2
 *
 * public_elo_history에서 각 사용자의 최신 ELO를 가져와서
 * users.eloRatings에 복구합니다.
 *
 * 🔧 Fix: eloRatings.{type}.current 필드명 사용 (앱에서 참조하는 필드)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ELO → LPR 변환 함수
function convertEloToLtr(elo) {
  if (elo >= 1800) return 10;
  if (elo >= 1700) return 9;
  if (elo >= 1600) return 8;
  if (elo >= 1500) return 7;
  if (elo >= 1400) return 6;
  if (elo >= 1300) return 5;
  if (elo >= 1200) return 4;
  if (elo >= 1100) return 3;
  if (elo >= 1000) return 2;
  return 1;
}

async function restoreEloFromHistory() {
  console.log('🔄 ELO 복구 v2 시작...\n');

  // 1. public_elo_history에서 모든 기록 가져오기
  const historySnapshot = await db.collection('public_elo_history').get();
  console.log(`📊 public_elo_history: ${historySnapshot.size}개 기록\n`);

  // 2. 사용자별 최신 ELO 계산 (matchType별로)
  const userEloMap = new Map();

  historySnapshot.forEach(doc => {
    const data = doc.data();
    const userId = data.userId;
    const matchType = data.matchType;
    const newElo = data.newElo;
    const timestamp = data.timestamp?._seconds || 0;
    const result = data.result; // 'win' or 'loss'

    if (!userId || !matchType || newElo === undefined) return;

    // matchType 정규화
    let normalizedType = matchType;
    if (matchType === 'mixed_doubles') normalizedType = 'mixed';

    if (!userEloMap.has(userId)) {
      userEloMap.set(userId, {
        singles: { elo: null, matchCount: 0, wins: 0, losses: 0, timestamp: 0 },
        doubles: { elo: null, matchCount: 0, wins: 0, losses: 0, timestamp: 0 },
        mixed: { elo: null, matchCount: 0, wins: 0, losses: 0, timestamp: 0 },
      });
    }

    const userElo = userEloMap.get(userId);
    const typeData = userElo[normalizedType];

    if (typeData) {
      typeData.matchCount++;
      if (result === 'win') typeData.wins++;
      if (result === 'loss') typeData.losses++;

      // 최신 ELO로 업데이트
      if (timestamp >= typeData.timestamp) {
        typeData.elo = newElo;
        typeData.timestamp = timestamp;
      }
    }
  });

  console.log(`📊 ELO 기록이 있는 사용자: ${userEloMap.size}명\n`);

  // 3. users 컬렉션 업데이트
  const batch = db.batch();
  let updateCount = 0;

  for (const [userId, eloData] of userEloMap) {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`⚠️ 사용자 문서 없음: ${userId}`);
      continue;
    }

    const userData = userDoc.data();
    const userName = userData.displayName || userData.name || '(이름 없음)';

    // 🔧 eloRatings 구성 - 'current' 필드 사용!
    const eloRatings = {
      singles: {
        current: eloData.singles.elo || 1200, // 🔧 'current' 필드!
        elo: eloData.singles.elo || 1200, // 호환성
        matchCount: eloData.singles.matchCount,
      },
      doubles: {
        current: eloData.doubles.elo || 1200, // 🔧 'current' 필드!
        elo: eloData.doubles.elo || 1200, // 호환성
        matchCount: eloData.doubles.matchCount,
      },
      mixed: {
        current: eloData.mixed.elo || 1200, // 🔧 'current' 필드!
        elo: eloData.mixed.elo || 1200, // 호환성
        matchCount: eloData.mixed.matchCount,
      },
    };

    // 🆕 publicStats 구성 (앱에서 참조할 수 있음)
    const publicStats = {
      singles: {
        elo: eloData.singles.elo || 1200,
        matchesPlayed: eloData.singles.matchCount,
        wins: eloData.singles.wins,
        losses: eloData.singles.losses,
        winRate:
          eloData.singles.matchCount > 0
            ? Math.round((eloData.singles.wins / eloData.singles.matchCount) * 100)
            : 0,
      },
      doubles: {
        elo: eloData.doubles.elo || 1200,
        matchesPlayed: eloData.doubles.matchCount,
        wins: eloData.doubles.wins,
        losses: eloData.doubles.losses,
        winRate:
          eloData.doubles.matchCount > 0
            ? Math.round((eloData.doubles.wins / eloData.doubles.matchCount) * 100)
            : 0,
      },
      mixed: {
        elo: eloData.mixed.elo || 1200,
        matchesPlayed: eloData.mixed.matchCount,
        wins: eloData.mixed.wins,
        losses: eloData.mixed.losses,
        winRate:
          eloData.mixed.matchCount > 0
            ? Math.round((eloData.mixed.wins / eloData.mixed.matchCount) * 100)
            : 0,
      },
    };

    // 대표 ELO 계산 (가장 많이 플레이한 타입의 ELO)
    let representativeElo = 1200;
    let maxMatches = 0;
    for (const type of ['singles', 'doubles', 'mixed']) {
      if (eloData[type].matchCount > maxMatches && eloData[type].elo) {
        maxMatches = eloData[type].matchCount;
        representativeElo = eloData[type].elo;
      }
    }

    const ltrLevel = convertEloToLtr(representativeElo);

    console.log(`✅ ${userName}`);
    console.log(
      `   singles: ELO ${eloRatings.singles.current} (${eloRatings.singles.matchCount}경기, ${eloData.singles.wins}W-${eloData.singles.losses}L)`
    );
    console.log(
      `   doubles: ELO ${eloRatings.doubles.current} (${eloRatings.doubles.matchCount}경기, ${eloData.doubles.wins}W-${eloData.doubles.losses}L)`
    );
    console.log(
      `   mixed: ELO ${eloRatings.mixed.current} (${eloRatings.mixed.matchCount}경기, ${eloData.mixed.wins}W-${eloData.mixed.losses}L)`
    );
    console.log(`   → LPR ${ltrLevel}`);

    batch.update(userRef, {
      eloRatings,
      publicStats, // 🆕 publicStats도 함께 복구
      ltrLevel,
      skillLevel: {
        selfAssessed: String(ltrLevel),
        ltr: ltrLevel,
        lastUpdated: new Date().toISOString(),
        source: 'elo-history-restore-v2',
      },
    });

    updateCount++;
  }

  if (updateCount > 0) {
    console.log(`\n⏳ ${updateCount}명의 ELO 복구 중...`);
    await batch.commit();
    console.log(`✅ 복구 완료!\n`);
  } else {
    console.log('\n✅ 복구할 사용자가 없습니다.\n');
  }

  process.exit(0);
}

restoreEloFromHistory().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
