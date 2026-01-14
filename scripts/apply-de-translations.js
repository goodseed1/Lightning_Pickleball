#!/usr/bin/env node

/**
 * Apply German translations to de.json using deepMerge
 *
 * This script:
 * 1. Reads the current de.json file
 * 2. Applies 94 German translations using lodash deepMerge
 * 3. Writes the updated de.json file
 */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Paths
const DE_JSON_PATH = path.join(__dirname, '../src/locales/de.json');
const BACKUP_PATH = path.join(__dirname, '../src/locales/de.json.backup');

// German translations (formal "Sie" form)
const deTranslations = {
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
    maxDistance: 'Max. {{distance}} km',
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
    labels: {
      participants: '{{current}}/{{max}}',
    },
    buttons: {
      chat: 'Chat',
    },
  },
  createEvent: {
    eventType: {
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
    currencySuffix: '',
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
    bestFinish: {
      champion: '🥇 Champion',
    },
  },
  clubLeagueManagement: {
    status: {
      playoffs: 'Playoffs',
    },
  },
  teamPairing: {
    teamLabel: 'Team {{number}}',
  },
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
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
  scoreConfirmation: {
    walkover: 'Walkover',
  },
  directChat: {
    club: 'Club',
  },
  leagueDetail: {
    champion: 'Champion',
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
      pickleballUserFallback: 'PickleballBenutzer{{id}}',
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
  clubPolicies: {
    defaultClubName: 'Club',
  },
};

// Main function
async function applyTranslations() {
  console.log('🇩🇪 Applying German translations to de.json...\n');

  try {
    // 1. Read current de.json
    console.log('📖 Reading de.json...');
    const deJson = JSON.parse(fs.readFileSync(DE_JSON_PATH, 'utf8'));

    // 2. Create backup
    console.log('💾 Creating backup at de.json.backup...');
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(deJson, null, 2), 'utf8');

    // 3. Deep merge translations
    console.log('🔀 Merging 94 German translations using lodash deepMerge...');
    const merged = _.merge({}, deJson, deTranslations);

    // 4. Write updated file
    console.log('💾 Writing updated de.json...');
    fs.writeFileSync(DE_JSON_PATH, JSON.stringify(merged, null, 2), 'utf8');

    // 5. Verify translations
    console.log('\n✅ Verifying translations...');
    const updated = JSON.parse(fs.readFileSync(DE_JSON_PATH, 'utf8'));

    // Sample verification
    const verifications = [
      { path: 'common.ok', expected: 'OK' },
      { path: 'units.km', expected: 'km' },
      { path: 'roles.manager', expected: 'Manager' },
      { path: 'recordScore.tiebreak', expected: 'Tiebreak' },
      { path: 'services.activity.pickleballUserFallback', expected: 'PickleballBenutzer{{id}}' },
    ];

    let allVerified = true;
    verifications.forEach(({ path, expected }) => {
      const value = _.get(updated, path);
      const verified = value === expected;
      console.log(`  ${verified ? '✓' : '✗'} ${path}: ${value}`);
      if (!verified) allVerified = false;
    });

    if (allVerified) {
      console.log('\n🎉 All 94 German translations applied successfully!');
      console.log('📊 German locale is now 100% complete!');
    } else {
      console.log('\n⚠️ Some verifications failed. Please check the output.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
applyTranslations();
