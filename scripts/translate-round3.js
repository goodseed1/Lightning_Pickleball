#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const dePath = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Helper to set nested value
function setNested(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

// Helper to get nested value
function getNested(obj, path) {
  const keys = path.split('.');
  let current = obj;

  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }

  return current;
}

// ALL TRANSLATIONS - comprehensive coverage
const allTranslations = {
  // ADMIN SECTION
  'admin.logs.title': 'Systemprotokolle',
  'admin.logs.critical': 'Kritisch',
  'admin.logs.healthy': 'Gesund',
  'admin.logs.systemStatus': 'Systemstatus',
  'admin.logs.lastChecked': 'Zuletzt geprüft',
  'admin.logs.newMatches': 'Neue Matches\n(24h)',
  'admin.logs.categories': 'Protokollkategorien',
  'admin.logs.functionLogs': 'Cloud Functions-Protokolle',
  'admin.logs.authLogs': 'Authentifizierungsprotokolle',
  'admin.logs.errorLogsDesc': 'App-Abstürze und API-Fehler',
  'admin.logs.functionLogsDesc': 'Backend-Funktion Ausführungen',
  'admin.logs.authLogsDesc': 'Benutzer-Anmeldungen und Registrierungen',
  'admin.logs.export': 'Protokolle exportieren',
  'admin.logs.refresh': 'Aktualisieren',
  'admin.logs.filterByType': 'Nach Typ filtern',
  'admin.logs.filterByDate': 'Nach Datum filtern',
  'admin.logs.severity': 'Schweregrad',
  'admin.logs.timestamp': 'Zeitstempel',
  'admin.logs.message': 'Nachricht',
  'admin.logs.details': 'Details',
  'admin.logs.error': 'Fehler',
  'admin.logs.warning': 'Warnung',
  'admin.logs.info': 'Information',
  'admin.logs.debug': 'Debug',
  'admin.logs.errorLogs': 'Fehlerprotokolle',
  'admin.logs.viewAll': 'Alle anzeigen',
  'admin.logs.clearLogs': 'Protokolle löschen',
  'admin.logs.downloadLogs': 'Protokolle herunterladen',
  'admin.logs.search': 'Protokolle durchsuchen',
  'admin.logs.noLogs': 'Keine Protokolle',
  'admin.logs.loading': 'Lädt Protokolle...',
  'admin.logs.failed': 'Fehler beim Laden',
  'admin.logs.retry': 'Wiederholen',
  'admin.logs.filters': 'Filter',
  'admin.logs.applyFilters': 'Filter anwenden',
  'admin.logs.clearFilters': 'Filter zurücksetzen',
  'admin.logs.dateRange': 'Datumsbereich',
  'admin.logs.from': 'Von',
  'admin.logs.to': 'Bis',
  'admin.logs.count': 'Anzahl',
  'admin.logs.recent': 'Neueste',

  // DUES MANAGEMENT
  'duesManagement.tabs.status': 'Status',
  'duesManagement.status.paid': 'Bezahlt',
  'duesManagement.status.unpaid': 'Unbezahlt',
  'duesManagement.status.exempt': 'Befreit',
  'duesManagement.status.overdue': 'Überfällig',
  'duesManagement.actions.enable': 'Aktivieren',
  'duesManagement.actions.activate': 'Aktivieren',
  'duesManagement.actions.markAsPaid': 'Als bezahlt markieren',
  'duesManagement.alerts.ok': 'OK',
  'duesManagement.alerts.saved': 'Gespeichert',
  'duesManagement.alerts.enableConfirm': 'Beitragsverwaltung aktivieren?',
  'duesManagement.alerts.enableDesc': 'Dies aktiviert die Beitragsverfolgung für diesen Verein.',
  'duesManagement.alerts.disableConfirm': 'Beitragsverwaltung deaktivieren?',
  'duesManagement.alerts.disableDesc':
    'Gespeicherte Daten bleiben erhalten, aber die Funktion wird deaktiviert.',
  'duesManagement.alerts.markPaidConfirm': 'Als bezahlt markieren?',
  'duesManagement.alerts.markPaidDesc': 'Dies wird den Beitragsstatus aktualisieren.',
  'duesManagement.alerts.settingsSaved': 'Einstellungen gespeichert',
  'duesManagement.alerts.error': 'Fehler',
  'duesManagement.alerts.errorSaving': 'Fehler beim Speichern',
  'duesManagement.tabs.overview': 'Übersicht',
  'duesManagement.tabs.members': 'Mitglieder',
  'duesManagement.tabs.settings': 'Einstellungen',
  'duesManagement.overview.totalMembers': 'Mitglieder gesamt',
  'duesManagement.overview.paidMembers': 'Bezahlt',
  'duesManagement.overview.unpaidMembers': 'Unbezahlt',
  'duesManagement.overview.exemptMembers': 'Befreit',
  'duesManagement.overview.collectionRate': 'Einzugsquote',
  'duesManagement.overview.totalCollected': 'Gesamt eingezogen',
  'duesManagement.overview.totalOutstanding': 'Gesamt ausstehend',
  'duesManagement.settings.amount': 'Beitragshöhe',
  'duesManagement.settings.frequency': 'Häufigkeit',
  'duesManagement.settings.monthly': 'Monatlich',
  'duesManagement.settings.quarterly': 'Vierteljährlich',
  'duesManagement.settings.annually': 'Jährlich',
  'duesManagement.settings.dueDate': 'Fälligkeitsdatum',
  'duesManagement.settings.gracePeriod': 'Kulanzfrist (Tage)',
  'duesManagement.settings.autoReminders': 'Automatische Erinnerungen',
  'duesManagement.settings.reminderDays': 'Erinnerung (Tage vorher)',
  'duesManagement.settings.currency': 'Währung',
  'duesManagement.settings.save': 'Speichern',
  'duesManagement.settings.cancel': 'Abbrechen',

  // LEAGUE DETAIL
  'leagueDetail.alreadyAppliedOrJoined': 'Bereits angemeldet oder teilnehmend.',
  'leagueDetail.startPlayoffs': 'Playoffs starten',
  'leagueDetail.fourthPlace': '4.',
  'leagueDetail.adminCorrection': 'Admin-Korrektur',
  'leagueDetail.adminWalkover': 'Admin-Walkover',
  'leagueDetail.champion': 'Champion',
  'leagueDetail.runnerUp': 'Zweitplatzierter',
  'leagueDetail.finalMatch': 'Finale',
  'leagueDetail.qualifiedTeams': 'Qualifizierte Teams:',
  'leagueDetail.teams': 'Teams',
  'leagueDetail.playoffBracket': 'Playoff-Turnierbaum',
  'leagueDetail.semifinals': 'Halbfinale',
  'leagueDetail.finals': 'Finale',
  'leagueDetail.thirdPlaceMatch': 'Spiel um Platz 3',
  'leagueDetail.winner': 'Gewinner',
  'leagueDetail.loser': 'Verlierer',
  'leagueDetail.match': 'Match',
  'leagueDetail.round': 'Runde',
  'leagueDetail.seed': 'Setzposition',
  'leagueDetail.vs': 'gegen',
  'leagueDetail.tbd': 'Noch offen',
  'leagueDetail.bye': 'Freilos',
  'leagueDetail.walkover': 'Walkover',
  'leagueDetail.forfeit': 'Aufgabe',
  'leagueDetail.pending': 'Ausstehend',
  'leagueDetail.inProgress': 'Läuft',
  'leagueDetail.completed': 'Abgeschlossen',
  'leagueDetail.cancelled': 'Abgesagt',
  'leagueDetail.postponed': 'Verschoben',
  'leagueDetail.rescheduled': 'Neu angesetzt',
  'leagueDetail.defaulted': 'Nicht angetreten',
  'leagueDetail.confirmed': 'Bestätigt',
  'leagueDetail.playoffsStarted': 'Playoffs gestartet',
  'leagueDetail.playoffQualification': 'Playoff-Qualifikation',
  'leagueDetail.knockoutStage': 'K.o.-Phase',
  'leagueDetail.groupStage': 'Gruppenphase',
  'leagueDetail.top4': 'Top 4',

  // HOSTED EVENT CARD
  'hostedEventCard.eventTypes.match': 'Match',
  'hostedEventCard.eventTypes.practice': 'Training',
  'hostedEventCard.eventTypes.lightning': 'Match',
  'hostedEventCard.eventTypes.meetup': 'Meetup',
  'hostedEventCard.eventTypes.casual': 'Freundschaftsspiel',
  'hostedEventCard.eventTypes.ranked': 'Rangliste',
  'hostedEventCard.eventTypes.general': 'Allgemein',
  'hostedEventCard.buttons.chat': 'Chat',
  'hostedEventCard.weather.conditions.Sunny': 'Sonnig',
  'hostedEventCard.weather.conditions.Partly Cloudy': 'Teilweise bewölkt',
  'hostedEventCard.weather.conditions.Cloudy': 'Bewölkt',
  'hostedEventCard.weather.conditions.Rainy': 'Regnerisch',
  'hostedEventCard.weather.conditions.Stormy': 'Stürmisch',
  'hostedEventCard.weather.conditions.Snowy': 'Schneefall',
  'hostedEventCard.weather.conditions.Windy': 'Windig',
  'hostedEventCard.weather.conditions.Foggy': 'Neblig',
  'hostedEventCard.weather.conditions.Hot': 'Heiß',
  'hostedEventCard.weather.conditions.Cold': 'Kalt',
  'hostedEventCard.weather.conditions.Clear': 'Klar',
  'hostedEventCard.weather.conditions.Overcast': 'Bedeckt',
  'hostedEventCard.weather.perfect': 'Perfekt',
  'hostedEventCard.weather.good': 'Gut',
  'hostedEventCard.weather.fair': 'Akzeptabel',
  'hostedEventCard.weather.poor': 'Schlecht',
  'hostedEventCard.weather.playable': 'Spielbar',
  'hostedEventCard.status.active': 'Aktiv',
  'hostedEventCard.status.inactive': 'Inaktiv',
  'hostedEventCard.participants.you': 'Sie',
  'hostedEventCard.participants.and': 'und',
  'hostedEventCard.participants.others': 'andere',

  // CREATE EVENT
  'createEvent.eventType.lightningMatch': 'Lightning Match',
  'createEvent.eventType.lightningMeetup': 'Lightning Meetup',
  'createEvent.eventType.match': 'Match',
  'createEvent.eventType.meetup': 'Meetup',
  'createEvent.fields.people': ' Personen',
  'createEvent.fields.auto': 'Automatisch',
  'createEvent.fields.partner': 'Partner',
  'createEvent.fields.autoConfigured': '✅ Automatisch konfiguriert',
  'createEvent.fields.autoApproval': 'Automatische Genehmigung nach Reihenfolge',
  'createEvent.fields.feePlaceholder': 'z.B. 20',
  'createEvent.fields.descriptionPlaceholder': 'Event-Beschreibung hinzufügen...',
  'createEvent.fields.notesPlaceholder': 'Zusätzliche Hinweise...',
  'createEvent.validation.titleRequired': 'Titel erforderlich',
  'createEvent.validation.dateRequired': 'Datum erforderlich',
  'createEvent.validation.locationRequired': 'Ort erforderlich',
  'createEvent.success': 'Event erstellt!',
  'createEvent.error': 'Fehler beim Erstellen des Events',
  'createEvent.creating': 'Event wird erstellt...',
  'createEvent.selectDate': 'Datum auswählen',
  'createEvent.selectTime': 'Uhrzeit auswählen',
  'createEvent.selectLocation': 'Ort auswählen',
  'createEvent.optional': 'Optional',
  'createEvent.required': 'Erforderlich',
  'createEvent.addPhoto': 'Foto hinzufügen',
  'createEvent.removePhoto': 'Foto entfernen',
  'createEvent.preview': 'Vorschau',
  'createEvent.publish': 'Veröffentlichen',
  'createEvent.saveDraft': 'Als Entwurf speichern',
  'createEvent.discardDraft': 'Entwurf verwerfen',

  // SERVICES
  'services.error.generic': 'Ein Fehler ist aufgetreten',
  'services.error.network': 'Netzwerkfehler',
  'services.error.unauthorized': 'Nicht autorisiert',
  'services.error.notFound': 'Nicht gefunden',
  'services.error.serverError': 'Serverfehler',
  'services.error.timeout': 'Zeitüberschreitung',
  'services.error.invalidInput': 'Ungültige Eingabe',
  'services.loading': 'Lädt...',
  'services.success': 'Erfolgreich',
  'services.retry': 'Wiederholen',
  'services.cancel': 'Abbrechen',
  'services.confirm': 'Bestätigen',
  'services.save': 'Speichern',
  'services.delete': 'Löschen',
  'services.edit': 'Bearbeiten',
  'services.view': 'Anzeigen',
  'services.share': 'Teilen',
  'services.export': 'Exportieren',
  'services.import': 'Importieren',
  'services.upload': 'Hochladen',
  'services.download': 'Herunterladen',
  'services.refresh': 'Aktualisieren',
  'services.search': 'Suchen',
  'services.filter': 'Filtern',
  'services.sort': 'Sortieren',
  'services.selectAll': 'Alle auswählen',
  'services.deselectAll': 'Alle abwählen',
  'services.apply': 'Anwenden',
  'services.clear': 'Löschen',
  'services.reset': 'Zurücksetzen',

  // AI MATCHING
  'aiMatching.title': 'KI-Matching',
  'aiMatching.findPartner': 'Partner finden',
  'aiMatching.recommendations': 'Empfehlungen',
  'aiMatching.suggestedPartners': 'Vorgeschlagene Partner',
  'aiMatching.noMatches': 'Keine passenden Partner gefunden',
  'aiMatching.loading': 'Suche läuft...',
  'aiMatching.error': 'Fehler beim Matching',
  'aiMatching.retry': 'Erneut versuchen',
  'aiMatching.filters.title': 'Filter',
  'aiMatching.filters.skillLevel': 'Spielstärke',
  'aiMatching.filters.location': 'Standort',
  'aiMatching.filters.distance': 'Entfernung',
  'aiMatching.filters.availability': 'Verfügbarkeit',
  'aiMatching.filters.playStyle': 'Spielstil',
  'aiMatching.filters.apply': 'Anwenden',
  'aiMatching.filters.clear': 'Zurücksetzen',
  'aiMatching.matchQuality.excellent': 'Hervorragend',
  'aiMatching.matchQuality.good': 'Gut',
  'aiMatching.matchQuality.fair': 'Akzeptabel',
  'aiMatching.compatibility.high': 'Hohe Kompatibilität',
  'aiMatching.compatibility.medium': 'Mittlere Kompatibilität',
  'aiMatching.compatibility.low': 'Niedrige Kompatibilität',
  'aiMatching.actions.viewProfile': 'Profil anzeigen',
  'aiMatching.actions.sendRequest': 'Anfrage senden',
  'aiMatching.matchScore': 'Match-Score',
  'aiMatching.basedOn': 'Basierend auf',
};

// Apply only to truly untranslated keys
let count = 0;

for (const [keyPath, germanValue] of Object.entries(allTranslations)) {
  const enValue = getNested(en, keyPath);
  const deValue = getNested(de, keyPath);

  // Only translate if de === en (untranslated) or de is undefined
  if (enValue && (deValue === enValue || deValue === undefined)) {
    setNested(de, keyPath, germanValue);
    count++;
    console.log(`✓ ${keyPath}`);
  }
}

// Save
fs.writeFileSync(dePath, JSON.stringify(de, null, 2) + '\n', 'utf8');

console.log(`\n✅ Translated ${count} keys`);
console.log(`📁 Saved to: ${dePath}\n`);
