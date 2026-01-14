/**
 * Find Jong's Ghost Club
 * Check clubMembers for memberships pointing to non-existent clubs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function findGhostClub() {
  console.log('🔍 Finding Jong (goodseed1@gmail.com) ghost club...\n');

  // 1. Find Jong's user ID
  const usersSnapshot = await db
    .collection('users')
    .where('email', '==', 'goodseed1@gmail.com')
    .get();

  if (usersSnapshot.empty) {
    console.log('❌ User not found!');
    return;
  }

  const jongDoc = usersSnapshot.docs[0];
  const jongId = jongDoc.id;
  console.log('👤 Jong User ID:', jongId);
  console.log('👤 Jong Name:', jongDoc.data().displayName || jongDoc.data().name);

  // 2. Get all valid club IDs
  const clubsSnapshot = await db.collection('tennis_clubs').get();
  const validClubIds = new Set(clubsSnapshot.docs.map(doc => doc.id));
  console.log('\n✅ Valid clubs:', validClubIds.size);
  clubsSnapshot.docs.forEach(doc => {
    console.log(`   - ${doc.id}: ${doc.data().name || doc.data().profile?.name}`);
  });

  // 3. Check Jong's memberships
  console.log("\n📋 Jong's memberships in clubMembers:");
  const membershipsSnapshot = await db
    .collection('clubMembers')
    .where('userId', '==', jongId)
    .get();

  console.log(`Found ${membershipsSnapshot.size} membership(s)`);

  const ghostMemberships = [];
  membershipsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const isGhost = !validClubIds.has(data.clubId);
    const status = isGhost ? '👻 GHOST' : '✅ Valid';
    console.log(`\n   ${status}`);
    console.log(`   Doc ID: ${doc.id}`);
    console.log(`   Club ID: ${data.clubId}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Status: ${data.status}`);

    if (isGhost) {
      ghostMemberships.push({ docId: doc.id, data });
    }
  });

  // 4. Summary
  console.log('\n========================================');
  console.log(`👻 Ghost memberships found: ${ghostMemberships.length}`);
  ghostMemberships.forEach(m => {
    console.log(`   - Doc: ${m.docId} → Club: ${m.data.clubId}`);
  });
  console.log('========================================\n');

  return ghostMemberships;
}

findGhostClub()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
