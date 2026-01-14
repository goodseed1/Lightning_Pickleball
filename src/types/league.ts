/**
 * League Type Definitions
 * Lightning Pickleball 클럽 리그 시스템 타입 정의
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

/**
 * ⭐ 핵심 추가: Pickleball Event Types - 피클볼 경기 종류
 * 성별과 경기 형태를 조합한 분류
 */
export type PickleballEventType =
  | 'mens_singles' // 남자 단식
  | 'womens_singles' // 여자 단식
  | 'mens_doubles' // 남자 복식
  | 'womens_doubles' // 여자 복식
  | 'mixed_doubles'; // 혼합 복식

/**
 * Gender Types for Event Validation
 * 경기 종류 검증을 위한 성별 분류
 */
export type Gender = 'male' | 'female';

/**
 * Match Format derived from Event Type
 * 경기 종류로부터 도출되는 매치 형태
 */
export type MatchFormat = 'singles' | 'doubles';

// 리그 상태
export type LeagueStatus =
  | 'preparing' // 준비 중 (요구사항과 일치)
  | 'open' // 참가 신청 중 (요구사항과 일치)
  | 'ongoing' // 진행 중 (정규 시즌)
  | 'playoffs' // 플레이오프 진행 중
  | 'completed' // 완료됨 (요구사항과 일치)
  | 'cancelled'; // 취소됨

// 리그 형식
export type LeagueFormat =
  | 'round_robin' // 풀리그 (모두가 서로 경기)
  | 'single_group' // 단일 그룹
  | 'multiple_groups' // 다중 그룹 (그룹별 리그)
  | 'ladder' // 래더 시스템
  | 'pyramid'; // 피라미드 시스템

// 점수 시스템
export type ScoringSystem =
  | 'standard' // 승리 3점, 무승부 1점, 패배 0점
  | 'pickleball' // 승리 2점, 패배 0점
  | 'custom'; // 사용자 정의

// 매치 상태
export type MatchStatus =
  | 'scheduled' // 예정됨
  | 'in_progress' // 진행 중
  | 'completed' // 완료됨
  | 'cancelled' // 취소됨
  | 'postponed' // 연기됨
  | 'walkover' // 부전승
  | 'pending_approval'; // 승인 대기 중

// 플레이오프 타입
export type PlayoffType = 'final' | 'semifinals' | 'quarterfinals' | 'consolation';

// 플레이오프 매치
export interface PlayoffMatch {
  id: string;
  type: PlayoffType;
  round: number; // 1: 결승, 2: 준결승, 3: 8강 등

  // 선수 정보 (TBD 매치용으로 nullable)
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string;
  player2Name: string;
  status: MatchStatus | 'pending'; // pending: 선수 미정

  // 플레이오프 마커
  isPlayoffMatch?: boolean;

  // 자동 승진 필드
  nextMatchForWinner?: string | null; // 승자가 진출할 다음 매치 ID
  nextMatchForLoser?: string | null; // 패자가 진출할 다음 매치 ID (3,4위전용)
  nextMatchPositionForWinner?: 'player1' | 'player2'; // 승자가 들어갈 위치
  nextMatchPositionForLoser?: 'player1' | 'player2'; // 패자가 들어갈 위치

  scheduledDate?: FirebaseTimestamp;
  actualDate?: FirebaseTimestamp;
  winner?: string;
  score?: {
    sets: SetScore[];
    finalScore: string;
  };
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// 플레이오프 정보
export interface PlayoffInfo {
  type: PlayoffType;
  qualifiedPlayers: string[]; // 플레이오프 진출 선수들
  // matches 필드 제거 - playoff_matches 서브컬렉션에서 직접 읽음
  startDate: FirebaseTimestamp;
  isComplete: boolean;
  winner?: string;
  runnerUp?: string;
  thirdPlace?: string; // 3위
  fourthPlace?: string; // 4위
}

// 리그 설정
export interface LeagueSettings {
  format: LeagueFormat;
  scoringSystem: ScoringSystem;
  pointsForWin: number;
  pointsForDraw?: number;
  pointsForLoss: number;
  pointsForWalkover?: number;

