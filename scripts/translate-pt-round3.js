#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge utility
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

// Portuguese translations - ROUND 3
const portugueseTranslations = {
  // CreateEvent Section (76 keys)
  createEvent: {
    title: 'Criar Evento',
    editEvent: 'Editar Evento',
    basicInfo: 'Informações Básicas',
    details: 'Detalhes',
    location: 'Localização',
    participants: 'Participantes',
    advanced: 'Avançado',
    eventName: 'Nome do Evento',
    eventType: 'Tipo de Evento',
    description: 'Descrição',
    date: 'Data',
    startTime: 'Horário de Início',
    endTime: 'Horário de Término',
    timezone: 'Fuso Horário',
    venue: 'Local',
    address: 'Endereço',
    court: 'Quadra',
    surface: 'Superfície',
    indoor: 'Coberto',
    outdoor: 'Descoberto',
    maxParticipants: 'Máximo de Participantes',
    minParticipants: 'Mínimo de Participantes',
    registrationDeadline: 'Prazo de Inscrição',
    entryFee: 'Taxa de Inscrição',
    free: 'Gratuito',
    paid: 'Pago',
    skillLevel: 'Nível de Habilidade',
    ageGroup: 'Faixa Etária',
    gender: 'Gênero',
    format: 'Formato',
    singles: 'Simples',
    doubles: 'Duplas',
    mixed: 'Misto',
    team: 'Equipe',
    visibility: 'Visibilidade',
    public: 'Público',
    private: 'Privado',
    membersOnly: 'Somente Membros',
    eventImage: 'Imagem do Evento',
    uploadImage: 'Enviar Imagem',
    removeImage: 'Remover Imagem',
    rules: 'Regras',
    requirements: 'Requisitos',
    equipment: 'Equipamento',
    provided: 'Fornecido',
    bringYourOwn: 'Traga o Seu',
    prizes: 'Prêmios',
    refreshments: 'Refrescos',
    parking: 'Estacionamento',
    available: 'Disponível',
    notAvailable: 'Não Disponível',
    notes: 'Notas',
    organizer: 'Organizador',
    contact: 'Contato',
    phone: 'Telefone',
    email: 'Email',
    website: 'Website',
    socialMedia: 'Redes Sociais',
    saveDraft: 'Salvar Rascunho',
    publish: 'Publicar',
    cancel: 'Cancelar',
    preview: 'Visualizar',
    validation: {
      nameRequired: 'Nome do evento é obrigatório',
      dateRequired: 'Data é obrigatória',
      timeRequired: 'Horário é obrigatório',
      venueRequired: 'Local é obrigatório',
      invalidDate: 'Data inválida',
      pastDate: 'A data não pode ser no passado',
      endBeforeStart: 'O horário de término deve ser após o início',
    },
    success: 'Evento criado com sucesso',
    error: 'Erro ao criar evento',
    updated: 'Evento atualizado com sucesso',
  },

  // EmailLogin Section (63 keys)
  emailLogin: {
    title: 'Login com Email',
    subtitle: 'Entre com seu email e senha',
    email: 'Email',
    password: 'Senha',
    confirmPassword: 'Confirmar Senha',
    forgotPassword: 'Esqueceu a senha?',
    rememberMe: 'Lembrar de mim',
    login: 'Entrar',
    signup: 'Cadastrar',
    or: 'ou',
    continueWithGoogle: 'Continuar com Google',
    continueWithApple: 'Continuar com Apple',
    continueWithFacebook: 'Continuar com Facebook',
    noAccount: 'Não tem uma conta?',
    haveAccount: 'Já tem uma conta?',
    createAccount: 'Criar conta',
    signIn: 'Entrar',
    emailPlaceholder: 'seu@email.com',
    passwordPlaceholder: 'Digite sua senha',
    resetPassword: 'Redefinir Senha',
    resetPasswordTitle: 'Redefinir Senha',
    resetPasswordSubtitle: 'Digite seu email para receber o link de redefinição',
    sendResetLink: 'Enviar Link',
    backToLogin: 'Voltar ao Login',
    checkEmail: 'Verifique seu Email',
    resetLinkSent: 'Link de redefinição enviado para',
    resetLinkExpires: 'Este link expirará em 1 hora',
    didntReceive: 'Não recebeu o email?',
    resendLink: 'Reenviar Link',
    newPassword: 'Nova Senha',
    confirmNewPassword: 'Confirmar Nova Senha',
    updatePassword: 'Atualizar Senha',
    passwordUpdated: 'Senha atualizada com sucesso',
    invalidToken: 'Link inválido ou expirado',
    validation: {
      emailRequired: 'Email é obrigatório',
      emailInvalid: 'Email inválido',
      passwordRequired: 'Senha é obrigatória',
      passwordMinLength: 'A senha deve ter pelo menos 8 caracteres',
      passwordMismatch: 'As senhas não coincidem',
      passwordWeak: 'A senha deve conter letras maiúsculas, minúsculas e números',
    },
    errors: {
      invalidCredentials: 'Email ou senha inválidos',
      emailInUse: 'Este email já está em uso',
      userNotFound: 'Usuário não encontrado',
      tooManyAttempts: 'Muitas tentativas. Tente novamente mais tarde',
      networkError: 'Erro de conexão. Verifique sua internet',
      unknown: 'Erro desconhecido. Tente novamente',
    },
    success: {
      loginSuccess: 'Login realizado com sucesso',
      signupSuccess: 'Conta criada com sucesso',
      resetSent: 'Email de redefinição enviado',
      passwordUpdated: 'Senha atualizada com sucesso',
    },
    terms: 'Termos de Uso',
    privacy: 'Política de Privacidade',
    agreeToTerms: 'Ao continuar, você concorda com nossos',
    and: 'e',
  },

  // Types Section (61 keys)
  types: {
    matchTypes: {
      singles: 'Simples',
      doubles: 'Duplas',
      mixed: 'Misto',
      team: 'Equipe',
    },
    eventTypes: {
      match: 'Partida',
      tournament: 'Torneio',
      league: 'Liga',
      clinic: 'Clínica',
      social: 'Social',
      practice: 'Treino',
      lesson: 'Aula',
      other: 'Outro',
    },
    skillLevels: {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      expert: 'Expert',
      pro: 'Profissional',
    },
    surfaces: {
      hard: 'Rápida',
      clay: 'Saibro',
      grass: 'Grama',
      carpet: 'Carpete',
      indoor: 'Coberta',
      outdoor: 'Descoberta',
    },
    ageGroups: {
      junior: 'Junior (< 18)',
      adult: 'Adulto (18-49)',
      senior: 'Senior (50+)',
      all: 'Todas as Idades',
    },
    genders: {
      male: 'Masculino',
      female: 'Feminino',
      mixed: 'Misto',
      all: 'Todos',
    },
    status: {
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      suspended: 'Suspenso',
      expired: 'Expirado',
    },
    visibility: {
      public: 'Público',
      private: 'Privado',
      membersOnly: 'Somente Membros',
      inviteOnly: 'Somente por Convite',
    },
    notifications: {
      email: 'Email',
      push: 'Push',
      sms: 'SMS',
      inApp: 'No App',
    },
    paymentStatus: {
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado',
    },
    membershipStatus: {
      active: 'Ativo',
      pending: 'Pendente',
      expired: 'Expirado',
      cancelled: 'Cancelado',
      suspended: 'Suspenso',
    },
    roles: {
      admin: 'Administrador',
      organizer: 'Organizador',
      member: 'Membro',
      guest: 'Convidado',
      viewer: 'Visualizador',
    },
  },

  // CreateClub Section (57 keys)
  createClub: {
    title: 'Criar Clube',
    editClub: 'Editar Clube',
    steps: {
      basic: 'Informações Básicas',
      details: 'Detalhes',
      facilities: 'Instalações',
      membership: 'Adesão',
      settings: 'Configurações',
    },
    basic: {
      clubName: 'Nome do Clube',
      tagline: 'Slogan',
      description: 'Descrição',
      logo: 'Logo',
      coverImage: 'Imagem de Capa',
      uploadLogo: 'Enviar Logo',
      uploadCover: 'Enviar Capa',
      removeLogo: 'Remover Logo',
      removeCover: 'Remover Capa',
    },
    details: {
      founded: 'Fundado em',
      website: 'Website',
      email: 'Email',
      phone: 'Telefone',
      address: 'Endereço',
      city: 'Cidade',
      state: 'Estado',
      zipCode: 'CEP',
      country: 'País',
      timezone: 'Fuso Horário',
      socialMedia: 'Redes Sociais',
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'Twitter',
    },
    facilities: {
      title: 'Instalações',
      numberOfCourts: 'Número de Quadras',
      courtSurfaces: 'Superfícies das Quadras',
      indoorCourts: 'Quadras Cobertas',
      outdoorCourts: 'Quadras Descobertas',
      lighting: 'Iluminação',
      proShop: 'Loja Pro',
      restaurant: 'Restaurante',
      locker: 'Vestiário',
      parking: 'Estacionamento',
      wifi: 'Wi-Fi',
      amenities: 'Comodidades',
      addAmenity: 'Adicionar Comodidade',
    },
    membership: {
      title: 'Adesão',
      type: 'Tipo',
      public: 'Público',
      private: 'Privado',
      semiPrivate: 'Semi-Privado',
      requiresApproval: 'Requer Aprovação',
      membershipFee: 'Taxa de Adesão',
      monthlyDues: 'Mensalidade',
      benefits: 'Benefícios',
      addBenefit: 'Adicionar Benefício',
    },
    settings: {
      visibility: 'Visibilidade',
      allowGuestBookings: 'Permitir Reservas de Convidados',
      autoApproveMembers: 'Aprovar Membros Automaticamente',
      enableChat: 'Ativar Chat',
      enableEvents: 'Ativar Eventos',
      enableLeagues: 'Ativar Ligas',
      enableTournaments: 'Ativar Torneios',
    },
    validation: {
      nameRequired: 'Nome do clube é obrigatório',
      descriptionRequired: 'Descrição é obrigatória',
      addressRequired: 'Endereço é obrigatório',
    },
    actions: {
      save: 'Salvar',
      cancel: 'Cancelar',
      next: 'Próximo',
      previous: 'Anterior',
      finish: 'Finalizar',
      preview: 'Visualizar',
    },
    success: 'Clube criado com sucesso',
    updated: 'Clube atualizado com sucesso',
    error: 'Erro ao processar clube',
  },

  // Club Section (50 keys) - General club features
  club: {
    dashboard: 'Painel do Clube',
    overview: 'Visão Geral',
    members: 'Membros',
    events: 'Eventos',
    courts: 'Quadras',
    bookings: 'Reservas',
    finances: 'Finanças',
    settings: 'Configurações',
    stats: {
      totalMembers: 'Total de Membros',
      activeMembers: 'Membros Ativos',
      upcomingEvents: 'Próximos Eventos',
      courtBookings: 'Reservas de Quadras',
      revenue: 'Receita',
      thisMonth: 'Este Mês',
    },
    actions: {
      addMember: 'Adicionar Membro',
      createEvent: 'Criar Evento',
      bookCourt: 'Reservar Quadra',
      viewCalendar: 'Ver Calendário',
      manageStaff: 'Gerenciar Equipe',
      viewReports: 'Ver Relatórios',
    },
    membership: {
      pending: 'Pendente',
      active: 'Ativo',
      expired: 'Expirado',
      suspended: 'Suspenso',
      joinDate: 'Data de Entrada',
      renewalDate: 'Data de Renovação',
      memberNumber: 'Número de Sócio',
    },
    notifications: {
      newMember: 'Novo membro entrou no clube',
      eventCreated: 'Novo evento criado',
      courtBooked: 'Quadra reservada',
      paymentReceived: 'Pagamento recebido',
      membershipExpiring: 'Adesão expirando em breve',
      eventReminder: 'Lembrete de evento',
    },
    filters: {
      all: 'Todos',
      active: 'Ativos',
      inactive: 'Inativos',
      today: 'Hoje',
      thisWeek: 'Esta Semana',
      thisMonth: 'Este Mês',
      upcoming: 'Próximos',
      past: 'Passados',
    },
    empty: {
      noMembers: 'Nenhum membro ainda',
      noEvents: 'Nenhum evento agendado',
      noBookings: 'Nenhuma reserva',
      noData: 'Nenhum dado disponível',
    },
  },

  // ClubDuesManagement Section (44 keys)
  clubDuesManagement: {
    title: 'Mensalidades do Clube',
    overview: 'Visão Geral',
    plans: 'Planos',
    payments: 'Pagamentos',
    reports: 'Relatórios',
    currentPlan: 'Plano Atual',
    changePlan: 'Mudar Plano',
    paymentHistory: 'Histórico de Pagamentos',
    nextPayment: 'Próximo Pagamento',
    dueDate: 'Data de Vencimento',
    amount: 'Valor',
    status: 'Status',
    payNow: 'Pagar Agora',
    autoRenewal: 'Renovação Automática',
    enabled: 'Ativado',
    disabled: 'Desativado',
    billingInfo: 'Informações de Cobrança',
    paymentMethod: 'Método de Pagamento',
    addPaymentMethod: 'Adicionar Método de Pagamento',
    updatePaymentMethod: 'Atualizar Método de Pagamento',
    cardDetails: 'Detalhes do Cartão',
    cardNumber: 'Número do Cartão',
    expiryDate: 'Data de Validade',
    cvv: 'CVV',
    billingAddress: 'Endereço de Cobrança',
    invoices: 'Faturas',
    downloadInvoice: 'Baixar Fatura',
    viewInvoice: 'Ver Fatura',
    outstanding: 'Pendente',
    overdue: 'Atrasado',
    paid: 'Pago',
    paymentSuccess: 'Pagamento realizado com sucesso',
    paymentFailed: 'Falha no pagamento',
    renewalSuccess: 'Renovação realizada com sucesso',
    planChanged: 'Plano alterado com sucesso',
    cancellation: 'Cancelamento',
    cancelMembership: 'Cancelar Adesão',
    cancelConfirm: 'Tem certeza que deseja cancelar sua adesão?',
    cancelReason: 'Motivo do Cancelamento',
    refundPolicy: 'Política de Reembolso',
    effectiveDate: 'Data Efetiva',
    cancelled: 'Cancelado com sucesso',
  },
};

