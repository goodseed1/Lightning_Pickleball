/**
 * 🌍 Notification i18n Migration Script
 *
 * Migrates existing Korean notification messages to i18n translation keys.
 * This is necessary for App Store review where reviewers expect English content.
 *
 * Usage:
 *   node scripts/migrate-notifications-to-i18n.js [--dry-run]
 *
 * Options:
 *   --dry-run       Preview changes without updating database
 *
 * Examples:
 *   node scripts/migrate-notifications-to-i18n.js --dry-run
 *   node scripts/migrate-notifications-to-i18n.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// ===== KOREAN TO I18N KEY MAPPINGS =====

// Pattern: Korean text pattern -> { key: translation key, extractVars: function to extract variables }
const NOTIFICATION_PATTERNS = [
  // League created
  {
    pattern: /(.+)에서 새로운 리그 "(.+)"이\(가\) 생성되었습니다\. 참가 신청이 시작되었습니다!/,
    key: 'notification.leagueCreated',
    extractVars: match => ({ clubName: match[1], leagueName: match[2] }),
  },
  // Application approved
  {
    pattern: /"(.+)" 참가가 승인되었습니다!/,
    key: 'notification.applicationApproved',
    extractVars: match => ({ eventTitle: match[1] }),
  },
  // Application approved with team
  {
    pattern: /"(.+)" 참가가 승인되었습니다! \(팀: (.+)\)/,
    key: 'notification.applicationApprovedTeam',
    extractVars: match => ({ eventTitle: match[1], teamPartnerName: match[2] }),
  },
  // Team approved (team)
  {
    pattern: /'(.+)'에 (.+) & (.+) 팀이 승인되었습니다\./,
    key: 'notification.teamApprovedTeam',
    extractVars: match => ({
      eventTitle: match[1],
      applicantName: match[2],
      partnerName: match[3],
    }),
  },
  // Team approved (solo)
  {
    pattern: /'(.+)'에 (.+)님이 승인되었습니다\./,
    key: 'notification.teamApprovedSolo',
    extractVars: match => ({ eventTitle: match[1], applicantName: match[2] }),
  },
  // Application closed
  {
    pattern: /"(.+)" 신청이 마감되었습니다\. 다른 팀이 승인되었습니다\./,
    key: 'notification.applicationClosed',
    extractVars: match => ({ eventTitle: match[1] }),
  },
  // Application declined
  {
    pattern: /"(.+)" 참가 신청이 거절되었습니다\./,
    key: 'notification.applicationDeclined',
    extractVars: match => ({ eventTitle: match[1] }),
  },
  // Application declined with team
  {
    pattern: /"(.+)" 참가 신청이 거절되었습니다\. \(팀: (.+)\)/,
    key: 'notification.applicationDeclinedTeam',
    extractVars: match => ({ eventTitle: match[1], teamPartnerName: match[2] }),
  },
  // New application
  {
    pattern: /(.+)님이 "(.+)"에 참가 신청했습니다\./,
    key: 'notification.newApplication',
    extractVars: match => ({ applicantName: match[1], eventTitle: match[2] }),
  },
  // Participation cancelled by host
  {
    pattern: /"(.+)" 참가가 호스트에 의해 취소되었습니다\./,
    key: 'notification.participationCancelledByHost',
    extractVars: match => ({ eventTitle: match[1] }),
  },
  // Participant cancelled
  {
    pattern: /(.+)님이 "(.+)" 참가를 취소했습니다\./,
    key: 'notification.participantCancelled',
    extractVars: match => ({ participantName: match[1], eventTitle: match[2] }),
  },
  // Event cancelled
  {
    pattern: /"(.+)"이\(가\) 호스트에 의해 취소되었습니다\./,
    key: 'notification.eventCancelled',
    extractVars: match => ({ eventTitle: match[1] }),
  },
  // Club ownership transferred
  {
    pattern: /클럽 관리자 권한이 이전되었습니다\. 이제 당신이 이 클럽의 관리자입니다\./,
    key: 'notification.clubOwnershipTransferred',
    extractVars: () => ({}),
  },
  // Club owner changed
  {
    pattern: /'(.+)' 클럽의 관리자가 '(.+)'님으로 변경되었습니다\./,
    key: 'notification.clubOwnerChanged',
    extractVars: match => ({ clubName: match[1], newOwnerName: match[2] }),
  },
  // Playoffs qualified
  {
    pattern: /축하합니다! "(.+)" 리그 플레이오프에 진출하셨습니다!/,
    key: 'notification.playoffsQualified',
    extractVars: match => ({ leagueName: match[1] }),
  },
  // Manager promoted
  {
    pattern: /'(.+)'님이 '(.+)' 클럽의 운영진으로 승진되었습니다!/,
    key: 'notification.managerPromoted',
    extractVars: match => ({ memberName: match[1], clubName: match[2] }),
  },
];

// ===== TITLE MAPPINGS =====
const TITLE_MAPPINGS = {
  '참가 승인됨!': 'notification.applicationApprovedTitle',
  '팀 승인 알림': 'notification.teamApprovedTitle',
  '신청 마감': 'notification.applicationClosedTitle',
  '참가 거절': 'notification.applicationDeclinedTitle',
  '새로운 신청': 'notification.newApplicationTitle',
  '참가 취소됨': 'notification.participationCancelledByHostTitle',
  '참가자 취소': 'notification.participantCancelledTitle',
  '모임 취소': 'notification.eventCancelledTitle',
  '🏆 플레이오프 진출!': 'notification.playoffsQualifiedTitle',
};

/**
 * Convert Korean message to i18n key and extract variables
 */
