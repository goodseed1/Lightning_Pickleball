/**
 * Pickleball Match System - TypeScript Type Definitions
 * 피클볼 경기 점수 기록 및 관리 시스템 타입 정의
 */

import { Timestamp } from 'firebase/firestore';

// ============ PICKLEBALL SPECIFIC TYPES ============
// 🏓 피클볼 점수 시스템 (11점 또는 15점, 2점 차이로 승리)

export type PickleballGameTarget = 11 | 15;
export type PickleballMatchFormat = 'single_game' | 'best_of_3';

/**
 * Pickleball Game Score (Rally Scoring)
 * 피클볼 게임 점수 (랠리 스코어링)
 */
export interface PickleballGameScore {
  player1Points: number;  // 0-25+ (랠리 포인트)
  player2Points: number;
  winner: 'player1' | 'player2' | null;
}

/**
 * Pickleball Match Score
 * 피클볼 매치 점수 (단일 게임 또는 Best of 3)
 */
export interface PickleballMatchScore {
  format: PickleballMatchFormat;           // 단일 게임 vs Best of 3
  targetScore: PickleballGameTarget;       // 11 (기본, 표준) or 15
  games: PickleballGameScore[];            // 최대 3게임
  matchWinner: 'player1' | 'player2' | null;
  isComplete: boolean;
}

/**
 * Validate Pickleball Game Score (Rally Scoring)
 * 피클볼 게임 점수 검증 - 2점 차이로 targetScore 도달 시 승리
 */
export const validatePickleballGameScore = (
  p1: number,
  p2: number,
  target: PickleballGameTarget
): boolean => {
  const max = Math.max(p1, p2);
  const diff = Math.abs(p1 - p2);
  return max >= target && diff >= 2;
};

/**
 * Determine Pickleball Game Winner
 * 피클볼 게임 승자 결정
 */
export const determinePickleballGameWinner = (
  p1: number,
  p2: number,
  target: PickleballGameTarget
): 'player1' | 'player2' | null => {
  const diff = Math.abs(p1 - p2);
  if (diff < 2) return null;
  if (p1 >= target && p1 > p2) return 'player1';
  if (p2 >= target && p2 > p1) return 'player2';
  return null;
};

/**
 * Determine Best of 3 Match Winner
 * Best of 3 매치 승자 결정 (2게임 먼저 승리)
 */
export const determineBestOf3Winner = (
  games: PickleballGameScore[]
): 'player1' | 'player2' | null => {
  const p1Wins = games.filter(g => g.winner === 'player1').length;
  const p2Wins = games.filter(g => g.winner === 'player2').length;
  if (p1Wins >= 2) return 'player1';
  if (p2Wins >= 2) return 'player2';
  return null; // 아직 진행 중
};

/**
 * Create Empty Pickleball Match Score
 * 빈 피클볼 매치 점수 생성
 */
export const createEmptyPickleballScore = (
  format: PickleballMatchFormat = 'single_game',
  targetScore: PickleballGameTarget = 11
): PickleballMatchScore => ({
  format,
  targetScore,
  games: [{ player1Points: 0, player2Points: 0, winner: null }],
  matchWinner: null,
  isComplete: false,
});

// ============ ENUMS & CONSTANTS ============

export type MatchType = 'league' | 'tournament' | 'lightning_match' | 'practice';
export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'partner_pending' // Doubles match waiting for partner acceptance
  | 'pending_confirmation'
  | 'confirmed'
  | 'completed'
  | 'disputed'
  | 'cancelled';
export type MatchFormat = 'singles' | 'doubles';
export type ScoreStatus = 'pending' | 'submitted' | 'confirmed' | 'disputed' | 'final';

// ============ CORE INTERFACES ============

/**
 * Pickleball Set Score Structure
 * 피클볼 세트 점수 구조
 */
export interface SetScore {
  player1Games: number; // 게임 수 (0-7)
  player2Games: number; // 게임 수 (0-7)
  player1TiebreakPoints?: number; // 타이브레이크 점수 (선택적)
  player2TiebreakPoints?: number; // 타이브레이크 점수 (선택적)
}

/**
 * Complete Match Score
 * 완전한 경기 점수
 */
export interface MatchScore {
  sets: SetScore[]; // 세트별 점수 배열
  _winner: 'player1' | 'player2' | null; // 승자
  isComplete: boolean; // 경기 완료 여부
  retiredAt?: number; // 기권한 세트 (선택적)
  walkover?: boolean; // 부전승 여부
}

