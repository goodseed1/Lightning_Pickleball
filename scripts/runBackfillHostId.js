/**
 * 🎯 [KIM FIX] Script to call backfillApplicationHostId Cloud Function
 *
 * Run with: node scripts/runBackfillHostId.js
 */

const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function runBackfill() {
  console.log('🎯 Starting hostId backfill...');

  try {
    // Get all applications that don't have hostId
    const applicationsSnapshot = await db.collection('participation_applications').get();

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Use batched writes
    let batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    for (const appDoc of applicationsSnapshot.docs) {
      const appData = appDoc.data();

      // Skip if already has hostId
      if (appData.hostId) {
        skippedCount++;
        continue;
      }

      // Get the event to find hostId
      if (!appData.eventId) {
        console.warn(`⚠️ Application ${appDoc.id} has no eventId`);
        errorCount++;
        continue;
      }

      try {
        const eventDoc = await db.collection('events').doc(appData.eventId).get();

        if (!eventDoc.exists) {
          console.warn(`⚠️ Event ${appData.eventId} not found for application ${appDoc.id}`);
          errorCount++;
          continue;
        }

        const eventData = eventDoc.data();
        const hostId = eventData?.hostId || eventData?.createdBy;

        if (!hostId) {
          console.warn(`⚠️ Event ${appData.eventId} has no hostId`);
          errorCount++;
          continue;
        }

        // Add to batch update
        batch.update(appDoc.ref, { hostId });
        batchCount++;
        updatedCount++;

        console.log(`✅ Queued update for application ${appDoc.id} with hostId ${hostId}`);

        // Commit batch if it reaches max size
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      } catch (error) {
        console.error(`❌ Error processing application ${appDoc.id}:`, error.message);
        errorCount++;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} updates`);
    }

    console.log('\n🎯 Backfill completed:');
    console.log(`  - Updated: ${updatedCount}`);
    console.log(`  - Skipped (already had hostId): ${skippedCount}`);
    console.log(`  - Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
  }

  process.exit(0);
}

runBackfill();
