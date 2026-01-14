#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Count keys function
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

// Get language code from command line
const lang = process.argv[2];

if (!lang) {
  console.error('Usage: node fix-final-5-languages.js <lang>');
  console.error('Languages: ru, zh, es, de, pt');
  process.exit(1);
}

const langPath = path.join(__dirname, `../src/locales/${lang}.json`);
const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));

// === RUSSIAN (ru) ===
const ruTranslations = {
  common: {
    ok: 'ОК',
  },
  auth: {
    register: {
      success: {
        ok: 'ОК',
      },
    },
  },
  units: {
    km: 'км',
    distanceKm: '{{distance}} км',
  },
  editProfile: {
    common: {
      ok: 'ОК',
    },
  },
  clubTournamentManagement: {
    common: {
      confirm: 'ОК',
    },
  },
  eventCard: {
    labels: {
      participants: '{{current}}/{{max}}',
    },
  },
  createEvent: {
    alerts: {
      confirm: 'ОК',
    },
    languages: {
      japanese: '日本語',
    },
  },
  duesManagement: {
    alerts: {
      ok: 'ОК',
    },
  },
  editClubPolicy: {
    ok: 'ОК',
  },
  teamInvitations: {
    ok: 'ОК',
  },
  createClubLeague: {
    ok: 'ОК',
  },
  manageAnnouncement: {
    ok: 'ОК',
  },
  myClubSettings: {
    alerts: {
      ok: 'ОК',
    },
  },
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  recordScore: {
    alerts: {
      confirm: 'ОК',
    },
  },
  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'ОК',
      },
    },
  },
};

// === CHINESE (zh) ===
const zhTranslations = {
  createEvent: {
    languages: {
      japanese: '日本語',
    },
  },
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  matches: {
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
  },
};

// === SPANISH (es) ===
const esTranslations = {
  common: {
    ok: 'OK',
  },
  auth: {
    register: {
      success: {
        ok: 'OK',
      },
    },
  },
  units: {
    km: 'km',
    distanceKm: '{{distance}} km',
  },
  editProfile: {
    common: {
      ok: 'OK',
    },
  },
  clubTournamentManagement: {
    common: {
      confirm: 'OK',
    },
  },
  eventCard: {
    labels: {
      participants: '{{current}}/{{max}}',
    },
  },
  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      japanese: '日本語',
    },
  },
  duesManagement: {
    alerts: {
      ok: 'OK',
    },
  },
  editClubPolicy: {
    ok: 'OK',
  },
  teamInvitations: {
    ok: 'OK',
  },
  createClubLeague: {
    ok: 'OK',
  },
  manageAnnouncement: {
    ok: 'OK',
  },
  myClubSettings: {
    alerts: {
      ok: 'OK',
    },
  },
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  recordScore: {
    alerts: {
      confirm: 'OK',
    },
  },
  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
  },
  home: {
    bottomNav: {
      myActivities: 'Mis actividades',
      matches: 'Partidos',
      home: 'Inicio',
      clubs: 'Clubes',
      profile: 'Perfil',
    },
  },
  clubOverviewScreen: {
    tabs: {
      announcements: 'Anuncios',
      events: 'Eventos',
      members: 'Miembros',
      policies: 'Políticas',
      leaguesAndTournaments: 'Ligas y torneos',
      statistics: 'Estadísticas',
    },
  },
  clubEvents: {
    createEvent: {
      title: 'Crear evento',
      eventName: 'Nombre del evento',
      eventDescription: 'Descripción del evento',
      eventDate: 'Fecha del evento',
      eventTime: 'Hora del evento',
      eventLocation: 'Ubicación del evento',
      maxParticipants: 'Máximo de participantes',
      createButton: 'Crear evento',
    },
  },
  clubMembers: {
    sections: {
      officers: 'Directivos',
      members: 'Miembros',
      pending: 'Pendientes',
    },
    roles: {
      president: 'Presidente',
      vice_president: 'Vicepresidente',
      secretary: 'Secretario',
      treasurer: 'Tesorero',
      member: 'Miembro',
    },
  },
  createClubEvent: {
    title: 'Crear evento del club',
    eventName: 'Nombre del evento',
    eventDescription: 'Descripción',
    eventDate: 'Fecha',
    eventTime: 'Hora',
    eventLocation: 'Ubicación',
    maxParticipants: 'Máximo de participantes',
    createButton: 'Crear evento',
    cancelButton: 'Cancelar',
  },
  leagueDetail: {
    tabs: {
      overview: 'Resumen',
      schedule: 'Calendario',
      standings: 'Clasificación',
      players: 'Jugadores',
      rules: 'Reglas',
    },
    standings: {
      rank: 'Pos.',
      player: 'Jugador',
      wins: 'V',
      losses: 'D',
      points: 'Pts',
    },
  },
  tournamentDetail: {
    tabs: {
      overview: 'Resumen',
      bpaddle: 'Cuadro',
      participants: 'Participantes',
      rules: 'Reglas',
    },
  },
  clubPolicies: {
    title: 'Políticas del club',
    sections: {
      general: 'Políticas generales',
      code_of_conduct: 'Código de conducta',
      court_usage: 'Uso de canchas',
      membership: 'Membresía',
      fees: 'Cuotas',
    },
  },
  clubStatistics: {
    title: 'Estadísticas del club',
    overview: {
      totalMembers: 'Total de miembros',
      activeMembers: 'Miembros activos',
      totalEvents: 'Total de eventos',
      upcomingEvents: 'Eventos próximos',
    },
  },
  myClubAnnouncements: {
    title: 'Anuncios',
    createButton: 'Crear anuncio',
    noAnnouncements: 'No hay anuncios',
  },
  myClubEvents: {
    title: 'Eventos',
    createButton: 'Crear evento',
    noEvents: 'No hay eventos',
  },
  myClubMembers: {
    title: 'Miembros',
    searchPlaceholder: 'Buscar miembros',
    noMembers: 'No hay miembros',
  },
  myClubPolicies: {
    title: 'Políticas',
    editButton: 'Editar',
    noPolicies: 'No hay políticas',
  },
};

