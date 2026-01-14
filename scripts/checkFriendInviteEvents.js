/**
 * 🎯 Check Friend Invite Events in Firestore
 * This script checks for events with isInviteOnly=true and friendInvitations
 */

const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkFriendInviteEvents() {
  console.log('🔍 Checking for invite-only events with friend invitations...\n');

  try {
    // Query all events with isInviteOnly = true
    const eventsSnapshot = await db.collection('events').where('isInviteOnly', '==', true).get();

    console.log(`📊 Found ${eventsSnapshot.docs.length} invite-only events\n`);

    if (eventsSnapshot.empty) {
      console.log('❌ No invite-only events found!');
      console.log('\n🔍 Let me check the most recent events...');

      // Check recent events
      const recentEvents = await db
        .collection('events')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      console.log(`\n📋 Recent ${recentEvents.docs.length} events:`);
      for (const doc of recentEvents.docs) {
        const data = doc.data();
        console.log(`  - ${data.title || 'Untitled'}`);
        console.log(`    ID: ${doc.id}`);
        console.log(`    isInviteOnly: ${data.isInviteOnly}`);
        console.log(`    status: ${data.status}`);
        console.log(`    friendInvitations: ${JSON.stringify(data.friendInvitations || 'none')}`);
        console.log('');
      }
    } else {
      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        console.log(`📌 Event: ${data.title || 'Untitled'}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Host: ${data.hostName} (${data.hostId})`);
        console.log(`   Game Type: ${data.gameType}`);
        console.log(`   Friend Invitations:`);

        const friendInvitations = data.friendInvitations || [];
        if (friendInvitations.length === 0) {
          console.log('     (none)');
        } else {
          for (const inv of friendInvitations) {
            console.log(`     - User: ${inv.userId}`);
            console.log(`       Status: ${inv.status}`);
            console.log(`       Invited At: ${inv.invitedAt}`);
          }
        }
        console.log('');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFriendInviteEvents();
