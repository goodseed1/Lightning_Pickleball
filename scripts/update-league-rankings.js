/**
 * 🎾 리그 순위/스탠딩 이름 업데이트 스크립트
 *
 * standings, playoff, runnerUp, champion 필드의 이름을 업데이트
 *
 * 사용법: node scripts/update-league-rankings.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateLeagueRankings() {
  console.log('🎾 리그 순위/스탠딩 이름 업데이트 시작...\n');

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

  // 2. Lightning Tennis Club의 리그 가져오기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  console.log(`📊 ${leaguesSnap.size}개의 리그 발견\n`);

  let totalStandingsUpdated = 0;
  let totalPlayoffUpdated = 0;
  let totalChampionUpdated = 0;

  // 3. 각 리그 처리
  for (const leagueDoc of leaguesSnap.docs) {
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;
    const updates = {};
    let hasUpdates = false;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 리그: ${leagueData.name || leagueData.title || leagueId}`);
    console.log(`   상태: ${leagueData.status}`);

    // 3a. standings 배열 업데이트
    if (leagueData.standings && Array.isArray(leagueData.standings)) {
      console.log(`   📊 standings 수: ${leagueData.standings.length}`);

      let standingsNeedUpdate = false;
      const updatedStandings = leagueData.standings.map(standing => {
        const updated = { ...standing };

        // 단식
        if (standing.playerId && !standing.playerId.includes('_')) {
          const newName = userMap.get(standing.playerId);
          if (newName && standing.playerName !== newName) {
            console.log(`      ✏️ standings: "${standing.playerName}" → "${newName}"`);
            updated.playerName = newName;
            standingsNeedUpdate = true;
            totalStandingsUpdated++;
          }
        }

        // 복식
        if (standing.player1Id) {
          const newName1 = userMap.get(standing.player1Id);
          if (newName1 && standing.player1Name !== newName1) {
            updated.player1Name = newName1;
            standingsNeedUpdate = true;
            totalStandingsUpdated++;
          }
        }
        if (standing.player2Id) {
          const newName2 = userMap.get(standing.player2Id);
          if (newName2 && standing.player2Name !== newName2) {
            updated.player2Name = newName2;
            standingsNeedUpdate = true;
            totalStandingsUpdated++;
          }
        }

        // 복식 팀 이름
        if (updated.player1Name && updated.player2Name) {
          const teamName = `${updated.player1Name} & ${updated.player2Name}`;
          if (updated.playerName !== teamName) {
            updated.playerName = teamName;
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
      if (playoff.winner) {
        const newName = userMap.get(playoff.winner);
        if (newName && playoff.winnerName !== newName) {
          console.log(`      ✏️ playoff.winnerName: "${playoff.winnerName}" → "${newName}"`);
          playoff.winnerName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      // runnerUpName
      if (playoff.runnerUp) {
        const newName = userMap.get(playoff.runnerUp);
        if (newName && playoff.runnerUpName !== newName) {
          console.log(`      ✏️ playoff.runnerUpName: "${playoff.runnerUpName}" → "${newName}"`);
          playoff.runnerUpName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      // thirdPlaceName
      if (playoff.thirdPlace) {
        const newName = userMap.get(playoff.thirdPlace);
        if (newName && playoff.thirdPlaceName !== newName) {
          console.log(
            `      ✏️ playoff.thirdPlaceName: "${playoff.thirdPlaceName}" → "${newName}"`
          );
          playoff.thirdPlaceName = newName;
          playoffNeedUpdate = true;
          totalPlayoffUpdated++;
        }
      }

      // fourthPlaceName
      if (playoff.fourthPlace) {
        const newName = userMap.get(playoff.fourthPlace);
        if (newName && playoff.fourthPlaceName !== newName) {
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
    if (leagueData.champion && leagueData.champion.playerId) {
      const newName = userMap.get(leagueData.champion.playerId);
      if (newName && leagueData.champion.playerName !== newName) {
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
    if (leagueData.runnerUp && leagueData.runnerUp.playerId) {
      const newName = userMap.get(leagueData.runnerUp.playerId);
      if (newName && leagueData.runnerUp.playerName !== newName) {
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
  console.log(`   📊 standings 이름 업데이트: ${totalStandingsUpdated}개`);
  console.log(`   🏅 playoff 이름 업데이트: ${totalPlayoffUpdated}개`);
  console.log(`   🏆 champion/runnerUp 업데이트: ${totalChampionUpdated}개`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
updateLeagueRankings().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
