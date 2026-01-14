/**
 * Past Events Section Component
 * Handles "Past" tab rendering with convertToEventCardType function
 *
 * 📝 LTR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LTR" (Lightning Tennis Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LTR로 변경하고 코드는 ntrp를 유지합니다.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EventWithParticipation } from '../../types/activity';
import PastEventCard from '../cards/PastEventCard';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLightningTennisTheme } from '../../theme';
import { safeToDate } from '../../utils/dateUtils';
import {
  safeString,
  safeNumber,
  safeEventType,
  safeLocation,
  safeSkillLevel,
} from '../../utils/dataUtils';

// 🎾 경기 분석용 간단 이벤트 타입
interface SimpleEventForAnalysis {
  id: string;
  title: string;
  gameType?: string;
  hostId?: string;
  clubId?: string;
  scheduledTime?: Date;
  matchResult?: {
    score?: { sets?: Array<{ player1Games: number; player2Games: number }> };
    hostResult?: string;
  };
}

interface PastEventsSectionProps {
  currentLanguage: string;
  pastEvents: EventWithParticipation[];
  loading: boolean;
  onRefresh: () => void;
  onOpenChat: (eventId: string, eventTitle: string) => void;
  onAnalyzeMatch?: (event: SimpleEventForAnalysis) => void; // 🎾 경기 분석
}

// 🎯 Extended type for accessing optional fields not in EventWithParticipation
/* eslint-disable @typescript-eslint/no-explicit-any */
type ExtendedEventData = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

