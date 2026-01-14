const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// ============================================
// SPANISH TRANSLATIONS (Priority Language)
// ============================================
const esTranslations = {
  // Club Detail Tabs - CRITICAL (from screenshots)
  clubDetail: {
    tabs: {
      home: 'Inicio',
      admin: 'Administrador',
      members: 'Miembros',
      activities: 'Actividades',
      leagues: 'Ligas/Torneos',
      hallOfFame: 'Salón de la Fama',
      policy: 'Políticas/Cuotas',
    },
  },

  // Club Overview Screen
  clubOverviewScreen: {
    clubAnnouncements: 'Anuncios del Club',
    activitiesInProgress: 'Actividades en Progreso',
    registrationOpen: 'Registro Abierto',
    inProgress: 'En Progreso',
    roundRobinInProgress: 'Round Robin en Progreso',
    upcomingActivities: 'Próximas Actividades',
    noAnnouncements: 'Sin anuncios',
    noActivities: 'Sin actividades',
    viewAll: 'Ver Todo',
  },

  // Discover Screen - COMPLETELY MISSING (71 keys)
  discover: {
    tabs: {
      events: 'Eventos',
      players: 'Jugadores',
      clubs: 'Clubes',
      coaches: 'Entrenadores',
      services: 'Servicios',
    },
    search: {
      events: 'Buscar eventos',
      players: 'Buscar jugadores',
      clubs: 'Buscar clubes',
      coaches: 'Buscar entrenadores',
      services: 'Buscar servicios',
      placeholder: 'Buscar...',
    },
    emptyState: {
      noEvents: 'No se encontraron eventos cercanos',
      noPlayers: 'No se encontraron jugadores cercanos',
      noClubs: 'No se encontraron clubes cercanos',
      noCoaches: 'No se encontraron entrenadores cercanos',
      noServices: 'No se encontraron servicios cercanos',
      suggestion: 'Intenta ampliar el rango de búsqueda o usar diferentes filtros',
    },
    filters: {
      distance: 'Distancia',
      level: 'Nivel',
      availability: 'Disponibilidad',
      type: 'Tipo',
      apply: 'Aplicar',
      reset: 'Restablecer',
    },
  },

  // Create New Screen
  createNew: {
    title: 'Crear Nuevo',
    subtitle: '¿Qué te gustaría crear?',
    lightningMatch: 'Partido Relámpago',
    rankedMatch: 'Partido Clasificado',
    lightningMeetup: 'Encuentro Relámpago',
    casualMeetup: 'Encuentro Casual',
    createClub: 'Crear Club',
    tennisCommunity: 'Comunidad de Tenis',
  },

  // Members Tabs
  clubMembersScreen: {
    tabs: {
      joinRequests: 'Solicitudes',
      allMembers: 'Todos los Miembros',
      roleManagement: 'Gestión de Roles',
    },
    member: 'Miembro',
    manager: 'Gerente',
    admin: 'Administrador',
    owner: 'Propietario',
    approve: 'Aprobar',
    reject: 'Rechazar',
    pending: 'Pendiente',
    noRequests: 'Sin solicitudes de membresía',
    noMembers: 'Sin miembros',
  },

  // Club Leagues/Tournaments Tabs
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Ligas',
      tournaments: 'Torneos',
    },
  },

  // Leagues Admin Dashboard
  leagues: {
    admin: {
      dashboardTitle: 'Panel de Administración',
      dashboardSubtitle: 'Gestionar participantes y configuración antes de que comience la liga',
      participantList: 'Lista de Participantes',
      approve: 'Aprobar',
      approved: 'Aprobado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
      settings: 'Configuración',
      startLeague: 'Iniciar Liga',
      endLeague: 'Finalizar Liga',
    },
    match: {
      status: {
        scheduled: 'Programado',
        inProgress: 'En Progreso',
        completed: 'Completado',
        cancelled: 'Cancelado',
        postponed: 'Pospuesto',
        pendingApproval: 'Pendiente de Aprobación',
      },
      matchNumber: 'Partido #{{number}}',
      viewResults: 'Ver Resultados',
      submitScore: 'Enviar Puntuación',
    },
    standings: 'Clasificación',
    schedule: 'Calendario',
    participants: 'Participantes',
    results: 'Resultados',
  },
};

