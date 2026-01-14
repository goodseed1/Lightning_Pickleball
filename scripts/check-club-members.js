const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkClubMembers() {
  console.log('🔍 clubMembers 컬렉션 확인 (Dry Run)...\n');

  const membersSnapshot = await db.collection('clubMembers').get();
  console.log('📊 총 ' + membersSnapshot.size + '명의 클럽 멤버\n');

  // 한인 클럽 멤버만 필터링
  const koreanClubId = 'WsetxkWODywjt0BBcqrs';

  const unknownMembers = [];
  const allMembers = [];

  for (const doc of membersSnapshot.docs) {
    const data = doc.data();

    // 한인 클럽 멤버만
    if (data.clubId !== koreanClubId) continue;

    const memberName = data.displayName || data.name || data.userName || 'Unknown';
    const userId = data.userId || doc.id;

    // 실제 users 컬렉션에서 이름 확인
    const userDoc = await db.collection('users').doc(userId).get();
    const actualName = userDoc.exists
      ? userDoc.data().displayName || userDoc.data().name || '(이름 없음)'
      : '(사용자 없음)';

    allMembers.push({
      docId: doc.id,
      userId: userId,
      currentName: memberName,
      actualName: actualName,
      isUnknown: memberName === 'Unknown' || !memberName,
      needsUpdate: memberName !== actualName && actualName !== '(사용자 없음)',
    });

    if (memberName === 'Unknown' || !memberName) {
      unknownMembers.push({ docId: doc.id, userId, actualName });
    }
  }

  console.log('🎾 한인 클럽 멤버: ' + allMembers.length + '명\n');
  console.log('='.repeat(60));

  console.log('\n❌ Unknown 멤버 (업데이트 필요):');
  allMembers
    .filter(m => m.isUnknown)
    .forEach((m, i) => {
      console.log('   ' + (i + 1) + '. docId: ' + m.docId);
      console.log('      현재: "' + m.currentName + '" → 실제: "' + m.actualName + '"');
    });

  console.log('\n⚠️ 이름 불일치 멤버:');
  allMembers
    .filter(m => !m.isUnknown && m.needsUpdate)
    .forEach((m, i) => {
      console.log(
        '   ' + (i + 1) + '. 현재: "' + m.currentName + '" → 실제: "' + m.actualName + '"'
      );
    });

  console.log('\n✅ 정상 멤버:');
  allMembers
    .filter(m => !m.isUnknown && !m.needsUpdate)
    .forEach((m, i) => {
      console.log('   ' + (i + 1) + '. ' + m.currentName);
    });

  console.log('\n' + '='.repeat(60));
  console.log('📊 요약:');
  console.log('   - Unknown: ' + allMembers.filter(m => m.isUnknown).length + '명');
  console.log(
    '   - 이름 불일치: ' + allMembers.filter(m => !m.isUnknown && m.needsUpdate).length + '명'
  );
  console.log('   - 정상: ' + allMembers.filter(m => !m.isUnknown && !m.needsUpdate).length + '명');

  process.exit(0);
}

checkClubMembers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
