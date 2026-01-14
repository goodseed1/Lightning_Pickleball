import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import StorageService from './StorageService';
import i18n from '../i18n';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface LocationServiceOptions {
  accuracy: Location.LocationAccuracy;
  distanceInterval?: number;
  timeInterval?: number;
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

class LocationService {
  private static instance: LocationService;
  private watchPositionSubscription: Location.LocationSubscription | null = null;
  private geofencingTaskName = 'lightning-tennis-geofencing';

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 위치 권한 상태 확인
   */
  async getLocationPermissionStatus(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting location permission status:', error);
      return Location.PermissionStatus.DENIED;
    }
  }

  /**
   * 위치 권한 요청
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      if (existingStatus !== Location.PermissionStatus.GRANTED) {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== Location.PermissionStatus.GRANTED) {
          Alert.alert(
            i18n.t('services.location.permissionTitle'),
            i18n.t('services.location.permissionMessage'),
            [
              { text: i18n.t('services.location.later'), style: 'cancel' },
              {
                text: i18n.t('services.location.openSettings'),
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * 백그라운드 위치 권한 요청
   */
  async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          i18n.t('services.location.backgroundPermissionTitle'),
          i18n.t('services.location.backgroundPermissionMessage'),
          [
            { text: i18n.t('common.skip'), style: 'cancel' },
            {
              text: i18n.t('services.location.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      return false;
    }
  }

  /**
   * 현재 위치 가져오기 (빠른 버전)
   * @param forceRefresh - true면 캐시 무시하고 항상 새 GPS 위치 요청
   */
  async getCurrentLocationFast(forceRefresh: boolean = false): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      // 위치 서비스 활성화 확인
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return null;
      }

      // 🎯 [KIM FIX] forceRefresh=true면 캐시 무시하고 새 GPS 요청
      // - 위치 새로고침 버튼: forceRefresh=true → 항상 새 위치
      // - 일반 사용: forceRefresh=false → 2분 캐시 허용 (성능 최적화)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Low,
        maximumAge: forceRefresh ? 0 : 120000, // forceRefresh면 캐시 무시
        timeout: 10000, // 10초 - 현실적인 timeout
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- Location API types are incomplete

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      // 위치 정보 캐싱
      await StorageService.saveCachedLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: Date.now(),
      });

      return locationData;
    } catch (error) {
      console.error('Error getting current location (fast):', error);

      // 캐시된 위치 정보 반환 시도
      const cachedLocation = await StorageService.getCachedLocation();
      if (cachedLocation) {
        return {
          ...cachedLocation,
          accuracy: 2000, // 캐시된 위치는 정확도를 더 낮게 설정
        };
      }

      return null;
    }
  }

  /**
   * 현재 위치 가져오기 (정확한 버전)
   */
  async getCurrentLocation(
    accuracy: Location.LocationAccuracy = Location.LocationAccuracy.Balanced
  ): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      // 위치 서비스 활성화 확인
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          i18n.t('services.location.serviceDisabledTitle'),
          i18n.t('services.location.serviceDisabledMessage'),
          [{ text: i18n.t('common.ok'), style: 'default' }]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy,
        maximumAge: 30000, // 30초
        timeout: 15000, // 15초
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- Location API types are incomplete

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      // 위치 정보 캐싱
      await StorageService.saveCachedLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: Date.now(),
      });

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);

      // 캐시된 위치 정보 반환 시도
      const cachedLocation = await StorageService.getCachedLocation();
      if (cachedLocation) {
        return {
          ...cachedLocation,
          accuracy: 1000, // 캐시된 위치는 정확도를 낮게 설정
        };
      }

      return null;
    }
  }

  /**
   * 위치 추적 시작
   */
  async startLocationTracking(
    callback: (location: LocationData) => void,
    options: LocationServiceOptions = {
      accuracy: Location.LocationAccuracy.Balanced,
      distanceInterval: 100, // 100m
      timeInterval: 60000, // 1분
    }
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return false;
      }

      // 기존 구독이 있다면 정리
      if (this.watchPositionSubscription) {
        this.stopLocationTracking();
      }

      this.watchPositionSubscription = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy,
          timeInterval: options.timeInterval,
          distanceInterval: options.distanceInterval,
        },
        location => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: location.timestamp,
          };

          callback(locationData);

          // 위치 정보 캐싱
          StorageService.saveCachedLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: Date.now(),
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * 위치 추적 중지
   */
  stopLocationTracking(): void {
    if (this.watchPositionSubscription) {
      this.watchPositionSubscription.remove();
      this.watchPositionSubscription = null;
    }
  }

  /**
   * 두 지점 간 거리 계산 (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // 소수점 첫째자리까지
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 주소를 좌표로 변환 (Geocoding)
   */
  async geocodeAddress(address: string): Promise<LocationData | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: 1000, // 추정값
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Get coordinates from address string using Google Places API for intelligent location search
   */
  async findPlaceDetails(
    address: string
  ): Promise<{ latitude: number; longitude: number; formattedAddress?: string } | null> {
    if (!address) return null;

    try {
      // First try standard geocoding as it's faster and handles precise addresses well
      const geocodeResult = await this.geocodeAddress(address);
      if (geocodeResult) {
        return {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
        };
      }

      // Fallback to Google Places API for ambiguous queries like park names
      // Note: This would require Google Places API setup and proper API key configuration
      // For now, we'll implement a mock that handles known problematic addresses

      // Handle known problematic GA addresses
      if (address.includes('Alberta Banks Park') || address.includes('GC Crow Road')) {
        const correctedAddress = '5575 Alberta Banks Pkwy, Flowery Branch, GA 30542';
        const correctedResult = await this.geocodeAddress(correctedAddress);
        if (correctedResult) {
          return {
            latitude: correctedResult.latitude,
            longitude: correctedResult.longitude,
            formattedAddress: correctedAddress,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error during place search:', error);
      return null;
    }
  }

  /**
   * Get coordinates from address string - optimized for distance calculation fallback
   * @deprecated Use findPlaceDetails instead for better location intelligence
   */
  async getCoordsFromAddress(
    address: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    const result = await this.findPlaceDetails(address);
    return result ? { latitude: result.latitude, longitude: result.longitude } : null;
  }

  /**
   * 좌표를 주소로 변환 (Reverse Geocoding)
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    address: string;
    city: string;
    district: string;
    state: string;
    country: string;
  } | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length === 0) {
        return null;
      }

      const result = results[0];

      return {
        address: [result.street, result.name, result.district, result.city]
          .filter(Boolean)
          .join(' '),
        city: result.city || '',
        district: result.district || result.subregion || '',
        state: result.region || '',
        country: result.country || '',
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Safe Location Object Creation
   * Creates a complete location object with guaranteed non-undefined values
   * This is the first defense layer against Firestore undefined value errors
   */
  createLocationObject(
    latitude: number,
    longitude: number,
    addressInfo?: {
      address?: string;
      city?: string;
      district?: string;
      state?: string;
      country?: string;
    }
  ): {
    lat: number;
    lng: number;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    district: string;
    state: string;
    region: string;
    country: string;
  } {
    // Create safe location object with guaranteed non-undefined values
    const safeLocation = {
      // Dual coordinate format for compatibility
      lat: latitude || 0,
      lng: longitude || 0,
      latitude: latitude || 0,
      longitude: longitude || 0,

      // Address components with safe fallbacks
      address: addressInfo?.address || '',
      city: addressInfo?.city || '',
      district: addressInfo?.district || '',
      state: addressInfo?.state || '',
      region: addressInfo?.state || '', // Keep for backwards compatibility
      country: addressInfo?.country || '',
    };

    return safeLocation;
  }

  /**
   * 지오펜싱 등록
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async startGeofencing(_regions: GeofenceRegion[]): Promise<boolean> {
    try {
      const hasPermission = await this.requestBackgroundLocationPermission();
      if (!hasPermission) {
        return false;
      }

      // 실제 구현에서는 TaskManager와 함께 사용
      // await Location.startGeofencingAsync(this.geofencingTaskName, regions);

      return true;
    } catch (error) {
      console.error('Error starting geofencing:', error);
      return false;
    }
  }

  /**
   * 지오펜싱 중지
   */
  async stopGeofencing(): Promise<void> {
    try {
      // await Location.stopGeofencingAsync(this.geofencingTaskName);
    } catch (error) {
      console.error('Error stopping geofencing:', error);
    }
  }

  /**
   * 근처 테니스장 찾기 (Mock implementation)
   */
  async findNearbyCourts(
    latitude: number,
    longitude: number,
    radius: number = 5 // km
  ): Promise<
    Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      distance: number;
      address: string;
    }>
  > {
    // Mock data - 실제 구현에서는 테니스장 API 호출
    const mockCourts = [
      {
        id: '1',
        name: '올림픽공원 테니스장',
        latitude: 37.5219,
        longitude: 127.1267,
        address: '서울특별시 송파구 올림픽로 424',
      },
      {
        id: '2',
        name: '한강공원 테니스코트',
        latitude: 37.5299,
        longitude: 126.9343,
        address: '서울특별시 영등포구 여의동로 330',
      },
      {
        id: '3',
        name: '잠실 테니스장',
        latitude: 37.5133,
        longitude: 127.1003,
        address: '서울특별시 송파구 잠실동',
      },
    ];

    return mockCourts
      .map(court => ({
        ...court,
        distance: this.calculateDistance(latitude, longitude, court.latitude, court.longitude),
      }))
      .filter(court => court.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * 위치 기반 플레이어 검색
   */
  async findNearbyPlayers(
    latitude: number,
    longitude: number,
    radius: number = 10 // km
  ): Promise<
    Array<{
      id: string;
      name: string;
      distance: number;
      skillLevel: number;
      isOnline: boolean;
    }>
  > {
    // Mock data - 실제 구현에서는 사용자 위치 API 호출
    const mockPlayers = [
      {
        id: '1',
        name: '김서준',
        latitude: 37.5665 + (Math.random() - 0.5) * 0.1,
        longitude: 126.978 + (Math.random() - 0.5) * 0.1,
        skillLevel: 75,
        isOnline: true,
      },
      {
        id: '2',
        name: '이민지',
        latitude: 37.5665 + (Math.random() - 0.5) * 0.1,
        longitude: 126.978 + (Math.random() - 0.5) * 0.1,
        skillLevel: 60,
        isOnline: true,
      },
    ];

    return mockPlayers
      .map(player => ({
        id: player.id,
        name: player.name,
        distance: this.calculateDistance(latitude, longitude, player.latitude, player.longitude),
        skillLevel: player.skillLevel,
        isOnline: player.isOnline,
      }))
      .filter(player => player.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * 배터리 최적화를 위한 위치 추적 중지
   */
  pauseLocationTracking(): void {
    this.stopLocationTracking();
  }

  /**
   * 위치 추적 재개
   */
  resumeLocationTracking(
    callback: (location: LocationData) => void,
    options?: LocationServiceOptions
  ): Promise<boolean> {
    return this.startLocationTracking(callback, options);
  }

  /**
   * Get detailed place information using Google Places Details API
   * This function provides enhanced address resolution for place_id selections
   */
  async getPlaceDetails(placeId: string): Promise<{
    name: string;
    address: string;
    city: string;
    district: string;
    state: string;
    country: string;
    formattedAddress: string;
    coordinates: { latitude: number; longitude: number };
    types: string[];
  } | null> {
    if (!placeId) {
      console.warn('🚨 LocationService.getPlaceDetails: No place_id provided');
      return null;
    }

    try {
      // 🎯 작전명 "마스터 키": Platform별 API 키 처리 개선
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Platform } = require('react-native');
      const googleApiKey =
        Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_IOS
          : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID;

      if (!googleApiKey) {
        console.error(
          '🚨 LocationService.getPlaceDetails: No Google API key found for platform:',
          Platform.OS
        );
        return null;
      }

      // 🚀 핵심 개선: name 필드를 추가로 요청하여 완전한 장소 정보 획득
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleApiKey}&language=en&fields=name,formatted_address,geometry,address_components,types,vicinity`;

      console.log('🔍 Fetching complete place details for place_id:', placeId);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.result) {
        const errorMessage = data.error_message || `API returned status: ${data.status}`;
        console.error('🚨 Google Places Details API error:', {
          status: data.status,
          error: errorMessage,
          placeId,
        });
        return null;
      }

      const place = data.result;
      const addressComponents = place.address_components || [];

      // Extract address components with enhanced parsing
      let city = '';
      let district = '';
      let state = '';
      let country = '';
      let streetNumber = '';
      let route = '';

      addressComponents.forEach((component: GoogleAddressComponent) => {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          district = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        } else if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        }
      });

      // 🎯 "마스터 키" 핵심: name 필드 우선 처리
      const placeName =
        place.name || place.vicinity || place.formatted_address?.split(',')[0] || 'Unknown Place';

      // Construct address string with improved logic
      const address =
        [streetNumber, route].filter(Boolean).join(' ') ||
        place.formatted_address?.split(',')[0] ||
        placeName ||
        'Unknown Location';

      const result = {
        name: placeName, // 🎯 핵심: name 필드 추가!
        address,
        city: city || 'Unknown City',
        district: district || '',
        state: state || 'Unknown State',
        country: country || 'Unknown Country',
        formattedAddress: place.formatted_address || address,
        coordinates: {
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0,
        },
        types: place.types || [],
      };

      console.log('✅ 작전명 "마스터 키" - Place details 완전 해결:', {
        placeId,
        name: result.name, // 🎯 핵심: name 필드 로깅
        address: result.address,
        city: result.city,
        state: result.state,
        hasName: !!result.name,
        types: result.types.slice(0, 3),
      });

      return result;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      console.error('🚨 Error fetching place details:', {
        placeId,
        error: err.message || error,
        stack: err.stack?.split('\n').slice(0, 3),
      });
      return null;
    }
  }

  /**
   * Enhanced location object creation with place_id support
   * Creates location object with place details when place_id is provided
   */
  async createLocationObjectFromPlaceId(placeId: string): Promise<{
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    district: string;
    state: string;
    country: string;
    formattedAddress: string;
    placeId: string;
    types: string[];
  } | null> {
    try {
      const placeDetails = await this.getPlaceDetails(placeId);

      if (!placeDetails) {
        console.warn('🚨 Could not get place details for place_id:', placeId);
        return null;
      }

      return {
        name: placeDetails.name, // 🎯 핵심: name 필드 추가!
        latitude: placeDetails.coordinates.latitude,
        longitude: placeDetails.coordinates.longitude,
        address: placeDetails.address,
        city: placeDetails.city,
        district: placeDetails.district,
        state: placeDetails.state,
        country: placeDetails.country,
        formattedAddress: placeDetails.formattedAddress,
        placeId,
        types: placeDetails.types,
      };
    } catch (error) {
      console.error('🚨 Error creating location object from place_id:', error);
      return null;
    }
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    this.stopLocationTracking();
    // 지오펜싱이 활성화되어 있다면 중지
    this.stopGeofencing();
  }
}

export default LocationService.getInstance();
