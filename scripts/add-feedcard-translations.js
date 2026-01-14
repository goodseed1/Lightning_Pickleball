const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// English translations for feedCard
const enFeedCard = {
  justNow: 'Just now',
  minutesAgo: '{{minutes}}m ago',
  hoursAgo: '{{hours}}h ago',
  daysAgo: '{{days}}d ago',
  matchCompleted: {
    win: '{{actorName}} defeated {{targetName}} {{score}}',
    played: '{{actorName}} played against {{targetName}} {{score}}',
  },
  newMemberJoined: '{{actorName}} joined {{clubName}}',
  leagueCreated: '{{actorName}} created {{leagueName}}',
  league: 'League',
  leaguePlayoffs: {
    finals: '{{actorName}} advanced to Finals in {{leagueName}}',
    semifinals: '{{actorName}} advanced to Semifinals in {{leagueName}}',
    quarterfinals: '{{actorName}} advanced to Quarterfinals in {{leagueName}}',
    roundOf16: '{{actorName}} advanced to Round of 16 in {{leagueName}}',
    roundOf32: '{{actorName}} advanced to Round of 32 in {{leagueName}}',
  },
  actorActivity: '{{actorName}} had an activity',
  feedTextError: 'Unable to load feed',
  viewClub: 'View Club',
  notification: 'Notification',
  unknown: 'Unknown',
  report: 'Report',
  hide: 'Hide',
};

// Korean translations for feedCard
const koFeedCard = {
  justNow: '방금',
  minutesAgo: '{{minutes}}분 전',
  hoursAgo: '{{hours}}시간 전',
  daysAgo: '{{days}}일 전',
  matchCompleted: {
    win: '{{actorName}}님이 {{targetName}}님을 {{score}}로 이겼습니다',
    played: '{{actorName}}님이 {{targetName}}님과 {{score}} 경기했습니다',
  },
  newMemberJoined: '{{actorName}}님이 {{clubName}}에 가입했습니다',
  leagueCreated: '{{actorName}}님이 {{leagueName}}을 생성했습니다',
  league: '리그',
  leaguePlayoffs: {
    finals: '{{actorName}}님이 {{leagueName}} 결승에 진출했습니다',
    semifinals: '{{actorName}}님이 {{leagueName}} 준결승에 진출했습니다',
    quarterfinals: '{{actorName}}님이 {{leagueName}} 8강에 진출했습니다',
    roundOf16: '{{actorName}}님이 {{leagueName}} 16강에 진출했습니다',
    roundOf32: '{{actorName}}님이 {{leagueName}} 32강에 진출했습니다',
  },
  actorActivity: '{{actorName}}님의 활동',
  feedTextError: '피드를 불러올 수 없습니다',
  viewClub: '클럽 보기',
  notification: '알림',
  unknown: '알 수 없음',
  report: '신고',
  hide: '숨기기',
};

// Spanish translations
const esFeedCard = {
  justNow: 'Ahora mismo',
  minutesAgo: 'hace {{minutes}}m',
  hoursAgo: 'hace {{hours}}h',
  daysAgo: 'hace {{days}}d',
  matchCompleted: {
    win: '{{actorName}} venció a {{targetName}} {{score}}',
    played: '{{actorName}} jugó contra {{targetName}} {{score}}',
  },
  newMemberJoined: '{{actorName}} se unió a {{clubName}}',
  leagueCreated: '{{actorName}} creó {{leagueName}}',
  league: 'Liga',
  leaguePlayoffs: {
    finals: '{{actorName}} avanzó a la Final en {{leagueName}}',
    semifinals: '{{actorName}} avanzó a Semifinales en {{leagueName}}',
    quarterfinals: '{{actorName}} avanzó a Cuartos de Final en {{leagueName}}',
    roundOf16: '{{actorName}} avanzó a Octavos de Final en {{leagueName}}',
    roundOf32: '{{actorName}} avanzó a Dieciseisavos en {{leagueName}}',
  },
  actorActivity: '{{actorName}} tuvo una actividad',
  feedTextError: 'No se puede cargar el feed',
  viewClub: 'Ver Club',
  notification: 'Notificación',
  unknown: 'Desconocido',
  report: 'Reportar',
  hide: 'Ocultar',
};

function updateLocale(filename, feedCardData) {
  const filePath = path.join(localesDir, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Add feedCard translations
  content.feedCard = feedCardData;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

// Update locale files
updateLocale('en.json', enFeedCard);
updateLocale('ko.json', koFeedCard);
updateLocale('es.json', esFeedCard);

// Propagate English to other locales
const otherLocales = ['de.json', 'fr.json', 'it.json', 'ja.json', 'pt.json', 'ru.json', 'zh.json'];
for (const locale of otherLocales) {
  updateLocale(locale, enFeedCard);
}

console.log('\n🎉 All locale files updated with feedCard translations!');
