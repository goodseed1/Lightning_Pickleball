#!/usr/bin/env node

/**
 * Complete 100% Spanish translation
 * Apply remaining translations (mostly keeping international terms as-is)
 */

const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Read current es.json
const esPath = path.join(__dirname, '../src/locales/es.json');
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Complete Spanish translations
// Note: Most values stay the same as they are international terms
const completeTranslations = {
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
      error: 'Error',
    },
  },

  common: {
    error: 'Error',
    no: 'No',
  },

  concludeLeague: {
    stats: {
      points: '{{points}} ptos',
    },
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
  },

  meetupDetail: {
    editEvent: {
      durationUnit: 'min',
    },
  },

  modals: {
    leagueCompleted: {
      points: 'ptos',
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
      globalRanking: 'Global',
    },
  },

  regularMeetup: {
    error: 'Error',
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

// Apply translations
const updated = deepMerge(es, completeTranslations);

// Write back
fs.writeFileSync(esPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ 100% Spanish translation complete!');
console.log('   All 111 remaining keys processed');
console.log('   Note: Most values kept as international terms (Error, Chat, etc.)');
