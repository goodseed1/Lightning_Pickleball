/**
 * Tournament Type Definitions
 * Lightning Tennis 클럽 토너먼트 시스템 타입 정의
 */

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';
import { TennisEventType, Gender } from './league';
import { MatchStatus } from './match';

// ============================================================================
// 🎯 UNIVERSAL BRACKET ENGINE: Competitive Unit Abstractions
// ============================================================================
// These types enable the bracket engine to work with ANY competitive entity,
// whether it's an individual player (singles) or a team (doubles).

/**
 * BracketUnit - The fundamental building block of tournament brackets
 *
 * This interface represents the minimum contract that any competitive entity
 * must fulfill to participate in a bracket. It abstracts away the differences
 * between singles and doubles formats.
 */
export interface BracketUnit {
  id: string; // Unique identifier (playerId or teamId)
  displayName: string; // Name shown in bracket (player name or "Player1 / Player2")
  seed?: number; // Seeding position (1, 2, 3, ...)
  status?: BracketPositionStatus; // Current bracket position status
}

/**
 * CompetitiveUnit - Union type for all possible bracket participants
 *
 * The universal bracket engine operates on CompetitiveUnits without needing
 * to know whether they represent individuals or teams. This enables a single
 * code path for all tournament formats.
 */
export type CompetitiveUnit = TournamentParticipant | DoublesTeam;

/**
 * Match format indicator for the universal engine
 */
export type MatchFormat = 'singles' | 'doubles';

// ============================================================================

// 토너먼트 상태
export type TournamentStatus =
  | 'draft' // 준비 중
  | 'registration' // 참가 신청 중
  | 'bracket_generation' // 대진표 생성 중
  | 'in_progress' // 진행 중
  | 'completed' // 완료됨
  | 'cancelled'; // 취소됨

// 토너먼트 형식
export type TournamentFormat =
  | 'single_elimination' // 싱글 엘리미네이션
  | 'double_elimination' // 더블 엘리미네이션
  | 'round_robin' // 라운드 로빈
  | 'swiss' // 스위스 시스템
  | 'group_knockout' // 조별 예선 + 토너먼트
  | 'ladder' // 래더
  | 'consolation'; // 컨솔레이션 (패자부활)

// 매치 형식 (기존 MatchFormat과 구분하기 위해 Tournament prefix 추가)
// Note: 단축 세트는 별도 옵션으로 분리됨 (scoringFormat.gamesPerSet으로 제어)
export type TournamentMatchFormat =
  | 'best_of_1' // 1세트
  | 'best_of_3' // 3세트 (2세트 선승)
  | 'best_of_5' // 5세트 (3세트 선승)
  | 'tiebreak_only' // 타이브레이크만
  | 'custom'; // 사용자 정의

// 시드 배정 방식
export type SeedingMethod =
  | 'manual' // 수동 배정
  | 'ranking' // 랭킹 기반
  | 'rating' // 레이팅 기반
  | 'random' // 무작위
  | 'snake'; // 스네이크 (강-약 교차)

// 대진표 위치 상태
export type BracketPositionStatus =
  | 'empty' // 비어있음
  | 'bye' // 부전승
  | 'filled' // 선수 배정됨
  | '_winner' // 이전 경기 승자 대기
  | 'loser'; // 이전 경기 패자 (더블 엘리미네이션)

// 토너먼트 설정
export interface TournamentSettings {
  format: TournamentFormat;
  matchFormat: TournamentMatchFormat;
  seedingMethod: SeedingMethod;

  // 참가자 설정
  minParticipants: number;
  maxParticipants: number;
  allowByes: boolean; // 부전승 허용

  // 경기 설정
  scoringFormat: {
    setsToWin: number;
    gamesPerSet: number;
    tiebreakAt?: number; // 6-6에서 타이브레이크
    noAdScoring?: boolean; // 노애드 스코어링
    tiebreakPoints?: number; // 타이브레이크 포인트 (7 or 10)
  };

