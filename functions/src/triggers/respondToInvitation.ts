/**
 * 🎯 [OPERATION DUO] Phase 3: The Handshake
 *
 * Callable Cloud Function to handle partner invitation responses.
 * - Accept: Update invitation status + activate match (set status to 'in_progress')
 * - Reject: Update invitation status only
 * - Transaction ensures atomic updates
 *
 * @author Kim
 * @date 2025-11-27
 */

// ✅ [v2] Firebase Functions v2 API
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import {
  sendPartnerInviteAcceptedNotification,
  sendPartnerInviteRejectedNotification,
} from '../utils/partnerNotificationSender';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface RespondToInvitationRequest {
  invitationId: string;
  accept: boolean;
}

/**
 * 🎯 [OPERATION DUO] respondToInvitation Cloud Function
 *
 * Handles partner invitation acceptance/rejection with atomic transaction
 */
export const respondToInvitation = onCall<RespondToInvitationRequest>(async request => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be logged in.');
  }

  const auth = request.auth;
  const { invitationId, accept } = request.data;

  logger.info('🤝 [RESPOND_INVITATION] Invitation response received', {
    invitationId,
    accept,
    responderId: auth.uid,
  });

  // 2. Transaction: Update Invitation + Event (if accepted)
  try {
    const result = await db.runTransaction(async transaction => {
      // ✅ PHASE 1: ALL READS FIRST (Firestore transaction requirement)

      // A. Get Invitation Document
      const inviteRef = db.collection('partner_invitations').doc(invitationId);
      const inviteDoc = await transaction.get(inviteRef);

      if (!inviteDoc.exists) {
        throw new HttpsError('not-found', 'Invitation not found');
      }

      const inviteData = inviteDoc.data();
      if (!inviteData) {
        throw new HttpsError('internal', 'Invalid invitation data');
      }

      // B. Security: Verify the requester is the invitee
      if (inviteData.invitedUserId !== auth.uid) {
        logger.warn('🚫 [RESPOND_INVITATION] Unauthorized attempt', {
          invitedUserId: inviteData.invitedUserId,
          requesterId: auth.uid,
        });
        throw new HttpsError('permission-denied', 'You are not the invitee');
      }

      // C. Check if already responded
      if (inviteData.status !== 'pending') {
        logger.warn('⚠️ [RESPOND_INVITATION] Invitation already responded', {
          currentStatus: inviteData.status,
        });
        throw new HttpsError('failed-precondition', `Invitation already ${inviteData.status}`);
      }

      // 🎯 [OPERATION DUO - PHASE 2A] Check 24-hour expiry (Requirement #4)
      if (inviteData.expiresAt) {
        const expiryTime =
          inviteData.expiresAt instanceof admin.firestore.Timestamp
            ? inviteData.expiresAt.toDate()
            : new Date(inviteData.expiresAt);
        const now = new Date();

        if (now > expiryTime) {
          logger.warn('⏰ [RESPOND_INVITATION] Invitation expired', {
            expiresAt: expiryTime.toISOString(),
            now: now.toISOString(),
          });
          throw new HttpsError('failed-precondition', 'Invitation has expired after 24 hours');
        }
      }

      // D. Get Event Document (READ before WRITE!)
      const eventRef = db.collection('events').doc(inviteData.eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new HttpsError('not-found', 'Associated event not found');
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        throw new HttpsError('internal', 'Invalid event data');
      }

      // E. 🎯 [KIM FIX] Pre-read Application Document if team application (for both accept and reject)
      let applicationDoc = null;
      if (inviteData.applicationType === 'team_application' && inviteData.applicationId) {
        const applicationRef = db
          .collection('participation_applications')
          .doc(inviteData.applicationId);
        applicationDoc = await transaction.get(applicationRef);
      }

      // ✅ PHASE 2: ALL WRITES AFTER ALL READS

      // E. Update Invitation Status
      const newStatus = accept ? 'accepted' : 'rejected';
      transaction.update(inviteRef, {
        status: newStatus,
        respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`📝 [RESPOND_INVITATION] Invitation updated to ${newStatus}`, {
        invitationId,
      });

      // F. Update Event or Application based on response and invitation type
      if (accept) {
        // 🎯 [OPERATION DUO - PHASE 2A] Check if this is a team application invitation
        if (inviteData.applicationType === 'team_application' && inviteData.applicationId) {
          // Team application: Update application status to 'pending' (visible to host)
          const applicationRef = db
            .collection('participation_applications')
            .doc(inviteData.applicationId);

          if (applicationDoc && applicationDoc.exists) {
            transaction.update(applicationRef, {
              status: 'pending', // 🚨 Now visible to host!
              partnerStatus: 'accepted',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(
              '✅ [RESPOND_INVITATION] Team application updated to pending (partner accepted)',
              {
                eventId: inviteData.eventId,
                applicationId: inviteData.applicationId,
                partnerId: auth.uid,
                partnerName: inviteData.invitedUserName,
              }
            );

            // 🎯 [OPERATION DUO] Single Document Architecture
            // Partner can see this application via composite query: partnerId == user.uid
            // No separate partner application needed - reduces duplication
            logger.info(
              '📋 [RESPOND_INVITATION] Using single document architecture - no duplicate partner application',
              {
                note: 'Partner will see this via partnerId query in ActivityContext',
              }
            );

            // 🆕 [KIM FIX] Update event's updatedAt to trigger host's real-time listener
            // This ensures the host sees the new pending application without reload
            transaction.update(eventRef, {
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(
              '📝 [RESPOND_INVITATION] Updated event updatedAt for host real-time refresh',
              {
                eventId: inviteData.eventId,
              }
            );
          }
        } else {
          // Regular match invitation: Update event status to 'recruiting'
          transaction.update(eventRef, {
            status: 'recruiting', // 💥 [PHASE 4.5] Open to public after partner accepts
            partnerAccepted: true,
            partnerStatus: 'accepted', // 💥 [KIM FIX] Update partner status for UI display
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Add partner to participants list
            participants: admin.firestore.FieldValue.arrayUnion({
              userId: auth.uid,
              name: inviteData.invitedUserName,
              status: 'approved',
              joinedAt: new Date().toISOString(),
              isHostPartner: true, // 💥 [PHASE 4.5] Mark as host's partner
            }),
            currentParticipants: admin.firestore.FieldValue.increment(1),
          });

          // 💥 [PHASE 4.5 CRITICAL FIX] Create participation_applications for partner
          // Without this, partner won't see the match in their "Applied Events" list!
          const applicationRef = db.collection('participation_applications').doc();
          transaction.set(applicationRef, {
            eventId: inviteData.eventId,
            applicantId: auth.uid,
            applicantName: inviteData.invitedUserName || 'Partner', // 🎯 [KIM FIX v27] Add partner's name
            status: 'approved', // Partner is auto-approved
            appliedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            type: 'partner_invitation', // Mark as partner invitation (not manual application)
            // 🎯 [KIM FIX v27] Add host as "partner" from partner's perspective
            // This enables AppliedEventCard to show team LTR for host partners
            partnerId: eventData.hostId,
            partnerName: eventData.hostName || 'Host',
            partnerStatus: 'accepted', // Host is always "accepted" from partner's view
            // 🎯 [KIM FIX] Add hostId for badge count queries
            ...(eventData.hostId && { hostId: eventData.hostId }),
          });

          logger.info('✅ [RESPOND_INVITATION] Event activated (partner accepted)', {
            eventId: inviteData.eventId,
            partnerId: auth.uid,
            applicationCreated: applicationRef.id,
          });
        }
      } else {
        // Rejected: Distinguish between team application vs event host invitation
        if (inviteData.applicationType === 'team_application' && inviteData.applicationId) {
          // 🎯 [KIM FIX] Team application partner rejection: Update APPLICATION only, NOT event!
          const applicationRef = db
            .collection('participation_applications')
            .doc(inviteData.applicationId);

          if (applicationDoc && applicationDoc.exists) {
            transaction.update(applicationRef, {
              status: 'pending_partner_approval', // Keep as pending partner (can re-invite)
              partnerStatus: 'rejected',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(
              '❌ [RESPOND_INVITATION] Team application partner rejected (event stays on Discovery)',
              {
                eventId: inviteData.eventId,
                applicationId: inviteData.applicationId,
                rejectedPartnerId: auth.uid,
              }
            );
          }
        } else {
          // Event host partner rejection: Update EVENT status
          const rejectionRecord = {
            partnerId: inviteData.invitedUserId,
            ...(inviteData.invitedUserName && { partnerName: inviteData.invitedUserName }),
            rejectedAt: new Date(), // 🚨 [KIM FIX] Cannot use serverTimestamp() inside arrayUnion!
          };

          transaction.update(eventRef, {
            status: 'partner_pending', // Keep event alive for re-invitation
            partnerAccepted: false,
            partnerStatus: 'rejected', // 🛡️ [CAPTAIN AMERICA] New field for UI display
            // Keep legacy fields for compatibility
            lastRejectedPartnerId: inviteData.invitedUserId,
            ...(inviteData.invitedUserName && {
              lastRejectedPartnerName: inviteData.invitedUserName,
            }),
            lastRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            // 🆕 [KIM] Add to rejection history array
            rejectedPartners: admin.firestore.FieldValue.arrayUnion(rejectionRecord),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          logger.info(
            '❌ [RESPOND_INVITATION] Event host partner rejected (event kept alive for re-invitation)',
            {
              eventId: inviteData.eventId,
              rejectedPartnerId: inviteData.invitedUserId,
            }
          );
        }
      }

      return {
        invitationId,
        status: newStatus,
        eventId: inviteData.eventId,
        inviteData, // Return invitation data for notification sending
        eventData, // Return event data for notification sending
      };
    });

    logger.info('✅ [RESPOND_INVITATION] Transaction completed successfully', {
      result,
    });

    // 💥 [PHASE 4.6] Send notification to host (after transaction completes)
    try {
      // 🎯 [KIM FIX] Create in-app notification in Firestore (for home feed display)
      const notificationType = accept ? 'PARTNER_INVITE_ACCEPTED' : 'PARTNER_INVITE_REJECTED';
      const notificationMessage = accept
        ? `${result.inviteData.invitedUserName}님이 '${result.inviteData.eventTitle}' 번개매치 파트너 초대를 수락했습니다!`
        : `${result.inviteData.invitedUserName}님이 '${result.inviteData.eventTitle}' 번개매치 파트너 초대를 거절했습니다.`;

      try {
        await db.collection('notifications').add({
          recipientId: result.inviteData.inviterId, // Host receives the notification
          type: notificationType,
          eventId: result.inviteData.eventId,
          eventType: 'match',
          message: notificationMessage,
          relatedInvitationId: invitationId,
          ...(result.inviteData.invitedUserName && {
            responderName: result.inviteData.invitedUserName,
          }),
          ...(result.inviteData.inviterName && { inviterName: result.inviteData.inviterName }),
          eventTitle: result.inviteData.eventTitle,
          gameType: result.inviteData.gameType,
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            notificationType: accept ? 'partner_accepted' : 'partner_rejected',
            actionRequired: !accept, // If rejected, host may need to find new partner
            deepLink: `events/${result.inviteData.eventId}`,
          },
        });
        logger.info(
          `✅ [RESPOND_INVITATION] In-app notification created for host (${notificationType})`
        );
      } catch (notifError) {
        logger.warn('⚠️ [RESPOND_INVITATION] Failed to create in-app notification:', {
          error: notifError instanceof Error ? notifError.message : String(notifError),
        });
      }

      // 🎯 [KIM FIX v2] Create feed item for home feed display
      const feedType = accept ? 'partner_invite_accepted' : 'partner_invite_rejected';
      try {
        await db.collection('feed').add({
          type: feedType,
          actorId: auth.uid, // Partner who accepted/rejected
          actorName: result.inviteData.invitedUserName || 'Unknown',
          targetId: result.inviteData.inviterId, // Host who sent invitation
          targetName: result.inviteData.inviterName || 'Unknown',
          eventId: result.inviteData.eventId,
          eventTitle: result.inviteData.eventTitle,
          metadata: {
            eventType: 'match',
            gameType: result.inviteData.gameType,
            invitationId: invitationId,
            inviteStatus: accept ? 'accepted' : 'rejected',
          },
          visibility: 'private', // Only visible to host
          visibleTo: [result.inviteData.inviterId], // Host sees this in their feed
          isActive: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`✅ [RESPOND_INVITATION] Feed item created for host (${feedType})`);
      } catch (feedError) {
        logger.warn('⚠️ [RESPOND_INVITATION] Failed to create feed item:', {
          error: feedError instanceof Error ? feedError.message : String(feedError),
        });
      }

      if (accept) {
        // Partner accepted - notify host (push notification)
        await sendPartnerInviteAcceptedNotification(
          invitationId,
          result.inviteData.inviterId,
          result.inviteData.inviterName,
          auth.uid,
          result.inviteData.invitedUserName,
          result.inviteData.eventId,
          result.inviteData.eventTitle,
          result.inviteData.gameType
        );
        logger.info('📲 [RESPOND_INVITATION] Acceptance push notification sent to host');

        // 🆕 [KIM FIX] Update host partner's application to trigger their real-time listener
        // 철수 (host's partner) views the event from "참여 신청한 모임" tab
        // When guest team partner (광수) accepts, 철수 should see the pending application
        if (result.inviteData.applicationType === 'team_application') {
          try {
            const hostPartnerAppQuery = await db
              .collection('participation_applications')
              .where('eventId', '==', result.eventId)
              .where('type', '==', 'partner_invitation')
              .where('status', '==', 'approved')
              .get();

            if (!hostPartnerAppQuery.empty) {
              const batch = db.batch();
              for (const partnerAppDoc of hostPartnerAppQuery.docs) {
                batch.update(partnerAppDoc.ref, {
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(
                  '📝 [RESPOND_INVITATION] Updating host partner application for real-time refresh',
                  {
                    partnerAppId: partnerAppDoc.id,
                    partnerId: partnerAppDoc.data().applicantId,
                  }
                );
              }
              await batch.commit();
            }
          } catch (updateError) {
            logger.warn('⚠️ [RESPOND_INVITATION] Failed to update host partner application:', {
              error: updateError instanceof Error ? updateError.message : String(updateError),
            });
          }
        }
      } else {
        // Partner rejected - notify host
        await sendPartnerInviteRejectedNotification(
          invitationId,
          result.inviteData.inviterId,
          result.inviteData.inviterName,
          auth.uid,
          result.inviteData.invitedUserName,
          result.inviteData.eventId,
          result.inviteData.eventTitle,
          result.inviteData.gameType
        );
        logger.info('📲 [RESPOND_INVITATION] Rejection push notification sent to host');
      }
    } catch (notificationError) {
      // Log but don't fail the response - notification is not critical
      logger.warn('⚠️ [RESPOND_INVITATION] Failed to send notification to host:', {
        error:
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError),
      });
    }

    return {
      success: true,
      invitationId: result.invitationId,
      status: result.status,
      eventId: result.eventId,
    };
  } catch (error) {
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error('❌ [RESPOND_INVITATION] Transaction failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError('internal', 'Failed to process invitation response');
  }
});
