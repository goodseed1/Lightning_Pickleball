import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  Surface,
  IconButton,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { formatPriceByCountry } from '../../utils/currencyUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Route params type not strictly defined for this screen
type MatchDetailScreenRouteProp = any;

interface MatchDetails {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  dateTime: Date;
  duration: number;
  opponent: {
    id: string;
    name: string;
    avatar?: string;
    skillLevel: number;
    phoneNumber?: string;
  };
  court: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    courtNumber?: number;
    phoneNumber: string;
  };
  price: {
    perHour: number;
    total: number;
    paymentStatus: 'pending' | 'paid' | 'split';
  };
  message?: string;
  result?: {
    winner: string;
    score: string;
    feedback?: string;
  };
}

export default function MatchDetailScreen() {
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();
  const route = useRoute<MatchDetailScreenRouteProp>();
  const { cancelNotification } = useNotification();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const userCountry = currentUser?.profile?.location?.country;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchId = (route.params as any)?.matchId;

  useEffect(() => {
    loadMatchDetails();
  }, []);

  const loadMatchDetails = async () => {
    setIsLoading(true);
    try {
      // Mock data - 실제 구현에서는 API 호출
      const mockMatch: MatchDetails = {
        id: matchId,
        status: 'confirmed',
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2시간 후
        duration: 2,
        opponent: {
          id: '1',
          name: '김서준',
          skillLevel: 75,
          phoneNumber: '010-1234-5678',
        },
        court: {
          id: '1',
          name: '올림픽공원 테니스장',
          address: '서울특별시 송파구 올림픽로 424',
          latitude: 37.5219,
          longitude: 127.1267,
          courtNumber: 3,
          phoneNumber: '02-1234-5678',
        },
        price: {
          perHour: 20000,
          total: 40000,
          paymentStatus: 'pending',
        },
        message: t('matchDetail.defaultMessage'),
      };
      setMatchDetails(mockMatch);
    } catch {
      Alert.alert(t('common.error'), t('matchDetail.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMatch = () => {
    Alert.alert(t('matchDetail.cancelMatch'), t('matchDetail.cancelConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('matchDetail.cancelButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            // API 호출하여 매치 취소
            await cancelNotification(`match_reminder_${matchId}`);
            Alert.alert(t('common.success'), t('matchDetail.cancelComplete'));
            navigation.goBack();
          } catch {
            Alert.alert(t('common.error'), t('matchDetail.cancelError'));
          }
        },
      },
    ]);
  };

  const handleCall = (phoneNumber: string, name: string) => {
    Alert.alert(t('matchDetail.callTitle'), t('matchDetail.callConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('matchDetail.callButton'),
        onPress: () => {
          const url = `tel:${phoneNumber}`;
          Linking.canOpenURL(url).then(supported => {
            if (supported) {
              Linking.openURL(url);
            } else {
              Alert.alert(t('common.error'), t('matchDetail.callError'));
            }
          });
        },
      },
    ]);
  };

  const handleOpenMap = () => {
    if (!matchDetails) return;

    const { latitude, longitude, name } = matchDetails.court;
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const label = name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleCompleteMatch = () => {
    // 매치 완료 화면으로 이동
    Alert.alert(t('matchDetail.comingSoon'), t('matchDetail.resultInputComingSoon'));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return t('matchDetail.status.confirmed');
      case 'pending':
        return t('matchDetail.status.pending');
      case 'completed':
        return t('matchDetail.status.completed');
      case 'cancelled':
        return t('matchDetail.status.cancelled');
      default:
        return status;
    }
  };

  const getSkillLevelText = (level: number): string => {
    if (level < 30) return t('matchDetail.skillLevel.beginner');
    if (level < 60) return t('matchDetail.skillLevel.elementary');
    if (level < 80) return t('matchDetail.skillLevel.intermediate');
    return t('matchDetail.skillLevel.advanced');
  };

  if (isLoading || !matchDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ActivityIndicator size='large' color={theme.colors.primary} {...({} as any)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 매치 상태 및 시간 */}
        <Surface style={styles.headerCard}>
          <View style={styles.statusRow}>
            <Chip
              mode='flat'
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(matchDetails.status) + '20' },
              ]}
              textStyle={{ color: getStatusColor(matchDetails.status) }}
            >
              {getStatusText(matchDetails.status)}
            </Chip>
            <Title style={styles.matchTime}>
              {format(matchDetails.dateTime, 'MM월 dd일 HH:mm', { locale: ko })}
            </Title>
          </View>

          {matchDetails.status === 'confirmed' && (
            <View style={styles.countdownContainer}>
              <Ionicons name='time' size={20} color={theme.colors.primary} />
              <Paragraph style={styles.countdownText}>
                {t('matchDetail.countdown', { time: '2시간 30분' })}
              </Paragraph>
            </View>
          )}
        </Surface>

        {/* 상대 정보 */}
        <Card style={styles.opponentCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>{t('matchDetail.opponent')}</Title>
              {matchDetails.opponent.phoneNumber && (
                <IconButton
                  icon='phone'
                  onPress={() =>
                    handleCall(matchDetails.opponent.phoneNumber!, matchDetails.opponent.name)
                  }
                />
              )}
            </View>

            <View style={styles.opponentInfo}>
              <Avatar.Text
                size={64}
                label={matchDetails.opponent.name.charAt(0)}
                style={styles.avatar}
              />
              <View style={styles.opponentDetails}>
                <Title style={styles.opponentName}>{matchDetails.opponent.name}</Title>
                <Chip compact style={styles.skillChip} textStyle={styles.skillText}>
                  {getSkillLevelText(matchDetails.opponent.skillLevel)}
                </Chip>
              </View>
              <Button
                mode='outlined'
                onPress={() => {
                  /* 프로필 보기 */
                }}
                compact
              >
                {t('matchDetail.profile')}
              </Button>
            </View>

            {matchDetails.message && (
              <Surface style={styles.messageBox}>
                <Paragraph style={styles.messageText}>"{matchDetails.message}"</Paragraph>
              </Surface>
            )}
          </Card.Content>
        </Card>

        {/* 코트 정보 */}
        <Card style={styles.courtCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>{t('matchDetail.courtInfo')}</Title>
              <IconButton icon='map' onPress={handleOpenMap} />
            </View>

            <List.Item
              title={matchDetails.court.name}
              description={t('matchDetail.courtNumber', { number: matchDetails.court.courtNumber })}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              left={props => <Ionicons name='location' size={24} color={theme.colors.primary} />}
            />

            <Paragraph style={styles.courtAddress}>{matchDetails.court.address}</Paragraph>

            {/* 지도 */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={{
                  latitude: matchDetails.court.latitude,
                  longitude: matchDetails.court.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: matchDetails.court.latitude,
                    longitude: matchDetails.court.longitude,
                  }}
                  title={matchDetails.court.name}
                />
              </MapView>
            </View>

            <View style={styles.courtActions}>
              <Button mode='outlined' onPress={handleOpenMap} icon='directions' compact>
                {t('matchDetail.directions')}
              </Button>
              <Button
                mode='outlined'
                onPress={() => handleCall(matchDetails.court.phoneNumber, matchDetails.court.name)}
                icon='phone'
                compact
              >
                {t('matchDetail.phone')}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 결제 정보 */}
        <Card style={styles.paymentCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{t('matchDetail.paymentInfo')}</Title>

            <List.Item
              title={`${formatPriceByCountry(matchDetails.price.perHour, userCountry)}${t('matchDetail.perHour')}`}
              description={`${matchDetails.duration}시간`}
              right={() => (
                <Title style={styles.totalPrice}>
                  {formatPriceByCountry(matchDetails.price.total, userCountry)}
                </Title>
              )}
            />

            <Chip mode='outlined' style={styles.paymentStatusChip}>
              {matchDetails.price.paymentStatus === 'pending'
                ? t('matchDetail.paymentStatus.pending')
                : matchDetails.price.paymentStatus === 'paid'
                  ? t('matchDetail.paymentStatus.paid')
                  : t('matchDetail.paymentStatus.split')}
            </Chip>

            {matchDetails.price.paymentStatus === 'pending' && (
              <Button
                mode='contained'
                onPress={() =>
                  Alert.alert(t('matchDetail.comingSoon'), t('matchDetail.paymentComingSoon'))
                }
                style={styles.paymentButton}
              >
                {t('matchDetail.payButton')}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* 액션 버튼 */}
        <View style={styles.actionButtons}>
          {matchDetails.status === 'confirmed' && (
            <>
              <Button
                mode='outlined'
                onPress={handleCancelMatch}
                style={styles.cancelButton}
                textColor={theme.colors.error}
              >
                {t('matchDetail.cancelMatch')}
              </Button>
              <Button
                mode='contained'
                onPress={() =>
                  Alert.alert(t('matchDetail.comingSoon'), t('matchDetail.chatComingSoon'))
                }
                style={styles.chatButton}
              >
                {t('matchDetail.sendMessage')}
              </Button>
            </>
          )}

          {matchDetails.status === 'completed' && !matchDetails.result && (
            <Button mode='contained' onPress={handleCompleteMatch} style={styles.completeButton}>
              {t('matchDetail.enterResult')}
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ActivityIndicator = () => null; // Placeholder

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  headerCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusChip: {
    // 상태 칩 스타일
  },
  matchTime: {
    fontSize: 18,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  countdownText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  opponentCard: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  opponentDetails: {
    flex: 1,
  },
  opponentName: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  skillChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '20',
  },
  skillText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  messageBox: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.medium,
  },
  messageText: {
    fontStyle: 'italic',
    color: theme.colors.primary,
  },
  courtCard: {
    marginBottom: theme.spacing.md,
  },
  courtAddress: {
    marginLeft: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.7,
  },
  mapContainer: {
    height: 150,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  courtActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  paymentCard: {
    marginBottom: theme.spacing.md,
  },
  totalPrice: {
    color: theme.colors.primary,
  },
  paymentStatusChip: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  paymentButton: {
    marginTop: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: theme.colors.error,
  },
  chatButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});
