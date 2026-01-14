/**
 * Add hostTeam and viewEvent translations to partnerInvitation section in all locale files
 *
 * Keys to add:
 * - partnerInvitation.hostTeam
 * - partnerInvitation.viewEvent
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for each language
const translations = {
  en: {
    hostTeam: 'Host Team',
    viewEvent: 'View Event Details',
  },
  ko: {
    hostTeam: '호스트 팀',
    viewEvent: '이벤트 상세보기',
  },
  ru: {
    hostTeam: 'Команда хоста',
    viewEvent: 'Посмотреть событие',
  },
  ja: {
    hostTeam: 'ホストチーム',
    viewEvent: 'イベント詳細を見る',
  },
  zh: {
    hostTeam: '主队',
    viewEvent: '查看活动详情',
  },
  de: {
    hostTeam: 'Gastgeber-Team',
    viewEvent: 'Event-Details anzeigen',
  },
  fr: {
    hostTeam: 'Équipe hôte',
    viewEvent: "Voir les détails de l'événement",
  },
  es: {
    hostTeam: 'Equipo anfitrión',
    viewEvent: 'Ver detalles del evento',
  },
  it: {
    hostTeam: 'Squadra ospitante',
    viewEvent: "Visualizza dettagli dell'evento",
  },
  pt: {
    hostTeam: 'Equipe anfitriã',
    viewEvent: 'Ver detalhes do evento',
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

    // Find partnerInvitation section and add keys
    if (json.partnerInvitation) {
      const newKeys = translations[lang];
      let keysAdded = 0;

      // Add each key if it doesn't exist
      Object.keys(newKeys).forEach(key => {
        if (!json.partnerInvitation[key]) {
          json.partnerInvitation[key] = newKeys[key];
          keysAdded++;
        }
      });

      if (keysAdded > 0) {
        // Write back to file with pretty formatting
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
        console.log(`✅ ${lang}.json: Added ${keysAdded} keys to partnerInvitation`);
      } else {
        console.log(`⚠️  ${lang}.json: All keys already exist in partnerInvitation`);
      }
    } else {
      console.error(`❌ ${lang}.json: partnerInvitation section not found`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 All locale files have been updated!');
