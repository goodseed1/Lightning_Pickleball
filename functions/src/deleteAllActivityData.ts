/**
 * Cloud Function for deleting all activity data while preserving user profiles
 * Deletes all activity-related collections and resets user stats
 * ⚠️ WARNING: This is a destructive operation - use only in development/test environments
 * ✅ [v2] Firebase Functions v2 API
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface DeleteAllActivityDataRequest {
  confirmationToken: string; // Safety measure: must be 'DELETE_ALL_ACTIVITY_DATA'
}

/**
 * Delete all activity data while preserving user profile information
 * Collections to delete:
 * - events, lightning_events
 * - participation_applications
 * - clubs, tennis_clubs, club_members, clubMembers, clubMemberships
 * - matches, match_results, club_match_history
 * - leagues, league_participants, league_standings, playoff_matches
 * - tournaments, tournament_events, tournament_matches, tournamentRegistrations
 * - teams, team_invitations
 * - event_chat_rooms, messages, conversations
 * - activities, feed, notifications, activity_notifications
 * - trophies, achievements
 * - partner_invitations, friendships, eventParticipations
 *
 * Subcollections to delete:
 * - users/{userId}/club_match_history
 * - tennis_clubs/{clubId}/members
 * - tournaments/{id}/matches, participants
 * - activityFeed/{userId}/items
 *
 * Users collection: Reset stats/activity data, preserve profile info
 *
 * @param request - Must include confirmationToken: 'DELETE_ALL_ACTIVITY_DATA'
 * @returns Success message with summary of deleted collections and documents
 */
