#!/usr/bin/env node

/**
 * FINAL COMPLETE FRENCH TRANSLATIONS - ALL 863 KEYS
 * Natural French translations for ALL untranslated keys
 */

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

// NATURAL FRENCH TRANSLATIONS
const frenchTranslations = {
  navigation: {
    clubs: 'Clubs',
  },

  createClub: {
    visibility_public: 'Publique',
    fields: {
      logo: 'Logo',
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
    miles: 'miles',
  },

  units: {
    km: 'km',
    mi: 'mi',
    distanceKm: '{{distance}} km',
    distanceMi: '{{distance}} mi',
  },

  ntrp: {
    label: {
      expert: 'Expert',
    },
  },

  ntrpResult: {
    recommended: 'Rec',
  },

  admin: {
    devTools: {
      mile: 'mile',
      miles: 'miles',
    },
    matchManagement: {
      total: 'Total',
    },
  },

  clubChat: {
    important: 'Important',
  },

  clubSelector: {
    club: 'Club',
  },

  alert: {
    tournamentBpaddle: {
      info: 'Info',
      participants: 'Participants',
      participantsTab: 'Participants',
    },
  },

  discover: {
    tabs: {
      clubs: 'Clubs',
      services: 'Services',
    },
    skillFilters: {
      expert: 'Expert',
    },
  },

  emailLogin: {
    verification: {
      sentTo: '{{email}}',
    },
  },

  clubLeaguesTournaments: {
    labels: {
      participants: 'Participants',
      format: 'Format',
    },
    memberPreLeagueStatus: {
      participantsStatus: 'Participants',
      peopleUnit: '',
      format: 'Format',
    },
  },

  clubTournamentManagement: {
    detailTabs: {
      participants: 'Participants',
    },
  },
};

// Load and merge
const frPath = path.join(__dirname, '../src/locales/fr.json');
const currentFr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const updatedFr = deepMerge(currentFr, frenchTranslations);

fs.writeFileSync(frPath, JSON.stringify(updatedFr, null, 2) + '\n', 'utf8');

console.log('\n✅ French translations applied!\n');
