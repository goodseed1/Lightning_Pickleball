#!/usr/bin/env node
/**
 * Verify translations are complete (ignoring legitimate universal values)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Read files
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const ru = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'ru.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'zh.json'), 'utf8'));

// Values that are legitimately the same across all languages
const UNIVERSAL_VALUES = new Set([
  '{{current}}/{{max}}', // Template variables
  '한국어', // Language names in native scripts
  '中文',
  '日本語',
  'Español',
  'Français',
  'English',
  'Venmo', // Brand names
  'RSVP',
  '', // Empty strings
  '×{{count}}', // Template with symbols
  '2.0-3.0', // Skill level numbers
  '3.0-4.0',
  '4.0-5.0',
  '5.0+',
  '4', // Numbers
]);

function findActualUntranslated(enObj, targetObj, prefix = '') {
  const untranslated = [];

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const enValue = enObj[key];
    const targetValue = targetObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      // Recursively check nested objects
      untranslated.push(...findActualUntranslated(enValue, targetValue, fullKey));
    } else {
      // Check if target value is missing
      if (targetValue === undefined) {
        untranslated.push({ key: fullKey, enValue, reason: 'missing' });
      }
      // Check if equals English but NOT a universal value
      else if (targetValue === enValue && !UNIVERSAL_VALUES.has(enValue)) {
        untranslated.push({ key: fullKey, enValue, reason: 'same-as-english' });
      }
    }
  }

  return untranslated;
}

console.log('🔍 Verifying translations (excluding universal values)...\n');

const ruUntranslated = findActualUntranslated(en, ru);
const zhUntranslated = findActualUntranslated(en, zh);

console.log(`Russian (ru): ${ruUntranslated.length} actually untranslated keys`);
console.log(`Chinese (zh): ${zhUntranslated.length} actually untranslated keys`);

if (ruUntranslated.length > 0) {
  console.log('\n❌ Russian needs translation:');
  ruUntranslated.slice(0, 5).forEach(item => {
    console.log(`  - ${item.key}: "${item.enValue}" (${item.reason})`);
  });
}

if (zhUntranslated.length > 0) {
  console.log('\n❌ Chinese needs translation:');
  zhUntranslated.slice(0, 5).forEach(item => {
    console.log(`  - ${item.key}: "${item.enValue}" (${item.reason})`);
  });
}

if (ruUntranslated.length === 0 && zhUntranslated.length === 0) {
  console.log('\n✅ All translations are complete! 100% coverage for Russian and Chinese!');
  console.log('🎉 Both languages are production-ready!');
}

// Save detailed reports if there are issues
if (ruUntranslated.length > 0) {
  fs.writeFileSync(
    path.join(__dirname, 'actual-untranslated-ru.json'),
    JSON.stringify(ruUntranslated, null, 2)
  );
}

if (zhUntranslated.length > 0) {
  fs.writeFileSync(
    path.join(__dirname, 'actual-untranslated-zh.json'),
    JSON.stringify(zhUntranslated, null, 2)
  );
}
