#!/usr/bin/env node

/**
 * Portuguese (pt-BR) Translation Script - Pass 2
 * Translates ALL remaining untranslated keys
 */

const fs = require('fs');
const path = require('path');

const PT_PATH = path.join(__dirname, '../src/locales/pt.json');
const ptJson = JSON.parse(fs.readFileSync(PT_PATH, 'utf8'));

// Comprehensive translations for ALL remaining sections
const translations = {
  // ============================================================================
  // COMMON SECTION
  // ============================================================================
  common: {
    open: 'Abrir',
    ok: 'OK',
    unknown: 'Desconhecido',
    withdrawnMember: 'Membro Retirado',
  },

  // ============================================================================
  // UNITS SECTION
  // ============================================================================
  units: {
    km: 'km',
    mi: 'mi',
    meters: 'm',
    feet: 'ft',
  },

  // ============================================================================
  // AUTH SECTION
  // ============================================================================
  auth: {
    register: {
      success: {
        ok: 'OK',
      },
    },
  },

  // ============================================================================
  // SERVICES SECTION - Complete
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
    serviceAvailability: 'Disponibilidade',
    serviceBooking: 'Reservar Serviço',
    serviceDetails: 'Detalhes do Serviço',
    serviceProvider: 'Provedor',
    serviceRating: 'Avaliação',
    serviceReviews: 'Avaliações',
    selectService: 'Selecionar Serviço',
    noServices: 'Sem Serviços',
    viewAll: 'Ver Todos',
    popular: 'Popular',
    recommended: 'Recomendado',
    categories: {
      all: 'Todos',
      coaching: 'Treinamento',
      courtRental: 'Aluguel de Quadra',
      equipment: 'Equipamento',
      maintenance: 'Manutenção',
      events: 'Eventos',
      stringing: 'Encordoamento',
      lessons: 'Aulas',
      clinics: 'Clínicas',
      other: 'Outro',
    },
    availability: {
      available: 'Disponível',
      unavailable: 'Indisponível',
      limited: 'Limitado',
      fullBooked: 'Lotado',
    },
    booking: {
      title: 'Reservar Serviço',
      selectDate: 'Selecionar Data',
      selectTime: 'Selecionar Horário',
      selectDuration: 'Selecionar Duração',
      confirmBooking: 'Confirmar Reserva',
      cancelBooking: 'Cancelar Reserva',
      modifyBooking: 'Modificar Reserva',
      bookingConfirmed: 'Reserva Confirmada',
      bookingCancelled: 'Reserva Cancelada',
      bookingModified: 'Reserva Modificada',
      bookingFailed: 'Falha na Reserva',
      noSlotsAvailable: 'Sem Horários Disponíveis',
      viewBooking: 'Ver Reserva',
      myBookings: 'Minhas Reservas',
      upcoming: 'Próximas',
      past: 'Passadas',
      cancelled: 'Canceladas',
      bookingId: 'ID da Reserva',
      bookingDate: 'Data da Reserva',
      bookingTime: 'Horário da Reserva',
      bookingStatus: 'Status da Reserva',
      bookingDetails: 'Detalhes da Reserva',
      paymentRequired: 'Pagamento Necessário',
      payNow: 'Pagar Agora',
      paid: 'Pago',
      pending: 'Pendente',
      confirmed: 'Confirmado',
    },
    filters: {
      all: 'Todos',
      available: 'Disponível',
      price: 'Preço',
      rating: 'Avaliação',
      category: 'Categoria',
    },
    sort: {
      nameAsc: 'Nome (A-Z)',
      nameDesc: 'Nome (Z-A)',
      priceAsc: 'Preço (Menor)',
      priceDesc: 'Preço (Maior)',
      ratingDesc: 'Avaliação (Alta)',
      popular: 'Popularidade',
    },
    details: {
      title: 'Detalhes do Serviço',
      provider: 'Provedor',
      duration: 'Duração',
      price: 'Preço',
      rating: 'Avaliação',
      reviews: 'Avaliações',
      availability: 'Disponibilidade',
      description: 'Descrição',
      included: 'Incluído',
      requirements: 'Requisitos',
      cancellationPolicy: 'Política de Cancelamento',
    },
    errors: {
      loadFailed: 'Falha ao carregar serviços',
      createFailed: 'Falha ao criar serviço',
      updateFailed: 'Falha ao atualizar serviço',
      deleteFailed: 'Falha ao excluir serviço',
      bookingFailed: 'Falha ao reservar serviço',
      notFound: 'Serviço não encontrado',
      unavailable: 'Serviço indisponível',
      paymentFailed: 'Falha no pagamento',
    },
    success: {
      created: 'Serviço criado',
      updated: 'Serviço atualizado',
      deleted: 'Serviço excluído',
      booked: 'Serviço reservado',
    },
  },

  // ============================================================================
  // DUES MANAGEMENT SECTION - Complete
  // ============================================================================
  duesManagement: {
    title: 'Gerenciar Mensalidades',
    subtitle: 'Gerenciar taxas e mensalidades',
    monthlyDues: 'Mensalidades',
    amount: 'Valor',
    dueDate: 'Vencimento',
    status: 'Status',
    paid: 'Pago',
    unpaid: 'Não Pago',
    overdue: 'Vencido',
    partial: 'Parcial',
    exempt: 'Isento',
    paymentHistory: 'Histórico de Pagamentos',
    recordPayment: 'Registrar Pagamento',
    sendReminder: 'Enviar Lembrete',
    sendBulkReminder: 'Enviar Lembretes em Massa',
    paymentDetails: 'Detalhes do Pagamento',
    paymentMethod: 'Método de Pagamento',
    paymentDate: 'Data do Pagamento',
    paymentAmount: 'Valor do Pagamento',
    paymentStatus: 'Status do Pagamento',
    paymentReference: 'Referência',
    paymentNotes: 'Observações',
    memberName: 'Nome do Membro',
    memberEmail: 'Email do Membro',
    totalDue: 'Total Devido',
    totalPaid: 'Total Pago',
    balance: 'Saldo',
    viewHistory: 'Ver Histórico',
    exportData: 'Exportar Dados',
    duesSettings: {
      title: 'Configurações de Mensalidades',
      defaultAmount: 'Valor Padrão',
      billingCycle: 'Ciclo de Cobrança',
      autoReminders: 'Lembretes Automáticos',
      gracePeriod: 'Período de Carência',
      lateFee: 'Taxa de Atraso',
      paymentMethods: 'Métodos de Pagamento',
      dueDay: 'Dia de Vencimento',
      currency: 'Moeda',
      taxRate: 'Taxa de Imposto',
      enableAutoPayment: 'Habilitar Pagamento Automático',
    },
    billingCycle: {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
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
      daysBefore: 'dias antes',
      daysAfter: 'dias após',
      schedule: 'Agendar Lembrete',
      remindersSent: 'Lembretes Enviados',
      recipientCount: 'Destinatários',
    },
    reports: {
      title: 'Relatórios de Mensalidades',
      totalCollected: 'Total Arrecadado',
      totalOutstanding: 'Total Pendente',
      collectionRate: 'Taxa de Arrecadação',
      averagePaymentTime: 'Tempo Médio de Pagamento',
      monthlyReport: 'Relatório Mensal',
      yearlyReport: 'Relatório Anual',
      customReport: 'Relatório Personalizado',
      downloadReport: 'Baixar Relatório',
      emailReport: 'Enviar Relatório por Email',
      overdueAmount: 'Valor Vencido',
      paidOnTime: 'Pagos no Prazo',
      latePayments: 'Pagamentos Atrasados',
    },
    filters: {
      all: 'Todos',
      paid: 'Pagos',
      unpaid: 'Não Pagos',
      overdue: 'Vencidos',
      thisMonth: 'Este Mês',
      lastMonth: 'Mês Passado',
      thisYear: 'Este Ano',
    },
    actions: {
      markPaid: 'Marcar como Pago',
      markUnpaid: 'Marcar como Não Pago',
      waiveFee: 'Isentar Taxa',
      applyLateFee: 'Aplicar Taxa de Atraso',
      viewDetails: 'Ver Detalhes',
      editPayment: 'Editar Pagamento',
      deletePayment: 'Excluir Pagamento',
    },
    errors: {
      loadFailed: 'Falha ao carregar mensalidades',
      recordPaymentFailed: 'Falha ao registrar pagamento',
      sendReminderFailed: 'Falha ao enviar lembrete',
      updateSettingsFailed: 'Falha ao atualizar configurações',
      generateReportFailed: 'Falha ao gerar relatório',
      invalidAmount: 'Valor inválido',
      invalidDate: 'Data inválida',
    },
    success: {
      paymentRecorded: 'Pagamento registrado',
      reminderSent: 'Lembrete enviado',
      settingsUpdated: 'Configurações atualizadas',
      feeWaived: 'Taxa isenta',
      lateFeeApplied: 'Taxa de atraso aplicada',
    },
  },

  // ============================================================================
  // LEAGUE DETAIL SECTION - Complete
  // ============================================================================
  leagueDetail: {
    title: 'Detalhes da Liga',
    overview: 'Visão Geral',
    standings: 'Classificação',
    schedule: 'Calendário',
    participants: 'Participantes',
    rules: 'Regras',
    stats: 'Estatísticas',
    prizes: 'Prêmios',
    leagueInfo: 'Informações da Liga',
    leagueName: 'Nome da Liga',
    leagueType: 'Tipo de Liga',
    startDate: 'Data de Início',
    endDate: 'Data de Término',
    format: 'Formato',
    skillLevel: 'Nível de Habilidade',
    matchType: 'Tipo de Partida',
    registrationDeadline: 'Prazo de Inscrição',
    registrationFee: 'Taxa de Inscrição',
    status: 'Status',
    organizer: 'Organizador',
    currentStandings: 'Classificação Atual',
    rank: 'Posição',
    player: 'Jogador',
    team: 'Equipe',
    wins: 'Vitórias',
    losses: 'Derrotas',
    draws: 'Empates',
    points: 'Pontos',
    matchesPlayed: 'Partidas Jogadas',
    setsWon: 'Sets Vencidos',
    setsLost: 'Sets Perdidos',
    gamesWon: 'Games Vencidos',
    gamesLost: 'Games Perdidos',
    pointDifference: 'Saldo de Pontos',
    upcomingMatches: 'Próximas Partidas',
    completedMatches: 'Partidas Concluídas',
    liveMatches: 'Partidas ao Vivo',
    matchDetails: 'Detalhes da Partida',
    scorecard: 'Placar',
    matchDate: 'Data da Partida',
    matchTime: 'Horário',
    venue: 'Local',
    court: 'Quadra',
    registeredPlayers: 'Jogadores Inscritos',
    registeredTeams: 'Equipes Inscritas',
    waitlist: 'Lista de Espera',
    maxParticipants: 'Máximo de Participantes',
    currentParticipants: 'Participantes Atuais',
    spotsRemaining: 'Vagas Restantes',
    leagueRules: 'Regras da Liga',
    scoringSystem: 'Sistema de Pontuação',
    matchDuration: 'Duração da Partida',
    tiebreakRules: 'Regras de Desempate',
    substitutionRules: 'Regras de Substituição',
    playerStats: 'Estatísticas do Jogador',
    topScorer: 'Maior Pontuador',
    mostWins: 'Mais Vitórias',
    bestRecord: 'Melhor Desempenho',
    recentForm: 'Forma Recente',
    headToHead: 'Confronto Direto',
    leaguePrizes: 'Prêmios da Liga',
    firstPlace: '1º Lugar',
    secondPlace: '2º Lugar',
    thirdPlace: '3º Lugar',
    actions: {
      join: 'Entrar na Liga',
      leave: 'Sair da Liga',
      viewMatch: 'Ver Partida',
      reportScore: 'Reportar Placar',
      editLeague: 'Editar Liga',
      deleteLeague: 'Excluir Liga',
      exportStandings: 'Exportar Classificação',
      printSchedule: 'Imprimir Calendário',
      shareLeague: 'Compartilhar Liga',
      invitePlayers: 'Convidar Jogadores',
    },
    filters: {
      all: 'Todos',
      upcoming: 'Próximos',
      completed: 'Concluídos',
      live: 'Ao Vivo',
    },
    tabs: {
      overview: 'Visão Geral',
      standings: 'Classificação',
      schedule: 'Calendário',
      participants: 'Participantes',
      stats: 'Estatísticas',
      rules: 'Regras',
    },
    errors: {
      loadFailed: 'Falha ao carregar detalhes',
      joinFailed: 'Falha ao entrar na liga',
      leaveFailed: 'Falha ao sair da liga',
      reportScoreFailed: 'Falha ao reportar placar',
      updateFailed: 'Falha ao atualizar liga',
      deleteFailed: 'Falha ao excluir liga',
      notFound: 'Liga não encontrada',
    },
    success: {
      joined: 'Entrada na liga confirmada',
      left: 'Saída da liga confirmada',
      scoreReported: 'Placar reportado',
      updated: 'Liga atualizada',
      deleted: 'Liga excluída',
    },
    confirmations: {
      joinLeague: 'Deseja entrar nesta liga?',
      leaveLeague: 'Deseja sair desta liga?',
      deleteLeague: 'Deseja excluir esta liga? Esta ação não pode ser desfeita.',
      reportScore: 'Confirmar placar da partida?',
    },
  },

  // ============================================================================
  // CLUB TOURNAMENT MANAGEMENT - Complete
  // ============================================================================
  clubTournamentManagement: {
    title: 'Gerenciar Torneios',
    subtitle: 'Criar e gerenciar torneios do clube',
    createTournament: 'Criar Torneio',
    editTournament: 'Editar Torneio',
    deleteTournament: 'Excluir Torneio',
    viewTournament: 'Ver Torneio',
    tournamentName: 'Nome do Torneio',
    tournamentType: 'Tipo de Torneio',
    tournamentFormat: 'Formato',
    startDate: 'Data de Início',
    endDate: 'Data de Término',
    registrationDeadline: 'Prazo de Inscrição',
    maxParticipants: 'Máximo de Participantes',
    entryFee: 'Taxa de Inscrição',
    prizePool: 'Premiação',
    tournamentStatus: 'Status do Torneio',
    bpaddle: 'Chaveamento',
    participants: 'Participantes',
    matches: 'Partidas',
    rounds: 'Rodadas',
    currentRound: 'Rodada Atual',
    winner: 'Vencedor',
    runnerUp: 'Vice-Campeão',
    thirdPlace: '3º Lugar',
    generateBracket: 'Gerar Chaveamento',
    seedPlayers: 'Sortear Jogadores',
    startTournament: 'Iniciar Torneio',
    concludeTournament: 'Concluir Torneio',
    cancelTournament: 'Cancelar Torneio',
    publishResults: 'Publicar Resultados',
    types: {
      singles: 'Simples',
      doubles: 'Duplas',
      mixed: 'Mistas',
      team: 'Equipes',
    },
    formats: {
      singleElimination: 'Eliminação Simples',
      doubleElimination: 'Eliminação Dupla',
      roundRobin: 'Todos contra Todos',
      swiss: 'Sistema Suíço',
      group: 'Fase de Grupos',
    },
    status: {
      draft: 'Rascunho',
      upcoming: 'Próximo',
      registration: 'Inscrições Abertas',
      inProgress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    },
    seeds: {
      title: 'Sorteio de Cabeças de Chave',
      seed: 'Cabeça',
      unseeded: 'Sem Cabeça',
      randomize: 'Sortear Aleatoriamente',
      byRanking: 'Por Classificação',
      manual: 'Manual',
    },
    bpaddle: {
      title: 'Chaveamento',
      round1: 'Primeira Rodada',
      round2: 'Segunda Rodada',
      round3: 'Terceira Rodada',
      quarterfinals: 'Quartas de Final',
      semifinals: 'Semifinais',
      final: 'Final',
      thirdPlace: 'Disputa de 3º Lugar',
      winner: 'Vencedor',
      bye: 'Dispensa (BYE)',
      tbd: 'A Definir',
    },
    registration: {
      title: 'Inscrição no Torneio',
      register: 'Inscrever',
      withdraw: 'Desistir',
      waitlist: 'Lista de Espera',
      registered: 'Inscrito',
      withdrawn: 'Desistente',
      confirmed: 'Confirmado',
      pending: 'Pendente',
    },
    prizes: {
      title: 'Premiação',
      firstPlace: '1º Lugar',
      secondPlace: '2º Lugar',
      thirdPlace: '3º Lugar',
      totalPrize: 'Premiação Total',
      trophy: 'Troféu',
      medal: 'Medalha',
      certificate: 'Certificado',
      cash: 'Dinheiro',
    },
    errors: {
      createFailed: 'Falha ao criar torneio',
      updateFailed: 'Falha ao atualizar torneio',
      deleteFailed: 'Falha ao excluir torneio',
      loadFailed: 'Falha ao carregar torneio',
      generateBracketFailed: 'Falha ao gerar chaveamento',
      seedPlayersFailed: 'Falha ao sortear jogadores',
      notEnoughPlayers: 'Participantes insuficientes',
      invalidFormat: 'Formato inválido',
    },
    success: {
      created: 'Torneio criado',
      updated: 'Torneio atualizado',
      deleted: 'Torneio excluído',
      bpaddleGenerated: 'Chaveamento gerado',
      playersSeeded: 'Jogadores sorteados',
      started: 'Torneio iniciado',
      concluded: 'Torneio concluído',
      cancelled: 'Torneio cancelado',
    },
  },

  // ============================================================================
  // EMAIL LOGIN - Complete
  // ============================================================================
  emailLogin: {
    title: 'Login com Email',
    subtitle: 'Entre com seu email e senha',
    email: 'Email',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    login: 'Entrar',
    register: 'Cadastrar',
    forgotPassword: 'Esqueceu a senha?',
    resetPassword: 'Redefinir Senha',
    sendResetLink: 'Enviar Link de Redefinição',
    backToLogin: 'Voltar ao Login',
    createAccount: 'Criar Conta',
    haveAccount: 'Já tem conta?',
    noAccount: 'Não tem conta?',
    emailPlaceholder: 'seu@email.com',
    passwordPlaceholder: 'Senha',
    passwordRequirements: 'Mínimo 6 caracteres',
    rememberMe: 'Lembrar de mim',
    orContinueWith: 'ou continue com',
    signInWithGoogle: 'Entrar com Google',
    signInWithFacebook: 'Entrar com Facebook',
    signInWithApple: 'Entrar com Apple',
    validation: {
      emailRequired: 'Email é obrigatório',
      emailInvalid: 'Email inválido',
      passwordRequired: 'Senha é obrigatória',
      passwordTooShort: 'Senha muito curta',
      passwordsDontMatch: 'Senhas não coincidem',
      weakPassword: 'Senha muito fraca',
    },
    errors: {
      loginFailed: 'Falha no login',
      registerFailed: 'Falha no cadastro',
      resetFailed: 'Falha na redefinição',
      invalidCredentials: 'Credenciais inválidas',
      emailAlreadyInUse: 'Email já cadastrado',
      userNotFound: 'Usuário não encontrado',
      wrongPassword: 'Senha incorreta',
      tooManyRequests: 'Muitas tentativas',
      networkError: 'Erro de rede',
      unknownError: 'Erro desconhecido',
    },
    success: {
      loginSuccess: 'Login realizado',
      registerSuccess: 'Cadastro realizado',
      resetLinkSent: 'Link enviado para seu email',
      passwordReset: 'Senha redefinida',
    },
  },

  // ============================================================================
  // TYPES SECTION - Complete
  // ============================================================================
  types: {
    matchType: {
      singles: 'Simples',
      doubles: 'Duplas',
      mixed: 'Mistas',
    },
    eventType: {
      social: 'Social',
      competitive: 'Competitivo',
      training: 'Treinamento',
      tournament: 'Torneio',
      clinic: 'Clínica',
      lesson: 'Aula',
      meetup: 'Encontro',
      league: 'Liga',
    },
    skillLevel: {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      expert: 'Especialista',
      professional: 'Profissional',
      all: 'Todos os Níveis',
    },
    courtType: {
      hard: 'Quadra Dura',
      clay: 'Saibro',
      grass: 'Grama',
      carpet: 'Carpete',
      indoor: 'Coberta',
      outdoor: 'Descoberta',
    },
    membershipType: {
      free: 'Gratuito',
      basic: 'Básico',
      premium: 'Premium',
      vip: 'VIP',
      trial: 'Teste',
    },
    notificationType: {
      matchRequest: 'Pedido de Partida',
      matchConfirmed: 'Partida Confirmada',
      matchCancelled: 'Partida Cancelada',
      eventInvite: 'Convite para Evento',
      friendRequest: 'Pedido de Amizade',
      clubInvite: 'Convite para Clube',
      message: 'Mensagem',
      announcement: 'Anúncio',
      reminder: 'Lembrete',
    },
    paymentMethod: {
      cash: 'Dinheiro',
      card: 'Cartão',
      bank: 'Transferência Bancária',
      pix: 'PIX',
      paypal: 'PayPal',
      other: 'Outro',
    },
  },

  // ============================================================================
  // MY ACTIVITIES - Complete
  // ============================================================================
  myActivities: {
    title: 'Minhas Atividades',
    subtitle: 'Histórico de atividades',
    tabs: {
      all: 'Todas',
      matches: 'Partidas',
      events: 'Eventos',
      social: 'Social',
      achievements: 'Conquistas',
    },
    filters: {
      all: 'Todas',
      today: 'Hoje',
      thisWeek: 'Esta Semana',
      thisMonth: 'Este Mês',
      thisYear: 'Este Ano',
    },
    types: {
      matchPlayed: 'Partida Jogada',
      matchWon: 'Partida Vencida',
      matchLost: 'Partida Perdida',
      eventJoined: 'Evento Participado',
      eventCreated: 'Evento Criado',
      clubJoined: 'Clube Ingressado',
      friendAdded: 'Amigo Adicionado',
      achievementUnlocked: 'Conquista Desbloqueada',
      rankUp: 'Subiu de Nível',
      tournamentWon: 'Torneio Vencido',
    },
    emptyState: 'Nenhuma atividade',
    viewAll: 'Ver Todas',
    loadMore: 'Carregar Mais',
    recent: 'Recentes',
    activity: 'Atividade',
    date: 'Data',
    details: 'Detalhes',
  },

  // ============================================================================
  // CLUB SECTION - Additional Keys
  // ============================================================================
  club: {
    open: 'Abrir',
    private: 'Privado',
    memberOnly: 'Somente Membros',
    inviteOnly: 'Somente por Convite',
    verified: 'Verificado',
    official: 'Oficial',
    capacity: 'Capacidade',
    facilities: 'Instalações',
    amenities: 'Comodidades',
    location: 'Localização',
    contact: 'Contato',
    website: 'Site',
    socialMedia: 'Redes Sociais',
    operatingHours: 'Horário de Funcionamento',
    pricing: 'Preços',
    memberBenefits: 'Benefícios',
    featuredClubs: 'Clubes em Destaque',
    nearbyClubs: 'Clubes Próximos',
    recommendedClubs: 'Clubes Recomendados',
    topRated: 'Melhor Avaliados',
    newest: 'Mais Novos',
    searchClubs: 'Buscar Clubes',
    viewOnMap: 'Ver no Mapa',
    getDirections: 'Obter Direções',
    callClub: 'Ligar para o Clube',
    emailClub: 'Email do Clube',
    shareClub: 'Compartilhar Clube',
  },

  // ============================================================================
  // CREATE CLUB - Additional Keys
  // ============================================================================
  createClub: {
    facility: {
      indoor: 'Coberta',
      outdoor: 'Descoberta',
    },
    fields: {
      logo: 'Logo',
      coverPhoto: 'Foto de Capa',
      photos: 'Fotos',
      video: 'Vídeo',
    },
    alerts: {
      saveSuccess: 'Salvo com sucesso',
      createSuccess: 'Clube criado com sucesso',
      updateSuccess: 'Clube atualizado',
    },
  },

  // ============================================================================
  // CLUB LIST - Additional Keys
  // ============================================================================
  clubList: {
    clubType: {
      casual: 'Casual',
      social: 'Social',
      competitive: 'Competitivo',
    },
  },

  // ============================================================================
  // PROFILE - Additional Keys
  // ============================================================================
  profile: {
    settings: {
      notifications: 'Notificações',
      profileSettings: 'Configurações do Perfil',
      appSettings: 'Configurações do App',
    },
    userProfile: {
      rankings: {
        title: 'Classificações',
      },
      matchHistory: {
        win: 'Vitória',
        loss: 'Derrota',
      },
      timeSlots: {
        brunch: 'Brunch',
      },
    },
  },
};

/**
 * Deep merge function
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

// Execute
console.log('🇧🇷 Portuguese Translation Script - Pass 2\n');

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
console.log('🎉 Pass 2 completed!');