  // 일정 설정
  matchesPerWeek?: number;
  preferredDays?: number[]; // 요일 (0-6)
  preferredTimeSlots?: string[]; // ["19:00-21:00", "14:00-16:00"]

  // 참가 조건
  minParticipants: number;
  maxParticipants: number;
  skillLevelRange?: {
    min: string; // "3.0"
    max: string; // "4.5"
  };

  // 규칙
  tiebreakRules?: TiebreakRule[];
  allowPostponements: boolean;
  maxPostponements?: number;
  defaultMatchDuration: number; // 분
}

// 타이브레이크 규칙
export interface TiebreakRule {
  order: number;
  type: 'head_to_head' | 'goal_difference' | 'goals_scored' | 'goals_against' | 'most_wins';
}

// 플레이어 리그 통계
export interface PlayerStanding {
  playerId: string;
  playerName: string; // 스냅샷용
  position: number; // 순위

  // 경기 기록
  played: number; // 경기 수
  won: number; // 승리
  drawn: number; // 무승부
  lost: number; // 패배

  // Aliases for compatibility
  wins?: number; // Alias for won
  losses?: number; // Alias for lost

  // 게임/세트 기록
  gamesWon: number; // 이긴 게임 수
  gamesLost: number; // 진 게임 수
  gameDifference: number; // 게임 득실차

  // Aliases for compatibility
  gamesFor?: number; // Alias for gamesWon
  gamesAgainst?: number; // Alias for gamesLost

  setsWon: number; // 이긴 세트 수
  setsLost: number; // 진 세트 수
  setDifference: number; // 세트 득실차

  // 포인트
  points: number; // 총 승점

  // 추가 통계
  form: string[]; // 최근 5경기 결과 ["W", "W", "L", "D", "W"]
  streak: {
    type: 'win' | 'draw' | 'loss' | 'none';
    count: number;
  };

  // 메타데이터
  lastUpdated?: FirebaseTimestamp;
  groupId?: string; // 그룹 리그인 경우
}

// League participant info
export interface LeagueParticipant {
  playerId: string;
  playerName: string;
}

// 리그 매치
export interface LeagueMatch {
  id: string;
  leagueId: string;
  eventType: PickleballEventType; // 매치의 경기 종류
  round: number; // 라운드
  matchNumber?: number; // 고유 경기 번호 (생성 순서 기준, optional for backward compatibility)

  // 참가자 (단식 vs 복식에 따라 다름)
  player1Id: string;
  player2Id: string;
  player1Name: string; // 스냅샷용
  player2Name: string; // 스냅샷용

  // 복식인 경우 파트너 정보
  player1PartnerId?: string; // 복식일 때만
  player2PartnerId?: string; // 복식일 때만
  player1PartnerName?: string;
  player2PartnerName?: string;

  // 일정
  scheduledDate?: FirebaseTimestamp;
  actualDate?: FirebaseTimestamp;
  court?: string;

  // 결과
  status: MatchStatus;
  _winner?: string; // playerId
  winner?: string; // Alias for _winner (for compatibility)
  winnerId?: string; // Alias for _winner (for admin functions)
  score?: MatchScore;

  // 점수 필드 (호환성 유지용)
  player1Score?: number;
  player2Score?: number;

  // 관리자 수정 관련
  adminCorrected?: boolean;
  correctionHistory?: Array<{
    timestamp: unknown;
    adminId: string;
    reason: string;
    previousScores: {
      player1Score?: number;
      player2Score?: number;
    };
    previousWinnerId?: string;
    newScores: {
      player1Score: number;
      player2Score: number;
    };
    newWinnerId: string;
  }>;

