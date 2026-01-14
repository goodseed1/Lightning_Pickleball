#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const DE_PATH = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));

// Auto-translation function for common patterns
function autoTranslate(englishText) {
  if (!englishText || typeof englishText !== 'string') return englishText;

  // Common word replacements (English -> German)
  const replacements = {
    // Actions
    Save: 'Speichern',
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
    Unregister: 'Abmelden',
    Login: 'Anmelden',
    Logout: 'Abmelden',
    'Sign In': 'Anmelden',
    'Sign Up': 'Registrieren',
    'Sign Out': 'Abmelden',

    // Status
    Loading: 'Lädt',
    Processing: 'Verarbeitet',
    Pending: 'Ausstehend',
    Active: 'Aktiv',
    Inactive: 'Inaktiv',
    Completed: 'Abgeschlossen',
    Cancelled: 'Abgesagt',
    Confirmed: 'Bestätigt',
    Rejected: 'Abgelehnt',
    Approved: 'Genehmigt',

    // Common words
    Yes: 'Ja',
    No: 'Nein',
    OK: 'OK',
    Error: 'Fehler',
    Success: 'Erfolg',
    Warning: 'Warnung',
    Info: 'Info',
    Search: 'Suchen',
    Filter: 'Filter',
    Sort: 'Sortieren',
    Settings: 'Einstellungen',
    Profile: 'Profil',
    Home: 'Startseite',
    Dashboard: 'Übersicht',
    Title: 'Titel',
    Name: 'Name',
    Description: 'Beschreibung',
    Date: 'Datum',
    Time: 'Uhrzeit',
    Location: 'Standort',
    Address: 'Adresse',
    City: 'Stadt',
    State: 'Bundesland',
    Country: 'Land',
    Email: 'E-Mail',
    Phone: 'Telefon',
    Website: 'Website',
    Status: 'Status',
    Details: 'Details',
    Overview: 'Überblick',
    Summary: 'Zusammenfassung',
    Total: 'Gesamt',
    Count: 'Anzahl',
    Amount: 'Betrag',
    Price: 'Preis',
    Fee: 'Gebühr',
    Cost: 'Kosten',

    // Pickleball-specific
    Match: 'Match',
    Matches: 'Matches',
    Tournament: 'Turnier',
    Tournaments: 'Turniere',
    League: 'Liga',
    Leagues: 'Ligen',
    Club: 'Verein',
    Clubs: 'Vereine',
    Player: 'Spieler',
    Players: 'Spieler',
    Member: 'Mitglied',
    Members: 'Mitglieder',
    Team: 'Team',
    Teams: 'Teams',
    Court: 'Platz',
    Courts: 'Plätze',
    Score: 'Ergebnis',
    Scores: 'Ergebnisse',
    Ranking: 'Rangliste',
    Rankings: 'Ranglisten',
    'Skill Level': 'Spielstärke',
    Singles: 'Einzel',
    Doubles: 'Doppel',
    Mixed: 'Mixed',
    Winner: 'Sieger',
    Loser: 'Verlierer',
    Champion: 'Champion',
    Set: 'Satz',
    Sets: 'Sätze',
    Game: 'Spiel',
    Games: 'Spiele',
    Point: 'Punkt',
    Points: 'Punkte',
    Win: 'Sieg',
    Wins: 'Siege',
    Loss: 'Niederlage',
    Losses: 'Niederlagen',
    Draw: 'Unentschieden',
    Draws: 'Unentschieden',

    // Time
    Today: 'Heute',
    Yesterday: 'Gestern',
    Tomorrow: 'Morgen',
    Week: 'Woche',
    Month: 'Monat',
    Year: 'Jahr',
    Day: 'Tag',
    Hour: 'Stunde',
    Minute: 'Minute',
    Second: 'Sekunde',

    // Messages
    'Loading...': 'Lädt...',
    'Please wait...': 'Bitte warten...',
    'No data': 'Keine Daten',
    'No results': 'Keine Ergebnisse',
    'Not found': 'Nicht gefunden',
    Unknown: 'Unbekannt',
    Required: 'Erforderlich',
    Optional: 'Optional',
    All: 'Alle',
    None: 'Keine',
    Other: 'Sonstiges',
    More: 'Mehr',
    Less: 'Weniger',
    Show: 'Anzeigen',
    Hide: 'Ausblenden',
    Expand: 'Erweitern',
    Collapse: 'Einklappen',
    Open: 'Öffnen',
    Select: 'Auswählen',
    Deselect: 'Abwählen',
    Clear: 'Löschen',
    Reset: 'Zurücksetzen',
    Download: 'Herunterladen',
    Upload: 'Hochladen',
    Export: 'Exportieren',
    Import: 'Importieren',
    Print: 'Drucken',
    Copy: 'Kopieren',
    Paste: 'Einfügen',
    Cut: 'Ausschneiden',
    Undo: 'Rückgängig',
    Redo: 'Wiederholen',

    // Notifications
    Notifications: 'Benachrichtigungen',
    Messages: 'Nachrichten',
    Alerts: 'Warnungen',
    Chat: 'Chat',
    Events: 'Events',
    Schedule: 'Spielplan',
    Results: 'Ergebnisse',
    Standings: 'Tabelle',
    Statistics: 'Statistiken',
    Stats: 'Stats',
    Rules: 'Regeln',
    Help: 'Hilfe',
    Support: 'Support',
    About: 'Über',
    Contact: 'Kontakt',
    Privacy: 'Datenschutz',
    Terms: 'AGB',
    Legal: 'Rechtliches',
  };

  let translated = englishText;

  // Try exact matches first
  for (const [eng, ger] of Object.entries(replacements)) {
    if (translated === eng) return ger;
  }

  // Then try word replacements
  for (const [eng, ger] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${eng}\\b`, 'g');
    translated = translated.replace(regex, ger);
  }

  return translated;
}

// Recursive translation
function translateRecursive(enObj, deObj) {
  const result = { ...deObj };

  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj[key];

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      result[key] = translateRecursive(enValue, deValue || {});
    } else if (typeof enValue === 'string') {
      // Only translate if untranslated (same as English or missing)
      if (!deValue || deValue === enValue) {
        result[key] = autoTranslate(enValue);
      } else {
        result[key] = deValue; // Keep existing translation
      }
    } else {
      result[key] = deValue !== undefined ? deValue : enValue;
    }
  }

  return result;
}

// Count untranslated
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

console.log('\n🇩🇪 COMPREHENSIVE GERMAN TRANSLATION\n');
console.log('='.repeat(70));

const beforeCount = countUntranslated(en, de);
console.log(`\n📊 Untranslated keys before: ${beforeCount}`);

// Apply auto-translation
const updated = translateRecursive(en, de);

const afterCount = countUntranslated(en, updated);
const translatedCount = beforeCount - afterCount;

console.log(`✅ Keys auto-translated: ${translatedCount}`);
console.log(`📊 Remaining untranslated: ${afterCount}`);

if (translatedCount > 0) {
  const progress = ((translatedCount / beforeCount) * 100).toFixed(1);
  console.log(`📈 Translation progress: ${progress}%`);

  // Save
  fs.writeFileSync(DE_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`\n💾 Saved to: ${DE_PATH}`);
} else {
  console.log('\n⚠️  No new translations applied');
}

console.log('='.repeat(70));
console.log('✨ Translation complete!\n');
