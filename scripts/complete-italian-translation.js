#!/usr/bin/env node
/**
 * Complete Italian Translation - Final Pass
 * Handles ALL remaining untranslated keys with comprehensive dictionary
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

// Comprehensive Italian translation dictionary - MEGA VERSION
const MEGA_TRANSLATIONS = {
  // Words that are identical in Italian (NO translation needed)
  No: 'No',
  OK: 'OK',
  Email: 'Email',
  Password: 'Password',
  Logo: 'Logo',
  Brunch: 'Brunch',
  km: 'km',
  mi: 'mi',
  Manager: 'Manager',
  Venmo: 'Venmo',
  Korean: 'Coreano',

  // Common UI Actions
  'Set Time': 'Imposta Ora',
  'Quiet Hours': 'Ore Silenziose',
  Privacy: 'Privacy',
  Help: 'Aiuto',
  'App Info': 'Info App',
  Logout: 'Esci',
  'Resetting...': 'Ripristino...',

  // Questions & Confirmations
  'Are you sure you want to logout?': 'Sei sicuro di voler uscire?',
  'Are you sure you want to': 'Sei sicuro di voler',
  'Are you sure': 'Sei sicuro',
  'Do you want to': 'Vuoi',

  // Developer Tools
  '🔧 Developer Tools': '🔧 Strumenti Sviluppatore',
  '⚠️ For Developers Only - Run Once!': '⚠️ Solo per Sviluppatori - Esegui Una Volta!',
  'Reset Complete': 'Ripristino Completato',
  'membership statistics have been reset': 'statistiche di iscrizione sono state ripristinate',

  // League Detail phrases
  'League deleted successfully': 'Lega eliminata con successo',
  'Failed to delete league': 'Impossibile eliminare la lega',
  'View Bracket': 'Visualizza Tabellone',
  Rounds: 'Turni',
  Round: 'Turno',
  'Start Tournament': 'Avvia Torneo',
  'Start League': 'Avvia Lega',
  'View Standings': 'Visualizza Classifica',
  'Match History': 'Storico Partite',
  'League Settings': 'Impostazioni Lega',
  'Delete League': 'Elimina Lega',
  'Edit League': 'Modifica Lega',

  // Dues Management phrases
  'Payment Method': 'Metodo di Pagamento',
  'Monthly Dues': 'Quote Mensili',
  'Due Date': 'Data di Scadenza',
  Amount: 'Importo',
  'Payment Status': 'Stato Pagamento',
  'Mark as Paid': 'Segna come Pagato',
  'Mark as Unpaid': 'Segna come Non Pagato',
  'Mark as Exempt': 'Segna come Esente',
  'Payment History': 'Storico Pagamenti',
  'Next Due Date': 'Prossima Scadenza',
  'Last Payment': 'Ultimo Pagamento',
  'Total Paid': 'Totale Pagato',
  'Total Unpaid': 'Totale Non Pagato',
  'Send Reminder': 'Invia Promemoria',
  'Reminder Sent': 'Promemoria Inviato',
  'Due on': 'Scadenza il',
  'Overdue by': 'Scaduto da',
  days: 'giorni',
  day: 'giorno',

  // Services phrases
  'Location Services': 'Servizi di Localizzazione',
  'Enable Location': 'Abilita Localizzazione',
  'Location Permission': 'Permesso Localizzazione',
  'Location Required': 'Localizzazione Richiesta',
  'Please enable location services': 'Abilita i servizi di localizzazione',
  'Photo Library': 'Libreria Foto',
  'Take Photo': 'Scatta Foto',
  'Choose Photo': 'Scegli Foto',
  'Upload Photo': 'Carica Foto',
  'Change Photo': 'Cambia Foto',
  'Remove Photo': 'Rimuovi Foto',

  // Tournament Management phrases
  'Seed Players': 'Teste di Serie',
  'Generate Bracket': 'Genera Tabellone',
  Bracket: 'Tabellone',
  Elimination: 'Eliminazione',
  'Single Elimination': 'Eliminazione Diretta',
  'Double Elimination': 'Doppia Eliminazione',
  'Round Robin': 'Round Robin',
  Format: 'Formato',
  'Best of': 'Al meglio di',
  Sets: 'Set',
  Registration: 'Registrazione',
  'Registration Open': 'Registrazioni Aperte',
  'Registration Closed': 'Registrazioni Chiuse',
  Capacity: 'Capacità',
  Full: 'Pieno',
  'Spots Left': 'Posti Rimasti',
  'Wait List': "Lista d'Attesa",
  Withdraw: 'Ritirati',
  Advance: 'Avanza',
  Bye: 'Riposo',
  Winner: 'Vincitore',
  Loser: 'Perdente',

  // Event Card phrases
  'Hosted by': 'Ospitato da',
  'Organized by': 'Organizzato da',
  Going: 'Partecipante',
  'Not Going': 'Non Partecipante',
  Maybe: 'Forse',
  Interested: 'Interessato',
  Attending: 'Partecipazione',
  'spots left': 'posti rimasti',
  'spot left': 'posto rimasto',
  'At capacity': 'Al completo',
  'Registration deadline': 'Scadenza registrazione',
  'Starts in': 'Inizia tra',
  Started: 'Iniziato',
  'Ends in': 'Termina tra',
  Ended: 'Terminato',

  // Profile Settings phrases
  'Account Settings': 'Impostazioni Account',
  'Display Name': 'Nome Visualizzato',
  Bio: 'Biografia',
  Location: 'Posizione',
  'Playing Level': 'Livello di Gioco',
  'Preferred Hand': 'Mano Preferita',
  Right: 'Destra',
  Left: 'Sinistra',
  'Years Playing': 'Anni di Gioco',
  Availability: 'Disponibilità',
  'Preferred Time Slots': 'Fasce Orarie Preferite',
  Morning: 'Mattina',
  Afternoon: 'Pomeriggio',
  Evening: 'Sera',
  Weekdays: 'Giorni Feriali',
  Weekends: 'Fine Settimana',
  'Change Password': 'Cambia Password',
  'Current Password': 'Password Attuale',
  'New Password': 'Nuova Password',
  'Confirm Password': 'Conferma Password',
  'Delete Account': 'Elimina Account',
  'Deactivate Account': 'Disattiva Account',

  // Performance Dashboard phrases
  'Win Rate': 'Percentuale Vittorie',
  'Total Matches': 'Totale Partite',
  Wins: 'Vittorie',
  Losses: 'Sconfitte',
  'Win Streak': 'Serie di Vittorie',
  'Current Streak': 'Serie Attuale',
  'Best Streak': 'Miglior Serie',
  'Recent Form': 'Forma Recente',
  'Last 10 Matches': 'Ultime 10 Partite',
  Rating: 'Valutazione',
  'Peak Rating': 'Valutazione Massima',
  'Current Rating': 'Valutazione Attuale',
  'Rating Change': 'Variazione Valutazione',
  'Head to Head': 'Testa a Testa',
  Against: 'Contro',
  Versus: 'Contro',

  // AI Matching phrases
  'Find Players': 'Trova Giocatori',
  'Suggested Matches': 'Partite Suggerite',
  'Match Score': 'Punteggio Abbinamento',
  Compatibility: 'Compatibilità',
  'Similar Level': 'Livello Simile',
  Nearby: 'Nelle Vicinanze',
  'Available Now': 'Disponibile Ora',
  'Preferred Times': 'Orari Preferiti',
  Connect: 'Connetti',
  'Request Match': 'Richiedi Partita',
  'Send Message': 'Invia Messaggio',

  // Club phrases
  'Join Club': 'Iscriviti al Club',
  'Leave Club': 'Lascia Club',
  'Club Members': 'Membri del Club',
  'Member Since': 'Membro dal',
  'Active Members': 'Membri Attivi',
  'Club Rules': 'Regole del Club',
  'Club Events': 'Eventi del Club',
  'Upcoming Events': 'Eventi Prossimi',
  'Past Events': 'Eventi Passati',
  'Club Tournaments': 'Tornei del Club',
  'Club Leagues': 'Leghe del Club',
  Announcements: 'Annunci',
  'Latest News': 'Ultime Notizie',
  Contact: 'Contatto',
  Facilities: 'Strutture',
  Courts: 'Campi',
  Amenities: 'Servizi',

  // Edit Profile phrases
  'Profile Photo': 'Foto Profilo',
  'Cover Photo': 'Foto Copertina',
  'Full Name': 'Nome Completo',
  'First Name': 'Nome',
  'Last Name': 'Cognome',
  Username: 'Nome Utente',
  Phone: 'Telefono',
  'Phone Number': 'Numero di Telefono',
  'Date of Birth': 'Data di Nascita',
  Gender: 'Genere',
  Male: 'Maschio',
  Female: 'Femmina',
  Other: 'Altro',
  'Prefer not to say': 'Preferisco non dire',

  // Create Event phrases
  'Event Name': 'Nome Evento',
  'Event Type': 'Tipo di Evento',
  'Event Date': 'Data Evento',
  'Start Time': 'Ora Inizio',
  'End Time': 'Ora Fine',
  Duration: 'Durata',
  Venue: 'Sede',
  Address: 'Indirizzo',
  City: 'Città',
  State: 'Stato',
  'Zip Code': 'CAP',
  Country: 'Paese',
  'Max Participants': 'Partecipanti Massimi',
  'Min Participants': 'Partecipanti Minimi',
  Cost: 'Costo',
  Free: 'Gratuito',
  Paid: 'A Pagamento',
  Price: 'Prezzo',
  'Registration Fee': 'Quota di Iscrizione',
  Public: 'Pubblico',
  Private: 'Privato',
  'Members Only': 'Solo Membri',
  'Open to All': 'Aperto a Tutti',
  'Invitation Only': 'Solo su Invito',

  // Badge Gallery phrases
  Achievements: 'Successi',
  Badges: 'Distintivi',
  Trophies: 'Trofei',
  'Earned Badges': 'Distintivi Guadagnati',
  'In Progress': 'In Corso',
  'Not Started': 'Non Iniziato',
  Progress: 'Progresso',
  Unlock: 'Sblocca',
  Unlocked: 'Sbloccato',
  Locked: 'Bloccato',
  'Earn by': 'Guadagna',
  'Earned on': 'Guadagnato il',
  Rare: 'Raro',
  Epic: 'Epico',
  Legendary: 'Leggendario',

  // Match Request phrases
  'Propose Match': 'Proponi Partita',
  'Match Details': 'Dettagli Partita',
  'Proposed Time': 'Ora Proposta',
  'Proposed Date': 'Data Proposta',
  'Proposed Location': 'Luogo Proposto',
  'Your Response': 'La Tua Risposta',
  'Accept Request': 'Accetta Richiesta',
  'Decline Request': 'Rifiuta Richiesta',
  'Counter Propose': 'Controproposta',
  'Suggest Different Time': 'Suggerisci Ora Diversa',
  'Pending Response': 'In Attesa di Risposta',
  Accepted: 'Accettato',
  Declined: 'Rifiutato',
  Expired: 'Scaduto',

  // Score Confirmation phrases
  'Enter Score': 'Inserisci Punteggio',
  'Your Score': 'Il Tuo Punteggio',
  'Opponent Score': 'Punteggio Avversario',
  'Set 1': 'Set 1',
  'Set 2': 'Set 2',
  'Set 3': 'Set 3',
  Tiebreak: 'Tiebreak',
  'Match Result': 'Risultato Partita',
  'You Won': 'Hai Vinto',
  'You Lost': 'Hai Perso',
  'Waiting for confirmation': 'In attesa di conferma',
  Disputed: 'Contestato',
  'Confirmed by both players': 'Confermato da entrambi i giocatori',

  // Sportsmanship phrases
  'Excellent sportsmanship': 'Sportività eccellente',
  'Good sportsmanship': 'Buona sportività',
  'Fair sportsmanship': 'Sportività discreta',
  'Poor sportsmanship': 'Sportività scarsa',
  'Rate your opponent': 'Valuta il tuo avversario',

  // Time phrases
  hours: 'ore',
  hour: 'ora',
  minutes: 'minuti',
  minute: 'minuto',
  seconds: 'secondi',
  second: 'secondo',
  ago: 'fa',
  'from now': 'da adesso',
  Today: 'Oggi',
  Tomorrow: 'Domani',
  Yesterday: 'Ieri',
  'This Week': 'Questa Settimana',
  'Next Week': 'Prossima Settimana',
  'Last Week': 'Settimana Scorsa',
  'This Month': 'Questo Mese',
  'Next Month': 'Prossimo Mese',
  'Last Month': 'Mese Scorso',

  // Common phrases
  'Show more': 'Mostra di più',
  'Show less': 'Mostra meno',
  'Load more': 'Carica altro',
  'See all': 'Vedi tutto',
  'See details': 'Vedi dettagli',
  'View all': 'Visualizza tutto',
  'View details': 'Visualizza dettagli',
  'Go back': 'Torna indietro',
  'Go to': 'Vai a',
  'Get directions': 'Ottieni indicazioni',
  Share: 'Condividi',
  Copy: 'Copia',
  Paste: 'Incolla',
  Cut: 'Taglia',
  'Select all': 'Seleziona tutto',
  'Deselect all': 'Deseleziona tutto',
  Apply: 'Applica',
  Reset: 'Ripristina',
  Clear: 'Cancella',
  'Clear all': 'Cancella tutto',
  Undo: 'Annulla',
  Redo: 'Ripeti',
  'Sort by': 'Ordina per',
  Filter: 'Filtra',
  Search: 'Cerca',
  'Search for': 'Cerca',
  Results: 'Risultati',
  'No results': 'Nessun risultato',
  'Not found': 'Non trovato',
  Empty: 'Vuoto',
  None: 'Nessuno',
  All: 'Tutti',
  Any: 'Qualsiasi',
  Select: 'Seleziona',
  Selected: 'Selezionato',
  Unselected: 'Non selezionato',
  Enabled: 'Abilitato',
  Disabled: 'Disabilitato',
  On: 'Attivo',
  Off: 'Disattivo',
  True: 'Vero',
  False: 'Falso',
  Default: 'Predefinito',
  Custom: 'Personalizzato',
  More: 'Altro',
  Less: 'Meno',
  New: 'Nuovo',
  Old: 'Vecchio',
  Latest: 'Ultimi',
  Oldest: 'Più Vecchi',
  Recent: 'Recenti',
  Popular: 'Popolari',
  Recommended: 'Consigliati',
  Featured: 'In Evidenza',
  Favorite: 'Preferito',
  Favorites: 'Preferiti',
  Bookmark: 'Segnalibro',
  Bookmarked: 'Salvato',
  Like: 'Mi piace',
  Liked: 'Piaciuto',
  Dislike: 'Non mi piace',
  Comment: 'Commento',
  Comments: 'Commenti',
  Reply: 'Rispondi',
  Report: 'Segnala',
  Block: 'Blocca',
  Unblock: 'Sblocca',
  Mute: 'Silenzia',
  Unmute: 'Riattiva audio',
  Follow: 'Segui',
  Following: 'Seguendo',
  Unfollow: 'Smetti di seguire',
  Followers: 'Follower',
  Friends: 'Amici',
  Friend: 'Amico',
  'Add Friend': 'Aggiungi Amico',
  'Remove Friend': 'Rimuovi Amico',
  'Friend Request': 'Richiesta di Amicizia',
  Accept: 'Accetta',
  Decline: 'Rifiuta',
  Ignore: 'Ignora',
  Send: 'Invia',
  Sent: 'Inviato',
  Received: 'Ricevuto',
  Read: 'Letto',
  Unread: 'Non letto',
  'Mark as read': 'Segna come letto',
  'Mark as unread': 'Segna come non letto',
  Archive: 'Archivia',
  Archived: 'Archiviato',
  Unarchive: 'Ripristina',
  Draft: 'Bozza',
  Drafts: 'Bozze',
  'Sent Messages': 'Messaggi Inviati',
  Inbox: 'Posta in arrivo',
  Compose: 'Scrivi',
  To: 'A',
  From: 'Da',
  Subject: 'Oggetto',
  Message: 'Messaggio',
  Attachment: 'Allegato',
  Attachments: 'Allegati',
  Download: 'Scarica',
  Upload: 'Carica',
  File: 'File',
  Files: 'File',
  Image: 'Immagine',
  Images: 'Immagini',
  Video: 'Video',
  Videos: 'Video',
  Audio: 'Audio',
  Document: 'Documento',
  Documents: 'Documenti',
  Link: 'Link',
  Links: 'Collegamenti',
  Size: 'Dimensione',
  Type: 'Tipo',
  Name: 'Nome',
  Date: 'Data',
  Time: 'Ora',
  Status: 'Stato',
  Actions: 'Azioni',
  Options: 'Opzioni',
  Description: 'Descrizione',
  Details: 'Dettagli',
  Info: 'Informazioni',
  Information: 'Informazioni',
  About: 'Informazioni',
  Version: 'Versione',
  Build: 'Build',
  Update: 'Aggiorna',
  Updates: 'Aggiornamenti',
  'Update Available': 'Aggiornamento Disponibile',
  'Up to Date': 'Aggiornato',
  Installing: 'Installazione',
  Installed: 'Installato',
  'Not Installed': 'Non Installato',
  Required: 'Obbligatorio',
  Optional: 'Facoltativo',
  Recommended: 'Consigliato',
  Beta: 'Beta',
  Stable: 'Stabile',
  Preview: 'Anteprima',
  'Coming Soon': 'Prossimamente',
  'Under Construction': 'In Costruzione',
  Maintenance: 'Manutenzione',
  Offline: 'Offline',
  Online: 'Online',
  Connected: 'Connesso',
  Disconnected: 'Disconnesso',
  Connecting: 'Connessione',
  Retrying: 'Riprovando',
  Retry: 'Riprova',
  'Try Again': 'Riprova',
  Refresh: 'Aggiorna',
  Reload: 'Ricarica',
  Sync: 'Sincronizza',
  Syncing: 'Sincronizzazione',
  Synced: 'Sincronizzato',
  Backup: 'Backup',
  Restore: 'Ripristina',
  Export: 'Esporta',
  Import: 'Importa',
  Print: 'Stampa',
  'Zoom In': 'Ingrandisci',
  'Zoom Out': 'Rimpicciolisci',
  'Fit to Screen': 'Adatta allo Schermo',
  'Full Screen': 'Schermo Intero',
  'Exit Full Screen': 'Esci da Schermo Intero',
  Play: 'Riproduci',
  Pause: 'Pausa',
  Stop: 'Ferma',
  Record: 'Registra',
  Recording: 'Registrazione',
  Volume: 'Volume',
  Brightness: 'Luminosità',
  Contrast: 'Contrasto',
  Saturation: 'Saturazione',
  Quality: 'Qualità',
  Low: 'Bassa',
  Medium: 'Media',
  High: 'Alta',
  Auto: 'Automatico',
  Manual: 'Manuale',
  Language: 'Lingua',
  Theme: 'Tema',
  Light: 'Chiaro',
  Dark: 'Scuro',
  System: 'Sistema',
  'Font Size': 'Dimensione Carattere',
  Small: 'Piccolo',
  Large: 'Grande',
  Color: 'Colore',
  Background: 'Sfondo',
  Foreground: 'Primo piano',
  Accent: 'Accento',
  Primary: 'Primario',
  Secondary: 'Secondario',
  Success: 'Successo',
  Warning: 'Avviso',
  Danger: 'Pericolo',
  Info: 'Informazione',
  Debug: 'Debug',
  Verbose: 'Dettagliato',
  Quiet: 'Silenzioso',
  Normal: 'Normale',
  Advanced: 'Avanzato',
  Basic: 'Base',
  Expert: 'Esperto',
  Beginner: 'Principiante',
  Intermediate: 'Intermedio',
  Professional: 'Professionale',
  Amateur: 'Amatoriale',
  Casual: 'Casuale',
  Competitive: 'Competitivo',
  Ranked: 'Classificato',
  Unranked: 'Non classificato',
  Level: 'Livello',
  Rank: 'Rango',
  Score: 'Punteggio',
  Points: 'Punti',
  Experience: 'Esperienza',
  Skill: 'Abilità',
  Stats: 'Statistiche',
  Statistics: 'Statistiche',
  Summary: 'Riepilogo',
  Overview: 'Panoramica',
  Dashboard: 'Dashboard',
  Home: 'Home',
  Feed: 'Feed',
  Activity: 'Attività',
  Notifications: 'Notifiche',
  Messages: 'Messaggi',
  Chats: 'Chat',
  Calls: 'Chiamate',
  Calendar: 'Calendario',
  Schedule: 'Programma',
  Tasks: 'Attività',
  Notes: 'Note',
  Reminders: 'Promemoria',
  Lists: 'Liste',
  Tags: 'Tag',
  Categories: 'Categorie',
  Labels: 'Etichette',
  Groups: 'Gruppi',
  Teams: 'Squadre',
  Organizations: 'Organizzazioni',
  Communities: 'Comunità',
  Networks: 'Reti',
  Connections: 'Connessioni',
  Contacts: 'Contatti',
  People: 'Persone',
  Users: 'Utenti',
  Admins: 'Amministratori',
  Moderators: 'Moderatori',
  Members: 'Membri',
  Guests: 'Ospiti',
  Visitors: 'Visitatori',
  Subscribers: 'Iscritti',
  Contributors: 'Collaboratori',
  Editors: 'Editori',
  Viewers: 'Spettatori',
  Owners: 'Proprietari',
  Permissions: 'Permessi',
  Access: 'Accesso',
  Role: 'Ruolo',
  Roles: 'Ruoli',
  Administrator: 'Amministratore',
  Moderator: 'Moderatore',
  Member: 'Membro',
  Guest: 'Ospite',
  User: 'Utente',
  'Public Access': 'Accesso Pubblico',
  'Private Access': 'Accesso Privato',
  Restricted: 'Limitato',
  Unrestricted: 'Illimitato',
  Allowed: 'Consentito',
  Denied: 'Negato',
  Granted: 'Concesso',
  Revoked: 'Revocato',
  Invite: 'Invita',
  Invited: 'Invitato',
  Invitation: 'Invito',
  Invitations: 'Inviti',
  Request: 'Richiesta',
  Requests: 'Richieste',
  Approve: 'Approva',
  Approved: 'Approvato',
  Reject: 'Rifiuta',
  Rejected: 'Rifiutato',
  Review: 'Revisiona',
  Reviewed: 'Revisionato',
  'Submit for Review': 'Invia per Revisione',
  Publish: 'Pubblica',
  Published: 'Pubblicato',
  Unpublish: 'Annulla Pubblicazione',
  Draft: 'Bozza',
  Scheduled: 'Programmato',
  Live: 'Live',
  Archived: 'Archiviato',
  Deleted: 'Eliminato',
  Permanent: 'Permanente',
  Temporary: 'Temporaneo',
  Active: 'Attivo',
  Inactive: 'Inattivo',
  Enabled: 'Abilitato',
  Disabled: 'Disabilitato',
  Visible: 'Visibile',
  Hidden: 'Nascosto',
  Available: 'Disponibile',
  Unavailable: 'Non disponibile',
  Busy: 'Occupato',
  Away: 'Assente',
  'Do Not Disturb': 'Non disturbare',
  Invisible: 'Invisibile',
  'Appears as': 'Appare come',
};

// Deep set function
function deepSet(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
}

// Deep merge function
function deepMerge(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Translation function with pattern matching
function translateText(text, key) {
  if (!text || typeof text !== 'string') return text;

  // Check direct match
  if (MEGA_TRANSLATIONS[text]) {
    return MEGA_TRANSLATIONS[text];
  }

  // Pattern replacements for complex phrases
  let translated = text;
  let hasChange = false;

  // Sort by length (longest first)
  const sortedEntries = Object.entries(MEGA_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);

  for (const [en, it] of sortedEntries) {
    if (translated.includes(en)) {
      const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      translated = translated.replace(regex, it);
      hasChange = true;
    }
  }

  return hasChange ? translated : text;
}

// Main function
function main() {
  console.log('🇮🇹 Completing ALL Italian translations...\n');

  // Read files
  const itPath = path.join(LOCALES_DIR, 'it.json');
  const untranslatedPath = path.join(__dirname, 'untranslated-it.json');

  const currentIt = JSON.parse(fs.readFileSync(itPath, 'utf8'));
  const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));

  console.log(`Processing ${untranslated.length} untranslated keys...\n`);

  const updates = {};
  let translated = 0;
  let identical = 0;
  let partial = 0;

  untranslated.forEach(({ key, enValue }) => {
    const translatedText = translateText(enValue, key);

    if (translatedText === enValue) {
      // Check if it's a proper noun, abbreviation, or universal term
      if (
        enValue.length <= 3 ||
        enValue === enValue.toUpperCase() ||
        ['Email', 'OK', 'No', 'Logo', 'km', 'mi'].includes(enValue)
      ) {
        identical++;
        deepSet(updates, key, enValue); // Keep as is
      } else {
        partial++;
        deepSet(updates, key, translatedText);
      }
    } else {
      translated++;
      deepSet(updates, key, translatedText);
    }
  });

  // Merge with existing translations
  const merged = deepMerge(currentIt, updates);

  // Write back
  fs.writeFileSync(itPath, JSON.stringify(merged, null, 2) + '\n');

  console.log('✅ Translation complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Fully translated: ${translated} keys`);
  console.log(`   - Kept identical (universal terms): ${identical} keys`);
  console.log(`   - Needs review: ${partial} keys`);
  console.log(`   - Total processed: ${untranslated.length} keys\n`);
  console.log(`📝 Updated file: ${itPath}\n`);

  // Re-run check
  console.log('🔍 Re-checking untranslated keys...\n');
  const { execSync } = require('child_process');
  execSync('node scripts/find-untranslated-keys.js', { stdio: 'inherit' });
}

main();
