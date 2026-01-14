import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from './LanguageContext';

interface NotificationContextType {
  expoPushToken: string | null;
  isPermissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  scheduleMatchReminder: (matchId: string, matchTime: Date) => Promise<void>;
  cancelNotification: (notificationId: string) => Promise<void>;
  showLocalNotification: (title: string, body: string) => Promise<void>;
  badge: number;
  setBadge: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { t } = useLanguage();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [badge, setBadgeCount] = useState(0);

  useEffect(() => {
    initializeNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeNotifications = async () => {
    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => {
          return {
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });

      // 권한 상태 확인
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      const enabled = existingStatus === 'granted';
      setIsPermissionGranted(enabled);

      if (enabled && Device.isDevice) {
        // Expo Push Token 가져오기
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '21147a75-4071-46b1-b5c2-41916ccce97a',
        });
        const token = tokenData.data;
        setExpoPushToken(token);

        // 토큰을 AsyncStorage에 저장
        await AsyncStorage.setItem('expoPushToken', token);
        console.log('Expo Push Token:', token);
      }

      // Setup notification listeners
      setupNotificationListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const setupNotificationListeners = useCallback(() => {
    // Handle notification responses (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);

      if (data?.type === 'match_reminder') {
        console.log('Navigate to match detail:', data.matchId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const enabled = finalStatus === 'granted';
      setIsPermissionGranted(enabled);

      if (enabled) {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '21147a75-4071-46b1-b5c2-41916ccce97a',
        });
        const token = tokenData.data;
        setExpoPushToken(token);
        await AsyncStorage.setItem('expoPushToken', token);
      } else {
        Alert.alert(
          t('contexts.notification.permissionTitle'),
          t('contexts.notification.permissionMessage'),
          [
            { text: t('contexts.notification.later'), style: 'cancel' },
            {
              text: t('contexts.notification.openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showLocalNotification = useCallback(
    async (title: string, body: string): Promise<void> => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'default',
            badge: badge + 1,
          },
          trigger: null, // Send immediately
        });

        setBadgeCount(prev => prev + 1);
      } catch (error) {
        console.error('Error showing local notification:', error);
      }
    },
    [badge]
  );

  const scheduleMatchReminder = async (matchId: string, matchTime: Date): Promise<void> => {
    try {
      // 매치 30분 전 알림 예약
      const reminderTime = new Date(matchTime.getTime() - 30 * 60 * 1000);

      if (reminderTime > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t('contexts.notification.matchNotificationTitle'),
            body: t('contexts.notification.matchNotificationBody'),
            data: {
              type: 'match_reminder',
              matchId,
            },
            sound: 'default',
            badge: 1,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderTime,
          },
          identifier: `match_reminder_${matchId}`,
        });
      }
    } catch (error) {
      console.error('Error scheduling match reminder:', error);
    }
  };

  const cancelNotification = async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const setBadge = async (count: number): Promise<void> => {
    setBadgeCount(count);

    if (Platform.OS === 'ios') {
      try {
        await Notifications.setBadgeCountAsync(count);
      } catch (error) {
        console.error('Error setting badge count:', error);
      }
    }
  };

  const value: NotificationContextType = {
    expoPushToken,
    isPermissionGranted,
    requestPermission,
    scheduleMatchReminder,
    cancelNotification,
    showLocalNotification,
    badge,
    setBadge,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
