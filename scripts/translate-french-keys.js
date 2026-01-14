#!/usr/bin/env node
/**
 * Translate untranslated French keys (where fr.json === en.json)
 * Uses comprehensive translation mapping for natural French
 */

const fs = require('fs');
const path = require('path');

const FR_PATH = path.join(__dirname, '../src/locales/fr.json');
const UNTRANSLATED_PATH = path.join(__dirname, 'untranslated-french-keys.json');

// Comprehensive translation mapping
const TRANSLATIONS = {
  // Common UI - Buttons & Actions
  OK: "D'accord",
  Cancel: 'Annuler',
  Save: 'Enregistrer',
  Delete: 'Supprimer',
  Edit: 'Modifier',
  Add: 'Ajouter',
  Remove: 'Retirer',
  Close: 'Fermer',
  Next: 'Suivant',
  Back: 'Retour',
  Submit: 'Soumettre',
  Confirm: 'Confirmer',
  Send: 'Envoyer',
  Resend: 'Renvoyer',
  'Loading...': 'Chargement en cours...',
  'Loading data...': 'Chargement des données...',

  // Common Labels
  Email: 'Adresse e-mail',
  Note: 'Remarque',
  Logo: 'Logo',
  Parking: 'Stationnement',
  Public: 'Public',
  Private: 'Privé',
  Social: 'Social',
  Notice: 'Avis',
  Info: 'Info',
  Important: 'Important',
  Club: 'Club',
  Clubs: 'Clubs',
  Services: 'Services',
  Participants: 'Participants',
  Permissions: 'Autorisations',
  Applications: 'Candidatures',

  // Distances & Units
  km: 'km',
  mi: 'mi',
  miles: 'miles',
  'Distance N/A': 'Distance indisponible',

  // Match & Tennis Terminology
  'Total Matches': 'Nombre de matchs',
  Match: 'Match',
  Matches: 'Matchs',
  Score: 'Score',
  'Score:': 'Score :',
  Win: 'Victoire',
  Loss: 'Défaite',
  W: 'V',
  L: 'D',
  'Playing Style': 'Style de jeu',
  Expert: 'Expert',
  Rec: 'Rec',

  // Time & Schedule
  Weekdays: 'Jours de semaine',
  Weekends: 'Week-ends',
  Brunch: 'Brunch',

  // Profile & User
  Availability: 'Disponibilité',
  Stats: 'Statistiques',
  Friends: 'Amis',
  'Edit Profile': 'Modifier le profil',
  'My Stats': 'Mes statistiques',
  'Earned Badges': 'Badges obtenus',
  Goals: 'Objectifs',

  // Management & Admin
  'Role Management': 'Gestion des rôles',
  'Applications ({{count}})': 'Candidatures ({{count}})',
  '{{count}} member(s)': '{{count}} membre(s)',
  '{{count}} request(s)': '{{count}} demande(s)',
  'Removal Reason (Optional)': 'Motif de suppression (Optionnel)',

  // Common Phrases
  'Are you sure?': 'Êtes-vous sûr ?',
  'Please try again': 'Veuillez réessayer',
  'Coming soon': 'Prochainement',
  'Not available': 'Non disponible',
  'No data': 'Aucune donnée',
  'Try again': 'Réessayer',
};

// Context-aware translation patterns
const PATTERNS = [
  // Titles & Headers
  { pattern: /^(.+) Settings$/, replace: 'Paramètres de $1' },
  { pattern: /^(.+) Management$/, replace: 'Gestion de $1' },
  { pattern: /^(.+) Policy$/, replace: 'Politique de $1' },
  { pattern: /^(.+) Terms$/, replace: 'Conditions de $1' },
  { pattern: /^(.+) Screen$/, replace: 'Écran $1' },

  // Actions
  { pattern: /^Resend (.+)$/, replace: 'Renvoyer $1' },
  { pattern: /^Delete (.+)$/, replace: 'Supprimer $1' },
  { pattern: /^Edit (.+)$/, replace: 'Modifier $1' },
  { pattern: /^Add (.+)$/, replace: 'Ajouter $1' },
  { pattern: /^Remove (.+)$/, replace: 'Retirer $1' },

  // States & Messages
  { pattern: /^(.+) Required$/, replace: '$1 requis' },
  { pattern: /^(.+) Failed$/, replace: 'Échec de $1' },
  { pattern: /^(.+) Success$/, replace: '$1 réussi' },
  { pattern: /^Loading (.+)$/, replace: 'Chargement de $1...' },
  { pattern: /^No (.+)$/, replace: 'Aucun $1' },
];

function translateText(text) {
  // Direct translation first
  if (TRANSLATIONS[text]) {
    return TRANSLATIONS[text];
  }

  // Pattern-based translation
  for (const { pattern, replace } of PATTERNS) {
    if (pattern.test(text)) {
      return text.replace(pattern, replace);
    }
  }

  // Return original if no translation found
  return text;
}

function translateObject(obj, enObj) {
  const translated = {};

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursive for nested objects
      translated[key] = translateObject(obj[key], enObj[key] || {});
    } else if (typeof obj[key] === 'string') {
      // Check if untranslated (fr === en)
      if (obj[key] === enObj[key]) {
        const translation = translateText(obj[key]);
        translated[key] = translation;

        // Log translation
        if (translation !== obj[key]) {
          console.log(`  ✓ "${obj[key]}" → "${translation}"`);
        }
      } else {
        // Already translated
        translated[key] = obj[key];
      }
    } else {
      translated[key] = obj[key];
    }
  }

  return translated;
}

function main() {
  console.log('🇫🇷 Translating French keys...\n');

  // Load files
  const frData = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
  const untranslatedData = JSON.parse(fs.readFileSync(UNTRANSLATED_PATH, 'utf8'));

  // Create backup
  const backupPath = FR_PATH + '.backup';
  fs.writeFileSync(backupPath, JSON.stringify(frData, null, 2), 'utf8');
  console.log(`📦 Backup created: ${backupPath}\n`);

  // Translate
  console.log('🔄 Translating keys:\n');
  const translatedData = translateObject(frData, untranslatedData);

  // Save
  fs.writeFileSync(FR_PATH, JSON.stringify(translatedData, null, 2), 'utf8');
  console.log(`\n✅ Translation complete! Saved to: ${FR_PATH}\n`);

  // Verify
  console.log('🔍 Verifying JSON validity...');
  try {
    JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
    console.log('✅ JSON is valid!\n');
  } catch (err) {
    console.error('❌ JSON validation failed:', err.message);
    console.log('🔄 Restoring backup...');
    fs.copyFileSync(backupPath, FR_PATH);
    console.log('✅ Backup restored\n');
    process.exit(1);
  }
}

main();
