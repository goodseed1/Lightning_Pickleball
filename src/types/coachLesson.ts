/**
 * 코치 레슨 게시판 타입 정의
 * 테니스 레슨 공지를 위한 게시판 데이터 구조
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 위치 좌표 인터페이스
 */
export interface LessonLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

/**
 * 코치 레슨 게시글 인터페이스
 */
export interface CoachLesson {
  id: string;

  // 작성자 정보
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;

  // 레슨 정보 (필수)
  title: string;
  description: string;

  // 옵션 정보
  dateTime?: Timestamp; // 레슨 시간
  location?: string; // 장소 (텍스트)
  fee?: number; // 레슨료
  maxParticipants?: number; // 모집 인원

  // 위치 정보 (거리 필터링용)
  coordinates?: LessonLocation;

  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'closed' | 'deleted';

  // UI용 계산 필드 (Firestore에 저장 안됨)
  distance?: number;
}

/**
 * 레슨 생성 요청 인터페이스
 */
export interface CreateLessonRequest {
  title: string;
  description: string;
  dateTime?: Date;
  location?: string;
  fee?: number;
  maxParticipants?: number;
  coordinates?: LessonLocation;
}

/**
 * 레슨 수정 요청 인터페이스
 */
export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  dateTime?: Date;
  location?: string;
  fee?: number;
  maxParticipants?: number;
  status?: 'active' | 'closed';
}
