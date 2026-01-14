/**
 * 🛡️ [CAPTAIN AMERICA] Create Match Cloud Function
 *
 * Server-side match creation with LPR validation and atomic batch writes.
 * Prevents "양학" (skill exploitation) by validating combined LPR for doubles.
 *
 * @author Captain America
 * @date 2025-11-27
 * @updated 2025-12-30 - NTRP → LPR migration
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { validateMatchLtr } from './utils/matchUtils';

const db = admin.firestore();

/**
 * Request interface for creating a match
 */
export interface CreateMatchRequest {
  title: string;
  description?: string;
  location: string;
  eventDate: string; // ISO date string
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  type: 'rankedMatch' | 'casualMeetup';
  gameType: 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles';
  hostPartnerId?: string; // Required for doubles
  hostPartnerName?: string; // Required for doubles
  maxParticipants: number;
  minLPR?: number; // Only for rankedMatch
  maxLPR?: number; // Only for rankedMatch
  // Backward compatibility: Accept legacy NTRP fields
  minNTRP?: number;
  maxNTRP?: number;
  isPublic: boolean;
}

/**
 * Response interface for match creation
 */
export interface CreateMatchResponse {
  success: boolean;
  message: string;
  eventId: string;
  invitationId?: string; // Only for doubles
}

/**
 * Create Match Cloud Function
 *
 * Security:
 * - Must be authenticated
 * - LPR validation for ranked matches
 * - Atomic creation of event + partner invitation
 *
 * Operations:
 * 1. Authentication check
 * 2. Input validation
 * 3. Verify doubles partner (if applicable)
 * 4. LPR validation (ranked matches only)
 * 5. Fetch user profiles for hostName/partnerName
 * 6. Batch write: Event + PartnerInvitation
 * 7. Return success with eventId and invitationId
 */
