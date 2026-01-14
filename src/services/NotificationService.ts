import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import i18n from '../i18n';

export interface NotificationPreferences {
  matchNotifications: boolean;
  clubEventNotifications: boolean;
  notificationDistance: number; // in miles
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export interface MatchNotificationData {
  matchId: string;
  title: string;
  type: 'personal' | 'club';
  location: string;
  dateTime: string;
  distance: number;
  clubName?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {
    this.configureNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private configureNotifications() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true, // 🔔 Android 배지 표시 활성화
      }),
    });

    // 🤖 Android: Create notification channel (REQUIRED for Android 8+)
    if (Platform.OS === 'android') {
      this.setupAndroidNotificationChannel();
    }

    // Handle notification responses
    this.addNotificationResponseListener();
  }

  /**
   * Setup Android notification channels (required for Android 8.0+, API 26+)
   * Without these, notifications won't show on Android!
   *
   * 🎯 [KIM FIX] All channel IDs must match the channelId values used in Cloud Functions
   */
  private async setupAndroidNotificationChannel(): Promise<void> {
    try {
      // 📋 Channel definitions - must match Cloud Functions channelId values
      const channels = [
        {
          id: 'default',
          name: 'Lightning Pickleball',
          description: '기본 알림 / Default notifications',
        },
        {
          id: 'lightning_pickleball_events',
          name: '번개매치 이벤트',
          description: '번개매치 참여 승인/거절 알림',
        },
        {
          id: 'events',
          name: '이벤트 알림',
          description: '이벤트 생성 및 업데이트 알림',
        },
        {
          id: 'leagues',
          name: '리그 알림',
          description: '리그 관련 알림',
        },
        {
          id: 'partner-invitations',
          name: '파트너 초대',
          description: '복식 파트너 초대 알림',
        },
        {
          id: 'meetup_notifications',
          name: '모임 알림',
          description: '클럽 모임 관련 알림',
        },
        {
          id: 'tournaments',
          name: '토너먼트 알림',
          description: '토너먼트 관련 알림',
        },
        {
          id: 'achievements',
          name: '업적 알림',
          description: '트로피 및 업적 획득 알림',
        },
        {
          id: 'chat',
          name: '채팅 알림',
          description: '채팅 메시지 알림',
        },
        {
          id: 'club',
          name: '클럽 알림',
          description: '클럽 관련 알림 (가입, 채팅 등)',
        },
        {
          id: 'announcements',
          name: '공지사항',
          description: '클럽 및 앱 공지사항 알림',
        },
        {
          id: 'team-invitations',
          name: '팀 초대',
          description: '팀 초대 알림',
        },
        {
          id: 'solo-lobby',
          name: '솔로 로비',
          description: '솔로 매칭 관련 알림',
        },
      ];

      // Create all channels
      for (const channel of channels) {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1976d2',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      console.log(`✅ Android notification channels created: ${channels.length} channels`);
    } catch (error) {
      console.error('❌ Failed to create Android notification channels:', error);
    }
  }

  /**
   * Request notification permissions and get Expo push token
   * @returns Object with granted status and push token (if obtained)
   */
  public async requestPermissions(): Promise<{ granted: boolean; token: string | null }> {
    try {
      // Check if running on a physical device (required for push notifications)
      if (!Device.isDevice) {
        console.log('ℹ️ Push notifications not available on simulator/emulator');
        // Still request local notification permissions on simulator
        const { status } = await Notifications.requestPermissionsAsync();
        return { granted: status === 'granted', token: null };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission for notifications was denied');
        return { granted: false, token: null };
      }

      // Get Expo push token (only on physical devices)
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '21147a75-4071-46b1-b5c2-41916ccce97a', // From app.json
        });

        this.expoPushToken = token.data;
        console.log('✅ Expo push token obtained:', this.expoPushToken);
        return { granted: true, token: this.expoPushToken };
      } catch (tokenError) {
        // This can fail on simulators or when aps-environment entitlement is missing
        console.error('❌ Could not get push token:', tokenError);
        return { granted: true, token: null };
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { granted: false, token: null };
    }
  }

  /**
   * Get the current Expo push token
   */
  public getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification for a new match
   */
  public async scheduleMatchNotification(matchData: MatchNotificationData): Promise<void> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title:
            matchData.type === 'club'
              ? i18n.t('services.notification.newClubEvent', { title: matchData.title })
              : i18n.t('services.notification.newLightningMatch', { title: matchData.title }),
          body: i18n.t('services.notification.matchDetails', {
            location: matchData.location,
            dateTime: new Date(matchData.dateTime).toLocaleString(),
            distance: matchData.distance.toFixed(1),
          }),
          data: {
            type: 'new_match',
            matchId: matchData.matchId,
            matchType: matchData.type,
          },
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log('Scheduled notification with ID:', identifier);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Schedule notification reminder for upcoming match
   */
  public async scheduleMatchReminder(
    matchId: string,
    title: string,
    dateTime: Date,
    minutesBefore: number = 30
  ): Promise<void> {
    try {
      const reminderTime = new Date(dateTime.getTime() - minutesBefore * 60 * 1000);

      // Don't schedule if the reminder time is in the past
      if (reminderTime <= new Date()) {
        return;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('services.notification.matchReminder'),
          body: i18n.t('services.notification.matchReminderBody', {
            title,
            minutes: minutesBefore,
          }),
          data: {
            type: 'match_reminder',
            matchId: matchId,
          },
          badge: 1,
        },
        trigger: {
          date: reminderTime,
        },
      });

      console.log('Scheduled match reminder with ID:', identifier);
    } catch (error) {
      console.error('Error scheduling match reminder:', error);
    }
  }

  /**
   * Cancel all scheduled notifications for a match
   */
  public async cancelMatchNotifications(matchId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        if (notification.content.data?.matchId === matchId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling match notifications:', error);
    }
  }

  /**
   * Send push notification to users within specified distance
   */
  public async sendMatchNotificationToNearbyUsers(
    matchData: MatchNotificationData,
    userTokens: string[]
  ): Promise<void> {
    try {
      // This would typically be done on the server side
      // For demo purposes, we'll just log the action
      console.log('Sending notifications to nearby users:', {
        matchData,
        recipientCount: userTokens.length,
      });

      // In production, you would call your server endpoint:
      // await fetch('YOUR_SERVER_ENDPOINT/send-match-notification', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     matchData,
      //     targetTokens: userTokens
      //   })
      // });
    } catch (error) {
      console.error('Error sending notifications to nearby users:', error);
    }
  }

  /**
   * Check if user should receive notification based on distance
   */
  public shouldReceiveNotification(
    userLat: number,
    userLng: number,
    matchLat: number,
    matchLng: number,
    maxDistance: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLng, matchLat, matchLng);
    return distance <= maxDistance;
  }

  /**
   * Calculate distance between two coordinates in miles
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Handle notification responses (when user taps notification)
   */
  private addNotificationResponseListener(): void {
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      console.log('Notification tapped:', data);

      // Handle different notification types
      switch (data?.type) {
        case 'new_match':
          // Navigate to match detail screen
          console.log('Navigating to match:', data.matchId);
          break;
        case 'match_reminder':
          // Navigate to match detail screen
          console.log('Opening match reminder:', data.matchId);
          break;
        default:
          console.log('Unknown notification type');
      }
    });
  }

  /**
   * Clear all notifications
   */
  public async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Get notification preferences from user profile
   */
  public getDefaultPreferences(): NotificationPreferences {
    return {
      matchNotifications: true,
      clubEventNotifications: true,
      notificationDistance: 10, // 10 miles default
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    };
  }

  /**
   * Send partner invitation notification for doubles match
   */
  public async sendPartnerInvitation(data: {
    recipientId: string;
    recipientName: string;
    eventId: string;
    eventTitle: string;
    inviterName: string;
  }): Promise<void> {
    try {
      // Schedule local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('services.notification.partnerInvite'),
          body: i18n.t('services.notification.partnerInviteBody', {
            inviterName: data.inviterName,
            eventTitle: data.eventTitle,
          }),
          data: {
            type: 'partner_invitation',
            eventId: data.eventId,
            screen: 'MyProfile',
            tab: 'activities',
          },
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log('✅ Partner invitation notification sent to:', data.recipientName);
    } catch (error) {
      console.error('❌ Error sending partner invitation notification:', error);
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  public isWithinQuietHours(preferences: NotificationPreferences): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const startTime = parseInt(preferences.quietHoursStart.replace(':', ''));
    const endTime = parseInt(preferences.quietHoursEnd.replace(':', ''));

    if (startTime > endTime) {
      // Quiet hours span midnight (e.g., 22:00 to 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Quiet hours within same day
      return currentTime >= startTime && currentTime <= endTime;
    }
  }
}

export default NotificationService;
