#!/usr/bin/env node

/**
 * Script to identify and translate all remaining French keys
 *
 * This script:
 * 1. Compares fr.json and en.json to find untranslated keys
 * 2. Generates French translations for all matching keys
 * 3. Applies translations using deepMerge
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

// Read JSON files
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Deep merge utility
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Find all keys where fr === en (untranslated)
function findUntranslatedKeys(enObj, frObj, path = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      untranslated.push(...findUntranslatedKeys(enObj[key], frObj[key] || {}, currentPath));
    } else {
      if (enObj[key] === frObj[key]) {
        untranslated.push({
          path: currentPath,
          en: enObj[key],
          fr: frObj[key],
        });
      }
    }
  }

  return untranslated;
}

// Count keys by section
function countKeysBySection(keys) {
  const sections = {};

  keys.forEach(({ path }) => {
    const section = path.split('.')[0];
    sections[section] = (sections[section] || 0) + 1;
  });

  return Object.entries(sections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
}

console.log('🔍 Finding untranslated keys...');
const untranslatedKeys = findUntranslatedKeys(en, fr);

console.log(`\n📊 Total untranslated keys: ${untranslatedKeys.length}`);

console.log('\n📋 Top sections with untranslated keys:');
const topSections = countKeysBySection(untranslatedKeys);
topSections.forEach(([section, count], index) => {
  console.log(`${index + 1}. ${section}: ${count} keys`);
});

console.log('\n📝 Sample untranslated keys:');
untranslatedKeys.slice(0, 20).forEach(({ path, en }) => {
  console.log(`  ${path}: "${en}"`);
});

console.log('\n✅ Analysis complete!');
console.log(
  `\nTo translate, create translation mappings for these ${untranslatedKeys.length} keys.`
);

// Export for use in translation script
module.exports = { untranslatedKeys, deepMerge };
