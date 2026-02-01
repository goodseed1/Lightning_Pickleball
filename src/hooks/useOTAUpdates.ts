/**
 * useOTAUpdates Hook
 *
 * EAS Update (Over-The-Air) 업데이트를 확인하고 적용하는 훅입니다.
 *
 * 기능:
 * - 앱 시작 시 OTA 업데이트 확인
 * - 업데이트가 있으면 백그라운드에서 다운로드
 * - 다운로드 완료 후 사용자에게 재시작 알림
 * - 앱이 포그라운드로 돌아올 때 재확인
 *
 * @see https://docs.expo.dev/versions/latest/sdk/updates/
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import * as Updates from 'expo-updates';

interface OTAUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  updateId: string | null;
  error: string | null;
}

interface UseOTAUpdatesReturn extends OTAUpdateState {
  checkForUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
}

/**
 * OTA 업데이트를 관리하는 훅
 */
export const useOTAUpdates = (): UseOTAUpdatesReturn => {
  const [state, setState] = useState<OTAUpdateState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdateReady: false,
    updateId: null,
    error: null,
  });

  const appState = useRef(AppState.currentState);
  const hasCheckedOnMount = useRef(false);

  /**
   * 업데이트 확인 및 다운로드
   */
  const checkForUpdate = useCallback(async () => {
    // Development 모드에서는 OTA 업데이트 비활성화
    if (__DEV__) {
      console.log('🔄 [OTA] Skipping update check in development mode');
      return;
    }

    // expo-updates가 활성화되어 있는지 확인
    if (!Updates.isEnabled) {
      console.log('🔄 [OTA] Updates are not enabled in this build');
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));
    console.log('🔄 [OTA] Checking for updates...');

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        console.log('🔄 [OTA] Update available! Downloading...');
        setState(prev => ({
          ...prev,
          isChecking: false,
          isDownloading: true,
          isUpdateAvailable: true,
        }));

        // 업데이트 다운로드
        const fetchResult = await Updates.fetchUpdateAsync();

        if (fetchResult.isNew) {
          console.log('✅ [OTA] Update downloaded successfully!');
          setState(prev => ({
            ...prev,
            isDownloading: false,
            isUpdateReady: true,
            updateId: fetchResult.manifest?.id || 'unknown',
          }));

          // 사용자에게 재시작 알림
          showUpdateReadyAlert();
        }
      } else {
        console.log('✅ [OTA] App is up to date!');
        setState(prev => ({
          ...prev,
          isChecking: false,
          isUpdateAvailable: false,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ [OTA] Error checking for updates:', errorMessage);
      setState(prev => ({
        ...prev,
        isChecking: false,
        isDownloading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * 업데이트 적용 (앱 재시작)
   */
  const applyUpdate = useCallback(async () => {
    if (!state.isUpdateReady) {
      console.warn('⚠️ [OTA] No update ready to apply');
      return;
    }

    console.log('🔄 [OTA] Applying update and restarting...');

    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('❌ [OTA] Failed to apply update:', error);
    }
  }, [state.isUpdateReady]);

  /**
   * 업데이트 준비 완료 알림
   * Note: OTA 업데이트는 앱 초기화 전에 나타날 수 있으므로,
   * 사용자 언어 설정에 접근할 수 없습니다. 영어를 기본으로 사용합니다.
   */
  const showUpdateReadyAlert = useCallback(() => {
    Alert.alert(
      'Update Ready',
      'A new update has been downloaded. Would you like to apply it now?',
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => {
            console.log('🔄 [OTA] User deferred update');
          },
        },
        {
          text: 'Apply Now',
          onPress: async () => {
            try {
              await Updates.reloadAsync();
            } catch (error) {
              console.error('❌ [OTA] Failed to reload:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, []);

  /**
   * 앱 마운트 시 업데이트 확인
   */
  useEffect(() => {
    if (!hasCheckedOnMount.current) {
      hasCheckedOnMount.current = true;
      // 앱 초기화 후 약간의 딜레이
      const timer = setTimeout(() => {
        checkForUpdate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [checkForUpdate]);

  /**
   * 앱이 포그라운드로 돌아올 때 업데이트 확인
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 포그라운드로 돌아올 때 업데이트 확인
        // 단, 이미 업데이트가 준비되어 있으면 알림만 다시 표시
        if (state.isUpdateReady) {
          showUpdateReadyAlert();
        } else {
          checkForUpdate();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkForUpdate, showUpdateReadyAlert, state.isUpdateReady]);

  return {
    ...state,
    checkForUpdate,
    applyUpdate,
  };
};

export default useOTAUpdates;
