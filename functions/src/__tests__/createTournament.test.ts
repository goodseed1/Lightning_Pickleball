/**
 * 🧪 Integration Tests: createTournament
 * Tests the complete createTournament Cloud Function flow
 */

import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import {
  clearFirestoreData,
  seedFirestore,
  createMockUser,
  createMockClub,
  createMockClubMembership,
} from './helpers';

const db = admin.firestore();
const testEnv = functionsTest();

// Import the function AFTER firebase-functions-test is initialized
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createTournament } = require('../createTournament');
const wrapped = testEnv.wrap(createTournament);

describe('🌉 [HEIMDALL] createTournament Integration Tests', () => {
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
    it('should create tournament when user is club admin', async () => {
      // Arrange
      const userId = 'test-admin';
      const clubId = 'test-club';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      const requestData = {
        clubId,
        tournamentName: 'Integration Test Tournament',
        title: 'Integration Test Tournament 2025',
        eventType: 'mens_singles' as const,
        description: 'Test tournament for integration testing',
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 4,
          maxParticipants: 16,
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Act
      const result = await wrapped({
        data: requestData,
        auth: { uid: userId },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('created successfully');
      expect(result.data.tournamentId).toBeDefined();

      // Verify tournament document exists
      const tournamentDoc = await db.doc(`tournaments/${result.data.tournamentId}`).get();
      expect(tournamentDoc.exists).toBe(true);

      const tournamentData = tournamentDoc.data()!;
      expect(tournamentData.tournamentName).toBe('Integration Test Tournament');
      expect(tournamentData.status).toBe('draft');
      expect(tournamentData.createdBy).toBe(userId);
      expect(tournamentData.clubId).toBe(clubId);
      expect(tournamentData.participantCount).toBe(0);

      // Verify activity log exists
      const activitiesSnapshot = await db
        .collection('activities')
        .where('type', '==', 'tournament_created')
        .where('tournamentId', '==', result.data.tournamentId)
        .get();

      expect(activitiesSnapshot.empty).toBe(false);
    });

    it('should calculate tournament metadata correctly', async () => {
      const userId = 'test-admin';
      const clubId = 'test-club';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      const requestData = {
        clubId,
        tournamentName: 'Metadata Test',
        title: 'Metadata Test',
        eventType: 'mens_doubles' as const,
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 4,
          maxParticipants: 16, // 16 participants = 4 rounds, 15 matches
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await wrapped({
        data: requestData,
        auth: { uid: userId },
      });

      const tournamentDoc = await db.doc(`tournaments/${result.data.tournamentId}`).get();
      const tournamentData = tournamentDoc.data()!;

      // Verify metadata calculations
      expect(tournamentData.totalRounds).toBe(4); // log2(16) = 4
      expect(tournamentData.totalMatches).toBe(15); // 16 - 1 = 15
    });
  });

  // ==========================================================================
  // Authorization Failures
  // ==========================================================================

  describe('Authorization Failures', () => {
    it('should reject when user is not authenticated', async () => {
      const requestData = {
        clubId: 'test-club',
        tournamentName: 'Unauthorized Test',
        title: 'Unauthorized Test',
        eventType: 'mens_singles' as const,
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 4,
          maxParticipants: 16,
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        wrapped(requestData, {
          auth: undefined,
        })
      ).rejects.toThrow();
    });

    it('should reject when user is not club member', async () => {
      const userId = 'test-user';
      const clubId = 'test-club';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        // No membership!
      });

      const requestData = {
        clubId,
        tournamentName: 'Non-Member Test',
        title: 'Non-Member Test',
        eventType: 'mens_singles' as const,
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 4,
          maxParticipants: 16,
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        wrapped(requestData, {
          auth: { uid: userId },
        })
      ).rejects.toThrow();
    });

    it('should reject when user is regular member (not admin)', async () => {
      const userId = 'test-member';
      const clubId = 'test-club';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId,
            clubId,
            data: createMockClubMembership({ role: 'member' }), // Regular member
          },
        ],
      });

      const requestData = {
        clubId,
        tournamentName: 'Member Test',
        title: 'Member Test',
        eventType: 'mens_singles' as const,
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 4,
          maxParticipants: 16,
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        wrapped(requestData, {
          auth: { uid: userId },
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Validation Failures
  // ==========================================================================

  describe('Validation Failures', () => {
    it('should reject when start date is in the past', async () => {
      const userId = 'test-admin';
      const clubId = 'test-club';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      const requestData = {
        clubId,
        tournamentName: 'Past Date Test',
        title: 'Past Date Test',
        eventType: 'mens_singles' as const,
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 4,
          maxParticipants: 16,
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Past date
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        wrapped(requestData, {
          auth: { uid: userId },
        })
      ).rejects.toThrow();
    });

    it('should reject when max participants is less than min participants', async () => {
      const userId = 'test-admin';
      const clubId = 'test-club';

      await seedFirestore({
        users: [createMockUser({ uid: userId })],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      const requestData = {
        clubId,
        tournamentName: 'Invalid Participants Test',
        title: 'Invalid Participants Test',
        eventType: 'mens_singles' as const,
        format: 'single_elimination' as const,
        settings: {
          format: 'single_elimination' as const,
          matchFormat: 'best_of_3' as const,
          seedingMethod: 'random' as const,
          minParticipants: 16, // More than max!
          maxParticipants: 8,
          allowByes: true,
          scoringFormat: {
            setsToWin: 2,
            gamesPerSet: 6,
            tiebreakAt: 6,
            noAdScoring: false,
            tiebreakPoints: 7,
          },
          matchDuration: 90,
          thirdPlaceMatch: false,
          consolationBracket: false,
          allowWalkovers: true,
        },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await expect(
        wrapped(requestData, {
          auth: { uid: userId },
        })
      ).rejects.toThrow();
    });
  });
});
