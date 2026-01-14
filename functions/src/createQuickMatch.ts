/**
 * ⚡ [QUICK MATCH] Create Quick Match Cloud Function
 *
 * Creates a quick match (⚡) invitation with validation:
 * - Gender matching (same gender only)
 * - LPR validation (target.ltr <= host.ltr + 1)
 * - Auto-creates event chat room
 * - Sends push notification to target
 *
 * @author Kim
 * @date 2025-12-11
 * @updated 2025-12-30 - NTRP → LPR migration
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { hasRecentSinglesMatch, formatDateKorean } from './utils/matchCooldownUtils';
import { getQuickMatchNotification } from './utils/notificationSender';

// 🌍 [i18n] Supported notification languages
type NotificationLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

interface CreateQuickMatchRequest {
  targetUserId: string;
}

/**
 * Extract numeric LPR from user data
 * Priority: skillLevel (number) → profile.skillLevel.selfAssessed → default 5
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNumericLtr = (userData: Record<string, any>): number => {
  // 1. Root level skillLevel (number)
  if (typeof userData.skillLevel === 'number') {
    return Math.round(userData.skillLevel); // Ensure integer
  }

  // 2. profile.skillLevel object
  const profileSkill = userData.profile?.skillLevel;
  if (typeof profileSkill === 'object' && profileSkill?.selfAssessed) {
    // "3-5" → 4 (parse average and round)
    const range = profileSkill.selfAssessed;
    const parts = range.split('-').map((s: string) => parseFloat(s));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return Math.round((parts[0] + parts[1]) / 2);
    }
    // Single value
    const value = parseFloat(range);
    return isNaN(value) ? 5 : Math.round(value);
  }

  // 3. Default LPR
  return 5; // Platinum I
};

/**
 * Create Quick Match Cloud Function
 *
 * Creates a quick match invitation with validation
 */