  // 일정 변경 관련
  adminRescheduled?: boolean;
  rescheduleHistory?: Array<{
    timestamp: unknown;
    adminId: string;
    reason: string;
    previousDate?: FirebaseTimestamp;
    newDate: FirebaseTimestamp;
  }>;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;

  // 플레이오프 마커 (동적으로 추가됨)
  isPlayoffMatch?: boolean;
  notes?: string;
  referee?: string;
}

// 매치 점수
export interface MatchScore {
  sets: SetScore[];
  finalScore: string; // "6-4, 6-3"
  duration?: number; // 분
  retiredPlayer?: string; // 기권한 선수
  walkover?: boolean;
}

// 세트 점수
export interface SetScore {
  player1Games: number;
  player2Games: number;
  tiebreak?: {
    player1Points: number;
    player2Points: number;
  };
}

// 리그 메인 문서 (leagues 컬렉션)
export interface League {
  id: string;
  clubId: string;
  name: string; // 시즌 이름 (요구사항: name 필드)
  seasonNumber?: number; // 시즌 번호

  // ⭐ 핵심: 피클볼 경기 종류
  eventType: PickleballEventType; // 남자단식, 여자단식, 남자복식, 여자복식, 혼합복식

  // 기본 정보
  description?: string;
  bannerImage?: string;

  // 설정
  settings: LeagueSettings;

  // 참가자
  participants: Array<LeagueParticipant | string>; // Supports both formats for backwards compatibility
  waitlist?: string[]; // 대기자

  // 순위표
  standings: PlayerStanding[];

  // 일정 (요구사항 필드명과 일치)
  startDate: FirebaseTimestamp;
  endDate: FirebaseTimestamp;
  applicationDeadline: FirebaseTimestamp; // 요구사항: applicationDeadline

  // 상태
  status: LeagueStatus;
  currentRound?: number;
  totalRounds?: number;
  regularSeasonComplete?: boolean; // 정규 시즌 완료 여부

  // 플레이오프 정보
  playoff?: PlayoffInfo;

  // 우승자 정보 (요구사항 필드명과 일치)
  winnerId?: string; // 요구사항: winnerId
  runnerUpId?: string; // 요구사항: runnerUpId
  champion?: {
    playerId: string;
    playerName: string;
    finalPoints: number;
    finalRecord: string; // "10W-2D-1L"
  };

  // 상금/보상
  prizes?: {
    champion?: PrizeInfo;
    runnerUp?: PrizeInfo;
    thirdPlace?: PrizeInfo;
    participation?: PrizeInfo;
  };

  // 수수료
  entryFee?: {
    amount: number;
    currency: string;
    deadline: FirebaseTimestamp;
  };

  // 메타데이터
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;

  // 통계
  stats?: {
    totalMatches: number;
    completedMatches: number;
    averageMatchDuration: number;
    mostWins: {
      playerId: string;
      count: number;
    };
    longestMatch?: {
      matchId: string;
      duration: number;
    };
  };
}

// 상금 정보
export interface PrizeInfo {
  type: 'cash' | 'trophy' | 'gift' | 'points' | 'other';
  description: string;
  value?: number;
  currency?: string;
  imageUrl?: string;
}

// 리그 그룹 (그룹 리그용)
export interface LeagueGroup {
  id: string;
  leagueId: string;
  name: string; // "Group A"
  participants: string[];
  standings: PlayerStanding[];
  qualifyingPositions: number; // 상위 몇 명이 다음 라운드 진출
}

// 리그 초대
export interface LeagueInvitation {
  id: string;
  leagueId: string;
  invitedBy: string;
  invitedUser: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: FirebaseTimestamp;
  respondedAt?: FirebaseTimestamp;
}

// 리그 활동 로그
export interface LeagueActivity {
  id: string;
  leagueId: string;
  type: 'match_completed' | 'player_joined' | 'player_left' | 'settings_changed' | 'round_started';
  actorId: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: FirebaseTimestamp;
}

// 리그 생성 요청
export interface CreateLeagueRequest {
  clubId: string;
  seasonName: string;
  title: string;
  eventType: PickleballEventType; // ⭐ 핵심: 경기 종류 선택
  description?: string;
  settings: LeagueSettings;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  entryFee?: {
    amount: number;
    currency: string;
  };
}

// 리그 참가 신청 (league_participants 컬렉션)
export interface LeagueParticipant {
  id: string;
  leagueId: string;
  userId: string;
  status: 'applied' | 'confirmed' | 'rejected';
  appliedAt: FirebaseTimestamp;
  processedAt?: FirebaseTimestamp;
  processedBy?: string; // 처리한 관리자 ID
  processingNote?: string; // 승인/거절 사유

