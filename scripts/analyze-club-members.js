const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function analyzeClubMembers() {
  console.log('🔍 Analyzing clubMembers collection...\n');

  const membersSnapshot = await db.collection('clubMembers').get();

  console.log(`📋 Total clubMembers documents: ${membersSnapshot.size}\n`);

  // Group by clubId (first part of document ID before underscore)
  const byClub = {};

  membersSnapshot.forEach(doc => {
    const docId = doc.id;
    const data = doc.data();

    // Extract clubId from document ID (format: clubId_userId)
    const clubId = data.clubId || docId.split('_')[0];

    if (!byClub[clubId]) {
      byClub[clubId] = {
        members: [],
        clubName: null,
      };
    }

    byClub[clubId].members.push({
      docId,
      userId: data.userId,
      name: data.name || data.displayName || '(no name)',
      role: data.role || 'member',
      status: data.status || 'active',
    });
  });

  // Print summary
  console.log('=== Clubs by Member Count ===\n');

  const sortedClubs = Object.entries(byClub).sort(
    (a, b) => b[1].members.length - a[1].members.length
  );

  for (const [clubId, clubData] of sortedClubs) {
    // Get club info from pickleball_clubs
    try {
      const clubDoc = await db.collection('pickleball_clubs').doc(clubId).get();
      const clubInfo = clubDoc.exists ? clubDoc.data() : null;

      console.log(`🏢 Club ID: ${clubId}`);
      console.log(`   Name in pickleball_clubs: "${clubInfo?.name || '(not found/empty)'}"`);
      console.log(`   Member Count: ${clubData.members.length}`);
      console.log(`   Members:`);

      clubData.members.slice(0, 5).forEach(m => {
        console.log(`     - ${m.name} (role: ${m.role}, status: ${m.status})`);
      });

      if (clubData.members.length > 5) {
        console.log(`     ... and ${clubData.members.length - 5} more`);
      }
      console.log('');
    } catch (e) {
      console.log(`   Error getting club info: ${e.message}`);
    }
  }

  process.exit(0);
}

analyzeClubMembers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
