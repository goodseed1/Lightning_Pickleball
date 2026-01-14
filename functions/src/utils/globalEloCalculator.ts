/**
 * 🌍 [HEIMDALL] Global ELO Calculator
 *
 * Calculates and updates Global ELO ratings for public "번개 matches" (Lightning matches)
 *
 * Architecture: Same as Club ELO but simpler K-Factor logic
 * - No league/tournament distinction
 * - New players: K=32 (rapid level finding)
 * - Established players: K=16 (stable progression)
 *
 * Policy Version: v1.1 (2025-11-12)
 *
 * Related Documents:
 * - ECOSYSTEM_CHARTER.md (v1.1)
 * - 2025-11-12-Global-ELO-Implementation-Spec.md
 */

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { calculateNewElo } from './eloHelpers';

const db = admin.firestore();

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Match type for public matches
 * - singles: 단식
 * - doubles: 복식
 * - mixed_doubles: 혼합복식
 */
export type PublicMatchType = 'singles' | 'doubles' | 'mixed_doubles';

/**
 * Global match result data
 */
export interface GlobalMatchResult {
  matchId: string;
  matchType: PublicMatchType;
  date: FirebaseFirestore.Timestamp;

  // Player 1 (or Team 1 for doubles)
  player1Id: string;
  player1Name: string;
  player1PartnerId?: string;
  player1PartnerName?: string;

  // Player 2 (or Team 2 for doubles)
  player2Id: string;
  player2Name: string;
  player2PartnerId?: string;
  player2PartnerName?: string;

  // Result
  winnerId: string;
  score: string;

  // Metadata
  recordedBy: string;
}

/**
 * ELO update result
 */