// === GERMAN (de) ===
const deTranslations = {
  common: {
    ok: 'OK',
  },
  auth: {
    register: {
      success: {
        ok: 'OK',
      },
    },
  },
  units: {
    km: 'km',
    distanceKm: '{{distance}} km',
  },
  editProfile: {
    common: {
      ok: 'OK',
    },
  },
  clubTournamentManagement: {
    common: {
      confirm: 'OK',
    },
  },
  eventCard: {
    labels: {
      participants: '{{current}}/{{max}}',
    },
  },
  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      japanese: '日本語',
    },
  },
  duesManagement: {
    alerts: {
      ok: 'OK',
    },
  },
  editClubPolicy: {
    ok: 'OK',
  },
  teamInvitations: {
    ok: 'OK',
  },
  createClubLeague: {
    ok: 'OK',
  },
  manageAnnouncement: {
    ok: 'OK',
  },
  myClubSettings: {
    alerts: {
      ok: 'OK',
    },
  },
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  recordScore: {
    alerts: {
      confirm: 'OK',
    },
  },
  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
  },
  home: {
    bottomNav: {
      myActivities: 'Meine Aktivitäten',
      matches: 'Spiele',
      home: 'Start',
      clubs: 'Clubs',
      profile: 'Profil',
    },
  },
  clubOverviewScreen: {
    tabs: {
      announcements: 'Ankündigungen',
      events: 'Veranstaltungen',
      members: 'Mitglieder',
      policies: 'Richtlinien',
      leaguesAndTournaments: 'Ligen & Turniere',
      statistics: 'Statistiken',
    },
  },
  clubEvents: {
    createEvent: {
      title: 'Veranstaltung erstellen',
      eventName: 'Veranstaltungsname',
      eventDescription: 'Beschreibung',
      eventDate: 'Datum',
      eventTime: 'Uhrzeit',
      eventLocation: 'Ort',
      maxParticipants: 'Maximale Teilnehmer',
      createButton: 'Erstellen',
    },
  },
  clubMembers: {
    sections: {
      officers: 'Vorstand',
      members: 'Mitglieder',
      pending: 'Ausstehend',
    },
    roles: {
      president: 'Präsident',
      vice_president: 'Vizepräsident',
      secretary: 'Sekretär',
      treasurer: 'Schatzmeister',
      member: 'Mitglied',
    },
  },
};

