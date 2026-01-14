#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'));

function findUntranslated(obj, compareObj, prefix = '') {
  let untranslated = {};

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const compareChild = compareObj?.[key] || {};
      const nested = findUntranslated(obj[key], compareChild, fullKey);
      untranslated = { ...untranslated, ...nested };
    } else {
      const compareValue = compareObj?.[key];
      if (obj[key] === compareValue) {
        untranslated[fullKey] = obj[key];
      }
    }
  }

  return untranslated;
}

const langs = ['es', 'de', 'pt'];
const result = {};

langs.forEach(lang => {
  const target = JSON.parse(fs.readFileSync(path.join(localesPath, `${lang}.json`), 'utf8'));
  const untranslated = findUntranslated(en, target);
  result[lang] = untranslated;
});

fs.writeFileSync(path.join(__dirname, 'untranslated-keys.json'), JSON.stringify(result, null, 2));

console.log('✅ Extracted untranslated keys to scripts/untranslated-keys.json');
console.log(`   ES: ${Object.keys(result.es).length} keys`);
console.log(`   DE: ${Object.keys(result.de).length} keys`);
console.log(`   PT: ${Object.keys(result.pt).length} keys`);
