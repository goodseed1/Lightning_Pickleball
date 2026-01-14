/**
 * ⚡ [OPERATION DUO] Partner Invitation Notification & Feed Trigger
 *
 * Automatically creates notifications and feed items when partner invitations are created.
 * This ensures proper authorization using admin privileges (bypasses client security rules).
 *
 * Trigger: partner_invitations/{invitationId} onCreate
 * Condition: status === 'pending'
 * Actions:
 *  - Create notification in notifications collection
 *  - Create feed item in feed collection
 *  - Both use admin privileges (secure)
 *
 * Why Cloud Function?
 *  - Client-side writes to notifications/feed collections blocked by security rules (correct)
 *  - Cloud Functions have admin privileges
 *  - Centralized logic, better security
 *  - Consistent with push notification pattern (sendPushOnPartnerInvite)
 *
 * @author Kim
 * @date 2025-11-28
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const onPartnerInviteCreated = onDocumentCreated(
  'partner_invitations/{invitationId}',
  async event => {
    const invitation = event.data?.data();
    const invitationId = event.params.invitationId;

    if (!invitation) {
      logger.warn('⚠️ [PARTNER HERALD] No invitation data');
      return null;
    }

    logger.info('⚡ [PARTNER HERALD] Partner invitation document created:', {
      invitationId,
      status: invitation.status,
      inviter: invitation.inviterName,
      invitee: invitation.invitedUserName, // 🆕 [KIM FIX] Fixed field name
      eventId: invitation.eventId,
    });

    // 🎯 Only process pending partner invitations
    if (invitation.status !== 'pending') {
      logger.info(
        'ℹ️ [PARTNER HERALD] Invitation status is not pending. Skipping notification creation.'
      );
      return null;
    }

    try {
      const db = admin.firestore();

      // 💥 PHASE 1: Create NOTIFICATION 💥
      // 🌍 [i18n] Use translation keys instead of hardcoded Korean
      try {
        const notificationData = {
          recipientId: invitation.invitedUserId,
          type: 'PARTNER_INVITE',
          eventId: invitation.eventId,
          eventType: 'match', // 번개매치
          title: 'notification.partnerInvitationTitle',
          message: 'notification.partnerInvitation',
          relatedInvitationId: invitationId,
          ...(invitation.inviterName && { inviterName: invitation.inviterName }), // 🆕 [KIM FIX] Conditional field
          ...(invitation.invitedUserName && { inviteeName: invitation.invitedUserName }), // 🆕 [KIM FIX] Conditional field
          eventTitle: invitation.eventTitle,
          gameType: invitation.gameType,
          expiresAt: invitation.expiresAt,
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            notificationType: 'partner_invitation',
            actionRequired: true,
            deepLink: `events/${invitation.eventId}/partner-invite/${invitationId}`,
          },
          // 🎯 [i18n] Include data for interpolation on client
          data: {
            inviterName: invitation.inviterName || 'Unknown',
            eventTitle: invitation.eventTitle,
          },
        };

        const notificationDoc = await db.collection('notifications').add(notificationData);
        logger.info('✅ [PARTNER HERALD] Notification created:', notificationDoc.id);
      } catch (error) {
        logger.error('❌ [PARTNER HERALD] Failed to create notification:', error);
        // Don't throw - continue to feed item creation
      }

      // 💥 PHASE 2: Create FEED ITEM 💥
      try {
        const feedItemData = {
          type: 'partner_invite_pending',
          actorId: invitation.inviterId,
          actorName: invitation.inviterName || 'Unknown', // 🆕 [KIM FIX] Fallback for missing name
          targetId: invitation.invitedUserId,
          targetName: invitation.invitedUserName || 'Unknown', // 🆕 [KIM FIX] Fallback for missing name
          eventId: invitation.eventId,
          eventTitle: invitation.eventTitle,
          metadata: {
            eventType: 'match',
            gameType: invitation.gameType,
            invitationId: invitationId,
            inviteStatus: 'pending',
            expiresAt: invitation.expiresAt,
            eventDate: invitation.eventDate,
            eventTime: invitation.eventTime,
            eventLocation: invitation.eventLocation,
          },
          visibility: 'friends', // Only visible to friends
          visibleTo: [invitation.inviterId, invitation.invitedUserId],
          isActive: true, // 🔥 Required by feedService query filters
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const feedDoc = await db.collection('feed').add(feedItemData);
        logger.info('✅ [PARTNER HERALD] Feed item created:', feedDoc.id);
      } catch (error) {
        logger.error('❌ [PARTNER HERALD] Failed to create feed item:', error);
        // Don't throw - feed item is not critical
      }

      logger.info('🎉 [PARTNER HERALD] Partner invitation notifications complete!', {
        invitationId,
        inviter: invitation.inviterName || 'Unknown',
        invitee: invitation.invitedUserName || 'Unknown',
        eventId: invitation.eventId,
      });

      return { success: true, invitationId: invitationId };
    } catch (error) {
      logger.error('❌ [PARTNER HERALD] Failed to process partner invitation:', error);
      // Don't throw - we don't want to fail the invitation creation
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
);
