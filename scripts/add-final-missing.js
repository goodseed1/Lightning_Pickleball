#!/usr/bin/env node
/**
 * Add the final 6 missing German translations
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Ensure meetupDetail.participants exists
if (!deJson.meetupDetail) deJson.meetupDetail = {};
if (!deJson.meetupDetail.participants) deJson.meetupDetail.participants = {};
deJson.meetupDetail.participants.title = 'Teilnehmer';

// Ensure matchRequest.message exists
if (!deJson.matchRequest) deJson.matchRequest = {};
if (!deJson.matchRequest.message) deJson.matchRequest.message = {};
deJson.matchRequest.message.title = 'Nachricht (Optional)';
deJson.matchRequest.message.label = 'Matchanfrage-Nachricht';
deJson.matchRequest.message.placeholder =
  'Schreiben Sie eine Begrüßung oder Ihre Erwartungen für das Match';

// Ensure performanceDashboard.insights exists
if (!deJson.performanceDashboard) deJson.performanceDashboard = {};
if (!deJson.performanceDashboard.insights) deJson.performanceDashboard.insights = {};
deJson.performanceDashboard.insights.title = 'Leistungseinblicke';
deJson.performanceDashboard.insights.recommendations = 'Empfehlungen:';

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Added final 6 missing German translations');
console.log('   - meetupDetail.participants.title');
console.log('   - matchRequest.message.* (3 keys)');
console.log('   - performanceDashboard.insights.* (2 keys)');
console.log('📝 File updated: src/locales/de.json\n');
