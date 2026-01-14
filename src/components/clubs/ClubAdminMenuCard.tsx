import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  ClubAdmin: { clubId: string; clubName: string; userRole: string };
  ClubLeagueManagement: { clubId: string };
  ClubTournamentManagement: { clubId: string };
  ClubDuesManagement: { clubId: string; clubName: string };
  EditClubPolicy: { clubId: string; clubName: string };
  ManageAnnouncement: { clubId: string };
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme as useLTTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';

interface AdminMenuItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  badgeCount?: number;
  color?: string;
  styles: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const AdminMenuItem: React.FC<AdminMenuItemProps> = ({
  iconName,
  title,
  subtitle,
  onPress,
  badgeCount,
  color = '#1976d2',
  styles,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      <Ionicons name={iconName} size={24} color={color} />
      {badgeCount && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>

    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>

    <Ionicons name='chevron-forward' size={20} color='#666' />
  </TouchableOpacity>
);

interface ClubAdminMenuCardProps {
  clubId: string;
  clubName?: string;
  userRole: string;
}

// Move createStyles function before component for proper hoisting
const createStyles = (
  colors: any // eslint-disable-line @typescript-eslint/no-explicit-any
) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      margin: 16,
      shadowColor: colors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || colors.outline,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    menuContainer: {
      paddingVertical: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#fff',
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 2,
    },
    menuSubtitle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
  });

const ClubAdminMenuCard: React.FC<ClubAdminMenuCardProps> = ({
  clubId,
  clubName = 'Club',
  userRole,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useLanguage();
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);

  // Apply bulletproof dynamic styling pattern with useMemo
  const styles = React.useMemo(() => createStyles(themeColors.colors), [themeColors.colors]);

  const menuItems = [
    {
      iconName: 'stats-chart-outline' as const,
      title: t('clubAdminMenu.adminDashboard'),
      subtitle: t('clubAdminMenu.adminDashboardSubtitle'),
      onPress: () => navigation.navigate('ClubAdmin', { clubId, clubName, userRole }),
      color: '#1976d2',
    },
    {
      iconName: 'trophy-outline' as const,
      title: t('clubAdminMenu.leagueManagement'),
      subtitle: t('clubAdminMenu.leagueManagementSubtitle'),
      onPress: () => navigation.navigate('ClubLeagueManagement', { clubId }),
      color: '#ff9800',
    },
    {
      iconName: 'medal-outline' as const,
      title: t('clubAdminMenu.tournamentManagement'),
      subtitle: t('clubAdminMenu.tournamentManagementSubtitle'),
      onPress: () => {
        console.log('🎯 [ClubAdminMenuCard] Tournament Management button pressed');
        console.log('🎯 [ClubAdminMenuCard] ClubId:', clubId);
        console.log('🎯 [ClubAdminMenuCard] Navigation object:', navigation);

        try {
          console.log(
            '🎯 [ClubAdminMenuCard] Attempting direct navigation to ClubTournamentManagement...'
          );
          navigation.navigate('ClubTournamentManagement', { clubId });
          console.log('🎯 [ClubAdminMenuCard] Direct navigation completed successfully');
        } catch (error) {
          console.error(
            '🎯 [ClubAdminMenuCard] Direct navigation failed, falling back to nested navigation:',
            error
          );
          console.log('🎯 [ClubAdminMenuCard] Using fallback nested navigation to leagues tab...');
          navigation.navigate('MainTabs', {
            screen: 'MyClubs',
            params: {
              screen: 'ClubDetail',
              params: {
                clubId: clubId,
                initialTab: 'leagues',
              },
            },
          });
        }
      },
      color: '#ffc107',
    },
    {
      iconName: 'megaphone-outline' as const,
      title: t('clubAdminMenu.announcementManagement'),
      subtitle: t('clubAdminMenu.announcementManagementSubtitle'),
      onPress: () => navigation.navigate('ManageAnnouncement', { clubId }),
      color: '#e91e63',
    },
    {
      iconName: 'card-outline' as const,
      title: t('clubAdminMenu.duesManagement'),
      subtitle: t('clubAdminMenu.duesManagementSubtitle'),
      onPress: () => navigation.navigate('ClubDuesManagement', { clubId, clubName }),
      color: '#ff5722',
    },
    // 🎯 [KIM FIX] 클럽 정책 관리 메뉴 제거 - "클럽 설정" 페이지에서 접근 가능
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('clubAdminMenu.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('clubAdminMenu.subtitle')}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <AdminMenuItem
            key={index}
            iconName={item.iconName}
            title={item.title}
            subtitle={item.subtitle}
            onPress={item.onPress}
            color={item.color}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
};

export default ClubAdminMenuCard;
