#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ES_PATH = path.join(__dirname, '../src/locales/es.json');

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
let es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));

// Massive final dictionary covering ALL remaining patterns
const finalDict = {
  // Performance Analytics & Leaderboard
  'Maintain your current playing style': 'Mantén tu estilo de juego actual',
  'Try playing against higher-level opponents': 'Intenta jugar contra oponentes de nivel más alto',
  'Need to Increase Playing Frequency': 'Necesitas Aumentar la Frecuencia de Juego',
  'With an average of {{frequency}} plays per week, playing more frequently can help improve your skills.':
    'Con un promedio de {{frequency}} partidos por semana, jugar más frecuentemente puede ayudar a mejorar tus habilidades.',
  'Set a regular practice schedule': 'Establece un horario regular de práctica',
  'Set weekly playing goals': 'Establece metas semanales de juego',
  'Best Playing Time': 'Mejor Horario de Juego',
  'Your best performance is during {{timeSlot}} time slots.':
    'Tu mejor rendimiento es durante el horario {{timeSlot}}.',
  'Schedule more matches during this time': 'Programa más partidos durante este horario',
  'Analyze what makes this time slot work for you':
    'Analiza qué hace que este horario funcione para ti',
  'Matches Completed': 'Partidos Completados',
  'Win Rate Achieved': 'Tasa de Victoria Lograda',
  'Best Win Streak': 'Mejor Racha de Victorias',
  'Serve Speed': 'Velocidad de Saque',
  'Backhand Stability': 'Estabilidad de Revés',
  'Net Play': 'Juego en Red',
  'Target Win Rate': 'Tasa de Victoria Objetivo',
  'Practice Frequency Goal': 'Meta de Frecuencia de Práctica',
  'Play with New Partners': 'Jugar con Nuevos Compañeros',
  'Weekly Match Challenge': 'Desafío de Partidos Semanales',
  'Complete 5 matches this week': 'Completa 5 partidos esta semana',
  '100 points + "Weekly Warrior" badge': '100 puntos + insignia "Guerrero Semanal"',
  'Win Streak Challenge': 'Desafío de Racha de Victorias',
  'Achieve 3 consecutive wins': 'Logra 3 victorias consecutivas',
  '200 points + "Striker" badge': '200 puntos + insignia "Goleador"',
  'Monthly Improvement': 'Mejora Mensual',
  'Improve skill level by 5 points': 'Mejora nivel de habilidad en 5 puntos',
  '500 points + "Improvement King" badge': '500 puntos + insignia "Rey de la Mejora"',
  'Social Player': 'Jugador Social',
  'Match with 10 new opponents': 'Juega con 10 oponentes nuevos',
  '300 points + "Social Butterfly" badge': '300 puntos + insignia "Mariposa Social"',
  'First Win': 'Primera Victoria',
  'Win your first match': 'Gana tu primer partido',
  '3-Win Streak': 'Racha de 3 Victorias',
  'Win 3 matches in a row': 'Gana 3 partidos seguidos',
  '5-Win Streak': 'Racha de 5 Victorias',
  'Win 5 matches in a row': 'Gana 5 partidos seguidos',
  'Win Collector': 'Coleccionista de Victorias',
  'Achieve 10 total wins': 'Logra 10 victorias totales',
  'Win Master': 'Maestro de Victorias',
  'Achieve 50 total wins': 'Logra 50 victorias totales',
  'Getting Experience': 'Ganando Experiencia',
  'Complete 10 total matches': 'Completa 10 partidos totales',
  'Veteran Player': 'Jugador Veterano',
  'Complete 100 total matches': 'Completa 100 partidos totales',
  'Skilled Player': 'Jugador Hábil',
  'Reach skill level 70': 'Alcanza nivel de habilidad 70',
  Expert: 'Experto',
  'Reach skill level 85': 'Alcanza nivel de habilidad 85',
  'Match with 20 different players': 'Juega con 20 jugadores diferentes',
  'Monthly Active Player': 'Jugador Activo Mensual',
  'Play 15 or more matches in a month': 'Juega 15 o más partidos en un mes',
  'Early Bird': 'Madrugador',
  'Complete 10 matches before 10 AM': 'Completa 10 partidos antes de las 10 AM',
  'Night Owl': 'Noctámbulo',
  'Complete 10 matches after 8 PM': 'Completa 10 partidos después de las 8 PM',
  'Overall Ranking': 'Clasificación General',
  'Ranking based on total performance': 'Clasificación basada en rendimiento total',
  'Skill Level Ranking': 'Clasificación por Nivel de Habilidad',
  'Ranking based on skill level': 'Clasificación basada en nivel de habilidad',
  'Win Rate Ranking': 'Clasificación por Tasa de Victoria',
  'Ranking based on win rate': 'Clasificación basada en tasa de victoria',
  'Monthly Active Ranking': 'Clasificación de Activos Mensuales',
  'Ranking based on monthly match activity':
    'Clasificación basada en actividad mensual de partidos',
  'Improvement Ranking': 'Clasificación de Mejora',
  'Ranking based on skill improvement rate': 'Clasificación basada en tasa de mejora de habilidad',
  'Junsu Kim': 'Junsu Kim',
  'Seoyeon Lee': 'Seoyeon Lee',

  // Dues Management remaining
  'Dues Amount': 'Monto de Cuotas',
  'Due Date': 'Fecha de Vencimiento',
  'Late Fee Amount': 'Monto de Recargo por Mora',
  Installments: 'Cuotas',
  'Monthly installment payment': 'Pago mensual de cuotas',
  'Payment type': 'Tipo de pago',
  'One-time': 'Único',
  Recurring: 'Recurrente',
  'Assign to member': 'Asignar a miembro',
  'Would you like to export dues data?': '¿Te gustaría exportar datos de cuotas?',
  'Data will be saved as CSV file.': 'Los datos se guardarán como archivo CSV.',
  Export: 'Exportar',
  'Select Export Range': 'Seleccionar Rango de Exportación',
  'All Records': 'Todos los Registros',
  'Current Month Only': 'Solo Mes Actual',
  'Paid Only': 'Solo Pagados',
  'Unpaid Only': 'Solo Sin Pagar',
  'Select Photo': 'Seleccionar Foto',
  'Take Photo': 'Tomar Foto',
  'Choose from Gallery': 'Elegir de Galería',
  'Member Information': 'Información del Miembro',
  'All Members': 'Todos los Miembros',
  'Specific Member': 'Miembro Específico',
  'Join Date': 'Fecha de Ingreso',
  'Joined: {{date}}': 'Ingresó: {{date}}',
  'No payment methods set up. Add payment methods in settings.':
    'No hay métodos de pago configurados. Agrega métodos de pago en configuración.',
  'Payment Method': 'Método de Pago',
  'Or use QR code:': 'O usa código QR:',

  // Simplified legal texts (keeping structure, translating key phrases)
  'Lightning Tennis Terms of Service': 'Términos de Servicio de Lightning Tennis',
  '⚠️ Important Notice': '⚠️ Aviso Importante',
  'Lightning Tennis is a platform that connects tennis players.':
    'Lightning Tennis es una plataforma que conecta jugadores de tenis.',
  'Responsibility for safety incidents or disputes during actual matches lies with the participants':
    'La responsabilidad por incidentes de seguridad o disputas durante partidos reales recae en los participantes',
  'we do not assume legal liability for these matters.':
    'no asumimos responsabilidad legal por estos asuntos.',
  '1. Service Usage': '1. Uso del Servicio',
  '- This app is a platform service connecting tennis players.':
    '- Esta aplicación es un servicio de plataforma que conecta jugadores de tenis.',
  '- Users can utilize features such as match creation, participation, and club activities.':
    '- Los usuarios pueden utilizar funciones como creación de partidos, participación y actividades de club.',
  '- Please maintain mutual respect and sportsmanship when using the service.':
    '- Por favor mantén respeto mutuo y deportividad al usar el servicio.',
  '2. User Obligations': '2. Obligaciones del Usuario',
  '- Must provide accurate information.': '- Debe proporcionar información precisa.',
  "- Must not infringe on others' rights.": '- No debe infringir los derechos de otros.',
  '- Must not post illegal or inappropriate content.':
    '- No debe publicar contenido ilegal o inapropiado.',
  '3. AI Chatbot Service Terms': '3. Términos del Servicio de Chatbot IA',
  '- Tennis-related information provided by the chatbot is generated by AI.':
    '- La información relacionada con tenis proporcionada por el chatbot es generada por IA.',
  '- Information provided by AI may be inaccurate or outdated.':
    '- La información proporcionada por IA puede ser inexacta o desactualizada.',
  '- The company does not guarantee the accuracy, completeness, or reliability of AI chatbot information.':
    '- La empresa no garantiza la precisión, completitud o confiabilidad de la información del chatbot IA.',
  '- The company is not liable for any damages arising from AI chatbot information.':
    '- La empresa no es responsable de daños derivados de la información del chatbot IA.',
  '- Prohibited to use the chatbot to generate or ask illegal content.':
    '- Prohibido usar el chatbot para generar o preguntar contenido ilegal.',
  '- Prohibited to generate or ask offensive or discriminatory content.':
    '- Prohibido generar o preguntar contenido ofensivo o discriminatorio.',
  '- The company may change AI chatbot functionality at any time.':
    '- La empresa puede cambiar la funcionalidad del chatbot IA en cualquier momento.',
  '- May update the service for quality improvement.':
    '- Puede actualizar el servicio para mejora de calidad.',
  '- May take disciplinary action against inappropriate users.':
    '- Puede tomar acción disciplinaria contra usuarios inapropiados.',
  'Privacy Policy': 'Política de Privacidad',
  '1. Personal Information We Collect': '1. Información Personal que Recopilamos',
  '- Basic info: Nickname, gender, age range': '- Información básica: Apodo, género, rango de edad',
  '- Tennis info: NTRP level, preferred playing style':
    '- Información de tenis: Nivel NTRP, estilo de juego preferido',
  '- Location info: Activity areas, GPS location (for match finding)':
    '- Información de ubicación: Áreas de actividad, ubicación GPS (para encontrar partidos)',
  '- Contact info: Email address': '- Información de contacto: Dirección de email',
  '- AI Chatbot conversation data: User questions and conversation logs':
    '- Datos de conversación del chatbot IA: Preguntas del usuario y registros de conversación',
  '2. Purpose of Personal Information Use': '2. Propósito del Uso de Información Personal',
  '- Providing matchmaking services': '- Proporcionar servicios de emparejamiento',
  '- Providing personalized recommendations': '- Proporcionar recomendaciones personalizadas',
  '- Supporting user communication': '- Apoyar la comunicación del usuario',
  '- Service improvement and statistical analysis': '- Mejora del servicio y análisis estadístico',
  '- Users may opt out of AI chatbot features without limiting other service usage.':
    '- Los usuarios pueden optar por no usar las funciones del chatbot IA sin limitar el uso de otros servicios.',
  '- Personal identifying information is minimized before transmission.':
    '- La información de identificación personal se minimiza antes de la transmisión.',
  '- Data is securely transmitted through encrypted communication.':
    '- Los datos se transmiten de forma segura mediante comunicación cifrada.',
  '4. Data Storage Period': '4. Período de Almacenamiento de Datos',
  '- Basic personal information: Stored during service usage period':
    '- Información personal básica: Almacenada durante el período de uso del servicio',
  '- All personal information immediately deleted upon account withdrawal (except for legal retention requirements)':
    '- Toda la información personal se elimina inmediatamente al retirar la cuenta (excepto requisitos legales de retención)',
  '5. Personal Information Protection and User Rights':
    '5. Protección de Información Personal y Derechos del Usuario',
  '- Collected personal information is encrypted and securely stored':
    '- La información personal recopilada se cifra y almacena de forma segura',
  '- Users may request cessation of personal information processing at any time':
    '- Los usuarios pueden solicitar la cesación del procesamiento de información personal en cualquier momento',
  '- Users are advised NOT to expose or store sensitive personal information':
    '- Se aconseja a los usuarios NO exponer ni almacenar información personal sensible',
  '- Users are encouraged to use strong passwords and change them periodically for account security.':
    '- Se alienta a los usuarios a usar contraseñas fuertes y cambiarlas periódicamente para la seguridad de la cuenta.',
  'Location-Based Services Terms': 'Términos de Servicios Basados en Ubicación',
  '1. Location Information Collection and Use': '1. Recopilación y Uso de Información de Ubicación',
  '- Providing nearby match finding services':
    '- Proporcionar servicios de búsqueda de partidos cercanos',
  '- Providing tennis court search services':
    '- Proporcionar servicios de búsqueda de canchas de tenis',
  '- Providing distance-based notification services':
    '- Proporcionar servicios de notificación basados en distancia',
  '2. Consent for Location Information': '2. Consentimiento para Información de Ubicación',
  '- Users may refuse location information provision at any time':
    '- Los usuarios pueden rechazar la provisión de información de ubicación en cualquier momento',
  '- Refusing location information may limit some service features':
    '- Rechazar la información de ubicación puede limitar algunas funciones del servicio',
  '3. Location Information Protection': '3. Protección de Información de Ubicación',
  '- Collected location information is encrypted and securely stored':
    '- La información de ubicación recopilada se cifra y almacena de forma segura',
  '- Not provided to third parties without user consent':
    '- No se proporciona a terceros sin consentimiento del usuario',
  '⚠️ IMPORTANT LEGAL NOTICE ⚠️': '⚠️ AVISO LEGAL IMPORTANTE ⚠️',
  'Lightning Tennis app serves as a platform to connect individual tennis players.':
    'La aplicación Lightning Tennis sirve como plataforma para conectar jugadores individuales de tenis.',
  'WE DO NOT ASSUME ANY LEGAL LIABILITY for:': 'NO ASUMIMOS NINGUNA RESPONSABILIDAD LEGAL por:',
  '1. Safety Incidents Disclaimer': '1. Descargo de Responsabilidad por Incidentes de Seguridad',
  '- Injuries or accidents during tennis matches':
    '- Lesiones o accidentes durante partidos de tenis',
  '- Personal disputes between match participants':
    '- Disputas personales entre participantes del partido',
  '- Safety incidents at tennis court facilities':
    '- Incidentes de seguridad en instalaciones de canchas de tenis',
  '2. Financial Disputes Disclaimer': '2. Descargo de Responsabilidad por Disputas Financieras',
  '- Disputes related to match costs': '- Disputas relacionadas con costos del partido',
  '- Issues related to court rental fees':
    '- Problemas relacionados con tarifas de alquiler de canchas',
  '- Financial transactions between users': '- Transacciones financieras entre usuarios',
  '3. User Responsibility': '3. Responsabilidad del Usuario',
  '- All safety and responsibility for matches belong to hosts and participants':
    '- Toda la seguridad y responsabilidad de los partidos pertenecen a los anfitriones y participantes',
  '- Users must verify their health condition before participating':
    '- Los usuarios deben verificar su condición de salud antes de participar',
  '- Appropriate insurance coverage is recommended':
    '- Se recomienda cobertura de seguro apropiada',
  'By using this service, you agree to these disclaimer terms.':
    'Al usar este servicio, aceptas estos términos de descargo de responsabilidad.',
};

