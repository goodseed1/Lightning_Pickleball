/**
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../contexts/ActivityContext';
import { useTheme } from '../hooks/useTheme';
import { getLightningTennisTheme, LightningTennisColors } from '../theme';
import { MainTabParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import DirectChatListScreen from './DirectChatListScreen';

// Extracted components
import ProfileTabNavigation from '../components/profile/ProfileTabNavigation';
import ActivityTabSection from '../components/profile/ActivityTabSection';
import SettingsTabSection from '../components/profile/SettingsTabSection';
import FriendsScreen from '../components/friends/FriendsScreen';

// Extracted custom hooks
import { useUserActivity } from '../hooks/useUserActivity';
import { useProfileSettings } from '../hooks/useProfileSettings';
import { useRankingData } from '../hooks/profile/useRankingData';
import { useBadgesAndTags } from '../hooks/profile/useBadgesAndTags';
import { useDirectChatUnreadCount } from '../hooks/profile/useDirectChatUnreadCount';
import { useNavigationParams } from '../hooks/profile/useNavigationParams';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { functions, db } from '../firebase/config';
// 🎥 CCTV: Enhanced logging for refresh behavior tracking
import { cctvLog, CCTV_PHASES } from '../utils/cctvLogger';
// 🛡️ CAPTAIN AMERICA: NTRP utils for number type handling
import { getLtrLevelDescription } from '../utils/ltrUtils';
// 🎯 [OPERATION DUO] Partner invitation types
import { PartnerInvitation } from '../types/match';
// 🎯 [FRIEND INVITE] Friend invitation types
import { FriendInvitation } from '../components/cards/FriendInvitationCard';
// Services
import ActivityService from '../services/activityService';
import friendshipService from '../services/friendshipService';
// Tab content components
import StatsTabContent from '../components/profile/StatsTabContent';
import InformationTabContent from '../components/profile/InformationTabContent';

// Route type
type RouteProps = RouteProp<MainTabParamList, 'MyProfile'>;

const MyProfileScreen = () => {
  const { currentLanguage, t } = useLanguage();
  const { currentUser: userProfile, isAdmin } = useAuth(); // 🎯 UNIFIED DATA SOURCE: Direct AuthContext usage
  const { theme: currentTheme } = useTheme();
  // 🎯 [SOLO LOBBY] Get pending team proposals count for activity badge
  const { pendingTeamProposalsCount } = useActivities();

  const navigation = useNavigation();

  // 📨 Direct Chat State
  const [showDirectChatList, setShowDirectChatList] = useState(false);

  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles = createStyles(colors as any);
  const route = useRoute<RouteProps>();

  // 🎯 SINGLE SOURCE OF TRUTH: userProfile now comes directly from AuthContext
  // No more data inconsistency issues!

  // 🎯 [OPERATION DUO] Partner invitations state
  const [partnerInvitations, setPartnerInvitations] = useState<
    (PartnerInvitation & { id: string })[]
  >([]);

  // 🎯 [FRIEND INVITE] Friend invitations state
  const [friendInvitations, setFriendInvitations] = useState<FriendInvitation[]>([]);

  // 🤝 [FRIENDSHIP] Pending friend requests count for badge display
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);

  // 🛡️ [DUPLICATE_CLICK_PREVENTION] Track which invitation is being processed
  const [processingInvitationId, setProcessingInvitationId] = useState<string | null>(null);

  // Custom hooks for data management
  const { activeMainTab, setActiveMainTab } = useNavigationParams(route.params?.initialTab);

  // 🎥 CCTV: Enhanced component render detection
  cctvLog('MyProfileScreen', CCTV_PHASES.COMPONENT_MOUNT, 'MyProfileScreen component rendered', {
    hasUserProfile: !!userProfile,
    userId: userProfile?.uid,
    hasLocation: !!userProfile?.profile?.location,
    locationData: userProfile?.profile?.location,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastUpdated: (userProfile as any)?._lastUpdated,
    currentTheme,
    activeMainTab,
  });

  // 🚨 CCTV 3: Frontline - Component Render Detection
  console.log(
    '📱 [MyProfileScreen CCTV] Component rendered. userProfile.profile?.location:',
    JSON.stringify(userProfile?.profile?.location)
  );
  console.log(
    '📱 [MyProfileScreen CCTV] Component rendered. userProfile._lastUpdated:',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (userProfile as any)?._lastUpdated
  );
  // 🆕 [KIM] Extract user's gender for gender-specific rankings
  const userGender = useMemo(() => {
    const gender = userProfile?.gender || userProfile?.profile?.gender;
    return gender === 'male' || gender === 'female' ? gender : undefined;
  }, [userProfile?.gender, userProfile?.profile?.gender]);

  const { rankingData } = useRankingData(userProfile?.uid, userGender);
  const { sportsmanshipTags, isLoadingSportsmanshipTags } = useBadgesAndTags(userProfile?.uid);
  const { totalUnreadCount } = useDirectChatUnreadCount(userProfile?.uid);

  // 🚀 [PERFORMANCE] Extract newEventId for instant display
  const newEventId = route.params?.newEventId;

  const {
    appliedEvents,
    hostedEvents,
    pastEvents,
    loading: activityLoading,
    refreshActivity,
    editEvent,
  } = useUserActivity({ newEventId });

  // 🎯 [KIM FIX] Calculate pending activity count (pending applications + partner invitations + match invitations + team proposals)
  const pendingActivityCount = useMemo(() => {
    const hostedPending = hostedEvents.reduce((total, event) => {
      return total + (event.pendingApplications?.length || 0);
    }, 0);
    // 🎯 [KIM FIX v2] Include partner invitations count in activity badge
    // 🎯 [KIM FIX v3] Include pending match invitations (friendInvitations with status='pending')
    const pendingMatchInvitations = friendInvitations.filter(
      inv => inv.status === 'pending'
    ).length;
    // 🎯 [KIM FIX v4] Include pending team proposals from solo lobby
    return (
      hostedPending +
      partnerInvitations.length +
      pendingMatchInvitations +
      pendingTeamProposalsCount
    );
  }, [hostedEvents, partnerInvitations, friendInvitations, pendingTeamProposalsCount]);

  // 🎯 [KIM FIX] Calculate unread event chat count (for hosted + applied + past events)
  const unreadEventChatCount = useMemo(() => {
    const userId = userProfile?.uid;
    if (!userId) return 0;

    // Count unread from hosted events
    const hostedUnread = hostedEvents.reduce((total, event) => {
      const unread = event.chatUnreadCount?.[userId] || 0;
      return total + unread;
    }, 0);

    // Count unread from applied events
    const appliedUnread = appliedEvents.reduce((total, event) => {
      const unread = event.chatUnreadCount?.[userId] || 0;
      return total + unread;
    }, 0);

    // Count unread from past events (지난 활동 기록)
    const pastUnread = pastEvents.reduce((total, event) => {
      const unread = event.chatUnreadCount?.[userId] || 0;
      return total + unread;
    }, 0);

    return hostedUnread + appliedUnread + pastUnread;
  }, [hostedEvents, appliedEvents, pastEvents, userProfile?.uid]);

  const {
    // 🆕 Category notification master toggles
    chatCategoryNotifications,
    inviteCategoryNotifications,
    competitionCategoryNotifications,
    clubCategoryNotifications,
    achievementCategoryNotifications,
    setChatCategoryNotifications,
    setInviteCategoryNotifications,
    setCompetitionCategoryNotifications,
    setClubCategoryNotifications,
    setAchievementCategoryNotifications,
    refreshNotificationSettings, // 🔄 For bi-directional sync
    // Legacy notification settings
    lightningMatchNotifications,
    chatNotifications,
    setLightningMatchNotifications,
    setChatNotifications,
    locationPermissionStatus,
    getLocationPermissionInfo,
    handleLocationPermissionPress,
    isUpdatingLocation,
    locationUpdateProgress,
    cancelLocationUpdate,
    getCurrentThemeText,
    handleThemeSettings,
    handleEditProfile,
    handleUpdateLocation,
    handleLanguageSettings,
    handlePrivacySettings,
    handleLogout,
    handleDeleteAccount,
  } = useProfileSettings();

  // 🔄 [BI-DIRECTIONAL SYNC] Refresh notification settings when screen gains focus
  // This ensures Settings Tab shows latest values from NotificationSettingsScreen
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [MyProfileScreen] Tab focused - refreshing notification settings');
      refreshNotificationSettings();
    }, [refreshNotificationSettings])
  );

  // Phase 4: Notification Settings handler
  const handleNotificationSettings = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('NotificationSettings');
  };

  // 🔒 Admin Dashboard handler
  const handleAdminDashboard = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('AdminDashboard');
  };

  // 🎯 [OPERATION DUO] Partner invitation handlers
  const handleAcceptInvitation = async (invitationId: string) => {
    // 🛡️ Prevent duplicate clicks
    if (processingInvitationId) {
      console.log('🛡️ [ACCEPT_INVITATION] Already processing, ignoring duplicate click');
      return;
    }

    try {
      setProcessingInvitationId(invitationId);
      console.log('🎯 [ACCEPT_INVITATION] Accepting invitation:', invitationId);
      const respondFn = httpsCallable(functions, 'respondToInvitation');
      await respondFn({ invitationId, accept: true });
      Alert.alert(t('common.success'), t('myProfile.partnerInvitation.accepted'));
    } catch (error) {
      console.error('❌ [ACCEPT_INVITATION] Error:', error);
      Alert.alert(t('common.error'), t('myProfile.partnerInvitation.acceptError'));
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    // 🛡️ Prevent duplicate clicks
    if (processingInvitationId) {
      console.log('🛡️ [REJECT_INVITATION] Already processing, ignoring duplicate click');
      return;
    }

    try {
      setProcessingInvitationId(invitationId);
      console.log('🎯 [REJECT_INVITATION] Rejecting invitation:', invitationId);
      const respondFn = httpsCallable(functions, 'respondToInvitation');
      await respondFn({ invitationId, accept: false });

      // 🆕 [KIM FIX] Immediately remove the rejected invitation from state
      // This ensures the card disappears instantly (real-time listener may have latency)
      setPartnerInvitations(prev => {
        const filtered = prev.filter(inv => inv.id !== invitationId);
        console.log(
          '🗑️ [REJECT_INVITATION] Removed invitation from state:',
          invitationId,
          'Remaining:',
          filtered.length
        );
        return filtered;
      });

      Alert.alert(t('common.success'), t('myProfile.partnerInvitation.rejected'));
    } catch (error) {
      console.error('❌ [REJECT_INVITATION] Error:', error);
      Alert.alert(t('common.error'), t('myProfile.partnerInvitation.rejectError'));
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleReAcceptInvitation = async (invitationId: string) => {
    // Re-accept is same as accept
    await handleAcceptInvitation(invitationId);
  };

  // 🎯 [FRIEND INVITE] Handle friend invitation accept
  const handleAcceptFriendInvitation = async (eventId: string) => {
    try {
      console.log('🎯 [FRIEND_INVITE] Accepting friend invitation:', eventId);
      await ActivityService.respondToFriendInvite(eventId, 'accept');

      Alert.alert(t('common.success'), t('myProfile.friendInvitation.accepted'));

      // Refresh will happen automatically via real-time subscription
    } catch (error) {
      console.error('❌ [FRIEND_INVITE] Error accepting invitation:', error);
      Alert.alert(t('common.error'), t('myProfile.friendInvitation.acceptError'));
    }
  };

  // 🎯 [FRIEND INVITE] Handle friend invitation reject
  const handleRejectFriendInvitation = async (eventId: string) => {
    try {
      console.log('🎯 [FRIEND_INVITE] Rejecting friend invitation:', eventId);
      await ActivityService.respondToFriendInvite(eventId, 'reject');

      Alert.alert(t('common.success'), t('myProfile.friendInvitation.rejected'));

      // Refresh will happen automatically via real-time subscription
    } catch (error) {
      console.error('❌ [FRIEND_INVITE] Error rejecting invitation:', error);
      Alert.alert(t('common.error'), t('myProfile.friendInvitation.rejectError'));
    }
  };

  // 🎯 [OPERATION DUO] Real-time subscription to pending partner invitations
  useEffect(() => {
    if (!userProfile?.uid) {
      setPartnerInvitations([]);
      return;
    }

    console.log('🎯 [PARTNER INVITATIONS] Setting up real-time subscription');

    const partnerInvitationsRef = collection(db, 'partner_invitations');
    const partnerInvitationsQuery = query(
      partnerInvitationsRef,
      where('invitedUserId', '==', userProfile.uid), // 🚨 FIX: inviteeId → invitedUserId
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(partnerInvitationsQuery, snapshot => {
      const invitations = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as (PartnerInvitation & { id: string })[];
      console.log('🔔 [PARTNER INVITATIONS] Updated:', invitations.length);
      setPartnerInvitations(invitations);
    });

    return () => {
      console.log('🎯 [PARTNER INVITATIONS] Cleaning up subscription');
      unsubscribe();
    };
  }, [userProfile?.uid]);

  // 🎯 [FRIEND INVITE] Real-time subscription to friend invitations
  useEffect(() => {
    if (!userProfile?.uid) {
      setFriendInvitations([]);
      return;
    }

    console.log('🎯 [FRIEND_INVITE] Setting up friend invitations listener for:', userProfile.uid);

    const unsubscribe = ActivityService.subscribeToFriendInvitations(
      userProfile.uid,
      invitations => {
        console.log('🎯 [FRIEND_INVITE] Received invitations:', invitations.length);
        setFriendInvitations(invitations);
      }
    );

    return () => {
      console.log('🎯 [FRIEND_INVITE] Cleaning up subscription');
      unsubscribe();
    };
  }, [userProfile?.uid]);

  // 🤝 [FRIENDSHIP] Real-time subscription to pending friend requests count
  useEffect(() => {
    if (!userProfile?.uid) {
      setPendingFriendRequestsCount(0);
      return;
    }

    console.log('🤝 [FRIENDSHIP] Setting up friend requests listener for:', userProfile.uid);

    const unsubscribe = friendshipService.subscribeToFriendRequests(userProfile.uid, requests => {
      console.log('🤝 [FRIENDSHIP] Pending requests count:', requests.length);
      setPendingFriendRequestsCount(requests.length);
    });

    return () => {
      console.log('🤝 [FRIENDSHIP] Cleaning up subscription');
      unsubscribe();
    };
  }, [userProfile?.uid]);

  // Render Information Tab
  const renderInformationTab = () => {
    return (
      <InformationTabContent
        userProfile={userProfile!}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rankingData={rankingData as any}
        sportsmanshipTags={sportsmanshipTags}
        isLoadingSportsmanshipTags={isLoadingSportsmanshipTags}
        onEditProfile={handleEditProfile}
        onUpdateLocation={handleUpdateLocation}
        isUpdatingLocation={isUpdatingLocation}
        locationUpdateProgress={locationUpdateProgress}
        cancelLocationUpdate={cancelLocationUpdate}
        getLtrLevelDescription={level => getLtrLevelDescription(level, currentLanguage)}
        // 🆕 [KIM] Pass gender for gender-specific ranking label
        userGender={userGender}
      />
    );
  };

  // Render Match Stats Tab
  const renderMatchStatsTab = () => {
    if (!userProfile) return null;

    // 🆕 [KIM] Use component-level userGender (already extracted above)
    return (
      <StatsTabContent
        userId={userProfile.uid}
        userProfile={userProfile}
        currentLanguage={currentLanguage}
        userGender={userGender}
      />
    );
  };

  // Render Friends Tab
  const renderFriendsTab = () => {
    if (!userProfile) return null;

    return (
      <View style={styles.tabContent}>
        <FriendsScreen currentUserId={userProfile.uid} />
      </View>
    );
  };

  // Main tab content renderer
  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'information':
        return renderInformationTab();
      case 'stats':
        return renderMatchStatsTab();
      case 'activity':
        return (
          <ActivityTabSection
            appliedEvents={appliedEvents}
            hostedEvents={hostedEvents}
            pastEvents={pastEvents}
            partnerInvitations={partnerInvitations}
            friendInvitations={friendInvitations}
            onAcceptInvitation={handleAcceptInvitation}
            onRejectInvitation={handleRejectInvitation}
            onReAcceptInvitation={handleReAcceptInvitation}
            onAcceptFriendInvitation={handleAcceptFriendInvitation}
            onRejectFriendInvitation={handleRejectFriendInvitation}
            loading={activityLoading}
            currentLanguage={currentLanguage}
            initialTab={route.params?.initialActivityTab}
            onRefresh={refreshActivity}
            onEditEvent={editEvent}
          />
        );
      case 'friends':
        return renderFriendsTab();
      case 'settings':
        return (
          <SettingsTabSection
            // 🆕 Category notification master toggles
            chatCategoryNotifications={chatCategoryNotifications}
            inviteCategoryNotifications={inviteCategoryNotifications}
            competitionCategoryNotifications={competitionCategoryNotifications}
            clubCategoryNotifications={clubCategoryNotifications}
            achievementCategoryNotifications={achievementCategoryNotifications}
            onChatCategoryChange={setChatCategoryNotifications}
            onInviteCategoryChange={setInviteCategoryNotifications}
            onCompetitionCategoryChange={setCompetitionCategoryNotifications}
            onClubCategoryChange={setClubCategoryNotifications}
            onAchievementCategoryChange={setAchievementCategoryNotifications}
            // Legacy props
            lightningMatchNotifications={lightningMatchNotifications}
            chatNotifications={chatNotifications}
            locationPermissionStatus={locationPermissionStatus}
            onLightningMatchNotificationsChange={setLightningMatchNotifications}
            onChatNotificationsChange={setChatNotifications}
            onLocationPermissionPress={handleLocationPermissionPress}
            onEditProfile={handleEditProfile}
            onLanguageSettings={handleLanguageSettings}
            onThemeSettings={handleThemeSettings}
            onPrivacySettings={handlePrivacySettings}
            onNotificationSettings={handleNotificationSettings}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            isAdmin={isAdmin}
            onAdminDashboard={handleAdminDashboard}
            getLocationPermissionInfo={getLocationPermissionInfo}
            getCurrentThemeText={getCurrentThemeText}
          />
        );
      default:
        return renderInformationTab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('myProfile.title')}</Text>

        {/* 📨 Direct Chat Button */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => setShowDirectChatList(true)} style={styles.headerButton}>
            <Ionicons name='chatbubble-ellipses' size={28} color='#34C759' />
          </TouchableOpacity>

          {totalUnreadCount > 0 && (
            <Badge
              size={16}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#FF3B30',
              }}
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </View>
      </View>

      <ProfileTabNavigation
        activeTab={activeMainTab}
        onTabChange={setActiveMainTab}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        pendingActivityCount={pendingActivityCount}
        unreadEventChatCount={unreadEventChatCount}
      />

      <View style={styles.content}>{renderTabContent()}</View>

      {/* 📨 Direct Chat List Modal */}
      {showDirectChatList && userProfile?.uid && (
        <DirectChatListScreen
          visible={showDirectChatList}
          onClose={() => setShowDirectChatList(false)}
          userId={userProfile.uid}
          navigation={navigation}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: LightningTennisColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.onSurface,
    },
    headerButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    tabContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

export default MyProfileScreen;
