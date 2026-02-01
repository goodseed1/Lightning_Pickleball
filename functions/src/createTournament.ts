/**
 * 🚀 Cloud Function: createTournament
 * Server-side tournament creation with validation and notifications
 *
 * Phase 1: Server-Side Migration
 * Replaces client-side tournament creation with secure server-side logic
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { CreateTournamentRequest, CreateTournamentResponse } from './types/tournament';
import {
  verifyClubMembership,
  verifyClubExists,
  validateTournamentDates,
  validateDrawDate,
  validateParticipantSettings,
  calculateTotalRounds,
  calculateTotalMatches,
} from './utils/tournamentValidators';
import { sendTournamentCreatedNotification } from './utils/tournamentNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ============================================================================
 * Cloud Function: createTournament
 * ============================================================================
 *
 * Creates a new tournament with server-side validation
 *
 * Security:
 * - Requires authentication
 * - Validates club membership (admin/owner/manager only)
 * - Server-side validation of all tournament data
 *
 * Atomicity:
 * - Uses Firestore batch writes for atomic creation
 * - Creates tournament + activity log in single transaction
 *
 * Notifications:
 * - Sends push notifications to club admins
 *
 * @param data - CreateTournamentRequest
 * @param context - Authenticated user context
 * @returns CreateTournamentResponse
 */
