#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const RU_PATH = path.join(__dirname, '../src/locales/ru.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
let ru = JSON.parse(fs.readFileSync(RU_PATH, 'utf8'));

// Massive translation dictionary for all common pickleball/app terms
const AUTO_TRANSLATIONS = {
  // Common actions
  Loading: 'Загрузка',
  loading: 'загрузка',
  'Loading...': 'Загрузка...',
  'Please select': 'Пожалуйста, выберите',
  Select: 'Выбрать',
  'An error occurred': 'Произошла ошибка',
  Cannot: 'Невозможно',
  'win rate': 'процент побед',
  'Recent Matches': 'Недавние матчи',
  'Transfer Admin': 'Передать администратора',
  'Select New Admin': 'Выбрать нового администратора',
  'Change Roles': 'Изменить роли',
  'Role Statistics': 'Статистика ролей',
  'Managers have access': 'Менеджеры имеют доступ',
  'management features': 'функциям управления',
  'except club deletion': 'кроме удаления клуба',
  'Transfer club admin privileges': 'Передать привилегии администратора клуба',
  'to another manager': 'другому менеджеру',
  'Loading manager list': 'Загрузка списка менеджеров',
  'Loading club information': 'Загрузка информации о клубе',
  'Club Introduction': 'Представление клуба',
  'Regular Meeting Times': 'Время регулярных встреч',
  'Fee Information': 'Информация о стоимости',
  Recurring: 'Повторяющийся',
  'Yearly Fee': 'Годовая плата',
  'Payment Methods': 'Способы оплаты',
  'QR code': 'QR-код',
  'Tap a payment method': 'Нажмите на способ оплаты',
  'to view the QR code': 'чтобы просмотреть QR-код',
  Elementary: 'Начальный',
  'Match Schedule': 'Расписание матчей',
  'Select Time': 'Выберите время',
  'Please select a match time': 'Пожалуйста, выберите время матча',
  'Please select a court': 'Пожалуйста, выберите корт',
  'An error occurred while sending': 'Произошла ошибка при отправке',
  'the match request': 'запроса на матч',
  'Cannot open chat room': 'Невозможно открыть чат',
  'Cannot edit event': 'Невозможно редактировать событие',
  'Event has been cancelled': 'Событие отменено',
  'An error occurred while cancelling': 'Произошла ошибка при отмене',
  'the event': 'события',
  'Cancel Participation': 'Отменить участие',
  'Your participation has been cancelled': 'Ваше участие отменено',
  'An error occurred while cancelling participation': 'Произошла ошибка при отмене участия',
  'Terms of Service': 'Условия использования',
  'Privacy Policy': 'Политика конфиденциальности',
  'Location-Based Services Terms': 'Условия геолокационных услуг',
  'Liability Disclaimer': 'Отказ от ответственности',
  'IMPORTANT LEGAL NOTICE': 'ВАЖНОЕ ЮРИДИЧЕСКОЕ УВЕДОМЛЕНИЕ',
  platform: 'платформа',
  'to connect': 'для подключения',
  'individual pickleball players': 'отдельных теннисистов',
  'WE DO NOT ASSUME ANY LEGAL LIABILITY': 'МЫ НЕ НЕСЕМ НИКАКОЙ ЮРИДИЧЕСКОЙ ОТВЕТСТВЕННОСТИ',
  'Safety Incidents Disclaimer': 'Отказ от ответственности за происшествия',
  'Injuries or accidents': 'Травмы или несчастные случаи',
  'Personal disputes': 'Личные споры',
  'Financial Disputes Disclaimer': 'Отказ от ответственности за финансовые споры',
  'User Responsibility': 'Ответственность пользователя',
  'By using this service': 'Используя эту услугу',
  'you agree to these disclaimer terms': 'вы соглашаетесь с этими условиями отказа',
};

// Function to auto-translate simple sentences
function autoTranslate(text) {
  if (typeof text !== 'string') return text;

  // Check if already translated (contains Cyrillic)
  if (/[А-Яа-яЁё]/.test(text)) return text;

  // Try exact match first
  if (AUTO_TRANSLATIONS[text]) return AUTO_TRANSLATIONS[text];

  // Try partial translations
  let translated = text;
  for (const [eng, rus] of Object.entries(AUTO_TRANSLATIONS)) {
    if (text.includes(eng)) {
      translated = translated.replace(eng, rus);
    }
  }

  return translated !== text ? translated : text;
}

// Recursively find and translate
function findAndTranslate(enObj, ruObj, path = '') {
  let changesMade = 0;

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      if (!ruObj[key]) ruObj[key] = {};
      changesMade += findAndTranslate(enObj[key], ruObj[key], currentPath);
    } else {
      // Leaf node - check if needs translation
      if (ruObj[key] === enObj[key] || !ruObj[key]) {
        const translated = autoTranslate(enObj[key]);
        if (translated !== enObj[key]) {
          ruObj[key] = translated;
          changesMade++;
          console.log(`  ✓ ${currentPath}: "${enObj[key]}" → "${translated}"`);
        }
      }
    }
  }

  return changesMade;
}

console.log('🔄 Auto-translating remaining Russian keys...\n');

const changesMade = findAndTranslate(en, ru);

if (changesMade > 0) {
  fs.writeFileSync(RU_PATH, JSON.stringify(ru, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Auto-translated ${changesMade} keys`);
  console.log(`📁 Updated: ${RU_PATH}\n`);
} else {
  console.log('\n✅ No auto-translatable keys found\n');
}

// Run verification
try {
  console.log('🔍 Running verification...\n');
  const result = execSync('node scripts/analyze-ru.js', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log(error.stdout);
}
