#!/usr/bin/env node
/**
 * Compare locale files to find missing or untranslated keys
 */

const fs = require('fs');
const path = require('path');

// Read JSON file
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Flatten nested object into dot-notation keys
function flattenObject(obj, prefix = '') {
  const flattened = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }

  return flattened;
}

// Check if a value appears to be English (heuristic)
function appearsEnglish(value, locale) {
  if (!value || typeof value !== 'string') return false;
  if (locale === 'en') return false; // English is expected in en.json

  // Common English words that shouldn't appear in other languages
  const englishWords = [
    'the',
    'and',
    'for',
    'with',
    'your',
    'you',
    'are',
    'have',
    'this',
    'that',
    'create',
    'new',
    'search',
    'view',
    'edit',
    'delete',
    'save',
    'cancel',
    'home',
    'members',
    'admin',
    'activities',
    'leagues',
    'tournaments',
    'announcements',
    'progress',
    'registration',
    'open',
    'completed',
    'participants',
    'events',
    'players',
    'clubs',
    'coaches',
    'services',
    'match',
    'meetup',
    'community',
    'tennis',
    'found',
    'nearby',
    'try',
  ];

  const lowerValue = value.toLowerCase();

  // Check if it contains common English words
  for (const word of englishWords) {
    if (
      lowerValue.includes(` ${word} `) ||
      lowerValue.startsWith(`${word} `) ||
      lowerValue.endsWith(` ${word}`) ||
      lowerValue === word
    ) {
      return true;
    }
  }

  return false;
}

// Priority sections to check
const prioritySections = [
  'clubOverview.tabs',
  'clubHome',
  'discover',
  'createNew',
  'members',
  'leagues',
  'tournaments',
];

// Main comparison function
function compareLocales() {
  const localesDir = path.join(__dirname, '../src/locales');
  const languages = ['es', 'ko', 'de', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

  // Read English as reference
  const enPath = path.join(localesDir, 'en.json');
  const enData = readJSON(enPath);
  if (!enData) return;

  const enFlat = flattenObject(enData);
  const enKeys = Object.keys(enFlat).sort();

  console.log(`\n${'='.repeat(80)}`);
  console.log('LOCALE FILES COMPARISON REPORT');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Total keys in en.json: ${enKeys.length}\n`);

  // Analyze each language
  for (const lang of languages) {
    const langPath = path.join(localesDir, `${lang}.json`);
    const langData = readJSON(langPath);
    if (!langData) continue;

    const langFlat = flattenObject(langData);
    const langKeys = Object.keys(langFlat);

    // Find missing keys
    const missingKeys = enKeys.filter(key => !(key in langFlat));

    // Find potentially untranslated keys (still in English)
    const untranslatedKeys = langKeys.filter(key => {
      if (!(key in enFlat)) return false;
      const langValue = langFlat[key];
      return appearsEnglish(langValue, lang);
    });

    // Filter for priority sections
    const priorityMissing = missingKeys.filter(key =>
      prioritySections.some(section => key.startsWith(section))
    );

    const priorityUntranslated = untranslatedKeys.filter(key =>
      prioritySections.some(section => key.startsWith(section))
    );

    // Report
    console.log(`${'─'.repeat(80)}`);
    console.log(`Language: ${lang.toUpperCase()}`);
    console.log(`${'─'.repeat(80)}`);
    console.log(`Total keys: ${langKeys.length}`);
    console.log(`Missing keys: ${missingKeys.length}`);
    console.log(`Potentially untranslated: ${untranslatedKeys.length}\n`);

    if (priorityMissing.length > 0) {
      console.log(`⚠️  Priority Missing Keys (${priorityMissing.length}):`);
      priorityMissing.slice(0, 30).forEach(key => {
        console.log(`   - ${key}: "${enFlat[key]}"`);
      });
      if (priorityMissing.length > 30) {
        console.log(`   ... and ${priorityMissing.length - 30} more`);
      }
      console.log();
    }

    if (priorityUntranslated.length > 0) {
      console.log(`⚠️  Priority Untranslated Keys (${priorityUntranslated.length}):`);
      priorityUntranslated.slice(0, 30).forEach(key => {
        console.log(`   - ${key}: "${langFlat[key]}"`);
      });
      if (priorityUntranslated.length > 30) {
        console.log(`   ... and ${priorityUntranslated.length - 30} more`);
      }
      console.log();
    }

    // Show all missing keys for priority sections in detail
    if (lang === 'es') {
      console.log(`\n📋 DETAILED REPORT FOR SPANISH (es.json):\n`);

      for (const section of prioritySections) {
        const sectionMissing = missingKeys.filter(k => k.startsWith(section));
        const sectionUntranslated = untranslatedKeys.filter(k => k.startsWith(section));

        if (sectionMissing.length > 0 || sectionUntranslated.length > 0) {
          console.log(`\n  Section: ${section}`);

          if (sectionMissing.length > 0) {
            console.log(`    Missing (${sectionMissing.length}):`);
            sectionMissing.forEach(key => {
              console.log(`      ${key}: "${enFlat[key]}"`);
            });
          }

          if (sectionUntranslated.length > 0) {
            console.log(`    Untranslated (${sectionUntranslated.length}):`);
            sectionUntranslated.forEach(key => {
              console.log(`      ${key}: "${langFlat[key]}"`);
            });
          }
        }
      }
    }

    console.log();
  }

  console.log(`${'='.repeat(80)}\n`);
}

// Run the comparison
compareLocales();
