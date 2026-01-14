/**
 * Fix missing applicantName in participation_applications
 * Looks up the user's displayName from users collection
 */

const admin = require('firebase-admin');
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-pickleball-react/lightning-pickleball-simple/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixMissingApplicantNames() {
  console.log('🔍 Finding applications with missing applicantName...\n');

  // Get all participation_applications
  const apps = await db.collection('participation_applications').get();

  let fixedCount = 0;
  let skippedCount = 0;

  for (const appDoc of apps.docs) {
    const app = appDoc.data();

    // Check if applicantName is missing
    if (!app.applicantName && app.applicantId) {
      // Look up user's displayName
      const userDoc = await db.collection('users').doc(app.applicantId).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const displayName = userData.displayName || userData.profile?.nickname;

        if (displayName) {
          console.log(`✅ Fixing: ${appDoc.id}`);
          console.log(`   applicantId: ${app.applicantId}`);
          console.log(`   displayName: ${displayName}`);

          // Update the document
          await appDoc.ref.update({
            applicantName: displayName,
          });

          fixedCount++;
        } else {
          console.log(`⚠️  No displayName found for user: ${app.applicantId}`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️  User not found: ${app.applicantId}`);
        skippedCount++;
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Total applications: ${apps.size}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
}

fixMissingApplicantNames()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
