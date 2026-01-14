/**
 * 🎾 복식 리그 팀 이름 업데이트 스크립트
 *
 * 복식 리그의 standings, playoff, champion, runnerUp의 팀 이름을 업데이트
 * playerId가 "ID1_ID2" 형식이므로 분리해서 각 선수의 displayName을 찾아 조합
 *
 * 사용법: node scripts/update-doubles-league-names.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * 복식 팀 ID에서 두 선수의 이름을 조합하여 팀 이름 생성
 * @param {string} teamId - "ID1_ID2" 형식의 팀 ID
 * @param {Map} userMap - 사용자 ID -> displayName 맵
 * @param {string} currentName - 현재 팀 이름 (변경 없으면 반환)
 * @returns {string} 새로운 팀 이름 또는 현재 이름
 */
function resolveDoublesTeamName(teamId, userMap, currentName) {
  if (!teamId || !teamId.includes('_')) {
    return currentName;
  }

  const [id1, id2] = teamId.split('_');
  const name1 = userMap.get(id1);
  const name2 = userMap.get(id2);

  if (name1 && name2) {
    return `${name1} & ${name2}`;
  } else if (name1) {
    // 첫 번째 선수만 찾음
    const currentNames = currentName ? currentName.split(' & ') : ['Unknown', 'Unknown'];
    return `${name1} & ${currentNames[1] || 'Unknown'}`;
  } else if (name2) {
    // 두 번째 선수만 찾음
    const currentNames = currentName ? currentName.split(' & ') : ['Unknown', 'Unknown'];
    return `${currentNames[0] || 'Unknown'} & ${name2}`;
  }

  return currentName;
}

