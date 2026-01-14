/**
 * 🌉 [HEIMDALL] registerForTournament Integration Tests
 *
 * Tests tournament registration Cloud Function
 * - Singles registration
 * - Doubles registration with partner
 * - Authorization checks
 * - Validation rules
 */

import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import {
  clearFirestoreData,
  seedFirestore,
  createMockUser,
  createMockClub,
  createMockTournament,
  getDoc,
} from './helpers';

const db = admin.firestore();
const testEnv = functionsTest();

// Import the function AFTER firebase-functions-test is initialized
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerForTournament } = require('../registerForTournament');
const wrapped = testEnv.wrap(registerForTournament);

describe('🌉 [HEIMDALL] registerForTournament Integration Tests', () => {
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
    it('should register user for singles tournament', async () => {
      // Arrange
      const userId = 'test-player-success-singles';
      const clubId = 'test-club-success-singles';
      const tournamentId = 'test-tournament-success-singles';

      await seedFirestore({
        users: [
          createMockUser({
            uid: userId,
            profile: {
              displayName: 'Test Player',
              firstName: 'Test',
              lastName: 'Player',
              gender: 'male',
              skillLevel: 'intermediate',
            },
          }),
        ],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            eventType: 'mens_singles',
            status: 'registration',
            participantCount: 0,
            settings: {
              minParticipants: 4,
              maxParticipants: 16,
            },
          }),
        ],
      });

      // Act
      const result = await wrapped({
        data: {
          tournamentId,
          userId,
        },
        auth: { uid: userId },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.participantId).toBeDefined();
      expect(result.message).toContain('Successfully registered');

      // Verify participant document exists
      const participantDoc = await db
        .doc(`tournaments/${tournamentId}/participants/${result.data.participantId}`)
        .get();
      expect(participantDoc.exists).toBe(true);

      const participantData = participantDoc.data();
      expect(participantData?.playerId).toBe(userId);
      expect(participantData?.playerName).toBe('Test Player');
      expect(participantData?.skillLevel).toBe('intermediate');

      // Verify tournament participant count was incremented
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.participantCount).toBe(1);
    });

    it('should register user with partner for doubles tournament', async () => {
      // Arrange
      const userId = 'test-player-success-doubles-1';
      const partnerId = 'test-player-success-doubles-2';
      const clubId = 'test-club-success-doubles';
      const tournamentId = 'test-tournament-success-doubles';

      await seedFirestore({
        users: [
          createMockUser({
            uid: userId,
            profile: {
              displayName: 'Player One',
              firstName: 'Player',
              lastName: 'One',
              gender: 'male',
              skillLevel: 'intermediate',
            },
          }),
          createMockUser({
            uid: partnerId,
            profile: {
              displayName: 'Player Two',
              firstName: 'Player',
              lastName: 'Two',
              gender: 'male',
              skillLevel: 'intermediate',
            },
          }),
        ],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            eventType: 'mens_doubles',
            status: 'registration',
            participantCount: 0,
            settings: {
              minParticipants: 4,
              maxParticipants: 16,
            },
          }),
        ],
      });

      // Act
      const result = await wrapped({
        data: {
          tournamentId,
          userId,
          partnerInfo: {
            partnerId,
            partnerName: 'Player Two',
          },
        },
        auth: { uid: userId },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('with your partner');

      // Verify participant document
      const participantDoc = await db
        .doc(`tournaments/${tournamentId}/participants/${result.data.participantId}`)
        .get();
      expect(participantDoc.exists).toBe(true);

      const participantData = participantDoc.data();
      expect(participantData?.playerId).toBe(userId);
      expect(participantData?.partnerId).toBe(partnerId);
      expect(participantData?.partnerName).toBe('Player Two');
      expect(participantData?.partnerConfirmed).toBe(false);
    });

    it('should allow multiple registrations for same tournament (different users)', async () => {
      // Arrange
      const user1Id = 'test-player-success-multi-1';
      const user2Id = 'test-player-success-multi-2';
      const clubId = 'test-club-success-multi';
      const tournamentId = 'test-tournament-success-multi';

      await seedFirestore({
        users: [createMockUser({ uid: user1Id }), createMockUser({ uid: user2Id })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'registration',
            participantCount: 0,
            settings: {
              minParticipants: 4,
              maxParticipants: 16,
            },
          }),
        ],
      });

      // Act - Register user 1
      const result1 = await wrapped({
        data: { tournamentId, userId: user1Id },
        auth: { uid: user1Id },
      });

      // Act - Register user 2
      const result2 = await wrapped({
        data: { tournamentId, userId: user2Id },
        auth: { uid: user2Id },
      });

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Verify tournament participant count
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.participantCount).toBe(2);
    });
  });

  // ==========================================================================
  // Authorization Failures
  // ==========================================================================

  describe('Authorization Failures', () => {
    it('should reject when user is not authenticated', async () => {
      // Arrange
      const tournamentId = 'test-tournament';

      // Act & Assert
      await expect(
        wrapped({
          data: { tournamentId },
          auth: undefined,
        })
      ).rejects.toThrow('You must be logged in');
    });

    it('should reject when user tries to register someone else', async () => {
      // Arrange
      const userId = 'test-player';
      const otherUserId = 'other-player';
      const clubId = 'test-club';
      const tournamentId = 'test-tournament';

      await seedFirestore({
        users: [createMockUser({ uid: userId }), createMockUser({ uid: otherUserId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'registration',
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            userId: otherUserId, // Trying to register someone else
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('You can only register yourself');
    });
  });

  // ==========================================================================
  // Validation Failures
  // ==========================================================================

  describe('Validation Failures', () => {
    it('should reject when tournament does not exist', async () => {
      // Arrange
      const userId = 'test-player';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: { tournamentId: 'non-existent-tournament', userId },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Tournament not found');
    });

    it('should reject when tournament is not in registration status', async () => {
      // Arrange
      const userId = 'test-player';
      const clubId = 'test-club';
      const tournamentId = 'test-tournament';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'in_progress', // Not accepting registrations
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: { tournamentId, userId },
          auth: { uid: userId },
        })
      ).rejects.toThrow('not accepting registrations');
    });

    it('should reject when tournament is full', async () => {
      // Arrange
      const userId = 'test-player-full';
      const clubId = 'test-club-full';
      const tournamentId = 'test-tournament-full';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'registration',
            participantCount: 16, // Full
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
          data: { tournamentId, userId },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Tournament is full');
    });

    it('should reject when user is already registered', async () => {
      // Arrange
      const userId = 'test-player';
      const clubId = 'test-club';
      const tournamentId = 'test-tournament';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'registration',
            participantCount: 1,
          }),
        ],
      });

      // Add existing participant
      await db.collection(`tournaments/${tournamentId}/participants`).add({
        playerId: userId,
        playerName: 'Test Player',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Act & Assert
      await expect(
        wrapped({
          data: { tournamentId, userId },
          auth: { uid: userId },
        })
      ).rejects.toThrow('already registered');
    });

    it('should reject when partner does not exist', async () => {
      // Arrange
      const userId = 'test-player-no-partner';
      const clubId = 'test-club-no-partner';
      const tournamentId = 'test-tournament-no-partner';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            eventType: 'mens_doubles',
            status: 'registration',
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            userId,
            partnerInfo: {
              partnerId: 'non-existent-partner-unique',
              partnerName: 'Ghost Partner',
            },
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Partner profile not found');
    });

    it('should reject when registering with partner for singles tournament', async () => {
      // Arrange
      const userId = 'test-player-singles-with-partner';
      const partnerId = 'test-partner-singles';
      const clubId = 'test-club-singles';
      const tournamentId = 'test-tournament-singles-partner';

      await seedFirestore({
        users: [createMockUser({ uid: userId }), createMockUser({ uid: partnerId })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            eventType: 'mens_singles', // Singles tournament
            status: 'registration',
          }),
        ],
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            userId,
            partnerInfo: {
              partnerId,
              partnerName: 'Test Partner',
            },
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Cannot register with a partner for singles tournaments');
    });

    it('should reject when user profile does not exist', async () => {
      // Arrange
      const userId = 'test-player-no-profile';
      const clubId = 'test-club-no-profile';
      const tournamentId = 'test-tournament-no-profile';

      await seedFirestore({
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            status: 'registration',
          }),
        ],
      });
      // Note: User not created

      // Act & Assert
      await expect(
        wrapped({
          data: { tournamentId, userId },
          auth: { uid: userId },
        })
      ).rejects.toThrow('User profile not found');
    });
  });
});
