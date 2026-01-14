#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PT_FILE = path.join(__dirname, '../src/locales/pt.json');

// Read current pt.json
const ptData = JSON.parse(fs.readFileSync(PT_FILE, 'utf8'));

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

// === EMAILLOGIN TRANSLATIONS ===
const emailLoginTranslations = {
  title: 'Login com E-mail',
  subtitle: 'Entre com sua conta',
  emailPlaceholder: 'Digite seu e-mail',
  passwordPlaceholder: 'Digite sua senha',
  forgotPassword: 'Esqueceu a senha?',
  loginButton: 'Entrar',
  loggingIn: 'Entrando...',
  dontHaveAccount: 'Não tem uma conta?',
  signUp: 'Cadastrar',
  orContinueWith: 'Ou continue com',
  'verification.title': 'Verificar E-mail',
  'verification.subtitle': 'Enviamos um código de verificação para',
  'verification.enterCode': 'Digite o código de 6 dígitos',
  'verification.codePlaceholder': '000000',
  'verification.resendCode': 'Reenviar código',
  'verification.resendIn': 'Reenviar em {{seconds}}s',
  'verification.verify': 'Verificar',
  'verification.verifying': 'Verificando...',
  'alerts.emptyFields.title': 'Campos Obrigatórios',
  'alerts.emptyFields.message': 'Por favor, preencha todos os campos',
  'alerts.invalidEmail.title': 'E-mail Inválido',
  'alerts.invalidEmail.message': 'Por favor, insira um e-mail válido',
  'alerts.loginError.title': 'Erro de Login',
  'alerts.loginError.message': 'E-mail ou senha incorretos',
  'alerts.forgotPassword.title': 'Redefinir Senha',
  'alerts.forgotPassword.message':
    'Digite seu e-mail para receber instruções de redefinição de senha',
  'alerts.forgotPassword.placeholder': 'seu-email@exemplo.com',
  'alerts.forgotPassword.cancel': 'Cancelar',
  'alerts.forgotPassword.send': 'Enviar',
  'alerts.forgotPassword.success.title': 'E-mail Enviado',
  'alerts.forgotPassword.success.message':
    'Verifique seu e-mail para instruções de redefinição de senha',
  'alerts.forgotPassword.error.title': 'Erro',
  'alerts.forgotPassword.error.message':
    'Falha ao enviar e-mail de redefinição. Por favor, tente novamente.',
  'alerts.verification.invalid.title': 'Código Inválido',
  'alerts.verification.invalid.message':
    'O código de verificação está incorreto. Por favor, tente novamente.',
  'alerts.verification.expired.title': 'Código Expirado',
  'alerts.verification.expired.message':
    'O código de verificação expirou. Por favor, solicite um novo código.',
  'alerts.verification.success.title': 'Verificado!',
  'alerts.verification.success.message': 'Seu e-mail foi verificado com sucesso.',
  'errors.auth-user-not-found': 'Nenhuma conta encontrada com este e-mail',
  'errors.auth-wrong-password': 'Senha incorreta',
  'errors.auth-invalid-email': 'Formato de e-mail inválido',
  'errors.auth-user-disabled': 'Esta conta foi desativada',
  'errors.auth-too-many-requests': 'Muitas tentativas. Por favor, tente novamente mais tarde',
  'errors.network-request-failed': 'Falha na conexão. Verifique sua internet',
  'errors.unknown': 'Ocorreu um erro. Por favor, tente novamente',
};

// === PROFILE TRANSLATIONS ===
const profileTranslations = {
  title: 'Perfil',
  edit: 'Editar Perfil',
  save: 'Salvar',
  cancel: 'Cancelar',
  personalInfo: 'Informações Pessoais',
  displayName: 'Nome de Exibição',
  bio: 'Biografia',
  bioPlaceholder: 'Conte-nos sobre você...',
  email: 'E-mail',
  phone: 'Telefone',
  phonePlaceholder: '+55 (11) 1234-5678',
  location: 'Localização',
  selectLocation: 'Selecionar Localização',
  pickleballInfo: 'Informações de Tênis',
  skillLevel: 'Nível de Habilidade',
  playStyle: 'Estilo de Jogo',
  yearsPlaying: 'Anos Jogando',
  preferredHand: 'Mão Preferida',
  rightHanded: 'Destro',
  leftHanded: 'Canhoto',
  preferences: 'Preferências',
  availability: 'Disponibilidade',
  preferredTime: 'Horário Preferido',
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
  preferredDays: 'Dias Preferidos',
  stats: 'Estatísticas',
  matchesPlayed: 'Partidas Jogadas',
  matchesWon: 'Partidas Vencidas',
  winRate: 'Taxa de Vitória',
  currentStreak: 'Sequência Atual',
  achievements: 'Conquistas',
  badges: 'Emblemas',
  viewAll: 'Ver Todos',
  changePhoto: 'Alterar Foto',
  uploadPhoto: 'Enviar Foto',
  removePhoto: 'Remover Foto',
  'errors.updateFailed': 'Falha ao atualizar perfil',
  'success.updated': 'Perfil atualizado com sucesso!',
};

