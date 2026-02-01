#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// MEGA BATCH: Comprehensive translations for all remaining sections
const translations = {
  // Services - comprehensive coverage
  services: {
    event: {
      noEventsFound: 'События не найдены с вашими критериями. Попробуйте другие фильтры!',
      untitled: 'Без названия',
      eventsFound: 'Найдено событий: {{count}}!',
      searchError: 'Произошла ошибка при поиске.',
      locationTbd: 'Место уточняется',
      host: 'Организатор',
      noMatchesFound: 'Матчи не найдены с вашими критериями. Попробовать другие фильтры?',
      matchesFoundMessage: '🎾 Найдено матчей: {{count}}!',
    },

    map: {
      selectApp: 'Выбрать приложение',
      openWith: 'Открыть с помощью',
    },
  },

  // Dues Management - complete remaining
  duesManagement: {
    actions: {
      close: 'Закрыть',
      share: 'Поделиться',
      change: 'Изменить',
      viewAttachment: 'Просмотреть вложение',
      processPayment: 'Обработать платеж',
      markAsPaid: 'Отметить как оплаченные',
    },

    alerts: {
      error: 'Ошибка',
      success: 'Успешно',
      warning: 'Предупреждение',
      info: 'Информация',
      confirm: 'Подтвердить',
    },
  },

  // League Detail - complete remaining
  leagueDetail: {
    participantsAddError: 'Ошибка добавления участников. Проверьте консоль.',
    partialSuccess: 'Частичный успех',
    teamsAddedSuccess: 'Успешно добавлено команд: {{count}}.',
    teamsAddError: 'Ошибка добавления команд.',
    loginRequired: 'Требуется вход.',
    alreadyAppliedOrJoined: 'Уже подали заявку или участвуете.',
    selectPartner: 'Выберите партнера.',
    applicationComplete: 'Заявка завершена',
    applicationSuccess: 'Заявка успешно отправлена.',
    withdrawSuccess: 'Заявка отозвана.',
    withdrawError: 'Ошибка отзыва заявки.',
  },

  // Club Leagues & Tournaments - complete remaining
  clubLeaguesTournaments: {
    labels: {
      singleElimination: 'Одиночное выбывание',
      doubleElimination: 'Двойное выбывание',
      roundRobin: 'Круговая система',
      newTeamInvitations: '🏛️ Новые приглашения в команду',
      sentInvitation: 'отправил(-а) вам приглашение в команду',
      expiresIn: 'Истекает через {{hours}}ч',
      duration: 'Длительность',
      registrationFee: 'Регистрационный взнос',
    },

    modals: {
      sendTeamInvitation: '🏛️ Отправить приглашение в команду',
      selectPartner: '🏛️ Выбрать партнера',
      sendInvitationInstructions:
        'Отправьте приглашение в команду вашему партнеру. После принятия вы сможете зарегистрироваться.',
      selectPartnerInstructions: 'Выберите партнера для заявки на парную лигу.',
      confirmWithdrawal: 'Подтвердите отзыв',
      withdrawalWarning: 'Вы уверены, что хотите отозвать заявку?',
    },

    messages: {
      invitationSent: 'Приглашение отправлено',
      invitationAccepted: 'Приглашение принято',
      invitationRejected: 'Приглашение отклонено',
      invitationExpired: 'Приглашение истекло',
    },
  },

  // Club Tournament Management - complete tabs and status
  clubTournamentManagement: {
    tabs: {
      active: 'Активные',
      completed: 'Завершенные',
      upcoming: 'Предстоящие',
      all: 'Все',
    },

    detailTabs: {
      matches: 'Матчи',
      participants: 'Участники',
      standings: 'Турнирная таблица',
      management: 'Управление',
      bpaddle: 'Сетка',
    },

    status: {
      bpaddleGeneration: 'Создание сетки',
      inProgress: 'В процессе',
      upcoming: 'Предстоящий',
      completed: 'Завершен',
      cancelled: 'Отменен',
    },

    actions: {
      generateBracket: 'Создать сетку',
      startTournament: 'Начать турнир',
      completeTournament: 'Завершить турнир',
      cancelTournament: 'Отменить турнир',
      editTournament: 'Редактировать турнир',
      viewBracket: 'Просмотреть сетку',
    },
  },

  // Types - complete remaining
  types: {
    gender: {
      male: 'Мужской',
      female: 'Женский',
      other: 'Другой',
      preferNotToSay: 'Предпочитаю не говорить',
    },

    playingHand: {
      right: 'Правая',
      left: 'Левая',
      both: 'Обе',
    },

    backhand: {
      oneHanded: 'Одноручный',
      twoHanded: 'Двуручный',
    },

    playStyle: {
      aggressive: 'Агрессивный',
      defensive: 'Оборонительный',
      allCourt: 'Универсальный',
      baseline: 'От задней линии',
      netPlayer: 'У сетки',
    },

    goals: {
      compete: 'Соревноваться',
      fitness: 'Фитнес',
      social: 'Социальный',
      improve: 'Улучшить навыки',
      fun: 'Развлечение',
    },
  },

  // Email Login - remaining
  emailLogin: {
    rememberMe: 'Запомнить меня',
    staySignedIn: 'Оставаться в системе',
    newUser: 'Новый пользователь?',
    existingUser: 'Существующий пользователь?',
  },

  // Club - remaining
  club: {
    search: {
      placeholder: 'Поиск клубов...',
      byName: 'По названию',
      byLocation: 'По местоположению',
      byFacilities: 'По удобствам',
    },

    sort: {
      byName: 'По названию',
      byDistance: 'По расстоянию',
      byMembers: 'По участникам',
      byRating: 'По рейтингу',
      byActivity: 'По активности',
    },
  },

  // My Activities - remaining
  myActivities: {
    sort: {
      byDate: 'По дате',
      byType: 'По типу',
      byDuration: 'По длительности',
      byLocation: 'По месту',
    },

    export: {
      title: 'Экспортировать активности',
      csv: 'CSV',
      pdf: 'PDF',
      json: 'JSON',
    },
  },

  // Matches - remaining
  matches: {
    search: {
      placeholder: 'Поиск матчей...',
      byPlayer: 'По игроку',
      byDate: 'По дате',
      byLocation: 'По месту',
    },

    sort: {
      byDate: 'По дате',
      byTime: 'По времени',
      byLevel: 'По уровню',
      byLocation: 'По месту',
    },
  },

  // Profile - remaining
  profile: {
    edit: {
      title: 'Редактировать профиль',
      save: 'Сохранить',
      cancel: 'Отменить',
      photo: 'Изменить фото',
      coverPhoto: 'Изменить обложку',
    },

    visibility: {
      title: 'Видимость профиля',
      public: 'Публичный',
      private: 'Приватный',
      friendsOnly: 'Только друзья',
    },
  },

  // Discover - remaining
  discover: {
    sort: {
      relevance: 'По релевантности',
      distance: 'По расстоянию',
      rating: 'По рейтингу',
      recent: 'Недавние',
      popular: 'Популярные',
    },
  },

  // Event Card - remaining
  eventCard: {
    visibility: {
      public: 'Публичное',
      private: 'Приватное',
      friendsOnly: 'Только друзья',
    },
  },

  // AI Matching - remaining
  aiMatching: {
    settings: {
      title: 'Настройки подбора',
      distance: 'Максимальное расстояние',
      skillRange: 'Диапазон уровня',
      availability: 'Доступность',
    },
  },

  // Create Meetup - remaining
  createMeetup: {
    preview: {
      title: 'Предпросмотр',
      viewPreview: 'Просмотреть',
    },
  },

  // Schedule Meetup - remaining
  scheduleMeetup: {
    conflicts: {
      title: 'Конфликты',
      resolve: 'Разрешить',
      ignore: 'Игнорировать',
    },
  },

  // Club Overview Screen - remaining
  clubOverviewScreen: {
    hours: {
      title: 'Часы работы',
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье',
      closed: 'Закрыто',
    },
  },

  // Badge Gallery - remaining
  badgeGallery: {
    filter: {
      all: 'Все',
      earned: 'Получено',
      locked: 'Заблокировано',
      byCategory: 'По категории',
      byRarity: 'По редкости',
    },
  },

  // Leagues - remaining
  leagues: {
    search: {
      placeholder: 'Поиск лиг...',
      byName: 'По названию',
      byFormat: 'По формату',
      byLevel: 'По уровню',
    },
  },

  // Common UI elements
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    save: 'Сохранить',
    cancel: 'Отменить',
    delete: 'Удалить',
    edit: 'Редактировать',
    view: 'Просмотреть',
    share: 'Поделиться',
    back: 'Назад',
    next: 'Далее',
    previous: 'Предыдущий',
    finish: 'Завершить',
    close: 'Закрыть',
    confirm: 'Подтвердить',
    yes: 'Да',
    no: 'Нет',
    ok: 'ОК',
    submit: 'Отправить',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировать',
    refresh: 'Обновить',
    retry: 'Повторить',
    more: 'Еще',
    less: 'Меньше',
    all: 'Все',
    none: 'Нет',
    select: 'Выбрать',
    clear: 'Очистить',
    reset: 'Сбросить',
    apply: 'Применить',
    download: 'Скачать',
    upload: 'Загрузить',
    export: 'Экспортировать',
    import: 'Импортировать',
    print: 'Печать',
    copy: 'Копировать',
    paste: 'Вставить',
    cut: 'Вырезать',
    undo: 'Отменить',
    redo: 'Повторить',
    add: 'Добавить',
    remove: 'Удалить',
    update: 'Обновить',
    create: 'Создать',
    change: 'Изменить',
    settings: 'Настройки',
    help: 'Помощь',
    about: 'О программе',
    logout: 'Выйти',
    login: 'Войти',
    signup: 'Зарегистрироваться',
  },

  // Additional comprehensive sections
  notifications: {
    types: {
      info: 'Информация',
      success: 'Успех',
      warning: 'Предупреждение',
      error: 'Ошибка',
    },

    actions: {
      markRead: 'Отметить как прочитанное',
      markUnread: 'Отметить как непрочитанное',
      markAllRead: 'Отметить все как прочитанные',
      clear: 'Очистить',
      clearAll: 'Очистить все',
      settings: 'Настройки уведомлений',
    },

    settings: {
      enable: 'Включить уведомления',
      disable: 'Отключить уведомления',
      sound: 'Звук',
      vibration: 'Вибрация',
      preview: 'Предпросмотр',
    },
  },

  // Settings comprehensive
  settings: {
    account: {
      title: 'Аккаунт',
      profile: 'Профиль',
      privacy: 'Конфиденциальность',
      security: 'Безопасность',
      notifications: 'Уведомления',
      preferences: 'Предпочтения',
    },

    app: {
      title: 'Приложение',
      language: 'Язык',
      theme: 'Тема',
      units: 'Единицы измерения',
      dateFormat: 'Формат даты',
      timeFormat: 'Формат времени',
    },

    privacy: {
      title: 'Конфиденциальность',
      profileVisibility: 'Видимость профиля',
      showLocation: 'Показывать местоположение',
      showOnline: 'Показывать онлайн статус',
      allowMessages: 'Разрешить сообщения',
      allowFriendRequests: 'Разрешить запросы в друзья',
    },

    security: {
      title: 'Безопасность',
      changePassword: 'Изменить пароль',
      twoFactor: 'Двухфакторная аутентификация',
      loginHistory: 'История входов',
      activeSessions: 'Активные сессии',
      blockedUsers: 'Заблокированные пользователи',
    },
  },

  // Error messages comprehensive
  errors: {
    network: 'Ошибка сети. Проверьте подключение к интернету.',
    server: 'Ошибка сервера. Попробуйте позже.',
    notFound: 'Не найдено.',
    unauthorized: 'Неавторизован. Войдите снова.',
    forbidden: 'Доступ запрещен.',
    validation: 'Ошибка валидации. Проверьте данные.',
    timeout: 'Время ожидания истекло. Попробуйте снова.',
    unknown: 'Произошла неизвестная ошибка.',
    tryAgain: 'Попробовать снова',
    contactSupport: 'Связаться с поддержкой',
  },

  // Success messages comprehensive
  success: {
    saved: 'Успешно сохранено',
    deleted: 'Успешно удалено',
    updated: 'Успешно обновлено',
    created: 'Успешно создано',
    sent: 'Успешно отправлено',
    completed: 'Успешно завершено',
  },
};

// Deep merge
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

// Count keys
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

const updatedRu = deepMerge(ru, translations);
const translatedCount = countKeys(translations);

fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2) + '\n', 'utf8');

console.log('✅ Russian translation MEGA batch completed!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);
