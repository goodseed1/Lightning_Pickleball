import { Timestamp } from 'firebase/firestore';

/**
 * Union type for various timestamp formats that can be safely converted to Date
 * Supports Firebase Timestamps, Date objects, numbers, strings, and null/undefined
 */
type TimestampInput =
  | Date
  | Timestamp
  | { toDate(): Date }
  | { seconds: number; nanoseconds: number }
  | { _methodName: string }
  | number
  | string
  | null
  | undefined;

/**
 * Context for error tracking and debugging
 */
interface ForensicContext {
  itemId?: string;
  fieldName?: string;
  functionName?: string;
}

/**
 * 🛡️ Universal Timestamp Converter with ENHANCED Forensic Tracking
 *
 * Safely converts any timestamp format to JavaScript Date object.
 * Includes multiple layers of protection against data corruption and runtime errors.
 * NOW WITH ENHANCED FORENSIC CALLER TRACKING TO CATCH THE CULPRIT!
 *
 * Supported input formats:
 * - Firebase Firestore Timestamp objects
 * - JavaScript Date objects
 * - Unix timestamps (number, milliseconds or seconds)
 * - ISO date strings
 * - null/undefined
 *
 * @param timestamp - The timestamp to convert (any supported format)
 * @param context - ENHANCED forensic context for deep investigation
 * @returns JavaScript Date object or null
 */
