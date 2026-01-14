#!/usr/bin/env node

/**
 * Analyse pour identifier les VRAIES clés manquantes vs termes universels
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

// Liste des termes universels qui ne nécessitent PAS de traduction
const UNIVERSAL_TERMS = new Set([
  'Match',
  'Description',
  'Expert',
  'Total',
  'Type',
  'Notes',
  'Venmo',
  'Logo',
  'Club',
  'Public',
  'Social',
  'Info',
  'Participants',
  'Champion',
  'Notification',
  'Format',
  '2.0-3.0',
  '3.0-4.0',
  '4.0-5.0',
  '5.0+',
  '4',
  'km',
  'mi',
  'min',
  '한국어',
  '中文',
  '日本語',
  'Español',
  'Français',
  'Brunch',
  'OK',
  'QR',
  'Clubs',
  'Services',
  'Date',
  'Normal',
  'Challenger',
  'Section',
  'Messages',
  'Junsu Kim',
  'Seoyeon Lee',
  'Minjae Park', // Noms propres
  'Endurance',
  'Mental', // Termes sportifs universels
  'Showers', // Conditions météo (peuvent rester en anglais dans certains contextes)
]);

function findMissingKeys(enObj, frObj, path = []) {
  const missing = { needsTranslation: [], universal: [] };

  for (const key in enObj) {
    const currentPath = [...path, key];
    const enValue = enObj[key];
    const frValue = frObj ? frObj[key] : undefined;

    if (typeof enValue === 'object' && enValue !== null) {
      if (typeof frValue === 'object' && frValue !== null) {
        const nested = findMissingKeys(enValue, frValue, currentPath);
        missing.needsTranslation.push(...nested.needsTranslation);
        missing.universal.push(...nested.universal);
      }
    } else if (typeof enValue === 'string') {
      if (!frValue || frValue === enValue) {
        const pathStr = currentPath.join('.');
        const item = { path: pathStr, en: enValue, fr: frValue || enValue };

        // Vérifier si c'est un terme universel
        if (
          UNIVERSAL_TERMS.has(enValue) ||
          enValue === '' ||
          /^[0-9\{\}\/\-\+\.\s\(\)]+$/.test(enValue)
        ) {
          missing.universal.push(item);
        } else {
          missing.needsTranslation.push(item);
        }
      }
    }
  }

  return missing;
}

console.log('🔍 Analyse des termes universels vs traductions nécessaires...\n');

const result = findMissingKeys(en, fr);

console.log(`📊 Résultats:\n`);
console.log(`✅ Termes universels (OK): ${result.universal.length}`);
console.log(`⚠️  Traductions nécessaires: ${result.needsTranslation.length}\n`);

if (result.needsTranslation.length > 0) {
  console.log('📝 Clés nécessitant VRAIMENT une traduction:\n');
  result.needsTranslation.forEach((item, index) => {
    console.log(`${index + 1}. ${item.path}`);
    console.log(`   EN: "${item.en}"`);
    console.log(`   FR: "${item.fr}"\n`);
  });
} else {
  console.log('✨ Toutes les traductions non-universelles sont complètes!\n');
}

console.log('\n📋 Exemples de termes universels détectés:');
result.universal.slice(0, 10).forEach(item => {
  console.log(`  - ${item.path}: "${item.en}"`);
});
console.log(`  ... et ${result.universal.length - 10} autres\n`);
