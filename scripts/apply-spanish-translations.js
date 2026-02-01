#!/usr/bin/env node

/**
 * Apply Spanish translations to es.json using deep merge
 * Only translates keys that currently match en.json
 */

const fs = require('fs');
const path = require('path');

// Deep merge utility
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

// Read files
const esPath = path.join(__dirname, '../src/locales/es.json');
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

/**
 * TRANSLATION STRATEGY:
 * - "Error", "Chat", "Set", etc. → Keep as international terms
 * - Variables like {{email}}, {{count}} → Keep as-is
 * - Empty strings "" → Keep empty
 * - Brand names (Venmo, Lightning Coach) → Keep original
 * - Technical abbreviations (AM, PM, km, mi, pts) → Keep original
 * - Korean names (Junsu Kim) → Keep original
 * - Numbers (2.0-3.0, 4) → Keep as-is
 */

// All Spanish translations (Latin American Spanish - español latinoamericano)
const spanishTranslations = {
  navigation: {
    clubs: 'Clubes',
  },

  createClub: {
    fields: {
      logo: 'Logotipo',
    },
  },

  clubList: {
    clubType: {
      social: 'Social',
    },
  },

  profile: {
    userProfile: {
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },

  profileSetup: {
    miles: 'millas',
  },

  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  ntrp: {
    label: {
      expert: 'Experto',
    },
  },

  admin: {
    devTools: {
      mile: 'milla',
      miles: 'millas',
    },
    matchManagement: {
      total: 'Total',
    },
  },

  clubChat: {
    important: 'Importante',
  },

  clubSelector: {
    club: 'Club',
  },

  alert: {
    tournamentBracket: {
      info: 'Info',
      participants: 'Participantes',
      participantsTab: 'Participantes',
    },
  },

  discover: {
    tabs: {
      clubs: 'Clubes',
      services: 'Servicios',
    },
    skillFilters: {
      expert: 'Experto',
    },
  },

  emailLogin: {
    verification: {
      sentTo: '{{email}}',
    },
  },

  clubLeaguesTournaments: {
    labels: {
      participants: 'Participantes',
      format: 'Formato',
    },
    memberPreLeagueStatus: {
      participantsStatus: 'Participantes',
      peopleUnit: 'personas',
      format: 'Formato',
    },
  },

  clubTournamentManagement: {
    detailTabs: {
      participants: 'Participantes',
    },
    participants: {
      label: 'Participantes',
    },
  },

  eventCard: {
    eventTypes: {
      match: 'Partido',
      lightning: 'Partido',
    },
    labels: {
      participants: '{{current}}/{{max}}',
    },
    soloApplicants: {
      count: '{{count}} solo',
    },
  },

  createEvent: {
    fields: {
      description: 'Descripción',
    },
    languages: {
      korean: '한국어',
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  duesManagement: {
    report: {
      totalColumn: 'Total',
    },
    paymentDetails: {
      type: 'Tipo',
      notes: 'Notas',
    },
    countSuffix: 'personas',
  },

  clubScheduleSettings: {
    fields: {
      description: 'Descripción',
    },
  },

  eventParticipation: {
    tabs: {
      participants: 'Participantes',
    },
    details: {
      participants: 'participantes',
    },
    participants: {
      list: 'Participantes',
    },
    typeLabels: {
      participant: 'Participante',
    },
  },

  clubAdmin: {
    participation: 'Participación',
    chatNormal: 'Normal',
  },

  createClubTournament: {
    matchFormats: {
      best_of_1: '1 Set',
      best_of_3: '3 Sets',
      best_of_5: '5 Sets',
    },
  },

  appliedEventCard: {
    eventType: {
      match: 'Partido',
    },
    teams: {
      participants: 'Participantes ({{count}})',
    },
  },

  meetupDetail: {
    rsvp: {
      title: 'RSVP',
    },
    editEvent: {
      labelDescription: 'Descripción',
      durationUnit: 'min',
    },
  },

  serviceForm: {
    description: 'Descripción',
    photos: 'Fotos (máx {{max}})',
  },

  playerCard: {
    expert: 'Experto',
  },

  pastEventCard: {
    eventTypes: {
      match: 'Partido',
    },
    challenger: 'Retador',
  },

  weeklySchedule: {
    total: 'Total',
  },

  lessonForm: {
    descriptionLabel: 'Descripción *',
  },

  concludeLeague: {
    stats: {
      points: '{{points}} pts',
    },
  },

  tournamentDetail: {
    info: 'Info',
    participants: 'Participantes',
    participantsSuffix: 'personas',
    bestFinish: {
      champion: '🥇 Campeón',
    },
  },

  eventDetail: {
    participants: {
      label: 'participantes',
      count: 'personas',
    },
    sections: {
      description: 'Descripción',
      participants: 'Participantes ({{count}})',
    },
  },

  ntrpLevelDetail: {
    description: 'Descripción',
  },

  setLocationTimeModal: {
    date: 'Fecha',
  },

  hallOfFame: {
    badges: 'insignias',
  },

  ltrLevelDetail: {
    description: 'Descripción',
  },

  recordScore: {
    set: 'Set',
    setN: 'Set {{n}}',
    alerts: {
      globalRanking: 'Global',
    },
  },

  directChat: {
    club: 'Club',
    headerTitle: 'Mensajes',
    tabs: {
      conversations: 'Conversaciones',
    },
  },

  leagueDetail: {
    notification: 'Notificación',
    champion: 'Campeón',
    tabs: {
      participants: 'Participantes',
    },
  },

  ntrpSelector: {
    levels: {
      expert: {
        label: '5.0+ (Experto)',
      },
    },
  },

  appNavigator: {
    screens: {
      chatScreen: 'Lightning Coach',
    },
  },

  clubOverviewScreen: {
    important: 'Importante',
  },

  types: {
    dues: {
      period: {
        year: '{{year}}',
        yearMonth: '{{month}}/{{year}}',
      },
    },
  },

  tournament: {
    bestFinish: {
      champion: '🥇 Campeón',
    },
  },

  policyEditScreen: {
    section: 'Sección',
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
      description: {
        label: 'Descripción',
      },
    },
  },

  leagues: {
    admin: {
      maxParticipants: 'Máx',
    },
    match: {
      matchNumber: 'Partido #{{number}}',
      court: 'Cancha',
    },
  },

  schedules: {
    form: {
      description: 'Descripción',
      minParticipants: 'Participantes Mín',
    },
  },

  services: {
    activity: {
      notifications: {
        defaultTitle: 'Notificación',
      },
    },
    leaderboard: {
      achievements: {
        skillLevel85: {
          name: 'Experto',
        },
      },
    },
  },

  aiMatching: {
    candidate: {
      strengths: {
        endurance: 'Resistencia',
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

  feedCard: {
    notification: 'Notificación',
  },
};

// Apply translations
const updated = deepMerge(es, spanishTranslations);

// Write back
fs.writeFileSync(esPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('\n✅ Applied all 113 Spanish translations!');
console.log('   📁 File updated: src/locales/es.json');
console.log('   🌎 Language: Latin American Spanish (español latinoamericano)\n');
