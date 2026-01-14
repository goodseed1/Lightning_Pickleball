#!/usr/bin/env node
/**
 * 🎯 [KIM] Migration Script: Backfill coordinates for coach_lessons and pickleball_services
 *
 * This script reads author coordinates from users collection and updates
 * coach_lessons/pickleball_services documents that are missing the coordinates field.
 *
 * Usage:
 *   node scripts/migrate-coordinates.js
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show detailed logs
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

/**
 * Extract coordinates from user data
 * Tries multiple locations in priority order
 */
function extractCoordinates(userData) {
  // Priority 1: profile.location (most detailed)
  const profileLoc = userData.profile?.location;
  if (profileLoc?.latitude && profileLoc?.longitude) {
    return {
      latitude: profileLoc.latitude,
      longitude: profileLoc.longitude,
    };
  }

  // Priority 2: root location
  const rootLoc = userData.location;
  if (rootLoc?.latitude && rootLoc?.longitude) {
    return {
      latitude: rootLoc.latitude,
      longitude: rootLoc.longitude,
    };
  }

  return null;
}

async function migrateCoordinates() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🎯 Coordinates Migration for Coach Lessons & Services     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '⚡ LIVE RUN'}`);
  console.log('');

  // ========================
  // 1. Migrate coach_lessons
  // ========================
  console.log('📚 Processing coach_lessons...');
  const lessonsSnapshot = await db.collection('coach_lessons').get();

  const lessonsWithoutCoords = [];
  const lessonsWithCoords = [];

  lessonsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    // Check for valid coordinates (not null, not 0,0)
    const hasValidCoords =
      data.coordinates && data.coordinates.latitude !== 0 && data.coordinates.longitude !== 0;

    if (!hasValidCoords) {
      lessonsWithoutCoords.push({ id: doc.id, ...data });
    } else {
      lessonsWithCoords.push({ id: doc.id, ...data });
    }
  });

  console.log(`   Total lessons: ${lessonsSnapshot.size}`);
  console.log(`   ✅ Already have valid coordinates: ${lessonsWithCoords.length}`);
  console.log(`   ❌ Missing or invalid coordinates: ${lessonsWithoutCoords.length}`);
  console.log('');

  // Collect unique authorIds
  const lessonAuthorIds = [...new Set(lessonsWithoutCoords.map(l => l.authorId))];
  console.log(`   👤 Unique authors to lookup: ${lessonAuthorIds.length}`);

  // Fetch author coordinates
  const authorCoordsMap = new Map();
  for (const authorId of lessonAuthorIds) {
    const userDoc = await db.collection('users').doc(authorId).get();
    if (userDoc.exists) {
      const coords = extractCoordinates(userDoc.data());
      if (coords) {
        authorCoordsMap.set(authorId, coords);
      }
    }
  }
  console.log(
    `   📍 Found coordinates for ${authorCoordsMap.size}/${lessonAuthorIds.length} authors`
  );
  console.log('');

  // Update lessons
  console.log('📝 Updating coach_lessons...');
  console.log('━'.repeat(60));

  let lessonsUpdated = 0;
  let lessonsSkipped = 0;

  for (const lesson of lessonsWithoutCoords) {
    const authorCoords = authorCoordsMap.get(lesson.authorId);

    if (!authorCoords) {
      if (isVerbose) {
        console.log(`   ⏭️ Skipping ${lesson.id} - author coordinates not found`);
      }
      lessonsSkipped++;
      continue;
    }

    console.log(
      `   ${isDryRun ? '🔍' : '✏️'} ${lesson.title || lesson.id.substring(0, 20)} -> coords: ${authorCoords.latitude.toFixed(4)}, ${authorCoords.longitude.toFixed(4)}`
    );

    if (!isDryRun) {
      await db.collection('coach_lessons').doc(lesson.id).update({
        coordinates: authorCoords,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    lessonsUpdated++;
  }

  // ========================
  // 2. Migrate pickleball_services
  // ========================
  console.log('\n🎾 Processing pickleball_services...');
  const servicesSnapshot = await db.collection('pickleball_services').get();

  const servicesWithoutCoords = [];
  const servicesWithCoords = [];

  servicesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const hasValidCoords =
      data.coordinates && data.coordinates.latitude !== 0 && data.coordinates.longitude !== 0;

    if (!hasValidCoords) {
      servicesWithoutCoords.push({ id: doc.id, ...data });
    } else {
      servicesWithCoords.push({ id: doc.id, ...data });
    }
  });

  console.log(`   Total services: ${servicesSnapshot.size}`);
  console.log(`   ✅ Already have valid coordinates: ${servicesWithCoords.length}`);
  console.log(`   ❌ Missing or invalid coordinates: ${servicesWithoutCoords.length}`);
  console.log('');

  // Collect unique authorIds
  const serviceAuthorIds = [...new Set(servicesWithoutCoords.map(s => s.authorId))];
  console.log(`   👤 Unique authors to lookup: ${serviceAuthorIds.length}`);

  // Fetch author coordinates (reuse if already fetched)
  for (const authorId of serviceAuthorIds) {
    if (!authorCoordsMap.has(authorId)) {
      const userDoc = await db.collection('users').doc(authorId).get();
      if (userDoc.exists) {
        const coords = extractCoordinates(userDoc.data());
        if (coords) {
          authorCoordsMap.set(authorId, coords);
        }
      }
    }
  }
  console.log(
    `   📍 Found coordinates for ${serviceAuthorIds.filter(id => authorCoordsMap.has(id)).length}/${serviceAuthorIds.length} authors`
  );
  console.log('');

  // Update services
  console.log('📝 Updating pickleball_services...');
  console.log('━'.repeat(60));

  let servicesUpdated = 0;
  let servicesSkipped = 0;

  for (const service of servicesWithoutCoords) {
    const authorCoords = authorCoordsMap.get(service.authorId);

    if (!authorCoords) {
      if (isVerbose) {
        console.log(`   ⏭️ Skipping ${service.id} - author coordinates not found`);
      }
      servicesSkipped++;
      continue;
    }

    console.log(
      `   ${isDryRun ? '🔍' : '✏️'} ${service.title || service.id.substring(0, 20)} -> coords: ${authorCoords.latitude.toFixed(4)}, ${authorCoords.longitude.toFixed(4)}`
    );

    if (!isDryRun) {
      await db.collection('pickleball_services').doc(service.id).update({
        coordinates: authorCoords,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    servicesUpdated++;
  }

  // ========================
  // 3. Summary
  // ========================
  console.log('\n━'.repeat(60));
  console.log('\n📊 Migration Summary');
  console.log('═'.repeat(40));
  console.log(`   📚 coach_lessons:`);
  console.log(`      ${isDryRun ? '🔍 Would update' : '✅ Updated'}: ${lessonsUpdated}`);
  console.log(`      ⏭️ Skipped: ${lessonsSkipped}`);
  console.log(`   🎾 pickleball_services:`);
  console.log(`      ${isDryRun ? '🔍 Would update' : '✅ Updated'}: ${servicesUpdated}`);
  console.log(`      ⏭️ Skipped: ${servicesSkipped}`);
  console.log('═'.repeat(40));

  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('\n🎉 Migration completed!');
  }
}

// Run migration
migrateCoordinates()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
