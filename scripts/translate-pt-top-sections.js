#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PT_FILE = path.join(__dirname, '../src/locales/pt.json');
const EN_FILE = path.join(__dirname, '../src/locales/en.json');

// Read files
const ptData = JSON.parse(fs.readFileSync(PT_FILE, 'utf8'));
const enData = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));

// Helper function to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);
  target[lastKey] = value;
}

// === COMMON TRANSLATIONS ===
if (ptData.common && ptData.common.ok === 'OK') {
  ptData.common.ok = 'OK'; // Keep OK as is
}

// === AUTH TRANSLATIONS ===
const authTranslations = {
  'register.title': 'Criar Conta',
  'register.subtitle': 'Junte-se à nossa comunidade de tênis',
  'register.displayName': 'Nome Completo',
  'register.signingUp': 'Criando conta...',
  'register.passwordHint': 'Mínimo 8 caracteres, incluindo letra maiúscula, minúscula e número',
  'register.agreeTerms': 'Concordo com os Termos de Serviço',
  'register.agreePrivacy': 'Concordo com a Política de Privacidade',
  'register.termsComingSoon': 'Termos de Serviço em Breve',
  'register.termsComingSoonMessage': 'Os Termos de Serviço completos estarão disponíveis em breve.',
  'register.privacyComingSoon': 'Política de Privacidade em Breve',
  'register.privacyComingSoonMessage':
    'A Política de Privacidade completa estará disponível em breve.',
  'register.errors.title': 'Erro de Cadastro',
  'register.errors.nameRequired': 'Nome é obrigatório',
  'register.errors.nameMinLength': 'Nome deve ter pelo menos 2 caracteres',
  'register.errors.emailRequired': 'E-mail é obrigatório',
  'register.errors.emailInvalid': 'Por favor, insira um e-mail válido',
  'register.errors.passwordRequired': 'Senha é obrigatória',
  'register.errors.passwordMinLength': 'Senha deve ter pelo menos 8 caracteres',
  'register.errors.passwordComplexity': 'Senha deve incluir letra maiúscula, minúscula e número',
  'register.errors.passwordMismatch': 'Senhas não coincidem',
  'register.errors.termsRequired': 'Você deve concordar com os Termos de Serviço',
  'register.errors.privacyRequired': 'Você deve concordar com a Política de Privacidade',
  'register.errors.signupFailed': 'Falha no Cadastro',
  'register.errors.signupFailedMessage':
    'Não foi possível criar sua conta. Por favor, tente novamente.',
  'register.errors.emailInUse': 'Este e-mail já está em uso',
  'register.errors.invalidEmailFormat': 'Formato de e-mail inválido',
  'register.errors.operationNotAllowed': 'Operação não permitida',
  'register.errors.weakPassword': 'Senha muito fraca',
  'register.errors.unknown': 'Ocorreu um erro desconhecido',
};

// === CREATEEVENT TRANSLATIONS ===
const createEventTranslations = {
  title: 'Criar Evento',
  personalEvent: 'Evento Pessoal',
  clubEvent: 'Evento do Clube',
  selectType: 'Selecionar Tipo',
  personalEventDescription: 'Crie um evento privado para você e seus amigos',
  clubEventDescription: 'Organize um evento para todos os membros do clube',
  eventName: 'Nome do Evento',
  eventNamePlaceholder: 'Digite o nome do evento',
  description: 'Descrição',
  descriptionPlaceholder: 'Descreva seu evento...',
  date: 'Data',
  selectDate: 'Selecionar Data',
  time: 'Hora',
  selectTime: 'Selecionar Hora',
  location: 'Localização',
  selectLocation: 'Selecionar Localização',
  searchLocation: 'Buscar localização...',
  maxParticipants: 'Máximo de Participantes',
  maxParticipantsPlaceholder: '4',
  skillLevel: 'Nível de Habilidade',
  anyLevel: 'Qualquer Nível',
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  eventType: 'Tipo de Evento',
  singles: 'Simples',
  doubles: 'Duplas',
  mixed: 'Misto',
  practice: 'Treino',
  tournament: 'Torneio',
  social: 'Social',
  visibility: 'Visibilidade',
  public: 'Público',
  private: 'Privado',
  clubOnly: 'Apenas Clube',
  inviteOnly: 'Apenas Convidados',
  publicDescription: 'Qualquer pessoa pode ver e participar',
  privateDescription: 'Apenas convidados podem ver e participar',
  clubOnlyDescription: 'Apenas membros do clube podem ver e participar',
  inviteOnlyDescription: 'Apenas jogadores convidados podem participar',
  requirements: 'Requisitos',
  requireApproval: 'Requer Aprovação',
  requireApprovalDescription: 'Você deve aprovar os participantes antes de participarem',
  allowWaitlist: 'Permitir Lista de Espera',
  allowWaitlistDescription:
    'Jogadores podem entrar na lista de espera quando o evento estiver cheio',
  repeatEvent: 'Repetir Evento',
  repeatEventDescription: 'Criar evento recorrente',
  repeatFrequency: 'Frequência de Repetição',
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  biweekly: 'Quinzenalmente',
  monthly: 'Mensalmente',
  repeatUntil: 'Repetir Até',
  notifications: 'Notificações',
  sendReminders: 'Enviar Lembretes',
  sendRemindersDescription: 'Enviar lembretes aos participantes antes do evento',
  reminderTime: 'Tempo do Lembrete',
  oneHourBefore: '1 hora antes',
  oneDayBefore: '1 dia antes',
  oneWeekBefore: '1 semana antes',
  cost: 'Custo',
  free: 'Grátis',
  paid: 'Pago',
  costAmount: 'Valor',
  costCurrency: 'Moeda',
  notes: 'Notas',
  notesPlaceholder: 'Informações adicionais para os participantes...',
  cancel: 'Cancelar',
  create: 'Criar Evento',
  creating: 'Criando...',
  'errors.nameRequired': 'Nome do evento é obrigatório',
  'errors.dateRequired': 'Data é obrigatória',
  'errors.timeRequired': 'Hora é obrigatória',
  'errors.locationRequired': 'Localização é obrigatória',
  'errors.maxParticipantsInvalid': 'Máximo de participantes deve ser maior que 0',
  'errors.createFailed': 'Falha ao criar evento',
  'success.created': 'Evento criado com sucesso!',
  'success.createdDescription': 'Seu evento foi criado e os participantes foram notificados.',
};

