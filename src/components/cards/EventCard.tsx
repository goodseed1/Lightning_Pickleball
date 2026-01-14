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
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Card, Button, ProgressBar, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningTennisTheme } from '../../theme';
import { formatDistance } from '../../utils/unitUtils';
import { formatCompactScore } from '../../utils/scoreUtils';
import {
  isEventCompleted,
  validateScore,
  safeMatchResult,
  formatSmartSkillLevel,
} from '../../utils/dataUtils';
import { convertEloToLtr } from '../../utils/ltrUtils';
import InfoTag from '../common/InfoTag';
import StatIcon from '../common/StatIcon';
import StatusChip from '../common/StatusChip';
import { MatchScore } from '../../types/match';
import type { EventWithParticipation } from '../../types/activity';

// 🛡️ Type for events with result data
type EventCardData = {
  id: string;
  title: string;
  clubName: string;
  hostName?: string;
  date: Date;
  time: string;
  location: string;
  distance: number | null;
  participants: number;
  maxParticipants: number;
  skillLevel: string;
  type: 'lightning' | 'practice' | 'tournament' | 'meetup' | 'match';
  description?: string;
  hostId?: string;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  matchResult?: {
    score: MatchScore;
    hostResult: 'win' | 'loss';
    submittedAt: Date;
  };
};

