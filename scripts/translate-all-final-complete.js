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

// SPANISH TRANSLATIONS (Latin American Spanish)
const esTranslations = {
  'common.error': 'Error',
  'auth.register.errors.title': 'Error',
  'clubList.clubType.social': 'Social',
  'profile.userProfile.friendRequest.error': 'Error',
  'profile.userProfile.sendMessage.error': 'Error',
  'profile.userProfile.timeSlots.brunch': 'Brunch',
  'onboarding.alerts.error': 'Error',
  'ntrpResult.recommended': 'Rec',
  'admin.matchManagement.total': 'Total',
  'club.chat': 'Chat',
  'club.clubMembers.alerts.loadError.title': 'Error',
  'clubChat.roleAdmin': 'Admin',
  'clubSelector.club': 'Club',
  'rateSportsmanship.alerts.error': 'Error',
  'alert.title.error': 'Error',
  'alert.tournamentBracket.info': 'Info',
  'editProfile.common.error': 'Error',
  'discover.alerts.error': 'Error',
  'emailLogin.alerts.genericError.title': 'Error',
  'emailLogin.alerts.resendError.title': 'Error',
  'emailLogin.alerts.missingInfo.title': 'Error',
  'emailLogin.alerts.loginInfoMissing.title': 'Error',
  'emailLogin.alerts.forgotPassword.sendError.title': 'Error',
  'myActivities.alerts.partnerInvitation.error.title': 'Error',
  'myActivities.alerts.friendInvitation.error.title': 'Error',
  'clubLeaguesTournaments.alerts.error.title': 'Error',
  'clubLeaguesTournaments.alerts.selectPartner.title': 'Error',
  'clubTournamentManagement.roundGeneration.errorTitle': 'Error',
  'clubTournamentManagement.tournamentStart.errorTitle': 'Error',
  'clubTournamentManagement.seedAssignment.errorTitle': 'Error',
  'clubTournamentManagement.deletion.errorTitle': 'Error',
  'clubTournamentManagement.participantRemoval.errorTitle': 'Error',
  'clubTournamentManagement.participantAdd.errorTitle': 'Error',
  'clubTournamentManagement.common.error': 'Error',
  'profileSettings.location.alerts.errorTitle': 'Error',
  'profileSettings.location.update.errorTitle': 'Error',
  'eventCard.eventTypes.general': 'General',
  'eventCard.buttons.chat': 'Chat',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.eventTypes.general': 'General',
  'hostedEventCard.buttons.chat': 'Chat',
  'hostedEventCard.alerts.error': 'Error',
  'duesManagement.alerts.error': 'Error',
  'duesManagement.settings.venmo': 'Venmo',
  'duesManagement.report.totalColumn': 'Total',
  'createMeetup.errors.errorTitle': 'Error',
  'activityTab.error': 'Error',
  'regularMeetup.error': 'Error',
  'clubAdmin.chat': 'Chat',
  'clubAdmin.chatNormal': 'Normal',
  'editClubPolicy.error': 'Error',
  'createClubTournament.seedingMethods.manual': 'Manual',
  'appliedEventCard.eventType.general': 'General',
  'appliedEventCard.actions.chat': 'Chat',
  'appliedEventCard.alerts.error': 'Error',
  'meetupDetail.rsvp.title': 'RSVP',
  'meetupDetail.editEvent.durationUnit': 'min',
  'teamInvitations.error': 'Error',
  'manageAnnouncement.error': 'Error',
  'pastEventCard.chat': 'Chat',
  'weeklySchedule.total': 'Total',
  'myClubSettings.alerts.error': 'Error',
  'postDetail.error': 'Error',
  'lessonForm.errorTitle': 'Error',
  'tournamentDetail.info': 'Info',
  'developerTools.errorTitle': 'Error',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'recordScore.set': 'Set',
  'recordScore.setN': 'Set {{n}}',
  'recordScore.alerts.error': 'Error',
  'recordScore.alerts.globalRanking': 'Global',
  'scoreConfirmation.alerts.error': 'Error',
  'directChat.club': 'Club',
  'directChat.alerts.error': 'Error',
  'roleManagement.alerts.loadError.title': 'Error',
  'roleManagement.alerts.transferError.title': 'Error',
  'appNavigator.screens.chatScreen': 'Lightning Coach',
  'clubOverviewScreen.deleteError': 'Error',
  'findClubScreen.joinRequestError': 'Error',
  'services.map.error': 'Error',
  'aiMatching.candidate.strengths.mental': 'Mental',
  'aiMatching.mockData.candidate1.name': 'Junsu Kim',
  'aiMatching.mockData.candidate2.name': 'Seoyeon Lee',
  'aiMatching.mockData.candidate3.name': 'Minjae Park',
  'clubPolicies.defaultClubName': 'Club',
  'modals.leagueCompleted.points': 'pts',
  'modals.playoffCreated.final': 'Final',
};

