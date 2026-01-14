/**
 * Lightning Pickleball Club System - TypeScript Type Definitions
 * Defines all data structures for the club management system
 */

import { Timestamp } from 'firebase/firestore';

// ============ ENUMS & CONSTANTS ============

export type ClubMemberRole = 'admin' | 'manager' | 'member';
export type ClubMemberStatus = 'active' | 'pending' | 'suspended' | 'left';
export type ClubStatus = 'active' | 'inactive' | 'suspended';
export type ClubEventType = 'practice' | 'match' | 'tournament' | 'social' | 'meeting' | 'lesson';
export type ClubEventCategory = 'regular' | 'special' | 'championship';
export type ClubEventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type ChatMessageType = 'message' | 'announcement' | 'system' | 'event_notification';
export type RecurrenceType = 'weekly' | 'monthly' | 'custom';
export type Currency = 'USD' | 'KRW';
export type PaymentPeriod = 'monthly' | 'yearly';
export type ClubVisibility = 'public' | 'membersOnly' | 'private';

// ============ CORE INTERFACES ============

/**
 * Club basic information and settings
 */
export interface Club {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;

  // Profile object for additional club information
  profile?: {
    name?: string;
    description?: string;
    bio?: string;
    logo?: string;
    avatar?: string;
    coverImage?: string;
    courtAddress?: {
      address?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
      zipCode?: string;
      region?: string;
    };
    rules?: Array<{
      title: string;
      description: string;
    }>;
  };

  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    zipCode?: string;
    region: string;
  };

  settings: {
    isPublic: boolean;
    joinRequiresApproval: boolean;
    visibility: ClubVisibility;
    maxMembers?: number;
    membershipFee?: {
      amount: number;
      currency: Currency;
      period: PaymentPeriod;
    };
  };

  tags: string[];
  skillLevel?: 'mixed' | 'beginner' | 'intermediate' | 'advanced';
  playingStyle: string[];
  languages: string[];

  contact: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      kakaoTalk?: string;
    };
  };

  stats: {
    totalMembers: number;
    activeMembers: number;
    totalEvents: number;
    monthlyEvents: number;
  };

  // 🏆 Herald of Victory: Recent tournament winners
  recentWinners?: Array<{
    tournamentId: string;
    tournamentName: string;
    eventType: string; // 남자단식, 여자단식, 남자복식, 여자복식, 혼합복식
    championId: string;
    championName: string;
    completedAt: Timestamp;
    finalScore?: string;
  }>;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: ClubStatus;
}

/**
 * Club membership information with role and permissions
 */
export interface ClubMember {
  id: string; // {clubId}_{userId}
  clubId: string;
  userId: string;

  role: ClubMemberRole;
  status: ClubMemberStatus;

  memberInfo: {
    displayName: string;
    nickname: string;
    photoURL?: string;
    skillLevel: string;
    preferredLanguage: string;
  };

  clubActivity: {
    eventsAttended: number;
    eventsHosted?: number;
    lastActiveAt: Timestamp;
    joinDate: Timestamp;
    memberSince: string;
  };

  permissions: {
    canCreateEvents: boolean;
    canModerateChat: boolean;
    canInviteMembers: boolean;
    canManageMembers?: boolean;
  };

  notifications: {
    clubEvents: boolean;
    clubChat: boolean;
    memberUpdates: boolean;
    announcements: boolean;
  };

  invitedBy?: string;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Club event information
 */
export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;

  type: ClubEventType;
  category: ClubEventCategory;
  skillLevel?: string;

  schedule: {
    startTime: Timestamp;
    endTime: Timestamp;
    duration: number; // in minutes
    timezone: string;
  };

  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    courtInfo?: {
      courtCount: number;
      surface: string;
      isIndoor: boolean;
    };
  };

  participants: {
    maxParticipants?: number;
    currentCount: number;
    registeredIds: string[];
    waitlistIds?: string[];
    attendedIds?: string[];
  };

  settings: {
    isPrivate: boolean;
    requiresApproval: boolean;
    allowGuests: boolean;
    cost?: {
      amount: number;
      currency: Currency;
      paymentMethod?: string;
    };
  };

  recurrence?: {
    type: RecurrenceType;
    interval: number;
    daysOfWeek?: number[];
    endDate?: Timestamp;
    exceptions?: Timestamp[];
  };

  status: ClubEventStatus;

  equipment?: string[];
  instructions?: string;
  attachments?: {
    images: string[];
    documents: string[];
  };

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Club chat message
 */
export interface ClubChatMessage {
  id: string;
  clubId: string;
  senderId: string;

  senderInfo: {
    displayName: string;
    nickname: string;
    photoURL?: string;
    role: ClubMemberRole;
  };

  content: {
    text?: string;
    imageUrls?: string[];
    attachments?: {
      fileName: string;
      fileUrl: string;
      fileType: string;
    }[];
  };

  type: ChatMessageType;
  relatedEventId?: string;
  replyTo?: string;

  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;
  deletedAt?: Timestamp;

  readBy: Record<string, Timestamp>;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Club invitation
 */
export interface ClubInvitation {
  id: string;
  clubId: string;

  clubInfo: {
    name: string;
    logoUrl?: string;
  };

  invitedUserId?: string;
  invitedEmail?: string;
  invitedBy: string;

  inviterInfo: {
    displayName: string;
    role: string;
  };

  status: InvitationStatus;
  message?: string;

