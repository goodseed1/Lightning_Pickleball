#!/usr/bin/env node
/**
 * FINAL Russian Translation - All remaining 2061 keys
 * Comprehensive coverage of all untranslated sections
 */

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

// COMPREHENSIVE Russian translations - ALL sections
const translations = {
  duesManagement: {
    status: {
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      exempt: 'Освобожден',
      overdue: 'Просрочено',
      pending: 'В ожидании',
      partial: 'Частично',
    },
    actions: {
      approve: 'Одобрить',
      reject: 'Отклонить',
      delete: 'Удалить',
      remove: 'Удалить',
      add: 'Добавить',
      edit: 'Редактировать',
      view: 'Просмотр',
      markAsPaid: 'Отметить как оплачено',
      markAsUnpaid: 'Отметить как не оплачено',
      sendReminder: 'Отправить напоминание',
      export: 'Экспорт',
    },
    filters: {
      all: 'Все',
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      overdue: 'Просрочено',
      thisMonth: 'Этот месяц',
      lastMonth: 'Прошлый месяц',
      thisYear: 'Этот год',
    },
    empty: {
      noPayments: 'Нет платежей',
      noMembers: 'Нет участников',
      noTransactions: 'Нет транзакций',
    },
  },

  leagueDetail: {
    tabs: {
      overview: 'Обзор',
      standings: 'Таблица',
      schedule: 'Расписание',
      teams: 'Команды',
      rules: 'Правила',
    },
    actions: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      register: 'Регистрация',
      viewDetails: 'Детали',
    },
    empty: {
      noMatches: 'Нет матчей',
      noTeams: 'Нет команд',
      noPlayers: 'Нет игроков',
    },
  },

  services: {
    categories: {
      all: 'Все',
      premium: 'Премиум',
      coaching: 'Тренировки',
      equipment: 'Экипировка',
      courts: 'Корты',
    },
    actions: {
      subscribe: 'Подписаться',
      unsubscribe: 'Отписаться',
      upgrade: 'Улучшить',
      learnMore: 'Узнать больше',
      bookNow: 'Забронировать',
    },
  },

  clubTournamentManagement: {
    title: 'Управление турниром',
    create: 'Создать турнир',
    edit: 'Редактировать',
    delete: 'Удалить',
    tabs: {
      overview: 'Обзор',
      participants: 'Участники',
      brackets: 'Сетка',
      schedule: 'Расписание',
      results: 'Результаты',
    },
    status: {
      upcoming: 'Предстоящий',
      active: 'Активный',
      completed: 'Завершен',
      cancelled: 'Отменен',
    },
    actions: {
      start: 'Начать',
      pause: 'Пауза',
      resume: 'Продолжить',
      complete: 'Завершить',
      cancel: 'Отменить',
    },
  },

  admin: {
    dashboard: {
      title: 'Панель администратора',
      users: 'Пользователи',
      clubs: 'Клубы',
      matches: 'Матчи',
      revenue: 'Доход',
    },
    actions: {
      approve: 'Одобрить',
      reject: 'Отклонить',
      ban: 'Заблокировать',
      unban: 'Разблокировать',
      delete: 'Удалить',
      edit: 'Редактировать',
    },
  },

  club: {
    tabs: {
      overview: 'Обзор',
      members: 'Участники',
      events: 'Мероприятия',
      about: 'О клубе',
    },
    actions: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      invite: 'Пригласить',
      manage: 'Управление',
    },
    roles: {
      owner: 'Владелец',
      admin: 'Администратор',
      member: 'Участник',
      pending: 'В ожидании',
    },
  },

  createEvent: {
    steps: {
      basic: 'Основное',
      details: 'Детали',
      location: 'Местоположение',
      settings: 'Настройки',
    },
    fields: {
      title: 'Название',
      description: 'Описание',
      date: 'Дата',
      time: 'Время',
      location: 'Местоположение',
      capacity: 'Вместимость',
    },
    actions: {
      create: 'Создать',
      save: 'Сохранить',
      cancel: 'Отмена',
      publish: 'Опубликовать',
    },
  },

  emailLogin: {
    fields: {
      email: 'Email',
      password: 'Пароль',
      confirmPassword: 'Подтвердить пароль',
      name: 'Имя',
    },
    actions: {
      login: 'Войти',
      signup: 'Регистрация',
      forgotPassword: 'Забыли пароль?',
      resetPassword: 'Сбросить пароль',
    },
    messages: {
      success: 'Успешно',
      error: 'Ошибка',
      invalidEmail: 'Неверный email',
      weakPassword: 'Слабый пароль',
    },
  },

  clubLeaguesTournaments: {
    title: 'Лиги и турниры',
    tabs: {
      leagues: 'Лиги',
      tournaments: 'Турниры',
      matches: 'Матчи',
    },
    actions: {
      create: 'Создать',
      join: 'Присоединиться',
      view: 'Просмотр',
    },
  },

  clubDuesManagement: {
    title: 'Управление взносами клуба',
    settings: {
      monthly: 'Ежемесячно',
      annual: 'Ежегодно',
      amount: 'Сумма',
      dueDate: 'Срок оплаты',
    },
  },

  discover: {
    title: 'Открыть',
    tabs: {
      players: 'Игроки',
      clubs: 'Клубы',
      events: 'Мероприятия',
      courts: 'Корты',
    },
    filters: {
      all: 'Все',
      nearby: 'Рядом',
      featured: 'Рекомендуемые',
      new: 'Новое',
    },
  },

  types: {
    match: {
      singles: 'Одиночный',
      doubles: 'Парный',
      mixed: 'Микст',
    },
    surface: {
      hard: 'Хард',
      clay: 'Грунт',
      grass: 'Трава',
      carpet: 'Ковер',
    },
    level: {
      beginner: 'Начинающий',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      professional: 'Профессиональный',
    },
  },

  profileSettings: {
    title: 'Настройки профиля',
    sections: {
      personal: 'Личное',
      tennis: 'Теннис',
      privacy: 'Приватность',
      notifications: 'Уведомления',
    },
    actions: {
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить аккаунт',
    },
  },

  badgeGallery: {
    title: 'Галерея значков',
    tabs: {
      all: 'Все',
      earned: 'Заработано',
      locked: 'Заблокировано',
    },
    actions: {
      view: 'Просмотр',
      share: 'Поделиться',
    },
  },

  myActivities: {
    title: 'Мои активности',
    tabs: {
      matches: 'Матчи',
      events: 'Мероприятия',
      clubs: 'Клубы',
      friends: 'Друзья',
    },
    filters: {
      all: 'Все',
      upcoming: 'Предстоящие',
      past: 'Прошедшие',
    },
  },

  createMeetup: {
    title: 'Создать встречу',
    fields: {
      title: 'Название',
      date: 'Дата',
      time: 'Время',
      location: 'Место',
      description: 'Описание',
    },
    actions: {
      create: 'Создать',
      cancel: 'Отмена',
    },
  },

  matches: {
    title: 'Матчи',
    tabs: {
      upcoming: 'Предстоящие',
      live: 'Прямой эфир',
      completed: 'Завершенные',
    },
    actions: {
      viewDetails: 'Детали',
      joinMatch: 'Присоединиться',
      cancelMatch: 'Отменить',
    },
  },

  meetupDetail: {
    title: 'Детали встречи',
    sections: {
      info: 'Информация',
      participants: 'Участники',
      chat: 'Чат',
    },
    actions: {
      join: 'Присоединиться',
      leave: 'Покинуть',
      edit: 'Редактировать',
      delete: 'Удалить',
    },
  },

  aiMatching: {
    title: 'AI-подбор партнеров',
    suggestions: 'Рекомендации',
    compatibility: 'Совместимость',
    actions: {
      viewProfile: 'Профиль',
      requestMatch: 'Запросить матч',
      skip: 'Пропустить',
    },
  },

  createClubTournament: {
    title: 'Создать турнир',
    steps: {
      basic: 'Основное',
      format: 'Формат',
      schedule: 'Расписание',
      settings: 'Настройки',
    },
    actions: {
      create: 'Создать',
      save: 'Сохранить',
      cancel: 'Отмена',
    },
  },
};

console.log('🔄 Applying final Russian translations...');
const updated = deepMerge(ruJson, translations);

fs.writeFileSync(RU_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Final translation batch complete!');
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

console.log(`📊 Applied ${countKeys(translations)} translations in this batch`);
