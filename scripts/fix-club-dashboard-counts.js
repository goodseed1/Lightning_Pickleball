/**
 * 🔧 클럽 대시보드 카운트 데이터 수정 스크립트
 *
 * ClubAdminScreen.tsx의 loadDashboardData() 로직과 동일하게 확인
 *
 * 사용법: node scripts/fix-club-dashboard-counts.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function fixClubDashboardCounts() {
  console.log('🔧 클럽 대시보드 카운트 데이터 확인...\n');

  // Lightning Pickleball Club ID
  const clubId = 'WsetxkWODywjt0BBcqrs';

  console.log('='.repeat(60));
  console.log('📊 ClubAdminScreen 로직과 동일하게 쿼리 실행...\n');

  // 1. getPendingApprovalRequests - status === 'pending_approval'
  console.log('📋 1. 가입 신청 대기 (pending_approval)...');
  const pendingApprovalSnap = await db
    .collection('member_dues_records')
    .where('clubId', '==', clubId)
    .where('status', '==', 'pending_approval')
    .get();

  console.log(`   결과: ${pendingApprovalSnap.size}건`);
  pendingApprovalSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`      - ${data.memberName || data.userId}: $${data.amount} (${data.type})`);
  });

  // 2. getUnpaidDuesRecords - status in ['unpaid', 'overdue']
  console.log('\n📋 2. 회비 미납자 (unpaid/overdue)...');
  const unpaidOverdueSnap = await db
    .collection('member_dues_records')
    .where('clubId', '==', clubId)
    .where('status', 'in', ['unpaid', 'overdue'])
    .get();

  console.log(`   결과: ${unpaidOverdueSnap.size}건`);
  const uniqueUsers = new Set();
  unpaidOverdueSnap.docs.forEach(doc => {
    const data = doc.data();
    uniqueUsers.add(data.userId || data.memberId);
    console.log(
      `      - ${data.memberName || data.userId}: $${data.amount} (${data.type || 'N/A'}) - ${data.status}`
    );
  });
  console.log(`   고유 사용자: ${uniqueUsers.size}명`);

  // 3. 전체 member_dues_records 확인
  console.log('\n📋 3. 전체 member_dues_records (이 클럽)...');
  const allRecordsSnap = await db
    .collection('member_dues_records')
    .where('clubId', '==', clubId)
    .get();

  console.log(`   전체: ${allRecordsSnap.size}건`);

  // status별 그룹핑
  const statusCount = {};
  allRecordsSnap.docs.forEach(doc => {
    const data = doc.data();
    const status = data.status || 'unknown';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  console.log('   status별 카운트:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`      - ${status}: ${count}건`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('📋 대시보드에 표시될 값:');
  console.log(`   🔔 가입 신청 대기: ${pendingApprovalSnap.size}건`);
  console.log(`   💰 회비 미납자: ${unpaidOverdueSnap.size}건 (${uniqueUsers.size}명)`);
  console.log('='.repeat(60));

  // 스크린샷과 비교
  console.log('\n📸 스크린샷과 비교:');
  console.log(`   대시보드 표시: 가입 신청 1건, 미납자 3명`);
  console.log(`   회비 관리 화면: 4명 표시 (John, Eva White, Jong, James Williams)`);
  console.log(
    `   실제 Firestore: 가입 신청 ${pendingApprovalSnap.size}건, 미납자 ${uniqueUsers.size}명`
  );

  // 4. clubMembers 확인 (DuesManagementScreen의 미납 탭 로직)
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 4. clubMembers (active 회원) - 미납 탭 데이터 소스...');
  const clubMembersSnap = await db
    .collection('clubMembers')
    .where('clubId', '==', clubId)
    .where('status', '==', 'active')
    .get();

  console.log(`   활성 회원 수: ${clubMembersSnap.size}명`);

  for (const doc of clubMembersSnap.docs) {
    const data = doc.data();
    const userId = data.userId;
    const memberName = data.memberInfo?.displayName || data.memberInfo?.nickname || userId;

    // 해당 회원의 member_dues_records 조회
    const userRecordsSnap = await db
      .collection('member_dues_records')
      .where('clubId', '==', clubId)
      .where('userId', '==', userId)
      .get();

    let totalOwed = 0;
    let recordStatuses = [];

    userRecordsSnap.docs.forEach(rec => {
      const recData = rec.data();
      if (recData.status === 'unpaid' || recData.status === 'overdue') {
        totalOwed += recData.amount || 0;
        recordStatuses.push(`${recData.type}: $${recData.amount} (${recData.status})`);
      }
    });

    const isDuesExempt = data.isDuesExempt || false;

    console.log(`\n   👤 ${memberName} (${userId.substring(0, 8)}...)`);
    console.log(`      - isDuesExempt: ${isDuesExempt}`);
    console.log(`      - totalOwed: $${totalOwed}`);
    console.log(
      `      - unpaid/overdue records: ${recordStatuses.length > 0 ? recordStatuses.join(', ') : '없음'}`
    );
    console.log(`      - 미납 탭에 표시?: ${!isDuesExempt && totalOwed > 0 ? '✅ YES' : '❌ NO'}`);
  }

  // 5. pending_approval 레코드 상세 확인
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 5. pending_approval 레코드 상세...');
  pendingApprovalSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`\n   📄 Record ID: ${doc.id}`);
    console.log(`      - userId: ${data.userId}`);
    console.log(`      - memberName: ${data.memberName || 'N/A'}`);
    console.log(`      - type: ${data.type}`);
    console.log(`      - amount: $${data.amount}`);
    console.log(`      - status: ${data.status}`);
    console.log(`      - createdAt: ${data.createdAt?.toDate?.() || 'N/A'}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('🔍 결론:');
  console.log('   - 대시보드: member_dues_records에서 status 기준으로 카운트');
  console.log('   - 미납 탭: clubMembers + member_dues_records 조인 후 totalOwed > 0 기준');
  console.log('='.repeat(60));

  process.exit(0);
}

fixClubDashboardCounts().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
