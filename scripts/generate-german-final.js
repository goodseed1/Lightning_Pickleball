const fs = require('fs');
const path = require('path');

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

// Comprehensive German translation dictionary
// This maps English strings to their German equivalents
const translations = {
  // Common
  Search: 'Suchen',
  Filter: 'Filtern',
  Sort: 'Sortieren',
  Add: 'Hinzufügen',
  Remove: 'Entfernen',
  Edit: 'Bearbeiten',
  Delete: 'Löschen',
  Save: 'Speichern',
  Cancel: 'Abbrechen',
  Confirm: 'Bestätigen',
  OK: 'OK',
  Yes: 'Ja',
  No: 'Nein',
  Back: 'Zurück',
  Next: 'Weiter',
  Previous: 'Zurück',
  Continue: 'Fortfahren',
  Skip: 'Überspringen',
  Finish: 'Beenden',
  Close: 'Schließen',
  Open: 'Öffnen',
  View: 'Ansehen',
  Show: 'Anzeigen',
  Hide: 'Ausblenden',
  Loading: 'Laden',
  Error: 'Fehler',
  Success: 'Erfolg',
  Warning: 'Warnung',
  Info: 'Info',
  Required: 'Erforderlich',
  Optional: 'Optional',
  Select: 'Auswählen',
  Upload: 'Hochladen',
  Download: 'Herunterladen',
  Share: 'Teilen',
  Copy: 'Kopieren',
  Paste: 'Einfügen',
  Cut: 'Ausschneiden',
  Undo: 'Rückgängig',
  Redo: 'Wiederholen',
  Refresh: 'Aktualisieren',
  Update: 'Aktualisieren',
  Create: 'Erstellen',
  New: 'Neu',
  Submit: 'Absenden',
  Send: 'Senden',
  Receive: 'Empfangen',
  Reply: 'Antworten',
  Forward: 'Weiterleiten',
  Print: 'Drucken',
  Export: 'Exportieren',
  Import: 'Importieren',
  Settings: 'Einstellungen',
  Preferences: 'Einstellungen',
  Options: 'Optionen',
  Help: 'Hilfe',
  About: 'Über',
  More: 'Mehr',
  Less: 'Weniger',

  // Status
  Active: 'Aktiv',
  Inactive: 'Inaktiv',
  Pending: 'Ausstehend',
  Approved: 'Genehmigt',
  Rejected: 'Abgelehnt',
  Cancelled: 'Abgesagt',
  Completed: 'Abgeschlossen',
  Failed: 'Fehlgeschlagen',
  Processing: 'Verarbeitung läuft',
  Enabled: 'Aktiviert',
  Disabled: 'Deaktiviert',
  Available: 'Verfügbar',
  Unavailable: 'Nicht verfügbar',
  Online: 'Online',
  Offline: 'Offline',
  Public: 'Öffentlich',
  Private: 'Privat',
  Draft: 'Entwurf',
  Published: 'Veröffentlicht',

  // Time
  Today: 'Heute',
  Tomorrow: 'Morgen',
  Yesterday: 'Gestern',
  Now: 'Jetzt',
  Soon: 'Bald',
  Later: 'Später',
  Never: 'Nie',
  Always: 'Immer',
  Daily: 'Täglich',
  Weekly: 'Wöchentlich',
  Monthly: 'Monatlich',
  Yearly: 'Jährlich',
  Date: 'Datum',
  Time: 'Zeit',
  Duration: 'Dauer',
  Start: 'Start',
  End: 'Ende',
  From: 'Von',
  To: 'Bis',
  At: 'Um',
  On: 'Am',
  In: 'In',
  Before: 'Vor',
  After: 'Nach',
  Between: 'Zwischen',

  // Numbers
  First: 'Erste',
  Second: 'Zweite',
  Third: 'Dritte',
  Last: 'Letzte',
  All: 'Alle',
  None: 'Keine',
  Some: 'Einige',
  Any: 'Beliebig',
  Many: 'Viele',
  Few: 'Wenige',
  Several: 'Mehrere',
  Total: 'Gesamt',
  Count: 'Anzahl',
  Number: 'Nummer',
  Amount: 'Betrag',
  Min: 'Min',
  Max: 'Max',
  Average: 'Durchschnitt',

  // User/Profile
  Profile: 'Profil',
  Account: 'Konto',
  User: 'Benutzer',
  Name: 'Name',
  Email: 'E-Mail',
  Phone: 'Telefon',
  Address: 'Adresse',
  City: 'Stadt',
  State: 'Bundesland',
  Country: 'Land',
  Location: 'Ort',
  Photo: 'Foto',
  Avatar: 'Avatar',
  Bio: 'Biografie',
  Description: 'Beschreibung',

  // Tennis specific
  Match: 'Match',
  Matches: 'Matches',
  Tournament: 'Turnier',
  League: 'Liga',
  Club: 'Club',
  Event: 'Event',
  Player: 'Spieler',
  Team: 'Team',
  Court: 'Platz',
  Score: 'Ergebnis',
  Win: 'Sieg',
  Loss: 'Niederlage',
  Draw: 'Unentschieden',
  Rank: 'Rang',
  Level: 'Niveau',
  Singles: 'Einzel',
  Doubles: 'Doppel',
  Mixed: 'Mixed',
  Set: 'Satz',
  Game: 'Spiel',
  Point: 'Punkt',
  Serve: 'Aufschlag',
  Return: 'Return',
  Ace: 'Ass',
  Fault: 'Fehler',
  Let: 'Netzberührung',
  Deuce: 'Einstand',
  Advantage: 'Vorteil',
  Tiebreak: 'Tiebreak',
  Indoor: 'Indoor',
  Outdoor: 'Outdoor',
  Hard: 'Hartplatz',
  Clay: 'Sand',
  Grass: 'Rasen',
  Beginner: 'Anfänger',
  Intermediate: 'Fortgeschritten',
  Advanced: 'Erfahren',
  Expert: 'Experte',
  Professional: 'Profi',

  // Messages/Communication
  Message: 'Nachricht',
  Messages: 'Nachrichten',
  Chat: 'Chat',
  Comment: 'Kommentar',
  Post: 'Beitrag',
  Announcement: 'Ankündigung',
  Notification: 'Benachrichtigung',
  Alert: 'Warnung',
  Reminder: 'Erinnerung',
  Invite: 'Einladen',
  Invitation: 'Einladung',
  Request: 'Anfrage',
  Response: 'Antwort',

  // Actions
  Join: 'Beitreten',
  Leave: 'Verlassen',
  Follow: 'Folgen',
  Unfollow: 'Nicht mehr folgen',
  Like: 'Gefällt mir',
  Unlike: 'Gefällt mir nicht mehr',
  Favorite: 'Favorit',
  Subscribe: 'Abonnieren',
  Unsubscribe: 'Abbestellen',
  Register: 'Registrieren',
  Unregister: 'Abmelden',
  Login: 'Anmelden',
  Logout: 'Abmelden',
  Signup: 'Registrieren',
  Connect: 'Verbinden',
  Disconnect: 'Trennen',
  Accept: 'Akzeptieren',
  Decline: 'Ablehnen',
  Approve: 'Genehmigen',
  Reject: 'Ablehnen',
  Block: 'Blockieren',
  Unblock: 'Entsperren',
  Mute: 'Stumm schalten',
  Unmute: 'Stumm aufheben',
  Report: 'Melden',

  // Content
  Title: 'Titel',
  Subtitle: 'Untertitel',
  Content: 'Inhalt',
  Text: 'Text',
  Image: 'Bild',
  Video: 'Video',
  Audio: 'Audio',
  File: 'Datei',
  Document: 'Dokument',
  Folder: 'Ordner',
  Link: 'Link',
  URL: 'URL',
  Tag: 'Tag',
  Category: 'Kategorie',
  Type: 'Typ',
  Format: 'Format',
  Size: 'Größe',
  Quality: 'Qualität',

  // List/Grid
  List: 'Liste',
  Grid: 'Raster',
  Table: 'Tabelle',
  Row: 'Zeile',
  Column: 'Spalte',
  Cell: 'Zelle',
  Item: 'Element',
  Items: 'Elemente',
  Entry: 'Eintrag',
  Record: 'Datensatz',
  Page: 'Seite',

  // Navigation
  Home: 'Startseite',
  Dashboard: 'Dashboard',
  Menu: 'Menü',
  Navigation: 'Navigation',
  Breadcrumb: 'Brotkrume',
  Tab: 'Tab',
  Section: 'Abschnitt',
  Panel: 'Panel',
  Card: 'Karte',
  Modal: 'Modal',
  Dialog: 'Dialog',
  Popup: 'Popup',
  Dropdown: 'Dropdown',
  Sidebar: 'Seitenleiste',
  Header: 'Kopfzeile',
  Footer: 'Fußzeile',

  // Forms
  Form: 'Formular',
  Field: 'Feld',
  Input: 'Eingabe',
  Output: 'Ausgabe',
  Button: 'Schaltfläche',
  Checkbox: 'Kontrollkästchen',
  Radio: 'Radio',
  Switch: 'Schalter',
  Slider: 'Schieberegler',
  Picker: 'Auswahl',
  Calendar: 'Kalender',
  Label: 'Bezeichnung',
  Placeholder: 'Platzhalter',
  Value: 'Wert',
  Default: 'Standard',
  Custom: 'Benutzerdefiniert',

  // Validation
  Valid: 'Gültig',
  Invalid: 'Ungültig',
  'Required field': 'Pflichtfeld',
  'Optional field': 'Optionales Feld',
  'Validation error': 'Validierungsfehler',
  'Please enter': 'Bitte eingeben',
  'Please select': 'Bitte auswählen',
  'Please check': 'Bitte prüfen',
  'Please confirm': 'Bitte bestätigen',
  'Please wait': 'Bitte warten',
  'Try again': 'Erneut versuchen',

  // State
  Empty: 'Leer',
  Full: 'Voll',
  New: 'Neu',
  Old: 'Alt',
  Current: 'Aktuell',
  Recent: 'Kürzlich',
  Popular: 'Beliebt',
  Featured: 'Empfohlen',
  Recommended: 'Empfohlen',
  Trending: 'Im Trend',
  Archived: 'Archiviert',
  Deleted: 'Gelöscht',
  Hidden: 'Verborgen',
  Visible: 'Sichtbar',
  Locked: 'Gesperrt',
  Unlocked: 'Entsperrt',

  // Permissions
  Permission: 'Berechtigung',
  Access: 'Zugriff',
  Role: 'Rolle',
  Owner: 'Eigentümer',
  Admin: 'Administrator',
  Moderator: 'Moderator',
  Member: 'Mitglied',
  Guest: 'Gast',
  Viewer: 'Betrachter',
  Editor: 'Bearbeiter',
  Manager: 'Manager',
  Public: 'Öffentlich',
  Private: 'Privat',
  Shared: 'Geteilt',
  Restricted: 'Eingeschränkt',

  // Payment/Price
  Price: 'Preis',
  Cost: 'Kosten',
  Fee: 'Gebühr',
  Free: 'Kostenlos',
  Paid: 'Bezahlt',
  Premium: 'Premium',
  Payment: 'Zahlung',
  Invoice: 'Rechnung',
  Receipt: 'Beleg',
  Transaction: 'Transaktion',
  Refund: 'Rückerstattung',
  Discount: 'Rabatt',
  Tax: 'Steuer',
  Total: 'Gesamt',
  Subtotal: 'Zwischensumme',

  // Search/Filter
  Search: 'Suchen',
  Find: 'Finden',
  Filter: 'Filter',
  'Sort by': 'Sortieren nach',
  Orderby: 'Sortieren nach',
  Ascending: 'Aufsteigend',
  Descending: 'Absteigend',
  Newest: 'Neueste',
  Oldest: 'Älteste',
  Name: 'Name',
  Date: 'Datum',
  Relevance: 'Relevanz',
  Distance: 'Entfernung',
  Rating: 'Bewertung',
  Popularity: 'Beliebtheit',

  // Statistics
  Statistics: 'Statistiken',
  Stats: 'Statistiken',
  Analytics: 'Analytics',
  Report: 'Bericht',
  Summary: 'Zusammenfassung',
  Overview: 'Übersicht',
  Details: 'Details',
  Graph: 'Graph',
  Chart: 'Diagramm',
  Data: 'Daten',
  Metrics: 'Metriken',
  Performance: 'Leistung',
  Progress: 'Fortschritt',
  History: 'Verlauf',
  Activity: 'Aktivität',

  // Social
  Friend: 'Freund',
  Friends: 'Freunde',
  Follower: 'Follower',
  Followers: 'Follower',
  Following: 'Folge ich',
  Connection: 'Verbindung',
  Network: 'Netzwerk',
  Community: 'Gemeinschaft',
  Group: 'Gruppe',
  Social: 'Sozial',
  Feed: 'Feed',
  Timeline: 'Zeitachse',
  Stream: 'Stream',

  // Device/Platform
  Device: 'Gerät',
  Mobile: 'Mobil',
  Desktop: 'Desktop',
  Tablet: 'Tablet',
  Phone: 'Telefon',
  Computer: 'Computer',
  Browser: 'Browser',
  App: 'App',
  Application: 'Anwendung',
  Platform: 'Plattform',
  System: 'System',
  Version: 'Version',

  // Connectivity
  Online: 'Online',
  Offline: 'Offline',
  Connected: 'Verbunden',
  Disconnected: 'Getrennt',
  Syncing: 'Synchronisierung läuft',
  Synced: 'Synchronisiert',
  Network: 'Netzwerk',
  Internet: 'Internet',
  WiFi: 'WLAN',
  Connection: 'Verbindung',

  // Debug/Development
  Debug: 'Debuggen',
  Console: 'Konsole',
  Log: 'Protokoll',
  Warning: 'Warnung',
  Info: 'Info',
  Verbose: 'Ausführlich',
  Test: 'Test',
  Demo: 'Demo',
  Preview: 'Vorschau',
  Beta: 'Beta',
  Alpha: 'Alpha',
  Development: 'Entwicklung',
  Production: 'Produktion',
};

