#!/usr/bin/env node
/**
 * Find all keys where Russian and Chinese still have English text
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Read files
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const ru = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'ru.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'zh.json'), 'utf8'));

function findUntranslated(enObj, targetObj, prefix = '') {
  const untranslated = [];

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const enValue = enObj[key];
    const targetValue = targetObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      // Recursively check nested objects
      untranslated.push(...findUntranslated(enValue, targetValue, fullKey));
    } else {
      // Check if target value is missing or equals English value
      if (!targetValue || targetValue === enValue) {
        untranslated.push({ key: fullKey, enValue });
      }
    }
  }

  return untranslated;
}

console.log('🔍 Finding untranslated keys for Russian and Chinese...\n');

const ruUntranslated = findUntranslated(en, ru);
const zhUntranslated = findUntranslated(en, zh);

console.log(`Russian (ru): ${ruUntranslated.length} untranslated keys`);
console.log(`Chinese (zh): ${zhUntranslated.length} untranslated keys`);

// Save to files for review
fs.writeFileSync(
  path.join(__dirname, 'untranslated-ru.json'),
  JSON.stringify(ruUntranslated, null, 2)
);
fs.writeFileSync(
  path.join(__dirname, 'untranslated-zh.json'),
  JSON.stringify(zhUntranslated, null, 2)
);

console.log('\n✅ Saved untranslated keys to:');
console.log('  - scripts/untranslated-ru.json');
console.log('  - scripts/untranslated-zh.json');
