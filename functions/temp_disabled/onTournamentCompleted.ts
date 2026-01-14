/**
 * Cloud Function to award trophies when tournaments are completed
 * Triggered when a league tournament status changes to 'completed'
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Helper function to get current season
 */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return `Spring ${year}`;
  if (month >= 6 && month <= 8) return `Summer ${year}`;
  if (month >= 9 && month <= 11) return `Fall ${year}`;
  return `Winter ${year}`;
}

/**
 * Helper function to get club's primary color for theming
 */
async function getClubPrimaryColor(clubId: string): Promise<string | undefined> {
  try {
    const clubDoc = await db.collection('pickleball_clubs').doc(clubId).get();
    if (clubDoc.exists) {
      const clubData = clubDoc.data();
      return clubData?.theme?.primaryColor || clubData?.settings?.brandColor;
    }
  } catch (error) {
    console.log(`Could not fetch club color for ${clubId}:`, error);
  }
  return undefined;
}

/**
 * Awards trophies to tournament winners and runners-up
 * Creates trophy records in users/{userId}/trophies subcollection
 */
export const onTournamentCompleted = functions.firestore
  .document('regular_leagues/{leagueId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const { leagueId } = context.params;

      // Only trigger when tournament status changes to 'completed'
      if (before.status !== 'completed' && after.status === 'completed') {
        console.log(`🏆 Tournament completed: ${leagueId}`);

        // Get tournament winner and runner-up from final match results
        const { winner, runnerUp, name: leagueName, clubId, endDate } = after;

        // If winner/runner-up are not directly stored, find them from matches
        let tournamentWinner = winner;
        let tournamentRunnerUp = runnerUp;

        if (!tournamentWinner || !tournamentRunnerUp) {
          // Find final match to determine winner and runner-up
          const finalMatchQuery = await db
            .collection('regular_leagues')
            .doc(leagueId)
            .collection('matches')
            .where('status', '==', 'completed')
            .orderBy('round', 'desc')
            .limit(1)
            .get();

          if (!finalMatchQuery.empty) {
            const finalMatch = finalMatchQuery.docs[0].data();
            tournamentWinner = finalMatch.winner;
            // Runner-up is the loser of the final match
            tournamentRunnerUp = finalMatch.players?.find(
              p => p.userId !== tournamentWinner
            )?.userId;
          }
        }

        if (!tournamentWinner) {
          console.log('⚠️ No tournament winner found, skipping trophy awards');
          return null;
        }

        // Get club information for trophy context
        let clubName = 'Pickleball Club';
        try {
          const clubDoc = await db.collection('pickleball_clubs').doc(clubId).get();
          if (clubDoc.exists) {
            const clubData = clubDoc.data();
            clubName = clubData.name || clubData.profile?.name || 'Pickleball Club';
          }
        } catch (error) {
          console.log('⚠️ Could not fetch club data for trophy context');
        }

        const batch = db.batch();
        const completionDate = endDate || admin.firestore.FieldValue.serverTimestamp();

        // Award winner trophy (Gold Medal)
        if (tournamentWinner) {
          const winnerTrophyRef = db
            .collection('users')
            .doc(tournamentWinner)
            .collection('trophies')
            .doc();

          const winnerTrophy = {
            rank: 'Winner',
            position: 1,
            name: `${leagueName} 우승`,
            tournamentName: leagueName,
            clubName: clubName,
            clubId: clubId,
            leagueId: leagueId,
            trophyType: 'tournament_winner',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'trophy-variant',
              color: '#FFD700',
              tier: 'gold',
              season: getCurrentSeason(),
              clubTheme: {
                clubId: clubId,
                customColor: await getClubPrimaryColor(clubId),
              },
            },
            // Legacy emoji field for backwards compatibility
            medal: '🥇',
            date: completionDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            season: new Date().getFullYear().toString(),
          };

          batch.set(winnerTrophyRef, winnerTrophy);
          console.log(`🥇 Gold trophy awarded to winner: ${tournamentWinner}`);
        }

        // Award runner-up trophy (Silver Medal)
        if (tournamentRunnerUp) {
          const runnerUpTrophyRef = db
            .collection('users')
            .doc(tournamentRunnerUp)
            .collection('trophies')
            .doc();

          const runnerUpTrophy = {
            rank: 'Runner-up',
            position: 2,
            name: `${leagueName} 준우승`,
            tournamentName: leagueName,
            clubName: clubName,
            clubId: clubId,
            leagueId: leagueId,
            trophyType: 'tournament_runnerup',
            icon: {
              set: 'MaterialCommunityIcons',
              name: 'medal',
              color: '#C0C0C0',
              tier: 'silver',
              season: getCurrentSeason(),
              clubTheme: {
                clubId: clubId,
                customColor: await getClubPrimaryColor(clubId),
              },
            },
            // Legacy emoji field for backwards compatibility
            medal: '🥈',
            date: completionDate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            season: new Date().getFullYear().toString(),
          };

          batch.set(runnerUpTrophyRef, runnerUpTrophy);
          console.log(`🥈 Silver trophy awarded to runner-up: ${tournamentRunnerUp}`);
        }

        // Update user statistics
        if (tournamentWinner) {
          const winnerStatsRef = db.collection('users').doc(tournamentWinner);
          batch.update(winnerStatsRef, {
            'stats.tournamentsWon': admin.firestore.FieldValue.increment(1),
            'stats.totalTrophies': admin.firestore.FieldValue.increment(1),
            'stats.lastTournamentWin': completionDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        if (tournamentRunnerUp) {
          const runnerUpStatsRef = db.collection('users').doc(tournamentRunnerUp);
          batch.update(runnerUpStatsRef, {
            'stats.tournamentsRunnerUp': admin.firestore.FieldValue.increment(1),
            'stats.totalTrophies': admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Commit all trophy awards and stat updates
        await batch.commit();

        // Create celebration feed items
        if (tournamentWinner) {
          await db.collection('feed').add({
            type: 'tournament_trophy_awarded',
            userId: tournamentWinner,
            clubId: clubId,
            leagueId: leagueId,
            text: `🏆 축하합니다! ${leagueName}의 우승자에게 금메달 트로피가 수여되었습니다! ${clubName}의 새로운 챔피언을 축하해주세요! 🥇`,
            content: {
              title: '트로피 수여',
              body: `${leagueName} 토너먼트 우승 트로피가 수여되었습니다!`,
            },
            metadata: {
              trophyType: 'winner',
              leagueName: leagueName,
              clubName: clubName,
              position: 1,
            },
            visibility: 'club_members',
            likes: [],
            comments: [],
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        console.log(`✅ Tournament trophies awarded successfully for ${leagueId}`);
      }

      return null;
    } catch (error) {
      console.error('❌ Error in onTournamentCompleted:', error);
      // Don't throw - we don't want to fail the original tournament update
      return null;
    }
  });
