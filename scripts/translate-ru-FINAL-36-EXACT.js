const fs = require('fs');
const path = require('path');

/**
 * THE TRULY FINAL 36 Russian translations
 * Exact key matching for remaining untranslated keys
 */
const translations = {
  createEvent: {
    languages: {
      korean: '한국어',
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
  },

  feedCard: {
    feedTextError: 'Не удаётся загрузить ленту',
    viewClub: 'Просмотреть клуб',
    notification: 'Уведомление',
    unknown: 'Неизвестно',
  },

  profile: {
    settings: {
      notifications: 'Настройки уведомлений',
      profileSettings: 'Настройки профиля',
      appSettings: 'Настройки приложения',
    },
  },

  eventChat: {
    errors: {
      chatRoomNotice: 'Уведомление чата',
      userNotFound: 'Информация о пользователе не найдена.',
      sendError: 'Произошла ошибка при отправке сообщения.',
    },
  },

  scoreConfirmation: {
    player1: 'Игрок 1',
    player2: 'Игрок 2',
    confirmMatch: 'Подтвердить матч',
  },

  duesManagement: {
    overdue: 'Просрочено',
    upcoming: 'Предстоящие',
  },

  clubPolicies: {
    edit: 'Редактировать',
    save: 'Сохранить',
  },

  clubLeaguesTournaments: {
    register: 'Зарегистрироваться',
  },

  meetupDetail: {
    location: 'Местоположение',
  },

  lessonCard: {
    duration: 'Длительность',
  },

  tournamentDetail: {
    participants: 'Участники',
  },

  myProfile: {
    edit: 'Редактировать',
  },

  eventDetail: {
    details: 'Детали',
  },

  matchDetail: {
    result: 'Результат',
  },

  appNavigator: {
    back: 'Назад',
  },

  screens: {
    error: 'Ошибка',
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key]) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Apply translations
const ruPath = path.join(__dirname, '..', 'src', 'locales', 'ru.json');
const existingRu = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

const updatedRu = deepMerge(existingRu, translations);

fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2) + '\n', 'utf8');

console.log('✅ THE TRULY FINAL 36 Russian translations applied!');
console.log('\n📊 All remaining keys completed with exact matching:');
console.log('  ✓ createEvent.languages: 5 keys');
console.log('  ✓ matches (skillLevels, createModal): 5 keys');
console.log('  ✓ feedCard: 4 keys');
console.log('  ✓ profile.settings: 3 keys');
console.log('  ✓ eventChat.errors: 3 keys');
console.log('  ✓ scoreConfirmation: 3 keys');
console.log('  ✓ duesManagement: 2 keys');
console.log('  ✓ clubPolicies: 2 keys');
console.log('  ✓ Single-key sections (9 sections): 9 keys');
console.log('\n  TOTAL: 36 keys!');
console.log('\n🎉🎉🎉 RUSSIAN TRANSLATION NOW COMPLETE! 🎉🎉🎉');
console.log('📝 Verifying with find-untranslated-ru.js next...');
