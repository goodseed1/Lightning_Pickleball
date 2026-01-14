/**
 * 🏆 트로피 이름 영어로 변경 스크립트
 *
 * users/{userId}/trophies 서브컬렉션의 한국어 리그/토너먼트 이름을 영어로 변경합니다.
 *
 * 사용법: node scripts/update-trophy-names-to-english.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Lightning Tennis Club ID
const CLUB_ID = 'WsetxkWODywjt0BBcqrs';

// 한국어 → 영어 매핑
const titleTranslations = {
  // 남자 단식
  '2026년 남자 단식 리그': "2026 Men's Singles League",
  '2025년 남자 단식 리그': "2025 Men's Singles League",
  '2024년 남자 단식 리그': "2024 Men's Singles League",

  // 여자 단식
  '2026년 여자 단식 리그': "2026 Women's Singles League",
  '2025년 여자 단식 리그': "2025 Women's Singles League",
  '2024년 여자 단식 리그': "2024 Women's Singles League",

  // 남자 복식
  '2026년 남자 복식 리그': "2026 Men's Doubles League",
  '2025년 남자 복식 리그': "2025 Men's Doubles League",
  '2024년 남자 복식 리그': "2024 Men's Doubles League",

  // 여자 복식
  '2026년 여자 복식 리그': "2026 Women's Doubles League",
  '2025년 여자 복식 리그': "2025 Women's Doubles League",
  '2024년 여자 복식 리그': "2024 Women's Doubles League",

  // 혼합 복식
  '2026년 혼합 복식 리그': '2026 Mixed Doubles League',
  '2025년 혼합 복식 리그': '2025 Mixed Doubles League',
  '2024년 혼합 복식 리그': '2024 Mixed Doubles League',

  // 토너먼트 관련 - 2026년
  '2026년 남자 단식 토너먼트': "2026 Men's Singles Tournament",
  '2026년 여자 단식 토너먼트': "2026 Women's Singles Tournament",
  '2026년 남자 복식 토너먼트': "2026 Men's Doubles Tournament",
  '2026년 여자 복식 토너먼트': "2026 Women's Doubles Tournament",
  '2026년 혼합 복식 토너먼트': '2026 Mixed Doubles Tournament',

  // 토너먼트 관련 - 2025년
  '2025년 남자 단식 토너먼트': "2025 Men's Singles Tournament",
  '2025년 여자 단식 토너먼트': "2025 Women's Singles Tournament",
  '2025년 남자 복식 토너먼트': "2025 Men's Doubles Tournament",
  '2025년 여자 복식 토너먼트': "2025 Women's Doubles Tournament",
  '2025년 혼합 복식 토너먼트': '2025 Mixed Doubles Tournament',

  // 토너먼트 관련 - 2024년
  '2024년 남자 단식 토너먼트': "2024 Men's Singles Tournament",
  '2024년 여자 단식 토너먼트': "2024 Women's Singles Tournament",
  '2024년 남자 복식 토너먼트': "2024 Men's Doubles Tournament",
  '2024년 여자 복식 토너먼트': "2024 Women's Doubles Tournament",
  '2024년 혼합 복식 토너먼트': '2024 Mixed Doubles Tournament',
};

async function updateTrophyNamesToEnglish() {
  console.log('🏆 트로피 이름 영어로 변경 시작...\n');
  console.log('📋 Club ID:', CLUB_ID);
  console.log('='.repeat(60) + '\n');

  // 1. 클럽 멤버 목록 가져오기
  console.log('📥 클럽 멤버 목록 조회 중...');
  const clubMembersSnap = await db.collection('clubMembers').where('clubId', '==', CLUB_ID).get();

  if (clubMembersSnap.empty) {
    console.log('❌ 클럽 멤버가 없습니다.');
    process.exit(1);
  }

  const memberIds = clubMembersSnap.docs.map(doc => doc.data().userId);
  console.log(`   활성 회원 수: ${memberIds.length}명\n`);

  let totalTrophies = 0;
  let totalUpdated = 0;
  const notFoundTitles = new Set();

  // 2. 각 멤버의 트로피 확인 및 업데이트
  for (const userId of memberIds) {
    // 해당 클럽의 트로피만 가져오기
    const trophiesSnap = await db
      .collection('users')
      .doc(userId)
      .collection('trophies')
      .where('clubId', '==', CLUB_ID)
      .get();

    if (trophiesSnap.empty) {
      continue;
    }

    totalTrophies += trophiesSnap.size;

    for (const trophyDoc of trophiesSnap.docs) {
      const trophyData = trophyDoc.data();
      const currentTitle = trophyData.tournamentName || trophyData.leagueName;

      if (!currentTitle) {
        continue;
      }

      // 이미 영어인지 확인
      const isKorean = /[가-힣]/.test(currentTitle);
      if (!isKorean) {
        continue;
      }

      // 번역 매핑에서 찾기
      const newTitle = titleTranslations[currentTitle];

      if (newTitle) {
        console.log(`🏆 User: ${userId.substring(0, 8)}...`);
        console.log(`   📝 ${currentTitle} → ${newTitle}`);

        // tournamentName과 leagueName 둘 다 업데이트
        const updates = {};
        if (trophyData.tournamentName) {
          updates.tournamentName = newTitle;
        }
        if (trophyData.leagueName) {
          updates.leagueName = newTitle;
        }

        if (Object.keys(updates).length > 0) {
          await trophyDoc.ref.update(updates);
          totalUpdated++;
          console.log(`   ✅ 업데이트 완료\n`);
        }
      } else {
        notFoundTitles.add(currentTitle);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 완료!');
  console.log(`   📊 총 트로피: ${totalTrophies}개`);
  console.log(`   📝 업데이트된 트로피: ${totalUpdated}개`);

  if (notFoundTitles.size > 0) {
    console.log(`\n⚠️ 번역 매핑 없는 한국어 제목들:`);
    notFoundTitles.forEach(title => {
      console.log(`   - ${title}`);
    });
    console.log('\n   위 제목들을 스크립트에 추가해주세요.');
  }

  console.log('='.repeat(60));
  process.exit(0);
}

// 스크립트 실행
updateTrophyNamesToEnglish().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
