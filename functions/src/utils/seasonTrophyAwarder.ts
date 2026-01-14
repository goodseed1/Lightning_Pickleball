/**
 * 🏛️ PROJECT OLYMPUS - Honor System Phase 3
 * Season Trophy Awarder
 *
 * Awards various trophies to official rankers at season end:
 * 1. Season Champion (Gold/Silver/Bronze) - Top 3 in each LPR grade group
 * 2. Rank Up - Players who improved their LPR grade during the season
 * 3. Iron Man - Top 10% in matches played
 * 4. Ace - Top 5% win rate (among players with 10+ matches)
 */

import * as admin from 'firebase-admin';
import { convertEloToNtrp } from './rankingUtils.js';
import { sendSeasonTrophyNotification } from './notificationSender.js';

const db = admin.firestore();

/**
 * Interface for Official Ranker data (matches finalizeSeasonRankings.ts)
 */
export interface OfficialRanker {
  userId: string;
  eloRating: number;
  seasonMatchesPlayed: number;
  startingLtrGrade: string;
}

/**
 * Get grade group from LPR grade
 * Example: "4.5" → "4", "3.0" → "3"
 */
function getGradeGroup(ltrGrade: string): string {
  const grade = parseFloat(ltrGrade);
  return Math.floor(grade).toString();
}

/**
 * Award Season Champion trophies (top 3 in each grade group)
 */
async function awardSeasonChampionTrophies(
  seasonId: string,
  seasonName: string,
  officialRankers: OfficialRanker[]
): Promise<void> {
  console.log('🏆 [TROPHY] Awarding Season Champion trophies...');

  // Group rankers by their starting grade group
  const gradeGroups = new Map<string, OfficialRanker[]>();

  for (const ranker of officialRankers) {
    const gradeGroup = getGradeGroup(ranker.startingLtrGrade);
    if (!gradeGroups.has(gradeGroup)) {
      gradeGroups.set(gradeGroup, []);
    }
    gradeGroups.get(gradeGroup)!.push(ranker);
  }

  // Sort each group by ELO (highest first) and award top 3
  const batch = db.batch();
  let totalAwarded = 0;
  const notificationQueue: Array<{
    userId: string;
    trophyType: 'season_champion_gold' | 'season_champion_silver' | 'season_champion_bronze';
    metadata: Record<string, unknown>;
  }> = [];

  for (const [gradeGroup, rankers] of gradeGroups) {
    // Sort by ELO descending
    rankers.sort((a, b) => b.eloRating - a.eloRating);

    const totalInGroup = rankers.length;

    // Award top 3
    for (let i = 0; i < Math.min(3, rankers.length); i++) {
      const ranker = rankers[i];
      const rank = i + 1;

      let trophyType: 'season_champion_gold' | 'season_champion_silver' | 'season_champion_bronze';
      if (rank === 1) {
        trophyType = 'season_champion_gold';
      } else if (rank === 2) {
        trophyType = 'season_champion_silver';
      } else {
        trophyType = 'season_champion_bronze';
      }

      const trophyRef = db.collection('users').doc(ranker.userId).collection('hallOfFame').doc();

      batch.set(trophyRef, {
        type: 'SEASON_TROPHY',
        trophyType,
        seasonId,
        seasonName,
        gradeGroup,
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          rank,
          totalInGroup,
        },
      });

      // Queue notification to send after batch commit
      notificationQueue.push({
        userId: ranker.userId,
        trophyType,
        metadata: {
          rank,
          totalInGroup,
          gradeGroup,
        },
      });

      totalAwarded++;
      console.log(
        `   🥇 Champion ${rank}/${totalInGroup} in grade ${gradeGroup}: user ${ranker.userId}`
      );
    }
  }

  await batch.commit();
  console.log(`✅ [TROPHY] Awarded ${totalAwarded} Season Champion trophies`);

  // Send push notifications and home feed notifications
  console.log(`📤 [TROPHY] Sending ${notificationQueue.length} Season Champion notifications...`);
  for (const notification of notificationQueue) {
    await sendSeasonTrophyNotification(notification.userId, {
      trophyType: notification.trophyType,
      seasonId,
      seasonName,
      metadata: notification.metadata,
    });
  }
}

