/**
 * 🎾 테스트 사용자 마이그레이션 스크립트
 *
 * 1. 레벨 미설정 사용자들 → ELO 1150, LTR 3 설정
 * 2. '테스트선수'로 시작하는 사용자들 → Duluth, GA 위치 설정
 * 3. '테스트선수'로 시작하는 사용자들 → 영어 이름으로 변경 (중복 없이)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 흔한 영어 이름 목록 (남녀 혼합)
const ENGLISH_NAMES = [
  'James',
  'John',
  'Robert',
  'Michael',
  'David',
  'William',
  'Richard',
  'Joseph',
  'Thomas',
  'Christopher',
  'Charles',
  'Daniel',
  'Matthew',
  'Anthony',
  'Mark',
  'Steven',
  'Paul',
  'Andrew',
  'Joshua',
  'Kenneth',
  'Kevin',
  'Brian',
  'George',
  'Timothy',
  'Ronald',
  'Edward',
  'Jason',
  'Jeffrey',
  'Ryan',
  'Jacob',
  'Gary',
  'Nicholas',
  'Eric',
  'Jonathan',
  'Stephen',
  'Larry',
  'Justin',
  'Scott',
  'Brandon',
  'Benjamin',
  'Samuel',
  'Raymond',
  'Gregory',
  'Frank',
  'Alexander',
  'Patrick',
  'Jack',
  'Dennis',
  'Jerry',
  'Tyler',
  // 여성 이름 추가
  'Mary',
  'Patricia',
  'Jennifer',
  'Linda',
  'Elizabeth',
  'Barbara',
  'Susan',
  'Jessica',
  'Sarah',
  'Karen',
  'Lisa',
  'Nancy',
  'Betty',
  'Margaret',
  'Sandra',
  'Ashley',
  'Kimberly',
  'Emily',
  'Donna',
  'Michelle',
  'Dorothy',
  'Carol',
  'Amanda',
  'Melissa',
  'Deborah',
  'Stephanie',
  'Rebecca',
  'Sharon',
  'Laura',
  'Cynthia',
  'Kathleen',
  'Amy',
  'Angela',
  'Shirley',
  'Anna',
  'Brenda',
  'Pamela',
  'Emma',
  'Nicole',
  'Helen',
  'Samantha',
  'Katherine',
  'Christine',
  'Debra',
  'Rachel',
  'Carolyn',
  'Janet',
  'Catherine',
  'Maria',
  'Heather',
];

// Duluth, GA 위치 정보
const DULUTH_LOCATION = {
  latitude: 34.0029,
  longitude: -84.1446,
  city: 'Duluth',
  state: 'GA',
  country: 'US',
  formattedAddress: 'Duluth, GA, USA',
};

// 기본 ELO/LTR 설정
const DEFAULT_ELO = 1150;
const DEFAULT_LTR = 3;

async function migrateTestUsers() {
  console.log('🚀 테스트 사용자 마이그레이션 시작...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  console.log(`📊 총 ${snapshot.size}명의 사용자 발견\n`);

  // 기존에 사용된 이름들 추적
  const usedNames = new Set();

  // 먼저 기존 사용자들의 이름을 수집 (중복 방지)
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.displayName && !data.displayName.startsWith('테스트선수')) {
      usedNames.add(data.displayName);
    }
    if (data.name && !data.name.startsWith('테스트선수')) {
      usedNames.add(data.name);
    }
  });

  // 사용 가능한 이름 필터링
  const availableNames = ENGLISH_NAMES.filter(name => !usedNames.has(name));
  let nameIndex = 0;

  const batch = db.batch();
  let updateCount = 0;
  let eloUpdateCount = 0;
  let locationUpdateCount = 0;
  let nameUpdateCount = 0;

  const updates = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const updateData = {};
    const updateReasons = [];

    // 1️⃣ 레벨 미설정 사용자 체크
    const hasEloRatings =
      data.eloRatings &&
      (data.eloRatings.singles?.elo || data.eloRatings.doubles?.elo || data.eloRatings.mixed?.elo);
    const hasLtrLevel =
      data.ltrLevel !== undefined && data.ltrLevel !== null && data.ltrLevel !== '';
    const hasSkillLevel = data.skillLevel && data.skillLevel.ltr !== undefined;

    if (!hasEloRatings && !hasLtrLevel && !hasSkillLevel) {
      // ELO ratings 설정
      updateData.eloRatings = {
        singles: { elo: DEFAULT_ELO, matchCount: 0 },
        doubles: { elo: DEFAULT_ELO, matchCount: 0 },
        mixed: { elo: DEFAULT_ELO, matchCount: 0 },
      };
      updateData.ltrLevel = DEFAULT_LTR;
      updateData.skillLevel = {
        selfAssessed: String(DEFAULT_LTR),
        ltr: DEFAULT_LTR,
        lastUpdated: new Date().toISOString(),
        source: 'migration',
      };
      updateReasons.push(`ELO ${DEFAULT_ELO}, LTR ${DEFAULT_LTR} 설정`);
      eloUpdateCount++;
    }

    // 2️⃣ & 3️⃣ '테스트선수'로 시작하는 사용자 체크
    const isTestUser =
      (data.displayName && data.displayName.startsWith('테스트선수')) ||
      (data.name && data.name.startsWith('테스트선수'));

    if (isTestUser) {
      // 위치 정보 설정
      updateData.location = DULUTH_LOCATION;
      updateReasons.push('위치: Duluth, GA');
      locationUpdateCount++;

      // 영어 이름으로 변경
      if (nameIndex < availableNames.length) {
        const newName = availableNames[nameIndex];
        updateData.displayName = newName;
        updateData.name = newName;
        updateReasons.push(`이름: ${data.displayName || data.name} → ${newName}`);
        nameIndex++;
        nameUpdateCount++;
      } else {
        console.log(`⚠️ 사용 가능한 영어 이름이 부족합니다. 사용자: ${doc.id}`);
      }
    }

    // 업데이트가 있으면 배치에 추가
    if (Object.keys(updateData).length > 0) {
      batch.update(doc.ref, updateData);
      updateCount++;
      updates.push({
        id: doc.id,
        email: data.email || '(이메일 없음)',
        originalName: data.displayName || data.name || '(이름 없음)',
        reasons: updateReasons,
      });
    }
  });

  console.log('📋 업데이트 예정 목록:\n');
  updates.forEach((u, i) => {
    console.log(`${i + 1}. ${u.originalName} (${u.email})`);
    u.reasons.forEach(r => console.log(`   → ${r}`));
    console.log('');
  });

  console.log('='.repeat(50));
  console.log(`📊 업데이트 요약:`);
  console.log(`   - 총 업데이트 대상: ${updateCount}명`);
  console.log(`   - ELO/LTR 설정: ${eloUpdateCount}명`);
  console.log(`   - 위치 설정 (Duluth, GA): ${locationUpdateCount}명`);
  console.log(`   - 이름 변경: ${nameUpdateCount}명`);
  console.log('='.repeat(50));

  if (updateCount > 0) {
    console.log('\n⏳ 배치 업데이트 실행 중...');
    await batch.commit();
    console.log('✅ 마이그레이션 완료!\n');
  } else {
    console.log('\n✅ 업데이트할 사용자가 없습니다.\n');
  }

  process.exit(0);
}

migrateTestUsers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