  // 복식인 경우 파트너 정보
  partnerId?: string; // 복식 리그일 때 파트너 ID
  partnerName?: string; // 파트너 이름 (스냅샷)
  partnerConfirmed?: boolean; // 파트너가 참가를 확인했는지

  // 사용자 정보 (스냅샷)
  userDisplayName?: string;
  userEmail?: string;
  userLtrLevel?: number;
  userProfileImage?: string;
  userGender?: Gender; // 성별 (혼합복식 검증용)
}

// 기존 LeagueRegistration 유지 (호환성)
export interface LeagueRegistration {
  id: string;
  leagueId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  registeredAt: FirebaseTimestamp;
  approvedAt?: FirebaseTimestamp;
  approvedBy?: string;
  paymentStatus?: 'pending' | 'completed' | 'refunded';
  notes?: string;
}

// 리그 통계 요약
export interface LeagueSummary {
  leagueId: string;
  totalParticipants: number;
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  averageMatchesPerPlayer: number;
  completionRate: number;
  topScorers: PlayerStanding[];
  recentResults: LeagueMatch[];
}

// 헬퍼 함수들
export const calculatePlayerPoints = (
  standing: PlayerStanding,
  settings: LeagueSettings
): number => {
  let points = 0;
  points += standing.won * settings.pointsForWin;
  points += standing.drawn * (settings.pointsForDraw || 0);
  points += standing.lost * settings.pointsForLoss;
  return points;
};

/**
 * 번개 피클볼 공식 리그 타이브레이커 규정 v1.0
 *
 * 리그 순위표 정렬 함수 (동점자 처리 포함)
 *
 * @param standings - 선수 순위 배열
 * @param matches - 리그의 모든 경기 기록 (Head-to-Head 판별용)
 * @param participants - 참가자 등록 순서 (최종 타이브레이커)
 * @returns 정렬된 순위표
 */
export const sortStandings = (
  standings: PlayerStanding[],
  matches: LeagueMatch[] = [],
  participants: string[] = []
): PlayerStanding[] => {
  // Ensure standings is a valid array
  if (!standings || !Array.isArray(standings)) {
    console.error('🐛 DEBUG: sortStandings received invalid standings:', standings);
    return [];
  }

  return standings.sort((a, b) => {
    // 🥇 0차 기준: 승점 (points) - 내림차순
    if (a.points !== b.points) {
      return b.points - a.points;
    }

    // 🏅 동점자 타이브레이커 규칙 적용 (공식 규정 v1.0)

    // 🥇 1순위: Head-to-Head (동점자 간 승자승 원칙)
    const headToHeadWinner = getHeadToHeadWinner(a.playerId, b.playerId, matches);
    if (headToHeadWinner === a.playerId) return -1; // a가 우위
    if (headToHeadWinner === b.playerId) return 1; // b가 우위

    // 🥈 2순위: 세트 득실률 (Set Win Rate)
    const totalSetsA = a.setsWon + a.setsLost;
    const totalSetsB = b.setsWon + b.setsLost;
    const setWinRateA = totalSetsA > 0 ? a.setsWon / totalSetsA : 0;
    const setWinRateB = totalSetsB > 0 ? b.setsWon / totalSetsB : 0;

    if (setWinRateA !== setWinRateB) {
      return setWinRateB - setWinRateA; // 내림차순 (높을수록 우위)
    }

    // 🥉 3순위: 게임 득실률 (Game Win Rate)
    const totalGamesA = a.gamesWon + a.gamesLost;
    const totalGamesB = b.gamesWon + b.gamesLost;
    const gameWinRateA = totalGamesA > 0 ? a.gamesWon / totalGamesA : 0;
    const gameWinRateB = totalGamesB > 0 ? b.gamesWon / totalGamesB : 0;

    if (gameWinRateA !== gameWinRateB) {
      return gameWinRateB - gameWinRateA; // 내림차순 (높을수록 우위)
    }

    // 🏁 최종 순위: 먼저 리그에 등록한 선수 (Registration Order)
    // 이는 추첨보다 더 공정한 시스템적 규칙이다.
    if (participants.length > 0) {
      const indexA = participants.indexOf(a.playerId);
      const indexB = participants.indexOf(b.playerId);

      // 배열에서 찾은 경우에만 비교
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB; // 오름차순 (먼저 등록한 순)
      }
    }

    // 모든 것이 같다면, 공동 순위 (원래 순서 유지)
    return 0;
  });
};

