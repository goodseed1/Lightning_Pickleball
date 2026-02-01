import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// 📱 [KIM FIX] Get build number for both iOS and Android
const getBuildNumber = (): string => {
  const config = Constants.expoConfig;
  if (Platform.OS === 'ios') {
    return config?.ios?.buildNumber || '';
  }
  return config?.android?.versionCode?.toString() || '';
};
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface LocationPermissionInfo {
  icon: string;
  iconColor: string;
  descriptionText: string;
}

interface SettingsTabSectionProps {
  // 🆕 Category notification master toggles
  chatCategoryNotifications: boolean;
  inviteCategoryNotifications: boolean;
  competitionCategoryNotifications: boolean;
  clubCategoryNotifications: boolean;
  achievementCategoryNotifications: boolean;
  onChatCategoryChange: (value: boolean) => void;
  onInviteCategoryChange: (value: boolean) => void;
  onCompetitionCategoryChange: (value: boolean) => void;
  onClubCategoryChange: (value: boolean) => void;
  onAchievementCategoryChange: (value: boolean) => void;

  // Legacy props (kept for backward compatibility)
  lightningMatchNotifications: boolean;
  chatNotifications: boolean;
  locationPermissionStatus: string;
  onLightningMatchNotificationsChange: (value: boolean) => void;
  onChatNotificationsChange: (value: boolean) => void;
  onLocationPermissionPress: () => void;
  onEditProfile: () => void;
  onLanguageSettings: () => void;
  onThemeSettings: () => void;
  onPrivacySettings: () => void;
  onNotificationSettings: () => void; // Phase 4: Navigate to notification settings
  onLogout: () => void;
  onDeleteAccount: () => void; // 🗑️ Delete account action
  isAdmin?: boolean; // 🔒 Admin privilege flag
  onAdminDashboard?: () => void; // 🔒 Navigate to admin dashboard
  getLocationPermissionInfo: () => LocationPermissionInfo;
  getCurrentThemeText: () => string;
}

