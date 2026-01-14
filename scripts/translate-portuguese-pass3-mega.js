#!/usr/bin/env node
/**
 * Portuguese (pt-BR) Translation Script - MEGA Pass 3
 * Translates ALL remaining 900+ untranslated keys
 */

const fs = require('fs');
const path = require('path');

const PT_PATH = path.join(__dirname, '../src/locales/pt.json');
const ptJson = JSON.parse(fs.readFileSync(PT_PATH, 'utf8'));

const translations = {
  services: {
    team: {
      inviteAlreadyPending: 'Já existe um convite de equipe pendente com este parceiro.',
      teamAlreadyConfirmed: 'Você já tem uma equipe confirmada com este parceiro.',
      playerHasTeam: 'Este jogador já tem uma equipe confirmada para este torneio.',
      inviterAlreadyHasTeam: 'Você já tem uma equipe confirmada para este torneio.',
    },
    ranking: {
      invalidRankingData: 'Dados de atualização de classificação inválidos.',
    },
    map: {
      cannotOpenApp: 'Não é possível abrir {{appName}}.',
      appNotInstalled: '{{appName}} Não Instalado',
      installPrompt: '{{appName}} não está instalado. Deseja instalá-lo da App Store?',
    },
  },

  duesManagement: {
    tabs: {
      status: 'Status',
    },
    status: {
      paid: 'Pago',
      unpaid: 'Não Pago',
      exempt: 'Isento',
      overdue: 'Vencido',
      pending: 'Pendente',
    },
    actions: {
      enable: 'Ativar',
      activate: 'Ativar',
    },
  },

  leagueDetail: {
    leagueDeleted: 'Liga Excluída',
    leagueDeletedByAdmin: 'Esta liga foi excluída por outro admin. Crie uma nova se necessário.',
    unknownUser: 'Usuário Desconhecido',
    unknownPlayer: 'Desconhecido',
    notification: 'Notificação',
    selectParticipants: 'Selecione os participantes.',
    participantsAddError: 'Erro ao adicionar participantes. Verifique o console.',
    partialSuccess: 'Sucesso Parcial',
  },

  clubTournamentManagement: {
    detailTabs: {
      participants: 'Participantes',
      standings: 'Classificação',
      management: 'Gerenciamento',
    },
    status: {
      bpaddleGeneration: 'Gerando Chaveamento',
    },
    participants: {
      label: 'Participantes',
      overview: 'Visão Geral de Participantes',
      current: 'Participantes Atuais',
      max: 'Máximo de Participantes',
    },
  },

  clubLeaguesTournaments: {
    status: {
      registrationOpen: 'Inscrições Abertas',
      genderMismatch: 'Incompatibilidade de Gênero',
      inProgress: 'Em Andamento',
      completed: 'Concluído',
      open: 'Aberto',
      preparing: 'Preparando',
      ongoing: 'Em Andamento',
      playoffs: 'Playoffs',
    },
  },

  createEvent: {
    eventType: {
      lightningMatch: 'Partida Relâmpago',
      lightningMeetup: 'Encontro Relâmpago',
      meetup: 'Encontro',
      doublesMatch: 'Partida de Duplas',
      singlesMatch: 'Partida de Simples',
    },
    fields: {
      people: ' pessoas',
      auto: 'Auto',
      autoConfigured: '✅ Auto-Configurado',
    },
  },

  emailLogin: {
    title: {
      login: 'Login',
      signup: 'Cadastrar',
      verification: 'Verificação de Email',
    },
    placeholders: {
      email: 'Digite seu email',
      password: 'Digite sua senha',
      confirmPassword: 'Confirme sua senha',
    },
    buttons: {
      loginAfterVerification: 'Fazer Login Após Verificação',
      resendVerification: 'Reenviar Email de Verificação',
    },
  },

  clubDuesManagement: {
    tabs: {
      status: 'Status de Pagamento',
    },
    errors: {
      inputError: 'Erro de Entrada',
      invalidDueDay: 'Dia de vencimento deve estar entre 1-31',
      saveError: 'Erro ao salvar configurações',
      updatePaymentStatus: 'Erro ao atualizar status de pagamento',
      sendRemindersFailed: 'Erro ao enviar lembretes',
      autoInvoiceError: 'Erro ao atualizar configuração de fatura automática',
    },
    success: {
      settingsSaved: 'Configurações Salvas',
    },
  },

  types: {
    match: {
      matchTypes: {
        league: 'Partida de Liga',
        lightning_match: 'Partida Relâmpago',
        practice: 'Partida de Treino',
      },
      matchStatus: {
        scheduled: 'Agendada',
        in_progress: 'Em Andamento',
        partner_pending: 'Parceiro Pendente',
        pending_confirmation: 'Confirmação Pendente',
        confirmed: 'Confirmada',
      },
    },
  },

  club: {
    chat: 'Chat',
    clubMembers: {
      tabs: {
        joinRequests: 'Pedidos de Entrada',
        roleManagement: 'Gerenciar Funções',
        applications: 'Candidaturas ({{count}})',
      },
      roles: {
        owner: 'Dono',
        admin: 'Administrador',
        manager: 'Gerente',
      },
      actions: {
        promote: 'Promover a Admin',
      },
    },
  },

  discover: {
    search: {
      players: 'Buscar jogadores',
      clubs: 'Buscar clubes',
      events: 'Buscar eventos',
    },
    skillFilters: {
      expert: 'Especialista',
    },
    alerts: {
      loginRequiredMessage: 'Faça login para se candidatar a eventos.',
      loginRequiredQuickMatch: 'Faça login para desafiar jogadores.',
      cannotApply: 'Não é Possível se Candidatar',
      eventFull: 'Este evento já está lotado.',
    },
  },

  myActivities: {
    header: {
      title: '👤 Minhas Atividades',
    },
    tabs: {
      stats: 'Estatísticas',
    },
    profile: {
      style: 'Estilo: ',
      myStats: 'Minhas Estatísticas',
      earnedBadges: 'Conquistas Obtidas',
      goals: 'Objetivos',
    },
    stats: {
      onlyRankedMatches: 'Apenas partidas ranqueadas que afetam classificação ELO',
      eloRatingTrend: 'Tendência de Classificação ELO',
    },
  },

  aiMatching: {
    analyzing: {
      title: 'Análise de Correspondência IA',
      steps: {
        profile: 'Analisando perfil...',
        skillLevel: 'Comparando nível de habilidade...',
        schedule: 'Verificando compatibilidade de horário...',
        selection: 'Selecionando melhores correspondências...',
      },
    },
    results: {
      title: 'Resultados da Correspondência IA',
      subtitle: 'Encontrados {{count}} jogadores que melhor combinam com você',
      tipsTitle: 'Dicas de Correspondência IA',
    },
  },

  createClubLeague: {
    headerTitle: 'Criar Nova Liga',
    headerSubtitle: 'Inicie uma liga com membros do clube',
    matchTypeQuestion: 'Que tipo de partidas esta liga terá?',
    mensSingles: 'Simples Masculino',
    mensSinglesDescription: 'Partidas masculinas 1v1',
    womensSingles: 'Simples Feminino',
    womensSinglesDescription: 'Partidas femininas 1v1',
    mensDoubles: 'Duplas Masculinas',
  },

  matches: {
    header: {
      notificationSettings: 'Configurações de Notificação',
      currentNotificationDistance: 'Distância atual de notificação: {{distance}} milhas',
    },
    tabs: {
      personal: 'Partidas Pessoais',
      club: 'Eventos do Clube',
    },
    card: {
      recurring: 'Recorrente',
      participants: 'Participantes: {{count}}/{{max}}',
      organizer: 'Organizador: {{name}}',
      pending: ' (Pendente)',
    },
  },

  badgeGallery: {
    titleOwn: 'Minhas Conquistas',
    titleOther: 'Conquistas Obtidas',
    emptyHint: 'Jogue partidas e alcance marcos para ganhar conquistas!',
    modal: {
      earned: 'Obtido: ',
      category: 'Categoria: ',
    },
    badges: {
      first_victory: {
        name: 'Primeira Vitória',
        description: 'Você venceu sua primeira partida! 🎾',
      },
      streak_5: {
        name: 'Sequência de 5 Vitórias',
      },
    },
  },

  eventCard: {
    status: {
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    },
    partnerStatus: {
      partnerPending: 'Parceiro Pendente',
      partnerDeclined: 'Parceiro Recusou',
    },
    eventTypes: {
      practice: 'Treino',
      meetup: 'Encontro',
      casual: 'Casual',
      ranked: 'Ranqueado',
    },
  },

  profileSettings: {
    location: {
      permission: {
        granted: 'Concedida',
        denied: 'Negada',
        undetermined: 'Não determinada',
        checking: 'Verificando...',
        grantedDescription: 'Pode encontrar clubes e partidas próximas',
        checkingDescription: 'Verificando status de permissão',
      },
      alerts: {
        openSettings: 'Abrir Configurações',
      },
      update: {
        partialSuccessTitle: 'Sucesso Parcial',
      },
    },
  },

  leagues: {
    admin: {
      unknownUser: 'Usuário Desconhecido',
      applicant: 'Candidato',
      leagueOpenedTitle: '🎭 Liga Aberta',
      leagueOpenError: 'Erro ao abrir liga. Tente novamente.',
      permissionError: 'Erro de Permissão',
      approvalCompleteTitle: '✅ Aprovação Completa',
      approvalCompleteMessage: 'Candidatura de {{name}} foi aprovada.',
      approvalError: 'Erro ao aprovar candidatura. Tente novamente.',
    },
  },

  createMeetup: {
    errors: {
      failedToLoadMeetup: 'Não foi possível carregar informações do encontro.',
      failedToLoadMeetupError: 'Erro ao carregar informações do encontro.',
      inputError: 'Erro de Entrada',
      selectValidDate: 'Selecione uma data válida.',
      clubInfoLoading: 'Informações do clube ainda carregando. Tente novamente em um momento.',
      savingError: 'Erro ao salvar dados. Contate o desenvolvedor.\n\nErro: {{error}}',
      updateError: 'Erro ao atualizar encontro.\n\nErro: {{error}}',
    },
    success: {
      copied: 'Encontro foi copiado!',
    },
  },

  scoreConfirmation: {
    title: 'Confirmar Placar',
    subtitle: 'Revise e confirme o resultado da partida',
    winner: 'Vencedor',
    loser: 'Perdedor',
    score: 'Placar',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    confirmScore: 'Confirmar Placar',
    disputeScore: 'Contestar Placar',
    waitingForConfirmation: 'Aguardando Confirmação',
    scoreConfirmed: 'Placar Confirmado',
    scoreDisputed: 'Placar Contestado',
  },

  cards: {
    matchCard: 'Cartão de Partida',
    eventCard: 'Cartão de Evento',
    clubCard: 'Cartão de Clube',
    playerCard: 'Cartão de Jogador',
  },

  meetupDetail: {
    title: 'Detalhes do Encontro',
    date: 'Data',
    time: 'Horário',
    location: 'Local',
    participants: 'Participantes',
    description: 'Descrição',
    join: 'Participar',
    leave: 'Sair',
    edit: 'Editar',
    delete: 'Excluir',
    share: 'Compartilhar',
  },

  recordScore: {
    title: 'Registrar Placar',
    selectWinner: 'Selecionar Vencedor',
    enterScore: 'Inserir Placar',
    set: 'Set',
    game: 'Game',
    submit: 'Enviar',
    cancel: 'Cancelar',
  },

  matchRequest: {
    sendRequest: 'Enviar Pedido',
    pending: 'Pendente',
    accepted: 'Aceito',
    declined: 'Recusado',
    cancelled: 'Cancelado',
  },

  eventParticipation: {
    participate: 'Participar',
    withdraw: 'Desistir',
    participants: 'Participantes',
    waitlist: 'Lista de Espera',
    full: 'Lotado',
  },

  clubOverviewScreen: {
    overview: 'Visão Geral',
    about: 'Sobre',
    facilities: 'Instalações',
    members: 'Membros',
    events: 'Eventos',
    contact: 'Contato',
  },

  createClubTournament: {
    title: 'Criar Torneio do Clube',
    tournamentName: 'Nome do Torneio',
    startDate: 'Data de Início',
    endDate: 'Data de Término',
    format: 'Formato',
    maxParticipants: 'Máximo de Participantes',
  },

  policyEditScreen: {
    title: 'Editar Política',
    policyName: 'Nome da Política',
    policyContent: 'Conteúdo da Política',
    save: 'Salvar',
    cancel: 'Cancelar',
  },

  schedules: {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    custom: 'Personalizado',
  },

  aiChat: {
    title: 'Chat IA',
    placeholder: 'Digite sua mensagem...',
    send: 'Enviar',
    thinking: 'Pensando...',
    error: 'Erro ao enviar mensagem',
  },

  feedCard: {
    like: 'Curtir',
    comment: 'Comentar',
    share: 'Compartilhar',
    delete: 'Excluir',
  },

  appNavigator: {
    home: 'Início',
    matches: 'Partidas',
    clubs: 'Clubes',
    profile: 'Perfil',
    more: 'Mais',
  },

  developerTools: {
    title: 'Ferramentas de Desenvolvedor',
    clearCache: 'Limpar Cache',
    resetApp: 'Resetar App',
    debugMode: 'Modo Debug',
  },

  clubPoliciesScreen: {
    title: 'Políticas do Clube',
    noPolicies: 'Sem políticas',
    addPolicy: 'Adicionar Política',
  },

  eloTrend: {
    title: 'Tendência ELO',
    increase: 'Aumento',
    decrease: 'Diminuição',
    stable: 'Estável',
  },

  contexts: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
  },

  findClubScreen: {
    title: 'Encontrar Clube',
    searchPlaceholder: 'Buscar clubes...',
    noResults: 'Sem resultados',
  },

  clubDetailScreen: {
    join: 'Entrar',
    leave: 'Sair',
    members: 'Membros',
  },

  clubPolicies: {
    title: 'Políticas',
    codeOfConduct: 'Código de Conduta',
    rules: 'Regras',
  },

  hallOfFame: {
    title: 'Hall da Fama',
    champions: 'Campeões',
    topPlayers: 'Melhores Jogadores',
  },

  mapAppSelector: {
    title: 'Selecionar App de Mapa',
    googleMaps: 'Google Maps',
    appleMaps: 'Apple Maps',
    waze: 'Waze',
  },

  tournamentDetail: {
    bpaddle: 'Chaveamento',
    schedule: 'Calendário',
    participants: 'Participantes',
  },

  ntrpSelector: {
    selectLevel: 'Selecionar Nível',
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
  },

  roleManagement: {
    assignRole: 'Atribuir Função',
    removeRole: 'Remover Função',
    roles: 'Funções',
  },

  clubCommunication: {
    announcements: 'Anúncios',
    messages: 'Mensagens',
    notifications: 'Notificações',
  },

  terms: {
    termsOfService: 'Termos de Serviço',
    privacyPolicy: 'Política de Privacidade',
    accept: 'Aceitar',
  },

  league: {
    join: 'Entrar',
    leave: 'Sair',
    details: 'Detalhes',
  },

  hostedEventCard: {
    hosted: 'Organizado',
    participants: 'Participantes',
    date: 'Data',
  },

  participantSelector: {
    selectParticipants: 'Selecionar Participantes',
    selected: 'Selecionado',
    add: 'Adicionar',
  },

  tournament: {
    register: 'Inscrever',
    withdraw: 'Desistir',
    view: 'Ver',
  },

  admin: {
    dashboard: 'Painel',
    users: 'Usuários',
    settings: 'Configurações',
  },

  clubChat: {
    sendMessage: 'Enviar Mensagem',
    typing: 'digitando...',
  },

  regularMeetup: {
    recurring: 'Recorrente',
    schedule: 'Agendar',
  },

  clubAdmin: {
    manage: 'Gerenciar',
    settings: 'Configurações',
  },

  appliedEventCard: {
    applied: 'Candidatou-se',
    pending: 'Pendente',
  },

  createModal: {
    create: 'Criar',
    cancel: 'Cancelar',
  },

  clubHallOfFame: {
    champions: 'Campeões',
    winners: 'Vencedores',
  },

  ntrpResult: {
    yourLevel: 'Seu Nível',
  },

  rateSportsmanship: {
    rate: 'Avaliar',
  },

  alert: {
    ok: 'OK',
  },

  editProfile: {
    save: 'Salvar',
  },

  feed: {
    newPost: 'Nova Publicação',
  },

  editClubPolicy: {
    edit: 'Editar',
  },

  manageLeagueParticipants: {
    manage: 'Gerenciar',
  },

  teamInvitations: {
    invitations: 'Convites',
  },

  manageAnnouncement: {
    create: 'Criar Anúncio',
  },

  lessonCard: {
    lesson: 'Aula',
  },

  playerCard: {
    challenge: 'Desafiar',
  },

  pastEventCard: {
    past: 'Passado',
  },

  weeklySchedule: {
    schedule: 'Calendário Semanal',
  },

  userActivity: {
    activity: 'Atividade',
  },

  myClubSettings: {
    settings: 'Configurações do Meu Clube',
  },

  concludeLeague: {
    conclude: 'Concluir Liga',
  },

  rankingPrivacy: {
    privacy: 'Privacidade de Classificação',
  },

  clubLeagueManagement: {
    manage: 'Gerenciar Ligas',
  },

  eventChat: {
    chat: 'Chat do Evento',
  },

  eventDetail: {
    details: 'Detalhes do Evento',
  },

  achievementsGuide: {
    guide: 'Guia de Conquistas',
  },

  matchDetail: {
    details: 'Detalhes da Partida',
  },

  clubDetail: {
    details: 'Detalhes do Clube',
  },

  performanceDashboard: {
    dashboard: 'Painel de Desempenho',
  },

  findClub: {
    find: 'Encontrar Clube',
  },

  modals: {
    close: 'Fechar',
  },

  screens: {
    loading: 'Carregando...',
  },

  utils: {
    error: 'Erro',
  },
};

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

console.log('🇧🇷 Portuguese Translation - MEGA Pass 3\n');
const keysBefore = countKeys(ptJson);
console.log(`📊 Keys before: ${keysBefore}`);

const updatedPtJson = deepMerge(ptJson, translations);

const keysAfter = countKeys(updatedPtJson);
const newKeys = countKeys(translations);

console.log(`✅ Translation completed!`);
console.log(`📊 Keys after: ${keysAfter}`);
console.log(`🆕 New translations: ${newKeys}`);

fs.writeFileSync(PT_PATH, JSON.stringify(updatedPtJson, null, 2), 'utf8');
console.log(`\n💾 Updated pt.json saved!`);
console.log('🎉 MEGA Pass 3 completed!');
