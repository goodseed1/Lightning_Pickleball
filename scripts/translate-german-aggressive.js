#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const DE_PATH = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));

// Comprehensive German dictionary (English -> German)
const dictionary = {
  // Actions
  Save: 'Speichern',
  'Saved!': 'Gespeichert!',
  Cancel: 'Abbrechen',
  Delete: 'Löschen',
  Edit: 'Bearbeiten',
  Add: 'Hinzufügen',
  Remove: 'Entfernen',
  Close: 'Schließen',
  Back: 'Zurück',
  Next: 'Weiter',
  Previous: 'Zurück',
  Done: 'Fertig',
  Finish: 'Fertigstellen',
  Continue: 'Weiter',
  Submit: 'Absenden',
  Confirm: 'Bestätigen',
  Apply: 'Anwenden',
  Update: 'Aktualisieren',
  Refresh: 'Aktualisieren',
  Reload: 'Neu laden',
  Retry: 'Erneut versuchen',
  Skip: 'Überspringen',
  View: 'Ansehen',
  Share: 'Teilen',
  Send: 'Senden',
  Create: 'Erstellen',
  Join: 'Beitreten',
  Leave: 'Verlassen',
  Register: 'Anmelden',
  Login: 'Anmelden',
  Logout: 'Abmelden',

  // Status
  Loading: 'Lädt',
  Processing: 'Wird verarbeitet',
  Saving: 'Wird gespeichert',
  Deleting: 'Wird gelöscht',
  Uploading: 'Wird hochgeladen',
  Downloading: 'Wird heruntergeladen',
  Pending: 'Ausstehend',
  Active: 'Aktiv',
  Inactive: 'Inaktiv',
  Completed: 'Abgeschlossen',
  Cancelled: 'Abgesagt',
  Confirmed: 'Bestätigt',
  Rejected: 'Abgelehnt',
  Approved: 'Genehmigt',

  // Messages
  'Success!': 'Erfolg!',
  'Error!': 'Fehler!',
  'Failed!': 'Fehlgeschlagen!',
  'Warning!': 'Warnung!',
  'Please wait...': 'Bitte warten...',
  'Loading...': 'Lädt...',
  'No data': 'Keine Daten',
  'No results': 'Keine Ergebnisse',
  'Not found': 'Nicht gefunden',
  Unknown: 'Unbekannt',
  Required: 'Erforderlich',
  Optional: 'Optional',
  All: 'Alle',
  None: 'Keine',
  Other: 'Sonstiges',

  // Common errors
  'An error occurred': 'Ein Fehler ist aufgetreten',
  'Permission denied': 'Zugriff verweigert',
  'Invalid data': 'Ungültige Daten',
  'Network error': 'Netzwerkfehler',
  'Server error': 'Serverfehler',
  'Not authorized': 'Nicht autorisiert',

  // Common success messages
  'Successfully created': 'Erfolgreich erstellt',
  'Successfully updated': 'Erfolgreich aktualisiert',
  'Successfully deleted': 'Erfolgreich gelöscht',
  'Successfully saved': 'Erfolgreich gespeichert',
  'Successfully promoted': 'Erfolgreich befördert',
  'Successfully demoted': 'Erfolgreich degradiert',

  // User actions
  'You cannot remove yourself': 'Sie können sich nicht selbst entfernen',
  'Cannot remove the owner': 'Der Besitzer kann nicht entfernt werden',
  'Are you sure': 'Sind Sie sicher',

  // Tennis terms
  Match: 'Match',
  Matches: 'Matches',
  Tournament: 'Turnier',
  League: 'Liga',
  Club: 'Verein',
  Player: 'Spieler',
  Member: 'Mitglied',
  Court: 'Platz',
  Score: 'Ergebnis',
  Winner: 'Sieger',
  Set: 'Satz',
  Game: 'Spiel',
  Point: 'Punkt',

  // Time
  Today: 'Heute',
  Yesterday: 'Gestern',
  Tomorrow: 'Morgen',
  Week: 'Woche',
  Month: 'Monat',
  Year: 'Jahr',
  Day: 'Tag',
  Monday: 'Montag',
  Tuesday: 'Dienstag',
  Wednesday: 'Mittwoch',
  Thursday: 'Donnerstag',
  Friday: 'Freitag',
  Saturday: 'Samstag',
  Sunday: 'Sonntag',
};

