/**
 * 🔨 THOR'S HERALD OF TEAM RESPONSES 🔨
 * Cloud Function: Team Status Change Feed Trigger
 *
 * Automatically creates feed items when team invitations are accepted or rejected.
 * This ensures proper authorization using admin privileges (bypasses client security rules).
 *
 * Trigger: teams/{teamId} onUpdate
 * Condition: status changes from 'pending' → 'confirmed' or 'rejected'
 * Actions:
 *  - Create feed item for acceptance (club_team_invite_accepted)
 *  - Create feed item for rejection (club_team_invite_rejected)
 *  - Both use admin privileges (secure)
 *
 * Why Cloud Function?
 *  - Client-side writes to feed collection blocked by security rules (correct)
 *  - Cloud Functions have admin privileges
 *  - Centralized logic, better security
 *  - Consistent with team invitation creation pattern
 */

const admin = require('firebase-admin');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.onTeamStatusChanged = onDocumentUpdated('teams/{teamId}', async event => {
  const before = event.data.before.data(); // Previous team data
  const after = event.data.after.data(); // New team data
  const teamId = event.params.teamId;

  console.log('🔨 [HERALD] Team document updated:', {
    teamId,
    statusBefore: before.status,
    statusAfter: after.status,
    player1: after.player1?.playerName,
    player2: after.player2?.playerName,
  });

  // 🎯 Only process status changes FROM 'pending'
  if (before.status !== 'pending') {
    console.log('ℹ️ [HERALD] Previous status was not pending. Skipping feed item creation.');
    return null;
  }

  // 🎯 Only process changes TO 'confirmed' or 'rejected'
  if (after.status !== 'confirmed' && after.status !== 'rejected') {
    console.log('ℹ️ [HERALD] New status is neither confirmed nor rejected. Skipping.');
    return null;
  }

  try {
    const db = admin.firestore();

    // 🔍 Fetch event data (tournament or league) to get clubId
    let clubId, eventName, eventId;

    if (after.tournamentId) {
      // Tournament team
      console.log('🔨 [HERALD] Fetching tournament data for club context...');
      const tournamentRef = db.doc(`tournaments/${after.tournamentId}`);
      const tournamentSnap = await tournamentRef.get();

      if (!tournamentSnap.exists) {
        console.warn('⚠️ [HERALD] Tournament not found, skipping feed');
        return null;
      }

      const tournament = tournamentSnap.data();
      clubId = tournament.clubId;
      eventName = after.tournamentName || tournament.name;
      eventId = after.tournamentId;
      console.log('🔨 [HERALD] Tournament found! ClubId:', clubId);
    } else if (after.leagueId) {
      // League team
      console.log('🔨 [HERALD] Fetching league data for club context...');
      const leagueRef = db.doc(`leagues/${after.leagueId}`);
      const leagueSnap = await leagueRef.get();

      if (!leagueSnap.exists) {
        console.warn('⚠️ [HERALD] League not found, skipping feed');
        return null;
      }

      const league = leagueSnap.data();
      clubId = league.clubId;
      eventName = after.leagueName || league.name || league.leagueName || league.title;
      eventId = after.leagueId;
      console.log('🔨 [HERALD] League found! ClubId:', clubId);
    } else {
      console.warn('⚠️ [HERALD] No tournamentId or leagueId, skipping feed');
      return null;
    }

    // 💥 Determine feed item type based on new status
    const isAccepted = after.status === 'confirmed';
    const feedItemType = isAccepted ? 'club_team_invite_accepted' : 'club_team_invite_rejected';

    console.log(`🔨 [HERALD] Creating feed item: ${feedItemType}`);

    // 💥 CREATE CLUB-SPECIFIC FEED ITEM 💥
    try {
      const feedItemData = {
        type: feedItemType,
        actorId: after.player2.userId, // The person who responded (player 2)
        actorName: after.player2.playerName,
        targetId: after.player1.userId, // The person who invited (player 1)
        targetName: after.player1.playerName,
        clubId: clubId,
        clubName: eventName,
        eventId: eventId,
        metadata: {
          eventType: after.tournamentId ? 'tournament' : 'league',
          eventName: eventName,
          teamId: teamId,
          teamName: after.teamName,
          inviteStatus: after.status, // 'confirmed' or 'rejected'
        },
        visibility: 'club_members',
        visibleTo: [after.player1.userId, after.player2.userId],
        isActive: true, // 🔥 Required by feedService query filters
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const feedDoc = await db.collection('feed').add(feedItemData);
      console.log(`✅ [HERALD] Feed item created (${feedItemType}):`, feedDoc.id);
    } catch (error) {
      console.error(`❌ [HERALD] Failed to create feed item (${feedItemType}):`, error);
      // Don't throw - feed item is not critical
    }

    console.log('🎉 [HERALD] Team status change processing complete!', {
      teamId,
      status: after.status,
      player1: after.player1.playerName,
      player2: after.player2.playerName,
      clubId: clubId,
      eventType: after.tournamentId ? 'tournament' : 'league',
      eventId: eventId,
    });

    return { success: true, teamId: teamId, status: after.status };
  } catch (error) {
    console.error('❌ [HERALD] Failed to process team status change:', error);
    // Don't throw - we don't want to fail the team status update
    return { success: false, error: error.message };
  }
});
