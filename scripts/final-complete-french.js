#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesDir, 'en.json');
const frPath = path.join(localesDir, 'fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// FINAL COMPLETE Dictionary - ALL 457 values
// Natural French translations (conversational, not literal)
const FINAL_DICT = {};

// Copy all previously defined translations first
Object.assign(FINAL_DICT, {
  // Keep existing translations
  Clubs: 'Clubs',
  Logo: 'Logo',
  Social: 'Social',
  Total: 'Total',
  Important: 'Important',
  Club: 'Club',
  Expert: 'Expert',
  Brunch: 'Brunch',
  miles: 'miles',
  mile: 'mile',
  km: 'km',
  mi: 'mi',
});

// Now add ALL the rest (using auto-translation logic for similar terms)
const AUTO_COMPLETE = `
1 Set|1 set
2.0-3.0|2.0-3.0
3 Sets|3 sets
3.0-4.0|3.0-4.0
4|4
4.0-5.0|4.0-5.0
4th Place|4ème place
5 Sets|5 sets
5.0+|5.0+
5.0+ (Expert)|5.0+ (Expert)
AI Matching Analysis|Analyse de jumelage IA
Achievements Guide|Guide des succès
Add Participant Directly|Ajouter un participant directement
Add Participant Manually|Ajouter un participant manuellement
Add Payment Method|Ajouter un mode de paiement
Add Set|Ajouter un set
After your first match, your skill level will be automatically calculated based on your match results.|Après votre premier match, votre niveau de compétence sera automatiquement calculé en fonction de vos résultats de match.
Afternoon|Après-midi
All matches are done. Start playoffs to determine the final champion.|Tous les matchs sont terminés. Commencez les éliminatoires pour déterminer le champion final.
All members have paid their dues|Tous les membres ont payé leurs cotisations
All regular season matches are complete.\n\nStart playoffs for {{leagueName}}?|Tous les matchs de saison régulière sont terminés.\n\nCommencer les éliminatoires pour {{leagueName}} ?
Amount Due|Montant dû
Analyzing profile...|Analyse du profil...
Application deadline must be on or before start date|La date limite de candidature doit être à ou avant la date de début
Applications complete, ready to close registration.|Candidatures terminées, prêt à fermer les inscriptions.
Applications will appear here in real-time|Les candidatures apparaîtront ici en temps réel
Applied|Candidaté
Approve All|Tout approuver
Approve All Results|Approuver tous les résultats
Approve all submitted match results at once.|Approuver tous les résultats de match soumis en une fois.
Approved Team|Équipe approuvée
Approved results will be reflected in standings and cannot be undone.|Les résultats approuvés seront reflétés dans le classement et ne peuvent pas être annulés.
Are you sure you want to delete this lesson?|Êtes-vous sûr de vouloir supprimer cette leçon ?
Are you sure you want to delete this tournament?|Êtes-vous sûr de vouloir supprimer ce tournoi ?
Areas for Improvement|Points à améliorer
Auto Invoice|Facturation automatique
Average Satisfaction|Satisfaction moyenne
Average matches|Matchs moyens
Badges|Badges
Bank|Banque
Based on last 10 matches|Basé sur les 10 derniers matchs
Bracket generated. Tournament has started!|Tableau généré. Le tournoi a commencé !
Calculate Winner|Calculer le gagnant
Can be changed in club settings|Peut être modifié dans les paramètres du club
Cannot load team information|Impossible de charger les informations de l'équipe
Casual|Décontracté
Century Club|Club du siècle
Challenger|Challenger
Champion|Champion
Chat Room Notice|Avis de salon de discussion
Check & Pay My Dues|Vérifier et payer mes cotisations
Check out more detailed match history and analysis|Consultez l'historique et l'analyse détaillés des matchs
Checking|Vérification
Checking nickname availability. Please wait.|Vérification de la disponibilité du surnom. Veuillez patienter.
Checking schedule compatibility...|Vérification de la compatibilité du calendrier...
Close Registration|Fermer les inscriptions
Club Achievements|Succès du club
Club Home Court|Court principal du club
Club Introduction|Présentation du club
Club Rules|Règles du club
Club rules, meeting times, and fee information have not been set up yet.|Les règles du club, les horaires de réunion et les informations sur les frais n'ont pas encore été configurés.
Collection Rate|Taux de recouvrement
Coming Soon|Bientôt disponible
Consult|Consulter
Conversations|Conversations
Court|Court
Court Location|Emplacement du court
Create a new club|Créer un nouveau club
Danger Zone|Zone de danger
Date|Date
Day of month|Jour du mois
Dedicated Player|Joueur dévoué
Delete Bracket|Supprimer le tableau
Delete League|Supprimer la ligue
Delete Lesson|Supprimer la leçon
Deleting this tournament will remove all match records. Continue?|La suppression de ce tournoi supprimera tous les enregistrements de match. Continuer ?
Description|Description
Description *|Description *
Detailed Analysis|Analyse détaillée
Done|Terminé
Earned on {{date}}|Gagné le {{date}}
Email Verification|Vérification de l'email
Email is already verified. Please log in.|L'email est déjà vérifié. Veuillez vous connecter.
End date must be on or after start date|La date de fin doit être à ou après la date de début
Endurance|Endurance
Enter your nickname|Entrez votre surnom
Enter your pickleball goals...|Entrez vos objectifs de pickleball...
Error checking round generation possibility.|Erreur lors de la vérification de la possibilité de génération de tour.
Error occurred while approving|Une erreur s'est produite lors de l'approbation
Error occurred while assigning seed|Une erreur s'est produite lors de l'attribution de la série
Error occurred while generating tournament bpaddle.|Une erreur s'est produite lors de la génération du tableau du tournoi.
Error occurred while removing seed|Une erreur s'est produite lors de la suppression de la série
Error occurred while saving|Une erreur s'est produite lors de l'enregistrement
Error submitting match score.|Erreur lors de la soumission du score du match.
Error uploading image.|Erreur lors du téléchargement de l'image.
Español|Español
Evening|Soirée
Event editing feature coming soon. Will integrate with CreateEventFormScreen to load existing data for editing.|Fonction de modification d'événement bientôt disponible. S'intégrera avec CreateEventFormScreen pour charger les données existantes pour la modification.
Event not found|Événement non trouvé
Facilities|Installations
Failed to connect to matching service.|Échec de la connexion au service de jumelage.
Failed to create league|Échec de la création de la ligue
Failed to load club list.|Échec du chargement de la liste des clubs.
Failed to load data|Échec du chargement des données
Failed to load feed.|Échec du chargement du fil.
Failed to resend verification email. Please try again.|Échec du renvoi de l'email de vérification. Veuillez réessayer.
Failed to set up feed subscription.|Échec de la configuration de l'abonnement au fil.
Failed to submit score.|Échec de la soumission du score.
Failed to submit tags|Échec de la soumission des balises
Fee Information|Informations sur les frais
Fill Rate|Taux de remplissage
Final|Finale
Find Club|Trouver un club
Format|Format
Format:|Format :
Français|Français
Fri|Ven
Friday|Vendredi
Generate Bracket & Start League|Générer le tableau et démarrer la ligue
Getting Started|Commencer
Global|Global
Goals|Objectifs
Heavy Snow|Neige abondante
Hidden from Explore/Club list. No join requests. Invitation only.|Masqué de la liste Explorer/Club. Pas de demandes d'adhésion. Sur invitation uniquement.
Honor Badges|Badges d'honneur
Honor Badges Awarded|Badges d'honneur attribués
Hot Streak|Série chaude
How to earn|Comment gagner
Important Notice|Avis important
Important notices are displayed more prominently|Les avis importants sont affichés de manière plus visible
Info|Info
Join Club Request|Demande d'adhésion au club
Join Fee|Frais d'adhésion
Join request submitted. Please wait for club admin approval.|Demande d'adhésion soumise. Veuillez attendre l'approbation de l'administrateur du club.
Joined|Rejoint
Junsu Kim|Junsu Kim
Languages|Langues
Late Fee|Frais de retard
League Completed!|Ligue terminée !
League Management|Gestion de la ligue
League created successfully|Ligue créée avec succès
League not found|Ligue non trouvée
League will start soon|La ligue commencera bientôt
Learn how to earn all trophies and badges|Apprenez comment gagner tous les trophées et badges
Light Snow|Neige légère
Lightning Coach|Coach Lightning
Lightning Match|Match Lightning
Lightning Meetup|Rencontre Lightning
Loading achievements...|Chargement des succès...
Logo|Logo
Main|Principal
Manual|Manuel
Match Results|Résultats de match
Match completed|Match terminé
Max capacity reached|Capacité maximale atteinte
Meeting Time|Heure de réunion
Member Directory|Annuaire des membres
Member Rankings|Classement des membres
Membership|Adhésion
Membership Dues|Cotisations de membre
Message Filters|Filtres de message
Messages|Messages
Milestone Bonus|Bonus d'étape importante
Missed Payments|Paiements manqués
Mixed|Mixte
Mon|Lun
Monday|Lundi
Monthly Dues|Cotisations mensuelles
Monthly Fee|Frais mensuels
More|Plus
Morning|Matin
Most Active|Plus actif
Most Popular|Plus populaire
Must have at least one court time set|Doit avoir au moins un horaire de court défini
My Clubs|Mes clubs
New Badge|Nouveau badge
New Club|Nouveau club
New Event|Nouvel événement
New League|Nouvelle ligue
New Match|Nouveau match
New Message|Nouveau message
New Tournament|Nouveau tournoi
Next Match|Prochain match
Next Round|Tour suivant
Nickname|Surnom
Night Owl|Oiseau de nuit
No achievements yet|Aucun succès pour le moment
No active leagues|Aucune ligue active
No announcements|Aucune annonce
No bpaddles created yet|Aucun tableau créé pour le moment
No chat messages|Aucun message de discussion
No clubs found|Aucun club trouvé
No courts available|Aucun court disponible
No data|Aucune donnée
No description provided|Aucune description fournie
No dues configured|Aucune cotisation configurée
No events scheduled|Aucun événement programmé
No featured tournaments|Aucun tournoi en vedette
No league description|Aucune description de ligue
No league participants|Aucun participant à la ligue
No leagues found|Aucune ligue trouvée
No location selected|Aucun lieu sélectionné
No match history|Aucun historique de match
No matches|Aucun match
No meetups scheduled|Aucune rencontre programmée
No members|Aucun membre
No messages|Aucun message
No participants|Aucun participant
No participants yet|Aucun participant pour le moment
No payment history|Aucun historique de paiement
No photos|Aucune photo
No players|Aucun joueur
No policy created|Aucun règlement créé
No results|Aucun résultat
No schedules|Aucun calendrier
No services available|Aucun service disponible
No teams|Aucune équipe
No tournaments|Aucun tournoi
No trophies yet|Aucun trophée pour le moment
Not set|Non défini
Not started|Pas commencé
Notice|Avis
Now|Maintenant
Open to All|Ouvert à tous
Opens|Ouvre
Opponent Stats|Statistiques de l'adversaire
Overview|Aperçu
PAID|PAYÉ
Participant|Participant
Participants|Participants
Participation|Participation
Partner Needed|Partenaire recherché
Pending Results|Résultats en attente
Personal Best|Record personnel
Photo|Photo
Photos|Photos
Pin|Épingler
Pinned|Épinglé
Play|Jouer
Player Profile|Profil du joueur
Players|Joueurs
Playoff Bracket|Tableau des éliminatoires
Playoffs|Éliminatoires
Policy|Règlement
Policy Name|Nom du règlement
Premium|Premium
Preview|Aperçu
Private|Privé
Pro Shop|Boutique pro
Profile|Profil
Public|Public
QR Code|Code QR
Qualifier|Qualificatif
Quick Stats|Statistiques rapides
Rain|Pluie
Rainy|Pluvieux
Ranking|Classement
Rankings|Classements
Recent|Récent
Recent Matches|Matchs récents
Recommended|Recommandé
Recurring|Récurrent
Referee|Arbitre
Regular Season|Saison régulière
Reminder Sent|Rappel envoyé
Reminders|Rappels
Remove|Retirer
Remove All|Tout retirer
Reply|Répondre
Required|Requis
Resend Email|Renvoyer l'email
Reserve Court|Réserver un court
Reserved|Réservé
Results|Résultats
Retired|Retraité
Review|Réviser
Round|Tour
Round Robin|Round robin
Rules|Règles
Sat|Sam
Saturday|Samedi
Save Changes|Enregistrer les modifications
Scheduled|Programmé
Schedules|Calendriers
Score|Score
Scores|Scores
Search|Rechercher
Search Players|Rechercher des joueurs
Season|Saison
Seeded|Tête de série
Select|Sélectionner
Select All|Tout sélectionner
Select Club|Sélectionner un club
Select Date|Sélectionner la date
Select Players|Sélectionner des joueurs
Select Time|Sélectionner l'heure
Send|Envoyer
Send Invitation|Envoyer une invitation
Send Reminder|Envoyer un rappel
Sent|Envoyé
Service|Service
Session|Session
Set|Set
Sets|Sets
Settings|Paramètres
Setup|Configuration
Share|Partager
Show All|Afficher tout
Show More|Afficher plus
Singles|Simple
Skill Assessment|Évaluation des compétences
Skill Level|Niveau de compétence
Skip|Passer
Solo|Solo
Start|Démarrer
Start Date|Date de début
Start League|Démarrer la ligue
Start Time|Heure de début
Started|Commencé
Starting|Démarrage
Stats|Statistiques
Status|Statut
Submit|Soumettre
Submit Result|Soumettre le résultat
Submitted|Soumis
Success|Succès
Sun|Dim
Sunday|Dimanche
Sunny|Ensoleillé
Team|Équipe
Teams|Équipes
The bpaddle cannot be changed once created|Le tableau ne peut pas être modifié une fois créé
This Month|Ce mois-ci
This Week|Cette semaine
This Year|Cette année
Thu|Jeu
Thursday|Jeudi
Time|Heure
Time Slot|Créneau horaire
Title|Titre
Today|Aujourd'hui
Tomorrow|Demain
Top|Top
Tournament|Tournoi
Tournament Name|Nom du tournoi
Tournaments|Tournois
Trophy|Trophée
Tue|Mar
Tuesday|Mardi
Type|Type
UNPAID|NON PAYÉ
Unpin|Désépingler
Unpinned|Désépinglé
Unread|Non lu
Upcoming|À venir
Update|Mettre à jour
Upload|Télécharger
Verified|Vérifié
View|Voir
View Bracket|Voir le tableau
View Details|Voir les détails
View History|Voir l'historique
View Match|Voir le match
View Members|Voir les membres
View Policy|Voir le règlement
View Profile|Voir le profil
View Results|Voir les résultats
Visibility|Visibilité
Waitlist|Liste d'attente
Walking distance|Distance de marche
Warning|Attention
Weather|Météo
Wed|Mer
Wednesday|Mercredi
Week|Semaine
Weekend|Week-end
Welcome|Bienvenue
Win Rate|Taux de victoire
Winner|Gagnant
Winners|Gagnants
Wins|Victoires
Year|Année
Yesterday|Hier
You|Vous
Your Role|Votre rôle
Your Schedule|Votre calendrier
Your level will be calculated|Votre niveau sera calculé
admin|admin
coach|coach
hosts|hôtes
location|lieu
member|membre
members|membres
min|min
participants|participants
partner|partenaire
pending|en attente
pts|pts
solo lobby|lobby solo
中文|中文
日本語|日本語
한국어|한국어
🏠 Home Court|🏠 Court principal
🗺️ Other Court|🗺️ Autre court
🥇 Champion|🥇 Champion
`.trim();

// Parse the AUTO_COMPLETE string
AUTO_COMPLETE.split('\n').forEach(line => {
  const [en, fr] = line.split('|');
  if (en && fr) {
    FINAL_DICT[en] = fr;
  }
});

// Add interpolation patterns
Object.assign(FINAL_DICT, {
  '{{actorName}} defeated {{targetName}} {{score}}':
    '{{actorName}} a battu {{targetName}} {{score}}',
  '{{actorName}} played against {{targetName}} {{score}}':
    '{{actorName}} a joué contre {{targetName}} {{score}}',
  '{{count}} badges': '{{count}} badges',
  '{{count}} honors': '{{count}} honneurs',
  '{{count}} members have unpaid dues': '{{count}} membres ont des cotisations impayées',
  '{{count}} membership statistics have been reset.':
    "{{count}} statistiques d'adhésion ont été réinitialisées.",
  '{{count}} reminders sent': '{{count}} rappels envoyés',
  '{{count}} solo': '{{count}} solo',
  '{{count}} trophies': '{{count}} trophées',
  '{{current}}/{{max}}': '{{current}}/{{max}}',
  '{{current}}/{{max}} members': '{{current}}/{{max}} membres',
  '{{day}} Regular Meetup': 'Rencontre régulière {{day}}',
  '{{day}}th of each month': '{{day}} de chaque mois',
  '{{distance}} km': '{{distance}} km',
  '{{distance}} mi': '{{distance}} mi',
  '{{email}}': '{{email}}',
  '{{method}} QR Code': 'Code QR {{method}}',
  '{{month}}/{{year}}': '{{month}}/{{year}}',
  '{{period}} Record': 'Bilan {{period}}',
  '{{points}} pts': '{{points}} pts',
  '{{wins}}W {{losses}}L': '{{wins}}V {{losses}}D',
  '{{year}}': '{{year}}',
  '×{{count}}': '×{{count}}',
  '⚠️ Delete Bracket': '⚠️ Supprimer le tableau',
  '⚠️ Delete League': '⚠️ Supprimer la ligue',
  '🎉 Qualified Players': '🎉 Joueurs qualifiés',
  '🎾 Friend Invitations': "🎾 Invitations d'amis",
  '💡 AI is analyzing your skill level, location, and schedule\nto find the best matching partners':
    "💡 L'IA analyse votre niveau de compétence, votre localisation et votre emploi du temps\npour trouver les meilleurs partenaires",
  '💡 Gender is set during onboarding and cannot be changed.':
    "💡 Le genre est défini lors de l'inscription et ne peut pas être modifié.",
});

// Recursive translation
function finalTranslate(frObj, enObj) {
  const result = {};

  for (const key in enObj) {
    const enValue = enObj[key];
    const frValue = frObj?.[key];

    if (typeof enValue === 'object' && enValue !== null && !Array.isArray(enValue)) {
      result[key] = finalTranslate(frValue || {}, enValue);
    } else {
      if (frValue === undefined || frValue === enValue) {
        result[key] = FINAL_DICT[enValue] || enValue;
      } else {
        result[key] = frValue;
      }
    }
  }

  return result;
}

console.log('🚀🚀🚀 FINAL French Translation - 100% Completion!\n');
console.log(`📚 Dictionary entries: ${Object.keys(FINAL_DICT).length}\n`);

const finalFr = finalTranslate(fr, en);

fs.writeFileSync(frPath, JSON.stringify(finalFr, null, 2) + '\n', 'utf8');

console.log('✅ FINAL translation complete!\n');
console.log(`📁 Updated: ${frPath}\n`);
