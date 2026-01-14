#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function setNested(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNested(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return current;
}

// These are international/cognate words that should actually be translated
// to show proper localization (not just left as English)

// SPANISH (note: many technical terms stay the same in Spanish)
const esTranslations = {
  // Keep as-is (international terms): Error, Admin, Chat, Email, Password, etc.
  // But translate these:
  'ntrpResult.recommended': 'Recomendado',
  'admin.matchManagement.total': 'Total',
  'duesManagement.report.totalColumn': 'Total',
  'weeklySchedule.total': 'Total',
  'recordScore.alerts.globalRanking': 'Global',
  'modals.leagueCompleted.points': 'ptos',
  'modals.playoffCreated.final': 'Final',
};

// GERMAN
const deTranslations = {
  // Translate these:
  'auth.register.displayName': 'Anzeigename',
  'profile.settingsTab.administrator': 'Administrator',
  'roles.manager': 'Manager',
  'terms.optional': 'Optional',
  'club.clubMembers.roles.manager': 'Manager',
  'clubLeaguesTournaments.status.playoffs': 'Playoffs',
  'clubLeaguesTournaments.labels.status': 'Status',
  'clubLeaguesTournaments.labels.format': 'Format',
  'clubLeaguesTournaments.memberPreLeagueStatus.format': 'Format',
  'clubLeaguesTournaments.memberPreLeagueStatus.status': 'Status',
  'clubTournamentManagement.stats.champion': 'Champion: ',
  'createEvent.eventType.lightningMatch': 'Lightning Match',
  'createEvent.eventType.lightningMeetup': 'Lightning Meetup',
  'createEvent.eventType.match': 'Match',
  'createEvent.fields.partner': 'Partner',
  'hostedEventCard.partner': 'Partner: ',
  'duesManagement.tabs.status': 'Status',
  'feed.title': 'Feed',
  'eventParticipation.tabs.details': 'Details',
  'meetupDetail.weather.windLabel': 'Wind',
  'playerCard.online': 'Online',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'teamPairing.teamLabel': 'Team {{number}}',
  'recordScore.alerts.globalRanking': 'Global',
  'leagueDetail.champion': 'Champion',
  'leagueDetail.playoffs.format': 'Format:',
  'roleManagement.roles.manager': 'Manager',
  'leagues.admin.maxParticipants': 'Max',
  'aiMatching.candidate.strengths.volley': 'Volley',
  'aiMatching.candidate.strengths.mental': 'Mental',
};

// PORTUGUESE
const ptTranslations = {
  'ntrpResult.recommended': 'Recomendado',
  'clubLeaguesTournaments.status.playoffs': 'Playoffs',
  'clubLeaguesTournaments.labels.status': 'Status',
  'clubLeaguesTournaments.memberPreLeagueStatus.status': 'Status',
  'duesManagement.tabs.status': 'Status',
  'duesManagement.report.totalColumn': 'Total',
  'feed.title': 'Feed',
  'playerCard.online': 'Online',
  'weeklySchedule.total': 'Total',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'recordScore.alerts.globalRanking': 'Global',
  'aiMatching.candidate.strengths.backhand': 'Backhand',
  'aiMatching.candidate.strengths.forehand': 'Forehand',
  'aiMatching.candidate.strengths.mental': 'Mental',
  'modals.leagueCompleted.points': 'pts',
  'modals.playoffCreated.final': 'Final',
};

// ITALIAN
const itTranslations = {
  'roles.manager': 'Manager',
  'admin.devTools.privacy': 'Privacy',
  'createEvent.fields.partner': 'Partner',
  'feed.title': 'Feed',
  'manageLeagueParticipants.set': 'Set',
  'playerCard.online': 'Online',
  'postDetail.post': 'Post',
  'clubDetail.tabs.home': 'Home',
  'clubDetail.tabs.admin': 'Admin',
};

const languages = [
  { code: 'es', translations: esTranslations, name: 'Spanish' },
  { code: 'de', translations: deTranslations, name: 'German' },
  { code: 'pt', translations: ptTranslations, name: 'Portuguese' },
  { code: 'it', translations: itTranslations, name: 'Italian' },
];

const enPath = path.join(__dirname, '../src/locales/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

console.log('\n🌍 TRANSLATING COGNATES & INTERNATIONAL TERMS\n');
console.log('='.repeat(60));

languages.forEach(({ code, translations, name }) => {
  const langPath = path.join(__dirname, `../src/locales/${code}.json`);
  const lang = JSON.parse(fs.readFileSync(langPath, 'utf8'));

  let count = 0;
  for (const [keyPath, value] of Object.entries(translations)) {
    const enValue = getNested(en, keyPath);
    const langValue = getNested(lang, keyPath);

    if (enValue && (langValue === enValue || langValue === undefined)) {
      setNested(lang, keyPath, value);
      count++;
    }
  }

  fs.writeFileSync(langPath, JSON.stringify(lang, null, 2) + '\n', 'utf8');

  console.log(`\n✅ ${name.toUpperCase()} (${code.toUpperCase()})`);
  console.log(`   Keys updated: ${count}`);
});

console.log('\n' + '='.repeat(60));
console.log('\n📋 NOTE: Many terms like "Error", "Chat", "Email", "Admin" are');
console.log('   international/technical terms that are correct as-is.');
console.log("   They don't need translation in most languages.\n");
