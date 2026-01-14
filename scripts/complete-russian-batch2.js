#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// BATCH 2 - ALL NESTED KEYS (588 remaining)
const translations = {
  hostedEventCard: {
    eventTypes: {
      meetup: 'Встреча',
    },
    weather: {
      conditions: {
        Sunny: 'Солнечно',
        'Partly Cloudy': 'Переменная облачность',
        'Mostly Cloudy': 'Преимущественно облачно',
        Cloudy: 'Облачно',
        Overcast: 'Пасмурно',
        Fog: 'Туман',
        'Light Rain': 'Небольшой дождь',
        Rain: 'Дождь',
        'Heavy Rain': 'Сильный дождь',
        Thunderstorm: 'Гроза',
        Snow: 'Снег',
        Sleet: 'Мокрый снег',
        Hail: 'Град',
        Clear: 'Ясно',
        Windy: 'Ветрено',
      },
    },
  },

  scoreConfirmation: {
    submittedScore: 'Отправленный счет',
    submittedAt: 'Отправлено в',
    matchType: {
      league: 'Матч лиги',
      lightning: 'Быстрый матч',
      tournament: 'Турнирный матч',
      practice: 'Тренировочный матч',
      friendly: 'Дружеский матч',
    },
    confirmationTitle: 'Счет точный?',
    confirmationSubtitle:
      'Пожалуйста, убедитесь, что счет соответствует реальному результату матча.',
    agree: 'Я согласен',
    agreeDescription: 'Счет точный, и я подтверждаю результат матча',
    disagree: 'Я не согласен',
    disagreeDescription: 'Счет неточный',
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждено',
    disputed: 'Оспорено',
    disputeReason: 'Причина спора',
    disputeReasonPlaceholder: 'Пожалуйста, объясните, почему счет неточный...',
    submitDispute: 'Отправить спор',
    resolveDispute: 'Разрешить спор',
    adminReview: 'Проверка администратора',
  },

  cards: {
    hostedEvent: {
      unknown: 'Неизвестно',
      weather: {
        sunny: 'Солнечно',
        partlycloudy: 'Переменная облачность',
        mostlycloudy: 'Преимущественно облачно',
        cloudy: 'Облачно',
        overcast: 'Пасмурно',
        fog: 'Туман',
        lightrain: 'Небольшой дождь',
        rain: 'Дождь',
        heavyrain: 'Сильный дождь',
        thunderstorm: 'Гроза',
        snow: 'Снег',
        sleet: 'Мокрый снег',
        hail: 'Град',
        clear: 'Ясно',
        windy: 'Ветрено',
      },
      temperature: 'Температура',
      humidity: 'Влажность',
      windSpeed: 'Скорость ветра',
      precipitation: 'Осадки',
    },
  },

  contexts: {
    location: {
      permissionTitle: 'Требуется разрешение на местоположение',
      permissionMessage: 'Разрешение на местоположение необходимо для поиска ближайших игроков.',
      permissionRequired: 'Требуется разрешение на местоположение.',
      serviceDisabled: 'Службы определения местоположения отключены.',
      locationUnavailable: 'Местоположение недоступно.',
      locationTimeout: 'Время ожидания запроса местоположения истекло.',
      cannotGetLocation: 'Невозможно получить местоположение.',
      locationError: 'Ошибка определения местоположения.',
    },
    notification: {
      permissionTitle: 'Требуется разрешение на уведомления',
      permissionMessage: 'Разрешение на уведомления необходимо для получения обновлений.',
      permissionRequired: 'Требуется разрешение на уведомления.',
      notificationError: 'Ошибка уведомления.',
      enableNotifications: 'Включить уведомления',
      disableNotifications: 'Отключить уведомления',
    },
    auth: {
      signInRequired: 'Требуется вход',
      sessionExpired: 'Сеанс истек',
      invalidCredentials: 'Неверные учетные данные',
      accountDisabled: 'Аккаунт отключен',
      emailNotVerified: 'Email не подтвержден',
      tooManyAttempts: 'Слишком много попыток',
    },
    network: {
      offline: 'Нет подключения к интернету',
      reconnecting: 'Переподключение...',
      slowConnection: 'Медленное подключение',
      noConnection: 'Нет подключения',
    },
  },

  eventCard: {
    partnerStatus: {
      partnerPending: 'Ожидание партнера',
      partnerDeclined: 'Партнер отклонил',
      partnerAccepted: 'Партнер принял',
      partnerNotFound: 'Партнер не найден',
    },
    matchType: {
      mensSingles: 'Мужской одиночный разряд',
      womensSingles: 'Женский одиночный разряд',
      mensDoubles: 'Мужской парный разряд',
      womensDoubles: 'Женский парный разряд',
      mixedDoubles: 'Смешанный парный разряд',
    },
    eventTypes: {
      meetup: 'Встреча',
      match: 'Матч',
      tournament: 'Турнир',
      practice: 'Тренировка',
      clinic: 'Клиника',
      social: 'Социальное событие',
    },
    labels: {
      host: 'Организатор',
      participant: 'Участник',
      spectator: 'Зритель',
      organizer: 'Организатор',
    },
  },

  regularMeetup: {
    repeatOptions: {
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      biweekly: 'Раз в две недели',
      monthly: 'Ежемесячно',
      custom: 'Пользовательский',
    },
    daysOfWeek: {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье',
    },
  },

  activityTab: {
    activityTypes: {
      match: 'Матч',
      event: 'Событие',
      social: 'Социальное',
      achievement: 'Достижение',
      friendship: 'Дружба',
      club: 'Клуб',
      tournament: 'Турнир',
      league: 'Лига',
    },
    filters: {
      all: 'Все',
      matches: 'Матчи',
      events: 'События',
      social: 'Социальное',
      achievements: 'Достижения',
    },
    timeframes: {
      today: 'Сегодня',
      yesterday: 'Вчера',
      thisWeek: 'На этой неделе',
      lastWeek: 'На прошлой неделе',
      thisMonth: 'В этом месяце',
      older: 'Старше',
    },
  },

  manageLeagueParticipants: {
    status: {
      pending: 'Ожидает',
      approved: 'Одобрено',
      rejected: 'Отклонено',
      active: 'Активный',
      inactive: 'Неактивный',
      suspended: 'Приостановлено',
    },
    actions: {
      approve: 'Одобрить',
      reject: 'Отклонить',
      remove: 'Удалить',
      suspend: 'Приостановить',
      reactivate: 'Активировать',
      viewProfile: 'Просмотр профиля',
      sendMessage: 'Отправить сообщение',
    },
  },

  clubOverviewScreen: {
    tabs: {
      overview: 'Обзор',
      events: 'События',
      members: 'Участники',
      leagues: 'Лиги',
      tournaments: 'Турниры',
      announcements: 'Объявления',
      settings: 'Настройки',
    },
    stats: {
      totalMembers: 'Всего участников',
      activeMembers: 'Активных участников',
      upcomingEvents: 'Предстоящих событий',
      ongoingLeagues: 'Текущих лиг',
      completedTournaments: 'Завершенных турниров',
    },
    actions: {
      joinClub: 'Присоединиться',
      leaveClub: 'Покинуть',
      editClub: 'Редактировать',
      inviteMembers: 'Пригласить участников',
      createEvent: 'Создать событие',
      manageMembers: 'Управление участниками',
    },
  },

  leagues: {
    status: {
      upcoming: 'Предстоящая',
      active: 'Активная',
      completed: 'Завершенная',
      cancelled: 'Отмененная',
      paused: 'Приостановленная',
    },
    types: {
      singles: 'Одиночный разряд',
      doubles: 'Парный разряд',
      mixed: 'Смешанный',
      team: 'Командный',
    },
    format: {
      roundRobin: 'Круговая система',
      singleElimination: 'Одиночное выбывание',
      doubleElimination: 'Двойное выбывание',
      swiss: 'Швейцарская система',
    },
  },

  rateSportsmanship: {
    criteria: {
      respectful: 'Уважительный',
      fairPlay: 'Честная игра',
      punctual: 'Пунктуальный',
      communicative: 'Общительный',
      skillful: 'Умелый',
    },
    ratings: {
      excellent: 'Отлично',
      good: 'Хорошо',
      average: 'Средне',
      poor: 'Плохо',
    },
  },

  clubCommunication: {
    types: {
      announcement: 'Объявление',
      discussion: 'Обсуждение',
      event: 'Событие',
      poll: 'Опрос',
      update: 'Обновление',
    },
    priority: {
      urgent: 'Срочно',
      high: 'Высокий',
      normal: 'Обычный',
      low: 'Низкий',
    },
  },

  policyEditScreen: {
    sections: {
      introduction: 'Введение',
      terms: 'Условия',
      privacy: 'Конфиденциальность',
      conduct: 'Поведение',
      liability: 'Ответственность',
      modifications: 'Изменения',
    },
    status: {
      draft: 'Черновик',
      published: 'Опубликовано',
      archived: 'Архивировано',
    },
  },

  findClub: {
    sortOptions: {
      distance: 'Расстояние',
      rating: 'Рейтинг',
      members: 'Участники',
      activity: 'Активность',
      newest: 'Новейшие',
    },
    clubTypes: {
      public: 'Публичный',
      private: 'Приватный',
      inviteOnly: 'Только по приглашению',
    },
  },

  createClubLeague: {
    steps: {
      type: 'Тип',
      details: 'Детали',
      schedule: 'Расписание',
      participants: 'Участники',
      rules: 'Правила',
      review: 'Проверка',
    },
  },

  findClubScreen: {
    filters: {
      all: 'Все',
      nearby: 'Рядом',
      popular: 'Популярные',
      recommended: 'Рекомендуемые',
      joined: 'Присоединился',
    },
  },

  schedules: {
    types: {
      practice: 'Тренировка',
      match: 'Матч',
      tournament: 'Турнир',
      social: 'Социальное',
      clinic: 'Клиника',
    },
    repeat: {
      none: 'Нет',
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      biweekly: 'Раз в две недели',
      monthly: 'Ежемесячно',
    },
  },

  modals: {
    confirm: {
      title: 'Подтвердить действие',
      message: 'Вы уверены, что хотите продолжить?',
      yes: 'Да',
      no: 'Нет',
      cancel: 'Отмена',
      ok: 'ОК',
    },
    delete: {
      title: 'Подтвердить удаление',
      message: 'Это действие нельзя отменить. Продолжить?',
      confirm: 'Удалить',
      cancel: 'Отмена',
    },
    error: {
      title: 'Ошибка',
      genericMessage: 'Что-то пошло не так. Попробуйте снова.',
      close: 'Закрыть',
      retry: 'Повторить',
    },
  },

  admin: {
    dashboard: {
      overview: 'Обзор',
      users: 'Пользователи',
      clubs: 'Клубы',
      events: 'События',
      reports: 'Отчеты',
      settings: 'Настройки',
    },
    actions: {
      approve: 'Одобрить',
      reject: 'Отклонить',
      delete: 'Удалить',
      edit: 'Редактировать',
      view: 'Просмотр',
      export: 'Экспорт',
    },
  },

  manageAnnouncement: {
    types: {
      general: 'Общее',
      event: 'Событие',
      maintenance: 'Обслуживание',
      update: 'Обновление',
      urgent: 'Срочно',
    },
    status: {
      draft: 'Черновик',
      scheduled: 'Запланировано',
      published: 'Опубликовано',
      archived: 'Архивировано',
    },
    actions: {
      create: 'Создать',
      edit: 'Редактировать',
      publish: 'Опубликовать',
      schedule: 'Запланировать',
      delete: 'Удалить',
      archive: 'Архивировать',
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

console.log('✅ Russian translation BATCH 2 complete!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);