  createdAt: Timestamp;
  expiresAt: Timestamp;
  respondedAt?: Timestamp;
}

// ============ UI & FORM INTERFACES ============

/**
 * Form data for creating a new club
 */
export interface CreateClubForm {
  name: string;
  description: string;
  location: {
    address: string;
    zipCode?: string;
    region: string;
  };
  tags: string[];
  skillLevel?: string;
  playingStyle: string[];
  languages: string[];
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
  settings: {
    isPublic: boolean;
    joinRequiresApproval: boolean;
    visibility: ClubVisibility;
    maxMembers?: number;
  };
}

/**
 * Form data for creating a club event
 */
export interface CreateEventForm {
  title: string;
  description: string;
  type: ClubEventType;
  category: ClubEventCategory;
  startTime: Date;
  endTime: Date;
  location: {
    name: string;
    address: string;
  };
  maxParticipants?: number;
  settings: {
    isPrivate: boolean;
    requiresApproval: boolean;
    allowGuests: boolean;
  };
  recurrence?: {
    type: RecurrenceType;
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  equipment?: string[];
  instructions?: string;
}

/**
 * Member invitation form data
 */
export interface InviteMemberForm {
  email: string;
  message?: string;
  role: ClubMemberRole;
}

// ============ API RESPONSE INTERFACES ============

/**
 * Club list with pagination
 */
export interface ClubListResponse {
  clubs: Club[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * Club member list response
 */
export interface ClubMemberListResponse {
  members: ClubMember[];
  totalCount: number;
  admins: ClubMember[];
  managers: ClubMember[];
  regularMembers: ClubMember[];
}

/**
 * Club events list response
 */
export interface ClubEventListResponse {
  events: ClubEvent[];
  totalCount: number;
  upcomingEvents: ClubEvent[];
  pastEvents: ClubEvent[];
}

/**
 * Club chat messages response
 */
export interface ClubChatResponse {
  messages: ClubChatMessage[];
  hasMore: boolean;
  lastMessageId?: string;
  unreadCount: number;
}

// ============ UTILITY INTERFACES ============

/**
 * Club membership summary for user profile
 */
export interface UserClubMembership {
  clubId: string;
  clubName: string;
  clubLogo?: string;
  role: ClubMemberRole;
  joinedAt: Timestamp;
  isActive: boolean;
}

/**
 * Club statistics for dashboard
 */
export interface ClubStatistics {
  totalMembers: number;
  newMembersThisMonth: number;
  totalEvents: number;
  eventsThisMonth: number;
  averageAttendance: number;
  activeMembers: number;
}

/**
 * Event participation info
 */
export interface EventParticipation {
  eventId: string;
  userId: string;
  status: 'registered' | 'waitlist' | 'attended' | 'cancelled';
  registeredAt: Timestamp;
  attendedAt?: Timestamp;
}

// ============ FILTER & SEARCH INTERFACES ============

/**
 * Club search and filter options
 */
export interface ClubSearchFilters {
  query?: string;
  location?: string;
  skillLevel?: string[];
  tags?: string[];
  languages?: string[];
  isPublic?: boolean;
  hasOpenSpots?: boolean;
  sortBy: 'name' | 'members' | 'activity' | 'created';
  sortOrder: 'asc' | 'desc';
}

/**
 * Event search and filter options
 */
export interface EventSearchFilters {
  clubId?: string;
  type?: ClubEventType[];
  category?: ClubEventCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  skillLevel?: string[];
  hasOpenSpots?: boolean;
  isUpcoming?: boolean;
  sortBy: 'date' | 'title' | 'participants';
  sortOrder: 'asc' | 'desc';
}

// ============ CONSTANTS ============

export const CLUB_MEMBER_ROLES: Record<ClubMemberRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};

export const CLUB_EVENT_TYPES: Record<ClubEventType, string> = {
  practice: 'Practice',
  match: 'Match',
  tournament: 'Tournament',
  social: 'Social',
  meeting: 'Meeting',
  lesson: 'Lesson',
};

export const CLUB_EVENT_CATEGORIES: Record<ClubEventCategory, string> = {
  regular: 'Regular',
  special: 'Special',
  championship: 'Championship',
};

export const CLUB_VISIBILITY_OPTIONS: Record<
  ClubVisibility,
  { en: string; ko: string; description: { en: string; ko: string } }
> = {
  public: {
    en: 'Public',
    ko: '전체 공개',
    description: {
      ko: '비회원도 클럽 홈의 모든 탭에 접근 가능 (리그/토너먼트 탭 제외). 가입 신청 가능.',
      en: 'Non-members can access all club tabs except League/Tournament. Join requests allowed.',
    },
  },
  membersOnly: {
    en: 'Members Only',
    ko: '회원 비공개',
    description: {
      ko: '비회원은 멤버 탭을 볼 수 없음 (리그/토너먼트 탭 제외). 가입 신청 가능.',
      en: 'Non-members cannot see Members tab (League/Tournament excluded). Join requests allowed.',
    },
  },
  private: {
    en: 'Private',
    ko: 'Private',
    description: {
      ko: '탐색/클럽 목록에서 숨김. 가입 신청 불가. 초대 전용.',
      en: 'Hidden from Explore/Club list. No join requests. Invitation only.',
    },
  },
};

export const DEFAULT_MEMBER_PERMISSIONS: Record<ClubMemberRole, ClubMember['permissions']> = {
  admin: {
    canCreateEvents: true,
    canModerateChat: true,
    canInviteMembers: true,
    canManageMembers: true,
  },
  manager: {
    canCreateEvents: true,
    canModerateChat: true,
    canInviteMembers: true,
    canManageMembers: false,
  },
  member: {
    canCreateEvents: false,
    canModerateChat: false,
    canInviteMembers: false,
    canManageMembers: false,
  },
};
