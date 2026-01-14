#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const dePath = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Find untranslated keys
function findUntranslated(enObj, deObj, path = '', results = []) {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      findUntranslated(enObj[key], deObj[key] || {}, currentPath, results);
    } else {
      // Check if untranslated (de === en or missing)
      const deValue = deObj[key];
      const enValue = enObj[key];

      if (deValue === enValue || deValue === undefined) {
        results.push({
          path: currentPath,
          en: enValue,
          de: deValue || '(missing)',
        });
      }
    }
  }

  return results;
}

const untranslated = findUntranslated(en, de);

// Group by top-level section
const bySection = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySection[section]) {
    bySection[section] = [];
  }
  bySection[section].push(item);
});

// Show top 3 sections with examples
const sorted = Object.entries(bySection)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5);

console.log('\n📋 TOP 5 SECTIONS WITH UNTRANSLATED KEYS:\n');

sorted.forEach(([section, items]) => {
  console.log(`\n🔸 ${section} (${items.length} keys)`);
  console.log('─'.repeat(60));

  // Show first 10 examples
  items.slice(0, 10).forEach(item => {
    console.log(`   ${item.path}`);
    console.log(`   EN: "${item.en}"`);
    console.log(`   DE: ${item.de === '(missing)' ? '(missing)' : '"' + item.de + '"'}`);
    console.log('');
  });

  if (items.length > 10) {
    console.log(`   ... and ${items.length - 10} more\n`);
  }
});

console.log(`\n📊 Total untranslated: ${untranslated.length}\n`);
