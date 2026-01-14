const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for "more" in common section
const moreTranslations = {
  en: 'more',
  ko: '더 보기',
  es: 'más',
  zh: '更多',
  ja: 'もっと',
  vi: 'thêm',
  fr: 'plus',
  de: 'mehr',
  it: 'altro',
  pt: 'mais',
  ru: 'ещё',
};

// Translations for achievementsGuide.tip
const tipTranslations = {
  en: 'Tap the (?) icon in Hall of Fame to see the full guide',
  ko: '명예의 전당에서 (?) 아이콘을 눌러 전체 가이드를 확인하세요',
  es: 'Toca el ícono (?) en el Salón de la Fama para ver la guía completa',
  zh: '点击荣誉殿堂中的 (?) 图标查看完整指南',
  ja: '殿堂の (?) アイコンをタップして完全なガイドを見る',
  vi: 'Nhấn vào biểu tượng (?) trong Đại sảnh Danh vọng để xem hướng dẫn đầy đủ',
  fr: "Appuyez sur l'icône (?) dans le Panthéon pour voir le guide complet",
  de: 'Tippen Sie auf das (?)-Symbol in der Ruhmeshalle, um den vollständigen Leitfaden zu sehen',
  it: "Tocca l'icona (?) nella Hall of Fame per vedere la guida completa",
  pt: 'Toque no ícone (?) no Hall da Fama para ver o guia completo',
  ru: 'Нажмите на значок (?) в Зале славы, чтобы увидеть полное руководство',
};

const languages = ['es', 'zh', 'ja', 'vi', 'fr', 'de', 'it', 'pt', 'ru'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add "more" to common if not exists
    if (content.common && !content.common.more) {
      content.common.more = moreTranslations[lang] || moreTranslations.en;
      console.log(`✅ Added common.more to ${lang}.json`);
    }

    // Add "tip" to achievementsGuide if not exists
    if (content.achievementsGuide && !content.achievementsGuide.tip) {
      content.achievementsGuide.tip = tipTranslations[lang] || tipTranslations.en;
      console.log(`✅ Added achievementsGuide.tip to ${lang}.json`);
    }

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 Achievements Guide translations added!');
