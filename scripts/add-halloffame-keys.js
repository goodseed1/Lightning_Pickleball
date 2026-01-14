const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for joined and totalTrophies
const translations = {
  en: {
    hallOfFame: {
      joined: 'Joined',
      totalTrophies: 'Total Trophies',
      trophies: 'trophies',
      badges: 'badges',
      winner: 'Winner',
    },
  },
  ko: {
    hallOfFame: {
      joined: '가입일',
      totalTrophies: '총 트로피',
      trophies: '트로피',
      badges: '배지',
      winner: '우승자',
    },
  },
  es: {
    hallOfFame: {
      joined: 'Se unió',
      totalTrophies: 'Total de Trofeos',
      trophies: 'trofeos',
      badges: 'insignias',
      winner: 'Ganador',
    },
  },
  de: {
    hallOfFame: {
      joined: 'Beigetreten',
      totalTrophies: 'Gesamte Trophäen',
      trophies: 'Trophäen',
      badges: 'Abzeichen',
      winner: 'Gewinner',
    },
  },
  fr: {
    hallOfFame: {
      joined: 'Rejoint',
      totalTrophies: 'Total des Trophées',
      trophies: 'trophées',
      badges: 'badges',
      winner: 'Gagnant',
    },
  },
  it: {
    hallOfFame: {
      joined: 'Iscritto',
      totalTrophies: 'Trofei Totali',
      trophies: 'trofei',
      badges: 'distintivi',
      winner: 'Vincitore',
    },
  },
  ja: {
    hallOfFame: {
      joined: '参加日',
      totalTrophies: '総トロフィー数',
      trophies: 'トロフィー',
      badges: 'バッジ',
      winner: '優勝者',
    },
  },
  pt: {
    hallOfFame: {
      joined: 'Entrou',
      totalTrophies: 'Total de Troféus',
      trophies: 'troféus',
      badges: 'distintivos',
      winner: 'Vencedor',
    },
  },
  ru: {
    hallOfFame: {
      joined: 'Присоединился',
      totalTrophies: 'Всего трофеев',
      trophies: 'трофеи',
      badges: 'значки',
      winner: 'Победитель',
    },
  },
  zh: {
    hallOfFame: {
      joined: '加入时间',
      totalTrophies: '奖杯总数',
      trophies: '奖杯',
      badges: '徽章',
      winner: '获胜者',
    },
  },
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

console.log('🏆 Adding hallOfFame.joined and hallOfFame.totalTrophies keys...\n');

Object.keys(translations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  deepMerge(content, translations[lang]);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${lang}.json`);
});

console.log('\n🎉 All locale files updated with hallOfFame keys!');
