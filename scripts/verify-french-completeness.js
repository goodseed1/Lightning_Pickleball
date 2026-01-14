#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const frPath = path.join(__dirname, '..', 'src', 'locales', 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

console.log('🔍 Verifying French translations for priority sections...\n');

const sections = [
  { name: 'eventCard.labels', path: ['eventCard', 'labels'] },
  { name: 'eventCard.buttons', path: ['eventCard', 'buttons'] },
  { name: 'eventCard.matchTypeSelector', path: ['eventCard', 'matchTypeSelector'] },
  { name: 'matchRequest.skillLevel', path: ['matchRequest', 'skillLevel'] },
  { name: 'matchRequest.alerts', path: ['matchRequest', 'alerts'] },
  { name: 'matchRequest.playerCard', path: ['matchRequest', 'playerCard'] },
  { name: 'leagues.admin', path: ['leagues', 'admin'] },
  { name: 'leagues.match.status', path: ['leagues', 'match', 'status'] },
  { name: 'eventParticipation.registration', path: ['eventParticipation', 'registration'] },
  { name: 'contexts.notification', path: ['contexts', 'notification'] },
  { name: 'contexts.location', path: ['contexts', 'location'] },
];

let allGood = true;

sections.forEach(section => {
  let enObj = en;
  let frObj = fr;

  for (const key of section.path) {
    enObj = enObj?.[key];
    frObj = frObj?.[key];
  }

  if (!frObj) {
    console.log(`❌ ${section.name}: MISSING`);
    allGood = false;
    return;
  }

  if (typeof frObj === 'string') {
    console.log(`✅ ${section.name}: ${frObj}`);
    return;
  }

  const enKeys = Object.keys(enObj || {});
  const frKeys = Object.keys(frObj || {});

  const missing = enKeys.filter(k => !frKeys.includes(k));
  const untranslated = enKeys.filter(k => enObj[k] === frObj[k]);

  if (missing.length > 0) {
    console.log(`❌ ${section.name}: Missing keys: ${missing.join(', ')}`);
    allGood = false;
  } else if (untranslated.length > 0) {
    console.log(`⚠️  ${section.name}: Untranslated (fr===en): ${untranslated.join(', ')}`);
    allGood = false;
  } else {
    console.log(`✅ ${section.name}: ${frKeys.length} items translated`);
  }
});

console.log(
  '\n' +
    (allGood ? '🎉 All priority sections fully translated!' : '⚠️  Some sections need attention')
);
