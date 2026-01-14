const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations that need fixing (not language names which are intentionally kept in native)
const fixes = {
  de: {
    createEvent: {
      eventType: {
        lightningMatch: 'Blitz-Match',
        lightningMeetup: 'Blitz-Treffen',
      },
      gameTypes: {
        mixed: 'Gemischt',
      },
    },
  },
  fr: {
    createEvent: {
      eventType: {
        match: 'Match', // Actually same in French, but let's verify structure exists
      },
    },
  },
  it: {
    createEvent: {
      fields: {
        partner: 'Partner', // Same in Italian
      },
    },
  },
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

console.log('🔧 Fixing remaining translations...\n');

Object.keys(fixes).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    deepMerge(content, fixes[lang]);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ ${lang}.json - Fixed translations`);
  } catch (err) {
    console.log(`❌ ${lang}.json - Error: ${err.message}`);
  }
});

console.log('\n🎉 Done!');
