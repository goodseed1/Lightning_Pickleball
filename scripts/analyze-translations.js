#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const LANGUAGES = ['es', 'de', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

// Read English (source)
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

function countUntranslated(enObj, targetObj, path = '') {
  let untranslated = 0;
  let total = 0;
  const untranslatedKeys = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const result = countUntranslated(enObj[key], targetObj?.[key] || {}, currentPath);
      untranslated += result.untranslated;
      total += result.total;
      untranslatedKeys.push(...result.untranslatedKeys);
    } else {
      total++;
      if (!targetObj || targetObj[key] === enObj[key]) {
        untranslated++;
        untranslatedKeys.push(currentPath);
      }
    }
  }

  return { untranslated, total, untranslatedKeys };
}

console.log('=== Translation Analysis ===\n');

LANGUAGES.forEach(lang => {
  const targetFile = path.join(LOCALES_DIR, `${lang}.json`);
  const target = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

  const result = countUntranslated(en, target);

  console.log(
    `${lang.toUpperCase()}: ${result.untranslated} untranslated out of ${result.total} total keys (${((result.untranslated / result.total) * 100).toFixed(1)}%)`
  );

  // Show first 10 untranslated keys as examples
  if (result.untranslatedKeys.length > 0) {
    console.log(`  First 10 untranslated keys:`);
    result.untranslatedKeys.slice(0, 10).forEach(key => {
      console.log(`    - ${key}`);
    });
    console.log('');
  }
});
