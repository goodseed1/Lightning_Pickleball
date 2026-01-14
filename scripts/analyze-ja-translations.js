#!/usr/bin/env node
/**
 * Analyze Japanese translation file to find untranslated keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const JA_PATH = path.join(__dirname, '../src/locales/ja.json');

// Find untranslated keys (where ja value === en value)
function findUntranslated(en, ja, currentPath = '', results = []) {
  for (const key in en) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const enValue = en[key];
    const jaValue = ja[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      if (typeof jaValue === 'object' && !Array.isArray(jaValue)) {
        findUntranslated(enValue, jaValue, newPath, results);
      } else {
        // Section missing in ja
        results.push({ path: newPath, en: JSON.stringify(enValue), ja: jaValue });
      }
    } else {
      // Leaf node - check if translated
      if (!jaValue || jaValue === enValue) {
        results.push({ path: newPath, en: enValue, ja: jaValue });
      }
    }
  }

  return results;
}

// Group by section
function groupBySection(items) {
  const sections = {};

  items.forEach(item => {
    const parts = item.path.split('.');
    const section = parts[0];
    const subsection = parts.length > 1 ? parts[1] : null;

    if (!sections[section]) {
      sections[section] = { total: 0, subsections: {} };
    }

    sections[section].total++;

    if (subsection) {
      if (!sections[section].subsections[subsection]) {
        sections[section].subsections[subsection] = [];
      }
      sections[section].subsections[subsection].push(item);
    }
  });

  return sections;
}

async function main() {
  console.log('🔍 Analyzing Japanese translation file...\n');

  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const ja = JSON.parse(fs.readFileSync(JA_PATH, 'utf8'));

  const untranslated = findUntranslated(en, ja);
  const sections = groupBySection(untranslated);

  console.log(`📊 Total untranslated keys: ${untranslated.length}\n`);
  console.log('📋 Breakdown by section:\n');

  // Sort by count
  const sorted = Object.entries(sections).sort((a, b) => b[1].total - a[1].total);

  sorted.forEach(([section, data]) => {
    console.log(`\n${section}: ${data.total} keys`);

    // Show subsections
    const subsections = Object.entries(data.subsections);
    if (subsections.length > 0) {
      subsections.forEach(([subsection, items]) => {
        console.log(`  └─ ${subsection}: ${items.length} keys`);
      });
    }
  });

  // Show sample of top section
  console.log('\n\n📝 Sample from top section:');
  const topSection = sorted[0];
  if (topSection) {
    const [sectionName, data] = topSection;
    const samples = untranslated.filter(item => item.path.startsWith(sectionName)).slice(0, 10);

    samples.forEach(item => {
      console.log(`  ${item.path}: "${item.en}"`);
    });
  }

  // Export full list
  const outputPath = path.join(__dirname, 'untranslated-ja.json');
  fs.writeFileSync(outputPath, JSON.stringify(untranslated, null, 2), 'utf8');
  console.log(`\n💾 Full list saved to: ${outputPath}`);
}

main().catch(console.error);
