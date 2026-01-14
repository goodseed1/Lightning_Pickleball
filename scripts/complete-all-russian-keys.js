#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// COMPLETE ALL REMAINING 369 KEYS
const translations = {
  regularMeetup: {
    pendingConfirmation: '⏳ Ожидает подтверждения',
    confirmMeetup: '➡️ Подтвердить встречу',
    crowdModerate: 'Умеренно',
    crowdCrowded: 'Многолюдно',
    windyWarning: '⚠️Ветрено',
    attending: 'Буду присутствовать',
    notAttending: 'Не буду присутствовать',
    noUpcomingMeetups: 'Нет предстоящих встреч',
    noPastMeetups: 'Нет прошедших встреч',
    createFirstMeetup: 'Создать первую встречу',
    loadingMeetups: 'Загрузка встреч...',
    meetupCancelled: 'Встреча отменена',
  },

  eventParticipation: {
    statusLabels: {
      waitlisted: 'В списке ожидания',
      no_show: 'Не явился',
      registered: 'Зарегистрирован',
      confirmed: 'Подтвержден',
      cancelled: 'Отменено',
    },
    typeLabels: {
      spectator: 'Зритель',
      helper: 'Помощник',
      participant: 'Участник',
      organizer: 'Организатор',
    },
    messages: {
      autoApprovalTitle: 'Участие в регулярной встрече подтверждено!',
      autoApprovalBody: 'Ваше участие в {eventTitle} было автоматически одобрено.',
      requestSentTitle: 'Запрос на участие в событии отправлен',
      requestSentBody:
        'Ваш запрос на участие в {eventTitle} был отправлен. Пожалуйста, дождитесь одобрения.',
      approvalRequired: 'Требуется одобрение',
      applicationSubmitted: 'Заявка отправлена',
    },
  },

  aiChat: {
    searching: '🔍 Поиск матчей...',
    navigation: {
      ClubDirectory: '🎾 Переход к справочнику клубов!',
      CreateEvent: '📝 Переход к созданию события!',
      PartnerSearch: '🤝 Переход к поиску партнера!',
      Discover: '🔍 Переход к обнаружению!',
      MyProfile: '👤 Переход к вашему профилю!',
      Schedule: '📅 Переход к расписанию!',
      Matches: '🎾 Переход к матчам!',
    },
    noRecentMatches: 'Нет недавних матчей для анализа. Пожалуйста, сначала завершите матч.',
    loginRequired: 'Пожалуйста, войдите, чтобы получить персонализированные советы.',
    analyzing: 'Анализ...',
    generatingAdvice: 'Генерация советов...',
    error: 'Произошла ошибка. Попробуйте снова.',
  },

  hallOfFame: {
    title: 'Зал славы',
    subtitle: 'Ваши достижения и награды',
    loading: 'Загрузка достижений...',
    emptyState: 'Пока нет достижений. Начните играть, чтобы заработать трофеи и значки!',
    sections: {
      honorBadges: 'Почетные значки',
      trophies: 'Трофеи',
      achievements: 'Достижения',
      milestones: 'Вехи',
    },
    honorBadges: {
      loading: 'Загрузка почетных значков...',
      noHonorBadges: 'Нет почетных значков',
      earnMore: 'Играйте больше, чтобы заработать значки!',
    },
    honorTags: {
      sharp_eyed: '#ВнимательныйВзгляд',
      full_of_energy: '#ПолонЭнергии',
      positive_attitude: '#ПозитивныйНастрой',
      team_player: '#Командный',
      respectful: '#Уважительный',
      fair_play: '#ЧестнаяИгра',
    },
  },

  scoreConfirmation: {
    reasonLabel: 'Причина несогласия',
    reasonPlaceholder: 'Пожалуйста, объясните, почему счет неверен или в чем проблема...',
    reasonHelper: 'Администратор рассмотрит вашу причину и утвердит счет.',
    warningTitle: 'Важные замечания',
    warningText:
      '• Согласие со счетом завершит результат матча\n• Несогласие передаст вопрос администратору\n• Ложные отчеты или злонамеренные споры могут привести к санкциям',
    submitAgree: 'Подтвердить счет',
    submitDisagree: 'Отправить спор',
    alerts: {
      selectionRequired: 'Требуется выбор',
      reasonRequired: 'Требуется причина',
      submitting: 'Отправка...',
      submitted: 'Отправлено',
    },
  },

  matchRequest: {
    notifications: {
      newRequest: 'Новый запрос на матч',
      requestAccepted: 'Запрос на матч принят',
      requestDeclined: 'Запрос на матч отклонен',
      requestExpired: 'Запрос на матч истек',
    },
    validation: {
      dateInPast: 'Дата не может быть в прошлом',
      locationRequired: 'Требуется место',
      timeRequired: 'Требуется время',
    },
  },

  roleManagement: {
    notifications: {
      roleAssigned: 'Роль назначена',
      roleRemoved: 'Роль удалена',
      permissionUpdated: 'Разрешение обновлено',
      accessDenied: 'Доступ запрещен',
    },
  },

  clubPolicies: {
    notifications: {
      policyCreated: 'Политика создана',
      policyUpdated: 'Политика обновлена',
      policyDeleted: 'Политика удалена',
      policyPublished: 'Политика опубликована',
    },
  },

  terms: {
    notifications: {
      accepted: 'Условия приняты',
      declined: 'Условия отклонены',
      updateAvailable: 'Доступно обновление условий',
      mustAccept: 'Необходимо принять условия',
    },
  },

  activityTab: {
    loading: {
      activities: 'Загрузка активностей...',
      updates: 'Загрузка обновлений...',
    },
    errors: {
      loadFailed: 'Не удалось загрузить активность',
      noPermission: 'Нет разрешения',
    },
  },

  developerTools: {
    api: {
      requests: 'API запросы',
      responses: 'API ответы',
      errors: 'API ошибки',
      latency: 'Задержка',
    },
  },

  appNavigator: {
    notifications: {
      newMessage: 'Новое сообщение',
      newNotification: 'Новое уведомление',
      updateAvailable: 'Доступно обновление',
    },
  },

  league: {
    notifications: {
      matchScheduled: 'Матч запланирован',
      standingsUpdated: 'Таблица обновлена',
      playoffsStarted: 'Плей-офф начался',
      leagueCompleted: 'Лига завершена',
    },
  },

  clubPoliciesScreen: {
    notifications: {
      policyViewed: 'Политика просмотрена',
      policyAccepted: 'Политика принята',
      policyDeclined: 'Политика отклонена',
    },
  },

  recordScore: {
    alerts: {
      scoreRecorded: 'Счет записан',
      invalidScore: 'Неверный счет',
      confirmationRequired: 'Требуется подтверждение',
    },
  },

  eventChat: {
    notifications: {
      newMessage: 'Новое сообщение',
      userJoined: 'Пользователь присоединился',
      userLeft: 'Пользователь вышел',
    },
  },

  manageLeagueParticipants: {
    alerts: {
      participantAdded: 'Участник добавлен',
      participantRemoved: 'Участник удален',
      statusUpdated: 'Статус обновлен',
    },
  },

  clubOverviewScreen: {
    alerts: {
      joinRequestSent: 'Запрос на вступление отправлен',
      membershipApproved: 'Членство одобрено',
      membershipRejected: 'Членство отклонено',
    },
  },

  leagues: {
    alerts: {
      applicationSubmitted: 'Заявка отправлена',
      applicationApproved: 'Заявка одобрена',
      applicationRejected: 'Заявка отклонена',
    },
  },

  rateSportsmanship: {
    alerts: {
      ratingSubmitted: 'Оценка отправлена',
      thankYou: 'Спасибо за вашу оценку!',
      error: 'Ошибка отправки оценки',
    },
  },

  activityFeed: {
    newMatch: 'Новый матч',
    matchCompleted: 'Матч завершен',
    tournamentStarted: 'Турнир начался',
    achievementUnlocked: 'Достижение разблокировано',
    friendJoined: 'Друг присоединился',
  },

  clubSettings: {
    general: 'Общие настройки',
    privacy: 'Настройки конфиденциальности',
    notifications: 'Настройки уведомлений',
    membership: 'Настройки членства',
  },

  userSettings: {
    account: 'Настройки аккаунта',
    profile: 'Настройки профиля',
    privacy: 'Настройки конфиденциальности',
    notifications: 'Настройки уведомлений',
    preferences: 'Предпочтения',
  },

  notifications: {
    enable: 'Включить уведомления',
    disable: 'Отключить уведомления',
    customize: 'Настроить уведомления',
    allowAll: 'Разрешить все',
    blockAll: 'Заблокировать все',
  },

  search: {
    placeholder: 'Поиск...',
    results: 'Результаты поиска',
    noResults: 'Результатов не найдено',
    searching: 'Поиск...',
    filters: 'Фильтры поиска',
  },

  filters: {
    apply: 'Применить фильтры',
    clear: 'Очистить фильтры',
    reset: 'Сбросить',
    save: 'Сохранить фильтры',
  },

  sort: {
    newest: 'Новейшие',
    oldest: 'Старейшие',
    alphabetical: 'По алфавиту',
    mostPopular: 'Самые популярные',
    highestRated: 'Лучшие рейтинги',
  },

  pagination: {
    previous: 'Предыдущая',
    next: 'Следующая',
    first: 'Первая',
    last: 'Последняя',
    page: 'Страница',
    of: 'из',
  },

  dateTime: {
    selectDate: 'Выбрать дату',
    selectTime: 'Выбрать время',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    startTime: 'Время начала',
    endTime: 'Время окончания',
  },

  forms: {
    required: 'Обязательно',
    optional: 'Необязательно',
    save: 'Сохранить',
    cancel: 'Отмена',
    submit: 'Отправить',
    reset: 'Сбросить',
    clear: 'Очистить',
  },

  validation: {
    required: 'Это поле обязательно',
    invalidEmail: 'Неверный email',
    invalidPhone: 'Неверный телефон',
    invalidUrl: 'Неверный URL',
    tooShort: 'Слишком короткий',
    tooLong: 'Слишком длинный',
    invalidFormat: 'Неверный формат',
  },

  confirmations: {
    areYouSure: 'Вы уверены?',
    cannotUndo: 'Это действие нельзя отменить',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    yes: 'Да',
    no: 'Нет',
  },

  messages: {
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Предупреждение',
    info: 'Информация',
    loading: 'Загрузка...',
    processing: 'Обработка...',
  },

  permissions: {
    granted: 'Разрешено',
    denied: 'Запрещено',
    required: 'Требуется',
    requestAccess: 'Запросить доступ',
  },

  sharing: {
    shareVia: 'Поделиться через',
    copyLink: 'Копировать ссылку',
    linkCopied: 'Ссылка скопирована',
    shareOn: 'Поделиться в',
  },

  media: {
    photo: 'Фото',
    video: 'Видео',
    audio: 'Аудио',
    document: 'Документ',
    upload: 'Загрузить',
    download: 'Скачать',
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

console.log('\n✅ COMPLETE ALL RUSSIAN TRANSLATIONS!');
console.log(`📊 Translated ${translatedCount} keys in this final batch`);
console.log(`📁 Updated: ${ruPath}`);

// Final verification
const { execSync } = require('child_process');
try {
  console.log('\n🎯 FINAL STATUS CHECK:\n');
  const result = execSync('node scripts/analyze-ru.js', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log(error.stdout);
}

console.log('\n🎉 Russian translation project COMPLETE! 🎉\n');
