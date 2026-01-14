// Check all players in Firestore and their location data
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAllPlayers() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    console.log(`\n📊 Total users in Firestore: ${snapshot.size}\n`);
    console.log('='.repeat(80));

    let playersWithLocation = 0;
    let playersWithoutLocation = 0;
    let kwangyeolFound = false;

    snapshot.forEach(doc => {
      const data = doc.data();
      const displayName = data.displayName || 'Unknown';

      // Get location from profile.location or root location
      const profileLocation = data.profile?.location;
      const rootLocation = data.location;

      const hasProfileLocation =
        profileLocation &&
        ((profileLocation.latitude !== undefined && profileLocation.longitude !== undefined) ||
          (profileLocation.lat !== undefined && profileLocation.lng !== undefined));

      const hasRootLocation =
        rootLocation &&
        ((rootLocation.latitude !== undefined && rootLocation.longitude !== undefined) ||
          (rootLocation.lat !== undefined && rootLocation.lng !== undefined));

      const hasValidLocation = hasProfileLocation || hasRootLocation;

      if (hasValidLocation) {
        playersWithLocation++;
      } else {
        playersWithoutLocation++;
      }

      // Check for Kwangyeol
      if (displayName.includes('Kwangyeol')) {
        kwangyeolFound = true;
        console.log('\n🔍 KWANGYEOL BAE FOUND:');
        console.log('  - User ID:', doc.id);
        console.log('  - Display Name:', displayName);
        console.log('  - Has profile.location:', !!profileLocation);
        console.log('  - Has root location:', !!rootLocation);

        if (profileLocation) {
          console.log('  - profile.location.lat:', profileLocation.lat);
          console.log('  - profile.location.lng:', profileLocation.lng);
          console.log('  - profile.location.latitude:', profileLocation.latitude);
          console.log('  - profile.location.longitude:', profileLocation.longitude);
          console.log('  - profile.location.city:', profileLocation.city);
        }

        if (rootLocation) {
          console.log('  - root location.lat:', rootLocation.lat);
          console.log('  - root location.lng:', rootLocation.lng);
          console.log('  - root location.latitude:', rootLocation.latitude);
          console.log('  - root location.longitude:', rootLocation.longitude);
        }

        // Check other fields that might affect filtering
        console.log('  - emailVerified:', data.emailVerified);
        console.log('  - createdAt:', data.createdAt);
        console.log('  - profile exists:', !!data.profile);
      }

      // Show visible players from screenshot
      if (['철수', 'Jong', 'Gigi', '회장'].some(name => displayName.includes(name))) {
        console.log(`\n✅ ${displayName}:`);
        if (profileLocation) {
          console.log(
            '  - profile.location.latitude:',
            profileLocation.latitude || profileLocation.lat
          );
          console.log(
            '  - profile.location.longitude:',
            profileLocation.longitude || profileLocation.lng
          );
          console.log('  - profile.location.city:', profileLocation.city);
        }
        if (rootLocation) {
          console.log(
            '  - root location exists with coords:',
            !!(rootLocation.latitude || rootLocation.lat)
          );
        }
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`  - Players with valid location: ${playersWithLocation}`);
    console.log(`  - Players without valid location: ${playersWithoutLocation}`);
    console.log(`  - Kwangyeol Bae found: ${kwangyeolFound ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAllPlayers();
