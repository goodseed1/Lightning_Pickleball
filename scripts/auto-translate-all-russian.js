#!/usr/bin/env node
/**
 * AUTO-TRANSLATE ALL Russian keys
 * Generates Russian translations for all untranslated keys
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');
const RU_PATH = path.join(LOCALES_DIR, 'ru.json');

const enJson = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ruJson = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

// Translation dictionary - common terms
const dict = {
  // Actions
  Add: 'Добавить',
  Edit: 'Редактировать',
  Delete: 'Удалить',
  Remove: 'Удалить',
  View: 'Просмотр',
  Save: 'Сохранить',
  Cancel: 'Отмена',
  Close: 'Закрыть',
  Submit: 'Отправить',
  Create: 'Создать',
  Update: 'Обновить',
  Confirm: 'Подтвердить',
  Approve: 'Одобрить',
  Reject: 'Отклонить',
  Send: 'Отправить',
  Share: 'Поделиться',
  Join: 'Присоединиться',
  Leave: 'Покинуть',
  Invite: 'Пригласить',
  Accept: 'Принять',
  Decline: 'Отклонить',
  Back: 'Назад',
  Next: 'Далее',
  Skip: 'Пропустить',
  Finish: 'Завершить',
  Start: 'Начать',
  Stop: 'Остановить',
  Pause: 'Пауза',
  Resume: 'Продолжить',
  Reset: 'Сбросить',
  Clear: 'Очистить',
  Apply: 'Применить',
  Filter: 'Фильтр',
  Sort: 'Сортировать',
  Search: 'Поиск',
  Download: 'Скачать',
  Upload: 'Загрузить',
  Export: 'Экспорт',
  Import: 'Импорт',
  Print: 'Печать',

  // Status
  Active: 'Активный',
  Inactive: 'Неактивный',
  Pending: 'В ожидании',
  Completed: 'Завершено',
  Cancelled: 'Отменено',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
  Failed: 'Не удалось',
  Success: 'Успешно',
  Error: 'Ошибка',
  Warning: 'Предупреждение',
  Loading: 'Загрузка',
  Paid: 'Оплачено',
  Unpaid: 'Не оплачено',
  Overdue: 'Просрочено',
  Exempt: 'Освобожден',

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
  Details: 'Детали',
  Settings: 'Настройки',
  Options: 'Опции',
  All: 'Все',
  None: 'Нет',
  Other: 'Другое',
  Total: 'Всего',

  // Tennis terms
  Match: 'Матч',
  Matches: 'Матчи',
  Tournament: 'Турнир',
  League: 'Лига',
  Club: 'Клуб',
  Clubs: 'Клубы',
  Player: 'Игрок',
  Players: 'Игроки',
  Court: 'Корт',
  Courts: 'Корты',
  Event: 'Мероприятие',
  Events: 'Мероприятия',
  Singles: 'Одиночный',
  Doubles: 'Парный',
  Mixed: 'Микст',

  // Time
  Today: 'Сегодня',
  Yesterday: 'Вчера',
  Tomorrow: 'Завтра',
  Week: 'Неделя',
  Month: 'Месяц',
  Year: 'Год',
  Upcoming: 'Предстоящие',
  Past: 'Прошедшие',
  Recent: 'Недавние',

  // Common phrases
  'Learn More': 'Узнать больше',
  'Get Started': 'Начать',
  'Sign Up': 'Регистрация',
  'Log In': 'Войти',
  'Log Out': 'Выйти',
  'View Details': 'Детали',
  'No results': 'Результатов не найдено',
  'Loading...': 'Загрузка...',

  // Boolean
  Yes: 'Да',
  No: 'Нет',
  True: 'Да',
  False: 'Нет',
  Enable: 'Включить',
  Disable: 'Выключить',
  On: 'Вкл',
  Off: 'Выкл',
};

// Auto-translate function
function autoTranslate(text) {
  // Check dictionary first
  if (dict[text]) return dict[text];

  // Try case-insensitive
  const found = Object.keys(dict).find(k => k.toLowerCase() === text.toLowerCase());
  if (found) return dict[found];

  // Return original if no translation (will be manually fixed later)
  return text;
}

function translateRecursively(enObj, ruObj) {
  const result = { ...ruObj };

  for (const key in enObj) {
    const enValue = enObj[key];
    const ruValue = ruObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      result[key] = translateRecursively(enValue, ruValue || {});
    } else if (typeof enValue === 'string') {
      if (!ruValue || ruValue === enValue) {
        result[key] = autoTranslate(enValue);
      } else {
        result[key] = ruValue;
      }
    } else {
      result[key] = enValue;
    }
  }

  return result;
}

console.log('🔄 Auto-translating ALL Russian keys...');
const translated = translateRecursively(enJson, ruJson);

fs.writeFileSync(RU_PATH, JSON.stringify(translated, null, 2) + '\n', 'utf8');

console.log('✅ Auto-translation complete!');
console.log(`📁 Updated: ${RU_PATH}`);

// Count how many were auto-translated
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
console.log(`📊 Remaining untranslated: ${remaining}`);