// GERMAN TRANSLATIONS (Formal Sie)
const deTranslations = {
  'auth.register.displayName': 'Name',
  'createClub.fields.logo': 'Logo',
  'profile.settingsTab.administrator': 'Administrator',
  'profile.userProfile.timeSlots.brunch': 'Brunch',
  'roles.manager': 'Manager',
  'terms.optional': 'Optional',
  'club.chat': 'Chat',
  'club.clubMembers.roles.manager': 'Manager',
  'clubLeaguesTournaments.status.playoffs': 'Playoffs',
  'clubLeaguesTournaments.labels.status': 'Status',
  'clubLeaguesTournaments.labels.format': 'Format',
  'clubLeaguesTournaments.memberPreLeagueStatus.format': 'Format',
  'clubLeaguesTournaments.memberPreLeagueStatus.status': 'Status',
  'clubTournamentManagement.stats.champion': 'Champion: ',
  'eventCard.matchTypeSelector.mixed': 'Mixed',
  'eventCard.buttons.chat': 'Chat',
  'createEvent.eventType.lightningMatch': 'Lightning Match',
  'createEvent.eventType.lightningMeetup': 'Lightning Meetup',
  'createEvent.eventType.match': 'Match',
  'createEvent.fields.partner': 'Partner',
  'createEvent.gameTypes.mixed': 'Mixed',
  'createEvent.languages.english': 'English',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.buttons.chat': 'Chat',
  'hostedEventCard.partner': 'Partner: ',
  'duesManagement.tabs.status': 'Status',
  'duesManagement.settings.bank': 'Bank',
  'duesManagement.settings.venmo': 'Venmo',
  'feed.title': 'Feed',
  'eventParticipation.tabs.details': 'Details',
  'clubAdmin.chat': 'Chat',
  'clubAdmin.chatNormal': 'Normal',
  'appliedEventCard.actions.chat': 'Chat',
  'meetupDetail.weather.windLabel': 'Wind',
  'playerCard.online': 'Online',
  'pastEventCard.chat': 'Chat',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'teamPairing.teamLabel': 'Team {{number}}',
  'recordScore.tiebreak': 'Tiebreak',
  'recordScore.tiebreakLabel': 'Tiebreak ({{placeholder}})',
  'recordScore.walkover': 'Walkover',
  'recordScore.alerts.standardTiebreak': 'Tiebreak',
  'recordScore.alerts.globalRanking': 'Global',
  'scoreConfirmation.walkover': 'Walkover',
  'directChat.club': 'Club',
  'leagueDetail.champion': 'Champion',
  'leagueDetail.playoffs.format': 'Format:',
  'roleManagement.roles.manager': 'Manager',
  'appNavigator.screens.chatScreen': 'Lightning Coach',
  'leagues.admin.maxParticipants': 'Max',
  'leagues.match.status.walkover': 'Walkover',
  'leagues.match.walkover': 'Walkover',
  'aiMatching.candidate.strengths.volley': 'Volley',
  'aiMatching.candidate.strengths.mental': 'Mental',
  'aiMatching.mockData.candidate1.name': 'Junsu Kim',
  'aiMatching.mockData.candidate2.name': 'Seoyeon Lee',
  'aiMatching.mockData.candidate3.name': 'Minjae Park',
  'clubPolicies.defaultClubName': 'Club',
};

