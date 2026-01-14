#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function findUntranslatedKeys(obj, enObj, path = '', results = []) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    const enValue = enObj[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      if (!value || typeof value !== 'object') {
        findUntranslatedKeys({}, enValue, currentPath, results);
      } else {
        findUntranslatedKeys(value, enValue, currentPath, results);
      }
    } else if (typeof enValue === 'string') {
      if (!value || value === enValue || value === '') {
        // Check if it's intentional (variable placeholders, proper nouns, etc.)
        const isPlaceholder = /{{.*}}/.test(enValue);
        const isProperNoun = /^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(enValue);
        const isShortTechnical = [
          'OK',
          'AM',
          'PM',
          'RSVP',
          'km',
          'mi',
          'min',
          'Set',
          'Chat',
          'Total',
          'Club',
          'Error',
          'Logo',
          'Venmo',
        ].includes(enValue);
        const isNumericPattern = /^[\d\.\-\+]+$/.test(enValue);
        const isEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(enValue);

        if (
          !isPlaceholder &&
          !isProperNoun &&
          !isShortTechnical &&
          !isNumericPattern &&
          !isEmoji &&
          enValue.length > 0
        ) {
          results.push({ path: currentPath, enValue: enValue, currentValue: value || '(missing)' });
        }
      }
    }
  }
  return results;
}

const enData = readJSON(path.join(LOCALES_DIR, 'en.json'));
const TARGET_LANGUAGES = {
  es: 'Spanish',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
};

console.log('📊 Translation Completion Report\n');
console.log('Total keys in English:', countKeys(enData), '\n');

for (const [lang, langName] of Object.entries(TARGET_LANGUAGES)) {
  const langFile = path.join(LOCALES_DIR, `${lang}.json`);
  const langData = readJSON(langFile);

  const untranslated = findUntranslatedKeys(langData, enData);
  const totalKeys = countKeys(enData);
  const translatedKeys = totalKeys - untranslated.length;
  const percentage = ((translatedKeys / totalKeys) * 100).toFixed(1);

  console.log(`${lang.toUpperCase()} (${langName}):`);
  console.log(`  ✓ Translated: ${translatedKeys}/${totalKeys} (${percentage}%)`);
  console.log(`  ✗ Remaining: ${untranslated.length}`);

  if (untranslated.length > 0) {
    console.log('  Sample untranslated:');
    untranslated.slice(0, 3).forEach(item => {
      console.log(`    - ${item.path}: "${item.enValue}"`);
    });
  }
  console.log('');
}
