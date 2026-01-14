#!/usr/bin/env node
/**
 * 🎯 [KIM] Migration Script: Backfill gender field for existing clubMembers documents
 *
 * This script reads gender from the users collection and updates clubMembers documents
 * that are missing the gender field.
 *
 * Usage:
 *   node scripts/migrate-clubmembers-gender.js
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show detailed logs
 *   --club-id=   Only migrate members of specific club
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK');
  console.error('   Make sure serviceAccountKey.json exists in the project root');
  console.error('   Error:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const clubIdArg = args.find(arg => arg.startsWith('--club-id='));
const targetClubId = clubIdArg ? clubIdArg.split('=')[1] : null;

async function migrateClubMembersGender() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🎯 ClubMembers Gender Migration for Lightning Tennis      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚡ LIVE RUN'}`);
  if (targetClubId) {
    console.log(`   Target Club: ${targetClubId}`);
  }
  console.log('');

  // 1. Fetch all active clubMembers documents
  console.log('📊 Fetching active clubMembers...');

  let query = db.collection('clubMembers').where('status', '==', 'active');
  if (targetClubId) {
    query = query.where('clubId', '==', targetClubId);
  }

  const clubMembersSnapshot = await query.get();

  const membersWithoutGender = [];
  const membersWithGender = [];

  clubMembersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!data.gender) {
      membersWithoutGender.push({ id: doc.id, ...data });
    } else {
      membersWithGender.push({ id: doc.id, ...data });
    }
  });

  console.log(`   Total active members: ${clubMembersSnapshot.size}`);
  console.log(`   ✅ Already have gender: ${membersWithGender.length}`);
  console.log(`   ❌ Missing gender: ${membersWithoutGender.length}`);
  console.log('');

  if (membersWithoutGender.length === 0) {
    console.log('🎉 No migration needed! All clubMembers have gender field.');
    return;
  }

  // 2. Collect unique userIds
  const userIds = [...new Set(membersWithoutGender.map(m => m.userId))];
  console.log(`👤 Unique users to lookup: ${userIds.length}`);

  // 3. Fetch user data in batches (Firestore limit: 30 items per IN query)
  console.log('📥 Fetching user gender data from users collection...');

  const userGenderMap = new Map();
  const batchSize = 30;

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const usersSnapshot = await db
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', batch)
      .get();

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Check both gender and profile.gender locations
      const rawGender = data.gender || data.profile?.gender;
      // 🎯 [KIM FIX] Handle case-insensitive comparison (e.g., "Male" vs "male")
      const gender = rawGender?.toLowerCase();
      if (gender === 'male' || gender === 'female') {
        userGenderMap.set(doc.id, gender);
      }
    });

    if (isVerbose) {
      console.log(
        `   Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(userIds.length / batchSize)}`
      );
    }
  }

  console.log(`   Found gender for ${userGenderMap.size}/${userIds.length} users`);
  console.log('');

  // 4. Update clubMembers documents
  console.log('📝 Updating clubMembers documents...');
  console.log('━'.repeat(60));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const writeBatch = db.batch();
  let batchCount = 0;
  const maxBatchSize = 500; // Firestore batch limit

  for (const member of membersWithoutGender) {
    const userGender = userGenderMap.get(member.userId);

    if (!userGender) {
      if (isVerbose) {
        console.log(`   ⏭️ Skipping ${member.id} - user gender not found in users collection`);
      }
      skipped++;
      continue;
    }

    console.log(`   ${isDryRun ? '🔍' : '✏️'} ${member.id} -> gender: ${userGender}`);

    if (!isDryRun) {
      const memberRef = db.collection('clubMembers').doc(member.id);
      writeBatch.update(memberRef, {
        gender: userGender,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batchCount++;

      // Commit batch when reaching limit
      if (batchCount >= maxBatchSize) {
        try {
          await writeBatch.commit();
          console.log(`   ✅ Committed batch of ${batchCount} updates`);
          batchCount = 0;
        } catch (error) {
          console.error(`   ❌ Error committing batch:`, error.message);
          errors += batchCount;
          batchCount = 0;
        }
      }
    }
    updated++;
  }

  // Commit remaining updates
  if (!isDryRun && batchCount > 0) {
    try {
      await writeBatch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} updates`);
    } catch (error) {
      console.error(`   ❌ Error committing final batch:`, error.message);
      errors += batchCount;
    }
  }

  // 5. Summary
  console.log('\n━'.repeat(60));
  console.log('\n📊 Migration Summary');
  console.log('═'.repeat(40));
  console.log(`   ${isDryRun ? '🔍 Would update' : '✅ Updated'}: ${updated}`);
  console.log(`   ⏭️ Skipped (user has no gender): ${skipped}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
  console.log('═'.repeat(40));

  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('\n🎉 Migration completed!');
  }

  // Show users that need manual review
  if (skipped > 0) {
    console.log('\n⚠️  Some members were skipped because their user accounts');
    console.log('   do not have a gender field set. These users should update');
    console.log('   their gender in their profile settings.');
  }
}

// Run migration
migrateClubMembersGender()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
