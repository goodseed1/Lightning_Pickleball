/**
 * Applied Events Section Component
 * Handles "Applied" tab rendering with partner invitations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventWithParticipation } from '../../types/activity';
import { PartnerInvitation } from '../../types/match';
import PartnerInvitationCard from '../cards/PartnerInvitationCard';
import FriendInvitationCard, { FriendInvitation } from '../cards/FriendInvitationCard';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';

// 🎯 [KIM FIX] Navigation types for EventDetail
type RootStackParamList = {
  EventDetail: { eventId: string };
};

interface AppliedEventsSectionProps {
  currentLanguage: string;
  appliedEvents: EventWithParticipation[];
  partnerInvitations?: (PartnerInvitation & { id: string })[];
  // 🎯 [FRIEND INVITE] Friend invitation props
  friendInvitations?: FriendInvitation[];
  onAcceptFriendInvitation?: (eventId: string) => void;
  onRejectFriendInvitation?: (eventId: string) => void;
  onHostPress?: (hostId: string, hostName: string) => void; // 🎾 [KIM FIX] Navigate to host profile
  onAcceptInvitation?: (invitationId: string) => void;
  onRejectInvitation?: (invitationId: string) => void;
  onReAcceptInvitation?: (invitationId: string) => void;
  loading: boolean;
  onRefresh: () => void;
  renderEventCard: (
    event: EventWithParticipation,
    isHosted: boolean,
    uniqueKey?: string
  ) => JSX.Element;
}

const AppliedEventsSection: React.FC<AppliedEventsSectionProps> = ({
  appliedEvents,
  partnerInvitations = [],
  friendInvitations = [],
  onAcceptFriendInvitation,
  onRejectFriendInvitation,
  onHostPress, // 🎾 [KIM FIX] Navigate to host profile
  onAcceptInvitation,
  onRejectInvitation,
  onReAcceptInvitation,
  renderEventCard,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors);
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🎯 [KIM FIX] Navigate to Discover screen's Events tab and scroll to specific event
  const handleViewEvent = (eventId: string) => {
    // Navigate to MainTabs -> Discover with events filter and scroll to specific event
    navigation.navigate('MainTabs', {
      screen: 'Discover',
      params: { initialFilter: 'events', scrollToEventId: eventId },
    });
  };

  // ✅ UI-level filtering - safety net against cache issues
  // 🎯 [UX POLISH] Immediately hide ALL negative statuses for cleaner UX
  // Per PM directive: Users shouldn't see rejection states lingering in their list
  const activeAppliedEvents = appliedEvents.filter(event => {
    const status = event.myApplication?.status;
    const partnerStatus = event.myApplication?.partnerStatus;

    // 💥 Immediately hide all cancelled/declined/rejected/closed applications
    // This provides emotionally considerate UX - no need to remind users of rejections
    if (
      status === 'cancelled_by_user' ||
      status === 'cancelled_by_host' ||
      status === 'cancelled' ||
      status === 'declined' ||
      status === 'rejected' ||
      status === 'closed'
    ) {
      return false;
    }

    // 🎯 [KIM FIX] Hide applications where partner rejected the invitation
    // Per user request: "만약 거절되면 참여 신청한 모임화면에서 이 카드는 제거 되야 합니다"
    if (partnerStatus === 'rejected') {
      return false;
    }

    return true;
  });

  // 🎯 [KIM FIX] Count looking_for_partner and pending_partner_approval as "pending"
  const pendingCount = activeAppliedEvents.filter(e => {
    const status = e.myApplication?.status;
    return (
      status === 'pending' ||
      status === 'looking_for_partner' ||
      status === 'pending_partner_approval'
    );
  }).length;
  const approvedCount = activeAppliedEvents.filter(
    e => e.myApplication?.status === 'approved'
  ).length;

  // 🎯 [KIM FIX] Count solo lobby applications (looking_for_partner)
  const soloLobbyCount = activeAppliedEvents.filter(
    e => e.myApplication?.status === 'looking_for_partner'
  ).length;

  // 🎯 [OPERATION DUO] Count pending partner invitations
  const pendingInvitations = (partnerInvitations || []).filter(inv => inv.status === 'pending');
  const invitationCount = pendingInvitations.length;

  // 🎯 [FRIEND INVITE] Count pending friend invitations
  const pendingFriendInvitations = (friendInvitations || []).filter(
    inv => inv.status === 'pending'
  );
  const friendInvitationCount = pendingFriendInvitations.length;

  // Build title with conditional parts
  const buildTitle = () => {
    const parts = [
      `${t('appliedEvents.pending')}: ${pendingCount}`,
      `${t('appliedEvents.approved')}: ${approvedCount}`,
    ];

    if (soloLobbyCount > 0) {
      parts.push(`${t('appliedEvents.soloLobby')}: ${soloLobbyCount}`);
    }

    if (invitationCount > 0) {
      parts.push(`${t('appliedEvents.partnerInvite')}: ${invitationCount}`);
    }

    if (friendInvitationCount > 0) {
      parts.push(`${t('appliedEvents.friendInvite')}: ${friendInvitationCount}`);
    }

    return `${t('appliedEvents.titleBase')} (${parts.join(', ')})`;
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{buildTitle()}</Text>

      {/* 🎯 [FRIEND INVITE] Friend Invitations Section - Show ONLY pending invitations */}
      {pendingFriendInvitations && pendingFriendInvitations.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 12, color: '#4CAF50' }]}>
            {t('appliedEvents.friendInvitations')}
          </Text>
          {pendingFriendInvitations.map((invitation, index) => (
            <FriendInvitationCard
              key={`friend-${invitation.eventId}-${index}`}
              invitation={invitation}
              onAccept={onAcceptFriendInvitation || (() => {})}
              onReject={onRejectFriendInvitation || (() => {})}
              onHostPress={onHostPress} // 🎾 [KIM FIX] Navigate to host profile
            />
          ))}
        </View>
      )}

      {/* Partner Invitations Section */}
      {partnerInvitations && partnerInvitations.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 12 }]}>
            {t('appliedEvents.partnerInvitations')}
          </Text>
          {partnerInvitations.map(invitation => (
            <PartnerInvitationCard
              key={invitation.id}
              invitation={invitation}
              onAccept={onAcceptInvitation || (() => {})}
              onReject={onRejectInvitation || (() => {})}
              onReAccept={onReAcceptInvitation || (() => {})}
              onViewEvent={handleViewEvent}
              onViewProfile={onHostPress ? userId => onHostPress(userId, '') : undefined}
            />
          ))}
        </View>
      )}

      {activeAppliedEvents.length > 0 ? (
        activeAppliedEvents.map((event, index) => (
          <View key={`applied_wrapper_${event.id}_${event.myApplication?.id || index}`}>
            {renderEventCard(
              event,
              false,
              `applied_${event.id}_${event.myApplication?.id || index}`
            )}
            {/* 🎯 [KIM FIX] Solo lobby info is now shown inside the card - removed duplicate outside */}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('appliedEvents.noApplied')}</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    tabContent: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 16,
      flexShrink: 1,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    // 🎯 [KIM FIX] Solo lobby styles removed - now handled inside card component
  });

export default AppliedEventsSection;
