/**
 * ⚡ [OPERATION DUO] Send Push Notification on Partner Invitation
 *
 * Firestore trigger that sends push notifications when partner invitations are created.
 * This runs immediately after a partner_invitations document is created.
 *
 * Trigger: partner_invitations/{invitationId} onCreate
 * Condition: status === 'pending'
 * Action: Send push notification to invitee
 *
 * @author Kim
 * @date 2025-11-28
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { sendPartnerInviteNotification } from '../utils/partnerNotificationSender';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const sendPushOnPartnerInvite = onDocumentCreated(
  'partner_invitations/{invitationId}',
  async event => {
    const invitation = event.data?.data();
    const invitationId = event.params.invitationId;

    if (!invitation) {
      logger.warn('⚠️ [PUSH_PARTNER_INVITE] No invitation data');
      return null;
    }

    logger.info('📲 [PUSH_PARTNER_INVITE] Partner invitation created, sending push notification:', {
      invitationId,
      inviter: invitation.inviterName,
      invitee: invitation.invitedUserName,
      eventTitle: invitation.eventTitle,
    });

    // 🎯 Only send push for pending invitations
    if (invitation.status !== 'pending') {
      logger.info(
        '⏭️ [PUSH_PARTNER_INVITE] Invitation status is not pending, skipping push notification'
      );
      return null;
    }

    try {
      // Send push notification using utility
      const result = await sendPartnerInviteNotification(
        invitationId,
        invitation.inviterId,
        invitation.inviterName,
        invitation.invitedUserId,
        invitation.invitedUserName,
        invitation.eventId,
        invitation.eventTitle,
        invitation.gameType
      );

      if (result.success) {
        logger.info('✅ [PUSH_PARTNER_INVITE] Push notification sent successfully', {
          invitationId,
          invitee: invitation.invitedUserName,
        });
      } else {
        logger.warn('⚠️ [PUSH_PARTNER_INVITE] Failed to send push notification:', {
          invitationId,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      logger.error('❌ [PUSH_PARTNER_INVITE] Error sending push notification:', error);
      // Don't throw - we don't want to fail the invitation creation
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);
