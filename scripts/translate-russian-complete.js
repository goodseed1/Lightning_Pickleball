#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// COMPLETE REMAINING TRANSLATIONS
const translations = {
  services: {
    event: {
      playerCount: '   👥 {{current}}/{{max}} игроков',
    },

    match: {
      participantNotFound: 'Информация об участнике не найдена.',
      invalidEventType: 'Тип события {{eventType}} должен использовать формат {{expectedFormat}}.',
      matchNotFound: 'Матч не найден.',
      onlyParticipantCanSubmit: 'Только участники матча могут отправлять счет.',
      noPermissionToConfirm: 'У вас нет разрешения подтверждать этот счет.',
      notDisputed: 'Этот матч не находится в статусе спора.',
    },

    activity: {
      loginRequired: 'Вы должны войти в систему',
      permissionDenied: 'Доступ запрещен',
      activityNotFound: 'Активность не найдена',
      invalidData: 'Неверные данные',
    },
  },

  duesManagement: {
    alerts: {
      ok: 'ОК',
      saved: 'Сохранено',
      saveFailed: 'Не удалось сохранить',
      loadFailed: 'Не удалось загрузить данные',
      reminderSent: 'Напоминание отправлено',
      settingsRequired: 'Требуются настройки',
      enableAutoInvoice: 'Включить автоматические счета',
      completed: 'Завершено',
      invalidAmount: 'Неверная сумма',
      paymentProcessed: 'Платеж обработан',
      refundIssued: 'Возврат выполнен',
    },

    fields: {
      memberName: 'Имя участника',
      dueAmount: 'Сумма взноса',
      dueDate: 'Срок оплаты',
      paidAmount: 'Оплаченная сумма',
      balance: 'Остаток',
      lastPayment: 'Последний платеж',
      nextDue: 'Следующий взнос',
    },
  },

  leagueDetail: {
    applicationCompleteMessage: 'Ваша заявка на лигу отправлена. Ожидайте одобрения.',
    applicationFailed: 'Заявка не удалась',
    applicationFailedMessage: 'Ошибка отправки заявки на лигу. Попробуйте снова.',
    invitationSent: 'Приглашение отправлено',
    teamApplicationFailedMessage: 'Ошибка отправки заявки на командную лигу.',
    applicationPending: 'Заявка на лигу ожидает рассмотрения.',
    applicationApproved: 'Вас одобрили для участия в лиге!',
    applicationRejected: 'Ваша заявка на лигу отклонена.',
    confirmWithdrawal: 'Подтвердить отзыв',
    withdrawalConfirm: 'Вы уверены, что хотите отозвать заявку?',
  },

  types: {
    match: {
      matchTypes: {
        league: 'Лиговый матч',
        tournament: 'Турнир',
        lightning_match: 'Быстрый матч',
        practice: 'Тренировочный матч',
        friendly: 'Дружеский матч',
        competitive: 'Соревновательный',
      },

      matchStatus: {
        scheduled: 'Запланирован',
        in_progress: 'В процессе',
        partner_pending: 'Ожидание партнера',
        pending_confirmation: 'Ожидает подтверждения',
        confirmed: 'Подтвержден',
        cancelled: 'Отменен',
        completed: 'Завершен',
      },

      matchFormats: {
        singles: 'Одиночный',
        doubles: 'Парный',
        mixed: 'Смешанный',
      },
    },

    tournament: {
      formats: {
        singleElimination: 'Одиночное выбывание',
        doubleElimination: 'Двойное выбывание',
        roundRobin: 'Круговая система',
        swiss: 'Швейцарская система',
      },
    },

    event: {
      types: {
        match: 'Матч',
        tournament: 'Турнир',
        practice: 'Тренировка',
        social: 'Социальное',
        clinic: 'Клиника',
        league: 'Лига',
      },
    },
  },

  createEvent: {
    fields: {
      smsFriendInvitations: 'SMS-приглашения друзей',
      sendSmsInvitations: 'Отправить SMS-приглашения',
      skillLevelMultiple: 'Уровень NTRP * (Множественный выбор)',
      selectSkillLevelsDesc: 'Выберите все уровни, которые приветствуете',
      matchLevelAuto: 'Уровень матча (Авто-расчет)',
      skillLevel: 'Уровень навыка',
      recommendedLevel: 'Рекомендуемый уровень',
      anyLevel: 'Любой уровень',
      beginnerFriendly: 'Для начинающих',
      advancedOnly: 'Только продвинутые',
      competitive: 'Соревновательный',
      casual: 'Обычный',
    },

    validation: {
      skillLevelRequired: 'Требуется уровень навыка',
      participantsRequired: 'Требуется мин. участников',
      invalidSkillLevel: 'Неверный уровень навыка',
    },
  },

  clubLeaguesTournaments: {
    filters: {
      upcoming: 'Предстоящие',
      active: 'Активные',
      completed: 'Завершенные',
      myTournaments: 'Мои турниры',
      myLeagues: 'Мои лиги',
    },

    status: {
      registration: 'Регистрация',
      full: 'Заполнено',
      cancelled: 'Отменено',
    },
  },

  clubTournamentManagement: {
    buttons: {
      generateDraw: 'Создать сетку',
      publishSchedule: 'Опубликовать расписание',
      finalizeResults: 'Утвердить результаты',
      sendNotifications: 'Отправить уведомления',
    },

    messages: {
      drawGenerated: 'Сетка создана',
      schedulePublished: 'Расписание опубликовано',
      resultsFinalized: 'Результаты утверждены',
      notificationsSent: 'Уведомления отправлены',
    },
  },

  emailLogin: {
    createAccount: 'Создать аккаунт',
    signInWith: 'Войти с помощью',
    or: 'или',
    continueAsGuest: 'Продолжить как гость',
  },

  club: {
    categories: {
      recreational: 'Развлекательный',
      competitive: 'Соревновательный',
      social: 'Социальный',
      junior: 'Юниоры',
      adult: 'Взрослые',
      senior: 'Сениоры',
    },
  },

  myActivities: {
    calendar: {
      day: 'День',
      week: 'Неделя',
      month: 'Месяц',
      year: 'Год',
      today: 'Сегодня',
      tomorrow: 'Завтра',
      yesterday: 'Вчера',
    },
  },

  matches: {
    invitations: {
      pending: 'Ожидающие',
      sent: 'Отправленные',
      received: 'Полученные',
      accepted: 'Принятые',
      declined: 'Отклоненные',
    },
  },

  profile: {
    completion: {
      title: 'Заполненность профиля',
      complete: 'Завершено',
      incomplete: 'Не завершено',
      percentage: '{{percent}}% завершено',
    },
  },

  discover: {
    tabs: {
      all: 'Все',
      players: 'Игроки',
      clubs: 'Клубы',
      events: 'События',
      nearby: 'Рядом',
    },
  },

  eventCard: {
    status: {
      upcoming: 'Предстоящее',
      ongoing: 'Идет',
      completed: 'Завершено',
      cancelled: 'Отменено',
    },
  },

  aiMatching: {
    preferences: {
      title: 'Предпочтения подбора',
      distance: 'Расстояние',
      skillLevel: 'Уровень',
      availability: 'Доступность',
      playStyle: 'Стиль игры',
    },
  },

  createMeetup: {
    recurrence: {
      title: 'Повторение',
      repeats: 'Повторяется',
      ends: 'Заканчивается',
      never: 'Никогда',
      after: 'После',
      on: 'В',
    },
  },

  scheduleMeetup: {
    reminders: {
      title: 'Напоминания',
      none: 'Нет',
      atTime: 'В момент события',
      before: 'До события',
    },
  },

  clubOverviewScreen: {
    amenities: {
      wifi: 'Wi-Fi',
      showers: 'Душевые',
      lockers: 'Шкафчики',
      parking: 'Парковка',
      restaurant: 'Ресторан',
      proShop: 'Магазин',
    },
  },

  badgeGallery: {
    achievements: {
      firstMatch: 'Первый матч',
      tenMatches: '10 матчей',
      hundredMatches: '100 матчей',
      firstWin: 'Первая победа',
      winStreak: 'Серия побед',
      participation: 'Участие',
    },
  },

  leagues: {
    divisions: {
      open: 'Открытый',
      beginner: 'Начинающий',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      pro: 'Профессиональный',
    },
  },

  // Additional common translations
  time: {
    seconds: 'секунд',
    minutes: 'минут',
    hours: 'часов',
    days: 'дней',
    weeks: 'недель',
    months: 'месяцев',
    years: 'лет',
    ago: 'назад',
    fromNow: 'через',
    justNow: 'только что',
  },

  date: {
    today: 'Сегодня',
    tomorrow: 'Завтра',
    yesterday: 'Вчера',
    thisWeek: 'На этой неделе',
    nextWeek: 'На следующей неделе',
    lastWeek: 'На прошлой неделе',
    thisMonth: 'В этом месяце',
    nextMonth: 'В следующем месяце',
    lastMonth: 'В прошлом месяце',
  },

  units: {
    meters: 'метров',
    kilometers: 'километров',
    miles: 'миль',
    feet: 'футов',
    celsius: '°C',
    fahrenheit: '°F',
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

console.log('✅ Russian translation COMPLETE batch finished!');
console.log(`📊 Translated ${translatedCount} keys in this batch`);
console.log(`📁 Updated: ${ruPath}`);

// Calculate totals
const totalTranslated = 401 + 337 + 334 + 311 + 270 + translatedCount;
console.log(`\n🎯 GRAND TOTAL: ${totalTranslated} keys translated across all batches`);
