import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import ActivityTabContent from '../activity/ActivityTabContent';
import { EventWithParticipation } from '../../types/activity';
import { PartnerInvitation } from '../../types/match';
import { FriendInvitation } from '../cards/FriendInvitationCard';

interface ActivityTabSectionProps {
  appliedEvents: EventWithParticipation[];
  hostedEvents: EventWithParticipation[];
  pastEvents: EventWithParticipation[];
  partnerInvitations?: (PartnerInvitation & { id: string })[];
  friendInvitations?: FriendInvitation[];
  onAcceptInvitation?: (invitationId: string) => void;
  onRejectInvitation?: (invitationId: string) => void;
  onReAcceptInvitation?: (invitationId: string) => void;
  onAcceptFriendInvitation?: (eventId: string) => void;
  onRejectFriendInvitation?: (eventId: string) => void;
  loading: boolean;
  currentLanguage: string;
  initialTab?: string;
  onRefresh: () => Promise<void>;
  onEditEvent: (eventId: string, eventData: EventWithParticipation) => void;
}

const ActivityTabSection: React.FC<ActivityTabSectionProps> = ({
  appliedEvents,
  hostedEvents,
  pastEvents,
  partnerInvitations,
  friendInvitations,
  onAcceptInvitation,
  onRejectInvitation,
  onReAcceptInvitation,
  onAcceptFriendInvitation,
  onRejectFriendInvitation,
  loading,
  currentLanguage,
  initialTab,
  onRefresh,
  onEditEvent,
}) => {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  return (
    <View style={styles.container}>
      <ActivityTabContent
        currentLanguage={currentLanguage}
        appliedEvents={appliedEvents}
        hostedEvents={hostedEvents}
        pastEvents={pastEvents}
        partnerInvitations={partnerInvitations}
        friendInvitations={friendInvitations}
        onAcceptInvitation={onAcceptInvitation}
        onRejectInvitation={onRejectInvitation}
        onReAcceptInvitation={onReAcceptInvitation}
        onAcceptFriendInvitation={onAcceptFriendInvitation}
        onRejectFriendInvitation={onRejectFriendInvitation}
        loading={loading}
        onRefresh={onRefresh}
        onEditEvent={onEditEvent}
        initialTab={initialTab}
      />
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

export default React.memo(ActivityTabSection);