  // 일정 설정
  matchDuration: number; // 예상 경기 시간 (분)
  courtCount?: number; // 사용 가능한 코트 수
  matchesPerDay?: number; // 하루 최대 경기 수
  restBetweenMatches?: number; // 경기 간 휴식 시간 (분)

  // 규칙
  thirdPlaceMatch: boolean; // 3,4위전
  consolationBracket: boolean; // 패자부활전
  allowWalkovers: boolean; // 부전승 허용

  // 자격 조건
  eligibilityCriteria?: {
    minSkillLevel?: string;
    maxSkillLevel?: string;
    clubMemberOnly?: boolean;
    ageRange?: {
      min?: number;
      max?: number;
    };
  };
}

// 대진표 라운드
export interface BracketRound {
  roundNumber: number;
  roundName: string; // "Round of 16", "Quarter Finals", etc.
  matches: BracketMatch[];
  startDate?: FirebaseTimestamp;
  endDate?: FirebaseTimestamp;
  isCompleted: boolean;
}

// 대진표 매치
export interface BracketMatch {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number; // 라운드 내 매치 번호
  bracketPosition: number; // 전체 대진표에서의 위치

  // 참가자
  player1?: BracketPlayer;
  player2?: BracketPlayer;

  // 이전 매치 참조 (승자/패자가 올라오는 경우)
  previousMatch1?: {
    matchId: string;
    type: '_winner' | 'loser';
  };
  previousMatch2?: {
    matchId: string;
    type: '_winner' | 'loser';
  };

  // 다음 매치 참조
  nextMatch?: {
    matchId: string;
    position: 'player1' | 'player2';
  };

  // 경기 정보
  scheduledTime?: FirebaseTimestamp;
  court?: string;
  status: MatchStatus;

  // 결과
  _winner?: string; // playerId (Firestore field)
  winner?: BracketPlayer; // Computed winner object (for UI)
  winnerId?: string; // Legacy field for backward compatibility
  score?: TournamentScore;

  // 추가 속성
  round?: number | string; // Legacy round field (deprecated, use roundNumber)

  // 메타데이터
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  notes?: string;
  referee?: string;
}

// 대진표 플레이어 (단식/복식 지원)
export interface BracketPlayer {
  playerId: string;
  playerName: string;
  seed?: number; // 시드 번호
  status: BracketPositionStatus;

  // 복식인 경우 파트너 정보
  partnerId?: string;
  partnerName?: string;

  // 플레이어 정보 스냅샷
  skillLevel?: string;
  clubMemberId?: string;
  profileImage?: string;
  gender?: Gender; // 성별 (혼합복식 검증용)
  partnerGender?: Gender; // 파트너 성별
}

// 토너먼트 점수
export interface TournamentScore {
  sets: SetScore[];
  finalScore: string; // "6-4, 3-6, 6-2"
  winner?: 'player1' | 'player2'; // 승자 (player1 또는 player2)
  duration?: number; // 분
  retired?: boolean; // 기권 여부
  retiredPlayer?: string; // 기권한 선수
  walkover?: boolean;
  disqualified?: string; // 실격된 선수
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

// 토너먼트 메인 문서
export interface Tournament {
  id: string;
  clubId: string;
  tournamentName: string;

  // ⭐ 핵심: 테니스 경기 종류
  eventType: TennisEventType; // 남자단식, 여자단식, 남자복식, 여자복식, 혼합복식

  // 기본 정보
  title: string;
  description?: string;
  bannerImage?: string;
  logoImage?: string;

  // 형식 및 설정
  format: TournamentFormat;
  settings: TournamentSettings;

  // 참가자
  participants: TournamentParticipant[];
  waitlist?: string[]; // userId 배열
  seeds?: SeedAssignment[]; // 시드 배정

  // 대진표
  bracket: BracketRound[]; // 라운드별 대진표

  // 일정
  startDate: FirebaseTimestamp;
  endDate: FirebaseTimestamp;
  registrationDeadline: FirebaseTimestamp;
  drawDate?: FirebaseTimestamp; // 대진 추첨일

  // 상태
  status: TournamentStatus;
  currentRound?: number;
  totalRounds: number;