/**
 * Head-to-Head 승자 판별 헬퍼 함수
 *
 * @param playerA - 선수 A의 ID
 * @param playerB - 선수 B의 ID
 * @param matches - 리그의 모든 경기 기록
 * @returns 승자의 ID (없으면 null)
 */
function getHeadToHeadWinner(
  playerA: string,
  playerB: string,
  matches: LeagueMatch[]
): string | null {
  // A와 B가 직접 대결한 경기 찾기
  const headToHeadMatch = matches.find(
    m =>
      m.status === 'completed' &&
      ((m.player1Id === playerA && m.player2Id === playerB) ||
        (m.player1Id === playerB && m.player2Id === playerA))
  );

  // 경기 기록이 없으면 null 반환
  if (!headToHeadMatch) {
    return null;
  }

  // 승자 반환 (winner 또는 _winner 필드)
  return headToHeadMatch.winner || headToHeadMatch._winner || null;
}

export const getPlayerForm = (matches: LeagueMatch[], playerId: string, limit = 5): string[] => {
  const playerMatches = matches
    .filter(
      m =>
        m.status === 'completed' &&
        (m.player1Id === playerId ||
          m.player2Id === playerId ||
          m.player1PartnerId === playerId ||
          m.player2PartnerId === playerId)
    )
    .sort((a, b) => b.actualDate!.toMillis() - a.actualDate!.toMillis())
    .slice(0, limit);

  return playerMatches.map(match => {
    if (match._winner === playerId) return 'W';
    if (match._winner === null) return 'D';
    return 'L';
  });
};

// ============ 경기 종류 관련 헬퍼 함수들 ============

/**
 * 경기 종류로부터 매치 형태 추출
 */
export const getMatchFormatFromEventType = (eventType: PickleballEventType): MatchFormat => {
  if (eventType.includes('singles')) return 'singles';
  return 'doubles';
};

/**
 * 경기 종류에 필요한 성별 검증
 */
export const getRequiredGendersForEvent = (eventType: PickleballEventType): Gender[] => {
  switch (eventType) {
    case 'mens_singles':
    case 'mens_doubles':
      return ['male'];
    case 'womens_singles':
    case 'womens_doubles':
      return ['female'];
    case 'mixed_doubles':
      return ['male', 'female'];
    default:
      return [];
  }
};

/**
 * 참가자 성별이 경기 종류에 적합한지 검증
 * @param eventType - Pickleball event type
 * @param playerGender - Player's gender
 * @param partnerGender - Partner's gender (for doubles)
 * @param t - i18n translation function
 * @returns Validation result with translated error message
 */