export const createMatch = onCall<CreateMatchRequest, Promise<CreateMatchResponse>>(
  async request => {
    const { data, auth } = request;

    // Step 1: Authentication check
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to create match');
    }

    const userId = auth.uid;

    logger.info('🛡️ [CREATE_MATCH] Starting match creation', {
      userId,
      type: data.type,
      gameType: data.gameType,
    });

    // Step 2: Input validation
    if (!data.title || !data.location || !data.eventDate || !data.type || !data.gameType) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields: title, location, eventDate, type, gameType'
      );
    }

    // Validate date range
    const eventDate = new Date(data.eventDate);
    const now = new Date();

    if (eventDate < now) {
      throw new HttpsError('invalid-argument', 'Event date must be in the future');
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      throw new HttpsError('invalid-argument', 'End time must be after start time');
    }

    // Step 3: Verify doubles partner
    const isDoubles = data.gameType.includes('doubles');

    if (isDoubles && !data.hostPartnerId) {
      throw new HttpsError('invalid-argument', 'Doubles match requires a partner (hostPartnerId)');
    }

    if (!isDoubles && data.hostPartnerId) {
      throw new HttpsError('invalid-argument', 'Singles match cannot have a partner');
    }

    // Step 4: LPR validation (ranked matches only)
    if (data.type === 'rankedMatch') {
      // 🎯 [BACKWARD COMPATIBILITY] Support both minLPR/maxLPR and legacy minNTRP/maxNTRP
      const minLPR = data.minLPR ?? data.minNTRP;
      const maxLPR = data.maxLPR ?? data.maxNTRP;

      if (minLPR === undefined || maxLPR === undefined) {
        throw new HttpsError('invalid-argument', 'Ranked match requires minLPR and maxLPR');
      }

      if (minLPR >= maxLPR) {
        throw new HttpsError('invalid-argument', 'maxLPR must be greater than minLPR');
      }

      // Validate host + partner LPR
      const validation = await validateMatchLtr(
        userId,
        data.hostPartnerId,
        data.gameType,
        minLPR,
        maxLPR
      );

      if (!validation.isValid) {
        logger.warn('⚠️ [CREATE_MATCH] LPR validation failed', {
          userId,
          hostLtr: validation.hostLtr,
          partnerLtr: validation.partnerLtr,
          combinedLtr: validation.combinedLtr,
          errors: validation.errors,
        });

        throw new HttpsError('failed-precondition', validation.errors.join(' '));
      }

      logger.info('✅ [CREATE_MATCH] LPR validation passed', {
        userId,
        hostLtr: validation.hostLtr,
        partnerLtr: validation.partnerLtr,
        combinedLtr: validation.combinedLtr,
      });
    }

    try {
      // Step 5: Fetch user profiles for display names
      const hostDoc = await db.collection('users').doc(userId).get();
      if (!hostDoc.exists) {
        throw new HttpsError('not-found', 'Host user profile not found');
      }

      const hostData = hostDoc.data()!;
      const hostName = hostData.displayName || hostData.email || 'Host';
      const hostLtr =
        hostData.skillLevel?.calculated || hostData.ltrLevel || hostData.ntrpLevel || 5;

      let partnerName: string | undefined;
      let partnerLtr: number | undefined;
      if (isDoubles && data.hostPartnerId) {
        const partnerDoc = await db.collection('users').doc(data.hostPartnerId).get();
        if (!partnerDoc.exists) {
          throw new HttpsError('not-found', 'Partner user profile not found');
        }

        const partnerData = partnerDoc.data()!;
        partnerName = partnerData.displayName || partnerData.email || 'Partner';
        partnerLtr =
          partnerData.skillLevel?.calculated || partnerData.ltrLevel || partnerData.ntrpLevel || 5;
      }

      // Step 6: Batch write - Event + PartnerInvitation
      const batch = db.batch();

      // Create Event document
      const eventRef = db.collection('events').doc();

      // 🎯 [BACKWARD COMPATIBILITY] Support both minLPR/maxLPR and legacy minNTRP/maxNTRP
      const minLPR = data.minLPR ?? data.minNTRP ?? 1;
      const maxLPR = data.maxLPR ?? data.maxNTRP ?? 10;

      const eventData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        location: data.location.trim(),
        eventDate: admin.firestore.Timestamp.fromDate(eventDate),
        startTime: admin.firestore.Timestamp.fromDate(startTime),
        endTime: admin.firestore.Timestamp.fromDate(endTime),
        type: data.type,
        gameType: data.gameType,
        hostId: userId,
        hostName,
        ...(isDoubles &&
          data.hostPartnerId && {
            hostPartnerId: data.hostPartnerId,
            hostPartnerName: partnerName,
          }),
        maxParticipants: data.maxParticipants,
        participants: [] as string[], // Host is NOT auto-joined
        waitingList: [] as string[],
        status: isDoubles && data.hostPartnerId ? 'partner_pending' : 'scheduled',
        isPublic: data.isPublic,
        isRanked: data.type === 'rankedMatch',
        // 🆕 [3개월 규칙] Default to true, will be re-evaluated at match result submission
        // For public matches, cooldown check happens when opponent joins/accepts
        isRankedMatch: true,
        ...(data.type === 'rankedMatch' && {
          minLtr: minLPR,
          maxLtr: maxLPR,
          // Legacy fields for backward compatibility during migration
          minNTRP: minLPR,
          maxNTRP: maxLPR,
        }),
        ...(isDoubles &&
          data.hostPartnerId && {
            partnerAccepted: false,
          }),
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(eventRef, eventData);

      logger.info('📝 [CREATE_MATCH] Event document prepared', {
        eventId: eventRef.id,
        title: data.title,
        gameType: data.gameType,
        status: eventData.status,
      });

      // Create PartnerInvitation document (for doubles only)
      let invitationRef: admin.firestore.DocumentReference | undefined;

      if (isDoubles && data.hostPartnerId) {
        invitationRef = db.collection('partner_invitations').doc();
        const combinedLtr = hostLtr + (partnerLtr || 0);
        const invitationData = {
          eventId: eventRef.id,
          eventTitle: data.title,
          gameType: data.gameType,
          inviterId: userId,
          inviterName: hostName,
          inviterLtr: hostLtr,
          invitedUserId: data.hostPartnerId,
          invitedUserName: partnerName!,
          invitedUserLtr: partnerLtr || 0,
          combinedLtr,
          // Legacy fields for backward compatibility during migration
          inviterNtrp: hostLtr,
          invitedUserNtrp: partnerLtr || 0,
          combinedNtrp: combinedLtr,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          ),
          eventDate: admin.firestore.Timestamp.fromDate(eventDate),
          eventTime: startTime.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          eventLocation: data.location,
        };

        batch.set(invitationRef, invitationData);

        logger.info('📨 [CREATE_MATCH] Partner invitation prepared', {
          invitationId: invitationRef.id,
          inviterId: userId,
          invitedUserId: data.hostPartnerId,
        });
      }

      // Commit batch write atomically
      await batch.commit();

      logger.info('✅ [CREATE_MATCH] Match created successfully', {
        eventId: eventRef.id,
        invitationId: invitationRef?.id,
        userId,
        gameType: data.gameType,
      });

      // Step 7: Return success response
      return {
        success: true,
        message: 'Match created successfully',
        eventId: eventRef.id,
        ...(invitationRef && { invitationId: invitationRef.id }),
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('❌ [CREATE_MATCH] Unexpected error', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
