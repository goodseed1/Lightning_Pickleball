const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUser() {
  const userId = process.argv[2] || '94ctpIxlqjdHGZ4vG3CL4kRAcfm1';

  console.log('Checking user:', userId);

  const userDoc = await db.collection('users').doc(userId).get();

  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('\n=== User Found ===');
    console.log('ID:', userId);
    console.log('Name:', data.displayName || data.name || 'N/A');
    console.log('Email:', data.email || 'N/A');
    console.log('\n--- Location ---');
    console.log('profile.location:', JSON.stringify(data.profile?.location, null, 2));
    console.log('location:', JSON.stringify(data.location, null, 2));
    console.log('\n--- Discovery Settings ---');
    console.log('isDiscoverable:', data.isDiscoverable);
    console.log('profile.isDiscoverable:', data.profile?.isDiscoverable);
    console.log('\n--- Profile ---');
    console.log('Gender:', data.profile?.gender || data.gender || 'N/A');
    console.log('SkillLevel:', data.skillLevel || 'N/A');
    console.log('maxTravelDistance:', data.maxTravelDistance || 'N/A');
  } else {
    console.log('User not found!');
  }

  process.exit(0);
}

checkUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
