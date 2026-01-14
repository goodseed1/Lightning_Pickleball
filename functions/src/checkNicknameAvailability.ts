/**
 * 🏷️ Nickname Availability Checker
 * Cloud Function for checking if a nickname is available
 * Part of the unique nickname enforcement system
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Reserved nicknames that cannot be used
const RESERVED_NICKNAMES = [
  'admin',
  'administrator',
  'system',
  'lightning',
  'tennis',
  'lightningtennis',
  'support',
  'help',
  'moderator',
  'mod',
  'official',
];

export interface CheckNicknameRequest {
  nickname: string;
}

export interface CheckNicknameResponse {
  available: boolean;
  reason?: 'taken' | 'invalid' | 'reserved' | 'too_short' | 'too_long';
  normalizedNickname?: string;
}

/**
 * Normalize nickname for comparison (case-insensitive, trim whitespace)
 * @param nickname - Original nickname
 * @returns Normalized nickname for storage/comparison
 */
export function normalizeNickname(nickname: string): string {
  return nickname
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Validate nickname format
 * @param nickname - Nickname to validate
 * @returns Validation result with error reason if invalid
 */
function validateNickname(nickname: string): { valid: boolean; reason?: CheckNicknameResponse['reason'] } {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, reason: 'invalid' };
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 2) {
    return { valid: false, reason: 'too_short' };
  }

  if (trimmed.length > 20) {
    return { valid: false, reason: 'too_long' };
  }

  // Allow letters (including Korean), numbers, and spaces
  // This regex allows: a-z, A-Z, 0-9, Korean characters (가-힣), and spaces
  if (!/^[a-zA-Z0-9가-힣\s]+$/.test(trimmed)) {
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true };
}

/**
 * 🏷️ Check Nickname Availability
 * Callable Cloud Function to verify if a nickname can be used
 *
 * @param request - Contains nickname to check
 * @returns CheckNicknameResponse with availability status
 */
export const checkNicknameAvailability = onCall<CheckNicknameRequest>(async (request) => {
  // 1. Verify authentication
  if (!request.auth) {
    logger.warn('🏷️ [Nickname] Unauthenticated request');
    throw new HttpsError('unauthenticated', 'You must be logged in to check nickname availability.');
  }

  const { nickname } = request.data;
  const userId = request.auth.uid;

  logger.info('🏷️ [Nickname] Checking availability', {
    nickname,
    userId,
    timestamp: new Date().toISOString(),
  });

  // 2. Validate nickname format
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    logger.info('🏷️ [Nickname] Invalid format', { nickname, reason: validation.reason });
    return {
      available: false,
      reason: validation.reason,
    } as CheckNicknameResponse;
  }

  // 3. Normalize for comparison
  const normalized = normalizeNickname(nickname);

  // 4. Check reserved nicknames
  if (RESERVED_NICKNAMES.includes(normalized)) {
    logger.info('🏷️ [Nickname] Reserved nickname attempted', { nickname, normalized });
    return {
      available: false,
      reason: 'reserved',
      normalizedNickname: normalized,
    } as CheckNicknameResponse;
  }

  try {
    // 5. Check nickname_index collection first (fast lookup)
    const indexDoc = await db.collection('nickname_index').doc(normalized).get();

    if (indexDoc.exists) {
      // 6. Check if it's the user's own nickname
      const indexData = indexDoc.data();
      if (indexData?.uid === userId) {
        // User's current nickname - allow
        logger.info('🏷️ [Nickname] Own nickname (from index)', { nickname, userId });
        return {
          available: true,
          normalizedNickname: normalized,
        } as CheckNicknameResponse;
      }

      // 7. Nickname is taken by another user
      logger.info('🏷️ [Nickname] Taken (from index)', { nickname, normalized, existingOwner: indexData?.uid });
      return {
        available: false,
        reason: 'taken',
        normalizedNickname: normalized,
      } as CheckNicknameResponse;
    }

    // 8. Fallback: Check users collection directly (for legacy users not in index)
    // This handles users created before nickname_index was implemented
    logger.info('🏷️ [Nickname] Not in index, checking users collection', { nickname, normalized });

    // Check nickname field (exact match - case sensitive)
    const nicknameQuery = await db.collection('users')
      .where('nickname', '==', nickname.trim())
      .limit(1)
      .get();

    if (!nicknameQuery.empty) {
      const existingUser = nicknameQuery.docs[0];
      // Check if it's the user's own nickname
      if (existingUser.id === userId) {
        logger.info('🏷️ [Nickname] Own nickname (from users)', { nickname, userId });
        return {
          available: true,
          normalizedNickname: normalized,
        } as CheckNicknameResponse;
      }

      // Nickname is taken by another user (legacy user not in index)
      logger.info('🏷️ [Nickname] Taken (legacy user)', { nickname, normalized, existingOwner: existingUser.id });

      // Migration on-the-fly: Add this to nickname_index for future lookups
      try {
        await db.collection('nickname_index').doc(normalized).set({
          uid: existingUser.id,
          originalNickname: existingUser.data()?.nickname || nickname,
          createdAt: new Date(),
          migratedFromLegacy: true,
        });
        logger.info('🏷️ [Nickname] Migrated legacy nickname to index', { normalized, uid: existingUser.id });
      } catch (migrationError) {
        logger.warn('🏷️ [Nickname] Failed to migrate legacy nickname', { migrationError });
      }

      return {
        available: false,
        reason: 'taken',
        normalizedNickname: normalized,
      } as CheckNicknameResponse;
    }

    // 9. Also check displayName field (some users might have nickname in displayName)
    const displayNameQuery = await db.collection('users')
      .where('displayName', '==', nickname.trim())
      .limit(1)
      .get();

    if (!displayNameQuery.empty) {
      const existingUser = displayNameQuery.docs[0];
      if (existingUser.id === userId) {
        logger.info('🏷️ [Nickname] Own displayName', { nickname, userId });
        return {
          available: true,
          normalizedNickname: normalized,
        } as CheckNicknameResponse;
      }

      logger.info('🏷️ [Nickname] Taken (displayName)', { nickname, normalized, existingOwner: existingUser.id });

      // Migration on-the-fly
      try {
        await db.collection('nickname_index').doc(normalized).set({
          uid: existingUser.id,
          originalNickname: existingUser.data()?.displayName || nickname,
          createdAt: new Date(),
          migratedFromLegacy: true,
        });
        logger.info('🏷️ [Nickname] Migrated displayName to index', { normalized, uid: existingUser.id });
      } catch (migrationError) {
        logger.warn('🏷️ [Nickname] Failed to migrate displayName', { migrationError });
      }

      return {
        available: false,
        reason: 'taken',
        normalizedNickname: normalized,
      } as CheckNicknameResponse;
    }

    // 10. Nickname is available
    logger.info('🏷️ [Nickname] Available', { nickname, normalized });
    return {
      available: true,
      normalizedNickname: normalized,
    } as CheckNicknameResponse;
  } catch (error) {
    logger.error('🏷️ [Nickname] Error checking availability', { error, nickname });
    throw new HttpsError('internal', 'Failed to check nickname availability. Please try again.');
  }
});
