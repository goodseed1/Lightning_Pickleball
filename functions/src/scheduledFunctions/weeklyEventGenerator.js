const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Scheduled Cloud Function: Weekly Event Generator
 * Runs every Sunday at midnight (00:00 UTC)
 * Generates Lightning Events for the next week based on club schedules
 */
exports.generateWeeklyEvents = functions.pubsub
  .schedule('0 0 * * 0') // Every Sunday at midnight (cron: minute hour day month day-of-week)
  .timeZone('America/New_York') // Adjust timezone as needed
  .onRun(async context => {
    console.log('🕒 Weekly Event Generator started at:', new Date().toISOString());

    try {
      // Get next week's date range
      const nextWeek = getNextWeekDateRange();
      console.log(
        `📅 Generating events for week: ${nextWeek.startDate.toISOString()} to ${nextWeek.endDate.toISOString()}`
      );

      // Read all active club schedules
      const clubSchedules = await getAllActiveClubSchedules();
      console.log(`📋 Found ${clubSchedules.length} active club schedules`);

      if (clubSchedules.length === 0) {
        console.log('ℹ️ No active club schedules found. Exiting.');
        return null;
      }

      // Generate events for each schedule
      let totalEventsCreated = 0;
      let totalErrors = 0;
      const results = [];

      for (const schedule of clubSchedules) {
        try {
          const eventsCreated = await generateEventsForSchedule(schedule, nextWeek);
          totalEventsCreated += eventsCreated;
          results.push({
            scheduleId: schedule.id,
            clubId: schedule.clubId,
            eventsCreated,
            success: true,
          });

          console.log(
            `✅ Created ${eventsCreated} events for schedule ${schedule.id} (${schedule.title})`
          );
        } catch (error) {
          totalErrors++;
          console.error(`❌ Error generating events for schedule ${schedule.id}:`, error);
          results.push({
            scheduleId: schedule.id,
            clubId: schedule.clubId,
            eventsCreated: 0,
            success: false,
            error: error.message,
          });
        }
      }

      // Log final results
      console.log(`🎉 Weekly event generation completed:`);
      console.log(`   📊 Total events created: ${totalEventsCreated}`);
      console.log(`   ❌ Total errors: ${totalErrors}`);
      console.log(`   📋 Processed ${clubSchedules.length} schedules`);

      // Store execution log (optional)
      await storeExecutionLog({
        executedAt: admin.firestore.FieldValue.serverTimestamp(),
        weekRange: nextWeek,
        schedulesProcessed: clubSchedules.length,
        eventsCreated: totalEventsCreated,
        errors: totalErrors,
        results: results,
      });

      return {
        success: true,
        eventsCreated: totalEventsCreated,
        schedulesProcessed: clubSchedules.length,
        errors: totalErrors,
      };
    } catch (error) {
      console.error('💥 Critical error in weekly event generator:', error);

      // Store error log
      await storeExecutionLog({
        executedAt: admin.firestore.FieldValue.serverTimestamp(),
        success: false,
        error: error.message,
        stack: error.stack,
      });

      throw error; // Re-throw to mark function execution as failed
    }
  });

/**
 * Get the date range for next week (Sunday to Saturday)
 * @returns {Object} Object with startDate and endDate
 */
function getNextWeekDateRange() {
  const now = new Date();

  // Calculate next Sunday (start of next week)
  const nextSunday = new Date(now);
  const daysUntilNextSunday = (7 - now.getDay()) % 7 || 7;
  nextSunday.setDate(now.getDate() + daysUntilNextSunday);
  nextSunday.setHours(0, 0, 0, 0);

  // Calculate next Saturday (end of next week)
  const nextSaturday = new Date(nextSunday);
  nextSaturday.setDate(nextSunday.getDate() + 6);
  nextSaturday.setHours(23, 59, 59, 999);

  return {
    startDate: nextSunday,
    endDate: nextSaturday,
  };
}

