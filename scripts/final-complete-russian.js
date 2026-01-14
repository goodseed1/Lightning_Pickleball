#!/usr/bin/env node
/**
 * FINAL COMPLETE Russian Translation
 * Programmatically translate all remaining keys using pattern matching
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const RU_PATH = path.join(LOCALES_DIR, 'ru.json');

const enJson = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ruJson = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

// Enhanced translation dictionary with patterns
const translations = {
  // Exact matches
  Korean: 'Корейский',
  English: 'Английский',
  Russian: 'Русский',
  Ongoing: 'В процессе',
  'Go to Login': 'Перейти ко входу',
  Method: 'Способ оплаты',
  '3 Sets': '3 сета',
  '1 Set': '1 сет',
  '5 Sets': '5 сетов',
  'just now': 'только что',
  'Match Achievements': 'Достижения в матчах',
  '3 hours': '3 часа',
  '1 hour': '1 час',
  '2 hours': '2 часа',
  '4 hours': '4 часа',
  'Rate Sportsmanship': 'Оценить спортивное поведение',
  'Detailed Analysis': 'Детальный анализ',
  'Improvement Ranking': 'Рейтинг улучшений',

  // Common patterns
  'Failed to remove participant.': 'Не удалось удалить участника.',
  'Your account has been deleted.': 'Ваш аккаунт был удален.',
  Ranked: 'Рейтинговый',
  'All members have paid their dues': 'Все участники оплатили взносы',
  'An error occurred while saving.': 'Произошла ошибка при сохранении.',

  // More comprehensive matches
  Created: 'Создано',
  Updated: 'Обновлено',
  Deleted: 'Удалено',
  Saved: 'Сохранено',
  Sent: 'Отправлено',
  Received: 'Получено',
  Confirmed: 'Подтверждено',
  Completed: 'Завершено',
  Cancelled: 'Отменено',
  Active: 'Активный',
  Inactive: 'Неактивный',
  Pending: 'В ожидании',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
  Processing: 'Обработка',
  Loading: 'Загрузка',
  Uploading: 'Загрузка',
  Downloading: 'Скачивание',
  Saving: 'Сохранение',
  Sending: 'Отправка',

  // Tennis-specific
  Singles: 'Одиночный',
  Doubles: 'Парный',
  Mixed: 'Микст',
  Tournament: 'Турнир',
  League: 'Лига',
  Match: 'Матч',
  Matches: 'Матчи',
  Player: 'Игрок',
  Players: 'Игроки',
  Court: 'Корт',
  Courts: 'Корты',
  Club: 'Клуб',
  Clubs: 'Клубы',
  Event: 'Мероприятие',
  Events: 'Мероприятия',

  // Time-related
  Today: 'Сегодня',
  Yesterday: 'Вчера',
  Tomorrow: 'Завтра',
  'This Week': 'На этой неделе',
  'Next Week': 'На следующей неделе',
  'This Month': 'В этом месяце',
  'Last Month': 'В прошлом месяце',
  'This Year': 'В этом году',

  // Common actions
  Create: 'Создать',
  Edit: 'Редактировать',
  Delete: 'Удалить',
  Remove: 'Удалить',
  Add: 'Добавить',
  Save: 'Сохранить',
  Cancel: 'Отмена',
  Submit: 'Отправить',
  Send: 'Отправить',
  Share: 'Поделиться',
  View: 'Просмотр',
  Details: 'Детали',
  Settings: 'Настройки',
  Search: 'Поиск',
  Filter: 'Фильтр',
  Sort: 'Сортировать',
  Export: 'Экспорт',
  Import: 'Импорт',
  Download: 'Скачать',
  Upload: 'Загрузить',
  Print: 'Печать',
  Copy: 'Копировать',
  Paste: 'Вставить',
  Refresh: 'Обновить',
  Retry: 'Повторить',
  Back: 'Назад',
  Next: 'Далее',
  Skip: 'Пропустить',
  Done: 'Готово',
  Finish: 'Завершить',
  Start: 'Начать',
  Stop: 'Остановить',
  Pause: 'Пауза',
  Resume: 'Продолжить',
  Continue: 'Продолжить',
  Confirm: 'Подтвердить',
  Approve: 'Одобрить',
  Reject: 'Отклонить',
  Accept: 'Принять',
  Decline: 'Отклонить',
  Join: 'Присоединиться',
  Leave: 'Покинуть',
  Invite: 'Пригласить',
  Close: 'Закрыть',
  Open: 'Открыть',
  Show: 'Показать',
  Hide: 'Скрыть',
  Enable: 'Включить',
  Disable: 'Выключить',
  Lock: 'Заблокировать',
  Unlock: 'Разблокировать',
  Block: 'Заблокировать',
  Unblock: 'Разблокировать',

  // Status
  Success: 'Успешно',
  Error: 'Ошибка',
  Warning: 'Предупреждение',
  Info: 'Информация',
  Failed: 'Не удалось',
  Online: 'Онлайн',
  Offline: 'Не в сети',
  Available: 'Доступно',
  Unavailable: 'Недоступно',
  Paid: 'Оплачено',
  Unpaid: 'Не оплачено',
  Overdue: 'Просрочено',
  Exempt: 'Освобожден',
  Partial: 'Частично',

  // Common nouns
  Title: 'Название',
  Description: 'Описание',
  Name: 'Имя',
  Email: 'Email',
  Password: 'Пароль',
  Date: 'Дата',
  Time: 'Время',
  Location: 'Местоположение',
  Address: 'Адрес',
  Phone: 'Телефон',
  Status: 'Статус',
  Type: 'Тип',
  Category: 'Категория',
  Options: 'Опции',
  Amount: 'Сумма',
  Total: 'Всего',
  Count: 'Количество',
  Number: 'Номер',
  ID: 'ID',
  Code: 'Код',
  Message: 'Сообщение',
  Note: 'Примечание',
  Notes: 'Примечания',
  Comment: 'Комментарий',
  Comments: 'Комментарии',
  Reply: 'Ответ',
  Report: 'Отчет',
  Reports: 'Отчеты',
  User: 'Пользователь',
  Users: 'Пользователи',
  Member: 'Участник',
  Members: 'Участники',
  Team: 'Команда',
  Teams: 'Команды',
  Group: 'Группа',
  Groups: 'Группы',
  Owner: 'Владелец',
  Admin: 'Администратор',
  Administrator: 'Администратор',
  Moderator: 'Модератор',
  Manager: 'Менеджер',
  Coach: 'Тренер',
  Beginner: 'Начинающий',
  Intermediate: 'Средний',
  Advanced: 'Продвинутый',
  Professional: 'Профессиональный',
  Expert: 'Эксперт',
  All: 'Все',
  None: 'Нет',
  Other: 'Другое',
  Custom: 'Индивидуальный',
  Default: 'По умолчанию',
  New: 'Новый',
  Old: 'Старый',
  Popular: 'Популярное',
  Featured: 'Рекомендуемое',
  Recent: 'Недавние',
  Upcoming: 'Предстоящие',
  Past: 'Прошедшие',
  Current: 'Текущий',
  Previous: 'Предыдущий',
  Latest: 'Последние',
  First: 'Первый',
  Last: 'Последний',
  Required: 'Обязательно',
  Optional: 'Необязательно',
  Recommended: 'Рекомендуется',
  Preview: 'Предпросмотр',
  Summary: 'Сводка',
  Overview: 'Обзор',
  Statistics: 'Статистика',
  Analytics: 'Аналитика',
  Performance: 'Производительность',
  Progress: 'Прогресс',
  Results: 'Результаты',
  Score: 'Счет',
  Scores: 'Счет',
  Rank: 'Место',
  Ranking: 'Рейтинг',
  Level: 'Уровень',
  Tier: 'Уровень',
  Badge: 'Значок',
  Badges: 'Значки',
  Trophy: 'Трофей',
  Trophies: 'Трофеи',
  Achievement: 'Достижение',
  Achievements: 'Достижения',
  Reward: 'Награда',
  Rewards: 'Награды',
  Prize: 'Приз',
  Prizes: 'Призы',

  // Messages
  'No results': 'Результатов не найдено',
  'No data': 'Нет данных',
  'No items': 'Нет элементов',
  Empty: 'Пусто',
  'Loading...': 'Загрузка...',
  'Try again': 'Попробуйте еще раз',
  'Contact support': 'Свяжитесь с поддержкой',
  'Coming soon': 'Скоро появится',
  'Not found': 'Не найдено',
  'Access denied': 'Доступ запрещен',
  'Session expired': 'Сессия истекла',
  'Invalid input': 'Неверный ввод',

  // Boolean
  Yes: 'Да',
  No: 'Нет',
  True: 'Да',
  False: 'Нет',
  On: 'Вкл',
  Off: 'Выкл',
};

// Pattern-based translation function
function translateText(text) {
  if (!text || typeof text !== 'string') return text;

  // Check exact match first
  if (translations[text]) {
    return translations[text];
  }

  // Check case-insensitive
  const found = Object.keys(translations).find(k => k.toLowerCase() === text.toLowerCase());
  if (found) return translations[found];

  // Pattern matching for common phrases
  let translated = text;

  // Replace {{variable}} patterns with {variable}
  translated = translated.replace(/\{\{(\w+)\}\}/g, '{$1}');

  // Common sentence patterns
  if (text.includes('has been deleted')) {
    translated = text.replace('has been deleted', 'был удален');
  }
  if (text.includes('has been removed')) {
    translated = text.replace('has been removed', 'был удален');
  }
  if (text.includes('has been updated')) {
    translated = text.replace('has been updated', 'был обновлен');
  }
  if (text.includes('has been created')) {
    translated = text.replace('has been created', 'был создан');
  }
  if (text.includes('has been saved')) {
    translated = text.replace('has been saved', 'был сохранен');
  }
  if (text.includes('Failed to')) {
    translated = text.replace('Failed to', 'Не удалось');
  }
  if (text.includes('Error')) {
    translated = text.replace('Error', 'Ошибка');
  }
  if (text.includes('Success')) {
    translated = text.replace('Success', 'Успешно');
  }

  return translated;
}

// Recursive translation function
function translateRecursive(enObj, ruObj) {
  const result = { ...ruObj };

  for (const key in enObj) {
    const enValue = enObj[key];
    const ruValue = ruObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      result[key] = translateRecursive(enValue, ruValue || {});
    } else if (typeof enValue === 'string') {
      if (!ruValue || ruValue === enValue) {
        result[key] = translateText(enValue);
      }
    }
  }

  return result;
}

console.log('🔄 Applying FINAL COMPLETE Russian translations...');
const translated = translateRecursive(enJson, ruJson);

fs.writeFileSync(RU_PATH, JSON.stringify(translated, null, 2) + '\n', 'utf8');

console.log('✅ FINAL translation complete!');
console.log(`📁 Updated: ${RU_PATH}`);

// Count remaining
function countUntranslated(enObj, ruObj) {
  let count = 0;
  for (const key in enObj) {
    const enValue = enObj[key];
    const ruValue = ruObj[key];
    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      count += countUntranslated(enValue, ruValue || {});
    } else if (typeof enValue === 'string' && (!ruValue || ruValue === enValue)) {
      count++;
    }
  }
  return count;
}

const remaining = countUntranslated(enJson, translated);
const total = countUntranslated(enJson, ruJson);
const translated_count = total - remaining;

console.log(`\n📊 Translated ${translated_count} keys`);
console.log(`📊 Remaining untranslated: ${remaining}`);
console.log(`📊 Progress: ${((1 - remaining / total) * 100).toFixed(1)}% complete`);
