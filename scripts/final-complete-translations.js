#!/usr/bin/env node

/**
 * Final comprehensive translation script for ES, DE, PT
 * Completes ALL remaining untranslated keys to reach 100%
 */

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');

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

// Unflatten utility
function unflattenKeys(flatObj) {
  const result = {};
  for (const key in flatObj) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = flatObj[key];
  }
  return result;
}

// Apply translations to a language file
function applyTranslations(langCode, translations) {
  const filePath = path.join(localesPath, `${langCode}.json`);
  const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const nested = unflattenKeys(translations);
  const updated = deepMerge(current, nested);
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n');
  console.log(
    `✅ ${langCode.toUpperCase()}: Applied ${Object.keys(translations).length} translations`
  );
}

// =======================
// SPANISH (ES) - 128 keys
// =======================
const esTranslations = {
  'common.error': 'Error',
  'common.no': 'No',
  'common.ok': 'Aceptar',
  'auth.register.errors.title': 'Error',
  'auth.register.success.ok': 'Aceptar',
  'createClub.fields.logo': 'Logotipo',
  'clubList.clubType.casual': 'Informal',
  'clubList.clubType.social': 'Social',
  'profile.userProfile.friendRequest.error': 'Error',
  'profile.userProfile.sendMessage.error': 'Error',
  'profile.userProfile.timeSlots.brunch': 'Brunch',
  'onboarding.alerts.error': 'Error',
  'units.km': 'km',
  'units.mi': 'mi',
  'units.distanceKm': '{{distance}} km',
  'units.distanceMi': '{{distance}} mi',
  'ntrpResult.recommended': 'Rec',
  'admin.matchManagement.total': 'Total',
  'club.chat': 'Chat',
  'club.clubMembers.alerts.loadError.title': 'Error',
  'clubChat.roleAdmin': 'Admin',
  'clubChat.roleStaff': 'Personal',
  'clubSelector.club': 'Club',
  'rateSportsmanship.alerts.error': 'Error',
  'alert.title.error': 'Error',
  'editProfile.common.error': 'Error',
  'editProfile.common.ok': 'Aceptar',
  'discover.alerts.error': 'Error',
  'emailLogin.verification.sentTo': '{{email}}',
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
  'clubTournamentManagement.common.confirm': 'Aceptar',
  'clubTournamentManagement.common.error': 'Error',
  'profileSettings.location.alerts.errorTitle': 'Error',
  'profileSettings.location.update.errorTitle': 'Error',
  'eventCard.eventTypes.casual': 'Informal',
  'eventCard.eventTypes.general': 'General',
  'eventCard.labels.participants': '{{current}}/{{max}}',
  'eventCard.buttons.chat': 'Chat',
  'createEvent.alerts.confirm': 'Aceptar',
  'createEvent.languages.chinese': '中文',
  'createEvent.languages.japanese': '日本語',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.eventTypes.casual': 'Informal',
  'hostedEventCard.eventTypes.general': 'General',
  'hostedEventCard.buttons.chat': 'Chat',
  'hostedEventCard.alerts.error': 'Error',
  'duesManagement.alerts.error': 'Error',
  'duesManagement.alerts.ok': 'Aceptar',
  'duesManagement.settings.venmo': 'Venmo',
  'duesManagement.report.totalColumn': 'Total',
  'createMeetup.errors.errorTitle': 'Error',
  'activityTab.error': 'Error',
  'activityTab.no': 'No',
  'regularMeetup.error': 'Error',
  'regularMeetup.crowdOk': 'Aceptar',
  'clubAdmin.chat': 'Chat',
  'clubAdmin.chatNormal': 'Normal',
  'editClubPolicy.error': 'Error',
  'editClubPolicy.no': 'No',
  'createClubTournament.matchFormats.best_of_1': '1 Set',
  'createClubTournament.matchFormats.best_of_3': '3 Sets',
  'createClubTournament.matchFormats.best_of_5': '5 Sets',
  'createClubTournament.seedingMethods.manual': 'Manual',
  'appliedEventCard.eventType.casual': 'Informal',
  'appliedEventCard.eventType.general': 'General',
  'appliedEventCard.actions.chat': 'Chat',
  'appliedEventCard.alerts.error': 'Error',
  'meetupDetail.editEvent.durationUnit': 'min',
  'teamInvitations.error': 'Error',
  'teamInvitations.ok': 'Aceptar',
  'createClubLeague.ok': 'Aceptar',
  'manageAnnouncement.error': 'Error',
  'manageAnnouncement.ok': 'Aceptar',
  'lessonCard.currencySuffix': '',
  'playerCard.notAvailable': 'N/D',
  'pastEventCard.chat': 'Chat',
  'weeklySchedule.total': 'Total',
  'myClubSettings.alerts.ok': 'Aceptar',
  'myClubSettings.alerts.error': 'Error',
  'postDetail.error': 'Error',
  'lessonForm.errorTitle': 'Error',
  'concludeLeague.stats.points': '{{points}} pts',
  'developerTools.errorTitle': 'Error',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'hallOfFame.honorBadges.receivedCount': '×{{count}}',
  'recordScore.set': 'Set',
  'recordScore.setN': 'Set {{n}}',
  'recordScore.alerts.error': 'Error',
  'recordScore.alerts.confirm': 'Aceptar',
  'recordScore.alerts.globalRanking': 'Global',
  'scoreConfirmation.alerts.error': 'Error',
  'directChat.club': 'Club',
  'directChat.alerts.error': 'Error',
  'roleManagement.alerts.loadError.title': 'Error',
  'roleManagement.alerts.transferError.title': 'Error',
  'clubOverviewScreen.deleteError': 'Error',
  'types.clubSchedule.timePeriod.am': 'AM',
  'types.clubSchedule.timePeriod.pm': 'PM',
  'types.dues.period.year': '{{year}}',
  'types.dues.period.yearMonth': '{{month}}/{{year}}',
  'findClubScreen.joinRequestError': 'Error',
  'matches.skillLevels.2.0-3.0': '2.0-3.0',
  'matches.skillLevels.3.0-4.0': '3.0-4.0',
  'matches.skillLevels.4.0-5.0': '4.0-5.0',
  'matches.skillLevels.5.0+': '5.0+',
  'matches.createModal.maxParticipants.placeholder': '4',
  'matches.alerts.createSuccess.confirm': 'Aceptar',
  'services.map.error': 'Error',
  'aiMatching.mockData.candidate1.name': 'Junsu Kim',
  'aiMatching.mockData.candidate2.name': 'Seoyeon Lee',
  'clubPolicies.defaultClubName': 'Club',
  'modals.leagueCompleted.points': 'pts',
  'modals.playoffCreated.final': 'Final',
};

