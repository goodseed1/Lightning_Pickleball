/**
 * 📧 Email Availability Checker
 * Cloud Function for checking if an email is available for registration
 *
 * Note: We use Admin SDK's getUserByEmail because client-side
 * fetchSignInMethodsForEmail always returns empty array due to
 * Firebase's Email Enumeration Protection (enabled by default since Sept 2023)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  available: boolean;
  reason?: 'taken' | 'invalid_format' | 'empty';
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Validation result with error reason if invalid
 */
function validateEmail(email: string): { valid: boolean; reason?: CheckEmailResponse['reason'] } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'empty' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'invalid_format' };
  }

  return { valid: true };
}

/**
 * 📧 Check Email Availability
 * Callable Cloud Function to verify if an email can be used for registration
 *
 * Note: This function does NOT require authentication because it's called
 * during sign-up before the user has an account. Rate limiting should be
 * applied at the infrastructure level to prevent enumeration attacks.
 *
 * @param request - Contains email to check
 * @returns CheckEmailResponse with availability status
 */
export const checkEmailAvailability = onCall<CheckEmailRequest>(async (request) => {
  // Note: We allow unauthenticated requests for sign-up flow
  // Rate limiting should be configured in Firebase to prevent abuse

  const { email } = request.data;

  logger.info('📧 [Email] Checking availability', {
    email: email ? `${email.substring(0, 3)}***` : 'empty', // Log partial email for privacy
    timestamp: new Date().toISOString(),
  });

  // 1. Validate email format
  const validation = validateEmail(email);
  if (!validation.valid) {
    logger.info('📧 [Email] Invalid format', { reason: validation.reason });
    return {
      available: false,
      reason: validation.reason,
    } as CheckEmailResponse;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 2. Check if email exists in Firebase Auth using Admin SDK
    await admin.auth().getUserByEmail(normalizedEmail);

    // If we get here, the user exists
    logger.info('📧 [Email] Already registered', {
      email: `${normalizedEmail.substring(0, 3)}***`,
    });
    return {
      available: false,
      reason: 'taken',
    } as CheckEmailResponse;
  } catch (error: unknown) {
    const authError = error as { code?: string };

    // 3. If user not found, email is available
    if (authError.code === 'auth/user-not-found') {
      logger.info('📧 [Email] Available', {
        email: `${normalizedEmail.substring(0, 3)}***`,
      });
      return {
        available: true,
      } as CheckEmailResponse;
    }

    // 4. Handle other errors
    if (authError.code === 'auth/invalid-email') {
      logger.info('📧 [Email] Invalid email format (Auth)', { email: normalizedEmail });
      return {
        available: false,
        reason: 'invalid_format',
      } as CheckEmailResponse;
    }

    // 5. Unexpected error - log and fail open (allow registration attempt)
    logger.error('📧 [Email] Unexpected error', { error, email: normalizedEmail });
    throw new HttpsError('internal', 'Failed to check email availability. Please try again.');
  }
});