// === TYPES TRANSLATIONS ===
const typesTranslations = {
  'matchType.singles': 'Simples',
  'matchType.doubles': 'Duplas',
  'matchType.mixed': 'Misto',
  'matchType.practice': 'Treino',
  'matchType.tournament': 'Torneio',
  'matchType.social': 'Social',
  'skillLevel.beginner': 'Iniciante (2.0-3.0)',
  'skillLevel.intermediate': 'Intermediário (3.0-4.0)',
  'skillLevel.advanced': 'Avançado (4.0-5.0)',
  'skillLevel.expert': 'Expert (5.0+)',
  'status.pending': 'Pendente',
  'status.confirmed': 'Confirmado',
  'status.cancelled': 'Cancelado',
  'status.completed': 'Concluído',
  'status.active': 'Ativo',
  'status.inactive': 'Inativo',
  'visibility.public': 'Público',
  'visibility.private': 'Privado',
  'visibility.clubOnly': 'Apenas Clube',
  'visibility.inviteOnly': 'Apenas Convidados',
  'role.owner': 'Proprietário',
  'role.admin': 'Administrador',
  'role.member': 'Membro',
  'role.guest': 'Convidado',
  'role.moderator': 'Moderador',
  'gender.male': 'Masculino',
  'gender.female': 'Feminino',
  'gender.other': 'Outro',
  'gender.preferNotToSay': 'Prefiro não dizer',
  'playStyle.aggressive': 'Agressivo',
  'playStyle.defensive': 'Defensivo',
  'playStyle.balanced': 'Equilibrado',
  'playStyle.allCourt': 'All Court',
  'playStyle.baseline': 'Baseline',
  'playStyle.netPlayer': 'Jogador de Rede',
  'playStyle.server': 'Sacador',
  'frequency.once': 'Uma Vez',
  'frequency.daily': 'Diariamente',
  'frequency.weekly': 'Semanalmente',
  'frequency.biweekly': 'Quinzenalmente',
  'frequency.monthly': 'Mensalmente',
  'frequency.yearly': 'Anualmente',
  'day.monday': 'Segunda-feira',
  'day.tuesday': 'Terça-feira',
  'day.wednesday': 'Quarta-feira',
  'day.thursday': 'Quinta-feira',
  'day.friday': 'Sexta-feira',
  'day.saturday': 'Sábado',
  'day.sunday': 'Domingo',
  'month.january': 'Janeiro',
  'month.february': 'Fevereiro',
  'month.march': 'Março',
  'month.april': 'Abril',
  'month.may': 'Maio',
  'month.june': 'Junho',
  'month.july': 'Julho',
  'month.august': 'Agosto',
  'month.september': 'Setembro',
  'month.october': 'Outubro',
  'month.november': 'Novembro',
  'month.december': 'Dezembro',
  'surface.hard': 'Dura',
  'surface.clay': 'Saibro',
  'surface.grass': 'Grama',
  'surface.carpet': 'Carpete',
  'surface.synthetic': 'Sintética',
};