// =====================
// GERMAN (DE) - 92 keys
// =====================
const deTranslations = {
  'common.ok': 'OK',
  'auth.register.displayName': 'Name',
  'auth.register.success.ok': 'OK',
  'createClub.fields.logo': 'Logo',
  'profile.settingsTab.administrator': 'Administrator',
  'profile.userProfile.timeSlots.brunch': 'Brunch',
  'units.km': 'km',
  'units.mi': 'mi',
  'units.distanceKm': '{{distance}} km',
  'units.distanceMi': '{{distance}} mi',
  'roles.manager': 'Manager',
  'terms.optional': 'Optional',
  'club.chat': 'Chat',
  'club.clubMembers.roles.manager': 'Manager',
  'editProfile.common.ok': 'OK',
  'clubLeaguesTournaments.status.playoffs': 'Playoffs',
  'clubLeaguesTournaments.labels.status': 'Status',
  'clubLeaguesTournaments.labels.format': 'Format',
  'clubLeaguesTournaments.memberPreLeagueStatus.format': 'Format',
  'clubLeaguesTournaments.memberPreLeagueStatus.status': 'Status',
  'clubTournamentManagement.stats.champion': 'Champion: ',
  'clubTournamentManagement.common.confirm': 'OK',
  'eventCard.matchTypeSelector.mixed': 'Mixed',
  'eventCard.labels.participants': '{{current}}/{{max}}',
  'eventCard.buttons.chat': 'Chat',
  'createEvent.eventType.match': 'Match',
  'createEvent.fields.partner': 'Partner',
  'createEvent.gameTypes.mixed': 'Mixed',
  'createEvent.alerts.confirm': 'OK',
  'createEvent.languages.korean': '한국어',
  'createEvent.languages.english': 'English',
  'createEvent.languages.chinese': '中文',
  'createEvent.languages.japanese': '日本語',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.buttons.chat': 'Chat',
  'hostedEventCard.partner': 'Partner: ',
  'duesManagement.tabs.status': 'Status',
  'duesManagement.alerts.ok': 'OK',
  'duesManagement.settings.bank': 'Bank',
  'duesManagement.settings.venmo': 'Venmo',
  'feed.title': 'Feed',
  'regularMeetup.crowdOk': 'OK',
  'eventParticipation.tabs.details': 'Details',
  'clubAdmin.chat': 'Chat',
  'clubAdmin.chatNormal': 'Normal',
  'editClubPolicy.ok': 'OK',
  'appliedEventCard.actions.chat': 'Chat',
  'meetupDetail.weather.windLabel': 'Wind',
  'teamInvitations.ok': 'OK',
  'createClubLeague.ok': 'OK',
  'manageAnnouncement.ok': 'OK',
  'lessonCard.currencySuffix': '',
  'playerCard.online': 'Online',
  'pastEventCard.chat': 'Chat',
  'myClubSettings.alerts.ok': 'OK',
  'tournamentDetail.bestFinish.champion': '🥇 Champion',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'teamPairing.teamLabel': 'Team {{number}}',
  'hallOfFame.honorBadges.receivedCount': '×{{count}}',
  'recordScore.tiebreak': 'Tiebreak',
  'recordScore.tiebreakLabel': 'Tiebreak ({{placeholder}})',
  'recordScore.walkover': 'Walkover',
  'recordScore.alerts.confirm': 'OK',
  'recordScore.alerts.standardTiebreak': 'Tiebreak',
  'recordScore.alerts.globalRanking': 'Global',
  'scoreConfirmation.walkover': 'Walkover',
  'directChat.club': 'Club',
  'leagueDetail.champion': 'Champion',
  'leagueDetail.playoffs.format': 'Format:',
  'roleManagement.roles.manager': 'Manager',
  'appNavigator.screens.chatScreen': 'Lightning Coach',
  'types.clubSchedule.timePeriod.am': 'AM',
  'types.clubSchedule.timePeriod.pm': 'PM',
  'types.dues.period.year': '{{year}}',
  'types.dues.period.yearMonth': '{{month}}/{{year}}',
  'tournament.bestFinish.champion': '🥇 Champion',
  'matches.skillLevels.2.0-3.0': '2.0-3.0',
  'matches.skillLevels.3.0-4.0': '3.0-4.0',
  'matches.skillLevels.4.0-5.0': '4.0-5.0',
  'matches.skillLevels.5.0+': '5.0+',
  'matches.createModal.maxParticipants.placeholder': '4',
  'matches.alerts.createSuccess.confirm': 'OK',
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

// ==========================
// PORTUGUESE (PT) - 82 keys
// ==========================
const ptTranslations = {
  'common.ok': 'OK',
  'auth.register.success.ok': 'OK',
  'createClub.fields.logo': 'Logotipo',
  'clubList.clubType.casual': 'Casual',
  'clubList.clubType.social': 'Social',
  'profile.userProfile.timeSlots.brunch': 'Brunch',
  'units.km': 'km',
  'units.mi': 'mi',
  'units.distanceKm': '{{distance}} km',
  'units.distanceMi': '{{distance}} mi',
  'ntrpResult.recommended': 'Rec',
  'club.chat': 'Chat',
  'editProfile.common.ok': 'OK',
  'clubLeaguesTournaments.status.playoffs': 'Playoffs',
  'clubLeaguesTournaments.labels.status': 'Status',
  'clubLeaguesTournaments.memberPreLeagueStatus.status': 'Status',
  'clubTournamentManagement.common.confirm': 'OK',
  'eventCard.eventTypes.casual': 'Casual',
  'eventCard.labels.participants': '{{current}}/{{max}}',
  'eventCard.buttons.chat': 'Chat',
  'eventCard.soloApplicants.count': '{{count}} solo',
  'createEvent.alerts.confirm': 'OK',
  'createEvent.languages.korean': '한국어',
  'createEvent.languages.english': 'English',
  'createEvent.languages.chinese': '中文',
  'createEvent.languages.japanese': '日本語',
  'createEvent.languages.spanish': 'Español',
  'createEvent.languages.french': 'Français',
  'hostedEventCard.eventTypes.casual': 'Casual',
  'hostedEventCard.buttons.chat': 'Chat',
  'duesManagement.tabs.status': 'Status',
  'duesManagement.alerts.ok': 'OK',
  'duesManagement.settings.venmo': 'Venmo',
  'duesManagement.report.totalColumn': 'Total',
  'duesManagement.countSuffix': '',
  'feed.title': 'Feed',
  'clubAdmin.chat': 'Chat',
  'clubAdmin.chatNormal': 'Normal',
  'editClubPolicy.ok': 'OK',
  'createClubTournament.matchFormats.best_of_1': '1 Set',
  'createClubTournament.matchFormats.best_of_3': '3 Sets',
  'createClubTournament.matchFormats.best_of_5': '5 Sets',
  'createClubTournament.seedingMethods.manual': 'Manual',
  'appliedEventCard.eventType.casual': 'Casual',
  'appliedEventCard.actions.chat': 'Chat',
  'meetupDetail.rsvp.title': 'RSVP',
  'meetupDetail.editEvent.durationUnit': 'min',
  'teamInvitations.ok': 'OK',
  'createClubLeague.ok': 'OK',
  'manageAnnouncement.ok': 'OK',
  'lessonCard.currencySuffix': '',
  'playerCard.online': 'Online',
  'pastEventCard.chat': 'Chat',
  'weeklySchedule.total': 'Total',
  'myClubSettings.alerts.ok': 'OK',
  'concludeLeague.stats.points': '{{points}} pts',
  'clubLeagueManagement.status.playoffs': 'Playoffs',
  'hallOfFame.honorBadges.receivedCount': '×{{count}}',
  'recordScore.set': 'Set',
  'recordScore.setN': 'Set {{n}}',
  'recordScore.tiebreak': 'Tiebreak',
  'recordScore.tiebreakLabel': 'Tiebreak ({{placeholder}})',
  'recordScore.alerts.confirm': 'OK',
  'recordScore.alerts.standardTiebreak': 'Tiebreak',
  'recordScore.alerts.globalRanking': 'Global',
  'types.clubSchedule.timePeriod.am': 'AM',
  'types.clubSchedule.timePeriod.pm': 'PM',
  'types.dues.period.year': '{{year}}',
  'types.dues.period.yearMonth': '{{month}}/{{year}}',
  'matches.skillLevels.2.0-3.0': '2.0-3.0',
  'matches.skillLevels.3.0-4.0': '3.0-4.0',
  'matches.skillLevels.4.0-5.0': '4.0-5.0',
  'matches.skillLevels.5.0+': '5.0+',
  'matches.createModal.maxParticipants.placeholder': '4',
  'matches.alerts.createSuccess.confirm': 'OK',
  'schedules.form.indoor': 'Indoor',
  'schedules.form.outdoor': 'Outdoor',
  'aiMatching.candidate.strengths.backhand': 'Backhand',
  'aiMatching.candidate.strengths.forehand': 'Forehand',
  'aiMatching.candidate.strengths.mental': 'Mental',
  'modals.leagueCompleted.points': 'pts',
  'modals.playoffCreated.final': 'Final',
};

// Apply all translations
console.log('🌍 Applying final translations for ES, DE, PT...\n');
applyTranslations('es', esTranslations);
applyTranslations('de', deTranslations);
applyTranslations('pt', ptTranslations);

console.log('\n🎉 Translation completion script finished!');
console.log('📊 Run "node scripts/check-all-translations.js" to verify');
