/**
 * Activity Types for Lightning Tennis App
 * Complete data models for events, applications, and participants
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

// Google Place Details Interface - preserves rich location data from Places API
export interface GooglePlaceDetails {
  place_id: string;
  formatted_address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  types?: string[];
  name?: string;
  vicinity?: string;
}

// Location Details Input - flexible input format for location data
export interface LocationDetailsInput {
  placeId?: string;
  place_id?: string;
  formatted_address?: string;
  address?: string;
  coordinates?: { lat?: number; lng?: number };
  lat?: number;
  lng?: number;
  types?: string[];
  name?: string;
  formattedAddress?: string;
  vicinity?: string;
  [key: string]: unknown;
}

export type EventType = 'match' | 'meetup';
export type ParticipationStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'cancelled_by_host'
  | 'cancelled_by_user'
  // 🎯 [OPERATION SOLO LOBBY] Solo and team application statuses
  | 'looking_for_partner' // Solo applicant waiting for partner in lobby
  | 'pending_partner_approval' // Team application waiting for partner acceptance
  | 'closed' // Application closed (another team was approved)
  | 'rejected'; // Application rejected by host
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled' | 'partner_pending';

// Core Event Model
export interface LightningEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;

  // Host Information
  hostId: string;
  hostName: string;
  hostProfileImage?: string;

  // Event Details
  location: string; // Display address (legacy compatibility)
  placeDetails?: GooglePlaceDetails; // 🎯 SOURCE OF TRUTH for coordinates and rich place data
  scheduledTime: Date;
  duration?: number; // in minutes
  actualEndTime?: Date; // When the event actually ended
  maxParticipants: number;

  // Game Configuration
  gameType:
    | 'rally'
    | 'mixed_doubles'
    | 'mens_doubles'
    | 'womens_doubles'
    | 'mens_singles'
    | 'womens_singles';
  ltrLevel: string;
  languages: string[];
  autoApproval: boolean;
  participationFee?: number;

  // 🎯 [LTR FIX] LTR range for skill matching
  minLtr?: number; // Minimum LTR (for singles: hostLtr, for doubles: combinedLtr/2)
  maxLtr?: number; // Maximum LTR (same as minLtr in auto-calculated system)
  hostLtr?: number; // 🎯 [LTR FIX] Host's individual LTR for partner filtering

  // Status
  status: EventStatus;
  isPublic: boolean;

  // Chat
  chatUnreadCount?: { [userId: string]: number }; // Unread message count per participant

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Participation Application Model
export interface ParticipationApplication {
  id: string;
  eventId: string;
  applicantId: string;
  applicantName: string;
  applicantProfileImage?: string;
  applicantSkillLevel?: string;

  // Application Details
  status: ParticipationStatus;
  appliedAt: Date | string | { seconds: number; nanoseconds: number }; // 🛡️ [IRON MAN ALPHA] Support multiple date formats
  updatedAt?: Date | string | { seconds: number; nanoseconds: number }; // 🛡️ [IRON MAN ALPHA] Track last update
  processedAt?: Date | { toMillis: () => number }; // Firestore Timestamp or Date
  processedBy?: string; // hostId who approved/declined

  // Additional Info
  message?: string; // Application message from user
  hostMessage?: string; // Response message from host

  // 🆕 복식인 경우 파트너 정보 (토너먼트와 동일한 구조)
  partnerId?: string; // 파트너 userId
  partnerName?: string; // 파트너 이름
  teamId?: string; // "C_D" 형식의 팀 식별자

  // 🎯 [OPERATION DUO] 파트너 초대 상태 (Phase 2A)
  partnerStatus?: 'pending' | 'accepted' | 'rejected'; // 파트너 응답 상태
  partnerInvitationId?: string; // 연결된 partner_invitations 문서 ID

  // 🎯 [KIM FIX] Closed application timestamp (when another team was approved)
  closedAt?: Date | { toMillis: () => number }; // Firestore Timestamp or Date
  closedReason?: string; // e.g., 'another_team_approved'

  // 🎯 [SOLO LOBBY] Solo lobby fields
  pendingProposalFrom?: string; // User ID of someone who proposed teaming up
}

// Chat Room Model
export interface EventChatRoom {
  id: string;
  eventId: string;
  participants: string[]; // userIds
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

// Combined Event with Participation Data
export interface EventWithParticipation extends LightningEvent {
  // For events I applied to
  myApplication?: ParticipationApplication;

  // For events I host
  applications?: ParticipationApplication[];
  approvedApplications?: ParticipationApplication[];
  pendingApplications?: ParticipationApplication[];

  // Club-related fields
  clubId?: string;
  clubName?: string; // 🛡️ [IRON MAN ALPHA] Club display name
  participants?: Array<{
    userId: string;
    status: string;
    [key: string]: unknown;
  }>;

  // 🎯 [OPERATION DUO] Participant count from Firestore (single source of truth)
  currentParticipants?: number; // Direct from Firestore
  computedParticipantCount?: number; // Computed by ActivityService
  partnerName?: string; // Partner's display name
  partnerStatus?: 'pending' | 'rejected'; // Partner invitation status
  partnerAccepted?: boolean; // Partner acceptance status
  lastRejectedPartnerName?: string; // Name of rejected partner (legacy - for backward compatibility)
  lastRejectedPartnerId?: string; // ID of rejected partner (legacy - for backward compatibility)
  lastRejectedAt?: Date; // When partner was rejected (legacy - for backward compatibility)
  rejectedPartners?: Array<{
    // 🆕 [KIM] Array of all rejected partners (Option 1: Keep legacy + add array)
    partnerId: string;
    partnerName?: string;
    rejectedAt: Date;
  }>;
  hostPartnerId?: string; // Partner user ID
  hostPartnerName?: string; // Partner display name

  // 🎯 [SOLO LOBBY] Count of other solo applicants waiting in this event's lobby
  soloLobbyCount?: number;

  // Chat room info
  chatRoomId?: string;
  hasUnreadMessages?: boolean;

  // 🛡️ [IRON MAN ALPHA] Additional fields for UI display
  distance?: number; // Distance from user location in km
  skillLevel?: string; // Skill level display string
  applicantName?: string; // Name of approved applicant (for match results)
  coordinates?: { lat: number; lng: number }; // Location coordinates
  locationDetails?: string; // Additional location details
  partnerInvitationId?: string; // Partner invitation ID

  // Match result data (for completed events with scores)
  matchResult?: {
    score: {
      sets: import('./match').SetScore[]; // 세트별 점수 배열
      finalScore: string; // "6-4, 3-6, 10-8" 형식
    };
    winnerId: string; // Host or opponent userId
    hostResult: 'win' | 'loss'; // Host's match result
    opponentResult: 'win' | 'loss'; // 🆕 추가
    opponentId: string; // Opponent user ID
    submittedAt: Date; // When score was submitted
    confirmedAt?: Date; // When score was confirmed (optional)
    eloProcessed: boolean; // Whether ELO has been updated
  };
}

// User Activity Summary
export interface UserActivitySummary {
  totalEventsHosted: number;
  totalEventsParticipated: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  upcomingEvents: number;
  completedEvents: number;
}

// Activity Filter Options
export interface ActivityFilters {
  eventType?: EventType[];
  status?: ParticipationStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  gameType?: string[];
  ltrLevel?: string[];
}

// Notification Types
export interface ActivityNotification {
  id: string;
  userId: string;
  type:
    | 'application_submitted'
    | 'application_approved'
    | 'application_declined'
    | 'event_reminder'
    | 'chat_message';
  title: string;
  message: string;
  data: {
    eventId?: string;
    applicationId?: string;
    chatRoomId?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Query Parameters
export interface EventQueryParams {
  hostId?: string;
  participantId?: string;
  status?: EventStatus[];
  limit?: number;
  startAfter?: string; // For pagination
  orderBy?: 'scheduledTime' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface ApplicationQueryParams {
  applicantId?: string;
  eventId?: string;
  status?: ParticipationStatus[];
  limit?: number;
  startAfter?: string;
}
