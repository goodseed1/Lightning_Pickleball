/**
 * 🏷️ Nickname Service
 * Client-side service for checking nickname availability
 * Uses Cloud Function for server-side validation
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import i18n from '../i18n';

// Response type from Cloud Function
export interface CheckNicknameResponse {
  available: boolean;
  reason?: 'taken' | 'invalid' | 'reserved' | 'too_short' | 'too_long';
  normalizedNickname?: string;
}

// Map Cloud Function reasons to i18n keys
const REASON_TO_I18N_KEY: Record<NonNullable<CheckNicknameResponse['reason']>, string> = {
  taken: 'services.nickname.taken',
  invalid: 'services.nickname.invalid',
  reserved: 'services.nickname.reserved',
  too_short: 'services.nickname.tooShort',
  too_long: 'services.nickname.tooLong',
};

/**
 * Nickname validation status for UI
 */
export type NicknameStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

/**
 * Service for nickname operations
 */
export const nicknameService = {
  /**
   * Check if a nickname is available
   * @param nickname - Nickname to check
   * @returns CheckNicknameResponse with availability status
   */
  async checkAvailability(nickname: string): Promise<CheckNicknameResponse> {
    try {
      const checkNickname = httpsCallable<{ nickname: string }, CheckNicknameResponse>(
        functions,
        'checkNicknameAvailability'
      );
      const result = await checkNickname({ nickname });
      return result.data;
    } catch (error: unknown) {
      console.error('🏷️ [NicknameService] Error checking nickname availability:', error);
      // Return error response instead of throwing
      return {
        available: false,
        reason: 'invalid',
      };
    }
  },

  /**
   * Get error message for nickname validation reason
   * @param reason - Validation failure reason
   * @returns Localized error message using i18n
   */
  getErrorMessage(reason: NonNullable<CheckNicknameResponse['reason']>): string {
    const i18nKey = REASON_TO_I18N_KEY[reason];
    return i18nKey ? i18n.t(i18nKey) : i18n.t('services.nickname.invalid');
  },

  /**
   * Client-side validation (quick check before calling Cloud Function)
   * @param nickname - Nickname to validate
   * @returns Validation result with reason if invalid
   */
  validateLocally(nickname: string): { valid: boolean; reason?: CheckNicknameResponse['reason'] } {
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
    if (!/^[a-zA-Z0-9가-힣\s]+$/.test(trimmed)) {
      return { valid: false, reason: 'invalid' };
    }

    return { valid: true };
  },
};

export default nicknameService;
