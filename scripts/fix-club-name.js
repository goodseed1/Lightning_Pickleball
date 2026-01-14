/**
 * Fix Club Name Field Script
 *
 * Adds root-level 'name' field to clubs that only have it in profile.name
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function fixClubNames() {
  console.log('🔍 Finding clubs without root-level name field...\n');

  const clubsRef = db.collection('tennis_clubs');
  const snapshot = await clubsRef.get();

  let fixed = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const rootName = data.name;
    const profileName = data.profile?.name;

    if (!rootName && profileName) {
      console.log(`📝 Fixing: ${profileName}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Root name: ${rootName || '(missing)'}`);
      console.log(`   Profile name: ${profileName}`);

      await doc.ref.update({
        name: profileName,
      });

      console.log(`   ✅ Added root-level name: '${profileName}'\n`);
      fixed++;
    } else if (rootName) {
      console.log(`⏭️  Skipping: ${rootName} (already has root name)`);
      skipped++;
    } else {
      console.log(`⚠️  Warning: ${doc.id} has no name anywhere!`);
    }
  }

  console.log('\n========== Summary ==========');
  console.log(`✅ Fixed: ${fixed} clubs`);
  console.log(`⏭️  Skipped: ${skipped} clubs`);
  console.log('==============================\n');
}

fixClubNames()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