function convertToI18n(message) {
  if (!message || typeof message !== 'string') return null;

  // Skip if already an i18n key
  if (message.startsWith('notification.')) {
    return null;
  }

  for (const { pattern, key, extractVars } of NOTIFICATION_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const variables = extractVars(match);
      return { key, variables };
    }
  }

  return null;
}

/**
 * Convert Korean title to i18n key
 */
function convertTitleToI18n(title) {
  if (!title || typeof title !== 'string') return null;

  // Skip if already an i18n key
  if (title.startsWith('notification.')) {
    return null;
  }

  return TITLE_MAPPINGS[title] || null;
}

/**
 * Main migration function
 */
async function migrateNotifications() {
  console.log('🌍 Notification i18n Migration Script');
  console.log('=====================================');
  console.log(
    `Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚡ LIVE (database will be updated)'}`
  );
  console.log('');

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    // Fetch all notifications
    console.log('📥 Fetching notifications from Firestore...');
    const notificationsSnapshot = await db.collection('notifications').get();
    console.log(`📊 Found ${notificationsSnapshot.size} notifications\n`);

    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    for (const doc of notificationsSnapshot.docs) {
      totalProcessed++;
      const data = doc.data();
      const updateData = {};
      let needsUpdate = false;

      // Check message
      const messageConversion = convertToI18n(data.message);
      if (messageConversion) {
        updateData.message = messageConversion.key;
        // Store variables in metadata
        if (Object.keys(messageConversion.variables).length > 0) {
          updateData.metadata = {
            ...(data.metadata || {}),
            ...messageConversion.variables,
          };
        }
        needsUpdate = true;
        console.log(
          `  📝 Message: "${data.message?.substring(0, 50)}..." → ${messageConversion.key}`
        );
      }

      // Check title
      const titleConversion = convertTitleToI18n(data.title);
      if (titleConversion) {
        updateData.title = titleConversion;
        needsUpdate = true;
        console.log(`  🏷️  Title: "${data.title}" → ${titleConversion}`);
      }

      if (needsUpdate) {
        if (!isDryRun) {
          batch.update(doc.ref, updateData);
          batchCount++;

          // Commit batch if we hit the limit
          if (batchCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            console.log(`  ✅ Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
        }
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    // Commit remaining updates
    if (!isDryRun && batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Committed final batch of ${batchCount} updates`);
    }

    // Also check activity_notifications collection
    console.log('\n📥 Fetching activity_notifications from Firestore...');
    const activitySnapshot = await db.collection('activity_notifications').get();
    console.log(`📊 Found ${activitySnapshot.size} activity notifications\n`);

    const activityBatch = db.batch();
    let activityBatchCount = 0;

    for (const doc of activitySnapshot.docs) {
      totalProcessed++;
      const data = doc.data();
      const updateData = {};
      let needsUpdate = false;

      // Check message
      const messageConversion = convertToI18n(data.message);
      if (messageConversion) {
        updateData.message = messageConversion.key;
        if (Object.keys(messageConversion.variables).length > 0) {
          updateData.metadata = {
            ...(data.metadata || {}),
            ...messageConversion.variables,
          };
        }
        needsUpdate = true;
        console.log(
          `  📝 Activity Message: "${data.message?.substring(0, 50)}..." → ${messageConversion.key}`
        );
      }

      // Check title
      const titleConversion = convertTitleToI18n(data.title);
      if (titleConversion) {
        updateData.title = titleConversion;
        needsUpdate = true;
        console.log(`  🏷️  Activity Title: "${data.title}" → ${titleConversion}`);
      }

      if (needsUpdate) {
        if (!isDryRun) {
          activityBatch.update(doc.ref, updateData);
          activityBatchCount++;

          if (activityBatchCount >= MAX_BATCH_SIZE) {
            await activityBatch.commit();
            console.log(`  ✅ Committed activity batch of ${activityBatchCount} updates`);
            activityBatchCount = 0;
          }
        }
        totalUpdated++;
      } else {
        totalSkipped++;
      }
    }

    // Commit remaining activity updates
    if (!isDryRun && activityBatchCount > 0) {
      await activityBatch.commit();
      console.log(`  ✅ Committed final activity batch of ${activityBatchCount} updates`);
    }
  } catch (error) {
    console.error('❌ Error during migration:', error);
    totalErrors++;
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Migration Summary');
  console.log('=====================================');
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Total skipped (already i18n or no match): ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN - No changes were made to the database');
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Migration completed!');
  }
}

// Run the migration
migrateNotifications()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
