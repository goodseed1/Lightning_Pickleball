const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Missing createClub translations
const translations = {
  en: {
    createClub: {
      tapToChangeLogo: 'Tap to change logo',
      title: 'Create Club',
    },
  },
  ko: {
    createClub: {
      tapToChangeLogo: '탭하여 로고 변경',
      title: '클럽 생성',
    },
  },
  es: {
    createClub: {
      tapToChangeLogo: 'Toca para cambiar el logo',
      title: 'Crear Club',
    },
  },
  de: {
    createClub: {
      tapToChangeLogo: 'Tippen, um Logo zu ändern',
      title: 'Club erstellen',
    },
  },
  fr: {
    createClub: {
      tapToChangeLogo: 'Appuyez pour changer le logo',
      title: 'Créer un Club',
    },
  },
  it: {
    createClub: {
      tapToChangeLogo: 'Tocca per cambiare il logo',
      title: 'Crea Club',
    },
  },
  ja: {
    createClub: {
      tapToChangeLogo: 'タップしてロゴを変更',
      title: 'クラブ作成',
    },
  },
  pt: {
    createClub: {
      tapToChangeLogo: 'Toque para alterar o logo',
      title: 'Criar Clube',
    },
  },
  ru: {
    createClub: {
      tapToChangeLogo: 'Нажмите, чтобы изменить логотип',
      title: 'Создать клуб',
    },
  },
  zh: {
    createClub: {
      tapToChangeLogo: '点击更换标志',
      title: '创建俱乐部',
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

console.log('🏢 Adding createClub translations...\n');

Object.keys(translations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    deepMerge(content, translations[lang]);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ ${lang}.json - Added createClub translations`);
  } catch (err) {
    console.log(`❌ ${lang}.json - Error: ${err.message}`);
  }
});

console.log('\n🎉 Done!');
