/**
 * 🎾 리그 참가자 이름 업데이트 스크립트
 *
 * leagues.participants 배열의 이름을 users 컬렉션의 실제 displayName으로 업데이트
 * + matches 서브컬렉션의 선수 이름도 함께 업데이트
 * + playoffRankings 배열 업데이트
 *
 * 사용법: node scripts/update-league-participants.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateLeagueParticipants() {
  console.log('🎾 리그 참가자 이름 업데이트 시작...\n');

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

  // 2. Lightning Pickleball Club의 리그 가져오기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  console.log(`📊 ${leaguesSnap.size}개의 리그 발견\n`);

  let totalParticipantsUpdated = 0;
  let totalMatchesUpdated = 0;
  let totalPlayoffRankingsUpdated = 0;

  // 3. 각 리그 처리
  for (const leagueDoc of leaguesSnap.docs) {
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 리그: ${leagueData.title || leagueId}`);
    console.log(`   상태: ${leagueData.status}`);

    // 3a. participants 배열 업데이트
    if (leagueData.participants && Array.isArray(leagueData.participants)) {
      console.log(`   📋 참가자 수: ${leagueData.participants.length}`);

      let participantsNeedUpdate = false;
      const updatedParticipants = leagueData.participants.map(participant => {
        const updated = { ...participant };
        let hasChanges = false;

        // 단식: playerId, playerName
        if (participant.playerId && !participant.playerId.includes('_')) {
          const newName = userMap.get(participant.playerId);
          if (newName && participant.playerName !== newName) {
            console.log(`      ✏️ "${participant.playerName}" → "${newName}"`);
            updated.playerName = newName;
            hasChanges = true;
            totalParticipantsUpdated++;
          }
        }

        // 복식: player1Id, player1Name, player2Id, player2Name
        if (participant.player1Id) {
          const newName1 = userMap.get(participant.player1Id);
          if (newName1 && participant.player1Name !== newName1) {
            console.log(`      ✏️ player1: "${participant.player1Name}" → "${newName1}"`);
            updated.player1Name = newName1;
            hasChanges = true;
            totalParticipantsUpdated++;
          }
        }

        if (participant.player2Id) {
          const newName2 = userMap.get(participant.player2Id);
          if (newName2 && participant.player2Name !== newName2) {
            console.log(`      ✏️ player2: "${participant.player2Name}" → "${newName2}"`);
            updated.player2Name = newName2;
            hasChanges = true;
            totalParticipantsUpdated++;
          }
        }

        // 복식 팀 이름 업데이트 (playerName = "player1Name & player2Name")
        if (hasChanges && updated.player1Name && updated.player2Name) {
          const newTeamName = `${updated.player1Name} & ${updated.player2Name}`;
          if (updated.playerName !== newTeamName) {
            console.log(`      ✏️ team: "${updated.playerName}" → "${newTeamName}"`);
            updated.playerName = newTeamName;
          }
        }

        if (hasChanges) {
          participantsNeedUpdate = true;
        }

        return updated;
      });

      if (participantsNeedUpdate) {
        await db.collection('leagues').doc(leagueId).update({
          participants: updatedParticipants,
        });
        console.log(`   ✅ participants 배열 업데이트 완료`);
      } else {
        console.log(`   ⏭️ participants 업데이트 불필요`);
      }
    }

    // 3b. playoffRankings 배열 업데이트
    if (leagueData.playoffRankings && Array.isArray(leagueData.playoffRankings)) {
      console.log(`   🏅 playoffRankings 수: ${leagueData.playoffRankings.length}`);

      let playoffNeedUpdate = false;
      const updatedPlayoffRankings = leagueData.playoffRankings.map(ranking => {
        const updated = { ...ranking };
        let hasChanges = false;

        // 단식
        if (ranking.playerId && !ranking.playerId.includes('_')) {
          const newName = userMap.get(ranking.playerId);
          if (newName && ranking.playerName !== newName) {
            console.log(`      ✏️ playoff: "${ranking.playerName}" → "${newName}"`);
            updated.playerName = newName;
            hasChanges = true;
            totalPlayoffRankingsUpdated++;
          }
        }

        // 복식
        if (ranking.player1Id) {
          const newName1 = userMap.get(ranking.player1Id);
          if (newName1 && ranking.player1Name !== newName1) {
            updated.player1Name = newName1;
            hasChanges = true;
            totalPlayoffRankingsUpdated++;
          }
        }

        if (ranking.player2Id) {
          const newName2 = userMap.get(ranking.player2Id);
          if (newName2 && ranking.player2Name !== newName2) {
            updated.player2Name = newName2;
            hasChanges = true;
            totalPlayoffRankingsUpdated++;
          }
        }

        // 복식 팀 이름 업데이트
        if (hasChanges && updated.player1Name && updated.player2Name) {
          updated.playerName = `${updated.player1Name} & ${updated.player2Name}`;
        }

        if (hasChanges) {
          playoffNeedUpdate = true;
        }

        return updated;
      });

      if (playoffNeedUpdate) {
        await db.collection('leagues').doc(leagueId).update({
          playoffRankings: updatedPlayoffRankings,
        });
        console.log(`   ✅ playoffRankings 배열 업데이트 완료`);
      } else {
        console.log(`   ⏭️ playoffRankings 업데이트 불필요`);
      }
    }

    // 3c. matches subcollection 업데이트
    const matchesSnap = await db.collection('leagues').doc(leagueId).collection('matches').get();

    if (!matchesSnap.empty) {
      console.log(`   🏸 매치 수: ${matchesSnap.size}`);

      for (const matchDoc of matchesSnap.docs) {
        const matchData = matchDoc.data();
        const updates = {};
        let needsUpdate = false;

        // 단식 필드
        const singlesFields = [
          { idField: 'player1Id', nameField: 'player1Name' },
          { idField: 'player2Id', nameField: 'player2Name' },
        ];

        for (const { idField, nameField } of singlesFields) {
          if (matchData[idField] && !matchData[idField].includes('_')) {
            const newName = userMap.get(matchData[idField]);
            if (newName && newName !== matchData[nameField]) {
              updates[nameField] = newName;
              needsUpdate = true;
            }
          }
        }

        // 복식 팀 필드
        const doublesFields = [
          { idField: 'team1Player1Id', nameField: 'team1Player1Name' },
          { idField: 'team1Player2Id', nameField: 'team1Player2Name' },
          { idField: 'team2Player1Id', nameField: 'team2Player1Name' },
          { idField: 'team2Player2Id', nameField: 'team2Player2Name' },
        ];

        for (const { idField, nameField } of doublesFields) {
          if (matchData[idField]) {
            const newName = userMap.get(matchData[idField]);
            if (newName && newName !== matchData[nameField]) {
              updates[nameField] = newName;
              needsUpdate = true;
            }
          }
        }

        // 복식 팀 이름 업데이트
        if (updates.team1Player1Name || updates.team1Player2Name) {
          const p1 = updates.team1Player1Name || matchData.team1Player1Name;
          const p2 = updates.team1Player2Name || matchData.team1Player2Name;
          if (p1 && p2) {
            updates.team1Name = `${p1} & ${p2}`;
            updates.player1Name = `${p1} & ${p2}`;
          }
        }

        if (updates.team2Player1Name || updates.team2Player2Name) {
          const p1 = updates.team2Player1Name || matchData.team2Player1Name;
          const p2 = updates.team2Player2Name || matchData.team2Player2Name;
          if (p1 && p2) {
            updates.team2Name = `${p1} & ${p2}`;
            updates.player2Name = `${p1} & ${p2}`;
          }
        }

        // 업데이트 실행
        if (needsUpdate) {
          await db
            .collection('leagues')
            .doc(leagueId)
            .collection('matches')
            .doc(matchDoc.id)
            .update(updates);

          totalMatchesUpdated++;
          console.log(
            `      ✏️ Match ${matchDoc.id} 업데이트 (${Object.keys(updates).length} fields)`
          );
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료!`);
  console.log(`   📋 참가자 이름 업데이트: ${totalParticipantsUpdated}개`);
  console.log(`   🏅 플레이오프 순위 업데이트: ${totalPlayoffRankingsUpdated}개`);
  console.log(`   🏸 매치 업데이트: ${totalMatchesUpdated}개`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
updateLeagueParticipants().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
