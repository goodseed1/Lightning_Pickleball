const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkUserStructure() {
  console.log('🔍 사용자 데이터 구조 확인...\n');

  // 몇 명의 사용자 데이터 확인
  const usersSnapshot = await db.collection('users').limit(5).get();

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    console.log('='.repeat(60));
    console.log('User ID:', doc.id);
    console.log('');
    console.log('Root level displayName:', data.displayName);
    console.log('Root level name:', data.name);
    console.log('');
    console.log('profile.displayName:', data.profile?.displayName);
    console.log('profile.name:', data.profile?.name);
    console.log('');
    console.log('Has profile field:', !!data.profile);
    if (data.profile) {
      console.log('profile keys:', Object.keys(data.profile));
    }
  }

  process.exit(0);
}

checkUserStructure().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
