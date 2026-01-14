const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

const translations = {
  es: {
    profile: {
      userProfile: {
        screenTitle: 'Perfil de Usuario',
        loading: 'Cargando perfil...',
        loadError: 'Error al cargar el perfil',
        notFound: 'Perfil no encontrado',
        backButton: 'Volver',
        defaultNickname: 'Jugador de Tenis',
        noLocation: 'Sin información de ubicación',
        joinedDate: 'Se unió el {{date}}',
        friendRequest: {
          title: 'Solicitud de Amistad',
          message: '¿Enviar solicitud de amistad a {{nickname}}?',
          cancel: 'Cancelar',
          send: 'Enviar',
          success: 'Éxito',
          successMessage: '¡Solicitud de amistad enviada!',
          notification: 'Aviso',
          cannotSend: 'No se puede enviar la solicitud de amistad.',
          error: 'Error',
          errorMessage: 'Error al enviar la solicitud. Inténtalo de nuevo.',
        },
        sendMessage: {
          error: 'Error',
          loginRequired: 'Inicio de sesión requerido.',
        },
        actionButtons: {
          addFriend: 'Agregar Amigo',
          sendMessage: 'Enviar Mensaje',
        },
        rankings: {
          title: 'Rankings',
        },
        stats: {
          title: 'Estadísticas de Partidos',
          totalMatches: 'Total de Partidos',
          wins: 'Victorias',
          losses: 'Derrotas',
          winRate: 'Tasa de Victoria',
          currentStreak: '¡{{count}} Victorias Consecutivas!',
        },
        matchTypes: {
          singles: 'Individuales',
          doubles: 'Dobles',
          mixedDoubles: 'Dobles Mixtos',
        },
        playerInfo: {
          title: 'Información del Jugador',
          playingStyle: 'Estilo de Juego',
          languages: 'Idiomas',
          availability: 'Disponibilidad',
          weekdays: 'Entre Semana',
          weekends: 'Fines de Semana',
          noInfo: 'Sin información',
        },
        matchHistory: {
          title: 'Historial de Partidos Recientes',
          win: 'V',
          loss: 'D',
          score: 'Puntuación:',
        },
        timeSlots: {
          earlyMorning: 'Madrugada',
          morning: 'Mañana',
          afternoon: 'Tarde',
          evening: 'Atardecer',
          night: 'Noche',
          brunch: 'Brunch',
        },
      },
    },
    hallOfFame: {
      title: 'Salón de la Fama',
      trophies: 'trofeos',
      badges: 'insignias',
      trophiesTitle: 'Trofeos',
      winner: 'Ganador',
      finalist: 'Finalista',
      semifinalist: 'Semifinalista',
    },
  },
  de: {
    profile: {
      userProfile: {
        screenTitle: 'Benutzerprofil',
        loading: 'Profil wird geladen...',
        loadError: 'Fehler beim Laden des Profils',
        notFound: 'Profil nicht gefunden',
        backButton: 'Zurück',
        defaultNickname: 'Tennisspieler',
        noLocation: 'Keine Standortinfo',
        joinedDate: 'Beigetreten am {{date}}',
        friendRequest: {
          title: 'Freundschaftsanfrage',
          message: 'Freundschaftsanfrage an {{nickname}} senden?',
          cancel: 'Abbrechen',
          send: 'Senden',
          success: 'Erfolg',
          successMessage: 'Freundschaftsanfrage gesendet!',
          notification: 'Hinweis',
          cannotSend: 'Freundschaftsanfrage kann nicht gesendet werden.',
          error: 'Fehler',
          errorMessage: 'Fehler beim Senden der Anfrage. Bitte erneut versuchen.',
        },
        sendMessage: {
          error: 'Fehler',
          loginRequired: 'Anmeldung erforderlich.',
        },
        actionButtons: {
          addFriend: 'Freund hinzufügen',
          sendMessage: 'Nachricht senden',
        },
        rankings: {
          title: 'Ranglisten',
        },
        stats: {
          title: 'Spielstatistiken',
          totalMatches: 'Gesamtspiele',
          wins: 'Siege',
          losses: 'Niederlagen',
          winRate: 'Siegquote',
          currentStreak: '{{count}} Siegesserie!',
        },
        matchTypes: {
          singles: 'Einzel',
          doubles: 'Doppel',
          mixedDoubles: 'Mixed Doppel',
        },
        playerInfo: {
          title: 'Spielerinformationen',
          playingStyle: 'Spielstil',
          languages: 'Sprachen',
          availability: 'Verfügbarkeit',
          weekdays: 'Wochentage',
          weekends: 'Wochenenden',
          noInfo: 'Keine Angaben',
        },
        matchHistory: {
          title: 'Letzte Spielhistorie',
          win: 'S',
          loss: 'N',
          score: 'Ergebnis:',
        },
        timeSlots: {
          earlyMorning: 'Früher Morgen',
          morning: 'Morgen',
          afternoon: 'Nachmittag',
          evening: 'Abend',
          night: 'Nacht',
          brunch: 'Brunch',
        },
      },
    },
    hallOfFame: {
      title: 'Ruhmeshalle',
      trophies: 'Trophäen',
      badges: 'Abzeichen',
      trophiesTitle: 'Trophäen',
      winner: 'Gewinner',
      finalist: 'Finalist',
      semifinalist: 'Halbfinalist',
    },
  },
  fr: {
    profile: {
      userProfile: {
        screenTitle: 'Profil Utilisateur',
        loading: 'Chargement du profil...',
        loadError: 'Échec du chargement du profil',
        notFound: 'Profil non trouvé',
        backButton: 'Retour',
        defaultNickname: 'Joueur de Tennis',
        noLocation: 'Pas de localisation',
        joinedDate: 'Inscrit le {{date}}',
        friendRequest: {
          title: "Demande d'ami",
          message: "Envoyer une demande d'ami à {{nickname}}?",
          cancel: 'Annuler',
          send: 'Envoyer',
          success: 'Succès',
          successMessage: "Demande d'ami envoyée!",
          notification: 'Notification',
          cannotSend: "Impossible d'envoyer la demande d'ami.",
          error: 'Erreur',
          errorMessage: "Échec de l'envoi de la demande. Veuillez réessayer.",
        },
        sendMessage: {
          error: 'Erreur',
          loginRequired: 'Connexion requise.',
        },
        actionButtons: {
          addFriend: 'Ajouter un ami',
          sendMessage: 'Envoyer un message',
        },
        rankings: {
          title: 'Classements',
        },
        stats: {
          title: 'Statistiques des Matchs',
          totalMatches: 'Total des Matchs',
          wins: 'Victoires',
          losses: 'Défaites',
          winRate: 'Taux de Victoire',
          currentStreak: '{{count}} Victoires Consécutives!',
        },
        matchTypes: {
          singles: 'Simple',
          doubles: 'Double',
          mixedDoubles: 'Double Mixte',
        },
        playerInfo: {
          title: 'Informations du Joueur',
          playingStyle: 'Style de Jeu',
          languages: 'Langues',
          availability: 'Disponibilité',
          weekdays: 'Jours de Semaine',
          weekends: 'Week-ends',
          noInfo: "Pas d'information",
        },
        matchHistory: {
          title: 'Historique des Matchs Récents',
          win: 'V',
          loss: 'D',
          score: 'Score:',
        },
        timeSlots: {
          earlyMorning: 'Tôt le Matin',
          morning: 'Matin',
          afternoon: 'Après-midi',
          evening: 'Soir',
          night: 'Nuit',
          brunch: 'Brunch',
        },
      },
    },
    hallOfFame: {
      title: 'Temple de la Renommée',
      trophies: 'trophées',
      badges: 'badges',
      trophiesTitle: 'Trophées',
      winner: 'Gagnant',
      finalist: 'Finaliste',
      semifinalist: 'Demi-finaliste',
    },
  },
  it: {
    profile: {
      userProfile: {
        screenTitle: 'Profilo Utente',
        loading: 'Caricamento profilo...',
        loadError: 'Impossibile caricare il profilo',
        notFound: 'Profilo non trovato',
        backButton: 'Indietro',
        defaultNickname: 'Giocatore di Tennis',
        noLocation: 'Nessuna posizione',
        joinedDate: 'Iscritto il {{date}}',
        friendRequest: {
          title: 'Richiesta di Amicizia',
          message: 'Inviare richiesta di amicizia a {{nickname}}?',
          cancel: 'Annulla',
          send: 'Invia',
          success: 'Successo',
          successMessage: 'Richiesta di amicizia inviata!',
          notification: 'Avviso',
          cannotSend: 'Impossibile inviare la richiesta di amicizia.',
          error: 'Errore',
          errorMessage: 'Invio della richiesta fallito. Riprova.',
        },
        sendMessage: {
          error: 'Errore',
          loginRequired: 'Accesso richiesto.',
        },
        actionButtons: {
          addFriend: 'Aggiungi Amico',
          sendMessage: 'Invia Messaggio',
        },
        rankings: {
          title: 'Classifiche',
        },
        stats: {
          title: 'Statistiche Partite',
          totalMatches: 'Partite Totali',
          wins: 'Vittorie',
          losses: 'Sconfitte',
          winRate: 'Tasso di Vittoria',
          currentStreak: '{{count}} Vittorie Consecutive!',
        },
        matchTypes: {
          singles: 'Singolare',
          doubles: 'Doppio',
          mixedDoubles: 'Doppio Misto',
        },
        playerInfo: {
          title: 'Informazioni Giocatore',
          playingStyle: 'Stile di Gioco',
          languages: 'Lingue',
          availability: 'Disponibilità',
          weekdays: 'Giorni Feriali',
          weekends: 'Fine Settimana',
          noInfo: 'Nessuna informazione',
        },
        matchHistory: {
          title: 'Storico Partite Recenti',
          win: 'V',
          loss: 'S',
          score: 'Punteggio:',
        },
        timeSlots: {
          earlyMorning: 'Prima Mattina',
          morning: 'Mattina',
          afternoon: 'Pomeriggio',
          evening: 'Sera',
          night: 'Notte',
          brunch: 'Brunch',
        },
      },
    },
    hallOfFame: {
      title: 'Hall of Fame',
      trophies: 'trofei',
      badges: 'badge',
      trophiesTitle: 'Trofei',
      winner: 'Vincitore',
      finalist: 'Finalista',
      semifinalist: 'Semifinalista',
    },
  },
  ja: {
    profile: {
      userProfile: {
        screenTitle: 'ユーザープロフィール',
        loading: 'プロフィールを読み込み中...',
        loadError: 'プロフィールの読み込みに失敗しました',
        notFound: 'プロフィールが見つかりません',
        backButton: '戻る',
        defaultNickname: 'テニスプレイヤー',
        noLocation: '位置情報なし',
        joinedDate: '{{date}}に参加',
        friendRequest: {
          title: 'フレンドリクエスト',
          message: '{{nickname}}にフレンドリクエストを送りますか？',
          cancel: 'キャンセル',
          send: '送信',
          success: '成功',
          successMessage: 'フレンドリクエストを送信しました！',
          notification: 'お知らせ',
          cannotSend: 'フレンドリクエストを送信できません。',
          error: 'エラー',
          errorMessage: 'リクエストの送信に失敗しました。再度お試しください。',
        },
        sendMessage: {
          error: 'エラー',
          loginRequired: 'ログインが必要です。',
        },
        actionButtons: {
          addFriend: '友達を追加',
          sendMessage: 'メッセージを送信',
        },
        rankings: {
          title: 'ランキング',
        },
        stats: {
          title: '試合統計',
          totalMatches: '総試合数',
          wins: '勝利',
          losses: '敗北',
          winRate: '勝率',
          currentStreak: '{{count}}連勝中！',
        },
        matchTypes: {
          singles: 'シングルス',
          doubles: 'ダブルス',
          mixedDoubles: 'ミックスダブルス',
        },
        playerInfo: {
          title: 'プレイヤー情報',
          playingStyle: 'プレースタイル',
          languages: '言語',
          availability: '空き状況',
          weekdays: '平日',
          weekends: '週末',
          noInfo: '情報なし',
        },
        matchHistory: {
          title: '最近の試合履歴',
          win: '勝',
          loss: '敗',
          score: 'スコア:',
        },
        timeSlots: {
          earlyMorning: '早朝',
          morning: '午前',
          afternoon: '午後',
          evening: '夕方',
          night: '夜',
          brunch: 'ブランチ',
        },
      },
    },
    hallOfFame: {
      title: '殿堂',
      trophies: 'トロフィー',
      badges: 'バッジ',
      trophiesTitle: 'トロフィー',
      winner: '優勝',
      finalist: '準優勝',
      semifinalist: '準決勝進出',
    },
  },
  pt: {
    profile: {
      userProfile: {
        screenTitle: 'Perfil do Usuário',
        loading: 'Carregando perfil...',
        loadError: 'Falha ao carregar o perfil',
        notFound: 'Perfil não encontrado',
        backButton: 'Voltar',
        defaultNickname: 'Jogador de Tênis',
        noLocation: 'Sem localização',
        joinedDate: 'Entrou em {{date}}',
        friendRequest: {
          title: 'Pedido de Amizade',
          message: 'Enviar pedido de amizade para {{nickname}}?',
          cancel: 'Cancelar',
          send: 'Enviar',
          success: 'Sucesso',
          successMessage: 'Pedido de amizade enviado!',
          notification: 'Aviso',
          cannotSend: 'Não é possível enviar o pedido de amizade.',
          error: 'Erro',
          errorMessage: 'Falha ao enviar o pedido. Tente novamente.',
        },
        sendMessage: {
          error: 'Erro',
          loginRequired: 'Login necessário.',
        },
        actionButtons: {
          addFriend: 'Adicionar Amigo',
          sendMessage: 'Enviar Mensagem',
        },
        rankings: {
          title: 'Rankings',
        },
        stats: {
          title: 'Estatísticas de Partidas',
          totalMatches: 'Total de Partidas',
          wins: 'Vitórias',
          losses: 'Derrotas',
          winRate: 'Taxa de Vitória',
          currentStreak: '{{count}} Vitórias Consecutivas!',
        },
        matchTypes: {
          singles: 'Simples',
          doubles: 'Duplas',
          mixedDoubles: 'Duplas Mistas',
        },
        playerInfo: {
          title: 'Informações do Jogador',
          playingStyle: 'Estilo de Jogo',
          languages: 'Idiomas',
          availability: 'Disponibilidade',
          weekdays: 'Dias de Semana',
          weekends: 'Fins de Semana',
          noInfo: 'Sem informação',
        },
        matchHistory: {
          title: 'Histórico de Partidas Recentes',
          win: 'V',
          loss: 'D',
          score: 'Placar:',
        },
        timeSlots: {
          earlyMorning: 'Madrugada',
          morning: 'Manhã',
          afternoon: 'Tarde',
          evening: 'Entardecer',
          night: 'Noite',
          brunch: 'Brunch',
        },
      },
    },
    hallOfFame: {
      title: 'Hall da Fama',
      trophies: 'troféus',
      badges: 'distintivos',
      trophiesTitle: 'Troféus',
      winner: 'Vencedor',
      finalist: 'Finalista',
      semifinalist: 'Semifinalista',
    },
  },
  ru: {
    profile: {
      userProfile: {
        screenTitle: 'Профиль Пользователя',
        loading: 'Загрузка профиля...',
        loadError: 'Ошибка загрузки профиля',
        notFound: 'Профиль не найден',
        backButton: 'Назад',
        defaultNickname: 'Теннисист',
        noLocation: 'Нет данных о местоположении',
        joinedDate: 'Присоединился {{date}}',
        friendRequest: {
          title: 'Запрос в друзья',
          message: 'Отправить запрос в друзья {{nickname}}?',
          cancel: 'Отмена',
          send: 'Отправить',
          success: 'Успешно',
          successMessage: 'Запрос в друзья отправлен!',
          notification: 'Уведомление',
          cannotSend: 'Невозможно отправить запрос в друзья.',
          error: 'Ошибка',
          errorMessage: 'Ошибка отправки запроса. Попробуйте снова.',
        },
        sendMessage: {
          error: 'Ошибка',
          loginRequired: 'Требуется вход.',
        },
        actionButtons: {
          addFriend: 'Добавить в друзья',
          sendMessage: 'Отправить сообщение',
        },
        rankings: {
          title: 'Рейтинги',
        },
        stats: {
          title: 'Статистика Матчей',
          totalMatches: 'Всего Матчей',
          wins: 'Победы',
          losses: 'Поражения',
          winRate: 'Процент Побед',
          currentStreak: '{{count}} Побед Подряд!',
        },
        matchTypes: {
          singles: 'Одиночный',
          doubles: 'Парный',
          mixedDoubles: 'Смешанный Парный',
        },
        playerInfo: {
          title: 'Информация об Игроке',
          playingStyle: 'Стиль Игры',
          languages: 'Языки',
          availability: 'Доступность',
          weekdays: 'Будни',
          weekends: 'Выходные',
          noInfo: 'Нет информации',
        },
        matchHistory: {
          title: 'История Недавних Матчей',
          win: 'П',
          loss: 'Н',
          score: 'Счёт:',
        },
        timeSlots: {
          earlyMorning: 'Раннее Утро',
          morning: 'Утро',
          afternoon: 'День',
          evening: 'Вечер',
          night: 'Ночь',
          brunch: 'Бранч',
        },
      },
    },
    hallOfFame: {
      title: 'Зал Славы',
      trophies: 'трофеев',
      badges: 'значков',
      trophiesTitle: 'Трофеи',
      winner: 'Победитель',
      finalist: 'Финалист',
      semifinalist: 'Полуфиналист',
    },
  },
  zh: {
    profile: {
      userProfile: {
        screenTitle: '用户资料',
        loading: '加载资料中...',
        loadError: '加载资料失败',
        notFound: '未找到资料',
        backButton: '返回',
        defaultNickname: '网球选手',
        noLocation: '无位置信息',
        joinedDate: '加入于 {{date}}',
        friendRequest: {
          title: '好友请求',
          message: '向 {{nickname}} 发送好友请求？',
          cancel: '取消',
          send: '发送',
          success: '成功',
          successMessage: '好友请求已发送！',
          notification: '通知',
          cannotSend: '无法发送好友请求。',
          error: '错误',
          errorMessage: '发送请求失败，请重试。',
        },
        sendMessage: {
          error: '错误',
          loginRequired: '需要登录。',
        },
        actionButtons: {
          addFriend: '添加好友',
          sendMessage: '发送消息',
        },
        rankings: {
          title: '排名',
        },
        stats: {
          title: '比赛统计',
          totalMatches: '总比赛数',
          wins: '胜利',
          losses: '失败',
          winRate: '胜率',
          currentStreak: '{{count}}连胜中！',
        },
        matchTypes: {
          singles: '单打',
          doubles: '双打',
          mixedDoubles: '混合双打',
        },
        playerInfo: {
          title: '球员信息',
          playingStyle: '打法风格',
          languages: '语言',
          availability: '可用时间',
          weekdays: '工作日',
          weekends: '周末',
          noInfo: '无信息',
        },
        matchHistory: {
          title: '最近比赛记录',
          win: '胜',
          loss: '负',
          score: '比分:',
        },
        timeSlots: {
          earlyMorning: '清晨',
          morning: '上午',
          afternoon: '下午',
          evening: '傍晚',
          night: '夜间',
          brunch: '早午餐',
        },
      },
    },
    hallOfFame: {
      title: '荣誉殿堂',
      trophies: '奖杯',
      badges: '徽章',
      trophiesTitle: '奖杯',
      winner: '冠军',
      finalist: '亚军',
      semifinalist: '四强',
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

console.log('🌍 Fixing profile.userProfile translations...\n');

Object.keys(translations).forEach(updateLocale);

console.log('\n🎉 All locale files updated with proper userProfile translations!');
