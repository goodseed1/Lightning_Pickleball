#!/usr/bin/env node
/**
 * Round 3: Translate ALL remaining Russian keys where ru.json === en.json
 * Focus on top sections: services, duesManagement, emailLogin, club, createEvent
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const RU_PATH = path.join(LOCALES_DIR, 'ru.json');

// Load JSON files
const enJson = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ruJson = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

// Deep merge function
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Find untranslated keys
function findUntranslatedKeys(enObj, ruObj, path = '') {
  const untranslated = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const ruValue = ruObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      untranslated.push(...findUntranslatedKeys(enValue, ruValue || {}, currentPath));
    } else if (typeof enValue === 'string') {
      // Check if Russian value is missing or same as English
      if (!ruValue || ruValue === enValue) {
        untranslated.push({ path: currentPath, en: enValue });
      }
    }
  }

  return untranslated;
}

// Russian translations for ALL remaining keys
const russianTranslations = {
  // ============================================
  // SERVICES SECTION (85 keys)
  // ============================================
  services: {
    title: 'Услуги',
    description: 'Премиум услуги для расширения вашей теннисной сети',
    premium: {
      title: 'Премиум услуги',
      subtitle: 'Расширенные функции для серьезных игроков',
      features: {
        unlimitedMatches: 'Безлимитные матчи',
        prioritySupport: 'Приоритетная поддержка',
        advancedAnalytics: 'Расширенная аналитика',
        customBranding: 'Индивидуальный брендинг',
      },
    },
    coaching: {
      title: 'Тренерские услуги',
      subtitle: 'Персональные тренировки с сертифицированными тренерами',
      features: {
        personalTraining: 'Персональные тренировки',
        groupLessons: 'Групповые занятия',
        videoAnalysis: 'Видеоанализ',
        customPlans: 'Индивидуальные планы',
      },
    },
    clubManagement: {
      title: 'Управление клубом',
      subtitle: 'Инструменты для теннисных клубов',
      features: {
        memberManagement: 'Управление участниками',
        eventScheduling: 'Планирование мероприятий',
        courtBooking: 'Бронирование кортов',
        financialTracking: 'Финансовый учет',
      },
    },
    subscribe: 'Подписаться',
    learnMore: 'Узнать больше',
    monthly: 'В месяц',
    yearly: 'В год',
    save: 'Сэкономить',
    mostPopular: 'Самый популярный',
    freeTrial: 'Бесплатная пробная версия',
    cancelAnytime: 'Отмените в любое время',
    startFreeTrial: 'Начать бесплатную пробную версию',
    choosePlan: 'Выбрать план',
    comparePlans: 'Сравнить планы',
    faq: 'Часто задаваемые вопросы',
    contactSales: 'Связаться с отделом продаж',
    termsAndConditions: 'Условия и положения',
    privacyPolicy: 'Политика конфиденциальности',
  },

  // ============================================
  // DUES MANAGEMENT SECTION (66 keys)
  // ============================================
  duesManagement: {
    title: 'Управление взносами',
    overview: 'Обзор',
    payments: 'Платежи',
    settings: 'Настройки',
    totalCollected: 'Всего собрано',
    pendingPayments: 'Ожидающие платежи',
    overduePayments: 'Просроченные платежи',
    activeMembers: 'Активные участники',
    paymentHistory: 'История платежей',
    recentTransactions: 'Последние транзакции',
    viewAll: 'Показать все',
    exportData: 'Экспорт данных',
    sendReminder: 'Отправить напоминание',
    sendReminders: 'Отправить напоминания',
    markAsPaid: 'Отметить как оплачено',
    refund: 'Возврат',
    memberName: 'Имя участника',
    amount: 'Сумма',
    dueDate: 'Срок оплаты',
    status: 'Статус',
    actions: 'Действия',
    paid: 'Оплачено',
    pending: 'В ожидании',
    overdue: 'Просрочено',
    partial: 'Частично',
    search: 'Поиск участников...',
    filter: 'Фильтр',
    sortBy: 'Сортировать по',
    date: 'Дата',
    name: 'Имя',
    amountDue: 'Сумма к оплате',
    ascending: 'По возрастанию',
    descending: 'По убыванию',
    duesSettings: {
      title: 'Настройки взносов',
      monthlyDues: 'Ежемесячные взносы',
      dueDay: 'День оплаты',
      gracePeriod: 'Льготный период',
      lateFee: 'Штраф за просрочку',
      autoReminders: 'Автоматические напоминания',
      reminderSchedule: 'График напоминаний',
      daysBefore: 'За ... дней до',
      daysAfter: 'После ... дней',
      paymentMethods: 'Способы оплаты',
      acceptCash: 'Принимать наличные',
      acceptCard: 'Принимать карты',
      acceptCheck: 'Принимать чеки',
      acceptOnline: 'Онлайн-платежи',
      notes: 'Примечания',
      saveSettings: 'Сохранить настройки',
      cancel: 'Отмена',
    },
    notifications: {
      reminderSent: 'Напоминание отправлено',
      markedAsPaid: 'Отмечено как оплачено',
      refundProcessed: 'Возврат обработан',
      settingsSaved: 'Настройки сохранены',
      exportComplete: 'Экспорт завершен',
      error: 'Произошла ошибка',
    },
    empty: {
      title: 'Нет данных о платежах',
      description: 'Платежи будут отображаться здесь, когда участники начнут вносить взносы',
      action: 'Настроить взносы',
    },
  },

  // ============================================
  // EMAIL LOGIN SECTION (62 keys)
  // ============================================
  emailLogin: {
    title: 'Вход по Email',
    subtitle: 'Войдите, используя свой email и пароль',
    emailPlaceholder: 'Введите ваш email',
    passwordPlaceholder: 'Введите ваш пароль',
    forgotPassword: 'Забыли пароль?',
    signIn: 'Войти',
    signUp: 'Зарегистрироваться',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    createAccount: 'Создать аккаунт',
    resetPassword: 'Сбросить пароль',
    resetPasswordSubtitle: 'Мы отправим вам ссылку для сброса пароля',
    sendResetLink: 'Отправить ссылку',
    backToLogin: 'Вернуться ко входу',
    checkEmail: 'Проверьте вашу почту',
    resetLinkSent: 'Мы отправили вам ссылку для сброса пароля',
    errors: {
      invalidEmail: 'Неверный формат email',
      emailRequired: 'Email обязателен',
      passwordRequired: 'Пароль обязателен',
      passwordTooShort: 'Пароль должен содержать минимум 6 символов',
      userNotFound: 'Пользователь не найден',
      wrongPassword: 'Неверный пароль',
      emailAlreadyInUse: 'Email уже используется',
      weakPassword: 'Пароль слишком слабый',
      tooManyRequests: 'Слишком много попыток. Попробуйте позже',
      networkError: 'Ошибка сети. Проверьте соединение',
      unknownError: 'Произошла неизвестная ошибка',
    },
    validation: {
      emailFormat: 'Введите корректный email адрес',
      passwordLength: 'Пароль должен содержать минимум {min} символов',
      passwordMatch: 'Пароли не совпадают',
      requiredField: 'Это поле обязательно',
    },
    signup: {
      title: 'Создать аккаунт',
      subtitle: 'Присоединяйтесь к Lightning Pickleball',
      namePlaceholder: 'Введите ваше имя',
      confirmPasswordPlaceholder: 'Подтвердите пароль',
      termsAgreement: 'Я согласен с',
      termsOfService: 'Условиями использования',
      and: 'и',
      privacyPolicy: 'Политикой конфиденциальности',
      createAccount: 'Создать аккаунт',
      creating: 'Создание...',
    },
    success: {
      accountCreated: 'Аккаунт успешно создан',
      welcomeBack: 'С возвращением!',
      resetLinkSent: 'Ссылка для сброса пароля отправлена',
    },
  },

  // ============================================
  // CLUB SECTION (58 keys)
  // ============================================
  club: {
    title: 'Клуб',
    overview: 'Обзор',
    members: 'Участники',
    events: 'Мероприятия',
    settings: 'Настройки',
    about: 'О клубе',
    join: 'Присоединиться',
    joined: 'Участник',
    leave: 'Покинуть',
    edit: 'Редактировать',
    delete: 'Удалить',
    share: 'Поделиться',
    invite: 'Пригласить',
    totalMembers: 'Всего участников',
    activeMembers: 'Активные участники',
    upcomingEvents: 'Предстоящие мероприятия',
    recentActivity: 'Последняя активность',
    description: 'Описание',
    location: 'Местоположение',
    established: 'Основан',
    website: 'Веб-сайт',
    contact: 'Контакты',
    memberList: {
      title: 'Список участников',
      search: 'Поиск участников...',
      filter: 'Фильтр',
      sortBy: 'Сортировать по',
      name: 'Имя',
      joinDate: 'Дата вступления',
      skillLevel: 'Уровень навыка',
      role: 'Роль',
      admin: 'Администратор',
      member: 'Участник',
      pending: 'В ожидании',
      viewProfile: 'Профиль',
      sendMessage: 'Сообщение',
      removeFromClub: 'Удалить из клуба',
      makeAdmin: 'Сделать администратором',
      removeAdmin: 'Снять администратора',
    },
    eventList: {
      title: 'Мероприятия клуба',
      upcoming: 'Предстоящие',
      past: 'Прошедшие',
      createEvent: 'Создать мероприятие',
      noEvents: 'Нет мероприятий',
      noUpcoming: 'Нет предстоящих мероприятий',
      noPast: 'Нет прошедших мероприятий',
    },
    settings: {
      title: 'Настройки клуба',
      general: 'Общее',
      privacy: 'Приватность',
      notifications: 'Уведомления',
      danger: 'Опасная зона',
    },
  },

  // ============================================
  // CREATE EVENT SECTION (54 keys)
  // ============================================
  createEvent: {
    title: 'Создать мероприятие',
    editTitle: 'Редактировать мероприятие',
    basicInfo: 'Основная информация',
    eventDetails: 'Детали мероприятия',
    participants: 'Участники',
    advanced: 'Дополнительно',
    eventName: 'Название мероприятия',
    eventNamePlaceholder: 'Введите название мероприятия',
    eventType: 'Тип мероприятия',
    tournament: 'Турнир',
    social: 'Социальное',
    training: 'Тренировка',
    league: 'Лига',
    other: 'Другое',
    date: 'Дата',
    time: 'Время',
    startTime: 'Время начала',
    endTime: 'Время окончания',
    duration: 'Продолжительность',
    location: 'Местоположение',
    venue: 'Место проведения',
    address: 'Адрес',
    court: 'Корт',
    description: 'Описание',
    descriptionPlaceholder: 'Опишите ваше мероприятие...',
    maxParticipants: 'Максимум участников',
    unlimited: 'Без ограничений',
    registrationDeadline: 'Срок регистрации',
    skillLevel: 'Требуемый уровень навыка',
    allLevels: 'Все уровни',
    beginner: 'Начинающий',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
    expert: 'Эксперт',
    visibility: 'Видимость',
    public: 'Публичное',
    private: 'Приватное',
    clubOnly: 'Только клуб',
    fee: 'Стоимость',
    free: 'Бесплатно',
    paid: 'Платное',
    amount: 'Сумма',
    recurringEvent: 'Повторяющееся мероприятие',
    recurrence: 'Повторение',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    endsOn: 'Заканчивается',
    never: 'Никогда',
    create: 'Создать мероприятие',
    save: 'Сохранить изменения',
    cancel: 'Отмена',
    creating: 'Создание...',
    saving: 'Сохранение...',
  },

  // ============================================
  // MATCH SECTION (remaining keys)
  // ============================================
  match: {
    findPartner: 'Найти партнера',
    requestMatch: 'Запросить матч',
    acceptRequest: 'Принять запрос',
    declineRequest: 'Отклонить запрос',
    cancelMatch: 'Отменить матч',
    rescheduleMatch: 'Перенести матч',
    confirmMatch: 'Подтвердить матч',
    matchConfirmed: 'Матч подтвержден',
    matchCancelled: 'Матч отменен',
    matchCompleted: 'Матч завершен',
    enterScore: 'Ввести счет',
    confirmScore: 'Подтвердить счет',
    disputeScore: 'Оспорить счет',
    waitingForOpponent: 'Ожидание оппонента',
    opponentConfirmed: 'Оппонент подтвердил',
    bothConfirmed: 'Обе стороны подтвердили',
    scoreSubmitted: 'Счет отправлен',
    matchDetails: 'Детали матча',
    matchHistory: 'История матчей',
    upcomingMatches: 'Предстоящие матчи',
    pastMatches: 'Прошедшие матчи',
    noMatches: 'Нет матчей',
    createMatch: 'Создать матч',
    singles: 'Одиночный разряд',
    doubles: 'Парный разряд',
    mixed: 'Микст',
    competitive: 'Соревновательный',
    casual: 'Дружеский',
    practice: 'Тренировочный',
    matchFormat: 'Формат матча',
    bestOf3: 'До 2 побед',
    bestOf5: 'До 3 побед',
    tiebreak: 'Тай-брейк',
    proSet: 'Про-сет',
    scoring: 'Подсчет очков',
    traditional: 'Традиционный',
    noAd: 'Без преимущества',
    surface: 'Покрытие',
    hard: 'Хард',
    clay: 'Грунт',
    grass: 'Трава',
    carpet: 'Ковер',
    indoor: 'В помещении',
    outdoor: 'На открытом воздухе',
  },

  // ============================================
  // PROFILE SECTION (remaining keys)
  // ============================================
  profile: {
    editProfile: 'Редактировать профиль',
    viewProfile: 'Просмотр профиля',
    personalInfo: 'Личная информация',
    pickleballInfo: 'Теннисная информация',
    preferences: 'Предпочтения',
    privacy: 'Приватность',
    firstName: 'Имя',
    lastName: 'Фамилия',
    displayName: 'Отображаемое имя',
    bio: 'О себе',
    bioPlaceholder: 'Расскажите о себе...',
    dateOfBirth: 'Дата рождения',
    gender: 'Пол',
    male: 'Мужской',
    female: 'Женский',
    other: 'Другой',
    preferNotToSay: 'Предпочитаю не говорить',
    city: 'Город',
    state: 'Штат',
    country: 'Страна',
    phoneNumber: 'Номер телефона',
    skillLevel: 'Уровень навыка',
    playingStyle: 'Стиль игры',
    dominantHand: 'Ведущая рука',
    rightHanded: 'Правша',
    leftHanded: 'Левша',
    backhand: 'Бэкхенд',
    oneHanded: 'Одной рукой',
    twoHanded: 'Двумя руками',
    favoriteShot: 'Любимый удар',
    forehand: 'Форхенд',
    serve: 'Подача',
    volley: 'Удар с лёта',
    availability: 'Доступность',
    preferredDays: 'Предпочитаемые дни',
    preferredTimes: 'Предпочитаемое время',
    morning: 'Утро',
    afternoon: 'День',
    evening: 'Вечер',
    anyTime: 'Любое время',
    profileVisibility: 'Видимость профиля',
    showEmail: 'Показывать email',
    showPhone: 'Показывать телефон',
    showLocation: 'Показывать местоположение',
    showStats: 'Показывать статистику',
    saveChanges: 'Сохранить изменения',
    discardChanges: 'Отменить изменения',
    changesSaved: 'Изменения сохранены',
    profileUpdated: 'Профиль обновлен',
  },

  // ============================================
  // NOTIFICATIONS SECTION (remaining keys)
  // ============================================
  notifications: {
    title: 'Уведомления',
    markAllAsRead: 'Отметить все как прочитанные',
    clearAll: 'Очистить все',
    settings: 'Настройки уведомлений',
    noNotifications: 'Нет уведомлений',
    noNewNotifications: 'Нет новых уведомлений',
    matchRequest: 'Запрос матча',
    matchConfirmation: 'Подтверждение матча',
    matchReminder: 'Напоминание о матче',
    matchCancellation: 'Отмена матча',
    scoreUpdate: 'Обновление счета',
    friendRequest: 'Запрос дружбы',
    clubInvite: 'Приглашение в клуб',
    eventInvite: 'Приглашение на мероприятие',
    eventReminder: 'Напоминание о мероприятии',
    newFollower: 'Новый подписчик',
    achievementUnlocked: 'Достижение разблокировано',
    rankingUpdate: 'Обновление рейтинга',
    systemMessage: 'Системное сообщение',
    pushNotifications: 'Push-уведомления',
    emailNotifications: 'Email-уведомления',
    smsNotifications: 'SMS-уведомления',
    matchNotifications: 'Уведомления о матчах',
    socialNotifications: 'Социальные уведомления',
    clubNotifications: 'Уведомления клуба',
    eventNotifications: 'Уведомления о мероприятиях',
    enable: 'Включить',
    disable: 'Выключить',
    sound: 'Звук',
    vibration: 'Вибрация',
    preview: 'Предпросмотр',
  },

  // ============================================
  // SETTINGS SECTION (remaining keys)
  // ============================================
  settings: {
    title: 'Настройки',
    account: 'Аккаунт',
    profile: 'Профиль',
    notifications: 'Уведомления',
    privacy: 'Приватность',
    security: 'Безопасность',
    language: 'Язык',
    theme: 'Тема',
    about: 'О приложении',
    help: 'Помощь',
    feedback: 'Обратная связь',
    logout: 'Выход',
    accountSettings: {
      title: 'Настройки аккаунта',
      email: 'Email',
      changeEmail: 'Изменить email',
      password: 'Пароль',
      changePassword: 'Изменить пароль',
      phoneNumber: 'Номер телефона',
      verifyPhone: 'Подтвердить телефон',
      deleteAccount: 'Удалить аккаунт',
      deactivateAccount: 'Деактивировать аккаунт',
    },
    privacySettings: {
      title: 'Настройки приватности',
      profileVisibility: 'Видимость профиля',
      everyone: 'Все',
      friends: 'Друзья',
      nobody: 'Никто',
      showOnlineStatus: 'Показывать онлайн-статус',
      showLastSeen: 'Показывать последний визит',
      showMatchHistory: 'Показывать историю матчей',
      allowMessages: 'Разрешить сообщения',
      allowMatchRequests: 'Разрешить запросы матчей',
      blockList: 'Список блокировки',
    },
    securitySettings: {
      title: 'Настройки безопасности',
      twoFactorAuth: 'Двухфакторная аутентификация',
      enable2FA: 'Включить 2FA',
      loginHistory: 'История входов',
      connectedDevices: 'Подключенные устройства',
      activeSessions: 'Активные сессии',
      endAllSessions: 'Завершить все сессии',
    },
    themeSettings: {
      title: 'Настройки темы',
      light: 'Светлая',
      dark: 'Темная',
      auto: 'Автоматически',
      systemDefault: 'Системная',
    },
    languageSettings: {
      title: 'Язык',
      english: 'English',
      korean: '한국어',
      russian: 'Русский',
      selectLanguage: 'Выберите язык',
    },
    aboutApp: {
      title: 'О Lightning Pickleball',
      version: 'Версия',
      build: 'Сборка',
      termsOfService: 'Условия использования',
      privacyPolicy: 'Политика конфиденциальности',
      licenses: 'Лицензии',
      credits: 'Благодарности',
    },
  },

  // ============================================
  // SEARCH SECTION (remaining keys)
  // ============================================
  search: {
    title: 'Поиск',
    searchPlaceholder: 'Поиск...',
    recentSearches: 'Недавние поиски',
    clearHistory: 'Очистить историю',
    noResults: 'Результатов не найдено',
    searching: 'Поиск...',
    filters: 'Фильтры',
    applyFilters: 'Применить фильтры',
    clearFilters: 'Очистить фильтры',
    sortBy: 'Сортировать по',
    relevance: 'По релевантности',
    date: 'По дате',
    name: 'По имени',
    rating: 'По рейтингу',
    distance: 'По расстоянию',
    players: 'Игроки',
    clubs: 'Клубы',
    events: 'Мероприятия',
    matches: 'Матчи',
    all: 'Все',
  },

  // ============================================
  // CHAT/MESSAGES SECTION (remaining keys)
  // ============================================
  chat: {
    title: 'Чаты',
    newMessage: 'Новое сообщение',
    startConversation: 'Начать беседу',
    noMessages: 'Нет сообщений',
    typeMessage: 'Введите сообщение...',
    send: 'Отправить',
    delete: 'Удалить',
    edit: 'Редактировать',
    copy: 'Копировать',
    forward: 'Переслать',
    reply: 'Ответить',
    delivered: 'Доставлено',
    read: 'Прочитано',
    online: 'Онлайн',
    offline: 'Не в сети',
    typing: 'Печатает...',
    lastSeen: 'Был(а) в сети',
    attachFile: 'Прикрепить файл',
    takePhoto: 'Сделать фото',
    choosePhoto: 'Выбрать фото',
    recordVoice: 'Записать голос',
    location: 'Местоположение',
    contact: 'Контакт',
    deleteConversation: 'Удалить беседу',
    muteConversation: 'Отключить звук',
    blockUser: 'Заблокировать пользователя',
    reportUser: 'Пожаловаться на пользователя',
  },

  // ============================================
  // STATISTICS/ANALYTICS SECTION (remaining keys)
  // ============================================
  stats: {
    title: 'Статистика',
    overview: 'Обзор',
    performance: 'Производительность',
    progress: 'Прогресс',
    trends: 'Тренды',
    matchesPlayed: 'Сыграно матчей',
    matchesWon: 'Выиграно матчей',
    matchesLost: 'Проиграно матчей',
    winRate: 'Процент побед',
    currentStreak: 'Текущая серия',
    longestStreak: 'Лучшая серия',
    totalHours: 'Всего часов',
    averageScore: 'Средний счет',
    bestWin: 'Лучшая победа',
    toughestLoss: 'Худшее поражение',
    recentForm: 'Последняя форма',
    monthlyStats: 'Статистика за месяц',
    yearlyStats: 'Статистика за год',
    allTimeStats: 'Статистика за все время',
    comparedToLastMonth: 'По сравнению с прошлым месяцем',
    improvementTips: 'Советы по улучшению',
    strengths: 'Сильные стороны',
    weaknesses: 'Слабые стороны',
    areasToImprove: 'Области для улучшения',
  },

  // ============================================
  // ACHIEVEMENTS/TROPHIES SECTION (remaining keys)
  // ============================================
  achievements: {
    title: 'Достижения',
    trophies: 'Трофеи',
    badges: 'Значки',
    milestones: 'Вехи',
    unlocked: 'Разблокировано',
    locked: 'Заблокировано',
    progress: 'Прогресс',
    viewAll: 'Показать все',
    recent: 'Недавние',
    share: 'Поделиться',
    firstMatch: 'Первый матч',
    firstWin: 'Первая победа',
    winStreak: 'Серия побед',
    tournament: 'Турнир',
    socialButterfly: 'Социальная бабочка',
    clubFounder: 'Основатель клуба',
    eventOrganizer: 'Организатор мероприятий',
    mentor: 'Наставник',
    veteran: 'Ветеран',
    champion: 'Чемпион',
    description: 'Описание',
    earnedOn: 'Получено',
    shareAchievement: 'Поделиться достижением',
    congratulations: 'Поздравляем!',
  },
};

// Apply translations
console.log('\n🔍 Finding untranslated keys...');
const untranslatedKeys = findUntranslatedKeys(enJson, ruJson);
console.log(`\n📊 Found ${untranslatedKeys.length} untranslated keys\n`);

// Apply translations using deepMerge
console.log('🔄 Applying translations...');
const updatedRuJson = deepMerge(ruJson, russianTranslations);

// Write updated file
fs.writeFileSync(RU_PATH, JSON.stringify(updatedRuJson, null, 2) + '\n', 'utf8');

console.log('\n✅ Translation complete!');
console.log(`📁 Updated: ${RU_PATH}`);

// Count remaining untranslated
const remainingUntranslated = findUntranslatedKeys(enJson, updatedRuJson);
console.log(`\n📊 Remaining untranslated keys: ${remainingUntranslated.length}`);

if (remainingUntranslated.length > 0) {
  console.log('\n🔍 Top 10 remaining sections:');
  const sectionCounts = {};
  remainingUntranslated.forEach(item => {
    const section = item.path.split('.')[0];
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
  });

  Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([section, count]) => {
      console.log(`  - ${section}: ${count} keys`);
    });
}
