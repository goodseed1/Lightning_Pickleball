/**
 * 🎨 프로필 사진이 없는 사용자에게 UI Avatars 아바타 추가
 *
 * UI Avatars API를 사용하여 이름 기반 아바타 URL 생성
 * https://ui-avatars.com/
 *
 * 사용법: node scripts/add-avatar-to-users.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 랜덤 배경색 생성 (테니스/스포츠 느낌의 색상들)
const avatarColors = [
  '4CAF50', // Green
  '2196F3', // Blue
  'FF9800', // Orange
  '9C27B0', // Purple
  'E91E63', // Pink
  '00BCD4', // Cyan
  'FF5722', // Deep Orange
  '3F51B5', // Indigo
  '009688', // Teal
  '673AB7', // Deep Purple
  'F44336', // Red
  '795548', // Brown
  '607D8B', // Blue Grey
  '8BC34A', // Light Green
  'FFC107', // Amber
];

function generateAvatarUrl(displayName) {
  // 랜덤 배경색 선택
  const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  // 이름을 URL 인코딩
  const encodedName = encodeURIComponent(displayName);

  // UI Avatars URL 생성
  // - size: 200x200
  // - background: 랜덤 색상
  // - color: 흰색
  // - bold: true
  // - format: png
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&size=200&bold=true&format=png`;
}

async function addAvatarToUsers() {
  console.log('🎨 프로필 사진 없는 사용자에게 아바타 추가 시작...\n');

  const usersSnap = await db.collection('users').get();

  let totalUsers = 0;
  let usersUpdated = 0;
  let usersSkipped = 0;

  console.log(`📊 전체 사용자: ${usersSnap.size}명\n`);
  console.log('='.repeat(60));

  for (const doc of usersSnap.docs) {
    const user = doc.data();
    totalUsers++;

    // 위치 정보가 있고 프로필 사진이 없는 사용자만
    if (user.location && user.location.latitude && !user.photoURL) {
      const displayName = user.displayName || 'User';
      const avatarUrl = generateAvatarUrl(displayName);

      console.log(`\n✏️ ${displayName}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Avatar: ${avatarUrl}`);

      // Firestore 업데이트
      await db.collection('users').doc(doc.id).update({
        photoURL: avatarUrl,
      });

      usersUpdated++;
      console.log(`   ✅ 업데이트 완료`);
    } else if (user.photoURL) {
      usersSkipped++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료!`);
  console.log(`   📸 아바타 추가: ${usersUpdated}명`);
  console.log(`   ⏭️ 이미 사진 있음: ${usersSkipped}명`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
addAvatarToUsers().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
