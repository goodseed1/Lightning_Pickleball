#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object') {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Load files
const enPath = path.join(__dirname, '../src/locales/en.json');
const dePath = path.join(__dirname, '../src/locales/de.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Comprehensive German translations for Round 2
const germanTranslations = {
  admin: {
    title: 'Administrator',
    dashboard: 'Dashboard',
    users: 'Benutzer',
    clubs: 'Vereine',
    reports: 'Berichte',
    settings: 'Einstellungen',
    analytics: 'Analysen',
    moderation: 'Moderation',
    userManagement: 'Benutzerverwaltung',
    clubManagement: 'Vereinsverwaltung',
    contentModeration: 'Inhaltsmoderation',
    systemSettings: 'Systemeinstellungen',
    viewDetails: 'Details anzeigen',
    takeAction: 'Maßnahme ergreifen',
    approve: 'Genehmigen',
    reject: 'Ablehnen',
    suspend: 'Sperren',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    save: 'Speichern',
    cancel: 'Abbrechen',
    search: 'Suchen',
    filter: 'Filtern',
    export: 'Exportieren',
    import: 'Importieren',
    totalUsers: 'Benutzer gesamt',
    activeUsers: 'Aktive Benutzer',
    totalClubs: 'Vereine gesamt',
    activeClubs: 'Aktive Vereine',
    pendingReports: 'Ausstehende Meldungen',
    systemHealth: 'Systemstatus',
    recentActivity: 'Letzte Aktivität',
    userActivity: 'Benutzeraktivität',
    clubActivity: 'Vereinsaktivität',
    matchActivity: 'Match-Aktivität',
    reportDetails: 'Meldungsdetails',
    reason: 'Grund',
    description: 'Beschreibung',
  },

  duesManagement: {
    title: 'Mitgliedsbeitragsverwaltung',
    overview: 'Übersicht',
    payments: 'Zahlungen',
    history: 'Verlauf',
    settings: 'Einstellungen',
    duesAmount: 'Beitragshöhe',
    dueDate: 'Fälligkeitsdatum',
    frequency: 'Häufigkeit',
    monthly: 'Monatlich',
    quarterly: 'Vierteljährlich',
    annually: 'Jährlich',
    status: 'Status',
    paid: 'Bezahlt',
    unpaid: 'Unbezahlt',
    overdue: 'Überfällig',
    pending: 'Ausstehend',
    paymentMethod: 'Zahlungsmethode',
    creditCard: 'Kreditkarte',
    bankTransfer: 'Banküberweisung',
    cash: 'Bargeld',
    totalCollected: 'Gesamt eingezogen',
    totalOutstanding: 'Gesamt ausstehend',
    collectionRate: 'Einzugsquote',
    sendReminder: 'Erinnerung senden',
    markAsPaid: 'Als bezahlt markieren',
    recordPayment: 'Zahlung erfassen',
    paymentDate: 'Zahlungsdatum',
    amount: 'Betrag',
    notes: 'Notizen',
    receipt: 'Quittung',
    generateReport: 'Bericht erstellen',
    exportData: 'Daten exportieren',
    paymentHistory: 'Zahlungsverlauf',
    memberName: 'Mitgliedsname',
    lastPayment: 'Letzte Zahlung',
    nextDue: 'Nächste Fälligkeit',
  },

  hostedEventCard: {
    title: 'Veranstaltung',
    details: 'Details',
    date: 'Datum',
    time: 'Uhrzeit',
    location: 'Ort',
    participants: 'Teilnehmer',
    maxParticipants: 'Max. Teilnehmer',
    description: 'Beschreibung',
    organizer: 'Veranstalter',
    joinEvent: 'Teilnehmen',
    leaveEvent: 'Absagen',
    shareEvent: 'Teilen',
    editEvent: 'Bearbeiten',
    cancelEvent: 'Absagen',
    eventType: 'Veranstaltungsart',
    skillLevel: 'Spielstärke',
    cost: 'Kosten',
    free: 'Kostenlos',
    registered: 'Angemeldet',
    waitlist: 'Warteliste',
    full: 'Ausgebucht',
    cancelled: 'Abgesagt',
    completed: 'Abgeschlossen',
    upcoming: 'Bevorstehend',
    past: 'Vergangen',
    registrationDeadline: 'Anmeldeschluss',
    additionalInfo: 'Zusätzliche Informationen',
    contactOrganizer: 'Veranstalter kontaktieren',
    viewMap: 'Karte anzeigen',
    addToCalendar: 'Zum Kalender hinzufügen',
    remindMe: 'Erinnere mich',
    inviteFriends: 'Freunde einladen',
    eventRules: 'Veranstaltungsregeln',
  },

  leagueDetail: {
    title: 'Liga-Details',
    overview: 'Übersicht',
    standings: 'Tabelle',
    schedule: 'Spielplan',
    stats: 'Statistiken',
    leagueName: 'Liganame',
    season: 'Saison',
    division: 'Division',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    matchesPlayed: 'Gespielte Matches',
    matchesRemaining: 'Verbleibende Matches',
    participants: 'Teilnehmer',
    rank: 'Rang',
    player: 'Spieler',
    wins: 'Siege',
    losses: 'Niederlagen',
    points: 'Punkte',
    matchesWon: 'Gewonnene Matches',
    matchesLost: 'Verlorene Matches',
    winRate: 'Siegquote',
    currentStreak: 'Aktuelle Serie',
    bestStreak: 'Beste Serie',
    upcomingMatches: 'Bevorstehende Matches',
    recentResults: 'Letzte Ergebnisse',
    leagueRules: 'Ligaregeln',
    joinLeague: 'Liga beitreten',
    leaveLeague: 'Liga verlassen',
    viewProfile: 'Profil anzeigen',
    matchDetails: 'Match-Details',
    recordScore: 'Ergebnis eintragen',
    disputeScore: 'Ergebnis anfechten',
    nextMatch: 'Nächstes Match',
  },

  aiMatching: {
    title: 'KI-Matching',
    findPartner: 'Partner finden',
    recommendations: 'Empfehlungen',
    preferences: 'Präferenzen',
    skillLevel: 'Spielstärke',
    location: 'Standort',
    availability: 'Verfügbarkeit',
    playStyle: 'Spielstil',
    matchQuality: 'Match-Qualität',
    compatibility: 'Kompatibilität',
    distance: 'Entfernung',
    basedOn: 'Basierend auf',
    yourProfile: 'Ihrem Profil',
    recentMatches: 'Letzten Matches',
    preferences_plural: 'Präferenzen',
    suggestedPartners: 'Vorgeschlagene Partner',
    viewProfile: 'Profil anzeigen',
    sendRequest: 'Anfrage senden',
    noMatchesFound: 'Keine passenden Partner gefunden',
    updatePreferences: 'Präferenzen aktualisieren',
    searching: 'Suche läuft',
    foundMatches: 'Gefundene Partner',
    matchScore: 'Match-Score',
    whyThisMatch: 'Warum dieser Partner',
    similarSkill: 'Ähnliche Spielstärke',
    nearbyLocation: 'In der Nähe',
  },

  clubOverview: {
    memberCount: 'Mitgliederanzahl',
    activeMembers: 'Aktive Mitglieder',
    upcomingEvents: 'Bevorstehende Veranstaltungen',
    recentActivity: 'Letzte Aktivität',
    viewAll: 'Alle anzeigen',
    noActivity: 'Keine Aktivität',
    joinClub: 'Verein beitreten',
    leaveClub: 'Verein verlassen',
    invite: 'Einladen',
    settings: 'Einstellungen',
    about: 'Über uns',
    location: 'Standort',
    established: 'Gegründet',
    contact: 'Kontakt',
    facilities: 'Anlagen',
    courts: 'Plätze',
    amenities: 'Ausstattung',
    membershipFee: 'Mitgliedsbeitrag',
    guestPolicy: 'Gästerichtlinie',
    bookCourt: 'Platz buchen',
    viewSchedule: 'Spielplan anzeigen',
  },

  clubEvents: {
    title: 'Veranstaltungen',
    upcoming: 'Bevorstehend',
    past: 'Vergangene',
    createEvent: 'Veranstaltung erstellen',
    eventName: 'Veranstaltungsname',
    eventType: 'Veranstaltungsart',
    date: 'Datum',
    time: 'Uhrzeit',
    location: 'Ort',
    description: 'Beschreibung',
    maxParticipants: 'Max. Teilnehmer',
    registrationDeadline: 'Anmeldeschluss',
    saveEvent: 'Speichern',
    cancelEvent: 'Abbrechen',
    editEvent: 'Bearbeiten',
    deleteEvent: 'Löschen',
    participants: 'Teilnehmer',
    registered: 'Angemeldet',
    waitlist: 'Warteliste',
    attend: 'Teilnehmen',
    cantAttend: 'Kann nicht teilnehmen',
    noEvents: 'Keine Veranstaltungen',
    tournament: 'Turnier',
    social: 'Soziales Event',
    practice: 'Training',
    meeting: 'Treffen',
  },

  notifications: {
    title: 'Benachrichtigungen',
    all: 'Alle',
    unread: 'Ungelesen',
    read: 'Gelesen',
    markAllRead: 'Alle als gelesen markieren',
    clearAll: 'Alle löschen',
    noNotifications: 'Keine Benachrichtigungen',
    matchRequest: 'Match-Anfrage',
    friendRequest: 'Freundschaftsanfrage',
    eventInvitation: 'Veranstaltungseinladung',
    clubInvitation: 'Vereinseinladung',
    matchReminder: 'Match-Erinnerung',
    newMessage: 'Neue Nachricht',
    systemUpdate: 'Systemaktualisierung',
    accept: 'Akzeptieren',
    decline: 'Ablehnen',
    view: 'Anzeigen',
    delete: 'Löschen',
    today: 'Heute',
    yesterday: 'Gestern',
    thisWeek: 'Diese Woche',
    earlier: 'Früher',
    settings: 'Einstellungen',
    pushNotifications: 'Push-Benachrichtigungen',
    emailNotifications: 'E-Mail-Benachrichtigungen',
  },

  settings: {
    title: 'Einstellungen',
    profile: 'Profil',
    account: 'Konto',
    privacy: 'Datenschutz',
    notifications: 'Benachrichtigungen',
    preferences: 'Präferenzen',
    language: 'Sprache',
    theme: 'Design',
    about: 'Über',
    help: 'Hilfe',
    logout: 'Abmelden',
    editProfile: 'Profil bearbeiten',
    changePassword: 'Passwort ändern',
    deleteAccount: 'Konto löschen',
    privacySettings: 'Datenschutzeinstellungen',
    notificationSettings: 'Benachrichtigungseinstellungen',
    languageSettings: 'Spracheinstellungen',
    themeSettings: 'Design-Einstellungen',
    version: 'Version',
    termsOfService: 'Nutzungsbedingungen',
    privacyPolicy: 'Datenschutzerklärung',
    contactSupport: 'Support kontaktieren',
    faq: 'Häufig gestellte Fragen',
    reportProblem: 'Problem melden',
    rateApp: 'App bewerten',
  },

  matchHistory: {
    title: 'Match-Verlauf',
    all: 'Alle',
    wins: 'Siege',
    losses: 'Niederlagen',
    date: 'Datum',
    opponent: 'Gegner',
    score: 'Ergebnis',
    duration: 'Dauer',
    location: 'Ort',
    matchType: 'Match-Typ',
    result: 'Resultat',
    won: 'Gewonnen',
    lost: 'Verloren',
    viewDetails: 'Details anzeigen',
    noMatches: 'Keine Matches',
    filter: 'Filtern',
    sortBy: 'Sortieren nach',
    mostRecent: 'Neueste zuerst',
    oldest: 'Älteste zuerst',
    statistics: 'Statistiken',
    totalMatches: 'Matches gesamt',
    winRate: 'Siegquote',
    currentStreak: 'Aktuelle Serie',
    bestStreak: 'Beste Serie',
  },

  playerStats: {
    title: 'Spielerstatistiken',
    overview: 'Übersicht',
    performance: 'Leistung',
    achievements: 'Erfolge',
    ranking: 'Rangliste',
    ltrRating: 'LTR-Bewertung',
    matchesPlayed: 'Gespielte Matches',
    matchesWon: 'Gewonnene Matches',
    matchesLost: 'Verlorene Matches',
    winRate: 'Siegquote',
    currentStreak: 'Aktuelle Serie',
    bestStreak: 'Beste Serie',
    favoriteOpponent: 'Lieblingsgegner',
    favoriteLocation: 'Lieblingsort',
    averageMatchDuration: 'Durchschnittliche Match-Dauer',
    totalPlayTime: 'Gesamtspielzeit',
    lastMatch: 'Letztes Match',
    nextMatch: 'Nächstes Match',
    viewHistory: 'Verlauf anzeigen',
    compareStats: 'Statistiken vergleichen',
    shareStats: 'Statistiken teilen',
  },

  searchPlayers: {
    title: 'Spieler suchen',
    searchPlaceholder: 'Nach Name oder Benutzernamen suchen',
    filters: 'Filter',
    skillLevel: 'Spielstärke',
    location: 'Standort',
    availability: 'Verfügbarkeit',
    playStyle: 'Spielstil',
    distance: 'Entfernung',
    anySkillLevel: 'Alle Spielstärken',
    anyLocation: 'Alle Orte',
    anyTime: 'Jederzeit',
    applyFilters: 'Filter anwenden',
    clearFilters: 'Filter zurücksetzen',
    noResults: 'Keine Ergebnisse',
    foundPlayers: 'Gefundene Spieler',
    viewProfile: 'Profil anzeigen',
    sendRequest: 'Anfrage senden',
    addFriend: 'Freund hinzufügen',
    nearMe: 'In meiner Nähe',
    similarSkill: 'Ähnliche Spielstärke',
  },

  chat: {
    title: 'Chat',
    conversations: 'Unterhaltungen',
    messages: 'Nachrichten',
    newMessage: 'Neue Nachricht',
    typeMessage: 'Nachricht eingeben',
    send: 'Senden',
    noConversations: 'Keine Unterhaltungen',
    noMessages: 'Keine Nachrichten',
    startConversation: 'Unterhaltung beginnen',
    selectContact: 'Kontakt auswählen',
    search: 'Suchen',
    today: 'Heute',
    yesterday: 'Gestern',
    read: 'Gelesen',
    delivered: 'Zugestellt',
    sent: 'Gesendet',
    typing: 'Tippt',
    online: 'Online',
    offline: 'Offline',
    lastSeen: 'Zuletzt online',
    deleteConversation: 'Unterhaltung löschen',
    muteConversation: 'Unterhaltung stummschalten',
    blockUser: 'Benutzer blockieren',
  },

  achievements: {
    title: 'Erfolge',
    unlocked: 'Freigeschaltet',
    locked: 'Gesperrt',
    progress: 'Fortschritt',
    recentlyUnlocked: 'Kürzlich freigeschaltet',
    all: 'Alle',
    categories: 'Kategorien',
    matches: 'Matches',
    social: 'Soziales',
    clubs: 'Vereine',
    special: 'Spezial',
    viewDetails: 'Details anzeigen',
    share: 'Teilen',
    noAchievements: 'Keine Erfolge',
    earnedDate: 'Erhalten am',
    rarity: 'Seltenheit',
    common: 'Häufig',
    rare: 'Selten',
    epic: 'Episch',
    legendary: 'Legendär',
    pointsEarned: 'Erhaltene Punkte',
    totalPoints: 'Gesamtpunkte',
    nextAchievement: 'Nächster Erfolg',
  },

  feedback: {
    title: 'Feedback',
    giveFeedback: 'Feedback geben',
    yourFeedback: 'Ihr Feedback',
    category: 'Kategorie',
    bugReport: 'Fehlermeldung',
    featureRequest: 'Funktionswunsch',
    general: 'Allgemein',
    subject: 'Betreff',
    description: 'Beschreibung',
    attachScreenshot: 'Screenshot anhängen',
    submit: 'Absenden',
    cancel: 'Abbrechen',
    thankYou: 'Vielen Dank!',
    feedbackReceived: 'Ihr Feedback wurde erhalten',
    weWillReview: 'Wir werden es überprüfen',
    contactEmail: 'Kontakt-E-Mail',
    optional: 'Optional',
    attachments: 'Anhänge',
    priority: 'Priorität',
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
  },

  ranking: {
    title: 'Rangliste',
    global: 'Global',
    local: 'Lokal',
    club: 'Verein',
    friends: 'Freunde',
    rank: 'Rang',
    player: 'Spieler',
    rating: 'Bewertung',
    matches: 'Matches',
    winRate: 'Siegquote',
    viewProfile: 'Profil anzeigen',
    challenge: 'Herausfordern',
    yourRank: 'Ihr Rang',
    topPlayers: 'Top-Spieler',
    risingStars: 'Aufsteigende Sterne',
    filter: 'Filtern',
    timeframe: 'Zeitraum',
    thisWeek: 'Diese Woche',
    thisMonth: 'Diesen Monat',
    thisYear: 'Dieses Jahr',
    allTime: 'Alle Zeit',
    category: 'Kategorie',
    overall: 'Gesamt',
    singles: 'Einzel',
    doubles: 'Doppel',
  },
};

// Count untranslated keys (where de === en)
function countUntranslated(enObj, deObj, path = '') {
  let count = 0;

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], deObj[key] || {}, currentPath);
    } else {
      if (enObj[key] === (deObj[key] || enObj[key])) {
        count++;
      }
    }
  }

  return count;
}

// Count total keys
function countTotalKeys(obj) {
  let count = 0;

  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countTotalKeys(obj[key]);
    } else {
      count++;
    }
  }

  return count;
}

// Statistics before
console.log('\n📊 BEFORE TRANSLATION:');
const untranslatedBefore = countUntranslated(en, de);
const totalKeys = countTotalKeys(en);
console.log(`   Total keys: ${totalKeys}`);
console.log(`   Untranslated: ${untranslatedBefore}`);
console.log(`   Progress: ${(((totalKeys - untranslatedBefore) / totalKeys) * 100).toFixed(1)}%`);

// Apply translations
const updated = deepMerge(de, germanTranslations);

// Statistics after
console.log('\n📊 AFTER TRANSLATION:');
const untranslatedAfter = countUntranslated(en, updated);
const translated = untranslatedBefore - untranslatedAfter;
console.log(`   Keys translated: ${translated}`);
console.log(`   Remaining untranslated: ${untranslatedAfter}`);
console.log(`   Progress: ${(((totalKeys - untranslatedAfter) / totalKeys) * 100).toFixed(1)}%`);

// Save updated file
fs.writeFileSync(dePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('\n✅ Translation complete! Updated file saved.');
console.log(`📁 ${dePath}\n`);
