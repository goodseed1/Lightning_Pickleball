const fs = require('fs');
const path = require('path');

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Read existing pt.json
const ptPath = path.join(__dirname, '../src/locales/pt.json');
const existingPt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

// Additional Portuguese translations (Part 2)
const ptTranslations = {
  discover: {
    title: 'Descobrir',
    players: 'Jogadores',
    clubs: 'Clubes',
    events: 'Eventos',
    nearby: 'Próximos',
    trending: 'Em Alta',
    recommended: 'Recomendados',
    all: 'Todos',
    filters: 'Filtros',
    search: 'Buscar...',
    location: 'Localização',
    distance: 'Distância',
    skillLevel: 'Nível',
    availability: 'Disponibilidade',
    noResults: 'Nenhum resultado encontrado',
    searchPlaceholder: 'Buscar jogadores, clubes, eventos...',
    filterBy: 'Filtrar por',
    sortBy: 'Ordenar por',
    distance: {
      nearby: 'Próximo',
      within5: 'Até 5 km',
      within10: 'Até 10 km',
      within25: 'Até 25 km',
      within50: 'Até 50 km',
      any: 'Qualquer distância',
    },
    sort: {
      relevant: 'Mais Relevante',
      distance: 'Distância',
      rating: 'Avaliação',
      recent: 'Mais Recente',
      popular: 'Mais Popular',
    },
  },

  profile: {
    title: 'Perfil',
    edit: 'Editar',
    view: 'Ver Perfil',
    stats: 'Estatísticas',
    matches: 'Partidas',
    achievements: 'Conquistas',
    friends: 'Amigos',
    clubs: 'Clubes',
    about: 'Sobre',
    activity: 'Atividade',
    settings: 'Configurações',
    info: {
      name: 'Nome',
      username: 'Nome de Usuário',
      email: 'E-mail',
      phone: 'Telefone',
      location: 'Localização',
      memberSince: 'Membro desde',
      lastActive: 'Última atividade',
      bio: 'Biografia',
      skillLevel: 'Nível',
      playStyle: 'Estilo',
      dominantHand: 'Mão Dominante',
      backhand: 'Backhand',
      yearsPlaying: 'Anos Jogando',
    },
    stats: {
      matchesPlayed: 'Partidas Jogadas',
      winRate: 'Taxa de Vitória',
      currentStreak: 'Sequência Atual',
      longestStreak: 'Maior Sequência',
      totalWins: 'Total de Vitórias',
      totalLosses: 'Total de Derrotas',
      rating: 'Classificação',
      rank: 'Ranking',
    },
    actions: {
      addFriend: 'Adicionar Amigo',
      message: 'Mensagem',
      challenge: 'Desafiar',
      block: 'Bloquear',
      report: 'Denunciar',
      share: 'Compartilhar',
    },
  },

  eventCard: {
    date: 'Data',
    time: 'Horário',
    location: 'Local',
    participants: 'Participantes',
    organizer: 'Organizador',
    skillLevel: 'Nível',
    format: 'Formato',
    fee: 'Taxa',
    free: 'Grátis',
    spots: 'Vagas',
    spotsLeft: 'vagas restantes',
    full: 'Lotado',
    registered: 'Inscrito',
    register: 'Inscrever-se',
    viewDetails: 'Ver Detalhes',
    share: 'Compartilhar',
    save: 'Salvar',
    saved: 'Salvo',
    starts: 'Começa',
    ends: 'Termina',
    duration: 'Duração',
    status: {
      upcoming: 'Próximo',
      ongoing: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    },
  },

  createMeetup: {
    title: 'Criar Encontro',
    editTitle: 'Editar Encontro',
    basicInfo: 'Informações Básicas',
    details: 'Detalhes',
    participants: 'Participantes',
    form: {
      title: 'Título',
      titlePlaceholder: 'Ex: Jogo de Duplas Sábado de Manhã',
      description: 'Descrição',
      descriptionPlaceholder: 'Descreva o encontro...',
      date: 'Data',
      time: 'Horário',
      duration: 'Duração',
      location: 'Local',
      locationPlaceholder: 'Nome do local ou endereço',
      skillLevel: 'Nível de Habilidade',
      format: 'Formato',
      maxParticipants: 'Máximo de Participantes',
      public: 'Público',
      friendsOnly: 'Apenas Amigos',
      inviteOnly: 'Apenas Convidados',
      allowGuests: 'Permitir Convidados',
      notes: 'Observações',
      notesPlaceholder: 'Informações adicionais...',
    },
    validation: {
      titleRequired: 'Título é obrigatório',
      dateRequired: 'Data é obrigatória',
      timeRequired: 'Horário é obrigatório',
      locationRequired: 'Local é obrigatório',
      maxParticipantsMin: 'Deve ter pelo menos 2 participantes',
    },
    buttons: {
      create: 'Criar Encontro',
      update: 'Atualizar',
      cancel: 'Cancelar',
      invite: 'Convidar Amigos',
    },
    notifications: {
      createSuccess: 'Encontro criado com sucesso',
      createError: 'Erro ao criar encontro',
      updateSuccess: 'Encontro atualizado',
      updateError: 'Erro ao atualizar encontro',
    },
  },

  aiMatching: {
    title: 'Encontrar Parceiro',
    subtitle: 'Encontre o parceiro perfeito com IA',
    preferences: 'Preferências',
    matches: 'Sugestões',
    yourPreferences: 'Suas Preferências',
    filters: {
      skillLevel: 'Nível de Habilidade',
      location: 'Localização',
      distance: 'Distância',
      availability: 'Disponibilidade',
      playStyle: 'Estilo de Jogo',
      gender: 'Gênero',
      age: 'Idade',
      experience: 'Experiência',
    },
    matchScore: 'Compatibilidade',
    compatibility: 'Compatibilidade',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
    reasons: 'Por que esta sugestão?',
    similarSkill: 'Nível de habilidade similar',
    sameLocation: 'Mesma área',
    compatibleStyle: 'Estilos compatíveis',
    matchingAvailability: 'Horários compatíveis',
    viewProfile: 'Ver Perfil',
    sendRequest: 'Enviar Convite',
    noMatches: 'Nenhuma sugestão encontrada',
    adjustFilters: 'Ajuste seus filtros para ver mais sugestões',
    searching: 'Procurando parceiros...',
    requestSent: 'Convite enviado',
    notifications: {
      requestSuccess: 'Convite enviado com sucesso',
      requestError: 'Erro ao enviar convite',
    },
  },

  scheduleMeetup: {
    title: 'Agendar Encontro',
    selectDate: 'Selecionar Data',
    selectTime: 'Selecionar Horário',
    selectLocation: 'Selecionar Local',
    invitePlayers: 'Convidar Jogadores',
    confirm: 'Confirmar',
    date: 'Data',
    time: 'Horário',
    location: 'Local',
    participants: 'Participantes',
    optional: 'Opcional',
    required: 'Obrigatório',
    availableTimes: 'Horários Disponíveis',
    suggestedLocations: 'Locais Sugeridos',
    myLocations: 'Meus Locais',
    recent: 'Recentes',
    favorites: 'Favoritos',
    addLocation: 'Adicionar Local',
    sendInvites: 'Enviar Convites',
    notifications: {
      scheduleSuccess: 'Encontro agendado com sucesso',
      scheduleError: 'Erro ao agendar encontro',
      invitesSent: 'Convites enviados',
      invitesError: 'Erro ao enviar convites',
    },
  },

  clubOverviewScreen: {
    title: 'Visão Geral do Clube',
    about: 'Sobre',
    stats: 'Estatísticas',
    activity: 'Atividade',
    members: 'Membros',
    events: 'Eventos',
    facilities: 'Instalações',
    contact: 'Contato',
    info: {
      established: 'Fundado em',
      members: 'Membros',
      courts: 'Quadras',
      location: 'Localização',
      phone: 'Telefone',
      email: 'E-mail',
      website: 'Site',
    },
    stats: {
      activeMembers: 'Membros Ativos',
      upcomingEvents: 'Próximos Eventos',
      activeTournaments: 'Torneios Ativos',
      monthlyMatches: 'Partidas Mensais',
    },
    recentActivity: 'Atividade Recente',
    upcomingEvents: 'Próximos Eventos',
    viewAll: 'Ver Todos',
    noActivity: 'Nenhuma atividade recente',
    noEvents: 'Nenhum evento próximo',
  },

  badgeGallery: {
    title: 'Galeria de Conquistas',
    myBadges: 'Minhas Conquistas',
    allBadges: 'Todas as Conquistas',
    locked: 'Bloqueado',
    unlocked: 'Desbloqueado',
    inProgress: 'Em Progresso',
    earned: 'Conquistado',
    progress: 'Progresso',
    howToEarn: 'Como Conquistar',
    earnedOn: 'Conquistado em',
    rarity: 'Raridade',
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
    categories: {
      all: 'Todas',
      matches: 'Partidas',
      tournaments: 'Torneios',
      social: 'Social',
      achievements: 'Realizações',
      special: 'Especial',
    },
    filters: {
      all: 'Todas',
      earned: 'Conquistadas',
      locked: 'Bloqueadas',
      inProgress: 'Em Progresso',
    },
    share: 'Compartilhar Conquista',
    noBadges: 'Nenhuma conquista ainda',
    startEarning: 'Comece a jogar para conquistar medalhas!',
  },

  leagues: {
    title: 'Ligas',
    myLeagues: 'Minhas Ligas',
    findLeagues: 'Encontrar Ligas',
    upcoming: 'Próximas',
    active: 'Ativas',
    completed: 'Concluídas',
    join: 'Participar',
    leave: 'Sair',
    viewDetails: 'Ver Detalhes',
    standings: 'Classificação',
    schedule: 'Calendário',
    noLeagues: 'Nenhuma liga encontrada',
    createLeague: 'Criar Liga',
    filters: {
      all: 'Todas',
      singles: 'Simples',
      doubles: 'Duplas',
      mixed: 'Mistas',
    },
  },

  auth: {
    signIn: 'Entrar',
    signUp: 'Cadastrar',
    signOut: 'Sair',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    forgotPassword: 'Esqueceu a senha?',
    resetPassword: 'Redefinir Senha',
    createAccount: 'Criar Conta',
    haveAccount: 'Já tem uma conta?',
    noAccount: 'Não tem uma conta?',
    or: 'ou',
    continueWith: 'Continuar com',
    google: 'Google',
    facebook: 'Facebook',
    apple: 'Apple',
    termsAgree: 'Ao continuar, você concorda com nossos',
    terms: 'Termos de Serviço',
    and: 'e',
    privacy: 'Política de Privacidade',
    emailPlaceholder: 'seu@email.com',
    passwordPlaceholder: 'Sua senha',
    namePlaceholder: 'Seu nome completo',
  },

  meetupDetail: {
    title: 'Detalhes do Encontro',
    info: 'Informações',
    participants: 'Participantes',
    location: 'Local',
    chat: 'Chat',
    date: 'Data',
    time: 'Horário',
    duration: 'Duração',
    organizer: 'Organizador',
    skillLevel: 'Nível',
    format: 'Formato',
    maxParticipants: 'Máximo de Participantes',
    currentParticipants: 'Participantes Atuais',
    going: 'Confirmado',
    maybe: 'Talvez',
    notGoing: 'Não vou',
    join: 'Participar',
    leave: 'Sair',
    cancel: 'Cancelar Encontro',
    edit: 'Editar',
    share: 'Compartilhar',
    directions: 'Como Chegar',
    notifications: {
      joinSuccess: 'Você confirmou presença',
      leaveSuccess: 'Você cancelou sua presença',
      cancelConfirm: 'Tem certeza que deseja cancelar este encontro?',
      cancelSuccess: 'Encontro cancelado',
    },
  },

  scoreConfirmation: {
    title: 'Confirmar Placar',
    match: 'Partida',
    score: 'Placar',
    winner: 'Vencedor',
    loser: 'Perdedor',
    sets: 'Sets',
    games: 'Games',
    tiebreak: 'Tiebreak',
    confirm: 'Confirmar',
    dispute: 'Contestar',
    pending: 'Aguardando Confirmação',
    confirmed: 'Confirmado',
    disputed: 'Contestado',
    enterScore: 'Inserir Placar',
    set: 'Set',
    player1: 'Jogador 1',
    player2: 'Jogador 2',
    addSet: 'Adicionar Set',
    removeSet: 'Remover Set',
    validation: {
      invalidScore: 'Placar inválido',
      incompleteScore: 'Placar incompleto',
      winnerRequired: 'Selecione o vencedor',
    },
    notifications: {
      confirmSuccess: 'Placar confirmado',
      disputeSuccess: 'Placar contestado',
      updateSuccess: 'Placar atualizado',
    },
  },

  clubPoliciesScreen: {
    title: 'Políticas do Clube',
    add: 'Adicionar Política',
    edit: 'Editar',
    delete: 'Excluir',
    noPolicies: 'Nenhuma política definida',
    types: {
      general: 'Geral',
      membership: 'Associação',
      conduct: 'Código de Conduta',
      court: 'Uso de Quadras',
      events: 'Eventos',
      facilities: 'Instalações',
      payment: 'Pagamento',
      privacy: 'Privacidade',
      other: 'Outro',
    },
    form: {
      title: 'Título',
      type: 'Tipo',
      content: 'Conteúdo',
      effectiveDate: 'Data de Vigência',
      mandatory: 'Obrigatório',
      requireAcknowledgment: 'Requer Reconhecimento',
    },
    notifications: {
      createSuccess: 'Política criada',
      updateSuccess: 'Política atualizada',
      deleteConfirm: 'Excluir esta política?',
      deleteSuccess: 'Política excluída',
    },
  },

  schedules: {
    title: 'Calendários',
    today: 'Hoje',
    week: 'Semana',
    month: 'Mês',
    day: 'Dia',
    list: 'Lista',
    noEvents: 'Nenhum evento agendado',
    addEvent: 'Adicionar Evento',
    viewDetails: 'Ver Detalhes',
    filters: {
      all: 'Todos',
      matches: 'Partidas',
      events: 'Eventos',
      practices: 'Treinos',
      tournaments: 'Torneios',
    },
  },

  findClubScreen: {
    title: 'Encontrar Clubes',
    search: 'Buscar clubes...',
    nearby: 'Próximos',
    popular: 'Populares',
    filters: 'Filtros',
    noClubs: 'Nenhum clube encontrado',
    distance: 'Distância',
    members: 'Membros',
    courts: 'Quadras',
    viewDetails: 'Ver Detalhes',
    join: 'Entrar',
    request: 'Solicitar Entrada',
    filters: {
      distance: 'Distância',
      courtType: 'Tipo de Quadra',
      amenities: 'Comodidades',
      membershipType: 'Tipo de Associação',
    },
  },

  matchRequest: {
    title: 'Convite para Partida',
    from: 'De',
    to: 'Para',
    date: 'Data',
    time: 'Horário',
    location: 'Local',
    format: 'Formato',
    skillLevel: 'Nível',
    message: 'Mensagem',
    accept: 'Aceitar',
    decline: 'Recusar',
    reschedule: 'Reagendar',
    pending: 'Pendente',
    accepted: 'Aceito',
    declined: 'Recusado',
    notifications: {
      acceptSuccess: 'Convite aceito',
      declineSuccess: 'Convite recusado',
      sendSuccess: 'Convite enviado',
    },
  },

  cards: {
    viewDetails: 'Ver Detalhes',
    share: 'Compartilhar',
    edit: 'Editar',
    delete: 'Excluir',
    cancel: 'Cancelar',
    register: 'Inscrever-se',
    join: 'Participar',
    leave: 'Sair',
    going: 'Vou',
    maybe: 'Talvez',
    cantGo: 'Não posso',
    viewProfile: 'Ver Perfil',
    message: 'Mensagem',
    challenge: 'Desafiar',
    addFriend: 'Adicionar',
    accept: 'Aceitar',
    decline: 'Recusar',
  },

  clubList: {
    title: 'Clubes',
    myClubs: 'Meus Clubes',
    discover: 'Descobrir',
    search: 'Buscar...',
    create: 'Criar Clube',
    noClubs: 'Nenhum clube',
    member: 'Membro',
    admin: 'Admin',
    pending: 'Pendente',
    members: 'membros',
    events: 'eventos',
    filters: {
      all: 'Todos',
      member: 'Membro',
      nearby: 'Próximos',
      popular: 'Populares',
    },
  },

  policyEditScreen: {
    title: 'Editar Política',
    newTitle: 'Nova Política',
    form: {
      policyTitle: 'Título da Política',
      type: 'Tipo',
      content: 'Conteúdo',
      effectiveDate: 'Data de Vigência',
      mandatory: 'Obrigatório',
      requireAck: 'Requer Reconhecimento',
      active: 'Ativo',
    },
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir Política',
    notifications: {
      saveSuccess: 'Política salva',
      deleteConfirm: 'Excluir esta política?',
      deleteSuccess: 'Política excluída',
    },
  },

  feedCard: {
    like: 'Curtir',
    comment: 'Comentar',
    share: 'Compartilhar',
    likes: 'curtidas',
    comments: 'comentários',
    viewAll: 'Ver todos',
    writeComment: 'Escrever um comentário...',
    post: 'Publicar',
    edit: 'Editar',
    delete: 'Excluir',
    report: 'Denunciar',
    ago: 'atrás',
  },

  recordScore: {
    title: 'Registrar Placar',
    match: 'Partida',
    players: 'Jogadores',
    score: 'Placar',
    winner: 'Vencedor',
    set: 'Set',
    addSet: 'Adicionar Set',
    removeSet: 'Remover Set',
    submit: 'Enviar',
    cancel: 'Cancelar',
    validation: {
      incomplete: 'Placar incompleto',
      invalid: 'Placar inválido',
    },
    notifications: {
      submitSuccess: 'Placar registrado',
      submitError: 'Erro ao registrar placar',
    },
  },

  clubCommunication: {
    title: 'Comunicação',
    announcements: 'Anúncios',
    messages: 'Mensagens',
    notifications: 'Notificações',
    newAnnouncement: 'Novo Anúncio',
    sendMessage: 'Enviar Mensagem',
    noAnnouncements: 'Nenhum anúncio',
    noMessages: 'Nenhuma mensagem',
    compose: 'Compor',
    send: 'Enviar',
    recipients: 'Destinatários',
    subject: 'Assunto',
    message: 'Mensagem',
  },

  eventParticipation: {
    title: 'Participação',
    registered: 'Inscrito',
    waitlist: 'Lista de Espera',
    going: 'Vou',
    maybe: 'Talvez',
    notGoing: 'Não vou',
    checkIn: 'Check-in',
    checkedIn: 'Check-in feito',
    cancel: 'Cancelar Inscrição',
    notifications: {
      registerSuccess: 'Inscrição confirmada',
      cancelSuccess: 'Inscrição cancelada',
      checkInSuccess: 'Check-in realizado',
    },
  },

  contexts: {
    loading: 'Carregando...',
    error: 'Erro',
    retry: 'Tentar novamente',
    noData: 'Sem dados',
    offline: 'Offline',
    connecting: 'Conectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    syncing: 'Sincronizando...',
    synced: 'Sincronizado',
    updating: 'Atualizando...',
    updated: 'Atualizado',
    saving: 'Salvando...',
    saved: 'Salvo',
    deleting: 'Excluindo...',
    deleted: 'Excluído',
  },

  aiChat: {
    title: 'Chat IA',
    placeholder: 'Digite sua mensagem...',
    send: 'Enviar',
    thinking: 'Pensando...',
    suggestions: 'Sugestões',
    newChat: 'Nova Conversa',
    history: 'Histórico',
    clear: 'Limpar',
    noMessages: 'Nenhuma mensagem ainda',
  },

  appNavigator: {
    home: 'Início',
    matches: 'Partidas',
    discover: 'Descobrir',
    clubs: 'Clubes',
    profile: 'Perfil',
    more: 'Mais',
    notifications: 'Notificações',
    messages: 'Mensagens',
    settings: 'Configurações',
    search: 'Buscar',
    calendar: 'Calendário',
    stats: 'Estatísticas',
    friends: 'Amigos',
  },

  developerTools: {
    title: 'Ferramentas do Desenvolvedor',
    clearCache: 'Limpar Cache',
    resetApp: 'Resetar App',
    testNotifications: 'Testar Notificações',
    viewLogs: 'Ver Logs',
    apiStatus: 'Status da API',
    version: 'Versão',
    build: 'Build',
    environment: 'Ambiente',
    debug: 'Debug',
  },

  clubDetailScreen: {
    overview: 'Visão Geral',
    members: 'Membros',
    events: 'Eventos',
    leagues: 'Ligas',
    policies: 'Políticas',
    settings: 'Configurações',
    join: 'Entrar',
    leave: 'Sair',
    manage: 'Gerenciar',
  },

  terms: {
    title: 'Termos de Serviço',
    accept: 'Aceitar',
    decline: 'Recusar',
    lastUpdated: 'Última atualização',
    agreeTo: 'Eu concordo com os',
    readAll: 'Leia todos os termos',
    mustAccept: 'Você deve aceitar os termos para continuar',
    privacy: 'Política de Privacidade',
    termsOfUse: 'Termos de Uso',
    dataPolicy: 'Política de Dados',
    cookiePolicy: 'Política de Cookies',
  },

  league: {
    title: 'Liga',
    join: 'Participar',
    leave: 'Sair',
    standings: 'Classificação',
    schedule: 'Calendário',
    rules: 'Regras',
    participants: 'Participantes',
    matches: 'Partidas',
    stats: 'Estatísticas',
    season: 'Temporada',
    division: 'Divisão',
  },

  mapAppSelector: {
    title: 'Abrir em',
    googleMaps: 'Google Maps',
    appleMaps: 'Apple Maps',
    waze: 'Waze',
    cancel: 'Cancelar',
    directions: 'Como Chegar',
  },

  ntrpSelector: {
    title: 'Selecionar Nível',
    yourLevel: 'Seu Nível',
    beginner: 'Iniciante',
    advanced: 'Avançado',
    select: 'Selecionar',
    cancel: 'Cancelar',
  },

  tournamentDetail: {
    overview: 'Visão Geral',
    bpaddle: 'Chaveamento',
    schedule: 'Calendário',
    participants: 'Participantes',
    rules: 'Regras',
    register: 'Inscrever-se',
  },

  participantSelector: {
    title: 'Selecionar Participantes',
    search: 'Buscar...',
    selected: 'Selecionados',
    done: 'Concluir',
    cancel: 'Cancelar',
  },

  tournament: {
    title: 'Torneio',
    register: 'Inscrever-se',
    withdraw: 'Desistir',
    bpaddle: 'Chaveamento',
    participants: 'Participantes',
  },

  units: {
    km: 'km',
    mi: 'mi',
  },

  clubChat: {
    title: 'Chat do Clube',
    sendMessage: 'Enviar mensagem...',
  },

  clubAdmin: {
    title: 'Administração',
    manage: 'Gerenciar',
  },

  appliedEventCard: {
    applied: 'Inscrito',
    pending: 'Pendente',
  },

  createModal: {
    title: 'Criar',
    cancel: 'Cancelar',
  },

  clubHallOfFame: {
    title: 'Galeria da Fama',
    champions: 'Campeões',
  },

  ntrpResult: {
    yourLevel: 'Seu Nível',
  },

  roles: {
    admin: 'Administrador',
  },

  alert: {
    ok: 'OK',
  },

  hostedEventCard: {
    hosted: 'Organizado',
  },

  feed: {
    title: 'Feed',
  },

  pastEventCard: {
    past: 'Anterior',
  },

  weeklySchedule: {
    title: 'Calendário Semanal',
  },

  concludeLeague: {
    title: 'Concluir Liga',
  },

  myProfile: {
    title: 'Meu Perfil',
  },

  clubLeagueManagement: {
    title: 'Gerenciar Ligas',
  },

  matchDetail: {
    title: 'Detalhes da Partida',
  },

  clubDetail: {
    title: 'Detalhes do Clube',
  },
};

// Merge with existing translations
const mergedPt = deepMerge(existingPt, ptTranslations);

// Write back to file
fs.writeFileSync(ptPath, JSON.stringify(mergedPt, null, 2), 'utf8');

console.log('✅ Portuguese translations Part 2 updated successfully!');
console.log('📊 Sections updated:');
Object.keys(ptTranslations).forEach(section => {
  console.log(`  - ${section}`);
});
