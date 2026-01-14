#!/usr/bin/env node
/**
 * Convert string values to objects where en.json has objects
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Convert matchRequest.message from string to object
if (typeof deJson.matchRequest.message === 'string') {
  const oldValue = deJson.matchRequest.message;
  deJson.matchRequest.message = {
    _old: oldValue, // Preserve for reference
    title: 'Nachricht (Optional)',
    label: 'Matchanfrage-Nachricht',
    placeholder: 'Schreiben Sie eine Begrüßung oder Ihre Erwartungen für das Match',
  };
}

// Ensure performanceDashboard.insights exists as object
if (!deJson.performanceDashboard) deJson.performanceDashboard = {};
if (!deJson.performanceDashboard.insights) {
  deJson.performanceDashboard.insights = {
    title: 'Leistungseinblicke',
    recommendations: 'Empfehlungen:',
  };
}

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Converted string values to objects');
console.log('   - matchRequest.message: string → object (3 keys)');
console.log('   - performanceDashboard.insights: added object (2 keys)');
console.log('📝 File updated: src/locales/de.json\n');
