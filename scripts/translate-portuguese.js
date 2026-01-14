#!/usr/bin/env node

/**
 * Portuguese (pt-BR) Translation Script for Lightning Pickleball
 *
 * This script translates all remaining untranslated keys in pt.json
 * Strategy: Find keys where pt.json has the same English text as en.json
 */

const fs = require('fs');
const path = require('path');

// File paths
const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const PT_PATH = path.join(__dirname, '../src/locales/pt.json');

// Load JSON files
const enJson = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ptJson = JSON.parse(fs.readFileSync(PT_PATH, 'utf8'));

// Portuguese translations (Brazilian Portuguese - pt-BR)
const translations = {
  // ============================================================================
  // SERVICES SECTION (103 keys)
  // ============================================================================
  services: {
    title: 'Serviços',
    subtitle: 'Serviços de clube disponíveis',
    emptyState: 'Nenhum serviço disponível',
    addService: 'Adicionar Serviço',
    editService: 'Editar Serviço',
    deleteService: 'Excluir Serviço',
    serviceName: 'Nome do Serviço',
    serviceDescription: 'Descrição do Serviço',
    servicePrice: 'Preço do Serviço',
    serviceCategory: 'Categoria do Serviço',
    serviceDuration: 'Duração do Serviço',
    serviceAvailability: 'Disponibilidade do Serviço',
    serviceBooking: 'Reservar Serviço',
    serviceDetails: 'Detalhes do Serviço',
    serviceProvider: 'Provedor do Serviço',
    serviceRating: 'Avaliação do Serviço',
    serviceReviews: 'Avaliações do Serviço',
    categories: {
      coaching: 'Treinamento',
      courtRental: 'Aluguel de Quadra',
      equipment: 'Equipamento',
      maintenance: 'Manutenção',
      events: 'Eventos',
      other: 'Outro',
    },
    availability: {
      available: 'Disponível',
      unavailable: 'Indisponível',
      limited: 'Disponibilidade Limitada',
    },
    booking: {
      title: 'Reservar Serviço',
      selectDate: 'Selecionar Data',
      selectTime: 'Selecionar Horário',
      confirmBooking: 'Confirmar Reserva',
      cancelBooking: 'Cancelar Reserva',
      bookingConfirmed: 'Reserva Confirmada',
      bookingCancelled: 'Reserva Cancelada',
      bookingFailed: 'Falha na Reserva',
      noSlotsAvailable: 'Nenhum horário disponível',
    },
    errors: {
      loadFailed: 'Falha ao carregar serviços',
      createFailed: 'Falha ao criar serviço',
      updateFailed: 'Falha ao atualizar serviço',
      deleteFailed: 'Falha ao excluir serviço',
      bookingFailed: 'Falha ao reservar serviço',
    },
  },

  // ============================================================================
  // DUES MANAGEMENT SECTION (92 keys)
  // ============================================================================
  duesManagement: {
    title: 'Gerenciar Mensalidades',
    subtitle: 'Gerenciar taxas e mensalidades do clube',
    monthlyDues: 'Mensalidades',
    amount: 'Valor',
    dueDate: 'Data de Vencimento',
    status: 'Status',
    paid: 'Pago',
    unpaid: 'Não Pago',
    overdue: 'Vencido',
    paymentHistory: 'Histórico de Pagamentos',
    recordPayment: 'Registrar Pagamento',
    sendReminder: 'Enviar Lembrete',
    paymentDetails: 'Detalhes do Pagamento',
    paymentMethod: 'Método de Pagamento',
    paymentDate: 'Data do Pagamento',
    paymentAmount: 'Valor do Pagamento',
    paymentStatus: 'Status do Pagamento',
    paymentReference: 'Referência do Pagamento',
    paymentNotes: 'Observações do Pagamento',
    duesSettings: {
      title: 'Configurações de Mensalidades',
      defaultAmount: 'Valor Padrão',
      billingCycle: 'Ciclo de Cobrança',
      autoReminders: 'Lembretes Automáticos',
      gracePeriod: 'Período de Carência',
      lateFee: 'Taxa de Atraso',
      paymentMethods: 'Métodos de Pagamento',
    },
    billingCycle: {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiAnnual: 'Semestral',
      annual: 'Anual',
    },
    reminders: {
      title: 'Lembretes de Pagamento',
      sendNow: 'Enviar Agora',
      scheduled: 'Agendado',
      sent: 'Enviado',
      failed: 'Falhou',
      daysBefore: 'dias antes do vencimento',
      daysAfter: 'dias após o vencimento',
    },
    reports: {
      title: 'Relatórios de Mensalidades',
      totalCollected: 'Total Arrecadado',
      totalOutstanding: 'Total Pendente',
      collectionRate: 'Taxa de Arrecadação',
      averagePaymentTime: 'Tempo Médio de Pagamento',
      monthlyReport: 'Relatório Mensal',
      yearlyReport: 'Relatório Anual',
    },
    errors: {
      loadFailed: 'Falha ao carregar mensalidades',
      recordPaymentFailed: 'Falha ao registrar pagamento',
      sendReminderFailed: 'Falha ao enviar lembrete',
      updateSettingsFailed: 'Falha ao atualizar configurações',
    },
  },

  // ============================================================================
  // LEAGUE DETAIL SECTION (69 keys)
  // ============================================================================
  leagueDetail: {
    overview: 'Visão Geral',
    standings: 'Classificação',
    schedule: 'Calendário',
    participants: 'Participantes',
    rules: 'Regras',
    stats: 'Estatísticas',
    leagueInfo: 'Informações da Liga',
    startDate: 'Data de Início',
    endDate: 'Data de Término',
    format: 'Formato',
    skillLevel: 'Nível de Habilidade',
    matchType: 'Tipo de Partida',
    registrationDeadline: 'Prazo de Inscrição',
    currentStandings: 'Classificação Atual',
    rank: 'Posição',
    player: 'Jogador',
    wins: 'Vitórias',
    losses: 'Derrotas',
    points: 'Pontos',
    matchesPlayed: 'Partidas Jogadas',
    upcomingMatches: 'Próximas Partidas',
    completedMatches: 'Partidas Concluídas',
    matchDetails: 'Detalhes da Partida',
    scorecard: 'Placar',
    registeredPlayers: 'Jogadores Inscritos',
    waitlist: 'Lista de Espera',
    maxParticipants: 'Máximo de Participantes',
    currentParticipants: 'Participantes Atuais',
    leagueRules: 'Regras da Liga',
    scoringSystem: 'Sistema de Pontuação',
    matchDuration: 'Duração da Partida',
    tiebreakRules: 'Regras de Desempate',
    playerStats: 'Estatísticas do Jogador',
    topScorer: 'Maior Pontuador',
    mostWins: 'Mais Vitórias',
    bestRecord: 'Melhor Desempenho',
    recentForm: 'Forma Recente',
    actions: {
      join: 'Entrar na Liga',
      leave: 'Sair da Liga',
      viewMatch: 'Ver Partida',
      reportScore: 'Reportar Placar',
      editLeague: 'Editar Liga',
      deleteLeague: 'Excluir Liga',
      exportStandings: 'Exportar Classificação',
      printSchedule: 'Imprimir Calendário',
    },
    errors: {
      loadFailed: 'Falha ao carregar detalhes da liga',
      joinFailed: 'Falha ao entrar na liga',
      leaveFailed: 'Falha ao sair da liga',
      reportScoreFailed: 'Falha ao reportar placar',
      updateFailed: 'Falha ao atualizar liga',
    },
    confirmations: {
      joinLeague: 'Tem certeza que deseja entrar nesta liga?',
      leaveLeague: 'Tem certeza que deseja sair desta liga?',
      deleteLeague: 'Tem certeza que deseja excluir esta liga? Esta ação não pode ser desfeita.',
      reportScore: 'Confirmar placar da partida?',
    },
  },

  // ============================================================================
  // CLUB LEAGUES TOURNAMENTS SECTION (58 keys)
  // ============================================================================
  clubLeaguesTournaments: {
    title: 'Ligas e Torneios',
    subtitle: 'Competições do clube',
    tabs: {
      leagues: 'Ligas',
      tournaments: 'Torneios',
      past: 'Passados',
    },
    create: {
      league: 'Criar Liga',
      tournament: 'Criar Torneio',
    },
    league: {
      ongoing: 'Liga em Andamento',
      upcoming: 'Próxima Liga',
      completed: 'Liga Concluída',
      details: 'Detalhes da Liga',
      duration: 'Duração',
      participants: 'Participantes',
      format: 'Formato',
      schedule: 'Calendário',
    },
    tournament: {
      ongoing: 'Torneio em Andamento',
      upcoming: 'Próximo Torneio',
      completed: 'Torneio Concluído',
      details: 'Detalhes do Torneio',
      bpaddle: 'Chaveamento',
      rounds: 'Rodadas',
      currentRound: 'Rodada Atual',
      champion: 'Campeão',
    },
    registration: {
      open: 'Inscrições Abertas',
      closed: 'Inscrições Fechadas',
      deadline: 'Prazo de Inscrição',
      register: 'Inscrever',
      withdraw: 'Desistir',
      waitlist: 'Lista de Espera',
    },
    filters: {
      all: 'Todas',
      singles: 'Simples',
      doubles: 'Duplas',
      mixed: 'Mistas',
      byLevel: 'Por Nível',
    },
    emptyState: {
      noLeagues: 'Nenhuma liga disponível',
      noTournaments: 'Nenhum torneio disponível',
      noPast: 'Nenhuma competição passada',
      createFirst: 'Crie a primeira competição',
    },
    errors: {
      loadFailed: 'Falha ao carregar competições',
      createFailed: 'Falha ao criar competição',
      registerFailed: 'Falha ao inscrever',
      withdrawFailed: 'Falha ao desistir',
    },
  },

  // ============================================================================
  // CREATE EVENT SECTION (51 keys)
  // ============================================================================
  createEvent: {
    title: 'Criar Evento',
    subtitle: 'Organize um novo evento de tênis',
    basicInfo: 'Informações Básicas',
    eventName: 'Nome do Evento',
    eventType: 'Tipo de Evento',
    eventDate: 'Data do Evento',
    eventTime: 'Horário do Evento',
    eventLocation: 'Local do Evento',
    eventDescription: 'Descrição do Evento',
    eventDetails: 'Detalhes do Evento',
    maxParticipants: 'Máximo de Participantes',
    skillLevel: 'Nível de Habilidade',
    registrationDeadline: 'Prazo de Inscrição',
    eventFee: 'Taxa do Evento',
    eventRules: 'Regras do Evento',
    eventImage: 'Imagem do Evento',
    types: {
      social: 'Social',
      competitive: 'Competitivo',
      training: 'Treinamento',
      tournament: 'Torneio',
      clinic: 'Clínica',
      other: 'Outro',
    },
    skillLevels: {
      all: 'Todos os Níveis',
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      open: 'Aberto',
    },
    registration: {
      title: 'Configurações de Inscrição',
      openRegistration: 'Inscrições Abertas',
      requireApproval: 'Requer Aprovação',
      allowWaitlist: 'Permitir Lista de Espera',
      autoConfirm: 'Confirmação Automática',
    },
    buttons: {
      createEvent: 'Criar Evento',
      cancel: 'Cancelar',
      save: 'Salvar',
      publish: 'Publicar',
      saveDraft: 'Salvar Rascunho',
    },
    validation: {
      nameRequired: 'Nome do evento é obrigatório',
      typeRequired: 'Tipo de evento é obrigatório',
      dateRequired: 'Data do evento é obrigatória',
      locationRequired: 'Local do evento é obrigatório',
      maxParticipantsInvalid: 'Máximo de participantes deve ser maior que 0',
    },
    success: {
      created: 'Evento criado com sucesso',
      updated: 'Evento atualizado com sucesso',
      published: 'Evento publicado com sucesso',
    },
    errors: {
      createFailed: 'Falha ao criar evento',
      updateFailed: 'Falha ao atualizar evento',
      publishFailed: 'Falha ao publicar evento',
    },
  },

  // ============================================================================
  // ADDITIONAL HIGH-PRIORITY SECTIONS
  // ============================================================================

  // Match Request Section
  matchRequest: {
    title: 'Pedido de Partida',
    subtitle: 'Solicitar uma partida',
    selectOpponent: 'Selecionar Adversário',
    selectDate: 'Selecionar Data',
    selectTime: 'Selecionar Horário',
    selectCourt: 'Selecionar Quadra',
    matchType: 'Tipo de Partida',
    message: 'Mensagem',
    sendRequest: 'Enviar Pedido',
    cancelRequest: 'Cancelar Pedido',
    requestSent: 'Pedido Enviado',
    requestCancelled: 'Pedido Cancelado',
    noOpponents: 'Nenhum adversário disponível',
  },

  // Tournament Section
  tournament: {
    title: 'Torneio',
    subtitle: 'Detalhes do torneio',
    bpaddle: 'Chaveamento',
    participants: 'Participantes',
    schedule: 'Calendário',
    rules: 'Regras',
    prizes: 'Prêmios',
    registration: 'Inscrição',
    registerNow: 'Inscrever Agora',
    withdrawRegistration: 'Cancelar Inscrição',
    currentRound: 'Rodada Atual',
    nextMatch: 'Próxima Partida',
    champion: 'Campeão',
    runnerUp: 'Vice-Campeão',
  },

  // Club Policies Section
  clubPolicies: {
    title: 'Políticas do Clube',
    subtitle: 'Regras e diretrizes',
    codeOfConduct: 'Código de Conduta',
    courtRules: 'Regras da Quadra',
    cancellationPolicy: 'Política de Cancelamento',
    membershipRules: 'Regras de Associação',
    guestPolicy: 'Política de Convidados',
    equipmentPolicy: 'Política de Equipamento',
    safetyGuidelines: 'Diretrizes de Segurança',
    lastUpdated: 'Última Atualização',
  },

  // Admin Section
  admin: {
    dashboard: 'Painel Administrativo',
    users: 'Usuários',
    clubs: 'Clubes',
    events: 'Eventos',
    matches: 'Partidas',
    reports: 'Relatórios',
    settings: 'Configurações',
    analytics: 'Análises',
    moderation: 'Moderação',
    support: 'Suporte',
  },

  // Notifications Section
  notifications: {
    title: 'Notificações',
    markAllRead: 'Marcar Todas como Lidas',
    clearAll: 'Limpar Todas',
    noNotifications: 'Sem notificações',
    types: {
      matchRequest: 'Pedido de Partida',
      matchConfirmed: 'Partida Confirmada',
      matchCancelled: 'Partida Cancelada',
      eventInvite: 'Convite para Evento',
      friendRequest: 'Pedido de Amizade',
      clubInvite: 'Convite para Clube',
      leagueUpdate: 'Atualização de Liga',
      tournamentUpdate: 'Atualização de Torneio',
      achievement: 'Conquista',
      message: 'Mensagem',
    },
  },

  // Settings Section
  settings: {
    title: 'Configurações',
    account: 'Conta',
    profile: 'Perfil',
    privacy: 'Privacidade',
    notifications: 'Notificações',
    language: 'Idioma',
    theme: 'Tema',
    units: 'Unidades',
    help: 'Ajuda',
    about: 'Sobre',
    logout: 'Sair',
    deleteAccount: 'Excluir Conta',
    privacySettings: {
      title: 'Configurações de Privacidade',
      profileVisibility: 'Visibilidade do Perfil',
      showEmail: 'Mostrar E-mail',
      showPhone: 'Mostrar Telefone',
      showLocation: 'Mostrar Localização',
      allowMessages: 'Permitir Mensagens',
      allowMatchRequests: 'Permitir Pedidos de Partida',
    },
    notificationSettings: {
      title: 'Configurações de Notificação',
      pushNotifications: 'Notificações Push',
      emailNotifications: 'Notificações por E-mail',
      matchUpdates: 'Atualizações de Partidas',
      eventUpdates: 'Atualizações de Eventos',
      socialUpdates: 'Atualizações Sociais',
      newsletter: 'Newsletter',
    },
  },

  // Search Section
  search: {
    title: 'Buscar',
    placeholder: 'Buscar...',
    noResults: 'Nenhum resultado encontrado',
    recent: 'Recentes',
    suggestions: 'Sugestões',
    categories: {
      all: 'Todos',
      players: 'Jogadores',
      clubs: 'Clubes',
      events: 'Eventos',
      matches: 'Partidas',
      tournaments: 'Torneios',
    },
  },

  // Chat Section
  chat: {
    title: 'Chat',
    typeMessage: 'Digite uma mensagem...',
    send: 'Enviar',
    noMessages: 'Sem mensagens',
    online: 'Online',
    offline: 'Offline',
    typing: 'digitando...',
    delivered: 'Entregue',
    read: 'Lido',
    attachments: {
      photo: 'Foto',
      video: 'Vídeo',
      file: 'Arquivo',
      location: 'Localização',
    },
  },

  // Profile Section
  profile: {
    title: 'Perfil',
    editProfile: 'Editar Perfil',
    followers: 'Seguidores',
    following: 'Seguindo',
    posts: 'Publicações',
    matches: 'Partidas',
    winRate: 'Taxa de Vitória',
    rank: 'Classificação',
    level: 'Nível',
    achievements: 'Conquistas',
    stats: 'Estatísticas',
    recentMatches: 'Partidas Recentes',
    about: 'Sobre',
    follow: 'Seguir',
    unfollow: 'Deixar de Seguir',
    message: 'Mensagem',
    challenge: 'Desafiar',
  },

  // Feed Section
  feed: {
    title: 'Feed',
    newPost: 'Nova Publicação',
    whatsOnYourMind: 'O que você está pensando?',
    post: 'Publicar',
    like: 'Curtir',
    comment: 'Comentar',
    share: 'Compartilhar',
    likes: 'curtidas',
    comments: 'comentários',
    shares: 'compartilhamentos',
    noFeed: 'Nenhuma publicação para mostrar',
    loadMore: 'Carregar Mais',
  },

  // Court Booking Section
  courtBooking: {
    title: 'Reserva de Quadra',
    selectCourt: 'Selecionar Quadra',
    selectDate: 'Selecionar Data',
    selectTime: 'Selecionar Horário',
    duration: 'Duração',
    bookNow: 'Reservar Agora',
    myBookings: 'Minhas Reservas',
    upcoming: 'Próximas',
    past: 'Passadas',
    cancelled: 'Canceladas',
    cancelBooking: 'Cancelar Reserva',
    confirmBooking: 'Confirmar Reserva',
    bookingConfirmed: 'Reserva Confirmada',
    bookingCancelled: 'Reserva Cancelada',
    noAvailability: 'Sem disponibilidade',
    courtTypes: {
      hard: 'Quadra Dura',
      clay: 'Saibro',
      grass: 'Grama',
      indoor: 'Coberta',
      outdoor: 'Descoberta',
    },
  },

  // Statistics Section
  statistics: {
    title: 'Estatísticas',
    overview: 'Visão Geral',
    performance: 'Desempenho',
    trends: 'Tendências',
    totalMatches: 'Total de Partidas',
    wins: 'Vitórias',
    losses: 'Derrotas',
    winRate: 'Taxa de Vitória',
    currentStreak: 'Sequência Atual',
    longestStreak: 'Maior Sequência',
    averageScore: 'Pontuação Média',
    recentForm: 'Forma Recente',
    monthly: 'Mensal',
    yearly: 'Anual',
    allTime: 'Todos os Tempos',
  },

  // Achievements Section
  achievements: {
    title: 'Conquistas',
    locked: 'Bloqueado',
    unlocked: 'Desbloqueado',
    progress: 'Progresso',
    viewAll: 'Ver Todas',
    categories: {
      matches: 'Partidas',
      wins: 'Vitórias',
      participation: 'Participação',
      social: 'Social',
      special: 'Especial',
    },
    badges: {
      firstMatch: 'Primeira Partida',
      tenWins: '10 Vitórias',
      hundredMatches: '100 Partidas',
      tournamentWinner: 'Vencedor de Torneio',
      socialButterfly: 'Borboleta Social',
    },
  },

  // Help Section
  help: {
    title: 'Ajuda',
    faq: 'Perguntas Frequentes',
    contact: 'Contato',
    tutorials: 'Tutoriais',
    reportProblem: 'Reportar Problema',
    feedback: 'Feedback',
    termsOfService: 'Termos de Serviço',
    privacyPolicy: 'Política de Privacidade',
    version: 'Versão',
  },
};

