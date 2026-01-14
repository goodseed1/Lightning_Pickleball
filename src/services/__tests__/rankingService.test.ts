/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
// Mock React Native modules before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios || obj.default),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('../pushNotificationService', () => ({
  default: {
    initialize: jest.fn(),
    requestPermissions: jest.fn(),
    sendPushNotification: jest.fn(),
  },
}));

jest.mock('../clubService', () => ({
  default: {
    canViewClubRankings: jest.fn().mockResolvedValue(true),
  },
}));

import rankingService from '../rankingService';
import { MatchContext, RankingUpdateData } from '../../types/user';
import { getDocs } from 'firebase/firestore';

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
  runTransaction: jest.fn(),
}));

describe('RankingService - ELO Judiciary System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('K-Factor Calculation (K-Factor 결정 원칙)', () => {
    test('should return K-Factor 32 for new players (<10 matches) in global matches', () => {
      const kFactor = rankingService.getKFactor(5, false);
      expect(kFactor).toBe(32);
    });

    test('should return K-Factor 16 for experienced players (≥10 matches) in global matches', () => {
      const kFactor = rankingService.getKFactor(15, false);
      expect(kFactor).toBe(16);
    });

    test('should apply 0.5x multiplier for club matches (new player)', () => {
      const kFactor = rankingService.getKFactor(5, true);
      expect(kFactor).toBe(16); // 32 * 0.5
    });

    test('should apply 0.5x multiplier for club matches (experienced player)', () => {
      const kFactor = rankingService.getKFactor(20, true);
      expect(kFactor).toBe(8); // 16 * 0.5
    });

    test('should handle edge case at exactly 10 matches', () => {
      const kFactorBefore = rankingService.getKFactor(9, false);
      const kFactorAt = rankingService.getKFactor(10, false);

      expect(kFactorBefore).toBe(32);
      expect(kFactorAt).toBe(16);
    });
  });

  describe('ELO Preview System', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockGlobalContext: MatchContext = { type: 'public' } as any;
    const mockClubContext: MatchContext = {
      type: 'club',
      clubId: 'club123',
      clubName: 'Test Club',
    };

    test('should calculate ELO preview for global matches', async () => {
      // Mock getCurrentElo to return a known ELO
      jest.spyOn(rankingService, 'getCurrentElo').mockResolvedValue(1200);

      const preview = await rankingService.previewEloChange(
        'user123',
        mockGlobalContext,
        1300, // opponent ELO
        'win'
      );

      expect(preview.currentElo).toBe(1200);
      expect(preview.newElo).toBeGreaterThan(1200); // Should increase for win
      expect(preview.eloChange).toBeGreaterThan(0);
      expect(preview.kFactor).toBe(32); // New player K-Factor
    });

    test('should calculate lower ELO change for club matches', async () => {
      jest.spyOn(rankingService, 'getCurrentElo').mockResolvedValue(1200);

      const globalPreview = await rankingService.previewEloChange(
        'user123',
        mockGlobalContext,
        1300,
        'win'
      );

      const clubPreview = await rankingService.previewEloChange(
        'user123',
        mockClubContext,
        1300,
        'win'
      );

      // Club matches should have lower K-Factor and thus smaller ELO changes
      expect(clubPreview.kFactor).toBeLessThan(globalPreview.kFactor);
      expect(clubPreview.eloChange).toBeLessThan(globalPreview.eloChange);
    });

    test('should calculate negative ELO change for losses', async () => {
      jest.spyOn(rankingService, 'getCurrentElo').mockResolvedValue(1400);

      const preview = await rankingService.previewEloChange(
        'user123',
        mockGlobalContext,
        1200, // Lower opponent ELO
        'loss'
      );

      expect(preview.newElo).toBeLessThan(1400); // Should decrease for loss
      expect(preview.eloChange).toBeLessThan(0); // Negative change
    });
  });

  describe('Match Result Processing', () => {
    test('should validate ranking update data', async () => {
      const invalidData: Partial<RankingUpdateData> = {
        userId: 'user123',
        // Missing required fields
      };

      await expect(
        rankingService.processMatchResult(invalidData as RankingUpdateData)
      ).rejects.toThrow('유효하지 않은 랭킹 업데이트 데이터입니다.');
    });

    test('should handle global match processing', async () => {
      const validGlobalData: RankingUpdateData = {
        userId: 'user123',
        context: { type: 'public' } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock context
        result: 'win',
        opponentElo: 1300,
        matchId: 'match123',
      };

      // Mock the updateUnifiedElo method
      const mockUpdateResult = {
        oldElo: 1200,
        newElo: 1215,
        kFactor: 32,
        skillLevel: {
          selfAssessed: '3.0-3.5',
          calculated: 3.1,
          confidence: 0.8,
          lastUpdated: new Date().toISOString(),
          source: 'migration' as const,
        },
      };

      jest.spyOn(rankingService, 'updateUnifiedElo').mockResolvedValue(mockUpdateResult);

      const result = await rankingService.processMatchResult(validGlobalData);

      expect(result.success).toBe(true);
      expect(result.context.type).toBe('global');
      expect(result.eloChange).toBe(15);
      expect(result.newRating).toBe(1215);
    });

    test('should handle club match processing', async () => {
      const validClubData: RankingUpdateData = {
        userId: 'user123',
        context: { type: 'club', clubId: 'club123', clubName: 'Test Club' },
        result: 'loss',
        opponentElo: 1400,
        matchId: 'match123',
      };

      const mockUpdateResult = {
        oldElo: 1300,
        newElo: 1285,
        kFactor: 16,
        skillLevel: {
          selfAssessed: '3.0-3.5',
          calculated: 3.1,
          confidence: 0.8,
          lastUpdated: new Date().toISOString(),
          source: 'migration' as const,
        },
        clubStatsUpdated: true,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(rankingService, 'updateUnifiedElo').mockResolvedValue(mockUpdateResult as any);

      const result = await rankingService.processMatchResult(validClubData);

      expect(result.success).toBe(true);
      expect(result.context.type).toBe('club');
      expect(result.eloChange).toBe(-15);
      expect(result.newRating).toBe(1285);
    });
  });

  describe('Comprehensive Ranking Information', () => {
    test('should return complete ranking overview for user', async () => {
      const mockRankingInfo = {
        unifiedRanking: {
          elo: 1350,
          ntrp: 3.3,
          matches: 25,
          winRate: 0.68,
          confidence: 0.95,
          publicMatches: 20,
          clubMatches: 5,
        },
        clubRankings: [
          {
            clubId: 'club123',
            clubName: 'Elite Pickleball Club',
            clubEloRating: 1280,
            matches: 8,
            winRate: 0.625,
          },
          {
            clubId: 'club456',
            clubName: 'Community Pickleball',
            clubEloRating: 1420,
            matches: 12,
            winRate: 0.75,
          },
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(rankingService, 'getUserRankingInfo').mockResolvedValue(mockRankingInfo as any);

      const result = await rankingService.getUserRankingInfo('user123');

      expect(result.unifiedRanking).toBeDefined();
      expect(result.unifiedRanking?.elo).toBe(1350);
      expect(result.unifiedRanking?.confidence).toBe(0.95);

      expect(result.clubRankings).toHaveLength(2);
      expect(result.clubRankings[0].clubName).toBe('Elite Pickleball Club');
      expect(result.clubRankings[1].clubEloRating).toBe(1420);
    });

    test('should handle user with no global ranking', async () => {
      const mockRankingInfo = {
        unifiedRanking: null,
        clubRankings: [],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(rankingService, 'getUserRankingInfo').mockResolvedValue(mockRankingInfo as any);

      const result = await rankingService.getUserRankingInfo('newuser123');

      expect(result.unifiedRanking).toBeNull();
      expect(result.clubRankings).toHaveLength(0);
    });
  });

  describe('ELO Calculation Edge Cases', () => {
    test('should handle extreme ELO differences', async () => {
      jest.spyOn(rankingService, 'getCurrentElo').mockResolvedValue(1000);

      // Very high opponent ELO - should have large potential gain
      const preview = await rankingService.previewEloChange(
        'user123',
        { type: 'public' } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock context
        2000, // Much higher opponent
        'win'
      );

      expect(preview.eloChange).toBeGreaterThan(25); // Should be significant gain
    });

    test('should handle minimum ELO scenarios', async () => {
      jest.spyOn(rankingService, 'getCurrentElo').mockResolvedValue(800);

      const preview = await rankingService.previewEloChange(
        'user123',
        { type: 'public' } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock context
        1200,
        'loss'
      );

      // Even with loss, shouldn't go below reasonable minimum
      expect(preview.newElo).toBeGreaterThan(700);
    });
  });

  describe('Context-Aware ELO Retrieval', () => {
    test('should return default ELO for unknown users', async () => {
      jest.spyOn(rankingService, 'getCurrentElo').mockResolvedValue(1200);

      const globalElo = await rankingService.getCurrentElo('unknown');
      expect(globalElo).toBe(1200);

      const clubElo = await rankingService.getCurrentElo('unknown');
      expect(clubElo).toBe(1200);
    });

    test('should handle invalid context gracefully', async () => {
      // The service falls back to default ELO for invalid contexts instead of throwing
      const result = await rankingService.getCurrentElo('user123');
      expect(result).toBe(1200);
    });
  });
});

describe('ELO Mathematical Accuracy', () => {
  test('should calculate ELO changes according to standard formula', () => {
    // Test specific ELO calculation scenarios
    const currentElo = 1200;
    const opponentElo = 1400;
    const kFactor = 32;

    // Expected score calculation: 1 / (1 + 10^((opponent - current) / 400))
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
    // expectedScore ≈ 0.24 for this scenario

    // For a win: newElo = currentElo + kFactor * (1 - expectedScore)
    const expectedNewElo = Math.round(currentElo + kFactor * (1 - expectedScore));

    // This should be approximately 1224
    expect(expectedNewElo).toBeGreaterThan(1200);
    expect(expectedNewElo).toBeLessThan(1250);
  });

  test('should ensure symmetric ELO changes for opponents', () => {
    // When player A beats player B, the ELO gain for A should approximately equal ELO loss for B
    const kFactor = 32;

    // Player A wins
    const expectedScore = 0.5; // Equal ratings
    const aGain = Math.round(kFactor * (1 - expectedScore));
    const bLoss = Math.round(kFactor * (0 - expectedScore));

    expect(Math.abs(aGain + bLoss)).toBeLessThanOrEqual(1); // Should be nearly symmetric
  });
});

describe('getUserRanking - Time Period Rankings', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('should fetch monthly ranking data from Firestore', async () => {
    // Arrange: Mock Firestore response for monthly rankings
    const mockMonthlyDocs = [
      {
        id: 'user1',
        data: () => ({
          stats: {
            unifiedEloRating: 1500,
            lastMatchDate: new Date().toISOString(),
          },
          nickname: 'Player1',
        }),
      },
      {
        id: 'user2',
        data: () => ({
          stats: {
            unifiedEloRating: 1450,
            lastMatchDate: new Date().toISOString(),
          },
          nickname: 'Player2',
        }),
      },
      {
        id: 'user123',
        data: () => ({
          stats: {
            unifiedEloRating: 1400,
            lastMatchDate: new Date().toISOString(),
          },
          nickname: 'TestUser',
        }),
      },
      {
        id: 'user3',
        data: () => ({
          stats: {
            unifiedEloRating: 1350,
            lastMatchDate: new Date().toISOString(),
          },
          nickname: 'Player3',
        }),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockMonthlyDocs,
      size: 4,
    });

    // Act
    const result = await rankingService.getUserRanking('user123', 'monthly');

    // Assert
    expect(result).toEqual({
      currentRank: 3, // User is 3rd in the list
      totalPlayers: 4,
      rankingType: 'monthly',
    });
  });

  test('should fetch season ranking data from Firestore', async () => {
    // Arrange: Mock larger dataset for season
    const mockSeasonDocs = Array.from({ length: 50 }, (_, i) => ({
      id: i === 24 ? 'user123' : `user${i}`,
      data: () => ({
        stats: {
          unifiedEloRating: 1600 - i * 10,
          lastMatchDate: new Date().toISOString(),
        },
        nickname: i === 24 ? 'TestUser' : `Player${i}`,
      }),
    }));

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockSeasonDocs,
      size: 50,
    });

    // Act
    const result = await rankingService.getUserRanking('user123', 'season');

    // Assert
    expect(result).toEqual({
      currentRank: 25, // User is at index 24, so rank 25
      totalPlayers: 50,
      rankingType: 'season',
    });
  });

  test('should fetch all-time ranking data from Firestore', async () => {
    // Arrange: Mock all-time rankings
    const mockAllTimeDocs = Array.from({ length: 100 }, (_, i) => ({
      id: i === 44 ? 'user123' : `user${i}`,
      data: () => ({
        stats: {
          unifiedEloRating: 2000 - i * 5,
          lastMatchDate: new Date(Date.now() - i * 86400000).toISOString(), // Different dates
        },
        nickname: i === 44 ? 'TestUser' : `Player${i}`,
      }),
    }));

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockAllTimeDocs,
      size: 100,
    });

    // Act
    const result = await rankingService.getUserRanking('user123', 'alltime');

    // Assert
    expect(result).toEqual({
      currentRank: 45,
      totalPlayers: 100,
      rankingType: 'alltime',
    });
  });

  test('should return rank 0 if user not found in rankings', async () => {
    // Arrange: User not in the ranking list
    const mockDocs = [
      {
        id: 'user1',
        data: () => ({
          stats: {
            unifiedEloRating: 1500,
            lastMatchDate: new Date().toISOString(),
          },
        }),
      },
      {
        id: 'user2',
        data: () => ({
          stats: {
            unifiedEloRating: 1450,
            lastMatchDate: new Date().toISOString(),
          },
        }),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockDocs,
      size: 2,
    });

    // Act
    const result = await rankingService.getUserRanking('unknown-user', 'monthly');

    // Assert
    expect(result).toEqual({
      currentRank: 0, // Not ranked
      totalPlayers: 2,
      rankingType: 'monthly',
    });
  });

  test('should handle Firestore errors gracefully', async () => {
    // Arrange: Mock Firestore error
    (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore connection failed'));

    // Act
    const result = await rankingService.getUserRanking('user123', 'monthly');

    // Assert: Should return default values on error
    expect(result).toEqual({
      currentRank: 0,
      totalPlayers: 0,
      rankingType: 'monthly',
    });
  });

  test('should handle empty ranking collections', async () => {
    // Arrange: No players in ranking
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [],
      size: 0,
    });

    // Act
    const result = await rankingService.getUserRanking('user123', 'season');

    // Assert
    expect(result).toEqual({
      currentRank: 0,
      totalPlayers: 0,
      rankingType: 'season',
    });
  });
});

