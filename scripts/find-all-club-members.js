const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findAllClubMembers() {
  console.log('🔍 Searching for club members in subcollections...\n');

  // Get all pickleball_clubs
  const clubsSnapshot = await db.collection('pickleball_clubs').get();

  console.log(`📋 Total clubs: ${clubsSnapshot.size}\n`);

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();
    console.log(`\n🏢 Club: "${clubData.name || '(empty)'}" (ID: ${clubDoc.id})`);

    // Check members subcollection
    const membersSnapshot = await db
      .collection('pickleball_clubs')
      .doc(clubDoc.id)
      .collection('members')
      .get();

    if (membersSnapshot.empty) {
      console.log('   members: (empty subcollection)');
    } else {
      console.log(`   members: ${membersSnapshot.size} members`);
      membersSnapshot.forEach(memberDoc => {
        const memberData = memberDoc.data();
        console.log(
          `     - ${memberDoc.id}: ${memberData.displayName || memberData.name || '(no name)'} (role: ${memberData.role || 'N/A'})`
        );
      });
    }
  }

  // Also check if there's a separate 'club_memberships' collection
  console.log('\n\n📋 Checking club_memberships collection...');
  const membershipsSnapshot = await db.collection('club_memberships').get();
  console.log(`Total club_memberships docs: ${membershipsSnapshot.size}`);

  if (!membershipsSnapshot.empty) {
    membershipsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: clubId=${data.clubId}, userId=${data.userId}`);
    });
  }

  process.exit(0);
}

findAllClubMembers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
