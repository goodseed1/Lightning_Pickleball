/**
 * 🎯 [OPERATION DUO] Phase 1: Backend Implementation
 *
 * Callable Cloud Function to handle match creation atomically.
 * - Validates LTR (sum for doubles)
 * - Sets correct initial status
 * - Creates invitation if needed
 *
 * @author Captain America
 * @date 2025-11-27
 * @updated 2025-12-30 - NTRP → LTR migration
 */

// ✅ [v2] Updated imports
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { validateMatchLtr, extractUserLtr } from '../utils/matchUtils';
import { sendFriendInviteNotification } from '../utils/notificationSender';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface MatchData {
  title: string;
  description?: string;
  location: string;
  // 🎯 [KIM FIX] locationDetails with coordinates for distance filtering
  locationDetails?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    name?: string;
    // 🆕 [KIM] Full address components for invitation display
    city?: string;
    state?: string;
    country?: string;
    [key: string]: unknown;
  };
  date: string;
  time: string;
  minLtr?: number;
  maxLtr?: number;
  hostLtr?: number; // 🎯 [LTR FIX] Host's individual LTR for partner selection
  // Backward compatibility: Accept legacy NTRP fields
  minNtrp?: number;
  maxNtrp?: number;
  maxParticipants?: number;
  [key: string]: unknown;
}

interface UserProfile {
  uid: string;
  displayName: string;
  ltrLevel?: string;
  ntrpLevel?: string; // Legacy field for backward compatibility
  skillLevel?: string;
  email?: string;
}

interface CreateMatchRequest {
  matchData: MatchData;
  hostProfile: UserProfile;
  partnerProfile?: UserProfile;
  gameType: string;
  invitedFriends?: string[]; // 🎯 [FRIEND INVITE] Array of user IDs to invite
}

/**
 * 🎯 [OPERATION DUO] createMatchAndInvite Cloud Function
 *
 * Creates a match and partner invitation atomically with LTR validation
 */