/**
 * Match Participant
 * 경기 참가자 정보
 */
export interface MatchParticipant {
  userId: string;
  userName: string;
  skillLevel: string;
  photoURL?: string;
}

/**
 * Match Core Data
 * 경기 핵심 데이터
 */
export interface Match {
  id: string;
  type: MatchType;
  format: MatchFormat;

  // ⭐ 경기 종류 (번개 매치, 리그, 토너먼트용)
  eventType?: import('./league').PickleballEventType;

  // 참가자 정보
  player1: MatchParticipant;
  player2: MatchParticipant;

  // 복식인 경우 추가 참가자
  player1Partner?: MatchParticipant;
  player2Partner?: MatchParticipant;

  // 경기 정보
  scheduledAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;

  // 점수 정보
  score?: MatchScore;
  status: MatchStatus;

  // 연관 정보
  clubId: string;
  leagueId?: string; // 리그 경기인 경우
  tournamentId?: string; // 토너먼트 경기인 경우
  eventId?: string; // 이벤트 경기인 경우

  // 점수 제출 및 확인 정보
  scoreSubmittedBy?: string; // 점수를 제출한 사용자
  scoreSubmittedAt?: Timestamp;
  scoreConfirmedBy?: string; // 점수를 확인한 사용자
  scoreConfirmedAt?: Timestamp;

  // 분쟁 및 중재
  disputeReason?: string; // 분쟁 사유
  disputeResolvedBy?: string; // 분쟁 해결한 관리자
  disputeResolvedAt?: Timestamp;

  // 메타데이터
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Score Submission Data
 * 점수 제출 데이터
 */
export interface ScoreSubmission {
  matchId: string;
  submittedBy: string;
  score: MatchScore;
  notes?: string; // 특이사항 (기권, 부상 등)
  submittedAt: Timestamp;
}

/**
 * Score Confirmation Data
 * 점수 확인 데이터
 */
export interface ScoreConfirmation {
  matchId: string;
  confirmedBy: string;
  agreed: boolean;
  reason?: string; // 거부 사유 (동의하지 않는 경우)
  confirmedAt: Timestamp;
}

/**
 * Player Statistics
 * 선수 통계
 */
export interface PlayerMatchStats {
  userId: string;
  clubId: string;

  // 전체 통계
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;

  // 타입별 통계
  leagueStats: {
    matches: number;
    wins: number;
    losses: number;
  };
  tournamentStats: {
    matches: number;
    wins: number;
    losses: number;
  };
  lightningMatchStats: {
    matches: number;
    wins: number;
    losses: number;
  };

  // ⭐ 경기 종류별 통계 (번개 매치용)
  eventTypeStats?: {
    [K in import('./league').PickleballEventType]?: {
      matches: number;
      wins: number;
      losses: number;
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
    };
  };

  // 최근 기록
  currentStreak: number; // 현재 연승/연패 (-는 연패)
  longestWinStreak: number; // 최장 연승
  recentMatches: string[]; // 최근 경기 ID 배열 (최대 10개)

  // Official Tiebreaker: Set/Game statistics (for backward compatibility)
  setsWon?: number;
  setsLost?: number;
  gamesWon?: number;
  gamesLost?: number;

  // 메타데이터
  lastUpdated: Timestamp;
}

/**
 * Head-to-Head Record
 * 상대전 기록
 */
export interface HeadToHeadRecord {
  player1Id: string;
  player2Id: string;
  clubId: string;

  player1Wins: number;
  player2Wins: number;
  totalMatches: number;

