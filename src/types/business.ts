/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
export interface BusinessContactInfo {
  email: string;
  phone: string;
  website?: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
}

export interface BusinessOwner {
  userId: string;
  displayName: string;
  email: string;
}

export interface BusinessService {
  name: string;
  description: string;
  price?: number;
  duration?: number;
}

export interface BusinessPartnership {
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clubDiscounts: any[]; // TODO: Define club partnership type
  generalDiscount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specialOffers: any[]; // TODO: Define special offer type
}

export interface Business {
  id?: string;
  name: string;
  description: string;
  type: 'coach' | 'pro_shop' | 'academy' | 'court_rental';
  contactInfo: BusinessContactInfo;
  owner: BusinessOwner;
  services: BusinessService[];
  specialties: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricing: Record<string, any>;
  availability: Record<string, unknown>;
  partnership: BusinessPartnership;
  images: string[];
  logo: string;
  certifications: string[];
  status: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt: any;
}

export interface Coach extends Business {
  type: 'coach';
  ltrLevel?: number;
  yearsExperience?: number;
  playingHistory?: string;
  coachingPhilosophy?: string;
}

export interface ProShop extends Business {
  type: 'pro_shop';
  brands: string[];
  stringService: boolean;
  racquetService: boolean;
}

export interface Partnership {
  id?: string;
  businessId: string;
  businessName: string;
  description: string;
  discountPercentage: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validUntil: any;
  terms: string;
  isActive: boolean;
  clubsEligible: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}
