const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');

// Deep merge utility
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Convert flat keys to nested object
function keysToNested(translations) {
  const result = {};

  for (const [key, value] of Object.entries(translations)) {
    const parts = key.split('.');
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}

// Translation dictionaries
const translations = {
  es: {
    // Profile & Settings
    'editProfile.gender.notSpecified': 'No especificado',
    'editProfile.gender.hint': 'Opcional',
    'editProfile.skillLevel.label': 'Nivel de habilidad',
    'editProfile.skillLevel.beginner': 'Principiante',
    'editProfile.skillLevel.intermediate': 'Intermedio',
    'editProfile.skillLevel.advanced': 'Avanzado',
    'editProfile.skillLevel.expert': 'Experto',
    'editProfile.skillLevel.hint': 'Selecciona tu nivel',
    'editProfile.playingStyle.netPlayer': 'Jugador de red',

    // Discovery
    'discover.search.players': 'Jugadores',
    'discover.search.clubs': 'Clubes',
    'discover.search.events': 'Eventos',

    // Email Login
    'emailLogin.title.login': 'Iniciar sesión',
    'emailLogin.title.signup': 'Registrarse',
    'emailLogin.title.verification': 'Verificación',
    'emailLogin.verification.sentTo': 'Código enviado a',
    'emailLogin.alerts.invalidEmail.title': 'Email inválido',
    'emailLogin.alerts.invalidEmail.message': 'Por favor ingresa un email válido',
    'emailLogin.alerts.tooManyAttempts.title': 'Demasiados intentos',
    'emailLogin.alerts.tooManyAttempts.message': 'Por favor intenta más tarde',

    // Tournament Management
    'clubTournamentManagement.participants.label': 'Participantes',
    'clubTournamentManagement.participants.overview': 'Resumen',
    'clubTournamentManagement.participants.current': 'Actual',
    'clubTournamentManagement.participants.max': 'Máximo',
    'clubTournamentManagement.participants.list': 'Lista',
    'clubTournamentManagement.participants.count': 'Cantidad',
    'clubTournamentManagement.participants.player1': 'Jugador 1',
    'clubTournamentManagement.participants.player2': 'Jugador 2',

    // Location
    'profileSettings.location.permission.granted': 'Permiso concedido',
    'profileSettings.location.permission.denied': 'Permiso denegado',
    'profileSettings.location.update.success': 'Ubicación actualizada',
    'profileSettings.location.update.failed': 'Error al actualizar ubicación',

    // Match & Game
    'matchDetail.score.label': 'Marcador',
    'matchDetail.score.set': 'Set',
    'matchDetail.score.game': 'Juego',
    'matchDetail.score.tiebreak': 'Tie-break',
    'matchDetail.winner.label': 'Ganador',
    'matchDetail.status.scheduled': 'Programado',
    'matchDetail.status.inProgress': 'En progreso',
    'matchDetail.status.completed': 'Completado',
    'matchDetail.status.cancelled': 'Cancelado',

    // Notifications
    'notifications.settings.title': 'Notificaciones',
    'notifications.settings.matches': 'Partidos',
    'notifications.settings.friends': 'Amigos',
    'notifications.settings.clubs': 'Clubes',
    'notifications.settings.messages': 'Mensajes',
    'notifications.settings.all': 'Todas',
    'notifications.settings.none': 'Ninguna',

    // Common actions
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.done': 'Listo',
    'common.loading': 'Cargando',
    'common.retry': 'Reintentar',
    'common.confirm': 'Confirmar',
    'common.submit': 'Enviar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.select': 'Seleccionar',
    'common.clear': 'Limpiar',
    'common.apply': 'Aplicar',
    'common.reset': 'Restablecer',
    'common.close': 'Cerrar',
    'common.open': 'Abrir',
    'common.view': 'Ver',
    'common.share': 'Compartir',
    'common.copy': 'Copiar',
    'common.remove': 'Eliminar',
    'common.add': 'Agregar',
    'common.update': 'Actualizar',
    'common.create': 'Crear',
    'common.yes': 'Sí',
    'common.ok': 'OK',
    'common.optional': 'Opcional',
    'common.required': 'Requerido',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    'common.help': 'Ayuda',
    'common.settings': 'Configuración',
    'common.profile': 'Perfil',
    'common.logout': 'Cerrar sesión',
    'common.login': 'Iniciar sesión',
    'common.signup': 'Registrarse',
    'common.welcome': 'Bienvenido',
    'common.continue': 'Continuar',
    'common.skip': 'Omitir',
    'common.finish': 'Finalizar',
    'common.start': 'Iniciar',
    'common.stop': 'Detener',
    'common.pause': 'Pausar',
    'common.resume': 'Reanudar',
    'common.play': 'Jugar',
    'common.record': 'Grabar',
  },

  de: {
    // Profile & Settings
    'editProfile.gender.notSpecified': 'Nicht angegeben',
    'editProfile.gender.hint': 'Optional',
    'editProfile.skillLevel.label': 'Spielstärke',
    'editProfile.skillLevel.beginner': 'Anfänger',
    'editProfile.skillLevel.intermediate': 'Fortgeschritten',
    'editProfile.skillLevel.advanced': 'Fortgeschrittene',
    'editProfile.skillLevel.expert': 'Experte',
    'editProfile.skillLevel.hint': 'Wählen Sie Ihr Niveau',
    'editProfile.playingStyle.netPlayer': 'Netzspieler',

    // Discovery
    'discover.search.players': 'Spieler',
    'discover.search.clubs': 'Clubs',
    'discover.search.events': 'Veranstaltungen',

    // Email Login
    'emailLogin.title.login': 'Anmelden',
    'emailLogin.title.signup': 'Registrieren',
    'emailLogin.title.verification': 'Verifizierung',
    'emailLogin.verification.sentTo': 'Code gesendet an',
    'emailLogin.alerts.invalidEmail.title': 'Ungültige E-Mail',
    'emailLogin.alerts.invalidEmail.message': 'Bitte geben Sie eine gültige E-Mail ein',
    'emailLogin.alerts.tooManyAttempts.title': 'Zu viele Versuche',
    'emailLogin.alerts.tooManyAttempts.message': 'Bitte versuchen Sie es später erneut',

    // Tournament Management
    'clubTournamentManagement.participants.label': 'Teilnehmer',
    'clubTournamentManagement.participants.overview': 'Übersicht',
    'clubTournamentManagement.participants.current': 'Aktuell',
    'clubTournamentManagement.participants.max': 'Maximum',
    'clubTournamentManagement.participants.list': 'Liste',
    'clubTournamentManagement.participants.count': 'Anzahl',
    'clubTournamentManagement.participants.player1': 'Spieler 1',
    'clubTournamentManagement.participants.player2': 'Spieler 2',

    // Location
    'profileSettings.location.permission.granted': 'Berechtigung erteilt',
    'profileSettings.location.permission.denied': 'Berechtigung verweigert',
    'profileSettings.location.update.success': 'Standort aktualisiert',
    'profileSettings.location.update.failed': 'Fehler beim Aktualisieren',

    // Match & Game
    'matchDetail.score.label': 'Spielstand',
    'matchDetail.score.set': 'Satz',
    'matchDetail.score.game': 'Spiel',
    'matchDetail.score.tiebreak': 'Tie-Break',
    'matchDetail.winner.label': 'Sieger',
    'matchDetail.status.scheduled': 'Geplant',
    'matchDetail.status.inProgress': 'Läuft',
    'matchDetail.status.completed': 'Abgeschlossen',
    'matchDetail.status.cancelled': 'Abgesagt',

    // Notifications
    'notifications.settings.title': 'Benachrichtigungen',
    'notifications.settings.matches': 'Spiele',
    'notifications.settings.friends': 'Freunde',
    'notifications.settings.clubs': 'Clubs',
    'notifications.settings.messages': 'Nachrichten',
    'notifications.settings.all': 'Alle',
    'notifications.settings.none': 'Keine',

    // Common actions
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.done': 'Fertig',
    'common.loading': 'Lädt',
    'common.retry': 'Erneut versuchen',
    'common.confirm': 'Bestätigen',
    'common.submit': 'Senden',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.sort': 'Sortieren',
    'common.select': 'Auswählen',
    'common.clear': 'Löschen',
    'common.apply': 'Anwenden',
    'common.reset': 'Zurücksetzen',
    'common.close': 'Schließen',
    'common.open': 'Öffnen',
    'common.view': 'Ansehen',
    'common.share': 'Teilen',
    'common.copy': 'Kopieren',
    'common.remove': 'Entfernen',
    'common.add': 'Hinzufügen',
    'common.update': 'Aktualisieren',
    'common.create': 'Erstellen',
    'common.yes': 'Ja',
    'common.ok': 'OK',
    'common.optional': 'Optional',
    'common.required': 'Erforderlich',
    'common.success': 'Erfolgreich',
    'common.warning': 'Warnung',
    'common.info': 'Information',
    'common.help': 'Hilfe',
    'common.settings': 'Einstellungen',
    'common.profile': 'Profil',
    'common.logout': 'Abmelden',
    'common.login': 'Anmelden',
    'common.signup': 'Registrieren',
    'common.welcome': 'Willkommen',
    'common.continue': 'Fortfahren',
    'common.skip': 'Überspringen',
    'common.finish': 'Beenden',
    'common.start': 'Starten',
    'common.stop': 'Stoppen',
    'common.pause': 'Pausieren',
    'common.resume': 'Fortsetzen',
    'common.play': 'Spielen',
    'common.record': 'Aufnehmen',
  },

  zh: {
    // Profile & Settings
    'editProfile.gender.notSpecified': '未指定',
    'editProfile.gender.hint': '可选',
    'editProfile.skillLevel.label': '技能等级',
    'editProfile.skillLevel.beginner': '初学者',
    'editProfile.skillLevel.intermediate': '中级',
    'editProfile.skillLevel.advanced': '高级',
    'editProfile.skillLevel.expert': '专家',
    'editProfile.skillLevel.hint': '选择您的水平',
    'editProfile.playingStyle.netPlayer': '网前球员',

    // Discovery
    'discover.search.players': '球员',
    'discover.search.clubs': '俱乐部',
    'discover.search.events': '活动',

    // Email Login
    'emailLogin.title.login': '登录',
    'emailLogin.title.signup': '注册',
    'emailLogin.title.verification': '验证',
    'emailLogin.verification.sentTo': '验证码已发送至',
    'emailLogin.alerts.invalidEmail.title': '无效邮箱',
    'emailLogin.alerts.invalidEmail.message': '请输入有效的邮箱地址',
    'emailLogin.alerts.tooManyAttempts.title': '尝试次数过多',
    'emailLogin.alerts.tooManyAttempts.message': '请稍后再试',

    // Tournament Management
    'clubTournamentManagement.participants.label': '参与者',
    'clubTournamentManagement.participants.overview': '概览',
    'clubTournamentManagement.participants.current': '当前',
    'clubTournamentManagement.participants.max': '最大值',
    'clubTournamentManagement.participants.list': '列表',
    'clubTournamentManagement.participants.count': '数量',
    'clubTournamentManagement.participants.player1': '球员1',
    'clubTournamentManagement.participants.player2': '球员2',

    // Location
    'profileSettings.location.permission.granted': '权限已授予',
    'profileSettings.location.permission.denied': '权限被拒绝',
    'profileSettings.location.update.success': '位置已更新',
    'profileSettings.location.update.failed': '更新失败',

    // Match & Game
    'matchDetail.score.label': '比分',
    'matchDetail.score.set': '盘',
    'matchDetail.score.game': '局',
    'matchDetail.score.tiebreak': '抢七',
    'matchDetail.winner.label': '获胜者',
    'matchDetail.status.scheduled': '已安排',
    'matchDetail.status.inProgress': '进行中',
    'matchDetail.status.completed': '已完成',
    'matchDetail.status.cancelled': '已取消',

    // Notifications
    'notifications.settings.title': '通知',
    'notifications.settings.matches': '比赛',
    'notifications.settings.friends': '好友',
    'notifications.settings.clubs': '俱乐部',
    'notifications.settings.messages': '消息',
    'notifications.settings.all': '全部',
    'notifications.settings.none': '无',

    // Common actions
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.back': '返回',
    'common.next': '下一步',
    'common.done': '完成',
    'common.loading': '加载中',
    'common.retry': '重试',
    'common.confirm': '确认',
    'common.submit': '提交',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.sort': '排序',
    'common.select': '选择',
    'common.clear': '清除',
    'common.apply': '应用',
    'common.reset': '重置',
    'common.close': '关闭',
    'common.open': '打开',
    'common.view': '查看',
    'common.share': '分享',
    'common.copy': '复制',
    'common.remove': '移除',
    'common.add': '添加',
    'common.update': '更新',
    'common.create': '创建',
    'common.yes': '是',
    'common.ok': '确定',
    'common.optional': '可选',
    'common.required': '必填',
    'common.success': '成功',
    'common.warning': '警告',
    'common.info': '信息',
    'common.help': '帮助',
    'common.settings': '设置',
    'common.profile': '个人资料',
    'common.logout': '登出',
    'common.login': '登录',
    'common.signup': '注册',
    'common.welcome': '欢迎',
    'common.continue': '继续',
    'common.skip': '跳过',
    'common.finish': '完成',
    'common.start': '开始',
    'common.stop': '停止',
    'common.pause': '暂停',
    'common.resume': '恢复',
    'common.play': '播放',
    'common.record': '记录',
  },

  pt: {
    // Profile & Settings
    'editProfile.gender.notSpecified': 'Não especificado',
    'editProfile.gender.hint': 'Opcional',
    'editProfile.skillLevel.label': 'Nível de habilidade',
    'editProfile.skillLevel.beginner': 'Iniciante',
    'editProfile.skillLevel.intermediate': 'Intermediário',
    'editProfile.skillLevel.advanced': 'Avançado',
    'editProfile.skillLevel.expert': 'Especialista',
    'editProfile.skillLevel.hint': 'Selecione seu nível',
    'editProfile.playingStyle.netPlayer': 'Jogador de rede',

    // Discovery
    'discover.search.players': 'Jogadores',
    'discover.search.clubs': 'Clubes',
    'discover.search.events': 'Eventos',

    // Email Login
    'emailLogin.title.login': 'Entrar',
    'emailLogin.title.signup': 'Cadastrar',
    'emailLogin.title.verification': 'Verificação',
    'emailLogin.verification.sentTo': 'Código enviado para',
    'emailLogin.alerts.invalidEmail.title': 'E-mail inválido',
    'emailLogin.alerts.invalidEmail.message': 'Por favor insira um e-mail válido',
    'emailLogin.alerts.tooManyAttempts.title': 'Muitas tentativas',
    'emailLogin.alerts.tooManyAttempts.message': 'Por favor tente mais tarde',

    // Tournament Management
    'clubTournamentManagement.participants.label': 'Participantes',
    'clubTournamentManagement.participants.overview': 'Visão geral',
    'clubTournamentManagement.participants.current': 'Atual',
    'clubTournamentManagement.participants.max': 'Máximo',
    'clubTournamentManagement.participants.list': 'Lista',
    'clubTournamentManagement.participants.count': 'Quantidade',
    'clubTournamentManagement.participants.player1': 'Jogador 1',
    'clubTournamentManagement.participants.player2': 'Jogador 2',

    // Location
    'profileSettings.location.permission.granted': 'Permissão concedida',
    'profileSettings.location.permission.denied': 'Permissão negada',
    'profileSettings.location.update.success': 'Localização atualizada',
    'profileSettings.location.update.failed': 'Erro ao atualizar',

    // Match & Game
    'matchDetail.score.label': 'Placar',
    'matchDetail.score.set': 'Set',
    'matchDetail.score.game': 'Game',
    'matchDetail.score.tiebreak': 'Tie-break',
    'matchDetail.winner.label': 'Vencedor',
    'matchDetail.status.scheduled': 'Agendado',
    'matchDetail.status.inProgress': 'Em andamento',
    'matchDetail.status.completed': 'Concluído',
    'matchDetail.status.cancelled': 'Cancelado',

    // Notifications
    'notifications.settings.title': 'Notificações',
    'notifications.settings.matches': 'Partidas',
    'notifications.settings.friends': 'Amigos',
    'notifications.settings.clubs': 'Clubes',
    'notifications.settings.messages': 'Mensagens',
    'notifications.settings.all': 'Todas',
    'notifications.settings.none': 'Nenhuma',

    // Common actions
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.done': 'Concluído',
    'common.loading': 'Carregando',
    'common.retry': 'Tentar novamente',
    'common.confirm': 'Confirmar',
    'common.submit': 'Enviar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.select': 'Selecionar',
    'common.clear': 'Limpar',
    'common.apply': 'Aplicar',
    'common.reset': 'Redefinir',
    'common.close': 'Fechar',
    'common.open': 'Abrir',
    'common.view': 'Visualizar',
    'common.share': 'Compartilhar',
    'common.copy': 'Copiar',
    'common.remove': 'Remover',
    'common.add': 'Adicionar',
    'common.update': 'Atualizar',
    'common.create': 'Criar',
    'common.yes': 'Sim',
    'common.ok': 'OK',
    'common.optional': 'Opcional',
    'common.required': 'Obrigatório',
    'common.success': 'Sucesso',
    'common.warning': 'Aviso',
    'common.info': 'Informação',
    'common.help': 'Ajuda',
    'common.settings': 'Configurações',
    'common.profile': 'Perfil',
    'common.logout': 'Sair',
    'common.login': 'Entrar',
    'common.signup': 'Cadastrar',
    'common.welcome': 'Bem-vindo',
    'common.continue': 'Continuar',
    'common.skip': 'Pular',
    'common.finish': 'Finalizar',
    'common.start': 'Iniciar',
    'common.stop': 'Parar',
    'common.pause': 'Pausar',
    'common.resume': 'Retomar',
    'common.play': 'Jogar',
    'common.record': 'Gravar',
  },
};

function applyTranslations(langCode, translations, langName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Applying ${langName} translations (${Object.keys(translations).length} keys)`);
  console.log('='.repeat(80));

  const filePath = path.join(LOCALES_DIR, `${langCode}.json`);
  const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Convert flat translations to nested
  const nestedTranslations = keysToNested(translations);

  // Deep merge
  const updatedData = deepMerge(existingData, nestedTranslations);

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2) + '\n');

  console.log(`✅ ${langName} updated successfully!`);
  console.log(`   Keys applied: ${Object.keys(translations).length}`);
}

function main() {
  console.log('🌍 AUTO-COMPLETING ALL 4 LANGUAGE TRANSLATIONS');
  console.log('='.repeat(80));

  applyTranslations('es', translations.es, 'Spanish (Latin American)');
  applyTranslations('de', translations.de, 'German (formal)');
  applyTranslations('zh', translations.zh, 'Chinese (Simplified)');
  applyTranslations('pt', translations.pt, 'Portuguese (Brazilian)');

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TRANSLATIONS APPLIED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log('\nTotal keys translated:');
  console.log(`  - Spanish: ${Object.keys(translations.es).length} keys`);
  console.log(`  - German: ${Object.keys(translations.de).length} keys`);
  console.log(`  - Chinese: ${Object.keys(translations.zh).length} keys`);
  console.log(`  - Portuguese: ${Object.keys(translations.pt).length} keys`);

  const total =
    Object.keys(translations.es).length +
    Object.keys(translations.de).length +
    Object.keys(translations.zh).length +
    Object.keys(translations.pt).length;
  console.log(`\nGrand total: ${total} translations applied`);
}

main();