// ============================================
// GERMAN TRANSLATIONS
// ============================================
const deTranslations = {
  clubDetail: {
    tabs: {
      home: 'Startseite',
      admin: 'Admin',
      members: 'Mitglieder',
      activities: 'Aktivitäten',
      leagues: 'Ligen/Turniere',
      hallOfFame: 'Ruhmeshalle',
      policy: 'Richtlinien/Gebühren',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: 'Club-Ankündigungen',
    activitiesInProgress: 'Laufende Aktivitäten',
    registrationOpen: 'Anmeldung offen',
    inProgress: 'In Bearbeitung',
    roundRobinInProgress: 'Round Robin läuft',
    upcomingActivities: 'Kommende Aktivitäten',
    noAnnouncements: 'Keine Ankündigungen',
    noActivities: 'Keine Aktivitäten',
    viewAll: 'Alle anzeigen',
  },
  discover: {
    tabs: {
      events: 'Veranstaltungen',
      players: 'Spieler',
      clubs: 'Vereine',
      coaches: 'Trainer',
      services: 'Dienste',
    },
    search: {
      events: 'Veranstaltungen suchen',
      players: 'Spieler suchen',
      clubs: 'Vereine suchen',
      coaches: 'Trainer suchen',
      services: 'Dienste suchen',
      placeholder: 'Suchen...',
    },
    emptyState: {
      noEvents: 'Keine Veranstaltungen in der Nähe gefunden',
      noPlayers: 'Keine Spieler in der Nähe gefunden',
      noClubs: 'Keine Vereine in der Nähe gefunden',
      noCoaches: 'Keine Trainer in der Nähe gefunden',
      noServices: 'Keine Dienste in der Nähe gefunden',
      suggestion: 'Versuche den Suchbereich zu erweitern oder andere Filter zu verwenden',
    },
    filters: {
      distance: 'Entfernung',
      level: 'Niveau',
      availability: 'Verfügbarkeit',
      type: 'Typ',
      apply: 'Anwenden',
      reset: 'Zurücksetzen',
    },
  },
  createNew: {
    title: 'Neu erstellen',
    subtitle: 'Was möchtest du erstellen?',
    lightningMatch: 'Blitz-Match',
    rankedMatch: 'Ranglistenspiel',
    lightningMeetup: 'Blitz-Treffen',
    casualMeetup: 'Lockeres Treffen',
    createClub: 'Club erstellen',
    tennisCommunity: 'Tennis-Community',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: 'Beitrittsanfragen',
      allMembers: 'Alle Mitglieder',
      roleManagement: 'Rollenverwaltung',
    },
    member: 'Mitglied',
    manager: 'Manager',
    admin: 'Administrator',
    owner: 'Besitzer',
    approve: 'Genehmigen',
    reject: 'Ablehnen',
    pending: 'Ausstehend',
    noRequests: 'Keine Beitrittsanfragen',
    noMembers: 'Keine Mitglieder',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Ligen',
      tournaments: 'Turniere',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: 'Admin-Dashboard',
      dashboardSubtitle: 'Teilnehmer und Einstellungen vor Ligastart verwalten',
      participantList: 'Teilnehmerliste',
      approve: 'Genehmigen',
      approved: 'Genehmigt',
      pending: 'Ausstehend',
      rejected: 'Abgelehnt',
      settings: 'Einstellungen',
      startLeague: 'Liga starten',
      endLeague: 'Liga beenden',
    },
    match: {
      status: {
        scheduled: 'Geplant',
        inProgress: 'In Bearbeitung',
        completed: 'Abgeschlossen',
        cancelled: 'Abgesagt',
        postponed: 'Verschoben',
        pendingApproval: 'Genehmigung ausstehend',
      },
      matchNumber: 'Spiel #{{number}}',
      viewResults: 'Ergebnisse anzeigen',
      submitScore: 'Ergebnis einreichen',
    },
    standings: 'Tabelle',
    schedule: 'Spielplan',
    participants: 'Teilnehmer',
    results: 'Ergebnisse',
  },
};

