const fs = require('fs');
const path = require('path');

/**
 * Final complete Russian translations - ALL remaining keys
 * Natural, idiomatic Russian translations
 */
const translations = {
  club: {
    clubMembers: {
      alerts: {
        loadError: {
          title: 'Ошибка',
          message: 'Не удалось загрузить запросы на вступление.',
        },
        promoteSuccess: 'Успешно повышен до менеджера.',
        demoteSuccess: 'Успешно понижен до участника.',
        removeSuccess: 'Участник был удалён.',
        actionError: 'Произошла ошибка при выполнении действия.',
        memberNotFound: 'Участник не найден. Возможно, он уже был удалён.',
        permissionDenied: 'Доступ запрещён. Только администраторы могут выполнять это действие.',
        cannotRemoveSelf: 'Вы не можете удалить себя.',
        cannotRemoveOwner: 'Нельзя удалить владельца клуба.',
      },
      memberCount: '{{count}} участник(ов)',
      requestCount: '{{count}} запрос(ов)',
      dateFormats: {
        joinedAt: 'Вступил {{date}}',
        requestedAt: 'Запрос {{date}}',
      },
      emptyStates: {
        noMembers: {
          title: 'Нет участников',
          description: 'Пока никто не вступил в этот клуб.',
        },
        noRequests: {
          title: 'Нет запросов на вступление',
          description: 'Нет новых запросов на вступление',
        },
      },
      profileHint: 'Просмотреть профиль →',
      removalReason: {
        label: 'Причина удаления (необязательно)',
        placeholder: 'Введите причину удаления...',
        defaultReason: 'Удалён администратором',
      },
      modal: {
        promoteTitle: 'Повысить до менеджера',
        demoteTitle: 'Понизить до участника',
        removeTitle: 'Удалить из клуба',
        promoteMessage: 'Повысить {{userName}} до менеджера?',
        demoteMessage: 'Понизить {{userName}} до участника?',
        removeMessage: 'Удалить {{userName}} из клуба?',
      },
    },
  },

  rateSportsmanship: {
    honorTags: {
      punctualPro: '#Пунктуальный',
      mentalFortress: '#МентальнаяКрепость',
      courtJester: '#ДушаКомпании',
    },
    alerts: {
      tagsRequired: 'Требуются теги',
      tagsRequiredMessage: 'Пожалуйста, выберите хотя бы один тег для каждого участника',
      badgesAwarded: 'Почётные значки вручены',
      badgesAwardedMessage: 'Теги спортивного поведения успешно присвоены. Спасибо!',
    },
  },

  clubLeaguesTournaments: {
    memberPreLeagueStatus: {
      peopleUnit: '',
    },
  },

  eventCard: {
    requirements: {
      genderMismatch: 'Несоответствие пола',
      menOnly: 'Это матч для мужчин',
      womenOnly: 'Это матч для женщин',
    },
  },

  createEvent: {
    languages: {
      korean: '한국어',
      chinese: '中文',
      japanese: '日本語',
      spanish: 'Español',
      french: 'Français',
    },
  },

  hostedEventCard: {
    weather: {
      conditions: {
        Drizzle: 'Морось',
        Showers: 'Ливни',
        'Light Snow': 'Лёгкий снег',
        'Heavy Snow': 'Сильный снег',
        Humid: 'Влажно',
        Hot: 'Жарко',
        Cold: 'Холодно',
      },
    },
  },

  duesManagement: {
    settings: {
      venmo: 'Venmo',
    },
    countSuffix: '',
  },

  activityTab: {
    cannotOpenChat: 'Не удаётся открыть чат.',
    cannotEditEvent: 'Не удаётся редактировать событие.',
    eventCancelled: 'Событие было отменено.',
    cancelEventError: 'Произошла ошибка при отмене события.',
    cancelParticipation: 'Отменить участие',
    cancelParticipationButton: 'Отменить участие',
    participationCancelled: 'Ваше участие было отменено.',
    cancelParticipationError: 'Произошла ошибка при отмене участия.',
    appliedTab: 'Поданные заявки',
    hostedTab: 'Мои события',
    pastTab: 'История активности',
  },

  regularMeetup: {
    meetupsWillAppear: 'Новые встречи появятся здесь, когда будут запланированы.',
    completedMeetupsWillAppear: 'Записи о завершённых встречах появятся здесь.',
    adminsWillSchedule: '🎾 Администраторы клуба скоро запланируют новые встречи!',
  },

  eventParticipation: {
    messages: {
      approvedTitle: 'Участие в событии одобрено!',
      approvedBody: 'Ваше участие в {eventTitle} было одобрено.',
      rejectedTitle: 'Участие в событии отклонено',
      rejectedBody: 'Ваш запрос на участие в {eventTitle} был отклонён.',
    },
  },

  manageLeagueParticipants: {
    setScores: 'Установить счёт',
    set: 'Сет',
    addSet: 'Добавить сет',
    removeSet: 'Удалить сет',
    calculateWinner: 'Рассчитать победителя',
    resultPreview: 'Предпросмотр результата',
    status: {
      pendingApproval: 'Ожидает одобрения',
    },
    errors: {
      selectWinner: 'Пожалуйста, выберите победителя',
    },
  },

  meetupDetail: {
    rsvp: {
      title: 'RSVP',
    },
  },

  createClubLeague: {
    entryFee: 'Вступительный взнос',
    maxPlayers: 'Макс. игроков',
    nameRequired: 'Пожалуйста, введите название сезона',
    deadlineBeforeStart: 'Срок подачи заявок должен быть до или в день начала',
    endAfterStart: 'Дата окончания должна быть после или в день начала',
  },

  manageAnnouncement: {
    unknown: 'Неизвестно',
    announcementDetails: 'Детали объявления',
    contentLabel: 'Содержание',
    importantNotice: 'Важное уведомление',
    importantNoticeDescription: 'Важные уведомления отображаются более заметно',
  },

  lessonCard: {
    deleteTitle: 'Удалить урок',
    deleteMessage: 'Вы уверены, что хотите удалить этот урок?',
    consultButton: 'Консультация',
    currencySuffix: '',
  },

  createModal: {
    lightningMatch: {
      subtitle: 'Рейтинговый матч',
    },
    lightningMeetup: {
      subtitle: 'Непринуждённая встреча',
    },
  },

  aiChat: {
    quickPrompts: {
      rulesHelp: 'Объясните основные правила тенниса',
      techniqueTips: 'Дайте мне советы по улучшению техники для моего уровня',
      strategyAdvice: 'Дайте мне советы по стратегии и тактике матча',
      equipmentHelp: 'Порекомендуйте теннисное снаряжение для моего уровня',
    },
  },

  userActivity: {
    editEventMessage: 'Хотите отредактировать это событие?',
    comingSoonMessage:
      'Функция редактирования событий скоро появится. Будет интегрирована с CreateEventFormScreen для загрузки существующих данных для редактирования.',
  },

  rankingPrivacy: {
    visibility: {
      public: {
        description:
          'Не-участники могут видеть все вкладки клуба, кроме Лиги/Турнира. Запросы на вступление разрешены.',
      },
      membersOnly: {
        label: 'Только для участников',
        description:
          'Не-участники не могут видеть вкладку Участники (Лига/Турнир исключены). Запросы на вступление разрешены.',
      },
      private: {
        description:
          'Скрыт из раздела Обзор/Список клубов. Нет запросов на вступление. Только по приглашению.',
      },
    },
  },

  developerTools: {
    title: 'Инструменты разработчика',
    resetLeagueStats: '🔄 Сбросить статистику лиги',
    resetting: 'Сброс...',
    warningDevOnly: '⚠️ Только для разработчиков - Выполнить один раз!',
    resetLeagueTitle: 'Сбросить статистику лиги',
    resetLeagueMessage:
      'Сбросить всю статистику лиги участников на 0?\n\n⚠️ Это действие нельзя отменить.\n✅ Статистика турниров будет сохранена.',
    resetCompleteTitle: 'Сброс завершён',
    resetFailedTitle: 'Сброс не удался',
    testNotification: 'Тестовое уведомление',
    clearCache: 'Очистить кэш',
    exportData: 'Экспортировать данные',
  },

  appNavigator: {
    home: 'Главная',
    matches: 'Матчи',
    clubs: 'Клубы',
    profile: 'Профиль',
    search: 'Поиск',
    notifications: 'Уведомления',
    settings: 'Настройки',
    friends: 'Друзья',
    chat: 'Чат',
    tournaments: 'Турниры',
    leaderboard: 'Рейтинг',
  },

  league: {
    title: 'Лига',
    standings: 'Таблица',
    schedule: 'Расписание',
    myMatches: 'Мои матчи',
    rules: 'Правила',
    participants: 'Участники',
    completed: 'Завершённые',
    upcoming: 'Предстоящие',
    inProgress: 'В процессе',
    join: 'Вступить',
    leave: 'Покинуть',
    eventTypes: {
      mens_singles: 'Мужской одиночный',
      womens_singles: 'Женский одиночный',
      mens_doubles: 'Мужской парный',
      womens_doubles: 'Женский парный',
    },
    genderLabels: {
      male: 'мужской',
      female: 'женский',
    },
  },

  recordScore: {
    title: 'Записать счёт',
    sets: 'Сеты',
    games: 'Геймы',
    winner: 'Победитель',
    loser: 'Проигравший',
    save: 'Сохранить',
    cancel: 'Отмена',
    invalidScore: 'Неверный счёт',
    scoreRecorded: 'Счёт записан',
    error: 'Не удалось записать счёт',
    confirmScore: 'Подтвердить счёт',
  },

  ntrpSelector: {
    title: 'Выберите уровень NTRP',
    description: 'Выберите ваш уровень навыков в теннисе',
    beginner: 'Начинающий',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
    professional: 'Профессионал',
    selfRated: 'Самооценка',
    verified: 'Проверено',
    estimated: 'Оценочно',
    selectLevel: 'Выберите уровень',
    confirm: 'Подтвердить',
  },

  clubPoliciesScreen: {
    loading: 'Загрузка информации о клубе...',
    sections: {
      introduction: 'Введение о клубе',
      meetings: 'Регулярные встречи',
      fees: 'Информация о взносах',
    },
    recurring: 'Регулярно',
    fees: {
      yearlyFee: 'Годовой взнос',
      paymentMethods: 'Способы оплаты',
      qrHint: 'Нажмите на способ оплаты с иконкой QR для просмотра QR-кода',
    },
    buttons: {
      checkDues: 'Проверить и оплатить мои взносы',
      membersOnly: 'Функция только для участников',
      joinClub: 'Вступить в клуб',
      editInfo: 'Редактировать информацию',
    },
  },

  eventChat: {
    title: 'Чат события',
    sendMessage: 'Отправить сообщение',
    typeMessage: 'Введите сообщение...',
    noMessages: 'Нет сообщений',
    loadMore: 'Загрузить ещё',
    messageSent: 'Сообщение отправлено',
    messageError: 'Не удалось отправить сообщение',
    deleteMessage: 'Удалить сообщение',
    editMessage: 'Редактировать сообщение',
  },

  clubOverviewScreen: {
    members: 'Участники',
    events: 'События',
    tournaments: 'Турниры',
    leagues: 'Лиги',
    about: 'О клубе',
    join: 'Вступить',
    leave: 'Покинуть',
    manage: 'Управление',
  },

  leagues: {
    title: 'Лиги',
    myLeagues: 'Мои лиги',
    available: 'Доступные',
    completed: 'Завершённые',
    join: 'Вступить',
    view: 'Просмотреть',
    noLeagues: 'Нет лиг',
    create: 'Создать лигу',
  },

  eloTrend: {
    title: 'Динамика ELO',
    increase: 'Повышение',
    decrease: 'Понижение',
    stable: 'Стабильно',
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
    allTime: 'За всё время',
  },

  cards: {
    matchCard: 'Карточка матча',
    playerCard: 'Карточка игрока',
    clubCard: 'Карточка клуба',
    eventCard: 'Карточка события',
    tournamentCard: 'Карточка турнира',
    leagueCard: 'Карточка лиги',
    achievementCard: 'Карточка достижения',
  },

  mapAppSelector: {
    title: 'Выберите приложение карт',
    appleМaps: 'Apple Карты',
    googleМaps: 'Google Карты',
    openInMaps: 'Открыть в картах',
    cancel: 'Отмена',
    selectApp: 'Выберите приложение',
    defaultApp: 'Приложение по умолчанию',
  },

  clubDetailScreen: {
    overview: 'Обзор',
    events: 'События',
    members: 'Участники',
    about: 'Информация',
    join: 'Вступить',
    leave: 'Покинуть',
    loading: 'Загрузка...',
  },

  achievementsGuide: {
    title: 'Руководство по достижениям',
    howToEarn: 'Как получить',
    progress: 'Прогресс',
    unlocked: 'Разблокировано',
    locked: 'Заблокировано',
    viewAll: 'Просмотреть все',
  },

  clubCommunication: {
    announcements: 'Объявления',
    messages: 'Сообщения',
    notifications: 'Уведомления',
    sendMessage: 'Отправить сообщение',
    newAnnouncement: 'Новое объявление',
    noMessages: 'Нет сообщений',
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

console.log('✅ Final complete Russian translations applied successfully!');
console.log('\n📊 Additional sections translated:');
console.log('  - club.clubMembers.alerts & modals: ~30 keys');
console.log('  - activityTab (complete): ~11 keys');
console.log('  - league (with eventTypes & genderLabels): ~13 keys');
console.log('  - rateSportsmanship (tags & alerts): ~9 keys');
console.log('  - manageLeagueParticipants: ~10 keys');
console.log('  - createClubLeague: ~5 keys');
console.log('  - eventCard, hostedEventCard: ~10 keys');
console.log('  - regularMeetup, eventParticipation: ~7 keys');
console.log('  - aiChat, userActivity: ~6 keys');
console.log('  - mapAppSelector: ~7 keys');
console.log('  - clubDetailScreen: ~7 keys');
console.log('  - achievementsGuide: ~6 keys');
console.log('  - clubCommunication: ~6 keys');
console.log('  - createModal, lessonCard, manageAnnouncement: ~10 keys');
console.log('  - meetupDetail, rankingPrivacy: ~5 keys');
console.log('  - createEvent.languages, duesManagement: ~7 keys');
console.log('\n  ADDITIONAL TOTAL: ~150+ keys translated!');
console.log('\n🎉 Russian translation completion in progress!');
