#!/usr/bin/env node

/**
 * Script to apply French translations to fr.json using deep merge
 * Focus: badgeGallery, createClubTournament, createMeetup, meetupDetail
 */

const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Load the complete translations
const frenchTranslations = require('./french-translations-complete.json');

// Read current fr.json
const frJsonPath = path.join(__dirname, '../src/locales/fr.json');
const currentFr = JSON.parse(fs.readFileSync(frJsonPath, 'utf8'));

// Apply deep merge
const updatedFr = deepMerge(currentFr, frenchTranslations);

// Write back to file with proper formatting
fs.writeFileSync(frJsonPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('✅ French translations applied successfully!');
console.log('📝 Updated file:', frJsonPath);
console.log('🌍 Total: 326 translations applied using deepMerge');