export const deleteAllActivityData = onCall<DeleteAllActivityDataRequest>(async request => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { confirmationToken } = request.data;

    // Safety check: require confirmation token
    if (confirmationToken !== 'DELETE_ALL_ACTIVITY_DATA') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid confirmation token. Must be "DELETE_ALL_ACTIVITY_DATA"'
      );
    }

    logger.warn('🗑️ Starting deletion of ALL activity data', {
      userId: request.auth.uid,
      timestamp: new Date().toISOString(),
    });

    // Collections to delete completely
    const collectionsToDelete = [
      'events',
      'lightning_events',
      'participation_applications',
      'clubs',
      'tennis_clubs',
      'club_members',
      'clubMembers',
      'clubMemberships',
      'matches',
      'match_results',
      'club_match_history',
      'leagues',
      'league_participants',
      'league_standings',
      'playoff_matches',
      'tournaments',
      'tournament_events',
      'tournament_matches',
      'tournamentRegistrations',
      'teams',
      'team_invitations',
      'event_chat_rooms',
      'messages',
      'conversations',
      'activities',
      'feed',
      'notifications',
      'activity_notifications',
      'trophies',
      'achievements',
      'partner_invitations',
      'friendships',
      'eventParticipations',
    ];

    let totalDeletedDocs = 0;
    const deletionSummary: Record<string, number> = {};

    // Step 1: Delete subcollections FIRST
    logger.info('🗑️ Step 1: Deleting subcollections...');

    // 1-1. users/{userId}/club_match_history, trophies, badges
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
      // Delete club_match_history subcollection
      const matchHistorySnap = await userDoc.ref.collection('club_match_history').get();
      if (!matchHistorySnap.empty) {
        const batch = db.batch();
        matchHistorySnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(
          `Deleted ${matchHistorySnap.size} docs from users/${userDoc.id}/club_match_history`
        );
        totalDeletedDocs += matchHistorySnap.size;
      }

      // 🎯 [KIM FIX] Delete trophies subcollection
      const trophiesSnap = await userDoc.ref.collection('trophies').get();
      if (!trophiesSnap.empty) {
        const batch = db.batch();
        trophiesSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${trophiesSnap.size} docs from users/${userDoc.id}/trophies`);
        totalDeletedDocs += trophiesSnap.size;
      }

      // 🎯 [KIM FIX] Delete badges subcollection
      const badgesSnap = await userDoc.ref.collection('badges').get();
      if (!badgesSnap.empty) {
        const batch = db.batch();
        badgesSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${badgesSnap.size} docs from users/${userDoc.id}/badges`);
        totalDeletedDocs += badgesSnap.size;
      }
    }

    // 1-2. tennis_clubs/{clubId}/members
    const clubsSnapshot = await db.collection('tennis_clubs').get();
    for (const clubDoc of clubsSnapshot.docs) {
      const membersSnap = await clubDoc.ref.collection('members').get();
      if (!membersSnap.empty) {
        const batch = db.batch();
        membersSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${membersSnap.size} docs from tennis_clubs/${clubDoc.id}/members`);
        totalDeletedDocs += membersSnap.size;
      }
    }

    // 1-3. tournaments/{id}/matches, participants
    const tournamentsSnapshot = await db.collection('tournaments').get();
    for (const tournDoc of tournamentsSnapshot.docs) {
      // Delete matches subcollection
      const matchesSnap = await tournDoc.ref.collection('matches').get();
      if (!matchesSnap.empty) {
        const batch = db.batch();
        matchesSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${matchesSnap.size} docs from tournaments/${tournDoc.id}/matches`);
        totalDeletedDocs += matchesSnap.size;
      }
      // Delete participants subcollection
      const participantsSnap = await tournDoc.ref.collection('participants').get();
      if (!participantsSnap.empty) {
        const batch = db.batch();
        participantsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(
          `Deleted ${participantsSnap.size} docs from tournaments/${tournDoc.id}/participants`
        );
        totalDeletedDocs += participantsSnap.size;
      }
    }

    // 1-4. activityFeed/{userId}/items
    const feedSnapshot = await db.collection('activityFeed').get();
    for (const feedDoc of feedSnapshot.docs) {
      const itemsSnap = await feedDoc.ref.collection('items').get();
      if (!itemsSnap.empty) {
        const batch = db.batch();
        itemsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${itemsSnap.size} docs from activityFeed/${feedDoc.id}/items`);
        totalDeletedDocs += itemsSnap.size;
      }
    }

    logger.info('✅ Subcollection deletion complete');

    // Step 2: Delete each main collection completely
    for (const collectionName of collectionsToDelete) {
      try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
          logger.info(`Collection ${collectionName} is already empty`);
          deletionSummary[collectionName] = 0;
          continue;
        }

        const docsToDelete = snapshot.size;
        logger.info(`Deleting ${docsToDelete} documents from ${collectionName}...`);

        // Delete in batches (Firestore batch limit is 500 operations)
        const batchSize = 500;
        let deletedCount = 0;
        let batch = db.batch();
        let operationCount = 0;

        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          operationCount++;
          deletedCount++;

          // Commit batch when reaching batch size limit
          if (operationCount >= batchSize) {
            await batch.commit();
            logger.info(`Deleted batch of ${operationCount} documents from ${collectionName}`);
            batch = db.batch();
            operationCount = 0;
          }
        }

        // Commit remaining operations
        if (operationCount > 0) {
          await batch.commit();
          logger.info(`Deleted final batch of ${operationCount} documents from ${collectionName}`);
        }

        totalDeletedDocs += deletedCount;
        deletionSummary[collectionName] = deletedCount;
        logger.info(`✅ Deleted ${deletedCount} documents from ${collectionName}`);
      } catch (error) {
        logger.error(`Failed to delete collection ${collectionName}:`, error);
        deletionSummary[collectionName] = -1; // Mark as failed
      }
    }

    // Step 3: Reset user documents to preserve only profile data
    logger.info('🔄 Step 3: Resetting user documents to preserve only profile data...');
    const usersSnapshotForReset = await db.collection('users').get();

    if (!usersSnapshotForReset.empty) {
      const batchSize = 500;
      let updatedUserCount = 0;
      let batch = db.batch();
      let operationCount = 0;

      for (const userDoc of usersSnapshotForReset.docs) {
        const userData = userDoc.data();

        // Preserve only essential profile fields (exclude undefined values)
        const resetUserData: Record<string, unknown> = {
          // Only include fields that exist (avoid undefined)
          ...(userData.uid && { uid: userData.uid }),
          ...(userData.email && { email: userData.email }),
          ...(userData.displayName && { displayName: userData.displayName }),
          ...(userData.photoURL && { photoURL: userData.photoURL }),
          profile: {
            nickname: userData.profile?.nickname || '',
            gender: userData.profile?.gender || '',
            skillLevel: userData.profile?.skillLevel || '',
          },
          skillLevel: userData.skillLevel || '',
          ...(userData.ntrpLevel && { ntrpLevel: userData.ntrpLevel }),
          // Reset these to initial values
          stats: {},
          eloRatings: {},
          clubMemberships: {},
          sportsmanshipTags: {},
          totalMatches: 0,
          wins: 0,
          losses: 0,
          friendIds: [],
          pendingFriendRequests: [],
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        batch.update(userDoc.ref, resetUserData as any);
        operationCount++;
        updatedUserCount++;

        // Commit batch when reaching batch size limit
        if (operationCount >= batchSize) {
          await batch.commit();
          logger.info(`Reset batch of ${operationCount} user documents`);
          batch = db.batch();
          operationCount = 0;
        }
      }

      // Commit remaining operations
      if (operationCount > 0) {
        await batch.commit();
        logger.info(`Reset final batch of ${operationCount} user documents`);
      }

      logger.info(`✅ Reset ${updatedUserCount} user documents to initial state`);
    }

    logger.info(`✅ Activity data deletion complete`, {
      totalCollectionsProcessed: collectionsToDelete.length,
      totalDeletedDocs,
      deletionSummary,
      userId: request.auth.uid,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully deleted ${totalDeletedDocs} documents from ${collectionsToDelete.length} collections`,
      totalDeletedDocs,
      collectionsProcessed: collectionsToDelete.length,
      deletionSummary,
    };
  } catch (error) {
    logger.error('❌ Error deleting activity data', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to delete activity data');
  }
});

export default {
  deleteAllActivityData,
};
