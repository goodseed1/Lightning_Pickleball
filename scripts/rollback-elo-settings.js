/**
 * 🔄 ELO/LPR 설정 롤백 스크립트
 *
 * migrate-test-users.js에서 설정한 eloRatings, ltrLevel, skillLevel을 삭제합니다.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 롤백 대상 사용자 이메일 목록 (migrate-test-users.js 실행 결과에서 추출)
const ROLLBACK_EMAILS = [
  'judyhughes.98573@gmail.com',
  'testplayer1@t.com',
  'test7@g.com',
  'testplayer8@t.com',
  'testplayer15@t.com',
  'testplayer17@t.com',
  'testplayer20@t.com',
  'test8@g.com',
  'testplayer12@t.com',
  'testplayer19@t.com',
  'testplayer22@t.com',
  'testplayer10@t.com',
  'testplayer5@t.com',
  'test3@g.com',
  'goodseed1@gmail.com',
  'testplayer9@t.com',
  'bestflower@gmail.com',
  'testplayer24@t.com',
  'bae.kwang@gmail.com',
  'testplayer3@t.com',
  'test10@g.com',
  'test17@g.com',
  'test2@g.com',
  'test16@g.com',
  'testplayer2@t.com',
  'test1@g.com',
  'stevesbaek@gmail.com',
  'test15@g.com',
  'testplayer25@t.com',
  'testplayer18@t.com',
  'testplayer23@t.com',
  'testplayer14@t.com',
  'test9@g.com',
  'testplayer13@t.com',
  'isaacfreeman.46940@gmail.com',
  'testplayer4@t.com',
  'test4@g.com',
  'timweaver.58956@gmail.com',
  'testplayer11@t.com',
  'test12@g.com',
  'testplayer6@t.com',
  'oscardelgado.76886@gmail.com',
  'testplayer16@t.com',
  'marylucas.27140@gmail.com',
  'testplayer7@t.com',
  'marthascott.62818@gmail.com',
  'testplayer21@t.com',
];

async function rollbackEloSettings() {
  console.log('🔄 ELO/LPR 설정 롤백 시작...\n');

  const usersRef = db.collection('users');
  const batch = db.batch();
  let rollbackCount = 0;

  for (const email of ROLLBACK_EMAILS) {
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`🔄 ${data.displayName || data.name} (${email})`);

        // eloRatings, ltrLevel, skillLevel 필드 삭제
        batch.update(doc.ref, {
          eloRatings: admin.firestore.FieldValue.delete(),
          ltrLevel: admin.firestore.FieldValue.delete(),
          skillLevel: admin.firestore.FieldValue.delete(),
        });

        rollbackCount++;
      });
    }
  }

  console.log(`\n⏳ ${rollbackCount}명의 ELO/LPR 설정 롤백 중...`);
  await batch.commit();

  console.log(
    `✅ 롤백 완료! ${rollbackCount}명의 eloRatings, ltrLevel, skillLevel 필드가 삭제되었습니다.\n`
  );

  process.exit(0);
}

rollbackEloSettings().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
