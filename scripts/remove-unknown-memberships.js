const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function removeUnknownMemberships() {
  console.log('🗑️ Removing Unknown Club memberships...\n');

  // The two Unknown Clubs that don't have corresponding pickleball_clubs documents
  const unknownClubIds = [
    'hT0bQaKvCGeyDxE4mceu', // Club doesn't exist - 3 members
    'wNkDRLXKErzdKHqCzCgg', // Club doesn't exist - 2 members
  ];

  // Also the one with empty name
  const emptyNameClubId = '8h6PLuDkhVsvkpIWtacn';

  console.log('=== Step 1: Remove memberships for non-existent clubs ===\n');

  for (const clubId of unknownClubIds) {
    console.log(`\n🏢 Processing Club ID: ${clubId}`);

    // Find all memberships for this club
    const membershipsQuery = await db.collection('clubMembers').where('clubId', '==', clubId).get();

    console.log(`   Found ${membershipsQuery.size} memberships`);

    for (const doc of membershipsQuery.docs) {
      const data = doc.data();
      console.log(`   🗑️ Deleting membership: ${doc.id}`);
      console.log(`      User: ${data.name || data.displayName || data.userId}`);
      console.log(`      Role: ${data.role}`);

      await doc.ref.delete();
      console.log(`      ✅ Deleted!`);
    }
  }

  console.log('\n=== Step 2: Delete empty pickleball_clubs documents ===\n');

  // Delete the pickleball_clubs documents that have no name
  const emptyClubs = [emptyNameClubId, ...unknownClubIds];

  for (const clubId of emptyClubs) {
    const clubRef = db.collection('pickleball_clubs').doc(clubId);
    const clubDoc = await clubRef.get();

    if (clubDoc.exists) {
      console.log(`🏢 Deleting empty club: ${clubId}`);
      console.log(`   Name: "${clubDoc.data().name || '(no name)'}"`);
      await clubRef.delete();
      console.log(`   ✅ Deleted!`);
    } else {
      console.log(`⚠️ Club ${clubId} doesn't exist (already deleted or never existed)`);
    }
  }

  console.log('\n=== Verification ===\n');

  // Verify
  const remainingMemberships = await db.collection('clubMembers').get();
  console.log(`Total remaining memberships: ${remainingMemberships.size}`);

  // Group by club
  const byClub = {};
  for (const doc of remainingMemberships.docs) {
    const clubId = doc.data().clubId;
    if (!byClub[clubId]) byClub[clubId] = 0;
    byClub[clubId]++;
  }

  for (const [clubId, count] of Object.entries(byClub)) {
    const clubDoc = await db.collection('pickleball_clubs').doc(clubId).get();
    const clubName = clubDoc.exists
      ? clubDoc.data().name || clubDoc.data().profile?.name
      : '(club deleted)';
    console.log(`   ${clubName}: ${count} members`);
  }

  console.log('\n✅ Cleanup complete!');
  process.exit(0);
}

removeUnknownMemberships().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
