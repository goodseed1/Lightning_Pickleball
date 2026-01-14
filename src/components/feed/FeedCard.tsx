/**
 * FeedCard - Unified feed item component
 * Lightning Pickleball 앱의 피드 화면에서 사용되는 개별 피드 아이템
 * Combines the best features from both FeedItem and FeedCard components
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Card, IconButton, Avatar, Chip } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { getLightningPickleballTheme } from '../../theme';
import { FeedItem } from '../../services/feedService';
import { safeToDate } from '../../utils/dateUtils';
import * as feedTypes from '../../types/feed.js';
import InteractionBar from './InteractionBar';

const FEED_TEMPLATES = (feedTypes as { FEED_TEMPLATES?: Record<string, unknown> })?.FEED_TEMPLATES;

interface FeedCardProps {
  item: FeedItem;
  currentLanguage?: string;
  onPress?: (item: FeedItem) => void;
  onUserPress?: (userId: string, userName: string) => void;
  onClubPress?: (clubId: string, clubName: string) => void;
  onDelete?: (feedId: string) => void;
  currentUserId?: string;
  onLike?: (feedId: string) => void;
  onComment?: (feedId: string) => void;
  onShare?: (feedId: string) => void;
  /** 🙈 숨기기 핸들러 */
  onHide?: (feedId: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = props => {
  const {
    item,
    currentLanguage: propLanguage,
    onPress,
    onUserPress,
    onClubPress,
    onDelete,
    currentUserId,
    onLike,
    onComment,
    onShare,
    onHide,
  } = props;

  const { currentLanguage: contextLanguage, t } = useLanguage();
  const currentLanguage = propLanguage || contextLanguage || 'ko';
  const { theme: currentTheme } = useTheme();
  const themeColors = getLightningPickleballTheme(currentTheme);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const styles = createStyles(themeColors.colors as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // 방어적 코딩: item이 없으면 null 반환
  if (!item) {
    console.warn('FeedCard: item prop is undefined or null');
    return null;
  }

  // 필수 필드 확인 (actorName은 fallback 허용)
  if (!item.type) {
    console.warn('FeedCard: Missing required type field in item:', item);
    return null;
  }

  // 🆕 [KIM FIX] actorName이 없으면 'Unknown'으로 fallback (필터링하지 않음)
  if (!item.actorName) {
    console.warn('FeedCard: Missing actorName, will use "Unknown" fallback:', item.id);
  }

  // 🔔 Private feed types - notification-style items that don't show actor info
  // For club_join_request_approved, it's "private" only when viewing user is the actor (self)
  // 🎯 [KIM] Added application_approved/rejected/auto_rejected as private feed types
  // 🎯 [KIM FIX] Added guest_team_approved for host partner notifications
  const isPrivateFeedType =
    [
      'club_join_request_rejected',
      'club_member_removed',
      'club_deleted',
      'application_approved', // 🎯 Host approved your application
      'application_rejected', // 🎯 Host rejected your application
      'application_auto_rejected', // 🎯 Another team was approved, your application auto-closed
      'guest_team_approved', // 🎯 [KIM FIX] Host partner sees guest team approval
    ].includes(item.type || '') ||
    (item.type === 'club_join_request_approved' && item.actorId === currentUserId);

  // 🎯 [KIM FIX] Detect team names (e.g., "Daniel & Paul") - should not be clickable as user profile
  // Team names contain " & " separator, individual user names typically don't
  const isTeamName = item.actorName?.includes(' & ') || false;

  // 🎯 [KIM FIX] Feed types that should use server-generated content directly
  // These types have dynamic content (매치/모임) that the server generates correctly
  const useServerContent =
    [
      'application_approved',
      'application_rejected',
      'application_auto_rejected',
      'guest_team_approved',
    ].includes(item.type || '') && item.content;

  /**
   * 🛡️ 시간 포맷팅 with Triple Defense System
   */
  const formatRelativeTime = (timestamp: unknown): string => {
    try {
      // 🛡️ Phase 3 Defense: Use safeToDate for ultimate timestamp protection
      // 🔍 FORENSIC ENHANCEMENT: Provide detailed context for corruption tracking
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const timeDate = safeToDate(timestamp as any, {
        itemId: item.id || 'NO_ID_DETECTED',
        fieldName: 'timestamp_in_formatRelativeTime',
        functionName: 'FeedCard.formatRelativeTime',
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // If safeToDate couldn't process it, return fallback
      if (!timeDate) {
        return t('feedCard.justNow');
      }

      const now = new Date();
      const diff = now.getTime() - timeDate.getTime();

      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days > 0) {
        return t('feedCard.daysAgo', { days });
      } else if (hours > 0) {
        return t('feedCard.hoursAgo', { hours });
      } else if (minutes > 0) {
        return t('feedCard.minutesAgo', { minutes });
      } else {
        return t('feedCard.justNow');
      }
    } catch (error) {
      console.warn(`🚫 [FeedCard] Error formatting timestamp for item ${item.id}:`, error);
      return t('feedCard.justNow');
    }
  };

  /**
   * 🎨 피드 타입별 벡터 아이콘 설정
   * @returns { library: 'ionicons' | 'material' | 'fontawesome', name: string }
   */
  type IconConfig = {
    library: 'ionicons' | 'material' | 'fontawesome';
    name: string;
  };

  const getFeedIcon = (): IconConfig => {
    switch (item.type) {
      case 'match_result':
        if (item.metadata?.firstWin) return { library: 'material', name: 'party-popper' };
        if (item.metadata?.firstMatch) return { library: 'material', name: 'star-shooting' };
        if (item.metadata?.matchType === 'practice')
          return { library: 'material', name: 'arm-flex' };
        if (item.metadata?.matchType === 'doubles')
          return { library: 'material', name: 'account-group' };
        return item.metadata?.isWin
          ? { library: 'ionicons', name: 'trophy' }
          : { library: 'material', name: 'pickleball' };
      case 'match_completed':
        return item.metadata?.isWin
          ? { library: 'ionicons', name: 'trophy' }
          : { library: 'material', name: 'pickleball' };
      case 'achievement_unlocked':
        return { library: 'ionicons', name: 'medal' };
      case 'friend_added':
        return { library: 'ionicons', name: 'person-add' };
      case 'club_joined':
        return { library: 'ionicons', name: 'hand-right' };
      case 'league_winner':
        return { library: 'material', name: 'crown' };
      case 'tournament_winner':
        return { library: 'fontawesome', name: 'medal' };
      case 'club_event':
        if (item.metadata?.eventType === 'coaching_clinic')
          return { library: 'ionicons', name: 'school' };
        if (item.metadata?.eventType === 'casual_meetup')
          return { library: 'material', name: 'balloon' };
        return { library: 'ionicons', name: 'calendar' };
      case 'new_member':
      case 'new_member_joined':
        return { library: 'ionicons', name: 'person-add' };
      case 'league_created':
      case 'league_registration_open':
        return { library: 'material', name: 'trophy-award' };
      case 'new_club':
        if (item.metadata?.milestone) return { library: 'material', name: 'party-popper' };
        return { library: 'ionicons', name: 'star' };
      case 'skill_improvement':
        return { library: 'ionicons', name: 'trending-up' };
      case 'elo_milestone':
        return { library: 'ionicons', name: 'flash' };
      case 'club_team_invite_pending':
        return { library: 'ionicons', name: 'mail' };
      // 🎾 [SOLO LOBBY] Team proposal from solo lobby
      case 'solo_team_proposal_pending':
        return { library: 'material', name: 'account-multiple-plus' };
      // 🎾 [KIM] Team application cancelled by partner
      case 'team_application_cancelled_by_partner':
        return { library: 'material', name: 'account-cancel' };
      // 🎾 [KIM] Event cancelled by host
      case 'event_cancelled_by_host':
        return { library: 'material', name: 'calendar-remove' };
      // 🎾 [KIM] Application cancelled - notify host
      case 'application_cancelled':
        return { library: 'material', name: 'account-cancel' };
      case 'club_team_invite_accepted':
        return { library: 'material', name: 'handshake' };
      // 🎯 [KIM FIX] Partner invitation response icons
      case 'partner_invite_pending':
        return { library: 'material', name: 'account-multiple-plus' };
      case 'partner_invite_accepted':
        return { library: 'material', name: 'handshake' };
      case 'partner_invite_rejected':
        return { library: 'ionicons', name: 'close-circle' };
      case 'club_join_request_pending':
        return { library: 'ionicons', name: 'document-text' };
      case 'club_join_request_approved':
        return { library: 'material', name: 'party-popper' };
      case 'club_join_request_rejected':
        return { library: 'ionicons', name: 'close-circle' };
      case 'club_member_removed':
        return { library: 'ionicons', name: 'person-remove' };
      case 'club_deleted':
        return { library: 'ionicons', name: 'trash' };
      case 'club_member_left':
        return { library: 'ionicons', name: 'exit' };
      case 'club_owner_changed':
        return { library: 'material', name: 'account-switch' };
      case 'tournament_registration_open':
        return { library: 'ionicons', name: 'megaphone' };
      case 'tournament_completed':
        return { library: 'ionicons', name: 'trophy' };
      case 'league_completed':
        return { library: 'ionicons', name: 'trophy' };
      case 'league_playoffs_created':
        return { library: 'material', name: 'tournament' };
      // 🎾 [KIM FIX] Match invitation response icons (for host)
      case 'match_invite_accepted':
        return { library: 'material', name: 'handshake' };
      case 'match_invite_rejected':
        return { library: 'ionicons', name: 'close-circle' };
      // 🎯 [KIM] Application approval/rejection icons
      case 'application_approved':
        return { library: 'ionicons', name: 'checkmark-circle' };
      case 'application_rejected':
        return { library: 'ionicons', name: 'close-circle' };
      case 'application_auto_rejected':
        return { library: 'material', name: 'account-cancel' }; // 🎯 Auto-closed when another team approved
      case 'guest_team_approved':
        return { library: 'material', name: 'account-multiple-check' }; // 🎯 [KIM FIX] Host partner notification
      // 🎯 [KIM] Solo lobby team proposal response icons
      case 'proposal_accepted':
        return { library: 'material', name: 'handshake' };
      case 'proposal_rejected':
        return { library: 'ionicons', name: 'close-circle' };
      // 📬 [KIM] Feedback notification icons
      case 'admin_feedback_received':
        return { library: 'ionicons', name: 'chatbubble-ellipses' }; // 📬 Admin received user feedback
      case 'feedback_response_received':
        return { library: 'ionicons', name: 'mail-open' }; // 📬 User received admin response
      default:
        return { library: 'ionicons', name: 'newspaper' };
    }
  };

  /**
   * 🎨 벡터 아이콘 렌더링 헬퍼
   */
  const renderFeedIcon = (iconConfig: IconConfig, color: string) => {
    const size = 18;
    switch (iconConfig.library) {
      case 'material':
        return (
          <MaterialCommunityIcons
            name={iconConfig.name as keyof typeof MaterialCommunityIcons.glyphMap}
            size={size}
            color={color}
          />
        );
      case 'fontawesome':
        return (
          <FontAwesome5
            name={iconConfig.name as keyof typeof FontAwesome5.glyphMap}
            size={size}
            color={color}
          />
        );
      case 'ionicons':
      default:
        return (
          <Ionicons
            name={iconConfig.name as keyof typeof Ionicons.glyphMap}
            size={size}
            color={color}
          />
        );
    }
  };

  /**
   * 피드 타입별 색상 가져오기 (테마 적용)
   */
  const getFeedColor = (): string => {
    switch (item.type) {
      case 'match_result':
      case 'match_completed':
        return item.metadata?.isWin ? themeColors.colors.primary : themeColors.colors.secondary;
      case 'achievement_unlocked':
      case 'league_winner':
      case 'tournament_winner':
        return themeColors.colors.tertiary;
      case 'friend_added':
        return themeColors.colors.secondary;
      case 'club_joined':
      case 'club_event':
        return themeColors.colors.primary;
      case 'new_member':
      case 'new_member_joined':
        return themeColors.colors.secondary;
      case 'league_created':
      case 'league_registration_open':
        return themeColors.colors.tertiary;
      case 'new_club':
        return themeColors.colors.onSurfaceVariant;
      case 'elo_milestone':
        return themeColors.colors.likeActive;
      case 'club_team_invite_pending':
        return themeColors.colors.secondary;
      // 🎾 [SOLO LOBBY] Team proposal color
      case 'solo_team_proposal_pending':
        return themeColors.colors.tertiary; // Bright color for attention
      // 🎾 [KIM] Team application cancelled by partner
      case 'team_application_cancelled_by_partner':
        return themeColors.colors.error; // ❌ Red for cancellation notice
      // 🎾 [KIM] Event cancelled by host
      case 'event_cancelled_by_host':
        return themeColors.colors.error; // ❌ Red for event cancellation
      // 🎾 [KIM] Application cancelled - notify host
      case 'application_cancelled':
        return themeColors.colors.error; // ❌ Red for cancellation notice
      case 'club_team_invite_accepted':
        return themeColors.colors.primary;
      case 'club_join_request_pending':
        return themeColors.colors.secondary;
      case 'club_join_request_approved':
        return themeColors.colors.primary;
      case 'club_join_request_rejected':
        return themeColors.colors.error;
      case 'club_member_removed':
        return themeColors.colors.error; // 🚫 Red color for expulsion
      case 'club_deleted':
        return themeColors.colors.error; // 🗑️ Red color for club deletion
      case 'club_member_left':
        return themeColors.colors.onSurfaceVariant; // 👋 Neutral color for leaving
      case 'club_owner_changed':
        return themeColors.colors.primary; // 🔄 Primary color for admin change
      case 'tournament_registration_open':
        return themeColors.colors.tertiary; // Bright, eye-catching for advertisement
      case 'tournament_completed':
        return '#FFD700'; // Gold color for tournament completion
      case 'league_completed':
        return '#FFD700'; // Gold color for league completion
      case 'league_playoffs_created':
        return themeColors.colors.primary;
      case 'partner_invite_pending':
        return themeColors.colors.secondary; // 🎯 [OPERATION DUO] Partner invitation color
      // 🎯 [KIM FIX] Partner invitation response colors
      case 'partner_invite_accepted':
        return themeColors.colors.primary; // ✅ Green for accepted
      case 'partner_invite_rejected':
        return themeColors.colors.error; // ❌ Red for rejected
      case 'club_member_invite_pending':
        return themeColors.colors.primary; // 🎾 Club member invitation color
      // 🎾 [KIM FIX] Match invitation response colors (for host)
      case 'match_invite_accepted':
        return themeColors.colors.primary; // ✅ Green for accepted
      case 'match_invite_rejected':
        return themeColors.colors.error; // ❌ Red for rejected
      // 🎯 [KIM] Application approval/rejection colors
      case 'application_approved':
        return themeColors.colors.primary; // ✅ Green for approved
      case 'application_rejected':
        return themeColors.colors.error; // ❌ Red for rejected
      case 'application_auto_rejected':
        return themeColors.colors.onSurfaceVariant; // 🔄 Neutral gray for auto-closed
      case 'guest_team_approved':
        return themeColors.colors.primary; // 🎯 [KIM FIX] Green for host partner notification
      // 🎯 [KIM] Solo lobby team proposal response colors
      case 'proposal_accepted':
        return themeColors.colors.primary; // ✅ Green for accepted
      case 'proposal_rejected':
        return themeColors.colors.error; // ❌ Red for rejected
      // 📬 [KIM] Feedback notification colors
      case 'admin_feedback_received':
        return themeColors.colors.tertiary; // 📬 Bright for attention (admin)
      case 'feedback_response_received':
        return themeColors.colors.secondary; // 📬 Friendly color for user
      default:
        return themeColors.colors.onSurfaceVariant;
    }
  };

  /**
   * 피드 텍스트 생성 (고급 템플릿 시스템)
   */
  const generateFeedText = (): string => {
    try {
      // 🎯 [KIM FIX v2] Check if content is a translation key (starts with 'feed.')
      // New format: Server saves translation key, client renders with user's language
      if (item.content?.startsWith('feed.')) {
        // Extract metadata for translation variables
        const translationVars = {
          eventTitle: item.metadata?.eventTitle || '',
          eventType: item.metadata?.eventType || t('common.match'),
          teamName: item.targetName || item.metadata?.applicantName || '',
          clubName: item.metadata?.clubName || item.targetName || '',
          ownerName: item.metadata?.newOwnerName || item.actorName || '',
          userName: item.actorName || '',
        };
        return t(item.content, translationVars);
      }

      // 🎯 [KIM FIX] For certain feed types, use server-generated content directly
      // Server generates correct "매치" vs "모임" based on gameType
      // (Legacy support for old Korean content)
      if (useServerContent && item.content) {
        return item.content;
      }

      // 템플릿 존재 확인
      if (!FEED_TEMPLATES) {
        console.warn('FEED_TEMPLATES is undefined');
        return currentLanguage === 'ko'
          ? `${item.actorName}님의 활동`
          : `${item.actorName}'s activity`;
      }

      /* eslint-disable @typescript-eslint/no-explicit-any */
      let template = FEED_TEMPLATES?.[item.type || ''] as Record<string, any> | undefined;
      if (!template) {
        console.warn(
          `[FeedCard] No template found for type: ${item.type}. Available types:`,
          Object.keys(FEED_TEMPLATES || {})
        );

        // 💥 Enhanced Defense: Handle typos like tournament__winner → tournament_winner 💥
        const normalizedType = item.type?.replace(/__/g, '_'); // Fix double underscores
        const correctedTemplate = normalizedType
          ? (FEED_TEMPLATES?.[normalizedType] as Record<string, any> | undefined)
          : undefined;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (correctedTemplate) {
          console.warn(
            `[FeedCard] Found corrected template for normalized type: ${normalizedType}`
          );
          template = correctedTemplate; // Use the corrected template
        } else {
          // 💥 Ultimate fallback: Use unknown_activity template 💥
          template = FEED_TEMPLATES['unknown_activity'] || {
            ko: '{actorName}님이 새로운 활동을 시작했습니다',
            en: '{actorName} has a new activity',
          };
        }
      }

      let text = '';

      // 안전한 템플릿 접근 함수
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const getTemplateText = (
        template: Record<string, any>,
        lang: string,
        subkey: string | null = null
      ): string | null => {
        if (!template) return null;

        if (subkey) {
          // 중첩된 구조 (예: template[lang][subkey])
          const langObj = template[lang];
          if (langObj && typeof langObj === 'object' && subkey in langObj) {
            return langObj[subkey] as string;
          }
          return null;
        } else {
          // 단순 구조 (예: template[lang])
          return (template[lang] as string) || (template.ko as string) || null;
        }
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      switch (item.type) {
        case 'match_result': {
          const isWin = item.metadata?.isWin;
          const isFirstMatch = item.metadata?.firstMatch;
          const isFirstWin = item.metadata?.firstWin;
          const isPractice = item.metadata?.matchType === 'practice';

          if (isFirstWin) {
            text = getTemplateText(template, currentLanguage, 'first_win') || '';
          } else if (isFirstMatch) {
            text = getTemplateText(template, currentLanguage, 'first_match') || '';
          } else if (isPractice) {
            text = getTemplateText(template, currentLanguage, 'practice') || '';
          } else {
            text = getTemplateText(template, currentLanguage, isWin ? 'win' : 'loss') || '';
          }
          break;
        }

        case 'match_completed': {
          // 호환성을 위해 기본 템플릿 사용
          const { actorName, targetName, metadata } = item;
          const score = metadata?.score ? `(${metadata.score})` : '';
          if (metadata?.isWin) {
            text = t('feedCard.matchCompleted.win', { actorName, targetName, score });
          } else {
            text = t('feedCard.matchCompleted.played', { actorName, targetName, score });
          }
          break;
        }

        case 'club_event': {
          const eventType = item.metadata?.eventType;
          if (eventType === 'coaching_clinic') {
            text = getTemplateText(template, currentLanguage, 'coaching') || '';
          } else if (eventType === 'casual_meetup') {
            text = getTemplateText(template, currentLanguage, 'social') || '';
          } else if (eventType === 'regular_meetup') {
            text = getTemplateText(template, currentLanguage, 'regular') || '';
          } else {
            text =
              getTemplateText(template, currentLanguage, 'default') ||
              getTemplateText(template, currentLanguage) ||
              '';
          }
          break;
        }

        case 'new_club':
          if (item.metadata?.milestone) {
            text = getTemplateText(template, currentLanguage, 'milestone') || '';
          } else {
            text =
              getTemplateText(template, currentLanguage, 'created') ||
              getTemplateText(template, currentLanguage) ||
              '';
          }
          break;

        case 'league_winner':
          // Special case for coaching credit
          if (item.metadata?.coachCredit) {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const coachTemplate = FEED_TEMPLATES?.['coaching_success'] as Record<string, any>;
            /* eslint-enable @typescript-eslint/no-explicit-any */
            text = getTemplateText(coachTemplate, currentLanguage) || '';
          } else {
            text = getTemplateText(template, currentLanguage) || '';
          }
          break;

        case 'new_member_joined':
          // Generate welcome message for new member
          text = t('feedCard.newMemberJoined', {
            actorName: item.actorName,
            clubName: item.clubName,
          });
          break;

        case 'league_created':
          // Generate league creation message
          text = t('feedCard.leagueCreated', {
            actorName: item.actorName,
            leagueName: item.metadata?.leagueName || t('feedCard.league'),
            clubName: item.clubName,
          });
          break;

        case 'league_registration_open':
          // Generate league registration open message - "Sign up now!" style
          text = t('feedCard.leagueRegistrationOpen', {
            leagueName: item.metadata?.leagueName || t('feedCard.league'),
            clubName: item.clubName,
          });
          break;

        case 'league_playoffs_created': {
          // Generate playoff creation message
          const playoffType = item.metadata?.playoffType === 'final' ? 'finals' : 'semifinals';
          const leagueName = item.metadata?.leagueName || t('feedCard.league');
          text = t(`feedCard.leaguePlayoffs.${playoffType}`, {
            actorName: item.actorName,
            leagueName,
          });
          break;
        }

        case 'tournament_completed': {
          // Use metadata.placement to select winner or runner_up template
          const placement = (item.metadata?.placement as string) || 'winner'; // default to winner
          text = getTemplateText(template, currentLanguage, placement) || '';
          break;
        }

        case 'league_completed': {
          // Use metadata.placement to select winner or runner_up template
          const placement = (item.metadata?.placement as string) || 'winner'; // default to winner
          text = getTemplateText(template, currentLanguage, placement) || '';
          break;
        }

        case 'club_join_request_approved': {
          // 🎯 [FIX] Show different message for self vs others
          const isSelf = item.actorId === currentUserId;
          text = getTemplateText(template, currentLanguage, isSelf ? 'self' : 'others') || '';
          break;
        }

        default:
          text = getTemplateText(template, currentLanguage) || '';
          break;
      }

      // 텍스트가 여전히 없으면 기본값 사용
      if (!text) {
        text = t('feedCard.actorActivity', { actorName: item.actorName });
      }

      return text
        .replace(/{actorName}/g, item.actorName || 'Unknown User')
        .replace(/{targetName}/g, item.targetName || '')
        .replace(/{clubName}/g, item.clubName || '')
        .replace(/{metadata\.(\w+)}/g, (_match, key) => {
          return (item.metadata?.[key] as string) || '';
        });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error generating feed text:', errorMessage);
      return t('feedCard.feedTextError');
    }
  };

  /**
   * 메타데이터 렌더링
   */
  const renderMetadata = () => {
    if (!item.metadata || Object.keys(item.metadata).length === 0) {
      return null;
    }

    const components: React.ReactNode[] = [];

    // 스코어 표시
    if (item.metadata.score) {
      components.push(
        <Chip key='score' compact style={styles.metadataChip} textStyle={styles.metadataText}>
          {String(item.metadata.score)}
        </Chip>
      );
    }

    // ELO 변화량 표시
    if (
      item.metadata.eloChange &&
      typeof item.metadata.eloChange === 'number' &&
      item.metadata.eloChange !== 0
    ) {
      const eloChange = item.metadata.eloChange as number;
      const eloColor = eloChange > 0 ? themeColors.colors.primary : themeColors.colors.error;
      components.push(
        <Chip
          key='elo'
          compact
          style={[styles.metadataChip, { backgroundColor: eloColor + '20' }]}
          textStyle={[styles.metadataText, { color: eloColor }]}
        >
          {eloChange > 0 ? '+' : ''}
          {eloChange} ELO
        </Chip>
      );
    }

    // 위치 표시
    if (item.metadata.location) {
      components.push(
        <View key='location' style={styles.locationContainer}>
          <Ionicons name='location-outline' size={12} color={themeColors.colors.onSurfaceVariant} />
          <Text style={styles.locationText}>{String(item.metadata.location)}</Text>
        </View>
      );
    }

    return components.length > 0 ? (
      <View style={styles.metadataContainer}>{components}</View>
    ) : null;
  };

  /**
   * 액션 버튼들 렌더링
   */
  const renderActions = () => {
    const actions: React.ReactNode[] = [];

    // 클럽 보기 버튼
    if (item.clubId && item.clubName && onClubPress) {
      actions.push(
        <TouchableOpacity
          key='club'
          style={styles.actionButton}
          onPress={() => onClubPress(item.clubId as string, item.clubName as string)}
        >
          <Ionicons name='business-outline' size={14} color={themeColors.colors.primary} />
          <Text style={styles.actionText}>{t('feedCard.viewClub')}</Text>
        </TouchableOpacity>
      );
    }

    // 삭제 버튼 (본인 피드만)
    if (item.actorId === currentUserId && onDelete) {
      actions.push(
        <TouchableOpacity
          key='delete'
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name='trash-outline' size={14} color={themeColors.colors.error} />
        </TouchableOpacity>
      );
    }

    return actions.length > 0 ? <View style={styles.actionsContainer}>{actions}</View> : null;
  };

  const feedColor = getFeedColor();
  const feedIconConfig = getFeedIcon();

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => onPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {/* 타입 아이콘 - 벡터 아이콘 사용 */}
            <View style={[styles.typeIcon, { backgroundColor: feedColor + '20' }]}>
              {renderFeedIcon(feedIconConfig, feedColor)}
            </View>

            {/* 사용자 정보 - 🔔 Private feed types는 "알림" 표시 */}
            <View style={styles.userInfo}>
              {isPrivateFeedType ? (
                // Private notification - show "알림" instead of user info
                <View style={styles.userProfile}>
                  <Text style={styles.userName}>{t('feedCard.notification')}</Text>
                </View>
              ) : isTeamName ? (
                // 🎯 [KIM FIX] Team name (e.g., "Daniel & Paul") - not clickable
                <View style={styles.userProfile}>
                  {item.actorPhotoURL ? (
                    <Avatar.Image
                      size={32}
                      source={{ uri: item.actorPhotoURL }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar.Text
                      size={32}
                      label={(item.actorName || 'T').charAt(0)}
                      style={[styles.avatar, { backgroundColor: feedColor }]}
                    />
                  )}
                  <Text style={styles.userName}>{item.actorName}</Text>
                </View>
              ) : (
                // Regular feed - show user info with profile photo (clickable)
                <TouchableOpacity
                  onPress={() => {
                    if (item.actorId && item.actorName) {
                      onUserPress?.(item.actorId as string, item.actorName as string);
                    }
                  }}
                  style={styles.userProfile}
                >
                  {item.actorPhotoURL ? (
                    <Avatar.Image
                      size={32}
                      source={{ uri: item.actorPhotoURL }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar.Text
                      size={32}
                      label={(item.actorName || 'U').charAt(0)}
                      style={[styles.avatar, { backgroundColor: feedColor }]}
                    />
                  )}
                  <Text style={styles.userName}>{item.actorName || t('feedCard.unknown')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 시간 */}
            <Text style={styles.timeText}>{formatRelativeTime(item.timestamp)}</Text>

            {/* 🙈 숨기기 버튼 (eye-off-outline 아이콘) */}
            {onHide && (
              <IconButton
                icon='eye-off-outline'
                size={18}
                iconColor={themeColors.colors.onSurfaceVariant}
                style={styles.hideButton}
                onPress={() => onHide(item.id)}
              />
            )}
          </View>

          {/* 메인 텍스트 */}
          <Text style={styles.feedText}>{generateFeedText()}</Text>

          {/* 메타데이터 */}
          {renderMetadata()}

          {/* 액션 버튼들 */}
          {renderActions()}
        </View>
      </TouchableOpacity>

      {/* Interaction Bar */}
      {onLike && onComment && onShare && (
        <InteractionBar
          feedId={item.id}
          liked={false}
          likeCount={Math.floor(Math.random() * 20)}
          commentCount={Math.floor(Math.random() * 10)}
          shareCount={Math.floor(Math.random() * 5)}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
        />
      )}
    </Card>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      backgroundColor: colors.surface,
    },
    touchable: {
      borderRadius: 12,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userProfile: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      marginRight: 8,
    },
    userName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.onSurface,
    },
    timeText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginRight: 8,
    },
    hideButton: {
      margin: 0,
      width: 32,
      height: 32,
    },
    feedText: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.onSurface,
      marginBottom: 12,
    },
    metadataContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    metadataChip: {
      backgroundColor: colors.surfaceVariant,
      paddingVertical: 2,
      paddingHorizontal: 8,
      minHeight: 20,
    },
    metadataText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    actionText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
  });

export default FeedCard;
