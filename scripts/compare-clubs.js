/**
 * Compare Lightning Tennis Club vs Suwanee Weekend Warriors memberships
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const LIGHTNING_CLUB_ID = 'WsetxkWODywjt0BBcqrs';
const SUWANEE_CLUB_ID = 'dRxu8Xnwmfoj0zzyQjVu';

async function compareClubs() {
  console.log('🔍 Comparing club membership structures...\n');

  // Lightning Tennis Club
  console.log('=== Lightning Tennis Club ===');
  const lightningMembers = await db
    .collection('club_memberships')
    .where('clubId', '==', LIGHTNING_CLUB_ID)
    .limit(3)
    .get();

  console.log('Total members:', lightningMembers.size, '(showing first 3)');
  lightningMembers.docs.forEach(doc => {
    console.log('\nDoc ID:', doc.id);
    console.log('Fields:', Object.keys(doc.data()).sort().join(', '));
    console.log('Data:', JSON.stringify(doc.data(), null, 2));
  });

  // Suwanee Weekend Warriors
  console.log('\n\n=== Suwanee Weekend Warriors ===');
  const suwaneeMembers = await db
    .collection('club_memberships')
    .where('clubId', '==', SUWANEE_CLUB_ID)
    .limit(3)
    .get();

  console.log('Total members:', suwaneeMembers.size, '(showing first 3)');
  suwaneeMembers.docs.forEach(doc => {
    console.log('\nDoc ID:', doc.id);
    console.log('Fields:', Object.keys(doc.data()).sort().join(', '));
    console.log('Data:', JSON.stringify(doc.data(), null, 2));
  });
}

compareClubs()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
