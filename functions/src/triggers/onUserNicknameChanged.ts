/**
 * 🏷️ [HEIMDALL] User Nickname Change Trigger
 *
 * Automatically manages nickname_index collection when user profile changes:
 * 1. New user with nickname → Create index entry
 * 2. Nickname changed → Delete old index, create new index
 * 3. User deleted → Remove index entry
 *
 * Trigger: users/{userId} onDocumentWritten
 *
 * Actions:
 *  - Detect nickname changes
 *  - Atomic transaction for index updates
 *  - Prevents duplicate nicknames at database level
 */

import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { normalizeNickname } from '../checkNicknameAvailability';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Extract nickname from user document data
 * Checks multiple possible locations for nickname
 */
function extractNickname(userData: FirebaseFirestore.DocumentData | undefined): string | null {
  if (!userData) return null;

  // Check profile.nickname first (primary location)
  if (userData.profile?.nickname && typeof userData.profile.nickname === 'string') {
    return userData.profile.nickname.trim() || null;
  }

  // Check displayName as fallback
  if (userData.displayName && typeof userData.displayName === 'string') {
    return userData.displayName.trim() || null;
  }

  // Check nickname at root level
  if (userData.nickname && typeof userData.nickname === 'string') {
    return userData.nickname.trim() || null;
  }

  return null;
}

/**
 * Main trigger function for user document changes
 */
export const onUserNicknameChanged = onDocumentWritten(
  'users/{userId}',
  async event => {
    const userId = event.params.userId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    logger.info('🏷️ [NICKNAME TRIGGER] User document changed', {
      userId,
      hasBeforeData: !!beforeData,
      hasAfterData: !!afterData,
    });

    // Extract nicknames from before and after
    const beforeNickname = extractNickname(beforeData);
    const afterNickname = extractNickname(afterData);

    // Normalize nicknames for comparison
    const normalizedBefore = beforeNickname ? normalizeNickname(beforeNickname) : null;
    const normalizedAfter = afterNickname ? normalizeNickname(afterNickname) : null;

    // Check if nickname actually changed
    if (normalizedBefore === normalizedAfter) {
      logger.info('🏷️ [NICKNAME TRIGGER] No nickname change detected, skipping', {
        userId,
        nickname: normalizedAfter,
      });
      return null;
    }

    logger.info('🏷️ [NICKNAME TRIGGER] Nickname change detected', {
      userId,
      before: beforeNickname,
      after: afterNickname,
      normalizedBefore,
      normalizedAfter,
    });

    try {
      // Use transaction to ensure atomicity
      await db.runTransaction(async transaction => {
        // Step 1: Remove old nickname index (if exists)
        if (normalizedBefore) {
          const oldIndexRef = db.collection('nickname_index').doc(normalizedBefore);
          const oldIndexDoc = await transaction.get(oldIndexRef);

          if (oldIndexDoc.exists) {
            const oldIndexData = oldIndexDoc.data();
            // Only delete if this user owns the index entry
            if (oldIndexData?.uid === userId) {
              logger.info('🏷️ [NICKNAME TRIGGER] Removing old nickname index', {
                nickname: normalizedBefore,
                userId,
              });
              transaction.delete(oldIndexRef);
            } else {
              logger.warn('🏷️ [NICKNAME TRIGGER] Old nickname owned by different user', {
                nickname: normalizedBefore,
                expectedOwner: userId,
                actualOwner: oldIndexData?.uid,
              });
            }
          }
        }

        // Step 2: Create new nickname index (if exists)
        if (normalizedAfter && afterNickname) {
          const newIndexRef = db.collection('nickname_index').doc(normalizedAfter);
          const newIndexDoc = await transaction.get(newIndexRef);

          if (newIndexDoc.exists) {
            const existingData = newIndexDoc.data();
            // Check if it's already owned by this user
            if (existingData?.uid === userId) {
              logger.info('🏷️ [NICKNAME TRIGGER] Nickname already indexed for this user', {
                nickname: normalizedAfter,
                userId,
              });
              // Update the record with current timestamp
              transaction.update(newIndexRef, {
                originalNickname: afterNickname,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            } else {
              // Nickname taken by another user - this shouldn't happen if
              // checkNicknameAvailability was called, but log as warning
              logger.error('🏷️ [NICKNAME TRIGGER] Nickname already taken!', {
                nickname: normalizedAfter,
                requestingUser: userId,
                existingOwner: existingData?.uid,
              });
              // Don't throw - the user document is already saved, just log the issue
              // This indicates a race condition or bypass of the availability check
            }
          } else {
            // Create new index entry
            logger.info('🏷️ [NICKNAME TRIGGER] Creating new nickname index', {
              nickname: normalizedAfter,
              originalNickname: afterNickname,
              userId,
            });
            transaction.set(newIndexRef, {
              uid: userId,
              originalNickname: afterNickname,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      });

      logger.info('🏷️ [NICKNAME TRIGGER] Transaction completed successfully', {
        userId,
        oldNickname: normalizedBefore,
        newNickname: normalizedAfter,
      });

      return { success: true, userId, normalizedBefore, normalizedAfter };
    } catch (error) {
      logger.error('🏷️ [NICKNAME TRIGGER] Transaction failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - we don't want to fail the original user document write
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
);
