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

// Batch 4 - More specific sections
const germanTranslations = {
  myActivities: {
    header: {
      title: '👤 Meine Aktivitäten',
    },
    profile: {
      style: 'Stil: ',
      myStats: 'Meine Statistiken',
      earnedBadges: 'Verdiente Abzeichen',
      goals: 'Ziele',
    },
    stats: {
      eloRatingTrend: 'ELO-Bewertungs-Trend',
      lastSixMonths: 'Letzte 6 Monate',
      intermediateTier: 'Fortgeschrittene Stufe',
    },
    settings: {
      languageChangeComingSoon: 'Sprachwechsel-Funktion kommt bald.',
      currentLanguage: 'Deutsch',
    },
    alerts: {
      friendInvitation: {
        accepted: {
          title: 'Akzeptiert',
        },
      },
      eventEdit: {
        message: 'Veranstaltungsbearbeitungsfunktion kommt bald.',
      },
    },
  },

  profileSettings: {
    location: {
      permission: {
        granted: 'Erteilt',
        denied: 'Verweigert',
        undetermined: 'Nicht festgelegt',
        checking: 'Überprüfung...',
      },
      update: {
        gettingAddress: 'Adressinformationen abrufen...',
      },
    },
    theme: {
      lightMode: 'Hell-Modus',
      darkMode: 'Dunkel-Modus',
      followSystem: 'System folgen',
      lightModeSubtitle: 'Helles Design verwenden',
      darkModeSubtitle: 'Dunkles Design verwenden',
    },
    privacy: {
      message: 'Zu Datenschutzeinstellungen navigieren.',
    },
    deleteAccount: {
      finalConfirmationTitle: 'Endgültige Bestätigung',
    },
  },

  clubDuesManagement: {
    settings: {
      gracePeriod: 'Kulanzfrist',
      gracePeriodPlaceholder: 'Tage',
      paymentInstructionsPlaceholder: 'Anweisungen für Mitglieder',
      displayName: 'Anzeigename',
      accountInfo: 'Konto/ID-Info',
      dayUnit: '.',
      daysUnit: 'Tage',
    },
    status: {
      unpaid: 'Unbezahlt',
      overdue: 'Überfällig',
      collectionRate: 'Einzugsrate',
      autoInvoice: 'Auto-Rechnung',
    },
    unpaid: {
      markPaid: 'Als bezahlt markieren',
    },
  },

  types: {
    clubSchedule: {
      scheduleTypes: {
        practice: 'Trainingseinheit',
        social: 'Soziales Tennis',
        clinic: 'Trainingsklinik',
        beginner_friendly: 'Anfängerfreundlich',
        custom: 'Benutzerdefinierte Veranstaltung',
      },
      recurrence: {
        biweekly: 'Alle zwei Wochen',
        custom: 'Benutzerdefinierter Zeitplan',
      },
      timePeriod: {
        am: 'AM',
        pm: 'PM',
      },
    },
    dues: {
      paymentStatus: {
        unpaid: 'Unbezahlt',
        overdue: 'Überfällig',
        exempt: 'Befreit',
      },
    },
  },

  eventCard: {
    partnerStatus: {
      partnerDeclined: 'Partner hat abgelehnt',
    },
    matchTypeSelector: {
      mixed: 'Mixed',
    },
    eventTypes: {
      meetup: 'Treffpunkt',
      casual: 'Locker',
      ranked: 'Gewertet',
      general: 'Allgemein',
    },
    labels: {
      almostFull: 'Fast ausgebucht',
      friendly: 'Freundlich',
    },
    buttons: {
      chat: 'Chat',
      registrationClosed: 'Anmeldung geschlossen',
    },
    requirements: {
      genderMismatch: 'Geschlechts-Inkompatibilität',
    },
  },

  clubTournamentManagement: {
    detailTabs: {
      management: 'Verwaltung',
    },
    status: {
      inProgress: 'In Bearbeitung',
    },
    buttons: {
      assignSeeds: 'Setzliste zuweisen',
    },
    stats: {
      champion: 'Champion: ',
    },
    matchInfo: {
      registered: 'Angemeldet',
    },
    roundGeneration: {
      generating: 'Wird generiert...',
    },
    matchResult: {
      info: 'Spiel-Info',
    },
    common: {
      confirm: 'OK',
      generate: 'Generieren',
      assign: 'Zuweisen',
    },
  },

  feedCard: {
    justNow: 'Gerade eben',
    minutesAgo: 'vor {{minutes}}m',
    hoursAgo: 'vor {{hours}}h',
    daysAgo: 'vor {{days}}d',
    newMemberJoined: '{{actorName}} ist {{clubName}} beigetreten',
    leagueCreated: '{{actorName}} hat {{leagueName}} erstellt',
    leaguePlayoffs: {
      finals: '{{actorName}} ist im Finale von {{leagueName}}',
      semifinals: '{{actorName}} ist im Halbfinale von {{leagueName}}',
      quarterfinals: '{{actorName}} ist im Viertelfinale von {{leagueName}}',
    },
    actorActivity: '{{actorName}} hatte eine Aktivität',
  },

  // Additional sections from remaining keys
  clubSchedule: {
    title: 'Club-Zeitplan',
    recurring: 'Wiederkehrend',
    oneTime: 'Einmalig',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    scheduleDetails: 'Zeitplan-Details',
    addSchedule: 'Zeitplan hinzufügen',
    editSchedule: 'Zeitplan bearbeiten',
    deleteSchedule: 'Zeitplan löschen',
  },

  playerRanking: {
    title: 'Spieler-Rangliste',
    overall: 'Gesamt',
    monthly: 'Monatlich',
    weekly: 'Wöchentlich',
    rank: 'Rang',
    player: 'Spieler',
    rating: 'Bewertung',
    change: 'Änderung',
    trend: 'Trend',
  },

  matchRequest: {
    title: 'Spielanfrage',
    sendRequest: 'Anfrage senden',
    acceptRequest: 'Anfrage annehmen',
    declineRequest: 'Anfrage ablehnen',
    pending: 'Ausstehend',
    accepted: 'Angenommen',
    declined: 'Abgelehnt',
    expired: 'Abgelaufen',
    message: 'Nachricht',
    suggestedDate: 'Vorgeschlagenes Datum',
    suggestedTime: 'Vorgeschlagene Uhrzeit',
    suggestedLocation: 'Vorgeschlagener Standort',
  },

  tournamentBracket: {
    title: 'Turnierbaum',
    round1: 'Runde 1',
    round2: 'Runde 2',
    quarterfinals: 'Viertelfinale',
    semifinals: 'Halbfinale',
    finals: 'Finale',
    winner: 'Gewinner',
    matchup: 'Paarung',
    tbd: 'Noch zu bestimmen',
    bye: 'Freilos',
  },

  leagueStandings: {
    title: 'Liga-Tabelle',
    position: 'Position',
    team: 'Team',
    player: 'Spieler',
    played: 'Gespielt',
    won: 'Gewonnen',
    lost: 'Verloren',
    points: 'Punkte',
    percentage: 'Prozentsatz',
    streak: 'Serie',
    lastFive: 'Letzte 5',
  },

  clubAnnouncements: {
    title: 'Club-Ankündigungen',
    create: 'Ankündigung erstellen',
    edit: 'Ankündigung bearbeiten',
    delete: 'Ankündigung löschen',
    pin: 'Anheften',
    unpin: 'Lösen',
    urgent: 'Dringend',
    general: 'Allgemein',
    event: 'Veranstaltung',
    maintenance: 'Wartung',
    postedBy: 'Gepostet von',
    postedOn: 'Gepostet am',
  },

  membershipTiers: {
    title: 'Mitgliedschaftsstufen',
    basic: 'Basis',
    premium: 'Premium',
    vip: 'VIP',
    benefits: 'Vorteile',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    current: 'Aktuell',
    recommended: 'Empfohlen',
    price: 'Preis',
    features: 'Funktionen',
  },

  courtReservation: {
    title: 'Platzreservierung',
    available: 'Verfügbar',
    reserved: 'Reserviert',
    maintenance: 'Wartung',
    selectCourt: 'Platz auswählen',
    selectDate: 'Datum auswählen',
    selectTime: 'Zeit auswählen',
    duration: 'Dauer',
    reserve: 'Reservieren',
    cancel: 'Stornieren',
    modify: 'Ändern',
    myReservations: 'Meine Reservierungen',
  },

  practicePartner: {
    title: 'Trainingspartner',
    findPartner: 'Partner finden',
    myPartners: 'Meine Partner',
    requests: 'Anfragen',
    regular: 'Regelmäßig',
    occasional: 'Gelegentlich',
    skillMatch: 'Fähigkeits-Übereinstimmung',
    scheduleMatch: 'Zeitplan-Übereinstimmung',
    favorite: 'Favorit',
    block: 'Blockieren',
  },
};

// Read current de.json
const dePath = path.join(__dirname, '../src/locales/de.json');
const currentDe = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Merge translations
const updatedDe = deepMerge(currentDe, germanTranslations);

// Write back
fs.writeFileSync(dePath, JSON.stringify(updatedDe, null, 2) + '\n');

console.log('✅ German translations batch 4 completed!');
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
