import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CreateScreen from '../screens/CreateScreen';
import MyClubsScreen from '../screens/MyClubsScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import MyFeesScreen from '../screens/profile/MyFeesScreen';
import MyFeedbackScreen from '../screens/profile/MyFeedbackScreen';
import LanguageSelectionScreen from '../screens/profile/LanguageSelectionScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PaymentMethodsScreen from '../screens/admin/PaymentMethodsScreen';
import ManageAnnouncementScreen from '../screens/admin/ManageAnnouncementScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserFeedbackScreen from '../screens/admin/UserFeedbackScreen';
import DeveloperToolsScreen from '../screens/admin/DeveloperToolsScreen';
import UserStatsScreen from '../screens/admin/UserStatsScreen';
import ContentManagementScreen from '../screens/admin/ContentManagementScreen';
import SystemLogScreen from '../screens/admin/SystemLogScreen';
import LogDetailScreen from '../screens/admin/LogDetailScreen';
import ClubManagementScreen from '../screens/admin/ClubManagementScreen';
import EventManagementScreen from '../screens/admin/EventManagementScreen';
import MatchManagementScreen from '../screens/admin/MatchManagementScreen';
import ClubDetailScreen from '../screens/clubs/ClubDetailScreen';
import EventChatScreen from '../screens/EventChatScreen';
import EditEventScreen from '../screens/EditEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import RateSportsmanshipScreen from '../screens/RateSportsmanshipScreen';
import RecordScoreScreen from '../screens/RecordScoreScreen';
// ChatbotScreen removed - using ChatScreen instead
// import FloatingChatButton from '../components/FloatingChatButton'; // Removed - interfering with chat conversations
import CreationNavigator from './CreationNavigator';
import AuthNavigator from './AuthNavigator';
import OnboardingContainer from '../screens/auth/OnboardingContainer';
import { useLanguage } from '../contexts/LanguageContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import CreateClubScreen from '../screens/clubs/CreateClubScreen';
import LocationSearchScreen from '../screens/LocationSearchScreen';
import ClubAdminScreen from '../screens/clubs/ClubAdminScreen';
import DuesManagementScreen from '../screens/clubs/DuesManagementScreen';
import MemberDuesPaymentScreen from '../screens/clubs/MemberDuesPaymentScreen';
import EventParticipationScreen from '../screens/clubs/EventParticipationScreen';
import ClubLeagueManagementScreen from '../screens/clubs/ClubLeagueManagementScreen';
import ClubTournamentManagementScreen from '../screens/clubs/ClubTournamentManagementScreen';
import TournamentBracketScreen from '../screens/tournaments/TournamentBracketScreen';
import TournamentDetailScreen from '../screens/tournaments/TournamentDetailScreen';
// ClubMemberManagementScreen removed - functionality moved to ClubDetail's Members tab
import ClubChatScreen from '../screens/clubs/ClubChatScreen';
import DirectChatRoomScreen from '../screens/DirectChatRoomScreen';
import PostDetailScreen from '../screens/clubs/PostDetailScreen';
import CreatePostScreen from '../screens/clubs/CreatePostScreen';
import EditClubPolicyScreen from '../screens/clubs/EditClubPolicyScreen';
import MeetupDetailScreen from '../screens/clubs/MeetupDetailScreen';
import LeagueDetailScreen from '../screens/LeagueDetailScreen';
import ManageLeagueParticipantsScreen from '../screens/ManageLeagueParticipantsScreen';
import RankingPrivacySettingsScreen from '../screens/clubs/RankingPrivacySettingsScreen';
import MyClubSettingsScreen from '../screens/MyClubSettingsScreen';
import ConcludeLeagueScreen from '../screens/ConcludeLeagueScreen';
import TeamInvitationsScreen from '../screens/teams/TeamInvitationsScreen';
import MigrationScreen from '../screens/MigrationScreen';
import ClubMemberInvitationScreen from '../screens/clubs/ClubMemberInvitationScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import AchievementsGuideScreen from '../screens/AchievementsGuideScreen';
import * as Notifications from 'expo-notifications';

