/**
 * 🛡️ [CAPTAIN AMERICA] Match Utilities
 *
 * LPR validation and extraction utilities for match creation
 *
 * @author Captain America
 * @date 2025-11-27
 * @updated 2025-12-30 - NTRP → LPR migration
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();

/**
 * User profile interface (subset of actual UserProfile)
 */
interface UserProfileSubset {
  uid: string;
  displayName?: string;
  skillLevel?: {
    selfAssessed?: string;
    calculated?: number;
  };
  stats?: {
    unifiedEloRating?: number;
    publicStats?: {
      singles?: { elo?: number; matchesPlayed?: number };
      doubles?: { elo?: number; matchesPlayed?: number };
      mixed_doubles?: { elo?: number; matchesPlayed?: number };
    };
  };
  // 🎯 [KIM FIX] Game-type specific ELO ratings
  eloRatings?: {
    singles?: { current?: number };
    doubles?: { current?: number };
    mixed?: { current?: number };
  };
  legacyStats?: {
    eloRating?: number;
  };
  // 🎯 [KIM FIX] Profile-based LPR level (from user profile screen)
  profile?: {
    ltrLevel?: string;
    ntrpLevel?: string; // Legacy field for backward compatibility
  };
}

/**
 * LPR validation result
 */
export interface LtrValidationResult {
  isValid: boolean;
  hostLtr: number;
  partnerLtr?: number;
  combinedLtr?: number;
  errors: string[];
}

/**
 * Extract user LPR from profile
 * 🎯 [KIM FIX] Now supports game-type-specific ELO ratings
 * Priority: game-type ELO → calculated → selfAssessed → unified ELO → legacy
 *
 * @param userProfile - User profile document
 * @param gameType - Game type for ELO selection (optional)
 * @returns LPR value (1 - 10 integer)
 */
export function extractUserLtr(userProfile: UserProfileSubset, gameType?: string): number {
  // 🎯 [KIM FIX v26] ELO 단일화: eloRatings를 Single Source of Truth로 사용
  // - publicStats.elo 참조 제거 (클라이언트와 일치)
  // - eloRatings.{singles|doubles|mixed}.current만 사용
  if (gameType) {
    let targetElo: number | null = null;

    if (gameType.includes('singles')) {
      // Singles → singles ELO
      targetElo = userProfile.eloRatings?.singles?.current || null;
    } else if (gameType === 'mixed_doubles') {
      // Mixed doubles → mixed ELO
      targetElo = userProfile.eloRatings?.mixed?.current || null;
    } else if (gameType.includes('doubles')) {
      // Doubles → doubles ELO
      targetElo = userProfile.eloRatings?.doubles?.current || null;
    }

    if (targetElo && targetElo > 0) {
      const ltr = calculateLtrFromElo(targetElo);
      logger.info('📊 [MATCH_UTILS] Using game-type specific ELO', {
        uid: userProfile.uid,
        gameType,
        elo: targetElo,
        ltr,
      });
      return ltr;
    }
  }

  // Priority 2: Profile-based LPR level (from user profile screen)
  // 🎯 [KIM FIX] Check profile.ltrLevel first - this is explicitly set by user
  if (userProfile.profile?.ltrLevel) {
    const ltr = parseLtrRange(userProfile.profile.ltrLevel);
    logger.info('📊 [MATCH_UTILS] Using profile.ltrLevel', {
      uid: userProfile.uid,
      profileLtrLevel: userProfile.profile.ltrLevel,
      parsed: ltr,
    });
    return ltr;
  }

  // Backward compatibility: Check legacy ntrpLevel
  if (userProfile.profile?.ntrpLevel) {
    const ltr = parseLtrRange(userProfile.profile.ntrpLevel);
    logger.info('📊 [MATCH_UTILS] Using legacy profile.ntrpLevel', {
      uid: userProfile.uid,
      profileNtrpLevel: userProfile.profile.ntrpLevel,
      parsed: ltr,
    });
    return ltr;
  }

  // Priority 3: Calculated LPR
  if (userProfile.skillLevel?.calculated) {
    logger.info('📊 [MATCH_UTILS] Using calculated LPR', {
      uid: userProfile.uid,
      ltr: userProfile.skillLevel.calculated,
    });
    return userProfile.skillLevel.calculated;
  }

  // Priority 4: Self-assessed LPR (parse range)
  if (userProfile.skillLevel?.selfAssessed) {
    const ltr = parseLtrRange(userProfile.skillLevel.selfAssessed);
    logger.info('📊 [MATCH_UTILS] Using self-assessed LPR', {
      uid: userProfile.uid,
      selfAssessed: userProfile.skillLevel.selfAssessed,
      parsed: ltr,
    });
    return ltr;
  }

  // Priority 5: Legacy ltrLevel/ntrpLevel field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyLevel = (userProfile as any).ltrLevel || (userProfile as any).ntrpLevel;
  if (legacyLevel) {
    const ltr = parseLtrRange(typeof legacyLevel === 'string' ? legacyLevel : String(legacyLevel));
    logger.info('📊 [MATCH_UTILS] Using legacy ltrLevel/ntrpLevel', {
      uid: userProfile.uid,
      legacyLevel,
      parsed: ltr,
    });
    return ltr;
  }

  // Priority 6: Convert from unified ELO rating (fallback)
  const eloRating = userProfile.stats?.unifiedEloRating || userProfile.legacyStats?.eloRating;
  if (eloRating) {
    const ltr = calculateLtrFromElo(eloRating);
    logger.info('📊 [MATCH_UTILS] Using unified ELO-converted LPR', {
      uid: userProfile.uid,
      elo: eloRating,
      ltr,
    });
    return ltr;
  }

  // Fallback: Default beginner LPR
  logger.warn('⚠️ [MATCH_UTILS] No LPR data found, using default', {
    uid: userProfile.uid,
    gameType,
  });
  return 5; // Default intermediate level (LPR 5)
}