/**
 * Retrieve all active club schedules from Firestore
 * @returns {Promise<Array>} Array of club schedule documents
 */
async function getAllActiveClubSchedules() {
  try {
    const schedulesSnapshot = await db
      .collection('clubSchedules')
      .where('isActive', '==', true)
      .get();

    const schedules = [];
    schedulesSnapshot.forEach(doc => {
      schedules.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return schedules;
  } catch (error) {
    console.error('Error fetching club schedules:', error);
    throw error;
  }
}

/**
 * Generate Lightning Events for a specific schedule for the next week
 * @param {Object} schedule - Club schedule document
 * @param {Object} weekRange - Week date range {startDate, endDate}
 * @returns {Promise<number>} Number of events created
 */
async function generateEventsForSchedule(schedule, weekRange) {
  const eventsToCreate = [];

  // Calculate event date for this schedule in the next week
  const eventDate = calculateEventDate(schedule.dayOfWeek, weekRange.startDate);

  // Skip if event date is outside the week range (shouldn't happen, but safety check)
  if (eventDate < weekRange.startDate || eventDate > weekRange.endDate) {
    console.log(
      `⚠️ Event date ${eventDate.toISOString()} is outside week range for schedule ${schedule.id}`
    );
    return 0;
  }

  // Check if event already exists for this date and schedule
  const existingEvent = await checkExistingEvent(schedule.clubId, schedule.id, eventDate);
  if (existingEvent) {
    console.log(
      `ℹ️ Event already exists for schedule ${schedule.id} on ${eventDate.toDateString()}`
    );
    return 0;
  }

  // Create event data
  const eventData = createEventDataFromSchedule(schedule, eventDate);
  eventsToCreate.push(eventData);

  // Batch create events (in this case, just one per schedule per week)
  if (eventsToCreate.length > 0) {
    await batchCreateEvents(eventsToCreate);
    return eventsToCreate.length;
  }

  return 0;
}

/**
 * Calculate the event date for a given day of week within the target week
 * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param {Date} weekStartDate - Start date of the target week (Sunday)
 * @returns {Date} Event date
 */
function calculateEventDate(dayOfWeek, weekStartDate) {
  const eventDate = new Date(weekStartDate);
  eventDate.setDate(weekStartDate.getDate() + dayOfWeek);
  return eventDate;
}

/**
 * Check if an event already exists for the given schedule and date
 * @param {string} clubId - Club ID
 * @param {string} scheduleId - Schedule ID
 * @param {Date} eventDate - Event date to check
 * @returns {Promise<boolean>} True if event exists, false otherwise
 */
async function checkExistingEvent(clubId, scheduleId, eventDate) {
  try {
    // Set date range for the specific day
    const startOfDay = new Date(eventDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(eventDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingEventsSnapshot = await db
      .collection('events')
      .where('clubId', '==', clubId)
      .where('scheduleId', '==', scheduleId)
      .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
      .where('dateTime', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
      .limit(1)
      .get();

    return !existingEventsSnapshot.empty;
  } catch (error) {
    console.error('Error checking existing event:', error);
    return false; // If error, assume no existing event and proceed
  }
}

/**
 * Create event data object from club schedule
 * @param {Object} schedule - Club schedule document
 * @param {Date} eventDate - Date for the event
 * @returns {Object} Event data object
 */
function createEventDataFromSchedule(schedule, eventDate) {
  // Parse time from schedule (format: "HH:MM")
  const [hours, minutes] = schedule.time.split(':').map(Number);

  // Create event date with time
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(hours, minutes, 0, 0);

  // Calculate end time
  const endDateTime = new Date(eventDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + schedule.duration);

  return {
    // Basic event information
    title: schedule.title,
    description: schedule.description || `${schedule.title} - 정기 모임`,
    type: 'meetup', // Lightning meetup type

    // Schedule reference
    scheduleId: schedule.id,
    isRecurringEvent: true,
    recurringTags: ['정기모임', 'regular_meeting'],

    // Club information
    clubId: schedule.clubId,

    // Date and time
    dateTime: admin.firestore.Timestamp.fromDate(eventDateTime),
    endTime: admin.firestore.Timestamp.fromDate(endDateTime),
    duration: schedule.duration,

    // Location (copied from schedule)
    location: {
      name: schedule.location.name,
      address: schedule.location.address,
      coordinates: schedule.location.coordinates || null,
      instructions: schedule.location.instructions || '',
      indoorOutdoor: schedule.location.indoorOutdoor,
      courtIds: schedule.location.courtIds || [],
    },

    // Host information (use club as host for recurring events)
    hostId: 'system', // System-generated event
    hostType: 'club',

    // Participation settings (from schedule)
    participantSettings: {
      maxParticipants: schedule.participationInfo.maxParticipants || null,
      minParticipants: schedule.participationInfo.minParticipants || null,
      skillLevelRequired: schedule.participationInfo.skillLevelRequired || '',
      registrationRequired: schedule.participationInfo.registrationRequired || false,
      registrationDeadline: schedule.participationInfo.registrationDeadline || 24, // hours before
      memberOnly: schedule.participationInfo.memberOnly || false,
      guestAllowed: schedule.participationInfo.guestAllowed || true,
      maxGuestsPerMember: schedule.participationInfo.maxGuestsPerMember || 0,
    },

    // Fee information (if applicable)
    fee: schedule.participationInfo.fee
      ? {
          amount: schedule.participationInfo.fee.amount,
          currency: schedule.participationInfo.fee.currency,
          description: schedule.participationInfo.fee.description || 'Session fee',
          required: true,
        }
      : null,

    // Event status and participants
    status: 'scheduled',
    participants: [],
    waitlist: [],
    participantCount: 0,

    // Special tags for recurring events
    tags: ['정기모임', 'regular_meeting', 'club_event', schedule.scheduleType],

    // Metadata
    createdBy: 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    // Special fields for recurring events
    autoGenerated: true,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    generatorVersion: '1.0.0',
  };
}

/**
 * Batch create multiple events
 * @param {Array} eventsData - Array of event data objects
 * @returns {Promise<void>}
 */
async function batchCreateEvents(eventsData) {
  const batch = db.batch();

  eventsData.forEach(eventData => {
    const eventRef = db.collection('events').doc();
    batch.set(eventRef, eventData);
  });

  await batch.commit();
  console.log(`📝 Batch created ${eventsData.length} events`);
}

/**
 * Store execution log for monitoring and debugging
 * @param {Object} logData - Execution log data
 * @returns {Promise<void>}
 */
async function storeExecutionLog(logData) {
  try {
    await db
      .collection('functionLogs')
      .doc('weeklyEventGenerator')
      .collection('executions')
      .add(logData);
  } catch (error) {
    console.error('Error storing execution log:', error);
    // Don't throw error here to avoid affecting main function
  }
}

/**
 * Manual trigger function for testing (can be called via HTTP)
 * DELETE THIS IN PRODUCTION or secure it properly
 */
exports.generateWeeklyEventsManual = functions.https.onRequest(async (req, res) => {
  console.log('🔧 Manual weekly event generation triggered');

  try {
    // Call the main function logic
    const result = await exports.generateWeeklyEvents.handler();

    res.status(200).json({
      success: true,
      message: 'Weekly events generated successfully',
      result: result,
    });
  } catch (error) {
    console.error('Error in manual generation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Health check function for the scheduled function
 */
exports.weeklyEventGeneratorHealth = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    function: 'generateWeeklyEvents',
    schedule: '0 0 * * 0', // Every Sunday at midnight
    timezone: 'America/New_York',
    lastModified: '2025-08-11',
    version: '1.0.0',
  });
});

// Export helper functions for testing
module.exports.helpers = {
  getNextWeekDateRange,
  calculateEventDate,
  createEventDataFromSchedule,
  checkExistingEvent,
};
