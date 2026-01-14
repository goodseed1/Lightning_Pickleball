/**
 * 🎾 토너먼트 참가자 이름 업데이트 스크립트
 *
 * tournaments.participants 배열의 이름을 users 컬렉션의 실제 displayName으로 업데이트
 * + matches 서브컬렉션의 선수 이름도 함께 업데이트
 *
 * 사용법: node scripts/update-tournament-participants.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateTournamentParticipants() {
  console.log('🎾 토너먼트 참가자 이름 업데이트 시작...\n');

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

  // 2. Lightning Pickleball Club의 토너먼트 가져오기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const tournamentsSnap = await db.collection('tournaments').where('clubId', '==', clubId).get();

  console.log(`📊 ${tournamentsSnap.size}개의 토너먼트 발견\n`);

  let totalParticipantsUpdated = 0;
  let totalMatchesUpdated = 0;

  // 3. 각 토너먼트 처리
  for (const tournamentDoc of tournamentsSnap.docs) {
    const tournamentData = tournamentDoc.data();
    const tournamentId = tournamentDoc.id;

    console.log(`\n🏆 토너먼트: ${tournamentData.title || tournamentId}`);
    console.log(`   상태: ${tournamentData.status}`);

    // 3a. participants 배열 업데이트
    if (tournamentData.participants && Array.isArray(tournamentData.participants)) {
      console.log(`   📋 참가자 수: ${tournamentData.participants.length}`);

      let participantsNeedUpdate = false;
      const updatedParticipants = tournamentData.participants.map(participant => {
        // playerId 필드 사용 (userId 아님!)
        if (participant.playerId && userMap.has(participant.playerId)) {
          const newName = userMap.get(participant.playerId);
          // playerName 필드 사용 (name 아님!)
          if (participant.playerName !== newName) {
            console.log(`      ✏️ "${participant.playerName}" → "${newName}"`);
            participantsNeedUpdate = true;
            totalParticipantsUpdated++;
            return { ...participant, playerName: newName };
          }
        }
        return participant;
      });

      if (participantsNeedUpdate) {
        await db.collection('tournaments').doc(tournamentId).update({
          participants: updatedParticipants,
        });
        console.log(`   ✅ participants 배열 업데이트 완료`);
      } else {
        console.log(`   ⏭️ participants 업데이트 불필요`);
      }
    }

    // 3b. matches subcollection 업데이트
    const matchesSnap = await db
      .collection('tournaments')
      .doc(tournamentId)
      .collection('matches')
      .get();

    if (!matchesSnap.empty) {
      console.log(`   📋 매치 수: ${matchesSnap.size}`);

      for (const matchDoc of matchesSnap.docs) {
        const matchData = matchDoc.data();
        const updates = {};
        let needsUpdate = false;

        // player1 이름 업데이트
        if (matchData.player1 && matchData.player1.playerId) {
          const newName = resolvePlayerName(
            matchData.player1.playerId,
            userMap,
            matchData.player1.playerName
          );
          if (newName !== matchData.player1.playerName) {
            updates['player1.playerName'] = newName;
            needsUpdate = true;
          }
        }

        // player2 이름 업데이트
        if (matchData.player2 && matchData.player2.playerId) {
          const newName = resolvePlayerName(
            matchData.player2.playerId,
            userMap,
            matchData.player2.playerName
          );
          if (newName !== matchData.player2.playerName) {
            updates['player2.playerName'] = newName;
            needsUpdate = true;
          }
        }

        // winner 이름 업데이트
        if (matchData.winner && matchData.winner.playerId) {
          const newName = resolvePlayerName(
            matchData.winner.playerId,
            userMap,
            matchData.winner.playerName
          );
          if (newName !== matchData.winner.playerName) {
            updates['winner.playerName'] = newName;
            needsUpdate = true;
          }
        }

        // 업데이트 실행
        if (needsUpdate) {
          await db
            .collection('tournaments')
            .doc(tournamentId)
            .collection('matches')
            .doc(matchDoc.id)
            .update(updates);

          totalMatchesUpdated++;

          // 변경 내역 로깅
          console.log(`      ✏️ Match ${matchDoc.id} 업데이트`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 완료!`);
  console.log(`   📋 참가자 이름 업데이트: ${totalParticipantsUpdated}명`);
  console.log(`   🏸 매치 업데이트: ${totalMatchesUpdated}개`);
  console.log('='.repeat(50));

  process.exit(0);
}

/**
 * 플레이어 ID로 실제 이름 찾기
 * 복식의 경우 "ID1_ID2" 형식이므로 분리하여 처리
 */
function resolvePlayerName(playerId, userMap, currentName) {
  if (!playerId) return currentName;

  // 복식 매치 확인 (ID가 "_"로 연결된 경우)
  if (playerId.includes('_')) {
    const ids = playerId.split('_');
    const names = ids.map(id => userMap.get(id) || null);

    // 둘 다 실제 이름이 있는 경우
    if (names[0] && names[1]) {
      return `${names[0]} / ${names[1]}`;
    }
    // 하나만 있는 경우 (부분 업데이트)
    if (names[0] || names[1]) {
      const currentNames = currentName ? currentName.split(' / ') : ['Unknown', 'Unknown'];
      return `${names[0] || currentNames[0]} / ${names[1] || currentNames[1] || 'Unknown'}`;
    }
  } else {
    // 단식 매치
    const name = userMap.get(playerId);
    if (name) {
      return name;
    }
  }

  return currentName;
}

// 스크립트 실행
updateTournamentParticipants().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
