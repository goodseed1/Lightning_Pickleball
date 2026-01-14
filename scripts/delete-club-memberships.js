/**
 * Delete club_memberships Collection
 *
 * This collection is deprecated - all membership data is now in 'clubMembers'
 *
 * ROLLBACK COMMIT: d27a9548
 * To restore: git checkout d27a9548 -- src/services/feeService.ts
 *
 * The backup JSON file is saved before deletion.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function deleteClubMemberships() {
  console.log('🗑️ Deleting club_memberships collection...\n');

  // 1. Get all documents
  const snapshot = await db.collection('club_memberships').get();

  if (snapshot.empty) {
    console.log('✅ Collection is already empty!');
    return;
  }

  console.log(`📋 Found ${snapshot.size} documents to delete`);

  // 2. Backup data to JSON file
  const backupData = [];
  snapshot.docs.forEach(doc => {
    backupData.push({
      id: doc.id,
      data: doc.data(),
    });
  });

  const backupPath = path.join(__dirname, `club_memberships_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`💾 Backup saved to: ${backupPath}`);

  // 3. Delete in batches (Firestore limit is 500 per batch)
  const batchSize = 500;
  let deletedCount = 0;

  while (deletedCount < snapshot.size) {
    const batch = db.batch();
    const docsToDelete = snapshot.docs.slice(deletedCount, deletedCount + batchSize);

    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += docsToDelete.length;
    console.log(`  🗑️ Deleted ${deletedCount}/${snapshot.size} documents`);
  }

  console.log('\n========================================');
  console.log(`✅ Successfully deleted ${snapshot.size} documents from club_memberships`);
  console.log(`💾 Backup file: ${backupPath}`);
  console.log('========================================\n');
}

deleteClubMemberships()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