async function updateDoublesLeagueNames() {
  console.log('🎾 복식 리그 팀 이름 업데이트 시작...\n');

  // 1. 모든 사용자의 displayName 가져오기
  console.log('📋 users 컬렉션에서 displayName 로드 중...');
  const usersSnap = await db.collection('users').get();
  const userMap = new Map();

  usersSnap.docs.forEach(doc => {
    const user = doc.data();
    if (user.displayName) {
      userMap.set(doc.id, user.displayName);
    }
  });
  console.log(`   ✅ ${userMap.size}명의 사용자 displayName 로드 완료\n`);

  // 2. Lightning Pickleball Club의 복식 리그 가져오기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  // 복식 리그만 필터링
  const doublesLeagues = leaguesSnap.docs.filter(doc => {
    const data = doc.data();
    return data.eventType && data.eventType.includes('doubles');
  });

  console.log(`📊 ${doublesLeagues.length}개의 복식 리그 발견\n`);

  let totalStandingsUpdated = 0;
  let totalPlayoffUpdated = 0;
  let totalChampionUpdated = 0;

  // 3. 각 복식 리그 처리
  for (const leagueDoc of doublesLeagues) {
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;
    const updates = {};
    let hasUpdates = false;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 리그: ${leagueData.name || leagueData.title || leagueId}`);
    console.log(`   상태: ${leagueData.status}`);
    console.log(`   타입: ${leagueData.eventType}`);

    // 3a. standings 배열 업데이트
    if (leagueData.standings && Array.isArray(leagueData.standings)) {
      console.log(`   📊 standings 수: ${leagueData.standings.length}`);

      let standingsNeedUpdate = false;
      const updatedStandings = leagueData.standings.map(standing => {
        const updated = { ...standing };

        // 복식 팀 ID로 이름 해결
        if (standing.playerId && standing.playerId.includes('_')) {
          const newName = resolveDoublesTeamName(standing.playerId, userMap, standing.playerName);
          if (newName !== standing.playerName) {
            console.log(`      ✏️ standings: "${standing.playerName}" → "${newName}"`);
            updated.playerName = newName;
            standingsNeedUpdate = true;
            totalStandingsUpdated++;
          }
        }

        return updated;
      });

      if (standingsNeedUpdate) {
        updates.standings = updatedStandings;
        hasUpdates = true;
        console.log(`   ✅ standings 업데이트 예정`);
      }
    }

    // 3b. playoff 객체 업데이트
    if (leagueData.playoff) {
      const playoff = { ...leagueData.playoff };
      let playoffNeedUpdate = false;

      // winnerName
      if (playoff.winner && playoff.winner.includes('_')) {
        const newName = resolveDoublesTeamName(playoff.winner, userMap, playoff.winnerName);
        if (newName !== playoff.winnerName) {
          console.log(`      ✏️ playoff.winnerName: "${playoff.winnerName}" → "${newName}"`);
          playoff.winnerName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      // runnerUpName
      if (playoff.runnerUp && playoff.runnerUp.includes('_')) {
        const newName = resolveDoublesTeamName(playoff.runnerUp, userMap, playoff.runnerUpName);
        if (newName !== playoff.runnerUpName) {
          console.log(`      ✏️ playoff.runnerUpName: "${playoff.runnerUpName}" → "${newName}"`);
          playoff.runnerUpName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      // thirdPlaceName
      if (playoff.thirdPlace && playoff.thirdPlace.includes('_')) {
        const newName = resolveDoublesTeamName(playoff.thirdPlace, userMap, playoff.thirdPlaceName);
        if (newName !== playoff.thirdPlaceName) {
          console.log(
            `      ✏️ playoff.thirdPlaceName: "${playoff.thirdPlaceName}" → "${newName}"`
          );
          playoff.thirdPlaceName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      // fourthPlaceName
      if (playoff.fourthPlace && playoff.fourthPlace.includes('_')) {
        const newName = resolveDoublesTeamName(
          playoff.fourthPlace,
          userMap,
          playoff.fourthPlaceName
        );
        if (newName !== playoff.fourthPlaceName) {
          console.log(
            `      ✏️ playoff.fourthPlaceName: "${playoff.fourthPlaceName}" → "${newName}"`
          );
          playoff.fourthPlaceName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      if (playoffNeedUpdate) {
        updates.playoff = playoff;
        hasUpdates = true;
        console.log(`   ✅ playoff 업데이트 예정`);
      }
    }

    // 3c. champion 객체 업데이트
    if (
      leagueData.champion &&
      leagueData.champion.playerId &&
      leagueData.champion.playerId.includes('_')
    ) {
      const newName = resolveDoublesTeamName(
        leagueData.champion.playerId,
        userMap,
        leagueData.champion.playerName
      );
      if (newName !== leagueData.champion.playerName) {
        console.log(`      ✏️ champion: "${leagueData.champion.playerName}" → "${newName}"`);
        updates.champion = {
          ...leagueData.champion,
          playerName: newName,
        };
        hasUpdates = true;
        totalChampionUpdated++;
      }
    }

    // 3d. runnerUp 객체 업데이트
    if (
      leagueData.runnerUp &&
      leagueData.runnerUp.playerId &&
      leagueData.runnerUp.playerId.includes('_')
    ) {
      const newName = resolveDoublesTeamName(
        leagueData.runnerUp.playerId,
        userMap,
        leagueData.runnerUp.playerName
      );
      if (newName !== leagueData.runnerUp.playerName) {
        console.log(`      ✏️ runnerUp: "${leagueData.runnerUp.playerName}" → "${newName}"`);
        updates.runnerUp = {
          ...leagueData.runnerUp,
          playerName: newName,
        };
        hasUpdates = true;
        totalChampionUpdated++;
      }
    }

    // 업데이트 실행
    if (hasUpdates) {
      await db.collection('leagues').doc(leagueId).update(updates);
      console.log(`   🎯 리그 업데이트 완료 (${Object.keys(updates).length} 필드)`);
    } else {
      console.log(`   ⏭️ 업데이트 불필요`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료!`);
  console.log(`   📊 standings 팀 이름 업데이트: ${totalStandingsUpdated}개`);
  console.log(`   🏅 playoff 팀 이름 업데이트: ${totalPlayoffUpdated}개`);
  console.log(`   🏆 champion/runnerUp 업데이트: ${totalChampionUpdated}개`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
updateDoublesLeagueNames().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
