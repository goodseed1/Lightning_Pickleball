#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'));
const pt = JSON.parse(fs.readFileSync(path.join(localesPath, 'pt.json'), 'utf8'));

function countKeys(obj, enObj, ptObj, prefix = '') {
  let count = 0;
  let untranslated = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const enChild = enObj?.[key] || {};
      const ptChild = ptObj?.[key] || {};
      const result = countKeys(obj[key], enChild, ptChild, fullKey);
      count += result.count;
      untranslated = untranslated.concat(result.untranslated);
    } else {
      count++;
      const enValue = enObj?.[key];
      const ptValue = ptObj?.[key];
      if (enValue && enValue === ptValue) {
        untranslated.push(fullKey);
      }
    }
  }

  return { count, untranslated };
}

const result = countKeys(en, en, pt);

console.log('📊 Translation Progress:');
console.log(`   Total keys in en.json: ${result.count}`);
console.log(`   Untranslated keys: ${result.untranslated.length}`);
console.log(`   Translated: ${result.count - result.untranslated.length}`);
console.log(
  `   Progress: ${(((result.count - result.untranslated.length) / result.count) * 100).toFixed(1)}%`
);

// Show top untranslated sections
const sections = {};
result.untranslated.forEach(key => {
  const section = key.split('.')[0];
  sections[section] = (sections[section] || 0) + 1;
});

console.log('\n🎯 Top sections still needing translation:');
Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([section, count]) => {
    console.log(`   - ${section}: ${count} keys`);
  });
