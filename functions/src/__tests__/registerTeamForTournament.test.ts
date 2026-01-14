/**
 * 🌉 [HEIMDALL] registerTeamForTournament Integration Tests
 *
 * Tests team-based tournament registration Cloud Function
 * - Pre-existing team registration
 * - Team membership validation
 * - Doubles tournament validation
 * - Authorization checks
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
const { registerTeamForTournament } = require('../registerTeamForTournament');
const wrapped = testEnv.wrap(registerTeamForTournament);

describe('🌉 [HEIMDALL] registerTeamForTournament Integration Tests', () => {
  beforeEach(async () => {
    await clearFirestoreData();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  // ==========================================================================
  // Helper: Create Team
  // ==========================================================================

  async function createTeam(
    teamId: string,
    player1Id: string,
    player2Id: string,
    teamName?: string
  ) {
    await db.doc(`teams/${teamId}`).set({
      teamId,
      teamName: teamName || 'Test Team',
      player1Id,
      player2Id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // ==========================================================================
  // Success Cases
  // ==========================================================================

  describe('Success Cases', () => {
    it('should register team for doubles tournament', async () => {
      // Arrange
      const player1Id = 'team-player-1';
      const player2Id = 'team-player-2';
      const teamId = 'test-team';
      const clubId = 'test-club';
      const tournamentId = 'test-tournament-team';

      await seedFirestore({
        users: [
          createMockUser({
            uid: player1Id,
            profile: { displayName: 'Player One' },
          }),
          createMockUser({
            uid: player2Id,
            profile: { displayName: 'Player Two' },
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
          }),
        ],
      });

      await createTeam(teamId, player1Id, player2Id, 'Dream Team');

      // Act
      const result = await wrapped({
        data: {
          tournamentId,
          teamId,
          registeredBy: player1Id,
        },
        auth: { uid: player1Id },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.participantId).toBeDefined();
      expect(result.message).toContain('Dream Team');

      // Verify participant document
      const participantDoc = await db
        .doc(`tournaments/${tournamentId}/participants/${result.data.participantId}`)
        .get();
      expect(participantDoc.exists).toBe(true);

      const participantData = participantDoc.data();
      expect(participantData?.playerId).toBe(`${player1Id}_${player2Id}`);
      expect(participantData?.partnerId).toBe(player2Id);
      expect(participantData?.partnerConfirmed).toBe(true);
      expect(participantData?.teamId).toBe(teamId);

      // Verify tournament participant count
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.participantCount).toBe(1);
    });

    it('should allow either team member to register', async () => {
      // Arrange
      const player1Id = 'team-player-1-alt';
      const player2Id = 'team-player-2-alt';
      const teamId = 'test-team-alt';
      const clubId = 'test-club-alt';
      const tournamentId = 'test-tournament-alt';

      await seedFirestore({
        users: [createMockUser({ uid: player1Id }), createMockUser({ uid: player2Id })],
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

      await createTeam(teamId, player1Id, player2Id);

      // Act - Register as player 2 (not player 1)
      const result = await wrapped({
        data: {
          tournamentId,
          teamId,
          registeredBy: player2Id,
        },
        auth: { uid: player2Id },
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.participantId).toBeDefined();
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
            teamId: 'test-team',
          },
          auth: undefined,
        })
      ).rejects.toThrow('You must be logged in');
    });

    it('should reject when user is not a team member', async () => {
      // Arrange
      const player1Id = 'team-player-1-reject';
      const player2Id = 'team-player-2-reject';
      const outsiderId = 'outsider-player';
      const teamId = 'test-team-reject';
      const clubId = 'test-club-reject';
      const tournamentId = 'test-tournament-reject';

      await seedFirestore({
        users: [
          createMockUser({ uid: player1Id }),
          createMockUser({ uid: player2Id }),
          createMockUser({ uid: outsiderId }),
        ],
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

      await createTeam(teamId, player1Id, player2Id);

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            teamId,
            registeredBy: outsiderId,
          },
          auth: { uid: outsiderId },
        })
      ).rejects.toThrow('You must be a member of the team');
    });
  });

  // ==========================================================================
  // Validation Failures
  // ==========================================================================

  describe('Validation Failures', () => {
    it('should reject when team does not exist', async () => {
      // Arrange
      const userId = 'test-player-no-team';
      const clubId = 'test-club-no-team';
      const tournamentId = 'test-tournament-no-team';

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
            teamId: 'non-existent-team',
            registeredBy: userId,
          },
          auth: { uid: userId },
        })
      ).rejects.toThrow('Team not found');
    });

    it('should reject when tournament does not exist', async () => {
      // Arrange
      const player1Id = 'team-player-1-no-tournament';
      const player2Id = 'team-player-2-no-tournament';
      const teamId = 'test-team-no-tournament';

      await seedFirestore({
        users: [createMockUser({ uid: player1Id }), createMockUser({ uid: player2Id })],
      });

      await createTeam(teamId, player1Id, player2Id);

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId: 'non-existent-tournament',
            teamId,
            registeredBy: player1Id,
          },
          auth: { uid: player1Id },
        })
      ).rejects.toThrow('Tournament not found');
    });

    it('should reject when tournament is not accepting registrations', async () => {
      // Arrange
      const player1Id = 'team-player-1-not-accepting';
      const player2Id = 'team-player-2-not-accepting';
      const teamId = 'test-team-not-accepting';
      const clubId = 'test-club-not-accepting';
      const tournamentId = 'test-tournament-not-accepting';

      await seedFirestore({
        users: [createMockUser({ uid: player1Id }), createMockUser({ uid: player2Id })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            eventType: 'mens_doubles',
            status: 'in_progress', // Not accepting registrations
          }),
        ],
      });

      await createTeam(teamId, player1Id, player2Id);

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            teamId,
            registeredBy: player1Id,
          },
          auth: { uid: player1Id },
        })
      ).rejects.toThrow('not accepting registrations');
    });

    it('should reject when registering team for singles tournament', async () => {
      // Arrange
      const player1Id = 'team-player-1-singles';
      const player2Id = 'team-player-2-singles';
      const teamId = 'test-team-singles';
      const clubId = 'test-club-singles';
      const tournamentId = 'test-tournament-singles-team';

      await seedFirestore({
        users: [createMockUser({ uid: player1Id }), createMockUser({ uid: player2Id })],
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

      await createTeam(teamId, player1Id, player2Id);

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            teamId,
            registeredBy: player1Id,
          },
          auth: { uid: player1Id },
        })
      ).rejects.toThrow('Cannot register a team for singles tournaments');
    });

    it('should reject when team is already registered', async () => {
      // Arrange
      const player1Id = 'team-player-1-duplicate';
      const player2Id = 'team-player-2-duplicate';
      const teamId = 'test-team-duplicate';
      const clubId = 'test-club-duplicate';
      const tournamentId = 'test-tournament-duplicate';

      await seedFirestore({
        users: [createMockUser({ uid: player1Id }), createMockUser({ uid: player2Id })],
        clubs: [createMockClub({ id: clubId })],
        tournaments: [
          createMockTournament({
            id: tournamentId,
            clubId,
            eventType: 'mens_doubles',
            status: 'registration',
            participantCount: 1,
          }),
        ],
      });

      await createTeam(teamId, player1Id, player2Id);

      // Add existing participant with same teamId
      await db.collection(`tournaments/${tournamentId}/participants`).add({
        teamId,
        playerId: `${player1Id}_${player2Id}`,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            teamId,
            registeredBy: player1Id,
          },
          auth: { uid: player1Id },
        })
      ).rejects.toThrow('already registered');
    });

    it('should reject when team member profile does not exist', async () => {
      // Arrange
      const player1Id = 'team-player-1-no-profile';
      const player2Id = 'team-player-2-no-profile';
      const teamId = 'test-team-no-profile';
      const clubId = 'test-club-no-profile';
      const tournamentId = 'test-tournament-no-profile';

      await seedFirestore({
        users: [
          createMockUser({ uid: player1Id }), // Only player 1 exists
          // Player 2 does NOT exist
        ],
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

      await createTeam(teamId, player1Id, player2Id);

      // Act & Assert
      await expect(
        wrapped({
          data: {
            tournamentId,
            teamId,
            registeredBy: player1Id,
          },
          auth: { uid: player1Id },
        })
      ).rejects.toThrow('Team member profile not found');
    });
  });
});
