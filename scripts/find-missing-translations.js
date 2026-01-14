#!/usr/bin/env node
/**
 * Find missing translation keys by comparing target locales with en.json
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Read English (source) file
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Target locales to check
const targetLocales = ['es', 'de', 'pt'];

/**
 * Recursively get all keys from an object
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Check if a key exists in an object using dot notation
 */
function hasKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

console.log('🔍 Finding missing translation keys...\n');

// Get all keys from English file
const enKeys = getAllKeys(enData);
console.log(`📝 Total keys in en.json: ${enKeys.length}\n`);

// Check each target locale
targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingKeys = enKeys.filter(key => !hasKey(data, key));

    console.log(`\n${locale.toUpperCase()}: ${missingKeys.length} missing keys`);

    if (missingKeys.length > 0) {
      console.log('Missing keys:');
      missingKeys.forEach(key => console.log(`  - ${key}`));
    } else {
      console.log('✅ All keys present!');
    }
  } catch (error) {
    console.error(`❌ Error reading ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Analysis complete!');
