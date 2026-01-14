#!/usr/bin/env node
/**
 * Propagate Club screens translations from en.json to other locales
 * Screens: ClubPoliciesScreen, PolicyEditScreen, FindClubScreen, ClubDetailScreen
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the sections to propagate
const clubPoliciesScreen = enData.clubPoliciesScreen;
const policyEditScreen = enData.policyEditScreen;
const findClubScreen = enData.findClubScreen;
const clubDetailScreen = enData.clubDetailScreen;

if (!clubPoliciesScreen || !policyEditScreen || !findClubScreen || !clubDetailScreen) {
  console.error('❌ Error: One or more Club screen sections not found in en.json');
  console.error('Missing sections:', {
    clubPoliciesScreen: !!clubPoliciesScreen,
    policyEditScreen: !!policyEditScreen,
    findClubScreen: !!findClubScreen,
    clubDetailScreen: !!clubDetailScreen,
  });
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting Club screens translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add or update the sections
    data.clubPoliciesScreen = clubPoliciesScreen;
    data.policyEditScreen = policyEditScreen;
    data.findClubScreen = findClubScreen;
    data.clubDetailScreen = clubDetailScreen;

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Club screens translation propagation complete!');
