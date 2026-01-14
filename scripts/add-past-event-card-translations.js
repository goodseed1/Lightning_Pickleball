/**
 * Add retired/walkover translations to pastEventCard.matchResult section in all locale files
 *
 * Keys to add:
 * - pastEventCard.matchResult.retired
 * - pastEventCard.matchResult.walkover
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for each language
const translations = {
  en: {
    retired: 'Retired',
    walkover: 'Walkover',
  },
  ko: {
    retired: '기권승',
    walkover: '부전승',
  },
  ru: {
    retired: 'Снятие',
    walkover: 'Неявка',
  },
  ja: {
    retired: '棄権',
    walkover: '不戦勝',
  },
  zh: {
    retired: '退赛',
    walkover: '弃权胜',
  },
  de: {
    retired: 'Aufgabe',
    walkover: 'Walkover',
  },
  fr: {
    retired: 'Abandon',
    walkover: 'Forfait',
  },
  es: {
    retired: 'Retirado',
    walkover: 'Walkover',
  },
  it: {
    retired: 'Ritiro',
    walkover: 'Walkover',
  },
  pt: {
    retired: 'Desistência',
    walkover: 'W.O.',
  },
};

// Languages to process
const languages = ['en', 'ko', 'ru', 'ja', 'zh', 'de', 'fr', 'es', 'it', 'pt'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  try {
    // Read the existing JSON file
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Find pastEventCard.matchResult and add keys
    if (json.pastEventCard && json.pastEventCard.matchResult) {
      const newKeys = translations[lang];
      let keysAdded = 0;

      // Add each key if it doesn't exist
      Object.keys(newKeys).forEach(key => {
        if (!json.pastEventCard.matchResult[key]) {
          json.pastEventCard.matchResult[key] = newKeys[key];
          keysAdded++;
        }
      });

      if (keysAdded > 0) {
        // Write back to file with pretty formatting
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
        console.log(`✅ ${lang}.json: Added ${keysAdded} keys to pastEventCard.matchResult`);
      } else {
        console.log(`⚠️  ${lang}.json: All keys already exist in pastEventCard.matchResult`);
      }
    } else {
      console.error(`❌ ${lang}.json: pastEventCard.matchResult section not found`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 All locale files have been updated!');
