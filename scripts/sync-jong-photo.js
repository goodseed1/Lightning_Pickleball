/**
 * Jong의 photoURL을 profile.photoURL로 동기화
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const JONG_USER_ID = 'IcF8Pih3UoOchh7GRmYzrF75ijq2';

async function syncPhoto() {
  console.log('🔧 Jong의 프로필 사진 동기화 시작...\n');

  // 1. 현재 데이터 가져오기
  const userRef = db.collection('users').doc(JONG_USER_ID);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  const oldPhotoURL = userData.photoURL;
  const realPhotoURL = userData.profile?.photoURL;

  console.log('Before:');
  console.log('  photoURL (루트):', oldPhotoURL);
  console.log('  profile.photoURL:', realPhotoURL);

  if (!realPhotoURL) {
    console.log('\n❌ profile.photoURL이 없습니다!');
    process.exit(1);
  }

  // 2. photoURL 업데이트
  await userRef.update({
    photoURL: realPhotoURL,
  });

  console.log('\n✅ 업데이트 완료!');
  console.log('  새 photoURL:', realPhotoURL);

  // 3. 확인
  const updatedDoc = await userRef.get();
  const updatedData = updatedDoc.data();
  console.log('\nAfter:');
  console.log('  photoURL (루트):', updatedData.photoURL);
  console.log('  profile.photoURL:', updatedData.profile?.photoURL);

  if (updatedData.photoURL === updatedData.profile?.photoURL) {
    console.log('\n🎉 동기화 성공! 이제 모든 화면에서 같은 사진이 표시됩니다.');
  }

  process.exit(0);
}

syncPhoto().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
