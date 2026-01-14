const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkUsers() {
  // Check specific users from Firebase Auth
  const emailsToCheck = [
    'stevesbaek@gmail.com',
    'coollife72@naver.com',
    'marthasco@gmail.com',
    'isaacfreeman714@gmail.com',
  ];

  console.log('=== Firebase Auth 사용자들의 Firestore 상태 확인 ===\n');

  // Get all users and check their status
  const usersSnapshot = await db.collection('users').get();

  console.log(`총 ${usersSnapshot.size}명의 Firestore 사용자\n`);
  console.log('--- 모든 사용자 상태 ---\n');

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const hasProperName = data.name && data.name !== 'Player' && data.name.trim() !== '';
    const hasLocation = !!data.profile?.location;
    const isOnboardingComplete = data.isOnboardingComplete;

    console.log(`📧 ${data.email || doc.id}`);
    console.log(`   이름: ${data.name || '(없음)'} ${hasProperName ? '✅' : '❌'}`);
    console.log(`   displayName: ${data.displayName || '(없음)'}`);
    console.log(
      `   isOnboardingComplete: ${isOnboardingComplete} ${isOnboardingComplete === true ? '✅' : '❌'}`
    );
    console.log(`   위치: ${hasLocation ? '있음 ✅' : '없음 ❌'}`);
    console.log(`   표시 여부: ${hasProperName ? '🟢 보임' : '🔴 안 보임'}`);
    console.log('');
  });

  process.exit(0);
}

checkUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
