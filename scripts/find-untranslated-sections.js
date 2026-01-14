#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load files
const enPath = path.join(__dirname, '../src/locales/en.json');
const dePath = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Find untranslated keys by section
function findUntranslatedBySection(enObj, deObj, sectionName = '', sectionCounts = {}) {
  for (const key in enObj) {
    const currentSection = sectionName || key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      findUntranslatedBySection(enObj[key], deObj[key] || {}, currentSection, sectionCounts);
    } else {
      // Check if untranslated (de === en)
      if (enObj[key] === (deObj[key] || enObj[key])) {
        if (!sectionCounts[currentSection]) {
          sectionCounts[currentSection] = 0;
        }
        sectionCounts[currentSection]++;
      }
    }
  }

  return sectionCounts;
}

const sectionCounts = findUntranslatedBySection(en, de);

// Sort by count (descending)
const sorted = Object.entries(sectionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30); // Top 30 sections

console.log('\n📊 TOP SECTIONS NEEDING TRANSLATION:\n');
console.log('Section'.padEnd(40) + 'Untranslated Keys');
console.log('='.repeat(60));

sorted.forEach(([section, count]) => {
  console.log(`${section.padEnd(40)}${count}`);
});

const totalUntranslated = Object.values(sectionCounts).reduce((a, b) => a + b, 0);
console.log('='.repeat(60));
console.log(`${'TOTAL'.padEnd(40)}${totalUntranslated}\n`);
