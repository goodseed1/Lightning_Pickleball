#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// BATCH 3 - CONTINUE WITH REMAINING KEYS
const translations = {
  regularMeetup: {
    upcomingTab: '🗓️ Предстоящие',
    pastTab: '🗂️ Прошедшие',
    newMeetup: 'Новая встреча',
    edit: '✏️ Редактировать',
    copy: '🔁 Копировать',
    deleteAction: '🗑️ Удалить',
    deleteConfirmation: 'Вы уверены, что хотите удалить эту встречу? Это действие нельзя отменить.',
    deleteError: 'Произошла ошибка при удалении встречи.',
    createSuccess: 'Встреча успешно создана',
    updateSuccess: 'Встреча успешно обновлена',
    deleteSuccess: 'Встреча успешно удалена',
    loadingError: 'Ошибка загрузки встречи',
    noMeetupsYet: 'Встреч пока нет',
    createFirstMeetup: 'Создайте свою первую встречу',
    meetupDetails: 'Детали встречи',
    participants: 'Участники',
    location: 'Место',
    time: 'Время',
    duration: 'Длительность',
    notes: 'Примечания',
  },

  activityTab: {
    eventNotFound: 'Событие не найдено.',
    partnerInviteError: 'Произошла ошибка при приглашении партнера.',
    cancelRequest: 'Отменить запрос',
    cancelRequestConfirm: 'Вы уверены, что хотите отменить этот запрос?',
    requestCancelled: 'Запрос отменен.',
    cancelError: 'Произошла ошибка при отмене запроса.',
    chatRoomNotice: 'Уведомление чата',
    chatAccessDenied:
      'У вас нет разрешения на доступ к этому чату. Пожалуйста, подайте заявку на событие и получите одобрение.',
    noActivitiesFound: 'Активности не найдены',
    refreshActivities: 'Обновить активности',
    activityDetails: 'Детали активности',
    markAsRead: 'Отметить как прочитанное',
    deleteActivity: 'Удалить активность',
    shareActivity: 'Поделиться активностью',
    activityFeed: 'Лента активности',
    loadingActivities: 'Загрузка активностей...',
    allCaughtUp: 'Все просмотрено',
    newActivity: 'Новая активность',
    activitySettings: 'Настройки активности',
    muteActivity: 'Отключить уведомления',
  },

  manageLeagueParticipants: {
    loadingMatches: 'Загрузка матчей...',
    approveMatchResult: 'Одобрить результат матча',
    confirmApproveMatch: 'Вы уверены, что хотите одобрить этот результат матча?',
    matchApproved: 'Результат матча одобрен',
    matchRejected: 'Результат матча отклонен',
    approvalError: 'Ошибка одобрения',
    participantAdded: 'Участник добавлен',
    participantRemoved: 'Участник удален',
    statusUpdated: 'Статус обновлен',
    loadingParticipants: 'Загрузка участников...',
    noParticipants: 'Участников нет',
    addParticipant: 'Добавить участника',
    filterParticipants: 'Фильтр участников',
    sortParticipants: 'Сортировка участников',
    exportParticipants: 'Экспорт участников',
    participantStats: 'Статистика участника',
    participantHistory: 'История участника',
    contactParticipant: 'Связаться с участником',
    viewProfile: 'Просмотр профиля',
    editParticipant: 'Редактировать участника',
  },

  clubOverviewScreen: {
    membershipTier: 'Уровень членства',
    basicMember: 'Базовый участник',
    premiumMember: 'Премиум участник',
    vipMember: 'VIP участник',
    lifetimeMember: 'Пожизненный участник',
    memberSince: 'Участник с',
    renewalDate: 'Дата продления',
    membershipExpired: 'Членство истекло',
    renewMembership: 'Продлить членство',
    upgradeMembership: 'Улучшить членство',
    clubFacilities: 'Удобства клуба',
    operatingHours: 'Часы работы',
    contactInformation: 'Контактная информация',
    clubPolicies: 'Политики клуба',
    memberBenefits: 'Преимущества участника',
    clubHistory: 'История клуба',
    clubGallery: 'Галерея клуба',
    clubReviews: 'Отзывы о клубе',
    memberDirectory: 'Список участников',
    clubCalendar: 'Календарь клуба',
    reserveCourt: 'Забронировать корт',
  },

  leagues: {
    registration: {
      open: 'Регистрация открыта',
      closed: 'Регистрация закрыта',
      deadline: 'Крайний срок регистрации',
      full: 'Регистрация заполнена',
      waitlist: 'Список ожидания',
    },
    standings: {
      rank: 'Место',
      player: 'Игрок',
      wins: 'Победы',
      losses: 'Поражения',
      points: 'Очки',
      matchesPlayed: 'Сыграно матчей',
    },
    schedule: {
      upcoming: 'Предстоящие матчи',
      inProgress: 'Текущие матчи',
      completed: 'Завершенные матчи',
      postponed: 'Отложенные матчи',
    },
  },

  rateSportsmanship: {
    aspectsToRate: 'Аспекты для оценки',
    punctuality: 'Пунктуальность',
    fairPlay: 'Честная игра',
    respectful: 'Уважительность',
    communication: 'Общение',
    skillLevel: 'Уровень навыков',
    wouldPlayAgain: 'Хотел бы сыграть снова',
    yes: 'Да',
    no: 'Нет',
    maybe: 'Возможно',
    additionalComments: 'Дополнительные комментарии',
    positiveExperience: 'Положительный опыт',
    negativeExperience: 'Негативный опыт',
    reportIssue: 'Сообщить о проблеме',
    ratingThankYou: 'Спасибо за вашу оценку!',
    ratingHistory: 'История оценок',
  },

  clubCommunication: {
    createPost: 'Создать пост',
    editPost: 'Редактировать пост',
    deletePost: 'Удалить пост',
    pinPost: 'Закрепить пост',
    unpinPost: 'Открепить пост',
    likePost: 'Нравится',
    commentPost: 'Комментировать',
    sharePost: 'Поделиться',
    reportPost: 'Сообщить о посте',
    postDetails: 'Детали поста',
    comments: 'Комментарии',
    likes: 'Нравится',
    shares: 'Поделились',
    viewComments: 'Просмотр комментариев',
    addComment: 'Добавить комментарий',
  },

  policyEditScreen: {
    policyVersion: 'Версия политики',
    versionHistory: 'История версий',
    compareVersions: 'Сравнить версии',
    restoreVersion: 'Восстановить версию',
    publishPolicy: 'Опубликовать политику',
    draftSaved: 'Черновик сохранен',
    publishSuccess: 'Политика опубликована',
    publishError: 'Ошибка публикации',
    invalidContent: 'Неверное содержание',
    contentRequired: 'Требуется содержание',
    titleRequired: 'Требуется название',
    policyPreview: 'Предпросмотр политики',
    policyTemplates: 'Шаблоны политики',
    loadTemplate: 'Загрузить шаблон',
  },

  findClub: {
    searchRadius: 'Радиус поиска',
    withinMiles: 'В пределах миль',
    withinKilometers: 'В пределах километров',
    anyDistance: 'Любое расстояние',
    showOnMap: 'Показать на карте',
    getDirections: 'Получить маршрут',
    callClub: 'Позвонить в клуб',
    emailClub: 'Email клубу',
    visitWebsite: 'Посетить сайт',
    clubHours: 'Часы работы',
    clubFees: 'Стоимость',
    membershipOptions: 'Варианты членства',
    trialAvailable: 'Пробный период доступен',
    scheduleVisit: 'Запланировать посещение',
  },

  createClubLeague: {
    leagueFormat: 'Формат лиги',
    scoreSystem: 'Система подсчета очков',
    matchDuration: 'Длительность матча',
    playoffFormat: 'Формат плей-офф',
    tiebreakRules: 'Правила тай-брейка',
    registrationFee: 'Стоимость регистрации',
    prizePool: 'Призовой фонд',
    leagueRules: 'Правила лиги',
    createSuccess: 'Лига успешно создана',
    createError: 'Ошибка создания лиги',
    requiredFields: 'Обязательные поля',
    validationError: 'Ошибка валидации',
    reviewLeague: 'Проверить лигу',
    publishLeague: 'Опубликовать лигу',
  },

  findClubScreen: {
    popularNearby: 'Популярные рядом',
    newClubs: 'Новые клубы',
    topRated: 'Лучшие рейтинги',
    savedClubs: 'Сохраненные клубы',
    recentlyViewed: 'Недавно просмотренные',
    clubsYouMayLike: 'Клубы, которые могут вам понравиться',
    filterResults: 'Фильтр результатов',
    sortResults: 'Сортировка результатов',
    viewMode: 'Режим просмотра',
    mapView: 'Вид карты',
    listView: 'Вид списка',
    gridView: 'Вид сетки',
    refreshResults: 'Обновить результаты',
    loadingClubs: 'Загрузка клубов...',
  },

  schedules: {
    scheduleStatus: {
      active: 'Активное',
      inactive: 'Неактивное',
      cancelled: 'Отменено',
      completed: 'Завершено',
      paused: 'Приостановлено',
    },
    visibility: {
      public: 'Публичное',
      private: 'Приватное',
      membersOnly: 'Только участники',
    },
    notifications: {
      enabled: 'Включены',
      disabled: 'Отключены',
      custom: 'Пользовательские',
    },
    reminder: {
      none: 'Нет',
      atTime: 'В момент события',
      before15min: 'За 15 минут',
      before30min: 'За 30 минут',
      before1hour: 'За 1 час',
      before1day: 'За 1 день',
    },
  },

  modals: {
    loading: {
      title: 'Загрузка...',
      message: 'Пожалуйста, подождите',
      pleaseWait: 'Обработка вашего запроса',
    },
    success: {
      title: 'Успешно',
      message: 'Операция завершена успешно',
      done: 'Готово',
    },
    warning: {
      title: 'Предупреждение',
      message: 'Вы уверены, что хотите продолжить?',
      proceed: 'Продолжить',
      cancel: 'Отмена',
    },
  },

  admin: {
    userManagement: {
      totalUsers: 'Всего пользователей',
      activeUsers: 'Активных пользователей',
      bannedUsers: 'Заблокированных пользователей',
      pendingApproval: 'Ожидает одобрения',
      searchUsers: 'Поиск пользователей',
      filterUsers: 'Фильтр пользователей',
      exportUsers: 'Экспорт пользователей',
    },
    analytics: {
      overview: 'Обзор',
      userGrowth: 'Рост пользователей',
      engagement: 'Вовлеченность',
      retention: 'Удержание',
      revenue: 'Доход',
    },
  },

  eventCard: {
    rsvpStatus: {
      going: 'Иду',
      notGoing: 'Не иду',
      maybe: 'Возможно',
      interested: 'Интересуюсь',
    },
  },

  manageAnnouncement: {
    targeting: {
      allMembers: 'Все участники',
      specificGroups: 'Определенные группы',
      skillLevel: 'По уровню навыков',
      location: 'По месту',
      membershipTier: 'По уровню членства',
    },
    scheduling: {
      publishNow: 'Опубликовать сейчас',
      scheduleForLater: 'Запланировать на позже',
      recurring: 'Повторяющееся',
      oneTime: 'Одноразовое',
    },
  },

  contexts: {
    permissions: {
      camera: 'Камера',
      photos: 'Фотографии',
      contacts: 'Контакты',
      microphone: 'Микрофон',
      storage: 'Хранилище',
      calendar: 'Календарь',
    },
  },

  eventParticipation: {
    registered: 'Зарегистрирован',
    checkedIn: 'Зарегистрировался',
    noShow: 'Не явился',
    cancelled: 'Отменено',
    waitlisted: 'В списке ожидания',
    invited: 'Приглашен',
    declined: 'Отклонил',
    confirmed: 'Подтвержден',
    tentative: 'Возможно',
    attended: 'Присутствовал',
    absent: 'Отсутствовал',
    late: 'Опоздал',
  },

  aiChat: {
    greeting: 'Привет! Чем могу помочь?',
    thinking: 'Думаю...',
    typing: 'Печатаю...',
    sendMessage: 'Отправить сообщение',
    messagePlaceholder: 'Введите сообщение...',
    clearChat: 'Очистить чат',
    newChat: 'Новый чат',
    chatHistory: 'История чата',
    suggestions: 'Предложения',
    quickReplies: 'Быстрые ответы',
    errorMessage: 'Извините, произошла ошибка. Попробуйте снова.',
    noConnection: 'Нет подключения',
  },

  hallOfFame: {
    champions: 'Чемпионы',
    topPlayers: 'Лучшие игроки',
    achievements: 'Достижения',
    records: 'Рекорды',
    legends: 'Легенды',
    mostWins: 'Больше всего побед',
    highestRating: 'Наивысший рейтинг',
    longestStreak: 'Самая длинная серия',
    mostTournaments: 'Больше всего турниров',
    bestSportsmanship: 'Лучшее спортивное поведение',
    rookieOfTheYear: 'Новичок года',
    playerOfTheYear: 'Игрок года',
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

console.log('✅ Russian translation BATCH 3 complete!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);
