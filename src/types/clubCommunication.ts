/**
 * Club Communication Type Definitions
 * Lightning Pickleball 클럽 커뮤니케이션 시스템 타입 정의
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
import { safeToDate } from '../utils/dateUtils';

// 클럽 정책
export interface ClubPolicy {
  clubId: string;
  content: string;
  lastUpdatedBy: string;
  lastUpdatedAt: FirebaseTimestamp;
  version: number;
}

// 게시글
export interface ClubPost {
  id: string;
  clubId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  commentCount: number;
  isAnnouncement?: boolean;
  isPinned?: boolean;
}

// 게시글 생성 요청
export interface CreatePostRequest {
  clubId: string;
  title: string;
  content: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
}

// 게시글 업데이트 요청
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
}

// 댓글
export interface PostComment {
  id: string;
  postId: string;
  clubId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  isDeleted?: boolean;
  parentCommentId?: string; // 대댓글용
  replies?: PostComment[];
}

// 댓글 생성 요청
export interface CreateCommentRequest {
  postId: string;
  clubId: string;
  content: string;
  parentCommentId?: string;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  clubId: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: FirebaseTimestamp;
  type: MessageType;
  replyTo?: {
    messageId: string;
    userName: string;
    text: string;
  };
  isEdited?: boolean;
  editedAt?: FirebaseTimestamp;
}

// 메시지 타입
export type MessageType = 'text' | 'system' | 'announcement' | 'image';

// 채팅 메시지 전송 요청
export interface SendMessageRequest {
  clubId: string;
  text: string;
  type?: MessageType;
  replyTo?: {
    messageId: string;
    userName: string;
    text: string;
  };
}

// 게시글 작성자 정보
export interface PostAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: 'admin' | 'manager' | 'member';
  ltrLevel?: number;
}

// 게시글 요약 (목록용)
export interface PostSummary {
  id: string;
  title: string;
  authorName: string;
  createdAt: FirebaseTimestamp;
  commentCount: number;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  excerpt: string; // 내용 일부 미리보기
}

// 채팅방 정보
export interface ChatRoomInfo {
  clubId: string;
  clubName: string;
  memberCount: number;
  lastMessage?: {
    text: string;
    userName: string;
    createdAt: FirebaseTimestamp;
  };
  unreadCount: number;
}

// 클럽 커뮤니케이션 통계
export interface CommunicationStats {
  clubId: string;
  totalPosts: number;
  totalComments: number;
  totalMessages: number;
  activeMembers: number;
  lastActivityAt: FirebaseTimestamp;
}

// 알림 타입
export type NotificationType = 'new_post' | 'new_comment' | 'mention' | 'announcement';

// 클럽 알림
export interface ClubNotification {
  id: string;
  clubId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // postId or messageId
  isRead: boolean;
  createdAt: FirebaseTimestamp;
}

// Helper Functions

/**
 * 게시글 내용 미리보기 생성
 */
export const getPostExcerpt = (content: string, maxLength: number = 100): string => {
  const plainText = content.replace(/<[^>]*>/g, ''); // HTML 태그 제거
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
};

/**
 * 시간 경과 포맷
 * @param timestamp - Firebase timestamp
 * @param t - i18n translation function
 * @returns Time ago string
 */
