const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function findAllMembersEverywhere() {
  console.log('🔍 Searching for members across all collections...\n');

  // 1. Check collectionGroup 'members'
  console.log('=== collectionGroup "members" ===');
  try {
    const membersGroup = await db.collectionGroup('members').get();
    console.log(`Total: ${membersGroup.size} documents\n`);

    // Group by parent path
    const byParent = {};
    membersGroup.forEach(doc => {
      const parentPath = doc.ref.parent.parent?.path || 'root';
      if (!byParent[parentPath]) byParent[parentPath] = [];
      byParent[parentPath].push(doc.id);
    });

    Object.entries(byParent).forEach(([path, members]) => {
      console.log(`  ${path}: ${members.length} members`);
    });
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }

  // 2. List all top-level collections
  console.log('\n=== Top-level collections ===');
  const collections = await db.listCollections();
  for (const col of collections) {
    const snapshot = await col.limit(1).get();
    const count = (await col.count().get()).data().count;
    console.log(`  ${col.id}: ${count} documents`);

    // Check if it has members-related data
    if (col.id.toLowerCase().includes('club') || col.id.toLowerCase().includes('member')) {
      const sample = await col.limit(3).get();
      sample.forEach(doc => {
        const data = doc.data();
        console.log(`    Sample: ${doc.id}`);
        if (data.memberCount !== undefined) console.log(`      memberCount: ${data.memberCount}`);
        if (data.name) console.log(`      name: ${data.name}`);
      });
    }
  }

  // 3. Check specific club-related collections
  const clubCollections = ['clubs', 'tennis_clubs', 'club_members', 'club_memberships'];
  console.log('\n=== Checking club-related collections ===');
  for (const colName of clubCollections) {
    try {
      const snapshot = await db.collection(colName).get();
      console.log(`\n${colName}: ${snapshot.size} documents`);
      if (snapshot.size > 0 && snapshot.size <= 10) {
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log(
            `  - ${doc.id}: name="${data.name || '(no name)'}", members=${data.memberCount || 'N/A'}`
          );
        });
      }
    } catch (e) {
      console.log(`${colName}: (not found or error)`);
    }
  }

  process.exit(0);
}

findAllMembersEverywhere().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
