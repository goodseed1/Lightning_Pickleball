/**
 * Collection Investigation Script
 * 작전명: "실종자 수색" - Firebase의 실제 컬렉션 구조 파악
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../service-account-key.json');

// Firebase Admin 초기화 (서비스 계정 키 사용)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔑 [Auth] 서비스 계정 키로 Firebase Admin 인증 성공!');
}

const db = admin.firestore();

async function investigateCollections() {
  try {
    console.log('🔍 [Investigation] Firebase 컬렉션 구조 조사 시작...');
    console.log('📋 [Project] lightning-pickleball-community');

    // 1. 알려진 컬렉션들 확인
    const knownCollections = [
      'users',
      'pickleball_clubs',
      'leagues',
      'tournaments',
      'leagues',
      'club_events',
      'community_groups',
      'player_stats',
      'achievements',
      'applications',
      'notifications',
    ];

    console.log('\n🎯 [Step 1] 알려진 컬렉션들 존재 여부 확인:');

    for (const collectionName of knownCollections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        const exists = !snapshot.empty;
        const docCount = exists ? 'unknown (limited query)' : 0;

        console.log(
          `  ${exists ? '✅' : '❌'} ${collectionName}: ${exists ? 'EXISTS' : 'NOT FOUND'} (${docCount} docs)`
        );

        if (exists && snapshot.docs.length > 0) {
          const firstDoc = snapshot.docs[0];
          const data = firstDoc.data();

          // 특별히 리그/토너먼트 관련 정보 확인
          if (collectionName.includes('league') || collectionName.includes('tournament')) {
            console.log(`    📊 Sample data keys: ${Object.keys(data).join(', ')}`);
            if (data.type) {
              console.log(`    🏷️ Type field: ${data.type}`);
            }
            if (data.name) {
              console.log(`    📝 Name: ${data.name}`);
            }
          }
        }
      } catch (error) {
        console.log(`  ❌ ${collectionName}: ERROR - ${error.message}`);
      }
    }

    // 2. 특별 조사: leagues 컬렉션 내용 분석
    console.log('\n🕵️ [Step 2] Special Investigation: leagues 컬렉션 내용 분석');

    try {
      const leaguesTournamentsSnapshot = await db.collection('leagues').limit(5).get();

      if (!leaguesTournamentsSnapshot.empty) {
        console.log(`  📊 Found ${leaguesTournamentsSnapshot.size} documents (sample of 5)`);

        const typeDistribution = {};

        leaguesTournamentsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const type = data.type || 'unknown';

          typeDistribution[type] = (typeDistribution[type] || 0) + 1;

          console.log(`  📄 Document ${index + 1}:`);
          console.log(`    ID: ${doc.id}`);
          console.log(`    Type: ${type}`);
          console.log(`    Name: ${data.name || 'N/A'}`);
          console.log(`    Created: ${data.createdAt ? 'Yes' : 'No'}`);
        });

        console.log(`  📈 Type distribution: ${JSON.stringify(typeDistribution, null, 2)}`);
      } else {
        console.log('  ❌ leagues 컬렉션이 비어있거나 존재하지 않습니다.');
      }
    } catch (error) {
      console.log(`  ❌ leagues 조사 실패: ${error.message}`);
    }

    // 3. 전체 컬렉션 목록 시도 (제한적이지만 시도)
    console.log('\n🌐 [Step 3] 전체 데이터베이스 구조 파악 시도...');

    try {
      // Firestore Admin SDK로는 모든 컬렉션을 나열하기 어려우므로,
      // 일반적인 컬렉션 패턴들을 시도해보겠습니다
      const possibleCollections = [
        'leagues_prod',
        'leagues_backup',
        'leagues_v2',
        'club_leagues',
        'tournament_data',
        'tournaments_prod',
        'competitions',
        'matches',
        'events',
      ];

      console.log('  🔍 추가 가능한 컬렉션들 확인:');

      for (const collectionName of possibleCollections) {
        try {
          const snapshot = await db.collection(collectionName).limit(1).get();
          if (!snapshot.empty) {
            console.log(`    ✅ ${collectionName}: FOUND!`);
          }
        } catch (error) {
          // 조용히 무시
        }
      }
    } catch (error) {
      console.log(`  ⚠️ 전체 구조 파악 제한: ${error.message}`);
    }

    console.log('\n🎉 [Investigation Complete] 조사 완료!');
    console.log('📋 [Summary] 이 결과를 바탕으로 코드 경로를 올바르게 정렬할 수 있습니다.');
  } catch (error) {
    console.error('❌ [ERROR] 조사 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  investigateCollections()
    .then(() => {
      console.log('🎯 [Investigation] 조사 완료! 프로세스를 종료합니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 [FATAL] 조사 실패:', error);
      process.exit(1);
    });
}

module.exports = { investigateCollections };
