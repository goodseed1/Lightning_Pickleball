#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

// Termes qui DOIVENT rester identiques (universels)
const SHOULD_BE_IDENTICAL = new Set([
  'Match',
  'Set',
  'Champion',
  'Expert',
  'Total',
  'Points',
  'Venmo',
  'Logo',
  'Club',
  'Clubs',
  'Public',
  'Social',
  'Info',
  'Notification',
  'Format',
  'Participants',
  'Participant',
  'Description',
  'Type',
  'Notes',
  'Max',
  'Court',
  'Global',
  'Normal',
  'Challenger',
  'Section',
  'Messages',
  'Date',
  'Participation',
  'Conversations',
  'Important',
  'Badges',
  'Services',
  'OK',
  'Brunch',
  // Nombres et codes
  '2.0-3.0',
  '3.0-4.0',
  '4.0-5.0',
  '5.0+',
  '4',
  // Unités
  'km',
  'mi',
  'mile',
  'miles',
  'min',
  'pts',
  // Langues et noms propres
  '한국어',
  '中文',
  '日本語',
  'Español',
  'Français',
  'Junsu Kim',
  'Seoyeon Lee',
  'Minjae Park',
  // Termes tennis/sportifs
  'Endurance',
  'Mental',
  'Showers',
]);

function countKeys(obj, prefix = '') {
  let total = 0;
  let identical = 0;
  let needsTranslation = [];

  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      const nested = countKeys(value, path);
      total += nested.total;
      identical += nested.identical;
      needsTranslation.push(...nested.needsTranslation);
    } else if (typeof value === 'string') {
      total++;
      const frValue = getValueByPath(fr, path);

      if (frValue === value) {
        if (
          SHOULD_BE_IDENTICAL.has(value) ||
          value === '' ||
          /^[0-9\{\}\(\)\/\-\+\.\s×\:]+$/.test(value)
        ) {
          identical++;
        } else {
          needsTranslation.push({ path, en: value, fr: frValue });
        }
      }
    }
  }

  return { total, identical, needsTranslation };
}

function getValueByPath(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

console.log('📊 RAPPORT FINAL - Traductions françaises\n');
console.log('='.repeat(80) + '\n');

const result = countKeys(en);

console.log(`✅ Total de clés dans en.json: ${result.total}`);
console.log(`✅ Clés correctement identiques (termes universels): ${result.identical}`);
console.log(
  `⚠️  Clés nécessitant potentiellement une traduction: ${result.needsTranslation.length}\n`
);

if (result.needsTranslation.length > 0) {
  console.log('📝 Clés identiques qui pourraient nécessiter une vérification:\n');
  result.needsTranslation.slice(0, 20).forEach((item, index) => {
    console.log(`${index + 1}. ${item.path}`);
    console.log(`   EN/FR: "${item.en}"\n`);
  });

  if (result.needsTranslation.length > 20) {
    console.log(`... et ${result.needsTranslation.length - 20} autres\n`);
  }
}

const percentTranslated = (
  ((result.total - result.needsTranslation.length) / result.total) *
  100
).toFixed(1);

console.log('='.repeat(80));
console.log(
  `\n🎯 STATUT GLOBAL: ${percentTranslated}% des clés sont correctement traduites ou universelles`
);
console.log(`\n✨ Sur ${result.total} clés totales:`);
console.log(
  `   - ${result.total - result.needsTranslation.length} sont traduites ou universelles (${percentTranslated}%)`
);
console.log(
  `   - ${result.needsTranslation.length} sont identiques et pourraient être vérifiées\n`
);

// Sauvegarder le rapport
const reportData = {
  date: new Date().toISOString(),
  summary: {
    total: result.total,
    translated: result.total - result.needsTranslation.length,
    identical: result.identical,
    needsReview: result.needsTranslation.length,
    percentComplete: parseFloat(percentTranslated),
  },
  needsReview: result.needsTranslation,
};

fs.writeFileSync(
  path.join(__dirname, 'french-translation-report.json'),
  JSON.stringify(reportData, null, 2)
);

console.log('📄 Rapport détaillé sauvegardé: french-translation-report.json\n');