// ============================================
// FRENCH TRANSLATIONS
// ============================================
const frTranslations = {
  clubDetail: {
    tabs: {
      home: 'Accueil',
      admin: 'Admin',
      members: 'Membres',
      activities: 'Activités',
      leagues: 'Ligues/Tournois',
      hallOfFame: 'Temple de la Renommée',
      policy: 'Politiques/Cotisations',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: 'Annonces du Club',
    activitiesInProgress: 'Activités en Cours',
    registrationOpen: 'Inscription Ouverte',
    inProgress: 'En Cours',
    roundRobinInProgress: 'Round Robin en Cours',
    upcomingActivities: 'Activités à Venir',
    noAnnouncements: "Pas d'annonces",
    noActivities: "Pas d'activités",
    viewAll: 'Voir Tout',
  },
  discover: {
    tabs: {
      events: 'Événements',
      players: 'Joueurs',
      clubs: 'Clubs',
      coaches: 'Entraîneurs',
      services: 'Services',
    },
    search: {
      events: 'Rechercher des événements',
      players: 'Rechercher des joueurs',
      clubs: 'Rechercher des clubs',
      coaches: 'Rechercher des entraîneurs',
      services: 'Rechercher des services',
      placeholder: 'Rechercher...',
    },
    emptyState: {
      noEvents: 'Aucun événement trouvé à proximité',
      noPlayers: 'Aucun joueur trouvé à proximité',
      noClubs: 'Aucun club trouvé à proximité',
      noCoaches: 'Aucun entraîneur trouvé à proximité',
      noServices: 'Aucun service trouvé à proximité',
      suggestion: "Essayez d'élargir la zone de recherche ou d'utiliser des filtres différents",
    },
    filters: {
      distance: 'Distance',
      level: 'Niveau',
      availability: 'Disponibilité',
      type: 'Type',
      apply: 'Appliquer',
      reset: 'Réinitialiser',
    },
  },
  createNew: {
    title: 'Créer Nouveau',
    subtitle: 'Que souhaitez-vous créer?',
    lightningMatch: 'Match Éclair',
    rankedMatch: 'Match Classé',
    lightningMeetup: 'Rencontre Éclair',
    casualMeetup: 'Rencontre Décontractée',
    createClub: 'Créer un Club',
    tennisCommunity: 'Communauté Tennis',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: "Demandes d'adhésion",
      allMembers: 'Tous les Membres',
      roleManagement: 'Gestion des Rôles',
    },
    member: 'Membre',
    manager: 'Gestionnaire',
    admin: 'Administrateur',
    owner: 'Propriétaire',
    approve: 'Approuver',
    reject: 'Rejeter',
    pending: 'En attente',
    noRequests: "Aucune demande d'adhésion",
    noMembers: 'Aucun membre',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Ligues',
      tournaments: 'Tournois',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: 'Tableau de Bord Admin',
      dashboardSubtitle: 'Gérer les participants et les paramètres avant le début de la ligue',
      participantList: 'Liste des Participants',
      approve: 'Approuver',
      approved: 'Approuvé',
      pending: 'En attente',
      rejected: 'Rejeté',
      settings: 'Paramètres',
      startLeague: 'Démarrer la Ligue',
      endLeague: 'Terminer la Ligue',
    },
    match: {
      status: {
        scheduled: 'Programmé',
        inProgress: 'En Cours',
        completed: 'Terminé',
        cancelled: 'Annulé',
        postponed: 'Reporté',
        pendingApproval: 'Approbation en Attente',
      },
      matchNumber: 'Match #{{number}}',
      viewResults: 'Voir les Résultats',
      submitScore: 'Soumettre le Score',
    },
    standings: 'Classement',
    schedule: 'Calendrier',
    participants: 'Participants',
    results: 'Résultats',
  },
};

