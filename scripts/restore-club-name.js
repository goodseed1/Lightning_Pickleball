const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function restoreClubName() {
  console.log('🔧 Restoring club name...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';
  const newName = 'Lightning Tennis Club';

  // Check current state
  const clubRef = db.collection('tennis_clubs').doc(clubId);
  const clubDoc = await clubRef.get();

  if (clubDoc.exists) {
    console.log('📋 Current club data:', JSON.stringify(clubDoc.data(), null, 2));

    // Update the name
    await clubRef.update({
      name: newName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`\n✅ Updated club name to: "${newName}"`);
  } else {
    console.log('⚠️ Club document does not exist. Creating it...');

    // Create the club document with proper data
    await clubRef.set({
      name: newName,
      memberCount: 33,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`\n✅ Created club with name: "${newName}"`);
  }

  // Verify
  const verifyDoc = await clubRef.get();
  console.log('\n📋 Final club data:', JSON.stringify(verifyDoc.data(), null, 2));

  process.exit(0);
}

restoreClubName().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
