/**
 * 🌉 [HEIMDALL] Club ELO Calculator
 *
 * Implements the corrected K-Factor policy for Club ELO rating system
 *
 * Core Principle: High Risk, High Return
 * - Tournament matches: HIGHER K-Factor (24-32)
 * - League matches: LOWER K-Factor (16)
 *
 * Policy Version: v1.1 (2025-11-11)
 *
 * Related Documents:
 * - ECOSYSTEM_CHARTER.md (v1.1)
 * - 2025-11-11-Club-ELO-K-Factor-Policy.md
 * - 2025-11-11-Club-ELO-Implementation-Spec.md
 */

import * as admin from 'firebase-admin';
import { calculateNewElo } from './eloHelpers';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ClubMatchResult {
  matchId: string;
  clubId: string;
  matchType: 'singles' | 'doubles';
  matchContext: 'league' | 'tournament';
  tournamentId?: string;
  leagueId?: string;
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

export interface EloUpdateResult {
  success: boolean;
  player1EloChange: number;
  player2EloChange: number;
  player1NewElo: number;
  player2NewElo: number;
  error?: string;
}

// ============================================================================
// K-Factor Determination
// ============================================================================

/**
 * Determines K-Factor based on match context and player experience
 *
 * K-Factor Policy (High Risk, High Return):
 * - Club League: K=16 (steady progression)
 * - Club Tournament (new player): K=32 (rapid level finding)
 * - Club Tournament (established): K=24 (dramatic impact)
 *
 * @param clubMatches - Total club matches played by player
 * @param matchContext - 'league' or 'tournament'
 * @returns K-Factor value
 */
export function determineKFactor(
  clubMatches: number,
  matchContext: 'league' | 'tournament'
): number {
  if (matchContext === 'league') {
    // Club League: Standard K-Factor for consistent progression
    return 16;
  } else if (matchContext === 'tournament') {
    // Club Tournament: Higher K-Factor for dramatic impact
    // New players (<10 matches): Maximum volatility to find level quickly
    // Established players: Still significant tournament impact
    return clubMatches < 10 ? 32 : 24;
  }

  // Default fallback (should never reach)
  return 16;
}

// ============================================================================
// Main Function: Calculate and Update Club ELO
// ============================================================================

/**
 * Calculates and updates Club ELO ratings for both players/teams
 * Records match history in each player's club_match_history subcollection
 *
 * @param matchResult - Match result data
 * @returns EloUpdateResult
 */
export async function calculateClubElo(matchResult: ClubMatchResult): Promise<EloUpdateResult> {
  const db = admin.firestore();

  try {
    // ========================================================================
    // Step 1: Fetch Current Ratings
    // ========================================================================

    console.log('🌉 [HEIMDALL] Fetching club membership data...');

    const player1MembershipRef = db
      .collection('users')
      .doc(matchResult.player1Id)
      .collection('clubMemberships')
      .doc(matchResult.clubId);

    const player2MembershipRef = db
      .collection('users')
      .doc(matchResult.player2Id)
      .collection('clubMemberships')
      .doc(matchResult.clubId);

    const [player1Doc, player2Doc] = await Promise.all([
      player1MembershipRef.get(),
      player2MembershipRef.get(),
    ]);

    if (!player1Doc.exists || !player2Doc.exists) {
      const missingPlayer = !player1Doc.exists ? matchResult.player1Name : matchResult.player2Name;
      console.error(`❌ [HEIMDALL] Club membership not found for ${missingPlayer}`);
      throw new Error(`Club membership not found for ${missingPlayer}`);
    }

    const player1Data = player1Doc.data()!;
    const player2Data = player2Doc.data()!;

    const player1CurrentElo = player1Data.clubEloRating || 1200;
    const player2CurrentElo = player2Data.clubEloRating || 1200;

    console.log(
      `📊 [HEIMDALL] Current Ratings - ${matchResult.player1Name}: ${player1CurrentElo}, ${matchResult.player2Name}: ${player2CurrentElo}`
    );

    // ========================================================================
    // Step 2: Determine K-Factors
    // ========================================================================

    // Count total club matches (league + tournament)
    const player1TotalMatches =
      (player1Data.clubStats?.leagueStats?.totalMatches || 0) +
      (player1Data.clubStats?.tournamentStats?.totalMatches || 0);

    const player2TotalMatches =
      (player2Data.clubStats?.leagueStats?.totalMatches || 0) +
      (player2Data.clubStats?.tournamentStats?.totalMatches || 0);

    const player1KFactor = determineKFactor(player1TotalMatches, matchResult.matchContext);

    const player2KFactor = determineKFactor(player2TotalMatches, matchResult.matchContext);

    console.log(
      `🎯 [HEIMDALL] K-Factors - ${matchResult.player1Name}: K=${player1KFactor} (${player1TotalMatches} matches), ${matchResult.player2Name}: K=${player2KFactor} (${player2TotalMatches} matches)`
    );

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

    console.log(
      `✨ [HEIMDALL] ELO Changes - ${matchResult.player1Name}: ${player1Result.eloChange > 0 ? '+' : ''}${player1Result.eloChange}, ${matchResult.player2Name}: ${player2Result.eloChange > 0 ? '+' : ''}${player2Result.eloChange}`
    );

    // ========================================================================
    // Step 4: Update Firestore (Batch Write)
    // ========================================================================

    console.log('💾 [HEIMDALL] Updating Firestore...');

    const batch = db.batch();

    // Update Player 1 membership
    batch.update(player1MembershipRef, {
      clubEloRating: player1Result.newRating,
      clubEloRatingHistory: admin.firestore.FieldValue.arrayUnion(player1Result.newRating),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update Player 2 membership
    batch.update(player2MembershipRef, {
      clubEloRating: player2Result.newRating,
      clubEloRatingHistory: admin.firestore.FieldValue.arrayUnion(player2Result.newRating),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record match history for Player 1
    const player1HistoryRef = db
      .collection('users')
      .doc(matchResult.player1Id)
      .collection('club_match_history')
      .doc(matchResult.matchId);

    batch.set(player1HistoryRef, {
      matchId: matchResult.matchId,
      clubId: matchResult.clubId,
      clubName: player1Data.clubName,
      matchType: matchResult.matchType,
      matchContext: matchResult.matchContext,
      tournamentId: matchResult.tournamentId || null,
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
      .collection('club_match_history')
      .doc(matchResult.matchId);

    batch.set(player2HistoryRef, {
      matchId: matchResult.matchId,
      clubId: matchResult.clubId,
      clubName: player2Data.clubName,
      matchType: matchResult.matchType,
      matchContext: matchResult.matchContext,
      tournamentId: matchResult.tournamentId || null,
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

    console.log('✅ [HEIMDALL] Firestore updated successfully');

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
    console.error('❌ [HEIMDALL] Failed to calculate Club ELO:', error);

    return {
      success: false,
      player1EloChange: 0,
      player2EloChange: 0,
      player1NewElo: 0,
      player2NewElo: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
