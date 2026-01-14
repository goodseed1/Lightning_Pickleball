import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../../theme';
import { useLanguage } from '../../../contexts/LanguageContext';
import Section from '../../layout/Section';

interface Meeting {
  day: string;
  startTime: string;
  endTime: string;
}

interface ClubFormData {
  meetings: Meeting[];
}

interface MeetingScheduleSectionProps {
  formData: ClubFormData;
  onAddMeeting: () => void;
  onRemoveMeeting: (index: number) => void;
}

export default function MeetingScheduleSection({
  formData,
  onAddMeeting,
  onRemoveMeeting,
}: MeetingScheduleSectionProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const colors = themeColors.colors;
  const { t } = useLanguage();

  const styles = StyleSheet.create({
    meetingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceVariant,
      padding: 8,
      borderRadius: 6,
      marginBottom: 6,
    },
    meetingText: {
      fontSize: 14,
      color: colors.onSurface,
    },
    addMeetingButton: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.primary,
      marginTop: 8,
    },
  });

  // Safe array reference to handle initial/abnormal data
  const meetingsSafe = Array.isArray(formData?.meetings) ? formData.meetings : [];

  return (
    <Section
      title={t('createClub.regular_meet')}
      requiredBadge={t('common.required')}
      icon={<MaterialCommunityIcons name='calendar' size={18} color={colors.secondary} />}
      tone='green'
    >
      {meetingsSafe.length > 0 && (
        <View>
          {meetingsSafe.map((meeting, index) => (
            <View key={index} style={styles.meetingItem}>
              <Text style={styles.meetingText}>
                {meeting.day} {meeting.startTime}
              </Text>
              <IconButton
                icon='close'
                size={16}
                onPress={() => onRemoveMeeting(index)}
                iconColor={colors.onSurfaceVariant}
              />
            </View>
          ))}
        </View>
      )}

      <Button
        mode='outlined'
        onPress={onAddMeeting}
        style={styles.addMeetingButton}
        icon='plus'
        compact
        theme={{ colors }}
      >
        {t('createClub.add_meeting')}
      </Button>
    </Section>
  );
}
