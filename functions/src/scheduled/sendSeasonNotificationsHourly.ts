/**
 * 🌍 Send Season Notifications Hourly
 *
 * Runs every hour to send season notifications at users' local time.
 * On the first day of each quarter (Jan 1, Apr 1, Jul 1, Oct 1):
 * - At 9 AM local time: Send trophy notifications to users who earned trophies
 * - At 10 AM local time: Send season start notifications to all users
 *
 * This replaces the old EST-based notification system with timezone-aware delivery.
 *
 * Philosophy: Users should receive notifications at their local time, not be woken
 * up by notifications at 3 AM because they're in a different timezone!
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  getTimezonesAtHour,
  isQuarterFirstDay,
  getCurrentQuarterInTimezone,
  DEFAULT_TIMEZONE,
} from '../utils/timezoneUtils.js';
import { getSeasonName } from '../utils/seasonUtils.js';
import {
  sendSeasonTrophyNotification,
  sendSeasonStartNotification,
} from '../utils/notificationSender.js';

/**
 * Get season ID from quarter and year
 *
 * @param quarter - Quarter number (1-4)
 * @param year - Year
 * @returns Season ID in format 'YYYY-QN' (e.g., '2025-Q1')
 */
function getSeasonId(quarter: number, year: number): string {
  return `${year}-Q${quarter}`;
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Notification target hours (local time)
const TROPHY_NOTIFICATION_HOUR = 9; // 9 AM local time
const SEASON_START_NOTIFICATION_HOUR = 10; // 10 AM local time

/**
 * Get users by their timezone
 *
 * @param timezones - Array of IANA timezone identifiers
 * @returns Array of user documents
 */
async function getUsersByTimezones(
  timezones: string[]
): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  if (timezones.length === 0) {
    return [];
  }

  console.log(`🔍 [SEASON NOTIFY] Querying users with timezones:`, timezones);

  // Firestore 'in' query is limited to 30 values, but we typically have < 5 timezones at any hour
  const usersSnapshot = await db
    .collection('users')
    .where('location.timezone', 'in', timezones)
    .get();

  console.log(`👥 [SEASON NOTIFY] Found ${usersSnapshot.size} users in target timezones`);
  return usersSnapshot.docs;
}

/**
 * Get users with pending trophy notifications for today
 *
 * We check if the user has a trophy awarded today but no notification sent yet.
 * This handles the case where trophies are awarded at 00:00 EST and notifications
 * are sent at 9 AM local time.
 *
 * @param timezones - Array of IANA timezone identifiers
 * @param seasonId - Season ID to check for trophies
 * @returns Array of user IDs with their trophy data
 */
async function getUsersWithPendingTrophyNotifications(
  timezones: string[],
  seasonId: string
): Promise<
  Array<{
    userId: string;
    trophies: Array<{
      trophyType: string;
      seasonId: string;
      seasonName: string;
    }>;
  }>
> {
  const usersWithTrophies: Array<{
    userId: string;
    trophies: Array<{
      trophyType: string;
      seasonId: string;
      seasonName: string;
    }>;
  }> = [];

  // Get users in target timezones
  const userDocs = await getUsersByTimezones(timezones);

  for (const userDoc of userDocs) {
    const userId = userDoc.id;

    // Check for trophies awarded today for the season
    const trophiesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('hallOfFame')
      .where('seasonId', '==', seasonId)
      .where('type', 'in', [
        'SEASON_TROPHY_CHAMPION_GOLD',
        'SEASON_TROPHY_CHAMPION_SILVER',
        'SEASON_TROPHY_CHAMPION_BRONZE',
        'SEASON_TROPHY_RANK_UP',
        'SEASON_TROPHY_IRON_MAN',
        'SEASON_TROPHY_ACE',
      ])
      .get();

    if (trophiesSnapshot.empty) {
      continue;
    }

    // Check if notification was already sent for this season's trophies
    const notificationLogSnapshot = await db
      .collection('push_notification_logs')
      .where('userId', '==', userId)
      .where('type', '==', 'season_trophy_awarded')
      .where('seasonId', '==', seasonId)
      .limit(1)
      .get();

    if (!notificationLogSnapshot.empty) {
      // Notification already sent for this season's trophies
      continue;
    }

    // Collect trophy data
    const trophies: Array<{
      trophyType: string;
      seasonId: string;
      seasonName: string;
    }> = [];

    for (const trophyDoc of trophiesSnapshot.docs) {
      const trophyData = trophyDoc.data();
      // Convert trophy type from SEASON_TROPHY_CHAMPION_GOLD to season_champion_gold
      const trophyType = trophyData.type.replace('SEASON_TROPHY_', '').toLowerCase();

      trophies.push({
        trophyType,
        seasonId: trophyData.seasonId,
        seasonName: trophyData.seasonName,
      });
    }

    if (trophies.length > 0) {
      usersWithTrophies.push({ userId, trophies });
    }
  }

  console.log(
    `🏆 [SEASON NOTIFY] Found ${usersWithTrophies.length} users with pending trophy notifications`
  );
  return usersWithTrophies;
}

