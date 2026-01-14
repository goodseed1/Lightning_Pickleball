const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkClubStructure() {
  console.log('🔍 Checking Lightning Tennis Club structure...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';
  const clubRef = db.collection('tennis_clubs').doc(clubId);
  const clubDoc = await clubRef.get();

  if (!clubDoc.exists) {
    console.log('❌ Club not found!');
    process.exit(1);
  }

  const data = clubDoc.data();
  console.log('📋 Full club data structure:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n=== Key Fields Check ===');
  console.log('createdBy:', data.createdBy || '❌ MISSING');
  console.log('ownerId:', data.ownerId || '❌ MISSING');
  console.log('adminIds:', data.adminIds || '❌ MISSING');

  console.log('\n=== Profile Structure ===');
  console.log('profile object:', data.profile ? '✅ EXISTS' : '❌ MISSING');
  console.log('profile.logo:', data.profile?.logo || '(empty)');
  console.log('profile.courtAddress:', data.profile?.courtAddress || '(empty)');

  console.log('\n=== Flat Structure (legacy) ===');
  console.log('logoUrl:', data.logoUrl || '(empty)');
  console.log('logoUri:', data.logoUri || '(empty)');
  console.log('courtAddress:', data.courtAddress || '(empty)');

  console.log('\n=== Settings Structure ===');
  console.log('settings object:', data.settings ? '✅ EXISTS' : '❌ MISSING');
  console.log('settings.isPublic:', data.settings?.isPublic);
  console.log('settings.meetings:', data.settings?.meetings || '(empty)');

  process.exit(0);
}

checkClubStructure().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
