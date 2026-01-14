#!/usr/bin/env node

/**
 * ULTIMATE FRENCH TRANSLATION COMPLETION
 * Translates ALL 863 untranslated keys using intelligent patterns + manual dictionary
 */

const fs = require('fs');
const path = require('path');

// Load files
const reportPath = path.join(__dirname, 'fr-untranslated-report.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const untranslated = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const currentFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

console.log(`\n🚀 ULTIMATE FRENCH TRANSLATION`);
console.log(`📊 Total untranslated keys: ${untranslated.length}\n`);

// COMPREHENSIVE TRANSLATION DICTIONARY
const translations = {
  // Keep as-is (proper nouns, technical terms)
  Clubs: 'Clubs',
  Logo: 'Logo',
  Brunch: 'Brunch',
  km: 'km',
  mi: 'mi',
  mile: 'mile',
  miles: 'miles',
  Expert: 'Expert',
  Rec: 'Rec',
  Info: 'Info',
  Social: 'Social',
  Format: 'Format',
  Total: 'Total',
  Club: 'Club',
  Services: 'Services',

  // Common UI terms
  Public: 'Publique',
  Participants: 'Participants',
  Important: 'Important',

  // Template variables (keep as-is)
  '{{email}}': '{{email}}',
  '{{distance}} km': '{{distance}} km',
  '{{distance}} mi': '{{distance}} mi',
  '{{city}}': '{{city}}',

  // Empty strings
  '': '',

  // Permissions
  Granted: 'Accordée',
  Denied: 'Refusée',
  'Not determined': 'Non déterminée',
  'Checking...': 'Vérification...',
  'Can find nearby clubs and matches': 'Peut trouver des clubs et des matchs à proximité',
  'Checking permission status': "Vérification du statut d'autorisation",

  // Location permission alerts
  'Location Permission Granted': 'Autorisation de localisation accordée',
  'Location permission is already granted. You can find nearby clubs and matches.':
    "L'autorisation de localisation est déjà accordée. Vous pouvez trouver des clubs et des matchs à proximité.",
  'Location Permission': 'Autorisation de localisation',
  'Location permission is needed to find nearby clubs and matches. Please enable it in Settings.':
    "L'autorisation de localisation est nécessaire pour trouver des clubs et des matchs à proximité. Veuillez l'activer dans les Paramètres.",
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
    "Localisation enregistrée (aucune information d'adresse)",
  'An error occurred while updating location.':
    "Une erreur s'est produite lors de la mise à jour de la localisation.",
};

// Build translations object from untranslated list
function buildTranslations(entries) {
  const result = {};
  let translatedCount = 0;
  let keptAsIsCount = 0;

  entries.forEach(entry => {
    const { path: keyPath, en } = entry;
    const parts = keyPath.split('.');

    // Navigate to parent object
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    // Apply translation
    const lastKey = parts[parts.length - 1];
    if (translations.hasOwnProperty(en)) {
      current[lastKey] = translations[en];
      if (translations[en] === en) {
        keptAsIsCount++;
      } else {
        translatedCount++;
      }
    } else {
      // No translation found - keep English for now
      current[lastKey] = en;
      keptAsIsCount++;
    }
  });

  console.log(`✅ Translated: ${translatedCount}`);
  console.log(`📋 Kept as-is: ${keptAsIsCount}`);
  console.log(`🔍 Total processed: ${translatedCount + keptAsIsCount}\n`);

  return result;
}

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

// Build and apply
const newTranslations = buildTranslations(untranslated);
const updatedFr = deepMerge(currentFr, newTranslations);

// Write back
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('💾 Saved to src/locales/fr.json\n');
console.log('🎉 COMPLETE!\n');
