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

// === EVENTCARD TRANSLATIONS ===
const eventCardTranslations = {
  title: 'Evento',
  hosted: 'Organizado',
  attending: 'Participando',
  interested: 'Interessado',
  date: 'Data',
  time: 'Hora',
  location: 'Localização',
  host: 'Organizador',
  participants: 'Participantes',
  maxParticipants: 'Máximo',
  spotsLeft: '{{count}} vaga{{plural}} restante{{plural}}',
  spotLeft: '1 vaga restante',
  full: 'Cheio',
  waitlist: 'Lista de Espera',
  joinWaitlist: 'Entrar na Lista de Espera',
  skillLevel: 'Nível',
  eventType: 'Tipo',
  join: 'Participar',
  leave: 'Sair',
  viewDetails: 'Ver Detalhes',
  share: 'Compartilhar',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  upcoming: 'Próximo',
  inProgress: 'Em Andamento',
  freeEvent: 'Grátis',
  paidEvent: 'Pago',
  cost: 'Custo',
  visibility: 'Visibilidade',
  requiresApproval: 'Requer Aprovação',
  inviteOnly: 'Apenas Convidados',
  recurringEvent: 'Evento Recorrente',
};

// === MYACTIVITIES TRANSLATIONS ===
const myActivitiesTranslations = {
  title: 'Minhas Atividades',
  upcoming: 'Próximos',
  past: 'Passados',
  all: 'Todos',
  matches: 'Partidas',
  events: 'Eventos',
  tournaments: 'Torneios',
  practices: 'Treinos',
  noActivities: 'Nenhuma Atividade',
  noActivitiesDescription: 'Você ainda não tem nenhuma atividade agendada.',
  findMatches: 'Encontrar Partidas',
  joinEvent: 'Participar de Evento',
  filter: 'Filtrar',
  sort: 'Ordenar',
  sortBy: 'Ordenar por',
  date: 'Data',
  type: 'Tipo',
  status: 'Status',
  hostedByMe: 'Organizados por Mim',
  attending: 'Participando',
  invited: 'Convidado',
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  viewAll: 'Ver Todos',
  refresh: 'Atualizar',
  loadMore: 'Carregar Mais',
  loading: 'Carregando...',
  'stats.total': 'Total',
  'stats.thisWeek': 'Esta Semana',
  'stats.thisMonth': 'Este Mês',
  'stats.hoursPlayed': 'Horas Jogadas',
  'stats.matchesWon': 'Partidas Vencidas',
};

// === CREATEMEETUP TRANSLATIONS ===
const createMeetupTranslations = {
  title: 'Criar Encontro',
  subtitle: 'Organize um encontro de tênis',
  meetupName: 'Nome do Encontro',
  meetupNamePlaceholder: 'Digite o nome do encontro',
  description: 'Descrição',
  descriptionPlaceholder: 'Descreva seu encontro...',
  date: 'Data',
  selectDate: 'Selecionar Data',
  time: 'Hora',
  selectTime: 'Selecionar Hora',
  location: 'Localização',
  selectLocation: 'Selecionar Localização',
  searchLocation: 'Buscar localização...',
  duration: 'Duração',
  oneHour: '1 hora',
  twoHours: '2 horas',
  threeHours: '3 horas',
  custom: 'Personalizado',
  maxParticipants: 'Máximo de Participantes',
  skillLevel: 'Nível de Habilidade',
  anyLevel: 'Qualquer Nível',
  meetupType: 'Tipo de Encontro',
  casual: 'Casual',
  competitive: 'Competitivo',
  practice: 'Treino',
  visibility: 'Visibilidade',
  public: 'Público',
  private: 'Privado',
  friendsOnly: 'Apenas Amigos',
  notes: 'Notas',
  notesPlaceholder: 'Informações adicionais...',
  cancel: 'Cancelar',
  create: 'Criar Encontro',
  creating: 'Criando...',
};