// === CREATECLUB TRANSLATIONS ===
const createClubTranslations = {
  title: 'Criar Clube',
  clubName: 'Nome do Clube',
  clubNamePlaceholder: 'Digite o nome do clube',
  description: 'Descrição',
  descriptionPlaceholder: 'Descreva seu clube...',
  location: 'Localização',
  selectLocation: 'Selecionar Localização',
  searchLocation: 'Buscar localização...',
  clubType: 'Tipo de Clube',
  public: 'Público',
  private: 'Privado',
  publicDescription: 'Qualquer pessoa pode ver e solicitar participação',
  privateDescription: 'Apenas convidados podem ver e participar',
  membership: 'Associação',
  free: 'Grátis',
  paid: 'Pago',
  membershipFee: 'Taxa de Associação',
  monthly: 'Mensal',
  yearly: 'Anual',
  oneTime: 'Única',
  amount: 'Valor',
  currency: 'Moeda',
  facilities: 'Instalações',
  indoorCourts: 'Quadras Cobertas',
  outdoorCourts: 'Quadras Descobertas',
  numberOfCourts: 'Número de Quadras',
  lighting: 'Iluminação',
  parking: 'Estacionamento',
  locker: 'Vestiários',
  restrooms: 'Banheiros',
  proShop: 'Loja Profissional',
  cafe: 'Café',
  amenities: 'Comodidades',
  clubLogo: 'Logo do Clube',
  uploadLogo: 'Enviar Logo',
  coverPhoto: 'Foto de Capa',
  uploadCover: 'Enviar Capa',
  contactInfo: 'Informações de Contato',
  email: 'E-mail',
  emailPlaceholder: 'clube@exemplo.com',
  phone: 'Telefone',
  phonePlaceholder: '+55 (11) 1234-5678',
  website: 'Website',
  websitePlaceholder: 'https://seuclube.com',
  socialMedia: 'Redes Sociais',
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  cancel: 'Cancelar',
  create: 'Criar Clube',
  creating: 'Criando...',
  'errors.nameRequired': 'Nome do clube é obrigatório',
  'errors.descriptionRequired': 'Descrição é obrigatória',
  'errors.locationRequired': 'Localização é obrigatória',
  'errors.createFailed': 'Falha ao criar clube',
  'success.created': 'Clube criado com sucesso!',
  'success.createdDescription': 'Seu clube foi criado e está pronto para receber membros.',
};

// === CLUB TRANSLATIONS ===
const clubTranslations = {
  'tabs.overview': 'Visão Geral',
  'tabs.members': 'Membros',
  'tabs.events': 'Eventos',
  'tabs.chat': 'Chat',
  'tabs.settings': 'Configurações',
  'overview.about': 'Sobre',
  'overview.facilities': 'Instalações',
  'overview.location': 'Localização',
  'overview.contact': 'Contato',
  'overview.stats': 'Estatísticas',
  'overview.totalMembers': 'Total de Membros',
  'overview.activeMembers': 'Membros Ativos',
  'overview.upcomingEvents': 'Eventos Futuros',
  'overview.recentMatches': 'Partidas Recentes',
  'members.title': 'Membros',
  'members.search': 'Buscar membros...',
  'members.filter': 'Filtrar',
  'members.sort': 'Ordenar',
  'members.all': 'Todos',
  'members.admins': 'Administradores',
  'members.moderators': 'Moderadores',
  'members.active': 'Ativos',
  'members.pending': 'Pendentes',
  'members.invite': 'Convidar Membros',
  'members.requests': 'Solicitações',
  'members.role': 'Função',
  'members.joinedDate': 'Data de Entrada',
  'members.lastActive': 'Última Atividade',
  'events.upcoming': 'Próximos',
  'events.past': 'Passados',
  'events.all': 'Todos',
  'events.create': 'Criar Evento',
  'events.noEvents': 'Nenhum Evento',
  'events.noEventsDescription': 'Não há eventos agendados no momento.',
  'chat.title': 'Chat do Clube',
  'chat.typeMessage': 'Digite uma mensagem...',
  'chat.send': 'Enviar',
  'settings.general': 'Geral',
  'settings.membership': 'Associação',
  'settings.permissions': 'Permissões',
  'settings.notifications': 'Notificações',
  'settings.danger': 'Zona de Perigo',
  'settings.save': 'Salvar Alterações',
  'settings.cancel': 'Cancelar',
  'settings.deleteClub': 'Excluir Clube',
  'settings.deleteClubConfirm':
    'Tem certeza que deseja excluir este clube? Esta ação não pode ser desfeita.',
};

// Apply translations
console.log('🌍 Applying Portuguese translations for top sections...\n');

let count = 0;

// Apply auth translations
console.log('📦 Auth: ~32 keys');
Object.entries(authTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.auth, key, value);
  count++;
});

// Apply createEvent translations
console.log('📦 CreateEvent: 73 keys');
Object.entries(createEventTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.createEvent, key, value);
  count++;
});

// Apply types translations
console.log('📦 Types: 61 keys');
Object.entries(typesTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.types, key, value);
  count++;
});

// Apply createClub translations
console.log('📦 CreateClub: 54 keys');
Object.entries(createClubTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.createClub, key, value);
  count++;
});

// Apply club translations
console.log('📦 Club: 50 keys');
Object.entries(clubTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.club, key, value);
  count++;
});

// Write updated pt.json
fs.writeFileSync(PT_FILE, JSON.stringify(ptData, null, 2) + '\n', 'utf8');

console.log(`\n✅ Successfully translated ${count} keys to Brazilian Portuguese!`);
console.log(`📄 Updated: ${PT_FILE}`);
