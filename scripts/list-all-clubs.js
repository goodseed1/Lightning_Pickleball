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

async function findAllClubs() {
  const clubsRef = db.collection('pickleball_clubs');
  const snapshot = await clubsRef.get();

  console.log('🔍 Found', snapshot.size, 'clubs in pickleball_clubs collection:\n');

  snapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    const name = data.name || data.profile?.name || '(no name)';
    const status = data.status || '(no status)';
    const memberCount = data.memberCount || data.statistics?.totalMembers || 0;
    const adminId = data.adminId || data.ownerId || data.createdBy || '(unknown)';

    console.log('========================================');
    console.log(`#${i + 1} Club: ${name}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Status: ${status}`);
    console.log(`   Members: ${memberCount}`);
    console.log(`   Admin: ${adminId}`);
  });
}

findAllClubs()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
