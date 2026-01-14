const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Clean address_placeholder - remove "EN/US/Atlanta bias" and use proper translations
const placeholders = {
  en: 'Search for pickleball court address',
  ko: '피클볼 코트 주소 검색',
  es: 'Buscar dirección de la cancha',
  de: 'Pickleballplatz-Adresse suchen',
  fr: "Rechercher l'adresse du court",
  it: 'Cerca indirizzo del campo',
  ja: 'テニスコートの住所を検索',
  pt: 'Buscar endereço da quadra',
  ru: 'Поиск адреса корта',
  zh: '搜索网球场地址',
};

console.log('🧹 Fixing address_placeholder translations...\n');

Object.keys(placeholders).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update createClub.fields.address_placeholder
    if (content.createClub && content.createClub.fields) {
      content.createClub.fields.address_placeholder = placeholders[lang];
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
      console.log(`✅ ${lang}.json - Updated address_placeholder`);
    } else {
      console.log(`⚠️ ${lang}.json - createClub.fields not found`);
    }
  } catch (err) {
    console.log(`❌ ${lang}.json - Error: ${err.message}`);
  }
});

console.log('\n🎉 Done! Removed EN/US/Atlanta bias text.');