// ============================================
// ITALIAN TRANSLATIONS
// ============================================
const itTranslations = {
  clubDetail: {
    tabs: {
      home: 'Home',
      admin: 'Admin',
      members: 'Membri',
      activities: 'Attività',
      leagues: 'Leghe/Tornei',
      hallOfFame: 'Hall of Fame',
      policy: 'Politiche/Quote',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: 'Annunci del Club',
    activitiesInProgress: 'Attività in Corso',
    registrationOpen: 'Iscrizione Aperta',
    inProgress: 'In Corso',
    roundRobinInProgress: 'Round Robin in Corso',
    upcomingActivities: 'Prossime Attività',
    noAnnouncements: 'Nessun annuncio',
    noActivities: 'Nessuna attività',
    viewAll: 'Vedi Tutto',
  },
  discover: {
    tabs: {
      events: 'Eventi',
      players: 'Giocatori',
      clubs: 'Club',
      coaches: 'Allenatori',
      services: 'Servizi',
    },
    search: {
      events: 'Cerca eventi',
      players: 'Cerca giocatori',
      clubs: 'Cerca club',
      coaches: 'Cerca allenatori',
      services: 'Cerca servizi',
      placeholder: 'Cerca...',
    },
    emptyState: {
      noEvents: 'Nessun evento trovato nelle vicinanze',
      noPlayers: 'Nessun giocatore trovato nelle vicinanze',
      noClubs: 'Nessun club trovato nelle vicinanze',
      noCoaches: 'Nessun allenatore trovato nelle vicinanze',
      noServices: 'Nessun servizio trovato nelle vicinanze',
      suggestion: 'Prova ad ampliare il raggio di ricerca o a usare filtri diversi',
    },
    filters: {
      distance: 'Distanza',
      level: 'Livello',
      availability: 'Disponibilità',
      type: 'Tipo',
      apply: 'Applica',
      reset: 'Reimposta',
    },
  },
  createNew: {
    title: 'Crea Nuovo',
    subtitle: 'Cosa vorresti creare?',
    lightningMatch: 'Partita Lampo',
    rankedMatch: 'Partita Classificata',
    lightningMeetup: 'Incontro Lampo',
    casualMeetup: 'Incontro Informale',
    createClub: 'Crea Club',
    tennisCommunity: 'Comunità Tennis',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: 'Richieste di Iscrizione',
      allMembers: 'Tutti i Membri',
      roleManagement: 'Gestione Ruoli',
    },
    member: 'Membro',
    manager: 'Manager',
    admin: 'Amministratore',
    owner: 'Proprietario',
    approve: 'Approva',
    reject: 'Rifiuta',
    pending: 'In attesa',
    noRequests: 'Nessuna richiesta di iscrizione',
    noMembers: 'Nessun membro',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Leghe',
      tournaments: 'Tornei',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: 'Dashboard Admin',
      dashboardSubtitle: "Gestisci partecipanti e impostazioni prima dell'inizio della lega",
      participantList: 'Lista Partecipanti',
      approve: 'Approva',
      approved: 'Approvato',
      pending: 'In attesa',
      rejected: 'Rifiutato',
      settings: 'Impostazioni',
      startLeague: 'Avvia Lega',
      endLeague: 'Termina Lega',
    },
    match: {
      status: {
        scheduled: 'Programmato',
        inProgress: 'In Corso',
        completed: 'Completato',
        cancelled: 'Annullato',
        postponed: 'Rinviato',
        pendingApproval: 'In Attesa di Approvazione',
      },
      matchNumber: 'Partita #{{number}}',
      viewResults: 'Vedi Risultati',
      submitScore: 'Invia Punteggio',
    },
    standings: 'Classifica',
    schedule: 'Calendario',
    participants: 'Partecipanti',
    results: 'Risultati',
  },
};

