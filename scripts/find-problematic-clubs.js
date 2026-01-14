const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findProblematicClubs() {
  console.log('🔍 Searching for problematic clubs...\n');

  const clubsSnapshot = await db.collection('tennis_clubs').get();

  const problematicClubs = [];
  const allClubs = [];

  clubsSnapshot.forEach(doc => {
    const data = doc.data();
    const name = data.name || '';
    const nameLower = name.toLowerCase();

    allClubs.push({
      id: doc.id,
      name: name || '(empty)',
      memberCount: data.memberCount || 0,
    });

    // Check for problematic names
    if (
      !name ||
      name.trim() === '' ||
      nameLower.includes('unknown') ||
      nameLower.includes('test') ||
      nameLower === 'undefined'
    ) {
      problematicClubs.push({
        id: doc.id,
        name: name || '(empty)',
        createdAt: data.createdAt ? data.createdAt.toDate() : 'N/A',
        memberCount: data.memberCount || 0,
        ownerId: data.ownerId || 'N/A',
      });
    }
  });

  console.log('📋 Total clubs:', clubsSnapshot.size);
  console.log('⚠️  Problematic clubs found:', problematicClubs.length);
  console.log('');

  if (problematicClubs.length > 0) {
    console.log('=== Problematic Clubs ===');
    problematicClubs.forEach((club, i) => {
      console.log(`\n[${i + 1}] ID: ${club.id}`);
      console.log(`    Name: "${club.name}"`);
      console.log(`    Members: ${club.memberCount}`);
      console.log(`    Owner: ${club.ownerId}`);
      console.log(`    Created: ${club.createdAt}`);
    });
  } else {
    console.log('✅ No problematic clubs found with "unknown", "test", or empty names!');
  }

  console.log('\n=== All Clubs ===');
  allClubs.forEach((club, i) => {
    console.log(`[${i + 1}] ${club.name} (ID: ${club.id}, Members: ${club.memberCount})`);
  });

  process.exit(0);
}

findProblematicClubs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
