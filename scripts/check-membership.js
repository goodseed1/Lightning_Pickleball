/**
 * Check user's club membership in Firestore
 *
 * Usage: node scripts/check-membership.js <userId> <clubId>
 */

const admin = require('firebase-admin');
const serviceAccount = require('../functions/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkMembership() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Usage: node scripts/check-membership.js <userId> <clubId>');
    process.exit(1);
  }

  const [userId, clubId] = args;

  console.log('🔍 Checking club membership...\n');
  console.log(`👤 User ID: ${userId}`);
  console.log(`🏛️ Club ID: ${clubId}\n`);

  try {
    // Check membership document
    const membershipPath = `users/${userId}/clubMemberships/${clubId}`;
    console.log(`📂 Checking path: ${membershipPath}`);

    const membershipDoc = await db.doc(membershipPath).get();

    if (!membershipDoc.exists) {
      console.log('❌ Membership document DOES NOT EXIST\n');

      // Check if user exists
      const userDoc = await db.doc(`users/${userId}`).get();
      if (!userDoc.exists) {
        console.log('❌ User document does not exist either!');
        return;
      }

      console.log('✅ User document exists');
      console.log('📋 Checking all club memberships for this user...\n');

      // List all memberships
      const membershipsSnapshot = await db.collection(`users/${userId}/clubMemberships`).get();

      if (membershipsSnapshot.empty) {
        console.log('❌ No club memberships found for this user');
      } else {
        console.log(`✅ Found ${membershipsSnapshot.size} membership(s):\n`);
        membershipsSnapshot.forEach(doc => {
          console.log(`  📌 Club ID: ${doc.id}`);
          console.log(`     Role: ${doc.data().role || 'NO ROLE'}`);
          console.log(`     Status: ${doc.data().status || 'N/A'}`);
          console.log('');
        });
      }

      return;
    }

    // Membership exists
    console.log('✅ Membership document EXISTS\n');

    const membershipData = membershipDoc.data();
    console.log('📄 Membership Data:');
    console.log(JSON.stringify(membershipData, null, 2));
    console.log('');

    // Check role
    const role = membershipData?.role;
    if (!role) {
      console.log('❌ WARNING: No "role" field found!');
      console.log('   Cloud Function will fail authorization check');
    } else {
      console.log(`✅ Role: ${role}`);

      const allowedRoles = ['admin', 'owner', 'manager'];
      if (allowedRoles.includes(role)) {
        console.log('✅ AUTHORIZED: Can create tournaments');
      } else {
        console.log(`❌ UNAUTHORIZED: Role "${role}" cannot create tournaments`);
        console.log(`   Required roles: ${allowedRoles.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkMembership();
