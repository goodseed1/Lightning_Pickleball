#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
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

// Count untranslated keys
function countUntranslated(en, ru, prefix = '') {
  let count = 0;

  for (const key in en) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key])) {
      count += countUntranslated(en[key], ru[key] || {}, fullKey);
    } else if (typeof en[key] === 'string') {
      if (!ru[key] || ru[key] === en[key]) {
        count++;
      }
    }
  }

  return count;
}

// Load JSON files
const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

console.log('Before translation:', countUntranslated(en, ru), 'untranslated keys');

// Comprehensive Russian translations
const translations = {
  // DuesManagement section
  duesManagement: {
    title: 'Управление взносами',
    myDues: 'Мои взносы',
    allMembers: 'Все участники',
    filter: 'Фильтр',
    search: 'Поиск',
    searchPlaceholder: 'Поиск участников...',
    status: {
      all: 'Все',
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      overdue: 'Просрочено',
      upcoming: 'Предстоящие',
    },
    period: {
      title: 'Период',
      monthly: 'Месячные',
      quarterly: 'Квартальные',
      annual: 'Годовые',
      custom: 'Пользовательские',
    },
    details: {
      title: 'Детали взноса',
      amount: 'Сумма',
      dueDate: 'Срок оплаты',
      paidDate: 'Дата оплаты',
      paymentMethod: 'Способ оплаты',
      notes: 'Примечания',
      history: 'История платежей',
      markPaid: 'Отметить как оплачено',
      markUnpaid: 'Отметить как неоплачено',
      sendReminder: 'Отправить напоминание',
    },
    payment: {
      title: 'Оплата взноса',
      selectMethod: 'Выберите способ оплаты',
      card: 'Карта',
      cash: 'Наличные',
      transfer: 'Перевод',
      other: 'Другое',
      confirm: 'Подтвердить оплату',
      success: 'Оплата успешна',
      failed: 'Ошибка оплаты',
    },
    create: {
      title: 'Создать взнос',
      selectMembers: 'Выбрать участников',
      allMembers: 'Все участники',
      specificMembers: 'Определённые участники',
      amount: 'Сумма',
      dueDate: 'Срок оплаты',
      recurring: 'Повторяющийся',
      notes: 'Примечания',
      create: 'Создать взнос',
      success: 'Взнос создан',
      error: 'Ошибка создания взноса',
    },
    summary: {
      title: 'Сводка взносов',
      totalCollected: 'Всего собрано',
      totalPending: 'Ожидается',
      totalOverdue: 'Просрочено',
      collectionRate: 'Процент сбора',
      thisMonth: 'Этот месяц',
      thisQuarter: 'Этот квартал',
      thisYear: 'Этот год',
    },
    notifications: {
      reminderSent: 'Напоминание отправлено',
      paymentConfirmed: 'Оплата подтверждена',
      duesCreated: 'Взносы созданы',
      statusUpdated: 'Статус обновлён',
    },
    errors: {
      loadFailed: 'Не удалось загрузить взносы',
      updateFailed: 'Не удалось обновить статус',
      paymentFailed: 'Не удалось обработать оплату',
      createFailed: 'Не удалось создать взнос',
    },
  },

  // Services section
  services: {
    title: 'Услуги',
    myServices: 'Мои услуги',
    allServices: 'Все услуги',
    categories: {
      all: 'Все',
      coaching: 'Тренировки',
      stringing: 'Натяжка струн',
      equipment: 'Оборудование',
      court: 'Аренда корта',
      other: 'Другое',
    },
    details: {
      title: 'Детали услуги',
      description: 'Описание',
      price: 'Цена',
      duration: 'Длительность',
      provider: 'Поставщик',
      rating: 'Рейтинг',
      reviews: 'Отзывы',
      availability: 'Доступность',
      book: 'Забронировать',
      contact: 'Связаться',
    },
    booking: {
      title: 'Бронирование услуги',
      selectDate: 'Выберите дату',
      selectTime: 'Выберите время',
      duration: 'Длительность',
      notes: 'Примечания',
      confirm: 'Подтвердить бронирование',
      success: 'Бронирование успешно',
      failed: 'Ошибка бронирования',
    },
    create: {
      title: 'Создать услугу',
      name: 'Название',
      description: 'Описание',
      category: 'Категория',
      price: 'Цена',
      duration: 'Длительность',
      availability: 'Доступность',
      create: 'Создать услугу',
      success: 'Услуга создана',
      error: 'Ошибка создания услуги',
    },
    myBookings: {
      title: 'Мои бронирования',
      upcoming: 'Предстоящие',
      past: 'Прошедшие',
      cancelled: 'Отменённые',
      cancel: 'Отменить',
      reschedule: 'Перенести',
    },
    provider: {
      title: 'Поставщик услуг',
      profile: 'Профиль',
      services: 'Услуги',
      reviews: 'Отзывы',
      contact: 'Контакт',
      rating: 'Рейтинг',
    },
    filters: {
      price: 'Цена',
      rating: 'Рейтинг',
      distance: 'Расстояние',
      availability: 'Доступность',
      apply: 'Применить',
      reset: 'Сбросить',
    },
    notifications: {
      bookingConfirmed: 'Бронирование подтверждено',
      bookingCancelled: 'Бронирование отменено',
      reminderSent: 'Напоминание отправлено',
      serviceCreated: 'Услуга создана',
    },
    errors: {
      loadFailed: 'Не удалось загрузить услуги',
      bookingFailed: 'Не удалось забронировать',
      cancelFailed: 'Не удалось отменить',
      createFailed: 'Не удалось создать услугу',
    },
  },

  // EmailLogin section
  emailLogin: {
    title: 'Вход с email',
    subtitle: 'Войдите в свой аккаунт',
    email: 'Email',
    emailPlaceholder: 'Введите email',
    password: 'Пароль',
    passwordPlaceholder: 'Введите пароль',
    login: 'Войти',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    signUp: 'Зарегистрироваться',
    or: 'или',
    socialLogin: 'Войти через',
    errors: {
      invalidEmail: 'Неверный формат email',
      invalidPassword: 'Пароль должен содержать минимум 6 символов',
      loginFailed: 'Ошибка входа',
      userNotFound: 'Пользователь не найден',
      wrongPassword: 'Неверный пароль',
      emailInUse: 'Email уже используется',
      weakPassword: 'Слабый пароль',
      networkError: 'Ошибка сети',
    },
    validation: {
      emailRequired: 'Email обязателен',
      passwordRequired: 'Пароль обязателен',
      emailInvalid: 'Введите действительный email',
      passwordTooShort: 'Пароль слишком короткий',
      passwordTooWeak: 'Пароль слишком слабый',
    },
    forgotPasswordScreen: {
      title: 'Восстановление пароля',
      subtitle: 'Введите email для восстановления',
      send: 'Отправить',
      success: 'Письмо отправлено',
      checkEmail: 'Проверьте email',
      backToLogin: 'Вернуться ко входу',
    },
    signUpScreen: {
      title: 'Регистрация',
      subtitle: 'Создайте новый аккаунт',
      confirmPassword: 'Подтвердите пароль',
      confirmPasswordPlaceholder: 'Введите пароль ещё раз',
      create: 'Создать аккаунт',
      haveAccount: 'Уже есть аккаунт?',
      signIn: 'Войти',
      termsAndConditions: 'Условия использования',
      privacyPolicy: 'Политика конфиденциальности',
      agreeToTerms: 'Я согласен с условиями использования',
    },
    success: {
      loginSuccess: 'Вход выполнен успешно',
      signUpSuccess: 'Регистрация успешна',
      passwordReset: 'Пароль сброшен',
      emailVerified: 'Email подтверждён',
    },
  },

  // Club section expansions
  club: {
    settings: {
      title: 'Настройки клуба',
      general: 'Общие',
      privacy: 'Приватность',
      notifications: 'Уведомления',
      members: 'Участники',
      advanced: 'Расширенные',
      save: 'Сохранить',
      cancel: 'Отмена',
    },
    privacy: {
      title: 'Настройки приватности',
      public: 'Публичный',
      private: 'Приватный',
      inviteOnly: 'Только по приглашению',
      description: 'Описание приватности',
      visibility: 'Видимость',
      joinRequests: 'Запросы на вступление',
    },
    roles: {
      owner: 'Владелец',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
      guest: 'Гость',
      manage: 'Управление ролями',
      assign: 'Назначить роль',
      permissions: 'Разрешения',
    },
    invitations: {
      title: 'Приглашения',
      send: 'Отправить приглашение',
      pending: 'Ожидающие',
      accepted: 'Принятые',
      declined: 'Отклонённые',
      cancel: 'Отменить приглашение',
      resend: 'Отправить повторно',
    },
    events: {
      upcoming: 'Предстоящие события',
      past: 'Прошедшие события',
      create: 'Создать событие',
      edit: 'Редактировать событие',
      delete: 'Удалить событие',
      details: 'Детали события',
      attendees: 'Участники',
    },
    announcements: {
      title: 'Объявления',
      create: 'Создать объявление',
      edit: 'Редактировать',
      delete: 'Удалить',
      pin: 'Закрепить',
      unpin: 'Открепить',
      recent: 'Недавние объявления',
    },
    statistics: {
      title: 'Статистика клуба',
      members: 'Участники',
      matches: 'Матчи',
      events: 'События',
      activity: 'Активность',
      growth: 'Рост',
      engagement: 'Вовлечённость',
    },
  },

  // MyActivities section
  myActivities: {
    title: 'Мои активности',
    tabs: {
      all: 'Все',
      matches: 'Матчи',
      events: 'События',
      practices: 'Тренировки',
      tournaments: 'Турниры',
    },
    filters: {
      upcoming: 'Предстоящие',
      past: 'Прошедшие',
      today: 'Сегодня',
      thisWeek: 'На этой неделе',
      thisMonth: 'В этом месяце',
      custom: 'Пользовательский',
    },
    match: {
      singles: 'Одиночный',
      doubles: 'Парный',
      mixed: 'Смешанный',
      won: 'Победа',
      lost: 'Поражение',
      draw: 'Ничья',
      scheduled: 'Запланирован',
      completed: 'Завершён',
      cancelled: 'Отменён',
    },
    event: {
      attending: 'Участвую',
      notAttending: 'Не участвую',
      maybe: 'Возможно',
      confirmed: 'Подтверждено',
      cancelled: 'Отменено',
    },
    practice: {
      solo: 'Индивидуальная',
      group: 'Групповая',
      coached: 'С тренером',
      scheduled: 'Запланирована',
      completed: 'Завершена',
    },
    tournament: {
      registered: 'Зарегистрирован',
      inProgress: 'В процессе',
      completed: 'Завершён',
      winner: 'Победитель',
      finalist: 'Финалист',
      semifinalist: 'Полуфиналист',
    },
    stats: {
      total: 'Всего',
      upcoming: 'Предстоящих',
      completed: 'Завершённых',
      winRate: 'Процент побед',
      participation: 'Участие',
    },
    actions: {
      view: 'Просмотр',
      edit: 'Редактировать',
      cancel: 'Отменить',
      delete: 'Удалить',
      share: 'Поделиться',
      export: 'Экспорт',
    },
    notifications: {
      reminder: 'Напоминание об активности',
      cancelled: 'Активность отменена',
      updated: 'Активность обновлена',
      upcoming: 'Предстоящая активность',
    },
    errors: {
      loadFailed: 'Не удалось загрузить активности',
      updateFailed: 'Не удалось обновить',
      deleteFailed: 'Не удалось удалить',
      cancelFailed: 'Не удалось отменить',
    },
  },

  // Additional common translations
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    retry: 'Повторить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Редактировать',
    create: 'Создать',
    update: 'Обновить',
    submit: 'Отправить',
    back: 'Назад',
    next: 'Далее',
    done: 'Готово',
    close: 'Закрыть',
    ok: 'ОК',
    yes: 'Да',
    no: 'Нет',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировка',
    select: 'Выбрать',
    clear: 'Очистить',
    apply: 'Применить',
    reset: 'Сбросить',
    view: 'Просмотр',
    share: 'Поделиться',
    copy: 'Копировать',
    paste: 'Вставить',
    cut: 'Вырезать',
    undo: 'Отменить',
    redo: 'Повторить',
    refresh: 'Обновить',
  },

  // Match translations
  match: {
    status: {
      scheduled: 'Запланирован',
      inProgress: 'В процессе',
      completed: 'Завершён',
      cancelled: 'Отменён',
      postponed: 'Отложен',
    },
    type: {
      singles: 'Одиночный',
      doubles: 'Парный',
      mixed: 'Смешанный',
      practice: 'Тренировочный',
      tournament: 'Турнирный',
    },
    result: {
      won: 'Победа',
      lost: 'Поражение',
      draw: 'Ничья',
      retired: 'Снялся',
      walkover: 'Тех. победа',
    },
  },

  // Court translations
  court: {
    surface: {
      hard: 'Хард',
      clay: 'Грунт',
      grass: 'Трава',
      carpet: 'Ковёр',
      indoor: 'Крытый',
    },
    status: {
      available: 'Доступен',
      occupied: 'Занят',
      maintenance: 'Обслуживание',
      reserved: 'Забронирован',
    },
    booking: {
      title: 'Бронирование корта',
      date: 'Дата',
      time: 'Время',
      duration: 'Длительность',
      confirm: 'Подтвердить',
    },
  },

  // Tournament translations
  tournament: {
    format: {
      singleElimination: 'Одиночное выбывание',
      doubleElimination: 'Двойное выбывание',
      roundRobin: 'Круговая система',
      swiss: 'Швейцарская система',
    },
    round: {
      final: 'Финал',
      semifinal: 'Полуфинал',
      quarterfinal: 'Четвертьфинал',
      round16: '1/8 финала',
      round32: '1/16 финала',
    },
    status: {
      upcoming: 'Предстоящий',
      registration: 'Регистрация',
      inProgress: 'В процессе',
      completed: 'Завершён',
      cancelled: 'Отменён',
    },
  },

  // League translations
  league: {
    division: {
      title: 'Дивизион',
      level: 'Уровень',
      standings: 'Турнирная таблица',
      schedule: 'Расписание',
    },
    season: {
      current: 'Текущий сезон',
      upcoming: 'Следующий сезон',
      past: 'Прошлые сезоны',
      spring: 'Весна',
      summer: 'Лето',
      fall: 'Осень',
      winter: 'Зима',
    },
    stats: {
      wins: 'Победы',
      losses: 'Поражения',
      points: 'Очки',
      rank: 'Место',
      streak: 'Серия',
    },
  },

  // Profile translations
  profile: {
    personal: {
      firstName: 'Имя',
      lastName: 'Фамилия',
      email: 'Email',
      phone: 'Телефон',
      dateOfBirth: 'Дата рождения',
      gender: 'Пол',
      location: 'Местоположение',
    },
    pickleball: {
      level: 'Уровень',
      rating: 'Рейтинг',
      experience: 'Опыт',
      playingStyle: 'Стиль игры',
      dominantHand: 'Ведущая рука',
      backhand: 'Бэкхенд',
    },
    preferences: {
      language: 'Язык',
      theme: 'Тема',
      notifications: 'Уведомления',
      privacy: 'Приватность',
    },
  },

  // Notification translations
  notification: {
    types: {
      match: 'Матч',
      event: 'Событие',
      message: 'Сообщение',
      friend: 'Друг',
      club: 'Клуб',
      system: 'Системное',
    },
    actions: {
      markRead: 'Отметить прочитанным',
      markUnread: 'Отметить непрочитанным',
      delete: 'Удалить',
      deleteAll: 'Удалить все',
      settings: 'Настройки',
    },
    settings: {
      push: 'Push-уведомления',
      email: 'Email-уведомления',
      sms: 'SMS-уведомления',
      inApp: 'В приложении',
    },
  },

  // Social translations
  social: {
    friends: {
      title: 'Друзья',
      add: 'Добавить друга',
      remove: 'Удалить друга',
      pending: 'Ожидающие',
      suggestions: 'Предложения',
      online: 'Онлайн',
      offline: 'Оффлайн',
    },
    follow: {
      followers: 'Подписчики',
      following: 'Подписки',
      follow: 'Подписаться',
      unfollow: 'Отписаться',
    },
    activity: {
      feed: 'Лента',
      recent: 'Недавние',
      trending: 'Популярное',
      like: 'Нравится',
      comment: 'Комментарий',
      share: 'Поделиться',
    },
  },

  // Chat translations
  chat: {
    title: 'Чат',
    messages: 'Сообщения',
    conversation: 'Беседа',
    typing: 'Печатает...',
    online: 'Онлайн',
    offline: 'Оффлайн',
    send: 'Отправить',
    attach: 'Прикрепить',
    emoji: 'Эмодзи',
    read: 'Прочитано',
    delivered: 'Доставлено',
    sent: 'Отправлено',
  },
};

// Apply translations
const updatedRu = deepMerge(ru, translations);

// Write updated file
fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2), 'utf8');

console.log('After translation:', countUntranslated(en, updatedRu), 'untranslated keys');
console.log('✅ Translations applied successfully!');
