#!/usr/bin/env node
/**
 * Detailed report for specific priority sections
 */

const fs = require('fs');
const path = require('path');

function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function flattenObject(obj, prefix = '') {
  const flattened = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  }
  return flattened;
}

// Priority sections from user request
const sections = [
  'clubOverview.tabs',
  'clubHome',
  'createNew',
  'members',
  'leagues',
  'tournaments',
];

function generateReport() {
  const localesDir = path.join(__dirname, '../src/locales');
  const languages = ['es', 'ko', 'de', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

  const enData = readJSON(path.join(localesDir, 'en.json'));
  if (!enData) return;

  const enFlat = flattenObject(enData);

  console.log(`\n${'='.repeat(100)}`);
  console.log('DETAILED TRANSLATION STATUS REPORT - PRIORITY SECTIONS');
  console.log(`${'='.repeat(100)}\n`);

  for (const section of sections) {
    // Get all keys for this section from English
    const sectionKeys = Object.keys(enFlat)
      .filter(key => key.startsWith(section))
      .sort();

    if (sectionKeys.length === 0) continue;

    console.log(`\n${'━'.repeat(100)}`);
    console.log(`SECTION: ${section} (${sectionKeys.length} keys)`);
    console.log(`${'━'.repeat(100)}\n`);

    // Create a table showing status for each language
    const header = `${'Key'.padEnd(60)} | EN | ES | KO | DE | FR | IT | JA | PT | RU | ZH`;
    console.log(header);
    console.log('─'.repeat(header.length));

    for (const key of sectionKeys) {
      const enValue = enFlat[key];
      const row = [key.padEnd(60)];
      row.push(' ✓ '); // English always has it

      for (const lang of languages) {
        const langData = readJSON(path.join(localesDir, `${lang}.json`));
        if (!langData) {
          row.push(' ? ');
          continue;
        }

        const langFlat = flattenObject(langData);
        if (!(key in langFlat)) {
          row.push(' ✗ '); // Missing
        } else if (langFlat[key] === enValue) {
          row.push(' = '); // Same as English (untranslated)
        } else {
          row.push(' ✓ '); // Translated
        }
      }

      console.log(row.join('|'));
    }

    // Summary for this section
    console.log('\n' + '─'.repeat(header.length));
    console.log(
      'Legend: ✓ = Translated | ✗ = Missing | = = Same as English (untranslated) | ? = Error\n'
    );
  }

  console.log(`\n${'='.repeat(100)}\n`);

  // Now generate missing keys list for easy copy-paste
  console.log('\n' + '='.repeat(100));
  console.log('MISSING KEYS BY SECTION (for easy reference)');
  console.log('='.repeat(100) + '\n');

  for (const section of sections) {
    const sectionKeys = Object.keys(enFlat)
      .filter(key => key.startsWith(section))
      .sort();

    if (sectionKeys.length === 0) continue;

    console.log(`\n${section}:`);
    console.log('─'.repeat(80));

    for (const key of sectionKeys) {
      const enValue = enFlat[key];
      console.log(`  ${key}:`);
      console.log(`    EN: "${enValue}"`);
      console.log();
    }
  }
}

generateReport();
