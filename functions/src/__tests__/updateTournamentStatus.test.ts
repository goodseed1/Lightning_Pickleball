/**
 * 🌉 [HEIMDALL] updateTournamentStatus Integration Tests
 *
 * Tests tournament status update Cloud Function
 * - State machine transitions
 * - Authorization checks
 * - Business logic validation
 * - Participant notifications
 */

import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import {
  clearFirestoreData,
  seedFirestore,
  createMockUser,
  createMockClub,
  createMockTournament,
  createMockClubMembership,
  getDoc,
} from './helpers';

const db = admin.firestore();
const testEnv = functionsTest();

// Import the function AFTER firebase-functions-test is initialized
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateTournamentStatus } = require('../updateTournamentStatus');
const wrapped = testEnv.wrap(updateTournamentStatus);

describe('🌉 [HEIMDALL] updateTournamentStatus Integration Tests', () => {
  beforeEach(async () => {
    await clearFirestoreData();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  // ==========================================================================
  // Success Cases
  // ==========================================================================

  describe('Success Cases', () => {
    it('should update status from draft to registration (host)', async () => {
      // Arrange
      const userId = 'tournament-host-draft-to-reg';
      const clubId = 'test-club-draft-to-reg';
      const tournamentId = 'test-tournament-draft-to-reg';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'draft',
            createdBy: userId,
          }),
        ],
      });

      // Act
      const result = await wrapped({
        data: {
          tournamentId,
          newStatus: 'registration',
        },
        auth: { uid: userId },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.previousStatus).toBe('draft');
      expect(result.data.newStatus).toBe('registration');

      // Verify tournament status was updated
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.status).toBe('registration');
    });

    it('should update status as club admin', async () => {
      // Arrange
      const hostUserId = 'tournament-host-admin';
      const adminUserId = 'club-admin-user';
      const clubId = 'test-club-admin';
      const tournamentId = 'test-tournament-admin';

      await seedFirestore({
        users: [createMockUser({ uid: hostUserId }), createMockUser({ uid: adminUserId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'draft',
            createdBy: hostUserId,
          }),
        ],
        memberships: [
          {
            userId: adminUserId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      // Act
      const result = await wrapped({
        data: {
          tournamentId,
          newStatus: 'registration',
        },
        auth: { uid: adminUserId },
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should transition through full lifecycle', async () => {
      // Arrange
      const userId = 'tournament-host-lifecycle';
      const clubId = 'test-club-lifecycle';
      const tournamentId = 'test-tournament-lifecycle';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'draft',
            createdBy: userId,
            participantCount: 8, // Sufficient for starting
            settings: {
              minParticipants: 4,
              maxParticipants: 16,
            },
          }),
        ],
      });

      // Act & Assert - draft → registration
      let result = await wrapped({
        data: { tournamentId, newStatus: 'registration' },
        auth: { uid: userId },
      });
      expect(result.success).toBe(true);

      // Act & Assert - registration → bracket_generation
      result = await wrapped({
        data: { tournamentId, newStatus: 'bracket_generation' },
        auth: { uid: userId },
      });
      expect(result.success).toBe(true);

      // Act & Assert - bracket_generation → in_progress
      result = await wrapped({
        data: { tournamentId, newStatus: 'in_progress' },
        auth: { uid: userId },
      });
      expect(result.success).toBe(true);

      // Act & Assert - in_progress → completed
      result = await wrapped({
        data: { tournamentId, newStatus: 'completed' },
        auth: { uid: userId },
      });
      expect(result.success).toBe(true);

      // Verify final state
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.status).toBe('completed');
      expect(tournamentDoc?.completedAt).toBeDefined();
    });

    it('should add cancellation metadata when cancelling', async () => {
      // Arrange
      const userId = 'tournament-host-cancel';
      const clubId = 'test-club-cancel';
      const tournamentId = 'test-tournament-cancel';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'registration',
            createdBy: userId,
          }),
        ],
      });

      // Act
      const result = await wrapped({
        data: {
          tournamentId,
          newStatus: 'cancelled',
          reason: 'Insufficient participants',
        },
        auth: { uid: userId },
      });

      // Assert
      expect(result.success).toBe(true);

      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.status).toBe('cancelled');
      expect(tournamentDoc?.cancellationReason).toBe('Insufficient participants');
      expect(tournamentDoc?.cancelledBy).toBe(userId);
      expect(tournamentDoc?.cancelledAt).toBeDefined();
    });
  });

  // ==========================================================================
  // Authorization Failures
  // ==========================================================================

  describe('Authorization Failures', () => {
    it('should reject when user is not authenticated', async () => {
      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId: 'test-tournament',
            newStatus: 'registration',
          },
          auth: undefined,
        })
      ).rejects.toThrow('You must be logged in');
    });

    it('should reject when user is not host or club admin', async () => {
      // Arrange
      const hostUserId = 'tournament-host-not-admin';
      const randomUserId = 'random-user-not-admin';
      const clubId = 'test-club-not-admin';
      const tournamentId = 'test-tournament-not-admin';

      await seedFirestore({
        users: [createMockUser({ uid: hostUserId }), createMockUser({ uid: randomUserId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'draft',
            createdBy: hostUserId,
          }),
        ],
        memberships: [
          {
            userId: randomUserId,
            clubId,
            data: createMockClubMembership({ role: 'member' }), // Not admin
          },
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            newStatus: 'registration',
          },
          auth: { uid: randomUserId },
        })
      ).rejects.toThrow('Only tournament host or club admins');
    });
  });

  // ==========================================================================
  // Validation Failures
  // ==========================================================================

  describe('Validation Failures', () => {
    it('should reject when tournament does not exist', async () => {
      // Arrange
      const userId = 'test-user-no-tournament';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId: 'non-existent-tournament',
            newStatus: 'registration',
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Tournament not found');
    });

    it('should reject invalid state transition', async () => {
      // Arrange
      const userId = 'tournament-host-invalid-transition';
      const clubId = 'test-club-invalid-transition';
      const tournamentId = 'test-tournament-invalid-transition';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'draft',
            createdBy: userId,
          }),
        ],
      });

      // Act & Assert - draft → in_progress (invalid, must go through registration)
      await expect(
        wrapped({
          data: {
            tournamentId,
            newStatus: 'in_progress',
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Cannot transition from draft');
    });

    it('should reject starting tournament with insufficient participants', async () => {
      // Arrange
      const userId = 'tournament-host-insufficient';
      const clubId = 'test-club-insufficient';
      const tournamentId = 'test-tournament-insufficient';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'bracket_generation',
            createdBy: userId,
            participantCount: 2, // Less than minimum
            settings: {
              minParticipants: 4,
              maxParticipants: 16,
            },
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            newStatus: 'in_progress',
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Cannot start tournament with');
    });

    it('should reject transition from completed state', async () => {
      // Arrange
      const userId = 'tournament-host-completed';
      const clubId = 'test-club-completed';
      const tournamentId = 'test-tournament-completed';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'completed', // Terminal state
            createdBy: userId,
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            newStatus: 'registration',
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Cannot transition from completed');
    });

    it('should reject transition from cancelled state', async () => {
      // Arrange
      const userId = 'tournament-host-cancelled';
      const clubId = 'test-club-cancelled';
      const tournamentId = 'test-tournament-cancelled';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'cancelled', // Terminal state
            createdBy: userId,
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            newStatus: 'registration',
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Cannot transition from cancelled');
    });
  });

  // ==========================================================================
  // Business Logic Tests
  // ==========================================================================

  describe('Business Logic', () => {
    it('should log activity when status changes', async () => {
      // Arrange
      const userId = 'tournament-host-activity';
      const clubId = 'test-club-activity';
      const tournamentId = 'test-tournament-activity';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'draft',
            createdBy: userId,
          }),
        ],
      });

      // Act
      await wrapped({
        data: {
          tournamentId,
          newStatus: 'registration',
        },
        auth: { uid: userId },
      });

      // Assert - Check activity log exists
      const activitiesSnapshot = await db
        .collection('activities')
        .where('type', '==', 'tournament_status_changed')
        .where('tournamentId', '==', tournamentId)
        .get();

      expect(activitiesSnapshot.empty).toBe(false);
      const activityData = activitiesSnapshot.docs[0].data();
      expect(activityData.previousStatus).toBe('draft');
      expect(activityData.newStatus).toBe('registration');
      expect(activityData.userId).toBe(userId);
    });
  });
});
