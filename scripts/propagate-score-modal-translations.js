#!/usr/bin/env node
/**
 * Propagate score modal translations (recordScore + scoreConfirmation) from en.json to other locales
 */

const fs = require('fs');
const path = require('path');

// Locale files directory
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Source locale (English)
const enPath = path.join(LOCALES_DIR, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Extract the sections to propagate
const recordScore = enData.recordScore;
const scoreConfirmation = enData.scoreConfirmation;

if (!recordScore) {
  console.error('❌ Error: recordScore section not found in en.json');
  process.exit(1);
}

if (!scoreConfirmation) {
  console.error('❌ Error: scoreConfirmation section not found in en.json');
  process.exit(1);
}

// Target locales (all except ko and en)
const targetLocales = ['de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

console.log('🚀 Starting score modal translation propagation...\n');

targetLocales.forEach(locale => {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);

  try {
    // Read the locale file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update recordScore section - preserve existing translations, add new keys from English
    if (!data.recordScore) {
      // If recordScore doesn't exist, copy entire section from English
      data.recordScore = recordScore;
    } else {
      // Merge new keys from English into existing recordScore
      data.recordScore = {
        ...recordScore,
        ...data.recordScore,
        // Force update for specific new keys
        submitNoteLeague: recordScore.submitNoteLeague,
        submitNoteLightning: recordScore.submitNoteLightning,
        submitNoteTournament: recordScore.submitNoteTournament,
        specialCases: recordScore.specialCases,
        specialCasesDescription: recordScore.specialCasesDescription,
        retired: recordScore.retired,
        retiredAtLabel: recordScore.retiredAtLabel,
        walkover: recordScore.walkover,
        selectWinner: recordScore.selectWinner,
        selectWinnerRequired: recordScore.selectWinnerRequired,
        selectPlayerWhoDidNotRetire: recordScore.selectPlayerWhoDidNotRetire,
        selectPlayerWhoShowedUp: recordScore.selectPlayerWhoShowedUp,
        pleaseSelectWinner: recordScore.pleaseSelectWinner,
      };
    }

    // Add or replace the scoreConfirmation section completely
    data.scoreConfirmation = scoreConfirmation;

    // Write back with formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    console.log(`✅ Updated ${locale}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${locale}.json:`, error.message);
  }
});

console.log('\n✨ Score modal translation propagation complete!');
console.log('📝 Note: Translations are in English. Please translate them to respective languages.');
