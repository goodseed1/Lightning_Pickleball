/**
 * 📚 Upload Knowledge Base to Firestore
 *
 * AI 챗봇의 Knowledge Base를 Firestore에 업로드하는 스크립트
 *
 * Usage: node scripts/upload-knowledge-base.js
 *
 * 📝 Note:
 * - 기존 데이터가 있으면 건너뜁니다 (중복 방지)
 * - --force 옵션을 사용하면 기존 데이터를 삭제하고 다시 업로드합니다
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Import knowledge base data from the service
// We'll define it inline here to avoid module system issues
const getKnowledgeData = language => {
  if (language === 'ko') {
    return [
      {
        question: '번개 매치와 번개 모임의 차이점은 무엇인가요?',
        answer:
          '번개 매치는 1:1 랭킹 경기로 ELO 점수가 변동되며, 매치 결과가 랭킹에 반영됩니다. 번개 모임은 여러 명이 참여하는 친선 경기로 랭킹에 영향을 주지 않으며, 즐거운 피클볼 교류가 목적입니다.',
        keywords: ['매치', '모임', '차이점', '랭킹', '번개'],
        category: 'basic',
        priority: 1,
      },
      {
        question: 'ELO 랭킹은 어떻게 계산되나요?',
        answer:
          'ELO 랭킹은 체스에서 유래된 실력 평가 시스템입니다. 승패에 따라 점수가 변동되며, 상대방과의 실력 차이가 클수록 변동폭이 달라집니다. 강한 상대를 이기면 더 많은 점수를 얻고, 약한 상대에게 지면 더 많은 점수를 잃습니다.',
        keywords: ['ELO', '랭킹', '점수', '계산', '실력'],
        category: 'ranking',
        priority: 1,
      },
      {
        question: '클럽은 어떻게 만들 수 있나요?',
        answer:
          "'내 클럽' 탭에서 '새 클럽 만들기' 버튼을 누르면 됩니다. 클럽 이름, 설명, 위치, 공개/비공개 설정, 가입 방식 등을 설정할 수 있습니다. 클럽을 만들면 자동으로 관리팀이 되어 멤버 관리, 이벤트 생성, 정기 모임 설정 등을 할 수 있습니다. 참고로 한 사용자당 최대 3개까지 클럽을 생성할 수 있습니다.",
        keywords: ['클럽', '생성', '만들기', '관리팀'],
        category: 'club',
        priority: 1,
      },
      {
        question: 'LPR 레벨이 무엇인가요?',
        answer:
          'LPR(Lightning Pickleball Rating)은 Lightning Pickleball 앱의 고유한 ELO 기반 실력 평가 시스템입니다. 1(Bronze, 초보자)부터 10(Legend, 최상위)까지 10단계로 나뉩니다. ELO 점수(600-2400+)를 기반으로 자동 계산되며, 실제 경기 결과에 따라 변동됩니다.',
        keywords: ['LPR', '레벨', '실력', '평가', '매칭', 'ELO', '랭킹', 'NTRP', '등급'],
        category: 'basic',
        priority: 1,
      },
      {
        question: 'LPR과 NTRP의 차이점은 무엇인가요?',
        answer:
          '📊 LPR vs NTRP 비교표:\n\n【LPR (Lightning Pickleball Rating)】\n• 범위: 1-10 (정수)\n• 기반: ELO 알고리즘 (체스 랭킹 방식)\n• 업데이트: 매 경기 후 자동 실시간 반영\n• 특징: Lightning Pickleball 앱 전용 시스템\n• 평가방식: 경기 결과 기반 객관적 산정\n\n【NTRP (National Pickleball Rating Program)】\n• 범위: 1.0-7.0 (소수점)\n• 기반: USTA 공식 평가 기준\n• 업데이트: 자가 평가 또는 공인 코치 평가\n• 특징: 미국 피클볼 협회 공식 시스템\n• 평가방식: 기술/전술 체크리스트 기반 주관적 평가\n\n【LPR ↔ NTRP 변환표】\n• LPR 1-2 = NTRP 1.5-2.5 (초보자)\n• LPR 3-4 = NTRP 3.0-3.5 (중급 입문)\n• LPR 5-6 = NTRP 4.0-4.5 (중급)\n• LPR 7 = NTRP 5.0 (중상급)\n• LPR 8-9 = NTRP 5.5-6.0 (상급)\n• LPR 10 = NTRP 6.5-7.0 (최상위)',
        keywords: [
          'LPR',
          'NTRP',
          '차이점',
          '비교',
          '차이',
          'ELO',
          'USTA',
          '랭킹',
          '실력',
          '평가',
          '변환',
        ],
        category: 'ranking',
        priority: 2,
      },
      {
        question: 'LPR을 NTRP로 변환하면 얼마인가요?',
        answer:
          '🎾 LPR ↔ NTRP 변환표:\n\n• LPR 1-2 = NTRP 1.5-2.5 (초보자)\n• LPR 3-4 = NTRP 3.0-3.5 (중급 입문)\n• LPR 5-6 = NTRP 4.0-4.5 (중급)\n• LPR 7 = NTRP 5.0 (중상급)\n• LPR 8-9 = NTRP 5.5-6.0 (상급)\n• LPR 10 = NTRP 6.5-7.0 (최상위)\n\n예시: LPR 5라면 NTRP 4.0 정도입니다!\n\n참고: 이 변환은 대략적인 비교이며, LPR은 실제 경기 결과 기반이고 NTRP는 자가 평가 기반이라 정확히 일치하지 않을 수 있습니다.',
        keywords: ['LPR', 'NTRP', '변환', '얼마', '몇', '레벨', '환산', '대응', '같은', '동일'],
        category: 'ranking',
        priority: 2,
      },
      {
        question: '리그와 토너먼트의 차이점은 무엇인가요?',
        answer:
          '리그는 장기간(보통 몇 주~몇 달) 진행되는 정규 시즌 형태의 경기로, 참가자들이 여러 번 경기를 하여 순위를 정합니다. 토너먼트는 단기간에 진행되는 토너먼트 방식으로, 패배하면 탈락하는 elimination 형태입니다. 둘 다 클럽에서 주최할 수 있습니다.',
        keywords: ['리그', '토너먼트', '대회', '차이', '클럽'],
        category: 'competition',
        priority: 1,
      },
      {
        question: '친구는 어떻게 추가하나요?',
        answer:
          "친구를 추가하는 방법은 여러 가지입니다: 1) '발견' 탭의 '플레이어' 에서 검색, 2) 매치나 모임에서 만난 사람의 프로필에서 친구 추가, 3) 클럽 멤버 목록에서 추가. 친구가 되면 서로의 활동을 피드에서 볼 수 있고, 매치 초대를 더 쉽게 할 수 있습니다.",
        keywords: ['친구', '추가', '검색', '프로필'],
        category: 'social',
        priority: 1,
      },
      {
        question: '배지는 어떻게 얻나요?',
        answer:
          '배지는 다양한 업적을 달성하면 자동으로 수여됩니다. 연승 배지(3연승, 5연승, 10연승), 경기 마일스톤 배지(10경기, 50경기, 100경기), 소셜 플레이어 배지(5명 이상의 다른 상대와 경기), 리그 챔피언 배지(첫 리그 우승) 등이 있습니다. 배지는 프로필의 Hall of Fame 섹션에서 확인할 수 있습니다.',
        keywords: ['배지', '업적', '연승', '마일스톤', 'badge'],
        category: 'achievements',
        priority: 1,
      },
      {
        question: '트로피는 어떻게 얻나요?',
        answer:
          '트로피는 클럽 리그나 토너먼트에서 우승(1위) 또는 준우승(2위)을 하면 자동으로 수여됩니다. 우승 트로피는 금색, 준우승 트로피는 은색으로 표시됩니다. 트로피는 프로필의 Hall of Fame 섹션에서 확인할 수 있습니다.',
        keywords: ['트로피', '우승', '준우승', '리그', '토너먼트', 'trophy'],
        category: 'achievements',
        priority: 1,
      },
      {
        question: '번개 피클볼 앱 공식 이메일 주소가 무엇인가요?',
        answer:
          '번개 피클볼 앱의 공식 이메일 주소는 lightningpickleballapp@gmail.com 입니다. 문의사항, 피드백, 버그 신고, 제휴 문의 등 모든 문의는 이 이메일로 보내주세요. 빠른 시간 내에 답변 드리겠습니다! ⚡',
        keywords: [
          '이메일',
          '연락처',
          '문의',
          '공식',
          '피드백',
          '버그',
          '제휴',
          'email',
          'contact',
        ],
        category: 'contact',
        priority: 1,
      },
      {
        question: 'ELO to LPR 변환 테이블을 보여줘요',
        answer:
          '📊 **ELO → LPR 변환 테이블**\n\n| ELO 범위 | LPR 레벨 | 티어 |\n|----------|---------|------|\n| 0 - 1000 | LPR 1 | 🥉 Bronze |\n| 1000 - 1100 | LPR 2 | 🥈 Silver |\n| 1100 - 1200 | LPR 3 | 🥇 Gold I |\n| 1200 - 1300 | LPR 4 | 🥇 Gold II |\n| 1300 - 1450 | LPR 5 | 💎 Platinum I |\n| 1450 - 1600 | LPR 6 | 💎 Platinum II |\n| 1600 - 1800 | LPR 7 | 💠 Diamond |\n| 1800 - 2100 | LPR 8 | 👑 Master I |\n| 2100 - 2400 | LPR 9 | 👑 Master II |\n| 2400+ | LPR 10 | 🏆 Legend |',
        keywords: [
          'ELO',
          'LPR',
          '변환',
          '테이블',
          'convert',
          'table',
          '점수',
          '레벨',
          '티어',
          '범위',
        ],
        category: 'ranking',
        priority: 1,
      },
    ];
  } else {
    // English
    return [
      {
        question: 'What is the difference between Lightning Match and Lightning Meetup?',
        answer:
          'Lightning Match is a 1:1 ranked game where ELO scores change, and match results are reflected in rankings. Lightning Meetup is a friendly game with multiple participants that does not affect rankings, meant for enjoyable pickleball exchange.',
        keywords: ['match', 'meetup', 'difference', 'ranking', 'lightning'],
        category: 'basic',
        priority: 1,
      },
      {
        question: 'How is ELO ranking calculated?',
        answer:
          'ELO ranking is a skill evaluation system derived from chess. Points change based on wins and losses, and the larger the skill gap with your opponent, the more the points vary. Beating a stronger opponent earns more points, while losing to a weaker opponent costs more points.',
        keywords: ['ELO', 'ranking', 'score', 'calculate', 'skill'],
        category: 'ranking',
        priority: 1,
      },
      {
        question: 'What is LPR level?',
        answer:
          'LPR (Lightning Pickleball Rating) is the unique ELO-based skill evaluation system of Lightning Pickleball app. It ranges from 1 (Bronze, beginner) to 10 (Legend, top-tier). It is automatically calculated based on ELO score (600-2400+) and changes according to actual match results.',
        keywords: [
          'LPR',
          'level',
          'skill',
          'evaluation',
          'matching',
          'ELO',
          'ranking',
          'NTRP',
          'rating',
        ],
        category: 'basic',
        priority: 1,
      },
      {
        question: 'What is the difference between LPR and NTRP?',
        answer:
          '📊 LPR vs NTRP Comparison:\n\n【LPR (Lightning Pickleball Rating)】\n• Range: 1-10 (integer)\n• Based on: ELO algorithm (chess ranking style)\n• Updates: Automatic real-time after each match\n• Feature: Lightning Pickleball app exclusive system\n• Evaluation: Objective based on match results\n\n【NTRP (National Pickleball Rating Program)】\n• Range: 1.0-7.0 (decimal)\n• Based on: USTA official criteria\n• Updates: Self-assessment or certified coach evaluation\n• Feature: Official USTA system\n• Evaluation: Subjective based on skill checklist\n\n【LPR ↔ NTRP Conversion】\n• LPR 1-2 = NTRP 1.5-2.5 (Beginner)\n• LPR 3-4 = NTRP 3.0-3.5 (Intermediate entry)\n• LPR 5-6 = NTRP 4.0-4.5 (Intermediate)\n• LPR 7 = NTRP 5.0 (Upper Intermediate)\n• LPR 8-9 = NTRP 5.5-6.0 (Advanced)\n• LPR 10 = NTRP 6.5-7.0 (Top tier)',
        keywords: [
          'LPR',
          'NTRP',
          'difference',
          'compare',
          'comparison',
          'ELO',
          'USTA',
          'ranking',
          'skill',
          'evaluation',
          'convert',
        ],
        category: 'ranking',
        priority: 2,
      },
      {
        question: 'How to convert LPR to NTRP?',
        answer:
          '🎾 LPR ↔ NTRP Conversion Table:\n\n• LPR 1-2 = NTRP 1.5-2.5 (Beginner)\n• LPR 3-4 = NTRP 3.0-3.5 (Intermediate entry)\n• LPR 5-6 = NTRP 4.0-4.5 (Intermediate)\n• LPR 7 = NTRP 5.0 (Upper Intermediate)\n• LPR 8-9 = NTRP 5.5-6.0 (Advanced)\n• LPR 10 = NTRP 6.5-7.0 (Top tier)\n\nExample: LPR 5 is approximately NTRP 4.0!\n\nNote: This conversion is approximate. LPR is based on actual match results while NTRP is self-reported, so they may not match exactly.',
        keywords: [
          'LPR',
          'NTRP',
          'convert',
          'conversion',
          'how much',
          'level',
          'equivalent',
          'same',
        ],
        category: 'ranking',
        priority: 2,
      },
      {
        question: 'What is the official email address for Lightning Pickleball?',
        answer:
          'The official email address for Lightning Pickleball is lightningpickleballapp@gmail.com. Please send all inquiries including questions, feedback, bug reports, and partnership inquiries to this email. We will respond as soon as possible! ⚡',
        keywords: ['email', 'contact', 'inquiry', 'official', 'feedback', 'bug', 'partnership'],
        category: 'contact',
        priority: 1,
      },
    ];
  }
};

async function uploadKnowledgeBase() {
  const forceUpload = process.argv.includes('--force');

  console.log('📚 Knowledge Base Upload Script');
  console.log('================================\n');

  try {
    // Check existing data
    const existingSnapshot = await db.collection('knowledge_base').limit(1).get();

    if (!existingSnapshot.empty && !forceUpload) {
      console.log('⚠️  Knowledge base already has data!');
      console.log('   Use --force to delete and re-upload.\n');
      console.log('   Example: node scripts/upload-knowledge-base.js --force\n');
      process.exit(0);
    }

    if (forceUpload && !existingSnapshot.empty) {
      console.log('🗑️  Deleting existing knowledge base data...');
      const allDocs = await db.collection('knowledge_base').get();
      const batch = db.batch();
      allDocs.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   Deleted ${allDocs.size} documents.\n`);
    }

    // Upload Korean data
    console.log('🇰🇷 Uploading Korean knowledge base...');
    const koData = getKnowledgeData('ko');
    let koCount = 0;

    for (const item of koData) {
      await db.collection('knowledge_base').add({
        ...item,
        language: 'ko',
        isActive: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
      koCount++;
      process.stdout.write(`   Uploaded: ${koCount}/${koData.length}\r`);
    }
    console.log(`\n   ✅ Korean: ${koCount} items uploaded`);

    // Upload English data
    console.log('\n🇺🇸 Uploading English knowledge base...');
    const enData = getKnowledgeData('en');
    let enCount = 0;

    for (const item of enData) {
      await db.collection('knowledge_base').add({
        ...item,
        language: 'en',
        isActive: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
      enCount++;
      process.stdout.write(`   Uploaded: ${enCount}/${enData.length}\r`);
    }
    console.log(`\n   ✅ English: ${enCount} items uploaded`);

    // Create metadata document for cache invalidation
    await db.collection('knowledge_base_meta').doc('version').set({
      version: 1,
      lastUpdated: admin.firestore.Timestamp.now(),
      koCount: koCount,
      enCount: enCount,
    });
    console.log('\n📋 Metadata document created.');

    console.log('\n================================');
    console.log('🎉 Upload complete!');
    console.log(`   Total: ${koCount + enCount} items`);
    console.log('\n💡 Tip: To update KB, edit in Firebase Console');
    console.log('   or run this script with --force\n');
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

uploadKnowledgeBase();
