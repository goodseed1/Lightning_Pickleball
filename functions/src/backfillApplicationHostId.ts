/**
 * 🎯 [KIM FIX] Backfill hostId for existing participation_applications
 *
 * This is a one-time migration function to add hostId to applications
 * that were created before the fix was deployed.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Backfill hostId for all participation_applications that don't have it
 */
export const backfillApplicationHostId = onCall(async request => {
  const { auth } = request;

  // Only allow authenticated users
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    logger.info('🎯 [BACKFILL] Starting hostId backfill for applications');

    // Get all applications that don't have hostId
    const applicationsSnapshot = await db.collection('participation_applications').get();

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process in batches
    const batch = db.batch();
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
        logger.warn(`⚠️ [BACKFILL] Application ${appDoc.id} has no eventId`);
        errorCount++;
        continue;
      }

      try {
        const eventDoc = await db.collection('events').doc(appData.eventId).get();

        if (!eventDoc.exists) {
          logger.warn(
            `⚠️ [BACKFILL] Event ${appData.eventId} not found for application ${appDoc.id}`
          );
          errorCount++;
          continue;
        }

        const eventData = eventDoc.data();
        const hostId = eventData?.hostId || eventData?.createdBy;

        if (!hostId) {
          logger.warn(`⚠️ [BACKFILL] Event ${appData.eventId} has no hostId`);
          errorCount++;
          continue;
        }

        // Add to batch update
        batch.update(appDoc.ref, { hostId });
        batchCount++;
        updatedCount++;

        // Commit batch if it reaches max size
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          logger.info(`✅ [BACKFILL] Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } catch (error) {
        logger.error(`❌ [BACKFILL] Error processing application ${appDoc.id}:`, error);
        errorCount++;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      logger.info(`✅ [BACKFILL] Committed final batch of ${batchCount} updates`);
    }

    const result = {
      success: true,
      message: `Backfill completed: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`,
      updatedCount,
      skippedCount,
      errorCount,
    };

    logger.info('🎯 [BACKFILL] Completed', result);
    return result;
  } catch (error: unknown) {
    logger.error('❌ [BACKFILL] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Backfill failed', errorMessage);
  }
});
