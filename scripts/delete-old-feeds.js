/**
 * 오래된 피드 삭제 스크립트
 * feed 컬렉션에서 3일 이상 된 피드 아이템 삭제
 *
 * 작성일: 2026-01-12
 * 목적: 홈피드 정리 - 2일 전까지만 유지, 3일 이상 된 피드 삭제
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

// 3일 전 기준 시간 계산
const THREE_DAYS_AGO = new Date();
THREE_DAYS_AGO.setDate(THREE_DAYS_AGO.getDate() - 3);
THREE_DAYS_AGO.setHours(0, 0, 0, 0); // 3일 전 자정으로 설정

async function deleteOldFeeds() {
  console.log('🔍 오래된 피드 검색 중...');
  console.log(`📅 기준일: ${THREE_DAYS_AGO.toISOString()} 이전 피드 삭제\n`);

  const feedRef = db.collection('feed');

  // timestamp 필드 기준으로 3일 이상 된 피드 조회
  const snapshot = await feedRef
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(THREE_DAYS_AGO))
    .get();

  if (snapshot.empty) {
    console.log('📭 삭제할 오래된 피드가 없습니다.');
    return;
  }

  const oldFeeds = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate?.() || data.timestamp;
    oldFeeds.push({
      id: doc.id,
      type: data.type,
      actorName: data.actorName || 'Unknown',
      timestamp: timestamp,
      clubName: data.clubName || 'N/A',
    });
  });

  console.log(`📋 삭제 대상 피드 (${oldFeeds.length}개):\n`);

  // 샘플로 처음 10개만 표시
  const sampleSize = Math.min(10, oldFeeds.length);
  oldFeeds.slice(0, sampleSize).forEach((feed, i) => {
    const dateStr =
      feed.timestamp instanceof Date ? feed.timestamp.toISOString().split('T')[0] : 'Unknown date';
    console.log(`  ${i + 1}. [${feed.type}] ${feed.actorName} @ ${feed.clubName}`);
    console.log(`     날짜: ${dateStr}`);
    console.log(`     ID: ${feed.id}\n`);
  });

  if (oldFeeds.length > sampleSize) {
    console.log(`  ... 외 ${oldFeeds.length - sampleSize}개 더\n`);
  }

  console.log('🗑️  삭제 진행 중...\n');

  // Firestore batch는 500개 제한이 있으므로 나눠서 처리
  const BATCH_SIZE = 500;
  let deletedCount = 0;

  for (let i = 0; i < oldFeeds.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = oldFeeds.slice(i, i + BATCH_SIZE);

    chunk.forEach(feed => {
      batch.delete(feedRef.doc(feed.id));
    });

    await batch.commit();
    deletedCount += chunk.length;
    console.log(`  ✅ ${deletedCount}/${oldFeeds.length} 삭제 완료`);
  }

  console.log(`\n🎉 총 ${deletedCount}개의 오래된 피드가 삭제되었습니다!`);
}

deleteOldFeeds()
  .then(() => {
    console.log('\n✨ 피드 정리 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 에러:', error);
    process.exit(1);
  });
