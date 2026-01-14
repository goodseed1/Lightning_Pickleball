#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(localesPath, 'zh.json'), 'utf8'));

function findUntranslated(enObj, targetObj, prefix = '') {
  let untranslated = [];

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      const targetChild = targetObj?.[key] || {};
      untranslated = untranslated.concat(findUntranslated(enObj[key], targetChild, fullKey));
    } else {
      const enValue = enObj[key];
      const targetValue = targetObj?.[key];
      // Check if target equals 'en' or if target equals English value
      if (targetValue === 'en' || targetValue === enValue) {
        untranslated.push({ key: fullKey, value: enValue });
      }
    }
  }

  return untranslated;
}

console.log('🔍 Analyzing Chinese (zh) remaining translations...\n');

const untranslated = findUntranslated(en, zh);
console.log(`📊 Chinese (zh.json):`);
console.log(`   Total untranslated: ${untranslated.length}`);

if (untranslated.length > 0) {
  // Save to file for processing
  const outputPath = path.join(__dirname, `untranslated-zh.json`);
  fs.writeFileSync(outputPath, JSON.stringify(untranslated, null, 2));
  console.log(`   ✅ Saved to: untranslated-zh.json`);

  // Show top sections
  const sections = {};
  untranslated.forEach(item => {
    const section = item.key.split('.')[0];
    sections[section] = (sections[section] || 0) + 1;
  });

  console.log('\n   📋 Top sections needing translation:');
  Object.entries(sections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([section, count]) => {
      console.log(`      - ${section}: ${count} keys`);
    });
}
