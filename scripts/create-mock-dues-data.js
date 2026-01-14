/**
 * 💰 회비 모크 데이터 생성 스크립트
 *
 * 앱스토어 심사를 위해 2024년과 2025년 회비 납부 기록을 생성합니다.
 * Annual Payment Report에서 확인할 수 있는 월별 납부 데이터를 생성합니다.
 *
 * 사용법: node scripts/create-mock-dues-data.js
 *
 * ⚠️ 롤백: git stash pop 또는
 *         node scripts/delete-mock-dues-data.js (삭제 스크립트)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Lightning Pickleball Club ID
const CLUB_ID = 'WsetxkWODywjt0BBcqrs';

// 월회비 금액
const MONTHLY_FEE = 30;
const CURRENCY = 'USD';

// 결제 방법들
const PAYMENT_METHODS = ['venmo', 'paypal', 'zelle', 'cash', 'bank_transfer'];

// 랜덤 헬퍼 함수들
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

// 랜덤 납부 날짜 생성 (해당 월 1일 ~ 15일 사이)
function randomPaidDate(year, month) {
  const day = randomInt(1, 15);
  return new Date(year, month - 1, day, randomInt(8, 20), randomInt(0, 59), 0);
}

// Firestore Timestamp 생성
function toTimestamp(date) {
  return admin.firestore.Timestamp.fromDate(date);
}

async function createMockDuesData() {
  console.log('💰 회비 모크 데이터 생성 시작...\n');
  console.log('📋 Club ID:', CLUB_ID);
  console.log('💵 Monthly Fee: $' + MONTHLY_FEE);
  console.log('='.repeat(60) + '\n');

  // 1. 클럽 멤버 목록 가져오기
  console.log('📥 클럽 멤버 목록 조회 중...');
  const clubMembersSnap = await db
    .collection('clubMembers')
    .where('clubId', '==', CLUB_ID)
    .where('status', '==', 'active')
    .get();

  console.log(`   활성 회원 수: ${clubMembersSnap.size}명\n`);

  const members = [];
  clubMembersSnap.docs.forEach(doc => {
    const data = doc.data();
    members.push({
      userId: data.userId,
      displayName:
        data.memberInfo?.displayName || data.memberInfo?.nickname || data.userId.substring(0, 8),
      joinedAt: data.joinedAt,
    });
  });

  // 2. 기존 모크 데이터 확인 (중복 방지)
  console.log('🔍 기존 모크 데이터 확인 중...');
  const existingMockSnap = await db
    .collection('member_dues_records')
    .where('clubId', '==', CLUB_ID)
    .where('isMockData', '==', true)
    .get();

  if (existingMockSnap.size > 0) {
    console.log(`   ⚠️ 기존 모크 데이터 ${existingMockSnap.size}건 발견!`);
    console.log('   삭제하려면: node scripts/delete-mock-dues-data.js 실행\n');
    console.log('   계속 진행하면 중복 데이터가 생성될 수 있습니다.');
    process.exit(1);
  }
  console.log('   ✅ 기존 모크 데이터 없음\n');

  // 3. 2024년 데이터 생성 (1월 ~ 12월)
  console.log('📅 2024년 회비 데이터 생성 중...');
  const records2024 = [];

  for (const member of members) {
    // 각 회원별로 2024년 납부 확률 설정 (60-90%)
    const paymentProbability = 0.6 + Math.random() * 0.3;

    for (let month = 1; month <= 12; month++) {
      // 납부 여부 랜덤 결정
      if (randomBoolean(paymentProbability)) {
        const paidAt = randomPaidDate(2024, month);
        const record = {
          clubId: CLUB_ID,
          userId: member.userId,
          memberName: member.displayName,
          duesType: 'monthly',
          period: {
            year: 2024,
            month: month,
          },
          amount: MONTHLY_FEE,
          currency: CURRENCY,
          status: 'paid',
          paidAt: toTimestamp(paidAt),
          paidMethod: randomChoice(PAYMENT_METHODS),
          paidAmount: MONTHLY_FEE,
          reminderCount: 0,
          createdAt: toTimestamp(new Date(2024, month - 1, 1)),
          updatedAt: toTimestamp(paidAt),
          isMockData: true, // 롤백용 플래그
        };
        records2024.push(record);
      }
    }
  }

  console.log(`   생성할 레코드: ${records2024.length}건`);

  // 4. 2025년 데이터 생성 (1월~12월 전체 - 앱스토어 심사용)
  console.log('\n📅 2025년 회비 데이터 생성 중...');
  const records2025 = [];

  for (const member of members) {
    // 2025년은 납부 확률 더 높게 (70-95%)
    const paymentProbability = 0.7 + Math.random() * 0.25;

    for (let month = 1; month <= 12; month++) {
      if (randomBoolean(paymentProbability)) {
        const paidAt = randomPaidDate(2025, month);
        const record = {
          clubId: CLUB_ID,
          userId: member.userId,
          memberName: member.displayName,
          duesType: 'monthly',
          period: {
            year: 2025,
            month: month,
          },
          amount: MONTHLY_FEE,
          currency: CURRENCY,
          status: 'paid',
          paidAt: toTimestamp(paidAt),
          paidMethod: randomChoice(PAYMENT_METHODS),
          paidAmount: MONTHLY_FEE,
          reminderCount: 0,
          createdAt: toTimestamp(new Date(2025, month - 1, 1)),
          updatedAt: toTimestamp(paidAt),
          isMockData: true, // 롤백용 플래그
        };
        records2025.push(record);
      }
    }
  }

  console.log(`   생성할 레코드: ${records2025.length}건`);

  // 5. Firestore에 배치 쓰기
  console.log('\n📤 Firestore에 데이터 저장 중...');

  const allRecords = [...records2024, ...records2025];
  const batchSize = 500; // Firestore 배치 제한
  let totalCreated = 0;

  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = db.batch();
    const chunk = allRecords.slice(i, i + batchSize);

    chunk.forEach(record => {
      const docRef = db.collection('member_dues_records').doc();
      batch.set(docRef, record);
    });

    await batch.commit();
    totalCreated += chunk.length;
    console.log(`   진행: ${totalCreated}/${allRecords.length}건`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 회비 모크 데이터 생성 완료!');
  console.log('='.repeat(60));
  console.log(`\n📊 생성 결과:`);
  console.log(`   📅 2024년: ${records2024.length}건`);
  console.log(`   📅 2025년: ${records2025.length}건`);
  console.log(`   📊 총계: ${allRecords.length}건`);
  console.log(`\n🎾 Annual Payment Report에서 확인해보세요!`);
  console.log(`\n🔄 롤백하려면: node scripts/delete-mock-dues-data.js`);

  process.exit(0);
}

createMockDuesData().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
