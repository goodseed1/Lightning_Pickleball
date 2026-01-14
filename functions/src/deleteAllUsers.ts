/**
 * Cloud Function for deleting all Firebase Auth users and Firestore user documents
 * ⚠️ WARNING: This is a destructive operation - use only in development/test environments
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

export interface DeleteAllUsersRequest {
  confirmationToken: string; // Safety measure: must be 'DELETE_ALL_ACCOUNTS_PERMANENTLY'
}

/**
 * Delete all Firebase Auth accounts and Firestore user documents
 * ⚠️ DANGER: This will delete ALL users in the system!
 *
 * @param request - Must include confirmationToken: 'DELETE_ALL_ACCOUNTS_PERMANENTLY'
 * @returns Success message with counts of deleted Auth accounts and Firestore documents
 */
export const deleteAllUsers = onCall<DeleteAllUsersRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { confirmationToken } = request.data;

    // Safety check: require confirmation token
    if (confirmationToken !== 'DELETE_ALL_ACCOUNTS_PERMANENTLY') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid confirmation token. Must be "DELETE_ALL_ACCOUNTS_PERMANENTLY"'
      );
    }

    logger.warn('🚨 Starting deletion of ALL users (Auth + Firestore)', {
      userId: request.auth.uid,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Delete all Firebase Auth users
    let deletedAuthCount = 0;
    let nextPageToken: string | undefined;

    do {
      // List users in batches of 1000 (maximum allowed)
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

      const deleteAuthPromises = listUsersResult.users.map(async userRecord => {
        try {
          await admin.auth().deleteUser(userRecord.uid);
          deletedAuthCount++;
          logger.info(`Deleted Auth user: ${userRecord.uid}`);
        } catch (error) {
          logger.error(`Failed to delete Auth user ${userRecord.uid}:`, error);
        }
      });

      await Promise.all(deleteAuthPromises);

      nextPageToken = listUsersResult.pageToken;

      logger.info(`Deleted ${deletedAuthCount} Auth users so far...`);
    } while (nextPageToken);

    logger.info(`✅ Deleted ${deletedAuthCount} Firebase Auth accounts`);

    // Step 2: Delete all Firestore user documents
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      logger.info('No Firestore user documents to delete');
      return {
        success: true,
        message: `Deleted ${deletedAuthCount} Auth accounts, 0 Firestore user documents`,
        deletedAuthCount,
        deletedFirestoreCount: 0,
      };
    }

    const totalDocs = usersSnapshot.size;
    logger.info(`Found ${totalDocs} Firestore user documents to delete`);

    // Delete in batches (Firestore batch limit is 500 operations)
    const batchSize = 500;
    let deletedFirestoreCount = 0;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of usersSnapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;
      deletedFirestoreCount++;

      // Commit batch when reaching batch size limit
      if (operationCount >= batchSize) {
        await batch.commit();
        logger.info(`Deleted batch of ${operationCount} Firestore user documents`);
        batch = db.batch();
        operationCount = 0;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      logger.info(`Deleted final batch of ${operationCount} Firestore user documents`);
    }

    logger.info(
      `✅ Complete: Deleted ${deletedAuthCount} Auth accounts, ${deletedFirestoreCount} Firestore user documents`,
      {
        deletedAuthCount,
        deletedFirestoreCount,
        userId: request.auth.uid,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      message: `Successfully deleted ${deletedAuthCount} Auth accounts and ${deletedFirestoreCount} Firestore user documents`,
      deletedAuthCount,
      deletedFirestoreCount,
    };
  } catch (error) {
    logger.error('❌ Error deleting all users', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to delete all users');
  }
});

export default {
  deleteAllUsers,
};