export const createQuickMatch = onCall<CreateQuickMatchRequest>(async request => {
  const { data, auth } = request;

  // 1. Authentication check
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to create quick match');
  }

  const { targetUserId } = data;
  const hostUserId = auth.uid;

  // 2. Validate input
  if (!targetUserId) {
    throw new HttpsError('invalid-argument', 'targetUserId is required');
  }

  if (targetUserId === hostUserId) {
    throw new HttpsError('invalid-argument', 'Cannot challenge yourself');
  }

  try {
    logger.info('⚡ [QUICK_MATCH] Starting quick match creation', {
      hostUserId,
      targetUserId,
    });

    // 3. Fetch host and target user data
    const [hostDoc, targetDoc] = await Promise.all([
      db.collection('users').doc(hostUserId).get(),
      db.collection('users').doc(targetUserId).get(),
    ]);

    if (!hostDoc.exists) {
      throw new HttpsError('not-found', 'Host user not found');
    }

    if (!targetDoc.exists) {
      throw new HttpsError('not-found', 'Target user not found');
    }

    const hostData = hostDoc.data()!;
    const targetData = targetDoc.data()!;

    // 4. Extract user info
    const hostGender = hostData.gender || hostData.profile?.gender || 'male';
    const targetGender = targetData.gender || targetData.profile?.gender || 'male';

    const hostLtr = getNumericLtr(hostData);
    const targetLtr = getNumericLtr(targetData);

    const hostDisplayName = hostData.displayName || hostData.name || 'Anonymous';
    const targetDisplayName = targetData.displayName || targetData.name || 'Anonymous';

    const hostNickname = hostData.nickname || hostDisplayName;
    const targetNickname = targetData.nickname || targetDisplayName;

    const hostProfileImage = hostData.profileImage || hostData.photoURL || null;

    // 🌤️ [KIM FIX] Extract host location for weather display
    // Priority: profile.location → root location
    const hostLocation = hostData.profile?.location || hostData.location;
    const hostCoordinates = (() => {
      if (!hostLocation) return null;

      // Handle different coordinate field names
      const lat = hostLocation.lat ?? hostLocation.latitude;
      const lng = hostLocation.lng ?? hostLocation.longitude;

      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }
      return null;
    })();

    logger.info('🌤️ [QUICK_MATCH] Host location extracted', {
      hasHostLocation: !!hostLocation,
      hasCoordinates: !!hostCoordinates,
      coordinates: hostCoordinates,
    });

    logger.info('⚡ [QUICK_MATCH] User data extracted', {
      hostGender,
      targetGender,
      hostLtr,
      targetLtr,
      hostNickname,
      targetNickname,
    });

    // 5. Gender validation
    if (hostGender !== targetGender) {
      throw new HttpsError(
        'invalid-argument',
        `퀵 매치는 같은 성별끼리만 가능합니다. (당신: ${hostGender === 'male' ? '남성' : '여성'}, 상대: ${targetGender === 'male' ? '남성' : '여성'})`
      );
    }

    // 6. LPR validation: target.ltr <= host.ltr + 1
    if (targetLtr > hostLtr + 1) {
      throw new HttpsError(
        'invalid-argument',
        `퀵 매치는 본인 LPR + 1 이하의 상대에게만 신청 가능합니다. (당신: ${hostLtr}, 상대: ${targetLtr})`
      );
    }

    logger.info('✅ [QUICK_MATCH] Validation passed', {
      genderMatch: true,
      ltrValid: true,
    });

    // 🆕 [3개월 규칙] Check for recent match history
    const recentMatch = await hasRecentSinglesMatch(hostUserId, targetUserId, 3);

    const isRankedMatch = !recentMatch.hasMatch;
    const cooldownWarning = recentMatch.hasMatch
      ? `${formatDateKorean(recentMatch.lastMatchDate!)}에 경기한 이력이 있어 친선경기로 진행됩니다.`
      : null;

    logger.info('📊 [QUICK_MATCH] Match type determined', {
      isRankedMatch,
      hasRecentMatch: recentMatch.hasMatch,
      lastMatchDate: recentMatch.lastMatchDate?.toISOString() || null,
      cooldownWarning,
    });

    // 7. Transaction: Create Event & Chat Room
    const result = await db.runTransaction(async transaction => {
      const eventRef = db.collection('events').doc();
      const eventId = eventRef.id;

      // Event data
      const eventData = {
        id: eventId,
        title: `${hostNickname} vs ${targetNickname}`,
        type: 'match',
        gameType: hostGender === 'male' ? 'mens_singles' : 'womens_singles',
        ltrLevel: Math.max(hostLtr, targetLtr),
        // Legacy field for backward compatibility during migration
        ntrpLevel: Math.max(hostLtr, targetLtr).toString(),

        hostId: hostUserId,
        hostName: hostDisplayName,
        hostNickname: hostNickname,
        ...(hostProfileImage && { hostProfileImage: hostProfileImage }),

        // 🌤️ [KIM FIX] Location TBD but use host location for weather
        // Quick match = "let's play now" so default time is now + 1 hour
        location: 'TBD',
        scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // Now + 1 hour

        // 🌤️ [KIM FIX] Store host coordinates for weather display
        // Even with TBD location, we can show weather based on host's area
        ...(hostCoordinates && {
          placeDetails: {
            coordinates: hostCoordinates,
          },
        }),

        maxParticipants: 2,
        currentParticipants: 1,

        // Invite-only
        isPublic: false,
        isInviteOnly: true,
        invitedFriends: [targetUserId],
        friendInvitations: [
          {
            userId: targetUserId,
            status: 'pending',
            invitedAt: new Date().toISOString(),
          },
        ],

        status: 'pending_acceptance',

        // 🆕 [3개월 규칙] Ranked match flag
        isRankedMatch,
        ...(cooldownWarning && { cooldownWarning }),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(eventRef, eventData);

      logger.info('📝 [QUICK_MATCH] Event document created', {
        eventId,
        title: eventData.title,
      });

      // 🌍 [i18n] Get localized chat message (use host's language for system message)
      const hostLang =
        hostData.preferredLanguage || hostData.language || hostData.preferences?.language || 'ko';
      const chatNotification = getQuickMatchNotification(
        hostLang as NotificationLanguage,
        isRankedMatch,
        hostNickname,
        hostLtr
      );

      // Chat room data
      const chatRoomRef = db.collection('event_chat_rooms').doc(eventId);
      const chatRoomData = {
        eventId: eventId,
        eventTitle: eventData.title,
        participants: [hostUserId, targetUserId],
        createdAt: serverTimestamp(),
        lastMessage: {
          text: chatNotification.chatMessage,
          senderId: 'system',
          timestamp: serverTimestamp(),
        },
      };

      transaction.set(chatRoomRef, chatRoomData);

      logger.info('💬 [QUICK_MATCH] Chat room created', {
        eventId,
        participants: [hostUserId, targetUserId],
      });

      return { eventId };
    });

    logger.info('✅ [QUICK_MATCH] Transaction completed', {
      eventId: result.eventId,
    });

    // 8. Send push notification to target (outside transaction)
    // 🌍 [i18n] Send notification in target user's language
    try {
      const targetPushToken = targetData.pushToken;

      if (targetPushToken) {
        // Get target user's language
        const targetLang =
          targetData.preferredLanguage ||
          targetData.language ||
          targetData.preferences?.language ||
          'ko';

        const notification = getQuickMatchNotification(
          targetLang as NotificationLanguage,
          isRankedMatch,
          hostNickname,
          hostLtr
        );

        const message = {
          to: targetPushToken,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: {
            type: 'quick_match_invite',
            notificationType: 'quick_match_invite',
            eventId: result.eventId,
            hostId: hostUserId,
            hostName: hostNickname,
            hostLtr: String(hostLtr),
          },
          priority: 'high',
          channelId: 'events',
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        const pushResult = await response.json();

        if (pushResult.errors) {
          logger.warn('⚠️ [QUICK_MATCH] Push notification failed', {
            errors: pushResult.errors,
          });
        } else {
          logger.info('✅ [QUICK_MATCH] Push notification sent', {
            targetUserId,
            targetLanguage: targetLang,
            ticketId: pushResult.data?.id,
          });
        }
      } else {
        logger.info('⚠️ [QUICK_MATCH] Target user has no push token', {
          targetUserId,
        });
      }
    } catch (pushError) {
      logger.warn('⚠️ [QUICK_MATCH] Push notification error (non-critical)', {
        error: pushError instanceof Error ? pushError.message : String(pushError),
      });
    }

    // 🆕 [3개월 규칙] 반환 메시지에 친선경기 여부 포함
    const responseMessage = isRankedMatch
      ? `${targetNickname}님에게 기록 매치를 신청했습니다!`
      : `${targetNickname}님에게 친선 매치를 신청했습니다! (3개월 내 경기 이력으로 기록경기 불가)`;

    return {
      success: true,
      eventId: result.eventId,
      message: responseMessage,
      isRankedMatch,
      cooldownWarning,
    };
  } catch (error: unknown) {
    logger.error('❌ [QUICK_MATCH] Error creating quick match', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', 'Failed to create quick match', errorMessage);
  }
});
