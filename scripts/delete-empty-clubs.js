const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const CLUBS_TO_DELETE = ['8h6PLuDkhVsvkpIWtacn', 'Vi6CyxkHpULMZ7v2ArLv', 'WsetxkWODywjt0BBcqrs'];

async function deleteEmptyClubs() {
  console.log('🗑️ Deleting empty clubs...\n');

  for (const clubId of CLUBS_TO_DELETE) {
    try {
      // Check if club exists
      const clubDoc = await db.collection('tennis_clubs').doc(clubId).get();

      if (!clubDoc.exists) {
        console.log(`⚠️ Club ${clubId} not found (already deleted?)`);
        continue;
      }

      const clubData = clubDoc.data();
      console.log(
        `🔍 Found: "${clubData.name || '(empty)'}" - Members: ${clubData.memberCount || 0}`
      );

      // Delete the club document
      await db.collection('tennis_clubs').doc(clubId).delete();
      console.log(`✅ Deleted: ${clubId}\n`);
    } catch (error) {
      console.error(`❌ Error deleting ${clubId}:`, error.message);
    }
  }

  console.log('🎉 Done! All empty clubs deleted.');

  // Verify
  console.log('\n📋 Remaining clubs:');
  const remaining = await db.collection('tennis_clubs').get();
  if (remaining.empty) {
    console.log('   (no clubs remaining)');
  } else {
    remaining.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name || '(empty)'} (ID: ${doc.id})`);
    });
  }

  process.exit(0);
}

deleteEmptyClubs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