// ============================================
// JAPANESE TRANSLATIONS
// ============================================
const jaTranslations = {
  clubDetail: {
    tabs: {
      home: 'ホーム',
      admin: '管理',
      members: 'メンバー',
      activities: 'アクティビティ',
      leagues: 'リーグ/トーナメント',
      hallOfFame: '殿堂',
      policy: 'ポリシー/会費',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: 'クラブのお知らせ',
    activitiesInProgress: '進行中のアクティビティ',
    registrationOpen: '登録受付中',
    inProgress: '進行中',
    roundRobinInProgress: 'ラウンドロビン進行中',
    upcomingActivities: '今後のアクティビティ',
    noAnnouncements: 'お知らせはありません',
    noActivities: 'アクティビティはありません',
    viewAll: 'すべて表示',
  },
  discover: {
    tabs: {
      events: 'イベント',
      players: 'プレイヤー',
      clubs: 'クラブ',
      coaches: 'コーチ',
      services: 'サービス',
    },
    search: {
      events: 'イベントを検索',
      players: 'プレイヤーを検索',
      clubs: 'クラブを検索',
      coaches: 'コーチを検索',
      services: 'サービスを検索',
      placeholder: '検索...',
    },
    emptyState: {
      noEvents: '近くにイベントが見つかりません',
      noPlayers: '近くにプレイヤーが見つかりません',
      noClubs: '近くにクラブが見つかりません',
      noCoaches: '近くにコーチが見つかりません',
      noServices: '近くにサービスが見つかりません',
      suggestion: '検索範囲を広げるか、別のフィルターを試してください',
    },
    filters: {
      distance: '距離',
      level: 'レベル',
      availability: '空き状況',
      type: 'タイプ',
      apply: '適用',
      reset: 'リセット',
    },
  },
  createNew: {
    title: '新規作成',
    subtitle: '何を作成しますか？',
    lightningMatch: 'ライトニングマッチ',
    rankedMatch: 'ランクマッチ',
    lightningMeetup: 'ライトニングミートアップ',
    casualMeetup: 'カジュアルミートアップ',
    createClub: 'クラブを作成',
    tennisCommunity: 'テニスコミュニティ',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: '参加リクエスト',
      allMembers: '全メンバー',
      roleManagement: 'ロール管理',
    },
    member: 'メンバー',
    manager: 'マネージャー',
    admin: '管理者',
    owner: 'オーナー',
    approve: '承認',
    reject: '拒否',
    pending: '保留中',
    noRequests: '参加リクエストはありません',
    noMembers: 'メンバーはいません',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'リーグ',
      tournaments: 'トーナメント',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: '管理ダッシュボード',
      dashboardSubtitle: 'リーグ開始前に参加者と設定を管理',
      participantList: '参加者リスト',
      approve: '承認',
      approved: '承認済み',
      pending: '保留中',
      rejected: '拒否',
      settings: '設定',
      startLeague: 'リーグを開始',
      endLeague: 'リーグを終了',
    },
    match: {
      status: {
        scheduled: '予定',
        inProgress: '進行中',
        completed: '完了',
        cancelled: 'キャンセル',
        postponed: '延期',
        pendingApproval: '承認待ち',
      },
      matchNumber: '試合 #{{number}}',
      viewResults: '結果を見る',
      submitScore: 'スコアを送信',
    },
    standings: '順位表',
    schedule: 'スケジュール',
    participants: '参加者',
    results: '結果',
  },
};

// ============================================
// PORTUGUESE TRANSLATIONS
// ============================================
const ptTranslations = {
  clubDetail: {
    tabs: {
      home: 'Início',
      admin: 'Admin',
      members: 'Membros',
      activities: 'Atividades',
      leagues: 'Ligas/Torneios',
      hallOfFame: 'Hall da Fama',
      policy: 'Políticas/Taxas',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: 'Anúncios do Clube',
    activitiesInProgress: 'Atividades em Andamento',
    registrationOpen: 'Inscrição Aberta',
    inProgress: 'Em Andamento',
    roundRobinInProgress: 'Round Robin em Andamento',
    upcomingActivities: 'Próximas Atividades',
    noAnnouncements: 'Sem anúncios',
    noActivities: 'Sem atividades',
    viewAll: 'Ver Tudo',
  },
  discover: {
    tabs: {
      events: 'Eventos',
      players: 'Jogadores',
      clubs: 'Clubes',
      coaches: 'Treinadores',
      services: 'Serviços',
    },
    search: {
      events: 'Buscar eventos',
      players: 'Buscar jogadores',
      clubs: 'Buscar clubes',
      coaches: 'Buscar treinadores',
      services: 'Buscar serviços',
      placeholder: 'Buscar...',
    },
    emptyState: {
      noEvents: 'Nenhum evento encontrado nas proximidades',
      noPlayers: 'Nenhum jogador encontrado nas proximidades',
      noClubs: 'Nenhum clube encontrado nas proximidades',
      noCoaches: 'Nenhum treinador encontrado nas proximidades',
      noServices: 'Nenhum serviço encontrado nas proximidades',
      suggestion: 'Tente ampliar o alcance da busca ou usar filtros diferentes',
    },
    filters: {
      distance: 'Distância',
      level: 'Nível',
      availability: 'Disponibilidade',
      type: 'Tipo',
      apply: 'Aplicar',
      reset: 'Redefinir',
    },
  },
  createNew: {
    title: 'Criar Novo',
    subtitle: 'O que você gostaria de criar?',
    lightningMatch: 'Partida Relâmpago',
    rankedMatch: 'Partida Ranqueada',
    lightningMeetup: 'Encontro Relâmpago',
    casualMeetup: 'Encontro Casual',
    createClub: 'Criar Clube',
    tennisCommunity: 'Comunidade de Tênis',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: 'Solicitações',
      allMembers: 'Todos os Membros',
      roleManagement: 'Gestão de Funções',
    },
    member: 'Membro',
    manager: 'Gerente',
    admin: 'Administrador',
    owner: 'Proprietário',
    approve: 'Aprovar',
    reject: 'Rejeitar',
    pending: 'Pendente',
    noRequests: 'Sem solicitações de adesão',
    noMembers: 'Sem membros',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Ligas',
      tournaments: 'Torneios',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: 'Painel de Administração',
      dashboardSubtitle: 'Gerenciar participantes e configurações antes do início da liga',
      participantList: 'Lista de Participantes',
      approve: 'Aprovar',
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Rejeitado',
      settings: 'Configurações',
      startLeague: 'Iniciar Liga',
      endLeague: 'Encerrar Liga',
    },
    match: {
      status: {
        scheduled: 'Agendado',
        inProgress: 'Em Andamento',
        completed: 'Concluído',
        cancelled: 'Cancelado',
        postponed: 'Adiado',
        pendingApproval: 'Aguardando Aprovação',
      },
      matchNumber: 'Partida #{{number}}',
      viewResults: 'Ver Resultados',
      submitScore: 'Enviar Placar',
    },
    standings: 'Classificação',
    schedule: 'Calendário',
    participants: 'Participantes',
    results: 'Resultados',
  },
};

