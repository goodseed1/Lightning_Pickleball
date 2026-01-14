/**
 * 🔧 클럽 멤버 이름 수정 스크립트
 * clubMembers 컬렉션의 Unknown 이름을 users 컬렉션의 실제 이름으로 업데이트
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function fixClubMemberNames() {
  console.log('🔧 클럽 멤버 이름 수정 시작...\n');

  const membersSnapshot = await db.collection('clubMembers').get();
  console.log('📊 총 ' + membersSnapshot.size + '명의 클럽 멤버 확인\n');

  const batch = db.batch();
  let updateCount = 0;
  const updates = [];

  for (const doc of membersSnapshot.docs) {
    const data = doc.data();
    const memberName = data.displayName || data.name || 'Unknown';
    const userId = data.userId || doc.id.split('_')[1]; // docId 형식: clubId_userId

    // Unknown이거나 이름이 없는 경우만 업데이트
    if (memberName !== 'Unknown' && memberName) continue;

    // 실제 users 컬렉션에서 이름 가져오기
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('⚠️ 사용자 없음: ' + userId);
      continue;
    }

    const userData = userDoc.data();
    const actualName = userData.displayName || userData.name;

    if (!actualName) {
      console.log('⚠️ 사용자 이름 없음: ' + userId);
      continue;
    }

    // 업데이트 데이터 준비
    batch.update(doc.ref, {
      displayName: actualName,
      name: actualName,
    });

    updates.push({
      docId: doc.id,
      from: memberName,
      to: actualName,
    });
    updateCount++;
  }

  console.log('📋 업데이트 목록:');
  updates.forEach((u, i) => {
    console.log('   ' + (i + 1) + '. "' + u.from + '" → "' + u.to + '"');
  });

  if (updateCount > 0) {
    console.log('\n⏳ ' + updateCount + '명 업데이트 중...');
    await batch.commit();
    console.log('✅ 완료!\n');
  } else {
    console.log('\n✅ 업데이트할 멤버가 없습니다.\n');
  }

  process.exit(0);
}

fixClubMemberNames().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
