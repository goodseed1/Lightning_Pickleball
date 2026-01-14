#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const RU_PATH = path.join(LOCALES_DIR, 'ru.json');

const ruJson = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

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

// MEGA TRANSLATION - Comprehensive Russian translations
const megaTranslations = {
  createClub: {
    alerts: {
      limitMessage:
        'Каждый пользователь может создать максимум {{max}} клубов.\n\nВы владеете {{current}} клубом(ами).\n\nДля создания дополнительных клубов свяжитесь с администратором через AI-чатбот внизу приложения.',
    },
  },

  admin: {
    devTools: {
      korean: 'Корейский',
      english: 'Английский',
      russian: 'Русский',
    },
  },

  rateSportsmanship: {
    honorTags: {
      mrManner: '#ВежливыйИгрок',
      goodSport: '#ХорошийСпортсмен',
      teamPlayer: '#КоманднныйИгрок',
      positive: '#Позитивный',
      respectful: '#Уважительный',
    },
  },

  emailLogin: {
    buttons: {
      goToLogin: 'Перейти ко входу',
      goToSignup: 'Перейти к регистрации',
      submit: 'Отправить',
      login: 'Войти',
      signup: 'Регистрация',
    },
  },

  clubLeaguesTournaments: {
    status: {
      ongoing: 'В процессе',
      upcoming: 'Предстоящий',
      completed: 'Завершен',
      cancelled: 'Отменен',
    },
  },

  clubTournamentManagement: {
    participantRemoval: {
      errorMessage: 'Не удалось удалить участника.',
      successMessage: 'Участник успешно удален.',
      confirmMessage: 'Вы уверены, что хотите удалить этого участника?',
    },
  },

  profileSettings: {
    deleteAccount: {
      completeMessage: 'Ваш аккаунт был удален.',
      confirmMessage: 'Вы уверены? Это действие необратимо.',
      enterPassword: 'Введите пароль для подтверждения',
    },
  },

  hostedEventCard: {
    eventTypes: {
      ranked: 'Рейтинговый',
      casual: 'Дружеский',
      tournament: 'Турнир',
      practice: 'Тренировка',
    },
  },

  duesManagement: {
    paymentDetails: {
      method: 'Способ оплаты',
      amount: 'Сумма',
      date: 'Дата',
      status: 'Статус',
      reference: 'Ссылка',
      notes: 'Примечания',
    },
  },

  clubDuesManagement: {
    unpaid: {
      allPaid: 'Все участники оплатили взносы',
      noPending: 'Нет ожидающих платежей',
      noOverdue: 'Нет просроченных платежей',
    },
  },

  createClubTournament: {
    matchFormats: {
      best_of_1: '1 сет',
      best_of_3: '3 сета',
      best_of_5: '5 сетов',
      pro_set: 'Про-сет',
      tiebreak: 'Тай-брейк',
    },
  },

  manageAnnouncement: {
    savingError: 'Произошла ошибка при сохранении.',
    saveSuccess: 'Объявление успешно сохранено.',
    deleteSuccess: 'Объявление успешно удалено.',
    deleteError: 'Не удалось удалить объявление.',
  },

  achievementsGuide: {
    categories: {
      matches: 'Достижения в матчах',
      social: 'Социальные достижения',
      clubs: 'Достижения клубов',
      tournaments: 'Турнирные достижения',
      skills: 'Достижения навыков',
    },
  },

  matchRequest: {
    schedule: {
      oneHour: '1 час',
      twoHours: '2 часа',
      threeHours: '3 часа',
      fourHours: '4 часа',
      tomorrow: 'Завтра',
      nextWeek: 'На следующей неделе',
    },
  },

  leagueDetail: {
    validation: {
      genderRestriction: ' доступно только для игроков пола: {gender}.',
      ageRestriction: ' доступно только для возраста: {age}.',
      skillRestriction: ' доступно только для уровня навыка: {skill}.',
    },
  },

  appNavigator: {
    screens: {
      rateSportsmanship: 'Оценить спортивное поведение',
      editProfile: 'Редактировать профиль',
      settings: 'Настройки',
      notifications: 'Уведомления',
      messages: 'Сообщения',
    },
  },

  clubCommunication: {
    timeAgo: {
      justNow: 'только что',
      minutesAgo: '{minutes} мин назад',
      hoursAgo: '{hours} ч назад',
      daysAgo: '{days} дн назад',
      weeksAgo: '{weeks} нед назад',
    },
  },

  matches: {
    createModal: {
      maxParticipants: {
        placeholder: '4',
        label: 'Максимум участников',
        description: 'Максимальное количество игроков',
      },
    },
  },

  performanceDashboard: {
    detailedAnalysis: {
      title: 'Детальный анализ',
      description: 'Подробная статистика вашей игры',
      viewReport: 'Просмотр отчета',
    },
  },

  services: {
    leaderboard: {
      categories: {
        improvement: {
          name: 'Рейтинг улучшений',
          description: 'Игроки с наибольшим прогрессом',
        },
        overall: {
          name: 'Общий рейтинг',
          description: 'Лучшие игроки',
        },
        monthly: {
          name: 'Рейтинг месяца',
          description: 'Лучшие игроки этого месяца',
        },
      },
    },
  },

  // Add comprehensive common translations
  common: {
    buttons: {
      yes: 'Да',
      no: 'Нет',
      ok: 'ОК',
      confirm: 'Подтвердить',
      cancel: 'Отмена',
      close: 'Закрыть',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
      add: 'Добавить',
      remove: 'Удалить',
      back: 'Назад',
      next: 'Далее',
      skip: 'Пропустить',
      done: 'Готово',
      submit: 'Отправить',
      send: 'Отправить',
      share: 'Поделиться',
      copy: 'Копировать',
      paste: 'Вставить',
      cut: 'Вырезать',
      undo: 'Отменить',
      redo: 'Повторить',
      refresh: 'Обновить',
      reload: 'Перезагрузить',
      retry: 'Повторить',
      continue: 'Продолжить',
      finish: 'Завершить',
      start: 'Начать',
      stop: 'Остановить',
      pause: 'Пауза',
      resume: 'Продолжить',
      play: 'Играть',
      record: 'Записать',
      upload: 'Загрузить',
      download: 'Скачать',
      import: 'Импорт',
      export: 'Экспорт',
      print: 'Печать',
      search: 'Поиск',
      filter: 'Фильтр',
      sort: 'Сортировать',
      view: 'Просмотр',
      preview: 'Предпросмотр',
      details: 'Детали',
      more: 'Еще',
      less: 'Меньше',
      all: 'Все',
      none: 'Нет',
      select: 'Выбрать',
      deselect: 'Отменить выбор',
      clear: 'Очистить',
      reset: 'Сбросить',
      apply: 'Применить',
      update: 'Обновить',
      upgrade: 'Улучшить',
      downgrade: 'Понизить',
      enable: 'Включить',
      disable: 'Выключить',
      activate: 'Активировать',
      deactivate: 'Деактивировать',
      lock: 'Заблокировать',
      unlock: 'Разблокировать',
      block: 'Заблокировать',
      unblock: 'Разблокировать',
      mute: 'Отключить звук',
      unmute: 'Включить звук',
      hide: 'Скрыть',
      show: 'Показать',
      open: 'Открыть',
      fold: 'Свернуть',
      expand: 'Развернуть',
      collapse: 'Свернуть',
      maximize: 'Развернуть',
      minimize: 'Свернуть',
      zoom: 'Увеличить',
      zoomIn: 'Приблизить',
      zoomOut: 'Отдалить',
      fullscreen: 'Полный экран',
      exitFullscreen: 'Выйти из полного экрана',
      help: 'Помощь',
      about: 'О приложении',
      settings: 'Настройки',
      logout: 'Выйти',
      login: 'Войти',
      signup: 'Регистрация',
      subscribe: 'Подписаться',
      unsubscribe: 'Отписаться',
      follow: 'Подписаться',
      unfollow: 'Отписаться',
      like: 'Нравится',
      unlike: 'Не нравится',
      comment: 'Комментарий',
      reply: 'Ответить',
      report: 'Пожаловаться',
      flag: 'Пометить',
    },
    status: {
      loading: 'Загрузка...',
      saving: 'Сохранение...',
      processing: 'Обработка...',
      uploading: 'Загрузка...',
      downloading: 'Скачивание...',
      sending: 'Отправка...',
      pending: 'В ожидании',
      active: 'Активный',
      inactive: 'Неактивный',
      completed: 'Завершено',
      cancelled: 'Отменено',
      failed: 'Не удалось',
      success: 'Успешно',
      error: 'Ошибка',
      warning: 'Предупреждение',
      info: 'Информация',
      online: 'Онлайн',
      offline: 'Не в сети',
      available: 'Доступно',
      unavailable: 'Недоступно',
      busy: 'Занят',
      away: 'Отсутствует',
      doNotDisturb: 'Не беспокоить',
    },
    messages: {
      noData: 'Нет данных',
      noResults: 'Результатов не найдено',
      noItems: 'Нет элементов',
      empty: 'Пусто',
      loading: 'Загрузка...',
      error: 'Произошла ошибка',
      success: 'Успешно',
      saved: 'Сохранено',
      deleted: 'Удалено',
      updated: 'Обновлено',
      created: 'Создано',
      sent: 'Отправлено',
      received: 'Получено',
      confirmed: 'Подтверждено',
      cancelled: 'Отменено',
      completed: 'Завершено',
      failed: 'Не удалось',
      tryAgain: 'Попробуйте еще раз',
      contactSupport: 'Свяжитесь с поддержкой',
      comingSoon: 'Скоро появится',
      underMaintenance: 'На обслуживании',
      notFound: 'Не найдено',
      accessDenied: 'Доступ запрещен',
      unauthorized: 'Не авторизован',
      forbidden: 'Запрещено',
      sessionExpired: 'Сессия истекла',
      invalidInput: 'Неверный ввод',
      required: 'Обязательно',
      optional: 'Необязательно',
      recommended: 'Рекомендуется',
      deprecated: 'Устарело',
      beta: 'Бета',
      new: 'Новое',
      updated: 'Обновлено',
      improved: 'Улучшено',
      fixed: 'Исправлено',
    },
  },
};

console.log('🔄 Applying MEGA Russian translations...');
const updated = deepMerge(ruJson, megaTranslations);

fs.writeFileSync(RU_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ MEGA translation batch complete!');
console.log(`📁 Updated: ${RU_PATH}`);

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

console.log(`📊 Applied ${countKeys(megaTranslations)} translations in this batch`);
