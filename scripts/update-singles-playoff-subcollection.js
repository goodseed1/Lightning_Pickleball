/**
 * 🎾 단식 리그 playoff_matches 서브컬렉션 이름 업데이트 스크립트
 *
 * leagues/{leagueId}/playoff_matches 서브컬렉션의 player1Name, player2Name을
 * 실제 displayName으로 업데이트 (단식용 - playerId에 _ 없음)
 *
 * 사용법: node scripts/update-singles-playoff-subcollection.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateSinglesPlayoffSubcollection() {
  console.log('🎾 단식 리그 playoff_matches 서브컬렉션 이름 업데이트 시작...\n');

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

  // 2. Lightning Tennis Club의 단식 리그 가져오기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  // 단식 리그만 필터링 (doubles가 아닌 것)
  const singlesLeagues = leaguesSnap.docs.filter(doc => {
    const data = doc.data();
    return !data.eventType || !data.eventType.includes('doubles');
  });

  console.log(`📊 ${singlesLeagues.length}개의 단식 리그 발견\n`);

  let totalPlayoffMatchesUpdated = 0;

  // 3. 각 단식 리그 처리
  for (const leagueDoc of singlesLeagues) {
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 리그: ${leagueData.name || leagueData.title || leagueId}`);
    console.log(`   상태: ${leagueData.status}`);
    console.log(`   타입: ${leagueData.eventType || 'singles'}`);

    // playoff_matches 서브컬렉션 가져오기
    const playoffMatchesSnap = await db
      .collection('leagues')
      .doc(leagueId)
      .collection('playoff_matches')
      .get();

    if (playoffMatchesSnap.empty) {
      console.log(`   ⏭️ playoff_matches 없음`);
      continue;
    }

    console.log(`   🏅 playoff_matches 수: ${playoffMatchesSnap.size}`);

    for (const matchDoc of playoffMatchesSnap.docs) {
      const matchData = matchDoc.data();
      const updates = {};
      let needsUpdate = false;

      // player1Id, player1Name 확인 (단식: playerId에 _ 없음)
      if (matchData.player1Id && !matchData.player1Id.includes('_')) {
        const newName = userMap.get(matchData.player1Id);
        if (newName && newName !== matchData.player1Name) {
          console.log(`      ✏️ player1Name: "${matchData.player1Name}" → "${newName}"`);
          updates.player1Name = newName;
          needsUpdate = true;
        }
      }

      // player2Id, player2Name 확인 (단식: playerId에 _ 없음)
      if (matchData.player2Id && !matchData.player2Id.includes('_')) {
        const newName = userMap.get(matchData.player2Id);
        if (newName && newName !== matchData.player2Name) {
          console.log(`      ✏️ player2Name: "${matchData.player2Name}" → "${newName}"`);
          updates.player2Name = newName;
          needsUpdate = true;
        }
      }

      // 업데이트 실행
      if (needsUpdate) {
        await db
          .collection('leagues')
          .doc(leagueId)
          .collection('playoff_matches')
          .doc(matchDoc.id)
          .update(updates);
        totalPlayoffMatchesUpdated++;
        console.log(`      ✅ Playoff Match ${matchDoc.id} (${matchData.type}) 업데이트 완료`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료!`);
  console.log(`   🏅 총 playoff_matches 업데이트: ${totalPlayoffMatchesUpdated}개`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
updateSinglesPlayoffSubcollection().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
