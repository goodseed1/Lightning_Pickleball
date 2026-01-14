const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

const translations = {
  es: {
    createEventChoice: {
      title: 'Crear Nuevo',
      subtitle: '¿Qué te gustaría crear?',
      lightningMatch: {
        title: 'Partido Relámpago',
        subtitle: 'Partido Clasificado',
        description: 'Partido competitivo que afecta tu ranking oficial y récords de partidos.',
      },
      lightningMeetup: {
        title: 'Encuentro Relámpago',
        subtitle: 'Encuentro Casual',
        description: 'Reunión social sin implicaciones de ranking.',
      },
      createClub: {
        title: 'Crear Club',
        subtitle: 'Comunidad de Tenis',
        description: 'Inicia tu propia comunidad de tenis.',
      },
      infoNotice: 'El tipo seleccionado no se puede cambiar después.',
    },
  },
  de: {
    createEventChoice: {
      title: 'Neu erstellen',
      subtitle: 'Was möchtest du erstellen?',
      lightningMatch: {
        title: 'Blitz-Match',
        subtitle: 'Ranglistenspiel',
        description:
          'Wettbewerbsspiel, das deine offizielle Rangliste und Spielrekorde beeinflusst.',
      },
      lightningMeetup: {
        title: 'Blitz-Treffen',
        subtitle: 'Lockeres Treffen',
        description: 'Geselliges Treffen ohne Ranglistenauswirkungen.',
      },
      createClub: {
        title: 'Club erstellen',
        subtitle: 'Pickleball-Community',
        description: 'Starte deine eigene Pickleball-Community.',
      },
      infoNotice: 'Der ausgewählte Typ kann später nicht geändert werden.',
    },
  },
  fr: {
    createEventChoice: {
      title: 'Créer Nouveau',
      subtitle: 'Que souhaitez-vous créer?',
      lightningMatch: {
        title: 'Match Éclair',
        subtitle: 'Match Classé',
        description:
          'Match compétitif qui affecte votre classement officiel et vos records de matchs.',
      },
      lightningMeetup: {
        title: 'Rencontre Éclair',
        subtitle: 'Rencontre Décontractée',
        description: 'Rassemblement social sans implications de classement.',
      },
      createClub: {
        title: 'Créer un Club',
        subtitle: 'Communauté Pickleball',
        description: 'Créez votre propre communauté de pickleball.',
      },
      infoNotice: 'Le type sélectionné ne peut pas être modifié ultérieurement.',
    },
  },
  it: {
    createEventChoice: {
      title: 'Crea Nuovo',
      subtitle: 'Cosa vorresti creare?',
      lightningMatch: {
        title: 'Partita Lampo',
        subtitle: 'Partita Classificata',
        description:
          'Partita competitiva che influisce sul tuo ranking ufficiale e sui record delle partite.',
      },
      lightningMeetup: {
        title: 'Incontro Lampo',
        subtitle: 'Incontro Informale',
        description: 'Ritrovo sociale senza implicazioni di classifica.',
      },
      createClub: {
        title: 'Crea Club',
        subtitle: 'Comunità Pickleball',
        description: 'Avvia la tua comunità di pickleball.',
      },
      infoNotice: 'Il tipo selezionato non può essere modificato successivamente.',
    },
  },
  ja: {
    createEventChoice: {
      title: '新規作成',
      subtitle: '何を作成しますか？',
      lightningMatch: {
        title: 'ライトニングマッチ',
        subtitle: 'ランクマッチ',
        description: '公式ランキングと試合記録に影響する競技試合です。',
      },
      lightningMeetup: {
        title: 'ライトニングミートアップ',
        subtitle: 'カジュアルミートアップ',
        description: 'ランキングに影響しない交流会です。',
      },
      createClub: {
        title: 'クラブを作成',
        subtitle: 'テニスコミュニティ',
        description: '自分のテニスコミュニティを始めましょう。',
      },
      infoNotice: '選択したタイプは後から変更できません。',
    },
  },
  pt: {
    createEventChoice: {
      title: 'Criar Novo',
      subtitle: 'O que você gostaria de criar?',
      lightningMatch: {
        title: 'Partida Relâmpago',
        subtitle: 'Partida Ranqueada',
        description: 'Partida competitiva que afeta seu ranking oficial e registros de partidas.',
      },
      lightningMeetup: {
        title: 'Encontro Relâmpago',
        subtitle: 'Encontro Casual',
        description: 'Reunião social sem implicações de ranking.',
      },
      createClub: {
        title: 'Criar Clube',
        subtitle: 'Comunidade de Tênis',
        description: 'Inicie sua própria comunidade de tênis.',
      },
      infoNotice: 'O tipo selecionado não pode ser alterado posteriormente.',
    },
  },
  ru: {
    createEventChoice: {
      title: 'Создать Новое',
      subtitle: 'Что вы хотите создать?',
      lightningMatch: {
        title: 'Молниеносный Матч',
        subtitle: 'Рейтинговый Матч',
        description: 'Соревновательный матч, влияющий на ваш официальный рейтинг и записи матчей.',
      },
      lightningMeetup: {
        title: 'Молниеносная Встреча',
        subtitle: 'Неформальная Встреча',
        description: 'Социальная встреча без влияния на рейтинг.',
      },
      createClub: {
        title: 'Создать Клуб',
        subtitle: 'Теннисное Сообщество',
        description: 'Создайте своё теннисное сообщество.',
      },
      infoNotice: 'Выбранный тип нельзя изменить позже.',
    },
  },
  zh: {
    createEventChoice: {
      title: '新建',
      subtitle: '您想创建什么？',
      lightningMatch: {
        title: '闪电比赛',
        subtitle: '排名赛',
        description: '影响您官方排名和比赛记录的竞技比赛。',
      },
      lightningMeetup: {
        title: '闪电聚会',
        subtitle: '休闲聚会',
        description: '不影响排名的社交聚会。',
      },
      createClub: {
        title: '创建俱乐部',
        subtitle: '网球社区',
        description: '创建您自己的网球社区。',
      },
      infoNotice: '所选类型以后无法更改。',
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

function updateLocale(lang) {
  const filename = `${lang}.json`;
  const filePath = path.join(localesDir, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  deepMerge(content, translations[lang]);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

console.log('🌍 Adding createEventChoice translations...\n');

Object.keys(translations).forEach(updateLocale);

console.log('\n🎉 All locale files updated with createEventChoice translations!');
