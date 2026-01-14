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

// Batch 3 - Specific missing keys
const germanTranslations = {
  duesManagement: {
    tabs: {
      status: 'Status',
    },
    alerts: {
      ok: 'OK',
      enableAutoInvoice: 'Auto-Rechnung aktivieren',
      added: 'Hinzugefügt',
    },
    settings: {
      autoInvoiceDesc: 'Monatliche Rechnungen automatisch senden',
      daysLabel: 'Tage',
      bank: 'Bank',
      venmo: 'Venmo',
    },
    modals: {
      manageLateFeesTitle: 'Verspätungsgebühren verwalten',
      qrCodeDialog: 'QR-Code',
      tapToUploadQr: 'Tippen Sie, um QR-Code-Bild hochzuladen',
    },
    overview: {
      autoInvoiceLabel: 'Auto-Rechnung',
      clickAutoInvoice:
        "Klicken Sie oben auf 'Auto-Rechnung', um monatliche Rechnungen automatisch an alle Mitglieder zu senden.",
    },
    memberCard: {
      exempt: 'Befreit',
      owed: 'Schuldet',
      lateFeeItems: 'Posten',
      unpaidLabel: 'Unbezahlt',
    },
    paymentForm: {
      transactionId: 'Transaktions-ID (Optional)',
      notes: 'Notizen (Optional)',
      markAsPaid: 'Als bezahlt markieren',
    },
    paymentDetails: {
      requested: 'Angefordert',
      notes: 'Notizen',
    },
    types: {
      quarterly: 'Vierteljährlich',
      adminAdded: 'Manuell vom Administrator hinzugefügt',
    },
    inputs: {
      gracePeriodLabel: 'Kulanzfrist (Tage)',
      paymentMethodPlaceholder: 'z.B. PayPal, KakaoPay',
      addPaymentPlaceholder: 'z.B. PayPal, KakaoPay',
    },
    countSuffix: '',
  },

  services: {
    activity: {
      notifications: {
        playoffsQualifiedTitle: '🏆 Playoffs qualifiziert!',
      },
      tennisUserFallback: 'TennisUser{{id}}',
    },
    camera: {
      permissionMessage: 'Kameraberechtigung wird benötigt, um Profilfotos aufzunehmen.',
      camera: 'Kamera',
      fileSizeError: 'Dateigröße überschritten',
    },
    feed: {
      reportTitle: '[Feed-Meldung] {{contentSummary}}',
    },
    notification: {
      matchReminder: '🎾 Spiel-Erinnerung',
      newLightningMatch: '⚡ Neues Blitz-Spiel: {{title}}',
    },
    performanceAnalytics: {
      insights: {
        lowFrequency: {
          title: 'Spielfrequenz erhöhen',
        },
        bestTimeSlot: {
          recommendations: {
            analyze: 'Analysieren Sie, was diesen Zeitslot für Sie funktionieren lässt',
          },
        },
      },
      monthlyReport: {
        improvements: {
          serveSpeed: 'Aufschlaggeschwindigkeit',
          backhandStability: 'Rückhand-Stabilität',
          netPlay: 'Netzspiel',
        },
        nextMonthGoals: {
          practiceFrequency: 'Trainingsziel',
        },
      },
    },
    leaderboard: {
      challenges: {
        weeklyMatches: {
          title: 'Wöchentliche Spiel-Herausforderung',
          reward: '100 Punkte + "Wöchentlicher Krieger" Abzeichen',
        },
        winStreak: {
          description: '3 aufeinanderfolgende Siege erzielen',
          reward: '200 Punkte + "Striker" Abzeichen',
        },
        monthlyImprovement: {
          title: 'Monatliche Verbesserung',
          reward: '500 Punkte + "Verbesserungskönig" Abzeichen',
        },
        socialPlayer: {
          reward: '300 Punkte + "Sozialer Schmetterling" Abzeichen',
        },
      },
      achievements: {
        totalWins10: {
          description: '10 Siege insgesamt erzielen',
        },
        totalWins50: {
          description: '50 Siege insgesamt erzielen',
        },
        matchesPlayed10: {
          name: 'Erfahrung sammeln',
        },
        earlyBird: {
          name: 'Frühaufsteher',
        },
        nightOwl: {
          name: 'Nachteule',
        },
      },
    },
  },

  aiMatching: {
    analyzing: {
      title: 'KI-Matching-Analyse',
      steps: {
        profile: 'Profil analysieren...',
        schedule: 'Zeitplan-Kompatibilität prüfen...',
      },
    },
    results: {
      tipsTitle: 'KI-Matching-Tipps',
    },
    candidate: {
      skillLevel: {
        elementary: 'Grundkenntnisse',
      },
      attributes: {
        strengths: 'Hauptstärken',
        playStyle: 'Spielstil',
      },
      playStyles: {
        aggressive: 'Aggressiv',
        defensive: 'Defensiv',
      },
      strengths: {
        volley: 'Volley',
        strategic: 'Strategisches Spiel',
        backhand: 'Rückhand',
        forehand: 'Vorhand',
        netPlay: 'Netzspiel',
        mental: 'Mental',
      },
      availability: {
        morning: 'Morgen (6-12)',
        afternoon: 'Nachmittag (12-18)',
        evening: 'Abend (18-22)',
        weekend: 'Wochenende',
      },
      selected: 'Ausgewählt',
    },
    mockData: {
      candidate1: {
        name: 'Junsu Kim',
      },
      candidate2: {
        name: 'Seoyeon Lee',
        bio: 'Suche Partner, um gemeinsam zu wachsen.',
      },
      candidate3: {
        name: 'Minjae Park',
      },
    },
  },

  cards: {
    hostedEvent: {
      weather: {
        sunny: 'Sonnig',
        partlycloudy: 'Teilweise bewölkt',
        mostlycloudy: 'Überwiegend bewölkt',
        cloudy: 'Bewölkt',
        overcast: 'Bedeckt',
        fog: 'Nebel',
        lightrain: 'Leichter Regen',
        rain: 'Regen',
        heavyrain: 'Starkregen',
        drizzle: 'Nieselregen',
        showers: 'Schauer',
        thunderstorm: 'Gewitter',
        snow: 'Schnee',
        lightsnow: 'Leichter Schnee',
        heavysnow: 'Starker Schneefall',
        sleet: 'Graupel',
        hail: 'Hagel',
        windy: 'Windig',
        humid: 'Feucht',
        hot: 'Heiß',
        cold: 'Kalt',
      },
    },
  },

  createEvent: {
    fields: {
      partner: 'Partner',
      inviteFriends: 'Freunde einladen',
      inviteAppUsers: 'App-Benutzer einladen',
      smsFriendInvitations: 'SMS-Freundeseinladungen',
    },
    placeholders: {
      titleMeetup: 'z.B. Wochenend-Spaß-Rally',
    },
    gameTypes: {
      mixed: 'Mixed',
    },
    gameTypeOptions: {
      rally: 'Rally/Training',
    },
    skillDescriptions: {
      beginner: 'Anfänger - Neu im Tennis oder lernt grundlegende Schläge',
      elementary:
        'Grundkenntnisse - Kann grundlegende Schläge ausführen, versteht Doppel-Grundlagen',
      intermediate: 'Fortgeschritten - Konsistente Schläge, strategisches Spiel',
    },
    sms: {
      defaultSender: 'Ein Freund',
      numbersToInvite: 'Nummern zum Einladen:',
    },
    search: {
      searchingUsers: 'Benutzer suchen...',
    },
    alerts: {
      confirm: 'OK',
    },
    languages: {
      korean: '한국어',
      english: 'English',
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  performanceDashboard: {
    loading: 'Leistung analysieren...',
    stats: {
      matchQuality: 'Spielqualität',
      playingFrequency: 'Spielfrequenz',
      averageSatisfaction: 'Durchschnittliche Zufriedenheit',
      winsLosses: '{{wins}}S {{losses}}N',
    },
    charts: {
      winRateTrend: {
        subtitle: 'Wöchentliche Siegraten-Änderungen',
      },
      timePerformance: {
        subtitle: 'Bevorzugte Spielzeiten',
      },
    },
    timeSlots: {
      morning: 'Morgen',
      afternoon: 'Nachmittag',
      evening: 'Abend',
    },
    dayLabels: {
      mon: 'Mo',
      tue: 'Di',
      wed: 'Mi',
      thu: 'Do',
      fri: 'Fr',
      sat: 'Sa',
      sun: 'So',
    },
    monthlyReport: {
      title: 'Monatsbericht',
      improvements: 'Verbesserungsbereiche',
    },
    detailedAnalysis: {
      title: 'Detaillierte Analyse',
    },
  },

  hostedEventCard: {
    labels: {
      dateTime: 'Datum & Uhrzeit',
      location: 'Standort',
      skillLevel: 'Fähigkeitsstufe',
      maxParticipants: 'Maximale Teilnehmer',
      currentParticipants: 'Aktuelle Teilnehmer',
      cost: 'Kosten',
      organizer: 'Organisator',
    },
    actions: {
      join: 'Teilnehmen',
      leave: 'Verlassen',
      edit: 'Bearbeiten',
      cancel: 'Absagen',
      share: 'Teilen',
      viewDetails: 'Details anzeigen',
    },
    status: {
      full: 'Ausgebucht',
      available: 'Verfügbar',
      canceled: 'Abgesagt',
      completed: 'Abgeschlossen',
    },
  },

  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Ligen',
      tournaments: 'Turniere',
    },
    actions: {
      create: 'Erstellen',
      join: 'Beitreten',
      register: 'Anmelden',
      view: 'Anzeigen',
    },
    filters: {
      all: 'Alle',
      active: 'Aktiv',
      upcoming: 'Anstehend',
      past: 'Vergangene',
    },
    details: {
      startDate: 'Startdatum',
      endDate: 'Enddatum',
      format: 'Format',
      participants: 'Teilnehmer',
      standings: 'Tabelle',
      schedule: 'Spielplan',
    },
  },

  meetupDetail: {
    sections: {
      info: 'Informationen',
      participants: 'Teilnehmer',
      location: 'Standort',
      weather: 'Wetter',
    },
    actions: {
      join: 'Beitreten',
      leave: 'Verlassen',
      edit: 'Bearbeiten',
      cancel: 'Absagen',
      share: 'Teilen',
      directions: 'Wegbeschreibung',
      contact: 'Kontakt',
    },
    labels: {
      organizer: 'Organisator',
      dateTime: 'Datum & Uhrzeit',
      location: 'Standort',
      skillLevel: 'Fähigkeitsstufe',
      cost: 'Kosten',
      status: 'Status',
    },
  },

  leagueDetail: {
    tabs: {
      overview: 'Übersicht',
      standings: 'Tabelle',
      schedule: 'Spielplan',
      stats: 'Statistiken',
      rules: 'Regeln',
    },
    standings: {
      rank: 'Rang',
      team: 'Team',
      wins: 'Siege',
      losses: 'Niederlagen',
      points: 'Punkte',
    },
    schedule: {
      upcoming: 'Anstehend',
      completed: 'Abgeschlossen',
      date: 'Datum',
      time: 'Uhrzeit',
      teams: 'Teams',
      result: 'Ergebnis',
    },
  },

  badgeGallery: {
    filters: {
      all: 'Alle',
      earned: 'Verdient',
      locked: 'Gesperrt',
      rare: 'Selten',
    },
    details: {
      name: 'Name',
      description: 'Beschreibung',
      requirement: 'Anforderung',
      rarity: 'Seltenheit',
      dateEarned: 'Verdient am',
      progress: 'Fortschritt',
    },
    rarity: {
      common: 'Gewöhnlich',
      rare: 'Selten',
      epic: 'Episch',
      legendary: 'Legendär',
    },
  },

  editProfile: {
    sections: {
      personal: 'Persönlich',
      tennis: 'Tennis',
      contact: 'Kontakt',
      preferences: 'Präferenzen',
    },
    fields: {
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      phone: 'Telefon',
      dateOfBirth: 'Geburtsdatum',
      gender: 'Geschlecht',
      skillLevel: 'Fähigkeitsstufe',
      playStyle: 'Spielstil',
      preferredHand: 'Bevorzugte Hand',
      location: 'Standort',
      bio: 'Biografie',
    },
    actions: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      uploadPhoto: 'Foto hochladen',
      changePassword: 'Passwort ändern',
    },
  },

  matches: {
    filters: {
      all: 'Alle',
      upcoming: 'Anstehend',
      completed: 'Abgeschlossen',
      canceled: 'Abgesagt',
    },
    status: {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      inProgress: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      canceled: 'Abgesagt',
    },
    actions: {
      create: 'Erstellen',
      join: 'Teilnehmen',
      cancel: 'Absagen',
      reschedule: 'Neu planen',
      viewDetails: 'Details anzeigen',
    },
  },
};

// Read current de.json
const dePath = path.join(__dirname, '../src/locales/de.json');
const currentDe = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Merge translations
const updatedDe = deepMerge(currentDe, germanTranslations);

// Write back
fs.writeFileSync(dePath, JSON.stringify(updatedDe, null, 2) + '\n');

console.log('✅ German translations batch 3 completed!');
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
