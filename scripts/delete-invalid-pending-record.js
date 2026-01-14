/**
 * 🗑️ 잘못된 pending_approval 레코드 삭제
 *
 * James Williams (O6GLvLyddIagVjscv26WBJ7AnMC2)는 이미 active 회원이지만
 * type: undefined인 pending_approval 레코드가 있어서 삭제합니다.
 *
 * 사용법: node scripts/delete-invalid-pending-record.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function deleteInvalidPendingRecord() {
  const recordId = 'va0BydXENAotKez9scwo';

  console.log('🗑️ 잘못된 pending_approval 레코드 삭제...\n');

  // 레코드 확인
  const recordRef = db.collection('member_dues_records').doc(recordId);
  const recordDoc = await recordRef.get();

  if (!recordDoc.exists) {
    console.log('❌ 레코드를 찾을 수 없습니다.');
    process.exit(1);
  }

  const data = recordDoc.data();
  console.log('📄 삭제할 레코드:');
  console.log('   ID:', recordId);
  console.log('   userId:', data.userId);
  console.log('   type:', data.type);
  console.log('   amount:', data.amount);
  console.log('   status:', data.status);
  console.log('   createdAt:', data.createdAt?.toDate?.() || 'N/A');

  // 삭제 실행
  await recordRef.delete();

  console.log('\n✅ 삭제 완료!');
  console.log('   대시보드의 "가입 신청" 카운트가 0으로 바뀔 것입니다.');

  process.exit(0);
}

deleteInvalidPendingRecord().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
