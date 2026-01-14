#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const dePath = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

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

function getNested(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return current;
}

// COMPREHENSIVE GERMAN TRANSLATIONS - ALL SECTIONS
const translations = {
  // ADDITIONAL SECTIONS
  'duesManagement.tabs.status': 'Status',
  'duesManagement.alerts.ok': 'OK',
  'duesManagement.settings.enableAutoInvoice': 'Automatische Rechnung aktivieren',
  'duesManagement.status.added': 'Hinzugefügt',
  'duesManagement.settings.paymentMethods': 'Zahlungsmethoden',
  'duesManagement.settings.autoInvoice': 'Automatische Rechnung',
  'duesManagement.settings.autoInvoiceDescription': 'Monatliche Rechnungen automatisch versenden',
  'duesManagement.settings.days': 'Tage',
  'duesManagement.settings.qrCode': 'QR-Code',
  'duesManagement.settings.bank': 'Bank',

  'admin.performanceMonitoring': 'Leistungsüberwachung',
  'admin.performanceDesc': 'App-Leistungsmetriken',
  'admin.recentActivity': 'Letzte Aktivität',
  'admin.systemRunningNormally': 'System läuft normal',
  'admin.dailyStatsUpdated': 'Tägliche Statistiken werden automatisch aktualisiert',
  'admin.userActivity': 'Benutzeraktivität',
  'admin.newSignup': 'Neue Registrierung',
  'admin.users': 'Benutzer',
  'admin.matchesLast7Days': 'Matches (Letzte 7 Tage)',
  'admin.entries': 'Einträge',

  'leagueDetail.champion': 'Champion',
  'leagueDetail.teamsStatus': 'Teams-Status',
  'leagueDetail.maxTeams': 'Max. Teams',
  'leagueDetail.startAcceptingApplications': 'Bewerbungen annehmen',
  'leagueDetail.click': 'Klicken',
  'leagueDetail.reasonForChange': 'Grund für Änderung',
  'leagueDetail.walkoverReason': 'Walkover-Grund',
  'leagueDetail.rank': 'Rang',
  'leagueDetail.player': 'Spieler',
  'leagueDetail.matches': 'Matches',
  'leagueDetail.playoffsQualified': '🏆 Playoffs-qualifiziert!',
  'leagueDetail.tennisUserId': 'TennisUser{{id}}',

  'editProfile.cameraPermissionNeeded': 'Kameraberechtigung erforderlich für Profilfotos.',
  'editProfile.camera': 'Kamera',
  'editProfile.fileSizeExceeded': 'Dateigröße überschritten',

  'feedCard.feedReport': '[Feed-Meldung] {{contentSummary}}',

  'createEvent.matchReminder': '🎾 Match-Erinnerung',
  'createEvent.newLightningMatch': '⚡ Neues Lightning Match: {{title}}',
  'createEvent.needToIncreasePlaying': 'Spielhäufigkeit erhöhen',
  'createEvent.analyzeTimeSlot': 'Analysiere, was diesen Zeitslot funktionieren lässt',
  'createEvent.eventType.lightningMatch': 'Lightning Match',
  'createEvent.eventType.lightningMeetup': 'Lightning Meetup',
  'createEvent.eventType.match': 'Match',
  'createEvent.eventType.meetup': 'Meetup',
  'createEvent.fields.partner': 'Partner',
  'createEvent.inviteFriends': 'Freunde einladen',
  'createEvent.inviteAppUsers': 'App-Benutzer einladen',
  'createEvent.smsFriendInvitations': 'SMS-Freundeseinladungen',
  'createEvent.exampleTitle': 'z.B. Wochenend-Spaß-Rally',
  'createEvent.mixed': 'Mixed',

  'cards.viewAll': 'Alle anzeigen',
  'cards.noData': 'Keine Daten',
  'cards.loading': 'Lädt...',
  'cards.error': 'Fehler',
  'cards.retry': 'Wiederholen',
  'cards.refresh': 'Aktualisieren',
  'cards.filter': 'Filtern',
  'cards.sort': 'Sortieren',
  'cards.search': 'Suchen',
  'cards.select': 'Auswählen',
  'cards.cancel': 'Abbrechen',
  'cards.confirm': 'Bestätigen',
  'cards.save': 'Speichern',
  'cards.delete': 'Löschen',
  'cards.edit': 'Bearbeiten',
  'cards.view': 'Anzeigen',
  'cards.share': 'Teilen',
  'cards.export': 'Exportieren',
  'cards.import': 'Importieren',
  'cards.upload': 'Hochladen',
  'cards.download': 'Herunterladen',

  'clubLeaguesTournaments.title': 'Ligen & Turniere',
  'clubLeaguesTournaments.leagues': 'Ligen',
  'clubLeaguesTournaments.tournaments': 'Turniere',
  'clubLeaguesTournaments.upcoming': 'Bevorstehend',
  'clubLeaguesTournaments.ongoing': 'Laufend',
  'clubLeaguesTournaments.completed': 'Abgeschlossen',
  'clubLeaguesTournaments.createLeague': 'Liga erstellen',
  'clubLeaguesTournaments.createTournament': 'Turnier erstellen',
  'clubLeaguesTournaments.viewAll': 'Alle anzeigen',
  'clubLeaguesTournaments.noLeagues': 'Keine Ligen',
  'clubLeaguesTournaments.noTournaments': 'Keine Turniere',
  'clubLeaguesTournaments.participants': 'Teilnehmer',
  'clubLeaguesTournaments.startDate': 'Startdatum',
  'clubLeaguesTournaments.endDate': 'Enddatum',
  'clubLeaguesTournaments.status': 'Status',
  'clubLeaguesTournaments.format': 'Format',
  'clubLeaguesTournaments.singleElimination': 'K.o.-System',
  'clubLeaguesTournaments.doubleElimination': 'Doppel-K.o.',
  'clubLeaguesTournaments.roundRobin': 'Jeder gegen jeden',

  'meetupDetail.title': 'Meetup-Details',
  'meetupDetail.date': 'Datum',
  'meetupDetail.time': 'Uhrzeit',
  'meetupDetail.location': 'Ort',
  'meetupDetail.organizer': 'Organisator',
  'meetupDetail.participants': 'Teilnehmer',
  'meetupDetail.attending': 'Nimmt teil',
  'meetupDetail.maxParticipants': 'Max. Teilnehmer',
  'meetupDetail.description': 'Beschreibung',
  'meetupDetail.joinMeetup': 'Teilnehmen',
  'meetupDetail.leaveMeetup': 'Absagen',
  'meetupDetail.shareMeetup': 'Teilen',
  'meetupDetail.editMeetup': 'Bearbeiten',
  'meetupDetail.cancelMeetup': 'Absagen',
  'meetupDetail.viewMap': 'Karte anzeigen',
  'meetupDetail.addToCalendar': 'Zum Kalender hinzufügen',
  'meetupDetail.remindMe': 'Erinnere mich',
  'meetupDetail.inviteFriends': 'Freunde einladen',
  'meetupDetail.chat': 'Chat',
  'meetupDetail.directions': 'Wegbeschreibung',

  'types.singles': 'Einzel',
  'types.doubles': 'Doppel',
  'types.mixed': 'Mixed',
  'types.casual': 'Freundschaftsspiel',
  'types.competitive': 'Wettkampf',
  'types.practice': 'Training',
  'types.tournament': 'Turnier',
  'types.league': 'Liga',
  'types.clinic': 'Kurs',
  'types.social': 'Sozial',
  'types.beginner': 'Anfänger',
  'types.intermediate': 'Fortgeschritten',
  'types.advanced': 'Fortgeschritten',
  'types.expert': 'Experte',
  'types.open': 'Offen',
  'types.closed': 'Geschlossen',
  'types.public': 'Öffentlich',
  'types.private': 'Privat',

  'badgeGallery.title': 'Badge-Galerie',
  'badgeGallery.myBadges': 'Meine Badges',
  'badgeGallery.allBadges': 'Alle Badges',
  'badgeGallery.earned': 'Erhalten',
  'badgeGallery.locked': 'Gesperrt',
  'badgeGallery.unlocked': 'Freigeschaltet',
  'badgeGallery.progress': 'Fortschritt',
  'badgeGallery.viewDetails': 'Details anzeigen',
  'badgeGallery.shareBadge': 'Badge teilen',
  'badgeGallery.category': 'Kategorie',
  'badgeGallery.rarity': 'Seltenheit',
  'badgeGallery.common': 'Häufig',
  'badgeGallery.rare': 'Selten',
  'badgeGallery.epic': 'Episch',
  'badgeGallery.legendary': 'Legendär',
  'badgeGallery.earnedDate': 'Erhalten am',
  'badgeGallery.requirements': 'Anforderungen',

  'profile.title': 'Profil',
  'profile.edit': 'Bearbeiten',
  'profile.view': 'Anzeigen',
  'profile.share': 'Teilen',
  'profile.stats': 'Statistiken',
  'profile.achievements': 'Erfolge',
  'profile.matches': 'Matches',
  'profile.clubs': 'Vereine',
  'profile.friends': 'Freunde',
  'profile.following': 'Folge ich',
  'profile.followers': 'Follower',
  'profile.posts': 'Beiträge',
  'profile.photos': 'Fotos',
  'profile.videos': 'Videos',
  'profile.settings': 'Einstellungen',

  'matches.title': 'Matches',
  'matches.upcoming': 'Bevorstehend',
  'matches.completed': 'Abgeschlossen',
  'matches.cancelled': 'Abgesagt',
  'matches.viewAll': 'Alle anzeigen',
  'matches.noMatches': 'Keine Matches',
  'matches.createMatch': 'Match erstellen',
  'matches.findMatch': 'Match finden',
  'matches.joinMatch': 'Match beitreten',
  'matches.leaveMatch': 'Match verlassen',
  'matches.viewDetails': 'Details anzeigen',
  'matches.recordScore': 'Ergebnis eintragen',
  'matches.shareMatch': 'Match teilen',

  'club.title': 'Verein',
  'club.members': 'Mitglieder',
  'club.events': 'Veranstaltungen',
  'club.leagues': 'Ligen',
  'club.tournaments': 'Turniere',
  'club.join': 'Beitreten',
  'club.leave': 'Verlassen',
  'club.manage': 'Verwalten',
  'club.settings': 'Einstellungen',
  'club.invite': 'Einladen',
  'club.about': 'Über',
  'club.location': 'Standort',
  'club.contact': 'Kontakt',

  'myActivities.title': 'Meine Aktivitäten',
  'myActivities.matches': 'Matches',
  'myActivities.events': 'Veranstaltungen',
  'myActivities.leagues': 'Ligen',
  'myActivities.tournaments': 'Turniere',
  'myActivities.viewAll': 'Alle anzeigen',
  'myActivities.upcoming': 'Bevorstehend',
  'myActivities.past': 'Vergangene',
  'myActivities.cancelled': 'Abgesagt',
  'myActivities.noActivities': 'Keine Aktivitäten',
  'myActivities.filter': 'Filtern',
  'myActivities.sort': 'Sortieren',
  'myActivities.search': 'Suchen',

  'profileSettings.title': 'Profil-Einstellungen',
  'profileSettings.personalInfo': 'Persönliche Informationen',
  'profileSettings.privacy': 'Datenschutz',
  'profileSettings.notifications': 'Benachrichtigungen',
  'profileSettings.preferences': 'Präferenzen',
  'profileSettings.account': 'Konto',
  'profileSettings.security': 'Sicherheit',
  'profileSettings.save': 'Speichern',
  'profileSettings.cancel': 'Abbrechen',
  'profileSettings.edit': 'Bearbeiten',
  'profileSettings.change': 'Ändern',
  'profileSettings.update': 'Aktualisieren',
  'profileSettings.delete': 'Löschen',

  'clubDuesManagement.title': 'Beitragsverwaltung',
  'clubDuesManagement.overview': 'Übersicht',
  'clubDuesManagement.members': 'Mitglieder',
  'clubDuesManagement.payments': 'Zahlungen',
  'clubDuesManagement.settings': 'Einstellungen',
  'clubDuesManagement.status': 'Status',
  'clubDuesManagement.paid': 'Bezahlt',
  'clubDuesManagement.unpaid': 'Unbezahlt',
  'clubDuesManagement.overdue': 'Überfällig',
  'clubDuesManagement.markAsPaid': 'Als bezahlt markieren',
  'clubDuesManagement.sendReminder': 'Erinnerung senden',
  'clubDuesManagement.viewHistory': 'Verlauf anzeigen',
  'clubDuesManagement.exportData': 'Daten exportieren',

  'rateSportsmanship.title': 'Sportlichkeit bewerten',
  'rateSportsmanship.excellent': 'Ausgezeichnet',
  'rateSportsmanship.good': 'Gut',
  'rateSportsmanship.fair': 'Akzeptabel',
  'rateSportsmanship.poor': 'Schlecht',
  'rateSportsmanship.rating': 'Bewertung',
  'rateSportsmanship.comments': 'Kommentare',
  'rateSportsmanship.submit': 'Absenden',
  'rateSportsmanship.cancel': 'Abbrechen',
  'rateSportsmanship.optional': 'Optional',
  'rateSportsmanship.required': 'Erforderlich',
  'rateSportsmanship.thankyou': 'Vielen Dank!',

  'eventCard.title': 'Event',
  'eventCard.date': 'Datum',
  'eventCard.time': 'Uhrzeit',
  'eventCard.location': 'Ort',
  'eventCard.participants': 'Teilnehmer',
  'eventCard.join': 'Teilnehmen',
  'eventCard.leave': 'Absagen',
  'eventCard.view': 'Anzeigen',
  'eventCard.share': 'Teilen',
  'eventCard.edit': 'Bearbeiten',
  'eventCard.cancel': 'Absagen',
  'eventCard.status': 'Status',

  'clubTournamentManagement.title': 'Turnierverwaltung',
  'clubTournamentManagement.upcoming': 'Bevorstehend',
  'clubTournamentManagement.ongoing': 'Laufend',
  'clubTournamentManagement.completed': 'Abgeschlossen',
  'clubTournamentManagement.create': 'Erstellen',
  'clubTournamentManagement.edit': 'Bearbeiten',
  'clubTournamentManagement.delete': 'Löschen',
  'clubTournamentManagement.view': 'Anzeigen',
  'clubTournamentManagement.participants': 'Teilnehmer',
  'clubTournamentManagement.bracket': 'Turnierbaum',
  'clubTournamentManagement.results': 'Ergebnisse',

  'hallOfFame.title': 'Ruhmeshalle',
  'hallOfFame.champions': 'Champions',
  'hallOfFame.legends': 'Legenden',
  'hallOfFame.topPlayers': 'Top-Spieler',
  'hallOfFame.achievements': 'Erfolge',
  'hallOfFame.viewProfile': 'Profil anzeigen',
  'hallOfFame.year': 'Jahr',
  'hallOfFame.tournament': 'Turnier',
  'hallOfFame.category': 'Kategorie',
  'hallOfFame.winner': 'Gewinner',
  'hallOfFame.runnerUp': 'Zweitplatzierter',

  'feedCard.title': 'Feed',
  'feedCard.like': 'Gefällt mir',
  'feedCard.comment': 'Kommentieren',
  'feedCard.share': 'Teilen',
  'feedCard.report': 'Melden',
  'feedCard.delete': 'Löschen',
  'feedCard.edit': 'Bearbeiten',
  'feedCard.viewComments': 'Kommentare anzeigen',
  'feedCard.likedBy': 'Gefällt',
  'feedCard.comments': 'Kommentare',
  'feedCard.timeAgo': 'Vor',

  'ntrpAssessment.title': 'LTR-Bewertung',
  'ntrpAssessment.start': 'Starten',
  'ntrpAssessment.continue': 'Fortfahren',
  'ntrpAssessment.complete': 'Abschließen',
  'ntrpAssessment.result': 'Ergebnis',
  'ntrpAssessment.rating': 'Bewertung',
  'ntrpAssessment.description': 'Beschreibung',
  'ntrpAssessment.next': 'Weiter',
  'ntrpAssessment.previous': 'Zurück',
  'ntrpAssessment.skip': 'Überspringen',

  'achievementsGuide.title': 'Erfolgs-Leitfaden',
  'achievementsGuide.categories': 'Kategorien',
  'achievementsGuide.howToEarn': 'Wie man verdient',
  'achievementsGuide.progress': 'Fortschritt',
  'achievementsGuide.unlocked': 'Freigeschaltet',
  'achievementsGuide.locked': 'Gesperrt',
  'achievementsGuide.viewAll': 'Alle anzeigen',
  'achievementsGuide.recent': 'Kürzlich',
  'achievementsGuide.share': 'Teilen',
  'achievementsGuide.details': 'Details',

  'createClubTournament.title': 'Turnier erstellen',
  'createClubTournament.name': 'Turniername',
  'createClubTournament.date': 'Datum',
  'createClubTournament.location': 'Ort',
  'createClubTournament.format': 'Format',
  'createClubTournament.maxParticipants': 'Max. Teilnehmer',
  'createClubTournament.create': 'Erstellen',
  'createClubTournament.cancel': 'Abbrechen',

  'recordScore.title': 'Ergebnis eintragen',
  'recordScore.yourScore': 'Ihr Ergebnis',
  'recordScore.opponentScore': 'Gegner-Ergebnis',
  'recordScore.sets': 'Sätze',
  'recordScore.games': 'Games',
  'recordScore.submit': 'Absenden',
  'recordScore.cancel': 'Abbrechen',
  'recordScore.success': 'Ergebnis eingetragen',
  'recordScore.error': 'Fehler beim Eintragen',

  'matchRequest.title': 'Match-Anfrage',
  'matchRequest.send': 'Senden',
  'matchRequest.accept': 'Akzeptieren',
  'matchRequest.decline': 'Ablehnen',
  'matchRequest.cancel': 'Abbrechen',
  'matchRequest.pending': 'Ausstehend',
  'matchRequest.accepted': 'Akzeptiert',
  'matchRequest.declined': 'Abgelehnt',
  'matchRequest.cancelled': 'Abgesagt',
};

// Apply translations
let count = 0;
for (const [keyPath, value] of Object.entries(translations)) {
  const enValue = getNested(en, keyPath);
  const deValue = getNested(de, keyPath);

  if (enValue && (deValue === enValue || deValue === undefined)) {
    setNested(de, keyPath, value);
    count++;
  }
}

fs.writeFileSync(dePath, JSON.stringify(de, null, 2) + '\n', 'utf8');

console.log(`\n✅ COMPREHENSIVE TRANSLATION COMPLETE`);
console.log(`📊 Keys translated: ${count}`);
console.log(`📁 ${dePath}\n`);
