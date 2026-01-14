#!/usr/bin/env node
/**
 * Fix performanceDashboard.insights from string to object
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');
let deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Check current type
console.log(
  '\nCurrent performanceDashboard.insights type:',
  typeof deJson.performanceDashboard.insights
);
console.log('Current value:', deJson.performanceDashboard.insights);

// Convert insights from string to object
if (typeof deJson.performanceDashboard.insights === 'string') {
  const oldValue = deJson.performanceDashboard.insights;
  deJson.performanceDashboard.insights = {
    _oldStringValue: oldValue, // Preserve for reference
    title: 'Leistungseinblicke',
    recommendations: 'Empfehlungen:',
  };
  console.log('\n✅ Converted insights from string to object');
}

// Write back
fs.writeFileSync(deJsonPath, JSON.stringify(deJson, null, 2) + '\n', 'utf8');

console.log('📝 File updated: src/locales/de.json\n');
