const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const clubId = 'TwT7LfZ5wKxvdhc89igj'; // Lightning Pickleball Club

async function checkEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log('📅 Today:', today.toISOString());
  console.log('📅 30 days ago:', thirtyDaysAgo.toISOString());
  console.log('');

  // 1. regular_meetups - upcoming
  const meetupsSnap = await db.collection('regular_meetups').where('clubId', '==', clubId).get();

  console.log('=== regular_meetups ===');
  let upcomingMeetups = 0;
  meetupsSnap.docs.forEach(doc => {
    const data = doc.data();
    const dateTime = data.dateTime?.toDate?.() || new Date(data.dateTime);
    const isUpcoming = dateTime >= today;
    if (isUpcoming) upcomingMeetups++;
    console.log(
      `  ${doc.id.slice(0, 8)}: ${dateTime.toISOString().split('T')[0]} - ${isUpcoming ? '✅ upcoming' : '❌ past'}`
    );
  });
  console.log(`  Total: ${meetupsSnap.docs.length}, Upcoming: ${upcomingMeetups}`);
  console.log('');

  // 2. club_events - 30 days
  const eventsSnap = await db.collection('club_events').where('clubId', '==', clubId).get();

  console.log('=== club_events ===');
  let recentEvents = 0;
  eventsSnap.docs.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const isRecent = createdAt >= thirtyDaysAgo;
    if (isRecent) recentEvents++;
    console.log(
      `  ${doc.id.slice(0, 8)}: ${createdAt.toISOString().split('T')[0]} - ${isRecent ? '✅ recent' : '❌ old'}`
    );
  });
  console.log(`  Total: ${eventsSnap.docs.length}, Recent (30d): ${recentEvents}`);
  console.log('');

  // 3. leagues
  const leaguesSnap = await db.collection('leagues').where('clubId', '==', clubId).get();

  console.log('=== leagues ===');
  let activeLeagues = 0;
  leaguesSnap.docs.forEach(doc => {
    const data = doc.data();
    const endDate = data.endDate?.toDate?.() || new Date(data.endDate || '2000-01-01');
    const isActive = endDate >= thirtyDaysAgo && data.status !== 'cancelled';
    if (isActive) activeLeagues++;
    console.log(
      `  ${doc.id.slice(0, 8)}: endDate=${endDate.toISOString().split('T')[0]}, status=${data.status} - ${isActive ? '✅' : '❌'}`
    );
  });
  console.log(`  Total: ${leaguesSnap.docs.length}, Active: ${activeLeagues}`);
  console.log('');

  // 4. tournaments
  const tournamentsSnap = await db.collection('tournaments').where('clubId', '==', clubId).get();

  console.log('=== tournaments ===');
  let activeTournaments = 0;
  tournamentsSnap.docs.forEach(doc => {
    const data = doc.data();
    const endDate = data.endDate?.toDate?.() || new Date(data.endDate || '2000-01-01');
    const isActive = endDate >= thirtyDaysAgo && data.status !== 'cancelled';
    if (isActive) activeTournaments++;
    console.log(
      `  ${doc.id.slice(0, 8)}: endDate=${endDate.toISOString().split('T')[0]}, status=${data.status} - ${isActive ? '✅' : '❌'}`
    );
  });
  console.log(`  Total: ${tournamentsSnap.docs.length}, Active: ${activeTournaments}`);
  console.log('');

  const total = upcomingMeetups + recentEvents + activeLeagues + activeTournaments;
  console.log('=== TOTAL for Lightning Pickleball Club ===');
  console.log(`  🎾 Meetups (upcoming): ${upcomingMeetups}`);
  console.log(`  📅 Events (30d): ${recentEvents}`);
  console.log(`  🏆 Leagues (active): ${activeLeagues}`);
  console.log(`  🎖️ Tournaments (active): ${activeTournaments}`);
  console.log(`  ═════════════════════════`);
  console.log(`  📊 TOTAL: ${total}`);

  process.exit(0);
}

checkEvents();
