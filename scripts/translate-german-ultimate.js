#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const DE_PATH = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));

// Ultra-comprehensive phrase dictionary
const phrases = {
  // Complete sentences
  'Please enter your': 'Bitte geben Sie Ihre/Ihren',
  'Please enter': 'Bitte eingeben',
  'Please select': 'Bitte auswählen',
  'Please choose': 'Bitte wählen',
  'Please wait': 'Bitte warten',
  'Failed to load': 'Laden fehlgeschlagen',
  'Failed to save': 'Speichern fehlgeschlagen',
  'Failed to delete': 'Löschen fehlgeschlagen',
  'Failed to update': 'Aktualisieren fehlgeschlagen',
  'Failed to create': 'Erstellen fehlgeschlagen',
  'Failed to send': 'Senden fehlgeschlagen',
  'Successfully sent': 'Erfolgreich gesendet',
  'Successfully created': 'Erfolgreich erstellt',
  'Successfully updated': 'Erfolgreich aktualisiert',
  'Successfully deleted': 'Erfolgreich gelöscht',
  'Successfully saved': 'Erfolgreich gespeichert',
  'Successfully loaded': 'Erfolgreich geladen',
  'has been sent': 'wurde gesendet',
  'has been created': 'wurde erstellt',
  'has been updated': 'wurde aktualisiert',
  'has been deleted': 'wurde gelöscht',
  'has been saved': 'wurde gespeichert',
  'Cannot be empty': 'Darf nicht leer sein',
  'Cannot remove': 'Kann nicht entfernt werden',
  'Cannot delete': 'Kann nicht gelöscht werden',
  'Cannot update': 'Kann nicht aktualisiert werden',
  'Are you sure': 'Sind Sie sicher',
  'Do you want to': 'Möchten Sie',
  'Would you like to': 'Möchten Sie',
  'You must': 'Sie müssen',
  'You cannot': 'Sie können nicht',
  'You can': 'Sie können',
  'You have': 'Sie haben',
  'You need': 'Sie benötigen',
  'You are': 'Sie sind',
  'must be at least': 'muss mindestens sein',
  'must be': 'muss sein',
  'must include': 'muss enthalten',
  'must contain': 'muss enthalten',
  'is required': 'ist erforderlich',
  'is invalid': 'ist ungültig',
  'is too short': 'ist zu kurz',
  'is too long': 'ist zu lang',
  'is not available': 'ist nicht verfügbar',
  'is already': 'ist bereits',
  'No data available': 'Keine Daten verfügbar',
  'No results found': 'Keine Ergebnisse gefunden',
  'No items': 'Keine Elemente',
  'No content': 'Kein Inhalt',
  'Coming Soon': 'Demnächst',
  'Not available': 'Nicht verfügbar',
  'Not found': 'Nicht gefunden',
  'Try again': 'Erneut versuchen',
  'Load more': 'Mehr laden',

  // Tennis specific
  'Match count': 'Match-Anzahl',
  'Participant count': 'Teilnehmeranzahl',
  'Player count': 'Spieleranzahl',
  'Team count': 'Teamanzahl',
  'Partner invitation': 'Partner-Einladung',
  'Partner request': 'Partner-Anfrage',
  'Partner match': 'Partner-Match',
  'Skill level': 'Spielstärke',
  Nickname: 'Spitzname',
  'Chat message': 'Chat-Nachricht',
  'Event type': 'Event-Typ',
  'Tournament bracket': 'Turnierplan',
  Seeding: 'Setzung',
  'Round robin': 'Jeder gegen jeden',
  Elimination: 'Eliminierung',
  'Payment failed': 'Zahlung fehlgeschlagen',
  'Payment successful': 'Zahlung erfolgreich',
  'Dues payment': 'Beitragszahlung',
  'Application status': 'Bewerbungsstatus',
  'Badge count': 'Badge-Anzahl',
  'Auto refresh': 'Auto-Aktualisierung',
  'Password must': 'Passwort muss',
  'Email must': 'E-Mail muss',
  Characters: 'Zeichen',
  'characters long': 'Zeichen lang',
};

// Word-level translations
const words = {
  please: 'bitte',
  enter: 'eingeben',
  select: 'auswählen',
  choose: 'wählen',
  match: 'Match',
  matches: 'Matches',
  participants: 'Teilnehmer',
  participant: 'Teilnehmer',
  players: 'Spieler',
  player: 'Spieler',
  level: 'Stufe',
  email: 'E-Mail',
  payment: 'Zahlung',
  sent: 'gesendet',
  successfully: 'erfolgreich',
  partner: 'Partner',
  request: 'Anfrage',
  invitation: 'Einladung',
  dues: 'Beiträge',
  load: 'laden',
  name: 'Name',
  nickname: 'Spitzname',
  only: 'nur',
  chat: 'Chat',
  available: 'verfügbar',
  type: 'Typ',
  team: 'Team',
  bracket: 'Turnierplan',
  round: 'Runde',
  start: 'Start',
  complete: 'abschließen',
  current: 'aktuell',
  application: 'Bewerbung',
  location: 'Standort',
  status: 'Status',
  event: 'Event',
  password: 'Passwort',
  seed: 'setzen',
  date: 'Datum',
  badges: 'Badges',
  message: 'Nachricht',
  cannot: 'kann nicht',
  with: 'mit',
  again: 'erneut',
  result: 'Ergebnis',
  auto: 'Auto',
  must: 'muss',
  characters: 'Zeichen',
  will: 'wird',
  have: 'haben',
  your: 'Ihr/Ihre',
  been: 'wurde',
  failed: 'fehlgeschlagen',
  count: 'Anzahl',
};

function smartTranslate(text) {
  if (!text || typeof text !== 'string') return text;

  let translated = text;

  // Try phrase replacements first (longer matches)
  for (const [eng, ger] of Object.entries(phrases)) {
    if (translated.includes(eng)) {
      translated = translated.replace(new RegExp(eng, 'gi'), ger);
    }
  }

  // Then word replacements
  for (const [eng, ger] of Object.entries(words)) {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    translated = translated.replace(regex, ger);
  }

  return translated;
}

function translateDeep(enObj, deObj) {
  const result = { ...deObj };

  for (const key in enObj) {
    const enValue = enObj[key];
    const deValue = deObj[key];

    if (enValue && typeof enValue === 'object' && !Array.isArray(enValue)) {
      result[key] = translateDeep(enValue, deValue || {});
    } else if (typeof enValue === 'string') {
      if (!deValue || deValue === enValue) {
        result[key] = smartTranslate(enValue);
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
      if (!deValue || deValue === enValue) count++;
    }
  }
  return count;
}

console.log('\n🇩🇪 ULTIMATE GERMAN TRANSLATION\n');
console.log('='.repeat(70));

const before = countUntranslated(en, de);
console.log(`📊 Before: ${before} untranslated`);

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
}

console.log('='.repeat(70));
console.log('✨ Done!\n');