  // 결과
  champion?: {
    playerId: string;
    playerName: string;
    finalOpponent?: string;
    finalScore?: string;
  };
  runnerUp?: {
    playerId: string;
    playerName: string;
  };
  thirdPlace?: {
    playerId: string;
    playerName: string;
  };

  // 상금/보상
  prizes?: {
    champion?: PrizeInfo;
    runnerUp?: PrizeInfo;
    thirdPlace?: PrizeInfo;
    quarterFinalists?: PrizeInfo;
    participation?: PrizeInfo;
  };

  // 참가비
  entryFee?: {
    amount: number;
    currency: string;
    deadline: FirebaseTimestamp;
    refundPolicy?: string;
  };

  // 메타데이터
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;

  // 통계
  stats?: {
    totalMatches: number;
    completedMatches: number;
    upsets: number; // 낮은 시드가 높은 시드를 이긴 횟수
    walkovers: number;
    averageMatchDuration: number;
    longestMatch?: {
      matchId: string;
      duration: number;
      score: string;
    };
    biggestUpset?: {
      matchId: string;
      winnerSeed: number;
      loserSeed: number;
    };
  };

  // 더블 엘리미네이션용 추가 필드
  winnersBracket?: BracketRound[];
  losersBracket?: BracketRound[];
  grandFinal?: BracketMatch;

  // 그룹 스테이지 (조별 예선용)
  groups?: TournamentGroup[];
}

// 🎾 복식 토너먼트 팀 표현
// Team-First Architecture: 복식 토너먼트를 팀 단위로 관리
export interface DoublesTeam {
  teamId: string; // "{player1Id}_{player2Id}"
  player1: TournamentParticipant;
  player2: TournamentParticipant;
  seed?: number; // 팀 시드 (1, 2, 3, ...)
  teamName?: string; // "Won / 누나" (선택적)
}

// 토너먼트 참가자 (단식/복식 지원)
export interface TournamentParticipant {
  id: string; // 참가자 고유 ID
  tournamentId: string;

  // 메인 플레이어
  playerId: string;
  playerName: string;
  playerGender: Gender;
  skillLevel: string;
  profileImage?: string;

  // 복식인 경우 파트너 정보
  partnerId?: string;
  partnerName?: string;
  partnerGender?: Gender;
  partnerSkillLevel?: string;
  partnerProfileImage?: string;
  partnerConfirmed?: boolean; // 파트너가 참가를 확인했는지

  // 🏛️ TEAM-FIRST 2.0: Reference to confirmed team
  teamId?: string; // Link to teams collection for mutual consent verification

  // 참가 정보
  seed?: number;
  registeredAt: FirebaseTimestamp;
  checkInStatus?: 'pending' | 'checked_in' | 'no_show';
  checkInTime?: FirebaseTimestamp;
  status: 'registered' | 'confirmed' | 'withdrawn' | 'disqualified';

