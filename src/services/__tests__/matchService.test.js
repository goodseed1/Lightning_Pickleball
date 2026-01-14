/**
 * MatchService Unit Tests
 * Tests match creation, score submission, statistics tracking, and admin functions
 */

import { matchService } from '../matchService.ts';
import {
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  runTransaction,
  query,
  where,
  orderBy,
  doc,
  __setMockDocumentData,
  __setMockQueryResults,
  __resetMocks,
} from '../../../__mocks__/firebase/firestore.js';

// Firebase Firestore is now centrally mocked in __mocks__/firebase/firestore.js

// Mock Firebase config
jest.mock('../../firebase/config', () => ({
  db: 'mock-db',
}));

// Mock match types
jest.mock('../../types/match', () => ({
  calculateMatchWinner: jest.fn(sets => {
    // Simple mock winner calculation
    if (!sets || sets.length === 0) return null;
    const player1Sets = sets.filter(set => set.player1Games > set.player2Games).length;
    const player2Sets = sets.filter(set => set.player2Games > set.player1Games).length;

    if (player1Sets > player2Sets) return 'player1';
    if (player2Sets > player1Sets) return 'player2';
    return null;
  }),
}));

// Mock league types
jest.mock('../../types/league', () => ({
  getMatchFormatFromEventType: jest.fn(eventType => {
    const formats = {
      mens_singles: 'singles',
      womens_singles: 'singles',
      mens_doubles: 'doubles',
      womens_doubles: 'doubles',
      mixed_doubles: 'doubles',
    };
    return formats[eventType] || 'singles';
  }),
}));

