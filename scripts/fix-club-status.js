/**
 * Fix Club Status Script
 *
 * Adds 'status: active' to clubs that are missing the status field.
 * This is needed for clubs that were restored from deletion.
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

async function fixClubStatus() {
  console.log('🔍 Finding clubs without status field...\n');

  const clubsRef = db.collection('tennis_clubs');
  const snapshot = await clubsRef.get();

  let fixed = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (!data.status) {
      console.log(`📝 Fixing: ${data.name || doc.id}`);
      console.log(`   ID: ${doc.id}`);

      await doc.ref.update({
        status: 'active',
      });

      console.log(`   ✅ Added status: 'active'\n`);
      fixed++;
    } else {
      console.log(`⏭️  Skipping: ${data.name || doc.id} (status: ${data.status})`);
      skipped++;
    }
  }

  console.log('\n========== Summary ==========');
  console.log(`✅ Fixed: ${fixed} clubs`);
  console.log(`⏭️  Skipped: ${skipped} clubs`);
  console.log('==============================\n');
}

fixClubStatus()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
