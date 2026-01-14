/**
 * Event Participation Type Definitions
 * Lightning Pickleball 이벤트 참여 관련 타입 정의
 */

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

// 참여 유형
export type ParticipationType = 'participant' | 'spectator' | 'helper';

// 참여 상태
export type ParticipationStatus =
  | 'pending' // 승인 대기
  | 'approved' // 승인됨
  | 'rejected' // 거절됨
  | 'waitlisted' // 대기자 명단
  | 'cancelled' // 참여 취소
  | 'confirmed' // 참여 확정
  | 'no_show'; // 불참

// 자동 승인 사유
export type AutoApprovalReason =
  | 'club_member_regular_meeting' // 클럽 회원 + 정기 모임
  | 'event_host' // 이벤트 호스트
  | 'club_admin' // 클럽 관리자
  | 'general_event' // 일반 이벤트 (승인 필요)
  | 'not_regular_meeting' // 정기 모임 아님
  | 'not_club_member' // 클럽 회원 아님
  | 'not_club_event' // 클럽 이벤트 아님
  | 'error_checking_eligibility'; // 확인 중 오류

// 이벤트 참여 요청
export interface EventParticipationRequest {
  id: string;
  eventId: string;
  userId: string;
  participationType: ParticipationType;
  status: ParticipationStatus;
  approvalReason: AutoApprovalReason;

  // 시간 정보
  requestedAt: FirebaseTimestamp;
  approvedAt?: FirebaseTimestamp;
  rejectedAt?: FirebaseTimestamp;
  waitlistedAt?: FirebaseTimestamp;
  confirmedAt?: FirebaseTimestamp;
  cancelledAt?: FirebaseTimestamp;

  // 승인/거절 정보
  approvedBy?: string; // 승인자 ID
  rejectedBy?: string; // 거절자 ID
  rejectionReason?: string; // 거절 사유

  // 대기자 관련
  waitlistPosition?: number; // 대기 순서
  waitlistPriority?: number; // 우선순위 점수

  // 이벤트 스냅샷 (참조용)
  eventSnapshot: {
    title: string;
    dateTime: FirebaseTimestamp;
    location: {
      name: string;
      address?: string;
    };
    clubId?: string;
    type: string;
    isRegularMeeting: boolean;
  };

  // 메타데이터
  notes?: string; // 참여자 메모
  adminNotes?: string; // 관리자 메모
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// 자동 승인 확인 결과
export interface AutoApprovalEligibilityResult {
  eligible: boolean;
  reason: AutoApprovalReason;
  clubId?: string;
  membershipData?: ClubMembershipData;
}

// 클럽 회원 정보
export interface ClubMembershipData {
  clubId: string;
  userId: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: FirebaseTimestamp;
}

// 참여 요청 응답
export interface ParticipationRequestResponse {
  success: boolean;
  participationId: string;
  status: ParticipationStatus;
  autoApproved: boolean;
  reason: AutoApprovalReason;
  eventTitle: string;
  position?: number; // 대기자인 경우 순서
  estimatedWaitTime?: number; // 예상 대기 시간 (분)
}

// 참여 상태 업데이트 요청
export interface UpdateParticipationStatusRequest {
  participationId: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

// 참여 통계
export interface ParticipationStats {
  totalRequests: number;
  approved: number;
  rejected: number;
  waitlisted: number;
  autoApproved: number;
  manualApproved: number;
}

// 이벤트별 참여 요약
export interface EventParticipationSummary {
  eventId: string;
  totalParticipants: number;
  confirmedParticipants: number;
  waitlistedParticipants: number;
  maxParticipants?: number;

  participantsByType: {
    participants: number;
    spectators: number;
    helpers: number;
  };

  autoApprovedCount: number;
  manualApprovedCount: number;

  lastUpdated: FirebaseTimestamp;
}

// 알림 데이터
export interface ParticipationNotificationData {
  type: 'participation_status' | 'participation_request' | 'club_event_participation';
  eventId: string;
  participationId?: string;
  participantId?: string;
  status?: ParticipationStatus;
  autoApproved?: boolean;
  clubId?: string;
}

// 활동 피드 데이터
export interface ParticipationActivityFeedData {
  type: 'event_joined' | 'event_participation_requested';
  userId: string;
  eventId: string;
  title: string;
  description: string;
  timestamp: FirebaseTimestamp;
  metadata: {
    eventType: string;
    isRegularMeeting: boolean;
    autoApproved: boolean;
    clubId?: string;
    participationType: ParticipationType;
  };
}

/**
 * Message template keys for i18n
 * Use these keys with the translation function to get localized messages
 *
 * @example
 * const title = t(PARTICIPATION_MESSAGE_KEYS.autoApprovalTitle);
 * const body = t(PARTICIPATION_MESSAGE_KEYS.autoApprovalBody, { eventTitle: 'Pickleball Match' });
 */
export const PARTICIPATION_MESSAGE_KEYS = {
  autoApprovalTitle: 'eventParticipation.messages.autoApprovalTitle',
  autoApprovalBody: 'eventParticipation.messages.autoApprovalBody',
  requestSentTitle: 'eventParticipation.messages.requestSentTitle',
  requestSentBody: 'eventParticipation.messages.requestSentBody',
  approvedTitle: 'eventParticipation.messages.approvedTitle',
  approvedBody: 'eventParticipation.messages.approvedBody',
  rejectedTitle: 'eventParticipation.messages.rejectedTitle',
  rejectedBody: 'eventParticipation.messages.rejectedBody',
} as const;

// 유틸리티 함수
export const formatParticipationMessage = (template: string, eventTitle: string): string => {
  return template.replace('{eventTitle}', eventTitle);
};

/**
 * Get participation status text using i18n
 * @param status - Participation status
 * @param t - i18n translation function
 * @returns Translated status text
 */
export const getParticipationStatusText = (
  status: ParticipationStatus,
  t: (key: string) => string
): string => {
  const key = `eventParticipation.statusLabels.${status}`;
  return t(key) || status;
};

/**
 * Get participation type text using i18n
 * @param type - Participation type
 * @param t - i18n translation function
 * @returns Translated type text
 */
export const getParticipationTypeText = (
  type: ParticipationType,
  t: (key: string) => string
): string => {
  const key = `eventParticipation.typeLabels.${type}`;
  return t(key) || type;
};