// ============================================
// RUSSIAN TRANSLATIONS
// ============================================
const ruTranslations = {
  clubDetail: {
    tabs: {
      home: 'Главная',
      admin: 'Админ',
      members: 'Участники',
      activities: 'Мероприятия',
      leagues: 'Лиги/Турниры',
      hallOfFame: 'Зал Славы',
      policy: 'Правила/Взносы',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: 'Объявления Клуба',
    activitiesInProgress: 'Текущие Мероприятия',
    registrationOpen: 'Регистрация Открыта',
    inProgress: 'В Процессе',
    roundRobinInProgress: 'Round Robin в Процессе',
    upcomingActivities: 'Предстоящие Мероприятия',
    noAnnouncements: 'Нет объявлений',
    noActivities: 'Нет мероприятий',
    viewAll: 'Показать Все',
  },
  discover: {
    tabs: {
      events: 'События',
      players: 'Игроки',
      clubs: 'Клубы',
      coaches: 'Тренеры',
      services: 'Услуги',
    },
    search: {
      events: 'Поиск событий',
      players: 'Поиск игроков',
      clubs: 'Поиск клубов',
      coaches: 'Поиск тренеров',
      services: 'Поиск услуг',
      placeholder: 'Поиск...',
    },
    emptyState: {
      noEvents: 'Поблизости не найдено событий',
      noPlayers: 'Поблизости не найдено игроков',
      noClubs: 'Поблизости не найдено клубов',
      noCoaches: 'Поблизости не найдено тренеров',
      noServices: 'Поблизости не найдено услуг',
      suggestion: 'Попробуйте расширить область поиска или использовать другие фильтры',
    },
    filters: {
      distance: 'Расстояние',
      level: 'Уровень',
      availability: 'Доступность',
      type: 'Тип',
      apply: 'Применить',
      reset: 'Сбросить',
    },
  },
  createNew: {
    title: 'Создать Новое',
    subtitle: 'Что вы хотите создать?',
    lightningMatch: 'Молниеносный Матч',
    rankedMatch: 'Рейтинговый Матч',
    lightningMeetup: 'Молниеносная Встреча',
    casualMeetup: 'Неформальная Встреча',
    createClub: 'Создать Клуб',
    tennisCommunity: 'Теннисное Сообщество',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: 'Заявки на Вступление',
      allMembers: 'Все Участники',
      roleManagement: 'Управление Ролями',
    },
    member: 'Участник',
    manager: 'Менеджер',
    admin: 'Администратор',
    owner: 'Владелец',
    approve: 'Одобрить',
    reject: 'Отклонить',
    pending: 'Ожидание',
    noRequests: 'Нет заявок на вступление',
    noMembers: 'Нет участников',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: 'Лиги',
      tournaments: 'Турниры',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: 'Панель Администратора',
      dashboardSubtitle: 'Управление участниками и настройками до начала лиги',
      participantList: 'Список Участников',
      approve: 'Одобрить',
      approved: 'Одобрено',
      pending: 'Ожидание',
      rejected: 'Отклонено',
      settings: 'Настройки',
      startLeague: 'Начать Лигу',
      endLeague: 'Завершить Лигу',
    },
    match: {
      status: {
        scheduled: 'Запланировано',
        inProgress: 'В Процессе',
        completed: 'Завершено',
        cancelled: 'Отменено',
        postponed: 'Перенесено',
        pendingApproval: 'Ожидает Подтверждения',
      },
      matchNumber: 'Матч #{{number}}',
      viewResults: 'Посмотреть Результаты',
      submitScore: 'Отправить Счёт',
    },
    standings: 'Турнирная Таблица',
    schedule: 'Расписание',
    participants: 'Участники',
    results: 'Результаты',
  },
};