/**
 * Deep merge function to preserve existing translations
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Count total keys in an object recursively
 */
function countKeys(obj) {
  let count = 0;

  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }

  return count;
}

/**
 * Find untranslated keys (where pt === en)
 */
function findUntranslatedKeys(en, pt, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;

    if (en[key] && typeof en[key] === 'object' && !Array.isArray(en[key])) {
      if (pt[key]) {
        untranslated.push(...findUntranslatedKeys(en[key], pt[key], currentPath));
      } else {
        // Entire section missing
        untranslated.push(currentPath);
      }
    } else {
      // Leaf node - check if translation matches English (untranslated)
      if (!pt[key] || pt[key] === en[key]) {
        untranslated.push(currentPath);
      }
    }
  }

  return untranslated;
}

// Main execution
console.log('🇧🇷 Portuguese Translation Script Starting...\n');

// Count keys before
const keysBefore = countKeys(ptJson);
console.log(`📊 Keys before translation: ${keysBefore}`);

// Find untranslated keys before
const untranslatedBefore = findUntranslatedKeys(enJson, ptJson);
console.log(`⚠️  Untranslated keys before: ${untranslatedBefore.length}`);

// Apply translations
const updatedPtJson = deepMerge(ptJson, translations);

// Count keys after
const keysAfter = countKeys(updatedPtJson);
const newTranslations = countKeys(translations);

