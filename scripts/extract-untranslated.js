#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'));

function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function findUntranslated(obj, compareObj, prefix = '') {
  let untranslated = {};

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const compareChild = compareObj?.[key] || {};
      const nested = findUntranslated(obj[key], compareChild, fullKey);
      untranslated = { ...untranslated, ...nested };
    } else {
      const compareValue = compareObj?.[key];
      if (obj[key] === compareValue) {
        untranslated[fullKey] = obj[key];
      }
    }
  }

  return untranslated;
}

const langs = ['es', 'de', 'pt'];

langs.forEach(lang => {
  const target = JSON.parse(fs.readFileSync(path.join(localesPath, `${lang}.json`), 'utf8'));
  const untranslated = findUntranslated(en, target);

  console.log(
    `\n=== ${lang.toUpperCase()} - ${Object.keys(untranslated).length} untranslated keys ===\n`
  );

  Object.entries(untranslated).forEach(([key, value]) => {
    console.log(`${key}: "${value}"`);
  });
});