/**
 * Parse LPR range string to numeric value
 * Examples: "3-5" → 4, "6" → 6
 *
 * @param range - LPR range string
 * @returns Average LPR value (rounded to integer)
 */
export function parseLtrRange(range: string): number {
  if (!range) return 5;

  // Handle single value (e.g., "6")
  if (!range.includes('-')) {
    const value = parseFloat(range);
    return isNaN(value) ? 5 : Math.round(value);
  }

  // Handle range (e.g., "3-5")
  const [min, max] = range.split('-').map(s => parseFloat(s.trim()));

  if (isNaN(min) || isNaN(max)) {
    logger.warn('⚠️ [MATCH_UTILS] Invalid LPR range format', { range });
    return 5;
  }

  // Return average of range (rounded to integer)
  return Math.round((min + max) / 2);
}

/**
 * 🎯 [KIM FIX] ELO to LPR conversion mapping table
 * ⚠️ MUST match client-side src/utils/eloUtils.ts for consistency!
 * LPR Scale: 1 (Bronze) → 10 (Legend)
 *
 * @updated 2025-12-31 - Synced with client-side table to fix combinedLtr mismatch
 */
const ELO_TO_LPR_MAP = [
  { minElo: 0, maxElo: 1000, ltr: 1 }, // Bronze
  { minElo: 1000, maxElo: 1100, ltr: 2 }, // Silver
  { minElo: 1100, maxElo: 1200, ltr: 3 }, // Gold I
  { minElo: 1200, maxElo: 1300, ltr: 4 }, // Gold II
  { minElo: 1300, maxElo: 1450, ltr: 5 }, // Platinum I  ← Fixed: was 1400
  { minElo: 1450, maxElo: 1600, ltr: 6 }, // Platinum II ← Fixed: was 1500
  { minElo: 1600, maxElo: 1800, ltr: 7 }, // Diamond     ← Fixed: was 1600-1700
  { minElo: 1800, maxElo: 2100, ltr: 8 }, // Master I    ← Fixed: was 1700-1800
  { minElo: 2100, maxElo: 2400, ltr: 9 }, // Master II   ← Fixed: was 1800+
  { minElo: 2400, maxElo: Infinity, ltr: 10 }, // Legend
];

/**
 * Calculate LPR from ELO rating
 * 🎯 [KIM FIX] Uses table-based conversion to match client-side logic
 *
 * @param elo - ELO rating (600-2000)
 * @returns LPR value (1-10 integer)
 */
export function calculateLtrFromElo(elo: number): number {
  for (const mapping of ELO_TO_LPR_MAP) {
    if (elo >= mapping.minElo && elo < mapping.maxElo) {
      return mapping.ltr;
    }
  }
  return 5; // Default fallback (Platinum I)
}

/**
 * Validate match LPR requirements
 * For singles: validates host LPR only
 * For doubles: validates host + partner combined LPR
 *
 * @param hostId - Host user ID
 * @param partnerId - Partner user ID (for doubles)
 * @param gameType - Game type (singles/doubles)
 * @param minLtr - Minimum LPR requirement
 * @param maxLtr - Maximum LPR requirement
 * @returns Validation result with LPR values and errors
 */
