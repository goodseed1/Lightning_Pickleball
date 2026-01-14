/**
 * 🗑️ [CLEAN SLATE] Reset All Match Data Cloud Function
 *
 * Completely wipes all match-related data for fresh start in test environment.
 *
 * DELETES:
 * - All match history (match_history, global_match_history, club_match_history)
 * - All match statistics (clubStats, tournamentStats in clubMembers)
 * - All user match stats (users/{id}/stats match fields)
 * - All match records (tournaments/matches, leagues/matches)
 * - All standings data
 *
 * PRESERVES:
 * - User profiles (displayName, email, photoURL, preferences)
 * - Firebase Auth accounts
 * - Club memberships (role, joinedAt, status)
 * - Tournament/League structures (settings, bpaddles)
 *
 * @author Captain America (Clean Slate Initiative)
 * @date 2025-11-13
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

interface ResetStats {
  usersProcessed: number;
  matchHistoryDeleted: number;
  clubMembersReset: number;
  tournamentsProcessed: number;
  tournamentMatchesDeleted: number;
  leaguesProcessed: number;
  leagueMatchesDeleted: number;
  errors: string[];
}

/**
 * Reset All Match Data Cloud Function
 *
 * Security: Requires secret key (test environment only!)
 */
export const resetAllMatchData = onCall<{ secretKey?: string }>(async request => {
  const { data, auth } = request;

  // Security check
  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const RESET_SECRET = 'reset-match-data-2025-test'; // Change this!
  if (data.secretKey !== RESET_SECRET) {
    throw new HttpsError('permission-denied', 'Invalid secret key');
  }

  logger.info('🗑️ [CLEAN SLATE] Starting complete match data reset...', {
    triggeredBy: auth.uid,
  });

  const stats: ResetStats = {
    usersProcessed: 0,
    matchHistoryDeleted: 0,
    clubMembersReset: 0,
    tournamentsProcessed: 0,
    tournamentMatchesDeleted: 0,
    leaguesProcessed: 0,
    leagueMatchesDeleted: 0,
    errors: [],
  };

  try {
    // ============================================================================
    // Step 1: Reset all users' match history and stats
    // ============================================================================
    logger.info('📊 [STEP 1] Resetting user match history and stats...');

    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;

        // Delete match_history subcollection
        await deleteSubcollection(db, `users/${userId}/match_history`);

        // Delete global_match_history subcollection
        await deleteSubcollection(db, `users/${userId}/global_match_history`);

        // Delete club_match_history subcollection
        await deleteSubcollection(db, `users/${userId}/club_match_history`);

        stats.matchHistoryDeleted += 3; // 3 subcollections per user

        // Reset user stats (keep profile data)
        await db.collection('users').doc(userId).update({
          'stats.matchesPlayed': 0,
          'stats.wins': 0,
          'stats.losses': 0,
          'stats.winRate': 0,
          'stats.currentStreak': 0,
          'stats.longestStreak': 0,
          'stats.publicMatches': 0,
          'stats.clubMatches': 0,
          'stats.unifiedEloRating': 1200,
        });

        stats.usersProcessed++;

        if (stats.usersProcessed % 10 === 0) {
          logger.info(`📊 [STEP 1] Processed ${stats.usersProcessed} users...`);
        }
      } catch (error) {
        stats.errors.push(
          `User ${userDoc.id}: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.error(`❌ [STEP 1] Error processing user ${userDoc.id}:`, error);
      }
    }

    logger.info(`✅ [STEP 1] Complete: ${stats.usersProcessed} users processed`);

    // ============================================================================
    // Step 2: Reset all clubMembers stats
    // ============================================================================
    logger.info('🏢 [STEP 2] Resetting club member stats...');

    const clubMembersSnapshot = await db.collection('clubMembers').get();

    for (const memberDoc of clubMembersSnapshot.docs) {
      try {
        await db
          .collection('clubMembers')
          .doc(memberDoc.id)
          .update({
            'clubStats.matchesPlayed': 0,
            'clubStats.wins': 0,
            'clubStats.losses': 0,
            'clubStats.winRate': 0,
            'clubStats.currentStreak': 0,
            'clubStats.longestStreak': 0,
            'clubStats.clubEloRating': 1200,
            'clubStats.tournamentStats': {
              totalMatches: 0,
              tournamentWins: 0,
              tournamentLosses: 0,
              wins: 0,
              runnerUps: 0,
              semiFinals: 0,
              participations: 0,
              bestFinish: null,
            },
            // Preserve: role, joinedAt, status, clubId, userId, clubName
          });

        stats.clubMembersReset++;

        if (stats.clubMembersReset % 10 === 0) {
          logger.info(`🏢 [STEP 2] Reset ${stats.clubMembersReset} club memberships...`);
        }
      } catch (error) {
        stats.errors.push(
          `ClubMember ${memberDoc.id}: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.error(`❌ [STEP 2] Error resetting clubMember ${memberDoc.id}:`, error);
      }
    }

    logger.info(`✅ [STEP 2] Complete: ${stats.clubMembersReset} club memberships reset`);

    // ============================================================================
    // Step 3: Delete all tournament matches
    // ============================================================================
    logger.info('🏆 [STEP 3] Deleting all tournament matches...');

    const tournamentsSnapshot = await db.collection('tournaments').get();

    for (const tournamentDoc of tournamentsSnapshot.docs) {
      try {
        const tournamentId = tournamentDoc.id;
        const matchesDeleted = await deleteSubcollection(db, `tournaments/${tournamentId}/matches`);
        stats.tournamentMatchesDeleted += matchesDeleted;
        stats.tournamentsProcessed++;
      } catch (error) {
        stats.errors.push(
          `Tournament ${tournamentDoc.id}: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.error(`❌ [STEP 3] Error deleting tournament matches ${tournamentDoc.id}:`, error);
      }
    }

    logger.info(
      `✅ [STEP 3] Complete: ${stats.tournamentMatchesDeleted} matches deleted from ${stats.tournamentsProcessed} tournaments`
    );

    // ============================================================================
    // Step 4: Delete all league matches and reset standings
    // ============================================================================
    logger.info('🎖️ [STEP 4] Deleting all league matches and resetting standings...');

    const leaguesSnapshot = await db.collection('leagues').get();

    for (const leagueDoc of leaguesSnapshot.docs) {
      try {
        const leagueId = leagueDoc.id;

        // Delete matches subcollection
        const matchesDeleted = await deleteSubcollection(db, `leagues/${leagueId}/matches`);
        stats.leagueMatchesDeleted += matchesDeleted;

        // Reset standings
        const leagueData = leagueDoc.data();
        if (leagueData.standings && Array.isArray(leagueData.standings)) {
          const resetStandings = leagueData.standings.map(
            (standing: FirebaseFirestore.DocumentData) => ({
              ...standing,
              played: 0,
              won: 0,
              lost: 0,
              points: 0,
              gamesWon: 0,
              gamesLost: 0,
              gameDifference: 0,
              setsWon: 0,
              setsLost: 0,
              setDifference: 0,
              streak: { type: 'none', count: 0 },
              // Preserve: playerId, playerName, position
            })
          );

          await db.collection('leagues').doc(leagueId).update({
            standings: resetStandings,
          });
        }

        stats.leaguesProcessed++;
      } catch (error) {
        stats.errors.push(
          `League ${leagueDoc.id}: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.error(`❌ [STEP 4] Error processing league ${leagueDoc.id}:`, error);
      }
    }

    logger.info(
      `✅ [STEP 4] Complete: ${stats.leagueMatchesDeleted} matches deleted from ${stats.leaguesProcessed} leagues`
    );

    // ============================================================================
    // Step 5: Delete tournament_events (optional cleanup)
    // ============================================================================
    logger.info('🔥 [STEP 5] Cleaning up tournament events...');

    try {
      await deleteSubcollection(db, 'tournament_events');
      logger.info('✅ [STEP 5] Tournament events cleaned up');
    } catch (error) {
      stats.errors.push(
        `Tournament events: ${error instanceof Error ? error.message : String(error)}`
      );
      logger.error('❌ [STEP 5] Error cleaning tournament events:', error);
    }

    // ============================================================================
    // Final Report
    // ============================================================================
    logger.info('✅ [CLEAN SLATE] Complete!', stats);

    return {
      success: true,
      message: 'All match data has been reset successfully',
      stats,
    };
  } catch (error) {
    logger.error('❌ [CLEAN SLATE] Fatal error during reset:', error);
    throw new HttpsError(
      'internal',
      `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * Helper: Delete all documents in a subcollection
 */
async function deleteSubcollection(
  db: FirebaseFirestore.Firestore,
  collectionPath: string
): Promise<number> {
  const snapshot = await db.collection(collectionPath).get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });

  await batch.commit();

  return count;
}
