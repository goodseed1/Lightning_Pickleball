const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testClubUpdate() {
  console.log('🧪 Testing club update simulation...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';
  const clubRef = db.collection('tennis_clubs').doc(clubId);

  // Get current data first
  const clubDoc = await clubRef.get();
  console.log('📋 Current data:');
  console.log('  profile.logo:', clubDoc.data().profile?.logo || '(empty)');
  console.log('  profile.courtAddress:', clubDoc.data().profile?.courtAddress || '(empty)');

  // Simulate what the app does when saving
  const testUpdateData = {
    'profile.name': 'Lightning Tennis Club',
    'profile.description': 'Test update',
    'profile.logo': 'https://example.com/test-logo.png',
    'profile.location': '',
    'profile.facilities': [],
    'profile.rules': [],
    'profile.courtAddress': {
      address: '123 Tennis Court Dr, Atlanta, GA 30301',
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      latitude: 33.749,
      longitude: -84.388,
    },
    'settings.isPublic': true,
    'settings.visibility': 'public',
    'settings.membershipFee': 0,
    'settings.joinFee': 0,
    'settings.meetings': [],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  console.log('\n📝 Attempting to update with test data...');
  console.log('Update payload:', JSON.stringify(testUpdateData, null, 2));

  try {
    await clubRef.update(testUpdateData);
    console.log('\n✅ Update SUCCESS! (Admin SDK bypasses Security Rules)');
  } catch (error) {
    console.error('\n❌ Update FAILED:', error.message);
  }

  // Verify the update
  const verifyDoc = await clubRef.get();
  console.log('\n📋 After update:');
  console.log('  profile.logo:', verifyDoc.data().profile?.logo || '(empty)');
  console.log(
    '  profile.courtAddress:',
    JSON.stringify(verifyDoc.data().profile?.courtAddress) || '(empty)'
  );

  process.exit(0);
}

testClubUpdate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
