/**
 * 🗑️ 사용자 "Gil" 삭제 스크립트
 *
 * displayName이 "Gil"인 사용자를 찾아서 삭제합니다.
 *
 * 사용법: node scripts/delete-user-gil.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function deleteUserGil() {
  console.log('🔍 사용자 "Gil" 검색 중...\n');

  // displayName이 "Gil"인 사용자 찾기
  const usersSnap = await db.collection('users').where('displayName', '==', 'Gil').get();

  if (usersSnap.empty) {
    console.log('❌ "Gil" 사용자를 찾을 수 없습니다.');

    // 이름에 Gil이 포함된 사용자 검색
    console.log('\n🔍 이름에 "Gil"이 포함된 사용자 검색 중...');
    const allUsersSnap = await db.collection('users').get();

    const gilUsers = allUsersSnap.docs.filter(doc => {
      const name = doc.data().displayName || '';
      return name.toLowerCase().includes('gil');
    });

    if (gilUsers.length > 0) {
      console.log(`\n📋 "Gil"이 포함된 사용자 ${gilUsers.length}명 발견:`);
      gilUsers.forEach(doc => {
        const user = doc.data();
        console.log(`   - ID: ${doc.id}`);
        console.log(`     이름: ${user.displayName}`);
        console.log(`     이메일: ${user.email || 'N/A'}`);
        console.log(`     위치: ${user.location ? '있음' : '없음'}`);
        console.log('');
      });
    }

    process.exit(1);
  }

  console.log(`📋 ${usersSnap.size}명의 "Gil" 사용자 발견:\n`);

  for (const doc of usersSnap.docs) {
    const user = doc.data();

    console.log('='.repeat(60));
    console.log(`🎯 사용자 정보:`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   이름: ${user.displayName}`);
    console.log(`   이메일: ${user.email || 'N/A'}`);
    console.log(`   위치: ${user.location ? '있음' : '없음'}`);
    console.log(`   사진: ${user.photoURL || '없음'}`);
    console.log('');

    // 삭제 실행
    console.log('🗑️ 삭제 중...');
    await db.collection('users').doc(doc.id).delete();
    console.log('✅ 삭제 완료!');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료! ${usersSnap.size}명의 "Gil" 사용자 삭제됨`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
deleteUserGil().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