/**
 * Award Rank Up trophies (players who improved their LPR grade)
 */
async function awardRankUpTrophies(
  seasonId: string,
  seasonName: string,
  officialRankers: OfficialRanker[]
): Promise<void> {
  console.log('🚀 [TROPHY] Awarding Rank Up trophies...');

  const batch = db.batch();
  let totalAwarded = 0;
  const notificationQueue: Array<{
    userId: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (const ranker of officialRankers) {
    const currentGrade = String(convertEloToNtrp(ranker.eloRating)); // LPR is integer (1-10)
    const startingGrade = ranker.startingLtrGrade;

    // Check if grade improved (numerical comparison)
    const currentGradeNum = parseFloat(currentGrade);
    const startingGradeNum = parseFloat(startingGrade);

    if (currentGradeNum > startingGradeNum) {
      const trophyRef = db.collection('users').doc(ranker.userId).collection('hallOfFame').doc();

      batch.set(trophyRef, {
        type: 'SEASON_TROPHY',
        trophyType: 'rank_up',
        seasonId,
        seasonName,
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          previousGrade: startingGrade,
          newGrade: currentGrade,
        },
      });

      // Queue notification
      notificationQueue.push({
        userId: ranker.userId,
        metadata: {
          previousGrade: startingGrade,
          newGrade: currentGrade,
        },
      });

      totalAwarded++;
      console.log(`   ⬆️ Rank Up: user ${ranker.userId} (${startingGrade} → ${currentGrade})`);
    }
  }

  await batch.commit();
  console.log(`✅ [TROPHY] Awarded ${totalAwarded} Rank Up trophies`);

  // Send push notifications and home feed notifications
  console.log(`📤 [TROPHY] Sending ${notificationQueue.length} Rank Up notifications...`);
  for (const notification of notificationQueue) {
    await sendSeasonTrophyNotification(notification.userId, {
      trophyType: 'rank_up',
      seasonId,
      seasonName,
      metadata: notification.metadata,
    });
  }
}

/**
 * Award Iron Man trophies (top 10% in matches played)
 */
async function awardIronManTrophies(
  seasonId: string,
  seasonName: string,
  officialRankers: OfficialRanker[]
): Promise<void> {
  console.log('🔥 [TROPHY] Awarding Iron Man trophies...');

  // Sort by matches played (descending)
  const sortedByMatches = [...officialRankers].sort(
    (a, b) => b.seasonMatchesPlayed - a.seasonMatchesPlayed
  );

  // Top 10% (minimum 1 player)
  const top10Count = Math.max(1, Math.ceil(sortedByMatches.length * 0.1));

  const batch = db.batch();
  let totalAwarded = 0;
  const notificationQueue: Array<{
    userId: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < top10Count; i++) {
    const ranker = sortedByMatches[i];
    const trophyRef = db.collection('users').doc(ranker.userId).collection('hallOfFame').doc();

    batch.set(trophyRef, {
      type: 'SEASON_TROPHY',
      trophyType: 'iron_man',
      seasonId,
      seasonName,
      awardedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        matchesPlayed: ranker.seasonMatchesPlayed,
      },
    });

    // Queue notification
    notificationQueue.push({
      userId: ranker.userId,
      metadata: {
        matchesPlayed: ranker.seasonMatchesPlayed,
      },
    });

    totalAwarded++;
    console.log(`   💪 Iron Man: user ${ranker.userId} (${ranker.seasonMatchesPlayed} matches)`);
  }

  await batch.commit();
  console.log(`✅ [TROPHY] Awarded ${totalAwarded} Iron Man trophies (top 10%)`);

  // Send push notifications and home feed notifications
  console.log(`📤 [TROPHY] Sending ${notificationQueue.length} Iron Man notifications...`);
  for (const notification of notificationQueue) {
    await sendSeasonTrophyNotification(notification.userId, {
      trophyType: 'iron_man',
      seasonId,
      seasonName,
      metadata: notification.metadata,
    });
  }
}

/**
 * Award Ace trophies (top 5% win rate among players with 10+ matches)
 */