// === PORTUGUESE (pt) ===
const ptTranslations = {
  common: {
    ok: 'OK',
  },
  auth: {
    register: {
      success: {
        ok: 'OK',
      },
    },
  },
  units: {
    km: 'km',
    distanceKm: '{{distance}} km',
  },
  editProfile: {
    common: {
      ok: 'OK',
    },
  },
  clubTournamentManagement: {
    common: {
      confirm: 'OK',
    },
  },
  eventCard: {
    labels: {
      participants: '{{current}}/{{max}}',
    },
  },
  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      japanese: '日本語',
    },
  },
  duesManagement: {
    alerts: {
      ok: 'OK',
    },
  },
  editClubPolicy: {
    ok: 'OK',
  },
  teamInvitations: {
    ok: 'OK',
  },
  createClubLeague: {
    ok: 'OK',
  },
  manageAnnouncement: {
    ok: 'OK',
  },
  myClubSettings: {
    alerts: {
      ok: 'OK',
    },
  },
  hallOfFame: {
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  recordScore: {
    alerts: {
      confirm: 'OK',
    },
  },
  matches: {
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    createModal: {
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
  },
  home: {
    bottomNav: {
      myActivities: 'Minhas atividades',
      matches: 'Partidas',
      home: 'Início',
      clubs: 'Clubes',
      profile: 'Perfil',
    },
  },
  clubOverviewScreen: {
    tabs: {
      announcements: 'Anúncios',
      events: 'Eventos',
      members: 'Membros',
      policies: 'Políticas',
      leaguesAndTournaments: 'Ligas e torneios',
      statistics: 'Estatísticas',
    },
  },
  clubEvents: {
    createEvent: {
      title: 'Criar evento',
      eventName: 'Nome do evento',
      eventDescription: 'Descrição',
      eventDate: 'Data',
      eventTime: 'Horário',
      eventLocation: 'Local',
      maxParticipants: 'Máximo de participantes',
      createButton: 'Criar',
    },
  },
  clubMembers: {
    sections: {
      officers: 'Diretoria',
      members: 'Membros',
      pending: 'Pendentes',
    },
    roles: {
      president: 'Presidente',
      vice_president: 'Vice-presidente',
      secretary: 'Secretário',
      treasurer: 'Tesoureiro',
      member: 'Membro',
    },
  },
  createClubEvent: {
    title: 'Criar evento do clube',
    eventName: 'Nome do evento',
    eventDescription: 'Descrição',
    eventDate: 'Data',
    eventTime: 'Horário',
    eventLocation: 'Local',
    maxParticipants: 'Máximo de participantes',
    createButton: 'Criar',
    cancelButton: 'Cancelar',
  },
  leagueDetail: {
    tabs: {
      overview: 'Visão geral',
      schedule: 'Calendário',
      standings: 'Classificação',
      players: 'Jogadores',
      rules: 'Regras',
    },
    standings: {
      rank: 'Pos.',
      player: 'Jogador',
      wins: 'V',
      losses: 'D',
      points: 'Pts',
    },
  },
  tournamentDetail: {
    tabs: {
      overview: 'Visão geral',
      bpaddle: 'Chave',
      participants: 'Participantes',
      rules: 'Regras',
    },
  },
  clubPolicies: {
    title: 'Políticas do clube',
    sections: {
      general: 'Políticas gerais',
      code_of_conduct: 'Código de conduta',
      court_usage: 'Uso das quadras',
      membership: 'Associação',
      fees: 'Taxas',
    },
  },
  clubStatistics: {
    title: 'Estatísticas do clube',
    overview: {
      totalMembers: 'Total de membros',
      activeMembers: 'Membros ativos',
      totalEvents: 'Total de eventos',
      upcomingEvents: 'Próximos eventos',
    },
  },
  myClubAnnouncements: {
    title: 'Anúncios',
    createButton: 'Criar anúncio',
    noAnnouncements: 'Sem anúncios',
  },
  myClubEvents: {
    title: 'Eventos',
    createButton: 'Criar evento',
    noEvents: 'Sem eventos',
  },
  myClubMembers: {
    title: 'Membros',
    searchPlaceholder: 'Buscar membros',
    noMembers: 'Sem membros',
  },
  myClubPolicies: {
    title: 'Políticas',
    editButton: 'Editar',
    noPolicies: 'Sem políticas',
  },
};

// Select translations based on language
const translations = {
  ru: ruTranslations,
  zh: zhTranslations,
  es: esTranslations,
  de: deTranslations,
  pt: ptTranslations,
}[lang];

if (!translations) {
  console.error(`Unknown language: ${lang}`);
  process.exit(1);
}

// Apply deep merge
const updated = deepMerge(langData, translations);
const translatedCount = countKeys(translations);

// Write back
fs.writeFileSync(langPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log(`✅ ${lang.toUpperCase()} translation completed!`);
console.log(`📊 Translated ${translatedCount} keys`);
console.log(`📁 Updated: ${langPath}`);
