const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixClubComplete() {
  console.log('🔧 Fixing Lightning Pickleball Club with complete data structure...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';
  const ownerId = 'IcF8Pih3UoOchh7GRmYzrF75ijq2'; // Jong - the admin

  const clubRef = db.collection('pickleball_clubs').doc(clubId);
  const clubDoc = await clubRef.get();

  if (!clubDoc.exists) {
    console.log('❌ Club not found!');
    process.exit(1);
  }

  const currentData = clubDoc.data();
  console.log('📋 Current data (before fix):', JSON.stringify(currentData, null, 2));

  // Build the complete club document with BOTH:
  // 1. Flat structure (for backward compatibility)
  // 2. Nested structure (profile, settings - what clubService expects)
  const completeClubData = {
    // === CRITICAL: Add createdBy for Security Rules ===
    createdBy: ownerId,

    // === Flat Structure (backward compatibility) ===
    name: currentData.name || 'Lightning Pickleball Club',
    description: currentData.description || '',
    location: currentData.location || '',
    address: currentData.address || '',
    city: currentData.city || '',
    state: currentData.state || '',
    zipCode: currentData.zipCode || '',
    coordinates: currentData.coordinates || null,
    logoUrl: currentData.logoUrl || '',
    maxMembers: currentData.maxMembers || 100,
    memberCount: currentData.memberCount || 33,
    isPublic: currentData.isPublic !== undefined ? currentData.isPublic : true,
    requiresApproval:
      currentData.requiresApproval !== undefined ? currentData.requiresApproval : true,
    regularMeetups: currentData.regularMeetups || [],
    facilities: currentData.facilities || [],
    clubRules: currentData.clubRules || '',
    ownerId: currentData.ownerId || ownerId,
    adminIds: currentData.adminIds || [ownerId],

    // === Nested Structure (what clubService.updateClub() expects) ===
    profile: {
      name: currentData.name || 'Lightning Pickleball Club',
      description: currentData.description || '',
      logo: currentData.logoUrl || currentData.profile?.logo || '',
      location: currentData.location || '',
      facilities: currentData.facilities || [],
      rules: currentData.clubRules ? [currentData.clubRules] : [],
      courtAddress: currentData.courtAddress || currentData.profile?.courtAddress || null,
    },
    settings: {
      isPublic: currentData.isPublic !== undefined ? currentData.isPublic : true,
      visibility: currentData.isPublic ? 'public' : 'private',
      maxMembers: currentData.maxMembers || 100,
      joinFee: currentData.joinFee || 0,
      membershipFee: currentData.monthlyFee || 0,
      yearlyFee: currentData.yearlyFee || 0,
      meetings: currentData.meetings || currentData.settings?.meetings || [],
    },

    // === Timestamps ===
    createdAt: currentData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  console.log('\n📝 Updating with complete data structure...');
  await clubRef.set(completeClubData, { merge: true });
  console.log('✅ Club data updated!\n');

  // Verify the update
  const verifyDoc = await clubRef.get();
  const newData = verifyDoc.data();

  console.log('=== Verification ===');
  console.log('createdBy:', newData.createdBy ? '✅' : '❌');
  console.log('profile object:', newData.profile ? '✅' : '❌');
  console.log('settings object:', newData.settings ? '✅' : '❌');
  console.log('profile.logo:', newData.profile?.logo || '(empty)');
  console.log('profile.courtAddress:', newData.profile?.courtAddress || '(empty)');
  console.log('settings.isPublic:', newData.settings?.isPublic);
  console.log('settings.meetings:', newData.settings?.meetings?.length || 0, 'meetings');

  console.log('\n✅ Complete! Club should now be editable.');
  console.log('📋 Final data:', JSON.stringify(newData, null, 2));

  process.exit(0);
}

fixClubComplete().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