async function awardAceTrophies(
  seasonId: string,
  seasonName: string,
  officialRankers: OfficialRanker[]
): Promise<void> {
  console.log('⭐ [TROPHY] Awarding Ace trophies...');

  // Get win rates for all eligible players (10+ matches)
  const eligiblePlayers: Array<{
    userId: string;
    winRate: number;
    matchesPlayed: number;
  }> = [];

  for (const ranker of officialRankers) {
    if (ranker.seasonMatchesPlayed >= 10) {
      // Fetch user's win stats
      const userDoc = await db.collection('users').doc(ranker.userId).get();
      const userData = userDoc.data();

      if (userData?.stats) {
        const wins = userData.stats.seasonWins || 0;
        const losses = userData.stats.seasonLosses || 0;
        const totalMatches = wins + losses;

        if (totalMatches > 0) {
          const winRate = wins / totalMatches;
          eligiblePlayers.push({
            userId: ranker.userId,
            winRate,
            matchesPlayed: ranker.seasonMatchesPlayed,
          });
        }
      }
    }
  }

  if (eligiblePlayers.length === 0) {
    console.log('⚠️ [TROPHY] No eligible players for Ace trophy (10+ matches required)');
    return;
  }

  // Sort by win rate (descending)
  eligiblePlayers.sort((a, b) => b.winRate - a.winRate);

  // Top 5% (minimum 1 player)
  const top5Count = Math.max(1, Math.ceil(eligiblePlayers.length * 0.05));

  const batch = db.batch();
  let totalAwarded = 0;
  const notificationQueue: Array<{
    userId: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < top5Count; i++) {
    const player = eligiblePlayers[i];
    const trophyRef = db.collection('users').doc(player.userId).collection('hallOfFame').doc();

    batch.set(trophyRef, {
      type: 'SEASON_TROPHY',
      trophyType: 'ace',
      seasonId,
      seasonName,
      awardedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        winRate: player.winRate,
        matchesPlayed: player.matchesPlayed,
      },
    });

    // Queue notification
    notificationQueue.push({
      userId: player.userId,
      metadata: {
        winRate: player.winRate,
        matchesPlayed: player.matchesPlayed,
      },
    });

    totalAwarded++;
    console.log(
      `   ⭐ Ace: user ${player.userId} (${(player.winRate * 100).toFixed(1)}% win rate, ${player.matchesPlayed} matches)`
    );
  }

  await batch.commit();
  console.log(`✅ [TROPHY] Awarded ${totalAwarded} Ace trophies (top 5%)`);

  // Send push notifications and home feed notifications
  console.log(`📤 [TROPHY] Sending ${notificationQueue.length} Ace notifications...`);
  for (const notification of notificationQueue) {
    await sendSeasonTrophyNotification(notification.userId, {
      trophyType: 'ace',
      seasonId,
      seasonName,
      metadata: notification.metadata,
    });
  }
}

/**
 * Main function: Award all season trophies
 */
export async function awardSeasonTrophies(
  seasonId: string,
  seasonName: string,
  officialRankers: OfficialRanker[]
): Promise<void> {
  console.log(`🏛️ [TROPHY] Starting season trophy awards for ${seasonId} (${seasonName})...`);
  console.log(`   Total official rankers: ${officialRankers.length}`);

  if (officialRankers.length === 0) {
    console.log('⚠️ [TROPHY] No official rankers to award trophies');
    return;
  }

  try {
    // 1. Award Season Champion trophies (top 3 per grade group)
    await awardSeasonChampionTrophies(seasonId, seasonName, officialRankers);

    // 2. Award Rank Up trophies (grade improvement)
    await awardRankUpTrophies(seasonId, seasonName, officialRankers);

    // 3. Award Iron Man trophies (top 10% matches played)
    await awardIronManTrophies(seasonId, seasonName, officialRankers);

    // 4. Award Ace trophies (top 5% win rate with 10+ matches)
    await awardAceTrophies(seasonId, seasonName, officialRankers);

    console.log(`🎉 [TROPHY] All season trophies awarded successfully!`);
  } catch (error) {
    console.error('❌ [TROPHY] Error awarding season trophies:', error);
    throw error;
  }
}
