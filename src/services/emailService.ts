/**
 * 📧 Email Service
 * Client-side service for checking email availability during sign up
 * Uses Cloud Function (checkEmailAvailability) with Admin SDK
 *
 * Note: We use Cloud Function instead of client-side fetchSignInMethodsForEmail
 * because Firebase's Email Enumeration Protection (enabled by default since Sept 2023)
 * always returns empty array for security reasons.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import i18n from '../i18n';

// Email validation reasons
export type EmailValidationReason = 'taken' | 'invalid_format' | 'empty';

// Response type for email availability check (matches Cloud Function response)
export interface CheckEmailResponse {
  available: boolean;
  reason?: EmailValidationReason;
}

// Map validation reasons to i18n keys
const REASON_TO_I18N_KEY: Record<EmailValidationReason, string> = {
  taken: 'services.email.taken',
  invalid_format: 'services.email.invalidFormat',
  empty: 'services.email.empty',
};

/**
 * Email validation status for UI
 */
export type EmailStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

/**
 * Service for email operations
 */
export const emailService = {
  /**
   * Check if an email is available for registration
   * Uses Cloud Function with Admin SDK's getUserByEmail
   * @param email - Email to check
   * @returns CheckEmailResponse with availability status
   */
  async checkAvailability(email: string): Promise<CheckEmailResponse> {
    try {
      // First validate locally for quick feedback
      const localValidation = this.validateLocally(email);
      if (!localValidation.valid) {
        return {
          available: false,
          reason: localValidation.reason,
        };
      }

      // Call Cloud Function for authoritative check
      const checkEmail = httpsCallable<{ email: string }, CheckEmailResponse>(
        functions,
        'checkEmailAvailability'
      );
      const result = await checkEmail({ email: email.toLowerCase().trim() });
      return result.data;
    } catch (error: unknown) {
      console.error('📧 [EmailService] Error checking email availability:', error);

      // Return error response instead of failing open
      // This is safer - user can still try to sign up and get Firebase's error
      return {
        available: false,
        reason: 'invalid_format',
      };
    }
  },

  /**
   * Get error message for email validation reason
   * @param reason - Validation failure reason
   * @returns Localized error message using i18n
   */
  getErrorMessage(reason: EmailValidationReason): string {
    const i18nKey = REASON_TO_I18N_KEY[reason];
    return i18nKey ? i18n.t(i18nKey) : i18n.t('services.email.invalidFormat');
  },

  /**
   * Client-side validation (quick check before calling Cloud Function)
   * @param email - Email to validate
   * @returns Validation result with reason if invalid
   */
  validateLocally(email: string): { valid: boolean; reason?: EmailValidationReason } {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'empty' };
    }

    const trimmed = email.trim();

    if (trimmed.length === 0) {
      return { valid: false, reason: 'empty' };
    }

    // Basic email format validation
    // More permissive than RFC 5322 but catches obvious mistakes
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, reason: 'invalid_format' };
    }

    return { valid: true };
  },
};

export default emailService;
