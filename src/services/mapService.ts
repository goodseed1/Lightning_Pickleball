import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapApp, LocationData } from '../types/mapTypes';
import i18n from '../i18n';

const PREFERRED_MAP_APP_KEY = 'preferred_map_app';

// 플랫폼별 지도 앱 정의
export const getAvailableMapApps = (): MapApp[] => {
  const commonApps: MapApp[] = [
    {
      id: 'google_maps',
      name: 'Google Maps',
      icon: '🗺️',
      urlScheme: Platform.OS === 'ios' ? 'comgooglemaps://' : 'google.navigation:',
      fallbackUrl:
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/app/google-maps/id585027354'
          : 'https://play.google.com/store/apps/details?id=com.google.android.apps.maps',
    },
    {
      id: 'waze',
      name: 'Waze',
      icon: '🚗',
      urlScheme: 'waze://',
      fallbackUrl:
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/app/waze-navigation-live-traffic/id323229106'
          : 'https://play.google.com/store/apps/details?id=com.waze',
    },
  ];

  if (Platform.OS === 'ios') {
    return [
      {
        id: 'apple_maps',
        name: 'Apple Maps',
        icon: '🍎',
        urlScheme: 'maps://',
        fallbackUrl: '',
        isAvailable: true, // Apple Maps는 iOS에 기본 내장
      },
      ...commonApps,
      {
        id: 'citymapper',
        name: 'Citymapper',
        icon: '🚇',
        urlScheme: 'citymapper://',
        fallbackUrl: 'https://apps.apple.com/app/citymapper-transit-navigation/id469463298',
      },
    ];
  } else {
    return [
      ...commonApps,
      {
        id: 'here_wego',
        name: 'HERE WeGo',
        icon: '📍',
        urlScheme: 'here-route://',
        fallbackUrl: 'https://play.google.com/store/apps/details?id=com.here.app.maps',
      },
    ];
  }
};

// 앱 설치 여부 확인
export const checkAppAvailability = async (app: MapApp): Promise<boolean> => {
  if (app.id === 'apple_maps' && Platform.OS === 'ios') {
    return true; // Apple Maps는 항상 사용 가능
  }

  try {
    const canOpen = await Linking.canOpenURL(app.urlScheme);
    return canOpen;
  } catch (error) {
    console.log(`Cannot check availability for ${app.name}:`, error);
    return false;
  }
};

// 지도 앱에서 위치 열기
export const openInMapApp = async (app: MapApp, location: LocationData): Promise<void> => {
  try {
    let url = '';

    // 좌표가 있는 경우 우선 사용
    if (location.coordinates) {
      const { lat, lng } = location.coordinates;

      switch (app.id) {
        case 'apple_maps':
          url = `maps://?q=${lat},${lng}`;
          break;
        case 'google_maps':
          url =
            Platform.OS === 'ios'
              ? `comgooglemaps://?q=${lat},${lng}&zoom=15`
              : `google.navigation:q=${lat},${lng}`;
          break;
        case 'waze':
          url = `waze://?ll=${lat},${lng}&navigate=yes`;
          break;
        case 'citymapper':
          url = `citymapper://directions?endcoord=${lat},${lng}`;
          break;
        case 'here_wego':
          url = `here-route://${lat},${lng}`;
          break;
        default:
          throw new Error('Unsupported map app');
      }
    } else {
      // 좌표가 없으면 주소로 검색
      const encodedAddress = encodeURIComponent(location.address);

      switch (app.id) {
        case 'apple_maps':
          url = `maps://?q=${encodedAddress}`;
          break;
        case 'google_maps':
          url =
            Platform.OS === 'ios'
              ? `comgooglemaps://?q=${encodedAddress}`
              : `google.navigation:q=${encodedAddress}`;
          break;
        case 'waze':
          url = `waze://?q=${encodedAddress}`;
          break;
        case 'citymapper':
          url = `citymapper://directions?endname=${encodedAddress}`;
          break;
        case 'here_wego':
          url = `here-route://?q=${encodedAddress}`;
          break;
        default:
          throw new Error('Unsupported map app');
      }
    }

    console.log(`Opening ${app.name} with URL: ${url}`);

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // 앱이 설치되지 않은 경우 스토어로 이동
      if (app.fallbackUrl) {
        Alert.alert(
          i18n.t('services.map.appNotInstalled', { appName: app.name }),
          i18n.t('services.map.installPrompt', { appName: app.name }),
          [
            { text: i18n.t('common.cancel'), style: 'cancel' },
            {
              text: i18n.t('services.map.install'),
              onPress: () => Linking.openURL(app.fallbackUrl),
            },
          ]
        );
      } else {
        throw new Error(`Cannot open ${app.name}`);
      }
    }
  } catch (error) {
    console.error(`Error opening ${app.name}:`, error);
    Alert.alert(
      i18n.t('services.map.error'),
      i18n.t('services.map.cannotOpenApp', { appName: app.name })
    );
  }
};

// 선호 지도 앱 저장
export const savePreferredMapApp = async (appId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFERRED_MAP_APP_KEY, appId);
  } catch (error) {
    console.error('Error saving preferred map app:', error);
  }
};

// 선호 지도 앱 가져오기
export const getPreferredMapApp = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(PREFERRED_MAP_APP_KEY);
  } catch (error) {
    console.error('Error getting preferred map app:', error);
    return null;
  }
};

// 선호 지도 앱 제거
export const clearPreferredMapApp = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PREFERRED_MAP_APP_KEY);
  } catch (error) {
    console.error('Error clearing preferred map app:', error);
  }
};
