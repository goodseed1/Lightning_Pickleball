/**
 * 🎾 Create Tournament Test Users
 *
 * 클럽 토너먼트 테스트를 위해 25명의 테스트 회원을 생성합니다.
 *
 * 대상 클럽: 테스트 클럽 (WsetxkWODywjt0BBcqrs)
 * 회원 수: 25명
 * LPR 범위: 2.5 ~ 3.5
 * 성별: 전원 남성 (male)
 *
 * 실행: node scripts/createTournamentTestUsers.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin 초기화
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ==================== 설정 ====================
const CLUB_ID = 'WsetxkWODywjt0BBcqrs';  // 테스트 클럽
const CLUB_NAME = '테스트 클럽';
const DEFAULT_PASSWORD = '123456';
const NUM_USERS = 25;

// LPR 범위: 2.5 ~ 3.5
const MIN_LPR = 2.5;
const MAX_LPR = 3.5;

// ==================== 유틸리티 함수 ====================

/**
 * 2.5 ~ 3.5 사이의 랜덤 LPR 값 생성 (소수점 1자리)
 */
function getRandomLPR() {
  const ltr = MIN_LPR + Math.random() * (MAX_LPR - MIN_LPR);
  return Math.round(ltr * 10) / 10;  // 소수점 1자리로 반올림
}

/**
 * LPR 값에 따른 selfAssessed 문자열 반환
 */
function getSelfAssessedFromLPR(ltr) {
  if (ltr < 2.75) return '2.5-3.0';
  if (ltr < 3.25) return '3.0-3.5';
  return '3.0-3.5';
}

/**
 * LPR 값에 따른 profile.skillLevel 문자열 반환
 */
function getProfileSkillLevel(ltr) {
  if (ltr < 3.0) return 'beginner';
  if (ltr < 3.5) return 'intermediate';
  return 'intermediate';
}

/**
 * 기본 stats 객체 생성
 */
function createDefaultStats() {
  const defaultSubStats = {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    elo: 1200,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  };

  return {
    unifiedEloRating: 1200,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    publicMatches: 0,
    clubMatches: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
    publicStats: {
      singles: { ...defaultSubStats },
      doubles: { ...defaultSubStats },
      mixed_doubles: { ...defaultSubStats },
    },
  };
}

// ==================== 메인 함수 ====================

