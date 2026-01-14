/**
 * Delete Jong's Ghost Club Membership
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const GHOST_MEMBERSHIP_DOC_ID = 'Vi6CyxkHpULMZ7v2ArLv_IcF8Pih3UoOchh7GRmYzrF75ijq2';

async function deleteGhostMembership() {
  console.log("🗑️ Deleting Jong's ghost membership...\n");

  const docRef = db.collection('clubMembers').doc(GHOST_MEMBERSHIP_DOC_ID);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.log('❌ Document not found!');
    return;
  }

  console.log('📋 Document to delete:');
  console.log(JSON.stringify(docSnap.data(), null, 2));

  // Delete
  await docRef.delete();
  console.log('\n✅ Ghost membership deleted!');
}

deleteGhostMembership()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
