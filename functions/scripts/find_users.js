const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findUsers() {
  const targetNames = ['won', '철이', '숙이', '정이', '남이', '누님'];

  console.log('🔍 사용자 검색 중...\n');

  const usersSnapshot = await db.collection('users').get();

  const results = [];

  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const displayName = userData.displayName || userData.name || '';

    // Check if displayName matches any of the target names
    if (targetNames.some(name => displayName.toLowerCase().includes(name.toLowerCase()))) {
      results.push({
        name: displayName,
        email: userData.email || 'N/A',
        uid: doc.id,
      });
    }
  });

  // Sort by name
  results.sort((a, b) => a.name.localeCompare(b.name));

  console.log('📧 사용자 이메일 목록:\n');
  results.forEach(user => {
    console.log(user.name + ' : ' + user.email);
  });

  console.log('\n✅ 총 ' + results.length + '명의 사용자를 찾았습니다.');
}

findUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
