/**
 * Cleanup All Ghost Memberships
 * Find and delete all memberships pointing to non-existent clubs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function cleanupGhostMemberships() {
  console.log('🔍 Scanning ALL memberships for ghosts...\n');

  // 1. Get all valid club IDs
  const clubsSnapshot = await db.collection('pickleball_clubs').get();
  const validClubIds = new Set(clubsSnapshot.docs.map(doc => doc.id));
  console.log('✅ Valid clubs:', validClubIds.size);
  clubsSnapshot.docs.forEach(doc => {
    console.log(`   - ${doc.id}: ${doc.data().name || doc.data().profile?.name}`);
  });

  // 2. Get ALL memberships
  const membershipsSnapshot = await db.collection('clubMembers').get();
  console.log(`\n📋 Total memberships in clubMembers: ${membershipsSnapshot.size}`);

  // 3. Find ghosts
  const ghostMemberships = [];
  const validMemberships = [];

  for (const doc of membershipsSnapshot.docs) {
    const data = doc.data();
    if (!validClubIds.has(data.clubId)) {
      // Get user info
      let userName = 'Unknown';
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          userName = userDoc.data().displayName || userDoc.data().name || 'Unknown';
        }
      } catch (e) {}

      ghostMemberships.push({
        docId: doc.id,
        clubId: data.clubId,
        userId: data.userId,
        userName,
        role: data.role,
      });
    } else {
      validMemberships.push(doc.id);
    }
  }

  console.log(`\n✅ Valid memberships: ${validMemberships.length}`);
  console.log(`👻 Ghost memberships: ${ghostMemberships.length}`);

  if (ghostMemberships.length === 0) {
    console.log('\n🎉 No ghost memberships found! Database is clean.');
    return;
  }

  // 4. Show ghosts
  console.log('\n--- Ghost Memberships ---');
  ghostMemberships.forEach((m, i) => {
    console.log(`${i + 1}. ${m.userName} (${m.role})`);
    console.log(`   Doc: ${m.docId}`);
    console.log(`   Ghost Club: ${m.clubId}`);
  });

  // 5. Delete ghosts
  console.log('\n🗑️ Deleting ghost memberships...');
  const batch = db.batch();
  ghostMemberships.forEach(m => {
    const docRef = db.collection('clubMembers').doc(m.docId);
    batch.delete(docRef);
  });

  await batch.commit();
  console.log(`✅ Deleted ${ghostMemberships.length} ghost memberships!`);

  console.log('\n========================================');
  console.log('🧹 Cleanup complete!');
  console.log(`   Deleted: ${ghostMemberships.length}`);
  console.log(`   Remaining: ${validMemberships.length}`);
  console.log('========================================\n');
}

cleanupGhostMemberships()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
