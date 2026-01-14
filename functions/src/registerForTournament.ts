/**
 * 🚀 Cloud Function: registerForTournament
 * Server-side tournament registration (Singles & Doubles)
 *
 * Phase 1: Server-Side Migration
 * Handles both singles and doubles tournament registration with atomic operations
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  RegisterForTournamentRequest,
  RegisterForTournamentResponse,
  TournamentParticipantData,
} from './types/tournament';
import { validateCanRegister } from './utils/tournamentValidators';
import {
  sendRegistrationConfirmation,
  sendNewParticipantNotification,
} from './utils/tournamentNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * ============================================================================
 * Cloud Function: registerForTournament
 * ============================================================================
 *
 * Registers a player or doubles team for a tournament
 *
 * Security:
 * - Requires authentication
 * - Validates tournament status and capacity
 * - Prevents duplicate registrations
 * - Validates partner information for doubles
 *
 * Atomicity:
 * - Uses Firestore transactions for atomic operations
 * - Ensures participant count accuracy
 * - Prevents race conditions
 *
 * Notifications:
 * - Sends confirmation to registered player(s)
 * - Notifies tournament host of new participant
 *
 * @param data - RegisterForTournamentRequest
 * @param context - Authenticated user context
 * @returns RegisterForTournamentResponse
 */
export const registerForTournament = onCall<
  RegisterForTournamentRequest,
  Promise<RegisterForTournamentResponse>
