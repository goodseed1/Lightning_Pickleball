#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'));

function countKeys(obj, compareObj, prefix = '') {
  let count = 0;
  let untranslated = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const compareChild = compareObj?.[key] || {};
      const result = countKeys(obj[key], compareChild, fullKey);
      count += result.count;
      untranslated = untranslated.concat(result.untranslated);
    } else {
      count++;
      const compareValue = compareObj?.[key];
      if (obj[key] === compareValue) {
        untranslated.push(fullKey);
      }
    }
  }

  return { count, untranslated };
}

['es', 'de', 'pt'].forEach(lang => {
  const target = JSON.parse(fs.readFileSync(path.join(localesPath, `${lang}.json`), 'utf8'));
  const result = countKeys(en, target);
  console.log(`\n📊 ${lang.toUpperCase()} Translation Progress:`);
  console.log(`   Total keys: ${result.count}`);
  console.log(`   Untranslated: ${result.untranslated.length}`);
  console.log(
    `   Progress: ${(((result.count - result.untranslated.length) / result.count) * 100).toFixed(1)}%`
  );

  const sections = {};
  result.untranslated.forEach(key => {
    const section = key.split('.')[0];
    sections[section] = (sections[section] || 0) + 1;
  });

  console.log('   Top sections:');
  Object.entries(sections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([section, count]) => {
      console.log(`     - ${section}: ${count} keys`);
    });
});
