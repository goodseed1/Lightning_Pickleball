#!/usr/bin/env node
/**
 * Automatic Italian Translation Script
 * Translates all untranslated keys from English to Italian
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Italian translations for common tennis and app terms
const TRANSLATIONS = {
  // Status & States
  Paid: 'Pagato',
  Unpaid: 'Non pagato',
  Pending: 'In sospeso',
  Completed: 'Completato',
  'In Progress': 'In corso',
  Active: 'Attivo',
  Inactive: 'Inattivo',
  Overdue: 'Scaduto',
  Exempt: 'Esente',
  Confirmed: 'Confermato',
  Cancelled: 'Annullato',

  // Actions
  Loading: 'Caricamento',
  Save: 'Salva',
  Cancel: 'Annulla',
  Delete: 'Elimina',
  Edit: 'Modifica',
  Create: 'Crea',
  Update: 'Aggiorna',
  Submit: 'Invia',
  Confirm: 'Conferma',
  Remove: 'Rimuovi',
  Add: 'Aggiungi',
  'Open Settings': 'Apri Impostazioni',

  // Common UI
  OK: 'OK',
  Yes: 'Sì',
  No: 'No',
  Settings: 'Impostazioni',
  Profile: 'Profilo',
  Manager: 'Manager',
  Participants: 'Partecipanti',
  Player: 'Giocatore',
  Champion: 'Campione',
  'Runner-up': 'Secondo classificato',
  Nickname: 'Soprannome',
  Email: 'Email',
  Password: 'Password',
  Logo: 'Logo',

  // Tennis specific
  'Pro Shop': 'Negozio Pro',
  Brunch: 'Brunch',
  Match: 'Partita',
  Tournament: 'Torneo',
  League: 'Lega',
  Score: 'Punteggio',
  Court: 'Campo',

  // Units
  km: 'km',
  mi: 'mi',

  // Time/Loading
  'Loading clubs...': 'Caricamento club...',
  'Loading trophies...': 'Caricamento trofei...',
  'Loading match history...': 'Caricamento storico partite...',
  'Loading data...': 'Caricamento dati...',

  // Settings
  'Notification Settings': 'Impostazioni Notifiche',
  'Profile Settings': 'Impostazioni Profilo',
  'App Settings': 'Impostazioni App',

  // Titles
  'Privacy Policy': 'Politica sulla Privacy',
  'Liability Disclaimer': 'Esclusione di Responsabilità',

  // Error messages
  Error: 'Errore',
  Failed: 'Fallito',
  Success: 'Successo',
  'Permission Required': 'Permesso Richiesto',
  'Permission Error': 'Errore Permesso',
};

// Function to translate text
function translateText(text) {
  // Check if it's a direct match
  if (TRANSLATIONS[text]) {
    return TRANSLATIONS[text];
  }

  // Check for partial matches and replace
  let translated = text;
  for (const [en, it] of Object.entries(TRANSLATIONS)) {
    const regex = new RegExp(en, 'g');
    translated = translated.replace(regex, it);
  }

  // If no translation found, return original
  return translated === text ? text : translated;
}

// Deep merge function
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

// Main function
function main() {
  console.log('🇮🇹 Starting Italian translation process...\n');

  // Read files
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const itPath = path.join(LOCALES_DIR, 'it.json');

  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));

  // Read untranslated keys
  const untranslatedPath = path.join(__dirname, 'untranslated-it.json');
  const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));

  console.log(`Found ${untranslated.length} untranslated keys\n`);

  // Create translations object
  const translations = {};
  let translatedCount = 0;
  let unchangedCount = 0;

  untranslated.forEach(({ key, enValue }) => {
    const translated = translateText(enValue);

    if (translated !== enValue) {
      translatedCount++;
    } else {
      unchangedCount++;
    }

    // Build nested object
    const parts = key.split('.');
    let current = translations;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = translated;
  });

  // Merge with existing Italian translations
  const merged = deepMerge(it, translations);

  // Write back to file
  fs.writeFileSync(itPath, JSON.stringify(merged, null, 2) + '\n');

  console.log('✅ Translation complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Automatically translated: ${translatedCount} keys`);
  console.log(`   - Needs manual review: ${unchangedCount} keys`);
  console.log(`   - Total processed: ${untranslated.length} keys\n`);
  console.log(`📝 Updated file: ${itPath}`);

  // Save review list for manual translation
  const needsReview = untranslated
    .filter(({ key, enValue }) => translateText(enValue) === enValue)
    .map(({ key, enValue }) => ({ key, enValue }));

  if (needsReview.length > 0) {
    const reviewPath = path.join(__dirname, 'needs-manual-translation-it.json');
    fs.writeFileSync(reviewPath, JSON.stringify(needsReview, null, 2));
    console.log(`\n⚠️  Keys needing manual translation saved to: ${reviewPath}`);
  }
}

main();
