/**
 * Regular Meetup Tab Screen
 * Main container showing upcoming and past meetups with tab navigation
 */

/* eslint-disable react-hooks/rules-of-hooks */
// Note: Hooks are called after early return for theme check, but this is safe
// because the component always renders the same hooks once theme is ready.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  FlatList,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ActivityIndicator,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Surface,
  Chip,
  Avatar,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FAB,
  Menu,
  IconButton,
} from 'react-native-paper';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'expo-linear-gradient';
// Removed unused import: Animatable
import { TabView, SceneMap } from 'react-native-tab-view';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useNavigation, useRoute } from '@react-navigation/native';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

import { useAuth } from '../../contexts/AuthContext';
// 🎯 [KIM FIX] Removed useClub - now using direct meetupService for more reliable data
// import { useClub } from '../../contexts/ClubContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import meetupService from '../../services/meetupService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import clubService from '../../services/clubService';
import clubScheduleService from '../../services/clubScheduleService';
import weatherService from '../../services/weatherService';
import CreateMeetupBottomSheet from '../../components/clubs/CreateMeetupBottomSheet';
import { MeetupStats, MeetupParticipants } from '../../types/meetup';
import { ClubSchedule, getNextOccurrence } from '../../types/clubSchedule';
import { useMeetupChatUnreadCount } from '../../hooks/clubs/useMeetupChatUnreadCount';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient as any);

const { width } = Dimensions.get('window');

// Firebase Timestamp helper type
type FirebaseTimestamp = Timestamp | Date | { seconds: number; nanoseconds: number };

interface MeetupTabProps {
  clubId: string;
  userRole: 'admin' | 'manager' | 'member';
  selectedMeetupLocation?: { id: string; name: string; address: string } | null;
  reopenCreateModal?: boolean;
}

// Meetup type matching ClubContext structure
interface Meetup {
  id: string;
  clubId: string;
  title: string;
  description: string;
  type: string;
  date: FirebaseTimestamp; // Primary date field from ClubContext
  dateTime?: FirebaseTimestamp; // Computed field added in useMemo
  schedule: {
    startTime: FirebaseTimestamp;
    endTime: FirebaseTimestamp;
    duration: number;
  };
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    placeId?: string;
  };
  courtDetails: {
    availableCourts: number;
    courtNumbers?: string;
  };
  participants: MeetupParticipants | { currentCount: number; maxParticipants: number };
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp; // Added in useMemo
  status: string;
}

