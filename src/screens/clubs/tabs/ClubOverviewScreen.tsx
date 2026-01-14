import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Text,
} from 'react-native';
import { Card, Text as PaperText, Chip, Badge, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AIAssistantIcon from '../../../components/ai/AIAssistantIcon';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useTheme as useLTTheme } from '../../../hooks/useTheme';
import { getLightningTennisTheme } from '../../../theme';
import { useClub } from '../../../contexts/ClubContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useMeetupChatUnreadCount } from '../../../hooks/clubs/useMeetupChatUnreadCount';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { FeedItem } from '../../../types/feed';
import { Tournament } from '../../../types/tournament';
import { League } from '../../../types/league';

interface ClubOverviewScreenProps {
  clubId: string;
  clubProfile: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  userRole: string;
  onSwitchToLeaguesTab?: (subTab: 'leagues' | 'tournaments') => void;
  onSwitchToActivitiesTab?: () => void;
  onNotificationCountChange?: (count: number) => void;
}

// 🤖 IRON MAN: Club Notification Interface
interface ClubNotification {
  id: string;
  recipientId: string;
  type: string;
  clubId: string;
  tournamentId?: string;
  message: string;
  relatedTeamId?: string;
  status: 'unread' | 'read' | 'dismissed';
  createdAt: Timestamp;
  readAt?: Timestamp;
  dismissedAt?: Timestamp;
  metadata?: {
    notificationType?: string;
    actionRequired?: boolean;
    deepLink?: string;
  };
}

