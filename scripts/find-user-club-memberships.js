const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findUserClubMemberships() {
  console.log('🔍 Searching for club memberships in users collection...\n');

  // Check users collection for clubMemberships
  const usersSnapshot = await db.collection('users').get();

  console.log(`📋 Total users: ${usersSnapshot.size}\n`);

  const usersWithClubs = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();

    // Check for clubs array or clubMemberships
    const clubs = userData.clubs || [];
    const clubMemberships = userData.clubMemberships || [];
    const myClubs = userData.myClubs || [];

    if (clubs.length > 0 || clubMemberships.length > 0 || myClubs.length > 0) {
      usersWithClubs.push({
        id: userDoc.id,
        displayName: userData.displayName || userData.name || '(no name)',
        clubs,
        clubMemberships,
        myClubs,
      });
    }
  }

  console.log(`👥 Users with club data: ${usersWithClubs.length}\n`);

  usersWithClubs.forEach((user, i) => {
    console.log(`\n[${i + 1}] User: ${user.displayName} (ID: ${user.id})`);
    if (user.clubs.length > 0) {
      console.log('   clubs:', JSON.stringify(user.clubs, null, 2));
    }
    if (user.clubMemberships.length > 0) {
      console.log('   clubMemberships:', JSON.stringify(user.clubMemberships, null, 2));
    }
    if (user.myClubs.length > 0) {
      console.log('   myClubs:', JSON.stringify(user.myClubs, null, 2));
    }
  });

  // Also check club_members collection
  console.log('\n\n📋 Checking club_members collection...');
  const clubMembersSnapshot = await db.collection('club_members').get();
  console.log(`Total club_members docs: ${clubMembersSnapshot.size}`);

  if (clubMembersSnapshot.size > 0) {
    clubMembersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: clubId=${data.clubId}, userId=${data.userId}, role=${data.role}`);
    });
  }

  // Check tennis_clubs for reference
  console.log('\n\n📋 Current tennis_clubs:');
  const clubsSnapshot = await db.collection('tennis_clubs').get();
  clubsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  - ID: ${doc.id}, Name: "${data.name || '(empty)'}"`);
  });

  process.exit(0);
}

findUserClubMemberships().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
