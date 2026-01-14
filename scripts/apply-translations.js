#!/usr/bin/env node

/**
 * Apply translated patches to locale files using deep merge
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const PATCHES_DIR = path.join(__dirname, '../scripts/translations-completed');

// Read JSON file
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Write JSON file
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// Deep merge helper - merges source into target
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Count translations in object
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

// Main execution
function main() {
  if (!fs.existsSync(PATCHES_DIR)) {
    console.error(`❌ Patches directory not found: ${PATCHES_DIR}`);
    console.log('\n📝 Please create translation files in scripts/translations-completed/');
    console.log(
      '   Expected files: es-completed.json, de-completed.json, pt-completed.json, ru-completed.json, zh-completed.json'
    );
    process.exit(1);
  }

  const patchFiles = fs.readdirSync(PATCHES_DIR).filter(f => f.endsWith('-completed.json'));

  if (patchFiles.length === 0) {
    console.error(`❌ No translation patch files found in ${PATCHES_DIR}`);
    process.exit(1);
  }

  console.log('🔄 Applying translations...\n');

  patchFiles.forEach(patchFile => {
    const lang = patchFile.replace('-completed.json', '');
    const langFile = path.join(LOCALES_DIR, `${lang}.json`);
    const patchFilePath = path.join(PATCHES_DIR, patchFile);

    if (!fs.existsSync(langFile)) {
      console.warn(`⚠️  Skipping ${lang}: locale file not found`);
      return;
    }

    const langData = readJSON(langFile);
    const patchData = readJSON(patchFilePath);

    const patchCount = countKeys(patchData);
    const merged = deepMerge(langData, patchData);

    writeJSON(langFile, merged);

    console.log(`✅ ${lang.toUpperCase()}: Applied ${patchCount} translations → ${langFile}`);
  });

  console.log('\n🎉 All translations applied successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm run lint');
  console.log('   2. Run: npx tsc --noEmit');
  console.log('   3. Git commit the changes');
}

main();
