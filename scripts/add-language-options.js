const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// New languages to add to createEvent.languages for all locales
const newLanguages = {
  en: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  ko: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  es: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  de: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  fr: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  it: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  ja: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  pt: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  ru: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
  zh: {
    german: 'Deutsch',
    italian: 'Italiano',
    portuguese: 'Português',
    russian: 'Русский',
  },
};

console.log('🌍 Adding 4 new languages to createEvent.languages...\n');

Object.keys(newLanguages).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (content.createEvent && content.createEvent.languages) {
      // Add new languages (using native language names for consistency)
      Object.assign(content.createEvent.languages, newLanguages[lang]);
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
      console.log(`✅ ${lang}.json - Added 4 new languages`);
    } else {
      console.log(`⚠️ ${lang}.json - createEvent.languages not found`);
    }
  } catch (err) {
    console.log(`❌ ${lang}.json - Error: ${err.message}`);
  }
});

console.log('\n🎉 Done! Now update CreateEventForm.tsx to include the new languages.');
