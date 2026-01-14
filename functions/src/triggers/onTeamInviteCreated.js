/**
 * 🔨 THOR'S HERALD OF TEAM INVITATIONS 🔨
 * Cloud Function: Team Invitation Notification & Feed Trigger
 *
 * Automatically creates notifications and feed items when team invitations are created.
 * This ensures proper authorization using admin privileges (bypasses client security rules).
 *
 * Trigger: teams/{teamId} onCreate
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
 *  - Consistent with push notification pattern (sendPushOnTeamInvite)
 */

const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.onTeamInviteCreated = onDocumentCreated('teams/{teamId}', async event => {
  const team = event.data.data();
  const teamId = event.params.teamId;

  console.log('🔨 [HERALD] Team document created:', {
    teamId,
    status: team.status,
    inviter: team.player1?.playerName,
    invitee: team.player2?.playerName,
    tournamentId: team.tournamentId,
  });

  // 🎯 Only process pending team invitations
  if (team.status !== 'pending') {
    console.log('ℹ️ [HERALD] Team status is not pending. Skipping notification creation.');
    return null;
  }

  try {
    const db = admin.firestore();

    // 🔍 Fetch event data (tournament or league) to get clubId
    let clubId, eventName, eventId;

    if (team.tournamentId) {
      // Tournament team
      console.log('🔨 [HERALD] Fetching tournament data for club context...');
      const tournamentRef = db.doc(`tournaments/${team.tournamentId}`);
      const tournamentSnap = await tournamentRef.get();

      if (!tournamentSnap.exists) {
        console.warn('⚠️ [HERALD] Tournament not found, skipping notifications');
        return null;
      }

      const tournament = tournamentSnap.data();
      clubId = tournament.clubId;
      eventName = team.tournamentName || tournament.name;
      eventId = team.tournamentId;
      console.log('🔨 [HERALD] Tournament found! ClubId:', clubId);
    } else if (team.leagueId) {
      // League team
      console.log('🔨 [HERALD] Fetching league data for club context...');
      const leagueRef = db.doc(`leagues/${team.leagueId}`);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        console.warn('⚠️ [HERALD] League not found, skipping notifications');
        return null;
      }

      const league = leagueSnap.data();
      clubId = league.clubId;
      eventName = team.leagueName || league.name || league.leagueName || league.title;
      eventId = team.leagueId;
      console.log('🔨 [HERALD] League found! ClubId:', clubId);
    } else {
      console.warn('⚠️ [HERALD] No tournamentId or leagueId, skipping notifications');
      return null;
    }

    // 💥 PHASE 1: Create CLUB-SPECIFIC NOTIFICATIONS 💥
    // 🎯 CREATE TWO NOTIFICATIONS: One for invitee, one for inviter

    // 📩 NOTIFICATION 1: For the INVITEE (초대 받는 사람)
    try {
      const inviteeNotificationData = {
        recipientId: team.player2.userId,
        type: 'CLUB_TEAM_INVITE',
        clubId: clubId,
        eventId: eventId, // tournamentId or leagueId
        eventType: team.tournamentId ? 'tournament' : 'league',
        message: `${team.player1.playerName}님이 '${eventName}'의 파트너로 당신을 초대했습니다.`,
        relatedTeamId: teamId,
        inviterName: team.player1.playerName,
        inviteeName: team.player2.playerName,
        eventName: eventName,
        expiresAt: team.expiresAt,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'team_invitation',
          actionRequired: true,
          deepLink: `club/${clubId}/teams/${teamId}`,
          role: 'invitee', // 🎯 Mark as invitee notification
        },
      };

      const inviteeNotifDoc = await db.collection('notifications').add(inviteeNotificationData);
      console.log('✅ [HERALD] Invitee notification created:', inviteeNotifDoc.id);
    } catch (error) {
      console.error('❌ [HERALD] Failed to create invitee notification:', error);
    }

    // 📩 NOTIFICATION 2: For the INVITER (초대 보낸 사람)
    try {
      const inviterNotificationData = {
        recipientId: team.player1.userId,
        type: 'CLUB_TEAM_INVITE',
        clubId: clubId,
        eventId: eventId,
        eventType: team.tournamentId ? 'tournament' : 'league',
        message: `'${eventName}' 파트너로 ${team.player2.playerName}님에게 초대를 보냈습니다. 수락을 기다리는 중...`,
        relatedTeamId: teamId,
        inviterName: team.player1.playerName,
        inviteeName: team.player2.playerName,
        eventName: eventName,
        expiresAt: team.expiresAt,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          notificationType: 'team_invitation_sent',
          actionRequired: false, // Inviter doesn't need to take action
          deepLink: `club/${clubId}/teams/${teamId}`,
          role: 'inviter', // 🎯 Mark as inviter notification
        },
      };

      const inviterNotifDoc = await db.collection('notifications').add(inviterNotificationData);
      console.log('✅ [HERALD] Inviter notification created:', inviterNotifDoc.id);
    } catch (error) {
      console.error('❌ [HERALD] Failed to create inviter notification:', error);
      // Don't throw - continue to feed item creation
    }

    // 💥 PHASE 2: Create CLUB-SPECIFIC FEED ITEM 💥
    try {
      const feedItemData = {
        type: 'club_team_invite_pending',
        actorId: team.player1.userId,
        actorName: team.player1.playerName,
        targetId: team.player2.userId,
        targetName: team.player2.playerName,
        clubId: clubId,
        clubName: eventName,
        eventId: eventId,
        metadata: {
          eventType: team.tournamentId ? 'tournament' : 'league',
          eventName: eventName,
          teamId: teamId,
          teamName: team.teamName,
          inviteStatus: 'pending',
          expiresAt: team.expiresAt,
        },
        visibility: 'club_members',
        visibleTo: [team.player1.userId, team.player2.userId],
        isActive: true, // 🔥 Required by feedService query filters
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const feedDoc = await db.collection('feed').add(feedItemData);
      console.log('✅ [HERALD] Club feed item created:', feedDoc.id);
    } catch (error) {
      console.error('❌ [HERALD] Failed to create club feed item:', error);
      // Don't throw - feed item is not critical
    }

    console.log('🎉 [HERALD] Team invitation notifications complete!', {
      teamId,
      inviter: team.player1.playerName,
      invitee: team.player2.playerName,
      clubId: clubId,
      eventType: team.tournamentId ? 'tournament' : 'league',
      eventId: eventId,
    });

    return { success: true, teamId: teamId };
  } catch (error) {
    console.error('❌ [HERALD] Failed to process team invitation:', error);
    // Don't throw - we don't want to fail the team creation
    return { success: false, error: error.message };
  }
});
