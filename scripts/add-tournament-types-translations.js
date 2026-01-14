const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// English translations for tournament types
const enTournamentTypes = {
  validation: {
    singlesNoPartner: 'Singles tournaments do not require a partner.',
    mensSinglesMaleOnly: "Men's singles is only for male players.",
    womensSinglesFemaleOnly: "Women's singles is only for female players.",
    doublesPartnerRequired: 'Doubles tournaments require a partner.',
    mensDoublesMaleOnly: "Men's doubles is only for male players.",
    womensDoublesFemaleOnly: "Women's doubles is only for female players.",
    mixedDoublesRequirement: 'Mixed doubles requires one male and one female player.',
  },
  eventTypes: {
    mens_singles: "Men's Singles",
    womens_singles: "Women's Singles",
    mens_doubles: "Men's Doubles",
    womens_doubles: "Women's Doubles",
    mixed_doubles: 'Mixed Doubles',
  },
};

// Korean translations for tournament types
const koTournamentTypes = {
  validation: {
    singlesNoPartner: '단식 토너먼트에는 파트너가 필요하지 않습니다.',
    mensSinglesMaleOnly: '남자 단식은 남성만 참가 가능합니다.',
    womensSinglesFemaleOnly: '여자 단식은 여성만 참가 가능합니다.',
    doublesPartnerRequired: '복식 토너먼트에는 파트너가 필요합니다.',
    mensDoublesMaleOnly: '남자 복식은 남성 선수들만 참가 가능합니다.',
    womensDoublesFemaleOnly: '여자 복식은 여성 선수들만 참가 가능합니다.',
    mixedDoublesRequirement: '혼합 복식은 남성과 여성이 팀을 이뤄야 합니다.',
  },
  eventTypes: {
    mens_singles: '남자 단식',
    womens_singles: '여자 단식',
    mens_doubles: '남자 복식',
    womens_doubles: '여자 복식',
    mixed_doubles: '혼합 복식',
  },
};

function updateLocale(filename, tournamentTypes) {
  const filePath = path.join(localesDir, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Ensure types.tournament exists
  if (!content.types) {
    content.types = {};
  }
  if (!content.types.tournament) {
    content.types.tournament = {};
  }

  // Add tournament types translations
  content.types.tournament.validation = tournamentTypes.validation;
  content.types.tournament.eventTypes = tournamentTypes.eventTypes;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

// Update en.json and ko.json first
updateLocale('en.json', enTournamentTypes);
updateLocale('ko.json', koTournamentTypes);

// Propagate English to other locales
const otherLocales = [
  'de.json',
  'es.json',
  'fr.json',
  'it.json',
  'ja.json',
  'pt.json',
  'ru.json',
  'zh.json',
];
for (const locale of otherLocales) {
  updateLocale(locale, enTournamentTypes);
}

console.log('\n🎉 All locale files updated with tournament types translations!');
