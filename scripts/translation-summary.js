#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const ptPath = path.join(__dirname, '../src/locales/pt.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function findUntranslated(enObj, ptObj) {
  let count = 0;
  for (const key in enObj) {
    const enValue = enObj[key];
    const ptValue = ptObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      count += findUntranslated(enValue, ptValue || {});
    } else if (ptValue === enValue || ptValue === undefined) {
      count++;
    }
  }
  return count;
}

const enTotal = countKeys(en);
const ptTotal = countKeys(pt);
const untranslated = findUntranslated(en, pt);
const translated = enTotal - untranslated;
const percentage = ((translated / enTotal) * 100).toFixed(2);

console.log('\n' + '='.repeat(60));
console.log('BRAZILIAN PORTUGUESE TRANSLATION SUMMARY');
console.log('='.repeat(60));
console.log(`English keys:           ${enTotal}`);
console.log(`Portuguese keys:        ${ptTotal}`);
console.log(`Translated:             ${translated} keys`);
console.log(`Untranslated:           ${untranslated} keys`);
console.log(`Translation coverage:   ${percentage}%`);
console.log('='.repeat(60));

if (untranslated > 0) {
  console.log('\n⚠️  Some keys still need manual review and translation.');
} else {
  console.log('\n✅ All keys have been translated!');
}
console.log('\n');
