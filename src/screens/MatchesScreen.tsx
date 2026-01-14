import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NotificationService, { MatchNotificationData } from '../services/NotificationService';
import { useLanguage } from '../contexts/LanguageContext';

interface Match {
  id: string;
  type: 'personal' | 'club';
  title: string;
  location: string;
  dateTime: Date;
  createdBy: string;
  createdById: string;
  participants: Participant[];
  maxParticipants: number;
  skillLevel: string;
  description: string;
  clubId?: string;
  clubName?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface Participant {
  id: string;
  name: string;
  status: 'confirmed' | 'pending' | 'declined';
}

interface Club {
  id: string;
  name: string;
  isAdmin: boolean;
}

const MatchesScreen = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'personal' | 'club'>('personal');
  const [matches, setMatches] = useState<Match[]>([]);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificationService] = useState(() => NotificationService.getInstance());

  // Notification distance setting (in miles)
  const notificationDistance = 10;

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    dateTime: new Date(),
    maxParticipants: '4',
    skillLevel: 'all',
    description: '',
    selectedClubId: '',
    isRecurring: false,
    recurringPattern: 'weekly',
  });

  // Mock data
  useEffect(() => {
    // Mock user clubs
    setUserClubs([
      { id: '1', name: 'Atlanta Tennis Club', isAdmin: true },
      { id: '2', name: 'Buckhead Players', isAdmin: false },
    ]);

    // Mock matches
    setMatches([
      {
        id: '1',
        type: 'personal',
        title: t('matches.mockData.weekendDoubles'),
        location: 'Central Park Tennis Courts',
        dateTime: new Date('2024-01-20 14:00'),
        createdBy: t('matches.mockData.me'),
        createdById: 'user1',
        participants: [
          { id: '1', name: t('matches.mockData.me'), status: 'confirmed' },
          { id: '2', name: 'Alex Kim', status: 'confirmed' },
          { id: '3', name: 'Maria Lopez', status: 'pending' },
        ],
        maxParticipants: 4,
        skillLevel: '3.0-4.0',
        description: t('matches.mockData.weekendDescription'),
        status: 'upcoming',
      },
      {
        id: '2',
        type: 'club',
        title: t('matches.mockData.mondayTraining'),
        location: 'Atlanta Tennis Club',
        dateTime: new Date('2024-01-22 18:00'),
        createdBy: 'Jennifer Park',
        createdById: 'user2',
        clubId: '1',
        clubName: 'Atlanta Tennis Club',
        participants: [
          { id: '1', name: 'Jennifer Park', status: 'confirmed' },
          { id: '2', name: 'David Kim', status: 'confirmed' },
          { id: '3', name: 'Sarah Lee', status: 'confirmed' },
          { id: '4', name: 'Mike Chen', status: 'confirmed' },
        ],
        maxParticipants: 12,
        skillLevel: t('matches.skillLevels.all'),
        description: t('matches.mockData.mondayDescription'),
        isRecurring: true,
        recurringPattern: t('matches.recurringPatterns.weeklyMonday'),
        status: 'upcoming',
      },
    ]);
  }, [t]);

  const createMatch = async () => {
    if (!formData.title || !formData.location) {
      Alert.alert(t('matches.alerts.inputError.title'), t('matches.alerts.inputError.message'));
      return;
    }

    const newMatch: Match = {
      id: Date.now().toString(),
      type: formData.selectedClubId ? 'club' : 'personal',
      title: formData.title,
      location: formData.location,
      dateTime: formData.dateTime,
      createdBy: t('matches.mockData.me'),
      createdById: 'currentUser',
      participants: [{ id: 'currentUser', name: t('matches.mockData.me'), status: 'confirmed' }],
      maxParticipants: parseInt(formData.maxParticipants),
      skillLevel:
        formData.skillLevel === 'all' ? t('matches.skillLevels.all') : formData.skillLevel,
      description: formData.description,
      clubId: formData.selectedClubId || undefined,
      clubName: userClubs.find(club => club.id === formData.selectedClubId)?.name,
      isRecurring: formData.isRecurring,
      recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined,
      status: 'upcoming',
    };

    setMatches([newMatch, ...matches]);
    setShowCreateModal(false);
    resetForm();

    // Send push notification to nearby users
    try {
      const notificationData: MatchNotificationData = {
        matchId: newMatch.id,
        title: newMatch.title,
        type: newMatch.type,
        location: newMatch.location,
        dateTime: newMatch.dateTime.toISOString(),
        distance: 0, // This would be calculated based on user location
        clubName: newMatch.clubName,
      };

      // Schedule local notification (demo)
      await notificationService.scheduleMatchNotification(notificationData);

      // Schedule match reminder
      await notificationService.scheduleMatchReminder(
        newMatch.id,
        newMatch.title,
        newMatch.dateTime,
        30 // 30 minutes before
      );
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }

    Alert.alert(
      t('matches.alerts.createSuccess.title'),
      formData.selectedClubId
        ? t('matches.alerts.createSuccess.messageClub', { distance: notificationDistance })
        : t('matches.alerts.createSuccess.messagePersonal', { distance: notificationDistance }),
      [{ text: t('matches.alerts.createSuccess.confirm') }]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      location: '',
      dateTime: new Date(),
      maxParticipants: '4',
      skillLevel: 'all',
      description: '',
      selectedClubId: '',
      isRecurring: false,
      recurringPattern: 'weekly',
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const joinMatch = (_matchId: string) => {
    Alert.alert(t('matches.alerts.joinMatch.title'), t('matches.alerts.joinMatch.message'), [
      { text: t('matches.alerts.joinMatch.cancel'), style: 'cancel' },
      {
        text: t('matches.alerts.joinMatch.join'),
        onPress: () => {
          // Update match participants
          Alert.alert(
            t('matches.alerts.joinMatch.success'),
            t('matches.alerts.joinMatch.successMessage')
          );
        },
      },
    ]);
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const isCreator =
      match.createdById === 'currentUser' || match.createdBy === t('matches.mockData.me');
    const confirmedCount = match.participants.filter(p => p.status === 'confirmed').length;

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.matchTitleContainer}>
            <Text style={styles.matchTitle}>{match.title}</Text>
            {match.type === 'club' && (
              <View style={styles.clubBadge}>
                <Ionicons name='people' size={12} color='#fff' />
                <Text style={styles.clubBadgeText}>{match.clubName}</Text>
              </View>
            )}
          </View>
          {match.isRecurring && (
            <View style={styles.recurringBadge}>
              <Ionicons name='repeat' size={14} color='#ff6b35' />
              <Text style={styles.recurringText}>{t('matches.card.recurring')}</Text>
            </View>
          )}
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.infoRow}>
            <Ionicons name='calendar-outline' size={16} color='#666' />
            <Text style={styles.infoText}>
              {match.dateTime.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}{' '}
              {match.dateTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name='location-outline' size={16} color='#666' />
            <Text style={styles.infoText}>{match.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name='trophy-outline' size={16} color='#666' />
            <Text style={styles.infoText}>
              {t('matches.card.level', { level: match.skillLevel })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name='people-outline' size={16} color='#666' />
            <Text style={styles.infoText}>
              {t('matches.card.participants', {
                count: confirmedCount,
                max: match.maxParticipants,
              })}
            </Text>
          </View>
        </View>

        {match.description && <Text style={styles.matchDescription}>{match.description}</Text>}

        <View style={styles.participantsList}>
          {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
          {match.participants.slice(0, 3).map((participant, _index) => (
            <View key={participant.id} style={styles.participantItem}>
              <Text style={styles.participantName}>{participant.name}</Text>
              {participant.status === 'pending' && (
                <Text style={styles.pendingText}>{t('matches.card.pending')}</Text>
              )}
            </View>
          ))}
          {match.participants.length > 3 && (
            <Text style={styles.moreParticipants}>
              {t('matches.card.moreParticipants', { count: match.participants.length - 3 })}
            </Text>
          )}
        </View>

        <View style={styles.matchFooter}>
          <Text style={styles.creatorText}>
            {t('matches.card.organizer', { name: match.createdBy })}
          </Text>
          {!isCreator && confirmedCount < match.maxParticipants && (
            <TouchableOpacity style={styles.joinButton} onPress={() => joinMatch(match.id)}>
              <Text style={styles.joinButtonText}>{t('matches.card.joinButton')}</Text>
            </TouchableOpacity>
          )}
          {isCreator && (
            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageButtonText}>{t('matches.card.manageButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const CreateMatchModal = () => (
    <Modal
      visible={showCreateModal}
      animationType='slide'
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('matches.createModal.title')}</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name='close' size={24} color='#333' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Match Type Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.matchType.label')}</Text>
              <View style={styles.matchTypeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, !formData.selectedClubId && styles.activeTypeButton]}
                  onPress={() => setFormData({ ...formData, selectedClubId: '' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      !formData.selectedClubId && styles.activeTypeButtonText,
                    ]}
                  >
                    {t('matches.createModal.matchType.personal')}
                  </Text>
                </TouchableOpacity>

                {userClubs.filter(club => club.isAdmin).length > 0 && (
                  <TouchableOpacity
                    style={[styles.typeButton, formData.selectedClubId && styles.activeTypeButton]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        selectedClubId: userClubs.find(c => c.isAdmin)?.id || '',
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.selectedClubId && styles.activeTypeButtonText,
                      ]}
                    >
                      {t('matches.createModal.matchType.club')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Club Selection for Club Events */}
            {formData.selectedClubId && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('matches.createModal.clubSelection.label')}</Text>
                {userClubs
                  .filter(club => club.isAdmin)
                  .map(club => (
                    <TouchableOpacity
                      key={club.id}
                      style={[
                        styles.clubOption,
                        formData.selectedClubId === club.id && styles.selectedClubOption,
                      ]}
                      onPress={() => setFormData({ ...formData, selectedClubId: club.id })}
                    >
                      <Text>{club.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.title.label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('matches.createModal.title.placeholder')}
                value={formData.title}
                onChangeText={text => setFormData({ ...formData, title: text })}
              />
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.location.label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('matches.createModal.location.placeholder')}
                value={formData.location}
                onChangeText={text => setFormData({ ...formData, location: text })}
              />
            </View>

            {/* Date & Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.dateTime.label')}</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name='calendar-outline' size={20} color='#666' />
                <Text style={styles.dateButtonText}>
                  {formData.dateTime.toLocaleDateString('ko-KR')}{' '}
                  {formData.dateTime.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recurring Option for Club Events */}
            {formData.selectedClubId && (
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.formLabel}>{t('matches.createModal.recurring.label')}</Text>
                  <Switch
                    value={formData.isRecurring}
                    onValueChange={value => setFormData({ ...formData, isRecurring: value })}
                  />
                </View>
                {formData.isRecurring && (
                  <View style={styles.recurringOptions}>
                    {['weekly', 'biweekly', 'monthly'].map(pattern => (
                      <TouchableOpacity
                        key={pattern}
                        style={[
                          styles.recurringOption,
                          formData.recurringPattern === pattern && styles.selectedRecurringOption,
                        ]}
                        onPress={() => setFormData({ ...formData, recurringPattern: pattern })}
                      >
                        <Text>{t(`matches.recurringPatterns.${pattern}`)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Max Participants */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.maxParticipants.label')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('matches.createModal.maxParticipants.placeholder')}
                value={formData.maxParticipants}
                onChangeText={text => setFormData({ ...formData, maxParticipants: text })}
                keyboardType='numeric'
              />
            </View>

            {/* Skill Level */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.skillLevel.label')}</Text>
              <View style={styles.skillLevelOptions}>
                {['all', '2.0-3.0', '3.0-4.0', '4.0-5.0', '5.0+'].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.skillOption,
                      formData.skillLevel === level && styles.selectedSkillOption,
                    ]}
                    onPress={() => setFormData({ ...formData, skillLevel: level })}
                  >
                    <Text>{t(`matches.skillLevels.${level}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('matches.createModal.description.label')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('matches.createModal.description.placeholder')}
                value={formData.description}
                onChangeText={text => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButtonText}>{t('matches.createModal.cancelButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={createMatch}>
              <Text style={styles.createButtonText}>{t('matches.createModal.createButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dateTime}
          mode='datetime'
          display='default'
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, dateTime: selectedDate });
            }
          }}
        />
      )}
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('matches.header.title')}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() =>
              Alert.alert(
                t('matches.header.notificationSettings'),
                t('matches.header.currentNotificationDistance', { distance: notificationDistance })
              )
            }
          >
            <Ionicons name='notifications-outline' size={24} color='#fff' />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
              {t('matches.tabs.personal')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'club' && styles.activeTab]}
            onPress={() => setActiveTab('club')}
          >
            <Text style={[styles.tabText, activeTab === 'club' && styles.activeTabText]}>
              {t('matches.tabs.club')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Match Button */}
        <TouchableOpacity style={styles.createMatchButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name='add-circle' size={24} color='#fff' />
          <Text style={styles.createMatchButtonText}>
            {activeTab === 'personal'
              ? t('matches.createButton.newMatch')
              : t('matches.createButton.newEvent')}
          </Text>
        </TouchableOpacity>

        {/* Matches List */}
        <ScrollView style={styles.matchesList}>
          {matches
            .filter(match => match.type === activeTab)
            .map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
        </ScrollView>

        {/* Create Match Modal */}
        <CreateMatchModal />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ff6b35',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b35',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  createMatchButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  createMatchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  matchesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  matchTitleContainer: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  clubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  clubBadgeText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recurringText: {
    color: '#ff6b35',
    fontSize: 12,
    marginLeft: 4,
  },
  matchInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  matchDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  participantsList: {
    marginBottom: 10,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 14,
    color: '#333',
  },
  pendingText: {
    fontSize: 12,
    color: '#ff9800',
  },
  moreParticipants: {
    fontSize: 14,
    color: '#2196f3',
    marginTop: 4,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  creatorText: {
    color: '#999',
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  manageButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  matchTypeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  typeButtonText: {
    color: '#666',
  },
  activeTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  clubOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedClubOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  recurringOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedRecurringOption: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  skillLevelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSkillOption: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4caf50',
    marginLeft: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MatchesScreen;
