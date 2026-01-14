/**
 * 🎾 클럽 Regular Meetups 요일을 영어로 변경하는 스크립트
 *
 * 한국어 요일명을 영어로 변경합니다.
 * 예: "토요일 6:00 PM" → "Saturday 6:00 PM"
 *
 * 사용법: node scripts/update-club-meetups-to-english.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// 한국어 → 영어 요일 매핑
const dayTranslations = {
  월요일: 'Monday',
  화요일: 'Tuesday',
  수요일: 'Wednesday',
  목요일: 'Thursday',
  금요일: 'Friday',
  토요일: 'Saturday',
  일요일: 'Sunday',
};

function translateDay(text) {
  if (!text) return text;

  let translated = text;
  for (const [korean, english] of Object.entries(dayTranslations)) {
    translated = translated.replace(korean, english);
  }
  return translated;
}

async function updateClubMeetupsToEnglish() {
  console.log('🎾 클럽 Regular Meetups 영어로 변경 시작...\n');

  // 모든 클럽 가져오기 (컬렉션 이름: pickleball_clubs)
  const clubsSnap = await db.collection('pickleball_clubs').get();

  console.log(`📊 ${clubsSnap.size}개의 클럽 발견\n`);

  let totalUpdated = 0;

  for (const clubDoc of clubsSnap.docs) {
    const clubData = clubDoc.data();
    const clubId = clubDoc.id;
    const clubName = clubData.name || clubId;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏟️ 클럽: ${clubName}`);

    const updates = {};
    let hasChanges = false;

    // regularMeetups 필드 확인 (대문자 M!)
    if (clubData.regularMeetups && Array.isArray(clubData.regularMeetups)) {
      const originalMeetups = clubData.regularMeetups;
      const updatedMeetups = [];

      console.log(`   📅 regularMeetups: ${JSON.stringify(originalMeetups)}`);

      for (const meetup of originalMeetups) {
        // meetup이 문자열인 경우 (예: "토요일 6:00 PM")
        if (typeof meetup === 'string') {
          const translated = translateDay(meetup);
          if (translated !== meetup) {
            console.log(`   ✏️ "${meetup}" → "${translated}"`);
            hasChanges = true;
          }
          updatedMeetups.push(translated);
        }
        // meetup이 객체인 경우 (예: { day: '토요일', time: '6:00 PM' })
        else if (typeof meetup === 'object' && meetup.day) {
          const translatedDay = dayTranslations[meetup.day] || meetup.day;
          if (translatedDay !== meetup.day) {
            console.log(`   ✏️ day: "${meetup.day}" → "${translatedDay}"`);
            hasChanges = true;
            updatedMeetups.push({ ...meetup, day: translatedDay });
          } else {
            updatedMeetups.push(meetup);
          }
        } else {
          updatedMeetups.push(meetup);
        }
      }

      if (hasChanges) {
        updates.regularMeetups = updatedMeetups;
      }
    } else {
      console.log(`   ⏭️ regularMeetups 없음`);
    }

    // settings 필드 내 한국어 확인
    if (clubData.settings) {
      const settingsStr = JSON.stringify(clubData.settings);
      if (/[가-힣]/.test(settingsStr)) {
        console.log(`   ⚠️ settings 내 한국어 감지됨 (별도 처리 필요)`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('pickleball_clubs').doc(clubId).update(updates);
      console.log(`   ✅ 업데이트 완료`);
      totalUpdated++;
    } else if (!hasChanges && clubData.regularMeetups) {
      // 이미 영어인지 한국어 포함 여부 확인
      const meetupsStr = JSON.stringify(clubData.regularMeetups);
      const hasKorean = /[가-힣]/.test(meetupsStr);
      if (hasKorean) {
        console.log(`   ⚠️ 한국어 포함되어 있으나 매핑 없음`);
      } else {
        console.log(`   ⏭️ 이미 영어`);
      }
    }
  }

  // regular_meetups 컬렉션에서 한국어 데이터 업데이트
  console.log('\n\n📅 regular_meetups 컬렉션 업데이트...\n');

  const meetupsSnap = await db.collection('regular_meetups').get();
  let meetupsUpdated = 0;

  for (const meetupDoc of meetupsSnap.docs) {
    const meetupData = meetupDoc.data();
    const meetupId = meetupDoc.id;
    const updates = {};
    let hasChanges = false;

    // title 확인
    if (meetupData.title && /[가-힣]/.test(meetupData.title)) {
      // "정기 모임" → "Regular Meetup"
      if (meetupData.title === '정기 모임') {
        updates.title = 'Regular Meetup';
        console.log(`   ✏️ title: "${meetupData.title}" → "Regular Meetup" (ID: ${meetupId})`);
        hasChanges = true;
      }
    }

    // location.name 확인
    if (meetupData.location?.name && /[가-힣]/.test(meetupData.location.name)) {
      // "클럽 홈코트" → "Club Home Court"
      if (meetupData.location.name === '클럽 홈코트') {
        updates['location.name'] = 'Club Home Court';
        console.log(
          `   ✏️ location.name: "${meetupData.location.name}" → "Club Home Court" (ID: ${meetupId})`
        );
        hasChanges = true;
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('regular_meetups').doc(meetupId).update(updates);
      meetupsUpdated++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 완료!`);
  console.log(`   🏟️ 클럽 업데이트: ${totalUpdated}개`);
  console.log(`   📅 Meetup 업데이트: ${meetupsUpdated}개`);
  console.log('='.repeat(60));

  process.exit(0);
}

// 스크립트 실행
updateClubMeetupsToEnglish().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
