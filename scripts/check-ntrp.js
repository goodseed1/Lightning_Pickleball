const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkApplications() {
  // 🎯 Check participation_applications collection directly (top-level collection)
  console.log('📋 Checking participation_applications collection...\n');

  const appsSnapshot = await db
    .collection('participation_applications')
    .where('status', '==', 'pending')
    .limit(20)
    .get();

  console.log('Found', appsSnapshot.size, 'pending applications\n');

  appsSnapshot.docs.forEach(appDoc => {
    const app = appDoc.data();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎾 Application ID:', appDoc.id);
    console.log('   Event ID:', app.eventId);
    console.log('   Team ID:', app.teamId || 'N/A');
    console.log(
      '   Applicant:',
      app.applicantName,
      '| NTRP:',
      app.applicantNtrp !== undefined ? app.applicantNtrp : '❌ MISSING'
    );
    console.log(
      '   Partner:',
      app.partnerName || 'N/A',
      '| NTRP:',
      app.partnerNtrp !== undefined ? app.partnerNtrp : '❌ MISSING'
    );
    console.log('   Status:', app.status, '| PartnerStatus:', app.partnerStatus);
    console.log('');
  });
}

checkApplications()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
