#!/usr/bin/env node
/**
 * Complete Portuguese (pt-BR) Translations Script
 *
 * This script:
 * 1. Reads en.json and pt.json
 * 2. Finds all keys where pt.json === en.json (untranslated)
 * 3. Generates comprehensive Portuguese translations
 * 4. Uses deepMerge to preserve existing translations
 * 5. Outputs the complete pt.json file
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const PT_PATH = path.join(__dirname, '../src/locales/pt.json');
const OUTPUT_PATH = path.join(__dirname, '../src/locales/pt.json');

// Deep merge utility
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

// Find untranslated keys
function findUntranslated(en, pt, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof en[key] === 'object' && en[key] !== null && !Array.isArray(en[key])) {
      // Recurse into nested objects
      untranslated.push(...findUntranslated(en[key], pt[key] || {}, currentPath));
    } else {
      // Check if translation exists and is different from English
      if (!pt[key] || pt[key] === en[key]) {
        untranslated.push({
          path: currentPath,
          key: key,
          en: en[key],
          pt: pt[key] || en[key],
        });
      }
    }
  }

  return untranslated;
}

// Comprehensive Portuguese translations - PART 1: createEvent section
const createEventTranslations = {
  createEvent: {
    title: 'Criar Evento',
    subtitle: 'Crie um novo evento para o seu clube',
    eventName: 'Nome do Evento',
    eventNamePlaceholder: 'Digite o nome do evento',
    eventDescription: 'Descrição',
    eventDescriptionPlaceholder: 'Digite a descrição do evento',
    eventType: 'Tipo de Evento',
    eventTypePlaceholder: 'Selecione o tipo de evento',
    eventDate: 'Data do Evento',
    eventTime: 'Horário do Evento',
    eventLocation: 'Local do Evento',
    eventLocationPlaceholder: 'Digite o local do evento',
    maxParticipants: 'Participantes Máximos',
    registrationDeadline: 'Prazo de Inscrição',
    registrationFee: 'Taxa de Inscrição',
    registrationFeePlaceholder: 'Digite a taxa de inscrição',
    eventImage: 'Imagem do Evento',
    uploadImage: 'Carregar Imagem',
    removeImage: 'Remover Imagem',
    eventDetails: 'Detalhes do Evento',
    eventSettings: 'Configurações do Evento',
    allowGuests: 'Permitir Convidados',
    allowGuestsDescription: 'Permitir que membros tragam convidados',
    requireApproval: 'Requer Aprovação',
    requireApprovalDescription: 'Exigir aprovação para participação',
    notifyMembers: 'Notificar Membros',
    notifyMembersDescription: 'Enviar notificação aos membros do clube',
    createEventButton: 'Criar Evento',
    cancel: 'Cancelar',
    validation: {
      nameRequired: 'Nome do evento é obrigatório',
      nameTooShort: 'Nome do evento deve ter pelo menos 3 caracteres',
      nameTooLong: 'Nome do evento deve ter no máximo 100 caracteres',
      descriptionRequired: 'Descrição é obrigatória',
      descriptionTooShort: 'Descrição deve ter pelo menos 10 caracteres',
      descriptionTooLong: 'Descrição deve ter no máximo 500 caracteres',
      typeRequired: 'Tipo de evento é obrigatório',
      dateRequired: 'Data do evento é obrigatória',
      dateInPast: 'A data do evento não pode ser no passado',
      timeRequired: 'Horário do evento é obrigatório',
      locationRequired: 'Local do evento é obrigatório',
      locationTooShort: 'Local deve ter pelo menos 5 caracteres',
      maxParticipantsRequired: 'Número máximo de participantes é obrigatório',
      maxParticipantsTooLow: 'Deve permitir pelo menos 2 participantes',
      maxParticipantsTooHigh: 'Número máximo de participantes não pode exceder 1000',
      registrationDeadlineRequired: 'Prazo de inscrição é obrigatório',
      registrationDeadlineAfterEvent: 'Prazo de inscrição deve ser antes da data do evento',
      registrationFeeInvalid: 'Taxa de inscrição deve ser um número válido',
      registrationFeeNegative: 'Taxa de inscrição não pode ser negativa',
      imageUploadFailed: 'Falha ao carregar a imagem',
    },
    types: {
      tournament: 'Torneio',
      social: 'Social',
      training: 'Treinamento',
      clinic: 'Clínica',
      league: 'Liga',
      other: 'Outro',
    },
    success: {
      created: 'Evento criado com sucesso!',
      updated: 'Evento atualizado com sucesso!',
      deleted: 'Evento excluído com sucesso!',
      notificationsSent: 'Notificações enviadas aos membros',
    },
    errors: {
      createFailed: 'Falha ao criar evento. Por favor, tente novamente.',
      updateFailed: 'Falha ao atualizar evento. Por favor, tente novamente.',
      deleteFailed: 'Falha ao excluir evento. Por favor, tente novamente.',
      loadFailed: 'Falha ao carregar detalhes do evento',
      notFound: 'Evento não encontrado',
      noPermission: 'Você não tem permissão para editar este evento',
      imageUploadFailed: 'Falha ao carregar imagem. Por favor, tente novamente.',
    },
  },
};

// PART 2: types section
const typesTranslations = {
  types: {
    match: 'Partida',
    tournament: 'Torneio',
    practice: 'Treino',
    lesson: 'Aula',
    social: 'Social',
    other: 'Outro',
    singles: 'Simples',
    doubles: 'Duplas',
    mixedDoubles: 'Duplas Mistas',
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
    professional: 'Profissional',
    male: 'Masculino',
    female: 'Feminino',
    nonBinary: 'Não-Binário',
    preferNotToSay: 'Prefiro não dizer',
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    active: 'Ativo',
    inactive: 'Inativo',
    public: 'Público',
    private: 'Privado',
    open: 'Aberto',
    closed: 'Fechado',
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado',
    deleted: 'Excluído',
    clay: 'Saibro',
    hard: 'Rápida',
    grass: 'Grama',
    carpet: 'Carpete',
    indoor: 'Coberta',
    outdoor: 'Descoberta',
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
    night: 'Noite',
    weekday: 'Dia de Semana',
    weekend: 'Final de Semana',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
    once: 'Uma vez',
    recurring: 'Recorrente',
    free: 'Grátis',
    paid: 'Pago',
    optional: 'Opcional',
    required: 'Obrigatório',
    enabled: 'Ativado',
    disabled: 'Desativado',
    yes: 'Sim',
    no: 'Não',
    none: 'Nenhum',
    all: 'Todos',
    some: 'Alguns',
    few: 'Poucos',
    many: 'Muitos',
  },
};

// PART 3: emailLogin section
const emailLoginTranslations = {
  emailLogin: {
    title: 'Login com Email',
    subtitle: 'Entre com seu email e senha',
    email: 'Email',
    emailPlaceholder: 'Digite seu email',
    password: 'Senha',
    passwordPlaceholder: 'Digite sua senha',
    confirmPassword: 'Confirmar Senha',
    confirmPasswordPlaceholder: 'Digite sua senha novamente',
    forgotPassword: 'Esqueceu a senha?',
    loginButton: 'Entrar',
    signupButton: 'Criar Conta',
    orContinueWith: 'Ou continue com',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
    backToLogin: 'Voltar ao Login',
    resetPassword: 'Redefinir Senha',
    sendResetLink: 'Enviar Link de Redefinição',
    resetLinkSent: 'Link de redefinição enviado!',
    checkEmail: 'Verifique seu email para redefinir sua senha',
    validation: {
      emailRequired: 'Email é obrigatório',
      emailInvalid: 'Email inválido',
      passwordRequired: 'Senha é obrigatória',
      passwordTooShort: 'Senha deve ter pelo menos 6 caracteres',
      passwordTooLong: 'Senha deve ter no máximo 128 caracteres',
      passwordsDoNotMatch: 'As senhas não coincidem',
      confirmPasswordRequired: 'Confirmação de senha é obrigatória',
      weakPassword: 'Senha muito fraca. Use letras, números e símbolos.',
      emailAlreadyInUse: 'Este email já está em uso',
      userNotFound: 'Usuário não encontrado',
      wrongPassword: 'Senha incorreta',
      tooManyAttempts: 'Muitas tentativas. Tente novamente mais tarde.',
      accountDisabled: 'Esta conta foi desativada',
    },
    errors: {
      loginFailed: 'Falha no login. Por favor, tente novamente.',
      signupFailed: 'Falha ao criar conta. Por favor, tente novamente.',
      resetFailed: 'Falha ao enviar link de redefinição. Por favor, tente novamente.',
      networkError: 'Erro de rede. Verifique sua conexão.',
      unknownError: 'Ocorreu um erro desconhecido. Por favor, tente novamente.',
    },
    success: {
      loginSuccess: 'Login realizado com sucesso!',
      signupSuccess: 'Conta criada com sucesso!',
      resetLinkSent: 'Link de redefinição enviado com sucesso!',
      passwordResetSuccess: 'Senha redefinida com sucesso!',
    },
    passwordRequirements: {
      title: 'A senha deve conter:',
      minLength: 'Pelo menos 6 caracteres',
      uppercase: 'Pelo menos uma letra maiúscula',
      lowercase: 'Pelo menos uma letra minúscula',
      number: 'Pelo menos um número',
      special: 'Pelo menos um caractere especial',
    },
  },
};

// PART 4: createClub section
const createClubTranslations = {
  createClub: {
    title: 'Criar Clube',
    subtitle: 'Crie um novo clube de tênis',
    clubName: 'Nome do Clube',
    clubNamePlaceholder: 'Digite o nome do clube',
    clubDescription: 'Descrição',
    clubDescriptionPlaceholder: 'Digite a descrição do clube',
    clubType: 'Tipo de Clube',
    clubTypePlaceholder: 'Selecione o tipo de clube',
    clubLocation: 'Localização',
    clubLocationPlaceholder: 'Digite a localização do clube',
    clubAddress: 'Endereço',
    clubAddressPlaceholder: 'Digite o endereço do clube',
    clubCity: 'Cidade',
    clubCityPlaceholder: 'Digite a cidade',
    clubState: 'Estado',
    clubStatePlaceholder: 'Digite o estado',
    clubZipCode: 'CEP',
    clubZipCodePlaceholder: 'Digite o CEP',
    clubCountry: 'País',
    clubCountryPlaceholder: 'Digite o país',
    clubWebsite: 'Website',
    clubWebsitePlaceholder: 'Digite o website do clube',
    clubEmail: 'Email',
    clubEmailPlaceholder: 'Digite o email do clube',
    clubPhone: 'Telefone',
    clubPhonePlaceholder: 'Digite o telefone do clube',
    clubImage: 'Imagem do Clube',
    uploadImage: 'Carregar Imagem',
    removeImage: 'Remover Imagem',
    clubSettings: 'Configurações do Clube',
    isPublic: 'Clube Público',
    isPublicDescription: 'Permitir que qualquer pessoa veja o clube',
    requireApproval: 'Requer Aprovação',
    requireApprovalDescription: 'Exigir aprovação para novos membros',
    allowGuests: 'Permitir Convidados',
    allowGuestsDescription: 'Permitir que membros tragam convidados',
    maxMembers: 'Membros Máximos',
    membershipFee: 'Taxa de Associação',
    membershipFeePlaceholder: 'Digite a taxa de associação',
    createClubButton: 'Criar Clube',
    cancel: 'Cancelar',
    validation: {
      nameRequired: 'Nome do clube é obrigatório',
      nameTooShort: 'Nome do clube deve ter pelo menos 3 caracteres',
      nameTooLong: 'Nome do clube deve ter no máximo 100 caracteres',
      descriptionRequired: 'Descrição é obrigatória',
      descriptionTooShort: 'Descrição deve ter pelo menos 10 caracteres',
      locationRequired: 'Localização é obrigatória',
    },
  },
};

// PART 5: club section
const clubTranslations = {
  club: {
    title: 'Clube',
    myClubs: 'Meus Clubes',
    findClubs: 'Encontrar Clubes',
    createClub: 'Criar Clube',
    clubDetails: 'Detalhes do Clube',
    members: 'Membros',
    events: 'Eventos',
    schedule: 'Agenda',
    courts: 'Quadras',
    settings: 'Configurações',
    join: 'Entrar',
    leave: 'Sair',
    invite: 'Convidar',
    manage: 'Gerenciar',
    edit: 'Editar',
    delete: 'Excluir',
    noClubsFound: 'Nenhum clube encontrado',
    noMembersFound: 'Nenhum membro encontrado',
    noEventsFound: 'Nenhum evento encontrado',
    memberCount: '{{count}} membros',
    eventCount: '{{count}} eventos',
    courtCount: '{{count}} quadras',
    joinRequest: 'Solicitar Entrada',
    joinRequestSent: 'Solicitação enviada',
    joinRequestPending: 'Solicitação pendente',
    joinRequestApproved: 'Solicitação aprovada',
    joinRequestRejected: 'Solicitação rejeitada',
    leaveConfirm: 'Tem certeza que deseja sair deste clube?',
    deleteConfirm: 'Tem certeza que deseja excluir este clube?',
    membershipFee: 'Taxa de Associação',
    publicClub: 'Clube Público',
    privateClub: 'Clube Privado',
    requiresApproval: 'Requer Aprovação',
    owner: 'Proprietário',
    admin: 'Administrador',
    member: 'Membro',
    guest: 'Convidado',
    pending: 'Pendente',
    active: 'Ativo',
    inactive: 'Inativo',
    banned: 'Banido',
    roles: {
      owner: 'Proprietário',
      admin: 'Administrador',
      member: 'Membro',
      guest: 'Convidado',
    },
  },
};

console.log('🔍 Reading translation files...');
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
const pt = JSON.parse(fs.readFileSync(PT_PATH, 'utf-8'));

console.log('🔍 Finding untranslated keys...');
const untranslated = findUntranslated(en, pt);
console.log(`📊 Found ${untranslated.length} untranslated keys`);

// Show top sections with most untranslated keys
const sectionCounts = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  sectionCounts[section] = (sectionCounts[section] || 0) + 1;
});

console.log('\n📊 Top sections needing translation:');
Object.entries(sectionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([section, count]) => {
    console.log(`  - ${section}: ${count} keys`);
  });

console.log('\n🔄 Merging translations...');
const merged = deepMerge(pt, {
  ...createEventTranslations,
  ...typesTranslations,
  ...emailLoginTranslations,
  ...createClubTranslations,
  ...clubTranslations,
});

console.log('💾 Writing updated pt.json...');
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), 'utf-8');

console.log('✅ Translation complete!');
console.log(`📝 Updated: ${OUTPUT_PATH}`);

// Show remaining untranslated count
const remainingUntranslated = findUntranslated(en, merged);
console.log(`\n📊 Remaining untranslated: ${remainingUntranslated.length} keys`);

if (remainingUntranslated.length > 0) {
  console.log('\n⚠️  Top remaining sections:');
  const remainingSectionCounts = {};
  remainingUntranslated.forEach(item => {
    const section = item.path.split('.')[0];
    remainingSectionCounts[section] = (remainingSectionCounts[section] || 0) + 1;
  });

  Object.entries(remainingSectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([section, count]) => {
      console.log(`  - ${section}: ${count} keys`);
    });
}
