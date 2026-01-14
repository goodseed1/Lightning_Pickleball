/**
 * 🎨 프로필 사진이 없는 사용자에게 실제 사람 사진 추가
 *
 * RandomUser.me의 portrait 이미지 사용
 * https://randomuser.me/api/portraits/men/1.jpg (1-99)
 * https://randomuser.me/api/portraits/women/1.jpg (1-99)
 *
 * 사용법: node scripts/add-real-photos-to-users.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 여성 이름 목록 (이름으로 성별 추측용)
const femaleNames = [
  'grace',
  'eva',
  'jessica',
  'emily',
  'judy',
  'gigi',
  'kim',
  'sarah',
  'emma',
  'olivia',
  'ava',
  'sophia',
  'isabella',
  'mia',
  'charlotte',
  'amelia',
  'harper',
  'evelyn',
  'abigail',
  '경희',
  '은희',
  '영희',
  '순희',
  '미영',
  '정숙',
  '영자',
  '옥순',
  '순자',
  '영숙',
];

// 이름으로 성별 추측
function guessGender(displayName, existingGender) {
  if (existingGender === 'male') return 'male';
  if (existingGender === 'female') return 'female';

  const firstName = displayName.split(' ')[0].toLowerCase();

  if (femaleNames.some(name => firstName.includes(name.toLowerCase()))) {
    return 'female';
  }

  // 기본값은 남성 (피클볼 앱 특성상 남성이 더 많음)
  return 'male';
}

// 사용된 이미지 번호 추적 (중복 방지)
const usedMenImages = new Set();
const usedWomenImages = new Set();

function getRandomImageNumber(gender) {
  const usedSet = gender === 'female' ? usedWomenImages : usedMenImages;
  let imageNum;

  // 1-99 범위에서 사용하지 않은 번호 선택
  do {
    imageNum = Math.floor(Math.random() * 99) + 1;
  } while (usedSet.has(imageNum) && usedSet.size < 99);

  usedSet.add(imageNum);
  return imageNum;
}

function generatePhotoUrl(gender) {
  const imageNum = getRandomImageNumber(gender);
  const genderPath = gender === 'female' ? 'women' : 'men';
  return `https://randomuser.me/api/portraits/${genderPath}/${imageNum}.jpg`;
}

async function addRealPhotosToUsers() {
  console.log('📸 실제 사람 사진으로 프로필 업데이트 시작...\n');

  const usersSnap = await db.collection('users').get();

  let totalUsers = 0;
  let usersUpdated = 0;
  let maleCount = 0;
  let femaleCount = 0;

  console.log(`📊 전체 사용자: ${usersSnap.size}명\n`);
  console.log('='.repeat(70));

  for (const doc of usersSnap.docs) {
    const user = doc.data();
    totalUsers++;

    // 위치 정보가 있는 사용자 (이전에 UI Avatars로 설정한 사용자 포함)
    if (user.location && user.location.latitude) {
      const displayName = user.displayName || 'User';
      const gender = guessGender(displayName, user.gender);
      const photoUrl = generatePhotoUrl(gender);

      console.log(`\n✏️ ${displayName}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   성별: ${gender === 'female' ? '👩 여성' : '👨 남성'}`);
      console.log(`   Photo: ${photoUrl}`);

      // Firestore 업데이트
      await db.collection('users').doc(doc.id).update({
        photoURL: photoUrl,
      });

      if (gender === 'female') {
        femaleCount++;
      } else {
        maleCount++;
      }

      usersUpdated++;
      console.log(`   ✅ 업데이트 완료`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 완료!`);
  console.log(`   📸 사진 추가: ${usersUpdated}명`);
  console.log(`   👨 남성 사진: ${maleCount}명`);
  console.log(`   👩 여성 사진: ${femaleCount}명`);
  console.log('='.repeat(70));

  process.exit(0);
}

// 스크립트 실행
addRealPhotosToUsers().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
