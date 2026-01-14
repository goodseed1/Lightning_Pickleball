const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixClubFullData() {
  console.log('🔧 Fixing club data with all required fields...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';
  const clubRef = db.collection('tennis_clubs').doc(clubId);

  // Get current data
  const clubDoc = await clubRef.get();
  const currentData = clubDoc.exists ? clubDoc.data() : {};

  console.log('📋 Current data:', JSON.stringify(currentData, null, 2));

  // Full club schema with all required fields
  const fullClubData = {
    // Basic info
    name: currentData.name || 'Lightning Tennis Club',
    description: currentData.description || '',

    // Location
    location: currentData.location || '',
    address: currentData.address || '',
    city: currentData.city || '',
    state: currentData.state || '',
    zipCode: currentData.zipCode || '',
    coordinates: currentData.coordinates || null,

    // Logo
    logoUrl: currentData.logoUrl || '',

    // Club settings
    maxMembers: currentData.maxMembers || 100,
    memberCount: 33, // Actual count from clubMembers collection
    isPublic: currentData.isPublic !== undefined ? currentData.isPublic : true,
    requiresApproval:
      currentData.requiresApproval !== undefined ? currentData.requiresApproval : true,

    // Regular meetups
    regularMeetups: currentData.regularMeetups || [],

    // Facilities
    facilities: currentData.facilities || [],

    // Rules
    clubRules: currentData.clubRules || '',

    // Owner/Admin
    ownerId: currentData.ownerId || '',
    adminIds: currentData.adminIds || [],

    // Timestamps
    createdAt: currentData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Update with merge to preserve existing data
  await clubRef.set(fullClubData, { merge: true });

  console.log('\n✅ Club data updated with full schema!');

  // Verify
  const verifyDoc = await clubRef.get();
  console.log('\n📋 Final data:', JSON.stringify(verifyDoc.data(), null, 2));

  process.exit(0);
}

fixClubFullData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