// Type definition for all navigation screens
export type RootStackParamList = {
  MainTabs:
    | undefined
    | {
        screen: keyof MainTabParamList;
        params?: {
          initialFilter?: 'events' | 'players' | 'clubs' | 'coaches' | 'services';
          scrollToEventId?: string;
        };
      };
  Auth: undefined;
  Onboarding: undefined;
  CreateFlow: undefined;
  Feed: undefined;
  Discover: { initialFilter?: 'events' | 'players' | 'clubs' | 'coaches' | 'services' } | undefined;
  Create: undefined;
  MyClubs: undefined;
  MyClubsList: undefined;
  MyProfile: undefined;
  CreateMatch: undefined;
  // 🎾 경기 분석 자동 실행 파라미터 추가
  ChatScreen:
    | {
        autoAnalyzeEvent?: {
          id: string;
          title: string;
          gameType?: string;
          hostId?: string;
          clubId?: string;
          scheduledTime?: Date;
          matchResult?: unknown;
        };
      }
    | undefined;
  // 🔄 ClubDetail removed from Root Stack - now in Discover/Feed/MyClubs Stacks
  CreateClub: { clubId?: string; mode?: 'create' | 'edit' | string; selectedLocation?: unknown };
  LocationSearch: { returnScreen?: string; clubId?: string; [key: string]: unknown };
  ClubAdmin: { clubId: string; clubName: string; userRole: string };
  MyClubSettings: { clubId: string; clubName: string };
  ClubLeagueManagement: { clubId: string; autoCreate?: boolean };
  ClubTournamentManagement: { clubId: string; autoCreate?: boolean };
  TournamentBracket: { tournamentId: string; tournamentName: string; clubId: string };
  TournamentDetail: { tournamentId: string; tournamentName: string; clubId: string };
  ClubScheduleSettings: { clubId: string };
  EventParticipation: { eventId: string; clubId: string };
  ClubChat: { clubId: string };
  DirectChatRoom: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
    otherUserPhotoURL?: string;
  };
  ClubDuesManagement: { clubId: string; clubName: string; initialTab?: number };
  MemberDuesPayment: { clubId: string; clubName: string };
  PostDetail: { postId: string; clubId: string };
  CreatePost: { clubId: string };
  EditClubPolicy: { clubId: string; clubName: string };
  RankingPrivacySettings: {
    clubId: string;
    clubName: string;
    currentVisibility?: 'public' | 'membersOnly';
  };
  EditProfileScreen: undefined;
  MyFeesScreen: undefined;
  MyFeedback: undefined;
  LanguageSelectionScreen: undefined;
  NotificationSettings: undefined;
  ManageAnnouncement: { clubId: string };
  PaymentMethodsScreen: { clubId: string; clubName: string };
  AdminDashboard: undefined;
  UserFeedback: undefined;
  UserStats: undefined;
  ContentManagement: undefined;
  SystemLog: undefined;
  LogDetail: { logType: 'auth' | 'error' | 'performance' };
  ClubManagement: undefined;
  EventManagement: undefined;
  MatchManagement: undefined;
  DeveloperTools: undefined;
  EventChat: { eventId: string; eventTitle?: string };
  EditEvent: { eventId: string };
  EventDetail: { eventId: string };
  UserProfile: { userId: string; nickname?: string };
  RateSportsmanship: { eventId: string; eventType?: string };
  RecordScore: { eventId: string };
  MeetupDetail: { meetupId: string; clubId: string };
  LeagueDetail: {
    leagueId: string;
    clubId: string;
    initialTab?: 'matches' | 'participants' | 'standings' | 'management';
  };
  ManageLeagueParticipants: { leagueId: string; leagueName: string };
  ConcludeLeague: { leagueId: string; leagueName: string };
  TeamInvitations: undefined;
  Migration: undefined;
  ClubMemberInvitation: { clubId: string; clubName: string };
  AchievementsGuide: undefined;
};

// Admin screens type for navigation
export type AdminStackParamList = Pick<
  RootStackParamList,
  | 'AdminDashboard'
  | 'UserFeedback'
  | 'UserStats'
  | 'ContentManagement'
  | 'SystemLog'
  | 'LogDetail'
  | 'ClubManagement'
  | 'EventManagement'
  | 'MatchManagement'
  | 'DeveloperTools'
>;

const ClubScheduleSettingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>📅 Schedule Settings</Text>
    <Text style={{ fontSize: 16, color: '#666' }}>Configure regular meeting schedules</Text>
  </View>
);

// Actual DuesManagementScreen is imported above

// Note: Theme is now handled by useTheme() hook below - no hardcoded theme needed

// Import the real useAuth hook and other context hooks for readiness gate
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../contexts/ActivityContext';
import { useFeed } from '../contexts/FeedContext';
import { useDiscovery } from '../contexts/DiscoveryContext';
import { useTheme } from '../hooks/useTheme';
// import { useClub } from '../contexts/ClubContext'; // Kept for future use - pendingJoinRequestsCount
import { useDirectChatUnreadCount } from '../hooks/profile/useDirectChatUnreadCount';
import { useClubChatUnreadCount } from '../hooks/clubs/useClubChatUnreadCount';
import { useMeetupChatUnreadCount } from '../hooks/clubs/useMeetupChatUnreadCount';
import { useEventChatUnreadCount } from '../hooks/profile/useEventChatUnreadCount';
import { UserData } from '../screens/auth/OnboardingContainer';

