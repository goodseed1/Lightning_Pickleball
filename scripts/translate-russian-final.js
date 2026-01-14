#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// Massive comprehensive translation object
const translations = {
  // Event Card (46 keys)
  eventCard: {
    participants: 'Участники',
    spotsLeft: 'Осталось мест',
    full: 'Заполнено',
    waitlist: 'Лист ожидания',
    recurring: 'Повторяется',
    rsvp: 'Откликнуться',
    going: 'Иду',
    notGoing: 'Не иду',
    maybe: 'Возможно',
    interested: 'Интересно',
    share: 'Поделиться',
    save: 'Сохранить',
    saved: 'Сохранено',
    report: 'Пожаловаться',
    edit: 'Редактировать',
    delete: 'Удалить',
    cancel: 'Отменить',
    view: 'Просмотреть',
    details: 'Детали',
    location: 'Место',
    date: 'Дата',
    time: 'Время',
    organizer: 'Организатор',
    fee: 'Взнос',
    level: 'Уровень',
    format: 'Формат',
    description: 'Описание',
    attendees: 'Участники',
    comments: 'Комментарии',
    photos: 'Фотографии',
    updates: 'Обновления',
    reminders: 'Напоминания',
    weather: 'Погода',
    directions: 'Направления',
    contact: 'Контакт',
    rules: 'Правила',
    requirements: 'Требования',
    equipment: 'Экипировка',
    parking: 'Парковка',
    amenities: 'Удобства',
    accessibility: 'Доступность',
    ageRestriction: 'Возрастное ограничение',
    skillRequired: 'Требуемый уровень',
    maxParticipants: 'Макс. участников',
    minParticipants: 'Мин. участников',
  },

  // AI Matching (46 keys)
  aiMatching: {
    title: 'AI подбор',
    findMatch: 'Найти партнера',
    recommendations: 'Рекомендации',
    compatibility: 'Совместимость',
    matchScore: 'Оценка совместимости',
    perfectMatch: 'Идеальный партнер',
    goodMatch: 'Хороший партнер',
    fairMatch: 'Неплохой партнер',
    analyzing: 'Анализ...',
    searchingPlayers: 'Поиск игроков...',
    foundMatches: 'Найдено партнеров',
    noMatches: 'Партнеры не найдены',
    tryAgain: 'Попробовать снова',

    criteria: {
      skillLevel: 'Уровень игры',
      location: 'Местоположение',
      availability: 'Доступность',
      playStyle: 'Стиль игры',
      goals: 'Цели',
      preferences: 'Предпочтения',
    },

    factors: {
      distance: 'Расстояние',
      rating: 'Рейтинг',
      winRate: 'Процент побед',
      experience: 'Опыт',
      activityLevel: 'Уровень активности',
      compatibility: 'Совместимость',
    },

    actions: {
      viewProfile: 'Просмотреть профиль',
      sendRequest: 'Отправить запрос',
      skipMatch: 'Пропустить',
      saveForLater: 'Сохранить на потом',
      notInterested: 'Не интересует',
    },

    filters: {
      distance: 'Расстояние',
      skillLevel: 'Уровень',
      availability: 'Доступность',
      age: 'Возраст',
      gender: 'Пол',
    },

    messages: {
      analyzing: 'Анализируем ваш профиль...',
      searching: 'Ищем идеальных партнеров...',
      found: 'Найдено {{count}} партнеров',
      noResults: 'Партнеры не найдены. Попробуйте изменить фильтры.',
      requestSent: 'Запрос отправлен',
    },
  },

  // Create Meetup (40 keys)
  createMeetup: {
    title: 'Создать встречу',
    meetupDetails: 'Детали встречи',
    selectDate: 'Выбрать дату',
    selectTime: 'Выбрать время',
    selectLocation: 'Выбрать место',
    addDescription: 'Добавить описание',
    invitePlayers: 'Пригласить игроков',
    setMaxPlayers: 'Установить макс. игроков',
    publicMeetup: 'Публичная встреча',
    privateMeetup: 'Приватная встреча',

    fields: {
      title: 'Название',
      description: 'Описание',
      date: 'Дата',
      time: 'Время',
      duration: 'Длительность',
      location: 'Место',
      court: 'Корт',
      maxPlayers: 'Макс. игроков',
      skillLevel: 'Уровень',
      meetupType: 'Тип встречи',
      privacy: 'Конфиденциальность',
    },

    types: {
      casual: 'Обычная',
      competitive: 'Соревновательная',
      practice: 'Тренировка',
      social: 'Социальная',
      clinic: 'Клиника',
    },

    validation: {
      titleRequired: 'Требуется название',
      dateRequired: 'Требуется дата',
      timeRequired: 'Требуется время',
      locationRequired: 'Требуется место',
      maxPlayersInvalid: 'Неверное макс. игроков',
    },

    actions: {
      create: 'Создать встречу',
      cancel: 'Отменить',
      save: 'Сохранить',
      invite: 'Пригласить',
    },

    success: {
      created: 'Встреча создана',
      updated: 'Встреча обновлена',
    },

    errors: {
      createFailed: 'Не удалось создать встречу',
      updateFailed: 'Не удалось обновить встречу',
    },
  },

  // Schedule Meetup (35 keys)
  scheduleMeetup: {
    title: 'Запланировать встречу',
    selectDateTime: 'Выбрать дату и время',
    selectCourt: 'Выбрать корт',
    availability: 'Доступность',
    checkAvailability: 'Проверить доступность',
    courtAvailable: 'Корт доступен',
    courtBooked: 'Корт занят',
    suggestedTimes: 'Рекомендуемое время',
    alternativeTimes: 'Альтернативное время',

    timeSlots: {
      morning: 'Утро (6:00 - 12:00)',
      afternoon: 'День (12:00 - 18:00)',
      evening: 'Вечер (18:00 - 22:00)',
    },

    recurrence: {
      none: 'Не повторяется',
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      biweekly: 'Раз в 2 недели',
      monthly: 'Ежемесячно',
      custom: 'Настроить',
    },

    duration: {
      minutes30: '30 минут',
      hour1: '1 час',
      hours1_5: '1.5 часа',
      hours2: '2 часа',
      hours3: '3 часа',
      custom: 'Настроить',
    },

    actions: {
      schedule: 'Запланировать',
      reschedule: 'Перенести',
      cancel: 'Отменить',
    },

    messages: {
      scheduled: 'Встреча запланирована',
      rescheduled: 'Встреча перенесена',
      cancelled: 'Встреча отменена',
      conflictFound: 'Обнаружен конфликт расписания',
    },
  },

  // Club Overview Screen (35 keys)
  clubOverviewScreen: {
    title: 'Обзор клуба',
    about: 'О клубе',
    facilities: 'Удобства',
    membership: 'Членство',
    events: 'События',
    news: 'Новости',
    photos: 'Фотографии',
    reviews: 'Отзывы',
    contact: 'Контакты',

    stats: {
      members: 'Участники',
      courts: 'Корты',
      events: 'События',
      founded: 'Основан',
      rating: 'Рейтинг',
    },

    actions: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      renew: 'Продлить',
      viewEvents: 'Просмотреть события',
      bookCourt: 'Забронировать корт',
      contactClub: 'Связаться',
      directions: 'Направления',
      share: 'Поделиться',
    },

    membership: {
      status: 'Статус',
      since: 'С',
      expires: 'Истекает',
      renewBy: 'Продлить до',
      benefits: 'Преимущества',
      tier: 'Уровень',
    },

    facilities: {
      indoorCourts: 'Крытые корты',
      outdoorCourts: 'Открытые корты',
      locker: 'Раздевалки',
      parking: 'Парковка',
      proShop: 'Магазин',
      restaurant: 'Ресторан',
    },
  },

  // Badge Gallery (34 keys)
  badgeGallery: {
    title: 'Галерея значков',
    myBadges: 'Мои значки',
    allBadges: 'Все значки',
    earned: 'Получено',
    locked: 'Заблокировано',
    inProgress: 'В процессе',

    categories: {
      achievement: 'Достижения',
      participation: 'Участие',
      milestone: 'Веха',
      special: 'Специальные',
      seasonal: 'Сезонные',
    },

    details: {
      name: 'Название',
      description: 'Описание',
      requirement: 'Требование',
      progress: 'Прогресс',
      earnedDate: 'Дата получения',
      rarity: 'Редкость',
    },

    rarity: {
      common: 'Обычный',
      uncommon: 'Необычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный',
    },

    actions: {
      view: 'Просмотреть',
      share: 'Поделиться',
      display: 'Показать',
      hide: 'Скрыть',
    },

    messages: {
      newBadge: 'Новый значок получен!',
      unlocked: 'Значок разблокирован',
      almostThere: 'Почти получен!',
    },
  },

  // Leagues (33 keys)
  leagues: {
    title: 'Лиги',
    myLeagues: 'Мои лиги',
    allLeagues: 'Все лиги',
    joinLeague: 'Присоединиться к лиге',
    createLeague: 'Создать лигу',

    status: {
      upcoming: 'Предстоящая',
      active: 'Активная',
      completed: 'Завершена',
      registration: 'Регистрация',
    },

    types: {
      singles: 'Одиночная',
      doubles: 'Парная',
      mixed: 'Смешанная',
      team: 'Командная',
    },

    details: {
      name: 'Название',
      season: 'Сезон',
      division: 'Дивизион',
      format: 'Формат',
      duration: 'Длительность',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
    },

    actions: {
      register: 'Зарегистрироваться',
      withdraw: 'Отозвать',
      viewStandings: 'Просмотреть таблицу',
      viewSchedule: 'Просмотреть расписание',
    },

    filters: {
      all: 'Все',
      my: 'Мои',
      open: 'Открытые',
      active: 'Активные',
    },

    messages: {
      registered: 'Регистрация успешна',
      withdrawn: 'Регистрация отменена',
    },
  },

  // Additional comprehensive translations for remaining services
  services: {
    map: {
      installPrompt: '{{appName}} не установлен. Хотите установить из App Store?',
      install: 'Установить',
    },

    clubComms: {
      permissionDenied: 'Доступ запрещен',
      commentNotFound: 'Комментарий не найден',
      commentAdded: 'Комментарий добавлен',
      commentUpdated: 'Комментарий обновлен',
      commentDeleted: 'Комментарий удален',
      postCreated: 'Публикация создана',
      postUpdated: 'Публикация обновлена',
      postDeleted: 'Публикация удалена',
      likeAdded: 'Лайк добавлен',
      likeRemoved: 'Лайк удален',
    },

    matching: {
      perfectMatchTitle: 'Найден идеальный партнер! 🎾',
      newRequestTitle: 'Новый запрос на матч 📨',
      perfectMatchBody: 'У вас {{score}}% совместимость с {{name}}.',
      newRequestBody: '{{senderName}} запросил теннисный матч с вами.',
      matchAccepted: 'Матч принят',
      matchDeclined: 'Матч отклонен',
      requestExpired: 'Запрос истек',
    },

    weather: {
      checking: 'Проверка погоды...',
      clear: 'Ясно',
      cloudy: 'Облачно',
      rainy: 'Дождь',
      sunny: 'Солнечно',
      windy: 'Ветрено',
      temperature: 'Температура',
      humidity: 'Влажность',
      windSpeed: 'Скорость ветра',
      forecast: 'Прогноз',
    },

    achievements: {
      unlocked: 'Достижение разблокировано',
      progress: 'Прогресс',
      completed: 'Завершено',
      newLevel: 'Новый уровень',
      milestone: 'Веха достигнута',
    },
  },

  // Club Tournament Management additional
  clubTournamentManagement: {
    participants: {
      search: 'Поиск участников',
      filter: 'Фильтр участников',
      sort: 'Сортировать участников',
      total: 'Всего участников',
      selected: 'Выбрано',
    },

    schedule: {
      view: 'Просмотреть расписание',
      edit: 'Редактировать расписание',
      publish: 'Опубликовать расписание',
      export: 'Экспортировать расписание',
      print: 'Печать расписания',
    },

    results: {
      pending: 'Ожидает',
      confirmed: 'Подтверждено',
      disputed: 'Оспорено',
      final: 'Финальный',
    },

    notifications: {
      schedulePublished: 'Расписание опубликовано',
      resultUpdated: 'Результат обновлен',
      tournamentStarted: 'Турнир начался',
      tournamentCompleted: 'Турнир завершен',
    },
  },

  // Additional Create Event fields
  createEvent: {
    fields: {
      visibility: 'Видимость',
      approval: 'Одобрение',
      reminder: 'Напоминание',
      confirmationRequired: 'Требуется подтверждение',
      allowGuests: 'Разрешить гостей',
      repeatEvent: 'Повторять событие',
    },

    reminders: {
      none: 'Нет',
      atTime: 'В момент события',
      minutes15: '15 минут до',
      minutes30: '30 минут до',
      hour1: '1 час до',
      hours24: '1 день до',
      week1: '1 неделя до',
    },
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

console.log('✅ Russian translation FINAL batch completed!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);
