/**
 * 🌐 Public Match ELO Calculator
 *
 * Calculates and updates ELO ratings for public lightning matches
 * Separated by match type: singles, doubles, mixed_doubles
 *
 * K-Factor: 24 (same as club tournament - high impact)
 *
 * Related: submitPublicMatchResult.ts
 */

import * as admin from 'firebase-admin';
import { calculateNewElo } from './eloHelpers';
import { logger } from 'firebase-functions/v2';

// Type definitions
export type GameMatchType = 'singles' | 'doubles' | 'mixed_doubles';

export interface PublicMatchResult {
  matchId: string;
  matchType: GameMatchType;
  date: admin.firestore.Timestamp;

  // Player 1 (Host)
  player1Id: string;
  player1Name: string;
  player1PartnerId?: string;
  player1PartnerName?: string;

  // Player 2 (Opponent)
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

/**
 * Helper: Extract match type from gameType
 */
export function extractMatchType(gameType: string): GameMatchType {
  if (gameType.includes('singles')) return 'singles';
  if (gameType === 'mixed_doubles') return 'mixed_doubles';
  return 'doubles'; // mens_doubles, womens_doubles
}

/**
 * Main function: Calculate and update public match ELO
 */
export async function calculatePublicElo(matchResult: PublicMatchResult): Promise<EloUpdateResult> {
  const db = admin.firestore();

  try {
    logger.info('🌐 [PUBLIC_ELO] Calculating ELO for public match', {
      matchId: matchResult.matchId,
      matchType: matchResult.matchType,
      player1: matchResult.player1Name,
      player2: matchResult.player2Name,
    });

    // Step 1: Get current ELO ratings (match type specific!)
    const player1Ref = db.collection('users').doc(matchResult.player1Id);
    const player2Ref = db.collection('users').doc(matchResult.player2Id);

    // 🎯 [KIM FIX] Also fetch partner documents for doubles
    const partner1Ref = matchResult.player1PartnerId
      ? db.collection('users').doc(matchResult.player1PartnerId)
      : null;
    const partner2Ref = matchResult.player2PartnerId
      ? db.collection('users').doc(matchResult.player2PartnerId)
      : null;

    const fetchPromises: Promise<FirebaseFirestore.DocumentSnapshot>[] = [
      player1Ref.get(),
      player2Ref.get(),
    ];
    if (partner1Ref) fetchPromises.push(partner1Ref.get());
    if (partner2Ref) fetchPromises.push(partner2Ref.get());

    const docs = await Promise.all(fetchPromises);
    const [player1Doc, player2Doc] = docs;
    const partner1Doc = partner1Ref ? docs[2] : null;
    const partner2Doc = partner2Ref ? docs[partner1Ref ? 3 : 2] : null;

    if (!player1Doc.exists || !player2Doc.exists) {
      throw new Error('Player document not found');
    }

    const player1Data = player1Doc.data()!;
    const player2Data = player2Doc.data()!;
    const partner1Data = partner1Doc?.exists ? partner1Doc.data() : null;
    const partner2Data = partner2Doc?.exists ? partner2Doc.data() : null;

    // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 사용 (Single Source of Truth)
    // publicStats.elo는 더 이상 사용하지 않음 - 통계 데이터만 저장
    const getPlayerElo = (
      playerData: FirebaseFirestore.DocumentData,
      matchType: GameMatchType
    ): number => {
      // matchType 매핑: mixed_doubles → mixed (eloRatings 키)
      let eloRatingKey: string = matchType;
      if (matchType === 'mixed_doubles') {
        eloRatingKey = 'mixed';
      }

      // eloRatings에서 현재 ELO 조회 (유일한 소스!)
      const currentElo = playerData.eloRatings?.[eloRatingKey]?.current;
      if (currentElo && currentElo > 0) {
        return currentElo;
      }

      // Fallback: 레거시 구조 지원 (eloRatings.[type]이 숫자인 경우)
      const legacyElo = playerData.eloRatings?.[eloRatingKey];
      if (typeof legacyElo === 'number' && legacyElo > 0) {
        return legacyElo;
      }

      // 기본값
      return 1200;
    };

    const player1CurrentElo = getPlayerElo(player1Data, matchResult.matchType);
    const player2CurrentElo = getPlayerElo(player2Data, matchResult.matchType);

    // 🎯 [KIM FIX] Get partner ELO ratings (their own, not team leader's!)
    const partner1CurrentElo = partner1Data
      ? getPlayerElo(partner1Data, matchResult.matchType)
      : null;
    const partner2CurrentElo = partner2Data
      ? getPlayerElo(partner2Data, matchResult.matchType)
      : null;

    logger.info('📊 [PUBLIC_ELO] Current ELO ratings', {
      player1: player1CurrentElo,
      player2: player2CurrentElo,
      partner1: partner1CurrentElo,
      partner2: partner2CurrentElo,
      matchType: matchResult.matchType,
    });

    // Step 2: Calculate new ELO
    // K-Factor: 24 (same as club tournament - high impact for public matches)
    const kFactor = 24;

    const player1ActualScore = matchResult.winnerId === matchResult.player1Id ? 1 : 0;
    const player2ActualScore = 1 - player1ActualScore;

    // Team leaders ELO calculation
    const player1Result = calculateNewElo(
      player1CurrentElo,
      player2CurrentElo,
      player1ActualScore,
      kFactor
    );

    const player2Result = calculateNewElo(
      player2CurrentElo,
      player1CurrentElo,
      player2ActualScore,
      kFactor
    );

    // 🎯 [KIM FIX] Partners ELO calculation (using their own ELO, not team leader's!)
    // Partner 1 (on Team 1) plays against Team 2's average ELO
    const partner1Result =
      partner1CurrentElo !== null
        ? calculateNewElo(partner1CurrentElo, player2CurrentElo, player1ActualScore, kFactor)
        : null;

    // Partner 2 (on Team 2) plays against Team 1's average ELO
    const partner2Result =
      partner2CurrentElo !== null
        ? calculateNewElo(partner2CurrentElo, player1CurrentElo, player2ActualScore, kFactor)
        : null;

    logger.info('✨ [PUBLIC_ELO] ELO changes calculated', {
      player1Change: player1Result.eloChange,
      player2Change: player2Result.eloChange,
      player1NewElo: player1Result.newRating,
      player2NewElo: player2Result.newRating,
      partner1Change: partner1Result?.eloChange,
      partner2Change: partner2Result?.eloChange,
      partner1NewElo: partner1Result?.newRating,
      partner2NewElo: partner2Result?.newRating,
    });

    // Step 3: Update Firestore (match type specific path!)
    const batch = db.batch();

    // 🎯 [KIM FIX v21] eloRatings 키 매핑 (mixed_doubles → mixed)
    let eloRatingKey: string = matchResult.matchType;
    if (matchResult.matchType === 'mixed_doubles') {
      eloRatingKey = 'mixed';
    }

    // 🎯 [KIM FIX v25] ELO 단일화: eloRatings만 업데이트 (Single Source of Truth)
    // publicStats.elo는 더 이상 업데이트하지 않음 - 통계는 별도 관리
    // peak 업데이트도 추가
    const player1Peak = Math.max(
      player1Data.eloRatings?.[eloRatingKey]?.peak || 0,
      player1Result.newRating
    );
    const player2Peak = Math.max(
      player2Data.eloRatings?.[eloRatingKey]?.peak || 0,
      player2Result.newRating
    );

    batch.update(player1Ref, {
      [`eloRatings.${eloRatingKey}.current`]: player1Result.newRating,
      [`eloRatings.${eloRatingKey}.peak`]: player1Peak,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(player2Ref, {
      [`eloRatings.${eloRatingKey}.current`]: player2Result.newRating,
      [`eloRatings.${eloRatingKey}.peak`]: player2Peak,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🎯 [KIM FIX] Also update partner ELO ratings!
    let partner1Peak = 0;
    let partner2Peak = 0;

    if (partner1Ref && partner1Result && partner1Data) {
      partner1Peak = Math.max(
        partner1Data.eloRatings?.[eloRatingKey]?.peak || 0,
        partner1Result.newRating
      );
      batch.update(partner1Ref, {
        [`eloRatings.${eloRatingKey}.current`]: partner1Result.newRating,
        [`eloRatings.${eloRatingKey}.peak`]: partner1Peak,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (partner2Ref && partner2Result && partner2Data) {
      partner2Peak = Math.max(
        partner2Data.eloRatings?.[eloRatingKey]?.peak || 0,
        partner2Result.newRating
      );
      batch.update(partner2Ref, {
        [`eloRatings.${eloRatingKey}.current`]: partner2Result.newRating,
        [`eloRatings.${eloRatingKey}.peak`]: partner2Peak,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    logger.info('🎯 [PUBLIC_ELO] Updated eloRatings (Single Source of Truth)', {
      eloRatingKey,
      player1: { newElo: player1Result.newRating, peak: player1Peak },
      player2: { newElo: player2Result.newRating, peak: player2Peak },
      partner1: partner1Result ? { newElo: partner1Result.newRating, peak: partner1Peak } : null,
      partner2: partner2Result ? { newElo: partner2Result.newRating, peak: partner2Peak } : null,
    });

    // 🎯 [KIM FIX] Save ELO history to public_elo_history collection for EloTrendCard
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // 🎯 [KIM FIX] Get display names from user docs if not provided (prevent undefined)
    const player1DisplayName =
      matchResult.player1Name || player1Data.displayName || player1Data.nickname || 'Player 1';
    const player2DisplayName =
      matchResult.player2Name || player2Data.displayName || player2Data.nickname || 'Player 2';

    logger.info('📝 [PUBLIC_ELO] Saving history with names', {
      player1DisplayName,
      player2DisplayName,
      player1PartnerName: matchResult.player1PartnerName,
      player2PartnerName: matchResult.player2PartnerName,
    });

    // Player 1 history
    const player1HistoryRef = db.collection('public_elo_history').doc();
    batch.set(player1HistoryRef, {
      matchId: matchResult.matchId,
      userId: matchResult.player1Id,
      userName: player1DisplayName,
      matchType: matchResult.matchType,
      opponentId: matchResult.player2Id,
      opponentName: player2DisplayName,
      result: player1ActualScore === 1 ? 'win' : 'loss',
      score: matchResult.score,
      oldElo: player1CurrentElo,
      newElo: player1Result.newRating,
      eloChange: player1Result.eloChange,
      timestamp,
    });

    // Player 2 history
    const player2HistoryRef = db.collection('public_elo_history').doc();
    batch.set(player2HistoryRef, {
      matchId: matchResult.matchId,
      userId: matchResult.player2Id,
      userName: player2DisplayName,
      matchType: matchResult.matchType,
      opponentId: matchResult.player1Id,
      opponentName: player1DisplayName,
      result: player2ActualScore === 1 ? 'win' : 'loss',
      score: matchResult.score,
      oldElo: player2CurrentElo,
      newElo: player2Result.newRating,
      eloChange: player2Result.eloChange,
      timestamp,
    });

    // 🎯 [KIM FIX] For doubles, save partner history with THEIR OWN ELO (not team leader's!)
    if (matchResult.player1PartnerId && partner1Result && partner1CurrentElo !== null) {
      const partner1HistoryRef = db.collection('public_elo_history').doc();
      batch.set(partner1HistoryRef, {
        matchId: matchResult.matchId,
        userId: matchResult.player1PartnerId,
        userName: matchResult.player1PartnerName || 'Partner',
        matchType: matchResult.matchType,
        opponentId: matchResult.player2Id,
        opponentName: player2DisplayName,
        result: player1ActualScore === 1 ? 'win' : 'loss',
        score: matchResult.score,
        oldElo: partner1CurrentElo, // 🎯 Partner's own ELO!
        newElo: partner1Result.newRating, // 🎯 Partner's new ELO!
        eloChange: partner1Result.eloChange, // 🎯 Partner's ELO change!
        timestamp,
        isPartner: true,
        teamLeaderId: matchResult.player1Id,
      });
    }

    if (matchResult.player2PartnerId && partner2Result && partner2CurrentElo !== null) {
      const partner2HistoryRef = db.collection('public_elo_history').doc();
      batch.set(partner2HistoryRef, {
        matchId: matchResult.matchId,
        userId: matchResult.player2PartnerId,
        userName: matchResult.player2PartnerName || 'Partner',
        matchType: matchResult.matchType,
        opponentId: matchResult.player1Id,
        opponentName: player1DisplayName,
        result: player2ActualScore === 1 ? 'win' : 'loss',
        score: matchResult.score,
        oldElo: partner2CurrentElo, // 🎯 Partner's own ELO!
        newElo: partner2Result.newRating, // 🎯 Partner's new ELO!
        eloChange: partner2Result.eloChange, // 🎯 Partner's ELO change!
        timestamp,
        isPartner: true,
        teamLeaderId: matchResult.player2Id,
      });
    }

    await batch.commit();

    logger.info('✅ [PUBLIC_ELO] ELO ratings and history updated successfully', {
      player1History: player1HistoryRef.id,
      player2History: player2HistoryRef.id,
      hasPartner1: !!matchResult.player1PartnerId,
      hasPartner2: !!matchResult.player2PartnerId,
    });

    return {
      success: true,
      player1EloChange: player1Result.eloChange,
      player2EloChange: player2Result.eloChange,
      player1NewElo: player1Result.newRating,
      player2NewElo: player2Result.newRating,
    };
  } catch (error) {
    logger.error('❌ [PUBLIC_ELO] Error calculating ELO', {
      error: error instanceof Error ? error.message : String(error),
    });

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
