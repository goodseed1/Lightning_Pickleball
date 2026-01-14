/**
 * Auth Context for Lightning Pickleball
 * Manages user authentication state
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Firebase imports from central config
import { auth, db } from '../firebase/config';
// Language context import for emergency diagnostics
import { useLanguage } from './LanguageContext';
// 🛡️ PLAN B: Data sanitization utilities
import { sanitizeUserProfileData } from '../utils/dataUtils';
// 🎥 CCTV: Comprehensive logging for race condition debugging
import { cctvLog, CCTV_PHASES } from '../utils/cctvLogger';
// 📊 STATS: Import PlayerStats type for match statistics
import { PlayerStats } from '../types/index';
// i18n for translations
import i18n from '../i18n';

const isFirebaseAvailable = true;

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  skillLevel: string; // NTRP 등급 (예: '3.0-3.5', '4.0-4.5', etc.) - 통합된 실력 레벨
  ltrLevel: string; // NTRP 레벨 (skillLevel과 동일한 값, 호환성을 위해 별도 필드)
  playingStyle: string;
  maxTravelDistance: number; // 최대 이동 거리 (마일)
  profile: {
    location: {
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
      address?: string;
      city?: string;
      region?: string;
      country?: string;
    } | null;
    gender?: 'male' | 'female'; // 🎯 [PHASE 4.5] Gender for match type restrictions
  };
  languages: string[];
  recentMatches: unknown[];
  goals: string | null;
  isOnboardingComplete?: boolean; // Firestore에 저장된 온보딩 완료 상태
  stats?: PlayerStats; // 🎯 LEDGER SYNC: Match statistics for UI display
  eloRatings?: {
    // ELO rating system for player skill
    singles: { current: number; history: unknown[] };
    doubles: { current: number; history: unknown[] };
    mixed: { current: number; history: unknown[] };
  };
  // 🧠 OPERATION RECALL: Comprehensive user settings and preferences
  // @deprecated Use profile.location instead. This field is kept for backward compatibility only.
  // ⚠️ WARNING: This field should NOT be used for new data. Always use profile.location as the primary source.
  location?: {
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
    address?: string;
    city?: string;
    country?: string;
  } | null;
  distanceUnit?: 'km' | 'miles';
  currencyUnit?: string;
  nickname?: string;
  gender?: 'male' | 'female';
  preferredPlayingStyle?: string | string[];
  availabilityPreference?: string;
  preferredTimesWeekdays?: string[];
  preferredTimesWeekends?: string[];
  notificationDistance?: number;
  communicationLanguages?: string[];
  locationPermissionGranted?: boolean;
  notificationPermissionGranted?: boolean;
  // 🎯 [KIM FIX] User registration date for profile display
  createdAt?: string | Date | { toDate: () => Date };
}

interface AuthResult {
  success: boolean;
  error?: string;
  code?: string; // Firebase 에러 코드
  user?: User;
  emailVerificationRequired?: boolean; // 📧 이메일 인증 필요 여부
  email?: string; // 📧 인증 대기 중인 이메일
}

// 🚫 Auth block reasons - when user is blocked from accessing the app
type AuthBlockReason = 'email_verification_required' | 'profile_missing' | null;

interface AuthContextType {
  currentUser: User | null;
  user: User | null; // Alias for currentUser (for compatibility)
  loading: boolean;
  isProfileLoaded: boolean; // 새로운 상태: Firestore 프로필 로딩 완료 여부
  isAuthenticated: boolean; // 새로운 상태: 명확한 인증 상태
  isOnboardingComplete: boolean;
  isNewUserForOnboarding: boolean; // AI 온보딩 완료 여부
  isAdmin: boolean; // 🔒 관리자 권한 (Custom Claims)
  // 🚫 Auth block state - for showing appropriate error screens
  authBlockReason: AuthBlockReason;
  blockedEmail: string | null;
  clearAuthBlock: () => void; // Clear the block state (used after user sees the error)
  signIn: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  resendVerificationEmail: (email: string, password: string) => Promise<AuthResult>; // 📧 이메일 인증 재전송
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  markOnboardingComplete: (profileData?: Partial<User>) => Promise<void>;
  markAIOnboardingComplete: () => Promise<void>; // AI 온보딩 완료 마킹
  refreshUserProfile: () => Promise<void>; // 🔄 Developer Tool: Force reload profile from Firestore
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 🏛️ TEAM-FIRST 2.0: Convert numeric skill level to string label
 * Maps onboarding skill slider values (25, 50, 75, 90) to standardized levels
 */
function convertNumericToLevel(num: number): string {
  if (num <= 30) return 'beginner';
  if (num <= 60) return 'intermediate';
  if (num <= 80) return 'advanced';
  return 'expert';
}

/**
 * 🏛️ TEAM-FIRST 2.0: Convert any skillLevel format to NEW structure for Firestore
 * Handles OLD structures (string, number) and NEW structure (object)
 * @param skillLevel - Can be string ('3.0-3.5'), number (50), or NEW structure object
 * @returns NEW structure object or undefined if no valid input
 */
function handleSkillLevelForFirestore(
  skillLevel: unknown
): { selfAssessed: string; lastUpdated: string; source: string } | undefined {
  // Priority 1: Already NEW structure
  if (skillLevel && typeof skillLevel === 'object' && 'selfAssessed' in skillLevel) {
    const levelObj = skillLevel as { selfAssessed: string; lastUpdated?: string; source?: string };
    return {
      selfAssessed: levelObj.selfAssessed,
      lastUpdated: levelObj.lastUpdated || new Date().toISOString(),
      source: levelObj.source || 'profile_update',
    };
  }

  // Priority 2: OLD structure - string
  if (typeof skillLevel === 'string') {
    return {
      selfAssessed: skillLevel,
      lastUpdated: new Date().toISOString(),
      source: 'profile_update',
    };
  }

  // Priority 3: OLD structure - number (from onboarding)
  if (typeof skillLevel === 'number') {
    return {
      selfAssessed: convertNumericToLevel(skillLevel),
      lastUpdated: new Date().toISOString(),
      source: 'profile_update',
    };
  }

  return undefined;
}

