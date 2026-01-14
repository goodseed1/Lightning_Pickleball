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

// CLEANUP BATCH - Final 154 keys
const germanTranslations = {
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

  clubLeaguesTournaments: {
    status: {
      playoffs: 'Playoffs',
    },
    labels: {
      status: 'Status',
      format: 'Format',
    },
    memberPreLeagueStatus: {
      peopleUnit: '',
      format: 'Format',
      status: 'Status',
    },
  },

  recordScore: {
    tiebreak: 'Tiebreak',
    tiebreakLabel: 'Tiebreak ({{placeholder}})',
    walkover: 'Walkover',
    alerts: {
      confirm: 'OK',
      standardTiebreak: 'Tiebreak',
      globalRanking: 'Global',
    },
  },

  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
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

  ntrpSelector: {
    levels: {
      beginner: {
        label: '1.0-2.5 (Anfänger)',
        description: 'Gerade mit Tennis begonnen',
      },
      intermediate: {
        label: '3.0-3.5 (Fortgeschritten)',
      },
      advanced: {
        label: '4.0-4.5 (Fortgeschritten)',
      },
      expert: {
        label: '5.0+ (Experte)',
      },
    },
  },

  aiMatching: {
    candidate: {
      strengths: {
        volley: 'Volley',
        mental: 'Mental',
      },
    },
    mockData: {
      candidate1: {
        name: 'Junsu Kim',
      },
      candidate2: {
        name: 'Seoyeon Lee',
      },
      candidate3: {
        name: 'Minjae Park',
      },
    },
  },

  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  manageLeagueParticipants: {
    title: 'Spiele verwalten',
    scheduledMatches: 'Geplante Spiele',
    status: {
      scheduled: 'Geplant',
      inProgress: 'In Bearbeitung',
    },
  },

  roleManagement: {
    roles: {
      manager: 'Manager',
    },
    transferSection: {
      title: '🔄 Admin übertragen',
      button: 'Admin übertragen',
    },
    roleChangeTitle: 'Rollen ändern',
  },

  tournament: {
    bestFinish: {
      champion: '🥇 Champion',
      runnerUp: '🥈 Zweitplatzierter',
      semiFinal: '🥉 Halbfinalist',
      nthPlace: '{position}. Platz',
    },
  },

  clubPoliciesScreen: {
    facilities: 'Einrichtungen',
    regularMeetings: 'Regelmäßige Treffen',
    recurring: 'Wiederkehrend',
    qrCodeTitle: '{{method}} QR-Code',
  },

  findClubScreen: {
    searching: 'Clubs suchen...',
    joinComplete: 'Beigetreten',
    joinDeclined: 'Abgelehnt',
    emptySearchMessage: 'Versuchen Sie einen anderen Suchbegriff',
  },

  clubPolicies: {
    sections: {
      facilities: 'Einrichtungen',
      meetings: 'Regelmäßige Treffzeiten',
    },
    recurring: 'Wiederkehrend',
    qrModal: {
      title: '{{method}} QR-Code',
    },
  },

  discover: {
    alerts: {
      canceled: 'Abgesagt',
      chatAccessDenied: 'Chatraum-Hinweis',
      quickMatch: {
        title: '⚡ Schnellspiel',
      },
    },
  },

  emailLogin: {
    emailStatus: {
      accountFound: 'Konto gefunden',
    },
    alerts: {
      tooManyAttempts: {
        title: 'Zu viele Versuche',
      },
      forgotPassword: {
        tooManyRequests: {
          title: 'Zu viele Anfragen',
        },
      },
    },
  },

  createClubLeague: {
    selectedInfo: 'Ausgewählt',
    seasonName: 'Saisonname *',
    ok: 'OK',
  },

  tournamentDetail: {
    info: 'Info',
    participantsSuffix: '',
    bestFinish: {
      champion: '🥇 Champion',
    },
  },

  leagueDetail: {
    champion: 'Champion',
    adminDashboard: {
      maxTeams: 'Max Teams',
    },
    playoffs: {
      format: 'Format:',
    },
  },

  policyEditScreen: {
    quickInsert: 'Schnelleinfügung',
    policyContent: 'Richtlinieninhalt',
    modified: 'Geändert',
  },

  leagues: {
    admin: {
      maxParticipants: 'Max',
    },
    match: {
      status: {
        walkover: 'Walkover',
      },
      walkover: 'Walkover',
    },
  },

  findClub: {
    searching: 'Clubs suchen...',
    status: {
      joined: 'Beigetreten',
    },
    empty: {
      tryDifferent: 'Versuchen Sie einen anderen Suchbegriff',
    },
  },

  auth: {
    register: {
      displayName: 'Name',
      success: {
        ok: 'OK',
      },
    },
  },

  profile: {
    settingsTab: {
      administrator: 'Administrator',
    },
    userProfile: {
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      roles: {
        manager: 'Manager',
      },
    },
  },

  clubTournamentManagement: {
    stats: {
      champion: 'Champion: ',
    },
    common: {
      confirm: 'OK',
    },
  },

  eventCard: {
    matchTypeSelector: {
      mixed: 'Mixed',
    },
    buttons: {
      chat: 'Chat',
    },
  },

  hostedEventCard: {
    buttons: {
      chat: 'Chat',
    },
    partner: 'Partner: ',
  },

  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },

  appliedEventCard: {
    eventType: {
      casual: 'Locker',
    },
    actions: {
      chat: 'Chat',
    },
  },

  lessonCard: {
    consultButton: 'Beratung',
    currencySuffix: '',
  },

  playerCard: {
    notAvailable: 'N/V',
    online: 'Online',
  },

  createModal: {
    lightningMatch: {
      subtitle: 'Gewertetes Spiel',
    },
    lightningMeetup: {
      subtitle: 'Lockeres Treffen',
    },
  },

  mapAppSelector: {
    appNotInstalled: 'App nicht installiert',
    installed: 'Installiert',
  },

  participantSelector: {
    peopleSuffix: ' Personen',
    placeholder: 'z.B. 16',
  },

  types: {
    clubSchedule: {
      timePeriod: {
        am: 'AM',
        pm: 'PM',
      },
    },
  },

  league: {
    status: {
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      upcoming: 'Anstehend',
    },
    labels: {
      participants: 'Teilnehmer',
      matches: 'Spiele',
      season: 'Saison',
    },
  },

  clubManagement: {
    tabs: {
      overview: 'Übersicht',
      members: 'Mitglieder',
      events: 'Veranstaltungen',
      settings: 'Einstellungen',
    },
    actions: {
      invite: 'Einladen',
      remove: 'Entfernen',
      promote: 'Befördern',
    },
  },

  invitations: {
    title: 'Einladungen',
    received: 'Erhalten',
    sent: 'Gesendet',
    pending: 'Ausstehend',
    accepted: 'Angenommen',
    declined: 'Abgelehnt',
    expired: 'Abgelaufen',
  },

  chat: {
    title: 'Chat',
    sendMessage: 'Nachricht senden',
    typeMessage: 'Nachricht eingeben...',
    noMessages: 'Keine Nachrichten',
    online: 'Online',
    offline: 'Offline',
    typing: 'Tippt...',
  },
};

// Read current de.json
const dePath = path.join(__dirname, '../src/locales/de.json');
const currentDe = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Merge translations
const updatedDe = deepMerge(currentDe, germanTranslations);

// Write back
fs.writeFileSync(dePath, JSON.stringify(updatedDe, null, 2) + '\n');

console.log('✅ German translations cleanup completed!');
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

console.log('\n🎉 German translation project complete!');
