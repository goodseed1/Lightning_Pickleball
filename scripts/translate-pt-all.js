#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load JSON files
const enPath = path.join(__dirname, '../src/locales/en.json');
const ptPath = path.join(__dirname, '../src/locales/pt.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

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

// Find keys where pt === en
function findUntranslatedKeys(enObj, ptObj, path = '') {
  const untranslated = {};

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const ptValue = ptObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      const nested = findUntranslatedKeys(enValue, ptValue || {}, currentPath);
      if (Object.keys(nested).length > 0) {
        untranslated[key] = nested;
      }
    } else if (ptValue === enValue || ptValue === undefined) {
      // This key needs translation
      untranslated[key] = enValue;
    }
  }

  return untranslated;
}

// Manual translations for Brazilian Portuguese
const manualTranslations = {
  createEvent: {
    title: 'Criar Evento',
    eventName: 'Nome do Evento',
    eventNamePlaceholder: 'Digite o nome do evento',
    eventType: 'Tipo de Evento',
    description: 'Descrição',
    descriptionPlaceholder: 'Descreva o evento',
    location: 'Localização',
    locationPlaceholder: 'Digite a localização',
    dateTime: 'Data e Hora',
    selectDate: 'Selecionar Data',
    selectTime: 'Selecionar Hora',
    maxParticipants: 'Máximo de Participantes',
    maxParticipantsPlaceholder: 'Digite o número máximo',
    skillLevel: 'Nível de Habilidade',
    skillLevelPlaceholder: 'Selecione o nível',
    requireApproval: 'Requer Aprovação',
    createButton: 'Criar Evento',
    cancelButton: 'Cancelar',
    errors: {
      nameRequired: 'Nome do evento é obrigatório',
      typeRequired: 'Tipo de evento é obrigatório',
      locationRequired: 'Localização é obrigatória',
      dateRequired: 'Data é obrigatória',
      timeRequired: 'Hora é obrigatória',
      maxParticipantsInvalid: 'Número máximo de participantes deve ser maior que 0',
      createFailed: 'Falha ao criar evento',
    },
    types: {
      singles: 'Simples',
      doubles: 'Duplas',
      mixed: 'Misto',
      tournament: 'Torneio',
      clinic: 'Clínica',
      social: 'Social',
      practice: 'Treino',
    },
    success: 'Evento criado com sucesso!',
    creating: 'Criando evento...',
    privacy: 'Privacidade',
    public: 'Público',
    private: 'Privado',
    membersOnly: 'Apenas Membros',
    fees: 'Taxas',
    feesPlaceholder: 'Digite as taxas (opcional)',
    equipment: 'Equipamento Necessário',
    equipmentPlaceholder: 'Liste o equipamento necessário',
    rules: 'Regras',
    rulesPlaceholder: 'Digite as regras do evento',
    recurring: 'Evento Recorrente',
    frequency: 'Frequência',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    endDate: 'Data Final',
    selectEndDate: 'Selecionar Data Final',
    noEndDate: 'Sem Data Final',
    waitlist: 'Lista de Espera',
    enableWaitlist: 'Habilitar Lista de Espera',
    waitlistSize: 'Tamanho da Lista de Espera',
    waitlistSizePlaceholder: 'Digite o tamanho máximo da lista de espera',
    notifications: 'Notificações',
    enableNotifications: 'Habilitar Notificações',
    reminderTime: 'Horário do Lembrete',
    reminderTimePlaceholder: 'Digite os minutos antes do evento',
    attachments: 'Anexos',
    addAttachment: 'Adicionar Anexo',
    removeAttachment: 'Remover Anexo',
  },
  types: {
    user: 'Usuário',
    player: 'Jogador',
    coach: 'Treinador',
    admin: 'Administrador',
    moderator: 'Moderador',
    guest: 'Convidado',
    member: 'Membro',
    organizer: 'Organizador',
    participant: 'Participante',
    spectator: 'Espectador',
    volunteer: 'Voluntário',
    sponsor: 'Patrocinador',
    partner: 'Parceiro',
    vendor: 'Fornecedor',
    staff: 'Equipe',
    judge: 'Juiz',
    referee: 'Árbitro',
    umpire: 'Juiz de Cadeira',
    lineJudge: 'Juiz de Linha',
    ballPerson: 'Gandula',
    scorekeeper: 'Placar',
    photographer: 'Fotógrafo',
    videographer: 'Cinegrafista',
    journalist: 'Jornalista',
    broadcaster: 'Transmissor',
    commentator: 'Comentarista',
    analyst: 'Analista',
    statistician: 'Estatístico',
    medical: 'Médico',
    physiotherapist: 'Fisioterapeuta',
    trainer: 'Treinador Físico',
    nutritionist: 'Nutricionista',
    psychologist: 'Psicólogo',
    equipment: 'Equipamento',
    maintenance: 'Manutenção',
    security: 'Segurança',
    catering: 'Catering',
    transportation: 'Transporte',
    accommodation: 'Acomodação',
    ticketing: 'Bilheteria',
    registration: 'Registro',
    communication: 'Comunicação',
    marketing: 'Marketing',
    sales: 'Vendas',
    finance: 'Finanças',
    legal: 'Jurídico',
    hr: 'RH',
    it: 'TI',
    operations: 'Operações',
    logistics: 'Logística',
    procurement: 'Compras',
    quality: 'Qualidade',
    compliance: 'Conformidade',
    audit: 'Auditoria',
    risk: 'Risco',
    strategy: 'Estratégia',
    development: 'Desenvolvimento',
  },
  emailLogin: {
    title: 'Login com E-mail',
    email: 'E-mail',
    emailPlaceholder: 'Digite seu e-mail',
    password: 'Senha',
    passwordPlaceholder: 'Digite sua senha',
    loginButton: 'Entrar',
    forgotPassword: 'Esqueceu a senha?',
    noAccount: 'Não tem uma conta?',
    signUp: 'Cadastre-se',
    errors: {
      emailRequired: 'E-mail é obrigatório',
      emailInvalid: 'E-mail inválido',
      passwordRequired: 'Senha é obrigatória',
      passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
      loginFailed: 'Falha no login. Verifique suas credenciais.',
      userNotFound: 'Usuário não encontrado',
      wrongPassword: 'Senha incorreta',
      tooManyRequests: 'Muitas tentativas. Tente novamente mais tarde.',
      networkError: 'Erro de rede. Verifique sua conexão.',
      unknownError: 'Ocorreu um erro desconhecido',
    },
    success: 'Login realizado com sucesso!',
    loggingIn: 'Entrando...',
    rememberMe: 'Lembrar de mim',
    or: 'OU',
    continueWithGoogle: 'Continuar com Google',
    continueWithFacebook: 'Continuar com Facebook',
    continueWithApple: 'Continuar com Apple',
    termsAndConditions: 'Ao continuar, você concorda com nossos Termos e Condições',
    privacyPolicy: 'Política de Privacidade',
    resetPassword: 'Redefinir Senha',
    resetPasswordInstructions: 'Digite seu e-mail para receber instruções de redefinição de senha',
    sendResetLink: 'Enviar Link de Redefinição',
    resetLinkSent: 'Link de redefinição enviado! Verifique seu e-mail.',
    backToLogin: 'Voltar ao Login',
    newUser: 'Novo usuário?',
    createAccount: 'Criar Conta',
    welcomeBack: 'Bem-vindo de volta!',
    signInToContinue: 'Entre para continuar',
    emailVerification: 'Verificação de E-mail',
    verifyEmailMessage:
      'Enviamos um e-mail de verificação. Por favor, verifique sua caixa de entrada.',
    resendVerification: 'Reenviar E-mail de Verificação',
    emailVerified: 'E-mail verificado com sucesso!',
    emailNotVerified: 'E-mail não verificado',
    pleaseVerifyEmail: 'Por favor, verifique seu e-mail antes de continuar',
    checkYourEmail: 'Verifique seu e-mail',
    didntReceiveEmail: 'Não recebeu o e-mail?',
    checkSpamFolder: 'Verifique sua pasta de spam',
    contactSupport: 'Contatar Suporte',
    needHelp: 'Precisa de ajuda?',
    faq: 'Perguntas Frequentes',
    support: 'Suporte',
    reportIssue: 'Reportar Problema',
    feedback: 'Feedback',
    rateUs: 'Avalie-nos',
    shareApp: 'Compartilhar App',
    inviteFriends: 'Convidar Amigos',
    referralCode: 'Código de Indicação',
    enterReferralCode: 'Digite o código de indicação',
    applyCode: 'Aplicar Código',
    invalidCode: 'Código inválido',
    codeApplied: 'Código aplicado com sucesso!',
  },
  createClub: {
    title: 'Criar Clube',
    clubName: 'Nome do Clube',
    clubNamePlaceholder: 'Digite o nome do clube',
    description: 'Descrição',
    descriptionPlaceholder: 'Descreva o clube',
    location: 'Localização',
    locationPlaceholder: 'Digite a localização',
    type: 'Tipo de Clube',
    typePlaceholder: 'Selecione o tipo',
    visibility: 'Visibilidade',
    public: 'Público',
    private: 'Privado',
    createButton: 'Criar Clube',
    cancelButton: 'Cancelar',
    errors: {
      nameRequired: 'Nome do clube é obrigatório',
      typeRequired: 'Tipo de clube é obrigatório',
      locationRequired: 'Localização é obrigatória',
      createFailed: 'Falha ao criar clube',
    },
    success: 'Clube criado com sucesso!',
    creating: 'Criando clube...',
    membershipType: 'Tipo de Associação',
    free: 'Gratuito',
    paid: 'Pago',
    membershipFee: 'Taxa de Associação',
    membershipFeePlaceholder: 'Digite a taxa',
    maxMembers: 'Máximo de Membros',
    maxMembersPlaceholder: 'Digite o número máximo',
    facilities: 'Instalações',
    facilitiesPlaceholder: 'Liste as instalações disponíveis',
    amenities: 'Comodidades',
    amenitiesPlaceholder: 'Liste as comodidades',
    rules: 'Regras do Clube',
    rulesPlaceholder: 'Digite as regras do clube',
    requirements: 'Requisitos',
    requirementsPlaceholder: 'Digite os requisitos para adesão',
    contactInfo: 'Informações de Contato',
    phone: 'Telefone',
    phonePlaceholder: 'Digite o número de telefone',
    email: 'E-mail',
    emailPlaceholder: 'Digite o e-mail',
    website: 'Website',
    websitePlaceholder: 'Digite o URL do website',
    socialMedia: 'Redes Sociais',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',
    logo: 'Logo',
    uploadLogo: 'Carregar Logo',
    cover: 'Imagem de Capa',
    uploadCover: 'Carregar Imagem de Capa',
    schedule: 'Horário de Funcionamento',
    addSchedule: 'Adicionar Horário',
    removeSchedule: 'Remover Horário',
    dayOfWeek: 'Dia da Semana',
    openTime: 'Horário de Abertura',
    closeTime: 'Horário de Fechamento',
    closed: 'Fechado',
  },
  club: {
    title: 'Clube',
    members: 'Membros',
    events: 'Eventos',
    about: 'Sobre',
    join: 'Entrar',
    leave: 'Sair',
    edit: 'Editar',
    delete: 'Excluir',
    share: 'Compartilhar',
    report: 'Reportar',
    settings: 'Configurações',
    memberCount: '{{count}} membros',
    eventCount: '{{count}} eventos',
    created: 'Criado em {{date}}',
    description: 'Descrição',
    location: 'Localização',
    type: 'Tipo',
    visibility: 'Visibilidade',
    public: 'Público',
    private: 'Privado',
    membershipType: 'Tipo de Associação',
    free: 'Gratuito',
    paid: 'Pago',
    membershipFee: 'Taxa de Associação',
    maxMembers: 'Máximo de Membros',
    facilities: 'Instalações',
    amenities: 'Comodidades',
    rules: 'Regras',
    requirements: 'Requisitos',
    contactInfo: 'Informações de Contato',
    phone: 'Telefone',
    email: 'E-mail',
    website: 'Website',
    socialMedia: 'Redes Sociais',
    schedule: 'Horário de Funcionamento',
    photos: 'Fotos',
    reviews: 'Avaliações',
    rating: 'Avaliação',
    noMembers: 'Nenhum membro ainda',
    noEvents: 'Nenhum evento ainda',
    noPhotos: 'Nenhuma foto ainda',
    noReviews: 'Nenhuma avaliação ainda',
    loadingMembers: 'Carregando membros...',
    loadingEvents: 'Carregando eventos...',
    loadingPhotos: 'Carregando fotos...',
    loadingReviews: 'Carregando avaliações...',
    joinSuccess: 'Você entrou no clube!',
    leaveSuccess: 'Você saiu do clube',
    deleteConfirm: 'Tem certeza de que deseja excluir este clube?',
    deleteSuccess: 'Clube excluído com sucesso',
    reportSuccess: 'Clube reportado com sucesso',
    shareMessage: 'Confira este clube: {{name}}',
  },
};

// Count untranslated keys
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

const untranslated = findUntranslatedKeys(en, pt);
const totalUntranslated = countKeys(untranslated);

console.log(`Found ${totalUntranslated} untranslated keys`);
console.log('\nTop-level sections with most untranslated keys:');

const sectionCounts = {};
for (const key in untranslated) {
  sectionCounts[key] = countKeys(untranslated[key]);
}

const sortedSections = Object.entries(sectionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedSections.forEach(([key, count]) => {
  console.log(`  ${key}: ${count} keys`);
});

// Apply manual translations
const updatedPt = deepMerge(pt, manualTranslations);

// Write updated pt.json
fs.writeFileSync(ptPath, JSON.stringify(updatedPt, null, 2) + '\n', 'utf8');

console.log(`\n✅ Applied manual translations to pt.json`);
console.log(`Remaining untranslated keys: ${totalUntranslated - countKeys(manualTranslations)}`);