/**
 * Get users who haven't received season start notification yet
 *
 * @param timezones - Array of IANA timezone identifiers
 * @param seasonId - Current season ID
 * @returns Array of user IDs
 */
async function getUsersWithPendingSeasonStartNotifications(
  timezones: string[],
  seasonId: string
): Promise<string[]> {
  const pendingUserIds: string[] = [];

  // Get users in target timezones
  const userDocs = await getUsersByTimezones(timezones);

  for (const userDoc of userDocs) {
    const userId = userDoc.id;

    // Check if notification was already sent for this season
    const notificationLogSnapshot = await db
      .collection('push_notification_logs')
      .where('userId', '==', userId)
      .where('type', '==', 'season_start')
      .where('seasonId', '==', seasonId)
      .limit(1)
      .get();

    if (notificationLogSnapshot.empty) {
      // Notification not yet sent
      pendingUserIds.push(userId);
    }
  }

  console.log(
    `🎾 [SEASON NOTIFY] Found ${pendingUserIds.length} users with pending season start notifications`
  );
  return pendingUserIds;
}

/**
 * Send trophy notifications to users at their local 9 AM
 *
 * @param timezones - Timezones currently at 9 AM
 * @param previousSeasonId - Previous season ID (trophies are for previous season)
 */
async function sendTrophyNotifications(
  timezones: string[],
  previousSeasonId: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const usersWithTrophies = await getUsersWithPendingTrophyNotifications(
    timezones,
    previousSeasonId
  );

  for (const { userId, trophies } of usersWithTrophies) {
    // Send notification for the first (most significant) trophy
    const trophy = trophies[0];

    const result = await sendSeasonTrophyNotification(userId, {
      trophyType: trophy.trophyType as
        | 'season_champion_gold'
        | 'season_champion_silver'
        | 'season_champion_bronze'
        | 'rank_up'
        | 'iron_man'
        | 'ace',
      seasonId: trophy.seasonId,
      seasonName: trophy.seasonName,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send season start notifications to users at their local 10 AM
 *
 * @param timezones - Timezones currently at 10 AM
 * @param currentSeasonId - Current season ID
 * @param currentSeasonName - Current season name
 */
async function sendSeasonStartNotifications(
  timezones: string[],
  currentSeasonId: string,
  currentSeasonName: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const pendingUserIds = await getUsersWithPendingSeasonStartNotifications(
    timezones,
    currentSeasonId
  );

  for (const userId of pendingUserIds) {
    const result = await sendSeasonStartNotification(userId, {
      seasonId: currentSeasonId,
      seasonName: currentSeasonName,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Get the previous season ID
 *
 * @param currentSeasonId - Current season ID (e.g., "2025-Q1")
 * @returns Previous season ID (e.g., "2024-Q4")
 */
function getPreviousSeasonId(currentSeasonId: string): string {
  const [year, quarter] = currentSeasonId.split('-Q');
  const quarterNum = parseInt(quarter, 10);

  if (quarterNum === 1) {
    return `${parseInt(year, 10) - 1}-Q4`;
  }
  return `${year}-Q${quarterNum - 1}`;
}

/**
 * Main scheduled function - runs every hour
 *
 * On quarter first days:
 * - At 9 AM local time: Send trophy notifications
 * - At 10 AM local time: Send season start notifications
 */
export const sendSeasonNotificationsHourly = onSchedule(
  {
    schedule: '0 * * * *', // Every hour at minute 0
    timeZone: 'UTC', // Run in UTC, we handle timezone logic ourselves
    retryCount: 3,
  },
  async () => {
    console.log('🌍 [SEASON NOTIFY] Starting hourly season notification check...');

    // Get timezones at 9 AM and 10 AM
    const timezonesAt9AM = getTimezonesAtHour(TROPHY_NOTIFICATION_HOUR);
    const timezonesAt10AM = getTimezonesAtHour(SEASON_START_NOTIFICATION_HOUR);

    console.log(`⏰ [SEASON NOTIFY] Timezones at 9 AM:`, timezonesAt9AM);
    console.log(`⏰ [SEASON NOTIFY] Timezones at 10 AM:`, timezonesAt10AM);

    // Check if any of these timezones are on a quarter first day
    const trophyTimezones: string[] = [];
    const seasonStartTimezones: string[] = [];

    // Filter to only timezones where it's actually the first day of a quarter
    for (const tz of timezonesAt9AM) {
      if (isQuarterFirstDay(tz)) {
        trophyTimezones.push(tz);
      }
    }

    for (const tz of timezonesAt10AM) {
      if (isQuarterFirstDay(tz)) {
        seasonStartTimezones.push(tz);
      }
    }

    console.log(`📅 [SEASON NOTIFY] Quarter first day timezones at 9 AM:`, trophyTimezones);
    console.log(`📅 [SEASON NOTIFY] Quarter first day timezones at 10 AM:`, seasonStartTimezones);

    if (trophyTimezones.length === 0 && seasonStartTimezones.length === 0) {
      console.log('✅ [SEASON NOTIFY] No timezones need notifications right now. Exiting.');
      return;
    }

    // Get current season info (use the first timezone that's on a quarter first day)
    const referenceTimezone = trophyTimezones[0] || seasonStartTimezones[0] || DEFAULT_TIMEZONE;
    const { quarter, year } = getCurrentQuarterInTimezone(referenceTimezone);
    const currentSeasonId = getSeasonId(quarter, year);
    const currentSeasonName = getSeasonName(currentSeasonId);
    const previousSeasonId = getPreviousSeasonId(currentSeasonId);

    console.log(`📊 [SEASON NOTIFY] Current season: ${currentSeasonId} (${currentSeasonName})`);
    console.log(`📊 [SEASON NOTIFY] Previous season (for trophies): ${previousSeasonId}`);

    let totalTrophySent = 0;
    let totalTrophyFailed = 0;
    let totalSeasonStartSent = 0;
    let totalSeasonStartFailed = 0;

    // Send trophy notifications (for users at 9 AM local time on quarter first day)
    if (trophyTimezones.length > 0) {
      console.log('🏆 [SEASON NOTIFY] Sending trophy notifications...');
      const { sent, failed } = await sendTrophyNotifications(trophyTimezones, previousSeasonId);
      totalTrophySent = sent;
      totalTrophyFailed = failed;
    }

    // Send season start notifications (for users at 10 AM local time on quarter first day)
    if (seasonStartTimezones.length > 0) {
      console.log('🎾 [SEASON NOTIFY] Sending season start notifications...');
      const { sent, failed } = await sendSeasonStartNotifications(
        seasonStartTimezones,
        currentSeasonId,
        currentSeasonName
      );
      totalSeasonStartSent = sent;
      totalSeasonStartFailed = failed;
    }

    console.log(`🎉 [SEASON NOTIFY] Completed!`);
    console.log(`   - Trophy notifications: ${totalTrophySent} sent, ${totalTrophyFailed} failed`);
    console.log(
      `   - Season start notifications: ${totalSeasonStartSent} sent, ${totalSeasonStartFailed} failed`
    );
  }
);
