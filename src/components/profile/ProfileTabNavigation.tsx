import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

export type MainTabType = 'information' | 'stats' | 'activity' | 'friends' | 'settings';

interface ProfileTabNavigationProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  pendingFriendRequestsCount?: number;
  pendingActivityCount?: number; // 🎯 [KIM FIX] Badge count for activity tab (pending applications) - YELLOW
  unreadEventChatCount?: number; // 🎯 [KIM FIX] Badge count for unread chat messages - RED
}

const ProfileTabNavigation: React.FC<ProfileTabNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingFriendRequestsCount = 0,
  pendingActivityCount = 0, // 🎯 [KIM FIX] Yellow badge - pending applications
  unreadEventChatCount = 0, // 🎯 [KIM FIX] Red badge - unread chat messages
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);
  const { t } = useTranslation();

  const tabs = [
    {
      key: 'information' as MainTabType,
      label: t('profile.tabs.information'),
      icon: 'person-outline',
    },
    {
      key: 'stats' as MainTabType,
      label: t('profile.tabs.stats'),
      icon: 'stats-chart-outline',
    },
    {
      key: 'activity' as MainTabType,
      label: t('profile.tabs.activity'),
      icon: 'calendar-outline',
    },
    {
      key: 'friends' as MainTabType,
      label: t('profile.tabs.friends'),
      icon: 'people-outline',
    },
    {
      key: 'settings' as MainTabType,
      label: t('profile.tabs.settings'),
      icon: 'settings-outline',
    },
  ];

  return (
    <View style={styles.mainTabs}>
      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.mainTab, activeTab === tab.key && styles.activeMainTab]}
            onPress={() => onTabChange(tab.key)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={tab.icon as any}
                size={18}
                color={
                  activeTab === tab.key
                    ? themeColors.colors.primary
                    : themeColors.colors.onSurfaceVariant
                }
              />
              {/* 🤝 [FRIENDSHIP] Badge for pending friend requests */}
              {tab.key === 'friends' && pendingFriendRequestsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingFriendRequestsCount > 9 ? '9+' : pendingFriendRequestsCount}
                  </Text>
                </View>
              )}
              {/* 🎯 [KIM FIX] Dual badges for activity tab */}
              {tab.key === 'activity' && (pendingActivityCount > 0 || unreadEventChatCount > 0) && (
                <View style={styles.dualBadgeContainer}>
                  {/* 🟡 Yellow badge - pending applications */}
                  {pendingActivityCount > 0 && (
                    <View style={styles.yellowBadgeInline}>
                      <Text style={styles.badgeText}>
                        {pendingActivityCount > 9 ? '9+' : pendingActivityCount}
                      </Text>
                    </View>
                  )}
                  {/* 🔴 Red badge - unread chat messages */}
                  {unreadEventChatCount > 0 && (
                    <View style={styles.redBadgeInline}>
                      <Text style={styles.badgeText}>
                        {unreadEventChatCount > 9 ? '9+' : unreadEventChatCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <Text style={[styles.mainTabText, activeTab === tab.key && styles.activeMainTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    mainTabs: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    tabsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    mainTab: {
      flexDirection: 'column',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      marginHorizontal: 2,
      borderRadius: 8,
      minWidth: 60,
    },
    activeMainTab: {
      backgroundColor: colors.primaryContainer,
    },
    mainTabText: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    activeMainTabText: {
      color: colors.primary,
    },
    // 🤝 [FRIENDSHIP] Badge styles
    iconContainer: {
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -10,
      backgroundColor: '#F59E0B', // 🟡 Yellow/Amber for friend requests (Red is for unread chat ONLY)
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    // 🎯 [KIM FIX] Container for dual badges (yellow + red side by side)
    dualBadgeContainer: {
      position: 'absolute',
      top: -6,
      right: -10,
      flexDirection: 'row',
      gap: 2,
    },
    // 🎯 [KIM FIX] Inline badges for inside dualBadgeContainer (no position:absolute)
    yellowBadgeInline: {
      backgroundColor: '#F59E0B', // 🟡 Yellow/Amber for pending applications
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    redBadgeInline: {
      backgroundColor: '#EF4444', // 🔴 Red for unread chat messages
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
  });

export default ProfileTabNavigation;
