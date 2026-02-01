#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Set nested value by path
function setByPath(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

// Russian translations - Batch 2 (300+ more keys)
const translations = {
  // Event Management
  'events.create.title': 'Создать событие',
  'events.create.name': 'Название события',
  'events.create.namePlaceholder': 'например, Воскресная открытая игра',
  'events.create.description': 'Описание',
  'events.create.descriptionPlaceholder': 'Опишите ваше событие',
  'events.create.date': 'Дата',
  'events.create.time': 'Время',
  'events.create.location': 'Место',
  'events.create.maxParticipants': 'Максимальное количество участников',
  'events.create.skillLevel': 'Уровень навыка',
  'events.create.eventType': 'Тип события',
  'events.create.createButton': 'Создать событие',
  'events.create.creating': 'Создание события...',
  'events.create.success': 'Событие успешно создано!',
  'events.create.error': 'Не удалось создать событие',
  'events.edit.title': 'Редактировать событие',
  'events.edit.saveButton': 'Сохранить изменения',
  'events.edit.saving': 'Сохранение...',
  'events.edit.success': 'Событие обновлено!',
  'events.edit.error': 'Не удалось обновить событие',
  'events.delete.confirmTitle': 'Удалить событие?',
  'events.delete.confirmMessage': 'Это действие нельзя отменить',
  'events.delete.deleting': 'Удаление...',
  'events.delete.success': 'Событие удалено',
  'events.delete.error': 'Не удалось удалить событие',
  'events.list.title': 'События',
  'events.list.upcoming': 'Предстоящие',
  'events.list.past': 'Прошедшие',
  'events.list.myEvents': 'Мои события',
  'events.list.noEvents': 'Нет событий',
  'events.list.loading': 'Загрузка событий...',
  'events.detail.participants': 'Участники',
  'events.detail.organizer': 'Организатор',
  'events.detail.joinEvent': 'Присоединиться',
  'events.detail.leaveEvent': 'Покинуть',
  'events.detail.eventFull': 'Событие заполнено',
  'events.detail.joined': 'Вы присоединились!',
  'events.detail.left': 'Вы покинули событие',
  'events.detail.joinError': 'Не удалось присоединиться',
  'events.detail.leaveError': 'Не удалось покинуть событие',

  // Tournament Management
  'tournament.create.title': 'Создать турнир',
  'tournament.create.name': 'Название турнира',
  'tournament.create.namePlaceholder': 'например, Весенний кубок',
  'tournament.create.format': 'Формат',
  'tournament.create.singleElimination': 'Одиночное выбывание',
  'tournament.create.doubleElimination': 'Двойное выбывание',
  'tournament.create.roundRobin': 'Круговая система',
  'tournament.create.startDate': 'Дата начала',
  'tournament.create.endDate': 'Дата окончания',
  'tournament.create.registrationDeadline': 'Крайний срок регистрации',
  'tournament.create.maxPlayers': 'Максимум игроков',
  'tournament.create.entryFee': 'Взнос за участие',
  'tournament.create.prizes': 'Призы',
  'tournament.create.rules': 'Правила',
  'tournament.create.createButton': 'Создать турнир',
  'tournament.create.creating': 'Создание турнира...',
  'tournament.create.success': 'Турнир успешно создан!',
  'tournament.create.error': 'Не удалось создать турнир',
  'tournament.bpaddle.title': 'Сетка турнира',
  'tournament.bpaddle.round': 'Раунд',
  'tournament.bpaddle.quarterfinals': 'Четвертьфиналы',
  'tournament.bpaddle.semifinals': 'Полуфиналы',
  'tournament.bpaddle.finals': 'Финалы',
  'tournament.bpaddle.winner': 'Победитель',
  'tournament.bpaddle.generateBracket': 'Создать сетку',
  'tournament.bpaddle.seedPlayers': 'Распределить игроков',
  'tournament.bpaddle.randomize': 'Случайный порядок',
  'tournament.register.title': 'Регистрация на турнир',
  'tournament.register.confirmMessage': 'Вы уверены, что хотите зарегистрироваться?',
  'tournament.register.registerButton': 'Зарегистрироваться',
  'tournament.register.registering': 'Регистрация...',
  'tournament.register.success': 'Вы зарегистрированы!',
  'tournament.register.error': 'Не удалось зарегистрироваться',
  'tournament.register.alreadyRegistered': 'Вы уже зарегистрированы',
  'tournament.register.tournamentFull': 'Турнир заполнен',
  'tournament.register.registrationClosed': 'Регистрация закрыта',

  // Player Stats & Analytics
  'stats.overview.title': 'Статистика',
  'stats.overview.matchesPlayed': 'Сыгранные матчи',
  'stats.overview.matchesWon': 'Выигранные матчи',
  'stats.overview.matchesLost': 'Проигранные матчи',
  'stats.overview.winRate': 'Процент побед',
  'stats.overview.currentStreak': 'Текущая серия',
  'stats.overview.longestStreak': 'Самая длинная серия',
  'stats.overview.rank': 'Рейтинг',
  'stats.overview.rankChange': 'Изменение рейтинга',
  'stats.performance.title': 'Производительность',
  'stats.performance.last30Days': 'Последние 30 дней',
  'stats.performance.last90Days': 'Последние 90 дней',
  'stats.performance.allTime': 'За все время',
  'stats.performance.byOpponent': 'По оппонентам',
  'stats.performance.bySurface': 'По покрытию',
  'stats.performance.byWeather': 'По погоде',
  'stats.matchHistory.title': 'История матчей',
  'stats.matchHistory.date': 'Дата',
  'stats.matchHistory.opponent': 'Оппонент',
  'stats.matchHistory.score': 'Счет',
  'stats.matchHistory.result': 'Результат',
  'stats.matchHistory.duration': 'Длительность',
  'stats.matchHistory.location': 'Место',
  'stats.matchHistory.noMatches': 'Нет матчей',
  'stats.achievements.title': 'Достижения',
  'stats.achievements.unlocked': 'Разблокировано',
  'stats.achievements.locked': 'Заблокировано',
  'stats.achievements.progress': 'Прогресс',

  // Social Features
  'social.friends.title': 'Друзья',
  'social.friends.addFriend': 'Добавить друга',
  'social.friends.findFriends': 'Найти друзей',
  'social.friends.searchPlaceholder': 'Поиск по имени или email',
  'social.friends.sendRequest': 'Отправить запрос',
  'social.friends.acceptRequest': 'Принять запрос',
  'social.friends.declineRequest': 'Отклонить запрос',
  'social.friends.removeFriend': 'Удалить из друзей',
  'social.friends.friendRequests': 'Запросы в друзья',
  'social.friends.noFriends': 'Нет друзей',
  'social.friends.noRequests': 'Нет запросов',
  'social.friends.requestSent': 'Запрос отправлен',
  'social.friends.requestAccepted': 'Запрос принят',
  'social.friends.requestDeclined': 'Запрос отклонен',
  'social.friends.friendRemoved': 'Друг удален',
  'social.activity.title': 'Активность',
  'social.activity.recent': 'Недавняя активность',
  'social.activity.matchCompleted': 'завершил матч',
  'social.activity.achievementUnlocked': 'разблокировал достижение',
  'social.activity.joinedClub': 'присоединился к клубу',
  'social.activity.wonTournament': 'выиграл турнир',
  'social.activity.noActivity': 'Нет активности',
  'social.messages.title': 'Сообщения',
  'social.messages.newMessage': 'Новое сообщение',
  'social.messages.messagePlaceholder': 'Введите сообщение...',
  'social.messages.send': 'Отправить',
  'social.messages.noMessages': 'Нет сообщений',
  'social.messages.typing': 'печатает...',

  // Club Features
  'club.create.title': 'Создать клуб',
  'club.create.clubName': 'Название клуба',
  'club.create.clubNamePlaceholder': 'Введите название клуба',
  'club.create.description': 'Описание',
  'club.create.descriptionPlaceholder': 'Опишите ваш клуб',
  'club.create.location': 'Расположение',
  'club.create.clubType': 'Тип клуба',
  'club.create.public': 'Публичный',
  'club.create.private': 'Частный',
  'club.create.inviteOnly': 'Только по приглашению',
  'club.create.createButton': 'Создать клуб',
  'club.create.creating': 'Создание клуба...',
  'club.create.success': 'Клуб успешно создан!',
  'club.create.error': 'Не удалось создать клуб',
  'club.settings.title': 'Настройки клуба',
  'club.settings.general': 'Общие',
  'club.settings.members': 'Участники',
  'club.settings.permissions': 'Разрешения',
  'club.settings.notifications': 'Уведомления',
  'club.settings.saveChanges': 'Сохранить изменения',
  'club.settings.saving': 'Сохранение...',
  'club.settings.saved': 'Изменения сохранены',
  'club.settings.saveError': 'Не удалось сохранить',
  'club.members.title': 'Участники',
  'club.members.admin': 'Администратор',
  'club.members.moderator': 'Модератор',
  'club.members.member': 'Участник',
  'club.members.inviteMember': 'Пригласить участника',
  'club.members.removeMember': 'Удалить участника',
  'club.members.changeRole': 'Изменить роль',
  'club.members.noMembers': 'Нет участников',
  'club.announcements.title': 'Объявления',
  'club.announcements.createAnnouncement': 'Создать объявление',
  'club.announcements.editAnnouncement': 'Редактировать объявление',
  'club.announcements.deleteAnnouncement': 'Удалить объявление',
  'club.announcements.title': 'Заголовок',
  'club.announcements.content': 'Содержание',
  'club.announcements.publish': 'Опубликовать',
  'club.announcements.save': 'Сохранить',
  'club.announcements.noAnnouncements': 'Нет объявлений',

  // Settings & Preferences
  'settings.profile.title': 'Профиль',
  'settings.profile.editProfile': 'Редактировать профиль',
  'settings.profile.profilePicture': 'Фото профиля',
  'settings.profile.changePicture': 'Изменить фото',
  'settings.profile.displayName': 'Отображаемое имя',
  'settings.profile.bio': 'О себе',
  'settings.profile.bioPlaceholder': 'Расскажите о себе',
  'settings.profile.playingStyle': 'Стиль игры',
  'settings.profile.favoriteShot': 'Любимый удар',
  'settings.profile.yearsPlaying': 'Лет игры',
  'settings.privacy.title': 'Конфиденциальность',
  'settings.privacy.profileVisibility': 'Видимость профиля',
  'settings.privacy.showStats': 'Показывать статистику',
  'settings.privacy.showLocation': 'Показывать местоположение',
  'settings.privacy.allowMessages': 'Разрешить сообщения',
  'settings.notifications.title': 'Уведомления',
  'settings.notifications.pushNotifications': 'Push-уведомления',
  'settings.notifications.emailNotifications': 'Email-уведомления',
  'settings.notifications.matchReminders': 'Напоминания о матчах',
  'settings.notifications.friendRequests': 'Запросы в друзья',
  'settings.notifications.clubUpdates': 'Обновления клуба',
  'settings.notifications.tournamentUpdates': 'Обновления турнира',
  'settings.account.title': 'Аккаунт',
  'settings.account.email': 'Email',
  'settings.account.changePassword': 'Изменить пароль',
  'settings.account.deleteAccount': 'Удалить аккаунт',
  'settings.account.confirmDelete': 'Подтвердить удаление аккаунта',
  'settings.account.confirmDeleteMessage':
    'Это действие нельзя отменить. Все ваши данные будут удалены.',
  'settings.language.title': 'Язык',
  'settings.language.selectLanguage': 'Выберите язык',
  'settings.language.english': 'English',
  'settings.language.korean': '한국어',
  'settings.language.russian': 'Русский',

  // Booking & Scheduling
  'booking.court.title': 'Бронирование корта',
  'booking.court.selectCourt': 'Выберите корт',
  'booking.court.selectDate': 'Выберите дату',
  'booking.court.selectTime': 'Выберите время',
  'booking.court.duration': 'Длительность',
  'booking.court.oneHour': '1 час',
  'booking.court.oneHalfHours': '1.5 часа',
  'booking.court.twoHours': '2 часа',
  'booking.court.bookCourt': 'Забронировать корт',
  'booking.court.booking': 'Бронирование...',
  'booking.court.success': 'Корт успешно забронирован!',
  'booking.court.error': 'Не удалось забронировать корт',
  'booking.court.unavailable': 'Недоступно',
  'booking.court.available': 'Доступно',
  'booking.myBookings.title': 'Мои бронирования',
  'booking.myBookings.upcoming': 'Предстоящие',
  'booking.myBookings.past': 'Прошедшие',
  'booking.myBookings.cancelBooking': 'Отменить бронирование',
  'booking.myBookings.confirmCancel': 'Подтвердить отмену',
  'booking.myBookings.confirmCancelMessage': 'Вы уверены, что хотите отменить это бронирование?',
  'booking.myBookings.cancelled': 'Бронирование отменено',
  'booking.myBookings.cancelError': 'Не удалось отменить бронирование',
  'booking.myBookings.noBookings': 'Нет бронирований',

  // Payment & Billing
  'payment.title': 'Оплата',
  'payment.selectMethod': 'Выберите способ оплаты',
  'payment.creditCard': 'Кредитная карта',
  'payment.debitCard': 'Дебетовая карта',
  'payment.bankTransfer': 'Банковский перевод',
  'payment.cardNumber': 'Номер карты',
  'payment.expiryDate': 'Срок действия',
  'payment.cvv': 'CVV',
  'payment.cardholderName': 'Имя владельца карты',
  'payment.billingAddress': 'Адрес для выставления счетов',
  'payment.payNow': 'Оплатить сейчас',
  'payment.processing': 'Обработка платежа...',
  'payment.success': 'Платеж успешен!',
  'payment.error': 'Не удалось обработать платеж',
  'payment.cancelled': 'Платеж отменен',
  'payment.refund': 'Возврат средств',
  'payment.refundProcessing': 'Обработка возврата...',
  'payment.refundSuccess': 'Возврат обработан',
  'payment.refundError': 'Не удалось обработать возврат',

  // Help & Support
  'help.title': 'Помощь и поддержка',
  'help.faq': 'Часто задаваемые вопросы',
  'help.contactSupport': 'Связаться с поддержкой',
  'help.reportBug': 'Сообщить об ошибке',
  'help.featureRequest': 'Запросить функцию',
  'help.userGuide': 'Руководство пользователя',
  'help.tutorials': 'Учебные пособия',
  'help.search': 'Поиск в справке',
  'help.searchPlaceholder': 'Как мы можем помочь?',
  'help.noResults': 'Результатов не найдено',
  'help.contactForm.subject': 'Тема',
  'help.contactForm.message': 'Сообщение',
  'help.contactForm.send': 'Отправить',
  'help.contactForm.sending': 'Отправка...',
  'help.contactForm.success': 'Сообщение отправлено!',
  'help.contactForm.error': 'Не удалось отправить сообщение',
};

// Main execution
const ruPath = path.join(__dirname, '../src/locales/ru.json');

console.log('📖 Reading Russian translation file...');
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

console.log(`📝 Applying ${Object.keys(translations).length} translations (Batch 2)...\n`);

// Apply all translations
const updatedRu = { ...ru };
let count = 0;

for (const [path, value] of Object.entries(translations)) {
  setByPath(updatedRu, path, value);
  count++;
  if (count % 50 === 0) {
    console.log(`  ✓ ${count} translations applied...`);
  }
}

console.log(`\n✅ Total ${count} translations applied (Batch 2)!`);
console.log('\n💾 Writing updated Russian translation file...');

fs.writeFileSync(ruPath, JSON.stringify(updatedRu, null, 2), 'utf8');

console.log('\n🎉 Batch 2 completed successfully!');
console.log(`\n📊 Summary:`);
console.log(`   - Batch 2 translations: ${count}`);
console.log(`   - File: src/locales/ru.json`);
console.log(`\n✨ All done!\n`);
