/**
 * PartnerInvitationCard - 파트너 초대장 카드 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PartnerInvitation } from '../../types/match';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';

interface Props {
  invitation: PartnerInvitation & { id: string };
  onAccept: (invitationId: string) => void;
  onReject: (invitationId: string) => void;
  onReAccept: (invitationId: string) => void;
  onViewEvent?: (eventId: string) => void; // 🎯 이벤트 보기 링크
  onViewProfile?: (userId: string) => void; // 🆕 [KIM] 초대자 프로필 보기 링크
}

const PartnerInvitationCard: React.FC<Props> = ({
  invitation,
  onAccept,
  onReject,
  onReAccept,
  onViewEvent,
  onViewProfile,
}) => {
  const { currentLanguage, t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>);

  // 🆕 [KIM] Open location in Maps app
  const openInMaps = () => {
    const address = formatLocation();
    if (!address || address === t('partnerInvitation.locationTbd')) return;

    const encodedAddress = encodeURIComponent(address);

    // iOS: Apple Maps, Android: Google Maps
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    Linking.openURL(url).catch(err => {
      console.error('Failed to open maps:', err);
      // Fallback to Google Maps web
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    });
  };

  // 🆕 [KIM] Format full address based on locale
  const formatLocation = () => {
    const { eventLocation, eventCity, eventState } = invitation;

    // If we have detailed location info, format it properly
    // Note: Country (eventCountry) is stored but not displayed for domestic addresses
    if (eventCity || eventState) {
      const parts = [eventLocation];
      if (eventCity) parts.push(eventCity);
      if (eventState) parts.push(eventState);
      return parts.join(', ');
    }

    // Fallback to just the eventLocation
    return eventLocation || t('partnerInvitation.locationTbd');
  };

  // Check if invitation is expired
  // 🔥 FIX: Handle missing expiresAt field for old invitations
  const expiresAt = invitation.expiresAt
    ? invitation.expiresAt instanceof Date
      ? invitation.expiresAt
      : invitation.expiresAt.toDate()
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  const isPending = invitation.status === 'pending';
  const isAccepted = invitation.status === 'accepted';
  const isRejected = invitation.status === 'rejected';

  // Format date and time for display
  const formatDate = (dateValue: string | Date | { toDate: () => Date } | undefined) => {
    // 🔥 [KIM FIX] Handle undefined dateValue for old invitations
    if (!dateValue) {
      return t('partnerInvitation.dateTbd');
    }

    let date: Date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = dateValue.toDate();
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

    if (currentLanguage === 'ko') {
      return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
    } else {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${monthNames[month - 1]} ${day}, ${year} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]})`;
    }
  };

  // Format time for display - handles both pre-formatted strings and ISO timestamps
  const formatTime = (timeValue: string | undefined) => {
    // 🔥 FIX: Handle missing eventTime field for old invitations
    if (!timeValue) {
      return t('partnerInvitation.timeTbd');
    }

    // If already formatted (e.g., "오전 10:00" or "10:00 AM"), return as-is
    if (
      timeValue.includes('오전') ||
      timeValue.includes('오후') ||
      timeValue.includes('AM') ||
      timeValue.includes('PM')
    ) {
      return timeValue;
    }

    // Otherwise, parse as ISO timestamp and format
    try {
      const date = new Date(timeValue);
      return date.toLocaleTimeString(t('common.locale'), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      // Fallback: return original value if parsing fails
      return timeValue;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name='ellipse' size={24} color={themeColors.colors.primary} />
        <Text style={styles.title}>{invitation.eventTitle}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.label}>
          {t('partnerInvitation.gameType')}:{' '}
          {invitation.gameType === 'mens_doubles'
            ? t('partnerInvitation.gameTypes.mensDoubles')
            : invitation.gameType === 'womens_doubles'
              ? t('partnerInvitation.gameTypes.womensDoubles')
              : t('partnerInvitation.gameTypes.mixedDoubles')}
        </Text>
        {/* 🆕 [KIM] 초대자 이름 - 프로필 링크 */}
        <Text style={styles.label}>
          {t('partnerInvitation.inviter')}:{' '}
          {onViewProfile && invitation.inviterId ? (
            <Text style={styles.linkText} onPress={() => onViewProfile(invitation.inviterId)}>
              {invitation.inviterName}
            </Text>
          ) : (
            invitation.inviterName
          )}
          {invitation.inviterLtr && ` (LPR ${Math.round(invitation.inviterLtr)})`}
        </Text>
        {invitation.combinedLtr && (
          <Text style={[styles.label, styles.ntrpTotal]}>
            {t('partnerInvitation.combinedLtr')}: {Math.round(invitation.combinedLtr)}
          </Text>
        )}
        {/* 🎯 [HOST TEAM INFO] Show host team for team applications */}
        {invitation.hostName && (
          <View style={styles.hostTeamContainer}>
            <Ionicons name='people' size={16} color={themeColors.colors.primary} />
            <Text style={styles.hostTeamLabel}>
              {t('partnerInvitation.hostTeam')}:{' '}
              <Text style={styles.hostTeamNames}>
                {invitation.hostName}
                {invitation.hostPartnerName && ` & ${invitation.hostPartnerName}`}
              </Text>
            </Text>
          </View>
        )}
        <Text style={styles.label}>
          {t('partnerInvitation.date')}: {formatDate(invitation.eventDate)}
        </Text>
        <Text style={styles.label}>
          {t('partnerInvitation.time')}: {formatTime(invitation.eventTime)}
        </Text>
        {/* 🆕 [KIM] 장소 - 지도 앱 링크 */}
        <Text style={styles.label}>
          {t('partnerInvitation.location')}:{' '}
          <Text style={styles.linkText} onPress={openInMaps}>
            {formatLocation()}
          </Text>
        </Text>
        {/* 🎯 [VIEW EVENT LINK] Show link to view event details based on invitation type */}
        {/* - host_partner (호스트→파트너): 이벤트 미공개 → 파트너 수락 후에만 표시 */}
        {/* - team_application (게스트→파트너): 이벤트 이미 공개 → 항상 표시 */}
        {onViewEvent &&
          invitation.eventId &&
          (invitation.applicationType === 'team_application' || isAccepted) && (
            <TouchableOpacity
              style={styles.viewEventLink}
              onPress={() => onViewEvent(invitation.eventId)}
            >
              <Ionicons name='open-outline' size={14} color={themeColors.colors.primary} />
              <Text style={styles.viewEventText}>{t('partnerInvitation.viewEvent')}</Text>
            </TouchableOpacity>
          )}
      </View>

      <View style={styles.statusContainer}>
        {isPending && !isExpired && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(invitation.id)}>
              <Text style={styles.acceptButtonText}>{t('partnerInvitation.buttons.accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(invitation.id)}>
              <Text style={styles.rejectButtonText}>{t('partnerInvitation.buttons.reject')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <View style={styles.statusBadge}>
            <Ionicons name='checkmark-circle' size={16} color='#4CAF50' />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>
              {t('partnerInvitation.status.accepted')}
            </Text>
          </View>
        )}

        {isRejected && !isExpired && (
          <View style={styles.rejectedRow}>
            <View style={styles.statusBadge}>
              <Ionicons name='close-circle' size={16} color='#F44336' />
              <Text style={[styles.statusText, { color: '#F44336' }]}>
                {t('partnerInvitation.status.rejected')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reAcceptButton}
              onPress={() => onReAccept(invitation.id)}
            >
              <Text style={styles.reAcceptButtonText}>
                {t('partnerInvitation.buttons.reAccept')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isExpired && (
          <View style={styles.statusBadge}>
            <Ionicons name='time-outline' size={16} color='#999' />
            <Text style={[styles.statusText, { color: '#999' }]}>
              {t('partnerInvitation.status.expired')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
      flex: 1,
      color: colors.onSurface,
    },
    info: {
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    ntrpTotal: {
      fontWeight: 'bold',
      color: colors.primary,
      fontSize: 15,
    },
    hostTeamContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      marginBottom: 4,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: colors.primaryContainer || 'rgba(76, 175, 80, 0.1)',
      borderRadius: 8,
    },
    hostTeamLabel: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    hostTeamNames: {
      fontWeight: 'bold',
      color: colors.primary,
    },
    viewEventLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      paddingVertical: 6,
    },
    viewEventText: {
      fontSize: 13,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    // 🆕 [KIM] 링크 텍스트 스타일 (초대자 이름, 장소)
    linkText: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    statusContainer: {
      marginTop: 8,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptButton: {
      flex: 1,
      backgroundColor: '#4CAF50',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 14,
    },
    rejectButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderColor: '#F44336',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    rejectButtonText: {
      color: '#F44336',
      fontWeight: 'bold',
      fontSize: 14,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    rejectedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reAcceptButton: {
      backgroundColor: '#FF9800',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    reAcceptButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });

export default PartnerInvitationCard;
