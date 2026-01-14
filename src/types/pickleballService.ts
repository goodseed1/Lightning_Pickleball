/**
 * 피클볼 서비스 게시판 타입 정의
 * 줄 교체, 패들 수리, 중고 거래 등 피클볼 관련 서비스 게시판
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 위치 좌표 인터페이스
 */
export interface ServiceLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

/**
 * 서비스 카테고리 - 피클볼용
 * Note: 'stringing' 제거됨 - 패들에는 줄이 없음!
 */
export type ServiceCategory =
  | 'paddle_sales' // 패들 판매
  | 'paddle_rental' // 패들 대여
  | 'used_paddle' // 중고 패들
  | 'used_equipment' // 중고 장비 (볼머신 등)
  | 'court_rental' // 코트 대여
  | 'lessons' // 레슨
  | 'other'; // 기타

/**
 * 피클볼 서비스 게시글 인터페이스
 */
export interface PickleballService {
  id: string;

  // 작성자 정보
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;

  // 서비스 정보 (제목만 필수)
  title: string;
  description?: string;
  category?: ServiceCategory;

  // 이미지 (옵션, 최대 5장)
  images?: string[];

  // 가격 정보 (옵션)
  price?: number;

  // 연락처 (옵션)
  contactInfo?: string;

  // 위치 정보 (거리 필터링용)
  coordinates?: ServiceLocation;

  // 메타데이터
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'sold' | 'deleted';

  // UI용 계산 필드 (Firestore에 저장 안됨)
  distance?: number;
}

/**
 * 서비스 생성 요청 인터페이스
 */
export interface CreateServiceRequest {
  title: string;
  description?: string;
  category?: ServiceCategory;
  images?: string[];
  price?: number;
  contactInfo?: string;
  coordinates?: ServiceLocation;
}

/**
 * 서비스 수정 요청 인터페이스
 */
export interface UpdateServiceRequest {
  title?: string;
  description?: string;
  category?: ServiceCategory;
  images?: string[];
  price?: number;
  contactInfo?: string;
  status?: 'active' | 'sold';
}
