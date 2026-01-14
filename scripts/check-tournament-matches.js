const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkTournament() {
  // Lightning Tennis Club의 토너먼트 확인
  const clubId = 'WsetxkWODywjt0BBcqrs';

  const tournamentsSnap = await db.collection('tournaments').where('clubId', '==', clubId).get();

  console.log('=== Tournaments in Lightning Tennis Club ===\n');

  for (const doc of tournamentsSnap.docs) {
    const data = doc.data();
    console.log('Tournament ID:', doc.id);
    console.log('Name:', data.name);
    console.log('Status:', data.status);

    // matches subcollection 확인
    const matchesSnap = await db.collection('tournaments').doc(doc.id).collection('matches').get();
    console.log('Matches count:', matchesSnap.size);

    if (matchesSnap.size > 0) {
      console.log('\nSample matches (full data):');
      matchesSnap.docs.slice(0, 3).forEach((matchDoc, i) => {
        const match = matchDoc.data();
        console.log(`  Match ${i + 1} (ID: ${matchDoc.id}):`, JSON.stringify(match, null, 2));
      });
    }
    console.log('\n---\n');
  }

  // users 컬렉션에서 실제 이름 확인
  console.log('=== Users with displayName ===\n');
  const usersSnap = await db.collection('users').limit(10).get();
  usersSnap.docs.forEach(doc => {
    const user = doc.data();
    if (user.displayName) {
      console.log(`  ${user.displayName} (ID: ${doc.id.slice(0, 8)}...)`);
    }
  });

  process.exit(0);
}

checkTournament();
