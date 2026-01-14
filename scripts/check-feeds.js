const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkFeeds() {
  console.log('🔍 Checking feeds with actorName containing email...\n');

  // Get recent feeds
  const feedsSnap = await db.collection('feed').orderBy('timestamp', 'desc').limit(20).get();

  console.log('=== Recent 20 Feeds ===\n');

  feedsSnap.docs.forEach((doc, index) => {
    const data = doc.data();
    const isEmailActor = data.actorName && data.actorName.includes('@');
    const marker = isEmailActor ? '⚠️ EMAIL' : '✅';

    console.log(`${index + 1}. ${marker}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Type: ${data.type || 'NO TYPE'}`);
    console.log(`   ActorName: ${data.actorName || 'NO NAME'}`);
    console.log(`   ActorId: ${data.actorId || 'NO ID'}`);
    console.log(`   Content: ${(data.content || '').substring(0, 80)}...`);
    console.log(`   Visibility: ${data.visibility || 'NO VISIBILITY'}`);
    console.log(`   Timestamp: ${data.timestamp ? data.timestamp.toDate() : 'NO TIME'}`);
    console.log('');
  });

  // Check for unknown types
  console.log('\n=== Checking for Unknown Feed Types ===\n');

  const knownTypes = [
    'match_result',
    'league_winner',
    'tournament_winner',
    'club_event',
    'new_member',
    'new_member_joined',
    'new_club',
    'skill_improvement',
    'doubles_success',
    'elo_milestone',
    'coaching_success',
    'club_team_invite_pending',
    'club_team_invite_accepted',
    'solo_team_proposal_pending',
    'club_join_request_pending',
    'club_join_request_approved',
    'club_join_request_rejected',
    'club_member_removed',
    'club_deleted',
    'tournament_registration_open',
    'tournament_completed',
    'league_completed',
    'league_playoffs_created',
    'partner_invite_pending',
    'partner_invite_accepted',
    'partner_invite_rejected',
    'club_member_invite_pending',
    'club_member_left',
    'club_owner_changed',
    'match_invite_accepted',
    'match_invite_rejected',
    'application_approved',
    'application_rejected',
    'application_auto_rejected',
    'proposal_accepted',
    'proposal_rejected',
    'team_application_cancelled_by_partner',
    'event_cancelled_by_host',
    'application_cancelled',
    'guest_team_approved',
    'admin_feedback_received',
    'feedback_response_received',
    'league_created',
    'match_completed',
    'achievement_unlocked',
    'friend_added',
    'club_joined',
  ];

  const unknownFeeds = feedsSnap.docs.filter(doc => {
    const type = doc.data().type;
    return !type || !knownTypes.includes(type);
  });

  if (unknownFeeds.length > 0) {
    console.log(`Found ${unknownFeeds.length} feeds with unknown types:\n`);
    unknownFeeds.forEach(doc => {
      const data = doc.data();
      console.log(`🚨 Unknown Type: "${data.type}"`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   ActorName: ${data.actorName}`);
      console.log(`   Content: ${data.content || 'NO CONTENT'}`);
      console.log('');
    });
  } else {
    console.log('✅ All feed types are known!\n');
  }
}

checkFeeds()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
