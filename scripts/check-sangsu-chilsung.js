const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkUsers() {
  const names = ['상수', '칠성'];

  for (const name of names) {
    const snapshot = await db
      .collection('users')
      .where('profile.displayName', '==', name)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤', name);
      console.log('📊 singles.elo:', userData?.stats?.publicStats?.singles?.elo || 'N/A');
      console.log('📊 doubles.elo:', userData?.stats?.publicStats?.doubles?.elo || 'N/A');
      console.log(
        '📊 eloRatings.singles:',
        userData?.eloRatings?.singles?.current || userData?.eloRatings?.singles || 'N/A'
      );
      console.log(
        '📊 eloRatings.doubles:',
        userData?.eloRatings?.doubles?.current || userData?.eloRatings?.doubles || 'N/A'
      );
    } else {
      console.log('❌', name, '찾을 수 없음');
    }
  }
  process.exit(0);
}

checkUsers();
