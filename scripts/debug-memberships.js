/**
 * Debug Suwanee Memberships - Show full document structure
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const CLUB_ID = 'dRxu8Xnwmfoj0zzyQjVu';

async function debugMemberships() {
  console.log('🔍 Debugging memberships for Suwanee Weekend Warriors...\n');

  const membershipsRef = db.collection('club_memberships');
  const snapshot = await membershipsRef.where('clubId', '==', CLUB_ID).get();

  console.log('Total documents found:', snapshot.size);

  // Show Grace Johnson's membership (admin)
  console.log('\n=== Admin Membership (Grace Johnson) ===');
  const adminMembership = snapshot.docs.find(doc => doc.data().role === 'admin');
  if (adminMembership) {
    console.log('Doc ID:', adminMembership.id);
    console.log('Full data:', JSON.stringify(adminMembership.data(), null, 2));
  }

  // Show one regular member for comparison
  console.log('\n=== Sample Regular Membership ===');
  const regularMembership = snapshot.docs.find(doc => doc.data().role === 'member');
  if (regularMembership) {
    console.log('Doc ID:', regularMembership.id);
    console.log('Full data:', JSON.stringify(regularMembership.data(), null, 2));
  }

  // Check if there's any difference in field structure
  console.log('\n=== All membership doc IDs and statuses ===');
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(
      `  ${doc.id} | role: ${data.role} | status: ${data.status} | userId: ${data.userId?.substring(0, 8)}...`
    );
  });
}

debugMemberships()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
