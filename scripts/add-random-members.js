/**
 * Add Random Members to Club Script
 *
 * Adds 15 random users to Suwanee Weekend Warriors club
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const CLUB_ID = 'dRxu8Xnwmfoj0zzyQjVu'; // Suwanee Weekend Warriors
const NUM_MEMBERS_TO_ADD = 15;

async function addRandomMembers() {
  console.log(`🎾 Finding club by ID: ${CLUB_ID}...\n`);

  // 1. Find the club by ID
  const clubDoc = await db.collection('pickleball_clubs').doc(CLUB_ID).get();

  if (!clubDoc.exists) {
    console.log(`❌ Club not found!`);
    return;
  }

  const clubId = clubDoc.id;
  const clubData = clubDoc.data();
  const clubName = clubData.name || clubData.profile?.name || 'Unknown';
  console.log(`✅ Found club: ${clubName} (ID: ${clubId})`);

  // 2. Get existing members to exclude them
  const membershipsRef = db.collection('club_memberships');
  const existingMembersSnapshot = await membershipsRef.where('clubId', '==', clubId).get();

  const existingMemberIds = new Set(existingMembersSnapshot.docs.map(doc => doc.data().userId));
  console.log(`📋 Existing members: ${existingMemberIds.size}`);

  // Also exclude club admin/owner
  const adminId = clubData.adminId || clubData.ownerId || clubData.createdBy;
  if (adminId) {
    existingMemberIds.add(adminId);
  }

  // 3. Get all users
  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.limit(200).get();

  console.log(`👥 Total users in database: ${usersSnapshot.size}`);

  // Filter out existing members and get eligible users
  const eligibleUsers = usersSnapshot.docs.filter(doc => {
    return !existingMemberIds.has(doc.id);
  });

  console.log(`✅ Eligible users (not already members): ${eligibleUsers.length}`);

  if (eligibleUsers.length < NUM_MEMBERS_TO_ADD) {
    console.log(`⚠️  Not enough eligible users. Adding ${eligibleUsers.length} instead.`);
  }

  // 4. Shuffle and pick random users
  const shuffled = eligibleUsers.sort(() => Math.random() - 0.5);
  const selectedUsers = shuffled.slice(0, NUM_MEMBERS_TO_ADD);

  console.log(`\n🎲 Selected ${selectedUsers.length} random users:\n`);

  // 5. Add memberships
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const userDoc of selectedUsers) {
    const userData = userDoc.data();
    const displayName = userData.displayName || userData.name || userData.nickname || 'Unknown';

    console.log(`  ➕ Adding: ${displayName} (${userDoc.id.substring(0, 8)}...)`);

    // Create membership document
    const membershipRef = membershipsRef.doc();
    batch.set(membershipRef, {
      clubId: clubId,
      userId: userDoc.id,
      role: 'member',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 6. Update club member count (both memberCount and statistics.totalMembers)
  const newMemberCount = (clubData.memberCount || existingMemberIds.size) + selectedUsers.length;
  batch.update(clubDoc.ref, {
    memberCount: newMemberCount,
    'statistics.totalMembers': newMemberCount,
    'statistics.activeMembers': newMemberCount,
    updatedAt: now,
  });

  // Commit batch
  await batch.commit();

  console.log(`\n========== Summary ==========`);
  console.log(`✅ Added ${selectedUsers.length} new members to ${clubName}`);
  console.log(`📊 New total member count: ${newMemberCount}`);
  console.log(`==============================\n`);
}

addRandomMembers()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