// === BADGEGALLERY TRANSLATIONS ===
const badgeGalleryTranslations = {
  title: 'Galeria de Emblemas',
  myBadges: 'Meus Emblemas',
  allBadges: 'Todos os Emblemas',
  locked: 'Bloqueado',
  unlocked: 'Desbloqueado',
  inProgress: 'Em Andamento',
  progress: 'Progresso',
  howToUnlock: 'Como Desbloquear',
  unlockedOn: 'Desbloqueado em',
  categories: 'Categorias',
  achievements: 'Conquistas',
  milestones: 'Marcos',
  special: 'Especial',
  seasonal: 'Sazonal',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  noBadges: 'Nenhum Emblema',
  noBadgesDescription: 'Comece a jogar para desbloquear emblemas!',
  total: 'Total',
  recent: 'Recente',
  share: 'Compartilhar',
  viewDetails: 'Ver Detalhes',
  closeToUnlocking: 'Perto de Desbloquear',
  filter: 'Filtrar',
  sort: 'Ordenar',
  sortBy: 'Ordenar por',
  rarity: 'Raridade',
  dateUnlocked: 'Data de Desbloqueio',
};

// === LEAGUES TRANSLATIONS ===
const leaguesTranslations = {
  title: 'Ligas',
  myLeagues: 'Minhas Ligas',
  joinLeague: 'Participar de Liga',
  createLeague: 'Criar Liga',
  active: 'Ativas',
  upcoming: 'Próximas',
  completed: 'Concluídas',
  leagueName: 'Nome da Liga',
  season: 'Temporada',
  division: 'Divisão',
  standings: 'Classificação',
  schedule: 'Calendário',
  results: 'Resultados',
  stats: 'Estatísticas',
  rank: 'Posição',
  team: 'Equipe',
  played: 'Jogados',
  won: 'Vitórias',
  lost: 'Derrotas',
  points: 'Pontos',
  matchesPlayed: 'Partidas Jogadas',
  upcomingMatches: 'Próximas Partidas',
  recentResults: 'Resultados Recentes',
  noLeagues: 'Nenhuma Liga',
  noLeaguesDescription: 'Você ainda não está participando de nenhuma liga.',
  joinNow: 'Participar Agora',
  viewStandings: 'Ver Classificação',
  viewSchedule: 'Ver Calendário',
};

// === DISCOVER TRANSLATIONS ===
const discoverTranslations = {
  title: 'Descobrir',
  search: 'Buscar',
  searchPlaceholder: 'Buscar jogadores, clubes, eventos...',
  players: 'Jogadores',
  clubs: 'Clubes',
  events: 'Eventos',
  matches: 'Partidas',
  nearby: 'Próximo',
  recommended: 'Recomendado',
  trending: 'Em Alta',
  new: 'Novo',
  filters: 'Filtros',
  distance: 'Distância',
  skillLevel: 'Nível de Habilidade',
  availability: 'Disponibilidade',
  applyFilters: 'Aplicar Filtros',
  clearFilters: 'Limpar Filtros',
  noResults: 'Nenhum Resultado',
  noResultsDescription: 'Nenhum resultado encontrado. Tente ajustar seus filtros.',
  loadMore: 'Carregar Mais',
  loading: 'Carregando...',
  viewProfile: 'Ver Perfil',
  sendInvite: 'Enviar Convite',
};

// === FINDCLUBSCREEN TRANSLATIONS ===
const findClubScreenTranslations = {
  title: 'Encontrar Clube',
  search: 'Buscar clubes...',
  nearby: 'Clubes Próximos',
  all: 'Todos os Clubes',
  recommended: 'Recomendados',
  filters: 'Filtros',
  distance: 'Distância',
  membershipType: 'Tipo de Associação',
  facilities: 'Instalações',
  applyFilters: 'Aplicar Filtros',
  clearFilters: 'Limpar Filtros',
  noClubs: 'Nenhum Clube',
  noClubsDescription: 'Nenhum clube encontrado na sua área.',
  createClub: 'Criar Clube',
  loadMore: 'Carregar Mais',
  loading: 'Carregando...',
  members: 'Membros',
  courts: 'Quadras',
  distance_km: '{{distance}} km',
  viewDetails: 'Ver Detalhes',
  join: 'Participar',
  joined: 'Participando',
  pending: 'Pendente',
  requestSent: 'Solicitação Enviada',
};

