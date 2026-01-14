#!/usr/bin/env node
/**
 * Final Manual Translation for Remaining 610 Keys
 * Hand-crafted translations for complex Spanish phrases
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Comprehensive manual translation dictionary
const manualTranslations = {
  // Services
  'No matches found for your criteria. Would you like to try different filters?':
    'No se encontraron partidos con tus criterios. ¿Te gustaría probar diferentes filtros?',
  '🎾 Found {{count}} matches!': '🎾 ¡Se encontraron {{count}} partidos!',
  '   👥 {{current}}/{{max}} players': '   👥 {{current}}/{{max}} jugadores',
  'Event type {{eventType}} must use {{expectedFormat}} format.':
    'El tipo de evento {{eventType}} debe usar el formato {{expectedFormat}}.',
  'Only match participants can submit scores.':
    'Solo los participantes del partido pueden enviar resultados.',
  'You do not have permission to confirm this score.':
    'No tienes permiso para confirmar este resultado.',
  'This match is not in disputed status.': 'Este partido no está en estado disputado.',
  'You must be logged in': 'Debes iniciar sesión',
  'You can only accept your own application': 'Solo puedes aceptar tu propia solicitud',
  'Team merge failed. Please try again.':
    'Error al fusionar equipos. Por favor intenta nuevamente.',
  'Only invited users can respond': 'Solo los usuarios invitados pueden responder',
  'Invitation has already been processed': 'La invitación ya ha sido procesada',
  'New Participation Request': 'Nueva Solicitud de Participación',
  'Participation Approved!': '¡Participación Aprobada!',
  'Participation Request Declined': 'Solicitud de Participación Rechazada',
  '🏆 Playoffs Qualified!': '¡🏆 Clasificado a Eliminatorias!',
  '{{applicantName}} has requested to join "{{eventTitle}}".':
    '{{applicantName}} ha solicitado unirse a "{{eventTitle}}".',
  'Your participation in "{{eventTitle}}" has been approved!':
    '¡Tu participación en "{{eventTitle}}" ha sido aprobada!',
  'Your participation request for "{{eventTitle}}" has been declined.':
    'Tu solicitud de participación en "{{eventTitle}}" ha sido rechazada.',

  // Dues Management
  'View Attachment': 'Ver Adjunto',
  'Process Payment': 'Procesar Pago',
  'Save Failed': 'Error al Guardar',
  'Enable Auto Invoice': 'Activar Facturación Automática',
  'Upload Failed': 'Error al Subir',
  "To enable auto invoice, please configure the following:\n\n• {{items}}\n\nPlease set these in the 'Dues Settings' section above.":
    "Para activar la facturación automática, por favor configura lo siguiente:\n\n• {{items}}\n\nPor favor configúralos en la sección 'Configuración de Cuotas' arriba.",
  'Invoices will be automatically sent on the {{day}} of each month.\n(Due Date: {{dueDate}} of each month)\n\nDo you want to enable?':
    'Las facturas se enviarán automáticamente el día {{day}} de cada mes.\n(Fecha de Vencimiento: {{dueDate}} de cada mes)\n\n¿Quieres activar?',
  'Unable to load dues data.': 'No se pueden cargar los datos de cuotas.',
  'Send payment reminder to all members with overdue payments?':
    '¿Enviar recordatorio de pago a todos los miembros con pagos vencidos?',
  'Reminder notification has been sent to {{count}} member(s).':
    'Se ha enviado notificación de recordatorio a {{count}} miembro(s).',
  'Payment has been approved.': 'El pago ha sido aprobado.',
  'Payment has been rejected.': 'El pago ha sido rechazado.',
  'Late fee has been added.': 'Se ha agregado recargo por mora.',
  'Late fee has been deleted.': 'Se ha eliminado recargo por mora.',
  'Join fee has been deleted.': 'Se ha eliminado cuota de ingreso.',
  'Exemption has been removed.': 'Se ha removido la exención.',
  'Member set as exempt.': 'Miembro establecido como exento.',
  'Record has been created.': 'Se ha creado el registro.',

  // Club Leagues & Tournaments
  '🏛️ New Team Invitations': '🏛️ Nuevas Invitaciones de Equipo',
  'sent you a team invitation': 'te envió una invitación de equipo',
  'Expires in {{hours}}h': 'Expira en {{hours}}h',
  '🏛️ Send Team Invitation': '🏛️ Enviar Invitación de Equipo',
  '🏛️ Select Partner': '🏛️ Seleccionar Compañero',
  'Send a team invitation to your partner. You can register once they accept.':
    'Envía una invitación de equipo a tu compañero. Podrás registrarte una vez que acepte.',
  'Search partner...': 'Buscar compañero...',
  'Loading partners...': 'Cargando compañeros...',
  'Waiting for league admin approval': 'Esperando aprobación del administrador de liga',
  'Your league participation is confirmed! Matches will start soon':
    '¡Tu participación en la liga está confirmada! Los partidos comenzarán pronto',
  'Your league application was rejected': 'Tu solicitud de liga fue rechazada',
  'Join this league and compete with other players':
    'Únete a esta liga y compite con otros jugadores',
  'League Info': 'Información de Liga',
  "Join the league to compete with other players and improve your tennis skills. You'll need to wait for admin approval after applying.":
    'Únete a la liga para competir con otros jugadores y mejorar tus habilidades de tenis. Necesitarás esperar la aprobación del administrador después de aplicar.',
  'Applying...': 'Aplicando...',
  'Registration is currently closed': 'La inscripción está actualmente cerrada',
  'Application Details': 'Detalles de Solicitud',
  'Applied:': 'Aplicado:',
  'Approved:': 'Aprobado:',
  'Current Status:': 'Estado Actual:',

  // League Detail
  'No pending matches to approve.': 'No hay partidos pendientes por aprobar.',
  'Bulk Approval Failed': 'Error en Aprobación Masiva',
  'All match approvals failed. Please try again.':
    'Todas las aprobaciones de partidos fallaron. Por favor intenta nuevamente.',
  'Remove Participant': 'Remover Participante',
  'Remove "{{userName}}" from the league?': '¿Remover a "{{userName}}" de la liga?',
  '{{userName}} has been removed from the league.': '{{userName}} ha sido removido de la liga.',
  'Admin Correction': 'Corrección Administrativa',
  'Admin Schedule Change': 'Cambio de Horario Administrativo',
  'Admin Walkover': 'WO Administrativo',
  'Semifinals Tournament': 'Torneo de Semifinales',
  'Qualified Teams:': 'Equipos Clasificados:',
  'Qualified Players:': 'Jugadores Clasificados:',
  teams: 'equipos',
  players: 'jugadores',
  'No Name': 'Sin Nombre',
  'Participants Status': 'Estado de Participantes',
  'Teams Status': 'Estado de Equipos',
  Teams: 'Equipos',
  'Max Teams': 'Máximo de Equipos',
  'Start Accepting Applications': 'Comenzar a Aceptar Solicitudes',

  // Create Event
  "Send invitations and app download link to friends who haven't installed the app":
    'Envía invitaciones y enlace de descarga de la app a amigos que no han instalado la aplicación',
  'Send invitations and app download links to friends without the app':
    'Envía invitaciones y enlaces de descarga de la app a amigos sin la aplicación',
  '[Lightning Tennis] {{sender}} invited you to "{{eventTitle}}"! Download app: {{link}}':
    '[Lightning Tennis] ¡{{sender}} te invitó a "{{eventTitle}}"! Descarga la app: {{link}}',
  'A friend': 'Un amigo',
  'Numbers to invite:': 'Números para invitar:',
  'Invite app users or friends via SMS to your {{type}}.':
    'Invita usuarios de la app o amigos vía SMS a tu {{type}}.',
  '{{type}} event notice': 'Aviso de evento {{type}}',
  'Ranked matches are recorded officially and cannot be cancelled.':
    'Los partidos clasificatorios se registran oficialmente y no se pueden cancelar.',
  'Meetups can be modified or cancelled at any time.':
    'Los encuentros se pueden modificar o cancelar en cualquier momento.',
  'SMS Invitation': 'Invitación SMS',
  'Search by name': 'Buscar por nombre',
  'Searching users...': 'Buscando usuarios...',
  'Load Users': 'Cargar Usuarios',
  'Selected ({{count}})': 'Seleccionados ({{count}})',
  '{{month}}/{{day}}/{{year}} {{hours}}:{{minutes}}':
    '{{day}}/{{month}}/{{year}} {{hours}}:{{minutes}}',
  'SMS Error': 'Error SMS',
  'Cannot open SMS app. Please send invitations manually.':
    'No se puede abrir la app de SMS. Por favor envía las invitaciones manualmente.',
  한국어: 'Coreano',

  // Matches
  '2.0-3.0': '2.0-3.0',
  '3.0-4.0': '3.0-4.0',
  '4.0-5.0': '4.0-5.0',
  '5.0+': '5.0+',
  'Title *': 'Título *',
  'Match Type': 'Tipo de Partido',
  'Location *': 'Ubicación *',
  'Date & Time': 'Fecha y Hora',
  4: '4',
  'Create Match': 'Crear Partido',
  'Input Error': 'Error de Entrada',
  'Match Created Successfully!': '¡Partido Creado Exitosamente!',
  'Personal match has been successfully created.\n\n📱 Notifications will be sent to users within {{distance}} miles.':
    'El partido personal ha sido creado exitosamente.\n\n📱 Se enviarán notificaciones a usuarios dentro de {{distance}} millas.',
  'Club match has been successfully created.\n\n📱 Notifications will be sent to users within {{distance}} miles.':
    'El partido del club ha sido creado exitosamente.\n\n📱 Se enviarán notificaciones a usuarios dentro de {{distance}} millas.',
  'Join Match': 'Unirse al Partido',
  Join: 'Unirse',
  'Joined Successfully!': '¡Unido Exitosamente!',
  'Your match participation request has been completed.':
    'Tu solicitud de participación en el partido ha sido completada.',
  Me: 'Yo',

  // Create Club Tournament
  'Create Tournament': 'Crear Torneo',
  '1 Set': '1 Set',
  'Single set match': 'Partido de un solo set',
  '3 Sets': '3 Sets',
  'Best of 2 sets': 'Mejor de 2 sets',
  '5 Sets': '5 Sets',
  'Best of 3 sets': 'Mejor de 3 sets',
  Manual: 'Manual',
  'Admin assigns seeds manually': 'El administrador asigna cabezas de serie manualmente',
  'Fair random seeding (skill-independent)': 'Sorteo aleatorio justo (independiente de habilidad)',
  'Seeds based on club ranking and win rate':
    'Cabezas de serie basadas en ranking del club y tasa de victoria',
  'Personal Rating': 'Clasificación Personal',
  'Seeds based on ELO rating and skill level':
    'Cabezas de serie basadas en clasificación ELO y nivel de habilidad',
  'Male 1v1 match': 'Partido masculino 1v1',
  'Female 1v1 match': 'Partido femenino 1v1',
  'Male 2v2 match': 'Partido masculino 2v2',
  'Female 2v2 match': 'Partido femenino 2v2',
  'Mixed gender 2v2 match': 'Partido mixto 2v2',
  'Application deadline must be on or before start date':
    'La fecha límite de solicitud debe ser en o antes de la fecha de inicio',
  'End date must be on or after start date':
    'La fecha de finalización debe ser en o después de la fecha de inicio',

  // Score Confirmation
  'Submitted Score': 'Resultado Enviado',
  'Score submitted by {{name}}': 'Resultado enviado por {{name}}',
  'Submitted At': 'Enviado en',
  'League Match': 'Partido de Liga',
  'Lightning Match': 'Partido Lightning',
  'Retired in set {{set}}': 'Retirado en set {{set}}',
  'Is the score accurate?': '¿Es el resultado correcto?',
  'I agree': 'Estoy de acuerdo',
  'The score is accurate and I confirm the match result':
    'El resultado es correcto y confirmo el resultado del partido',
  'I disagree': 'No estoy de acuerdo',
  'The score is incorrect or there is an issue': 'El resultado es incorrecto o hay un problema',
  'Reason for disagreement': 'Razón del desacuerdo',
  'An administrator will review your reason and finalize the score.':
    'Un administrador revisará tu razón y finalizará el resultado.',
  'Important Notes': 'Notas Importantes',
  '• Agreeing to the score will finalize the match result\n• Disagreeing will escalate the issue to an administrator\n• False reports or malicious disputes may result in sanctions':
    '• Aceptar el resultado finalizará el resultado del partido\n• No estar de acuerdo escalará el problema a un administrador\n• Reportes falsos o disputas maliciosas pueden resultar en sanciones',
  'Confirm Score': 'Confirmar Resultado',
  'Submit Dispute': 'Enviar Disputa',
  'An error occurred while processing your confirmation.':
    'Ocurrió un error al procesar tu confirmación.',

  // Schedules
  'Schedule Title *': 'Título de Horario *',
  'Schedule Type': 'Tipo de Horario',
  'Day of Week *': 'Día de la Semana *',
  'Start Time *': 'Hora de Inicio *',
  'Duration (minutes) *': 'Duración (minutos) *',
  'Location Information': 'Información de Ubicación',
  'Location Name *': 'Nombre de Ubicación *',
  'Address *': 'Dirección *',
  Directions: 'Indicaciones',
  'Parking info, entrance location, etc.':
    'Información de estacionamiento, ubicación de entrada, etc.',
  'Court Type': 'Tipo de Cancha',
  Indoor: 'Interior',
  Outdoor: 'Exterior',
  Both: 'Ambos',
  'Participation Information': 'Información de Participación',
  'Min Participants': 'Mínimo de Participantes',
  'Members Only': 'Solo Miembros',
  'Registration Deadline (hours before)': 'Fecha Límite de Inscripción (horas antes)',

  // Role Management
  'Role Statistics': 'Estadísticas de Roles',
  '💡 Managers have access to all management features except club deletion.':
    '💡 Los gerentes tienen acceso a todas las funciones de gestión excepto la eliminación del club.',
  '🔄 Transfer Admin': '🔄 Transferir Administrador',
  'Transfer club admin privileges to another manager.':
    'Transferir privilegios de administrador del club a otro gerente.',
  'Transfer Admin': 'Transferir Administrador',
  'Change Roles': 'Cambiar Roles',
  '🔄 Select New Admin': '🔄 Seleccionar Nuevo Administrador',
  'Loading manager list...': 'Cargando lista de gerentes...',
  'No eligible managers available.\nPlease assign managers first.':
    'No hay gerentes elegibles disponibles.\nPor favor asigna gerentes primero.',
  'Confirm Transfer': 'Confirmar Transferencia',
  'Confirm Admin Transfer': 'Confirmar Transferencia de Administrador',
  "Transfer club admin privileges to '{{name}}'?\n\n⚠️ You will be changed to a manager after transfer.":
    "¿Transferir privilegios de administrador del club a '{{name}}'?\n\n⚠️ Serás cambiado a gerente después de la transferencia.",
  "'{{name}}' is now the new club admin.": "'{{name}}' es ahora el nuevo administrador del club.",
  'An error occurred during admin transfer.':
    'Ocurrió un error durante la transferencia de administrador.',

  // Empty strings
  '': '',
};

// Deep replace function that handles nested objects
function deepReplace(obj, dict) {
  if (typeof obj === 'string') {
    return dict[obj] !== undefined ? dict[obj] : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepReplace(item, dict));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const key in obj) {
      result[key] = deepReplace(obj[key], dict);
    }
    return result;
  }

  return obj;
}

// Find untranslated keys and apply manual translations
function findAndTranslate(enObj, esObj, dict, currentPath = '', results = {}) {
  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      results[key] = results[key] || {};
      findAndTranslate(enObj[key], esObj[key] || {}, dict, fullPath, results[key]);
    } else {
      if (esObj[key] === enObj[key]) {
        const translated = dict[enObj[key]];
        if (translated !== undefined) {
          results[key] = translated;
        }
      }
    }
  }

  return results;
}

// Deep merge
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key]) {
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

// Count untranslated
function countUntranslated(enObj, esObj) {
  let count = 0;

  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], esObj[key] || {});
    } else {
      if (esObj[key] === enObj[key]) {
        count++;
      }
    }
  }

  return count;
}

// Main execution
console.log('🌍 Final Manual Spanish Translation');
console.log('===================================\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys before: ${beforeCount}\n`);

// Find and translate using manual dictionary
const translations = findAndTranslate(en, es, manualTranslations);

// Merge with existing Spanish translations
const updated = deepMerge(es, translations);

// Count after
const afterCount = countUntranslated(en, updated);
const translated = beforeCount - afterCount;

console.log(`✅ Keys translated: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

if (translated > 0) {
  // Save updated translations
  fs.writeFileSync(ES_PATH, JSON.stringify(updated, null, 2), 'utf8');
  console.log('💾 Spanish translations saved to es.json\n');
  console.log('✨ Manual translation complete!');
  console.log(`📈 Progress: ${((translated / beforeCount) * 100).toFixed(1)}% translated\n`);

  if (afterCount > 0) {
    console.log(`⚠️  ${afterCount} keys still need translation`);
    console.log('Run: node scripts/extract-untranslated.js to see remaining keys');
  } else {
    console.log('🎉 ALL KEYS TRANSLATED!');
  }
} else {
  console.log('⚠️  No new translations applied.');
}
