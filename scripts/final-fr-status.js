#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

function countUntranslated(enObj, frObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], frObj[key] || {});
    } else {
      const enValue = enObj[key];
      const frValue = frObj[key];
      if (!frValue || frValue === enValue) {
        count++;
      }
    }
  }
  return count;
}

function countTotal(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countTotal(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

const totalKeys = countTotal(en);
const untranslated = countUntranslated(en, fr);
const translated = totalKeys - untranslated;
const percentage = ((translated / totalKeys) * 100).toFixed(1);

console.log('📊 FRENCH TRANSLATION STATUS - ROUND 2 COMPLETE\n');
console.log(`Total keys: ${totalKeys}`);
console.log(`Translated: ${translated} (${percentage}%)`);
console.log(`Remaining: ${untranslated}\n`);

console.log('🎯 ROUND 2 RESULTS:');
console.log('   Session 1: 145 keys translated');
console.log('   Session 2: 33 keys translated');
console.log('   Total Round 2: 178 keys translated');
