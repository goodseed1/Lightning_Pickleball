/**
 * events 컬렉션 상세 확인 스크립트
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function checkEvents() {
  console.log('🔍 events 컬렉션 상세 확인...\n');

  const snapshot = await db.collection('events').get();
  console.log('총', snapshot.size, '개 이벤트:\n');

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('ID:', doc.id);
    console.log('  title:', data.title || data.name || 'NO TITLE');
    console.log('  startDate:', data.startDate ? 'EXISTS' : 'MISSING');
    console.log('  date:', data.date ? 'EXISTS' : 'MISSING');
    console.log('  hasFields:', Object.keys(data).join(', '));
    console.log('');
  });
}

checkEvents()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
