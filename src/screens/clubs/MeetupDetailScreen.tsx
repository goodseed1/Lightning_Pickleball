/**
 * Meetup Detail Screen - Real-time Dashboard
 * Core feature: Single scrollable screen with real-time updates for a specific meetup
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  RefreshControl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Avatar,
  TextInput,
  IconButton,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme as useLTTheme } from '../../hooks/useTheme';
import { getLightningTennisTheme } from '../../theme';
import meetupService from '../../services/meetupService';
import weatherService from '../../services/weatherService';
import userService from '../../services/userService';
import ParticipationStatusPanel from '../../components/clubs/meetups/ParticipationStatusPanel';
import { Meetup, ParticipantStatus, WeatherData, MeetupStats } from '../../types/meetup';

// Helper function to convert Firestore Timestamp or any date format to Date
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDate = (dateTime: any): Date => {
  if (dateTime instanceof Date) return dateTime;
  if (dateTime?.toDate) return dateTime.toDate();
  return new Date(dateTime);
};

const MeetupDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as ThemeColors);

  const {
    meetupId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clubId,
  } = route.params as { meetupId: string; clubId: string };

  // Core state
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [weatherError, setWeatherError] = useState<Error | null>(null);
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string; avatar?: string; status: ParticipantStatus }>
  >([]);
  const [userRSVP, setUserRSVP] = useState<ParticipantStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      text: string;
      userId: string;
      userName: string;
      userPhoto?: string;
      timestamp: Date;
    }>
  >([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Chat real-time listener
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chatUnsubscribe, setChatUnsubscribe] = useState<(() => void) | null>(null);

  // Real-time listener cleanup
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [meetupUnsubscribe, setMeetupUnsubscribe] = useState<(() => void) | null>(null);

  // 🌤️ [KIM FIX] Helper function to translate weather condition text
  const translateCondition = (condition: string): string => {
    // Try to get translation from meetupDetail.weather.conditions
    const translationKey = `meetupDetail.weather.conditions.${condition}`;
    const translated = t(translationKey);
    // If translation key doesn't exist, i18n returns the key itself, so check
    return translated !== translationKey ? translated : condition;
  };

  // 🎾 [KIM FIX v3] Analyze tennis playability - FULLY aligned with RegularMeetupTab.tsx
  // Priority: 1) Snow/Sleet 2) Fog 3) Rain chance 4) Condition text 5) Wind
  const getTennisConditions = (
    windSpeedMph: number,
    condition?: string,
    chanceOfRain?: number
  ): { text: string; color: string; icon: string } => {
    const lowerCondition = condition?.toLowerCase() || '';

    // ❄️ [PRIORITY 1] Snow/Sleet - Cancel likely (aligned with list card: Red)
    if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
      return {
        text: t('meetupDetail.weather.snow.cancelLikely'),
        color: '#F44336', // Red
        icon: '❄️',
      };
    }

    // 🌫️ [PRIORITY 2] Fog - Warning (aligned with list card: Orange)
    if (lowerCondition.includes('fog')) {
      return {
        text: t('meetupDetail.weather.fog.warning'),
        color: '#FF9800', // Orange
        icon: '🌫️',
      };
    }

    // 🌧️ [PRIORITY 3] Rain chance (aligned with list card: 80% = cancel likely, 50% = rain expected)
    if (chanceOfRain !== undefined) {
      if (chanceOfRain >= 80) {
        return {
          text: t('meetupDetail.weather.rain.cancelLikely'),
          color: '#F44336', // Red
          icon: '🌧️',
        };
      }
      if (chanceOfRain >= 50) {
        return {
          text: t('meetupDetail.weather.rain.expected'),
          color: '#FF9800', // Orange
          icon: '🌧️',
        };
      }
    }

    // 🚫 [PRIORITY 4] Unplayable weather conditions (thunderstorm, heavy rain, violent)
    if (
      lowerCondition.includes('thunderstorm') ||
      lowerCondition.includes('heavy rain') ||
      lowerCondition.includes('violent')
    ) {
      return {
        text: t('meetupDetail.weather.tennis.unplayable'),
        color: '#F44336', // Red
        icon: '🚫',
      };
    }

    // ⚠️ Not recommended conditions - moderate rain, freezing
    if (lowerCondition.includes('moderate rain') || lowerCondition.includes('freezing')) {
      return {
        text: t('meetupDetail.weather.tennis.notRecommended'),
        color: '#FF9800', // Orange
        icon: '⚠️',
      };
    }

    // ⚠️ Caution conditions - light rain, drizzle, shower
    if (
      lowerCondition.includes('rain') ||
      lowerCondition.includes('drizzle') ||
      lowerCondition.includes('shower')
    ) {
      return {
        text: t('meetupDetail.weather.tennis.caution'),
        color: '#FF9800', // Orange
        icon: '⚠️',
      };
    }

    // 💨 [PRIORITY 5] Wind conditions (aligned: > 12mph = warning)
    if (windSpeedMph <= 5) {
      return {
        text: t('meetupDetail.weather.wind.perfect'),
        color: '#4CAF50', // Green
        icon: '✅',
      };
    } else if (windSpeedMph <= 12) {
      return {
        text: t('meetupDetail.weather.wind.playable'),
        color: '#2196F3', // Blue
        icon: '👍',
      };
    } else if (windSpeedMph <= 20) {
      return {
        text: t('meetupDetail.weather.wind.affects'),
        color: '#FF9800', // Orange
        icon: '⚠️',
      };
    } else {
      return {
        text: t('meetupDetail.weather.wind.difficult'),
        color: '#F44336', // Red
        icon: '🚫',
      };
    }
  };

  // Set up real-time meetup listener
  useFocusEffect(
    useCallback(() => {
      if (!meetupId) return;

      console.log('📊 Setting up MeetupDetail real-time listener:', meetupId);

      const unsubscribe = meetupService.getMeetupRealtime(
        meetupId,
        async (meetupData: Meetup | null) => {
          if (meetupData) {
            console.log('📊 Real-time meetup update received:', {
              id: meetupData.id,
              participantCount: Object.keys(meetupData.participants || {}).length,
            });
            setMeetup(meetupData);

            // Update user's RSVP status
            const currentUserParticipant = currentUser?.uid
              ? meetupData.participants?.[currentUser.uid]
              : undefined;
            setUserRSVP(currentUserParticipant?.status || null);

            // Load participant details
            await loadParticipantDetails(meetupData.participants || {});

            setLoading(false);
          } else {
            Alert.alert(t('common.error'), t('meetupDetail.errors.notFound'));
            navigation.goBack();
          }
        }
      );

      setMeetupUnsubscribe(() => unsubscribe);

      return () => {
        console.log('🧹 Cleaning up MeetupDetail listeners');
        if (unsubscribe) unsubscribe();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetupId, currentUser?.uid])
  );

  // Set up real-time chat listener + mark as read
  useFocusEffect(
    useCallback(() => {
      if (!meetupId) return;

      console.log('💬 Setting up chat real-time listener:', meetupId);

      // 🔴 [MEETUP CHAT] Mark chat as read when entering the screen
      meetupService.markChatAsRead(meetupId);

      const unsubscribe = meetupService.getChatMessagesRealtime(meetupId, messages => {
        console.log('💬 Chat messages received:', messages.length);
        setChatMessages(messages);
      });

      setChatUnsubscribe(() => unsubscribe);

      return () => {
        console.log('🧹 Cleaning up chat listener');
        if (unsubscribe) unsubscribe();
      };
    }, [meetupId])
  );

  // Reset weather error when location changes (allows retry with new location)
  useEffect(() => {
    if (meetup?.location) {
      setWeatherError(null); // Clear previous errors for new location
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetup?.location?.address, meetup?.location?.placeId]);

  // 🌤️ [KIM FIX] Fetch weather with snapshot fallback for past meetups
  useFocusEffect(
    useCallback(() => {
      // Skip if no meetup data or location
      if (!meetup?.location || !meetup?.dateTime || !meetupId) {
        return;
      }

      let isActive = true; // Prevent state updates after unmount

      const fetchWeather = async () => {
        const meetupDateTime = toDate(meetup.dateTime);
        // 🗑️ [KIM 2025-01-10] Removed isPastMeetup check - no longer needed without snapshot feature

        try {
          console.log('🌤️ Fetching weather data for location:', meetup.location.address);
          // Use 15-minute cache for optimal balance between freshness and API efficiency
          const weatherData = await weatherService.getWeatherForMeetup(
            meetup.location,
            meetupDateTime
          );

          if (isActive && weatherData) {
            setWeather(weatherData as WeatherData);
            setWeatherError(null); // Clear any previous errors
            // 🗑️ [KIM 2025-01-10] Removed saveWeatherSnapshot - snapshot feature removed per user request
          }
        } catch (error) {
          console.error('❌ Weather API fetch failed:', error);
          // 🗑️ [KIM 2025-01-10] Removed getWeatherSnapshot fallback - snapshot feature removed per user request

          if (isActive) {
            setWeatherError(error as Error);
            setWeather(null); // Clear weather data to show error state
          }

          // Log specific error types for debugging
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage?.includes('401') || errorMessage?.includes('Unauthorized')) {
            console.error('🔑 Weather API key issue - please check API key configuration');
          } else if (errorMessage?.includes('quota') || errorMessage?.includes('limit')) {
            console.error('📊 Weather API quota exceeded');
          } else {
            console.error('🌐 Weather API network or service issue');
          }
        }
      };

      fetchWeather();

      // 🔄 [KIM FIX] Set up 15-minute refresh interval (consistent with other cards)
      const FIFTEEN_MINUTES = 15 * 60 * 1000;
      const intervalId = setInterval(() => {
        console.log('🔄 [MeetupDetailScreen] Auto-refreshing weather (15-min interval)');
        fetchWeather();
      }, FIFTEEN_MINUTES);

      return () => {
        isActive = false;
        clearInterval(intervalId);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetup?.location?.address, meetup?.location?.placeId, meetup?.dateTime, meetupId])
  );

  // Load participant details with user profiles for all statuses
  const loadParticipantDetails = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    participantsData: any
  ) => {
    try {
      // Get all participants, not just attending
      const allParticipants = Object.values(participantsData) as Array<{
        userId: string;
        status: string;
        joinedAt: Date;
      }>;

      if (allParticipants.length === 0) {
        setParticipants([]);
        return;
      }

      // Fetch profiles for all participants
      const userIds = allParticipants.map(p => p.userId);
      const userProfiles = await userService.getUserProfiles(userIds);

      // Combine participant data with user profiles
      const participantsWithProfiles: InternalParticipant[] = allParticipants.map(participant => {
        const profile = userProfiles.find(u => u.id === participant.userId);
        return {
          ...participant,
          displayName:
            profile?.displayName || profile?.name || `Player ${participant.userId.slice(-4)}`,
          profileImage: profile?.profileImage || null,
          status: participant.status || 'maybe', // Ensure status is always present
        };
      });

      // Sort by status: attending first, then maybe, then declining
      const statusOrder: Record<string, number> = { attending: 0, maybe: 1, declining: 2 };
      const sortedParticipants = participantsWithProfiles.sort((a, b) => {
        return (statusOrder[a.status] || 1) - (statusOrder[b.status] || 1);
      });

      // Convert to the required participant format for state
      const stateParticipants = sortedParticipants.map(p => ({
        id: p.userId,
        name: p.displayName,
        avatar: p.profileImage || undefined,
        status: p.status as ParticipantStatus,
      }));

      setParticipants(stateParticipants);
      console.log(
        `📊 Loaded ${sortedParticipants.length} participants (${sortedParticipants.filter(p => p.status === 'attending').length} attending)`
      );
    } catch (error) {
      console.warn('Failed to load participant details:', error);
      setParticipants([]);
    }
  };

  // Handle RSVP button press with improved real-time sync
  const handleRSVP = async (status: ParticipantStatus) => {
    if (!currentUser || !meetup) return;

    // Check if meetup has started or is about to start
    const meetupTime = toDate(meetup.dateTime);
    const now = new Date();
    const minutesUntilMeetup = (meetupTime.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntilMeetup < 15 && minutesUntilMeetup > -120) {
      Alert.alert(t('meetupDetail.rsvp.notice'), t('meetupDetail.rsvp.cannotChangeNearStart'));
      return;
    }

    try {
      // Remove optimistic update - let real-time listener handle UI updates
      // This prevents the UI from showing incorrect counts temporarily

      console.log(`📋 Updating RSVP to ${status} for meetup ${meetupId}`);
      await meetupService.updateRSVP(meetupId, status);

      // Success feedback with enhanced messages
      const messages = {
        attending: t('meetupDetail.rsvp.attendingConfirm'),
        declining: t('meetupDetail.rsvp.decliningConfirm'),
        maybe: t('meetupDetail.rsvp.maybeConfirm'),
      };

      // Brief success message - the real-time listener will update the UI
      console.log(messages[status]);

      // Optional: Show brief toast instead of alert for better UX
      // For now, keeping the alert for consistency
      Alert.alert(t('common.success'), messages[status]);
    } catch (error) {
      console.error('Failed to update RSVP:', error);

      // No need to revert optimistic update since we're not doing it anymore
      // The UI state remains unchanged on error

      const errorMessage = error instanceof Error ? error.message : 'Failed to update RSVP';
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  // Handle location press (open maps)
  const handleLocationPress = () => {
    if (!meetup?.location?.address) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(meetup.location.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(meetup.location.address)}`,
    });

    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        const webUrl = `https://maps.google.com?q=${encodeURIComponent(meetup.location.address)}`;
        Linking.openURL(webUrl);
      }
    });
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || sendingMessage) return;

    try {
      setSendingMessage(true);
      const message = newMessage.trim();
      setNewMessage('');

      // Send message via meetupService - real-time listener will update the UI
      await meetupService.sendChatMessage(meetupId, message);
      console.log('💬 Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('common.error'), t('meetupDetail.chat.sendError'));
    } finally {
      setSendingMessage(false);
    }
  };

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Real-time listener will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Calculate stats - memoized to prevent excessive calculations
  const stats = useMemo<MeetupStats | null>(() => {
    return meetup ? (meetupService.calculateMeetupStats(meetup) as MeetupStats) : null;
  }, [meetup]);

  // Check if RSVP is still allowed (15 minutes before start) - memoized
  const canChangeRSVP = useMemo(() => {
    if (!meetup) return false;
    const now = new Date();
    const meetupTime = toDate(meetup.dateTime);
    const timeDiff = meetupTime.getTime() - now.getTime();
    return timeDiff > 15 * 60 * 1000; // 15 minutes in milliseconds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetup?.dateTime]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themeColors.colors.primary} />
          <Text style={styles.loadingText}>{t('meetupDetail.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!meetup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('meetupDetail.errors.notFound')}</Text>
          <Button mode='contained' onPress={() => navigation.goBack()}>
            {t('meetupDetail.goBack')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon='arrow-left'
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>{t('meetupDetail.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section - Date, Time, Location */}
          <View style={styles.headerSection}>
            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateText}>
                {toDate(meetup.dateTime).toLocaleDateString(t('common.locale'), {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.timeText}>
                {toDate(meetup.dateTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.locationContainer}
              onPress={handleLocationPress}
              activeOpacity={0.7}
            >
              <Ionicons name='location' size={16} color={themeColors.colors.primary} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationName}>{meetup.location.name}</Text>
                <Text style={styles.locationAddress}>{meetup.location.address}</Text>
              </View>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={themeColors.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Participation Status Panel */}
          {stats && (
            <ParticipationStatusPanel
              courtCount={meetup.courtDetails?.availableCourts || 4}
              participantCount={stats.totalAttending}
              statusKey={stats.statusKey}
              waitingCount={stats.waitingCount}
              statusColor={stats.statusColor}
              language={currentLanguage}
            />
          )}

          {/* Weather Widget */}
          <View style={styles.weatherSection}>
            <View style={styles.weatherHeader}>
              <Ionicons name='partly-sunny' size={16} color={themeColors.colors.onSurfaceVariant} />
              <Text style={styles.sectionTitle}>{t('meetupDetail.weather.title')}</Text>
            </View>
            {weather ? (
              <View style={styles.weatherContent}>
                <Text style={styles.weatherIcon}>{weather.icon}</Text>
                <View style={styles.weatherDetails}>
                  <Text style={styles.weatherTemp}>
                    {weather.temperatureF}°F ({weather.temperature}°C)
                  </Text>
                  <Text style={styles.weatherCondition}>
                    {translateCondition(weather.condition)}
                  </Text>
                  {weather.chanceOfRain > 30 && (
                    <Text style={styles.weatherRain}>
                      💧 {t('meetupDetail.weather.chanceOfRain')}: {weather.chanceOfRain}%
                    </Text>
                  )}
                  {weather.windSpeedMph !== undefined && (
                    <View style={styles.windInfo}>
                      <View style={styles.windRow}>
                        <Ionicons
                          name='flag'
                          size={16}
                          color={themeColors.colors.onSurfaceVariant}
                        />
                        <Text style={styles.windSpeed}>
                          {t('meetupDetail.weather.windLabel')}: {weather.windSpeedMph} mph
                        </Text>
                      </View>
                      <View style={styles.windImpactRow}>
                        <Text style={styles.windImpactIcon}>
                          {
                            getTennisConditions(
                              weather.windSpeedMph,
                              weather.condition,
                              weather.chanceOfRain
                            ).icon
                          }
                        </Text>
                        <Text
                          style={[
                            styles.windImpactText,
                            {
                              color: getTennisConditions(
                                weather.windSpeedMph,
                                weather.condition,
                                weather.chanceOfRain
                              ).color,
                            },
                          ]}
                        >
                          {
                            getTennisConditions(
                              weather.windSpeedMph,
                              weather.condition,
                              weather.chanceOfRain
                            ).text
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.weatherUnavailable}>
                <Text style={styles.weatherUnavailableIcon}>❓</Text>
                <Text style={styles.weatherUnavailableText}>
                  {t('meetupDetail.weather.notAvailable')}
                </Text>
                <Text style={styles.weatherUnavailableSubtext}>
                  {t('meetupDetail.weather.unavailableReason')}
                </Text>
              </View>
            )}
          </View>

          {/* RSVP Section */}
          {meetup.status === 'confirmed' && (
            <View style={styles.rsvpSection}>
              <Text style={styles.sectionTitle}>{t('meetupDetail.rsvp.title')}</Text>

              <View style={styles.rsvpButtons}>
                <Button
                  mode={userRSVP === 'attending' ? 'contained' : 'outlined'}
                  onPress={() => handleRSVP('attending')}
                  disabled={!canChangeRSVP}
                  style={[styles.rsvpButton, userRSVP === 'attending' && styles.rsvpButtonActive]}
                  contentStyle={styles.rsvpButtonContent}
                >
                  ✅ {t('meetupDetail.rsvp.attend')}
                </Button>

                <Button
                  mode={userRSVP === 'declining' ? 'contained' : 'outlined'}
                  onPress={() => handleRSVP('declining')}
                  disabled={!canChangeRSVP}
                  style={[styles.rsvpButton, userRSVP === 'declining' && styles.rsvpButtonActive]}
                  contentStyle={styles.rsvpButtonContent}
                >
                  ❌ {t('meetupDetail.rsvp.decline')}
                </Button>

                <Button
                  mode={userRSVP === 'maybe' ? 'contained' : 'outlined'}
                  onPress={() => handleRSVP('maybe')}
                  disabled={!canChangeRSVP}
                  style={[styles.rsvpButton, userRSVP === 'maybe' && styles.rsvpButtonActive]}
                  contentStyle={styles.rsvpButtonContent}
                >
                  ❓ {t('meetupDetail.rsvp.maybe')}
                </Button>
              </View>

              {!canChangeRSVP && (
                <Text style={styles.rsvpDeadlineText}>{t('meetupDetail.rsvp.deadlineNote')}</Text>
              )}
            </View>
          )}

          {/* Enhanced Participant List with Status */}
          {participants.length > 0 && (
            <View style={styles.participantsSection}>
              <View style={styles.participantsHeader}>
                <Text style={styles.sectionTitle}>{t('meetupDetail.participants.title')}</Text>
                <View style={styles.participantsStats}>
                  <Text style={styles.participantsStatsText}>
                    ✅ {participants.filter(p => p.status === 'attending').length} · ❓{' '}
                    {participants.filter(p => p.status === 'maybe').length} · ❌{' '}
                    {participants.filter(p => p.status === 'declining').length}
                  </Text>
                </View>
              </View>

              <View style={styles.participantsList}>
                {participants.map(
                  (
                    participant,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    index
                  ) => {
                    const statusIcon =
                      participant.status === 'attending'
                        ? '✅'
                        : participant.status === 'maybe'
                          ? '❓'
                          : '❌';
                    const statusColor =
                      participant.status === 'attending'
                        ? '#4CAF50'
                        : participant.status === 'maybe'
                          ? '#FF9800'
                          : '#F44336';

                    return (
                      <View key={participant.id} style={styles.participantItem}>
                        <View style={styles.participantAvatarContainer}>
                          <Avatar.Text
                            size={32}
                            label={participant.name?.charAt(0) || 'P'}
                            style={[
                              styles.participantAvatar,
                              { borderColor: statusColor, borderWidth: 2 },
                            ]}
                          />
                          <Text style={[styles.statusBadge, { color: statusColor }]}>
                            {statusIcon}
                          </Text>
                        </View>
                        <Text style={styles.participantName} numberOfLines={1}>
                          {participant.name}
                        </Text>
                      </View>
                    );
                  }
                )}
              </View>
            </View>
          )}

          {/* Meetup Chat Section */}
          <View style={styles.chatSection}>
            <Text style={styles.sectionTitle}>{t('meetupDetail.chat.title')}</Text>

            {/* Chat Messages */}
            <View style={styles.chatMessages}>
              {chatMessages.length === 0 ? (
                <Text style={styles.emptyChatText}>{t('meetupDetail.chat.emptyMessage')}</Text>
              ) : (
                chatMessages.map(message => (
                  <View key={message.id} style={styles.chatMessage}>
                    <Text style={styles.chatSender}>{message.userName}</Text>
                    <Text style={styles.chatText}>{message.text}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Chat Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                mode='outlined'
                placeholder={t('meetupDetail.chat.placeholder')}
                value={newMessage}
                onChangeText={setNewMessage}
                style={styles.chatInput}
                multiline
                maxLength={200}
                disabled={sendingMessage}
              />
              <IconButton
                icon='send'
                size={24}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                style={styles.sendButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Type-safe color properties
interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  outline: string;
  outlineVariant: string;
  [key: string]: string;
}

// Type for internal participant data
interface InternalParticipant {
  userId: string;
  status: string;
  joinedAt: Date;
  displayName: string;
  profileImage: string | null;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    backButton: {
      margin: 0,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      marginBottom: 20,
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    headerSection: {
      margin: 8,
      marginBottom: 4,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    dateTimeContainer: {
      marginBottom: 4,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 2,
    },
    timeText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    locationTextContainer: {
      flex: 1,
      marginHorizontal: 8,
    },
    locationName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 1,
    },
    locationAddress: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
    weatherSection: {
      margin: 8,
      marginTop: 0,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    weatherHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
      marginLeft: 6,
    },
    weatherContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    weatherIcon: {
      fontSize: 28,
      marginRight: 8,
    },
    weatherDetails: {
      flex: 1,
    },
    weatherTemp: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    weatherCondition: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginVertical: 1,
    },
    weatherRain: {
      fontSize: 12,
      color: '#FF9800',
      fontWeight: '500',
    },
    windInfo: {
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
    },
    windRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    windSpeed: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
    },
    windImpactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    windImpactIcon: {
      fontSize: 13,
      marginRight: 4,
    },
    windImpactText: {
      fontSize: 12,
      fontWeight: '600',
    },
    weatherUnavailable: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    weatherUnavailableIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    weatherUnavailableText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    weatherUnavailableSubtext: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.7,
    },
    rsvpSection: {
      margin: 8,
      marginTop: 0,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    rsvpButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      gap: 6,
    },
    rsvpButton: {
      flex: 1,
      borderRadius: 6,
    },
    rsvpButtonActive: {
      backgroundColor: colors.primary,
    },
    rsvpButtonContent: {
      paddingVertical: 2,
    },
    rsvpDeadlineText: {
      fontSize: 10,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 6,
      fontStyle: 'italic',
    },
    participantsSection: {
      margin: 8,
      marginTop: 0,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    participantsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 6,
      gap: 8,
    },
    participantsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 0,
    },
    participantsStats: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    participantsStatsText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
    },
    participantItem: {
      alignItems: 'center',
      width: 48,
      marginBottom: 4,
    },
    participantAvatarContainer: {
      position: 'relative',
      marginBottom: 3,
    },
    participantAvatar: {
      backgroundColor: colors.primary,
    },
    statusBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      fontSize: 10,
      fontWeight: 'bold',
    },
    participantName: {
      fontSize: 9,
      color: colors.onSurface,
      textAlign: 'center',
      fontWeight: '500',
    },
    chatSection: {
      margin: 8,
      marginTop: 0,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
      minHeight: 100,
    },
    chatMessages: {
      marginTop: 4,
      marginBottom: 4,
      minHeight: 30,
    },
    emptyChatText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: 4,
    },
    chatMessage: {
      marginBottom: 8,
      padding: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 6,
    },
    chatSender: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    chatText: {
      fontSize: 12,
      color: colors.onSurface,
      lineHeight: 16,
    },
    chatInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
    },
    chatInput: {
      flex: 1,
      maxHeight: 80,
    },
    sendButton: {
      margin: 0,
      backgroundColor: colors.primary,
    },
  });

export default MeetupDetailScreen;
