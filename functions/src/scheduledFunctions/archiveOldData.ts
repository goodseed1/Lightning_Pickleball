/**
 * 🗄️ [DATA ARCHIVING] Automatic archiving and TTL system
 *
 * Scheduled Cloud Function to archive cancelled events and applications
 *
 * **Archiving Criteria**:
 * - Status contains 'cancelled' (any variant)
 * - Document is older than 6 months (180 days)
 * - Based on cancelledAt, processedAt, or updatedAt timestamp
 *
 * **Collections Archived**:
 * 1. participation_applications → participation_applications_archive
 * 2. events → events_archive
 *
 * **TTL Policy**:
 * - Archived documents are kept for 1 year (365 days)
 * - Set archiveExpiresAt field to current time + 1 year
 * - TTL must be configured manually in Firebase Console
 *
 * **Schedule**: Runs daily at 2 AM (cron: '0 2 * * *')
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Constants
const SIX_MONTHS_IN_MS = 180 * 24 * 60 * 60 * 1000; // 6 months in milliseconds
const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
const MAX_BATCH_SIZE = 500; // Firestore batch limit

interface CollectionPair {
  source: string;
  archive: string;
  description: string;
}

const COLLECTION_PAIRS: CollectionPair[] = [
  {
    source: 'participation_applications',
    archive: 'participation_applications_archive',
    description: 'Participation Applications',
  },
  {
    source: 'events',
    archive: 'events_archive',
    description: 'Events',
  },
];

/**
 * Check if a document is eligible for archiving
 */
function isEligibleForArchiving(data: FirebaseFirestore.DocumentData): boolean {
  // Check if status contains 'cancelled'
  const status = data.status?.toLowerCase() || '';
  if (!status.includes('cancelled')) {
    return false;
  }

  // Get timestamp (try cancelledAt, processedAt, updatedAt in order)
  const timestamp = data.cancelledAt || data.processedAt || data.updatedAt;
  if (!timestamp) {
    return false;
  }

  // Convert Firestore Timestamp to milliseconds
  const timestampMs = timestamp.toMillis ? timestamp.toMillis() : timestamp;
  const ageMs = Date.now() - timestampMs;

  // Check if older than 6 months
  return ageMs >= SIX_MONTHS_IN_MS;
}

/**
 * Archive documents from source to archive collection
 */
async function archiveCollection(
  sourceCollection: string,
  archiveCollection: string
): Promise<{ archivedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let archivedCount = 0;

  try {
    // Query all documents in source collection
    const snapshot = await db.collection(sourceCollection).get();

    if (snapshot.empty) {
      logger.info(`No documents found in ${sourceCollection}`);
      return { archivedCount: 0, errors: [] };
    }

    // Filter eligible documents
    const eligibleDocs = snapshot.docs.filter(doc => isEligibleForArchiving(doc.data()));

    if (eligibleDocs.length === 0) {
      logger.info(`No eligible documents to archive in ${sourceCollection}`);
      return { archivedCount: 0, errors: [] };
    }

    logger.info(
      `Found ${eligibleDocs.length} eligible documents to archive in ${sourceCollection}`
    );

    // Process in batches (Firestore batch limit: 500)
    for (let i = 0; i < eligibleDocs.length; i += MAX_BATCH_SIZE) {
      const batchDocs = eligibleDocs.slice(i, i + MAX_BATCH_SIZE);
      const batch = db.batch();

      // Set archive expiration timestamp (current time + 1 year)
      const archiveExpiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + ONE_YEAR_IN_MS);

      for (const doc of batchDocs) {
        const data = doc.data();

        // Add to archive collection with TTL field
        const archiveRef = db.collection(archiveCollection).doc(doc.id);
        batch.set(archiveRef, {
          ...data,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          archiveExpiresAt: archiveExpiresAt,
          originalId: doc.id,
        });

        // Delete from source collection
        batch.delete(doc.ref);
      }

      try {
        await batch.commit();
        archivedCount += batchDocs.length;
        logger.info(`Archived batch of ${batchDocs.length} documents from ${sourceCollection}`);
      } catch (error) {
        const errorMsg = `Failed to archive batch in ${sourceCollection}: ${error}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Failed to process ${sourceCollection}: ${error}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
  }

  return { archivedCount, errors };
}

/**
 * Scheduled function to archive old cancelled data
 * Runs daily at 2 AM
 */
export const archiveOldData = onSchedule(
  {
    schedule: '0 2 * * *', // Daily at 2 AM (cron format)
    timeZone: 'Asia/Seoul', // Adjust to your timezone
    memory: '256MiB',
    timeoutSeconds: 540, // 9 minutes (max for scheduled functions)
  },
  async () => {
    logger.info('🗄️ [ARCHIVING] Starting scheduled archiving job...');

    const results = {
      totalArchived: 0,
      collectionResults: [] as Array<{
        collection: string;
        archived: number;
        errors: string[];
      }>,
    };

    // Process each collection pair
    for (const pair of COLLECTION_PAIRS) {
      logger.info(`📦 [ARCHIVING] Processing ${pair.description}...`);

      const { archivedCount, errors } = await archiveCollection(pair.source, pair.archive);

      results.totalArchived += archivedCount;
      results.collectionResults.push({
        collection: pair.description,
        archived: archivedCount,
        errors,
      });

      logger.info(`✅ [ARCHIVING] ${pair.description}: Archived ${archivedCount} documents`);

      if (errors.length > 0) {
        logger.warn(`⚠️ [ARCHIVING] ${pair.description}: Encountered ${errors.length} errors`);
      }
    }

    // Log summary
    logger.info(
      `🎉 [ARCHIVING] Archiving job completed! Total archived: ${results.totalArchived} documents`
    );

    // Log collection-specific results
    for (const result of results.collectionResults) {
      logger.info(`  - ${result.collection}: ${result.archived} documents`);
      if (result.errors.length > 0) {
        logger.error(`    Errors: ${result.errors.join(', ')}`);
      }
    }

    // Don't return anything (void) for scheduled functions
  }
);
