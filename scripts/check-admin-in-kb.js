/**
 * 🔍 Firestore knowledge_base에서 "관리자" 검색 스크립트
 *
 * "관리자" → "관리팀" 마이그레이션이 완료되었는지 확인합니다.
 */

const admin = require('firebase-admin');

// Initialize with existing app or create new one
if (!admin.apps.length) {
  const serviceAccount = require('../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function searchForAdmin() {
  console.log('🔍 Firestore knowledge_base에서 "관리자" 검색 중...\n');

  const snapshot = await db.collection('knowledge_base').get();

  console.log('📊 전체 문서 수:', snapshot.size, '\n');

  let foundAdmin = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const jsonStr = JSON.stringify(data);

    if (jsonStr.includes('관리자')) {
      foundAdmin.push({
        id: doc.id,
        question: data.question?.substring(0, 50) || '(질문 없음)',
        answer: data.answer?.substring(0, 100) || '(답변 없음)',
      });
    }
  });

  if (foundAdmin.length > 0) {
    console.log('⚠️ "관리자"가 포함된 문서 발견! (' + foundAdmin.length + '개)\n');
    foundAdmin.forEach((doc, i) => {
      console.log('--- 문서 ' + (i + 1) + ' ---');
      console.log('ID:', doc.id);
      console.log('질문:', doc.question);
      console.log('답변:', doc.answer + '...');
      console.log('');
    });
    console.log('\n❌ 서버 데이터에 아직 "관리자"가 남아있습니다!');
    console.log('   → "관리팀"으로 업데이트가 필요합니다.');
  } else {
    console.log('✅ "관리자"가 포함된 문서가 없습니다.');
    console.log('   → 이미 "관리팀"으로 업데이트 완료된 것 같습니다!');
  }

  // Also check for "관리팀" to confirm
  let foundTeam = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    const jsonStr = JSON.stringify(data);
    if (jsonStr.includes('관리팀')) {
      foundTeam++;
    }
  });

  console.log('\n📊 "관리팀" 포함 문서:', foundTeam + '개');
}

searchForAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('에러:', err);
    process.exit(1);
  });