export async function validateMatchLtr(
  hostId: string,
  partnerId: string | undefined,
  gameType: string,
  minLtr: number,
  maxLtr: number
): Promise<LtrValidationResult> {
  const errors: string[] = [];

  try {
    // Fetch host profile
    const hostDoc = await db.collection('users').doc(hostId).get();
    if (!hostDoc.exists) {
      errors.push('호스트 프로필을 찾을 수 없습니다.');
      return { isValid: false, hostLtr: 0, errors };
    }

    const hostProfile = hostDoc.data() as UserProfileSubset;
    // 🎯 [KIM FIX] Pass gameType to extractUserLtr for game-type-specific ELO
    const hostLtr = extractUserLtr(hostProfile, gameType);

    // Singles match: validate host LPR only
    if (gameType.includes('singles')) {
      logger.info('🎾 [MATCH_UTILS] Validating singles match LPR', {
        hostId,
        hostLtr,
        minLtr,
        maxLtr,
      });

      if (hostLtr < minLtr || hostLtr > maxLtr) {
        errors.push(`단식 경기: 호스트 LPR ${hostLtr}이(가) 범위 ${minLtr}-${maxLtr} 밖입니다.`);
      }

      // 💥 [OPERATION AUTOMATED FAIRNESS] Anti-sandbagging validation 💥
      // Client-sent minLtr must not be lower than host LPR
      if (minLtr < hostLtr - 1) {
        errors.push(
          `양학 방지: 매치 레벨(${minLtr})이 본인 실력(${hostLtr})보다 낮게 설정되었습니다.`
        );
      }

      return {
        isValid: errors.length === 0,
        hostLtr,
        errors,
      };
    }

    // Doubles match: validate host + partner combined LPR
    if (!partnerId) {
      errors.push('복식 경기는 파트너가 필요합니다.');
      return { isValid: false, hostLtr, errors };
    }

    const partnerDoc = await db.collection('users').doc(partnerId).get();
    if (!partnerDoc.exists) {
      errors.push('파트너 프로필을 찾을 수 없습니다.');
      return { isValid: false, hostLtr, errors };
    }

    const partnerProfile = partnerDoc.data() as UserProfileSubset;
    // 🎯 [KIM FIX] Pass gameType to extractUserLtr for game-type-specific ELO
    const partnerLtr = extractUserLtr(partnerProfile, gameType);

    // Calculate combined LPR (sum)
    const combinedLtr = hostLtr + partnerLtr;

    // 🎯 [OPERATION AUTOMATED FAIRNESS] Exact sum match validation
    // Client auto-calculates: minLtr = maxLtr = (hostLtr + partnerLtr) / 2
    // Server verifies: minLtr * 2 ≈ actualCombinedLtr (within tolerance 1)

    const expectedSum = minLtr * 2; // Client's auto-calculated combined LPR
    const actualSum = combinedLtr; // Server's actual: hostLtr + partnerLtr
    const tolerance = 1; // Allow rounding errors (LPR is integer)

    logger.info('🎯 [AUTOMATED_FAIRNESS] Validating auto-calculated doubles LPR', {
      hostId,
      partnerId,
      hostLtr,
      partnerLtr,
      actualSum,
      expectedSum,
      minLtr,
      maxLtr,
      difference: Math.abs(expectedSum - actualSum),
    });

    // Validation: Exact match check (with tolerance)
    if (Math.abs(expectedSum - actualSum) > tolerance) {
      errors.push(
        `복식 경기: 자동 계산된 LPR 합산 ${expectedSum}이(가) 실제 팀 LPR ${actualSum} (${hostLtr} + ${partnerLtr})과 일치하지 않습니다. 차이: ${Math.abs(expectedSum - actualSum)}`
      );
    }

    // Anti-sandbagging check (backup, should never trigger with auto-calculation)
    if (expectedSum < actualSum - tolerance) {
      errors.push(
        `양학 방지: 매치 레벨(${expectedSum})이 팀 실력(${actualSum})보다 낮게 설정되었습니다.`
      );
    }

    return {
      isValid: errors.length === 0,
      hostLtr,
      partnerLtr,
      combinedLtr,
      errors,
    };
  } catch (error) {
    logger.error('❌ [MATCH_UTILS] LPR validation error', {
      hostId,
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
    errors.push('LPR 검증 중 오류가 발생했습니다.');
    return { isValid: false, hostLtr: 0, errors };
  }
}
