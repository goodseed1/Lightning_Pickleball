#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const ru = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'ru.json'), 'utf8'));

function findUntranslated(enObj, ruObj, currentPath = '') {
  const result = [];
  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const enValue = enObj[key];
    const ruValue = ruObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      result.push(...findUntranslated(enValue, ruValue || {}, fullPath));
    } else if (typeof enValue === 'string' && (!ruValue || ruValue === enValue)) {
      result.push({ path: fullPath, en: enValue });
    }
  }
  return result;
}

const untranslated = findUntranslated(en, ru);
const bySection = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  bySection[section] = (bySection[section] || 0) + 1;
});

console.log('Top sections with untranslated keys:\n');
Object.entries(bySection)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([section, count]) => {
    console.log(`  ${section}: ${count} keys`);
  });

console.log(`\nTotal: ${untranslated.length} untranslated keys`);

// Show sample untranslated keys from top section
const topSection = Object.entries(bySection).sort((a, b) => b[1] - a[1])[0][0];
console.log(`\nSample keys from '${topSection}':`);
untranslated
  .filter(item => item.path.startsWith(topSection + '.'))
  .slice(0, 10)
  .forEach(item => {
    console.log(`  ${item.path}: "${item.en}"`);
  });
