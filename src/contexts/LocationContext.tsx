import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { LocationProfile } from '../types';
import { cctvLog, CCTV_PHASES } from '../utils/cctvLogger';

// Legacy interface - kept for reference in migration logic
// interface UserLocation {
//   latitude: number;
//   longitude: number;
//   accuracy: number;
//   timestamp: number;
// }

interface LocationContextType {
  location: LocationProfile | null;
  isLoading: boolean;
  error: string | null;
  requestLocationPermission: (showAlert?: boolean) => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationProfile | null>;
  watchLocation: () => void;
  stopWatchingLocation: () => void;
  isLocationEnabled: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  // 🛰️ AUTH-AWARE: Monitor user login state
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [location, setLocation] = useState<LocationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // 🔄 AppState tracking for auto-refresh when returning from Settings
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const wasPermissionDenied = useRef<boolean>(false);

  // 🎥 CCTV: LocationContext initialization
  cctvLog('LocationContext', CCTV_PHASES.INIT, 'LocationProvider initialized', {
    hasCurrentUser: !!currentUser,
    userId: currentUser?.uid,
    initialLocation: !!location,
    isLoading,
    isLocationEnabled,
  });

  // 🛰️ AUTH-AWARE LOCATION FETCHING: React to user login/logout
  useEffect(() => {
    const handleUserStateChange = async () => {
      // 🎥 CCTV: User state change detection
      cctvLog('LocationContext', 'USER_STATE_CHANGE', 'User authentication state changed', {
        hasCurrentUser: !!currentUser,
        userId: currentUser?.uid,
        timestamp: new Date().toISOString(),
      });

      if (currentUser) {
        // 🎥 CCTV: User login processing
        cctvLog(
          'LocationContext',
          'USER_LOGIN_PROCESSING',
          'User logged in - starting location setup',
          {
            userId: currentUser.uid,
            currentLocation: !!location,
          }
        );

        // ✅ User is logged in: Fetch device location for better UX
        // console.log('🛰️ [LocationContext] User logged in. Fetching device location for profile...');
        // console.log('🛰️ [LocationContext] User ID:', currentUser.uid);

        // Check cached location first (for faster response)
        cctvLog('LocationContext', 'CACHE_CHECK', 'Loading cached location');
        await loadCachedLocation();

        // Check location permission and get fresh location
        cctvLog('LocationContext', CCTV_PHASES.LOCATION_PERMISSION, 'Checking location permission');
        await checkLocationPermission();

        // If permission is granted, try to get current location
        // 🎯 [KIM FIX v14] 앱 자동 호출이므로 showAlert: false → Settings Alert 표시 안 함
        const hasPermission = await requestLocationPermission(false);
        if (hasPermission) {
          cctvLog(
            'LocationContext',
            CCTV_PHASES.LOCATION_ACQUIRED,
            'Permission granted - getting current location'
          );
          await getCurrentLocation();
        } else {
          cctvLog('LocationContext', CCTV_PHASES.ERROR, 'Location permission denied');
        }

        cctvLog(
          'LocationContext',
          'SETUP_COMPLETE',
          'Location setup completed for logged-in user',
          {
            userId: currentUser.uid,
            hasLocation: !!location,
            hasPermission,
          }
        );
        console.log('✅ [LocationContext] Location setup completed for logged-in user');
      } else {
        // 🎥 CCTV: User logout processing
        cctvLog('LocationContext', 'USER_LOGOUT', 'User logged out - clearing location data');

        // ❌ User logged out: Clear location data for privacy
        console.log('🔒 [LocationContext] User logged out. Clearing location data...');
        setLocation(null);
        setError(null);
        stopWatchingLocation();

        cctvLog('LocationContext', 'CLEANUP_COMPLETE', 'Location data cleared for privacy');
        console.log('✅ [LocationContext] Location data cleared for privacy');
      }
    };

    handleUserStateChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Only run when user logs in/out - NOT when location changes (would cause infinite loop)

  // 🔄 AUTO-REFRESH: Listen for app returning from Settings
  // When user changes location permission in iOS Settings and returns to app,
  // automatically check permission and fetch location if granted
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App came to foreground from background/inactive
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 [LocationContext] App returned to foreground, checking permission...');
        console.log('🔄 [LocationContext] Current state:', {
          isLocationEnabled,
          wasPermissionDenied: wasPermissionDenied.current,
          hasLocation: !!location,
          hasUser: !!currentUser,
        });

        // 🎯 [KIM FIX v16] Settings에서 돌아왔을 때 항상 권한 체크
        // wasPermissionDenied 플래그와 관계없이 권한 상태 확인
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('🔄 [LocationContext] Permission status after return:', status);

        if (status === 'granted') {
          // 🎯 [KIM FIX v16] 권한이 granted인데 위치가 없거나 비활성화 상태면 새로고침
          if (!isLocationEnabled || !location) {
            console.log('✅ [LocationContext] Permission granted! Fetching location...');
            setIsLocationEnabled(true);
            wasPermissionDenied.current = false;

            // Auto-fetch location when permission is newly granted
            if (currentUser) {
              try {
                const newLocation = await getCurrentLocation();
                if (newLocation) {
                  console.log('✅ [LocationContext] Location auto-refreshed:', newLocation.address);
                  Alert.alert(
                    t('profile.settings.success') || '성공',
                    `${t('profile.settings.locationUpdated') || '위치가 업데이트되었습니다'}: ${newLocation.city || newLocation.address}`
                  );
                }
              } catch (error) {
                console.error('[LocationContext] Auto-refresh location error:', error);
              }
            }
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isLocationEnabled, location]);

  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await AsyncStorage.getItem('userLocation');
      if (cachedLocation) {
        const parsedLocation = JSON.parse(cachedLocation);

        // Check if it's old UserLocation format (has timestamp) or new LocationProfile format
        if (parsedLocation.timestamp) {
          // Old format - check 24-hour expiry and clear if expired
          if (Date.now() - parsedLocation.timestamp < 24 * 60 * 60 * 1000) {
            // console.log('🗂️ [LocationContext] Found old format cached location, clearing...');
          }
          // Don't use old format - let it get fresh reverse geocoded data
        } else if (parsedLocation.address && parsedLocation.lat && parsedLocation.lng) {
          // New LocationProfile format
          // console.log('🗂️ [LocationContext] Loading cached LocationProfile:', parsedLocation);
          setLocation(parsedLocation);
        }
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setIsLocationEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setIsLocationEnabled(false);
    }
  };

  /**
   * 🎯 [KIM FIX v14] 위치 권한 요청 함수
   * @param showAlert - Settings Alert를 표시할지 여부 (기본값: true)
   *                   - true: 사용자가 버튼을 클릭해서 호출 → Alert 표시
   *                   - false: 앱 자동 호출 (로그인 시 등) → Alert 표시 안 함
   */
  const requestLocationPermission = async (showAlert: boolean = true): Promise<boolean> => {
    try {
      // 🎯 [KIM FIX v13] Apple Guideline 5.1.1 - 항상 시스템 권한 요청 먼저 시도
      // "Set Up Location" 버튼을 눌렀다면 사용자는 위치 권한을 주고 싶어하는 것
      // iOS: undetermined일 때만 시스템 다이얼로그 표시, denied면 바로 denied 반환
      console.log('🔄 [LocationContext] requestLocationPermission called, showAlert:', showAlert);
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('🔄 [LocationContext] Permission status:', status);

      if (status === 'granted') {
        setIsLocationEnabled(true);
        return true;
      }

      // 권한이 여전히 거부된 경우 - Settings로 안내
      setIsLocationEnabled(false);

      // 🔄 Mark as denied so AppState listener will auto-check when returning
      wasPermissionDenied.current = true;

      // 🍎 [APPLE 5.1.1] 권한 거부 직후 Alert 표시 금지
      // showAlert 파라미터와 관계없이 Alert 없이 조용히 false 반환
      // 사용자가 기능을 사용하려 할 때 (Discover, CreateEvent 등) 별도 UI로 안내
      console.log('🍎 [LocationContext] Permission denied - no Alert (Apple Guideline 5.1.1)');

      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setIsLocationEnabled(false);
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationProfile | null> => {
    if (!isLocationEnabled) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError(t('contexts.location.permissionRequired'));
        return null;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // console.log('🍳 [LocationContext] Starting "cooking" - GPS coordinates → beautiful address...');

      // Step 1: Get GPS coordinates
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        maximumAge: 60000,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- Location types are incomplete

      // console.log('🍳 [LocationContext] Raw coordinates obtained:', {
      //   lat: position.coords.latitude,
      //   lng: position.coords.longitude
      // });

      // Step 2: 🎯 THE MAGIC! Reverse geocode coordinates → address
      const geocodedAddresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      // console.log('🍳 [LocationContext] Reverse geocoding results:', geocodedAddresses);

      // Step 3: Create perfect LocationProfile object
      let newLocation: LocationProfile;

      if (geocodedAddresses.length > 0) {
        const addr = geocodedAddresses[0];
        // console.log('🍳 [LocationContext] Parsing address components:', {
        //   city: addr.city,
        //   region: addr.region,
        //   country: addr.country
        // });

        // Create beautiful, formatted address
        const addressParts = [addr.city, addr.region].filter(Boolean);
        const formattedAddress =
          addressParts.length > 0
            ? addressParts.join(', ')
            : `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;

        newLocation = {
          address: formattedAddress,
          city: addr.city || undefined,
          state: addr.region || undefined,
          country: addr.country || 'US',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } else {
        // Fallback for when reverse geocoding fails
        // console.log('🍳 [LocationContext] Reverse geocoding failed, using coordinate fallback');
        newLocation = {
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          country: 'US',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      // console.log('🍳 [LocationContext] "Cooking" complete! Final LocationProfile:', newLocation);

      setLocation(newLocation);
      setIsLoading(false);

      // Cache the complete LocationProfile object
      try {
        await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log('✅ [LocationContext] Beautiful address cached to device.');
      } catch (error) {
        console.error('Error caching location:', error);
      }

      return newLocation;
    } catch (error) {
      setIsLoading(false);
      let errorMessage = t('contexts.location.cannotGetLocation');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMessage = t('contexts.location.serviceDisabled');
      } else if (err.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = t('contexts.location.locationUnavailable');
      } else if (err.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = t('contexts.location.locationTimeout');
      }

      setError(errorMessage);
      // 🎯 [KIM FIX] console.warn 사용 - 개발 모드에서 빨간 에러 화면 방지
      // kCLErrorDomain error 0 = GPS 신호 미획득 (시뮬레이터 또는 실내에서 흔함)
      console.warn('Location warning:', error);
      return null;
    }
  };

  const watchLocation = async () => {
    if (!isLocationEnabled || watchId !== null) return;

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000,
          distanceInterval: 100,
        },
        async position => {
          // Use the same reverse geocoding logic from getCurrentLocation
          try {
            console.log('🔄 [LocationContext] Watch location update - reverse geocoding...');

            const geocodedAddresses = await Location.reverseGeocodeAsync({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });

            let newLocation: LocationProfile;

            if (geocodedAddresses.length > 0) {
              const addr = geocodedAddresses[0];
              const addressParts = [addr.city, addr.region].filter(Boolean);
              const formattedAddress =
                addressParts.length > 0
                  ? addressParts.join(', ')
                  : `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;

              newLocation = {
                address: formattedAddress,
                city: addr.city || undefined,
                state: addr.region || undefined,
                country: addr.country || 'US',
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
            } else {
              newLocation = {
                address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
                country: 'US',
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
            }

            setLocation(newLocation);

            // Cache LocationProfile
            try {
              await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
            } catch (error) {
              console.error('Error caching location:', error);
            }
          } catch (error) {
            console.error('Watch location reverse geocoding error:', error);
          }
        }
      );

      setWatchId(subscription as unknown as number);
    } catch (error) {
      console.error('Location watch error:', error);
      setError(t('contexts.location.watchLocationFailed'));
    }
  };

  const stopWatchingLocation = () => {
    if (watchId !== null) {
      if (typeof watchId === 'object' && 'remove' in watchId) {
        (watchId as { remove: () => void }).remove();
      }
      setWatchId(null);
    }
  };

  // 컴포넌트 언마운트 시 위치 추적 정리
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        if (typeof watchId === 'object' && 'remove' in watchId) {
          (watchId as { remove: () => void }).remove();
        }
      }
    };
  }, [watchId]);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    stopWatchingLocation,
    isLocationEnabled,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