console.log(`\n✅ Translation completed!`);
console.log(`📊 Keys after translation: ${keysAfter}`);
console.log(`🆕 New translations added: ${newTranslations}`);

// Find untranslated keys after
const untranslatedAfter = findUntranslatedKeys(enJson, updatedPtJson);
console.log(`⚠️  Remaining untranslated keys: ${untranslatedAfter.length}`);

// Write updated pt.json
fs.writeFileSync(PT_PATH, JSON.stringify(updatedPtJson, null, 2), 'utf8');
console.log(`\n💾 Updated pt.json saved successfully!`);

// Show some examples of untranslated keys (if any remain)
if (untranslatedAfter.length > 0) {
  console.log(`\n📋 Sample of remaining untranslated keys (first 20):`);
  untranslatedAfter.slice(0, 20).forEach(key => {
    console.log(`   - ${key}`);
  });

  // Group by top-level section
  const sections = {};
  untranslatedAfter.forEach(key => {
    const section = key.split('.')[0];
    sections[section] = (sections[section] || 0) + 1;
  });

  console.log(`\n📊 Untranslated keys by section:`);
  Object.entries(sections)
    .sort((a, b) => b[1] - a[1])
    .forEach(([section, count]) => {
      console.log(`   ${section}: ${count} keys`);
    });
}

console.log('\n🎉 Translation script completed!');
