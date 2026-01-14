#!/usr/bin/env node

/**
 * Count untranslated keys in it.json
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const IT_PATH = path.join(__dirname, '../src/locales/it.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const it = JSON.parse(fs.readFileSync(IT_PATH, 'utf8'));

function findUntranslated(enObj, itObj, prefix = '') {
  const untranslated = [];

  for (const key in enObj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (enObj[key] && typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      // Recurse into nested objects
      if (itObj[key]) {
        untranslated.push(...findUntranslated(enObj[key], itObj[key], fullKey));
      } else {
        // Entire section missing
        const sectionKeys = countKeys(enObj[key]);
        for (let i = 0; i < sectionKeys; i++) {
          untranslated.push(fullKey);
        }
      }
    } else {
      // Check if translation exists and is different from English
      if (!itObj[key] || itObj[key] === enObj[key]) {
        untranslated.push(fullKey);
      }
    }
  }

  return untranslated;
}

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function groupBySection(keys) {
  const sections = {};
  keys.forEach(key => {
    const section = key.split('.')[0];
    sections[section] = (sections[section] || 0) + 1;
  });
  return sections;
}

console.log('🔍 Analyzing Italian translations...\n');

const untranslated = findUntranslated(en, it);
const totalEnglish = countKeys(en);
const totalItalian = countKeys(it);

console.log(`Total English keys: ${totalEnglish}`);
console.log(`Total Italian keys: ${totalItalian}`);
console.log(`Untranslated keys: ${untranslated.length}`);
console.log(
  `Translation progress: ${(((totalEnglish - untranslated.length) / totalEnglish) * 100).toFixed(1)}%\n`
);

if (untranslated.length > 0) {
  console.log('Top sections needing translation:');
  const sections = groupBySection(untranslated);
  const sorted = Object.entries(sections).sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 10).forEach(([section, count]) => {
    console.log(`  ${section}: ${count} keys`);
  });
}
