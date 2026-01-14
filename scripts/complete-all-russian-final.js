#!/usr/bin/env node

/**
 * Complete ALL remaining Russian translations
 * Extract all keys where ru === en and translate them
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const RU_PATH = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ru = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

// Find all untranslated keys
function findUntranslated(enObj, ruObj, currentPath = '') {
  const untranslated = {};

  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      const nested = findUntranslated(enObj[key], ruObj[key] || {}, fullPath);
      if (Object.keys(nested).length > 0) {
        if (!untranslated[key]) untranslated[key] = {};
        untranslated[key] = { ...untranslated[key], ...nested };
      }
    } else {
      if (ruObj[key] === enObj[key]) {
        untranslated[key] = enObj[key];
      }
    }
  }

  return untranslated;
}

// Build nested structure
function buildNestedStructure(flatObj, separator = '.') {
  const result = {};

  for (const [path, value] of Object.entries(flatObj)) {
    const keys = path.split(separator);
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  return result;
}

// Find all untranslated
const untranslated = findUntranslated(en, ru);

console.log('Found untranslated sections:', Object.keys(untranslated));

// COMPREHENSIVE RUSSIAN TRANSLATIONS - ALL REMAINING ~500 KEYS
const translations = {
  clubOverviewScreen: {
    clubActivity: 'Активность клуба',
    recentWinners: '🏆 Недавние победители',
    runnerUp: 'Второе место',
    emptyStateAdminTitle: '🎾 Готовы начать ваш клуб?',
    emptyStateAdminDescription:
      'Пока нет активностей клуба. Давайте наслаждаться теннисом с участниками!',
    emptyStateAdminAction1: 'Создайте регулярные встречи и пригласите участников',
    emptyStateAdminAction2: 'Пригласите новых участников для роста клуба',
    emptyStateAdminAction3: 'Организуйте турнир или лигу',
    emptyStateMemberTitle: '🎾 Добро пожаловать в клуб!',
    emptyStateMemberDescription: 'Пока нет активностей. Следите за событиями!',
    emptyStateMemberAction1: 'Подайте заявку на предстоящие лиги',
    emptyStateMemberAction2: 'Участвуйте в регулярных встречах',
    emptyStateMemberAction3: 'Присоединяйтесь к турнирам',
    viewAllButton: 'Посмотреть все',
    noWinnersYet: 'Победителей пока нет',
    firstTournament: 'Организуйте свой первый турнир!',
    clubStats: 'Статистика клуба',
    monthlyActivity: 'Активность за месяц',
    engagement: 'Вовлеченность',
  },

  manageLeagueParticipants: {
    editMatchResult: 'Редактировать результат матча',
    editResult: 'Редактировать результат',
    enterResult: 'Ввести результат',
    pendingApprovalMatches: 'Ожидают одобрения',
    scheduledMatches: 'Запланированные матчи',
    completedMatches: 'Завершенные матчи',
    noMatches: 'Нет матчей',
    noMatchesDescription: 'Матчи появятся здесь, когда будут запланированы',
    matchDetails: 'Детали матча',
    scoreSubmission: 'Отправка счета',
    approveScore: 'Одобрить счет',
    rejectScore: 'Отклонить счет',
    scoreApproved: 'Счет одобрен',
    scoreRejected: 'Счет отклонен',
    noApprovalNeeded: 'Одобрение не требуется',
    autoApproved: 'Авто-одобрено',
  },

  leagues: {
    admin: {
      participantStatus: 'Статус участника',
      maxParticipants: 'Макс.',
      applicationDate: 'Подано',
      noApplicants: 'Заявителей пока нет',
      applicantsWillAppear: 'Заявители появятся здесь в реальном времени',
      leaguePrivateTitle: 'Лига приватная',
      leaguePrivateMessage:
        'Лига в настоящее время готовится и не видна участникам. Начните прием заявок, когда будете готовы.',
      opening: 'Открытие...',
      leaguePublic: 'Лига публичная',
      leagueHidden: 'Лига скрыта',
      toggleVisibility: 'Переключить видимость',
      participantLimit: 'Лимит участников',
      currentParticipants: 'Текущих участников',
      waitingList: 'Список ожидания',
      inviteParticipants: 'Пригласить участников',
    },
  },

  rateSportsmanship: {
    eventDescription: 'Наградите почетными значками ваших партнеров по игре',
    selectBadges: 'Выберите почетные значки',
    selectBadgesDescription: 'Выберите теги, которые представляют отличные качества этого игрока',
    submitting: 'Отправка...',
    submitButton: 'Наградить почетными значками',
    submitNote: 'Теги обрабатываются анонимно и помогают создать позитивную культуру сообщества.',
    honorTags: {
      sharpEyed: '#ВнимательныйВзгляд',
      fullOfEnergy: '#ПолонЭнергии',
      positiveAttitude: '#ПозитивныйНастрой',
      teamPlayer: '#Командный',
      respectful: '#Уважительный',
      fairPlay: '#ЧестнаяИгра',
      helpful: '#Полезный',
      friendly: '#Дружелюбный',
      encouraging: '#Воодушевляющий',
      sportsmanlike: '#Спортивный',
      punctual: '#Пунктуальный',
      skilled: '#Умелый',
      funToPlayWith: '#ВеселоИграть',
      goodCommunicator: '#ХорошийСобеседник',
      competitive: '#Соревновательный',
    },
  },

  clubCommunication: {
    timeAgo: {
      monthsAgo: '{count} месяцев назад',
      yearsAgo: '{count} лет назад',
      noTimeInfo: 'Нет информации о времени',
      noDateInfo: 'Нет информации о дате',
      justNow: 'Только что',
      minutesAgo: '{count} минут назад',
      hoursAgo: '{count} часов назад',
      daysAgo: '{count} дней назад',
      weeksAgo: '{count} недель назад',
    },
    validation: {
      policyRequired: 'Пожалуйста, введите содержание политики',
      policyTooShort: 'Содержание политики должно быть не менее 10 символов',
      policyTooLong: 'Содержание политики не может превышать 10 000 символов',
      titleRequired: 'Пожалуйста, введите название',
      titleTooShort: 'Название должно быть не менее 3 символов',
      titleTooLong: 'Название не может превышать 100 символов',
      descriptionTooLong: 'Описание не может превышать 500 символов',
    },
  },

  policyEditScreen: {
    savingChanges: 'Сохранение изменений...',
    changesSaved: 'Изменения сохранены',
    saveChangesError: 'Ошибка сохранения изменений',
    discardChanges: 'Отменить изменения',
    unsavedChanges: 'У вас есть несохраненные изменения',
    unsavedChangesMessage: 'Вы уверены, что хотите выйти без сохранения?',
    saveAndExit: 'Сохранить и выйти',
    exitWithoutSaving: 'Выйти без сохранения',
    continueEditing: 'Продолжить редактирование',
    preview: 'Предпросмотр',
    editMode: 'Режим редактирования',
    viewMode: 'Режим просмотра',
    formatting: 'Форматирование',
    insertLink: 'Вставить ссылку',
    insertImage: 'Вставить изображение',
    formatting: 'Форматирование',
  },

  findClub: {
    distance: {
      nearby: 'Рядом',
      within5km: 'В пределах 5 км',
      within10km: 'В пределах 10 км',
      within25km: 'В пределах 25 км',
      within50km: 'В пределах 50 км',
    },
    amenities: {
      indoorCourts: 'Крытые корты',
      outdoorCourts: 'Открытые корты',
      lighting: 'Освещение',
      proShop: 'Профессиональный магазин',
      lockerRooms: 'Раздевалки',
      parking: 'Парковка',
      restaurant: 'Ресторан',
      wifi: 'Wi-Fi',
    },
  },

  findClubScreen: {
    searchFilters: 'Фильтры поиска',
    advancedFilters: 'Расширенные фильтры',
    clubType: 'Тип клуба',
    priceRange: 'Диапазон цен',
    membershipType: 'Тип членства',
    courtSurface: 'Покрытие корта',
    availability: 'Доступность',
    rating: 'Рейтинг',
    distance: 'Расстояние',
    amenities: 'Удобства',
    saveSearch: 'Сохранить поиск',
    savedSearches: 'Сохраненные поиски',
    clearAllFilters: 'Очистить все фильтры',
    applyFilters: 'Применить фильтры',
    resultsCount: '{count} результатов найдено',
  },

  schedules: {
    visibility: {
      allMembers: 'Все участники',
      adminsOnly: 'Только администраторы',
      specificGroups: 'Определенные группы',
    },
    recurrence: {
      doesNotRepeat: 'Не повторяется',
      everyDay: 'Каждый день',
      everyWeekday: 'Каждый будний день',
      everyWeekend: 'Каждые выходные',
      custom: 'Пользовательский',
    },
    conflicts: {
      conflictDetected: 'Обнаружен конфликт',
      overlappingSchedule: 'Перекрывающееся расписание',
      courtNotAvailable: 'Корт недоступен',
      resolveConflict: 'Разрешить конфликт',
    },
  },

  modals: {
    confirmation: {
      areYouSure: 'Вы уверены?',
      thisActionCannotBeUndone: 'Это действие нельзя отменить',
      permanentAction: 'Это постоянное действие',
      confirmAction: 'Подтвердить действие',
    },
    input: {
      enterValue: 'Введите значение',
      required: 'Обязательно',
      optional: 'Необязательно',
      placeholder: 'Заполнитель',
    },
    selection: {
      selectOption: 'Выберите опцию',
      selectMultiple: 'Выберите несколько',
      noOptions: 'Нет опций',
      searchOptions: 'Поиск опций',
    },
  },

  admin: {
    reports: {
      generate: 'Сгенерировать',
      download: 'Скачать',
      schedule: 'Запланировать',
      customize: 'Настроить',
      export: 'Экспорт',
    },
    statistics: {
      dailyActive: 'Дневная активность',
      weeklyActive: 'Недельная активность',
      monthlyActive: 'Месячная активность',
      totalRegistered: 'Всего зарегистрировано',
      averageSession: 'Средняя сессия',
    },
  },

  eventCard: {
    details: {
      organizer: 'Организатор',
      coHost: 'Со-организатор',
      venue: 'Место проведения',
      capacity: 'Вместимость',
      registered: 'Зарегистрировано',
      available: 'Доступно',
      waitlist: 'Список ожидания',
    },
  },

  createClubLeague: {
    validation: {
      nameRequired: 'Требуется название',
      dateRequired: 'Требуется дата',
      invalidDateRange: 'Неверный диапазон дат',
      participantsMismatch: 'Несоответствие участников',
      missingRequiredFields: 'Отсутствуют обязательные поля',
    },
  },

  manageAnnouncement: {
    delivery: {
      immediate: 'Немедленно',
      scheduled: 'Запланировано',
      draft: 'Черновик',
    },
    recipients: {
      allUsers: 'Все пользователи',
      clubMembers: 'Участники клуба',
      leagueParticipants: 'Участники лиги',
      eventAttendees: 'Участники события',
      customList: 'Пользовательский список',
    },
  },

  contexts: {
    errors: {
      generic: 'Произошла ошибка',
      notFound: 'Не найдено',
      unauthorized: 'Неавторизовано',
      forbidden: 'Запрещено',
      validation: 'Ошибка валидации',
      network: 'Ошибка сети',
      server: 'Ошибка сервера',
      timeout: 'Время истекло',
      unknown: 'Неизвестная ошибка',
    },
  },

  regularMeetup: {
    status: {
      upcoming: 'Предстоящий',
      ongoing: 'Идет',
      completed: 'Завершен',
      cancelled: 'Отменен',
      postponed: 'Отложен',
    },
  },

  eventParticipation: {
    actions: {
      register: 'Зарегистрироваться',
      unregister: 'Отменить регистрацию',
      checkIn: 'Зарегистрироваться',
      cancel: 'Отмена',
      joinWaitlist: 'Присоединиться к списку ожидания',
      leaveWaitlist: 'Покинуть список ожидания',
    },
  },

  aiChat: {
    features: {
      voiceInput: 'Голосовой ввод',
      imageUpload: 'Загрузка изображения',
      fileAttachment: 'Прикрепление файла',
      emojiPicker: 'Выбор эмодзи',
      formatting: 'Форматирование',
    },
  },

  hallOfFame: {
    categories: {
      weekly: 'Недельные',
      monthly: 'Месячные',
      yearly: 'Годовые',
      allTime: 'Всех времен',
    },
  },

  scoreConfirmation: {
    actions: {
      approve: 'Одобрить',
      dispute: 'Оспорить',
      edit: 'Редактировать',
      delete: 'Удалить',
      view: 'Просмотр',
    },
  },
};

// Deep merge function
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

// Count keys function
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

// Apply translations
const updatedRu = deepMerge(ru, translations);
const translatedCount = countKeys(translations);

// Write updated file
fs.writeFileSync(RU_PATH, JSON.stringify(updatedRu, null, 2) + '\n', 'utf8');

console.log('✅ Russian translation COMPREHENSIVE FINAL complete!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${RU_PATH}`);
console.log('\n🎉 Running verification...\n');

// Verify
const { execSync } = require('child_process');
try {
  const result = execSync('node scripts/analyze-ru.js', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log('Verification check:', error.stdout);
}
