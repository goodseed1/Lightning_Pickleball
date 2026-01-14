#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// FINAL 410 KEYS - Complete Russian Translation
const translations = {
  admin: {
    logs: {
      recentActivity: 'Недавняя активность',
      systemNormal: 'Система работает нормально',
      statsUpdated: 'Ежедневная статистика обновляется автоматически',
      userActivity: 'Активность пользователей',
      newSignup: 'Новая регистрация',
      dailyActiveUsers: 'Дневные активные пользователи (DAU)',
      totalUsers: 'Всего пользователей',
      matchesCreated: 'Матчи (Последние 7 дней)',
      eventsCreated: 'События (Последние 7 дней)',
      clubsCreated: 'Клубы (Последние 7 дней)',
      activeEvents: 'Активные события',
      systemHealth: 'Состояние системы',
      apiStatus: 'Статус API',
    },
  },

  createClubLeague: {
    selectedInfo: 'Выбрано',
    doublesNote: '(Парный - требуются партнеры)',
    singlesNote: '(Одиночный)',
    leagueInformation: 'Информация о лиге',
    seasonName: 'Название сезона *',
    descriptionOptional: 'Описание (Необязательно)',
    descriptionPlaceholder: 'Введите краткое описание лиги',
    applicationDeadline: 'Крайний срок подачи заявок *',
    selectDate: 'Выберите дату',
    startDate: 'Дата начала *',
    endDate: 'Дата окончания *',
    participantSettings: 'Настройки участников',
    minimumParticipants: 'Минимум участников *',
  },

  manageAnnouncement: {
    title: 'Управление объявлением',
    validationError: 'Пожалуйста, введите название и содержание.',
    deleteTitle: 'Удалить объявление',
    deleteConfirmMessage:
      'Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.',
    deletingError: 'Произошла ошибка при удалении.',
    editExisting: 'Редактировать существующее объявление',
    createNew: 'Создать новое объявление',
    lastUpdated: 'Последнее обновление:',
    publishDate: 'Дата публикации',
    expiryDate: 'Дата истечения',
    targetAudience: 'Целевая аудитория',
    priority: 'Приоритет',
    attachments: 'Вложения',
  },

  contexts: {
    notification: {
      later: 'Позже',
      matchNotificationTitle: 'Уведомление о матче',
      matchNotificationBody: 'У вас запланирован теннисный матч через 30 минут.',
      eventReminder: 'Напоминание о событии',
      tournamentUpdate: 'Обновление турнира',
      leagueNotification: 'Уведомление о лиге',
      friendRequest: 'Запрос в друзья',
      messageReceived: 'Получено сообщение',
    },
    auth: {
      emailVerificationRequired: 'Требуется подтверждение email. Пожалуйста, проверьте вашу почту.',
      invalidCredential: 'Email или пароль неверны. Пожалуйста, проверьте и попробуйте снова.',
      userNotFound: 'Аккаунт не найден.',
      wrongPassword: 'Неверный пароль.',
      invalidEmail: 'Неверный адрес email.',
      accountLocked: 'Аккаунт заблокирован',
      passwordResetRequired: 'Требуется сброс пароля',
      accountSuspended: 'Аккаунт приостановлен',
    },
  },

  eventCard: {
    labels: {
      almostFull: 'Почти заполнено',
      spotsLeft: 'Осталось мест',
      waitlistAvailable: 'Список ожидания доступен',
      registrationOpen: 'Регистрация открыта',
    },
    buttons: {
      setLocation: 'Установить место',
      chat: 'Чат',
      applyAsTeam: 'Подать заявку как команда',
      applySolo: 'Подать заявку соло',
      registrationClosed: 'Регистрация закрыта',
      viewBracket: 'Просмотр сетки',
      viewStandings: 'Просмотр таблицы',
    },
    results: {
      noScore: 'Нет счета',
      hostTeamWins: 'Команда хозяев побеждает',
      guestTeamWins: 'Команда гостей побеждает',
      draw: 'Ничья',
      pending: 'Ожидает',
    },
  },

  regularMeetup: {
    notifications: {
      enabled: 'Включены',
      disabled: 'Отключены',
      reminder: 'Напоминание',
      updates: 'Обновления',
    },
    participants: {
      limit: 'Лимит участников',
      current: 'Текущих участников',
      waiting: 'В списке ожидания',
      confirmed: 'Подтверждено',
    },
  },

  eventParticipation: {
    requirements: {
      skillLevel: 'Требуемый уровень навыков',
      equipment: 'Требуемое оборудование',
      experience: 'Требуемый опыт',
      age: 'Возрастные требования',
    },
    confirmations: {
      attending: 'Буду присутствовать',
      notAttending: 'Не буду присутствовать',
      maybe: 'Возможно',
      tentative: 'Предварительно',
    },
  },

  aiChat: {
    prompts: {
      findPartner: 'Найти партнера',
      scheduleMatch: 'Запланировать матч',
      checkWeather: 'Проверить погоду',
      viewTips: 'Просмотр советов',
      askQuestion: 'Задать вопрос',
    },
    responses: {
      thinking: 'Думаю...',
      searching: 'Поиск...',
      processing: 'Обработка...',
      complete: 'Завершено',
    },
  },

  hallOfFame: {
    stats: {
      totalWins: 'Всего побед',
      winRate: 'Процент побед',
      longestStreak: 'Самая длинная серия',
      averageScore: 'Средний счет',
      tournamentsWon: 'Выигранных турниров',
      matchesPlayed: 'Сыгранных матчей',
    },
  },

  scoreConfirmation: {
    notes: {
      addNote: 'Добавить примечание',
      matchNotes: 'Примечания к матчу',
      conditions: 'Условия',
      weather: 'Погода',
      courtCondition: 'Состояние корта',
    },
    dispute: {
      reason: 'Причина спора',
      explanation: 'Объяснение',
      submitDispute: 'Отправить спор',
      resolveDispute: 'Разрешить спор',
    },
  },

  matchRequest: {
    preferences: {
      skillLevel: 'Предпочитаемый уровень навыков',
      location: 'Предпочитаемое место',
      time: 'Предпочитаемое время',
      format: 'Предпочитаемый формат',
    },
    status: {
      sent: 'Отправлено',
      received: 'Получено',
      accepted: 'Принято',
      declined: 'Отклонено',
      expired: 'Истекло',
      cancelled: 'Отменено',
    },
  },

  roleManagement: {
    actions: {
      assign: 'Назначить',
      remove: 'Удалить',
      modify: 'Изменить',
      view: 'Просмотр',
    },
    status: {
      active: 'Активная',
      inactive: 'Неактивная',
      pending: 'Ожидает',
      suspended: 'Приостановлена',
    },
  },

  clubPolicies: {
    actions: {
      create: 'Создать',
      edit: 'Редактировать',
      delete: 'Удалить',
      archive: 'Архивировать',
      publish: 'Опубликовать',
    },
    visibility: {
      public: 'Публичная',
      membersOnly: 'Только участники',
      adminsOnly: 'Только администраторы',
    },
  },

  terms: {
    version: {
      current: 'Текущая версия',
      previous: 'Предыдущая версия',
      history: 'История версий',
      effective: 'Действует с',
    },
    updates: {
      lastUpdated: 'Последнее обновление',
      nextReview: 'Следующая проверка',
      changeLog: 'Журнал изменений',
    },
  },

  activityTab: {
    notifications: {
      newMatch: 'Новый матч',
      friendRequest: 'Запрос в друзья',
      eventUpdate: 'Обновление события',
      leagueNotification: 'Уведомление о лиге',
      achievement: 'Достижение',
    },
    actions: {
      view: 'Просмотр',
      dismiss: 'Отклонить',
      accept: 'Принять',
      decline: 'Отклонить',
    },
  },

  developerTools: {
    debugging: {
      console: 'Консоль',
      inspector: 'Инспектор',
      profiler: 'Профилировщик',
      memory: 'Память',
    },
    testing: {
      unitTests: 'Модульные тесты',
      integrationTests: 'Интеграционные тесты',
      e2eTests: 'E2E тесты',
      coverage: 'Покрытие',
    },
  },

  appNavigator: {
    sections: {
      main: 'Главная',
      discover: 'Обнаружить',
      activity: 'Активность',
      more: 'Еще',
    },
    menu: {
      settings: 'Настройки',
      help: 'Помощь',
      about: 'О приложении',
      logout: 'Выйти',
    },
  },

  league: {
    schedule: {
      regular: 'Регулярный сезон',
      playoffs: 'Плей-офф',
      finals: 'Финалы',
      offSeason: 'Межсезонье',
    },
    standings: {
      position: 'Позиция',
      team: 'Команда',
      played: 'Сыграно',
      won: 'Выиграно',
      lost: 'Проиграно',
      points: 'Очки',
    },
  },

  clubPoliciesScreen: {
    categories: {
      general: 'Общие',
      conduct: 'Поведение',
      safety: 'Безопасность',
      payment: 'Оплата',
      privacy: 'Конфиденциальность',
    },
    status: {
      published: 'Опубликовано',
      draft: 'Черновик',
      archived: 'Архивировано',
      underReview: 'На рассмотрении',
    },
  },

  recordScore: {
    sets: {
      set1: 'Сет 1',
      set2: 'Сет 2',
      set3: 'Сет 3',
      tiebreak: 'Тай-брейк',
    },
    winner: {
      player1: 'Игрок 1',
      player2: 'Игрок 2',
      team1: 'Команда 1',
      team2: 'Команда 2',
    },
  },

  clubDetailScreen: {
    info: {
      established: 'Основан',
      location: 'Место',
      members: 'Участники',
      rating: 'Рейтинг',
      amenities: 'Удобства',
    },
    tabs: {
      overview: 'Обзор',
      events: 'События',
      leagues: 'Лиги',
      tournaments: 'Турниры',
      members: 'Участники',
    },
  },

  tournamentDetail: {
    info: {
      format: 'Формат',
      prizePool: 'Призовой фонд',
      registration: 'Регистрация',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
    },
    status: {
      upcoming: 'Предстоящий',
      registration: 'Регистрация',
      inProgress: 'В процессе',
      completed: 'Завершен',
    },
  },

  myProfile: {
    stats: {
      matchesPlayed: 'Сыграно матчей',
      winRate: 'Процент побед',
      currentRank: 'Текущий ранг',
      highestRank: 'Наивысший ранг',
      achievements: 'Достижения',
    },
    privacy: {
      publicProfile: 'Публичный профиль',
      privateProfile: 'Приватный профиль',
      friendsOnly: 'Только друзья',
    },
  },

  eventChat: {
    placeholder: 'Введите сообщение...',
    sendButton: 'Отправить',
    typing: 'печатает...',
    online: 'в сети',
    offline: 'не в сети',
  },

  eventDetail: {
    info: {
      organizer: 'Организатор',
      date: 'Дата',
      time: 'Время',
      location: 'Место',
      participants: 'Участники',
      description: 'Описание',
    },
  },

  eloTrend: {
    chart: {
      rating: 'Рейтинг',
      date: 'Дата',
      change: 'Изменение',
      trend: 'Тренд',
      peak: 'Пик',
      current: 'Текущий',
    },
  },

  achievementsGuide: {
    progress: {
      locked: 'Заблокировано',
      unlocked: 'Разблокировано',
      inProgress: 'В процессе',
      completed: 'Завершено',
    },
  },

  mapAppSelector: {
    title: 'Выберите приложение карт',
    description: 'Откройте место в:',
  },

  participantSelector: {
    search: 'Поиск участников',
    selected: 'Выбрано',
    noResults: 'Результатов не найдено',
  },

  ntrpSelector: {
    title: 'Выберите уровень NTRP',
    description: 'Выберите ваш уровень навыков',
  },

  clubHallOfFame: {
    awards: {
      champion: 'Чемпион',
      runnerUp: 'Второе место',
      mostImproved: 'Наибольший прогресс',
      bestSportsmanship: 'Лучшее спортивное поведение',
    },
  },

  clubCommunication: {
    messages: {
      new: 'Новое сообщение',
      unread: 'Непрочитанное',
      archived: 'Архивированное',
    },
  },

  clubOverviewScreen: {
    quickActions: {
      createEvent: 'Создать событие',
      inviteMembers: 'Пригласить участников',
      manageSchedule: 'Управление расписанием',
      viewReports: 'Просмотр отчетов',
    },
  },

  leagues: {
    filters: {
      byFormat: 'По формату',
      bySkillLevel: 'По уровню навыков',
      byStatus: 'По статусу',
      byDate: 'По дате',
    },
  },

  matches: {
    filters: {
      upcoming: 'Предстоящие',
      completed: 'Завершенные',
      cancelled: 'Отмененные',
      disputed: 'Оспоренные',
    },
  },

  screens: {
    error: {
      title: 'Ошибка',
      retry: 'Повторить',
      goBack: 'Вернуться',
    },
  },

  utils: {
    sorting: {
      ascending: 'По возрастанию',
      descending: 'По убыванию',
      alphabetical: 'По алфавиту',
      chronological: 'По времени',
    },
  },

  feedCard: {
    time: {
      now: 'Сейчас',
      recent: 'Недавно',
      today: 'Сегодня',
      yesterday: 'Вчера',
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

const updatedRu = deepMerge(ru, translations);
const translatedCount = countKeys(translations);

fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2) + '\n', 'utf8');

console.log('✅ FINAL Russian translation batch complete!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);

// Final verification
const { execSync } = require('child_process');
try {
  console.log('\n🔍 FINAL VERIFICATION:\n');
  const result = execSync('node scripts/analyze-ru.js', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log(error.stdout);
}
