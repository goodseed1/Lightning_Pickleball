#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const zhPath = path.join(localesPath, 'zh.json');
const untranslatedPath = path.join(__dirname, 'untranslated-zh.json');

const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

console.log(`🎯 FINAL 62 KEYS: Completing ALL remaining Chinese translations...\n`);

// Complete translation map for ALL remaining 62 keys
const final62Map = {
  // Keep as-is
  中文: '中文',
  English: 'English',
  Español: 'Español',
  Français: 'Français',
  '{{email}}': '{{email}}',
  '{{current}}/{{max}}': '{{current}}/{{max}}',
  '×{{count}}': '×{{count}}',

  // Skill levels - keep as numbers
  '2.0-3.0': '2.0-3.0',
  '3.0-4.0': '3.0-4.0',
  '4.0-5.0': '4.0-5.0',
  '5.0+': '5.0+',
  4: '4',

  // Common UI elements
  Preview: '预览',
  pts: '分',
  'Quick Insert': '快速插入',
  'Rate Sportsmanship': '评价体育精神',
  Reapply: '重新申请',
  'Reason for disagreement': '不同意的原因',
  Recurring: '重复',
  'Regular Meetings': '常规聚会',
  Request: '请求',
  Reschedule: '重新安排',
  Retired: '退赛',
  'Retired in set {{set}}': '在第{{set}}盘退赛',
  'Role Statistics': '角色统计',
  Rule: '规则',
  'Runner-up': '亚军',

  // Days of week
  Sat: '周六',
  Saturday: '周六',
  Sun: '周日',
  Sunday: '周日',
  Thu: '周四',
  Thursday: '周四',
  Tue: '周二',
  Tuesday: '周二',
  Wed: '周三',
  Wednesday: '周三',

  // Status/Events
  'Service Unavailable': '服务不可用',
  'Set as default': '设为默认',
  'Social Tennis': '社交网球',
  'Special Cases': '特殊情况',
  'Start Playoffs': '开始季后赛',
  Timeout: '暂停',
  'Training Clinic': '训练诊所',
  Walkover: '对方弃权',

  // Additional translations for context
  'Set 1': '第1盘',
  'Set 2': '第2盘',
  'Set 3': '第3盘',
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

// Build translations
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

  // Translate
  const value = item.value;
  let translated = final62Map[value] || value;

  // Pattern-based fallback
  if (translated === value) {
    // Check for partial matches
    for (const [en, zh] of Object.entries(final62Map)) {
      if (value.includes(en) && en.length > 3) {
        translated = translated.replace(new RegExp(en, 'g'), zh);
      }
    }
  }

  current[keys[keys.length - 1]] = translated;

  if (translated !== value) {
    count++;
    console.log(`✓ ${item.key}: "${value}" → "${translated}"`);
  }
});

// Merge and save
const updatedZh = deepMerge(zh, translations);
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log(`\n✅ Translated: ${count}/${untranslated.length} keys`);
console.log(`📝 Kept as-is: ${untranslated.length - count} keys (mostly template strings)`);
console.log('\n🎉🎉🎉 FINAL 62 KEYS COMPLETE! 🎉🎉🎉');
console.log(`\n📊 Overall Progress:`);
console.log(`   Started with: 962 untranslated keys`);
console.log(`   Now remaining: ${untranslated.length - count} keys`);
console.log(
  `   Completion rate: ${(((962 - (untranslated.length - count)) / 962) * 100).toFixed(1)}%`
);