interface EventCardProps {
  event: {
    id: string;
    title: string;
    clubName: string;
    hostName?: string; // 호스트 이름 (닉네임)
    date: Date;
    time: string;
    location: string;
    distance: number | null;
    participants: number;
    maxParticipants: number;
    skillLevel: string;
    type: 'lightning' | 'practice' | 'tournament' | 'meetup' | 'match';
    description?: string;
    hostId?: string; // 🎯 작전명 카멜레온 버튼: 호스트 ID 추가
    hostPartnerName?: string; // 🎯 호스트의 파트너 이름
    hostPartnerId?: string; // 🎯 호스트의 파트너 ID
    matchResult?: {
      score: MatchScore;
      hostResult: 'win' | 'loss';
      submittedAt: Date;
    };
    chatUnreadCount?: { [userId: string]: number }; // 🛡️ Badge UI: Unread count per user
    gameType?: string; // 🎯 Game type for partner selection (singles/doubles)
    // 🎯 [KIM FIX] 도전팀 정보
    challengerName?: string; // 도전팀 대표 이름
    challengerPartnerName?: string; // 도전팀 파트너 이름
    challengerId?: string; // 도전팀 대표 ID
    challengerPartnerId?: string; // 도전팀 파트너 ID
    isRecruitmentComplete?: boolean; // 모집 완료 여부
    partnerStatus?: 'pending' | 'accepted' | 'rejected'; // 🆕 [KIM] Partner invitation status
    partnerName?: string; // 🆕 [KIM] Invited partner name (for applicant's partner)
    // 🎯 [KIM FIX] NTRP info for display
    hostLtrLevel?: number; // Host's NTRP level
    minLtr?: number; // Minimum NTRP for application
    maxLtr?: number; // Maximum NTRP for application
    // ⚡ [QUICK MATCH] Quick match specific fields
    status?:
      | 'pending_acceptance'
      | 'recruiting'
      | 'upcoming'
      | 'scheduled'
      | 'confirmed'
      | 'in_progress'
      | 'completed'
      | 'cancelled';
    // 🆕 [3개월 규칙] Ranked match flag
    isRankedMatch?: boolean; // false = 친선경기 (기록에 반영 안됨)
    cooldownWarning?: string; // 친선경기 사유
  };
  applicationStatus?:
    | 'not_applied'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'declined'
    | 'cancelled';
  individualApplicantsCount?: number; // 🎯 Stage 2B: Individual applicants waiting count
  onPress: () => void;
  onApply?: (needsPartner: boolean) => void; // 🎯 Modified to pass doubles flag
  onApplySolo?: () => void; // 🎯 [OPERATION SOLO LOBBY - PHASE 5] Individual application handler
  onCancelApplication?: () => void; // 🛡️ Captain America: Dedicated cancel handler for applicants
  onChat?: () => void; // 💥 호스트 이벤트용 대화방 핸들러
  onCancel?: () => void; // 🎯 공용 번개 매치용 취소 핸들러
  onRecordScore?: () => void; // 🏆 점수 입력 핸들러
  onPlayerPress?: (playerId: string) => void; // 🎯 선수 프로필 보기 핸들러
  onSetLocationTime?: (eventId: string) => void; // ⚡ 퀵 매치 장소/시간 설정 핸들러
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  applicationStatus = 'not_applied',
  individualApplicantsCount = 0,
  onPress,
  onApply,
  onApplySolo,
  onCancelApplication,
  onChat,
  onCancel,
  onRecordScore,
  onPlayerPress,
  onSetLocationTime,
}) => {
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(
    themeColors.colors as unknown as Record<string, string>,
    currentTheme
  );

  // 🎯 [KIM FIX] State for host partner's LTR (for doubles combined LTR display)
  const [hostPartnerLtrLevel, setHostPartnerLtrLevel] = useState<number | null>(null);

  // 🎯 [KIM FIX] Fetch host partner's LTR for doubles matches
  useEffect(() => {
    const isDoubles = event.gameType?.toLowerCase().includes('doubles');

    // Only fetch if doubles match AND has host partner
    if (!isDoubles || !event.hostPartnerId) {
      setHostPartnerLtrLevel(null);
      return;
    }

    // Subscribe to host partner's user document
    const unsubscribe = onSnapshot(
      doc(db, 'users', event.hostPartnerId),
      snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();

          // 🎯 [KIM FIX v26] 게임 타입에 따라 올바른 ELO 선택 (Single Source of Truth)
          // - mixed_doubles → mixed ELO
          // - mens_doubles / womens_doubles → doubles ELO
          let partnerElo: number | null = null;
          const gameType = event.gameType?.toLowerCase() || '';

          if (gameType === 'mixed_doubles') {
            // 혼합복식: mixed ELO 사용
            partnerElo = userData.eloRatings?.mixed?.current || null;
          } else if (gameType.includes('doubles')) {
            // 일반복식: doubles ELO 사용
            partnerElo = userData.eloRatings?.doubles?.current || null;
          }

          // Fallback: doubles → singles ELO (게임 타입별 ELO가 없는 경우)
          if (!partnerElo || partnerElo <= 0) {
            partnerElo =
              userData.eloRatings?.doubles?.current ||
              userData.eloRatings?.singles?.current ||
              null;
          }

          if (partnerElo && partnerElo > 0) {
            const ltr = convertEloToLtr(partnerElo);
            setHostPartnerLtrLevel(ltr);
          } else {
            // Default LTR if no ELO found
            setHostPartnerLtrLevel(null);
          }
        }
      },
      error => {
        console.warn('[EventCard] Error fetching host partner LTR:', error);
        setHostPartnerLtrLevel(null);
      }
    );

    return () => unsubscribe();
  }, [event.hostPartnerId, event.gameType]);

  // Get user's country for distance formatting
  const userCountry = currentUser?.profile?.location?.country;

  // 🎯 [KIM FIX] Calculate current user's NTRP and check if they can apply
  const getUserNtrp = (): number | null => {
    if (!currentUser) return null;

    // 🎯 [KIM FIX v25] Type assertion for accessing ELO data - use eloRatings only (Single Source of Truth)
    const userAny = currentUser as unknown as Record<string, unknown>;
    const eloRatings = userAny.eloRatings as
      | {
          singles?: { current?: number };
          doubles?: { current?: number };
          mixed?: { current?: number };
        }
      | undefined;

    // Get ELO based on game type (if available)
    const gameType = event.gameType?.toLowerCase() || '';
    let targetElo: number | null = null;

    if (gameType.includes('singles')) {
      targetElo = eloRatings?.singles?.current || null;
    } else if (gameType.includes('doubles') && !gameType.includes('mixed')) {
      targetElo = eloRatings?.doubles?.current || null;
    } else if (gameType.includes('mixed')) {
      targetElo = eloRatings?.mixed?.current || null;
    } else {
      // Fallback: use highest ELO
      const singlesElo = eloRatings?.singles?.current || null;
      const doublesElo = eloRatings?.doubles?.current || null;
      const mixedElo = eloRatings?.mixed?.current || null;
      const eloValues = [singlesElo, doublesElo, mixedElo].filter(
        (elo): elo is number => elo !== null && elo > 0
      );
      if (eloValues.length > 0) {
        targetElo = Math.max(...eloValues);
      }
    }

    if (targetElo && targetElo > 0) {
      return convertEloToLtr(targetElo);
    }

    return null;
  };

  const userLtr = getUserNtrp(); // Returns LTR (1-10) now
  const canApplyByNtrp = (): { canApply: boolean; reason?: string } => {
    // If no LTR requirements, allow
    if (!event.minLtr && !event.maxLtr) {
      return { canApply: true };
    }

    // If user has no LTR, allow (new users)
    if (userLtr === null) {
      return { canApply: true };
    }

    const minLtr = event.minLtr || 0;
    const maxLtr = event.maxLtr || 10;

    // 🎯 [2025.01 RULE CHANGE] LTR tolerance varies by game type:
    // - Doubles/Mixed: ±2 (more relaxed for team play) - uses TEAM LTR
    // - Singles: 0~+1 only (user can only apply if same level or 1 level below host)
    const gameType = event.gameType?.toLowerCase() || '';
    const isSingles = gameType.includes('singles');
    const isDoubles = gameType.includes('doubles') || gameType.includes('mixed');

    // 🎯 [KIM FIX v27] For doubles, use TEAM LTR (host + partner), not individual host LTR
    let hostLtr: number;
    if (isDoubles && event.hostLtrLevel && hostPartnerLtrLevel) {
      // Doubles with partner: use team LTR
      hostLtr = Math.round(event.hostLtrLevel) + Math.round(hostPartnerLtrLevel);
      console.log(
        `🎾 [EventCard] Doubles Team LTR: ${event.hostLtrLevel} + ${hostPartnerLtrLevel} = ${hostLtr}`
      );
    } else {
      // Singles or doubles without partner yet: use individual host LTR
      const rawHostLtr = event.hostLtrLevel || (minLtr + maxLtr) / 2;
      hostLtr = Math.round(rawHostLtr);
    }
    const roundedUserLtr = Math.round(userLtr); // Round user LTR too for fair comparison

    // Calculate allowed range based on game type
    let minAllowed: number;
    let maxAllowed: number;

    if (isSingles) {
      // 🎯 [LTR FIX v6] Singles: Use stored minLtr/maxLtr (hostLtr ± 1)
      // CreateEventForm stores the correct range in Firestore
      minAllowed = Math.round(minLtr);
      maxAllowed = Math.round(maxLtr);
    } else {
      // 🎯 [KIM FIX v28] Doubles/Mixed: 개인 LTR이 호스트 팀 LTR보다 크지 않으면 신청 가능
      // 하한선 없음 - 파트너 초대 시 팀 LTR 범위로 필터링됨
      // 상한선 = 호스트 팀 LTR (개인이 호스트 팀보다 높으면 불가)
      minAllowed = 1; // 최소 LTR (하한선 없음)
      maxAllowed = hostLtr; // 호스트 팀 LTR이 상한선
    }

    // 🔍 [DEBUG] Log LTR comparison for debugging
    console.log(`[EventCard] 🎾 LTR Check for "${event.title}":`, {
      userLtr,
      roundedUserLtr,
      hostLtr,
      hostPartnerLtrLevel,
      isTeamLtr: isDoubles && event.hostLtrLevel && hostPartnerLtrLevel,
      gameType,
      isSingles,
      isDoubles,
      minAllowed,
      maxAllowed,
      canApply: roundedUserLtr >= minAllowed && roundedUserLtr <= maxAllowed,
    });

    // 🎯 [2025.01 RULE CHANGE] Check if user LTR is within allowed range
    if (roundedUserLtr < minAllowed || roundedUserLtr > maxAllowed) {
      return {
        canApply: false,
        reason: t('eventCard.requirements.levelMismatch', {
          userLtr: roundedUserLtr,
          minLtr: minAllowed,
          maxLtr: maxAllowed,
        }),
      };
    }

    return { canApply: true };
  };

  // 🎯 [GENDER RESTRICTION] Check if user's gender matches the match type
  const canApplyByGender = (): { canApply: boolean; reason?: string } => {
    const gameType = event.gameType?.toLowerCase() || '';

    // Mixed doubles: anyone can apply
    if (gameType.includes('mixed')) {
      return { canApply: true };
    }

    // Get user's gender
    const userGender = currentUser?.profile?.gender;

    // If no gender set or no game type restriction, allow
    if (!userGender || !gameType) {
      return { canApply: true };
    }

    // Check gender match for singles and doubles (excluding mixed)
    // 🎯 [KIM FIX v30] Use startsWith to properly distinguish mens_ from womens_
    // Note: 'womens_doubles'.includes('mens_') is still TRUE! (substring at position 2)
    const isMensMatch = gameType.startsWith('mens_') || gameType.startsWith('men_');
    const isWomensMatch = gameType.startsWith('womens_') || gameType.startsWith('women_');

    if (isMensMatch && userGender !== 'male') {
      return {
        canApply: false,
        reason: t('eventCard.requirements.menOnly'),
      };
    }

    if (isWomensMatch && userGender !== 'female') {
      return {
        canApply: false,
        reason: t('eventCard.requirements.womenOnly'),
      };
    }

    return { canApply: true };
  };

  const ntrpEligibility = canApplyByNtrp();
  const genderEligibility = canApplyByGender();

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const locale = t('common.locale'); // Gets 'ko-KR' or 'en-US' from locale file
    return date.toLocaleDateString(locale, options);
  };

  const getEventTypeLabel = (type: string): string => {
    // Convert type to lowercase for case-insensitive matching
    const normalizedType = type?.toLowerCase() || '';

    // Map types to translation keys
    const typeKeyMap: { [key: string]: string } = {
      match: 'match',
      practice: 'practice',
      tournament: 'tournament',
      lightning: 'lightning',
      meetup: 'meetup',
      casual: 'casual',
      ranked: 'ranked',
    };

    const translationKey = typeKeyMap[normalizedType];

    if (translationKey) {
      return t(`eventCard.eventTypes.${translationKey}`);
    }

    // Return the mapped label or fallback to original type with proper capitalization
    return type
      ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
      : t('eventCard.eventTypes.general');
  };

  // 🔍 디버그: 전체 이벤트 데이터 확인
  console.log('🏆 [EventCard] Complete event data for', event.title || event.id, ':', {
    eventId: event.id,
    title: event.title,
    hasMatchResult: !!event.matchResult,
    matchResult: event.matchResult,
    hostId: event.hostId,
    currentUserId: currentUser?.uid,
    participants: event.participants,
    maxParticipants: event.maxParticipants,
    // 🧪 Test-specific debugging for score synchronization
    testData: {
      isTestEvent: event.id === 'PG4ZjAIqZlVclqmbLzXG', // 번매6 event
      hasResultField: 'result' in event,
      resultField: (event as Record<string, unknown>).result,
      scoreField: (event as Record<string, unknown>).score,
      statusField: event.status,
    },
    // 모든 이벤트 속성 출력
    allEventProps: Object.keys(event),
  });

  const getApplicationStatusChip = () => {
    switch (applicationStatus) {
      case 'pending':
        // 🎯 [KIM FIX] 파트너가 거절한 경우, null 반환 (게임타입 배지는 이제 headerContent에서 표시)
        if (event.partnerStatus === 'rejected') {
          return null;
        }
        return <StatusChip text={t('eventCard.status.pending')} variant='warning' icon='time' />;
      case 'approved':
        return (
          <StatusChip
            text={t('eventCard.status.approved')}
            variant='success'
            icon='checkmark-circle'
          />
        );
      case 'rejected':
        return (
          <StatusChip text={t('eventCard.status.rejected')} variant='error' icon='close-circle' />
        );
      case 'cancelled':
        return (
          <StatusChip
            text={t('eventCard.status.cancelled')}
            variant='default'
            icon='close-circle'
          />
        );
      default: {
        // 🎯 [2026-01-12] Game type badge now shown in headerContent, not here
        // Return null for not_applied status (no status chip needed)
        return null;
      }
    }
  };

  // 🆕 [KIM] Partner status chip for applicants who invited a partner
  const getPartnerStatusChip = () => {
    // Only show if this user has a pending partner invitation
    if (!event.partnerStatus || event.partnerStatus === 'accepted') {
      return null;
    }

    if (event.partnerStatus === 'pending') {
      return (
        <StatusChip
          text={t('eventCard.partnerStatus.partnerPending')}
          variant='warning'
          icon='hourglass'
        />
      );
    }

    if (event.partnerStatus === 'rejected') {
      return (
        <StatusChip
          text={t('eventCard.partnerStatus.partnerDeclined')}
          variant='error'
          icon='close-circle'
        />
      );
    }

    return null;
  };

  const getEventTypeEmoji = (type: string): string => {
    const normalizedType = type?.toLowerCase() || '';
    console.log(
      `🎯 [EventCard] getEventTypeEmoji called - event.title: "${event.title}", type: "${type}", normalizedType: "${normalizedType}"`
    );
    switch (normalizedType) {
      case 'lightning':
        return '⚡';
      case 'practice':
        return '👥'; // 🔄 Changed from 🎾 to 👥 for casual meetups
      case 'tournament':
        return '🏆';
      case 'match':
        return '🎾';
      case 'meetup':
        return '👥';
      case 'casual':
        return '😊';
      case 'ranked':
        return '🏆';
      default:
        return '🎾';
    }
  };

  // 🎯 Phase 4: Get match type label with emoji (남자 단식, 여자 복식 등)
  const getMatchTypeLabel = (gameType?: string): { emoji: string; label: string } | null => {
    if (!gameType) return null;

    const normalizedType = gameType.toLowerCase();
    const matchTypes: { [key: string]: { emoji: string; key: string } } = {
      mens_singles: { emoji: '🎾', key: 'mensSingles' },
      womens_singles: { emoji: '🎾', key: 'womensSingles' },
      mens_doubles: { emoji: '👥', key: 'mensDoubles' },
      womens_doubles: { emoji: '👯', key: 'womensDoubles' },
      mixed_doubles: { emoji: '👫', key: 'mixedDoubles' },
    };

    const matchType = matchTypes[normalizedType];
    if (!matchType) return null;

    return {
      emoji: matchType.emoji,
      label: t(`eventCard.matchType.${matchType.key}`),
    };
  };

  // 🎯 작전명 카멜레온 버튼: 사용자 역할 분석
  const getUserRole = (): 'host' | 'applicant' | 'none' => {
    // 호스트 확인
    if (event.hostId && currentUser?.uid === event.hostId) {
      return 'host';
    }

    // 거절/취소된 신청은 'none'으로 처리 (재신청 가능)
    if (
      applicationStatus === 'declined' ||
      applicationStatus === 'rejected' ||
      applicationStatus === 'cancelled'
    ) {
      return 'none';
    }

    // 🎯 [KIM FIX] 파트너가 거절한 경우도 'none'으로 처리 (재신청 가능)
    if (event.partnerStatus === 'rejected') {
      return 'none';
    }

    // 활성 신청자 확인 (pending, approved)
    if (applicationStatus !== 'not_applied') {
      return 'applicant';
    }

    return 'none';
  };

  const getContextualButton = () => {
    const userRole = getUserRole();

    console.log(`🎯 EventCard: User role for event ${event.title}: ${userRole}`, {
      eventId: event.id,
      eventHostId: event.hostId,
      currentUserId: currentUser?.uid,
      applicationStatus,
    });

    // 🎯 공용 번개 매치: 역할별 버튼 렌더링
    switch (userRole) {
      case 'host': {
        const isFullCapacity = event.participants >= event.maxParticipants;
        const eventWithResult = event as EventCardData & {
          score?: MatchScore;
          matchResult?: {
            score: MatchScore;
            hostResult: 'win' | 'loss';
            submittedAt: Date;
          };
        };
        const hasMatchResult = !!event.matchResult;
        const hasScore = !!eventWithResult.score;
        const hasAnyResult = hasMatchResult || hasScore;

        // ⚡ Quick Match: Check if location/time needs to be set
        const needsLocationTime =
          event.status === 'recruiting' && event.location === 'TBD' && onSetLocationTime;

        console.log('🔍 [HOST RESULT DEBUG] Host button logic:', {
          eventId: event.id,
          hasMatchResult,
          hasScore,
          hasAnyResult,
          matchResult: event.matchResult,
          score: eventWithResult.score,
          isFullCapacity,
          participants: event.participants,
          maxParticipants: event.maxParticipants,
          onRecordScore: !!onRecordScore,
          onCancel: !!onCancel,
          shouldShowRecordScoreButton: isFullCapacity && !hasAnyResult && !!onRecordScore,
          shouldShowCancelButton: !hasAnyResult && !!onCancel,
        });

        return (
          <View style={styles.hostButtonContainer}>
            {/* ⚡ 장소/시간 설정 버튼 - recruiting 상태이고 location이 TBD인 경우만 (호스트만!) */}
            {needsLocationTime && (
              <Button
                mode='contained'
                onPress={() => {
                  console.log('EventCard: Set location/time button pressed for event:', event.id);
                  onSetLocationTime(event.id);
                }}
                style={[styles.hostButton, styles.locationTimeButton]}
                labelStyle={styles.locationTimeButtonLabel}
                compact
                icon='location'
              >
                {t('eventCard.buttons.setLocation')}
              </Button>
            )}

            {/* Cancel 버튼 - 점수 입력 전에만 표시 */}
            {!hasAnyResult && onCancel && (
              <Button
                mode='outlined'
                onPress={() => {
                  console.log('EventCard: Cancel button pressed for host event:', event.id);
                  onCancel();
                }}
                style={styles.hostButton}
                labelStyle={styles.hostButtonLabel}
                compact
                icon='close-circle'
              >
                {t('event.cancelEvent')}
              </Button>
            )}

            {/* Score 버튼 - 만석이고 점수 미입력시에만 표시 (친선경기는 제외) */}
            {isFullCapacity && !hasAnyResult && onRecordScore && event.isRankedMatch !== false && (
              <Button
                mode='outlined'
                onPress={() => {
                  console.log('EventCard: Record score button pressed for host event:', event.id);
                  onRecordScore();
                }}
                style={styles.hostButton}
                labelStyle={styles.hostButtonLabel}
                compact
                icon='trophy'
              >
                {t('event.recordScore')}
              </Button>
            )}

            {/* 점수 표시 - 점수가 제출된 경우 */}
            {(() => {
              console.log('🔍 [HOST SCORE DISPLAY DEBUG] Checking score display conditions:', {
                eventId: event.id,
                hasMatchResult: !!event.matchResult,
                hasScore: !!eventWithResult.score,
                matchResult: event.matchResult,
                score: eventWithResult.score,
                shouldDisplayScore: !!(event.matchResult || eventWithResult.score),
              });

              if (!(event.matchResult || eventWithResult.score)) {
                console.log('🚫 [HOST SCORE DISPLAY] No score data to display');
                return null;
              }

              // Use matchResult if available, otherwise transform score
              const matchData =
                event.matchResult ||
                (eventWithResult.score && {
                  score: eventWithResult.score,
                  hostResult:
                    (eventWithResult.score as MatchScore)?._winner === 'player1'
                      ? ('win' as const)
                      : ('loss' as const),
                  submittedAt: new Date(),
                });

              if (!matchData) {
                console.log('🚫 [HOST SCORE DISPLAY] matchData is null');
                return null;
              }

              console.log('✅ [HOST SCORE DISPLAY] Displaying score with matchData:', matchData);

              // Handle both string and object score formats
              const scoreText =
                typeof matchData.score === 'string'
                  ? matchData.score
                  : formatCompactScore(matchData.score);

              // Theme-aware background colors
              const lossBackgroundColor = currentTheme === 'dark' ? '#CC5555' : '#FF7777';
              const winBackgroundColor = '#E8F5E8';

              console.log('🎾 [EventCard] Score & Theme Debug:', {
                eventId: event.id,
                scoreText,
                scoreData: matchData.score,
                scoreDataType: typeof matchData.score,
                hasScore: !!scoreText,
                currentTheme,
                lossBackgroundColor,
                hostResult: matchData.hostResult,
              });

              return (
                <View style={styles.matchResultContainer}>
                  <View
                    style={[
                      styles.matchResultCard,
                      matchData.hostResult === 'win' ? styles.winCard : styles.lossCard,
                      {
                        backgroundColor:
                          matchData.hostResult === 'win' ? winBackgroundColor : lossBackgroundColor,
                      },
                    ]}
                  >
                    <Ionicons
                      name={matchData.hostResult === 'win' ? 'trophy' : 'medal'}
                      size={16}
                      color={matchData.hostResult === 'win' ? '#4CAF50' : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.resultText,
                        matchData.hostResult === 'win' ? styles.winText : styles.lossText,
                        {
                          color: matchData.hostResult === 'loss' ? '#FFFFFF' : undefined,
                        },
                      ]}
                    >
                      {matchData.hostResult === 'win'
                        ? t('eventCard.results.win')
                        : t('eventCard.results.loss')}
                    </Text>
                    <Text
                      style={[
                        styles.scoreText,
                        styles.scoreInline,
                        {
                          color: matchData.hostResult === 'loss' ? '#FFFFFF' : undefined,
                        },
                      ]}
                    >
                      {scoreText || t('eventCard.results.noScore')}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Chat 버튼 - 항상 표시 */}
            {onChat && (
              <Button
                mode='outlined'
                onPress={() => {
                  console.log('EventCard: Chat button pressed for host event:', event.id);
                  onChat();
                }}
                style={styles.hostButton}
                labelStyle={styles.hostButtonLabel}
                compact
                icon='chat'
              >
                {t('eventCard.buttons.chat')}
              </Button>
            )}
          </View>
        );
      }

      case 'applicant': {
        // 🎯 Operation: Quarantine Expansion - Enhanced completion detection with proper matchResult handling
        const eventWithResult = event as EventCardData & {
          matchResult?: {
            score: MatchScore;
            hostResult: 'win' | 'loss';
            submittedAt: Date;
          };
          score?: MatchScore;
        };
        // 🔧 FIX: Use same data access pattern as host case
        const hasMatchResult = !!event.matchResult; // Changed from eventWithResult.matchResult to event.matchResult
        const hasScore = !!eventWithResult.score;
        const hasAnyResult = hasMatchResult || hasScore; // 🎾 Match host case logic

        // 🛡️ Operation: Quarantine Expansion - Use unified completion detection
        const isCompleted = isEventCompleted(event as unknown as Partial<EventWithParticipation>);

        // 🛡️ Additional validation using unified utilities
        const hasValidScore = validateScore(eventWithResult.score as unknown);
        const hasValidMatchResult = !!safeMatchResult(eventWithResult.matchResult as unknown);

        console.log('🔍 [APPLICANT RESULT DEBUG] Applicant button logic:', {
          eventId: event.id,
          eventTitle: event.title,
          hasMatchResult,
          hasScore,
          hasAnyResult,
          matchResult: event.matchResult, // 🔧 FIX: Use same data access as host case
          score: eventWithResult.score,
          scoreWinner: eventWithResult.score?._winner,
          status: event.status,
          isCompleted,
          shouldDisplayScore: hasAnyResult && (event.matchResult || eventWithResult.score),
          // 🔍 Enhanced completion detection analysis
          completionAnalysis: {
            isEventCompleted: isCompleted,
            statusCompleted: event.status === 'completed',
            hasValidMatchResult,
            hasValidScore,
          },
        });

        return (
          <View style={styles.footer}>
            {/* 🏆 Match Result Display for Applicants - Show if ANY result data exists (matches host logic) */}
            {hasAnyResult &&
              (event.matchResult || eventWithResult.score) && // 🔧 FIX: Use same data access as host case
              (() => {
                // 🛡️ Use same match data extraction logic as host case
                const matchData =
                  event.matchResult || // 🔧 FIX: Use same data access as host case
                  (eventWithResult.score && {
                    score: eventWithResult.score,
                    hostResult:
                      (eventWithResult.score as MatchScore)?._winner === 'player1'
                        ? ('win' as const)
                        : ('loss' as const),
                    submittedAt: new Date(),
                  });

                if (!matchData) return null as React.ReactNode;

                // 🛡️ Safe score formatting with multiple format support (same as host)
                const scoreText =
                  typeof matchData.score === 'string'
                    ? matchData.score
                    : formatCompactScore(matchData.score);

                // 🎯 [KIM FIX] Determine participant result
                // Host partner should have SAME result as host, not inverted
                const isHostPartner = currentUser?.uid === event.hostPartnerId;
                const participantResult = isHostPartner
                  ? matchData.hostResult // Host partner: same as host
                  : matchData.hostResult === 'win'
                    ? 'loss'
                    : 'win'; // Opponent: inverted

                // 🎨 Theme-aware background colors (same as host)
                const winBackgroundColor = '#E8F5E8';
                const lossBackgroundColor = currentTheme === 'dark' ? '#CC5555' : '#FF7777';

                console.log('🎾 [EventCard] Applicant Score & Theme Debug:', {
                  eventId: event.id,
                  scoreText,
                  scoreData: matchData.score,
                  scoreDataType: typeof matchData.score,
                  hasScore: !!scoreText,
                  currentTheme,
                  lossBackgroundColor,
                  hostResult: matchData.hostResult,
                  isHostPartner, // 🎯 [KIM FIX] Host partner check
                  participantResult, // 🎯 Key difference from host (unless host partner)
                });

                return (
                  <View style={styles.matchResultContainer}>
                    <View
                      style={[
                        styles.matchResultCard,
                        participantResult === 'win' ? styles.winCard : styles.lossCard,
                        {
                          backgroundColor:
                            participantResult === 'win' ? winBackgroundColor : lossBackgroundColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name={participantResult === 'win' ? 'trophy' : 'medal'}
                        size={16}
                        color={participantResult === 'win' ? '#4CAF50' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.resultText,
                          participantResult === 'win' ? styles.winText : styles.lossText,
                          {
                            color: participantResult === 'loss' ? '#FFFFFF' : undefined,
                          },
                        ]}
                      >
                        {participantResult === 'win'
                          ? t('eventCard.results.win')
                          : t('eventCard.results.loss')}
                      </Text>
                      <Text
                        style={[
                          styles.scoreText,
                          styles.scoreInline,
                          {
                            color: participantResult === 'loss' ? '#FFFFFF' : undefined,
                          },
                        ]}
                      >
                        {scoreText || t('eventCard.results.noScore')}
                      </Text>
                    </View>
                  </View>
                );
              })()}

            {/* 💬 Chat button - always available with Badge UI */}
            {onChat &&
              (() => {
                const unreadCount =
                  (currentUser?.uid && event.chatUnreadCount?.[currentUser.uid]) || 0;

                // 🔍 DEBUG: Badge 렌더링 디버깅
                console.log('🔍 [EventCard] Badge DEBUG:', {
                  eventTitle: event.title,
                  currentUserId: currentUser?.uid,
                  chatUnreadCount: event.chatUnreadCount,
                  unreadCountForUser: event.chatUnreadCount?.[currentUser?.uid || ''],
                  calculatedUnreadCount: unreadCount,
                  willShowBadge: unreadCount > 0,
                });

                return (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.chatButton]}
                    onPress={() => {
                      console.log('EventCard: Chat button pressed for applied event:', event.id);
                      onChat();
                    }}
                  >
                    <Ionicons
                      name='chatbubble-outline'
                      size={16}
                      color={currentTheme === 'dark' ? '#64B5F6' : '#1976d2'}
                    />
                    <Text style={styles.chatButtonText}>{t('eventCard.buttons.chat')}</Text>
                    {unreadCount > 0 && (
                      <Badge
                        size={18}
                        style={{
                          marginLeft: 8,
                          backgroundColor: themeColors.colors.error,
                          color: '#FFFFFF', // 🎯 White text for visibility
                        }}
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </TouchableOpacity>
                );
              })()}

            {/* 🎯 Cancel button - only for incomplete events without results */}
            {!isCompleted && !hasAnyResult && onCancelApplication && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  console.log('EventCard: 신청 취소 button pressed for applied event:', event.id);
                  onCancelApplication();
                }}
              >
                <Ionicons
                  name='close-circle-outline'
                  size={16}
                  color={currentTheme === 'dark' ? '#EF5350' : '#f44336'}
                />
                <Text style={styles.cancelButtonText}>{t('eventCard.buttons.cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      case 'none':
      default: {
        // 🎯 Check if it's a doubles match
        const isDoubles = event.gameType?.toLowerCase().includes('doubles') || false;

        // 🎯 마감된 이벤트 타입 정의
        type EventWithScore = EventCardData & {
          score?: MatchScore;
          matchResult?: {
            score: MatchScore;
            hostResult: 'win' | 'loss';
            submittedAt: Date;
          };
        };

        // 🎯 Team application handler (현재 구현 완료)
        const handleTeamApply = () => {
          // 🛡️ 마감된 이벤트는 신청 불가
          if (isFull) {
            console.log('EventCard: Cannot apply - event is full');
            return;
          }
          console.log('EventCard: Team apply button pressed for event:', event.id);
          console.log('EventCard: Game type check:', { gameType: event.gameType, isDoubles });

          if (onApply) {
            console.log('EventCard: Calling onApply handler with needsPartner: true');
            onApply(true); // Always pass true for team application
          } else if (onPress) {
            console.log('EventCard: Calling onPress handler as fallback');
            onPress();
          } else {
            console.warn('EventCard: No handler provided for team apply button');
          }
        };

        // 🎯 [OPERATION SOLO LOBBY - PHASE 5] Individual application handler (복식용)
        const handleIndividualApply = () => {
          // 🛡️ 마감된 이벤트는 신청 불가
          if (isFull) {
            console.log('EventCard: Cannot apply - event is full');
            return;
          }
          console.log('EventCard: Individual apply button pressed for event:', event.id);
          console.log('EventCard: Game type check:', { gameType: event.gameType, isDoubles });

          if (onApplySolo) {
            console.log('EventCard: Calling onApplySolo handler');
            onApplySolo();
          } else if (onPress) {
            console.log('EventCard: Calling onPress handler as fallback');
            onPress();
          } else {
            console.warn('EventCard: No handler provided for individual apply button');
          }
        };

        // 🎯 [KIM FIX] 단식 신청 핸들러 - onApply(false) 사용
        const handleSinglesApply = () => {
          // 🛡️ 마감된 이벤트는 신청 불가
          if (isFull) {
            console.log('EventCard: Cannot apply - event is full');
            return;
          }
          console.log('EventCard: Singles apply button pressed for event:', event.id);

          // 🎯 [KIM FIX] 단식은 onApply(false) 사용 - onPress는 네비게이션용
          if (onApply) {
            console.log('EventCard: Calling onApply handler for singles match');
            onApply(false); // needsPartner = false for singles
          } else {
            console.warn('EventCard: No handler provided for singles apply button');
          }
        };

        // 🎯 마감된 이벤트: 완료된 경기면 점수 표시, 아니면 마감 상태 표시
        if (isFull) {
          const eventWithResult = event as EventWithScore;
          const hasMatchResult = !!event.matchResult;
          const hasScore = !!eventWithResult.score;
          const hasAnyResult = hasMatchResult || hasScore;

          // 🎯 [KIM FIX] 완료된 경기: 제3자에게 점수와 승자 표시
          if (hasAnyResult && (event.matchResult || eventWithResult.score)) {
            const matchData =
              event.matchResult ||
              (eventWithResult.score && {
                score: eventWithResult.score,
                hostResult:
                  (eventWithResult.score as MatchScore)?._winner === 'player1'
                    ? ('win' as const)
                    : ('loss' as const),
                submittedAt: new Date(),
              });

            if (matchData) {
              const scoreText =
                typeof matchData.score === 'string'
                  ? matchData.score
                  : formatCompactScore(matchData.score);

              // 🎯 제3자 뷰: 호스트팀 승/패 기준으로 표시
              const hostWon = matchData.hostResult === 'win';
              const winnerTeam = hostWon
                ? t('eventCard.results.hostTeamWins')
                : t('eventCard.results.guestTeamWins');

              return (
                <View style={styles.footer}>
                  <View style={styles.spectatorResultContainer}>
                    <View style={styles.spectatorResultCard}>
                      <Ionicons name='trophy' size={16} color='#FFD700' />
                      <Text style={styles.spectatorWinnerText}>{winnerTeam}</Text>
                      <Text style={styles.spectatorScoreText}>
                        {scoreText || t('eventCard.results.noScore')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }
          }

          // 아직 점수가 없는 마감 이벤트
          return (
            <View style={styles.footer}>
              <View style={[styles.actionButton, styles.closedEventButton]}>
                <Ionicons name='lock-closed' size={16} color='#888' />
                <Text style={styles.closedEventButtonText}>
                  {t('eventCard.buttons.registrationClosed')}
                </Text>
              </View>
            </View>
          );
        }

        // 🎯 [KIM FIX] 단식(singles)인지 확인 - 단식은 개인 신청만 가능
        const isSinglesMatch =
          event.gameType?.toLowerCase().includes('singles') ||
          event.gameType?.toLowerCase().includes('단식');

        // 🎯 [KIM FIX] meetup(번개 모임)인지 확인 - meetup은 팀 개념 없이 참가 신청만
        const isMeetup = event.type?.toLowerCase() === 'meetup';

        // 단식 경기 또는 번개 모임: "참가 신청" 버튼 하나만 표시
        if (isSinglesMatch || isMeetup) {
          // 🎯 [KIM FIX] NTRP/성별 요건 미충족 시 비활성화
          const isNtrpBlocked = !ntrpEligibility.canApply;
          const isGenderBlocked = !genderEligibility.canApply;
          const isBlocked = isNtrpBlocked || isGenderBlocked;
          const blockedReason = isGenderBlocked
            ? t('eventCard.requirements.genderMismatch')
            : 'Level Mismatch'; // TODO: Add levelMismatch key to locale files

          return (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.singlesApplyButton,
                  isBlocked && styles.disabledButton,
                ]}
                onPress={isBlocked ? undefined : handleSinglesApply}
                disabled={isBlocked}
              >
                <Ionicons
                  name={
                    isBlocked ? 'close-circle' : isMeetup ? 'people-outline' : 'tennisball-outline'
                  }
                  size={16}
                  color={isBlocked ? '#9CA3AF' : currentTheme === 'dark' ? '#4CAF50' : '#2E7D32'}
                />
                <Text
                  style={[styles.singlesApplyButtonText, isBlocked && styles.disabledButtonText]}
                >
                  {isBlocked ? blockedReason : t('eventCard.buttons.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }

        // 복식 경기: 팀/개인 선택 가능
        // 🎯 [KIM FIX] NTRP/성별 요건 미충족 시 비활성화
        const isBlocked = !ntrpEligibility.canApply || !genderEligibility.canApply;

        return (
          <View style={styles.footer}>
            {/* 🎯 [OPERATION SOLO LOBBY - PHASE 5] 솔로 신청자 수 표시 */}
            {individualApplicantsCount > 0 && (
              <View style={styles.soloApplicantsCountContainer}>
                <Ionicons name='people' size={14} color='#FF9800' />
                <Text style={styles.soloApplicantsCountText}>
                  {t('eventCard.soloApplicants.count', { count: individualApplicantsCount })}
                </Text>
              </View>
            )}

            {/* 🎯 [KIM FIX] NTRP/성별 불일치 시 버튼 비활성화만 - 상단에 이미 표시됨 */}

            {/* 팀으로 신청 버튼 (복식 전용) - 비활성화 시 아이콘만 변경 */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.teamApplyButton,
                isBlocked && styles.disabledButton,
              ]}
              onPress={isBlocked ? undefined : handleTeamApply}
              disabled={isBlocked}
            >
              <Ionicons
                name={isBlocked ? 'lock-closed' : 'people-outline'}
                size={16}
                color={isBlocked ? '#9CA3AF' : currentTheme === 'dark' ? '#64B5F6' : '#1976d2'}
              />
              <Text style={[styles.teamApplyButtonText, isBlocked && styles.disabledButtonText]}>
                {t('eventCard.buttons.applyAsTeam')}
              </Text>
            </TouchableOpacity>

            {/* 🎯 [OPERATION SOLO LOBBY - PHASE 5] 개인으로 신청 버튼 - 비활성화 시 아이콘만 변경 */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.individualApplyButton,
                isBlocked && styles.disabledButton,
              ]}
              onPress={isBlocked ? undefined : handleIndividualApply}
              disabled={isBlocked}
            >
              <Ionicons
                name={isBlocked ? 'lock-closed' : 'person-outline'}
                size={16}
                color={isBlocked ? '#9CA3AF' : currentTheme === 'dark' ? '#9C27B0' : '#7B1FA2'}
              />
              <Text
                style={[styles.individualApplyButtonText, isBlocked && styles.disabledButtonText]}
              >
                {t('eventCard.buttons.applySolo')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
  };

  const getTags = (): string[] => {
    const tags = [];

    // Smart skill level (remove duplication with header badge)
    const smartSkillText = formatSmartSkillLevel(event.skillLevel, t('common.locale'));
    if (smartSkillText && smartSkillText !== getEventTypeLabel(event.type)) {
      tags.push(`#${smartSkillText}`);
    }

    // AlmostFull only for future events
    const isUpcoming = event.date > new Date();
    const isAlmostFull = event.participants >= event.maxParticipants * 0.8;
    if (isUpcoming && isAlmostFull) {
      tags.push(`#${t('eventCard.labels.almostFull')}`);
    }

    return tags;
  };

  // Calculate participant progress
  const participantProgress = event.participants / event.maxParticipants;
  const isAlmostFull = participantProgress >= 0.8;
  const isFull = participantProgress >= 1.0;

  // 🎯 [KIM FIX] "모집완료" Badge for full events (visible for spectators)
  const getRecruitmentCompleteBadge = () => {
    // Check both isFull and isRecruitmentComplete
    const isComplete = isFull || event.isRecruitmentComplete;
    if (!isComplete) return null;
    return (
      <View style={styles.recruitmentCompleteBadge}>
        <Ionicons name='checkmark-circle' size={12} color='#FFFFFF' />
        <Text style={styles.recruitmentCompleteBadgeText}>{t('eventCard.labels.full')}</Text>
      </View>
    );
  };

  // Enhanced onPress handler with better logging
  const handleCardPress = () => {
    console.log('EventCard: Card pressed for event:', event.id, event.title);
    if (onPress) {
      console.log('EventCard: Calling onPress handler for navigation');
      onPress();
    } else {
      console.warn('EventCard: No onPress handler provided - navigation will not work');
    }
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
      <Card style={styles.card}>
        {/* 1. Header: Event info with Badge */}
        <View style={styles.header}>
          {/* 🎯 [2026-01-12] Left column: Event badge + Public Match */}
          <View style={styles.leftBadgeColumn}>
            <View style={styles.eventBadge}>
              <Text style={styles.badgeEmoji}>{getEventTypeEmoji(event.type)}</Text>
              <Text style={styles.badgeText}>{getEventTypeLabel(event.type)}</Text>
            </View>
            <Text style={styles.publicMatchText}>{event.clubName}</Text>
          </View>
          {/* 🎯 [2026-01-12] Right section: Title + Game type badge row */}
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{event.title}</Text>
              {/* 🆕 [3개월 규칙] 친선경기 배지 */}
              {event.isRankedMatch === false && (
                <View style={styles.friendlyBadge}>
                  <Text style={styles.friendlyBadgeText}>{t('eventCard.labels.friendly')}</Text>
                </View>
              )}
            </View>
            {/* 🎯 [2026-01-12] Badge row - game type left, status badges right */}
            <View style={styles.badgeRow}>
              {/* Left: Game type badge */}
              {(() => {
                const matchType = getMatchTypeLabel(event.gameType);
                if (matchType) {
                  return (
                    <View style={styles.gameTypeBadge}>
                      <Text style={styles.gameTypeBadgeEmoji}>{matchType.emoji}</Text>
                      <Text style={styles.gameTypeBadgeText}>{matchType.label}</Text>
                    </View>
                  );
                }
                return <View />;
              })()}
              {/* Right: Status badges */}
              <View style={styles.statusBadges}>
                {/* 🎯 Stage 2B: Individual applicants waiting badge */}
                {event.gameType?.toLowerCase().includes('doubles') &&
                  individualApplicantsCount > 0 && (
                    <View style={styles.waitingBadge}>
                      <Ionicons name='people-outline' size={14} color='#FF9800' />
                      <Text style={styles.waitingText}>
                        {t('eventCard.labels.waiting', { count: individualApplicantsCount })}
                      </Text>
                    </View>
                  )}
                {/* 🎯 [KIM FIX] "모집완료" badge for full events */}
                {getRecruitmentCompleteBadge()}
                {/* Application status chip - keep this! */}
                {getApplicationStatusChip()}
                {/* 🆕 [KIM] Partner status chip */}
                {getPartnerStatusChip()}
              </View>
            </View>
          </View>
        </View>

        {/* 1.5. Match Result Display (if available) - REMOVED */}

        {/* 2. Body: Compact info groups */}
        <Card.Content style={styles.body}>
          {/* 🎯 [KIM FIX] TouchableOpacity로 감싸서 부모 onPress 버블링 방지 */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.infoGroup}>
              <View style={styles.infoRow}>
                <StatIcon
                  icon='calendar-outline'
                  text={`${formatDate(event.date)} · ${event.time}`}
                  color={themeColors.colors.onSurfaceVariant}
                  size={16}
                />
              </View>
              <View style={styles.infoRow}>
                <StatIcon
                  icon='location-outline'
                  text={`${event.location}${typeof event.distance === 'number' && isFinite(event.distance) ? ` · ${formatDistance(event.distance, userCountry, t)}` : ''}`}
                  color={themeColors.colors.onSurfaceVariant}
                  size={16}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* 🎯 [KIM FIX] 탐색 화면에서는 호스트 정보만 표시 (게스트팀/참가자 목록 제거) */}
          {/* 🎯 [KIM FIX] 각 팀원 이름을 개별 클릭 가능하게 변경 */}
          {/* 🎯 [KIM FIX] TouchableOpacity로 감싸서 부모 onPress 버블링 방지 */}
          {event.hostName && (
            <TouchableOpacity
              style={styles.teamsSection}
              activeOpacity={1}
              onPress={() => {
                // 터치 이벤트 소비 - 부모 onPress로 버블링 방지
                // 호스트 프로필로 이동 (기본 동작)
                if (onPlayerPress && event.hostId) {
                  onPlayerPress(event.hostId);
                }
              }}
            >
              {/* Host Info Only */}
              <View style={styles.teamCard}>
                <Text style={styles.teamCardLabel}>{t('eventCard.labels.host')}</Text>
                <View style={styles.teamCardContent}>
                  <Ionicons name='checkmark-circle' size={18} color='#4CAF50' />
                  <View style={styles.teamCardInfo}>
                    <View style={styles.teamMembersRow}>
                      {/* 🎯 호스트 이름 - 클릭 시 프로필 이동 */}
                      <TouchableOpacity
                        onPress={() => onPlayerPress && event.hostId && onPlayerPress(event.hostId)}
                        disabled={!onPlayerPress || !event.hostId}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.teamCardName, styles.clickableName]}>
                          {event.hostName}
                        </Text>
                      </TouchableOpacity>
                      {/* 🎯 복식인 경우 파트너 이름 - 개별 클릭 가능 */}
                      {event.gameType?.toLowerCase().includes('doubles') &&
                        event.hostPartnerName && (
                          <>
                            <Text style={styles.teamCardName}> & </Text>
                            <TouchableOpacity
                              onPress={() =>
                                onPlayerPress &&
                                event.hostPartnerId &&
                                onPlayerPress(event.hostPartnerId)
                              }
                              disabled={!onPlayerPress || !event.hostPartnerId}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.teamCardName, styles.clickableName]}>
                                {event.hostPartnerName}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      {/* 🎯 [KIM FIX] Show host LTR level with game type - combined for doubles */}
                      {(() => {
                        const isDoublesMatch = event.gameType?.toLowerCase().includes('doubles');

                        // For doubles: show combined LTR if we have both host and partner LTR
                        // 🎯 [LTR FIX v5] "복식팀 LTR" 표기로 변경
                        if (isDoublesMatch && event.hostLtrLevel && hostPartnerLtrLevel) {
                          const combinedLtr =
                            Math.round(event.hostLtrLevel) + Math.round(hostPartnerLtrLevel);
                          return (
                            <Text style={styles.hostLtrText}>
                              {` (${t('eventCard.labels.doublesTeam')} LTR ${combinedLtr})`}
                            </Text>
                          );
                        }

                        // For singles or if partner LTR not yet loaded: show host LTR only
                        if (event.hostLtrLevel) {
                          return (
                            <Text style={styles.hostLtrText}>
                              {` (${isDoublesMatch ? t('eventCard.labels.doublesTeam') : t('eventCard.labels.singles')} LTR ${Math.round(event.hostLtrLevel)})`}
                            </Text>
                          );
                        }

                        return null;
                      })()}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* 🎯 [KIM FIX] NTRP Level & Gender Requirements Section */}
          {(event.minLtr || event.maxLtr || event.skillLevel || !genderEligibility.canApply) && (
            <View style={styles.ntrpRequirementsSection}>
              {/* 🎯 성별 불일치 메시지 (우선 표시) */}
              {!genderEligibility.canApply ? (
                <View style={[styles.ntrpRequirementBadge, styles.ntrpRequirementBadgeError]}>
                  <Ionicons name='close-circle' size={14} color='#EF4444' />
                  <Text style={[styles.ntrpRequirementText, styles.ntrpRequirementTextError]}>
                    {genderEligibility.reason}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.ntrpRequirementBadge,
                    !ntrpEligibility.canApply && styles.ntrpRequirementBadgeError,
                  ]}
                >
                  <Ionicons
                    name={ntrpEligibility.canApply ? 'fitness-outline' : 'close-circle'}
                    size={14}
                    color={ntrpEligibility.canApply ? themeColors.colors.primary : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.ntrpRequirementText,
                      !ntrpEligibility.canApply && styles.ntrpRequirementTextError,
                    ]}
                  >
                    {!ntrpEligibility.canApply
                      ? ntrpEligibility.reason
                      : event.minLtr && event.maxLtr
                        ? (() => {
                            // 🎯 [LTR FIX v5] Show allowed range based on game type
                            // - Doubles (mens/womens/mixed): Team LTR range
                            // - Singles: Individual LTR range
                            const gt = event.gameType?.toLowerCase() || '';
                            const isDoubles = gt.includes('doubles'); // Includes mixed_doubles

                            if (isDoubles) {
                              // 🎯 [LTR FIX v5] Doubles: Show TEAM LTR range
                              // Host team LTR = hostLtr + partnerLtr (from minLtr*2 or actual calculation)
                              const hostTeamLtr = event.minLtr + event.maxLtr; // minLtr = maxLtr = avg, so sum = teamLtr
                              const minTeamAllowed = hostTeamLtr - 2;
                              const maxTeamAllowed = hostTeamLtr + 2;
                              return t('eventCard.requirements.canApplyDoublesTeam', {
                                minLtr: Math.max(2, minTeamAllowed), // Minimum team LTR = 2 (1+1)
                                maxLtr: Math.min(20, maxTeamAllowed), // Maximum team LTR = 20 (10+10)
                              });
                            } else {
                              // 🎯 [LTR FIX v6] Singles: Use stored minLtr/maxLtr directly
                              // CreateEventForm stores hostLtr ± 1 range
                              return t('eventCard.requirements.canApply', {
                                minLtr: Math.round(event.minLtr),
                                maxLtr: Math.round(event.maxLtr),
                              });
                            }
                          })()
                        : event.skillLevel
                          ? t('eventCard.requirements.level', {
                              level: formatSmartSkillLevel(event.skillLevel, t('common.locale')),
                            })
                          : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Description Section */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText} numberOfLines={3}>
                {event.description}
              </Text>
            </View>
          )}

          <View style={styles.tagContainer}>
            {/* Left section: Participant info */}
            <View style={styles.participantInfo}>
              <View style={styles.participantTextContainer}>
                <Ionicons name='people' size={16} color={themeColors.colors.onSurfaceVariant} />
                <Text style={styles.participantText}>
                  {t('eventCard.labels.participants', {
                    current: event.participants,
                    max: event.maxParticipants,
                  })}
                </Text>
                {isAlmostFull && !isFull && (
                  <Text
                    style={styles.almostFullText}
                  >{` • ${t('eventCard.labels.almostFull')}`}</Text>
                )}
              </View>
              <ProgressBar
                progress={participantProgress}
                color={isAlmostFull ? themeColors.colors.warning : themeColors.colors.primary}
                style={styles.progressBar}
              />
            </View>

            {/* Right section: Tags */}
            <View style={styles.tagsRow}>
              {getTags().map((tag, index) => (
                <InfoTag key={index} text={tag} />
              ))}
            </View>
          </View>

          {/* 3. Footer: Actions only */}
          {getContextualButton()}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Record<string, string>, theme: 'light' | 'dark') =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    eventBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    badgeEmoji: {
      fontSize: 14,
      marginRight: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onPrimaryContainer,
    },
    headerContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    friendlyBadge: {
      backgroundColor: '#FFE0B2',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    friendlyBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#E65100',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    // 🎯 [2026-01-12] Left column for event badge + public match text
    leftBadgeColumn: {
      alignItems: 'flex-start',
      gap: 4,
    },
    publicMatchText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    // 🎯 [2026-01-12] Badge row - game type left, status badges right
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    // 🎯 [2026-01-12] Status badges container (right side)
    statusBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    gameTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#2D1F5E' : '#EDE7F6',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    gameTypeBadgeEmoji: {
      fontSize: 12,
    },
    gameTypeBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme === 'dark' ? '#B39DDB' : '#673AB7',
    },
    statusContainer: {
      // 🎯 [KIM FIX] 모든 뱃지를 오른쪽으로 정렬
      flexDirection: 'column',
      alignItems: 'stretch', // 자식이 전체 너비를 차지하도록
      justifyContent: 'flex-start',
      gap: 4,
      marginLeft: 8,
      flexShrink: 0,
    },
    // 🎯 [KIM FIX] 각 상태 칩을 오른쪽 정렬
    statusItem: {
      alignSelf: 'flex-end', // 자신을 부모 컨테이너에서 오른쪽으로 정렬
    },
    playersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 4,
    },
    playerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1A3A52' : '#E3F2FD',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    playerName: {
      fontSize: 11,
      fontWeight: '600',
      color: theme === 'dark' ? '#64B5F6' : '#1976d2',
    },
    playerSeparator: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginHorizontal: 2,
    },
    waitingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF3E0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    waitingText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FF9800',
    },
    body: {
      paddingTop: 4,
      paddingBottom: 20,
    },
    infoGroup: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    infoRow: {
      marginBottom: 4,
    },
    descriptionContainer: {
      marginTop: 8,
      marginBottom: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
    },
    descriptionText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    tagContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      gap: 12,
    },
    participantInfo: {
      flex: 1,
      marginRight: 8,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      marginTop: 12,
    },
    participantTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    participantText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
    },
    almostFullText: {
      fontSize: 13,
      color: colors.warning,
      fontWeight: '600',
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      marginTop: 4,
    },
    applyButton: {
      borderRadius: 18,
      minWidth: 90,
      flexShrink: 0,
    },
    applyButtonLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    hostButtonContainer: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    hostButton: {
      borderRadius: 16,
      minWidth: 80,
    },
    hostButtonLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    matchResultContainer: {
      flexShrink: 0,
    },
    matchResultCard: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 0,
      borderColor: colors.outline,
      minWidth: 100,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    winCard: {
      backgroundColor: '#E8F5E8',
      borderColor: '#4CAF50',
    },
    lossCard: {
      backgroundColor: '#FF9999',
      borderColor: '#FF6B6B',
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 0,
    },
    resultText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    winText: {
      color: '#4CAF50',
    },
    lossText: {
      color: '#FF6B6B',
    },
    scoreText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.onSurface,
      textAlign: 'center',
    },
    scoreInline: {
      fontSize: 11,
      marginLeft: 6,
      color: colors.onSurface,
      fontWeight: '600',
    },
    // 🎯 [KIM FIX] Spectator (non-participant) result display styles
    spectatorResultContainer: {
      flexShrink: 0,
      width: '100%',
    },
    spectatorResultCard: {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surfaceVariant,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    spectatorWinnerText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFD700',
    },
    spectatorScoreText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
      marginLeft: 4,
    },
    completedContainer: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completedText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    matchResultSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
      backgroundColor: colors.surfaceVariant,
    },
    winScoreText: {
      color: colors.success,
    },
    lossScoreText: {
      color: colors.error,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      minWidth: 80,
      justifyContent: 'center',
    },
    chatButton: {
      backgroundColor: theme === 'dark' ? '#1A3A52' : '#e3f2fd',
    },
    chatButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#1976d2',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? '#4A2C2C' : '#ffebee',
    },
    cancelButtonText: {
      color: theme === 'dark' ? '#EF5350' : '#f44336',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    applyButtonSmall: {
      backgroundColor: theme === 'dark' ? '#1A3A52' : '#e3f2fd',
    },
    applyButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#1976d2',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // 🎯 Phase 4: Match Type Badge Styles
    matchTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 6,
      alignSelf: 'flex-start',
    },
    matchTypeEmoji: {
      fontSize: 12,
      marginRight: 4,
    },
    matchTypeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.onSurfaceVariant,
    },
    // 🎯 [KIM FIX] Singles apply button - simple "참가 신청"
    singlesApplyButton: {
      backgroundColor: theme === 'dark' ? '#1B5E20' : '#E8F5E9',
      flex: 1,
    },
    singlesApplyButtonText: {
      color: theme === 'dark' ? '#4CAF50' : '#2E7D32',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // 🎯 Team & Individual Application Button Styles (복식 전용)
    teamApplyButton: {
      backgroundColor: theme === 'dark' ? '#1A3A52' : '#e3f2fd',
      flex: 1,
    },
    teamApplyButtonText: {
      color: theme === 'dark' ? '#64B5F6' : '#1976d2',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // 🎯 [OPERATION SOLO LOBBY - PHASE 5] Individual apply button - ENABLED!
    individualApplyButton: {
      backgroundColor: theme === 'dark' ? '#38006B' : '#F3E5F5',
      flex: 1,
    },
    individualApplyButtonText: {
      color: theme === 'dark' ? '#9C27B0' : '#7B1FA2',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // 🎯 [OPERATION SOLO LOBBY - PHASE 5] Solo applicants count display
    soloApplicantsCountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF3E0',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 8,
      alignSelf: 'flex-start',
    },
    soloApplicantsCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FF9800',
      marginLeft: 4,
    },
    // 🎯 [KIM FIX] "모집완료" Badge Styles
    recruitmentCompleteBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2196F3',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    recruitmentCompleteBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    closedEventButton: {
      backgroundColor: theme === 'dark' ? '#2C2C2C' : '#F5F5F5',
      flex: 1,
      justifyContent: 'center',
    },
    closedEventButtonText: {
      color: '#888',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    // ⚡ Quick Match: Location/Time button styles
    locationTimeButton: {
      backgroundColor: colors.primary,
    },
    locationTimeButtonLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    // 🎯 [KIM FIX] Teams Section Styles - Green border design
    teamsSection: {
      marginTop: 12,
      marginBottom: 8,
      gap: 8,
    },
    teamCard: {
      borderWidth: 1,
      borderColor: '#4CAF50',
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
      padding: 12,
    },
    teamCardLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4CAF50',
      marginBottom: 8,
    },
    teamCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    teamCardInfo: {
      flex: 1,
    },
    teamCardName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#1F2937',
    },
    // 🎯 [KIM FIX] 팀원 이름 가로 배열
    teamMembersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    // 🎯 [KIM FIX] 클릭 가능한 이름 스타일 (밑줄 추가)
    clickableName: {
      textDecorationLine: 'underline',
      textDecorationColor: theme === 'dark' ? '#90CAF9' : '#1976D2',
    },
    // 🎯 [KIM FIX] Host NTRP text style
    hostLtrText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme === 'dark' ? '#90CAF9' : '#1976D2',
    },
    // 🎯 [KIM FIX] NTRP Requirements Section Styles
    ntrpRequirementsSection: {
      marginTop: 8,
      marginBottom: 4,
    },
    ntrpRequirementBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(100, 181, 246, 0.15)' : 'rgba(25, 118, 210, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
      gap: 6,
    },
    ntrpRequirementText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme === 'dark' ? '#64B5F6' : '#1976D2',
    },
    // 🎯 [KIM FIX] NTRP Error styles (when user doesn't meet requirements)
    ntrpRequirementBadgeError: {
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
    },
    ntrpRequirementTextError: {
      color: '#EF4444',
    },
    // 🎯 [KIM FIX] Disabled button styles for NTRP mismatch
    disabledButton: {
      backgroundColor: theme === 'dark' ? '#2C2C2C' : '#E5E7EB',
      opacity: 0.7,
    },
    disabledButtonText: {
      color: '#9CA3AF',
    },
    // 🎯 [KIM FIX] NTRP blocked message container
    ntrpBlockedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 8,
      gap: 6,
    },
    ntrpBlockedText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#EF4444',
    },
  });

export default EventCard;
