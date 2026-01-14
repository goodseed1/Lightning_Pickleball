/**
 * Firestore 전체 컬렉션 확인 스크립트
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function listAllCollections() {
  console.log('🔍 Firestore 전체 컬렉션 확인 중...\n');

  const collections = await db.listCollections();

  console.log(`📂 발견된 컬렉션 (${collections.length}개):\n`);

  for (const collection of collections) {
    const snapshot = await collection.get();
    console.log(`  📁 ${collection.id}: ${snapshot.size}개 문서`);

    // 클럽 관련 컬렉션이면 상세 출력
    if (
      collection.id.toLowerCase().includes('club') ||
      collection.id.toLowerCase().includes('pickleball')
    ) {
      console.log('     ⬇️ 클럽 관련 컬렉션 - 상세 내용:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`        - ${data.name || data.clubName || doc.id}`);
        console.log(`          ID: ${doc.id}`);
      });
    }
  }
}

listAllCollections()
  .then(() => {
    console.log('\n✅ 확인 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 에러:', error);
    process.exit(1);
  });