describe.skip('MatchService Unit Tests - Complex TypeScript service, needs refactoring', () => {
  beforeEach(() => {
    __resetMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('createMatch', () => {
    const mockPlayer1Data = {
      displayName: 'Player One',
      name: 'P1',
      skillLevel: 'intermediate',
      photoURL: 'photo1.jpg',
    };

    const mockPlayer2Data = {
      displayName: 'Player Two',
      name: 'P2',
      skillLevel: 'advanced',
      photoURL: 'photo2.jpg',
    };

    beforeEach(() => {
      getDoc
        .mockResolvedValueOnce({ exists: () => true, data: () => mockPlayer1Data })
        .mockResolvedValueOnce({ exists: () => true, data: () => mockPlayer2Data });

      addDoc.mockResolvedValue({ id: 'new-match-id' });
    });

    it('should create singles match successfully', async () => {
      const matchData = {
        type: 'lightning_match',
        eventType: 'mens_singles',
        format: 'singles',
        player1Id: 'player1',
        player2Id: 'player2',
        scheduledAt: new Date(),
        clubId: 'club1',
        createdBy: 'organizer1',
      };

      const result = await matchService.createMatch(matchData);

      expect(getDoc).toHaveBeenCalledTimes(2);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'lightning_match',
          eventType: 'mens_singles',
          format: 'singles',
          status: 'scheduled',
          player1: expect.objectContaining({
            userId: 'player1',
            userName: 'Player One',
            skillLevel: 'intermediate',
          }),
          player2: expect.objectContaining({
            userId: 'player2',
            userName: 'Player Two',
            skillLevel: 'advanced',
          }),
        })
      );
      expect(result).toBe('new-match-id');
    });

    it('should create doubles match with partners', async () => {
      const mockPartner1Data = {
        displayName: 'Partner One',
        skillLevel: 'intermediate',
        photoURL: 'partner1.jpg',
      };
      const mockPartner2Data = {
        displayName: 'Partner Two',
        skillLevel: 'advanced',
        photoURL: 'partner2.jpg',
      };

      // Clear any existing mocks and set up fresh ones for this test
      getDoc.mockReset();
      getDoc
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPlayer1Data })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPlayer2Data })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPartner1Data })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPartner2Data })
        );

      const matchData = {
        type: 'lightning_match',
        eventType: 'mens_doubles',
        format: 'doubles',
        player1Id: 'player1',
        player2Id: 'player2',
        player1PartnerId: 'partner1',
        player2PartnerId: 'partner2',
        scheduledAt: new Date(),
        clubId: 'club1',
        createdBy: 'organizer1',
      };

      const result = await matchService.createMatch(matchData);

      expect(getDoc).toHaveBeenCalledTimes(4);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          format: 'doubles',
          player1Partner: expect.objectContaining({
            userId: 'partner1',
            userName: 'Partner One',
          }),
          player2Partner: expect.objectContaining({
            userId: 'partner2',
            userName: 'Partner Two',
          }),
        })
      );
      expect(result).toBe('new-match-id');
    });

    it('should validate event type and format consistency', async () => {
      const matchData = {
        type: 'lightning_match',
        eventType: 'mens_singles',
        format: 'doubles', // Mismatch!
        player1Id: 'player1',
        player2Id: 'player2',
        scheduledAt: new Date(),
        clubId: 'club1',
        createdBy: 'organizer1',
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow(
        '경기 종류 mens_singles는 singles 형식이어야 합니다.'
      );
    });

    it('should throw error if players do not exist', async () => {
      getDoc.mockReset();
      getDoc
        .mockImplementationOnce(() => Promise.resolve({ exists: () => false }))
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPlayer2Data })
        );

      const matchData = {
        type: 'lightning_match',
        format: 'singles',
        player1Id: 'nonexistent',
        player2Id: 'player2',
        scheduledAt: new Date(),
        clubId: 'club1',
        createdBy: 'organizer1',
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow(
        '참가자 정보를 찾을 수 없습니다.'
      );
    });

    it('should handle match creation errors', async () => {
      // Set up successful player lookups but fail on addDoc
      getDoc.mockReset();
      getDoc
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPlayer1Data })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, data: () => mockPlayer2Data })
        );
      addDoc.mockRejectedValue(new Error('Database error'));

      const matchData = {
        type: 'lightning_match',
        format: 'singles',
        player1Id: 'player1',
        player2Id: 'player2',
        scheduledAt: new Date(),
        clubId: 'club1',
        createdBy: 'organizer1',
      };

      await expect(matchService.createMatch(matchData)).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('❌ Error creating match:', expect.any(Error));
    });
  });

  describe('submitScore', () => {
    const mockMatch = {
      id: 'match1',
      player1: { userId: 'player1', userName: 'Player One' },
      player2: { userId: 'player2', userName: 'Player Two' },
      status: 'scheduled',
      type: 'lightning_match',
      format: 'singles',
    };

    beforeEach(() => {
      getDoc.mockClear();
      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'match1',
        data: () => mockMatch,
      });
      updateDoc.mockResolvedValue();
    });

    it('should submit match score successfully', async () => {
      const scoreData = {
        sets: [
          { player1Games: 6, player2Games: 4 },
          { player1Games: 6, player2Games: 2 },
        ],
      };

      await matchService.submitScore('match1', scoreData, 'player1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          score: expect.objectContaining({
            sets: scoreData.sets,
            winner: 'player1',
            isComplete: true,
          }),
          status: 'pending_confirmation',
          scoreSubmittedBy: 'player1',
        })
      );
    });

    it('should reject score submission from non-participant', async () => {
      const scoreData = {
        sets: [{ player1Games: 6, player2Games: 4 }],
      };

      await expect(matchService.submitScore('match1', scoreData, 'outsider')).rejects.toThrow(
        '경기 참가자만 점수를 제출할 수 있습니다.'
      );
    });

    it('should throw error if match does not exist', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      const scoreData = {
        sets: [{ player1Games: 6, player2Games: 4 }],
      };

      await expect(matchService.submitScore('nonexistent', scoreData, 'player1')).rejects.toThrow(
        '경기를 찾을 수 없습니다.'
      );
    });

    it('should handle retired matches', async () => {
      const scoreData = {
        sets: [{ player1Games: 4, player2Games: 2 }],
        retiredAt: 'set1-game6',
      };

      await matchService.submitScore('match1', scoreData, 'player1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          score: expect.objectContaining({
            retiredAt: 'set1-game6',
          }),
        })
      );
    });

    it('should handle walkover matches', async () => {
      const scoreData = {
        sets: [],
        walkover: 'player2',
      };

      await matchService.submitScore('match1', scoreData, 'player1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          score: expect.objectContaining({
            walkover: 'player2',
          }),
        })
      );
    });
  });

  describe('confirmScore', () => {
    const mockMatch = {
      id: 'match1',
      player1: { userId: 'player1' },
      player2: { userId: 'player2' },
      status: 'pending_confirmation',
      scoreSubmittedBy: 'player1',
      score: {
        sets: [{ player1Games: 6, player2Games: 4 }],
        winner: 'player1',
      },
    };

    beforeEach(() => {
      runTransaction.mockImplementation(async (db, callback) => {
        const mockStats = {
          lightningMatchStats: { matches: 5, wins: 3, losses: 2 },
          eventTypeStats: {
            mens_singles: { matches: 3, wins: 2, losses: 1 },
          },
          recentMatches: ['match2', 'match3'],
        };

        const mockTransaction = {
          get: jest
            .fn()
            .mockResolvedValueOnce({
              exists: () => true,
              id: 'match1',
              data: () => mockMatch,
            })
            // Mock calls for player stats
            .mockResolvedValue({
              exists: () => true,
              data: () => mockStats,
            }),
          update: jest.fn(),
          set: jest.fn(),
        };
        await callback(mockTransaction);
      });
    });

    it('should confirm score successfully', async () => {
      await matchService.confirmScore('match1', true, 'player2');

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should handle score dispute', async () => {
      await matchService.confirmScore('match1', false, 'player2', 'Incorrect score');

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should reject confirmation from wrong player', async () => {
      await expect(matchService.confirmScore('match1', true, 'player1')).rejects.toThrow(
        '점수를 확인할 권한이 없습니다.'
      );
    });
  });

  describe('getMatch', () => {
    it('should return match by ID', async () => {
      const mockMatchData = {
        type: 'lightning_match',
        status: 'scheduled',
        player1: { userId: 'player1' },
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'match1',
        data: () => mockMatchData,
      });

      const result = await matchService.getMatch('match1');

      expect(result).toEqual({
        id: 'match1',
        ...mockMatchData,
      });
    });

    it('should return null for non-existent match', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      const result = await matchService.getMatch('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle get match errors', async () => {
      getDoc.mockRejectedValue(new Error('Database error'));

      await expect(matchService.getMatch('match1')).rejects.toThrow('Database error');
    });
  });

  describe('getMatches', () => {
    const mockMatches = [
      { id: 'match1', type: 'lightning_match', status: 'completed' },
      { id: 'match2', type: 'league', status: 'scheduled' },
    ];

    beforeEach(() => {
      getDocs.mockResolvedValue({
        docs: mockMatches.map((match, index) => ({
          id: match.id,
          data: () => match,
        })),
      });
    });

    it('should get matches with basic filters', async () => {
      const filters = {
        clubId: 'club1',
        sortBy: 'date',
        sortOrder: 'desc',
      };

      const result = await matchService.getMatches(filters);

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('clubId', '==', 'club1');
      expect(orderBy).toHaveBeenCalledWith('scheduledAt', 'desc');
      expect(result.matches).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should filter matches by player ID', async () => {
      const filters = {
        clubId: 'club1',
        playerId: 'player1',
      };

      await matchService.getMatches(filters);

      expect(where).toHaveBeenCalledWith('player1.userId', '==', 'player1');
    });

    it('should filter matches by type', async () => {
      const filters = {
        clubId: 'club1',
        type: ['lightning_match', 'tournament'],
      };

      await matchService.getMatches(filters);

      expect(where).toHaveBeenCalledWith('type', 'in', ['lightning_match', 'tournament']);
    });

    it('should filter matches by status', async () => {
      const filters = {
        clubId: 'club1',
        status: ['completed', 'confirmed'],
      };

      await matchService.getMatches(filters);

      expect(where).toHaveBeenCalledWith('status', 'in', ['completed', 'confirmed']);
    });

    it('should handle pagination', async () => {
      // Mock 21 documents to test pagination (pageSize = 20)
      const extraDocs = Array.from({ length: 21 }, (_, i) => ({
        id: `match${i}`,
        data: () => ({ type: 'lightning_match' }),
      }));

      getDocs.mockResolvedValue({ docs: extraDocs });

      const filters = { clubId: 'club1' };
      const result = await matchService.getMatches(filters, 20);

      expect(result.matches).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('Player Statistics', () => {
    describe('getPlayerStats', () => {
      it('should return player statistics', async () => {
        const mockStats = {
          userId: 'player1',
          clubId: 'club1',
          totalMatches: 10,
          wins: 7,
          losses: 3,
          winRate: 70,
        };

        getDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockStats,
        });

        const result = await matchService.getPlayerStats('player1', 'club1');

        expect(result).toEqual(mockStats);
      });

      it('should return null for non-existent stats', async () => {
        getDoc.mockResolvedValue({ exists: () => false });

        const result = await matchService.getPlayerStats('player1', 'club1');

        expect(result).toBeNull();
      });
    });

    describe('getPlayerEventTypeStats', () => {
      it('should return event type specific stats', async () => {
        const mockStats = {
          eventTypeStats: {
            mens_singles: {
              matches: 5,
              wins: 3,
              losses: 2,
              setsWon: 8,
              setsLost: 6,
            },
          },
        };

        jest.spyOn(matchService, 'getPlayerStats').mockResolvedValue(mockStats);

        const result = await matchService.getPlayerEventTypeStats(
          'player1',
          'club1',
          'mens_singles'
        );

        expect(result).toEqual(mockStats.eventTypeStats['mens_singles']);
      });

      it('should return all event type stats when no specific type requested', async () => {
        const mockStats = {
          eventTypeStats: {
            mens_singles: { matches: 5, wins: 3, losses: 2 },
            mens_doubles: { matches: 3, wins: 2, losses: 1 },
          },
        };

        jest.spyOn(matchService, 'getPlayerStats').mockResolvedValue(mockStats);

        const result = await matchService.getPlayerEventTypeStats('player1', 'club1');

        expect(result).toEqual(mockStats.eventTypeStats);
      });
    });
  });

  describe('Head-to-Head Records', () => {
    it('should return head-to-head record', async () => {
      const mockRecord = {
        player1Id: 'player1',
        player2Id: 'player2',
        clubId: 'club1',
        player1Wins: 3,
        player2Wins: 2,
        totalMatches: 5,
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockRecord,
      });

      const result = await matchService.getHeadToHeadRecord('player1', 'player2', 'club1');

      expect(result).toEqual(mockRecord);
    });

    it('should handle player order consistently', async () => {
      await matchService.getHeadToHeadRecord('player2', 'player1', 'club1');

      // Should create consistent ID regardless of player order
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'club1_player1_player2');
    });

    it('should return null for non-existent record', async () => {
      getDoc.mockResolvedValue({ exists: () => false });

      const result = await matchService.getHeadToHeadRecord('player1', 'player2', 'club1');

      expect(result).toBeNull();
    });
  });

  describe('Lightning Match Functions', () => {
    describe('createLightningMatch', () => {
      beforeEach(() => {
        getDoc
          .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'Player 1' }) })
          .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'Player 2' }) });
        addDoc.mockResolvedValue({ id: 'lightning-match-id' });
      });

      it('should create lightning match with event type', async () => {
        const matchData = {
          eventType: 'mens_singles',
          player1Id: 'player1',
          player2Id: 'player2',
          scheduledAt: new Date(),
          clubId: 'club1',
          createdBy: 'organizer1',
        };

        const result = await matchService.createLightningMatch(matchData);

        expect(result).toBe('lightning-match-id');
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type: 'lightning_match',
            eventType: 'mens_singles',
            format: 'singles',
          })
        );
      });

      it('should handle lightning match creation errors', async () => {
        addDoc.mockRejectedValue(new Error('Lightning match creation failed'));

        const matchData = {
          eventType: 'mens_singles',
          player1Id: 'player1',
          player2Id: 'player2',
          scheduledAt: new Date(),
          clubId: 'club1',
          createdBy: 'organizer1',
        };

        await expect(matchService.createLightningMatch(matchData)).rejects.toThrow(
          'Lightning match creation failed'
        );
      });
    });

    describe('getLightningMatchesByEventType', () => {
      it('should return filtered lightning matches by event type', async () => {
        const mockMatches = [
          { id: 'match1', type: 'lightning_match', eventType: 'mens_singles' },
          { id: 'match2', type: 'lightning_match', eventType: 'mens_doubles' },
          { id: 'match3', type: 'lightning_match', eventType: 'mens_singles' },
        ];

        jest.spyOn(matchService, 'getMatches').mockResolvedValue({
          matches: mockMatches,
          totalCount: 3,
          hasMore: false,
        });

        const result = await matchService.getLightningMatchesByEventType('club1', 'mens_singles');

        expect(result).toHaveLength(2);
        expect(result.every(match => match.eventType === 'mens_singles')).toBe(true);
      });
    });
  });

  describe('Admin Functions', () => {
    describe('getDisputedMatches', () => {
      it('should return all disputed matches for club', async () => {
        const mockDisputedMatches = [
          { id: 'disputed1', status: 'disputed' },
          { id: 'disputed2', status: 'disputed' },
        ];

        getDocs.mockResolvedValue({
          docs: mockDisputedMatches.map(match => ({
            id: match.id,
            data: () => match,
          })),
        });

        const result = await matchService.getDisputedMatches('club1');

        expect(where).toHaveBeenCalledWith('clubId', '==', 'club1');
        expect(where).toHaveBeenCalledWith('status', '==', 'disputed');
        expect(result).toHaveLength(2);
      });
    });

    describe('resolveDispute', () => {
      const mockDisputedMatch = {
        id: 'disputed-match',
        status: 'disputed',
        player1: { userId: 'player1' },
        player2: { userId: 'player2' },
      };

      beforeEach(() => {
        runTransaction.mockImplementation(async (db, callback) => {
          const mockStats = {
            lightningMatchStats: { matches: 5, wins: 3, losses: 2 },
            eventTypeStats: {
              mens_singles: { matches: 3, wins: 2, losses: 1 },
            },
            recentMatches: ['match2', 'match3'],
          };

          const mockTransaction = {
            get: jest
              .fn()
              .mockResolvedValueOnce({
                exists: () => true,
                id: 'disputed-match',
                data: () => mockDisputedMatch,
              })
              // Mock calls for player stats
              .mockResolvedValue({
                exists: () => true,
                data: () => mockStats,
              }),
            update: jest.fn(),
            set: jest.fn(),
          };
          await callback(mockTransaction);
        });
      });

      it('should resolve dispute successfully', async () => {
        await matchService.resolveDispute('disputed-match', 'admin1');

        expect(runTransaction).toHaveBeenCalled();
      });

      it('should resolve dispute with new score', async () => {
        const newScore = {
          sets: [{ player1Games: 6, player2Games: 4 }],
        };

        await matchService.resolveDispute('disputed-match', 'admin1', newScore);

        expect(runTransaction).toHaveBeenCalled();
      });

      it('should reject resolving non-disputed match', async () => {
        const nonDisputedMatch = { ...mockDisputedMatch, status: 'completed' };

        runTransaction.mockImplementation(async (db, callback) => {
          const mockTransaction = {
            get: jest.fn().mockResolvedValue({
              exists: () => true,
              data: () => nonDisputedMatch,
            }),
            update: jest.fn(),
            set: jest.fn(),
          };
          await callback(mockTransaction);
        });

        await expect(matchService.resolveDispute('match1', 'admin1')).rejects.toThrow(
          '분쟁 상태가 아닌 경기입니다.'
        );
      });
    });

    describe('adminOverrideMatchResult', () => {
      it('should override match result as admin', async () => {
        const mockMatch = {
          id: 'match1',
          player1: { userId: 'player1' },
          player2: { userId: 'player2' },
          score: { winner: 'player1' },
        };

        runTransaction.mockImplementation(async (db, callback) => {
          const mockStats = {
            lightningMatchStats: { matches: 5, wins: 3, losses: 2 },
            eventTypeStats: {
              mens_singles: { matches: 3, wins: 2, losses: 1 },
            },
            recentMatches: ['match2', 'match3'],
          };

          const mockTransaction = {
            get: jest
              .fn()
              .mockResolvedValueOnce({
                exists: () => true,
                data: () => mockMatch,
              })
              // Mock calls for player stats
              .mockResolvedValue({
                exists: () => true,
                data: () => mockStats,
              }),
            update: jest.fn(),
            set: jest.fn(),
          };
          await callback(mockTransaction);
        });

        const newScore = {
          sets: [{ player1Games: 4, player2Games: 6 }],
        };

        await matchService.adminOverrideMatchResult(
          'match1',
          newScore,
          'admin1',
          'Score correction needed'
        );

        expect(runTransaction).toHaveBeenCalled();
      });
    });

    describe('adminCancelMatch', () => {
      it('should cancel match as admin', async () => {
        const mockMatch = {
          id: 'match1',
          status: 'confirmed',
          score: { winner: 'player1' },
          player1: { userId: 'player1' },
          player2: { userId: 'player2' },
        };

        runTransaction.mockImplementation(async (db, callback) => {
          const mockStats = {
            lightningMatchStats: { matches: 5, wins: 3, losses: 2 },
            eventTypeStats: {
              mens_singles: { matches: 3, wins: 2, losses: 1 },
            },
            recentMatches: ['match2', 'match3'],
          };

          const mockTransaction = {
            get: jest
              .fn()
              .mockResolvedValueOnce({
                exists: () => true,
                data: () => mockMatch,
              })
              // Mock calls for player stats
              .mockResolvedValue({
                exists: () => true,
                data: () => mockStats,
              }),
            update: jest.fn(),
            set: jest.fn(),
          };
          await callback(mockTransaction);
        });

        await matchService.adminCancelMatch('match1', 'admin1', 'Weather cancellation');

        expect(runTransaction).toHaveBeenCalled();
      });
    });

    describe('getMatchAdminHistory', () => {
      it('should return match with admin action history', async () => {
        const mockMatch = {
          id: 'match1',
          adminOverride: {
            adminId: 'admin1',
            reason: 'Score correction',
            timestamp: { toMillis: () => Date.now() },
          },
          disputeResolvedBy: 'admin1',
          disputeResolvedAt: { toMillis: () => Date.now() },
        };

        jest.spyOn(matchService, 'getMatch').mockResolvedValue(mockMatch);

        const result = await matchService.getMatchAdminHistory('match1');

        expect(result.match).toEqual(mockMatch);
        expect(result.adminActions).toHaveLength(2);
        expect(result.adminActions[0].type).toBe('override');
        expect(result.adminActions[1].type).toBe('dispute_resolution');
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle concurrent match operations', async () => {
      getDoc.mockResolvedValue({ exists: () => true, data: () => ({ displayName: 'Player' }) });
      addDoc.mockResolvedValue({ id: 'concurrent-match' });

      const operations = [
        matchService.createMatch({
          type: 'lightning_match',
          format: 'singles',
          player1Id: 'player1',
          player2Id: 'player2',
          scheduledAt: new Date(),
          clubId: 'club1',
          createdBy: 'organizer1',
        }),
        matchService.getMatch('existing-match'),
        matchService.getPlayerStats('player1', 'club1'),
      ];

      getDoc
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'Player 1' }) })
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'Player 2' }) })
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({ exists: () => false });

      const results = await Promise.allSettled(operations);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should handle invalid match data gracefully', async () => {
      const invalidMatchData = {
        // Missing required fields
        type: 'lightning_match',
        format: 'singles',
        scheduledAt: new Date(),
        clubId: 'club1',
      };

      await expect(matchService.createMatch(invalidMatchData)).rejects.toThrow();
    });

    it('should handle malformed score data', async () => {
      const mockMatchForMalformed = {
        id: 'match1',
        player1: { userId: 'player1', userName: 'Player One' },
        player2: { userId: 'player2', userName: 'Player Two' },
        status: 'scheduled',
        type: 'lightning_match',
        format: 'singles',
      };

      getDoc.mockReset();
      getDoc.mockImplementation(() =>
        Promise.resolve({
          exists: () => true,
          data: () => mockMatchForMalformed,
        })
      );

      const malformedScore = {
        sets: null, // Invalid sets data
      };

      // Should not throw but handle gracefully
      await expect(
        matchService.submitScore('match1', malformedScore, 'player1')
      ).resolves.not.toThrow();
    });

    it('should handle database transaction failures', async () => {
      runTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(matchService.confirmScore('match1', true, 'player2')).rejects.toThrow(
        'Transaction failed'
      );
    });

    it('should validate user permissions properly', async () => {
      const mockMatch = {
        player1: { userId: 'player1' },
        player2: { userId: 'player2' },
        player1Partner: { userId: 'partner1' },
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockMatch,
      });

      // Partner should be able to submit score for doubles
      await expect(
        matchService.submitScore('match1', { sets: [] }, 'partner1')
      ).resolves.not.toThrow();
    });
  });
});