const ClubOverviewScreen: React.FC<ClubOverviewScreenProps> = ({
  clubId,
  clubProfile,
  userRole,
  onSwitchToLeaguesTab,
  onSwitchToActivitiesTab,
  onNotificationCountChange,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { theme: currentTheme } = useLTTheme();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);
  const { announcement, isLoadingAnnouncement } = useClub();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  // 🔴 [MEETUP CHAT] Unread count for meetup chat badges
  const { meetupUnreadCounts } = useMeetupChatUnreadCount(currentUser?.uid);

  const [recentWinners, setRecentWinners] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [_clubStats, setClubStats] = useState<unknown>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  // 🤖 IRON MAN: Club Notifications State
  const [clubNotifications, setClubNotifications] = useState<ClubNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // 🤖 IRON MAN: Club Activity Feed State
  const [clubFeedItems, setClubFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // 🎯 [KIM] Active Tournaments & Leagues State
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [activeLeagues, setActiveLeagues] = useState<League[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // 🎾 [KIM] Active Meetups State - 당일 9시부터 표시
  interface MeetupData {
    id: string;
    clubId: string;
    dateTime: Timestamp;
    location?: {
      name?: string;
      address?: string;
    };
    courtDetails?: {
      availableCourts?: number;
    };
    attendees?: string[];
    participants?: Record<string, { status?: string }>; // 🎯 [KIM FIX] Added for attendee count
    status: string;
    createdAt?: Timestamp;
  }
  const [activeMeetups, setActiveMeetups] = useState<MeetupData[]>([]);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      // Load overview data (placeholder - will connect to real services later)
      setClubStats({
        totalMembers: clubProfile?.memberCount || 0,
        thisMonthEvents: 8,
        participationRate: 85,
      });

      // Announcements are now handled by ClubContext real-time subscription

      // TODO: Load recent winners from Firestore
      setRecentWinners([]);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  }, [clubProfile?.memberCount]);

  // Note: Announcements are now handled by ClubContext, no longer loaded here

  // 🤖 IRON MAN: Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('📖 [IRON MAN] Marking notification as read:', notificationId);
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        status: 'read',
        readAt: Timestamp.now(),
      });
      console.log('✅ [IRON MAN] Notification marked as read');
    } catch (error) {
      console.error('❌ [IRON MAN] Error marking notification as read:', error);
    }
  }, []);

  // 🤖 IRON MAN: Dismiss notification (hide it from list)
  const dismissNotification = useCallback(
    async (notificationId: string) => {
      try {
        console.log('🗑️ [IRON MAN] Dismissing notification:', notificationId);
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          status: 'dismissed',
          dismissedAt: Timestamp.now(),
        });
        console.log('✅ [IRON MAN] Notification dismissed');
      } catch (error) {
        console.error('❌ [IRON MAN] Error dismissing notification:', error);
        Alert.alert(
          t('clubOverviewScreen.deleteError'),
          t('clubOverviewScreen.deleteNotificationError')
        );
      }
    },
    [t]
  );

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // 🤖 IRON MAN: Subscribe to Club Notifications
  useEffect(() => {
    if (!clubId || !currentUser?.uid) {
      console.log('🤖 [IRON MAN] Missing clubId or userId, skipping notifications subscription');
      return;
    }

    console.log('🤖 [IRON MAN] Subscribing to club notifications...', {
      clubId,
      userId: currentUser.uid,
    });

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('clubId', '==', clubId),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const notifications = snapshot.docs
          .map(
            doc =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as ClubNotification
          )
          .filter((notification: ClubNotification) => {
            // Filter out dismissed notifications
            if (notification.status === 'dismissed') {
              return false;
            }

            const createdAtMs = notification.createdAt?.toMillis() || 0;

            // Filter by date based on status
            if (notification.status === 'read') {
              // Read notifications: show for 7 days
              return createdAtMs >= sevenDaysAgo;
            } else {
              // Unread notifications: show for 30 days
              return createdAtMs >= thirtyDaysAgo;
            }
          }) as ClubNotification[];

        console.log('🤖 [IRON MAN] Club notifications updated:', notifications.length);

        setClubNotifications(notifications);
        setUnreadCount(notifications.filter(n => n.status === 'unread').length);
      },
      error => {
        console.error('❌ [IRON MAN] Error fetching club notifications:', error);
      }
    );

    return () => {
      console.log('🤖 [IRON MAN] Unsubscribing from club notifications');
      unsubscribe();
    };
  }, [clubId, currentUser?.uid]);

  // 🔔 Notify parent when notification count changes (for badge display)
  useEffect(() => {
    if (onNotificationCountChange) {
      onNotificationCountChange(clubNotifications.length);
    }
  }, [clubNotifications.length, onNotificationCountChange]);

  // 🤖 IRON MAN: Subscribe to Club Activity Feed
  useEffect(() => {
    if (!clubId || !currentUser?.uid) {
      console.log('🤖 [IRON MAN] Missing clubId or userId, skipping feed subscription');
      setFeedLoading(false);
      return;
    }

    console.log('🤖 [IRON MAN] Subscribing to club activity feed...', { clubId });

    const feedRef = collection(db, 'feed');
    const q = query(
      feedRef,
      where('clubId', '==', clubId),
      where('isActive', '==', true),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const feedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as FeedItem[];

        console.log('🤖 [IRON MAN] Club feed items updated:', feedItems.length);

        // Filter for team activity types
        const teamActivities = feedItems.filter(item =>
          [
            'club_team_invite_pending',
            'club_team_invite_accepted',
            'club_team_invite_rejected',
            'club_team_invite_expired',
          ].includes(item.activityType)
        );

        console.log('🤖 [IRON MAN] Team activities filtered:', teamActivities.length);

        setClubFeedItems(teamActivities);
        setFeedLoading(false);
      },
      error => {
        console.error('❌ [IRON MAN] Error fetching club feed:', error);
        setFeedLoading(false);
      }
    );

    return () => {
      console.log('🤖 [IRON MAN] Unsubscribing from club feed');
      unsubscribe();
    };
  }, [clubId, currentUser?.uid]);

  // 🎯 [KIM] Subscribe to Active Tournaments & Leagues
  useEffect(() => {
    if (!clubId) {
      console.log('🎯 [KIM] Missing clubId, skipping activities subscription');
      setActivitiesLoading(false);
      return;
    }

    console.log('🎯 [KIM] Subscribing to active tournaments & leagues...', { clubId });

    // Active tournament statuses: registration, bracket_generation, in_progress
    const tournamentsRef = collection(db, 'tournaments');
    const tournamentsQuery = query(
      tournamentsRef,
      where('clubId', '==', clubId),
      where('status', 'in', ['registration', 'bracket_generation', 'in_progress']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    // 🎯 [KIM FIX] Active league statuses use different names than tournaments!
    // LeagueStatus: 'open' (registration), 'ongoing' (in progress), 'playoffs'
    const leaguesRef = collection(db, 'leagues');
    const leaguesQuery = query(
      leaguesRef,
      where('clubId', '==', clubId),
      where('status', 'in', ['open', 'ongoing', 'playoffs']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeTournaments = onSnapshot(
      tournamentsQuery,
      snapshot => {
        const tournaments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Tournament[];
        console.log('🎯 [KIM] Active tournaments updated:', tournaments.length);
        setActiveTournaments(tournaments);
        setActivitiesLoading(false);
      },
      error => {
        console.error('❌ [KIM] Error fetching active tournaments:', error);
        setActivitiesLoading(false);
      }
    );

    const unsubscribeLeagues = onSnapshot(
      leaguesQuery,
      snapshot => {
        const leagues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as League[];
        console.log('🎯 [KIM] Active leagues updated:', leagues.length);
        setActiveLeagues(leagues);
      },
      error => {
        console.error('❌ [KIM] Error fetching active leagues:', error);
      }
    );

    return () => {
      console.log('🎯 [KIM] Unsubscribing from activities');
      unsubscribeTournaments();
      unsubscribeLeagues();
    };
  }, [clubId]);

  // 🎾 [KIM] Subscribe to Today's Meetups - 당일 9시부터 또는 9시 이후 생성 시
  useEffect(() => {
    if (!clubId) {
      console.log('🎾 [KIM] Missing clubId, skipping meetups subscription');
      return;
    }

    console.log('🎾 [KIM] Subscribing to today meetups...', { clubId });

    // 오늘 날짜 범위 계산 (로컬 시간)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const meetupsRef = collection(db, 'regular_meetups');
    const meetupsQuery = query(
      meetupsRef,
      where('clubId', '==', clubId),
      where('status', '==', 'confirmed'),
      where('dateTime', '>=', Timestamp.fromDate(todayStart)),
      where('dateTime', '<=', Timestamp.fromDate(todayEnd)),
      orderBy('dateTime', 'asc'),
      limit(5)
    );

    const unsubscribeMeetups = onSnapshot(
      meetupsQuery,
      snapshot => {
        const currentHour = new Date().getHours();
        const is9AMOrLater = currentHour >= 9;

        const meetups = snapshot.docs
          .map(
            doc =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as MeetupData
          )
          .filter(meetup => {
            // 🎯 조건: 9시 이후이거나, 9시 이후에 생성된 모임
            if (is9AMOrLater) {
              // 9시 이후면 모든 오늘 모임 표시
              return true;
            } else {
              // 9시 이전이면 9시 이후에 생성된 모임만 표시
              const createdAt = meetup.createdAt;
              if (createdAt) {
                const createdDate = createdAt.toDate
                  ? createdAt.toDate()
                  : new Date(createdAt as unknown as string);
                const createdHour = createdDate.getHours();
                const isCreatedToday = createdDate.toDateString() === now.toDateString();
                // 오늘 9시 이후에 생성됐는지 확인
                return isCreatedToday && createdHour >= 9;
              }
              return false;
            }
          });

        console.log('🎾 [KIM] Active meetups updated:', meetups.length);
        setActiveMeetups(meetups);
      },
      error => {
        console.error('❌ [KIM] Error fetching meetups:', error);
      }
    );

    return () => {
      console.log('🎾 [KIM] Unsubscribing from meetups');
      unsubscribeMeetups();
    };
  }, [clubId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <PaperText variant='bodyMedium' style={styles.loadingText}>
          {t('clubOverviewScreen.loadingClubInfo')}
        </PaperText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 클럽 공지사항 섹션 */}
        {isLoadingAnnouncement ? (
          <Card style={styles.announcementCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <ActivityIndicator size='small' color={themeColors.colors.primary} />
                <PaperText variant='bodyMedium' style={styles.loadingText}>
                  {t('clubOverviewScreen.loadingAnnouncements')}
                </PaperText>
              </View>
            </Card.Content>
          </Card>
        ) : announcement ? (
          <Card style={styles.announcementCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name='megaphone' size={18} color={themeColors.colors.error} />
                  <PaperText variant='titleMedium' style={styles.announcementTitle}>
                    {t('clubOverviewScreen.clubAnnouncements')}
                  </PaperText>
                </View>
                {announcement.isImportant && (
                  <Chip compact style={styles.priorityChip}>
                    {t('clubOverviewScreen.important')}
                  </Chip>
                )}
              </View>
              <View style={styles.announcementItem}>
                <PaperText variant='titleMedium' style={styles.announcementItemTitle}>
                  {announcement.title}
                </PaperText>
                <PaperText variant='bodyMedium' style={styles.announcementContent}>
                  {announcement.content}
                </PaperText>
                <PaperText variant='bodySmall' style={styles.announcementDate}>
                  {announcement.updatedAt
                    ? (() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const timestamp = announcement.updatedAt as any;
                        const milliseconds = timestamp.seconds
                          ? timestamp.seconds * 1000
                          : timestamp;
                        return new Date(milliseconds).toLocaleDateString(t('common.locale'));
                      })()
                    : t('clubOverviewScreen.noDateInfo')}
                </PaperText>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {/* 🤖 IRON MAN: 클럽 알림 섹션 - 🔄 [2026-01-12] Moved above Activities */}
        {clubNotifications.length > 0 && (
          <Card style={styles.notificationsCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name='notifications' size={18} color={themeColors.colors.secondary} />
                  <PaperText variant='titleMedium' style={styles.sectionTitle}>
                    {t('clubOverviewScreen.clubNotifications')}
                  </PaperText>
                  {unreadCount > 0 && (
                    <Badge size={20} style={styles.notificationBadge}>
                      {unreadCount}
                    </Badge>
                  )}
                </View>
              </View>

              {clubNotifications
                .slice(0, showAllNotifications ? clubNotifications.length : 3)
                .map(notification => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      notification.status === 'unread' && styles.unreadNotification,
                    ]}
                    onPress={() => {
                      // Mark as read when clicked
                      if (notification.status === 'unread') {
                        markNotificationAsRead(notification.id);
                      }

                      // Navigate to team invitations screen if it's a team invite
                      if (notification.type === 'CLUB_TEAM_INVITE') {
                        Alert.alert(t('clubOverviewScreen.teamInviteTitle'), notification.message, [
                          { text: t('clubOverviewScreen.cancel'), style: 'cancel' },
                          {
                            text: t('clubOverviewScreen.confirm'),
                            onPress: () => {
                              // TODO: Navigate to TeamInvitationsScreen
                              console.log('Navigate to team invitations');
                            },
                          },
                        ]);
                      }
                    }}
                  >
                    {/* 🎯 [KIM FIX] Restructured layout: Row with content area + action buttons */}
                    <View style={styles.notificationRow}>
                      {/* Left: Icon + Content */}
                      <View style={styles.notificationHeader}>
                        <View style={styles.notificationIconContainer}>
                          {notification.type === 'CLUB_TEAM_INVITE' && (
                            <Ionicons
                              name='people'
                              size={20}
                              color={themeColors.colors.secondary}
                            />
                          )}
                        </View>
                        <View style={styles.notificationContent}>
                          <PaperText
                            variant='bodyMedium'
                            style={[
                              styles.notificationMessage,
                              notification.status === 'unread' && styles.unreadText,
                            ]}
                          >
                            {/* 🎯 [KIM FIX v2] Check if message is a translation key and pass all interpolation variables */}
                            {notification.message?.startsWith('notification.')
                              ? t(notification.message, {
                                  // 🎯 Spread data field first (Cloud Functions save interpolation data here)
                                  ...notification.data,
                                  // 🎯 Then metadata for backward compatibility
                                  ...notification.metadata,
                                  // 🎯 Explicit overrides for legacy notifications
                                  leagueName:
                                    notification.data?.leagueName ||
                                    notification.leagueName ||
                                    notification.metadata?.leagueName ||
                                    '',
                                  clubName:
                                    notification.data?.clubName ||
                                    notification.clubName ||
                                    notification.metadata?.clubName ||
                                    '',
                                  tournamentName:
                                    notification.data?.tournamentName ||
                                    notification.metadata?.tournamentName ||
                                    '',
                                  eventTitle:
                                    notification.data?.eventTitle ||
                                    notification.metadata?.eventTitle ||
                                    '',
                                  // 🎯 New i18n variables from Cloud Functions
                                  memberName:
                                    notification.data?.memberName ||
                                    notification.metadata?.memberName ||
                                    '',
                                  newOwnerName:
                                    notification.data?.newOwnerName ||
                                    notification.metadata?.newOwnerName ||
                                    '',
                                  applicantName:
                                    notification.data?.applicantName ||
                                    notification.metadata?.applicantName ||
                                    notification.applicantName ||
                                    '',
                                  inviterName:
                                    notification.data?.inviterName ||
                                    notification.metadata?.inviterName ||
                                    '',
                                })
                              : notification.message}
                          </PaperText>
                          <PaperText variant='bodySmall' style={styles.notificationDate}>
                            {notification.createdAt
                              ? (() => {
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  const timestamp = notification.createdAt as any;
                                  const milliseconds = timestamp.seconds
                                    ? timestamp.seconds * 1000
                                    : timestamp;
                                  return new Date(milliseconds).toLocaleString(t('common.locale'), {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                })()
                              : t('clubOverviewScreen.noDateInfo')}
                          </PaperText>
                        </View>
                      </View>
                      {/* Right: Action chip + X button in column */}
                      <View style={styles.notificationActions}>
                        {notification.metadata?.actionRequired && (
                          <Chip
                            compact
                            style={styles.actionRequiredChip}
                            textStyle={styles.actionRequiredText}
                          >
                            {t('clubOverviewScreen.actionRequired')}
                          </Chip>
                        )}
                        <IconButton
                          icon='close'
                          size={18}
                          onPress={e => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          style={styles.dismissButton}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

              {clubNotifications.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAllNotifications(!showAllNotifications)}
                >
                  <PaperText variant='bodyMedium' style={styles.viewAllText}>
                    {showAllNotifications
                      ? t('clubOverviewScreen.collapseNotifications')
                      : t('clubOverviewScreen.viewAllNotifications', {
                          count: clubNotifications.length,
                        })}
                  </PaperText>
                  <Ionicons
                    name={showAllNotifications ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={themeColors.colors.primary}
                  />
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>
        )}

        {/* 🎯 [KIM] 진행 중인 활동 섹션 - 토너먼트 & 리그 & 모임 - 🔄 [2026-01-12] Moved below Notifications */}
        {!activitiesLoading &&
          (activeTournaments.length > 0 ||
            activeLeagues.length > 0 ||
            activeMeetups.length > 0) && (
            <Card style={styles.activitiesCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name='flash' size={18} color={themeColors.colors.primary} />
                    <PaperText variant='titleMedium' style={styles.sectionTitle}>
                      {t('clubOverviewScreen.activitiesInProgress')}
                    </PaperText>
                  </View>
                </View>

                {/* 진행 중인 토너먼트 - 🎯 [KIM FIX] Use callback to switch tab (not navigation) */}
                {activeTournaments.map(tournament => (
                  <TouchableOpacity
                    key={tournament.id}
                    style={styles.activityItem}
                    onPress={() => onSwitchToLeaguesTab?.('tournaments')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityIconContainer}>
                      <Ionicons name='trophy' size={20} color={themeColors.colors.tertiary} />
                    </View>
                    <View style={styles.activityContent}>
                      <PaperText variant='bodyMedium' style={styles.activityTitle}>
                        {tournament.title}
                      </PaperText>
                      <View style={styles.activityMeta}>
                        <Chip
                          compact
                          style={[
                            styles.statusChip,
                            tournament.status === 'registration'
                              ? styles.statusRegistration
                              : tournament.status === 'in_progress'
                                ? styles.statusInProgress
                                : styles.statusPending,
                          ]}
                          textStyle={styles.statusChipText}
                        >
                          {tournament.status === 'registration'
                            ? t('clubOverviewScreen.registrationOpen')
                            : tournament.status === 'in_progress'
                              ? t('clubOverviewScreen.inProgress')
                              : t('clubOverviewScreen.bracketGeneration')}
                        </Chip>
                        <PaperText variant='bodySmall' style={styles.activityParticipants}>
                          👥 {tournament.participants?.length || 0}/
                          {tournament.settings?.maxParticipants || '∞'}
                        </PaperText>
                      </View>
                    </View>
                    <Ionicons
                      name='chevron-forward'
                      size={20}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}

                {/* 진행 중인 리그 - 🎯 [KIM FIX] Use callback to switch tab (not navigation) */}
                {activeLeagues.map(league => (
                  <TouchableOpacity
                    key={league.id}
                    style={styles.activityItem}
                    onPress={() => onSwitchToLeaguesTab?.('leagues')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityIconContainer}>
                      <Ionicons name='podium' size={20} color={themeColors.colors.secondary} />
                    </View>
                    <View style={styles.activityContent}>
                      <PaperText variant='bodyMedium' style={styles.activityTitle}>
                        {league.name}
                      </PaperText>
                      <View style={styles.activityMeta}>
                        {/* 🎯 [KIM FIX] LeagueStatus uses 'open' and 'ongoing', not 'registration' and 'in_progress' */}
                        <Chip
                          compact
                          style={[
                            styles.statusChip,
                            league.status === 'open'
                              ? styles.statusRegistration
                              : league.status === 'ongoing'
                                ? styles.statusInProgress
                                : styles.statusPlayoffs,
                          ]}
                          textStyle={styles.statusChipText}
                        >
                          {league.status === 'open'
                            ? t('clubOverviewScreen.registrationOpen')
                            : league.status === 'ongoing'
                              ? t('clubOverviewScreen.roundRobinInProgress')
                              : t('clubOverviewScreen.playoffsInProgress')}
                        </Chip>
                        <PaperText variant='bodySmall' style={styles.activityParticipants}>
                          👥 {league.participants?.length || 0}/
                          {league.settings?.maxParticipants || '∞'}
                        </PaperText>
                      </View>
                    </View>
                    <Ionicons
                      name='chevron-forward'
                      size={20}
                      color={themeColors.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}

                {/* 🎾 [KIM] 오늘의 정기 모임 - 당일 9시부터 표시 */}
                {activeMeetups.map(meetup => {
                  const meetupDate = meetup.dateTime?.toDate();
                  const timeString = meetupDate
                    ? meetupDate.toLocaleTimeString(t('common.locale'), {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : '';
                  const locationName = meetup.location?.name || meetup.location?.address || '';
                  const courtCount = meetup.courtDetails?.availableCourts || 0;
                  // 🎯 [KIM FIX] Count from participants object (status === 'attending')
                  const attendeeCount = meetup.participants
                    ? Object.values(meetup.participants).filter(
                        (p: { status?: string }) => p.status === 'attending'
                      ).length
                    : 0;
                  // 🔴 [MEETUP CHAT] Get unread count for this meetup
                  const meetupUnreadCount = meetupUnreadCounts[meetup.id] || 0;

                  return (
                    <TouchableOpacity
                      key={meetup.id}
                      style={styles.activityItem}
                      onPress={() =>
                        navigation.navigate(
                          'MeetupDetail' as never,
                          { meetupId: meetup.id, clubId } as never
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.activityIconContainer}>
                        <Ionicons name='tennisball' size={20} color={themeColors.colors.primary} />
                      </View>
                      <View style={styles.activityContent}>
                        <PaperText variant='bodyMedium' style={styles.activityTitle}>
                          {t('clubOverviewScreen.todayMeetup')} - {timeString}
                        </PaperText>
                        <View style={styles.meetupMeta}>
                          {locationName ? (
                            <PaperText
                              variant='bodySmall'
                              style={styles.meetupLocation}
                              numberOfLines={1}
                            >
                              📍 {locationName}
                            </PaperText>
                          ) : null}
                          <View style={styles.meetupStats}>
                            <PaperText variant='bodySmall' style={styles.activityParticipants}>
                              🎾 {courtCount} {t('clubOverviewScreen.courts')}
                            </PaperText>
                            <PaperText variant='bodySmall' style={styles.activityParticipants}>
                              👥 {attendeeCount} {t('clubOverviewScreen.attendees')}
                            </PaperText>
                          </View>
                        </View>
                      </View>
                      <Ionicons
                        name='chevron-forward'
                        size={20}
                        color={themeColors.colors.onSurfaceVariant}
                      />
                      {/* 🔴 [MEETUP CHAT] Unread chat badge */}
                      {meetupUnreadCount > 0 && (
                        <View style={styles.meetupUnreadBadge}>
                          <Text style={styles.meetupUnreadBadgeText}>
                            {meetupUnreadCount > 99 ? '99+' : meetupUnreadCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </Card.Content>
            </Card>
          )}

        {/* 🤖 IRON MAN: 클럽 활동 피드 섹션 */}
        {!feedLoading && clubFeedItems.length > 0 && (
          <Card style={styles.activityFeedCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name='pulse' size={18} color={themeColors.colors.primary} />
                  <PaperText variant='titleMedium' style={styles.sectionTitle}>
                    {t('clubOverviewScreen.clubActivity')}
                  </PaperText>
                </View>
              </View>

              {clubFeedItems.map(feedItem => {
                // Determine icon based on activity type
                let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';
                let iconColor: string = themeColors.colors.primary;

                if (feedItem.activityType === 'club_team_invite_pending') {
                  iconName = 'people-outline';
                  iconColor = themeColors.colors.secondary;
                } else if (feedItem.activityType === 'club_team_invite_accepted') {
                  iconName = 'checkmark-circle';
                  iconColor = themeColors.colors.tertiary;
                } else if (feedItem.activityType === 'club_team_invite_rejected') {
                  iconName = 'close-circle';
                  iconColor = themeColors.colors.error;
                } else if (feedItem.activityType === 'club_team_invite_expired') {
                  iconName = 'time-outline';
                  iconColor = themeColors.colors.onSurfaceVariant;
                }

                // Format activity message
                let activityMessage = '';
                const data = feedItem.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any

                if (feedItem.activityType === 'club_team_invite_pending') {
                  activityMessage = `${feedItem.actorName}님이 ${feedItem.targetName}님을 토너먼트 파트너로 초대했습니다`;
                } else if (feedItem.activityType === 'club_team_invite_accepted') {
                  activityMessage = `${feedItem.actorName}님이 ${feedItem.targetName}님의 팀 초대를 수락했습니다`;
                } else if (feedItem.activityType === 'club_team_invite_rejected') {
                  activityMessage = `${feedItem.actorName}님이 ${feedItem.targetName}님의 팀 초대를 거절했습니다`;
                } else if (feedItem.activityType === 'club_team_invite_expired') {
                  activityMessage = `${feedItem.actorName}님과 ${feedItem.targetName}님의 팀 초대가 만료되었습니다`;
                }

                return (
                  <View key={feedItem.id} style={styles.feedItem}>
                    <View style={styles.feedItemHeader}>
                      <View
                        style={[styles.feedIconContainer, { backgroundColor: iconColor + '20' }]}
                      >
                        <Ionicons name={iconName} size={20} color={iconColor} />
                      </View>
                      <View style={styles.feedItemContent}>
                        <PaperText variant='bodyMedium' style={styles.feedMessage}>
                          {activityMessage}
                        </PaperText>
                        {data?.tournamentName && (
                          <PaperText variant='bodySmall' style={styles.feedTournament}>
                            📋 {data.tournamentName}
                          </PaperText>
                        )}
                        <PaperText variant='bodySmall' style={styles.feedTimestamp}>
                          {feedItem.timestamp
                            ? (() => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const timestamp = feedItem.timestamp as any;
                                const milliseconds = timestamp.seconds
                                  ? timestamp.seconds * 1000
                                  : timestamp;
                                return new Date(milliseconds).toLocaleString(t('common.locale'), {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                              })()
                            : t('clubOverviewScreen.noDateInfo')}
                        </PaperText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* 🏆 최근 리그/토너먼트 우승자 발표 섹션 */}
        {recentWinners.length > 0 && (
          <Card style={styles.winnersCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name='trophy' size={18} color={themeColors.colors.tertiary} />
                  <PaperText variant='titleMedium' style={styles.winnerTitle}>
                    {t('clubOverviewScreen.recentWinners')}
                  </PaperText>
                </View>
              </View>
              {recentWinners.map(winner => (
                <View key={winner.id} style={styles.winnerItem}>
                  <View style={styles.winnerHeader}>
                    <PaperText variant='titleMedium' style={styles.tournamentTitle}>
                      {winner.tournamentName}
                    </PaperText>
                  </View>
                  <View style={styles.winnersList}>
                    <View style={styles.winnerRow}>
                      <View style={styles.winnerBadge}>
                        <Ionicons name='trophy' size={20} color={themeColors.colors.tertiary} />
                        <PaperText variant='bodyMedium' style={styles.winnerLabel}>
                          {t('clubOverviewScreen.winner')}
                        </PaperText>
                      </View>
                      <PaperText variant='titleMedium' style={styles.winnerName}>
                        {winner.winner}
                      </PaperText>
                    </View>
                    <View style={styles.winnerRow}>
                      <View style={styles.runnerUpBadge}>
                        <Ionicons
                          name='medal'
                          size={20}
                          color={themeColors.colors.onSurfaceVariant}
                        />
                        <PaperText variant='bodyMedium' style={styles.runnerUpLabel}>
                          {t('clubOverviewScreen.runnerUp')}
                        </PaperText>
                      </View>
                      <PaperText variant='titleMedium' style={styles.runnerUpName}>
                        {winner.runnerUp}
                      </PaperText>
                    </View>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* 🎯 [KIM] Empty State - 역할 기반 가이드 메시지 + AI 도우미 버튼 */}
        {!isLoadingAnnouncement &&
          !activitiesLoading &&
          !announcement &&
          activeTournaments.length === 0 &&
          activeLeagues.length === 0 &&
          clubNotifications.length === 0 &&
          clubFeedItems.length === 0 &&
          recentWinners.length === 0 && (
            <Card style={styles.emptyStateCard}>
              <Card.Content>
                <View style={styles.emptyStateContainer}>
                  {/* Role-based Guide Message */}
                  {userRole === 'admin' || userRole === 'owner' ? (
                    <>
                      <PaperText variant='headlineMedium' style={styles.emptyStateTitle}>
                        {t('clubOverviewScreen.emptyStateAdminTitle')}
                      </PaperText>
                      <PaperText variant='bodyMedium' style={styles.emptyStateDescription}>
                        {t('clubOverviewScreen.emptyStateAdminDescription')}
                      </PaperText>
                      <View style={styles.emptyStateSuggestions}>
                        {/* 🎯 Admin Quick Action: Create Regular Meetup - switches to Activities tab */}
                        <TouchableOpacity
                          style={styles.suggestionItemClickable}
                          onPress={() => onSwitchToActivitiesTab?.()}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name='calendar-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateAdminAction1')}
                          </PaperText>
                          <Ionicons
                            name='chevron-forward'
                            size={16}
                            color={themeColors.colors.onSurfaceVariant}
                          />
                        </TouchableOpacity>
                        {/* 🎯 Admin Quick Action: Invite Members */}
                        <TouchableOpacity
                          style={styles.suggestionItemClickable}
                          onPress={() =>
                            navigation.navigate(
                              'ClubMemberInvitation' as never,
                              { clubId } as never
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name='people-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateAdminAction2')}
                          </PaperText>
                          <Ionicons
                            name='chevron-forward'
                            size={16}
                            color={themeColors.colors.onSurfaceVariant}
                          />
                        </TouchableOpacity>
                        {/* 🎯 Admin Quick Action: Create Tournament/League */}
                        <TouchableOpacity
                          style={styles.suggestionItemClickable}
                          onPress={() =>
                            navigation.navigate(
                              'ClubTournamentManagement' as never,
                              { clubId, clubName: clubProfile?.name } as never
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name='trophy-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateAdminAction3')}
                          </PaperText>
                          <Ionicons
                            name='chevron-forward'
                            size={16}
                            color={themeColors.colors.onSurfaceVariant}
                          />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : userRole === 'member' ? (
                    <>
                      <PaperText variant='headlineMedium' style={styles.emptyStateTitle}>
                        {t('clubOverviewScreen.emptyStateMemberTitle')}
                      </PaperText>
                      <PaperText variant='bodyMedium' style={styles.emptyStateDescription}>
                        {t('clubOverviewScreen.emptyStateMemberDescription')}
                      </PaperText>
                      <View style={styles.emptyStateSuggestions}>
                        <View style={styles.suggestionItem}>
                          <Ionicons
                            name='chatbubble-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateMemberAction1')}
                          </PaperText>
                        </View>
                        <View style={styles.suggestionItem}>
                          <Ionicons
                            name='search-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateMemberAction2')}
                          </PaperText>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <PaperText variant='headlineMedium' style={styles.emptyStateTitle}>
                        {clubProfile?.name
                          ? t('clubOverviewScreen.emptyStateGuestTitle', {
                              clubName: clubProfile.name,
                            })
                          : t('clubOverviewScreen.emptyStateGuestTitleDefault')}
                      </PaperText>
                      <PaperText variant='bodyMedium' style={styles.emptyStateDescription}>
                        {t('clubOverviewScreen.emptyStateGuestDescription')}
                      </PaperText>
                      <View style={styles.emptyStateSuggestions}>
                        <View style={styles.suggestionItem}>
                          <Ionicons
                            name='person-add-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateGuestAction1')}
                          </PaperText>
                        </View>
                        <View style={styles.suggestionItem}>
                          <Ionicons
                            name='information-circle-outline'
                            size={20}
                            color={themeColors.colors.primary}
                          />
                          <PaperText variant='bodyMedium' style={styles.suggestionText}>
                            {t('clubOverviewScreen.emptyStateGuestAction2')}
                          </PaperText>
                        </View>
                      </View>
                    </>
                  )}

                  {/* AI 도우미 버튼 */}
                  <View style={styles.aiHelperSection}>
                    <PaperText variant='bodySmall' style={styles.aiHelperHint}>
                      {t('clubOverviewScreen.aiHelperHint')}
                    </PaperText>
                    <TouchableOpacity
                      style={styles.aiHelperButton}
                      onPress={() => navigation.navigate('ChatScreen' as never)}
                      activeOpacity={0.8}
                    >
                      <AIAssistantIcon size='small' color='#FFFFFF' />
                      <PaperText variant='labelLarge' style={styles.aiHelperButtonText}>
                        {t('clubOverviewScreen.aiHelperButton')}
                      </PaperText>
                    </TouchableOpacity>
                    <PaperText variant='bodySmall' style={styles.aiHelperSubtext}>
                      {t('clubOverviewScreen.aiHelperSubtext')}
                    </PaperText>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
      </ScrollView>
    </View>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
    },
    // 🎯 [KIM FIX] 탐색/이벤트 스타일과 통일 - EventCard와 동일한 스타일
    announcementCard: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      elevation: 1,
    },
    winnersCard: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    announcementTitle: {
      marginLeft: 8,
      fontWeight: '600',
      color: colors.error,
    },
    sectionTitle: {
      marginLeft: 8,
      fontWeight: '600',
      color: colors.onSurface,
    },
    winnerTitle: {
      marginLeft: 8,
      fontWeight: '600',
      color: colors.tertiary,
    },
    priorityChip: {
      backgroundColor: colors.errorContainer,
    },
    announcementItem: {
      marginBottom: 12,
    },
    announcementItemTitle: {
      fontWeight: '600',
      marginBottom: 4,
    },
    announcementContent: {
      marginBottom: 4,
      lineHeight: 20,
      color: colors.onSurface,
    },
    announcementDate: {
      color: colors.onSurfaceVariant,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      marginTop: 8,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    winnerItem: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.tertiaryContainer,
      borderRadius: 8,
    },
    winnerHeader: {
      marginBottom: 8,
    },
    tournamentTitle: {
      fontWeight: '600',
      color: colors.onTertiaryContainer,
    },
    winnersList: {
      gap: 8,
    },
    winnerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    winnerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tertiaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 80,
    },
    runnerUpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 80,
    },
    winnerLabel: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: '600',
      color: colors.onTertiaryContainer,
    },
    runnerUpLabel: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    winnerName: {
      fontWeight: '600',
      color: colors.onSurface,
    },
    runnerUpName: {
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    // 🎯 [KIM] Active Activities styles
    activitiesCard: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 4,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    activityParticipants: {
      color: colors.onSurfaceVariant,
    },
    // 🎾 [KIM] Meetup-specific styles
    meetupMeta: {
      gap: 4,
    },
    meetupLocation: {
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    meetupStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    // 🔴 [MEETUP CHAT] Unread badge styles
    meetupUnreadBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#F44336',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    meetupUnreadBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: 'bold',
    },
    statusChip: {
      minHeight: 28,
    },
    statusChipText: {
      fontSize: 12,
      lineHeight: 20,
      includeFontPadding: false,
    },
    statusRegistration: {
      backgroundColor: colors.primaryContainer,
    },
    statusInProgress: {
      backgroundColor: colors.tertiaryContainer,
    },
    statusPending: {
      backgroundColor: colors.surfaceVariant,
    },
    statusPlayoffs: {
      backgroundColor: colors.secondaryContainer,
    },
    // 🤖 IRON MAN: Notification styles
    // 🎨 [DARK GLASS] Card Style - 테마 색상 사용
    notificationsCard: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    notificationBadge: {
      backgroundColor: '#FFC107', // 🎨 Yellow badge for activity notifications
      color: '#000', // Dark text for better contrast on yellow
      marginLeft: 8,
    },
    notificationItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    unreadNotification: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    // 🎯 [KIM FIX] New row layout: content on left, actions on right
    notificationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: 8,
    },
    notificationIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      flexShrink: 0,
    },
    notificationContent: {
      flex: 1,
    },
    notificationMessage: {
      marginBottom: 4,
      color: colors.onSurface,
      lineHeight: 18,
    },
    unreadText: {
      fontWeight: '600',
    },
    notificationDate: {
      color: colors.onSurfaceVariant,
    },
    // 🎯 [KIM FIX] Actions column on right side
    notificationActions: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 4,
      flexShrink: 0,
    },
    actionRequiredChip: {
      backgroundColor: colors.errorContainer,
    },
    actionRequiredText: {
      fontSize: 10,
      color: colors.error,
    },
    dismissButton: {
      margin: 0,
      padding: 0,
      width: 28,
      height: 28,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    viewAllText: {
      color: colors.primary,
      fontWeight: '600',
      marginRight: 4,
    },
    // 🤖 IRON MAN: Activity Feed styles
    // 🎯 [KIM FIX] 탐색/이벤트 스타일과 통일 - EventCard와 동일한 스타일
    activityFeedCard: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      elevation: 1,
    },
    feedItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceVariant,
    },
    feedItemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    feedIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    feedItemContent: {
      flex: 1,
    },
    feedMessage: {
      marginBottom: 4,
      color: colors.onSurface,
      lineHeight: 20,
    },
    feedTournament: {
      marginBottom: 4,
      color: colors.primary,
      fontWeight: '500',
    },
    feedTimestamp: {
      color: colors.onSurfaceVariant,
    },
    // 🎯 [KIM] Empty State styles - 역할 기반 가이드 + AI 도우미
    emptyStateCard: {
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outline,
      padding: 24,
    },
    emptyStateContainer: {
      alignItems: 'center',
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateDescription: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    emptyStateSuggestions: {
      width: '100%',
      marginBottom: 24,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      marginBottom: 8,
    },
    // 🎯 Clickable suggestion item for admin quick actions
    suggestionItemClickable: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30', // 30% opacity primary color border
    },
    suggestionText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginLeft: 12,
      flex: 1,
    },
    aiHelperSection: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    aiHelperHint: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
      textAlign: 'center',
    },
    aiHelperButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
    },
    aiHelperButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimary,
      marginLeft: 8,
    },
    aiHelperSubtext: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default ClubOverviewScreen;