// ============================================
// CHINESE (Simplified) TRANSLATIONS
// ============================================
const zhTranslations = {
  clubDetail: {
    tabs: {
      home: '首页',
      admin: '管理',
      members: '成员',
      activities: '活动',
      leagues: '联赛/锦标赛',
      hallOfFame: '荣誉殿堂',
      policy: '政策/会费',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: '俱乐部公告',
    activitiesInProgress: '进行中的活动',
    registrationOpen: '开放注册',
    inProgress: '进行中',
    roundRobinInProgress: '循环赛进行中',
    upcomingActivities: '即将举行的活动',
    noAnnouncements: '暂无公告',
    noActivities: '暂无活动',
    viewAll: '查看全部',
  },
  discover: {
    tabs: {
      events: '活动',
      players: '球员',
      clubs: '俱乐部',
      coaches: '教练',
      services: '服务',
    },
    search: {
      events: '搜索活动',
      players: '搜索球员',
      clubs: '搜索俱乐部',
      coaches: '搜索教练',
      services: '搜索服务',
      placeholder: '搜索...',
    },
    emptyState: {
      noEvents: '附近未找到活动',
      noPlayers: '附近未找到球员',
      noClubs: '附近未找到俱乐部',
      noCoaches: '附近未找到教练',
      noServices: '附近未找到服务',
      suggestion: '尝试扩大搜索范围或使用不同的筛选条件',
    },
    filters: {
      distance: '距离',
      level: '等级',
      availability: '可用性',
      type: '类型',
      apply: '应用',
      reset: '重置',
    },
  },
  createNew: {
    title: '新建',
    subtitle: '您想创建什么？',
    lightningMatch: '闪电比赛',
    rankedMatch: '排名赛',
    lightningMeetup: '闪电聚会',
    casualMeetup: '休闲聚会',
    createClub: '创建俱乐部',
    tennisCommunity: '网球社区',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: '加入申请',
      allMembers: '所有成员',
      roleManagement: '角色管理',
    },
    member: '成员',
    manager: '经理',
    admin: '管理员',
    owner: '所有者',
    approve: '批准',
    reject: '拒绝',
    pending: '待处理',
    noRequests: '暂无加入申请',
    noMembers: '暂无成员',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: '联赛',
      tournaments: '锦标赛',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: '管理员仪表板',
      dashboardSubtitle: '在联赛开始前管理参与者和设置',
      participantList: '参与者名单',
      approve: '批准',
      approved: '已批准',
      pending: '待处理',
      rejected: '已拒绝',
      settings: '设置',
      startLeague: '开始联赛',
      endLeague: '结束联赛',
    },
    match: {
      status: {
        scheduled: '已安排',
        inProgress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
        postponed: '已延期',
        pendingApproval: '等待批准',
      },
      matchNumber: '比赛 #{{number}}',
      viewResults: '查看结果',
      submitScore: '提交分数',
    },
    standings: '排名',
    schedule: '赛程',
    participants: '参与者',
    results: '结果',
  },
};

