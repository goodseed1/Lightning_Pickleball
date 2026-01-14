/**
 * Hosted Events Section Component
 * Handles "Hosted" tab rendering with partner re-invite modal
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EventWithParticipation } from '../../types/activity';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningTennisTheme } from '../../theme';
import UserSearchModal from '../modals/UserSearchModal';
import { usePartnerReinvite } from '../../hooks/usePartnerReinvite';
import { useFriendReinvite } from '../../hooks/useFriendReinvite';
import { useLanguage } from '../../contexts/LanguageContext';

interface HostedEventsSectionProps {
  hostedEvents: EventWithParticipation[];
  loading: boolean;
  onRefresh: () => void;
  onEditEvent?: (eventId: string, eventData: EventWithParticipation) => void;
  renderEventCard: (
    event: EventWithParticipation,
    isHosted: boolean,
    uniqueKey?: string,
    handleReinvite?: (eventId: string, gameType?: string) => void
  ) => JSX.Element;
}

const HostedEventsSection: React.FC<HostedEventsSectionProps> = ({
  hostedEvents,
  onRefresh,
  renderEventCard,
}) => {
  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  // 🛡️ [CAPTAIN AMERICA] Partner re-invite hook for DOUBLES (Phase 2: Extracted to custom hook)
  const { openReinviteModal: openPartnerReinviteModal, userSearchModalProps: partnerModalProps } =
    usePartnerReinvite({
      currentUserId: currentUser?.uid,
      events: hostedEvents,
      onSuccess: () => onRefresh(),
    });

  // 🎯 [SINGLES REINVITE] Friend re-invite hook for SINGLES
  const { openFriendReinviteModal, userSearchModalProps: friendModalProps } = useFriendReinvite({
    currentUserId: currentUser?.uid,
    events: hostedEvents,
    onSuccess: () => onRefresh(),
  });

  /**
   * 🎯 [UNIFIED HANDLER] Route to correct hook based on game type
   * - Singles: useFriendReinvite → reinviteFriend Cloud Function
   * - Doubles: usePartnerReinvite → reinvitePartner Cloud Function
   */
  const handleReinvite = (eventId: string, gameType?: string) => {
    const isSingles = gameType?.toLowerCase().includes('singles');
    if (isSingles) {
      openFriendReinviteModal(eventId, gameType);
    } else {
      openPartnerReinviteModal(eventId, gameType);
    }
  };

  // ✅ UI-level filtering - safety net against cache issues
  // Filter out cancelled events to ensure they never display regardless of service layer cache
  const activeHostedEvents = hostedEvents.filter(event => event.status !== 'cancelled');

  const totalPending = activeHostedEvents.reduce(
    (sum, event) => sum + (event.pendingApplications?.length || 0),
    0
  );

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>
        {t('hostedEvents.section.title', {
          total: activeHostedEvents.length,
          pending: totalPending,
        })}
      </Text>

      {activeHostedEvents.length > 0 ? (
        activeHostedEvents.map(event =>
          renderEventCard(event, true, `hosted_${event.id}`, handleReinvite)
        )
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('hostedEvents.section.emptyState')}</Text>
        </View>
      )}

      {/* 🛡️ [CAPTAIN AMERICA] Partner Re-invite Modal for DOUBLES */}
      <UserSearchModal {...partnerModalProps} />

      {/* 🎯 [SINGLES REINVITE] Friend Re-invite Modal for SINGLES */}
      <UserSearchModal {...friendModalProps} />
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
  });

export default HostedEventsSection;
