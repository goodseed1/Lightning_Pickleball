/**
 * 🎾 리그 제목을 영어로 변경하는 스크립트
 *
 * 한국어 리그 이름을 영어로 변경합니다.
 *
 * 사용법: node scripts/update-league-titles-to-english.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

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
};

async function updateLeagueTitlesToEnglish() {
  console.log('🎾 리그 제목 영어로 변경 시작...\n');

  // Lightning Pickleball Club의 리그 가져오기
  const clubId = 'WsetxkWODywjt0BBcqrs';
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  console.log(`📊 ${leaguesSnap.size}개의 리그 발견\n`);

  let totalUpdated = 0;

  for (const leagueDoc of leaguesSnap.docs) {
    const leagueData = leagueDoc.data();
    const leagueId = leagueDoc.id;
    const currentTitle = leagueData.name || leagueData.title;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏆 현재 제목: ${currentTitle}`);
    console.log(`   ID: ${leagueId}`);

    // 번역 매핑에서 찾기
    const newTitle = titleTranslations[currentTitle];

    if (newTitle) {
      console.log(`   ✏️ 새 제목: ${newTitle}`);

      // name과 title 모두 업데이트
      const updates = {};
      if (leagueData.name) {
        updates.name = newTitle;
      }
      if (leagueData.title) {
        updates.title = newTitle;
      }

      if (Object.keys(updates).length > 0) {
        await db.collection('leagues').doc(leagueId).update(updates);
        console.log(`   ✅ 업데이트 완료`);
        totalUpdated++;
      }
    } else {
      // 이미 영어인지 확인
      const isKorean = /[가-힣]/.test(currentTitle);
      if (isKorean) {
        console.log(`   ⚠️ 번역 매핑 없음 (수동 확인 필요)`);
      } else {
        console.log(`   ⏭️ 이미 영어 제목`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료!`);
  console.log(`   📝 총 ${totalUpdated}개 리그 제목 업데이트`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
updateLeagueTitlesToEnglish().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