// OnboardingScreen wrapper to provide navigation context
const OnboardingScreen = () => {
  const { markOnboardingComplete } = useAuth();

  const handleOnboardingComplete = (userData: UserData) => {
    console.log('📋 AppNavigator: Received user data from OnboardingContainer:', userData);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    // 🧠 OPERATION RECALL: Extract complete profile data to preserve ALL memories
    const profileData = (userData.profile || userData) as any;

    console.log('🧠 OPERATION RECALL: AppNavigator extracting complete profile data...');
    console.log('🔍 Profile data structure analysis:', {
      hasProfile: !!userData.profile,
      profileKeys: userData.profile ? Object.keys(userData.profile) : [],
      criticalFields: {
        location: !!profileData.location,
        distanceUnit: !!profileData.distanceUnit,
        currencyUnit: !!profileData.currencyUnit,
        nickname: !!profileData.nickname,
      },
    });

    const mappedProfileData = {
      // Basic profile information
      nickname: profileData.nickname || (userData as any).nickname,
      displayName: profileData.nickname || (userData as any).nickname,
      gender: profileData.gender || 'male', // 🆕 기본값: male (성별 필수)
      skillLevel: profileData.skillLevel || (userData as any).skillLevel || '3.0-3.5',

      // Playing preferences
      playingStyle: Array.isArray(profileData.preferredPlayingStyle)
        ? profileData.preferredPlayingStyle.join(',')
        : profileData.playingStyle || 'all-court',
      maxTravelDistance: profileData.maxTravelDistance || (userData as any).maxTravelDistance || 15,

      // 🧠 CRITICAL: Preserve location data with proper structure
      location: profileData.location ||
        (userData as any).location || {
          lat: 33.749,
          lng: -84.388,
          latitude: 33.749,
          longitude: -84.388,
          address: 'Atlanta, GA',
          country: 'US',
        },

      // 🧠 CRITICAL: Preserve user settings
      distanceUnit: profileData.distanceUnit || 'miles',
      currencyUnit: profileData.currencyUnit || 'USD',
      notificationDistance: profileData.notificationDistance || profileData.maxTravelDistance || 15,

      // Communication and availability
      communicationLanguages: profileData.communicationLanguages ||
        (userData as any).languages || ['English'],
      languages: profileData.communicationLanguages || (userData as any).languages || ['English'],
      availabilityPreference: profileData.availabilityPreference || 'weekdays',
      preferredTimesWeekdays: profileData.preferredTimesWeekdays || [],
      preferredTimesWeekends: profileData.preferredTimesWeekends || [],

      // Permissions
      locationPermissionGranted: profileData.locationPermissionGranted || false,
      notificationPermissionGranted: profileData.notificationPermissionGranted || false,

      // Optional fields
      activityRegions: profileData.activityRegions ||
        (userData as any).activityRegions || ['Atlanta Metro'],
      goals: profileData.goals || (userData as any).goals || null,
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    console.log('🧠 OPERATION RECALL: Complete profile data mapping completed');
    console.log('🏁 AppNavigator: Calling markOnboardingComplete() with COMPLETE profile data...');
    console.log('📊 Mapped profile data (with preserved memories):', {
      nickname: mappedProfileData.nickname,
      location: mappedProfileData.location,
      distanceUnit: mappedProfileData.distanceUnit,
      currencyUnit: mappedProfileData.currencyUnit,
      skillLevel: mappedProfileData.skillLevel,
      maxTravelDistance: mappedProfileData.maxTravelDistance,
    });

    markOnboardingComplete(mappedProfileData);
    console.log(
      '✅ AppNavigator: markOnboardingComplete() called successfully with preserved memories'
    );
  };

  return <OnboardingContainer onComplete={handleOnboardingComplete} />;
};

// Custom Create Tab Button Component
const CreateTabButton = (props: { children: React.ReactNode }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Extract children and other props
  const { children, ...restProps } = props;

  return (
    <TouchableOpacity
      {...restProps}
      onPress={() => navigation.navigate('CreateFlow')}
      activeOpacity={0.8}
    >
      {React.isValidElement(children) ? children : <Text>{children}</Text>}
    </TouchableOpacity>
  );
};

// Remove the placeholder LoginScreen since we have AuthNavigator

export type MainTabParamList = {
  Feed: undefined;
  Discover: { initialFilter?: 'events' | 'players' | 'clubs' | 'coaches' | 'services' } | undefined;
  Create: undefined;
  MyClubs: undefined;
  MyProfile:
    | {
        initialTab?: 'information' | 'stats' | 'activity' | 'friends' | 'settings';
        initialActivityTab?: 'applied' | 'hosted' | 'past';
        newEventId?: string; // 🚀 [PERFORMANCE] For instant display after event creation
      }
    | undefined;
};

// 🔄 New Stack Param Lists for nested navigators
export type DiscoverStackParamList = {
  DiscoverMain:
    | {
        initialFilter?: 'players' | 'clubs' | 'events' | 'coaches' | 'services';
        scrollToEventId?: string; // 🎯 [KIM FIX] Scroll to specific event when navigating from partner invitation
      }
    | undefined;
  ClubDetail: {
    clubId: string;
    fallbackClub?: unknown;
    initialTab?: string;
    initialSubTab?: 'applications' | 'all_members' | 'roles';
  };
};

export type FeedStackParamList = {
  FeedMain: undefined;
  ClubDetail: {
    clubId: string;
    fallbackClub?: unknown;
    initialTab?: string;
    initialSubTab?: 'applications' | 'all_members' | 'roles';
  };
};

export type MyClubsStackParamList = {
  MyClubsMain: undefined;
  ClubDetail: {
    clubId: string;
    fallbackClub?: unknown;
    initialTab?: string;
    initialSubTab?: 'applications' | 'all_members' | 'roles';
    userRole?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 🔄 Discover Stack Navigator (includes ClubDetail)
const DiscoverStackNavigator = createNativeStackNavigator<DiscoverStackParamList>();
const DiscoverStack = () => {
  return (
    <DiscoverStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStackNavigator.Screen name='DiscoverMain' component={DiscoverScreen} />
      <DiscoverStackNavigator.Screen
        name='ClubDetail'
        component={ClubDetailScreen}
        options={{
          // 🎯 iOS 18 버튼 그룹 스타일 문제 해결 - 자체 헤더 사용
          headerShown: false,
        }}
      />
    </DiscoverStackNavigator.Navigator>
  );
};

// 🔄 Feed Stack Navigator (includes ClubDetail)
const FeedStackNavigator = createNativeStackNavigator<FeedStackParamList>();
const FeedStack = () => {
  return (
    <FeedStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <FeedStackNavigator.Screen name='FeedMain' component={FeedScreen} />
      <FeedStackNavigator.Screen
        name='ClubDetail'
        component={ClubDetailScreen}
        options={{
          // 🎯 iOS 18 버튼 그룹 스타일 문제 해결 - 자체 헤더 사용
          headerShown: false,
        }}
      />
    </FeedStackNavigator.Navigator>
  );
};

// 🔄 MyClubs Stack Navigator (includes ClubDetail)
const MyClubsStackNavigator = createNativeStackNavigator<MyClubsStackParamList>();
const MyClubsStack = () => {
  return (
    <MyClubsStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <MyClubsStackNavigator.Screen name='MyClubsMain' component={MyClubsScreen} />
      <MyClubsStackNavigator.Screen
        name='ClubDetail'
        component={ClubDetailScreen}
        options={{
          // 🎯 iOS 18 버튼 그룹 스타일 문제 해결 - 자체 헤더 사용
          headerShown: false,
        }}
      />
    </MyClubsStackNavigator.Navigator>
  );
};

// 메인 탭 네비게이터
function MainTabNavigator() {
  const { t } = useLanguage();
  const { paperTheme, isThemeReady } = useTheme();
  const insets = useSafeAreaInsets();
  // 🎯 [KIM FIX] Get profile badge count for activity notifications
  const { profileBadgeCount } = useActivities();
  // 🎯 [KIM FIX] pendingJoinRequestsCount available from useClub() for future use
  // Currently not used in tab badge - only clubChatUnreadCount + clubNotificationCount are shown
  // 📨 [KIM FIX] Get unread direct chat count for MyProfile red badge
  const { currentUser } = useAuth();
  const { totalUnreadCount } = useDirectChatUnreadCount(currentUser?.uid);
  // 🔴 [KIM FIX] Get unread event chat count for MyProfile red badge (combined with direct chat)
  const { totalEventChatUnread } = useEventChatUnreadCount(currentUser?.uid);
  // 🔴🟡 [KIM FIX] Get unread club chat count (red badge) AND notification count (yellow badge)
  const { totalUnreadCount: clubChatUnreadCount, totalNotificationCount: clubNotificationCount } =
    useClubChatUnreadCount(currentUser?.uid);
  // 🔴 [MEETUP CHAT] Get unread meetup chat count for MyClubs red badge
  const { totalUnreadCount: meetupChatUnreadCount } = useMeetupChatUnreadCount(currentUser?.uid);
  // const [currentRoute, setCurrentRoute] = React.useState('Feed'); // Removed - no longer needed

  // 📱 [KIM] Set iOS app icon badge = MyClubs badges + MyProfile badges (all colors combined)
  useEffect(() => {
    // 내 클럽 배지: 🔴 채팅 미읽음 (클럽 + 모임) + 🟡 클럽 알림
    // 내 프로필 배지: 🔴 다이렉트+이벤트 채팅 + 🟡 활동 알림
    const totalAppBadge =
      clubChatUnreadCount +
      meetupChatUnreadCount +
      clubNotificationCount +
      totalUnreadCount +
      totalEventChatUnread +
      profileBadgeCount;

    // Set iOS app icon badge
    Notifications.setBadgeCountAsync(totalAppBadge).catch(error => {
      console.warn('📱 Failed to set app badge:', error);
    });

    console.log(
      `📱 [AppBadge] Total: ${totalAppBadge} (Club: ${clubChatUnreadCount}+${meetupChatUnreadCount}+${clubNotificationCount}, Profile: ${totalUnreadCount}+${totalEventChatUnread}+${profileBadgeCount})`
    );
  }, [
    clubChatUnreadCount,
    meetupChatUnreadCount,
    clubNotificationCount,
    totalUnreadCount,
    totalEventChatUnread,
    profileBadgeCount,
  ]);

  // Defensive programming: ensure theme is ready
  if (!isThemeReady || !paperTheme) {
    return null;
  }

  // Ensure t function returns valid strings
  const safeT = (key: string) => {
    try {
      const result = t(key);
      if (typeof result === 'string' && result.trim() !== '') {
        return result;
      }
      return key; // Fallback to key if t returns undefined/null/empty
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  // Extra safe tab label wrapper
  const SafeTabLabel = ({ translationKey, color }: { translationKey: string; color: string }) => {
    const labelText = safeT(translationKey);
    return (
      <Text style={{ color, fontSize: 12 }}>
        {typeof labelText === 'string' ? labelText : translationKey}
      </Text>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* StatusBar now managed centrally by ThemeProvider */}
      <Tab.Navigator
        screenOptions={({ route }) => {
          console.log('🏗️ [MainTabs] screenOptions called for route:', route.name);

          return {
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              switch (route.name) {
                case 'Feed':
                  iconName = focused ? 'newspaper' : 'newspaper-outline';
                  break;
                case 'Discover':
                  iconName = focused ? 'search' : 'search-outline';
                  break;
                case 'Create':
                  iconName = 'add-circle';
                  break;
                case 'MyClubs':
                  iconName = focused ? 'people' : 'people-outline';
                  break;
                case 'MyProfile':
                  iconName = focused ? 'person' : 'person-outline';
                  break;
                default:
                  iconName = 'ellipse-outline';
              }

              // Create 탭은 더 큰 아이콘
              const iconSize = route.name === 'Create' ? size + 16 : size;
              const iconColor = route.name === 'Create' ? '#1976d2' : color;

              return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
            },
            // 🌓 [KIM FIX] Theme-aware tab bar colors for both light and dark modes
            tabBarActiveTintColor: paperTheme.dark ? '#64B5F6' : '#1976D2', // Blue for active tab
            tabBarInactiveTintColor: paperTheme.dark ? '#FFFFFF' : '#757575', // White for dark, gray for light
            tabBarStyle: {
              display: 'flex', // 🏗️ Explicitly set display
              paddingBottom:
                Platform.OS === 'android'
                  ? Math.max(35, insets.bottom + 10)
                  : Math.max(12, insets.bottom + 8),
              paddingTop: 8,
              height:
                Platform.OS === 'android'
                  ? Math.max(95, 85 + insets.bottom)
                  : Math.max(72, 64 + insets.bottom),
            },
            headerShown: false,
          };
        }}
        // screenListeners removed - no longer needed without FloatingChatButton
      >
        <Tab.Screen
          name='Feed'
          component={FeedStack}
          options={{
            tabBarLabel: ({ color }) => (
              <SafeTabLabel translationKey='navigation.feed' color={color} />
            ),
          }}
        />
        <Tab.Screen
          name='Discover'
          component={DiscoverStack}
          options={{
            tabBarLabel: ({ color }) => (
              <SafeTabLabel translationKey='navigation.discover' color={color} />
            ),
          }}
        />
        <Tab.Screen
          name='Create'
          component={CreateScreen}
          options={{
            tabBarLabel: ({ color }) => (
              <SafeTabLabel translationKey='navigation.create' color={color} />
            ),
            tabBarButton: props => <CreateTabButton {...props} />,
          }}
        />
        <Tab.Screen
          name='MyClubs'
          component={MyClubsStack}
          options={{
            tabBarLabel: ({ color }) => (
              <SafeTabLabel translationKey='navigation.myClubs' color={color} />
            ),
            // 🎯 [KIM FIX] Custom icon with dual badges (red for unread club chat, yellow for pending requests)
            tabBarIcon: ({ focused, color, size }) => (
              <View
                style={{
                  width: size + 16,
                  height: size + 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
                {/* 🔴 Red badge for unread chat messages (club + meetup combined) (top-right) */}
                {clubChatUnreadCount + meetupChatUnreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: 0,
                      backgroundColor: '#F44336',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                      {clubChatUnreadCount + meetupChatUnreadCount > 99
                        ? '99+'
                        : clubChatUnreadCount + meetupChatUnreadCount}
                    </Text>
                  </View>
                )}
                {/* 🟡 Yellow badge for club notifications only (matches club card badges) */}
                {clubNotificationCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: clubChatUnreadCount + meetupChatUnreadCount > 0 ? 12 : -2,
                      right: clubChatUnreadCount + meetupChatUnreadCount > 0 ? -4 : 0,
                      backgroundColor: '#FFC107',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: '#000000', fontSize: 10, fontWeight: 'bold' }}>
                      {clubNotificationCount > 99 ? '99+' : clubNotificationCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name='MyProfile'
          component={MyProfileScreen}
          options={{
            tabBarLabel: ({ color }) => (
              <SafeTabLabel translationKey='navigation.myProfile' color={color} />
            ),
            // 🎯 [KIM FIX] Custom icon with dual badges (yellow for activities, red for unread messages)
            tabBarIcon: ({ focused, color, size }) => (
              <View
                style={{
                  width: size + 16,
                  height: size + 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
                {/* 📨🔴 Red badge for unread messages (Direct Chat + Event Chat combined) */}
                {totalUnreadCount + totalEventChatUnread > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: 0,
                      backgroundColor: '#F44336',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                      {totalUnreadCount + totalEventChatUnread > 99
                        ? '99+'
                        : totalUnreadCount + totalEventChatUnread}
                    </Text>
                  </View>
                )}
                {/* 🟡 Yellow badge for pending activities (bottom-right, offset from red) */}
                {profileBadgeCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: totalUnreadCount + totalEventChatUnread > 0 ? 12 : -2,
                      right: totalUnreadCount + totalEventChatUnread > 0 ? -4 : 0,
                      backgroundColor: '#FFB74D',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: '#000000', fontSize: 10, fontWeight: 'bold' }}>
                      {profileBadgeCount > 99 ? '99+' : profileBadgeCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Global Floating Chat Button */}
      {/* <FloatingChatButton currentRoute={currentRoute} /> */}
      {/* Removed: Button was interfering with chat conversations */}
    </View>
  );
}

// 메인 앱 네비게이터
export default function AppNavigator() {
  const { t } = useLanguage();
  const {
    currentUser: user,
    loading: isLoading,
    isProfileLoaded,
    isOnboardingComplete,
    // 🚫 Auth block state for showing error messages
    authBlockReason,
    blockedEmail,
    clearAuthBlock,
  } = useAuth();

  // 🛡️ READINESS GATE: Get all context loading states
  const { isLoadingFeed } = useFeed();
  const { isLoading: isDiscoveryLoading } = useDiscovery();

  // Get theme objects directly from context (already managed within React state)
  const { isThemeReady, paperTheme } = useTheme();

  // Failsafe timeout for profile loading to prevent infinite loading
  const [profileLoadTimeout, setProfileLoadTimeout] = React.useState(false);

  // Track initial load completion to prevent Gate from hijacking post-load navigation
  const [isInitialLoadComplete, setIsInitialLoadComplete] = React.useState(false);

  React.useEffect(() => {
    if (user && !isProfileLoaded && !profileLoadTimeout) {
      console.log('⏱️ AppNavigator: Starting 10-second failsafe timer for profile loading');
      const timer = setTimeout(() => {
        console.warn('⚠️ AppNavigator: Profile loading timeout reached (10s)');
        console.warn('   - This may indicate a Firestore connection issue');
        console.warn('   - Will proceed with fallback navigation logic');
        setProfileLoadTimeout(true);
      }, 10000); // 10 second timeout

      return () => {
        clearTimeout(timer);
        console.log('🔄 AppNavigator: Profile loading timer cleared');
      };
    } else if (isProfileLoaded && profileLoadTimeout) {
      // Reset timeout if profile loads successfully
      setProfileLoadTimeout(false);
      console.log('✅ AppNavigator: Profile loaded successfully, timeout reset');
    }
  }, [user, isProfileLoaded, profileLoadTimeout]);

  // 🛡️ READINESS GATE: Check if all contexts are ready
  const isAnyContextLoading =
    isLoading || !isProfileLoaded || isLoadingFeed || isDiscoveryLoading || !isThemeReady;

  // Permanently disable Gate after initial load completion
  React.useEffect(() => {
    if (!isAnyContextLoading && user && isOnboardingComplete && !isInitialLoadComplete) {
      setIsInitialLoadComplete(true);
    }
  }, [isAnyContextLoading, user, isOnboardingComplete, isInitialLoadComplete]);

  // 🚫 Auth block alert - show when user is blocked (e.g., email not verified)
  React.useEffect(() => {
    if (authBlockReason && !user) {
      console.log('🚫 AppNavigator: Auth block detected:', authBlockReason, 'Email:', blockedEmail);

      if (authBlockReason === 'email_verification_required') {
        Alert.alert(
          t('appNavigator.emailVerification.title'),
          t('appNavigator.emailVerification.message', {
            email: blockedEmail || t('appNavigator.emailVerification.defaultEmail'),
          }),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                clearAuthBlock();
              },
            },
          ],
          { cancelable: false }
        );
      } else if (authBlockReason === 'profile_missing') {
        Alert.alert(
          t('appNavigator.profileMissing.title'),
          t('appNavigator.profileMissing.message'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                clearAuthBlock();
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
  }, [authBlockReason, blockedEmail, user, clearAuthBlock]);

  // Smart gate condition - only active during initial load
  const isGateActive = isAnyContextLoading && !isInitialLoadComplete;

  // Enhanced debug logging for navigation state
  console.log('🛡️ AppNavigator: READINESS GATE STATUS');
  console.log('   === AUTHENTICATION ===');
  console.log('   - Auth isLoading:', isLoading);
  console.log('   - isProfileLoaded:', isProfileLoaded);
  console.log('   - currentUser:', user ? `${user.email} (${user.uid})` : 'null');
  console.log('   - user.displayName:', user?.displayName);
  console.log('   - isOnboardingComplete:', isOnboardingComplete);
  console.log('   === CONTEXTS READINESS ===');
  console.log('   - FeedContext isLoadingFeed:', isLoadingFeed);
  console.log('   - DiscoveryContext isLoading:', isDiscoveryLoading);
  console.log('   - ThemeContext isReady:', isThemeReady);
  console.log('   === GATE DECISION ===');
  console.log('   - isAnyContextLoading:', isAnyContextLoading);
  console.log('   - isInitialLoadComplete:', isInitialLoadComplete);
  console.log('   - isGateActive (smart condition):', isGateActive);
  console.log(
    '   - Navigation decision:',
    !user
      ? '🔐 Auth (no user)'
      : !isProfileLoaded
        ? '⏳ ProfileLoading (waiting for Firestore)'
        : !isOnboardingComplete
          ? '📋 Onboarding (incomplete)'
          : isGateActive
            ? '🛡️ READINESS GATE ACTIVE (initial load)'
            : '🏠 MainTabs (all contexts ready)'
  );
  console.log('   - Race condition prevention: ✅ Waiting for ALL contexts to be ready');
  console.log('   - profileLoadTimeout:', profileLoadTimeout);

  // Log timing for race condition analysis
  if (user && !isProfileLoaded) {
    console.log('🕐 AppNavigator: RACE CONDITION PROTECTION ACTIVE');
    console.log('   - Firebase user exists but Firestore profile still loading');
    console.log('   - Showing profile loading spinner to prevent premature navigation');
  }

  // Log timeout state
  if (profileLoadTimeout) {
    console.warn('⏰ AppNavigator: TIMEOUT ACTIVATED - proceeding with fallback logic');
    console.warn('   - Profile loading took longer than expected');
    console.warn('   - Using Firebase user data as fallback');
  }

  // 🌙 Additional safety check for theme during hot reload scenarios
  if (!isThemeReady || !paperTheme) {
    console.log('🧭 AppNavigator: Theme not ready, waiting for theme initialization...');
    return null;
  }

  // 🔄 로딩 상태들을 처리
  if (isLoading) {
    console.log('🧭 AppNavigator: Showing auth loading state');
    return null; // 또는 로딩 스크린
  }

  // Block rendering until ALL contexts are ready (ONLY during initial load)
  // Gate is permanently disabled after first successful load
  if (user && isOnboardingComplete && isGateActive && !profileLoadTimeout) {
    console.log('🛡️ AppNavigator: READINESS GATE ACTIVE - Initial load in progress');

    // Determine which contexts are still loading for user feedback
    const loadingContexts = [];
    if (!isProfileLoaded) loadingContexts.push(t('appNavigator.loading.profile'));
    if (isLoadingFeed) loadingContexts.push(t('appNavigator.loading.feed'));
    if (isDiscoveryLoading) loadingContexts.push(t('appNavigator.loading.discovery'));
    if (!isThemeReady) loadingContexts.push(t('appNavigator.loading.theme'));

    const loadingMessage =
      loadingContexts.length > 0
        ? t('appNavigator.loading.loadingItems', { items: loadingContexts.join(', ') })
        : t('appNavigator.loading.preparingApp');

    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style='dark' />
        <ActivityIndicator size='large' color='#1976d2' />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: '#333' }}>
          {loadingMessage}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 16, color: '#666' }}>
          {t('appNavigator.loading.loadingAppData')}
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            color: '#999',
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {t('appNavigator.loading.safeLoadMessage')}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#bbb',
            textAlign: 'center',
          }}
        >
          🛡️ Initial Load Protection: ACTIVE
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 10,
            color: '#ccc',
            textAlign: 'center',
          }}
        >
          Loading: {loadingContexts.join(', ') || 'System initialization'}
        </Text>
      </SafeAreaView>
    );
  }

  // ✅ Profile loading fallback (existing logic for profile-only loading)
  if (user && !isProfileLoaded && !profileLoadTimeout) {
    console.log(
      '🧭 AppNavigator: User exists but profile still loading - showing profile loading spinner'
    );
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style='dark' />
        <ActivityIndicator size='large' color='#1976d2' />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: '#333' }}>
          {t('appNavigator.loading.loadingProfile')}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 16, color: '#666' }}>
          {t('appNavigator.loading.loadingProfileData')}
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            color: '#999',
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {t('appNavigator.loading.safeLoadingUserData')}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#bbb',
            textAlign: 'center',
          }}
        >
          🔐 Profile loading protection active
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: paperTheme.colors.surface,
        },
        headerTintColor: paperTheme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // 🔧 [KIM FIX] Android 상태바 겹침 방지 - 투명 모드 완전 비활성화
        statusBarTranslucent: false,
      }}
    >
      {!user ? (
        // 비로그인 사용자 - 인증 플로우
        <Stack.Screen name='Auth' component={AuthNavigator} options={{ headerShown: false }} />
      ) : !isOnboardingComplete ? (
        // 로그인했지만 온보딩 미완료 - 온보딩 플로우
        <Stack.Screen
          name='Onboarding'
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // 로그인 및 온보딩 완료 - 메인 앱
        <>
          <Stack.Screen
            name='MainTabs'
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name='CreateFlow'
            component={CreationNavigator}
            options={{
              headerShown: false,
            }}
          />
          {/* 🔄 ClubDetail removed from Root Stack - now in Feed/Discover/MyClubs Stacks */}
          {/* This ensures tab bar remains visible when navigating to ClubDetail */}
          <Stack.Screen
            name='ClubAdmin'
            component={ClubAdminScreen}
            options={{
              title: t('appNavigator.screens.clubAdmin'),
              headerShown: false,
            }}
          />
          <Stack.Screen name='CreateClub' component={CreateClubScreen} />
          <Stack.Screen
            name='LocationSearch'
            component={LocationSearchScreen}
            options={{
              title: t('appNavigator.screens.locationSearch'),
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubLeagueManagement'
            component={ClubLeagueManagementScreen}
            options={{
              title: t('appNavigator.screens.leagueManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ClubTournamentManagement'
            component={ClubTournamentManagementScreen}
            options={{
              title: t('appNavigator.screens.tournamentManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='TournamentBracket'
            component={TournamentBracketScreen}
            options={{
              title: t('appNavigator.screens.tournamentBracket'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='TournamentDetail'
            component={TournamentDetailScreen}
            options={{
              title: t('appNavigator.screens.tournamentDetail'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='TeamInvitations'
            component={TeamInvitationsScreen}
            options={{
              title: t('appNavigator.screens.teamInvitations'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ClubScheduleSettings'
            component={ClubScheduleSettingsScreen}
            options={{
              title: t('appNavigator.screens.scheduleSettings'),
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='ClubChat'
            component={ClubChatScreen}
            options={{
              title: t('appNavigator.screens.clubChat'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='DirectChatRoom'
            component={DirectChatRoomScreen}
            options={{
              title: t('appNavigator.screens.directChat'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ClubDuesManagement'
            component={DuesManagementScreen}
            options={{
              title: t('appNavigator.screens.duesManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='MemberDuesPayment'
            component={MemberDuesPaymentScreen}
            options={{
              title: t('appNavigator.screens.myDues'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EventParticipation'
            component={EventParticipationScreen}
            options={{
              title: t('appNavigator.screens.eventParticipation'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='PostDetail'
            component={PostDetailScreen}
            options={{
              title: t('appNavigator.screens.post'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='CreatePost'
            component={CreatePostScreen}
            options={{
              title: t('appNavigator.screens.createPost'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EditClubPolicy'
            component={EditClubPolicyScreen}
            options={{
              title: t('appNavigator.screens.editClubPolicy'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='RankingPrivacySettings'
            component={RankingPrivacySettingsScreen}
            options={{
              title: t('appNavigator.screens.rankingPrivacy'),
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='EditProfileScreen'
            component={EditProfileScreen}
            options={{
              // 🔧 [KIM FIX] Android 상태바 겹침 방지 - Appbar.Header 패턴 사용
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='MyFeesScreen'
            component={MyFeesScreen}
            options={{
              title: t('appNavigator.screens.myFees'),
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='MyFeedback'
            component={MyFeedbackScreen}
            options={{
              title: t('appNavigator.screens.myFeedback'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='LanguageSelectionScreen'
            component={LanguageSelectionScreen}
            options={{
              // 🔧 [KIM FIX] Android 상태바 겹침 방지 - Appbar.Header 패턴 사용
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='NotificationSettings'
            component={NotificationSettingsScreen}
            options={{
              // 🔧 [KIM FIX] Android 상태바 겹침 방지 - Appbar.Header 패턴 사용
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='PaymentMethodsScreen'
            component={PaymentMethodsScreen}
            options={{
              title: t('appNavigator.screens.paymentMethods'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ManageAnnouncement'
            component={ManageAnnouncementScreen}
            options={{
              title: t('appNavigator.screens.manageAnnouncement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='AdminDashboard'
            component={AdminDashboardScreen}
            options={{
              title: t('appNavigator.screens.adminDashboard'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='UserFeedback'
            component={UserFeedbackScreen}
            options={{
              title: t('appNavigator.screens.userFeedback'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='UserStats'
            component={UserStatsScreen}
            options={{
              title: t('appNavigator.screens.userStats'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ContentManagement'
            component={ContentManagementScreen}
            options={{
              title: t('appNavigator.screens.contentManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='SystemLog'
            component={SystemLogScreen}
            options={{
              title: t('appNavigator.screens.systemLog'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='LogDetail'
            component={LogDetailScreen}
            options={{
              title: t('appNavigator.screens.logDetail'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ClubManagement'
            component={ClubManagementScreen}
            options={{
              title: t('appNavigator.screens.clubManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EventManagement'
            component={EventManagementScreen}
            options={{
              title: t('appNavigator.screens.eventManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='MatchManagement'
            component={MatchManagementScreen}
            options={{
              title: t('appNavigator.screens.matchManagement'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='DeveloperTools'
            component={DeveloperToolsScreen}
            options={{
              title: t('appNavigator.screens.developerTools'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EventChat'
            component={EventChatScreen}
            options={{
              title: t('appNavigator.screens.eventChat'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EditEvent'
            component={EditEventScreen}
            options={{
              title: t('appNavigator.screens.editEvent'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='EventDetail'
            component={EventDetailScreen}
            options={{
              title: t('appNavigator.screens.eventDetail'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='UserProfile'
            component={UserProfileScreen}
            options={{
              title: t('appNavigator.screens.userProfile'),
              // 🎯 [KIM FIX] Use custom header inside screen (like DirectChatRoomScreen)
              // This ensures proper SafeAreaView handling on Android
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='RateSportsmanship'
            component={RateSportsmanshipScreen}
            options={{
              title: t('appNavigator.screens.rateSportsmanship'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='RecordScore'
            component={RecordScoreScreen}
            options={{
              title: t('appNavigator.screens.recordScore'),
              headerShown: true,
            }}
          />
          <Stack.Screen
            name='MeetupDetail'
            component={MeetupDetailScreen}
            options={{
              title: t('appNavigator.screens.meetupDetail'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='LeagueDetail'
            component={LeagueDetailScreen}
            options={{
              title: t('appNavigator.screens.leagueDetail'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ManageLeagueParticipants'
            component={ManageLeagueParticipantsScreen}
            options={{
              title: t('appNavigator.screens.manageLeagueParticipants'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='MyClubSettings'
            component={MyClubSettingsScreen}
            options={{
              title: t('appNavigator.screens.myClubSettings'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ConcludeLeague'
            component={ConcludeLeagueScreen}
            options={{
              title: t('appNavigator.screens.concludeLeague'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='Migration'
            component={MigrationScreen}
            options={{
              headerShown: true,
              title: '🔄 Data Migration',
            }}
          />
          <Stack.Screen
            name='ClubMemberInvitation'
            component={ClubMemberInvitationScreen}
            options={{
              title: t('appNavigator.screens.clubMemberInvitation'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='ChatScreen'
            component={ChatScreen}
            options={{
              title: t('appNavigator.screens.chatScreen'),
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='AchievementsGuide'
            component={AchievementsGuideScreen}
            options={{
              title: t('appNavigator.screens.achievementsGuide'),
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Unused styles removed
