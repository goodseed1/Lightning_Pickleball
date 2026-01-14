#!/usr/bin/env node
/**
 * Add ALL 36 missing German translation keys
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Helper function
function setByPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, k) => {
    if (!o[k]) o[k] = {};
    return o[k];
  }, obj);
  target[lastKey] = value;
}

// All missing translations in formal German (Sie)
const missingTranslations = {
  // Profile settings
  'profile.settings.notifications': 'Benachrichtigungseinstellungen',
  'profile.settings.profileSettings': 'Profileinstellungen',
  'profile.settings.appSettings': 'App-Einstellungen',

  // Edit profile - Gender
  'editProfile.gender.label': 'Geschlecht',
  'editProfile.gender.male': 'Männlich',
  'editProfile.gender.female': 'Weiblich',
  'editProfile.gender.notSpecified': 'Nicht angegeben',
  'editProfile.gender.hint':
    '💡 Das Geschlecht wird beim Onboarding festgelegt und kann nicht geändert werden.',

  // Edit profile - Skill level
  'editProfile.skillLevel.label': 'NTRP-Spielstärke',
  'editProfile.skillLevel.beginner': 'Anfänger',
  'editProfile.skillLevel.intermediate': 'Fortgeschritten',
  'editProfile.skillLevel.advanced': 'Erfahren',
  'editProfile.skillLevel.expert': 'Experte',
  'editProfile.skillLevel.hint':
    'Nach Ihrem ersten Match wird Ihre Spielstärke automatisch basierend auf Ihren Matchergebnissen berechnet.',

  // Edit profile - Playing style
  'editProfile.playingStyle.label': 'Spielstil',
  'editProfile.playingStyle.aggressive': 'Aggressiv',
  'editProfile.playingStyle.defensive': 'Defensiv',
  'editProfile.playingStyle.allCourt': 'Allround',
  'editProfile.playingStyle.baseline': 'Grundlinie',
  'editProfile.playingStyle.netPlayer': 'Netzspieler',

  // Hosted event card
  'hostedEventCard.partner': 'Partner: ',

  // Dues management
  'duesManagement.settings.venmo': 'Venmo',

  // Meetup detail
  'meetupDetail.participants.title': 'Teilnehmer',

  // Match request
  'matchRequest.message.title': 'Nachricht (Optional)',
  'matchRequest.message.label': 'Matchanfrage-Nachricht',
  'matchRequest.message.placeholder':
    'Schreiben Sie eine Begrüßung oder Ihre Erwartungen für das Match',

  // League detail
  'leagueDetail.standings.player': 'Spieler',
  'leagueDetail.standings.matches': 'Matches',

  // Types (these are objects, not strings - skip for now)
  'types.match.matchTypes': '[object Object]',
  'types.match.matchStatus': '[object Object]',
  'types.match.matchFormats': '[object Object]',
  'types.match.validation': '[object Object]',
  'types.tournament.validation': '[object Object]',
  'types.tournament.eventTypes': '[object Object]',

  // Performance dashboard
  'performanceDashboard.insights.title': 'Leistungseinblicke',
  'performanceDashboard.insights.recommendations': 'Empfehlungen:',
};

// Apply all translations
let count = 0;
for (const [path, value] of Object.entries(missingTranslations)) {
  // Skip [object Object] entries
  if (value === '[object Object]') {
    console.log(`⚠️  Skipping ${path} (object type, not string)`);
    continue;
  }
  setByPath(deJson, path, value);
  count++;
}

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log(`\n✅ Added ${count} missing German translations`);
console.log(`⚠️  Skipped 6 object-type entries (not translatable strings)`);
console.log(`📝 File updated: src/locales/de.json\n`);
