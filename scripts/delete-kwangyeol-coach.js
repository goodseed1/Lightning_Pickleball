/**
 * Delete Kwangyeol Bae's Coach Card
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function deleteKwangyeolCoach() {
  console.log('🔍 Finding Kwangyeol Bae coach card...\n');

  // Check coach_lessons collection
  const lessonsSnapshot = await db.collection('coach_lessons').get();
  console.log(`📋 Total coach_lessons: ${lessonsSnapshot.size}`);

  let found = false;
  for (const doc of lessonsSnapshot.docs) {
    const data = doc.data();
    const coachName = data.coachName || data.hostName || '';

    if (coachName.toLowerCase().includes('kwangyeol') || coachName.includes('Bae')) {
      console.log('\n👻 Found Kwangyeol Bae coach card:');
      console.log('   Doc ID:', doc.id);
      console.log('   Coach Name:', coachName);
      console.log('   Title:', data.title);
      console.log('   Location:', data.location?.address || data.courtAddress);
      console.log('   Price:', data.price);

      // Delete
      await doc.ref.delete();
      console.log('\n✅ Deleted!');
      found = true;
    }
  }

  if (!found) {
    // Try searching by title
    console.log('\n🔍 Searching by title "Lesson at lawrenceville"...');
    const byTitle = lessonsSnapshot.docs.find(doc =>
      doc.data().title?.toLowerCase().includes('lawrenceville')
    );

    if (byTitle) {
      console.log('\n👻 Found by title:');
      console.log('   Doc ID:', byTitle.id);
      console.log('   Data:', JSON.stringify(byTitle.data(), null, 2));

      await byTitle.ref.delete();
      console.log('\n✅ Deleted!');
      found = true;
    }
  }

  if (!found) {
    console.log('\n❌ Kwangyeol Bae coach card not found in coach_lessons');
    console.log('Let me check all documents...\n');

    lessonsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.coachName || data.hostName || 'Unknown'} - ${data.title}`);
    });
  }
}

deleteKwangyeolCoach()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
