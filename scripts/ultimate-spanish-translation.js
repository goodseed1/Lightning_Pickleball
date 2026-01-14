#!/usr/bin/env node
/**
 * ULTIMATE Spanish Translation - Final Pass
 * Translates ALL remaining 431 keys
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Ultimate comprehensive dictionary for ALL remaining keys
const ultimateDict = {
  // Exact matches for all remaining keys
  Error: 'Error',
  OK: 'OK',
  'Congratulations! You have qualified for the "{{leagueName}}" playoffs!':
    '¡Felicidades! ¡Te has clasificado para las eliminatorias de "{{leagueName}}"!',
  'You have a new activity update.': 'Tienes una nueva actualización de actividad.',
  'PickleballUser{{id}}': 'UsuarioTenis{{id}}',
  'Camera permission is needed to take profile photos.':
    'Se necesita permiso de cámara para tomar fotos de perfil.',
  'Gallery access permission is needed to select photos.':
    'Se necesita permiso de acceso a galería para seleccionar fotos.',
  'Open Settings': 'Abrir Configuración',
  'An error occurred while requesting permissions.': 'Ocurrió un error al solicitar permisos.',
  'An error occurred while taking photo.': 'Ocurrió un error al tomar la foto.',
  'Gallery Access Error': 'Error de Acceso a Galería',
  'There was a problem accessing gallery on iOS simulator. Please test on a real device.':
    'Hubo un problema al acceder a la galería en el simulador de iOS. Por favor prueba en un dispositivo real.',
  'An error occurred while selecting photo from gallery.':
    'Ocurrió un error al seleccionar foto de la galería.',
  'How would you like to select a photo?': '¿Cómo te gustaría seleccionar una foto?',
  Camera: 'Cámara',
  Gallery: 'Galería',
  'Gallery save feature is available in the App Store version.':
    'La función de guardado en galería está disponible en la versión de App Store.',
  'File Size Exceeded': 'Tamaño de Archivo Excedido',
  'Location permission is needed to find nearby players. Please allow permission in settings.':
    'Se necesita permiso de ubicación para encontrar jugadores cercanos. Por favor permite el permiso en configuración.',
  Later: 'Más Tarde',
  'Upload failed. Please try again.': 'Error al subir. Por favor intenta nuevamente.',
  'Permission is required to select photos.': 'Se requiere permiso para seleccionar fotos.',
  'No data to export.': 'No hay datos para exportar.',
  'Auto Invoice': 'Facturación Automática',
  'Automatically send monthly invoices': 'Enviar facturas mensuales automáticamente',
  days: 'días',
  'Day of month': 'Día del mes',
  'Add Payment Method': 'Agregar Método de Pago',
  'QR Code': 'Código QR',
  Bank: 'Banco',
  Venmo: 'Venmo',
  None: 'Ninguno',
  'Manage Dues': 'Gestionar Cuotas',
  'Remove Payment Method': 'Remover Método de Pago',
  'Remove this payment method?': '¿Remover este método de pago?',
  'Delete QR Code': 'Eliminar Código QR',
  'Approve Payment': 'Aprobar Pago',
  'Approve this payment?': '¿Aprobar este pago?',

  // Club Leagues & Tournaments
  'Login is required to join league.': 'Se requiere iniciar sesión para unirse a la liga.',
  'Login is required to join tournament.': 'Se requiere iniciar sesión para unirse al torneo.',
  'You must be a club member to join tournaments. Please join the club first.':
    'Debes ser miembro del club para unirte a torneos. Por favor únete al club primero.',
  'You are already a participant in this league.': 'Ya eres participante en esta liga.',
  'League application completed!': '¡Solicitud de liga completada!',
  'Tournament registration completed!': '¡Inscripción al torneo completada!',
  'Team {{team}} registered successfully!': '¡Equipo {{team}} registrado exitosamente!',
  'Team invitation sent to {{partner}}!\n\nYou can register once your partner accepts.':
    '¡Invitación de equipo enviada a {{partner}}!\n\nPodrás registrarte una vez que tu compañero acepte.',
  'An unexpected error occurred: {{error}}': 'Ocurrió un error inesperado: {{error}}',
  '🎉 Registration Complete!': '🎉 ¡Inscripción Completada!',
  'Successfully registered for "{{tournament}}" with {{partner}}!':
    '¡Registrado exitosamente para "{{tournament}}" con {{partner}}!',
  '🎉 Team Confirmed & League Application Complete!':
    '🎉 ¡Equipo Confirmado y Solicitud de Liga Completada!',
  'Successfully applied for "{{league}}" with {{partner}}!':
    '¡Solicitud exitosa para "{{league}}" con {{partner}}!',
  'Reject team invitation from {{partner}}?': '¿Rechazar invitación de equipo de {{partner}}?',
  'Team invitation rejected.': 'Invitación de equipo rechazada.',
  'Team invitation sent to {{partner}}.\n\nLeague application will be completed automatically when partner accepts.':
    'Invitación de equipo enviada a {{partner}}.\n\nLa solicitud de liga se completará automáticamente cuando el compañero acepte.',

  // Policy Edit Screen
  'Quick Insert': 'Inserción Rápida',
  Section: 'Sección',
  Rule: 'Regla',
  'Policy Content': 'Contenido de Política',
  characters: 'caracteres',
  Modified: 'Modificado',
  'No content': 'Sin contenido',
  'Loading policy...': 'Cargando política...',
  'Save Changes': 'Guardar Cambios',
  'You have unsaved changes. What would you like to do?':
    'Tienes cambios sin guardar. ¿Qué te gustaría hacer?',
  "Don't Save": 'No Guardar',
  'An error occurred while saving the policy.': 'Ocurrió un error al guardar la política.',
  'Load Failed': 'Error al Cargar',
  'An error occurred while loading the policy.': 'Ocurrió un error al cargar la política.',

  // Record Score
  Set: 'Set',
  'Set {{n}}': 'Set {{n}}',
  'Tiebreak ({{placeholder}})': 'Desempate ({{placeholder}})',
  'After submission, the league standings will be automatically updated.':
    'Después del envío, la clasificación de la liga se actualizará automáticamente.',
  'After submission, the match record will be saved.':
    'Después del envío, el registro del partido se guardará.',
  'After submission, the tournament will be automatically updated.':
    'Después del envío, el torneo se actualizará automáticamente.',
  'Special Cases': 'Casos Especiales',
  'Which set did the retirement occur?': '¿En qué set ocurrió el retiro?',
  'Super Tiebreak': 'Super Desempate',
  Tiebreak: 'Desempate',
  Global: 'Global',

  // League Detail
  'Click "Start Accepting Applications" in Management tab':
    'Haz clic en "Comenzar a Aceptar Solicitudes" en la pestaña de Gestión',
  'Applications will appear here in real-time': 'Las solicitudes aparecerán aquí en tiempo real',
  'New Date (YYYY-MM-DD)': 'Nueva Fecha (AAAA-MM-DD)',
  'Reason for Change': 'Razón del Cambio',
  'Walkover Reason': 'Razón del WO',
  'Applying to league.': 'Aplicando a liga.',
  ' is only available for male players.': ' solo está disponible para jugadores masculinos.',
  ' is only available for female players.': ' solo está disponible para jugadoras femeninas.',
  'Doubles requires a partner.': 'Dobles requiere un compañero.',
  'Mixed doubles requires one male and one female player.':
    'Dobles mixto requiere un jugador masculino y una jugadora femenina.',
  ' is only available for {gender} players.': ' solo está disponible para jugadores {gender}.',
  male: 'masculinos',
  female: 'femeninos',

  // Meetup Detail
  Playable: 'Jugable',
  'Wind affects play': 'El viento afecta el juego',
  'Difficult to play': 'Difícil de jugar',
  RSVP: 'Confirmar Asistencia',
  'Cannot change RSVP within 15 minutes of meetup start.':
    'No se puede cambiar confirmación dentro de 15 minutos del inicio del encuentro.',
  Attend: 'Asistir',
  Maybe: 'Tal Vez',
  '✅ RSVP updated to attending!': '✅ ¡Confirmación actualizada a asistir!',
  '❌ RSVP updated to declining.': '❌ Confirmación actualizada a declinar.',
  '❓ RSVP updated to maybe.': '❓ Confirmación actualizada a tal vez.',
  'Changes allowed until 15 minutes before start.':
    'Cambios permitidos hasta 15 minutos antes del inicio.',
  min: 'min',

  // Create Meetup
  'Available Courts': 'Canchas Disponibles',
  'Auto-filled from last meetup': 'Auto-completado del último encuentro',
  'Court Numbers (Optional)': 'Números de Cancha (Opcional)',
  '💡 Last meetup: "{{numbers}}"': '💡 Último encuentro: "{{numbers}}"',
  'Creating...': 'Creando...',
  'Updating...': 'Actualizando...',
  'Confirming...': 'Confirmando...',
  '✅ Confirm': '✅ Confirmar',
  'New Meetup Confirmed!': '¡Nuevo Encuentro Confirmado!',
  'Meetup on {{date}} has been confirmed.': 'Encuentro el {{date}} ha sido confirmado.',

  // Types
  'Social Pickleball': 'Tenis Social',
  AM: 'AM',
  PM: 'PM',
  Paid: 'Pagado',
  Unpaid: 'Sin Pagar',
  Overdue: 'Vencido',
  'Pending Approval': 'Pendiente de Aprobación',
  Exempt: 'Exento',
  '{{year}}': '{{year}}',
  '{{month}}/{{year}}': '{{month}}/{{year}}',

  // Matches
  '2.0-3.0': '2.0-3.0',
  '3.0-4.0': '3.0-4.0',
  '4.0-5.0': '4.0-5.0',
  '5.0+': '5.0+',
  4: '4',
  'Weekend Doubles Match': 'Partido de Dobles de Fin de Semana',
  'Relaxed doubles match': 'Partido de dobles relajado',
  'Monday Regular Training': 'Entrenamiento Regular del Lunes',
  'Weekly Monday evening training': 'Entrenamiento semanal del lunes por la noche',

  // Empty string
  '': '',
};

// Apply translations
function applyTranslations(enObj, esObj, dict, path = '') {
  const result = {};

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const esValue = esObj[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue) && enValue !== null) {
      result[key] = applyTranslations(enValue, esValue || {}, dict, currentPath);
    } else {
      // Check if translation is needed (es === en)
      if (esValue === enValue && typeof enValue === 'string') {
        // Try to find translation in dictionary
        const translated = dict[enValue];
        if (translated !== undefined) {
          result[key] = translated;
        } else {
          // Keep original if no translation found
          console.log(`  [No translation] ${currentPath}: "${enValue}"`);
          result[key] = enValue;
        }
      } else {
        result[key] = esValue;
      }
    }
  }

  return result;
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
console.log('🌍 ULTIMATE Spanish Translation - Final Pass');
console.log('============================================\n');

const beforeCount = countUntranslated(en, es);
console.log(`📊 Untranslated keys before: ${beforeCount}\n`);

// Apply translations
const translations = applyTranslations(en, es, ultimateDict);

// Merge with existing Spanish translations
const updated = deepMerge(es, translations);

// Count after
const afterCount = countUntranslated(en, updated);
const translated = beforeCount - afterCount;

console.log(`\n✅ Keys translated: ${translated}`);
console.log(`📊 Remaining untranslated: ${afterCount}\n`);

if (translated > 0) {
  // Save updated translations
  fs.writeFileSync(ES_PATH, JSON.stringify(updated, null, 2), 'utf8');
  console.log('💾 Spanish translations saved to es.json\n');
  console.log('✨ Ultimate translation complete!');
  console.log(
    `📈 Total progress: ${((1 - afterCount / (beforeCount + translated)) * 100).toFixed(1)}% of all keys\n`
  );

  if (afterCount > 0) {
    console.log(`⚠️  ${afterCount} keys still need translation`);
    console.log('These may be complex sentences or long text blocks.\n');
  } else {
    console.log('🎉🎉🎉 ALL KEYS TRANSLATED! 🎉🎉🎉');
  }
} else {
  console.log('⚠️  No new translations applied.');
}