export const getTimeAgo = (
  timestamp: FirebaseTimestamp,
  t?: (key: string, params?: Record<string, number>) => string
): string => {
  const now = new Date();
  const messageTime = safeToDate(timestamp, {
    functionName: 'getTimeAgo',
    fieldName: 'timestamp',
    additionalContext: {
      calledBy: 'clubCommunication_getTimeAgo',
      originalTimestamp: timestamp,
    },
  });

  if (!messageTime) {
    return t ? t('clubCommunication.timeAgo.noTimeInfo') : 'No time information';
  }

  const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return t ? t('clubCommunication.timeAgo.justNow') : 'just now';
  }

  if (diffInMinutes < 60) {
    return t
      ? t('clubCommunication.timeAgo.minutesAgo', { count: diffInMinutes })
      : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t
      ? t('clubCommunication.timeAgo.hoursAgo', { count: diffInHours })
      : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return t
      ? t('clubCommunication.timeAgo.daysAgo', { count: diffInDays })
      : `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return t
      ? t('clubCommunication.timeAgo.monthsAgo', { count: diffInMonths })
      : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return t
    ? t('clubCommunication.timeAgo.yearsAgo', { count: diffInYears })
    : `${diffInYears} years ago`;
};

/**
 * 날짜 포맷
 * @param timestamp - Firebase timestamp
 * @param locale - Locale string (e.g., 'ko-KR', 'en-US')
 * @param t - i18n translation function
 * @returns Formatted date string
 */
export const formatDate = (
  timestamp: FirebaseTimestamp,
  locale = 'ko-KR',
  t?: (key: string) => string
): string => {
  const date = safeToDate(timestamp, {
    functionName: 'formatDate',
    fieldName: 'timestamp',
    additionalContext: {
      calledBy: 'clubCommunication_formatDate',
      originalTimestamp: timestamp,
    },
  });

  if (!date) {
    return t ? t('clubCommunication.timeAgo.noDateInfo') : 'No date information';
  }

  const now = new Date();

  // 오늘인 경우 시간만 표시
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // 올해인 경우 월/일 표시
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(locale, {
      month: '2-digit',
      day: '2-digit',
    });
  }

  // 다른 년도인 경우 년/월/일 표시
  return date.toLocaleDateString(locale);
};

/**
 * 메시지 그룹핑 (같은 사용자의 연속 메시지)
 */
export const groupMessages = (messages: ChatMessage[]): ChatMessage[][] => {
  const groups: ChatMessage[][] = [];
  let currentGroup: ChatMessage[] = [];

  messages.forEach((message, index) => {
    const prevMessage = messages[index - 1];

    // 첫 메시지이거나, 이전 메시지와 다른 사용자인 경우 새 그룹 시작
    if (
      index === 0 ||
      prevMessage.userId !== message.userId ||
      message.createdAt.toMillis() - prevMessage.createdAt.toMillis() > 300000
    ) {
      // 5분 간격

      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

/**
 * 정책 내용 검증
 * @param content - Policy content
 * @param t - i18n translation function
 * @returns Validation result with translated errors
 */
export const validatePolicyContent = (
  content: string,
  t?: (key: string) => string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push(
      t ? t('clubCommunication.validation.policyRequired') : 'Please enter policy content'
    );
  }

  if (content.length < 10) {
    errors.push(
      t
        ? t('clubCommunication.validation.policyTooShort')
        : 'Policy content must be at least 10 characters'
    );
  }

  if (content.length > 10000) {
    errors.push(
      t
        ? t('clubCommunication.validation.policyTooLong')
        : 'Policy content cannot exceed 10,000 characters'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 게시글 제목/내용 검증
 * @param title - Post title
 * @param content - Post content
 * @param t - i18n translation function
 * @returns Validation result with translated errors
 */
export const validatePost = (
  title: string,
  content: string,
  t?: (key: string) => string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push(t ? t('clubCommunication.validation.titleRequired') : 'Please enter a title');
  }

  if (title.length > 100) {
    errors.push(
      t ? t('clubCommunication.validation.titleTooLong') : 'Title cannot exceed 100 characters'
    );
  }

  if (!content || content.trim().length === 0) {
    errors.push(t ? t('clubCommunication.validation.contentRequired') : 'Please enter content');
  }

  if (content.length > 5000) {
    errors.push(
      t
        ? t('clubCommunication.validation.contentTooLong')
        : 'Content cannot exceed 5,000 characters'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 댓글 검증
 * @param content - Comment content
 * @param t - i18n translation function
 * @returns Validation result with translated errors
 */
export const validateComment = (
  content: string,
  t?: (key: string) => string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push(t ? t('clubCommunication.validation.commentRequired') : 'Please enter a comment');
  }

  if (content.length > 1000) {
    errors.push(
      t
        ? t('clubCommunication.validation.commentTooLong')
        : 'Comment cannot exceed 1,000 characters'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 채팅 메시지 검증
 * @param text - Message text
 * @param t - i18n translation function
 * @returns Validation result with translated errors
 */
export const validateMessage = (
  text: string,
  t?: (key: string) => string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push(t ? t('clubCommunication.validation.messageRequired') : 'Please enter a message');
  }

  if (text.length > 1000) {
    errors.push(
      t
        ? t('clubCommunication.validation.messageTooLong')
        : 'Message cannot exceed 1,000 characters'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
