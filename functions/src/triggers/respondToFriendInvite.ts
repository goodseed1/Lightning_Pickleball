/**
 * 🎯 [FRIEND INVITE] Respond to Friend Invitation
 *
 * Cloud Function to handle friend invitation acceptance or rejection
 * - Accept: Marks invitation as accepted, adds user to event participants
 * - Reject: Marks invitation as rejected
 *
 * @author Kim (킴)
 * @date 2025-12-10
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface RespondToFriendInviteRequest {
  eventId: string;
  response: 'accept' | 'reject';
}

/**
 * Respond to a friend invitation
 */
export const respondToFriendInvite = onCall<RespondToFriendInviteRequest>(async request => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { eventId, response } = request.data;
  const userId = request.auth.uid;

  logger.info('🎯 [FRIEND_INVITE] Processing invitation response', {
    eventId,
    userId,
    response,
  });

  // 2. Validate input
  if (!eventId || !response) {
    throw new HttpsError('invalid-argument', 'eventId and response are required');
  }

  if (response !== 'accept' && response !== 'reject') {
    throw new HttpsError('invalid-argument', 'response must be "accept" or "reject"');
  }

  try {
    // 3. Get event document
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data();
    if (!eventData) {
      throw new HttpsError('internal', 'Event data is empty');
    }

    // 4. Check if user is in the invited friends list
    const friendInvitations = eventData.friendInvitations as
      | Array<{ userId: string; status: string; invitedAt: string }>
      | undefined;

    if (!friendInvitations || friendInvitations.length === 0) {
      throw new HttpsError('failed-precondition', 'No friend invitations found for this event');
    }

    const invitationIndex = friendInvitations.findIndex(inv => inv.userId === userId);
    if (invitationIndex === -1) {
      throw new HttpsError('permission-denied', 'You are not invited to this event');
    }

    const currentInvitation = friendInvitations[invitationIndex];
    if (currentInvitation.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Invitation already ${currentInvitation.status}`);
    }

    // 5. Get user info for participant data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName =
      userData?.fullName || userData?.name || userData?.displayName || 'Unknown User';

    // 6. Update invitation status
    const newStatus = response === 'accept' ? 'accepted' : 'rejected';
    const updatedInvitations = [...friendInvitations];
    updatedInvitations[invitationIndex] = {
      ...currentInvitation,
      status: newStatus,
    };

    // 7. Prepare update data
    const updateData: Record<string, unknown> = {
      friendInvitations: updatedInvitations,
    };

    // 8. If accepting, add user to participants and create application document
    if (response === 'accept') {
      const participants = eventData.participants || [];
      const currentParticipants = eventData.currentParticipants || participants.length;

      // Add to participants array
      participants.push({
        userId,
        name: userName,
        status: 'approved',
        joinedAt: new Date().toISOString(),
        joinedVia: 'friend_invite',
      });

      updateData.participants = participants;
      updateData.currentParticipants = currentParticipants + 1;

      // 🎯 [FRIEND INVITE] Create participation_applications document
      // This ensures the event appears in the user's Applied tab after acceptance
      const applicationData = {
        eventId,
        applicantId: userId,
        applicantName: userName,
        status: 'approved',
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: eventData.hostId || 'system',
        message: 'friend_invite_accepted', // Translation key - client will translate
        joinedVia: 'friend_invite',
        // 🎯 [KIM FIX] Add hostId for badge count queries
        ...(eventData.hostId && { hostId: eventData.hostId }),
      };

      await db.collection('participation_applications').add(applicationData);

      logger.info('✅ [FRIEND_INVITE] User accepted invitation, added to participants', {
        eventId,
        userId,
        userName,
        newParticipantCount: currentParticipants + 1,
      });

      // 9. Check if all invitations are responded (to potentially make event public)
      const allResponded = updatedInvitations.every(inv => inv.status !== 'pending');
      const anyAccepted = updatedInvitations.some(inv => inv.status === 'accepted');

      if (allResponded && anyAccepted) {
        // At least one accepted, event can stay invite-only but is now "active"
        logger.info('📋 [FRIEND_INVITE] All invitations responded, event proceeding', {
          eventId,
          acceptedCount: updatedInvitations.filter(inv => inv.status === 'accepted').length,
        });
      }
    } else {
      logger.info('❌ [FRIEND_INVITE] User rejected invitation', {
        eventId,
        userId,
      });
    }

    // 10. Save update
    await eventRef.update(updateData);

    logger.info('✅ [FRIEND_INVITE] Invitation response saved successfully', {
      eventId,
      userId,
      response,
    });

    // 11. 🎾 [KIM FIX] Create feed notification for the host
    // Host should see a feed item when invited player accepts/rejects
    const hostId = eventData.hostId;
    if (hostId && hostId !== userId) {
      try {
        const feedType = response === 'accept' ? 'match_invite_accepted' : 'match_invite_rejected';

        const feedItem = {
          type: feedType,
          actorId: userId,
          actorName: userName,
          targetId: hostId,
          eventId: eventId,
          metadata: {
            eventTitle: eventData.title || 'Match',
            response: response,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          visibility: 'private',
          visibleTo: [hostId], // Only visible to the host
        };

        await db.collection('feed').add(feedItem);

        logger.info('📰 [FRIEND_INVITE] Feed notification created for host', {
          hostId,
          feedType,
          actorName: userName,
        });
      } catch (feedError) {
        // Don't fail the main operation if feed creation fails
        logger.warn('⚠️ [FRIEND_INVITE] Failed to create feed notification', {
          error: feedError instanceof Error ? feedError.message : String(feedError),
        });
      }
    }

    return {
      success: true,
      message: response === 'accept' ? 'Invitation accepted' : 'Invitation rejected',
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [FRIEND_INVITE] Error processing invitation response', {
      eventId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError('internal', 'Failed to process invitation response');
  }
});
