#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const frPath = path.join(__dirname, '../src/locales/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Comprehensive French translations - only keys that exist in en.json
const frTranslations = {
  // Match-related terms
  'Match Request': 'Demande de match',
  'Match Details': 'Détails du match',
  'Match History': 'Historique des matchs',
  'Match Score': 'Score du match',
  'Match Status': 'Statut du match',
  'Match Type': 'Type de match',
  'Match Date': 'Date du match',
  'Match Time': 'Heure du match',
  'Match Location': 'Lieu du match',
  'Match Result': 'Résultat du match',

  // Club-related terms
  'Club Management': 'Gestion du club',
  'Club Members': 'Membres du club',
  'Club Events': 'Événements du club',
  'Club Settings': 'Paramètres du club',
  'Club Policies': 'Politiques du club',

  // League-related terms
  'League Details': 'Détails de la ligue',
  'League Standings': 'Classement de la ligue',
  'League Schedule': 'Calendrier de la ligue',
  'League Rules': 'Règles de la ligue',

  // Tournament-related terms
  'Tournament Bracket': 'Tableau du tournoi',
  'Tournament Schedule': 'Calendrier du tournoi',
  'Tournament Results': 'Résultats du tournoi',

  // Common actions
  Create: 'Créer',
  Edit: 'Modifier',
  Delete: 'Supprimer',
  Cancel: 'Annuler',
  Save: 'Enregistrer',
  Update: 'Mettre à jour',
  Submit: 'Soumettre',
  Confirm: 'Confirmer',
  Send: 'Envoyer',
  Share: 'Partager',

  // Status terms
  Active: 'Actif',
  Inactive: 'Inactif',
  Pending: 'En attente',
  Completed: 'Terminé',
  Cancelled: 'Annulé',
  'In Progress': 'En cours',

  // Time-related
  Today: "Aujourd'hui",
  Tomorrow: 'Demain',
  Yesterday: 'Hier',
  'This Week': 'Cette semaine',
  'Next Week': 'Semaine prochaine',
  'This Month': 'Ce mois-ci',
  'Next Month': 'Mois prochain',

  // Common phrases
  'No results found': 'Aucun résultat trouvé',
  'Loading...': 'Chargement...',
  'Error loading data': 'Erreur lors du chargement des données',
  'Try again': 'Réessayer',
  Success: 'Succès',
  Failed: 'Échec',
};

// Function to find and translate keys recursively
function translateKeys(enObj, frObj, translations) {
  const result = { ...frObj };

  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      // Recursive case: nested object
      if (!result[key] || typeof result[key] !== 'object') {
        result[key] = {};
      }
      result[key] = translateKeys(enObj[key], result[key] || {}, translations);
    } else {
      // Base case: leaf node
      const enValue = enObj[key];
      const frValue = frObj[key];

      // Only translate if:
      // 1. No French translation exists, OR
      // 2. French translation is the same as English (untranslated)
      if (!frValue || frValue === enValue) {
        if (translations[enValue]) {
          result[key] = translations[enValue];
        } else {
          // Keep the English value if no translation available
          result[key] = enValue;
        }
      } else {
        // Keep existing French translation
        result[key] = frValue;
      }
    }
  }

  return result;
}

// Count untranslated keys
function countUntranslated(enObj, frObj) {
  let count = 0;

  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], frObj[key] || {});
    } else {
      const enValue = enObj[key];
      const frValue = frObj[key];
      if (!frValue || frValue === enValue) {
        count++;
      }
    }
  }

  return count;
}

console.log('🔄 Starting French translation - Round 2 (v2)...\n');

// Count before
const beforeCount = countUntranslated(en, fr);
console.log(`📊 Untranslated keys before: ${beforeCount}`);

// Apply translations
const updatedFr = translateKeys(en, fr, frTranslations);

// Count after
const afterCount = countUntranslated(en, updatedFr);
const translatedCount = beforeCount - afterCount;

console.log(`📊 Untranslated keys after: ${afterCount}`);
console.log(`📈 Keys translated this round: ${translatedCount}\n`);

// Save updated French translations
fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2), 'utf8');

console.log('✨ French translation file updated successfully!');
console.log(`📁 File: ${frPath}`);
