const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findUnknownMemberships() {
  console.log('🔍 Finding Unknown Club memberships...\n');

  // Get all club memberships
  const membersSnapshot = await db.collection('clubMembers').get();

  console.log(`📋 Total memberships: ${membersSnapshot.size}\n`);

  const unknownMemberships = [];
  const validMemberships = [];

  for (const doc of membersSnapshot.docs) {
    const data = doc.data();
    const clubId = data.clubId;

    // Check if club exists and has a name
    const clubDoc = await db.collection('pickleball_clubs').doc(clubId).get();
    const clubData = clubDoc.exists ? clubDoc.data() : null;
    const clubName = clubData?.name || clubData?.profile?.name;

    if (!clubDoc.exists || !clubName || clubName === '' || clubName === 'Unknown Club') {
      unknownMemberships.push({
        membershipId: doc.id,
        clubId,
        userId: data.userId,
        userName: data.name || data.displayName || '(no name)',
        role: data.role,
        clubExists: clubDoc.exists,
        clubName: clubName || '(no name)',
      });
    } else {
      validMemberships.push({
        clubId,
        clubName,
        membershipId: doc.id,
      });
    }
  }

  console.log('=== Unknown Club Memberships ===');
  console.log(`Found ${unknownMemberships.length} memberships to unknown/empty clubs\n`);

  // Group by clubId
  const byClub = {};
  unknownMemberships.forEach(m => {
    if (!byClub[m.clubId]) byClub[m.clubId] = [];
    byClub[m.clubId].push(m);
  });

  Object.entries(byClub).forEach(([clubId, members]) => {
    console.log(`\n🏢 Club ID: ${clubId}`);
    console.log(`   Club exists: ${members[0].clubExists}`);
    console.log(`   Club name: "${members[0].clubName}"`);
    console.log(`   Members: ${members.length}`);
    members.forEach(m => {
      console.log(`     - ${m.userName} (${m.role}) - membership: ${m.membershipId}`);
    });
  });

  console.log('\n=== Valid Clubs Summary ===');
  const validByClub = {};
  validMemberships.forEach(m => {
    if (!validByClub[m.clubId]) validByClub[m.clubId] = { name: m.clubName, count: 0 };
    validByClub[m.clubId].count++;
  });
  Object.entries(validByClub).forEach(([clubId, info]) => {
    console.log(`✅ ${info.name}: ${info.count} members`);
  });

  process.exit(0);
}

findUnknownMemberships().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
