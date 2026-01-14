const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// English translations
const enAchievements = {
  firstWin: {
    name: 'First Win',
    description: 'Win your first match',
  },
  winStreak3: {
    name: '3-Win Streak',
    description: 'Win 3 matches in a row',
  },
  winStreak5: {
    name: '5-Win Streak',
    description: 'Win 5 matches in a row',
  },
  totalWins10: {
    name: 'Win Collector',
    description: 'Achieve 10 total wins',
  },
  totalWins50: {
    name: 'Win Master',
    description: 'Achieve 50 total wins',
  },
  matchesPlayed10: {
    name: 'Getting Experience',
    description: 'Complete 10 total matches',
  },
  matchesPlayed100: {
    name: 'Veteran Player',
    description: 'Complete 100 total matches',
  },
  skillLevel70: {
    name: 'Skilled Player',
    description: 'Reach skill level 70',
  },
  skillLevel85: {
    name: 'Expert',
    description: 'Reach skill level 85',
  },
  socialPlayer: {
    name: 'Social Player',
    description: 'Match with 20 different players',
  },
  monthlyActive: {
    name: 'Monthly Active Player',
    description: 'Play 15 or more matches in a month',
  },
  earlyBird: {
    name: 'Early Bird',
    description: 'Complete 10 matches before 10 AM',
  },
  nightOwl: {
    name: 'Night Owl',
    description: 'Complete 10 matches after 8 PM',
  },
};

const enCategories = {
  overall: {
    name: 'Overall Ranking',
    description: 'Ranking based on total performance',
  },
  skillLevel: {
    name: 'Skill Level Ranking',
    description: 'Ranking based on skill level',
  },
  winRate: {
    name: 'Win Rate Ranking',
    description: 'Ranking based on win rate',
  },
  monthlyActive: {
    name: 'Monthly Active Ranking',
    description: 'Ranking based on monthly match activity',
  },
  improvement: {
    name: 'Improvement Ranking',
    description: 'Ranking based on skill improvement rate',
  },
};

// Korean translations
const koAchievements = {
  firstWin: {
    name: '첫 승리',
    description: '첫 번째 매치에서 승리하세요',
  },
  winStreak3: {
    name: '3연승',
    description: '3경기 연속 승리하세요',
  },
  winStreak5: {
    name: '5연승',
    description: '5경기 연속 승리하세요',
  },
  totalWins10: {
    name: '승리 수집가',
    description: '총 10승을 달성하세요',
  },
  totalWins50: {
    name: '승리 마스터',
    description: '총 50승을 달성하세요',
  },
  matchesPlayed10: {
    name: '경험 쌓기',
    description: '총 10경기를 완료하세요',
  },
  matchesPlayed100: {
    name: '베테랑 플레이어',
    description: '총 100경기를 완료하세요',
  },
  skillLevel70: {
    name: '숙련자',
    description: '스킬 레벨 70에 도달하세요',
  },
  skillLevel85: {
    name: '전문가',
    description: '스킬 레벨 85에 도달하세요',
  },
  socialPlayer: {
    name: '소셜 플레이어',
    description: '20명의 다른 플레이어와 매치하세요',
  },
  monthlyActive: {
    name: '이달의 활발한 플레이어',
    description: '한 달에 15경기 이상 플레이하세요',
  },
  earlyBird: {
    name: '얼리 버드',
    description: '오전 10시 이전에 10경기를 완료하세요',
  },
  nightOwl: {
    name: '올빼미',
    description: '저녁 8시 이후에 10경기를 완료하세요',
  },
};

const koCategories = {
  overall: {
    name: '종합 랭킹',
    description: '전체 성적 기반 랭킹',
  },
  skillLevel: {
    name: '스킬 레벨 랭킹',
    description: '스킬 레벨 기준 랭킹',
  },
  winRate: {
    name: '승률 랭킹',
    description: '승률 기준 랭킹',
  },
  monthlyActive: {
    name: '월간 활동 랭킹',
    description: '월간 매치 활동량 기준 랭킹',
  },
  improvement: {
    name: '성장 랭킹',
    description: '스킬 향상률 기준 랭킹',
  },
};

function updateLocale(filename, achievements, categories) {
  const filePath = path.join(localesDir, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Ensure services.leaderboard exists
  if (!content.services) {
    content.services = {};
  }
  if (!content.services.leaderboard) {
    content.services.leaderboard = {};
  }

  // Add achievements and categories
  content.services.leaderboard.achievements = achievements;
  content.services.leaderboard.categories = categories;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

// Update en.json and ko.json first
updateLocale('en.json', enAchievements, enCategories);
updateLocale('ko.json', koAchievements, koCategories);

// Propagate English to other locales
const otherLocales = [
  'de.json',
  'es.json',
  'fr.json',
  'it.json',
  'ja.json',
  'pt.json',
  'ru.json',
  'zh.json',
];
for (const locale of otherLocales) {
  updateLocale(locale, enAchievements, enCategories);
}

console.log('\n🎉 All locale files updated with achievements and categories!');
