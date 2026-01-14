const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteUsersWithoutLocation() {
  console.log('🗑️ 위치 정보가 없는 사용자 삭제\n');
  console.log('='.repeat(80));

  // 1. 모든 사용자 조회
  const usersSnapshot = await db.collection('users').get();
  console.log(`\n📋 총 사용자 수: ${usersSnapshot.size}명\n`);

  const usersWithLocation = [];
  const usersWithoutLocation = [];

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const hasLocation = data.location && data.location.latitude && data.location.longitude;

    const userInfo = {
      id: doc.id,
      name: data.displayName || data.name || '(이름 없음)',
      email: data.email || '(이메일 없음)',
      hasLocation,
    };

    if (hasLocation) {
      usersWithLocation.push(userInfo);
    } else {
      usersWithoutLocation.push(userInfo);
    }
  });

  console.log(`✅ 위치 있음: ${usersWithLocation.length}명`);
  console.log(`❌ 위치 없음: ${usersWithoutLocation.length}명\n`);

  console.log('='.repeat(80));
  console.log('\n🗑️ 삭제 대상 사용자 목록:\n');

  usersWithoutLocation.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.name} (${user.email})`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️ 삭제 시작...\n');

  let deletedCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutLocation) {
    try {
      // 1. users 문서 삭제
      await db.collection('users').doc(user.id).delete();
      console.log(`🗑️ 삭제됨: ${user.name} (${user.email})`);
      deletedCount++;

      // 2. 관련 clubMembers 삭제
      const membershipQuery = await db
        .collection('clubMembers')
        .where('userId', '==', user.id)
        .get();

      for (const memberDoc of membershipQuery.docs) {
        await memberDoc.ref.delete();
        console.log(`   └── clubMembers 삭제: ${memberDoc.id}`);
      }

      // 3. 관련 friendships 삭제
      const friendshipQuery1 = await db
        .collection('friendships')
        .where('userId', '==', user.id)
        .get();

      for (const friendDoc of friendshipQuery1.docs) {
        await friendDoc.ref.delete();
        console.log(`   └── friendships 삭제: ${friendDoc.id}`);
      }

      const friendshipQuery2 = await db
        .collection('friendships')
        .where('friendId', '==', user.id)
        .get();

      for (const friendDoc of friendshipQuery2.docs) {
        await friendDoc.ref.delete();
        console.log(`   └── friendships 삭제: ${friendDoc.id}`);
      }
    } catch (error) {
      console.error(`❌ 삭제 실패 (${user.name}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 결과 요약:');
  console.log(`   🗑️ 삭제됨: ${deletedCount}명`);
  console.log(`   ❌ 오류: ${errorCount}명`);
  console.log(`   ✅ 남은 사용자: ${usersWithLocation.length}명\n`);

  // 검증
  const remainingUsers = await db.collection('users').get();
  console.log(`🔍 검증: 현재 총 사용자 수: ${remainingUsers.size}명\n`);

  process.exit(0);
}

deleteUsersWithoutLocation().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
