/**
 * 🌉 [HEIMDALL] Tournament Type Definitions for Cloud Functions
 * Server-side type definitions for tournament operations
 *
 * Phase 1: Server-Side Migration
 * These types are shared between Cloud Functions and client
 */

import { Timestamp as FirebaseTimestamp } from 'firebase-admin/firestore';

// ============================================================================
// Core Enums & Types
// ============================================================================

/**
 * Tennis Event Types - 테니스 경기 종류
 * Defines the type of tennis event (gender + format)
 */
export type TennisEventType =
  | 'mens_singles' // 남자 단식
  | 'womens_singles' // 여자 단식
  | 'mens_doubles' // 남자 복식
  | 'womens_doubles' // 여자 복식
  | 'mixed_doubles'; // 혼합 복식

/**
 * Gender Types for Event Validation
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/**
 * Tournament Status - 토너먼트 상태
 */
export type TournamentStatus =
  | 'draft' // 준비 중
  | 'registration' // 참가 신청 중
  | 'bracket_generation' // 대진표 생성 중
  | 'in_progress' // 진행 중
  | 'completed' // 완료됨
  | 'cancelled'; // 취소됨

/**
 * Tournament Format - 토너먼트 형식
 */
export type TournamentFormat =
  | 'single_elimination' // 싱글 엘리미네이션
  | 'double_elimination' // 더블 엘리미네이션
  | 'round_robin' // 라운드 로빈
  | 'swiss' // 스위스 시스템
  | 'group_knockout' // 조별 예선 + 토너먼트
  | 'ladder' // 래더
  | 'consolation'; // 컨솔레이션 (패자부활)

/**
 * Match Format - 매치 형식
 */
export type TournamentMatchFormat =
  | 'best_of_1' // 1세트
  | 'best_of_3' // 3세트 (2세트 선승)
  | 'best_of_5' // 5세트 (3세트 선승)
  | 'short_sets' // 단축 세트 (4게임)
  | 'tiebreak_only' // 타이브레이크만
  | 'custom'; // 사용자 정의

/**
 * Seeding Method - 시드 배정 방식
 */
export type SeedingMethod =
  | 'manual' // 수동 배정
  | 'ranking' // 랭킹 기반
  | 'rating' // 레이팅 기반
  | 'random' // 무작위
  | 'snake'; // 스네이크 (강-약 교차)

// ============================================================================
// Tournament Settings
// ============================================================================

/**
 * Tournament Settings - 토너먼트 설정
 * Simplified version for Cloud Functions (only essential fields)
 */
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

// ============================================================================
// Cloud Function Request/Response Interfaces
// ============================================================================

/**
 * 🚀 Create Tournament Request
 * Cloud Function: createTournament
 */
export interface CreateTournamentRequest {
  clubId: string;
  tournamentName: string;
  title: string;
  eventType: TennisEventType;
  description?: string;
  format: TournamentFormat;
  settings: TournamentSettings;

  // Dates (ISO strings - Firestore doesn't accept Date objects in onCall)
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  drawDate?: string;

  // Optional
  entryFee?: {
    amount: number;
    currency: string;
  };
}

/**
 * 🚀 Create Tournament Response
 */
export interface CreateTournamentResponse {
  success: boolean;
  message: string;
  data: {
    tournamentId: string;
    createdAt: string;
  };
}

/**
 * 🚀 Register for Tournament Request
 * Cloud Function: registerForTournament
 */
export interface RegisterForTournamentRequest {
  tournamentId: string;
  userId: string;
  partnerInfo?: {
    partnerId: string;
    partnerName: string;
  };
}

/**
 * 🚀 Register for Tournament Response
 */
export interface RegisterForTournamentResponse {
  success: boolean;
  message: string;
  data: {
    registrationId: string;
    participantId: string;
    registeredAt: string;
  };
}

/**
 * 🚀 Register Team for Tournament Request
 * Cloud Function: registerTeamForTournament
 */
export interface RegisterTeamForTournamentRequest {
  tournamentId: string;
  teamId: string;
  registeredBy: string;
}

/**
 * 🚀 Update Tournament Status Request
 * Cloud Function: updateTournamentStatus
 */
export interface UpdateTournamentStatusRequest {
  tournamentId: string;
  newStatus: TournamentStatus;
  reason?: string; // For cancellation
}

/**
 * 🚀 Update Tournament Status Response
 */
export interface UpdateTournamentStatusResponse {
  success: boolean;
  message: string;
  data?: {
    tournamentId: string;
    previousStatus: TournamentStatus;
    newStatus: TournamentStatus;
    updatedAt: string;
  };
}

// ============================================================================
// Participant Types (for registration)
// ============================================================================

/**
 * Tournament Participant Data
 * Snapshot of participant info at registration time
 */
