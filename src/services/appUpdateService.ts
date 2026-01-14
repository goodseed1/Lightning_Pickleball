/**
 * App Update Service
 *
 * Firestore를 사용하여 앱 업데이트 필요 여부를 확인합니다.
 * (Firebase Remote Config는 React Native에서 indexedDB 미지원으로 사용 불가)
 *
 * - 최소 필수 버전 (force update)
 * - 최신 권장 버전 (optional update)
 *
 * @see Firestore > app_config/version 문서에서 설정:
 *   - minimum_version: "2.0.0" (이 버전 미만은 강제 업데이트)
 *   - latest_version: "2.0.8" (이 버전보다 낮으면 업데이트 권장)
 *   - update_message_ko: "새로운 기능이 추가되었습니다!"
 *   - update_message_en: "New features are available!"
 *   - app_store_url: "https://apps.apple.com/app/id6749823614"
 *   - play_store_url: "https://play.google.com/store/apps/details?id=com.lightningpickleball.community"
 */

import { doc, getDoc } from 'firebase/firestore';
import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';
import { db } from '../firebase/config';

// 기본값 (Firestore 연결 실패 시 사용)
const DEFAULT_CONFIG = {
  minimum_version: '1.0.0',
  latest_version: '2.0.8',
  update_message_ko: '새로운 버전이 출시되었습니다. 업데이트하여 최신 기능을 사용해보세요!',
  update_message_en: 'A new version is available. Update now to enjoy the latest features!',
  app_store_url: 'https://apps.apple.com/app/id6749823614',
  play_store_url: 'https://play.google.com/store/apps/details?id=com.lightningpickleball.community',
};

export interface UpdateInfo {
  isUpdateAvailable: boolean;
  isForceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  minimumVersion: string;
  updateMessage: {
    ko: string;
    en: string;
  };
  storeUrl: string;
}

/**
 * 버전 문자열을 비교 가능한 숫자 배열로 변환
 * "2.0.7" -> [2, 0, 7]
 */
const parseVersion = (version: string): number[] => {
  return version.split('.').map(part => parseInt(part, 10) || 0);
};

/**
 * 버전 비교
 * @returns -1 (v1 < v2), 0 (v1 == v2), 1 (v1 > v2)
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
};

/**
 * 현재 앱 버전 가져오기
 */
export const getCurrentAppVersion = (): string => {
  return Constants.expoConfig?.version || '1.0.0';
};

/**
 * Firestore에서 업데이트 정보 가져오기
 * Collection: app_config, Document: version
 */
export const checkForUpdate = async (): Promise<UpdateInfo> => {
  const currentVersion = getCurrentAppVersion();

  try {
    // Firestore에서 버전 정보 가져오기
    const versionDocRef = doc(db, 'app_config', 'version');
    const versionDoc = await getDoc(versionDocRef);

    let config = DEFAULT_CONFIG;

    if (versionDoc.exists()) {
      const data = versionDoc.data();
      config = {
        minimum_version: data.minimum_version || DEFAULT_CONFIG.minimum_version,
        latest_version: data.latest_version || DEFAULT_CONFIG.latest_version,
        update_message_ko: data.update_message_ko || DEFAULT_CONFIG.update_message_ko,
        update_message_en: data.update_message_en || DEFAULT_CONFIG.update_message_en,
        app_store_url: data.app_store_url || DEFAULT_CONFIG.app_store_url,
        play_store_url: data.play_store_url || DEFAULT_CONFIG.play_store_url,
      };
      console.log('📱 [AppUpdate] Loaded config from Firestore:', config);
    } else {
      console.log('📱 [AppUpdate] No version config in Firestore, using defaults');
    }

    // 플랫폼별 스토어 URL
    const storeUrl = Platform.OS === 'ios' ? config.app_store_url : config.play_store_url;

    // 버전 비교
    const isBelowMinimum = compareVersions(currentVersion, config.minimum_version) < 0;
    const isBelowLatest = compareVersions(currentVersion, config.latest_version) < 0;

    console.log('📱 [AppUpdate] Version check:', {
      currentVersion,
      minimumVersion: config.minimum_version,
      latestVersion: config.latest_version,
      isBelowMinimum,
      isBelowLatest,
    });

    return {
      isUpdateAvailable: isBelowLatest,
      isForceUpdate: isBelowMinimum,
      currentVersion,
      latestVersion: config.latest_version,
      minimumVersion: config.minimum_version,
      updateMessage: {
        ko: config.update_message_ko,
        en: config.update_message_en,
      },
      storeUrl,
    };
  } catch (error) {
    // 🎯 [KIM FIX] console.warn 사용 - 로그아웃 상태에서 권한 에러는 예상되는 상황
    // console.error는 React Native에서 Red Box를 트리거하므로 warn으로 변경
    console.warn('⚠️ [AppUpdate] Failed to check for updates (may be logged out):', error);

    // 에러 시 업데이트 없음으로 반환 (앱 사용 차단 방지)
    return {
      isUpdateAvailable: false,
      isForceUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      minimumVersion: '1.0.0',
      updateMessage: {
        ko: DEFAULT_CONFIG.update_message_ko,
        en: DEFAULT_CONFIG.update_message_en,
      },
      storeUrl:
        Platform.OS === 'ios' ? DEFAULT_CONFIG.app_store_url : DEFAULT_CONFIG.play_store_url,
    };
  }
};

/**
 * 스토어 열기
 */
export const openStore = async (storeUrl: string): Promise<void> => {
  try {
    const canOpen = await Linking.canOpenURL(storeUrl);
    if (canOpen) {
      await Linking.openURL(storeUrl);
    } else {
      console.warn('⚠️ [AppUpdate] Cannot open store URL:', storeUrl);
    }
  } catch (error) {
    console.error('❌ [AppUpdate] Failed to open store:', error);
  }
};

export default {
  checkForUpdate,
  openStore,
  getCurrentAppVersion,
};
