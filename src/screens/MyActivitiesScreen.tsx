/**
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../contexts/ActivityContext';
import { PartnerInvitation } from '../types/match';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getNTRPLabelByKey, NTRP_LEVELS } from '../components/common/LtrSelector';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import BadgeGallery from '../components/profile/BadgeGallery';
import FriendsScreen from '../components/friends/FriendsScreen';
import ActivityTabContent from '../components/activity/ActivityTabContent';
import PerformanceChart from '../components/analytics/PerformanceChart';
import ActivityService from '../services/activityService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import userService from '../services/userService';
import { EventWithParticipation, ParticipationApplication } from '../types/activity';

// Types
interface UserProfile {
  id: string;
  nickname: string;
  email?: string;
  displayName?: string;
  skillLevel: string;
  ltrLevel?: string;
  playingStyle?: string;
  location: string;
  activityRegions?: string[];
  languages?: string[];
  maxTravelDistance?: number;
  goals?: string;
  profileImage?: string;
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
    eloRating: number;
    totalEvents: number;
  };
  badges: Badge[];
  joinedAt: Date;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface MatchRecord {
  id: string;
  title: string;
  type: 'match' | 'meetup';
  isRanked: boolean;
  opponent?: string;
  location: string;
  date: Date;
  result?: 'win' | 'loss' | 'draw';
  score?: string;
  eloChange?: number;
  skillLevel?: string;
}

type MyActivitiesTabType = 'profile' | 'stats' | 'events' | 'friends' | 'settings';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<MainTabParamList, 'MyProfile'>;

const MyActivitiesScreen = () => {
  const { t, currentLanguage } = useLanguage();
  const { currentUser, signOut } = useAuth();
  const { myApplications, isLoadingApplications } = useActivities();
  const navigation = useNavigation<NavigationProp>();

  const route = useRoute<RouteProps>();

  const [
    loading,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLoading,
  ] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 🎯 [KIM FIX] Support initialTab from navigation params
  const mapInitialTab = (
    paramTab: 'information' | 'stats' | 'activity' | 'friends' | 'settings' | undefined
  ): MyActivitiesTabType => {
    switch (paramTab) {
      case 'information':
        return 'profile';
      case 'activity':
        return 'events';
      default:
        return paramTab || 'profile';
    }
  };

  const initialTabFromParams = mapInitialTab(route.params?.initialTab);
  const [activeTab, setActiveTab] = useState<MyActivitiesTabType>(initialTabFromParams);

  // Settings states
  const [lightningMatchNotifications, setLightningMatchNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);

  // Data states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [matchRecords, setMatchRecords] = useState<MatchRecord[]>([]);
  const [eloHistory, setEloHistory] = useState<
    Array<{ date: Date; elo: number; gameType: string }>
  >([]);

  // Activity data states
  const [appliedEvents, setAppliedEvents] = useState<EventWithParticipation[]>([]);
  const [hostedEvents, setHostedEvents] = useState<EventWithParticipation[]>([]);
  const [pastEvents, setPastEvents] = useState<EventWithParticipation[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Partner invitation state
  const [partnerInvitations, setPartnerInvitations] = useState<
    (PartnerInvitation & { id: string })[]
  >([]);

  // 🎯 [FRIEND INVITE] Friend invitation state
  const [friendInvitations, setFriendInvitations] = useState<
    Array<{
      eventId: string;
      eventTitle: string;
      eventDate?: string;
      eventTime?: string;
      eventLocation?: string;
      hostId: string;
      hostName: string;
      gameType?: string;
      status: 'pending' | 'accepted' | 'rejected';
      invitedAt: string;
    }>
  >([]);

  // NTRP 레벨에 맞는 설명 생성 함수
  // 🦾 IRON MAN: Updated to handle both string and object formats
  const getLtrLevelDescription = (ltrLevel: string | object | undefined): string => {
    if (!ltrLevel) return '';

    // Handle new object format
    if (typeof ltrLevel === 'object') {
      ltrLevel = (ltrLevel as { selfAssessed?: string }).selfAssessed || '';
      if (!ltrLevel) return '';
    }

    const level = NTRP_LEVELS.find(level => level.key === ltrLevel || ltrLevel.includes(level.key));

    if (level) {
      return t(`ntrp.label.${level.key}`);
    }

    return ltrLevel;
  };

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadMatchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // 🎯 [KIM FIX] Update activeTab when route params change
  useEffect(() => {
    if (route.params?.initialTab) {
      const mappedTab = mapInitialTab(route.params.initialTab);
      setActiveTab(mappedTab);
      console.log('🎯 [MyActivitiesScreen] Tab set from navigation params:', mappedTab);
    }
  }, [route.params?.initialTab]);

  // 🔥 [ROOT CAUSE FIX] Load applied events from ActivityContext myApplications
  useEffect(() => {
    if (!currentUser?.uid || isLoadingApplications) return;

    console.log('🔄 [MyActivitiesScreen] Loading applied events from myApplications', {
      applicationsCount: myApplications.length,
    });

    const loadAppliedEventsFromApplications = async () => {
      setActivityLoading(true);

      try {
        // 🎯 [KIM FIX] 취소된 application 24시간 후 필터링
        const now = new Date();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

        const filteredApplications = myApplications.filter(app => {
          // 취소된 상태인지 확인
          const isCancelled =
            app.status === 'cancelled' ||
            app.status === 'cancelled_by_user' ||
            app.status === 'cancelled_by_host';

          if (!isCancelled) return true; // 취소되지 않은 application은 유지

          // 취소된 경우, updatedAt으로부터 24시간이 지났는지 확인
          let updatedAtDate: Date;
          if (app.updatedAt) {
            if (typeof app.updatedAt === 'object' && 'toDate' in app.updatedAt) {
              updatedAtDate = (app.updatedAt as { toDate: () => Date }).toDate();
            } else if (typeof app.updatedAt === 'object' && 'seconds' in app.updatedAt) {
              updatedAtDate = new Date((app.updatedAt as { seconds: number }).seconds * 1000);
            } else {
              updatedAtDate = new Date(app.updatedAt as string);
            }
          } else {
            return false; // updatedAt이 없으면 제거
          }

          const timeSinceCancelled = now.getTime() - updatedAtDate.getTime();
          const shouldHide = timeSinceCancelled > TWENTY_FOUR_HOURS_MS;

          if (shouldHide) {
            console.log('🗑️ [MyActivitiesScreen] Hiding cancelled application (>24h):', {
              applicationId: app.id,
              status: app.status,
              updatedAt: updatedAtDate.toISOString(),
            });
          }

          return !shouldHide; // 24시간 이내면 유지
        });

        // Get unique eventIds from filtered applications
        const eventIds = Array.from(new Set(filteredApplications.map(app => app.eventId)));

        console.log('📥 [MyActivitiesScreen] Fetching events for eventIds:', eventIds);

        if (eventIds.length === 0) {
          setAppliedEvents([]);
          setActivityLoading(false);
          return;
        }

        // Fetch all events
        const eventsPromises = eventIds.map(async eventId => {
          const eventDoc = await getDocs(
            query(collection(db, 'events'), where('__name__', '==', eventId))
          );

          if (eventDoc.empty) {
            console.warn(`⚠️ [MyActivitiesScreen] Event not found: ${eventId}`);
            return null;
          }

          const eventData = eventDoc.docs[0].data();
          const application = filteredApplications.find(app => app.eventId === eventId);

          // Convert Firestore timestamps to Date objects
          const event: EventWithParticipation = {
            id: eventDoc.docs[0].id,
            ...(eventData as Omit<EventWithParticipation, 'id'>),
            scheduledTime: eventData.scheduledTime?.toDate?.() || new Date(eventData.scheduledTime),
            createdAt: eventData.createdAt?.toDate?.() || new Date(eventData.createdAt),
            updatedAt: eventData.updatedAt?.toDate?.() || new Date(eventData.updatedAt),
            myApplication: application
              ? ({
                  ...application,
                  appliedAt:
                    typeof application.appliedAt === 'object' && 'toDate' in application.appliedAt
                      ? (application.appliedAt as { toDate: () => Date }).toDate()
                      : typeof application.appliedAt === 'object' &&
                          'seconds' in application.appliedAt
                        ? new Date((application.appliedAt as { seconds: number }).seconds * 1000)
                        : new Date(application.appliedAt as string),
                } as ParticipationApplication)
              : undefined,
          };

          return event;
        });

        const events = (await Promise.all(eventsPromises)).filter(
          (e): e is EventWithParticipation => e !== null
        );

        // Filter for upcoming events only
        const upcomingEvents = events.filter(event => event.status === 'upcoming');

        console.log('✅ [MyActivitiesScreen] Loaded applied events:', {
          total: events.length,
          upcoming: upcomingEvents.length,
        });

        setAppliedEvents(upcomingEvents);
      } catch (error) {
        console.error('❌ [MyActivitiesScreen] Error loading applied events:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    loadAppliedEventsFromApplications();
  }, [currentUser?.uid, myApplications, isLoadingApplications]);

  // Cleanup subscriptions on unmount (only for hosted and past events)
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to real-time updates for hosted and past events
    const cleanup = loadActivityData();

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Partner invitations listener
  useEffect(() => {
    if (!currentUser) return;

    const invitationsRef = collection(db, 'partner_invitations');
    const invitationsQuery = query(
      invitationsRef,
      where('invitedUserId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(invitationsQuery, snapshot => {
      const invitations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as PartnerInvitation & { id: string })
        .filter(inv => {
          // Filter out expired invitations (older than 24 hours)
          const expiresAt = inv.expiresAt instanceof Date ? inv.expiresAt : inv.expiresAt.toDate();
          return expiresAt >= new Date();
        });
      setPartnerInvitations(invitations);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 🎯 [FRIEND INVITE] Friend invitations listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('🎯 [FRIEND_INVITE] Setting up friend invitations listener for:', currentUser.uid);

    const unsubscribe = ActivityService.subscribeToFriendInvitations(
      currentUser.uid,
      invitations => {
        console.log('🎯 [FRIEND_INVITE] Received invitations:', invitations.length);
        setFriendInvitations(invitations);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const loadUserData = async () => {
    if (!currentUser) return;

    setUserProfile({
      id: currentUser.uid,
      nickname: currentUser.displayName || 'Lightning Pickleball Player',
      email: currentUser.email ?? undefined,
      displayName: currentUser.displayName ?? undefined,
      skillLevel: currentUser.skillLevel,
      ltrLevel: currentUser.ltrLevel,
      playingStyle: currentUser.playingStyle,
      // 🎯 [KIM FIX] Privacy: Only use city, never expose street address
      location: (() => {
        const loc = (currentUser as unknown as { location?: { city?: string; state?: string } })
          .location;
        if (loc?.city && loc?.state) return `${loc.city}, ${loc.state}`;
        if (loc?.city) return loc.city;
        return undefined;
      })(),
      activityRegions: (currentUser as unknown as { activityRegions?: string[] }).activityRegions,
      languages: currentUser.languages,
      maxTravelDistance: currentUser.maxTravelDistance,
      goals: currentUser.goals ?? undefined,
      profileImage: currentUser.photoURL ?? undefined,
      stats: {
        matchesPlayed: 15,
        wins: 9,
        losses: 6,
        winRate: 60,
        currentStreak: 2,
        eloRating: 1456,
        totalEvents: 25,
      },
      badges: [
        {
          id: '1',
          name: t('myActivities.mockData.badges.firstWin.name'),
          description: t('myActivities.mockData.badges.firstWin.description'),
          icon: '🏆',
          unlockedAt: new Date('2024-01-15'),
          tier: 'bronze',
        },
        {
          id: '2',
          name: t('myActivities.mockData.badges.winStreak.name'),
          description: t('myActivities.mockData.badges.winStreak.description'),
          icon: '🔥',
          unlockedAt: new Date('2024-02-20'),
          tier: 'silver',
        },
        {
          id: '3',
          name: t('myActivities.mockData.badges.leagueChampion.name'),
          description: t('myActivities.mockData.badges.leagueChampion.description'),
          icon: '👑',
          unlockedAt: new Date('2024-03-10'),
          tier: 'gold',
        },
      ],
      joinedAt: new Date('2024-01-01'),
    });

    // Load real ELO history from match_history subcollection
    await loadEloHistory();
  };

  const loadEloHistory = async () => {
    if (!currentUser) {
      console.log('⚠️ No user logged in, cannot load ELO history');
      return;
    }

    try {
      console.log('📊 Loading ELO history from match_history...');

      // Query match_history subcollection ordered by date
      const matchHistoryRef = collection(db, 'users', currentUser.uid, 'match_history');
      const q = query(matchHistoryRef, orderBy('date', 'asc'));
      const snapshot = await getDocs(q);

      console.log(`📊 Found ${snapshot.size} match history records`);

      if (snapshot.empty) {
        console.log('📊 No match history found - ELO chart will be empty');
        setEloHistory([]);
        return;
      }

      // Transform match history to ELO history format
      const history = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);

        return {
          date: date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          }) as unknown as Date,
          elo: data.newElo || data.eloRating || 1200,
          gameType: data.context || 'unknown',
        };
      });

      console.log(`✅ Loaded ${history.length} ELO history points`);
      setEloHistory(history);
    } catch (error) {
      console.error('❌ Error loading ELO history:', error);
      // Set empty array on error
      setEloHistory([]);
    }
  };

  const loadAdditionalData = async () => {
    try {
      await loadMatchRecords();
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  };

  const loadMatchRecords = async () => {
    try {
      const mockMatches = [
        {
          id: '1',
          title: t('myActivities.mockData.matches.weekendSingles.title'),
          type: 'match' as const,
          isRanked: true,
          opponent: t('myActivities.mockData.matches.weekendSingles.opponent'),
          location: t('myActivities.mockData.matches.weekendSingles.location'),
          date: new Date('2024-12-01'),
          result: 'win' as const,
          score: '6-4, 6-2',
          eloChange: +12,
          skillLevel: 'Intermediate',
        },
        {
          id: '2',
          title: t('myActivities.mockData.matches.eveningDoubles.title'),
          type: 'match' as const,
          isRanked: true,
          opponent: t('myActivities.mockData.matches.eveningDoubles.opponent'),
          location: t('myActivities.mockData.matches.eveningDoubles.location'),
          date: new Date('2024-11-28'),
          result: 'loss' as const,
          score: '4-6, 6-3, 4-6',
          eloChange: -8,
          skillLevel: 'Intermediate',
        },
        {
          id: '3',
          title: t('myActivities.mockData.matches.morningPractice.title'),
          type: 'match' as const,
          isRanked: true,
          opponent: t('myActivities.mockData.matches.morningPractice.opponent'),
          location: t('myActivities.mockData.matches.morningPractice.location'),
          date: new Date('2024-11-25'),
          result: 'win' as const,
          score: '6-3, 6-4',
          eloChange: +15,
          skillLevel: 'Intermediate',
        },
      ];

      const filteredMatches = mockMatches
        .filter(record => record.type === 'match')
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      setMatchRecords(filteredMatches);
    } catch (error) {
      console.error('Error loading match records:', error);
    }
  };

  const loadActivityData = () => {
    if (!currentUser?.uid) return;

    // 🔥 [ROOT CAUSE FIX] Applied events now loaded from ActivityContext in separate useEffect

    // Subscribe to hosted events with real-time updates
    const unsubscribeHosted = ActivityService.subscribeToHostedEvents(
      currentUser.uid,
      events => {
        setHostedEvents(events);
      },
      { status: 'upcoming' }
    );

    // Subscribe to past events with real-time updates
    const unsubscribePast = ActivityService.subscribeToPastEvents(currentUser.uid, events => {
      setPastEvents(events);
    });

    // Return cleanup function
    return () => {
      unsubscribeHosted();
      unsubscribePast();
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdditionalData();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handleLogout = async () => {
    Alert.alert(t('myActivities.alerts.signOut.title'), t('myActivities.alerts.signOut.message'), [
      {
        text: t('myActivities.alerts.signOut.cancel'),
        style: 'cancel',
      },
      {
        text: t('myActivities.alerts.signOut.confirm'),
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const handleAcceptPartnerInvitation = async (invitationId: string) => {
    try {
      const invitation = partnerInvitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      // Update invitation status
      await updateDoc(doc(db, 'partner_invitations', invitationId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });

      // Update event status from 'partner_pending' to 'in_progress'
      const eventRef = doc(db, 'events', invitation.eventId);
      await updateDoc(eventRef, {
        status: 'in_progress',
        partnerAccepted: true,
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        t('myActivities.alerts.partnerInvitation.success.title'),
        t('myActivities.alerts.partnerInvitation.success.message')
      );
    } catch (error) {
      console.error('Error accepting partner invitation:', error);
      Alert.alert(
        t('myActivities.alerts.partnerInvitation.error.title'),
        t('myActivities.alerts.partnerInvitation.error.acceptMessage')
      );
    }
  };

  const handleRejectPartnerInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'partner_invitations', invitationId), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        t('myActivities.alerts.partnerInvitation.rejected.title'),
        t('myActivities.alerts.partnerInvitation.rejected.message')
      );
    } catch (error) {
      console.error('Error rejecting partner invitation:', error);
      Alert.alert(
        t('myActivities.alerts.partnerInvitation.error.title'),
        t('myActivities.alerts.partnerInvitation.error.rejectMessage')
      );
    }
  };

  const handleReAcceptPartnerInvitation = async (invitationId: string) => {
    // Same logic as handleAcceptPartnerInvitation
    await handleAcceptPartnerInvitation(invitationId);
  };

  // 🎯 [FRIEND INVITE] Handle friend invitation accept
  const handleAcceptFriendInvitation = async (eventId: string) => {
    try {
      console.log('🎯 [FRIEND_INVITE] Accepting friend invitation:', eventId);
      await ActivityService.respondToFriendInvite(eventId, 'accept');

      Alert.alert(
        t('myActivities.alerts.friendInvitation.accepted.title'),
        t('myActivities.alerts.friendInvitation.accepted.message')
      );

      // Refresh data
      loadActivityData();
    } catch (error) {
      console.error('❌ [FRIEND_INVITE] Error accepting invitation:', error);
      Alert.alert(
        t('myActivities.alerts.friendInvitation.error.title'),
        t('myActivities.alerts.friendInvitation.error.acceptMessage')
      );
    }
  };

  // 🎯 [FRIEND INVITE] Handle friend invitation reject
  const handleRejectFriendInvitation = async (eventId: string) => {
    try {
      console.log('🎯 [FRIEND_INVITE] Rejecting friend invitation:', eventId);
      await ActivityService.respondToFriendInvite(eventId, 'reject');

      Alert.alert(
        t('myActivities.alerts.friendInvitation.rejected.title'),
        t('myActivities.alerts.friendInvitation.rejected.message')
      );

      // Refresh data
      loadActivityData();
    } catch (error) {
      console.error('❌ [FRIEND_INVITE] Error rejecting invitation:', error);
      Alert.alert(
        t('myActivities.alerts.friendInvitation.error.title'),
        t('myActivities.alerts.friendInvitation.error.rejectMessage')
      );
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(t('common.locale'), {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTabs = () => {
    const tabs = [
      {
        key: 'profile' as MyActivitiesTabType,
        label: t('myActivities.tabs.profile'),
        icon: 'person-outline',
      },
      {
        key: 'stats' as MyActivitiesTabType,
        label: t('myActivities.tabs.stats'),
        icon: 'stats-chart-outline',
      },
      {
        key: 'events' as MyActivitiesTabType,
        label: t('myActivities.tabs.events'),
        icon: 'calendar-outline',
      },
      {
        key: 'friends' as MyActivitiesTabType,
        label: t('myActivities.tabs.friends'),
        icon: 'people-outline',
      },
      {
        key: 'settings' as MyActivitiesTabType,
        label: t('myActivities.tabs.settings'),
        icon: 'settings-outline',
      },
    ];

    return (
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={
                  activeTab === tab.key
                    ? '#64B5F6' // Brighter blue for active tab
                    : 'rgba(255, 255, 255, 0.7)' // White with opacity for inactive tabs
                }
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderProfileTab = () => {
    if (!userProfile) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name='person' size={40} color='#666' />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile.displayName || userProfile.nickname}
            </Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
            <Text style={styles.profileSkill}>{getLtrLevelDescription(userProfile.ltrLevel)}</Text>
            {userProfile.playingStyle && (
              <Text style={styles.profilePlayStyle}>
                {t('myActivities.profile.style')}
                {userProfile.playingStyle}
              </Text>
            )}
            <Text style={styles.profileLocation}>📍 {userProfile.location}</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
          <Ionicons name='pencil-outline' size={20} color='#1976d2' />
          <Text style={styles.editProfileText}>{t('myActivities.profile.editProfile')}</Text>
        </TouchableOpacity>

        {/* Stats Quick View */}
        <View style={styles.statsQuickView}>
          <Text style={styles.sectionTitle}>{t('myActivities.profile.myStats')}</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{userProfile.stats.eloRating}</Text>
              <Text style={styles.quickStatLabel}>ELO</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{userProfile.stats.wins}</Text>
              <Text style={styles.quickStatLabel}>{t('myActivities.profile.wins')}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{userProfile.stats.losses}</Text>
              <Text style={styles.quickStatLabel}>{t('myActivities.profile.losses')}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{userProfile.stats.winRate}%</Text>
              <Text style={styles.quickStatLabel}>{t('myActivities.profile.winRate')}</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('myActivities.profile.earnedBadges')}</Text>
          <BadgeGallery userId={userProfile.id} showTitle={false} maxColumns={4} maxBadges={8} />
        </View>

        {/* Goals Section */}
        {userProfile.goals && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('myActivities.profile.goals')}</Text>
            <Text style={styles.goalsText}>{userProfile.goals}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStatsTab = () => {
    if (!userProfile) return null;

    const { stats } = userProfile;

    // Prepare chart data
    const eloChartData = {
      labels: eloHistory.map(item => item.date) as unknown as string[],
      values: eloHistory.map(item => item.elo),
    };

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>{t('myActivities.stats.rankedMatchStats')}</Text>
          <Text style={styles.sectionSubtitle}>{t('myActivities.stats.onlyRankedMatches')}</Text>
        </View>

        {/* ELO Rating Trend Chart */}
        <PerformanceChart
          type='skill_progress'
          data={eloChartData}
          title={t('myActivities.stats.eloRatingTrend')}
          subtitle={t('myActivities.stats.lastSixMonths')}
        />

        {/* ELO Rating Card */}
        <View style={styles.eloCard}>
          <Text style={styles.eloLabel}>{t('myActivities.stats.currentEloRating')}</Text>
          <Text style={styles.eloRating}>{stats.eloRating}</Text>
          <Text style={styles.eloTier}>{t('myActivities.stats.intermediateTier')}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.matchesPlayed}</Text>
            <Text style={styles.statLabel}>{t('myActivities.stats.matches')}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.wins}</Text>
            <Text style={styles.statLabel}>{t('myActivities.stats.wins')}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.losses}</Text>
            <Text style={styles.statLabel}>{t('myActivities.stats.losses')}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.winRate}%</Text>
            <Text style={styles.statLabel}>{t('myActivities.stats.winRate')}</Text>
          </View>
        </View>

        {/* Recent Match Records */}
        <View style={styles.recentMatches}>
          <Text style={styles.subsectionTitle}>{t('myActivities.stats.recentMatchResults')}</Text>
          {matchRecords.length > 0 ? (
            matchRecords.slice(0, 5).map(renderMatchRecord)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('myActivities.stats.noRankedMatches')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderMatchRecord = (match: MatchRecord) => {
    const isWin = match.result === 'win';

    return (
      <View key={match.id} style={styles.matchRecord}>
        <View style={styles.matchResult}>
          <View style={[styles.resultBadge, isWin ? styles.winBadge : styles.lossBadge]}>
            <Text style={[styles.resultText, isWin ? styles.winText : styles.lossText]}>
              {match.result === 'win' ? 'W' : 'L'}
            </Text>
          </View>
        </View>

        <View style={styles.matchInfo}>
          <Text style={styles.matchTitle}>{match.title}</Text>
          <Text style={styles.matchDetails}>
            vs {match.opponent} • {match.location}
          </Text>
          <Text style={styles.matchDate}>{formatDate(match.date)}</Text>
        </View>

        <View style={styles.matchStats}>
          {match.score && <Text style={styles.matchScore}>{match.score}</Text>}
          {match.eloChange && (
            <Text
              style={[
                styles.eloChange,
                match.eloChange > 0 ? styles.eloPositive : styles.eloNegative,
              ]}
            >
              {match.eloChange > 0 ? '+' : ''}
              {match.eloChange} ELO
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEventsTab = () => {
    return (
      <ActivityTabContent
        currentLanguage={currentLanguage}
        appliedEvents={appliedEvents}
        hostedEvents={hostedEvents}
        pastEvents={pastEvents}
        partnerInvitations={partnerInvitations}
        friendInvitations={friendInvitations}
        onAcceptFriendInvitation={handleAcceptFriendInvitation}
        onRejectFriendInvitation={handleRejectFriendInvitation}
        onAcceptInvitation={handleAcceptPartnerInvitation}
        onRejectInvitation={handleRejectPartnerInvitation}
        onReAcceptInvitation={handleReAcceptPartnerInvitation}
        loading={activityLoading}
        onRefresh={loadActivityData}
        initialTab={route.params?.initialActivityTab || 'applied'}
        onEditEvent={(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          eventId,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          eventData
        ) => {
          Alert.alert(
            t('myActivities.alerts.eventEdit.title'),
            t('myActivities.alerts.eventEdit.message')
          );
        }}
      />
    );
  };

  const renderFriendsTab = () => {
    const userId = userProfile?.id || '';
    return (
      <View style={styles.tabContent}>
        <FriendsScreen currentUserId={userId} />
      </View>
    );
  };

  const renderSettingsTab = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>
            {t('myActivities.settings.notificationSettings')}
          </Text>

          <View style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <Ionicons name='notifications-outline' size={24} color='#666' />
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>
                  {t('myActivities.settings.lightningMatchNotifications')}
                </Text>
                <Text style={styles.settingsItemSubtitle}>
                  {t('myActivities.settings.newMatchRequestNotifications')}
                </Text>
              </View>
            </View>
            <Switch
              value={lightningMatchNotifications}
              onValueChange={setLightningMatchNotifications}
              trackColor={{ false: '#767577', true: '#1976d2' }}
              thumbColor={lightningMatchNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <Ionicons name='chatbubble-outline' size={24} color='#666' />
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>
                  {t('myActivities.settings.chatNotifications')}
                </Text>
                <Text style={styles.settingsItemSubtitle}>
                  {t('myActivities.settings.messageAndCommentNotifications')}
                </Text>
              </View>
            </View>
            <Switch
              value={chatNotifications}
              onValueChange={setChatNotifications}
              trackColor={{ false: '#767577', true: '#1976d2' }}
              thumbColor={chatNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>
            {t('myActivities.settings.profileSettings')}
          </Text>

          <TouchableOpacity style={styles.settingsItem} onPress={handleEditProfile}>
            <View style={styles.settingsItemContent}>
              <Ionicons name='create-outline' size={24} color='#666' />
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>
                  {t('myActivities.settings.editProfile')}
                </Text>
                <Text style={styles.settingsItemSubtitle}>
                  {t('myActivities.settings.editNicknameSkillLocation')}
                </Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>{t('myActivities.settings.appSettings')}</Text>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              Alert.alert(
                t('myActivities.settings.comingSoon'),
                t('myActivities.settings.languageChangeComingSoon')
              );
            }}
          >
            <View style={styles.settingsItemContent}>
              <Ionicons name='language-outline' size={24} color='#666' />
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>
                  {t('myActivities.settings.languageSettings')}
                </Text>
                <Text style={styles.settingsItemSubtitle}>
                  {t('myActivities.settings.currentLanguage')}
                </Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => {
              Alert.alert(
                t('myActivities.settings.comingSoon'),
                t('myActivities.settings.privacySettingsComingSoon')
              );
            }}
          >
            <View style={styles.settingsItemContent}>
              <Ionicons name='shield-outline' size={24} color='#666' />
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>
                  {t('myActivities.settings.privacySettings')}
                </Text>
                <Text style={styles.settingsItemSubtitle}>
                  {t('myActivities.settings.profileVisibilitySettings')}
                </Text>
              </View>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#666' />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name='log-out-outline' size={24} color='#f44336' />
            <Text style={styles.logoutText}>{t('myActivities.settings.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'stats':
        return renderStatsTab();
      case 'events':
        return renderEventsTab();
      case 'friends':
        return renderFriendsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#1976d2' />
          <Text style={styles.loadingText}>{t('myActivities.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('myActivities.header.title')}</Text>
      </View>

      {renderTabs()}

      <View style={styles.content}>
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}>
          {renderTabContent()}
        </RefreshControl>
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: 'rgba(66, 165, 245, 0.15)', // Blue-tinted background
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF', // Direct white for maximum visibility
    textAlign: 'center',
    opacity: 0.7, // Dimmed for inactive tabs
  },
  activeTabText: {
    color: '#64B5F6', // Brighter blue for active tab
    opacity: 1, // Full opacity
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  // Profile Tab Styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileSkill: {
    fontSize: 16,
    color: '#1976d2',
    marginBottom: 4,
    fontWeight: '600',
  },
  profilePlayStyle: {
    fontSize: 14,
    color: '#4caf50',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
    paddingVertical: 12,
    marginBottom: 24,
  },
  editProfileText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  statsQuickView: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  goalsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Stats Tab Styles
  statsHeader: {
    marginBottom: 20,
  },
  eloCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eloLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eloRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  eloTier: {
    fontSize: 14,
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  recentMatches: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  matchRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchResult: {
    marginRight: 12,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winBadge: {
    backgroundColor: '#e8f5e8',
  },
  lossBadge: {
    backgroundColor: '#ffebee',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  winText: {
    color: '#4caf50',
  },
  lossText: {
    color: '#f44336',
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  matchDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  matchStats: {
    alignItems: 'flex-end',
  },
  matchScore: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  eloChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  eloPositive: {
    color: '#4caf50',
  },
  eloNegative: {
    color: '#f44336',
  },
  // Settings Tab Styles
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MyActivitiesScreen;
