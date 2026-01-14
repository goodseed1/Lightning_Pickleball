#!/usr/bin/env node

/**
 * Verify Spanish translations - fresh reload from disk
 */

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const esPath = path.join(__dirname, '../src/locales/es.json');

// Fresh reload from disk
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

function findUntranslated(enObj, esObj, prefix = '') {
  const untranslated = [];

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const enValue = enObj[key];
    const esValue = esObj[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      // Recurse
      untranslated.push(...findUntranslated(enValue, esValue || {}, fullKey));
    } else {
      // Compare values
      if (enValue === esValue && typeof enValue === 'string') {
        untranslated.push({
          key: fullKey,
          value: enValue,
        });
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, es);

if (untranslated.length === 0) {
  console.log('\n✅ 100% COMPLETE! No untranslated keys found.\n');
  console.log('   All Spanish translations have been applied successfully! 🎉\n');
} else {
  console.log(`\n⚠️  Found ${untranslated.length} untranslated keys (where es === en):\n`);
  untranslated.forEach(({ key, value }) => {
    console.log(`  ${key}: "${value}"`);
  });
  console.log(`\n📊 Total: ${untranslated.length} keys still need translation\n`);
}