// === PROFILESETTINGS TRANSLATIONS ===
const profileSettingsTranslations = {
  title: 'Configurações',
  account: 'Conta',
  privacy: 'Privacidade',
  notifications: 'Notificações',
  preferences: 'Preferências',
  about: 'Sobre',
  logout: 'Sair',
  accountSettings: 'Configurações da Conta',
  changeEmail: 'Alterar E-mail',
  changePassword: 'Alterar Senha',
  deleteAccount: 'Excluir Conta',
  privacySettings: 'Configurações de Privacidade',
  profileVisibility: 'Visibilidade do Perfil',
  showOnlineStatus: 'Mostrar Status Online',
  showLocation: 'Mostrar Localização',
  showStats: 'Mostrar Estatísticas',
  notificationSettings: 'Configurações de Notificações',
  pushNotifications: 'Notificações Push',
  emailNotifications: 'Notificações por E-mail',
  matchInvites: 'Convites de Partida',
  friendRequests: 'Solicitações de Amizade',
  clubUpdates: 'Atualizações do Clube',
  tournamentAlerts: 'Alertas de Torneio',
  preferencesSettings: 'Configurações de Preferências',
  language: 'Idioma',
  units: 'Unidades',
  metric: 'Métrico',
  imperial: 'Imperial',
  theme: 'Tema',
  light: 'Claro',
  dark: 'Escuro',
  auto: 'Automático',
  aboutApp: 'Sobre o Aplicativo',
  version: 'Versão',
  termsOfService: 'Termos de Serviço',
  privacyPolicy: 'Política de Privacidade',
  support: 'Suporte',
  logoutConfirm: 'Tem certeza que deseja sair?',
  deleteAccountConfirm:
    'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
};

// === SCHEDULEMEETUP TRANSLATIONS ===
const scheduleMeetupTranslations = {
  title: 'Agendar Encontro',
  selectDate: 'Selecionar Data',
  selectTime: 'Selecionar Hora',
  selectLocation: 'Selecionar Localização',
  searchLocation: 'Buscar localização...',
  duration: 'Duração',
  oneHour: '1 hora',
  twoHours: '2 horas',
  threeHours: '3 horas',
  custom: 'Personalizado',
  courtPreference: 'Preferência de Quadra',
  indoor: 'Coberta',
  outdoor: 'Descoberta',
  either: 'Qualquer',
  notes: 'Notas',
  notesPlaceholder: 'Informações adicionais...',
  invitePlayers: 'Convidar Jogadores',
  searchPlayers: 'Buscar jogadores...',
  selectedPlayers: 'Jogadores Selecionados',
  noPlayersSelected: 'Nenhum jogador selecionado',
  sendInvites: 'Enviar Convites',
  schedule: 'Agendar',
  scheduling: 'Agendando...',
  cancel: 'Cancelar',
  'errors.dateRequired': 'Data é obrigatória',
  'errors.timeRequired': 'Hora é obrigatória',
  'errors.locationRequired': 'Localização é obrigatória',
  'errors.noPlayersSelected': 'Selecione pelo menos um jogador',
  'errors.scheduleFailed': 'Falha ao agendar encontro',
  'success.scheduled': 'Encontro agendado com sucesso!',
  'success.invitesSent': 'Convites enviados aos jogadores selecionados',
};

// === AIMATCHING TRANSLATIONS ===
const aiMatchingTranslations = {
  title: 'Correspondência IA',
  subtitle: 'Encontre parceiros de tênis perfeitos',
  analyzing: 'Analisando seu perfil...',
  findingMatches: 'Encontrando correspondências...',
  recommendations: 'Recomendações',
  topMatches: 'Melhores Correspondências',
  compatibility: 'Compatibilidade',
  matchScore: 'Pontuação de Correspondência',
  similarSkill: 'Nível Similar',
  sameArea: 'Mesma Área',
  commonInterests: 'Interesses Comuns',
  availability: 'Disponibilidade',
  viewProfile: 'Ver Perfil',
  sendInvite: 'Enviar Convite',
  noMatches: 'Nenhuma Correspondência',
  noMatchesDescription: 'Não encontramos correspondências no momento. Tente novamente mais tarde.',
  refineSearch: 'Refinar Busca',
  filters: 'Filtros',
  skillRange: 'Faixa de Nível',
  distance: 'Distância',
  within5km: 'Até 5km',
  within10km: 'Até 10km',
  within25km: 'Até 25km',
  anyDistance: 'Qualquer Distância',
  playStyle: 'Estilo de Jogo',
  availability: 'Disponibilidade',
  matchPreferences: 'Preferências de Partida',
  applyFilters: 'Aplicar Filtros',
  clearFilters: 'Limpar Filtros',
  inviteSent: 'Convite enviado!',
  'errors.loadFailed': 'Falha ao carregar correspondências',
  'errors.inviteFailed': 'Falha ao enviar convite',
};

// Apply translations
console.log('🌍 Applying more Portuguese translations...\n');

let count = 0;

// Apply emailLogin translations
console.log('📦 EmailLogin: 59 keys');
Object.entries(emailLoginTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.emailLogin, key, value);
  count++;
});

// Apply profile translations
console.log('📦 Profile: 38 keys');
Object.entries(profileTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.profile, key, value);
  count++;
});

// Apply profileSettings translations
console.log('📦 ProfileSettings: 33 keys');
Object.entries(profileSettingsTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.profileSettings, key, value);
  count++;
});

// Apply scheduleMeetup translations
console.log('📦 ScheduleMeetup: 32 keys');
Object.entries(scheduleMeetupTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.scheduleMeetup, key, value);
  count++;
});

// Apply aiMatching translations
console.log('📦 AIMatching: 30 keys');
Object.entries(aiMatchingTranslations).forEach(([key, value]) => {
  setNestedValue(ptData.aiMatching, key, value);
  count++;
});

// Write updated pt.json
fs.writeFileSync(PT_FILE, JSON.stringify(ptData, null, 2) + '\n', 'utf8');

console.log(`\n✅ Successfully translated ${count} keys to Brazilian Portuguese!`);
console.log(`📄 Updated: ${PT_FILE}`);
