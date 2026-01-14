/**
 * 🔍 Check user by ID
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUser() {
  const userId = 'PWWmQ9CSyPadL4w1JO4Xb3tdqwB2';

  console.log(`🔍 Looking up user: ${userId}\n`);

  const userDoc = await db.collection('users').doc(userId).get();

  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('✅ User found:');
    console.log(`   Display Name: ${data.displayName}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   Phone: ${data.phoneNumber || 'N/A'}`);
  } else {
    console.log('❌ User not found');
  }

  process.exit(0);
}

checkUser();
