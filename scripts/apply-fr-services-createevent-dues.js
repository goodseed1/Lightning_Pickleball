#!/usr/bin/env node

/**
 * Apply French translations for services, createEvent, and duesManagement sections
 *
 * This script applies 232 French translations using deepMerge
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const frPath = path.join(localesDir, 'fr.json');
const patchPath = path.join(__dirname, 'french-translations-patch.json');

// Read current French translations and patch
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));

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

console.log('🔄 Applying French translations for services, createEvent, and duesManagement...');

// Apply translations using deepMerge
const updatedFr = deepMerge(fr, patch);

// Write updated translations
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('✅ French translations applied successfully!');
console.log('\n📊 Summary:');
console.log(`   - services: ${countKeys(patch.services)} translations`);
console.log(`   - createEvent: ${countKeys(patch.createEvent)} translations`);
console.log(`   - duesManagement: ${countKeys(patch.duesManagement)} translations`);
console.log(`   - Updated: ${frPath}`);

function countKeys(obj, count = 0) {
  if (!obj) return 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count = countKeys(obj[key], count);
    } else {
      count++;
    }
  }
  return count;
}
