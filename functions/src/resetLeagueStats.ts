/**
 * 🧹 [CLEAN SLATE] Reset League Statistics
 *
 * Purpose: Reset corrupted league statistics caused by the tournament bug
 * where tournament matches were incorrectly updating league fields.
 *
 * This function resets ONLY league-specific stats while preserving tournament data.
 *
 * Author: Captain America
 * Created: 2025-11-14
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

export const resetLeagueStats = onCall(async request => {
  // Require authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to reset league stats');
  }
  const batch = db.batch();
  let updateCount = 0;

  try {
    logger.info('🔄 [RESET LEAGUE STATS] Starting reset process...');

    // Get all club memberships using collectionGroup
    const membershipsSnapshot = await db.collectionGroup('clubMemberships').get();

    logger.info(`📊 [RESET LEAGUE STATS] Found ${membershipsSnapshot.size} memberships to process`);

    membershipsSnapshot.forEach(doc => {
      const data = doc.data();

      // Only update if there are league stats to reset
      if (
        data.clubStats &&
        (data.clubStats.matchesPlayed > 0 || data.clubStats.wins > 0 || data.clubStats.losses > 0)
      ) {
        batch.update(doc.ref, {
          'clubStats.matchesPlayed': 0,
          'clubStats.wins': 0,
          'clubStats.losses': 0,
          'clubStats.draws': 0,
        });

        updateCount++;
        logger.info(`✅ [RESET] Reset stats for membership: ${doc.id}`);
      }
    });

    // Commit the batch
    await batch.commit();

    logger.info(`✅ [RESET LEAGUE STATS] Successfully reset ${updateCount} memberships`);

    return {
      success: true,
      message: `Successfully reset league stats for ${updateCount} memberships`,
      updatedCount: updateCount,
    };
  } catch (error) {
    logger.error('❌ [RESET LEAGUE STATS] Error:', error);
    throw new HttpsError(
      'internal',
      'Failed to reset league stats',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
