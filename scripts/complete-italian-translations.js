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

// All Italian translations for the 73 untranslated keys
const italianTranslations = {
  common: {
    no: 'No',
    ok: 'OK',
  },
  auth: {
    email: 'Email',
    password: 'Password',
    register: {
      success: {
        ok: 'OK',
      },
    },
  },
  createClub: {
    fields: {
      logo: 'Logo',
    },
  },
  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },
  roles: {
    manager: 'Manager',
  },
  admin: {
    devTools: {
      privacy: 'Privacy',
    },
  },
  club: {
    chat: 'Chat',
  },
  emailLogin: {
    labels: {
      email: 'Email',
      password: 'Password',
    },
    verification: {
      sentTo: '{{email}}',
    },
  },
  clubTournamentManagement: {
    common: {
      confirm: 'OK',
    },
  },
  eventCard: {
    labels: {
      participants: '{{current}}/{{max}}',
    },
    buttons: {
      chat: 'Chat',
    },
  },
  createEvent: {
    fields: {
      partner: 'Partner',
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
  hostedEventCard: {
    buttons: {
      chat: 'Chat',
    },
  },
  feed: {
    title: 'Feed',
  },
  duesManagement: {
    alerts: {
      ok: 'OK',
    },
    settings: {
      venmo: 'Venmo',
    },
  },
  createClubTournament: {
    matchFormats: {
      best_of_1: '1 Set',
    },
  },
  meetupDetail: {
    editEvent: {
      durationUnit: 'min',
    },
  },
  teamInvitations: {
    ok: 'OK',
  },
  regularMeetup: {
    crowdOk: 'OK',
  },
  activityTab: {
    no: 'No',
  },
  appliedEventCard: {
    actions: {
      chat: 'Chat',
    },
  },
  clubAdmin: {
    chat: 'Chat',
  },
  createClubLeague: {
    ok: 'OK',
  },
  pastEventCard: {
    host: 'Host',
    chat: 'Chat',
  },
  myClubSettings: {
    alerts: {
      ok: 'OK',
    },
  },
  postDetail: {
    post: 'Post',
  },
  tournamentDetail: {
    hallOfFame: 'Hall of Fame',
  },
  clubSelector: {
    club: 'Club',
  },
  appliedEvents: {
    partnerInvite: 'partner',
  },
  eloTrend: {
    partnerInvite: 'partner',
  },
  recordScore: {
    set: 'Set',
    setN: 'Set {{n}}',
    walkover: 'Walkover',
    alerts: {
      confirm: 'OK',
    },
  },
  directChat: {
    club: 'Club',
  },
  clubDetail: {
    tabs: {
      home: 'Home',
      admin: 'Admin',
      hallOfFame: 'Hall of Fame',
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
  scoreConfirmation: {
    walkover: 'Walkover',
  },
  matches: {
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
  },
  leagues: {
    match: {
      status: {
        walkover: 'Walkover',
      },
      walkover: 'Walkover',
    },
  },
  hallOfFame: {
    title: 'Hall of Fame',
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  clubChat: {
    roleAdmin: 'Admin',
    roleStaff: 'Staff',
  },
  editClubPolicy: {
    ok: 'OK',
    no: 'No',
  },
  editProfile: {
    common: {
      ok: 'OK',
    },
  },
  manageLeagueParticipants: {
    set: 'Set',
  },
  manageAnnouncement: {
    ok: 'OK',
  },
  playerCard: {
    online: 'Online',
  },
};

// Read existing Italian translations
const itPath = path.join(__dirname, '../src/locales/it.json');
const existingIt = JSON.parse(fs.readFileSync(itPath, 'utf8'));

// Merge translations
const updatedIt = deepMerge(existingIt, italianTranslations);

// Write back to file
fs.writeFileSync(itPath, JSON.stringify(updatedIt, null, 2), 'utf8');

console.log('Successfully updated Italian translations!');
console.log('Applied 73 translation keys');
