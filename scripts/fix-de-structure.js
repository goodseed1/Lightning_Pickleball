#!/usr/bin/env node
/**
 * Fix de.json structure to match en.json structure
 * Convert string values to objects where needed
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
const enJsonPath = path.join(__dirname, '../src/locales/en.json');

let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

// Fix profile.settings (was string, should be object)
deJson.profile.settings = {
  ...deJson.profile.settings,
  notifications: 'Benachrichtigungseinstellungen',
  profileSettings: 'Profileinstellungen',
  appSettings: 'App-Einstellungen',
};

// Add editProfile sections if they don't exist
if (!deJson.editProfile) {
  deJson.editProfile = {};
}

// Gender
deJson.editProfile.gender = {
  label: 'Geschlecht',
  male: 'Männlich',
  female: 'Weiblich',
  notSpecified: 'Nicht angegeben',
  hint: '💡 Das Geschlecht wird beim Onboarding festgelegt und kann nicht geändert werden.',
};

// Skill level
deJson.editProfile.skillLevel = {
  label: 'NTRP-Spielstärke',
  beginner: 'Anfänger',
  intermediate: 'Fortgeschritten',
  advanced: 'Erfahren',
  expert: 'Experte',
  hint: 'Nach Ihrem ersten Match wird Ihre Spielstärke automatisch basierend auf Ihren Matchergebnissen berechnet.',
};

// Playing style
deJson.editProfile.playingStyle = {
  label: 'Spielstil',
  aggressive: 'Aggressiv',
  defensive: 'Defensiv',
  allCourt: 'Allround',
  baseline: 'Grundlinie',
  netPlayer: 'Netzspieler',
};

// Meetup detail
if (!deJson.meetupDetail) {
  deJson.meetupDetail = {};
}
if (!deJson.meetupDetail.participants) {
  deJson.meetupDetail.participants = {};
}
deJson.meetupDetail.participants.title = 'Teilnehmer';

// Match request
if (!deJson.matchRequest) {
  deJson.matchRequest = {};
}
if (!deJson.matchRequest.message) {
  deJson.matchRequest.message = {};
}
deJson.matchRequest.message.title = 'Nachricht (Optional)';
deJson.matchRequest.message.label = 'Matchanfrage-Nachricht';
deJson.matchRequest.message.placeholder =
  'Schreiben Sie eine Begrüßung oder Ihre Erwartungen für das Match';

// League detail standings
if (!deJson.leagueDetail) {
  deJson.leagueDetail = {};
}
if (!deJson.leagueDetail.standings) {
  deJson.leagueDetail.standings = {};
}
deJson.leagueDetail.standings.player = 'Spieler';
deJson.leagueDetail.standings.matches = 'Matches';

// Performance dashboard
if (!deJson.performanceDashboard) {
  deJson.performanceDashboard = {};
}
if (!deJson.performanceDashboard.insights) {
  deJson.performanceDashboard.insights = {};
}
deJson.performanceDashboard.insights.title = 'Leistungseinblicke';
deJson.performanceDashboard.insights.recommendations = 'Empfehlungen:';

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Fixed de.json structure and added all missing translations');
console.log('📝 File updated: src/locales/de.json\n');
