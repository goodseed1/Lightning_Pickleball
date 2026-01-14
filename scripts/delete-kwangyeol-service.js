/**
 * Delete Kwangyeol Bae's Service Card
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function deleteKwangyeolService() {
  console.log('🔍 Finding Kwangyeol Bae service cards...\n');

  const snapshot = await db.collection('tennis_services').get();
  console.log('📋 Total services:', snapshot.size);

  let deleted = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const authorName = data.authorName || '';

    if (authorName.toLowerCase().includes('kwangyeol') || authorName.includes('Bae')) {
      console.log('\n👻 Found:');
      console.log('   Doc ID:', doc.id);
      console.log('   Author:', authorName);
      console.log('   Title:', data.title);
      console.log('   Price:', data.price);

      await doc.ref.delete();
      console.log('   ✅ Deleted!');
      deleted++;
    }
  }

  if (deleted === 0) {
    console.log('\n❌ No Kwangyeol Bae service found');
  } else {
    console.log('\n🎉 Deleted', deleted, 'service(s)');
  }
}

deleteKwangyeolService()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
