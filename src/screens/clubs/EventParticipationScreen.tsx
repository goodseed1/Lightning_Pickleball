/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Button,
  Avatar,
  Chip,
  Surface,
  Divider,
  List,
  TextInput,
  Dialog,
  Portal,
  Checkbox,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SceneMap, TabView, TabBar } from 'react-native-tab-view';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { formatPriceByCurrencyCode } from '../../utils/currencyUtils';

type EventParticipationScreenRouteProp = RouteProp<RootStackParamList, 'EventParticipation'>;

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  cost: number;
  currency: 'KRW' | 'USD';
  organizer: string;
  category: 'regular' | 'tournament' | 'social' | 'training';
  skillLevel: 'all' | 'beginner' | 'intermediate' | 'advanced';
  isRegistrationOpen: boolean;
  registrationDeadline: Date;
  requirements: string[];
  equipmentProvided: string[];
  participantList: Participant[];
  waitingList: Participant[];
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  skillLevel: string;
  joinDate: Date;
  status: 'confirmed' | 'pending' | 'waitlisted' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  specialRequests?: string;
}

interface ParticipationForm {
  specialRequests: string;
  emergencyContact: string;
  skillLevelConfirmation: string;
  agreesToTerms: boolean;
  wantsReminders: boolean;
  preferredPartner?: string;
  dietaryRestrictions?: string;
}

const EventParticipationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EventParticipationScreenRouteProp>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    eventId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clubId,
  } = route.params;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'details', title: t('eventParticipation.tabs.details') },
    { key: 'participants', title: t('eventParticipation.tabs.participants') },
    { key: 'register', title: t('eventParticipation.tabs.register') },
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [userParticipationStatus, setUserParticipationStatus] = useState<
    'none' | 'confirmed' | 'pending' | 'waitlisted'
  >('none');

  const [event, setEvent] = useState<Event>({
    id: eventId,
    title: '주말 복식 토너먼트',
    description:
      '매월 진행되는 클럽 내 복식 토너먼트입니다. 실력별 조편성으로 공정한 경기를 진행합니다.',
    date: new Date('2025-02-15'),
    time: '14:00 - 18:00',
    location: '강남구민체육센터 테니스장',
    maxParticipants: 16,
    currentParticipants: 12,
    cost: 10000,
    currency: 'KRW',
    organizer: '김클럽장',
    category: 'tournament',
    skillLevel: 'all',
    isRegistrationOpen: true,
    registrationDeadline: new Date('2025-02-10'),
    requirements: [
      '클럽 회원만 참가 가능',
      'NTRP 3.0 이상 권장',
      '파트너와 함께 신청 필수',
      '참가비 사전 납부 필수',
    ],
    equipmentProvided: ['공 제공', '코트 대여', '간단한 음료 제공', '우승 상품 (클럽 로고 텀블러)'],
    participantList: [
      {
        id: '1',
        name: '김테니스',
        skillLevel: 'NTRP 4.0',
        joinDate: new Date('2025-01-20'),
        status: 'confirmed',
        paymentStatus: 'paid',
      },
      {
        id: '2',
        name: '박완벽',
        skillLevel: 'NTRP 4.5',
        joinDate: new Date('2025-01-22'),
        status: 'confirmed',
        paymentStatus: 'paid',
      },
      {
        id: '3',
        name: '이우승',
        skillLevel: 'NTRP 3.5',
        joinDate: new Date('2025-01-25'),
        status: 'pending',
        paymentStatus: 'unpaid',
      },
    ],
    waitingList: [
      {
        id: '4',
        name: '최대기',
        skillLevel: 'NTRP 3.0',
        joinDate: new Date('2025-01-28'),
        status: 'waitlisted',
        paymentStatus: 'unpaid',
      },
    ],
  });

  const [participationForm, setParticipationForm] = useState<ParticipationForm>({
    specialRequests: '',
    emergencyContact: '',
    skillLevelConfirmation: '',
    agreesToTerms: false,
    wantsReminders: true,
    preferredPartner: '',
    dietaryRestrictions: '',
  });

  const { width } = Dimensions.get('window');

  useEffect(() => {
    loadEventData();
    checkUserRegistration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch actual event data from the backend
      // Mock data is already initialized above
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert(
        t('eventParticipation.errors.loadFailed'),
        t('eventParticipation.errors.unableToLoad'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRegistration = () => {
    // Check if current user is already registered
    const userParticipant = event.participantList.find(p => p.id === user?.uid);
    const userInWaitlist = event.waitingList.find(p => p.id === user?.uid);

    if (userParticipant) {
      setIsUserRegistered(true);
      setUserParticipationStatus(userParticipant.status);
    } else if (userInWaitlist) {
      setIsUserRegistered(true);
      setUserParticipationStatus('waitlisted');
    } else {
      setIsUserRegistered(false);
      setUserParticipationStatus('none');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEventData();
    setIsRefreshing(false);
  };

  // 🌍 화폐 코드로 가격 포맷팅
  const formatCurrency = (amount: number): string => {
    return formatPriceByCurrencyCode(amount, event.currency);
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'tournament':
        return '🏆';
      case 'regular':
        return '📅';
      case 'social':
        return '🎉';
      case 'training':
        return '💪';
      default:
        return '🎾';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'waitlisted':
        return '#2196f3';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const handleRegistration = async () => {
    if (!participationForm.agreesToTerms) {
      Alert.alert(
        t('eventParticipation.registration.termsRequired'),
        t('eventParticipation.registration.pleaseAgreeTerms'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (!participationForm.emergencyContact.trim()) {
      Alert.alert(
        t('eventParticipation.registration.emergencyContactRequired'),
        t('eventParticipation.registration.pleaseEnterEmergency'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    try {
      const newParticipant: Participant = {
        id: user?.uid || 'current_user',
        name: user?.displayName || '현재 사용자',
        skillLevel: participationForm.skillLevelConfirmation || 'NTRP 3.0',
        joinDate: new Date(),
        status: event.currentParticipants < event.maxParticipants ? 'pending' : 'waitlisted',
        paymentStatus: 'unpaid',
        specialRequests: participationForm.specialRequests,
      };

      if (event.currentParticipants < event.maxParticipants) {
        setEvent(prev => ({
          ...prev,
          participantList: [...prev.participantList, newParticipant],
          currentParticipants: prev.currentParticipants + 1,
        }));
        setUserParticipationStatus('pending');
      } else {
        setEvent(prev => ({
          ...prev,
          waitingList: [...prev.waitingList, newParticipant],
        }));
        setUserParticipationStatus('waitlisted');
      }

      setIsUserRegistered(true);
      setShowRegistrationDialog(false);

      Alert.alert(
        t('eventParticipation.registration.complete'),
        event.currentParticipants < event.maxParticipants
          ? t('eventParticipation.registration.registrationSuccess')
          : t('eventParticipation.registration.addedToWaitlist'),
        [{ text: t('common.ok') }]
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert(
        t('eventParticipation.registration.failed'),
        t('eventParticipation.registration.errorProcessing'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleCancelRegistration = () => {
    Alert.alert(
      t('eventParticipation.cancel.title'),
      t('eventParticipation.cancel.confirmMessage'),
      [
        { text: t('common.no') },
        {
          text: t('common.yes'),
          onPress: () => {
            setEvent(prev => ({
              ...prev,
              participantList: prev.participantList.filter(p => p.id !== user?.uid),
              waitingList: prev.waitingList.filter(p => p.id !== user?.uid),
              currentParticipants: Math.max(0, prev.currentParticipants - 1),
            }));
            setIsUserRegistered(false);
            setUserParticipationStatus('none');

            Alert.alert(
              t('eventParticipation.cancel.complete'),
              t('eventParticipation.cancel.successMessage')
            );
          },
        },
      ]
    );
  };

  // Details Tab
  const DetailsRoute = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.eventCard}>
        <Card.Content>
          <View style={styles.eventHeader}>
            <Text style={styles.eventCategory}>
              {getCategoryIcon(event.category)} {event.category.toUpperCase()}
            </Text>
            <Chip
              compact
              style={[styles.skillChip, { backgroundColor: theme.colors.primary + '20' }]}
            >
              {event.skillLevel === 'all'
                ? t('eventParticipation.details.allLevels')
                : event.skillLevel}
            </Chip>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>

          <Divider style={styles.divider} />

          <View style={styles.eventDetails}>
            <View style={styles.detailItem}>
              <Ionicons name='calendar' size={16} color='#666' />
              <Text style={styles.detailText}>
                {event.date.toLocaleDateString()} | {event.time}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name='location' size={16} color='#666' />
              <Text style={styles.detailText}>{event.location}</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name='person' size={16} color='#666' />
              <Text style={styles.detailText}>
                {event.currentParticipants}/{event.maxParticipants}{' '}
                {t('eventParticipation.details.participants')}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name='card' size={16} color='#666' />
              <Text style={styles.detailText}>
                {event.cost > 0 ? formatCurrency(event.cost) : t('eventParticipation.details.free')}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name='person-circle' size={16} color='#666' />
              <Text style={styles.detailText}>
                {t('eventParticipation.details.organizer')}: {event.organizer}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.requirementsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>{t('eventParticipation.details.requirements')}</Text>
          {event.requirements.map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.equipmentCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>{t('eventParticipation.details.providedEquipment')}</Text>
          {event.equipmentProvided.map((item, index) => (
            <View key={index} style={styles.equipmentItem}>
              <Text style={styles.checkMark}>✓</Text>
              <Text style={styles.equipmentText}>{item}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  // Participants Tab
  const ParticipantsRoute = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.participantsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>
            {t('eventParticipation.participants.list')} ({event.currentParticipants})
          </Text>

          {event.participantList.map(participant => (
            <List.Item
              key={participant.id}
              title={participant.name}
              description={`${participant.skillLevel} • ${participant.joinDate.toLocaleDateString()}`}
              left={() => (
                <Avatar.Text
                  size={40}
                  label={participant.name.charAt(0)}
                  style={styles.participantAvatar}
                />
              )}
              right={() => (
                <View style={styles.participantStatus}>
                  <Chip
                    compact
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(participant.status) + '20' },
                    ]}
                  >
                    <Text style={{ color: getStatusColor(participant.status) }}>
                      {participant.status === 'confirmed'
                        ? t('eventParticipation.status.confirmed')
                        : participant.status === 'pending'
                          ? t('eventParticipation.status.pending')
                          : participant.status}
                    </Text>
                  </Chip>
                </View>
              )}
            />
          ))}
        </Card.Content>
      </Card>

      {event.waitingList.length > 0 && (
        <Card style={styles.waitingCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              {t('eventParticipation.participants.waitingList')} ({event.waitingList.length})
            </Text>

            {event.waitingList.map(participant => (
              <List.Item
                key={participant.id}
                title={participant.name}
                description={`${participant.skillLevel} • ${participant.joinDate.toLocaleDateString()}`}
                left={() => (
                  <Avatar.Text
                    size={40}
                    label={participant.name.charAt(0)}
                    style={styles.waitingAvatar}
                  />
                )}
                right={() => (
                  <Chip compact style={styles.waitingChip}>
                    {t('eventParticipation.status.waiting')}
                  </Chip>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  // Registration Tab
  const RegisterRoute = () => (
    <ScrollView style={styles.tabContent}>
      {isUserRegistered ? (
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.registrationStatus}>
              <Text style={styles.statusIcon}>
                {userParticipationStatus === 'confirmed'
                  ? '✅'
                  : userParticipationStatus === 'pending'
                    ? '⏳'
                    : userParticipationStatus === 'waitlisted'
                      ? '📋'
                      : '❌'}
              </Text>
              <Text style={styles.statusTitle}>
                {userParticipationStatus === 'confirmed'
                  ? t('eventParticipation.status.registrationConfirmed')
                  : userParticipationStatus === 'pending'
                    ? t('eventParticipation.status.registrationPending')
                    : userParticipationStatus === 'waitlisted'
                      ? t('eventParticipation.status.addedToWaitingList')
                      : t('eventParticipation.status.registrationCancelled')}
              </Text>
              <Text style={styles.statusSubtitle}>
                {userParticipationStatus === 'confirmed'
                  ? t('eventParticipation.status.participationConfirmed')
                  : userParticipationStatus === 'pending'
                    ? t('eventParticipation.status.waitingApproval')
                    : userParticipationStatus === 'waitlisted'
                      ? t('eventParticipation.status.notifyWhenAvailable')
                      : ''}
              </Text>
            </View>

            <Button mode='outlined' onPress={handleCancelRegistration} style={styles.cancelButton}>
              {t('eventParticipation.cancel.title')}
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.registrationCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('eventParticipation.registration.title')}</Text>

            {!event.isRegistrationOpen ? (
              <View style={styles.closedRegistration}>
                <Text style={styles.closedIcon}>🚫</Text>
                <Text style={styles.closedTitle}>
                  {t('eventParticipation.registration.closed')}
                </Text>
                <Text style={styles.closedSubtitle}>
                  {t('eventParticipation.registration.closedMessage')}
                </Text>
              </View>
            ) : event.currentParticipants >= event.maxParticipants ? (
              <View style={styles.fullRegistration}>
                <Text style={styles.fullIcon}>📋</Text>
                <Text style={styles.fullTitle}>
                  {t('eventParticipation.registration.joinWaitingList')}
                </Text>
                <Text style={styles.fullSubtitle}>
                  {t('eventParticipation.registration.fullMessage')}
                </Text>
                <Button
                  mode='contained'
                  onPress={() => setShowRegistrationDialog(true)}
                  style={styles.registerButton}
                >
                  {t('eventParticipation.registration.joinWaitingList')}
                </Button>
              </View>
            ) : (
              <View>
                <Text style={styles.registrationDescription}>
                  {t('eventParticipation.registration.description')}
                </Text>

                <Button
                  mode='contained'
                  onPress={() => setShowRegistrationDialog(true)}
                  style={styles.registerButton}
                >
                  {t('eventParticipation.registration.registerNow')}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({
    details: DetailsRoute,
    participants: ParticipantsRoute,
    register: RegisterRoute,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name='chevron-back' size={24} color='#333' />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('eventParticipation.header.title')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name='refresh-outline' size={24} color='#666' />
        </TouchableOpacity>
      </Surface>

      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            labelStyle={styles.tabLabel}
            activeColor={theme.colors.primary}
            inactiveColor='#666'
          />
        )}
      />

      {/* Registration Form Dialog */}
      <Portal>
        <Dialog
          visible={showRegistrationDialog}
          onDismiss={() => setShowRegistrationDialog(false)}
          style={styles.registrationDialog}
        >
          <Dialog.Title>{t('eventParticipation.form.title')}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <TextInput
                label={t('eventParticipation.form.skillLevelConfirmation')}
                placeholder={t('eventParticipation.form.skillLevelPlaceholder')}
                value={participationForm.skillLevelConfirmation}
                onChangeText={text =>
                  setParticipationForm(prev => ({ ...prev, skillLevelConfirmation: text }))
                }
                style={styles.formInput}
              />

              <TextInput
                label={t('eventParticipation.form.emergencyContact')}
                placeholder={t('eventParticipation.form.emergencyPlaceholder')}
                value={participationForm.emergencyContact}
                onChangeText={text =>
                  setParticipationForm(prev => ({ ...prev, emergencyContact: text }))
                }
                style={styles.formInput}
                keyboardType='phone-pad'
              />

              <TextInput
                label={t('eventParticipation.form.preferredPartner')}
                placeholder={t('eventParticipation.form.partnerPlaceholder')}
                value={participationForm.preferredPartner}
                onChangeText={text =>
                  setParticipationForm(prev => ({ ...prev, preferredPartner: text }))
                }
                style={styles.formInput}
              />

              <TextInput
                label={t('eventParticipation.form.specialRequests')}
                placeholder={t('eventParticipation.form.specialRequestsPlaceholder')}
                value={participationForm.specialRequests}
                onChangeText={text =>
                  setParticipationForm(prev => ({ ...prev, specialRequests: text }))
                }
                style={styles.formInput}
                multiline
                numberOfLines={3}
              />

              <View style={styles.checkboxGroup}>
                <View style={styles.checkboxItem}>
                  <Checkbox
                    status={participationForm.agreesToTerms ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setParticipationForm(prev => ({
                        ...prev,
                        agreesToTerms: !prev.agreesToTerms,
                      }))
                    }
                  />
                  <Text style={styles.checkboxLabel}>
                    {t('eventParticipation.form.agreeToTerms')}
                  </Text>
                </View>

                <View style={styles.checkboxItem}>
                  <Checkbox
                    status={participationForm.wantsReminders ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setParticipationForm(prev => ({
                        ...prev,
                        wantsReminders: !prev.wantsReminders,
                      }))
                    }
                  />
                  <Text style={styles.checkboxLabel}>
                    {t('eventParticipation.form.receiveReminders')}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowRegistrationDialog(false)}>{t('common.cancel')}</Button>
            <Button mode='contained' onPress={handleRegistration}>
              {t('eventParticipation.form.submit')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    padding: 8,
  },
  tabBar: {
    backgroundColor: '#fff',
  },
  tabIndicator: {
    backgroundColor: theme.colors.primary,
  },
  tabLabel: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  skillChip: {
    backgroundColor: theme.colors.primary + '20',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    marginVertical: 16,
  },
  eventDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  requirementsCard: {
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: theme.colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  equipmentCard: {
    marginBottom: 16,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  checkMark: {
    fontSize: 16,
    color: '#4caf50',
    marginRight: 8,
    fontWeight: 'bold',
  },
  equipmentText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  participantsCard: {
    marginBottom: 16,
  },
  participantAvatar: {
    backgroundColor: theme.colors.primary,
  },
  participantStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    marginLeft: 8,
  },
  waitingCard: {
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
  },
  waitingAvatar: {
    backgroundColor: '#2196f3',
  },
  waitingChip: {
    backgroundColor: '#bbdefb',
  },
  statusCard: {
    marginBottom: 16,
  },
  registrationStatus: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    borderColor: '#f44336',
  },
  registrationCard: {
    marginBottom: 16,
  },
  closedRegistration: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  closedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  closedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  closedSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fullRegistration: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  fullIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fullTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  fullSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  registrationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 16,
  },
  registrationDialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: 0,
  },
  formInput: {
    marginBottom: 16,
  },
  checkboxGroup: {
    marginTop: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
});

export default EventParticipationScreen;
