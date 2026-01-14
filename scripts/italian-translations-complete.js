#!/usr/bin/env node
/**
 * Complete Italian Translation Dictionary
 * Professional translations for Lightning Tennis app
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Comprehensive translation dictionary
const COMPREHENSIVE_TRANSLATIONS = {
  // Common actions & UI
  'Loading clubs...': 'Caricamento club...',
  'Loading trophies...': 'Caricamento trofei...',
  'Loading match history...': 'Caricamento storico partite...',
  'Loading data...': 'Caricamento dati...',
  'Notification Settings': 'Impostazioni Notifiche',
  'Profile Settings': 'Impostazioni Profilo',
  'App Settings': 'Impostazioni App',
  'Open Settings': 'Apri Impostazioni',
  'Camera Permission Required': 'Permesso Fotocamera Richiesto',
  'Gallery Permission Required': 'Permesso Galleria Richiesto',
  'Permission Error': 'Errore Permesso',

  // Tournament Management
  'Generating Bracket': 'Generazione Tabellone',
  'Participants Overview': 'Panoramica Partecipanti',
  'Current Participants': 'Partecipanti Attuali',
  'Max Participants': 'Partecipanti Massimi',
  'Participants List': 'Lista Partecipanti',
  participants: 'partecipanti',
  'Player 1': 'Giocatore 1',
  'Player 2': 'Giocatore 2',

  // League Detail
  'Error deleting league.': "Errore durante l'eliminazione della lega.",
  'Remove Participant': 'Rimuovi Partecipante',
  'Admin Correction': 'Correzione Amministratore',
  'Admin Schedule Change': 'Modifica Programma Admin',
  'Admin Walkover': 'Walkover Amministratore',
  'Runner-up': 'Secondo Classificato',

  // Dues Management
  'Create Dues Record': 'Crea Record Quote',
  'Edit Dues Settings': 'Modifica Impostazioni Quote',
  Venmo: 'Venmo',

  // Services & Permissions
  'Camera permission is needed to take profile photos.':
    'Il permesso della fotocamera è necessario per scattare foto profilo.',
  'Gallery access permission is needed to select photos.':
    'Il permesso di accesso alla galleria è necessario per selezionare foto.',
  'An error occurred while requesting permissions.':
    'Si è verificato un errore durante la richiesta dei permessi.',
  'An error occurred while taking photo.':
    'Si è verificato un errore durante lo scatto della foto.',
  'Gallery Access Error': 'Errore Accesso Galleria',

  // Settings & Configuration
  'Please enter valid dues amount': 'Inserisci un importo valido per le quote',
  'Due day must be between 1-31': 'Il giorno di scadenza deve essere compreso tra 1-31',
  'Save Failed': 'Salvataggio Fallito',
  'Error occurred while saving settings':
    'Si è verificato un errore durante il salvataggio delle impostazioni',
  'Failed to load data': 'Caricamento dati fallito',
  'Input Error': 'Errore di Input',

  // Legal & Policy
  'Privacy Policy': 'Informativa sulla Privacy',
  'Location-Based Services Terms': 'Termini dei Servizi Basati sulla Posizione',
  'Liability Disclaimer': 'Esclusione di Responsabilità',
  'Marketing Communications Consent': 'Consenso alle Comunicazioni di Marketing',
  'Diversity & Inclusion Policy': 'Politica di Diversità e Inclusione',

  // Notifications & Distance
  'Receive notifications for new lightning matches': 'Ricevi notifiche per nuove partite lightning',
  'Club Event Notifications': 'Notifiche Eventi Club',
  'Receive notifications for club meetups': 'Ricevi notifiche per incontri del club',
  'Notification Distance Range': 'Intervallo Distanza Notifiche',
  'miles away': 'miglia di distanza',
  mile: 'miglio',
  miles: 'miglia',

  // Match & Event related
  'Match Request': 'Richiesta Partita',
  'Score Confirmation': 'Conferma Punteggio',
  'Record Score': 'Registra Punteggio',
  'Rate Sportsmanship': 'Valuta Sportività',
  'Meetup Detail': 'Dettagli Incontro',
  'Event Participation': 'Partecipazione Evento',
  'Event Detail': 'Dettagli Evento',
  'Tournament Detail': 'Dettagli Torneo',

  // Club Management
  'Club Policies': 'Regolamenti Club',
  'Club Overview': 'Panoramica Club',
  'Club Communication': 'Comunicazioni Club',
  'Club Detail': 'Dettagli Club',
  'Role Management': 'Gestione Ruoli',
  'Manage Announcement': 'Gestisci Annunci',
  'Find Club': 'Trova Club',

  // Profile & User
  'Edit Profile': 'Modifica Profilo',
  'Performance Dashboard': 'Dashboard Prestazioni',
  'Badge Gallery': 'Galleria Distintivi',
  'Hall of Fame': 'Hall of Fame',
  'My Activities': 'Le Mie Attività',
  'User Activity': 'Attività Utente',

  // AI & Matching
  'AI Matching': 'Abbinamento AI',
  'AI Chat': 'Chat AI',

  // Common Phrases
  'Which type of record would you like to create for this member':
    'Quale tipo di record desideri creare per questo membro',
  'has been removed from the league': 'è stato rimosso dalla lega',
  'would you like to': 'vorresti',
  'There was a problem': "C'è stato un problema",
  'An error occurred': 'Si è verificato un errore',
  'Please check': 'Per favore controlla',
  'You can': 'Puoi',
  'Do you want to': 'Vuoi',
  'Are you sure': 'Sei sicuro',
  Successfully: 'Con successo',
  'Failed to': 'Impossibile',
  'Unable to': 'Impossibile',
  'Try again': 'Riprova',
  'Not available': 'Non disponibile',
  Required: 'Obbligatorio',
  Optional: 'Facoltativo',
};

// Function to translate a single string
function translateString(text) {
  if (!text || typeof text !== 'string') return text;

  // Check direct match
  if (COMPREHENSIVE_TRANSLATIONS[text]) {
    return COMPREHENSIVE_TRANSLATIONS[text];
  }

  // Check for partial matches and build translation
  let translated = text;
  let hasTranslation = false;

  // Sort by length (longest first) to avoid partial replacements
  const sortedEntries = Object.entries(COMPREHENSIVE_TRANSLATIONS).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [en, it] of sortedEntries) {
    if (translated.includes(en)) {
      translated = translated.replace(new RegExp(en, 'g'), it);
      hasTranslation = true;
    }
  }

  return hasTranslation ? translated : text;
}

// Deep set function to set nested values
function deepSet(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
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
  console.log('🇮🇹 Starting comprehensive Italian translation...\n');

  // Read files
  const itPath = path.join(LOCALES_DIR, 'it.json');
  const untranslatedPath = path.join(__dirname, 'needs-manual-translation-it.json');

  const it = JSON.parse(fs.readFileSync(itPath, 'utf8'));
  const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));

  console.log(`Processing ${untranslated.length} untranslated keys...\n`);

  const updates = {};
  let fullyTranslated = 0;
  let partiallyTranslated = 0;
  let unchanged = 0;

  untranslated.forEach(({ key, enValue }) => {
    const translated = translateString(enValue);

    if (translated !== enValue) {
      deepSet(updates, key, translated);
      if (!translated.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/)) {
        fullyTranslated++;
      } else {
        partiallyTranslated++;
      }
    } else {
      unchanged++;
    }
  });

  // Merge with existing translations
  const merged = deepMerge(it, updates);

  // Write back
  fs.writeFileSync(itPath, JSON.stringify(merged, null, 2) + '\n');

  console.log('✅ Translation complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Fully translated: ${fullyTranslated} keys`);
  console.log(`   - Partially translated: ${partiallyTranslated} keys`);
  console.log(`   - Still unchanged: ${unchanged} keys`);
  console.log(`   - Total processed: ${untranslated.length} keys\n`);
  console.log(`📝 Updated file: ${itPath}`);

  // Re-run untranslated check
  const { execSync } = require('child_process');
  execSync('node scripts/find-untranslated-keys.js', { stdio: 'inherit' });
}

main();
