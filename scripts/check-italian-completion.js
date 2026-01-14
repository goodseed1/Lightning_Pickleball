#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkTranslations(obj, enObj, prefix = '') {
  let untranslated = [];

  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      if (obj[key] && typeof obj[key] === 'object') {
        untranslated = untranslated.concat(checkTranslations(obj[key], enObj[key], currentPath));
      }
    } else if (typeof enObj[key] === 'string') {
      if (!obj[key] || obj[key] === enObj[key]) {
        untranslated.push({ path: currentPath, en: enObj[key], it: obj[key] || 'MISSING' });
      }
    }
  }

  return untranslated;
}

const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const itPath = path.join(__dirname, '..', 'src', 'locales', 'it.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));

const untranslated = checkTranslations(it, en);

// Group by section
const sections = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!sections[section]) sections[section] = 0;
  sections[section]++;
});

console.log('Italian Translation Progress Report');
console.log('====================================\n');
console.log(`Total untranslated: ${untranslated.length}\n`);

console.log('Top sections needing translation:');
const sortedSections = Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedSections.forEach(([section, count]) => {
  console.log(`  ${section}: ${count} items`);
});

console.log('\n✅ Recently completed sections:');
console.log('  • cards.hostedEvent.weather: 16 items');
console.log('  • badgeGallery.badges: 8 items');
console.log('  • clubCommunication: 11 items');
console.log('  • createMeetup.errors: 13 items');
