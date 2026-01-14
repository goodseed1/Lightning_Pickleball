#!/usr/bin/env node
/**
 * Rebuild de.json structure to exactly match en.json structure
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Fix profile.settings (was string in old structure)
if (typeof deJson.profile.settings === 'string') {
  const oldValue = deJson.profile.settings;
  deJson.profile.settings = {
    title: oldValue, // Preserve old string value
    notifications: 'Benachrichtigungseinstellungen',
    profileSettings: 'Profileinstellungen',
    appSettings: 'App-Einstellungen',
  };
}

// Fix meetupDetail.participants (was string, should be object)
if (!deJson.meetupDetail) deJson.meetupDetail = {};
if (typeof deJson.meetupDetail.participants === 'string') {
  deJson.meetupDetail.participants = {
    title: 'Teilnehmer',
  };
}

// Add matchRequest if missing
if (!deJson.matchRequest) deJson.matchRequest = {};
if (!deJson.matchRequest.message) {
  deJson.matchRequest.message = {
    title: 'Nachricht (Optional)',
    label: 'Matchanfrage-Nachricht',
    placeholder: 'Schreiben Sie eine Begrüßung oder Ihre Erwartungen für das Match',
  };
}

// Add leagueDetail.standings if missing
if (!deJson.leagueDetail) deJson.leagueDetail = {};
if (!deJson.leagueDetail.standings) {
  deJson.leagueDetail.standings = {
    player: 'Spieler',
    matches: 'Matches',
  };
}

// Add performanceDashboard if missing
if (!deJson.performanceDashboard) deJson.performanceDashboard = {};
if (!deJson.performanceDashboard.insights) {
  deJson.performanceDashboard.insights = {
    title: 'Leistungseinblicke',
    recommendations: 'Empfehlungen:',
  };
}

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Rebuilt de.json structure to match en.json');
console.log('📝 File updated: src/locales/de.json\n');
