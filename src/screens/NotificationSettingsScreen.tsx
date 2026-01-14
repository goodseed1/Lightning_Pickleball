/**
 * Notification Settings Screen
 * Allows users to customize notification preferences with category master toggles.
 *
 * 🆕 Phase 2 Update (2025-01-08):
 * - Reorganized into 5 categories matching Settings Tab
 * - Added category master toggles synced with userSettings collection
 * - Added invite category with partner/team/club/friend notifications
 *
 * Created: 2025-11-23 (Phase 4 - Push Notification System)
 * Updated: 2025-01-08 (Phase 2 - Category Master Toggles)
 * Author: Captain America (via Kim)
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Switch, Text, Divider, ActivityIndicator, Appbar, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningPickleballTheme } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

// ============================================
// 📋 TYPES & INTERFACES
// ============================================

interface NotificationSettings {
  // 📬 Chat notifications
  eventChatNotifications: boolean;
  clubChatNotifications: boolean;
  directChatNotifications: boolean;

  // 🤝 Invite notifications (NEW)
  partnerInviteNotifications: boolean;
  teamInviteNotifications: boolean;
  clubInviteNotifications: boolean;
  friendRequestNotifications: boolean;

  // 🏆 Competition notifications
  tournamentNotifications: boolean;
  leagueNotifications: boolean;
  matchNotifications: boolean;

  // 🏠 Club notifications
  clubEventNotifications: boolean;
  clubAnnouncementNotifications: boolean;
  clubDuesNotifications: boolean;

  // 🎖️ Achievement notifications
  trophyNotifications: boolean;
  badgeNotifications: boolean;

  // ⏰ Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface CategorySettings {
  chatCategoryNotifications: boolean;
  inviteCategoryNotifications: boolean;
  competitionCategoryNotifications: boolean;
  clubCategoryNotifications: boolean;
  achievementCategoryNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  // Chat
  eventChatNotifications: true,
  clubChatNotifications: true,
  directChatNotifications: true,
  // Invite
  partnerInviteNotifications: true,
  teamInviteNotifications: true,
  clubInviteNotifications: true,
  friendRequestNotifications: true,
  // Competition
  tournamentNotifications: true,
  leagueNotifications: true,
  matchNotifications: true,
  // Club
  clubEventNotifications: true,
  clubAnnouncementNotifications: true,
  clubDuesNotifications: true,
  // Achievement
  trophyNotifications: true,
  badgeNotifications: true,
  // Quiet hours
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

const DEFAULT_CATEGORY_SETTINGS: CategorySettings = {
  chatCategoryNotifications: true,
  inviteCategoryNotifications: true,
  competitionCategoryNotifications: true,
  clubCategoryNotifications: true,
  achievementCategoryNotifications: true,
};

// ============================================
// 🎨 COMPONENT
// ============================================

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { theme: currentTheme } = useTheme();
  const paperTheme = getLightningPickleballTheme(currentTheme);
  const { t } = useLanguage();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [categorySettings, setCategorySettings] =
    useState<CategorySettings>(DEFAULT_CATEGORY_SETTINGS);
  const [loading, setLoading] = useState(true);

  // ============================================
  // 📥 LOAD SETTINGS
  // ============================================

  const loadSettings = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Load detailed notification settings from users collection
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const savedSettings = userData.notificationSettings || {};

        setSettings({
          ...DEFAULT_SETTINGS,
          ...savedSettings,
        });
      }

      // 🔄 Load category settings from users collection (synced with Settings Tab)
      // Settings Tab saves to: users/{userId}/notificationSettings.{category}CategoryEnabled
      if (userSnap.exists()) {
        const notificationSettings = userSnap.data().notificationSettings || {};
        setCategorySettings({
          chatCategoryNotifications: notificationSettings.chatCategoryEnabled !== false,
          inviteCategoryNotifications: notificationSettings.inviteCategoryEnabled !== false,
          competitionCategoryNotifications:
            notificationSettings.competitionCategoryEnabled !== false,
          clubCategoryNotifications: notificationSettings.clubCategoryEnabled !== false,
          achievementCategoryNotifications:
            notificationSettings.achievementCategoryEnabled !== false,
        });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert(t('alert.title.error'), t('alert.notification.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, t]);

  // 🔄 Reload settings when screen gains focus (sync with Settings Tab changes)
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  // ============================================
  // 💾 SAVE SETTINGS
  // ============================================

  const updateSetting = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!currentUser?.uid) {
      Alert.alert(t('alert.title.error'), t('alert.notification.loginRequired'));
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        notificationSettings: newSettings,
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert(t('alert.title.error'), t('alert.notification.saveFailed'));
      setSettings(settings); // Revert on error
    }
  };

  const updateCategorySetting = async <K extends keyof CategorySettings>(
    key: K,
    value: boolean
  ) => {
    if (!currentUser?.uid) {
      Alert.alert(t('alert.title.error'), t('alert.notification.loginRequired'));
      return;
    }

    const newCategorySettings = { ...categorySettings, [key]: value };
    setCategorySettings(newCategorySettings);

    try {
      // 🔄 SYNC FIX: Save to same location as Settings Tab
      // Settings Tab saves to: users/{userId}/notificationSettings.{category}CategoryEnabled
      // Map key: chatCategoryNotifications → chatCategoryEnabled
      const fieldName = key.replace('Notifications', 'Enabled');
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`notificationSettings.${fieldName}`]: value,
      });
    } catch (error) {
      console.error('Failed to update category setting:', error);
      Alert.alert(t('alert.title.error'), t('alert.notification.saveFailed'));
      setCategorySettings(categorySettings); // Revert on error
    }
  };

  // ============================================
  // 🎨 RENDER HELPERS
  // ============================================

  const renderCategoryHeader = (
    icon: string,
    titleKey: string,
    descKey: string,
    categoryKey: keyof CategorySettings,
    isEnabled: boolean
  ) => (
    <Card style={[styles.categoryCard, { backgroundColor: paperTheme.colors.surfaceVariant }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <Text variant='titleMedium' style={styles.categoryTitle}>
            {icon} {t(titleKey)}
          </Text>
          <Text
            variant='bodySmall'
            style={[styles.categoryDesc, { color: paperTheme.colors.onSurfaceVariant }]}
          >
            {t(descKey)}
          </Text>
        </View>
        <Switch value={isEnabled} onValueChange={v => updateCategorySetting(categoryKey, v)} />
      </View>
    </Card>
  );

  const renderSettingRow = (
    titleKey: string,
    descKey: string,
    settingKey: keyof NotificationSettings,
    value: boolean,
    categoryEnabled: boolean
  ) => (
    <View style={[styles.settingRow, !categoryEnabled && styles.settingDisabled]}>
      <View style={styles.settingText}>
        <Text
          variant='bodyLarge'
          style={!categoryEnabled && { color: paperTheme.colors.onSurfaceDisabled }}
        >
          {t(titleKey)}
        </Text>
        <Text
          variant='bodySmall'
          style={[
            styles.settingDescription,
            !categoryEnabled && { color: paperTheme.colors.onSurfaceDisabled },
          ]}
        >
          {t(descKey)}
        </Text>
      </View>
      <Switch
        value={value && categoryEnabled}
        onValueChange={v => updateSetting(settingKey, v)}
        disabled={!categoryEnabled}
      />
    </View>
  );

  // ============================================
  // 🖼️ RENDER
  // ============================================

  if (loading) {
    return (
      <>
        <Appbar.Header style={{ backgroundColor: paperTheme.colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('notificationSettings.title')} />
        </Appbar.Header>
        <SafeAreaView
          style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
          edges={['bottom', 'left', 'right']}
        >
          <ActivityIndicator size='large' />
          <Text style={styles.loadingText}>{t('notificationSettings.loading')}</Text>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Appbar.Header style={{ backgroundColor: paperTheme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('notificationSettings.title')} />
      </Appbar.Header>
      <SafeAreaView
        style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ============================================ */}
          {/* 📬 CHAT CATEGORY */}
          {/* ============================================ */}
          {renderCategoryHeader(
            '📬',
            'notificationSettings.chat.title',
            'notificationSettings.chat.description',
            'chatCategoryNotifications',
            categorySettings.chatCategoryNotifications
          )}

          {renderSettingRow(
            'notificationSettings.chat.eventChat',
            'notificationSettings.chat.eventChatDesc',
            'eventChatNotifications',
            settings.eventChatNotifications,
            categorySettings.chatCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.chat.clubChat',
            'notificationSettings.chat.clubChatDesc',
            'clubChatNotifications',
            settings.clubChatNotifications,
            categorySettings.chatCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.chat.directChat',
            'notificationSettings.chat.directChatDesc',
            'directChatNotifications',
            settings.directChatNotifications,
            categorySettings.chatCategoryNotifications
          )}

          <Divider style={styles.divider} />

          {/* ============================================ */}
          {/* 🤝 INVITE CATEGORY */}
          {/* ============================================ */}
          {renderCategoryHeader(
            '🤝',
            'notificationSettings.invite.title',
            'notificationSettings.invite.description',
            'inviteCategoryNotifications',
            categorySettings.inviteCategoryNotifications
          )}

          {renderSettingRow(
            'notificationSettings.invite.partner',
            'notificationSettings.invite.partnerDesc',
            'partnerInviteNotifications',
            settings.partnerInviteNotifications,
            categorySettings.inviteCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.invite.team',
            'notificationSettings.invite.teamDesc',
            'teamInviteNotifications',
            settings.teamInviteNotifications,
            categorySettings.inviteCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.invite.club',
            'notificationSettings.invite.clubDesc',
            'clubInviteNotifications',
            settings.clubInviteNotifications,
            categorySettings.inviteCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.invite.friend',
            'notificationSettings.invite.friendDesc',
            'friendRequestNotifications',
            settings.friendRequestNotifications,
            categorySettings.inviteCategoryNotifications
          )}

          <Divider style={styles.divider} />

          {/* ============================================ */}
          {/* 🏆 COMPETITION CATEGORY */}
          {/* ============================================ */}
          {renderCategoryHeader(
            '🏆',
            'notificationSettings.competition.title',
            'notificationSettings.competition.description',
            'competitionCategoryNotifications',
            categorySettings.competitionCategoryNotifications
          )}

          {renderSettingRow(
            'notificationSettings.competition.tournament',
            'notificationSettings.competition.tournamentDesc',
            'tournamentNotifications',
            settings.tournamentNotifications,
            categorySettings.competitionCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.competition.league',
            'notificationSettings.competition.leagueDesc',
            'leagueNotifications',
            settings.leagueNotifications,
            categorySettings.competitionCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.competition.match',
            'notificationSettings.competition.matchDesc',
            'matchNotifications',
            settings.matchNotifications,
            categorySettings.competitionCategoryNotifications
          )}

          <Divider style={styles.divider} />

          {/* ============================================ */}
          {/* 🏠 CLUB CATEGORY */}
          {/* ============================================ */}
          {renderCategoryHeader(
            '🏠',
            'notificationSettings.club.title',
            'notificationSettings.club.description',
            'clubCategoryNotifications',
            categorySettings.clubCategoryNotifications
          )}

          {renderSettingRow(
            'notificationSettings.club.event',
            'notificationSettings.club.eventDesc',
            'clubEventNotifications',
            settings.clubEventNotifications,
            categorySettings.clubCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.club.announcement',
            'notificationSettings.club.announcementDesc',
            'clubAnnouncementNotifications',
            settings.clubAnnouncementNotifications,
            categorySettings.clubCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.club.dues',
            'notificationSettings.club.duesDesc',
            'clubDuesNotifications',
            settings.clubDuesNotifications,
            categorySettings.clubCategoryNotifications
          )}

          <Divider style={styles.divider} />

          {/* ============================================ */}
          {/* 🎖️ ACHIEVEMENT CATEGORY */}
          {/* ============================================ */}
          {renderCategoryHeader(
            '🎖️',
            'notificationSettings.achievement.title',
            'notificationSettings.achievement.description',
            'achievementCategoryNotifications',
            categorySettings.achievementCategoryNotifications
          )}

          {renderSettingRow(
            'notificationSettings.achievement.trophy',
            'notificationSettings.achievement.trophyDesc',
            'trophyNotifications',
            settings.trophyNotifications,
            categorySettings.achievementCategoryNotifications
          )}
          {renderSettingRow(
            'notificationSettings.achievement.badge',
            'notificationSettings.achievement.badgeDesc',
            'badgeNotifications',
            settings.badgeNotifications,
            categorySettings.achievementCategoryNotifications
          )}

          <Divider style={styles.divider} />

          {/* ============================================ */}
          {/* ⏰ QUIET HOURS */}
          {/* ============================================ */}
          <Text variant='titleLarge' style={styles.sectionTitle}>
            ⏰ {t('notificationSettings.quietHours.title')}
          </Text>
          <Text variant='bodySmall' style={styles.sectionDescription}>
            {t('notificationSettings.quietHours.description')}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text variant='bodyLarge'>{t('notificationSettings.quietHours.enable')}</Text>
              <Text variant='bodySmall' style={styles.settingDescription}>
                {settings.quietHoursEnabled
                  ? `${settings.quietHoursStart} ~ ${settings.quietHoursEnd}`
                  : t('notificationSettings.quietHours.disabled')}
              </Text>
            </View>
            <Switch
              value={settings.quietHoursEnabled}
              onValueChange={v => updateSetting('quietHoursEnabled', v)}
            />
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// ============================================
// 🎨 STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },

  // Category card styles
  categoryCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 16,
  },
  categoryTitle: {
    fontWeight: 'bold',
  },
  categoryDesc: {
    marginTop: 2,
  },

  // Section styles (for Quiet Hours)
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  sectionDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },

  // Setting row styles
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  settingDisabled: {
    opacity: 0.5,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    marginTop: 4,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
});

export default NotificationSettingsScreen;