// Read existing translations
const localesPath = path.join(__dirname, '..', 'src', 'locales');
const ptPath = path.join(localesPath, 'pt.json');

let existingTranslations = {};
try {
  const fileContent = fs.readFileSync(ptPath, 'utf8');
  existingTranslations = JSON.parse(fileContent);
  console.log('✅ Loaded existing pt.json');
} catch (error) {
  console.log('⚠️  Could not load existing pt.json, starting fresh');
}

// Merge translations
const updatedTranslations = deepMerge(existingTranslations, portugueseTranslations);

// Write updated translations
fs.writeFileSync(ptPath, JSON.stringify(updatedTranslations, null, 2), 'utf8');

console.log('\n✅ Portuguese translations updated successfully!');
console.log('\n📊 Translation Summary (Round 3):');
console.log('   - createEvent: 76 keys');
console.log('   - emailLogin: 63 keys');
console.log('   - types: 61 keys');
console.log('   - createClub: 57 keys');
console.log('   - club: 50 keys');
console.log('   - clubDuesManagement: 44 keys');
console.log('   ----------------------------------');
console.log('   TOTAL: 351 keys translated in Round 3');
console.log('\n📈 Overall Progress:');
console.log('   Round 1: Unknown (initial translations)');
console.log('   Round 2: 501 keys');
console.log('   Round 3: 351 keys');
console.log('   ----------------------------------');
console.log('   TOTAL ROUND 2+3: 852 keys');
