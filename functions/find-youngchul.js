const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function findUser() {
  const allUsers = await db.collection('users').get();
  for (const doc of allUsers.docs) {
    const data = doc.data();
    const nickname = data.profile?.nickname || data.nickname || '';
    if (nickname.includes('영철') || nickname.includes('Jong') || nickname === 'Jong') {
      console.log('\n=== 사용자 발견 ===');
      console.log('UID:', doc.id);
      console.log('Nickname:', nickname);
      console.log('ELO Ratings:', JSON.stringify(data.eloRatings, null, 2));
      console.log('Stats publicStats:', JSON.stringify(data.stats?.publicStats, null, 2));
      console.log('Skill Level:', JSON.stringify(data.skillLevel, null, 2));
    }
  }
}

findUser()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