export interface TournamentParticipantData {
  playerId: string;
  playerName: string;
  playerGender: Gender;
  skillLevel: string;
  profileImage?: string;

  // For doubles
  partnerId?: string;
  partnerName?: string;
  partnerGender?: Gender;
  partnerSkillLevel?: string;
  partnerProfileImage?: string;
  partnerConfirmed?: boolean;

  // Team reference (Team-First 2.0)
  teamId?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Standard Cloud Function Response
 * Generic response type for all Cloud Functions
 */
export interface CloudFunctionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
  };
}

// ============================================================================
// Bracket Types (Phase 5.2 - Server-Side Bracket Generation)
// ============================================================================

/**
 * Match Status for Bracket Matches
 */
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'walkover';

/**
 * Bracket Position Status
 */
export type BracketPositionStatus =
  | 'empty' // 비어있음
  | 'bye' // 부전승
  | 'filled' // 선수 배정됨
  | 'winner' // 이전 경기 승자 대기
  | 'loser'; // 이전 경기 패자 (더블 엘리미네이션)

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
 * Tournament Participant (Singles or Doubles)
 */
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
  partnerConfirmed?: boolean;

  // Team reference (Team-First 2.0)
  teamId?: string;

  // 참가 정보
  seed?: number;
  registeredAt: FirebaseTimestamp;
  checkInStatus?: 'pending' | 'checked_in' | 'no_show';
  checkInTime?: FirebaseTimestamp;
  status: 'registered' | 'confirmed' | 'withdrawn' | 'disqualified';

  // 성적
  wins?: number;
  losses?: number;
  matchesPlayed?: number;
}

/**
 * Doubles Team (Team-First 2.0 Architecture)
 */
export interface DoublesTeam {
  teamId: string; // "{player1Id}_{player2Id}"
  player1: TournamentParticipant;
  player2: TournamentParticipant;
  seed?: number; // 팀 시드 (1, 2, 3, ...)
  teamName?: string; // "Won / 누나" (선택적)
}

/**
 * CompetitiveUnit - Union type for all possible bracket participants
 */
export type CompetitiveUnit = TournamentParticipant | DoublesTeam;

/**
 * Match format indicator
 */
export type MatchFormat = 'singles' | 'doubles';

/**
 * BracketPlayer - Player in a bracket match
 */
export interface BracketPlayer {
  playerId: string;
  playerName: string;
  seed?: number; // 시드 번호
  status: BracketPositionStatus;

  // 복식인 경우 파트너 정보
  partnerId?: string;
  partnerName?: string;

  // 플레이어 정보 스냅샷
  profileImage?: string;
  skillLevel?: string;
  clubName?: string;

  // 경기 결과
  score?: string; // "6-4, 6-2"
  isWinner?: boolean;
}

/**
 * BracketMatch - Single match in the bracket
 */
export interface BracketMatch {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number; // 라운드 내 매치 번호
  bracketPosition: number; // 전체 대진표에서의 위치

  // 참가자
  player1?: BracketPlayer;
  player2?: BracketPlayer;

  // 승자
  winnerId?: string;
  winnerSeed?: number;

  // 다음 라운드 매치 ID (승자가 진출할 매치)
  nextMatchId?: string;
  nextMatchPosition?: 'player1' | 'player2';

  // 패자 브래킷 (더블 엘리미네이션)
  loserNextMatchId?: string;
  loserNextMatchPosition?: 'player1' | 'player2';

  // BYE 관련
  isBye?: boolean; // 부전승 매치
  byeWinnerId?: string; // BYE로 자동 진출한 플레이어

  // 이전 매치 참조 (player1, player2가 어디서 오는지)
  player1SourceMatchId?: string;
  player2SourceMatchId?: string;
  player1SourcePosition?: 'winner' | 'loser';
  player2SourcePosition?: 'winner' | 'loser';

  // 경기 정보
  scheduledTime?: FirebaseTimestamp;
  court?: string;
  status: MatchStatus;

  // 점수 (간소화된 버전)
  score?: string;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  notes?: string;
  referee?: string;
}

/**
 * BracketRound - Single round in the bracket
 */
export interface BracketRound {
  roundNumber: number;
  roundName: string; // "Round of 16", "Quarter Finals", etc.
  matches: BracketMatch[];
  startDate?: FirebaseTimestamp;
  endDate?: FirebaseTimestamp;
  isCompleted: boolean;
}

// ============================================================================
// Helper Functions (Phase 5.2)
// ============================================================================

/**
 * 🔧 [THOR] 실제 매치 수 기반으로 Round 이름 결정
 * BYE가 있는 브래킷에서도 정확한 이름 반환
 *
 * @param roundNumber 라운드 번호 (1, 2, 3, ...)
 * @param totalRounds 전체 라운드 수
 * @param matchesInRound 해당 라운드의 실제 매치 수
 * @returns Round 이름 ("Final", "Semi Finals", "Quarter Finals", etc.)
 */
