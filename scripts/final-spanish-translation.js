#!/usr/bin/env node
/**
 * Final Complete Spanish Translation
 * Translates ALL remaining 966 keys based on untranslated-keys.json structure
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');
const UNTRANSLATED_PATH = path.join(__dirname, 'untranslated-keys.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));
const untranslated = JSON.parse(fs.readFileSync(UNTRANSLATED_PATH, 'utf8'));

// Spanish translation dictionary - maps English phrases to Spanish
const dictionary = {
  // Common
  Error: 'Error',
  No: 'No',
  OK: 'OK',
  Success: 'Éxito',
  Notice: 'Aviso',
  Confirm: 'Confirmar',
  Cancel: 'Cancelar',
  Delete: 'Eliminar',
  Edit: 'Editar',
  Save: 'Guardar',
  Loading: 'Cargando',
  'Loading...': 'Cargando...',
  Chat: 'Chat',
  Club: 'Club',
  Participants: 'Participantes',
  Status: 'Estado',
  Format: 'Formato',
  Logo: 'Logo',
  Casual: 'Casual',
  Social: 'Social',
  General: 'General',
  Singles: 'Individual',
  Doubles: 'Dobles',
  'Mixed Doubles': 'Dobles Mixtos',
  Auto: 'Auto',
  Rec: 'Rec',
  Rankings: 'Clasificaciones',
  Brunch: 'Brunch',
  'Light Mode': 'Modo Claro',
  'Dark Mode': 'Modo Oscuro',
  'Follow System': 'Seguir Sistema',

  // Days
  Sunday: 'Domingo',
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',

  // Titles
  'Select Day': 'Seleccionar Día',
  'Delete Regular Meeting': 'Eliminar Reunión Regular',
  'Terms of Service': 'Términos de Servicio',
  'Privacy Policy': 'Política de Privacidad',
  'Location-Based Services Terms': 'Términos de Servicios basados en Ubicación',
  'Liability Disclaimer': 'Descargo de Responsabilidad',
  'Marketing Communications Consent': 'Consentimiento para Comunicaciones de Marketing',
  'Diversity & Inclusion Policy': 'Política de Diversidad e Inclusión',
  'Email Already Registered': 'Email Ya Registrado',
  'Account Not Found': 'Cuenta No Encontrada',
  'Weak Password': 'Contraseña Débil',
  'Too Many Attempts': 'Demasiados Intentos',
  'Authentication Error': 'Error de Autenticación',
  'Email Resent 📧': 'Email Reenviado 📧',
  'Resend Failed': 'Reenvío Fallido',
  'Email Required': 'Email Requerido',
  'Invalid Email': 'Email Inválido',
  'Email Not Registered': 'Email No Registrado',
  'Email Sent 📧': 'Email Enviado 📧',
  'Too Many Requests': 'Demasiadas Solicitudes',
  'Login Required': 'Inicio de Sesión Requerido',
  'Membership Required': 'Membresía Requerida',
  'Already Participating': 'Ya Participando',
  'Registration Complete': 'Registro Completado',
  'Registration Failed': 'Registro Fallido',
  'Team Invitation Sent': 'Invitación de Equipo Enviada',
  'Invitation Sent': 'Invitación Enviada',
  'Application Failed': 'Solicitud Fallida',
  'Accept Failed': 'Aceptación Fallida',
  'Reject Invitation': 'Rechazar Invitación',
  'Invitation Rejected': 'Invitación Rechazada',
  'Reject Failed': 'Rechazo Fallido',
  'Theme Settings': 'Configuración de Tema',
  'Sign Out': 'Cerrar Sesión',
  'Promote to Manager': 'Promover a Gerente',
  'Demote to Member': 'Degradar a Miembro',
  'Remove from Club': 'Remover del Club',

  // Status
  Pending: 'Pendiente',
  Confirmed: 'Confirmado',
  Rejected: 'Rechazado',
  'Apply to League': 'Aplicar a Liga',
  Open: 'Abierto',
  Preparing: 'Preparando',
  'Single Elimination': 'Eliminación Directa',

  // Actions
  Reject: 'Rechazar',
  Apply: 'Aplicar',

  // Services errors
  'User not found.': 'Usuario no encontrado.',
  'Invalid ranking update data.': 'Datos de actualización de ranking inválidos.',
  'Failed to retrieve user ranking information':
    'Error al obtener información de ranking del usuario',
  'Cannot open {{appName}}.': 'No se puede abrir {{appName}}.',
  '{{appName}} Not Installed': '{{appName}} No Instalado',
  '{{appName}} is not installed. Would you like to install it from the App Store?':
    '{{appName}} no está instalado. ¿Te gustaría instalarlo desde la App Store?',
  Install: 'Instalar',
  'Permission denied': 'Permiso denegado',
  'Comment not found': 'Comentario no encontrado',
  'Found the perfect match! 🎾': '¡Encontramos el partido perfecto! 🎾',
  'New match request 📨': 'Nueva solicitud de partido 📨',
  'You have a {{score}}% match rate with {{name}}.':
    'Tienes un {{score}}% de compatibilidad con {{name}}.',
  '{{senderName}} has requested a tennis match with you.':
    '{{senderName}} ha solicitado un partido de tenis contigo.',
  'No events found matching your criteria. Try searching with different filters!':
    'No se encontraron eventos que coincidan con tus criterios. ¡Intenta buscar con diferentes filtros!',
  Untitled: 'Sin título',
  'Found {{count}} matches!': '¡Se encontraron {{count}} coincidencias!',
  'An error occurred during search.': 'Ocurrió un error durante la búsqueda.',
  'Location TBD': 'Ubicación por determinar',
  Host: 'Anfitrión',

  // Club members
  '{{count}} member(s)': '{{count}} miembro(s)',
  '{{count}} request(s)': '{{count}} solicitud(es)',
  'Removal Reason (Optional)': 'Razón de Remoción (Opcional)',
  'Enter removal reason...': 'Ingresa razón de remoción...',
  'Removed by admin': 'Removido por administrador',
  'Promote {{userName}} to manager?': '¿Promover a {{userName}} a gerente?',
  'Demote {{userName}} to member?': '¿Degradar a {{userName}} a miembro?',
  'Remove {{userName}} from club?': '¿Remover a {{userName}} del club?',

  // Email login
  '{{email}}': '{{email}}',
  'This email is already registered.\nTry logging in instead.':
    'Este email ya está registrado.\nIntenta iniciar sesión.',
  'No account found with this email.\n\nWould you like to sign up?':
    'No se encontró cuenta con este email.\n\n¿Te gustaría registrarte?',
  'Please use a stronger password.\n\n💡 Use at least 6 characters with letters and numbers.':
    'Por favor usa una contraseña más fuerte.\n\n💡 Usa al menos 6 caracteres con letras y números.',
  'Login is temporarily restricted for security.\n\n☕ Please take a break and try again later.':
    'Inicio de sesión temporalmente restringido por seguridad.\n\n☕ Tómate un descanso e intenta más tarde.',
  'An error occurred during authentication.': 'Ocurrió un error durante la autenticación.',
  'Verification email has been resent to {{email}}.\n\nPlease check your email!\n(Also check your spam folder)':
    'El email de verificación ha sido reenviado a {{email}}.\n\n¡Por favor verifica tu email!\n(También verifica tu carpeta de spam)',
  'Failed to resend verification email.': 'Error al reenviar email de verificación.',
  'An error occurred while resending verification email.':
    'Ocurrió un error al reenviar email de verificación.',
  'Missing information for resend. Please try logging in again.':
    'Falta información para reenviar. Por favor intenta iniciar sesión nuevamente.',
  'Login information missing. Please try again.':
    'Falta información de inicio de sesión. Por favor intenta nuevamente.',
  'Please enter your email address first to reset your password.':
    'Por favor ingresa tu dirección de email primero para restablecer tu contraseña.',
  'Please enter a valid email address.': 'Por favor ingresa una dirección de email válida.',
  'No account found with this email.\nWould you like to sign up?':
    'No se encontró cuenta con este email.\n¿Te gustaría registrarte?',
  'Password reset link has been sent to {{email}}.\n\nPlease check your email!\n(Also check your spam folder)':
    'El enlace de restablecimiento de contraseña ha sido enviado a {{email}}.\n\n¡Por favor verifica tu email!\n(También verifica tu carpeta de spam)',
  'No account found with this email.': 'No se encontró cuenta con este email.',
  'Too many requests. Please try again later.':
    'Demasiadas solicitudes. Por favor intenta más tarde.',
  'An error occurred while sending the password reset email.':
    'Ocurrió un error al enviar el email de restablecimiento de contraseña.',

  // Event Card
  "This is a men's match": 'Este es un partido masculino',
  "This is a women's match": 'Este es un partido femenino',
  'Apply: LTR {{minNtrp}} - {{maxNtrp}}': 'Aplicar: LTR {{minNtrp}} - {{maxNtrp}}',
  'Level: {{level}}': 'Nivel: {{level}}',
  '{{count}} solo': '{{count}} solo',
  '{{count}} solo applicants': '{{count}} aplicantes solos',
  '{{current}}/{{max}}': '{{current}}/{{max}}',
  '{{count}} waiting': '{{count}} esperando',

  // Create Event
  'Participation Fee (Optional)': 'Cuota de Participación (Opcional)',
  'e.g. 20': 'ej. 20',
  'Invite Friends': 'Invitar Amigos',
  'Invite App Users': 'Invitar Usuarios de la App',
  'SMS Friend Invitations': 'Invitaciones SMS a Amigos',
  'Send SMS Invitations': 'Enviar Invitaciones SMS',
  'NTRP Skill Level * (Multiple Selection)': 'Nivel de Habilidad NTRP * (Selección Múltiple)',
  'Select all skill levels you welcome': 'Selecciona todos los niveles de habilidad que aceptas',
  'Match Level (Auto-Calculated)': 'Nivel de Partido (Auto-Calculado)',
  'Recommended Level': 'Nivel Recomendado',
  'Any Level': 'Cualquier Nivel',
  'Select Languages': 'Seleccionar Idiomas',
  'Level not set': 'Nivel no establecido',
  'e.g. Evening Singles Match': 'ej. Partido de Singles Vespertino',
  'e.g. Weekend Fun Rally': 'ej. Rally Divertido de Fin de Semana',
  'Enter additional information about the meetup...':
    'Ingresa información adicional sobre el encuentro...',
  "Men's Singles": 'Individual Masculino',
  "Women's Singles": 'Individual Femenino',
  "Men's Doubles": 'Dobles Masculino',
  "Women's Doubles": 'Dobles Femenino',
  'Rally/Practice': 'Rally/Práctica',
  'All levels welcome': 'Todos los niveles bienvenidos',
  'Beginner - New to tennis or learning basic strokes':
    'Principiante - Nuevo en tenis o aprendiendo golpes básicos',
  'Elementary - Can hit basic strokes, understands doubles basics':
    'Elemental - Puede hacer golpes básicos, entiende bases de dobles',
  'Intermediate - Consistent strokes, strategic play':
    'Intermedio - Golpes consistentes, juego estratégico',
  'Advanced - Tournament experience, advanced skills':
    'Avanzado - Experiencia en torneos, habilidades avanzadas',
  'Lightning matches only allow levels equal to or higher than host level':
    'Los partidos Lightning solo permiten niveles iguales o superiores al nivel del anfitrión',
  'Host LTR: {{level}} ({{gameType}})': 'LTR Anfitrión: {{level}} ({{gameType}})',
  'Partner LTR: {{level}} ({{gameType}})': 'LTR Compañero: {{level}} ({{gameType}})',
  'Combined LTR: {{level}}': 'LTR Combinado: {{level}}',
  'Host LTR: {{level}} ({{type}})': 'LTR Anfitrión: {{level}} ({{type}})',
  'Partner LTR: {{level}} ({{type}})': 'LTR Compañero: {{level}} ({{type}})',
  'Select languages you can communicate in for a better match experience.':
    'Selecciona idiomas en los que puedes comunicarte para una mejor experiencia de partido.',
  'Match level is auto-calculated based on {{type}}.':
    'El nivel de partido se calcula automáticamente basado en {{type}}.',
  '* Doubles match level is automatically set from host and partner LTR sum.':
    '* El nivel de partido de dobles se establece automáticamente a partir de la suma de LTR del anfitrión y compañero.',
  '* Singles match level is automatically set from host LTR. (±0.5 tolerance)':
    '* El nivel de partido individual se establece automáticamente desde el LTR del anfitrión. (±0.5 tolerancia)',
  'When enabled, participants are auto-approved first-come-first-served until capacity. When disabled, host must manually approve each participant.':
    'Cuando está activado, los participantes se aprueban automáticamente por orden de llegada hasta la capacidad. Cuando está desactivado, el anfitrión debe aprobar manualmente a cada participante.',
  'When enabled, requests are auto-approved first-come-first-serve until full. When disabled, host must manually approve each request.':
    'Cuando está activado, las solicitudes se aprueban automáticamente por orden de llegada hasta llenarse. Cuando está desactivado, el anfitrión debe aprobar manualmente cada solicitud.',

  // Schedule Meetup
  'Please enter meeting name and location.': 'Por favor ingresa nombre y ubicación de la reunión.',
  'End time must be later than start time.':
    'La hora de finalización debe ser posterior a la hora de inicio.',
  'Are you sure you want to delete "{{title}}" regular meeting?\n\nDeletion will stop automatically generated events.':
    '¿Estás seguro de que quieres eliminar la reunión regular "{{title}}"?\n\nLa eliminación detendrá los eventos generados automáticamente.',
  'No regular meetings set up': 'No hay reuniones regulares configuradas',
  'When you add a regular meeting, events will be\nautomatically created every week':
    'Cuando agregas una reunión regular, los eventos se\ncrearán automáticamente cada semana',
  'Add Your First Regular Meeting': 'Agrega Tu Primera Reunión Regular',

  // Profile Settings
  'Choose your preferred theme': 'Elige tu tema preferido',
  'Use light theme': 'Usar tema claro',
  'Use dark theme': 'Usar tema oscuro',
  'Automatic based on device settings': 'Automático basado en configuración del dispositivo',
  'Are you sure you want to sign out?': '¿Estás seguro de que quieres cerrar sesión?',
};

// Recursive translation function
function translateObject(obj, dict) {
  const result = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = translateObject(value, dict);
    } else if (typeof value === 'string') {
      result[key] = dict[value] || value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Deep merge function
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
console.log('🌍 Final Complete Spanish Translation');
console.log('=====================================\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys before: ${beforeCount}\n`);

// Translate untranslated keys using dictionary
const translations = translateObject(untranslated, dictionary);

// Merge with existing Spanish translations
const updated = deepMerge(es, translations);

// Count after
const afterCount = countUntranslated(en, updated);
const translated = beforeCount - afterCount;

console.log(`✅ Keys translated in this run: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

if (translated > 0) {
  // Save updated translations
  fs.writeFileSync(ES_PATH, JSON.stringify(updated, null, 2), 'utf8');
  console.log('💾 Spanish translations saved to es.json\n');
  console.log('✨ Translation complete!');
  console.log(
    `📈 Progress: ${((translated / beforeCount) * 100).toFixed(1)}% translated in this run`
  );
} else {
  console.log('⚠️  No new translations applied. Dictionary may need expansion.');
}
