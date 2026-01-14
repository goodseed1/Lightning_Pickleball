#!/usr/bin/env node
/**
 * Complete German translations with formal German (Sie)
 */

const fs = require('fs');
const path = require('path');

const deJsonPath = path.join(__dirname, '../src/locales/de.json');

// All German translations (formal "Sie" form)
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
    fields: {
      logo: 'Logo',
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
  onboarding: {
    maxDistance: 'Max {{distance}}km',
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
  terms: {
    optional: 'Optional',
  },
  club: {
    chat: 'Chat',
    clubMembers: {
      roles: {
        manager: 'Manager',
      },
    },
  },
  alert: {
    tournamentBracket: {
      info: 'Info',
    },
  },
  editProfile: {
    common: {
      ok: 'OK',
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
      peopleUnit: ' Personen',
      format: 'Format',
      status: 'Status',
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
  createEvent: {
    eventType: {
      lightningMatch: 'Blitz-Match',
      lightningMeetup: 'Blitz-Treffen',
      match: 'Match',
    },
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
  hostedEventCard: {
    buttons: {
      chat: 'Chat',
    },
    partner: 'Partner: ',
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
    countSuffix: ' Mitglieder',
  },
  feed: {
    title: 'Feed',
  },
  regularMeetup: {
    crowdOk: 'OK',
  },
  eventParticipation: {
    tabs: {
      details: 'Details',
    },
  },
  clubAdmin: {
    chat: 'Chat',
    chatNormal: 'Normal',
  },
  editClubPolicy: {
    ok: 'OK',
  },
  appliedEventCard: {
    actions: {
      chat: 'Chat',
    },
  },
  meetupDetail: {
    weather: {
      windLabel: 'Wind',
    },
  },
  teamInvitations: {
    ok: 'OK',
  },
  createClubLeague: {
    ok: 'OK',
  },
  manageAnnouncement: {
    ok: 'OK',
  },
  lessonCard: {
    currencySuffix: ' €',
  },
  playerCard: {
    online: 'Online',
  },
  pastEventCard: {
    chat: 'Chat',
  },
  myClubSettings: {
    alerts: {
      ok: 'OK',
    },
  },
  tournamentDetail: {
    info: 'Info',
    participantsSuffix: ' Teilnehmer',
    bestFinish: {
      champion: '🥇 Champion',
    },
  },
  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
    },
  },
  eventDetail: {
    participants: {
      count: ' Teilnehmer',
    },
  },
  teamPairing: {
    teamLabel: 'Team {{number}}',
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
  scoreConfirmation: {
    walkover: 'Walkover',
  },
  leagueDetail: {
    champion: 'Champion',
    adminDashboard: {
      maxTeams: 'Max. Teams',
    },
    playoffs: {
      format: 'Format:',
    },
  },
  roleManagement: {
    roles: {
      manager: 'Manager',
    },
  },
  appNavigator: {
    screens: {
      chatScreen: 'Lightning Coach',
    },
  },
  types: {
    clubSchedule: {
      timePeriod: {
        am: 'Vormittag',
        pm: 'Nachmittag',
      },
    },
  },
  tournament: {
    bestFinish: {
      champion: '🥇 Champion',
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
  services: {
    activity: {
      tennisUserFallback: 'TennisUser{{id}}',
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
};

// Deep merge function
function deepMerge(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Read existing de.json
const deJson = JSON.parse(fs.readFileSync(deJsonPath, 'utf8'));

// Merge translations
const updatedDeJson = deepMerge(deJson, germanTranslations);

// Write back to file
fs.writeFileSync(deJsonPath, JSON.stringify(updatedDeJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Successfully merged 97 German translations into de.json');
console.log('🎯 All translations use formal German (Sie)');
console.log('📝 File updated: src/locales/de.json\n');
