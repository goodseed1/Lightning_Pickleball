// Check Kwangyeol Bae's location data in Firestore
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkUserLocation() {
  try {
    // Search for Kwangyeol Bae by displayName
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('displayName', '==', 'Kwangyeol Bae').get();

    if (snapshot.empty) {
      // Try partial match
      const allUsers = await usersRef.get();
      let found = false;

      allUsers.forEach(doc => {
        const data = doc.data();
        if (data.displayName && data.displayName.includes('Kwangyeol')) {
          found = true;
          console.log('\n========================================');
          console.log('User ID:', doc.id);
          console.log('Display Name:', data.displayName);
          console.log('========================================\n');

          console.log('📍 Location Data:');
          console.log(JSON.stringify(data.location, null, 2));

          console.log('\n📍 Profile Location:');
          if (data.profile && data.profile.location) {
            console.log(JSON.stringify(data.profile.location, null, 2));
          } else {
            console.log('No profile.location found');
          }

          console.log('\n🔍 Full Profile Object:');
          if (data.profile) {
            console.log(JSON.stringify(data.profile, null, 2));
          }

          // Check for lat/lng specifically
          console.log('\n✅ Location Coordinate Check:');
          const loc = data.location || (data.profile && data.profile.location);
          if (loc) {
            console.log('- latitude:', loc.latitude !== undefined ? loc.latitude : 'MISSING');
            console.log('- longitude:', loc.longitude !== undefined ? loc.longitude : 'MISSING');
            console.log('- lat:', loc.lat !== undefined ? loc.lat : 'MISSING');
            console.log('- lng:', loc.lng !== undefined ? loc.lng : 'MISSING');
            console.log('- address:', loc.address || loc.city || loc.formattedAddress || 'MISSING');
          } else {
            console.log('❌ No location object found at all!');
          }
        }
      });

      if (!found) {
        console.log('No user found with name containing "Kwangyeol"');
      }
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('\n========================================');
        console.log('User ID:', doc.id);
        console.log('Display Name:', data.displayName);
        console.log('========================================\n');

        console.log('📍 Location Data:');
        console.log(JSON.stringify(data.location, null, 2));

        console.log('\n🔍 Full User Data Keys:', Object.keys(data));

        console.log('\n📍 Profile Data:');
        console.log(JSON.stringify(data.profile, null, 2));
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUserLocation();
