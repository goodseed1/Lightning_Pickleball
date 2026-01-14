const fs = require('fs');
const path = require('path');

// BATCH 3: MEGA - Target all remaining nested structures
const translations = {
  services: {
    camera: {
      fileSizeMessage: 'Пожалуйста, выберите изображение размером менее 5 МБ.',
    },
    location: {
      permissionTitle: 'Требуется разрешение на геолокацию',
      permissionMessage:
        'Разрешение на геолокацию необходимо для поиска игроков поблизости. Пожалуйста, разрешите доступ в настройках.',
      later: 'Позже',
      backgroundPermissionTitle: 'Разрешение на фоновую геолокацию',
      backgroundPermissionMessage:
        'Разрешение на фоновую геолокацию необходимо для функций, таких как уведомления о матчах.',
      serviceDisabledTitle: 'Службы геолокации отключены',
      serviceDisabledMessage: 'Службы геолокации отключены. Пожалуйста, включите их в настройках.',
      openSettings: 'Открыть настройки',
    },
  },

  leagueDetail: {
    qualifiedTeams: 'Квалифицированные команды:',
    qualifiedPlayers: 'Квалифицированные игроки:',
    noName: 'Без имени',
    participantsStatus: 'Статус участников',
    participantsTeamStatus: 'Статус команд',
    maxTeams: 'Максимум команд',
    startAcceptingApplications: 'Начать приём заявок',
    startApplicationsMessage: 'Нажмите "Начать приём заявок" в разделе Управление',
    waitingForApplications: 'Заявки появятся здесь в реальном времени',
    newDateLabel: 'Новая дата (ГГГГ-ММ-ДД)',
    reasonLabel: 'Причина изменения',
    walkoverReasonLabel: 'Причина технической победы',
    applyingToLeague: 'Подача заявки в лигу',
    changeScoreWarning: 'Изменение счёта повлияет на статистику',
    pendingScoreSubmission: 'Ожидание подачи счёта',
    bothPlayersSubmitted: 'Оба игрока подали счёт',
    disputeInProgress: 'Идёт оспаривание',
    adminReviewRequired: 'Требуется рассмотрение администратором',
  },

  duesManagement: {
    settings: {
      venmo: 'Venmo',
    },
    modals: {
      removePaymentMethodConfirm: 'Удалить этот способ оплаты?',
      approvePaymentConfirm: 'Одобрить этот платёж?',
      rejectPaymentConfirm: 'Отклонить этот платёж?',
      addLateFee: 'Добавить штраф за просрочку',
      manageLateFeesTitle: 'Управление штрафами за просрочку',
      selectLateFeeToDelete: 'Выберите штраф для удаления',
      selectLateFeePrompt: 'Выберите, какой штраф удалить',
      deleteLateFee: 'Удалить штраф',
      deleteLateFeeConfirm: 'Удалить этот штраф?',
      manageJoinFee: 'Управление вступительным взносом',
      deleteJoinFee: 'Удалить вступительный взнос',
      deleteJoinFeeConfirm: 'Удалить вступительный взнос?',
    },
  },

  emailLogin: {
    title: {
      login: 'Вход',
      signup: 'Регистрация',
      verification: 'Подтверждение Email',
    },
    labels: {
      email: 'Email',
      confirmPassword: 'Подтвердите пароль',
    },
    buttons: {
      loginAfterVerification: 'Войти после подтверждения',
      resendVerification: 'Отправить письмо подтверждения снова',
      changeEmail: 'Зарегистрироваться с другим email',
    },
    toggle: {
      loginLink: 'Вход',
    },
    emailStatus: {
      available: 'Email доступен',
      accountFound: 'Аккаунт найден',
      noAccountFound: 'Аккаунт не найден. Пожалуйста, зарегистрируйтесь!',
      alreadyRegistered: 'Этот email уже зарегистрирован. Попробуйте войти.',
    },
  },

  createEvent: {
    eventType: {
      lightningMatch: 'Молниеносный матч',
      lightningMeetup: 'Молниеносная встреча',
      match: 'Матч',
      meetup: 'Встреча',
      doublesMatch: 'Парный матч',
      singlesMatch: 'Одиночный матч',
    },
    fields: {
      selectLanguages: 'Выбрать языки',
      levelNotSet: 'Уровень не установлен',
    },
    placeholders: {
      titleMatch: 'напр. Вечерний одиночный матч',
      titleMeetup: 'напр. Выходная весёлая ралли',
      description: 'Введите дополнительную информацию о встрече...',
    },
    gameTypes: {
      mens_singles: 'Мужской одиночный',
      womens_singles: 'Женский одиночный',
      mens_doubles: 'Мужской парный',
      womens_doubles: 'Женский парный',
      mixed_doubles: 'Смешанный парный',
    },
  },

  profileSettings: {
    sections: {
      personal: 'Личное',
      pickleball: 'Теннис',
      preferences: 'Предпочтения',
      privacy: 'Конфиденциальность',
      notifications: 'Уведомления',
      account: 'Аккаунт',
    },
    fields: {
      email: 'Email',
      phone: 'Телефон',
      birthdate: 'Дата рождения',
      gender: 'Пол',
      location: 'Местоположение',
      bio: 'О себе',
      skillLevel: 'Уровень навыков',
      playStyle: 'Стиль игры',
      dominantHand: 'Доминирующая рука',
      yearsPlaying: 'Лет игры',
    },
    privacy: {
      profileVisibility: 'Видимость профиля',
      showEmail: 'Показывать email',
      showPhone: 'Показывать телефон',
      showLocation: 'Показывать местоположение',
      showStats: 'Показывать статистику',
    },
  },

  badgeGallery: {
    tabs: {
      earned: 'Полученные',
      locked: 'Закрытые',
      all: 'Все',
    },
    categories: {
      skill: 'Навыки',
      participation: 'Участие',
      achievement: 'Достижения',
      special: 'Специальные',
    },
    badges: {
      firstMatch: 'Первый матч',
      firstWin: 'Первая победа',
      winStreak: 'Серия побед',
      clubMember: 'Участник клуба',
      tournamentWinner: 'Победитель турнира',
      socialButterfly: 'Социальная бабочка',
    },
  },

  clubLeaguesTournaments: {
    filters: {
      all: 'Все',
      upcoming: 'Предстоящие',
      ongoing: 'Текущие',
      completed: 'Завершённые',
    },
    status: {
      registration: 'Регистрация',
      inProgress: 'В процессе',
      completed: 'Завершён',
      cancelled: 'Отменён',
    },
  },

  clubDuesManagement: {
    tabs: {
      overview: 'Обзор',
      members: 'Участники',
      payments: 'Платежи',
      settings: 'Настройки',
    },
    paymentStatus: {
      paid: 'Оплачено',
      pending: 'В ожидании',
      overdue: 'Просрочено',
      partial: 'Частично',
    },
  },

  aiMatching: {
    compatibility: {
      excellent: 'Отлично',
      good: 'Хорошо',
      fair: 'Нормально',
      poor: 'Плохо',
    },
    factors: {
      skill: 'Навыки',
      schedule: 'Расписание',
      location: 'Местоположение',
      playStyle: 'Стиль игры',
    },
  },

  meetupDetail: {
    tabs: {
      details: 'Детали',
      participants: 'Участники',
      chat: 'Чат',
    },
    rsvp: {
      going: 'Иду',
      notGoing: 'Не иду',
      maybe: 'Возможно',
    },
  },

  editProfile: {
    validation: {
      nameRequired: 'Требуется имя',
      invalidEmail: 'Неверный email',
      invalidPhone: 'Неверный номер телефона',
    },
  },

  createMeetup: {
    validation: {
      titleRequired: 'Требуется название',
      dateRequired: 'Требуется дата',
      locationRequired: 'Требуется местоположение',
    },
  },

  createClubTournament: {
    tabs: {
      basic: 'Основное',
      settings: 'Настройки',
      prizes: 'Призы',
      rules: 'Правила',
    },
  },

  performanceDashboard: {
    periods: {
      week: 'Неделя',
      month: 'Месяц',
      year: 'Год',
      allTime: 'Всё время',
    },
    metrics: {
      matches: 'Матчи',
      wins: 'Победы',
      losses: 'Поражения',
      winRate: 'Процент побед',
      eloRating: 'ELO',
    },
  },

  matches: {
    filters: {
      all: 'Все',
      upcoming: 'Предстоящие',
      past: 'Прошлые',
      ranked: 'Рейтинговые',
      friendly: 'Дружеские',
    },
  },

  profile: {
    tabs: {
      overview: 'Обзор',
      stats: 'Статистика',
      achievements: 'Достижения',
      activity: 'Активность',
    },
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

console.log('✅ Batch 3 MEGA Russian translations applied successfully!');
console.log('\n📊 Nested structures translated:');
console.log('  - services.camera & services.location: ~10 keys');
console.log('  - leagueDetail (match status & admin): ~15 keys');
console.log('  - duesManagement.modals: ~10 keys');
console.log('  - emailLogin (title, labels, buttons, toggle, emailStatus): ~15 keys');
console.log('  - createEvent (eventType, fields, placeholders, gameTypes): ~15 keys');
console.log('  - profileSettings (sections, fields, privacy): ~18 keys');
console.log('  - badgeGallery (tabs, categories, badges): ~12 keys');
console.log('  - clubLeaguesTournaments (filters, status): ~8 keys');
console.log('  - clubDuesManagement (tabs, paymentStatus): ~8 keys');
console.log('  - aiMatching (compatibility, factors): ~8 keys');
console.log('  - meetupDetail (tabs, rsvp): ~6 keys');
console.log('  - editProfile, createMeetup validation: ~6 keys');
console.log('  - performanceDashboard, matches, profile: ~15 keys');
console.log('\n  BATCH 3 TOTAL: ~150+ nested keys translated');
