#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// ULPRA-FINAL Dictionary - INCLUDING multi-line strings
const ULPRA_DICT = {
  // Multi-line strings (CRITICAL!)
  'All regular season matches are complete.\n\nStart playoffs for {{leagueName}}?':
    'Tous les matchs de saison régulière sont terminés.\n\nCommencer les éliminatoires pour {{leagueName}} ?',

  'Are you sure you want to delete "{{leagueName}}"?\n\nThis action cannot be undone and all match data and participant information will be deleted.':
    'Êtes-vous sûr de vouloir supprimer "{{leagueName}}" ?\n\nCette action ne peut pas être annulée et toutes les données de match et les informations sur les participants seront supprimées.',

  'Delete all matches in {{leagueName}}?\n\nThis action cannot be undone and the league will be reset to application status.':
    'Supprimer tous les matchs dans {{leagueName}} ?\n\nCette action ne peut pas être annulée et la ligue sera réinitialisée au statut de candidature.',

  'Generate bpaddle for {{leagueName}}?\n\nThis action cannot be undone and the league will start.':
    'Générer le tableau pour {{leagueName}} ?\n\nCette action ne peut pas être annulée et la ligue commencera.',

  'Match result has been saved.\n\n⚠️ This was a friendly match and will not affect ELO/win rate.':
    "Le résultat du match a été enregistré.\n\n⚠️ Il s'agissait d'un match amical et n'affectera pas votre ELO/taux de victoire.",

  "LPR (Lightning Pickleball Rating) is a proprietary skill assessment system developed exclusively for the Lightning Pickleball community. LPR is calculated based on the ELO algorithm applied to all public lightning match results, showing your growth journey in an intuitive scale from 1 to 10. It's an honorable indicator of how much you've grown within our ecosystem.\n\nLPR is a unique system distinct from USTA's NTRP. For the convenience of users familiar with NTRP ratings, you can select your skill level in a range similar to NTRP when signing up, but all official levels calculated and displayed within the app are based on LPR.":
    "LPR (Lightning Pickleball Rating) est un système d'évaluation des compétences propriétaire développé exclusivement pour la communauté Lightning Pickleball. LPR est calculé sur la base de l'algorithme ELO appliqué à tous les résultats de matchs publics lightning, montrant votre parcours de croissance sur une échelle intuitive de 1 à 10. C'est un indicateur honorable de votre évolution au sein de notre écosystème.\n\nLPR est un système unique distinct du NTRP de l'USTA. Pour la commodité des utilisateurs familiers avec les évaluations NTRP, vous pouvez sélectionner votre niveau de compétence dans une plage similaire au NTRP lors de l'inscription, mais tous les niveaux officiels calculés et affichés dans l'application sont basés sur LPR.",

  'An error occurred while resetting league statistics.\n\n{{error}}':
    "Une erreur s'est produite lors de la réinitialisation des statistiques de ligue.\n\n{{error}}",

  'All participants have been assigned seeds.\nYou can now generate the tournament bpaddle.':
    'Tous les participants ont été attribués des séries.\nVous pouvez maintenant générer le tableau du tournoi.',

  'All participant additions failed.\n{{details}}':
    'Tous les ajouts de participants ont échoué.\n{{details}}',

  '{{count}} participant(s) added.\n{{names}}': '{{count}} participant(s) ajouté(s).\n{{names}}',

  // Remaining single-line values
  '2.0-3.0': '2.0-3.0',
  '3.0-4.0': '3.0-4.0',
  4: '4',
  '4.0-5.0': '4.0-5.0',
  '5.0+': '5.0+',
  '5.0+ (Expert)': '5.0+ (Expert)',
  'All participants must play each other once before playoffs can start.':
    'Tous les participants doivent jouer les uns contre les autres une fois avant le début des éliminatoires.',
  'An error occurred while loading the chat room: {{error}}':
    "Une erreur s'est produite lors du chargement du salon de discussion : {{error}}",
  'An error occurred while requesting to join.':
    "Une erreur s'est produite lors de la demande d'adhésion.",
  'An error occurred while sending the message.':
    "Une erreur s'est produite lors de l'envoi du message.",
  'An error occurred while starting matching.':
    "Une erreur s'est produite lors du démarrage du jumelage.",
  'At least 2 participants required to start (current: {{count}})':
    'Au moins 2 participants requis pour commencer (actuel : {{count}})',
  'At least 2 teams required to start (current: {{count}} teams)':
    'Au moins 2 équipes requises pour commencer (actuel : {{count}} équipes)',
  Badges: 'Badges',
  'Capacity: {{count}}': 'Capacité : {{count}}',
  "Click 'Auto Invoice' above to automatically send monthly invoices to all members.":
    "Cliquez sur 'Facturation automatique' ci-dessus pour envoyer automatiquement des factures mensuelles à tous les membres.",
  'Click matches to view details': 'Cliquez sur les matchs pour voir les détails',
  'Current Round: {{round}}': 'Tour actuel : {{round}}',
  'Delete all matches and reset league. This action cannot be undone.':
    'Supprimer tous les matchs et réinitialiser la ligue. Cette action ne peut pas être annulée.',
  'Delete all matches and reset tournament. This action cannot be undone.':
    'Supprimer tous les matchs et réinitialiser le tournoi. Cette action ne peut pas être annulée.',
  'Description *': 'Description *',
  'Doubles league requires minimum 2 teams (4 players). Current: {{count}} players':
    'La ligue de double nécessite un minimum de 2 équipes (4 joueurs). Actuel : {{count}} joueurs',
  'Doubles requires even participants (current: {{count}})':
    'Le double nécessite un nombre pair de participants (actuel : {{count}})',
  'Error removing participant: {{error}}':
    'Erreur lors de la suppression du participant : {{error}}',
  'Failed to add participant: {{error}}': "Échec de l'ajout du participant : {{error}}",
  'Generate Round {{round}}': 'Générer le tour {{round}}',
  'Generate bpaddle using assigned seeds and start the tournament':
    'Générer le tableau en utilisant les séries attribuées et démarrer le tournoi',
  'Generate tournament bpaddle and start the competition':
    'Générer le tableau du tournoi et commencer la compétition',
  'Generating Bpaddle...': 'Génération du tableau...',
  'Generating bpaddle...': 'Génération du tableau...',
  'Generating...': 'Génération...',
  'Go to Management tab and click "Open Registration"':
    'Allez dans l\'onglet Gestion et cliquez sur "Ouvrir les inscriptions"',
  'Junsu Kim': 'Junsu Kim',
  'League requires minimum 2 participants to start. Current: {{count}} participants':
    'La ligue nécessite un minimum de 2 participants pour commencer. Actuel : {{count}} participants',
  'Loading chat room...': 'Chargement du salon de discussion...',
  'Loading club information...': 'Chargement des informations du club...',
  'Loading honor badges...': "Chargement des badges d'honneur...",
  'Loading league information...': 'Chargement des informations de la ligue...',
  Login: 'Connexion',
  'Login required.': 'Connexion requise.',
  'Lunch (12-2pm)': 'Déjeuner (12h-14h)',
  'Mark Paid': 'Marquer comme payé',
  Match: 'Match',
  'Match Achievements': 'Succès de match',
  'Match Distribution by Time': 'Répartition des matchs par heure',
  'Match Frequency by Day': 'Fréquence des matchs par jour',
  'Match Progress': 'Progression du match',
  'Match result has been saved.': 'Le résultat du match a été enregistré.',
  'Match result has been submitted successfully.': 'Le résultat du match a été soumis avec succès.',
  'Matches per Week': 'Matchs par semaine',
  'Matches will appear here when they are scheduled':
    "Les matchs apparaîtront ici lorsqu'ils seront programmés",
  'Matching skill level...': 'Correspondance du niveau de compétence...',
  Max: 'Max',
  'Max Teams': 'Équipes maximum',
  'Max Travel Distance ({{unit}})': 'Distance de déplacement maximale ({{unit}})',
  'Maximum participants must be at least {{min}} (minimum required to start)':
    'Le nombre maximum de participants doit être au moins {{min}} (minimum requis pour commencer)',
  Meetup: 'Rencontre',
  'Member Dues Status': 'Statut des cotisations des membres',
  'Member Payment Status': 'Statut de paiement des membres',
  'Members Only Feature': 'Fonctionnalité réservée aux membres',
  'Members with Overdue Dues': 'Membres avec des cotisations en retard',
  Mental: 'Mental',
  'Min Participants': 'Participants minimum',
  'Minjae Park': 'Minjae Park',
  'Monthly Report': 'Rapport mensuel',
  'NTRP Skill Level': 'Niveau de compétence NTRP',
  'Navigate to privacy settings.': 'Accédez aux paramètres de confidentialité.',
  'Net Player': 'Joueur au filet',
  "Next Month's Goals": 'Objectifs du mois prochain',
  'Nickname *': 'Surnom *',
  'Nickname Required': 'Surnom requis',
  'Nickname Unavailable': 'Surnom non disponible',
  'Nickname is available!': 'Le surnom est disponible !',
  'No Information Available': 'Aucune information disponible',
  'No achievements yet. Start playing to earn trophies and badges!':
    'Aucun succès pour le moment. Commencez à jouer pour gagner des trophées et des badges !',
  'No applied activities': 'Aucune activité appliquée',
  'No approved participants. Please approve participants before submitting score.':
    'Aucun participant approuvé. Veuillez approuver les participants avant de soumettre le score.',
  'No dues records yet': 'Aucun enregistrement de cotisations pour le moment',
  'No matches yet': 'Aucun match pour le moment',
  'No members found': 'Aucun membre trouvé',
  'No public clubs available': 'Aucun club public disponible',
  'No search results': 'Aucun résultat de recherche',
  'No standings available': 'Aucun classement disponible',
  'No tournaments available': 'Aucun tournoi disponible',
  'Non-members can access all club tabs except League/Tournament. Join requests allowed.':
    "Les non-membres peuvent accéder à tous les onglets du club sauf Ligue/Tournoi. Demandes d'adhésion autorisées.",
  'Non-members cannot see Members tab (League/Tournament excluded). Join requests allowed.':
    "Les non-membres ne peuvent pas voir l'onglet Membres (Ligue/Tournoi exclu). Demandes d'adhésion autorisées.",
  Normal: 'Normal',
  'Not specified': 'Non spécifié',
  'Not yet earned': 'Pas encore gagné',
  Notes: 'Notes',
  Notification: 'Notification',
  OK: 'OK',
  'On Fire': 'En feu',
  Ongoing: 'En cours',
  'Open registration to accept participants':
    'Ouvrez les inscriptions pour accepter les participants',
  'Participant List': 'Liste des participants',
  'Participants ({{count}})': 'Participants ({{count}})',
  'Participants cannot form teams. Please check partner information for each participant.':
    "Les participants ne peuvent pas former d'équipes. Veuillez vérifier les informations de partenaire pour chaque participant.",
  'Participants: {{current}}/{{max}}': 'Participants : {{current}}/{{max}}',
  'Partner Invitations': 'Invitations de partenaire',
  'Payment Methods': 'Modes de paiement',
  'Payment Summary': 'Résumé du paiement',
  'Pending Approval': "En attente d'approbation",
  'Pending Match Results': 'Résultats de match en attente',
  'Phone Number': 'Numéro de téléphone',
  Physical: 'Physique',
  'Pick a court': 'Choisissez un court',
  'Play Against': 'Jouer contre',
  'Played {{count}} matches': 'A joué {{count}} matchs',
  'Player Information': 'Informations sur le joueur',
  'Player not found': 'Joueur non trouvé',
  'Playing Frequency': 'Fréquence de jeu',
  'Playing Time': 'Temps de jeu',
  'Please complete your profile first': "Veuillez d'abord compléter votre profil",
  'Please enter an event description': "Veuillez entrer une description de l'événement",
  'Please enter event date': "Veuillez entrer la date de l'événement",
  'Please enter event title': "Veuillez entrer le titre de l'événement",
  'Please select a match time.': 'Veuillez sélectionner une heure de match.',
  'Please select a match type': 'Veuillez sélectionner un type de match',
  'Please select a tournament format': 'Veuillez sélectionner un format de tournoi',
  'Please select court type': 'Veuillez sélectionner le type de court',
  'Please select end date and time': "Veuillez sélectionner la date et l'heure de fin",
  'Please select league format': 'Veuillez sélectionner le format de la ligue',
  'Please select skill level': 'Veuillez sélectionner le niveau de compétence',
  'Please select start date and time': "Veuillez sélectionner la date et l'heure de début",
  'Please select the winner': 'Veuillez sélectionner le gagnant',
  'Please set match location': 'Veuillez définir le lieu du match',
  'Playoff Matches': 'Matchs éliminatoires',
  Power: 'Puissance',
  Practice: 'Entraînement',
  'Prefer Not to Say': 'Préfère ne pas dire',
  'Preferred Court': 'Court préféré',
  'Preferred Gender': 'Genre préféré',
  Privacy: 'Confidentialité',
  'Private Club': 'Club privé',
  'Profile completion required': 'Complétion du profil requise',
  'Profile is not complete': "Le profil n'est pas complet",
  Progression: 'Progression',
  'QR Code': 'Code QR',
  'Quarter Finals': 'Quarts de finale',
  'Quick Match': 'Match rapide',
  'Rain Forecast': 'Prévisions de pluie',
  'Rainy Day': 'Jour pluvieux',
  Rank: 'Rang',
  'Rank #{{rank}}': 'Rang n°{{rank}}',
  'Ranking System': 'Système de classement',
  'Ranking Tier': 'Niveau de classement',
  Ratings: 'Évaluations',
  Read: 'Lu',
  'Ready to Play': 'Prêt à jouer',
  'Recent Activity': 'Activité récente',
  'Recent Performance': 'Performance récente',
  Recreational: 'Récréatif',
  Register: "S'inscrire",
  'Registered Players': 'Joueurs inscrits',
  'Registration Deadline': "Date limite d'inscription",
  'Registration Status': "Statut d'inscription",
  'Reject All': 'Tout rejeter',
  Rematch: 'Revanche',
  'Request Sent': 'Demande envoyée',
  Requests: 'Demandes',
  'Reset All': 'Tout réinitialiser',
  'Result Submission': 'Soumission du résultat',
  'Results Pending': 'Résultats en attente',
  'Rising Star': 'Étoile montante',
  'Round {{number}}': 'Tour {{number}}',
  Sat: 'Sam',
  'Save Profile': 'Enregistrer le profil',
  'Schedule Match': 'Programmer un match',
  'Score Recorded': 'Score enregistré',
  'Score Submission': 'Soumission du score',
  'Scores & Results': 'Scores et résultats',
  'Search by name': 'Rechercher par nom',
  'Search for players': 'Rechercher des joueurs',
  'Season Summary': 'Résumé de la saison',
  'Seeded Players': 'Joueurs têtes de série',
  Seeding: 'Attribution des séries',
  'Seeding Complete': 'Attribution des séries terminée',
  'Select Court': 'Sélectionner le court',
  'Select Gender': 'Sélectionner le genre',
  'Select Location': 'Sélectionner le lieu',
  'Select Match Date': 'Sélectionner la date du match',
  'Select Opponent': "Sélectionner l'adversaire",
  'Select Partner': 'Sélectionner le partenaire',
  'Select Preferred Time': "Sélectionner l'heure préférée",
  'Select Skill Range': 'Sélectionner la plage de compétence',
  'Select Teams': 'Sélectionner les équipes',
  'Select Winner': 'Sélectionner le gagnant',
  'Select match date': 'Sélectionner la date du match',
  'Select participants': 'Sélectionner les participants',
  'Semi Finals': 'Demi-finales',
  'Send Request': 'Envoyer une demande',
  Serving: 'Service',
  'Set Date': 'Définir la date',
  'Set Match Time': "Définir l'heure du match",
  'Set Partner': 'Définir le partenaire',
  'Set Score': 'Définir le score',
  'Set Time': "Définir l'heure",
  'Set as Home Court': 'Définir comme court principal',
  'Sets Played': 'Sets joués',
  'Setup Complete': 'Configuration terminée',
  'Share Match': 'Partager le match',
  'Show Details': 'Afficher les détails',
  'Show Participants': 'Afficher les participants',
  'Skill Comparison': 'Comparaison des compétences',
  'Skill Distribution': 'Répartition des compétences',
  'Social Player': 'Joueur social',
  Speed: 'Vitesse',
  Stamina: 'Endurance',
  Standings: 'Classement',
  'Start Match': 'Commencer le match',
  'Start Playoffs': 'Commencer les éliminatoires',
  'Start Round': 'Commencer le tour',
  'Start Tournament': 'Commencer le tournoi',
  'Start league': 'Commencer la ligue',
  'Starting Soon': 'Commence bientôt',
  'Strong Serve': 'Service puissant',
  'Submit Score': 'Soumettre le score',
  'Submission Failed': 'Échec de la soumission',
  'Sunny Day': 'Journée ensoleillée',
  'Super Champion': 'Super champion',
  System: 'Système',
  'Team A': 'Équipe A',
  'Team B': 'Équipe B',
  'Team Details': "Détails de l'équipe",
  'Team Formation': "Formation d'équipe",
  'Team Info': "Informations sur l'équipe",
  'Team Match': "Match d'équipe",
  'Team Name': "Nom de l'équipe",
  'Team Partner': "Partenaire d'équipe",
  'Team Players': "Joueurs de l'équipe",
  'Team Stats': "Statistiques d'équipe",
  'Teams Ready': 'Équipes prêtes',
  Technical: 'Technique',
  'The league has not started yet': "La ligue n'a pas encore commencé",
  'This feature is only available to club members':
    "Cette fonctionnalité n'est disponible que pour les membres du club",
  'This feature requires a premium subscription':
    'Cette fonctionnalité nécessite un abonnement premium',
  'This match will not affect your rating': "Ce match n'affectera pas votre classement",
  'This tournament has not started yet': "Ce tournoi n'a pas encore commencé",
  'Time Preference': 'Préférence horaire',
  'Time Remaining': 'Temps restant',
  'Title *': 'Titre *',
  'Total Earnings': 'Gains totaux',
  'Total Hours': 'Heures totales',
  'Total Members': 'Total des membres',
  'Total Points': 'Points totaux',
  'Total Wins': 'Victoires totales',
  'Tournament Bpaddles': 'Tableaux du tournoi',
  'Tournament Dashboard': 'Tableau de bord du tournoi',
  'Tournament Ended': 'Tournoi terminé',
  'Tournament Info': 'Informations sur le tournoi',
  'Tournament Progress': 'Progression du tournoi',
  'Tournament Results': 'Résultats du tournoi',
  'Tournament Settings': 'Paramètres du tournoi',
  'Tournament Started': 'Tournoi commencé',
  'Tournament Summary': 'Résumé du tournoi',
  'Upcoming Events': 'Événements à venir',
  'Upcoming Tournament': 'Tournoi à venir',
  'Update Profile': 'Mettre à jour le profil',
  'Verify Email': "Vérifier l'email",
  'View All Achievements': 'Voir tous les succès',
  'View All Matches': 'Voir tous les matchs',
  'View All Stats': 'Voir toutes les statistiques',
  'View Bpaddle': 'Voir le tableau',
  'View Dashboard': 'Voir le tableau de bord',
  'View League': 'Voir la ligue',
  'View Match Details': 'Voir les détails du match',
  'View Playoff Matches': 'Voir les matchs éliminatoires',
  'Wait for club members to register for the tournament':
    "Attendez que les membres du club s'inscrivent au tournoi",
  "We'll notify you when new leagues are available.":
    'Nous vous informerons lorsque de nouvelles ligues seront disponibles.',
  "We'll notify you when new tournaments are available.":
    'Nous vous informerons lorsque de nouveaux tournois seront disponibles.',
  'Week 1': 'Semaine 1',
  'Week 2': 'Semaine 2',
  'Week 3': 'Semaine 3',
  'Week 4': 'Semaine 4',
  'Weekly win rate changes': 'Changements hebdomadaires du taux de victoire',
  'Welcome to the chat room! Feel free to discuss about the event.':
    "Bienvenue dans le salon de discussion ! N'hésitez pas à discuter de l'événement.",
  'What is LPR?': "Qu'est-ce que LPR ?",
  'Win 10 matches in a row': "Gagnez 10 matchs d'affilée",
  'Win 3 matches in a row': "Gagnez 3 matchs d'affilée",
  'Win 5 matches in a row': "Gagnez 5 matchs d'affilée",
  'Win Rate Trend': 'Tendance du taux de victoire',
  'Winner: ': 'Gagnant : ',
  'Would you like to edit this event?': 'Souhaitez-vous modifier cet événement ?',
  'Would you like to request to join {{clubName}}?':
    'Souhaitez-vous demander à rejoindre {{clubName}} ?',
  Yearly: 'Annuel',
  'Yearly Fee': 'Frais annuels',
  'You are already a member of this club.': 'Vous êtes déjà membre de ce club.',
  'You are not authorized to access this chat room. Please apply to the event and get approved first.':
    "Vous n'êtes pas autorisé à accéder à ce salon de discussion. Veuillez vous inscrire à l'événement et obtenir une approbation d'abord.",
  'You have already requested to join.': 'Vous avez déjà demandé à rejoindre.',
  'Your account has been deleted.': 'Votre compte a été supprimé.',
  'Your achievements and honors': 'Vos succès et honneurs',
  approved: 'approuvé',
  badges: 'badges',
  friend: 'ami',
  '{{count}} participant(s) added.': '{{count}} participant(s) ajouté(s).',
};

// Recursive translation with exact matching
function ultraTranslate(frObj, enObj) {
  const result = {};

  for (const key in enObj) {
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      result[key] = ultraTranslate(frValue || {}, enValue);
    } else {
      // Use exact match from ULPRA_DICT
      if (frValue === undefined || frValue === enValue) {
        result[key] = ULPRA_DICT[enValue] !== undefined ? ULPRA_DICT[enValue] : enValue;
      } else {
        result[key] = frValue;
      }
    }
  }

  return result;
}

console.log('🚀🚀🚀 ULPRA-FINAL French Translation - Multi-line Support!\n');
console.log(`📚 Dictionary entries: ${Object.keys(ULPRA_DICT).length}\n`);

fr = ultraTranslate(fr, en);

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');

console.log('✅ ULPRA-FINAL translation complete!\n');
console.log(`📁 Updated: ${frPath}\n`);
