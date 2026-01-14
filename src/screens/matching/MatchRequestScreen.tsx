import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  Avatar,
  Chip,
  Surface,
  RadioButton,
  Divider,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import { formatPriceByCountry } from '../../utils/currencyUtils';

// Local interface for route params (will be used when API integration is complete)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MatchRequestParams {
  playerId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Route params type not strictly defined for this screen
type MatchRequestScreenRouteProp = RouteProp<any, string>;

interface Court {
  id: string;
  name: string;
  address: string;
  distance: number;
  pricePerHour: number;
  availableSlots: string[];
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar?: string;
  skillLevel: number;
  bio: string;
  preferredTimeSlots: string[];
  matchHistory: {
    total: number;
    wins: number;
    recent: string[];
  };
}

export default function MatchRequestScreen() {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [message, setMessage] = useState('');
  const [matchDuration, setMatchDuration] = useState('2'); // 시간
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Will be used when API integration is complete
  const route = useRoute<MatchRequestScreenRouteProp>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();

  const { location } = useLocation();
  const { t } = useLanguage();

  // Note: playerId from route.params will be used when API integration is complete
  // const playerId = (route.params as any as MatchRequestParams)?.playerId || '';

  const timeSlots = [
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
  ];

  useEffect(() => {
    loadPlayerInfo();
    loadNearbyCourts();
  }, []);

  const loadPlayerInfo = async () => {
    // TODO: Replace with real API call to fetch player info
    // 플레이어 정보 API 연동 예정
    setPlayerInfo(null);
  };

  const loadNearbyCourts = async () => {
    // TODO: Replace with real location-based API call
    // 위치 기반 코트 검색 API 연동 예정
    setCourts([]);
  };

  const handleDateChange = (event: { type: string }, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedTime(''); // 날짜 변경시 시간 초기화
    }
  };

  const handleSendRequest = async () => {
    if (!selectedTime) {
      Alert.alert(t('common.error'), t('matchRequest.alerts.selectTime'));
      return;
    }

    if (!selectedCourt) {
      Alert.alert(t('common.error'), t('matchRequest.alerts.selectCourt'));
      return;
    }

    setIsLoading(true);

    try {
      // API 호출하여 매치 요청 전송
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        t('matchRequest.alerts.requestComplete'),
        t('matchRequest.alerts.requestCompleteMessage', { name: playerInfo?.name }),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert(t('common.error'), t('matchRequest.alerts.requestError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getSkillLevelText = (level: number): string => {
    if (level < 30) return t('matchRequest.skillLevel.beginner');
    if (level < 60) return t('matchRequest.skillLevel.elementary');
    if (level < 80) return t('matchRequest.skillLevel.intermediate');
    return t('matchRequest.skillLevel.advanced');
  };

  // 🌍 국가별 화폐로 가격 포맷팅
  const formatPrice = (price: number): string => {
    return formatPriceByCountry(price, location?.country);
  };

  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedCourt) return true;
    return selectedCourt.availableSlots.includes(time);
  };

  if (!playerInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name='construct-outline' size={64} color={theme.colors.primary} />
          <Title style={styles.emptyTitle}>{t('matchRequest.empty.title')}</Title>
          <Paragraph style={styles.emptyText}>{t('matchRequest.empty.message')}</Paragraph>
          <Button mode='outlined' onPress={() => navigation.goBack()} style={styles.backButton}>
            {t('common.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 플레이어 정보 */}
          <Card style={styles.playerCard}>
            <Card.Content>
              <View style={styles.playerHeader}>
                <Avatar.Text size={64} label={playerInfo.name.charAt(0)} style={styles.avatar} />
                <View style={styles.playerInfo}>
                  <Title style={styles.playerName}>{playerInfo.name}</Title>
                  <Chip compact style={styles.skillChip} textStyle={styles.skillText}>
                    {getSkillLevelText(playerInfo.skillLevel)}
                  </Chip>
                  <View style={styles.matchHistory}>
                    <Paragraph style={styles.historyText}>
                      {playerInfo.matchHistory.total}
                      {t('matchRequest.playerCard.matches')} •{' '}
                      {t('matchRequest.playerCard.winRate')}{' '}
                      {Math.round(
                        (playerInfo.matchHistory.wins / playerInfo.matchHistory.total) * 100
                      )}
                      %
                    </Paragraph>
                  </View>
                </View>
              </View>

              <Paragraph style={styles.playerBio}>{playerInfo.bio}</Paragraph>

              <View style={styles.recentMatches}>
                <Paragraph style={styles.recentTitle}>
                  {t('matchRequest.playerCard.recentMatches')}
                </Paragraph>
                <View style={styles.recentResults}>
                  {playerInfo.matchHistory.recent.map((result, index) => (
                    <View
                      key={index}
                      style={[
                        styles.resultBadge,
                        {
                          backgroundColor:
                            result === '승'
                              ? theme.colors.success + '20'
                              : theme.colors.error + '20',
                        },
                      ]}
                    >
                      <Paragraph
                        style={[
                          styles.resultText,
                          { color: result === '승' ? theme.colors.success : theme.colors.error },
                        ]}
                      >
                        {result}
                      </Paragraph>
                    </View>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 매치 일정 선택 */}
          <Card style={styles.scheduleCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('matchRequest.schedule.title')}</Title>

              {/* 날짜 선택 */}
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
                <Ionicons name='calendar' size={20} color={theme.colors.primary} />
                <Paragraph style={styles.selectedDate}>
                  {format(selectedDate, 'MM월 dd일 EEEE', { locale: ko })}
                </Paragraph>
                <Ionicons name='chevron-down' size={20} color={theme.colors.onSurface} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode='date'
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  maximumDate={addDays(new Date(), 30)}
                />
              )}

              <Divider style={styles.divider} />

              {/* 시간 선택 */}
              <Paragraph style={styles.subTitle}>{t('matchRequest.schedule.selectTime')}</Paragraph>
              <View style={styles.timeSlots}>
                {timeSlots.map(time => (
                  <Chip
                    key={time}
                    selected={selectedTime === time}
                    onPress={() => isTimeSlotAvailable(time) && setSelectedTime(time)}
                    style={[styles.timeChip, !isTimeSlotAvailable(time) && styles.disabledChip]}
                    mode={selectedTime === time ? 'flat' : 'outlined'}
                    disabled={!isTimeSlotAvailable(time)}
                  >
                    {time}
                  </Chip>
                ))}
              </View>

              <Divider style={styles.divider} />

              {/* 경기 시간 */}
              <View style={styles.durationSection}>
                <Paragraph style={styles.subTitle}>{t('matchRequest.schedule.duration')}</Paragraph>
                <RadioButton.Group onValueChange={setMatchDuration} value={matchDuration}>
                  <View style={styles.durationOptions}>
                    <RadioButton.Item label={t('matchRequest.schedule.oneHour')} value='1' />
                    <RadioButton.Item label={t('matchRequest.schedule.twoHours')} value='2' />
                    <RadioButton.Item label={t('matchRequest.schedule.threeHours')} value='3' />
                  </View>
                </RadioButton.Group>
              </View>
            </Card.Content>
          </Card>

          {/* 코트 선택 */}
          <Card style={styles.courtCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('matchRequest.court.title')}</Title>

              {courts.map(court => (
                <TouchableOpacity
                  key={court.id}
                  onPress={() => setSelectedCourt(court)}
                  style={[styles.courtItem, selectedCourt?.id === court.id && styles.selectedCourt]}
                >
                  <View style={styles.courtInfo}>
                    <Title style={styles.courtName}>{court.name}</Title>
                    <Paragraph style={styles.courtAddress}>{court.address}</Paragraph>
                    <View style={styles.courtDetails}>
                      <Chip compact style={styles.distanceChip}>
                        <Ionicons name='location' size={12} /> {court.distance}km
                      </Chip>
                      <Paragraph style={styles.courtPrice}>
                        {formatPrice(court.pricePerHour)}
                        {t('matchRequest.court.perHour')}
                      </Paragraph>
                    </View>
                  </View>
                  {selectedCourt?.id === court.id && (
                    <Ionicons name='checkmark-circle' size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          {/* 메시지 */}
          <Card style={styles.messageCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>{t('matchRequest.message.title')}</Title>
              <TextInput
                label={t('matchRequest.message.label')}
                value={message}
                onChangeText={setMessage}
                mode='outlined'
                multiline
                numberOfLines={3}
                placeholder={t('matchRequest.message.placeholder')}
              />
            </Card.Content>
          </Card>

          {/* 요약 */}
          {selectedTime && selectedCourt && (
            <Surface style={styles.summaryCard}>
              <Title style={styles.summaryTitle}>{t('matchRequest.summary.title')}</Title>
              <List.Item
                title={format(selectedDate, 'MM월 dd일', { locale: ko })}
                description={`${selectedTime} (${matchDuration}시간)`}
                left={(/*eslint-disable-line @typescript-eslint/no-unused-vars*/ props) => (
                  <Ionicons name='calendar' size={24} color={theme.colors.primary} />
                )}
              />
              <List.Item
                title={selectedCourt.name}
                description={`${formatPrice(selectedCourt.pricePerHour * parseInt(matchDuration))}`}
                left={(/*eslint-disable-line @typescript-eslint/no-unused-vars*/ props) => (
                  <Ionicons name='location' size={24} color={theme.colors.primary} />
                )}
              />
            </Surface>
          )}

          {/* 전송 버튼 */}
          <Button
            mode='contained'
            onPress={handleSendRequest}
            style={styles.sendButton}
            disabled={!selectedTime || !selectedCourt || isLoading}
            loading={isLoading}
          >
            {t('matchRequest.sendButton')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCard: {
    marginBottom: theme.spacing.md,
  },
  playerHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  skillChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '20',
    marginBottom: theme.spacing.xs,
  },
  skillText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  matchHistory: {
    marginTop: theme.spacing.xs,
  },
  historyText: {
    fontSize: 13,
    opacity: 0.7,
  },
  playerBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  recentMatches: {
    marginTop: theme.spacing.sm,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
    opacity: 0.7,
  },
  recentResults: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  resultBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  scheduleCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: theme.spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.onSurface + '20',
  },
  selectedDate: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    opacity: 0.7,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeChip: {
    marginBottom: theme.spacing.xs,
  },
  disabledChip: {
    opacity: 0.4,
  },
  durationSection: {
    // 경기 시간 섹션 스타일
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  courtCard: {
    marginBottom: theme.spacing.md,
  },
  courtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.onSurface + '20',
    marginBottom: theme.spacing.sm,
  },
  selectedCourt: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 16,
    marginBottom: 4,
  },
  courtAddress: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: theme.spacing.xs,
  },
  courtDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  distanceChip: {
    height: 24,
  },
  courtPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  messageCard: {
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  sendButton: {
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginTop: theme.spacing.md,
  },
});