export const getRoundName = (
  roundNumber: number,
  totalRounds: number,
  matchesInRound: number
): string => {
  // Final은 항상 마지막 라운드
  if (roundNumber === totalRounds) {
    return 'Final';
  }

  // 실제 매치 수로 Round 이름 결정 (ATP/WTA standard)
  switch (matchesInRound) {
    case 1:
      return 'Final';
    case 2:
      return 'Semi Finals';
    case 4:
      return 'Quarter Finals';
    case 8:
      return 'Round of 16';
    case 16:
      return 'Round of 32';
    case 32:
      return 'Round of 64';
    case 64:
      return 'Round of 128';
    default:
      return `Round ${roundNumber}`;
  }
};

// ============================================================================
// Phase 5: Additional Cloud Function Request/Response Types
// ============================================================================

/**
 * 🤖 [VISION] Phase 5.3: Delete Tournament
 * Cloud Function: deleteTournament
 */
export interface DeleteTournamentRequest {
  tournamentId: string;
  reason?: string; // Optional reason for deletion
}

export interface DeleteTournamentResponse {
  success: boolean;
  message: string;
  data?: {
    deletedMatchesCount: number;
    deletedParticipantsCount: number;
  };
}

/**
 * 🤖 [VISION] Phase 5.3: Withdraw From Tournament
 * Cloud Function: withdrawFromTournament
 */
export interface WithdrawFromTournamentRequest {
  tournamentId: string;
  userId: string; // User withdrawing
  reason?: string; // Optional reason
}

export interface WithdrawFromTournamentResponse {
  success: boolean;
  message: string;
  data?: {
    removedParticipantId: string;
  };
}

/**
 * 🤖 [VISION] Phase 5.3: Assign Seeds
 * Cloud Function: assignSeeds
 */
export interface AssignSeedsRequest {
  tournamentId: string;
  seeds: Array<{
    participantId: string;
    seedNumber: number;
  }>;
}

export interface AssignSeedsResponse {
  success: boolean;
  message: string;
  data?: {
    assignedCount: number;
  };
}

/**
 * Set Score - Individual set data
 */
export interface SetScore {
  player1Games: number;
  player2Games: number;
  tiebreak?: {
    player1Points: number;
    player2Points: number;
  };
}

/**
 * Match Score Data - Full score information
 */
export interface MatchScoreData {
  sets: SetScore[];
  finalScore?: string; // "6-4, 3-6, 6-2" (for display)
  walkover?: boolean;
  retired?: boolean;
  retiredPlayer?: 'player1' | 'player2';
}

/**
 * 🤖 [VISION] Phase 5.4: Submit Match Result
 * Cloud Function: submitMatchResult
 *
 * ⚖️ VAR SYSTEM: Server determines winner from scoreData, not from winnerId
 * - winnerId is now OPTIONAL (for backward compatibility and walkover cases)
 * - scoreData is REQUIRED for normal/retired matches
 * - Server calculates winner from scoreData.sets
 */
export interface SubmitMatchResultRequest {
  matchId: string;
  tournamentId: string;
  winnerId?: string; // OPTIONAL: Only used for walkover cases where server can't determine winner
  scoreData?: MatchScoreData; // REQUIRED: Full score data with sets array
  score?: string; // DEPRECATED: Use scoreData.finalScore instead
  retired?: boolean; // DEPRECATED: Use scoreData.retired instead
  walkover?: boolean; // DEPRECATED: Use scoreData.walkover instead
}

export interface SubmitMatchResultResponse {
  success: boolean;
  message: string;
  data?: {
    nextMatchId?: string; // If winner advanced to next match
    tournamentCompleted?: boolean; // If this was the final match
  };
}

/**
 * 🤖 [VISION] Phase 5.4: Generate Next Round
 * Cloud Function: generateNextRound
 */
export interface GenerateNextRoundRequest {
  tournamentId: string;
}

export interface GenerateNextRoundResponse {
  success: boolean;
  message: string;
  data?: {
    roundNumber: number;
    matchesCreated: number;
  };
}

/**
 * 🤖 [VISION] Phase 5.5: Delete Match (Admin)
 * Cloud Function: deleteMatch
 */
export interface DeleteMatchRequest {
  matchId: string;
  tournamentId: string;
  reason?: string; // Admin reason for deletion
}

export interface DeleteMatchResponse {
  success: boolean;
  message: string;
}

/**
 * 🤖 [VISION] Phase 5.5: Update Participant Info
 * Cloud Function: updateParticipantInfo
 */
export interface UpdateParticipantInfoRequest {
  tournamentId: string;
  participantId: string;
  updates: {
    contactInfo?: string;
    notes?: string;
    emergencyContact?: string;
  };
}

export interface UpdateParticipantInfoResponse {
  success: boolean;
  message: string;
}
