const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkUsers() {
  const usersSnapshot = await db.collection('users').get();

  console.log('📊 모든 사용자 상세 정보:\n');

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const name = data.profile?.displayName || data.displayName || 'Unknown';
    const location = data.profile?.location?.city || data.location?.city || 'No location';
    const isDiscoverable = data.settings?.privacy?.isDiscoverable;
    const profileComplete = data.profile?.isComplete;

    console.log('👤', name);
    console.log('   - ID:', doc.id.substring(0, 12) + '...');
    console.log('   - 위치:', location);
    console.log('   - 검색 가능:', isDiscoverable !== undefined ? isDiscoverable : 'undefined');
    console.log('   - 프로필 완료:', profileComplete !== undefined ? profileComplete : 'undefined');
    console.log('');
  });

  process.exit(0);
}

checkUsers();
