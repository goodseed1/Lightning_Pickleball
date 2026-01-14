#!/usr/bin/env node
/**
 * Convert types.tournament from string to object
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

console.log('\nCurrent types.tournament type:', typeof deJson.types.tournament);
console.log('Current value:', deJson.types.tournament);

// Convert types.tournament from string to object
if (typeof deJson.types.tournament === 'string') {
  const oldValue = deJson.types.tournament;

  deJson.types.tournament = {
    _oldStringValue: oldValue, // Preserve for reference
    validation: {
      singlesNoPartner: 'Einzelturniere erfordern keinen Partner.',
      mensSinglesMaleOnly: 'Herreneinzel ist nur für männliche Spieler.',
      womensSinglesFemaleOnly: 'Dameneinzel ist nur für weibliche Spieler.',
      doublesPartnerRequired: 'Doppelturniere erfordern einen Partner.',
    },
    eventTypes: {
      singles: 'Einzel',
      doubles: 'Doppel',
      mixed: 'Mixed',
    },
  };
  console.log('\n✅ Converted types.tournament from string to object');
}

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('📝 File updated: src/locales/de.json\n');