  recentMatches: string[]; // 최근 경기 ID 배열
  lastPlayed?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ UI FORM INTERFACES ============

/**
 * Score Input Form Data
 * 점수 입력 폼 데이터
 */
export interface ScoreInputForm {
  matchId: string; // Match ID
  sets: SetScore[];
  _winner: 'player1' | 'player2' | null;
  finalScore?: string; // ⚡ [THOR] "RET" for retired, "W.O." for walkover
  retired?: boolean;
  retiredAt?: number; // 몇 번째 세트에서 기권했는지
  walkover?: boolean;
  notes?: string;
  // 🏓 피클볼 전용 필드
  matchFormat?: 'single_game' | 'best_of_3'; // 매치 포맷
  targetScore?: 11 | 15; // 목표 점수
}

/**
 * Match Creation Form Data
 * 경기 생성 폼 데이터
 */
export interface CreateMatchForm {
  type: MatchType;
  format: MatchFormat;
  player1Id: string;
  player2Id: string;
  player1PartnerId?: string; // 복식인 경우
  player2PartnerId?: string; // 복식인 경우
  scheduledAt: Date;
  clubId: string;
  leagueId?: string;
  tournamentId?: string;
  eventId?: string;
}

// ============ API RESPONSE INTERFACES ============

/**
 * Match List Response
 * 경기 목록 응답
 */
export interface MatchListResponse {
  matches: Match[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * Player Stats Response
 * 선수 통계 응답
 */
export interface PlayerStatsResponse {
  stats: PlayerMatchStats;
  recentMatches: Match[];
  headToHeadRecords: HeadToHeadRecord[];
}

// ============ UTILITY INTERFACES ============

/**
 * Match Filter Options
 * 경기 필터 옵션
 */
export interface MatchFilterOptions {
  clubId: string;
  playerId?: string;
  type?: MatchType[];
  status?: MatchStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  leagueId?: string;
  tournamentId?: string;
  sortBy: 'date' | 'type' | 'status';
  sortOrder: 'asc' | 'desc';
}

/**
 * Score Validation Result
 * 점수 검증 결과
 */
export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============ CONSTANTS ============

/**
 * Get match type label using translation function
 * @param matchType - Match type key
 * @param t - Translation function from i18n
 * @returns Translated match type label
 *
 * Usage:
 * const label = getMatchTypeLabel('league', t);
 */
export const getMatchTypeLabel = (matchType: MatchType, t: (key: string) => string): string => {
  return t(`types.match.matchTypes.${matchType}`);
};

/**
 * Get match status label using translation function
 * @param status - Match status key
 * @param t - Translation function from i18n
 * @returns Translated match status label
 *
 * Usage:
 * const label = getMatchStatusLabel('scheduled', t);
 */
export const getMatchStatusLabel = (status: MatchStatus, t: (key: string) => string): string => {
  return t(`types.match.matchStatus.${status}`);
};

/**
 * Get match format label using translation function
 * @param format - Match format key
 * @param t - Translation function from i18n
 * @returns Translated match format label
 *
 * Usage:
 * const label = getMatchFormatLabel('singles', t);
 */
export const getMatchFormatLabel = (format: MatchFormat, t: (key: string) => string): string => {
  return t(`types.match.matchFormats.${format}`);
};

/**
 * @deprecated Use getMatchTypeLabel(matchType, t) instead
 * This constant object will be removed in a future version
 */
export const MATCH_TYPES: Record<MatchType, string> = {
  league: '리그 경기',
  tournament: '토너먼트',
  lightning_match: '번개 매치',
  practice: '연습 경기',
};

/**
 * @deprecated Use getMatchStatusLabel(status, t) instead
 * This constant object will be removed in a future version
 */
export const MATCH_STATUS: Record<MatchStatus, string> = {
  scheduled: '예정됨',
  in_progress: '진행중',
  partner_pending: '파트너 수락 대기',
  pending_confirmation: '확인 대기',
  confirmed: '확인됨',
  completed: '완료됨',
  disputed: '분쟁중',
  cancelled: '취소됨',
};

/**
 * @deprecated Use getMatchFormatLabel(format, t) instead
 * This constant object will be removed in a future version
 */
export const MATCH_FORMATS: Record<MatchFormat, string> = {
  singles: '단식',
  doubles: '복식',
};

// ============ HELPER FUNCTIONS ============

/**
 * Fallback function for validation messages when t() is not provided
 * Returns Korean messages for backward compatibility
 */
const getFallbackMessage = (key: string, params?: Record<string, string | number>): string => {
  const messages: Record<string, string> = {
    'types.match.validation.minOneSet': '최소 1세트는 입력해야 합니다.',
    'types.match.validation.gamesNonNegative': `${params?.setNum}세트: 게임 수는 0 이상이어야 합니다.`,
    'types.match.validation.gamesExceedMax': `${params?.setNum}세트: 게임 수는 ${params?.maxGames}을 초과할 수 없습니다.`,
    'types.match.validation.gamesExceedMaxShort': `${params?.setNum}세트: 단축 세트 경기에서는 게임 점수가 ${params?.maxGames}점을 넘을 수 없습니다. (최대 ${params?.gamesPerSet}-${params?.minWin} 또는 ${params?.maxAllowed}-${params?.gamesPerSet1})`,
    'types.match.validation.tiebreakRequired': `${params?.setNum}세트: ${params?.setType}에서 ${params?.score}-${params?.score}일 때는 타이브레이크 점수가 필요합니다.`,
    'types.match.validation.tiebreakMargin': `${params?.setNum}세트: ${params?.tiebreakType}는 2점 차이로 끝나야 합니다. (예: 7-5, 8-6, 10-8)`,
    'types.match.validation.tiebreakMinPoints': `${params?.setNum}세트: ${params?.tiebreakType}는 최소 ${params?.minPoints}점까지 가야 합니다. (예: ${params?.minPoints}-${params?.minPoints2}, ${params?.minPoints1}-${params?.minPoints3})`,
    'types.match.validation.incompleteSet': `${params?.setNum}세트: ${params?.setType} 경기에서 ${params?.gamesPerSet}게임 미만으로 세트가 끝났습니다. 기권이나 특수상황인지 확인하세요.`,
    'types.match.validation.invalidWinScore': `${params?.setNum}세트: ${params?.gamesPerSet}게임으로 이기려면 상대방은 최대 ${params?.maxOppGames}게임까지만 가능합니다.`,
    'types.match.validation.invalidWinScoreShort': `${params?.setNum}세트: 단축 세트에서 ${params?.gamesPerSet}-${params?.minGames}는 불가능합니다. ${params?.gamesPerSet}게임으로 이기려면 상대는 최대 ${params?.maxOppGames}게임까지만 가능합니다.`,
    'types.match.validation.invalidMaxGamesScore': `${params?.setNum}세트: ${params?.maxGames}게임으로 이기려면 상대방은 ${params?.gamesPerSet1}게임 또는 ${params?.gamesPerSet}게임이어야 합니다.`,
    'types.match.validation.invalidMaxGamesScoreShort': `${params?.setNum}세트: 단축 세트에서 ${params?.maxGames}-${params?.minGames}는 불가능합니다. ${params?.gamesPerSet}-${params?.minGames}에서 이미 세트가 끝납니다.`,
    'types.match.validation.regularSet': '일반 세트',
    'types.match.validation.shortSet': '단축 세트',
    'types.match.validation.tiebreak': '타이브레이크',
    'types.match.validation.superTiebreak': '슈퍼 타이브레이크',
  };

  return messages[key] || key;
};

/**
 * Calculate match _winner from score
 * 점수로부터 경기 승자 계산
 */
export const calculateMatchWinner = (sets: SetScore[]): 'player1' | 'player2' | null => {
  let player1Sets = 0;
  let player2Sets = 0;

  sets.forEach((set, index) => {
    const { player1Games, player2Games, player1TiebreakPoints, player2TiebreakPoints } = set;

    // Handle tiebreak sets (6-6)
    if (player1Games === 6 && player2Games === 6) {
      if (player1TiebreakPoints !== undefined && player2TiebreakPoints !== undefined) {
        const pointsToWin = index === 2 ? 10 : 7; // Super tiebreak for 3rd set

        if (
          player1TiebreakPoints >= pointsToWin &&
          player1TiebreakPoints - player2TiebreakPoints >= 2
        ) {
          player1Sets++;
        } else if (
          player2TiebreakPoints >= pointsToWin &&
          player2TiebreakPoints - player1TiebreakPoints >= 2
        ) {
          player2Sets++;
        }
      }
    }
    // Handle regular sets
    else if (player1Games > player2Games) {
      player1Sets++;
    } else if (player2Games > player1Games) {
      player2Sets++;
    }
  });

  // Best of 3 (2 sets to win)
  if (player1Sets >= 2) return 'player1';
  if (player2Sets >= 2) return 'player2';

  return null; // Match not complete
};

/**
 * Validate pickleball score
 * 피클볼 점수 유효성 검사
 * @param sets - 세트 점수 배열
 * @param gamesPerSet - 세트당 게임 수 (일반 6게임, 단축 4게임)
 * @param t - Translation function (optional, defaults to Korean hardcoded messages for backward compatibility)
 */
export const validatePickleballScore = (
  sets: SetScore[],
  gamesPerSet: number = 6, // ⚡ [THOR] 단축 세트 지원: 일반 6게임 / 단축 4게임
  t?: (key: string, params?: Record<string, string | number>) => string
): ScoreValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper to get translated message or fallback to Korean hardcoded
  const getMessage = (key: string, params?: Record<string, string | number>) =>
    t ? t(key, params) : getFallbackMessage(key, params);

  if (sets.length === 0) {
    errors.push(getMessage('types.match.validation.minOneSet'));
    return { isValid: false, errors, warnings };
  }

  // ⚡ [THOR] 단축 세트 로직: gamesPerSet 기반 동적 계산
  const maxGamesAllowed = gamesPerSet + 1; // 일반 7 / 단축 5
  const tiebreakThreshold = gamesPerSet; // 일반 6-6 / 단축 4-4
  const minGamesForWin = gamesPerSet - 2; // 일반 4 / 단축 2

  sets.forEach((set, index) => {
    const { player1Games, player2Games, player1TiebreakPoints, player2TiebreakPoints } = set;

    // 기본 게임 수 검증
    if (player1Games < 0 || player2Games < 0) {
      errors.push(`${index + 1}세트: 게임 수는 0 이상이어야 합니다.`);
    }

    if (player1Games > maxGamesAllowed || player2Games > maxGamesAllowed) {
      // 🦾 [IRON MAN] 단축 세트인 경우 더 자세한 메시지 제공
      if (gamesPerSet === 4) {
        errors.push(
          `${index + 1}세트: 단축 세트 경기에서는 게임 점수가 ${maxGamesAllowed}점을 넘을 수 없습니다. (최대 ${gamesPerSet}-${gamesPerSet - 2} 또는 ${maxGamesAllowed}-${gamesPerSet - 1})`
        );
      } else {
        errors.push(`${index + 1}세트: 게임 수는 ${maxGamesAllowed}을 초과할 수 없습니다.`);
      }
    }

    // 타이브레이크 검증 (gamesPerSet-gamesPerSet)
    if (player1Games === tiebreakThreshold && player2Games === tiebreakThreshold) {
      if (player1TiebreakPoints === undefined || player2TiebreakPoints === undefined) {
        // 🦾 [IRON MAN] 단축 세트인 경우 더 명확한 메시지
        const setType = gamesPerSet === 4 ? '단축 세트' : '일반 세트';
        errors.push(
          `${index + 1}세트: ${setType}에서 ${tiebreakThreshold}-${tiebreakThreshold}일 때는 타이브레이크 점수가 필요합니다.`
        );
      } else {
        const pointsToWin = index === 2 ? 10 : 7; // Super tiebreak for 3rd set
        const tiebreakType = index === 2 ? '슈퍼 타이브레이크' : '타이브레이크';

        if (Math.abs(player1TiebreakPoints - player2TiebreakPoints) < 2) {
          errors.push(
            `${index + 1}세트: ${tiebreakType}는 2점 차이로 끝나야 합니다. (예: 7-5, 8-6, 10-8)`
          );
        }
        if (Math.max(player1TiebreakPoints, player2TiebreakPoints) < pointsToWin) {
          errors.push(
            `${index + 1}세트: ${tiebreakType}는 최소 ${pointsToWin}점까지 가야 합니다. (예: ${pointsToWin}-${pointsToWin - 2}, ${pointsToWin + 1}-${pointsToWin - 1})`
          );
        }
      }
    }

    // 일반 세트 승리 조건 검증
    if (player1Games !== tiebreakThreshold || player2Games !== tiebreakThreshold) {
      const maxGames = Math.max(player1Games, player2Games);
      const minGames = Math.min(player1Games, player2Games);

      if (maxGames < gamesPerSet) {
        // 🦾 [IRON MAN] 단축 세트인 경우 더 명확한 메시지
        const setType = gamesPerSet === 4 ? '단축 세트' : '일반 세트';
        warnings.push(
          `${index + 1}세트: ${setType} 경기에서 ${gamesPerSet}게임 미만으로 세트가 끝났습니다. 기권이나 특수상황인지 확인하세요.`
        );
      } else if (maxGames === gamesPerSet && minGames > minGamesForWin) {
        // 🦾 [IRON MAN] 단축 세트인 경우 더 명확한 메시지
        if (gamesPerSet === 4) {
          errors.push(
            `${index + 1}세트: 단축 세트에서 ${gamesPerSet}-${minGames}는 불가능합니다. ${gamesPerSet}게임으로 이기려면 상대는 최대 ${minGamesForWin}게임까지만 가능합니다.`
          );
        } else {
          errors.push(
            `${index + 1}세트: ${gamesPerSet}게임으로 이기려면 상대방은 최대 ${minGamesForWin}게임까지만 가능합니다.`
          );
        }
      } else if (
        maxGames === maxGamesAllowed &&
        minGames !== gamesPerSet - 1 &&
        minGames !== gamesPerSet
      ) {
        // 🦾 [IRON MAN] 단축 세트인 경우 더 명확한 메시지
        if (gamesPerSet === 4) {
          errors.push(
            `${index + 1}세트: 단축 세트에서 ${maxGames}-${minGames}는 불가능합니다. ${gamesPerSet}-${minGames}에서 이미 세트가 끝납니다.`
          );
        } else {
          errors.push(
            `${index + 1}세트: ${maxGamesAllowed}게임으로 이기려면 상대방은 ${gamesPerSet - 1}게임 또는 ${gamesPerSet}게임이어야 합니다.`
          );
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Format score display
 * 점수 표시 형식화
 */
export const formatMatchScore = (score: MatchScore): string => {
  if (!score.sets || score.sets.length === 0) return '';

  return score.sets
    .map((set, index) => {
      let setScore = `${set.player1Games}-${set.player2Games}`;

      // 타이브레이크 점수 추가
      if (
        set.player1Games === 6 &&
        set.player2Games === 6 &&
        set.player1TiebreakPoints !== undefined &&
        set.player2TiebreakPoints !== undefined
      ) {
        // For super tiebreak (3rd set), show full score. For regular tiebreak, show winner's score.
        if (index === 2) {
          // Super tiebreak - show full score
          setScore += `(${set.player1TiebreakPoints}-${set.player2TiebreakPoints})`;
        } else {
          // Regular tiebreak - show winner's score
          const winnerScore = Math.max(set.player1TiebreakPoints, set.player2TiebreakPoints);
          setScore += `(${winnerScore})`;
        }
      }

      return setScore;
    })
    .join(', ');
};

// ============ PUBLIC MATCH TYPES ============

/**
 * Public Match Score Submission Form
 * Used for submitting lightning match results to Cloud Function
 */
export interface PublicMatchScoreForm {
  eventId: string;
  hostId: string;
  gameType: 'mens_singles' | 'womens_singles' | 'mixed_doubles' | 'mens_doubles' | 'womens_doubles';
  sets: SetScore[];
  winnerId: string;
  finalScore: string;

  // 복식인 경우 (토너먼트 방식: 개인 단위)
  hostPartnerId?: string;
  opponentId: string; // 단식: 1명, 복식: 대표 1명
  opponentPartnerId?: string; // 복식: 파트너
}

/**
 * Extract matchType from gameType
 * Helper type for separating stats by player count and gender
 */
export type GameMatchType = 'singles' | 'doubles' | 'mixed_doubles';

/**
 * Partner Invitation for Doubles Matches
 * 복식 매치 파트너 초대 정보
 *
 * 📝 LPR System Migration
 * UI 표시: "LPR" (Lightning Pickleball Rating)
 * 코드/DB: "ltr" (아래 필드명들)
 * Migration complete: NTRP → LPR
 */
export interface PartnerInvitation {
  id: string;
  eventId: string;
  eventTitle: string;
  gameType: 'mens_doubles' | 'womens_doubles' | 'mixed_doubles';
  inviterId: string;
  inviterName: string;
  inviterLtr?: number; // 초대자(호스트) LPR 레벨
  invitedUserId: string;
  invitedUserName: string;
  invitedUserLtr?: number; // 초대받은 사람 LPR 레벨
  combinedLtr?: number; // 두 사람의 LPR 합계
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp; // Firestore Timestamp
  expiresAt: Timestamp | Date; // Firestore Timestamp (createdAt + 24 hours)
  updatedAt?: Timestamp; // Firestore Timestamp
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  // 🆕 [KIM] Location details for full address display
  eventCity?: string;
  eventState?: string;
  eventCountry?: string;
  // 🎯 [HOST TEAM INFO] Host team information for team application invitations
  hostName?: string; // 호스트 이름 (영철)
  hostPartnerName?: string; // 호스트 파트너 이름 (회장)
  applicationType?: 'host_partner' | 'team_application'; // 초대 유형
}
