/**
 * 🌉 [HEIMDALL] Assign Seeds Cloud Function
 * Phase 5.3: Server-Side Migration - Critical Security
 *
 * Securely assigns seed numbers to tournament participants
 * Enforces seeding rules and prevents unauthorized seed manipulation
 *
 * @author Heimdall (Phase 5.3)
 * @date 2025-11-10
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AssignSeedsRequest, AssignSeedsResponse, TournamentParticipant } from './types/tournament';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Assign Seeds Cloud Function
 *
 * Security Rules:
 * - Must be authenticated
 * - Must be tournament creator OR club admin
 * - Tournament must be in 'registration' or 'draft' status
 * - Cannot change seeds after bracket generation
 *
 * Validations:
 * - Seed numbers must be unique
 * - Seed numbers must be within valid range (1 to participant count)
 * - All participants must exist in tournament
 *
 * Doubles Handling (⚡ Thor's Logic):
 * - Partners share the same seed number
 * - If one partner is assigned a seed, the other inherits it
 *
 * @param request - Contains tournamentId and array of seed assignments
 * @returns Success status with assignment count
 */
export const assignSeeds = onCall<AssignSeedsRequest, Promise<AssignSeedsResponse>>(
  async request => {
    const { data, auth } = request;
    const { tournamentId, seeds } = data;

    // ==========================================================================
    // Step 1: Authentication
    // ==========================================================================
    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'You must be logged in to assign seeds');
    }

    const userId = auth.uid;

    logger.info('🎯 [ASSIGN_SEEDS] Starting seed assignment', {
      tournamentId,
      userId,
      seedCount: seeds.length,
    });

    try {
      // ========================================================================
      // Step 2: Validate Tournament Exists & Get Data
      // ========================================================================
      const tournamentRef = db.collection('tournaments').doc(tournamentId);
      const tournamentSnap = await tournamentRef.get();

      if (!tournamentSnap.exists) {
        throw new HttpsError('not-found', 'Tournament not found');
      }

      const tournamentData = tournamentSnap.data();
      if (!tournamentData) {
        throw new HttpsError('internal', 'Invalid tournament data');
      }

      // ========================================================================
      // Step 3: Authorization Check
      // ========================================================================
      const isTournamentCreator = tournamentData.createdBy === userId;

      // Check if user is club admin (if tournament belongs to a club)
      let isClubAdmin = false;
      if (tournamentData.clubId) {
        const clubRef = db.collection('tennis_clubs').doc(tournamentData.clubId);
        const clubSnap = await clubRef.get();

        if (clubSnap.exists) {
          const memberRef = clubRef.collection('members').doc(userId);
          const memberSnap = await memberRef.get();

          if (memberSnap.exists) {
            const memberData = memberSnap.data();
            const memberRole = memberData?.role;
            isClubAdmin = memberRole === 'admin' || memberRole === 'owner';
          }
        }
      }

      if (!isTournamentCreator && !isClubAdmin) {
        throw new HttpsError(
          'permission-denied',
          'Only the tournament creator or club admin can assign seeds'
        );
      }

      // ========================================================================
      // Step 4: Validate Tournament Status
      // ========================================================================
      // Can assign seeds during registration, draft, or bracket_generation phase
      // Note: bracket_generation is needed for automatic seeding during tournament start
      const allowedStatuses = ['draft', 'registration', 'bracket_generation'];
      if (!allowedStatuses.includes(tournamentData.status)) {
        throw new HttpsError(
          'failed-precondition',
          `Cannot assign seeds in ${tournamentData.status} status. Seeds can only be assigned during registration, draft, or bracket_generation phase.`
        );
      }

      // ========================================================================
      // Step 5: Load All Participants (from tournament document field)
      // ========================================================================
      const participants: TournamentParticipant[] = tournamentData.participants || [];

      if (!participants || participants.length === 0) {
        throw new HttpsError('failed-precondition', 'No participants in tournament');
      }

      const totalParticipants = participants.length;

      logger.info('🎯 [ASSIGN_SEEDS] Loaded participants from tournament document', {
        tournamentId,
        totalParticipants,
      });

      // ========================================================================
      // Step 6: Validate Seed Numbers
      // ========================================================================
      // 6.1: Check seed range (0 to totalParticipants)
      // 🎯 [KIM FIX] 0은 시드 제거를 의미 (valid)
      const invalidSeeds = seeds.filter(s => s.seedNumber < 0 || s.seedNumber > totalParticipants);
      if (invalidSeeds.length > 0) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid seed numbers: ${invalidSeeds.map(s => s.seedNumber).join(', ')}. Seeds must be between 0 and ${totalParticipants}. (0 = remove seed)`
        );
      }

      // 6.1.1: Separate seed assignments and removals
      const seedRemovals = seeds.filter(s => s.seedNumber === 0);
      const seedAssignments = seeds.filter(s => s.seedNumber > 0);

      logger.info('🎯 [ASSIGN_SEEDS] Processing', {
        assignments: seedAssignments.length,
        removals: seedRemovals.length,
      });

      // 6.2: Check for duplicate seed numbers (with doubles support)
      // 🎯 [KIM FIX] seedNumber 0 (제거)은 중복 체크에서 제외
      // For doubles tournaments, partners are allowed to share the same seed
      const isDoubles = tournamentData.eventType && tournamentData.eventType.includes('doubles');

      if (!isDoubles) {
        // Singles: Each seed must be unique (exclude 0 = removal)
        const seedNumbers = seedAssignments.map(s => s.seedNumber);
        const uniqueSeeds = new Set(seedNumbers);
        if (seedNumbers.length !== uniqueSeeds.size) {
          throw new HttpsError(
            'invalid-argument',
            'Duplicate seed numbers detected. Each seed must be unique.'
          );
        }
      } else {
        // Doubles: Validate that duplicates are only between partners (exclude 0 = removal)
        const seedGroups = new Map<number, string[]>();
        seedAssignments.forEach(s => {
          if (!seedGroups.has(s.seedNumber)) {
            seedGroups.set(s.seedNumber, []);
          }
          seedGroups.get(s.seedNumber)!.push(s.participantId);
        });

        // Each seed should have exactly 2 players (partners)
        for (const [seedNum, playerIds] of seedGroups.entries()) {
          if (playerIds.length !== 2) {
            throw new HttpsError(
              'invalid-argument',
              `Seed ${seedNum} has ${playerIds.length} players (expected 2 for doubles)`
            );
          }

          // Verify they are actually partners
          const p1 = participants.find(p => p.playerId === playerIds[0]);
          const p2 = participants.find(p => p.playerId === playerIds[1]);

          if (!p1 || !p2) {
            throw new HttpsError('not-found', `Players not found for seed ${seedNum}`);
          }

          if (p1.partnerId !== p2.playerId || p2.partnerId !== p1.playerId) {
            throw new HttpsError(
              'invalid-argument',
              `Seed ${seedNum} assigned to non-partners: ${playerIds.join(', ')}`
            );
          }
        }

        logger.info(
          '✅ [DOUBLES] Seed validation passed - all seeds assigned to valid partner pairs'
        );
      }

      // 6.3: Check all participants exist
      const participantIds = new Set(participants.map(p => p.playerId));
      const invalidParticipants = seeds.filter(s => !participantIds.has(s.participantId));
      if (invalidParticipants.length > 0) {
        throw new HttpsError(
          'not-found',
          `Participants not found: ${invalidParticipants.map(p => p.participantId).join(', ')}`
        );
      }

      // ========================================================================
      // Step 7: Create Seed Map (with Doubles Support - ⚡ Thor's Logic)
      // ========================================================================
      // Note: isDoubles already determined in Step 6.2

      const seedMap = new Map<string, number>();

      // Build initial seed map from request
      seeds.forEach(seed => {
        seedMap.set(seed.participantId, seed.seedNumber);
      });

      // ⚡ [THOR] Doubles: Unify partner seeds
      if (isDoubles) {
        logger.info('⚡ [THOR] Doubles tournament detected - unifying partner seeds');

        participants.forEach(participant => {
          const playerId = participant.playerId;
          const partnerId = participant.partnerId;

          // If this player has a seed assigned
          if (seedMap.has(playerId)) {
            const seedNumber = seedMap.get(playerId)!;

            // If they have a partner, assign the same seed to partner
            if (partnerId) {
              seedMap.set(partnerId, seedNumber);
              logger.info('⚡ [THOR] Unified partner seed', {
                player: playerId,
                partner: partnerId,
                seed: seedNumber,
              });
            }
          }
          // If partner has seed but this player doesn't, inherit it
          else if (partnerId && seedMap.has(partnerId)) {
            const partnerSeed = seedMap.get(partnerId)!;
            seedMap.set(playerId, partnerSeed);
            logger.info('⚡ [THOR] Inherited partner seed', {
              player: playerId,
              partner: partnerId,
              seed: partnerSeed,
            });
          }
        });
      }

      // ========================================================================
      // Step 8: Update Participant Seeds in Tournament Document
      // ========================================================================
      let assignedCount = 0;
      let removedCount = 0;

      // 🎯 [KIM FIX] Create removal set for seed 0 requests
      const removalSet = new Set(seedRemovals.map(s => s.participantId));

      // For doubles, also add partners of removed players
      if (isDoubles) {
        seedRemovals.forEach(removal => {
          const participant = participants.find(p => p.playerId === removal.participantId);
          if (participant?.partnerId) {
            removalSet.add(participant.partnerId);
          }
        });
      }

      // Update seeds in participants array
      const updatedParticipants = participants.map(participant => {
        const playerId = participant.playerId;

        // 🎯 [KIM FIX] Check if this player's seed should be removed
        if (removalSet.has(playerId)) {
          removedCount++;
          // Remove seed by creating a copy without the seed field
          const participantCopy = { ...participant, updatedAt: admin.firestore.Timestamp.now() };
          delete (participantCopy as { seed?: number }).seed;
          return participantCopy;
        }

        const seedNumber = seedMap.get(playerId);

        if (seedNumber) {
          assignedCount++;
          return {
            ...participant,
            seed: seedNumber,
            updatedAt: admin.firestore.Timestamp.now(),
          };
        }
        return participant;
      });

      // Update tournament document with new participants array
      await tournamentRef.update({
        participants: updatedParticipants,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ========================================================================
      // Step 9: Success Response
      // ========================================================================
      logger.info('✅ [ASSIGN_SEEDS] Successfully processed seeds', {
        tournamentId,
        assignedCount,
        removedCount,
        isDoubles,
      });

      // 🎯 [KIM FIX] Include removedCount in response message
      const messageBuilder = [];
      if (assignedCount > 0) {
        messageBuilder.push(`${assignedCount} seeds assigned`);
      }
      if (removedCount > 0) {
        messageBuilder.push(`${removedCount} seeds removed`);
      }
      const resultMessage = messageBuilder.join(', ') || 'No changes made';

      return {
        success: true,
        message: isDoubles ? `${resultMessage} (with partner unification)` : resultMessage,
        data: {
          assignedCount,
        },
      };
    } catch (error) {
      // Re-throw HttpsError as is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Log unexpected errors
      logger.error('❌ [ASSIGN_SEEDS] Unexpected error', {
        tournamentId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new HttpsError(
        'internal',
        `Failed to assign seeds: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);
