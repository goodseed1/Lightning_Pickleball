const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function findUntranslated(enData, targetData, targetLang) {
  const enKeys = getAllKeys(enData);
  const untranslated = [];

  for (const key of enKeys) {
    const enValue = getValueByPath(enData, key);
    const targetValue = getValueByPath(targetData, key);

    // Consider untranslated if:
    // 1. Key doesn't exist in target
    // 2. Value is exactly the same as English
    // 3. Value is empty/null
    if (!targetValue || targetValue === enValue || targetValue === '') {
      untranslated.push({
        key,
        enValue,
        targetValue: targetValue || '[MISSING]',
      });
    }
  }

  return untranslated;
}

function main() {
  const languages = [
    { code: 'es', name: 'Spanish (Latin American)' },
    { code: 'de', name: 'German (formal)' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'pt', name: 'Portuguese (Brazilian)' },
  ];

  const enPath = path.join(LOCALES_DIR, 'en.json');
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  console.log('='.repeat(80));
  console.log('TRANSLATION COMPLETION STATUS - ALL LANGUAGES');
  console.log('='.repeat(80));
  console.log();

  const results = {};

  for (const lang of languages) {
    const targetPath = path.join(LOCALES_DIR, `${lang.code}.json`);
    const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

    const untranslated = findUntranslated(enData, targetData, lang.code);
    results[lang.code] = untranslated;

    console.log(`📊 ${lang.name} (${lang.code})`);
    console.log(`   Total keys: ${getAllKeys(enData).length}`);
    console.log(`   Untranslated: ${untranslated.length}`);
    console.log(
      `   Coverage: ${((1 - untranslated.length / getAllKeys(enData).length) * 100).toFixed(2)}%`
    );
    console.log();

    // Save to file for detailed inspection
    const outputPath = path.join(__dirname, `untranslated-${lang.code}-full.json`);
    fs.writeFileSync(outputPath, JSON.stringify(untranslated, null, 2));
    console.log(`   💾 Details saved to: untranslated-${lang.code}-full.json`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const totalKeys = getAllKeys(enData).length;
  const totalUntranslated = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  const totalToTranslate = totalKeys * 4; // 4 languages
  const totalTranslated = totalToTranslate - totalUntranslated;

  console.log(`Total keys to translate: ${totalToTranslate} (${totalKeys} keys × 4 languages)`);
  console.log(`Total translated: ${totalTranslated}`);
  console.log(`Total remaining: ${totalUntranslated}`);
  console.log(`Overall completion: ${((totalTranslated / totalToTranslate) * 100).toFixed(2)}%`);
  console.log();
  console.log('Breakdown by language:');
  for (const lang of languages) {
    console.log(`  - ${lang.name}: ${results[lang.code].length} keys remaining`);
  }
  console.log('='.repeat(80));
}

main();
