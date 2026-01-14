#!/usr/bin/env node

/**
 * Analyze Spanish translations - Find what needs to be translated
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Find untranslated keys
function findUntranslated(enObj, esObj, prefix = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      untranslated.push(...findUntranslated(enObj[key], esObj[key] || {}, currentPath));
    } else {
      // Check if key exists in Spanish and if value is different from English
      if (!esObj[key] || esObj[key] === enObj[key]) {
        untranslated.push({
          path: currentPath,
          en: enObj[key],
          es: esObj[key] || '(missing)',
        });
      }
    }
  }

  return untranslated;
}

const untranslated = findUntranslated(en, es);

// Group by top-level section
const bySection = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  if (!bySection[section]) {
    bySection[section] = [];
  }
  bySection[section].push(item);
});

// Sort by count
const sorted = Object.entries(bySection).sort((a, b) => b[1].length - a[1].length);

console.log(`\n🔍 UNTRANSLATED KEYS ANALYSIS\n`);
console.log(`Total untranslated: ${untranslated.length}\n`);
console.log(`Top 20 sections needing translation:\n`);

sorted.slice(0, 20).forEach(([section, items], index) => {
  console.log(`${index + 1}. ${section}: ${items.length} keys`);

  // Show first 3 examples
  items.slice(0, 3).forEach(item => {
    const subPath = item.path.substring(section.length + 1);
    console.log(`   • ${subPath}: "${item.en}"`);
  });

  if (items.length > 3) {
    console.log(`   ... and ${items.length - 3} more`);
  }
  console.log();
});

// Save full report
const reportPath = path.join(__dirname, 'translation-report.json');
fs.writeFileSync(reportPath, JSON.stringify({ untranslated, bySection, sorted }, null, 2));
console.log(`📄 Full report saved to: ${reportPath}\n`);