const RegularMeetupTab: React.FC<MeetupTabProps> = ({
  clubId,
  userRole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedMeetupLocation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reopenCreateModal,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const themeContext = useTheme();

  // 🔴 [KIM 2025-01-12] Get meetup chat unread counts for tab badges
  const { meetupUnreadCounts } = useMeetupChatUnreadCount(currentUser?.uid);

  // 🎯 [KIM FIX] Use direct meetupService instead of ClubContext for reliable real-time updates
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  // 🎯 [KIM FIX] Start with FALSE to prevent skeleton flash on tab switch
  // Skeleton only shows if explicitly set to true AND no data exists
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingMeetups, setIsLoadingMeetups] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // 🌤️ Weather data for each meetup (keyed by meetup ID) - display only, no snapshot saving
  interface WeatherInfo {
    temperature: number;
    temperatureF: number;
    condition: string;
    icon: string;
    chanceOfRain: number;
    windSpeedMph: number;
    lastUpdated: Date;
  }
  const [weatherData, setWeatherData] = useState<{ [meetupId: string]: WeatherInfo }>({});

  // Extract theme with null safety
  const { paperTheme, isThemeReady } = themeContext || {};

  // Create styles using theme (with fallback for safety)
  const styles = React.useMemo(() => {
    if (!paperTheme) {
      console.warn('⚠️ RegularMeetupTab: paperTheme not available, using fallback styles');
      return createStyles(null); // createStyles should handle null gracefully
    }
    return createStyles(paperTheme);
  }, [paperTheme]);

  // Early return if theme not ready
  if (!isThemeReady || !paperTheme) {
    return null; // Loading state while theme initializes
  }

  // Tab navigation state
  const [index, setIndex] = useState(0);
  // 🔧 [KIM FIX 2025-01-12] Use useMemo so routes update when language changes
  const routes = useMemo(
    () => [
      { key: 'upcoming', title: t('regularMeetup.upcomingTab') },
      { key: 'past', title: t('regularMeetup.pastTab') },
    ],
    [t]
  );

  // Data derived from ClubContext
  const [refreshing, setRefreshing] = useState(false);

  // Club schedules for default date calculation
  const [clubSchedules, setClubSchedules] = useState<ClubSchedule[]>([]);

  // 🎯 [KIM] Club home address for location selection
  interface ClubHomeAddress {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
  }
  const [clubHomeAddress, setClubHomeAddress] = useState<ClubHomeAddress | undefined>(undefined);

  // Menu state management - track which meetup menu is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // 🎯 [KIM] BottomSheet state for creating/editing meetup
  const [showCreateBottomSheet, setShowCreateBottomSheet] = useState(false);
  const [bottomSheetMode, setBottomSheetMode] = useState<'create' | 'edit'>('create');
  const [editingMeetup, setEditingMeetup] = useState<Meetup | null>(null);

  const openMenu = (meetupId: string) => setOpenMenuId(meetupId);
  const closeMenu = () => setOpenMenuId(null);

  // Helper to convert Firebase timestamp to Date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toDate = (timestamp: any): Date => {
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.toDate) return timestamp.toDate();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  };

  // 🎯 [KIM FIX] Direct real-time subscription to meetups using clubId prop
  useEffect(() => {
    if (!clubId) {
      setIsLoadingMeetups(false);
      return;
    }

    // 🎯 [KIM FIX] Only show loading skeleton on FIRST ever load, not on tab switches
    // This prevents the skeleton flash when switching tabs
    if (!hasInitiallyLoaded) {
      setIsLoadingMeetups(true);
    }
    console.log('🔍 [RegularMeetupTab] Setting up direct meetup listener for clubId:', clubId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = meetupService.getClubMeetupsRealtime(clubId, 'all', (meetupsData: any) => {
      console.log('🔍 [RegularMeetupTab] Received meetups from listener:', {
        count: meetupsData?.length || 0,
        clubId,
        firstMeetup: meetupsData?.[0],
      });
      setMeetups(meetupsData || []);
      setIsLoadingMeetups(false);
      setHasInitiallyLoaded(true); // Mark that we've loaded data at least once
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [clubId, hasInitiallyLoaded]);

  // Process meetups from context based on user role and timing
  // 🎯 [KIM FIX] 모임 시간 + 2시간 후에 "지난 모임"으로 이동
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  // 🎯 [KIM FIX] 3개월 지난 모임은 "지난 모임"에서 숨김
  const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

  const upcomingMeetups = React.useMemo((): Meetup[] => {
    const now = new Date();
    console.log('🔍 [FILTER] Total meetups received:', meetups.length);
    console.log('🔍 [FILTER] Current userRole:', userRole);

    const dateFiltered = (meetups as Meetup[]).filter(meetup => {
      // Handle both 'date' (from ClubContext) and 'dateTime' (legacy) field names
      const meetupDate = meetup.date;
      const meetupDateObj = toDate(meetupDate);
      // 🎯 [KIM FIX] 모임 시간 + 2시간이 현재보다 미래면 "예정된 모임"
      const meetupEndTime = new Date(meetupDateObj.getTime() + TWO_HOURS_MS);
      const passesDateFilter = meetupEndTime >= now;
      console.log(
        '🔍 [FILTER] Date check - ID:',
        meetup.id,
        'date:',
        meetupDateObj,
        'endTime+2h:',
        meetupEndTime,
        'now:',
        now,
        'passes:',
        passesDateFilter
      );
      return passesDateFilter;
    });

    console.log('🔍 [FILTER] After date filter:', dateFiltered.length);

    const roleFiltered = dateFiltered.filter(meetup => {
      // Admin can see all, members only see confirmed
      const passesRoleFilter =
        userRole === 'admin' || userRole === 'manager' || meetup.status === 'confirmed';
      console.log(
        '🔍 [FILTER] Role check - ID:',
        meetup.id,
        'status:',
        meetup.status,
        'passes:',
        passesRoleFilter
      );
      return passesRoleFilter;
    });

    console.log('🔍 [FILTER] After role filter (final):', roleFiltered.length);

    return roleFiltered
      .map(
        (meetup): Meetup => ({
          ...meetup,
          // Ensure component always gets dateTime field for backwards compatibility
          dateTime: meetup.date,
          updatedAt: meetup.createdAt, // Use createdAt as fallback for updatedAt
        })
      )
      .sort((a, b) => toDate(a.dateTime!).getTime() - toDate(b.dateTime!).getTime());
  }, [meetups, userRole, toDate]);

  // 🎯 [KIM FIX] 모임 시간 + 2시간이 지나면 "지난 모임"으로 이동 (status 무관)
  // 🎯 [KIM FIX] 3개월 지난 모임은 숨김
  const pastMeetups = React.useMemo((): Meetup[] => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - THREE_MONTHS_MS);
    return (
      (meetups as Meetup[])
        .filter(meetup => {
          const meetupDate = meetup.date;
          const meetupDateObj = toDate(meetupDate);
          // 🎯 [KIM FIX] 모임 시간 + 2시간이 현재보다 과거면 "지난 모임"
          const meetupEndTime = new Date(meetupDateObj.getTime() + TWO_HOURS_MS);
          const isPast = meetupEndTime < now;
          // 🎯 [KIM FIX] 3개월 이내의 모임만 표시
          const isWithinThreeMonths = meetupDateObj > threeMonthsAgo;
          return isPast && isWithinThreeMonths;
        })
        // 🎯 [KIM FIX] status === 'completed' 필터 제거 - 시간 기반으로만 판단
        .map(
          (meetup): Meetup => ({
            ...meetup,
            dateTime: meetup.date,
            updatedAt: meetup.createdAt, // Use createdAt as fallback for updatedAt
          })
        )
        .sort((a, b) => toDate(b.dateTime!).getTime() - toDate(a.dateTime!).getTime())
    );
  }, [meetups, toDate]);

  // 🔴 [KIM 2025-01-12] Calculate unread counts per tab (upcoming vs past)
  const { upcomingUnreadCount, pastUnreadCount } = useMemo(() => {
    const upcomingMeetupIds = new Set(upcomingMeetups.map(m => m.id));
    const pastMeetupIds = new Set(pastMeetups.map(m => m.id));

    let upcomingCount = 0;
    let pastCount = 0;

    // 🔍 Debug logging to identify the ID mismatch
    console.log('🔴 [Badge Debug] clubId:', clubId);
    console.log('🔴 [Badge Debug] upcomingMeetupIds:', Array.from(upcomingMeetupIds));
    console.log('🔴 [Badge Debug] meetupUnreadCounts keys:', Object.keys(meetupUnreadCounts));
    console.log('🔴 [Badge Debug] meetupUnreadCounts:', meetupUnreadCounts);

    Object.entries(meetupUnreadCounts).forEach(([meetupId, count]) => {
      const isUpcoming = upcomingMeetupIds.has(meetupId);
      const isPast = pastMeetupIds.has(meetupId);
      console.log(
        `🔴 [Badge Debug] meetupId: ${meetupId}, count: ${count}, isUpcoming: ${isUpcoming}, isPast: ${isPast}`
      );

      if (isUpcoming) {
        upcomingCount += count;
      } else if (isPast) {
        pastCount += count;
      }
    });

    console.log(`🔴 [Badge Debug] FINAL: upcomingCount=${upcomingCount}, pastCount=${pastCount}`);

    return { upcomingUnreadCount: upcomingCount, pastUnreadCount: pastCount };
  }, [upcomingMeetups, pastMeetups, meetupUnreadCounts, clubId]);

  // Removed modal state - now using navigation instead

  // Helper: Convert day name to day of week number
  // Handles multiple formats: "monday", "Mon", "월요일", "월", "Monday", etc.
  const dayNameToDayOfWeek = (dayName: string | undefined): number => {
    if (!dayName) return 2; // Default to Tuesday

    const normalized = dayName.toLowerCase().trim();
    const dayMap: Record<string, number> = {
      // English full
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      // English abbreviated
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      // Korean full
      일요일: 0,
      월요일: 1,
      화요일: 2,
      수요일: 3,
      목요일: 4,
      금요일: 5,
      토요일: 6,
      // Korean abbreviated
      일: 0,
      월: 1,
      화: 2,
      수: 3,
      목: 4,
      금: 5,
      토: 6,
    };

    return dayMap[normalized] ?? 2; // Default to Tuesday if unknown
  };

  // Helper: Parse time string to 24-hour format (HH:MM)
  // Handles both "19:30" and "7:30 PM" formats
  const parseTimeTo24Hour = (timeStr: string | undefined): string => {
    if (!timeStr) return '19:00';

    // Already in HH:MM 24-hour format (e.g., "19:30")
    if (/^\d{1,2}:\d{2}$/.test(timeStr) && !timeStr.toLowerCase().includes('m')) {
      const [h, m] = timeStr.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }

    // 12-hour format like "7:30 PM" or "7:30PM"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3]?.toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return '19:00'; // Default fallback
  };

  // Load club schedules for default date calculation
  // 🚀 Optimized: Parallel fetch from both sources
  useEffect(() => {
    const loadClubSchedules = async () => {
      try {
        console.log('🗓️ [loadClubSchedules] Loading schedules for clubId:', clubId);

        // Parallel fetch: clubSchedules collection AND tennis_clubs document
        const [schedules, clubSnap] = await Promise.all([
          clubScheduleService.getClubSchedules(clubId, true),
          getDoc(doc(db, 'tennis_clubs', clubId)),
        ]);

        console.log(
          '🗓️ [loadClubSchedules] clubScheduleService returned:',
          schedules.length,
          'schedules'
        );

        // 🎯 [KIM] Extract club home address from profile.courtAddress
        if (clubSnap.exists()) {
          const clubData = clubSnap.data();
          const courtAddress = clubData?.profile?.courtAddress;
          console.log('🏠 [loadClubSchedules] Club courtAddress:', courtAddress);

          if (courtAddress && (courtAddress.name || courtAddress.address)) {
            setClubHomeAddress({
              name: courtAddress.name || '',
              address: courtAddress.address || courtAddress.formatted_address || '',
              coordinates: courtAddress.coordinates
                ? { lat: courtAddress.coordinates.lat, lng: courtAddress.coordinates.lng }
                : undefined,
              placeId: courtAddress.placeId,
            });
          }
        }

        // Priority 1: Use clubSchedules collection if available
        if (schedules.length > 0) {
          console.log('🗓️ [loadClubSchedules] Using clubSchedules collection');
          setClubSchedules(schedules);
          return;
        }

        // Priority 2: Fallback to tennis_clubs.settings.meetings
        if (clubSnap.exists()) {
          const meetings = clubSnap.data()?.settings?.meetings;
          console.log('🗓️ [loadClubSchedules] Fallback: tennis_clubs.settings.meetings:', meetings);

          if (meetings && Array.isArray(meetings) && meetings.length > 0) {
            console.log('🗓️ [loadClubSchedules] Converting meetings to schedules');
            const convertedSchedules: ClubSchedule[] = meetings
              .filter((m: { day?: string }) => m && m.day)
              .map((meeting: { day: string; startTime?: string }, index: number) => ({
                id: `legacy-${index}`,
                clubId: clubId,
                title: t('regularMeetup.regularMeetupTitle', { day: meeting.day }),
                scheduleType: 'practice' as const,
                dayOfWeek: dayNameToDayOfWeek(meeting.day) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                time: parseTimeTo24Hour(meeting.startTime),
                duration: 120,
                timezone: 'America/New_York',
                location: { name: '', address: '', indoorOutdoor: 'outdoor' as const },
                participationInfo: {
                  registrationRequired: false,
                  memberOnly: true,
                  guestAllowed: false,
                },
                recurrence: {
                  frequency: 'weekly' as const,
                  interval: 1,
                  startDate: Timestamp.now(),
                },
                isActive: true,
                createdBy: '',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              }));

            setClubSchedules(convertedSchedules);
            return;
          }
        }

        // No schedules found
        setClubSchedules([]);
      } catch (error) {
        console.error('❌ Failed to load club schedules:', error);
        setClubSchedules([]);
      }
    };

    if (clubId) {
      loadClubSchedules();
    }
  }, [clubId]);

  // Pull to refresh - ClubContext handles real-time data updates
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Data is managed by ClubContext with real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 🌤️ Fetch weather data for upcoming meetups (display only, no snapshot saving)
  useEffect(() => {
    let isMounted = true;

    const fetchWeatherForMeetups = async () => {
      const now = new Date();
      const upcoming = meetups.filter(meetup => {
        const meetupDate = toDate(meetup.dateTime || meetup.date);
        return meetupDate > now && meetup.status === 'confirmed';
      });

      if (upcoming.length === 0) return;

      console.log(`🌤️ Fetching weather for ${upcoming.length} upcoming meetups`);

      // Fetch all weather data in parallel
      const weatherPromises = upcoming.map(async meetup => {
        try {
          const meetupDate = toDate(meetup.dateTime || meetup.date);
          const weather = await weatherService.getWeatherForMeetup(meetup.location, meetupDate);

          if (weather) {
            return {
              meetupId: meetup.id,
              data: {
                temperature: weather.temperature,
                temperatureF: weather.temperatureF,
                condition: weather.condition,
                icon: weather.icon,
                chanceOfRain: weather.chanceOfRain || 0,
                windSpeedMph: weather.windSpeedMph || 0,
                lastUpdated: new Date(),
              },
            };
          }
          return null;
        } catch (error) {
          console.warn(`⚠️ Failed to fetch weather for meetup ${meetup.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(weatherPromises);

      if (isMounted) {
        const newWeatherData: { [meetupId: string]: WeatherInfo } = {};
        results.forEach(result => {
          if (result) {
            newWeatherData[result.meetupId] = result.data;
          }
        });
        setWeatherData(prev => ({ ...prev, ...newWeatherData }));
      }
    };

    // Delay initial fetch to let UI settle
    const timeoutId = setTimeout(() => {
      if (meetups.length > 0) {
        fetchWeatherForMeetups();
      }
    }, 500);

    // 15-minute refresh interval
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const intervalId = setInterval(fetchWeatherForMeetups, FIFTEEN_MINUTES);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [meetups]);

  // Navigate to meetup detail
  const handleMeetupPress = useCallback(
    (meetup: Meetup) => {
      navigation.navigate('MeetupDetail', {
        meetupId: meetup.id,
        clubId: clubId,
      });
    },
    [navigation, clubId]
  );

  // Calculate next meetup date from club schedules (fallback: next Tuesday at 7 PM)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateNextMeetupDate = useCallback(() => {
    const now = new Date();

    // If club has active schedules, find the closest upcoming one
    if (clubSchedules.length > 0) {
      const upcomingDates = clubSchedules.map(schedule => ({
        date: getNextOccurrence(schedule, now),
        schedule,
      }));

      // Sort by date and get the closest one
      upcomingDates.sort((a, b) => a.date.getTime() - b.date.getTime());
      return upcomingDates[0].date;
    }

    // Fallback: next Tuesday at 7 PM
    const nextTuesday = new Date(now);
    const daysUntilTuesday = (2 - now.getDay() + 7) % 7; // Tuesday is day 2
    nextTuesday.setDate(now.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday));
    nextTuesday.setHours(19, 0, 0, 0);
    return nextTuesday;
  }, [clubSchedules]);

  // 🎯 [KIM] Handle create new meetup (admin/manager only) - now using BottomSheet
  const handleCreateNewMeetup = useCallback(() => {
    if (!currentUser || (userRole !== 'admin' && userRole !== 'manager')) {
      return;
    }
    // Open the BottomSheet instead of navigating to CreateMeetupScreen
    setShowCreateBottomSheet(true);
  }, [currentUser, userRole]);

  // Get default schedule info for BottomSheet - find the CLOSEST next occurrence
  const defaultScheduleInfo = React.useMemo(() => {
    console.log('🗓️ [RegularMeetupTab] clubSchedules:', clubSchedules.length, 'items');

    if (clubSchedules.length === 0) {
      console.log('🗓️ [RegularMeetupTab] No schedules found, using defaults');
      return {
        defaultDayOfWeek: undefined,
        defaultTime: '19:30',
        defaultLocation: undefined,
      };
    }

    // 🎯 [KIM FIX] Find the schedule with the CLOSEST next occurrence, not just the first one!
    const now = new Date();
    const schedulesWithDates = clubSchedules.map(schedule => ({
      schedule,
      nextDate: getNextOccurrence(schedule, now),
    }));

    // Sort by next occurrence date (closest first)
    schedulesWithDates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    const closestSchedule = schedulesWithDates[0].schedule;
    console.log('🗓️ [RegularMeetupTab] Closest schedule:', {
      dayOfWeek: closestSchedule.dayOfWeek,
      time: closestSchedule.time,
      location: closestSchedule.location?.name,
      nextDate: schedulesWithDates[0].nextDate.toISOString(),
    });

    return {
      defaultDayOfWeek: closestSchedule.dayOfWeek,
      defaultTime: closestSchedule.time || '19:30',
      defaultLocation: closestSchedule.location?.name
        ? {
            name: closestSchedule.location.name,
            address: closestSchedule.location.address || '',
          }
        : undefined,
    };
  }, [clubSchedules]);

  // 🎯 [KIM] Handle edit meetup - now uses BottomSheet instead of navigation
  const handleEditMeetup = useCallback(
    (meetup: Meetup) => {
      if (!currentUser || (userRole !== 'admin' && userRole !== 'manager')) {
        return;
      }

      // Set edit mode and open BottomSheet
      setEditingMeetup(meetup);
      setBottomSheetMode('edit');
      setShowCreateBottomSheet(true);
    },
    [currentUser, userRole]
  );

  // Handle delete meetup
  const handleDeleteMeetup = useCallback(
    (meetup: Meetup) => {
      if (!currentUser || (userRole !== 'admin' && userRole !== 'manager')) {
        return;
      }

      Alert.alert(t('regularMeetup.deleteMeetup'), t('regularMeetup.deleteConfirmation'), [
        {
          text: t('regularMeetup.cancel'),
          style: 'cancel',
        },
        {
          text: t('regularMeetup.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await meetupService.deleteMeetup(meetup.id);
              Alert.alert(t('regularMeetup.success'), t('regularMeetup.meetupDeleted'));
            } catch (error) {
              console.error('Error deleting meetup:', error);
              Alert.alert(t('regularMeetup.error'), t('regularMeetup.deleteError'));
            }
          },
        },
      ]);
    },
    [currentUser, userRole, t]
  );

  // Removed handleCreateMeetupConfirm - now handled by CreateMeetupScreen

  // Get user's participation status for a meetup
  const getUserParticipationStatus = useCallback(
    (meetup: Meetup) => {
      if (!currentUser?.uid || !meetup.participants) return null;
      // Check if participants is a MeetupParticipants map (not a count object)
      if ('currentCount' in meetup.participants) return null;
      return meetup.participants[currentUser.uid]?.status || null;
    },
    [currentUser?.uid]
  );

  // Get participation label based on status
  const getParticipationLabel = useCallback(
    (status: string | null) => {
      if (!status) {
        return t('regularMeetup.join');
      }

      switch (status) {
        case 'attending':
          return t('regularMeetup.attending');
        case 'declining':
          return t('regularMeetup.notAttending');
        case 'maybe':
          return t('regularMeetup.maybe');
        default:
          return t('regularMeetup.join');
      }
    },
    [t]
  );

  // Get participation chip style based on status
  const getParticipationChipStyle = useCallback((status: string | null) => {
    const baseStyle = {
      alignSelf: 'flex-end' as const,
    };

    if (!status) {
      return {
        ...baseStyle,
        borderColor: '#2196F3',
      };
    }

    switch (status) {
      case 'attending':
        return {
          ...baseStyle,
          borderColor: '#4CAF50',
        };
      case 'declining':
        return {
          ...baseStyle,
          borderColor: '#F44336',
        };
      case 'maybe':
        return {
          ...baseStyle,
          borderColor: '#FF9800',
        };
      default:
        return {
          ...baseStyle,
          borderColor: '#2196F3',
        };
    }
  }, []);

  // Get participation text style based on status
  const getParticipationTextStyle = useCallback((status: string | null) => {
    const baseStyle = {
      fontSize: 11,
      fontWeight: '600' as const,
    };

    if (!status) {
      return {
        ...baseStyle,
        color: '#2196F3',
      };
    }

    switch (status) {
      case 'attending':
        return {
          ...baseStyle,
          color: '#4CAF50',
        };
      case 'declining':
        return {
          ...baseStyle,
          color: '#F44336',
        };
      case 'maybe':
        return {
          ...baseStyle,
          color: '#FF9800',
        };
      default:
        return {
          ...baseStyle,
          color: '#2196F3',
        };
    }
  }, []);

  // Render meetup card component with animations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderMeetupCard = ({ item: meetup, index }: { item: Meetup; index: number }) => {
    const isAdmin = userRole === 'admin' || userRole === 'manager';
    const isPending = meetup.status === 'pending';
    const stats = meetupService.calculateMeetupStats(meetup) as MeetupStats;

    // Get user's participation status for this meetup
    const userParticipationStatus = getUserParticipationStatus(meetup);

    // 🔴 [KIM 2025-01-12] Get unread message count for this meetup
    const unreadCount = meetupUnreadCounts[meetup.id] || 0;

    return (
      <View>
        <TouchableOpacity
          style={[styles.meetupCard, isPending && isAdmin && styles.pendingMeetupCard]}
          onPress={() => handleMeetupPress(meetup)}
          activeOpacity={0.7}
        >
          <Card style={styles.card}>
            <Card.Title
              title={toDate(meetup.dateTime).toLocaleDateString(t('common.locale'), {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
              subtitle={`${toDate(meetup.dateTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} • ${meetup.location?.name || 'TBD'}`}
              left={props => (
                <View style={styles.avatarWithBadge}>
                  <Avatar.Icon
                    {...props}
                    icon='tennis'
                    size={40}
                    style={{
                      backgroundColor: isPending
                        ? '#FFA726'
                        : paperTheme?.colors?.primary || '#1976D2',
                    }}
                  />
                  {/* 🔴 [KIM 2025-01-12] Red badge for unread chat messages */}
                  {unreadCount > 0 && (
                    <View style={styles.cardUnreadBadge}>
                      <Text style={styles.cardUnreadBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              right={props =>
                isAdmin ? (
                  <Menu
                    visible={openMenuId === meetup.id}
                    onDismiss={closeMenu}
                    anchor={
                      <IconButton
                        {...props}
                        icon='dots-vertical'
                        onPress={() => openMenu(meetup.id)}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        handleEditMeetup(meetup);
                        closeMenu();
                      }}
                      title={t('regularMeetup.edit')}
                      titleStyle={{ fontSize: 14 }}
                    />
                    <Menu.Item
                      onPress={() => {
                        handleDeleteMeetup(meetup);
                        closeMenu();
                      }}
                      title={t('regularMeetup.deleteAction')}
                      titleStyle={{ fontSize: 14, color: paperTheme?.colors?.error || '#F44336' }}
                    />
                  </Menu>
                ) : null
              }
            />

            <Card.Content style={styles.cardContent}>
              {/* Pending indicator for admin */}
              {isPending && isAdmin && (
                <View style={styles.pendingBanner}>
                  <Text style={styles.pendingText}>{t('regularMeetup.pendingConfirmation')}</Text>
                </View>
              )}

              {/* Status Summary */}
              <View style={styles.statusContainer}>
                {/* 🏟️ Courts */}
                <View style={styles.statusItem}>
                  <Text style={styles.statusIcon}>🏟️</Text>
                  <Text style={styles.statusValue}>
                    {meetup.courtDetails?.availableCourts || 4}
                  </Text>
                  <Text style={styles.statusLabel}>{t('regularMeetup.courts')}</Text>
                </View>

                {/* 👥 Players */}
                <View style={styles.statusItem}>
                  <Text style={styles.statusIcon}>👥</Text>
                  <Text style={styles.statusValue}>{stats.totalAttending}</Text>
                  <Text style={styles.statusLabel}>{t('regularMeetup.players')}</Text>
                </View>

                {/* 😊 Crowdedness - only for confirmed meetups */}
                {meetup.status === 'confirmed' &&
                  (() => {
                    const courts = meetup.courtDetails?.availableCourts || 4;
                    const players = stats.totalAttending;
                    const playersPerCourt = players / courts;
                    // 여유: < 3명/코트, 적정: 3-4명/코트, 붐빔: > 4명/코트
                    let crowdIcon = '😊';
                    let crowdText = t('regularMeetup.crowdOk');
                    let crowdColor = '#4CAF50'; // Green
                    if (playersPerCourt >= 3 && playersPerCourt <= 4) {
                      crowdIcon = '🙂';
                      crowdText = t('regularMeetup.crowdModerate');
                      crowdColor = '#FF9800'; // Orange
                    } else if (playersPerCourt > 4) {
                      crowdIcon = '😰';
                      crowdText = t('regularMeetup.crowdCrowded');
                      crowdColor = '#F44336'; // Red
                    }
                    return (
                      <View style={styles.statusItem}>
                        <Text style={styles.statusIcon}>{crowdIcon}</Text>
                        <Text style={[styles.statusValue, { color: crowdColor }]}>{crowdText}</Text>
                      </View>
                    );
                  })()}

                {/* Participation status chip */}
                {meetup.status === 'confirmed' && (
                  <Chip
                    mode='outlined'
                    compact
                    style={getParticipationChipStyle(userParticipationStatus)}
                    textStyle={getParticipationTextStyle(userParticipationStatus)}
                  >
                    {getParticipationLabel(userParticipationStatus)}
                  </Chip>
                )}
              </View>

              {/* 🌤️ Weather Info with Wind */}
              {meetup.status === 'confirmed' &&
                weatherData[meetup.id] &&
                (() => {
                  const weather = weatherData[meetup.id];
                  const rainChance = weather.chanceOfRain || 0;
                  const isHighRainChance = rainChance >= 50;
                  const conditionLower = weather.condition?.toLowerCase() || '';
                  const isSnowCondition =
                    conditionLower.includes('snow') || conditionLower.includes('sleet');
                  const isFogCondition = conditionLower.includes('fog');

                  // Override icon based on precipitation type
                  const displayIcon = isFogCondition
                    ? '🌫️'
                    : isSnowCondition
                      ? '❄️'
                      : isHighRainChance
                        ? '🌧️'
                        : weather.icon;

                  // Tennis play condition message
                  const getPrecipitationWarning = () => {
                    if (isSnowCondition) {
                      return { text: t('regularMeetup.snowCancelLikely'), color: '#F44336' };
                    }
                    if (isFogCondition) {
                      return { text: t('regularMeetup.fogWarning'), color: '#FF9800' };
                    }
                    if (rainChance >= 80) {
                      return { text: t('regularMeetup.rainCancelLikely'), color: '#F44336' };
                    }
                    if (rainChance >= 50) {
                      return { text: t('regularMeetup.rainExpected'), color: '#FF9800' };
                    }
                    return null;
                  };

                  const precipWarning = getPrecipitationWarning();

                  return (
                    <View style={styles.weatherContainer}>
                      <Text style={styles.weatherIcon}>{displayIcon}</Text>
                      <Text style={styles.weatherTemp}>{weather.temperatureF}°F</Text>

                      {precipWarning ? (
                        <>
                          <Text style={[styles.rainChance, { marginLeft: 4 }]}>
                            💧{rainChance}%
                          </Text>
                          <Text style={[styles.windWarning, { color: precipWarning.color }]}>
                            {precipWarning.text}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.windSpeed}>🌬️{weather.windSpeedMph}mph</Text>
                          {/* 🎯 [KIM FIX] Wind warning threshold aligned with detail screen:
                              - 0-12 mph: No warning (playable)
                              - 13-20 mph: ⚠️ Wind warning (affects play)
                              - 20+ mph: Difficult */}
                          {weather.windSpeedMph > 12 && (
                            <Text style={styles.windWarning}>
                              {t('regularMeetup.windyWarning')}
                            </Text>
                          )}
                          {rainChance > 30 && (
                            <Text style={styles.rainChance}>💧{rainChance}%</Text>
                          )}
                        </>
                      )}
                    </View>
                  );
                })()}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>
    );
  };

  // 🎯 [KIM FIX] Theme-aware shimmer colors to prevent white flash in dark mode
  const shimmerColors = React.useMemo(() => {
    const isDarkMode = paperTheme?.dark;
    if (isDarkMode) {
      // Dark mode: use subtle dark grays
      return ['#2a2a2a', '#3a3a3a', '#2a2a2a'];
    }
    // Light mode: use light grays
    return ['#f0f0f0', '#e0e0e0', '#f0f0f0'];
  }, [paperTheme?.dark]);

  // Skeleton loader component
  const renderSkeletonCard = () => (
    <View style={[styles.meetupCard, styles.skeletonCard]}>
      <Card style={styles.card}>
        <View style={styles.skeletonHeader}>
          <ShimmerPlaceholder style={styles.skeletonAvatar} shimmerColors={shimmerColors} />
          <View style={styles.skeletonTitleContainer}>
            <ShimmerPlaceholder style={styles.skeletonTitle} shimmerColors={shimmerColors} />
            <ShimmerPlaceholder style={styles.skeletonSubtitle} shimmerColors={shimmerColors} />
          </View>
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonStats}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.skeletonStatItem}>
                <ShimmerPlaceholder
                  style={styles.skeletonStatValue}
                  shimmerColors={shimmerColors}
                />
                <ShimmerPlaceholder
                  style={styles.skeletonStatLabel}
                  shimmerColors={shimmerColors}
                />
              </View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );

  // Skeleton loader for multiple cards
  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(3)].map((_, index) => (
        <View key={index}>{renderSkeletonCard()}</View>
      ))}
    </View>
  );

  // Enhanced empty state component with actionable buttons
  const renderEmptyState = (type: 'upcoming' | 'past') => {
    const isAdmin = userRole === 'admin' || userRole === 'manager';

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>{type === 'upcoming' ? '📅' : '📝'}</Text>
        <Text style={styles.emptyStateTitle}>
          {type === 'upcoming'
            ? t('regularMeetup.noUpcomingMeetups')
            : t('regularMeetup.noPastMeetups')}
        </Text>
        <Text style={styles.emptyStateDescription}>
          {type === 'upcoming'
            ? isAdmin
              ? t('regularMeetup.createFirstMeetup')
              : t('regularMeetup.meetupsWillAppear')
            : t('regularMeetup.completedMeetupsWillAppear')}
        </Text>

        {/* 🆕 [KIM] Meetup benefits hint for admins/managers */}
        {type === 'upcoming' && isAdmin && (
          <Text style={styles.emptyStateEncouragement}>
            {t('regularMeetup.meetupBenefitsHint')}
          </Text>
        )}

        {/* Encouraging message for members */}
        {type === 'upcoming' && !isAdmin && (
          <Text style={styles.emptyStateEncouragement}>
            {t('regularMeetup.adminsWillSchedule')}
          </Text>
        )}
      </View>
    );
  };

  // 🎯 [KIM FIX] NEVER show skeleton - prevents flash on tab switch
  // Data loads fast enough that empty FlatList → data appearing is smoother
  // than skeleton flash. The FlatList shows empty state or data directly.
  const shouldShowSkeleton = false;

  // Upcoming tab scene
  const UpcomingRoute = () => (
    <View style={styles.tabContent}>
      {shouldShowSkeleton ? (
        renderSkeletonLoader()
      ) : (
        <FlatList
          data={upcomingMeetups}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => renderMeetupCard({ item, index })}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={() => renderEmptyState('upcoming')}
          contentContainerStyle={{ ...styles.listContent, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  // Past tab scene
  const PastRoute = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={pastMeetups}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => renderMeetupCard({ item, index })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={() => renderEmptyState('past')}
        contentContainerStyle={{ ...styles.listContent, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  // Custom tab bar with integrated New Meetup button
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTabBar = (props: any) => (
    <View style={styles.tabBarContainer}>
      {/* 🔴 [KIM 2025-01-12] Custom tab buttons with badges instead of TabBar */}
      <View style={styles.customTabBar}>
        {props.navigationState.routes.map((route: { key: string; title: string }, i: number) => {
          const focused = props.navigationState.index === i;
          const badgeCount = route.key === 'upcoming' ? upcomingUnreadCount : pastUnreadCount;
          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.customTabItem, focused && styles.customTabItemFocused]}
              onPress={() => setIndex(i)}
            >
              <View style={styles.tabLabelContainer}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? paperTheme?.colors?.primary || '#1976D2'
                        : paperTheme?.colors?.onSurfaceVariant || '#666666',
                      fontWeight: focused ? '600' : '400',
                    },
                  ]}
                >
                  {route.title}
                </Text>
                {badgeCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                  </View>
                )}
              </View>
              {focused && <View style={styles.customTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {(userRole === 'admin' || userRole === 'manager') && (
        <Button
          mode='contained'
          icon='plus'
          onPress={handleCreateNewMeetup}
          style={styles.headerButton}
          contentStyle={styles.headerButtonContent}
          labelStyle={styles.headerButtonLabel}
          compact
        >
          {t('regularMeetup.newMeetup')}
        </Button>
      )}
    </View>
  );

  // Scene map
  const renderScene = SceneMap({
    upcoming: UpcomingRoute,
    past: PastRoute,
  });

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width }}
      />

      {/* 🎯 [KIM] BottomSheet for creating/editing meetups */}
      <CreateMeetupBottomSheet
        visible={showCreateBottomSheet}
        onDismiss={() => {
          setShowCreateBottomSheet(false);
          // Reset edit mode state
          setBottomSheetMode('create');
          setEditingMeetup(null);
        }}
        clubId={clubId}
        defaultLocation={defaultScheduleInfo.defaultLocation}
        clubHomeAddress={clubHomeAddress}
        defaultTime={defaultScheduleInfo.defaultTime}
        defaultDayOfWeek={defaultScheduleInfo.defaultDayOfWeek}
        // 🎯 [KIM] Edit mode props
        mode={bottomSheetMode}
        meetupId={editingMeetup?.id}
        initialMeetup={
          editingMeetup
            ? {
                dateTime: toDate(editingMeetup.dateTime || editingMeetup.date),
                location: editingMeetup.location || {
                  name: '',
                  address: '',
                },
                courtCount: editingMeetup.courtDetails?.availableCourts || 4,
                courtNumbers: editingMeetup.courtDetails?.courtNumbers || '',
              }
            : undefined
        }
        onSuccess={() => {
          console.log(
            bottomSheetMode === 'edit'
              ? '✅ Meetup updated successfully!'
              : '✅ Meetup created successfully!'
          );
        }}
      />
    </View>
  );
};

// Helper function to get status color
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getStatusColor = (color: string) => {
  switch (color) {
    case 'green':
      return '#4CAF50';
    case 'blue':
      return '#2196F3';
    case 'orange':
      return '#FF9800';
    case 'red':
      return '#F44336';
    default:
      return '#666';
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (paperTheme: any) => {
  // Fallback colors when theme is not available
  const fallbackColors = {
    background: '#000000',
    surface: '#1C1C1E',
    primary: '#007AFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#98989D',
    outline: '#48484A',
    error: '#FF3B30',
  };

  const colors = paperTheme?.colors || fallbackColors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      textAlign: 'center',
    },
    tabBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      elevation: 2,
      shadowColor: colors.shadow || '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      // 🔧 [KIM FIX 2025-01-10] Ensure minimum height for touch targets
      minHeight: 48,
      zIndex: 1,
    },
    headerButton: {
      marginRight: 12,
      marginVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    headerButtonContent: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    headerButtonLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    tabBar: {
      flex: 1,
      backgroundColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
      // 🔧 [KIM FIX 2025-01-10] Explicit height for better touch targets on iOS
      height: 48,
    },
    tabIndicator: {
      backgroundColor: colors.primary,
      height: 3,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'none',
    },
    // 🔴 [KIM 2025-01-12] Tab badge styles for unread counts
    tabLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBadge: {
      backgroundColor: colors.error || '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6,
      paddingHorizontal: 6,
    },
    tabBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    // 🔴 [KIM 2025-01-12] Custom tab bar styles for badges
    customTabBar: {
      flex: 1, // 🔧 CRITICAL: Take up remaining space in row container
      flexDirection: 'row',
      backgroundColor: 'transparent',
      height: 48,
    },
    customTabItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    customTabItemFocused: {
      // No additional style needed - indicator shows focus
    },
    customTabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 16,
      right: 16,
      height: 3,
      backgroundColor: colors.primary,
      borderRadius: 1.5,
    },
    tabContent: {
      flex: 1,
      backgroundColor: colors.background, // 🎯 [KIM FIX] Prevent white flash on tab switch
    },
    // Skeleton loader styles - 🎯 [KIM FIX] Theme-aware backgrounds to prevent white flash
    skeletonContainer: {
      padding: 16,
      paddingBottom: 80,
      backgroundColor: colors.background,
    },
    skeletonCard: {
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
    skeletonHeader: {
      flexDirection: 'row',
      padding: 16,
      alignItems: 'center',
      backgroundColor: colors.surface, // 🎯 [KIM FIX] Prevent white flash
    },
    skeletonAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 16,
    },
    skeletonTitleContainer: {
      flex: 1,
    },
    skeletonTitle: {
      width: '70%',
      height: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    skeletonSubtitle: {
      width: '50%',
      height: 14,
      borderRadius: 7,
    },
    skeletonContent: {
      padding: 16,
      paddingTop: 0,
      backgroundColor: colors.surface, // 🎯 [KIM FIX] Prevent white flash
    },
    skeletonStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    skeletonStatItem: {
      alignItems: 'center',
      minWidth: 60,
    },
    skeletonStatValue: {
      width: 30,
      height: 20,
      borderRadius: 10,
      marginBottom: 4,
    },
    skeletonStatLabel: {
      width: 40,
      height: 12,
      borderRadius: 6,
    },
    listContent: {
      padding: 16,
      paddingBottom: 80, // Restore appropriate padding for FAB clearance
      flexGrow: 1,
      backgroundColor: colors.background, // 🎯 [KIM FIX] Prevent white flash
    },
    meetupCard: {
      marginBottom: 12,
    },
    pendingMeetupCard: {
      transform: [{ scale: 1.02 }],
    },
    // 🔴 [KIM 2025-01-12] Avatar container for badge positioning
    avatarWithBadge: {
      position: 'relative',
    },
    cardUnreadBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#f44336',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    cardUnreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    card: {
      borderRadius: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      backgroundColor: colors.surface, // 🎯 [KIM FIX] Explicit background to prevent white flash in dark mode
    },
    cardContent: {
      padding: 16,
    },
    pendingBanner: {
      backgroundColor: colors.warningContainer || '#FFA726',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
      alignSelf: 'flex-start',
    },
    pendingText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onWarningContainer || '#000000',
    },
    dateTimeContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 8,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginRight: 12,
    },
    timeText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    locationText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginLeft: 6,
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusItem: {
      alignItems: 'center',
      minWidth: 60,
    },
    statusIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
    },
    statusLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    statusChip: {
      alignSelf: 'flex-end',
    },
    statusChipText: {
      fontSize: 11,
      fontWeight: '600',
    },
    // 🌤️ [KIM 2025-01-10] Weather styles restored - display only (no snapshot)
    weatherContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 12,
    },
    weatherIcon: {
      fontSize: 20,
    },
    weatherTemp: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
    windSpeed: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    windWarning: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FF9800',
    },
    rainChance: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    confirmButton: {
      marginTop: 12,
      borderRadius: 8,
    },
    confirmButtonContent: {
      paddingVertical: 4,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyStateIcon: {
      fontSize: 60,
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyStateButton: {
      marginTop: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    emptyStateButtonContent: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    emptyStateEncouragement: {
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
      fontWeight: '500',
      marginTop: 8,
    },
  });
};

export default RegularMeetupTab;