const SettingsTabSection: React.FC<SettingsTabSectionProps> = ({
  // 🆕 Category notification props
  chatCategoryNotifications,
  inviteCategoryNotifications,
  competitionCategoryNotifications,
  clubCategoryNotifications,
  achievementCategoryNotifications,
  onChatCategoryChange,
  onInviteCategoryChange,
  onCompetitionCategoryChange,
  onClubCategoryChange,
  onAchievementCategoryChange,
  // Legacy props (kept for backward compatibility, used in other components)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lightningMatchNotifications,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chatNotifications,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLightningMatchNotificationsChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChatNotificationsChange,
  onLocationPermissionPress,
  onEditProfile,
  onLanguageSettings,
  onThemeSettings,
  onPrivacySettings,
  onNotificationSettings,
  onLogout,
  onDeleteAccount,
  isAdmin,
  onAdminDashboard,
  getLocationPermissionInfo,
  getCurrentThemeText,
}) => {
  const { theme: currentTheme, setThemePreference } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* 🆕 Category Notification Toggles Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>{t('profile.settings.notifications')}</Text>

        {/* 📬 채팅 알림 카테고리 */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='chatbubble-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.settingsTab.chatCategory')}</Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.chatCategoryDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={chatCategoryNotifications}
            onValueChange={onChatCategoryChange}
            trackColor={{ false: themeColors.colors.outline, true: themeColors.colors.primary }}
            thumbColor={
              chatCategoryNotifications
                ? themeColors.colors.surface
                : themeColors.colors.surfaceVariant
            }
          />
        </View>

        {/* 🤝 초대 알림 카테고리 */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='person-add-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.inviteCategory')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.inviteCategoryDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={inviteCategoryNotifications}
            onValueChange={onInviteCategoryChange}
            trackColor={{ false: themeColors.colors.outline, true: themeColors.colors.primary }}
            thumbColor={
              inviteCategoryNotifications
                ? themeColors.colors.surface
                : themeColors.colors.surfaceVariant
            }
          />
        </View>

        {/* 🏆 대회 알림 카테고리 */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons name='trophy-outline' size={24} color={themeColors.colors.onSurfaceVariant} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.competitionCategory')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.competitionCategoryDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={competitionCategoryNotifications}
            onValueChange={onCompetitionCategoryChange}
            trackColor={{ false: themeColors.colors.outline, true: themeColors.colors.primary }}
            thumbColor={
              competitionCategoryNotifications
                ? themeColors.colors.surface
                : themeColors.colors.surfaceVariant
            }
          />
        </View>

        {/* 🏠 클럽 알림 카테고리 */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons name='home-outline' size={24} color={themeColors.colors.onSurfaceVariant} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.settingsTab.clubCategory')}</Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.clubCategoryDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={clubCategoryNotifications}
            onValueChange={onClubCategoryChange}
            trackColor={{ false: themeColors.colors.outline, true: themeColors.colors.primary }}
            thumbColor={
              clubCategoryNotifications
                ? themeColors.colors.surface
                : themeColors.colors.surfaceVariant
            }
          />
        </View>

        {/* 🎖️ 업적 알림 카테고리 */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons name='ribbon-outline' size={24} color={themeColors.colors.onSurfaceVariant} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.achievementCategory')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.achievementCategoryDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={achievementCategoryNotifications}
            onValueChange={onAchievementCategoryChange}
            trackColor={{ false: themeColors.colors.outline, true: themeColors.colors.primary }}
            thumbColor={
              achievementCategoryNotifications
                ? themeColors.colors.surface
                : themeColors.colors.surfaceVariant
            }
          />
        </View>

        {/* ⚙️ 상세 알림 설정 링크 */}
        <TouchableOpacity style={styles.settingsItem} onPress={onNotificationSettings}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='settings-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.notificationSettings')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.notificationSettingsDesc')}
              </Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* 🔒 Admin Section - Only visible to admins */}
      {isAdmin && onAdminDashboard && (
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>{t('profile.settingsTab.administrator')}</Text>

          <TouchableOpacity style={styles.adminButton} onPress={onAdminDashboard}>
            <Ionicons name='shield-checkmark' size={24} color='#FFD700' />
            <View style={styles.settingsItemText}>
              <Text style={styles.adminButtonText}>{t('profile.settingsTab.adminDashboard')}</Text>
              <Text style={styles.adminButtonSubtitle}>
                {t('profile.settingsTab.adminDashboardDesc')}
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#FFD700' />
          </TouchableOpacity>
        </View>
      )}

      {/* Permissions Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>{t('profile.settingsTab.permissions')}</Text>

        <TouchableOpacity style={styles.settingsItem} onPress={onLocationPermissionPress}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name={getLocationPermissionInfo().icon as 'location-outline'}
              size={24}
              color={getLocationPermissionInfo().iconColor}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.locationServices')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {getLocationPermissionInfo().descriptionText}
              </Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Profile Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>{t('profile.settings.profileSettings')}</Text>

        <TouchableOpacity style={styles.settingsItem} onPress={onEditProfile}>
          <View style={styles.settingsItemContent}>
            <Ionicons name='create-outline' size={24} color={themeColors.colors.onSurfaceVariant} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.editProfile')}</Text>
              <Text style={styles.settingsItemSubtitle}>{t('profile.editProfileDescription')}</Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* App Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>{t('profile.settings.appSettings')}</Text>

        {/* Quick Dark Mode Toggle */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name={currentTheme === 'dark' ? 'moon' : 'sunny'}
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.settingsTab.darkMode')}</Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.darkModeDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={currentTheme === 'dark'}
            onValueChange={value => {
              setThemePreference(value ? 'dark' : 'light');
            }}
            trackColor={{ false: themeColors.colors.outline, true: themeColors.colors.primary }}
            thumbColor={
              currentTheme === 'dark'
                ? themeColors.colors.surface
                : themeColors.colors.surfaceVariant
            }
          />
        </View>

        <TouchableOpacity style={styles.settingsItem} onPress={onLanguageSettings}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='language-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.languageSettings')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.currentLanguage')}
              </Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} onPress={onThemeSettings}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='color-palette-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.settingsTab.themeSettings')}</Text>
              <Text style={styles.settingsItemSubtitle}>{getCurrentThemeText()}</Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} onPress={onPrivacySettings}>
          <View style={styles.settingsItemContent}>
            <Ionicons name='shield-outline' size={24} color={themeColors.colors.onSurfaceVariant} />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>
                {t('profile.settingsTab.privacySettings')}
              </Text>
              <Text style={styles.settingsItemSubtitle}>
                {t('profile.settingsTab.privacySettingsDesc')}
              </Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.settingsItem}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='information-circle-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.settingsTab.version')}</Text>
              <Text style={styles.settingsItemSubtitle}>
                {/* 📱 [KIM FIX] Version with build number: "2.0.11 (30)" */}
                {`${Constants.expoConfig?.version || '1.0.0'} (${getBuildNumber()})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.settingsItem} onPress={onLogout}>
          <View style={styles.settingsItemContent}>
            <Ionicons
              name='log-out-outline'
              size={24}
              color={themeColors.colors.onSurfaceVariant}
            />
            <View style={styles.settingsItemText}>
              <Text style={styles.settingsItemTitle}>{t('profile.settingsTab.signOut')}</Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={20} color={themeColors.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Danger Zone - Delete Account (Separated for safety) */}
      {/* Admin users cannot delete their account - hide danger zone */}
      {!isAdmin && (
        <View style={styles.dangerSection}>
          <Text style={styles.dangerSectionTitle}>{t('profile.settingsTab.dangerZone')}</Text>
          <Text style={styles.dangerWarningText}>{t('profile.settingsTab.dangerZoneWarning')}</Text>

          <TouchableOpacity style={styles.deleteAccountButton} onPress={onDeleteAccount}>
            <Ionicons name='warning-outline' size={24} color={themeColors.colors.error} />
            <Text style={styles.deleteAccountText}>{t('profile.settingsTab.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    tabContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
    settingsSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      padding: 16,
    },
    settingsSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 16,
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingsItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingsItemText: {
      marginLeft: 16,
      flex: 1,
    },
    settingsItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    settingsItemSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    logoutText: {
      marginLeft: 12,
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
    dangerSection: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      marginHorizontal: 16,
      marginVertical: 8,
      marginTop: 24,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    dangerSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.error,
      marginBottom: 8,
    },
    dangerWarningText: {
      fontSize: 14,
      color: colors.error,
      marginBottom: 16,
      opacity: 0.8,
    },
    deleteAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
    deleteAccountText: {
      marginLeft: 12,
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
    adminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#FFD700',
      padding: 16,
      gap: 12,
    },
    adminButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFD700',
      marginBottom: 4,
    },
    adminButtonSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 215, 0, 0.8)',
    },
  });

export default React.memo(SettingsTabSection);
