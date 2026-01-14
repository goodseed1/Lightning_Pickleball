#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

function findUntranslated(en, fr, currentPath = '') {
  const untranslated = [];
  for (const key in en) {
    const keyPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      untranslated.push(...findUntranslated(en[key], fr[key] || {}, keyPath));
    } else if (fr[key] === en[key] || !fr[key]) {
      untranslated.push({ path: keyPath, en: en[key] });
    }
  }
  return untranslated;
}

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

const untranslated = findUntranslated(en, fr);
const bySection = {};

untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySection[section]) bySection[section] = [];
  bySection[section].push(item);
});

// Show samples from top sections
[
  'services',
  'leagueDetail',
  'clubTournamentManagement',
  'duesManagement',
  'createEvent',
  'admin',
  'types',
].forEach(section => {
  if (bySection[section]) {
    console.log(`\n=== ${section} (${bySection[section].length} keys) ===`);
    bySection[section].slice(0, 20).forEach(item => {
      console.log(`  ${item.path}: "${item.en}"`);
    });
  }
});
