const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkAllEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log('📅 Today:', today.toISOString());
  console.log('📅 30 days ago:', thirtyDaysAgo.toISOString());
  console.log('');

  // 1. Check all regular_meetups
  console.log('=== ALL regular_meetups ===');
  const allMeetupsSnap = await db.collection('regular_meetups').get();
  console.log(`Total in collection: ${allMeetupsSnap.docs.length}`);

  const meetupsByClub = {};
  allMeetupsSnap.docs.forEach(doc => {
    const data = doc.data();
    const clubId = data.clubId;
    const dateTime = data.dateTime?.toDate?.() || new Date(data.dateTime);
    const isUpcoming = dateTime >= today;

    if (!meetupsByClub[clubId]) meetupsByClub[clubId] = { total: 0, upcoming: 0 };
    meetupsByClub[clubId].total++;
    if (isUpcoming) meetupsByClub[clubId].upcoming++;

    console.log(
      `  ${doc.id.slice(0, 8)}: clubId=${clubId?.slice(0, 8)}, date=${dateTime.toISOString().split('T')[0]} ${isUpcoming ? '✅' : '❌'}`
    );
  });

  console.log('\n📊 Meetups by Club:');
  Object.entries(meetupsByClub).forEach(([clubId, counts]) => {
    console.log(`  ${clubId}: total=${counts.total}, upcoming=${counts.upcoming}`);
  });
  console.log('');

  // 2. Check all club_events
  console.log('=== ALL club_events ===');
  const allEventsSnap = await db.collection('club_events').get();
  console.log(`Total in collection: ${allEventsSnap.docs.length}`);

  const eventsByClub = {};
  allEventsSnap.docs.forEach(doc => {
    const data = doc.data();
    const clubId = data.clubId;
    const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const isRecent = createdAt >= thirtyDaysAgo;

    if (!eventsByClub[clubId]) eventsByClub[clubId] = { total: 0, recent: 0 };
    eventsByClub[clubId].total++;
    if (isRecent) eventsByClub[clubId].recent++;

    console.log(
      `  ${doc.id.slice(0, 8)}: clubId=${clubId?.slice(0, 8)}, created=${createdAt.toISOString().split('T')[0]} ${isRecent ? '✅' : '❌'}`
    );
  });

  console.log('\n📊 Events by Club:');
  Object.entries(eventsByClub).forEach(([clubId, counts]) => {
    console.log(`  ${clubId}: total=${counts.total}, recent=${counts.recent}`);
  });
  console.log('');

  // 3. Check all leagues
  console.log('=== ALL leagues ===');
  const allLeaguesSnap = await db.collection('leagues').get();
  console.log(`Total in collection: ${allLeaguesSnap.docs.length}`);

  allLeaguesSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(
      `  ${doc.id.slice(0, 8)}: clubId=${data.clubId?.slice(0, 8)}, status=${data.status}`
    );
  });
  console.log('');

  // 4. Check all tournaments
  console.log('=== ALL tournaments ===');
  const allTournamentsSnap = await db.collection('tournaments').get();
  console.log(`Total in collection: ${allTournamentsSnap.docs.length}`);

  allTournamentsSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(
      `  ${doc.id.slice(0, 8)}: clubId=${data.clubId?.slice(0, 8)}, status=${data.status}`
    );
  });

  process.exit(0);
}

checkAllEvents();
