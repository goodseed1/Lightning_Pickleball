#!/usr/bin/env node

const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const it = JSON.parse(fs.readFileSync('src/locales/it.json', 'utf8'));

function countAll(enObj, itObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += countAll(enObj[key], itObj[key] || {});
    } else {
      if (!itObj[key] || itObj[key] === enObj[key]) count++;
    }
  }
  return count;
}

const totalUntranslated = countAll(en, it);
console.log('Total untranslated keys remaining:', totalUntranslated);

// Find top sections
const sections = {};
for (const key in en) {
  if (en[key] && typeof en[key] === 'object') {
    sections[key] = countAll(en[key], it[key] || {});
  }
}

const sorted = Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);
console.log('\nTop 20 sections needing translation:');
sorted.forEach(([section, count]) => {
  console.log('  ' + section + ': ' + count + ' keys');
});