// Extract the useAuth hook to a separate export to fix react-refresh/only-export-components
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth must be used within an AuthProvider');
    // Return safe default instead of throwing
    return {
      currentUser: null,
      user: null, // Alias for currentUser
      loading: false,
      isProfileLoaded: false,
      isAuthenticated: false,
      isOnboardingComplete: false,
      isNewUserForOnboarding: false,
      isAdmin: false, // 🔒 관리자 권한 기본값
      // 🚫 Auth block state defaults
      authBlockReason: null as AuthBlockReason,
      blockedEmail: null as string | null,
      clearAuthBlock: () => {},
      signIn: async () => {},
      signInWithEmail: async () => ({ success: false, error: 'Not authenticated' }),
      signUpWithEmail: async () => ({ success: false, error: 'Not authenticated' }),
      signOut: async () => {},
      updateUserProfile: async () => {},
      markOnboardingComplete: async () => {},
      markAIOnboardingComplete: async () => {},
      refreshUserProfile: async () => {},
    };
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false); // 새로운 상태
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isNewUserForOnboarding, setIsNewUserForOnboarding] = useState(false); // AI 온보딩 상태
  const [isAdmin, setIsAdmin] = useState(false); // 🔒 관리자 권한 상태
  // 🚫 Auth block state - for showing appropriate error screens
  const [authBlockReason, setAuthBlockReason] = useState<AuthBlockReason>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  // 🔧 [FIX] useRef로 변경 - useState closure 문제 해결 (로그아웃 시 리스너 정리)
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  // 📧 [KIM FIX] Flag to prevent onAuthStateChanged from interfering during signup
  const isSigningUpRef = useRef<boolean>(false);

  // 🕵️‍♂️ EMERGENCY DIAGNOSTICS: Language tracking for data divergence investigation
  const { currentLanguage, setLanguage } = useLanguage();

  // 🎥 CCTV: AuthContext initialization logging
  cctvLog('AuthContext', CCTV_PHASES.INIT, 'AuthProvider initialized', {
    currentLanguage,
    initialStates: {
      currentUser: !!currentUser,
      loading,
      isProfileLoaded,
      isOnboardingComplete,
    },
  });

  // Register push notification token
  const registerPushToken = async (userId: string) => {
    try {
      const NotificationService = (await import('../services/NotificationService')).default;
      const notificationService = NotificationService.getInstance();
      const { granted, token: pushToken } = await notificationService.requestPermissions();

      if (!granted) {
        console.log('⚠️ [PushToken] Notification permission denied');
        return;
      }

      if (!pushToken) {
        console.log('⚠️ [PushToken] Permission granted but no token received (simulator?)');
        return;
      }

      // Save to Firestore (check if document exists first)
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Document exists → update only push token fields
        await setDoc(
          userRef,
          {
            pushToken: pushToken,
            pushTokenUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log('✅ [PushToken] Registered successfully:', pushToken);
      } else {
        // Document doesn't exist yet (during signup) → skip for now
        console.log('⏳ [PushToken] User document not ready yet, will retry later');
      }
    } catch (error) {
      console.error('❌ [PushToken] Failed to register:', error);
    }
  };

  // 🔒 관리자 권한 확인 함수 (Custom Claims)
  const checkAdminClaim = async (firebaseUser?: { uid: string } | null) => {
    try {
      // 전달받은 firebaseUser 또는 auth.currentUser 사용
      const user = firebaseUser ? auth?.currentUser : auth?.currentUser;
      if (!user) {
        console.log('🔒 [Admin Check] No Firebase user found');
        setIsAdmin(false);
        return;
      }

      console.log('🔒 [Admin Check] Checking admin claim for user:', user.uid);
      const idTokenResult = await user.getIdTokenResult(true); // force refresh
      const isAdminClaim = idTokenResult.claims.isAdmin === true;
      setIsAdmin(isAdminClaim);
      console.log(
        '🔒 [Admin Check] isAdmin:',
        isAdminClaim,
        'claims:',
        JSON.stringify(idTokenResult.claims)
      );
    } catch (error) {
      console.error('🔒 [Admin Check] Error:', error);
      setIsAdmin(false);
    }
  };

  // Load user profile from Firestore with REAL-TIME LISTENER
  const loadUserProfile = async (firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }) => {
    // 🎥 CCTV: Profile loading sequence start
    cctvLog('AuthContext', CCTV_PHASES.AUTH_PROFILE_LOADING, 'Starting profile loading sequence', {
      userId: firebaseUser?.uid,
      currentLanguage,
      firebaseUser: {
        email: firebaseUser?.email,
        displayName: firebaseUser?.displayName,
        hasPhotoURL: !!firebaseUser?.photoURL,
      },
    });

    // 🕵️‍♂️ EMERGENCY DIAGNOSTIC LOG 1: Entry point
    console.log(`--- 🕵️‍♂️ AUTH CONTEXT AUDIT (Language: ${currentLanguage}) ---`);
    console.log('🔍 loadUserProfile called - Real-time listener setup starting...');
    console.log('🔍 User ID:', firebaseUser?.uid);

    if (!isFirebaseAvailable || !db) {
      console.warn('⚠️ Firebase not available, skipping profile load');
      return;
    }

    try {
      // 💥 여기가 바로 최종 해결책! 💥
      // getDoc() 대신 onSnapshot()을 사용하여 실시간으로 데이터 변경을 감지한다.
      const { doc, onSnapshot } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', firebaseUser.uid);

      // 기존 프로필 리스너가 있다면 먼저 정리
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }

      // 실시간 프로필 리스너 설정 - 이제 Firestore 변경사항이 즉시 반영됩니다!
      // 🎥 CCTV: Real-time listener setup
      cctvLog('AuthContext', 'LISTENER_SETUP', 'Setting up onSnapshot real-time listener', {
        userId: firebaseUser.uid,
        currentLanguage,
      });

      const unsubscribeProfile = onSnapshot(
        userDocRef,
        async userDoc => {
          // 🎥 CCTV: Real-time data arrival
          cctvLog('AuthContext', 'DATA_ARRIVAL', 'Real-time profile update received', {
            documentExists: userDoc.exists(),
            timestamp: new Date().toISOString(),
            currentLanguage,
          });

          // 🕵️‍♂️ EMERGENCY DIAGNOSTIC LOG 3: Real-time update received
          console.log(
            `📡 [AuthContext AUDIT] Real-time profile update received! (Language: ${currentLanguage})`
          );
          console.log(`📡 [AuthContext AUDIT] Document exists: ${userDoc.exists()}`);
          console.log(`📡 [AuthContext AUDIT] Update timestamp: ${new Date().toISOString()}`);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // 🚨 CCTV 1: Command Center - Raw Firebase Data Reception
            console.log(
              `📡 [AuthContext CCTV] (Language: ${currentLanguage}) Incoming raw userData.profile?.location:`,
              JSON.stringify(userData?.profile?.location)
            );
            console.log(
              `📡 [AuthContext CCTV] (Language: ${currentLanguage}) Incoming raw userData.location:`,
              'Legacy field no longer used - data unified to profile.location'
            );

            // Handle nested profile data structure
            const profileData = userData.profile || userData; // Support both nested and flat structure

            // Legacy data migration: convert old ltrLevel to new skillLevel format
            let unifiedSkillLevel = profileData.skillLevel || userData.skillLevel;
            if (!unifiedSkillLevel && (profileData.ltrLevel || userData.ltrLevel)) {
              // Migrate old ltrLevel to new skillLevel format
              const oldLtrLevel = profileData.ltrLevel || userData.ltrLevel;
              unifiedSkillLevel = oldLtrLevel; // Use NTRP value as the unified skill level
            }
            if (!unifiedSkillLevel) {
              unifiedSkillLevel = '3.0-3.5'; // Default NTRP level
            }

            // 🎯 [KIM FIX v26] 온보딩 완료 판단 로직 강화
            // - isOnboardingComplete가 명시적으로 true이면 → 완료
            // - isOnboardingComplete가 명시적으로 false이면 → 미완료 (강제 온보딩)
            // - isOnboardingComplete가 undefined이면 → 레거시 사용자, smart detection 사용
            // 🎯 [KIM FIX] displayName 우선순위: displayName > nickname (통일된 네이밍)
            const hasNickname = !!(
              profileData.displayName ||
              userData.displayName ||
              profileData.nickname // 🔙 fallback for legacy data
            );
            const hasBasicProfile = !!(profileData.skillLevel || userData.skillLevel);

            // 🚨 온보딩 완료 판단 - 명시적 false 체크 추가
            let smartOnboardingComplete: boolean;
            if (userData.isOnboardingComplete === true) {
              // 명시적으로 true인 경우 → 완료
              smartOnboardingComplete = true;
            } else if (userData.isOnboardingComplete === false) {
              // 🔥 명시적으로 false인 경우 → 미완료 (온보딩 중단된 사용자)
              // 이 사용자들은 다시 로그인 시 온보딩을 완료해야 함
              console.log(
                '🚨 [AuthContext] User has explicit isOnboardingComplete: false - forcing onboarding'
              );
              smartOnboardingComplete = false;
            } else {
              // undefined인 경우 → 레거시 사용자, displayName과 skillLevel이 있으면 완료로 간주
              smartOnboardingComplete = hasNickname && hasBasicProfile;
            }

            // 🎯 LEDGER SYNC: Deep merge stats to preserve match statistics
            const mergedStats = userData.stats || profileData.stats || currentUser?.stats || null;

            // 🎥 CCTV: LEDGER SYNC Diagnostic - Track stats preservation
            cctvLog('AuthContext', 'LEDGER_SYNC_STATS', 'Stats synchronization analysis', {
              firebaseStats: userData.stats,
              profileStats: profileData.stats,
              currentStats: currentUser?.stats,
              mergedStats: mergedStats,
              hasMatchesPlayed: mergedStats?.matchesPlayed || mergedStats?.totalMatches || 0,
              currentLanguage,
            });

            // 🚨 EMERGENCY DIAGNOSTIC LOG 4: Ledger Sync Stats Analysis
            // console.log(`🎯 [LEDGER SYNC CCTV] (Language: ${currentLanguage}) Stats Analysis:`);
            console.log(
              `🎯 [LEDGER SYNC] Firebase userData.stats:`,
              JSON.stringify(userData.stats, null, 2)
            );
            console.log(
              `🎯 [LEDGER SYNC] Profile profileData.stats:`,
              JSON.stringify(profileData.stats, null, 2)
            );
            console.log(
              `🎯 [LEDGER SYNC] Current currentUser?.stats:`,
              JSON.stringify(currentUser?.stats, null, 2)
            );
            console.log(
              `🎯 [LEDGER SYNC] Final mergedStats:`,
              JSON.stringify(mergedStats, null, 2)
            );
            console.log(
              `🎯 [LEDGER SYNC] Match count:`,
              mergedStats?.matchesPlayed || mergedStats?.totalMatches || 0
            );

            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              // 🎯 [KIM FIX] displayName 우선순위: displayName > nickname (통일된 네이밍)
              displayName:
                profileData.displayName ||
                userData.displayName ||
                profileData.nickname || // 🔙 fallback for legacy data
                firebaseUser.displayName,
              photoURL: profileData.photoURL || userData.photoURL || firebaseUser.photoURL,
              skillLevel: unifiedSkillLevel, // Unified NTRP skill level
              ltrLevel: unifiedSkillLevel, // 호환성을 위해 skillLevel과 동일한 값 설정
              playingStyle: profileData.playingStyle || userData.playingStyle || 'all-court',
              maxTravelDistance: profileData.maxTravelDistance || userData.maxTravelDistance || 15,
              profile: {
                // 🎯 SINGLE SOURCE OF TRUTH: Only read from profile.location
                location: userData.profile?.location || null,
                // 🎯 [PHASE 4.5] Load gender for match type restrictions
                gender: userData.profile?.gender || profileData.gender || undefined,
              },
              languages: profileData.languages || userData.languages || ['English'],
              recentMatches: profileData.recentMatches || userData.recentMatches || [],
              goals: profileData.goals || userData.goals || null,
              isOnboardingComplete: smartOnboardingComplete,
              stats: mergedStats, // 🎯 LEDGER SYNC: Preserve match statistics
              eloRatings: userData.eloRatings, // 🎯 Include ELO ratings from Firestore
              // 🎯 [KIM FIX] Include createdAt for join date display
              createdAt: userData.createdAt,
              // 🎯 [KIM FIX] Activity Time Preferences - 선호 시간대 로드
              availabilityPreference:
                profileData.availabilityPreference ||
                userData.settings?.availabilityPreference ||
                'weekdays',
              preferredTimesWeekdays:
                profileData.preferredTimesWeekdays ||
                userData.settings?.preferredTimesWeekdays ||
                [],
              preferredTimesWeekends:
                profileData.preferredTimesWeekends ||
                userData.settings?.preferredTimesWeekends ||
                [],
            };

            // 🎥 CCTV: Data processing and state update
            cctvLog('AuthContext', 'DATA_PROCESSING', 'Processing user profile data', {
              oldLocationData: currentUser?.profile?.location,
              newLocationData: user.profile?.location,
              smartOnboardingComplete,
              hasBasicProfile,
              hasNickname,
            });

            // 🚨 CCTV 2: Command Center - State Update Detection
            console.log(
              `📡 [AuthContext CCTV] (Language: ${currentLanguage}) OLD currentUser.profile?.location:`,
              JSON.stringify(currentUser?.profile?.location)
            );
            console.log(
              `📡 [AuthContext CCTV] (Language: ${currentLanguage}) NEW user.profile?.location:`,
              JSON.stringify(user.profile?.location)
            );
            console.log(
              `📡 [AuthContext CCTV] (Language: ${currentLanguage}) Calling setCurrentUser with updated data...`
            );

            setCurrentUser(user);
            setIsOnboardingComplete(smartOnboardingComplete);

            // 🤖 AI 온보딩 상태 체크 (프로필 온보딩과 별개)
            // aiOnboardingCompletedAt 필드가 없거나 null이면 신규 사용자로 간주
            const hasCompletedAIOnboarding = !!userData.aiOnboardingCompletedAt;
            setIsNewUserForOnboarding(!hasCompletedAIOnboarding);
            console.log(
              `🤖 [AI Onboarding] User AI onboarding status: ${hasCompletedAIOnboarding ? 'completed' : 'new user'}`
            );

            // 🎥 CCTV: Critical profile loaded state transition
            cctvLog(
              'AuthContext',
              CCTV_PHASES.AUTH_PROFILE_LOADED,
              'Profile loaded successfully - setting isProfileLoaded to true',
              {
                userId: user.uid,
                hasLocation: !!user.profile?.location,
                locationData: user.profile?.location,
                isOnboardingComplete: smartOnboardingComplete,
                isNewUserForOnboarding: !hasCompletedAIOnboarding,
              }
            );

            // 🌐 [LANGUAGE SYNC] Load language preference from Firestore
            const savedLanguage = userData.preferences?.language;
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
              console.log(`🌐 [LANGUAGE SYNC] Loading language from Firestore: ${savedLanguage}`);
              await setLanguage(savedLanguage as 'en' | 'ko');
            }

            // React가 변경을 감지하도록 항상 새로운 객체를 생성하여 상태를 업데이트한다.
            console.log(`📡 [AuthContext] Real-time profile update! Location is now updated.`);
            setIsProfileLoaded(true);
          } else {
            // Create basic user profile
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              skillLevel: '3.0-3.5', // Default NTRP level
              ltrLevel: '3.0-3.5', // 호환성을 위해 skillLevel과 동일한 값 설정
              playingStyle: 'all-court',
              maxTravelDistance: 15,
              profile: {
                location: {
                  lat: 33.749,
                  lng: -84.388,
                  latitude: 33.749,
                  longitude: -84.388,
                  address: 'Atlanta, GA',
                  country: 'US',
                },
              },
              languages: ['English'],
              recentMatches: [],
              goals: null,
              isOnboardingComplete: false,
              // Note: Root-level location removed - use profile.location as primary source
            };

            // 🎥 CCTV: New user profile creation
            cctvLog('AuthContext', 'NEW_USER_PROFILE', 'Creating new user profile with defaults', {
              userId: newUser.uid,
              defaultLocation: newUser.profile?.location,
              isOnboardingComplete: false,
            });

            setCurrentUser(newUser);
            setIsOnboardingComplete(false);

            // 🎥 CCTV: Profile loaded state for new user
            cctvLog(
              'AuthContext',
              CCTV_PHASES.AUTH_PROFILE_LOADED,
              'New user profile loaded - setting isProfileLoaded to true',
              {
                userId: newUser.uid,
                hasDefaultLocation: !!newUser.profile?.location,
              }
            );

            // React가 변경을 감지하도록 항상 새로운 객체를 생성하여 상태를 업데이트한다.
            console.log(`📡 [AuthContext] Real-time profile update! New user created.`);
            setIsProfileLoaded(true);
          }
        },
        error => {
          // 🎥 CCTV: Error handling
          cctvLog(
            'AuthContext',
            CCTV_PHASES.ERROR,
            'Profile loading failed - setting fallback state',
            {
              error: error.message,
              errorCode: error.code,
              stack: error.stack,
            }
          );

          console.error('❌ Error listening to user profile:', error);
          // 프로필 로딩 실패 시 기본값 사용
          setIsProfileLoaded(true);
        }
      );

      // 프로필 리스너의 구독 취소 함수를 저장해두었다가 로그아웃 시 호출해야 한다.
      // 🔧 [FIX] useRef로 직접 할당 - closure 문제 해결
      profileUnsubscribeRef.current = unsubscribeProfile;
    } catch (error) {
      console.error('❌ Error setting up real-time profile listener:', error);
      throw error;
    }
  };

  // Initialize and check for existing Firebase user session
  useEffect(() => {
    // 🎥 CCTV: AuthContext initialization effect
    cctvLog('AuthContext', CCTV_PHASES.AUTH_START, 'AuthContext useEffect triggered', {
      isFirebaseAvailable,
      hasAuth: !!auth,
    });

    if (isFirebaseAvailable && auth) {
      // Check for existing Firebase user session
      const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
        // 🎥 CCTV: Authentication state change
        cctvLog('AuthContext', 'AUTH_STATE_CHANGE', 'Firebase auth state changed', {
          hasUser: !!firebaseUser,
          userId: firebaseUser?.uid,
          userEmail: firebaseUser?.email,
        });

        setLoading(true); // 👈 항상 로딩 시작

        if (firebaseUser) {
          // 🎥 CCTV: User login detected
          cctvLog('AuthContext', 'USER_LOGIN', 'User authenticated - starting profile load', {
            userId: firebaseUser.uid,
            email: firebaseUser.email,
          });

          // 📧 [KIM FIX] Check Firestore profile to distinguish new/existing users
          // - Profile EXISTS → Existing user → Skip verification
          // - Profile NOT EXISTS → New user → Require email verification
          // - BUT: Skip this check entirely if signup is in progress!
          const isEmailPasswordUser = firebaseUser.providerData.some(
            provider => provider.providerId === 'password'
          );

          if (isEmailPasswordUser && !firebaseUser.emailVerified) {
            // 📧 CRITICAL: Skip verification check if signup is in progress
            // This prevents onAuthStateChanged from interfering with the signup flow
            if (isSigningUpRef.current) {
              console.log(
                '📧 [onAuthStateChanged] Signup in progress - skipping verification check'
              );
              // Don't do anything, let signUpWithEmail handle the flow
              setLoading(false);
              return;
            }

            // Check if user has Firestore profile (existing user)
            const { doc, getDoc } = await import('firebase/firestore');
            const { signOut: firebaseSignOut } = await import('firebase/auth');
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            const hasProfile = userDoc.exists();

            console.log(
              '📧 [onAuthStateChanged] Email not verified. Profile check:',
              hasProfile ? 'EXISTS (existing user - allow)' : 'NOT EXISTS (new user - block)'
            );

            if (!hasProfile) {
              // 🚨 NEW user without verification → Sign out and set block reason for UI
              console.log('📧 [onAuthStateChanged] NEW user not verified - signing out');
              console.log(
                '📧 [onAuthStateChanged] Setting auth block reason: email_verification_required'
              );

              // 🚫 Set block state BEFORE signing out so UI can show appropriate message
              setAuthBlockReason('email_verification_required');
              setBlockedEmail(firebaseUser.email);

              await firebaseSignOut(auth);
              setLoading(false);
              return; // Exit early - user must verify email
            }

            // ✅ EXISTING user (has profile) → Allow login without verification
            console.log('📧 [onAuthStateChanged] Existing user - skipping verification');
          }

          // 💥 여기가 바로 최종 해결책! 💥
          // 1. 프로필이 아직 로드되지 않았다고 명확히 설정!
          setIsProfileLoaded(false);

          // 2. 프로필 로딩 함수를 호출하고, '완료'될 때까지 기다린다.
          try {
            await loadUserProfile(firebaseUser);
            // ✅ setIsProfileLoaded(true)는 onSnapshot 리스너 내부에서 호출됨

            // 3. 관리자 권한 확인 (Custom Claims)
            await checkAdminClaim(firebaseUser);

            // 4. Register push token after successful profile load
            registerPushToken(firebaseUser.uid).catch(error => {
              console.warn('Push token registration failed, but continuing:', error);
            });
          } catch (error) {
            console.error('❌ Error loading user profile:', error);
            // Fallback to basic user data WITHOUT using firebaseUser.displayName
            // This prevents email-based fallbacks like "goodseed1"
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: null, // Don't use firebaseUser.displayName to prevent email fallback
              photoURL: firebaseUser.photoURL,
              skillLevel: '3.0-3.5', // Default NTRP level
              ltrLevel: '3.0-3.5', // 호환성을 위해 skillLevel과 동일한 값 설정
              playingStyle: 'all-court',
              maxTravelDistance: 15,
              profile: {
                location: {
                  lat: 33.749,
                  lng: -84.388,
                  latitude: 33.749,
                  longitude: -84.388,
                  address: 'Atlanta, GA',
                  country: 'US',
                },
              },
              languages: ['English'],
              recentMatches: [],
              goals: null,
              isOnboardingComplete: false,
              // Note: Root-level location removed - use profile.location as primary source
            });
            setIsOnboardingComplete(false);
            // ✅ 에러 발생 시에도 프로필 로딩이 완료되었다고 표시 (fallback 데이터 사용)
            setIsProfileLoaded(true);
          }

          // 3. Auth 로딩이 끝났다고 보고한다.
          setLoading(false);
        } else {
          // 🔧 [FIX] 로그아웃 시 프로필 리스너 정리 - useRef.current로 항상 최신 값 참조
          if (profileUnsubscribeRef.current) {
            console.log('✅ 로그아웃: Firestore 프로필 리스너 정리');
            profileUnsubscribeRef.current();
            profileUnsubscribeRef.current = null;
          }

          setCurrentUser(null);
          setIsProfileLoaded(false); // 로그아웃 시에도 false로 초기화
          setIsAdmin(false); // 🔒 로그아웃 시 관리자 권한 초기화
          setLoading(false);
        }
      });

      return () => {
        unsubscribe();
        // useEffect 정리 시에도 프로필 리스너 정리
        if (profileUnsubscribeRef.current) {
          profileUnsubscribeRef.current();
          profileUnsubscribeRef.current = null;
        }
      };
    } else {
      // Mock mode - no user logged in
      setTimeout(() => {
        setCurrentUser(null);
        setIsOnboardingComplete(false);
        setIsProfileLoaded(false); // Mock 모드에서도 초기화
        setLoading(false);
      }, 1000);
    }
    // Adding loadUserProfile to dependencies would cause unnecessary re-runs
    // since it's stable and doesn't change between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string) => {
    setLoading(true);
    try {
      // Mock sign in
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentUser({
        uid: 'demo-user-123',
        email,
        displayName: 'Demo User',
        photoURL: null,
        skillLevel: '3.0-3.5', // 데모 사용자의 NTRP 등급
        ltrLevel: '3.0-3.5', // 호환성을 위해 skillLevel과 동일한 값 설정
        playingStyle: 'all-court',
        maxTravelDistance: 15, // 기본 15마일
        profile: {
          location: {
            lat: 33.749,
            lng: -84.388,
            latitude: 33.749,
            longitude: -84.388,
            address: 'Atlanta, GA',
            country: 'US',
          },
        },
        languages: ['English', '한국어'],
        recentMatches: [],
        goals: null,
        isOnboardingComplete: false,
        // Note: Root-level location removed - use profile.location as primary source
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (isFirebaseAvailable && auth) {
        // Use Firebase Auth
        const { signInWithEmailAndPassword, signOut: firebaseSignOut } =
          await import('firebase/auth');
        const { doc, getDoc } = await import('firebase/firestore');

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // 📧 [KIM FIX] Check Firestore profile to distinguish new/existing users
        // - Profile EXISTS → Existing user → Skip verification (registered before this feature)
        // - Profile NOT EXISTS → New user → Require email verification
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const hasProfile = userDoc.exists();

        console.log(
          '📧 [signInWithEmail] User profile check:',
          hasProfile ? 'EXISTS (existing user)' : 'NOT EXISTS (new user)',
          '| emailVerified:',
          firebaseUser.emailVerified
        );

        // 🍎 [APP STORE REVIEW] Test accounts that bypass email verification
        // TODO: Remove after App Store review approval
        const APP_STORE_TEST_EMAILS = [
          'test1@g.com', // James Davis
          'test3@g.com', // Eva White
          'test8@g.com', // Grace Johnson
          'test9@g.com', // James Wilson
        ];
        const isTestAccount = APP_STORE_TEST_EMAILS.includes(email.toLowerCase());

        if (!hasProfile && !firebaseUser.emailVerified && !isTestAccount) {
          // 🚨 NEW user without verification → Block login, require verification
          console.log(
            '📧 [signInWithEmail] NEW user not verified - blocking login, requiring verification'
          );
          await firebaseSignOut(auth);
          return {
            success: false,
            emailVerificationRequired: true,
            email: email,
            error: i18n.t('contexts.auth.emailVerificationRequired'),
          };
        }

        if (isTestAccount) {
          console.log('🍎 [signInWithEmail] App Store test account - bypassing email verification');
        }

        // ✅ EXISTING user (has profile) OR verified user → Allow login
        if (!firebaseUser.emailVerified) {
          console.log(
            '📧 [signInWithEmail] Existing user (has profile) - skipping verification check'
          );
        }

        // Immediately load user profile to avoid race conditions with onAuthStateChanged
        try {
          await loadUserProfile(firebaseUser);
        } catch (error) {
          console.error('Error loading profile after sign in:', error);
        }

        return { success: true, user: undefined }; // User state is already set by loadUserProfile
      } else {
        // Mock authentication
        console.log('⚠️ Using mock email authentication');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user: User = {
          uid: `mock-${Date.now()}`,
          email,
          displayName: 'Mock User',
          photoURL: null,
          skillLevel: '3.0-3.5', // Default NTRP level
          ltrLevel: '3.0-3.5', // 호환성을 위해 skillLevel과 동일한 값 설정
          playingStyle: 'all-court',
          maxTravelDistance: 15,
          profile: {
            location: {
              lat: 33.749,
              lng: -84.388,
              latitude: 33.749,
              longitude: -84.388,
              address: 'Atlanta, GA',
              country: 'US',
            },
          },
          languages: ['English', '한국어'],
          recentMatches: [],
          goals: null,
          isOnboardingComplete: false,
        };

        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (error: unknown) {
      // 🔇 Use console.warn instead of console.error to avoid red toast in development
      // This is expected user error (wrong password), not a system error
      console.warn('⚠️ Email sign in failed:', error);

      // Firebase 에러 코드별 사용자 친화적 메시지 처리
      let userFriendlyMessage = 'Sign in failed';

      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'auth/invalid-credential':
            userFriendlyMessage = i18n.t('contexts.auth.invalidCredential');
            break;
          case 'auth/user-not-found':
            userFriendlyMessage = i18n.t('contexts.auth.userNotFound');
            break;
          case 'auth/wrong-password':
            userFriendlyMessage = i18n.t('contexts.auth.wrongPassword');
            break;
          case 'auth/invalid-email':
            userFriendlyMessage = i18n.t('contexts.auth.invalidEmail');
            break;
          case 'auth/too-many-requests':
            userFriendlyMessage = i18n.t('contexts.auth.tooManyRequests');
            break;
          default:
            userFriendlyMessage =
              (error && typeof error === 'object' && 'message' in error
                ? (error.message as string)
                : null) || 'Sign in failed';
        }
      }

      return {
        success: false,
        error: userFriendlyMessage,
        code:
          error && typeof error === 'object' && 'code' in error
            ? (error.code as string)
            : undefined,
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (isFirebaseAvailable && auth) {
        // Use Firebase Auth with detailed error logging
        const {
          createUserWithEmailAndPassword,
          sendEmailVerification,
          signOut: firebaseSignOut,
          fetchSignInMethodsForEmail,
        } = await import('firebase/auth');

        // 📧 [KIM FIX] Pre-check: If email already exists, skip verification and guide to login
        // This prevents showing verification screen for already registered emails
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);
          if (signInMethods && signInMethods.length > 0) {
            console.log('📧 Email already registered:', email, 'Methods:', signInMethods);
            return {
              success: false,
              error: i18n.t('contexts.auth.emailAlreadyInUse'),
              code: 'auth/email-already-in-use',
            };
          }
        } catch (checkError) {
          // If check fails, proceed with normal signup (Firebase will catch duplicate)
          console.warn('📧 Email existence check failed, proceeding with signup:', checkError);
        }

        // 📧 [KIM FIX] Set flag BEFORE creating user to prevent onAuthStateChanged interference
        isSigningUpRef.current = true;
        console.log('📧 [signUpWithEmail] Setting isSigningUpRef = true');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('📧 Firebase user created successfully:', userCredential.user.uid);

        // 📧 Send email verification link
        await sendEmailVerification(userCredential.user);
        console.log('📧 Verification email sent to:', email);

        // 📧 Sign out user - they must verify email before using app
        await firebaseSignOut(auth);
        console.log('📧 User signed out - awaiting email verification');

        // 📧 [KIM FIX] Reset flag AFTER all operations complete
        isSigningUpRef.current = false;
        console.log('📧 [signUpWithEmail] Setting isSigningUpRef = false (success)');

        // Return success with email verification required flag
        return {
          success: true,
          emailVerificationRequired: true,
          email: email,
        };
      } else {
        // Mock authentication
        console.log('⚠️ Using mock email sign up');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user: User = {
          uid: `mock-${Date.now()}`,
          email,
          displayName: 'New Mock User',
          photoURL: null,
          skillLevel: '1.0-2.5', // Beginner NTRP level
          ltrLevel: '1.0-2.5', // 호환성을 위해 skillLevel과 동일한 값 설정
          playingStyle: 'all-court',
          maxTravelDistance: 15,
          profile: {
            location: {
              lat: 33.749,
              lng: -84.388,
              latitude: 33.749,
              longitude: -84.388,
              address: 'Atlanta, GA',
              country: 'US',
            },
          },
          languages: ['English'],
          recentMatches: [],
          goals: null,
          isOnboardingComplete: false,
        };

        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (error: unknown) {
      // 📧 [KIM FIX] Reset flag on error
      isSigningUpRef.current = false;
      console.log('📧 [signUpWithEmail] Setting isSigningUpRef = false (error)');

      console.error('❌ Email sign up failed:', error);

      // Firebase 에러 코드별 사용자 친화적 메시지 처리
      let userFriendlyMessage = 'Sign up failed';

      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            userFriendlyMessage = i18n.t('contexts.auth.emailAlreadyInUse');
            break;
          case 'auth/weak-password':
            userFriendlyMessage = i18n.t('contexts.auth.weakPassword');
            break;
          case 'auth/invalid-email':
            userFriendlyMessage = i18n.t('contexts.auth.invalidEmail');
            break;
          case 'auth/api-key-not-valid':
            userFriendlyMessage =
              'API key configuration error. Please check Firebase Console settings.';
            break;
          case 'auth/invalid-api-key':
            userFriendlyMessage = 'Invalid API key. Please verify Firebase configuration.';
            break;
          case 'auth/app-not-authorized':
            userFriendlyMessage = 'App not authorized. Please check Bundle ID in Firebase Console.';
            break;
          default:
            userFriendlyMessage =
              (error && typeof error === 'object' && 'message' in error
                ? (error.message as string)
                : null) || 'Sign up failed';
        }
      }

      return {
        success: false,
        error: userFriendlyMessage,
        code:
          error && typeof error === 'object' && 'code' in error
            ? (error.code as string)
            : undefined,
      };
    }
  };

  /**
   * 📧 Resend Email Verification
   * Signs in user temporarily to resend verification email, then signs them out
   */
  const resendVerificationEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (isFirebaseAvailable && auth) {
        const {
          signInWithEmailAndPassword,
          sendEmailVerification,
          signOut: firebaseSignOut,
        } = await import('firebase/auth');

        // Sign in to get the user object
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (firebaseUser.emailVerified) {
          // Already verified - let them proceed
          return {
            success: true,
            error: i18n.t('contexts.auth.emailAlreadyVerified'),
          };
        }

        // Resend verification email
        await sendEmailVerification(firebaseUser);
        console.log('📧 Verification email resent to:', email);

        // Sign out again
        await firebaseSignOut(auth);

        return {
          success: true,
          emailVerificationRequired: true,
          email: email,
        };
      } else {
        // Mock
        return { success: true, emailVerificationRequired: true, email };
      }
    } catch (error: unknown) {
      console.error('❌ Resend verification email failed:', error);

      let userFriendlyMessage = i18n.t('contexts.auth.resendVerificationFailed');

      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'auth/invalid-credential':
            userFriendlyMessage = i18n.t('contexts.auth.invalidCredential');
            break;
          case 'auth/too-many-requests':
            userFriendlyMessage = i18n.t('contexts.auth.tooManyRequests');
            break;
          default:
            userFriendlyMessage = i18n.t('contexts.auth.resendVerificationFailed');
        }
      }

      return {
        success: false,
        error: userFriendlyMessage,
        code:
          error && typeof error === 'object' && 'code' in error
            ? (error.code as string)
            : undefined,
      };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      console.log('🚪 AuthContext: Starting sign out process...');

      // 🎯 [KIM FIX] profileUnsubscribeRef is now handled ONLY in onAuthStateChanged
      // to avoid race condition where it gets called twice
      // 🔧 [FIX] useRef로 변경하여 closure 문제 해결 (2025-12-16)

      // 1. Sign out from Firebase (this will trigger onAuthStateChanged which cleans up listener)
      if (isFirebaseAvailable && auth) {
        const { signOut: firebaseSignOut } = await import('firebase/auth');
        await firebaseSignOut(auth);
        console.log('✅ Signed out from Firebase');
      }

      // 2. Sign out from Google Sign-In SDK
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
        console.log('✅ Signed out from Google');
      } catch {
        // Google sign out might fail if not signed in with Google
        console.log('ℹ️ Google sign out skipped (may not be signed in with Google)');
      }

      // 3. Clear local state (onAuthStateChanged will also do this, but we do it here for immediate UI update)
      setCurrentUser(null);
      setIsOnboardingComplete(false);
      setIsProfileLoaded(false);
      setIsAdmin(false);
      setIsNewUserForOnboarding(false);

      console.log('✅ AuthContext: Sign out completed successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Still clear local state even if sign out fails
      setCurrentUser(null);
      setIsProfileLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    console.log('🟢 [AuthContext] updateUserProfile called');
    console.log('🟢 [AuthContext] updates.playingStyle:', updates.playingStyle);
    if (!currentUser) {
      throw new Error('No current user to update');
    }

    try {
      // Update local state immediately for responsive UI
      const updatedUser = { ...currentUser, ...updates };

      // ✅ skillLevel과 ltrLevel 동기화 (둘 중 하나가 변경되면 둘 다 같은 값으로 설정)
      if (updates.skillLevel && !updates.ltrLevel) {
        updatedUser.ltrLevel = updates.skillLevel;
      } else if (updates.ltrLevel && !updates.skillLevel) {
        updatedUser.skillLevel = updates.ltrLevel;
      }

      setCurrentUser(updatedUser);

      // Save to Firestore with nested profile structure
      if (isFirebaseAvailable && db) {
        const { doc, setDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Create nested profile structure for Firestore
        // 🏛️ TEAM-FIRST 2.0: Convert skillLevel to NEW structure if present
        const skillLevelForFirestore = handleSkillLevelForFirestore(updatedUser.skillLevel);

        const firestoreData = {
          uid: updatedUser.uid,
          email: updatedUser.email,
          // 🎯 [KIM FIX] Also update root-level displayName for consistency
          displayName: updatedUser.displayName,
          // 🎯 [2026-01-12] Also update root-level photoURL for consistency
          // This ensures searchUsers() and getAllUsers() can find the photo
          photoURL: updatedUser.photoURL,
          profile: {
            // 🎯 [KIM FIX] Use displayName only (unified naming convention)
            // nickname is deprecated - use displayName everywhere
            displayName: updatedUser.displayName,
            photoURL: updatedUser.photoURL,
            // 🏛️ TEAM-FIRST 2.0: Save skillLevel in NEW structure
            ...(skillLevelForFirestore && { skillLevel: skillLevelForFirestore }),
            playingStyle: updatedUser.playingStyle,
            maxTravelDistance: updatedUser.maxTravelDistance,
            location: updatedUser.profile.location,
            languages: updatedUser.languages,
            recentMatches: updatedUser.recentMatches,
            goals: updatedUser.goals,
            // 🎯 [KIM FIX] Activity Time Preferences - 선호 시간대 저장
            availabilityPreference: updatedUser.availabilityPreference,
            preferredTimesWeekdays: updatedUser.preferredTimesWeekdays,
            preferredTimesWeekends: updatedUser.preferredTimesWeekends,
          },
          updatedAt: new Date(),
        };

        // 🛡️ PLAN B: Apply final data sanitization before Firestore operation
        console.log('🛡️ [AuthContext] Applying final data sanitization before setDoc...');
        console.log(
          '🟢 [AuthContext] firestoreData.profile.playingStyle:',
          firestoreData.profile.playingStyle
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitizedData = sanitizeUserProfileData(firestoreData) as any;
        console.log('✅ [AuthContext] Data sanitization completed, proceeding with setDoc');
        console.log(
          '🟢 [AuthContext] sanitizedData.profile.playingStyle:',
          sanitizedData?.profile?.playingStyle
        );

        await setDoc(userDocRef, sanitizedData, { merge: true });
        console.log('✅ [AuthContext] setDoc completed successfully');

        // 🎯 [2026-01-12] Sync photoURL to all conversations where user participates
        // This ensures Messages screen shows updated profile photos
        if (updates.photoURL !== undefined) {
          console.log('📸 [AuthContext] photoURL changed, syncing to conversations...');
          try {
            const { collection, query, where, getDocs, updateDoc } =
              await import('firebase/firestore');
            const conversationsRef = collection(db, 'conversations');
            const userConversationsQuery = query(
              conversationsRef,
              where('participants', 'array-contains', currentUser.uid)
            );
            const snapshot = await getDocs(userConversationsQuery);

            const updatePromises = snapshot.docs.map(async conversationDoc => {
              const convRef = conversationDoc.ref;
              // Update participantPhotos map with new photoURL
              await updateDoc(convRef, {
                [`participantPhotos.${currentUser.uid}`]: updates.photoURL || null,
              });
            });

            await Promise.all(updatePromises);
            console.log(
              `✅ [AuthContext] Synced photoURL to ${snapshot.docs.length} conversations`
            );
          } catch (syncError) {
            // Don't fail profile update if sync fails - just log it
            console.warn('⚠️ [AuthContext] Failed to sync photoURL to conversations:', syncError);
          }
        }
      } else {
        console.warn('⚠️ Firebase not available, profile updated locally only');
      }
    } catch (error) {
      console.error('❌ Error updating user profile:', error);

      // Revert local state on Firestore error
      setCurrentUser(currentUser);

      // Re-throw error so EditProfileScreen can handle it
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  const markOnboardingComplete = async (profileData?: Record<string, unknown>) => {
    // 🎥 CCTV: Operation Recall - Memory preservation logging
    cctvLog(
      'AuthContext',
      'OPERATION_RECALL_START',
      'markOnboardingComplete called - preserving memories',
      {
        currentUser: currentUser ? `${currentUser.email} (${currentUser.uid})` : 'null',
        profileDataReceived: !!profileData,
        profileDataKeys: profileData ? Object.keys(profileData) : [],
        criticalFields: {
          hasLocation: !!profileData?.location,
          hasDistanceUnit: !!profileData?.distanceUnit,
          hasCurrencyUnit: !!profileData?.currencyUnit,
          hasMaxTravelDistance: !!profileData?.maxTravelDistance,
        },
      }
    );

    console.log('🏁 AuthContext: markOnboardingComplete called');
    console.log(
      '   - currentUser:',
      currentUser ? `${currentUser.email} (${currentUser.uid})` : 'null'
    );
    console.log('🧠 OPERATION RECALL: Received profile data to preserve:', profileData);

    // 🔍 ENHANCED DEBUGGING: Check each condition individually
    if (!isFirebaseAvailable) {
      console.error('💥 CRITICAL: Firebase not available during onboarding completion!');
      console.error('   - This explains why isOnboardingComplete stays false in Firestore');
      console.error('   - Need to ensure Firebase initializes before onboarding');
    }

    if (!db) {
      console.error('💥 CRITICAL: Firestore database not available during onboarding completion!');
      console.error('   - Database connection failed or not initialized');
    }

    if (!currentUser) {
      console.error('💥 CRITICAL: No currentUser during onboarding completion!');
      console.error('   - User might have been logged out during onboarding');
    }

    const conditionsCheck = isFirebaseAvailable && db && currentUser;
    console.log('🔍 AuthContext: Firestore write conditions check:', conditionsCheck);
    console.log('   - Will attempt Firestore write:', conditionsCheck ? 'YES ✅' : 'NO ❌');

    setIsOnboardingComplete(true);
    console.log('✅ AuthContext: Local state isOnboardingComplete set to true');

    // Save onboarding completion to Firestore
    if (isFirebaseAvailable && db && currentUser) {
      console.log('🔥 AuthContext: ✅ ALL CONDITIONS MET - Starting Firestore write operation...');
      console.log('   - User ID:', currentUser.uid);
      console.log('   - User email:', currentUser.email);
      try {
        console.log('🔧 AuthContext: Importing Firebase functions...');
        const { doc, setDoc } = await import('firebase/firestore');
        console.log('✅ AuthContext: Firebase functions imported successfully');
        const userDocRef = doc(db, 'users', currentUser.uid);
        console.log(
          '📄 AuthContext: Firestore document reference created for user:',
          currentUser.uid
        );

        // 🧠 OPERATION RECALL: Comprehensive data preservation strategy
        // Merge profile data from onboarding with current user data
        const mergedUserData = profileData ? { ...currentUser, ...profileData } : currentUser;

        // 🎥 CCTV: Data merger analysis
        cctvLog('AuthContext', 'DATA_MERGER', 'Merging onboarding data with current user', {
          originalUser: {
            displayName: currentUser.displayName,
            profileLocation: currentUser.profile?.location,
            skillLevel: currentUser.skillLevel,
          },
          incomingProfile: {
            nickname: profileData?.nickname,
            location: profileData?.location,
            distanceUnit: profileData?.distanceUnit,
            skillLevel: profileData?.skillLevel,
          },
          mergedResult: {
            displayName: mergedUserData.displayName,
            location: mergedUserData.location,
            distanceUnit: mergedUserData.distanceUnit,
          },
        });

        console.log('🧠 OPERATION RECALL: Merged user data prepared:', {
          uid: mergedUserData.uid,
          email: mergedUserData.email,
          displayName: mergedUserData.displayName || mergedUserData.nickname,
          skillLevel: mergedUserData.skillLevel,
          location: mergedUserData.location,
          distanceUnit: mergedUserData.distanceUnit,
          currencyUnit: mergedUserData.currencyUnit,
        });

        // 🧠 OPERATION RECALL: Create comprehensive Firestore structure that preserves ALL memories
        // 🛡️ Initialize ELO from LPR level
        const { getInitialEloFromLtr } = await import('../utils/ltrUtils');
        let initialElo = 1200; // Default
        if (profileData?.skillLevel && typeof profileData.skillLevel === 'number') {
          initialElo = getInitialEloFromLtr(profileData.skillLevel);
          console.log(`🎾 Initialized ELO from LPR ${profileData.skillLevel}: ${initialElo}`);
        }

        const firestoreData = {
          isOnboardingComplete: true,
          onboardingCompletedAt: new Date(),
          uid: mergedUserData.uid,
          email: mergedUserData.email,

          // Top-level user data for easier access
          displayName: mergedUserData.displayName || mergedUserData.nickname,

          // 🛡️ CAPTAIN AMERICA: Add root-level skillLevel and ltrLevel for compatibility
          ...(profileData?.skillLevel
            ? {
                skillLevel: profileData.skillLevel,
                ltrLevel:
                  typeof profileData.skillLevel === 'number'
                    ? profileData.skillLevel.toFixed(1)
                    : profileData.skillLevel,
              }
            : {}),

          // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
          // publicStats.elo는 더 이상 저장하지 않음 - 통계 데이터만 저장
          eloRatings: {
            singles: { initial: initialElo, current: initialElo, peak: initialElo, history: [] },
            doubles: { initial: initialElo, current: initialElo, peak: initialElo, history: [] },
            mixed: { initial: initialElo, current: initialElo, peak: initialElo, history: [] },
          },
          // 🎯 [KIM FIX] Set unifiedEloRating for new user ranking display
          'stats.unifiedEloRating': initialElo,

          // 🧠 CRITICAL: Preserve user settings at top level for DiscoveryContext
          settings: {
            distanceUnit: mergedUserData.distanceUnit || 'miles',
            currencyUnit: mergedUserData.currencyUnit || 'USD',
            notificationDistance:
              mergedUserData.notificationDistance || mergedUserData.maxTravelDistance || 15,
            availabilityPreference: mergedUserData.availabilityPreference || 'weekdays',
            preferredTimesWeekdays: mergedUserData.preferredTimesWeekdays || [],
            preferredTimesWeekends: mergedUserData.preferredTimesWeekends || [],
          },

          // 🧠 CRITICAL: Comprehensive profile structure preserving ALL onboarding data
          profile: {
            nickname: mergedUserData.displayName || mergedUserData.nickname,
            displayName: mergedUserData.displayName || mergedUserData.nickname,
            photoURL: mergedUserData.photoURL,
            gender: mergedUserData.gender || 'male', // 🆕 기본값: male (성별 필수)
            skillLevel: mergedUserData.skillLevel || '3.0-3.5',
            playingStyle:
              mergedUserData.playingStyle ||
              (Array.isArray(mergedUserData.preferredPlayingStyle)
                ? mergedUserData.preferredPlayingStyle.join(',')
                : 'all-court'),
            maxTravelDistance: mergedUserData.maxTravelDistance || 15,

            // 🧠 CRITICAL: Ensure location is preserved correctly
            location: mergedUserData.location ||
              mergedUserData.profile?.location || {
                lat: 33.749,
                lng: -84.388,
                latitude: 33.749,
                longitude: -84.388,
                address: 'Atlanta, GA',
                country: 'US',
              },

            languages: mergedUserData.languages ||
              mergedUserData.communicationLanguages || ['English'],
            recentMatches: mergedUserData.recentMatches || [],
            goals: mergedUserData.goals || null,

            // 🧠 Additional profile fields from onboarding
            locationPermissionGranted: mergedUserData.locationPermissionGranted || false,
            notificationPermissionGranted: mergedUserData.notificationPermissionGranted || false,
          },

          updatedAt: new Date(),
        };

        // 🎥 CCTV: Pre-save data verification
        cctvLog(
          'AuthContext',
          'PRE_SAVE_VERIFICATION',
          'Verifying complete data before Firestore write',
          {
            hasLocation: !!firestoreData.profile.location,
            locationData: firestoreData.profile.location,
            hasDistanceUnit: !!firestoreData.settings.distanceUnit,
            distanceUnit: firestoreData.settings.distanceUnit,
            hasCurrencyUnit: !!firestoreData.settings.currencyUnit,
            currencyUnit: firestoreData.settings.currencyUnit,
            hasDisplayName: !!firestoreData.displayName,
            displayName: firestoreData.displayName,
          }
        );

        console.log('💾 AuthContext: About to write COMPLETE profile data to Firestore:', {
          isOnboardingComplete: firestoreData.isOnboardingComplete,
          uid: firestoreData.uid,
          email: firestoreData.email,
          displayName: firestoreData.displayName,
          location: firestoreData.profile.location,
          distanceUnit: firestoreData.settings.distanceUnit,
          currencyUnit: firestoreData.settings.currencyUnit,
        });

        // 🛡️ PLAN B: Apply final data sanitization for onboarding data too
        console.log('🛡️ [AuthContext] Applying data sanitization for onboarding completion...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitizedOnboardingData = sanitizeUserProfileData(firestoreData) as any;
        console.log('✅ [AuthContext] Onboarding data sanitization completed');

        console.log('🚀 AuthContext: EXECUTING setDoc() call now...');
        console.log('   - Document path: users/' + currentUser.uid);
        console.log('   - Merge option: true');
        console.log(
          '   - Key field being written: isOnboardingComplete =',
          sanitizedOnboardingData.isOnboardingComplete
        );

        await setDoc(userDocRef, sanitizedOnboardingData, { merge: true });

        // 🎥 CCTV: Successful save confirmation
        cctvLog(
          'AuthContext',
          'MEMORY_SAVED',
          'Complete profile data successfully saved to Firestore',
          {
            userId: currentUser.uid,
            memoryFields: {
              location: !!sanitizedOnboardingData.profile?.location,
              distanceUnit: !!sanitizedOnboardingData.settings?.distanceUnit,
              displayName: !!sanitizedOnboardingData.displayName,
            },
          }
        );

        console.log('✅ AuthContext: SUCCESS - Complete profile data written to Firestore');

        // Verify the write was successful by reading back the document
        const { getDoc } = await import('firebase/firestore');
        const verifyDoc = await getDoc(userDocRef);

        if (verifyDoc.exists()) {
          const verifyData = verifyDoc.data();
          console.log(
            '🔍 AuthContext: Verification read - isOnboardingComplete:',
            verifyData.isOnboardingComplete
          );
          console.log(
            '🔍 AuthContext: Verification read - profile.location:',
            verifyData.profile?.location
          );
          console.log(
            '🔍 AuthContext: Verification read - settings.distanceUnit:',
            verifyData.settings?.distanceUnit
          );

          // 🎥 CCTV: Memory verification
          cctvLog('AuthContext', 'MEMORY_VERIFICATION', 'Verifying saved memories', {
            onboardingComplete: verifyData.isOnboardingComplete === true,
            locationPreserved: !!verifyData.profile?.location,
            distanceUnitPreserved: !!verifyData.settings?.distanceUnit,
            displayNamePreserved: !!verifyData.displayName,
          });

          if (verifyData.isOnboardingComplete === true) {
            console.log(
              '✅ AuthContext: VERIFIED - Onboarding flag successfully written to Firestore'
            );
          } else {
            console.error(
              '❌ AuthContext: VERIFICATION FAILED - Flag not found in Firestore document'
            );
            console.error('   - Document data:', verifyData);
          }
        } else {
          console.error(
            '❌ AuthContext: VERIFICATION FAILED - Document does not exist after write'
          );
        }

        // Update local user state with merged data including preserved memories
        const finalUser = {
          ...mergedUserData,
          isOnboardingComplete: true,
          profile: {
            ...mergedUserData.profile,
            location: firestoreData.profile.location,
          },
        };

        console.log('🔄 AuthContext: Updating local user state with preserved memories:', {
          uid: finalUser.uid,
          email: finalUser.email,
          displayName: finalUser.displayName,
          isOnboardingComplete: finalUser.isOnboardingComplete,
          location: finalUser.profile?.location,
          distanceUnit: finalUser.distanceUnit,
        });

        setCurrentUser(finalUser);
        console.log('✅ AuthContext: Local state updated successfully with complete profile');

        // Force a fresh profile reload from Firestore to ensure data consistency
        console.log(
          '🔄 AuthContext: Force reloading profile from Firestore to ensure consistency...'
        );
        try {
          await loadUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          });

          // 🎥 CCTV: Profile reload completion
          cctvLog(
            'AuthContext',
            'MEMORY_RELOAD',
            'Profile successfully reloaded with preserved memories',
            {
              userId: currentUser.uid,
            }
          );

          console.log('✅ AuthContext: Profile successfully reloaded from Firestore');
        } catch (reloadError: unknown) {
          console.error('❌ AuthContext: Failed to reload profile after onboarding:', reloadError);
          console.warn('   - Using local state as fallback');

          // 🎥 CCTV: Reload failure
          cctvLog(
            'AuthContext',
            'MEMORY_RELOAD_FAILED',
            'Profile reload failed, using local state',
            {
              error: reloadError instanceof Error ? reloadError.message : String(reloadError),
            }
          );
        }
      } catch (error: unknown) {
        console.error('❌ AuthContext: CRITICAL ERROR during Firestore write:', error);
        console.error('   - Error type:', typeof error);
        console.error('   - Error message:', error instanceof Error ? error.message : error);
        console.error('   - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('   - User ID attempted:', currentUser.uid);

        // 🎥 CCTV: Save failure
        cctvLog(
          'AuthContext',
          CCTV_PHASES.ERROR,
          'CRITICAL: Memory preservation failed during Firestore write',
          {
            error: error instanceof Error ? error.message : String(error),
            errorCode:
              error && typeof error === 'object' && 'code' in error
                ? (error.code as string)
                : undefined,
            userId: currentUser.uid,
          }
        );

        // 에러가 발생해도 로컬 상태는 유지하지만 경고를 표시
        console.warn('⚠️ AuthContext: Onboarding completion saved locally but may not persist');
        console.warn('   - User will need to complete onboarding again if app restarts');
      }
    } else {
      console.error('❌ AuthContext: Cannot save onboarding completion to Firestore');
      console.error('   - isFirebaseAvailable:', isFirebaseAvailable);
      console.error('   - db available:', !!db);
      console.error('   - currentUser:', !!currentUser);
      console.warn('⚠️ AuthContext: Onboarding completion ONLY saved locally - will NOT persist!');
      console.warn('   - User will see onboarding again on app restart');

      // 🎥 CCTV: Conditions failure
      cctvLog(
        'AuthContext',
        CCTV_PHASES.ERROR,
        'Cannot save memories - Firebase conditions not met',
        {
          isFirebaseAvailable,
          hasDatabase: !!db,
          hasCurrentUser: !!currentUser,
        }
      );
    }

    // 🎥 CCTV: Operation completion
    cctvLog(
      'AuthContext',
      'OPERATION_RECALL_COMPLETE',
      'markOnboardingComplete function completed',
      {
        success: conditionsCheck,
        memoriesPreserved: !!(profileData?.location && profileData?.distanceUnit),
      }
    );

    console.log('🏁 AuthContext: markOnboardingComplete function completed');
  };

  // 🔄 Developer Tool: Force refresh user profile from Firestore
  const refreshUserProfile = async () => {
    console.log('🔄 [refreshUserProfile] Manual profile refresh requested');

    if (!currentUser) {
      console.error('❌ [refreshUserProfile] No current user to refresh');
      throw new Error('No user logged in');
    }

    if (!isFirebaseAvailable || !db) {
      console.error('❌ [refreshUserProfile] Firebase not available');
      throw new Error('Firebase not available');
    }

    try {
      console.log('🔄 [refreshUserProfile] Fetching latest data from Firestore...');
      const { doc, getDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('❌ [refreshUserProfile] User document does not exist');
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      console.log('✅ [refreshUserProfile] Fresh data retrieved from Firestore');

      // 🔍 DEBUG: Log raw Firestore data
      console.log('🔍 [refreshUserProfile] Raw Firestore userData:', {
        uid: userData.uid,
        ltrLevel: userData.ltrLevel,
        skillLevel: userData.skillLevel,
        'profile.ltrLevel': userData.profile?.ltrLevel,
        'profile.skillLevel': userData.profile?.skillLevel,
        eloRatings: userData.eloRatings,
        'eloRatings.singles': userData.eloRatings?.singles,
        'eloRatings.singles.current': userData.eloRatings?.singles?.current,
      });

      // Handle nested profile data structure (same logic as loadUserProfile)
      const profileData = userData.profile || userData;

      // Legacy data migration: convert old ltrLevel to new skillLevel format
      let unifiedSkillLevel = profileData.skillLevel || userData.skillLevel;
      if (!unifiedSkillLevel && (profileData.ltrLevel || userData.ltrLevel)) {
        const oldLtrLevel = profileData.ltrLevel || userData.ltrLevel;
        unifiedSkillLevel = oldLtrLevel;
      }
      if (!unifiedSkillLevel) {
        unifiedSkillLevel = '3.0-3.5';
      }

      // 🎯 [KIM FIX v26] 온보딩 완료 판단 로직 강화 (refreshUserProfile)
      // 🎯 [KIM FIX] displayName 우선순위: displayName > nickname (통일된 네이밍)
      const hasNickname = !!(
        profileData.displayName ||
        userData.displayName ||
        profileData.nickname // 🔙 fallback for legacy data
      );
      const hasBasicProfile = !!(profileData.skillLevel || userData.skillLevel);

      // 🚨 온보딩 완료 판단 - 명시적 false 체크 추가
      let smartOnboardingComplete: boolean;
      if (userData.isOnboardingComplete === true) {
        // 명시적으로 true인 경우 → 완료
        smartOnboardingComplete = true;
      } else if (userData.isOnboardingComplete === false) {
        // 🔥 명시적으로 false인 경우 → 미완료 (온보딩 중단된 사용자)
        console.log(
          '🚨 [refreshUserProfile] User has explicit isOnboardingComplete: false - forcing onboarding'
        );
        smartOnboardingComplete = false;
      } else {
        // undefined인 경우 → 레거시 사용자, displayName과 skillLevel이 있으면 완료로 간주
        smartOnboardingComplete = hasNickname && hasBasicProfile;
      }

      // 🎯 LEDGER SYNC: Deep merge stats to preserve match statistics
      const mergedStats = userData.stats || profileData.stats || currentUser?.stats || null;

      const refreshedUser: User = {
        uid: currentUser.uid,
        email: currentUser.email,
        // 🎯 [KIM FIX] displayName 우선순위: displayName > nickname (통일된 네이밍)
        displayName:
          profileData.displayName ||
          userData.displayName ||
          profileData.nickname || // 🔙 fallback for legacy data
          currentUser.displayName,
        photoURL: profileData.photoURL || userData.photoURL || currentUser.photoURL,
        skillLevel: unifiedSkillLevel,
        ltrLevel: unifiedSkillLevel,
        playingStyle: profileData.playingStyle || userData.playingStyle || 'all-court',
        maxTravelDistance: profileData.maxTravelDistance || userData.maxTravelDistance || 15,
        profile: {
          location: userData.profile?.location || null,
          // 🎯 [PHASE 4.5] Load gender for match type restrictions
          gender: userData.profile?.gender || profileData.gender || undefined,
        },
        languages: profileData.languages || userData.languages || ['English'],
        recentMatches: profileData.recentMatches || userData.recentMatches || [],
        goals: profileData.goals || userData.goals || null,
        isOnboardingComplete: smartOnboardingComplete,
        stats: mergedStats,
        eloRatings: userData.eloRatings || currentUser.eloRatings, // 🎯 Include ELO ratings
        // 🎯 [KIM FIX] Include createdAt for join date display
        createdAt: userData.createdAt,
      };

      // 🔍 DEBUG: Check if eloRatings is missing from refreshedUser
      console.log('🔍 [refreshUserProfile] CRITICAL CHECK:', {
        'userData.eloRatings exists': !!userData.eloRatings,
        'userData.eloRatings.singles': userData.eloRatings?.singles,
        'userData.eloRatings.singles.current': userData.eloRatings?.singles?.current,
        'refreshedUser has eloRatings property': 'eloRatings' in refreshedUser,
      });

      console.log('🔄 [refreshUserProfile] Updating local state with fresh data:', {
        uid: refreshedUser.uid,
        email: refreshedUser.email,
        displayName: refreshedUser.displayName,
        ltrLevel: refreshedUser.ltrLevel,
        skillLevel: refreshedUser.skillLevel,
        eloRatings: userData.eloRatings,
        location: refreshedUser.profile?.location,
        distanceUnit: userData.settings?.distanceUnit,
      });

      // Force React to detect changes by creating a new object
      setCurrentUser({ ...refreshedUser });
      setIsOnboardingComplete(smartOnboardingComplete);

      console.log('✅ [refreshUserProfile] Profile successfully refreshed from Firestore');
    } catch (error) {
      console.error('❌ [refreshUserProfile] Failed to refresh profile:', error);
      throw error;
    }
  };

  // 🤖 AI 온보딩 완료 마킹
  const markAIOnboardingComplete = async () => {
    console.log('🤖 [markAIOnboardingComplete] Marking AI onboarding as complete');

    if (!currentUser) {
      console.error('❌ [markAIOnboardingComplete] No current user');
      return;
    }

    if (!isFirebaseAvailable || !db) {
      console.error('❌ [markAIOnboardingComplete] Firebase not available');
      return;
    }

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', currentUser.uid);

      await setDoc(
        userDocRef,
        {
          aiOnboardingCompletedAt: new Date(),
        },
        { merge: true }
      );

      console.log('✅ [markAIOnboardingComplete] AI onboarding completion saved to Firestore');
      setIsNewUserForOnboarding(false);
    } catch (error) {
      console.error('❌ [markAIOnboardingComplete] Failed to save:', error);
    }
  };

  // 🚫 Clear auth block state (used after user sees the error screen)
  const clearAuthBlock = () => {
    console.log('🚫 [clearAuthBlock] Clearing auth block state');
    setAuthBlockReason(null);
    setBlockedEmail(null);
  };

  const value: AuthContextType = {
    currentUser,
    user: currentUser, // Alias for currentUser (for compatibility)
    loading,
    isProfileLoaded, // ✅ 새로운 상태 노출
    isAuthenticated: !!currentUser, // ✅ 명확한 인증 상태 제공
    isOnboardingComplete,
    isNewUserForOnboarding, // 🤖 AI 온보딩 상태
    isAdmin, // 🔒 관리자 권한 상태
    // 🚫 Auth block state
    authBlockReason,
    blockedEmail,
    clearAuthBlock,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    resendVerificationEmail, // 📧 이메일 인증 재전송
    signOut,
    updateUserProfile,
    markOnboardingComplete,
    markAIOnboardingComplete, // 🤖 AI 온보딩 완료 마킹
    refreshUserProfile, // 🔄 Developer Tool: Manual profile refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