export const createMatchAndInvite = onCall<CreateMatchRequest>(async request => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const data = request.data;
  const auth = request.auth; // Already checked above

  const { matchData, hostProfile, partnerProfile, gameType, invitedFriends } = data;
  const isDoubles = ['mens_doubles', 'womens_doubles', 'mixed_doubles'].includes(gameType);
  const hasInvitedFriends = invitedFriends && invitedFriends.length > 0;

  logger.info('🎯 [CREATE_MATCH] Match creation request received', {
    hostId: auth.uid,
    gameType,
    isDoubles,
    hasPartner: !!partnerProfile,
    invitedFriendsCount: invitedFriends?.length || 0,
  });

  // 🆕 [KIM FIX] Fetch host display name from Firestore users collection
  let hostDisplayName = hostProfile.displayName || 'Anonymous Host';
  try {
    const hostDoc = await db.collection('users').doc(auth.uid).get();
    if (hostDoc.exists) {
      const hostData = hostDoc.data();
      hostDisplayName = hostData?.displayName || hostData?.name || hostDisplayName;
      logger.info('✅ [CREATE_MATCH] Host display name fetched from Firestore', {
        displayName: hostDisplayName,
      });
    }
  } catch (error) {
    logger.warn('⚠️ [CREATE_MATCH] Failed to fetch host display name, using fallback', {
      error: error instanceof Error ? error.message : String(error),
      fallback: hostDisplayName,
    });
  }

  // 🎯 [KIM FIX] Fetch host LTR for event display
  let hostLtrLevel: number = 5; // Default fallback (Platinum I)
  try {
    const hostUserDoc = await db.collection('users').doc(auth.uid).get();
    if (hostUserDoc.exists) {
      const hostUserData = hostUserDoc.data();
      hostLtrLevel = extractUserLtr({
        uid: auth.uid,
        displayName: hostUserData?.displayName,
        skillLevel: hostUserData?.skillLevel,
        stats: hostUserData?.stats,
        legacyStats: hostUserData?.legacyStats,
        // 🎯 [KIM FIX] Also pass profile.ltrLevel for users who set it in profile screen
        profile: hostUserData?.profile,
      });
      logger.info('📊 [CREATE_MATCH] Host LTR extracted', {
        hostLtrLevel,
        profileLtrLevel: hostUserData?.profile?.ltrLevel,
      });
    }
  } catch (error) {
    logger.warn('⚠️ [CREATE_MATCH] Failed to extract host LTR, using default', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // 2. LTR Validation (Server-side enforcement)
  // 🛡️ Use matchUtils validation for consistency
  let validation: Awaited<ReturnType<typeof validateMatchLtr>> | null = null; // 🆕 Store validation result
  if (isDoubles && partnerProfile) {
    // 🎯 [BACKWARD COMPATIBILITY] Support both minLtr/maxLtr and legacy minNtrp/maxNtrp
    const minLtr = matchData.minLtr ?? matchData.minNtrp ?? 1;
    const maxLtr = matchData.maxLtr ?? matchData.maxNtrp ?? 10;

    validation = await validateMatchLtr(auth.uid, partnerProfile.uid, gameType, minLtr, maxLtr);

    if (!validation.isValid) {
      logger.warn('❌ [CREATE_MATCH] LTR validation failed', {
        errors: validation.errors,
        hostLtr: validation.hostLtr,
        partnerLtr: validation.partnerLtr,
      });
      throw new HttpsError(
        'invalid-argument',
        `LTR validation failed: ${validation.errors.join(', ')}`
      );
    }

    logger.info('✅ [CREATE_MATCH] LTR validation passed', {
      hostLtr: validation.hostLtr,
      partnerLtr: validation.partnerLtr,
      combinedLtr: validation.combinedLtr,
    });
  }

  // 3. Determine Initial Status
  // 복식이고 파트너가 지정되었다면 'partner_pending', 아니면 'in_progress'
  const initialStatus = isDoubles && partnerProfile ? 'partner_pending' : 'in_progress';

  logger.info('📋 [CREATE_MATCH] Initial status determined', {
    status: initialStatus,
    reason: isDoubles && partnerProfile ? 'Awaiting partner acceptance' : 'Ready to go',
  });

  // 4. Transaction: Create Event & Invitation
  try {
    const result = await db.runTransaction(async transaction => {
      // A. Create Event Reference
      const eventRef = db.collection('events').doc();
      // 🎯 [KIM FIX] Build event payload without undefined values (Firestore doesn't allow undefined)
      // 🎯 [BACKWARD COMPATIBILITY] Support both minLtr/maxLtr and legacy minNtrp/maxNtrp
      const minLtr = matchData.minLtr ?? matchData.minNtrp ?? 1;
      const maxLtr = matchData.maxLtr ?? matchData.maxNtrp ?? 10;

      const eventPayload: Record<string, unknown> = {
        ...matchData,
        id: eventRef.id,
        hostId: auth.uid,
        hostName: hostDisplayName, // 🎯 [FRIEND INVITE] Store host name
        status: initialStatus,
        gameType,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // 복식일 경우 파트너 정보도 이벤트에 일부 저장 (표시용)
        hostPartnerId: partnerProfile ? partnerProfile.uid : null,
        hostPartnerName: partnerProfile ? partnerProfile.displayName : null,
        partnerAccepted: false,
        currentParticipants: 1, // 호스트 포함
        // 🎯 [KIM FIX] Add LTR info for EventCard display
        hostLtrLevel, // Host's LTR level for display
        hostLtr: matchData.hostLtr ?? hostLtrLevel, // 🎯 [LTR FIX] Host's individual LTR for partner selection (prefer client value)
        ltrLevel:
          isDoubles && validation
            ? Math.round(validation.combinedLtr! / 2) // Doubles: combined/2 as the level (rounded)
            : hostLtrLevel, // Singles: host LTR as the level
        minLtr,
        maxLtr,
        // Legacy fields for backward compatibility during migration
        hostNtrpLevel: hostLtrLevel,
        ntrpLevel:
          isDoubles && validation
            ? `${Math.round(validation.combinedLtr! / 2)}`
            : `${hostLtrLevel}`,
        minNtrp: minLtr,
        maxNtrp: maxLtr,
        participants: [
          {
            userId: auth.uid,
            name: hostProfile.displayName,
            status: 'approved',
            joinedAt: new Date().toISOString(),
          },
        ],
        // 🎯 [FRIEND INVITE] If friends are invited, make event private (invite-only)
        isPublic: !hasInvitedFriends,
        isInviteOnly: hasInvitedFriends,
      };

      // 🎯 [KIM FIX] Only add partnerStatus if partner exists (avoid undefined)
      if (partnerProfile) {
        eventPayload.partnerStatus = 'pending';
      }

      // 🎯 [FRIEND INVITE] Store invited friends list with pending status
      if (hasInvitedFriends) {
        eventPayload.invitedFriends = invitedFriends;
        eventPayload.friendInvitations = invitedFriends.map(friendId => ({
          userId: friendId,
          status: 'pending',
          invitedAt: new Date().toISOString(),
        }));
      }

      transaction.set(eventRef, eventPayload);

      logger.info('📝 [CREATE_MATCH] Event document created', {
        eventId: eventRef.id,
        status: initialStatus,
      });

      // B. Create Invitation (if doubles)
      if (isDoubles && partnerProfile && validation) {
        const inviteRef = db.collection('partner_invitations').doc();
        const invitePayload = {
          id: inviteRef.id,
          eventId: eventRef.id,
          eventTitle: matchData.title,
          eventDate: matchData.date,
          eventTime: matchData.time,
          eventLocation: matchData.location,
          // 🆕 [KIM] Full address components for locale-based display
          ...(matchData.locationDetails?.city && { eventCity: matchData.locationDetails.city }),
          ...(matchData.locationDetails?.state && { eventState: matchData.locationDetails.state }),
          ...(matchData.locationDetails?.country && {
            eventCountry: matchData.locationDetails.country,
          }),
          gameType, // 🆕 [KIM FIX] Add game type
          inviterId: auth.uid,
          inviterName: hostDisplayName, // 🆕 [KIM FIX] Use Firestore-fetched display name
          inviterLtr: validation.hostLtr, // 🆕 [KIM FIX] Show inviter LTR on invitation card
          invitedUserId: partnerProfile.uid, // 🆕 [KIM FIX] Fixed field name
          invitedUserName: partnerProfile.displayName, // 🆕 [KIM FIX] Fixed field name
          combinedLtr: validation.combinedLtr, // 🆕 [KIM FIX] Add combined LTR
          // Legacy fields for backward compatibility during migration
          inviterNtrp: validation.hostLtr,
          combinedNtrp: validation.combinedLtr,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        transaction.set(inviteRef, invitePayload);

        logger.info('📨 [CREATE_MATCH] Partner invitation created', {
          inviteId: inviteRef.id,
          inviteeId: partnerProfile.uid,
          expiresIn: '24 hours',
        });
      }

      return { eventId: eventRef.id };
    });

    logger.info('✅ [CREATE_MATCH] Transaction completed successfully', {
      eventId: result.eventId,
    });

    // 🎯 [FRIEND INVITE] Send push notifications to invited friends (outside transaction)
    if (hasInvitedFriends && invitedFriends) {
      logger.info('📨 [CREATE_MATCH] Sending push notifications to invited friends', {
        count: invitedFriends.length,
      });

      // Fire-and-forget: send notifications without waiting
      const notificationPromises = invitedFriends.map(friendId =>
        sendFriendInviteNotification(
          friendId,
          hostDisplayName,
          matchData.title,
          result.eventId
        ).catch(error => {
          logger.warn('⚠️ [CREATE_MATCH] Failed to send notification to friend', {
            friendId,
            error: error instanceof Error ? error.message : String(error),
          });
        })
      );

      // Don't await - let notifications send in background
      Promise.all(notificationPromises).then(() => {
        logger.info('✅ [CREATE_MATCH] Friend invite notifications completed', {
          total: invitedFriends.length,
        });
      });
    }

    return { success: true, eventId: result.eventId };
  } catch (error) {
    logger.error('❌ [CREATE_MATCH] Transaction failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError('internal', 'Failed to create match and invitation');
  }
});