// ============================================
// KOREAN TRANSLATIONS (Reference - already complete)
// ============================================
const koTranslations = {
  clubDetail: {
    tabs: {
      home: '홈',
      admin: '관리',
      members: '멤버',
      activities: '활동',
      leagues: '리그/토너먼트',
      hallOfFame: '명예의 전당',
      policy: '정책/회비',
    },
  },
  clubOverviewScreen: {
    clubAnnouncements: '클럽 공지사항',
    activitiesInProgress: '진행 중인 활동',
    registrationOpen: '등록 중',
    inProgress: '진행 중',
    roundRobinInProgress: '라운드 로빈 진행 중',
    upcomingActivities: '예정된 활동',
    noAnnouncements: '공지사항이 없습니다',
    noActivities: '활동이 없습니다',
    viewAll: '전체 보기',
  },
  discover: {
    tabs: {
      events: '이벤트',
      players: '플레이어',
      clubs: '클럽',
      coaches: '코치',
      services: '서비스',
    },
    search: {
      events: '이벤트 검색',
      players: '플레이어 검색',
      clubs: '클럽 검색',
      coaches: '코치 검색',
      services: '서비스 검색',
      placeholder: '검색...',
    },
    emptyState: {
      noEvents: '근처에서 이벤트를 찾을 수 없습니다',
      noPlayers: '근처에서 플레이어를 찾을 수 없습니다',
      noClubs: '근처에서 클럽을 찾을 수 없습니다',
      noCoaches: '근처에서 코치를 찾을 수 없습니다',
      noServices: '근처에서 서비스를 찾을 수 없습니다',
      suggestion: '검색 범위를 넓히거나 다른 필터를 사용해 보세요',
    },
    filters: {
      distance: '거리',
      level: '레벨',
      availability: '가능 여부',
      type: '유형',
      apply: '적용',
      reset: '초기화',
    },
  },
  createNew: {
    title: '새로 만들기',
    subtitle: '무엇을 만들고 싶으신가요?',
    lightningMatch: '번개 매치',
    rankedMatch: '랭크 매치',
    lightningMeetup: '번개 모임',
    casualMeetup: '자유 모임',
    createClub: '클럽 만들기',
    tennisCommunity: '테니스 커뮤니티',
  },
  clubMembersScreen: {
    tabs: {
      joinRequests: '가입 신청',
      allMembers: '전체 멤버',
      roleManagement: '역할 관리',
    },
    member: '멤버',
    manager: '매니저',
    admin: '관리자',
    owner: '소유자',
    approve: '승인',
    reject: '거절',
    pending: '대기 중',
    noRequests: '가입 신청이 없습니다',
    noMembers: '멤버가 없습니다',
  },
  clubLeaguesTournaments: {
    tabs: {
      leagues: '리그',
      tournaments: '토너먼트',
    },
  },
  leagues: {
    admin: {
      dashboardTitle: '관리자 대시보드',
      dashboardSubtitle: '리그 시작 전 참가자 및 설정 관리',
      participantList: '참가자 목록',
      approve: '승인',
      approved: '승인됨',
      pending: '대기 중',
      rejected: '거절됨',
      settings: '설정',
      startLeague: '리그 시작',
      endLeague: '리그 종료',
    },
    match: {
      status: {
        scheduled: '예정됨',
        inProgress: '진행 중',
        completed: '완료',
        cancelled: '취소됨',
        postponed: '연기됨',
        pendingApproval: '승인 대기',
      },
      matchNumber: '경기 #{{number}}',
      viewResults: '결과 보기',
      submitScore: '스코어 제출',
    },
    standings: '순위',
    schedule: '일정',
    participants: '참가자',
    results: '결과',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function updateLocale(filename, translations) {
  const filePath = path.join(localesDir, filename);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Deep merge translations
  deepMerge(content, translations);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${filename}`);
}

// ============================================
// MAIN EXECUTION
// ============================================

console.log('🌍 Fixing all missing translations...\n');

// Update each locale file
updateLocale('es.json', esTranslations);
updateLocale('de.json', deTranslations);
updateLocale('fr.json', frTranslations);
updateLocale('it.json', itTranslations);
updateLocale('ja.json', jaTranslations);
updateLocale('pt.json', ptTranslations);
updateLocale('ru.json', ruTranslations);
updateLocale('zh.json', zhTranslations);
updateLocale('ko.json', koTranslations);

console.log('\n🎉 All locale files have been updated with missing translations!');
console.log('\n📊 Translations added:');
console.log('   - clubDetail.tabs (7 keys)');
console.log('   - clubOverviewScreen (9 keys)');
console.log('   - discover.tabs (5 keys)');
console.log('   - discover.search (6 keys)');
console.log('   - discover.emptyState (6 keys)');
console.log('   - discover.filters (6 keys)');
console.log('   - createNew (8 keys)');
console.log('   - clubMembersScreen (11 keys)');
console.log('   - clubLeaguesTournaments.tabs (2 keys)');
console.log('   - leagues.admin (10 keys)');
console.log('   - leagues.match.status (6 keys)');
console.log('   - leagues.match (3 keys)');
console.log('   - leagues (4 keys)');
console.log('\n   Total: ~80+ keys per language × 9 languages = 720+ translations added!');
