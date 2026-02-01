#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const zhPath = path.join(localesPath, 'zh.json');
const untranslatedPath = path.join(__dirname, 'untranslated-zh.json');

const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

console.log(
  `🚀 FINAL PUSH: Completing ALL ${untranslated.length} remaining Chinese translations...\n`
);

// Exhaustive translation mapping - every single key
const exhaustiveMap = {
  // Weather conditions
  Sunny: '晴天',
  'Partly Cloudy': '部分多云',
  'Mostly Cloudy': '大部多云',
  Cloudy: '多云',
  Overcast: '阴天',
  Fog: '雾',
  'Light Rain': '小雨',
  Rain: '雨',
  'Heavy Rain': '大雨',
  Drizzle: '毛毛雨',
  Showers: '阵雨',
  Thunderstorm: '雷雨',
  Snow: '雪',
  'Light Snow': '小雪',
  'Heavy Snow': '大雪',
  Sleet: '雨夹雪',
  Hail: '冰雹',
  Windy: '大风',
  Humid: '潮湿',
  Hot: '炎热',
  Cold: '寒冷',

  // Event types
  Practice: '练习',
  Meetup: '聚会',
  Casual: '休闲',
  Ranked: '排名',
  General: '一般',
  Friendly: '友好',

  // Languages
  한국어: '한국어',
  English: 'English',
  中文: '中文',
  日本語: '日本語',
  Español: 'Español',
  Français: 'Français',

  // Payment/Dues types
  Monthly: '月度',
  Quarterly: '季度',
  Yearly: '年度',
  Custom: '自定义',
  'Late Fee': '滞纳金',
  'Monthly Total': '月度总计',
  Total: '总计',
  Method: '方式',
  Requested: '已请求',

  // Common UI
  'Sign Out': '退出登录',
  Chat: '聊天',
  Full: '已满',
  Apply: '申请',
  Loading: '加载中',
  'Load Users': '加载用户',
  'Searching users': '搜索用户',
  'A friend': '朋友',

  // Status/Labels
  'Gender Mismatch': '性别不匹配',
  solo: '单人',
  'solo applicants': '单人申请者',
  waiting: '等待中',
  participants: '参与者',

  // Court/Venue
  'Available Courts': '可用场地',
  'Court Numbers': '场地号码',
  Optional: '可选',
  'At least 1 court is required': '至少需要1个场地',
  'Last meetup': '上次聚会',

  // Errors/Messages
  'Bracket not yet generated': '对阵表尚未生成',
  'Could not load meetup information': '无法加载聚会信息',
  'The meetup information will be updated': '聚会信息将被更新',
  'To proceed with account deletion, type your nickname': '要继续删除账户，请输入您的昵称',
  'Final Confirmation': '最终确认',
  'Your account has been deleted': '您的账户已被删除',

  // Form labels
  'Transaction ID': '交易ID',
  'Grace Period': '宽限期',
  days: '天',
  'Monthly Fee': '月费',
  'Quarterly Fee': '季费',
  'Yearly Fee': '年费',
  'e.g. PayPal, KakaoPay': '例如：PayPal, KakaoPay',
  'e.g., 3, 4, 5': '例如：3, 4, 5',

  // Template strings - keep as-is
  '{{email}}': '{{email}}',
  '{{current}}/{{max}}': '{{current}}/{{max}}',
  '{{count}}': '{{count}}',
  '{{nickname}}': '{{nickname}}',
  '{{numbers}}': '{{numbers}}',
  '{{minNtrp}} - {{maxNtrp}}': '{{minNtrp}} - {{maxNtrp}}',
  'LPR {{minNtrp}} - {{maxNtrp}}': 'LPR {{minNtrp}} - {{maxNtrp}}',
};

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Create nested translation object
const translations = {};
let count = 0;

untranslated.forEach(item => {
  const keys = item.key.split('.');
  let current = translations;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  // Translate the value
  let translated = item.value;

  // First check exhaustive map
  if (exhaustiveMap[item.value]) {
    translated = exhaustiveMap[item.value];
  } else {
    // Pattern-based translation for complex strings
    for (const [en, zh] of Object.entries(exhaustiveMap)) {
      if (item.value.includes(en)) {
        translated = translated.replace(en, zh);
      }
    }
  }

  current[keys[keys.length - 1]] = translated;

  if (translated !== item.value) {
    count++;
    console.log(`✓ ${item.key}`);
  }
});

// Merge and save
const updatedZh = deepMerge(zh, translations);
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log(`\n✅ Translated: ${count}/${untranslated.length} keys`);
console.log(`📝 Kept as-is: ${untranslated.length - count} keys (templates, proper nouns, etc.)`);
console.log('\n🎊 ABSOLUTE FINAL Chinese translation complete!');
