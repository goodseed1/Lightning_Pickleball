/**
 * 테스트 사용자 삭제 스크립트
 * 101@t.com ~ 116@t.com 계정 삭제
 * - Firebase Authentication에서 삭제
 * - Firestore users 컬렉션에서 삭제
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();
const auth = admin.auth();

// 삭제할 이메일 목록 생성 (101@t.com ~ 116@t.com)
const emailsToDelete = [];
for (let i = 101; i <= 116; i++) {
  emailsToDelete.push(`${i}@t.com`);
}

async function deleteTestUsers() {
  console.log('🔍 테스트 사용자 검색 중...\n');
  console.log(`삭제 대상: ${emailsToDelete.join(', ')}\n`);

  const deletedUsers = [];
  const notFoundUsers = [];
  const errors = [];

  for (const email of emailsToDelete) {
    try {
      // 1. Firebase Auth에서 사용자 찾기
      const userRecord = await auth.getUserByEmail(email);
      const uid = userRecord.uid;

      console.log(`📧 ${email} (UID: ${uid}) 발견`);

      // 2. Firebase Auth에서 삭제
      await auth.deleteUser(uid);
      console.log(`   ✅ Auth 삭제 완료`);

      // 3. Firestore에서 사용자 문서 삭제
      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        await userDocRef.delete();
        console.log(`   ✅ Firestore 삭제 완료`);
      } else {
        console.log(`   ⚠️ Firestore 문서 없음`);
      }

      deletedUsers.push(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`📧 ${email} - 사용자 없음 (이미 삭제됨)`);
        notFoundUsers.push(email);
      } else {
        console.error(`❌ ${email} 삭제 실패:`, error.message);
        errors.push({ email, error: error.message });
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 삭제 결과:');
  console.log(`   ✅ 삭제 완료: ${deletedUsers.length}개`);
  console.log(`   ⚠️ 존재하지 않음: ${notFoundUsers.length}개`);
  console.log(`   ❌ 에러: ${errors.length}개`);

  if (deletedUsers.length > 0) {
    console.log('\n삭제된 계정:');
    deletedUsers.forEach(email => console.log(`   - ${email}`));
  }

  if (errors.length > 0) {
    console.log('\n에러 발생:');
    errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
  }
}

deleteTestUsers()
  .then(() => {
    console.log('\n🎉 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 스크립트 에러:', error);
    process.exit(1);
  });