const PastEventsSection: React.FC<PastEventsSectionProps> = ({
  currentLanguage,
  pastEvents,
  onOpenChat,
  onAnalyzeMatch, // 🎾 경기 분석 핸들러
}) => {
  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const themeColors = getLightningTennisTheme(currentTheme);
  const styles = createStyles(themeColors.colors);

  const convertToEventCardType = (event: EventWithParticipation, isHosted: boolean = false) => {
    // 🛡️ Operation: Quarantine Expansion - Enhanced data conversion with safety checks

    // Cast to extended type for accessing additional optional fields
    const extendedEvent = event as unknown as ExtendedEventData;

    // 🛡️ Safe date extraction with fallback protection
    const safeScheduledTime = safeToDate(event.scheduledTime) || new Date();

    // ✅ Priority 1: Use Firestore currentParticipants field (single source of truth)
    // 🎯 [OPERATION DUO] Fix: Firestore currentParticipants already includes host
    const participants = (() => {
      // 🔍 DEBUG: Log all participant count sources
      console.log('🔍 [PARTICIPANT_COUNT_DEBUG]', {
        eventId: event.id,
        eventTitle: event.title,
        currentParticipants: event.currentParticipants,
        computedParticipantCount: event.computedParticipantCount,
        participantsArrayLength: event.participants?.length || 0,
        approvedApplicationsLength: event.approvedApplications?.length || 0,
        isHosted,
      });

      // 🔥 NEW APPROACH: Use Firestore currentParticipants if available
      if (event.currentParticipants !== undefined) {
        console.log('✅ [PARTICIPANT_COUNT] Using currentParticipants:', event.currentParticipants);
        return Math.max(0, event.currentParticipants); // Direct from Firestore
      }

      // ✅ Priority 2: Use computedParticipantCount from ActivityService if available
      if (event.computedParticipantCount !== undefined) {
        console.log(
          '✅ [PARTICIPANT_COUNT] Using computedParticipantCount:',
          event.computedParticipantCount
        );
        return Math.max(0, event.computedParticipantCount);
      }

      // Fallback logic for backward compatibility with safety checks
      const approvedCount = Array.isArray(event.approvedApplications)
        ? event.approvedApplications.length
        : 0;
      const participantsArrayCount = Array.isArray(event.participants)
        ? event.participants.length
        : 0;

      // 우선순위: participants 배열 > approved 참가자 수
      let baseCount = 0;
      if (participantsArrayCount > 0) {
        baseCount = participantsArrayCount;
      } else {
        baseCount = approvedCount;
      }

      // 💥 호스트 이벤트인 경우 호스트를 참가자 수에 포함 (legacy fallback only)
      if (isHosted && event.hostId) {
        // participants 배열에 호스트가 이미 포함되어 있는지 확인
        const hostIncluded =
          event.participants?.some(p =>
            typeof p === 'string' ? p === event.hostId : p?.id === event.hostId
          ) || event.approvedApplications?.some(p => p?.applicantId === event.hostId);

        // 호스트가 포함되어 있지 않다면 +1
        if (!hostIncluded) {
          baseCount += 1;
        }
      }

      return Math.max(0, baseCount); // Ensure non-negative
    })();

    // 🛡️ Safe location processing using unified utility
    const safeLocationString = safeLocation(event.location);

    // 🛡️ Safe time formatting with error handling
    const safeTimeString = (() => {
      try {
        return safeScheduledTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        console.warn('⚠️ [ActivityTabContent] Time formatting error:', error);
        return 'TBD';
      }
    })();

    // 🎯 [KIM FIX] Infer correct type from gameType if type is incorrect
    // gameType is more reliable than type field (which can be incorrectly set during event creation)
    const inferredType = (() => {
      const gameType = event.gameType?.toLowerCase();

      // Match types: singles/doubles games
      if (gameType?.includes('singles') || gameType?.includes('doubles')) {
        return 'match';
      }

      // Meetup types: rally, practice sessions
      if (gameType === 'rally') {
        return 'meetup';
      }

      // Fallback to original type
      return event.type;
    })();

    // 🛡️ Safe type validation using unified utility
    const eventType = safeEventType(inferredType);

    return {
      id: safeString(event.id) || `fallback_${Date.now()}`,
      title: safeString(event.title, 'Untitled Event'),
      clubName: safeString(
        event.clubName,
        eventType === 'meetup' ? 'Practice & Social' : 'Public Match'
      ),
      date: safeScheduledTime,
      time: safeTimeString,
      location: safeLocationString,
      distance: typeof event.distance === 'number' ? event.distance : null,
      participants,
      maxParticipants: Math.max(1, safeNumber(event.maxParticipants, 2)), // Ensure minimum capacity
      skillLevel: (() => {
        // 🔍 SIMPLE TEST: Verify this code is running
        console.log('🔍 TEST: ActivityTabContent processing skillLevel for event:', event.title);

        // 🔍 ENHANCED DEBUG: ActivityTabContent skill level analysis
        console.log('🔍 [ACTIVITY TAB DEBUG] Event Skill Level Analysis:', {
          eventTitle: event.title,
          eventId: event.id,
          originalSkillLevel: event.skillLevel,
          skillLevelType: typeof event.skillLevel,
          allEventFields: Object.keys(event),
          // Check for alternative skill level fields
          alternativeFields: {
            minSkillLevel: extendedEvent.minSkillLevel,
            maxSkillLevel: extendedEvent.maxSkillLevel,
            requiredSkillLevel: extendedEvent.requiredSkillLevel,
            hostSkillLevel: extendedEvent.hostSkillLevel,
            preferencesSkillLevel: extendedEvent.preferences?.skillLevel,
            creatorSkillLevel: extendedEvent.creatorSkillLevel,
          },
          isTargetEvent:
            event.title &&
            (event.title.includes('번개13') ||
              event.title.includes('번개') ||
              event.title.includes('13')),
          dataSource: 'ActivityTabContent',
        });

        // 🔍 Priority: Use ltrLevel as primary skill level source
        return safeSkillLevel(extendedEvent.ltrLevel || event.skillLevel, extendedEvent);
      })(),
      type: eventType,
      description: safeString(event.description),
      hostId: safeString(event.hostId), // 🎯 작전명 카멜레온 버튼: 호스트 ID 추가
      status: event.status, // 🛡️ Quarantine Expansion: Pass status field for completion detection
      gameType: event.gameType, // 🎯 Pass gameType for partner invitation logic
      matchResult: (() => {
        console.log('🔍 [MATCH RESULT DEBUG] Converting matchResult for event:', {
          eventId: event.id,
          eventTitle: event.title,
          hasMatchResult: !!event.matchResult,
          matchResult: event.matchResult,
          matchResultType: typeof event.matchResult,
          hasScore: !!extendedEvent.score,
          score: extendedEvent.score,
          scoreType: typeof extendedEvent.score,
        });
        return event.matchResult || null;
      })(), // 🏆 매치 결과 데이터 전달 with null fallback
      // 🎯 [KIM FIX] 호스트팀 정보
      hostName: event.hostName,
      hostPartnerId: event.hostPartnerId,
      hostPartnerName: event.hostPartnerName,
      // 🎯 [KIM FIX] 도전팀 정보 - 우선순위: 1) event 직접 필드 2) approvedApplications 3) myApplication
      // 호스트가 볼 때는 myApplication이 없으므로 approvedApplications에서 가져와야 함
      applicantId: (() => {
        // 1) Event 직접 필드
        if (extendedEvent.applicantId) return extendedEvent.applicantId;
        // 2) approvedApplications에서 첫 번째 승인된 도전팀 (host가 아닌 신청자)
        const approvedChallenger = event.approvedApplications?.find(
          app => app.applicantId !== event.hostId
        );
        if (approvedChallenger?.applicantId) return approvedChallenger.applicantId;
        // 3) myApplication (내가 신청자인 경우)
        return extendedEvent.myApplication?.applicantId;
      })(),
      applicantName: (() => {
        if (extendedEvent.applicantName) return extendedEvent.applicantName;
        const approvedChallenger = event.approvedApplications?.find(
          app => app.applicantId !== event.hostId
        );
        if (approvedChallenger?.applicantName) return approvedChallenger.applicantName;
        return extendedEvent.myApplication?.applicantName;
      })(),
      opponentPartnerId: (() => {
        if (extendedEvent.opponentPartnerId) return extendedEvent.opponentPartnerId;
        const approvedChallenger = event.approvedApplications?.find(
          app => app.applicantId !== event.hostId
        );
        if (approvedChallenger?.partnerId) return approvedChallenger.partnerId;
        return extendedEvent.myApplication?.partnerId;
      })(),
      opponentPartnerName: (() => {
        // 🔍 DEBUG: Log all sources of opponent partner name
        console.log('🔍 [OPPONENT_PARTNER_DEBUG]', {
          eventId: event.id,
          eventTitle: event.title,
          hostId: event.hostId,
          hostPartnerId: event.hostPartnerId,
          extendedOpponentPartnerName: extendedEvent.opponentPartnerName,
          approvedApplicationsCount: event.approvedApplications?.length || 0,
          approvedApplications: event.approvedApplications?.map(app => ({
            applicantId: app.applicantId,
            applicantName: app.applicantName,
            partnerId: app.partnerId,
            partnerName: app.partnerName,
          })),
          participants: event.participants,
          myApplicationPartnerName: extendedEvent.myApplication?.partnerName,
        });

        // 1) Direct field
        if (extendedEvent.opponentPartnerName) return extendedEvent.opponentPartnerName;

        // 2) From approvedApplications - 호스트가 볼 때: 도전팀 파트너 이름
        const approvedChallenger = event.approvedApplications?.find(
          app => app.applicantId !== event.hostId && app.applicantId !== event.hostPartnerId
        );
        console.log('🔍 [OPPONENT_PARTNER_DEBUG] approvedChallenger found:', approvedChallenger);
        if (approvedChallenger?.partnerName) return approvedChallenger.partnerName;

        // 3) 🎯 [KIM FIX v31] Fallback: participants 배열에서 도전팀 파트너 찾기
        // approveApplication에서 participants에 [{playerId, playerName}, ...] 형태로 저장됨
        if (
          event.participants &&
          Array.isArray(event.participants) &&
          event.participants.length >= 2
        ) {
          // 호스트팀 ID들
          const hostTeamIds = [event.hostId, event.hostPartnerId].filter(Boolean);
          // 도전팀 participants (호스트팀 제외)
          const challengerParticipants = event.participants.filter(
            (p: { playerId?: string; playerName?: string } | string) => {
              const pId = typeof p === 'string' ? p : p?.playerId;
              return pId && !hostTeamIds.includes(pId);
            }
          );
          console.log(
            '🔍 [OPPONENT_PARTNER_DEBUG] challengerParticipants:',
            challengerParticipants
          );

          // 도전팀이 2명이면 applicantName과 다른 사람이 파트너
          if (challengerParticipants.length === 2) {
            // applicantName 찾기 - approvedApplications에서 가져옴
            const applicantName = (() => {
              if (extendedEvent.applicantName) return extendedEvent.applicantName;
              const challenger = event.approvedApplications?.find(
                (app: { applicantId?: string; applicantName?: string }) =>
                  app.applicantId !== event.hostId && app.applicantId !== event.hostPartnerId
              );
              return challenger?.applicantName;
            })();

            console.log('🔍 [OPPONENT_PARTNER_DEBUG] applicantName for filtering:', applicantName);

            // 🎯 [FIX] playerName이 applicantName과 다른 사람이 파트너
            const partnerParticipant = challengerParticipants.find(
              (p: { playerId?: string; playerName?: string } | string) => {
                const pName = typeof p === 'string' ? p : p?.playerName;
                return pName && pName !== applicantName;
              }
            );

            if (partnerParticipant) {
              const partnerName =
                typeof partnerParticipant === 'string'
                  ? partnerParticipant
                  : partnerParticipant?.playerName;
              console.log(
                '🔍 [OPPONENT_PARTNER_DEBUG] Found partner from participants:',
                partnerName
              );
              if (partnerName) return partnerName;
            }
          }
        }

        // 4) From myApplication (도전팀이 볼 때)
        return extendedEvent.myApplication?.partnerName;
      })(),
      // 🎾 경기 분석을 위한 추가 필드
      clubId: extendedEvent.clubId, // 클럽 활동 구분용
      scheduledTime: safeScheduledTime, // 경기 일시
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{t('pastEvents.sectionTitle')}</Text>

      {pastEvents.length > 0 ? (
        pastEvents.map(event => {
          const convertedEvent = convertToEventCardType(event, false);

          return (
            <PastEventCard
              key={`past_${event.id}`}
              event={convertedEvent}
              currentLanguage={currentLanguage as 'en' | 'ko'}
              currentUserId={currentUser?.uid}
              onOpenChat={onOpenChat}
              onAnalyzeMatch={onAnalyzeMatch} // 🎾 경기 분석
              onPress={() => {
                console.log('ActivityTabContent: Past event pressed:', event.id);
                // TODO: 지난 이벤트 상세 보기
              }}
            />
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('pastEvents.emptyState')}</Text>
        </View>
      )}
    </View>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const createStyles = (colors: any) =>
  StyleSheet.create({
    tabContent: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 16,
      flexShrink: 1,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
/* eslint-enable @typescript-eslint/no-explicit-any */

export default PastEventsSection;
