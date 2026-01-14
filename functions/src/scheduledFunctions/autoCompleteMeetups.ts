/**
 * 🌤️ [MEETUP AUTO-COMPLETE] Automatic status update for meetup events
 *
 * Scheduled Cloud Function to automatically mark meetup events as 'completed'
 * when they have finished (24 hours after scheduled end time).
 *
 * **Why This is Needed**:
 * - Meetup events (번개모임) don't have score input like match events
 * - Without this, meetups stay in 'upcoming' status forever
 * - Activity tabs filter out old meetups but badge counts were still including them
 *
 * **Completion Criteria**:
 * - Event type is 'meetup' OR gameType is 'rally'
 * - Event's estimated end time (scheduledTime + duration) was more than 24 hours ago
 * - Current status is 'upcoming', 'active', or 'scheduled'
 *
 * **Schedule**: Runs hourly at minute 0 (cron: '0 * * * *')
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Constants
const TWENTY_FOUR_HOURS = 24; // in hours
const DEFAULT_DURATION_MINUTES = 120; // 2 hours default
const MAX_BATCH_SIZE = 500; // Firestore batch limit

/**
 * Check if an event is a meetup (based on type or gameType)
 */
function isMeetupEvent(data: FirebaseFirestore.DocumentData): boolean {
  // Rally is always a meetup, regardless of type field
  if (data.gameType === 'rally') return true;
  // Explicit meetup type
  if (data.type === 'meetup') return true;
  return false;
}

/**
 * Check if a meetup event should be auto-completed
 */
function shouldAutoComplete(data: FirebaseFirestore.DocumentData): boolean {
  // Must be a meetup event
  if (!isMeetupEvent(data)) {
    return false;
  }

  // Must have a completable status
  const status = data.status;
  if (!['upcoming', 'active', 'scheduled'].includes(status)) {
    return false;
  }

  // Check if scheduled time exists
  const scheduledTime = data.scheduledTime;
  if (!scheduledTime) {
    return false;
  }

  // Calculate estimated end time
  const scheduledTimeMs = scheduledTime.toMillis
    ? scheduledTime.toMillis()
    : new Date(scheduledTime).getTime();
  const durationMinutes = data.duration || DEFAULT_DURATION_MINUTES;
  const durationMs = durationMinutes * 60 * 1000;
  const estimatedEndTimeMs = scheduledTimeMs + durationMs;

  // Check if 24 hours have passed since end time
  const hoursSinceEnd = (Date.now() - estimatedEndTimeMs) / (1000 * 60 * 60);

  return hoursSinceEnd >= TWENTY_FOUR_HOURS;
}

/**
 * Scheduled function to auto-complete meetup events
 * Runs hourly
 */
export const autoCompleteMeetups = onSchedule(
  {
    schedule: '0 * * * *', // Hourly at minute 0 (cron format)
    timeZone: 'America/New_York', // Eastern Time (matches app usage)
    memory: '256MiB',
    timeoutSeconds: 540, // 9 minutes (max for scheduled functions)
  },
  async () => {
    logger.info('🌤️ [AUTO-COMPLETE] Starting scheduled meetup completion job...');

    let completedCount = 0;
    const errors: string[] = [];

    try {
      // Query all meetup events that could need completion
      // We query broadly and filter in code for flexibility
      const snapshot = await db
        .collection('events')
        .where('status', 'in', ['upcoming', 'active', 'scheduled'])
        .get();

      if (snapshot.empty) {
        logger.info('🌤️ [AUTO-COMPLETE] No events with completable status found');
        return;
      }

      logger.info(`🌤️ [AUTO-COMPLETE] Found ${snapshot.docs.length} events to check`);

      // Filter to meetups that need completion
      const toComplete = snapshot.docs.filter(doc => shouldAutoComplete(doc.data()));

      if (toComplete.length === 0) {
        logger.info('🌤️ [AUTO-COMPLETE] No meetups need auto-completion');
        return;
      }

      logger.info(`🌤️ [AUTO-COMPLETE] ${toComplete.length} meetups need auto-completion`);

      // Process in batches
      for (let i = 0; i < toComplete.length; i += MAX_BATCH_SIZE) {
        const batchDocs = toComplete.slice(i, i + MAX_BATCH_SIZE);
        const batch = db.batch();

        for (const doc of batchDocs) {
          const data = doc.data();
          batch.update(doc.ref, {
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoCompletedBy: 'autoCompleteMeetups',
            previousStatus: data.status,
          });

          logger.info(
            `🌤️ [AUTO-COMPLETE] Marking meetup '${data.title}' as completed (ID: ${doc.id})`
          );
        }

        try {
          await batch.commit();
          completedCount += batchDocs.length;
          logger.info(`🌤️ [AUTO-COMPLETE] Batch of ${batchDocs.length} meetups completed`);
        } catch (error) {
          const errorMsg = `Failed to complete batch: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to process events: ${error}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }

    // Log summary
    logger.info(`🎉 [AUTO-COMPLETE] Job completed! ${completedCount} meetups auto-completed`);

    if (errors.length > 0) {
      logger.error(`⚠️ [AUTO-COMPLETE] Encountered ${errors.length} errors: ${errors.join(', ')}`);
    }
  }
);
