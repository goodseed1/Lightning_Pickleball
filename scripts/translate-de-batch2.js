const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Batch 2 - Remaining German translations
const germanTranslations = {
  common: {
    ok: 'OK',
  },

  auth: {
    register: {
      displayName: 'Name',
      success: {
        ok: 'OK',
      },
    },
  },

  createClub: {
    facility: {
      ballmachine: 'Ballmaschine',
      proshop: 'Pro-Shop',
    },
    fields: {
      fee_placeholder: 'z.B. 50',
      logo: 'Logo',
    },
    validation: {
      descValid: 'Tolle Beschreibung! ✅',
    },
  },

  clubList: {
    peopleCount: ' Mitglieder',
    clubType: {
      casual: 'Locker',
      competitive: 'Wettbewerbsorientiert',
    },
    emptyState: {
      tryDifferentSearch: 'Versuchen Sie einen anderen Suchbegriff',
    },
    filters: {
      nearby: 'In der Nähe',
    },
  },

  scheduleMeetup: {
    weekly: 'Jede',
    form: {
      meetingName: 'Treffpunktname *',
    },
  },

  profile: {
    settingsTab: {
      administrator: 'Administrator',
    },
    userProfile: {
      playerInfo: {
        playingStyle: 'Spielstil',
        languages: 'Sprachen',
        availability: 'Verfügbarkeit',
        weekdays: 'Wochentage',
        weekends: 'Wochenenden',
      },
      matchHistory: {
        title: 'Letzter Spielverlauf',
        win: 'S',
        loss: 'N',
      },
      timeSlots: {
        earlyMorning: 'Früher Morgen',
        morning: 'Morgen',
        afternoon: 'Nachmittag',
        evening: 'Abend',
        night: 'Nacht',
        brunch: 'Brunch',
      },
    },
  },

  profileSetup: {
    alerts: {
      nicknameChecking: {
        title: 'Überprüfung',
      },
      genderNotSelected: {
        title: 'Geschlecht nicht ausgewählt',
      },
    },
  },

  onboarding: {
    maxDistance: 'Max {{distance}}km',
  },

  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  ntrpAssessment: {
    confidence: 'Vertrauen',
    confidenceHigh: 'hoch',
    confidenceMedium: 'mittel',
    confidenceLow: 'niedrig',
    skills: 'Fähigkeiten',
    tactics: 'Taktik',
    experience: 'Erfahrung',
    selfAssessment: 'Selbsteinschätzung',
  },

  roles: {
    manager: 'Manager',
  },

  terms: {
    optional: 'Optional',
    details: {
      liabilityDisclaimer: {
        title: 'Haftungsausschluss',
      },
      marketingCommunications: {
        title: 'Zustimmung zu Marketingkommunikation',
      },
      inclusivityPolicy: {
        title: 'Richtlinie zu Vielfalt & Inklusion',
      },
    },
  },

  admin: {
    logs: {
      performanceLogs: 'Leistungsüberwachung',
      performanceLogsDesc: 'App-Leistungsmetriken',
      recentActivity: 'Letzte Aktivität',
      systemNormal: 'System läuft normal',
      statsUpdated: 'Tägliche Statistiken werden automatisch aktualisiert',
      userActivity: 'Benutzeraktivität',
      newSignup: 'Neue Anmeldung',
      users: 'Benutzer',
      matchesCreated: 'Spiele (Letzte 7 Tage)',
      entries: 'Einträge',
      justNow: 'Gerade eben',
      minutesAgo: ' Minuten her',
      hoursAgo: ' Stunden her',
      daysAgo: ' Tage her',
    },
    devTools: {
      matchesPlayed: 'Gespielte Spiele',
      eloRating: 'ELO-Bewertung',
      badges: '🏆 Verdiente Abzeichen',
      notificationDistance: 'Benachrichtigungsdistanzbereich',
      milesAway: 'Meilen entfernt',
      mile: 'Meile',
      miles: 'Meilen',
      quietHours: 'Ruhezeiten',
      korean: 'Koreanisch',
      appInfo: 'App-Info',
      developerTools: '🔧 Entwickler-Tools',
      resetting: 'Zurücksetzen...',
    },
    matchManagement: {
      title: 'Spielverwaltung',
      inProgress: 'In Bearbeitung',
      scheduled: 'Geplant',
      daysAgo: ' Tage her',
    },
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      tabs: {
        roleManagement: 'Rollenverwaltung',
      },
      roles: {
        manager: 'Manager',
      },
      actions: {
        promote: 'Zum Administrator befördern',
        manage: 'Verwalten',
        promoteToManager: 'Zum Manager befördern',
      },
      alerts: {
        roleChange: {
          title: 'Rolle ändern',
          message: '{{userName}} zu {{role}} ändern?',
        },
      },
      removalReason: {
        label: 'Entfernungsgrund (Optional)',
        defaultReason: 'Vom Administrator entfernt',
      },
      modal: {
        promoteTitle: 'Zum Manager befördern',
        promoteMessage: '{{userName}} zum Manager befördern?',
      },
    },
  },

  clubChat: {
    timeHoursAgo: 'vor {{hours}}h',
    timeMinutesAgo: 'vor {{minutes}}m',
    timeJustNow: 'Gerade eben',
    roleStaff: 'Personal',
    important: 'Wichtig',
  },

  rateSportsmanship: {
    submitting: 'Wird übermittelt...',
    submitButton: 'Ehrenabzeichen vergeben',
    submitNote:
      'Tags werden anonym verarbeitet und helfen beim Aufbau einer positiven Community-Kultur.',
  },

  matches: {
    title: 'Spiele',
    findMatch: 'Spiel finden',
    myMatches: 'Meine Spiele',
    upcoming: 'Anstehend',
    completed: 'Abgeschlossen',
    canceled: 'Abgesagt',
    pending: 'Ausstehend',
    accepted: 'Akzeptiert',
    declined: 'Abgelehnt',
    noMatches: 'Keine Spiele gefunden',
    createMatch: 'Spiel erstellen',
    matchDetails: 'Spieldetails',
    opponent: 'Gegner',
    date: 'Datum',
    time: 'Uhrzeit',
    location: 'Standort',
    score: 'Ergebnis',
    result: 'Resultat',
  },

  leagueManagement: {
    title: 'Liga-Verwaltung',
    createLeague: 'Liga erstellen',
    editLeague: 'Liga bearbeiten',
    deleteLeague: 'Liga löschen',
    leagueName: 'Liganame',
    season: 'Saison',
    divisions: 'Divisionen',
    teams: 'Teams',
    standings: 'Tabelle',
    schedule: 'Spielplan',
    addTeam: 'Team hinzufügen',
    removeTeam: 'Team entfernen',
    manageMatches: 'Spiele verwalten',
  },

  tournamentManagement: {
    title: 'Turnierverwaltung',
    createTournament: 'Turnier erstellen',
    editTournament: 'Turnier bearbeiten',
    deleteTournament: 'Turnier löschen',
    tournamentName: 'Turniername',
    format: 'Format',
    registrationOpen: 'Anmeldung offen',
    registrationClosed: 'Anmeldung geschlossen',
    participants: 'Teilnehmer',
    bracket: 'Turnierbaum',
    manageBracket: 'Turnierbaum verwalten',
    seeds: 'Setzliste',
  },

  achievements: {
    title: 'Erfolge',
    unlocked: 'Freigeschaltet',
    locked: 'Gesperrt',
    inProgress: 'In Bearbeitung',
    completed: 'Abgeschlossen',
    viewAll: 'Alle anzeigen',
    recentAchievements: 'Letzte Erfolge',
    rareAchievements: 'Seltene Erfolge',
    description: 'Beschreibung',
    progress: 'Fortschritt',
    reward: 'Belohnung',
  },

  rankings: {
    title: 'Ranglisten',
    global: 'Global',
    local: 'Lokal',
    club: 'Club',
    division: 'Division',
    overall: 'Gesamt',
    singles: 'Einzel',
    doubles: 'Doppel',
    rank: 'Rang',
    player: 'Spieler',
    rating: 'Bewertung',
    wins: 'Siege',
    losses: 'Niederlagen',
    winRate: 'Siegrate',
  },

  coaching: {
    title: 'Coaching',
    findCoach: 'Trainer finden',
    myCoaches: 'Meine Trainer',
    sessions: 'Sitzungen',
    bookSession: 'Sitzung buchen',
    coachProfile: 'Trainerprofil',
    specialties: 'Spezialitäten',
    experience: 'Erfahrung',
    availability: 'Verfügbarkeit',
    rate: 'Tarif',
    reviews: 'Bewertungen',
    contactCoach: 'Trainer kontaktieren',
  },

  equipment: {
    title: 'Ausrüstung',
    myGear: 'Meine Ausrüstung',
    addEquipment: 'Ausrüstung hinzufügen',
    racket: 'Schläger',
    shoes: 'Schuhe',
    balls: 'Bälle',
    accessories: 'Zubehör',
    brand: 'Marke',
    model: 'Modell',
    stringType: 'Saitentyp',
    tension: 'Spannung',
    grip: 'Griff',
    weight: 'Gewicht',
  },

  weather: {
    title: 'Wetter',
    current: 'Aktuell',
    forecast: 'Vorhersage',
    temperature: 'Temperatur',
    conditions: 'Bedingungen',
    wind: 'Wind',
    humidity: 'Luftfeuchtigkeit',
    precipitation: 'Niederschlag',
    uv: 'UV-Index',
    playableConditions: 'Spielbare Bedingungen',
    idealForTennis: 'Ideal für Tennis',
  },

  courtBooking: {
    title: 'Platzbuchung',
    bookCourt: 'Platz buchen',
    myBookings: 'Meine Buchungen',
    availableCourts: 'Verfügbare Plätze',
    selectDate: 'Datum auswählen',
    selectTime: 'Zeit auswählen',
    duration: 'Dauer',
    courtType: 'Platztyp',
    indoor: 'Innen',
    outdoor: 'Außen',
    surface: 'Oberfläche',
    hardCourt: 'Hartplatz',
    clay: 'Sand',
    grass: 'Rasen',
    confirmBooking: 'Buchung bestätigen',
    cancelBooking: 'Buchung stornieren',
  },

  rewards: {
    title: 'Belohnungen',
    points: 'Punkte',
    myRewards: 'Meine Belohnungen',
    redeemPoints: 'Punkte einlösen',
    earnPoints: 'Punkte verdienen',
    pointsHistory: 'Punkteverlauf',
    rewardsCatalog: 'Belohnungskatalog',
    available: 'Verfügbar',
    redeemed: 'Eingelöst',
    expired: 'Abgelaufen',
    expiresOn: 'Läuft ab am',
  },

  referrals: {
    title: 'Empfehlungen',
    inviteFriends: 'Freunde einladen',
    referralCode: 'Empfehlungscode',
    shareCode: 'Code teilen',
    myReferrals: 'Meine Empfehlungen',
    pending: 'Ausstehend',
    completed: 'Abgeschlossen',
    rewards: 'Belohnungen',
    inviteMore: 'Mehr einladen',
    copyCode: 'Code kopieren',
    codeCopied: 'Code kopiert',
  },

  feedback: {
    title: 'Feedback',
    sendFeedback: 'Feedback senden',
    reportBug: 'Fehler melden',
    requestFeature: 'Funktion anfordern',
    category: 'Kategorie',
    description: 'Beschreibung',
    screenshot: 'Screenshot',
    submit: 'Absenden',
    thankYou: 'Vielen Dank für Ihr Feedback!',
    feedbackReceived: 'Feedback erhalten',
  },

  privacy: {
    title: 'Datenschutz',
    profileVisibility: 'Profilsichtbarkeit',
    public: 'Öffentlich',
    friendsOnly: 'Nur Freunde',
    private: 'Privat',
    showLocation: 'Standort anzeigen',
    showActivity: 'Aktivität anzeigen',
    allowMessages: 'Nachrichten erlauben',
    allowFriendRequests: 'Freundschaftsanfragen erlauben',
    blockList: 'Blockierliste',
    dataPrivacy: 'Datenschutz',
    downloadData: 'Daten herunterladen',
    deleteAccount: 'Konto löschen',
  },

  safety: {
    title: 'Sicherheit',
    meetSafely: 'Sicher treffen',
    tips: 'Tipps',
    publicPlace: 'An öffentlichen Orten treffen',
    tellFriend: 'Einem Freund Bescheid geben',
    trustInstinct: 'Auf Ihr Bauchgefühl hören',
    reportUser: 'Benutzer melden',
    blockUser: 'Benutzer blockieren',
    emergencyContacts: 'Notfallkontakte',
    safetyResources: 'Sicherheitsressourcen',
  },

  subscription: {
    title: 'Abonnement',
    plans: 'Pläne',
    currentPlan: 'Aktueller Plan',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    cancel: 'Kündigen',
    renews: 'Verlängert',
    expires: 'Läuft ab',
    billingHistory: 'Abrechnungsverlauf',
    paymentMethod: 'Zahlungsmethode',
    updatePayment: 'Zahlung aktualisieren',
    features: 'Funktionen',
    pricePerMonth: 'Preis pro Monat',
    pricePerYear: 'Preis pro Jahr',
  },

  support: {
    title: 'Support',
    helpCenter: 'Hilfezentrum',
    faq: 'Häufig gestellte Fragen',
    contactUs: 'Kontaktieren Sie uns',
    email: 'E-Mail',
    phone: 'Telefon',
    chat: 'Chat',
    hours: 'Öffnungszeiten',
    documentation: 'Dokumentation',
    tutorials: 'Tutorials',
    communityForum: 'Community-Forum',
  },

  verification: {
    title: 'Verifizierung',
    verifyAccount: 'Konto verifizieren',
    emailVerification: 'E-Mail-Verifizierung',
    phoneVerification: 'Telefonverifizierung',
    idVerification: 'ID-Verifizierung',
    verified: 'Verifiziert',
    pending: 'Ausstehend',
    notVerified: 'Nicht verifiziert',
    sendCode: 'Code senden',
    enterCode: 'Code eingeben',
    resendCode: 'Code erneut senden',
    verifyNow: 'Jetzt verifizieren',
  },

  analytics: {
    title: 'Analysen',
    overview: 'Übersicht',
    performance: 'Leistung',
    trends: 'Trends',
    insights: 'Erkenntnisse',
    reports: 'Berichte',
    export: 'Exportieren',
    dateRange: 'Datumsbereich',
    filter: 'Filter',
    compare: 'Vergleichen',
    lastWeek: 'Letzte Woche',
    lastMonth: 'Letzter Monat',
    lastYear: 'Letztes Jahr',
    custom: 'Benutzerdefiniert',
  },

  goals: {
    title: 'Ziele',
    myGoals: 'Meine Ziele',
    setGoal: 'Ziel setzen',
    editGoal: 'Ziel bearbeiten',
    deleteGoal: 'Ziel löschen',
    goalType: 'Zieltyp',
    target: 'Ziel',
    deadline: 'Frist',
    progress: 'Fortschritt',
    achieved: 'Erreicht',
    inProgress: 'In Bearbeitung',
    notStarted: 'Nicht gestartet',
    celebrate: 'Feiern',
  },

  training: {
    title: 'Training',
    myTraining: 'Mein Training',
    plans: 'Pläne',
    sessions: 'Sitzungen',
    exercises: 'Übungen',
    drills: 'Drills',
    workouts: 'Workouts',
    schedule: 'Zeitplan',
    log: 'Protokoll',
    progress: 'Fortschritt',
    statistics: 'Statistiken',
    createPlan: 'Plan erstellen',
    startSession: 'Sitzung starten',
    endSession: 'Sitzung beenden',
  },

  health: {
    title: 'Gesundheit',
    fitness: 'Fitness',
    injuries: 'Verletzungen',
    recovery: 'Erholung',
    nutrition: 'Ernährung',
    hydration: 'Flüssigkeitszufuhr',
    sleep: 'Schlaf',
    wellness: 'Wohlbefinden',
    logInjury: 'Verletzung protokollieren',
    recoveryTime: 'Erholungszeit',
    medicalHistory: 'Krankengeschichte',
    allergies: 'Allergien',
    medications: 'Medikamente',
  },

  social: {
    title: 'Sozial',
    friends: 'Freunde',
    followers: 'Follower',
    following: 'Folge ich',
    requests: 'Anfragen',
    suggestions: 'Vorschläge',
    activity: 'Aktivität',
    feed: 'Feed',
    groups: 'Gruppen',
    communities: 'Communities',
    invite: 'Einladen',
    accept: 'Akzeptieren',
    decline: 'Ablehnen',
    block: 'Blockieren',
    unblock: 'Freigeben',
    report: 'Melden',
  },

  video: {
    title: 'Videos',
    myVideos: 'Meine Videos',
    upload: 'Hochladen',
    record: 'Aufnehmen',
    library: 'Bibliothek',
    highlights: 'Highlights',
    analysis: 'Analyse',
    share: 'Teilen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    play: 'Abspielen',
    pause: 'Pause',
    tags: 'Tags',
    description: 'Beschreibung',
    visibility: 'Sichtbarkeit',
  },
};

// Read current de.json
const dePath = path.join(__dirname, '../src/locales/de.json');
const currentDe = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Merge translations
const updatedDe = deepMerge(currentDe, germanTranslations);

// Write back
fs.writeFileSync(dePath, JSON.stringify(updatedDe, null, 2) + '\n');

console.log('✅ German translations batch 2 completed!');
console.log('📊 Translated sections:');
Object.keys(germanTranslations).forEach(section => {
  const countKeys = obj => {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        count += countKeys(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  };
  const count = countKeys(germanTranslations[section]);
  console.log(`  ${section}: ${count} keys`);
});