// Function to auto-translate common patterns
function autoTranslate(text) {
  // Check if we have a direct translation
  if (translations[text]) {
    return translations[text];
  }

  // Handle template strings ({{variable}})
  const templateMatch = text.match(/\{\{.*?\}\}/g);
  if (templateMatch) {
    let translated = text;
    // Find the base text without templates
    const baseText = text.replace(/\{\{.*?\}\}/g, '').trim();
    if (translations[baseText]) {
      // Preserve template variables in translation
      return text.replace(baseText, translations[baseText]);
    }
  }

  // Handle plurals (ends with 's')
  if (text.endsWith('s')) {
    const singular = text.slice(0, -1);
    if (translations[singular]) {
      return translations[singular]; // German often uses same form
    }
  }

  // Handle common suffixes
  const suffixPatterns = [
    { en: ' required', de: ' erforderlich' },
    { en: ' optional', de: ' optional' },
    { en: ' settings', de: '-Einstellungen' },
    { en: ' not found', de: ' nicht gefunden' },
    { en: ' failed', de: ' fehlgeschlagen' },
    { en: ' success', de: ' erfolgreich' },
    { en: ' error', de: '-Fehler' },
    { en: ' loading', de: ' laden' },
    { en: ' completed', de: ' abgeschlossen' },
    { en: ' pending', de: ' ausstehend' },
    { en: ' cancelled', de: ' abgesagt' },
    { en: ' confirmed', de: ' bestätigt' },
    { en: ' updated', de: ' aktualisiert' },
    { en: ' deleted', de: ' gelöscht' },
    { en: ' created', de: ' erstellt' },
  ];

  for (const pattern of suffixPatterns) {
    if (text.endsWith(pattern.en)) {
      const base = text.slice(0, -pattern.en.length);
      return base + pattern.de;
    }
  }

  // Return original if no translation found
  return text;
}