export interface GlobalEloUpdateResult {
  success: boolean;
  player1EloChange: number;
  player2EloChange: number;
  player1NewElo: number;
  player2NewElo: number;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the ELO rating for a specific match type from user's publicStats
 *
 * @param userData - User document data
 * @param matchType - Match type (singles, doubles, mixed_doubles)
 * @returns Current ELO for the match type (default: 1200)
 */
export function getMatchTypeElo(
  userData: FirebaseFirestore.DocumentData,
  matchType: PublicMatchType
): number {
  const publicStats = userData.stats?.publicStats;
  if (!publicStats) {
    return 1200;
  }

  const typeStats = publicStats[matchType];
  if (!typeStats || typeof typeStats.elo !== 'number') {
    return 1200;
  }

  return typeStats.elo;
}

/**
 * Gets the match count for a specific match type from user's publicStats
 *
 * @param userData - User document data
 * @param matchType - Match type (singles, doubles, mixed_doubles)
 * @returns Match count for the match type
 */
export function getMatchTypeMatchCount(
  userData: FirebaseFirestore.DocumentData,
  matchType: PublicMatchType
): number {
  const publicStats = userData.stats?.publicStats;
  if (!publicStats) {
    return 0;
  }

  const typeStats = publicStats[matchType];
  if (!typeStats || typeof typeStats.matchesPlayed !== 'number') {
    return 0;
  }

  return typeStats.matchesPlayed;
}

// ============================================================================
// K-Factor Determination
// ============================================================================

/**
 * Determines K-Factor for global matches (per match type)
 *
 * K-Factor Policy (Simplified):
 * - New players (<10 matches in that type): K=32 (rapid level finding)
 * - Established players (>=10 matches in that type): K=16 (stable progression)
 *
 * @param matchTypeMatchCount - Matches played in this specific match type
 * @returns K-Factor value
 */
export function determineGlobalKFactor(matchTypeMatchCount: number): number {
  // New players: Higher K-Factor for rapid adjustment
  if (matchTypeMatchCount < 10) {
    return 32;
  }

  // Established players: Standard K-Factor
  return 16;
}

// ============================================================================
// Main Function: Calculate and Update Global ELO
// ============================================================================

/**
 * Calculates and updates Global ELO ratings for both players/teams
 * Records match history in each player's global_match_history subcollection
 *
 * @param matchResult - Match result data
 * @returns GlobalEloUpdateResult
 */
export async function calculateGlobalElo(
  matchResult: GlobalMatchResult
): Promise<GlobalEloUpdateResult> {
  try {
    logger.info('🌍 [GLOBAL ELO] Starting calculation', { matchId: matchResult.matchId });

    // ========================================================================
    // Step 1: Fetch Current Ratings
    // ========================================================================

    const player1Ref = db.collection('users').doc(matchResult.player1Id);
    const player2Ref = db.collection('users').doc(matchResult.player2Id);

    const [player1Doc, player2Doc] = await Promise.all([player1Ref.get(), player2Ref.get()]);

    if (!player1Doc.exists || !player2Doc.exists) {
      throw new Error('User document not found for one or both players');
    }

    const player1Data = player1Doc.data()!;
    const player2Data = player2Doc.data()!;

    // 🆕 경기 타입별 ELO 조회 (singles, doubles, mixed_doubles)
    const matchType = matchResult.matchType;
    const player1CurrentElo = getMatchTypeElo(player1Data, matchType);
    const player2CurrentElo = getMatchTypeElo(player2Data, matchType);

    logger.info('📊 [GLOBAL ELO] Current Ratings (by match type)', {
      matchType,
      player1: `${player1Data.displayName}: ${player1CurrentElo}`,
      player2: `${player2Data.displayName}: ${player2CurrentElo}`,
    });

    // ========================================================================
    // Step 2: Determine K-Factors (based on match type-specific match count)
    // ========================================================================

    // 🆕 경기 타입별 경기 수로 K-Factor 결정
    const player1TypeMatches = getMatchTypeMatchCount(player1Data, matchType);
    const player2TypeMatches = getMatchTypeMatchCount(player2Data, matchType);

    const player1KFactor = determineGlobalKFactor(player1TypeMatches);
    const player2KFactor = determineGlobalKFactor(player2TypeMatches);

    logger.info('🎯 [GLOBAL ELO] K-Factors determined (by match type)', {
      matchType,
      player1: `${player1Data.displayName} (K=${player1KFactor}, ${player1TypeMatches} ${matchType} matches)`,
      player2: `${player2Data.displayName} (K=${player2KFactor}, ${player2TypeMatches} ${matchType} matches)`,
    });

    // ========================================================================
    // Step 3: Calculate New Ratings
    // ========================================================================

    // Determine actual scores
    const player1ActualScore = matchResult.winnerId === matchResult.player1Id ? 1 : 0;
    const player2ActualScore = 1 - player1ActualScore;

    // Calculate new ELO for Player 1
    const player1Result = calculateNewElo(
      player1CurrentElo,
      player2CurrentElo,
      player1ActualScore,
      player1KFactor
    );

    // Calculate new ELO for Player 2
    const player2Result = calculateNewElo(
      player2CurrentElo,
      player1CurrentElo,
      player2ActualScore,
      player2KFactor
    );

    logger.info('✨ [GLOBAL ELO] New ratings calculated', {
      player1: `${player1CurrentElo} → ${player1Result.newRating} (${player1Result.eloChange >= 0 ? '+' : ''}${player1Result.eloChange})`,
      player2: `${player2CurrentElo} → ${player2Result.newRating} (${player2Result.eloChange >= 0 ? '+' : ''}${player2Result.eloChange})`,
    });

    // ========================================================================
    // Step 4: Update Firestore (Batch Write)
    // ========================================================================

    logger.info('💾 [GLOBAL ELO] Updating Firestore...');

    const batch = db.batch();

    // 🆕 경기 타입별 ELO 필드 경로 설정
    const eloFieldPath = `stats.publicStats.${matchType}.elo`;
    const matchesPlayedPath = `stats.publicStats.${matchType}.matchesPlayed`;
    const winsPath = `stats.publicStats.${matchType}.wins`;
    const lossesPath = `stats.publicStats.${matchType}.losses`;

    // Player 1 update data
    const player1IsWinner = matchResult.winnerId === matchResult.player1Id;
    const player1UpdateData: Record<string, FirebaseFirestore.FieldValue | number | string> = {
      // 🆕 경기 타입별 ELO 업데이트
      [eloFieldPath]: player1Result.newRating,
      [matchesPlayedPath]: admin.firestore.FieldValue.increment(1),
      // 하위 호환성: globalEloRating도 업데이트 (기존 코드 호환)
      globalEloRating: player1Result.newRating,
      globalEloRatingHistory: admin.firestore.FieldValue.arrayUnion(player1Result.newRating),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (player1IsWinner) {
      player1UpdateData[winsPath] = admin.firestore.FieldValue.increment(1);
    } else {
      player1UpdateData[lossesPath] = admin.firestore.FieldValue.increment(1);
    }

    // Player 2 update data
    const player2IsWinner = matchResult.winnerId === matchResult.player2Id;
    const player2UpdateData: Record<string, FirebaseFirestore.FieldValue | number | string> = {
      // 🆕 경기 타입별 ELO 업데이트
      [eloFieldPath]: player2Result.newRating,
      [matchesPlayedPath]: admin.firestore.FieldValue.increment(1),
      // 하위 호환성: globalEloRating도 업데이트 (기존 코드 호환)
      globalEloRating: player2Result.newRating,
      globalEloRatingHistory: admin.firestore.FieldValue.arrayUnion(player2Result.newRating),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (player2IsWinner) {
      player2UpdateData[winsPath] = admin.firestore.FieldValue.increment(1);
    } else {
      player2UpdateData[lossesPath] = admin.firestore.FieldValue.increment(1);
    }

    // Update Player 1 global ELO (경기 타입별 + 하위 호환성)
    batch.update(player1Ref, player1UpdateData);

    // Update Player 2 global ELO (경기 타입별 + 하위 호환성)
    batch.update(player2Ref, player2UpdateData);

    logger.info('📝 [GLOBAL ELO] Updated match type stats', {
      matchType,
      player1: {
        elo: player1Result.newRating,
        isWinner: player1IsWinner,
      },
      player2: {
        elo: player2Result.newRating,
        isWinner: player2IsWinner,
      },
    });

    // Record match history for Player 1
    const player1HistoryRef = db
      .collection('users')
      .doc(matchResult.player1Id)
      .collection('global_match_history')
      .doc(matchResult.matchId);

    batch.set(player1HistoryRef, {
      matchId: matchResult.matchId,
      matchType: matchResult.matchType,
      matchContext: 'public',
      date: matchResult.date,
      opponentId: matchResult.player2Id,
      opponentName: matchResult.player2Name,
      result: player1ActualScore === 1 ? 'win' : 'loss',
      score: matchResult.score,
      oldElo: player1CurrentElo,
      newElo: player1Result.newRating,
      eloChange: player1Result.eloChange,
      expectedScore: player1Result.expectedScore,
      kFactor: player1KFactor,
      recordedBy: matchResult.recordedBy,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record match history for Player 2
    const player2HistoryRef = db
      .collection('users')
      .doc(matchResult.player2Id)
      .collection('global_match_history')
      .doc(matchResult.matchId);

    batch.set(player2HistoryRef, {
      matchId: matchResult.matchId,
      matchType: matchResult.matchType,
      matchContext: 'public',
      date: matchResult.date,
      opponentId: matchResult.player1Id,
      opponentName: matchResult.player1Name,
      result: player2ActualScore === 1 ? 'win' : 'loss',
      score: matchResult.score,
      oldElo: player2CurrentElo,
      newElo: player2Result.newRating,
      eloChange: player2Result.eloChange,
      expectedScore: player2Result.expectedScore,
      kFactor: player2KFactor,
      recordedBy: matchResult.recordedBy,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Commit batch
    await batch.commit();

    logger.info('✅ [GLOBAL ELO] Successfully updated ratings and history');

    // ========================================================================
    // Step 5: Return Result
    // ========================================================================

    return {
      success: true,
      player1EloChange: player1Result.eloChange,
      player2EloChange: player2Result.eloChange,
      player1NewElo: player1Result.newRating,
      player2NewElo: player2Result.newRating,
    };
  } catch (error) {
    logger.error('❌ [GLOBAL ELO] Failed to calculate ELO', {
      matchId: matchResult.matchId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      player1EloChange: 0,
      player2EloChange: 0,
      player1NewElo: 0,
      player2NewElo: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
