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
        untranslated.push({ path: currentPath, en: enObj[key] });
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

const prioritySections = ['cards', 'badgeGallery', 'clubCommunication', 'createMeetup'];

prioritySections.forEach(section => {
  const items = untranslated.filter(item => item.path.startsWith(section + '.'));
  console.log(`\n${section}: ${items.length} untranslated`);
  items.slice(0, 5).forEach(item => {
    console.log(`  ${item.path}: "${item.en}"`);
  });
  if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
});