export function safeToDate(
  timestamp: TimestampInput,
  context: ForensicContext | string = {}
): Date | null {
  // 🔄 Backward compatibility: string parameter becomes functionName
  const forensicContext: ForensicContext =
    typeof context === 'string' ? { functionName: context } : context;

  const { itemId, fieldName, functionName = 'unknown' } = forensicContext;

  try {
    // 🛡️ Defense Layer 1: Handle null/undefined
    if (timestamp === null || timestamp === undefined) {
      return null;
    }

    // 🛡️ Defense Layer 2: Firebase serverTimestamp placeholder
    if (
      timestamp &&
      typeof timestamp === 'object' &&
      '_methodName' in timestamp &&
      timestamp._methodName === 'serverTimestamp'
    ) {
      return new Date(); // Use current time for serverTimestamp placeholders
    }

    // 🛡️ Defense Layer 3: Empty object corruption detection
    if (
      timestamp &&
      typeof timestamp === 'object' &&
      !timestamp.constructor?.name?.includes('Date') &&
      !('toDate' in timestamp)
    ) {
      const keys = Object.keys(timestamp);
      const jsonString = JSON.stringify(timestamp);

      // Critical defense against empty objects {}
      if (keys.length === 0 || jsonString === '{}') {
        // 🔍 FORENSIC AUDIT: ULTRA-INTENSIFIED logging to trace the TRUE culprit
        console.error(
          `🚫🚫🚫 [FORENSIC AUDIT] CRITICAL DATA CORRUPTION DETECTED! 🚫🚫🚫` +
            `\n┌────────────────────────────────────────────────────┐` +
            `\n│  THIS IS THE SMOKING GUN - THE CULPRIT IS HERE!   │` +
            `\n└────────────────────────────────────────────────────┘` +
            `\n  🔴 Caller Function: ${functionName || 'UNKNOWN - CRITICAL'}` +
            `\n  🔴 Item ID: ${itemId || 'NO_ID_PROVIDED'}` +
            `\n  🔴 Field Name: ${fieldName || 'NO_FIELD_NAME'}` +
            `\n  🔴 Corrupted Value: ${jsonString}` +
            `\n  📊 Timestamp Type: ${typeof timestamp}` +
            `\n  📊 Object Keys: [${keys.join(', ')}]` +
            `\n  📊 Constructor: ${timestamp.constructor?.name || 'Unknown'}` +
            `\n  📊 Prototype: ${Object.getPrototypeOf(timestamp)?.constructor?.name || 'Unknown'}` +
            `\n  📊 Has toDate: ${'toDate' in timestamp}` +
            `\n  📊 Has seconds: ${'seconds' in timestamp}` +
            `\n  📊 Has nanoseconds: ${'nanoseconds' in timestamp}` +
            `\n  📊 hasOwnProperty('toDate'): ${Object.hasOwnProperty.call(timestamp, 'toDate')}` +
            `\n  ⏰ Detection Time: ${new Date().toISOString()}` +
            `\n  ⏰ Timestamp (ms): ${Date.now()}`
        );

        // 🔍 Complete stack trace for deep investigation
        console.trace('🕵️🕵️🕵️ COMPLETE STACK TRACE - THE CULPRIT PATH IS HERE:');

        // 🔍 Additional runtime context with MORE detail
        console.error(`🔍🔍🔍 [FORENSIC CONTEXT] ENHANCED INVESTIGATION DATA:`, {
          callerFunction: functionName,
          itemId: itemId,
          fieldName: fieldName,
          corruptedData: timestamp,
          dataType: typeof timestamp,
          isArray: Array.isArray(timestamp),
          isObject: typeof timestamp === 'object',
          isNull: timestamp === null,
          isUndefined: timestamp === undefined,
          stringified: jsonString,
          keysFound: keys,
          keyCount: keys.length,
          timestamp: new Date().toISOString(),
        });

        // 🛡️ ULTRA-SAFE: Return current time with defensive validation
        const fallbackDate = new Date();
        if (isNaN(fallbackDate.getTime())) {
          // Even this fallback failed somehow, use epoch
          return new Date(0);
        }
        return fallbackDate; // Safe fallback to prevent crashes
      }
    }

    // 🛡️ Defense Layer 4: Valid Date object
    if (timestamp instanceof Date) {
      // Additional validation for valid dates
      if (isNaN(timestamp.getTime())) {
        console.warn(`⚠️ [safeToDate] Invalid Date object in ${functionName}. Using current time.`);
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }
      return timestamp;
    }

    // 🛡️ Defense Layer 5: Firebase Firestore Timestamp
    if (
      timestamp &&
      typeof timestamp === 'object' &&
      'toDate' in timestamp &&
      typeof timestamp.toDate === 'function'
    ) {
      try {
        return timestamp.toDate();
      } catch {
        console.warn(
          `⚠️ [safeToDate] Failed to convert Firestore timestamp in ${functionName}. Using current time.`
        );
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }
    }

    // 🛡️ Defense Layer 6: Firestore Timestamp object format
    if (
      timestamp &&
      typeof timestamp === 'object' &&
      'seconds' in timestamp &&
      'nanoseconds' in timestamp &&
      typeof timestamp.seconds === 'number' &&
      typeof timestamp.nanoseconds === 'number'
    ) {
      try {
        return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
      } catch {
        console.warn(
          `⚠️ [safeToDate] Failed to construct Timestamp in ${functionName}. Using current time.`
        );
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }
    }

    // 🛡️ Defense Layer 7: Unix timestamp (number)
    if (typeof timestamp === 'number') {
      if (isNaN(timestamp) || !isFinite(timestamp)) {
        console.warn(
          `⚠️ [safeToDate] Invalid numeric timestamp in ${functionName}. Using current time.`
        );
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }

      // Convert to milliseconds if needed
      const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      const date = new Date(timestampMs);

      // Validate the resulting date
      if (isNaN(date.getTime())) {
        console.warn(
          `⚠️ [safeToDate] Numeric timestamp produced invalid date in ${functionName}. Using current time.`
        );
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }

      return date;
    }

    // 🛡️ Defense Layer 8: ISO string or date string
    if (typeof timestamp === 'string') {
      if (timestamp.trim() === '') {
        console.warn(
          `⚠️ [safeToDate] Empty string timestamp in ${functionName}. Using current time.`
        );
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }

      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      } else {
        console.warn(
          `⚠️ [safeToDate] Invalid date string "${timestamp}" in ${functionName}. Using current time.`
        );
        const safeDate = new Date();
        return isNaN(safeDate.getTime()) ? new Date(0) : safeDate;
      }
    }

    // 🛡️ Defense Layer 9: Unknown format - safe fallback
    console.warn(
      `⚠️ [safeToDate] Unknown timestamp format in ${functionName}:`,
      typeof timestamp,
      timestamp
    );
    return new Date(); // Always return a valid date to prevent crashes
  } catch (error) {
    // 🛡️ Defense Layer 10: Ultimate crash protection
    console.error(`🚫 [safeToDate] Critical error in ${functionName}:`, error);
    console.error(`   Problematic timestamp:`, timestamp);
    return new Date(); // Emergency fallback - always return a valid date
  }
}

/**
 * 🛡️ Safe date formatting with error handling
 * Works with safeToDate to provide defensive date formatting
 *
 * @param timestamp - Timestamp to format (any supported format)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or fallback string
 */
export function safeDateFormat(
  timestamp: TimestampInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  fallback: string = 'Invalid Date'
): string {
  const date = safeToDate(timestamp, 'safeDateFormat');
  if (!date) {
    return fallback;
  }

  try {
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('🚫 [safeDateFormat] Error formatting date:', error);
    return fallback;
  }
}

/**
 * 🛡️ Safe time formatting with error handling
 *
 * @param timestamp - Timestamp to format (any supported format)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted time string or fallback string
 */
export function safeTimeFormat(
  timestamp: TimestampInput,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  },
  fallback: string = 'Invalid Time'
): string {
  const date = safeToDate(timestamp, 'safeTimeFormat');
  if (!date) {
    return fallback;
  }

  try {
    return date.toLocaleTimeString('en-US', options);
  } catch (error) {
    console.error('🚫 [safeTimeFormat] Error formatting time:', error);
    return fallback;
  }
}
