const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function check() {
  // 영철 찾기
  const usersSnap = await db.collection('users').where('displayName', '==', '영철').get();
  if (!usersSnap.empty) {
    const user = usersSnap.docs[0].data();
    console.log('👤 영철 사용자:');
    console.log('  - uid:', usersSnap.docs[0].id);
    console.log('  - eloRatings.doubles.current:', user.eloRatings?.doubles?.current);
    const elo = user.eloRatings?.doubles?.current || 1000;
    const ltr = Math.round((elo - 800) / 100 + 1);
    console.log('  - doublesLtr (계산):', ltr);
  }

  // 최근 이벤트 찾기 (영철이 host인)
  const eventsSnap = await db
    .collection('events')
    .where('hostName', '==', '영철')
    .orderBy('createdAt', 'desc')
    .limit(3)
    .get();

  console.log('\n📅 영철의 최근 이벤트들:');
  eventsSnap.docs.forEach(doc => {
    const e = doc.data();
    console.log('  Event ID:', doc.id);
    console.log('    - hostLtr:', e.hostLtr);
    console.log('    - minLtr:', e.minLtr);
    console.log('    - maxLtr:', e.maxLtr);
    console.log('    - gameType:', e.gameType);
    console.log('');
  });

  process.exit(0);
}
check();
