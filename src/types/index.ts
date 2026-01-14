/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

// ============ LOCATION DATA STANDARD ============

/**
 * 🗺️ UNIVERSAL LOCATION PROFILE - The Single Source of Truth
 *
 * This is the ONLY location data structure used throughout the entire app.
 * ALL location data producers (AuthContext, LocationContext, etc.) must comply with this interface.
 * ALL location data consumers (ProfileHeader, UI components) must expect only this format.
 */
export interface LocationProfile {
  /** Full address string (e.g., "Atlanta, GA" or "서울시 강남구") */
  address: string;
  /** Country code (e.g., "US", "KR") */
  country: string;
  /** City name from reverse geocoding (e.g., "Duluth") */
  city?: string;
  /** State/region from reverse geocoding (e.g., "GA", "Georgia") */
  state?: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Latitude coordinate (alias for compatibility) */
  latitude: number;
  /** Longitude coordinate (alias for compatibility) */
  longitude: number;
  /** 🌍 Timezone identifier (e.g., "America/New_York", "Asia/Seoul") */
  timezone?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;

  // Profile info
  skillLevel: SkillLevel;
  preferredLanguage: SupportedLanguage;
  communicationLanguages?: SupportedLanguage[];
  /** 💥 STANDARDIZED: Now using LocationProfile instead of inline type */
  location?: LocationProfile;
  nickname?: string;
  gender?: Gender;

  // Preferences
  notificationRadius: number; // in km
  playingStyle: PlayingStyle[];
  availability: Availability;
  distanceUnit?: 'km' | 'miles';
  currencyUnit?: string;
  notificationDistance?: number;
  availabilityPreference?: string;
  preferredTimesWeekdays?: string[];
  preferredTimesWeekends?: string[];
  preferredPlayingStyle?: string | string[];

  // Permissions
  locationPermissionGranted?: boolean;
  notificationPermissionGranted?: boolean;
}

export interface UserProfile {
  userId: string;
  nickname: string;
  gender: Gender;
  skillLevel: SkillLevel;
  bio?: string;
  interests: string[];
  stats: PlayerStats;
}

/** 매치 타입별 통계 (singles/doubles/mixed_doubles) */
export interface MatchTypeStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  elo: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

/** 성별별 통계 구조 */
export interface GenderStats {
  singles: MatchTypeStats;
  doubles: MatchTypeStats;
  mixed_doubles: MatchTypeStats;
}

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;

  // Public match breakdown by matchType (singles/doubles/mixed_doubles)
  publicStats?: {
    // 전체 통계 (기존, backward compatibility)
    singles: MatchTypeStats;
    doubles: MatchTypeStats;
    mixed_doubles: MatchTypeStats;

    // 🆕 성별별 통계
    byGender?: {
      male: GenderStats;
      female: GenderStats;
    };
  };
}

// Enums and constants
// 10 supported languages for Lightning Tennis
export type SupportedLanguage = 'en' | 'ko' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'it' | 'ru';

export type SkillLevel =
  | 'beginner' // 1.0-2.5 NTRP
  | 'intermediate' // 3.0-3.5 NTRP
  | 'advanced' // 4.0-4.5 NTRP
  | 'expert'; // 5.0+ NTRP

export type Gender = 'male' | 'female';

export type PlayingStyle = 'rally_focused' | 'match_focused' | 'both' | 'social' | 'competitive';

export interface Availability {
  weekdays: boolean[];
  weekends: boolean[];
  mornings: boolean;
  afternoons: boolean;
  evenings: boolean;
}

// Lightning Match types
export interface LightningMatch {
  id: string;
  hostId: string;
  title: string;
  description: string;

  // Match details
  skillLevel: SkillLevel;
  maxPlayers: number;
  currentPlayers: string[];
  pendingRequests: string[];

  // Location and time
  court: TennisCourt;
  scheduledTime: Date;
  duration: number; // in minutes

  // Match settings
  isPublic: boolean;
  tags: string[];

  // Status
  status: MatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type MatchStatus = 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';

export interface TennisCourt {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  surfaceType: CourtSurface;
  isIndoor: boolean;
  amenities: string[];
  rating: number;
  priceRange: PriceRange;
}

export type CourtSurface = 'hard' | 'clay' | 'grass' | 'artificial';
export type PriceRange = 'free' | 'low' | 'medium' | 'high';

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Profile: { userId?: string };
  CreateMatch: undefined;
  MatchDetails: { matchId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Lightning: undefined;
  Social: undefined;
  Profile: undefined;
};

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
