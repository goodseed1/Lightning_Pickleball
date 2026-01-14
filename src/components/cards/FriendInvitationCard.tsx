/**
 * 🎯 [FRIEND INVITE] Friend Invitation Card Component
 * Displays friend match invitations with accept/reject buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';

export interface FriendInvitation {
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  hostId: string;
  hostName: string;
  hostLtr?: number; // 🎾 [KIM FIX] Host's LTR level
  gameType?: string;
  status: 'pending' | 'accepted' | 'rejected';
  invitedAt: string;
}

interface Props {
  invitation: FriendInvitation;
  onAccept: (eventId: string) => void;
  onReject: (eventId: string) => void;
  onHostPress?: (hostId: string, hostName: string) => void; // 🎾 [KIM FIX] Navigate to host profile
}

const FriendInvitationCard: React.FC<Props> = ({ invitation, onAccept, onReject, onHostPress }) => {
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  // 🎾 [KIM FIX] Format LTR level for display
  const formatLtr = (ltr?: number) => {
    if (ltr === undefined || ltr === null) return null;
    return `LTR ${ltr.toFixed(1)}`;
  };

  // 🎯 [COMPACT] Only show pending invitations (accepted/rejected are filtered out)
  const isPending = invitation.status === 'pending';

  // Format date for display
  const formatDate = (dateValue: string | undefined) => {
    if (!dateValue) {
      return t('friendInvitation.tbd');
    }

    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString(t('common.locale'), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    } catch {
      return dateValue;
    }
  };

  // Format time for display
  const formatTime = (timeValue: string | undefined) => {
    if (!timeValue) {
      return t('friendInvitation.tbd');
    }

    // If already formatted, return as-is
    if (
      timeValue.includes('오전') ||
      timeValue.includes('오후') ||
      timeValue.includes('AM') ||
      timeValue.includes('PM')
    ) {
      return timeValue;
    }

    try {
      const date = new Date(timeValue);
      return date.toLocaleTimeString(t('common.locale'), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeValue;
    }
  };

  // Get game type label
  const getGameTypeLabel = (gameType?: string) => {
    if (!gameType) return '';

    return t(`friendInvitation.gameType.${gameType}`) || gameType;
  };

  return (
    <View style={styles.card}>
      {/* 🎯 [COMPACT] Header: Badge + Title + Host on same row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.inviteBadge}>
            <Ionicons name='mail' size={14} color='#FFFFFF' />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {invitation.eventTitle}
            </Text>
            {/* 🎾 [KIM FIX] Touchable host name with LTR level */}
            <TouchableOpacity
              onPress={() => onHostPress && onHostPress(invitation.hostId, invitation.hostName)}
              disabled={!onHostPress}
              style={styles.hostRow}
            >
              <Text style={styles.hostLabel}>{t('friendInvitation.from')}</Text>
              <Text style={[styles.hostName, onHostPress && styles.hostNameLink]}>
                {invitation.hostName}
              </Text>
              {invitation.hostLtr !== undefined && (
                <View style={styles.ltrBadge}>
                  <Text style={styles.ltrText}>{formatLtr(invitation.hostLtr)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {invitation.gameType && (
          <View style={styles.gameTypeBadge}>
            <Text style={styles.gameTypeText}>{getGameTypeLabel(invitation.gameType)}</Text>
          </View>
        )}
      </View>

      {/* 🎯 [COMPACT] Info: 2-column grid layout */}
      <View style={styles.infoGrid}>
        {/* Left column: Date & Time */}
        <View style={styles.infoColumn}>
          {invitation.eventDate && (
            <View style={styles.infoItem}>
              <Ionicons
                name='calendar-outline'
                size={14}
                color={themeColors.colors.onSurfaceVariant}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {formatDate(invitation.eventDate)}
              </Text>
            </View>
          )}
          {invitation.eventTime && (
            <View style={styles.infoItem}>
              <Ionicons name='time-outline' size={14} color={themeColors.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>{formatTime(invitation.eventTime)}</Text>
            </View>
          )}
        </View>
        {/* Right column: Location */}
        <View style={styles.infoColumn}>
          {invitation.eventLocation && (
            <View style={styles.infoItem}>
              <Ionicons
                name='location-outline'
                size={14}
                color={themeColors.colors.onSurfaceVariant}
              />
              <Text style={styles.infoText} numberOfLines={2}>
                {invitation.eventLocation}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 🎯 [COMPACT] Buttons: Horizontal inline */}
      {isPending && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAccept(invitation.eventId)}
          >
            <Ionicons name='checkmark' size={16} color='#FFFFFF' />
            <Text style={styles.acceptButtonText}>{t('friendInvitation.accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => onReject(invitation.eventId)}
          >
            <Ionicons name='close' size={16} color='#F44336' />
            <Text style={styles.rejectButtonText}>{t('friendInvitation.reject')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    // 🎯 [COMPACT] Card with reduced padding
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    // 🎯 [COMPACT] Header row: Badge + Title + GameType
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    inviteBadge: {
      backgroundColor: '#4CAF50',
      padding: 6,
      borderRadius: 8,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    // 🎾 [KIM FIX] Host row with touchable name and LTR badge
    hostRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      gap: 4,
    },
    hostLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    hostName: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    hostNameLink: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    ltrBadge: {
      backgroundColor: colors.primaryContainer || '#E8F5E9',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 4,
    },
    ltrText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
    },
    gameTypeBadge: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    gameTypeText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },
    // 🎯 [COMPACT] 2-column info grid
    infoGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    infoColumn: {
      flex: 1,
      gap: 4,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    infoText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    // 🎯 [COMPACT] Smaller buttons
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    acceptButton: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#4CAF50',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 13,
    },
    rejectButton: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderColor: '#F44336',
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    rejectButtonText: {
      color: '#F44336',
      fontWeight: 'bold',
      fontSize: 13,
    },
  });

export default FriendInvitationCard;
