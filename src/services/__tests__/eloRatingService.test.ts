import eloRatingService from '../eloRatingService';

// Local interface for test type assertions
interface RatingResult {
  player1: {
    userId: string;
    previousRating: number;
    newRating: number;
    ratingChange: number;
    expectedScore: number;
    actualScore: number;
    kFactor: number;
    tier: TierInfo;
  };
  player2: {
    userId: string;
    previousRating: number;
    newRating: number;
    ratingChange: number;
    expectedScore: number;
    actualScore: number;
    kFactor: number;
    tier: TierInfo;
  };
  matchDetails: {
    result: string;
    importanceMultiplier: number;
    timestamp: string;
  };
}

interface TierInfo {
  name: string;
  color: string;
  icon: string;
}

// ELO Rating Service 핵심 계산 로직 테스트
describe('eloRatingService - Brain Layer Tests', () => {
  // 테스트에 사용할 가짜 플레이어 데이터 (Fixture)
  const playerA = {
    userId: 'player-a',
    profile: { nickname: 'Player A' },
    stats: {
      eloRating: 1200,
      totalMatches: 15,
      wins: 10,
      losses: 5,
    },
  };

  const playerB = {
    userId: 'player-b',
    profile: { nickname: 'Player B' },
    stats: {
      eloRating: 1150,
      totalMatches: 20,
      wins: 8,
      losses: 12,
    },
  };

  beforeEach(() => {
    // 각 테스트 전에 콘솔 로그 스파이를 설정
    jest.clearAllMocks();
  });

  describe('calculateNewRatings', () => {
    it('should correctly update ratings when player A wins', () => {
      // 1. Arrange: 시나리오 설정 (A가 B를 이김)
      const result = 'player1_wins';

      // 2. Act: 실제 서비스 함수 호출
      const ratingResult = eloRatingService.calculateNewRatings(
        playerA,
        playerB,
        result
      ) as any as RatingResult; // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock data requires type assertion

      // 3. Assert: 결과 검증
      // 승자의 ELO 점수는 기존보다 높아야 한다
      expect(ratingResult.player1.newRating).toBeGreaterThan(playerA.stats.eloRating);
      expect(ratingResult.player1.ratingChange).toBeGreaterThan(0);

      // 패자의 ELO 점수는 기존보다 낮아야 한다
      expect(ratingResult.player2.newRating).toBeLessThan(playerB.stats.eloRating);
      expect(ratingResult.player2.ratingChange).toBeLessThan(0);

      // 기본 속성들이 올바르게 설정되어야 한다
      expect(ratingResult.player1.userId).toBe(playerA.userId);
      expect(ratingResult.player2.userId).toBe(playerB.userId);
      expect(ratingResult.matchDetails.result).toBe(result);
    });

    it('should correctly update ratings when player B wins', () => {
      // 1. Arrange: 시나리오 설정 (B가 A를 이김)
      const result = 'player2_wins';

      // 2. Act: 실제 서비스 함수 호출
      const ratingResult = eloRatingService.calculateNewRatings(
        playerA,
        playerB,
        result
      ) as any as RatingResult; // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock data requires type assertion

      // 3. Assert: 결과 검증
      // Player A (패자)의 ELO는 감소해야 한다
      expect(ratingResult.player1.newRating).toBeLessThan(playerA.stats.eloRating);
      expect(ratingResult.player1.ratingChange).toBeLessThan(0);

      // Player B (승자)의 ELO는 증가해야 한다
      expect(ratingResult.player2.newRating).toBeGreaterThan(playerB.stats.eloRating);
      expect(ratingResult.player2.ratingChange).toBeGreaterThan(0);
    });

    it('should handle a draw correctly', () => {
      // 1. Arrange: 무승부 시나리오
      const result = 'draw';

      // 2. Act: 서비스 함수 호출
      const ratingResult = eloRatingService.calculateNewRatings(
        playerA,
        playerB,
        result
      ) as any as RatingResult; // eslint-disable-line @typescript-eslint/no-explicit-any -- Test mock data requires type assertion

      // 3. Assert: 무승부 검증
      expect(ratingResult.player1.actualScore).toBe(0.5);
      expect(ratingResult.player2.actualScore).toBe(0.5);
      expect(ratingResult.matchDetails.result).toBe('draw');

      // 두 플레이어 모두 점수 변화가 있어야 하지만, 승부가 없으므로 변화량이 적을 수 있다
      expect(typeof ratingResult.player1.ratingChange).toBe('number');
      expect(typeof ratingResult.player2.ratingChange).toBe('number');
    });

    it('should respect rating boundaries (800-3000)', () => {
      // 1. Arrange: 극단적인 케이스 - 매우 낮은 레이팅 플레이어
      const lowRatingPlayer = {
        userId: 'low-player',
        profile: { nickname: 'Low Player' },
        stats: { eloRating: 850, totalMatches: 10 },
      };

      const highRatingPlayer = {
        userId: 'high-player',
        profile: { nickname: 'High Player' },
        stats: { eloRating: 2950, totalMatches: 100 },
      };

      // 2. Act: 낮은 점수 플레이어가 지는 경우
      const lowLossResult = eloRatingService.calculateNewRatings(
        lowRatingPlayer,
        highRatingPlayer,
        'player2_wins'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any as RatingResult;

      // 3. Assert: 최소 레이팅 (800) 경계 확인
      expect(lowLossResult.player1.newRating).toBeGreaterThanOrEqual(800);

      // 4. Act: 높은 점수 플레이어가 이기는 경우
      const highWinResult = eloRatingService.calculateNewRatings(
        highRatingPlayer,
        lowRatingPlayer,
        'player1_wins'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any as RatingResult;

      // 5. Assert: 최대 레이팅 (3000) 경계 확인
      expect(highWinResult.player1.newRating).toBeLessThanOrEqual(3000);
    });

    it('should apply different K-factors based on experience', () => {
      // 1. Arrange: 경험 수준이 다른 플레이어들
      const novicePlayer = {
        userId: 'novice',
        profile: { nickname: 'Novice' },
        stats: { eloRating: 1200, totalMatches: 10 }, // < 30 games
      };

      const expertPlayer = {
        userId: 'expert',
        profile: { nickname: 'Expert' },
        stats: { eloRating: 2100, totalMatches: 600 }, // > 2000 rating, > 500 games
      };

      // 2. Act: 초보자와 전문가 매치
      const result = eloRatingService.calculateNewRatings(
        novicePlayer,
        expertPlayer,
        'player1_wins' // 초보자가 전문가를 이기는 upset
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any as RatingResult;

      // 3. Assert: K-factor 검증
      // 초보자는 높은 K-factor를 가져야 함 (큰 변화)
      expect(result.player1.kFactor).toBeGreaterThan(result.player2.kFactor);

      // Upset이므로 초보자는 많은 점수를 얻어야 함
      expect(result.player1.ratingChange).toBeGreaterThan(15);

      // 전문가는 적은 점수를 잃어야 함
      expect(Math.abs(result.player2.ratingChange)).toBeLessThan(15);
    });

    it('should throw error for invalid input data', () => {
      // 1. Arrange: 잘못된 입력 데이터
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidPlayer = null as any;
      const invalidResult = 'invalid_result';

      // 2 & 3. Act & Assert: 에러 발생 확인
      expect(() => {
        eloRatingService.calculateNewRatings(invalidPlayer, playerB, 'player1_wins');
      }).toThrow('Invalid player data provided');

      expect(() => {
        eloRatingService.calculateNewRatings(playerA, playerB, invalidResult as 'player1_wins');
      }).toThrow('Invalid match result');
    });
  });

  describe('calculateExpectedScore', () => {
    it('should calculate correct expected scores', () => {
      // 1. Act: 동일한 레이팅일 때
      const equalRating = eloRatingService.calculateExpectedScore(1200, 1200);

      // 2. Assert: 50% 확률이어야 함
      expect(equalRating).toBeCloseTo(0.5, 3);

      // 3. Act: 400점 차이일 때 (10배 차이)
      const bigDifference = eloRatingService.calculateExpectedScore(1200, 1600);

      // 4. Assert: 낮은 확률이어야 함 (약 9%)
      expect(bigDifference).toBeLessThan(0.1);
      expect(bigDifference).toBeGreaterThan(0.05);
    });
  });

  describe('calculateKFactor', () => {
    it('should return correct K-factors for different experience levels', () => {
      // Novice (< 30 games)
      expect(eloRatingService.calculateKFactor(1200, 15)).toBe(32);

      // Average (30-99 games)
      expect(eloRatingService.calculateKFactor(1200, 50)).toBe(24);

      // Experienced (100-499 games)
      expect(eloRatingService.calculateKFactor(1200, 200)).toBe(16);

      // Expert (>= 500 games OR >= 2000 rating)
      expect(eloRatingService.calculateKFactor(2100, 100)).toBe(8); // High rating
      expect(eloRatingService.calculateKFactor(1200, 600)).toBe(8); // Many games
    });
  });

  describe('getRatingTier', () => {
    it('should return correct tier for different ratings', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(900) as any as TierInfo).name).toBe('Bronze');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(1250) as any as TierInfo).name).toBe('Silver');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(1450) as any as TierInfo).name).toBe('Gold');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(1650) as any as TierInfo).name).toBe('Platinum');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(1850) as any as TierInfo).name).toBe('Diamond');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(2100) as any as TierInfo).name).toBe('Master');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((eloRatingService.getRatingTier(2300) as any as TierInfo).name).toBe('Grandmaster');
    });

    it('should include correct tier metadata', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const goldTier = eloRatingService.getRatingTier(1450) as any as TierInfo;

      expect(goldTier.name).toBe('Gold');
      expect(goldTier.color).toBe('#FF9800');
      expect(goldTier.icon).toBe('🏆');
    });
  });
});