export const validateParticipantGender = (
  eventType: PickleballEventType,
  playerGender: Gender,
  partnerGender?: Gender,
  t?: (key: string, params?: Record<string, string>) => string
): { isValid: boolean; error?: string } => {
  const requiredGenders = getRequiredGendersForEvent(eventType);

  // 단식인 경우
  if (eventType.includes('singles')) {
    if (requiredGenders.includes(playerGender)) {
      return { isValid: true };
    }

    if (t) {
      const genderKey = requiredGenders[0] === 'male' ? 'mensOnly' : 'womensOnly';
      const error = `${eventType}${t(`leagueDetail.validation.${genderKey}`)}`;
      return { isValid: false, error };
    }

    return {
      isValid: false,
      error: `${eventType}는 ${requiredGenders[0] === 'male' ? '남성' : '여성'}만 참가 가능합니다.`,
    };
  }

  // 복식인 경우
  if (!partnerGender) {
    return {
      isValid: false,
      error: t ? t('leagueDetail.validation.doublesNeedPartner') : '복식은 파트너가 필요합니다.',
    };
  }

  if (eventType === 'mixed_doubles') {
    // 혼합복식: 한 명은 남성, 한 명은 여성
    if (
      (playerGender === 'male' && partnerGender === 'female') ||
      (playerGender === 'female' && partnerGender === 'male')
    ) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: t
        ? t('leagueDetail.validation.mixedDoublesRequirement')
        : '혼합복식은 남성과 여성이 팀을 이뤄야 합니다.',
    };
  }

  // 남자복식 또는 여자복식
  const targetGender = requiredGenders[0];
  if (playerGender === targetGender && partnerGender === targetGender) {
    return { isValid: true };
  }

  if (t) {
    const genderLabel = t(`leagueDetail.genderLabels.${targetGender}`);
    const error = `${eventType}${t('leagueDetail.validation.genderRestriction', { gender: genderLabel })}`;
    return { isValid: false, error };
  }

  return {
    isValid: false,
    error: `${eventType}는 ${targetGender === 'male' ? '남성' : '여성'} 선수들만 참가 가능합니다.`,
  };
};

/**
 * 경기 종류별 표시명
 * @param eventType - Pickleball event type
 * @param t - i18n translation function
 * @returns Translated event type display name
 */
export const getPickleballEventTypeDisplayName = (
  eventType: PickleballEventType,
  t?: (key: string) => string
): string => {
  // Convert snake_case to camelCase for translation key
  // e.g., 'mens_singles' → 'mensSingles'
  const eventTypeKeyMap: Record<PickleballEventType, string> = {
    mens_singles: 'mensSingles',
    womens_singles: 'womensSingles',
    mens_doubles: 'mensDoubles',
    womens_doubles: 'womensDoubles',
    mixed_doubles: 'mixedDoubles',
  };

  if (t) {
    const translationKey = eventTypeKeyMap[eventType];
    return t(`createClubLeague.eventType.${translationKey}`);
  }

  // Fallback to Korean if no translation function provided
  const eventTypeNames: Record<PickleballEventType, string> = {
    mens_singles: '남자 단식',
    womens_singles: '여자 단식',
    mens_doubles: '남자 복식',
    womens_doubles: '여자 복식',
    mixed_doubles: '혼합 복식',
  };

  return eventTypeNames[eventType];
};

/**
 * 리그에서 필요한 최소/최대 참가자 수 계산
 */
export const calculateParticipantLimits = (
  eventType: PickleballEventType,
  format: LeagueFormat
): { minParticipants: number; maxParticipants: number } => {
  const isDoubles = getMatchFormatFromEventType(eventType) === 'doubles';

  // 복식은 팀 단위로 계산 (2명 = 1팀)
  const baseMin = isDoubles ? 4 : 2; // 복식은 최소 2팀(4명), 단식은 2명
  const baseMax = format === 'round_robin' ? (isDoubles ? 16 : 8) : isDoubles ? 32 : 16;

  return {
    minParticipants: baseMin,
    maxParticipants: baseMax,
  };
};
