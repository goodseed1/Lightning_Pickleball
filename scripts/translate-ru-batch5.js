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

// Massive translation dictionary
const dict = {
  // Club Settings & Creation
  'Club Settings': 'Настройки клуба',
  'Public clubs allow other users to search and apply for membership.':
    'Публичные клубы позволяют другим пользователям искать и подавать заявки на членство.',
  'Club name must be at least 2 characters': 'Название клуба должно содержать минимум 2 символа',
  'Club name cannot exceed 30 characters': 'Название клуба не может превышать 30 символов',
  'Great name! ✅': 'Отличное название! ✅',
  'Please write a club description': 'Пожалуйста, напишите описание клуба',
  'Description must be at least 10 characters (currently {{count}} chars)':
    'Описание должно содержать минимум 10 символов (сейчас {{count}} символов)',
  'Description cannot exceed 200 characters': 'Описание не может превышать 200 символов',
  'Great description! ✅': 'Отличное описание! ✅',
  'Please write a more detailed club description':
    'Пожалуйста, напишите более подробное описание клуба',
  'Address set ✅': 'Адрес установлен ✅',
  'Please add at least one meeting time': 'Пожалуйста, добавьте хотя бы одно время встречи',
  '{{count}} meeting(s) configured ✅': '{{count}} встреч настроено ✅',
  '🏛️ Club Creation Limit': '🏛️ Лимит создания клубов',
  'Each user can create a maximum of {{max}} clubs.\\n\\nYou currently own {{current}} club(s).\\n\\nTo create more clubs, please contact the administrator via the AI assistant chatbot at the bottom of the app.':
    'Каждый пользователь может создать максимум {{max}} клубов.\n\nСейчас у вас {{current}} клуб(ов).\n\nЧтобы создать больше клубов, свяжитесь с администратором через AI-чат внизу приложения.',
  '✅ Saved!': '✅ Сохранено!',
  '{{name}} club information has been saved.': 'Информация о клубе {{name}} сохранена.',
  'Save Failed': 'Ошибка сохранения',
  '🎉 Club Created!': '🎉 Клуб создан!',
  '{{name}} club has been successfully created.': 'Клуб {{name}} успешно создан.',
  'Club Creation Failed': 'Ошибка создания клуба',
  ' members': ' участников',
  Social: 'Социальный',
  'Join Fee': 'Вступительный взнос',
  'Monthly Fee': 'Месячный взнос',
  'Add to Favorites': 'Добавить в избранное',
  'View Details': 'Просмотреть детали',
  'Create Club': 'Создать клуб',
  'No joined clubs': 'Нет вступивших клубов',
  'No search results': 'Нет результатов поиска',
  'No nearby clubs': 'Нет клубов рядом',
  'Join a new club!': 'Вступите в новый клуб!',
  'Try a different search term': 'Попробуйте другой поисковый запрос',
  'Create a new club!': 'Создайте новый клуб!',

  // Regular Meetings
  'Events are automatically created every week': 'События создаются автоматически каждую неделю',
  'Loading regular meetings...': 'Загрузка регулярных встреч...',
  'Add Meeting': 'Добавить встречу',
  Every: 'Каждый',
  Sunday: 'Воскресенье',
  Monday: 'Понедельник',
  Tuesday: 'Вторник',
  Wednesday: 'Среда',
  Thursday: 'Четверг',
  Friday: 'Пятница',
  Saturday: 'Суббота',
  'Add New Regular Meeting': 'Добавить новую регулярную встречу',
  'Meeting Name *': 'Название встречи *',
  'e.g., Weekend Singles Practice': 'например, Тренировка одиночных матчей по выходным',
  'Location *': 'Местоположение *',
  'e.g., Central Park Tennis Courts': 'например, Теннисные корты Центрального парка',
  'Repeat Day': 'День повтора',
  'Select Day': 'Выберите день',
  Notice: 'Уведомление',
  'Unable to load regular meetings.': 'Невозможно загрузить регулярные встречи.',
  'Please enter meeting name and location.':
    'Пожалуйста, введите название и местоположение встречи.',
  'End time must be later than start time.': 'Время окончания должно быть позже времени начала.',
  'An error occurred while creating the meeting.': 'Произошла ошибка при создании встречи.',
  'An error occurred while deleting the meeting.': 'Произошла ошибка при удалении встречи.',
  'Regular meeting has been created.': 'Регулярная встреча создана.',
  'Regular meeting has been deleted.': 'Регулярная встреча удалена.',
  'Delete Regular Meeting': 'Удалить регулярную встречу',
  'Are you sure you want to delete "{{title}}" regular meeting?\\n\\nDeletion will stop automatically generated events.':
    'Вы уверены, что хотите удалить регулярную встречу "{{title}}"?\n\nУдаление остановит автоматически создаваемые события.',
  'No regular meetings set up': 'Нет настроенных регулярных встреч',
  'When you add a regular meeting, events will be\\nautomatically created every week':
    'Когда вы добавите регулярную встречу, события будут\nавтоматически создаваться каждую неделю',
  'Add Your First Regular Meeting': 'Добавьте вашу первую регулярную встречу',

  // Loading states
  'Loading clubs...': 'Загрузка клубов...',
  'Loading trophies...': 'Загрузка трофеев...',
  'Loading match history...': 'Загрузка истории матчей...',
  'Loading events...': 'Загрузка событий...',
  'Loading players...': 'Загрузка игроков...',
  'Loading data...': 'Загрузка данных...',
  'Loading...': 'Загрузка...',

  // Club Leagues & Tournaments
  'Leagues & Tournaments': 'Лиги и турниры',
  'Create League': 'Создать лигу',
  'Create Tournament': 'Создать турнир',
  'League Name': 'Название лиги',
  'Tournament Name': 'Название турнира',
  'League Format': 'Формат лиги',
  'Tournament Format': 'Формат турнира',
  'Round Robin': 'Круговая система',
  'Single Elimination': 'Одиночное выбывание',
  'Double Elimination': 'Двойное выбывание',
  'Swiss System': 'Швейцарская система',
  'Group Stage': 'Групповой этап',
  'Playoff Stage': 'Этап плей-офф',
  'Number of Rounds': 'Количество раундов',
  'Points per Win': 'Очков за победу',
  'Points per Loss': 'Очков за поражение',
  'Points per Draw': 'Очков за ничью',
  'Playoff Teams': 'Команды плей-офф',
  'Top 4': 'Топ 4',
  'Top 8': 'Топ 8',
  'Top 16': 'Топ 16',

  // Event Management
  'Event Management': 'Управление событиями',
  'Manage Events': 'Управлять событиями',
  'Event List': 'Список событий',
  'Create New Event': 'Создать новое событие',
  'Edit Event': 'Редактировать событие',
  'Delete Event': 'Удалить событие',
  'Cancel Event': 'Отменить событие',
  'Event Cancelled': 'Событие отменено',
  'Event Published': 'Событие опубликовано',
  'Event participants': 'Участники события',
  'Max participants': 'Макс. участников',
  'Participant List': 'Список участников',
  'Participant Management': 'Управление участниками',
  'Add Participant': 'Добавить участника',
  'Remove Participant': 'Удалить участника',
  Waitlist: 'Лист ожидания',
  'Add to Waitlist': 'Добавить в лист ожидания',
  'Remove from Waitlist': 'Удалить из листа ожидания',
  'Promote from Waitlist': 'Перевести из листа ожидания',

  // Dues Management specific
  'Dues Management': 'Управление взносами',
  'Manage Dues': 'Управлять взносами',
  'Monthly Dues': 'Месячные взносы',
  'Quarterly Dues': 'Квартальные взносы',
  'Annual Dues': 'Годовые взносы',
  'Due Date': 'Срок оплаты',
  'Due Amount': 'Сумма к оплате',
  Overdue: 'Просрочено',
  'Overdue Amount': 'Сумма просрочки',
  'Late Fee': 'Штраф за просрочку',
  'Late Fee Amount': 'Сумма штрафа',
  Exempt: 'Освобождён',
  'Set Exempt': 'Освободить',
  'Remove Exempt': 'Убрать освобождение',
  'Payment Method': 'Способ оплаты',
  'Payment Date': 'Дата оплаты',
  'Payment Proof': 'Подтверждение оплаты',
  'Upload Proof': 'Загрузить подтверждение',
  'View Proof': 'Просмотреть подтверждение',
  'Approve Payment': 'Одобрить платёж',
  'Reject Payment': 'Отклонить платёж',
  'Payment Approved': 'Платёж одобрен',
  'Payment Rejected': 'Платёж отклонён',
  'Send Reminder': 'Отправить напоминание',
  'Reminder Sent': 'Напоминание отправлено',
  'Auto Invoice': 'Автоматический счёт',
  'Invoice Day': 'День выставления счёта',
  'Invoice Sent': 'Счёт отправлен',
  'Collection Rate': 'Процент сбора',
  'Total Collected': 'Всего собрано',
  'Total Pending': 'Всего ожидается',
  'Total Overdue': 'Всего просрочено',

  // Services
  'Service Name': 'Название услуги',
  'Service Description': 'Описание услуги',
  'Service Type': 'Тип услуги',
  'Service Category': 'Категория услуги',
  'Service Provider': 'Поставщик услуги',
  'Service Price': 'Цена услуги',
  'Service Duration': 'Длительность услуги',
  'Service Location': 'Место предоставления услуги',
  'Service Availability': 'Доступность услуги',
  'Book Service': 'Забронировать услугу',
  'Cancel Booking': 'Отменить бронирование',
  'Booking Confirmed': 'Бронирование подтверждено',
  'Booking Cancelled': 'Бронирование отменено',
  'Service Rating': 'Рейтинг услуги',
  'Leave Review': 'Оставить отзыв',
  'Review Submitted': 'Отзыв отправлен',
  Coaching: 'Тренировки',
  Stringing: 'Натяжка струн',
  Equipment: 'Оборудование',
  'Court Rental': 'Аренда корта',
  Maintenance: 'Обслуживание',

  // Common UI Elements
  'Show All': 'Показать все',
  Hide: 'Скрыть',
  Expand: 'Развернуть',
  Collapse: 'Свернуть',
  'Select All': 'Выбрать все',
  'Deselect All': 'Снять выделение',
  'Mark as Read': 'Отметить как прочитанное',
  'Mark as Unread': 'Отметить как непрочитанное',
  'Mark All as Read': 'Отметить все как прочитанное',
  Toggle: 'Переключить',
  Enable: 'Включить',
  Disable: 'Отключить',
  Enabled: 'Включено',
  Disabled: 'Отключено',
  On: 'Вкл',
  Off: 'Выкл',
  'Show Details': 'Показать детали',
  'Hide Details': 'Скрыть детали',
  'More Info': 'Подробнее',
  'Less Info': 'Меньше информации',
  'Read More': 'Читать далее',
  'Read Less': 'Свернуть',
  'See More': 'Смотреть больше',
  'See Less': 'Смотреть меньше',
  'View More': 'Просмотреть больше',
  'View Less': 'Просмотреть меньше',
  'Load More': 'Загрузить ещё',
  'Show More': 'Показать больше',
  'Show Less': 'Показать меньше',
  Previous: 'Предыдущий',
  Next: 'Следующий',
  First: 'Первый',
  Last: 'Последний',
  'Go to Page': 'Перейти на страницу',
  Page: 'Страница',
  of: 'из',
  'Items per page': 'Элементов на странице',
  Results: 'Результаты',

  // Form Validation
  'This field is required': 'Это поле обязательно',
  'Invalid format': 'Неверный формат',
  'Too short': 'Слишком коротко',
  'Too long': 'Слишком длинно',
  'Invalid email': 'Неверный email',
  'Invalid phone': 'Неверный телефон',
  'Invalid URL': 'Неверный URL',
  'Invalid date': 'Неверная дата',
  'Invalid time': 'Неверное время',
  'Invalid number': 'Неверное число',
  'Must be a number': 'Должно быть числом',
  'Must be positive': 'Должно быть положительным',
  'Must be greater than': 'Должно быть больше',
  'Must be less than': 'Должно быть меньше',
  'Passwords do not match': 'Пароли не совпадают',
  'Please accept terms': 'Пожалуйста, примите условия',
  'Please select': 'Пожалуйста, выберите',
  'Please choose': 'Пожалуйста, выберите',
  'Please enter': 'Пожалуйста, введите',

  // Notifications & Alerts
  'New Notification': 'Новое уведомление',
  'You have {{count}} new notifications': 'У вас {{count}} новых уведомлений',
  'No new notifications': 'Нет новых уведомлений',
  'Mark all as read': 'Отметить все как прочитанное',
  'Clear all': 'Очистить все',
  'Notification Settings': 'Настройки уведомлений',
  Alert: 'Оповещение',
  Info: 'Информация',
  'Success!': 'Успешно!',
  'Error!': 'Ошибка!',
  'Warning!': 'Предупреждение!',
  Attention: 'Внимание',
  Important: 'Важно',
  Urgent: 'Срочно',

  // Time & Date
  'Just now': 'Только что',
  'minutes ago': 'минут назад',
  'hours ago': 'часов назад',
  'days ago': 'дней назад',
  'weeks ago': 'недель назад',
  'months ago': 'месяцев назад',
  'years ago': 'лет назад',
  Morning: 'Утро',
  Afternoon: 'День',
  Evening: 'Вечер',
  Night: 'Ночь',
  AM: 'AM',
  PM: 'PM',
  Hour: 'Час',
  Minute: 'Минута',
  Second: 'Секунда',
  Day: 'День',
  Week: 'Неделя',
  Month: 'Месяц',
  Year: 'Год',

  // Generic Actions
  'Click here': 'Нажмите здесь',
  'Tap here': 'Нажмите здесь',
  'Learn more': 'Узнать больше',
  'Get started': 'Начать',
  Continue: 'Продолжить',
  Proceed: 'Продолжить',
  'Go back': 'Вернуться',
  Return: 'Вернуться',
  Home: 'Главная',
  Menu: 'Меню',
  Options: 'Опции',
  More: 'Ещё',
  Less: 'Меньше',
  Undo: 'Отменить',
  Redo: 'Повторить',
  Cut: 'Вырезать',
  Copy: 'Копировать',
  Paste: 'Вставить',
  Duplicate: 'Дублировать',
  Move: 'Переместить',
  Rename: 'Переименовать',
  Archive: 'Архивировать',
  Restore: 'Восстановить',
  Trash: 'Корзина',
  'Permanently delete': 'Удалить навсегда',

  // Status Messages
  'Changes saved': 'Изменения сохранены',
  'Saved successfully': 'Сохранено успешно',
  'Save failed': 'Ошибка сохранения',
  'Updated successfully': 'Обновлено успешно',
  'Update failed': 'Ошибка обновления',
  'Deleted successfully': 'Удалено успешно',
  'Delete failed': 'Ошибка удаления',
  'Created successfully': 'Создано успешно',
  'Creation failed': 'Ошибка создания',
  'Operation successful': 'Операция успешна',
  'Operation failed': 'Операция не удалась',
  'Processing...': 'Обработка...',
  'Please wait...': 'Пожалуйста, подождите...',
  'Almost done...': 'Почти готово...',
  Completed: 'Завершено',
  Failed: 'Не удалось',
  'In Progress': 'В процессе',
  Queued: 'В очереди',
  Paused: 'Приостановлено',
  Stopped: 'Остановлено',
  Ready: 'Готово',
  'Not Ready': 'Не готово',
  Available: 'Доступно',
  Unavailable: 'Недоступно',
  Online: 'Онлайн',
  Offline: 'Оффлайн',
  Connected: 'Подключено',
  Disconnected: 'Отключено',
  'Syncing...': 'Синхронизация...',
  Synced: 'Синхронизировано',
  'Sync failed': 'Ошибка синхронизации',

  // Permissions & Access
  'Access Denied': 'Доступ запрещён',
  'Permission Denied': 'Разрешение отклонено',
  Unauthorized: 'Не авторизован',
  Forbidden: 'Запрещено',
  'Not Found': 'Не найдено',
  'Page not found': 'Страница не найдена',
  'Something went wrong': 'Что-то пошло не так',
  'An error occurred': 'Произошла ошибка',
  'Try again later': 'Попробуйте позже',
  'Contact support': 'Связаться с поддержкой',
  'Request access': 'Запросить доступ',
  'Grant access': 'Предоставить доступ',
  'Revoke access': 'Отозвать доступ',
  'Access granted': 'Доступ предоставлен',
  'Access revoked': 'Доступ отозван',

  // Misc
  'TennisUser{{id}}': 'ТеннисПользователь{{id}}',
  'Unknown User': 'Неизвестный пользователь',
  Anonymous: 'Аноним',
  'Guest User': 'Гость',
  'Deleted User': 'Удалённый пользователь',
  System: 'Система',
  Automated: 'Автоматизированное',
  Manual: 'Ручное',
  Default: 'По умолчанию',
  'Custom Value': 'Пользовательское значение',
  'Not specified': 'Не указано',
  'Not available': 'Недоступно',
  'Coming Soon': 'Скоро',
  'Under Development': 'В разработке',
  Beta: 'Бета',
  New: 'Новое',
  Updated: 'Обновлено',
  Featured: 'Рекомендуемое',
  Popular: 'Популярное',
  Recommended: 'Рекомендуемое',
  Trending: 'В тренде',
  'Top Rated': 'Лучшие',
  'Best Match': 'Лучшее совпадение',
  Newest: 'Новейшие',
  Oldest: 'Старейшие',
  'A-Z': 'А-Я',
  'Z-A': 'Я-А',
  'Low to High': 'От низкого к высокому',
  'High to Low': 'От высокого к низкому',
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
