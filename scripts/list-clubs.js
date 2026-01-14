/**
 * List All Clubs Script
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function listClubs() {
  console.log('🎾 Listing all clubs...\n');

  const clubsRef = db.collection('pickleball_clubs');
  const snapshot = await clubsRef.get();

  console.log(`Found ${snapshot.size} clubs:\n`);

  snapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`${i + 1}. ${data.name}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Members: ${data.memberCount || 'N/A'}`);
    console.log(`   Status: ${data.status || 'N/A'}`);
    console.log('');
  });
}

listClubs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
