/**
 * 🌉 [HEIMDALL] Apply For League Cloud Function
 * Server-Side Migration Phase 2: League Participation (Singles) - AUTO-APPROVAL
 *
 * Securely handles league application submission for singles leagues with automatic approval
 * Applications are instantly approved and added to participants/standings arrays
 * Uses Admin SDK to bypass Security Rules
 *
 * @author Kim (Server-Side Migration Phase 2)
 * @date 2025-11-17
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface ApplyForLeagueRequest {
  leagueId: string;
  userDisplayName: string;
  userEmail?: string;
  userNtrpLevel?: number;
  userProfileImage?: string;
}

interface ApplyForLeagueResponse {
  success: boolean;
  message: string;
  data: {
    participantId: string;
  };
}

/**
 * Apply For League Cloud Function (Singles)
 *
 * Workflow:
 * 1. Validate authentication
 * 2. Check league exists and get data
 * 3. Validate NOT doubles league (singles only)
 * 4. Check league status (must be 'open')
 * 5. Check application deadline
 * 6. Check for duplicate application
 * 7. Create league_participants entry with status: 'confirmed' (auto-approved)
 * 8. Add participant to league.participants array
 * 9. Add participant to league.standings array
 *
 * @param request - Contains leagueId and user details
 * @returns Success status with participant ID
 */
export const applyForLeague = onCall<ApplyForLeagueRequest, Promise<ApplyForLeagueResponse>>(
  async request => {
    const { data, auth } = request;
    const { leagueId, userDisplayName, userEmail, userNtrpLevel, userProfileImage } = data;

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to apply for a league');
    }

    const userId = auth.uid;

    logger.info('📝 [APPLY_FOR_LEAGUE] Starting singles application', {
      leagueId,
      userId,
      userDisplayName,
    });

    try {
      // ========================================================================
      // Step 2: Validate League Exists & Get Data
      // ========================================================================
      const leagueRef = db.collection('leagues').doc(leagueId);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        throw new HttpsError('not-found', 'League not found');
      }

      const leagueData = leagueSnap.data();
      if (!leagueData) {
        throw new HttpsError('internal', 'Invalid league data');
      }

      // ========================================================================
      // Step 3: Validate NOT Doubles League
      // ========================================================================
      const eventType = leagueData.eventType;
      if (
        eventType === 'mens_doubles' ||
        eventType === 'womens_doubles' ||
        eventType === 'mixed_doubles'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'This is a doubles league. Please use applyForLeagueAsTeam() to register a team.'
        );
      }

      // ========================================================================
      // Step 4: Check League Status
      // ========================================================================
      if (leagueData.status !== 'open') {
        throw new HttpsError('failed-precondition', 'League is not open for registration');
      }

      // ========================================================================
      // Step 5: Check Application Deadline
      // ========================================================================
      const now = admin.firestore.Timestamp.now();
      const deadline = leagueData.applicationDeadline;

      if (now.toMillis() > deadline.toMillis()) {
        throw new HttpsError('failed-precondition', 'Application deadline has passed');
      }

      // ========================================================================
      // Step 6: Check Duplicate Application
      // ========================================================================
      const existingApplicationQuery = await db
        .collection('league_participants')
        .where('leagueId', '==', leagueId)
        .where('userId', '==', userId)
        .get();

      if (!existingApplicationQuery.empty) {
        throw new HttpsError('already-exists', 'You have already applied for this league');
      }

      // ========================================================================
      // Step 7: Create League Application with Auto-Approval (Atomic Batch!)
      // ========================================================================
      const batch = db.batch();

      // 7.1: Add to league_participants subcollection with status: 'confirmed'
      const participantRef = db.collection('league_participants').doc();
      const participantData: Record<string, unknown> = {
        leagueId,
        userId,
        status: 'confirmed', // Auto-approved (no manual approval required)
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: 'auto-approval-system',
        userDisplayName,

        // Optional fields (conditional)
        ...(userEmail && { userEmail }),
        ...(userNtrpLevel && { userNtrpLevel }),
        ...(userProfileImage && { userProfileImage }),
      };

      batch.set(participantRef, participantData);

      // 7.2: Add to league.participants array
      const participantArrayItem = {
        playerId: userId,
        playerName: userDisplayName,
        ...(userNtrpLevel && { ntrpLevel: userNtrpLevel }),
      };

      // 7.3: Add to league.standings array
      const standings = leagueData.standings || [];
      const newStanding = {
        playerId: userId,
        playerName: userDisplayName,
        position: standings.length + 1,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        gamesWon: 0,
        gamesLost: 0,
        gameDifference: 0,
        setsWon: 0,
        setsLost: 0,
        setDifference: 0,
        streak: { type: 'none', count: 0 },
      };

      standings.push(newStanding);

      // 7.4: Update league document (participants + standings in ONE batch update)
      batch.update(leagueRef, {
        participants: admin.firestore.FieldValue.arrayUnion(participantArrayItem),
        standings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Commit all changes atomically
      await batch.commit();

      logger.info('✅ [APPLY_FOR_LEAGUE] Application auto-approved successfully', {
        leagueId,
        userId,
        participantId: participantRef.id,
      });

      return {
        success: true,
        message: 'League application submitted successfully',
        data: {
          participantId: participantRef.id,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error('❌ [APPLY_FOR_LEAGUE] Unexpected error', {
        leagueId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to apply for league: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
