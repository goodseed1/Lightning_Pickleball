/**
 * 🌉 [HEIMDALL] Tournament End-to-End Integration Tests
 *
 * Tests complete tournament workflows from creation to completion
 * - Full tournament lifecycle (creation → registration → bracket → in progress → completed)
 * - Doubles tournament with teams
 * - Tournament cancellation scenarios
 * - Notification flows
 */

import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import {
  clearFirestoreData,
  seedFirestore,
  createMockUser,
  createMockClub,
  createMockClubMembership,
  getDoc,
} from './helpers';

const db = admin.firestore();
const testEnv = functionsTest();

// Import Cloud Functions AFTER firebase-functions-test is initialized
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createTournament } = require('../createTournament');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerForTournament } = require('../registerForTournament');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerTeamForTournament } = require('../registerTeamForTournament');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateTournamentStatus } = require('../updateTournamentStatus');

const wrappedCreate = testEnv.wrap(createTournament);
const wrappedRegister = testEnv.wrap(registerForTournament);
const wrappedRegisterTeam = testEnv.wrap(registerTeamForTournament);
const wrappedUpdateStatus = testEnv.wrap(updateTournamentStatus);

describe('🌉 [HEIMDALL] Tournament E2E Integration Tests', () => {
  beforeEach(async () => {
    await clearFirestoreData();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  // ==========================================================================
  // E2E Scenario 1: Complete Singles Tournament Lifecycle
  // ==========================================================================

  describe('Complete Singles Tournament Lifecycle', () => {
    it('should complete full tournament lifecycle from creation to completion', async () => {
      // ======================================================================
      // Setup: Create users and club
      // ======================================================================
      const hostUserId = 'host-user-e2e';
      const player1Id = 'player-1-e2e';
      const player2Id = 'player-2-e2e';
      const player3Id = 'player-3-e2e';
      const player4Id = 'player-4-e2e';
      const clubId = 'test-club-e2e';

      await seedFirestore({
        users: [
          createMockUser({ uid: hostUserId }),
          createMockUser({ uid: player1Id }),
          createMockUser({ uid: player2Id }),
          createMockUser({ uid: player3Id }),
          createMockUser({ uid: player4Id }),
        ],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId: hostUserId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      // ======================================================================
      // Step 1: Create Tournament
      // ======================================================================
      console.log('🎯 [E2E] Step 1: Creating tournament...');

      const createResult = await wrappedCreate({
        data: {
          clubId,
          tournamentName: 'E2E Test Tournament',
          title: 'E2E Test Tournament 2025',
          eventType: 'mens_singles',
          description: 'End-to-end integration test tournament',
          format: 'single_elimination',
          settings: {
            format: 'single_elimination',
            matchFormat: 'best_of_3',
            seedingMethod: 'random',
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
        },
        auth: { uid: hostUserId },
      });

      expect(createResult.success).toBe(true);
      const tournamentId = createResult.data.tournamentId;

      console.log(`✅ [E2E] Tournament created: ${tournamentId}`);

      // ======================================================================
      // Step 2: Open Registration (draft → registration)
      // ======================================================================
      console.log('🎯 [E2E] Step 2: Opening registration...');

      const openRegResult = await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'registration' },
        auth: { uid: hostUserId },
      });

      expect(openRegResult.success).toBe(true);
      expect(openRegResult.data.newStatus).toBe('registration');

      console.log('✅ [E2E] Registration opened');

      // ======================================================================
      // Step 3: Players Register
      // ======================================================================
      console.log('🎯 [E2E] Step 3: Players registering...');

      const reg1 = await wrappedRegister({
        data: { tournamentId, userId: player1Id },
        auth: { uid: player1Id },
      });
      const reg2 = await wrappedRegister({
        data: { tournamentId, userId: player2Id },
        auth: { uid: player2Id },
      });
      const reg3 = await wrappedRegister({
        data: { tournamentId, userId: player3Id },
        auth: { uid: player3Id },
      });
      const reg4 = await wrappedRegister({
        data: { tournamentId, userId: player4Id },
        auth: { uid: player4Id },
      });

      expect(reg1.success).toBe(true);
      expect(reg2.success).toBe(true);
      expect(reg3.success).toBe(true);
      expect(reg4.success).toBe(true);

      console.log('✅ [E2E] 4 players registered');

      // Verify participant count
      let tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.participantCount).toBe(4);

      // ======================================================================
      // Step 4: Close Registration & Generate Bracket (registration → bracket_generation)
      // ======================================================================
      console.log('🎯 [E2E] Step 4: Closing registration...');

      const closRegResult = await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'bracket_generation' },
        auth: { uid: hostUserId },
      });

      expect(closRegResult.success).toBe(true);
      expect(closRegResult.data.newStatus).toBe('bracket_generation');

      console.log('✅ [E2E] Registration closed, bracket generation started');

      // ======================================================================
      // Step 5: Start Tournament (bracket_generation → in_progress)
      // ======================================================================
      console.log('🎯 [E2E] Step 5: Starting tournament...');

      const startResult = await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'in_progress' },
        auth: { uid: hostUserId },
      });

      expect(startResult.success).toBe(true);
      expect(startResult.data.newStatus).toBe('in_progress');

      console.log('✅ [E2E] Tournament started');

      // ======================================================================
      // Step 6: Complete Tournament (in_progress → completed)
      // ======================================================================
      console.log('🎯 [E2E] Step 6: Completing tournament...');

      const completeResult = await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'completed' },
        auth: { uid: hostUserId },
      });

      expect(completeResult.success).toBe(true);
      expect(completeResult.data.newStatus).toBe('completed');

      console.log('✅ [E2E] Tournament completed');

      // ======================================================================
      // Final Verification
      // ======================================================================
      tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.status).toBe('completed');
      expect(tournamentDoc?.completedAt).toBeDefined();
      expect(tournamentDoc?.participantCount).toBe(4);

      // Verify activity logs exist
      const activitiesSnapshot = await db
        .collection('activities')
        .where('tournamentId', '==', tournamentId)
        .get();

      expect(activitiesSnapshot.empty).toBe(false);
      console.log(`✅ [E2E] Found ${activitiesSnapshot.size} activity log entries`);

      console.log('🎉 [E2E] Complete tournament lifecycle test passed!');
    });
  });

  // ==========================================================================
  // E2E Scenario 2: Doubles Tournament with Teams
  // ==========================================================================

  describe('Doubles Tournament with Teams', () => {
    it('should complete doubles tournament with team registration', async () => {
      // ======================================================================
      // Setup
      // ======================================================================
      const hostUserId = 'host-user-doubles-e2e';
      const player1Id = 'player-doubles-1';
      const player2Id = 'player-doubles-2';
      const player3Id = 'player-doubles-3';
      const player4Id = 'player-doubles-4';
      const clubId = 'test-club-doubles-e2e';
      const team1Id = 'team-1-e2e';
      const team2Id = 'team-2-e2e';

      await seedFirestore({
        users: [
          createMockUser({ uid: hostUserId }),
          createMockUser({ uid: player1Id }),
          createMockUser({ uid: player2Id }),
          createMockUser({ uid: player3Id }),
          createMockUser({ uid: player4Id }),
        ],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId: hostUserId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      // Create teams
      await db.doc(`teams/${team1Id}`).set({
        teamId: team1Id,
        teamName: 'Dream Team',
        player1Id,
        player2Id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.doc(`teams/${team2Id}`).set({
        teamId: team2Id,
        teamName: 'Thunder Squad',
        player1Id: player3Id,
        player2Id: player4Id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ======================================================================
      // Step 1: Create Doubles Tournament
      // ======================================================================
      console.log('🎯 [E2E DOUBLES] Step 1: Creating doubles tournament...');

      const createResult = await wrappedCreate({
        data: {
          clubId,
          tournamentName: 'E2E Doubles Tournament',
          title: 'E2E Doubles Tournament 2025',
          eventType: 'mens_doubles',
          description: 'End-to-end doubles test tournament',
          format: 'single_elimination',
          settings: {
            format: 'single_elimination',
            matchFormat: 'best_of_3',
            seedingMethod: 'random',
            minParticipants: 2,
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
        },
        auth: { uid: hostUserId },
      });

      expect(createResult.success).toBe(true);
      const tournamentId = createResult.data.tournamentId;

      // ======================================================================
      // Step 2: Open Registration
      // ======================================================================
      console.log('🎯 [E2E DOUBLES] Step 2: Opening registration...');

      await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'registration' },
        auth: { uid: hostUserId },
      });

      // ======================================================================
      // Step 3: Teams Register
      // ======================================================================
      console.log('🎯 [E2E DOUBLES] Step 3: Teams registering...');

      const teamReg1 = await wrappedRegisterTeam({
        data: {
          tournamentId,
          teamId: team1Id,
          registeredBy: player1Id,
        },
        auth: { uid: player1Id },
      });

      const teamReg2 = await wrappedRegisterTeam({
        data: {
          tournamentId,
          teamId: team2Id,
          registeredBy: player3Id,
        },
        auth: { uid: player3Id },
      });

      expect(teamReg1.success).toBe(true);
      expect(teamReg2.success).toBe(true);

      console.log('✅ [E2E DOUBLES] 2 teams registered');

      // Verify tournament participant count
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.participantCount).toBe(2);

      // ======================================================================
      // Step 4: Complete Tournament Lifecycle
      // ======================================================================
      console.log('🎯 [E2E DOUBLES] Step 4: Completing lifecycle...');

      // registration → bracket_generation
      await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'bracket_generation' },
        auth: { uid: hostUserId },
      });

      // bracket_generation → in_progress
      await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'in_progress' },
        auth: { uid: hostUserId },
      });

      // in_progress → completed
      const completeResult = await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'completed' },
        auth: { uid: hostUserId },
      });

      expect(completeResult.success).toBe(true);

      console.log('🎉 [E2E DOUBLES] Doubles tournament test passed!');
    });
  });

  // ==========================================================================
  // E2E Scenario 3: Tournament Cancellation
  // ==========================================================================

  describe('Tournament Cancellation', () => {
    it('should cancel tournament after registration period', async () => {
      // ======================================================================
      // Setup
      // ======================================================================
      const hostUserId = 'host-user-cancel-e2e';
      const player1Id = 'player-cancel-1';
      const clubId = 'test-club-cancel-e2e';

      await seedFirestore({
        users: [createMockUser({ uid: hostUserId }), createMockUser({ uid: player1Id })],
        clubs: [createMockClub({ id: clubId })],
        memberships: [
          {
            userId: hostUserId,
            clubId,
            data: createMockClubMembership({ role: 'admin' }),
          },
        ],
      });

      // ======================================================================
      // Step 1: Create Tournament
      // ======================================================================
      console.log('🎯 [E2E CANCEL] Step 1: Creating tournament...');

      const createResult = await wrappedCreate({
        data: {
          clubId,
          tournamentName: 'E2E Cancellation Test',
          title: 'E2E Cancellation Test 2025',
          eventType: 'mens_singles',
          description: 'Test tournament cancellation flow',
          format: 'single_elimination',
          settings: {
            format: 'single_elimination',
            matchFormat: 'best_of_3',
            seedingMethod: 'random',
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
        },
        auth: { uid: hostUserId },
      });

      const tournamentId = createResult.data.tournamentId;

      // ======================================================================
      // Step 2: Open Registration
      // ======================================================================
      console.log('🎯 [E2E CANCEL] Step 2: Opening registration...');

      await wrappedUpdateStatus({
        data: { tournamentId, newStatus: 'registration' },
        auth: { uid: hostUserId },
      });

      // ======================================================================
      // Step 3: Register 1 Player (Insufficient)
      // ======================================================================
      console.log('🎯 [E2E CANCEL] Step 3: Registering insufficient players...');

      await wrappedRegister({
        data: { tournamentId, userId: player1Id },
        auth: { uid: player1Id },
      });

      // ======================================================================
      // Step 4: Cancel Due to Insufficient Participants
      // ======================================================================
      console.log('🎯 [E2E CANCEL] Step 4: Cancelling tournament...');

      const cancelResult = await wrappedUpdateStatus({
        data: {
          tournamentId,
          newStatus: 'cancelled',
          reason: 'Insufficient participants - only 1 registered (minimum: 4)',
        },
        auth: { uid: hostUserId },
      });

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.data.newStatus).toBe('cancelled');

      // ======================================================================
      // Verification
      // ======================================================================
      const tournamentDoc = await getDoc(`tournaments/${tournamentId}`);
      expect(tournamentDoc?.status).toBe('cancelled');
      expect(tournamentDoc?.cancellationReason).toBe(
        'Insufficient participants - only 1 registered (minimum: 4)'
      );
      expect(tournamentDoc?.cancelledBy).toBe(hostUserId);
      expect(tournamentDoc?.cancelledAt).toBeDefined();

      // ======================================================================
      // Step 5: Verify Cannot Reopen Cancelled Tournament
      // ======================================================================
      console.log('🎯 [E2E CANCEL] Step 5: Verifying cannot reopen...');

      await expect(
        wrappedUpdateStatus({
          data: { tournamentId, newStatus: 'registration' },
          auth: { uid: hostUserId },
        })
      ).rejects.toThrow('Cannot transition from cancelled');

      console.log('🎉 [E2E CANCEL] Tournament cancellation test passed!');
    });
  });
});
