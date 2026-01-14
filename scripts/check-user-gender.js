#!/usr/bin/env node
/**
 * 🔍 Check user location field structure (DETAILED)
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkUserLocations() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 User Location Structure Check (DETAILED)               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get authors from coach_lessons and pickleball_services
  const lessonsSnapshot = await db.collection('coach_lessons').get();
  const servicesSnapshot = await db.collection('pickleball_services').get();

  const authorIds = new Set();
  lessonsSnapshot.docs.forEach(doc => authorIds.add(doc.data().authorId));
  servicesSnapshot.docs.forEach(doc => authorIds.add(doc.data().authorId));

  console.log(`👥 Found ${authorIds.size} unique authors\n`);

  for (const authorId of authorIds) {
    const userDoc = await db.collection('users').doc(authorId).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`📍 Author: ${authorId}`);
      console.log(`   displayName: ${data.displayName || data.profile?.nickname || 'N/A'}`);

      // Detailed location inspection
      console.log(
        '\n   📦 profile.location (FULL):',
        JSON.stringify(data.profile?.location, null, 4)
      );
      console.log('\n   📦 location (root, FULL):', JSON.stringify(data.location, null, 4));

      // Extract coordinates if they exist
      const profileLoc = data.profile?.location;
      const rootLoc = data.location;

      if (profileLoc) {
        console.log('   🎯 profile.location.latitude:', profileLoc.latitude);
        console.log('   🎯 profile.location.longitude:', profileLoc.longitude);
        console.log('   🎯 profile.location.lat:', profileLoc.lat);
        console.log('   🎯 profile.location.lng:', profileLoc.lng);
      }
      if (rootLoc) {
        console.log('   🎯 location.latitude:', rootLoc.latitude);
        console.log('   🎯 location.longitude:', rootLoc.longitude);
        console.log('   🎯 location.lat:', rootLoc.lat);
        console.log('   🎯 location.lng:', rootLoc.lng);
      }

      console.log('\n' + '─'.repeat(60) + '\n');
    }
  }

  console.log('👋 Done!');
}

checkUserLocations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
