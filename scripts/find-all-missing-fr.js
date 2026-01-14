#!/usr/bin/env node

/**
 * Script pour trouver TOUTES les clés où fr === en dans les fichiers de traduction
 * Analyse complète et exhaustive de tous les niveaux de profondeur
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const FR_PATH = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));

/**
 * Fonction récursive pour trouver toutes les clés où fr === en
 */
function findMatchingKeys(enObj, frObj, path = []) {
  const matches = [];

  for (const key in enObj) {
    const currentPath = [...path, key];
    const enValue = enObj[key];
    const frValue = frObj ? frObj[key] : undefined;

    if (typeof enValue === 'object' && enValue !== null) {
      // Récursion pour les objets imbriqués
      if (typeof frValue === 'object' && frValue !== null) {
        matches.push(...findMatchingKeys(enValue, frValue, currentPath));
      } else {
        // Structure manquante en FR - compter toutes les feuilles
        matches.push(...countLeaves(enValue, currentPath));
      }
    } else if (typeof enValue === 'string') {
      // Vérifier si fr === en OU si manquant
      if (!frValue || frValue === enValue) {
        matches.push({
          path: currentPath.join('.'),
          key: key,
          en: enValue,
          fr: frValue || enValue,
          missing: !frValue,
        });
      }
    }
  }

  return matches;
}

/**
 * Compte toutes les feuilles (valeurs finales) dans un objet
 */
function countLeaves(obj, path = []) {
  const leaves = [];

  for (const key in obj) {
    const currentPath = [...path, key];
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      leaves.push(...countLeaves(value, currentPath));
    } else if (typeof value === 'string') {
      leaves.push({
        path: currentPath.join('.'),
        key: key,
        en: value,
        fr: value,
        missing: true,
      });
    }
  }

  return leaves;
}

// Exécution principale
console.log('🔍 Analyse complète des traductions françaises...\n');

const matches = findMatchingKeys(en, fr);

console.log(`📊 Total trouvé: ${matches.length} clés où fr === en\n`);

// Grouper par section principale
const bySection = {};
matches.forEach(match => {
  const section = match.path.split('.')[0];
  if (!bySection[section]) {
    bySection[section] = [];
  }
  bySection[section].push(match);
});

// Afficher les TOP sections
console.log('📋 TOP sections avec le plus de clés manquantes:\n');
const sortedSections = Object.entries(bySection).sort((a, b) => b[1].length - a[1].length);

sortedSections.slice(0, 10).forEach(([section, items], index) => {
  console.log(`${index + 1}. ${section}: ${items.length} clés`);
});

console.log('\n' + '='.repeat(80) + '\n');

// Détails pour les TOP 5 sections
console.log('📝 Détails des TOP 5 sections:\n');

sortedSections.slice(0, 5).forEach(([section, items]) => {
  console.log(`\n### ${section} (${items.length} clés)\n`);

  items.forEach(match => {
    console.log(`  ${match.path}`);
    console.log(`    EN: "${match.en}"`);
    if (match.missing) {
      console.log(`    FR: [MANQUANT]`);
    } else {
      console.log(`    FR: "${match.fr}" [IDENTIQUE]`);
    }
    console.log('');
  });
});

// Sauvegarder les résultats
const output = {
  total: matches.length,
  bySection: Object.fromEntries(
    sortedSections.map(([section, items]) => [
      section,
      {
        count: items.length,
        keys: items.map(m => ({
          path: m.path,
          key: m.key,
          en: m.en,
          missing: m.missing,
        })),
      },
    ])
  ),
};

const outputPath = path.join(__dirname, 'missing-french-keys.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('\n' + '='.repeat(80));
console.log(`\n✅ Résultats sauvegardés: ${outputPath}`);
console.log(`📊 Total: ${matches.length} clés nécessitent une traduction française\n`);