export const createTournament = onCall<CreateTournamentRequest, Promise<CreateTournamentResponse>>(
  async request => {
    const { data, auth } = request;

    console.log('🏆 [CREATE TOURNAMENT] Starting tournament creation');

    // ========================================================================
    // 1. Authentication & Authorization
    // ========================================================================

    if (!auth || !auth.uid) {
      console.error('❌ [CREATE TOURNAMENT] Unauthorized: No auth context');
      throw new HttpsError('unauthenticated', 'You must be logged in to create a tournament');
    }

    const userId = auth.uid;
    console.log(`👤 [CREATE TOURNAMENT] User: ${userId}`);

    // Verify club membership (admin/owner/manager required)
    const membershipCheck = await verifyClubMembership(userId, data.clubId, [
      'admin',
      'owner',
      'manager',
    ]);

    if (!membershipCheck.isValid) {
      console.error(`❌ [CREATE TOURNAMENT] Insufficient permissions: ${membershipCheck.error}`);
      throw new HttpsError(
        'permission-denied',
        membershipCheck.error || 'You do not have permission to create tournaments for this club'
      );
    }

    console.log(`✅ [CREATE TOURNAMENT] User role: ${membershipCheck.role}`);

    // ========================================================================
    // 2. Club Validation
    // ========================================================================

    const clubCheck = await verifyClubExists(data.clubId);

    if (!clubCheck.isValid) {
      console.error(`❌ [CREATE TOURNAMENT] Club validation failed: ${clubCheck.error}`);
      throw new HttpsError('not-found', clubCheck.error || 'Club not found');
    }

    console.log(`✅ [CREATE TOURNAMENT] Club verified: ${data.clubId}`);

    // ========================================================================
    // 3. Input Validation
    // ========================================================================

    // Convert ISO date strings to Date objects
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const registrationDeadline = new Date(data.registrationDeadline);

    // Validate dates
    const dateValidation = validateTournamentDates(startDate, endDate, registrationDeadline);

    if (!dateValidation.isValid) {
      console.error(`❌ [CREATE TOURNAMENT] Date validation failed: ${dateValidation.error}`);
      throw new HttpsError('invalid-argument', dateValidation.error || 'Invalid tournament dates');
    }

    // Validate draw date if provided
    if (data.drawDate) {
      const drawDate = new Date(data.drawDate);
      const drawValidation = validateDrawDate(drawDate, registrationDeadline, startDate);

      if (!drawValidation.isValid) {
        console.error(
          `❌ [CREATE TOURNAMENT] Draw date validation failed: ${drawValidation.error}`
        );
        throw new HttpsError('invalid-argument', drawValidation.error || 'Invalid draw date');
      }
    }

    // Validate participant settings
    const participantValidation = validateParticipantSettings(
      data.settings.minParticipants,
      data.settings.maxParticipants
    );

    if (!participantValidation.isValid) {
      console.error(
        `❌ [CREATE TOURNAMENT] Participant validation failed: ${participantValidation.error}`
      );
      throw new HttpsError(
        'invalid-argument',
        participantValidation.error || 'Invalid participant settings'
      );
    }

    console.log('✅ [CREATE TOURNAMENT] All validations passed');

    // ========================================================================
    // 4. Tournament Creation (Atomic Batch Write)
    // ========================================================================

    try {
      const batch = db.batch();
      const tournamentRef = db.collection('tournaments').doc();
      const tournamentId = tournamentRef.id;

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Calculate tournament metadata
      const totalRounds = calculateTotalRounds(data.settings.maxParticipants);
      const totalMatches = calculateTotalMatches(data.settings.maxParticipants);

      // Prepare tournament document
      const tournamentData = {
        // Basic Info
        tournamentId,
        tournamentName: data.tournamentName,
        title: data.title,
        description: data.description || '',

        // Tournament Type
        eventType: data.eventType,
        format: data.format,

        // Club & League
        clubId: data.clubId,
        leagueId: data.clubId, // Using clubId as leagueId for now

        // Dates
        startDate: admin.firestore.Timestamp.fromDate(startDate),
        endDate: admin.firestore.Timestamp.fromDate(endDate),
        registrationDeadline: admin.firestore.Timestamp.fromDate(registrationDeadline),
        drawDate: data.drawDate
          ? admin.firestore.Timestamp.fromDate(new Date(data.drawDate))
          : null,

        // Settings
        settings: {
          format: data.settings.format,
          matchFormat: data.settings.matchFormat,
          seedingMethod: data.settings.seedingMethod,
          minParticipants: data.settings.minParticipants,
          maxParticipants: data.settings.maxParticipants,
          allowByes: data.settings.allowByes,
          scoringFormat: data.settings.scoringFormat,
          matchDuration: data.settings.matchDuration,
          courtCount: data.settings.courtCount || null,
          matchesPerDay: data.settings.matchesPerDay || null,
          restBetweenMatches: data.settings.restBetweenMatches || null,
          thirdPlaceMatch: data.settings.thirdPlaceMatch,
          consolationBracket: data.settings.consolationBracket,
          allowWalkovers: data.settings.allowWalkovers,
          eligibilityCriteria: data.settings.eligibilityCriteria || null,
        },

        // Entry Fee
        entryFee: data.entryFee || null,

        // Status & Counts
        status: 'draft' as const,
        participantCount: 0,

        // Metadata
        totalRounds,
        totalMatches,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,

        // Initialize empty arrays
        participants: [],
        matches: [],
        bpaddle: null,
        rankings: [],
      };

      // Write tournament document
      batch.set(tournamentRef, tournamentData);

      // Log activity
      const activityRef = db.collection('activities').doc();
      const activityData = {
        type: 'tournament_created',
        userId,
        clubId: data.clubId,
        tournamentId,
        tournamentName: data.tournamentName,
        metadata: {
          eventType: data.eventType,
          format: data.format,
          maxParticipants: data.settings.maxParticipants,
        },
        timestamp: now,
      };

      batch.set(activityRef, activityData);

      // Commit batch
      await batch.commit();

      console.log(`✅ [CREATE TOURNAMENT] Tournament created: ${tournamentId}`);

      // ======================================================================
      // 5. Send Notifications (After Commit)
      // ======================================================================

      // Send notifications to club admins (non-blocking)
      sendTournamentCreatedNotification(data.clubId, tournamentId, data.tournamentName, userId)
        .then(() => {
          console.log('✅ [CREATE TOURNAMENT] Notifications sent successfully');
        })
        .catch(error => {
          console.error('❌ [CREATE TOURNAMENT] Failed to send notifications:', error);
          // Don't throw - notification failure shouldn't fail the function
        });

      // ======================================================================
      // 6. Return Success Response
      // ======================================================================

      const response: CreateTournamentResponse = {
        success: true,
        message: `Tournament "${data.tournamentName}" created successfully`,
        data: {
          tournamentId,
          createdAt: new Date().toISOString(),
        },
      };

      console.log('🎉 [CREATE TOURNAMENT] Success!');

      return response;
    } catch (error: unknown) {
      console.error('❌ [CREATE TOURNAMENT] Failed to create tournament:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', `Failed to create tournament: ${errorMessage}`);
    }
  }
);
