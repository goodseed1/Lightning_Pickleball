#!/usr/bin/env node
/**
 * Find all keys where fr.json === en.json (untranslated French keys)
 * Outputs grouped by top-level section
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

function loadJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function compareObjects(enObj, frObj, prefix = '') {
  const untranslated = {};

  for (const key in enObj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      // Recursive comparison for nested objects
      const nested = compareObjects(enObj[key], frObj[key] || {}, currentPath);
      if (Object.keys(nested).length > 0) {
        untranslated[key] = nested;
      }
    } else {
      // Compare leaf values
      if (enObj[key] === frObj[key]) {
        untranslated[key] = enObj[key];
      }
    }
  }

  return untranslated;
}

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

function main() {
  console.log('🔍 Finding untranslated French keys...\n');

  const enData = loadJSON(EN_PATH);
  const frData = loadJSON(FR_PATH);

  const untranslated = compareObjects(enData, frData);

  // Count by top-level section
  const sectionCounts = {};
  for (const section in untranslated) {
    sectionCounts[section] = countKeys(untranslated[section]);
  }

  // Sort by count descending
  const sorted = Object.entries(sectionCounts).sort((a, b) => b[1] - a[1]);

  console.log('📊 TOP SECTIONS (untranslated keys):\n');
  sorted.forEach(([section, count]) => {
    console.log(`  ${section}: ${count} keys`);
  });

  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  console.log(`\n✨ TOTAL: ${total} untranslated keys\n`);

  // Save full report
  const reportPath = path.join(__dirname, 'untranslated-french-keys.json');
  fs.writeFileSync(reportPath, JSON.stringify(untranslated, null, 2), 'utf8');
  console.log(`📝 Full report saved to: ${reportPath}\n`);
}

main();
