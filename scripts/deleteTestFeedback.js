/**
 * 테스트 피드백 데이터 삭제 스크립트
 * user_feedback 컬렉션에서 테스트 데이터 삭제
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function deleteTestFeedback() {
  console.log('🔍 테스트 피드백 데이터 검색 중...\n');

  const feedbackRef = db.collection('user_feedback');
  const snapshot = await feedbackRef.get();

  if (snapshot.empty) {
    console.log('📭 user_feedback 컬렉션이 비어있습니다.');
    return;
  }

  const testDocs = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    // 테스트 데이터 패턴 감지
    const isTestData =
      data.userEmail?.includes('@example.com') ||
      data.userName?.includes('Test User') ||
      data.userName?.includes('테스트');

    if (isTestData) {
      testDocs.push({
        id: doc.id,
        userName: data.userName,
        userEmail: data.userEmail,
        title: data.title,
      });
    }
  });

  if (testDocs.length === 0) {
    console.log('✅ 삭제할 테스트 데이터가 없습니다.');
    return;
  }

  console.log(`📋 발견된 테스트 데이터 (${testDocs.length}개):\n`);
  testDocs.forEach((doc, i) => {
    console.log(`  ${i + 1}. ${doc.userName} <${doc.userEmail}>`);
    console.log(`     제목: ${doc.title}`);
    console.log(`     ID: ${doc.id}\n`);
  });

  console.log('🗑️  삭제 중...\n');

  const batch = db.batch();
  testDocs.forEach(doc => {
    batch.delete(feedbackRef.doc(doc.id));
  });

  await batch.commit();

  console.log(`✅ ${testDocs.length}개의 테스트 피드백이 삭제되었습니다!`);
}

deleteTestFeedback()
  .then(() => {
    console.log('\n🎉 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 에러:', error);
    process.exit(1);
  });