// Recursively translate all strings in the object
function translateObject(obj) {
  if (typeof obj === 'string') {
    return autoTranslate(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(translateObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const key in obj) {
      result[key] = translateObject(obj[key]);
    }
    return result;
  }
  return obj;
}

// Load files
const enPath = path.join(__dirname, '../src/locales/en.json');
const dePath = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Find and translate all missing keys
function findAndTranslateMissing(enObj, deObj, path = '') {
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enVal = enObj[key];
    let deVal = deObj[key];

    if (typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)) {
      if (!deObj[key] || typeof deObj[key] !== 'object') {
        deObj[key] = {};
      }
      findAndTranslateMissing(enVal, deObj[key], currentPath);
    } else if (typeof enVal === 'string') {
      // If German value equals English or is missing, translate it
      if (!deVal || deVal === enVal) {
        deObj[key] = autoTranslate(enVal);
      }
    } else {
      // Copy non-string, non-object values as-is
      if (deVal === undefined) {
        deObj[key] = enVal;
      }
    }
  }
}

findAndTranslateMissing(en, de);

// Write back
fs.writeFileSync(dePath, JSON.stringify(de, null, 2), 'utf8');

console.log('✅ German translation complete!');
console.log('📝 Base translations: ' + Object.keys(translations).length);
console.log('\nVerifying...');

// Count remaining untranslated
function countUntranslated(enObj, deObj) {
  let count = 0;
  for (const key in enObj) {
    const enVal = enObj[key];
    const deVal = deObj ? deObj[key] : undefined;
    if (typeof enVal === 'object' && enVal !== null) {
      count += countUntranslated(enVal, deVal);
    } else if (typeof enVal === 'string' && enVal === deVal && enVal.length > 2) {
      count++;
    }
  }
  return count;
}

const remaining = countUntranslated(en, de);
console.log('Remaining untranslated keys: ' + remaining);