>(async request => {
  const { data, auth } = request;

  console.log('🎾 [REGISTER TOURNAMENT] Starting registration process');

  // ==========================================================================
  // 1. Authentication
  // ==========================================================================

  if (!auth || !auth.uid) {
    console.error('❌ [REGISTER TOURNAMENT] Unauthorized: No auth context');
    throw new HttpsError('unauthenticated', 'You must be logged in to register for a tournament');
  }

  const userId = data.userId || auth.uid;

  // Verify user is registering themselves (prevent registration fraud)
  if (userId !== auth.uid && !data.partnerInfo) {
    console.error(`❌ [REGISTER TOURNAMENT] User ${auth.uid} attempted to register as ${userId}`);
    throw new HttpsError('permission-denied', 'You can only register yourself for tournaments');
  }

  console.log(`👤 [REGISTER TOURNAMENT] User: ${userId}`);

  // ==========================================================================
  // 2. Tournament Validation (Transaction)
  // ==========================================================================

  try {
    const result = await db.runTransaction(async transaction => {
      const tournamentRef = db.doc(`tournaments/${data.tournamentId}`);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournamentData = tournamentDoc.data()!;

      console.log(`🏆 [REGISTER TOURNAMENT] Tournament: ${tournamentData.tournamentName}`);

      // Check if tournament is accepting registrations
      const registrationCheck = validateCanRegister(
        tournamentData.status,
        tournamentData.participantCount || 0,
        tournamentData.settings.maxParticipants
      );

      if (!registrationCheck.isValid) {
        console.error(
          `❌ [REGISTER TOURNAMENT] Registration check failed: ${registrationCheck.error}`
        );
        throw new HttpsError(
          'failed-precondition',
          registrationCheck.error || 'Tournament is not accepting registrations'
        );
      }

      // ======================================================================
      // 3. Check for Duplicate Registration
      // ======================================================================

      const participantsSnapshot = await transaction.get(
        db
          .collection(`tournaments/${data.tournamentId}/participants`)
          .where('playerId', '==', userId)
      );

      if (!participantsSnapshot.empty) {
        console.error(`❌ [REGISTER TOURNAMENT] User ${userId} already registered`);
        throw new HttpsError('already-exists', 'You are already registered for this tournament');
      }

      // ======================================================================
      // 4. Gather User Data
      // ======================================================================

      const userDoc = await transaction.get(db.doc(`users/${userId}`));

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data()!;
      const profile = userData.profile || {};

      // ======================================================================
      // 5. Handle Doubles Registration
      // ======================================================================

      let isDoubles = false;
      let partnerData: Record<string, unknown> | null = null;

      if (data.partnerInfo) {
        isDoubles = true;
        console.log(
          `👥 [REGISTER TOURNAMENT] Doubles registration with partner: ${data.partnerInfo.partnerId}`
        );

        // Validate partner exists
        const partnerDoc = await transaction.get(db.doc(`users/${data.partnerInfo.partnerId}`));

        if (!partnerDoc.exists) {
          throw new HttpsError('not-found', 'Partner profile not found');
        }

        const partner = partnerDoc.data()!;
        const partnerProfile = partner.profile || {};

        partnerData = {
          partnerId: data.partnerInfo.partnerId,
          partnerName:
            partnerProfile.displayName ||
            `${partnerProfile.firstName || ''} ${partnerProfile.lastName || ''}`.trim() ||
            data.partnerInfo.partnerName,
          partnerGender: partnerProfile.gender || 'prefer_not_to_say',
          partnerSkillLevel: partnerProfile.skillLevel || 'beginner',
          partnerProfileImage: partner.photoURL || partner.profileImage || null,
          partnerConfirmed: false, // Will be confirmed by partner separately
        };

        // Validate event type matches (e.g., don't register for mens_singles with a partner)
        const eventType = tournamentData.eventType;
        if (eventType === 'mens_singles' || eventType === 'womens_singles') {
          throw new HttpsError(
            'invalid-argument',
            'Cannot register with a partner for singles tournaments'
          );
        }
      }

      // ======================================================================
      // 6. Create Participant Data
      // ======================================================================

      const participantData: TournamentParticipantData = {
        playerId: userId,
        playerName:
          profile.displayName ||
          `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
          userData.displayName ||
          'Unknown Player',
        playerGender: profile.gender || 'prefer_not_to_say',
        skillLevel: profile.skillLevel || 'beginner',
        profileImage: userData.photoURL || userData.profileImage || null,
        ...partnerData,
      };

      // ======================================================================
      // 7. Write Participant Document (Atomic)
      // ======================================================================

      const participantRef = db.collection(`tournaments/${data.tournamentId}/participants`).doc();
      const participantId = participantRef.id;

      const now = admin.firestore.FieldValue.serverTimestamp();

      const participantDoc = {
        participantId,
        ...participantData,
        registeredAt: now,
        status: 'registered',
        seed: null,
        checkInStatus: null,
      };

      transaction.set(participantRef, participantDoc);

      // Update tournament participant count AND participants array
      // Array contains minimal info for UI checks (playerId, playerName)
      // Full details remain in subcollection
      transaction.update(tournamentRef, {
        participantCount: admin.firestore.FieldValue.increment(1),
        participants: admin.firestore.FieldValue.arrayUnion({
          playerId: userId,
          playerName: participantData.playerName,
          // Include partner info for doubles tournaments
          ...(isDoubles && partnerData
            ? {
                partnerId: partnerData.partnerId,
                partnerName: partnerData.partnerName,
              }
            : {}),
        }),
        updatedAt: now,
      });

      // Log activity
      const activityRef = db.collection('activities').doc();
      transaction.set(activityRef, {
        type: 'tournament_registration',
        userId,
        tournamentId: data.tournamentId,
        tournamentName: tournamentData.tournamentName,
        isDoubles,
        partnerId: partnerData?.partnerId || null,
        timestamp: now,
      });

      console.log(`✅ [REGISTER TOURNAMENT] Participant created: ${participantId}`);

      return {
        participantId,
        tournamentName: tournamentData.tournamentName,
        createdBy: tournamentData.createdBy,
        currentCount: (tournamentData.participantCount || 0) + 1,
        maxParticipants: tournamentData.settings.maxParticipants,
        playerName: participantData.playerName,
      };
    });

    // ========================================================================
    // 8. Send Notifications (After Transaction)
    // ========================================================================

    const { participantId, tournamentName, createdBy, currentCount, maxParticipants, playerName } =
      result;

    // Send registration confirmation to participant
    sendRegistrationConfirmation(userId, data.tournamentId, tournamentName, !!data.partnerInfo)
      .then(() => {
        console.log('✅ [REGISTER TOURNAMENT] Confirmation sent to participant');
      })
      .catch(error => {
        console.error('❌ [REGISTER TOURNAMENT] Failed to send confirmation:', error);
      });

    // Send confirmation to partner if doubles
    if (data.partnerInfo) {
      sendRegistrationConfirmation(
        data.partnerInfo.partnerId,
        data.tournamentId,
        tournamentName,
        true
      )
        .then(() => {
          console.log('✅ [REGISTER TOURNAMENT] Confirmation sent to partner');
        })
        .catch(error => {
          console.error('❌ [REGISTER TOURNAMENT] Failed to send partner confirmation:', error);
        });
    }

    // Notify tournament host
    sendNewParticipantNotification(
      createdBy,
      data.tournamentId,
      tournamentName,
      playerName,
      currentCount,
      maxParticipants
    )
      .then(() => {
        console.log('✅ [REGISTER TOURNAMENT] Host notification sent');
      })
      .catch(error => {
        console.error('❌ [REGISTER TOURNAMENT] Failed to send host notification:', error);
      });

    // ========================================================================
    // 9. Return Success Response
    // ========================================================================

    const response: RegisterForTournamentResponse = {
      success: true,
      message: data.partnerInfo
        ? `Successfully registered for "${tournamentName}" with your partner`
        : `Successfully registered for "${tournamentName}"`,
      data: {
        registrationId: participantId, // Same as participantId for now
        participantId,
        registeredAt: new Date().toISOString(),
      },
    };

    console.log('🎉 [REGISTER TOURNAMENT] Registration complete!');

    return response;
  } catch (error: unknown) {
    console.error('❌ [REGISTER TOURNAMENT] Failed to register:', error);

    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed to register for tournament: ${errorMessage}`);
  }
});
