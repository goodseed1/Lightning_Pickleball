/**
 * 🎾 SOLO LOBBY TEAM PROPOSAL NOTIFICATION 🎾
 * Cloud Function: Solo Lobby Team Proposal Notification & Feed Trigger
 *
 * Automatically creates notifications and feed items when a solo applicant
 * proposes to form a team with another solo applicant.
 *
 * Trigger: participation_applications/{applicationId} onUpdate
 * Condition: pendingProposalFrom field is newly set (was null/undefined, now has value)
 * Actions:
 *  - Create notification in notifications collection
 *  - Create feed item in feed collection
 *  - Both use admin privileges (secure)
 *
 * Why Cloud Function?
 *  - Client-side writes to notifications/feed collections blocked by security rules (correct)
 *  - Cloud Functions have admin privileges
 *  - Centralized logic, better security
 *  - Consistent with team invite pattern (onTeamInviteCreated)
 */

const admin = require('firebase-admin');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.onSoloProposalCreated = onDocumentUpdated(
  'participation_applications/{applicationId}',
  async event => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const applicationId = event.params.applicationId;

    // 🎯 Only trigger when pendingProposalFrom is NEWLY set
    // Before: null/undefined, After: has value
    const hadProposalBefore = !!beforeData?.pendingProposalFrom;
    const hasProposalNow = !!afterData?.pendingProposalFrom;

    if (hadProposalBefore || !hasProposalNow) {
      // Not a new proposal - skip
      return null;
    }

    console.log('🎾 [SOLO PROPOSAL] New team proposal detected:', {
      applicationId,
      proposerUserId: afterData.pendingProposalFrom,
      proposerName: afterData.pendingProposalFromName,
      recipientUserId: afterData.applicantId,
      recipientName: afterData.applicantName,
      eventId: afterData.eventId,
    });

    try {
      const db = admin.firestore();

      // 🔍 Fetch event data for context
      const eventRef = db.doc(`events/${afterData.eventId}`);
      const eventSnap = await eventRef.get();

      if (!eventSnap.exists) {
        console.warn('⚠️ [SOLO PROPOSAL] Event not found, skipping notifications');
        return null;
      }

      const eventData = eventSnap.data();
      const eventTitle = eventData.title || eventData.name || 'Tennis Match';

      // 💥 PHASE 1: Create NOTIFICATION for recipient 💥
      try {
        const notificationData = {
          recipientId: afterData.applicantId, // 제안 받는 사람
          type: 'SOLO_TEAM_PROPOSAL',
          eventId: afterData.eventId,
          message: `${afterData.pendingProposalFromName}님이 '${eventTitle}'에서 당신과 팀을 구성하고 싶어합니다.`,
          proposerUserId: afterData.pendingProposalFrom,
          proposerName: afterData.pendingProposalFromName,
          applicationId: applicationId,
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            notificationType: 'solo_team_proposal',
            actionRequired: true,
            deepLink: `profile/activity`,
          },
        };

        const notifDoc = await db.collection('notifications').add(notificationData);
        console.log('✅ [SOLO PROPOSAL] Notification created:', notifDoc.id);
      } catch (error) {
        console.error('❌ [SOLO PROPOSAL] Failed to create notification:', error);
      }

      // 💥 PHASE 2: Create FEED ITEM 💥
      try {
        const feedItemData = {
          type: 'solo_team_proposal_pending',
          actorId: afterData.pendingProposalFrom, // 제안 보낸 사람
          actorName: afterData.pendingProposalFromName,
          targetId: afterData.applicantId, // 제안 받는 사람
          targetName: afterData.applicantName,
          eventId: afterData.eventId,
          eventTitle: eventTitle,
          metadata: {
            eventType: eventData.gameType || 'doubles',
            eventTitle: eventTitle,
            applicationId: applicationId,
            proposalStatus: 'pending',
          },
          visibility: 'private', // Only visible to both parties
          visibleTo: [afterData.pendingProposalFrom, afterData.applicantId],
          isActive: true, // 🔥 Required by feedService query filters
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const feedDoc = await db.collection('feed').add(feedItemData);
        console.log('✅ [SOLO PROPOSAL] Feed item created:', feedDoc.id);
      } catch (error) {
        console.error('❌ [SOLO PROPOSAL] Failed to create feed item:', error);
      }

      console.log('🎉 [SOLO PROPOSAL] Team proposal notifications complete!', {
        applicationId,
        proposer: afterData.pendingProposalFromName,
        recipient: afterData.applicantName,
        eventTitle,
      });

      return { success: true, applicationId };
    } catch (error) {
      console.error('❌ [SOLO PROPOSAL] Failed to process team proposal:', error);
      return { success: false, error: error.message };
    }
  }
);
