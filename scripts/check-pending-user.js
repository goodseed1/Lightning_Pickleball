/**
 * 🔍 pending_approval 사용자 상세 확인
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUser() {
  const userId = 'O6GLvLyddIagVjscv26WBJ7AnMC2';
  const clubId = 'WsetxkWODywjt0BBcqrs';

  console.log('🔍 pending_approval 사용자 상세 확인...\n');

  // 사용자 정보
  const userDoc = await db.collection('users').doc(userId).get();
  if (userDoc.exists) {
    const user = userDoc.data();
    console.log('👤 User Info:');
    console.log('   displayName:', user.displayName || user.profile?.displayName || 'N/A');
    console.log('   email:', user.email || 'N/A');
  } else {
    console.log('❌ User not found in users collection!');
  }

  // clubMembers에서 status 확인
  const memberSnap = await db
    .collection('clubMembers')
    .where('userId', '==', userId)
    .where('clubId', '==', clubId)
    .get();

  if (!memberSnap.empty) {
    const member = memberSnap.docs[0].data();
    console.log('\n🏟️ Club Membership:');
    console.log('   status:', member.status);
    console.log('   role:', member.role);
    console.log('   memberInfo:', JSON.stringify(member.memberInfo || {}, null, 2));
    console.log('   joinedAt:', member.joinedAt?.toDate?.() || 'N/A');
  } else {
    console.log('\n❌ Not found in clubMembers for this club!');
  }

  // 해당 사용자의 모든 member_dues_records
  const recordsSnap = await db
    .collection('member_dues_records')
    .where('userId', '==', userId)
    .get();

  console.log('\n💰 All dues records for this user:');
  if (recordsSnap.empty) {
    console.log('   (없음)');
  } else {
    recordsSnap.docs.forEach(doc => {
      const data = doc.data();
      console.log('   - ID:', doc.id);
      console.log('     type:', data.type);
      console.log('     amount:', data.amount);
      console.log('     status:', data.status);
      console.log('     createdAt:', data.createdAt?.toDate?.() || 'N/A');
      console.log('');
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 분석:');
  console.log('   이 사용자의 pending_approval 레코드가 대시보드에');
  console.log('   "가입 신청 1건"으로 표시됩니다.');
  console.log('   이 레코드가 유효하지 않다면 삭제가 필요합니다.');
  console.log('='.repeat(60));

  process.exit(0);
}

checkUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
