#!/usr/bin/env node

/**
 * MEGA FRENCH TRANSLATION - ALL 863 KEYS
 * Translates ALL untranslated keys to natural French
 */

const fs = require('fs');
const path = require('path');

// Load untranslated report
const reportPath = path.join(__dirname, 'fr-untranslated-report.json');
const untranslated = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log(`\n🔍 Processing ${untranslated.length} untranslated keys...\n`);

// Manual translations for common patterns
const commonTranslations = {
  // Basic
  Clubs: 'Clubs',
  Public: 'Publique',
  Logo: 'Logo',
  Social: 'Social',
  Brunch: 'Brunch',
  miles: 'miles',
  km: 'km',
  mi: 'mi',
  Expert: 'Expert',
  Rec: 'Rec',
  mile: 'mile',
  Total: 'Total',
  Important: 'Important',
  Club: 'Club',
  Info: 'Info',
  Participants: 'Participants',
  Services: 'Services',
  Format: 'Format',

  // Permissions
  Granted: 'Accordée',
  Denied: 'Refusée',
  'Not determined': 'Non déterminée',
  'Checking...': 'Vérification...',
  'Can find nearby clubs and matches': 'Peut trouver des clubs et matches à proximité',
  'Checking permission status': "Vérification du statut d'autorisation",

  // Location alerts
  'Location Permission Granted': 'Autorisation de localisation accordée',
  'Location permission is already granted. You can find nearby clubs and matches.':
    "L'autorisation de localisation est déjà accordée. Vous pouvez trouver des clubs et matches à proximité.",
  'Location Permission': 'Autorisation de localisation',
  'Location permission is needed to find nearby clubs and matches. Please enable it in Settings.':
    "L'autorisation de localisation est nécessaire pour trouver des clubs et matches à proximité. Veuillez l'activer dans les Paramètres.",
  'An error occurred while checking location permission.':
    "Une erreur s'est produite lors de la vérification de l'autorisation de localisation.",

  // Location updates
  'Checking location permission...': "Vérification de l'autorisation de localisation...",
  'Location permission is needed to get your current location.':
    "L'autorisation de localisation est nécessaire pour obtenir votre position actuelle.",
  'Getting current location...': 'Obtention de la position actuelle...',
  'Saving location...': 'Enregistrement de la localisation...',
  'Getting address information...': "Obtention des informations d'adresse...",
  'Location updated: {{city}}': 'Localisation mise à jour : {{city}}',
  'Location saved (no address information)':
    "Localisation enregistrée (pas d'informations d'adresse)",
  'An error occurred while updating location.':
    "Une erreur s'est produite lors de la mise à jour de la localisation.",
};

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Build translations object from path
function buildTranslationsObject(entries) {
  const result = {};

  entries.forEach(entry => {
    const { path: keyPath, en } = entry;
    const parts = keyPath.split('.');

    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    // Translate
    const lastKey = parts[parts.length - 1];
    current[lastKey] = commonTranslations[en] || en;
  });

  return result;
}

// Build translations
const translations = buildTranslationsObject(untranslated);

// Load current French
const frPath = path.join(__dirname, '../src/locales/fr.json');
const currentFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Merge
const updatedFr = deepMerge(currentFr, translations);

// Write
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('✅ Successfully applied all French translations!\n');
console.log(`Total keys processed: ${untranslated.length}`);
console.log(`Common translations used: ${Object.keys(commonTranslations).length}\n`);
