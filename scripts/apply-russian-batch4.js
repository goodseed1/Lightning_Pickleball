/**
 * Apply Russian translations batch 4 (FINAL PUSH) to ru.json
 * Targeting the top remaining sections to maximize impact
 */
const fs = require('fs');
const path = require('path');

const ruPath = path.join(__dirname, '../src/locales/ru.json');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));

// Russian translations batch 4 - FINAL PUSH
const translations = {
  createClubTournament: {
    loadingMembers: 'Загрузка членов...',
    headerSubtitle: 'Начните турнир с членами вашего клуба',
    matchTypeSubtitle: 'Какой тип матчей будет в этом турнире?',
    tournamentNamePlaceholder: 'например, Турнир {eventType} 2025',
    descriptionPlaceholder: 'Введите краткое описание турнира',
    advancedSettings: 'Дополнительные настройки',
    shortSets: 'Короткие сеты',
    shortSetsDescription: 'Сеты из 4 игр (обычно 6 игр)',
    seedingMethod: 'Метод посева',
    matchFormats: {
      best_of_1_description: 'Матч из одного сета',
      best_of_3_description: 'До 2 побед',
      best_of_5_description: 'До 3 побед',
    },
    seedingMethods: {
      manual_description: 'Админ назначает посевы вручную',
      random: 'Случайный',
      random_description: 'Справедливый случайный посев (независимо от навыков)',
      ranking: 'Рейтинг клуба',
      ranking_description: 'Посевы на основе рейтинга клуба и процента побед',
      rating: 'Личный рейтинг',
      rating_description: 'Посевы на основе рейтинга ELO и уровня навыков',
    },
    eventTypes: {
      mens_singles: 'Мужской одиночный',
      mens_singles_description: 'Мужской матч 1 на 1',
      womens_singles: 'Женский одиночный',
      womens_singles_description: 'Женский матч 1 на 1',
      mens_doubles: 'Мужской парный',
      mens_doubles_description: 'Мужской матч 2 на 2',
      womens_doubles: 'Женский парный',
      womens_doubles_description: 'Женский матч 2 на 2',
      mixed_doubles_description: 'Смешанный матч 2 на 2',
    },
    errors: {
      nameRequired: 'Пожалуйста, введите название турнира',
      deadlineBeforeStart: 'Срок подачи заявок должен быть не позже даты начала',
      endBeforeStart: 'Дата окончания должна быть не раньше даты начала',
      maxPlayersInvalid: 'Максимум участников должен быть не менее {min} (минимум для начала)',
    },
    success: {
      created: 'Турнир успешно создан',
    },
  },

  types: {
    match: {
      matchStatus: {
        disputed: 'Оспаривается',
      },
      validation: {
        minOneSet: 'Должен быть введен как минимум один сет.',
        regularSet: 'обычный сет',
        shortSet: 'короткий сет',
        tiebreak: 'тай-брейк',
        superTiebreak: 'супер тай-брейк',
      },
    },
    clubSchedule: {
      scheduleTypes: {
        practice: 'Тренировка',
        social: 'Социальный теннис',
        league_match: 'Матч лиги',
        clinic: 'Тренировочная клиника',
        meeting: 'Встреча клуба',
        beginner_friendly: 'Для начинающих',
        advanced_only: 'Только продвинутые',
        custom: 'Пользовательское событие',
      },
      recurrence: {
        weekly: 'Каждую неделю',
        biweekly: 'Каждые две недели',
        monthly: 'Каждый месяц',
        custom: 'Пользовательское расписание',
      },
      timePeriod: {
        am: 'До полудня',
        pm: 'После полудня',
      },
    },
    dues: {
      duesTypes: {
        yearly: 'Годовые взносы',
      },
      paymentStatus: {
        pending_approval: 'Ожидает утверждения',
      },
    },
    tournament: {
      validation: {
        singlesNoPartner: 'Одиночные турниры не требуют партнера.',
        mensSinglesMaleOnly: 'Мужской одиночный только для мужчин.',
        womensSinglesFemaleOnly: 'Женский одиночный только для женщин.',
        doublesPartnerRequired: 'Парные турниры требуют партнера.',
        mensDoublesMaleOnly: 'Мужской парный только для мужчин.',
        womensDoublesFemaleOnly: 'Женский парный только для женщин.',
        mixedDoublesRequirement: 'Смешанный парный требует одного мужчину и одну женщину.',
      },
      eventTypes: {
        mens_singles: 'Мужской одиночный',
        womens_singles: 'Женский одиночный',
        mens_doubles: 'Мужской парный',
        womens_doubles: 'Женский парный',
      },
    },
  },

  profile: {
    settings: {
      notifications: 'Настройки уведомлений',
      profileSettings: 'Настройки профиля',
      appSettings: 'Настройки приложения',
    },
    userProfile: {
      screenTitle: 'Профиль пользователя',
      loading: 'Загрузка профиля...',
      notFound: 'Профиль не найден',
      backButton: 'Назад',
      defaultNickname: 'Теннисист',
      noLocation: 'Нет информации о местоположении',
      friendRequest: {
        title: 'Запрос дружбы',
        successMessage: 'Запрос дружбы отправлен!',
        cannotSend: 'Невозможно отправить запрос дружбы.',
      },
      sendMessage: {
        loginRequired: 'Требуется вход.',
      },
      actionButtons: {
        addFriend: 'Добавить в друзья',
        sendMessage: 'Отправить сообщение',
      },
      rankings: {
        title: 'Рейтинги',
      },
      stats: {
        title: 'Статистика матчей',
        wins: 'Победы',
        losses: 'Поражения',
        winRate: 'Процент побед',
      },
      playerInfo: {
        title: 'Информация об игроке',
        languages: 'Языки',
        weekdays: 'Будни',
        weekends: 'Выходные',
        noInfo: 'Нет информации',
      },
      matchHistory: {
        title: 'История недавних матчей',
        win: 'П',
        loss: 'Пр',
        score: 'Счет:',
      },
      timeSlots: {
        earlyMorning: 'Раннее утро',
        brunch: 'Поздний завтрак',
      },
    },
  },

  myActivities: {
    stats: {
      eloRatingTrend: 'Тренд рейтинга ELO',
      lastSixMonths: 'Последние 6 месяцев',
      currentEloRating: 'Текущий рейтинг ELO',
      intermediateTier: 'Средний уровень',
      wins: 'Победы',
      losses: 'Поражения',
      recentMatchResults: 'Результаты недавних матчей',
      noRankedMatches: 'Пока нет рейтинговых матчей',
    },
    settings: {
      lightningMatchNotifications: 'Уведомления быстрых матчей',
      newMatchRequestNotifications: 'Уведомления о новых запросах матчей',
      chatNotifications: 'Уведомления чата',
      messageAndCommentNotifications: 'Уведомления о сообщениях и комментариях',
      profileSettings: 'Настройки профиля',
      editNicknameSkillLocation: 'Изменить никнейм, уровень навыков, местоположение, языки и т.д.',
      appSettings: 'Настройки приложения',
      languageChangeComingSoon: 'Функция смены языка скоро появится.',
      languageSettings: 'Языковые настройки',
      privacySettingsComingSoon: 'Функция настроек конфиденциальности скоро появится.',
      profileVisibilitySettings: 'Настройки видимости профиля',
      signOut: 'Выйти',
    },
    alerts: {
      signOut: {
        title: 'Выйти',
        message: 'Вы уверены, что хотите выйти?',
        confirm: 'Выйти',
      },
      partnerInvitation: {
        success: {
          message: 'Приглашение партнера принято!',
        },
        rejected: {
          message: 'Приглашение партнера отклонено. Вы можете повторно принять в течение 24 часов.',
        },
      },
      friendInvitation: {
        accepted: {
          title: 'Принято',
          message: 'Приглашение дружбы принято!',
        },
        rejected: {
          message: 'Приглашение дружбы отклонено.',
        },
        error: {
          acceptMessage: 'Произошла ошибка при принятии приглашения.',
          rejectMessage: 'Произошла ошибка при отклонении приглашения.',
        },
      },
      eventEdit: {
        message: 'Функция редактирования событий скоро появится.',
      },
    },
  },

  matches: {
    tabs: {
      personal: 'Личные матчи',
      club: 'События клуба',
    },
    createButton: {
      newMatch: 'Создать новый матч',
    },
    card: {
      recurring: 'Повторяющийся',
      pending: ' (Ожидает)',
      manageButton: 'Управление',
    },
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    recurringPatterns: {
      biweekly: 'Раз в две недели',
      weeklyMonday: 'Каждый понедельник',
    },
    createModal: {
      title: {
        label: 'Название *',
        placeholder: 'например, Выходная парная игра',
      },
      matchType: {
        personal: 'Личный матч',
        club: 'Событие клуба',
      },
      clubSelection: {
        label: 'Выбрать клуб',
      },
      dateTime: {
        label: 'Дата и время',
      },
      recurring: {
        label: 'Повторяющийся',
      },
      maxParticipants: {
        placeholder: '4',
      },
      description: {
        placeholder: 'Введите дополнительную информацию о матче',
      },
      createButton: 'Создать матч',
    },
    alerts: {
      inputError: {
        message: 'Название и местоположение обязательны',
      },
      joinMatch: {
        title: 'Присоединиться к матчу',
        message: 'Хотите присоединиться к этому матчу?',
        successMessage: 'Ваш запрос на участие в матче завершен.',
      },
    },
    mockData: {
      me: 'Я',
      weekendDoubles: 'Выходной парный матч',
      weekendDescription: 'Расслабленный парный матч',
      mondayTraining: 'Регулярная понедельничная тренировка',
      mondayDescription: 'Еженедельная вечерняя тренировка по понедельникам',
    },
  },
};

// Deep merge function
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Apply translations
deepMerge(ru, translations);

// Save updated ru.json
fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2) + '\n');

console.log('✅ Russian translations batch 4 applied successfully!');
console.log('\nUpdated sections:');
console.log('- createClubTournament: 33 keys');
console.log('- types: 33 keys');
console.log('- profile: 31 keys');
console.log('- myActivities: 31 keys');
console.log('- matches: 31 keys');
console.log('\nTotal: 159 keys translated');
console.log('\n🎯 Total Round 5 progress: 863 keys translated!');
