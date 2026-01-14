#!/usr/bin/env node
/**
 * Add missing tournament translation keys
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Add missing validation keys
deJson.types.tournament.validation.mensDoublesMaleOnly =
  'Herrendoppel ist nur für männliche Spieler.';
deJson.types.tournament.validation.womensDoublesFemaleOnly =
  'Damendoppel ist nur für weibliche Spieler.';
deJson.types.tournament.validation.mixedDoublesRequirement =
  'Mixed Doppel erfordert einen männlichen und einen weiblichen Spieler.';

// Update eventTypes with all specific types
deJson.types.tournament.eventTypes = {
  singles: 'Einzel',
  doubles: 'Doppel',
  mixed: 'Mixed',
  mens_singles: 'Herreneinzel',
  womens_singles: 'Dameneinzel',
  mens_doubles: 'Herrendoppel',
  womens_doubles: 'Damendoppel',
  mixed_doubles: 'Mixed Doppel',
};

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Added missing tournament translations');
console.log('   - validation: 3 new keys');
console.log('   - eventTypes: 5 specific types');
console.log('📝 File updated: src/locales/de.json\n');