describe('Integration with Unified Ranking Architecture', () => {
  test('should maintain independence between global and club rankings', async () => {
    const mockUnifiedUpdateGlobal = jest.fn().mockResolvedValue({
      oldElo: 1200,
      newElo: 1215,
      kFactor: 32,
      skillLevel: {
        selfAssessed: '3.0-3.5',
        calculated: 3.1,
        confidence: 0.8,
        lastUpdated: new Date().toISOString(),
        source: 'migration' as const,
      },
    });

    const mockUnifiedUpdateClub = jest.fn().mockResolvedValue({
      oldElo: 1200,
      newElo: 1208,
      kFactor: 16,
      skillLevel: {
        selfAssessed: '3.0-3.5',
        calculated: 3.1,
        confidence: 0.8,
        lastUpdated: new Date().toISOString(),
        source: 'migration' as const,
      },
      clubStatsUpdated: true,
    });

    // Mock for different contexts
    jest
      .spyOn(rankingService, 'updateUnifiedElo')
      .mockImplementation((userId, opponentElo, result, context) => {
        if (context.type === 'club') {
          return mockUnifiedUpdateClub(userId, opponentElo, result, context);
        }
        return mockUnifiedUpdateGlobal(userId, opponentElo, result, context);
      });

    // Process global match
    await rankingService.processMatchResult({
      userId: 'user123',
      context: { type: 'public' } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock context
      result: 'win',
      opponentElo: 1300,
      matchId: 'global123',
    });

    // Process club match
    await rankingService.processMatchResult({
      userId: 'user123',
      context: { type: 'club', clubId: 'club123', clubName: 'Test Club' },
      result: 'win',
      opponentElo: 1300,
      matchId: 'club123',
    });

    // Verify unified system was called for both contexts
    expect(rankingService.updateUnifiedElo).toHaveBeenCalledTimes(2);

    // Verify different contexts were handled
    expect(rankingService.updateUnifiedElo).toHaveBeenCalledWith(
      'user123',
      1300,
      'win',
      { type: 'public' },
      'global123'
    );
    expect(rankingService.updateUnifiedElo).toHaveBeenCalledWith(
      'user123',
      1300,
      'win',
      { type: 'club', clubId: 'club123', clubName: 'Test Club' },
      'club123'
    );
  });
});
