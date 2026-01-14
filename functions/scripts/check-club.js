/**
 * 🔍 CHECK CLUB EXISTENCE
 *
 * Verify if the club exists in Firestore and get its data
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Club ID from the error log
const clubId = '0PD3UpnBw5JPJOaSM2H8';

async function checkClub() {
  console.log('🔍 Checking club existence...');
  console.log(`📋 Club ID: ${clubId}`);
  console.log('');

  try {
    // Check if club exists
    const clubRef = db.collection('pickleball_clubs').doc(clubId);
    const clubDoc = await clubRef.get();

    if (clubDoc.exists) {
      console.log('✅ Club EXISTS in Firestore!');
      console.log('');
      console.log('📊 Club Data:');
      console.log(JSON.stringify(clubDoc.data(), null, 2));
    } else {
      console.log('❌ Club DOES NOT EXIST in Firestore!');
      console.log('');
      console.log('🔍 Let\'s search for all clubs with "원이" in the name...');

      const allClubsSnapshot = await db.collection('pickleball_clubs').get();
      console.log(`📊 Total clubs in database: ${allClubsSnapshot.size}`);
      console.log('');

      const wonClubs = [];
      allClubsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.includes('원이')) {
          wonClubs.push({
            id: doc.id,
            name: data.name,
            address: data.address,
          });
        }
      });

      if (wonClubs.length > 0) {
        console.log(`✅ Found ${wonClubs.length} club(s) with "원이" in name:`);
        wonClubs.forEach(club => {
          console.log('');
          console.log(`  ID: ${club.id}`);
          console.log(`  Name: ${club.name}`);
          console.log(`  Address: ${club.address || 'N/A'}`);
        });
      } else {
        console.log('❌ No clubs found with "원이" in name');
        console.log('');
        console.log('📋 All clubs in database:');
        allClubsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`  - ${doc.id}: ${data.name || 'Unnamed'}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error checking club:', error);
    throw error;
  }
}

// Run the check
checkClub()
  .then(() => {
    console.log('');
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
