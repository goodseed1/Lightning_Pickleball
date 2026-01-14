#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function deepSet(obj, pathStr, value) {
  const keys = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function findUntranslated(en, ru, prefix = '', results = []) {
  for (const key in en) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof en[key] === 'object' && !Array.isArray(en[key]) && en[key] !== null) {
      findUntranslated(en[key], ru[key] || {}, fullKey, results);
    } else if (typeof en[key] === 'string') {
      if (!ru[key] || ru[key] === en[key]) {
        results.push({ path: fullKey, en: en[key] });
      }
    }
  }
  return results;
}

function countUntranslated(en, ru) {
  let count = 0;
  for (const key in en) {
    if (typeof en[key] === 'object' && !Array.isArray(en[key]) && en[key] !== null) {
      count += countUntranslated(en[key], ru[key] || {});
    } else if (typeof en[key] === 'string' && (!ru[key] || ru[key] === en[key])) {
      count++;
    }
  }
  return count;
}

const enPath = path.join(__dirname, '../src/locales/en.json');
const ruPath = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

const before = countUntranslated(en, ru);
console.log(`Before: ${before} untranslated keys\n`);

const untranslated = findUntranslated(en, ru);

// Extended translation dictionary with all missing phrases
const dict = {
  // Camera/Permissions
  'Camera Permission Required': 'Требуется разрешение камеры',
  'Camera permission is needed to take profile photos.':
    'Разрешение камеры необходимо для съёмки фото профиля.',
  'Gallery Permission Required': 'Требуется разрешение галереи',
  'Gallery access permission is needed to select photos.':
    'Разрешение доступа к галерее необходимо для выбора фото.',
  'Please check app permissions in Settings > Privacy & Security > Photos.':
    'Пожалуйста, проверьте разрешения приложения в Настройки > Конфиденциальность и безопасность > Фото.',
  'Open Settings': 'Открыть настройки',
  'An error occurred while requesting permissions.': 'Произошла ошибка при запросе разрешений.',
  'An error occurred while taking photo.': 'Произошла ошибка при съёмке фото.',
  'Gallery Access Error': 'Ошибка доступа к галерее',
  'Permission is required to select photos.': 'Требуется разрешение для выбора фото.',

  // Dues Management messages
  'Late fee has been deleted.': 'Штраф за просрочку удалён.',
  'Join fee has been deleted.': 'Вступительный взнос удалён.',
  'Exemption has been removed.': 'Освобождение отозвано.',
  'Member set as exempt.': 'Участник отмечен как освобождённый.',
  'Record has been created.': 'Запись создана.',
  'QR code uploaded successfully.': 'QR-код загружен успешно.',
  'Upload failed. Please try again.': 'Загрузка не удалась. Попробуйте снова.',
  'Permission denied. Cannot access media library.':
    'Разрешение отклонено. Невозможно получить доступ к медиатеке.',
  'QR Code Details': 'Детали QR-кода',
  'QR code for bank transfer': 'QR-код для банковского перевода',
  'Upload QR Code Image': 'Загрузить изображение QR-кода',
  'Delete QR Code': 'Удалить QR-код',
  'Are you sure you want to delete this QR code?': 'Вы уверены, что хотите удалить этот QR-код?',
  'QR code has been deleted successfully.': 'QR-код успешно удалён.',
  'Failed to delete QR code.': 'Не удалось удалить QR-код.',
  'Uploading...': 'Загрузка...',
  'Photo selection cancelled': 'Выбор фото отменён',

  // League Detail
  'Result Corrected': 'Результат исправлен',
  'Schedule Changed': 'Расписание изменено',
  'Walkover Success': 'Техническая победа',
  'Bulk Approval Error': 'Ошибка массового одобрения',
  'Match Cancelled': 'Матч отменён',
  'Reschedule Success': 'Матч перенесён',
  'Reschedule Error': 'Ошибка переноса',
  'Approve All': 'Одобрить все',
  'Approve all pending match results?': 'Одобрить все ожидающие результаты матчей?',
  'All pending results have been approved.': 'Все ожидающие результаты одобрены.',
  'Change Schedule': 'Изменить расписание',
  'Process Walkover': 'Обработать техническую победу',
  'Correct Result': 'Исправить результат',
  'Delete Match': 'Удалить матч',
  'Are you sure you want to delete this match?': 'Вы уверены, что хотите удалить этот матч?',
  'Match has been deleted.': 'Матч удалён.',
  'Error deleting match': 'Ошибка удаления матча',
  'Select Winner': 'Выберите победителя',
  'Walkover ({{player}} wins by walkover)': 'Техническая победа ({{player}} побеждает техническ.)',
  'Cancellation reason:': 'Причина отмены:',

  // Club Tournament Management
  'Round {{current}} is complete.\\nGenerate Round {{next}}?':
    'Раунд {{current}} завершён.\nСоздать раунд {{next}}?',
  'Round {{round}} has been generated successfully.': 'Раунд {{round}} успешно создан.',
  'Failed to generate next round.': 'Не удалось создать следующий раунд.',
  'All matches in the current round must be completed.':
    'Все матчи текущего раунда должны быть завершены.',
  'Insufficient players to create next round.':
    'Недостаточно игроков для создания следующего раунда.',
  'Add Participant Manually': 'Добавить участника вручную',
  'Generating Bracket...': 'Создание сетки...',
  'View Bracket': 'Просмотр сетки',
  'Start Tournament': 'Начать турнир',
  'Tournament started successfully!': 'Турнир успешно начался!',
  'Failed to start tournament.': 'Не удалось начать турнир.',
  'Tournament must have at least 2 participants.': 'Турнир должен иметь минимум 2 участника.',
  'Tournament Results': 'Результаты турнира',
  'Publish Results': 'Опубликовать результаты',
  'Results have been published.': 'Результаты опубликованы.',
  'Failed to publish results.': 'Не удалось опубликовать результаты.',
  ' participants': ' участников',
  'Player 1': 'Игрок 1',
  'Player 2': 'Игрок 2',

  // Admin
  'Active Users\\n(24h)': 'Активные пользователи\n(24ч)',
  'New Matches\\n(24h)': 'Новые матчи\n(24ч)',
  Timestamp: 'Время',
  Severity: 'Серьёзность',
  'User Management': 'Управление пользователями',
  'Content Moderation': 'Модерация контента',
  'System Configuration': 'Конфиденциальность системы',
  'Backup & Restore': 'Резервное копирование и восстановление',
  'Performance Metrics': 'Показатели производительности',
  'Security Audit': 'Аудит безопасности',

  // Create Event
  'Event Name': 'Название события',
  'Event Description': 'Описание события',
  'Event Type': 'Тип события',
  'Start Date': 'Дата начала',
  'End Date': 'Дата окончания',
  'Start Time': 'Время начала',
  'End Time': 'Время окончания',
  Venue: 'Место проведения',
  'Max Participants': 'Макс. участников',
  'Min Participants': 'Мин. участников',
  'Registration Deadline': 'Срок регистрации',
  'Registration Fee': 'Регистрационный взнос',
  'Requires Approval': 'Требуется одобрение',
  'Enable Waitlist': 'Включить лист ожидания',
  'Invite Only': 'Только по приглашению',
  'Recurring Event': 'Повторяющееся событие',
  Frequency: 'Частота',
  Daily: 'Ежедневно',
  Weekly: 'Еженедельно',
  Monthly: 'Ежемесячно',
  Custom: 'Пользовательское',
  'Custom Fields': 'Пользовательские поля',
  'Rules & Requirements': 'Правила и требования',
  'Cancellation Policy': 'Политика отмены',
  'Save Draft': 'Сохранить черновик',
  'Publish Event': 'Опубликовать событие',
  'Preview Event': 'Предпросмотр события',
  'Event name is required': 'Название события обязательно',
  'Event date is required': 'Дата события обязательна',
  'Event location is required': 'Местоположение события обязательно',
  'Invalid date range': 'Неверный диапазон дат',
  'Start date must be before end date': 'Дата начала должна быть раньше даты окончания',
  'Date cannot be in the past': 'Дата не может быть в прошлом',
  'Invalid capacity': 'Неверная вместимость',
  'Max participants must be greater than min participants':
    'Макс. участников должно быть больше мин. участников',

  // Types
  Singles: 'Одиночный',
  Doubles: 'Парный',
  'Mixed Doubles': 'Смешанный парный',
  Team: 'Командный',
  Practice: 'Тренировочный',
  Friendly: 'Товарищеский',
  Competitive: 'Соревновательный',
  Casual: 'Обычный',
  Beginner: 'Новичок',
  Intermediate: 'Средний',
  Advanced: 'Продвинутый',
  Expert: 'Эксперт',
  Professional: 'Профессионал',
  Mixed: 'Смешанный',
  'All Levels': 'Все уровни',
  'Right-handed': 'Правша',
  'Left-handed': 'Левша',
  'One-handed': 'Одноручный',
  'Two-handed': 'Двуручный',
  Aggressive: 'Агрессивный',
  Defensive: 'Защитный',
  'All-court': 'Универсальный',
  Baseline: 'Задняя линия',
  'Serve and Volley': 'Подача и выход к сетке',

  // Club
  'Club Name': 'Название клуба',
  'Club Description': 'Описание клуба',
  'Club Rules': 'Правила клуба',
  'Code of Conduct': 'Кодекс поведения',
  'Dress Code': 'Дресс-код',
  'Booking Rules': 'Правила бронирования',
  'Guest Policy': 'Политика для гостей',
  Facilities: 'Удобства',
  'Locker Rooms': 'Раздевалки',
  Parking: 'Парковка',
  'Pro Shop': 'Магазин',
  Cafe: 'Кафе',
  Membership: 'Членство',
  'Membership Type': 'Тип членства',
  'Membership Benefits': 'Преимущества членства',
  'Membership Fees': 'Членские взносы',
  Renewal: 'Продление',
  Upgrade: 'Улучшение',
  'Active Membership': 'Активное членство',
  'Expired Membership': 'Истекшее членство',
  'Operating Hours': 'Часы работы',
  'Special Hours': 'Специальные часы',
  'Holiday Schedule': 'Праздничное расписание',

  // Email Login
  'Email Address': 'Адрес email',
  'Enter your email': 'Введите ваш email',
  'Enter your password': 'Введите ваш пароль',
  'Forgot password?': 'Забыли пароль?',
  'Sign in': 'Войти',
  'Sign in with email': 'Войти с email',
  'Create an account': 'Создать аккаунт',
  "Don't have an account?": 'Нет аккаунта?',
  'Already have an account?': 'Уже есть аккаунт?',
  'Reset Password': 'Сбросить пароль',
  'Send Reset Link': 'Отправить ссылку сброса',
  'Reset link sent': 'Ссылка сброса отправлена',
  'Check your email for password reset instructions':
    'Проверьте email для инструкций по сбросу пароля',
  'Return to Login': 'Вернуться ко входу',
  'Invalid email address': 'Неверный адрес email',
  'Password is required': 'Пароль обязателен',
  'Password must be at least 6 characters': 'Пароль должен содержать минимум 6 символов',
  'Email is required': 'Email обязателен',
  'Invalid login credentials': 'Неверные учётные данные',
  'User not found': 'Пользователь не найден',
  'Incorrect password': 'Неверный пароль',
  'Email already in use': 'Email уже используется',
  'Weak password': 'Слабый пароль',
  'Network error. Please check your connection.': 'Ошибка сети. Проверьте подключение.',
  'Email Verification': 'Подтверждение email',
  'Verification email sent': 'Письмо с подтверждением отправлено',
  'Please verify your email': 'Пожалуйста, подтвердите ваш email',
  'Resend verification email': 'Отправить письмо повторно',
  'Email verified': 'Email подтверждён',
  'Verification link expired': 'Ссылка подтверждения истекла',
  'Invalid verification link': 'Неверная ссылка подтверждения',

  // Discover
  'Nearby Players': 'Игроки рядом',
  'Nearby Clubs': 'Клубы рядом',
  'Nearby Courts': 'Корты рядом',
  'Upcoming Events': 'Предстоящие события',
  Distance: 'Расстояние',
  Availability: 'Доступность',
  'Skill Level': 'Уровень навыка',
  'Sort by': 'Сортировать по',
  Relevance: 'Релевантность',
  Popularity: 'Популярность',
  'Found {{count}} results': 'Найдено {{count}} результатов',
  'No results found': 'Нет результатов',
  'Try adjusting your filters': 'Попробуйте изменить фильтры',

  // My Activities
  'My Matches': 'Мои матчи',
  'My Events': 'Мои события',
  'My Tournaments': 'Мои турниры',
  'My Practices': 'Мои тренировки',
  'Activity Calendar': 'Календарь активностей',
  'Day View': 'День',
  'Week View': 'Неделя',
  'Month View': 'Месяц',
  'Agenda View': 'Повестка дня',
  'No activities scheduled': 'Нет запланированных активностей',
  'Find activities to join': 'Найти активности для участия',
  'Last week': 'Прошлая неделя',
  'Last month': 'Прошлый месяц',
  Earlier: 'Ранее',

  // Profile Settings
  'Personal Information': 'Личная информация',
  'Tennis Information': 'Теннисная информация',
  'Privacy Settings': 'Настройки приватности',
  'Notification Settings': 'Настройки уведомлений',
  'Account Settings': 'Настройки аккаунта',
  'Profile Photo': 'Фото профиля',
  'Full Name': 'Полное имя',
  'Phone Number': 'Номер телефона',
  'Date of Birth': 'Дата рождения',
  Gender: 'Пол',
  Bio: 'О себе',
  'Dominant Hand': 'Ведущая рука',
  'Backhand Type': 'Тип бэкхенда',
  'Playing Style': 'Стиль игры',
  'Years of Experience': 'Лет опыта',
  'Tennis Goals': 'Теннисные цели',
  'Profile Visibility': 'Видимость профиля',
  'Show Email': 'Показывать email',
  'Show Phone Number': 'Показывать номер телефона',
  'Show Location': 'Показывать местоположение',
  'Show Statistics': 'Показывать статистику',
  'Searchable in Directory': 'Доступен для поиска в справочнике',
  'Push Notifications': 'Push-уведомления',
  'Email Notifications': 'Email-уведомления',
  'Match Notifications': 'Уведомления о матчах',
  'Event Notifications': 'Уведомления о событиях',
  'Message Notifications': 'Уведомления о сообщениях',
  'Social Notifications': 'Социальные уведомления',
  'Marketing Emails': 'Маркетинговые письма',
  'Change Password': 'Изменить пароль',
  'Current Password': 'Текущий пароль',
  'New Password': 'Новый пароль',
  'Confirm New Password': 'Подтвердите новый пароль',
  'Two-Factor Authentication': 'Двухфакторная аутентификация',
  'Enable 2FA': 'Включить 2FA',
  'Disable 2FA': 'Отключить 2FA',
  'Connected Accounts': 'Связанные аккаунты',
  'Language Preference': 'Язык',
  'Theme Preference': 'Тема',
  'Light Theme': 'Светлая тема',
  'Dark Theme': 'Тёмная тема',
  'System Default': 'Системная',
  'Delete My Account': 'Удалить мой аккаунт',
  'This action cannot be undone': 'Это действие нельзя отменить',

  // Matches
  'Match Type': 'Тип матча',
  'Match Format': 'Формат матча',
  'Match Date': 'Дата матча',
  'Match Time': 'Время матча',
  'Match Location': 'Место матча',
  'Court Number': 'Номер корта',
  'Court Surface': 'Покрытие корта',
  'Hard Court': 'Хард',
  'Clay Court': 'Грунт',
  'Grass Court': 'Трава',
  'Indoor Court': 'Крытый корт',
  'Outdoor Court': 'Открытый корт',
  'Best of 3 Sets': 'До 2 побед',
  'Best of 5 Sets': 'До 3 побед',
  'Pro Set': 'Про-сет',
  Tiebreak: 'Тай-брейк',
  'No-Ad Scoring': 'Без преимущества',
  'Match Result': 'Результат матча',
  'Match Winner': 'Победитель матча',
  'Match Score': 'Счёт матча',
  'Game Score': 'Счёт гейма',
  'Set Score': 'Счёт сета',
  Retired: 'Снялся',
  Walkover: 'Техническая победа',
  Default: 'Неявка',

  // Badge Gallery
  'Earned Badges': 'Полученные награды',
  'Locked Badges': 'Заблокированные награды',
  'Badge Progress': 'Прогресс наград',
  'Earn this badge by': 'Получите эту награду',
  'Achievement Unlocked': 'Достижение разблокировано',
  'Share Achievement': 'Поделиться достижением',
  Rarity: 'Редкость',
  Common: 'Обычная',
  Uncommon: 'Необычная',
  Rare: 'Редкая',
  Epic: 'Эпическая',
  Legendary: 'Легендарная',

  // AI Matching
  'AI Match Recommendation': 'Рекомендация AI',
  'Compatibility Score': 'Совместимость',
  'Find a Match': 'Найти матч',
  'Looking for players...': 'Поиск игроков...',
  'Match Found!': 'Матч найден!',
  'Send Match Request': 'Отправить запрос на матч',
  'Accept Match': 'Принять матч',
  'Decline Match': 'Отклонить матч',
  'Match Request Sent': 'Запрос на матч отправлен',
  'Match Request Accepted': 'Запрос на матч принят',
  'Match Request Declined': 'Запрос на матч отклонён',
  'Finding your perfect match...': 'Поиск идеального матча...',
  'Based on your level, location, and preferences':
    'На основе вашего уровня, местоположения и предпочтений',

  // Edit Profile
  'Edit Profile': 'Редактировать профиль',
  'Upload Photo': 'Загрузить фото',
  'Change Photo': 'Изменить фото',
  'Remove Photo': 'Удалить фото',
  'Save Changes': 'Сохранить изменения',
  'Discard Changes': 'Отменить изменения',
  'Profile Updated': 'Профиль обновлён',
  'Failed to update profile': 'Не удалось обновить профиль',
  'Changes saved successfully': 'Изменения сохранены успешно',
  'You have unsaved changes': 'У вас есть несохранённые изменения',
  'Are you sure you want to discard changes?': 'Вы уверены, что хотите отменить изменения?',

  // Meetup Detail
  'Meetup Details': 'Детали встречи',
  'Join Meetup': 'Присоединиться к встрече',
  'Leave Meetup': 'Покинуть встречу',
  Attendees: 'Участники',
  Going: 'Иду',
  'Not Going': 'Не иду',
  Maybe: 'Возможно',
  Organizer: 'Организатор',
  'Contact Organizer': 'Связаться с организатором',
  'Meetup Location': 'Место встречи',
  'Get Directions': 'Получить маршрут',
  'Add to Calendar': 'Добавить в календарь',
  'Share Meetup': 'Поделиться встречей',
  'Report Meetup': 'Пожаловаться на встречу',
  'Cancel Meetup': 'Отменить встречу',
  'Meetup cancelled': 'Встреча отменена',
  'Meetup updated': 'Встреча обновлена',
  'You are now attending this meetup': 'Вы теперь участвуете в этой встрече',
  'You have left this meetup': 'Вы покинули эту встречу',
};

let translated = 0;
const ruCopy = JSON.parse(JSON.stringify(ru));

untranslated.forEach(({ path, en }) => {
  if (dict[en]) {
    deepSet(ruCopy, path, dict[en]);
    translated++;
  }
});

fs.writeFileSync(ruPath, JSON.stringify(ruCopy, null, 2), 'utf8');

const after = countUntranslated(en, ruCopy);
console.log(`After: ${after} untranslated keys`);
console.log(`\n✅ Translated ${translated} keys!`);
console.log(`📉 Reduced by ${before - after} keys total`);
