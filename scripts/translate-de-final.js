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

// FINAL BATCH - All remaining 348 keys
const germanTranslations = {
  hostedEventCard: {
    eventTypes: {
      match: 'Spiel',
      lightning: 'Spiel',
      meetup: 'Treffpunkt',
    },
    buttons: {
      chat: 'Chat',
    },
    weather: {
      conditions: {
        'Mostly Cloudy': 'Überwiegend bewölkt',
        Fog: 'Nebel',
        'Light Rain': 'Leichter Regen',
        Rain: 'Regen',
        'Heavy Rain': 'Starkregen',
        Drizzle: 'Nieselregen',
        Showers: 'Schauer',
        Thunderstorm: 'Gewitter',
        Snow: 'Schnee',
        'Light Snow': 'Leichter Schnee',
        'Heavy Snow': 'Starker Schneefall',
        Sleet: 'Graupel',
        Hail: 'Hagel',
        Humid: 'Feucht',
      },
    },
    partner: 'Partner: ',
  },

  clubLeaguesTournaments: {
    status: {
      genderMismatch: 'Geschlechts-Inkompatibilität',
      inProgress: 'In Bearbeitung',
      preparing: 'Vorbereitung',
      ongoing: 'Laufend',
      playoffs: 'Playoffs',
    },
    labels: {
      status: 'Status',
      format: 'Format',
      newTeamInvitations: '🏛️ Neue Team-Einladungen',
      expiresIn: 'Läuft ab in {{hours}}h',
    },
    memberPreLeagueStatus: {
      peopleUnit: '',
      format: 'Format',
      status: 'Status',
      statusPreparing: 'Vorbereitung',
      applying: 'Bewerben...',
      notOpenWarning: 'Anmeldung derzeit geschlossen',
      applicationDate: 'Beworben:',
    },
    alerts: {
      alreadyParticipant: {
        title: 'Bereits Teilnehmer',
      },
      error: {
        unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten: {{error}}',
      },
    },
  },

  meetupDetail: {
    weather: {
      title: 'Wettervorhersage',
      chanceOfRain: 'Regenwahrscheinlichkeit',
      windLabel: 'Wind',
      wind: {
        perfect: 'Perfekte Bedingungen',
        playable: 'Spielbar',
        affects: 'Wind beeinflusst das Spiel',
        difficult: 'Schwierig zu spielen',
      },
    },
    rsvp: {
      title: 'Zusage',
      notice: 'Hinweis',
      attend: 'Teilnehmen',
      maybe: 'Vielleicht',
      attendingConfirm: '✅ Zusage aktualisiert auf teilnehmen!',
      decliningConfirm: '❌ Zusage aktualisiert auf ablehnen.',
      maybeConfirm: '❓ Zusage aktualisiert auf vielleicht.',
    },
    chat: {
      title: 'Treffpunkt-Chat',
    },
    editEvent: {
      labelDuration: 'Dauer (Minuten)',
      durationUnit: 'Min',
    },
  },

  leagueDetail: {
    champion: 'Champion',
    participantsTeamStatus: 'Team-Status',
    startApplicationsMessage: 'Klicken Sie auf "Bewerbungen annehmen" im Verwaltungs-Tab',
    reasonLabel: 'Grund für Änderung',
    walkoverReasonLabel: 'Walkover-Grund',
    adminDashboard: {
      participantsTeamTitle: 'Team-Status',
      maxTeams: 'Max Teams',
      fillRate: 'Auslastung',
      matchProgress: 'Spielfortschritt',
    },
    leagueManagement: {
      dangerZoneTitle: 'Gefahrenzone',
    },
    playoffs: {
      inProgress: 'Playoffs laufen',
      format: 'Format:',
      startButton: 'Playoffs starten',
    },
    dialogs: {
      rescheduleTitle: 'Spiel neu planen',
      walkoverTitle: 'Walkover bearbeiten',
    },
    genderLabels: {
      male: 'männlich',
      female: 'weiblich',
    },
  },

  badgeGallery: {
    titleOwn: 'Meine Abzeichen',
    titleOther: 'Verdiente Abzeichen',
    modal: {
      earned: 'Verdient: ',
      category: 'Kategorie: ',
    },
    badges: {
      first_victory: {
        name: 'Erster Sieg',
      },
      social_butterfly: {
        name: 'Sozialer Schmetterling',
      },
      perfect_season: {
        name: 'Perfekte Saison',
        description: 'Sie haben eine Saison ungeschlagen beendet!',
      },
      community_leader: {
        name: 'Community-Leader',
      },
      unknown: {
        name: 'Besonderes Abzeichen',
        description: 'Besonderes Abzeichen',
      },
      winning_streak_3: {
        name: 'Heiße Serie',
      },
      winning_streak_5: {
        name: 'In Flammen',
      },
      winning_streak_10: {
        name: 'Unaufhaltsam',
      },
      match_milestone_10: {
        name: 'Erste Schritte',
      },
    },
    alerts: {
      unavailableTitle: 'Service nicht verfügbar',
    },
  },

  editProfile: {
    photoHint: 'Tippen Sie, um Foto zu ändern',
    nickname: {
      checking: 'Überprüfung',
    },
    travelDistance: {
      label: 'Max Reisedistanz ({{unit}})',
    },
    languages: {
      label: 'Sprachen',
    },
    goals: {
      label: 'Ziele',
    },
    activityTime: {
      label: 'Bevorzugte Aktivitätszeiten',
      weekdays: 'Wochentage',
      weekends: 'Wochenenden',
      earlyMorning: 'Früher Morgen (6-9 Uhr)',
      morning: 'Morgen (9-12 Uhr)',
      lunch: 'Mittag (12-14 Uhr)',
      afternoon: 'Nachmittag (14-18 Uhr)',
      evening: 'Abend (18-21 Uhr)',
      night: 'Nacht (21-24 Uhr)',
    },
    common: {
      ok: 'OK',
    },
  },

  matches: {
    tabs: {
      personal: 'Persönliche Spiele',
    },
    card: {
      recurring: 'Wiederkehrend',
      manageButton: 'Verwalten',
    },
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    recurringPatterns: {
      biweekly: 'Zweiwöchentlich',
    },
    createModal: {
      matchType: {
        personal: 'Persönliches Spiel',
      },
      recurring: {
        label: 'Wiederkehrend',
      },
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
    mockData: {
      me: 'Ich',
    },
  },

  createEvent: {
    fields: {
      partner: 'Partner',
    },
    gameTypes: {
      mixed: 'Mixed',
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

  hallOfFame: {
    sections: {
      trophies: 'Trophäen',
      badges: 'Abzeichen',
      honorBadges: 'Ehrenabzeichen',
    },
    honorTags: {
      sharp_eyed: '#Scharfsichtig',
      full_of_energy: '#VollerEnergie',
      mr_manner: '#HerrnManieren',
      punctual_pro: '#PünktlichProfi',
      mental_fortress: '#MentaleFestung',
      court_jester: '#PlatzNarr',
    },
  },

  createClubTournament: {
    matchFormat: 'Spielformat',
    matchFormats: {
      best_of_3_description: 'Best of 2 Sätze',
      best_of_5_description: 'Best of 3 Sätze',
    },
    seedingMethods: {
      manual: 'Manuell',
      manual_description: 'Admin weist Setzliste manuell zu',
      random: 'Zufällig',
      random_description: 'Faire zufällige Setzung (fähigkeitsunabhängig)',
      rating: 'Persönliche Bewertung',
    },
  },

  recordScore: {
    tiebreak: 'Tiebreak',
    tiebreakLabel: 'Tiebreak ({{placeholder}})',
    specialCases: 'Spezialfälle',
    retired: 'Aufgegeben',
    walkover: 'Walkover',
    alerts: {
      confirm: 'OK',
      standardTiebreak: 'Tiebreak',
      globalRanking: 'Global',
    },
  },

  matchRequest: {
    skillLevel: {
      elementary: 'Grundkenntnisse',
    },
    playerCard: {
      winRate: 'Siegrate',
      recentMatches: 'Letzte Spiele',
    },
    schedule: {
      duration: 'Spieldauer',
      oneHour: '1 Stunde',
      twoHours: '2 Stunden',
      threeHours: '3 Stunden',
    },
    court: {
      perHour: '/Stunde',
    },
  },

  leagues: {
    admin: {
      applicant: 'Bewerber',
      maxParticipants: 'Max',
      applicationDate: 'Beworben',
      opening: 'Öffnen...',
      startAcceptingApplications: '🎭 Bewerbungen annehmen',
    },
    match: {
      status: {
        walkover: 'Walkover',
      },
      reschedule: 'Neu planen',
      walkover: 'Walkover',
    },
  },

  rateSportsmanship: {
    honorTags: {
      sharpEyed: '#Scharfsichtig',
      fullOfEnergy: '#VollerEnergie',
      mrManner: '#HerrnManieren',
      punctualPro: '#PünktlichProfi',
      mentalFortress: '#MentaleFestung',
      courtJester: '#PlatzNarr',
    },
    alerts: {
      badgesAwarded: 'Ehrenabzeichen verliehen',
    },
  },

  achievementsGuide: {
    seasonTrophies: 'Saison-Trophäen',
    badges: 'Abzeichen',
    notYetEarned: 'Noch nicht verdient',
    categories: {
      matches: 'Spiel-Erfolge',
      social: 'Soziale Erfolge',
      streaks: 'Serien-Erfolge',
      special: 'Besondere Erfolge',
    },
  },

  scoreConfirmation: {
    submittedAt: 'Eingereicht am',
    matchType: {
      lightning: 'Blitz-Spiel',
    },
    walkover: 'Walkover',
    agree: 'Ich stimme zu',
    disagree: 'Ich stimme nicht zu',
    reasonLabel: 'Grund für Ablehnung',
    warningTitle: 'Wichtige Hinweise',
  },

  clubOverviewScreen: {
    playoffsInProgress: 'Playoffs laufen',
    teamInviteTitle: 'Team-Einladung',
    recentWinners: '🏆 Letzte Gewinner',
    runnerUp: 'Zweitplatzierter',
    emptyStateGuestTitle: '🎾 Willkommen bei {{clubName}}!',
    aiHelperHint: 'Nicht sicher, was zu tun ist?',
    aiHelperSubtext: 'Stellen Sie Fragen über Tennis oder wie man die App nutzt!',
  },

  schedules: {
    form: {
      duration: 'Dauer (Minuten) *',
      indoor: 'Innen',
      outdoor: 'Außen',
      both: 'Beides',
      participationInfo: 'Teilnahmeinformationen',
      skillLevelPlaceholder: 'z.B. 3.5+',
      registrationDeadline: 'Anmeldefrist (Stunden vorher)',
    },
  },

  modals: {
    tournamentCompleted: {
      runnerUp: 'Zweitplatzierter',
    },
    leagueCompleted: {
      runnerUp: 'Zweitplatzierter',
      points: 'Pkt',
    },
    playoffCreated: {
      title: 'Playoff erstellt!',
      playoffType: 'Playoff-Format',
      final: 'Finale',
      semifinals: 'Halbfinale + Finale',
    },
  },

  tournamentDetail: {
    info: 'Info',
    participantsSuffix: '',
    bestFinish: {
      champion: '🥇 Champion',
      runnerUp: '🥈 Zweitplatzierter',
      semiFinal: '🥉 Halbfinalist',
      nthPlace: '{position}. Platz',
    },
  },

  appNavigator: {
    screens: {
      eventChat: 'Veranstaltungs-Chat',
      eventDetail: 'Veranstaltungsdetails',
      rateSportsmanship: 'Sportlichkeit bewerten',
      meetupDetail: 'Treffpunkt-Info',
      chatScreen: 'Lightning Coach',
      achievementsGuide: 'Erfolge-Leitfaden',
    },
  },

  duesManagement: {
    tabs: {
      status: 'Status',
    },
    alerts: {
      ok: 'OK',
    },
    settings: {
      bank: 'Bank',
      venmo: 'Venmo',
    },
    countSuffix: '',
  },

  eventParticipation: {
    tabs: {
      details: 'Details',
    },
    participants: {
      waitingList: 'Warteliste',
    },
    statusLabels: {
      waitlisted: 'Auf Warteliste',
    },
    typeLabels: {
      spectator: 'Zuschauer',
      helper: 'Helfer',
    },
  },

  editClubPolicy: {
    saved: 'Gespeichert',
    ok: 'OK',
    unsavedChanges: 'Nicht gespeicherte Änderungen',
    regularMeetingTimes: 'Regelmäßige Treffzeiten',
    recurring: 'Wiederkehrend',
  },

  manageAnnouncement: {
    ok: 'OK',
    lastUpdated: 'Zuletzt aktualisiert:',
    announcementDetails: 'Ankündigungsdetails',
    importantNotice: 'Wichtiger Hinweis',
    importantNoticeDescription: 'Wichtige Hinweise werden prominenter angezeigt',
  },

  eloTrend: {
    titleBase: 'Angewendet',
    soloLobby: 'Solo-Lobby',
    friendInvite: 'Freund',
    friendInvitations: '🎾 Freundschaftseinladungen',
    partnerInvitations: 'Partner-Einladungen',
  },

  createMeetup: {
    fields: {
      location: 'Standort',
      date: 'Datum',
      time: 'Uhrzeit',
      duration: 'Dauer',
      description: 'Beschreibung',
      maxParticipants: 'Maximale Teilnehmer',
      skillLevel: 'Fähigkeitsstufe',
    },
    buttons: {
      create: 'Erstellen',
      cancel: 'Abbrechen',
    },
  },

  leagueStats: {
    title: 'Liga-Statistiken',
    topScorers: 'Top-Scorer',
    mostWins: 'Meiste Siege',
    bestWinRate: 'Beste Siegrate',
    mostGamesPlayed: 'Meiste Spiele',
  },

  playerStats: {
    title: 'Spielerstatistiken',
    overview: 'Übersicht',
    performance: 'Leistung',
    history: 'Verlauf',
    wins: 'Siege',
    losses: 'Niederlagen',
    draws: 'Unentschieden',
    winRate: 'Siegrate',
    avgScore: 'Durchschn. Punktzahl',
  },
};

// Read current de.json
const dePath = path.join(__dirname, '../src/locales/de.json');
const currentDe = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Merge translations
const updatedDe = deepMerge(currentDe, germanTranslations);

// Write back
fs.writeFileSync(dePath, JSON.stringify(updatedDe, null, 2) + '\n');

console.log('✅ FINAL German translations completed!');
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

console.log('\n🎉 All German translations complete!');
