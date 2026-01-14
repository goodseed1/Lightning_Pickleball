#!/usr/bin/env node
/**
 * Propagate memberPreLeagueStatus translations from en.json to other locales
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Check if leagues section exists and has the memberPreLeagueStatus
if (!enData.leagues) {
  console.error('❌ Error: leagues section not found in en.json');
  process.exit(1);
}

const memberPreLeagueStatus = enData.leagues.memberPreLeagueStatus;

if (!memberPreLeagueStatus) {
  console.error('❌ Error: leagues.memberPreLeagueStatus section not found in en.json');
  console.log('Available leagues keys:', Object.keys(enData.leagues));
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting memberPreLeagueStatus translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Ensure leagues section exists
    if (!data.leagues) {
      data.leagues = {};
    }

    // Add or update the section
    data.leagues.memberPreLeagueStatus = memberPreLeagueStatus;

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Translation propagation complete!');
