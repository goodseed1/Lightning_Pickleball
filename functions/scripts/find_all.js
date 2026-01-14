const admin = require('firebase-admin');
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/service-account-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function findAllTestUsers() {
  console.log('🔍 모든 test 계정 검색 중...\n');
  const usersSnapshot = await db.collection('users').get();
  const results = [];

  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const email = userData.email || '';
    const displayName = userData.displayName || userData.name || 'N/A';
    if (email.includes('test')) {
      results.push({ name: displayName, email: email });
    }
  });

  results.sort((a, b) => a.name.localeCompare(b.name));
  console.log('📧 모든 테스트 사용자:\n');
  results.forEach(user => console.log(user.name + ' : ' + user.email));
  console.log('\n✅ 총 ' + results.length + '명');
}

findAllTestUsers()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
