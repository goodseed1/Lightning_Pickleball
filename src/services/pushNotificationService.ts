/**
 * Push Notification Service for Lightning Pickleball
 * Handles Firebase Cloud Messaging (FCM) for real-time notifications
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NotificationBehavior } from 'expo-notifications';
import * as Device from 'expo-device';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: {
    type:
      | 'club_application'
      | 'approval_confirmed'
      | 'new_member_joined'
      | 'match_invite'
      | 'trophy_awarded' // 🏆 Project Olympus: Trophy earned notification
      | 'badge_earned' // 🏅 Project Olympus: Badge unlocked notification
      | 'tournament_completed' // 🎾 Project Olympus: Tournament finished
      | 'feedback_response' // 📬 Admin feedback response notification
      | 'general';
    clubId?: string;
    applicantId?: string;
    targetScreen?: string;
    // 🆕 Project Olympus: Trophy/Badge specific data
    trophyId?: string;
    trophyType?: 'tournament_winner' | 'tournament_runnerup';
    badgeId?: string;
    badgeName?: string;
    tournamentId?: string;
    tournamentName?: string;
    [key: string]: unknown;
  };
}

export interface NotificationPreferences {
  clubApplications: boolean;
  matchInvites: boolean;
  clubUpdates: boolean;
  socialActivities: boolean;
  generalAnnouncements: boolean;
}

// Local interface for Firebase User to avoid type errors
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;

  constructor() {
    console.log('🔔 PushNotificationService initialized');
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing push notification service...');

      // 🤖 [Android] Create notification channel - REQUIRED for Android 8.0+
      if (Platform.OS === 'android') {
        await this.createAndroidNotificationChannels();
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async (): Promise<NotificationBehavior> => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions and get token
      const token = await this.registerForPushNotifications();
      if (token) {
        await this.saveTokenToFirebase(token);
      }

      this.isInitialized = true;
      console.log('✅ Push notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize push notification service:', error);
      throw error;
    }
  }

  /**
   * 🤖 [Android] Create notification channels - REQUIRED for Android 8.0+
   * Without channels, notifications will NOT appear on Android!
   *
   * 🎯 [KIM FIX] 백엔드 Cloud Functions에서 사용하는 모든 channelId와 일치하도록 채널 생성
   */
  private async createAndroidNotificationChannels(): Promise<void> {
    try {
      console.log('📱 Creating Android notification channels...');

      // Default channel for general notifications
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1976d2',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Club notifications channel
      await Notifications.setNotificationChannelAsync('club', {
        name: 'Club Notifications',
        description: 'Club applications, approvals, and updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1976d2',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Match notifications channel
      await Notifications.setNotificationChannelAsync('match', {
        name: 'Match Notifications',
        description: 'Match invites and results',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4caf50',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Chat notifications channel
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Chat Messages',
        description: 'Direct messages and club chat',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#2196f3',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // 🎯 [KIM FIX] 추가 채널들 - 백엔드에서 사용하는 모든 channelId 커버
      // Events channel
      await Notifications.setNotificationChannelAsync('events', {
        name: 'Events',
        description: 'Event notifications and updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff9800',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Lightning Pickleball Events (legacy)
      await Notifications.setNotificationChannelAsync('lightning_pickleball_events', {
        name: 'Lightning Pickleball Events',
        description: 'Lightning match events',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1976d2',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Team invitations
      await Notifications.setNotificationChannelAsync('team-invitations', {
        name: 'Team Invitations',
        description: 'Team invitation notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9c27b0',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Partner invitations
      await Notifications.setNotificationChannelAsync('partner-invitations', {
        name: 'Partner Invitations',
        description: 'Partner invitation notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e91e63',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Tournaments
      await Notifications.setNotificationChannelAsync('tournaments', {
        name: 'Tournaments',
        description: 'Tournament notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ffc107',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Leagues
      await Notifications.setNotificationChannelAsync('leagues', {
        name: 'Leagues',
        description: 'League notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00bcd4',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Achievements
      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Achievements',
        description: 'Badge and trophy notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ffeb3b',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Meetup notifications
      await Notifications.setNotificationChannelAsync('meetup_notifications', {
        name: 'Meetup Reminders',
        description: 'Regular meetup reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8bc34a',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Solo lobby
      await Notifications.setNotificationChannelAsync('solo-lobby', {
        name: 'Solo Lobby',
        description: 'Solo lobby matching notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3f51b5',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // 🌍 Announcements (Season notifications, etc.)
      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        description: 'Season announcements and general updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff5722',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      console.log('✅ Android notification channels created successfully (15 channels)');
    } catch (error) {
      console.error('❌ Error creating Android notification channels:', error);
    }
  }

  /**
   * Register for push notifications and get token
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      console.log('📱 Registering for push notifications...');

      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Get existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Push notification permission denied');
        return null;
      }

      // Get push token - projectId is REQUIRED for standalone builds!
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: '21147a75-4071-46b1-b5c2-41916ccce97a', // From app.json eas.projectId
        })
      ).data;
      console.log('✅ Push token obtained:', token);

      return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firebase for the current user
   */
  private async saveTokenToFirebase(token: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser() as FirebaseUser | null;
      if (!currentUser) {
        console.warn('⚠️ No authenticated user to save token for');
        return;
      }

      const tokenData = {
        token,
        userId: currentUser.uid,
        platform: Platform.OS,
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      // Save token to user's document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        pushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
      });

      // Also save to dedicated push_tokens collection for efficient querying
      const tokenRef = doc(db, 'push_tokens', currentUser.uid);
      await setDoc(tokenRef, tokenData, { merge: true });

      console.log('✅ Push token saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving push token to Firebase:', error);
    }
  }

  /**
   * Send notification to club administrators
   */
  async sendToClubAdmins(clubId: string, notification: PushNotificationData): Promise<void> {
    try {
      console.log('📨 Sending notification to club admins:', { clubId, notification });

      // Get club admin user IDs
      const adminIds = await this.getClubAdminIds(clubId);
      if (adminIds.length === 0) {
        console.warn('⚠️ No admins found for club:', clubId);
        return;
      }

      // Send to each admin
      for (const adminId of adminIds) {
        await this.sendToUser(adminId, notification);
      }

      // Log notification to Firebase for tracking
      await this.logNotification(clubId, adminIds, notification);

      console.log('✅ Notification sent to club admins successfully');
    } catch (error) {
      console.error('❌ Error sending notification to club admins:', error);
      throw error;
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, notification: PushNotificationData): Promise<void> {
    try {
      console.log('📨 Sending notification to user:', { userId, notification });

      // Get user's push token
      const pushToken = await this.getUserPushToken(userId);
      if (!pushToken) {
        console.warn('⚠️ No push token found for user:', userId);
        return;
      }

      // Check user's notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      if (!this.shouldSendNotification(notification, preferences)) {
        console.log('⏭️ Notification skipped due to user preferences');
        return;
      }

      // Send via Expo push notification service
      await this.sendPushNotification(pushToken, notification);

      console.log('✅ Notification sent to user successfully');
    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users (bulk notification)
   */
  async sendBulkNotification(userIds: string[], notification: PushNotificationData): Promise<void> {
    try {
      console.log(`📨 Sending bulk notification to ${userIds.length} users`);

      // Send notifications in parallel
      const promises = userIds.map(userId =>
        this.sendToUser(userId, notification).catch((error: Error) => {
          console.error(`Failed to send notification to user ${userId}:`, error);
          // Don't throw, continue with other users
        })
      );

      await Promise.all(promises);
      console.log('✅ Bulk notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending bulk notification:', error);
      throw error;
    }
  }

  /**
   * Get club admin user IDs
   */
  private async getClubAdminIds(clubId: string): Promise<string[]> {
    try {
      const membersRef = collection(db, 'clubMembers');
      const q = query(
        membersRef,
        where('clubId', '==', clubId),
        where('role', '==', 'admin'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const adminIds = snapshot.docs.map(doc => doc.data().userId);

      console.log(`🔍 Found ${adminIds.length} club admins for club ${clubId}`);
      return adminIds;
    } catch (error) {
      console.error('❌ Error getting club admin IDs:', error);
      return [];
    }
  }

  /**
   * Get user's push token from Firebase
   */
  private async getUserPushToken(userId: string): Promise<string | null> {
    try {
      const tokenRef = doc(db, 'push_tokens', userId);
      const tokenDoc = await getDoc(tokenRef);

      if (tokenDoc.exists()) {
        const data = tokenDoc.data();
        return data.isActive ? data.token : null;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting user push token:', error);
      return null;
    }
  }

  /**
   * Get user's notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.notificationPreferences || this.getDefaultPreferences();
      }

      return this.getDefaultPreferences();
    } catch (error) {
      console.error('❌ Error getting user notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      clubApplications: true,
      matchInvites: true,
      clubUpdates: true,
      socialActivities: true,
      generalAnnouncements: true,
    };
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    notification: PushNotificationData,
    preferences: NotificationPreferences
  ): boolean {
    const notificationType = notification.data?.type || 'general';

    switch (notificationType) {
      case 'club_application':
        return preferences.clubApplications;
      case 'approval_confirmed':
        return preferences.clubUpdates;
      case 'new_member_joined':
        return preferences.socialActivities;
      case 'match_invite':
        return preferences.matchInvites;
      case 'feedback_response':
        return true; // Always send feedback responses
      default:
        return preferences.generalAnnouncements;
    }
  }

  /**
   * Send push notification via Expo
   */
  private async sendPushNotification(
    pushToken: string,
    notification: PushNotificationData
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default' as const,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high' as const,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('❌ Push notification errors:', result.errors);
        throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
      }

      console.log('✅ Push notification sent successfully:', result);
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Log notification to Firebase for tracking and analytics
   */
  private async logNotification(
    clubId: string,
    recipientIds: string[],
    notification: PushNotificationData
  ): Promise<void> {
    try {
      const logData = {
        clubId,
        recipientIds,
        notification: {
          title: notification.title,
          body: notification.body,
          type: notification.data?.type || 'general',
        },
        sentAt: serverTimestamp(),
        status: 'sent',
      };

      await setDoc(doc(collection(db, 'notification_logs')), logData);
    } catch (error) {
      console.error('❌ Error logging notification:', error);
      // Don't throw error here - logging failure shouldn't break notification sending
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        preferencesUpdatedAt: serverTimestamp(),
      });

      console.log('✅ Notification preferences updated');
    } catch (error) {
      console.error('❌ Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Disable notifications for a user (e.g., when they log out)
   */
  async disableNotifications(userId: string): Promise<void> {
    try {
      const tokenRef = doc(db, 'push_tokens', userId);
      await updateDoc(tokenRef, {
        isActive: false,
        disabledAt: serverTimestamp(),
      });

      console.log('✅ Notifications disabled for user:', userId);
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
    }
  }

  /**
   * Re-enable notifications for a user
   */
  async enableNotifications(userId: string): Promise<void> {
    try {
      // Get fresh token
      const token = await this.registerForPushNotifications();
      if (token) {
        await this.saveTokenToFirebase(token);
        console.log('✅ Notifications re-enabled for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
    }
  }
}

// Export singleton instance
const pushNotificationService = PushNotificationService.getInstance();
export default pushNotificationService;
