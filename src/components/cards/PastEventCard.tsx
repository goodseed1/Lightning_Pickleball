/**
 * PastEventCard - Component for displaying past event cards with chat button
 * Used in "My Activities" -> "Past Activities" tab
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from 'react-native-paper';
import { onSnapshot, doc, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningPickleballTheme } from '../../theme';
import { db } from '../../firebase/config';
import { formatDistance } from '../../utils/unitUtils';

// Event type matching EventCard interface
interface SimpleEvent {
  id: string;
  title: string;
  clubName: string;
  date: Date;
  time: string;
  location: string;
  distance: number | null;
  participants: number;
  maxParticipants: number;
  skillLevel: string;
  type: 'lightning' | 'practice' | 'tournament' | 'meetup' | 'match';
  description?: string;
  status?: string;
  gameType?: string; // 🎯 [KIM FIX] 경기 타입 (singles, doubles, etc.)
  matchResult?: {
    score: {
      finalScore: string;
      sets?: Array<{
        player1Games: number;
        player2Games: number;
        player1TiebreakPoints?: number;
        player2TiebreakPoints?: number;
      }>;
    };
    winnerId: string;
    hostResult: 'win' | 'loss';
    opponentResult: 'win' | 'loss';
    submittedAt?: Date | { seconds: number; nanoseconds: number };
    submittedBy?: string;
  };
  // 🎯 [KIM FIX] 호스트팀 정보
  hostId?: string;
  hostName?: string;
  hostPartnerId?: string;
  hostPartnerName?: string;
  // 🎯 [KIM FIX] 도전팀 정보
  applicantId?: string;
  applicantName?: string;
  opponentPartnerId?: string;
  opponentPartnerName?: string;
}

interface PastEventCardProps {
  event: SimpleEvent;
  currentLanguage: 'en' | 'ko';
  currentUserId?: string;
  onOpenChat?: (eventId: string, eventTitle: string) => void;
  onAnalyzeMatch?: (event: SimpleEvent) => void; // 🎾 경기 분석 버튼 핸들러
  onPress?: () => void;
  style?: object;
}

const PastEventCard: React.FC<PastEventCardProps> = ({
  event,
  currentLanguage = 'en',
  currentUserId,
  onOpenChat,
  onAnalyzeMatch,
  onPress,
  style,
}) => {
  const { theme: currentTheme } = useTheme();
  const { t, currentLanguage: contextLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const themeColors = getLightningPickleballTheme(currentTheme);
  const styles = createStyles(themeColors.colors as unknown as Record<string, string>, currentTheme);

  // 🌍 [KIM FIX] Get user's country for distance unit display
  const userCountry = currentUser?.profile?.location?.country;

  // Use context language if available, otherwise fall back to prop
  const activeLanguage = contextLanguage || currentLanguage;

  // 💬 Firestore에서 직접 chatUnreadCount 구독
  const [localUnreadCount, setLocalUnreadCount] = useState<number>(0);

  // 🎯 [KIM FIX] userId -> displayName 매핑 (항상 최신 닉네임 표시용)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!event.id || !currentUserId) return;

    console.log('🔔 [PastEventCard] Setting up Firestore listener for event:', event.id);

    const eventRef = doc(db, 'events', event.id);
    const unsubscribe = onSnapshot(
      eventRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const unreadCount = data?.chatUnreadCount?.[currentUserId] || 0;
          console.log('🔔 [PastEventCard] Unread count updated:', {
            eventId: event.id,
            userId: currentUserId,
            unreadCount,
          });
          setLocalUnreadCount(unreadCount);
        }
      },
      (error: Error) => {
        console.error('❌ [PastEventCard] Firestore listener error:', error);
      }
    );

    return () => {
      console.log('🧹 [PastEventCard] Cleaning up Firestore listener for event:', event.id);
      unsubscribe();
    };
  }, [event.id, currentUserId]);

  // 🎯 [KIM FIX] Fetch latest display names from users collection
  // This ensures we always show the current nickname, not cached data
  useEffect(() => {
    const fetchLatestUserNames = async () => {
      // Collect all unique user IDs that need name lookup
      const userIds = new Set<string>();
      if (event.hostId) userIds.add(event.hostId);
      if (event.hostPartnerId) userIds.add(event.hostPartnerId);
      if (event.applicantId) userIds.add(event.applicantId);
      if (event.opponentPartnerId) userIds.add(event.opponentPartnerId);

      if (userIds.size === 0) return;

      try {
        const nameMap: Record<string, string> = {};

        // Fetch all user documents in parallel
        const userPromises = Array.from(userIds).map(async userId => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName =
              userData?.profile?.displayName ||
              userData?.profile?.nickname ||
              userData?.displayName ||
              userData?.nickname;
            if (displayName) {
              nameMap[userId] = displayName;
            }
          }
        });

        await Promise.all(userPromises);
        setUserNameMap(nameMap);
        console.log('🎯 [PastEventCard] User name map loaded:', nameMap);
      } catch (error) {
        console.error('❌ [PastEventCard] Failed to fetch user names:', error);
      }
    };

    fetchLatestUserNames();
  }, [event.hostId, event.hostPartnerId, event.applicantId, event.opponentPartnerId]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(activeLanguage === 'ko' ? 'ko-KR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getEventTypeEmoji = (type: string): string => {
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'lightning':
        return '⚡';
      case 'practice':
        return '🎾';
      case 'tournament':
        return '🏆';
      case 'meetup':
        return '👥'; // Match AppliedEventCard icon
      case 'match':
        return '🎾'; // Changed from 🎯 to 🎾 (pickleball ball)
      default:
        return '📅';
    }
  };

  const getEventTypeText = (type: string): string => {
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'lightning':
        return t('pastEventCard.eventTypes.lightning');
      case 'practice':
        return t('pastEventCard.eventTypes.practice');
      case 'tournament':
        return t('pastEventCard.eventTypes.tournament');
      case 'meetup':
        return t('pastEventCard.eventTypes.meetup');
      case 'match':
        return t('pastEventCard.eventTypes.match');
      default:
        return t('pastEventCard.eventTypes.default');
    }
  };

  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <Card.Content>
        {/* Event Header */}
        <View style={styles.header}>
          <View style={styles.typeTag}>
            <Text style={styles.typeEmoji}>{getEventTypeEmoji(event.type)}</Text>
            <Text style={styles.typeText}>{getEventTypeText(event.type)}</Text>
          </View>
          {event.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>{t('pastEventCard.completed')}</Text>
            </View>
          )}
        </View>

        {/* Event Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Club Name */}
        <Text style={styles.clubName}>{event.clubName}</Text>

        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons
              name='calendar-outline'
              size={16}
              color={currentTheme === 'dark' ? '#90CAF9' : '#1976d2'}
            />
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name='location-outline'
              size={16}
              color={currentTheme === 'dark' ? '#90CAF9' : '#1976d2'}
            />
            <Text style={styles.detailText}>
              {event.location}
              {event.distance !== null && ` • ${formatDistance(event.distance, userCountry, t)}`}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name='people-outline'
              size={16}
              color={currentTheme === 'dark' ? '#90CAF9' : '#1976d2'}
            />
            <Text style={styles.detailText}>
              {event.participants}/{event.maxParticipants} • {t('pastEventCard.level')}:{' '}
              {event.skillLevel}
            </Text>
          </View>
        </View>

        {/* 🎯 [KIM FIX] Match Result with Team List */}
        {event.matchResult &&
          event.matchResult.score?.finalScore &&
          (() => {
            // Determine if current user is on host team or challenger team
            const isUserOnHostTeam =
              currentUserId === event.hostId || currentUserId === event.hostPartnerId;
            const isHostWinner = event.matchResult.hostResult === 'win';
            const userIsWinner = isUserOnHostTeam ? isHostWinner : !isHostWinner;

            // 🎯 [KIM FIX] Build team names using userNameMap for latest names
            const isDoubles = event.gameType?.toLowerCase().includes('doubles');

            // 🎯 Use userNameMap for latest names (falls back to cached name if not loaded)
            const latestHostName =
              (event.hostId && userNameMap[event.hostId]) ||
              event.hostName ||
              t('pastEventCard.host');
            const latestHostPartnerName =
              (event.hostPartnerId && userNameMap[event.hostPartnerId]) || event.hostPartnerName;
            const latestApplicantName =
              (event.applicantId && userNameMap[event.applicantId]) ||
              event.applicantName ||
              t('pastEventCard.challenger');
            const latestOpponentPartnerName =
              (event.opponentPartnerId && userNameMap[event.opponentPartnerId]) ||
              event.opponentPartnerName;

            const hostTeamName =
              isDoubles && latestHostPartnerName
                ? `${latestHostName} & ${latestHostPartnerName}`
                : latestHostName;
            const challengerTeamName =
              isDoubles && latestOpponentPartnerName
                ? `${latestApplicantName} & ${latestOpponentPartnerName}`
                : latestApplicantName;

            // 🎯 [KIM FIX] Format score with tiebreak
            let displayScore = event.matchResult.score.finalScore;
            // 🔴 [HIGH] Check for retired (RET) or walkover (W.O.)
            const isRetiredOrWalkover =
              displayScore === 'RET' || displayScore === 'W.O.' || displayScore === 'W.O';

            if (
              !isRetiredOrWalkover &&
              event.matchResult.score.sets &&
              Array.isArray(event.matchResult.score.sets)
            ) {
              displayScore = event.matchResult.score.sets
                .map(set => {
                  let scoreStr = `${set.player1Games}-${set.player2Games}`;
                  if (
                    set.player1TiebreakPoints !== undefined ||
                    set.player2TiebreakPoints !== undefined
                  ) {
                    const tb1 = set.player1TiebreakPoints || 0;
                    const tb2 = set.player2TiebreakPoints || 0;
                    if (tb1 > 0 || tb2 > 0) {
                      scoreStr += `(${tb1}-${tb2})`;
                    }
                  }
                  return scoreStr;
                })
                .join(', ');
            }

            // 🔴 [HIGH] Transform RET/W.O. to translated text
            if (isRetiredOrWalkover) {
              displayScore =
                displayScore === 'RET'
                  ? t('pastEventCard.matchResult.retired')
                  : t('pastEventCard.matchResult.walkover');
            }

            const winBackgroundColor =
              currentTheme === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9';
            const lossBackgroundColor =
              currentTheme === 'dark' ? 'rgba(239, 83, 80, 0.15)' : '#FFEBEE';

            return (
              <View style={styles.matchResultSection}>
                {/* 🎯 Team List */}
                <View style={styles.teamListContainer}>
                  {/* Host Team */}
                  <View style={[styles.teamRow, isHostWinner && styles.winnerTeamRow]}>
                    {isHostWinner && (
                      <Ionicons
                        name='trophy'
                        size={14}
                        color='#4CAF50'
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text style={[styles.teamName, isHostWinner && styles.winnerTeamName]}>
                      {hostTeamName}
                    </Text>
                  </View>
                  <Text style={styles.vsText}>vs</Text>
                  {/* Challenger Team */}
                  <View style={[styles.teamRow, !isHostWinner && styles.winnerTeamRow]}>
                    {!isHostWinner && (
                      <Ionicons
                        name='trophy'
                        size={14}
                        color='#4CAF50'
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text style={[styles.teamName, !isHostWinner && styles.winnerTeamName]}>
                      {challengerTeamName}
                    </Text>
                  </View>
                </View>

                {/* Score Display */}
                <View
                  style={[
                    styles.matchResultCard,
                    { backgroundColor: userIsWinner ? winBackgroundColor : lossBackgroundColor },
                  ]}
                >
                  <Ionicons
                    name={userIsWinner ? 'trophy' : 'medal'}
                    size={20}
                    color={userIsWinner ? '#4CAF50' : '#EF5350'}
                  />
                  <Text
                    style={[
                      styles.matchResultLabel,
                      { color: userIsWinner ? '#4CAF50' : '#EF5350' },
                    ]}
                  >
                    {/* 🎯 [KIM FIX] 단식은 "나의 승리/상대의 승리", 복식은 "우리팀의 승리/상대팀의 승리" */}
                    {userIsWinner
                      ? isDoubles
                        ? t('pastEventCard.matchResult.ourTeamWon')
                        : t('pastEventCard.matchResult.iWon')
                      : isDoubles
                        ? t('pastEventCard.matchResult.opponentTeamWon')
                        : t('pastEventCard.matchResult.opponentWon')}
                  </Text>
                  <Text style={styles.scoreText}>{displayScore}</Text>
                </View>
              </View>
            );
          })()}

        {/* Action Buttons - Chat & Analyze */}
        <View style={styles.actionButtonContainer}>
          <View style={styles.actionButtonRow}>
            {/* Chat Button */}
            <TouchableOpacity
              style={[styles.chatButton, styles.actionButton]}
              onPress={() => onOpenChat?.(event.id, event.title)}
            >
              <View style={styles.chatButtonContent}>
                <Ionicons
                  name='chatbubble-outline'
                  size={16}
                  color={currentTheme === 'dark' ? '#64B5F6' : '#1976d2'}
                />
                <Text style={styles.chatButtonText}>{t('pastEventCard.chat')}</Text>
                {/* 💬 Unread Count Badge */}
                {localUnreadCount > 0 && (
                  <Badge
                    size={18}
                    style={{
                      marginLeft: 8,
                      backgroundColor: currentTheme === 'dark' ? '#EF5350' : '#f44336',
                      color: '#FFFFFF',
                    }}
                  >
                    {localUnreadCount}
                  </Badge>
                )}
              </View>
            </TouchableOpacity>

            {/* 🎾 Analyze Match Button - Only show if matchResult exists */}
            {event.matchResult && onAnalyzeMatch && (
              <TouchableOpacity
                style={[styles.analyzeButton, styles.actionButton]}
                onPress={() => onAnalyzeMatch(event)}
              >
                <View style={styles.chatButtonContent}>
                  <Ionicons
                    name='bar-chart-outline'
                    size={16}
                    color={currentTheme === 'dark' ? '#81C784' : '#388E3C'}
                  />
                  <Text style={styles.analyzeButtonText}>{t('pastEventCard.analyze')}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const createStyles = (colors: Record<string, string>, currentTheme: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    typeEmoji: {
      fontSize: 14,
      marginRight: 4,
    },
    typeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    completedBadge: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    completedText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    clubName: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },
    details: {
      gap: 8,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    matchResultSection: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
    },
    matchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    matchResultLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    // 🎯 [KIM FIX] Team list styles
    teamListContainer: {
      marginBottom: 12,
      alignItems: 'center',
    },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    winnerTeamRow: {
      // Winner highlight - no special background, just use text style
    },
    teamName: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    winnerTeamName: {
      fontWeight: '700',
      color: '#4CAF50',
    },
    vsText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginVertical: 2,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 'auto',
      color: colors.onSurface, // 🎯 [KIM FIX] Match score text color for dark mode
    },
    actionButtonContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
    },
    actionButtonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
    },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: currentTheme === 'dark' ? '#64B5F6' : '#1976d2',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    chatButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme === 'dark' ? '#64B5F6' : '#1976d2',
    },
    analyzeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: currentTheme === 'dark' ? '#81C784' : '#388E3C',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    analyzeButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme === 'dark' ? '#81C784' : '#388E3C',
    },
  });

export default PastEventCard;
