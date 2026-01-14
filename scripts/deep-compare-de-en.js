#!/usr/bin/env node
/**
 * Deep comparison: Find ALL keys where de.json value === en.json value
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
const enJsonPath = path.join(__dirname, '../src/locales/en.json');

const deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

function deepCompare(deObj, enObj, prefix = '', results = []) {
  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (!deObj || deObj[key] === undefined) {
      results.push({ key: fullKey, en: enObj[key], de: 'MISSING', status: 'MISSING' });
      continue;
    }

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      deepCompare(deObj[key], enObj[key], fullKey, results);
    } else {
      // Leaf node - compare values
      if (deObj[key] === enObj[key]) {
        results.push({
          key: fullKey,
          en: enObj[key],
          de: deObj[key],
          status: 'IDENTICAL',
        });
      }
    }
  }

  return results;
}

const differences = deepCompare(deJson, enJson);

console.log(`\n📊 DEEP COMPARISON RESULTS:\n`);
console.log(`Total keys where de === en: ${differences.length}\n`);

// Categorize
const universal = [];
const shouldTranslate = [];

const universalPatterns = [
  /^OK$/i,
  /^Chat$/i,
  /^Manager$/i,
  /^Online$/i,
  /^Feed$/i,
  /^Info$/i,
  /^Status$/i,
  /^Logo$/i,
  /^Bank$/i,
  /^Details$/i,
  /^Team \{\{/i,
  /^Champion/i,
  /^Playoff/i,
  /^Format/i,
  /^Mixed$/i,
  /^Walkover$/i,
  /^Tiebreak/i,
  /^Global$/i,
  /^Partner$/i,
  /^Match$/i,
  /^Volley$/i,
  /^Mental$/i,
  /^Brunch$/i,
  /^Administrator$/i,
  /^Wind$/i,
  /^Normal$/i,
  /^Max\s/i,
  /^Max$/i,
  /^Name$/i,
  /^Optional$/i,
  /한국어|English|中文|日本語|Español|Français/,
  /Kim|Lee|Park|PickleballUser/,
  /\{\{.*\}\}/, // Templates
  /^\d/, // Starts with number
  /^🥇/, // Emoji
  /\skm$/,
  /\smi$/,
  /^km$/,
  /^mi$/,
  /^Lightning/,
  /^Blitz-/,
];

differences.forEach(item => {
  const isUniversal = universalPatterns.some(pattern => pattern.test(item.en));

  if (isUniversal) {
    universal.push(item);
  } else {
    shouldTranslate.push(item);
  }
});

console.log(`✅ Universal/Acceptable terms: ${universal.length}`);
console.log(`⚠️  Should be translated: ${shouldTranslate.length}\n`);

if (shouldTranslate.length > 0) {
  console.log('⚠️  THESE SHOULD BE TRANSLATED:\n');
  shouldTranslate.forEach((item, i) => {
    console.log(`${i + 1}. ${item.key}`);
    console.log(`   EN: "${item.en}"`);
    console.log(`   DE: "${item.de}"\n`);
  });
} else {
  console.log('✅ All identical values are acceptable international terms!');
}

console.log(`\n🎯 FINAL VERDICT:`);
if (shouldTranslate.length === 0) {
  console.log(`   ✅ German translation is 100% COMPLETE!`);
  console.log(`   📝 ${universal.length} terms are acceptable international standards\n`);
} else {
  console.log(`   ⚠️  ${shouldTranslate.length} terms still need translation\n`);
}
