#!/usr/bin/env node
/**
 * 🔍 Check coordinates field in coachLessons and pickleballServices
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkCoordinates() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 Coordinates Field Check for Coach Lessons & Services   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check coach_lessons (not coachLessons!)
  console.log('📚 Checking coach_lessons collection...');
  const lessonsSnapshot = await db.collection('coach_lessons').limit(20).get();

  let lessonsWithCoords = 0;
  let lessonsWithoutCoords = 0;

  lessonsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const hasCoords = !!data.coordinates;
    console.log(
      `   ${hasCoords ? '✅' : '❌'} ${doc.id.substring(0, 20)}... | ${data.title || 'No title'} | coords: ${hasCoords ? `${data.coordinates.latitude?.toFixed(4)}, ${data.coordinates.longitude?.toFixed(4)}` : 'MISSING'}`
    );

    if (hasCoords) lessonsWithCoords++;
    else lessonsWithoutCoords++;
  });

  console.log(
    `\n   Summary: ${lessonsWithCoords} with coords, ${lessonsWithoutCoords} without coords`
  );

  // Check pickleball_services (not pickleballServices!)
  console.log('\n🎾 Checking pickleball_services collection...');
  const servicesSnapshot = await db.collection('pickleball_services').limit(20).get();

  let servicesWithCoords = 0;
  let servicesWithoutCoords = 0;

  servicesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const hasCoords = !!data.coordinates;
    console.log(
      `   ${hasCoords ? '✅' : '❌'} ${doc.id.substring(0, 20)}... | ${data.title || 'No title'} | coords: ${hasCoords ? `${data.coordinates.latitude?.toFixed(4)}, ${data.coordinates.longitude?.toFixed(4)}` : 'MISSING'}`
    );

    if (hasCoords) servicesWithCoords++;
    else servicesWithoutCoords++;
  });

  console.log(
    `\n   Summary: ${servicesWithCoords} with coords, ${servicesWithoutCoords} without coords`
  );

  // Check if author has coordinates in users collection
  if (lessonsWithoutCoords > 0 || servicesWithoutCoords > 0) {
    console.log('\n📍 Checking if authors have coordinates in users collection...');

    // Get a sample without coords
    const sampleLesson = lessonsSnapshot.docs.find(doc => !doc.data().coordinates);
    if (sampleLesson) {
      const authorId = sampleLesson.data().authorId;
      const userDoc = await db.collection('users').doc(authorId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   Sample author: ${authorId}`);
        console.log(`   User has profile.location: ${!!userData.profile?.location}`);
        console.log(`   User has profile.coordinates: ${!!userData.profile?.coordinates}`);
        if (userData.profile?.coordinates) {
          console.log(
            `   Coords: ${userData.profile.coordinates.latitude}, ${userData.profile.coordinates.longitude}`
          );
        }
      }
    }
  }

  console.log('\n👋 Done!');
}

checkCoordinates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
