/**
 * 🔒 [TOP SECRET] Set Admin Custom Claim
 *
 * Cloud Function to check admin list and set isAdmin custom claim for authorized users
 * - Checks _internal/admins document for superAdmins list
 * - Sets custom claim { isAdmin: true } if user is in the list
 * - Sets custom claim { isAdmin: false } if user is not in the list
 *
 * Security:
 * - Only authenticated users can call this function
 * - Admin list is maintained in Firestore _internal/admins document
 * - PM must manually add UIDs to the superAdmins array
 *
 * @author Thor (토르)
 * @date 2025-12-14
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface SetAdminClaimResponse {
  success: boolean;
  isAdmin: boolean;
  message: string;
}

/**
 * Set admin custom claim for authenticated user
 */
export const setAdminClaim = onCall<void, Promise<SetAdminClaimResponse>>(async request => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;

  logger.info('🔒 [ADMIN_CLAIM] Checking admin status for user', { uid });

  try {
    // 2. Get admin list from _internal/admins document
    const adminDocRef = db.collection('_internal').doc('admins');
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
      logger.warn('🔒 [ADMIN_CLAIM] Admin list document not found - no admins configured');

      // Set isAdmin to false since no admin list exists
      await admin.auth().setCustomUserClaims(uid, { isAdmin: false });

      return {
        success: true,
        isAdmin: false,
        message: 'Not an admin user (no admin list configured)',
      };
    }

    // 3. Check if user is in superAdmins array
    const adminData = adminDoc.data();
    const superAdmins: string[] = adminData?.superAdmins || [];

    const isAdmin = superAdmins.includes(uid);

    // 4. Set custom claim
    await admin.auth().setCustomUserClaims(uid, { isAdmin });

    logger.info('🔒 [ADMIN_CLAIM] Successfully set admin claim', {
      uid,
      isAdmin,
      superAdminsCount: superAdmins.length,
    });

    return {
      success: true,
      isAdmin: isAdmin,
      message: isAdmin
        ? 'Admin claim successfully set - you are an admin'
        : 'User is not in admin list - regular user access',
    };
  } catch (error) {
    logger.error('🔒 [ADMIN_CLAIM] Error setting admin claim', {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      'internal',
      'Failed to set admin claim',
      error instanceof Error ? error.message : String(error)
    );
  }
});
