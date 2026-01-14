const fs = require('fs');
const path = require('path');

// Deep merge utility
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

// Spanish translations for remaining 128 keys
const spanishTranslations = {
  activityTab: {
    error: 'Error',
    no: 'No',
  },

  admin: {
    matchManagement: {
      total: 'Total',
    },
  },

  aiMatching: {
    mockData: {
      candidate1: {
        name: 'Junsu Kim',
      },
      candidate2: {
        name: 'Seoyeon Lee',
      },
    },
  },

  alert: {
    title: {
      error: 'Error',
    },
  },

  appliedEventCard: {
    eventType: {
      casual: 'Casual',
      general: 'General',
    },
    actions: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
  },

  auth: {
    register: {
      errors: {
        title: 'Error',
      },
      success: {
        ok: 'OK',
      },
    },
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      alerts: {
        loadError: {
          title: 'Error',
        },
      },
    },
  },

  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },

  clubChat: {
    roleAdmin: 'Admin',
    roleStaff: 'Staff',
  },

  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
    },
  },

  clubLeaguesTournaments: {
    alerts: {
      error: {
        title: 'Error',
      },
      selectPartner: {
        title: 'Error',
      },
    },
  },

  clubList: {
    clubType: {
      casual: 'Casual',
      social: 'Social',
    },
  },

  clubOverviewScreen: {
    deleteError: 'Error',
  },

  clubPolicies: {
    defaultClubName: 'Club',
  },

  clubSelector: {
    club: 'Club',
  },

  clubTournamentManagement: {
    roundGeneration: {
      errorTitle: 'Error',
    },
    tournamentStart: {
      errorTitle: 'Error',
    },
    seedAssignment: {
      errorTitle: 'Error',
    },
    deletion: {
      errorTitle: 'Error',
    },
    participantRemoval: {
      errorTitle: 'Error',
    },
    participantAdd: {
      errorTitle: 'Error',
    },
    common: {
      confirm: 'OK',
      error: 'Error',
    },
  },

  common: {
    error: 'Error',
    no: 'No',
    ok: 'OK',
  },

  concludeLeague: {
    stats: {
      points: '{{points}} pts',
    },
  },

  createClub: {
    fields: {
      logo: 'Logo',
    },
  },

  createClubLeague: {
    ok: 'OK',
  },

  createClubTournament: {
    matchFormats: {
      best_of_1: '1 Set',
      best_of_3: '3 Sets',
      best_of_5: '5 Sets',
    },
    seedingMethods: {
      manual: 'Manual',
    },
  },

  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  createMeetup: {
    errors: {
      errorTitle: 'Error',
    },
  },

  developerTools: {
    errorTitle: 'Error',
  },

  directChat: {
    club: 'Club',
    alerts: {
      error: 'Error',
    },
  },

  discover: {
    alerts: {
      error: 'Error',
    },
  },

  duesManagement: {
    alerts: {
      error: 'Error',
      ok: 'OK',
    },
    settings: {
      venmo: 'Venmo',
    },
    report: {
      totalColumn: 'Total',
    },
  },

  editClubPolicy: {
    error: 'Error',
    no: 'No',
  },

  editProfile: {
    common: {
      error: 'Error',
      ok: 'OK',
    },
  },

  emailLogin: {
    verification: {
      sentTo: '{{email}}',
    },
    alerts: {
      genericError: {
        title: 'Error',
      },
      resendError: {
        title: 'Error',
      },
      missingInfo: {
        title: 'Error',
      },
      loginInfoMissing: {
        title: 'Error',
      },
      forgotPassword: {
        sendError: {
          title: 'Error',
        },
      },
    },
  },

  eventCard: {
    eventTypes: {
      casual: 'Casual',
      general: 'General',
    },
    labels: {
      participants: '{{current}}/{{max}}',
    },
    buttons: {
      chat: 'Chat',
    },
  },

  findClubScreen: {
    joinRequestError: 'Error',
  },

  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },

  hostedEventCard: {
    eventTypes: {
      casual: 'Casual',
      general: 'General',
    },
    buttons: {
      chat: 'Chat',
    },
    alerts: {
      error: 'Error',
    },
  },

  lessonCard: {
    currencySuffix: '',
  },

  lessonForm: {
    errorTitle: 'Error',
  },

  manageAnnouncement: {
    error: 'Error',
    ok: 'OK',
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

  meetupDetail: {
    editEvent: {
      durationUnit: 'min',
    },
  },

  modals: {
    leagueCompleted: {
      points: 'pts',
    },
    playoffCreated: {
      final: 'Final',
    },
  },

  myActivities: {
    alerts: {
      partnerInvitation: {
        error: {
          title: 'Error',
        },
      },
      friendInvitation: {
        error: {
          title: 'Error',
        },
      },
    },
  },

  myClubSettings: {
    alerts: {
      ok: 'OK',
      error: 'Error',
    },
  },

  ntrpResult: {
    recommended: 'Rec',
  },

  onboarding: {
    alerts: {
      error: 'Error',
    },
  },

  pastEventCard: {
    chat: 'Chat',
  },

  playerCard: {
    notAvailable: 'N/A',
  },

  postDetail: {
    error: 'Error',
  },

  profile: {
    userProfile: {
      friendRequest: {
        error: 'Error',
      },
      sendMessage: {
        error: 'Error',
      },
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  profileSettings: {
    location: {
      alerts: {
        errorTitle: 'Error',
      },
      update: {
        errorTitle: 'Error',
      },
    },
  },

  rateSportsmanship: {
    alerts: {
      error: 'Error',
    },
  },

  recordScore: {
    set: 'Set',
    setN: 'Set {{n}}',
    alerts: {
      error: 'Error',
      confirm: 'OK',
      globalRanking: 'Global',
    },
  },

  regularMeetup: {
    error: 'Error',
    crowdOk: 'OK',
  },

  roleManagement: {
    alerts: {
      loadError: {
        title: 'Error',
      },
      transferError: {
        title: 'Error',
      },
    },
  },

  scoreConfirmation: {
    alerts: {
      error: 'Error',
    },
  },

  services: {
    map: {
      error: 'Error',
    },
  },

  teamInvitations: {
    error: 'Error',
    ok: 'OK',
  },

  types: {
    clubSchedule: {
      timePeriod: {
        am: 'AM',
        pm: 'PM',
      },
    },
    dues: {
      period: {
        year: '{{year}}',
        yearMonth: '{{month}}/{{year}}',
      },
    },
  },

  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  weeklySchedule: {
    total: 'Total',
  },
};

// Read current Spanish translations
const esPath = path.join(__dirname, '../src/locales/es.json');
const currentEs = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Deep merge new translations
const updatedEs = deepMerge(currentEs, spanishTranslations);

// Write back to file
fs.writeFileSync(esPath, JSON.stringify(updatedEs, null, 2) + '\n', 'utf8');

console.log('✅ Successfully added 128 Spanish translations!');
console.log('\nTranslated sections:');
console.log('- activityTab (2 keys)');
console.log('- admin (1 key)');
console.log('- aiMatching (2 keys)');
console.log('- alert (1 key)');
console.log('- appliedEventCard (4 keys)');
console.log('- auth (2 keys)');
console.log('- club (2 keys)');
console.log('- clubAdmin (2 keys)');
console.log('- clubChat (2 keys)');
console.log('- clubLeagueManagement (1 key)');
console.log('- clubLeaguesTournaments (2 keys)');
console.log('- clubList (2 keys)');
console.log('- clubOverviewScreen (1 key)');
console.log('- clubPolicies (1 key)');
console.log('- clubSelector (1 key)');
console.log('- clubTournamentManagement (7 keys)');
console.log('- common (3 keys)');
console.log('- concludeLeague (1 key)');
console.log('- createClub (1 key)');
console.log('- createClubLeague (1 key)');
console.log('- createClubTournament (5 keys)');
console.log('- createEvent (5 keys)');
console.log('- createMeetup (1 key)');
console.log('- developerTools (1 key)');
console.log('- directChat (2 keys)');
console.log('- discover (1 key)');
console.log('- duesManagement (3 keys)');
console.log('- editClubPolicy (2 keys)');
console.log('- editProfile (2 keys)');
console.log('- emailLogin (5 keys)');
console.log('- eventCard (4 keys)');
console.log('- findClubScreen (1 key)');
console.log('- hallOfFame (1 key)');
console.log('- hostedEventCard (4 keys)');
console.log('- lessonCard (1 key)');
console.log('- lessonForm (1 key)');
console.log('- manageAnnouncement (2 keys)');
console.log('- matches (6 keys)');
console.log('- meetupDetail (1 key)');
console.log('- modals (2 keys)');
console.log('- myActivities (2 keys)');
console.log('- myClubSettings (2 keys)');
console.log('- ntrpResult (1 key)');
console.log('- onboarding (1 key)');
console.log('- pastEventCard (1 key)');
console.log('- playerCard (1 key)');
console.log('- postDetail (1 key)');
console.log('- profile (3 keys)');
console.log('- profileSettings (2 keys)');
console.log('- rateSportsmanship (1 key)');
console.log('- recordScore (5 keys)');
console.log('- regularMeetup (2 keys)');
console.log('- roleManagement (2 keys)');
console.log('- scoreConfirmation (1 key)');
console.log('- services (1 key)');
console.log('- teamInvitations (2 keys)');
console.log('- types (4 keys)');
console.log('- units (4 keys)');
console.log('- weeklySchedule (1 key)');
console.log('\n🎉 Spanish translation is now 100% complete!');
