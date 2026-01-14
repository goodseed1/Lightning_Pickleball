/* eslint-disable react-refresh/only-export-components */
/**
 * Update Check Context
 *
 * 앱 업데이트 확인 및 모달 표시를 관리하는 컨텍스트입니다.
 *
 * 기능:
 * - 앱 시작 시 업데이트 확인
 * - 업데이트 모달 표시/숨김
 * - "나중에" 선택 시 24시간 동안 다시 표시하지 않음
 * - 강제 업데이트는 건너뛸 수 없음
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { checkForUpdate, openStore, UpdateInfo } from '../services/appUpdateService';
import UpdatePromptModal from '../components/common/UpdatePromptModal';

// AsyncStorage 키
const DISMISSED_UNTIL_KEY = '@update_dismissed_until';
// 24시간 (밀리초)
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

interface UpdateCheckContextType {
  updateInfo: UpdateInfo | null;
  isCheckingUpdate: boolean;
  checkForAppUpdate: () => Promise<void>;
}

const UpdateCheckContext = createContext<UpdateCheckContextType | undefined>(undefined);

export const useUpdateCheck = (): UpdateCheckContextType => {
  const context = useContext(UpdateCheckContext);
  if (!context) {
    throw new Error('useUpdateCheck must be used within UpdateCheckProvider');
  }
  return context;
};

interface UpdateCheckProviderProps {
  children: React.ReactNode;
}

export const UpdateCheckProvider: React.FC<UpdateCheckProviderProps> = ({ children }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const appState = useRef(AppState.currentState);

  /**
   * "나중에"를 눌렀는지 확인
   */
  const isDismissed = useCallback(async (): Promise<boolean> => {
    try {
      const dismissedUntil = await AsyncStorage.getItem(DISMISSED_UNTIL_KEY);
      if (dismissedUntil) {
        const dismissedUntilTime = parseInt(dismissedUntil, 10);
        if (Date.now() < dismissedUntilTime) {
          console.log('📱 [UpdateCheck] Update prompt was dismissed, skipping...');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ [UpdateCheck] Failed to check dismissed status:', error);
      return false;
    }
  }, []);

  /**
   * "나중에" 버튼 클릭 처리
   */
  const handleDismiss = useCallback(async () => {
    try {
      const dismissUntil = Date.now() + DISMISS_DURATION_MS;
      await AsyncStorage.setItem(DISMISSED_UNTIL_KEY, dismissUntil.toString());
      console.log('📱 [UpdateCheck] Update prompt dismissed for 24 hours');
    } catch (error) {
      console.error('❌ [UpdateCheck] Failed to save dismissed status:', error);
    }
    setIsModalVisible(false);
  }, []);

  /**
   * "업데이트" 버튼 클릭 처리
   */
  const handleUpdate = useCallback(() => {
    if (updateInfo?.storeUrl) {
      openStore(updateInfo.storeUrl);
    }
    // 강제 업데이트가 아니면 모달 닫기
    if (!updateInfo?.isForceUpdate) {
      setIsModalVisible(false);
    }
  }, [updateInfo]);

  /**
   * 업데이트 확인
   */
  const checkForAppUpdate = useCallback(async () => {
    if (isCheckingUpdate) return;

    setIsCheckingUpdate(true);
    console.log('📱 [UpdateCheck] Checking for app updates...');

    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);

      if (info.isUpdateAvailable) {
        // 강제 업데이트인 경우 무조건 표시
        if (info.isForceUpdate) {
          console.log('🚨 [UpdateCheck] Force update required!');
          setIsModalVisible(true);
        } else {
          // 선택적 업데이트인 경우 24시간 내 닫은 적 있는지 확인
          const dismissed = await isDismissed();
          if (!dismissed) {
            console.log('📱 [UpdateCheck] Optional update available, showing prompt...');
            setIsModalVisible(true);
          }
        }
      } else {
        console.log('✅ [UpdateCheck] App is up to date!');
      }
    } catch (error) {
      console.error('❌ [UpdateCheck] Failed to check for updates:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [isCheckingUpdate, isDismissed]);

  /**
   * 앱 시작 시 업데이트 확인
   */
  useEffect(() => {
    // 약간의 딜레이 후 확인 (앱 초기화 완료 후)
    const timer = setTimeout(() => {
      checkForAppUpdate();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkForAppUpdate]);

  /**
   * 앱이 포그라운드로 돌아올 때 업데이트 확인 (강제 업데이트인 경우)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 강제 업데이트가 필요한 경우에만 다시 확인
        if (updateInfo?.isForceUpdate) {
          checkForAppUpdate();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkForAppUpdate, updateInfo?.isForceUpdate]);

  return (
    <UpdateCheckContext.Provider
      value={{
        updateInfo,
        isCheckingUpdate,
        checkForAppUpdate,
      }}
    >
      {children}
      <UpdatePromptModal
        visible={isModalVisible}
        updateInfo={updateInfo}
        onUpdate={handleUpdate}
        onDismiss={handleDismiss}
      />
    </UpdateCheckContext.Provider>
  );
};

export default UpdateCheckProvider;
