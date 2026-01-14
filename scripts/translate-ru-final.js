#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep set function to set nested object values
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

// Find untranslated keys
function findUntranslated(en, ru, prefix = '', results = []) {
  for (const key in en) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof en[key] === 'object' && !Array.isArray(en[key]) && en[key] !== null) {
      findUntranslated(en[key], ru[key] || {}, fullKey, results);
    } else if (typeof en[key] === 'string') {
      if (!ru[key] || ru[key] === en[key]) {
        results.push({
          path: fullKey,
          en: en[key],
        });
      }
    }
  }
  return results;
}

// Count untranslated
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

// Get all untranslated keys
const untranslated = findUntranslated(en, ru);

// Comprehensive translation dictionary
const dict = {
  // Actions
  Save: 'Сохранить',
  Cancel: 'Отмена',
  Delete: 'Удалить',
  Edit: 'Редактировать',
  Create: 'Создать',
  Update: 'Обновить',
  Confirm: 'Подтвердить',
  Back: 'Назад',
  Next: 'Далее',
  Previous: 'Предыдущий',
  Submit: 'Отправить',
  Close: 'Закрыть',
  Open: 'Открыть',
  View: 'Просмотр',
  Add: 'Добавить',
  Remove: 'Удалить',
  Send: 'Отправить',
  Retry: 'Повторить',
  Refresh: 'Обновить',
  Search: 'Поиск',
  Filter: 'Фильтр',
  Sort: 'Сортировка',
  Export: 'Экспорт',
  Download: 'Скачать',
  Upload: 'Загрузить',
  Share: 'Поделиться',
  Copy: 'Копировать',
  Apply: 'Применить',
  Reset: 'Сбросить',
  Clear: 'Очистить',
  Select: 'Выбрать',

  // Status
  Success: 'Успешно',
  Error: 'Ошибка',
  'Loading...': 'Загрузка...',
  Pending: 'Ожидает',
  Active: 'Активно',
  Inactive: 'Неактивно',
  Completed: 'Завершено',
  Cancelled: 'Отменено',
  Scheduled: 'Запланировано',
  Confirmed: 'Подтверждено',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
  Draft: 'Черновик',
  Published: 'Опубликовано',

  // Common
  Title: 'Название',
  Name: 'Имя',
  Description: 'Описание',
  Date: 'Дата',
  Time: 'Время',
  Location: 'Местоположение',
  Address: 'Адрес',
  Phone: 'Телефон',
  Email: 'Email',
  Password: 'Пароль',
  Message: 'Сообщение',
  Note: 'Примечание',
  Notes: 'Примечания',
  Comment: 'Комментарий',
  Details: 'Детали',
  Settings: 'Настройки',
  Profile: 'Профиль',
  Account: 'Аккаунт',
  Privacy: 'Приватность',
  Notifications: 'Уведомления',
  Preferences: 'Предпочтения',

  // Pickleball
  Match: 'Матч',
  Matches: 'Матчи',
  Tournament: 'Турнир',
  League: 'Лига',
  Club: 'Клуб',
  Player: 'Игрок',
  Players: 'Игроки',
  Court: 'Корт',
  Coach: 'Тренер',
  Score: 'Счёт',
  Win: 'Победа',
  Loss: 'Поражение',
  Winner: 'Победитель',
  Loser: 'Проигравший',
  Rank: 'Место',
  Rating: 'Рейтинг',
  Level: 'Уровень',
  Skill: 'Навык',
  Statistics: 'Статистика',
  Stats: 'Статистика',

  // Tournament
  Participants: 'Участники',
  Participant: 'Участник',
  Bpaddle: 'Сетка',
  Round: 'Раунд',
  Seed: 'Посев',
  Final: 'Финал',
  Semifinal: 'Полуфинал',
  Quarterfinal: 'Четвертьфинал',
  Registration: 'Регистрация',
  Register: 'Зарегистрироваться',
  Registered: 'Зарегистрирован',

  // Time
  Today: 'Сегодня',
  Tomorrow: 'Завтра',
  Yesterday: 'Вчера',
  'This Week': 'Эта неделя',
  'This Month': 'Этот месяц',
  Upcoming: 'Предстоящие',
  Past: 'Прошедшие',
  Current: 'Текущий',
  Recent: 'Недавние',

  // Other
  All: 'Все',
  Yes: 'Да',
  No: 'Нет',
  OK: 'ОК',
  Or: 'или',
  Total: 'Всего',
  Amount: 'Сумма',
  Price: 'Цена',
  Fee: 'Взнос',
  Payment: 'Оплата',
  Status: 'Статус',
  Type: 'Тип',
  Category: 'Категория',
  Format: 'Формат',
  Duration: 'Длительность',
  Capacity: 'Вместимость',
  Available: 'Доступно',
  Public: 'Публичный',
  Private: 'Приватный',
  Required: 'Обязательно',
  Visibility: 'Видимость',
  Overview: 'Обзор',
  Summary: 'Сводка',
  History: 'История',
  Report: 'Отчёт',
  Analytics: 'Аналитика',
  Dashboard: 'Панель',
  Admin: 'Администратор',
  Management: 'Управление',
  General: 'Общие',
  Advanced: 'Расширенные',
  Custom: 'Пользовательский',

  // Phrases
  'Total Matches': 'Всего матчей',
  'Current Round': 'Текущий раунд',
  'No results': 'Нет результатов',
  'Try again': 'Попробуйте снова',
  'Please try again': 'Пожалуйста, попробуйте снова',
  'Are you sure?': 'Вы уверены?',
  'View all': 'Просмотреть все',
  'View details': 'Просмотреть детали',
  'Load more': 'Загрузить ещё',
  'Show more': 'Показать больше',
  'Coming soon': 'Скоро',
  'Member not found.': 'Участник не найден.',
  'Permission Required': 'Требуется разрешение',
  'Cannot Generate Round': 'Невозможно создать раунд',
  'Generate Next Round': 'Создать следующий раунд',
  'Payment has been approved.': 'Платёж одобрен.',
  'Payment has been rejected.': 'Платёж отклонён.',
  'Late fee has been added.': 'Штраф за просрочку добавлен.',
  'Dues settings have been updated successfully.': 'Настройки взносов успешно обновлены.',
  'Failed to load dues management data. Please try again.':
    'Не удалось загрузить данные управления взносами. Попробуйте снова.',
  'Send payment reminder to all members with overdue payments?':
    'Отправить напоминание об оплате всем участникам с просроченными платежами?',
  'No permission to submit match result.': 'Нет разрешения на отправку результата матча.',
  'Please check your network connection.': 'Пожалуйста, проверьте подключение к сети.',
  'Match result has been corrected.': 'Результат матча исправлен.',
  'Error correcting result': 'Ошибка исправления результата',
  'Match schedule has been changed.': 'Расписание матча изменено.',
  'Error changing schedule': 'Ошибка изменения расписания',
  'Walkover processed successfully.': 'Техническая победа обработана успешно.',
  'Error processing walkover': 'Ошибка обработки технической победы',
  'No pending matches to approve.': 'Нет матчей, ожидающих одобрения.',
  'Bulk Approval Complete': 'Массовое одобрение завершено',
  'Match has been cancelled successfully.': 'Матч отменён успешно.',
  'Error cancelling match': 'Ошибка отмены матча',
  'Failed to update auto invoice setting.': 'Не удалось обновить настройку автоматических счетов.',
  'Reminder notification has been sent to {{count}} member(s).':
    'Напоминание отправлено {{count}} участнику(ам).',
  'Unable to load dues data.': 'Невозможно загрузить данные взносов.',
  'System Logs': 'Системные логи',
  Critical: 'Критические',
  Warning: 'Предупреждения',
  Healthy: 'Здоровые',
  'System Status': 'Статус системы',
  'Last Checked': 'Последняя проверка',
  'Error Logs': 'Логи ошибок',
  'Log Categories': 'Категории логов',

  // More specific phrases
  'Playoffs started successfully!\\n\\nPlayoff matches will appear shortly.':
    'Плей-офф успешно начался!\n\nМатчи плей-офф появятся в ближайшее время.',
  'Error starting playoffs. Please try again.': 'Ошибка начала плей-офф. Попробуйте снова.',
  '3rd': '3-е',
  '4th': '4-е',
  'Playoff matches can only be submitted during playoff stage.\\n\\nPlease check league status.':
    'Матчи плей-офф можно отправлять только на этапе плей-офф.\n\nПожалуйста, проверьте статус лиги.',
  'Playoff match result has been updated!': 'Результат матча плей-офф обновлён!',
  'Match result has been submitted.': 'Результат матча отправлен.',
  'Result Submitted': 'Результат отправлен',
  'Error submitting result': 'Ошибка отправки результата',
  'Match not found. Please refresh and try again.':
    'Матч не найден. Пожалуйста, обновите и попробуйте снова.',
};

// Apply translations
let translated = 0;
const ruCopy = JSON.parse(JSON.stringify(ru));

untranslated.forEach(({ path, en }) => {
  if (dict[en]) {
    deepSet(ruCopy, path, dict[en]);
    translated++;
  }
});

// Write result
fs.writeFileSync(ruPath, JSON.stringify(ruCopy, null, 2), 'utf8');

const after = countUntranslated(en, ruCopy);
console.log(`After: ${after} untranslated keys`);
console.log(`\n✅ Translated ${translated} keys!`);
console.log(`📉 Reduced by ${before - after} keys total`);
