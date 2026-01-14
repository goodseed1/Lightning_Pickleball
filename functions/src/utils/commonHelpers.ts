/**
 * 🏹 [HAWKEYE] Common Helper Utilities
 * Reusable helper functions to reduce code duplication
 *
 * Purpose: DRY (Don't Repeat Yourself) principle
 * - Authentication checks
 * - Error handling
 * - Document existence checks
 */

import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { CallableRequest } from 'firebase-functions/v2/https';

const db = admin.firestore();

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Verify user is authenticated
 *
 * @param auth - Firebase auth context from request
 * @throws HttpsError if not authenticated
 * @returns User ID
 *
 * @example
 * ```typescript
 * const userId = requireAuth(request.auth);
 * // If not authenticated, throws error automatically
 * ```
 */
export function requireAuth(auth?: { uid: string } | null): string {
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in to perform this action');
  }
  return auth.uid;
}

/**
 * Verify user is authenticated (from request object)
 *
 * @param request - Callable request object
 * @throws HttpsError if not authenticated
 * @returns User ID
 *
 * @example
 * ```typescript
 * export const myFunction = onCall(async (request) => {
 *   const userId = requireAuthFromRequest(request);
 * });
 * ```
 */
export function requireAuthFromRequest(request: CallableRequest): string {
  return requireAuth(request.auth);
}

// ============================================================================
// Document Existence Helpers
// ============================================================================

/**
 * Get Firestore document or throw not-found error
 *
 * @param ref - Firestore document reference
 * @param resourceName - Resource name for error message (e.g., 'Tournament', 'User')
 * @throws HttpsError if document doesn't exist
 * @returns Document snapshot
 *
 * @example
 * ```typescript
 * const tournamentRef = db.doc(`tournaments/${tournamentId}`);
 * const tournamentDoc = await requireDocument(tournamentRef, 'Tournament');
 * const tournamentData = tournamentDoc.data()!;
 * ```
 */
export async function requireDocument(
  ref: admin.firestore.DocumentReference,
  resourceName: string
): Promise<admin.firestore.DocumentSnapshot> {
  const doc = await ref.get();
  if (!doc.exists) {
    throw new HttpsError('not-found', `${resourceName} not found`);
  }
  return doc;
}

/**
 * Get Firestore document by path or throw not-found error
 *
 * @param path - Document path (e.g., 'tournaments/123')
 * @param resourceName - Resource name for error message
 * @throws HttpsError if document doesn't exist
 * @returns Document snapshot
 *
 * @example
 * ```typescript
 * const tournamentDoc = await requireDocumentByPath(`tournaments/${tournamentId}`, 'Tournament');
 * ```
 */
export async function requireDocumentByPath(
  path: string,
  resourceName: string
): Promise<admin.firestore.DocumentSnapshot> {
  const ref = db.doc(path);
  return requireDocument(ref, resourceName);
}

// ============================================================================
// Permission Helpers
// ============================================================================

/**
 * Verify user owns a resource
 *
 * @param userId - User ID to check
 * @param ownerId - Owner ID of the resource
 * @param resourceName - Resource name for error message
 * @throws HttpsError if user is not the owner
 *
 * @example
 * ```typescript
 * requireOwnership(userId, tournament.createdBy, 'Tournament');
 * // Throws error if userId !== tournament.createdBy
 * ```
 */
export function requireOwnership(userId: string, ownerId: string, resourceName: string): void {
  if (userId !== ownerId) {
    throw new HttpsError(
      'permission-denied',
      `You do not have permission to modify this ${resourceName}`
    );
  }
}

/**
 * Verify user is host of a tournament
 *
 * @param userId - User ID to check
 * @param tournamentData - Tournament document data
 * @throws HttpsError if user is not the host
 *
 * @example
 * ```typescript
 * requireTournamentHost(userId, tournamentData);
 * ```
 */
export function requireTournamentHost(userId: string, tournamentData: { createdBy: string }): void {
  requireOwnership(userId, tournamentData.createdBy, 'tournament');
}

// ============================================================================
// Data Validation Helpers
// ============================================================================

