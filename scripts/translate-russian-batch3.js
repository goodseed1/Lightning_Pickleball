#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// Batch 3: Comprehensive translations for remaining high-priority sections
const translations = {
  // Types section (77 keys)
  types: {
    matchType: {
      singles: 'Одиночный',
      doubles: 'Парный',
      mixed: 'Смешанный',
    },
    matchFormat: {
      casual: 'Обычный',
      competitive: 'Соревновательный',
      practice: 'Тренировка',
      friendly: 'Дружеский',
    },
    eventType: {
      match: 'Матч',
      tournament: 'Турнир',
      clinic: 'Клиника',
      social: 'Социальное',
      league: 'Лига',
      ladder: 'Лестница',
    },
    userRole: {
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
      guest: 'Гость',
    },
    clubRole: {
      owner: 'Владелец',
      admin: 'Администратор',
      coach: 'Тренер',
      member: 'Участник',
    },
    membershipStatus: {
      active: 'Активный',
      inactive: 'Неактивный',
      suspended: 'Приостановлено',
      expired: 'Истекло',
    },
    paymentStatus: {
      paid: 'Оплачено',
      pending: 'Ожидает',
      failed: 'Не удалось',
      refunded: 'Возвращено',
    },
    notificationType: {
      matchInvite: 'Приглашение на матч',
      friendRequest: 'Запрос в друзья',
      clubInvite: 'Приглашение в клуб',
      message: 'Сообщение',
      system: 'Системное',
    },
    privacyLevel: {
      public: 'Публичный',
      private: 'Приватный',
      friends: 'Друзья',
      club: 'Клуб',
    },
    difficultyLevel: {
      beginner: 'Начинающий',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      expert: 'Эксперт',
    },
    courtType: {
      hard: 'Хард',
      clay: 'Грунт',
      grass: 'Трава',
      carpet: 'Ковер',
      indoor: 'Крытый',
      outdoor: 'Открытый',
    },
    weatherCondition: {
      sunny: 'Солнечно',
      cloudy: 'Облачно',
      rainy: 'Дождь',
      windy: 'Ветрено',
      hot: 'Жарко',
      cold: 'Холодно',
    },
  },

  // Email Login section (73 keys)
  emailLogin: {
    title: 'Вход по email',
    email: 'Email',
    password: 'Пароль',
    login: 'Войти',
    signup: 'Зарегистрироваться',
    forgotPassword: 'Забыли пароль?',
    resetPassword: 'Сбросить пароль',
    sendResetLink: 'Отправить ссылку сброса',
    backToLogin: 'Назад ко входу',

    placeholders: {
      email: 'Введите ваш email',
      password: 'Введите пароль',
      confirmPassword: 'Подтвердите пароль',
      newPassword: 'Новый пароль',
    },

    validation: {
      emailRequired: 'Email обязателен',
      passwordRequired: 'Пароль обязателен',
      invalidEmail: 'Неверный email',
      passwordTooShort: 'Пароль слишком короткий (мин. 6)',
      passwordsDoNotMatch: 'Пароли не совпадают',
      weakPassword: 'Слабый пароль',
    },

    errors: {
      loginFailed: 'Не удалось войти',
      signupFailed: 'Не удалось зарегистрироваться',
      resetFailed: 'Не удалось сбросить пароль',
      invalidCredentials: 'Неверные учетные данные',
      userNotFound: 'Пользователь не найден',
      emailAlreadyExists: 'Email уже существует',
      networkError: 'Ошибка сети',
      serverError: 'Ошибка сервера',
      tooManyAttempts: 'Слишком много попыток',
      accountDisabled: 'Аккаунт отключен',
    },

    success: {
      loginSuccess: 'Вход выполнен',
      signupSuccess: 'Регистрация успешна',
      resetEmailSent: 'Email со сбросом отправлен',
      passwordChanged: 'Пароль изменен',
      accountCreated: 'Аккаунт создан',
    },

    social: {
      continueWith: 'Продолжить с',
      google: 'Google',
      facebook: 'Facebook',
      apple: 'Apple',
      or: 'или',
    },

    terms: {
      agreeToTerms: 'Я согласен с',
      termsOfService: 'Условиями использования',
      and: 'и',
      privacyPolicy: 'Политикой конфиденциальности',
      bySigningUp: 'Регистрируясь, вы соглашаетесь с нашими',
    },

    links: {
      noAccount: 'Нет аккаунта?',
      haveAccount: 'Уже есть аккаунт?',
      createOne: 'Создать',
      signIn: 'Войти',
    },
  },

  // Club section (69 keys)
  club: {
    myClubs: 'Мои клубы',
    allClubs: 'Все клубы',
    nearbyClubs: 'Клубы рядом',
    featuredClubs: 'Рекомендуемые клубы',

    details: {
      overview: 'Обзор',
      members: 'Участники',
      events: 'События',
      leagues: 'Лиги',
      tournaments: 'Турниры',
      facilities: 'Удобства',
      policies: 'Правила',
      photos: 'Фотографии',
    },

    info: {
      name: 'Название',
      description: 'Описание',
      location: 'Местоположение',
      founded: 'Основан',
      memberCount: 'Участников',
      courtCount: 'Кортов',
      website: 'Веб-сайт',
      phone: 'Телефон',
      email: 'Email',
      hours: 'Часы работы',
      amenities: 'Удобства',
    },

    membership: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      membershipFee: 'Членский взнос',
      renewMembership: 'Продлить членство',
      cancelMembership: 'Отменить членство',
      memberSince: 'Участник с',
      status: 'Статус',
      tier: 'Уровень',
      benefits: 'Преимущества',
    },

    roles: {
      owner: 'Владелец',
      admin: 'Администратор',
      coach: 'Тренер',
      member: 'Участник',
      pending: 'Ожидает',
      invited: 'Приглашен',
    },

    actions: {
      create: 'Создать клуб',
      edit: 'Редактировать клуб',
      delete: 'Удалить клуб',
      invite: 'Пригласить участников',
      manage: 'Управлять',
      viewDetails: 'Просмотреть детали',
      contactClub: 'Связаться с клубом',
    },

    filters: {
      all: 'Все',
      my: 'Мои',
      nearby: 'Рядом',
      featured: 'Рекомендуемые',
      byDistance: 'По расстоянию',
      bySize: 'По размеру',
      byActivity: 'По активности',
    },
  },

  // My Activities section (63 keys)
  myActivities: {
    title: 'Мои активности',
    all: 'Все',
    upcoming: 'Предстоящие',
    past: 'Прошедшие',
    cancelled: 'Отмененные',

    types: {
      matches: 'Матчи',
      events: 'События',
      tournaments: 'Турниры',
      practices: 'Тренировки',
      leagues: 'Лиги',
    },

    filters: {
      thisWeek: 'На этой неделе',
      thisMonth: 'В этом месяце',
      last30Days: 'Последние 30 дней',
      custom: 'Настроить',
      byType: 'По типу',
      byStatus: 'По статусу',
    },

    stats: {
      totalActivities: 'Всего активностей',
      thisMonth: 'В этом месяце',
      thisYear: 'В этом году',
      hoursPlayed: 'Часов сыграно',
      matchesPlayed: 'Матчей сыграно',
      winRate: 'Процент побед',
    },

    details: {
      date: 'Дата',
      time: 'Время',
      duration: 'Длительность',
      location: 'Место',
      participants: 'Участники',
      result: 'Результат',
      score: 'Счет',
      notes: 'Заметки',
    },

    actions: {
      viewDetails: 'Просмотреть детали',
      editActivity: 'Редактировать',
      deleteActivity: 'Удалить',
      shareActivity: 'Поделиться',
      addNotes: 'Добавить заметки',
      viewStats: 'Просмотреть статистику',
    },

    emptyStates: {
      noActivities: 'Нет активностей',
      noUpcoming: 'Нет предстоящих активностей',
      noPast: 'Нет прошедших активностей',
      startPlaying: 'Начните играть, чтобы отслеживать активности',
    },
  },

  // Matches section (57 keys)
  matches: {
    title: 'Матчи',
    myMatches: 'Мои матчи',
    findMatch: 'Найти матч',
    createMatch: 'Создать матч',

    status: {
      scheduled: 'Запланирован',
      live: 'Идет сейчас',
      completed: 'Завершен',
      cancelled: 'Отменен',
      postponed: 'Отложен',
    },

    filters: {
      all: 'Все',
      singles: 'Одиночные',
      doubles: 'Парные',
      upcoming: 'Предстоящие',
      completed: 'Завершенные',
      today: 'Сегодня',
      thisWeek: 'На этой неделе',
    },

    details: {
      date: 'Дата',
      time: 'Время',
      location: 'Место',
      court: 'Корт',
      format: 'Формат',
      duration: 'Длительность',
      players: 'Игроки',
      score: 'Счет',
      winner: 'Победитель',
    },

    actions: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      confirm: 'Подтвердить',
      cancel: 'Отменить',
      reschedule: 'Перенести',
      enterScore: 'Ввести счет',
      viewDetails: 'Просмотреть детали',
      invitePlayers: 'Пригласить игроков',
    },

    notifications: {
      matchCreated: 'Матч создан',
      matchUpdated: 'Матч обновлен',
      matchCancelled: 'Матч отменен',
      playerJoined: 'Игрок присоединился',
      playerLeft: 'Игрок покинул',
      scoreEntered: 'Счет введен',
      matchStartingSoon: 'Матч скоро начнется',
      matchCompleted: 'Матч завершен',
    },

    errors: {
      createFailed: 'Не удалось создать матч',
      joinFailed: 'Не удалось присоединиться',
      cancelFailed: 'Не удалось отменить',
      scoreFailed: 'Не удалось ввести счет',
      matchFull: 'Матч заполнен',
      alreadyJoined: 'Уже присоединились',
    },
  },

  // Profile section (49 keys)
  profile: {
    title: 'Профиль',
    myProfile: 'Мой профиль',
    editProfile: 'Редактировать профиль',
    viewProfile: 'Просмотреть профиль',

    sections: {
      overview: 'Обзор',
      stats: 'Статистика',
      matches: 'Матчи',
      achievements: 'Достижения',
      friends: 'Друзья',
      clubs: 'Клубы',
      settings: 'Настройки',
    },

    info: {
      name: 'Имя',
      username: 'Имя пользователя',
      email: 'Email',
      phone: 'Телефон',
      location: 'Местоположение',
      bio: 'О себе',
      playingStyle: 'Стиль игры',
      experience: 'Опыт',
      availability: 'Доступность',
      preferredCourts: 'Предпочитаемые корты',
    },

    stats: {
      ranking: 'Рейтинг',
      eloRating: 'ELO рейтинг',
      matchesPlayed: 'Матчей сыграно',
      matchesWon: 'Матчей выиграно',
      winRate: 'Процент побед',
      currentStreak: 'Текущая серия',
      bestStreak: 'Лучшая серия',
      totalHours: 'Всего часов',
    },

    actions: {
      addFriend: 'Добавить в друзья',
      removeFriend: 'Удалить из друзей',
      sendMessage: 'Отправить сообщение',
      inviteToMatch: 'Пригласить на матч',
      block: 'Заблокировать',
      unblock: 'Разблокировать',
      report: 'Пожаловаться',
      share: 'Поделиться',
    },

    privacy: {
      public: 'Публичный',
      private: 'Приватный',
      friendsOnly: 'Только друзья',
      showStats: 'Показывать статистику',
      showMatches: 'Показывать матчи',
      showLocation: 'Показывать местоположение',
    },
  },

  // Discover section (49 keys)
  discover: {
    title: 'Обзор',
    explore: 'Исследовать',
    trending: 'В тренде',
    recommended: 'Рекомендуемое',
    nearby: 'Рядом',

    categories: {
      players: 'Игроки',
      clubs: 'Клубы',
      events: 'События',
      matches: 'Матчи',
      tournaments: 'Турниры',
      coaches: 'Тренеры',
      courts: 'Корты',
    },

    filters: {
      all: 'Все',
      distance: 'Расстояние',
      skillLevel: 'Уровень',
      availability: 'Доступность',
      rating: 'Рейтинг',
      recentlyActive: 'Недавно активные',
    },

    search: {
      placeholder: 'Поиск игроков, клубов, событий...',
      results: 'Результаты поиска',
      noResults: 'Нет результатов',
      tryDifferent: 'Попробуйте другой запрос',
      recentSearches: 'Недавние поиски',
      clearHistory: 'Очистить историю',
    },

    suggestions: {
      forYou: 'Для вас',
      basedOnLocation: 'Рядом с вами',
      basedOnSkill: 'Вашего уровня',
      basedOnActivity: 'Похожие интересы',
      newMembers: 'Новые участники',
      activePlayers: 'Активные игроки',
    },

    actions: {
      viewAll: 'Посмотреть все',
      viewMore: 'Посмотреть еще',
      refresh: 'Обновить',
      filter: 'Фильтр',
      sort: 'Сортировать',
    },

    emptyStates: {
      noPlayers: 'Игроки не найдены',
      noClubs: 'Клубы не найдены',
      noEvents: 'События не найдены',
      noMatches: 'Матчи не найдены',
      checkBackLater: 'Проверьте позже',
    },
  },

  // Additional Services
  services: {
    map: {
      error: 'Ошибка',
      cannotOpenApp: 'Невозможно открыть {{appName}}.',
      appNotInstalled: '{{appName}} не установлен',
      getDirections: 'Получить направления',
      openInMaps: 'Открыть в картах',
      viewOnMap: 'Просмотреть на карте',
      distance: 'Расстояние',
      duration: 'Время в пути',
      walkingDirections: 'Пешком',
      drivingDirections: 'На машине',
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

// Apply translations
const updatedRu = deepMerge(ru, translations);
const translatedCount = countKeys(translations);

// Write updated file
fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2) + '\n', 'utf8');

console.log('✅ Russian translation batch 3 completed!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);
