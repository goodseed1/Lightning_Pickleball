import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Card, Button, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningPickleballTheme } from '../../theme';
import { formatDistance } from '../../utils/unitUtils';
import { formatPriceByCountry } from '../../utils/currencyUtils';
import StatusChip from '../common/StatusChip';

interface ClubCardProps {
  club: {
    id: string;
    name: string;
    memberCount: number;
    distance: number | null | undefined;
    description: string;
    level: string;
    cityName?: string;
    fullAddress?: string;
    city?: string;
    state?: string;
    // 🎯 [KIM FIX] admin/manager 역할 추가
    userStatus?: 'none' | 'admin' | 'manager' | 'member' | 'pending' | 'declined';
    logoUrl?: string;
    location: {
      latitude: number;
      longitude: number;
    };
    createdAt: Date;
    createdBy?: string;
    creatorName?: string; // Host name for display
    // 🎯 [KIM FIX] Club activity stats
    eventCount?: number;
    communicationLevel?: 'active' | 'normal' | 'quiet';
    memberJoined?: number;
    memberLeft?: number;
    monthlyFee?: number;
  };
  onPress: () => void;
  onMapPress?: () => void;
  // 🔔 [IRON MAN] Club notification count for badge display
  notificationCount?: number;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onPress, onMapPress, notificationCount }) => {
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);

  // Get user's country for distance formatting
  const userCountry = currentUser?.profile?.location?.country;

  const getStatusChip = () => {
    switch (club.userStatus) {
      // 🎯 [KIM FIX] 관리자/운영진 역할 배지 추가
      case 'admin':
        return (
          <StatusChip text={t('clubCard.status.admin')} variant='primary' icon='shield-checkmark' />
        );
      case 'manager':
        return <StatusChip text={t('clubCard.status.manager')} variant='info' icon='star' />;
      case 'member':
        return (
          <StatusChip
            text={t('clubCard.status.member')}
            variant='success'
            icon='checkmark-circle'
          />
        );
      case 'pending':
        return <StatusChip text={t('clubCard.status.pending')} variant='warning' icon='time' />;
      case 'declined':
        return (
          <StatusChip text={t('clubCard.status.declined')} variant='error' icon='close-circle' />
        );
      default:
        return <StatusChip text={t('clubCard.status.available')} variant='default' icon='people' />;
    }
  };

  const getActivityLevel = (): string => {
    if (club.memberCount > 50) {
      return t('clubCard.activity.veryActive');
    } else if (club.memberCount > 20) {
      return t('clubCard.activity.active');
    } else {
      return t('clubCard.activity.smallGroup');
    }
  };

  // 🎯 [KIM FIX] Helper functions for stats display
  const getCommunicationLabel = (): string => {
    switch (club.communicationLevel) {
      case 'active':
        return t('clubCard.activity.active');
      case 'normal':
        return t('clubCard.communication.normal');
      default:
        return t('clubCard.communication.quiet');
    }
  };

  // 🌍 국가별 화폐로 회비 포맷팅
  const formatFee = (): string => {
    if (!club.monthlyFee || club.monthlyFee === 0) {
      return t('clubCard.fee.free');
    }
    return `${formatPriceByCountry(club.monthlyFee, userCountry)}/${t('clubCard.fee.perMonth')}`;
  };

  const formatMemberTrend = (): string => {
    const joined = club.memberJoined || 0;
    const left = club.memberLeft || 0;
    return `+${joined}/-${left}`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.card}>
        {/* 1. Header: Integrated Club info + Status */}
        <View style={styles.header}>
          <View style={styles.clubInfoRow}>
            {club.logoUrl && !club.logoUrl.startsWith('file://') ? (
              <Avatar.Image size={42} source={{ uri: club.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <MaterialCommunityIcons name='tennis' size={20} color='white' />
              </View>
            )}
            <View style={styles.clubDetails}>
              <Text style={styles.title}>{club.name}</Text>
              <View style={styles.quickStats}>
                <Text style={styles.memberCount}>
                  👥 {club.memberCount}
                  {t('clubCard.labels.memberCount')} • {getActivityLevel()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            {getStatusChip()}
            {/* 🔔 [IRON MAN] Notification badge */}
            {notificationCount && notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Body: Compact icon-centric information */}
        <Card.Content style={styles.body}>
          <View style={styles.infoGrid}>
            {/* Host info */}
            {club.creatorName ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>👤</Text>
                <Text style={styles.infoText}>
                  {t('clubCard.labels.host')}
                  {club.creatorName}
                </Text>
              </View>
            ) : null}
            {/* Location: City, State only (privacy protection) */}
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>
                {club.city && club.state
                  ? `${club.city}, ${club.state}`
                  : club.city || club.state || club.cityName || 'Location'}
                {typeof club.distance === 'number' && isFinite(club.distance) ? (
                  <Text> • {formatDistance(club.distance, userCountry, t)}</Text>
                ) : club.distance === null ? (
                  <Text style={styles.distanceNA}> • {t('units.distanceNA')}</Text>
                ) : null}
              </Text>
            </View>
          </View>
          {/* 🎯 [KIM FIX] Club Activity Stats Grid (2x2) */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statText}>
                  🏆 {t('clubCard.labels.events')}: {club.eventCount || 0}
                  {t('clubCard.labels.eventsPerMonth')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statText}>
                  💬 {t('clubCard.labels.chat')}: {getCommunicationLabel()}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statText}>
                  📈 {t('clubCard.labels.members')}: {formatMemberTrend()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statText}>
                  💰 {t('clubCard.labels.feeLabel')}: {formatFee()}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>

        {/* 3. Footer: Actions - only show if there's content */}
        {onMapPress && (
          <Card.Actions style={styles.footer}>
            <Button
              mode='text'
              onPress={onMapPress}
              style={styles.mapButton}
              labelStyle={styles.mapButtonLabel}
              textColor={themeColors.colors.primary}
            >
              {t('clubCard.labels.viewMap')}
            </Button>
          </Card.Actions>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    clubInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    logo: {
      backgroundColor: colors.surfaceVariant,
      marginRight: 12,
    },
    logoPlaceholder: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    clubDetails: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 2,
    },
    quickStats: {
      marginTop: 2,
    },
    memberCount: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    // 🔔 [IRON MAN] Status container and notification badge styles
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    notificationBadge: {
      backgroundColor: '#FFD700', // Gold/Yellow color
      borderRadius: 12,
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationBadgeText: {
      color: '#000',
      fontSize: 12,
      fontWeight: 'bold',
    },
    body: {
      paddingTop: 0,
      paddingBottom: 8,
    },
    infoGrid: {
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    infoIcon: {
      fontSize: 16,
      marginRight: 8,
      width: 20,
    },
    infoText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    // 🎯 [KIM FIX] Stats Grid Styles
    statsGrid: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    statItem: {
      flex: 1,
    },
    statText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    distanceNA: {
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    footer: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    mapButton: {
      marginRight: 8,
    },
    mapButtonLabel: {
      fontSize: 13,
    },
  });

export default ClubCard;