/**
 * Validate required fields are present
 *
 * @param data - Data object to validate
 * @param requiredFields - Array of required field names
 * @throws HttpsError if any required field is missing
 *
 * @example
 * ```typescript
 * requireFields(data, ['tournamentId', 'userId']);
 * // Throws error if tournamentId or userId is missing
 * ```
 */
export function requireFields(data: Record<string, unknown>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new HttpsError(
      'invalid-argument',
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Validate field values
 *
 * @param fieldName - Name of the field being validated
 * @param value - Value to validate
 * @param validator - Validation function that returns true if valid
 * @param errorMessage - Error message to show if validation fails
 * @throws HttpsError if validation fails
 *
 * @example
 * ```typescript
 * validateField('status', status, (val) => ['draft', 'active'].includes(val), 'Invalid status');
 * ```
 */
export function validateField<T>(
  fieldName: string,
  value: T,
  validator: (val: T) => boolean,
  errorMessage: string
): void {
  if (!validator(value)) {
    throw new HttpsError('invalid-argument', `${fieldName}: ${errorMessage}`);
  }
}

// ============================================================================
// Transaction Helpers
// ============================================================================

/**
 * Run a Firestore transaction with error handling
 *
 * @param transactionFn - Transaction function
 * @param errorContext - Context for error message
 * @throws HttpsError with proper error handling
 * @returns Transaction result
 *
 * @example
 * ```typescript
 * const result = await runTransaction(async (transaction) => {
 *   // Your transaction logic
 *   return { success: true };
 * }, 'registering for tournament');
 * ```
 */
export async function runTransaction<T>(
  transactionFn: (transaction: admin.firestore.Transaction) => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await db.runTransaction(transactionFn);
  } catch (error: unknown) {
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed ${errorContext}: ${errorMessage}`);
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create success response
 *
 * @param message - Success message
 * @param data - Optional response data
 * @returns Standardized success response
 *
 * @example
 * ```typescript
 * return createSuccessResponse('Tournament created successfully', { tournamentId });
 * ```
 */
export function createSuccessResponse(message: string, data?: Record<string, unknown>) {
  return {
    success: true,
    message,
    ...(data && { data }),
  };
}

/**
 * Create error response (for non-throwing errors)
 *
 * @param message - Error message
 * @param code - Optional error code
 * @returns Standardized error response
 *
 * @example
 * ```typescript
 * return createErrorResponse('Invalid tournament status', 'INVALID_STATUS');
 * ```
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    success: false,
    error: message,
    ...(code && { code }),
  };
}

// ============================================================================
// Timestamp Helpers
// ============================================================================

/**
 * Get server timestamp for Firestore
 *
 * @returns FieldValue for server timestamp
 *
 * @example
 * ```typescript
 * const doc = { createdAt: getServerTimestamp(), ... };
 * ```
 */
export function getServerTimestamp(): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * Get current ISO timestamp string
 *
 * @returns ISO 8601 timestamp string
 *
 * @example
 * ```typescript
 * return { registeredAt: getCurrentISOTimestamp() };
 * ```
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Array Helpers
// ============================================================================

/**
 * Array union FieldValue
 *
 * @param elements - Elements to add to array
 * @returns FieldValue for arrayUnion
 *
 * @example
 * ```typescript
 * transaction.update(ref, { participants: arrayUnion({ userId, name }) });
 * ```
 */
export function arrayUnion(...elements: unknown[]): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.arrayUnion(...elements);
}

/**
 * Array remove FieldValue
 *
 * @param elements - Elements to remove from array
 * @returns FieldValue for arrayRemove
 *
 * @example
 * ```typescript
 * transaction.update(ref, { participants: arrayRemove({ userId }) });
 * ```
 */
export function arrayRemove(...elements: unknown[]): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.arrayRemove(...elements);
}

/**
 * Increment FieldValue
 *
 * @param n - Number to increment by
 * @returns FieldValue for increment
 *
 * @example
 * ```typescript
 * transaction.update(ref, { participantCount: increment(1) });
 * ```
 */
export function increment(n: number): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.increment(n);
}
