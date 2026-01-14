/**
 * Inspect Club Data Script
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function inspectClub() {
  const clubId = 'dRxu8Xnwmfoj0zzyQjVu';
  console.log(`🔍 Inspecting club: ${clubId}\n`);

  const doc = await db.collection('pickleball_clubs').doc(clubId).get();

  if (!doc.exists) {
    console.log('Club not found!');
    return;
  }

  const data = doc.data();
  console.log('Full data:');
  console.log(JSON.stringify(data, null, 2));
}

inspectClub()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