// Sentence patterns (for complex translations)
const patterns = [
  {
    en: /^Each user can create a maximum of {{max}} clubs/,
    de: 'Jeder Benutzer kann maximal {{max}} Vereine erstellen',
  },
  {
    en: /^You currently own {{current}} club/,
    de: 'Sie besitzen derzeit {{current}} Verein(e)',
  },
  {
    en: /^{{name}} club information has been saved/,
    de: 'Die Informationen des Vereins {{name}} wurden gespeichert',
  },
  {
    en: /^{{name}} club has been successfully created/,
    de: 'Der Verein {{name}} wurde erfolgreich erstellt',
  },
  {
    en: /Successfully promoted to (.+)/,
    de: 'Erfolgreich zum $1 befördert',
  },
  {
    en: /Successfully demoted to (.+)/,
    de: 'Erfolgreich zum $1 degradiert',
  },
  {
    en: /Permission denied\. Only (.+) can perform this action/,
    de: 'Zugriff verweigert. Nur $1 können diese Aktion ausführen',
  },
  {
    en: /Cannot remove the (.+) owner/,
    de: 'Der $1-Besitzer kann nicht entfernt werden',
  },
];

function translateText(text) {
  if (!text || typeof text !== 'string') return text;

  // Check patterns first
  for (const pattern of patterns) {
    if (pattern.en.test(text)) {
      return text.replace(pattern.en, pattern.de);
    }
  }

  // Try exact dictionary match
  if (dictionary[text]) {
    return dictionary[text];
  }

  // Try word-by-word replacement
  let translated = text;
  for (const [eng, ger] of Object.entries(dictionary)) {
    const regex = new RegExp(`\\b${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translated = translated.replace(regex, ger);
  }

  // If changed, return translation
  if (translated !== text) {
    return translated;
  }

  return text; // Return original if no translation found
}

// Recursive translation
function translateDeep(enObj, deObj) {
  const result = { ...deObj };

  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj[key];

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      result[key] = translateDeep(enValue, deValue || {});
    } else if (typeof enValue === 'string') {
      // Only translate if untranslated
      if (!deValue || deValue === enValue) {
        const translated = translateText(enValue);
        result[key] = translated;
      } else {
        result[key] = deValue;
      }
    } else {
      result[key] = deValue !== undefined ? deValue : enValue;
    }
  }

  return result;
}

function countUntranslated(enObj, deObj) {
  let count = 0;

  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj ? deObj[key] : undefined;

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      count += countUntranslated(enValue, deValue || {});
    } else if (typeof enValue === 'string') {
      if (!deValue || deValue === enValue) {
        count++;
      }
    }
  }

  return count;
}

console.log('\n🇩🇪 AGGRESSIVE GERMAN TRANSLATION\n');
console.log('='.repeat(70));

const before = countUntranslated(en, de);
console.log(`📊 Before: ${before} untranslated keys`);

const updated = translateDeep(en, de);

const after = countUntranslated(en, updated);
const translated = before - after;

console.log(`✅ Translated: ${translated} keys`);
console.log(`📊 Remaining: ${after} keys`);

if (translated > 0) {
  const percent = ((translated / before) * 100).toFixed(1);
  console.log(`📈 Progress: ${percent}%`);

  fs.writeFileSync(DE_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`💾 Saved: ${DE_PATH}`);
} else {
  console.log('⚠️  No new translations');
}

console.log('='.repeat(70));
console.log('✨ Done!\n');
