const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for discover.distance section
const translations = {
  en: {
    discover: {
      distance: {
        eventsWithin: 'events within',
        playersWithin: 'players within',
        clubsWithin: 'clubs within',
        coachesWithin: 'coaches within',
        servicesWithin: 'services within',
        changeButton: 'Change',
        applyButton: 'Apply',
        saveFailed: 'Failed to save distance preference',
      },
    },
  },
  ko: {
    discover: {
      distance: {
        eventsWithin: '이내의 이벤트',
        playersWithin: '이내의 플레이어',
        clubsWithin: '이내의 클럽',
        coachesWithin: '이내의 코치',
        servicesWithin: '이내의 서비스',
        changeButton: '변경',
        applyButton: '적용',
        saveFailed: '거리 설정 저장에 실패했습니다',
      },
    },
  },
  es: {
    discover: {
      distance: {
        eventsWithin: 'eventos dentro de',
        playersWithin: 'jugadores dentro de',
        clubsWithin: 'clubes dentro de',
        coachesWithin: 'entrenadores dentro de',
        servicesWithin: 'servicios dentro de',
        changeButton: 'Cambiar',
        applyButton: 'Aplicar',
        saveFailed: 'Error al guardar la preferencia de distancia',
      },
    },
  },
  de: {
    discover: {
      distance: {
        eventsWithin: 'Veranstaltungen innerhalb von',
        playersWithin: 'Spieler innerhalb von',
        clubsWithin: 'Vereine innerhalb von',
        coachesWithin: 'Trainer innerhalb von',
        servicesWithin: 'Dienste innerhalb von',
        changeButton: 'Ändern',
        applyButton: 'Anwenden',
        saveFailed: 'Fehler beim Speichern der Entfernungseinstellung',
      },
    },
  },
  fr: {
    discover: {
      distance: {
        eventsWithin: 'événements dans un rayon de',
        playersWithin: 'joueurs dans un rayon de',
        clubsWithin: 'clubs dans un rayon de',
        coachesWithin: 'entraîneurs dans un rayon de',
        servicesWithin: 'services dans un rayon de',
        changeButton: 'Modifier',
        applyButton: 'Appliquer',
        saveFailed: "Échec de l'enregistrement de la préférence de distance",
      },
    },
  },
  it: {
    discover: {
      distance: {
        eventsWithin: 'eventi entro',
        playersWithin: 'giocatori entro',
        clubsWithin: 'club entro',
        coachesWithin: 'allenatori entro',
        servicesWithin: 'servizi entro',
        changeButton: 'Modifica',
        applyButton: 'Applica',
        saveFailed: 'Impossibile salvare la preferenza di distanza',
      },
    },
  },
  ja: {
    discover: {
      distance: {
        eventsWithin: '以内のイベント',
        playersWithin: '以内のプレイヤー',
        clubsWithin: '以内のクラブ',
        coachesWithin: '以内のコーチ',
        servicesWithin: '以内のサービス',
        changeButton: '変更',
        applyButton: '適用',
        saveFailed: '距離設定の保存に失敗しました',
      },
    },
  },
  pt: {
    discover: {
      distance: {
        eventsWithin: 'eventos dentro de',
        playersWithin: 'jogadores dentro de',
        clubsWithin: 'clubes dentro de',
        coachesWithin: 'treinadores dentro de',
        servicesWithin: 'serviços dentro de',
        changeButton: 'Alterar',
        applyButton: 'Aplicar',
        saveFailed: 'Falha ao salvar a preferência de distância',
      },
    },
  },
  ru: {
    discover: {
      distance: {
        eventsWithin: 'событий в радиусе',
        playersWithin: 'игроков в радиусе',
        clubsWithin: 'клубов в радиусе',
        coachesWithin: 'тренеров в радиусе',
        servicesWithin: 'услуг в радиусе',
        changeButton: 'Изменить',
        applyButton: 'Применить',
        saveFailed: 'Не удалось сохранить настройку расстояния',
      },
    },
  },
  zh: {
    discover: {
      distance: {
        eventsWithin: '范围内的活动',
        playersWithin: '范围内的球员',
        clubsWithin: '范围内的俱乐部',
        coachesWithin: '范围内的教练',
        servicesWithin: '范围内的服务',
        changeButton: '更改',
        applyButton: '应用',
        saveFailed: '保存距离偏好失败',
      },
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

  // Deep merge translations
  deepMerge(content, translations[lang]);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

console.log('🌍 Adding discover.distance translations...\n');

// Update all locale files
Object.keys(translations).forEach(updateLocale);

console.log('\n🎉 All locale files updated with discover.distance translations!');
console.log('\nKeys added:');
console.log('  - discover.distance.eventsWithin');
console.log('  - discover.distance.playersWithin');
console.log('  - discover.distance.clubsWithin');
console.log('  - discover.distance.coachesWithin');
console.log('  - discover.distance.servicesWithin');
console.log('  - discover.distance.changeButton');
console.log('  - discover.distance.applyButton');
console.log('  - discover.distance.saveFailed');
