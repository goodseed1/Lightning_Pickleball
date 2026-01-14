/**
 * 🔔 League Playoffs Created Trigger
 *
 * Automatically sends notifications when playoffs are created:
 * - Creates feed items for qualified players
 * - Sends activity notifications to qualified players
 *
 * @author Captain America
 * @date 2025-11-16
 */

import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * Triggered when a league document is updated
 * Detects playoff creation (status change to 'playoffs')
 */
export const onLeaguePlayoffsCreated = onDocumentUpdated('leagues/{leagueId}', async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const leagueId = event.params.leagueId;

  if (!before || !after) {
    logger.warn('⚠️ Missing before/after data', { leagueId });
    return;
  }

  // ✅ Detect playoff creation
  if (before.status !== 'playoffs' && after.status === 'playoffs') {
    logger.info('🏆 [PLAYOFF_CREATED] Detected', { leagueId, leagueName: after.name });

    const qualifiedPlayers = after.playoff?.qualifiedPlayers || [];
    const playoffType = after.playoff?.type || 'final';
    const leagueName = after.name;
    const clubId = after.clubId;

    try {
      // 1️⃣ Get club member IDs for feed visibility
      const clubMembersSnap = await db
        .collection('clubMembers')
        .where('clubId', '==', clubId)
        .get();

      const memberIds = clubMembersSnap.docs.map(doc => doc.data().userId || doc.data().uid);

      // 2️⃣ Get club name
      const clubSnap = await db.collection('clubs').doc(clubId).get();
      const clubName = clubSnap.data()?.name || 'Club';

      // 3️⃣ Get player names from standings (not from users collection!)
      const standings = (after.standings || []) as Array<{
        playerId: string;
        playerName: string;
        teamId?: string;
      }>;

      const playerNames: Record<string, string> = {};
      for (const playerId of qualifiedPlayers) {
        // First, try to find the name in standings
        const standing = standings.find(s => s.playerId === playerId || s.teamId === playerId);
        if (standing?.playerName) {
          playerNames[playerId] = standing.playerName;
        } else {
          // Fallback: fetch from users collection
          const userSnap = await db.collection('users').doc(playerId).get();
          const userData = userSnap.data();
          playerNames[playerId] =
            userData?.fullName || userData?.name || userData?.displayName || 'Unknown Player';
        }
      }

      // 4️⃣ Create feed items for each qualified player
      for (const playerId of qualifiedPlayers) {
        await db.collection('feed').add({
          type: 'league_playoffs_created',
          actorId: playerId,
          actorName: playerNames[playerId],
          clubId,
          clubName,
          eventId: leagueId,
          metadata: {
            leagueName,
            playoffType,
            totalQualifiers: qualifiedPlayers.length,
          },
          visibility: 'club_members',
          visibleTo: memberIds,
          isActive: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('📣 [FEED] Created for player', {
          playerId,
          playerName: playerNames[playerId],
        });
      }

      // 🎯 [KIM FIX] Use translation keys for i18n
      // 5️⃣ Create activity notifications for qualified players
      for (const playerId of qualifiedPlayers) {
        await db.collection('activity_notifications').add({
          userId: playerId,
          type: 'league_playoffs_qualified',
          title: 'notification.playoffsQualifiedTitle',
          message: 'notification.playoffsQualified',
          data: {
            leagueId,
            leagueName,
            playoffType,
            clubId,
          },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('🔔 [NOTIFICATION] Sent to player', {
          playerId,
          playerName: playerNames[playerId],
        });
      }

      logger.info('✅ [PLAYOFF_CREATED] Notifications completed', {
        leagueId,
        totalNotifications: qualifiedPlayers.length,
      });
    } catch (error) {
      logger.error('❌ [PLAYOFF_CREATED] Error', {
        leagueId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});