async function createTournamentTestUsers() {
  console.log('🎾 =====================================================');
  console.log('🎾 클럽 토너먼트 테스트 회원 생성 시작');
  console.log('🎾 =====================================================\n');
  console.log(`📍 대상 클럽: ${CLUB_NAME} (${CLUB_ID})`);
  console.log(`👥 생성할 회원 수: ${NUM_USERS}명`);
  console.log(`📊 LPR 범위: ${MIN_LPR} ~ ${MAX_LPR}`);
  console.log(`👨 성별: 전원 남성 (male)\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const createdUsers = [];

  for (let i = 1; i <= NUM_USERS; i++) {
    const email = `testplayer${i}@t.com`;
    const displayName = `테스트선수${i}`;
    const ltr = getRandomLPR();

    console.log(`\n[${i}/${NUM_USERS}] 처리 중: ${displayName} (${email})`);

    try {
      // 1. 기존 유저 확인
      let existingUser = null;
      try {
        existingUser = await auth.getUserByEmail(email);
      } catch {
        // 유저가 없으면 에러 발생 - 정상
      }

      if (existingUser) {
        console.log(`   ⏭️  이미 존재함 (UID: ${existingUser.uid})`);
        skipCount++;
        continue;
      }

      // 2. Firebase Auth 유저 생성
      const userRecord = await auth.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        displayName: displayName,
        emailVerified: true,
      });

      console.log(`   ✅ Auth 생성 완료 (UID: ${userRecord.uid})`);

      // 3. Firestore users 문서 생성
      const now = admin.firestore.FieldValue.serverTimestamp();
      const userData = {
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        photoURL: null,
        emailVerified: true,
        isOnboardingComplete: true,

        profile: {
          nickname: displayName,
          gender: 'male',
          skillLevel: getProfileSkillLevel(ltr),
          location: 'Sugar Hill, GA',
          zipCode: '30518',
          maxTravelDistance: 20,
          notificationDistance: 10,
          playingStyle: ['all_court'],
          activityRegions: ['Sugar Hill, GA'],
          preferredLanguage: 'ko',
          communicationLanguages: ['ko'],
        },

        skillLevel: {
          selfAssessed: getSelfAssessedFromLPR(ltr),
          calculated: ltr,
          confidence: 0.75,
          lastUpdated: now,
          source: 'onboarding',
        },

        stats: createDefaultStats(),

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

        clubs: {
          memberships: [CLUB_ID],
          adminOf: [],
          favoriteClubs: [],
        },

        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        onboardingCompletedAt: now,
      };

      await db.collection('users').doc(userRecord.uid).set(userData);
      console.log(`   ✅ Firestore users 문서 생성 완료`);

      // 4. clubMembers 문서 생성
      const membershipId = `${CLUB_ID}_${userRecord.uid}`;
      const memberData = {
        id: membershipId,
        clubId: CLUB_ID,
        userId: userRecord.uid,
        role: 'member',
        status: 'active',

        memberInfo: {
          displayName: displayName,
          nickname: displayName,
          photoURL: null,
          skillLevel: ltr.toString(),
          preferredLanguage: 'ko',
        },

        clubActivity: {
          eventsAttended: 0,
          eventsHosted: 0,
          lastActiveAt: now,
          joinDate: now,
          memberSince: new Date().toISOString().split('T')[0],
        },

        permissions: {
          canCreateEvents: false,
          canModerateChat: false,
          canInviteMembers: false,
          canManageMembers: false,
        },

        notifications: {
          clubEvents: true,
          clubChat: true,
          memberUpdates: true,
          announcements: true,
        },

        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('clubMembers').doc(membershipId).set(memberData);
      console.log(`   ✅ clubMembers 문서 생성 완료`);

      createdUsers.push({
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        ltr: ltr,
      });

      successCount++;
      console.log(`   🎉 완료! LPR: ${ltr}`);

    } catch (error) {
      console.error(`   ❌ 오류 발생:`, error.message);
      errorCount++;
    }
  }

  // 5. 클럽 통계 업데이트
  if (successCount > 0) {
    console.log(`\n📊 클럽 통계 업데이트 중...`);
    try {
      await db.collection('pickleball_clubs').doc(CLUB_ID).update({
        'statistics.activeMembers': admin.firestore.FieldValue.increment(successCount),
        'statistics.totalMembers': admin.firestore.FieldValue.increment(successCount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ 클럽 통계 업데이트 완료 (+${successCount}명)`);
    } catch (error) {
      console.error(`   ⚠️  클럽 통계 업데이트 실패:`, error.message);
    }
  }

  // 결과 요약
  console.log('\n🎾 =====================================================');
  console.log('🎾 결과 요약');
  console.log('🎾 =====================================================');
  console.log(`   ✅ 성공: ${successCount}명`);
  console.log(`   ⏭️  건너뜀: ${skipCount}명`);
  console.log(`   ❌ 오류: ${errorCount}명`);
  console.log(`   📊 총 처리: ${NUM_USERS}명\n`);

  if (createdUsers.length > 0) {
    console.log('📋 생성된 회원 목록:');
    console.log('   이름\t\t\tLPR\t이메일');
    console.log('   ' + '-'.repeat(50));
    createdUsers.forEach(user => {
      console.log(`   ${user.displayName}\t${user.ltr}\t${user.email}`);
    });
  }

  console.log('\n🎾 =====================================================');
  console.log('🎾 완료!');
  console.log('🎾 =====================================================\n');
}

// 실행
createTournamentTestUsers()
  .then(() => {
    console.log('✅ 스크립트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 스크립트 실패:', error);
    process.exit(1);
  });
