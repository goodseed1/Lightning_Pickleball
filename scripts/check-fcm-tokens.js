/**
 * FCM 토큰 상태 확인 스크립트
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

async function checkFcmTokens() {
  console.log('📱 FCM 토큰 상태 확인 중...\n');

  // 전체 FCM 토큰 수
  const allTokens = await db.collection('user_fcm_tokens').get();
  console.log('전체 FCM 토큰 수:', allTokens.size);

  // 활성 토큰 수
  const activeTokens = await db.collection('user_fcm_tokens').where('isActive', '==', true).get();
  console.log('활성 FCM 토큰 수:', activeTokens.size);

  // 비활성 토큰 수
  const inactiveTokens = await db
    .collection('user_fcm_tokens')
    .where('isActive', '==', false)
    .get();
  console.log('비활성 FCM 토큰 수:', inactiveTokens.size);

  // 샘플 토큰 확인
  if (allTokens.size > 0) {
    console.log('\n📋 샘플 토큰 (최대 5개):');
    let count = 0;
    allTokens.forEach(doc => {
      if (count < 5) {
        const data = doc.data();
        console.log(`  ${count + 1}. userId: ${data.userId}`);
        console.log(`     isActive: ${data.isActive}`);
        console.log(`     token 길이: ${data.token?.length || 0}`);
        console.log(`     updatedAt: ${data.updatedAt?.toDate?.() || 'N/A'}`);
        console.log('');
        count++;
      }
    });
  }
}

checkFcmTokens()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