  // 성적
  currentRound?: number; // 현재 진출 라운드
  finalPosition?: number; // 최종 순위
  finalRank?: number; // 🆕 Thor 2.0: 최종 랭킹 (1=우승, 2=준우승, etc.)
  matchesPlayed: number;
  matchesWon: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

// 시드 배정
export interface SeedAssignment {
  seed: number;
  playerId: string;
  playerName: string;
  justification?: string; // 시드 배정 이유
  assignedBy?: string;
  assignedAt: FirebaseTimestamp;
}

// 토너먼트 그룹 (조별 예선용)
export interface TournamentGroup {
  id: string;
  name: string; // "Group A"
  participants: string[]; // playerIds
  matches: BracketMatch[];
  standings: GroupStanding[];
  qualifyingPositions: number; // 몇 명이 토너먼트 진출
}

// 그룹 순위
export interface GroupStanding {
  playerId: string;
  playerName: string;
  position: number;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setDifference: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  points: number;
}

// 상금 정보
export interface PrizeInfo {
  type: 'cash' | 'trophy' | 'gift' | 'equipment' | 'other';
  description: string;
  value?: number;
  currency?: string;
  sponsor?: string;
  imageUrl?: string;
}

// 토너먼트 초대
export interface TournamentInvitation {
  id: string;
  tournamentId: string;
  invitedBy: string;
  invitedUser: string;
  seed?: number; // 특별 시드 제공
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: FirebaseTimestamp;
  respondedAt?: FirebaseTimestamp;
}

// 토너먼트 활동 로그
export interface TournamentActivity {
  id: string;
  tournamentId: string;
  type:
    | 'match_started'
    | 'match_completed'
    | 'round_completed'
    | 'upset'
    | 'withdrawal'
    | 'draw_made';
  actorId?: string;
  matchId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: FirebaseTimestamp;
}

// 토너먼트 생성 요청
export interface CreateTournamentRequest {
  clubId: string;
  tournamentName: string;
  title: string;
  eventType: TennisEventType; // ⭐ 핵심: 경기 종류 선택
  description?: string;
  format: TournamentFormat;
  settings: TournamentSettings;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  drawDate?: Date;
  entryFee?: {
    amount: number;
    currency: string;
  };
}

// 토너먼트 등록 (단식/복식 지원)
export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'waitlisted';
  registeredAt: FirebaseTimestamp;
  approvedAt?: FirebaseTimestamp;
  approvedBy?: string;
  seed?: number;
  paymentStatus?: 'pending' | 'completed' | 'refunded';
  notes?: string;

  // 복식인 경우 파트너 정보
  partnerId?: string;
  partnerName?: string;
  partnerConfirmed?: boolean;

  // 🏛️ TEAM-FIRST 2.0: Reference to confirmed team
  teamId?: string; // Link to teams collection for mutual consent verification

