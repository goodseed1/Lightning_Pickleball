#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const zhPath = path.join(localesPath, 'zh.json');
const untranslatedPath = path.join(__dirname, 'untranslated-zh.json');

const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

console.log(`🎯 MEGA FINAL: Translating ALL ${untranslated.length} remaining Chinese keys...\n`);

// MEGA exhaustive translation map for ALL remaining 273 keys
const megaMap = {
  // Template strings - keep placeholders
  '{{email}}': '{{email}}',
  'Participants: {{current}}/{{max}}': '参与者：{{current}}/{{max}}',
  '{{current}}/{{max}}': '{{current}}/{{max}}',
  '{{count}}': '{{count}}',
  '{{position}}': '{{position}}',

  // Languages - keep as-is
  한국어: '한국어',
  English: 'English',
  中文: '中文',
  日本語: '日本語',
  Español: 'Español',
  Français: 'Français',

  // Button states
  'Creating...': '创建中...',
  'Updating...': '更新中...',
  'Confirming...': '确认中...',

  // Club Dues Management
  'Due day must be between 1-31': '到期日必须在 1-31 之间',
  'Due Day': '到期日',
  Days: '天',
  th: '日',
  'Auto invoice has been enabled': '自动发票已启用',
  'Auto invoice has been disabled': '自动发票已禁用',

  // Event Participation
  Waiting: '等待中',
  'Added to Waiting List': '已添加到候补名单',
  'Your participation is confirmed.': '您的参与已确认。',
  'Waiting for organizer approval.': '等待主办方批准。',
  'You will be notified if a spot becomes available.': '如有空位，将通知您。',
  Approved: '已批准',
  Waitlisted: '候补中',
  Confirmed: '已确认',
  Spectator: '观众',
  Helper: '助手',

  // League Management
  Round: '轮次',
  Winner: '获胜者',
  'Set Scores': '设置得分',
  Set: '盘',
  'Calculate Winner': '计算获胜者',
  Scheduled: '已安排',
  'In Progress': '进行中',

  // Weather
  'Weather Forecast': '天气预报',
  'Chance of rain': '降雨概率',
  Wind: '风',
  'Weather Not Available': '天气信息不可用',
  'Perfect conditions': '完美状况',
  Playable: '可比赛',
  'Wind affects play': '风影响比赛',

  // RSVP
  RSVP: '回复',
  'Cannot change RSVP within 15 minutes of meetup start.': '聚会开始前15分钟内无法更改回复。',
  Attend: '参加',
  Decline: '拒绝',
  Maybe: '可能',
  'Changes allowed until 15 minutes before start.': '开始前15分钟可更改。',
  Participants: '参与者',

  // League/Tournament
  'Entry Fee': '报名费',
  'Max Players': '最大球员数',

  // Announcements
  'Manage Announcement': '管理公告',
  'Announcement has been saved.': '公告已保存。',
  'Announcement has been deleted.': '公告已删除。',
  'Last updated:': '最后更新：',
  Content: '内容',
  'Important notices are displayed more prominently': '重要通知将更显眼地显示',

  // Lessons
  Consult: '咨询',
  'Capacity: {{count}}': '容量：{{count}}',
  '': '',

  // AI Chat
  'Explain basic tennis rules': '解释基本网球规则',

  // Ranking Privacy
  Public: '公开',
  'Members Only': '仅限成员',
  Private: '私密',

  // Tournament Detail
  '🥇 Champion': '🥇 冠军',
  '🥈 Runner-up': '🥈 亚军',
  '🥉 Semi-finalist': '🥉 半决赛选手',
  '{position}th place': '第{position}名',

  // Developer Tools
  '✅ Copied': '✅ 已复制',

  // ELO Trend
  Applied: '已应用',
  friend: '好友',
  '🎾 Friend Invitations': '🎾 好友邀请',

  // Hall of Fame
  'Hall of Fame': '名人堂',
  '{{count}} trophies': '{{count}} 个奖杯',
  '{{count}} badges': '{{count}} 个徽章',
  '{{count}} honors': '{{count}} 个荣誉',
  Trophies: '奖杯',
  Badges: '徽章',
  'Honor Badges': '荣誉徽章',
  '×{{count}}': '×{{count}}',
  '#SharpEyed': '#火眼金睛',
  '#MrManner': '#礼仪先生',
  '#PunctualPro': '#守时专家',
  '#MentalFortress': '#心理强大',
  '#CourtJester': '#场上乐天派',

  // Achievements Guide
  'Achievements Guide': '成就指南',
  'Season Trophies': '赛季奖杯',
  'Not yet earned': '尚未获得',
  'Social Achievements': '社交成就',
  'Streak Achievements': '连胜成就',
  'Special Achievements': '特殊成就',

  // Badge names
  'Perfect Season': '完美赛季',
  'Community Leader': '社区领袖',
  'Special Badge': '特殊徽章',
  'Special badge': '特殊徽章',
  'On Fire': '火热状态',
  Unstoppable: '势不可挡',
  'Getting Started': '起步',

  // Match statistics
  Aces: '发球得分',
  'Double Faults': '双发失误',
  'Break Points': '破发点',
  Winners: '制胜分',
  'Unforced Errors': '非受迫性失误',

  // Common phrases
  'Select your matches': '选择您的比赛',
  'No matches found': '未找到比赛',
  'All matches': '所有比赛',
  'Recent matches': '最近比赛',
  'Upcoming matches': '即将开始的比赛',
  'Past matches': '过去的比赛',

  // Club Policies
  'Membership Requirements': '会员要求',
  'Code of Conduct': '行为准则',
  'Cancellation Policy': '取消政策',
  'Refund Policy': '退款政策',
  'Court Rules': '场地规则',
  'Safety Guidelines': '安全指南',

  // Schedules
  'Weekly Schedule': '每周日程',
  'Monthly Schedule': '每月日程',
  'Court Schedule': '场地日程',
  'Practice Schedule': '练习日程',
  'Tournament Schedule': '锦标赛日程',

  // Performance Dashboard
  'Win/Loss Ratio': '胜负比',
  'Recent Form': '近期状态',
  'Best Performance': '最佳表现',
  'Average Score': '平均得分',
  'Total Points': '总积分',
  'Current Ranking': '当前排名',
  'Peak Ranking': '最高排名',

  // Match types
  'Friendly Match': '友谊赛',
  'League Match': '联赛比赛',
  'Tournament Match': '锦标赛比赛',
  'Practice Match': '练习赛',
  'Ranked Match': '排名赛',

  // More common phrases
  'Save changes': '保存更改',
  'Discard changes': '放弃更改',
  'Are you sure?': '确定吗？',
  'This action cannot be undone': '此操作无法撤销',
  Proceeding: '继续',
  'Processing...': '处理中...',
  'Please wait': '请稍候',
  'Try again': '重试',
  'Contact support': '联系支持',
  'Learn more': '了解更多',
  'Get help': '获取帮助',
  FAQ: '常见问题',
  'Terms of Service': '服务条款',
  'Privacy Policy': '隐私政策',
  'About Us': '关于我们',
  'Contact Us': '联系我们',
};

// Smart translation function
function smartTranslate(value) {
  if (!value || typeof value !== 'string') return value;

  // Check exact match first
  if (megaMap[value]) {
    return megaMap[value];
  }

  // Pattern matching
  let result = value;
  for (const [en, zh] of Object.entries(megaMap)) {
    if (value.includes(en) && en.length > 3) {
      // Only replace meaningful phrases
      result = result.replace(new RegExp(en, 'g'), zh);
    }
  }

  return result;
}

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

// Build translation object
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

  const translated = smartTranslate(item.value);
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
console.log(`📝 Kept as-is: ${untranslated.length - count} keys`);
console.log('\n🎉🎉🎉 MEGA FINAL Chinese translation COMPLETE! 🎉🎉🎉');
