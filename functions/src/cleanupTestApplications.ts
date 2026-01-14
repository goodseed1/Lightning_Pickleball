/**
 * Cloud Function for cleaning up test data in participation_applications
 * Deletes all documents in the collection while preserving the collection structure
 * ✅ [v2] Firebase Functions v2 API
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface CleanupTestApplicationsRequest {
  confirmationToken: string; // Safety measure: must be 'DELETE_ALL_TEST_DATA'
}

/**
 * Clean up all test applications from participation_applications collection
 * ⚠️ WARNING: This will delete ALL documents in the collection!
 *
 * @param request - Must include confirmationToken: 'DELETE_ALL_TEST_DATA'
 * @returns Success message with count of deleted documents
 */
export const cleanupTestApplications = onCall<CleanupTestApplicationsRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { confirmationToken } = request.data;

    // Safety check: require confirmation token
    if (confirmationToken !== 'DELETE_ALL_TEST_DATA') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid confirmation token. Must be "DELETE_ALL_TEST_DATA"'
      );
    }

    logger.warn('🧹 Starting cleanup of participation_applications collection', {
      userId: request.auth.uid,
      timestamp: new Date().toISOString(),
    });

    // Get all documents in participation_applications
    const applicationsSnapshot = await db.collection('participation_applications').get();

    if (applicationsSnapshot.empty) {
      logger.info('No documents to delete');
      return {
        success: true,
        message: 'No documents to delete',
        deletedCount: 0,
      };
    }

    const totalDocs = applicationsSnapshot.size;
    logger.info(`Found ${totalDocs} documents to delete`);

    // Delete in batches (Firestore batch limit is 500 operations)
    const batchSize = 500;
    let deletedCount = 0;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of applicationsSnapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;
      deletedCount++;

      // Commit batch when reaching batch size limit
      if (operationCount >= batchSize) {
        await batch.commit();
        logger.info(`Deleted batch of ${operationCount} documents`);
        batch = db.batch();
        operationCount = 0;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      logger.info(`Deleted final batch of ${operationCount} documents`);
    }

    logger.info(`✅ Cleanup complete: Deleted ${deletedCount} documents`, {
      totalDeleted: deletedCount,
      userId: request.auth.uid,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully deleted all ${deletedCount} test applications`,
      deletedCount: deletedCount,
    };
  } catch (error) {
    logger.error('❌ Error cleaning up test applications', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to cleanup test applications');
  }
});

export default {
  cleanupTestApplications,
};
