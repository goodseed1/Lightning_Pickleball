const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Lightning Host translations (replacing club_organizer)
const lightningHostTranslations = {
  en: { name: 'Lightning Host', desc: 'Host lightning matches and gatherings' },
  ko: { name: '번개 호스트', desc: '번개 매치와 모임을 주최하세요' },
  es: { name: 'Anfitrión Relámpago', desc: 'Organiza partidos y reuniones relámpago' },
  zh: { name: '闪电主持人', desc: '主持闪电比赛和聚会' },
  ja: { name: 'ライトニングホスト', desc: 'ライトニングマッチと集まりを主催' },
  fr: { name: 'Hôte Éclair', desc: 'Organisez des matchs et rassemblements éclair' },
  de: { name: 'Blitz-Gastgeber', desc: 'Organisieren Sie Blitz-Spiele und Treffen' },
  it: { name: 'Host Lampo', desc: 'Organizza partite e incontri lampo' },
  pt: { name: 'Anfitrião Relâmpago', desc: 'Organize partidas e encontros relâmpago' },
};

// New condition translation
const conditionTranslations = {
  en: 'Host {{count}} lightning match(es)',
  ko: '번개 매치 {{count}}회 주최',
  es: 'Organiza {{count}} partido(s) relámpago',
  zh: '主持{{count}}场闪电比赛',
  ja: '{{count}}回のライトニングマッチを主催',
  fr: 'Organisez {{count}} match(s) éclair',
  de: 'Organisieren Sie {{count}} Blitz-Spiel(e)',
  it: 'Organizza {{count}} partita/e lampo',
  pt: 'Organize {{count}} partida(s) relâmpago',
};

const languages = ['en', 'ko', 'es', 'zh', 'ja', 'fr', 'de', 'it', 'pt'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update badge translations
    if (content.achievementsGuide && content.achievementsGuide.badgeItems) {
      // Remove old club_organizer if exists
      delete content.achievementsGuide.badgeItems.club_organizer;

      // Add new lightning_host
      content.achievementsGuide.badgeItems.lightning_host = lightningHostTranslations[lang];

      // Add new condition type
      if (content.achievementsGuide.badgeItems.conditions) {
        content.achievementsGuide.badgeItems.conditions.lightningMatchesHosted =
          conditionTranslations[lang];
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json with lightning_host`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 Lightning Host translations updated!');