function deepReplace(enObj, esObj, dict) {
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key]) && enObj[key] !== null) {
      esObj[key] = esObj[key] || {};
      deepReplace(enObj[key], esObj[key], dict);
    } else if (typeof enObj[key] === 'string') {
      if (esObj[key] === enObj[key]) {
        esObj[key] = dict[enObj[key]] || enObj[key];
      }
    }
  }
}

function countUntranslated(enObj, esObj) {
  let count = 0;
  for (const key in enObj) {
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], esObj[key] || {});
    } else if (esObj[key] === enObj[key]) {
      count++;
    }
  }
  return count;
}

console.log('🌍 Final 252 Keys Translation');
console.log('============================\n');

const before = countUntranslated(en, es);
console.log(`📊 Before: ${before}\n`);

deepReplace(en, es, finalDict);

const after = countUntranslated(en, es);
console.log(`✅ Translated: ${before - after}`);
console.log(`📊 Remaining: ${after}\n`);

fs.writeFileSync(ES_PATH, JSON.stringify(es, null, 2), 'utf8');
console.log('💾 Saved!\n');

if (after === 0) {
  console.log('🎉🎉🎉 ALL KEYS TRANSLATED! 🎉🎉🎉');
} else {
  console.log(`ℹ️  ${after} keys remain (mostly long legal text blocks)`);
  console.log('📊 Translation Status: ' + Math.round((1 - after / 966) * 100) + '% complete');
}
