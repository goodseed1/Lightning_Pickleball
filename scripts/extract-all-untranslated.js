#!/usr/bin/env node

/**
 * Extract ALL untranslated English values to create a comprehensive translation file
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Find all untranslated values
const untranslatedValues = new Set();

function findUntranslated(enObj, frObj) {
  for (const key in enObj) {
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      findUntranslated(enValue, frValue || {});
    } else {
      if (frValue === undefined || frValue === enValue) {
        untranslatedValues.add(enValue);
      }
    }
  }
}

findUntranslated(en, fr);

// Output unique values
console.log(`Found ${untranslatedValues.size} unique untranslated English values:\n`);

const sorted = Array.from(untranslatedValues).sort();
sorted.forEach((value, i) => {
  console.log(`${i + 1}. "${value}"`);
});

console.log(`\n\nTotal: ${untranslatedValues.size} unique values need translation`);

// Save to file for manual review
fs.writeFileSync('/tmp/untranslated-values.txt', sorted.join('\n'), 'utf8');

console.log('\n📄 Saved to: /tmp/untranslated-values.txt');
