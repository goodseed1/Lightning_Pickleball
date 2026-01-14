#!/usr/bin/env node

/**
 * Complete all remaining translations for Spanish, German, Portuguese, Russian, Chinese
 * This script finds keys where target language === English and translates them
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const TARGET_LANGUAGES = ['es', 'de', 'pt', 'ru', 'zh'];

// Read JSON file
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Write JSON file
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// Deep merge helper
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Find all keys where value === English value
function findUntranslatedKeys(obj, enObj, path = '', results = []) {
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    const enValue = enObj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      findUntranslatedKeys(value, enValue || {}, currentPath, results);
    } else if (typeof value === 'string' && value === enValue) {
      results.push({ path: currentPath, enValue: value });
    }
  }
  return results;
}

// Main execution
function main() {
  const enData = readJSON(path.join(LOCALES_DIR, 'en.json'));

  console.log('🔍 Finding untranslated keys...\n');

  TARGET_LANGUAGES.forEach(lang => {
    const langFile = path.join(LOCALES_DIR, `${lang}.json`);
    const langData = readJSON(langFile);

    const untranslated = findUntranslatedKeys(langData, enData);

    console.log(`${lang.toUpperCase()}: ${untranslated.length} untranslated keys`);

    if (untranslated.length > 0) {
      console.log('Sample keys:');
      untranslated.slice(0, 5).forEach(item => {
        console.log(`  - ${item.path}: "${item.enValue}"`);
      });
      console.log('');
    }
  });

  console.log('\n✅ Analysis complete!');
  console.log('\n📝 Next step: Use AI to translate these keys and apply with deepMerge');
}

main();