// === CLUBLIST TRANSLATIONS ===
const clubListTranslations = {
  title: 'Clubes',
  myClubs: 'Meus Clubes',
  allClubs: 'Todos os Clubes',
  search: 'Buscar clubes...',
  createClub: 'Criar Clube',
  noClubs: 'Nenhum Clube',
  noClubsDescription: 'Você ainda não está participando de nenhum clube.',
  findClubs: 'Encontrar Clubes',
  filter: 'Filtrar',
  sort: 'Ordenar',
  sortBy: 'Ordenar por',
  name: 'Nome',
  members: 'Membros',
  activity: 'Atividade',
  distance: 'Distância',
  viewAll: 'Ver Todos',
  loading: 'Carregando...',
  loadMore: 'Carregar Mais',
  refresh: 'Atualizar',
  activeMembers: 'Membros Ativos',
  upcomingEvents: 'Eventos Futuros',
};

// === MATCHREQUEST TRANSLATIONS ===
const matchRequestTranslations = {
  title: 'Solicitação de Partida',
  from: 'De',
  message: 'Mensagem',
  proposedDate: 'Data Proposta',
  proposedTime: 'Hora Proposta',
  location: 'Localização',
  matchType: 'Tipo de Partida',
  skillLevel: 'Nível',
  accept: 'Aceitar',
  decline: 'Recusar',
  counter: 'Contraproposta',
  viewProfile: 'Ver Perfil',
  accepted: 'Aceita',
  declined: 'Recusada',
  pending: 'Pendente',
  expired: 'Expirada',
  confirmAccept: 'Confirmar Aceitação',
  confirmAcceptMessage: 'Tem certeza que deseja aceitar esta solicitação de partida?',
  confirmDecline: 'Confirmar Recusa',
  confirmDeclineMessage: 'Tem certeza que deseja recusar esta solicitação de partida?',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
};

// === FEEDCARD TRANSLATIONS ===
const feedCardTranslations = {
  postedBy: 'Postado por',
  ago: 'atrás',
  justNow: 'Agora mesmo',
  minutesAgo: '{{count}} minuto{{plural}} atrás',
  hoursAgo: '{{count}} hora{{plural}} atrás',
  daysAgo: '{{count}} dia{{plural}} atrás',
  like: 'Curtir',
  comment: 'Comentar',
  share: 'Compartilhar',
  likes: '{{count}} curtida{{plural}}',
  comments: '{{count}} comentário{{plural}}',
  shares: '{{count}} compartilhamento{{plural}}',
  viewComments: 'Ver Comentários',
  addComment: 'Adicionar Comentário',
  writeComment: 'Escrever comentário...',
  post: 'Publicar',
  edit: 'Editar',
  delete: 'Excluir',
  report: 'Denunciar',
};

// Apply translations
console.log('🌍 Applying final batch of Portuguese translations...\n');

let count = 0;

const sections = [
  { name: 'EventCard', data: eventCardTranslations, target: ptData.eventCard, count: 32 },
  { name: 'MyActivities', data: myActivitiesTranslations, target: ptData.myActivities, count: 31 },
  { name: 'CreateMeetup', data: createMeetupTranslations, target: ptData.createMeetup, count: 31 },
  { name: 'BadgeGallery', data: badgeGalleryTranslations, target: ptData.badgeGallery, count: 26 },
  { name: 'Leagues', data: leaguesTranslations, target: ptData.leagues, count: 25 },
  { name: 'Discover', data: discoverTranslations, target: ptData.discover, count: 24 },
  {
    name: 'FindClubScreen',
    data: findClubScreenTranslations,
    target: ptData.findClubScreen,
    count: 24,
  },
  { name: 'ClubList', data: clubListTranslations, target: ptData.clubList, count: 22 },
  { name: 'MatchRequest', data: matchRequestTranslations, target: ptData.matchRequest, count: 22 },
  { name: 'FeedCard', data: feedCardTranslations, target: ptData.feedCard, count: 21 },
];

sections.forEach(section => {
  console.log(`📦 ${section.name}: ${section.count} keys`);
  Object.entries(section.data).forEach(([key, value]) => {
    setNestedValue(section.target, key, value);
    count++;
  });
});

// Write updated pt.json
fs.writeFileSync(PT_FILE, JSON.stringify(ptData, null, 2) + '\n', 'utf8');

console.log(`\n✅ Successfully translated ${count} keys to Brazilian Portuguese!`);
console.log(`📄 Updated: ${PT_FILE}`);
