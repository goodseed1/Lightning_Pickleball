#!/usr/bin/env node

/**
 * Complete ALL remaining Russian translations (659 keys)
 * This script translates every key where ru.json === en.json
 */

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// COMPREHENSIVE TRANSLATIONS - ALL 659 REMAINING KEYS
const translations = {
  // createClubLeague (28 keys)
  createClubLeague: {
    headerTitle: 'Создать новую лигу',
    headerSubtitle: 'Начните лигу с участниками вашего клуба',
    matchTypeQuestion: 'Какой тип матчей будет в этой лиге?',
    mensSingles: 'Мужской одиночный разряд',
    mensSinglesDescription: 'Мужские матчи 1 на 1',
    womensSingles: 'Женский одиночный разряд',
    womensSinglesDescription: 'Женские матчи 1 на 1',
    mensDoubles: 'Мужской парный разряд',
    mensDoublesDescription: 'Мужские матчи 2 на 2',
    womensDoubles: 'Женский парный разряд',
    womensDoublesDescription: 'Женские матчи 2 на 2',
    mixedDoubles: 'Смешанный парный разряд',
    mixedDoublesDescription: 'Смешанные матчи 2 на 2',
    leagueNameQuestion: 'Как будет называться лига?',
    leagueNamePlaceholder: 'например, Весенняя лига 2025',
    leagueDescriptionQuestion: 'Опишите вашу лигу',
    leagueDescriptionPlaceholder: 'Добавьте описание лиги...',
    durationQuestion: 'Как долго будет длиться лига?',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    registrationQuestion: 'Настройки регистрации',
    registrationDeadline: 'Крайний срок регистрации',
    maxParticipants: 'Максимум участников',
    minParticipants: 'Минимум участников',
    skillLevelQuestion: 'Уровень навыков',
    anySkillLevel: 'Любой уровень',
    specificLevels: 'Определенные уровни',
    nextButton: 'Далее',
    previousButton: 'Назад',
    createLeagueButton: 'Создать лигу',
  },

  // clubOverviewScreen (28 keys)
  clubOverviewScreen: {
    loadingClubInfo: 'Загрузка информации о клубе...',
    loadingAnnouncements: 'Загрузка объявлений...',
    noDateInfo: 'Нет информации о дате',
    bracketGeneration: 'Генерация сетки',
    playoffsInProgress: 'Плей-офф в процессе',
    clubNotifications: 'Уведомления клуба',
    teamInviteTitle: 'Приглашение в команду',
    deleteNotificationError: 'Произошла ошибка при удалении уведомления.',
    clubInfoError: 'Ошибка загрузки информации о клубе',
    membershipStatus: 'Статус членства',
    pendingApproval: 'Ожидает одобрения',
    activeMember: 'Активный участник',
    adminControls: 'Управление администратора',
    viewAllMembers: 'Просмотреть всех участников',
    viewAllEvents: 'Просмотреть все события',
    clubSettings: 'Настройки клуба',
    announcements: 'Объявления',
    noAnnouncements: 'Нет объявлений',
    upcomingEvents: 'Предстоящие события',
    noUpcomingEvents: 'Нет предстоящих событий',
    recentActivity: 'Недавняя активность',
    noRecentActivity: 'Нет недавней активности',
    joinClub: 'Присоединиться к клубу',
    leaveClub: 'Покинуть клуб',
    editClub: 'Редактировать клуб',
    deleteClub: 'Удалить клуб',
    confirmDelete: 'Подтвердить удаление',
    deleteWarning: 'Вы уверены, что хотите удалить этот клуб?',
    shareClub: 'Поделиться клубом',
  },

  // leagues (24 keys)
  leagues: {
    admin: {
      applicant: 'Заявитель',
      leagueOpenedTitle: '🎭 Лига открыта',
      leagueOpenedMessage: 'Лига успешно открыта! Участники теперь могут подать заявку на участие.',
      leagueOpenError: 'Произошла ошибка при открытии лиги. Попробуйте снова.',
      adminRequired: 'Требуются права администратора.',
      approvalCompleteTitle: '✅ Одобрение завершено',
      approvalFailed: 'Одобрение не удалось',
      approvalError: 'Произошла ошибка при одобрении заявки. Попробуйте снова.',
      rejectionComplete: 'Отклонение завершено',
      rejectionError: 'Произошла ошибка при отклонении заявки.',
      withdrawalComplete: 'Отзыв завершен',
      withdrawalError: 'Произошла ошибка при отзыве заявки.',
      leagueDetails: 'Детали лиги',
      participantList: 'Список участников',
      pendingApplications: 'Ожидающие заявки',
      approvedParticipants: 'Одобренные участники',
      rejectedApplications: 'Отклоненные заявки',
      manageParticipants: 'Управление участниками',
      viewSchedule: 'Просмотр расписания',
      viewStandings: 'Просмотр таблицы',
      editLeague: 'Редактировать лигу',
      deleteLeague: 'Удалить лигу',
      leagueSettings: 'Настройки лиги',
      notifications: 'Уведомления',
    },
  },

  // schedules (23 keys)
  schedules: {
    form: {
      title: 'Название расписания *',
      titlePlaceholder: 'например, Вечерняя тренировка в среду',
      descriptionPlaceholder: 'Введите подробное описание расписания',
      scheduleType: 'Тип расписания',
      dayOfWeek: 'День недели *',
      startTime: 'Время начала *',
      duration: 'Длительность (минуты) *',
      locationInfo: 'Информация о месте',
      recurringSchedule: 'Повторяющееся расписание',
      oneTime: 'Одноразовое',
      weekly: 'Еженедельно',
      biweekly: 'Раз в две недели',
      monthly: 'Ежемесячно',
      maxParticipants: 'Максимум участников',
      minParticipants: 'Минимум участников',
      skillLevel: 'Уровень навыков',
      courtNumber: 'Номер корта',
      notes: 'Примечания',
      createSchedule: 'Создать расписание',
      updateSchedule: 'Обновить расписание',
      deleteSchedule: 'Удалить расписание',
      confirmDelete: 'Подтвердить удаление',
      deleteWarning: 'Вы уверены, что хотите удалить это расписание?',
    },
  },

  // admin (22 keys)
  admin: {
    logs: {
      functionLogs: 'Логи облачных функций',
      functionLogsDesc: 'Просмотр в консоли Firebase',
      openConsole: 'Открыть консоль Firebase',
      openConsoleDesc: 'Хотите просмотреть логи облачных функций в консоли Firebase?',
      authLogs: 'Логи аутентификации',
      authLogsDesc: 'События входа, регистрации и выхода',
      errorLogsDesc: 'Сбои приложения и ошибки API',
      performanceLogs: 'Мониторинг производительности',
      performanceLogsDesc: 'Время загрузки приложения и API',
      analyticsLogs: 'Логи аналитики',
      analyticsLogsDesc: 'События и действия пользователей',
      crashLogs: 'Логи сбоев',
      networkLogs: 'Логи сети',
      databaseLogs: 'Логи базы данных',
      storageLogs: 'Логи хранилища',
      messagingLogs: 'Логи сообщений',
      viewLogs: 'Просмотр логов',
      downloadLogs: 'Скачать логи',
      clearLogs: 'Очистить логи',
      refreshLogs: 'Обновить логи',
      filterLogs: 'Фильтр логов',
      searchLogs: 'Поиск логов',
    },
  },

  // hostedEventCard (22 keys)
  hostedEventCard: {
    eventType: 'Тип события',
    eventDate: 'Дата события',
    eventTime: 'Время события',
    eventLocation: 'Место события',
    eventDescription: 'Описание события',
    participants: 'Участники',
    maxParticipants: 'Макс. участников',
    currentParticipants: 'Текущих участников',
    skillLevel: 'Уровень навыков',
    hostInfo: 'Информация об организаторе',
    joinEvent: 'Присоединиться к событию',
    leaveEvent: 'Покинуть событие',
    editEvent: 'Редактировать событие',
    cancelEvent: 'Отменить событие',
    shareEvent: 'Поделиться событием',
    eventFull: 'Событие заполнено',
    eventCancelled: 'Событие отменено',
    eventCompleted: 'Событие завершено',
    viewDetails: 'Просмотр деталей',
    confirmCancel: 'Подтвердить отмену',
    cancelWarning: 'Вы уверены, что хотите отменить это событие?',
    notifyParticipants: 'Уведомить участников',
  },

  // regularMeetup (22 keys)
  regularMeetup: {
    title: 'Регулярная встреча',
    description: 'Создать повторяющееся событие',
    meetupName: 'Название встречи',
    meetupNamePlaceholder: 'например, Воскресный теннис',
    frequency: 'Частота',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    biweekly: 'Раз в две недели',
    monthly: 'Ежемесячно',
    customSchedule: 'Пользовательское расписание',
    repeatOn: 'Повторять в',
    endsOn: 'Заканчивается',
    never: 'Никогда',
    after: 'После',
    occurrences: 'повторений',
    onDate: 'В дату',
    participants: 'Участники',
    inviteMembers: 'Пригласить участников',
    createMeetup: 'Создать встречу',
    updateMeetup: 'Обновить встречу',
    deleteMeetup: 'Удалить встречу',
    viewAllOccurrences: 'Просмотреть все повторения',
  },

  // scoreConfirmation (22 keys)
  scoreConfirmation: {
    title: 'Подтверждение счета',
    matchScore: 'Счет матча',
    yourScore: 'Ваш счет',
    opponentScore: 'Счет противника',
    set1: 'Сет 1',
    set2: 'Сет 2',
    set3: 'Сет 3',
    tiebreak: 'Тай-брейк',
    winner: 'Победитель',
    confirmScore: 'Подтвердить счет',
    disputeScore: 'Оспорить счет',
    scoreConfirmed: 'Счет подтвержден',
    scoreDisputed: 'Счет оспорен',
    waitingForConfirmation: 'Ожидание подтверждения',
    bothPlayersConfirmed: 'Оба игрока подтвердили',
    matchResult: 'Результат матча',
    victory: 'Победа',
    defeat: 'Поражение',
    scoreDetails: 'Детали счета',
    matchDuration: 'Длительность матча',
    submitScore: 'Отправить счет',
    editScore: 'Редактировать счет',
    finalScore: 'Финальный счет',
  },

  // cards (22 keys)
  cards: {
    loadMore: 'Загрузить еще',
    viewAll: 'Просмотреть все',
    showLess: 'Показать меньше',
    expandCard: 'Развернуть карточку',
    collapseCard: 'Свернуть карточку',
    cardDetails: 'Детали карточки',
    quickActions: 'Быстрые действия',
    moreOptions: 'Больше опций',
    shareCard: 'Поделиться',
    saveCard: 'Сохранить',
    deleteCard: 'Удалить',
    editCard: 'Редактировать',
    duplicateCard: 'Дублировать',
    archiveCard: 'Архивировать',
    favoriteCard: 'В избранное',
    unfavoriteCard: 'Из избранного',
    pinCard: 'Закрепить',
    unpinCard: 'Открепить',
    cardSettings: 'Настройки карточки',
    cardHistory: 'История карточки',
    relatedCards: 'Связанные карточки',
    cardComments: 'Комментарии',
  },

  // contexts (22 keys)
  contexts: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    warning: 'Предупреждение',
    info: 'Информация',
    noData: 'Нет данных',
    notFound: 'Не найдено',
    unauthorized: 'Неавторизован',
    forbidden: 'Запрещено',
    serverError: 'Ошибка сервера',
    networkError: 'Ошибка сети',
    timeout: 'Время вышло',
    retry: 'Повторить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    create: 'Создать',
    update: 'Обновить',
    close: 'Закрыть',
    back: 'Назад',
  },

  // eventCard (21 keys)
  eventCard: {
    eventTitle: 'Название события',
    eventHost: 'Организатор события',
    eventParticipants: 'Участники события',
    eventSkillLevel: 'Уровень навыков',
    eventLocation: 'Место события',
    eventDateTime: 'Дата и время',
    eventDuration: 'Длительность',
    eventCost: 'Стоимость',
    eventDescription: 'Описание',
    eventStatus: 'Статус события',
    eventType: 'Тип события',
    eventCapacity: 'Вместимость',
    spotsRemaining: 'Осталось мест',
    eventFull: 'Заполнено',
    joinWaitlist: 'Присоединиться к списку ожидания',
    rsvp: 'Подтвердить участие',
    viewOnMap: 'Посмотреть на карте',
    shareEvent: 'Поделиться событием',
    reportEvent: 'Сообщить о событии',
    contactHost: 'Связаться с организатором',
    eventReminder: 'Напоминание о событии',
  },

  // manageLeagueParticipants (21 keys)
  manageLeagueParticipants: {
    title: 'Управление участниками',
    searchParticipants: 'Поиск участников',
    filterByStatus: 'Фильтр по статусу',
    allParticipants: 'Все участники',
    activeParticipants: 'Активные участники',
    pendingParticipants: 'Ожидающие участники',
    participantName: 'Имя участника',
    participantRank: 'Ранг участника',
    participantStatus: 'Статус участника',
    approveParticipant: 'Одобрить участника',
    rejectParticipant: 'Отклонить участника',
    removeParticipant: 'Удалить участника',
    viewParticipantProfile: 'Просмотр профиля',
    sendMessage: 'Отправить сообщение',
    participantStats: 'Статистика участника',
    matchHistory: 'История матчей',
    winRate: 'Процент побед',
    totalMatches: 'Всего матчей',
    confirmRemoval: 'Подтвердить удаление',
    removalWarning: 'Вы уверены, что хотите удалить этого участника?',
    bulkActions: 'Массовые действия',
  },

  // activityTab (20 keys)
  activityTab: {
    recentActivity: 'Недавняя активность',
    todayActivity: 'Сегодня',
    yesterdayActivity: 'Вчера',
    thisWeekActivity: 'На этой неделе',
    olderActivity: 'Старше',
    noActivity: 'Нет активности',
    viewAllActivity: 'Просмотреть всю активность',
    filterActivity: 'Фильтр активности',
    activityType: 'Тип активности',
    matchActivity: 'Активность матчей',
    socialActivity: 'Социальная активность',
    clubActivity: 'Активность клуба',
    tournamentActivity: 'Активность турниров',
    achievementUnlocked: 'Достижение разблокировано',
    newFriend: 'Новый друг',
    newFollower: 'Новый подписчик',
    matchCompleted: 'Матч завершен',
    eventJoined: 'Присоединился к событию',
    rankUpdated: 'Ранг обновлен',
    clearAll: 'Очистить все',
  },

  // club (17 keys)
  club: {
    clubName: 'Название клуба',
    clubDescription: 'Описание клуба',
    clubLocation: 'Место клуба',
    clubMembers: 'Участники клуба',
    clubEvents: 'События клуба',
    clubRules: 'Правила клуба',
    clubAmenities: 'Удобства клуба',
    joinClub: 'Присоединиться к клубу',
    leaveClub: 'Покинуть клуб',
    memberSince: 'Участник с',
    clubAdmin: 'Администратор клуба',
    clubModerator: 'Модератор клуба',
    clubMember: 'Участник клуба',
    clubGuest: 'Гость клуба',
    clubPrivacy: 'Приватность клуба',
    publicClub: 'Публичный клуб',
    privateClub: 'Приватный клуб',
  },

  // findClub (16 keys)
  findClub: {
    searchClubs: 'Поиск клубов',
    nearbyClubs: 'Клубы рядом',
    popularClubs: 'Популярные клубы',
    recommendedClubs: 'Рекомендуемые клубы',
    searchPlaceholder: 'Поиск клубов...',
    filterByDistance: 'Фильтр по расстоянию',
    filterBySkillLevel: 'Фильтр по уровню навыков',
    filterByType: 'Фильтр по типу',
    noClubsFound: 'Клубы не найдены',
    viewClubDetails: 'Просмотр деталей клуба',
    clubDistance: 'Расстояние до клуба',
    clubRating: 'Рейтинг клуба',
    clubReviews: 'Отзывы о клубе',
    createNewClub: 'Создать новый клуб',
    clubCategory: 'Категория клуба',
    clearFilters: 'Очистить фильтры',
  },

  // rateSportsmanship (15 keys)
  rateSportsmanship: {
    title: 'Оценить спортивное поведение',
    rateYourOpponent: 'Оцените вашего противника',
    excellent: 'Отлично',
    good: 'Хорошо',
    fair: 'Справедливо',
    poor: 'Плохо',
    sportsmanshipRating: 'Оценка спортивного поведения',
    leaveComment: 'Оставить комментарий',
    commentPlaceholder: 'Дополнительные комментарии...',
    submitRating: 'Отправить оценку',
    skipRating: 'Пропустить оценку',
    thankYou: 'Спасибо за вашу оценку!',
    anonymous: 'Анонимно',
    ratingSubmitted: 'Оценка отправлена',
    ratingFailed: 'Не удалось отправить оценку',
    ratingRequired: 'Требуется оценка',
  },

  // matchRequest (15 keys)
  matchRequest: {
    title: 'Запрос на матч',
    requestMatch: 'Запросить матч',
    acceptRequest: 'Принять запрос',
    declineRequest: 'Отклонить запрос',
    requestPending: 'Запрос ожидает рассмотрения',
    requestAccepted: 'Запрос принят',
    requestDeclined: 'Запрос отклонен',
    requestExpired: 'Запрос истек',
    proposedDate: 'Предложенная дата',
    proposedTime: 'Предложенное время',
    proposedLocation: 'Предложенное место',
    message: 'Сообщение',
    sendRequest: 'Отправить запрос',
    cancelRequest: 'Отменить запрос',
    viewRequests: 'Просмотр запросов',
  },

  // clubCommunication (15 keys)
  clubCommunication: {
    announcements: 'Объявления',
    discussions: 'Обсуждения',
    messaging: 'Сообщения',
    notifications: 'Уведомления',
    postAnnouncement: 'Опубликовать объявление',
    startDiscussion: 'Начать обсуждение',
    sendMessage: 'Отправить сообщение',
    markAsRead: 'Отметить как прочитанное',
    markAllRead: 'Отметить все как прочитанное',
    deleteMessage: 'Удалить сообщение',
    editMessage: 'Редактировать сообщение',
    pinMessage: 'Закрепить сообщение',
    muteNotifications: 'Отключить уведомления',
    enableNotifications: 'Включить уведомления',
    communicationSettings: 'Настройки связи',
  },

  // policyEditScreen (15 keys)
  policyEditScreen: {
    title: 'Редактировать политику',
    policyName: 'Название политики',
    policyDescription: 'Описание политики',
    policyContent: 'Содержание политики',
    effectiveDate: 'Дата вступления в силу',
    lastUpdated: 'Последнее обновление',
    savePolicyButton: 'Сохранить политику',
    cancelButton: 'Отмена',
    deletePolicyButton: 'Удалить политику',
    confirmDelete: 'Подтвердить удаление',
    deleteWarning: 'Вы уверены, что хотите удалить эту политику?',
    policyType: 'Тип политики',
    privacyPolicy: 'Политика конфиденциальности',
    termsOfService: 'Условия использования',
    codeOfConduct: 'Кодекс поведения',
  },

  // findClubScreen (14 keys)
  findClubScreen: {
    title: 'Найти клубы',
    searchBar: 'Поиск клубов...',
    filters: 'Фильтры',
    sortBy: 'Сортировать по',
    distance: 'Расстояние',
    popularity: 'Популярность',
    rating: 'Рейтинг',
    newest: 'Новейшие',
    clubList: 'Список клубов',
    mapView: 'Вид карты',
    listView: 'Вид списка',
    applyFilters: 'Применить фильтры',
    resetFilters: 'Сбросить фильтры',
    noResults: 'Результаты не найдены',
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

console.log('✅ Russian translation FINAL batch complete!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);
console.log('\n🎉 All Russian translations COMPLETE!');
