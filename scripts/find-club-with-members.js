const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findClubWithMembers() {
  console.log('🔍 Finding clubs with members...\n');

  const clubsSnapshot = await db.collection('tennis_clubs').get();

  console.log(`📋 Total clubs: ${clubsSnapshot.size}\n`);

  for (const clubDoc of clubsSnapshot.docs) {
    const clubData = clubDoc.data();

    // Check members subcollection
    const membersSnapshot = await db
      .collection('tennis_clubs')
      .doc(clubDoc.id)
      .collection('members')
      .get();

    console.log(`🏢 Club ID: ${clubDoc.id}`);
    console.log(`   Name: "${clubData.name || '(empty)'}"`);
    console.log(`   memberCount field: ${clubData.memberCount || 0}`);
    console.log(`   Actual members in subcollection: ${membersSnapshot.size}`);
    console.log(`   Location: ${clubData.location || clubData.address || '(none)'}`);
    console.log(`   Logo: ${clubData.logoUrl ? 'Yes' : 'No'}`);
    console.log('');

    // Print all fields
    console.log('   All fields:', JSON.stringify(clubData, null, 2));
    console.log('---');
  }

  process.exit(0);
}

findClubWithMembers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