// PORTUGUESE TRANSLATIONS (Brazilian Portuguese)
const ptTranslations = {
  'clubList.clubType.casual': 'Casual',
  'clubList.clubType.social': 'Social',
  'profile.userProfile.timeSlots.brunch': 'Brunch',
  'ntrpResult.recommended': 'Rec',
  'club.chat': 'Chat',
  'clubLeaguesTournaments.status.playoffs': 'Playoffs',
  'clubLeaguesTournaments.labels.status': 'Status',
  'clubLeaguesTournaments.memberPreLeagueStatus.status': 'Status',
  'eventCard.eventTypes.casual': 'Casual',
  'eventCard.buttons.chat': 'Chat',
  'createEvent.languages.english': 'English',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.eventTypes.casual': 'Casual',
  'hostedEventCard.buttons.chat': 'Chat',
  'duesManagement.tabs.status': 'Status',
  'duesManagement.settings.venmo': 'Venmo',
  'duesManagement.report.totalColumn': 'Total',
  'feed.title': 'Feed',
  'clubAdmin.chat': 'Chat',
  'clubAdmin.chatNormal': 'Normal',
  'createClubTournament.seedingMethods.manual': 'Manual',
  'appliedEventCard.eventType.casual': 'Casual',
  'appliedEventCard.actions.chat': 'Chat',
  'meetupDetail.rsvp.title': 'RSVP',
  'meetupDetail.editEvent.durationUnit': 'min',
  'playerCard.online': 'Online',
  'pastEventCard.chat': 'Chat',
  'weeklySchedule.total': 'Total',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'recordScore.set': 'Set',
  'recordScore.setN': 'Set {{n}}',
  'recordScore.tiebreak': 'Tiebreak',
  'recordScore.tiebreakLabel': 'Tiebreak ({{placeholder}})',
  'recordScore.alerts.standardTiebreak': 'Tiebreak',
  'recordScore.alerts.globalRanking': 'Global',
  'schedules.form.indoor': 'Indoor',
  'schedules.form.outdoor': 'Outdoor',
  'aiMatching.candidate.strengths.backhand': 'Backhand',
  'aiMatching.candidate.strengths.forehand': 'Forehand',
  'aiMatching.candidate.strengths.mental': 'Mental',
  'modals.leagueCompleted.points': 'pts',
  'modals.playoffCreated.final': 'Final',
};

// ITALIAN TRANSLATIONS (Natural Italian)
const itTranslations = {
  'auth.email': 'Email',
  'auth.password': 'Password',
  'createClub.fields.logo': 'Logo',
  'roles.manager': 'Manager',
  'admin.devTools.privacy': 'Privacy',
  'club.chat': 'Chat',
  'clubChat.roleAdmin': 'Admin',
  'clubChat.roleStaff': 'Staff',
  'clubSelector.club': 'Club',
  'emailLogin.labels.email': 'Email',
  'emailLogin.labels.password': 'Password',
  'eventCard.buttons.chat': 'Chat',
  'createEvent.fields.partner': 'Partner',
  'createEvent.languages.english': 'English',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.buttons.chat': 'Chat',
  'duesManagement.settings.venmo': 'Venmo',
  'feed.title': 'Feed',
  'clubAdmin.chat': 'Chat',
  'manageLeagueParticipants.set': 'Set',
  'appliedEventCard.actions.chat': 'Chat',
  'meetupDetail.editEvent.durationUnit': 'min',
  'playerCard.online': 'Online',
  'pastEventCard.chat': 'Chat',
  'postDetail.post': 'Post',
  'recordScore.set': 'Set',
  'recordScore.setN': 'Set {{n}}',
  'directChat.club': 'Club',
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

console.log('\n🌍 FINAL TRANSLATION - ALL LANGUAGES\n');
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
  console.log(`   Keys translated: ${count}`);
  console.log(`   File: ${langPath}`);
});

console.log('\n' + '='.repeat(60));
console.log('\n🎉 ALL TRANSLATIONS COMPLETE!\n');
