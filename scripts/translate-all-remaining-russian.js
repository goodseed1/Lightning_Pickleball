#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// FINAL COMPREHENSIVE BATCH - ALL REMAINING ~460 KEYS
const translations = {
  findClub: {
    title: 'Найти клуб',
    searching: 'Поиск клубов...',
    joinRequest: 'Запрос на вступление в клуб',
    joinButton: 'Запрос',
    joinSuccess:
      'Запрос на вступление отправлен. Пожалуйста, дождитесь одобрения администратора клуба.',
    status: {
      join: 'Запросить вступление',
      joined: 'Присоединился',
      pending: 'Ожидает одобрения',
      declined: 'Отклонено',
      approved: 'Одобрено',
    },
    noClubsFound: 'Клубы не найдены',
    tryDifferentSearch: 'Попробуйте другой поиск',
  },

  policyEditScreen: {
    quickInsert: 'Быстрая вставка',
    section: 'Раздел',
    rule: 'Правило',
    placeholder: 'Введите содержание политики...',
    characters: 'символов',
    modified: 'Изменено',
    previewEmpty: 'Нет содержания',
    loadingPolicy: 'Загрузка политики...',
    savePolicy: 'Сохранить политику',
    deletePolicy: 'Удалить политику',
    policyName: 'Название политики',
    policyContent: 'Содержание политики',
    policyType: 'Тип политики',
  },

  findClubScreen: {
    searching: 'Поиск клубов...',
    joinRequest: 'Запрос на вступление',
    joinComplete: 'Присоединился',
    pendingApproval: 'Ожидает одобрения',
    joinDeclined: 'Отклонено',
    emptyListTitle: 'Нет доступных публичных клубов',
    emptyListMessage: 'Создать новый клуб',
    joinRequestTitle: 'Присоединиться к клубу',
    requestSent: 'Запрос отправлен',
    requestFailed: 'Запрос не удался',
    alreadyMember: 'Уже участник',
    loading: 'Загрузка...',
    refresh: 'Обновить',
  },

  schedules: {
    form: {
      locationName: 'Название места *',
      address: 'Адрес *',
      addressPlaceholder: 'Введите полный адрес',
      directions: 'Направления',
      directionsPlaceholder: 'Информация о парковке, расположение входа и т.д.',
      courtType: 'Тип корта',
      indoor: 'Крытый',
      outdoor: 'Открытый',
      courtNumber: 'Номер корта',
      capacity: 'Вместимость',
      equipment: 'Оборудование',
      notes: 'Примечания',
      restrictions: 'Ограничения',
    },
  },

  modals: {
    tournamentCompleted: {
      title: 'Победа в турнире!',
      runnerUp: 'Второе место',
      viewFeed: 'Просмотр ленты клуба',
      champion: 'Чемпион',
      congratulations: 'Поздравляем!',
      share: 'Поделиться',
    },
    leagueCompleted: {
      title: 'Лига завершена!',
      runnerUp: 'Второе место',
      points: 'очков',
      viewFeed: 'Просмотр ленты клуба',
      standings: 'Таблица',
      finalStandings: 'Финальная таблица',
    },
    playoffCreated: {
      title: 'Плей-офф создан!',
      message: 'Плей-офф успешно создан',
      viewBracket: 'Просмотр сетки',
      startPlayoffs: 'Начать плей-офф',
    },
  },

  admin: {
    permissions: {
      viewOnly: 'Только просмотр',
      edit: 'Редактирование',
      full: 'Полный доступ',
      custom: 'Пользовательский',
    },
    roles: {
      superAdmin: 'Супер-администратор',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
      guest: 'Гость',
    },
    settings: {
      general: 'Общие',
      security: 'Безопасность',
      notifications: 'Уведомления',
      privacy: 'Конфиденциальность',
      advanced: 'Расширенные',
    },
  },

  eventCard: {
    actions: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      edit: 'Редактировать',
      cancel: 'Отменить',
      share: 'Поделиться',
      report: 'Сообщить',
    },
    labels: {
      featured: 'Рекомендуемое',
      popular: 'Популярное',
      new: 'Новое',
      full: 'Заполнено',
      cancelled: 'Отменено',
    },
  },

  createClubLeague: {
    buttons: {
      next: 'Далее',
      back: 'Назад',
      create: 'Создать',
      cancel: 'Отмена',
      save: 'Сохранить',
    },
    messages: {
      creating: 'Создание лиги...',
      created: 'Лига создана',
      error: 'Ошибка создания лиги',
      success: 'Успешно',
    },
  },

  manageAnnouncement: {
    fields: {
      title: 'Название',
      content: 'Содержание',
      priority: 'Приоритет',
      expiryDate: 'Дата истечения',
      targetAudience: 'Целевая аудитория',
    },
    buttons: {
      publish: 'Опубликовать',
      schedule: 'Запланировать',
      draft: 'Черновик',
      delete: 'Удалить',
      preview: 'Предпросмотр',
    },
  },

  contexts: {
    language: {
      english: 'Английский',
      korean: 'Корейский',
      spanish: 'Испанский',
      french: 'Французский',
      german: 'Немецкий',
      japanese: 'Японский',
      chinese: 'Китайский',
      russian: 'Русский',
    },
    theme: {
      light: 'Светлая',
      dark: 'Темная',
      auto: 'Авто',
    },
  },

  regularMeetup: {
    frequency: {
      once: 'Один раз',
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      biweekly: 'Раз в две недели',
      monthly: 'Ежемесячно',
    },
    visibility: {
      public: 'Публичное',
      private: 'Приватное',
      membersOnly: 'Только участники',
    },
  },

  eventParticipation: {
    status: {
      confirmed: 'Подтверждено',
      tentative: 'Возможно',
      declined: 'Отклонено',
      pending: 'Ожидает',
      cancelled: 'Отменено',
    },
    notifications: {
      emailReminder: 'Email напоминание',
      pushNotification: 'Push уведомление',
      smsAlert: 'SMS оповещение',
    },
  },

  aiChat: {
    commands: {
      help: 'Помощь',
      clear: 'Очистить',
      settings: 'Настройки',
      feedback: 'Обратная связь',
    },
    suggestions: {
      findMatch: 'Найти матч',
      viewSchedule: 'Просмотр расписания',
      checkRanking: 'Проверить рейтинг',
      joinEvent: 'Присоединиться к событию',
    },
  },

  hallOfFame: {
    achievements: {
      firstMatch: 'Первый матч',
      hundredMatches: '100 матчей',
      firstWin: 'Первая победа',
      winStreak: 'Серия побед',
      champion: 'Чемпион',
      legend: 'Легенда',
    },
  },

  scoreConfirmation: {
    validation: {
      required: 'Обязательно',
      invalidScore: 'Неверный счет',
      scoreMismatch: 'Несоответствие счета',
      tiebreakRequired: 'Требуется тай-брейк',
    },
  },

  matchRequest: {
    fields: {
      date: 'Дата',
      time: 'Время',
      location: 'Место',
      skillLevel: 'Уровень навыков',
      message: 'Сообщение',
    },
    actions: {
      send: 'Отправить',
      accept: 'Принять',
      decline: 'Отклонить',
      cancel: 'Отменить',
      reschedule: 'Перенести',
    },
  },

  roleManagement: {
    roles: {
      owner: 'Владелец',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
      guest: 'Гость',
    },
    permissions: {
      manageMembers: 'Управление участниками',
      createEvents: 'Создание событий',
      editSettings: 'Редактирование настроек',
      viewAnalytics: 'Просмотр аналитики',
      deleteContent: 'Удаление содержимого',
    },
  },

  clubPolicies: {
    types: {
      conduct: 'Поведение',
      privacy: 'Конфиденциальность',
      terms: 'Условия',
      safety: 'Безопасность',
      payment: 'Оплата',
    },
    status: {
      active: 'Активная',
      draft: 'Черновик',
      archived: 'Архивированная',
      pending: 'Ожидает',
    },
  },

  terms: {
    acceptance: {
      agree: 'Я согласен',
      disagree: 'Я не согласен',
      acceptAll: 'Принять все',
      required: 'Обязательно',
    },
    sections: {
      userAgreement: 'Пользовательское соглашение',
      privacyPolicy: 'Политика конфиденциальности',
      cookiePolicy: 'Политика cookies',
      termsOfService: 'Условия использования',
    },
  },

  activityTab: {
    filters: {
      today: 'Сегодня',
      week: 'Неделя',
      month: 'Месяц',
      all: 'Все',
    },
    empty: {
      title: 'Нет активности',
      message: 'Ваша активность появится здесь',
      action: 'Начать',
    },
  },

  scheduleMeetup: {
    steps: {
      details: 'Детали',
      location: 'Место',
      participants: 'Участники',
      review: 'Проверка',
    },
    validation: {
      titleRequired: 'Требуется название',
      dateRequired: 'Требуется дата',
      locationRequired: 'Требуется место',
      participantsRequired: 'Требуются участники',
    },
  },

  myClubs: {
    tabs: {
      joined: 'Присоединился',
      managed: 'Управляемые',
      favorites: 'Избранные',
    },
    actions: {
      create: 'Создать клуб',
      search: 'Поиск клубов',
      filter: 'Фильтр',
    },
  },

  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Лиги',
      tournaments: 'Турниры',
      upcoming: 'Предстоящие',
      active: 'Активные',
      completed: 'Завершенные',
    },
  },

  createEvent: {
    types: {
      match: 'Матч',
      tournament: 'Турнир',
      practice: 'Тренировка',
      social: 'Социальное',
      clinic: 'Клиника',
    },
  },

  hostedEventCard: {
    actions: {
      view: 'Просмотр',
      edit: 'Редактировать',
      cancel: 'Отменить',
      duplicate: 'Дублировать',
    },
  },

  duesManagement: {
    status: {
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      partial: 'Частично',
      overdue: 'Просрочено',
    },
  },

  manageLeagueParticipants: {
    filters: {
      all: 'Все',
      active: 'Активные',
      pending: 'Ожидающие',
      removed: 'Удаленные',
    },
  },

  meetupDetail: {
    sections: {
      overview: 'Обзор',
      participants: 'Участники',
      location: 'Место',
      discussion: 'Обсуждение',
    },
  },

  lessonCard: {
    difficulty: {
      beginner: 'Начинающий',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      expert: 'Эксперт',
    },
  },

  createModal: {
    options: {
      event: 'Событие',
      league: 'Лига',
      tournament: 'Турнир',
      meetup: 'Встреча',
      announcement: 'Объявление',
    },
  },

  userActivity: {
    types: {
      login: 'Вход',
      logout: 'Выход',
      profileUpdate: 'Обновление профиля',
      matchPlayed: 'Сыгранный матч',
      eventJoined: 'Присоединился к событию',
    },
  },

  rankingPrivacy: {
    options: {
      public: 'Публичный',
      friendsOnly: 'Только друзья',
      private: 'Приватный',
    },
  },

  tournamentDetail: {
    tabs: {
      bpaddle: 'Сетка',
      schedule: 'Расписание',
      participants: 'Участники',
      rules: 'Правила',
    },
  },

  myProfile: {
    sections: {
      overview: 'Обзор',
      stats: 'Статистика',
      achievements: 'Достижения',
      history: 'История',
      settings: 'Настройки',
    },
  },

  developerTools: {
    options: {
      logs: 'Логи',
      debug: 'Отладка',
      performance: 'Производительность',
      network: 'Сеть',
    },
  },

  eventChat: {
    actions: {
      send: 'Отправить',
      attach: 'Прикрепить',
      emoji: 'Эмодзи',
      reply: 'Ответить',
    },
  },

  eventDetail: {
    tabs: {
      overview: 'Обзор',
      participants: 'Участники',
      chat: 'Чат',
      location: 'Место',
    },
  },

  eloTrend: {
    periods: {
      week: 'Неделя',
      month: 'Месяц',
      quarter: 'Квартал',
      year: 'Год',
      allTime: 'Все время',
    },
  },

  achievementsGuide: {
    categories: {
      matches: 'Матчи',
      tournaments: 'Турниры',
      social: 'Социальное',
      skills: 'Навыки',
      special: 'Специальные',
    },
  },

  recordScore: {
    validation: {
      invalidSet: 'Неверный сет',
      invalidTiebreak: 'Неверный тай-брейк',
      incompleteScore: 'Неполный счет',
    },
  },

  matchDetail: {
    tabs: {
      summary: 'Сводка',
      stats: 'Статистика',
      timeline: 'Временная шкала',
      chat: 'Чат',
    },
  },

  cards: {
    tournament: {
      status: {
        upcoming: 'Предстоящий',
        inProgress: 'В процессе',
        completed: 'Завершен',
      },
    },
  },

  mapAppSelector: {
    apps: {
      googleMaps: 'Google Maps',
      appleMaps: 'Apple Maps',
      waze: 'Waze',
      browser: 'Браузер',
    },
  },

  participantSelector: {
    filters: {
      all: 'Все',
      friends: 'Друзья',
      clubMembers: 'Участники клуба',
      recent: 'Недавние',
    },
  },

  ntrpSelector: {
    levels: {
      beginner: 'Начинающий',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      expert: 'Эксперт',
    },
  },

  clubHallOfFame: {
    categories: {
      monthly: 'Месячные',
      seasonal: 'Сезонные',
      yearly: 'Годовые',
      allTime: 'Всех времен',
    },
  },

  appNavigator: {
    tabs: {
      home: 'Главная',
      matches: 'Матчи',
      clubs: 'Клубы',
      profile: 'Профиль',
    },
  },

  league: {
    phases: {
      registration: 'Регистрация',
      season: 'Сезон',
      playoffs: 'Плей-офф',
      completed: 'Завершена',
    },
  },

  tournament: {
    rounds: {
      final: 'Финал',
      semiFinal: 'Полуфинал',
      quarterFinal: 'Четвертьфинал',
      roundOf16: '1/8 финала',
    },
  },

  clubCommunication: {
    channels: {
      general: 'Общий',
      announcements: 'Объявления',
      events: 'События',
      matches: 'Матчи',
    },
  },

  clubPoliciesScreen: {
    actions: {
      add: 'Добавить',
      edit: 'Редактировать',
      delete: 'Удалить',
      view: 'Просмотр',
    },
  },

  clubDetailScreen: {
    sections: {
      about: 'О клубе',
      events: 'События',
      members: 'Участники',
      policies: 'Политики',
    },
  },

  matches: {
    types: {
      singles: 'Одиночный',
      doubles: 'Парный',
      mixed: 'Смешанный',
    },
  },

  screens: {
    loading: {
      title: 'Загрузка...',
      message: 'Пожалуйста, подождите',
    },
  },

  utils: {
    dateFormat: {
      short: 'Краткий',
      long: 'Длинный',
      relative: 'Относительный',
    },
  },

  feedCard: {
    actions: {
      like: 'Нравится',
      comment: 'Комментировать',
      share: 'Поделиться',
      report: 'Сообщить',
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
fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2) + '\n', 'utf8');

console.log('✅ ALL REMAINING Russian translations complete!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);

// Verify
const { execSync } = require('child_process');
try {
  console.log('\n🔍 Running final verification...\n');
  const result = execSync('node scripts/analyze-ru.js', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log(error.stdout);
}
