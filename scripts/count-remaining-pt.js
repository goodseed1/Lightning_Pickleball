#!/usr/bin/env node

const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('src/locales/pt.json', 'utf8'));

function compareObjects(obj1, obj2, prefix = '') {
  let untranslated = [];

  for (const key in obj1) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
      untranslated = untranslated.concat(compareObjects(obj1[key], obj2[key] || {}, fullKey));
    } else if (obj1[key] === obj2[key]) {
      untranslated.push(fullKey);
    }
  }

  return untranslated;
}

const untranslated = compareObjects(en, pt);
console.log('✅ Total untranslated keys:', untranslated.length);
console.log('\nFirst 30 untranslated keys:');
untranslated.slice(0, 30).forEach(key => console.log('  ', key));

// Group by section
const sections = {};
untranslated.forEach(key => {
  const section = key.split('.')[0];
  if (!sections[section]) sections[section] = 0;
  sections[section]++;
});

console.log('\n📊 Untranslated by section:');
Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .forEach(([section, count]) => {
    console.log(`  ${section}: ${count}`);
  });
