const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function check() {
  // 최근 5개 이벤트
  const eventsSnap = await db.collection('events').orderBy('createdAt', 'desc').limit(10).get();

  console.log('📅 최근 이벤트들:');
  eventsSnap.docs.forEach(doc => {
    const e = doc.data();
    if (e.gameType?.includes('doubles')) {
      console.log('  Event ID:', doc.id);
      console.log('    - hostName:', e.hostName);
      console.log('    - hostLtr:', e.hostLtr);
      console.log('    - hostLtrLevel:', e.hostLtrLevel);
      console.log('    - minLtr:', e.minLtr);
      console.log('    - maxLtr:', e.maxLtr);
      console.log('    - gameType:', e.gameType);
      console.log('');
    }
  });

  process.exit(0);
}
check();
