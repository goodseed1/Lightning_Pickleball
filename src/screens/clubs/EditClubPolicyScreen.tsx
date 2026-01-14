import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  List,
  Portal,
  Dialog,
  TextInput as PaperTextInput,
  Button,
  Text as PaperText,
  Chip,
  Divider,
  IconButton,
} from 'react-native-paper';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';

// Types
interface Meeting {
  day: string;
  startTime: string;
  endTime: string;
  recurring?: boolean;
}

interface ClubData {
  profile?: {
    rules?: string[] | string;
  };
  settings?: {
    meetings?: Meeting[];
    joinFee?: number;
    membershipFee?: number;
    yearlyFee?: number;
  };
}

interface ExpandedSections {
  rules: boolean;
  meetings: boolean;
}

const EditClubPolicyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningTennisTheme(currentTheme);

  // Get params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { clubId, clubName } = route.params as any;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [rules, setRules] = useState<string>('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    rules: true,
    meetings: false,
  });

  // Meeting dialog state
  const [meetingDialogVisible, setMeetingDialogVisible] = useState(false);
  const [editingMeetingIndex, setEditingMeetingIndex] = useState<number | null>(null);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting>({
    day: 'monday',
    startTime: '6:00 PM',
    endTime: '8:00 PM',
    recurring: true,
  });

  // Day options
  const dayOptions = [
    { label: t('editClubPolicy.monday'), value: 'monday' },
    { label: t('editClubPolicy.tuesday'), value: 'tuesday' },
    { label: t('editClubPolicy.wednesday'), value: 'wednesday' },
    { label: t('editClubPolicy.thursday'), value: 'thursday' },
    { label: t('editClubPolicy.friday'), value: 'friday' },
    { label: t('editClubPolicy.saturday'), value: 'saturday' },
    { label: t('editClubPolicy.sunday'), value: 'sunday' },
  ];

  // Time options
  const timeOptions = [
    '6:00 AM',
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
    '10:00 PM',
  ];

  // Load club data
  useEffect(() => {
    loadClubData();
  }, [clubId]);

  // Track changes
  useEffect(() => {
    if (!clubData) {
      return;
    }

    const originalRules = Array.isArray(clubData.profile?.rules)
      ? clubData.profile.rules.join('\n')
      : clubData.profile?.rules || '';
    const originalMeetings = clubData.settings?.meetings || [];

    const rulesChanged = rules !== originalRules;
    const meetingsChanged = JSON.stringify(meetings) !== JSON.stringify(originalMeetings);

    setHasChanges(rulesChanged || meetingsChanged);
  }, [rules, meetings, clubData]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      const clubRef = doc(db, 'tennis_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        const data = clubSnap.data() as ClubData;
        setClubData(data);

        // Load rules
        const rulesData = data.profile?.rules;
        setRules(Array.isArray(rulesData) ? rulesData.join('\n') : rulesData || '');

        // Load meetings
        setMeetings(data.settings?.meetings || []);
      }
    } catch (error) {
      console.error('Error loading club data:', error);
      Alert.alert(t('editClubPolicy.error'), t('editClubPolicy.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.uid) {
      Alert.alert(t('editClubPolicy.error'), t('editClubPolicy.loginRequired'));
      return;
    }

    try {
      setSaving(true);

      const clubRef = doc(db, 'tennis_clubs', clubId);
      await updateDoc(clubRef, {
        'profile.rules': rules.split('\n').filter(r => r.trim()),
        'settings.meetings': meetings,
      });

      Alert.alert(t('editClubPolicy.saved'), t('editClubPolicy.savedMessage'), [
        {
          text: t('editClubPolicy.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert(t('editClubPolicy.saveFailed'), t('editClubPolicy.errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(t('editClubPolicy.unsavedChanges'), t('editClubPolicy.unsavedChangesMessage'), [
        {
          text: t('editClubPolicy.cancel'),
          style: 'cancel',
        },
        {
          text: t('editClubPolicy.leave'),
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Meeting management functions
  const addMeeting = () => {
    setEditingMeetingIndex(null);
    setCurrentMeeting({
      day: 'monday',
      startTime: '6:00 PM',
      endTime: '8:00 PM',
      recurring: true,
    });
    setMeetingDialogVisible(true);
  };

  const editMeeting = (index: number) => {
    setEditingMeetingIndex(index);
    setCurrentMeeting(meetings[index]);
    setMeetingDialogVisible(true);
  };

  const deleteMeeting = (index: number) => {
    Alert.alert(t('editClubPolicy.deleteConfirmation'), t('editClubPolicy.deleteMeetingMessage'), [
      {
        text: t('editClubPolicy.cancel'),
        style: 'cancel',
      },
      {
        text: t('editClubPolicy.delete'),
        style: 'destructive',
        onPress: () => {
          const newMeetings = [...meetings];
          newMeetings.splice(index, 1);
          setMeetings(newMeetings);
        },
      },
    ]);
  };

  const saveMeeting = () => {
    if (editingMeetingIndex !== null) {
      // Edit existing meeting
      const newMeetings = [...meetings];
      newMeetings[editingMeetingIndex] = currentMeeting;
      setMeetings(newMeetings);
    } else {
      // Add new meeting
      setMeetings([...meetings, currentMeeting]);
    }
    setMeetingDialogVisible(false);
  };

  const formatDayName = (day: string): string => {
    const dayMap: Record<string, string> = {
      monday: t('editClubPolicy.monday'),
      tuesday: t('editClubPolicy.tuesday'),
      wednesday: t('editClubPolicy.wednesday'),
      thursday: t('editClubPolicy.thursday'),
      friday: t('editClubPolicy.friday'),
      saturday: t('editClubPolicy.saturday'),
      sunday: t('editClubPolicy.sunday'),
    };
    return dayMap[day.toLowerCase()] || day;
  };

  // Dynamic styles
  const styles = useMemo(() => createStyles(themeColors.colors), [themeColors.colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <PaperText style={styles.loadingText}>{t('editClubPolicy.loadingClubData')}</PaperText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={themeColors.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <PaperText style={styles.headerTitle}>{t('editClubPolicy.editClubInfo')}</PaperText>
          <PaperText style={styles.headerSubtitle}>{clubName}</PaperText>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: Club Rules */}
        <List.Accordion
          title={t('editClubPolicy.clubRules')}
          left={props => <List.Icon {...props} icon='document-text' />}
          expanded={expandedSections.rules}
          onPress={() => toggleSection('rules')}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <View style={styles.accordionContent}>
            <PaperText style={styles.instructionText}>
              {t('editClubPolicy.rulesInstruction')}
            </PaperText>
            <PaperInputInput
              mode='outlined'
              multiline
              numberOfLines={10}
              value={rules}
              onChangeText={setRules}
              placeholder={t('editClubPolicy.rulesPlaceholder')}
              style={styles.textInput}
            />
            <PaperText style={styles.characterCount}>{rules.length} / 10,000</PaperText>
          </View>
        </List.Accordion>

        {/* Section 2: Regular Meeting Times */}
        <List.Accordion
          title={t('editClubPolicy.regularMeetingTimes')}
          left={props => <List.Icon {...props} icon='calendar' />}
          expanded={expandedSections.meetings}
          onPress={() => toggleSection('meetings')}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <View style={styles.accordionContent}>
            <PaperText style={styles.instructionText}>
              {t('editClubPolicy.meetingsInstruction')}
            </PaperText>

            {meetings.map((meeting, index) => (
              <View key={index}>
                <View style={styles.meetingItem}>
                  <View style={styles.meetingInfo}>
                    <PaperText style={styles.meetingDay}>{formatDayName(meeting.day)}</PaperText>
                    <PaperText style={styles.meetingTime}>
                      {meeting.startTime}
                      {meeting.startTime !== meeting.endTime && ` - ${meeting.endTime}`}
                    </PaperText>
                    {meeting.recurring && (
                      <Chip icon='repeat' compact style={styles.recurringChip}>
                        {t('editClubPolicy.recurring')}
                      </Chip>
                    )}
                  </View>
                  <View style={styles.meetingActions}>
                    <IconButton icon='pencil' size={20} onPress={() => editMeeting(index)} />
                    <IconButton icon='delete' size={20} onPress={() => deleteMeeting(index)} />
                  </View>
                </View>
                {index < meetings.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))}

            <Button icon='plus' mode='outlined' onPress={addMeeting} style={styles.addButton}>
              {t('editClubPolicy.addMeeting')}
            </Button>
          </View>
        </List.Accordion>

        {/* Save Status */}
        {hasChanges && (
          <View style={styles.statusCard}>
            <Ionicons name='alert-circle' size={20} color='#ff9800' />
            <PaperText style={styles.statusText}>
              {t('editClubPolicy.unsavedChangesWarning')}
            </PaperText>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button mode='outlined' onPress={handleBack} style={styles.cancelButton} disabled={saving}>
          {t('editClubPolicy.cancel')}
        </Button>

        <Button
          mode='contained'
          onPress={handleSave}
          style={styles.saveButton}
          loading={saving}
          disabled={saving || !hasChanges}
        >
          {t('editClubPolicy.save')}
        </Button>
      </View>

      {/* Meeting Dialog */}
      <Portal>
        <Dialog visible={meetingDialogVisible} onDismiss={() => setMeetingDialogVisible(false)}>
          <Dialog.Title>
            {editingMeetingIndex !== null
              ? t('editClubPolicy.editMeeting')
              : t('editClubPolicy.addMeeting')}
          </Dialog.Title>
          <Dialog.Content>
            {/* Day Selector */}
            <PaperText style={styles.dialogLabel}>{t('editClubPolicy.day')}</PaperText>
            <View style={styles.daySelector}>
              {dayOptions.map(option => (
                <Chip
                  key={option.value}
                  selected={currentMeeting.day === option.value}
                  onPress={() => setCurrentMeeting({ ...currentMeeting, day: option.value })}
                  style={styles.dayChip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>

            {/* Time Selector */}
            <PaperText style={styles.dialogLabel}>{t('editClubPolicy.startTime')}</PaperText>
            <View style={styles.timeSelector}>
              {timeOptions.map(time => (
                <Chip
                  key={time}
                  selected={currentMeeting.startTime === time}
                  onPress={() => setCurrentMeeting({ ...currentMeeting, startTime: time })}
                  style={styles.timeChip}
                >
                  {time}
                </Chip>
              ))}
            </View>

            <PaperText style={styles.dialogLabel}>{t('editClubPolicy.endTime')}</PaperText>
            <View style={styles.timeSelector}>
              {timeOptions.map(time => (
                <Chip
                  key={time}
                  selected={currentMeeting.endTime === time}
                  onPress={() => setCurrentMeeting({ ...currentMeeting, endTime: time })}
                  style={styles.timeChip}
                >
                  {time}
                </Chip>
              ))}
            </View>

            {/* Recurring Toggle */}
            <View style={styles.recurringToggle}>
              <PaperText>{t('editClubPolicy.recurring')}</PaperText>
              <Chip
                selected={currentMeeting.recurring}
                onPress={() =>
                  setCurrentMeeting({ ...currentMeeting, recurring: !currentMeeting.recurring })
                }
              >
                {currentMeeting.recurring ? t('editClubPolicy.yes') : t('editClubPolicy.no')}
              </Chip>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMeetingDialogVisible(false)}>
              {t('editClubPolicy.cancel')}
            </Button>
            <Button onPress={saveMeeting}>{t('editClubPolicy.save')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const PaperInputInput = PaperTextInput;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    accordion: {
      backgroundColor: colors.surface,
      marginBottom: 12,
      borderRadius: 8,
      elevation: 2,
    },
    accordionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
    },
    accordionContent: {
      padding: 16,
      backgroundColor: colors.surfaceVariant,
    },
    instructionText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
      lineHeight: 20,
    },
    textInput: {
      backgroundColor: colors.surface,
      marginBottom: 8,
    },
    characterCount: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'right',
    },
    meetingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    meetingInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    meetingDay: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
    },
    meetingTime: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    recurringChip: {
      marginLeft: 8,
    },
    meetingActions: {
      flexDirection: 'row',
    },
    divider: {
      marginVertical: 4,
      backgroundColor: colors.outline,
    },
    addButton: {
      marginTop: 12,
    },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tertiaryContainer,
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
      gap: 12,
    },
    statusText: {
      fontSize: 14,
      color: colors.tertiary,
      fontWeight: '500',
    },
    actionContainer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 2,
      backgroundColor: colors.primary,
    },
    dialogLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 12,
      marginBottom: 8,
    },
    daySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    dayChip: {
      marginRight: 0,
    },
    timeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
      maxHeight: 200,
    },
    timeChip: {
      marginRight: 0,
    },
    recurringToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
  });

export default EditClubPolicyScreen;
