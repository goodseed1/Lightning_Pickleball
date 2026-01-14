/**
 * 🧪 테스트 유저 16명 생성 스크립트
 *
 * 실행 방법:
 * cd functions
 * node scripts/createTestUsers.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/Volumes/DevSSD/development/Projects/lightning-tennis-react/lightning-tennis-simple/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// 16명의 테스트 유저 데이터
const testUsers = [
  { email: '101@t.com', displayName: '송욱' },
  { email: '102@t.com', displayName: '강기수' },
  { email: '103@t.com', displayName: '구승현' },
  { email: '104@t.com', displayName: '김경선' },
  { email: '105@t.com', displayName: '김기형' },
  { email: '106@t.com', displayName: '김두환' },
  { email: '107@t.com', displayName: '김현호' },
  { email: '108@t.com', displayName: '김호윤' },
  { email: '109@t.com', displayName: '박태영' },
  { email: '110@t.com', displayName: '석호태' },
  { email: '111@t.com', displayName: '성화영' },
  { email: '112@t.com', displayName: '오준연' },
  { email: '113@t.com', displayName: '윤승노' },
  { email: '114@t.com', displayName: '이석환' },
  { email: '115@t.com', displayName: '이종훈' },
  { email: '116@t.com', displayName: '정용선' },
];

const DEFAULT_PASSWORD = '123456';
const DEFAULT_NTRP = '3.0';
const DEFAULT_GENDER = 'male';

async function createTestUsers() {
  console.log('🚀 테스트 유저 생성 시작...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const user of testUsers) {
    try {
      // 1. 기존 유저 확인
      let existingUser = null;
      try {
        existingUser = await auth.getUserByEmail(user.email);
      } catch (error) {
        // 유저가 없으면 에러 발생 - 정상
      }

      if (existingUser) {
        console.log(`⏭️  ${user.displayName} (${user.email}) - 이미 존재함, 건너뜀`);
        skipCount++;
        continue;
      }

      // 2. Firebase Auth에 유저 생성
      const userRecord = await auth.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        displayName: user.displayName,
        emailVerified: true, // 테스트용으로 이메일 인증 완료 처리
      });

      console.log(`✅ Auth 생성: ${user.displayName} (${userRecord.uid})`);

      // 3. Firestore에 유저 문서 생성
      await db
        .collection('users')
        .doc(userRecord.uid)
        .set({
          uid: userRecord.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: true,

          // Profile
          profile: {
            nickname: user.displayName,
            skillLevel: DEFAULT_NTRP,
            gender: DEFAULT_GENDER,
            location: '',
            zipCode: '',
            playingStyle: [],
            maxTravelDistance: 15,
            notificationDistance: 10,
            preferredLanguage: 'ko',
            communicationLanguages: ['ko'],
          },

          // Stats
          stats: {
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            currentStreak: 0,
            publicStats: {
              singles: {
                elo: 1200,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
              },
              doubles: {
                elo: 1200,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
              },
              mixed_doubles: {
                elo: 1200,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
              },
            },
          },

          // Preferences
          preferences: {
            language: 'ko',
            notifications: {
              personalMatches: true,
              clubEvents: true,
              friendRequests: true,
              matchReminders: true,
              notificationDistance: 10,
            },
            privacy: {
              showEmail: false,
              showLocation: true,
              showStats: true,
            },
          },

          // Clubs
          clubs: {
            memberships: [],
            adminOf: [],
            favoriteClubs: [],
          },

          // Onboarding
          isOnboardingComplete: true,
          onboardingCompletedAt: admin.firestore.FieldValue.serverTimestamp(),

          // Timestamps
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`✅ Firestore 생성: ${user.displayName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ 오류 (${user.displayName}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 결과 요약:');
  console.log(`   ✅ 성공: ${successCount}명`);
  console.log(`   ⏭️  건너뜀: ${skipCount}명`);
  console.log(`   ❌ 오류: ${errorCount}명`);
  console.log(`   📝 총: ${testUsers.length}명`);
}

createTestUsers()
  .then(() => {
    console.log('\n🎉 테스트 유저 생성 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });
