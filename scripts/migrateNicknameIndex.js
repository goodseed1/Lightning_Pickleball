/**
 * 🏷️ Nickname Index Migration Script
 *
 * This script migrates existing user nicknames to the nickname_index collection.
 * It creates index entries for all users with nicknames to enable the unique
 * nickname enforcement system.
 *
 * Usage: node scripts/migrateNicknameIndex.js [--dry-run]
 *
 * Options:
 *   --dry-run  Only simulate the migration without making changes
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Normalize nickname for comparison (same logic as Cloud Function)
function normalizeNickname(nickname) {
  return nickname.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Extract nickname from user document
function extractNickname(userData) {
  if (!userData) return null;

  // Check profile.nickname first (primary location)
  if (userData.profile?.nickname && typeof userData.profile.nickname === 'string') {
    return userData.profile.nickname.trim() || null;
  }

  // Check displayName as fallback
  if (userData.displayName && typeof userData.displayName === 'string') {
    return userData.displayName.trim() || null;
  }

  // Check nickname at root level
  if (userData.nickname && typeof userData.nickname === 'string') {
    return userData.nickname.trim() || null;
  }

  return null;
}

async function migrateNicknameIndex() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('🏷️ === Nickname Index Migration ===');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✏️ LIVE (making changes)'}`);
  console.log('');

  try {
    // 1. Get all users
    console.log('📥 Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users\n`);

    // 2. Track statistics
    const stats = {
      total: usersSnapshot.size,
      withNickname: 0,
      created: 0,
      skipped: 0,
      conflicts: [],
      errors: [],
    };

    // 3. Track nicknames to detect conflicts
    const nicknameMap = new Map(); // normalized -> { uid, originalNickname }

    // 4. First pass: collect all nicknames
    console.log('📊 Analyzing nicknames...\n');
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const nickname = extractNickname(userData);

      if (nickname) {
        stats.withNickname++;
        const normalized = normalizeNickname(nickname);

        if (nicknameMap.has(normalized)) {
          // Conflict detected!
          const existing = nicknameMap.get(normalized);
          stats.conflicts.push({
            normalized,
            users: [
              { uid: existing.uid, nickname: existing.originalNickname },
              { uid: doc.id, nickname },
            ],
          });
        } else {
          nicknameMap.set(normalized, { uid: doc.id, originalNickname: nickname });
        }
      }
    });

    console.log(`📈 Statistics:`);
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Users with nickname: ${stats.withNickname}`);
    console.log(`   Unique nicknames: ${nicknameMap.size}`);
    console.log(`   Conflicts detected: ${stats.conflicts.length}`);
    console.log('');

    // 5. Show conflicts if any
    if (stats.conflicts.length > 0) {
      console.log('⚠️ Nickname Conflicts (first user will be indexed):');
      stats.conflicts.forEach((conflict, i) => {
        console.log(
          `   ${i + 1}. "${conflict.normalized}" used by ${conflict.users.length} users:`
        );
        conflict.users.forEach((user, j) => {
          console.log(
            `      ${j === 0 ? '✅' : '❌'} ${user.uid} - "${user.nickname}" ${j === 0 ? '(will be indexed)' : '(skipped)'}`
          );
        });
      });
      console.log('');
    }

    // 6. Create nickname_index entries
    console.log('📝 Creating nickname_index entries...\n');

    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    for (const [normalized, data] of nicknameMap) {
      // Check if index already exists
      const indexRef = db.collection('nickname_index').doc(normalized);
      const existingIndex = await indexRef.get();

      if (existingIndex.exists) {
        console.log(`   ⏭️ Skip "${normalized}" - already indexed`);
        stats.skipped++;
        continue;
      }

      const indexData = {
        uid: data.uid,
        originalNickname: data.originalNickname,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedAt: admin.firestore.FieldValue.serverTimestamp(), // Mark as migrated
      };

      if (!isDryRun) {
        batch.set(indexRef, indexData);
        batchCount++;

        // Commit batch if approaching limit
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`   💾 Committed batch of ${batchCount} entries`);
          batchCount = 0;
        }
      }

      console.log(`   ✅ Index "${normalized}" -> ${data.uid} (${data.originalNickname})`);
      stats.created++;
    }

    // Commit remaining batch
    if (!isDryRun && batchCount > 0) {
      await batch.commit();
      console.log(`   💾 Committed final batch of ${batchCount} entries`);
    }

    // 7. Summary
    console.log('\n🎉 === Migration Complete ===');
    console.log(`   Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`   Indexes created: ${stats.created}`);
    console.log(`   Indexes skipped (already exist): ${stats.skipped}`);
    console.log(`   Conflicts (second+ user skipped): ${stats.conflicts.length}`);

    if (isDryRun) {
      console.log('\n💡 Run without --dry-run to apply changes');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateNicknameIndex();
