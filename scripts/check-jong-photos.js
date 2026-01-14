/**
 * Jong의 프로필 사진 정보 확인 스크립트
 * User profile vs Club member profile 비교
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

async function checkJongPhotos() {
  console.log('='.repeat(60));
  console.log('🔍 Jong 프로필 사진 정보 확인');
  console.log('='.repeat(60));

  // 1. users 컬렉션에서 확인
  const userDoc = await db.collection('users').doc(JONG_USER_ID).get();
  const userData = userDoc.data();

  console.log('\n📊 [1] users 컬렉션 (내 프로필):');
  console.log('-'.repeat(40));
  console.log('photoURL:', userData.photoURL || '(없음)');
  console.log('profile.photoURL:', userData.profile?.photoURL || '(없음)');
  console.log('profileImageUrl:', userData.profileImageUrl || '(없음)');

  // 2. clubs/members 서브컬렉션에서 확인
  console.log('\n📊 [2] clubs/members 서브컬렉션 (클럽 멤버 정보):');
  console.log('-'.repeat(40));

  const clubsSnapshot = await db.collection('clubs').get();

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();
    const membersSnapshot = await db
      .collection('clubs')
      .doc(clubDoc.id)
      .collection('members')
      .where('userId', '==', JONG_USER_ID)
      .get();

    if (!membersSnapshot.empty) {
      membersSnapshot.forEach(memberDoc => {
        const memberData = memberDoc.data();
        console.log(`\n클럽: ${clubData.name}`);
        console.log('  Member Doc ID:', memberDoc.id);
        console.log('  photoURL:', memberData.photoURL || '(없음)');
        console.log('  profileImageUrl:', memberData.profileImageUrl || '(없음)');
        console.log('  displayName:', memberData.displayName || '(없음)');
      });
    }
  }

  // 3. League ELO Rankings 화면에서 어디서 데이터를 가져오는지 확인
  console.log('\n📊 [3] 분석:');
  console.log('-'.repeat(40));
  console.log('Hall of Fame > League ELO Rankings 화면은');
  console.log('clubs/{clubId}/members 서브컬렉션에서 데이터를 가져옵니다.');
  console.log('');
  console.log('만약 사진이 다르다면:');
  console.log('1. users 컬렉션의 photoURL이 업데이트되었지만');
  console.log('2. clubs/members의 photoURL은 옛날 사진으로 남아있을 수 있습니다.');

  process.exit(0);
}

checkJongPhotos().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
