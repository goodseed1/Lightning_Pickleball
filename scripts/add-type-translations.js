#!/usr/bin/env node
/**
 * Add type-related translations (match types, status, dues, schedules) to locale files
 * This script adds new translation keys for type files (match.ts, clubSchedule.ts, dues.ts)
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

console.log('🚀 Adding type translations to locale files...\n');

// ============================================
// STEP 1: Update ko.json (Korean - source of truth)
// ============================================

const koPath = path.join(LOCALES_DIR, 'ko.json');
const koData = JSON.parse(fs.readFileSync(koPath, 'utf8'));

// Add new translation sections for types
koData.types = koData.types || {};

// Match types and status
koData.types.match = {
  // Match Types (from match.ts MATCH_TYPES)
  matchTypes: {
    league: '리그 경기',
    tournament: '토너먼트',
    lightning_match: '번개 매치',
    practice: '연습 경기',
  },
  // Match Status (from match.ts MATCH_STATUS)
  matchStatus: {
    scheduled: '예정됨',
    in_progress: '진행중',
    partner_pending: '파트너 수락 대기',
    pending_confirmation: '확인 대기',
    confirmed: '확인됨',
    completed: '완료됨',
    disputed: '분쟁중',
    cancelled: '취소됨',
  },
  // Match Formats (from match.ts MATCH_FORMATS)
  matchFormats: {
    singles: '단식',
    doubles: '복식',
  },
  // Validation error messages
  validation: {
    minOneSet: '최소 1세트는 입력해야 합니다.',
    gamesNonNegative: '{{setNum}}세트: 게임 수는 0 이상이어야 합니다.',
    gamesExceedMax: '{{setNum}}세트: 게임 수는 {{maxGames}}을 초과할 수 없습니다.',
    gamesExceedMaxShort:
      '{{setNum}}세트: 단축 세트 경기에서는 게임 점수가 {{maxGames}}점을 넘을 수 없습니다. (최대 {{gamesPerSet}}-{{minWin}} 또는 {{maxAllowed}}-{{gamesPerSet1}})',
    tiebreakRequired:
      '{{setNum}}세트: {{setType}}에서 {{score}}-{{score}}일 때는 타이브레이크 점수가 필요합니다.',
    tiebreakMargin:
      '{{setNum}}세트: {{tiebreakType}}는 2점 차이로 끝나야 합니다. (예: 7-5, 8-6, 10-8)',
    tiebreakMinPoints:
      '{{setNum}}세트: {{tiebreakType}}는 최소 {{minPoints}}점까지 가야 합니다. (예: {{minPoints}}-{{minPoints2}}, {{minPoints1}}-{{minPoints3}})',
    incompleteSet:
      '{{setNum}}세트: {{setType}} 경기에서 {{gamesPerSet}}게임 미만으로 세트가 끝났습니다. 기권이나 특수상황인지 확인하세요.',
    invalidWinScore:
      '{{setNum}}세트: {{gamesPerSet}}게임으로 이기려면 상대방은 최대 {{maxOppGames}}게임까지만 가능합니다.',
    invalidWinScoreShort:
      '{{setNum}}세트: 단축 세트에서 {{gamesPerSet}}-{{minGames}}는 불가능합니다. {{gamesPerSet}}게임으로 이기려면 상대는 최대 {{maxOppGames}}게임까지만 가능합니다.',
    invalidMaxGamesScore:
      '{{setNum}}세트: {{maxGames}}게임으로 이기려면 상대방은 {{gamesPerSet1}}게임 또는 {{gamesPerSet}}게임이어야 합니다.',
    invalidMaxGamesScoreShort:
      '{{setNum}}세트: 단축 세트에서 {{maxGames}}-{{minGames}}는 불가능합니다. {{gamesPerSet}}-{{minGames}}에서 이미 세트가 끝납니다.',
    regularSet: '일반 세트',
    shortSet: '단축 세트',
    tiebreak: '타이브레이크',
    superTiebreak: '슈퍼 타이브레이크',
  },
};

// Club Schedule types
koData.types.clubSchedule = {
  // Day of week labels
  daysOfWeek: {
    0: '일요일',
    1: '월요일',
    2: '화요일',
    3: '수요일',
    4: '목요일',
    5: '금요일',
    6: '토요일',
  },
  // Schedule type labels
  scheduleTypes: {
    practice: '연습 세션',
    social: '친목 피클볼',
    league_match: '리그 경기',
    clinic: '트레이닝 클리닉',
    tournament: '토너먼트',
    meeting: '클럽 회의',
    mixed_doubles: '혼합 복식',
    beginner_friendly: '초보자 환영',
    advanced_only: '상급자 전용',
    custom: '커스텀 이벤트',
  },
  // Recurrence labels
  recurrence: {
    weekly: '매주',
    biweekly: '격주',
    monthly: '매월',
    custom: '사용자 정의',
  },
  // Time period labels
  timePeriod: {
    am: '오전',
    pm: '오후',
  },
};

// Dues types
koData.types.dues = {
  // Dues types
  duesTypes: {
    join: '가입비',
    monthly: '월회비',
    quarterly: '분기회비',
    yearly: '연회비',
    late_fee: '연체료',
  },
  // Payment status
  paymentStatus: {
    paid: '납부 완료',
    unpaid: '미납',
    overdue: '연체',
    pending_approval: '승인 대기',
    exempt: '면제',
  },
  // Period formatting
  period: {
    year: '{{year}}년',
    yearMonth: '{{year}}년 {{month}}월',
  },
};

// Write updated ko.json
fs.writeFileSync(koPath, JSON.stringify(koData, null, 2) + '\n', 'utf8');
console.log('✅ Updated ko.json with type translations');

// ============================================
// STEP 2: Update en.json (English)
// ============================================

const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

enData.types = enData.types || {};

// Match types and status (English)
enData.types.match = {
  matchTypes: {
    league: 'League Match',
    tournament: 'Tournament',
    lightning_match: 'Lightning Match',
    practice: 'Practice Match',
  },
  matchStatus: {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    partner_pending: 'Partner Pending',
    pending_confirmation: 'Pending Confirmation',
    confirmed: 'Confirmed',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  },
  matchFormats: {
    singles: 'Singles',
    doubles: 'Doubles',
  },
  validation: {
    minOneSet: 'At least one set must be entered.',
    gamesNonNegative: 'Set {{setNum}}: Games must be 0 or greater.',
    gamesExceedMax: 'Set {{setNum}}: Games cannot exceed {{maxGames}}.',
    gamesExceedMaxShort:
      'Set {{setNum}}: In short sets, games cannot exceed {{maxGames}} (max {{gamesPerSet}}-{{minWin}} or {{maxAllowed}}-{{gamesPerSet1}}).',
    tiebreakRequired:
      'Set {{setNum}}: In {{setType}}, tiebreak points are required when score is {{score}}-{{score}}.',
    tiebreakMargin:
      'Set {{setNum}}: {{tiebreakType}} must end with a 2-point margin (e.g., 7-5, 8-6, 10-8).',
    tiebreakMinPoints:
      'Set {{setNum}}: {{tiebreakType}} must reach at least {{minPoints}} points (e.g., {{minPoints}}-{{minPoints2}}, {{minPoints1}}-{{minPoints3}}).',
    incompleteSet:
      'Set {{setNum}}: In {{setType}}, set ended with less than {{gamesPerSet}} games. Please verify if this was a retirement or special situation.',
    invalidWinScore:
      'Set {{setNum}}: To win with {{gamesPerSet}} games, opponent can have maximum {{maxOppGames}} games.',
    invalidWinScoreShort:
      'Set {{setNum}}: In short sets, {{gamesPerSet}}-{{minGames}} is impossible. To win with {{gamesPerSet}} games, opponent can have maximum {{maxOppGames}} games.',
    invalidMaxGamesScore:
      'Set {{setNum}}: To win with {{maxGames}} games, opponent must have {{gamesPerSet1}} or {{gamesPerSet}} games.',
    invalidMaxGamesScoreShort:
      'Set {{setNum}}: In short sets, {{maxGames}}-{{minGames}} is impossible. Set ends at {{gamesPerSet}}-{{minGames}}.',
    regularSet: 'regular set',
    shortSet: 'short set',
    tiebreak: 'tiebreak',
    superTiebreak: 'super tiebreak',
  },
};

// Club Schedule types (English)
enData.types.clubSchedule = {
  daysOfWeek: {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  },
  scheduleTypes: {
    practice: 'Practice Session',
    social: 'Social Pickleball',
    league_match: 'League Match',
    clinic: 'Training Clinic',
    tournament: 'Tournament',
    meeting: 'Club Meeting',
    mixed_doubles: 'Mixed Doubles',
    beginner_friendly: 'Beginner Friendly',
    advanced_only: 'Advanced Only',
    custom: 'Custom Event',
  },
  recurrence: {
    weekly: 'Every week',
    biweekly: 'Every two weeks',
    monthly: 'Every month',
    custom: 'Custom schedule',
  },
  timePeriod: {
    am: 'AM',
    pm: 'PM',
  },
};

// Dues types (English)
enData.types.dues = {
  duesTypes: {
    join: 'Join Fee',
    monthly: 'Monthly Dues',
    quarterly: 'Quarterly Dues',
    yearly: 'Yearly Dues',
    late_fee: 'Late Fee',
  },
  paymentStatus: {
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    pending_approval: 'Pending Approval',
    exempt: 'Exempt',
  },
  period: {
    year: '{{year}}',
    yearMonth: '{{month}}/{{year}}',
  },
};

// Write updated en.json
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
console.log('✅ Updated en.json with type translations');

// ============================================
// STEP 3: Propagate to other locales
// ============================================

const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('\n📤 Propagating to other locales...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Copy the English translations (to be translated later)
    data.types = enData.types;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Type translations added successfully!');
console.log('\n📝 Next steps:');
console.log(
  '1. Update type files (match.ts, clubSchedule.ts, dues.ts) to use translation functions'
);
console.log('2. Replace static objects with helper functions that accept t() as parameter');
console.log('3. Update components to use new translation keys');