  // 사용자 정보 스냅샷
  userDisplayName?: string;
  userGender?: Gender;
  userSkillLevel?: string;
  partnerGender?: Gender;
  partnerSkillLevel?: string;
}

// 헬퍼 함수들

/**
 * 🔧 [THOR] 실제 매치 수 기반으로 Round 이름 결정
 * BYE가 있는 브래킷에서도 정확한 이름 반환
 *
 * @param roundNumber 라운드 번호 (1, 2, 3, ...)
 * @param totalRounds 전체 라운드 수
 * @param matchesInRound 해당 라운드의 실제 매치 수
 * @returns Round 이름 (e.g., "Quarter Finals", "Semi Finals", "Final")
 */
export const getRoundName = (
  roundNumber: number,
  totalRounds: number,
  matchesInRound: number
): string => {
  // Final round
  if (roundNumber === totalRounds) {
    return 'Final';
  }

  // 실제 매치 수로 Round 이름 결정 (더 정확함!)
  switch (matchesInRound) {
    case 1:
      return 'Final'; // 1매치 = Final
    case 2:
      return 'Semi Finals'; // 2매치 = Semi Finals (4팀)
    case 4:
      return 'Quarter Finals'; // 4매치 = Quarter Finals (8팀)
    case 8:
      return 'Round of 16'; // 8매치 = Round of 16 (16팀)
    case 16:
      return 'Round of 32'; // 16매치 = Round of 32 (32팀)
    case 32:
      return 'Round of 64'; // 32매치 = Round of 64 (64팀)
    default:
      // 매치 수로 판단 불가한 경우 → roundNumber 사용
      return `Round ${roundNumber}`;
  }
};

export const calculateNextMatchPosition = (
  currentMatch: BracketMatch
  // isWinner parameter removed - not used in current implementation
): { matchId: string; position: 'player1' | 'player2' } | null => {
  if (!currentMatch.nextMatch) return null;

  return currentMatch.nextMatch;
};

export const isUpset = (winnerSeed?: number, loserSeed?: number): boolean => {
  if (!winnerSeed || !loserSeed) return false;
  return winnerSeed > loserSeed;
};

// ============ 경기 종류 관련 헬퍼 함수들 ============

/**
 * 토너먼트 경기 종류에서 매치 형태 추출
 */
export const getMatchFormatFromTournamentEventType = (
  eventType: TennisEventType
): 'singles' | 'doubles' => {
  if (eventType.includes('singles')) return 'singles';
  return 'doubles';
};

/**
 * 토너먼트 참가자 성별 검증
 * @param t - Translation function for i18n
 */
export const validateTournamentParticipant = (
  eventType: TennisEventType,
  playerGender: Gender,
  partnerGender?: Gender,
  t?: (key: string) => string
): { isValid: boolean; error?: string } => {
  const isDoubles = getMatchFormatFromTournamentEventType(eventType) === 'doubles';
  const translate = t || ((key: string) => key);

  // 단식인 경우
  if (!isDoubles) {
    if (partnerGender) {
      return { isValid: false, error: translate('types.tournament.validation.singlesNoPartner') };
    }

    if (eventType === 'mens_singles' && playerGender !== 'male') {
      return {
        isValid: false,
        error: translate('types.tournament.validation.mensSinglesMaleOnly'),
      };
    }

    if (eventType === 'womens_singles' && playerGender !== 'female') {
      return {
        isValid: false,
        error: translate('types.tournament.validation.womensSinglesFemaleOnly'),
      };
    }

    return { isValid: true };
  }

  // 복식인 경우
  if (!partnerGender) {
    return {
      isValid: false,
      error: translate('types.tournament.validation.doublesPartnerRequired'),
    };
  }

  if (eventType === 'mens_doubles') {
    if (playerGender !== 'male' || partnerGender !== 'male') {
      return {
        isValid: false,
        error: translate('types.tournament.validation.mensDoublesMaleOnly'),
      };
    }
  } else if (eventType === 'womens_doubles') {
    if (playerGender !== 'female' || partnerGender !== 'female') {
      return {
        isValid: false,
        error: translate('types.tournament.validation.womensDoublesFemaleOnly'),
      };
    }
  } else if (eventType === 'mixed_doubles') {
    if (
      (playerGender === 'male' && partnerGender !== 'female') ||
      (playerGender === 'female' && partnerGender !== 'male')
    ) {
      return {
        isValid: false,
        error: translate('types.tournament.validation.mixedDoublesRequirement'),
      };
    }
  }

  return { isValid: true };
};

/**
 * 토너먼트 참가자 수 제한 계산
 */
export const calculateTournamentParticipantLimits = (
  eventType: TennisEventType,
  format: TournamentFormat
): { minParticipants: number; maxParticipants: number } => {
  const isDoubles = getMatchFormatFromTournamentEventType(eventType) === 'doubles';

  let baseMin = 4; // 최소 4명/팀
  let baseMax = 32; // 최대 32명/팀

  // 토너먼트 형식에 따른 조정
  if (format === 'single_elimination' || format === 'double_elimination') {
    // 토너먼트는 2의 거듭제곱으로 설정 (대진표 생성 용이성)
    baseMax = isDoubles ? 32 : 64;
    baseMin = 4;
  } else if (format === 'round_robin') {
    // 풀리그는 적은 수로 설정 (모든 참가자가 서로 경기)
    baseMax = isDoubles ? 8 : 12;
    baseMin = isDoubles ? 4 : 6;
  } else if (format === 'swiss') {
    // 스위스 시스템
    baseMax = isDoubles ? 16 : 24;
    baseMin = 6;
  }

  return {
    minParticipants: baseMin,
    maxParticipants: baseMax,
  };
};

/**
 * 경기 종류별 표시명
 * @param t - Translation function for i18n
 */
export const getTournamentEventTypeDisplayName = (
  eventType: TennisEventType,
  t?: (key: string) => string
): string => {
  const translate = t || ((key: string) => key);
  return translate(`types.tournament.eventTypes.${eventType}`);
};

/**
 * 토너먼트 대진표 생성을 위한 팀 구성
 */
export const createTournamentTeam = (
  participant: TournamentParticipant
): { teamId: string; teamName: string; isDoubles: boolean } => {
  const isDoubles = !!participant.partnerId;

  if (isDoubles) {
    return {
      teamId: participant.id,
      teamName: `${participant.playerName} / ${participant.partnerName}`,
      isDoubles: true,
    };
  } else {
    return {
      teamId: participant.id,
      teamName: participant.playerName,
      isDoubles: false,
    };
  }
};
