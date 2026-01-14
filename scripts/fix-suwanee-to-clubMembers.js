/**
 * Fix Suwanee Weekend Warriors - Copy memberships to clubMembers collection
 * The app uses 'clubMembers' collection, not 'club_memberships'
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const CLUB_ID = 'dRxu8Xnwmfoj0zzyQjVu';

async function fixToClubMembers() {
  console.log('🔧 Copying memberships to clubMembers collection...\n');

  // 1. Get existing memberships from club_memberships
  const membershipsSnapshot = await db
    .collection('club_memberships')
    .where('clubId', '==', CLUB_ID)
    .get();

  console.log('📋 Found', membershipsSnapshot.size, 'records in club_memberships');

  // 2. Check existing clubMembers
  const clubMembersSnapshot = await db
    .collection('clubMembers')
    .where('clubId', '==', CLUB_ID)
    .get();

  console.log('📋 Found', clubMembersSnapshot.size, 'records in clubMembers');

  // Get existing userIds in clubMembers to avoid duplicates
  const existingUserIds = new Set(clubMembersSnapshot.docs.map(doc => doc.data().userId));

  // 3. Copy missing memberships to clubMembers
  const batch = db.batch();
  let addedCount = 0;

  for (const doc of membershipsSnapshot.docs) {
    const data = doc.data();

    if (!existingUserIds.has(data.userId)) {
      const newDocRef = db.collection('clubMembers').doc();
      batch.set(newDocRef, {
        clubId: data.clubId,
        userId: data.userId,
        role: data.role || 'member',
        status: data.status || 'active',
        joinedAt: data.joinedAt || admin.firestore.FieldValue.serverTimestamp(),
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: data.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
      });
      addedCount++;

      // Get user name for logging
      const userDoc = await db.collection('users').doc(data.userId).get();
      const userName = userDoc.exists
        ? userDoc.data().displayName || userDoc.data().name || 'Unknown'
        : 'Unknown';
      console.log(`  ➕ Adding: ${userName} (${data.role})`);
    }
  }

  if (addedCount > 0) {
    await batch.commit();
    console.log(`\n✅ Added ${addedCount} members to clubMembers collection`);
  } else {
    console.log('\n✅ All memberships already exist in clubMembers');
  }

  // 4. Verify final count
  const finalSnapshot = await db.collection('clubMembers').where('clubId', '==', CLUB_ID).get();

  console.log('\n📊 Final clubMembers count:', finalSnapshot.size);

  // List all
  console.log('\n--- All Members in clubMembers ---');
  for (const doc of finalSnapshot.docs) {
    const data = doc.data();
    const userDoc = await db.collection('users').doc(data.userId).get();
    const userName = userDoc.exists
      ? userDoc.data().displayName || userDoc.data().name || 'Unknown'
      : 'Unknown';
    console.log(`  ${data.role?.toUpperCase().padEnd(6)} | ${userName}`);
  }
}

fixToClubMembers()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
