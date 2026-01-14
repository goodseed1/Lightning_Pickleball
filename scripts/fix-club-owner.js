const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixClubOwner() {
  console.log('🔧 Finding and setting club owner...\n');

  const clubId = 'WsetxkWODywjt0BBcqrs';

  // Find admin member for this club
  const membersSnapshot = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('role', '==', 'admin')
    .get();

  console.log(`📋 Found ${membersSnapshot.size} admin members\n`);

  let ownerId = '';
  const adminIds = [];

  membersSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  Admin: ${data.name || data.displayName || '(no name)'}`);
    console.log(`    userId: ${data.userId}`);
    console.log(`    docId: ${doc.id}`);

    if (!ownerId && data.userId) {
      ownerId = data.userId;
    }
    if (data.userId) {
      adminIds.push(data.userId);
    }
  });

  // If no admin found, look for any member to be owner
  if (!ownerId) {
    console.log('\n⚠️ No admin found, looking for any member...');
    const anyMemberSnapshot = await db
      .collection('clubMembers')
      .where('clubId', '==', clubId)
      .limit(1)
      .get();

    if (!anyMemberSnapshot.empty) {
      const memberData = anyMemberSnapshot.docs[0].data();
      ownerId = memberData.userId;
      console.log(`  Using first member as owner: ${memberData.name || memberData.userId}`);
    }
  }

  if (ownerId) {
    console.log(`\n✅ Setting ownerId to: ${ownerId}`);
    console.log(`   Setting adminIds to: [${adminIds.join(', ')}]`);

    await db
      .collection('pickleball_clubs')
      .doc(clubId)
      .update({
        ownerId: ownerId,
        adminIds: adminIds.length > 0 ? adminIds : [ownerId],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log('\n✅ Club owner updated!');
  } else {
    console.log('\n❌ Could not find any member to set as owner');
  }

  // Verify
  const verifyDoc = await db.collection('pickleball_clubs').doc(clubId).get();
  console.log('\n📋 Final club data:');
  console.log(`  ownerId: ${verifyDoc.data().ownerId}`);
  console.log(`  adminIds: [${verifyDoc.data().adminIds?.join(', ') || ''}]`);

  process.exit(0);
}

fixClubOwner().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
