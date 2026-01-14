const fs = require('fs');

// Load zh.json
const zh = JSON.parse(fs.readFileSync('src/locales/zh.json', 'utf8'));

// CORRECT aiMatching translations based on ACTUAL batch1-keys.json
const translations = {
  'aiMatching.results.refreshButton': '刷新',
  'aiMatching.candidate.matchScore': '匹配度',
  'aiMatching.candidate.skillLevel.beginner': '初级',
  'aiMatching.candidate.skillLevel.elementary': '初中级',
  'aiMatching.candidate.skillLevel.intermediate': '中级',
  'aiMatching.candidate.skillLevel.advanced': '高级',
  'aiMatching.candidate.attributes.strengths': '优势',
  'aiMatching.candidate.attributes.playStyle': '打法风格',
  'aiMatching.candidate.playStyles.aggressive': '进攻型',
  'aiMatching.candidate.playStyles.defensive': '防守型',
  'aiMatching.candidate.playStyles.allRound': '全面型',
  'aiMatching.candidate.strengths.serve': '发球',
  'aiMatching.candidate.strengths.volley': '截击',
  'aiMatching.candidate.strengths.strategic': '战术',
  'aiMatching.candidate.strengths.backhand': '反手',
  'aiMatching.candidate.strengths.defense': '防守',
  'aiMatching.candidate.strengths.endurance': '耐力',
  'aiMatching.candidate.strengths.forehand': '正手',
  'aiMatching.candidate.strengths.netPlay': '网前',
  'aiMatching.candidate.strengths.mental': '心理',
  'aiMatching.candidate.availability.morning': '上午',
  'aiMatching.candidate.availability.afternoon': '下午',
  'aiMatching.candidate.availability.evening': '晚上',
  'aiMatching.candidate.availability.weekend': '周末',
  'aiMatching.candidate.selected': '已选择',
  'aiMatching.mockData.candidate1.name': 'Sarah Kim',
  'aiMatching.mockData.candidate1.bio': '喜欢积极打法，周末经常打球',
  'aiMatching.mockData.candidate2.name': 'Michael Chen',
  'aiMatching.mockData.candidate3.name': 'Jessica Park',
  'aiMatching.mockData.candidate3.bio': '专注于截击战术，晚上有空',
  'aiMatching.bottomBar.selectedName': '已选择搭档',
};

// Helper function to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

// Apply translations
let count = 0;
for (const [key, value] of Object.entries(translations)) {
  setNestedValue(zh, key, value);
  count++;
}

// Save updated zh.json
fs.writeFileSync('src/locales/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');

console.log('✅ Applied ' + count + ' aiMatching translations to zh.json');
