/**
 * Lightning Tennis Onboarding Data Types
 * Defines the structure of data collected during the onboarding process
 */

// 10 supported languages for Lightning Tennis
export type SupportedLanguage = 'en' | 'ko' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'it' | 'ru';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type PlayingStyle =
  | 'rally_focused'
  | 'game_preference'
  | 'both_great'
  | 'singles_specialist'
  | 'doubles_specialist'
  | 'aggressive_baseline'
  | 'serve_and_volley'
  | 'all_court';

export type Gender = 'male' | 'female';

/**
 * Complete onboarding data structure
 * Contains all information collected during the 4-step onboarding process
 */
export interface OnboardingData {
  // Step 1: Language Selection
  language: SupportedLanguage;
  preferredLanguage: SupportedLanguage;

  // Step 2: Terms & Agreements (processed but not stored in profile)
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  locationAccepted?: boolean;
  liabilityAccepted?: boolean;

  // Step 3: Basic Profile Setup
  nickname: string;
  gender: Gender;
  skillLevel: SkillLevel;
  zipCode: string;
  communicationLanguages: SupportedLanguage[];
  playingStyle: PlayingStyle[];
  activityRegions: string[];
  notificationDistance: number; // in miles/km
  maxTravelDistance: number; // in miles/km

  // Step 4: Preferences & Settings
  notifications?: {
    personalMatches: boolean;
    clubEvents: boolean;
    friendRequests: boolean;
    matchReminders: boolean;
    notificationDistance: number;
  };

  privacy?: {
    showEmail: boolean;
    showLocation: boolean;
    showStats: boolean;
  };

  // Profile nested structure (alternative format support)
  profile?: {
    nickname?: string;
    gender?: Gender;
    skillLevel?: SkillLevel;
    zipCode?: string;
    playingStyle?: PlayingStyle[];
    activityRegions?: string[];
    maxTravelDistance?: number;
    notificationDistance?: number;
  };
}

/**
 * User profile structure as stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  updatedAt?: string;

  profile: {
    nickname: string;
    skillLevel: SkillLevel;
    gender: Gender;
    location: string;
    zipCode: string;
    activityRegions: string[];
    playingStyle: PlayingStyle[];
    maxTravelDistance: number;
    notificationDistance: number;
    preferredLanguage: SupportedLanguage;
    communicationLanguages: SupportedLanguage[];
    onboardingCompleted: boolean;
    onboardingCompletedAt: string | null;
  };

  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
    eloRating: number;
  };

  preferences: {
    language: SupportedLanguage;
    notifications: {
      personalMatches: boolean;
      clubEvents: boolean;
      friendRequests: boolean;
      matchReminders: boolean;
      notificationDistance: number;
    };
    privacy: {
      showEmail: boolean;
      showLocation: boolean;
      showStats: boolean;
    };
  };
}

/**
 * Skill level descriptions for UI display
 */
export const SKILL_LEVELS: Record<SkillLevel, { label: string; description: string }> = {
  beginner: {
    label: 'Beginner (1.0-2.5)',
    description: 'New to tennis or less than 1 year, learning basic strokes',
  },
  intermediate: {
    label: 'Intermediate (3.0-3.5)',
    description: 'Stable forehand/backhand, understands basic doubles strategy',
  },
  advanced: {
    label: 'Advanced (4.0-4.5)',
    description: 'Powerful and accurate strokes, tournament experience',
  },
  expert: {
    label: 'Expert (5.0+)',
    description: 'Professional level or equivalent, regional tournament winners',
  },
};

/**
 * Playing style descriptions for UI display
 */
export const PLAYING_STYLES: Record<PlayingStyle, string> = {
  rally_focused: 'Rally-focused practice',
  game_preference: 'Game/Match preference',
  both_great: 'Both are great',
  singles_specialist: 'Singles specialist',
  doubles_specialist: 'Doubles specialist',
  aggressive_baseline: 'Aggressive baseline',
  serve_and_volley: 'Serve and volley',
  all_court: 'All-court player',
};

/**
 * Validation functions for onboarding data
 */
export const validateOnboardingData = {
  nickname: (value: string): boolean => {
    return value.trim().length >= 2 && value.trim().length <= 20;
  },

  skillLevel: (value: string): value is SkillLevel => {
    return ['beginner', 'intermediate', 'advanced', 'expert'].includes(value);
  },

  zipCode: (value: string): boolean => {
    // US ZIP code pattern (5 digits or 5+4 format)
    return /^\d{5}(-\d{4})?$/.test(value);
  },

  notificationDistance: (value: number): boolean => {
    return value >= 1 && value <= 100; // 1-100 miles/km
  },

  maxTravelDistance: (value: number): boolean => {
    return value >= 1 && value <= 200; // 1-200 miles/km
  },
};
