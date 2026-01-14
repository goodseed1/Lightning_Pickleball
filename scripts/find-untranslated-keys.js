#!/usr/bin/env node

/**
 * Find all keys where French === English (untranslated)
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

// Load locale files
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

/**
 * Recursively find keys where fr === en
 */
function findUntranslatedKeys(enObj, frObj, currentPath = '') {
  const untranslated = [];

  for (const key in enObj) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      // Recurse into nested objects
      untranslated.push(...findUntranslatedKeys(enValue, frValue || {}, newPath));
    } else {
      // Compare leaf values
      if (frValue === undefined || frValue === enValue) {
        untranslated.push({
          key: newPath,
          enValue: enValue,
          frValue: frValue,
        });
      }
    }
  }

  return untranslated;
}

// Find all untranslated keys
const untranslated = findUntranslatedKeys(en, fr);

console.log('🔍 Untranslated Keys (where fr === en or missing):\n');
console.log(`Total: ${untranslated.length} keys\n`);

// Group by top-level section
const bySection = {};
untranslated.forEach(item => {
  const section = item.key.split('.')[0];
  if (!bySection[section]) bySection[section] = [];
  bySection[section].push(item);
});

// Print by section
for (const section in bySection) {
  console.log(`\n📦 ${section} (${bySection[section].length} keys):`);
  bySection[section].forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.key}`);
    console.log(`     EN: "${item.enValue}"`);
    if (item.frValue) console.log(`     FR: "${item.frValue}" (same as EN)`);
    else console.log(`     FR: (missing)`);
  });
}

console.log(`\n\n📊 Summary by section:`);
for (const section in bySection) {
  console.log(`  ${section}: ${bySection[section].length} keys`);
}

console.log(`\n🎯 Total untranslated: ${untranslated.length}`);
