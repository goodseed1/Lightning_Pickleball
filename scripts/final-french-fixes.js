#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'src', 'locales', 'fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Fix remaining untranslated items
if (fr.eventCard?.labels) {
  fr.eventCard.labels.participants = '{{current}}/{{max}}'; // This is a template, keep as is
}

if (fr.eventCard?.matchTypeSelector) {
  fr.eventCard.matchTypeSelector.doubles = 'Doubles';
}

if (fr.leagues?.admin) {
  fr.leagues.admin.maxParticipants = 'Max';
}

// Save
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');

console.log('✅ Applied final French translation fixes!');
console.log('   - eventCard.matchTypeSelector.doubles: "Doubles"');
console.log('   - leagues.admin.maxParticipants: "Max" (unchanged - same in all languages)');
console.log('   - eventCard.labels.participants: Template preserved');
